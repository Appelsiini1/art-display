# Design: How to secure `/img/random` and `/img/file`

Goals:
- Ensure any filesystem path resolved from the DB is inside the configured images root.
- Prevent directory traversal and symlink attacks by resolving canonical paths.
- Confirm the target is a regular file and not a directory.
- Verify the file's content-type is an allowed image type before streaming.

Approach:
1. Add a new utility `isSafeImagePath(baseRoot: string, candidatePath: string): Promise<boolean>` that:
   - Resolves `candidatePath` to an absolute canonical path (follow symlinks) using `fs.realpath()`.
   - Resolves `baseRoot` to canonical path and ensures the candidate path starts with baseRoot.
   - Checks `stat` to ensure it's a regular file and readable.
   - Optionally checks file size limits.
2. Add `detectImageMimeType(filePath: string): Promise<string|null>` to sniff bytes (first N bytes) and confirm image MIME (png, jpeg, gif, webp). If runtime libs exist, use `file-type` or similar.
3. Update endpoints:
   - `/img/file`: after loading the DB entry, validate the stored path via `isSafeImagePath` and `detectImageMimeType` before serving. Return `404` if invalid.
   - `/img/random`: when selecting a random DB entry, perform same validation; if invalid, skip and try another, with an upper retry cap. If none valid, return `404`.
4. Fail-safe: if validation fails, do not expose underlying filesystem paths in responses or logs; use generic error messages and `404`/`400` as appropriate.

Notes:
- Configuration: use existing config for images root (e.g., `IMAGES_ROOT`) or add one. Keep default compatible with current behavior.
- Tests: unit tests for `isSafeImagePath` (normal path, traversal attempts, symlink outside root), and endpoint integration tests.
