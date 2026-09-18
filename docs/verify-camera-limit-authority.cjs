#!/usr/bin/env node
'use strict';

/*
  CAMERA LIMIT PROVENANCE

  A zoom ceiling/floor can make an otherwise continuous physical scale unreachable.
  Therefore the high-risk world/scale transitions must not anonymously overwrite
  OrbitControls limits. This verifier does not dictate the numerical limits; it
  verifies ownership, reason and unit metadata at the authority boundary.
*/
const fs=require('node:fs');
const src=fs.readFileSync('index.html','utf8');
let pass=0,fail=0;
function ok(name,cond,detail=''){
  if(cond){pass++;console.log(`PASS — ${name}${detail?` · ${detail}`:''}`);}
  else{fail++;console.error(`FAIL — ${name}${detail?` · ${detail}`:''}`);}
}

ok('distance-limit writes have one provenance-aware authority',
  /function setControlDistanceLimits\(min,max,meta\)\{/.test(src)
  && /schema:'hcc\.camera-limits\/1'/.test(src)
  && /globalThis\.HCC_CAMERA_LIMIT_AUTHORITY=hccCameraLimitAuthority/.test(src),
  'owner + reason + unit + world/view are inspectable without changing measurements');

ok('the authority records applied limits after the content-aware ceiling',
  /owner:String\(m\.owner\|\|'legacy-unattributed'\)/.test(src)
  && /reason:String\(m\.reason\|\|'unspecified framing'\)/.test(src)
  && /unit:String\(m\.unit\|\|'scene'\)/.test(src)
  && /effectiveMax:controls\.maxDistance/.test(src),
  'diagnostics describe what OrbitControls actually received, not only requested input');

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

ok('cross-world seam code still uses the canonical mode/goal gateways',
  src.includes("d>SCALE_SEAMS.solarObsOutGly*GLY_AU")
  && src.includes("dObs>SCALE_SEAMS.obsS3OutGly")
  && src.includes("dS3*SCALE_SEAMS.s3UnitGly<SCALE_SEAMS.s3ObsInGly")
  && (src.match(/hccCameraGoal\(/g)||[]).length>=4,
  'provenance is additive; it does not replace measured seam placement/goal pacing');

ok('camera provenance is diagnostics-only',
  !/HCC_CAMERA_LIMIT_AUTHORITY[^\n]{0,200}(?:S3R|HCC_S3R|B_phys|Sigma_grav|Γ_R)/.test(src),
  'camera ownership must never become a scientific input');

console.log(`\ncamera limit provenance: ${pass} passed, ${fail} failed`);
process.exitCode=fail?1:0;
