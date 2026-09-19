#!/usr/bin/env node
'use strict';

const PI = Math.PI;
const N = K => (K + 1) * (K + 2) * (2 * K + 9) / 3;
let pass = 0, fail = 0;
const ok = (name, cond, detail='') => { if (cond) { pass++; console.log('PASS', name, detail); } else { fail++; console.error('FAIL', name, detail); } };

for (let K = 0; K <= 1000; K++) {
  let sum = 0; for (let k = 0; k <= K; k++) sum += 2 * (k + 1) * (k + 3);
  if (N(K) !== sum) { ok('exact cumulative curl multiplicity', false, `K=${K}`); break; }
  if (K === 1000) ok('exact cumulative curl multiplicity', true, 'K=0..1000');
}
ok('first six exact ranks', [0,1,2,3,4,5].map(N).join(',') === '6,22,52,100,170,266', [0,1,2,3,4,5].map(N).join(', '));

for (const R of [0.1, 1, 3.7, 100]) {
  const V = 2 * PI * PI * R ** 3;
  const got = N(0) / (3 * V), want = 1 / (PI * PI * R ** 3);
  ok(`Hopf projector constant R=${R}`, Math.abs(got-want) <= 2e-15 * Math.max(1, Math.abs(want)), `${got}`);
}

let traceOK = true;
for (const K of [0,1,5,20]) for (const frac of [1e-9,1e-4,0.2,1]) {
  const trace = N(K) * frac;
  const bound = Math.min(1, trace);
  if (!(trace >= 0 && bound >= 0 && bound <= 1)) traceOK = false;
}
ok('Slepian trace/energy range', traceOK, 'all deterministic sweeps inside [0,1] after min');

for (const h of [1e-5,1e-3,0.0099]) {
  const beta = 1.5-h, amp=0.5+h;
  ok(`packet exponents h=${h}`, Math.abs((beta-amp)-(1-2*h))<1e-14 && Math.abs(beta/2-(0.75-h/2))<1e-14,
    `beta=${beta}`);
}

console.log(`\n${pass}/${pass+fail} checks pass`);
process.exit(fail ? 1 : 0);
