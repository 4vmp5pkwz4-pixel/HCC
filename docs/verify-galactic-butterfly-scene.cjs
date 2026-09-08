#!/usr/bin/env node
'use strict';
/* The seventh test of v4.172.0: the five scene branches, their vertex bounds,
 * buffer reuse across a playback step, and disposal. It needs a THREE
 * implementation, so it runs here rather than in the dependency-free fast
 * workflow -- in the Computational core job, whose install step already names it
 * ("the scene test dependency") and whose verifier loop walks docs/verify-*.cjs.
 *
 * IT DOES NOT SKIP WHEN THREE IS ABSENT. A verifier that passes because it could
 * not run is the exact failure this file exists to correct: the test was already
 * shipping unperformed. Missing dependency is a FAILURE with the install command
 * named, so the reason is on the log rather than in silence.
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');

const run = spawnSync(process.execPath, ['--test', 'test/galactic-butterfly-scene.test.mjs'],
  { cwd: ROOT, encoding: 'utf8' });
const out = (run.stdout || '') + (run.stderr || '');
process.stdout.write(out);

if (/ERR_MODULE_NOT_FOUND[\s\S]*'three'/.test(out)) {
  console.error('\nFAIL — the scene test could not run: three is not installed.');
  console.error('       It is a devDependency; run `npm ci` before this verifier.');
  console.error('       This is a failure and not a skip: the point of the file is that the test RUNS.');
  process.exit(1);
}
const m = out.match(/^# pass (\d+)$/m), f = out.match(/^# fail (\d+)$/m), s = out.match(/^# skipped (\d+)$/m);
if (run.status !== 0 || !m || Number(m[1]) < 1 || (f && Number(f[1]) > 0) || (s && Number(s[1]) > 0)) {
  console.error(`FAIL — galactic butterfly scene test exited ${run.status}`);
  process.exit(run.status || 1);
}
console.log(`PASS — the galactic butterfly scene test runs and passes :: ${m[1]} test(s), 0 failed, 0 skipped`);
