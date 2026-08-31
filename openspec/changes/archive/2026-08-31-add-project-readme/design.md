# Design: Project README and docs layout

Overview:
Create a single, well-structured `README.md` at repository root. The README will be written in Markdown and include badges, minimal diagrams, and clear commands that work on the project's primary development platform (Linux).

Structure (sections):
- Title & badges
- Summary: one-paragraph elevator pitch
- Architecture: short description + ASCII or small diagram of components
- Repository layout: list of top-level folders and responsibility
- Quickstart: minimal steps to run the project locally (install, start server, open UI)
- Development: workflow for making changes, linting, formatting, tests
- Deployment: how to build images and deploy (links to `docker-compose.yml` and `kiosk/` service)
- Contributing: PR, issue, and coding standards
- Resources & links: component READMEs and important files

Docs layout:
- Add `docs/` directory at repo root.
- Create `docs/README.md` that links to per-component docs: `server`, `scanner`, `public`, `kiosk`.

Constraints & notes:
- Do not duplicate `kiosk/README.md`. Link to it from root README.
- Keep Quickstart minimal; link to component docs for advanced setup.

Deliverables:
- `README.md` at repo root
- `docs/README.md` scaffold
