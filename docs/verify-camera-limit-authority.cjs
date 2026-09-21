#!/usr/bin/env node
'use strict';

/*
  CAMERA LIMIT AUTHORITY CLOSURE

  Camera reach is part of scale continuity: an anonymous OrbitControls floor/ceiling
  can make a physically present scale unreachable. Every framing therefore declares
  provenance, while all low-level min/max writes pass through one internal writer.
*/
const fs=require('node:fs');
const src=fs.readFileSync('index.html','utf8');
let pass=0,fail=0;
function ok(name,cond,detail=''){
  if(cond){pass++;console.log(`PASS — ${name}${detail?` · ${detail}`:''}`);}
  else{fail++;console.error(`FAIL — ${name}${detail?` · ${detail}`:''}`);}
}

ok('one strict provenance-aware authority owns camera distance declarations',
  /function setControlDistanceLimits\(min,max,meta\)\{/.test(src)
  && /function hccRequireCameraLimitMeta\(meta\)\{/.test(src)
  && /camera distance limits require owner, reason and unit provenance/.test(src)
  && /globalThis\.HCC_CAMERA_LIMIT_AUTHORITY=hccCameraLimitAuthority/.test(src),
  'owner + reason + unit are mandatory, not optional fallbacks');

ok('there is exactly one low-level OrbitControls min/max writer',
  (src.match(/controls\.minDistance\s*=/g)||[]).length===1
  && (src.match(/controls\.maxDistance\s*=/g)||[]).length===1
  && /function hccWriteControlDistanceLimits\(min,max\)\{[\s\S]{0,160}controls\.minDistance=min;[\s\S]{0,120}controls\.maxDistance=max;/.test(src),
  'declarations, restores, transient fixtures and collision floors cannot bypass authority');

ok('content-aware ceiling, restores, transient limits and collision floor all use the sole writer',
  /function applyZoomCeiling\(\)[\s\S]{0,450}hccWriteControlDistanceLimits\(controls\.minDistance,m\)/.test(src)
  && /function hccRestoreControlDistanceLimits\(frame,meta/.test(src)
  && /function hccSetTransientControlDistanceLimits\(min,max,meta\)/.test(src)
  && /function hccSetDynamicMinDistance\(min,reason/.test(src));

ok('anonymous legacy provenance fallbacks are gone',
  !/legacy-unattributed|unspecified framing/.test(src));

/* Read live call lines, excluding block comments, and require a third top-level arg. */
const live=[];
let block=false;
for(const line of src.split(/\r?\n/)){
  if(block){if(line.includes('*/'))block=false;continue;}
  const ba=line.indexOf('/*'), ca=line.indexOf('setControlDistanceLimits(');
  if(ba>=0&&(ca<0||ba<ca)){if(!line.slice(ba+2).includes('*/'))block=true;continue;}
  if(ca<0||line.includes('function setControlDistanceLimits('))continue;
  const sl=line.indexOf('//');if(sl>=0&&sl<ca)continue;
  live.push(line);
}
function topCommas(line){
  const at=line.indexOf('setControlDistanceLimits('),open=at+'setControlDistanceLimits'.length;
  let depth=0,commas=0;
  for(let i=open;i<line.length;i++){
    const ch=line[i];
    if(ch==='(')depth++;
    else if(ch===')'){depth--;if(depth===0)break;}
    else if(ch===','&&depth===1)commas++;
  }
  return commas;
}
const untagged=live.filter(line=>topCommas(line)<2);
ok('every live distance-limit declaration carries provenance',
  live.length>=40&&untagged.length===0,
  `${live.length} live declarations · ${untagged.length} anonymous`);

ok('generic framing provenance resolves to the active world/view and an honest unit',
  /function hccCameraLimitContext\(reason='frame declaration',unit='scene'\)/.test(src)
  && /owner='solar:'\+\(state\.solarScaleLayer\|\|'local'\)/.test(src)
  && /owner='s3:'\+\(state\.s3view\|\|'sec'\)/.test(src)
  && /owner='cycles:'\+\(state\.cycFrame\|\|'hierarchy'\)/.test(src)
  && /resolvedUnit='AU'/.test(src)
  && /resolvedUnit='Gly'/.test(src));

ok('high-risk cross-scale owners remain more specific than the generic fallback',
  (src.match(/owner:'solar-scale-preset'/g)||[]).length===4
  && (src.match(/owner:'solar-scale-handoff'/g)||[]).length===4
  && /owner:'observable-world'/.test(src)
  && /owner:'s3-section'/.test(src));

ok('lab-walk restoration preserves declared ceiling and prior authority',
  /declared:_declaredMax, authority:_cameraLimitAuthority/.test(src)
  && /hccRestoreControlDistanceLimits\(\{min:f\.min,max:f\.max,base:f\.base,declaredMax:f\.declared\}/.test(src)
  && /restoreAuthority:f\.authority/.test(src),
  'self-tests may visit another room but cannot leave its camera authority behind');

ok('dynamic collision and model-portal restoration use attributed authority paths',
  /hccSetDynamicMinDistance\(Math\.max\(baseMinDistance,navigationCollisionRadius\(\)\),'navigation collision floor'\)/.test(src)
  && /owner:'model-portal:return',reason:'restore captured portal framing'/.test(src));

ok('cross-world seams still use canonical seam and camera-goal gateways',
  src.includes('d>SCALE_SEAMS.solarObsOutGly*GLY_AU')
  && src.includes('dObs>SCALE_SEAMS.obsS3OutGly')
  && src.includes('dS3*SCALE_SEAMS.s3UnitGly<SCALE_SEAMS.s3ObsInGly')
  && (src.match(/hccCameraGoal\(/g)||[]).length>=4,
  'authority adds observability; it does not change seam constants or pacing');

ok('camera provenance remains diagnostics-only',
  !/HCC_CAMERA_LIMIT_AUTHORITY[^\n]{0,220}(?:S3R|HCC_S3R|B_phys|Sigma_grav|Γ_R)/.test(src));

console.log(`\ncamera limit authority: ${pass} passed, ${fail} failed`);
process.exitCode=fail?1:0;
