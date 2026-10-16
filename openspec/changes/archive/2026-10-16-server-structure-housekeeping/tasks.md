## 1. Server boundary mapping

- [x] 1.1 Review the current server entrypoint and identify routes that should move into focused route modules
- [x] 1.2 Review the database module and divide current query responsibilities by domain (display files, scans, image serves, metadata)
- [x] 1.3 Confirm the refactor scope remains structural-only and does not change the public API contract

## 2. Repository and service extraction

- [x] 2.1 Create domain-oriented repository modules for display-file and metadata-related queries
- [x] 2.2 Create or update service modules that orchestrate the existing server behavior without duplicating database logic
- [x] 2.3 Move the route-level handlers to dedicated route files and keep validation logic in place

## 3. Documentation and maintenance updates

- [x] 3.1 Update the README and server-facing documentation to describe the new server structure and module boundaries
- [x] 3.2 Add a short note explaining which modules own route logic, service logic, and database access
- [x] 3.3 Check the docs for stale references to the old monolithic layout and replace them with the new structure

## 4. Wiring and validation

- [x] 4.1 Update imports and runtime wiring to point at the new structure
- [x] 4.2 Build the TypeScript server and confirm the application still starts successfully
- [x] 4.3 Smoke-test the key API endpoints to confirm their behavior and response contracts remain stable
