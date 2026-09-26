/* Published DESI DR2 Lyα full-shape distance summary, Eq. 26. This is a
   Gaussian approximation to the two-distance contour, not the full DESI
   likelihood and not an independent re-test of DESI-derived parameters. */
import { domainError } from '../contract.mjs';

const sigmaM = 0.33;
const sigmaH = 0.066;
const rho = 0.225;
const covariance = Object.freeze([
  Object.freeze([sigmaM ** 2, rho * sigmaM * sigmaH]),
  Object.freeze([rho * sigmaM * sigmaH, sigmaH ** 2])
]);

export const DESI_DR2_LYA_EQ26 = Object.freeze({
  id: 'desi.dr2.lya_full_shape.eq26.v3',
  version: 'arXiv:2607.27410v3',
  source_url: 'https://arxiv.org/html/2607.27410v3',
  source_location: 'Equation 26',
  redshift: 2.33,
  order: Object.freeze(['D_M_over_rd', 'D_H_over_rd']),
  mean: Object.freeze([39.32, 8.600]),
  sigma: Object.freeze([sigmaM, sigmaH]),
  correlation: rho,
  covariance,
  likelihood_approximation: 'Bivariate Gaussian in the two published distance estimates; not the full DESI profile likelihood'
});

export function distancePairGaussian(values) {
  if (!values || typeof values !== 'object' || Array.isArray(values))
    throw domainError('the predicted distances and sound horizon must be an object');
  for (const name of ['D_M_Mpc', 'D_H_Mpc', 'r_d_Mpc']) {
    const value = values[name];
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)
      throw domainError(`${name} must be positive and finite`);
  }
  const { D_M_Mpc, D_H_Mpc, r_d_Mpc } = values;
  const D_M_over_rd = D_M_Mpc / r_d_Mpc;
  const D_H_over_rd = D_H_Mpc / r_d_Mpc;
  const dM = D_M_over_rd - DESI_DR2_LYA_EQ26.mean[0];
  const dH = D_H_over_rd - DESI_DR2_LYA_EQ26.mean[1];
  const x = dM / sigmaM, y = dH / sigmaH;
  const chi2 = (x * x - 2 * rho * x * y + y * y) / (1 - rho * rho);
  if (![D_M_over_rd, D_H_over_rd, chi2].every(Number.isFinite))
    throw domainError('predicted distances or covariance score overflow float64');
  return {
    observation: DESI_DR2_LYA_EQ26,
    predicted: { D_M_over_rd, D_H_over_rd },
    residual: { D_M_over_rd: dM, D_H_over_rd: dH },
    covariance,
    chi2,
    log_likelihood_relative: -chi2 / 2
  };
}
