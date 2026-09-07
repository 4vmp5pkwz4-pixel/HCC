#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

(async()=>{
  const root=path.join(__dirname,'..');
  const kernel=path.join(root,'core','cycles','multiphase-solver.mjs');
  assert(fs.existsSync(kernel),'multiphase solver kernel is missing');
  const mod=await import(pathToFileURL(kernel).href+'?t='+Date.now());
  for(const name of ['wrap01','circularPhaseDelta','evaluateMultiPhase','searchMultiPhase'])
    assert.equal(typeof mod[name],'function',name+' must be exported');

  assert.equal(mod.wrap01(-0.25),0.75);
  assert(Math.abs(mod.circularPhaseDelta(0.99,0.01)+0.02)<1e-12,'phase error must wrap across 1→0');

  const constraints=[
    {id:'A',periodDays:10,refDays:0,targetPhase:0.25,tolerance:1e-7,weight:1},
    {id:'B',periodDays:15,refDays:0,targetPhase:0.5,tolerance:1e-7,weight:1}
  ];
  const exact=mod.evaluateMultiPhase(22.5,constraints);
  assert.equal(exact.status,'MATCH');
  assert(exact.worstResidual<1e-12);
  assert.equal(exact.residuals.length,2);

  const near=mod.searchMultiPhase({epochDays:20,constraints,direction:'nearest',windowDays:40,samples:512,refineSteps:36});
  assert.equal(near.status,'MATCH');
  assert(Math.abs(near.epochDays-22.5)<1e-5,'nearest exact coincidence must be recovered');

  const prev=mod.searchMultiPhase({epochDays:22.5,constraints,direction:'previous',windowDays:40,samples:512,refineSteps:36});
  const next=mod.searchMultiPhase({epochDays:22.5,constraints,direction:'next',windowDays:40,samples:512,refineSteps:36});
  assert(Math.abs(prev.epochDays+7.5)<1e-5,'previous recurrence must be strict');
  assert(Math.abs(next.epochDays-52.5)<1e-5,'next recurrence must be strict');

  const limited=[{id:'JPL',periodDays:20,targetPhase:0,validRange:[-5,5]}];
  assert.equal(mod.evaluateMultiPhase(10,limited).status,'MODEL_LIMITED');
  const noWindow=mod.searchMultiPhase({epochDays:100,constraints:limited,direction:'nearest',windowDays:10});
  assert.equal(noWindow.status,'NO_VALID_WINDOW');

  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const marker of [
    'HCC_MULTIPHASE_SOLAR_CONTROL_SCHEMA',
    'hccMultiPhaseControlHTML',
    'hccBuildMultiPhaseConstraints',
    'hccRunMultiPhaseSearch',
    'hccApplyMultiPhaseEpoch',
    'data-mphase-action',
    'data-mphase-target-a',
    'data-mphase-target-b',
    'data-mphase-planet',
    'OPEN SOLAR · SAME STATE'
  ]) assert(html.includes(marker),'browser control missing: '+marker);

  assert.match(html,/setAtlasEpoch\([^\n]*multiphase/,'phase search must apply through AtlasTime gateway');
  assert.match(html,/planetEcl\(PLANETS\[/,'planetary constraints must use the existing Solar ephemeris kernel');
  console.log('PASS — multiphase solver, model limits and Cycles→Solar control plane are present');
})().catch(err=>{console.error(err.stack||err);process.exit(1);});
