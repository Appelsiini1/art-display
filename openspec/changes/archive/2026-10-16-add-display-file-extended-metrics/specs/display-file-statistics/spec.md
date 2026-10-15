# display-file-statistics Specification

## Purpose

This capability extends the current live-catalog summary for `display_files` with artist-dominance metrics and clearer interpretation of the concentration ratio. These metrics remain current-snapshot analytics and do not replace historical serve or scan-run reporting.

## Requirements

### Requirement: Top 5 NSFW-heavy artists summary

The system SHALL identify the top 5 artists by relative NSFW share within the current `display_files` snapshot and expose those results in the summary payload.

#### Scenario: Several artists contribute to NSFW inventory

- **WHEN** the catalog contains multiple artists with different NSFW counts
- **THEN** the summary includes the top 5 artists ranked by NSFW-heavy share
- **AND** each entry includes the artist name, total files, SFW count, NSFW count, and NSFW share percentage

### Requirement: Top 5 SFW-heavy artists summary

The system SHALL identify the top 5 artists by relative SFW share within the current `display_files` snapshot and expose those results in the summary payload.

#### Scenario: Several artists contribute to SFW inventory

- **WHEN** the catalog contains multiple artists with different SFW counts
- **THEN** the summary includes the top 5 artists ranked by SFW-heavy share
- **AND** each entry includes the artist name, total files, SFW count, NSFW count, and SFW share percentage

### Requirement: Top-10 artist share summary

The system SHALL calculate the share of the total catalog represented by the top 10 artists by file count and expose that value as a percentage.

#### Scenario: Concentrated catalogue

- **WHEN** the top 10 artists account for a meaningful share of the total catalogue
- **THEN** the summary includes the percentage of the full inventory represented by those artists
- **AND** the value is derived from the current `display_files` table, not from historical server logs

### Requirement: Concentration ratio explanation

The statistics page SHALL include a tooltip on the concentration-ratio card that explains what the metric measures in plain language.

#### Scenario: User inspects the concentration ratio

- **WHEN** the user hovers over or focuses the concentration-ratio card
- **THEN** a tooltip explains that the metric compares the largest artist's file count to the average files-per-artist in the current catalog
- **AND** the tooltip helps interpret the value without adding another dense metric card
