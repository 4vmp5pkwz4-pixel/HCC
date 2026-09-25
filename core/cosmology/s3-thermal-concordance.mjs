/* Homogeneous FLRW forward model on a round S³. These inputs describe a
   conditional branch, not an observation of the global spatial topology. */
import { HCC_S3C, HCC_S3R, S3R } from '../atlas/extracted.mjs';
import { domainError } from '../contract.mjs';

const { c, G, kB, hbar, Mpc, zeta3 } = HCC_S3C;
const ELECTRON_VOLT_J = 1.602176634e-19; // exact SI definition of the electron volt
const TN_OVER_TG = Math.cbrt(4 / 11);
const I0 = 7 * Math.PI ** 4 / 120;
const I2 = 1.5 * zeta3;

/* For positive y, integrate q² sqrt(q²+y²)/(exp(q)+1). The q>40 tail is
   below 1e-12 relative for this range; using exp(-q) avoids overflow. */
export function fermiEnergyIntegral(y) {
  if (!Number.isFinite(y) || y < 0) throw domainError('m/(k_B T_nu) must be finite and nonnegative');
  if (y === 0) return I0;
  const n = 512, h = 40 / n;
  const integrand = q => {
    const e = Math.exp(-q);
    return q * q * Math.hypot(q, y) * e / (1 + e);
  };
  let sum = integrand(0) + integrand(40);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * integrand(i * h);
  return sum * h / 3;
}

const INPUTS = Object.freeze({
  z: 2.33,
  H0_km: HCC_S3R.H0_km,
  Omega_m: HCC_S3R.Omega_m,
  Omega_k: S3R.Ok,
  T_cmb: HCC_S3R.T_cmb,
  N_eff: HCC_S3R.N_eff,
  m_nu_eV: 0.06,
  w0: -1,
  wa: 0
});

const BOUNDS = Object.freeze({
  z: [0, 10000], H0_km: [20, 120], Omega_m: [0, 1.5],
  Omega_k: [-1, 0], T_cmb: [0.1, 10], N_eff: [1, 10],
  m_nu_eV: [0, 2], w0: [-3, 1], wa: [-3, 3]
});

function checkedInputs(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options))
    throw domainError('options must be an object');
  for (const name of Object.keys(options))
    if (!Object.hasOwn(INPUTS, name)) throw domainError(`unknown input "${name}"`);
  const inputs = { ...INPUTS, ...options };
  for (const [name, value] of Object.entries(inputs)) {
    const [minimum, maximum] = BOUNDS[name];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum)
      throw domainError(`${name} must be a finite number in [${minimum}, ${maximum}]`);
  }
  if (!(inputs.Omega_k < 0))
    throw domainError('a round S³ FLRW model requires Omega_k < 0');
  if (inputs.m_nu_eV > 0 && inputs.m_nu_eV < 0.01)
    throw domainError('neutrino mass must be zero or at least 0.01 eV here: Omega_m includes a cold massive species at z=0');
  return inputs;
}

const positive = (value, name) => {
  if (!Number.isFinite(value) || value <= 0) throw domainError(`${name} must be positive and finite`);
  return value;
};

export function thermalConcordance(options = {}) {
  const inputs = checkedInputs(options);
  const { z, H0_km, Omega_m, Omega_k, T_cmb, N_eff, m_nu_eV, w0, wa } = inputs;
  const H0_SI = H0_km * 1000 / Mpc;
  const rhoCritical_kg_m3 = 3 * H0_SI ** 2 / (8 * Math.PI * G);
  const criticalEnergy_J_m3 = rhoCritical_kg_m3 * c ** 2;
  const Q_gamma_K4_per_Pa = c ** 3 * hbar ** 3 / kB ** 4;
  const uGamma0 = Math.PI ** 2 * T_cmb ** 4 / (15 * Q_gamma_K4_per_Pa);
  const Omega_gamma = uGamma0 / criticalEnergy_J_m3;
  const Omega_nu_massless = (N_eff - (m_nu_eV > 0 ? 1 : 0)) * 7 / 8 * TN_OVER_TG ** 4 * Omega_gamma;
  const Tnu0 = TN_OVER_TG * T_cmb;
  const nuPrefactor = (kB * Tnu0) ** 4 / (Math.PI ** 2 * hbar ** 3 * c ** 3 * criticalEnergy_J_m3);
  const y0 = m_nu_eV * ELECTRON_VOLT_J / (kB * Tnu0);
  const Omega_nu_massive = m_nu_eV > 0 ? nuPrefactor * fermiEnergyIntegral(y0) : 0;
  const Omega_cb = Omega_m - Omega_nu_massive;
  const Omega_de = 1 - Omega_k - Omega_m - Omega_gamma - Omega_nu_massless;
  if (Omega_cb < 0 || Omega_de < 0)
    throw domainError('density closure requires nonnegative cold matter and dark energy',
      { Omega_cb, Omega_de });

  const E2 = zz => {
    const a = 1 / (1 + zz), x = 1 + zz;
    const Omega_nu_massive_at_z = m_nu_eV > 0 ?
      nuPrefactor * x ** 4 * fermiEnergyIntegral(y0 / x) : 0;
    const deFactor = a ** (-3 * (1 + w0 + wa)) * Math.exp(3 * wa * (a - 1));
    const terms = {
      cb: Omega_cb * x ** 3,
      gamma: Omega_gamma * x ** 4,
      nu_massless: Omega_nu_massless * x ** 4,
      nu_massive: Omega_nu_massive_at_z,
      curvature: Omega_k * x ** 2,
      dark_energy: Omega_de * deFactor
    };
    const total = Object.values(terms).reduce((sum, value) => sum + value, 0);
    return { total: positive(total, 'E(z)^2'), terms, Omega_nu_massive_at_z };
  };

  const atZ = E2(z);
  const E = Math.sqrt(atZ.total);
  const R0_m = c / (H0_SI * Math.sqrt(-Omega_k));
  const R0_Mpc = R0_m / Mpc;
  const scale = 1 + z;
  const u_gamma_J_m3 = uGamma0 * scale ** 4;
  const eta_T = kB * (T_cmb * scale) * (R0_m / scale) / (hbar * c);
  const volume_m3 = 2 * Math.PI ** 2 * (R0_m / scale) ** 3;
  const photon_number_density_m3 = 2 * zeta3 / Math.PI ** 2 *
    (kB * T_cmb * scale / (hbar * c)) ** 3;
  const N_gamma_total = photon_number_density_m3 * volume_m3;
  const U_gamma_J = u_gamma_J_m3 * volume_m3;
  const S_gamma_J_K = 4 * U_gamma_J / (3 * T_cmb * scale);
  for (const [name, value] of Object.entries({
    R0_m, R0_Mpc, eta_T, volume_m3, photon_number_density_m3,
    N_gamma_total, U_gamma_J, S_gamma_J_K
  })) if (!Number.isFinite(value) || value <= 0)
    throw domainError(`${name} must remain finite and positive in float64; increase |Omega_k|`);
  const DH0 = c / 1000 / H0_km;
  // Uniform steps in ln(1+z) resolve both the nearby and radiation eras.
  const n = 512, h = Math.log1p(z) / n;
  let sum = 0;
  if (z > 0) {
    sum = 1 / Math.sqrt(E2(0).total) + scale / E;
    for (let i = 1; i < n; i++) {
      const x = Math.exp(i * h);
      sum += (i % 2 ? 4 : 2) * x / Math.sqrt(E2(x - 1).total);
    }
  }
  const D_C_Mpc = DH0 * h * sum / 3;
  const chi = D_C_Mpc / R0_Mpc;
  if (chi >= Math.PI) throw domainError('radial geodesic crosses the first S³ antipode');
  const D_M_Mpc = R0_Mpc * Math.sin(chi);
  const D_H_Mpc = DH0 / E;
  const observedRatio = 8.600 / 39.32;
  const comparison = {
    z: 2.33,
    query_z: z,
    available: z === 2.33,
    source: 'DESI DR2 Results IV, arXiv:2607.27410v3, Equation 26 at z=2.33',
    observed_D_H_over_r_d: 8.600,
    observed_D_M_over_r_d: 39.32,
    distance_pair_correlation: 0.225,
    observed_ratio: observedRatio,
    model_ratio: z === 2.33 ? D_H_Mpc / D_M_Mpc : null,
    difference: z === 2.33 ? D_H_Mpc / D_M_Mpc - observedRatio : null,
    significance: null,
    data_reuse: 'The default H0 and Omega_m use the same DESI Lyα data; the joint cross-covariance with fitted inputs is unavailable. r_d cancels in this ratio.'
  };
  return {
    status: 'CONDITIONAL', inputs,
    densities: {
      rho_critical_kg_m3: rhoCritical_kg_m3,
      Omega_cb, Omega_gamma, Omega_nu_massless, Omega_nu_massive,
      Omega_nu_massive_at_z: atZ.Omega_nu_massive_at_z,
      Omega_de, E2_terms: atZ.terms
    },
    thermal: {
      Q_gamma_K4_per_Pa, T_gamma_K: T_cmb * scale, T_nu_K: Tnu0 * scale,
      u_gamma_J_m3, p_gamma_Pa: u_gamma_J_m3 / 3,
      R0_m, R0_Mpc, R_at_z_m: R0_m / scale, eta_T,
      volume_m3, photon_number_density_m3,
      N_gamma_total, U_gamma_J, S_gamma_J_K
    },
    background: { E2: atZ.total, E, H_km_s_Mpc: H0_km * E, w0, wa },
    distances: {
      D_H_Mpc, D_C_Mpc, D_M_Mpc,
      D_A_Mpc: D_M_Mpc / scale, D_L_Mpc: D_M_Mpc * scale, chi_rad: chi
    },
    comparison,
    provenance: {
      curvature_input: 'S3R.Ok: median of a Gaussian approximation to the DESI 1D curvature marginal, conditioned on Omega_k < 0',
      observational_inputs: 'DESI DR2 arXiv:2607.27410v3 Table 3 and Equation 26; T_cmb Fixsen arXiv:0911.1955',
      constants: 'HCC_S3C extracted verbatim from index.html',
      neutrinos: m_nu_eV > 0
        ? 'one massive thermal species and N_eff-1 effective massless species; 512-panel Simpson on q in [0,40]'
        : 'm_nu_eV=0: all N_eff effective species assigned to radiation; no massive-neutrino matter term'
    },
    caveats: [
      'S³ topology is a conditional assumption, not an observed detection; the published central Omega_k is positive.',
      '1.39% is a tail in an approximate one-dimensional Gaussian marginal, not a probability of S³ topology.',
      'The distance-pair correlation is known; cross-covariance with reused fitted parameters and a joint likelihood are absent, so the ratio difference has no significance here. The sound horizon cancels.',
      'No topology likelihood, CMB transfer functions or perturbation solver is provided.',
      'Neutrino background uses a one-massive-species thermal approximation rather than a Boltzmann hierarchy.'
    ]
  };
}
