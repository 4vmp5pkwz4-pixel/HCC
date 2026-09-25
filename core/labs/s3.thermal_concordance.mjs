import { defineLab } from '../contract.mjs';
import { STATUS } from '../status.mjs';
import { HCC_S3R, S3R } from '../atlas/extracted.mjs';
import { thermalConcordance } from '../cosmology/s3-thermal-concordance.mjs';

// The same typed numeric fields appear in the nested JSON result and as scalar
// outputs. The latter make output_units and the standard CSV export useful.
const GROUP_UNITS = {
  thermal: {
    Q_gamma_K4_per_Pa: 'K^4/Pa', T_gamma_K: 'K', T_nu_K: 'K',
    u_gamma_J_m3: 'J/m^3', p_gamma_Pa: 'Pa', R0_m: 'm', R0_Mpc: 'Mpc',
    R_at_z_m: 'm', eta_T: 'dimensionless', volume_m3: 'm^3',
    photon_number_density_m3: '1/m^3', N_gamma_total: 'photons',
    U_gamma_J: 'J', S_gamma_J_K: 'J/K'
  },
  densities: {
    rho_critical_kg_m3: 'kg/m^3', Omega_cb: 'dimensionless',
    Omega_gamma: 'dimensionless', Omega_nu_massless: 'dimensionless',
    Omega_nu_massive: 'dimensionless', Omega_nu_massive_at_z: 'dimensionless',
    Omega_de: 'dimensionless'
  },
  background: {
    E2: 'dimensionless', E: 'dimensionless', H_km_s_Mpc: 'km s^-1 Mpc^-1',
    w0: 'dimensionless', wa: 'dimensionless'
  },
  distances: {
    D_H_Mpc: 'Mpc', D_C_Mpc: 'Mpc', D_M_Mpc: 'Mpc',
    D_A_Mpc: 'Mpc', D_L_Mpc: 'Mpc', chi_rad: 'rad'
  },
  comparison: {
    observed_D_H_over_r_d: 'dimensionless', observed_D_M_over_r_d: 'dimensionless',
    distance_pair_correlation: 'dimensionless', observed_ratio: 'dimensionless'
  }
};
const SCALARS = Object.entries(GROUP_UNITS).flatMap(([group, fields]) =>
  Object.entries(fields).map(([name, unit]) => ({ name, group, unit })));
const nestedSchema = group => ({
  additionalProperties: false,
  properties: {
    ...Object.fromEntries(Object.entries(GROUP_UNITS[group]).map(([name, unit]) =>
      [name, { type: 'number', unit }])),
    ...(group === 'densities' ? { E2_terms: { type: 'object', additionalProperties: false,
      properties: Object.fromEntries(['cb', 'gamma', 'nu_massless', 'nu_massive', 'curvature', 'dark_energy']
        .map(name => [name, { type: 'number', unit: 'dimensionless' }])) } } : {}),
    ...(group === 'comparison' ? {
      z: { type: 'number', unit: 'redshift' }, query_z: { type: 'number', unit: 'redshift' },
      available: { type: 'boolean' }, source: { type: 'string' },
      model_ratio: { type: ['number', 'null'], unit: 'dimensionless' },
      difference: { type: ['number', 'null'], unit: 'dimensionless' },
      significance: { type: 'null' }, data_reuse: { type: 'string' }
    } : {})
  }
});

export default defineLab({
  id: 's3.thermal_concordance',
  title: 'Conditional round S³: thermal photons, homogeneous expansion and distances',
  status: STATUS.CONDITIONAL,
  model_id: 's3.closed_flrw.thermal_background',
  equation_ids: ['s3.photon_pressure', 's3.fermi_neutrino', 's3.friedmann_background',
    's3.curvature_radius', 's3.optical_distances', 's3.desi_lya_ratio'],
  summary: 'Connects measured/input H0, Omega_m and CMB temperature to thermal energy density, '
    + 'an assumed closed FLRW background and predicted distances. S³ is conditional; this is '
    + 'neither a topology detection nor a full fit to the cosmological data.',
  formulas: [
    'Q_gamma = c^3 hbar^3/k_B^4; u_gamma = pi^2 T^4/(15 Q_gamma); p_gamma = u_gamma/3',
    'V_S3 = 2 pi^2 R^3; n_gamma = 2 zeta(3)/pi^2 (k_B T/(hbar c))^3; N_gamma = 4 zeta(3) eta_T^3; S_gamma = 4 u_gamma V_S3/(3 T)',
    'rho_crit = 3 H0^2/(8 pi G); Omega_gamma = u_gamma(0)/(rho_crit c^2)',
    'Omega_m = Omega_cb + Omega_nu,massive(0); Omega_de = 1-Omega_k-Omega_m-Omega_gamma-Omega_nu,massless',
    'I(y) = integral_0^infinity q^2 sqrt(q^2+y^2)/(exp(q)+1) dq; y=m_nu c^2/(k_B T_nu)',
    'E(a)^2 = Omega_cb/a^3 + Omega_gamma/a^4 + Omega_nu,massless/a^4 + Omega_nu,massive(a) + Omega_k/a^2 + Omega_de a^[-3(1+w0+wa)] exp[3 wa(a-1)]',
    'R0 = c/(H0 sqrt(-Omega_k)); eta_T = k_B T_gamma R/(hbar c)',
    'D_C = (c/H0) integral_0^z dz/E(z); D_M = R0 sin(D_C/R0); D_A = D_M/(1+z); D_L = (1+z)D_M',
    'DESI comparison at z=2.33: D_H/D_M versus (D_H/r_d)/(D_M/r_d) = 8.600/39.32; r_d cancels'
  ],
  assumptions: [
    'round, simply connected S³ geometry with Omega_k < 0 is imposed as a hypothesis',
    'defaults H0 and Omega_m are DESI DR2 model-dependent marginals; Omega_k default is the atlas S3R conditional median of an approximated 1D marginal, not a joint posterior sample',
    'homogeneous FLRW expansion; photons blackbody, one massive thermal neutrino species and N_eff-1 effectively massless species',
    'w0-wa CPL dark energy; Omega_m includes the present massive neutrino; Omega_de is fixed by present-day closure',
    'DESI ratio is a descriptive within-data comparison: default H0 and Omega_m reuse the Ly-alpha data; the measured distance pair has correlation 0.225 but its cross-covariance with fitted inputs is unavailable'
  ],
  domain_of_validity: [
    '0 <= z <= 10000; 20 <= H0 <= 120 km/s/Mpc; -1 <= Omega_k < 0; densities nonnegative',
    'm_nu_eV must equal 0 (all effective neutrinos treated as radiation) or lie in [0.01,2] eV so the massive species is nonrelativistic today',
    'all derived global totals must remain finite in float64; extremely small |Omega_k| is refused instead of returned as Infinity',
    'distances only before the first S³ antipode; E(z)^2 must stay positive throughout the integral',
    'thermal neutrino background, not a perturbation/recombination or structure-growth prediction'
  ],
  falsifiers: [
    'a credible joint topology analysis rules out the imposed round S³ model',
    'a jointly covariant BAO/CMB likelihood excludes its background predictions',
    'the distance duality, present closure or neutrino limiting scalings fail for the declared equations'
  ],
  verifiers: ['node --test test/s3-thermal-concordance.test.mjs'],
  open_problems: [
    'topology: round S³ is a conditional model; matched circles, eigenmodes and a topology likelihood remain uncomputed',
    'joint likelihood/cross-covariance with DESI-derived inputs is needed for an independent significance or posterior statement',
    'perturbations, recombination, CMB angular spectra, growth and parameter sampling require independent solvers'
  ],
  cost_hint: 'fast',
  max_sweep_points: 128,
  strict_inputs: true,
  inputs: [
    { name: 'z', type: 'number', unit: 'redshift', default: 2.33, min: 0, max: 10000,
      doc: 'redshift; the DESI Lyα within-data ratio is available only at z=2.33' },
    { name: 'H0_km', type: 'number', unit: 'km s^-1 Mpc^-1', default: HCC_S3R.H0_km, min: 20, max: 120,
      doc: 'DESI DR2 joint-model Hubble input by default, not an independently determined topology parameter' },
    { name: 'Omega_m', type: 'number', unit: 'dimensionless', default: HCC_S3R.Omega_m, min: 0, max: 1.5,
      doc: 'total present matter, including the thermal massive-neutrino species' },
    { name: 'Omega_k', type: 'number', unit: 'dimensionless', default: S3R.Ok, min: -1, max: 0,
      schema: { exclusiveMaximum: 0 },
      doc: 'must be strictly negative; default is the conditional closed-branch median, not the observed central value' },
    { name: 'T_cmb', type: 'number', unit: 'K', default: HCC_S3R.T_cmb, min: 0.1, max: 10,
      doc: 'current blackbody photon temperature (Fixsen)' },
    { name: 'N_eff', type: 'number', unit: 'effective species', default: HCC_S3R.N_eff, min: 1, max: 10,
      doc: 'one thermal massive species plus N_eff-1 effective massless species' },
    { name: 'm_nu_eV', type: 'number', unit: 'eV/c^2', default: 0.06, min: 0, max: 2,
      schema: { anyOf: [{ const: 0 }, { minimum: 0.01, maximum: 2 }] },
      doc: '0 for all massless species, or 0.01–2 for one species nonrelativistic today; intermediate masses refused' },
    { name: 'w0', type: 'number', unit: 'dimensionless', default: -1, min: -3, max: 1,
      doc: 'CPL dark-energy equation-of-state intercept' },
    { name: 'wa', type: 'number', unit: 'dimensionless', default: 0, min: -3, max: 3,
      doc: 'CPL dark-energy evolution coefficient' }
  ],
  outputs: [
    { name: 'thermal', type: 'object', unit: null, schema: nestedSchema('thermal'),
      doc: 'Q_gamma [K^4/Pa], T [K], u_gamma [J/m^3], p_gamma [Pa], R [m,Mpc], eta_T [1], S³ volume [m^3], photon density [m^-3], global count [1], energy [J], entropy [J/K]' },
    { name: 'densities', type: 'object', unit: null, schema: nestedSchema('densities'),
      doc: 'critical mass density [kg/m^3], dimensionless present Omega_i and E² contributions at z' },
    { name: 'background', type: 'object', unit: null, schema: nestedSchema('background'),
      doc: 'dimensionless E and E², H(z) [km/s/Mpc], CPL parameters' },
    { name: 'distances', type: 'object', unit: null, schema: nestedSchema('distances'),
      doc: 'comoving radial/transverse, Hubble, angular and luminosity distances [Mpc], chi [rad]' },
    { name: 'comparison', type: 'object', unit: null, schema: nestedSchema('comparison'),
      doc: 'DESI Lyα distance pair and published correlation; available=false and model ratio/difference null away from z=2.33; significance always null' },
    ...SCALARS.map(({ name, group, unit }) => ({ name, unit,
      doc: `Scalar ${group}.${name}; also available in the structured ${group} result` }))
  ],
  evaluate(inputs) {
    const result = thermalConcordance(inputs);
    return {
      outputs: { thermal: result.thermal, densities: result.densities,
        background: result.background, distances: result.distances, comparison: result.comparison,
        ...Object.fromEntries(SCALARS.map(({ name, group }) => [name, result[group][name]])) },
      warnings: result.caveats,
      diagnostics: result.provenance
    };
  },
  selftests: [
    { name: 'global photon count agrees with the original atlas reconstruction and stays constant',
      run(L) { const a = L.run({ z: 0 }, { provenance: {} }).outputs.thermal;
        const b = L.run({ z: 1 }, { provenance: {} }).outputs.thermal;
        const atlas = S3R.inputs.published.N_gamma;
        const err = Math.abs(a.N_gamma_total / atlas - 1);
        return { pass: err < 1e-10 && Math.abs(b.N_gamma_total / a.N_gamma_total - 1) < 1e-12,
          detail: `N_gamma=${a.N_gamma_total.toExponential(8)} versus atlas ${atlas.toExponential(8)}; relative error ${err}` }; } },
    { name: 'photon pressure and temperature scaling obey the blackbody identities',
      run(L) { const a = L.run({ z: 0 }, { provenance: {} }).outputs.thermal;
        const b = L.run({ z: 1 }, { provenance: {} }).outputs.thermal;
        const err = Math.abs(b.u_gamma_J_m3 / a.u_gamma_J_m3 - 16);
        return { pass: err < 1e-12 && Math.abs(a.p_gamma_Pa / a.u_gamma_J_m3 - 1 / 3) < 1e-12,
          detail: `u(1)/u(0)=${b.u_gamma_J_m3 / a.u_gamma_J_m3}; p/u=${a.p_gamma_Pa / a.u_gamma_J_m3}` }; } },
    { name: 'normalisation closes at present for changed H0 and temperature',
      run(L) { const o = L.run({ z: 0, H0_km: 72, T_cmb: 2.73 }, { provenance: {} }).outputs;
        const t = o.densities.E2_terms;
        const sum = Object.values(t).reduce((a, b) => a + b, 0);
        return { pass: Math.abs(sum - 1) < 1e-12 && Math.abs(o.background.H_km_s_Mpc - 72) < 1e-12,
          detail: `sum Omega_i=${sum}; H(0)=${o.background.H_km_s_Mpc}` }; } },
    { name: 'round-S³ projection and distance duality are reproduced',
      run(L) { const o = L.run({ z: 2.33 }, { provenance: {} }).outputs;
        const d = o.distances, R = o.thermal.R0_Mpc;
        const projection = Math.abs(d.D_M_Mpc / (R * Math.sin(d.D_C_Mpc / R)) - 1);
        const duality = Math.abs(d.D_L_Mpc / (3.33 ** 2 * d.D_A_Mpc) - 1);
        return { pass: projection < 1e-12 && duality < 1e-12,
          detail: `projection residual=${projection}; distance-duality residual=${duality}` }; } },
    { name: 'open geometry is refused and comparison contains no fictitious significance',
      run(L) { let refused = false;
        try { L.run({ Omega_k: 0.002 }, { provenance: {} }); }
        catch (e) { refused = e.code === 'DOMAIN_ERROR'; }
        const comparison = L.run({}, { provenance: {} }).outputs.comparison;
        return { pass: refused && comparison.significance === null,
          detail: `open refused=${refused}; significance=${comparison.significance}` }; } }
  ]
});
