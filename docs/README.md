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

```
node docs/verify-zero-point-ladder.cjs     # 16/16 checks pass
node docs/verify-zero-point-csv.cjs        # 313 rows × 24 columns reproduced
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
