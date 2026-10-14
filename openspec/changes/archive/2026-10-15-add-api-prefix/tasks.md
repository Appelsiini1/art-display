## 1. API route migration

- [x] 1.1 Update all backend API handlers to live under `/api/*` rather than the root-level API surface.
- [x] 1.2 Keep the static frontend pages at `/statistics`, `/statistics/scan-runs`, and `/statistics/image-serves` without moving those routes into the API namespace.
- [x] 1.3 Confirm that status, image, metadata, and statistics endpoints all follow the same `/api` base convention.

## 2. Frontend fetch updates

- [x] 2.1 Update browser JavaScript to request all API data from `/api/...` endpoints.
- [x] 2.2 Validate that the gallery, settings, and statistics pages still load their required data after route changes.
- [x] 2.3 Check for any mixed old/new API calls and normalize them to the new convention.

## 3. Documentation updates

- [x] 3.1 Update `server/README.md` to describe the `/api` route base for the server API.
- [x] 3.2 Update `public/README.md` or other user-facing docs to explain the distinction between browser pages and API routes.
- [x] 3.3 Call out the breaking-change nature of the route prefix update for any external API consumers.

## 4. Validation and regression checks

- [x] 4.1 Run the project build to confirm the refactored route surface still compiles cleanly.
- [x] 4.2 Review the route list and confirm that browser pages and server APIs are correctly separated.
- [x] 4.3 Check documentation and examples for any stale root-level API references.
