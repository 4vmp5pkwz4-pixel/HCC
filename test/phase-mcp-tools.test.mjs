import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhaseTools } from '../server/phase-tools.mjs';

const calls=[];
const phase={
  describe:id=>({id}),
  probe:(lab,inv,input)=>({lab,inv,input}),
  compare:(a,b,input)=>({a,b,input,status:'REFUSED',code:'NO_REGISTERED_BRIDGE'}),
  bridges:opts=>{calls.push(opts);return {filter:opts,canonical:[],candidates:[]};}
};
const tools=createPhaseTools(phase);
const byName=new Map(tools.map(t=>[t.name,t]));

test('exports exactly the four additive IPSE tools',()=>{
  assert.deepEqual([...byName.keys()],['describe_phase_space','probe_invariant','compare_phase_spaces','list_phase_bridges']);
});

test('tool calls preserve phase service results including REFUSED',()=>{
  assert.deepEqual(byName.get('describe_phase_space').call({lab_id:'rel'}),{id:'rel'});
  assert.deepEqual(byName.get('probe_invariant').call({lab_id:'rel',invariant_id:'minkowski_interval',input:{state:{t:1,x:0,y:0,z:0}}}),
    {lab:'rel',inv:'minkowski_interval',input:{state:{t:1,x:0,y:0,z:0}}});
  const r=byName.get('compare_phase_spaces').call({lab_a:'rel',lab_b:'heat'});
  assert.equal(r.status,'REFUSED'); assert.equal(r.code,'NO_REGISTERED_BRIDGE');
});

test('list_phase_bridges defaults candidates off and maps public argument names',()=>{
  byName.get('list_phase_bridges').call({lab_a:'rel'});
  assert.deepEqual(calls.at(-1),{labA:'rel',labB:null,status:null,includeCandidates:false});
  byName.get('list_phase_bridges').call({lab_a:'rel',lab_b:'heat',status:'CANDIDATE_BRIDGE',include_candidates:true});
  assert.deepEqual(calls.at(-1),{labA:'rel',labB:'heat',status:'CANDIDATE_BRIDGE',includeCandidates:true});
});
