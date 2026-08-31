## Context

The project already has a top-level README and a docs index, but the component directories still vary in discoverability. The repository has a dedicated kiosk guide, while the app server, scanner, and public UI are not yet described in their own README files. This has created a documentation gap between the high-level overview and the actual source directories.

## Goals / Non-Goals

**Goals:**
- Add a consistent documentation pattern for each component directory.
- Make component responsibilities and setup steps easy to find.
- Improve navigation from the repository root and the docs index.
- Provide a lightweight standard for future project documentation updates.

**Non-Goals:**
- Changing runtime behavior or application architecture.
- Reworking the scanner, server, or UI implementation.
- Replacing existing deployment scripts or operational guidance.

## Decisions

### 1. Keep documentation Markdown-first and directory-local
Each component README will live in the same folder as the implementation so the docs stay close to the code they describe. This reduces the risk that component-specific guidance drifts away from the codebase.

**Why this choice:** It keeps onboarding and operation tasks discoverable without forcing contributors to search across multiple top-level docs.

**Alternatives considered:** A single monolithic docs page or a docs-only folder with all write-ups isolated from source. The monolithic approach would be harder to maintain and less discoverable at the component level.

### 2. Use a lightweight, standardized structure for each component README
Each component README will contain a short description of purpose, key folders, setup and command notes, operational context, and links to related docs. This keeps the sections easy to maintain while still making the docs useful to contributors.

**Why this choice:** The project has modest scope, so a consistent, compact format is more sustainable than a longer formal documentation framework.

### 3. Treat the docs index as the navigation hub
The root README and `docs/README.md` will link to the component READMEs and to existing deployment docs, including `kiosk/README.md`. This makes the entry point for discovery consistent for both contributors and operators.

**Why this choice:** It preserves the high-level overview while making component-level docs visible from the main navigation paths.

## Risks / Trade-offs

- [Documentation drift] → Mitigation: keep the README structure simple and require future code changes to update the relevant docs during the same pull request.
- [Link rot] → Mitigation: use relative links and review navigation after creating each component README.
- [Over-documentation] → Mitigation: keep component READMEs focused on purpose, setup, and links rather than duplicating implementation details.

## Migration Plan

1. Create the component-level README files for the server, scanner, and public UI directories.
2. Update the documentation index to include the new component links and any legacy directory notes.
3. Update the root README so it clearly points to the relevant docs and keeps the project landing page easy to scan.
4. Review relative links and verify the new docs are discoverable without changing runtime behavior.

## Open Questions

None. The scope is clear, and the implementation is documentation-only.
