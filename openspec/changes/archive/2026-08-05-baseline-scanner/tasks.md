## 1. Review

- [ ] 1.1 Read `proposal.md`, `design.md`, and `specs/scanner/spec.md` end-to-end
- [ ] 1.2 Cross-check every requirement against the scanner source (`scanner/src/index.ts`, `scanner/src/modules/xmpProcess.ts`, `scanner/src/modules/util.ts`, `scanner/src/modules/db.ts`) and confirm each scenario matches actual current behavior
- [ ] 1.3 Confirm the requirement list is complete (nothing observable in code that is not captured somewhere)

## 2. Corrections

- [ ] 2.1 Note any discrepancies found in step 1.2 and either fix the spec text in place (if it was misdescribed) or open a follow-up change (if the code is buggy but currently deployed as-is — the baseline stays faithful to reality)

## 3. Archive

- [ ] 3.1 Run `openspec validate baseline-scanner --strict`
- [ ] 3.2 Run `openspec archive baseline-scanner` to promote `changes/baseline-scanner/specs/scanner/spec.md` to `openspec/specs/scanner/spec.md`
- [ ] 3.3 Confirm `openspec/specs/scanner/spec.md` exists and `openspec list` shows no active `baseline-scanner`
