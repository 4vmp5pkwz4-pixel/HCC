import test from 'node:test';
import assert from 'node:assert/strict';
import { DESI_DR2_LYA_EQ26, distancePairGaussian } from '../core/cosmology/desi-dr2-lya.mjs';
import { CORE } from '../core/index.mjs';

const close = (actual, expected, tolerance = 1e-11) =>
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)),
    `expected ${expected}, got ${actual}`);

test('published distance order and correlation enter a positive Gaussian covariance', () => {
  const observation = DESI_DR2_LYA_EQ26;
  assert.deepEqual(observation.order, ['D_M_over_rd', 'D_H_over_rd']);
  assert.deepEqual(observation.mean, [39.32, 8.600]);
  close(observation.covariance[0][0], 0.1089);
  close(observation.covariance[0][1], 0.0049005);
  close(observation.covariance[1][0], 0.0049005);
  close(observation.covariance[1][1], 0.004356);
  const exact = distancePairGaussian({ D_M_Mpc: 39.32 * 147, D_H_Mpc: 8.600 * 147, r_d_Mpc: 147 });
  close(exact.chi2, 0, 1e-20);
  close(exact.log_likelihood_relative, 0, 1e-20);
  assert.equal(exact.observation.id, observation.id);
});

test('cross-covariance changes the joint score for same-sign residuals', () => {
  const result = distancePairGaussian({ D_M_Mpc: 39.65 * 147, D_H_Mpc: 8.666 * 147, r_d_Mpc: 147 });
  close(result.chi2, 2 / 1.225);
  close(result.log_likelihood_relative, -1 / 1.225);
  close(result.residual.D_M_over_rd, 0.33);
  close(result.residual.D_H_over_rd, 0.066);
});

test('invalid distances, ruler and overflowing predictions are refused', () => {
  const valid = { D_M_Mpc: 5700, D_H_Mpc: 1250, r_d_Mpc: 147 };
  for (const [key, value] of [
    ['r_d_Mpc', 0], ['r_d_Mpc', -2], ['r_d_Mpc', NaN],
    ['D_M_Mpc', Infinity], ['D_H_Mpc', 0], ['D_M_Mpc', 1e308]
  ]) assert.throws(() => distancePairGaussian({ ...valid, [key]: value }),
    error => error.code === 'DOMAIN_ERROR', `${key}=${value}`);
});

test('agent requires a ruler and serves the same sourced two-distance score', () => {
  const d = CORE.describe('s3.lya_distance_likelihood');
  assert.equal(d.status, 'CONDITIONAL');
  assert.ok(d.input_schema.required.includes('r_d_Mpc'));
  assert.equal(d.sweep_max_points, 64);
  assert.throws(() => CORE.run('s3.lya_distance_likelihood', {}),
    error => error.code === 'DOMAIN_ERROR' && /r_d_Mpc/.test(error.message));
  const result = CORE.run('s3.lya_distance_likelihood', { r_d_Mpc: 147 });
  assert.equal(result.outputs.observation.id, DESI_DR2_LYA_EQ26.id);
  assert.equal(result.outputs.observation.redshift, 2.33);
  assert.ok(result.outputs.chi2 >= 0);
  close(result.outputs.predicted.D_M_over_rd, result.outputs.D_M_Mpc / 147);
  close(result.outputs.predicted.D_H_over_rd, result.outputs.D_H_Mpc / 147);
  assert.equal(result.outputs.independent_significance, null);
  assert.equal(result.outputs.topology_evidence, null);
  assert.ok(result.warnings.some(w => /same DESI|reuse|in-sample/.test(w)));
  assert.equal(result.output_units.chi2, 'dimensionless');
  assert.match(CORE.export('s3.lya_distance_likelihood', result, 'csv').body,
    /chi2,[0-9.e+\-]+,dimensionless/);
  assert.ok(CORE.validate('s3.lya_distance_likelihood').all_pass);
  assert.throws(() => CORE.run('s3.lya_distance_likelihood', { r_d_Mpc: 147, Omega_k: 0.001 }),
    error => error.code === 'DOMAIN_ERROR');
  assert.throws(() => CORE.sweep('s3.lya_distance_likelihood', {
    r_d_Mpc: 147, parameter: 'Omega_k', values: Array(65).fill(-0.001)
  }), error => error.code === 'DOMAIN_ERROR');
  assert.equal(CORE.run('s3.thermal_concordance', {}).outputs.comparison.significance, null);
});

test('machine output schema describes actual numbers, nulls and exactly two distances', () => {
  const properties = CORE.describe('s3.lya_distance_likelihood').output_schema.properties;
  const output = CORE.run('s3.lya_distance_likelihood', { r_d_Mpc: 147 }).outputs;
  for (const key of ['D_M_Mpc', 'D_H_Mpc', 'predicted_D_M_over_rd',
    'predicted_D_H_over_rd', 'chi2', 'log_likelihood_relative']) {
    assert.equal(properties[key].type, 'number', key);
    assert.equal(typeof output[key], 'number', key);
  }
  for (const key of ['independent_significance', 'topology_evidence']) {
    assert.equal(properties[key].type, 'null', key);
    assert.equal(output[key], null, key);
  }
  for (const key of ['predicted', 'residual'])
    assert.deepEqual(properties[key].required, ['D_M_over_rd', 'D_H_over_rd']);
  assert.deepEqual(properties.observation.required.sort(), Object.keys(output.observation).sort());
  for (const field of ['order', 'mean', 'sigma']) {
    assert.equal(properties.observation.properties[field].minItems, 2, field);
    assert.equal(properties.observation.properties[field].maxItems, 2, field);
  }
  assert.equal(properties.covariance_matrix.minItems, 2);
  assert.equal(properties.covariance_matrix.items.maxItems, 2);
});

test('manual curvature override is identified as an input rather than a DESI-conditioned median', () => {
  const result = CORE.run('s3.lya_distance_likelihood', {
    r_d_Mpc: 147, Omega_k: -0.2, H0_km: 72, Omega_m: 0.25
  });
  const provenance = result.diagnostics.background_provenance;
  assert.match(provenance.curvature_input, /caller|user/i);
  assert.doesNotMatch(provenance.curvature_input, /S3R\.Ok|median/);
  assert.match(provenance.observational_inputs, /default/i);
});
