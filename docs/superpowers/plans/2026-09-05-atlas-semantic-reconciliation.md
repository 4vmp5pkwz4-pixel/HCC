# Atlas Semantic Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild one coherent Atlas line from v4.148.1 while recovering valuable parallel work without regressing the Solar GPU safe default or the observer-distance corrections.

**Architecture:** Treat current `main`/v4.148.1 as the release authority. Reconcile each historical line as a separate layer on `reconcile/4.149-semantic`, using three-way Git history when safe and semantic adaptation when a branch is too old or overlaps current architecture. Every layer gets a regression contract before integration and full CI before the next layer.

**Tech Stack:** Single-file HTML/ES modules, Three.js, Node 22 validation, GitHub Actions, static JSON manifests, GitHub Pages.

**Spec:** Repository history and PR contracts for #192–#199, open PRs #3/#61/#195/#197, and `agent/symmetry-discovery`.

## Global Constraints

- Current `v4.148.1` Solar N-body swarm remains opt-in (`astOn:false`); no reconciliation may restore automatic 65,536-particle allocation.
- Observer-distance corrections from PR #198 remain authoritative: lensing uses angular-diameter distance while photometry retains luminosity distance.
- Do not copy historical version/build identifiers or generated artifacts blindly; regenerate from the reconciled source.
- Preserve epistemic firewalls: relation overlays are non-metric; scientific candidate tests are not theorem claims; validation sidecars are not runtime evidence by themselves.
- No layer moves to the next stage until `npm test` is freshly green on Node 22 CI.

---

### Task 1: Recover the lost merged mobile/relation line

**Files:**
- Create: `docs/verify-semantic-reconciliation-stage1.cjs`
- Modify: `package.json`
- Modify through a Git three-way merge: `index.html`

**Interfaces:**
- Consumes: v4.148.1 at `90aea7d32b4d6c9d859b3acd3268df5d4c721cf6`; historical merged line through `d2996c1b28453d023e52f88445c90c00e20fa0e9`.
- Produces: VisualViewport publisher, safe-area-aware mobile chrome, keyboard/flick/keyboard-accessible sheets, compact-nav ARIA state, and curved non-metric typed-relation overlays with flow probes.

- [ ] Add a static verifier that fails on v4.148.1 because the four recovered contracts are absent.
- [ ] Run CI and confirm the new verifier fails for the intended missing-contract reason.
- [ ] Merge `claude/happy-faraday-4wqxhi` into the reconciliation branch using GitHub's three-way merge; do not modify `main`.
- [ ] Run full CI and confirm the Stage-1 verifier plus the existing suite pass.
- [ ] Confirm `astOn:false`, `verify-solar-gpu-safe-default.cjs`, and observer-distance release material remain present after the merge.

### Task 2: Reconcile Multiview/API from draft PR #195

**Files:**
- Modify: `index.html`, `agent.html`, `api/manifest.json`, `scripts/build-manifest.mjs`, `scripts/validate.mjs`, `version.json`, and generated API artifacts only as required by the current generators.

**Interfaces:**
- Consumes: reconciled Task-1 mobile/a11y behavior.
- Produces: discoverable `multiview.focusing`, `HCC_API.multiviewPresets()`, read-only QA access, and machine-readable immersive representations.

- [ ] Add failing contract checks for `multiview.focusing` and public read-only preset discovery.
- [ ] Port only unique PR #195 behavior; exclude duplicate mobile CSS and historical release identifiers.
- [ ] Regenerate manifest/API outputs from final source.
- [ ] Run full CI and agent-manifest consistency checks.

### Task 3: Adapt Symmetry Discovery Chamber

**Files:**
- Modify current Atlas/Nexus/Multiview registries and validation/docs according to the modern architecture; do not transplant obsolete counts or navigation code wholesale.

**Interfaces:**
- Consumes: current Nexus typed relations and Multiview APIs.
- Produces: five deterministic transformation spaces, 20 candidates, nine benchmark invariants, controlled break perturbation, reproducible export, first-class Atlas/Nexus/Multiview wiring.

- [ ] Add failing modern registry/epistemic-contract tests.
- [ ] Port computational core and visualization against current registries.
- [ ] Recompute current Nexus counts/relations rather than copying historical 64/102 literals.
- [ ] Run full CI, mobile and reduced-motion checks.

### Task 4: Rebuild Field Lab on current navigation

**Files:**
- Adapt the solver content from PR #3 into current world/lab registries and controls; retain current topbar architecture.

**Interfaces:**
- Produces: eight reduced-unit solver laboratories with explicit calibration/limit disclaimers.

- [ ] Add failing tests for Field Lab registry reachability and solver contracts.
- [ ] Port solver logic only; do not restore the obsolete PR #3 topbar rewrite.
- [ ] Add current mobile/Atlas routing and validation.
- [ ] Run full CI.

### Task 5: Preserve VDE as a validation sidecar

**Files:**
- Reconcile unique `.github/workflows/vde_*`, `vde_validation/*`, and `vde_likelihood/*` only where still reproducible and useful.

**Interfaces:**
- Produces: pinned CLASS/DESI validation infrastructure; does not add runtime claims to Atlas solely from sidecar output.

- [ ] Audit 19 unique commits and remove scratch-only duplication.
- [ ] Port canonical workflows/scripts without coupling them to runtime application state.
- [ ] Verify pinned versions, null-limit tests, reports, and artifact generation.

### Task 6: Ancient Chronometry Phase B

**Files:**
- Consume PR #197 Phase-A files and `docs/ANCIENT_CHRONOMETRY_HANDOFF.md`; integrate against the then-current reconciled registries/API.

**Interfaces:**
- Produces: source-locked chronometry kernel, Jain/calendar profiles, historical astronomy benchmark registry, comparison/falsification firewall, and live Atlas route/UI.

- [ ] Run Phase-A exact-rational/falsification checks unchanged first.
- [ ] Reuse the current commensurability authority instead of cloning an older engine.
- [ ] Add live registry/route/UI only after the data path is green.
- [ ] Regenerate final artifacts and bump release identity once.
- [ ] Run complete CI plus GPU/mobile/manifest/reach/liveness gates before proposing merge to `main`.
