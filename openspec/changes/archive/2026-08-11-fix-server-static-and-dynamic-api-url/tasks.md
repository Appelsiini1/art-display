## 1. Fix server static asset delivery

- [x] 1.1 In `server/package.json`, update the `build` script so it runs `tsc` and then copies `../public` into `dist/public`.
- [x] 1.2 In `server/Dockerfile`, ensure the root `public/` directory is available during the image build and copy it into `./dist/public` after compilation.
- [x] 1.3 If needed, update `docker-compose.yml` so the `api` service build context is the repository root and the Dockerfile path is `./server/Dockerfile`.

## 2. Make the client API URL dynamic

- [x] 2.1 In `public/main.js`, remove the hard-coded `apiURL` host constants.
- [x] 2.2 Add a runtime-derived `apiURL` that uses `window.location.origin` for HTTP(S) loads and falls back to `http://localhost:9000` for file-based loads.
- [x] 2.3 Update all API fetch calls to use the new `apiURL` value.

## 3. Verify behavior

- [x] 3.1 Run `npm run build` in `server/` and verify `server/dist/public/index.html` exists.
- [x] 3.2 Start the server and confirm `http://localhost:9000/index.html` loads successfully.
- [x] 3.3 Confirm the client fetches `/img/random` and `/img/file` via the derived API URL.
- [x] 3.4 Build the Docker `api` service and validate the static UI is present in the image.
