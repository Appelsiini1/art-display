## Context

See proposal.md for the motivation and the broader goal of making random image serving visible as analytics. The current server already tracks scanner-run history in `scan_runs`, and the image-serving path in `server/src/index.ts` is the next natural source of operational metrics. The app is still a small deployment with one active screen, so the design should optimize for correctness and future extensibility rather than a large-scale analytics platform.

## Goals / Non-Goals

**Goals:**
- Record each successful random-image serve as a durable event.
- Preserve enough historical context to answer top-file, top-artist, and rating-distribution questions.
- Keep the analytics design simple enough to implement without major scanner refactors.
- Continue using server-side aggregation so the frontend receives summary data, not a raw event dump.

**Non-Goals:**
- Replacing the lifecycle model of `display_files`
- Building a general-purpose analytics system for every API endpoint
- Adding source tracking or multi-frontend attribution without a clear need
- Introducing a large event-sourcing or warehouse pattern for an app this small

## Decisions

### Decision: Add a dedicated `image_serve_events` table for the random image endpoint

The random image endpoint is a meaningful event source in its own right, and it deserves a dedicated table rather than overloading `scan_runs` or reusing live display state. This keeps the analytics model separate from scanner health and avoids conflating different operational concerns.

**Why this is preferred:**
- It aligns with the existing pattern of event-driven operational logging in the project.
- It keeps serve analytics independent from scanner correctness and cleanup logic.
- It makes future endpoint metrics easy to add without redesigning unrelated tables.

**Alternatives considered:**
- Reusing `scan_runs`: not a good fit because it models scanner execution, not user-facing image requests.
- Logging into `display_files`: would mix current catalog state with historical serve metrics and create unstable reporting as files are removed.

### Decision: Capture `artist` as a snapshot, not a live join

The artist value is derived from file path metadata and can be lost when `display_files` rows are deleted. Because of that, the analytics table records `artist` at serve time and treats it as historical data, not a dynamic pointer into the live file catalog.

**Why this is preferred:**
- It preserves historical accuracy even after files are removed.
- It avoids larger scanner-side changes like soft deletes or retention fields.
- It keeps the analytics design small and low risk for the current project scale.

**Alternatives considered:**
- Storing only `file_id` and joining at read time: would still lose artist fidelity when the underlying row is deleted.
- Changing the scanner to maintain tombstones or soft-delete state: too large and unnecessary for this use case.

### Decision: Keep the table intentionally lean

The first version records only the fields needed for aggregate reporting: served time, file identity, file path, artist snapshot, and current rating. No source column is included because there is no user-visible need for attribution across multiple origins in the current deployment.

**Why this is preferred:**
- Reduces schema complexity.
- Keeps ingestion fast and easy to reason about.
- Makes future extensions straightforward if a real multi-source requirement appears.

### Decision: Do the percentage math in SQL

The percentage split is a derived metric over the dataset and belongs in the database query. This keeps the endpoint response consistent and avoids making every frontend client reimplement the same logic.

**Why this is preferred:**
- It matches the way time-window and grouping aggregates are already handled in the project.
- It keeps the API shape clean and the frontend presentation simple.
- It makes percentage-based reporting consistent across all consumers of the same stats endpoint.

**Alternatives considered:**
- Returning raw counts only and computing percentages in the browser: workable but less reusable and less consistent across UI contexts.

## Risks / Trade-offs

- [Data duplication] → The analytics table stores a snapshot of artist and file path, which duplicates some information from `display_files`. Mitigation: this is intentional and limited to the analytics use case.
- [Event table growth] → The table will grow over time, but at the current scale it remains manageable. Mitigation: use time-window queries and indexes on timestamp and group fields.
- [Historical drift] → If the underlying image metadata changes, analytics remain anchored to the serve-time snapshot. Mitigation: this is an acceptable tradeoff for historical reporting and should be documented in comments and future docs.

## Migration Plan

1. Create the `image_serve_events` table with the agreed schema and indexes.
2. Add an insert path in the random image server flow after a file is successfully served.
3. Add server-side aggregate queries for total serves, top files, top artists, and per-artist rating distribution.
4. Expose the data through a dedicated statistics endpoint or extend the existing statistics API surface.
5. Validate against a small sample dataset and confirm that snapshots remain accurate after file deletions.

## Open Questions

- None at this time; the design intentionally keeps the scope limited and defers larger historical analytics features until a real requirement appears.
