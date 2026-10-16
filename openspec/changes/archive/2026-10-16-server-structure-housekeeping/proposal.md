## Why

The server is still functionally small, but it is already showing the signs of a growing monolith: route registration, validation, filesystem safety checks, database queries, and aggregate statistics logic are all living in a small set of files. As new analytics pages and API endpoints are added, the code will become harder to reason about and harder to modify without accidental coupling. This cleanup establishes a clearer structure before the server grows further.

## What Changes

- Split the server into clearer route, service, and repository layers.
- Move database query logic out of the top-level server entrypoint and into focused modules.
- Keep public API behavior stable while reorganizing the implementation structure.
- Reduce the risk of cross-cutting changes by separating HTTP concerns from database concerns and business logic.
- Update the project documentation to describe the new server layout and the refactor boundaries so maintainers can find the right modules quickly.
- Preserve the existing runtime behavior and keep the first refactor intentionally scoped to structural cleanup rather than feature expansion.

## Capabilities

### New Capabilities
- `server-structure`: a clearer server organization that separates request handling, business logic, and data access for the existing application behavior

### Modified Capabilities
- None

## Impact

- `server`: the application entrypoint becomes lighter and easier to follow, with routes and query logic organized into dedicated files.
- `database`: data access stays the same at the behavioral level, but the query logic becomes easier to locate and reason about.
- `tests and maintenance`: future endpoint work becomes easier to isolate and safer to change without entangling unrelated code paths.
- `documentation`: project maintainers get a clearer architectural map for how the server is organized, and the README/docs are updated to reflect the new file structure and module boundaries.
