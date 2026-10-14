## Context

The scanner writes one summary row per completed run into the existing `scan_runs` table. The server already owns the database connection layer and exposes various metadata and image endpoints, so the missing piece is a read-only API that exposes this persisted history for later frontend use.

## Goals / Non-Goals

**Goals:**
- Expose recent run history from `scan_runs` over a simple HTTP endpoint.
- Return data in a frontend-friendly JSON format with clear summary fields.
- Keep the API read-only and low-risk.

**Non-Goals:**
- Changing the scanner's persistence logic or counters.
- Adding any write or admin endpoints.
- Building frontend visualization in this change.

## Decisions

### Read-only endpoint on the server
The implementation will add a lightweight Express route that queries `scan_runs` and returns the rows in descending `started_at` order. This keeps the change isolated to the server layer and avoids broad changes to scanner logic.

### Minimal database helper
A dedicated query helper in `server/src/modules/database.ts` will fetch the most recent run summaries using a single `SELECT` with an optional limit. That keeps the route logic thin while preserving the repository's existing pattern for database access.

### Frontend-friendly payload shape
The endpoint will return a simple list of objects with the same fields already stored in `scan_runs`, such as `id`, `started_at`, `finished_at`, `duration_ms`, and the per-run counters (`scanned`, `processed`, `errors`, `nsfw_hits`, etc.). This makes the endpoint directly consumable by future frontend widgets.

### Time-window filtering instead of row limits
Because scanner runs are daily, a time-based window is a better fit than a row-count limit. The endpoint will support a query parameter such as `since` or `hours` so clients can request the last day, week, or month of run summaries without depending on an arbitrary number of rows per run cadence.

The default behavior should still return the most recent data in a bounded window, such as the last 30 days, while allowing callers to request a broader or narrower window as needed.

## Risks / Trade-offs

- [Large history sets can be expensive to serialize] → Use a default time window such as the last 30 days and allow clients to request a narrower or broader window as needed.
- [Client expectations may vary] → Keep the response schema aligned with the database columns to avoid additional transformation logic.
- [Database availability on startup] → The route should fail gracefully with a 500 response and logging if the DB is unavailable.

## Migration Plan

- No schema migration is needed because `scan_runs` already exists.
- The server route is additive and does not impact existing endpoints.
- If the route causes issues, it can be rolled back by removing the new endpoint and helper without changing the scanner schema.

## Open Questions

- None at this stage. The persistence model and route contract are already well-defined by the existing table schema and the frontend need described in the proposal.
