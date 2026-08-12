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
| `verify-capacity-flow.cjs` | capacity flow, Bradlow packing, the Schwinger wall, and q₀ to sixteen digits in exact BigInt arithmetic |
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
node docs/verify-capacity-flow.cjs         # 31/31 checks pass
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

## Work Package C2 — the dynamics of Bianchi IX

`docs/verify-bianchi-ix-c2.cjs` — **13/13**, reads none of the atlas.
Data: `docs/data/bianchi-ix-trajectories.csv`, 112 trajectories × 25 columns,
regenerated by `--emit` and compared **byte for byte** by the verifier, so the table
cannot be edited without failing the file.

WP D fixed the action. C2 asks the only question that matters afterwards: what do its
trajectories *do*, and is there a physical forcing that could drive the quantum spectrum?
It is answered by integrating and measuring.

**The move that makes it tractable.** In the N = 1 gauge α̇ = −p_α/(12Ce^{3α}) diverges as
the volume collapses. The lapse is free, so choose N = 12Ce^{3α} — volume time τ, with
dt = 12Ce^{3α}dτ — and the constraint becomes polynomial in the momenta:

    H_τ = ½(−p_α² + p₊² + p₋²) + 12C²e^{4α}V_G + 24C²Λe^{6α}
    α′ = −p_α   β_±′ = p_±   t′ = 12Ce^{3α}
    p_α′ = −(48C²e^{4α}V_G + 144C²Λe^{6α})   p_±′ = −12C²e^{4α}∂V_G/∂β_±

**And the trap in it, which the first version of this file fell into.** N depends on α, so
d/dα(N·H₁) picks up H₁·dN/dα: the two vector fields are proportional exactly *on* the
constraint surface and **not** off it. Since H_IX = 0 is the whole of the physics the orbits
coincide — measured on-shell to 5.3e-14, while the same comparison pushed 30% off the
surface fails by 1.95e+2. Verifying it off-shell would have "refuted" a correct identity.

| what | result |
|---|---|
| exact ∂V_G/∂β_± and the Hessian J^T diag(∂²V/∂β_i²) J vs central differences | 5.4e-8 · 1.7e-7 |
| reparametrisation, on-shell (400 seeds) | 5.3e-14 |
| initial data solved onto H_IX = 0, 400 seeds | 3.8e-15 |
| Dormand–Prince 5(4) convergence, tol 1e-6 → 1e-10 | 1.3e-7 → 1.3e-11 |
| constraint drift along four physically distinct orbits | ≤ 8.0e-12 |
| isotropic subspace invariant; Friedmann α̇² = Λ/3 − ¼e^{−2α} recovered | 0.0 · 4.9e-14 |
| isotropic bounce at e^{2α} = 3/(4Λ), analytic vs measured | 1.0e-3 |
| Lyapunov estimator against a flow with exact λ = 0.37 | 0.370000 |

**The constraint is never projected back.** It is left free to drift and reported, because a
projected constraint hides exactly the error it exists to expose — a trajectory forced back
onto the surface can be wrong in every other coordinate while looking perfect.

### The no-go: there is no equilibrium at all

Stationarity needs p = 0, β = 0 and ṗ_α = 0, which forces e^{2α} = 1/(4Λ). The constraint at
the same point forces e^{2α} = 3/(4Λ). **A factor of three apart, for every Λ > 0** (verified
to 4.4e-16 over Λ ∈ [0.05, 2]). So `stationary` is a class the laboratory can detect and can
never populate. It keeps the class and says why, rather than dropping the category.

### The Mixmaster, counted rather than cited

On the collapsing vacuum branch the anisotropy does not run monotonically into the
singularity — it bounces off the three walls of V_G. Two things had to hold before the count
meant anything: it is **stable** under a 10⁴ tightening of tolerance (3 = 3 = 3 across
1e-9, 1e-11, 1e-13), and it **grows** as the collapse is followed deeper (2, 3, 4, 4 bounces
through ln-volume windows of 4, 7, 10, 13). So it is a physical sequence of Kasner epochs
and not integration noise.

### The answer C2 exists to give

Over the 112 published trajectories — four values of Λ including the vacuum case, both
branches, golden-ratio low-discrepancy sampling of the anisotropic data:

| class | count |
|---|---|
| singular | 68 |
| transient | 43 |
| chaotic | 1 |
| periodic | **0** |
| quasiperiodic | **0** |
| stationary | **0** (provably) |

**There is no periodic forcing available in this sector.** A Floquet operator built on a_i(t)
from here would be illegitimate; the extended-frequency or finite-time propagator route is the
honest one. Non-integrability still does not imply a spectral gap, and nothing here claims it.

**On Lyapunov exponents.** A minisuperspace Lyapunov exponent is parametrisation dependent
(Burd–Buric–Ellis). Only the sign, and only on a **bounded** orbit, is used — the classifier
tests boundedness first. The counterexample is in the file: an exactly isotropic de Sitter
orbit measures λ_τ ≈ 5.6×10³ purely because the universe is inflating, and calling that
chaos is the classic mistake. The CSV therefore leaves `lyapunov_tau_bounded_only` empty for
every orbit that leaves the window.

## Publishing, and the stale header

The atlas has no build step and no asset hashes, so the only thing between a reader and a
months-old copy is whatever their browser decided about `Cache-Control`. That is not
hypothetical: the Pages deployment of v3.36.0 succeeded at 15:00 UTC and a phone was still
being shown v3.29.0 eight hours later.

A service worker would make it **worse** — a cache-first worker pins the stale copy
permanently. The fix is the opposite: `version.json` sits beside the document and the
sentinel asks the **origin** with `cache: 'no-store'`, which bypasses the HTTP cache by
specification. It never reloads by itself, and it distinguishes *stale*, *current*, *ahead*
(this document is newer than what is published — a real signal that a deploy is missing) and
*unreachable*, because reporting "up to date" when the check simply failed would be a lie.
`scripts/validate.mjs` fails the build if `version.json` disagrees with `HCC_VERSION` /
`HCC_BUILD`, so the manifest cannot drift from the document it describes.

## The five invariance laboratories, measured

The report was that these five load video memory and judder. Measurement, not guesswork,
with `FBS3R_QA.renderStats()` and `FBS3R_QA.opticalAudit()` sampled per frame:

**There is no leak.** Geometry, texture and program counts rise on first visit to each lab
and then plateau exactly — across four full cycles of all five labs, nexus sits at 361
geometries and 45 programs from the second visit onward and never moves. What is true is
that every lab's stage stays resident once built, so the *footprint* is permanent even
though the growth is not.

**There is no flicker.** The signature of sort-order or z-fighting flicker is that frame N
matches frame N+2 while differing from N+1. Measured over ten frames per view,
d(N,N+2)/d(N,N+1) = 1.70–1.75 in all five — smooth motion, not alternation — and the same
1.55–1.75 in the `sec`, `hopf` and `ring` controls. On that measurement the five labs are
the *quietest* views in the atlas (mean inter-frame difference 2.6–3.2 against 5.2 for
Section and 19.0 for Hopf).

**One lab was genuinely pathological, and it was not subtle.**

| view | visible objects | transparent | draw calls | triangles | tri/call |
|---|---|---|---|---|---|
| Section (control) | 16 | 13 | 31 | 21094 | 680 |
| **Invariant Nexus (before)** | **274** | **254** | **298** | **10096** | **34** |
| Spinor & Light Cone | 55 | 30 | 75 | 21110 | 281 |
| Contact & Action | 33 | 25 | 52 | 5716 | 110 |
| Holonomy | 39 | 33 | 56 | 16246 | 290 |
| Symmetry Discovery | 39 | 31 | 58 | 13746 | 237 |

213 of the nexus's 274 objects were node markers: seventy-one laboratories × three separate
rendered meshes each (glow sprite, wireframe cage, octahedron). Thirty-four triangles per
draw call is the whole cost of the view — on a tile-based mobile GPU each blended draw is a
separate tile pass, and the logarithmic depth buffer already forbids early-Z.

The obvious instancing fix has a real obstacle: `MeshStandardMaterial` carries opacity and
emissiveIntensity as *material* uniforms, and the nexus varies both per node. Folding
opacity into the instance colour would have been a silent approximation. It is not needed —
`nexusApplyStyles` uses exactly **four** distinct (opacity, emissiveIntensity) pairs, so
four instanced buckets reproduce the previous appearance exactly, with colour still per
instance.

| after | objects | transparent | draw calls | triangles |
|---|---|---|---|---|
| Invariant Nexus, desktop | 144 | 124 | **93** | 9954 |
| Invariant Nexus, iPhone 13 profile | 136 | 116 | **87** | 9314 |

213 rendered node objects → 12. A self-test guards the budget, because the defect was
invisible to source search: the meshes were built in a loop, so the cost scaled with the
laboratory count and nobody reading the loop would have seen 213 objects.

**The other four were not rewritten, and the reason is that they measure sound.** Their
scientific content is not decorative:

| lab | what it closes | residual |
|---|---|---|
| Spinor & Light Cone | k^μ = ψ†σ^μψ is null; det(2ψψ†) = 0; U(1) phase leaves k fixed | 2.1e-17 · 0 · 1.1e-16 |
| Contact & Action | λ₀(R) = 1, ι_Rdλ₀ = 0 on ker λ₀, Hopf image constant, period = action = π | 5.4e-16, linking 1.0000327 |
| Holonomy | Gauss–Bonnet: transport angle = curvature flux, 1024-edge polygon | 7.7e-7 |
| Symmetry Discovery | null-space discovery told **no labels** recovers invariant dimension 3 | 1.1e-15, gap 0.176 |

Rewriting those would have been churn justified by a symptom the measurements do not
support. What was wrong was one view's draw-call budget, and that is what was fixed.

**One hypothesis is left open rather than acted on.** `logarithmicDepthBuffer: true` is a
renderer-construction flag, so it cannot be toggled per view, and on Apple GPUs it forces a
per-fragment depth write that disables the hidden-surface removal the architecture depends
on. That would cost most exactly where overdraw is highest — these five labs. It is a
plausible explanation for a device symptom none of the desktop or emulated-mobile
measurements reproduce, but it is not measured here, and the atlas spans Planck lengths to
gigalight-years, so the flag is presumably load-bearing. Changing it on a hunch would be the
kind of unverified edit this file exists to prevent.

## The Smith–Möbius unrolling, as one rotation

`docs/verify-smith-mobius-unrolling.cjs` — **14/14**, reads none of the atlas.

The Smith chart and the impedance plane are not two pictures that morph. They are two
stereographic views of ONE grid on the Riemann sphere, and the whole animation is a
single rigid rotation of that sphere:

    M(θ) = [[cos(θ/2), −sin(θ/2)], [sin(θ/2), cos(θ/2)]]
    w_θ(z) = (cos(θ/2)z − sin(θ/2)) / (sin(θ/2)z + cos(θ/2))
    θ = 0 → w = z  ·  θ = π/2 → w = (z−1)/(z+1) = Γ

| check | residual |
|---|---|
| det M(θ) = 1, 401 angles | 2.2e-16 |
| M†M = I, 401 angles | 2.2e-16 |
| **Möbius route = sphere route**, 1589 pairs, chordal metric on CP¹ | 1.1e-13 |
| z = 0, 1, ∞ → Γ = −1, 0, +1 | 2.2e-16 |
| round trip z → Γ → z | 3.6e-15 |
| passive r ≥ 0 ⇔ \|Γ\| ≤ 1, 227 points, 0 misclassified | boundary 4.4e-16 |
| r = const → centre r/(1+r), radius 1/(1+r), from H → (M⁻¹)†HM⁻¹ | 6.3e-15 |
| x = const → centre (1, 1/x), radius 1/\|x\| | 6.7e-15 |
| cross-ratio invariance, 420 quadruples | 2.2e-15 |
| angle preservation (the Angle witness) | 0.0 rad |
| generalized circles stay generalized circles | 2.6e-16 |
| no NaN at the projection pole, 50 approaches from both sides | 0 NaN, 0 off-sphere |
| θ(t) = (π/4)[1+cos(2πt/T)]: ends, zero velocity, time symmetry | 6.7e-16 |
| loop closure measured **on the grid**, and half-cycle mirror symmetry | 0.0 · 1.8e-15 |

### Two things the first attempt got wrong

**The metric.** Comparing the two routes as \|w_A − w_B\| in the plane made the residual
blow up near the projection pole — at θ = π/2 and z = −1 + 1e-4i the routes agree
perfectly and \|w\| is 2×10⁴, so a "1e-9 disagreement" was cancellation in the readout,
not error in the map. The correct measure on CP¹ is the chordal distance, which is
uniformly valid and lets the pole be included rather than stepped around.

**The wording.** The interface says, in those words, that the grid does **not** stretch on
the sphere: it rotates rigidly in S² and only appears to deform after projection. Angles,
generalized circles, cross-ratios and incidence are preserved; euclidean distances, areas
and circle sizes on the plane are not. This is not an isometric unrolling of a sphere onto
a plane — no such map exists — and nothing claims one.

### How it is drawn, and why that costs nothing

Every vertex carries its own (r, x) **and its partner's**, and the lift–rotate–project runs
in the vertex shader from a single θ uniform. Buffers are built once; θ costs one uniform
write per frame; no geometry is ever rebuilt or reallocated. Carrying the partner is what
makes infinity behave: a segment whose either endpoint crosses the projection pole
collapses to zero length and is discarded, so the curve is **cut** at the pole and resumes
on the other side instead of flashing across the screen. Infinity is the CP¹ point [1:0],
never 1e6.

The curves are sampled for drawing — which the specification allows — but the geometry is
analytic. In the exact orthographic view each grid line is stroked as a **true SVG circle**
whose centre and radius come from the transformed Hermitian form in closed form.

**The exact view is an orthographic projection by construction.** The requirement was a
view strictly perpendicular to the output plane with no perspective, no camera motion and
no auto-zoom. Pointing the atlas's perspective camera downwards leaves a residual
projective distortion, which is exactly what the requirement forbids; drawing the output
plane in its own parallel projection has none, costs zero draw calls, and keeps the 3D
budget free for the explanatory view.

| measurement | desktop | iPhone portrait | iPhone landscape |
|---|---|---|---|
| draw calls, unrolling **off** | 56 | 39 | 56 |
| draw calls, unrolling **on** | **92** | **73** | **92** |
| triangles, on | 15620 | 15004 | 15620 |
| page errors | 0 | 0 | 0 |

Off is unchanged from before this work, and on sits inside the stated 93–100 budget. Live
residuals in the invariant monitor at an arbitrary θ: det 0, unitarity 0, sphere 2.2e-16,
**route agreement 5.6e-16**, cross-ratio 5.9e-17, angle witness 0.

Touch targets inside the panel were 30 px tall and now clear 44×44 under
`(pointer:coarse)` — the track keeps its drawn thickness while the hit area grows. Six
buttons still measure 30–40 px wide: they are the shared panel chrome (collapse, pin,
close), not controls this laboratory added, and widening them would move every panel.

## One grid, held still, and carried onto the whole sky

Four corrections to the Smith–Möbius laboratory and the hierarchy locator.

**There were two grids on the chart.** The base Smith chart is added to the scene at
setup and was always visible, so switching the unrolling on drew the *same figure on top
of itself* — the unrolling at θ = π/2 **is** the base chart. That is not twice the
information, it is a moiré of a figure with itself. The base chart is now captured
explicitly at construction so it can be retired the moment the unrolling takes over and
restored when it stops. Draw calls fall 92 → 88 as a side effect.

**It now rests instead of running.** The default is `impEase: 'man'`, `impPlay: false`,
`u = 1` — exactly θ = π/2, the Smith chart, motionless. The animation is an option that
has to be asked for. Two explicit holds were added, *hold at the Smith chart* and *hold
at the impedance plane*, and the play button now hands the laboratory a timing law as
well as setting a flag: without that, pressing play on a manually-held state toggled a
boolean the manual easing ignores — a control that did nothing.

**The grid extends over all of space, and that is a similarity.** A point of the Riemann
sphere *is* a direction, and the celestial sphere *is* the set of directions, so carrying
the grid out to the sky is the radial dilation v ↦ Rv. It multiplies every tangent vector
by the same factor, so angles are unchanged **exactly** (measured: cosine drift 0.0 over
64 directions) and circles stay circles; every direction is covered with no seam and no
pole. It reuses the identical buffers and the identical rotation — one uniform differs.
The grid is not tiled onto the sky: at that radius it *is* the sky.

**The locator became the camera control.** It used to orbit its own camera, so it showed
a fixed three-quarter view no matter where the scene was looking, and dragging it moved
nothing — a picture of an orientation, not an orientation control. It is now slaved both
ways: every frame it copies the main camera's direction, making it a true attitude
indicator, and dragging it rotates the **main** camera about the orbit target. Its axis
buttons and its wheel move the scene too. That is a permanent handle on the view in every
one of the 72 laboratories, including the ones whose own controls are busy. The rotation
is applied in the camera's own spherical frame about `controls.target` — what
OrbitControls itself does — so the two never fight and no state is mirrored.

### Two self-tests that were wrong before the code was

Both new checks failed at first, and neither failure was in the feature.

The sky check demanded the live meshes, but the laboratory is built on first entry, so at
boot there was nothing to inspect — the test asserted a precondition it had not
established. It now checks the **arithmetic** unconditionally (a uniform dilation leaves
every angle cosine exactly invariant and keeps the image on the sphere of radius R) and
the wiring only when it exists, saying in the detail which case it saw.

The locator check compared the locator's direction with the scene's, but at the moment
the self-tests run the camera can still be sitting on its orbit target — the offset vector
is zero, there is no direction, and the normalised dot product is 0. That read as a broken
synchronisation when it was a broken test. It now sets three known camera placements,
measures, and restores: worst 1 − (locator)·(scene) = 0.0 over all three.

| measurement | before | after |
|---|---|---|
| draw calls, unrolling on (desktop) | 92 | **88** |
| draw calls, sky grid on | — | 94 |
| resting θ | animated | **exactly π/2** |
| self-tests | 564 | **567** |

## The Capacity Selector laboratory (v3.50.0)

The capacity closure gave the atlas a number: Λ★ = 3π/(ℓ_P²q★) with q★ = 3.30725e122,
0.90 σ from the Planck 2018 late-time value. A number on a page is not a laboratory, so
this release turns it into one.

### The selector is drawn exactly, on the window the function chooses

q is 10¹²², so Γ(q) = q[ln(q/q★) − 1] − log Z_edge(q) cannot be plotted. In δ = u − u★ it
normalises to a single elementary curve,

    [Γ(u) − Γ(u★)] / q★  =  e^δ(δ − 1) + 1

exact up to ν e^{−u★} ≈ 10⁻¹²³. That is not a sketch of the selector; it is the selector,
in units of the sector it selects.

The first draft plotted it on δ ∈ [−3.2, 3.2] and the picture was useless: Γ reaches 54.9
by δ = 3.2 and only 0.83 by δ = −3.2, so the left branch drew as a flat line and the "one
minimum" written underneath was invisible. The function hands over the right window
itself — **Γ → 1 as δ → −∞ and Γ(1) = 1 exactly** — so on δ ∈ (−∞, 1] the whole valley
lives inside [0, 1], bounded above by its own asymptote. The minimum is now the shape of
the picture rather than a claim written under it, and the far field is stated numerically
instead of being drawn badly.

### What the laboratory adds to the manuscript: the error budget

The paper passes three gates and presents them side by side, as three conditions that must
all hold. That is true, and it is also the wrong picture of where the prediction comes
from, because the three do not constrain the answer to remotely the same precision. Each
gate implies a value of u on its own; each implied u implies a Λ; each Λ sits some number
of observational σ from the measured sky. That table is the error budget, and it is the one
thing a reader cannot get from the paper.

| gate | supplies | u − u★ | σ from the sky | its own width | role |
|---|---|---|---|---|---|
| A · Hopf–Bradlow–APS–HC | N_φ = 292 | +0.060937 | **−4.83** | ±31.3 σ | locator |
| B · GLSM / stringy | b g² , Ξ | −6.2×10⁻¹⁰ | **−0.90** | ±8×10⁻⁶ σ | predictor |
| C · determinant line | ν = ½ | +1.5×10⁻¹²³ | −0.90 | 0 | structural |

Read down the σ column. The scheme gate fixes u to nine decimals and lands Λ at −0.90 σ —
**that is the prediction.** The recursion gate only says the sector sits on rung 292, and
rungs are 2 ln φ = 0.962 apart, which is 41 σ wide: it confirms, it cannot sharpen. The
determinant line moves u by ν/q★ ≈ 10⁻¹²³ — structurally essential, numerically invisible.
A reader who took "three gates" to mean "three independent determinations of Λ" would badly
overstate the redundancy. There is one sharp determination and two consistency conditions.

Gate A's displacement is not a residue. I first published +0.060937 as "a real displacement
rather than a round-off", which was true and useless — it is exactly

    u − u★ = ln(1 + π/50) = 0.06093700...

to 3.5×10⁻¹⁶, because the selector's fixed point carries the same denominator:
q₀ = πφ⁵⁸⁴/(1 + π/50). Rung 292 is where the ladder puts the sector; the gap to the
scheme-fixed u★ is the logarithm of the gate factor and nothing else. Checks 7 and 8 of the
verifier assert this identity and refuse the earlier wording.

Nothing here contradicts the manuscript; it quantifies a distinction the manuscript leaves
implicit. Verified independently in `docs/verify-capacity-gate-budget.cjs` (9/9), including
the approximation the file refuses: the linearisation |dΛ/Λ| = |du| would report the rung
window as ±32.4 σ where the exact span is ±31.3, wrong by 4% because Λ ∝ e^{−u} is convex.
It changes no conclusion and it is still not used, because an error budget assembled from
approximations is an estimate wearing the clothes of a measurement.

Gate C's displacement cannot be recovered by subtraction: u★ + ν/q★ *is* u★ at double
precision (282 carries ~10⁻¹⁴ of resolution and the shift is 10⁻¹²³), so printing the
difference would show 0 and hide the very thing the row is about. It is stated directly.

### Laboratories as instruments: reports and an API an agent can drive

A laboratory that only draws is a picture. One that accepts a declared input, computes, and
hands back a result with its own provenance and its own stated limits is an instrument.
This release adds the generic machinery — a laboratory registers one spec and gets a
report, a download, a clipboard copy and a public entry point at once — with the Capacity
Selector as its first citizen.

The whole atlas is one static file on Pages, so an agent that can open the page can already
run every computation in it:

```js
HCC_API.list();                            // the catalogue
HCC_API.describe('capacity');              // inputs, units, declared domain, limits, verifiers
HCC_API.evaluate('capacity', {u: 282.11}); // the numbers
HCC_API.markdown('capacity');              // the same, as a readable report
```

Two rules are enforced rather than documented. **Nothing returns a number without its
provenance** — every object carries the schema, the atlas version and build, and a status
naming what is derived, what is verified and by which file. And **an input outside its
declared domain is refused, never clamped**, because a silently clamped input returns a
real number for a question that was never asked: `HCC_API.evaluate('capacity',{u:1})`
raises a RangeError naming the domain instead of quietly answering about u★ − 40.

### A dead level of the hierarchy, found only by hit-testing it

Adding the sixth Inspector tab meant pressing it, and it could not be pressed. Measured:
`#hccInspector` at `right:14px` / z-index 38 and `#panelDock` at `right:14px` / z-index 110
shared the same band exactly. A hit test at the centre of **all six** tabs returned a dock
button, at 1024, 1280, 1440 and 1680 px. The entire fourth level of Atlas → World →
Laboratory → Inspector was dead on every desktop width — while every logic test passed,
because logic tests ask which tabs render and never ask whether a finger can reach one.

The strip now continues the breadcrumb instead of fighting the dock, which is also what it
means: `Atlas › World › Laboratory › ⚙ ◎ ∮ ⌘ ◱ ⬇` reads as one line because it is one line.

That exposed the real constraint. Measured at three widths: breadcrumb 193, Inspector 521
with labels and 183 without, context rail 584, dock 494 + 14 — **1802 px of content for a
row that is at most 1440 wide.** The row does not fit at any width below about 1810, and
pretending it does is what put the strip under the dock in the first place. So it is
budgeted by what each element *is*: the breadcrumb is identity and never yields; the
Inspector is navigation you press and keeps its labels until it would otherwise reach the
dock; the context rail is a passive readout with `pointer-events:none` whose first three
cells are repeated verbatim in the bottom readout, so it yields first and in that order —
the long space cell, then everything but the frame timer, which appears nowhere else.

The first version of the budget was non-monotone: tying the Inspector's compaction to the
rail's needs made the labels come back as the window got *smaller*. The Inspector's fit now
depends on the Inspector alone.

The self-test for this was also wrong before the code was. It asserted `right === 'auto'` —
a proxy, and a false one, because `getComputedStyle` returns the *used* value and a
left-anchored fixed box reports `right` as a pixel number. It now hit-tests every tab
centre with `elementFromPoint` and checks the two rectangles are disjoint, which is the
invariant. `verify-navigation-architecture.cjs` had the same disease from the other side:
it pinned the tab count at five and failed the moment a sixth tab was earned — a test
measuring its own history. It now checks distinctness, the existence-and-scope gate, and
that reachability is measured at runtime.

And then it happened again. One commit later the version bump made the freshness sentinel
appear — it shows only when the served build disagrees with the declared source — and
`#freshBar` was written as `left:50%; transform:translateX(-50%)` in the same row, at
z-index 80. It swallowed three tabs at 1440, four at 1280. Found by hit-testing, not by
looking, and it is why the self-test no longer names the dock: it enumerates every tenant
of the band (`#panelDock`, `#contextRail`, `#freshBar`, `#hccCrumb`) and asserts the strip
is disjoint from all of them. Naming the last offender is a changelog; enumerating the row
is the invariant.

The sentinel is an alert, so it outranks the rest while it is up: the rail hides, the
Inspector drops to icons, and the alert takes the freed band on the same measured terms.

| measurement | before | after |
|---|---|---|
| Inspector tabs reachable on desktop | **0 / 6** | **6 / 6** at 1024–1680 px |
| Inspector tabs reachable with the sentinel up | 0–3 / 6 | **6 / 6** |
| Inspector ↔ dock rectangles | fully overlapping | disjoint |
| scene visible with the panel open (iPhone portrait) | — | 70 % |
| scene visible (iPhone landscape) | — | 76 % |
| tap targets under 44 px | 0 | 0 |
| independent verifiers | 15 | **16** |
| self-tests | 574 | **585** |

On the phone the panel leads with the answer — Λ, the Planck comparison, the σ — then the
control, then the explanation, then the evidence. The prose used to lead, and on a 390 px
screen the result was below the fold in its own laboratory.

## Four instruments, and a class that could never be returned (v3.51.0)

The Capacity Selector proved the shape of the instrument layer. The three laboratories
that already had a pure computation and a verifier behind it — the zero-point ladder,
Bianchi IX and Smith–Möbius — are now registered the same way, so `HCC_API.list()`
returns four and an agent with nothing but the published link can drive all of them.

Registering them found three defects in the atlas, and two of them were in specs I had
just written.

**`smithInvariants` returns `|det M − 1|`, not `det M`.** Labelling that field
`determinant` would have printed 0 where the answer is 1. It is now
`determinant_residual`, with the unit written out.

**The Bianchi spec declared a `lyapunov` output that would always have been null.** The
atlas computed no Lyapunov exponent at runtime — the estimator lived only in the offline
verifier. A declared output that is structurally null is worse than an absent one.

**And the reason that mattered: `BIX_CLASSES` declares six trajectory classes and
`bixClassify` could produce five.** "Chaotic" means *bounded with sensitive dependence*,
and sensitive dependence is not something a return-map recurrence test can see. The class
was unreachable — a label, not a measurement.

So it is now measured. The 6-D flow is integrated together with a tangent vector driven
by the **exact Jacobian**, not by a finite difference of two nearby trajectories, which
loses the separation to round-off long before it grows. Two things keep the number honest:

- **λ is withheld from any run that is not bounded.** On a de Sitter escape the tangent
  grows because the *background* is inflating: two perfectly regular escapes measured
  λ = 16 and λ = 39. The first version of this returned that number beside the words
  "not measured", which is the exact contradiction the measurement exists to avoid.
- **The discriminator is not a threshold on λ but the doubling ratio ρ = λ(2T)/λ(T).**
  A regular orbit's finite-time estimate decays like ln τ/τ, so ρ sits near 0.5; a chaotic
  one plateaus and ρ → 1.

| bounded seed | λ(2T) | ρ |
|---|---|---|
| mild, Λ = 0.08 | 1.6710 | **0.551** |
| panel default | 1.7266 | **0.578** |
| vacuum wall bounce | 1.5990 | **0.571** |
| near-isotropic | 1.0688 | **0.544** |

A tight cluster just above the pure-1/τ value of 0.5, nowhere near a plateau. The cut sits
at 0.85 — far above everything observed, far below the chaotic limit. **So `chaotic` is
now reachable and has not been reached.** That is a statement about a finite volume-time
window, not about Bianchi IX: Mixmaster chaos is asymptotic to the singularity as α → −∞,
and a finite window is the wrong instrument for it. The atlas says which of the two it is
measuring.

### The calibration that was measuring the wrong system

The first calibration of that cut was run in a scratch harness with `C = 1/12`. The atlas
and the C2 verifier both use **C = π** (`C = π/G` in G = 1 units, from the volume factor),
so the harness was integrating a different system entirely and the ratios it produced —
0.538 through 0.659 — described nothing in this repository. It was caught because the
atlas and the harness disagreed about whether one orbit collapsed, and the disagreement
was chased instead of averaged. With C = π the dynamics is fast: most seeds collapse or
escape inside τ ≈ 5, and the asymptotic null hypothesis 0.5 + ln2/(2 ln T) evaluates to
exactly 1 at T = 2, where it would read "regular means chaotic". It is now reported only
for T ≥ 4, where it means something.

### What an agent gets through the link

```js
HCC_API.list()                          // ladder, bianchi, smith, capacity
HCC_API.describe('bianchi')             // 8 inputs, 11 outputs, 5 limits, 3 verifiers
HCC_API.evaluate('bianchi', {tauMax: 2})
HCC_API.markdown('ladder')              // 9 KB report, units and limits included
```

String inputs are validated against the alternatives they declare, so
`{branch: 'sideways'}` is refused by name rather than falling through to a default and
returning a real answer to a question nobody asked.

| measurement | before | after |
|---|---|---|
| laboratories reachable as instruments | 1 | **4** |
| Bianchi trajectory classes reachable | 5 of 6 | **6 of 6** |
| self-tests | 585 | **589** |

## The spectral operator (v3.52.0)

Work package C2 gave the atlas a trajectory of the **geometry** — α(τ), β±(τ), constraint
preserved, each orbit's fate measured. A trajectory of the geometry is not yet a statement
about a **field** on that geometry, and the bridge is one operator:

    H(t) = ½ Σ_i a_i(t)⁻² K_i²,     a_i = e^{α + β_i}

with K_i the left-invariant fields on S³ = SU(2) and β the Misner triple.

### Why it is exactly solvable

On a spin-j irrep the K_i are the su(2) generators, so

    H|_j = ½[ (c₁+c₂)/2 (J² − J_z²) + c₃ J_z² + (c₁−c₂)/4 (J₊² + J₋²) ],   c_i = a_i⁻²

which is the quantum **asymmetric top**: real symmetric, coupling m only to m±2, splitting
into even and odd ladders. Diagonalised by cyclic Jacobi to machine precision. Nothing here
is variational, truncated, or perturbative in the anisotropy — the eigenvalues *are* the
eigenvalues. At α = 0, where c = 1 is exactly representable, the isotropic law
λ = ½c·j(j+1) and the trace identity both hold to **exactly zero**, not to a tolerance.

### Convention versus physics

The overall scale of H depends on how K_i is normalised against the metric, and the
literature differs by factors of two and by powers of the fiducial volume. One convention
is fixed — `Σ K_i² = j(j+1)`, the standard Casimir — and only what is independent of it is
claimed: degeneracy structure, level ratios (exactly j(j+1)/j′(j′+1)), and the trace
identity `Tr H|_j = ½(c₁+c₂+c₃)·j(j+1)(2j+1)/3`, which holds to 5×10⁻¹⁶ across the β plane.
The factor is stated, not smuggled.

### The spectator index

Scalar harmonics on S³ are the Wigner functions D^j_{mm′}, and the left-invariant K_i act
on m alone. Every eigenvalue of the (2j+1)-dimensional block therefore carries a further
(2j+1)-fold multiplicity, giving (2j+1)² per j — exactly the known n² degeneracy of the
round S³ at n = 2j+1. Reporting the block dimension as the physical multiplicity would
understate every degeneracy by a factor of 2j+1.

### Degeneracy lifting is a discrete fingerprint

At j = 2 the isotropic block holds **one** level; the axially symmetric block (β₋ = 0, so
c₁ = c₂) holds **three**, one per |m|; the fully asymmetric block holds all **five**. A
count cannot be right by accident, which makes it a stronger check than any tolerance.

### The implication this refuses to draw

Bianchi IX is classically non-integrable. That is a statement about trajectories in a
six-dimensional phase space. The gap of H is a statement about a Hermitian matrix at one
instant. **Non-integrability does not imply a spectral gap**, and the counterexample is
computed live rather than argued:

| geometry | gap | distinct levels |
|---|---|---|
| isotropic (least chaotic there is) | **1.391** | 4 |
| mildly anisotropic | **0.593** | 8 |
| strongly anisotropic | **1.848** | 11 |

The isotropic geometry has the *larger* gap. And two points at the same anisotropy radius
— identical classical character — give gaps a factor of 1.96 apart. The gap is computed
from the metric at an instant and is never inferred from the dynamics. This is kept as a
running self-test and as check 7 of the verifier so it cannot quietly be assumed later.

And a sharper one, found by running the instrument rather than by arguing. Set β₋ = 0 and
the two transverse axes coincide, c₁ = c₂: that is the **symmetric top**, a textbook
*integrable* system — two conserved angular momentum components, no chaos anywhere in it.
Its gap is **0.0076**, essentially closed. The fully asymmetric top beside it, the
non-integrable one, has a gap of **1.85** — 244× larger. The integrable geometry carries
the nearly closed gap and the non-integrable one carries the wide open gap. That is the
naive implication running exactly backwards, and it is check 8 of the verifier so nobody
has to take it on trust.

**Not claimed:** H(t) is the instantaneous operator. It is not a generator of time
evolution — the metric is time dependent, so this is an adiabatic basis and not a conserved
spectrum. Nothing about level crossings, Berry phases or particle creation follows without
the time-dependent problem being solved.

| measurement | before | after |
|---|---|---|
| laboratories reachable as instruments | 4 | **5** |
| independent verifiers | 16 | **17** (9 checks in the new one) |
| self-tests | 589 | **592** |

## Particle creation, and what expansion does not do (v3.53.0)

The spectral operator ended by declaring what it does not claim: H(t) is instantaneous,
the metric is time dependent, and nothing about particle creation follows without solving
the time-dependent problem. This solves it — and the structure makes the answer a
prediction rather than a fit.

### The factorisation carries the whole argument

α enters H only through an overall factor, so every eigenvalue factorises **exactly**:

    λ_n(α, β) = e^{−2α} · μ_n(β)

verified directly to 4×10⁻¹⁵ across five decades of scale factor, four anisotropies, four
spin blocks and every level inside them. For a **conformally coupled massless** scalar the
rescaling u = a·φ removes exactly one power of e^{−2α}, leaving

    Ω_n²(τ) = e^{2α} λ_n = μ_n(β₊(τ), β₋(τ))

with the scale factor gone **identically**. Ω depends on the anisotropy alone.

### An isotropic universe creates exactly nothing

Not "approximately nothing". Three runs at Λ = 0.5, 1 and 2, each escaping to de Sitter
with α growing by **six e-folds**, all return

    n = 0     |A|² − |B|² − 1 = 0     μ swing = 0

at machine precision, with no seed rescaling. It is structural: β = 0 is a critical point
of the curvature potential — dV(0,0) = (0,0) — so the isotropic locus is invariant, μ is
constant, and the Bogoliubov source Ω′/2Ω vanishes identically.

### Anisotropy is what pays

Holding the expansion fixed and turning β₊ up:

| β₊ | n | μ swing |
|---|---|---|
| 0.00 | **0** exactly | 0 |
| 0.02 | 4.82×10⁻⁵ | 0.027 |
| 0.05 | 2.49×10⁻⁴ | 0.059 |
| 0.10 | 6.99×10⁻⁴ | 0.091 |
| 0.20 | 1.24×10⁻³ | 0.101 |

The control variable is the anisotropy and nothing else — no seed rescaling anywhere in
the scan, so nothing was quietly moved onto the constraint surface.

### The conserved quantity is measured, never imposed

|A|² − |B|² = 1 is the Wronskian of the mode equation. It is never projected back, so its
drift measures the integration honestly — and it tightens from 2.3×10⁻¹² to 9.1×10⁻¹⁵ as
the tolerance tightens while n stabilises to six digits. A scheme that imposed the
constraint would report a perfect Wronskian and hide whatever else was wrong.

Ω′ comes from the chain rule, (dμ/dβ)·β′ with β′ = p_β exact from the Hamiltonian flow,
rather than from differencing Ω along the integrator's own output.

### A monotone law the atlas is not permitted to claim

β₊ = 0.35 creates **less** than β₊ = 0.20 — 1.04×10⁻³ against 1.24×10⁻³ — because the
larger anisotropy drives a faster escape and the mode spends less time being stirred. What
the occupation tracks is the *swing* of μ along the orbit, not the anisotropy it started
with. Kept as a check so the tempting monotone story cannot creep in later.

**Not claimed:** this is not a statement that expansion never creates particles. It is a
statement about a conformally coupled massless field, for which conformal flatness is
exactly the condition for no creation, and an isotropic Bianchi IX is conformally flat. A
massive or minimally coupled field keeps its α dependence in Ω and would be created by
expansion alone. This isolates the anisotropic channel; it does not close the others. And
n is the occupation of **one** mode in the adiabatic vacuum at τ = 0 — no sum over the
(2j+1)² degeneracy or over j, both of which diverge without a regulator not supplied here.

| measurement | before | after |
|---|---|---|
| laboratories reachable as instruments | 5 | **6** |
| independent verifiers | 17 | **18** |
| self-tests | 592 | **595** |

## EBK quantisation, and the licence that was measured (v3.54.0)

Three work packages meet here, and the meeting is the point.

**C2 measured** that every reachable bounded Bianchi IX orbit is regular — Lyapunov
doubling ratios 0.544 to 0.578 against a plateau at 1. Regular motion on invariant tori is
exactly the condition that licenses EBK quantisation. On a chaotic orbit there are no tori
and the construction has no meaning, so the atlas is entitled to this method **because it
checked**, not because it is customary.

**The spectral operator supplies the exact answer** to check against, rather than another
approximation.

### The convergence rate is the check, not the agreement

The leading correction to EBK is O(ħ²) relative, so the error must fall by a factor of
**four** each time j doubles:

| j | 8 | 16 | 32 | 64 |
|---|---|---|---|---|
| relative error | 0.637 % | 0.175 % | 0.046 % | 0.0118 % |
| ratio | — | **3.64** | **3.80** | **3.90** |

Approaching 4, the 1/j² law. Agreement alone would be weak evidence; the *rate* is what
identifies the method as correct. It holds across the shape of the top too — moderate,
strongly asymmetric and near-axial all give 3.7–4.0 between j = 32 and 64.

### EBK is blind to tunnelling, and that is a property

One torus corresponds to **two** quantum states — a symmetric and an antisymmetric
combination of the two symmetry-related classical orbits, split by tunnelling. EBK returns
the *mean* and cannot see the split. The splittings fall exponentially, 2.9×10⁻², 2.4×10⁻³,
1.6×10⁻⁴, 5.6×10⁻⁷, 1.7×10⁻⁹ at j = 4, 6, 8, 12, 16 — the semiclassical signature.

Comparing an EBK level to a *single* eigenvalue instead of the doublet mean is not a small
error; it is comparing the wrong things, and it is what made the first run report 5 %
disagreements that were not disagreements.

### Two traps found by running it

**The action was a factor of two out.** A librating loop and a circulating torus both
enclose ∫ p_max dφ over the allowed φ. The first version doubled it — once by counting the
two symmetry-related loops as one, once by counting the ±p branches twice — and every level
came out low.

**The doublet pairing is not automatic.** Levels 2n and 2n+1 are a tunnelling pair only in
a genuinely *asymmetric* top. Let two axes coincide — β₋ = 0 gives c₁ = c₂ — and the
structure becomes a singlet at m = 0 followed by exact ±m pairs, so the pairing straddles
two different levels and the reported "splitting" is a real gap orders of magnitude too
large. Found by running the atlas self-test at β₋ = 0 and getting **1.4** where tunnelling
would give 10⁻⁹. The instrument now tests whether a pair is closer to itself than to its
neighbours and reports *"NOT a doublet"* rather than returning confident nonsense.

### The floor, declared

Beyond about j = 24 the true splitting falls below what double precision can resolve
against eigenvalues of order 10², so reported values become round-off. Each level carries a
flag saying which regime it is in. A plot of the unresolved values would be a plot of
arithmetic noise.

**Not claimed:** this quantises the *instantaneous* operator with the cᵢ held fixed. It is a
check of the semiclassical correspondence for the asymmetric top, not a quantisation of the
Bianchi IX geometry, and no quantum cosmology follows from it. The Langer length L = j + ½
is a convention with a standard justification, not a derivation.

| measurement | before | after |
|---|---|---|
| laboratories reachable as instruments | 6 | **7** |
| independent verifiers | 18 | **19** |
| self-tests | 595 | **597** |

## The hopfion locator: a second hierarchy, a second camera (v3.55.0)

The 3D locator is an attitude indicator — it shows where the camera points and turning it
turns the camera in its own spherical frame. This is the other one, in the same window,
behind a switch, with a genuinely different geometry underneath rather than a second skin
on the first.

### Which side of the quaternion product does what — measured, not guessed

h(z₁,z₂) = (2z₁z̄₂, |z₁|²−|z₂|²) sends S³ to S², and the fibre over
(sin θ cos φ, sin θ sin φ, cos θ) is z₁ = cos(θ/2)e^{iψ}, z₂ = sin(θ/2)e^{i(ψ−φ)}. Writing
x = z₁ + z₂ j as a quaternion:

| action | effect on the base | measured |
|---|---|---|
| **left** by a unit *complex* number | none — moves along the fibre | 3×10⁻¹⁶ |
| **right** by a unit *quaternion* | rigid SO(3) rotation | inner products preserved to 2×10⁻¹⁶ |
| left by a general quaternion | **not an isometry** | rigidity error **1.8** |

That last row is why this was established before a line was drawn. Building the widget on
the wrong side would have produced something that dragged plausibly and skewed the scene —
the class of error a screenshot cannot catch. The induced map is extracted as an explicit
matrix and checked to be a *proper* rotation, orthonormal with determinant +1; a reflection
would flip the scene's handedness and nothing in a picture would say so.

### What the two modes do with it

**Navigation.** Each atlas object gets its own fibre: worlds are latitudes, laboratories
are longitudes within their world. The hierarchy is not drawn *on* the hopfion — it *is*
the hopfion's base sphere. Every fibre is an exact planar circle (radius constant to
2×10⁻¹⁵) linked exactly once with every other (Gauss integral 1.0000). Tapping a ring goes
there.

**Control.** The moment something is selected the same rings become that selection's
controls: each parameter is a base point, its **value is the phase ψ** along that
parameter's fibre. Dragging around a ring is a circular slider whose geometry is the
fibration. The phase written on is the phase read back to 1×10⁻¹⁵, monotone the whole way
round — a faithful dial, not a decorative circle. The parameters are read from the live
Controls panel rather than a hand-kept list, so it stays correct in all 72 laboratories
with no registry to fall out of date.

**Camera.** Dragging right-multiplies by a unit quaternion and the induced SO(3) drives the
main camera — the *same* matrix the picture is drawn with, so widget and scene cannot
drift apart. Two camera controls that differ in kind: the 3D locator turns in the camera's
spherical frame, the 4D locator turns through the Hopf map.

### Three things found by drawing it

**The rings left the frame.** The projected radius is cos(θ/2)·K/(1 − sin(θ/2)), which
*diverges* as θ → π because the projection pole lies on that fibre. Spreading the worlds
over the whole latitude range put the outer rings outside the widget entirely. Measured at
K = 0.75 over the band θ ∈ [0.32π, 0.68π]: radii run 0.19 to 2.92 against a camera
half-height of 3.24 — every ring inside the frame, sizes still distinguishable. The band is
a stated convention; the divergence forcing it is not.

**The family piled into one corner.** With every world ring at φ = 0 they all shared a
meridian. Longitudes now advance by the golden angle.

**The caption was winning an argument with its picture.** A three-line hint covered the
half of the frame the rings are drawn in. In 4D it is one line.

The mode switch also could not live inside the title element: that is absolutely positioned
with only a left edge, so a flex row inside it has no width to distribute and the buttons
ran straight through the title.

| measurement | before | after |
|---|---|---|
| locator modes | 1 | **2** |
| camera control laws | 1 | **2** |
| independent verifiers | 19 | **20** |
| self-tests | 597 | **600** |

## A pin is not a passport (v3.56.0)

Two faults in the laboratory catalogue, reported together and turning out to be
unrelated.

### Folding threw away the one thing you had

Folded, the catalogue was **290 × 41 px with zero laboratory buttons visible** — a closed
catalogue wearing a label. Every `.labGroup` was hidden, so what remained was a nameplate.

It now keeps the group the current laboratory belongs to, shows two rows of it, and
scrolls the chosen button into view: **468 × 101 with ten buttons and the selection in
frame**. The scene gets its height back; the place survives. The rail height is measured
from a real button rather than a guessed line-height, because the row differs by font,
padding and touch target between desktop and phone — a hard-coded height would be right on
exactly one of them.

| folded | before | after |
|---|---|---|
| box | 290 × 41 | **468 × 101** |
| laboratory buttons visible | **0** | **10** |
| chosen laboratory in view | no | **yes** |

### The remnants in other worlds: a pin fighting scope

The catalogue is registered `{scope:'world', world:'s3'}` and route changes enforced that
correctly, which is why the first attempt to reproduce the report failed. The path that
does leak is **pinning**:

    pin the catalogue in S³ → switch to Solar → 468 × 192 px of 72 S³ buttons,
    with panelInScope() reporting false the whole time.

And the mechanism is sharper than "the pin outranks scope". The pin **fights** it: a
MutationObserver watches every pinned panel's `style` attribute and undoes any
`display:none`. Scope enforcement hid the panel; the observer put it straight back, four
times a second, for as long as the pin was set.

A pin means *stay open when the view changes* — a different laboratory, a different camera,
a different tool. It cannot mean *exist in worlds you do not belong to*, because the
panel's own registry entry names which world that is. Scope now wins, and the pin keeps its
meaning everywhere the panel is legal: leaving S³ hides it, returning restores it.

Panels with **no** registry entry keep their previous behaviour exactly. `panelInScope`
reports false for an unregistered id by design, and turning that into "never show" would
have silently stripped the pin from anything not yet registered — a fix quietly breaking
what it did not come to fix.

### A measurement that was measuring itself

Worth recording: the first probe of this could not reach the module-scoped
`labBrowserSetOpen`, so its `catch` branch set `style.display = 'block'` by hand — and then
reported a "leak" that was its own assignment surviving. The panel had never been opened.
Every number in this section comes from driving the real affordances instead: the browse
button, the fold button, the pin button, the topbar.

| measurement | before | after |
|---|---|---|
| S³ buttons visible in other worlds, pinned | **72** | **0** |
| pinned panel restored on returning to S³ | — | **yes** |
| self-tests | 600 | **603** |

## The fibre is the camera (v3.57.0)

The 4D locator drove the view and never read it back. Reported as "not synchronised with
the view", and that is exactly what it was: **write-only**. The 3D locator re-slaves itself
to the main camera every frame — that is what makes it an attitude indicator — and the 4D
path skipped that and applied only its own stored quaternion. Any other way of moving the
view (an orbit drag, a fly-to, a preset, XR) left the picture saying something the scene
had stopped agreeing with.

Fixing it properly meant asking what the Hopf bundle actually *is* here.

### It is the camera-orientation bundle, and that is an identity

A camera orientation is a direction plus a roll: two degrees of freedom on a sphere and one
on a circle. That is exactly S³ → S² with fibre U(1). Measured, not asserted:

| claim | measured |
|---|---|
| the **base** of a fibre **is** the viewing direction | 2.1×10⁻¹⁵ over 400 directions |
| running the **phase** leaves the base unmoved | 4.9×10⁻¹⁶ |
| roll written on = roll read back | 4.4×10⁻¹⁶ |
| up stays perpendicular to the view | 4.4×10⁻¹⁶ |

The second line is the one that matters: **the fibre is the roll circle.** So a ring is the
right target and a fibre is the right handle — aiming picks the base, rolling runs along
the fibre. Neither gesture needs a correction applied afterwards; they are what the bundle
already is.

### What the control does now

- **Tap any ring** → the scene aims along that ring's base direction, exactly (3×10⁻¹⁶),
  keeping distance and roll. Where the ring also carries a laboratory, the atlas goes
  there — aiming first, so the view is already right when the laboratory arrives.
- **Drag the gold ring** → pure roll. The view direction drifts by 2×10⁻¹⁶ across five
  rolls. This is the U(1) the Hopf map quotients out, so it is a roll *by construction*.
- **Drag the field** → moves the base point, and the live fibre visibly travels across the
  chart, because the widget now reads the camera back.

### The chart stopped spinning

Rotating the whole hopfion with the camera made every ring a moving target — the one you
were reaching for slid away exactly as you reached it. The rings are now a fixed star chart
and a live gold fibre rides it carrying the attitude, with a white marker at the current
roll. That is also what makes the two locator modes complementary rather than redundant:
**3D turns with you; 4D holds still and shows you where you are on it.**

When the view leaves the drawn latitude band — where a fibre degenerates into a line — the
live fibre clamps to the edge and turns amber. The clamp is visible rather than silently
pretending the camera is somewhere it is not.

| measurement | before | after |
|---|---|---|
| 4D locator reads the camera back | **no** | **yes** |
| aim error onto a selected ring | — | **3×10⁻¹⁶** |
| view drift during a roll | — | **2×10⁻¹⁶** |
| verifier checks | 8 | **10** |
| self-tests | 603 | **607** |

## The obstacle list was not the whole room (v3.58.0)

Found by finally looking at the thing I had twice said I had not looked at: the hopfion's
**control mode**, where every ring is one of the selection's parameters. It renders
correctly — `planet1 · 6 rings = 6 controls` — but the locator itself had walked to the
top-left corner and the breadcrumb was drawn straight through its header and its mode
switch.

`positionHierarchyLegend()` scores four corner candidates by total overlap with obstacles.
The obstacle list was `.panel, #hud, #mBtns, #landedBanner, #panelDock` — **the breadcrumb,
the Inspector, the context rail and the freshness sentinel were not in it.** With Controls
and Selection open, both bottom corners scored as blocked and the top-left scored as free,
because the thing occupying it was not on the list.

This is the Inspector-under-the-dock fault from the other side, and it takes the same cure:
**enumerate the room, do not name the last offender.**

### Widening the list was not enough, and the measurement said so

With the breadcrumb added, the locator stayed at 14, 98. The score was now honest and the
top-left was still winning — *on merit*. A breadcrumb is thin: a few thousand square pixels
of overlap against an open panel's hundred thousand. Scoring cannot rank "sits on your
navigation identity" above "clips a panel edge", because by area it doesn't.

What was wrong was the starting line. A top candidate began beneath the **topbar** alone,
so it started inside a band already occupied by five other things. It now begins beneath
all of them — breadcrumb, Inspector, rail, dock, freshness sentinel — and the locator moved
from **y = 98 to y = 148**, clear of the band entirely.

| measurement | before | after |
|---|---|---|
| chrome elements the placement avoids | 5 | **13** |
| locator top edge with Controls + Selection open | **98** (on the breadcrumb) | **148** |
| chrome overlapping the locator | breadcrumb | **none** |
| self-tests | 607 | **608** |

## One bar, and a catalogue that stays reachable (v3.59.0)

Two faults reported from a phone, both confirmed with numbers.

### Two bottom bars that both said "Controls"

Measured at 393 × 852: the nav was 56 px and the Inspector strip another 52 — **108 px,
12.7 % of the screen** — on two rows that overlapped in meaning. The nav offered *Controls*
and *Inspect*; the strip directly above it offered controls, measurements, theory, objects
and data. "Controls" appeared twice and "Inspect" was a label for the bar sitting on top of
it.

The strip **is** the inspector, so on a phone it becomes the bar. Its live tabs render into
the nav between Atlas and More — the same tabs, through the same `inspectorPanelFor()` gate,
so a tab still cannot appear unless its panel exists and is in scope — and the separate
strip goes. Desktop is untouched: the strip keeps its own space and the nav is not shown.

Seven items at the nav's own label size showed **four** and pushed the rest off the edge,
which is worse than the two bars it replaced. So every item keeps its icon and the *active*
one alone carries its name.

| | before | after |
|---|---|---|
| bottom chrome, portrait | 108 px (12.7 %) | **56 px (6.6 %)** |
| destinations reachable | 4 of 7 | **7 of 7** |
| duplicated destinations | Controls ×2 | **0** |

### A function that destroyed the thing it tested for

`labBrowserBuild()` looked for `#v-sec` inside the controls panel to find the laboratory
row — and then **moved all 72 buttons out of that panel** into the catalogue. So the first
build worked, and every rebuild afterwards found no `#v-sec`, took the "not the S³ mode"
exit, and never re-created the launcher. Measured on desktop *and* phone: `#labOpenBrowser`
absent, 72 buttons sitting intact inside `#labPanel` — the catalogue whole and completely
unreachable, in the one world it belongs to.

The launcher now has its own section in the controls panel, created if missing, and the
buttons are looked for wherever they are. Two wrong turns on the way, both caught by
measurement: walking up from a moved button lands *inside* `#labPanel`, which would have
written the launcher into the panel it is supposed to open; and taking the union of both
locations double-counts, because the controls panel re-creates its buttons on every rebuild
— the count climbed 72, 144, 216. What is wanted is the fresh set when there is one and the
held set when there is not, never both.

### And two faults of my own, caught by the suite

Inserting the bar's CSS closed the desktop media block early, so the `#contextRail` desktop
rule fell into the phone block and stopped applying — the rail drifted back over the
Inspector strip. The self-test that enumerates every tenant of the top band caught it.

And `hccTabsBuildMerged()` toggled its class *before* building the replacement. It runs
during module evaluation, before `HCC_CTX` exists, so `inspectorPanelFor()` threw on a
temporal-dead-zone reference — after the class had already hidden the strip. Strip 0 px, bar
unmerged, five tools unreachable. Nothing is hidden now until its replacement is in hand.

| measurement | before | after |
|---|---|---|
| self-tests | 608 | **611** |

## Arriving somewhere shows you its controls (v3.60.0)

Reported as broken work: choosing a section did not present its settings, and the
laboratory catalogue had gone from the one world it belongs to. Measured across four
sections on a phone, all three faults were real and all three were mine.

### What was wrong

| section | before | after |
|---|---|---|
| Solar | Controls **closed** | open · "Time" · first parameter visible |
| Zyklen | open | open · "Shared timeline" |
| **S³·Hopf** | Controls open, **no catalogue at all** | catalogue **above** Controls (279–451 vs 461–734) |
| FBS3R | headed **"S³ Laboratory"**, own parameter below the fold | "Golden-ratio ladder — R(N) = ℓ_P·φᴺ" · visible |

**The launcher section leaked into every world.** I inserted it into the controls panel and
never removed it, so FBS3R came up wearing S³'s heading with its own first parameter pushed
below the fold. And the gate was wrong in kind: testing *"are there laboratory buttons
anywhere"* answers yes in every world once they have been moved into the catalogue. The
gate is the registry — the catalogue belongs to S³ — not a DOM node that moves.

**The catalogue landed on top of Controls, not above it.** On a phone every panel is a
bottom sheet in the same slot, so both were handed identical geometry — both at y 461..734.
Where Controls *starts* is now published each tick as `--ctl-top`, measured from the bottom
of the viewport, and the catalogue is anchored to it. It arrives folded to its rail, so it
costs 101 px on desktop and 172 on a phone rather than a wall of 72 buttons.

**Pressing a section you were already in toggled Controls shut** with nothing to bring it
back. The toggle stays — it is a useful affordance and it predates this work — but when it
opens it now lands on that model's first real parameter rather than on the panel's own
heading. Pressing a section is a request to work with that model, so the answer is its
settings.

### The rule underneath all three

Each of these was a piece of state that some call site was expected to maintain. Each is
now a **function of the context, evaluated on the publish tick**: which world am I in →
should Controls be presented, should the catalogue exist, where does it sit. The catalogue
is offered once per arrival and not forced back if you close it — an affordance that
reopens itself every frame is not an affordance, it is a fight.

| measurement | before | after |
|---|---|---|
| sections presenting their own controls | 3 of 4 | **4 of 4** |
| catalogue present in S³ | **no** | yes, above Controls |
| catalogue present outside S³ | heading leaked | **no** |
| self-tests | 611 | **614** |

## A panel that appears by itself must have a way out (v3.61.0)

The laboratory catalogue was offered on arrival in S³ and could be folded and pinned, but
not closed. Measured on a phone: it held **52% of the screen** and covered **49% of the
model**, and there was no gesture that removed it. A panel the user did not ask for and
cannot dismiss is not an affordance.

| | before | after |
|---|---|---|
| ways to dismiss | fold, pin | fold, pin, **×**, backdrop tap, `Esc` |
| screen held, phone | 52% | 0% once closed, 14% at the rail |
| model covered | 49% | 0% |
| reopens itself | on every arrival | once per arrival, never after a close |

The close is remembered for the session, so the catalogue does not re-appear behind you.
Offering something once is hospitality; offering it every frame is a fight.

## Sixteen fibres, and every one of them says its name (v3.62.0)

The 4D locator draws the Hopf bundle as sixteen fibres carrying the atlas's worlds, its
laboratories and the live parameters of the current selection. Reported as unusable. It
was, and the reason was measurable rather than aesthetic.

| fault | measurement | fix |
|---|---|---|
| fibres too thin to hit | tube radius 0.028 in a 6-unit scene ≈ **1 px** | drawn at `HOPF_TUBE_R = 0.046` with invisible pick tubes at `HOPF_PICK_R = 0.19` — 4× the drawn radius, ~19 px |
| nothing was named | naming was **hover-only** | hover does not exist on touch, so naming moved to **focus** |
| focus and hover disagreed | two writers of the same colour | `hopfPaint()` is the single authority for opacity, colour and marker scale |
| a tap both aimed and navigated | one gesture, two irreversible effects | tap = focus + aim (reversible); a separate **go →** press navigates |
| no keyboard or thumb path | none | **‹ ›** stepper, shown only when `[data-locator="4d"]` |
| 212 px widget | fibres overlapped at the poles | **⤢** expands to 380×380 |

Measured after, from a cold load, by pressing **›** and reading the name line:

```
desktop: 16 distinct fibre names · 40 presses · 0 page errors · "go →" present
phone  : 16 distinct fibre names · 40 presses · 0 page errors · "go →" present
```

Forty presses because the walk deliberately overruns to prove the ring wraps; the sixteenth
name arrives on the sixteenth press and the seventeenth returns to the first. The sixteen
are **7 worlds** (Solar System, Cycles, Observable domain, S³·Hopf, FBS3R φ-ladder, Field
laboratory, Fractal) + the **9 laboratories of the world you are in**. Select an object and
the same widget rebuilds as parameter rings taken live from the Controls panel's own range
inputs — not from a hand-kept list, which is why it stays correct across all 72
laboratories.

### Then I looked at it, and eight faults had passed every number

The measurement above was **wrong about the phone**, and wrong in the way that matters: it
was driven by JavaScript clicks, and a script can click a button that is not on the screen.
The phone had no navigator at all. What the screenshots then showed:

| fault | why no number caught it |
|---|---|
| the locator carries `display:none !important` below 820 px | a JS click works on a hidden element, so 16/16 names still came back |
| "hide it while a panel is open" was written **three times** — stylesheet, layout tick, render pass — and the opt-in beat only the first | every rectangle was correct: frame, title, name line, working buttons |
| …so the scissor pass returned before drawing: a widget with **no picture in it** | there is nothing to measure about a picture that was never drawn |
| the mode switch's whole stylesheet sat inside `@media (min-width:901px) and (pointer:fine)` | correct sizes, correct hit targets — and 3D / 4D / ⤢ rendered as raw white platform boxes |
| growing both button rows to a 30 px thumb target made them **overlap** | both rows measured 30 px, exactly as asked |
| expanded, the square was 374 px tall on a 390 px phone and its top edge landed at **y = −37** | the widget was "expanded", as requested — with the ⤢ that shrinks it off the top of the screen |
| the top-band list — whose whole lesson was *enumerate the room* — was missing `#breadcrumb` and `#clock` | the placement engine scored honestly against the list it had |
| labels cut at 24 characters mid-word: *"Spinor & Light-Cone Obse"* | 24 is 24 |

In order: the navigator is opt-in from **More → ⬡ 4D navigator**, which turns it on and puts
it straight into 4D; the visibility rule is now one function, `hierLocatorAllowed()`, that
both JavaScript readers ask instead of restating; the mode switch is styled for every
screen; `.hq` moved to y 40 so a tap aimed at ⤢ no longer fires the Y-view button; the
expanded height is the band that actually exists between the top band and the Controls
stack; `#breadcrumb` and `#clock` joined the band, which is published as `--loc-top`; and
labels trim at the last word boundary with the full name in the tooltip.

The drawn tube went 0.028 → **0.046** at the same time. At 196 px on a phone the old radius
was a scratch you had to know was there; the pick tube went to 0.19 to keep the 4× margin.

Measured after all of it, on a 390×844 phone with **real touch events**:

```
7 visible controls · smallest 30 px · 0 taps landing on the wrong control
16 distinct fibre names by touch · expand 374x167 into its own band · shrink back 196x167
0 page errors
```

Self-tests 614 → **618**, including *every fibre named by stepping* and *the navigator
exists on a phone*; the 72-view S³ walk reports 0 page errors.

The honest summary is that the geometry was never the problem and the numbers were never
enough. Six of those eight faults were invisible to assertions that measure rectangles, and
every one of them was fatal to using the thing.

The camera law is unchanged and is the one thing here that was never in doubt: the Hopf
bundle **is** the camera-orientation bundle — base point ↔ view direction (2.1×10⁻¹⁵),
fibre phase ↔ roll (4.9×10⁻¹⁶), verified in `docs/verify-hopfion-locator.cjs` (10/10).
What was broken was never the geometry. It was that a correct instrument with 1-pixel
controls and no labels is, to a user, indistinguishable from a broken one.

## A varying dark energy is a moving horizon (v3.63.0)

From the manuscript *Trace-Free Gravity and Horizon Capacity: Fibonacci Shell Closure and
an Autonomous Edge-Hamiltonian Candidate for the Cosmological Constant* (Preece & Batenin,
12 Aug 2026), §dynamic-capacity, §hopf-schwinger, §bradlow-packing, §real-data-audit.

The argument the atlas can now draw is one sentence long. **A cosmological constant is
constant**, so a measurement of time-varying dark energy cannot be a measurement of Λ
changing. Write the same number as a boundary capacity,

    N_∂(a) = 3π / (ℓ_P² Λ_eff(a)),

and a varying dark-energy density becomes a *flow of capacity* — the horizon holding a
different number of Planck cells — with no local vacuum energy varying anywhere. Capacity
is an area, so this is a statement about a **sphere**, and a sphere is something an atlas
can put on the screen at true scale.

### What is now in the Observable domain

`R_Λ = √(3/Λ_eff) = 17.528 Gly` is drawn as a real shell beside the two horizons that were
already there — and it is **none of them**:

| shell | radius | what it is |
|---|---|---|
| ΛCDM event horizon | 16.685 Gly | future causal boundary |
| **de Sitter capacity horizon** | **17.528 Gly** | asymptotic √(3/Λ), the Planck-cell count |
| particle horizon | 46.125 Gly | the observable radius today |

Move `w₀` or `w_a` in the Capacity-flow panel and the shell moves, because that is exactly
what the manuscript claims moves. At `w₀ = −0.9, w_a = −0.8, a = 0.35` it reads
`R_Λ = 24.19 Gly · N_∂ = 6.301×10¹²²`.

### The panel

Exact closed forms, all of them boxed equations in the paper:

```
Λ_eff(a)/Λ₀ = a^{-3(1+w₀+w_a)} exp[3w_a(a-1)]      N_∂(a)/N_∂0 = the exact reciprocal
w(a) = w₀ + w_a(1-a)                               a_× = 1 + (1+w₀)/w_a
ν_∂ = 𝒟 ln N_∂ = 3(1+w) = -s_eff                   w_s = -1 - s/3 on S_val = {1,0,-1,-2,-3}
```

Two things it does that the paper does not:

**The null is measured, not printed back.** `ℛ_cap = 𝒟 ln N_∂ − 3(1+w) = 0` is an identity
of the construction. The panel differentiates its own closed form numerically and shows
the residual, because an identity that is displayed instead of evaluated is a claim rather
than a test. Worst residual over 15 (w₀, w_a, a) points: 4×10⁻¹⁰.

**It says when your epoch is impossible.** A positive non-interacting valuation mixture on
fixed support obeys `𝒟w = −Var_π(s)/3 ≤ 0`. So a reconstruction with `𝒟w > 0` — the
DESI-type trend from phantom-like in the past to quintessence-like today — *cannot be one*,
and the panel says so, with the exchange current `J₊` recovered pointwise from the
observable pair `(w, 𝒟w)`. The alternatives are named: bulk-valuation activation,
interacting branch exchange, or a sign-indefinite reconstruction.

### Bradlow packing: the capacity IS a vortex count

The prettiest identity in this part of the paper, and it survives being checked:

    N_v^max = τ_P·A/(4π) = A/(4ℓ_P²) = N_∂,     τ_P = π/ℓ_P²

Not approximately — *identically*, because both sides are the same expression. The maximum
number of Planck–Bradlow vortex cells that fit on the horizon is the Bekenstein–Hawking
capacity. One cell has area 4ℓ_P² and coherence length ξ_P = ℓ_P/√π = 9.12×10⁻³⁶ m. The
atlas records what this is **not**: Bradlow gives an upper *bound*, so it is a packing
channel, and only an added saturation hypothesis turns `N_v ≤ N_∂` into `N_v = N_∂`.

Beside it, the Schwinger wall, for contrast: a horizon-wide field at the QED limit carries
`N_e^Sch = 4πε₀R_Λ²E_Sch/e = 2.53×10⁷⁹` charges — **43.1 orders of magnitude** below N_∂ —
while the mean dark-energy scale `E_Λ = 10.89 V/m` sits 8.2×10⁻¹⁸ below the wall itself.
Two different invariants; the atlas refuses to let one stand in for the other.

### The saddle is not the sky

The manuscript prints `n_∂ = 291.936672…` immediately under the boxed
`q₀ = πφ⁵⁸⁴/(1+π/50)`, which reads as `n_∂(q₀)`. It is not.

| point | ladder coordinate | what it is |
|---|---|---|
| saddle | `n_∂(q₀) = 292 − ln(1+π/50)/(2 ln φ) = 291.936684` | the theory's own value |
| sky | `n_∂ = log_φ√(N_∂0/π) = 291.936672` | 3π/(Λ₀ℓ_P²) at the paper's H₀ = 67.4, Ω_Λ = 0.685 |

Both round to shell **292** — that is the claim, and it holds. But they are two points
1.19×10⁻⁵ of a shell apart, and the atlas shows both rather than letting one number stand
for two. The gap is not observable: moving H₀ by the Planck-2018 uncertainty ±0.42 moves
n_∂ by 0.0129 shells, a thousand times more.

### q₀ in exact arithmetic

The paper quotes q₀ to sixteen digits. Double precision cannot check that: `Math.pow(φ,584)`
is already wrong in the 14th digit, and the atlas's own stored constant inherits it. The
verifier computes φ⁵⁸⁴ = (L₅₈₄ + F₅₈₄√5)/2 in exact BigInt Lucas/Fibonacci integers at
10⁻⁸⁰ fixed point and confirms **all sixteen quoted digits**:

```
exact  q0 = 3.307251460713979e+122
paper  q0 = 3.307251460713979e+122
double     ...460714043      <- wrong inside the quoted precision
```

### Declared boundary

`docs/verify-capacity-flow.cjs` — **31/31**, reading neither the atlas nor being read by it.
It checks the arithmetic of the chain. It does **not** re-derive Ξ_edge or b g_∂² from the
edge algebra, and it does **not** re-fit the DESI DR2 BAO χ² table: the DR2 Table 4 data
vector and its covariance are not reproduced in the manuscript, so no re-fit is possible
here. That table is displayed in the panel labelled **QUOTED FROM THE MANUSCRIPT** wherever
it appears, with the paper's own conclusion attached — a consistency-level improvement, not
a detection, and the positive s = +1 branch driven to Ω_P ≈ 0.

Self-tests 618 → **628**; the 72-view S³ walk stays at 0 page errors.

### A rule is not a layout

Two of the new checks originally asked `document.styleSheets` whether a rule existed. One
of them was doubly wrong. It asks the stylesheet what the layout will be instead of asking
the layout — and the walk itself returned `false` against a sheet where a flat loop found
the rule at every sample, five samples over nine seconds. The rendered page obeyed the
rule the whole time.

Both are gone. The chip-row check now reads `getComputedStyle(el).flexWrap` from the
element itself; the phone-navigator check asks `hierLocatorAllowed()`, the behaviour, and
leaves the rendered rectangle to the external 390×844 measurement recorded above. The
fault the wrap fixes is the same one the fractal MODE selector taught: on a phone `.chips`
is one swipeable line, this panel rebuilds on every press, and the rebuild resets the
scroll — so two of the five presets sat off the right edge at x = 331 and x = 460 and
could not be reached at all.

## The leak that hung the graphics card (v3.64.0)

Reported: the Solar System runs fine and then, after a while, the graphics card hangs and
everything crawls. It used to fly.

It was a **WebGL buffer leak**, and it was measurable rather than a matter of opinion.
Wrapping `createBuffer`/`deleteBuffer` on the GL context and letting the idle Solar view
run:

```
t =  8s   live buffers 311
t = 48s   live buffers 426        textures 26 · framebuffers 17 · programs 28 — FLAT
t = 88s   live buffers 545
BufferGeometry.dispose() called: 0 times in the entire run
```

Only buffers grew: **+1.08 per rendered frame**, none ever freed. On the software renderer
that is 3 per second. On a real GPU at 60 fps it is 120 per second, 432 000 per hour, until
the driver runs out of allocations and the card stops responding.

### The cause

`geometry.setFromPoints()` does not write into the existing buffer. It **replaces the
position attribute** with a new one, and three.js keys its `WebGLBuffer` cache on the
attribute object — so the old attribute is dropped, its buffer is never deleted, and a
`WeakMap` has no finaliser to notice. `computeLineDistances()` does exactly the same thing
to the `lineDistance` attribute, which is why dashed lines leaked twice as fast.

Fourteen call sites did this to live geometry. Two ran **every frame** in the Solar view
(the Earth precession reference line and the galactic-centre link); the Cycles world had
five more and leaked hardest at 513 buffers in 22 seconds.

### The fix

Never replace the attribute. `lineSetPoints()` writes into the array that is already there
and raises `needsUpdate` — the in-place pattern this file already used correctly for the
solar-apex trails ten lines away from one of the leaks. `lineComputeDistances()` does the
same for the dash metric. When the point count genuinely changes (the heliocentric orbit
loop is 257 points, the geocentric one 362, so switching reference frames really does
resize), the new geometry is built and the old one **disposed** — `dispose()` is the only
portable way to make three.js delete the buffers it owns.

Measured after, 22 seconds in each world:

| world | before | after |
|---|---|---|
| Solar | +234 / 88 s | **0** |
| Cycles | +513 / 22 s | **0** |
| FBS3R | +138 / 22 s | **0** |
| S³ · Hopf | +78 / 22 s | **0** |
| Observable, Fractal, Field | 0 | **0** |

And 0 under a stress run — a selection active (which lights the relation lines), time at
maximum rate, and six camera drags.

## A deep link that lands somewhere else (v3.64.0)

Found while checking the above. Every deep link was broken:

```
#/world/s3          context s3/sec   scene solar   MISMATCH
#/world/obs         context obs      scene solar   MISMATCH
#/world/fbs         context fbs      scene solar   MISMATCH
#/world/cyc         context cyc      scene solar   MISMATCH
#/world/s3/lab/hopf context s3/hopf  scene solar   MISMATCH
```

Share a link to a laboratory and the person who opens it lands in the Solar System, with
the breadcrumb, the panels and `HCC_CTX` all insisting they are where they asked to be.

The same fault as everything else in this file that has ever gone wrong: **two authorities
for one fact, and the later one winning by accident.** `hccBootRoute()` reads the URL and
moves the world; then a line further down ran unconditionally and moved it back. Its
comment — *"always boot into the Sun+planets overview"* — was correct when written, before
routes existed, and was never reconciled with them. `atlasFrontDoor()` already knew better:
it guards its own `setMode` with `&& !location.hash`. This line did not.

A URL is the more specific instruction, so it wins; the overview is the default only when
nothing was asked. All five links now land where they say.

## The viewfinder is a trackball (v3.64.0)

Reported: steering the camera by grabbing a ring is unusable; the torus should turn in the
viewfinder under the cursor, and the scene should turn correctly with it.

The old law incremented spherical coordinates — `θ += dy·0.006`, `φ −= dx·0.006`, with θ
clamped away from the poles. Three faults, all felt rather than seen:

- **It is singular at the poles.** φ is the azimuth, so near θ = 0 a horizontal drag swings
  the camera arbitrarily fast, and the clamp then refuses to go further at all. The scene
  fights you exactly where you most want to look.
- **It did not correspond to the picture.** The drawing did not move under the finger; only
  a marker on a fixed chart moved. The hand did one thing and the eye watched another.
- **Roll was a separate gesture on a separate target** — which is what made grabbing a ring
  to fly the camera unusable.

It is a **Shoemake arcball** now. The pointer is lifted onto a virtual unit ball —
hemisphere inside the circle, rim outside — and the drag from `v₀` to `v₁` is the rotation
carrying `v₀` to `v₁`. The scene must appear to turn the same way, so the camera turns by
`q⁻¹` **in its own frame**: a right multiplication, which is the rigid SO(3) action on this
bundle (measured at 2×10⁻¹⁶ in `verify-hopfion-locator.cjs`) rather than a left one, which
is not rigid at all.

And `hopfCamera` now carries the main camera's orientation, so **one quaternion drives both**
the viewfinder and the scene. The chart itself stays fixed in the bundle's own coordinates —
every base-direction identity the self-tests measure is untouched — what moves is the eye
looking at it.

Four properties, each one measured rather than claimed:

| property | measurement |
|---|---|
| **no hysteresis** | a four-leg excursion returned to the start leaves a residual of 0 rad — exact, not nearly |
| **isometry** | the camera turns through exactly the angle the grab subtends on the ball (worst mismatch < 10⁻⁹ rad) |
| **no pole** | aimed 0.02 rad from the pole, a drag still turns 0.3+ rad instead of clamping |
| **the rim is the fibre** | a rim-to-rim drag rolls by exactly 90.000° and moves the view direction by < 10⁻⁹ |

That last row is the part worth keeping. Twist about the view axis **is** the U(1) phase the
Hopf map quotients out, so the arcball's rim gesture and the bundle's fibre are the same
motion. Roll no longer needs a target of its own, because the geometry already contained it.

Choosing a specific ring is no longer a matter of hitting a moving target with a pointer:
that is what the ‹ › focus stepper is for. **Direct manipulation for attitude, discrete
stepping for targets.**

Self-tests 628 → **632**; the 72-view S³ walk stays at 0 page errors.

## Status

The derivation is a rigorous superstructure over a **declared model**: a round S³, a
conformally coupled massless real scalar, one renormalization scheme, and the structural
ansatz R_N = ℓ_P φ^N. It is not an observational discovery. The renormalized remainder
ħc/(240R) is not the cosmological constant, φ is not derived by anything here, and the
formal coincidence 2Gε₀/(c⁴R) = 1 at R = ℓ_P is an algebraic identity and not a quantum
black hole. The atlas states all of this on the panel that displays the numbers.
