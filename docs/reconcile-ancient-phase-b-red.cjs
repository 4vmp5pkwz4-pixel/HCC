#!/usr/bin/env node
'use strict';
const fs=require('fs');
let fail=0;
const ok=(name,cond,detail='')=>{ console.log(`${cond?'  PASS':'✗ FAIL'} — ${name}${detail?`\n         ${detail}`:''}`); if(!cond) fail++; };
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('api/manifest.json','utf8'));
const labs=Array.isArray(manifest.labs)?manifest.labs:[];
const chron=labs.find(x=>x && x.id==='chronometry');

console.log('\n=== Ancient Chronometry Phase B — live reconciliation contract ===\n');
ok('Chronometry is a first-class machine-readable laboratory', !!chron,
  chron?`${chron.id} · ${chron.route||'no route'}`:'api/manifest.json has no lab id=chronometry');
ok('Chronometry lives inside the existing Cycles world and exposes a stable live route',
  !!chron && chron.world==='cyc' && typeof chron.route==='string' && /cyc/.test(chron.route) && /chronometry/.test(chron.route),
  chron?JSON.stringify({world:chron.world,route:chron.route}):'manifest entry absent');
ok('The shipped application exposes Ancient Chronometry as a source-locked instrument, not a second free-running period scanner',
  /Ancient Chronometry/i.test(html) && /source[- ]locked/i.test(html) && /provenance/i.test(html),
  'visible/runtime contract must name the instrument, source locking, and provenance');
ok('The live contract preserves falsification outcomes instead of forcing a match',
  /PHASE_CONSISTENT/.test(html) && /HYPOTHESIS/.test(html) && /REJECTED/.test(html) && /UNKNOWN/.test(html),
  'required outcomes: PHASE_CONSISTENT · HYPOTHESIS · REJECTED · UNKNOWN');
ok('The Jain 42 kyr relation remains explicitly dependent on 2×21 kyr rather than independent evidence',
  /42000/.test(html) && /21000/.test(html) && /dependent/i.test(html),
  'the UI/machine contract must preserve the dependency marker');
ok('Numerical proximity is explicitly firewalled from physical identity',
  /numerical/i.test(html) && /(not|no) (?:a )?(?:physical )?identity/i.test(html),
  'a reader/agent must be told that a close number is not an identity claim');

if(fail){ console.error(`\nAncient Chronometry Phase B contract: ${fail} failure(s).`); process.exit(1); }
console.log('\nAncient Chronometry Phase B contract: GREEN.');
