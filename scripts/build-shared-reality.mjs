#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSharedReality } from '../core/reality/shared-reality.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => JSON.parse(readFileSync(join(ROOT, path), 'utf8'));

const reality = buildSharedReality({
  identity: read('version.json'),
  agent: read('api/agent.json'),
  invariants: read('api/invariants.json'),
  openProblems: read('api/open-problems.json'),
  kevalin: read('kevalin/manifest.json'),
});

const target = join(ROOT, 'api', 'reality.json');
writeFileSync(target, JSON.stringify(reality, null, 2) + '\n');
console.log(`wrote ${target} for ${reality.version} / ${reality.build}`);
