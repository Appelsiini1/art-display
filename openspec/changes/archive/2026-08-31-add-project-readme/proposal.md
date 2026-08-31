# Add project README

What: Create a comprehensive top-level `README.md` for the repository that documents the project's purpose, architecture, setup, development workflow, deployment, and contribution guidelines. Also add a small `docs/` layout for component-level documentation and link existing `kiosk/README.md`.

Why: The repository currently lacks central documentation (only `kiosk/` has a README). A clear, discoverable README accelerates onboarding, lowers maintenance friction, and provides a single source of truth for contributors and deployers.

Goals:
- Provide an executive summary and quickstart to run the project locally.
- Document the repo layout, components (`server`, `scanner`, `public`, `kiosk`), and how they interact.
- Include setup steps, dev/run commands, environment variables, and build/deploy notes.
- Point to component-level docs and add a `docs/` folder for future expansion.

Success criteria:
- A `README.md` at repository root with sections: Overview, Architecture, Quickstart, Development, Testing, Deployment, Contributing, and Links.
- `docs/` directory scaffolded with pointers to important component READMEs.
