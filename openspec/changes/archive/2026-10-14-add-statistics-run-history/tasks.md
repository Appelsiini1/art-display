## Tasks

- [x] Inspect the existing `scan_runs` schema and current server database patterns to confirm the response fields and ordering.
- [x] Add a database helper to fetch recent scan-run summaries, ordered by newest first and filtered by a configurable time window.
- [x] Implement a GET route at `/statistics/run_history` in the server that accepts a time-based history query and returns the summary records as JSON.
- [x] Add validation, status handling, and error logging for empty results, invalid time windows, and database failures.
- [x] Verify the endpoint returns the expected payload shape and that no scanner behavior changes were introduced.
