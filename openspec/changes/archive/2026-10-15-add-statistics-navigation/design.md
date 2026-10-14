## Context

See proposal.md for the motivation. The current statistics experience is a single static page and has grown beyond a single dataset category; the app is now reaching the point where separate operational domains need distinct pages without losing a simple entry point.

## Goals / Non-Goals

**Goals:**
- Add a small statistics landing page that is easier to expand over time.
- Move scanner-run history to a dedicated subpage.
- Add a dedicated image-serve statistics subpage.
- Keep navigation easy and consistent across the statistics area.

**Non-Goals:**
- Rebuilding the entire frontend routing system
- Adding a full framework or complex SPA shell
- Merging all stats back into one monolithic page

## Decisions

### Decision: Use a landing page plus dedicated subpages instead of one giant statistics dashboard

The statistics area is already separating into operational domains. A landing page acts as a clean entry point and reduces the cognitive load of a single overloaded screen.

**Why this is preferred:**
- It is simple to implement within the existing static page model.
- It keeps subpages focused and reduces visual clutter.
- It matches the pattern of adding future statistics domains without redesigning the whole area.

**Alternatives considered:**
- Keeping everything on one dashboard: easier in the short term, but it scales poorly as the project adds more metrics.
- Adding a full client-side router: unnecessary complexity for a small static app.

### Decision: Keep the existing URL shape as a collection page and split by domain

The design keeps `/statistics` as the entry page and uses `/statistics/scan-runs` and `/statistics/image-serves` for the actual charts and summaries. This preserves discoverability without losing compatibility with the earlier structure.

**Why this is preferred:**
- It gives a clear conceptual boundary between navigation and data-specific views.
- It is compatible with the current static server setup and simple page organization.
- It makes future additions straightforward.

### Decision: Use consistent navigation affordances on each page

Each statistics page should include a simple route back to the landing page and links to the other statistics domains.

**Why this is preferred:**
- It avoids dead ends in the dashboard flow.
- It keeps the experience coherent even as more pages are added.

## Risks / Trade-offs

- [Navigation complexity] → A few extra pages add a bit of maintenance. Mitigation: keep the pages thin and static, with shared styling and repeated layout patterns.
- [Route discovery] → Users may not know where to find the stats pages without a visible entry. Mitigation: keep the landing page obvious and linked from the current UI.

## Migration Plan

1. Add the statistics landing page and wire in the page links.
2. Rename or duplicate the current scan-run page under `/statistics/scan-runs`.
3. Add the image-serve page under `/statistics/image-serves`.
4. Ensure each page includes consistent navigation back to the landing page.
5. Update the public README to describe the new structure.

## Open Questions

- None at this time; the separation is straightforward and matches the existing static frontend model.
