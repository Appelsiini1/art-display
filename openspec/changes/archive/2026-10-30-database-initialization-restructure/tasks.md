## 1. Ownership and migration baseline

- [x] 1.1 Inventory current database tables and map each one to its owning service or subsystem
- [x] 1.2 Confirm the server-owned schema boundary and identify tables that should move out of server bootstrap
- [x] 1.3 Define the migration/bootstrap structure for service-owned schema definitions

## 2. Schema split and cleanup

- [x] 2.1 Move the server schema definitions into the server-owned migration or initialization module
- [x] 2.2 Move scanner-owned tables and indexes into the scanner-owned migration or initialization module
- [x] 2.3 Keep the shared Postgres database as the common platform while removing implicit cross-service bootstrap coupling

## 3. Tagger readiness

- [x] 3.1 Create the tagger-owned schema boundary so the future service can add its tables without using server startup as a catch-all
- [x] 3.2 Document the expected ownership pattern for future services and schema changes
- [x] 3.3 Add a clear migration or setup entry point for the tagger to follow once the service work begins

## 4. Validation and rollout

- [x] 4.1 Validate that fresh database setup works without depending on server bootstrap side effects
- [x] 4.2 Verify that rerunning schema setup is idempotent and safe in local development and deployment flows
- [x] 4.3 Confirm the server, scanner, and future tagger paths all remain functional with the new ownership model
