# The Planck–Casimir zero-point fractal ladder

This directory holds the derivation that the atlas's zero-point sector implements,
the numbers it was checked against, and the two scripts that do the checking.

| file | what it is |
|---|---|
| `zero-point-fractal-ladder.ru.md` | the derivation, in full, with its status declared at the top |
| `zero-point-fractal-ladder-summary.json` | constants, closed forms and twelve milestone rungs |
| `zero-point-fractal-ladder-levels-0-312.csv` | all 313 rungs, 24 columns |
| `verify-zero-point-ladder.cjs` | an independent second implementation of every claim |
| `verify-zero-point-csv.cjs` | recomputes every cell of the CSV from first principles |
| `verify-log-periodicity.cjs` | calibrates the predefined log-periodicity test, including its false-positive rate |
| `verify-field-content-and-backreaction.cjs` | derives every species' Casimir coefficient from its own S³ spectrum and solves the backreaction equation |
| `verify-berger-euler-wpa.cjs` | Work Package A — exact Euler-top frequencies, the signed rotation number, and the refutation of ρ = 1 − λ² |
| `verify-zeckendorf-structure.cjs` | the Origin-of-φ audit: four structures kept apart, and why none of them derives φ |
| `verify-floquet-gap-c1.cjs` | Work Package C1 — the bright/dark decomposition, the detuning scan, and whose gap it is |
| `verify-hopf-splitting.cjs` | the Berger deformation lifts the Hopf charge degeneracy, and the Smith map is a rotation of the Riemann sphere |
| `verify-momentum-map-unification.cjs` | the Hopf map IS a momentum map — one construction behind four laboratories |
| `verify-bianchi-ix-wpd.cjs` | Work Package D — every coefficient of the Bianchi IX action, checked against the closed-FLRW limit |
| `data/floquet-detuning-scan.csv` | the 41-point detuning scan the C1 hyperbola is fitted against |

```
node docs/verify-zero-point-ladder.cjs     # 16/16 checks pass
node docs/verify-zero-point-csv.cjs        # 313 rows × 24 columns reproduced
node docs/verify-log-periodicity.cjs      # finds a signal, and fails to find one that is not there
node docs/verify-field-content-and-backreaction.cjs   # 11/11 checks pass
node docs/verify-berger-euler-wpa.cjs      # 8/8 checks pass
node docs/verify-zeckendorf-structure.cjs  # 10/10 checks pass
node docs/verify-floquet-gap-c1.cjs        # 7/7 checks pass, writes data/floquet-detuning-scan.csv
node docs/verify-bianchi-ix-wpd.cjs        # 9/9 checks pass
node docs/verify-momentum-map-unification.cjs  # 8/8 checks pass
node docs/verify-hopf-splitting.cjs        # 7/7 checks pass
```

Neither script reads the atlas. They exist so the tables can be disbelieved and then
checked, rather than believed.

## What was verified, and to what

Every closed form in the derivation was reimplemented from `ħ, c, G, k_B` and compared:

| claim | residual |
|---|---|
| ω_β = βc/R with g_β = β² is the conformal scalar spectrum on round S³ — because k(k+2)+1 = (k+1)² | exact, k = 0…40 |
| Σ_{β≤M} β³ = [M(M+1)/2]², so E_bare = ħcM²(M+1)²/8R and E(2M)/E(M) → 16 | 15.984 → 16 |
| ζ(−3) = −B₄/4 = 1/120 | 1e-15 |
| ρ_C = E_C/(2π²R³) = ħc/(480π²R⁴) | 1e-14 |
| action cells ε₀R/c = βħ/2 and E_C R/c = ħ/240 | 1.8e-16 · 1.9e-16 |
| 2Gε₀/(c⁴R) = (ℓ_P/R)² = φ^{−2N}, exactly 1 at N = 0 | 1.8e-16 |
| d(ρV) + p dV = 0 with p = ρ/3 forces ρR⁴ = const, on both the spectral and the continuity route | 2.1e-16 · 1e-14 |
| T_eq = ħω/(k_B ln 3) is exactly where the thermal term equals the zero-point term | 2.4e-16 |
| rung ratios φ⁻¹, φ⁻², φ⁻⁴ | 1e-15 |
| Hopf U(1) charge splitting: β charges × multiplicity β = β², for β = 1…30 | exact |
| all twelve milestones of the summary reproduced | worst 5.9e-8 |
| all 313 CSV rows, all 24 columns | worst 6.8e-14 |

## Three things that were not in the derivation

**The bridge to the blackbody laboratory, evaluated.** The report names a "Planck
bridge" and never crosses it. At high θ the S³ shell sum must forget the box:

    Σ_{β≥1} β³/(e^{β/θ} − 1)  →  θ⁴ Γ(4) ζ(4) = π⁴θ⁴/15,

and dividing by the S³ volume 2π²R³ makes every trace of R and of the compactness
cancel, leaving

    ρ_th  →  π² (k_B T)⁴ / (30 (ħc)³),

the Stefan–Boltzmann density of exactly **one real scalar degree of freedom** — which
is what the ladder declares itself to be. Verified to 1.6e-13 in physical units at
θ = 300. Below the crossover the same sum dies as e^{−1/θ}, matching the leading term
to three digits at θ = 0.08; that is what makes this a zero-point ladder rather than a
thermal one in disguise.

**The exponent, measured rather than assumed.** `d_eff = q − z` is written down in the
report and evaluated on nothing. Taking two rungs and inverting ρ₂/ρ₁ = φ^{−q ΔN}
returns q = 4.000000000000 on the Casimir branch, 3 on the fixed-budget branch, 2 on
curvature, 1 on one conformal mode and 0 on a Λ-like constant. The same instrument that
confirms the ladder would expose it.

**A silent truncation, found by drawing the closure.** The finite-temperature sum used a
fixed ceiling of 512 terms. The summand β³e^{−β/θ} peaks near β = 3θ, so for θ ≳ 130 the
sum stops before the physics does and returns a confident wrong number — 87 % low at
θ = 300. The ceiling now follows θ, and a shortfall is reported instead of hidden.

## The sixth open item, built rather than solved

The report ends with six things it does not do. Five are research: derive φ, fix the
field content, solve the backreaction, go to a dynamic R(t), make the Hopf splitting
measurable. The sixth asks for **a predefined observable test of log-periodicity**, and
that an instrument can supply.

A φ-ladder is not merely a power law. If scales really come in golden steps, then any
scale-indexed observable is modulated with period **ln φ = 0.481211825** in ln r. Fit and
remove the power law, Lomb–Scargle the residual at that one frequency — Lomb–Scargle
rather than an FFT because real scale samples are never evenly spaced in ln r — and take
the significance from a permutation null, so no distributional assumption is smuggled in.

A test is worth nothing until it has been shown to fail correctly. Calibrated before it
was wired to anything:

| case | result |
|---|---|
| signal ε = 0.12 at 2 % noise | recovered 0.1245, q = 4.0007, p = 0.001 |
| pure power law, same noise | amplitude 0.0028, **p = 0.479** |
| modulation at the wrong period ln 2.7 | amplitude 0.0037, **p = 0.943** — not fooled |
| 200 pure series at α = 0.05 | 4 false positives, **2.0 %** |
| detection floor, 140 samples | ε = 0.01 still reaches p = 0.002 |

And the statement the panel carries: the ladder's own ρ_C(R) = ħc/480π²R⁴ is a
**continuous** power law and predicts no modulation whatever. Log-periodicity is the
signature of genuine discreteness — of a world in which only the rungs exist — so a
detection in real data would be evidence for something this model does not itself claim.

## Two more open items, closed

**Item 2 — the field content.** The coefficient 1/240 belongs to *one* conformally
coupled massless real scalar and to nothing else. Each species has its own spectrum on
the round S³ and its own statistics, and each coefficient is continued from that
spectrum by Hurwitz zeta, ζ_H(−n, a) = −B_{n+1}(a)/(n+1) — not copied from a table:

| species | spectrum | Σ | E |
|---|---|---|---|
| conformal scalar | ω_β = βc/R, g = β² | ζ(−3) = 1/120 | ħc/240R |
| photon | ω_n = (n+1)c/R, g = 2n(n+2) | 2ζ(−3) − 2ζ(−1) = 11/60 | 11ħc/120R |
| massless Dirac | \|ω_n\| = (n+3/2)c/R, g = 2(n+1)(n+2) | 2ζ_H(−3,3/2) − ½ζ_H(−1,3/2) = **−17/480** | +17ħc/960R |

The Dirac sum is **negative** and the fermionic sign turns it positive again; getting
that backwards flips the sign of the whole vacuum. All three are confirmed a second way
in the same script, by brute summation with an exponential regulator and no zeta
function anywhere — the divergent 1/ε⁴ and 1/ε² pieces fitted away and the finite
remainder compared, agreeing to 2e-3.

**Item 3 — the backreaction, solved.** For the Einstein static universe with k = +1
sourced by this vacuum, whose conformal spectrum forces p = ε/3, the two static
conditions close in closed form:

    R* = ℓ_P √(8A/3π)          Λ* = 9π/(16A) · ℓ_P⁻²        (E_total = A ħc/R)

verified by substituting the answer back into *both* equations rather than by repeating
the algebra — residual 6.7e-16. And the answer indicts the model, which is what an
honest answer is for:

| field content | A | R* |
|---|---|---|
| 1 conformal scalar | 0.004167 | **0.0595 ℓ_P** |
| 1 photon | 0.091667 | 0.2789 ℓ_P |
| 1 Dirac | 0.017708 | 0.1226 ℓ_P |
| 4 scalars + 1 photon + 3 Dirac | 0.161458 | 0.3702 ℓ_P |

The model's only self-consistent static solution sits **seventeen times below the
Planck length** — where the semiclassical approximation the whole construction rests on
stops being usable. It reaches ℓ_P only at A = 3π/8 ≈ 1.178, about **283** conformal
scalar fields or 13 photon fields. And the same solution demands Λ* = 1.624e+72 m⁻²,
**1.5 × 10¹²⁴** times the observed 1.106e-52 m⁻². The model does not explain the
cosmological-constant problem; it reproduces it with a definite number, which is more
useful than a gesture.

## One column that is not what it looks like

`t_coh_s` is **πR/c**, not 2πR/c. On S³ the farthest point from any point is its
antipode, and the antipode is π radii away, not 2π. The column is the antipodal causal
crossing time, and it is correct.

## Work Package A — the Berger–Euler torus

A left-invariant **biaxial** metric on SU(2) ≅ S³ *is* the free symmetric Euler top, with
I₁ = I₂ = 1 and I₃ = λ². The exact frequencies are

    ν₁ = |M| = √(Ω⊥² + λ⁴Ω₃²)     ν₂ = (1 − λ²)Ω₃     ρ = ν₂/ν₁   (signed)

and the attitude closes in the group, R(t) = exp(t ν₁[M̂]ₓ) R₀ exp(t ν₂[e₃]ₓ), which
reproduces a straight RK4 integration of Euler's equations to **0.00 rad** in geodesic
distance on SO(3) after t = 3.7, with dE = 7.4e-14, dM² = 7.4e-14 and d\|M_space\| = 2.2e-11.
Both frequencies are *measured off the trajectory* and match the closed forms.

**REFUTED — ρ = 1 − λ².** It drops the |M| normalisation entirely and is correct only on
the measure-zero shell |M| = 1. Counterexample: λ = 0.6, Ω = (0.7, −0.3, 1.1) gives
ρ = 0.820149709 while the old formula gives 0.640000000, with |M| = 0.858380 ≠ 1. After
rescaling to |M| = 1 the two agree exactly, which is the special case it assumed.

**CONDITIONAL — the golden torus.** On the 2E = 1 shell the largest attainable |ρ| is
|1−λ²|/λ², so ρ = 1/φ is *reachable* exactly when λ ≤ φ^{−1/2} = 0.786151 or λ ≥ φ. That
is an **inequality, not an equation**: it does not select λ, and no golden value of the
Berger parameter follows from it.

## Origin of φ — four structures, kept apart

| | statement | status |
|---|---|---|
| A | the golden-mean constraint admits C_L = F_{L+2} words, so h_top = ln φ | THEOREM |
| B | uniqueness of the representation forces a_n = F_{n+2} | THEOREM |
| C | radii add only at Δ = 1; the ratio tends to φ^{1/Δ} | THEOREM |
| D | a full Zeckendorf code gives no geometric ladder at all | THEOREM |
| — | the physical origin of φ | **OPEN** |

A is the growth rate of a **state count** — an entropy is not a length scale. B is
arithmetic about weights. C is the decisive one: with Q_n = (R_n/ℓ)^Δ = F_{n+2} the
recursion lives on the **charge**, holds for every Δ, and the *radii* add only at Δ = 1 —
so a golden ladder of radii is a claim about Δ that none of this supplies. D shows the
full code has thresholds of ratio (Q+1)/Q → 1, arithmetic and not geometric; only a
**sparse primitive** spectrum q_n = F_{n+2} is golden, and no physical operator with that
spectrum is derived anywhere. The generalised Cassini identity is checked in exact
integer arithmetic to n = 60 — it is an invariant of the charges, which is exactly why Δ
never appears in it.

**Three different tests, three different frequencies.** The Binet transient sits at
ω_Z = πΔ/lnφ = 6.5285028 and its amplitude dies as φ^{−2n} — 6.6e-5 by the tenth rung —
so it is a first-rungs test with no cosmological power. True discrete scale invariance at
ratio φ sits at ω_DSI = 2π/lnφ = 13.0570056, **exactly twice as fast**. A test tuned to one
has no power against the other, and the atlas presents them as separate hypotheses.

## Work Package C1 — the Floquet gap, and whose gap it is

A **technical benchmark**, not a cosmological model. Driving a biaxial anisotropy
a₁,a₂ = ā(1 ± ε cos ωt) puts ⅛(A₁−A₂)(K₊² + K₋²) into the Hamiltonian, and that term
moves K by **±2 only**. In the J = 2 block the selection rule splits the space into an
even-K sector {|0⟩, |S₂⟩, |A₂⟩} and an odd-K sector the drive never mixes with |0⟩. Since
(K₊²+K₋²)|0⟩ ∝ |2⟩ + |−2⟩ = √2|S₂⟩, which is orthogonal to |A₂⟩:

    <A₂|H|0> = 0   identically — not merely numerically

and |A₂⟩ survives as an **exact Floquet eigenvector**, overlap 1.000000000000. The gap
therefore belongs to the **bright parity sector** span{|0⟩, |S₂⟩}; calling it a gap of
the whole J = 2 block would be false.

| acceptance criterion | required | measured |
|---|---|---|
| unitarity ‖U†U − I‖_F | < 1e-10 | **2.4e-14** |
| dark-state coupling \|⟨A₂\|H\|0⟩\| | < 1e-12 | **0 exactly** |
| resonant gap law Δε = 2√3 ε | — | to **0.30 %** over ε ∈ [0.005, 0.04] |
| detuning hyperbola √((ΔE−ω)² + Δε_min²) | — | to **0.72 %** over 41 points, ω ∈ [5.5, 6.5] |
| minimum of the hyperbola | at ω = ΔE = 6 | **ω = 6.0000**, gap 0.06933373 |
| the minimum equals the resonant gap | — | 0.06933373 vs 2√3ε = 0.06928203 |

Branches are tracked by **eigenvector overlap with the bright sector**, not by sorting
quasi-energies, and the gap is taken modulo ω into the fundamental zone, so a crossing
of the zone boundary at ε = ±ω/2 cannot masquerade as a closing gap.

## Work Package D — the Bianchi IX action

With dσ_i = ½ε_ijk σ_j∧σ_k, ∫σ₁∧σ₂∧σ₃ = 16π², a_i = e^{α+β_i} and C = π/G:

    V_G  = ½[e^{4β₁}+e^{4β₂}+e^{4β₃} − 2e^{−2β₁}−2e^{−2β₂}−2e^{−2β₃}]
    H_IX = N[(−p_α²+p₊²+p₋²)/(24Ce^{3α}) + Ce^αV_G + 2CΛe^{3α}] = 0

**The decisive check fixes every coefficient at once.** Setting β = p_β = 0 collapses the
constraint to α̇² = Λ/3 − ¼e^{−2α}, which *is* the closed-FLRW Friedmann equation
H² = Λ/3 − 1/R² with the physical radius **R = 2e^α**. That radius is not a choice: the σ
normalisation makes the unit round S³ metric ¼Σσ_i², and the stated volume 16π² gives
16π²e^{3α} = 2π²(2e^α)³ — two independent routes to the same R. C = π/G is then just
(1/16πG)·16π². Neither the 6, the 24, the e^{3α}, the e^α nor the −3/2 can be wrong
without breaking that agreement.

| check | residual |
|---|---|
| the two stated forms of V_G agree (61×61 grid) | 1.1e-13 |
| V_G(0,0) = −3/2 | exact |
| C₃ᵥ wall symmetry of the (β₊,β₋) plane | 8.0e-14 |
| H is the Legendre transform of L | 4.5e-16 |
| the isotropic limit reproduces Friedmann | 5.9e-15 |
| the volume computed two ways | 1.0e-15 |
| constraint drift over 6000 RK4 steps, four classes | 1.2e-12 |

Initial data are **constructed** rather than declared: solving the constraint for p_α
needs p_α² ≥ 0, and with Λ ≤ 0 the potential term near isotropy is large and negative, so
a small anisotropic momentum simply cannot lie on the constraint surface. That is physics,
not a bug — the generator scales (p₊, p₋) until the data are admissible and reports the
factor, instead of declaring a whole class infeasible.

**What this does not establish.** A *fixed* triaxial left-invariant metric is still an
integrable Euler top, so triaxiality alone proves nothing about chaos. Non-integrability
has to come from dynamical a_i(t), inhomogeneity, an external field or matter coupling.
Trajectory classification is C2 and remains **OPEN**.

## One momentum map, four laboratories

The atlas ran four laboratories on what it treated as four objects — the Hopf fibration,
the contact form on S³, the Bloch sphere of a spin-½, and the Euler top of Work Package A.
**They are one object seen four times**: a phase space with a symmetry, its momentum map,
and the space that momentum map fibres over.

| statement | residual |
|---|---|
| J(z) = ½z†σz is a momentum map: ι_Xω = −dJ with **one** constant for every generator, direction and point | spread 5.3e-8 |
| \|J\| = ½ on S³ — the reduced space is S²(½), and the factor is not a droppable convention | 3.3e-16 |
| the fibres of J **are** the U(1) Hopf orbits | 2.4e-16 |
| λ₀(X_Hopf) = ½ everywhere, so R = 2X_Hopf and λ₀(R) = 1 — the contact form is the **connection form** of the Hopf bundle | 4.4e-16 |
| dλ₀ is the **pullback** of the reduced area form, universal multiple measured as ¼ | spread 5.5e-9 |
| the reduced orbit has symplectic area 2π → Chern number 1 → dimension 2: a **spin ½** | exact |
| Poinsot: WP A's ν₂ is the **reduced** frequency and ν₁ the **reconstruction** phase | exact at 64 instants |

The Reeb flow and the Hopf flow are one flow at two speeds. The Bloch sphere and the Hopf
base are the same sphere because a symplectic area of 2π quantises to a two-dimensional
Hilbert space. WP A's two frequencies are reduction and reconstruction rather than two
unrelated numbers.

**A note on method.** For the momentum-map constant I expected ½ and the measurement
returned exactly **−1**, with a spread of 5e-8 over 1799 samples. What a momentum map
requires is that there be *one* constant, and there is; the value −1 is the convention
ι_Xω = −dJ and the ½ I was expecting already sits inside the generator normalisation.
The measurement corrected the expectation, which is the only direction that correction
is allowed to run.

**No new law is claimed.** This is Marsden–Weinstein reduction, the Poinsot construction
and Kostant–Souriau quantisation, assembled and checked. What is new is that the atlas
can now say these are one construction, and say it with residuals.

## The Hopf splitting, and the Smith chart as a rotation

**The splitting becomes an observable.** On the round S³ the Hopf charge sectors are
degenerate, so the decomposition is representation theory and nothing an instrument could
see. A Berger deformation stretches the fibre alone and lifts it:

    ω²_{j,m} − ω²_{j,m′} = (4c²/R²)(λ_H⁻² − 1)(m² − m′²)

zero on the round sphere, and changing **sign** according to whether the fibre is squeezed
or stretched — so the reading says not only that the degeneracy lifted but which way the
deformation went. The check that makes it worth anything is the unsplit case: at λ_H = 1
the formula collapses onto k(k+2)/R² with degeneracy (k+1)², to 2.1e-16. And the honest
limit is stated with it: the splitting vanishes *continuously* as λ_H → 1, so a
measurement resolves the deformation only down to its own linewidth.

**The Smith chart is a rigid rotation of the Riemann sphere.** Γ = (z−1)/(z+1) normalised
to determinant one has the matrix (1/√2)[[1,−1],[1,1]], which is **unitary** — an element
of SU(2), hence a rotation and not merely a conformal map. It is exactly
exp(−i(π/2)σ_y/2), ninety degrees about y. Verified: determinant 1.000000000000,
unitarity residual 2.2e-16, agreement with the exponential 1.1e-16, and a single
orthogonal 3×3 carries every test point to its image to 3.7e-16.

So unrolling the marking plane *from inside the sphere* is not a metaphor: it is that
rotation followed by stereographic projection, and the impedance plane, the reflection
disk and the sphere are **three charts of one object**. The unrolled grid is drawn from
closed forms rather than sampled —

| grid line | image | residual |
|---|---|---|
| r = const | circle, centre r/(1+r), radius 1/(1+r) | 3.3e-16 |
| x = const | circle, centre (1, 1/x), radius 1/\|x\| | 8.9e-16 |
| any two directions | angle preserved (conformality) | 6.3e-9 rad |

The mode is toggleable from the chart's own control row, and it adds nothing to the scene
when it is off: 56 draw calls off, 93 on, 56 off again.

## Status

The derivation is a rigorous superstructure over a **declared model**: a round S³, a
conformally coupled massless real scalar, one renormalization scheme, and the structural
ansatz R_N = ℓ_P φ^N. It is not an observational discovery. The renormalized remainder
ħc/(240R) is not the cosmological constant, φ is not derived by anything here, and the
formal coincidence 2Gε₀/(c⁴R) = 1 at R = ℓ_P is an algebraic identity and not a quantum
black hole. The atlas states all of this on the panel that displays the numbers.
