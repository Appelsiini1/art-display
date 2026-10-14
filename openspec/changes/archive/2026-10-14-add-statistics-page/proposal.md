## Why

The server now exposes historical scanner runs through a dedicated API, but there is still no browser page that turns that data into a usable operational view. A general statistics page would let operators review recent scan health, compare run outcomes over time, and provide a clean home for future metrics without forcing dashboard logic into the gallery view.

## What Changes

- Add a dedicated statistics page under the static frontend so historical scan data is visible in the browser.
- Provide a general-purpose summary layout with time-window controls, KPI cards, and a recent run history table.
- Keep the page extensible so additional metrics can be added later without redesigning the UI.
- Reuse the existing `/statistics/run_history` endpoint and treat the page as a read-only reporting surface.

## Capabilities

### New Capabilities
- `statistics/dashboard`: provide a general statistics dashboard for recent scan history and future operational summaries.

### Modified Capabilities
- None.

## Impact

- Frontend static assets in `public/` such as `statistics.html`, `statistics.js`, and related styling
- Browser-side data fetching from the server scan-history endpoint
- Future additions to operational metrics and charts without changing the gallery page behavior
- The existing server run-history endpoint remains the data source for the dashboard
