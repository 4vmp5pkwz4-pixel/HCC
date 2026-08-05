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

```
node docs/verify-zero-point-ladder.cjs     # 16/16 checks pass
node docs/verify-zero-point-csv.cjs        # 313 rows × 24 columns reproduced
node docs/verify-log-periodicity.cjs      # finds a signal, and fails to find one that is not there
node docs/verify-field-content-and-backreaction.cjs   # 11/11 checks pass
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

## Status

The derivation is a rigorous superstructure over a **declared model**: a round S³, a
conformally coupled massless real scalar, one renormalization scheme, and the structural
ansatz R_N = ℓ_P φ^N. It is not an observational discovery. The renormalized remainder
ħc/(240R) is not the cosmological constant, φ is not derived by anything here, and the
formal coincidence 2Gε₀/(c⁴R) = 1 at R = ℓ_P is an algebraic identity and not a quantum
black hole. The atlas states all of this on the panel that displays the numbers.
