# Scanner

The scanner is the ingestion pipeline for the art-display system. It walks a configured source directory, reads XMP metadata files, and writes the resulting artwork metadata into the PostgreSQL database used by the app.

## Responsibilities

- Discover image and XMP files under a configured source archive.
- Parse XMP metadata such as tags, artist names, and rating values.
- Detect and reconcile stale database entries.
- Insert or update display records so the server and viewer can serve artwork reliably.

## Runtime entry points

- `src/index.ts` — scan loop, reconciliation flow, and startup behavior.
- `src/modules/xmpProcess.ts` — file processing and metadata extraction.
- `src/modules/db.ts` — database writes for fingerprints and display rows.
- `src/modules/util.ts` — environment parsing, logging, and retry helpers.

## Local development

From the repository root:

```bash
docker-compose up --build
```

For direct local execution:

```bash
cd scanner
npm install
npm run build
npm run start
```

The scanner expects environment values such as the archive root and Postgres connectivity to be available before startup.

## Environment variables

```env
SCANDIR="/path/to/your/archive/root"
IGNORE_TAGS=""
LOG_LEVEL="info"

# Optional
ARTIST_FOLDER_REGEX="Artist Archive[\\/\\]+([^\\/\\]+)"
RECONCILE_MAX_STALE_FRACTION=0.2
RECONCILE_FORCE=0
```

The project also relies on the Postgres configuration used by the rest of the stack.

## Important workflow notes

- The scanner expects XMP sidecar files next to the source images.
- The app is designed to work with an external metadata workflow such as Immich or another tool that writes the necessary XMP files.
- It logs progress and can reconcile stale fingerprint rows when the directory walk changes.

## Related documentation

- [../README.md](../README.md) — project overview and setup
- [../docs/README.md](../docs/README.md) — docs index
- [../server/README.md](../server/README.md) — API layer that serves scanner content
