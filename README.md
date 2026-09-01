# art-display

## Overview

`art-display` is a kiosk-style artwork viewer that ingests image metadata from XMP sidecar files, stores that metadata in PostgreSQL, and serves a rotating gallery through a lightweight web frontend. The system is divided into a backend API, a metadata scanner, a static browser UI, and a kiosk deployment layer.

## Architecture

```text
+------------------+      +-------------------+
|  Source archive  | ---> | scanner/          |
|  + XMP files     |      |  reads metadata   |
+------------------+      +----------+--------+
                                      |
                                      v
                              +------------------+
                              | PostgreSQL DB   |
                              +---------+--------+
                                        |
                                        v
                              +------------------+
                              | server/          |
                              | Express API +    |
                              | file security    |
                              +---------+--------+
                                        |
                                        v
                              +------------------+
                              | public/          |
                              | browser UI       |
                              +------------------+
                                        |
                                        v
                              +------------------+
                              | kiosk/           |
                              | systemd browser  |
                              +------------------+
```

## Repository layout

- `server/` — backend API, database logic, and safe file-serving endpoints
- `scanner/` — metadata ingestion and reconciliation workflow
- `public/` — static front-end assets served by the server
- `kiosk/` — systemd-based kiosk launch configuration and scripts
- `docs/` — repository documentation index and component links
- `openspec/` — proposed and archived change artifacts
- `docker-compose.yml` — local development orchestration
- `client_old/` — legacy client code retained for reference

## Quickstart

Before starting, create a `.env` file in the repository root with the required values for the stack. Example:

```env
POSTGRES_USER=
POSTGRES_PASSWORD=""
POSTGRES_DB=artdisplay
SCANNER_PATH="/path/to/your/archive/root"
IGNORE_TAGS=""
LOG_LEVEL="info"
```

Then start the full stack with Docker Compose:

```bash
docker compose up --build
```

This builds and starts the server and scanner processes according to the repository configuration.

## Deployment

- The app is designed to run with Docker Compose for local development and a kiosk deployment setup for display hardware.
- [kiosk/README.md](kiosk/README.md)` covers the browser startup workflow and systemd service files.
- The server and scanner each include their own Dockerfiles and package-level build scripts.

## Docs and further reading

- [docs/README.md](docs/README.md) — component documentation index
- [server/README.md](server/README.md) — backend API reference and notes
- [scanner/README.md](scanner/README.md) — ingestion pipeline and XMP processing
- [public/README.md](public/README.md) — frontend and browser UI
- [kiosk/README.md](kiosk/README.md) — kiosk setup and launch details
 
