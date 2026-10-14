## Why

The project now has a clear split between browser routes and server APIs, but the API endpoints are still exposed at the same top-level paths as the static pages. That makes the URL surface harder to reason about and increases the chance of accidental collisions between frontend routes such as `/statistics` and backend endpoints such as `/img` or `/metadata`.

This change makes the server-side contract explicit by moving API routes under `/api/`, while keeping the document pages and dashboard URLs in the public-facing browser surface unchanged.

## What Changes

- Move all server API endpoints under an `/api/` prefix, including image, metadata, status, and statistics routes.
- Keep browser-facing pages and static dashboard routes at `/statistics`, `/statistics/scan-runs`, and `/statistics/image-serves`.
- Update frontend fetch calls and documentation to point at the new API base path.
- Treat the route prefix change as a **BREAKING** API change for any external clients that still call the unprefixed endpoints.

## Capabilities

### New Capabilities
- `api-routing`: Establishes the canonical server API surface under `/api/` so browser routes and backend endpoints are clearly separated.

### Modified Capabilities
- None. This is a routing surface change rather than a change to the underlying semantic requirements of the scanner or metadata system.

## Impact

- `server/src/index.ts` route definitions and request handling logic.
- Browser JavaScript clients under `public/` that currently fetch `/img`, `/metadata`, and `/statistics/*` without a prefix.
- Project documentation in `server/README.md` and `public/README.md`.
- Any external automation or scripts that currently rely on the unprefixed API surface.
