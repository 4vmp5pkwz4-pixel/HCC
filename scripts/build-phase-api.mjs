#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPhaseSnapshot } from '../core/phase/runtime.mjs';
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
mkdirSync(join(ROOT,'api'),{recursive:true});
writeFileSync(join(ROOT,'api/phase-space.json'),JSON.stringify(buildPhaseSnapshot(),null,2)+'\n');
