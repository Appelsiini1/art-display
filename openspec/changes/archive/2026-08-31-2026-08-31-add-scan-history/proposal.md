Add scan history (per-run summaries)

Summary
-------
Add a simple per-run scan history to the scanner: each completed scan run writes a single summary row to the DB. This enables historical graphs, basic troubleshooting, and retention policies.

Motivation
----------
- Counters don't need to survive restarts during a run, but we want a durable per-run record for historical analysis.
- Only one scanner process runs at a time, so a single in-process metrics singleton is sufficient and simple.

Scope
-----
- Add DB schema for `scan_runs` (single-row-per-run summary).
- Add a `metrics` module that exposes `startRun()`, `inc()`, `finishAndPersist()` and `reset()`.
- Wire `startRun()` at the beginning of `runScan` and `finishAndPersist()` on successful or finished runs in `index.ts`.
- Instrument `processOne` (or other hot paths) to call `metrics.inc(...)` for counters.

Success criteria
----------------
- Each run inserts exactly one row into `scan_runs` with accurate counters and timestamps.
- The change should be low-risk and introduce no per-file DB writes.
- Existing behavior (fingerprint batching, reconcile) remains unchanged.

Constraints & assumptions
-----------------------
- Single scanner process at a time.
- Counters are aggregated in-process and written once at run end.
- PostgreSQL is available and `gen_random_uuid()` is supported (pgcrypto or pg extension available).

Schema (example)
-----------------
-- Run summary row (per-run)
CREATE TABLE IF NOT EXISTS scan_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  scanned bigint NOT NULL DEFAULT 0,
  processed bigint NOT NULL DEFAULT 0,
  fingerprints_updated bigint NOT NULL DEFAULT 0,
  display_inserted bigint NOT NULL DEFAULT 0,
  display_deleted bigint NOT NULL DEFAULT 0,
  errors bigint NOT NULL DEFAULT 0,
  nsfw_hits bigint NOT NULL DEFAULT 0,
  sfw_hits bigint NOT NULL DEFAULT 0,
  duration_ms bigint,
  metadata jsonb
);

Write semantics
---------------
- `metrics.finishAndPersist()` computes `duration_ms` and performs a single `INSERT` into `scan_runs` with all counters and optional metadata collected during the run.

Related files
-------------
- `scanner/src/index.ts` — start/stop hooks around `runScan`
- `scanner/src/modules/xmpProcess.ts` / `processOne` — call `metrics.inc(...)`
- `scanner/src/modules/db.ts` — no change required unless DB helpers are preferred
