# Public frontend

The `public/` directory contains the browser-facing assets used by the kiosk and web display. These static files are served by the server and are responsible for rendering the rotating artwork gallery.

## Contents

- `index.html` — main gallery page
- `main.js` — image loading, rotation, and metadata update logic
- `settings.html` and `settings.js` — UI for user settings and metadata adjustments
- `styles.css` — presentation styling
- `assets/` — local image assets and browser references

## How it works

The frontend polls the server API for random images and displays them as a slideshow. It also updates the current metadata shown in the browser, such as artist, file name, rating, and dimensions.

The app expects the server to be running and reachable at the correct origin, usually via the same host and port combination used for the API endpoints.

## Development notes

Because these assets are static files, changes can usually be tested by editing the files directly and refreshing the page in a browser served by the backend.

After the server and database are up, open the browser on the host used by the server, typically the local project URL exposed by Docker or the local port `9000`.

## Related documentation

- [../README.md](../README.md) — project overview
- [../server/README.md](../server/README.md) — backend API the frontend consumes
- [../docs/README.md](../docs/README.md) — docs index
