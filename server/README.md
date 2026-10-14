# Server

The server is the main API layer for art-display. It serves the browser UI, exposes metadata endpoints, manages image access checks, and reads from the PostgreSQL database that backs the gallery.

## Responsibilities

- Serve the static app from `public/` when running locally or in deployment.
- Expose REST endpoints for random image selection, metadata lookup, and configuration updates.
- Validate image paths before serving files to prevent unsafe access.
- Coordinate with the database schema used by the scanner and frontend.

## Runtime entry points

- `src/index.ts` — Express app, routes, and startup logic.
- `src/modules/database.ts` — database queries and writes.
- `src/modules/fileSecurity.ts` — file path security checks.
- `src/modules/util.ts` — helpers for file serving and logging.

## Local development

From the repository root:

```bash
docker-compose up --build
```

This brings up the project with the server container and related services. For direct local execution inside the service directory:

```bash
cd server
npm install
npm run build
npm run start
```

The server listens on port `9000` by default and serves app assets from the `public/` directory.

## Environment variables

The server uses the same stack-level environment configuration as the project. Common values include:

```env
POSTGRES_USER=
POSTGRES_PASSWORD=""
POSTGRES_DB=artdisplay

# Optional
IMG_API_URL=http://localhost:9000
```

## API notes

The server exposes endpoints for image retrieval, metadata management, and scanner statistics, including:

- `/api/status` — readiness endpoint
- `/api/img/random` — fetch a random display image
- `/api/img` — fetch a specific image by ID
- `/api/img/file` — serve the raw image file
- `/api/metadata/get` and `/api/metadata/get/all` — metadata read endpoints
- `/api/metadata` — metadata create/update endpoint
- `/statistics` — statistics landing page with links to domain-specific dashboards
- `/statistics/scan-runs` — scanner run history dashboard
- `/statistics/image-serves` — image serve analytics dashboard
- `/api/statistics/run_history` — return scanner run summaries from the `scan_runs` table
- `/api/statistics/image_serves` — return image serve aggregates from the `image_serve_events` table

### `/api/statistics/run_history`

Returns recent scanner run history as JSON. The endpoint is read-only and uses the `scan_runs` table persisted by the scanner.

Query parameters:

- `hours` — fetch rows from the last N hours (for example `?hours=24`)
- `since` — fetch rows from a specific ISO timestamp onward (for example `?since=2026-10-01T00:00:00Z`)

If no filter is supplied, the default window is the last 30 days. Results are ordered by newest run first.

### `/api/statistics/image_serves`

Returns aggregate image-serving analytics from the `image_serve_events` table. This table records each successful random-image serve and keeps a historical snapshot of the artist and rating at serve time.

Query parameters:

- `hours` — fetch summary data from the last N hours (for example `?hours=24`)
- `since` — fetch summary data from a specific ISO timestamp onward

The response includes summary totals and the percentage split for SFW versus NSFW usage, plus top-file and top-artist aggregates. The `artist` column is intentionally stored as a snapshot at the moment of the serve, not as a live lookup, because display rows can disappear after file deletion and historical analytics should remain accurate.

## Image serve analytics schema

The server creates an `image_serve_events` table at startup if it does not already exist. It records:

- `served_at` — timestamp for the serve event
- `file_id` — file identity for the served image
- `file_path` — file path snapshot at the time of serving
- `artist` — artist snapshot captured when the image was served
- `rating` — current rating used for the selection (`sfw` or `nsfw`)

This table is intended for aggregated operational reporting and is intentionally separate from the mutable `display_files` table.

## Related documentation

- [../README.md](../README.md) — project overview and setup
- [../docs/README.md](../docs/README.md) — docs index
- [../kiosk/README.md](../kiosk/README.md) — kiosk deployment and browser startup
