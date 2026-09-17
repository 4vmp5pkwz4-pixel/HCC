#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { CORE } from '../core/index.mjs';

const read = path => readFileSync(path, 'utf8');
const json = path => JSON.parse(read(path));
let pass = 0, fail = 0;
const ok = (name, condition, detail = '') => {
  if (condition) { pass++; console.log(`  PASS — ${name}${detail ? ` :: ${detail}` : ''}`); }
  else { fail++; console.log(`  FAIL — ${name}${detail ? ` :: ${detail}` : ''}`); }
};

const readme = read('README.md');
const manifest = json('api/manifest.json');
const release = json('version.json');
const liveness = json('api/liveness.json');
const coreSource = read('core/index.mjs');

/* 1. A HUMAN-FACING COUNT MAY NOT BECOME A SECOND AUTHORITY.
   README used to say 85 laboratories / 83 instruments long after the generated
   manifest had moved on. The prose may summarize the catalogue, but its numbers
   must agree with the catalogue that is measured by walking the atlas. */
{
  const m = readme.match(/the atlas — \*\*(\d+)\*\* laboratories across (\d+) worlds, \*\*(\d+)\*\* typed instruments/);
  const got = m ? m.slice(1).map(Number) : [];
  const want = [manifest.counts?.laboratories, manifest.counts?.worlds, manifest.counts?.instruments];
  ok('README catalogue counts agree with the generated manifest',
    m && got.every((n, i) => n === want[i]),
    `README ${got.length ? got.join('/') : 'missing'} · manifest ${want.join('/')}`);
}

/* 2. THE NEXUS DESCRIBES THE GRAPH IT ACTUALLY SERVES.
   The typed graph already has one machine authority: CORE.connections(). A prose
   count beside it is useful only while it is the same count. */
{
  const m = readme.match(/spanning all\s+(\d+) scientific laboratory views around it through (\d+) declared relations/);
  const graph = CORE.connections({ kind: 'typed' });
  const got = m ? m.slice(1).map(Number) : [];
  const want = [graph.counts?.laboratories_touched, graph.counts?.typed];
  ok('README Invariant Nexus counts agree with CORE.connections()',
    m && got.every((n, i) => n === want[i]),
    `README ${got.length ? got.join('/') : 'missing'} · core ${want.join('/')}`);
}

/* 3. A DATED MEASUREMENT MUST SAY THAT IT IS DATED.
   Liveness is intentionally expensive and therefore need not be regenerated on
   every release. CORE.measurements() already carries the right semantics: the
   artifact says when it was measured; the current atlas says whether that is THIS
   release. This verifier makes that distinction a release contract. */
{
  const measured = CORE.measurements({ kind: 'liveness' });
  const stamp = measured.artifacts?.liveness;
  const expectedFresh = liveness.version === release.version;
  ok('liveness freshness is machine-explicit and computed against the current atlas release',
    stamp && stamp.version === liveness.version
      && stamp.build === liveness.build
      && stamp.measured_on_this_release === expectedFresh
      && measured.atlas_release === release.version,
    `artifact ${liveness.version}/${liveness.build} · atlas ${release.version}/${release.build} · fresh=${expectedFresh}`);
}

/* 4. AN OPEN PROBLEM ABOUT DRIFT MAY NOT DRIFT ITSELF.
   The entry once embedded a literal old liveness version. The artifact has since
   moved, leaving the warning about stale data itself stale. Keep the problem
   statement structural; the exact measured release belongs to the artifact/stamp. */
{
  const key = "['atlas.liveness_is_measured_on_an_older_release'";
  const start = coreSource.indexOf(key);
  const end = start < 0 ? -1 : coreSource.indexOf('],', start);
  const block = start < 0 || end < 0 ? '' : coreSource.slice(start, end + 2);
  const embeddedVersions = [...block.matchAll(/\b\d+\.\d+\.\d+\b/g)].map(m => m[0]);
  ok('the liveness open-problem prose carries no hard-coded release number',
    block.length > 0 && embeddedVersions.length === 0,
    embeddedVersions.length ? `embedded releases: ${embeddedVersions.join(', ')}` : (block ? 'structural wording only' : 'entry missing'));
  ok('the liveness open-problem prose points readers to measured_on_this_release instead of a remembered date',
    block.includes('measured_on_this_release'),
    block ? 'freshness field named' : 'entry missing');
}

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
