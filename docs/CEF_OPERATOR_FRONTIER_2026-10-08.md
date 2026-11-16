# CEF Operator Frontier: independent obstructions, exact model theorems and a closure programme

**Date:** 2026-10-08. **Evidence status:** verified elementary mathematical consequences of stated hypotheses; not an independently established new law of quantum gravity. Formal publication novelty and Lean formalization **not established**.
**Kernel:** `core/research/cef-frontier.mjs`
**Regression:** `node docs/verify-cef-operator-frontier.cjs`
**Browser instrument:** [CEF operator observatory](cef-frontier-observatory.html).

## 0. Epistemic taxonomy

- **Classical mathematics:** Riemann–Roch/Serre duality on CP¹; clock-shift/Bott obstruction; modular centralizer facts; Weyl commutation.
- **Derived here:** explicit joint CP¹ evaluation × clock-shift countermodel, quantitative uniform 1/8 obstruction, selector sensitivity/identifiability certificate, and an admission checklist for CEF bridges.
- **Open:** physical identification of CP¹ evaluation bundle with corner edge modes, quantized Bott class, a Type III→Type II functor preserving the relevant dynamical data, UV-renormalized source of q*, and empirical validation.
- **No claim:** none of these mathematics-only combinations establishes a new physical law, a fundamental quantum gravity solution, or priority over existing literature.

## 1. Direct Type-II obstruction to scalar-centralizer bounded recovery

The [OpenAI Math modular bounded-recovery manuscript](https://github.com/openai/math/blob/main/preprints/Bounded-recovery-for-modular-spectral-averages-September-23-2026/build/sections/01-introduction.tex) requires `M_phi = C·1` for its key recovery theorem. That hypothesis cannot hold for a nontrivial semifinite **Type-II factor** with a faithful normal state.

**Proof.** Let `M` be such a factor with faithful normal semifinite trace `tau`. For faithful normal state `phi`, noncommutative Radon–Nikodym gives `phi(x)=tau(hx)` for a positive (possibly unbounded) tau-measurable density `h` affiliated with `M`, with `tau(h)=1` and support `1`. Modular automorphisms satisfy `sigma_t^phi(x)=h^(it)x h^(-it)`. Every spectral projection `p=1_B(h)` is fixed and belongs to `M_phi`. If `h` is nonscalar, some such projection is nonzero and not `1`; hence `M_phi != C·1`. If `h=c·1`, the modular action is trivial and `M_phi=M != C·1`. In Type II_infinity, `h=c·1` with `c>0` cannot even normalize to a state since `tau(1)=infinity`. □

**Practical conclusion.** Do not apply the scalar-centralizer theorem directly to the horizon Type-II trace/normal-weight sector `T_q`. A different ambient Type-III algebra, an explicit extension/crossed-product, or a different theorem is necessary. The Type-II horizon sources below are perturbative constructions with their own stated conditions.

## 2. Exact CP¹ index lock does not force topological operator lock

Let `L=O(n-1)` on CP¹, and let `Z` be an effective divisor of degree `n>=4` (possibly confluent). From

```text
0 → O(-1) → O(n-1) → O(n-1)|Z → 0
```

and `H^0(CP¹,O(-1))=H^1(CP¹,O(-1))=0`, the evaluation map

```text
ev_Z : H^0(CP¹,O(n-1)) → H^0(Z,O(n-1)|Z)
```

is an isomorphism; both spaces have complex dimension `n`. This is the exact `q_ind=N_emb=n` interpolation lock in this stated mathematical model.

Independently, choose a basis of the resulting `n`-dimensional space and equip it with the clock and cyclic shift pair:

```text
U e_j = exp(2πij/n) e_j,   V e_j = e_(j+1 mod n).
UVU*V* = exp(2πi/n) I,
||UV-VU|| = 2 sin(π/n) → 0,
Bott(U,V) = Tr Log(UVU*V*)/(2πi) = 1.
```

The logarithm is the principal logarithm, well-defined since `n>=4` (its spectrum avoids `-1`).

**Proposition: uniform quantitative obstruction.** Let `n>=4`. For **any commuting unitaries** `A,B` in `M_n(C)`,

```text
max(||U-A||,||V-B||) >= 1/8.
```

**Proof.** Suppose both distances are `<1/8`. Since they are below `2`, connect `U` to `A` and `V` to `B` by their principal-log unitary geodesics `U_t,V_t`, each at distance `<1/8` from its starting point for `t∈[0,1]`. Set `W_t=U_t V_t U_t* V_t*`. Telescoping four unitary products gives
`||W_t-W_0||<4/8=1/2`. But
`||W_0-I||=2sin(π/n)<=sqrt(2)`. Hence
`||W_t-I||<sqrt(2)+1/2<2`, so `-1` never lies in the spectrum of `W_t`. Thus `Tr Log(W_t)/(2πi)` is a continuous integer: its integrality follows from `det W_t=1`. At `t=0` it equals `1`, and at `t=1` the commuting pair gives `W_1=I` and invariant `0`, a contradiction. □

This yields a **joint exact countermodel**: rank equality and perfect CP¹ evaluation are consistent with an additional operator-level topological obstruction, even as `||[U,V]||→0`. **It does not assert that a physical CEF corner bundle has this Bott class.** That must be computed from its actual edge-mode representation.

For strict closure of `q_can–q_ind–N_emb`, need (a) the existing index equality, (b) an independently defined physical operator map, and (c) agreement of the relevant K-theory / cocycle class whenever the target requires trivialization.

**Relevant primary source:** [Near Inclusions of von Neumann Algebras Without Small Spatial Embeddings](https://github.com/openai/math/tree/main/preprints/Near-Inclusions-of-von-Neumann-Algebras-Without-Small-Spatial-Embeddings-October-5-2026) uses the classical Voiculescu/Exel–Loring obstruction. Its one-sided near-inclusion result should not be conflated with the separate two-sided [strong Kadison–Kastler stability](https://github.com/openai/math/tree/main/preprints/Universal-strong-Kadison-Kastler-stability-September-23-2026).

## 3. Conditional shape / logarithmic BMS non-factorization test

Suppose the **actual, validated physical** edge-mode charges exponentiate to unitary Weyl operators `W_f,V_g` obeying

```text
W_f V_g = exp(i kappa <f,g>) V_g W_f .
```

If `exp(i kappa <f,g>) != 1`, there can be **no** tensor decomposition assigning `W_f` exclusively to the first factor and `V_g` exclusively to the second factor, because operators on independent tensor factors commute exactly.

This is a rigorous **conditional factorization obstruction**, not an unconditional identification of gravitational shape and memory charges. The sources [Logarithmic supertranslations at null infinity](https://arxiv.org/abs/2609.11785) and [covariant logarithmic supertranslations at spatial infinity](https://arxiv.org/abs/2603.08784) offer candidate charged pairs. Must determine actual symplectic normalization, gauge quotient, parity sector and surviving cross-bracket before applying.

The physical identification `shape ↔ log/BMS memory` is presently **open**.

## 4. UV selector: sensitivity and structural non-identifiability

Under the **explicit conditional** one-loop relations

```text
q* = Xi_edge exp(16π²/g),  g = b g_d² > 0,
Lambda = 3π/(l_P² q*),
```

let `beta=16π²/g`. Taking logs yields

```text
log Lambda = log(3π/l_P²) - log Xi_edge - beta.
```

Consequently

```text
∂(log Lambda)/∂(log g) = beta,
∂(log Lambda)/∂(log Xi_edge) = -1.
```

For the *model inputs in the existing HCC selector* `g=0.559754586` and `Xi_edge=0.99916928`, `beta≈282`. Thus, with `Xi_edge` independently held fixed, a **1%** increase in `g` changes `log Lambda` by approximately `beta·0.01/1.01≈2.79`, so `Lambda` changes by roughly a factor `16`. To constrain `Lambda` within **1%** from positive coupling variation alone requires relative precision on `g` near `log(1.01)/(beta-log(1.01))≈3.5e-5`, before other uncertainties.

**Exact identifiability obstruction.** With only `Lambda` as observed output, the pair `(g,Xi_edge)` is not identifiable: for any `g'>0`, choose

```text
Xi'_edge = Xi_edge * exp(16π²/g - 16π²/g'),
```

and the predicted `Lambda` is unchanged. The observation Jacobian `[-1, beta]` has rank one, so it cannot determine two independent parameters. An independent measurement or derived constraint on one parameter is necessary. This is model-theoretic non-identifiability, not a physical gauge symmetry.

**Floating-point no-go for discrete capacity tests.** With `q*=3.307251460713979e122`, JavaScript's binary64 `q*+1 === q*`. Numerical agreement of integer capacities at such scales cannot be checked by comparing binary64 `q` values. The analytic CP¹ index model or exact symbolic/integer certificates must be used instead.

**Selector warning retained from PR #492.** For `Gamma=q(log(q/q*)-1)+nu log q+r(q)`, `Gamma'=log(q/q*)+nu/q+r'(q)` and `Gamma''=(q-nu)/q²+r''(q)`. Domain-restricted convexity in the current verifier assumes the omitted remainder is constant. Generic `O(1)` alone does **not** control either derivative.

## 4a. Exact Hopf–corner topological transgression on S³ → S²

Let `pi:S³→S²` be the standard Hopf fibration, with connection `alpha` normalized by `∫_(S¹ fiber) alpha=2π`. Its curvature `dalpha=pi*F` descends to `S²`. Orient the base and total space compatibly, so `∫_(S²)F/(2π)=+1`. Fiber integration gives the **exact identity**

```text
(1/(2π)^2) ∫_(S³) alpha∧dalpha
= (1/(2π)) ∫_(S²) F
= c₁(Hopf bundle)[S²] = 1.
```

**Elementary direct proof in Hopf coordinates.** Put `z₁=cos(eta)exp(i ξ₁)`, `z₂=sin(eta)exp(i ξ₂)` with `0≤eta≤π/2` and both angular coordinates modulo `2π`. Set

```text
alpha = cos²(eta)dξ₁ + sin²(eta)dξ₂,
alpha∧dalpha = sin(2eta) d eta ∧ dξ₂ ∧ dξ₁
```

with the displayed positive orientation. Integrating over the coordinate fundamental domain yields `(2π)^2 ∫₀^(π/2) sin(2eta)deta = 4π²`. Independence under smooth U(1) gauge transformations follows from `(alpha+dchi)∧d(alpha+dchi)-alpha∧dalpha=d(chi·dalpha)` and Stokes' theorem on closed `S³`. A convergence-checked midpoint quadrature computes the same normalized value in `hopfFiberTransgression`.

**Cohomological firewall.** `H¹(S³,Z)=0` and `H²(S³,Z)=0`, while `H³(S³,Z)=Z`. The nonzero Chern class is on the **base S²**, not on the total space S³. All complex line bundles on S³ are topologically trivial even though the **connection's Chern–Simons/Hopf 3-form** can carry a nonzero integral. It is incorrect to infer a bulk U(1) first Chern class from this invariant.

**CEF opportunity, not closure:** this is an explicit bulk S³ → codimension-one base S² characteristic-class bridge, a candidate **template** for edge/determinant-line transgression. To make it a gravitational CEF theorem one must exhibit the correct physical principal bundle, identify horizon or corner charge with `F`, and establish the relevant Fredholm/index map. The Hopf number `1` is not the astronomical capacity `q_*`, nor an explanation of dark matter/energy. A higher-degree base Chern number generally changes the principal bundle total space (e.g., lens spaces), so one must not silently replace the topology of the fixed standard Hopf fibration.

## 5. A multi-invariant CEF admission vector

Represent each candidate physical bridge by the typed data

```text
I = (
  d_index = q_ind-N_emb,                       integer,
  b_Bott = [corner holonomy operator pair],    integer / defined only with log gap,
  omega_mix = exp(i*kappa<pairing>),           phase,
  modular_centralizer_type,                    algebra + state/weight,
  uv_beta = 16π²/g and sensitivity bounds,    dimensionless,
  Hopf–Chern transgression (if physical bundle identified),\n  regulator/continuum limit,
  physical source, measurement or falsifier
).
```

**Necessary tests, not sufficient conditions:** for a target *requiring* trivial operator holonomy, `b_Bott=0` is required; for a target *requiring independent* tensor factors, `omega_mix=1` is required; for Type-II normal states the scalar-centralizer hypothesis of OpenAI Math bounded recovery cannot be used; for predictive Lambda the selector inputs must be independently fixed. No admissibility test is a proof that physical corner, index, modular and BMS constructions coincide.

## 6. Prioritized closure experiments

| Priority | Bridge / proposed experiment | Explicit success condition | A falsifying result |
| --- | --- | --- | --- |
| P0 | Physical corner representation → CP¹ evaluation map | Construct a functor/morphism preserving symplectic form, degree, dimensions **and** Bott/cocycle data | Nonzero mismatch in a transported topological index |
| P0 | Type-III ambient → Type-II horizon normal weight `T_q` | Construct crossed-product / reduction with faithful normal weight and check trace and modular action | Scalar-centralizer proof invoked directly on nontrivial Type-II state |
| P0 | UV `Z_edge` and selector | Regulator-independent source of `q_*`, uncertainty propagation, calibration/holdout prediction | `q_*` fixed by the sky, invisible free parameter, or large sensitivity incompatible with independent input bounds |
| P1 | Null charge / shape / memory algebra | Compute actual bracket from covariant phase space; record central term and gauge quotient | Nonzero cocycle when exact tensor factorization is required |
| P1 | Damour/CIVP index transgression | Construct determinant-line curvature and index map on a specified elliptic/Fredholm complex with domain | Missing complex, non-Fredholm operator, incompatible boundary conditions |
| P1 | Area laws, Bondi–Penrose, focusing | Transport explicitly typed inequality with physical dimensions and matching hypotheses | Conflation of area of horizon with minimum enclosing area, of lattice q with capacity q, or of perturbative with nonlinear regime |

## 7. Primary source register

- [OpenAI Math — 2026-10-08 main](https://github.com/openai/math/commit/fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb). Maintainers warn not all unformalized manuscripts are sound; their [history](https://github.com/openai/math/blob/main/history.md) records three related withdrawals following a sign error.
- [Bounded recovery Lean solution](https://github.com/openai/math/blob/main/lean/OAI/Analysis/ModularRecovery/Recovery.lean) contains a proof script for a *stated* scalar-centralizer theorem; independent full compilation and applicability to CEF are not established here.
- [Subregion algebras in classical and quantum gravity](https://arxiv.org/abs/2601.07915) (Chandrasekaran–Flanagan): perturbative horizon crossed products, Type II_infinity, modular structure and focusing.
- [Generalized black hole entropy is von Neumann entropy II](https://doi.org/10.1103/tb6y-lsfv): perturbative gravitational shape edge charges and Type II horizon entropy; distinguishes black hole and de Sitter algebra types.
- [Horizon edge partition functions in quantum gravity](https://doi.org/10.1103/c683-tqw8): one-loop edge spectra and shift symmetries, not a nonperturbative derivation of the HCC selector.
- [Logarithmic supertranslations at null infinity](https://arxiv.org/abs/2609.11785): corner matching of logarithmic charges.
- [Two-dimensional lattice area law from global spectral gap](https://github.com/openai/math/tree/main/preprints/A-two-dimensional-area-law-from-a-global-spectral-gap-September-24-2026): a **non-gravitational** lattice state, not an entropy derivation for CEF.

## Decision

The new concrete deliverable is a **minimal obstruction atlas** with exact algebraic identities and independent numerical witnesses. No paper's self-classification or passing unit tests has been silently promoted into an established quantum-gravity theorem. Production cosmological parameters remain unchanged.
