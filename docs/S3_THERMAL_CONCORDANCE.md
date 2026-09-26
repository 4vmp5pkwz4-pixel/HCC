# Round S³ thermal concordance (conditional)

The machine ID `s3.thermal_concordance` links a homogeneous photon/neutrino
background to curvature radius, expansion and optical distances. Run it with
`CORE.run('s3.thermal_concordance', { z: 2.33 })` after importing `CORE` from
`core/index.mjs`; use `CORE.describe` for declared inputs, equations, units and
limits, or `CORE.validate` for the lab's consistency checks. A pure JavaScript
caller can import `thermalConcordance` from
`core/cosmology/s3-thermal-concordance.mjs`.
The result preserves nested groups (`thermal`, `densities`, `background`,
`distances`, `comparison`) and repeats numeric observables as scalar outputs
with explicit `output_units`; the standard CSV export includes the scalars.
The machine output schema gives units for nested fields as well. Sweeps are
limited to 128 points to bound synchronous server work.

## Input provenance and evidence

| Quantity | Default | Evidence and meaning |
| --- | ---: | --- |
| `H0_km` | 68.43 km/s/Mpc | [DESI DR2 Results IV, Table 3](https://arxiv.org/html/2607.27410v3), DESI+CMB+DES-Dovekie fit in ΛCDM+Ω_K, ±0.30 |
| `Omega_m` | 0.3050 | Same fit, ±0.0032; it includes massive neutrinos at z=0 |
| Measured marginal for `Omega_k` | +0.00220 ± 0.00100 | Same fit, **positive** central Ω_K, corresponding to open spatial curvature under the usual convention |
| Model `Omega_k` | −0.0002597483 | Existing HCC `S3R.Ok`: median of a Gaussian approximation to that **one-dimensional marginal**, truncated to Ω_K<0; a conditional S³ scenario |
| `T_cmb` | 2.72548 K | [Fixsen, *The Temperature of the Cosmic Microwave Background*](https://arxiv.org/abs/0911.1955), ±0.00057 K |
| `N_eff`, `m_nu_eV` | 3.044, 0.06 eV | Existing HCC atlas for N_eff; the published DESI fit fixes Σmν=0.06 eV; here one thermal species carries that mass and the other N_eff−1 are effectively massless |
| `w0`, `wa` | −1, 0 | Model choice of a cosmological constant within the CPL family, rather than independently measured values from a joint curved+CPL fit |

Physical constants and the reference curvature point are imported from the
atlas's generated `core/atlas/extracted.mjs`. The exact SI conversion
`1 eV = 1.602176634×10⁻¹⁹ J` is used for neutrino mass energy. Changing
an input computes a forward prediction; marginal central values and errors
are **not** an independent joint posterior over all the inputs.

The atlas's approximate one-dimensional Gaussian assigns 1.39% of its area
to Ω_K<0. This number is **not** the probability that the Universe is S³.
The finite simply connected S³ topology is imposed here, with no topology
likelihood or competing-topology evidence calculation.

## Computed relations

| Link | Equation | Result |
| --- | --- | --- |
| Fundamental constants → thermal scale | `Qγ = c³ ħ³/k_B⁴` | `Q_gamma_K4_per_Pa ≈ 8.6967595×10¹⁴ K⁴/Pa` |
| CMB temperature → photon gas | `uγ = π²T⁴/(15Qγ)`, `pγ=uγ/3`, `T(z)=T₀(1+z)` | `thermal.u_gamma_J_m3`, `thermal.p_gamma_Pa` |
| Hubble scale → critical density | `ρc = 3H₀²/(8πG)`, `Ωγ=uγ(0)/(ρc c²)` | `densities.rho_critical_kg_m3`, `densities.Omega_gamma` |
| Thermal neutrinos → matter budget | `I(y)=∫q²√(q²+y²)/(e^q+1)dq`, `y=mc²/(k_BTν)`, `Tν=(4/11)^(1/3)Tγ` | `Omega_nu_massive`, `Omega_nu_massless`, `Omega_cb=Omega_m−Omega_nu_massive` |
| Assumed curvature → sphere radius | `R₀=c/(H₀√(−Ω_K))`, `R(z)=R₀/(1+z)` | `thermal.R0_m`, `thermal.R0_Mpc`, `thermal.eta_T=k_B T(z)R(z)/(ħc)` |
| Finite sphere → global photon thermodynamics | `V=2π²R³`, `nγ=2ζ(3)/π²·(k_BT/ħc)³`, `Nγ=4ζ(3)η_T³`, `Uγ=uγV`, `Sγ=4Uγ/(3T)` | `thermal.volume_m3`, `N_gamma_total`, `U_gamma_J`, `S_gamma_J_K`; photon number and entropy remain constant in adiabatic expansion |
| Energy budget → expansion | `E²=Ωcb a⁻³+Ωγ a⁻⁴+Ων,rel a⁻⁴+Ων,m(a)+ΩK a⁻²+Ωde a⁻³⁽¹⁺ʷ⁰⁺ʷᵃ⁾ exp(3wa(a−1))` | `background.E`, `background.H_km_s_Mpc`; Ωde fixes `E(0)=1` |
| Expansion → optical distances | `D_C=(c/H₀)∫dz/E(z)`, `D_M=R₀ sin(D_C/R₀)`, `D_A=D_M/(1+z)`, `D_L=(1+z)D_M` | `distances.*_Mpc` and `chi_rad` |

The Fermi–Dirac momentum integral uses a 512-panel Simpson quadrature on
`q∈[0,40]`, with an analytical massless limit. Comoving distance uses
512 panels in `ln(1+z)` so the interval to `z=10,000` remains resolved
near the observer. Setting `m_nu_eV=0` assigns all effective neutrinos to
radiation; positive values below 0.01 eV are refused because the requested
`Omega_m` convention treats this species as matter today. Runs reject Ω_K≥0,
non-finite derived quantities (including almost-flat global volumes beyond
`float64`), negative component budgets, E²≤0,
and radial paths crossing the first S³ antipode.

## The DESI ratio

[DESI DR2 Results IV, Equation 26](https://arxiv.org/html/2607.27410v3)
gives `D_H/r_d = 8.600±0.066`, `D_M/r_d = 39.32±0.33` at `z=2.33`, with
correlation 0.225 between that pair. The ratio does **not** require a value
for the sound horizon: `D_H/D_M=(D_H/r_d)/(D_M/r_d)`. At defaults the model
gives approximately 0.221235, versus the observed ratio 0.218718. The
reported difference is approximately +0.002517.

This comparison reuses the Lyα measurements contributing to the default
`H0_km` and `Omega_m`. The published pair correlation does not give the
cross-covariance of the pair with those fitted parameters. The comparison
therefore returns `significance: null`; the numerical difference is **not**
an independent goodness-of-fit, a sigma tension, or a topology test. The
model returns `comparison.available: false` with null model ratio and
difference at other redshifts.

## The correlated DESI distance pair

The additional machine ID `s3.lya_distance_likelihood` scores the same
conditional S³ forward model against the *two-dimensional* DESI DR2 Lyα
distance summary, using the correlation actually reported in Equation 26.
The observations are versioned as `desi.dr2.lya_full_shape.eq26.v3` in
`core/cosmology/desi-dr2-lya.mjs`. In the order `(D_M/r_d, D_H/r_d)` the
measured vector is `(39.32, 8.600)` and the covariance is

```text
C = [[0.1089,    0.0049005],
     [0.0049005, 0.004356 ]].
```

The lab uses `χ²=(prediction−measurement)ᵀ C⁻¹ (prediction−measurement)`
and reports `log_likelihood_relative=−χ²/2`. This bivariate Gaussian is
an **approximation to the published distance contour**, not DESI's full
profile likelihood. The sound horizon `r_d_Mpc` is a required external
input; this homogeneous background does not predict the drag epoch.

```js
import { CORE } from './core/index.mjs';
const fit = CORE.run('s3.lya_distance_likelihood', { r_d_Mpc: 147 });
console.log(fit.outputs.observation.id, fit.outputs.chi2);
// Compare alternative conditional parameter points with CORE.sweep(...).
```

The result exposes measured and predicted vectors, residuals, covariance,
distance predictions in Mpc, scalar CSV fields, and source metadata. The
earlier ratio-only result retains `significance:null`. Here `χ²` is a
**within-sample likelihood value at supplied parameters**: the default
H₀, Ωₘ and Ω_K come from a fit that used these Lyα data. Their
cross-covariance with the distance pair is not published in this record.
Neither `χ²` nor its difference between a few hand-picked S³ points is
an independent significance, probability of S³, or Bayesian evidence;
`independent_significance` and `topology_evidence` remain `null`.

## Scope and next measurements

Status `CONDITIONAL` applies to the full lab: the blackbody and geometry
identities follow from their declared assumptions, while the round-S³
assumption is unverified. The solver gives a homogeneous FLRW background.
It does not calculate acoustic transfer functions, recombination, CMB
anisotropies, perturbation growth, inhomogeneities, baryon feedback or
topology-dependent matched circles. To constrain all these layers, attach
additional independent observation vectors and cross-dataset covariances;
calibrate `r_d` with baryon density and recombination; cross-check a curved
Boltzmann calculation; predict S³ eigenmodes/sky signatures; and fit
alternative topologies with explicit priors. The DESI Lyα pair alone has a
2×2 covariance here, not the full survey likelihood. No finite model can
establish every physical parameter as exactly known from current observations.
