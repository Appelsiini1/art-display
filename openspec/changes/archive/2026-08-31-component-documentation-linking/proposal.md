## Why

The repository now has a root-level overview, but the individual runtime components still do not have their own onboarding and maintenance docs. That makes it harder for contributors and operators to understand the responsibilities of the server, scanner, and public frontend without reading code or piecing together scattered notes.

This work is needed now because the project is already documented at a high level, and the next step is to make each component discoverable, self-explanatory, and consistently linked from the main documentation.

## What Changes

- Add dedicated README files for the server, scanner, and public UI components.
- Expand the documentation index so it clearly links to each component’s purpose, setup flow, and operational notes.
- Add cross-links from the root project README to the component docs and any existing kiosk guidance.
- Label legacy or transitional directories, such as `client_old`, so the docs remain accurate without implying that they are active components.

## Capabilities

### New Capabilities

- None. This is a documentation-only change and does not alter runtime behavior, APIs, or system contracts.

### Modified Capabilities

- None. No existing capability requirements are changing.

## Impact

- Repository documentation and contributor onboarding flow
- Root README and `docs/README.md` navigation
- Component folders: `server/`, `scanner/`, and `public/`
- Existing kiosk documentation links and references to legacy client assets
