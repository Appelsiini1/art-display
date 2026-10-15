## Purpose

This capability provides a current inventory snapshot of the display catalog so operators can see how many files are in the system, how they are split by SFW and NSFW, and how the inventory is distributed across artists.

## ADDED Requirements

### Requirement: Current inventory totals
The system SHALL compute the current number of eligible display files and the total number of distinct artists in the `display_files` table.

#### Scenario: Catalog totals are calculated
- **WHEN** the statistics endpoint loads the current dataset
- **THEN** it returns the total number of files in `display_files`
- **AND** it returns the total number of distinct artists represented in the catalog

### Requirement: Rating split for the current catalog
The system SHALL report the number and percentage of current display files tagged as SFW and NSFW.

#### Scenario: SFW/NSFW breakdown is provided
- **WHEN** the current catalog is summarized
- **THEN** the response includes the raw counts for SFW and NSFW files
- **AND** the response includes the percentage share of each rating in the total inventory

### Requirement: Per-artist inventory breakdown
The system SHALL group the current catalog by `artist` and report each artist's total file count along with its SFW and NSFW counts.

#### Scenario: Artist totals are reported
- **WHEN** the statistics query aggregates by artist
- **THEN** each artist is returned with its file count, SFW count, and NSFW count
- **AND** the results are ordered by total file count descending for easy prioritization

### Requirement: Artist share of total inventory
The system SHALL calculate each artist's percentage share of the total current catalog size.

#### Scenario: Artist share is calculated
- **WHEN** the per-artist results are built
- **THEN** each row includes the artist's share of the full catalog as a percentage
- **AND** the percentage is derived from the current `display_files` snapshot, not historical data

### Requirement: Summary metrics for artist concentration
The system SHALL include high-level concentration metrics for the current artist distribution, including average files per artist, median files per artist, and a skew/concentration summary.

#### Scenario: Distribution summary is produced
- **WHEN** the artist distribution is evaluated
- **THEN** the response includes the average and median number of files per artist
- **AND** it includes a concentration indicator showing how uneven the distribution is across artists

### Requirement: Deferred metrics are documented as future work
The system SHALL keep a clear record of deferred inventory-statistics ideas that were explicitly not included in the first version of the current-snapshot dashboard.

#### Scenario: Future ideas remain visible without expanding scope
- **WHEN** the statistics capability is planned or reviewed
- **THEN** deferred items such as deeper folder analysis and long-tail artist views are recorded as future work
- **AND** they are not treated as required behavior for the initial release
