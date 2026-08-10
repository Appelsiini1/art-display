## MODIFIED Requirements

### Requirement: Tag extraction and IGNORE handling

The scanner SHALL parse `<rdf:li>` tags from XMP content and treat any file whose tag list contains a tag configured in `IGNORE_TAGS` as disqualified from display, purging any existing `display_files` row for that path while still caching the file's fingerprint so future scans skip it on the unchanged-metadata fast path.

#### Scenario: File contains an ignored tag

- **WHEN** the parsed tag list contains any tag present in the `IGNORE_TAGS` environment variable (comma-separated)
- **THEN** the scanner enqueues a delete of the `display_files` row keyed by the image path (XMP path with `.xmp` suffix removed), if one exists
- **AND** no `display_files` upsert occurs
- **AND** the `xmp_fingerprints` row IS upserted with the file's current `(size, mtimeMs, hash)` so subsequent scans hit the unchanged-metadata fast path and skip the file at zero I/O cost

#### Scenario: No IGNORE_TAGS configured

- **WHEN** the `IGNORE_TAGS` environment variable is unset
- **THEN** no file is treated as ignored on tag content grounds
