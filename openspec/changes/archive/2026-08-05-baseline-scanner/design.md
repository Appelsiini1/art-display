## Context

The scanner has been in production for some time but has never had a written specification. This change adopts OpenSpec by capturing existing scanner behavior verbatim, so future changes can propose focused deltas instead of redocumenting everything. No behavior is being altered, added, or removed.

The scanner runs as a container (see `scanner/Dockerfile`) and reaches the database indirectly through the server API's `/status` endpoint before starting scans. It uses PostgreSQL via `pg` and processes files concurrently with a worker-pool pattern.

## Goals / Non-Goals

**Goals:**
- Faithfully document current scanner behavior as the initial `scanner` capability spec.
- Establish the capability boundary and terminology (walk, fingerprint, classification, batch writer) that later changes will reference.
- Provide a stable reference point for the upcoming `add-scanner-reconciliation` change.

**Non-Goals:**
- No code changes.
- No corrections or "cleanups" of behavior that looks odd (e.g., IGNORE-tagged files never getting their fingerprint cached — that's current behavior and stays until a change proposes to fix it).
- Server API and client viewer capabilities are not baselined here. They will be captured when a change first touches them.
- Deployment concerns (Docker, kiosk, systemd) are out of scope for capability specs.

## Decisions

**Decision: Baseline as-is, warts included.**
Rationale: A baseline that quietly "improves" behavior in prose creates spec-vs-reality drift and undermines the delta process. Odd-looking behaviors get captured accurately and can be addressed by named future changes.
Alternatives: writing an "aspirational" baseline that describes intended behavior. Rejected — it defeats the point.

**Decision: One capability, `scanner`.**
Rationale: The scanner is a cohesive unit — walk, parse, classify, persist. Splitting into `filesystem-walk`, `xmp-parsing`, `db-writer` etc. adds bureaucracy without independent evolution.
Alternatives: multi-capability decomposition. Rejected as premature.

**Decision: Environment variables and database schema are documented as scenarios where they affect observable behavior, not as separate "configuration" or "schema" requirements.**
Rationale: OpenSpec specs are about capability requirements. Env vars are inputs to those requirements; DB tables are outputs. Documenting them in-line keeps the spec focused on behavior.

## Risks / Trade-offs

**Risk**: Baseline may inadvertently canonize a bug as "spec." → **Mitigation**: The upcoming `add-scanner-reconciliation` change already targets one known gap (no cleanup path). Others can be raised as their own changes.

**Risk**: Documenting current behavior takes reading time that could be spent on the reconciliation change directly. → **Mitigation**: The baseline is small (one capability, ~7 requirements) and pays for itself the moment the second change lands.

**Risk**: Future contributors treat the baseline as "what we should do" rather than "what we do today." → **Mitigation**: The `Non-Goals` section here and the proposal's framing make it explicit that this documents current state.

## Migration Plan

None. Documentation-only change. Archive after review promotes `changes/baseline-scanner/specs/scanner/spec.md` to `specs/scanner/spec.md`.

## Open Questions

None. The current behavior is observable in the code; there is nothing to decide.
