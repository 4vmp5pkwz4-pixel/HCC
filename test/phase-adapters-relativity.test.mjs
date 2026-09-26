import test from 'node:test';
import assert from 'node:assert/strict';
import { relativityPhaseAdapter } from '../core/phase-adapters/relativity.mjs';
import { relBoostPts, relGamma } from '../core/atlas/extracted.mjs';

test('Lorentz adapter delegates to the authoritative boost kernel and preserves interval',()=>{
  const c=relativityPhaseAdapter(); assert.equal(c.adapter.boostKernel,relBoostPts); assert.equal(c.adapter.gamma,relGamma);
  const pts=[[2,.7],[1.5,-.4],[0.2,.1]], beta=.73, out=c.adapter.boost(pts,beta);
  assert.ok(Array.isArray(out));
  for(let i=0;i<pts.length;i++){
    const a=pts[i][0]**2-pts[i][1]**2,b=out[i][0]**2-out[i][1]**2;
    assert.ok(Math.abs(a-b)<1e-12);
  }
});

test('beta at or beyond light speed is refused rather than clamped',()=>{
  const c=relativityPhaseAdapter();
  for(const beta of [-1,1,1.1,-2]){const r=c.adapter.boost([[1,0]],beta);assert.equal(r.status,'REFUSED');assert.equal(r.code,'OUT_OF_DOMAIN');}
});

test('time is a frame-dependent spacetime coordinate, not Atlas universal time',()=>{
  const c=relativityPhaseAdapter();
  assert.equal(c.time.kind,'spacetime-coordinate');
  assert.equal(c.time.global_time_map,null);
  assert.equal(c.dynamics.kind,'static-transformation-family');
});
