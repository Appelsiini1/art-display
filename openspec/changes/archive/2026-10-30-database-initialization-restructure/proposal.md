## Why

The project now has more than one service that depends on the same Postgres database, but schema initialization is still centralized in the server startup path. This creates hidden ownership and startup-order coupling: a database schema change for one service can end up living in a different service's bootstrap code, making it harder to reason about, run safely, and reproduce for new developers or operators.

The current pattern is workable for a single service, but it does not scale well when the scanner and the tagger both contribute tables, migrations, and operational assumptions to the same database. This change addresses that by separating schema ownership and making database setup repeatable and explicit instead of relying on ad hoc, single-use initialization scripts.

## What Changes

- Move database initialization out of a single server-owned bootstrap path and into an explicit, service-owned schema model.
- Treat the Postgres instance as a shared infrastructure dependency instead of a server-local implementation detail.
- Give each service clear ownership over the tables and indexes it creates, while keeping the shared database as a common platform.
- Introduce a migration-oriented structure so future table changes can be applied consistently by any operator or deployment workflow.
- Document the database ownership boundaries so the tagger, scanner, and server can evolve without stepping on each other's schema assumptions.
- Preserve the current server functionality while making schema lifecycle management predictable and repeatable.

## Capabilities

### New Capabilities
- `database/schema-management`: Defines the project-wide rules for database ownership, initialization, and migration flow so each service can manage the tables it owns without coupling startup behavior across services.

### Modified Capabilities
- None.

## Impact

- Server startup code will no longer be the default home for all database schema creation.
- Scanner and tagger service schema ownership will become explicit and easier to evolve independently.
- Deployment and local development workflows will become more repeatable because database setup will follow a migration or service-owned initialization pattern rather than implicit server init behavior.
- Future schema changes will be less brittle because they will be tracked as part of the owning service's lifecycle instead of being hidden in a shared bootstrap block.
