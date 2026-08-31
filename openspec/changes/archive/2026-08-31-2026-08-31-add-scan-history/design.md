Design: in-process per-run metrics singleton

Overview
--------
Implement a small `metrics` module that lives in-process for the duration of the scan run. Because the scanner is single-process, we avoid cross-process synchronization complexity. The module will collect counters in plain JS numbers and write a single DB row when the run completes.

Module API (suggested)
----------------------
- `startRun(metadata?: Record<string, any>): string` — initialize counters, record `started_at`, return a `runId` (uuid string generated in-process).
- `inc(key: string, delta = 1): void` — increment an in-memory counter for `key`.
- `getCounters(): Record<string, number>` — snapshot of counters.
- `finishAndPersist(dbExecQuery: (q: any) => Promise<any>): Promise<void>` — compute `finished_at` and `duration_ms`, then `INSERT` a single `scan_runs` row using the provided DB helper.
- `reset(): void` — clear counters and metadata (used between runs if needed).

Implementation notes
--------------------
- Counters should be simple numbers on an object: `const counters: Record<string, number> = {}`. `inc()` should be synchronous and cheap.
- The module must be lightweight and avoid awaiting inside `inc()` so worker concurrency (promises) is fast.
- We'll call `finishAndPersist()` from the outer `runScan` flow after flushing other batch writers (consistent with `fingerprintWriter.close()` usage).
- Provide an option to include `metadata` (e.g. scanned directory, env flags) in the `metadata` JSONB column.

SQL example (insert at finish)
-----------------------------
INSERT INTO scan_runs (id, started_at, finished_at, scanned, processed, fingerprints_updated, display_inserted, display_deleted, errors, nsfw_hits, sfw_hits, duration_ms, metadata)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);

Where $1..$13 are the run UUID, started_at, finished_at and counters.

Where to hook
-------------
- `scanner/src/index.ts`: call `const runId = metrics.startRun({scanDir: dirArg})` before `processFilesConcurrently` and `await metrics.finishAndPersist(execQuery)` after batch writers are closed and before `reconcile(walked)` (or in finally). Reset at next run.
- `scanner/src/modules/xmpProcess.ts` / `processOne`: call `metrics.inc('scanned')` when a file is examined, `metrics.inc('processed')` on success, `metrics.inc('errors')` on error, and `metrics.inc('fingerprints_updated', n)` where appropriate.

Testing & validation
--------------------
- Unit test `metrics` to ensure counters increment and `finishAndPersist` calls DB with expected params (use a stubbed `dbExecQuery`).

Fallbacks / future improvements
------------------------------
- If multiple scanner processes are later required, switch to DB-updates at runtime or Redis for cross-process atomic increments.
- Optionally add an append-only `scan_events` table for finer-grained auditing.
