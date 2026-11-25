# Preregistration II — φ and √5 on an independent sample (HCC Scale Nexus, Frontier II)

This file is committed together with the raw data (`data/scale-nexus/raw/`) and the code (`scripts/golden-lattice-replication.mjs`). The commit comes **before** any statistic is computed on `toi.csv`; the git history is the record of that order.

## Why there is a second preregistration
- The first preregistration (PREREGISTRATION.md) tested φ on the holdout of confirmed transit planets. It found **no evidence** (p = 0.25, φ ranked 168th of 241 bases).
- Its base scan peaked near **b ≈ 2.236 (≈ √5)** in both halves. That peak is an **exploratory finding**: it was seen in the data and was not a hypothesis set in advance. Neither half is used below.
- What is tested here, prespecified:
  - **H_φ:** the log-radius density of an independent population carries a modulation of period log₁₀φ.
  - **H_√5:** it carries a modulation of period log₁₀√5.
- **H0 for both:** the density is a finite mixture of smooth populations, possibly reshaped by a smooth selection function. There is no periodic modulation.

## The independent sample (fixed now)
1. **Source.** NASA Exoplanet Archive `toi` table (TESS Objects of Interest), sha256 in `data/scale-nexus/raw/MANIFEST.json`. TESS candidates are measured by a different pipeline (SPOC/QLP) under a different selection from the confirmed-planet composite table studied before.
2. **Dispositions.** Keep `tfopwg_disp` ∈ {PC, APC}: unconfirmed planet candidates. FP, FA, KP and CP are excluded. Known and confirmed planets are the population studied before.
3. **Hosts.** Exclude every TOI whose TIC identifier is the host of any planet in `pscomppars-tic.csv`. No star that contributed to the earlier analysis contributes here.
4. **Radius window.** 0.5 ≤ R ≤ 25 R⊕, with a finite radius and finite uncertainties.
   - Measurement error per object: σ_x = mean(|err1|, |err2|)/(R ln 10) in log₁₀R.
5. **Families.** TIC identifiers. Candidates of one star form one block.

## Models (x = log₁₀(R/R⊕); every model convolved with each object's σ_x)
- **M_mix(K):** a K-component Gaussian mixture.
  - K ∈ {1, …, 5} is chosen by BIC on this sample; component widths ≥ 0.03 dex.
  - K = 1 or 2 with widths ≥ 0.25 dex is the "smooth" family.
- **M_sel:** M_mix(K) × a logistic detection efficiency 1/(1 + e^{−(x − x₀)/w}), normalised numerically.
- **M_b (b ∈ {φ, √5}):**
  - The latent density is M_mix(K)(x)·[1 + ε cos(2πx/log₁₀b + θ)]/Z, with 0 ≤ ε ≤ 1 and Z exact for a Gaussian mixture.
  - Convolution with N(0, σ_x²) is exact: each component k contributes N(y; μ_k, s_k² + σ²)·[1 + ε·e^{−2π²v/λ²}·cos(2πm/λ + θ)], where v = s²σ²/(s² + σ²) and m = (μσ² + ys²)/(s² + σ²).

## Fitting (fixed now)
- **M_mix.** Fitted by deconvolution EM (Bovy, Hogg & Roweis 2011) from 8 quantile-spread starts, 400 iterations each, with width floor 0.03 dex. K* is the K of least BIC.
- **M_b.** Fitted in two stages:
  1. a 21 × 24 grid (ε ∈ [0, 1], θ ∈ [0, 2π)) with the mixture at its M_mix(K*) maximum, then golden-section refinement;
  2. a **joint** Nelder–Mead over every mixture parameter together with ε and θ — 1200 evaluations on the data, 800 in each bootstrap replicate.

  A synthetic self-test run before this commit showed why the joint step is needed: with the mixture held fixed, it partly absorbs a modulation, so ε is underestimated and the modulation leaks to the other base. The bootstrap repeats the same procedure.
- **M_sel.** Weights, means and widths of M_mix(K*), plus x₀ and w, maximised by Nelder–Mead (6000 evaluations) from the M_mix(K*) maximum. Normalisation uses 12 quantile bins of σ_x.

## Tests and decisions
- **Primary, for each base.** LR_b = 2[ℓ(M_b) − ℓ(M_mix(K*))], with K* fixed by BIC before the modulation is added.
  - The null distribution comes from a parametric bootstrap under the fitted M_mix(K*): 200 replicates, resampled σ_x, seed 4411.
  - p_b = (1 + #{LR* ≥ LR})/(1 + 200).
- **Multiple comparisons.** Two bases, Bonferroni: α = 0.025 each.
- **Effect.** ε̂_b with a 95 % interval from 100 bootstrap resamples of TIC blocks. ε̂ is non-negative by construction, so its interval almost never contains 0, even on null data. The comparison is therefore with the 95th percentile of ε̂ under the parametric null (ε_null95, from the same 200 replicates).
- **Model comparison, reported in full.** BIC and AIC for every model: M_mix(1…5), M_sel(K*), M_φ, M_√5.
- **Replication verdict.** A lattice at base b is called *replicated in this sample* only if all four hold:
  - p_b < 0.025;
  - the lower end of the ε̂_b interval exceeds ε_null95;
  - BIC(M_b) < BIC(M_mix(K*)) − 10;
  - LR_b is not exceeded by the other base's LR when that base also passes the first three. If it is, the verdict reads "a modulation is present but the base is not identified".

  Otherwise: **not replicated**. Synthetic self-test with n = 2500 and too few replicates to reach p < 0.025:
  - with no modulation, both bases pass none of the conditions;
  - with a √5 modulation of ε = 0.3, ε̂_√5 = 0.52 (95 % CI 0.37–0.59) and ε̂_φ = 0.20. Both p values sit at the floor of that small bootstrap.
- **Even if replicated.** The result reads "a candidate log-periodic feature in the TOI sample". It is **not** a physical discovery, and **not** a confirmation of FBS3R, until an independent population replicates it.
- **Continuity.** The Rayleigh Z for φ and √5 with the first protocol's null is reported, descriptive only.

## What this cannot show
- The TOI sample is a candidate list with false positives and a selection unlike the confirmed table's.
- A negative result here says nothing about other populations.
- A positive result here, alone, is not physics.
