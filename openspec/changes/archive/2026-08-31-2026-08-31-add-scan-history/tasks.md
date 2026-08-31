Implementation tasks for add-scan-history

1. [x] Add DB migration
   - Create SQL migration to add `scan_runs` table (see proposal.schema). Database schema should be added to `server/src/modules/database.ts` to remain consistent with other table initializations.

2. [x] Add `metrics` module
   - Create `scanner/src/modules/metrics.ts` implementing the API in design.md.
   - Export `startRun`, `inc`, `getCounters`, `finishAndPersist`, `reset`.

3. [x] Instrument scanner
   - Call `metrics.startRun()` at top of `runScan()` in `scanner/src/index.ts` and capture `runId`.
   - Ensure `metrics.finishAndPersist(execQuery)` is called after batch writers are closed and before reconcile, in `runScan()` finally block. Handle errors but don't crash the run if persist fails — log and continue.
   - Update `processOne` and/or `xmpProcess` to call `metrics.inc()` at the appropriate points.

4. [x] Tests
   - Unit test `metrics` with a stubbed DB executor.

5. [x] Documentation
   - Add short README note on `scan_runs` retention and how to query historical runs.

6. [x] Optional: add retention job or policy for `scan_runs` pruning.
