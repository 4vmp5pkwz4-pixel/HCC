# Closed-S3 canonical VDE: pinned CLASS validation report

Status: **PASS**

This report records the first executed closed-S3 transfer calculation for the declared canonical VDE lift. It does not claim valuation-to-source derivation or observational preference.

## Reproducibility identity

- CLASS repository: `lesgourg/class_public`
- Exact CLASS commit: `e85808324f51fc694d12e3ed7439552a3c3f9540`
- classy version: `v3.3.4`
- GitHub Actions validation run: `31317455269`
- Validation artifact ID: `9039186688`
- Artifact SHA-256: `bc6ed58bf5cc6da1d57d576a072903203273f6e70e9b94dd6cffd919a8547a86`
- Runner: Ubuntu 22.04, Python 3.11, gcc 11.4

## Physical fixture

Common parameters:

- `h = 0.674`
- `omega_b = 0.02237`
- `omega_cdm = 0.1200`
- `Omega_k = -0.01` (closed geometry)
- `A_s = 2.10e-9`
- `n_s = 0.965`
- `tau_reio = 0.0544`
- scalar multipoles through `l_max = 1200`

Canonical VDE fixture:

- `Omega_X = Omega_fld = 0.05`
- `w0_fld = -2/3`
- `wa_fld = 0`
- `cs2_fld = 1`
- `use_ppf = no`

The CLASS budget then changes `Omega_Lambda` from `0.6965081451331661` in the curved-LCDM control to `0.6465081451331661` in the VDE fixture.

## Closed-S3 mode normalization

For the convention

`-Delta Y_n = n(n+2) K Y_n`, `n >= 2` for physical scalar modes,

the first mode should satisfy `k_2 = sqrt(8 K)`.

Executed transfer grid:

- expected first physical scalar `k/h = 9.434617346998738e-05 h/Mpc`
- actual CLASS transfer minimum `k/h = 9.434558380456046e-05 h/Mpc`
- relative difference `6.250019531583995e-06`

Result: **PASS**.

## Transfer-source presence

The executed VDE transfer table contains all required source columns:

- `d_fld`
- `t_fld`
- `phi`
- `psi`
- `k (h/Mpc)`

Result: **PASS**.

## Default versus cl_permille convergence

95th-percentile absolute fractional shifts, ell=30...1000 for CMB:

| quantity | curved control | VDE |
|---|---:|---:|
| TT | 1.020727974916924e-3 | 1.0798049920246466e-3 |
| EE | 3.162282642059644e-4 | 2.87065185823443e-4 |
| P(k) | 4.192056178594624e-5 | 2.7960584226848858e-5 |

Declared convergence tolerance was `5e-3` for each p95 statistic.

Result: **PASS**.

## Null-limit validation

Two complementary tests were used at common `cl_permille` precision.

### A. Physical endpoint versus exact-zero curved-LCDM control

At `Omega_X = 1e-8`:

- TT p95 = `5.162759771581982e-06`
- EE p95 = `5.150973739320719e-06`
- P(k) p95 = `1.3883011733253344e-04`

Declared tolerances: `2e-5`, `2e-5`, `5e-4`, respectively.

Result: **PASS**.

The larger P(k) residual relative to TT/EE is a small solver-branch floor caused by comparing an active fluid species with an exactly absent species. It remains below the predeclared sub-permil endpoint tolerance.

### B. Same-code-path continuity

A fluid-active anchor `Omega_X = 1e-12` was added so that the species remains present on both sides of the comparison.

At `Omega_X = 1e-8` versus the `1e-12` anchor:

- TT p95 = `4.970103861745567e-06`
- EE p95 = `4.013587893814119e-06`
- P(k) p95 = `8.154258580833529e-06`

The p95 residuals contract from `Omega_X=1e-4` to `1e-8` in TT, EE, and P(k).

Result: **PASS**.

## First physical VDE transfer signal

For the deliberately visible test amplitude `Omega_X=0.05`, relative to curved LCDM with the same other base parameters:

- TT, ell=30...1000: p95 `1.8676674657166215%`, max `2.0450401545116792%`
- EE, ell=30...1000: p95 `3.291850941003405%`, max `3.5895877039913815%`
- linear P(k), z=0: p95 `2.0181746078802354%`, max `2.020288520115321%`
- sigma8: `0.8310478481261421 -> 0.8226385363079651`, a fractional shift of approximately `-1.0119%`

These numbers are **not a likelihood result**. They are the first validated transfer-level response of the declared numerical fixture.

## Validation conclusion

All predeclared checks passed in run `31317455269`.

The numerical status can therefore be promoted from `implementation supplied; execution pending` to:

> **closed-S3 canonical-VDE transfer execution validated for the stated CLASS fixture and precision ledger.**

This does not imply observational preference. A data likelihood/MCMC is a separate downstream layer and must preserve the reconstruction/source/amplitude/transfer/likelihood separation.
