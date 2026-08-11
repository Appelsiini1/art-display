## Problem

Metadata values are currently managed using the legacy Python client in `client/client.py` and `client/client_lib.py`. That workflow is outdated, harder to use for non-Python users, and disconnected from the existing browser-based UI.

A modern web-based client should let administrators change settings values directly in the browser using the same API already exposed by the server.

## Desired behavior

- A browser-accessible settings page exists alongside the current UI.
- The page can list all metadata settings, fetch a single key, and save updates to metadata values.
- The server API endpoints for metadata remain unchanged.
- The settings UI is easy to use and does not require the Python environment or command-line interaction.

## Implementation approach

1. Add a dedicated admin/settings page in `public/`, such as `settings.html`.
2. Implement a small client-side script that derives the API base URL from `window.location.origin` when served over HTTP(S), and uses the current host for same-origin fetch requests.
3. Reuse the existing server metadata endpoints:
   - `POST /metadata?name=<key>&value=<value>` to add or update a metadata entry
   - `GET /metadata/get?name=<key>` to fetch a single metadata entry
   - `GET /metadata/get/all` to fetch all metadata values
4. Build UI components for:
   - entering a metadata key and value
   - submitting updates
   - loading a metadata value by key
   - displaying the current metadata list
5. Keep the new client separate from the kiosk slideshow experience so the metadata settings page can be used safely in admin workflows.

## Notes

- The server already supports the required metadata API, so this change should be primarily frontend work.
- If the frontend is served in a kiosk or file-based environment, the client should fall back to the server origin or a documented admin host.
- This change is intentionally narrow: it replaces Python metadata management without touching file upload or scanner behavior.
