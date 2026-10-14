# api-routing Specification

## Purpose

The server API SHALL use a dedicated `/api/` prefix so browser routes and backend endpoints are distinguishable and the public surface remains easier to maintain as the project grows.

## Requirements

### Requirement: API namespace separation

The server SHALL expose all API endpoints under the `/api/` namespace while allowing the browser-facing static pages to remain under their existing `/statistics` and related routes.

#### Scenario: Status route is served under the API namespace

- **WHEN** a client requests `/api/status`
- **THEN** the server responds with the readiness payload
- **AND** the route is not served from the root `/status` path

#### Scenario: Image routes are served under the API namespace

- **WHEN** a client requests `/api/img`, `/api/img/random`, or `/api/img/file`
- **THEN** the server serves the corresponding image API behavior
- **AND** the unprefixed root paths are no longer the canonical API contract

#### Scenario: Metadata routes are served under the API namespace

- **WHEN** a client requests `/api/metadata`, `/api/metadata/get`, or `/api/metadata/get/all`
- **THEN** the server responds with the configured metadata operations
- **AND** the underlying logic remains consistent with the current metadata behavior

#### Scenario: Statistics routes are served under the API namespace

- **WHEN** a client requests `/api/statistics/run_history` or `/api/statistics/image_serves`
- **THEN** the server returns the same analytics payloads as the existing statistics APIs
- **AND** the static statistics pages remain served at `/statistics`, `/statistics/scan-runs`, and `/statistics/image-serves`

### Requirement: Clear route ownership

The server SHALL treat `/api/*` as the only canonical API surface, and the frontend SHALL not rely on unprefixed API paths when fetching data from the server.

#### Scenario: Browser fetches use the API prefix

- **WHEN** the browser code fetches data from the server
- **THEN** it targets `/api/...` routes
- **AND** it does not rely on root-level API paths that are reserved for the static app surface

#### Scenario: Static page routes remain separate

- **WHEN** a user navigates to `/statistics`, `/statistics/scan-runs`, or `/statistics/image-serves`
- **THEN** the server serves the statically generated dashboard pages without exposing those pages as API endpoints

### Requirement: Breaking change communication

The route prefix change SHALL be treated as a public contract change that requires documentation updates and explicit communication for any downstream scripts or clients.

#### Scenario: External consumers are updated

- **WHEN** a client or script still calls unprefixed endpoints
- **THEN** it must be updated to use the `/api/` namespace before relying on the API
- **AND** the project documentation must clearly call out the new route base path
