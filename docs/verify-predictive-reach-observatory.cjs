#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

(async()=>{
  const ROOT=path.resolve(__dirname,'..');
  const modPath=path.join(ROOT,'core/prediction/reach-forecast.mjs');
  assert.ok(fs.existsSync(modPath),'predictive reach kernel is missing');
  const M=await import(pathToFileURL(modPath).href+'?v='+Date.now());
  for(const name of ['validateReachArtifact','controlSemantics','listReachControls','forecastReach'])
    assert.equal(typeof M[name],'function',name+' must be exported');

  const identity={version:'4.155.0',build:'predictive-reach-observatory-2026.09.06.1'};
  const reach={schema:'hcc.reach/1',...identity,chains:[
    {control:'physics.x',through:'a.y',reaches:'b.z',route:'a.y → b.z',exponent:2,laboratories:2,near_r2:1,far_r2:1,far_drift:0,power_law:true,why:'measured law'},
    {control:'physics.x',through:'a.y',reaches:'c.z',route:'a.y → c.z',exponent:-1,laboratories:2,near_r2:1,far_r2:1,far_drift:0,power_law:true,why:'inverse law'},
    {control:'physics.x',through:'a.y',reaches:'d.z',route:'a.y → d.z',exponent:3,laboratories:2,near_r2:.7,far_r2:1,far_drift:0,power_law:false,why:'near leg not a law'},
    {control:'physics.x',through:'a.y',reaches:'e.z',route:'a.y → e.z',exponent:4,laboratories:2,near_r2:1,far_r2:null,far_drift:null,power_law:null,why:'far leg unjudged'}
  ]};
  assert.equal(M.validateReachArtifact(reach,identity).ok,true,'valid coherent artifact must pass');
  assert.equal(M.validateReachArtifact({...reach,build:'wrong'},identity).ok,false,'build mismatch must fail closed');
  assert.equal(M.validateReachArtifact({...reach,schema:'other'},identity).ok,false,'schema mismatch must fail closed');

  const F=M.forecastReach(reach,'physics.x',.1,identity);
  assert.equal(F.status,'OK');
  assert.equal(F.results.length,4);
  const square=F.results.find(r=>r.reaches==='b.z');
  assert.ok(Math.abs(square.response_ratio-1.21)<1e-12,'10% input with exponent 2 must yield 1.21');
  assert.ok(Math.abs(square.interval_ratio.low-.81)<1e-12&&Math.abs(square.interval_ratio.high-1.21)<1e-12,'positive exponent endpoints');
  const inv=F.results.find(r=>r.reaches==='c.z');
  assert.ok(inv.interval_ratio.low<inv.interval_ratio.high,'negative exponent endpoints must be sorted');
  assert.ok(Math.abs(inv.response_ratio-(1/1.1))<1e-12,'negative exponent response');
  assert.equal(F.results.find(r=>r.reaches==='d.z').response_ratio,null,'rejected chain must emit no ratio');
  assert.equal(F.results.find(r=>r.reaches==='d.z').forecastability,'LOCAL_ONLY');
  assert.equal(F.results.find(r=>r.reaches==='e.z').response_ratio,null,'unjudged chain must emit no ratio');
  assert.equal(F.results.find(r=>r.reaches==='e.z').forecastability,'UNJUDGED');
  assert.throws(()=>M.forecastReach(reach,'physics.x',-1,identity),/delta/i,'non-positive lower intervention ratio must be refused');
  assert.equal(M.controlSemantics('ns.step').kind,'NUMERICAL_CONTROL','known integration step must not be physical prediction');
  assert.equal(M.controlSemantics('bht.M').kind,'PHYSICAL_OR_MODEL','untyped scientific/model control must not be overclaimed as physical');
  assert.deepEqual(M.listReachControls(reach),['physics.x']);

  const index=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  assert.ok(index.includes("HCC_PREDICTIVE_OBSERVATORY_SCHEMA='hcc.predictive-reach-observatory/1'"),'browser observatory schema missing');
  assert.ok(index.includes('id="predictivePanel"'),'managed predictive panel missing');
  assert.ok(index.includes('id="predictiveBtn"'),'More-menu predictive button missing');
  assert.ok(index.includes('HCC_PREDICTIVE_OBSERVATORY'),'read-only browser API missing');
  assert.ok(index.includes('data-predictive-reach-open'),'Prediction Workbench entry missing');
  const frag=fs.readFileSync(path.join(ROOT,'scripts/fragments/v41550-predictive-reach.jsfrag'),'utf8');
  for(const forbidden of ['setAtlasEpoch','state.epochDays','ATLAS_BUS.set','ATLAS_BUS.publish'])
    assert.ok(!frag.includes(forbidden),'observatory must be preview-only; forbidden mutation token: '+forbidden);

  console.log('PASS — predictive reach arithmetic, fail-closed law gate, numerical-control firewall and browser contract');
})().catch(e=>{console.error('FAIL —',e&&e.stack||e);process.exit(1);});
