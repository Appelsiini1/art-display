## Why

The application has rich per-run and serve-event analytics, but it does not yet expose a live snapshot of the current catalog in `display_files`. Operators need a fast view of how many images are currently eligible, how they are split between SFW and NSFW, and which artists dominate the current inventory. This change adds that baseline inventory view without conflating it with historical serving data.

## What Changes

- Add a current-state statistics capability for the live `display_files` table.
- Expose total file counts, artist counts, and SFW/NSFW composition for the current catalog snapshot.
- Report per-artist file counts and per-artist SFW/NSFW splits.
- Include percentage share of the total inventory by artist.
- Add summary metrics such as average and median files per artist, plus a concentration/skew indicator for the catalog distribution.
- Record deferred follow-on ideas in the design notes so the team can revisit them without losing the original intent.

## Capabilities

### New Capabilities
- `display-file-statistics`: current inventory summary and artist composition metrics derived from `display_files`

### Modified Capabilities
- None

## Impact

- `server`: adds a new statistics API endpoint and response model for current catalog inventory metrics.
- `public`: adds a dashboard view for the catalog snapshot, with totals and an artist breakdown table.
- `database`: no schema change required; the analytics are read from the existing `display_files` table.
- `documentation`: updates project-facing docs to describe the new catalog statistics dashboard and its current-snapshot scope, plus the deferred metrics that are intentionally out of scope for the first release.
- Deferred follow-up ideas remain intentionally out of scope for this first pass, including deeper folder analysis and artist-null handling checks (not applicable because artist is path-derived in this model).

### Deferred metrics tracked for future consideration

These metrics were discussed but intentionally excluded from the first version to keep the scope aligned with the current live-snapshot goal:

- deeper folder/collection breakdowns under each artist
- bottom-10 artist views or long-tail analysis
- missing-artist validation checks (not relevant because `artist` is derived from path and is never null in this workflow)
- richer path-derived segmentation beyond artist-level aggregation

This list is not a requirement for the initial release; it is a lightweight future backlog for the same statistics capability.
