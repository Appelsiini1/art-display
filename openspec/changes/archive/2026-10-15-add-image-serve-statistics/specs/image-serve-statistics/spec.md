## Purpose

This capability gives the application a durable record of random image serving activity so operators can review overall usage, identify the most frequently served files and artists, and understand the SFW/NSFW split over time.

## ADDED Requirements

### Requirement: Image serve events are recorded
The system SHALL record one serve event each time the random image endpoint successfully serves an image.

#### Scenario: Successful random image serve
- **WHEN** the client requests a random image and a valid image is returned
- **THEN** the system stores the serve event with the timestamp, file identity, file path, artist snapshot, and selected rating
- **AND** the event remains available for historical aggregation even if the underlying display row is later deleted

#### Scenario: Failed serve is not recorded
- **WHEN** no valid random image is available or the request fails before a file is served
- **THEN** the system does not create a serve-event record for that failed request

### Requirement: Event data captures the serve snapshot
The system SHALL preserve the serve-time metadata needed for future reporting without relying on the live display_files table for historical analysis.

#### Scenario: Artist snapshot is captured
- **WHEN** a random image is served
- **THEN** the system stores the artist value as it existed at that moment
- **AND** the event does not depend on later display_files state for artist reporting

#### Scenario: Rating snapshot is captured
- **WHEN** the request is served under the current rating mode
- **THEN** the system stores the rating value used for the request
- **AND** the analytics can report the SFW/NSFW split by time window

### Requirement: Serve metrics are aggregated by time window
The system SHALL support aggregated statistical queries over recent time windows for total serves, top files, top artists, and rating splits.

#### Scenario: Reporting recent usage
- **WHEN** an operator requests aggregated serve statistics for a time range
- **THEN** the system returns counts for total serves and the breakdown by rating
- **AND** it can also report the most served files and artists within that range

### Requirement: Percentage-based summaries are available
The system SHALL provide percentage-based summaries for rating distribution in the aggregated output.

#### Scenario: SFW vs NSFW percentage view
- **WHEN** statistics are requested for a time range
- **THEN** the system includes the percentage of serves that were SFW and the percentage that were NSFW
- **AND** the calculation is performed in the database query so the ratio is consistent across clients
