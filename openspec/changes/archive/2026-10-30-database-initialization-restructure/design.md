## Context

See proposal.md for the motivation. The current project has a shared Postgres instance configured in [docker-compose.yml](docker-compose.yml), but schema initialization is still concentrated in [server/src/modules/db/init.ts](server/src/modules/db/init.ts). That makes the server the accidental owner of tables that are not truly server-only, and it makes future schema evolution more brittle whenever additional services join the same database.

This design shifts the model from a single bootstrap file to a clear ownership and migration pattern in which each service lives with the schema it owns.

## Goals / Non-Goals

**Goals:**
- Separate schema ownership by service domain.
- Make database initialization repeatable and reviewable.
- Reduce hidden startup coupling between the API, scanner, and future services.
- Prepare the project for a tagger service without forcing it into server-only bootstrap logic.

**Non-Goals:**
- Replacing Postgres with another database backend.
- Changing application business logic unrelated to database ownership.
- Rewriting the scanner or server behavior beyond moving schema responsibility to the appropriate lifecycle boundary.

## Decisions

### Decision: Treat the database as shared infrastructure, not server-owned state

The application will continue using a single Postgres instance, but not through a single monolithic bootstrap file. The database is a shared platform; schema ownership belongs to the service or subsystem that reads and writes the relevant tables.

Rationale:
- The scanner already owns scanning-specific tables and metadata caches.
- A tagger service will need its own service-specific tables and lifecycle.
- Server startup is not the right place to hide unrelated schema, especially when other services connect to the same database.

Alternatives considered:
- Keep all schema creation inside the server bootstrap. Rejected because it couples unrelated services and makes schema evolution fragile.
- Create a separate database per service. Rejected because the project already relies on a shared database and this would increase operational complexity without solving the ownership issue cleanly.

### Decision: Use a migration-oriented schema layout with explicit ownership

Schema definitions will be organized by service or domain, and each service will expose its migration/bootstrap steps as part of its own lifecycle. This can be implemented as a migration directory or service-owned schema module, but the key point is that ownership is explicit and visible.

Rationale:
- It makes future upgrades and bug fixes much easier to review.
- It aligns with the idea that schema lifecycle should be tracked the same way as code changes.
- It supports onboarding and local setup by reducing the need to inspect unrelated bootstrap files.

Alternatives considered:
- Single SQL script with comments dividing tables by service. Rejected because it still hides ownership and invites drift.
- A central global migration file for all services. Rejected because it recreates the same coupling and makes future changes harder to audit.

### Decision: Keep the server responsible for server-owned tables only

The existing server schema, including `display_files`, `metadata`, and API-related operational tables, remains with the server's responsibility. The scanner and future tagger services own their own schemas.

Rationale:
- This preserves the current API behavior while clarifying boundaries.
- It prevents the server from becoming an accidental “database janitor” for the whole project.

Alternatives considered:
- Move everything into a separate infrastructure package. Rejected as too large a change for the current scope and not required to clarify ownership.

## Risks / Trade-offs

- [Schema drift across services] → Mitigation: each service owns a defined migration path and idempotent schema application, with reviewable ownership boundaries.
- [Developer confusion during transition] → Mitigation: document the ownership model and move existing definitions into the new structure before the tagger service lands.
- [Temporary startup churn] → Mitigation: the migration step can be introduced before or alongside service startup so the code path remains safe while ownership is being cleaned up.

## Migration Plan

1. Inventory the existing tables and their owners, starting from the server and scanner definitions already present in the codebase.
2. Split the current schema bootstrap into service-owned migration or initialization modules.
3. Keep the server working with its own schema and move scanner-owned definitions out of the server bootstrap.
4. Add the tagger schema boundary in the same pattern, even if the feature is not yet active, so the future service can attach without further restructuring.
5. Validate that the database can be brought up cleanly in a fresh environment and that rerunning the initialization path remains safe.

Rollback strategy:
- Because this is primarily a structural refactor, rollback means restoring the previous server-owned bootstrap file and re-running the previous migration path; the goal is to avoid destructive changes to live data.
- The migration should be non-destructive and idempotent so rollout can be staged safely.

## Open Questions

None at this stage. The design is constrained enough to proceed without additional product or behavioral ambiguity.
