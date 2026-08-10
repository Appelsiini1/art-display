## Context

The scanner's current baseline (see `openspec/specs/scanner/spec.md`) has no removal path. Rows only ever get added or updated. Over time this causes three concrete failure modes: deleted XMP files linger, tag-loss leaves `display_files` rows behind, and adding an `IGNORE_TAGS` tag to a previously-qualifying file has no effect on the database.

Library size at time of writing is ~16,500 XMP files and growing, running one full scan per 24 hours. The client viewer does not cache UUIDs — it always calls `/img/random` and follows up with the returned UUID — so hard-deleting rows has no client-visible consequence beyond the intended one.

## Goals / Non-Goals

**Goals:**

- The database converges to match the filesystem after each successful scan.
- Files that lose eligibility (tag removed, `IGNORE_TAGS` tag added) disappear from `display_files` on the same scan that observed the change, without waiting for a sweep.
- A failed or partial scan never triggers a destructive sweep.
- A catastrophic sweep (e.g., mount fell off, scan directory looks nearly empty) is refused by default and requires an explicit override to proceed.
- Guard trips are recoverable: they log and skip; they do not crash the scanner.
- Existing zero-write fast path for unchanged files is preserved.

**Non-Goals:**

- No soft-delete / tombstoning. Client does not cache UUIDs, so hard delete is safe.
- No `scan_runs` history table. Reconciliation outcome is logged; persisting run history is out of scope until a use case appears.
- No inotify / real-time filesystem event handling. Daily cadence is sufficient.
- No handling of file renames as first-class events. A rename is observed as "old path missing, new path new" and produces a fresh row with a new UUID. This is acceptable per client behavior.
- No fix for the two baseline gaps observed during `baseline-scanner` archive (IGNORE tags not caching fingerprints, hash-match fast path not re-parsing). Those get their own changes if pursued.
- No changes to the server API's behavior when a stored row references a missing file. Tracked as a separate follow-up.

## Decisions

**Decision: Full-diff sweep over mark-and-sweep with a `last_scan_id` column.**
Rationale: At ~16.5k XMPs (even projected 100k+), a `Set<string>` of walked paths costs negligible memory (~10 MB at 100k). Full-diff avoids adding a column and — crucially — does not require an extra DB write for every skipped-unchanged file, so the existing zero-write fast path is preserved. Mark-and-sweep would force a per-file `UPDATE` even for unchanged files.
Alternatives: mark-and-sweep (rejected, would defeat the fast path); tombstoning with `deleted_at` (rejected, client does not cache UUIDs so soft-delete adds cost without benefit).

**Decision: Combine immediate purge (per-file) with end-of-scan sweep.**
Rationale: The two mechanisms cover disjoint failure modes cleanly. Immediate purge handles tag-loss and IGNORE-added cases where the file is walked but no longer qualifies — the sweep cannot catch these because the file's fingerprint is still refreshed and its path is still "seen." End-of-scan sweep handles the "file gone from disk" case that the walker cannot even reach. Using only one mechanism leaves half the problem unsolved.
Alternatives: sweep only (rejected — tag-loss files stay); immediate purge only (rejected — deleted files stay).

**Decision: Hard delete, not soft delete.**
Rationale: Client does not cache UUIDs. There is no reversibility benefit that offsets the cost of adding `deleted_at` filtering to every server query.
Alternatives: soft-delete with `deleted_at` column (rejected, no reversibility use case).

**Decision: Fractional guard, default 20%, env-configurable, hard-fail by default with explicit override.**
Rationale: The most likely source of a catastrophic sweep is an operational mishap (bind mount detached, scan directory relocated). A percentage guard scales with library size. 20% is a compromise: high enough that legitimate small curation cleanups pass through, low enough that a mount detachment will trip it in nearly all cases (a typical scan touches nearly 100% of rows). Hard fail is safer than a warn-and-proceed default because the operator gets a chance to notice before rows disappear.
Alternatives: absolute threshold (rejected, doesn't scale); warn-only (rejected, silent risk); no guard (rejected, one bad mount ruins the DB).

**Decision: Guard trip skips the sweep but does not exit the process.**
Rationale: The daily scan loop should keep running so that transient issues self-heal on the next scan or after operator intervention. Crashing forces a manual restart with no additional safety benefit.
Alternatives: `process.exit(-1)` on guard trip (rejected, harmful).

**Decision: `RECONCILE_FORCE=1` env override for intentional large migrations.**
Rationale: When the operator deliberately relocates or prunes a large portion of the library, waiting for the guard to loosen or manually running SQL is worse than a documented escape hatch. The override is opt-in per process start so it cannot silently persist.
Alternatives: no override (rejected, forces manual SQL for planned changes); persistent config flag (rejected, easy to leave enabled by accident).

**Decision: One `SELECT path FROM xmp_fingerprints` per scan; deletes as `path = ANY($1::text[])` batches.**
Rationale: Single query for the diff input keeps it simple. Batched deletes match the existing writer pattern. If the stale set grows large (unusual), the array-parameter form still performs well; if it ever needs chunking, the change is localized.

**Decision: Reconciliation runs inside the same `running` guard that prevents overlapping scans.**
Rationale: Sweep is part of the scan, not a separate task. The existing overlap-prevention already covers it.

## Risks / Trade-offs

**Risk**: A legitimate large curation pass (e.g., operator removes 30% of the library) trips the guard and rows stay stale until override is set. → **Mitigation**: log message clearly states `RECONCILE_FORCE=1` bypass and the observed fraction; operator has one restart with the env set to complete the sweep.

**Risk**: The `Set<string>` of walked paths grows with library size and could eventually matter. → **Mitigation**: at projected 1M paths (60× current), the set is still <200 MB assuming average path length ~200 bytes. Non-issue in practice; if it ever became one, mark-and-sweep with a batched-update writer is the fallback.

**Risk**: A crash after immediate-purge writes but before end-of-scan flush leaves `display_files` inconsistent (row deleted, but scan didn't finish). → **Mitigation**: acceptable. The purge is correct in isolation (file has been observed to no longer qualify); the sweep skip on crash only affects the removal of not-observed rows, which are orthogonal.

**Risk**: Diff computation races with concurrent DB writes from the same scan. → **Mitigation**: read `xmp_fingerprints` paths _after_ all per-file processing and batch flushes have completed. This is a natural sequencing point since batch writers already have `close()` calls.

**Risk**: The 20% default threshold is arbitrary and might be wrong for some deployments. → **Mitigation**: `RECONCILE_MAX_STALE_FRACTION` env var overrides the default. Documented alongside `RECONCILE_FORCE`.

**Risk**: The immediate-purge writer adds a new failure mode where a `DELETE` batch flush error could crash the scan. → **Mitigation**: mirror the existing batch writer error handling — errors are logged, do not exit; sweep still runs if walk completed.

## Migration Plan

No migration. Deployment is atomic (rebuild scanner container, redeploy). On first run after deploy:

1. The scanner walks the tree as usual.
2. During processing, files that have lost eligibility get their `display_files` rows purged immediately.
3. After the walk completes cleanly, the sweep runs. If the fraction of stale `xmp_fingerprints` rows exceeds the threshold, the sweep is skipped and the operator sees a warning naming both the fraction and the override flag.
4. Subsequent scans continue normally with reconciliation in effect.

**Rollback**: revert the scanner container image. No schema was changed. Data already deleted stays deleted (files can be re-tagged and re-scanned to repopulate).

## Open Questions

None. All threads from the exploration phase are resolved:

- Hard delete confirmed (client behavior).
- Guard threshold defaults set at 20% with env override for tuning.
- Guard trip is non-fatal (log + skip + continue).
- Baseline gaps deferred to their own future changes.
