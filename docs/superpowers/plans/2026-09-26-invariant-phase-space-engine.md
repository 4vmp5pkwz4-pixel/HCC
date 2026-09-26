# Invariant Phase-Space Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a typed Invariant Phase-Space Engine (IPSE) that lets HCC describe native state spaces, probe declared invariants and monotones, evaluate explicit phase bridges, refuse ill-posed comparisons, expose the results to agents, and inspect them through a Phase Lens without promoting structural similarity into physical identity.

**Architecture:** Add a browser-independent `core/phase/` substrate with adapters that translate existing authoritative laboratory state into one canonical phase contract. The engine remains read-only with respect to the Invariant Nexus and Quantity Bus; it can propose noncanonical candidates, but only explicit registered bridges can carry exact/verified/conditional status. Generated API artifacts and MCP tools are derived from the same core objects so UI, agent and static discovery cannot drift.

**Tech Stack:** Node.js >=18, ECMAScript modules, built-in `node:test`, existing HCC generated API pipeline, existing single-file Atlas UI (`index.html`), existing MCP server and verifier router.

**Spec:** `docs/superpowers/specs/2026-09-26-invariant-phase-space-engine-design.md`

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
- `core/phase/refusals.mjs` — structured `REFUSED` result constructor and compatibility error codes.
- `core/phase/registry.mjs` — immutable registry of phase contracts and explicit bridges.
- `core/phase/invariant-probe.mjs` — scalar, differential, discrete-map and monotonicity diagnostics.
- `core/phase/fingerprint.mjs` — deterministic structural fingerprints.
- `core/phase/bridges.mjs` — explicit bridge validation and evaluation.
- `core/phase/candidates.mjs` — deterministic hard-filtered candidate discovery.
- `core/phase/index.mjs` — public phase-engine exports.
- `core/phase-adapters/navier-stokes-s3.mjs` — S³ Navier–Stokes/Euler adapter backed by extracted atlas kernels.
- `core/phase-adapters/holonomy.mjs` — Holonomy Observatory adapter.
- `core/phase-adapters/contact-action.mjs` — Contact & Action adapter.
- `core/phase-adapters/relativity.mjs` — Minkowski/Lorentz adapter.
- `core/phase-adapters/field-heat.mjs` — dissipative Heat adapter.
- `core/phase-adapters/index.mjs` — initial adapter registry.

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

- `core/index.mjs` — expose the phase engine and include its source files in `code_sha256`.
- `server/server.mjs` — add the four phase MCP tools.
- `scripts/build-api.mjs` — generate `api/phase-space.json` and include the additive agent/MCP surface in generated discovery.
- `scripts/run-quick-verifiers.mjs` — route IPSE changes through phase unit tests and the relevant scientific verifiers.
- `api/agent.json`, `api/openapi.json`, `.well-known/mcp.json`, `api/manifest.json` — generated, never hand-edited.
- `index.html` — Phase Lens UI and adapter-facing visual inspection hooks only; no duplicated phase mathematics.
- `README.md`, `SCIENTIFIC_CONTRACT.md`, `version.json` — public contract/release documentation after implementation passes.

---

### Task 1: Canonical phase contract and fail-closed refusal primitives

**Files:**
- Create: `core/phase/contract.mjs`
- Create: `core/phase/refusals.mjs`
- Create: `test/phase-contract.test.mjs`

**Interfaces:**
- Produces: `definePhaseSpace(spec) -> frozen PhaseSpaceContract`
- Produces: `defineInvariant(spec) -> frozen InvariantContract`
- Produces: `defineConstraint(spec) -> frozen ConstraintContract`
- Produces: `defineProjection(spec) -> frozen ProjectionContract`
- Produces: `phaseRefusal(code, message, detail = null) -> { status:'REFUSED', code, message, detail }`
- Produces: `assertFiniteNativeState(contract, state)` which returns the state or a refusal object.

- [ ] **Step 1: Write failing contract tests**

Assert that a minimal finite static phase contract freezes successfully; missing required ids/types fail; unknown structure remains `UNDECLARED`; `NaN`/infinite native coordinates are refused; display-only coordinates are marked ineligible for invariant checks.

- [ ] **Step 2: Run the tests and verify failure**

Run: `node --test test/phase-contract.test.mjs`
Expected: FAIL because `core/phase/contract.mjs` and `refusals.mjs` do not exist.

- [ ] **Step 3: Implement the minimal validators and refusal constructor**

`definePhaseSpace` must normalize only declared metadata, preserve native/display coordinate roles, and reject duplicate coordinate/invariant ids. It must not infer metric, symplectic/contact structure, dimension, units, or time semantics.

- [ ] **Step 4: Run the tests and verify pass**

Run: `node --test test/phase-contract.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add core/phase/contract.mjs core/phase/refusals.mjs test/phase-contract.test.mjs
git commit -m "feat: add canonical phase-space contracts"
```

### Task 2: Registry and invariant probe

**Files:**
- Create: `core/phase/registry.mjs`
- Create: `core/phase/invariant-probe.mjs`
- Create: `core/phase/index.mjs`
- Create: `test/phase-probe.test.mjs`

**Interfaces:**
- Consumes: Task 1 contracts/refusals.
- Produces: `createPhaseRegistry({ spaces = [], bridges = [] })` with `getSpace(id)`, `listSpaces()`, `getBridge(id)`, `listBridges(filter)`.
- Produces: `probeInvariant(contract, invariantId, sample) -> PhaseDiagnostic`.
- `sample` supports `{ state }`, `{ initialState, state }`, `{ state, vectorField }`, or `{ state, nextState }` according to invariant/evolution class.

- [ ] **Step 1: Write failing probe tests**

Cover exact scalar conservation, deliberate drift, discrete-map delta, differential `gradI·F`, monotone decrease, unknown invariant refusal, and refusal when the requested diagnostic uses display-only state.

- [ ] **Step 2: Verify failure**

Run: `node --test test/phase-probe.test.mjs`
Expected: FAIL because registry/probe are absent.

- [ ] **Step 3: Implement registry and probe**

Raw dimensional diagnostics remain raw. Normalized residuals use only the invariant's declared normalization policy; no display range or inferred scale is allowed.

- [ ] **Step 4: Verify pass**

Run: `node --test test/phase-probe.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add core/phase/registry.mjs core/phase/invariant-probe.mjs core/phase/index.mjs test/phase-probe.test.mjs
git commit -m "feat: probe declared phase invariants"
```

### Task 3: Structural phase fingerprints and candidate discovery

**Files:**
- Create: `core/phase/fingerprint.mjs`
- Create: `core/phase/candidates.mjs`
- Create: `test/phase-candidates.test.mjs`
- Modify: `core/phase/index.mjs`

**Interfaces:**
- Consumes: `PhaseSpaceContract`, registry.
- Produces: `phaseFingerprint(contract) -> frozen fingerprint`.
- Produces: `discoverCandidateBridges({ registry, nexusRelations = [], quantityRoutes = [] }) -> CandidateBridge[]`.
- Every candidate returns `noncanonical:true`, `review_required:true`, `score`, `terms`, `passed`, `unproven`, `motivated_by`.

- [ ] **Step 1: Write failing deterministic-candidate tests**

Two identical inputs must produce byte-for-byte equivalent sorted candidates; candidates with incompatible physical dimensions or no domain overlap must be filtered before ranking; `terms` must expose every score contribution; no registry mutation is permitted.

- [ ] **Step 2: Verify failure**

Run: `node --test test/phase-candidates.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement fingerprint and deterministic ranking**

Only declared features participate. Similarity never changes relation status and cannot create a canonical bridge.

- [ ] **Step 4: Verify pass**

Run: `node --test test/phase-candidates.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add core/phase/fingerprint.mjs core/phase/candidates.mjs core/phase/index.mjs test/phase-candidates.test.mjs
git commit -m "feat: discover reviewable phase candidates"
```

### Task 4: Typed phase bridge evaluator

**Files:**
- Create: `core/phase/bridges.mjs`
- Create: `test/phase-bridges.test.mjs`
- Modify: `core/phase/index.mjs`

**Interfaces:**
- Produces: `definePhaseBridge(spec) -> frozen PhaseBridgeContract`.
- Produces: `evaluatePhaseBridge(bridge, sourceContract, targetContract, sample = {}) -> PhaseBridgeReport`.
- Supported statuses: `EXACT_MAP`, `NUMERICALLY_VERIFIED_MAP`, `CONDITIONAL_MAP`, `STRUCTURAL_ANALOGY`, `CANDIDATE_BRIDGE`, `REFUSED`.

- [ ] **Step 1: Write failing bridge tests**

Cover exact invariant pullback, deliberately incorrect pullback, incompatible units/dimensions, numerically equal but semantically incompatible time parameters, missing geometric structure, explicit time reparameterization, and display-projection-only similarity. The last five must fail closed with structured refusal codes.

- [ ] **Step 2: Verify failure**

Run: `node --test test/phase-bridges.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement bridge definition/evaluation**

The evaluator runs hard compatibility checks before numeric comparison. It may evaluate invariant, flow, and geometric-structure checks only when the bridge explicitly declares the corresponding maps/verifiers.

- [ ] **Step 4: Verify pass**

Run: `node --test test/phase-bridges.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add core/phase/bridges.mjs core/phase/index.mjs test/phase-bridges.test.mjs
git commit -m "feat: evaluate typed phase-space bridges"
```

### Task 5: S³ Navier–Stokes/Euler adapter

**Files:**
- Create: `core/phase-adapters/navier-stokes-s3.mjs`
- Create: `test/phase-adapters-s3.test.mjs`

**Interfaces:**
- Consumes: authoritative extracted S³ Navier–Stokes kernels from `core/atlas/extracted.mjs` (`nsf*` family already generated from `index.html`).
- Produces: `navierStokesS3PhaseAdapter() -> PhaseSpaceContract`.
- Declares S³/native quaternion state, physical/model time exactly as the existing laboratory does, divergence/tangent constraints, and only invariants/balance quantities already justified by the underlying lab.

- [ ] **Step 1: Write failing adapter tests**

Verify state remains on S³, existing exact carried solution residual is reproduced through the adapter rather than reimplemented, invalid non-unit native state is refused, and viscous energy decay is not called conserved.

- [ ] **Step 2: Verify failure**

Run: `node --test test/phase-adapters-s3.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Export only the required generated `nsf*` kernels from `core/atlas/extracted.mjs` through the existing extractor authority, then implement the adapter**

Do not hand-edit `core/atlas/extracted.mjs`; if exports are missing, modify the extractor/source authority so regeneration produces them.

- [ ] **Step 4: Verify adapter and extraction integrity**

Run: `node --test test/phase-adapters-s3.test.mjs && node docs/verify-navier-stokes-on-s3-integrated.cjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add core/phase-adapters/navier-stokes-s3.mjs test/phase-adapters-s3.test.mjs scripts core/atlas/extracted.mjs index.html
git commit -m "feat: adapt S3 fluid dynamics to phase space"
```

### Task 6: Holonomy adapter

**Files:**
- Create: `core/phase-adapters/holonomy.mjs`
- Create: `test/phase-adapters-holonomy.test.mjs`

**Interfaces:**
- Produces: `holonomyPhaseAdapter() -> PhaseSpaceContract`.
- Declares path/return-map semantics and group-valued invariants already present in the Holonomy Observatory; does not recast them as a continuous Hamiltonian flow.

- [ ] **Step 1: Write failing tests**

Pin S² Levi-Civita return, Berry/Pancharatnam group phase, SU(2) trace/conjugacy behavior, and refusal when a continuous-flow diagnostic is requested from a return-map-only declaration.

- [ ] **Step 2: Verify failure**

Run: `node --test test/phase-adapters-holonomy.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement adapter against existing authoritative kernels**

- [ ] **Step 4: Verify pass**

Run: `node --test test/phase-adapters-holonomy.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add core/phase-adapters/holonomy.mjs test/phase-adapters-holonomy.test.mjs
git commit -m "feat: adapt holonomy observatory to phase space"
```

### Task 7: Contact & Action adapter

**Files:**
- Create: `core/phase-adapters/contact-action.mjs`
- Create: `test/phase-adapters-contact.test.mjs`

**Interfaces:**
- Produces: `contactActionPhaseAdapter() -> PhaseSpaceContract`.
- Declares contact/Reeb carrier, return/action diagnostics, Legendrian constraints and any exact normalization from the existing observatory.

- [ ] **Step 1: Write failing tests**

Verify Reeb/contact normalization and action diagnostics; reject symplectic-preservation requests when only contact structure is declared; preserve the existing 2π/4π metaplectic distinction only as its declared representation result.

- [ ] **Step 2: Verify failure**

Run: `node --test test/phase-adapters-contact.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement adapter**

- [ ] **Step 4: Verify pass**

Run: `node --test test/phase-adapters-contact.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add core/phase-adapters/contact-action.mjs test/phase-adapters-contact.test.mjs
git commit -m "feat: adapt contact and action dynamics"
```

### Task 8: Relativity adapter

**Files:**
- Create: `core/phase-adapters/relativity.mjs`
- Create: `test/phase-adapters-relativity.test.mjs`

**Interfaces:**
- Produces: `relativityPhaseAdapter() -> PhaseSpaceContract`.
- Declares Minkowski event/vector state, frame semantics, Lorentz transformation family, causal structure and interval invariants from the existing relativity laboratory.

- [ ] **Step 1: Write failing tests**

Verify Lorentz interval preservation for timelike/null/spacelike samples, determinant/sign requirements, frame metadata, and refusal of a bridge that treats visual 2+1 display coordinates as the full native 3+1 state.

- [ ] **Step 2: Verify failure**

Run: `node --test test/phase-adapters-relativity.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement adapter against the existing boost authority**

- [ ] **Step 4: Verify pass plus existing live-spacetime verifier**

Run: `node --test test/phase-adapters-relativity.test.mjs && node docs/verify-spacetime-boosted-live.cjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add core/phase-adapters/relativity.mjs test/phase-adapters-relativity.test.mjs
git commit -m "feat: adapt Lorentz state to phase space"
```

### Task 9: Heat adapter and dissipative control case

**Files:**
- Create: `core/phase-adapters/field-heat.mjs`
- Create: `test/phase-adapters-heat.test.mjs`
- Create: `core/phase-adapters/index.mjs`

**Interfaces:**
- Produces: `heatPhaseAdapter() -> PhaseSpaceContract`.
- Produces: `INITIAL_PHASE_SPACES` from the five initial adapters.

- [ ] **Step 1: Write failing heat tests**

Verify the Heat solver's declared energy/norm diagnostic is monotone or balance-law according to the existing solver, never conserved; invalid timestep/domain is refused; visual grid scaling does not alter the native diagnostic.

- [ ] **Step 2: Verify failure**

Run: `node --test test/phase-adapters-heat.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement the Heat adapter and adapter index**

- [ ] **Step 4: Verify pass plus field solver authority**

Run: `node --test test/phase-adapters-heat.test.mjs && node docs/verify-the-solvers-own-diffusion.cjs && node docs/verify-the-laws-of-a-field.cjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add core/phase-adapters/field-heat.mjs core/phase-adapters/index.mjs test/phase-adapters-heat.test.mjs
git commit -m "feat: add dissipative heat phase adapter"
```

### Task 10: Integrate IPSE into CORE and generate one truthful static artifact

**Files:**
- Modify: `core/index.mjs`
- Modify: `scripts/build-api.mjs`
- Create generated: `api/phase-space.json`
- Create: `test/phase-agent.test.mjs`

**Interfaces:**
- `CORE.phase.describe(labId)`
- `CORE.phase.probe(labId, invariantId, input = {})`
- `CORE.phase.compare(labA, labB, input = {})`
- `CORE.phase.bridges({ labA = null, labB = null, status = null, includeCandidates = false })`
- Static artifact schema: `hcc.phase-space/1` with `version`, `build`, `core_version`, `code_sha256`, `current_release`, `measured_on_this_release`, `stale`, `spaces`, `bridges`, and `candidates` (`noncanonical:true`, `review_required:true`).

- [ ] **Step 1: Write failing CORE/artifact tests**

Assert five initial spaces exist; unknown lab is refused/not-found explicitly; candidate rows stay noncanonical; generated artifact and live CORE agree on ids/statuses; a deliberately old artifact is exposed as stale and cannot be used as a current verified bridge.

- [ ] **Step 2: Verify failure**

Run: `node --test test/phase-agent.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Integrate phase files into `coreHash()` and `CORE`, then generate `api/phase-space.json` from live core objects**

Do not hand-edit the generated artifact.

- [ ] **Step 4: Verify pass and regeneration stability**

Run: `node --test test/phase-agent.test.mjs && node scripts/build-api.mjs && git diff --exit-code api/phase-space.json`
Expected: PASS and no diff after regeneration.

- [ ] **Step 5: Commit**

```bash
git add core/index.mjs scripts/build-api.mjs api/phase-space.json test/phase-agent.test.mjs
git commit -m "feat: publish phase-space registry"
```

### Task 11: Add the four MCP phase operations

**Files:**
- Modify: `server/server.mjs`
- Modify: `scripts/build-api.mjs`
- Modify: `test/phase-agent.test.mjs`
- Generated: `.well-known/mcp.json`, `api/openapi.json`, `api/agent.json`, `api/manifest.json`

**Interfaces:**
- `describe_phase_space({lab_id})`
- `probe_invariant({lab_id, invariant_id, input?})`
- `compare_phase_spaces({lab_a, lab_b, input?})`
- `list_phase_bridges({lab_a?, lab_b?, status?, include_candidates?})`

- [ ] **Step 1: Add failing MCP tests**

Assert all four tools appear in `TOOLS`, reject unknown labs/invariants with structured errors, default `include_candidates` to false, and preserve `REFUSED` results rather than substituting plausible values.

- [ ] **Step 2: Verify failure**

Run: `node --test test/phase-agent.test.mjs`
Expected: FAIL for missing MCP tools.

- [ ] **Step 3: Add the four additive tools and generated OpenAPI/discovery surfaces**

Existing MCP tool behavior remains byte-compatible except for additive discovery entries.

- [ ] **Step 4: Regenerate and verify**

Run: `node scripts/build-api.mjs && node --test test/phase-agent.test.mjs test/agent-client.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/server.mjs scripts/build-api.mjs test/phase-agent.test.mjs .well-known/mcp.json api/openapi.json api/agent.json api/manifest.json
git commit -m "feat: expose phase-space MCP tools"
```

### Task 12: Phase Lens UI

**Files:**
- Modify: `index.html`
- Create: `docs/verify-the-phase-lens.cjs`
- Modify: `scripts/run-quick-verifiers.mjs`

**Interfaces:**
- UI entry: `Phase Lens` from supported laboratory/Nexus inspection state.
- Views: local phase summary, invariant slice, bridge inspector, explicit refusal presentation.
- Data authority: live browser-side phase contracts/adapters or generated `api/phase-space.json`; UI must not duplicate formulas used by core diagnostics.

- [ ] **Step 1: Write failing structural verifier**

Verify the UI exposes carrier/state space, evolution parameter, constraints/invariants, validity domain, bridge status labels, noncanonical candidate label, explicit projection label, and a refusal reason. Verify exact/candidate/refused connections have distinct textual grammar independent of color.

- [ ] **Step 2: Verify failure**

Run: `node docs/verify-the-phase-lens.cjs`
Expected: FAIL because Phase Lens is absent.

- [ ] **Step 3: Implement Phase Lens with thin projections only**

No visual quality control may alter a solver state, residual, tolerance, bridge status, or export.

- [ ] **Step 4: Run focused UI/scientific verification**

Run: `node docs/verify-the-phase-lens.cjs && node docs/verify-nexus-carries-every-kind.cjs && node docs/verify-every-laboratory-keeps-its-invariants.cjs && node docs/verify-the-atlas-of-invariants.cjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html docs/verify-the-phase-lens.cjs scripts/run-quick-verifiers.mjs
git commit -m "feat: add invariant phase lens"
```

### Task 13: Route phase tests through CI and complete release contract

**Files:**
- Modify: `package.json`
- Modify: `scripts/run-quick-verifiers.mjs`
- Modify: `README.md`
- Modify: `SCIENTIFIC_CONTRACT.md`
- Modify: `version.json`
- Generated files from `scripts/build-api.mjs` and existing manifest/extraction builders.

**Interfaces:**
- Add `test:phase` script: `node --test test/phase-*.test.mjs`.
- Quick verifier router must run phase tests whenever `core/phase/`, `core/phase-adapters/`, phase MCP tools, `api/phase-space.json`, or Phase Lens symbols change.
- Release docs must repeat the firewall: phase similarity does not establish physical identity; S³ remains conditional reconstruction, not detected topology.

- [ ] **Step 1: Add failing CI-policy expectation for phase changes**

Make a router test/fixture or deterministic self-check showing an IPSE-path change schedules `test:phase` and the Phase Lens verifier.

- [ ] **Step 2: Implement CI routing and release documentation/version bump**

Use the next repository release version chosen according to the project's existing versioning sequence at implementation time; update all generated artifacts from source authority rather than by hand.

- [ ] **Step 3: Run complete phase and release verification**

Run: `npm run test:phase`
Expected: PASS.

Run: `npm run test:source`
Expected: PASS.

Run: `npm run test:release`
Expected: PASS.

- [ ] **Step 4: Confirm generated tree is clean**

Run the existing extraction/API/manifest generation commands used by `scripts/validate.mjs`, then `git status --short`.
Expected: no uncommitted generated drift.

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/run-quick-verifiers.mjs README.md SCIENTIFIC_CONTRACT.md version.json api .well-known core/atlas/extracted.mjs index.html
git commit -m "release: integrate invariant phase-space engine"
```

### Task 14: Whole-branch verification before integration

**Files:**
- No new product files unless verification finds a defect; any fix must be committed separately with a focused message.

**Interfaces:**
- Consumes the complete IPSE branch.
- Produces verification evidence only; no claim of success without command output.

- [ ] **Step 1: Run the phase suite**

Run: `npm run test:phase`
Expected: PASS.

- [ ] **Step 2: Run the complete source verifier census**

Run: `npm run test:source`
Expected: PASS.

- [ ] **Step 3: Run release verification**

Run: `npm run test:release`
Expected: PASS.

- [ ] **Step 4: Inspect diff against `main`**

Run: `git diff --check main...HEAD && git diff --stat main...HEAD`
Expected: no whitespace errors; only spec/plan, IPSE core/adapters/tests, generated agent artifacts, UI/verifier, and release docs/version changes.

- [ ] **Step 5: Commit verification-only fixes if required**

If a verification defect exists, fix only that defect, rerun its failing command plus Tasks 14.1–14.4, and commit with a focused `fix:` message. If nothing fails, create no empty commit.
