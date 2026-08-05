## MODIFIED Requirements

### Requirement: Tag extraction and IGNORE handling

The scanner SHALL parse `<rdf:li>` tags from XMP content and treat any file whose tag list contains a tag configured in `IGNORE_TAGS` as disqualified from display, purging any existing `display_files` row for that path.

#### Scenario: File contains an ignored tag

- **WHEN** the parsed tag list contains any tag present in the `IGNORE_TAGS` environment variable (comma-separated)
- **THEN** the scanner enqueues a delete of the `display_files` row keyed by the image path (XMP path with `.xmp` suffix removed), if one exists
- **AND** no `display_files` upsert occurs
- **AND** the `xmp_fingerprints` row is not upserted (unchanged from baseline)

#### Scenario: No IGNORE_TAGS configured

- **WHEN** the `IGNORE_TAGS` environment variable is unset
- **THEN** no file is treated as ignored on tag content grounds

### Requirement: Classification and display_files upsert

The scanner SHALL upsert a row into `display_files` for each XMP file whose tag list contains `SFW` or `NSFW`, keyed by the image path (the XMP path with the `.xmp` suffix removed). When a walked file's tag list matches neither `SFW` nor `NSFW`, the scanner SHALL delete any existing `display_files` row for that path so a file that has lost eligibility no longer appears in the database.

#### Scenario: File contains NSFW

- **WHEN** the parsed tag list contains `NSFW`
- **THEN** `display_files` is upserted with `nsfw = true`

#### Scenario: File contains SFW but not NSFW

- **WHEN** the parsed tag list contains `SFW` and does not contain `NSFW`
- **THEN** `display_files` is upserted with `nsfw = false`

#### Scenario: File matches neither SFW nor NSFW

- **WHEN** the parsed tag list contains neither `SFW` nor `NSFW` (and no IGNORE tag)
- **THEN** the scanner enqueues a delete of the `display_files` row keyed by the image path, if one exists
- **AND** the `xmp_fingerprints` row is still upserted so the file is skipped on subsequent scans

#### Scenario: Artist derivation from path

- **WHEN** the XMP file's path contains a segment `Artist Archive/<name>`
- **THEN** the upserted `display_files.artist` value is `<name>`
- **AND** when no such segment exists, `artist` is stored as `null`

#### Scenario: New display_files row gets a UUID

- **WHEN** a `display_files` row is inserted for a path not previously present
- **THEN** the row is assigned a freshly generated UUID via `gen_random_uuid()`

#### Scenario: Existing display_files row is updated

- **WHEN** a `display_files` upsert targets an existing path
- **THEN** the `artist` and `nsfw` columns are updated
- **AND** the `id` column is preserved

## ADDED Requirements

### Requirement: Stale row reconciliation

The scanner SHALL, after each successful walk, remove `xmp_fingerprints` and `display_files` rows whose XMP path was not observed during the walk, subject to a fractional safety guard.

#### Scenario: Clean walk with stale rows within threshold

- **WHEN** the walk completes without throwing
- **AND** the scanner computes the set of XMP paths visited during the walk
- **AND** the fraction `stale_count / total_fingerprints` is at or below the configured threshold
- **THEN** the scanner deletes from `xmp_fingerprints` every row whose `path` was not visited
- **AND** the scanner deletes from `display_files` every row whose path corresponds (image path derived from an unvisited XMP path) to an unvisited fingerprint
- **AND** the scanner logs the count of `xmp_fingerprints` and `display_files` rows removed

#### Scenario: Walk did not complete cleanly

- **WHEN** the walk throws an error, or any batch-writer flush fails during the scan
- **THEN** the reconciliation sweep does NOT run
- **AND** the scanner logs that the sweep was skipped due to an unclean walk
- **AND** the scanner remains alive and the daily interval timer continues normally

#### Scenario: Sweep exceeds the safety threshold

- **WHEN** the fraction `stale_count / total_fingerprints` exceeds the configured threshold (default 0.20)
- **AND** `RECONCILE_FORCE` is not set to `1`
- **THEN** the reconciliation sweep does NOT delete any rows
- **AND** the scanner logs a warning stating the observed fraction, the threshold, and instructions to set `RECONCILE_FORCE=1` to bypass on the next run
- **AND** the scanner remains alive and the daily interval timer continues normally

#### Scenario: Reconciliation runs to completion before scan is reported complete

- **WHEN** a scan reaches the reconciliation phase
- **THEN** the phase completes (whether it swept or was skipped by a guard) before the enclosing `running` scan flag is cleared
- **AND** the daily interval timer's overlap prevention therefore covers reconciliation as well as the walk

### Requirement: Reconciliation configuration

The scanner SHALL expose two environment variables that control the reconciliation safety guard.

#### Scenario: Default guard threshold

- **WHEN** `RECONCILE_MAX_STALE_FRACTION` is unset or not a number in the range `(0, 1]`
- **THEN** the guard threshold defaults to `0.20`

#### Scenario: Configured guard threshold

- **WHEN** `RECONCILE_MAX_STALE_FRACTION` is set to a number `x` in the range `(0, 1]`
- **THEN** the guard threshold is `x` for that process lifetime

#### Scenario: Force flag bypasses the guard

- **WHEN** `RECONCILE_FORCE` is set to the literal string `1`
- **THEN** the sweep proceeds regardless of the observed stale fraction
- **AND** the scanner logs an INFO message noting that the guard was bypassed and reporting the observed fraction

#### Scenario: Force flag is not sticky

- **WHEN** the scanner process restarts without `RECONCILE_FORCE` set
- **THEN** the guard is active again with the configured (or default) threshold
