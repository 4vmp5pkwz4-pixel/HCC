import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { phaseCodeHash, phaseIdentity, buildPhaseSnapshot, PHASE_SOURCE_FILES } from '../core/phase/runtime.mjs';

test('phase provenance combines base-core and phase code hashes',()=>{
  const p=phaseCodeHash(), id=phaseIdentity();
  assert.match(p,/^[0-9a-f]{64}$/); assert.match(id.code_sha256,/^[0-9a-f]{64}$/);
  assert.ok(id.base_core_code_sha256); assert.equal(id.phase_code_sha256,p);
  assert.ok(PHASE_SOURCE_FILES.includes('phase-adapters/relativity.mjs'));
});

test('runtime snapshot is fresh on current release and carries paired provenance',()=>{
  const s=buildPhaseSnapshot();
  assert.equal(s.generated_on_this_release,true); assert.equal(s.stale,false);
  assert.equal(s.counts.spaces,5); assert.match(s.phase_code_sha256,/^[0-9a-f]{64}$/); assert.ok(s.base_core_code_sha256);
  assert.ok(s.candidates.every(x=>x.noncanonical===true&&x.review_required===true));
});

test('build-phase-api writes exactly one reproducible JSON snapshot',async()=>{
  await import('../scripts/build-phase-api.mjs?test='+Date.now());
  const disk=JSON.parse(fs.readFileSync(new URL('../api/phase-space.json',import.meta.url),'utf8'));
  const live=buildPhaseSnapshot();
  assert.deepEqual(disk,live);
});
