## Why

The current statistics surface is a single dashboard for scanner runs, and it is becoming the wrong fit as more operational views are added. As image-serving analytics become available, keeping everything on one page will make the interface harder to scan and easier to misinterpret. A small landing page with dedicated subpages will keep the statistics area organized and scale better as more metrics are added later.

## What Changes

- Replace the single-page statistics flow with a dedicated statistics landing page.
- Add a route or page for scanner run history at `/statistics/scan-runs`.
- Add a route or page for image serve statistics at `/statistics/image-serves`.
- Provide simple navigation cards or buttons on the landing page to move between the dedicated statistics views.
- Keep the existing statistics entry experience discoverable without forcing every metric onto one dashboard.

## Capabilities

### New Capabilities
- `statistics-navigation`: provides a landing page and dedicated subpages for distinct statistics domains.

### Modified Capabilities
- None.

## Impact

- Browser routing and static page structure in `public/`
- Existing statistics page behavior and URL structure
- Frontend documentation in the public README
- Future statistics pages can be added as independent dashboards without growing into one monolithic screen
