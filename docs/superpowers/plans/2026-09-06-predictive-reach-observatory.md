# Predictive Reach Observatory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a global, fail-closed intervention forecast instrument from the Atlas's measured sensitivity/transfers/reach network.

**Architecture:** Pure forecast arithmetic lives in `core/prediction/reach-forecast.mjs`; a deterministic browser fragment consumes `api/reach.json` and mounts a managed panel plus read-only API. Existing measurement generators remain authoritative and release artifacts are regenerated from the final tree.

**Tech Stack:** ES modules, browser JavaScript, Node.js verifiers, existing HCC generated artifacts and GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-06-predictive-reach-observatory-design.md`

## Global Constraints
- Release `4.155.0`, build `predictive-reach-observatory-2026.09.06.1`.
- Preview-only: no scientific state, AtlasTime or bus mutation.
- Forecast ratios only when `power_law === true`.
- Unknown control semantics are `PHYSICAL_OR_MODEL`, never silently `physical`.
- Generated artifacts must be rebuilt from the exact final release tree.

---

### Task 1: Pure forecast kernel
**Files:**
- Create: `core/prediction/reach-forecast.mjs`
- Create: `docs/verify-predictive-reach-observatory.cjs`

**Interfaces:**
- `validateReachArtifact(reach, identity)`
- `controlSemantics(control)`
- `listReachControls(reach)`
- `forecastReach(reach, control, delta, identity)`

- [ ] Write verifier assertions for exponent response, negative-exponent endpoint ordering, fail-closed rejected/unjudged chains, malformed/mismatched artifacts and `ns.step` semantics.
- [ ] Run verifier and confirm RED because the module does not exist.
- [ ] Implement the pure module with no DOM/state dependencies.
- [ ] Run verifier and confirm GREEN.

### Task 2: Browser observatory
**Files:**
- Create: `scripts/fragments/v41550-predictive-reach.jsfrag`
- Create: `scripts/patch-v41550-predictive-reach.cjs`
- Modify through materializer: `index.html`

**Interfaces:**
- Global API: `HCC_PREDICTIVE_OBSERVATORY.status/controls/chains/forecast`
- Panel id: `predictivePanel`
- More-menu button id: `predictiveBtn`

- [ ] Extend verifier with required browser markers and mutation-firewall assertions; confirm RED.
- [ ] Implement lazy `api/reach.json` loading with version/build check and managed-panel rendering.
- [ ] Add control and delta UI, verdict cards, route diagnostics and JSON export.
- [ ] Add `Predictive Reach` action to Prediction Workbench.
- [ ] Materialize into `index.html` with unique structural anchors.
- [ ] Run verifier, syntax checks and static validator; confirm GREEN.

### Task 3: Release identity and artifacts
**Files:**
- Create: `scripts/patch-v41550-release-identity.cjs`
- Create temporary release/materialization workflows as needed.
- Modify generated: `version.json`, `api/manifest.json`, `api/openapi.json`, `.well-known/mcp.json`, `api/liveness.json`, `api/sensitivity.json`, `api/transfers.json`, `api/reach.json`, `api/open-problems.json`, `artifacts/agent-demo-report.json`.

- [ ] Stamp exact release identity.
- [ ] Regenerate machine-facing contracts.
- [ ] Re-measure liveness, sensitivity and transfers.
- [ ] Recompose reach and regenerate agent report.
- [ ] Verify artifact hygiene and exact build coherence.

### Task 4: Full verification and publication
- [ ] Run all repository verifiers and Computational Core suite.
- [ ] Open release PR against current `main` and confirm exact head SHA.
- [ ] Merge only after required checks are green.
- [ ] Verify post-merge `main` identity and Pages deployment.
- [ ] Verify public `version.json` reports `4.155.0 / predictive-reach-observatory-2026.09.06.1`.
