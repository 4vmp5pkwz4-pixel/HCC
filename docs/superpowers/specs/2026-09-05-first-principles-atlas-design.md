# HCC v4.151.0 — First-Principles Atlas

## Goal
Turn the current 113-laboratory Atlas into a first-principles scientific instrument in which every displayed quantity can be traced from native dimensional structure through symbols, constants, conventions, equations, numerical evaluation, visualization, and machine-readable export. Extend the existing Anyon Zoo from model classification into an operational fusion/braiding/compilation observatory without weakening the existing scientific firewall.

## Release identity
- Target: `4.151.0`
- Build: `first-principles-atlas-2026.09.05.1`
- Base: `main@98fc046885db187594a425ec1380acbdfeb98499` (`4.150.0`)
- Release class: architectural scientific-instrument upgrade

## Non-negotiable scientific rules
1. Native mathematics is evaluated before projection or rendering.
2. Every parameter declares its semantic type, unit/dimension, domain, default, source/provenance and status.
3. Exact symbolic values are preserved when available; decimals are derived views, never the authority.
4. Gauge/basis/convention-dependent representations are explicitly labelled and separated from physical invariants.
5. A visual similarity never creates an identity, coupling, causal relation or evidence claim.
6. Unsupported or externally sourced theorems remain marked EXTERNAL; the Atlas may demonstrate consequences but must not silently promote them to internally derived results.
7. Mobile/XR density reductions may change rendering density only, never solver resolution, tolerances, classifications, parameter semantics or exported values.

## 1. Universal dimensional contract
Every laboratory receives a machine-readable dimensional contract with these fields:

- `native_space`: mathematical/physical space in which the invariant is actually evaluated.
- `native_dimension`: integer or symbolic dimension, e.g. `2`, `3`, `4`, `2+1`, `3+1`, `C^2`, `Hilbert(F_n)`, `phase-space 2N`.
- `state_dimension`: dimension of the dynamical/computational state where meaningful.
- `display_dimension`: `2D`, `3D`, stereo `3D`, or projected `3D`.
- `projection`: named map from native to display space, or `identity`.
- `metric_or_form`: Euclidean, Minkowski, symplectic, Hermitian, contact, graph/non-metric, etc.
- `coordinates`: coordinate chart and symbol list.
- `domain`: validity region and singular/excluded sets.

The contract must be exported through the manifest and visible in the lab inspector. Unknown values fail closed as `UNDECLARED`; they are not guessed.

## 2. Universal parameter contract
Every live laboratory control is represented by a first-class parameter descriptor:

- stable id and localized label;
- exact symbol/LaTeX spelling;
- semantic quantity kind;
- unit and dimensional signature;
- allowed domain and constraints;
- exact/default value and displayed value;
- source tier/status;
- dependencies and downstream observables;
- sensitivity metadata where available;
- whether changing it alters physics, coordinate convention, rendering only, or numerical accuracy.

The global audit must detect controls present in the UI but absent from the contract, stale contract entries, duplicate ids, dimensional inconsistencies and rendering-only controls incorrectly exported as physical parameters.

## 3. First-Principles Lens
Add a universal inspector reachable from every laboratory and every output value. It exposes a dependency DAG:

`observable -> equation -> symbols -> constants/parameters -> primitive definitions`

Each node provides:
- exact expression;
- substituted expression;
- evaluated value;
- units/dimension;
- convention/gauge/basis status;
- source/provenance;
- residual/tolerance or verification method;
- upstream/downstream links.

The Lens supports three synchronized views:
1. **Formula** — exact symbolic expansion.
2. **Dependency** — graph/DAG of derivation.
3. **Geometry** — highlight the object/curve/surface/state that the selected term controls.

No new decorative glow language is introduced. Existing premium visual grammar remains; the Lens uses hairline geometry, restrained labels and the existing white carrier/highlight system.

## 4. Anyon Zoo -> Anyon Computation Observatory
Preserve the current thirteen-model modular-data classifier and add an operational first-principles layer.

### 4.1 Common model contract
For every supported anyon model expose, when defined:
- charge set `C`;
- vacuum and duals;
- fusion multiplicities `N_ab^c`;
- fusion matrices;
- quantum dimensions `d_a` from the fusion matrices;
- total quantum dimension `D`;
- `F` symbols/matrices with declared gauge;
- `R` symbols/matrices with orientation convention;
- topological spins `theta_a`;
- modular `S` and `T` data;
- central charge/modular consistency data when present;
- allowed fusion trees and Hilbert-space dimensions;
- braid-group representation matrices `rho(sigma_i)`;
- convention-independent checks.

### 4.2 Fibonacci first-principles reference implementation
The Fibonacci model is the reference for complete expansion. The authoritative exact constants include:

`phi = (1 + sqrt(5))/2`

`phi^-1 = (sqrt(5)-1)/2`

`phi^-1/2 = sqrt((sqrt(5)-1)/2)`

Fusion:
`1 x a = a`, `tau x tau = 1 + tau`.

Fusion matrix in basis `(1,tau)`:
`N_tau = [[0,1],[1,1]]`, with characteristic polynomial `lambda^2-lambda-1` and Perron-Frobenius eigenvalue `phi`.

Standard displayed gauge:
`F_tau^(tau tau tau) = [[phi^-1, phi^-1/2],[phi^-1/2,-phi^-1]]`.

Displayed right-handed braiding convention:
`R_1^(tau tau)=exp(-4 pi i/5)` and `R_tau^(tau tau)=exp(3 pi i/5)`.

The UI must expand exponentials into sine/cosine, exact radicals where available, and decimal values. It must explicitly state that mirror/orientation reversal conjugates the braiding phases.

For three tau anyons, show both generators in the chosen fusion basis:
`rho(sigma_1)=R`, `rho(sigma_2)=F^-1 R F`, with matrix multiplication exposed step by step.

### 4.3 Computation stations
Add synchronized stations:
- **Fusion Tree** — construct allowed fusion paths and show Hilbert-space growth.
- **F/R Basis Switch** — animate reassociation separately from braiding.
- **Braid Composer** — edit braid words and multiply exact/numerical matrices.
- **Gate Comparator** — compare braid unitary to a target gate modulo global phase with declared metric/fidelity.
- **Model Contrast** — Fibonacci vs Ising vs abelian examples, showing why non-Abelian and computational universality are distinct statements.

The compiler must not claim an internally proven universality theorem. It may cite EXTERNAL universality results and measure concrete finite braid approximations.

## 5. Global laboratory audit
Create a deterministic audit generated from the live Atlas and core registry. For all 113 live laboratories it must report:
- declared native/display dimensions;
- parameter count and contract coverage;
- exact vs numerical vs external/model status;
- residual/verifier presence;
- export availability;
- bus inputs/outputs and unit compatibility;
- first-principles dependency coverage;
- mobile/XR rendering budget class.

Build fails for new undeclared physical parameters, duplicate contract ids, broken dimensional signatures, stale lab counts or version/build drift.

## 6. Manifest/API consistency
The manifest, API projection, README counts and release identity must be generated from the same measured registry. The current discrepancy (`README: 85` vs `manifest: 113`) is explicitly corrected in this release. No manually maintained laboratory count remains authoritative.

Add summary metrics:
- labs with dimensional contracts;
- physical parameters covered/total;
- formula DAG coverage;
- exact-expression coverage;
- convention-labelled objects;
- laboratories with independent residuals/verifiers;
- unresolved `UNDECLARED` items.

## 7. Visual implementation
Global visual additions are constrained to scientifically informative geometry:
- dimension badge/coordinate strip;
- formula-to-geometry highlight;
- derivation DAG;
- fusion-tree geometry;
- braid paths with ordered crossings and orientation;
- matrix cell inspector with complex phase glyphs;
- basis-change animation distinct from physical exchange;
- native-space/projection toggle when a lab has a nontrivial projection.

Avoid particle spam, bloom inflation, pseudo-volumetric fog and decorative charts embedded into 3D scenes.

## 8. Performance and stability
The v4.151 release must preserve the v4.150 GPU/mobile safeguards and add budgets for the new overlays:
- DAG/fusion/braid objects are lazily constructed only while their station/lens is active;
- no persistent animation loop for hidden inspectors;
- geometry/material disposal on station exit;
- bounded DPR and instance counts on mobile;
- matrices/formulas computed on CPU unless an existing verified GPU path is materially useful;
- XR stereo uses the same scientific state, never duplicated solver state.

## 9. Verification
Required release gates:
1. Existing `scripts/ci.mjs` passes.
2. Existing `scripts/validate.mjs` passes.
3. Manifest/API regeneration is deterministic and clean.
4. New first-principles verifier checks Fibonacci `N`, `d`, `D`, `F`, `R`, `S/T` consistency and braid relations numerically to a strict tolerance.
5. Parameter/dimension audit covers every measured live laboratory.
6. README count equals generated manifest count.
7. Version/build identity agrees across `index.html`, `version.json`, manifest and API.
8. No new unmeasured GPU/XR scientific path is introduced.

## 10. Release strategy
Implement on `agent/first-principles-atlas-4.151`, keep generated files derived from source, run full verification, open a PR with measured audit output, and merge/release only if every gate is green. If the connector cannot execute a local/browser CI path, the PR remains the release candidate rather than being falsely described as verified.
