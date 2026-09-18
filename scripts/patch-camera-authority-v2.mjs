#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const path='index.html';
let c=readFileSync(path,'utf8');

const blockStart=c.indexOf('function applyZoomCeiling()');
const blockEnd=c.indexOf('/* ── A SELF-TEST THAT WALKS INTO A LABORATORY',blockStart);
if(blockStart<0||blockEnd<0) throw new Error('camera authority block not found');

const newBlock=`let _cameraLimitSeq=0;
let _cameraLimitAuthority=Object.freeze({
  schema:'hcc.camera-limits/2',seq:0,owner:'boot',reason:'initial controls state',unit:'scene',
  source:'boot',world:'boot',view:'boot',requestedMin:null,requestedMax:null,min:null,declaredMax:null,effectiveMax:null
});
function hccCameraLimitAuthority(){ return {..._cameraLimitAuthority}; }
globalThis.HCC_CAMERA_LIMIT_AUTHORITY=hccCameraLimitAuthority;
function hccCameraLimitUnit(){
  if(state.mode==='solar') return 'AU';
  if(state.mode==='obs') return 'Gly';
  if(state.mode==='s3') return 'carrier-scene';
  return 'model-scene';
}
function hccCameraLimitFrameMeta(meta){
  const m=(meta&&typeof meta==='object')?meta:{};
  const mode=state.mode||'unknown';
  const view=mode==='s3'?(state.s3view||'sec')
    :mode==='cyc'?(state.cycFrame||'hierarchy')
    :mode==='solar'?(state.solarScaleLayer||'local')
    :mode==='fractal'?(fractalType||'unknown'):mode;
  return {
    owner:String(m.owner||('frame:'+mode+':'+view)),
    reason:String(m.reason||'frame reach declaration'),
    unit:String(m.unit||hccCameraLimitUnit()),
    source:String(m.source||'frame-declaration'),
    world:zoomWorldKey(),view,
    requestedMin:m.requestedMin??null,requestedMax:m.requestedMax??null,
    declaredMax:m.declaredMax??_declaredMax,
    record:m.record!==false
  };
}
function hccCameraLimitCurrentMeta(overrides){
  const a=_cameraLimitAuthority;
  return hccCameraLimitFrameMeta({
    owner:a.owner,unit:a.unit,
    requestedMin:a.requestedMin,requestedMax:a.requestedMax,declaredMax:_declaredMax,
    ...(overrides||{})
  });
}
function hccCommitControlDistanceLimits(min,max,meta){
  const m=hccCameraLimitFrameMeta(meta);
  const lo=(Number.isFinite(min)&&min>0)?min:Math.max(Number.isFinite(controls.minDistance)?controls.minDistance:1e-4,1e-12);
  const hi=max===Infinity?Infinity:((Number.isFinite(max)&&max>lo)?max:Math.max(lo*1.01,lo*1e6));
  controls.minDistance=lo;
  controls.maxDistance=hi;
  if(m.record){
    _cameraLimitAuthority=Object.freeze({
      schema:'hcc.camera-limits/2',seq:++_cameraLimitSeq,
      owner:m.owner,reason:m.reason,unit:m.unit,source:m.source,
      world:m.world,view:m.view,
      requestedMin:m.requestedMin,requestedMax:m.requestedMax,
      min:lo,declaredMax:m.declaredMax,effectiveMax:hi
    });
  }
  return {min:lo,max:hi};
}
function applyZoomCeiling(meta){
  const m=zoomCeilingNow();
  if(Number.isFinite(m)&&m>baseMinDistance*1.01){
    const p=meta?hccCameraLimitFrameMeta(meta):hccCameraLimitCurrentMeta();
    return hccCommitControlDistanceLimits(controls.minDistance,m,{...p,source:'content-aware-ceiling'});
  }
  return {min:controls.minDistance,max:controls.maxDistance};
}
function setControlDistanceLimits(min,max,meta){
  /* ── THE INTENT IS THE FINAL PLACEMENT, NOT THE FIRST CALL ─────────────────
     This read the camera distance HERE, on the assumption that a framing declares
     its limits immediately after placing the camera. Forty-five callers, and not
     all of them do: the Observable → Solar seam calls advanceScaleLayer(), which
     declares limits, and only THEN writes the camera out to the cosmic web — so
     the goal was recorded at the distance the camera was about to leave, and the
     governor faithfully dragged it back there. The hand-off arrived at the wrong
     scale, which is exactly what a goal is supposed to prevent.

     So the capture is deferred by one governor pass. Whatever order a framing does
     its work in, by the time the next pass runs the placement is finished and the
     distance standing there is the one that was meant. An explicit hccCameraGoal
     call — a seam asking for a paced crossing — cancels the pending capture,
     because that caller has said what it wants in so many words. */
  _camGoalPending=true;
  baseMinDistance=Math.max(Number.isFinite(min)?min:1e-4,1e-12);
  _declaredMax=Math.max(Number.isFinite(max)?max:baseMinDistance*1e6,baseMinDistance*1.01);
  const p=hccCameraLimitFrameMeta({
    ...(meta&&typeof meta==='object'?meta:{}),
    requestedMin:min,requestedMax:max,declaredMax:_declaredMax,
    source:'declared-frame-limits'
  });
  hccCommitControlDistanceLimits(baseMinDistance,_declaredMax,p);
  applyZoomCeiling({...p,source:'content-aware-ceiling'});
}
`;
c=c.slice(0,blockStart)+newBlock+c.slice(blockEnd);

function replaceOnce(from,to,label){
  const n=c.split(from).length-1;
  if(n!==1) throw new Error(label+' expected once, found '+n);
  c=c.replace(from,to);
}

c=c.replaceAll(
  'controls.minDistance=keep.min; controls.maxDistance=keep.max;',
  "hccCommitControlDistanceLimits(keep.min,keep.max,{owner:'selftest-camera',reason:'restore isolated camera exercise',unit:'scene',source:'selftest-restore',record:false});"
);

replaceOnce(
  'camera.position.set(0,0,10); _lastCamDist=10; controls.minDistance=0.01; controls.maxDistance=1e6;',
  "camera.position.set(0,0,10); _lastCamDist=10; hccCommitControlDistanceLimits(0.01,1e6,{owner:'selftest-camera',reason:'isolated governor exercise',unit:'scene',source:'selftest',record:false});",
  'camera-goal selftest setup'
);

replaceOnce(
  'controls.minDistance=0.001; controls.maxDistance=1e7;',
  "hccCommitControlDistanceLimits(0.001,1e7,{owner:'selftest-camera',reason:'paced seam exercise',unit:'scene',source:'selftest',record:false});",
  'paced seam selftest setup'
);

const oldLab=`function labWalkFrame(){
  return {view:state.s3view, mode:state.mode,
    pos:camera.position.clone(), tgt:controls.target.clone(),
    min:controls.minDistance, max:controls.maxDistance, base:baseMinDistance};
}
function labWalkRestore(f){
  try{ setS3View(f.view); }catch(e){}
  camera.position.copy(f.pos); controls.target.copy(f.tgt);
  baseMinDistance=f.base; controls.minDistance=f.min; controls.maxDistance=f.max;
}`;
const newLab=`function labWalkFrame(){
  return {view:state.s3view, mode:state.mode,
    pos:camera.position.clone(), tgt:controls.target.clone(),
    min:controls.minDistance, max:controls.maxDistance, base:baseMinDistance};
}
function labWalkRestore(f){
  try{ setS3View(f.view); }catch(e){}
  camera.position.copy(f.pos); controls.target.copy(f.tgt);
  baseMinDistance=f.base;
  hccCommitControlDistanceLimits(f.min,f.max,{owner:'selftest-lab-walk',reason:'restore pre-walk camera frame',unit:hccCameraLimitUnit(),source:'selftest-restore',record:false});
}`;
replaceOnce(oldLab,newLab,'lab walk restore');

replaceOnce(
  'controls.minDistance=Math.max(baseMinDistance,navigationCollisionRadius());',
  `const collisionMin=Math.max(baseMinDistance,navigationCollisionRadius());
    if(controls.minDistance!==collisionMin)
      hccCommitControlDistanceLimits(collisionMin,controls.maxDistance,hccCameraLimitCurrentMeta({reason:'navigation collision floor',source:'collision-floor'}));`,
  'collision floor write'
);

replaceOnce(
  "target:controls.target.toArray(),fov:camera.fov,minDistance:controls.minDistance,maxDistance:controls.maxDistance,\n      autoRotate:controls.autoRotate,autoRotateSpeed:controls.autoRotateSpeed,idleDrift}",
  "target:controls.target.toArray(),fov:camera.fov,minDistance:controls.minDistance,maxDistance:controls.maxDistance,\n      limitAuthority:hccCameraLimitAuthority(),autoRotate:controls.autoRotate,autoRotateSpeed:controls.autoRotateSpeed,idleDrift}",
  'model portal capture authority'
);

replaceOnce(
  'controls.target.fromArray(snap.camera.target);controls.minDistance=snap.camera.minDistance;controls.maxDistance=snap.camera.maxDistance;',
  "controls.target.fromArray(snap.camera.target);hccCommitControlDistanceLimits(snap.camera.minDistance,snap.camera.maxDistance,{...(snap.camera.limitAuthority||{}),reason:'restore model-portal camera frame',source:'model-portal-restore'});",
  'model portal restore limits'
);

const minWrites=(c.match(/controls\.minDistance=/g)||[]).length;
const maxWrites=(c.match(/controls\.maxDistance=/g)||[]).length;
const legacy=(c.match(/legacy-unattributed/g)||[]).length;
const nearWrites=(c.match(/camera\.near=/g)||[]).length;
const farWrites=(c.match(/camera\.far=/g)||[]).length;
if(minWrites!==1||maxWrites!==1||legacy!==0||nearWrites!==1||farWrites!==1)
  throw new Error(JSON.stringify({minWrites,maxWrites,legacy,nearWrites,farWrites}));

writeFileSync(path,c);
console.log(JSON.stringify({minWrites,maxWrites,legacy,nearWrites,farWrites,bytes:c.length}));
