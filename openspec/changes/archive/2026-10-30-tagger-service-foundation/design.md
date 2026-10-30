## Context

See proposal.md for the motivation. The project already has a scanner service and a server API, both of which share the same Postgres database, and the tagger proof-of-concept has shown that the future production system needs a more formal structure than a standalone script. The main design constraint is that the tagger must support multiple models, canonical tag normalization, and a transformation layer without collapsing all functionality into a single script or a server-owned schema.

## Goals / Non-Goals

**Goals:**
- Define a clean layer structure for the tagger service.
- Centralize tagger database operations in a reusable Python library module.
- Preserve model evidence while producing canonical, approved tag outputs.
- Keep the tagger independent from server bootstrap and database ownership coupling.

**Non-Goals:**
- Replacing the scanner or server architecture.
- Determining the final heuristics for every tag transformation in the first pass.
- Building a full end-to-end tagger product before the service backbone exists.

## Decisions

### Decision: Use a layered architecture with explicit ownership boundaries

The tagger will be organized into a small set of distinct layers:

- orchestration layer: coordinates runs and overall file processing
- model layer: executes EVA-02 and JoyTag inference ()
- transformation layer: normalizes tags, groups categories, resolves aliases, and prepares final outputs
- persistence layer: writes raw model results and approved tag decisions through a shared database access layer

Rationale:
- This matches the requirements already identified in the design discussions: multiple models, separate tag vocabs, and a final decision layer.
- It keeps the service extensible without pushing all logic into a monolithic worker.
- It allows the database layer to be reused by any layer without hidden coupling.

Alternatives considered:
- One large script with helper functions. Rejected because it would mix orchestration, model logic, transformation, and SQL together and become hard to maintain.
- Separate libraries for every layer without a common DB boundary. Rejected because the database access contract would still be duplicated.

### Decision: Centralize database access in one Python library module

A dedicated Python module under the tagger service source tree will own the SQL and database operations. The rest of the tagger service will call into that module rather than writing raw SQL directly in model or transformation code.

Rationale:
- This avoids repeating DB logic across multiple layers.
- It produces a stable abstraction for tag state, final tag decisions, and score persistence.
- It matches the project’s move toward explicit service-owned schema boundaries.

Alternatives considered:
- Keep DB calls embedded in each layer. Rejected because it creates duplicated queries and makes schema changes more expensive.
- Use a separate package outside the service. Rejected because it adds cross-project coupling and does not fit the current structure.

### Decision: Keep raw model evidence and final approved tags separate

The tagger will persist both raw model scores and a derived canonical decision layer.

Rationale:
- This preserves provenance for EVA-02 and JoyTag results.
- It supports reweighting and tuning later without re-running models.
- It matches the “ensemble scoring” design discussed earlier, where evidence is kept separate from final application decisions.

Alternatives considered:
- Store only final approved tags. Rejected because it loses the ability to compare model behavior and debug transformations.
- Use a single flat score table without model provenance. Rejected because it makes multi-model operations ambiguous and brittle.

### Decision: Keep image identity out of the path as the primary key

The tagger service will use a stable internal image identity record, with current file path stored as mutable metadata. This allows reprocessing, file moves, and reimports without permanently losing tag history.

Rationale:
- Paths are not stable identifiers and are already treated as mutable in other parts of the system.
- The raw evidence and final tags should remain attached to the same image identity even if the file is moved or re-exported.

Alternatives considered:
- Use path as the primary key. Rejected because it breaks historical continuity after moves or copies.
- Use XMP metadata alone as the identity source. Rejected because file-side metadata is not authoritative enough for the canonical database record.

## Risks / Trade-offs

- [Model disagreement across EVA-02 and JoyTag] → Mitigation: retain raw evidence and define the transformation layer as the place where blended decision logic is applied.
- [Path churn after file moves] → Mitigation: store path as metadata and preserve a stable image identity record.
- [Database changes affecting multiple layers] → Mitigation: centralize the DB access in a shared module so one contract defines the persistence boundary.

## Migration Plan

1. Create the tagger service directory and define the initial layer boundaries.
2. Add the shared database access library and service-owned schema scaffolding.
3. Add the first raw model and final tag persistence contract.
4. Wire orchestration to the model and transformation layers.
5. Validate that the service can initialize cleanly and that database schema ownership remains separate from the server bootstrap path.

Rollback strategy:
- Because this is a new service foundation, rollback means removing the service scaffolding and leaving the existing proof-of-concept code isolated from the production service. No destructive database migration is required beyond ensuring new tables are created only in the tagger-owned path.

## Open Questions

None at this stage. The architecture and ownership boundaries are sufficiently defined to begin implementation.
