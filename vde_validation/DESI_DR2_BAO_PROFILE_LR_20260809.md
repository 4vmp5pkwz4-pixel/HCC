# DESI DR2 BAO-only canonical VDE profile-likelihood pilot

Status: **executed constrained profile-likelihood comparison; conditional pilot only**.

Reproducibility:
- CLASS commit `e85808324f51fc694d12e3ed7439552a3c3f9540`
- classy `v3.3.4`
- Cobaya `3.6.2`
- official Cobaya likelihood `bao.desi_dr2`
- GitHub Actions run `31318231224`
- profile artifact `9039409443`
- artifact SHA-256 `d70655e0b3b4d5eb03aa47e43f2737216b86632fec2b893445b0bd9eadc513dd`

Scope is deliberately restricted: `Omega_k=-0.01` and `omega_b=0.02237` are fixed. The alternative samples/fits `Omega_X>=0`, `H0`, and `omega_cdm`; the null fixes `Omega_X=0` and fits the same nuisance background parameters.

## Maximum-likelihood alternative

- `Omega_X = 0.17454266`
- `H0 = 66.370266 km/s/Mpc`
- `omega_cdm = 0.10720240`
- `Omega_Lambda = 0.54121473`
- `Omega_m = 0.29414766`
- `r_drag = 150.63842 Mpc`
- `chi2_DESI_DR2_BAO = 9.2719895`

## Nested null Omega_X=0

- `H0 = 69.237633 km/s/Mpc`
- `omega_cdm = 0.12101367`
- `Omega_Lambda = 0.71081354`
- `Omega_m = 0.29909921`
- `r_drag = 146.84752 Mpc`
- `chi2_DESI_DR2_BAO = 10.636129`

Thus

`q_X = chi2_null - chi2_alt = 1.3641395`,

`sqrt(q_X) = 1.1679638`.

Using the one-sided Chernoff boundary calibration for a single nonnegative amplitude gives the asymptotic conditional pilot value

`p_one_sided = 0.12141068`,

corresponding to only about `1.17 sigma` in Gaussian one-sided language.

## Interpretation

This pilot therefore **does not provide significant evidence for Omega_X>0**. The BAO-only posterior can peak away from the boundary, but the improvement of the profiled likelihood is small once `H0` and `omega_cdm` are re-optimized.

This is not the final cosmological model comparison: CMB, supernovae, lensing, curvature freedom, the physical `Omega_2,val` direction, and the complete nuisance/covariance container are not included here.
