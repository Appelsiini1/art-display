## Purpose

This capability defines the foundational behavior of the tagger service: it provides a reusable database layer, a layered execution model, and a structured process for collecting raw model outputs, transforming them into canonical tags, and persisting approved results.

## ADDED Requirements

### Requirement: Shared database access layer
The tagger service SHALL provide a single shared database access layer for all tagger-related persistence operations so database logic is not embedded in ad hoc scripts or scattered across independent layers.

#### Scenario: Reusable persistence operations
- **WHEN** a layer in the tagger service needs to read or write tagger data
- **THEN** it uses the shared database access layer instead of creating duplicate SQL or one-off scripts
- **AND** the layer can rely on a consistent API for tagger database operations

#### Scenario: Service startup and database readiness
- **WHEN** the tagger service initializes
- **THEN** it establishes the database connection and verifies the required schema is present before processing files
- **AND** it fails fast with a clear error if the database is unavailable or the required schema is missing

### Requirement: Layered tagger architecture
The tagger service SHALL separate responsibilities into distinct layers for service orchestration, model execution, transformation, and persistence.

#### Scenario: Orchestration layer
- **WHEN** the service processes a file
- **THEN** the orchestration layer coordinates the end-to-end pipeline without embedding model-specific or database-specific logic directly in the entry point

#### Scenario: Model layer
- **WHEN** the service runs EVA-02 or JoyTag for a file
- **THEN** the model layer handles model-specific inference, output extraction, and model metadata for that run

#### Scenario: Transformation layer
- **WHEN** model outputs are ready
- **THEN** the transformation layer normalizes tags, applies category and grouping rules, resolves aliases, and prepares final tag data for persistence

#### Scenario: Persistence layer
- **WHEN** final or raw tag data is ready to be stored
- **THEN** the persistence layer writes the data using the shared database access layer and keeps the schema contract explicit

### Requirement: Canonical tag catalog
The tagger service SHALL maintain a canonical tag catalog that defines normalized tag names and their associated metadata so transformation and grouping rules can be applied consistently across model outputs.

#### Scenario: Tag normalization
- **WHEN** the model emits a candidate tag
- **THEN** the system resolves it to the canonical catalog entry before it is accepted or grouped
- **AND** equivalent tag variants are treated consistently across model outputs

#### Scenario: Tag grouping and hierarchy
- **WHEN** a tag has a parent grouping or franchise-based association
- **THEN** the transformation layer can place it under the appropriate hierarchy or lookup group based on the catalog metadata

### Requirement: Raw model evidence retention
The tagger service SHALL retain raw model score entries alongside the final transformed output so the final classification can be recomputed, inspected, or reweighted without losing the original model evidence.

#### Scenario: Comparing model outputs
- **WHEN** EVA-02 and JoyTag produce different confidence values for the same image and tag
- **THEN** the raw model output remains available so the system can compare evidence and adjust the final blend without re-running the model

#### Scenario: Final approval workflow
- **WHEN** the final output is accepted
- **THEN** the system records both the approved final tag decision and the underlying raw model evidence used to reach that decision

### Requirement: File identity and path separation
The tagger service SHALL keep image identity separate from current filesystem path so moved, renamed, or reimported files do not break the historical tagging record.

#### Scenario: File move without content change
- **WHEN** an image is moved to a new path
- **THEN** the tagger can match the file to its existing image identity using content or a stable image identity record rather than assuming the path is the primary key

#### Scenario: Same content used in a new location
- **WHEN** the same file appears under a different path
- **THEN** the system can reuse or reconcile tag history based on image identity instead of creating a duplicate record purely because the path changed

### Requirement: Enforced tagger-specific schema ownership
The tagger service SHALL own the tables and lifecycle for its database definitions and SHALL not rely on the API server bootstrap path to create or maintain them.

#### Scenario: Service-owned schema
- **WHEN** the tagger service is deployed
- **THEN** the schema it requires is defined within the tagger service or its dedicated migration path
- **AND** server startup does not become the implicit owner of tagger data tables

#### Scenario: Future extension
- **WHEN** additional tagger layers or table definitions are introduced
- **THEN** those definitions are added within the tagger service ownership boundary rather than inside unrelated application bootstrap code
