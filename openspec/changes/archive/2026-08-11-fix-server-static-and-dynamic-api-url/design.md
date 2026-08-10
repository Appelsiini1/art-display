## Problem

The server serves static files from `path.join(__dirname, "public")`, which is correct only when the build output includes a `public` folder next to `dist/index.js`. In this repository, the UI files currently live at the repo root `public/`, and the server build does not copy them into `server/dist/public`.

The client code in `public/main.js` also hard-codes a specific API host, which is not portable across environments.

## Desired behavior

- `npm run build` in `server/` should produce a runnable server bundle and a `dist/public` directory containing all UI assets.
- The `api` Docker image should include the same UI assets.
- `public/main.js` should derive the backend URL from the page origin when served over HTTP(S), while preserving a local fallback for file-based kiosk startup.

## Implementation approach

1. Build output
   - Keep the server runtime static path as `express.static(path.join(__dirname, "public"))`.
   - Make the build produce `server/dist/public` by copying the root `public/` folder into the server output.
   - In `server/package.json`, extend the `build` script to run `tsc` and then copy `../public` into `dist/public`.

2. Docker image
   - Update `docker-compose.yml` so the `api` service build context includes the repo root and the `server/Dockerfile` can access `public/`.
   - In `server/Dockerfile`, after compiling the server, copy the root `public/` assets into `./dist/public`.
   - This ensures both local and container builds produce the same runtime layout.

3. Dynamic API base URL
   - In `public/main.js`, remove the hard-coded `apiURL` assignment.
   - Add a dynamic base URL:
     - If the page is loaded over `http:` or `https:`, use `window.location.origin`.
     - Otherwise, fall back to `http://localhost:9000`.
   - Use this base URL for all fetch requests to `/img/random` and `/img/file`.

4. Verification
   - After building the server, start it and verify `http://localhost:9000/index.html` loads.
   - Confirm the client successfully fetches API endpoints through the derived `apiURL`.
   - Validate the Docker build includes static assets and the service can host the UI.

## Notes

- If kiosk usage continues to load the page from the filesystem instead of the server, a later follow-up can add an explicit config variable or query-string override for the API host.
- This change is intentionally minimal: it fixes the missing static assets and avoids further refactors in the current server routing logic.
