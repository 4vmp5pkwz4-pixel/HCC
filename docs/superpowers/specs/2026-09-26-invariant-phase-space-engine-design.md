# Invariant Phase-Space Engine — Design Specification

**Date:** 2026-09-26  
**Repository:** `4vmp5pkwz4-pixel/HCC`  
**Base release:** HCC v4.327.0  
**Status:** Design approved in chat; awaiting written-spec review before implementation planning

## 1. Purpose

HCC already contains a large collection of laboratories, typed relations, invariants, quantity routes, time semantics, model contracts, verification gates, and machine-readable registries. The next architectural step is to make these pieces interact through a common state-space language without collapsing mathematical similarity into physical identity.

The Invariant Phase-Space Engine (IPSE) will provide that language.

Its purpose is to let HCC answer questions such as:

- What is the actual state space of this laboratory?
- What evolves, under which time parameter, and by which map or vector field?
- Which quantities are exact invariants, approximate invariants, monotone quantities, constraints, or merely display encodings?
- What happens to an invariant along a computed trajectory?
- Can two laboratories be related by an explicit map between state spaces?
- Does a proposed map preserve a declared invariant, geometric structure, flow, measure, or only a weaker structural pattern?
- Where is a bridge impossible because dimensions, units, manifolds, time semantics, or model domains are incompatible?
- Which relationships are exact, numerically verified, conditional, analogical, candidate, or refused?

The engine is designed as a scientific substrate, not as a visual metaphor generator and not as an automatic theory-unification system.

## 2. Scientific Principle

The governing rule is:

> A shared invariant or phase-space pattern is evidence of a structural relation only inside its declared domain. It is never, by itself, evidence that two physical systems are identical.

Every comparison produced by IPSE must preserve the existing HCC epistemic firewall:

- measured,
- inferred,
- derived,
- simulated,
- hypothetical,
- illustrative.

Likewise, every bridge must preserve or weaken existing relation semantics rather than silently strengthen them.

The engine must prefer an explicit refusal over a plausible but invalid bridge.

## 3. Scope

### 3.1 Included in the first implementation

The first implementation will provide:

1. a canonical phase-space registry;
2. a typed state-space contract for laboratories;
3. invariant and constraint declarations;
4. local and trajectory-based invariant residual evaluation;
5. a structural phase fingerprint;
6. explicit bridge definitions between state spaces;
7. bridge checks for invariant preservation, flow compatibility, and geometric-structure preservation where declared;
8. explicit refusal diagnostics;
9. deterministic rule-based candidate bridge discovery after hard compatibility filters;
10. JSON export;
11. four additive agent/MCP phase-space operations;
12. a first user-facing Phase Lens inside the Atlas/Nexus UI;
13. adapters for a deliberately small set of mathematically strong existing laboratories.

### 3.2 Initial adapters

The first release targets representative systems with genuinely different mathematical structure:

- **Navier–Stokes / Euler on S³** — dissipative or inviscid field evolution with declared exact/conditional structure;
- **Holonomy Observatory** — closed-path return maps and group-valued invariants;
- **Contact & Action Observatory** — Reeb/contact flow, return maps, action and Legendrian constraints;
- **Relativity laboratory** — Minkowski state/event transformations and Lorentz invariants;
- **Heat solver from Field Lab** — a deterministic dissipative PDE reference used specifically to exercise monotone/balance-law semantics rather than falsely classify dissipation as conservation.

The purpose of the initial adapter set is heterogeneity: conservative, dissipative, map-based, group-valued, contact-geometric, relativistic, and field-state examples must coexist under one contract without being falsely identified.

### 3.3 Explicit non-goals

The first release will not:

- infer a new physical law solely from structural similarity;
- automatically create Nexus edges;
- claim symplectic structure where a laboratory does not declare one;
- force every laboratory into canonical Hamiltonian coordinates;
- assign Lyapunov exponents where sampling or dynamics do not justify them;
- call a visualization coordinate a physical phase-space coordinate;
- compute Poincare sections for systems without a valid return construction;
- treat graph embeddings as phase spaces;
- replace existing laboratory-specific solvers;
- replace observational calibration or empirical validation;
- merge distinct clock semantics into a single physical time variable;
- use machine learning to infer bridge status in the first release.

## 4. Canonical Model

Each registered phase-space laboratory is represented by a typed object

\[
\mathcal P = (M, x, t, F, G, C, I, \Pi, D, E),
\]

with the following semantics.

### 4.1 `M` — native state space

Declares the mathematical carrier of the state:

- manifold or vector space name;
- native dimension when finite;
- finite/infinite/discretized classification;
- coordinate charts or representation basis;
- topology or boundary conditions where relevant;
- discretization if the laboratory represents a field by a finite state vector.

Examples:

- `R^(1,3)` for a Minkowski event/vector state;
- `S^3` for a normalized quaternion/spinor carrier;
- a discrete periodic lattice for a PDE solver;
- a group such as `SU(2)` for a return-map state;
- a contact energy surface embedded in `R^4`.

Unknown structure is recorded as `UNDECLARED`, never guessed.

### 4.2 `x` — typed state coordinates

Every state coordinate must declare:

- identifier;
- quantity kind;
- unit and dimension if physical;
- coordinate meaning;
- frame/observer where applicable;
- allowed domain;
- whether it is native, derived, gauge, auxiliary, or display-only.

Display-only coordinates are forbidden from participating in invariant or bridge checks unless the corresponding native-space map is explicitly declared.

### 4.3 `t` — evolution parameter

Time is not assumed to be universal.

Each laboratory declares one of:

- physical time;
- proper time;
- affine parameter;
- conformal time;
- iteration count;
- return-map index;
- path parameter;
- flow parameter;
- model-specific dimensionless time;
- static/no evolution.

The registry must additionally specify unit, orientation, epoch or origin where relevant, valid interval, and any map to the Atlas global time system.

A bridge may compare dynamics only after time semantics are checked.

### 4.4 `F` — dynamics

Dynamics can be represented as one of:

- continuous vector field `dx/dt = F(x,p)`;
- discrete map `x_(n+1) = F(x_n,p)`;
- flow operator;
- path-ordered transport;
- externally supplied trajectory sampler;
- static transformation family;
- no dynamics.

The engine must not manufacture a vector field for a laboratory that only exposes a map or transformation family.

### 4.5 `G` — geometric structure

Optional declared structures include:

- metric;
- symplectic form;
- contact form;
- volume form or measure;
- connection;
- group action;
- Poisson structure;
- causal structure;
- none/undeclared.

Each structure includes its mathematical domain and a verifier where one exists.

### 4.6 `C` — constraints

Constraints may be:

- algebraic equalities;
- inequalities;
- normalization conditions;
- gauge constraints;
- divergence-free conditions;
- domain boundaries;
- conserved submanifolds.

Each constraint records whether it is exact by construction, numerically monitored, conditional, or descriptive only.

### 4.7 `I` — invariant registry

An invariant entry has:

- `id`;
- name;
- quantity kind;
- codomain;
- formula or evaluator;
- normalization scale;
- claimed status;
- exactness class;
- applicable domain;
- tolerance policy;
- independent verifier if available;
- provenance;
- caveat.

The registry distinguishes:

- exact invariant;
- numerically conserved quantity;
- monotone/Lyapunov-like quantity;
- return invariant;
- topological invariant;
- group conjugacy invariant;
- constraint quantity;
- balance-law quantity;
- approximate/asymptotic invariant;
- candidate invariant.

These categories are not interchangeable.

### 4.8 `Pi` — allowed projections

A projection maps native state into an interface representation. Each projection must declare whether it is:

- faithful;
- many-to-one;
- stereographic;
- chart-based;
- dimensional reduction;
- observable projection;
- display-only.

The Phase Lens may render a projection, but all scientific residuals are computed in native space.

### 4.9 `D` — validity domain

The domain records the assumptions under which the phase contract is meaningful:

- parameter ranges;
- model approximations;
- coordinate exclusions;
- solver stability limits;
- physical regime;
- branch choices;
- discretization limits.

Out-of-domain evaluation is `REFUSED` rather than clamped unless the laboratory's existing contract explicitly defines clipping as part of the model.

### 4.10 `E` — epistemic envelope

Every result carries:

- epistemic status;
- source identifiers;
- formula/solver ids;
- code version/hash;
- deterministic replay parameters;
- verification results;
- uncertainty or numerical tolerance where relevant.

## 5. Invariant Probe

The engine will expose a common invariant probe.

### 5.1 Trajectory residual

For a scalar invariant `I` with declared normalization scale `S_I`, the default residual is

\[
\epsilon_I(t)=\frac{|I(x(t))-I(x_0)|}{\max(S_I,\epsilon_{floor})}.
\]

The normalization policy belongs to the invariant declaration. The engine does not invent a scale from display ranges.

### 5.2 Differential residual

For continuous dynamics where gradients are available and meaningful,

\[
\dot I(x)=\nabla I(x)\cdot F(x).
\]

The engine reports both the raw dimensional derivative and, when declared, a normalized derivative.

Finite-difference gradients may be used only when the adapter declares the coordinate chart and a convergence policy.

### 5.3 Discrete-map residual

For maps,

\[
\Delta I_n = I(F(x_n))-I(x_n).
\]

### 5.4 Structure-specific checks

Examples include:

- determinant or Minkowski interval preservation for Lorentz maps;
- contact normalization and pullback checks;
- group norm and conjugacy trace closure;
- energy/helicity/action residuals where actually declared;
- divergence or normalization constraints;
- monotonicity direction for dissipative quantities.

The engine must never call a monotone quantity a conserved invariant.

## 6. Structural Phase Fingerprint

Each adapter exposes a structural fingerprint intended for indexing and comparison, not proof of equivalence.

The fingerprint may contain:

- native state dimension or `infinite/discretized` marker;
- number and type of constraints;
- dynamics class: continuous/map/transport/static;
- conservative/dissipative/mixed/undeclared;
- declared geometric structures;
- declared invariant classes;
- local Jacobian spectrum where available;
- fixed-point count for a declared finite search domain;
- periodic/return structure when explicitly constructed;
- reversible/irreversible flag;
- compact/noncompact carrier when declared;
- gauge or quotient structure;
- time parameter class.

Fingerprint similarity is never itself a scientific relation. It is an index used to propose a `CANDIDATE_BRIDGE` for review.

## 7. Typed Phase Bridges

A bridge is an explicit map

\[
\Phi:M_A\rightarrow M_B
\]

or a weaker declared correspondence between subsets, quotient spaces, observable spaces, or invariant codomains.

Every bridge must declare its scope and one of the following statuses:

- `EXACT_MAP`;
- `NUMERICALLY_VERIFIED_MAP`;
- `CONDITIONAL_MAP`;
- `STRUCTURAL_ANALOGY`;
- `CANDIDATE_BRIDGE`;
- `REFUSED`.

### 7.1 Invariant preservation

Where meaningful, test

\[
\Phi^* I_B = I_A.
\]

The result must name the compared invariant ids and units/codomains.

### 7.2 Flow compatibility

For continuous flows with compatible time semantics, test

\[
D\Phi\,F_A = F_B\circ\Phi.
\]

If time reparameterization is declared, the engine may instead test the explicitly stated scaled relation. No implicit rescaling is allowed.

### 7.3 Geometric-structure preservation

When both sides declare comparable structures, test the appropriate pullback condition, for example

\[
\Phi^*\omega_B=\omega_A,
\]

or the corresponding metric, contact, causal, measure, or group-action relation.

### 7.4 Reduction and quotient bridges

Many useful bridges are not bijections. The registry supports:

- projection;
- quotient;
- embedding;
- limiting reduction;
- observable map;
- representation equivalence;
- section or return map.

The bridge status must reflect the weaker relation.

## 8. Refusal Engine

A refusal is a first-class scientific result.

The engine refuses a bridge or comparison when one or more required conditions fail, including:

- incompatible quantity kinds;
- incompatible physical dimensions;
- incompatible codomains;
- incompatible time semantics;
- invalid domain overlap;
- undeclared coordinate map;
- missing native-space structure;
- projection-only similarity with no native relation;
- gauge dependence not resolved by the bridge contract;
- use of stale or version-mismatched registry information;
- requested structure absent from one side;
- comparison requiring assumptions not declared by either model.

A refusal returns a structured explanation and identifies the minimum missing declaration that would make the question well-posed.

Refusals may be displayed in the UI and exposed through MCP. They must never be replaced by an inferred value.

## 9. Candidate Bridge Discovery

Candidate discovery is intentionally weaker than relation creation and is deterministic and non-ML in the first release.

The candidate engine may use only declared or independently computed features:

- matching invariant kinds;
- matching symmetry groups;
- matching state-space carrier classes;
- matching group actions;
- compatible dimensions/units;
- shared return-map structure;
- compatible declared spectral signatures when both adapters expose them;
- compatible time semantics;
- existing Nexus neighborhoods;
- existing quantity-bus routes.

Hard incompatibilities are applied before ranking. The ranking itself is a transparent weighted rule over named features, and the export must expose every contributing term. No learned embedding or opaque score is permitted in the first release.

A candidate record must include:

- why it was proposed;
- which compatibility checks passed;
- which checks remain unproven;
- which existing edges or sources motivated it;
- evidence tier;
- transparent ranking terms;
- required human/scientific review action.

No candidate is inserted into the canonical Nexus relation registry automatically.

## 10. Phase Lens UI

The Phase Lens is a new Atlas/Nexus inspection mode, not a new world.

### 10.1 Local phase view

Selecting a registered laboratory reveals its native-state summary:

- carrier/state space;
- state dimension;
- evolution parameter;
- dynamics class;
- constraints;
- invariants;
- geometric structure;
- validity domain;
- current residuals.

Where the laboratory supports a trajectory or return map, the view renders a scientifically declared projection of that trajectory.

### 10.2 Invariant Slice

The user selects an invariant or invariant family. The Atlas then shows only laboratories where that invariant is:

- literally the same typed quantity;
- linked through an explicit representation map;
- preserved by a declared reduction;
- broken or dissipated in a declared way;
- only structurally analogous;
- explicitly refused.

Every visible connection carries a relation label. Color or spatial proximity alone may not encode scientific strength.

### 10.3 Bridge Inspector

Selecting two compatible laboratories opens a bridge report containing:

- map status;
- state-space domains;
- time semantics;
- compared invariants;
- residuals;
- structure-preservation checks;
- assumptions;
- provenance;
- refusal reason if applicable.

### 10.4 Visual grammar

The visual layer must follow existing HCC scientific-firewall rules:

- trajectories are thin native-geometry carriers rather than glowing decorative pipes;
- invariant drift is displayed as separation/residual, not as arbitrary brightness;
- exact and candidate bridges use visibly different line grammar;
- refused bridges are shown only on explicit request, using a broken/terminated path and textual reason;
- display scale never modifies solver or residual calculations;
- projection geometry is explicitly labelled as projection geometry.

## 11. Data Flow

The canonical flow is:

`laboratory contract -> phase adapter -> phase registry -> invariant probe -> bridge evaluator -> export/API -> Phase Lens`

Existing laboratory-specific solver code remains authoritative for dynamics.

The IPSE adapter translates existing solver state into the canonical contract but does not duplicate solver equations.

Candidate discovery consumes the canonical registry and existing Nexus/quantity registries; it does not mutate them.

## 12. Repository Architecture

The intended structure is:

```text
core/
  phase/
    contract.mjs
    registry.mjs
    invariant-probe.mjs
    fingerprint.mjs
    bridges.mjs
    refusals.mjs
    candidates.mjs
    index.mjs
  phase-adapters/
    navier-stokes-s3.mjs
    holonomy.mjs
    contact-action.mjs
    relativity.mjs
    field-heat.mjs
```

Generated machine-readable artifacts live under `api/` and remain generated rather than hand-edited.

The first generated artifact is:

```text
api/phase-space.json
```

containing registered spaces, invariants, bridge contracts, fingerprints, release metadata, and freshness status.

Candidate bridges are included in the same artifact under a separate `candidates` section explicitly marked `noncanonical: true` and `review_required: true`. This avoids a second artifact and keeps the provenance boundary visible.

## 13. Agent and MCP Interface

The agent layer exposes phase-space capabilities without requiring WebGL through four additive operations:

- `describe_phase_space(lab_id)` — return the canonical phase contract, invariants, constraints, time semantics and freshness metadata;
- `probe_invariant(lab_id, invariant_id, input?)` — evaluate the declared invariant/monotone/constraint diagnostic through the adapter and return the provenance envelope;
- `compare_phase_spaces(lab_a, lab_b)` — run hard compatibility checks and explicit registered bridge checks, returning exact/conditional/analogy/refused results without creating a relation;
- `list_phase_bridges(lab_a?, lab_b?, status?, include_candidates=false)` — enumerate canonical registered bridges and, only when explicitly requested, noncanonical candidates.

These are additive MCP tools. Existing `describe_lab`, `run_lab`, and `list_connections` remain backward compatible; `describe_lab` may include a discoverability pointer to the phase-space contract but is not required to duplicate the full phase payload.

Every operation carries release/version metadata and freshness status.

## 14. Validation Strategy

### 14.1 Unit tests

Test pure engine behavior independently of the browser:

- exact invariant remains within declared machine tolerance;
- deliberately perturbed state fails the invariant check;
- monotone quantity is classified as monotone rather than conserved;
- incompatible units are refused;
- incompatible time semantics are refused;
- missing geometric structure is refused rather than inferred;
- exact representation bridge passes its pullback check;
- deliberately incorrect bridge fails;
- candidate discovery never creates a canonical edge;
- candidate ranking exports every contributing deterministic term.

### 14.2 Adapter tests

Each initial adapter must provide at least:

- one valid state;
- one out-of-domain state;
- one declared invariant or constraint;
- one independent verification path where the underlying lab already has one;
- deterministic replay parameters.

The Heat adapter must additionally demonstrate a monotone/balance-law quantity whose correct classification is not `conserved`.

### 14.3 Cross-domain tests

Required representative tests include:

- an exact or representation-grade bridge;
- a conditional bridge;
- a structural analogy that must remain analogy;
- a refusal caused by incompatible quantity/time/domain semantics.

### 14.4 Browser/UI tests

The Phase Lens must be tested for:

- opening from a laboratory;
- invariant selection;
- bridge inspection;
- refusal display;
- no change to underlying numerical values when visual quality changes;
- mobile usability;
- Multiview coexistence;
- XR-safe fallback behavior if the Phase Lens is exposed in XR.

## 15. Scientific Release Gates

The first IPSE release cannot ship unless all of the following hold:

1. no adapter invents undeclared native geometry;
2. every invariant has a declared status and domain;
3. every bridge has an explicit status;
4. no candidate bridge mutates the canonical Nexus relation registry;
5. out-of-domain comparisons fail closed;
6. native-space checks precede visualization;
7. generated artifacts carry release freshness metadata;
8. tests include at least one deliberate false-positive trap;
9. visual similarity cannot upgrade relation status;
10. the documentation explicitly distinguishes phase-space fingerprint similarity from physical equivalence;
11. the Heat adapter proves by test that a dissipative monotone is not promoted to an invariant;
12. agent operations return refusal objects rather than plausible substitutes when a comparison is ill-posed.

## 16. Interaction with Existing HCC Systems

### Invariant Nexus

Nexus remains the canonical human-curated graph of declared relationships. IPSE augments it with native-state evidence and candidate hypotheses but does not replace it.

### Quantity Bus

The quantity bus remains directional and acyclic. IPSE may read compatible typed quantities from the bus, but a phase bridge is not automatically a quantity route, and a quantity route is not automatically a phase bridge.

### Time Machine

The first implementation only registers time semantics. It does not yet redesign the Time Machine. A later architectural phase may use IPSE to create a universal state-time view in which compatible laboratories respond to one time coordinate through explicit time maps.

### Predictive Foundations

Existing prediction/holdout machinery remains distinct. A phase-space residual is a model-consistency diagnostic, not empirical calibration.

### KEVALIN

Phase-space contracts and bridge results are versioned public artifacts suitable for continuity handoff. Later agents must re-check current repository state and freshness before trusting prior bridge results.

## 17. Future Extensions

The architecture is intentionally capable of later supporting, without promising them in the first release:

- Poincare sections for laboratories that expose a valid return construction;
- local linearization and stability spectra;
- bifurcation tracking;
- action-angle coordinates where explicitly available;
- invariant manifolds;
- continuation methods;
- symplectic/contact reduction;
- measure-preservation checks;
- transfer operators;
- topological summaries of trajectory families;
- a Universal State-Time Machine;
- a stronger Invariant Compiler for reviewable bridge hypotheses;
- synchronized Multiview of one invariant across different native spaces.

Each extension must satisfy the same rule: mathematical structure may reveal a relationship, but relation strength is earned by an explicit map, domain, verifier, and provenance.

## 18. Success Criteria

The first implementation is successful when a user or agent can select a supported laboratory and obtain a reproducible answer to:

1. what its native state is;
2. how that state evolves;
3. what is constrained, conserved, monotone, or invariant;
4. how well the declared diagnostic is satisfied in the current run;
5. which other registered laboratories have an explicit phase relation to it;
6. which proposed relations are only structural candidates;
7. which comparisons are refused and why;
8. how to replay and verify every reported result.

The scientific value is not the number of connections shown. It is the ability to distinguish exact connection, conditional connection, analogy, and impossibility while moving across mathematics, physics, time, and visualization without losing provenance.
