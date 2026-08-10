## Why

The scanner currently only ever adds or updates rows in `display_files` and `xmp_fingerprints` — it never removes them. This leaves stale data in the database in three situations:

1. An XMP sidecar file is deleted from disk → both table rows linger forever.
2. An XMP file is edited to remove the `SFW`/`NSFW` classification tags → the `display_files` row remains even though the file no longer qualifies for display.
3. An XMP file is edited to add an `IGNORE_TAGS` tag → the `display_files` row remains despite the tag meaning "do not consider for display".

The result is that the server API's `/img/random` endpoint can serve rows pointing to files that no longer exist or that the user has explicitly removed from consideration. This change adds a reconciliation pass so the scanner's daily run keeps the database consistent with the filesystem.

## What Changes

- **Immediate purge on disqualification**: when a walked file no longer qualifies for `display_files` (missing `SFW`/`NSFW`, or an `IGNORE_TAGS` tag is present), any existing `display_files` row for that path is deleted in the same pass.
- **End-of-scan reconciliation sweep**: after a clean walk, the scanner computes the set of paths that existed on disk during this scan, diffs it against the `xmp_fingerprints` table, and hard-deletes stale rows from both `xmp_fingerprints` and `display_files`.
- **Sweep safety guard**: the sweep is skipped (with a loud log) if the walk did not complete cleanly or if it would remove more than a configurable fraction of `xmp_fingerprints` rows (default 20%). Guard trips do not exit the process; the next daily run tries again.
- **Env override**: a new `RECONCILE_FORCE=1` environment variable bypasses the fractional guard for intentional large migrations.
- No schema changes. No new tables. No soft-delete column.

## Capabilities

### New Capabilities

None. Reconciliation is a behavior extension of the existing scanner capability.

### Modified Capabilities

- `scanner`: adds a reconciliation phase to the scan cadence; modifies the IGNORE-handling and no-match scenarios to purge existing `display_files` rows instead of silently leaving them; documents the new safety guard and override.

## Impact

- **Code**: `scanner/src/index.ts` (scan loop wraps a reconciliation phase), `scanner/src/modules/xmpProcess.ts` (per-file purge on disqualification), `scanner/src/modules/db.ts` (new delete/select helpers and an optional `DisplayFileDeleteWriter`), `scanner/src/modules/util.ts` (env parsing for the guard threshold and force flag).
- **APIs**: none. Server API endpoints and client behavior are unchanged.
- **Dependencies**: none.
- **Database**: no migrations. Same tables, same columns.
- **Runtime**: one additional `SELECT path FROM xmp_fingerprints` per scan (~16.5k rows today, small); two conditional `DELETE ... WHERE path = ANY(...)` statements when stale rows exist.
- **Observability**: new INFO log lines summarising each scan's reconciliation outcome (paths seen, stale count, deleted count, or guard-trip reason).
- **Out of scope**: server-side hardening for missing image files (separate follow-up change), and the two baseline gaps observed during `baseline-scanner` review (IGNORE-tagged files never caching a fingerprint; hash-match fast path skipping tag re-parse). Those are noted for future changes.
