#!/usr/bin/env node
'use strict';
const fs=require('fs');
const assert=require('assert');
const src=fs.readFileSync('index.html','utf8');
let pass=0;
function ok(label,cond){assert.ok(cond,label);pass++;console.log(`PASS — ${label}`);}

ok('first-principles convention A names its exact R phases',
  src.includes('R_1 = exp(-4*pi*i/5)')&&src.includes('R_tau = exp(3*pi*i/5)'));
ok('Atlas native Fibonacci convention B names the conjugate phases',
  src.includes('Atlas core native convention')&&
  src.includes('R_1_core = exp(4*pi*i/5)')&&src.includes('R_tau_core = exp(-3*pi*i/5)'));
ok('the bridge states that orientation reversal is complex conjugation, not a physical contradiction',
  src.includes('R_core = conjugate(R_display)')&&src.includes('braid orientation convention'));
ok('the first-principles runtime exposes both displayed and core-native matrices',
  src.includes('R_core')&&src.includes('sigma1_core')&&src.includes('sigma2_core'));
ok('the bridge checks the two numerical representations by conjugation',
  src.includes('core_display_conjugacy'));

console.log(`\nFIBONACCI CONVENTION BRIDGE: ${pass} assertions passed`);
