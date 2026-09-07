# Atlas Semantic Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild one coherent Atlas line from v4.148.1 while recovering valuable parallel work without regressing the Solar GPU safe default or the observer-distance corrections.

**Architecture:** Treat current `main`/v4.148.1 as the release authority. Reconcile each historical line as a separate layer on `reconcile/4.149-semantic`. Prefer exact historical commits when they apply cleanly; use semantic adaptation when an old branch overlaps newer architecture. Every production layer gets a regression contract before integration and fresh validation before the next layer.

**Tech Stack:** Single-file HTML/ES modules, Three.js, Node 22 validation, GitHub Actions, static JSON manifests, GitHub Pages.

**Spec:** Repository history and PR contracts for #192–#199, open PRs #3/#61/#195/#197, and historical agent branches.

## Global Constraints

- Current `v4.148.1` Solar N-body swarm remains opt-in (`astOn:false`); no reconciliation may restore automatic 65,536-particle allocation.
- Observer-distance corrections from PR #198 remain authoritative: lensing uses angular-diameter distance while photometry retains luminosity distance.
- Do not copy historical version/build identifiers or generated artifacts blindly; regenerate from reconciled source.
- Preserve epistemic firewalls: relation overlays are non-metric; scientific candidate tests are not theorem claims; validation sidecars are not runtime evidence by themselves.
- Fresh current-main CI is authoritative over stale branch topology. A branch that is technically ahead may already have been semantically reimplemented.

---

### Task 1: Recover the lost merged mobile/relation line

**Files:**
- Create: `docs/verify-semantic-reconciliation-stage1.cjs`
- Modify: `package.json`, `index.html`
- Guarded apply workflow: `.github/workflows/reconcile-stage1-apply.yml`

**Interfaces:**
- Consumes: v4.148.1 at `90aea7d32b4d6c9d859b3acd3268df5d4c721cf6` and exact PR heads #192/#193/#194/#196.
- Produces: missing safe-area/zoom semantics, compact-nav ARIA state, curved non-metric typed-relation overlays and flow probes while retaining the already-present VisualViewport/sheet behavior.

- [x] Add a static verifier and verify RED on v4.148.1: existing validator green, four intended contracts missing.
- [x] Reject whole-branch merge after PR #201 proves the long-lived branch is non-mergeable and over-broad.
- [x] Cherry-pick only exact heads #192, #193, #194 and #196 in order under a conflict-stop workflow.
- [x] Run pre-push `npm test`; Stage-1 verifier green; preserve `astOn:false` and `v4.148.1` identity.
- [x] Repair the recovered compact-navigation lifecycle so both static desktop DOM and rebuilt mobile DOM receive the same accessible names; guarded embedded browser self-tests and Solar GPU invariants are green before commit `a0de48d`.
- [x] Run the full computational-core gate from user-authored clean-checkout commit `595f527`: extraction/regeneration, manifest/reach consistency, all verifiers, observer scene, API benchmarks, headless agent, embedded self-tests, per-frame liveness, service startup/health and Docker image all pass.

### Task 2: Reconcile unique Multiview/API work from draft PR #195

**Interfaces:**
- Consumes: reconciled Task-1 mobile/a11y behavior and the much newer current Multiview implementation.
- Candidate unique outputs: machine-readable preset discovery (`multiview.focusing`, public read-only preset API, agent/manifest representation).

- [x] Prove which #195 contracts are genuinely absent: the current reconciled Atlas has no `focusing` preset, no public `HCC_API.multiviewPresets()` discovery surface, and no agent/manifest representation for prepared immersive comparisons. Historical mobile/build-stamp material is duplicate or stale and is excluded.
- [ ] Add failing checks only for genuinely absent behavior.
- [ ] Port only unique behavior; exclude duplicate mobile CSS, stale generated artifacts and historical release identity.
- [ ] Regenerate machine-facing contracts from current generators and run consistency gates.

### Task 3: Semantic audit of historical Symmetry Discovery branch — no duplicate implementation

Fresh v4.148.1 validation already proves the modern Atlas contains Symmetry Discovery end to end: five transformation spaces, finite-orbit scanner, perturbation semantics, diagnostics/export, Multiview, Atlas registration and epistemic firewall.

- [ ] Diff the historical `agent/symmetry-discovery` intent against the current implementation for any *unique* contract not already covered.
- [ ] If no unique behavior remains, record the branch as semantically absorbed and make no production change.
- [ ] If a genuinely unique improvement remains, add a failing modern test before adapting only that improvement.

### Task 4: Semantic audit of old Field Lab PR #3 — retain current implementation

Fresh v4.148.1 validation already proves `field` is one of the seven modes and current Field Lab controls/handlers are present (`fieldModel`, run/reset, resolution/speed, vectors, sensor integration and export). The old PR #3 topbar rewrite is obsolete.

- [ ] Compare PR #3 solver intent with the current Field Lab implementation.
- [ ] Do not restore the historical topbar/layout rewrite.
- [ ] Port nothing unless a specific solver capability is demonstrably absent and covered by a new failing test.

### Task 5: Preserve VDE as a validation sidecar

**Files:** unique `.github/workflows/vde_*`, `vde_validation/*`, `vde_likelihood/*` only where still reproducible and useful.

- [ ] Audit 19 unique commits and remove scratch-only duplication.
- [ ] Port canonical validation workflows/scripts without coupling them to runtime application state.
- [ ] Verify pinned versions, null-limit tests, DESI analysis and artifact generation.
- [ ] Do not promote sidecar output into runtime scientific claims merely because the workflow passes.

### Task 6: Ancient Chronometry Phase B

**Files:** consume PR #197 Phase-A files and `docs/ANCIENT_CHRONOMETRY_HANDOFF.md`; integrate against the final reconciled registries/API.

- [ ] Run Phase-A exact-rational/falsification checks unchanged first.
- [ ] Reuse the current commensurability authority instead of cloning an older engine.
- [ ] Add live registry/route/UI only after the pure data path is green.
- [ ] Regenerate final artifacts and bump release identity once.
- [ ] Run complete CI plus GPU/mobile/manifest/reach/liveness gates before proposing merge to `main`.
