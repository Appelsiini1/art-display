## Why

The project is adopting OpenSpec for spec-driven change tracking, but `openspec/specs/` is currently empty. Future changes to the scanner (starting with reconciliation of stale/disqualified rows) need an existing baseline to delta from — otherwise every change proposal would have to redocument existing behavior alongside its actual delta. This change captures the scanner's current, deployed behavior as-is so subsequent changes can propose focused modifications against a known truth.

## What Changes

- Document current scanner behavior in a new `scanner` capability spec.
- No code changes. No configuration changes. No dependency changes.
- Establishes capability boundary: the scanner owns the filesystem walk, XMP parsing, tag classification, and writes to `xmp_fingerprints` and `display_files`.
- Baselines for the server API and client viewer are intentionally deferred until a change touches them.

## Capabilities

### New Capabilities

- `scanner`: Filesystem walker and XMP metadata processor. Watches a configured directory tree, parses XMP sidecar files for classification tags, and maintains the `display_files` and `xmp_fingerprints` tables that the server API reads from.

### Modified Capabilities

None. This is a baseline-only change.

## Impact

- **Code**: none.
- **APIs**: none.
- **Dependencies**: none.
- **Documentation**: adds `openspec/specs/scanner/spec.md` upon archive.
- **Follow-ups unblocked**: `add-scanner-reconciliation` (stale-row and tag-loss cleanup) can now be proposed as a clean delta.
