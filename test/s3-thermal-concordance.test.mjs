import test from 'node:test';
import assert from 'node:assert/strict';
import { thermalConcordance, fermiEnergyIntegral } from '../core/cosmology/s3-thermal-concordance.mjs';
import { HCC_S3C, S3R } from '../core/atlas/extracted.mjs';
import { CORE } from '../core/index.mjs';

const near = (actual, expected, tolerance = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)),
    `${actual} differs from ${expected} by more than ${tolerance} relative`);
};
const relative = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual / expected - 1) <= tolerance,
    `${actual} differs from ${expected} by more than ${tolerance} relative`);

test('photon thermal scale, pressure and redshift scaling', () => {
  const now = thermalConcordance({ z: 0 });
  const then = thermalConcordance({ z: 1 });
  relative(now.thermal.Q_gamma_K4_per_Pa, 8.6967595e14, 2e-7);
  relative(then.thermal.u_gamma_J_m3 / now.thermal.u_gamma_J_m3, 16);
  relative(now.thermal.p_gamma_Pa, now.thermal.u_gamma_J_m3 / 3);
  relative(then.thermal.eta_T, now.thermal.eta_T);
  relative(now.thermal.R0_m, S3R.Rc, 1e-12);
});

test('finite S³ global photon number and entropy follow from the local gas', () => {
  const now = thermalConcordance({ z: 0 });
  const then = thermalConcordance({ z: 1 });
  const a = now.thermal, b = then.thermal;
  relative(a.volume_m3, 2 * Math.PI ** 2 * a.R0_m ** 3, 1e-12);
  relative(a.N_gamma_total, a.photon_number_density_m3 * a.volume_m3, 1e-12);
  relative(a.N_gamma_total, S3R.inputs.published.N_gamma, 1e-10);
  relative(a.S_gamma_J_K, 4 * a.u_gamma_J_m3 * a.volume_m3 / (3 * a.T_gamma_K), 1e-12);
  relative(b.N_gamma_total, a.N_gamma_total, 1e-12);
  relative(b.S_gamma_J_K, a.S_gamma_J_K, 1e-12);
  relative(b.U_gamma_J / a.U_gamma_J, 2, 1e-12);
});

test('thermal Fermi integral has correct relativistic and cold limits', () => {
  relative(fermiEnergyIntegral(0), 7 * Math.PI ** 4 / 120, 1e-9);
  relative(fermiEnergyIntegral(1000) / 1000, 1.5 * HCC_S3C.zeta3, 1e-5);
  const early = thermalConcordance({ z: 3000 });
  const twice = thermalConcordance({ z: 6001 });
  assert.ok(twice.densities.Omega_nu_massive_at_z / early.densities.Omega_nu_massive_at_z > 15.9);
  const late = thermalConcordance({ z: 0 });
  const shifted = thermalConcordance({ z: 1 });
  relative(shifted.densities.Omega_nu_massive_at_z / late.densities.Omega_nu_massive_at_z, 8, 0.0002);
});

test('the density budget closes and the Hubble rate agrees with H0', () => {
  const r = thermalConcordance({ z: 0, H0_km: 72, T_cmb: 2.73 });
  const d = r.densities;
  near(d.Omega_cb + d.Omega_gamma + d.Omega_nu_massless +
    d.Omega_nu_massive + r.inputs.Omega_k + d.Omega_de, 1, 1e-14);
  near(d.Omega_cb + d.Omega_nu_massive, r.inputs.Omega_m, 1e-14);
  relative(r.background.E, 1, 1e-14);
  relative(r.background.H_km_s_Mpc, 72, 1e-14);
});

test('zero neutrino mass switches that species into radiation rather than matter', () => {
  const r = thermalConcordance({ z: 0, m_nu_eV: 0 });
  near(r.densities.Omega_cb, r.inputs.Omega_m, 1e-14);
  near(r.densities.Omega_nu_massive, 0, 1e-14);
  relative(r.densities.Omega_nu_massless / r.densities.Omega_gamma,
    r.inputs.N_eff * 7 / 8 * (4 / 11) ** (4 / 3), 1e-12);
  relative(r.background.E, 1, 1e-14);
});

test('optical distances obey the round S³ projection and distance duality', () => {
  const origin = thermalConcordance({ z: 0 });
  near(origin.distances.D_C_Mpc, 0);
  const step = thermalConcordance({ z: 1e-5 });
  relative(step.distances.D_C_Mpc / 1e-5, origin.distances.D_H_Mpc, 1e-5);
  const z = 2.33;
  const r = thermalConcordance({ z });
  // Independent SciPy quadrature of the same FLRW/FD equations at defaults.
  relative(r.distances.D_C_Mpc, 5725.4446305, 2e-7);
  relative(r.distances.D_H_Mpc / r.distances.D_M_Mpc, 0.22123499465, 2e-7);
  relative(r.distances.D_M_Mpc,
    r.thermal.R0_Mpc * Math.sin(r.distances.D_C_Mpc / r.thermal.R0_Mpc), 1e-12);
  relative(r.distances.D_L_Mpc, (1 + z) ** 2 * r.distances.D_A_Mpc, 1e-12);
  relative(r.distances.D_H_Mpc, HCC_S3C.c / 1000 / r.background.H_km_s_Mpc, 1e-12);
  assert.ok(r.distances.D_M_Mpc < r.distances.D_C_Mpc);
  const flatLimit = thermalConcordance({ z, Omega_k: -1e-10 });
  relative(flatLimit.distances.D_M_Mpc, flatLimit.distances.D_C_Mpc, 1e-9);
});

test('the distance integral remains resolved across a large redshift interval', () => {
  const recombination = thermalConcordance({ z: 1100 });
  const high = thermalConcordance({ z: 10000 });
  assert.ok(high.distances.D_C_Mpc > recombination.distances.D_C_Mpc);
  assert.ok(high.distances.D_C_Mpc < recombination.distances.D_C_Mpc * 1.05,
    'the high-redshift comoving distance should approach its particle horizon');
});

test('DESI comparison is a ratio at the measured redshift with no made-up significance', () => {
  const r = thermalConcordance();
  assert.equal(r.comparison.available, true);
  assert.equal(r.comparison.z, 2.33);
  assert.equal(r.comparison.significance, null);
  relative(r.comparison.observed_ratio, 8.600 / 39.32);
  assert.equal(r.comparison.distance_pair_correlation, 0.225);
  assert.match(r.comparison.data_reuse, /same DESI/);
  relative(r.comparison.model_ratio, r.distances.D_H_Mpc / r.distances.D_M_Mpc);
  relative(r.comparison.difference, r.comparison.model_ratio - r.comparison.observed_ratio);
  const outside = thermalConcordance({ z: 1 }).comparison;
  assert.equal(outside.available, false);
  assert.equal(outside.model_ratio, null);
  assert.equal(outside.significance, null);
});

test('round S³ domain and physically impossible budgets are refused', () => {
  for (const Omega_k of [0, 0.003])
    assert.throws(() => thermalConcordance({ Omega_k }), e => e.code === 'DOMAIN_ERROR');
  assert.throws(() => thermalConcordance({ Omega_m: 0, m_nu_eV: 0.06 }),
    e => e.code === 'DOMAIN_ERROR' && /matter/.test(e.message));
  assert.throws(() => thermalConcordance({ Omega_m: 1.5 }),
    e => e.code === 'DOMAIN_ERROR' && /dark energy/.test(e.message));
  assert.throws(() => thermalConcordance({ m_nu_eV: 0.001 }),
    e => e.code === 'DOMAIN_ERROR' && /neutrino/.test(e.message));
  assert.throws(() => thermalConcordance({ Omega_k: -1e-160 }),
    e => e.code === 'DOMAIN_ERROR' && /finite|float64/.test(e.message));
  assert.throws(() => thermalConcordance({ Omega_k: -1, Omega_m: 0, m_nu_eV: 0, z: 2 }),
    e => e.code === 'DOMAIN_ERROR' && /E\(z\)\^2/.test(e.message));
  assert.throws(() => thermalConcordance({ Omega_k: -1, Omega_m: 0.3, m_nu_eV: 0, z: 10000 }),
    e => e.code === 'DOMAIN_ERROR' && /antipode/.test(e.message));
  assert.throws(() => thermalConcordance({ z: NaN }), e => e.code === 'DOMAIN_ERROR');
  assert.throws(() => thermalConcordance({ Ωk: -0.001 }), e => e.code === 'DOMAIN_ERROR');
});

test('the six-method agent contract exposes assumptions, units and a working run', () => {
  const description = CORE.describe('s3.thermal_concordance');
  assert.equal(description.status, 'CONDITIONAL');
  assert.equal(description.sweep_max_points, 128);
  assert.ok(description.open_problems.some(x => /topology/.test(x)));
  assert.ok(description.outputs.some(x => x.name === 'thermal' && x.unit === null));
  assert.equal(description.output_schema.properties.comparison.type, 'object');
  assert.equal(description.input_schema.properties.Omega_k.exclusiveMaximum, 0);
  assert.equal(description.input_schema.properties.m_nu_eV.anyOf.length, 2);
  assert.equal(description.output_schema.properties.thermal.properties.Q_gamma_K4_per_Pa.unit, 'K^4/Pa');
  assert.equal(description.output_schema.properties.D_M_Mpc.unit, 'Mpc');
  const result = CORE.run('s3.thermal_concordance', { z: 2.33 });
  assert.equal(result.status, 'CONDITIONAL');
  assert.equal(result.outputs.comparison.significance, null);
  assert.equal(result.outputs.thermal.T_gamma_K, 2.72548 * 3.33);
  assert.ok(result.warnings.some(x => /not an observed detection/.test(x)));
  assert.equal(result.output_units.Q_gamma_K4_per_Pa, 'K^4/Pa');
  assert.equal(result.outputs.D_M_Mpc, result.outputs.distances.D_M_Mpc);
  assert.match(CORE.export('s3.thermal_concordance', result, 'csv').body, /D_M_Mpc,[0-9.]+,Mpc/);
  const verified = CORE.validate('s3.thermal_concordance');
  assert.ok(verified.all_pass && verified.total >= 3, JSON.stringify(verified.checks));
  assert.throws(() => CORE.run('s3.thermal_concordance', { Omega_k: 0.001 }),
    e => e.code === 'DOMAIN_ERROR');
  assert.throws(() => CORE.sweep('s3.thermal_concordance', {
    parameter: 'z', values: Array(129).fill(2.33) }), e => e.code === 'DOMAIN_ERROR');
});
