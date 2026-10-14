## Purpose

This capability gives the application a dedicated statistics dashboard so operators can inspect recent scanner performance, review execution history, and extend the page with additional metrics in the future.

## ADDED Requirements

### Requirement: Statistics page is available as a dedicated UI
The system SHALL provide a dedicated browser page for viewing scanner statistics and run history separate from the gallery view.

#### Scenario: Opening the statistics page
- **WHEN** a user navigates to the statistics page
- **THEN** the page renders a dedicated layout for summary metrics and recent run data
- **AND** the page loads without altering the gallery slideshow behavior

#### Scenario: Loading state
- **WHEN** the statistics page begins fetching data
- **THEN** the page shows a loading state instead of a blank or broken layout

#### Scenario: Empty history
- **WHEN** the selected time window contains no scanner runs
- **THEN** the page displays an empty-state message for that range
- **AND** it does not fail the page rendering

### Requirement: Time-based filtering is supported
The statistics interface SHALL allow the user to select a time window for the run history view.

#### Scenario: Selecting a recent window
- **WHEN** a user chooses a time range such as 24 hours, 7 days, or 30 days
- **THEN** the page requests run history for that time window from the server
- **AND** the displayed results reflect only that selected range

#### Scenario: Invalid or missing window
- **WHEN** no valid time range is selected
- **THEN** the page uses a sensible default window such as the last 30 days

### Requirement: Dashboard presents scan summary metrics
The statistics page SHALL summarize recent scanner runs using clear operational metrics derived from the run-history rows.

#### Scenario: Summary metrics are rendered
- **WHEN** the server returns scan summaries for the selected window
- **THEN** the page renders aggregate values such as total runs, success counts, error counts, and recent scan totals
- **AND** the summary values are displayed in a clear KPI-style layout

### Requirement: Recent runs remain inspectable
The statistics page SHALL present a table or list of recent scan runs with the key details needed for operational review.

#### Scenario: Recent run history table
- **WHEN** historical run data is available
- **THEN** the page includes each run's start time, end time, duration, and the counts tracked by the scan run summary
- **AND** the most recent runs appear first

### Requirement: Dashboard is extensible for future metrics
The statistics page SHALL be structured so that new metrics or charts can be added later without a redesign of the page shell.

#### Scenario: Future metric addition
- **WHEN** a new metric becomes available later
- **THEN** it can be added to the summary card area or chart region without replacing the general page layout
