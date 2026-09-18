#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const file='index.html';
let s=readFileSync(file,'utf8');
const done=[];
function replace1(oldText,newText,label){
  const i=s.indexOf(oldText);
  if(i<0) throw new Error('missing anchor: '+label);
  s=s.slice(0,i)+newText+s.slice(i+oldText.length);
  done.push(label);
}

replace1(
`function setControlDistanceLimits(min,max){
  /* ── THE INTENT IS THE FINAL PLACEMENT, NOT THE FIRST CALL ─────────────────`,
`let _cameraLimitSeq=0;
let _cameraLimitAuthority=Object.freeze({
  schema:'hcc.camera-limits/1',seq:0,owner:'boot',reason:'initial controls state',unit:'scene',
  world:'boot',view:'boot',min:null,declaredMax:null,effectiveMax:null
});
function hccCameraLimitAuthority(){ return {..._cameraLimitAuthority}; }
globalThis.HCC_CAMERA_LIMIT_AUTHORITY=hccCameraLimitAuthority;
function setControlDistanceLimits(min,max,meta){
  /* ── THE INTENT IS THE FINAL PLACEMENT, NOT THE FIRST CALL ─────────────────`,
'authority declaration');

replace1(
`  controls.maxDistance=_declaredMax;
  applyZoomCeiling();
}
/* ── A SELF-TEST THAT WALKS INTO A LABORATORY MUST PUT THE ROOM BACK`,
`  controls.maxDistance=_declaredMax;
  applyZoomCeiling();
  const m=(meta&&typeof meta==='object')?meta:{};
  _cameraLimitAuthority=Object.freeze({
    schema:'hcc.camera-limits/1',
    seq:++_cameraLimitSeq,
    owner:String(m.owner||'legacy-unattributed'),
    reason:String(m.reason||'unspecified framing'),
    unit:String(m.unit||'scene'),
    world:zoomWorldKey(),
    view:state.mode==='s3'?(state.s3view||'sec'):state.mode==='cycles'?(state.cycFrame||'hierarchy'):(state.mode||'unknown'),
    min:controls.minDistance,
    declaredMax:_declaredMax,
    effectiveMax:controls.maxDistance
  });
}
/* ── A SELF-TEST THAT WALKS INTO A LABORATORY MUST PUT THE ROOM BACK`,
'authority record');

replace1(
`  try{ setControlDistanceLimits(SCALE_SEAMS.obsSolarInGly*0.6, outer); }catch(e){}`,
`  try{ setControlDistanceLimits(SCALE_SEAMS.obsSolarInGly*0.6, outer,{owner:'observable-world',reason:bandOn?'curvature-band reachability':'scale-seam reachability',unit:'Gly'}); }catch(e){}`,
'observable provenance');

replace1(
`function setSolarScaleLayer(layer){
  state.solarScaleLayer=layer; clearFocus();
  if(layer==='local'){
    frameSolarOverview(); setControlDistanceLimits(.0001,300000);
  } else if(layer==='galactic'){
    controls.target.copy(milkyWayPhysical.position.clone().multiplyScalar(.5));
    camera.position.copy(controls.target).addScaledVector(GAL_DATA.pole.dir,120000*LY_AU);
    setControlDistanceLimits(1,5e6*LY_AU);          // min=1 AU: the reverse zoom must reach the down-step thresholds
  } else if(layer==='andromeda'){
    controls.target.copy(GAL_DATA.m31.pos);
    camera.position.copy(GAL_DATA.m31.pos).addScaledVector(GAL_DATA.m31.dir,-230000*LY_AU);
    setControlDistanceLimits(1,8e6*LY_AU);
  } else {
    controls.target.set(0,0,0); camera.position.set(0,10*GLY_AU,22*GLY_AU);
    setControlDistanceLimits(1,800*GLY_AU);`,
`function setSolarScaleLayer(layer){
  state.solarScaleLayer=layer; clearFocus();
  if(layer==='local'){
    frameSolarOverview(); setControlDistanceLimits(.0001,300000,{owner:'solar-scale-preset',reason:'local Solar framing',unit:'AU'});
  } else if(layer==='galactic'){
    controls.target.copy(milkyWayPhysical.position.clone().multiplyScalar(.5));
    camera.position.copy(controls.target).addScaledVector(GAL_DATA.pole.dir,120000*LY_AU);
    setControlDistanceLimits(1,5e6*LY_AU,{owner:'solar-scale-preset',reason:'galactic framing',unit:'AU'});          // min=1 AU: the reverse zoom must reach the down-step thresholds
  } else if(layer==='andromeda'){
    controls.target.copy(GAL_DATA.m31.pos);
    camera.position.copy(GAL_DATA.m31.pos).addScaledVector(GAL_DATA.m31.dir,-230000*LY_AU);
    setControlDistanceLimits(1,8e6*LY_AU,{owner:'solar-scale-preset',reason:'Local Group framing',unit:'AU'});
  } else {
    controls.target.set(0,0,0); camera.position.set(0,10*GLY_AU,22*GLY_AU);
    setControlDistanceLimits(1,800*GLY_AU,{owner:'solar-scale-preset',reason:'cosmic-web framing',unit:'AU'});`,
'solar scale presets');

replace1(
`function advanceScaleLayer(layer){
  state.solarScaleLayer=layer;
  // seamless variant: visibility, clipping and zoom limits only — camera & target stay
  if(layer==='local') setControlDistanceLimits(.0001,300000);
  else if(layer==='galactic') setControlDistanceLimits(1,5e6*LY_AU);
  else if(layer==='andromeda') setControlDistanceLimits(1,8e6*LY_AU);
  else setControlDistanceLimits(1,800*GLY_AU);`,
`function advanceScaleLayer(layer){
  state.solarScaleLayer=layer;
  // seamless variant: visibility, clipping and zoom limits only — camera & target stay
  if(layer==='local') setControlDistanceLimits(.0001,300000,{owner:'solar-scale-handoff',reason:'automatic local-layer limits',unit:'AU'});
  else if(layer==='galactic') setControlDistanceLimits(1,5e6*LY_AU,{owner:'solar-scale-handoff',reason:'automatic galactic-layer limits',unit:'AU'});
  else if(layer==='andromeda') setControlDistanceLimits(1,8e6*LY_AU,{owner:'solar-scale-handoff',reason:'automatic Local Group limits',unit:'AU'});
  else setControlDistanceLimits(1,800*GLY_AU,{owner:'solar-scale-handoff',reason:'automatic cosmic-web limits',unit:'AU'});`,
'automatic solar handoffs');

replace1(
`  setControlDistanceLimits(RU*0.05, RU*24);
  return {aim:O.clone(), distance:camera.position.distanceTo(O), sphereDistance:d};`,
`  setControlDistanceLimits(RU*0.05, RU*24,{owner:'s3-section',reason:'global carrier framing',unit:'carrier-scene'});
  return {aim:O.clone(), distance:camera.position.distanceTo(O), sphereDistance:d};`,
's3 section provenance');

writeFileSync(file,s);
console.log('camera authority patch applied:',done.join(', '));
