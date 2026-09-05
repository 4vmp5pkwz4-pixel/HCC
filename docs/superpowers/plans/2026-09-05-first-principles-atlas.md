# HCC v4.151.0 First-Principles Atlas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship HCC 4.151.0 with a first-principles scientific contract across the live Atlas and an operational Fibonacci/anyon computation layer, while preserving all existing scientific, mobile, GPU and XR invariants.

**Architecture:** Keep `index.html` as the single source of scientific runtime truth, following the existing project pattern. Add deterministic verifiers first, then a one-shot structural patcher that inserts the first-principles runtime/visual layer into `index.html`, updates release identity and generated-contract builders, and lets GitHub Actions regenerate `core/atlas/extracted.mjs` and `api/*`. The global layer reads the measured live registry instead of duplicating laboratory definitions.

**Tech Stack:** Node.js 22, vanilla JS/HTML/CSS, Three.js r160, Playwright 1.49, GitHub Actions, existing HCC manifest/API generators.

**Spec:** `docs/superpowers/specs/2026-09-05-first-principles-atlas-design.md`

## Global Constraints
- Target version: `4.151.0`.
- Target build: `first-principles-atlas-2026.09.05.1`.
- Native mathematics is evaluated before projection or rendering.
- Exact symbolic values remain authoritative when available; decimal values are derived displays.
- Gauge/basis/orientation conventions must be labelled separately from physical invariants.
- Unknown scientific metadata fails closed as `UNDECLARED`; never infer a physical claim from visual similarity.
- Mobile/XR reductions may alter rendering density only, never solver state, tolerances or exported scientific values.
- Generated `core/atlas/extracted.mjs` is never edited directly.
- Every production change is preceded by a failing verifier.

---

### Task 1: RED gate for the new release contract

**Files:**
- Create: `docs/verify-first-principles-atlas.cjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: repository files as text.
- Produces: a deterministic release gate with non-zero exit until first-principles markers, exact Fibonacci constants, global audit hooks and release identity exist.

- [ ] **Step 1: Write the failing verifier**

The verifier must assert all of these independent facts:
1. `index.html` contains `HCC_FIRST_PRINCIPLES_SCHEMA = 'hcc.first-principles/1'`.
2. It contains the exact Fibonacci definitions `phi = (1 + sqrt(5))/2`, the 2x2 fusion matrix, standard displayed `F`, right-handed `R_1=e^{-4πi/5}` and `R_tau=e^{3πi/5}` plus orientation/gauge labels.
3. It contains `rho(sigma_2)=F^-1 R F` as both machine data and visible derivation copy.
4. It contains global dimensional and parameter audit entry points and the literal fail-closed state `UNDECLARED`.
5. `version.json` declares 4.151.0 and `first-principles-atlas-2026.09.05.1`.
6. `scripts/build-manifest.mjs` emits a `first_principles` summary.
7. README no longer hard-codes the stale `85 laboratories` claim.

Use plain Node `assert`; print one PASS line per clause and exit non-zero on first failed invariant.

- [ ] **Step 2: Add the verifier to `npm test`**

Append `&& node docs/verify-first-principles-atlas.cjs` to the existing test script without removing any existing verifier.

- [ ] **Step 3: Push and verify RED**

Expected GitHub Actions result: `Validate atlas` fails specifically in `verify-first-principles-atlas.cjs` because the runtime marker/release identity is absent. A syntax error or unrelated failure does not count as RED.

- [ ] **Step 4: Commit**

Commit message: `test: define v4.151 first-principles release gate`.

---

### Task 2: First-principles runtime contract and Fibonacci reference kernel

**Files:**
- Create: `scripts/patch-v4151-first-principles.cjs`
- Modify via patcher: `index.html`
- Generated later: `core/atlas/extracted.mjs`

**Interfaces:**
- Consumes: existing `AZ_MODELS`, `AZ_BY_ID`, `azFusion`, `azDims`, `azBraidGens`, `LAB_DECLARATIONS` and live laboratory registry.
- Produces: `HCC_FIRST_PRINCIPLES_SCHEMA`, `hccFirstPrinciplesForLab(id)`, `hccFirstPrinciplesAudit()`, `hccFibFirstPrinciples()`, `hccFibBraidWord(word)`, `hccMatrixDistancePhaseInvariant(A,B)`.

- [ ] **Step 1: Extend the failing verifier with numerical invariants before code**

Add independent checks that evaluate a new exported pure helper file or extracted kernel after generation:
- `phi^2 - phi - 1` absolute residual `< 1e-14`.
- `F^2-I` max residual `< 1e-14`.
- `|R_1|=|R_tau|=1` residual `< 1e-14`.
- braid relation `sigma1*sigma2*sigma1 = sigma2*sigma1*sigma2` max complex residual `< 1e-12`.
- exact radicals shown for both R phases.

Expected: still RED because helpers do not exist.

- [ ] **Step 2: Implement the minimal exact Fibonacci data**

The patcher inserts a frozen object with:
- charges `[1, tau]`, duals, all nonzero fusion coefficients;
- `N_tau=[[0,1],[1,1]]` and characteristic polynomial metadata;
- exact strings and evaluated numbers for `phi`, `phi^-1`, `phi^-1/2`, `D=sqrt((5+sqrt(5))/2)`;
- standard displayed gauge for `F`;
- right-handed displayed convention for `R` with exponential, trig, radical and decimal forms;
- explicit mirror rule `R -> conjugate(R)`;
- `theta`, `S`, basis labels and invariant checks.

Do not replace the existing `az*` or `fib*` solvers; reference/cross-check them.

- [ ] **Step 3: Implement braid composition**

Represent complex values as `[re,im]`. Provide 2x2 multiply, dagger, inverse/unitary checks and a braid-word reducer over generators `±1, ±2`. Use existing conventions: `sigma1=R`, `sigma2=F R F†`; negative generators use daggers.

- [ ] **Step 4: Run the verifier in the release workflow**

Expected after patch application: all numerical first-principles assertions PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: add exact first-principles Fibonacci kernel`.

---

### Task 3: Universal laboratory dimension and parameter audit

**Files:**
- Modify via patcher: `index.html`
- Modify via patcher: `scripts/build-manifest.mjs`
- Create: `docs/verify-first-principles-coverage.cjs`

**Interfaces:**
- Consumes: measured live lab/instrument/parameter data produced by the existing browser walker.
- Produces: per-lab `first_principles` contract and manifest summary metrics.

- [ ] **Step 1: Write coverage verifier first**

Assert the generated manifest contains, for every live laboratory:
- a stable `first_principles` object;
- `native_space`, `native_dimension`, `display_dimension`, `projection`, `metric_or_form`, `coordinates`, `domain` keys;
- parameter descriptors for every measured parameter with `id`, `role`, `quantity_kind`, `unit`, `domain`, `source_status`;
- `UNDECLARED` rather than invented values where metadata is genuinely unavailable.

Assert summary counts equal the measured laboratory and parameter totals exactly.

Expected before production change: RED.

- [ ] **Step 2: Add runtime audit classification**

Use explicit semantic tables for known lab families and a conservative fallback. The fallback may identify display dimension and rendering controls but must leave unknown native physics as `UNDECLARED`. Parameter role is one of `physical`, `coordinate`, `numerical`, `rendering`, `categorical`, `UNDECLARED`.

- [ ] **Step 3: Extend manifest builder**

Emit per-lab contracts and summary:
`labs_total`, `labs_dimension_declared`, `parameters_total`, `parameters_role_declared`, `exact_expression_count`, `convention_label_count`, `undeclared_count`.

- [ ] **Step 4: Verify deterministic coverage**

Run build-manifest twice and compare output bytes. Run `verify-first-principles-coverage.cjs`; expected PASS and totals equal live registry measurements.

- [ ] **Step 5: Commit**

Commit message: `feat: audit dimensions and parameters across all live labs`.

---

### Task 4: First-Principles Lens visual instrument

**Files:**
- Modify via patcher: `index.html`
- Create: `docs/verify-first-principles-visual.cjs`

**Interfaces:**
- Consumes: `hccFirstPrinciplesForLab`, current route/hash, selected lab/value and existing scientific state.
- Produces: lazy inspector with Formula, Dependency and Geometry views; no independent solver state.

- [ ] **Step 1: Write visual verifier first**

Assert DOM/CSS/runtime markers exist for:
- first-principles trigger;
- three view tabs `formula`, `dependency`, `geometry`;
- exact-expression and evaluated-value slots;
- dimension/convention/status badges;
- lazy open/close lifecycle and hidden-state animation stop;
- geometry highlight callback;
- safe-area/mobile layout and reduced-motion rule.

Expected before UI insertion: RED.

- [ ] **Step 2: Insert minimal UI**

Create one compact `∴`/First Principles trigger integrated with the existing inspector layer. The panel is built lazily on first use and destroyed/cleared on close. It reads the current lab contract; it never duplicates physics state.

- [ ] **Step 3: Add formula and dependency views**

Formula view shows exact -> substituted -> numerical chain. Dependency view renders a bounded SVG/DOM DAG, not a new WebGL scene. Unknown nodes show `UNDECLARED` visibly.

- [ ] **Step 4: Add geometry bridge**

For labs with declared highlight hooks, pulse/select the existing object using the Atlas highlight grammar. For other labs, report `no geometry binding declared`; never fabricate one.

- [ ] **Step 5: Verify mobile/performance behavior**

Use Playwright through existing CI: open/close repeatedly, check no duplicate panels/listeners, viewport 390x844 and landscape, reduced-motion, and route change.

- [ ] **Step 6: Commit**

Commit message: `feat: add universal first-principles lens`.

---

### Task 5: Anyon Computation Observatory visual expansion

**Files:**
- Modify via patcher: `index.html`
- Create: `docs/verify-anyon-computation-observatory.cjs`

**Interfaces:**
- Consumes: existing Anyon Zoo model selector and `az*` modular-data functions plus new Fibonacci exact contract.
- Produces: fusion-tree, F/R basis-switch, braid composer, gate comparator and model-contrast stations.

- [ ] **Step 1: Write observatory verifier first**

Assert all five stations are registered, each has a stable id, route/selection behavior, and no claim that universality is internally proved. Assert the visible scientific copy contains `EXTERNAL theorem`/equivalent firewall language.

- [ ] **Step 2: Fusion Tree station**

Generate legal paths from the actual fusion tensor. Fibonacci depth sequence must match the Fibonacci recurrence; labels distinguish number of paths from number of particles.

- [ ] **Step 3: F/R Basis Switch station**

Render reassociation separately from exchange. Show basis labels and the currently applied `F`, `R`, or `F^-1 R F` matrix, with exact cell inspector.

- [ ] **Step 4: Braid Composer station**

Provide ordered crossings and editable braid word. Every crossing updates the matrix product and state vector deterministically. Inverse crossing uses dagger.

- [ ] **Step 5: Gate Comparator station**

Compare braid unitary to target modulo global phase using a declared phase-invariant matrix distance/fidelity. Display braid length and error; do not promise convergence.

- [ ] **Step 6: Model Contrast station**

Show Fibonacci, Ising and one Abelian example side by side. Distinguish Abelian/non-Abelian statistics from computational universality and mark universality classification as externally sourced.

- [ ] **Step 7: Commit**

Commit message: `feat: turn Anyon Zoo into computation observatory`.

---

### Task 6: Release consistency, README and machine contracts

**Files:**
- Modify via patcher: `README.md`
- Modify via patcher: `version.json`
- Modify via patcher: `scripts/build-manifest.mjs`
- Generated: `api/manifest.json`, `api/*`, `core/atlas/extracted.mjs`, `agent.html`

**Interfaces:**
- Consumes: live measured registry.
- Produces: synchronized 4.151.0 release identity and generated counts.

- [ ] **Step 1: Add release consistency assertions first**

Verifier fails unless `index.html`, `version.json`, manifest/API and README all agree on version/build and README laboratory count is derived from/generated against manifest rather than stale 85.

- [ ] **Step 2: Patch release identity**

Set version/build exactly to target values in runtime and `version.json`.

- [ ] **Step 3: Correct README**

Replace stale count copy with the measured current count and document that the manifest is authoritative. Add a concise section describing the First-Principles Lens and Anyon Computation Observatory.

- [ ] **Step 4: Regenerate machine contracts**

Run in order:
`node scripts/extract-kernels.mjs`
`node scripts/build-manifest.mjs`
`node scripts/build-api.mjs`
`node scripts/reach.mjs`

- [ ] **Step 5: Commit**

Commit message: `release: prepare v4.151.0 first-principles atlas`.

---

### Task 7: One-shot verification and release candidate

**Files:**
- Create: `.github/workflows/apply-v4151-first-principles.yml`

**Interfaces:**
- Consumes: branch `agent/first-principles-atlas-4.151`.
- Produces: verified release-candidate commit only after every gate passes.

- [ ] **Step 1: Create one-shot workflow**

Workflow uses Node 22 + Playwright Chromium, applies the deterministic patcher, regenerates all contracts, runs the four new verifiers, existing `npm test`, `node scripts/validate.mjs`, scientific special verifiers (`verify-jones-chain.cjs`, solar GPU safety, chronometry), and `git diff --check`.

- [ ] **Step 2: Commit only after GREEN**

The workflow must `git add` only intended generated/source files, reject an empty staged diff, commit `release: v4.151.0 First-Principles Atlas`, and push to the same branch. No commit occurs if any gate fails.

- [ ] **Step 3: Inspect workflow result**

If failure: inspect exact job log, fix the failing invariant, rerun through a new push. Do not weaken a scientific assertion merely to make CI green.

- [ ] **Step 4: Open PR**

Open PR `v4.151.0 — First-Principles Atlas` from the branch to `main` with measured audit totals and explicit scientific firewall notes.

- [ ] **Step 5: Final verification before merge**

Require both standard `Validate atlas` and one-shot release workflow GREEN. Compare branch against `main`, confirm only intended files, then merge/release using the repository’s established flow.
