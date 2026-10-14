# Public frontend

The `public/` directory contains the browser-facing assets used by the kiosk and web display. These static files are served by the server and are responsible for rendering the rotating artwork gallery.

## Contents

- `index.html` — main gallery page
- `main.js` — image loading, rotation, and metadata update logic
- `settings.html` and `settings.js` — UI for user settings and metadata adjustments
- `statistics/index.html` — landing page for the statistics area
- `statistics/scan-runs.html` and `statistics/scan-runs.js` — scanner run history dashboard
- `statistics/image-serves.html` and `statistics/image-serves.js` — image-serving summary dashboard
- `styles.css` — presentation styling shared by the static pages
- `assets/` — local image assets and browser references

## How it works

The frontend polls the server API for random images and displays them as a slideshow. It also updates the current metadata shown in the browser, such as artist, file name, rating, and dimensions.

The statistics area now has a small landing page at `/statistics` that links to dedicated dashboards for each operational domain. The scanner-run page is available at `/statistics/scan-runs` and fetches recent scanner run history from `/statistics/run_history`, while the image-serve dashboard lives at `/statistics/image-serves` and reads aggregate data from `/statistics/image_serves`.

This structure keeps the gallery experience clean while making it easier to expand the analytics surface over time. The image-serving summary reports total serves, SFW/NSFW splits, top files, and top artists, and the artist values are historical snapshots captured at serve time so they remain meaningful even if files are later removed from the live catalog.

The app expects the server to be running and reachable at the correct origin, usually via the same host and port combination used for the API endpoints.

## Development notes

Because these assets are static files, changes can usually be tested by editing the files directly and refreshing the page in a browser served by the backend.

After the server and database are up, open the browser on the host used by the server, typically the local project URL exposed by Docker or the local port `9000`.

## Related documentation

- [../README.md](../README.md) — project overview
- [../server/README.md](../server/README.md) — backend API the frontend consumes
- [../docs/README.md](../docs/README.md) — docs index
