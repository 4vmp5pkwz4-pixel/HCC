# S³ thermal and observational concordance — design

## Intent and boundary

Give HCC one reproducible path from sourced inputs to the late-time expansion,
round-S³ distances, and photon thermodynamics, including the combination
`c³ ħ³/k_B⁴`. A run must identify which values were measured, inferred under a
cosmological model, calculated from equations, or assumed as a closed-S³
scenario. No current data uniquely determine the topology or every parameter
of the Universe; the new instrument must never suggest otherwise.

This is the first independently testable part of a larger cosmology model.
Transfer functions, recombination, CMB anisotropy likelihoods, structure
growth, topology-dependent mode spectra, and joint posterior sampling require
additional solvers and data. The instrument must name these omissions in its
machine-readable contract and result.

## Grounded inputs

The existing atlas's `HCC_S3R` stores the DESI DR2 Lyα AP+BAO+CMB+DES-Dovekie
ΛCDM+Ω_K marginal: H₀=68.43±0.30 km/s/Mpc, Ω_m=0.3050±0.0032, and
10³Ω_K=+2.20±1.00 (DESI DR2 Results IV, arXiv:2607.27410v3, Table 3).
The positive curvature-parameter central value is an **open** geometry in the
standard Ω_K convention. The `S3R` point is a **conditional closed branch**
obtained by truncating a *Gaussian approximation to the one-dimensional
marginal* at Ω_K<0; 1.39% is Gaussian tail area, not the measured probability
of S³ topology. Cross-parameter covariance and a full joint posterior are not
supplied by this input table. The radiation temperature T₀=2.72548 K is taken
from Fixsen (arXiv:0911.1955), and c, k_B, ħ, G and Mpc conversion from the
already declared `HCC_S3C` block. Never construct a new independent constants
table or silently mix the historical R=548.3245 Gly/H₀=67.4 preset with the
current DESI scenario.

## Architecture and interfaces

`core/cosmology/s3-thermal-concordance.mjs` is a DOM-free ESM forward solver.
It imports `HCC_S3C`, `HCC_S3R` and `S3R` from
`core/atlas/extracted.mjs`, retaining one source for HCC's scenario. Export
`thermalConcordance({ z, H0_km, Omega_m, Omega_k, T_cmb, N_eff, m_nu_eV,
w0, wa })`. Defaults are the existing conditional branch, `N_eff=3.044`,
`m_nu_eV=0.06`, `w0=-1`, `wa=0`. The optional neutrino approximation is one
massive thermal species and `N_eff-1` effective massless species; the effective
count is not a full neutrino Boltzmann hierarchy. Ω_m includes the massive
neutrino density at z=0; compute Ω_cb by subtraction. Closure computes Ω_de
exactly once at z=0. Fail on inadmissible inputs, negative Ω_cb or Ω_de,
nonpositive E², and geodesic angular distance beyond the first antipode.

Compute the present radius `R0=c/(H0 sqrt(-Ω_k))` for Ω_k<0, the dimensionless
thermal-size ratio `η_T=k_B T R/(ħ c)`, and the Stefan-Boltzmann scale
`Qγ=c³ħ³/k_B⁴`. Photons satisfy
`uγ=π²T⁴/(15Qγ)` and `pγ=uγ/3` with T=T₀(1+z). For the finite sphere,
`V=2π²R³`, `nγ=2ζ(3)/π² (k_BT/(ħc))³`, `Nγ=4ζ(3)η_T³` and
`Sγ=4uγV/(3T)`; conserve photon number and entropy under adiabatic expansion.
For the homogeneous late-time
background use

`E²(a)=Ω_cb a⁻³+Ω_γ a⁻⁴+Ω_ν,rel a⁻⁴+Ω_ν,m(a)+Ω_k a⁻²+Ω_de f_de(a)`;
`f_de(a)=a^{-3(1+w0+wa)} exp(3wa(a-1))`.

For the massive thermal species, integrate the standard Fermi-Dirac
momentum integral at each a, preserving the a⁻⁴ ultrarelativistic and a⁻³
nonrelativistic limits. Declare the numerical quadrature and one-species
approximation in every result. Standard optical distances are
`D_C=(c/H0)∫₀ᶻ dz'/E(z')`, `D_M=R0 sin(D_C/R0)`, `D_A=D_M/(1+z)`, and
`D_L=(1+z)D_M`; output `D_H=c/H(z)` and the BAO ratio `D_H/D_M`. The
sound horizon r_d cancels in this ratio. Compare with the DESI DR2 Lyα
measurement at z=2.33, `(D_H/r_d)/(D_M/r_d)=8.600/39.32`, as a descriptive
within-data check. The pair has published correlation 0.225, but the default
H₀ and Ω_m also use DESI Lyα data; their cross-covariance with the measured
pair is unavailable. **Never report a σ or χ²** for this comparison or call it
independent validation.

`core/labs/s3.thermal_concordance.mjs` wraps the solver in the existing six-method
agent contract with status CONDITIONAL, units, equations, provenance, explicit
limitations and independent self-tests. Register it in `core/index.mjs`, update
the core hash inventory, and regenerate existing machine-facing artifacts with
`scripts/build-api.mjs`. `docs/S3_THERMAL_CONCORDANCE.md` documents assumptions,
primary-source links, status map, and the next science steps.

## Tests and acceptance

- Before implementation, failing tests in `test/s3-thermal-concordance.test.mjs`
  exercise SI scale/units, quartic photon energy/pressure, high/low neutrino
  limits, z=0 closure, R agreement with `S3R`, expansion normalization,
  exact distance duality and numerical integral, flat-limit behavior, a
  DESI ratio comparison explicitly without a likelihood, and refused inputs.
- Core lab metadata must be exposed through `CORE.describe`, `CORE.run`, and
  generated public descriptions. No probability of topology, full CMB fit, or
  physically detected S³ appears as a result.
- Run `node --test test/s3-thermal-concordance.test.mjs`, `npm test`,
  `node test/run-tests.mjs`, and the generated-artifact drift checks. Report
  any pre-existing or remaining failures by name.

## Further model layers

1. A versioned observations registry with raw data, covariances, likelihood
   contracts and multiple independent measurements of expansion and growth.
2. A documented CLASS/CAMB-based perturbation and recombination calculation
   on curved FLRW backgrounds, with Boltzmann-code cross-checks.
3. Round-S³ mode projection, polarization and matched-circle predictions,
   including selection effects and a topology likelihood against alternatives.
4. Joint sampling of curvature, w₀, wₐ, neutrino parameters and calibration,
   with priors, posterior predictive checks and evidence reported separately.
