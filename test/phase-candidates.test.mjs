import test from 'node:test';
import assert from 'node:assert/strict';
import { definePhaseSpace, defineInvariant, createPhaseRegistry, phaseFingerprint, discoverCandidateBridges } from '../core/phase/index.mjs';

function space(id,{dim='L',q='action',geometry='symplectic',time='physical',interval=[0,10]}={}){
  return definePhaseSpace({
    id, carrier:{kind:'vector-space',dimension:2},
    coordinates:[{id:'x',type:'number',role:'native',quantity_kind:'coordinate',unit:'1',dimension:'1'}],
    time:{kind:time,unit:'s'}, dynamics:{kind:'continuous'}, geometry:{kind:geometry},
    domain:{interval}, constraints:[], projections:[],
    invariants:[defineInvariant({id:'I',kind:'exact',quantity_kind:q,unit:null,dimension:dim})]
  });
}

test('phase fingerprint contains only declared structural facts',()=>{
  const f=phaseFingerprint(space('a'));
  assert.equal(f.id,'a'); assert.equal(f.state_dimension,2); assert.equal(f.time_kind,'physical');
  assert.deepEqual(f.invariant_kinds,['exact']); assert.deepEqual(f.geometry_kinds,['symplectic']);
  assert.equal(f.similarity_is_evidence,false); assert.ok(Object.isFrozen(f));
});

test('candidate discovery is deterministic and exposes every score term',()=>{
  const r=createPhaseRegistry({spaces:[space('b'),space('a'),space('c',{geometry:'contact'})]});
  const args={registry:r,nexusRelations:[{from:'a',to:'b',type:'representation'}],quantityRoutes:[{from:'a.I',to:'b.I'}]};
  const one=discoverCandidateBridges(args), two=discoverCandidateBridges(args);
  assert.equal(JSON.stringify(one),JSON.stringify(two));
  assert.ok(one.length>=1); assert.equal(one[0].noncanonical,true); assert.equal(one[0].review_required,true);
  assert.ok(Array.isArray(one[0].terms)); assert.equal(one[0].score,one[0].terms.reduce((s,t)=>s+t.value,0));
  assert.deepEqual([...one].map(x=>x.id),[...one].map(x=>x.id).sort((a,b)=>one.find(x=>x.id===a).rank-one.find(x=>x.id===b).rank || a.localeCompare(b)));
});

test('incompatible dimensions and disjoint domains are hard-filtered before ranking',()=>{
  const r1=createPhaseRegistry({spaces:[space('a',{dim:'L'}),space('b',{dim:'T'})]});
  assert.equal(discoverCandidateBridges({registry:r1}).length,0);
  const r2=createPhaseRegistry({spaces:[space('a',{interval:[0,1]}),space('b',{interval:[2,3]})]});
  assert.equal(discoverCandidateBridges({registry:r2}).length,0);
});

test('candidate discovery never mutates canonical registry',()=>{
  const r=createPhaseRegistry({spaces:[space('a'),space('b')],bridges:[{id:'canon',source:'a',target:'b',status:'EXACT_MAP'}]});
  const before=JSON.stringify(r.snapshot());
  const out=discoverCandidateBridges({registry:r});
  assert.ok(out.length); assert.equal(JSON.stringify(r.snapshot()),before); assert.equal(r.listBridges().length,1);
});
