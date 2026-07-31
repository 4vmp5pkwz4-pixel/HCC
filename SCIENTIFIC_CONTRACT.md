# Scientific Contract

The atlas is an interactive scientific model, not an oracle. Every visual claim
must remain traceable, reproducible and falsifiable.

## Epistemic status

Every exported datum and every future laboratory plugin must declare one status:

- `measured` — directly reported by an observation or experiment;
- `inferred` — estimated from measured data under a stated model;
- `derived` — computed from declared inputs and equations;
- `simulated` — produced by a numerical model with disclosed boundaries;
- `hypothetical` — a testable model assumption or prediction;
- `illustrative` — a visual or pedagogical aid that is not evidence.

The UI must never promote a datum to a stronger status through animation,
precision formatting or visual proximity.

## Scientific datum

A load-bearing numerical value should be representable as:

```text
value
quantity kind
unit and physical dimension
reference frame and observer
epoch and time scale
uncertainty distribution and covariance reference
epistemic status
source identifier, version and licence
formula or solver identifier, parameters and code hash
validity domain
verification results
```

A scalar without its quantity kind is not a scientific identity. Consequently,
Inverse Atlas requires a quantity selection. Its explicit all-kinds mode is an
exploratory coincidence scan and does not assert equivalence.

## Relation types

Every future relation edge must use one declared type:

1. exact identity;
2. unit, coordinate or observer transformation;
3. isomorphism or equivalent representation;
4. limiting reduction;
5. shared symmetry;
6. shared invariant or conservation law;
7. scale transformation;
8. empirical correlation;
9. causal hypothesis;
10. analogy;
11. contradiction or competing explanation.

Each edge must state its transformation, domain, evidence, uncertainty and test.
Numerical equality alone is not a relation.

### Invariant Nexus operational classes

Invariant Nexus presents the canonical taxonomy through eight interface classes:

| Nexus class | Canonical relation types | Required interpretation |
|---|---|---|
| `exact` | 1 | A theorem or exact identity only inside the stated mathematical model. |
| `representation` | 2–3 | A coordinate, basis, isomorphism or equivalent-representation statement; physical systems may still differ. |
| `invariant` | 5–6 | The same typed symmetry, invariant or conservation law is measured or asserted under declared domains. |
| `limit` | 4 and, where explicit, 7 | A limiting/effective reduction with assumptions; never a universal identity. |
| `coupling` | 7–8 or a declared model input | One model can condition or feed another; this does not imply a unit-safe coupled solver. |
| `causal` | 9 | A directed, conditional physical succession. Comparison traversal may inspect it in either direction but may not reverse the causal claim. |
| `analogy` | 10 | Shared structure or morphology without physical identity. |
| `contrast` | 11 | A discriminating comparison, contradiction or competing explanation that must remain visibly distinct. |

Every Nexus node is an interface proxy for a laboratory, not a second physical
object. Its two exported positions are visualization coordinates. The
disciplinary embedding groups fields by human taxonomy; the invariant embedding
is a deterministic projection of relation-type counts. Neither coordinate is a
physical distance, similarity magnitude, probability, evidence score or causal
effect.

A Nexus path means only that consecutive laboratories share declared typed
edges. A mixed path is not a proof of equivalence or unification. It is not a
causal chain unless every edge is explicitly causal, correctly oriented and
valid under one compatible scenario. JSON exports must preserve the edge type,
claim, status, direction flag and this non-metric disclaimer.

### Holonomy Observatory operational contract

Holonomy Observatory is a family of five **declared mathematical return-map
experiments**. A common closed-path interface does not make their physical
systems identical.

| Station | Exact anchor | Independent check | Validity boundary |
|---|---|---|---|
| round S² | `Δα = ∫K dA = Ω (mod 2π)` | exact edge transport on a 1,024-edge geodesic polygon | one latitude on a round sphere; finite polygon error remains |
| spin-½ Berry | `γ_B = −Ω/2` | normalized 257-link Pancharatnam product before/after deterministic local U(1) rephasing | ideal adiabatic two-level eigenstate geometry; no device dynamics |
| SU(2) Wilson loop | `C=UₓUᵧUₓ⁻¹Uᵧ⁻¹`, `W=½Tr C` | quaternion unit norm, conjugated trace and commuting U(1) control | finite SU(2) rotations; `αβ` is only a small-loop BCH limit |
| Thomas–Wigner | `Ω_W=−2 atan[tanh(α/2)tanh(β/2)]` for orthogonal boosts | equivalent `atan2` form plus determinant and Minkowski-interval closure in both orders | special-relativistic 2+1 kinematics; not arbitrary acceleration or gravity |
| SL(2,R) Möbius | `det C=1`, `Tr(HCH⁻¹)=Tr C` | direct matrix commutator and complex probe orbit | displayed real elliptic/hyperbolic family only |

The exported residual is a numerical implementation diagnostic, not an
experimental uncertainty. Passing means that the independent computation agrees
with the named analytic anchor within the declared binary64 tolerance. It does
not detect global topology, establish a new physical effect, classify every
connection or holonomy group, or turn an analogy between stations into an exact
physical equivalence.

Every Holonomy export must preserve normalized controls, physical parameters,
raw path/group data, sample counts, analytic and numerical return values,
residual and tolerance, station contract, caveat, deterministic-gauge formula
and the cross-domain epistemic firewall.

### Symmetry Discovery operational contract

Symmetry Discovery Chamber is a deterministic finite-orbit **candidate test**,
not an automated theorem prover. Its declared benchmark library contains five
transformation families and twenty named observables:

| Transformation family | Exact benchmark candidates | Deliberate negative controls |
|---|---|---|
| SO(3) rotation about a fixed axis | vector norm squared, axial component | Cartesian component, component sum |
| SO⁺(1,1) Lorentz boost (`c=1`) | Minkowski interval | time, space, Euclidean norm squared |
| global U(1) phase of a qubit state | state norm, both Born probabilities | real part of one amplitude |
| harmonic symplectic phase rotation | quadratic Hamiltonian, determinant | canonical coordinate, coordinate product |
| determinant-one Möbius action | complex four-point cross-ratio | pair distance, centroid, point radius |

For each family, the chamber samples 65 deterministic parameter values and
reports the maximum normalized drift relative to the first sample. Passing the
selected numerical tolerance means only “stable on this sampled orbit within
this candidate library.” It does not prove invariance for every group element,
prove a conservation law for an unspecified dynamics, establish a physical
discovery, or exclude unlisted invariants.

The `epsilon_break` control is a documented **non-group perturbation**. Its only
role is to test whether the instrument responds when exact symmetry is removed;
drift under that perturbation is not evidence against the unperturbed group
action. Every export must preserve the transformation family, sample sequence,
candidate values, normalized residuals, tolerance, perturbation amplitude and
the finite-scan epistemic firewall.

## Validation obligations

Each laboratory must eventually provide:

- at least one analytic or published benchmark;
- dimensional and domain checks;
- deterministic replay parameters;
- numerical convergence or conservation checks where a solver is used;
- provenance and uncertainty for every load-bearing output;
- an explicit statement of what could falsify the represented claim.

The repository validator is a trust gate, not proof that a scientific hypothesis
is true. Passing checks means that the implementation satisfies its declared
contracts and benchmarks.

## Version discipline

Publication labels, application calculations and independent model extensions
must be stored separately when they do not numerically coincide. The FB(S³)R
`N_rec=266` publication label and the CoScale clock `t(N)=t_P phi^N` are the first
enforced example of this rule.
