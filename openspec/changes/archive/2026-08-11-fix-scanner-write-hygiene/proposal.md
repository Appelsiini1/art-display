## Why

Two related bugs in the scanner's per-file write path were surfaced while archiving `baseline-scanner` and implementing `add-scanner-reconciliation`. Both cause silent correctness or efficiency loss.

1. **IGNORE-tagged files never cache a fingerprint.** When `containsIgnoreTags(tags)` is true, `processOne` returns early — after `add-scanner-reconciliation` also after enqueuing a `display_files` delete — but never upserts an `xmp_fingerprints` row. Every subsequent daily scan therefore re-reads and re-parses every IGNORE-tagged file, defeating the change-detection fast path for exactly the files the user has told the scanner to ignore.

2. **Fire-and-forget batch-writer `.add()` calls hide flush errors.** `processOne` calls `displayFileBatchWriter.add(df)` and (after reconciliation) `displayFileDeleteWriter.add(...)` without `await`. When a call trips the batch-size flush internally, the resulting `writeBatch` failure becomes an unhandled promise rejection instead of surfacing to the worker. This makes the `add-scanner-reconciliation` spec's promise ("any batch-writer flush that fails during the scan → sweep skipped") partially false in practice: batch-triggered flush failures never reach the reconciliation guard.

## What Changes

- **IGNORE branch upserts fingerprint.** In `processOne`, the `containsIgnoreTags` branch now upserts the `xmp_fingerprints` row (after enqueuing the `display_files` delete and before returning). The next scan will hit the unchanged-metadata fast path and skip the file at zero I/O cost.
- **All batch writer `.add()` calls are awaited.** `processOne` awaits `displayFileBatchWriter.add()` and `displayFileDeleteWriter.add()`, matching the existing pattern used for `fingerprintWriter.add()`. Flush failures now propagate up through `processFilesConcurrently` and flip the reconciliation loop's `sweepAllowed` flag as intended.
- No schema changes. No new env vars. No new dependencies.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scanner`: modifies the IGNORE handling scenario in `Tag extraction and IGNORE handling` to require the fingerprint upsert. The batch-writer awaiting fix is a pure implementation correctness change — the reconciliation spec's "flush failures skip the sweep" scenario already describes the correct observable behavior, and this change makes the implementation match.

## Impact

- **Code**: `scanner/src/modules/xmpProcess.ts` only. Two branches touched.
- **APIs**: none.
- **Dependencies**: none.
- **Database**: no schema changes. Runtime: IGNORE files now write one small `xmp_fingerprints` row on first observation, then never again.
- **Performance**: after one daily scan cycle, IGNORE-tagged files stop being read and hashed — small win per file, meaningful in aggregate.
- **Behavior on flush error**: previously, a batch-size-triggered flush failure in `displayFileBatchWriter` or `displayFileDeleteWriter` was silently unhandled. Now it aborts the walk, causes reconciliation to skip that scan (per `add-scanner-reconciliation`'s spec), and gets logged.

## Ordering

This change assumes `add-scanner-reconciliation` archives first. The `Tag extraction and IGNORE handling` MODIFIED block below is written against the reconciliation-updated version of that requirement (the one that already documents the `display_files` purge). If reconciliation has not been archived when this change is archived, the delta will fail to apply and needs to be rebased.
