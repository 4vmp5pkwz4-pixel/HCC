# DESI DR2 BAO-only canonical VDE pilot posterior

Status: **real executed MCMC; conditional pilot only**.

This report analyzes the converged Cobaya chain produced with pinned CLASS
`e85808324f51fc694d12e3ed7439552a3c3f9540` (classy v3.3.4) and the official
Cobaya `bao.desi_dr2` BAO likelihood.

## Scope

Fixed:
- `Omega_k = -0.01`
- `omega_b = 0.02237`
- canonical VDE lift `w=-2/3`, `wa=0`, `cs2=1`, `use_ppf=no`

Sampled:
- `Omega_X = Omega_fld` in [0, 0.30]
- `H0` in [55, 85] km/s/Mpc
- `omega_cdm` in [0.08, 0.16]

This is **not** the final CMB+BAO+SNe+lensing likelihood and does not establish
observational preference for VDE.

## Cobaya convergence

The chain contains 1440 accepted states (compressed total weight 4760).
Cobaya stopped with:

- split-means `R-1 = 0.0154456`
- bounds `R-1 = 0.112452`
- final acceptance rate about 0.301

Both are inside the configured stopping thresholds 0.02 and 0.15.

## Posterior extraction

The numbers below discard the first 30% of stored accepted states and retain
Cobaya's multiplicity weights. This leaves 1008 rows with total weight 3393.
Burn-in sensitivity over 20%-50% was checked separately and is small compared
with the posterior width.

### Marginal constraints

| Parameter | mean ± std | median | 68% interval | 95% interval |
|---|---:|---:|---:|---:|
| Omega_X | 0.14746 ± 0.08149 | 0.14627 | [0.05272, 0.24054] | [0.00625, 0.28863] |
| H0 [km/s/Mpc] | 66.838 ± 1.337 | 66.816 | [65.285, 68.323] | [64.516, 69.181] |
| omega_cdm | 0.10938 ± 0.00753 | 0.10952 | [0.10139, 0.11720] | [0.09536, 0.12408] |
| Omega_Lambda | 0.56777 ± 0.07936 | 0.57215 | [0.47721, 0.65903] | [0.42960, 0.70590] |
| Omega_m | 0.29467 ± 0.00866 | 0.29463 | [0.28529, 0.30289] | [0.27841, 0.31298] |
| r_drag [Mpc] | 150.072 ± 2.133 | 149.977 | [147.853, 152.337] | [146.046, 154.152] |

Posterior mass near the boundary:

- P(Omega_X < 0.005) = 0.0177
- P(Omega_X < 0.01) = 0.0295
- P(Omega_X < 0.02) = 0.0584
- P(Omega_X < 0.05) = 0.1429
- P(Omega_X < 0.10) = 0.3280

These probabilities are prior- and fixture-dependent; they are not a frequentist
detection significance.

### Best sampled point

- Omega_X = 0.180533
- H0 = 66.2518 km/s/Mpc
- omega_cdm = 0.106339
- Omega_Lambda = 0.536137
- Omega_m = 0.293234
- r_drag = 150.887 Mpc
- chi2_DESI_DR2_BAO = 9.28318

A dedicated constrained profile-likelihood minimization is required before
turning the best sampled point into a boundary likelihood-ratio statement.

## Degeneracy structure

Weighted posterior correlations:

- corr(Omega_X, H0) = -0.9618
- corr(Omega_X, omega_cdm) = -0.8243
- corr(H0, omega_cdm) = +0.8766

Hence the apparent BAO-only support away from Omega_X=0 is highly degenerate
with the sampled background parameters. This is exactly why the result must not
be promoted to a model detection before adding the common CMB/SNe/lensing
container and allowing the broader curvature/amplitude ledger to vary.

## Burn-in sensitivity

For discarded fractions 20%, 30%, 40%, 50%:

- Omega_X posterior mean spans [0.14745, 0.14938]
- Omega_X median spans [0.14627, 0.14818]
- H0 mean spans [66.8015, 66.8381]
- omega_cdm mean spans [0.109334, 0.109501]

The posterior summary is therefore stable against this simple burn-in choice at
the level relevant for this pilot.
