import test from 'node:test';
import assert from 'node:assert/strict';
import {lightIntensity,lightSampleGrid,lightReconstructGram,lightCoefficientNorm,lightFluidBridge,lightTopologicalNoGo}
 from '../core/math/s3-light-geometry-meta.mjs';
const near=(x,y,eps=2e-7)=>assert.ok(Math.abs(x-y)<eps, x+' differs from '+y);

test('phase-invariant intensity tomography: degrees 0..6, 126 independent coefficient sets',()=>{
 for(let m=0;m<=6;m++)for(let trial=0;trial<18;trial++){
  const c=Array.from({length:m+1},(_,k)=>[Math.sin(k*1.7+m*.3+trial*.18),Math.cos(k*.9+trial*.24+.2)]);
  const r=lightReconstructGram(lightSampleGrid(c));
  for(let k=0;k<=m;k++)for(let j=0;j<=m;j++){
   const re=c[k][0]*c[j][0]+c[k][1]*c[j][1],im=c[k][1]*c[j][0]-c[k][0]*c[j][1];
   near(r.gram[k][j][0],re);near(r.gram[k][j][1],im);
  }
  assert.ok(r.relativeRankOneResidual<1e-7);
 }
});
test('exact pressure/intensity cross-PDE correspondence and different viscosity rates',()=>{
 for(let m=0;m<=6;m++){
  const coefficients=Array.from({length:m+1},(_,i)=>[.2+i,.1*(-1)**i]);
  const a=lightFluidBridge({coefficients,x:.41,delta:1.3,radius:3,viscosity:.04,time:5});
  const b=lightFluidBridge({coefficients,x:.41,delta:1.3,radius:3,viscosity:.04,time:5,operator:'EbinMarsden'});
  near(a.opticalIntensity,lightIntensity(coefficients,.41,1.3),1e-12);
  near(-2*a.fluidPressureMinusOffset/(a.fluidAmplitude**2),a.opticalIntensity,1e-12);
  near(b.fluidAmplitude/a.fluidAmplitude,Math.exp(4*.04*5/9),1e-12);
  assert.equal(a.MaxwellSpacetimeDynamicsComputed,false);
 }
});
test('same exact spectrum and integrated intensity do not determine nodal divisor',()=>{
 for(let m=2;m<=6;m++){
  const v=lightTopologicalNoGo(m);
  assert.equal(v.identicalIntegratedIntensity,true);
  assert.notDeepEqual(v.firstDivisorMultiplicities,v.secondDivisorMultiplicities);
  near(lightCoefficientNorm(v.first),lightCoefficientNorm(v.second),1e-14);
 }
});
test('native scientific laboratory is conditional and excludes general PDE closure',async()=>{
 const {default:lab}=await import('../core/labs/s3.light_geometry_meta.mjs');
 assert.equal(lab.describe().status,'CONDITIONAL');
 assert.equal(lab.validate({}).all_pass,true);
 const result=lab.run({});
 assert.equal(result.outputs.nonlinear_pde_proved_here,false);
 assert.equal(result.outputs.topology_from_energy_alone,false);
 assert.ok(result.outputs.gram_rank_one_residual<1e-10);
 assert.ok(result.warnings.some(x=>x.includes('REFERENCE')));
});
test('domain refusals prevent false inference or malformed input',()=>{
 assert.throws(()=>lightIntensity([[1,0]],1.2,0),RangeError);
 assert.throws(()=>lightFluidBridge({coefficients:[[1,0]],operator:'undefined'}),RangeError);
 assert.throws(()=>lightTopologicalNoGo(1),RangeError);
});
