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
| `verify-lagrange-points.cjs` | the five Lagrange points solved from the quintic, and what the Hill approximation costs |
| `verify-fibonacci-anyons.cjs` | the Fibonacci category — F, R, braid, S, T and c = 14/5, checked against each other |
| `verify-gate-independence.cjs` | whether the three gates are three determinations, by exact arithmetic and a calibrated symbolic search |
| `verify-edge-determinants.cjs` | the two named missing terms, which of them can matter, and the one number the other must supply |
| `verify-edge-operator.cjs` | the recursion operator ℛ, the manuscript's own no-go, and the admissibility kernel two laboratories were already drawing |
| `verify-quantity-bus.cjs` | what makes a coupling between two laboratories admissible, and the identity that closes capacity → ladder → radius → capacity |
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
node docs/verify-quantity-bus.cjs          # 21/21 checks pass
node docs/verify-edge-operator.cjs         # 12/12 checks pass
node docs/verify-edge-determinants.cjs     # 21/21 checks pass
node docs/verify-gate-independence.cjs     # 9/9 checks pass
node docs/verify-fibonacci-anyons.cjs      # 19/19 checks pass
node docs/verify-lagrange-points.cjs       # 11/11 checks pass
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

## An instrument whose knobs are below its readout (v3.65.0)

Reported from a phone: the Planck–Casimir zero-point observatory and the panels like it
are one long strip — the sliders end up under the visualisation and the instrument is
useless. Parameters must always be their own segment.

Measured on a 390×844 phone, each panel open in its 270 px sheet:

| panel | content | first slider at | parameters reachable |
|---|---|---|---|
| Planck–Casimir zero-point | 4730 px | **1483 px** | **0 of 3** |
| Bianchi IX | 2776 px | **1462 px** | **0 of 7** |
| Smith–Möbius | 1966 px | **769 px** | **0 of 4** |
| Capacity flow | 2342 px | 146 px | 1 of 3 |

Five and a half screens of charts before you reach one control. The report was exactly
right and the number says how right.

### The dock

Every parameter row is lifted out of the prose into **one dock pinned at the top of the
panel** with `position: sticky`, so opening an instrument shows its controls first and
they stay on screen while the science scrolls underneath. It caps its own height and
scrolls internally — seven parameters must not swallow a sheet — and it **folds to a
single line**, because a control surface that cannot get out of the way is the fault we
started from wearing different clothes.

| | before | after |
|---|---|---|
| zero-point | 0 of 3 at 1483 px | **3 of 3** at 118 px |
| Bianchi IX | 0 of 7 at 1462 px | **6 of 7** at 122 px |
| Smith–Möbius | 0 of 4 at 769 px | **4 of 4** at 99 px |
| Capacity flow | 1 of 3 | **3 of 3** at 82 px |

Two smaller measurements inside that one. A phone `.ctlrow` stacks label, slider, value and
the oscillate button on four lines — **96 px each** — so three parameters came to 245 px of
a 270 px sheet and the chart was gone; inside the dock a row is one line, **46 px**. And the
fold control was inflated to a 70 px slab beside an 8 px heading by the 44-pt touch rule,
which is right for a primary action and wrong for a chevron.

### It runs on the tick, not on a call site

These panels rebuild their `innerHTML` wholesale, from several places, some of which are
their own slider handlers. Anything that must be re-applied after a render **and is invoked
by a call site** will eventually be missed by one — this file has the scar tissue to prove
it. So the dock is a function of the panel's current DOM evaluated on the publish tick: if
there are loose parameter rows they get docked, and a rebuild deletes the dock along with
everything else, which is precisely the signal to build it again. When the dock is already
there the tick costs one `querySelector`.

### Room for both halves

32vh is right for a list and wrong for a panel carrying a docked control surface *and* the
readout those controls act on. The five instruments now default to 50vh in portrait, 46vw
in landscape — a **default, not a clamp**: the reader's own drag of the grip still wins and
is still remembered, and a CSS fallback could not have done this job because the default is
written *into* `--sheet-h` by script, where `var(--sheet-h, …)` never sees it.

### And the band under them

`--ctl-top` — the band a bottom sheet occupies, which the freshness banner and the
laboratory catalogue both anchor to — was measured from `#ctl` alone. With the observatory
open, the banner was drawn straight across the parameter dock's header and its fold
control. The same enumeration fault as the locator's obstacle list, one floor down: the
publisher now takes the highest top edge among `#ctl` and all five instrument sheets.

Self-tests 632 → **635**; the 72-view S³ walk stays at 0 page errors and all seven worlds
stay at 0 buffer growth.

## Seventy-two instruments, one machine (v3.66.0)

The atlas already had a typed instrument layer: every laboratory declares its inputs and
outputs with a name, a unit and a domain, and refuses an input outside that domain rather
than clamping it. What it did not have was any way for one laboratory's **output** to
become another's **input**. Seventy-two instruments sat side by side, each able to answer
its own question and none able to ask another's.

### What makes a coupling admissible

Two rules, and the second is the one that matters.

**The unit must match**, compared as a normalised string. Most units here are declared
tags — `rung`, `spin`, `momentum`, `volume time` — not SI, so the atlas has no licence to
invent a conversion it was never given. A mismatch is refused, not rescaled:

```
ladder.R is in [m] and capacity.u is in [ln(capacity), dimensionless]
  — refused rather than rescaled, because the atlas was never given a conversion
```

**And unit matching is necessary, not sufficient.** Half the quantities in this atlas are
dimensionless; matching on units alone proposes **46** couplings where **11** are
meaningful. So discovery requires a shared coordinate *name* as well, with a short alias
table for the pairs whose names differ for a reason. `bus.candidates()` proposes;
`bus.links()` is what has been declared; the difference between the two lists is a
judgement about physics, made in the open rather than hidden in a type rule.

The bus also refuses a second driver for one input, and refuses a link that would close a
cycle **when it is declared**, not when it is evaluated — a bus with a cycle is an
oscillator, not a machine. A value arriving over the bus is still an input and goes
through the same domain check.

### The deepest coupling is an identity

The capacity selector says which rung of the golden ladder the boundary sector sits on,
`n_∂ = log_φ √(q/π)`. The FBS3R ladder turns a rung into a radius, `R_N = ℓ_P φ^N`. Route
the first into the second:

```
capacity.n_phi = 291.936684  →  ladder.N  →  R = 1.658321e+26 m = 17.528 Gly
closing the loop back to q = π(R/ℓ_P)² costs 1.5e-14
```

That radius is the de Sitter horizon the Capacity-flow laboratory draws as a shell in the
Observable domain. It is not a resemblance between two laboratories: `q = π(R/ℓ_P)²` **is**
`N_∂ = A/(4ℓ_P²)` written twice. The ladder never sees q, the selector never sees R, and
neither knows the other exists — the loop is closed by arithmetic. Checked offline over
five capacities spanning sixty decades, worst round trip 2.7×10⁻¹⁴.

### A state that was computed and thrown away

Bianchi IX integrates a trajectory in the Misner variables and reported only its verdict —
the class, the Lyapunov exponent, the bounces. The **state it reached** was in the
integrator's return value the whole time and was dropped. Three other laboratories take
exactly those coordinates as input.

| | before | after |
|---|---|---|
| spectral gap | 0.5930 at a state somebody typed in | **17735.36** at the state the cosmology reached |
| provenance | none | `alpha ← bianchi.alpha_final`, `beta_plus ← …`, `beta_minus ← …` |

Nothing new is computed. The trajectory reached (α, β₊, β₋) = (−6.9623, 2.9374, 0.4910),
and the question changed from *what does this cosmology do* to *what does the quantum
spectrum look like at the state this cosmology reached*. The Misner triple sums to zero
identically, so what travels the bus is a shear and cannot smuggle a volume change into a
shape variable.

Eleven couplings are live: `capacity.n_phi → ladder.N`, and Bianchi's final α, β₊, β₋
into the spectral operator, particle creation and EBK, plus its final momenta into
particle creation.

### The wiring order was itself a bug

Written inline, the declarations ran at line 23594 while the capacity selector registers at
24064. The first link threw *"unknown laboratory"*, one `try` swallowed it, and the whole
set was silently absent while `candidates()` looked perfectly healthy — eleven admissible,
zero declared. A declaration that depends on registration order has to state that
dependence, so it is a named function called once, after the last laboratory registers,
and it returns what it declared and what it refused.

```
HCC_API.bus.candidates()   every coupling the atlas finds admissible
HCC_API.bus.links()        the couplings actually declared
HCC_API.bus.evaluate(id)   run it with linked inputs resolved, with provenance
```

Self-tests 635 → **639**; `docs/verify-quantity-bus.cjs` 14/14; the 72-view S³ walk stays
at 0 page errors and all seven worlds at 0 buffer growth.

## What the other sixty-five can be asked (v3.67.0)

The bus can only couple what has declared itself. Seven laboratories declare a typed API.
The other sixty-five compute and draw but declare nothing a machine can read: their
parameters are hand-written HTML, one block each, wired by hand. There is no table to
read — and writing sixty-five specs by hand would mean **inventing sixty-five contracts
the code never agreed to**.

### So read what is already true

A laboratory's parameters *are* its controls. Each carries an id, a label, a declared
minimum, maximum and step, and a current value. That is a schema the laboratory wrote
about itself, in the only place it was ever written down. Harvesting it invents nothing.

It fills itself: the schema is read off the current laboratory's own controls on the same
publish tick that does everything else, so the atlas declares itself by being used. Walking
every world and every laboratory once:

```
79 = 7 worlds + 72 laboratories
78 declared · 336 parameters
missing: 1
```

The one absentee is the **S³ world itself**, and it is absent for a reason rather than by
omission: arriving there lands you in its first laboratory, so the world has no controls of
its own. There is no schema to read, and inventing one would be a lie.

### And write the way a person would

`config.set(lab, {control: value})` sets the control's value and dispatches the same
`input` event a finger produces, so every validation, side effect, rebuild and redraw the
laboratory implements happens exactly as it does for a reader. Measured: χ driven
0.084 → 1.5735 and the scene followed, because the laboratory's own handler did the work.
The alternative — writing into state and hoping the scene notices — is how an interface
acquires two authorities for one fact, and this file has enough of those already.

A value outside the control's own declared domain is **refused, not clamped**:

```
chi = 1000003.142 is outside the declared 0.005..3.142 — refused rather than clamped
```

the same rule the typed layer already states, applied to the same kind of quantity.

### What this layer may not do

It may not pretend a configuration link is dimensionally checked. **Controls carry labels,
not units.** A slider called "Speed" and one called "β₊" are both numbers, and that proves
nothing about whether one may drive the other. The typed bus can *discover* couplings
because its quantities carry declared units; this layer cannot, so configuration links are
**declared, never discovered**, and there is deliberately no `config.discover()`.

That distinction is the whole difference between a machine and a pile of wires, and it is
worth more than the sixty-five couplings a looser rule would have manufactured.

```
HCC_API.config.schema(lab)      the laboratory's own controls: id, label, domain, value
HCC_API.config.set(lab, {...})  drive them the way a finger would
HCC_API.config.coverage()       how much of the atlas has declared itself
```

Self-tests 639 → **642**; `docs/verify-quantity-bus.cjs` 14/14 → **18/18**; the 72-view S³
walk stays at 0 page errors.

## Every rung already carries a cosmological constant (v3.68.0)

### The links, finished

The typed bus discovers couplings because its quantities carry declared units. A
**configuration** link cannot be discovered, and the near misses are a better argument for
that than the rule is: the chaos laboratory has a slider labelled **β**, so does the S³
eigenmode laboratory, and neither is the Misner anisotropy a Bianchi trajectory reaches.
Three different β, three different physics, one label — and no type system can tell them
apart, because the label is all there is.

So of the 336 controls the atlas harvested, **exactly one** is *determined* by a typed
instrument output rather than merely compatible with it, and it is declared with a reason.
`hccBusWire` **refuses a wire that carries no justification**: a coupling whose reason
nobody wrote down is a coincidence waiting to be mistaken for a law.

And it is **offered, not forced**. A wire does not overwrite a control every tick — that is
how a panel starts fighting the person using it, and this record already contains two of
those. It provides an action; pulling it takes the value once, through the control's own
input event, refusing anything outside the control's declared domain.

### What that one link buys, and why FBS3R is where it lands

`R_N = ℓ_P φ^N` is a radius. The Bekenstein–Hawking capacity of the sphere it bounds is
`q = π(R/ℓ_P)²`. The capacity postulate reads that as `Λ = 3π/(ℓ_P²q) = 3/R²`. Three lines
of arithmetic on a number the golden ladder already holds — so **every rung of the ladder
already carries a cosmological constant**, and the atlas simply never said so.

It says so now, live, beside the Level N slider:

```
◱ capacity rung 291.94        ← takes the rung from the Capacity selector, over the bus
q = π(R/ℓ_P)² = 3.3073e+122 · Λ = 3/R² = 1.0909e-52 m⁻²
the measured sky sits at rung 291.9367 · you are +0.0000 from it
one rung is a factor φ² = 2.618 in capacity
```

Press the chip and the ladder moves from N = 0 to **N = 291.936684**, with the provenance
recorded as `capacity.n_phi` — not a constant typed into this world. The HUD then reads
*R = ℓ_P·φᴺ = 17.53 Gly ≈ the scale of the observable Universe*, and that radius is the
same de Sitter shell the Capacity-flow laboratory draws in the Observable domain.

Three worlds, one equation, and none of them holds the other's number.

The readout also states what it is: **a postdiction of the anchor, not a measurement of the
shell.** One rung is a factor φ² = 2.618 in capacity, which is exactly why the ladder
*locates* the sector and cannot sharpen it — the same conclusion the gate budget reached
from the other side, where the recursion gate measured ±31 σ wide.

Self-tests 642 → **645**; `docs/verify-quantity-bus.cjs` 18/18 → **21/21**; the 72-view S³
walk stays at 0 page errors and all seven worlds at 0 buffer growth.

## The recursion operator, and the no-go that comes with it (v3.69.0)

ℛ = Proj_Bradlow ∘ APS_η ∘ Hopf_red ∘ Fus_φ is offered in the manuscript as the operator
whose spectrum should select the closed shell N_φ = 292. It is implemented here as written.
**The headline result is a negative one, and it is the manuscript's own.**

### The operator is diagonal

The finite-cutoff matrix model carries *both* Kronecker deltas, so ℛ is diagonal in the
edge-character basis and its spectrum is simply its diagonal. No diagonalisation is
involved, and any claim that "the spectrum selects" is a claim about a product of four
scalars. The Bradlow factor is a **projector**, not a weight: it truncates the tower at
ℓ(ℓ+1) ≤ q and leaves everything below untouched.

### The no-go

With `E_Fus(N) = N ln φ`, `ρ_Hopf(N) ~ N²` and an O(1) APS correction, gap balance reads
`N ln φ − ln(N² + C_APS) = 0`, and its root is:

| C_APS | 0.5 | 1 | 2 | 5 | 10 |
|---|---|---|---|---|---|
| root N | 8.83 | **9.29** | 9.85 | 10.86 | 11.79 |

Near **nine**, not 292 — for every O(1) constant. And the size of the failure is worth
stating: to move that root to 292 the APS constant would have to be

```
C_APS = φ²⁹² − 292² ≈ 1.06e+61
```

which is not an O(1) correction to anything. It is the answer smuggled in as an input.

So **ℛ as written is a registry consistent with rung 292, not a selector that produces
it.** The manuscript says exactly this, in order to protect itself from a false easy proof.
An atlas that implemented ℛ and quietly displayed 292 would be doing the opposite of what
the paper asked for, so `edge.n_naive` reports the refuted root as a first-class output and
292 appears only as `n_shell`, labelled *quoted for comparison, not produced here*.

### The edge Hamiltonian's admissibility kernel

`β_q Ĥ_adm,q` is a sum of positive squares with every λ → ∞. That makes it a **projector,
not an energy**: a configuration is admissible exactly when every term vanishes. Four terms
are ordinary arithmetic and are checked, refusing term by term rather than returning a
number that is merely large:

```
k_CS = 799 != 2q = 800 · P_val(0.5) = -3.28125 != 0
```

### And the kernel is where two things the atlas already drew come from

This is the part worth having.

- The **Planck-cell term** `λ_P(τℓ_P² − π)²` forces `τ = π/ℓ_P²` — which *is* the
  Planck–Bradlow normalisation τ_P that makes the maximum vortex packing on the horizon
  equal the Bekenstein–Hawking capacity. The Capacity-flow laboratory has been drawing that
  identity since v3.63.0.
- The **valuation annihilator** `P_val(D̂) = 0`, `P_val(z) = (z−1)z(z+1)(z+2)(z+3)`, has
  roots {1, 0, −1, −2, −3} — which *is* the static valuation spectrum the same laboratory
  draws as the rungs of its w(a) chart, with `w_s = −1 − s/3`.

Two laboratories were drawing consequences of one kernel without either of them saying so.
The edge Hamiltonian is not a new picture bolted on; it is the common source.

A twelfth coupling became admissible the moment `edge` registered, and the self-test caught
it before it could go undeclared: `capacity.q → edge.q`. The Bradlow projector truncates
against the capacity sector, so the sector the selector chooses is the sector the operator
must be built over.

### Declared boundary

Not implemented, and **named rather than glossed**: the Harish–Chandra edge oscillator
character, the SO(4) edge volume, the primed determinants `det′|∇² + m²|` with their
tachyonic edge masses, and the Kronecker-limit functional `F_KL(E₂, η, η̄)`. Those are what
would turn ℛ from a registry into a selector, and none of them is arithmetic on numbers
this instrument holds. `Z_edge(q) = Z_grav·Z_DEM·Z_string·Z_val` is a declared
factorisation, never a computed number.

Self-tests 645 → **649**; `docs/verify-edge-operator.cjs` **12/12**; the 72-view S³ walk
stays at 0 page errors.

## The missing terms, and the one number that is left (v3.70.0)

The manuscript names two things that would turn ℛ from a registry into a selector: the
primed determinants `det′|∇²_{S²_Rq} + m_α²|` and the Kronecker-limit functional
`F_KL(E₂, η, η̄)`. Both are ordinary special functions. Both are now implemented exactly and
checked against closed forms:

```
η(i) = Γ(1/4)/(2π^{3/4}) = 0.768225422326      η(−1/τ) = √(−iτ) η(τ)
E₂(i) = 3/π    E₄(i) = 3Γ(1/4)⁸/(64π⁶)    E₆(i) = 0
ln det′(−Δ) on the unit S² = 1/2 − 4ζ_R′(−1) = 1.161684574802
```

Implementing them was never the hard part. What they *settle* is.

### One of the two cannot possibly matter

The naive closure failed **structurally, not numerically**: the fusion term `N ln φ` is
linear in N while the Hopf density `ln(N²)` is logarithmic, so no O(1) constant could ever
reach 292.

`F_KL` is built on `log(√y |η(τ)|²)` — an **SL₂(ℤ)-invariant**, bounded above by −0.5168 at
τ = i. Being an invariant it is a function on the fundamental domain: once τ is fixed it is
**one number**. It could depend on the rung only through a declared τ(N), and the manuscript
declares none. So it shifts the intercept exactly as `C_APS` does, and is structurally
incapable of moving the root from 9 to 292.

The determinant is a different kind of object. Under a Weyl rescaling `ln det′` picks up
`−2ζ(0) ln R`, and `ln R = N ln φ + ln ℓ_P` — so it contributes a term **linear in N**. That
is precisely the missing structure.

### The whole obstruction reduces to one number

With the determinant included, `N ln φ = ln(N² + C) + κN` with `κ = −2ζ_eff(0) ln φ`. The
root sits at 292 **iff**

```
ζ_eff(0) = −1/2 + ln(N² + C)/(2N ln φ) = −0.459600000
```

robust against the O(1) constant, because the intercept enters only logarithmically
(−0.4596000 for C = 0.5, 1, 2 and 10 alike).

The **leading term is exactly −1/2**, which says the edge determinant density must grow at
*exactly the golden rate* φ^N — the same rate as the Fibonacci fusion it balances. So 292 is
not fixed by two comparable terms: it is fixed by a **near-cancellation**, and the shell is
large precisely because the residual `ln φ − κ = 0.0389` is small.

| completion | κ | root |
|---|---|---|
| none (the naive closure) | 0 | **9.29** |
| one massless scalar, ζ(0) = −2/3 | 0.641616 | **none** — κ > ln φ, no positive root |
| the target | 0.442330 | **292.000000** |

The obvious completion fails by *overshooting*, which brackets the answer: neither nothing
nor one field, but **0.6894 of one massless scalar**.

### What this is, and what it is not

**It is not a proof that ℛ selects 292, and the atlas does not offer it as one.** The
manuscript never writes the closure these terms enter, so any equation whose root landed on
292 would be one chosen to land there — exactly the false easy proof the paper guards
against. `edge.n_naive` still reports the refuted 9.29; `n_with_determinant` reports what
the supplied ζ_eff(0) gives, whatever that is; 292 appears only as `n_shell`, quoted.

What *is* established is sharper than a fudge: which of the two named terms can matter, why
the other cannot, and the single number the survivor must supply. That is the same service
`Ξ_edge` and `b g_∂²` perform for the scheme gate — an unspecified missing term turned into
a falsifiable target.

What remains is now **named and small**: the edge species content `{σ_α, m_α}` of
`Z_grav^edge`, which fixes `ζ_eff(0) = Σ_α σ_α (a₁^{(α)} − n₀^{(α)})`. One heat-kernel sum
away from a decided answer.

Self-tests 649 → **655**; `docs/verify-edge-determinants.cjs` **16/16**; the 72-view S³ walk
stays at 0 page errors.

## The species content, supplied — and what it decides (v3.71.0)

The last named gap was the edge species content. It was supplied: one-loop linearised
gravity on S^{d+1} (d = 3, horizon S²) fixes a definite finite list of shift-symmetric
ghost-like fields,

```
Z_edge^det ~ det′|−∇₁² − 1|^{1/2} · det′|−∇₀² − 2| · det′(−∇₀²)^{1/2}

  one tachyonic vector  A_μ    −∇₁² − 1   σ = ½   shift level k = 0
  two tachyonic scalars φ^a    −∇₀² − 2   σ = 1   shift level k = 1
  one massless scalar   χ      −∇₀²       σ = ½   shift level k = 0
```

Seeley–DeWitt on the unit S² (R = 2, Area = 4π) gives `a₁ = r/3 − tr E` and
`ζ(0) = a₁ − n₀`. Nothing is fitted; every number follows from the spectrum and the kernel.

| species | a₁ | n₀ | ζ(0) |
|---|---|---|---|
| χ, massless scalar | 1/3 | 1 | **−2/3** |
| φ^a, tachyonic scalar | 7/3 | 3 | **−2/3** |
| A_μ, tachyonic vector (full l = 1 kernel) | 8/3 | 6 | **−10/3** |
| A_μ, with Killing vectors alone | 8/3 | 3 | **−1/3** |

The tachyonic scalar lands on −2/3 exactly like the massless one: its a₁ rises by 2 and its
kernel rises from 1 to 3, and the two changes cancel.

### The answer is that it overshoots

```
ζ_eff(0) = ½(−10/3) + 1(−2/3) + ½(−2/3) = −8/3      κ = 2.566463
with Killing vectors alone                 = −7/6      κ = 1.122828
target                                     = −0.4596   κ = 0.442330
```

Against `ln φ = 0.481212`, both readings give `ln φ − κ < 0`: **no positive root at all** —
the same failure mode as a single massless scalar, two to five times worse. The instrument
returns `null`, because there is no root to report.

### And the mismatch is structural, not numerical

This is what settles it. Every ζ(0) here is **rational** — `a₁ = r/3 − tr E` with rational
E, n₀ an integer, σ rational — so `ζ_eff(0)` is rational for *any* finite species list of
this kind. The target is

```
ζ_eff(0) = −1/2 + ln(N² + C)/(2N ln φ) = −1/2 + 0.040400000
```

a ratio of logarithms of algebraically independent numbers. **A rational cannot equal it.**
No species list can put the root exactly at 292 in this closure — not this one, and not a
better one.

### So one of three things is true

The atlas states all three rather than choosing:

1. the closure is not this reconstruction — and the manuscript never writes one;
2. the determinant is not the term that fixes the shell;
3. **292 does not come from a gap balance at all.**

The third is the reading this atlas already reached from the opposite end. The gate-budget
measurement, made months of work earlier and by an entirely unrelated route, found the
recursion gate **±31 σ wide** and the scheme gate **±8×10⁻⁶ σ**: a *locator* and a
*predictor*. The recursion gate names the rung; it was never the thing that determines the
value.

This is the microscopic version of that conclusion, and the two arrived independently. ℛ
remains a registry, and the atlas has now said so twice.

Self-tests 655 → **659**; `docs/verify-edge-determinants.cjs` 16/16 → **21/21**; the
72-view S³ walk stays at 0 page errors.

## One determination, not three (v3.72.0)

The third possibility was that 292 comes from the scheme gate. It was worth testing, and the
test is decidable in exact arithmetic rather than by argument.

### The scheme gate is q★ written backwards

Invert it. If the gate were an independent determination, `b g_∂²` would be a number the
edge algebra produces and the agreement with q₀ would be the result. Computed at 50 digits:

```
16π²/(ln q₀ − ln Ξ) = 0.5597545859987624454713
quoted b g_∂²       = 0.5597545859987624455
relative difference   5.1e-20      ← the rounding of the last quoted digit
```

**All nineteen quoted digits.** The gate does not derive the shell; it encodes it.

And that is exactly why it looked like the sharpest gate. The gate budget measured its width
at ±8×10⁻⁶ σ against the recursion gate's ±31 σ, and this atlas called it *the prediction*.
The widths are right. **The conclusion was half right**: the scheme gate is sharp because it
is a transcription of q₀ to nineteen digits, so its sharpness is **inherited**. It is the
precision of a copy, not of a measurement.

What survives unchanged: `Λ(q₀)` sits at **−0.90 σ** from the measured sky. That agreement is
a property of q₀ itself. But it is **one agreement, not three**.

### A calibrated search, everywhere

Two stories fit the identity above — the gate is a restatement, or the edge algebra genuinely
produces the number. They differ on whether `b g_∂²` has a closed form of its own. So: a
declared, enumerated space of closed forms, with the expected number of accidental hits
reported beside every result.

| target | quoted digits | hits | expected by chance |
|---|---|---|---|
| `b g_∂²` | 19 | **0** | 3.8×10⁻¹¹ |
| `Ξ_edge` | 8 | **0** | 3.8×10⁻³ |
| `1 − Ξ_edge` | — | **0** | 3.8×10⁻¹ |
| `u★ = ln q₀` | 16 | **0** | 3.8×10⁻¹⁰ |

188,758 candidates each, built from eleven constants and thirty integers. The search had the
power to find a form and found none. *A null result from a calibrated search is evidence, not
proof* — a closed form outside the declared space would be missed, and the space is written
down so it can be enlarged.

### What is primitive

The gate factor `1 + π/50` reads as `1 + π/(2 d_val²)` with `d_val = 5`, the degree of the
valuation annihilator `P_val = (z−1)z(z+1)(z+2)(z+3)` — consistent with the manuscript calling
q₀ the *valuation-compressed* saddle. Stated as a reading, not a derivation: 50 has other
arithmetic parents, and only the paper can say which it meant.

Strip the restatements and what remains is

```
q₀ = π φ^{2N} / (1 + π/(2 d_val²)),    d_val = 5 (derived),    N = 292 (not derived)
```

**One free integer.** Gate A is a registry that cannot select it — measured twice, once by the
naive closure rooting at 9 and once by the literature species content overshooting into no
root at all. Gate B is that integer written backwards. Gate C moves u by 10⁻¹²³.

A near-miss, refused rather than reported: `3π⁴ = 292.2273` sits within 0.08% of 292. An
integer shell is an integer, and a search of this size manufactures coincidences of that
quality routinely.

### The correction

This atlas has been calling the scheme gate "the prediction" since v3.58. That claim is now
amended in the Capacity-selector panel, in its self-test, and here. The widths it measured
were right; what it did not ask was whether the three determinations are independent. They
are not.

Self-tests 659 → **663**; `docs/verify-gate-independence.cjs` **9/9**; the 72-view S³ walk
stays at 0 page errors.

## A control row is one line, and the navigator is not on the panel (v3.73.0)

Four defects, reported from a phone and a tablet, all measured before being touched.

### The navigator was drawn across the panel it navigates

In landscape the 4D locator sat on the Controls sheet with a **27,440 px² overlap**. The
cause was mine: the v3.62 phone rule pinned the widget with `top`/`right`/`!important`,
which **disabled the obstacle-avoiding placement engine entirely**. The engine had a full
obstacle list and no say.

The pin is gone. And the engine was taught the one candidate a phone actually has — the
band **above** the bottom sheet, which the sheet already publishes every tick as
`--ctl-top`. Without those candidates "least overlap" still meant "on top of Controls",
because every corner a phone owns was already occupied.

```
landscape  locator ∩ Controls   27,440 px²  →  0
```

### A control row was four lines

On a 390-px phone the row `χ (geodesic radius)` was **201 px tall inside a 270-px sheet** —
74% of the panel for one parameter. The label, the slider, the readout, a 74-px numeric
wrapper and a 312-px row of snap buttons each claimed a 44-pt line of its own.

The touch targets stay; the stacking goes. The numeric field joins the first line and the
snap buttons become one thin swipeable strip.

| row | before | after |
|---|---|---|
| `χ (geodesic radius)` | 201 px | **114 px** |
| `Speed, Gyr/s` | 96 px | **44 px** |

### And the last mode chip no longer reads as broken

`φ FBS3R` sat half off the right edge. The row is a swipe strip, so it now carries
`scroll-snap-type: x proximity` with end padding and per-chip snap alignment — a chip
lands whole or not at all.

Self-tests 663 → **665**, both new ones measuring the rendered geometry rather than the
rule that produces it; the 72-view S³ walk stays at 0 page errors.

**Still open, and named rather than implied:** the freshness banner still overlaps the
locator by ~3,600 px² in portrait (it is a transient dev-build notice), and the χ row's two
`→ horizon` / `→ equator` action buttons still take a line of their own.

## The panels had no door on a phone (v3.74.0)

Reported: the row with View, Motion, Shot, Navigator, Capacity flow, Zero-point, Bianchi IX
is simply absent on mobile. It was.

```
390x844   panel buttons reachable:  0
```

`#panelDock` is desktop-only and **nothing replaced it**, so a whole tier of the atlas —
Navigator, Capacity selector, Capacity flow, Zero-point, Bianchi IX, Smith–Möbius, Objects,
QA Atlas, Oscillators, XR, Sensors, Vectors — existed with no way in.

The cure is the one `chromeBuild` already uses for everything else: **move the nodes**. The
buttons keep their handlers, their titles and their live labels, and they live wherever they
can actually be pressed — the dock when the dock is on screen, the More menu when it is not.
Evaluated on the publish tick, so rotating the device moves them back.

```
390x844   panel buttons in More:  15
```

And with them in, the menu grew to **1483 px inside an 844-px viewport** and ran off the
bottom with no way to reach the last entries. A menu taller than the screen scrolls inside
itself: 1483 → 654, fits.

### Two panels were pushing each other

Also reported: animating a parameter made *both* open instruments jump. That was mine, from
v3.65. `--ctl-top` — the band a bottom sheet occupies, which every other surface anchors to
— was published as the **maximum over `#ctl` and all five instrument sheets**. With two
instruments open, each was anchored to a band the other was changing, four times a second.
Two authorities for one band, again.

On a phone exactly one panel is the bottom sheet. The band is now published from the
**active** panel only.

Self-tests **665/665**; the 72-view S³ walk stays at 0 page errors.

**Verified visually**, and stated plainly: the panel list is confirmed by screenshot. The
jump itself I fixed at its cause and have *not* yet watched with an oscillator running —
that check is owed.

## A synchronous write, four times a second (v3.75.0)

Reported: the whole application became heavy, and it sometimes came up as a white screen.
Both trace to one line I added in v3.67.

The configuration harvest runs on the publish tick — four times a second — and it ended with
an unconditional `hccConfigSave()`. That serialises the entire configuration map, **336
parameters across 78 laboratories**, into `localStorage` on every tick: a synchronous
main-thread write of a growing JSON blob at 4 Hz. That is exactly the shape of a fault that
makes an interface feel heavy everywhere and can stall a first paint on a phone.

The schema only changes when a control is added, removed or moved. **Values** change
constantly and are not what the registry is for — so the signature now ignores values, and
the write happens on a real change or not at all.

### The panels no longer push each other

Measured with an oscillator actually running, 24 samples over 3.4 s on a 390-px phone:

```
zpPanel   top 304..304 (Δ0)   height 422..422 (Δ0)
--ctl-top  1 distinct value over 24 samples
```

The band-coupling fix from v3.74 holds under animation: no movement at all. That check was
owed and is now done.

### Three self-tests were measuring things that were not on screen

They passed on a desktop and failed on a phone, which is the signature of a test asserting
through an absent object rather than of a broken feature:

- the trackball checks ran against a locator whose rect is 0×0 when the navigator has not
  been opted into, so every pointer mapped to the same garbage point (residual 3×10⁻⁸
  instead of 10⁻¹², roll 90.359° instead of 90.000°);
- the Inspector-tab check hit-tested a strip that is `display:none` at that width, so
  `elementFromPoint` landed on whatever was behind it and returned 0/4.

All three now **declare the skip** rather than asserting through it, and say so in their
detail line. A measurement of nothing reported as a failure is as misleading as one reported
as a pass.

Self-tests **665/665** on both a 1280×800 desktop and a 390×844 phone; the 72-view S³ walk
stays at 0 page errors.

## Fibonacci anyons — and Fus_φ is them (v3.76.0)

The recursion operator is `ℛ = Proj_Bradlow ∘ APS_η ∘ Hopf_red ∘ Fus_φ`, and its fusion term
is `E_Fus(N) = N ln φ`. That is not a golden-ratio flourish.

### φ is not a choice

The Fibonacci anyon τ obeys **τ × τ = 1 + τ**. That forces `d² = 1 + d`, whose only positive
root is φ. The golden ratio is the *only* quantum dimension a particle with this fusion rule
can have — and the total quantum dimension is `D = √(1+φ²) = √(2+φ) = 1.902113032590`, whose
logarithm is the topological entanglement entropy of a Fibonacci liquid.

### And the fusion space is literally Fibonacci

Count fusion trees of n τ's: `a_{n+1} = a_n + b_n`, `b_{n+1} = a_n`, straight out of the
fusion rule and nothing else.

```
n = 12:  144 / 89  =  F₁₂ / F₁₁      total 233 = F₁₃
log(dim₁₂/dim₁₁) = 0.481225      ln φ = 0.481212
```

So `log dim → n ln φ` — **exactly the manuscript's E_Fus(N)**. And since `q(N) = πφ^{2N}`,
the boundary sector at rung 292 carries the fusion space of **584 τ particles**, up to the π.
The golden ladder this atlas runs on and the Fibonacci anyon are the same φ, and that is now
a computation rather than a resemblance.

### The category, checked against itself

| check | result |
|---|---|
| `F² = I`, unitary, symmetric | holds — it *is* `1 + φ = φ²` |
| F forced | `M = [[a,x],[x,−a]]` has `M² = (a²+x²)I` identically, so `M²=I` ⟺ `a²+x²=1`; `a = 1/φ` leaves `\|x\| = φ^{−1/2}` and nothing else |
| Yang–Baxter `σ₁σ₂σ₁ = σ₂σ₁σ₂` | residual 1.6×10⁻¹⁶, recomputed every evaluation |
| braid image dense in SU(2) | closest approach 1.6×10⁻³ over 60 000 words — a witness, not a Solovay–Kitaev compilation |
| **(ST)³ = e^{2πic/8}S², c = 14/5** | holds — and c appears *only* on the right-hand side |

That last one closes the whole data set at once: a wrong topological spin, a wrong D or a
wrong phase anywhere in R fails it.

### The ribbon relation caught a real error

The first version paired `R_τ = e^{+3πi/5}` with `θ_τ = e^{+4πi/5}`. **Yang–Baxter passed and
(ST)³ passed** — because each set is internally consistent, and only the relation *between*
them fixes the handedness. `(R^ττ_τ)² = θ_τ` is the check that caught it. One theory, one
chirality.

A second error, in the check rather than the physics: F's uniqueness was first "shown" by
sweeping 40 001 grid candidates, which found none — because the exact root φ^{−1/2} does not
land on a grid of 1/20000 and the tolerance was tighter than the spacing. **A search that
could not have succeeded, reported as a failure of the mathematics.** Sampling was the wrong
instrument; the replacement is two lines of algebra.

### What this is not

The Fibonacci **category** is verified. It is *not* a claim that the manuscript's boundary
sector **is** a Fibonacci anyon liquid — that would need the edge algebra to produce the
category, which is precisely the gap the edge-determinant work left open. A shared φ is a
strong hint and not an identification, and the atlas keeps the two statements apart.

Self-tests 665 → **670**; `docs/verify-fibonacci-anyons.cjs` **14/14**; the 72-view S³ walk
stays at 0 page errors and the phone boots clean.

## The braiding laboratory (v3.77.0)

The **73rd** laboratory: three Fibonacci τ particles, their worldlines running up the page
in time, and a braid you weave by hand.

### Why worldlines and not particles moving

In two dimensions an exchange is not a permutation — it is an element of the **braid group**,
and which way they went round each other matters. A picture of dots swapping cannot say
that; a picture of strands in spacetime can, and the over/under crossing is the whole
content. So time is the vertical axis and the braid is the object.

### The state is not a decoration on the picture

The buttons are the generators. `σ₁`, `σ₂`, `σ₁⁻¹`, `σ₂⁻¹`, undo, clear — and the numbers
underneath are the matrix that word computes acting on the fusion state, from the
representation verified in `verify-fibonacci-anyons.cjs`.

Weave `σ₁σ₂σ₁` and the outcome probabilities come out

```
1 : 38.196601 %        τ : 61.803399 %        norm 1.000000000000
```

which are **1/φ² and 1/φ**. The golden ratio arrives as a *measurement outcome*, not as a
constant anyone typed in.

And `σ₂σ₁σ₂` gives the same state to 10⁻¹⁶ — **Yang–Baxter is something you can weave.** Both
are offered as presets precisely so the relation is checked by hand rather than believed.

### Six registries said no

The atlas's own completeness invariants refused the new laboratory until it was declared in
every place a laboratory has to exist: `S3_VIEW_NAMES`, the prediction-contract class and
target, the premium visual domains, the browser's domain registry, and the Invariant Nexus —
where an isolated node is itself a failure, so the anyon station arrives with five typed
relations (`τ×τ = 1+τ ↔ d = φ` to the mode ladder, `braid → SU(2)` to the spinor lab,
topological spin ↔ Berry phase, braid ↔ linking, and a contrast edge to Bell).

That is the registries working exactly as intended: a laboratory that cannot be found,
classified, coloured or related is not finished.

### Two faults worth recording

**The buttons were wired inside the FBS3R branch.** They existed in the markup and did
nothing — the panel showed the controls, the word stayed `∅` and the scene stayed dark. A
control wired in one mode's branch is a control every other mode silently loses. One
delegated listener, bound lazily on entry, cannot be forgotten by a branch that does not
know about it.

**And it was bound at module scope, where `ctl` is still in its temporal dead zone** — the
third time this session that a `try{}catch{}` swallowed a TDZ error and left a feature
silently absent.

Self-tests 670 → **673**; the S³ walk now covers 73 laboratories with 0 page errors.

## The opening frame was never tone-mapped (v3.78.0)

Reported: a white screen at startup — *"light and nothing"* — with the scene appearing only
after switching modes.

The first two hypotheses were wrong and the measurements said so. Draw calls at boot were
**1400 in two seconds**, healthy, so the scene was not blank; and booting with a restored
hash rendered normally too, so the route was not the cause.

What was actually wrong is one line of state:

```
boot, premium visuals ON:   body.dataset.premiumDomain = UNSET
after one mode switch:      body.dataset.premiumDomain = "thermo"
```

`premiumApplyProfile()` is called from `setMode` and from `setS3View`. **At boot neither of
them runs for the world the state already claims** — `hccGo` skips `setMode` when the world
it is asked for is the one `state.mode` already holds, which at boot is always true. So the
palette, the tone mapping and the exposure were never applied to the opening frame.

The scene drew the whole time. It drew **untone-mapped**, which on a real GPU is a white
screen — and switching modes "fixed" it because that is what finally ran the profile.

The fix is the pattern this file already uses for the opening state: state it last, after
every other path has had its say. `premiumDomain` is now `"gold"` at boot instead of unset.

This only bites a reader who has premium visuals stored **on**, which is why it never
appeared in a fresh-profile test — and why it appeared immediately for someone who had
turned them on and come back.

Self-tests 673 → **674**; the 73-laboratory S³ walk stays at 0 page errors.

## Forty Lagrange stations, solved (v3.79.0)

Five points for each of eight planets, each one selectable and flyable, each riding its own
pair's instantaneous orbital plane.

### Solved, not approximated

The collinear points are roots of

```
f(x) = x − (1−μ)(x+μ)/|x+μ|³ − μ(x−1+μ)/|x−1+μ|³ = 0
```

found by **bracketed bisection**, which cannot diverge and cannot return a point that is not
a root — Newton on a quintic very much can. The equilateral points need no solving at all:
`x = ½ − μ, y = ±√3/2` exactly, for every mass ratio, with `∇Ω` vanishing there identically
(checked over seven mass ratios from 10⁻⁷ to ½).

**The atlas was previously drawing the approximation.** Its Sun–Earth display used
`1 ∓ ∛(μ/3)` — the first term of a series. That misses L1 by **5006 km** and L2 by
**4975 km in opposite directions**, so it also erased the fact that they are not equidistant
from Earth:

```
L1 = 1.4916 million km        L2 = 1.5015 million km
L2 − L1 = 9981 km  =  (2/3)a(μ/3)^{2/3}
Hill radius = 1.4966 million km — one number, offered for both
```

A picture that places them symmetrically is drawing a different solar system. Both the old
display and the new stations now use the exact roots.

**And my own recalled number was wrong too.** The first version of the verifier asserted
L1 = 1.4811×10⁶ km "from the mission literature" and failed — the solver said 1.4916 and
satisfied f(x) = 0 to 2×10⁻¹⁵. The solver was right. The check is now the *next order of the
same expansion*, an independent derivation rather than a memory, and the two agree to
**1.1 km**.

### What selecting one draws

The zero-velocity curve of that point's own Jacobi constant `C = 2Ω`, where
`Ω = ½(x²+y²) + (1−μ)/r₁ + μ/r₂` in the rotating frame — computed by marching squares on a
190² grid — plus the field of the **analytic** ∇Ω around it. Those are the force lines: a
particle with that C can never cross its own curve, so the curve is a wall and not a
decoration. They clear when anything else is selected.

The curves open in a fixed order as C falls — `C(L1) > C(L2) > C(L3) > C(L4)` — which is the
whole story of which transfers are energetically possible.

### Stability is stated per pair

L4 and L5 are linearly stable only for `μ < μ_Routh = 0.0385208965`, the root of
`μ(1−μ) = 1/27` — which is why Jupiter keeps Trojan asteroids at its equilateral points. The
collinear points are unstable for **every** mass ratio, which is why a spacecraft at L1 or L2
is on a station-keeping budget and not parked. Every point says which it is.

The barycentre offset is kept rather than dropped for being small: `world = a((x+μ)û + y v̂)`
puts the Sun at the origin and the planet exactly at P, and for Jupiter that μ shift is
0.005 AU.

### A fourth silent guard

The build hook was placed beside `solarGroup.visible` in a function that never fires for the
opening world. `try{}catch{}` reported nothing because **nothing threw** — the call simply
never happened, and 40 registered stations sat at the origin. It now builds where the work
already is, in the frame loop. That is the fourth time this session a silent guard hid an
ordering fault rather than an error.

Self-tests 674 → **679**; `docs/verify-lagrange-points.cjs` **11/11**; the 73-laboratory walk
stays at 0 page errors.

## The S-matrix is the Hopf link invariant (v3.80.0)

The anyon laboratory gains the structures the τ particle actually forms — and one of them
is the object this atlas has been drawing since its first version.

### The fusion matrix is the Fibonacci matrix

In the basis (1, τ) the fusion rule is a 2×2 integer matrix:

```
N_τ = [[0,1],[1,1]]        N_τ¹⁰ = [[34,55],[55,89]] = [[F₉,F₁₀],[F₁₀,F₁₁]]
```

Its Perron–Frobenius eigenvalue is the quantum dimension **φ**, and its powers are literally
the Fibonacci numbers. Nothing separate is assumed anywhere along that chain: the fusion
rule gives the matrix, the matrix gives φ, and φ is the ladder the whole atlas runs on.

### S is not an independent input

The **monodromy formula** `S_ab = (1/D) Σ_c N^c_ab θ_c d_c /(θ_a θ_b)` rebuilds the entire
S-matrix from the fusion rule, the quantum dimensions and the topological spins — agreeing
to 10⁻¹⁵. And the **Verlinde formula** `N^c_ab = Σ_x S_ax S_bx S*_cx / S_0x` runs the same
loop backwards, returning `τ × τ = 1 + τ` from S alone. Fusion and braiding are two readings
of one object.

### And then the Hopf link

The invariant of a Hopf link whose two components carry labels a and b is `S_ab/S_00`:

```
⟨Hopf(τ,τ)⟩ = −1.000000000000
⟨Hopf(1,τ)⟩ = +1.618033988750  = d_τ      ← one strand the vacuum leaves a single unknot
⟨Hopf(1,1)⟩ = +1.000000000000             ← the empty link
```

That middle line is what makes the identification more than two numbers agreeing: when one
component carries the vacuum the link *degenerates*, and the invariant has to become the
quantum dimension of the survivor. It does.

**So the two linked fibres this atlas draws in every Hopf view are exactly the link whose
Fibonacci-labelled invariant is −1.** The laboratory now draws it that way — a `Hopf link`
chip beside the braid, built from the atlas's own `hopfFibre`/`hopfProject` over antipodal
base points, not from two circles arranged to look linked. The linking number is verified
geometrically by a Gauss integral in `verify-hopfion-locator.cjs` and categorically here:
one object, measured two ways, in two laboratories that now say so to each other.

### A fifth silent guard

`FIB_S` was declared as a module-level `const` reading `fibC` and `FIB_D`, which live nine
thousand lines further down with the anyon instrument. The temporal dead zone took the whole
module with it — `FBS3R_QA` undefined, every self-test unreachable. Fifth time this session,
and the cure is the same every time: **ask for the value when it is needed**, not when the
file is parsed.

Self-tests 679 → **682**; `docs/verify-fibonacci-anyons.cjs` 14/14 → **19/19**; the
73-laboratory walk stays at 0 page errors.

## The fusion tree and the golden chain (v3.81.0)

Two structures the braid instrument alone cannot show: the Hilbert space of Fibonacci
anyons, and what happens when they interact. `docs/verify-fibonacci-chain.cjs` — **15/15**.

### The Hilbert space is a Zeckendorf condition

Fuse *n* τ one at a time and record the running total charge x₁ … x_n. The fusion rule says
1 × τ = τ, with **nothing else on the right**, and τ × τ = 1 + τ. So from the vacuum you may
only step to τ; from τ you may step to either. The admissible label strings are exactly the
binary strings with **no two adjacent vacua**, and there are F_{n+1} of them — enumerated,
not asserted: 610 for *n* = 14, splitting as 377 of total charge τ plus 233 of charge 1,
with zero strings violating the condition across the whole set.

The laboratory draws **every basis vector at once**. Each path is splayed about the
fusion-order axis by an angle that indexes it, so a vacuum label sits *on* the axis and a τ
label lifts off it in a direction unique to that basis vector. Adding one anyon visibly
thickens the solid by φ. The first version stacked the basis in *z* under a camera looking
straight down *z*, and eighty-nine distinct paths projected onto four horizontal streaks — a
three-dimensional object drawn so that none of its three dimensions read.

A step you cannot take says so before you press it, rather than doing nothing.

### e_∞ = 2φ − 4, exactly

H = −Σᵢ Pᵢ, with Pᵢ the projector of the neighbouring pair onto the vacuum channel: the
anyonic antiferromagnet, with the F-matrix where the Clebsch–Gordan coefficients would be.
All three blocks are forced by the tree — outer labels (1,1) give P = 1, (1,τ) or (τ,1) give
P = 0, and (τ,τ) gives |v⟩⟨v| with v the vacuum column of F. P² = P because 1/φ² + 1/φ = 1.
**No free parameter anywhere.**

Diagonalised by Lanczos with full reorthogonalisation out to N = 20 (15,127 states), the
three-point finite-size fit of E₀/N converges onto

> **e_∞ = 2φ − 4 = −2/φ² = −0.763932022500**

to 6e−9, without ever being told about it. In the Temperley–Lieb normalisation e_i = φPᵢ it
reads e_∞ = 2 − 2φ = −2/φ. That is derived here.

### The velocity cancels

A finite ring measures two products, c·v = 1.271446 and x·v = 0.136230, and cannot separate
either from the sound velocity. Their **ratio is velocity-free**, and it is what gets
compared:

> measured c/x → **9.333175** · (7/10)/(3/40) = 28/3 = **9.333333** · 0.002%

And with the Bethe-ansatz velocity supplied from outside — v = π sin γ/(γφ) at γ = π/5, the
φ undoing the e_i = φPᵢ normalisation — the measured c·v becomes a central charge:
**c = 0.699998** against 7/10. Nothing was fitted: c·v came from the energies, v from the
integrable structure, and they met.

**What is quoted and what is derived, kept apart.** Derived here: e_∞ = 2φ − 4, c·v, x·v and
their ratio. Quoted from the literature (Feiguin et al., PRL 98, 160409): that the chain
flows to the tricritical Ising model, that its lowest lattice excitation is the h = 3/80
field, and the velocity formula. Any claim of "c = 0.70" from the lattice data alone has
silently chosen a velocity, and the atlas says which one it borrowed.

### A negative central charge, and why

The first fit produced c·v = −7.31. **Odd rings are frustrated** — an antiferromagnet on an
odd cycle cannot satisfy every bond — so E₀/N alternates strongly with parity, and a
two-point fit across N = 9 and N = 10 mixes two different sequences. Odd-N gaps are an order
of magnitude larger than even-N gaps at the same size, 0.77 against 0.11. The laboratory now
offers only even rings and says why.

A second scratch error is worth the same note: the entropy per anyon is the **increment**
ln[dim(n+1)/dim(n)] → ln φ, not ln dim(n)/n, which still carries a −ln√5/n tail of 0.058 at
n = 14 and reads as the failure of a true statement.

The ring is diagonalised **in the browser**, and two independent routes through the same
state are checked against each other: −Σᵢ⟨Pᵢ⟩ computed from the ground vector against E₀
computed from the tridiagonal, agreeing to 1e−12, with the bond values equal to 4e−15 —
translation invariance measured rather than assumed.

Self-tests 682 → **688**; tree and chain rebuilds leak neither GL buffers nor label DOM
(0 growth over 30 and 20 rebuilds, 0 over 48 station swaps); the laboratory walk stays at
0 page errors.

## Momentum and the topological sector (v3.82.0)

`docs/verify-fibonacci-momentum.cjs` — **9/9**. This section **amends the previous one**.

### A published claim that needed amending

v3.81.0 said a finite ring cannot separate c from the sound velocity, so the velocity had to
be borrowed from the Bethe ansatz. That is true of an **unresolved** spectrum, and it stops
being true the moment two exact quantum numbers stop being thrown away.

### The loop operator is found, not quoted

Translation gives the momentum k = 2πm/N. The **topological** symmetry Y is the Wilson loop
of a τ carried around the ring behind the anyons; it commutes with every Pᵢ because it can
be slid off them. Y is a product of one F-symbol per site — and which contraction of the
symbol's six slots it is, I did not trust myself to recall. So the whole declared family was
enumerated (two of six slots carry the loop's τ, the other four take x_i, x_{i+1}, x′_i,
x′_{i+1} — 15 × 24 = 360) and filtered by

> Y² = 1 + Y   ·   [Y, H] = 0   ·   [Y, T] = 0

Sixteen survive, in two slot patterns, **and all sixteen are the same matrix to 5.6e−17** —
the tetrahedral symmetries of the 6j symbol. A search that returns one answer sixteen ways
has not got lucky; it has run out of alternatives. The canonical form is

> Y_{x′x} = ∏ᵢ (F^{τ xᵢ τ}_{x′ᵢ₊₁})_{xᵢ₊₁ x′ᵢ}

Y² = 1 + Y is the fusion rule τ × τ = 1 + τ satisfied by the **operator**: a Wilson loop
obeys the algebra of the label it carries.

### The Lucas number was never one number

Y has exactly two eigenvalues, **φ and −1/φ**. Those are S_{1τ}/S_{11} and S_{ττ}/S_{τ1} —
**the Hopf link invariants this laboratory already draws two stations away**. The topological
sector of a golden chain is read off by the very S-matrix that evaluates the link of two Hopf
fibres. And the eigenspaces have Fibonacci dimension:

> dim = F_{N−1} ⊕ F_{N+1} = L_N     (N = 12: 89 ⊕ 233 = 322)

so the Lucas number the ring had been reporting since v3.81.0 was a sum with a physical
meaning for each term. The census now comes from a **trace**, not a diagonalisation: two
exact equations, d₁ + d_τ = D and φd₁ − d_τ/φ = tr Y, determine both. The first version ran a
full D×D Jacobi and spent a second of a reader's time computing what algebra already knew.

The ground state sits at **momentum 0 in the vacuum-flux sector**; the first excitation sits
at **momentum π in the τ-flux sector**. The gap the chain has been reporting is the lowest
state of a *different topological sector*, reached by threading a τ flux through the ring —
and nothing in an unresolved spectrum could have said so.

### The velocity, measured

In **any** conformal field theory the stress tensor sits at scaling dimension exactly x = 2
with spin ±2 in the identity module. That is what "conformal" means, not what "tricritical
Ising" means. Find the lowest spin ±2 state in the ground state's topological sector, set
x = 2, and

> v = 1.816494   ·   Bethe ansatz π sin γ/(γφ) = 1.816356   ·   0.008%

The integrable result is now a **check**, not an input. And then

> **c = 0.699945** against 7/10   ·   **x = 0.074996** against 3/40

both from the lattice. A ratio that never needed a velocity at all confirms it independently:
x(ε)/x(σ′) → 2.667316 against (1/5)/(3/40) = 8/3 = 2.666667.

**What is still assumed, stated plainly:** that the theory is conformal, so a stress tensor
exists at x = 2 with spin ±2; and that no other primary puts a spin ±2 state below it —
checked after the fact by the three numbers landing on 7/10, 3/40 and 8/3. **No longer
assumed:** the central charge, the field content, the velocity.

### The Brillouin cylinder

Momentum on a ring lives on a **circle**, so the spectrum is drawn on a cylinder rather than
flattened onto a line: angle is k, height is energy, colour is the flux — gold for Y = φ,
violet for Y = −1/φ. The ground state and the stress tensor are marked, because the second
one *is* the velocity. A sector filter dims either flux. The first version left the cylinder
untipped under a camera near its equator, and the momentum circle projected to a line.

Self-tests 688 → **692**; the ring is diagonalised in the browser, momentum sector by
momentum sector, in about a second at N = 12 and cached; 0 GL-buffer and 0 label-DOM growth
over 24 sector toggles and 30 station swaps.

## One way in, and a core that does not need a GPU (v3.83.0)

An external audit and a reader arrived at the same place from opposite directions. The
reader could not find the Fibonacci anyon laboratory. The audit could not get an answer out
of the atlas at all. Both were right, and neither cause was where it looked.

### The renderer was an ancestor of every computational result

`index.html` is one module script, and line 7882 read

```js
const renderer = new THREE.WebGLRenderer({ … });   // unguarded
```

On a machine without a GPU three.js throws `Error creating WebGL context`, **execution of
the module stops at that line**, and everything declared after it never comes into
existence: `HCC_API`, `HCC_NAV`, `FBS3R_QA`, every registry, every panel. Reproduced here
by blocking `getContext('webgl')`: `HCC_API` undefined, no canvas, empty inspector. That
made the atlas a WebGL visualisation with a computational API bolted on late, when it is
meant to be a computational instrument with an optional view.

The renderer is now a **capability**. If the GPU is missing, or the reader asks for
`?render=0`, a headless stand-in takes over: a real `<canvas>`, the same method surface
across all 59 XR call sites and the 26 others, every draw a no-op, and `setAnimationLoop`
still driving `requestAnimationFrame` so the simulation clock keeps running. The scene
graph is pure JavaScript; only the upload to the GPU is skipped.

> Measured, with WebGL blocked: `ready()` resolves, `health().core = "ready"`,
> 73 laboratories, 9 instruments, `evaluate('anyon', …)` returns φ = 1.618033988749895,
> 0 page errors.

**The invariant:** no renderer, no DOM, no XR and no CDN may be an ancestor of a
computational result in the dependency graph. They may only consume a working core.

### `ready()` was a promise, not a measurement

It read `Promise.resolve(this)` — resolving before anything had been checked, so an agent
that awaited it learned nothing. It now waits for the registries to exist and **rejects
with code `TIMEOUT`** rather than lying. `health()` and `capabilities()` report what this
machine can actually do, and `document.documentElement.dataset.hccCore` becomes `ready`.

`list()` returned nine entries and looked like the catalogue of the atlas; it was the
catalogue of the typed specs. There are now two catalogues named for what they are —
`instruments.list()` (9) and `labs.list()` (73) — and every laboratory declares a
capability class *derived* from what the atlas knows: `computational` (typed instrument),
`parametric` (declared controls on the configuration surface), `unclassified`. The third
class is not called "visual", because a live session cannot tell "has no controls" from
"nobody has opened it yet", and `kindBasis` says which it is.

### api/manifest.json is measured, not written

`scripts/build-manifest.mjs` boots the real page with `?render=0`, walks **every one of the
73 laboratories**, harvests the controls each declares, and writes the manifest. It is
therefore also a test of the headless path: if the core cannot come up without a renderer,
the manifest cannot be produced. First run reported 69 laboratories as `visual`; that was
wrong — it read the configuration cache before asking for the harvest. Corrected:

> 73 laboratories · 4 computational · 69 parametric · 0 visual · 9 instruments ·
> **0 page errors while walking all 73 headless**

`scripts/validate.mjs` now fails the build if the manifest's version, build or counts drift
from the document.

### The laboratory was registered in six places and still unreachable

The Fibonacci anyon laboratory was in `S3_VIEW_NAMES`, `LAB_REGISTRY`, the prediction
contract, the premium domains, the browser domains and the Nexus — and a reader still could
not find it. The cause was not the laboratory. `renderAtlasNav()` gated its **entire
catalogue** — the search field, the category chips, all 73 cards — on

```js
const inS3 = HCC_CTX.worldId === 's3';
```

From Solar, from Cycles, from anywhere else, the Atlas answered with a sentence saying the
laboratories live elsewhere and offered no way to reach one. The gate bought nothing:
choosing a card has always called `hccGo`, which resolves the world and crosses for you.

> Measured from Solar: 73 cards, 10 category chips, a search field; typing "fibonacci"
> returns exactly one hit; clicking it lands on `#/world/s3/lab/anyon`.

### A Nexus node is a door

Every node of the Invariant Nexus **is** a laboratory — that is what the relation universe
is a map of — and double-clicking one only flew the camera to it. You could read the whole
typed relation graph and had no way to walk through any of its nodes: the map was not
connected to the territory it described. Double-click now takes the same route the Atlas
card takes, through both the label and the 3D pick, which converge on one `dblFocus`.
Single click still selects, which is what you want while reading the graph.

> Measured end-to-end: double-clicking the "Spinor & Light-Cone Observatory" node routes
> to `#/world/s3/lab/nul`.

### Two verifier failures that were failures of the test

`verify-navigation-architecture.cjs` asserted `viewNames.length===72` and
`routes.length===79`, and started failing the moment a 73rd laboratory was added — while
its own detail line printed 73 laboratories and 80 distinct routes. Both expectations are
now read from the source. **A test that hard-codes what it is measuring measures the test.**
29/29 verifiers pass.

Self-tests 692 → **696**.

## Everything on the screen is on the screen (v3.84.0)

A reader photographed an iPhone and wrote: *the last buttons of the top bar slide off the
edge, I cannot reach many of the functions.* Reproduced at 390×844 and 844×390, and the
report was an understatement.

### What the measurements said

| viewport | before |
|---|---|
| 390×844 portrait | **6 of 10 top-bar buttons outside the viewport**, and the row was not even scrollable |
| 360×780 | 7 of 10 outside |
| 844×390 landscape | 7 elements over the **top** edge — the Controls sheet's pin and collapse at **y = −152**, the catalogue at −18, the freshness bar at −79 |
| every mobile size | the bottom tab bar's **⬇ Data and ⋯ More wrapped to y = 845 on an 844 px screen** |

Every one of those controls rendered, was registered, and passed every logic test. The
atlas has claimed "visible dead controls = 0" for many versions and tested it by asking
whether a control *renders*. None of the tests asked whether a finger could reach one.

### Four causes, none of them cosmetic

**`100vh` is a lie on iOS Safari.** It is the height the page would have with the address
bar hidden — larger than what the reader can see. Every sheet sized itself from
`100vh − topbar − tabs − …`, came out too tall, and the offsets stacked above it walked off
the top. There is now one honest unit, `--vh100`, defined as `100vh` and redefined as
`100dvh` under `@supports`; **28 occurrences** switched to it.

**Subtractions with no floor.** On a 390 px screen `calc(100dvh − … − 92px)` reaches zero
and goes negative, and a negative height falls back to content height — which is how a
sheet taller than the screen pushed its own header out of view. `max()` gives the
arithmetic a floor; the sheet scrolls inside itself instead.

**Corner controls scrolled away with the content.** Pin, fold and close are absolutely
positioned inside a panel that is itself the scroll container, so `top:10px` is measured
from the content origin. With the sheet scrolled 250 px they sat at −152. A capturing
scroll listener publishes `--panel-scroll` and the CSS adds it back.

**A hidden horizontal scroller for ten destinations.** The worst of both worlds on a phone:
it hides what it holds, has no affordance, and the swipe that would reveal the rest is the
gesture that orbits the scene. The row is now a **five-column grid** — two rows, in every
language, at every width, with labels ellipsised rather than buttons lost. Search,
Navigator and More keep their icons and drop their words, which required splitting the icon
from the label in `LANG_MISC`: `applyLangChrome` wrote `textContent` and had been deleting
the `<span>` at boot.

### The invariant that was missing, and what it caught

`HCC_API.ui.unreachable()` measures, **on the reader's own screen**, every visible control
whose box lies outside the visual viewport — skipping anything inside a scroller, where
being out of view is normal. It runs as a boot self-test and is exposed so a harness can
drive it across viewports.

It paid for itself on its first run. `#hccTabs` was `grid-template-columns:repeat(4,1fr)`
while the merged bar is built with **six** buttons, so ⬇ Data and ⋯ More wrapped into an
implicit second row below the screen — present, rendering, unreachable, and visible as a
four-icon bar in the reader's photograph. A fixed column count is a promise about content
that the content does not keep; `grid-auto-flow:column` lays whatever is there in one row.

### After

| viewport | unreachable controls | panel collisions |
|---|---|---|
| 390×844 | **0** of 51 | 0 |
| 844×390 | **0** of 41 | 0 |
| 360×780 | **0** of 51 | 0 |
| 320×568 | **0** of 51 | 0 |

Collisions were measured too, and three real ones in short landscape were resolved: the
breadcrumb was covered by the catalogue (7,604 px²) and the freshness banner sat across
both. The banner is a notice, not an instrument, and now takes the free lower-left of the
scene. Fixing the catalogue needed two changes and only one was obvious —
`body #labPanel[data-collapsed="1"]{max-height:none!important}` outranks a plain
`body #labPanel` on the attribute and was quietly winning, with the measurement reporting
`max-height: none` while the rule that set it read `!important`.

Self-tests 696 → **697**.

## The axioms, the universality, and the door that was never cut (v3.85.0)

`docs/verify-fibonacci-category.cjs` — **7/7**.

### The catalogue was built by harvest, so a laboratory could be invisible

A reader could not find the Fibonacci anyon laboratory in the laboratory catalogue. It was
registered in `S3_VIEW_NAMES`, `LAB_REGISTRY`, the prediction contract, the premium domains,
the browser domains and the Nexus — **six registries** — and the catalogue still did not
list it, because the catalogue is built by harvesting `button[id^="v-"]` out of the Controls
panel and nobody had added a seventh declaration. Measured: **72 of 73 laboratories, and
the quantum row listing 12 of that domain's 13 members.** The missing one was this.

The button is added. More importantly the catalogue now **synthesises one for anything
still absent**, from the same `S3_VIEW_NAMES` the router uses, so the class of fault is
closed rather than this instance of it. The enumeration is a pure function shared by the
builder and the boot self-test, because the builder exits outside S³ and a test that calls
it at boot measures nothing.

### The two coherence conditions nothing had checked

A fusion category is not a table of F- and R-symbols; it is a table that **satisfies** two
conditions, and the laboratory had been computing on that table for nine versions without
asking.

> **Pentagon** — the five ways of reassociating four anyons agree: max |LHS − RHS| =
> **1.11e−16** over all **512** labellings. The F-matrix was derived here from F² = I,
> which is a *consequence* of the pentagon, not the axiom.

> **Hexagon** — braiding and reassociation commute: **3.14e−16** for R₁ = e^{4πi/5},
> R_τ = e^{−3πi/5}, and equally for its mirror, which is correct — a theory and its parity
> conjugate are both consistent and the category cannot choose between them.

**And the hexagon rejects, at residual 1.18, the exact chirality error this atlas made in
v3.76.0**: pairing R₁ = e^{4πi/5} with R_τ = e^{+3πi/5}. Yang–Baxter passed that. So did
(ST)³ = e^{2πic/8}S². Both are satisfied by either handedness *taken consistently*, and
neither relates the two phases to the F-matrix. The hexagon does. It is the cheapest check
in the laboratory and it was the one that was missing — the bug was caught then by
reasoning, and would have been caught by arithmetic.

### Universality, exercised instead of cited

"The braid image is dense in SU(2)" is normally a citation. The **compile a gate** station
searches braid words and watches the operator distance to a target fall:

| max length | distance to a Hadamard | word |
|---|---|---|
| ≤ 8 | 0.119088 | `121` |
| ≤ 11 | 0.086457 | `bb1bb11b1ba` |
| ≤ 13 | **0.029155** | `1b1b1bbb1b1b1` |

That is what universality *means* operationally: any gate, to any accuracy, by moving
particles around one another and nothing else. And no word reaches a gate exactly — the
image is dense, not onto. A topological quantum computer approximates; its protection is
that the approximation cannot drift, the word being an invariant of the worldlines rather
than a set of tuned pulses. The station draws it on a Bloch sphere: the target axis, the
axis the braid actually produces, and the convergence trail between them.

### The other sign

`H = −ΣPᵢ` is the antiferromagnetic golden chain and flows to the tricritical Ising model.
`H = +ΣPᵢ` is a **different theory**, and the entanglement entropy separates them with no
velocity, no energy fit and no momentum resolution — S(ℓ) = (c/3)·ln[(N/π)sin(πℓ/N)] on a
ring, so the slope against the chord *is* c/3:

| N | H = −ΣP | H = +ΣP |
|---|---|---|
| 12 | 0.7561 | 0.9339 |
| 14 | 0.7486 | 0.8431 |
| 16 | **0.7462** | **0.8175** |

against 7/10 and (quoted) 4/5. **This is a discriminator, not a precision measurement**, and
the file says so: both sequences are still falling at N = 16 and both sit a few per cent
high, because anyonic chains carry a boundary contribution this two-parameter fit does not
model. The precise c for the antiferromagnet remains **0.699945**, from the stress tensor.
What entanglement adds is that it needs none of that machinery — and that the *ordering* is
unambiguous.

Self-tests 697 → **701**; verifiers 29 → **30**.

## One panel again, and the shake explained (v3.86.0)

A reader photographed the capacity selector: *make this floating inner panel with the
sliders one again, the way it was — everything shakes during the animation.* Both halves
of that were right, and the second one has a structural cause.

### The shake was a layout correction arriving a quarter of a second late

The parameter dock lifted every `.ctlrow` to the top of its panel — a real fix for a real
measurement (the first slider in the zero-point observatory sat **1,483 px down a 270 px
window**, 0 of 3 parameters reachable) — but it did the lifting by **moving nodes on the
4 Hz publish tick**. These panels rebuild their `innerHTML` from their own slider handlers.
So every rebuild destroyed the dock and dropped the rows back down a two-thousand-pixel
scroll, and the tick hoisted them again a quarter of a second later.

> Measured on the capacity selector with an oscillator running, sampling at 12 Hz for three
> seconds: **the dock was present in some frames and absent in others**, and the first
> parameter row travelled **48.3 px**.

A layout correction applied 250 ms after the layout it corrects is not a correction — it is
a second animation. The repair is to stop polling: a `MutationObserver` fires in the
microtask after the rebuild, **before the browser paints**, so the frame the reader sees is
already right.

| instrument | oscillators | first-row travel, before → after |
|---|---|---|
| capacity selector | 1 | 48.3 px → **0.0** |
| zero-point | 3 | → **0.0** |
| capacity flow | 3 | → **0.0** |
| Smith–Möbius | 4 | → **0.0** |
| Bianchi IX | 7 | → **0.0** |

### And it is one panel again

The dock was a card: its own border, shadow, backdrop blur, header, fold control and
scrollbar — a second instrument on top of the first. It is now a plain leading group in the
panel's own flow, separated by a hairline. It still puts the parameters above the readout
they act on, which is the entire reason it exists; it just does that **as part of the
panel** rather than as an object floating on it. No second border, no second scrollbar, no
second header.

### Twelve controls behind a gesture

The reachability invariant added in v3.84.0 exempts anything inside a scroller, because
being out of view in a scrolling panel is normal — you scroll to it. That exemption is
right vertically and **wrong horizontally**: a chip row with `overflow-x:auto` and a hidden
scrollbar conceals its own contents behind a swipe which, on a touch screen, is the gesture
that orbits the scene. Measured at 390 px:

| instrument | hidden past the right edge |
|---|---|
| capacity selector | "match the sky", "⧉ copy report" |
| zero-point | "null · pure", "decoy · modular" |
| Smith–Möbius | "manual", "projection", "✦ grid", "▭ hold" |
| Bianchi IX | "mild triaxial", "Mixmaster", "strong triaxial", two axes |

**12 → 0.** The rows wrap, and `HCC_API.ui.clipped()` now measures horizontal clipping as a
fault in its own right, so the class is closed rather than this instance of it.

Self-tests 701 → **703**.

## Every door opens (v3.87.0)

The Fibonacci anyon laboratory appeared in both lists and would not select. It was there,
it rendered, and pressing it did nothing.

**The click wiring was a third hand-kept list.** Seventeen individual assignments of the
form `ctl.querySelector('#v-sec').onclick = …` plus an array of fifty-six ids — and this
laboratory was in **neither**, so its button rendered in the Controls panel, was harvested
into the catalogue, appeared in both lists and had no handler at all.

That is the **third hand-kept list this one laboratory fell out of in three versions**:

| version | the list it was missing from | symptom |
|---|---|---|
| v3.85.0 | the view-button markup | absent from the catalogue entirely — 72 of 73 |
| v3.85.0 | the catalogue's harvest | fixed by synthesis, so the class is closed |
| **v3.87.0** | **the click wiring** | **listed in both lists, dead to the touch** |

A list someone must remember to extend is a list that will be forgotten. The buttons are
now wired **by enumeration** — anything naming a registered laboratory and lacking a
handler gets one — and the sweep runs last, so every bespoke binding above it still wins
and a laboratory added tomorrow is clickable by existing.

> Verified by clicking every entry: **73 of 73 laboratories select from the catalogue and
> land on their own route.** Buttons with no click handler: **0**.

A self-test now asserts it, and says so plainly when it is measured outside S³ and
therefore vacuous, rather than reporting a pass over nothing.

Self-tests 703 → **704**.

## The two things v3.85.0 named and did not build (v3.88.0)

`docs/verify-anyon-bridge.cjs` — **6/6**. v3.85.0 ended by listing what it had left
undone. Both items are now instruments, and the audit's last open P1 is a page.

### The number a detector actually reads

Everything else in the anyon laboratory is structure. This is the measurement. Send a τ
around an island on two paths and the interference fringe is multiplied by the monodromy
M_ab = S_ab S_00/(S_a0 S_0b):

| island | M | fringe |
|---|---|---|
| empty (charge 1) | **1** | full visibility |
| one τ | **−1/φ² = −0.381966** | visibility 0.381966, and **inverted** |

That is how a Fibonacci anyon would be *detected* — not "the state is topological" but a
contrast that collapses by 61.8% and a peak that becomes a trough, with the missing
1 − 1/φ² = 1/φ being exactly where the which-path information went. The station draws both
fringes against each other, with the empty-island curve left faint behind the live one.

It is computed **two independent ways that must agree**: from the S-matrix, and from the
twists and the fusion rule as (1/d_a d_b) Σ_c N^c_ab d_c θ_c/(θ_aθ_b). The first knows
nothing about θ and the second nothing about S, so agreement checks the whole modular data
rather than restating it. Residual 0, and the imaginary part vanishes exactly, as it must
for a self-conjugate pair.

### Every rung of the φ-ladder is a fusion space

The atlas has asserted "the golden ladder and this particle are the same φ" since v3.76.0.
It is an exact integer identity:

> q(N) = π φ^{2N}  and  dim Fus(2N τ) = F_{2N+1} = round( φ·(q/π)/√5 )

At the manuscript's rung that is **F₅₈₅, a 122-digit integer**, computed in BigInt rather
than asserted — so

> u★ = ln q₀ = ln π + 584 ln φ − ln(1 + π/50)

reads as *one π, the entropy of 584 anyons, and the valuation gate*. The station draws the
ladder as a cone of rungs carrying 2N beads each, and the cone opens at ln φ per rung
because that **is** the entropy per anyon.

**A reading, not a derivation**, and the panel says so: nothing here shows the horizon
*carries* those anyons — that would need the edge algebra to produce the category, and
`verify-edge-operator.cjs` shows it does not. What is established is that the two
appearances of φ are the same φ.

The first draft of this verifier put u★ 0.0609 too high because it omitted the valuation
gate from q₀. The assertion caught it, which is the entire reason the assertions carry the
number rather than the conclusion.

### agent.html — the atlas for a machine, a screen reader, or no GPU at all

The audit asked for a catalogue a machine can read without executing the application.
`agent.html` is **8 KB against the atlas's 3,992 KB**: every laboratory, every typed
instrument, every route, read from the *same* static manifest the build script writes by
walking all 73 headless — so it cannot drift. No canvas, no WebGL, no three.js, one JSON
fetch, and if the script fails the manifest link at the top is still the whole answer.
Verified with WebGL blocked: 9 instruments, 73 laboratories, 73 working route links, 0
errors. `validate.mjs` fails the build if the page ever grows a dependency on the thing it
exists to avoid — the first version of that check failed on the page's own prose saying
"no WebGL, no canvas", so it now matches *usage* rather than the word.

The anyon laboratory now has **nine stations**: braid worldlines, Hopf link, fusion tree,
golden chain, momentum & sector, category axioms, compile a gate, interferometer, φ-ladder.

Self-tests 704 → **706**; verifiers 30 → **31**.

## The solvers come off the main thread (v3.89.0)

The audit's P2-15, and the one item on the remaining list with a concrete measurable
payoff. An exact diagonalisation is honest work and it has no business happening between
two frames.

### Measured, before

Sampling `requestAnimationFrame` while each station computes:

| action | worst frame gap |
|---|---|
| open the golden chain | 407 ms |
| ring N = 14 | 450 ms |
| enter the momentum station | 633 ms |
| **compile a gate to depth 13** | **1,179 ms** |

### The source-of-truth problem, and how this avoids it

A worker in a single-file application usually means a second copy of the numerics inside a
template string — and a second copy drifts. This atlas has met that failure four times in
other guises during this session alone. So the worker is built from the functions
**themselves**, via `Function.prototype.toString()`: it runs the same source text the main
thread runs, because it *is* the same source text. Nothing to keep in sync, and the check
that the two agree therefore tests the transport rather than the mathematics.

The synchronous functions stay exactly where they are — they are the fallback when Workers
are unavailable, what the boot self-tests call, and what the verifiers mirror.

### The bug that made it useless, and the invariant that closes it

The first version shipped an **open dependency set**: `fibMM` calls `fibAdd` and `fibMul`,
neither was shipped, the worker loaded cleanly, accepted the job and threw
`fibAdd is not defined` — and the `catch` that falls back to the main thread **swallowed
the message**. The only symptom was that nothing got faster. A silent fallback is a worse
bug than a loud failure.

Two repairs, not one: `hccSolveAsync` now records why it fell back and
`HCC_API.ui.worker()` reports it; and a boot self-test **checks the closure** instead of me
re-reading the sources — every solver identifier referenced in the generated source must be
defined inside it. That check immediately caught a second name, `chainSpecCache`, declared
as the second declarator of a `const a=…, b=…`, which its first matcher could not see.

### Measured, after — A/B on the same machine

`?worker=0` forces the old behaviour so this is reproducible rather than believed. The
harness has no GPU and renders at 3–4 fps in every world *idle*, so the absolute numbers
are the environment's; the **excess over its own idle floor** is the result.

| | idle floor | peak while compiling | **excess** | answer |
|---|---|---|---|---|
| `?worker=0` | 317 ms | 1,171 ms | **854 ms** | 0.029155263 |
| default | 328 ms | 355 ms | **27 ms** | 0.029155263 |

**854 ms → 27 ms, and the same answer to every digit.** Each station now draws a
"computing" state for one frame and rebuilds itself when the result lands.

One consequence worth recording: a structured clone copies arrays, so the spectrum
station's `q === S.ground` identity tests silently stopped marking anything. Positions
survive the crossing and identities do not, so the marks are carried as indices now.

Self-tests 706 → **707**.

## A sweep of all seventy-three (v3.90.0)

The invariants added in v3.84.0 and v3.86.0 had only ever been run where a defect was
already suspected. This version runs them over **every laboratory, at phone and desktop
size**, and fixes what the sweep found. Perfection is not a claim; it is a measurement
that comes back empty.

### Three exceptions mean the rule is wrong

The mobile stylesheet turned **every** chip row into a hidden horizontal scroller — "one
elegant swipeable line instead of a wall of pills" — and the file had since accumulated
three separate exceptions to it, each added after a measured failure: the fractal mode
selector, the capacity-flow presets, and the five instrument panels. The sweep settled it:

> **59 of 73 laboratories were hiding controls past the right edge.** 18 in the skyrmion
> laboratory, 9 in the hopfion, 9 in the three-body, 5 in the selector — Antiskyrmion,
> Skyrmionium, the Skyrmion-Hall race, the annihilation demo: rendered, registered, and
> behind a swipe that on a touch screen is the gesture that orbits the scene.

Chip rows wrap now; a row that genuinely wants a swipe strip opts in with `.chips.swipe`,
and nothing does. Then the same inverted default one level down, in `.snapRow` — the
precision shortcuts, χ = π at the antipode, k = 1, the √2 critical point — four more.

**59 → 4 → 0.**

### Every slider in the atlas was three pixels tall

`.ctlrow input[type=range]{height:3px}`, with the touch treatment that gives it a 30 px
body and a 28 px thumb gated behind `@media (pointer:coarse)`. So on **every desktop, in
every laboratory, every slider was a three-pixel hairline.** Found by a new zero-size
invariant on its first run, in the FBS3R world: eight range inputs at 131 × 3 px.

The premium skin painted the *element* as the track, which is why the height could never
grow — it paints the track pseudo-element now, so both skins agree and both are grabbable.
The look is unchanged: thin gold track, jewel thumb.

> **3 px → 22 px on desktop, 44 px on touch.** Fitts's law is not kind to a three-pixel
> target.

### The invariant that found it, and the one that was wrong

`HCC_API.ui.dead()` asks a question the atlas had never asked. It has claimed "visible dead
controls = 0" for many versions and tested it by asking whether a control *exists*; this
asks whether it is visible **and yet impossible to press**. The distinction is the whole
check — a control inside a folded section is legitimately 0 × 0 — and my first version of
the measurement reported about 1,700 of those as dead across the atlas, because it stopped
at the first zero-height ancestor instead of walking the chain to find the one that was
`display:none`. Corrected, the honest answer was 0 in S³ and 8 real ones in FBS3R.

### After

| | 390 × 844 | 1440 × 900 |
|---|---|---|
| laboratories swept | 73 | 73 |
| unreachable controls | **0** | **0** |
| controls clipped sideways | **0** | **0** |
| visible zero-sized controls | **0** | **0** |
| empty panels | **0** | **0** |
| laboratories that threw | **0** | **0** |
| page errors | **0** | **0** |

Self-tests 707 → **708**.

## Where else this number is, and why (v3.91.0)

`docs/verify-phi-census.cjs` — **9/9**. The atlas has been saying "the golden ladder and
this particle are the same φ" since v3.76.0, in five or six places, without ever saying
**what kind of sameness** each one is. That is the difference between a map and a mood.

### One equation, two theorems

> d = 1 + 1/d  ⟺  d² = d + 1

The fusion rule τ×τ = 1+τ and the continued fraction [1;1,1,…] are the **same statement**.
From the first, φ is a quantum dimension. From the second, φ is the **worst-approximable
irrational there is** — Lagrange number √5, measured here at 2.236068023 against
2.236067977, the smallest any number can have (Hurwitz), with √2 at 2√2 and √3 at 2√3 for
comparison. That is why the golden torus is the last to break in the KAM laboratory: the
same number, and for once the shared cause is the equation itself.

Getting that measurement right took three corrections, all mine: iterating
y ↦ 1/(y − ⌊y⌋) on a double invents partial quotients by the twentieth term (L(φ) came out
2.2371 and L(√2) came out **Infinity**); the max over the sequence is not the limsup;
and the last value is not either, because √3 = [1;1,2,1,2,…] **oscillates**. Exact
continued-fraction terms, a q-cap where a double still resolves the gap, and a two-term
tail.

### The quasicrystal and the anyon share one matrix

The Fibonacci tiling's substitution a → ab, b → a has abelianisation [[1,1],[1,0]], and
conjugating by the basis swap gives **N_τ = [[0,1],[1,1]] exactly** — not a similar matrix,
the same matrix in the other order. So the tile-length ratio of a quasicrystal and the
quantum dimension of a τ anyon are one Perron eigenvalue. Iterating the substitution 24
times: 75,025 long tiles to 46,368 short, ratio 1.618033989.

And "no two adjacent" is one condition: the fusion-space basis of twelve anyons is in
explicit bijection with 233 distinct Zeckendorf representations, because the non-adjacency
that makes Zeckendorf unique **is** the fusion rule 1 × τ = τ.

### Nine appearances, four kinds

| kind | count | what it means |
|---|---|---|
| derived | **6** | forced by the mathematics — d_τ, D, e_∞ = 2φ−4, the tile ratio, Zeckendorf, L(φ) = √5 |
| quoted | **1** | that the golden torus survives longest is Greene/Aubry, cited not proved |
| conditional | **1** | dim Fus(2N) = round(φ(q/π)/√5) is exact **given** the ansatz |
| declared | **1** | R_N = ℓ_P φ^N is that ansatz — not derived by anything here |

The new **"where else φ is"** station draws this as a wheel: the equation at the hub, one
ring per kind, every spoke naming the laboratory it lands in, filterable by kind. Kept
beside them, refused: 3π⁴ = 292.2273 against the shell integer 292 — 0.08% is nowhere near
close enough for an integer, and a census that accepts it has stopped being a census.

### Three proofs that were not walkable

`anyon ↔ qcrys`, `anyon ↔ kam` and `anyon ↔ hopf` are now typed relations in the Nexus.
All three were already **proved** in this atlas and none was an edge in the relation graph
— and a verified identity that is not in the graph is a fact the reader cannot walk to.

Three faults of my own along the way, each the same shape as one before it: the census
disc is a *child* of the group whose clear loop empties it, so the station rendered as
captions floating over nothing (third occurrence, same guard); the relation literals are
mapped into objects with named fields, so indexing them positionally found zero relations;
and my verifier's census list drifted one entry behind the atlas's until the assertion
caught it.

Self-tests 708 → **710**; verifiers 31 → **32**.

## The layer in the other laboratories, and 107 bridges that did not cross (v3.92.0)

v3.91.0 built the census *inside* the anyon laboratory. The other half of the request was
the layer **in the models where this number does something** — and looking for the place to
put it turned up a navigation defect across the whole atlas.

### The anyon layer, where the anyon acts

**Quasicrystal.** A live panel showing the substitution a → ab, b → a, its abelianisation
[[1,1],[1,0]], and the conjugation `P·[[1,1],[1,0]]·P = [[0,1],[1,1]] = N_τ` — the fusion
matrix of a Fibonacci anyon, exactly. Iterated twenty-four times in the panel: 75,025 +
46,368 = 121,393 tiles, ratio **1.618033989**. The tile-length ratio of the crystal and the
quantum dimension d_τ are one Perron eigenvalue, and the Zeckendorf addressing that makes
the tiling unique is the fusion rule 1 × τ = τ.

**KAM.** A live panel computing the Lagrange numbers: **L(φ) = 2.236068 = √5**, L(√2) =
2√2, L(√3) = 2√3. Smaller means harder to approximate, no irrational goes below √5, and φ
sits exactly there because every partial quotient of [1;1,1,…] is 1. Then the line that
joins the two laboratories: φ = 1 + 1/φ **is** τ × τ = 1 + τ. The golden circle survives to
K_c = 0.971635406 for the reason the other laboratory calls d_τ — with what is quoted
(Greene/Aubry, and K_c as a converged constant) marked as quoted.

Each carries a bridge to the census station, so the connection is walkable in both
directions.

### A bridge that does not move the URL is not a bridge

Looking for where to put those bridges, I clicked an existing one. Measured: from the
quasicrystal, "→ Topology" **changed the scene and left the route at
`#/world/s3/lab/qcrys`**, with the breadcrumb still reading "Quasicrystal". So a reload
came back to the wrong laboratory, the trail lied about where the reader was, and the
address bar could not be shared.

> **107 bridges did this** — every cross-laboratory link in the atlas — because
> `setS3View()` moves the scene and `hccGo()` is what writes the route.

All 107 now take the canonical route, the same one an Atlas card takes. Exercised across a
sample of 26 laboratories: **16 bridges, route agrees with context 16, mismatches 0.** A
boot self-test reads the handlers rather than trusting the edit: no bridge may still call
`setS3View`.

Self-tests 710 → **711**.

## The computational core, and what it does not yet cover (v3.93.0 · core 1.0.0)

An agent-first refactor. The atlas is unchanged; underneath it there is now a pure core that
a machine can drive with no browser at all. `docs/AGENTS.md` is the machine-facing document.

### The audit findings, reproduced first

| finding | reproduced |
|---|---|
| 73 labs, 9 typed instruments | yes |
| `HCC_API` lives only inside the 4 MB page | yes |
| manifest publishes outputs as `"0","1",…` | yes — `Object.keys` of an array in `instruments.list()` |
| manifest `units: null` | yes |
| manifest commit ≠ built commit | yes — `079c7bf` recorded against `42b77c7` |

All five are fixed. Outputs are named with types and units, the commit is read at call time
rather than at build time, and `/api/v1/labs/{id}` publishes JSON Schema for inputs and
outputs.

### What was built

**`core/`** — pure ESM, no DOM, no Three.js, no animation frame. Complex arithmetic, a
Durand–Kerner root finder (exact on a test cubic), AGM elliptic integrals (matching
reference K(0.5), E(0.5) to 10 digits) and least squares with a condition estimate.

**One contract for every laboratory** — `describe · run · sweep · validate · export ·
cancel` — and a 28-field result envelope carrying run id, core version, git commit, code
SHA-256, model and equation ids, inputs *with units*, seed, precision, assumptions, domain
of validity, outputs *with units*, uncertainty, covariance, residuals, diagnostics,
warnings, verifiers and artifacts.

**An HTTP + MCP service** with every route required: health, labs, lab, runs, run, cancel,
SSE events, sweep, validate, open-problems, `/openapi.json` (OpenAPI 3.1),
`/.well-known/mcp.json` (8 tools), `/mcp/call`, and `/` → `/HCC/`.

**Möbius–Smith split into four instruments:**

| instrument | status | what it is |
|---|---|---|
| `smith.mobius` | EXACT | plane and sphere routes computed independently; disagreement returned as a residual |
| `smith.fit_series_rlc` | NUMERICALLY_VERIFIED | blocked hold-out, conditioning, matched-load negative control |
| `smith.identify_resonances` | **SYNTHETIC_ONLY** | Touchstone 1.0, Levy + Sanathanan–Koerner, order by blocked hold-out, bootstrap intervals |
| `smith.wireless_transfer` | **REFERENCE_MODEL** | Maxwell mutual inductance, coupled-RLC two-port, power balance |

### The numbers

- Noiseless RLC benchmark: **R = 32.000000000 Ω, L = 1.400000000 µH, C = 470.000000 pF,
  f₀ = 6.204505657 MHz, Q = 1.705552572** — max relative error 3.3e−15.
- Pole recovery: 1 pole **0.0e+0**, 2 poles 3.9e−14, **5 poles all found** at 4.9e−8.
- Bootstrap coverage: the 95% interval covered the true f₀ in **18 of 20** noisy trials.
- Mutual inductance approaches the dipole law to 2.5e−4 at d = 12 m; power balance closes
  to 8.7e−19 W; efficiency never exceeds 1 over the sweep.
- **UI and API agree bitwise** on `smith.mobius`: |Δ| = 0 (the only instrument that exists
  in both; parity for the rest is untestable because the rest do not exist in the core).

### Statuses are load-bearing

An unimplemented laboratory returns **501 NOT_IMPLEMENTED** with no number, through HTTP and
through MCP. An out-of-domain input returns **422 DOMAIN_ERROR** — refused, never clamped.
`smith.identify_resonances` never says "all resonances were found"; it says *"all resolvable
modes inside the stated band, for the stated model class, at the stated detection threshold
and resolution"*, and labels itself UNCALIBRATED because no calibration exists in this build.

`api/open-problems.json` carries **119** machine-readable gaps, including the named ones the
atlas had only ever stated in prose: the edge determinants, the Harish–Chandra character,
the SO(4) volume, the Kronecker functional, the non-existent H_{∂,q}, the capacity selector,
the physical origin of φ, DESI covariance, and the Bianchi CSV that is not byte-reproducible.
The count is generated from the core, not typed here — it moved from 92 to 119 when the six
CIVP kernels arrived, and every one of the five closure certificates is in that list because
none of them is derived.

### What this is NOT

This is a **working vertical slice, not the finished refactor**, and the ratio is published
in `/api/v1/health` rather than buried:

- **4 of 77 laboratories have a computational kernel.** The other 73 are catalogued and
  return NOT_IMPLEMENTED. Extracting 73 kernels from the visual atlas is the bulk of the
  remaining work and none of it is done.
- **No SOLT/TRL calibration or de-embedding.** Declared, refused, listed as open.
- **No full-wave solver.** The near-field model stops at kd > 0.3 and says so.
- **No lateral offset, tilt, shields, obstacles, ferrite, proximity or skin effect.**
- **No WASM, no Parquet, no PNG or GLB artifacts** — export is JSON and CSV.
- **No external measured data anywhere in this repository.** Every fixture is synthetic and
  labelled synthetic in its own comments.
- **The Bianchi IX CSV is still not byte-reproducible**; it is recorded as an open problem
  rather than quietly regenerated.

`node scripts/ci.mjs` rebuilds every artifact from scratch, runs all 32 verifiers, the 22
API contract and benchmark checks and the headless agent scenario: **all green**.

## The CIVP locking chain, and the five things it does not prove (core 1.3.0)

A manuscript arrived — *Acyclic CIVP–Index Locking, Molecular Corner Statistics,
Entropy–Flux Structure, and Capacity Selection in Trace-Free de Sitter Gravity* — and almost
every theorem in it is a finite exact computation. So it is one, in six kernels, a
verifier and a three-dimensional observatory.

### The thing worth saying first

The paper's own subject is **type safety**: the same integer or scalar occurs in several
unrelated roles, and the work is keeping them apart until something earns the equality.
`q_can` is a positive real, `N_emb` is the degree of an effective divisor, `q_ind` is a
dimension, `N_Berry` is a representation rank, and `I_J` is generally irrational. So the
kernels are built to make the SEPARATION visible, not the identification:

- `civp.embadon_measure` can be driven to a state where `q_can = N_emb` holds numerically
  and the pointwise unit gate `C_U` reports **no**. Raise the weight spread with the mean
  pinned at one: the capacity equals the count by accident, and the variance is the only
  output that moves. That gap is the first locking gate.
- `civp.finite_index` computes the golden window and, with the same care, the four things
  that cannot be the defect: a divisible endomorphism semigroup (forced to index 1, because
  `I^{1/n}` enters the empty interval (1,2)), the irreducible fuzzy sphere (λ\* = 1/N, which
  hits the window's *excluded endpoints* at N = 2 and 3 and never its interior),
  the consecutive matrix tower (Mat_N ↪ Mat_{N+1} needs N | N+1), and the irrational
  capacity ladder.
- `civp.closure` holds the five certificates as switches and computes which conclusions
  survive. Remove any one and **exactly one** conclusion goes with it — the irreducibility
  proposition, as a table rather than as a claim. And it warns, on every run where all five
  are switched on, that switching a certificate on in an input is not deriving it.

### The exact lock

`civp.cp1_locking` is the sharpest statement in the paper: RΓ(CP¹, L_q(−Z)) ≃ 0 **iff**
N_emb = q_ind. It is computed twice, by routes that share no code — sheaf cohomology of the
residual bundle O(q−1−N), and the rank of the confluent evaluation matrix — and the two are
compared rather than assumed to agree. Collisions are supported because the derived
formulation is the reason to have one: a double point contributes a jet, the evaluation
target grows by one, and the defect does not notice. At the lock the determinant is checked
against ∏(z_b − z_a)^{m_a m_b}.

### The selector, and why its location is not a quotient

`civp.uv_selector` implements κ_q = Δ² log I_q. The nuisance I_q → C e^{aq} I_q is the
boundary-tension and normalisation freedom, κ annihilates it, and κ is complete modulo it.
The consequence is the useful part: **shape is a quotient and location is not**. In the
observatory this is one picture — log Z_q over the (q, a) plane, where every row has the
same curvature and the crest slides by tens of sectors. That is exactly why removing C_UV
leaves q★ undetermined while leaving the selector's shape untouched.

### Verified against something else

`docs/verify-civp-locking.cjs` does not ask a kernel whether it likes its own answer. For
each claim it recomputes the same number by a different route: h¹ through **Serre duality**
rather than the max formula; the evaluation rank by **Gram–Schmidt** rather than pivoted
elimination; the confluent determinant by the **Leibniz sum over every permutation**; the
only Jones value in (2,3) by **inverting** 4cos²(π/m) at the endpoints, which lands on m = 4
and m = 6 and leaves m = 5 alone; the BMS shape norm against **BigInt factorials**; the
Capelli multiplicities from the polynomial's own **derivative orders**, forming no transfer
at all; and the compound-Poisson cumulants by **brute-force summation** over the count.
35 checks, all green. The kernels' own self-tests add 44 more.

### The atlas is the source, and the kernels are sliced out of it

This is the part that decides the architecture. The mathematics is **written in
`index.html`**, where the seven stations draw it, and `scripts/extract-kernels.mjs` takes the
transitive closure of the named roots straight out of that file into `core/atlas/extracted.mjs`.
`core/labs/civp.*` import from there and rename; they contain **no arithmetic at all**.

That direction is not decoration. The alternative — a parallel `core/civp/` module and a
separate page importing it — was built first, and it was wrong for exactly the reason this
repository keeps repeating: two copies of a formula means the older one is wrong and nothing
says which. `civpDiagnostics` is pure — no THREE, no `state`, no DOM — so the same function
that returns the geometry for the scene is the function the API answers with. When
`docs/verify-civp-locking.cjs` checks a claim, it is checking the code that drew the picture.

`scripts/extract-kernels.mjs` enforces this: if any of the CIVP closure ever reached for a
renderer, the extraction would **fail** and name the chain from the kernel to the browser
global. That failure is the useful part.

Two defects turned up while wiring it, both worth recording. The extractor's statement walker
stops at a newline inside a `const a = …,` list when the next line begins with an identifier,
so a wrapped declarator list silently lost every binder after the wrap — `civpJacobi`'s `c`
resolved to a top-level `c` twenty thousand lines away and dragged `document` into the closure.
The 337 wrapped continuation lines in this block are now joined. And the Capelli transfer's
telescoping direction is not a convention: for ε = +1 the sum runs upward, for ε = −1 downward,
and the first version summed upward in both charts.

### Seven laboratories, not seven chips

A chip hidden inside one view is not a laboratory: it has no route, no card, no camera of
its own, and nobody can link to it. So each station is registered exactly like any other S³
laboratory — `civplock`, `civpcut`, `civpidx`, `civpa4`, `civpsel`, `civpcar`, `civpclo` —
with its own entry in every registry the atlas keeps, and the station chips **navigate**
rather than mutating state behind the URL. They share one scene graph because they are one
instrument in seven configurations. The atlas goes from 73 laboratories to **80**.

The seven are the argument in order, each with three normalised controls and its own
contract and caveat on the panel:

1. **CP¹ evaluation lock** — the divisor on the Riemann sphere, the carrier as q latitudes,
   h⁰ and h¹ as columns above and below. At N = q both empty and the equator closes.
2. **Molecular cut** — atoms whose *volume* is their weight, with the count and the capacity
   as two columns. Raise the spread: they stay equal and C_U flips to no.
3. **Jones ladder** — the gap (1,2) drawn as a void because it is empty, the window (2,3)
   holding exactly one rung, and the divisibility descent falling into the void.
4. **A₄ transfer** — BBᵀ, N_τ² and A as three 2×2 stacks that coincide, with the fusion tree.
5. **Selector landscape** — log Z_q over (q, a): every row has the same curvature and the
   crest slides.
6. **Berry carrier · Capelli** — N−1 flux meridians and N latitudes, one apart, beside a root
   divisor and its exact reconstruction.
7. **Conditional closure** — five rings that light one at a time, each unlocking exactly one row.

### Driven in a real browser, not asserted

The seven were checked the way a reader meets them: Chromium, WebGL, every route opened by
its hash the way a link would open it. All seven resolve, build their geometry, render their
panel with three sliders and seven chips, and report a passing contract — **zero page errors
across the whole walk**, and the interface measures 0 unreachable, 0 dead and 0 clipped
controls out of 112.

The same run found three regressions this work had introduced, all of them invisible to a
static check and all of them named by the atlas's own self-tests:

- **seven Nexus relations pointed at Atlas objects that do not exist.** Not every S³
  laboratory has an Atlas node, and `selAtlas`, `anyonAtlas`, `qcrysAtlas`, `gateAtlas`,
  `cauAtlas`, `berryAtlas` and `secAtlas` are seven that do not. Repointed at nodes that
  exist and claims that stay true; the validator now checks the target is *registered*
  rather than merely spelled correctly.
- **seven isolated nodes in the Invariant Nexus.** `NEXUS_RELATIONS` lives in view-id space
  and is a different registry from the Atlas object graph; the seven joined a cluster with
  nothing attached and the graph reported `components 8 · isolated 7`. Eighteen typed edges
  later it reports `components 1 · isolated 0`.
- **seven laboratories with no prediction target**, so the contract layer had 73 of 80.

### The agent surface

A laboratory an agent can only look at is a laboratory an agent cannot use. The seven walked
out of the first build as **parametric** — controls, no typed output contract — which is
exactly the class the atlas invented so nothing visual-only could be mistaken for something
you can compute with.

They are **typed instruments** now, registered from one table rather than seven copies:
declared inputs with domains, named outputs with units, limits, verifiers, provenance.
`HCC_API.describe('civpidx')`, `HCC_API.evaluate('civpclo', { q: 1e61 })`,
`HCC_API.report(...)` all work, and `api/manifest.json` — **measured by walking the atlas
headlessly, not hand-written** — now reads 80 laboratories, 11 computational, 16 instruments.

And one of them is wired: `civpsel` publishes `q★`, `civpclo` consumes `q`, and the quantity
bus carries a selected sector into the de Sitter map without either laboratory knowing the
other exists. It is the only place in this chain where a number becomes a metre, and it is a
wire rather than a call so the provenance travels with it.

### The Sun filled the frame, and had since long before this work

A reader reported that the atlas opens with the Sun covering everything. It did, and it was
not a regression — v3.94.0 does exactly the same. Measured in a real browser at boot:

| | before | after |
|---|---|---|
| camera distance from the Sun | 0.1317 AU | **71.63 AU** |
| Sun angular radius (half-frame is 27.5°) | 57.9° | **0.1°** |
| glow sprite angular radius | 90° | **0.4°** |

**The first explanation of this was wrong, and a trace on every write to `camera.position`
is what corrected it.** `frameSolarOverview()` *does* run at boot — exactly once, and it
writes the right answer, (0, 53.231, 47.930). It is write **92 of the 106** the camera takes
during boot. The other 105 are `stabilizeCamera()`, and that is the whole problem:
`renderer.setAnimationLoop` starts *before* the boot route runs, so for 91 writes the loop is
clamping a camera still sitting at the origin — where it was constructed — out to
`controls.minDistance`, which `stabilizeCamera()` has set to `navigationCollisionRadius()`:
the surface of a Sun drawn at 24× so that it is visible at all. The framing lands in the
middle of that and does not survive it.

Every other world frames itself on a mode *change*, long after the loop has settled, which is
exactly why nobody found it: **you have to arrive, not navigate.**

The guard is the measurement rather than a flag: frame only while the camera is still inside
the body it is looking at, so a deep link, a restored view or a reader who has already moved
is never overridden.

Two failures remain and both predate this work: the opening frame is not tone-mapped at boot
(the same "nothing runs for the world the state already claims" family, one symptom over),
and a 4D viewfinder residual. They are recorded, not silently absorbed.

### What is still open

All five certificates. They are in `api/open-problems.json` — C_X, C_win, C_U, C_E, C_UV —
because none of them is derived here and the atlas does not pretend otherwise. The de Sitter
map is exact and kinematic: without a derived q★, Λ_{q★} = 3π/(q★ ℓ_P²) is arithmetic on an
unknown, and every run says so in its own output.

## Status

The derivation is a rigorous superstructure over a **declared model**: a round S³, a
conformally coupled massless real scalar, one renormalization scheme, and the structural
ansatz R_N = ℓ_P φ^N. It is not an observational discovery. The renormalized remainder
ħc/(240R) is not the cosmological constant, φ is not derived by anything here, and the
formal coincidence 2Gε₀/(c⁴R) = 1 at R = ℓ_P is an algebraic identity and not a quantum
black hole. The atlas states all of this on the panel that displays the numbers.
