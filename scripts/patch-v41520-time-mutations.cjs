#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=process.argv[2]||'index.html';
let s=fs.readFileSync(path,'utf8');
const MARK='// HCC v4.152 Global Time Mutation Gateway';
function count(x){return s.split(x).length-1;}
function rep(a,b,label){const n=count(a);if(n!==1)throw new Error(`${label}: expected 1 anchor, found ${n}`);s=s.replace(a,b);}
if(s.includes(MARK)){console.log('Task 5 mutation gateway already materialized');process.exit(0);}
if(!s.includes("HCC_TIME_FABRIC_SCHEMA='hcc.time-fabric/1'"))throw new Error('Task 4 Time Fabric authority missing');

const oldBridge=`function hccCompatSignedRate(){
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
}`;
const newBridge=`// HCC v4.152 Global Time Mutation Gateway
function syncAtlasTimeCompat(snap){
  const mag=Math.abs(snap.rateDaysPerSecond);
  state.epochDays=epochDaysOf(snap);
  state.daysPerSec=mag;
  state.cycYrPerSec=mag/365.2425;
  state.paused=snap.paused;
  state.timeDir=snap.rateDaysPerSecond<0?-1:snap.rateDaysPerSecond>0?1:(state.timeDir||1);
  return snap;
}
function atlasTimeDirection(){return atlasTimeSnapshot().rateDaysPerSecond<0?-1:(state.timeDir||1);}
function signedAtlasRate(magnitude,dir=atlasTimeDirection()){
  magnitude=Math.abs(Number(magnitude));
  if(!Number.isFinite(magnitude))throw new RangeError('Atlas time rate magnitude must be finite');
  return magnitude*(dir<0?-1:1);
}
function setAtlasEpoch(epochDays,source='atlas.setEpoch'){
  atlasFrameTime=atlasTime.setEpoch(epochDays,{source});return syncAtlasTimeCompat(atlasFrameTime);
}
function setAtlasRate(rateDaysPerSecond,source='atlas.setRate'){
  atlasFrameTime=atlasTime.setRate(rateDaysPerSecond,{source});return syncAtlasTimeCompat(atlasFrameTime);
}
function setAtlasDaysPerSecond(daysPerSecond,source='atlas.setRate.days'){
  return setAtlasRate(signedAtlasRate(daysPerSecond),source);
}
function setAtlasYearsPerSecond(yearsPerSecond,source='atlas.setRate.years'){
  return setAtlasRate(signedAtlasRate(Number(yearsPerSecond)*365.2425),source);
}
function toggleAtlasTimeDirection(source='atlas.toggleDirection'){
  const snap=atlasTimeSnapshot(),mag=Math.abs(snap.rateDaysPerSecond);
  return setAtlasRate(mag*(atlasTimeDirection()<0?1:-1),source);
}
function setAtlasPaused(paused,source='atlas.setPaused'){
  atlasFrameTime=atlasTime.setPaused(paused,{source});return syncAtlasTimeCompat(atlasFrameTime);
}
function setAtlasTime(patch,source='atlas.transaction'){
  atlasFrameTime=atlasTime.transact(patch,{source});return syncAtlasTimeCompat(atlasFrameTime);
}`;
rep(oldBridge,newBridge,'replace migration bridge with mutation gateway');

rep("input.setCustomValidity('');state.epochDays=d;input.value=formatDeepDate(d);after?.();",
    "input.setCustomValidity('');setAtlasEpoch(d,'ui.deep-date');input.value=formatDeepDate(d);after?.();",'deep date');
rep("state.epochDays = state.cycSeasons.events[+b.dataset.sj].days; state.paused=true; buildCtl();",
    "setAtlasTime({epochDays:state.cycSeasons.events[+b.dataset.sj].days,paused:true},'cycles.season-jump'); buildCtl();",'season jump');
rep("state.epochDays = (ec.date.getTime()/86400000 + 2440587.5) - 2451545.0;\n  state.paused = true;",
    "setAtlasTime({epochDays:(ec.date.getTime()/86400000 + 2440587.5) - 2451545.0,paused:true},'cycles.eclipse-jump');",'published eclipse jump');

rep("case 'moon':   go('solar'); state.daysPerSec=1; state.paused=false;",
    "case 'moon':   go('solar'); setAtlasTime({rateDaysPerSecond:1,paused:false},'cycles.observe.moon');",'observe moon');
rep("case 'year':   go('solar'); state.daysPerSec=10; state.paused=false;",
    "case 'year':   go('solar'); setAtlasTime({rateDaysPerSecond:10,paused:false},'cycles.observe.year');",'observe year');
rep("case 'saros':  go('cyc'); state.cycPairA='moon';state.cycPairB='saros';state.cycFrame='phase';state.cycYrPerSec=2;state.paused=false;applyCycFrameView();break;",
    "case 'saros':  go('cyc'); state.cycPairA='moon';state.cycPairB='saros';state.cycFrame='phase';setAtlasTime({rateDaysPerSecond:2*365.2425,paused:false},'cycles.observe.saros');applyCycFrameView();break;",'observe saros');
rep("case 'metonic':go('cyc'); state.cycPairA='moon';state.cycPairB='year';state.cycFrame='phase';state.cycYrPerSec=2;state.paused=false;applyCycFrameView();break;",
    "case 'metonic':go('cyc'); state.cycPairA='moon';state.cycPairB='year';state.cycFrame='phase';setAtlasTime({rateDaysPerSecond:2*365.2425,paused:false},'cycles.observe.metonic');applyCycFrameView();break;",'observe metonic');
rep("case 'prec':   go('cyc'); state.cycPairA='year';state.cycPairB='prec';state.cycFrame='geo';state.cycYrPerSec=800;state.paused=false;",
    "case 'prec':   go('cyc'); state.cycPairA='year';state.cycPairB='prec';state.cycFrame='geo';setAtlasTime({rateDaysPerSecond:800*365.2425,paused:false},'cycles.observe.precession');",'observe precession');
rep("case 'gal':    go('cyc'); state.cycPairA='year';state.cycPairB='gal';state.cycFrame='gal';state.cycYrPerSec=2e6;state.paused=false;",
    "case 'gal':    go('cyc'); state.cycPairA='year';state.cycPairB='gal';state.cycFrame='gal';setAtlasTime({rateDaysPerSecond:2e6*365.2425,paused:false},'cycles.observe.galactic');",'observe galactic');

rep("let rideSavedRate=null;                       // remembers time speed to restore on dismount",
    "let rideSavedRate=null;                       // signed Atlas days/s to restore on dismount",'XR ride comment');
rep("if(state.mode==='solar' && state.daysPerSec>3){ rideSavedRate={m:'solar',v:state.daysPerSec}; state.daysPerSec=1; }\n      else if(state.mode==='cyc' && state.cycYrPerSec>3){ rideSavedRate={m:'cyc',v:state.cycYrPerSec}; state.cycYrPerSec=1; }",
    "if(state.mode==='solar' && state.daysPerSec>3){ rideSavedRate=atlasTimeSnapshot().rateDaysPerSecond; setAtlasDaysPerSecond(1,'xr.ride.mount'); }\n      else if(state.mode==='cyc' && state.cycYrPerSec>3){ rideSavedRate=atlasTimeSnapshot().rateDaysPerSecond; setAtlasYearsPerSecond(1,'xr.ride.mount'); }",'XR ride slow');
rep("if(rideSavedRate){ if(rideSavedRate.m==='solar') state.daysPerSec=rideSavedRate.v;\n      else if(rideSavedRate.m==='cyc') state.cycYrPerSec=rideSavedRate.v; rideSavedRate=null; }",
    "if(rideSavedRate!==null){ setAtlasRate(rideSavedRate,'xr.ride.release'); rideSavedRate=null; }",'XR ride restore');

rep("{label:'⏸/▶', cb:()=>{state.paused=!state.paused;}},",
    "{label:'⏸/▶', cb:()=>{setAtlasPaused(!state.paused,'xr.menu.pause');}},",'XR pause');
rep("{label:'t −', cb:()=>{ if(m==='solar') state.daysPerSec/=4; else state.cycYrPerSec/=4; }},",
    "{label:'t −', cb:()=>{ if(m==='solar') setAtlasDaysPerSecond(state.daysPerSec/4,'xr.menu.slower'); else setAtlasYearsPerSecond(state.cycYrPerSec/4,'xr.menu.slower'); }},",'XR slower');
rep("{label:'t +', cb:()=>{ if(m==='solar') state.daysPerSec*=4; else state.cycYrPerSec*=4; }},",
    "{label:'t +', cb:()=>{ if(m==='solar') setAtlasDaysPerSecond(state.daysPerSec*4,'xr.menu.faster'); else setAtlasYearsPerSecond(state.cycYrPerSec*4,'xr.menu.faster'); }},",'XR faster');
rep("{label:'⌂ today', cb:()=>{state.epochDays=(Date.now()/86400000+2440587.5)-2451545.0;}},",
    "{label:'⌂ today', cb:()=>{setAtlasEpoch((Date.now()/86400000+2440587.5)-2451545.0,'xr.menu.today');}},",'XR today');

rep("ctl.querySelector('#spd').oninput = e=>{ state.daysPerSec = 10**(+e.target.value); updCtlVals(); };",
    "ctl.querySelector('#spd').oninput = e=>{ setAtlasDaysPerSecond(10**(+e.target.value),'solar.rate'); updCtlVals(); };",'Solar rate');
rep("ctl.querySelector('#pause').onclick = ()=>{ state.paused=!state.paused; buildCtl(); };",
    "ctl.querySelector('#pause').onclick = ()=>{ setAtlasPaused(!state.paused,'solar.pause'); buildCtl(); };",'Solar pause');
rep("ctl.querySelector('#timeDir')&&(ctl.querySelector('#timeDir').onclick=()=>{ state.timeDir=(state.timeDir||1)*-1; buildCtl(); });",
    "ctl.querySelector('#timeDir')&&(ctl.querySelector('#timeDir').onclick=()=>{ toggleAtlasTimeDirection('solar.direction'); buildCtl(); });",'Solar direction');
rep("ctl.querySelector('#today').onclick = ()=>{ state.epochDays = (Date.now()/86400000 + 2440587.5) - 2451545.0; };",
    "ctl.querySelector('#today').onclick = ()=>{ setAtlasEpoch((Date.now()/86400000 + 2440587.5) - 2451545.0,'solar.today'); };",'Solar today');
rep("state.epochDays=e.d-0.06; state.paused=false; state.daysPerSec=0.02; state.timeDir=1;",
    "setAtlasTime({epochDays:e.d-0.06,paused:false,rateDaysPerSecond:0.02},'solar.prediction.eclipse');",'eclipse prediction jump');
rep("state.epochDays=e.d; state.paused=true; state.timeDir=1;",
    "setAtlasTime({epochDays:e.d,paused:true,rateDaysPerSecond:Math.abs(atlasTimeSnapshot().rateDaysPerSecond)},'solar.prediction.sky');",'sky prediction jump');
rep("state.daysPerSec=Math.pow(10,8.5);state.paused=false;state.timeDir=1;buildCtl();",
    "setAtlasTime({rateDaysPerSecond:Math.pow(10,8.5),paused:false},'solar.galactic-max-rate');buildCtl();",'galactic max rate');

rep("ctl.querySelector('#cspd').oninput = e=>{ state.cycYrPerSec=10**(+e.target.value); updCtlVals(); };",
    "ctl.querySelector('#cspd').oninput = e=>{ setAtlasYearsPerSecond(10**(+e.target.value),'cycles.rate'); updCtlVals(); };",'Cycles rate');
rep("ctl.querySelector('#ctimeDir')&&(ctl.querySelector('#ctimeDir').onclick=()=>{ state.timeDir=(state.timeDir||1)*-1; buildCtl(); });",
    "ctl.querySelector('#ctimeDir')&&(ctl.querySelector('#ctimeDir').onclick=()=>{ toggleAtlasTimeDirection('cycles.direction'); buildCtl(); });",'Cycles direction');
rep("ctl.querySelector('#cpause').onclick = ()=>{ state.paused=!state.paused; buildCtl(); };",
    "ctl.querySelector('#cpause').onclick = ()=>{ setAtlasPaused(!state.paused,'cycles.pause'); buildCtl(); };",'Cycles pause');
rep("ctl.querySelector('#ctoday').onclick = ()=>{ state.epochDays=(Date.now()/86400000+2440587.5)-2451545.0; refreshSeasons(); buildCtl(); };",
    "ctl.querySelector('#ctoday').onclick = ()=>{ setAtlasEpoch((Date.now()/86400000+2440587.5)-2451545.0,'cycles.today'); refreshSeasons(); buildCtl(); };",'Cycles today');
rep("if(isFinite(d)){state.epochDays=d;state.paused=true;refreshSeasons();updCtlVals();}",
    "if(isFinite(d)){setAtlasTime({epochDays:d,paused:true},'cycles.phase-match');refreshSeasons();updCtlVals();}",'Cycles phase match');

rep("function zenRate(){ return state.mode==='cyc'?{get:()=>state.cycYrPerSec,set:v=>state.cycYrPerSec=v,min:-2,max:7,unit:'yr/s'}\n  :{get:()=>state.daysPerSec,set:v=>state.daysPerSec=v,min:-3,max:8.5,unit:'d/s'}; }",
    "function zenRate(){ return state.mode==='cyc'?{get:()=>state.cycYrPerSec,set:v=>setAtlasYearsPerSecond(v,'zen.rate'),min:-2,max:7,unit:'yr/s'}\n  :{get:()=>state.daysPerSec,set:v=>setAtlasDaysPerSecond(v,'zen.rate'),min:-3,max:8.5,unit:'d/s'}; }",'Zen rate');
rep("bar.querySelector('#zenPause').addEventListener('click',()=>{ state.paused=!state.paused;\n      bar.querySelector('#zenPause').textContent=state.paused?'▶':'⏸'; });",
    "bar.querySelector('#zenPause').addEventListener('click',()=>{ setAtlasPaused(!state.paused,'zen.pause');\n      bar.querySelector('#zenPause').textContent=state.paused?'▶':'⏸'; });",'Zen pause');
rep("state.timeDir=(state.timeDir||1)*-1;\n      bar.querySelector('#zenDir').textContent=state.timeDir<0?'⏪':'⏩';",
    "toggleAtlasTimeDirection('zen.direction');\n      bar.querySelector('#zenDir').textContent=state.timeDir<0?'⏪':'⏩';",'Zen direction');

rep("  adoptLegacyTimeControls();\n  atlasFrameTime=atlasTime.advanceFrame(dt,{source:'frame.root'});",
    "  atlasFrameTime=atlasTime.advanceFrame(dt,{source:'frame.root'});",'remove legacy adoption from root');

fs.writeFileSync(path,s);
console.log('materialized v4.152 global Time Fabric mutation gateway');
