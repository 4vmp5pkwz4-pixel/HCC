import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EVIDENCE_STATE,
  validateEvidenceIdentity,
  classifyEvidence,
  requireCurrentEvidence,
} from '../core/evidence/identity.mjs';

const CURRENT = Object.freeze({version:'4.269.0', build:'current-build'});
const currentLeaf = artifact => ({
  schema:'hcc.evidence/1', artifact, version:CURRENT.version, build:CURRENT.build,
  source_dependencies:[],
});
const datedLeaf = artifact => ({
  schema:'hcc.evidence/1', artifact, version:'4.191.0', build:'old-build',
  source_dependencies:[],
});

test('a coherent artifact measured on this Atlas release is CURRENT',()=>{
  const verdict=classifyEvidence(currentLeaf('sensitivity'),CURRENT);
  assert.equal(verdict.state,EVIDENCE_STATE.CURRENT);
  assert.deepEqual(verdict.reasons,[]);
});

test('a coherent historical artifact remains readable as DATED evidence',()=>{
  const verdict=classifyEvidence(datedLeaf('liveness'),CURRENT);
  assert.equal(verdict.state,EVIDENCE_STATE.DATED);
  assert.match(verdict.reasons.join(' '),/4\.191\.0/);
});

test('a current derived header over dated dependencies is INCONSISTENT',()=>{
  const reach={
    ...currentLeaf('reach'),
    source_dependencies:[datedLeaf('sensitivity'),datedLeaf('transfers')],
  };
  const verdict=classifyEvidence(reach,CURRENT);
  assert.equal(verdict.state,EVIDENCE_STATE.INCONSISTENT);
  assert.ok(verdict.reasons.some(r=>/sensitivity/.test(r)));
  assert.throws(()=>requireCurrentEvidence(reach,CURRENT),e=>
    e?.code==='INCONSISTENT_EVIDENCE' && e.detail?.artifact==='reach');
});

test('coherent dated evidence refuses current-only use with STALE_EVIDENCE',()=>{
  assert.throws(()=>requireCurrentEvidence(datedLeaf('transfers'),CURRENT),e=>
    e?.code==='STALE_EVIDENCE' && e.detail?.state===EVIDENCE_STATE.DATED);
});

test('malformed or incomplete evidence is refused rather than guessed',()=>{
  assert.throws(()=>validateEvidenceIdentity({artifact:'reach'}),/missing evidence schema/);
  assert.throws(()=>validateEvidenceIdentity({
    schema:'hcc.evidence/1', artifact:'reach', version:'4.269.0', build:'x',
    source_dependencies:[{schema:'hcc.evidence/1',artifact:'sensitivity',version:'4.269.0'}],
  }),/missing evidence build/);
});
