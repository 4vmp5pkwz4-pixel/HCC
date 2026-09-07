# Ancient Chronometry Observatory — Phase B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the source-locked Ancient Chronometry foundation into the current HCC v4.149.1 Cycles world as a live, routable, machine-readable and falsifiable laboratory, then release it as v4.150.0.

**Architecture:** Preserve the Phase-A exact/provenance kernel as an independent module and keep the existing Cycles commensurability/Saros machinery authoritative for shared period mathematics. Extend HCC navigation minimally so a non-S³ world can own a laboratory, add a Cycles chronometry visual station whose source-space and science-space geometry derives only from typed records, and publish the laboratory through the same HCC_API/manifest contracts as every other computational instrument. All source-qualified conflicts and rejected correspondences remain visible and never become quantity-bus links merely because their numbers are close.

**Tech Stack:** Existing single-file HCC runtime (`index.html`), Three.js, Node.js ESM/CommonJS verifiers, Playwright manifest walker, JSON registries, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-05-ancient-chronometry-observatory-design.md`

## Global Constraints

- Base integration on current `main` v4.149.1, not the historical v4.147.0 Phase-A base.
- Keep `core/labs/chronometry.source_locked.mjs` source-qualified and exact; do not duplicate its arithmetic inside `index.html`.
- Reuse the existing HCC continued-fraction/commensurability authority for shared cycle mathematics; the Phase-A bounded scanner remains a falsification primitive only.
- `kṣaṇa`, `truṭi`, `paramāṇu`, `yojana` and other same-named historical terms are source-qualified records, never global units.
- Aryabhata, Daming and Shoushi bootstrap records remain `PENDING_EPOCH_CORRECTION` until a defensible source-epoch reference is implemented.
- Jain `42000 years` is dependent evidence because it is structurally `2 × 21000`; Jain `21000 years ↔ terrestrial climatic precession` remains `HYPOTHESIS` without an independent phase anchor.
- No cross-domain numerical proximity may create a quantity-bus link or stronger epistemic status.
- Pause, time direction, epoch changes and global Cycles speed remain governed by the one Atlas clock.
- Release only after all Phase-A verifiers, new Phase-B verifiers, current npm tests, Cycles verifier and Solar GPU regression verifiers pass.

---

### Task 1: Generalize the laboratory router to world-owned labs

**Files:**
- Create: `docs/verify-world-lab-routing.cjs`
- Modify: `index.html` at `LAB_REGISTRY`, `hccRoute`, `hccParseRoute`, `hccGo`, `hccBack`, `hccConfigCurrentId`.

**Interfaces:**
- Consumes: `WORLD_BY_ID`, `LAB_REGISTRY`, `LAB_BY_ID`, existing `setMode`, existing S³ `setS3View` path.
- Produces: a registry entry `{id:'chronometry', parentWorld:'cyc', route:'#/world/cyc/lab/chronometry'}` and generic routing where any laboratory's `parentWorld` decides its route and mode.

- [ ] **Step 1: Write the failing routing verifier**

The verifier must read `index.html` and assert all of the following structural contracts are present:

```js
assert(src.includes("id:'chronometry', parentWorld:'cyc'"));
assert(src.includes("`#/world/${ctx.worldId}/lab/${ctx.labId}`"));
assert(src.includes("if(labId){ const L=LAB_BY_ID.get(labId)"));
assert(src.includes("if(worldId==='s3')"));
assert(src.includes("else if(labId&&worldId==='cyc')"));
```

It must also boot `?render=0` with Playwright and assert:

```js
HCC_NAV.go('cyc','chronometry');
HCC_NAV.route() === '#/world/cyc/lab/chronometry';
HCC_CTX.worldId === 'cyc';
HCC_CTX.labId === 'chronometry';
state.cycFrame === 'chronometry';
```

- [ ] **Step 2: Run RED**

Run: `node docs/verify-world-lab-routing.cjs`

Expected: FAIL because `chronometry` is not yet a registered Cycles laboratory and generic non-S³ lab routes are not supported.

- [ ] **Step 3: Implement the minimal generic route contract**

Keep S³ activation unchanged. For non-S³ labs, preserve `HCC_CTX.labId` instead of clearing it; dispatch the world-specific activation through a small explicit branch. For `cyc/chronometry`, set `state.cycFrame='chronometry'` and call `applyCycFrameView()`.

`hccRoute` must become:

```js
function hccRoute(ctx=HCC_CTX){
  return ctx.labId ? `#/world/${ctx.worldId}/lab/${ctx.labId}` : `#/world/${ctx.worldId}`;
}
```

`hccParseRoute` must verify a requested lab belongs to the requested world rather than merely checking that the lab ID exists.

- [ ] **Step 4: Run GREEN and current navigation tests**

Run:

```bash
node docs/verify-world-lab-routing.cjs
npm test
```

Expected: routing verifier PASS and existing tests remain GREEN.

- [ ] **Step 5: Commit**

Commit message: `feat(nav): support world-owned laboratories`.

---

### Task 2: Publish Chronometry through HCC_API without duplicating science

**Files:**
- Create: `docs/verify-chronometry-atlas-contract.cjs`
- Modify: `index.html` at `hccApiRegister` declarations and Chronometry adapter helpers.

**Interfaces:**
- Consumes: Phase-A JSON registries, source-qualified kernel outputs exported through static JSON-compatible data generated at build time, existing `cycCommensurability`/continued-fraction authority where period ratios are needed.
- Produces: `HCC_API_SPECS.get('chronometry')` with typed inputs/outputs, verifier references, formulas/limits and explicit epistemic outputs.

- [ ] **Step 1: Write failing API verifier**

Boot `?render=0` and assert:

```js
const d = HCC_API.describe('chronometry');
assert.equal(d.world,'cyc');
assert.equal(d.lab,'chronometry');
assert(d.verifiers.includes('docs/verify-chronometry-source-locked.cjs'));
assert(d.verifiers.includes('docs/verify-chronometry-falsification.cjs'));
const r = HCC_API.evaluate('chronometry',{case_id:'jain.avasarpini'});
assert.equal(r.status,'EXACT_TEXTUAL');
assert.equal(r.dependent_42000,true);
```

A second case must report the Jain 21 kyr comparison as `HYPOTHESIS` or weaker and `phase_consistent:false`.

- [ ] **Step 2: Run RED**

Run: `node docs/verify-chronometry-atlas-contract.cjs`

Expected: unknown laboratory `chronometry`.

- [ ] **Step 3: Add the minimal adapter/spec**

Register one instrument with a finite `case_id` enum-like string input and JSON-safe scalar outputs. Do not reproduce rational arithmetic in the page; expose source-derived prepared facts and route shared period comparison through the existing Cycles authority. Include limits that explicitly forbid source-name collapsing and phase promotion without an independent anchor.

- [ ] **Step 4: Run GREEN**

Run:

```bash
node docs/verify-chronometry-atlas-contract.cjs
node docs/verify-chronometry-source-locked.cjs
node docs/verify-chronometry-falsification.cjs
node docs/verify-ancient-astronomy-benchmarks.cjs
```

Expected: all PASS.

- [ ] **Step 5: Commit**

Commit message: `feat(api): publish source-locked chronometry contract`.

---

### Task 3: Build the synchronized source-space / science-space Cycles station

**Files:**
- Create: `docs/verify-chronometry-visual-contract.cjs`
- Modify: `index.html` near Cycles instruments and `updateCyc`.

**Interfaces:**
- Consumes: source-qualified Chronometry records and statuses, `state.epochDays`, current Cycles frame machinery.
- Produces: `cycChronometryInst`, source nodes, definition-chain edges, science-scale rail, typed conduits, conflict markers and status labels; `updateChronometryObservatory()` is a pure function of current Atlas state plus immutable source data and owns no clock.

- [ ] **Step 1: Write failing visual contract verifier**

Static assertions:

```js
assert(src.includes('const cycChronometryInst=new THREE.Group()'));
assert(src.includes('function updateChronometryObservatory()'));
assert(!/chronometryT\s*[+]=/.test(src));
assert(src.includes("frame==='chronometry'"));
assert(src.includes('Same term / different definition'));
assert(src.includes('PENDING_EPOCH_CORRECTION'));
```

Runtime assertions in `?render=0` must confirm selecting the frame makes the Chronometry group visible and that two successive calls at the same `state.epochDays` yield identical sampled transforms.

- [ ] **Step 2: Run RED**

Run: `node docs/verify-chronometry-visual-contract.cjs`

Expected: missing Chronometry scene.

- [ ] **Step 3: Implement the minimal 3-D observatory**

Create two separated but synchronized geometric spaces:

1. **Source space:** concentric or layered text/tradition nodes; same normalized names with conflicting definitions are visibly split, connected by a conflict brace/edge rather than merged.
2. **Science space:** logarithmic temporal scale with benchmark anchors. Ancient-to-modern conduits exist only for typed relation records and their material/labels encode epistemic status, never confidence by raw geometric distance.

Use depth for epistemic/provenance separation, not decorative parallax. Chronometry must have no private `dt` accumulator.

- [ ] **Step 4: Run GREEN**

Run:

```bash
node docs/verify-chronometry-visual-contract.cjs
node docs/verify-cycles-mechanism.cjs
```

Expected: both PASS.

- [ ] **Step 5: Commit**

Commit message: `feat(cycles): add Ancient Chronometry observatory`.

---

### Task 4: Integrate Cycles controls, selection, provenance and Multiview eligibility

**Files:**
- Create: `docs/verify-chronometry-integration.cjs`
- Modify: `index.html` at `applyCycFrameView`, Cycles frame selectors, compact menu, `registerSel`, Atlas catalogue and Multiview discovery hooks.

**Interfaces:**
- Consumes: `cycChronometryInst`, generic world-owned lab routing from Task 1.
- Produces: selectable `chronometryObservatory`, `chronometry` Cycles frame option, camera framing, inspector rows with source/citation/status, and a laboratory that can be selected as a Multiview tile without claiming shared physical coordinates.

- [ ] **Step 1: Write failing integration verifier**

Assert in a headless browser:

```js
HCC_NAV.go('cyc','chronometry');
assert.equal(state.cycFrame,'chronometry');
assert(SELECT.has('chronometryObservatory'));
assert(document.querySelector('#cycFrame option[value="chronometry"]'));
assert(HCC_API.labs.list().some(l=>l.id==='chronometry'&&l.world==='cyc'));
```

If Multiview exposes a generic laboratory list, assert Chronometry appears there and carries an explicit non-metric/provenance warning.

- [ ] **Step 2: Run RED**

Run: `node docs/verify-chronometry-integration.cjs`

Expected: at least frame/menu/selection assertions fail.

- [ ] **Step 3: Wire the existing controls and selection systems**

Add `chronometry` to desktop and compact Cycles frame controls, camera framing, `updateCyc` visibility, selectable provenance rows, and Atlas catalogue. Do not add a new global clock, renderer or panel framework.

- [ ] **Step 4: Run GREEN plus semantic reconciliation regressions**

Run:

```bash
node docs/verify-chronometry-integration.cjs
node docs/verify-semantic-reconciliation.cjs
node docs/verify-multiview-semantic-reconciliation.cjs
```

If the repository uses different permanent verifier filenames, discover and run the current equivalents; do not resurrect deleted one-shot reconciliation workflows.

- [ ] **Step 5: Commit**

Commit message: `feat(cycles): integrate chronometry navigation and multiview`.

---

### Task 5: Regenerate contracts, bump v4.150.0 and prove the release

**Files:**
- Modify generated: `api/manifest.json`, `api/openapi.json`, `api/open-problems.json`, `api/reach.json`, `api/sensitivity.json`, `api/transfers.json`, `api/liveness.json`, generated reports as required by current scripts.
- Modify: `version.json`, `index.html` release identity.
- Modify generated extracted authority only through its generator if required.

**Interfaces:**
- Consumes: final live atlas from Tasks 1–4.
- Produces: version `4.150.0`, build `ancient-chronometry-observatory-2026.09.05.1`, machine-readable manifest containing the Chronometry lab/instrument and unchanged truthfulness of generated counts.

- [ ] **Step 1: Run generated-artifact checks before regeneration and confirm RED where expected**

Run the current repository generation/check commands (including `scripts/build-manifest.mjs --check` or its current equivalent). Expected: generated contracts are stale because the live laboratory count/API changed.

- [ ] **Step 2: Regenerate only through repository generators**

Use current scripts; never hand-edit generated counts to make checks pass.

- [ ] **Step 3: Bump the release identity exactly once**

Set:

```text
version = 4.150.0
build = ancient-chronometry-observatory-2026.09.05.1
```

Regenerate again if the generator embeds release identity.

- [ ] **Step 4: Full verification**

Run:

```bash
node docs/verify-chronometry-source-locked.cjs
node docs/verify-chronometry-falsification.cjs
node docs/verify-ancient-astronomy-benchmarks.cjs
node docs/verify-world-lab-routing.cjs
node docs/verify-chronometry-atlas-contract.cjs
node docs/verify-chronometry-visual-contract.cjs
node docs/verify-chronometry-integration.cjs
node docs/verify-cycles-mechanism.cjs
node docs/verify-solar-gpu-safe-default.cjs
node docs/verify-solar-webgl-buffer-lifetime.cjs
npm test
node scripts/ci.mjs
```

Expected: all GREEN, no page errors in headless route walk, manifest counts internally consistent, Chronometry present exactly once as a Cycles laboratory and once as its computational instrument.

- [ ] **Step 5: Inspect generated diff and commit**

Reject unexpected changes to unrelated scientific outputs, bus links or existing epistemic statuses. Commit message: `Release v4.150.0 — Ancient Chronometry Observatory`.

- [ ] **Step 6: Open PR to `main` and merge only after final branch checks are GREEN**

The PR body must state that historical astronomy benchmarks remain pending epoch correction and that the release adds no claim equating ancient source units with modern physical units from numerical proximity.
