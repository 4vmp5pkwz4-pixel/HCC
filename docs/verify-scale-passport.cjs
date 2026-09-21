#!/usr/bin/env node
'use strict';

const fs=require('node:fs');
const src=fs.readFileSync('index.html','utf8');
let pass=0,fail=0;
function ok(name,cond,detail=''){
  if(cond){pass++;console.log(`PASS — ${name}${detail?` · ${detail}`:''}`);}
  else{fail++;console.error(`FAIL — ${name}${detail?` · ${detail}`:''}`);}
}

ok('one machine-readable scale-passport authority exists',
  /function hccScalePassport\(\)\{/.test(src)
  && /schema:'hcc\.scale-passport\/1'/.test(src)
  && /globalThis\.HCC_SCALE_PASSPORT=\(\)=>hccScalePassport\(\)/.test(src));

ok('passport derives every cross-world threshold from SCALE_SEAMS rather than copying numbers',
  ['solarObsOutGly','obsSolarInGly','obsS3OutGly','s3ObsInGly','s3UnitGly']
    .every(k=>src.includes('SCALE_SEAMS.'+k)),
  'navigation truth stays in SCALE_SEAMS');

ok('Solar passport distinguishes metric AU scene from semantic framing layers',
  /metric R³ scene with semantic framing layers/.test(src)
  && /internal Solar layers change framing, not the underlying direction field/.test(src)
  && /the Observable handoff is navigation, not a physical boundary/.test(src));

ok('Observable passport declares both adjacent seams and the representation change',
  /observer-centred comoving display/.test(src)
  && /similarity map/.test(src)
  && /outward S³ handoff enters a conditional carrier representation/.test(src));

ok('S3 passport is explicit that the carrier is conditional and not established topology',
  /conditional reconstruction/.test(src)
  && /not established global topology/.test(src)
  && /hysteresis is navigation, not shell thickness/.test(src));

ok('Cycles passport refuses to collapse distinct clock meanings into one physical time',
  /shared epoch coordinates instruments; it does not make their clock meanings identical/.test(src)
  && /no spatial seam/.test(src));

ok('FBS passport refuses to turn the phi ladder into a measured ruler or law',
  /ansatz\/model scale coordinate/.test(src)
  && /not a measured ruler or universal law/.test(src));

ok('non-metric exploratory worlds say so rather than borrowing cosmic distance language',
  /reduced\/model units; no cross-world metric identity/.test(src)
  && /semantic zoom; not physical distance/.test(src));

ok('the existing context rail carries the passport without adding another overlay panel',
  (src.match(/id="ctxScale"/g)||[]).length===1
  && !/id="scalePassport"|scalePassportPanel/.test(src)
  && /const passport=hccScalePassport\(\);/.test(src)
  && /scaleEl\.textContent=passport\.compact/.test(src)
  && /rail\.setAttribute\('aria-label',/.test(src));

ok('compact rail text remains bounded while full semantics stay machine/screen-reader accessible',
  /scaleEl\.title=passport\.detail/.test(src)
  && /scaleEl\.dataset\.scaleKind=passport\.kind/.test(src)
  && /Scale passport/.test(src));

console.log(`\nscale passport: ${pass} passed, ${fail} failed`);
process.exitCode=fail?1:0;
