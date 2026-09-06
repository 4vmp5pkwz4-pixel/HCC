'use strict';
const { spawnSync } = require('node:child_process');

const run = spawnSync(process.execPath, ['test/unified-atlas-time.test.mjs'], {
  cwd: process.cwd(),
  encoding: 'utf8',
});

if (run.stdout) process.stdout.write(run.stdout);
if (run.stderr) process.stderr.write(run.stderr);
if (run.status !== 0) {
  console.error(`FAIL — AtlasTime kernel verifier exited ${run.status}`);
  process.exit(run.status || 1);
}
console.log('PASS — repository AtlasTime kernel verifier');
