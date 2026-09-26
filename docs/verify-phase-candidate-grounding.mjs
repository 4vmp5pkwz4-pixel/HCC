import assert from 'node:assert/strict';
import { definePhaseSpace, defineInvariant, createPhaseRegistry, discoverCandidateBridges } from '../core/phase/index.mjs';

const space=(id,{carrier,time,geometry,q})=>definePhaseSpace({
  id,
  carrier:{kind:carrier,dimension:2},
  coordinates:[{id:'x',type:'number',role:'native',quantity_kind:`${id}-coordinate`,unit:null,dimension:'1'}],
  time:{kind:time,unit:null},
  dynamics:{kind:'continuous'},
  geometry:{kind:geometry},
  domain:{assumptions:[`${id} test domain`]},
  constraints:[],projections:[],
  invariants:[defineInvariant({id:'I',kind:'exact',quantity_kind:q,unit:null,dimension:'1'})]
});

const registry=createPhaseRegistry({spaces:[
  space('nsflow',{carrier:'S3-vector-field',time:'physical-time',geometry:'riemannian',q:'fluid-energy'}),
  space('heat',{carrier:'finite-grid-field',time:'diffusion-step',geometry:'euclidean-grid',q:'heat-L2'})
]});

assert.equal(discoverCandidateBridges({registry}).length,0,
  'without a declared relation these deliberately dissimilar contracts must not become candidates');

const candidates=discoverCandidateBridges({registry,nexusRelations:[
  {a:'nsflow',b:'heat',type:'limit',label:'declared Atlas-style Nexus edge'}
]});
assert.equal(candidates.length,1,'the real Atlas a/b Nexus edge must motivate one reviewable candidate');
assert.equal(candidates[0].noncanonical,true);
assert.equal(candidates[0].review_required,true);
assert.equal(candidates[0].terms.find(t=>t.name==='existing_nexus_neighborhood')?.value,2,
  'the candidate score must expose the declared Nexus motivation explicitly');

console.log('PASS · phase candidate grounding reads real Nexus a/b edges and remains noncanonical');
