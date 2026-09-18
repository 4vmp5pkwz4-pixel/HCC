#!/usr/bin/env node
'use strict';

const fs=require('node:fs');
const src=fs.readFileSync('index.html','utf8');
let pass=0,fail=0;
function ok(name,cond,detail=''){
  if(cond){pass++;console.log(`PASS — ${name}${detail?` · ${detail}`:''}`);}
  else{fail++;console.error(`FAIL — ${name}${detail?` · ${detail}`:''}`);}
}

ok('one machine-readable Time Passport authority exists',
  /function hccTimePassport\(\)\{/.test(src)
  && /schema:'hcc\.time-passport\/1'/.test(src)
  && /globalThis\.HCC_TIME_PASSPORT=\(\)=>hccTimePassport\(\)/.test(src));

ok('Time Passport names AtlasTime as one mutation authority without claiming one physical clock',
  /authority:'AtlasTime'/.test(src)
  && /AtlasTime is one mutation authority, NOT one physical interpretation/.test(src));

ok('Solar local time is explicitly J2000 ephemeris/display time',
  /'ephemeris-coordinate','ephem J2000','EPHEMERIS · J2000'/.test(src)
  && /This coordinate is not a universal physical clock/.test(src)
  && /JPL approximation marked 1800–2050/.test(src));

ok('nonlocal Solar galactic motion is labelled display phase rather than rigid-body evolution',
  /'shared-display-phase','display J2000'/.test(src)
  && /not a claim of rigid-body galactic evolution/.test(src));

ok('Cycles keeps one coordinate but refuses physical identity between its clocks',
  /'phase-coordinate','phase coord'/.test(src)
  && /does not make lunar, precessional, calendrical, galactic or historical clock meanings physically identical/.test(src));

ok('Observable world refuses epochDays = cosmic age/lookback',
  /ATLAS COORD · ≠ cosmic age/.test(src)
  && /epochDays is not reinterpreted here as cosmic age or lookback time/.test(src)
  && /Cosmological age, lookback times and milestone shells remain separate model data/.test(src));

ok('conditional S3 world refuses epochDays = cosmic age or topology evolution',
  /MODEL COORD · ≠ cosmic age/.test(src)
  && /does not establish topology evolution/.test(src)
  && /conditional S³ reconstruction is not evolved by treating epochDays as the age of the Universe/.test(src));

ok('FBS keeps N and phi ladder separate from time',
  /ATLAS COORD · N ≠ time/.test(src)
  && /epochDays is never identified with N, φ-time or a t\(N\) law/.test(src)
  && /forbiddenIdentity:'epochDays ≠ N ≠ phi-time'/.test(src));

ok('Field and Fractal explicitly keep clocks/model parameters local',
  /MODEL-LOCAL CLOCKS/.test(src)
  && /solver time and evolution parameters remain local to each active model\/equation/.test(src)
  && /DISPLAY CLOCK · non-physical/.test(src)
  && /semantic zoom are not physical time coordinates/.test(src));

ok('Time Machine visibly carries the passport without adding another panel',
  /const timePassport=hccTimePassport\(\);/.test(src)
  && /el\.dataset\.timeDomain=timePassport\.domain/.test(src)
  && /note\.textContent=timePassport\.compact/.test(src)
  && /note\.title=timePassport\.detail/.test(src)
  && /sub\.textContent=timePassport\.axisLabel\+' · J2000 '/.test(src)
  && !/id="timePassport"|timePassportPanel/.test(src));

ok('existing single-write time gateway remains intact',
  /setAtlasTime\(\{paused:!s\.paused\},'timeMachine\.play'\)/.test(src)
  && /setAtlasTime\(\{epochDays:state\.epochDays\+sign\*d, paused:true\},'timeMachine\.step'\)/.test(src)
  && /setAtlasTime\(\{rateDaysPerSecond:r\*\(atlasTimeDirection\(\)<0\?-1:1\), paused:false\},'timeMachine\.rate'\)/.test(src));

console.log(`\ntime-domain passport: ${pass} passed, ${fail} failed`);
process.exitCode=fail?1:0;
