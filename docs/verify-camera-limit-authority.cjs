#!/usr/bin/env node
'use strict';

const fs=require('node:fs');
const src=fs.readFileSync('index.html','utf8');
let pass=0,fail=0;
function ok(name,cond,detail=''){
  if(cond){pass++;console.log(`PASS — ${name}${detail?` · ${detail}`:''}`);}
  else{fail++;console.error(`FAIL — ${name}${detail?` · ${detail}`:''}`);}
}
const count=re=>(src.match(re)||[]).length;

ok('navigation reach has one low-level OrbitControls writer',
  /function hccCommitControlDistanceLimits\(min,max,meta\)\{/.test(src)
  && count(/controls\.minDistance=/g)===1
  && count(/controls\.maxDistance=/g)===1,
  `raw writes: min=${count(/controls\.minDistance=/g)}, max=${count(/controls\.maxDistance=/g)}`);

ok('every camera-limit write carries inspectable provenance',
  /schema:'hcc\.camera-limits\/2'/.test(src)
  && /globalThis\.HCC_CAMERA_LIMIT_AUTHORITY=hccCameraLimitAuthority/.test(src)
  && /owner:String\(m\.owner\|\|\('frame:'\+mode\+':'\+view\)\)/.test(src)
  && /reason:String\(m\.reason\|\|'frame reach declaration'\)/.test(src)
  && /unit:String\(m\.unit\|\|hccCameraLimitUnit\(\)\)/.test(src)
  && /source:String\(m\.source\|\|'frame-declaration'\)/.test(src)
  && !src.includes('legacy-unattributed'),
  'legacy calls are attributed from world/view instead of silently anonymous');

ok('physical unit language is explicit where it is meaningful',
  /if\(state\.mode==='solar'\) return 'AU'/.test(src)
  && /if\(state\.mode==='obs'\) return 'Gly'/.test(src)
  && /if\(state\.mode==='s3'\) return 'carrier-scene'/.test(src)
  && /return 'model-scene'/.test(src));

ok('content ceiling uses the same writer rather than becoming a second authority',
  /function applyZoomCeiling\(meta\)[\s\S]{0,700}hccCommitControlDistanceLimits\(controls\.minDistance,m,\{\.\.\.p,source:'content-aware-ceiling'\}\)/.test(src));

ok('collision floor uses the same writer and only records when the effective floor changes',
  /const collisionMin=Math\.max\(baseMinDistance,navigationCollisionRadius\(\)\);[\s\S]{0,260}controls\.minDistance!==collisionMin[\s\S]{0,260}hccCommitControlDistanceLimits\(collisionMin,controls\.maxDistance,hccCameraLimitCurrentMeta/.test(src));

ok('self-tests exercise the real writer without becoming the user's last authority',
  count(/source:'selftest'/g)>=2
  && count(/source:'selftest-restore'/g)>=2
  && count(/record:false/g)>=4);

ok('model-portal return restores both limits and their captured provenance',
  /limitAuthority:hccCameraLimitAuthority\(\)/.test(src)
  && /hccCommitControlDistanceLimits\(snap\.camera\.minDistance,snap\.camera\.maxDistance,\{\.\.\.\(snap\.camera\.limitAuthority\|\|\{\}\),reason:'restore model-portal camera frame',source:'model-portal-restore'\}\)/.test(src));

ok('high-risk scale crossings retain explicit owners and units',
  (src.match(/owner:'solar-scale-preset'/g)||[]).length===4
  && (src.match(/owner:'solar-scale-handoff'/g)||[]).length===4
  && /owner:'observable-world'/.test(src)
  && /owner:'s3-section'/.test(src)
  && (src.match(/unit:'AU'/g)||[]).length>=8
  && /unit:'Gly'/.test(src)
  && /unit:'carrier-scene'/.test(src));

const clipStart=src.indexOf('function syncCameraClipping(force=false)');
const clipEnd=clipStart<0?-1:src.indexOf('function navigationCollisionRadius()',clipStart);
const clip=clipStart>=0&&clipEnd>clipStart?src.slice(clipStart,clipEnd):'';
ok('render clipping remains a separate single authority',
  count(/camera\.near=/g)===1
  && count(/camera\.far=/g)===1
  && /camera\.near=near;camera\.far=far/.test(clip)
  && !/hccCommitControlDistanceLimits/.test(clip),
  'navigation reach metadata cannot become a render-depth or scientific input');

ok('cross-world seams still use canonical placement and paced-goal gateways',
  src.includes("d>SCALE_SEAMS.solarObsOutGly*GLY_AU")
  && src.includes("dObs>SCALE_SEAMS.obsS3OutGly")
  && src.includes("dS3*SCALE_SEAMS.s3UnitGly<SCALE_SEAMS.s3ObsInGly")
  && count(/hccCameraGoal\(/g)>=4);

ok('camera provenance is diagnostics-only',
  !/HCC_CAMERA_LIMIT_AUTHORITY[^\n]{0,240}(?:S3R|HCC_S3R|B_phys|Sigma_grav|Γ_R)/.test(src));

console.log(`\ncamera limit authority: ${pass} passed, ${fail} failed`);
process.exitCode=fail?1:0;
