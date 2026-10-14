## Purpose

This capability makes the scanner's per-run summaries available to the application over HTTP so the frontend can surface recent scan activity and operational history without reading the database directly.

## ADDED Requirements

### Requirement: Server exposes recent scan history
The server SHALL provide a read-only endpoint that returns scan-run summaries from the `scan_runs` table within a configurable time window in a predictable JSON structure.

#### Scenario: Returning the latest run summaries
- **WHEN** a client requests `/statistics/run_history?since=<timestamp>` or `/statistics/run_history?hours=<n>`
- **THEN** the server reads rows from `scan_runs` whose `started_at` falls within the requested window, ordered by newest run first
- **AND** the response includes each run's identifiers, timestamps, duration, and summary counters
- **AND** the response is encoded as JSON for frontend consumption

#### Scenario: Empty history for the selected window
- **WHEN** the `scan_runs` table contains no rows in the requested time range
- **THEN** the server responds with an empty array
- **AND** it returns an HTTP 200 status

#### Scenario: Read failure
- **WHEN** the database query for run history fails
- **THEN** the server responds with an HTTP 500 status
- **AND** it logs the error for investigation

### Requirement: Response payload is frontend-friendly
The response payload SHALL contain the summary fields needed to render recent scan history without requiring additional server lookups.

#### Scenario: Structured summary output
- **WHEN** the server returns run history
- **THEN** each item includes the run identifier, start time, finish time, duration, and all scanner counters tracked in `scan_runs`
- **AND** the data is shaped consistently for client-side rendering

### Requirement: Endpoint is read-only
The run history endpoint SHALL be a read-only API and SHALL NOT mutate any scanner state or persisted scan data.

#### Scenario: Safe read request
- **WHEN** a client calls the run history endpoint with a valid GET request
- **THEN** the server returns historical values without changing database contents
- **AND** no scanner run is started, stopped, or reset as a side effect
