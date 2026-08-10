## Why

The server is currently configured to serve static assets from `dist/public`, but the actual UI files live in the repository root `public/`. In local development and the Docker image build, those files are never copied into `server/dist/public`, so requests like `/index.html` return 404.

At the same time, `public/main.js` hard-codes the API host. That makes the client brittle across environments, prevents same-origin deployment, and requires manual edits when the server host changes.

## What Changes

- Ensure `public/` is copied into `server/dist/public` during the server build so Express can serve the static UI successfully.
- Update the Docker build configuration so the server image includes the UI assets and can host the client from `http://<api-host>:9000`.
- Replace the hard-coded `apiURL` in `public/main.js` with a runtime-derived base URL that uses `window.location.origin` when served over HTTP(S), and falls back to `http://localhost:9000` for local file-based kiosk usage.

## Impact

- **Code**: `server/package.json`, `server/Dockerfile`, `docker-compose.yml`, `public/main.js`
- **Runtime behavior**: `/index.html` and related static assets will be served correctly from the API server, and the client will automatically target the hosting API instead of a fixed host.
- **Deployment**: The `api` service image will include the UI files, removing a hidden dependency on the repo root.
- **Risk**: If the kiosk still loads the page from `file://`, the fallback assumes a local API on `http://localhost:9000`; if the API host differs in that scenario, a follow-up config option may be needed.
