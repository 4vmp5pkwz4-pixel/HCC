import test from 'node:test';
import assert from 'node:assert/strict';
import lab from '../core/labs/s3.cap_observability.mjs';
import {
  fullHarmonicBandDimension, witnessFraction, capVolumeFraction,
  capFractionPowerBound, radialGram, sharpRadialCoefficient,
  leadingCapCoefficient, ladderScenario
} from '../core/math/s3-cap-observability.mjs';

const near=(x,y,rtol=1e-9)=>assert.ok(Math.abs(x-y)<=rtol*Math.max(1,Math.abs(y)),
  'Expected '+x+' to be close to '+y);

test('S3 scalar mode multiplicities',()=>{
  for(const [L,d] of [[0,1],[1,5],[2,14],[10,506]])
    assert.equal(fullHarmonicBandDimension(L),d);
});
test('radial Gram identity on full sphere and symmetry',()=>{
  for(let L=0;L<=8;L++){
    const I=radialGram(L,Math.PI),G=radialGram(L,.7);
    for(let a=0;a<=L;a++)for(let b=0;b<=L;b++){
      near(I[a][b],a===b?1:0,1e-11);
      near(G[a][b],G[b][a],1e-12);
    }
  }
});
test('degree zero equals cap volume',()=>{
  for(const chi of [.01,.05,.2,.7,1.4,3.0,Math.PI])
    near(witnessFraction(0,chi),capVolumeFraction(chi),5e-9);
});
test('global analytic witness bound and monotonic cap fraction',()=>{
  for(let L=0;L<=8;L++){
    let prev=0;
    for(const chi of [.02,.1,.3,.7,1.2,2.6,Math.PI]){
      const r=witnessFraction(L,chi);
      assert.ok(r>prev&&r<=1+1e-9);
      assert.ok(r<=capFractionPowerBound(L,chi)*(1+2e-8));
      prev=r;
    }
  }
});
test('sharp coefficient Jacobi ratio and L=0 coefficient',()=>{
  near(leadingCapCoefficient(0),2/(3*Math.PI),1e-12);
  near(sharpRadialCoefficient(1)/leadingCapCoefficient(1),1/6.25,1e-12);
});
test('contract reports status, units and refusal of noninteger L',()=>{
  assert.equal(lab.describe().status,'REFERENCE_MODEL');
  assert.throws(()=>lab.run({L:2.5,chi:.2}),e=>e.code==='DOMAIN_ERROR');
  assert.throws(()=>lab.run({L:3,chi:0}),e=>e.code==='DOMAIN_ERROR');
  const r=lab.run({L:2,chi:.5},{provenance:{commit:'test',code_sha256:'test'}});
  assert.equal(r.outputs.full_band_dimension,14);
  assert.equal(r.outputs.radial_gram.length,3);
  assert.equal(r.diagnostics.phi_origin,'not_derived');
});
test('self-test contract has no failed gates',()=>{
  const v=lab.validate({},{provenance:{commit:'test',code_sha256:'test'}});
  assert.equal(v.all_pass,true,JSON.stringify(v.checks));
});
test('the golden ratio is not selected by cap observability',()=>{
  const a=ladderScenario({L:3,level:5,referenceRadius:1,physicalAperture:1,base:2});
  const b=ladderScenario({L:3,level:5,referenceRadius:1,physicalAperture:1,base:(1+Math.sqrt(5))/2});
  assert.equal(a.baseOrigin,'not_derived');
  assert.equal(b.baseOrigin,'not_derived');
  assert.ok(a.witnessFraction>0&&b.witnessFraction>0);
});
