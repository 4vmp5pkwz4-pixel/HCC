#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const path='index.html';
let c=readFileSync(path,'utf8');

function replaceOnce(label, from, to){
  const n=c.split(from).length-1;
  if(n!==1) throw new Error(label+': expected exactly one anchor, found '+n);
  c=c.replace(from,to);
}

replaceOnce('camera authority block', `let _cameraLimitSeq=0;
let _cameraLimitAuthority=Object.freeze({
  schema:'hcc.camera-limits/1',seq:0,owner:'boot',reason:'initial controls state',unit:'scene',
  world:'boot',view:'boot',min:null,declaredMax:null,effectiveMax:null
});
function hccCameraLimitAuthority(){ return {..._cameraLimitAuthority}; }
globalThis.HCC_CAMERA_LIMIT_AUTHORITY=hccCameraLimitAuthority;
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
  controls.minDistance=baseMinDistance;
  _declaredMax=Math.max(Number.isFinite(max)?max:baseMinDistance*1e6,baseMinDistance*1.01);
  controls.maxDistance=_declaredMax;
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
`, `let _cameraLimitSeq=0, _cameraLimitBlocked=0;
let _cameraCrossScaleLock=false;
let _cameraLimitAuthority=Object.freeze({
  schema:'hcc.camera-limits/2',seq:0,owner:'boot',reason:'initial controls state',unit:'scene',
  world:'boot',view:'boot',min:null,declaredMax:null,effectiveMax:null,
  accepted:true,blockedBy:null,blockedCount:0
});
function hccCameraLimitAuthority(){ return {..._cameraLimitAuthority}; }
globalThis.HCC_CAMERA_LIMIT_AUTHORITY=hccCameraLimitAuthority;
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
     because that caller has said what it wants in so many words.

     DURING A PACED CROSS-SCALE SEAM, AN ANONYMOUS CALL MAY NOT TAKE OWNERSHIP.
     The scale chain legitimately changes coordinate units while the crossing is in
     flight, so attributed Solar/Observable/S³ owners remain allowed. What is blocked
     is only a legacy call that cannot say what subsystem it represents. This turns
     the old last-caller-wins failure into an inspectable refusal without freezing
     ordinary laboratory framing or changing any seam threshold. */
  const m=(meta&&typeof meta==='object')?meta:{};
  const owner=String(m.owner||'legacy-unattributed');
  if(_cameraCrossScaleLock && owner==='legacy-unattributed'){
    _cameraLimitBlocked++;
    _cameraLimitAuthority=Object.freeze({
      schema:'hcc.camera-limits/2',
      seq:++_cameraLimitSeq,
      owner,
      reason:String(m.reason||'unspecified framing'),
      unit:String(m.unit||'scene'),
      world:zoomWorldKey(),
      view:state.mode==='s3'?(state.s3view||'sec'):state.mode==='cycles'?(state.cycFrame||'hierarchy'):(state.mode||'unknown'),
      min:controls.minDistance,
      declaredMax:_declaredMax,
      effectiveMax:controls.maxDistance,
      requestedMin:min,
      requestedMax:max,
      accepted:false,
      blockedBy:'active-cross-scale-goal',
      blockedCount:_cameraLimitBlocked
    });
    return false;
  }
  _camGoalPending=true;
  baseMinDistance=Math.max(Number.isFinite(min)?min:1e-4,1e-12);
  controls.minDistance=baseMinDistance;
  _declaredMax=Math.max(Number.isFinite(max)?max:baseMinDistance*1e6,baseMinDistance*1.01);
  controls.maxDistance=_declaredMax;
  applyZoomCeiling();
  _cameraLimitAuthority=Object.freeze({
    schema:'hcc.camera-limits/2',
    seq:++_cameraLimitSeq,
    owner,
    reason:String(m.reason||'unspecified framing'),
    unit:String(m.unit||'scene'),
    world:zoomWorldKey(),
    view:state.mode==='s3'?(state.s3view||'sec'):state.mode==='cycles'?(state.cycFrame||'hierarchy'):(state.mode||'unknown'),
    min:controls.minDistance,
    declaredMax:_declaredMax,
    effectiveMax:controls.maxDistance,
    requestedMin:min,
    requestedMax:max,
    accepted:true,
    blockedBy:null,
    blockedCount:_cameraLimitBlocked
  });
  return true;
}
`);

replaceOnce('cross-scale lock acquisition', `    }catch(e){}
  }
}
function hccCameraGoalClear(){ _camGoal=NaN; _camGoalStep=0; _camGoalPending=false; }`, `    }catch(e){}
  }
  _cameraCrossScaleLock=Number.isFinite(_camGoal)&&_camGoalStep>1&&frames===SCALE_SEAMS.crossFrames;
}
function hccCameraGoalClear(){ _camGoal=NaN; _camGoalStep=0; _camGoalPending=false; _cameraCrossScaleLock=false; }`);

replaceOnce('cross-scale lock release', `if(Number.isFinite(_camGoal)&&Math.abs(safe/_camGoal-1)<0.004) _camGoal=NaN;   /* arrived */`,
  `if(Number.isFinite(_camGoal)&&Math.abs(safe/_camGoal-1)<0.004){ _camGoal=NaN; _cameraCrossScaleLock=false; }   /* arrived */`);

writeFileSync(path,c);
console.log('camera authority v2 patch applied');
