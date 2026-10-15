## Context

The project already has statistics pages for scanner runs and recent image serves. Both are time-windowed views over historical data. The new work focuses on a different question: what does the current image catalog look like right now, based on the live `display_files` table?

The `display_files` table is a current snapshot of eligible images, keyed by path and carrying `artist` and `nsfw` values. Because `artist` is derived from the file path, the live-state analytics should treat artist composition as a catalog attribute rather than a historical fact.

## Goals / Non-Goals

**Goals:**
- Provide a current-state inventory summary for the display catalog.
- Show totals and proportions for SFW versus NSFW content.
- Show artist contribution to the inventory, including counts and percentage share.
- Surface a few high-level concentration metrics without adding heavy path-analysis logic.

**Non-Goals:**
- Historical analytics over time.
- Folder or collection-level breakdowns beneath artist.
- Long-tail artist analysis in the first release.
- Any schema change or migration for new reporting tables.

## Decisions

### Decision: use the live `display_files` table as the source of truth

The analytics are intentionally current-state metrics rather than a historical log. Using `display_files` keeps the data model simple and ensures the dashboard reflects the catalog as the scanner currently sees it.

**Alternatives considered:**
- Reusing historical serve logs: rejected because those are serving metrics, not catalog composition.
- Creating a separate analytics table: rejected for the first version because it adds storage and maintenance burden without necessary value for a current snapshot.

### Decision: expose aggregate SQL rather than precomputed tables

The metrics are read-only aggregates and can be derived directly from `display_files` with grouped queries. That keeps the implementation straightforward and makes the page immediately reflect changes in scan results.

**Alternatives considered:**
- Precomputing a summary table: rejected as premature complexity for a first-pass dashboard.
- Doing calculations only in the client: rejected because the API should remain authoritative and the DB can calculate counts and percentages more efficiently.

### Decision: keep the first version to artist-level metrics only

The first release intentionally focuses on totals, per-artist counts, and share of inventory. This avoids over-analyzing file paths while still giving a meaningful catalog overview.

**Alternatives considered:**
- Folder-level parsing and deeper path segmentation: deferred because it requires more brittle path logic and does not add enough value at this stage.
- Null/unknown artist checks: deferred because artist is path-derived and not expected to be null in this workflow.

### Decision: include detail metrics as summary values, not per-row drilldowns

Average, median, and concentration values are best displayed as high-level summary cards or footnotes rather than as separate heavy tables. This preserves readability without making the dashboard feel overwhelming.

**Alternatives considered:**
- Expanding the page with a second long-tail table: rejected to keep the first version focused.
- Making every metric a filterable table: rejected because the page is a snapshot dashboard, not a data-exploration tool.

## Risks / Trade-offs

- [Artist distribution can be highly skewed] → Mitigation: expose the top artists and a concentration/skew aggregate so operators can read the hotspot pattern immediately.
- [The stats are only as good as the scanner’s current inventory] → Mitigation: treat the page as a live catalog view, not a durable history; if the scanner is stale, the snapshot will reflect that.
- [Path-derived artist labels may be uneven in naming quality] → Mitigation: keep the scope to counts and share, not path-cleaning heuristics, for the initial release.

## Migration Plan

No database migration is needed for this change. The first version is read-only and uses the existing `display_files` table.

Rollback is straightforward: disable the new endpoint and hide the catalog snapshot dashboard while leaving the scanner and database untouched.

## Open Questions

None at this stage. The scope is deliberately limited to current inventory metrics and deferred path-analysis work is explicitly called out in the proposal.
