# S³ and DESI Lyα distance covariance — design

## Scope

Extend the existing conditional round-S³ homogeneous FLRW model with one
traceable observational layer. DESI DR2 Results IV, arXiv:2607.27410v3,
Equation 26 reports the *joint* distance vector at z=2.33. The new instrument
maps the existing S³ forward distances and an explicitly supplied drag-epoch
sound horizon `r_d_Mpc` to that vector and evaluates a bivariate Gaussian
approximation to the published distance contour. This is a likelihood term
for that pair, not a full DESI likelihood or evidence for spatial topology.

## Observations and boundaries

The single versioned record `DESI_DR2_LYA_EQ26` has order
`[D_M/r_d, D_H/r_d]`, mean `[39.32, 8.600]`, errors `[0.33, 0.066]`,
correlation `0.225`, and covariance `[[0.1089, 0.0049005],
[0.0049005, 0.004356]]`. Cite the primary paper and its equation, with an
explicit note that a Gaussian in the two summarized distances approximates
the full profile likelihood. Store no invented cross-covariance with
cosmological parameters. Do not include the paper's separately derived AP
ratio as another independent measurement.

`distancePairGaussian({D_M_Mpc,D_H_Mpc,r_d_Mpc})` is a pure function: accept
finite positive distances and `r_d`, return measured and predicted pairs,
residuals, covariance, χ² and `log_likelihood_relative=-χ²/2`, observation
identifier and provenance. Reject invalid or overflowing values. The full
normalization of the likelihood is unnecessary for the relative score.

The agent-facing `s3.lya_distance_likelihood` lab consumes an explicit,
required `r_d_Mpc` and the already declared S³ background parameters; it
runs `thermalConcordance({z:2.33,...})`, then the pure observational score.
The sound horizon must not be silently supplied by the background solver.
No significance in σ, posterior, confidence in topology, or independent
validation is returned. DESI DR2 Lyα was reused in the default H₀, Ωₘ and
Ω_K inputs, so χ² at those defaults is an in-sample likelihood value; the
unknown cross-covariance prevents an independent goodness-of-fit claim.
Allow external parameter sets but never assert their independence based on
unverifiable caller statements. Retain the earlier descriptive ratio with
`significance:null` in `s3.thermal_concordance`.

## Interfaces and acceptance

New modules: `core/cosmology/desi-dr2-lya.mjs` (source data and Gaussian
score) and `core/labs/s3.lya_distance_likelihood.mjs` (agent contract).
Use pure ESM, the existing status taxonomy, nested typed output schemas and
flat numeric CSV outputs, and cap synchronous sweeps at 64. Register the lab,
update the code hash and core release, regenerate machine descriptions, and
document how to run it in `docs/S3_THERMAL_CONCORDANCE.md`.

Tests must use a hand-calculated positive-covariance example (including a
nonzero off-diagonal effect), exact zero residual, refusal of invalid or
non-finite inputs, required `r_d`, the unchanged ratio caveat, and the real
CORE/API contract. Run the focused tests, core checks and project checks.

## Later science

The term above is one two-dimensional summarized measurement. Full DESI
correlations, calibrated `r_d` from recombination/BBN, CMB spectra, growth,
spatial-mode projections, cross-dataset covariances, priors and joint
sampling are separate steps. No current instrument determines every true
physical parameter of the Universe or establishes its topology.
