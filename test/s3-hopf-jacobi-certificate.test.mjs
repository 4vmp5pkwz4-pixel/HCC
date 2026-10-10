import test from 'node:test';
import assert from 'node:assert/strict';
import {hopfJacobiSpectrum,hopfJacobiCertificate,spectralDeficit,viscousEigenmodeRates}
 from '../core/math/s3-hopf-jacobi-certificate.mjs';
test('integer resonance iff positive chirality and m=2n, 2184 cases',()=>{
 for(let m=0;m<=41;m++)for(let n=0;n<=25;n++)for(const chirality of [1,-1]){
  const o=hopfJacobiSpectrum({degree:m,jacobiIndex:n,chirality,radius:3});
  assert.equal(o.exactResonance,chirality===1&&m===2*n);
  assert.equal(o.detuning,Math.abs(m+2-chirality*2*(n+1))/3);
  assert.equal(o.nearestPositiveBranchDetuning,(m%2)/3);
 }
});
test('two-mode spectral variance equals pairwise form; odd-degree lower bound',()=>{
 for(let m=0;m<15;m++)for(let n=0;n<14;n++){
  const A=1.1+m/10,B=.4+n/15,R=2.25;
  const o=hopfJacobiCertificate({degree:m,jacobiIndex:n,radius:R,hopfNorm:A,jacobiNorm:B});
  const want=A*B/(A+B)*(m-2*n)**2/(R*R);
  assert.ok(Math.abs(o.spectralDeficit-want)<1e-10);
  assert.ok(Math.abs(o.spectralDeficit-o.pairwiseDeficit)<1e-10);
  if(m%2)assert.ok(o.spectralDeficit+1e-12>=o.oddPositiveObstruction);
  if(m===2*n)assert.equal(o.exactCompatibility,true);
 }
});
test('N-mode variance, zero weights and positive semidefiniteness',()=>{
 for(let count=2;count<20;count++){
  const modes=Array.from({length:count},(_,i)=>({Rlambda:2+i%5*2,weight:(i+2)/(count+2)}));
  const s=spectralDeficit(modes,{radius:3});
  assert.ok(Math.abs(s.spectralDeficit-s.pairwiseDeficit)<1e-10);
  assert.ok(s.spectralDeficit>=0);
 }
 const s=spectralDeficit([{Rlambda:7,weight:0},{Rlambda:3,weight:2}]);
 assert.equal(s.spectrallyPure,true);assert.equal(s.spectralDeficit,0);
});
test('FS speed is infinitesimal projective overlap, not fluid evolution',()=>{
 for(const modes of [
  [{Rlambda:2,weight:1},{Rlambda:6,weight:3}],
  [{Rlambda:-8,weight:1.7},{Rlambda:4,weight:.4},{Rlambda:6,weight:3}]
 ]){
  const R=2,dt=1e-4,W=modes.reduce((s,m)=>s+m.weight,0);
  const re=modes.reduce((s,m)=>s+m.weight*Math.cos(dt*m.Rlambda/R),0)/W;
  const im=modes.reduce((s,m)=>s+m.weight*Math.sin(dt*m.Rlambda/R),0)/W;
  const o=spectralDeficit(modes,{radius:R});
  assert.ok(Math.abs((1-re*re-im*im)/(dt*dt)-o.fubiniStudySpeedSquared)<1e-6);
  assert.equal(o.pureStateQuantumFisherInformation,4*o.fubiniStudySpeedSquared);
  assert.match(o.projectiveMetricScope,/AUXILIARY/);
 }
});
test('Hodge/EM differ by curvature term; EM Killing mode is stationary',()=>{
 const k=viscousEigenmodeRates({Rlambda:2,radius:4,viscosity:.25});
 assert.equal(k.hodgeRate,.0625);assert.equal(k.ebinMarsdenRate,0);
 const o=viscousEigenmodeRates({Rlambda:6,radius:2,viscosity:.5});
 assert.equal(o.hodgeRate-o.ebinMarsdenRate,.5);
 assert.match(o.transformationScope,/NOT/);
});
test('refuses invalid inputs and refuses physical or cross-catalog closure',()=>{
 assert.throws(()=>hopfJacobiSpectrum({degree:1.5,jacobiIndex:0}),RangeError);
 assert.throws(()=>hopfJacobiSpectrum({degree:2,jacobiIndex:1,radius:0}),RangeError);
 assert.throws(()=>spectralDeficit([{Rlambda:2,weight:0}]),RangeError);
 assert.throws(()=>spectralDeficit([{Rlambda:2.5,weight:1}]),RangeError);
 assert.equal(hopfJacobiSpectrum({degree:4,jacobiIndex:2,chirality:-1}).exactResonance,false);
 const r=hopfJacobiCertificate({degree:4,jacobiIndex:2});
 assert.equal(r.nonlinearPDEChecked,false);
 assert.match(r.forcedSector376Transfer,/REFUSED/);
 assert.match(r.nodalSector350Transfer,/REFUSED/);
});

test('Gram overlap is mandatory in same shell, forbidden across different shells',()=>{
 const o=hopfJacobiCertificate({degree:0,jacobiIndex:0,hopfNorm:4,jacobiNorm:1,overlap:1});
 assert.equal(o.energy,3.5);assert.equal(o.helicity,14);assert.equal(o.spectralDeficit,0);
 assert.throws(()=>hopfJacobiCertificate({degree:0,jacobiIndex:0,hopfNorm:4,jacobiNorm:1,overlap:3}),RangeError);
 assert.throws(()=>hopfJacobiCertificate({degree:0,jacobiIndex:0,hopfNorm:1,jacobiNorm:1,overlap:-1}),RangeError);
 assert.throws(()=>hopfJacobiCertificate({degree:1,jacobiIndex:0,overlap:.1}),RangeError);
});
test('native agent contract retains status and rejects nonlinear certification',async()=>{
 const {default:lab}=await import('../core/labs/s3.hopf_jacobi_certificate.mjs');
 const d=lab.describe();
 assert.equal(d.status,'REFERENCE_MODEL');
 assert.ok(d.inputs.some(x=>x.name==='overlap'));
 const v=lab.validate({});
 assert.equal(v.all_pass,true);
 const r=lab.run({degree:2,jacobi_index:1,hopf_norm:4,jacobi_norm:1,overlap:1});
 assert.equal(r.outputs.exact_resonance,true);
 assert.equal(r.outputs.nonlinear_pde_certified,false);
 assert.equal(r.outputs.spectral_deficit,0);
 assert.ok(r.warnings.some(x=>x.includes('REFUSED')));
});
