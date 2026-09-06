#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=process.argv[2]||'index.html';
let s=fs.readFileSync(path,'utf8');
const MARK='// HCC v4.152 Persistent State Scope Registry';
function count(x){return s.split(x).length-1;}
function rep(a,b,label){const n=count(a);if(n!==1)throw new Error(`${label}: expected 1 anchor, found ${n}`);s=s.replace(a,b);}
if(s.includes(MARK)){console.log('Task 6 state scopes already materialized');process.exit(0);}
if(!s.includes('// HCC v4.152 Global Time Mutation Gateway'))throw new Error('Task 5 mutation gateway missing');

const gatewayEnd=`function setAtlasTime(patch,source='atlas.transaction'){
  atlasFrameTime=atlasTime.transact(patch,{source});return syncAtlasTimeCompat(atlasFrameTime);
}`;
rep(gatewayEnd,gatewayEnd+String.raw`

// HCC v4.152 Persistent State Scope Registry
const UNDECLARED_SCOPE='UNDECLARED_SCOPE';
const HCC_STATE_SCOPE_KINDS=Object.freeze(['GLOBAL_PHYSICS','SHARED_PHYSICS','LAB_LOCAL','VIEW_ONLY']);
const HCC_GLOBAL_PHYSICS_KEYS=new Set(['epochDays','daysPerSec','cycYrPerSec','paused','timeDir']);
const HCC_VIEW_ONLY_KEYS=new Set(['mode','s3view','solarScaleLayer','selectedKey','activePanelId','fractalType']);
const HCC_LAB_LOCAL_STORE=new Map();
const HCC_STATE_SCOPE_REGISTRY=Object.freeze({
  schema:'hcc.state-scopes/1',
  kinds:HCC_STATE_SCOPE_KINDS,
  globalPhysics:Object.freeze([...HCC_GLOBAL_PHYSICS_KEYS]),
  viewOnly:Object.freeze([...HCC_VIEW_ONLY_KEYS]),
  failClosed:true,
  undeclared:UNDECLARED_SCOPE
});
function hccStateScope(key,labId=null){
  key=String(key||'');
  if(HCC_GLOBAL_PHYSICS_KEYS.has(key))return STATE_SCOPE.GLOBAL_PHYSICS;
  if(HCC_VIEW_ONLY_KEYS.has(key))return STATE_SCOPE.VIEW_ONLY;
  try{
    if(typeof MV_LINKS!=='undefined'&&MV_LINKS.some(L=>(L.members||[]).some(m=>m&&m.k===key)))return STATE_SCOPE.SHARED_PHYSICS;
  }catch{}
  if(labId){
    const p=String(labId).toLowerCase();
    if(key.toLowerCase().startsWith(p))return STATE_SCOPE.LAB_LOCAL;
  }
  return UNDECLARED_SCOPE;
}
function persistLabLocalState(labId,keys){
  labId=String(labId||'');if(!labId)return Object.freeze({});
  const out={};
  for(const key of Array.isArray(keys)?keys:[]){
    if(hccStateScope(key,labId)===STATE_SCOPE.LAB_LOCAL && key in state){
      const v=state[key];if(v===null||['number','string','boolean'].includes(typeof v))out[key]=v;
    }
  }
  HCC_LAB_LOCAL_STORE.set(labId,Object.freeze({...out}));
  return HCC_LAB_LOCAL_STORE.get(labId);
}
function restoreLabLocalState(labId){
  const saved=HCC_LAB_LOCAL_STORE.get(String(labId||''));if(!saved)return 0;let n=0;
  for(const [key,v] of Object.entries(saved))if(hccStateScope(key,labId)===STATE_SCOPE.LAB_LOCAL){state[key]=v;n++;}
  return n;
}
`,'state scope registry');

rep(`state:{epochDays:state.epochDays,daysPerSec:state.daysPerSec,paused:state.paused,timeDir:state.timeDir,
      solarScaleLayer:state.solarScaleLayer,s3view:state.s3view,cycFrame:state.cycFrame,`,
    `state:{solarScaleLayer:state.solarScaleLayer,s3view:state.s3view,cycFrame:state.cycFrame,`,
    'Model Portal global physics snapshot');

rep(`const ANIM_EXTRA=['daysPerSec','cycYrPerSec','fbsCycleSpeed','oortSpeed','laniakeaFlowSpeed',`,
    `const ANIM_EXTRA=['fbsCycleSpeed','oortSpeed','laniakeaFlowSpeed',`,
    'Motion Reset global rates');
rep(`  return [...new Set([...auto,...ANIM_EXTRA.filter(k=>k in STATE0)])].sort();`,
    `  return [...new Set([...auto,...ANIM_EXTRA.filter(k=>k in STATE0)])].filter(k=>!HCC_GLOBAL_PHYSICS_KEYS.has(k)).sort();`,
    'Motion Reset scope filter');

fs.writeFileSync(path,s);
console.log('materialized v4.152 persistent state scopes and view-only portal return');
