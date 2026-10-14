## Context

The app already follows a static-page model for the gallery and settings screens, and the server now exposes the `scan_runs` history needed for operational reporting. The missing piece is a browser page that organizes this data into a consistent statistics dashboard without tying it to the slideshow experience.

## Goals / Non-Goals

**Goals:**
- Provide a dedicated statistics page for recent scanner history.
- Use a time-window pattern that matches the daily scan cadence.
- Keep the layout extensible for future operational metrics.

**Non-Goals:**
- Replacing the gallery experience or integrating stats into the rotating display.
- Building a charting library or advanced analytics stack in this change.
- Adding any write operations to the server or database.

## Decisions

### Dedicated page rather than embedded widget
The statistics experience will live in a page-level view alongside the existing settings screen. This matches the existing static frontend pattern and keeps responsibilities clear: the gallery is for display, settings is for configuration, and statistics is for monitoring.

### Summary-first dashboard layout
The page will open with a small collection of KPI cards for recent run totals and health indicators, followed by a run-history table. This gives immediate operational context before the user drills into raw data and leaves room for future chart cards or additional metrics.

### Time-range filtering at the page layer
The page will support a small set of common ranges such as 24 hours, 7 days, and 30 days. Because scan runs are daily, the time-window pattern is easier for users to reason about than a row-limit field and makes the page future-proof for more metrics.

### Read-only data contract
The page will fetch from the server's `/statistics/run_history` endpoint and treat the server as the single source of truth. No direct database access or mutation is required in the browser.

## Risks / Trade-offs

- [Page can become too data-heavy] → Keep the first version focused on KPI cards and a concise recent table.
- [Date filtering may vary by browser locale] → Standardize on ISO timestamps and server-side time filtering.
- [Future metrics may need a richer charting layer] → Reserve a chart area in the layout now so later features can plug in without rewriting the shell.

## Migration Plan

- No backend schema migration is required because `scan_runs` already exists.
- The frontend page is additive and can be introduced without affecting the gallery or settings flows.
- If the page is not desired later, it can be removed independently of the server endpoint.

## Open Questions

- None at this stage. The interface is intentionally scoped as a general dashboard shell with room for future metrics, and the server API already provides the data needed to power it.
