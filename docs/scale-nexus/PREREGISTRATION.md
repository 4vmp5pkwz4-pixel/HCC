# Preregistration — a golden lattice in measured radii? (HCC Scale Nexus, v4.441)

Committed to `feature/scale-nexus` **before** any statistic below was computed on the data named here. The commit that adds
this file and `scripts/golden-lattice-test.mjs` precedes the commit that adds the results; the order is the git history.

## Hypothesis
- **H1 (log-periodicity at φ).** Operational radii of a physical population have rung phases N_φ − ⌊N_φ⌋,
  N_φ = ln(R/ℓ_P)/ln φ, concentrated beyond what the population's own smooth size distribution, its within-system
  correlations and its catalogue rounding produce.
- **H0.** They are not: the phases are what that null generator gives.
- The anchor ℓ_P only shifts the phase; the statistic is phase-invariant, so the anchor cannot be tuned.

## Population and radius (fixed now)
- NASA Exoplanet Archive, Planetary Systems Composite Parameters (`pscomppars`), as embedded in HCC v4.440 (`EXO_META.sha256`).
- All planets with discovery method `Transit` and a transit radius `pl_rade` > 0. R = pl_rade × 6.3781·10⁶ m (IAU nominal
  equatorial Earth radius). The transit radius is the operational definition.
- Families: host systems. Planets of one system are not independent ("peas in a pod").

## Split (fixed now)
- Holdout: hosts whose FNV-1a 32-bit hash of the host name is odd. Exploration: even.
- Exploration results are descriptive only. Every inferential statement is about the holdout.

## Statistics
- **Primary:** Z_φ = n·R̄², R̄ = |mean e^{2πi N_φ}| over holdout planets.
- **Secondary (base scan):** Z_max = max over 241 bases b log-spaced in [1.2, 3.0] (φ, 2 and e among them) of Z_b; its
  null distribution corrects for the scan. φ's rank among the bases is reported.
- **Effect:** R̄_φ with a 95 % interval from 2000 bootstrap resamples of host systems (family blocks).

## Null generator (fixed now)
1. System means μ_i of log₁₀R are drawn from a Gaussian kernel density of the holdout's system means, bandwidth 0.30 dex
   (wider than the φ period 0.209 dex, so that the null cannot contain the periodicity it is testing).
2. Within-system deviations are the holdout's own deviations from their system means, permuted across systems of equal size.
3. Each simulated radius is rounded in R⊕ to the decimal precision of a randomly chosen holdout value (0–3 decimals as found).
4. 2000 replicates, seed 4410 (mulberry32). p = (1 + #{null ≥ observed})/(1 + 2000).

## Decision
- α = 0.05 for the primary test. The scan p is reported, corrected.
- A positive result requires both the primary p < 0.05 and φ ranking first in the scan. Anything else is reported as no
  evidence for a golden lattice in this population.
- Negative and positive results are published alike.

## Prerequisites, on synthetic data only (before the holdout)
- **Calibration:** primary p-values under the null generator itself are ≈ uniform.
- **Power:** a fraction f of radii snapped to φ-rungs with phase jitter σ = 0.05 is injected into the exploration set.
  Detection rate at α = 0.05 is reported for f = 0.1, 0.2, 0.3.

## What this cannot show
- A null result for exoplanet radii says nothing about other populations.
- A positive result would need an independent population before it could be called physics.
- The atlas's curated catalogue (UCAT, PHI_ATLAS) gets **no** p-value: it is not a sample.
