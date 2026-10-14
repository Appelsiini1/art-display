## Context

See proposal.md for the motivation. The project has grown enough that the browser route surface and the backend API surface are no longer visually or semantically distinct. The current server uses several root-level endpoints that overlap with the static page model, and the frontend fetch logic is already beginning to rely on a more explicit separation between app pages and API calls.

## Goals / Non-Goals

**Goals:**
- Put the server API behind a clear `/api/` namespace.
- Keep static dashboard and gallery pages at their existing browser-facing URLs.
- Update fetch logic and documentation so clients use the new contract consistently.
- Remove ambiguity between app routes and API calls without changing the app’s broader architecture.

**Non-Goals:**
- Rebuilding the frontend into a framework or router.
- Changing the data model or business logic of the metadata or image endpoints.
- Introducing versioned API semantics beyond the route prefix.

## Decisions

### Decision: Keep browser routes at their current public URLs and move only API routes under `/api/`

The route prefix should isolate the parts of the app that are server contracts without disrupting the static page experience. This preserves usability for browser navigation while making the internal API surface more explicit.

**Why this is preferred:**
- It communicates intent immediately to any developer reading the routes.
- It avoids collisions between page URLs and API calls.
- It matches the project’s current need for clear separation without introducing a large migration framework.

**Alternatives considered:**
- Moving both pages and APIs under a single nested path: more disruptive and less user-friendly for the static pages.
- Leaving the API at the root: simple in the short term but increasingly confusing as the app grows.

### Decision: Use `/api` as the single canonical base for all server-side operations

The prefix should cover status, metadata, image, and statistics endpoints. The backend should no longer advertise the root-level variants as the default contract.

**Why this is preferred:**
- It creates a consistent rule that all API clients can follow.
- It is easy to document and simple to validate.
- It reduces ambiguity in debugging and future feature work.

**Alternatives considered:**
- Prefixing only some endpoints: inconsistent and easy to forget.
- Leaving a compatibility shim at the old routes: possible but unnecessary for a newly adopted convention.

### Decision: Update frontend fetch URLs in one pass and document the new pattern

The frontend should use the prefixed API base in a single, obvious way, and the README files should call out the new convention so future code follows it.

**Why this is preferred:**
- It keeps the codebase consistent.
- It reduces the chance of partial migration or regressions.
- It makes future route additions easier to reason about.

**Alternatives considered:**
- Mixing old and new endpoints across files: high confusion, low consistency.
- Keeping the behavior undocumented: technical debt for the next feature.

## Risks / Trade-offs

- [Breaking clients] → Any external automation that still calls the old routes must be updated. Mitigation: use documentation updates and keep the change intentional and explicit.
- [Migration churn] → Frontend fetch calls and docs all need to change. Mitigation: do it in a single sweep and keep the pattern consistent.
- [Route confusion] → If future work adds more browser routes, the separation between `/statistics` and `/api/...` must remain explicit. Mitigation: document the convention early and follow it consistently.

## Migration Plan

1. Update the Express route definitions in `server/src/index.ts` to mount the API under `/api`.
2. Update browser fetch URLs to use `/api/...` for metadata, image retrieval, and statistics summary requests.
3. Keep `/statistics` page routes separate and unchanged for browser navigation.
4. Update project documentation so the API base path is clear to future contributors.
5. Validate the resulting app flow with a build check and a route-level review.

## Open Questions

- None at this time; the API namespace split is clear and directly matches the identified ambiguity in the current route layout.
