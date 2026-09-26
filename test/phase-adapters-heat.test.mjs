import test from 'node:test';
import assert from 'node:assert/strict';
import { assertFiniteNativeState, probeInvariant } from '../core/phase/index.mjs';
import { heatPhaseAdapter } from '../core/phase-adapters/field-heat.mjs';
import { INITIAL_PHASE_SPACES } from '../core/phase-adapters/index.mjs';

test('Heat L2 diagnostic is a dissipative balance law, not conserved',()=>{
  const c=heatPhaseAdapter(), inv=c.invariants.find(i=>i.id==='field_l2');
  assert.equal(inv.kind,'balance'); assert.equal(inv.direction,'nonincreasing');
  const a={field:[0,1,2,1,0],alpha:.16,dt:.5}, b={field:[0,.8,1.4,.8,0],alpha:.16,dt:.5};
  const r=probeInvariant(c,'field_l2',{initialState:a,state:b});
  assert.equal(r.classification,'monotone'); assert.equal(r.satisfied,true); assert.ok(r.delta<0);
});

test('unstable explicit heat timestep is refused by the native domain contract',()=>{
  const c=heatPhaseAdapter();
  const ok=assertFiniteNativeState(c,{field:[0,1,0],alpha:.16,dt:1});
  assert.notEqual(ok.status,'REFUSED');
  const bad=assertFiniteNativeState(c,{field:[0,1,0],alpha:.16,dt:2});
  assert.equal(bad.status,'REFUSED'); assert.equal(bad.code,'OUT_OF_DOMAIN');
});

test('visual grid scaling is display-only and cannot alter native diagnostics',()=>{
  const c=heatPhaseAdapter(), inv=c.invariants.find(i=>i.id==='field_l2'), field=[0,1,2,1,0];
  const a=inv.evaluator({field,visual_scale:1}), b=inv.evaluator({field,visual_scale:1000});
  assert.equal(a,b);
  const v=c.coordinates.find(x=>x.id==='visual_scale'); assert.equal(v.scientific_eligible,false);
});

test('initial registry contains exactly the five approved heterogeneous phase adapters',()=>{
  assert.deepEqual(INITIAL_PHASE_SPACES.map(x=>x.id).sort(),['act','heat','hol','nsflow','rel']);
  assert.equal(new Set(INITIAL_PHASE_SPACES.map(x=>x.id)).size,5);
});
