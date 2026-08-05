## 1. Configuration & helpers

- [x] 1.1 Add env parsing in `scanner/src/modules/util.ts` (or a new `config.ts`): `RECONCILE_MAX_STALE_FRACTION` (default `0.20`, clamp to `(0, 1]`) and `RECONCILE_FORCE` (boolean, true only when literal `"1"`)
- [x] 1.2 Expose the parsed values via named exports so the reconciliation code can import them without re-reading `process.env`

## 2. Immediate purge on disqualification

- [x] 2.1 Add a `DisplayFileDeleteWriter` in `scanner/src/modules/db.ts` mirroring the existing batch writer pattern (buffer, size flush at 500, 2s interval flush, `close()` on scan end, non-fatal error logging)
- [x] 2.2 Implement the writer's `writeBatch` as `DELETE FROM display_files WHERE path = ANY($1::text[])`
- [x] 2.3 In `scanner/src/modules/xmpProcess.ts` `processOne`, when `containsIgnoreTags(tags)` is true, enqueue a delete for `stripXmpExtension(filePath)` before returning
- [x] 2.4 In the same function, when tags contain neither `SFW` nor `NSFW`, enqueue a delete for `stripXmpExtension(filePath)` before the fingerprint upsert
- [x] 2.5 Wire the delete writer's `close()` into the scan-complete path in `scanner/src/index.ts` alongside `fingerprintWriter.close()` and `displayFileBatchWriter.close()`

## 3. Walked-path set

- [x] 3.1 In `scanner/src/modules/xmpProcess.ts`, thread a `Set<string>` accumulator through `processFilesConcurrently` (or return it from `processOne` and collect in the driver)
- [x] 3.2 Add each processed XMP path to the set unconditionally, including files that were skipped early (unchanged fingerprint, unsupported extension, IGNORE-tagged) — the set represents "seen on disk this scan", not "written"
- [x] 3.3 Confirm the accumulator is safe under the existing worker-pool concurrency (native `Set` writes are single-threaded in Node's event loop, so no lock is needed)

## 4. End-of-scan reconciliation

- [x] 4.1 Add `selectAllFingerprintPaths()` helper in `scanner/src/modules/db.ts` that runs `SELECT path FROM xmp_fingerprints` and returns `string[]`
- [x] 4.2 Add `deleteStaleFingerprintsAndDisplayFiles(stalePaths: string[])` helper that deletes from both tables in one function (two statements, both using `path = ANY($1::text[])`; the `display_files` statement uses paths mapped through `stripXmpExtension`)
- [x] 4.3 In `scanner/src/index.ts`, after the walk and all writer `close()` calls succeed, gather the walked set, call the select helper, compute `stale = dbPaths.filter(p => !walked.has(p))`
- [x] 4.4 Apply the safety guard: if `dbPaths.length === 0`, log and skip. Otherwise compute `fraction = stale.length / dbPaths.length` and compare against the configured threshold; if it exceeds and `RECONCILE_FORCE` is not set, log the warning and skip the delete
- [x] 4.5 If the guard passes, call the delete helper and log the number of `xmp_fingerprints` and `display_files` rows removed

## 5. Failure isolation

- [x] 5.1 Track a scan-scoped `sweepAllowed` boolean; flip to `false` on any thrown error from the walker or a batch flush that surfaces
- [x] 5.2 Ensure that if `sweepAllowed` is false, step 4 skips gracefully with a log message and the scan interval timer keeps running
- [x] 5.3 Verify no code path in the reconciliation phase calls `process.exit`

## 6. Logging

- [x] 6.1 On sweep-runs: `logMessage(\`Reconciliation: removed <N> stale fingerprints, <M> display_files rows (walked <W>, stored <S>).\`, "info")`
- [x] 6.2 On guard-trip: `logMessage(\`Reconciliation: skipped, stale fraction <F> exceeds threshold <T>. Set RECONCILE_FORCE=1 to bypass.\`, "warn")`
- [x] 6.3 On unclean-walk skip: `logMessage("Reconciliation: skipped due to unclean walk.", "warn")`
- [x] 6.4 On force bypass with delete: `logMessage(\`Reconciliation: RECONCILE_FORCE=1 bypassed guard (stale fraction <F>). Proceeding with delete.\`, "info")`

## 7. Manual verification

- [ ] 7.1 Local run: seed a small scan directory, run one scan to populate, delete one XMP file, run again → confirm `xmp_fingerprints` and `display_files` rows for the deleted path are removed
- [ ] 7.2 Local run: modify an XMP file to remove `SFW`/`NSFW` tags, run scan → confirm `display_files` row is gone, `xmp_fingerprints` still present with updated hash
- [ ] 7.3 Local run: add an `IGNORE_TAGS` value and a matching tag to a previously qualifying XMP, run scan → confirm `display_files` row is removed
- [ ] 7.4 Local run: point `SCANDIR` at an empty directory while the DB has rows → confirm the guard trips, warning is logged with the correct fraction, no rows are deleted, and the scan loop continues
- [ ] 7.5 Same as 7.4 with `RECONCILE_FORCE=1` set → confirm the sweep proceeds and rows are removed
- [ ] 7.6 Local run: trigger a walk error (e.g., unreadable file causing an error to propagate out of `processFilesConcurrently`) → confirm reconciliation is skipped with the unclean-walk log and the interval timer still fires next cycle

## 8. Archive prep

- [x] 8.1 Run `openspec validate add-scanner-reconciliation --strict`
- [ ] 8.2 Run `openspec archive add-scanner-reconciliation` after review to promote the delta into `openspec/specs/scanner/spec.md`
