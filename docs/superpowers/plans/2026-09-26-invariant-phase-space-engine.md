# Invariant Phase-Space Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a typed Invariant Phase-Space Engine (IPSE) that lets HCC describe native state spaces, probe declared invariants and monotones, evaluate explicit phase bridges, refuse ill-posed comparisons, expose the results to agents, and inspect them through a Phase Lens without promoting structural similarity into physical identity.

**Architecture:** Add a browser-independent `core/phase/` substrate with adapters that translate existing authoritative laboratory state into one canonical phase contract. The engine remains read-only with respect to the Invariant Nexus and Quantity Bus; it may propose noncanonical candidates, but only explicit registered bridges can carry exact/verified/conditional status. Generated API artifacts and MCP tools are derived from the same core objects so UI, agent and static discovery cannot drift.

**Tech Stack:** Node.js >=18, ECMAScript modules, built-in `node:test`, existing HCC generated API pipeline, existing single-file Atlas UI (`index.html`), existing MCP server and verifier router.

**Spec:** `docs/superpowers/specs/2026-09-26-invariant-phase-space-engine-design.md`

**Target release:** HCC `4.328.0`, build family `invariant-phase-space-engine-2026.09.26`.

## Global Constraints

- Existing laboratory-specific solver code remains authoritative for dynamics; adapters translate state and MUST NOT duplicate solver equations.
- Unknown native structure is `UNDECLARED`, never guessed.
- Display-only coordinates cannot participate in scientific residuals unless an explicit native-space map exists.
- Time semantics are typed and are never silently merged or rescaled.
- Out-of-domain evaluation is `REFUSED`, never silently clamped.
- A monotone or balance-law quantity is never labelled `conserved`.
- Candidate discovery is deterministic, non-ML, noncanonical, review-required, and cannot mutate Nexus.
- Structural fingerprint similarity is an index, not evidence of physical equivalence.
- Every result carries release/version/freshness and provenance metadata.
- Phase-space residuals are model-consistency diagnostics, not empirical calibration.
- The first dissipative adapter is the existing Heat solver.
- The first agent surface is exactly four additive operations: `describe_phase_space`, `probe_invariant`, `compare_phase_spaces`, and `list_phase_bridges`.
- The release target for this branch is `4.328.0`; do not silently retarget the branch during execution.

## Review Focus

1. Non-finite state components (`NaN`, `Infinity`, `-Infinity`) must be refused before any residual or bridge calculation; Task 1 pins this.
2. Equal names with incompatible physical dimensions/units must never count as invariant compatibility; Task 4 pins this.
3. Numerically equal time values with incompatible time semantics must be refused rather than compared; Task 4 pins this.
4. A display-only projection that numerically preserves a quantity must not be accepted as a native-space scientific bridge; Tasks 1 and 4 pin this.
5. A generated phase artifact from another release must remain readable only with explicit stale metadata and must not be promoted to a current verified bridge; Task 10 pins this.

---

## File Structure

### New core files
- `core/phase/contract.mjs` — canonical phase-space, invariant, constraint and projection validators.
- `core/phase/refusals.mjs` — structured `REFUSED` results and compatibility error codes.
- `core/phase/registry.mjs` — immutable registry of phase contracts and explicit bridges.
- `core/phase/invariant-probe.mjs` — scalar, differential, discrete-map and monotonicity diagnostics.
- `core/phase/fingerprint.mjs` — deterministic structural fingerprints.
- `core/phase/bridges.mjs` — explicit bridge validation and evaluation.
- `core/phase/candidates.mjs` — deterministic hard-filtered candidate discovery.
- `core/phase/index.mjs` — public phase-engine exports.
- `core/phase-adapters/navier-stokes-s3.mjs`
- `core/phase-adapters/holonomy.mjs`
- `core/phase-adapters/contact-action.mjs`
- `core/phase-adapters/relativity.mjs`
- `core/phase-adapters/field-heat.mjs`
- `core/phase-adapters/index.mjs`

### New tests
- `test/phase-contract.test.mjs`
- `test/phase-probe.test.mjs`
- `test/phase-bridges.test.mjs`
- `test/phase-candidates.test.mjs`
- `test/phase-adapters-s3.test.mjs`
- `test/phase-adapters-holonomy.test.mjs`
- `test/phase-adapters-contact.test.mjs`
- `test/phase-adapters-relativity.test.mjs`
- `test/phase-adapters-heat.test.mjs`
- `test/phase-agent.test.mjs`

### Existing files modified
- `core/index.mjs` — expose the phase engine and include phase sources in `code_sha256`.
- `server/server.mjs` — add four phase MCP tools.
- `scripts/build-api.mjs` — generate `api/phase-space.json` and additive discovery surfaces.
- `scripts/run-quick-verifiers.mjs` — route IPSE changes through phase/scientific verification.
- `scripts/extract-kernels.mjs` — only if an authoritative existing atlas kernel needed by an adapter is not currently exported.
- `api/agent.json`, `api/openapi.json`, `.well-known/mcp.json`, `api/manifest.json` — generated only.
- `index.html` — Phase Lens UI and source-authority exports where required; no duplicated phase mathematics.
- `README.md`, `SCIENTIFIC_CONTRACT.md`, `version.json` — public contract and release metadata.

---

### Task 1: Canonical phase contract and fail-closed refusal primitives

**Files:** Create `core/phase/contract.mjs`, `core/phase/refusals.mjs`, `test/phase-contract.test.mjs`.

**Interfaces:**
- `definePhaseSpace(spec) -> frozen PhaseSpaceContract`
- `defineInvariant(spec) -> frozen InvariantContract`
- `defineConstraint(spec) -> frozen ConstraintContract`
- `defineProjection(spec) -> frozen ProjectionContract`
- `phaseRefusal(code, message, detail = null) -> { status:'REFUSED', code, message, detail }`
- `assertFiniteNativeState(contract, state) -> state | refusal`

- [ ] Write failing tests for minimal valid contract, missing ids/types, duplicate ids, `UNDECLARED`, non-finite state refusal and display-only exclusion.
- [ ] Run `node --test test/phase-contract.test.mjs`; expect FAIL because implementation is absent.
- [ ] Implement validators/refusals without inferring geometry, dimension, units or time semantics.
- [ ] Run `node --test test/phase-contract.test.mjs`; expect PASS.
- [ ] Commit:
```bash
git add core/phase/contract.mjs core/phase/refusals.mjs test/phase-contract.test.mjs
git commit -m "feat: add canonical phase-space contracts"
```

### Task 2: Registry and invariant probe

**Files:** Create `core/phase/registry.mjs`, `core/phase/invariant-probe.mjs`, `core/phase/index.mjs`, `test/phase-probe.test.mjs`.

**Interfaces:**
- `createPhaseRegistry({ spaces = [], bridges = [] })` with `getSpace(id)`, `listSpaces()`, `getBridge(id)`, `listBridges(filter)`.
- `probeInvariant(contract, invariantId, sample) -> PhaseDiagnostic`.
- `sample` forms: `{ state }`, `{ initialState, state }`, `{ state, vectorField }`, `{ state, nextState }` as allowed by the declared evolution/invariant class.

- [ ] Write failing tests for exact scalar conservation, deliberate drift, discrete-map delta, `gradI·F`, monotone decrease, unknown invariant refusal and display-only refusal.
- [ ] Run `node --test test/phase-probe.test.mjs`; expect FAIL.
- [ ] Implement registry/probe; normalized residuals use only declared normalization policy.
- [ ] Run `node --test test/phase-probe.test.mjs`; expect PASS.
- [ ] Commit:
```bash
git add core/phase/registry.mjs core/phase/invariant-probe.mjs core/phase/index.mjs test/phase-probe.test.mjs
git commit -m "feat: probe declared phase invariants"
```

### Task 3: Structural fingerprints and deterministic candidate discovery

**Files:** Create `core/phase/fingerprint.mjs`, `core/phase/candidates.mjs`, `test/phase-candidates.test.mjs`; modify `core/phase/index.mjs`.

**Interfaces:**
- `phaseFingerprint(contract) -> frozen fingerprint`
- `discoverCandidateBridges({ registry, nexusRelations = [], quantityRoutes = [] }) -> CandidateBridge[]`
- Each candidate: `noncanonical:true`, `review_required:true`, `score`, `terms`, `passed`, `unproven`, `motivated_by`.

- [ ] Write failing tests proving deterministic ordering, hard rejection of dimension/domain incompatibility, explicit score terms and zero registry mutation.
- [ ] Run `node --test test/phase-candidates.test.mjs`; expect FAIL.
- [ ] Implement fingerprint/ranking using declared features only.
- [ ] Run `node --test test/phase-candidates.test.mjs`; expect PASS.
- [ ] Commit:
```bash
git add core/phase/fingerprint.mjs core/phase/candidates.mjs core/phase/index.mjs test/phase-candidates.test.mjs
git commit -m "feat: discover reviewable phase candidates"
```

### Task 4: Typed phase bridge evaluator

**Files:** Create `core/phase/bridges.mjs`, `test/phase-bridges.test.mjs`; modify `core/phase/index.mjs`.

**Interfaces:**
- `definePhaseBridge(spec) -> frozen PhaseBridgeContract`
- `evaluatePhaseBridge(bridge, sourceContract, targetContract, sample = {}) -> PhaseBridgeReport`
- statuses: `EXACT_MAP`, `NUMERICALLY_VERIFIED_MAP`, `CONDITIONAL_MAP`, `STRUCTURAL_ANALOGY`, `CANDIDATE_BRIDGE`, `REFUSED`.

- [ ] Write failing tests for exact/incorrect pullback, incompatible units/dimensions, incompatible time semantics, missing geometry, explicit time reparameterization, and projection-only similarity.
- [ ] Run `node --test test/phase-bridges.test.mjs`; expect FAIL.
- [ ] Implement hard compatibility checks before any numeric comparison; evaluate only explicitly declared maps/verifiers.
- [ ] Run `node --test test/phase-bridges.test.mjs`; expect PASS.
- [ ] Commit:
```bash
git add core/phase/bridges.mjs core/phase/index.mjs test/phase-bridges.test.mjs
git commit -m "feat: evaluate typed phase-space bridges"
```

### Task 5: S³ Navier–Stokes/Euler adapter

**Files:** Create `core/phase-adapters/navier-stokes-s3.mjs`, `test/phase-adapters-s3.test.mjs`; modify `scripts/extract-kernels.mjs` and `index.html` only if the needed existing `nsf*` symbols are not exported; regenerate `core/atlas/extracted.mjs` through the extractor.

**Interface:** `navierStokesS3PhaseAdapter() -> PhaseSpaceContract` backed by the existing generated `nsf*` authority.

- [ ] Write failing tests for S³ normalization, reproduced existing exact-solution residual, non-unit native-state refusal, and viscous energy classified as decay/balance rather than conserved.
- [ ] Run `node --test test/phase-adapters-s3.test.mjs`; expect FAIL.
- [ ] Export only required authoritative `nsf*` symbols via `scripts/extract-kernels.mjs` if needed; never hand-edit `core/atlas/extracted.mjs`.
- [ ] Implement the adapter without duplicating the solver equations.
- [ ] Run `node --test test/phase-adapters-s3.test.mjs && node docs/verify-navier-stokes-on-s3-integrated.cjs`; expect PASS.
- [ ] Commit:
```bash
git add core/phase-adapters/navier-stokes-s3.mjs test/phase-adapters-s3.test.mjs scripts/extract-kernels.mjs core/atlas/extracted.mjs index.html
git commit -m "feat: adapt S3 fluid dynamics to phase space"
```
If `scripts/extract-kernels.mjs`, `core/atlas/extracted.mjs` or `index.html` are unchanged, omit them from `git add`.

### Task 6: Holonomy adapter

**Files:** Create `core/phase-adapters/holonomy.mjs`, `test/phase-adapters-holonomy.test.mjs`.

**Interface:** `holonomyPhaseAdapter() -> PhaseSpaceContract` with path/return-map semantics and existing group-valued invariants; no invented continuous Hamiltonian flow.

- [ ] Write failing tests for S² Levi-Civita return, Berry/Pancharatnam phase, SU(2) trace/conjugacy behavior, and refusal of a continuous-flow diagnostic for a return-map-only contract.
- [ ] Run `node --test test/phase-adapters-holonomy.test.mjs`; expect FAIL.
- [ ] Implement against existing authoritative kernels/identities only.
- [ ] Run `node --test test/phase-adapters-holonomy.test.mjs`; expect PASS.
- [ ] Commit `core/phase-adapters/holonomy.mjs` and its test as `feat: adapt holonomy observatory to phase space`.

### Task 7: Contact & Action adapter

**Files:** Create `core/phase-adapters/contact-action.mjs`, `test/phase-adapters-contact.test.mjs`.

**Interface:** `contactActionPhaseAdapter() -> PhaseSpaceContract` with contact/Reeb carrier, return/action diagnostics and declared Legendrian constraints.

- [ ] Write failing tests for contact normalization/action diagnostics, rejection of undeclared symplectic preservation, and preservation of the existing 2π/4π metaplectic representation distinction only at its declared status.
- [ ] Run `node --test test/phase-adapters-contact.test.mjs`; expect FAIL.
- [ ] Implement adapter.
- [ ] Run `node --test test/phase-adapters-contact.test.mjs`; expect PASS.
- [ ] Commit as `feat: adapt contact and action dynamics`.

### Task 8: Relativity adapter

**Files:** Create `core/phase-adapters/relativity.mjs`, `test/phase-adapters-relativity.test.mjs`.

**Interface:** `relativityPhaseAdapter() -> PhaseSpaceContract` with native Minkowski state, frame semantics, Lorentz transformation family, causal structure and interval invariants.

- [ ] Write failing tests for interval preservation across timelike/null/spacelike samples, determinant/sign requirements, frame metadata, and refusal to treat the visual 2+1 projection as full native 3+1 state.
- [ ] Run `node --test test/phase-adapters-relativity.test.mjs`; expect FAIL.
- [ ] Implement against the existing Lorentz/boost authority.
- [ ] Run `node --test test/phase-adapters-relativity.test.mjs && node docs/verify-spacetime-boosted-live.cjs`; expect PASS.
- [ ] Commit as `feat: adapt Lorentz state to phase space`.

### Task 9: Heat adapter and initial adapter registry

**Files:** Create `core/phase-adapters/field-heat.mjs`, `core/phase-adapters/index.mjs`, `test/phase-adapters-heat.test.mjs`.

**Interfaces:**
- `heatPhaseAdapter() -> PhaseSpaceContract`
- `INITIAL_PHASE_SPACES` containing the five initial adapters.

- [ ] Write failing tests proving Heat energy/norm diagnostic is monotone/balance-law, invalid timestep/domain is refused, and visual grid scaling does not alter native diagnostics.
- [ ] Run `node --test test/phase-adapters-heat.test.mjs`; expect FAIL.
- [ ] Implement Heat adapter and adapter registry.
- [ ] Run `node --test test/phase-adapters-heat.test.mjs && node docs/verify-the-solvers-own-diffusion.cjs && node docs/verify-the-laws-of-a-field.cjs`; expect PASS.
- [ ] Commit as `feat: add dissipative heat phase adapter`.

### Task 10: Integrate IPSE into CORE and generate one truthful static artifact

**Files:** Modify `core/index.mjs`, `scripts/build-api.mjs`; create generated `api/phase-space.json`; create `test/phase-agent.test.mjs`.

**Interfaces:**
- `CORE.phase.describe(labId)`
- `CORE.phase.probe(labId, invariantId, input = {})`
- `CORE.phase.compare(labA, labB, input = {})`
- `CORE.phase.bridges({ labA = null, labB = null, status = null, includeCandidates = false })`
- `api/phase-space.json` schema `hcc.phase-space/1` containing release/core identity, freshness, spaces, bridges and noncanonical candidates.

- [ ] Write failing tests for five initial spaces, explicit unknown-lab failure, noncanonical candidate separation, live/static id/status agreement and stale-artifact behavior.
- [ ] Run `node --test test/phase-agent.test.mjs`; expect FAIL.
- [ ] Add every new phase/adaptor source to `coreHash()` and expose `CORE.phase`.
- [ ] Generate `api/phase-space.json` from live core objects; never hand-edit it.
- [ ] Run `node --test test/phase-agent.test.mjs && node scripts/build-api.mjs && git diff --exit-code api/phase-space.json`; expect PASS/no regeneration drift.
- [ ] Commit:
```bash
git add core/index.mjs scripts/build-api.mjs api/phase-space.json test/phase-agent.test.mjs
git commit -m "feat: publish phase-space registry"
```

### Task 11: Add the four MCP phase operations

**Files:** Modify `server/server.mjs`, `scripts/build-api.mjs`, `test/phase-agent.test.mjs`; regenerate `.well-known/mcp.json`, `api/openapi.json`, `api/agent.json`, `api/manifest.json`.

**Interfaces:**
- `describe_phase_space({lab_id})`
- `probe_invariant({lab_id, invariant_id, input?})`
- `compare_phase_spaces({lab_a, lab_b, input?})`
- `list_phase_bridges({lab_a?, lab_b?, status?, include_candidates?})`

- [ ] Add failing tests that all four tools exist, unknown ids fail explicitly, `include_candidates` defaults false, and `REFUSED` is returned rather than substituted.
- [ ] Run `node --test test/phase-agent.test.mjs`; expect FAIL for missing tools.
- [ ] Add the four tools to the single `TOOLS` authority and generated OpenAPI/discovery outputs.
- [ ] Run `node scripts/build-api.mjs && node --test test/phase-agent.test.mjs test/agent-client.test.mjs`; expect PASS.
- [ ] Commit generated and source files as `feat: expose phase-space MCP tools`.

### Task 12: Phase Lens UI

**Files:** Modify `index.html`; create `docs/verify-the-phase-lens.cjs`; modify `scripts/run-quick-verifiers.mjs`.

**Interface:** Phase Lens from supported laboratory/Nexus inspection state, with local phase summary, invariant slice, bridge inspector and explicit refusal presentation. The UI consumes phase authority; it does not duplicate formulas.

- [ ] Write failing verifier for carrier/state, evolution parameter, constraints/invariants, validity domain, bridge status, candidate label, projection label and refusal reason. Exact/candidate/refused grammar must remain distinguishable without color.
- [ ] Run `node docs/verify-the-phase-lens.cjs`; expect FAIL.
- [ ] Implement thin visual projections; visual quality controls must not alter state/residual/tolerance/status/export.
- [ ] Run `node docs/verify-the-phase-lens.cjs && node docs/verify-nexus-carries-every-kind.cjs && node docs/verify-every-laboratory-keeps-its-invariants.cjs && node docs/verify-the-atlas-of-invariants.cjs`; expect PASS.
- [ ] Commit as `feat: add invariant phase lens`.

### Task 13: CI routing, scientific contract and release `4.328.0`

**Files:** Modify `package.json`, `scripts/run-quick-verifiers.mjs`, `README.md`, `SCIENTIFIC_CONTRACT.md`, `version.json`; regenerate all affected `api/` and `.well-known/` artifacts plus extracted/manifest authority through existing build scripts.

**Interfaces:**
- Add `test:phase`: `node --test test/phase-*.test.mjs`.
- Quick verifier routing runs phase tests whenever `core/phase/`, `core/phase-adapters/`, phase MCP tools, `api/phase-space.json` or Phase Lens symbols change.
- Set release `version` to `4.328.0` and build to `invariant-phase-space-engine-2026.09.26.43`.
- Docs repeat that phase similarity does not establish physical identity and S³ remains a conditional reconstruction, not detected topology.

- [ ] Add a failing deterministic router/self-check proving an IPSE-path change schedules phase tests and the Phase Lens verifier.
- [ ] Add `test:phase`, CI routing, docs and exact release metadata `4.328.0` / `invariant-phase-space-engine-2026.09.26.43`.
- [ ] Regenerate all machine-facing artifacts from source authority.
- [ ] Run `npm run test:phase`; expect PASS.
- [ ] Run `npm run test:source`; expect PASS.
- [ ] Run `npm run test:release`; expect PASS.
- [ ] Run existing extraction/API/manifest generation once more and `git status --short`; expect no generated drift apart from intended staged release files.
- [ ] Commit as `release: integrate invariant phase-space engine`.

### Task 14: Whole-branch verification before integration

**Files:** No product changes unless verification reveals a defect. Any defect fix is a separate focused commit.

- [ ] Run `npm run test:phase`; expect PASS.
- [ ] Run `npm run test:source`; expect PASS.
- [ ] Run `npm run test:release`; expect PASS.
- [ ] Run `git diff --check main...HEAD && git diff --stat main...HEAD`; expect no whitespace errors and scope limited to IPSE/spec/plan/generated outputs/release docs.
- [ ] If a defect is found, fix only that defect, rerun all four checks and commit it with a focused `fix:` message. If nothing fails, create no empty commit.
