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

### Spinor & Light-Cone Observatory operational contract

Spinor & Light-Cone Observatory is a chain of five **exact representation
experiments**. Its common projective geometry does not make a qubit, photon,
polarization frame, gravitational wave or conformal boundary one physical
observable.

| Station | Exact anchor | Independent check | Validity boundary |
|---|---|---|---|
| spinor → future null ray | `k^μ=ψ†σ^μψ`, `k·k=0`, `k⁰>0` for normalized `ψ∈C²` | rank-one determinant of `2ψψ†`, spinor normalization and direction before/after common U(1) phase | normalized two-spinors and the associated CP¹ direction; not a photon preparation or qubit-to-photon identification |
| `SL(2,C)` → Lorentz | `X′=AXA†`, `det X′=det X=x·x` | determinant one, interval closure, time orientation and identical transformations from `A` and `−A` | proper orthochronous flat-spacetime kinematics; no curvature or Einstein-equation solver |
| celestial Möbius map | `ζ′=(c+dζ)/(a+bζ)` for the displayed matrix convention | projective-spinor agreement, transformed-null-direction agreement, nullity and four-point complex cross-ratio closure | observer sky coordinates only; drawn separations, chords and colors are not angles, fluxes or lensing data |
| null tetrad & spin weight | spin dyad gives `l·n=1`, `m·m̄=−1`, all other required contractions zero | opposite dyad rephasing fixes `l,n`, rotates `m` by weight one and `m⊗m` by weight two | local flat null frame and polarization phase; no curvature scalar, source waveform or detector response |
| conformal null diamond | `U=atan((t−r)/L)`, `V=atan((t+r)/L)` preserve `U=const` and `V=const` null families | inverse-map closure and outgoing/ingoing coordinate drift | radial `1+1`, `r≥0` section of flat Minkowski spacetime only; not a cosmological or black-hole Penrose diagram |

Every invariant must be computed in C², Herm(2), Minkowski R^(1,3), or the
declared radial conformal section before its 3D interface projection. Displayed
Euclidean lengths and angles are not promoted to native Lorentzian or
projective observables. Residuals are deterministic binary64 implementation
checks, not experimental uncertainties or evidence for a new physical effect.

Every Spinor & Light-Cone export must preserve the station catalog, parameters,
native complex/matrix/vector values, metric and Pauli conventions,
discretisation counts, residual, tolerance, contract, caveat and epistemic
firewall. Passing all five stations does not extend flat-space identities to an
arbitrary curved metric, solve quantum gravity, classify all spin structures,
or identify the five represented systems physically.

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

### Contact & Action Observatory operational contract

Contact & Action Observatory is a family of five **native-dimensional model
experiments** joining symplectic phase space to dynamics on an S³ energy shell.
Their shared visual grammar does not assert that contact action, knot type,
collision regularization and quantum phase are one physical observable.

| Station | Exact anchor | Independent check | Validity boundary |
|---|---|---|---|
| standard S³ Reeb flow | `λ₀=1/2 Σ(x dy−y dx)`, `R=2Jz`, `λ₀(R)=1`, `ι_Rdλ₀=0` | explicit contact-plane contraction, constant Hopf image, period/action `π`, finite projected `|Lk|≈1` | unit round S³ and this standard contact form; projected lengths and angles are not contact invariants |
| ellipsoid return | `φ_R^t=(e^{2it/a}z₁,e^{2it/b}z₂)` and section rotation `2πb/a` | surface/contact normalization, determinant-one return matrix and bounded rational-closure test | displayed integrable ellipsoid only; no arbitrary global surface-of-section claim |
| Legendrian torus knot | `γ_(p,q)=(sqrt(q/(p+q))e^{ipt},sqrt(p/(p+q))e^{-iqt})` | full-curve norm, closure and sampled `max |λ₀(γ̇)|` | one primitive coprime family; no complete Legendrian classification or contact-homology computation |
| KS collision chart | `X:R⁴→R³`, `|X(u)|=|u|²`, `X(e^{iθ}u)=X(u)` and `dt=|u|²ds` | gauge sweep, norm identity and independently recovered radial exponent `r∝|t|^(2/3)` | radial collision coordinate model; not a perturbed general N-body integrator or global regularization theorem |
| Maslov/EBK lift | `I=(1/2π)∮p dq=(n+μ/4)ħ`, `μ=2` for the 1D oscillator | 2,048-edge phase-loop quadrature, caustic count and metaplectic phases `2π→−1`, `4π→+1` | harmonic oscillator benchmark; generic potentials require their own actions, caustics and semiclassical error analysis |

Contact and KS identities must be computed in R⁴ before any 3D projection.
The Gauss integral and polygonal action are deterministic convergence checks,
not experimental uncertainties. A rational approximation with bounded
denominator is a report about that finite search, never proof that an arbitrary
real ratio is rational or irrational.

Every Contact & Action export must preserve station contracts and caveats,
normalized and physical controls, native coordinates, paths, sample counts,
analytic values, independent residuals, tolerances and an epistemic firewall.
Passing a station means only that its implementation agrees with its named
model identity at binary64 tolerance; it does not prove a theorem for arbitrary
contact or Hamiltonian systems, classify all knots, solve the N-body problem,
or establish a new observed effect.

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

## Visual encoding firewall

The five rebuilt observatories use one native spatial grammar: a path may be
rendered as a volumetric tube, phase as a braid twist, residual as separation
from an exact orbit, parallel transport as a sampled frame field, integrated
curvature as an enclosed surface, and null structure as a cone or conformal
diamond. Each mark must be generated from an already declared model output.
Its Euclidean thickness, glow, particle density, filament frequency and scene
placement are interface parameters, not extra coordinates, energies,
probabilities, uncertainties, confidence scores or new invariants.

Hardware adaptation may reduce tube subdivisions, instanced particle counts or
post-processing resolution. It must not change the native sample sequence,
solver step, analytic anchor, residual, tolerance, classification, exported
value or epistemic status. A visually closed tube never substitutes for the
native-space closure check, and visual intersection/proximity never creates a
relation absent from the typed registry.

The shared cinematic layer is an optional user preference and is disabled by
default. Its absence must preserve the original laboratory presentation. When
enabled, its elements are interface context, not scientific evidence. The
camera-facing precision stage, glow, bloom, glass surfaces, transition veil and
domain accent must never be read as an additional coordinate system, field,
confidence interval, energy density or measured magnitude. Domain accents are
categorical navigation aids only. Their hues and intensities have no scalar
ordering.

Display adaptation may change post-processing resolution and label visibility,
but it must not change model geometry, integration steps, lattice sizes,
sampling, selections, controls, diagnostics or exported values. Selected and
major annotations take priority during collision removal. A shared facing-plane
ornament must be disabled where its geometric assumption is false, including
stereo XR and multi-camera Multiview.

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
