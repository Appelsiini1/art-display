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

- `/status` — readiness endpoint
- `/img/random` — fetch a random display image
- `/img` — fetch a specific image by ID
- `/img/file` — serve the raw image file
- `/metadata/get` and `/metadata/get/all` — metadata read endpoints
- `/metadata` — metadata create/update endpoint
- `/statistics/run_history` — return scanner run summaries from the `scan_runs` table

### `/statistics/run_history`

Returns recent scanner run history as JSON. The endpoint is read-only and uses the `scan_runs` table persisted by the scanner.

Query parameters:

- `hours` — fetch rows from the last N hours (for example `?hours=24`)
- `since` — fetch rows from a specific ISO timestamp onward (for example `?since=2026-10-01T00:00:00Z`)

If no filter is supplied, the default window is the last 30 days. Results are ordered by newest run first.

## Related documentation

- [../README.md](../README.md) — project overview and setup
- [../docs/README.md](../docs/README.md) — docs index
- [../kiosk/README.md](../kiosk/README.md) — kiosk deployment and browser startup
