#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=process.argv[2]||'index.html';
let s=fs.readFileSync(path,'utf8');
const MARK='// HCC v4.152 Unified Atlas Time Fabric';
function count(x){return s.split(x).length-1;}
function replaceExact(before,after,label){
  const n=count(before);if(n!==1)throw new Error(`${label}: expected exactly one anchor, found ${n}`);
  s=s.replace(before,after);
}
if(s.includes(MARK)){
  const required=["from './core/time/atlas-time.mjs'","const atlasTime=createAtlasTime(",'atlasTime.advanceFrame('];
  for(const q of required)if(!s.includes(q))throw new Error(`existing Time Fabric missing ${q}`);
  console.log('HCC v4.152 Time Fabric authority already materialized');process.exit(0);
}
replaceExact("import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';",
`import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createAtlasTime, epochDaysOf } from './core/time/atlas-time.mjs';
import { TIME_DOMAIN_KIND, STATE_SCOPE, CLOCK_STATUS, TIME_DOMAINS, CLOCK_ADAPTERS, STATE_SCOPES, domainById, findClockAdapter, canPromoteToAtlasEpoch } from './core/time/registry.mjs';`,
'module imports');

const stateAnchor=`  orbDen:1, orbPt:0.045, orbGlow:0.72,   // hydrogen-orbital cloud: density × / point size / glow
};`;
replaceExact(stateAnchor,String.raw`  orbDen:1, orbPt:0.045, orbGlow:0.72,   // hydrogen-orbital cloud: density × / point size / glow
};

// HCC v4.152 Unified Atlas Time Fabric
const HCC_TIME_FABRIC_SCHEMA='hcc.time-fabric/1';
const atlasTime=createAtlasTime({
  epochDays:state.epochDays,
  rateDaysPerSecond:Math.abs(state.daysPerSec)*(state.timeDir<0?-1:1),
  paused:state.paused,
  source:'atlas.init'
});
let atlasFrameTime=atlasTime.snapshot();
function atlasTimeSnapshot(){return atlasFrameTime;}
function hccCompatSignedRate(){
  const mag=state.mode==='cyc'?Math.abs(state.cycYrPerSec)*365.2425:Math.abs(state.daysPerSec);
  return mag*(state.timeDir<0?-1:1);
}
function syncAtlasTimeCompat(snap){
  state.epochDays=epochDaysOf(snap);
  state.paused=snap.paused;
  state.timeDir=snap.rateDaysPerSecond<0?-1:1;
  if(state.mode==='cyc')state.cycYrPerSec=Math.abs(snap.rateDaysPerSecond)/365.2425;
  else state.daysPerSec=Math.abs(snap.rateDaysPerSecond);
  return snap;
}
/* Temporary migration bridge. Task 5 removes it after every legacy global time write has
   been redirected. It imports changes made by existing UI handlers BEFORE the one root
   advance, so the service is still the only frame authority while the migration is staged. */
function adoptLegacyTimeControls(){
  const cur=atlasTime.snapshot(),rate=hccCompatSignedRate();
  if(Math.abs(epochDaysOf(cur)-state.epochDays)>1e-12 || cur.rateDaysPerSecond!==rate || cur.paused!==!!state.paused){
    atlasFrameTime=atlasTime.transact({epochDays:state.epochDays,rateDaysPerSecond:rate,paused:!!state.paused},{source:'legacy.compat'});
  }
}
function setAtlasEpoch(epochDays,source='atlas.setEpoch'){
  atlasFrameTime=atlasTime.setEpoch(epochDays,{source});return syncAtlasTimeCompat(atlasFrameTime);
}
function setAtlasRate(rateDaysPerSecond,source='atlas.setRate'){
  atlasFrameTime=atlasTime.setRate(rateDaysPerSecond,{source});return syncAtlasTimeCompat(atlasFrameTime);
}
function setAtlasPaused(paused,source='atlas.setPaused'){
  atlasFrameTime=atlasTime.setPaused(paused,{source});return syncAtlasTimeCompat(atlasFrameTime);
}
function setAtlasTime(patch,source='atlas.transaction'){
  atlasFrameTime=atlasTime.transact(patch,{source});return syncAtlasTimeCompat(atlasFrameTime);
}
`,'state authority insertion');

replaceExact("  if(!state.paused) state.epochDays += state.cycYrPerSec*365.2425*dt*(state.timeDir||1);\n",'', 'Cycles private epoch advance');
replaceExact("    if(!state.paused) state.epochDays += state.daysPerSec*dt*(state.timeDir||1);\n",'', 'Solar private epoch advance');
replaceExact("  const dt = Math.min(Math.max((now-last)/1000, 0), .1); last = now;   // clamp ≥0 (no backward time)\n",
`  const dt = Math.min(Math.max((now-last)/1000, 0), .1); last = now;   // clamp ≥0 (render time)
  adoptLegacyTimeControls();
  atlasFrameTime=atlasTime.advanceFrame(dt,{source:'frame.root'});
  syncAtlasTimeCompat(atlasFrameTime);
`,'root frame authority');

fs.writeFileSync(path,s);
console.log('materialized v4.152 browser AtlasTime authority');
