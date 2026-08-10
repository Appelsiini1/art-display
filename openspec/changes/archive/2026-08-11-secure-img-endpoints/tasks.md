# Implementation Tasks

1. Add validation utilities
   - [x] Create `server/src/modules/fileSecurity.ts` with `isSafeImagePath` and `detectImageMimeType`.
2. Wire config
   - [x] Ensure an `IMAGES_ROOT` config value is available to the server; fallback to current images folder if present.
3. Update endpoints
   - [x] Modify `/img/file` handler to validate file path before serving. Return `404` when invalid.
   - [x] Modify `/img/random` handler to validate candidates and skip invalid entries; add retry cap.
5. Review & deploy
   - [x] Code review, run tests, deploy.

Estimated effort: 1-2 days.
