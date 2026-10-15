## Context

The display-file dashboard already reads a live catalog summary from `display_files` and presents totals, SFW/NSFW counts, averages, medians, and a concentration ratio. The next change is a focused extension of that same live-snapshot model: identify the top 5 NSFW-heavy artists, the top 5 SFW-heavy artists, and quantify how concentrated the top artists are in the full catalogue.

The existing backend contract already centralizes the aggregate logic in the database module, so the least disruptive design is to extend that same query response rather than introduce a separate reporting table or a second endpoint.

## Goals / Non-Goals

**Goals:**
- Keep the catalog dashboard aligned with the live `display_files` snapshot.
- Add artist-dominance metrics that summarize the current inventory composition.
- Make the concentration ratio understandable when viewed by operators.
- Keep the page readable and avoid a second, deeper analytics layer.

**Non-Goals:**
- Historical time-window analytics for artist popularity.
- Folder or collection-level breakdown beyond artist-level aggregation.
- Long-tail artist analysis or bottom-10 reporting.
- Any database schema migration or precomputed summary table.

## Decisions

### Decision: extend the existing summary response instead of creating a separate endpoint

The current summary API already returns the catalog snapshot and the per-artist table. Extending that payload keeps the client and server contract simple and avoids another fetch path for the same live inventory data.

**Alternatives considered:**
- Creating a second summary endpoint: rejected because it duplicates the same inventory source and adds client complexity.
- Precomputing the result in a table: rejected as unnecessary overhead for a small set of summary calculations.

### Decision: compute dominance metrics from artist-level shares, not path heuristics

The SFW and NSFW dominance metrics should be derived from per-artist totals and their SFW/NSFW splits, with the page ranking the top 5 artists in each direction. This avoids brittle path parsing and keeps the logic consistent with the rest of the live statistics model.

**Alternatives considered:**
- Parsing subfolder names or collection metadata: rejected because those are not part of the current source-of-truth model and would add inconsistent semantics.
- Ranking by raw total files alone: rejected because the requested NSFW/SFW-heavy views need the rating split, not just file count.

### Decision: keep the top-10 share as a single summary ratio

A single “top 10 artists share” value is more readable than an expanded table in the same dashboard and matches the page’s summary-card style.

**Alternatives considered:**
- Showing the top 10 artists as a full table: rejected because the page already contains the top-artists table and the summary should remain concise.
- Showing a list of percentages for the top 10 artists: rejected as redundant with the existing per-artist table.

### Decision: add the concentration-ratio explanation as a tooltip, not a new metric row

The metric already exists and is valuable. The change is to clarify its meaning without cluttering the page with extra descriptive text.

**Alternatives considered:**
- Adding a verbose label beneath the metric: rejected because it makes the card visually heavy.
- Replacing the metric with a different ratio: rejected because the metric itself is already fixed and understood by the team.

## Risks / Trade-offs

- [Artist distribution may be very skewed] → Mitigation: keep the top-10 share and the concentration ratio together so the page still tells the story of imbalance.
- [SFW/NSFW dominance may be driven by a very small number of files] → Mitigation: compute both the artist and the split explicitly, and display the ratio values with clear labels.
- [Tooltip text may become stale if the metric definition changes] → Mitigation: keep the tooltip wording tied to the actual SQL formula used in the summary response.

## Migration Plan

No database migration is required. This is a read-only extension of the existing summary endpoint and the same dashboard page.

Rollback is straightforward: remove the new fields from the API response and hide the additional metric cards from the dashboard, leaving the base statistics page unchanged.

## Open Questions

None at this stage. The scope is explicitly limited to the locked-in follow-on metrics and tooltip improvement already agreed by the team.
