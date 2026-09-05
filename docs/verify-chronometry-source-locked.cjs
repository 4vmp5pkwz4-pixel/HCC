'use strict';
const assert = require('assert');
(async () => {
  const M = await import('../core/labs/chronometry.source_locked.mjs');
  const a = M.makeRational(2n, 4n);
  assert.equal(a.n, 1n);
  assert.equal(a.d, 2n);
  assert.equal(M.toDecimal(M.makeRational(1n, 3n), 12), '0.333333333333');
  const ksana = M.calibrateFromDay(6480000n, 86400n);
  assert.equal(M.toDecimal(ksana, 12), '0.013333333333');
  console.log('PASS — exact rational/calibration kernel');
})().catch(e => { console.error(e); process.exit(1); });
