#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPhaseSnapshot } from '../core/phase/runtime.mjs';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const FILE=join(ROOT,'api','phase-space.json');
const generated=JSON.stringify(buildPhaseSnapshot(),null,2)+'\n';

if(!existsSync(FILE)){
  console.error('PHASE_ARTIFACT_BASE64_BEGIN');
  console.error(Buffer.from(generated,'utf8').toString('base64'));
  console.error('PHASE_ARTIFACT_BASE64_END');
  assert.fail('api/phase-space.json is missing; generate it from buildPhaseSnapshot()');
}
const actual=readFileSync(FILE,'utf8');
assert.equal(actual,generated,'api/phase-space.json drifted from the live phase runtime');
const parsed=JSON.parse(actual);
assert.equal(parsed.schema,'hcc.phase-space/1');
assert.equal(parsed.counts.spaces,5);
assert.deepEqual(parsed.spaces.map(x=>x.id).sort(),['act','heat','hol','nsflow','rel']);
assert.ok(parsed.candidates.every(x=>x.noncanonical===true&&x.review_required===true));
assert.equal(typeof parsed.generated_on_this_release,'boolean');
assert.equal(typeof parsed.stale,'boolean');
console.log(`PASS · phase-space static artifact is reproducible (${parsed.counts.spaces} spaces, ${parsed.counts.bridges} bridges, ${parsed.counts.candidates} candidates)`);
