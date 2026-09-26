import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhaseService, definePhaseBridge } from '../core/phase/index.mjs';
import { INITIAL_PHASE_SPACES } from '../core/phase-adapters/index.mjs';

test('phase service exposes exactly the five initial spaces',()=>{
  const p=createPhaseService();
  assert.deepEqual(INITIAL_PHASE_SPACES.map(x=>x.id).sort(),['act','heat','hol','nsflow','rel']);
  assert.equal(p.snapshot().counts.spaces,5);
  assert.equal(p.describe('rel').carrier.kind,'Minkowski-3+1');
});

test('unknown phase-space laboratory fails explicitly',()=>{
  const p=createPhaseService();
  assert.throws(()=>p.describe('missing'),e=>e.code==='NOT_FOUND'&&/missing/.test(e.message));
  assert.throws(()=>p.probe('missing','x',{}),e=>e.code==='NOT_FOUND');
});

test('candidate bridges remain noncanonical and hidden by default',()=>{
  const p=createPhaseService();
  const hidden=p.bridges();
  assert.deepEqual(hidden.candidates,[]);
  assert.equal(hidden.canonical.length,0);
  const visible=p.bridges({includeCandidates:true});
  assert.ok(visible.candidates.length>0);
  assert.ok(visible.candidates.every(x=>x.noncanonical===true&&x.review_required===true));
  assert.equal(p.bridges().canonical.length,0,'candidate discovery must not mutate the canonical registry');
});

test('compare without a canonical bridge refuses even when a candidate exists',()=>{
  const p=createPhaseService();
  const visible=p.bridges({includeCandidates:true});
  const c=visible.candidates[0];
  const r=p.compare(c.source,c.target,{});
  assert.equal(r.status,'REFUSED'); assert.equal(r.code,'NO_REGISTERED_BRIDGE'); assert.equal(r.detail.candidate_exists,true);
});

test('registered bridge is evaluated but never inferred from a candidate',()=>{
  const bridge=definePhaseBridge({id:'rel-self',source:'rel',target:'rel',status:'EXACT_MAP',map:s=>({...s}),invariant_maps:[{source:'minkowski_interval',target:'minkowski_interval',tolerance:1e-12}]});
  const p=createPhaseService({bridges:[bridge]});
  const r=p.compare('rel','rel',{sourceState:{t:2,x:.5,y:.2,z:.1}});
  assert.equal(r.reports[0].status,'EXACT_MAP'); assert.equal(r.reports[0].checks.invariants[0].pass,true);
});

test('static snapshot carries explicit freshness and can represent stale evidence truthfully',()=>{
  const identity={version:'4.328.0',build:'phase',core_version:'1.4.0',code_sha256:'abc'};
  const p=createPhaseService({identity});
  const fresh=p.snapshot(identity);
  assert.equal(fresh.generated_on_this_release,true); assert.equal(fresh.stale,false); assert.equal(fresh.code_sha256,'abc');
  const stale=p.snapshot({...identity,version:'4.329.0',build:'next'});
  assert.equal(stale.generated_on_this_release,false); assert.equal(stale.stale,true);
  assert.deepEqual(stale.generated_release,{version:'4.328.0',build:'phase'});
  assert.deepEqual(stale.current_release,{version:'4.329.0',build:'next'});
});

test('snapshot is JSON-safe and never serializes evaluator or adapter functions',()=>{
  const s=createPhaseService().snapshot();
  const text=JSON.stringify(s);
  assert.ok(text.includes('minkowski_interval'));
  assert.ok(!text.includes('function'));
  assert.equal(s.spaces.find(x=>x.id==='rel').adapter,undefined);
});
