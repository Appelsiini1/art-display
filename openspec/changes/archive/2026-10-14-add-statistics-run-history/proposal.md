## Why

The scanner already persists per-run summaries in the `scan_runs` table, but the server does not yet offer a way for the frontend to consume that history. Without a dedicated API, the UI cannot show recent scans, counts, or operational trends from the stored run data.

## What Changes

- Add a new server capability to expose recent scanner run history from the database.
- Provide a stable JSON API for the frontend to retrieve historical scan summaries within a configurable time window.
- Keep the implementation scoped to read-only access of `scan_runs`; no scanner behavior changes are required.

## Capabilities

### New Capabilities
- `statistics/run-history`: expose historical scanner run summaries over a read-only API endpoint.

### Modified Capabilities
- None.

## Impact

- Server API surface in `server/src/index.ts`
- Database access helpers in `server/src/modules/database.ts`
- Future frontend consumers that need recent scan history and summary metrics
- Existing scanner behavior remains unchanged because the table is already written by the scan process
