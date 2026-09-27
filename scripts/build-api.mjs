#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPhaseSnapshot } from '../core/phase/runtime.mjs';
import { PHASE_MCP_TOOLS } from '../server/server.mjs';
import { attachPhaseDiscovery } from './phase-api-integration.mjs';

await import('./base-build-api.mjs');

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const phase=buildPhaseSnapshot();
writeFileSync(join(ROOT,'api/phase-space.json'),JSON.stringify(phase,null,2)+'\n');

const agent=JSON.parse(readFileSync(join(ROOT,'api/agent.json'),'utf8'));
const manifest=JSON.parse(readFileSync(join(ROOT,'api/manifest.json'),'utf8'));
const integrated=attachPhaseDiscovery({agent,manifest,phaseTools:PHASE_MCP_TOOLS});
writeFileSync(join(ROOT,'api/agent.json'),JSON.stringify(integrated.agent,null,2)+'\n');
writeFileSync(join(ROOT,'api/manifest.json'),JSON.stringify(integrated.manifest,null,2)+'\n');
console.log(`phase-space ${phase.counts.spaces} spaces · ${phase.counts.bridges} canonical bridges · ${phase.counts.candidates} noncanonical candidates`);
