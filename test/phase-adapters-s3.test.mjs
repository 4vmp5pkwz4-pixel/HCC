import test from 'node:test';
import assert from 'node:assert/strict';
import { assertFiniteNativeState } from '../core/phase/index.mjs';
import { navierStokesS3PhaseAdapter } from '../core/phase-adapters/navier-stokes-s3.mjs';
import { nsfMake, nsfResidualCurl, nsfExactMeans, nsfUniform } from '../core/atlas/extracted.mjs';

test('S3 adapter uses the extracted authoritative kernels, not a reimplementation',()=>{
  const c=navierStokesS3PhaseAdapter();
  assert.equal(c.adapter.make,nsfMake);
  assert.equal(c.adapter.residualCurl,nsfResidualCurl);
  assert.equal(c.adapter.exactMeans,nsfExactMeans);
  let x=1; const rnd=()=>((x=x*16807%2147483647)/2147483647);
  const F=nsfMake(2,1,3,0.7,2.5,0.025), pts=nsfUniform(rnd,4);
  assert.deepEqual(c.adapter.residualCurl(F,0.3,pts),nsfResidualCurl(F,0.3,pts));
});

test('S3 native quaternion state is normalized and non-unit states are refused',()=>{
  const c=navierStokesS3PhaseAdapter();
  assert.deepEqual(assertFiniteNativeState(c,{q:[1,0,0,0]}),{q:[1,0,0,0]});
  const bad=assertFiniteNativeState(c,{q:[2,0,0,0]});
  assert.equal(bad.status,'REFUSED'); assert.equal(bad.code,'CONSTRAINT_VIOLATION');
});

test('viscous field energy is a balance/monotone quantity, never labelled conserved',()=>{
  const c=navierStokesS3PhaseAdapter();
  const e=c.invariants.find(i=>i.id==='field_energy');
  assert.equal(e.kind,'balance'); assert.equal(e.direction,'nonincreasing');
  const F=nsfMake(2,1,3,0.7,2.5,0.025);
  assert.ok(e.evaluator({field:F,t:1})<e.evaluator({field:F,t:0}));
});
