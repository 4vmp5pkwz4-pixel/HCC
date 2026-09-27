import test from 'node:test';
import assert from 'node:assert/strict';
import { phaseLensModel, renderPhaseLensHtml } from '../visual/phase-lens.mjs';

const rel={id:'rel',title:'Special Relativity',carrier:{kind:'Minkowski-3+1',dimension:4},time:{kind:'spacetime-coordinate',frame_dependent:true},constraints:[],invariants:[{id:'minkowski_interval',kind:'exact',status:'exact Lorentz invariant'}],projections:[{id:'rel_display_2p1',kind:'display-only',scientific_eligible:false}],domain:{beta:{min:-1,max:1,open:true}},epistemic:{status:'derived'}};
const snap={schema:'hcc.phase-space/1',spaces:[rel],bridges:[],candidates:[{id:'candidate:rel->hol',source:'rel',target:'hol',status:'CANDIDATE_BRIDGE',noncanonical:true,review_required:true,score:2,passed:['existing Nexus neighborhood'],unproven:['explicit state-space map']}],generated_on_this_release:true,stale:false};

test('local model preserves native carrier, time, invariant and display-only projection labels',()=>{
  const m=phaseLensModel(snap,{labId:'rel'});
  assert.equal(m.lab.id,'rel');
  assert.equal(m.carrier,'Minkowski-3+1 · dim 4');
  assert.match(m.time,/spacetime-coordinate/);
  assert.equal(m.invariants[0].statusClass,'EXACT');
  assert.equal(m.projections[0].label,'PROJECTION ONLY');
});

test('candidates stay explicitly noncanonical and refused reports keep their reason',()=>{
  const m=phaseLensModel(snap,{labId:'rel',includeCandidates:true,report:{status:'REFUSED',code:'TIME_SEMANTICS_MISMATCH',message:'no explicit time map'}});
  assert.equal(m.bridges[0].statusClass,'CANDIDATE');
  assert.equal(m.bridges[0].canonical,false);
  assert.equal(m.refusal.code,'TIME_SEMANTICS_MISMATCH');
  assert.match(renderPhaseLensHtml(m),/REFUSED/);
  assert.match(renderPhaseLensHtml(m),/Candidate · review required/);
});

test('visual quality is presentation-only and not part of the scientific model',()=>{
  const a=phaseLensModel(snap,{labId:'rel',visualQuality:'low'});
  const b=phaseLensModel(snap,{labId:'rel',visualQuality:'ultra'});
  assert.deepEqual(a,b);
});
