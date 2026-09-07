'use strict';
const assert = require('assert');
(async () => {
  const M = await import('../core/labs/chronometry.source_locked.mjs');

  const historical = M.classifyCandidate({
    relation_claim: 'historical_measurement',
    ancient_quantity_kind: 'sidereal_rotation_period',
    modern_quantity_kind: 'sidereal_rotation_period',
    same_physical_quantity: true,
    ancient_value: 86164.1011542,
    modern_value: 86164.09054,
    epoch_corrected: false
  });
  assert.equal(historical.status, 'HISTORICAL_MEASUREMENT');
  assert.equal(historical.comparable, true);

  const falseIdentity = M.classifyCandidate({
    relation_claim: 'identity',
    ancient_quantity_kind: 'length',
    modern_quantity_kind: 'length',
    same_physical_quantity: false,
    ancient_label: 'paramanu',
    modern_label: 'electron Compton wavelength',
    ancient_value: 2.42631023867e-12,
    modern_value: 2.42631023867e-12
  });
  assert.equal(falseIdentity.status, 'REJECTED');
  assert.ok(falseIdentity.reasons.includes('quantity_identity_missing'));

  assert.throws(() => M.boundedRationalScan(21000, 20951, 13), /expanded search/);
  const scan = M.boundedRationalScan(21000, 20951, 12);
  assert.equal(scan.n, 1);
  assert.equal(scan.m, 1);
  assert.ok(scan.log_residual < 0.003);

  const dependent = M.classifyCandidate({
    relation_claim: 'hypothesis',
    ancient_quantity_kind: 'time_period',
    modern_quantity_kind: 'time_period',
    ancient_value: 42000,
    modern_value: 41000,
    dependency: { expression: '2 * jain_21000', independent: false }
  });
  assert.equal(dependent.independent, false);
  assert.ok(dependent.reasons.includes('dependent_harmonic_not_independent_evidence'));

  const jain = M.comparePeriods({
    relation_claim: 'hypothesis',
    ancient_quantity_kind: 'time_period',
    modern_quantity_kind: 'time_period',
    ancient_value: 21000,
    modern_value: 20951,
    max_harmonic: 12,
    independent_phase: null
  });
  assert.equal(jain.status, 'HYPOTHESIS');
  assert.equal(jain.phase_tested, false);
  assert.notEqual(jain.status, 'PHASE_CONSISTENT');
  assert.ok(jain.relative_residual > 0.002 && jain.relative_residual < 0.003);

  console.log('PASS — chronometry falsification firewall');
})().catch(e => { console.error(e); process.exit(1); });
