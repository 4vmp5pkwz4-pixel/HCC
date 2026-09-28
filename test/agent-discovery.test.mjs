import test from 'node:test';
import assert from 'node:assert/strict';
import {cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));

test('agent discovery survives regeneration from the core', () => {
  const directory = mkdtempSync(join(tmpdir(), 'hcc-agent-discovery-'));
  try {
    for (const name of ['core', 'server', 'api']) cpSync(join(root, name), join(directory, name), {recursive:true});
    mkdirSync(join(directory, 'scripts'));
    cpSync(join(root, 'scripts/build-api.mjs'), join(directory, 'scripts/build-api.mjs'));
    for (const name of ['version.json', 'package.json']) cpSync(join(root, name), join(directory, name));

    execFileSync(process.execPath, [join(directory, 'scripts/build-api.mjs')], {cwd:directory});
    const generated = JSON.parse(readFileSync(join(directory, 'api/agent.json'), 'utf8'));
    const committed = JSON.parse(readFileSync(join(root, 'api/agent.json'), 'utf8'));
    assert.equal(generated.resources.live_bridge, './api/live-agent-bridge.mjs');
    assert.ok(generated.operations.some(({name}) => name === 'measure_s3'));
    assert.ok(generated.operations.some(({name}) => name === 'live_navigation'));
    assert.deepEqual(generated, committed);
  } finally {
    rmSync(directory, {recursive:true,force:true});
  }
});
