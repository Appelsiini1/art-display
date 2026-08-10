## 1. IGNORE branch fingerprint upsert

- [x] 1.1 In `scanner/src/modules/xmpProcess.ts` `processOne`, extend the `containsIgnoreTags(tags)` branch to `await fingerprintWriter.add({ path: filePath, ...fingerprint })` after enqueuing the `displayFileDeleteWriter.add(...)` call and before returning
- [x] 1.2 Confirm the branch order is: enqueue delete → upsert fingerprint → return (matches design decision on crash-consistency ordering)

## 2. Await batch writer add() calls

- [x] 2.1 In `scanner/src/modules/xmpProcess.ts` `processOne`, change `displayFileBatchWriter.add(df)` to `await displayFileBatchWriter.add(df)`
- [x] 2.2 In the same file, change both `displayFileDeleteWriter.add(stripXmpExtension(filePath))` call sites to `await displayFileDeleteWriter.add(stripXmpExtension(filePath))`
- [x] 2.3 Confirm all `.add()` call sites on the three batch writers (`fingerprintWriter`, `displayFileBatchWriter`, `displayFileDeleteWriter`) are now consistently awaited

## 3. Verification

- [x] 3.1 Run `npx tsc --noEmit` in `scanner/` — no errors
- [x] 3.2 Local run: scan a directory with an IGNORE-tagged file, then run again → confirm the second scan logs "Skipping file '...' based on unchanged metadata." for that file (indicating fingerprint cache hit)
- [x] 3.3 Local run: simulate a batch flush failure (e.g., temporarily drop DB permission for `display_files`) mid-scan → confirm the walk aborts, an error is logged, reconciliation is skipped with the unclean-walk message, and the scan loop stays alive for the next daily interval
- [x] 3.4 Local run: verify the IGNORE-branch fingerprint is written even on the first observation (query `SELECT * FROM xmp_fingerprints WHERE path = '<ignored-file.xmp>'` and confirm a row exists after the scan)

## 4. Archive prep

- [x] 4.1 Confirm `add-scanner-reconciliation` has been archived (the MODIFIED delta in this change targets the reconciliation-updated requirement)
- [x] 4.2 Run `openspec validate fix-scanner-write-hygiene --strict`
- [ ] 4.3 Run `openspec archive fix-scanner-write-hygiene` after review to fold the updated IGNORE scenario into `openspec/specs/scanner/spec.md`
