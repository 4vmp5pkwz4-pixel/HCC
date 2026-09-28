import test from 'node:test';
import assert from 'node:assert/strict';
import { definePhaseSpace, defineInvariant, defineProjection, definePhaseBridge, evaluatePhaseBridge } from '../core/phase/index.mjs';

function s(id,{time='physical',unit='s',invDim='L',invUnit='m',geometry='symplectic',display=false}={}){
  return definePhaseSpace({
    id, carrier:{kind:'vector-space',dimension:1},
    coordinates:[
      {id:'x',type:'number',role:'native',quantity_kind:'coordinate',unit:'m',dimension:'L'},
      ...(display?[{id:'pixel',type:'number',role:'display-only',quantity_kind:'display',unit:null,dimension:'1'}]:[])
    ],
    time:{kind:time,unit}, dynamics:{kind:'continuous'}, geometry:geometry?{kind:geometry}:'UNDECLARED',
    constraints:[], projections:display?[defineProjection({id:'screen',kind:'display-only',coordinates:['pixel']})]:[],
    invariants:[defineInvariant({id:'I',kind:'exact',quantity_kind:'length',dimension:invDim,unit:invUnit,evaluator:q=>q.x,coordinates:['x']})]
  });
}

const exactBridge=(extra={})=>definePhaseBridge({
  id:'a-b',source:'a',target:'b',status:'EXACT_MAP',
  map:q=>({x:q.x}), invariant_maps:[{source:'I',target:'I',tolerance:1e-12}], ...extra
});

test('exact bridge verifies invariant pullback',()=>{
  const r=evaluatePhaseBridge(exactBridge(),s('a'),s('b'),{sourceState:{x:3}});
  assert.equal(r.status,'EXACT_MAP'); assert.equal(r.checks.invariants[0].pass,true); assert.equal(r.checks.invariants[0].residual,0);
});

test('deliberately incorrect pullback is refused',()=>{
  const b=exactBridge({map:q=>({x:q.x+1})});
  const r=evaluatePhaseBridge(b,s('a'),s('b'),{sourceState:{x:3}});
  assert.equal(r.status,'REFUSED'); assert.equal(r.code,'INVARIANT_PULLBACK_FAILED');
});

test('incompatible units or physical dimensions refuse before numeric comparison',()=>{
  const dim=evaluatePhaseBridge(exactBridge(),s('a',{invDim:'L'}),s('b',{invDim:'T',invUnit:'s'}),{sourceState:{x:3}});
  assert.equal(dim.code,'INCOMPATIBLE_DIMENSION');
  const unit=evaluatePhaseBridge(exactBridge(),s('a',{invUnit:'m'}),s('b',{invUnit:'cm'}),{sourceState:{x:3}});
  assert.equal(unit.code,'INCOMPATIBLE_UNIT');
});

test('numerically equal but semantically different time parameters are refused',()=>{
  const r=evaluatePhaseBridge(exactBridge(),s('a',{time:'proper'}),s('b',{time:'physical'}),{sourceState:{x:1},sourceTime:1,targetTime:1});
  assert.equal(r.status,'REFUSED'); assert.equal(r.code,'TIME_SEMANTICS_MISMATCH');
});

test('explicit time reparameterization makes different time semantics well-posed',()=>{
  const b=exactBridge({time_map:t=>2*t});
  const r=evaluatePhaseBridge(b,s('a',{time:'proper'}),s('b',{time:'physical'}),{sourceState:{x:1},sourceTime:2,targetTime:4});
  assert.equal(r.status,'EXACT_MAP'); assert.equal(r.checks.time.pass,true); assert.equal(r.checks.time.mapped,4);
});

test('declared geometry preservation refuses when a side lacks geometry',()=>{
  const b=exactBridge({preserve_geometry:'symplectic',structure_verifier:()=>true});
  const r=evaluatePhaseBridge(b,s('a'),s('b',{geometry:null}),{sourceState:{x:1}});
  assert.equal(r.code,'MISSING_GEOMETRY');
});

test('display-only projection cannot serve as native scientific bridge',()=>{
  const b=definePhaseBridge({id:'display',source:'a',target:'b',status:'STRUCTURAL_ANALOGY',map_kind:'projection',projection_id:'screen',map:q=>({x:q.pixel})});
  const r=evaluatePhaseBridge(b,s('a',{display:true}),s('b'),{sourceState:{x:1,pixel:1}});
  assert.equal(r.status,'REFUSED'); assert.equal(r.code,'DISPLAY_ONLY_BRIDGE');
});
