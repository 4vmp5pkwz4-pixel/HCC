#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const path='index.html';
let s=readFileSync(path,'utf8');
const original=s;
const start=s.indexOf('let _declaredMax=Infinity;');
const end=s.indexOf('/* ── A SELF-TEST THAT WALKS INTO A LABORATORY MUST PUT THE ROOM BACK',start);
if(start<0||end<0) throw new Error('camera authority anchors not found');

const authority=`let _declaredMax=Infinity;
let _cameraLimitSeq=0;
let _cameraLimitAuthority=Object.freeze({
  schema:'hcc.camera-limits/1',seq:0,owner:'boot',reason:'initial controls state',unit:'scene',
  world:'boot',view:'boot',min:null,declaredMax:null,effectiveMax:null,dynamicMin:null,dynamicReason:null
});
function hccCameraLimitAuthority(){ return {..._cameraLimitAuthority}; }
globalThis.HCC_CAMERA_LIMIT_AUTHORITY=hccCameraLimitAuthority;
function hccCameraLimitContext(reason='frame declaration',unit='scene'){
  const mode=state.mode||'unknown';
  let owner='mode:'+mode, resolvedUnit=unit;
  if(mode==='solar'){ owner='solar:'+(state.solarScaleLayer||'local'); if(unit==='scene') resolvedUnit='AU'; }
  else if(mode==='obs'){ owner='observable-world'; if(unit==='scene') resolvedUnit='Gly'; }
  else if(mode==='s3') owner='s3:'+(state.s3view||'sec');
  else if(mode==='cyc') owner='cycles:'+(state.cycFrame||'hierarchy');
  else if(mode==='field') owner='field:'+(state.fieldView||'default');
  else if(mode==='fractal') owner='fractal:'+(typeof fractalType==='string'?fractalType:'default');
  return {owner,reason,unit:resolvedUnit};
}
function hccRequireCameraLimitMeta(meta){
  if(!meta||typeof meta!=='object'||!meta.owner||!meta.reason||!meta.unit)
    throw new Error('camera distance limits require owner, reason and unit provenance');
  return meta;
}
/* Sole low-level writer. All declarative, transient, collision and restore paths go
   through here so no subsystem can silently become the last OrbitControls authority. */
function hccWriteControlDistanceLimits(min,max){
  controls.minDistance=min;
  controls.maxDistance=max;
}
function hccRecordCameraLimitAuthority(meta,extra={}){
  const m=hccRequireCameraLimitMeta(meta);
  _cameraLimitAuthority=Object.freeze({
    schema:'hcc.camera-limits/1',seq:++_cameraLimitSeq,
    owner:String(m.owner),reason:String(m.reason),unit:String(m.unit),
    world:zoomWorldKey(),
    view:state.mode==='s3'?(state.s3view||'sec'):state.mode==='cyc'?(state.cycFrame||'hierarchy'):(state.mode||'unknown'),
    min:controls.minDistance,declaredMax:_declaredMax,effectiveMax:controls.maxDistance,
    dynamicMin:null,dynamicReason:null,...extra
  });
}
function zoomCeilingNow(){
  const r=worldContentRadius();
  if(!(r>0)) return _declaredMax;
  const lo=r*HCC_ZOOM.floor;
  if(HCC_ZOOM.uncapped.includes(zoomWorldKey())) return Math.max(_declaredMax, lo);
  return THREE.MathUtils.clamp(_declaredMax, lo, r*HCC_ZOOM.ceiling);
}
function applyZoomCeiling(){
  const m=zoomCeilingNow();
  if(Number.isFinite(m)&&m>baseMinDistance*1.01){
    hccWriteControlDistanceLimits(controls.minDistance,m);
    if(_cameraLimitAuthority.seq>0)
      _cameraLimitAuthority=Object.freeze({..._cameraLimitAuthority,effectiveMax:m});
  }
}
function setControlDistanceLimits(min,max,meta){
  /* ── THE INTENT IS THE FINAL PLACEMENT, NOT THE FIRST CALL ─────────────────
     Goal capture is deferred because some framings declare limits before their final
     placement. An explicit hccCameraGoal still cancels the pending capture. Camera
     limit provenance is mandatory here: a framing that can make a physical scale
     unreachable must identify who owns the limit, why it exists and which unit it uses. */
  const m=hccRequireCameraLimitMeta(meta);
  _camGoalPending=true;
  baseMinDistance=Math.max(Number.isFinite(min)?min:1e-4,1e-12);
  _declaredMax=Math.max(Number.isFinite(max)?max:baseMinDistance*1e6,baseMinDistance*1.01);
  hccWriteControlDistanceLimits(baseMinDistance,_declaredMax);
  applyZoomCeiling();
  hccRecordCameraLimitAuthority(m);
}
function hccSetTransientControlDistanceLimits(min,max,meta){
  const m=hccRequireCameraLimitMeta(meta);
  hccWriteControlDistanceLimits(min,max);
  hccRecordCameraLimitAuthority(m,{transient:true});
}
function hccRestoreControlDistanceLimits(frame,meta,{restoreAuthority=null}={}){
  const m=hccRequireCameraLimitMeta(meta);
  baseMinDistance=Math.max(Number.isFinite(frame?.base)?frame.base:frame?.min,1e-12);
  _declaredMax=Math.max(Number.isFinite(frame?.declaredMax)?frame.declaredMax:frame?.max,baseMinDistance*1.01);
  hccWriteControlDistanceLimits(frame.min,frame.max);
  hccRecordCameraLimitAuthority(m,{restore:true});
  if(restoreAuthority) _cameraLimitAuthority=restoreAuthority;
}
function hccSetDynamicMinDistance(min,reason='navigation collision floor'){
  const value=Math.max(Number.isFinite(min)?min:baseMinDistance,baseMinDistance);
  hccWriteControlDistanceLimits(value,controls.maxDistance);
  if(_cameraLimitAuthority.seq>0)
    _cameraLimitAuthority=Object.freeze({..._cameraLimitAuthority,dynamicMin:value,dynamicReason:String(reason)});
}

`;

s=s.slice(0,start)+authority+s.slice(end);

const lines=s.split('\n');
let inBlock=false,annotated=0;
for(let li=0;li<lines.length;li++){
  let line=lines[li];
  if(inBlock){ if(line.includes('*/')) inBlock=false; continue; }
  const blockAt=line.indexOf('/*');
  const callAt=line.indexOf('setControlDistanceLimits(');
  if(blockAt>=0&&(callAt<0||blockAt<callAt)){
    if(!line.slice(blockAt+2).includes('*/')) inBlock=true;
    continue;
  }
  if(callAt<0||line.includes('function setControlDistanceLimits(')) continue;
  const slash=line.indexOf('//'); if(slash>=0&&slash<callAt) continue;
  const open=callAt+'setControlDistanceLimits'.length;
  let depth=0,close=-1,commas=0;
  for(let j=open;j<line.length;j++){
    const ch=line[j];
    if(ch==='(') depth++;
    else if(ch===')'){ depth--; if(depth===0){close=j;break;} }
    else if(ch===','&&depth===1) commas++;
  }
  if(close<0) throw new Error('multiline/unclosed camera limit call at line '+(li+1));
  if(commas===1){
    line=line.slice(0,close)+",hccCameraLimitContext('frame declaration')"+line.slice(close);
    lines[li]=line; annotated++;
  }
}
s=lines.join('\n');

const replacements=[
  ["controls.minDistance=0.01; controls.maxDistance=1e6;",
   "hccSetTransientControlDistanceLimits(0.01,1e6,{owner:'selftest:camera-goal',reason:'temporary framing-goal fixture',unit:'scene'});"],
  ["controls.minDistance=0.001; controls.maxDistance=1e7;",
   "hccSetTransientControlDistanceLimits(0.001,1e7,{owner:'selftest:scale-seam',reason:'temporary seam-glide fixture',unit:'scene'});"],
  ["controls.minDistance=keep.min; controls.maxDistance=keep.max;",
   "hccSetTransientControlDistanceLimits(keep.min,keep.max,{owner:'selftest:restore',reason:'restore temporary camera-limit fixture',unit:'scene'});"],
  ["baseMinDistance=f.base; controls.minDistance=f.min; controls.maxDistance=f.max;",
   "hccRestoreControlDistanceLimits({min:f.min,max:f.max,base:f.base,declaredMax:f.declared},{owner:'selftest:lab-walk',reason:'restore pre-walk camera limits',unit:'scene'},{restoreAuthority:f.authority});"],
  ["controls.minDistance=Math.max(baseMinDistance,navigationCollisionRadius());",
   "hccSetDynamicMinDistance(Math.max(baseMinDistance,navigationCollisionRadius()),'navigation collision floor');"],
  ["controls.target.fromArray(snap.camera.target);controls.minDistance=snap.camera.minDistance;controls.maxDistance=snap.camera.maxDistance;",
   "controls.target.fromArray(snap.camera.target);hccSetTransientControlDistanceLimits(snap.camera.minDistance,snap.camera.maxDistance,{owner:'model-portal:return',reason:'restore captured portal framing',unit:'scene'});"]
];
for(const [from,to] of replacements){
  if(!s.includes(from)) throw new Error('expected raw-write anchor missing: '+from);
  s=s.split(from).join(to);
}
const frameOld="min:controls.minDistance, max:controls.maxDistance, base:baseMinDistance};";
if(!s.includes(frameOld)) throw new Error('labWalkFrame anchor missing');
s=s.replace(frameOld,"min:controls.minDistance, max:controls.maxDistance, base:baseMinDistance, declared:_declaredMax, authority:_cameraLimitAuthority};");

const minWrites=(s.match(/controls\.minDistance\s*=/g)||[]).length;
const maxWrites=(s.match(/controls\.maxDistance\s*=/g)||[]).length;
if(minWrites!==1||maxWrites!==1) throw new Error(`raw writer closure failed min=${minWrites} max=${maxWrites}`);
if(/legacy-unattributed|unspecified framing/.test(s)) throw new Error('legacy provenance fallback remains');

const live=[]; let block=false;
for(const line of s.split(/\r?\n/)){
  if(block){if(line.includes('*/'))block=false;continue;}
  const ba=line.indexOf('/*'),ca=line.indexOf('setControlDistanceLimits(');
  if(ba>=0&&(ca<0||ba<ca)){if(!line.slice(ba+2).includes('*/'))block=true;continue;}
  if(ca<0||line.includes('function setControlDistanceLimits('))continue;
  const sl=line.indexOf('//');if(sl>=0&&sl<ca)continue;
  live.push(line);
}
const untagged=live.filter(line=>{
  const at=line.indexOf('setControlDistanceLimits('),open=at+'setControlDistanceLimits'.length;
  let depth=0,commas=0;
  for(let i=open;i<line.length;i++){const ch=line[i];if(ch==='(')depth++;else if(ch===')'){depth--;if(depth===0)break;}else if(ch===','&&depth===1)commas++;}
  return commas<2;
});
if(untagged.length) throw new Error('untagged declarations remain: '+untagged.slice(0,4).join(' | '));
if(s===original) throw new Error('no source change');

writeFileSync(path,s);
console.log(`camera authority closure applied: ${annotated} legacy calls attributed · ${live.length} live declarations · raw writes ${minWrites}/${maxWrites}`);


// Install the permanent closure verifier in the same atomic source mutation.
writeFileSync('docs/verify-camera-limit-authority.cjs',"#!/usr/bin/env node\n'use strict';\n\n/*\n  CAMERA LIMIT AUTHORITY CLOSURE\n\n  Camera reach is part of scale continuity: an anonymous OrbitControls floor/ceiling\n  can make a physically present scale unreachable. Every framing therefore declares\n  provenance, while all low-level min/max writes pass through one internal writer.\n*/\nconst fs=require('node:fs');\nconst src=fs.readFileSync('index.html','utf8');\nlet pass=0,fail=0;\nfunction ok(name,cond,detail=''){\n  if(cond){pass++;console.log(`PASS — ${name}${detail?` · ${detail}`:''}`);}\n  else{fail++;console.error(`FAIL — ${name}${detail?` · ${detail}`:''}`);}\n}\n\nok('one strict provenance-aware authority owns camera distance declarations',\n  /function setControlDistanceLimits\\(min,max,meta\\)\\{/.test(src)\n  && /function hccRequireCameraLimitMeta\\(meta\\)\\{/.test(src)\n  && /camera distance limits require owner, reason and unit provenance/.test(src)\n  && /globalThis\\.HCC_CAMERA_LIMIT_AUTHORITY=hccCameraLimitAuthority/.test(src),\n  'owner + reason + unit are mandatory, not optional fallbacks');\n\nok('there is exactly one low-level OrbitControls min/max writer',\n  (src.match(/controls\\.minDistance\\s*=/g)||[]).length===1\n  && (src.match(/controls\\.maxDistance\\s*=/g)||[]).length===1\n  && /function hccWriteControlDistanceLimits\\(min,max\\)\\{[\\s\\S]{0,160}controls\\.minDistance=min;[\\s\\S]{0,120}controls\\.maxDistance=max;/.test(src),\n  'declarations, restores, transient fixtures and collision floors cannot bypass authority');\n\nok('content-aware ceiling, restores, transient limits and collision floor all use the sole writer',\n  /function applyZoomCeiling\\(\\)[\\s\\S]{0,450}hccWriteControlDistanceLimits\\(controls\\.minDistance,m\\)/.test(src)\n  && /function hccRestoreControlDistanceLimits\\(frame,meta/.test(src)\n  && /function hccSetTransientControlDistanceLimits\\(min,max,meta\\)/.test(src)\n  && /function hccSetDynamicMinDistance\\(min,reason/.test(src));\n\nok('anonymous legacy provenance fallbacks are gone',\n  !/legacy-unattributed|unspecified framing/.test(src));\n\n/* Read live call lines, excluding block comments, and require a third top-level arg. */\nconst live=[];\nlet block=false;\nfor(const line of src.split(/\\r?\\n/)){\n  if(block){if(line.includes('*/'))block=false;continue;}\n  const ba=line.indexOf('/*'), ca=line.indexOf('setControlDistanceLimits(');\n  if(ba>=0&&(ca<0||ba<ca)){if(!line.slice(ba+2).includes('*/'))block=true;continue;}\n  if(ca<0||line.includes('function setControlDistanceLimits('))continue;\n  const sl=line.indexOf('//');if(sl>=0&&sl<ca)continue;\n  live.push(line);\n}\nfunction topCommas(line){\n  const at=line.indexOf('setControlDistanceLimits('),open=at+'setControlDistanceLimits'.length;\n  let depth=0,commas=0;\n  for(let i=open;i<line.length;i++){\n    const ch=line[i];\n    if(ch==='(')depth++;\n    else if(ch===')'){depth--;if(depth===0)break;}\n    else if(ch===','&&depth===1)commas++;\n  }\n  return commas;\n}\nconst untagged=live.filter(line=>topCommas(line)<2);\nok('every live distance-limit declaration carries provenance',\n  live.length>=40&&untagged.length===0,\n  `${live.length} live declarations · ${untagged.length} anonymous`);\n\nok('generic framing provenance resolves to the active world/view and an honest unit',\n  /function hccCameraLimitContext\\(reason='frame declaration',unit='scene'\\)/.test(src)\n  && /owner='solar:'\\+\\(state\\.solarScaleLayer\\|\\|'local'\\)/.test(src)\n  && /owner='s3:'\\+\\(state\\.s3view\\|\\|'sec'\\)/.test(src)\n  && /owner='cycles:'\\+\\(state\\.cycFrame\\|\\|'hierarchy'\\)/.test(src)\n  && /resolvedUnit='AU'/.test(src)\n  && /resolvedUnit='Gly'/.test(src));\n\nok('high-risk cross-scale owners remain more specific than the generic fallback',\n  (src.match(/owner:'solar-scale-preset'/g)||[]).length===4\n  && (src.match(/owner:'solar-scale-handoff'/g)||[]).length===4\n  && /owner:'observable-world'/.test(src)\n  && /owner:'s3-section'/.test(src));\n\nok('lab-walk restoration preserves declared ceiling and prior authority',\n  /declared:_declaredMax, authority:_cameraLimitAuthority/.test(src)\n  && /hccRestoreControlDistanceLimits\\(\\{min:f\\.min,max:f\\.max,base:f\\.base,declaredMax:f\\.declared\\}/.test(src)\n  && /restoreAuthority:f\\.authority/.test(src),\n  'self-tests may visit another room but cannot leave its camera authority behind');\n\nok('dynamic collision and model-portal restoration use attributed authority paths',\n  /hccSetDynamicMinDistance\\(Math\\.max\\(baseMinDistance,navigationCollisionRadius\\(\\)\\),'navigation collision floor'\\)/.test(src)\n  && /owner:'model-portal:return',reason:'restore captured portal framing'/.test(src));\n\nok('cross-world seams still use canonical seam and camera-goal gateways',\n  src.includes('d>SCALE_SEAMS.solarObsOutGly*GLY_AU')\n  && src.includes('dObs>SCALE_SEAMS.obsS3OutGly')\n  && src.includes('dS3*SCALE_SEAMS.s3UnitGly<SCALE_SEAMS.s3ObsInGly')\n  && (src.match(/hccCameraGoal\\(/g)||[]).length>=4,\n  'authority adds observability; it does not change seam constants or pacing');\n\nok('camera provenance remains diagnostics-only',\n  !/HCC_CAMERA_LIMIT_AUTHORITY[^\\n]{0,220}(?:S3R|HCC_S3R|B_phys|Sigma_grav|Γ_R)/.test(src));\n\nconsole.log(`\\ncamera limit authority: ${pass} passed, ${fail} failed`);\nprocess.exitCode=fail?1:0;\n");
console.log('camera authority verifier updated');
