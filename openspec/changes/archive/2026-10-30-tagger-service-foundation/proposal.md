## Why

The project is ready to move from tagger experimentation to a first production service. The proof-of-concept code produced raw model scores in SQLite, but the final system needs a shared Postgres-backed design with explicit model ownership, a reusable database layer, and a structured stack of orchestration, model, and transformation components. This change establishes that foundation so the tagger can evolve from a one-off script into a maintainable service rather than a collection of manual scripts.

## What Changes

- Create the first version of the tagger service as a proper application with clear service boundaries.
- Establish a shared database access layer for all tagger database operations, instead of embedding database logic in ad hoc scripts or separate one-off files.
- Add the core tagger architecture: orchestration, model execution, transformation, and persistence layers.
- Define the Postgres schema pattern for image identity, model outputs, tag catalog metadata, and accepted final tags.
- Define the service's initial integration points with the wider project so it can be run and extended without coupling to server bootstrap code.

## Capabilities

### New Capabilities
- `tagger-service/foundation`: Defines the foundational service behavior, structural boundaries, and database layer for the tagger service as it moves from proof-of-concept to production architecture.

### Modified Capabilities
- None.

## Impact

- A new tagger service directory and code structure will be added under the project.
- Database interactions for tagging will be centralized in a reusable Python library file instead of being spread across model scripts or layer-specific ad hoc helpers.
- The project will gain a clearer separation between orchestration, model execution, transformation logic, and persistence.
- Future tagger work can build upon a defined architecture without repeating the database design choices that were previously made in the POC.
