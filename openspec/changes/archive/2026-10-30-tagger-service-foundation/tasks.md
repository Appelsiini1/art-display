## 1. Foundation and structure

- [x] 1.1 Create the tagger service directory structure and initial module layout
- [x] 1.2 Add the shared Python database access library under the service source tree
- [x] 1.3 Define the initial service-owned schema boundary and database initialization entry point

## 2. Data model and persistence contract

- [x] 2.1 Model the image identity table and link it to mutable file path metadata
- [x] 2.2 Define the canonical tag catalog and alias/grouping contract
- [x] 2.3 Define the raw model score table and the final approved tag decision table

## 3. Service layers and orchestration

- [x] 3.1 Implement the orchestration layer for running a tagging session
- [x] 3.2 Implement the model execution layer for EVA-02 and JoyTag integration
- [x] 3.3 Implement the transformation layer for normalization, grouping, and final tag preparation
- [x] 3.4 Wire the persistence layer to the shared database access module

## 4. Documentation and operational guidance

- [x] 4.1 Write the initial tagger service README describing the architecture, environment expectations, and database ownership
- [x] 4.2 Document the database schema responsibilities and expectations for the tagger-owned tables
- [x] 4.3 Document the transformation and tag grouping model, including canonical tag catalog behavior and model provenance

## 5. Validation and integration

- [x] 5.1 Validate initialization behavior and ensure the tagger does not rely on server bootstrap schema creation
- [x] 5.2 Verify the tagger can run against the project database without breaking existing server or scanner operations
- [x] 5.3 Confirm the architecture supports future refinement of model blending, tag grouping, and file identity reconciliation
