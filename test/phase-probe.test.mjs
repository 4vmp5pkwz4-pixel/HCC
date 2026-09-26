import test from 'node:test';
import assert from 'node:assert/strict';
import { definePhaseSpace, defineInvariant } from '../core/phase/contract.mjs';
import { createPhaseRegistry, probeInvariant } from '../core/phase/index.mjs';

function phase(invariants) {
  return definePhaseSpace({
    id: 'osc', carrier: {kind:'vector-space',dimension:2},
    coordinates: [
      {id:'x',type:'number',role:'native',quantity_kind:'position',unit:'m',dimension:'L'},
      {id:'v',type:'number',role:'native',quantity_kind:'velocity',unit:'m/s',dimension:'L/T'},
      {id:'screen',type:'number',role:'display-only',quantity_kind:'display',unit:null,dimension:'1'}
    ],
    time:{kind:'physical',unit:'s'}, dynamics:{kind:'continuous'}, invariants,
    constraints:[], projections:[]
  });
}

const energy = defineInvariant({
  id:'energy', kind:'exact', quantity_kind:'energy-like', unit:'1', dimension:'1',
  evaluator:s=>s.x*s.x+s.v*s.v, normalization:2, coordinates:['x','v']
});

test('registry stores spaces immutably and filters bridges', () => {
  const a=phase([energy]);
  const r=createPhaseRegistry({spaces:[a],bridges:[{id:'b',source:'osc',target:'other',status:'EXACT_MAP'}]});
  assert.equal(r.getSpace('osc').id,'osc');
  assert.equal(r.getBridge('b').id,'b');
  assert.equal(r.listBridges({status:'EXACT_MAP'}).length,1);
  const list=r.listSpaces(); list.pop();
  assert.equal(r.listSpaces().length,1);
});

test('exact invariant reports zero then deliberate drift with declared normalization', () => {
  const c=phase([energy]);
  const ok=probeInvariant(c,'energy',{initialState:{x:1,v:1},state:{x:1,v:1}});
  assert.equal(ok.status,'OK'); assert.equal(ok.raw_residual,0); assert.equal(ok.normalized_residual,0);
  const drift=probeInvariant(c,'energy',{initialState:{x:1,v:1},state:{x:2,v:1}});
  assert.equal(drift.raw_residual,3); assert.equal(drift.normalized_residual,1.5);
});

test('discrete-map invariant reports delta', () => {
  const inv=defineInvariant({id:'sum',kind:'return',quantity_kind:'sum',dimension:'1',evaluator:s=>s.x+s.v,coordinates:['x','v']});
  const d=probeInvariant(phase([inv]),'sum',{state:{x:1,v:2},nextState:{x:2,v:2}});
  assert.equal(d.delta,1); assert.equal(d.raw_residual,1);
});

test('differential invariant reports gradI dot F', () => {
  const inv=defineInvariant({id:'x2',kind:'exact',quantity_kind:'x2',dimension:'L^2',evaluator:s=>s.x*s.x,gradient:s=>({x:2*s.x,v:0}),coordinates:['x']});
  const d=probeInvariant(phase([inv]),'x2',{state:{x:3,v:4},vectorField:{x:4,v:-3}});
  assert.equal(d.derivative,24);
});

test('monotone decrease is classified as monotone not conserved', () => {
  const inv=defineInvariant({id:'norm',kind:'monotone',direction:'nonincreasing',quantity_kind:'norm',dimension:'1',evaluator:s=>s.x*s.x+s.v*s.v,coordinates:['x','v']});
  const d=probeInvariant(phase([inv]),'norm',{initialState:{x:2,v:0},state:{x:1,v:0}});
  assert.equal(d.classification,'monotone'); assert.equal(d.satisfied,true); assert.equal(d.delta,-3);
});

test('unknown invariant and display-only invariant requests are refused', () => {
  const display=defineInvariant({id:'pixel',kind:'candidate',quantity_kind:'display',dimension:'1',evaluator:s=>s.screen,coordinates:['screen']});
  const c=phase([energy,display]);
  assert.equal(probeInvariant(c,'missing',{state:{x:1,v:1}}).code,'UNKNOWN_INVARIANT');
  assert.equal(probeInvariant(c,'pixel',{state:{screen:2}}).code,'DISPLAY_ONLY_STATE');
});
