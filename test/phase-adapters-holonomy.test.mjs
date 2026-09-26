import test from 'node:test';
import assert from 'node:assert/strict';
import { probeInvariant } from '../core/phase/index.mjs';
import { holonomyPhaseAdapter } from '../core/phase-adapters/holonomy.mjs';
import { holTransportPure, holBerryWilson, holWrap, holQAxis, holQMul, holQInv, holQNorm } from '../core/atlas/extracted.mjs';

const close=(a,b,tol=1e-5)=>assert.ok(Math.abs(holWrap(a-b))<tol,`${a} !~= ${b}`);

test('S2 Levi-Civita closed-latitude return is the native transport kernel',()=>{
  const c=holonomyPhaseAdapter();
  assert.equal(c.adapter.transport,holTransportPure);
  const theta=Math.PI/6, r=c.adapter.transport(theta,8192);
  close(r.angle,2*Math.PI*(1-Math.cos(theta)),2e-6);
});

test('Berry/Pancharatnam Wilson phase is gauge invariant and equals -Omega/2',()=>{
  const c=holonomyPhaseAdapter();
  assert.equal(c.adapter.berryWilson,holBerryWilson);
  const theta=Math.PI/3, a=c.adapter.berryWilson(theta,0,4097), b=c.adapter.berryWilson(theta,.77,4097);
  close(a.phase,b.phase,1e-10);
  close(a.phase,-Math.PI*(1-Math.cos(theta)),5e-7);
});

test('SU2 products stay unit and conjugation preserves scalar trace part',()=>{
  const c=holonomyPhaseAdapter();
  assert.equal(c.adapter.qMul,holQMul);
  const q=holQMul(holQAxis('x',.7),holQAxis('y',.5));
  assert.ok(Math.abs(holQNorm(q)-1)<1e-14);
  const g=holQAxis('z',.41), conj=holQMul(holQMul(g,q),holQInv(g));
  assert.ok(Math.abs(conj.w-q.w)<1e-14);
  assert.ok(Math.abs(holQNorm(conj)-1)<1e-14);
});

test('return/path transport contract refuses differential vector-field diagnostics',()=>{
  const c=holonomyPhaseAdapter();
  const r=probeInvariant(c,'su2_norm',{state:{q:{w:1,x:0,y:0,z:0}},vectorField:{q:0}});
  assert.equal(r.status,'REFUSED');
  assert.equal(r.code,'DYNAMICS_KIND_MISMATCH');
});
