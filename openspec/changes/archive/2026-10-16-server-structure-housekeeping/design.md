## Context

The current server entrypoint is small but already mixes concerns: it registers routes, validates queries, loads files, calls database helpers, and orchestrates image-serving logic. The accumulated query work in `server/src/modules/database.ts` also mirrors that pattern, making it harder to isolate a feature-specific change without first understanding a larger shared file.

See proposal.md for motivation; the design below focuses on the refactor shape needed to keep the project maintainable as it grows.

## Goals / Non-Goals

**Goals:**
- Reduce coupling between route handling and database access.
- Group query logic by domain rather than by a single shared file.
- Keep runtime behavior stable while improving structure.
- Make it easier to add future statistics endpoints without growing the monolithic entrypoint further.
- Ensure the project documentation stays aligned with the new directory layout and module responsibilities.

**Non-Goals:**
- Rewriting the API contract.
- Introducing new frameworks or abstraction layers.
- Replacing the current Postgres data model.
- Expanding the project into a full microservice architecture.

## Decisions

### Decision: adopt a thin route, service, repository structure

The application should distinguish three concerns:
- routes for HTTP and validation
- services for business orchestration
- repositories for SQL and DB access

This keeps the responsibilities clear without requiring a deep framework or a large migration.

**Alternatives considered:**
- Keeping the current single-module pattern: rejected because it makes future additions harder to reason about and test.
- Creating a heavyweight dependency injection container: rejected as unnecessary complexity for a small server.

### Decision: keep the existing API surface stable throughout the refactor

The refactor is structural only. The routes and JSON payloads should remain the same unless a follow-up change intentionally changes behavior.

**Alternatives considered:**
- Renaming endpoints or reshaping response payloads: rejected because the current APIs are already in use by the UI and should remain stable during the cleanup.

### Decision: split by domain, not by incidental file size alone

The refactor should group logic by domain such as display files, scan runs, image serves, metadata, and file-serving, rather than just breaking one file into arbitrarily smaller files.

**Alternatives considered:**
- Arbitrary splitting by function name or file length: rejected because it would not improve conceptual clarity.

### Decision: keep the implementation incremental

The first pass should move the obvious boundaries without doing a broad re-architecture. That keeps the refactor low-risk and incrementally beneficial.

**Alternatives considered:**
- Full rewrite of the entire server module tree: rejected as too risky for a project that is working but small enough to refactor carefully.

## Risks / Trade-offs

- [The refactor may introduce temporary import churn] → Mitigation: keep the API surface stable and migrate modules in small, testable steps.
- [Domain boundaries may be imperfect at first] → Mitigation: keep the grouping aligned to existing functionality, then adjust as new endpoints appear.
- [Server startup behavior must not regress] → Mitigation: preserve the current initialization path and validate the server after module movement.

## Migration Plan

1. Create a route layer for the existing endpoints in `server/src/routes`.
2. Extract the most obvious database operations into domain-oriented repository modules.
3. Move orchestration logic into service modules where suitable.
4. Update imports and runtime wiring without changing the public endpoints.
5. Validate the server build and run the inventory statistics endpoints to confirm behavior stayed stable.

Rollback is straightforward because the refactor preserves existing behavior and keeps the same routes and response contracts.

## Open Questions

None at this stage. The change is intentionally framed as a structural cleanup with no behavior change, so the design can proceed without additional product ambiguity.
