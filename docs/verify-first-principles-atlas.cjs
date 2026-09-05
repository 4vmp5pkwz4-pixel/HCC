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

ok('global first-principles audit entry points exist',
  index.includes('hccFirstPrinciplesForLab') &&
  index.includes('hccFirstPrinciplesAudit') &&
  index.includes('UNDECLARED'));

ok('v4.151 release identity is exact',
  version.version === '4.151.0' &&
  version.build === 'first-principles-atlas-2026.09.05.1',
  `${version.version} · ${version.build}`);

ok('manifest builder emits first-principles summary',
  manifestBuilder.includes('first_principles'));

ok('README stale laboratory count is removed',
  !/\b85\s+laboratories\b/.test(readme));

console.log(`\nFIRST-PRINCIPLES RELEASE GATE: ${pass} assertions passed`);
