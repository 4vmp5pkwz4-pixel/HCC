#!/usr/bin/env node
'use strict';

/*
  CAMERA LIMIT AUTHORITY · v2

  Camera floors/ceilings are navigation state, not scientific state. Cross-scale
  seams are especially sensitive because an unrelated late write can make the
  mapped destination unreachable. The authority therefore records provenance and
  refuses only anonymous legacy takeovers while a paced cross-scale goal is live.
*/
const fs=require('node:fs');
const src=fs.readFileSync('index.html','utf8');
let pass=0,fail=0;
function ok(name,cond,detail=''){
  if(cond){pass++;console.log(`PASS — ${name}${detail?` · ${detail}`:''}`);}
  else{fail++;console.error(`FAIL — ${name}${detail?` · ${detail}`:''}`);}
}

ok('distance-limit writes have one inspectable v2 authority',
  /function setControlDistanceLimits\(min,max,meta\)\{/.test(src)
  && /schema:'hcc\.camera-limits\/2'/.test(src)
  && /globalThis\.HCC_CAMERA_LIMIT_AUTHORITY=hccCameraLimitAuthority/.test(src),
  'owner + reason + unit + acceptance/refusal state are exposed without touching scientific outputs');

ok('accepted writes report the effective post-ceiling limits',
  /owner,\s*\n\s*reason:String\(m\.reason\|\|'unspecified framing'\)/.test(src)
  && /requestedMin:min/.test(src)
  && /requestedMax:max/.test(src)
  && /effectiveMax:controls\.maxDistance/.test(src)
  && /accepted:true/.test(src)
  && /blockedBy:null/.test(src),
  'diagnostics describe requested and actually applied navigation state');

const authorityStart=src.indexOf('function setControlDistanceLimits(min,max,meta){');
const authorityEnd=src.indexOf('/* ── A SELF-TEST THAT WALKS',authorityStart);
const authority=authorityStart>=0&&authorityEnd>authorityStart?src.slice(authorityStart,authorityEnd):'';
const refuseAt=authority.indexOf("if(_cameraCrossScaleLock && owner==='legacy-unattributed')");
const writeAt=authority.indexOf('_camGoalPending=true;');
ok('anonymous legacy writes are refused before they can mutate limits during a cross-scale lock',
  refuseAt>=0 && writeAt>refuseAt
  && /_cameraLimitBlocked\+\+/.test(authority)
  && /accepted:false/.test(authority)
  && /blockedBy:'active-cross-scale-goal'/.test(authority)
  && /return false;/.test(authority),
  'the refusal is fail-closed only for unattributed writers while a seam owns the crossing');

ok('ordinary and attributed writes remain compatible',
  /const owner=String\(m\.owner\|\|'legacy-unattributed'\)/.test(authority)
  && /return true;/.test(authority),
  'local laboratory framing is unchanged outside an active cross-scale lock');

ok('the lock is acquired only by the canonical paced seam cadence',
  /_cameraCrossScaleLock=Number\.isFinite\(_camGoal\)&&_camGoalStep>1&&frames===SCALE_SEAMS\.crossFrames;/.test(src),
  'ordinary frame goals do not become cross-scale authority leases');

ok('the lock is released both explicitly and on measured arrival',
  /function hccCameraGoalClear\(\)\{ _camGoal=NaN; _camGoalStep=0; _camGoalPending=false; _cameraCrossScaleLock=false; \}/.test(src)
  && /Math\.abs\(safe\/_camGoal-1\)<0\.004\)\{ _camGoal=NaN; _cameraCrossScaleLock=false; \}/.test(src),
  'a completed or abandoned crossing cannot leave navigation locked');

ok('Observable zoom limits declare ownership and Gly units',
  /setControlDistanceLimits\(SCALE_SEAMS\.obsSolarInGly\*0\.6, outer,\{owner:'observable-world',reason:bandOn\?'curvature-band reachability':'scale-seam reachability',unit:'Gly'\}\)/.test(src));

ok('explicit Solar scale presets declare AU ownership',
  (src.match(/owner:'solar-scale-preset'/g)||[]).length===4
  && (src.match(/unit:'AU'/g)||[]).length>=8,
  'local, galactic, Andromeda and cosmic presets identify the unit system');

ok('automatic Solar scale handoffs declare a distinct owner',
  (src.match(/owner:'solar-scale-handoff'/g)||[]).length===4,
  'an automatic crossing cannot masquerade as a user framing preset');

ok('the S3 global section declares carrier-scene ownership',
  /setControlDistanceLimits\(RU\*0\.05, RU\*24,\{owner:'s3-section',reason:'global carrier framing',unit:'carrier-scene'\}\)/.test(src));

ok('cross-world seams still use the canonical mode and goal gateways',
  src.includes("d>SCALE_SEAMS.solarObsOutGly*GLY_AU")
  && src.includes("dObs>SCALE_SEAMS.obsS3OutGly")
  && src.includes("dS3*SCALE_SEAMS.s3UnitGly<SCALE_SEAMS.s3ObsInGly")
  && (src.match(/hccCameraGoal\(/g)||[]).length>=4,
  'authority enforcement is additive; it does not move seam thresholds or replace placement/goal pacing');

ok('camera authority remains diagnostics-only',
  !/HCC_CAMERA_LIMIT_AUTHORITY[^\n]{0,240}(?:S3R|HCC_S3R|B_phys|Sigma_grav|Γ_R)/.test(src),
  'navigation provenance must never become a scientific input');

console.log(`\ncamera limit authority: ${pass} passed, ${fail} failed`);
process.exitCode=fail?1:0;
