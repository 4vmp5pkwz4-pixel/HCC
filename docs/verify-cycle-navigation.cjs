#!/usr/bin/env node
'use strict';
const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const src=fs.readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');
const start=src.indexOf('const HCC_CYCLE_VIEWS=');
assert(start>=0,'shared Solar/Cycles navigation is missing');
const end=src.indexOf('function observeCycle(key)',start);
assert(end>start);
const state={mode:'solar',epochDays:-123456.75,daysPerSec:0.001,cycYrPerSec:0.001/365.2425,paused:true,timeDir:-1};
let destination;
const c=vm.createContext({state,TT:(a)=>a,hccGo:target=>{destination=target;state.mode=target.worldId;},applyCycFrameView(){},buildCtl(){}});
vm.runInContext(src.slice(start,end),c);
for(const frame of ['hierarchy','helio','geo','gal','phase','resonance','orientation','antikythera','linked','chronometry']){
  const before={...state};
  vm.runInContext(`hccCycleNavigate('${frame}')`,c);
  assert.equal(state.mode,'cyc'); assert.equal(state.cycFrame,frame);
  assert.equal(destination.labId,frame==='chronometry'?'chronometry':undefined);
  assert.equal(state.epochDays,before.epochDays); assert.equal(state.paused,true); assert.equal(state.timeDir,-1);
  assert(Math.abs(state.cycYrPerSec*365.2425-before.daysPerSec)<1e-12,'rate must survive days→years conversion without slider clamping');
  vm.runInContext("hccCycleNavigate('solar')",c);
  assert.equal(state.mode,'solar'); assert(Math.abs(state.daysPerSec-before.daysPerSec)<1e-12);
}
const before=JSON.stringify(state);
assert.equal(vm.runInContext("hccCycleNavigate('unknown')",c),false);
assert.equal(JSON.stringify(state),before,'invalid destination must not mutate state');
assert.match(src,/hccCycleNavigationHTML\(\)/);
assert.match(src,/data-cycle-view/);
console.log('PASS — ten cycle views preserve epoch, pause, direction and physical time rate on round trip');
