# Documentation Index

This folder collects the main documentation entry points for the project and keeps component guidance easy to find from a single location.

## Primary docs

- [../README.md](../README.md) — project overview, architecture, quickstart, and deployment notes
- [../server/README.md](../server/README.md) — server API, validation logic, and database-backed endpoints
- [../scanner/README.md](../scanner/README.md) — ingestion workflow, XMP processing, and reconciliation behavior
- [../public/README.md](../public/README.md) — browser UI and static asset layout
- [../kiosk/README.md](../kiosk/README.md) — kiosk service setup and launcher notes

## Legacy and transition notes

- `client_old/` contains earlier client code and is not the current active frontend flow.
- Use the current server and public app documentation as the source of truth for active runtime behavior.

## Purpose

The project uses a split architecture: the scanner collects and prepares metadata, the server exposes API access, and the browser UI renders the gallery. This index is intended to make those responsibilities visible without reading the implementation files directly.
