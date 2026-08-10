# scanner Specification

## Purpose

TBD - created by archiving change baseline-scanner. Update Purpose after archive.

## Requirements

### Requirement: Startup readiness gate

The scanner SHALL require a scan directory to be configured before it starts, and it SHALL wait for the server API to report database readiness before performing any scan work.

#### Scenario: Missing scan directory

- **WHEN** the scanner process starts and the `SCANDIR` environment variable is unset or empty
- **THEN** the scanner logs an error and exits with a non-zero status without opening a database connection

#### Scenario: Waiting for the API

- **WHEN** the scanner starts with `SCANDIR` set
- **THEN** the scanner polls the server API's readiness endpoint every 500 ms
- **AND** it does not begin walking the filesystem until the endpoint reports ready
- **AND** if the endpoint does not become ready within 30 seconds, the scanner throws a timeout error

### Requirement: Recursive XMP file walk

The scanner SHALL walk the configured scan directory recursively and yield only XMP sidecar files, skipping files and directories that match configured ignore patterns.

#### Scenario: Only XMP files are considered

- **WHEN** the walker encounters a directory entry
- **THEN** entries whose name does not end in `.xmp` (case-insensitive) are ignored
- **AND** subdirectories are descended into recursively

#### Scenario: PSD-derived sidecars are skipped

- **WHEN** the walker encounters an XMP file whose relative path matches `\.psd(\.|$)` (case-insensitive)
- **THEN** the file is skipped and not passed to the per-file processor

#### Scenario: Unreadable directory

- **WHEN** the walker cannot read a directory (e.g., permission denied)
- **THEN** a warning is logged and the walker continues with the remaining tree

### Requirement: Image extension eligibility

The scanner SHALL only process XMP files whose underlying image has a supported image extension.

#### Scenario: Supported image extension

- **WHEN** the per-file processor receives an XMP path whose basename (with the `.xmp` suffix removed) has an extension in `{.png, .jpg, .jpeg, .gif, .svg}` (case-insensitive)
- **THEN** the file continues through the pipeline

#### Scenario: Unsupported image extension

- **WHEN** the underlying image extension is not in the supported set (e.g., `.psd`, `.mp4`, or no extension)
- **THEN** the file is skipped without any database read or write

### Requirement: Change detection via fingerprint cache

The scanner SHALL cache each XMP file's `(size, mtime, content-hash)` fingerprint in the `xmp_fingerprints` table and use it to skip work on unchanged files.

#### Scenario: File unchanged since last scan

- **WHEN** the cached fingerprint's `size` and `mtimeMs` both match the file's current filesystem metadata
- **THEN** the file is skipped entirely: no content read, no hash computation, no database write

#### Scenario: Metadata changed but content unchanged

- **WHEN** the file's `size` or `mtimeMs` differs from the cache but its recomputed SHA-256 hash matches the cached hash
- **THEN** the fingerprint row is refreshed with the new metadata
- **AND** no re-parsing of tags or writes to `display_files` occur

#### Scenario: Content changed

- **WHEN** the recomputed hash differs from the cache (or no cache entry exists)
- **THEN** the file's content is read and passed to tag extraction
- **AND** on completion, the fingerprint row is upserted with the new `(size, mtimeMs, hash)`

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

### Requirement: Concurrent per-file processing

The scanner SHALL process files concurrently using a fixed-size worker pool sized by the `CONCURRENCY` environment variable (default 4).

#### Scenario: Configurable concurrency

- **WHEN** `CONCURRENCY` is set to a positive integer
- **THEN** that many worker coroutines pull XMP paths from the walker in parallel

#### Scenario: Default concurrency

- **WHEN** `CONCURRENCY` is unset or non-numeric
- **THEN** the pool size defaults to 4

### Requirement: Retryable filesystem errors

The scanner SHALL retry filesystem `stat` and `readFile` operations on transient errors with exponential backoff.

#### Scenario: Transient filesystem error

- **WHEN** a `stat` or `readFile` call fails with a retryable error code (`EBUSY`, `EAGAIN`, `EMFILE`, `ENFILE`, `ECONNRESET`, `EHOSTUNREACH`)
- **THEN** the operation is retried up to `RETRIES` times (default 2) with a delay of `RETRY_MS * 2^attempt` milliseconds (default base 250 ms) between attempts

#### Scenario: Non-retryable filesystem error

- **WHEN** a `stat` or `readFile` call fails with any other error code
- **THEN** no retry is attempted and the error is surfaced (logged and the file is skipped)

### Requirement: Batched database writes

The scanner SHALL buffer `xmp_fingerprints` and `display_files` writes and flush them in batches to reduce database round-trips.

#### Scenario: Flush on batch size

- **WHEN** either batch writer's buffer reaches 500 pending records
- **THEN** the writer flushes the buffer in a single `INSERT ... ON CONFLICT DO UPDATE` statement

#### Scenario: Flush on interval

- **WHEN** the periodic timer fires (every 2 seconds)
- **AND** the buffer is non-empty
- **THEN** the writer flushes the pending records

#### Scenario: Flush on scan completion

- **WHEN** a scan finishes processing all walked files
- **THEN** the fingerprint writer's remaining buffer is flushed before the scan is reported complete

### Requirement: Scan cadence and overlap prevention

The scanner SHALL run one scan at startup and repeat scans on a 24-hour interval, and SHALL prevent scans from overlapping.

#### Scenario: Initial scan at startup

- **WHEN** the scanner completes the startup readiness gate
- **THEN** it immediately begins the first scan

#### Scenario: Daily interval

- **WHEN** the previous scan completed and 24 hours (86,400,000 ms) have elapsed
- **THEN** the next scan begins

#### Scenario: Overlap prevention

- **WHEN** the interval timer fires while a scan is still running
- **THEN** the new invocation returns immediately without starting a second scan

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
