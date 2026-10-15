## Why

The current display-file dashboard already covers the catalog baseline, but it does not yet expose the artist-dominance signals that operators need when deciding whether the collection is balanced or concentrated. The team decided to keep the first pass lean, but the locked-in follow-on metrics are still valuable: which artist is most NSFW-heavy, which is most SFW-heavy, and how much of the total catalogue is represented by the top 10 artists. This change fills that gap without broadening the page into deeper path-analysis or long-tail reporting.

## What Changes

- Extend the live catalog summary response with the top 5 NSFW-heavy artists and top 5 SFW-heavy artists.
- Add the share of the top 10 artists against the full current catalogue.
- Add a tooltip on the concentration-ratio card to explain what the metric means in plain language.
- Keep the metrics tied to the current `display_files` snapshot so they remain consistent with the existing dashboard semantics.
- Preserve the current scope by not expanding into folder-level or long-tail artist analysis.

## Capabilities

### New Capabilities
- `display-file-statistics`: extends the current live inventory analytics with artist-dominance and concentration metrics derived from `display_files`

### Modified Capabilities
- None

## Impact

- `server`: adds the additional aggregate values to the current catalog summary API response.
- `public`: expands the display-file statistics page to render the new artist-dominance cards and an explanatory tooltip for the concentration ratio.
- `database`: no schema change is needed; the queries remain read-only observations over the existing `display_files` table.
- `documentation`: notes the new dashboard additions and keeps the scope boundaries explicit so the current-snapshot view stays distinct from historical analytics.
