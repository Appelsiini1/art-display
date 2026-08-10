## Context

Both bugs live entirely inside `scanner/src/modules/xmpProcess.ts` `processOne`. The fixes are one line and three `await`s respectively; the design work is mostly about being explicit that these are the right one-line fixes and not accidentally regressing something else.

The reconciliation change already established the pattern that a walk error (including a surfaced flush error) skips the sweep. That gives us a safe target for the awaited-flush behavior: errors now flow to a place that knows what to do with them, instead of vanishing.

## Goals / Non-Goals

**Goals:**

- IGNORE-tagged files are read and parsed at most once per content change, not once per scan.
- Batch-write flush failures during a scan are observable — they abort the walk, skip reconciliation, and log.
- Preserve existing worker-pool concurrency and batching semantics.

**Non-Goals:**

- No refactor of the batch-writer pattern itself. `add()` remains the fire-triggers-flush primitive; we just await it consistently.
- No change to `fingerprintWriter.add()` semantics — it was already awaited.
- No change to the periodic-timer flush error handling (still logged, still non-fatal). Only `add()`-triggered and `close()`-triggered flushes surface.
- No fix for the hash-match-fast-path re-parse observation. SHA-256 collision probability makes that a design note, not a bug.
- No scan_runs history table, no soft-delete — same non-goals as the reconciliation change.

## Decisions

**Decision: In the IGNORE branch, upsert the fingerprint _after_ enqueueing the delete, then return.**
Rationale: Order matters for crash-consistency. If the process crashes after the fingerprint upsert but before the delete flushes, next scan will skip-fast on unchanged metadata and never re-purge the stale `display_files` row. Enqueueing the delete first ensures the delete is buffered (and will be flushed either at batch-size or `close()`) before the fingerprint is durably marked as "seen." This is a minor safety improvement; in practice the batched delete usually flushes long before the fingerprint would.
Alternatives: upsert fingerprint first (rejected, weakens crash consistency); introduce a transaction spanning both writes (rejected, over-engineered for the workload).

**Decision: `await` `displayFileBatchWriter.add()` and `displayFileDeleteWriter.add()` calls in `processOne`.**
Rationale: `add()` is `async` specifically because it may await a flush when the buffer fills. Fire-and-forget defeats that intent. Awaiting matches how `fingerprintWriter.add()` is already called and produces natural exception propagation to `processFilesConcurrently` → the reconciliation try/catch. This is a one-word change (`await`) at each call site.
Alternatives: track a shared "any flush errored" flag on each writer (rejected, more invasive and easier to forget to check); make `add()` synchronous by dropping the internal `await this.flush()` (rejected, changes writer semantics and could balloon buffer size under back-pressure).

**Decision: Do not touch periodic-timer flushes.**
Rationale: The timer's `.catch(err => logMessage(...))` intentionally isolates the timer from process-level rejections. That behavior stays. Only user-triggered flushes (via `add()`) and terminal flushes (via `close()`) surface. This is consistent with the reconciliation spec's language ("any batch-writer flush that fails during the scan") — timer flushes that fail are logged but do not "fail the scan."

## Risks / Trade-offs

**Risk**: Awaiting `.add()` slows down a worker while its batch flushes (roughly every 500 files per worker). → **Mitigation**: `CONCURRENCY` workers process independently; one worker awaiting a flush does not block others. Historical scan takes ~2 minutes for ~16.5k files; expected impact is single-digit seconds worst-case.

**Risk**: A batch flush error now aborts the walk, where previously it was silently swallowed. This is a behavior change: scans that used to "complete" (with lost writes) will now fail visibly. → **Mitigation**: this is the point. The reconciliation spec explicitly wants this. Documented in the proposal's "Behavior on flush error" note.

**Risk**: The IGNORE-branch fingerprint upsert introduces a case where an IGNORE file's fingerprint exists but its `display_files` row does not. If someone later removes the IGNORE tag but the file's content and mtime are unchanged from when it was IGNORE'd (unlikely, since removing the tag changes the XMP content, but possible), the file would be skipped on the fast path and never re-classified. → **Mitigation**: removing a tag from an XMP changes its content hash. Even if `mtime` were somehow preserved, the size change from removing a `<rdf:li>` element would break the fast path. In the pathological case where none of those change (deliberately preserved by an editor), the operator can re-trigger by touching the file. Acceptable.

**Risk**: Ordering dependency on `add-scanner-reconciliation`. → **Mitigation**: documented in the proposal. If reconciliation is not yet archived when this change is archived, the MODIFIED block will not match the baseline text and archive will fail loudly, prompting a rebase.

## Migration Plan

Same as reconciliation: rebuild scanner container, redeploy. No data migration. On the first scan after deploy:

- IGNORE-tagged files that had no fingerprint row now get one. They are skipped fast on all subsequent scans.
- Any latent batch-flush errors that were previously silent now become loud (aborted walk + skipped sweep + error log). If a deployment sees this, the operator now has a signal to investigate rather than a phantom "scan complete" with missing rows.

**Rollback**: revert the scanner container image. IGNORE fingerprint rows written by this version remain in the DB — they are harmless (the reverted code will just re-parse the files on the next scan, ignoring the cached fingerprint's implications). No cleanup required.

## Open Questions

None.
