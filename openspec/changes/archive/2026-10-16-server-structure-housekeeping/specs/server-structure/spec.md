# server-structure Specification

## Purpose

This capability defines the cleanup and organization of the server implementation so the code can grow without entangling route handling, business logic, and database access in a single monolithic structure.

## Requirements

### Requirement: Route separation

The server SHALL keep HTTP route handling in dedicated modules and SHALL avoid adding new route logic directly into the server entrypoint as the application grows.

#### Scenario: New API route is added

- **WHEN** a new endpoint is introduced
- **THEN** the HTTP handler and request validation live in a route-focused module
- **AND** the entrypoint remains responsible for app assembly rather than per-endpoint orchestration

### Requirement: Domain-based data access

The server SHALL group database queries by domain so that display-file, metadata, and scan-related operations are not all mixed into one large module.

#### Scenario: Display-file analytics are needed

- **WHEN** a display-file specific query is required
- **THEN** the logic is placed in the repository layer associated with the display-file domain
- **AND** it is not interleaved with unrelated scan-run or metadata logic

### Requirement: Service-level orchestration

The server SHALL use service-layer coordination for cross-cutting logic such as variation between route inputs, database access, and response shaping.

#### Scenario: Request requires aggregate data

- **WHEN** a route needs to fetch combined data for a response
- **THEN** the route delegates to a service
- **AND** the service coordinates any required repository calls and response preparation

### Requirement: Stable public behavior

The server SHALL preserve the current public endpoint contracts and response formats during the structure cleanup.

#### Scenario: Refactor is in progress

- **WHEN** the code is reorganized
- **THEN** the existing routes and payload shapes remain behaviorally unchanged unless a separate change deliberately changes them
