import { defineLab } from '../contract.mjs';
import { STATUS } from '../status.mjs';
import { HCC_S3R, S3R } from '../atlas/extracted.mjs';
import { thermalConcordance } from '../cosmology/s3-thermal-concordance.mjs';
import { DESI_DR2_LYA_EQ26, distancePairGaussian } from '../cosmology/desi-dr2-lya.mjs';

const pairSchema = Object.freeze({ type: 'object', additionalProperties: false,
  required: ['D_M_over_rd', 'D_H_over_rd'], properties: {
  D_M_over_rd: { type: 'number', unit: 'dimensionless' },
  D_H_over_rd: { type: 'number', unit: 'dimensionless' }
} });
const matrixSchema = { type: 'array', minItems: 2, maxItems: 2,
  items: { type: 'array', minItems: 2, maxItems: 2, items: { type: 'number' } } };
const observationProperties = {
  id: { type: 'string' }, version: { type: 'string' }, source_url: { type: 'string' },
  source_location: { type: 'string' }, redshift: { type: 'number', unit: 'redshift' },
  order: { type: 'array', minItems: 2, maxItems: 2, items: { type: 'string' } },
  mean: { type: 'array', minItems: 2, maxItems: 2, items: { type: 'number', unit: 'dimensionless' } },
  sigma: { type: 'array', minItems: 2, maxItems: 2, items: { type: 'number', unit: 'dimensionless' } },
  correlation: { type: 'number', unit: 'dimensionless' },
  covariance: matrixSchema, likelihood_approximation: { type: 'string' }
};
const observationSchema = { type: 'object', additionalProperties: false,
  required: Object.keys(observationProperties), properties: observationProperties };
const REUSE = 'Default H0, Omega_m and Omega_k were inferred using the same DESI Lyα data. '
  + 'The pair covariance does not include cross-covariances with fitted parameters: '
  + 'this in-sample chi2 is a likelihood term, not an independent significance or topology evidence.';

export default defineLab({
  id: 's3.lya_distance_likelihood',
  title: 'Conditional S³ distances against the DESI DR2 Lyα two-distance contour',
  status: STATUS.CONDITIONAL,
  model_id: 's3.closed_flrw.desi_dr2_lya_pair',
  equation_ids: ['s3.friedmann_background', 's3.optical_distances', 'desi.dr2.lya.eq26.gaussian'],
  summary: 'At z=2.33 evaluates the published correlated DESI Lyα distance pair '
    + 'against a conditional S³ background. The caller must supply r_d explicitly; '
    + 'the Gaussian score is not evidence of topology or an independent validation of fitted defaults.',
  formulas: [
    'mu = (39.32, 8.600) = (D_M/r_d, D_H/r_d) at z=2.33; sigma = (0.33, 0.066); rho = 0.225',
    'C_ij = sigma_i sigma_j rho_ij; chi2 = (prediction-mu)^T C^-1 (prediction-mu)',
    'log_likelihood_relative = -chi2/2; D_M = R0 sin(D_C/R0); D_H = c/H(z)'
  ],
  assumptions: [
    'simply connected round S³ homogeneous FLRW with Omega_k < 0, using s3.thermal_concordance',
    'bivariate Gaussian approximation to the two DESI DR2 Lyα full-shape distance estimates in Equation 26',
    'an externally specified positive r_d_Mpc, not a recombination or BAO ruler calculation',
    'default H0, Omega_m and Omega_k reuse DESI Lyα, without cross-covariance to those fitted inputs'
  ],
  domain_of_validity: [
    'the published distance vector is at z=2.33 only; a new redshift needs a different observation',
    '0 < r_d_Mpc <= 10000; the forward solver also enforces its declared curvature and budget bounds',
    'a summarized distance-pair likelihood term, not the full DESI likelihood, a posterior or an independent topology test'
  ],
  falsifiers: [
    'the published order, correlation or uncertainties disagree with the versioned observation',
    'the closed-S³ forward distances cannot describe the observations under an independently calibrated ruler and a full joint likelihood'
  ],
  verifiers: ['node --test test/s3-lya-distance-likelihood.test.mjs'],
  open_problems: [
    'calibrate r_d from baryon density, recombination and a consistent neutrino model',
    'provide the full DESI likelihood and cross-covariance with DESI-derived parameter inputs',
    'include CMB anisotropies, S³ mode signatures, alternatives and joint topology evidence'
  ],
  cost_hint: 'fast',
  max_sweep_points: 64,
  strict_inputs: true,
  inputs: [
    { name: 'r_d_Mpc', type: 'number', unit: 'Mpc', min: 0, max: 10000,
      schema: { exclusiveMinimum: 0 }, doc: 'required externally supplied drag-epoch sound horizon; no internal r_d calibration' },
    { name: 'H0_km', type: 'number', unit: 'km s^-1 Mpc^-1', default: HCC_S3R.H0_km, min: 20, max: 120,
      doc: 'default is DESI-fitted and reuses the Lyα sample' },
    { name: 'Omega_m', type: 'number', unit: 'dimensionless', default: HCC_S3R.Omega_m, min: 0, max: 1.5,
      doc: 'present total matter density, including the massive neutrino species' },
    { name: 'Omega_k', type: 'number', unit: 'dimensionless', default: S3R.Ok, min: -1, max: 0,
      schema: { exclusiveMaximum: 0 }, doc: 'strictly negative; atlas conditional S³ point, not an observed topology' },
    { name: 'T_cmb', type: 'number', unit: 'K', default: HCC_S3R.T_cmb, min: 0.1, max: 10,
      doc: 'present photon temperature' },
    { name: 'N_eff', type: 'number', unit: 'effective species', default: HCC_S3R.N_eff, min: 1, max: 10,
      doc: 'effective neutrino count for the approximate thermal background' },
    { name: 'm_nu_eV', type: 'number', unit: 'eV/c^2', default: 0.06, min: 0, max: 2,
      schema: { anyOf: [{ const: 0 }, { minimum: 0.01, maximum: 2 }] },
      doc: 'one massive thermal species or zero for all-massless species' },
    { name: 'w0', type: 'number', unit: 'dimensionless', default: -1, min: -3, max: 1,
      doc: 'CPL dark-energy intercept' },
    { name: 'wa', type: 'number', unit: 'dimensionless', default: 0, min: -3, max: 3,
      doc: 'CPL dark-energy evolution' }
  ],
  outputs: [
    { name: 'observation', type: 'object', unit: null, schema: observationSchema,
      doc: 'versioned DESI source and measured vector in published order' },
    { name: 'predicted', type: 'object', unit: null, schema: pairSchema,
      doc: 'predicted dimensionless distances using the supplied r_d' },
    { name: 'residual', type: 'object', unit: null, schema: pairSchema,
      doc: 'predicted minus measured distances in the same order' },
    { name: 'covariance_matrix', type: 'array', unit: 'dimensionless^2', schema: matrixSchema,
      doc: '2x2 covariance in observation.order' },
    { name: 'D_M_Mpc', type: 'number', unit: 'Mpc', doc: 'round-S³ transverse comoving distance at z=2.33' },
    { name: 'D_H_Mpc', type: 'number', unit: 'Mpc', doc: 'Hubble distance at z=2.33' },
    { name: 'predicted_D_M_over_rd', type: 'number', unit: 'dimensionless', doc: 'flat CSV field: predicted D_M/r_d' },
    { name: 'predicted_D_H_over_rd', type: 'number', unit: 'dimensionless', doc: 'flat CSV field: predicted D_H/r_d' },
    { name: 'chi2', type: 'number', unit: 'dimensionless', doc: 'within-pair Gaussian chi-squared at the given parameters' },
    { name: 'log_likelihood_relative', type: 'number', unit: 'dimensionless', doc: 'minus half of the within-pair chi-squared' },
    { name: 'independent_significance', type: 'null', schema: { type: 'null' }, unit: null,
      doc: 'always null: no cross-covariance to reused parameter fits is available' },
    { name: 'topology_evidence', type: 'null', schema: { type: 'null' }, unit: null,
      doc: 'always null: no competing topology models or integrated evidence' }
  ],
  evaluate({ r_d_Mpc, ...background }) {
    const result = thermalConcordance({ z: DESI_DR2_LYA_EQ26.redshift, ...background });
    const { D_M_Mpc, D_H_Mpc } = result.distances;
    const score = distancePairGaussian({ D_M_Mpc, D_H_Mpc, r_d_Mpc });
    return {
      outputs: {
        observation: score.observation, predicted: score.predicted,
        residual: score.residual, covariance_matrix: score.covariance,
        D_M_Mpc, D_H_Mpc,
        predicted_D_M_over_rd: score.predicted.D_M_over_rd,
        predicted_D_H_over_rd: score.predicted.D_H_over_rd,
        chi2: score.chi2, log_likelihood_relative: score.log_likelihood_relative,
        independent_significance: null, topology_evidence: null
      },
      covariance: { order: score.observation.order, matrix: score.covariance },
      residuals: score.residual,
      diagnostics: { observation_id: score.observation.id,
        likelihood_approximation: score.observation.likelihood_approximation,
        data_reuse: REUSE, background_provenance: result.provenance },
      warnings: [REUSE, ...result.caveats]
    };
  },
  selftests: [
    { name: 'pair covariance changes the same-sign 1-sigma score', run() {
      const r = distancePairGaussian({ D_M_Mpc: 39.65, D_H_Mpc: 8.666, r_d_Mpc: 1 });
      return { pass: Math.abs(r.chi2 - 2 / 1.225) < 1e-11,
        detail: `chi2=${r.chi2}; correlated prediction must give 2/1.225` };
    } },
    { name: 'published pair at its own mean has zero residual', run() {
      const r = distancePairGaussian({ D_M_Mpc: 39.32, D_H_Mpc: 8.600, r_d_Mpc: 1 });
      return { pass: r.chi2 === 0,
        detail: `chi2=${r.chi2}` };
    } }
  ]
});
