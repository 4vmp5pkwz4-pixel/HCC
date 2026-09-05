#!/usr/bin/env node
'use strict';

const fs = require('fs');
const assert = require('assert');

let pass = 0;
function ok(label, condition, detail='') {
  assert.ok(condition, `${label}${detail ? ` — ${detail}` : ''}`);
  pass++;
  console.log(`PASS — ${label}${detail ? ` · ${detail}` : ''}`);
}

const index = fs.readFileSync('index.html', 'utf8');
const version = JSON.parse(fs.readFileSync('version.json', 'utf8'));
const manifestBuilder = fs.readFileSync('scripts/build-manifest.mjs', 'utf8');
const readme = fs.readFileSync('README.md', 'utf8');

ok('first-principles schema marker exists',
  index.includes("HCC_FIRST_PRINCIPLES_SCHEMA = 'hcc.first-principles/1'") ||
  index.includes('HCC_FIRST_PRINCIPLES_SCHEMA="hcc.first-principles/1"') ||
  index.includes("HCC_FIRST_PRINCIPLES_SCHEMA='hcc.first-principles/1'"));

ok('Fibonacci exact golden-ratio definition is visible',
  index.includes('phi = (1 + sqrt(5))/2') &&
  index.includes('phi^-1 = (sqrt(5)-1)/2') &&
  index.includes('phi^-1/2 = sqrt((sqrt(5)-1)/2)'));

ok('Fibonacci fusion matrix and characteristic polynomial are exposed',
  index.includes('N_tau = [[0,1],[1,1]]') &&
  index.includes('lambda^2-lambda-1'));

ok('displayed F gauge and R orientation are explicit',
  index.includes('F = [[phi^-1,phi^-1/2],[phi^-1/2,-phi^-1]]') &&
  index.includes('R_1 = exp(-4*pi*i/5)') &&
  index.includes('R_tau = exp(3*pi*i/5)') &&
  index.includes('right-handed') &&
  index.includes('mirror/orientation reversal'));

ok('R phases are expanded to exact radicals',
  index.includes('-(1+sqrt(5))/4 - i*sqrt(10-2*sqrt(5))/4') &&
  index.includes('-(sqrt(5)-1)/4 + i*sqrt(10+2*sqrt(5))/4'));

ok('second braid generator is derived through basis change',
  index.includes('rho(sigma_2)=F^-1 R F') &&
  index.includes('basis change'));

ok('operational braid and gate helpers are present',
  index.includes('hccFibBraidWord') &&
  index.includes('hccMatrixDistancePhaseInvariant'));

ok('global first-principles audit entry points exist',
  index.includes('hccFirstPrinciplesForLab') &&
  index.includes('hccFirstPrinciplesAudit') &&
  index.includes('UNDECLARED'));

/* Independent numerical closure. This does not trust values printed by the runtime: it
   reconstructs the standard displayed Fibonacci convention directly from the primitive
   definitions and checks the category/braid identities the Atlas must expose. */
const phi = (1 + Math.sqrt(5)) / 2;
const a = 1 / phi;
const b = Math.sqrt(1 / phi);
const C = (re, im=0) => [re, im];
const add = (x,y) => C(x[0]+y[0], x[1]+y[1]);
const mul = (x,y) => C(x[0]*y[0]-x[1]*y[1], x[0]*y[1]+x[1]*y[0]);
const scale = (x,s) => C(x[0]*s,x[1]*s);
const mm = (A,B) => A.map((row,i)=>B[0].map((_,j)=>row.reduce((z,_,k)=>add(z,mul(A[i][k],B[k][j])),C(0,0))));
const sub = (A,B) => A.map((r,i)=>r.map((z,j)=>C(z[0]-B[i][j][0],z[1]-B[i][j][1])));
const maxAbs = A => Math.max(...A.flat().map(z=>Math.hypot(z[0],z[1])));
const F = [[C(a),C(b)],[C(b),C(-a)]];
const I = [[C(1),C(0)],[C(0),C(1)]];
const r1 = C(Math.cos(-4*Math.PI/5), Math.sin(-4*Math.PI/5));
const rt = C(Math.cos( 3*Math.PI/5), Math.sin( 3*Math.PI/5));
const R = [[r1,C(0)],[C(0),rt]];
const s1 = R;
const s2 = mm(mm(F,R),F);

ok('phi closes its defining polynomial', Math.abs(phi*phi-phi-1) < 1e-14,
  `residual=${Math.abs(phi*phi-phi-1).toExponential(2)}`);
ok('F is involutory in the displayed gauge', maxAbs(sub(mm(F,F),I)) < 1e-14,
  `residual=${maxAbs(sub(mm(F,F),I)).toExponential(2)}`);
ok('R phases are unitary',
  Math.abs(Math.hypot(...r1)-1) < 1e-14 && Math.abs(Math.hypot(...rt)-1) < 1e-14);
ok('Fibonacci braid relation closes',
  maxAbs(sub(mm(mm(s1,s2),s1),mm(mm(s2,s1),s2))) < 1e-12,
  `residual=${maxAbs(sub(mm(mm(s1,s2),s1),mm(mm(s2,s1),s2))).toExponential(2)}`);

ok('v4.151 release identity is exact',
  version.version === '4.151.0' &&
  version.build === 'first-principles-atlas-2026.09.05.1',
  `${version.version} · ${version.build}`);

ok('manifest builder emits first-principles summary',
  manifestBuilder.includes('first_principles'));

ok('README stale laboratory count is removed',
  !/\b85\s+laboratories\b/.test(readme));

console.log(`\nFIRST-PRINCIPLES RELEASE GATE: ${pass} assertions passed`);
