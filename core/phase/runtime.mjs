import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256 } from '../contract.mjs';
import { CORE_VERSION } from '../version.mjs';
import { PROVENANCE as BASE_PROVENANCE } from '../base-index.mjs';
import { NEXUS_RELATIONS } from '../atlas/extracted.mjs';
import { createPhaseService } from './service.mjs';

const HERE=dirname(fileURLToPath(import.meta.url));
const CORE_DIR=join(HERE,'..');
const ROOT=join(CORE_DIR,'..');
export const PHASE_SOURCE_FILES=Object.freeze([
  'phase/contract.mjs','phase/refusals.mjs','phase/registry.mjs','phase/invariant-probe.mjs',
  'phase/fingerprint.mjs','phase/bridges.mjs','phase/candidates.mjs','phase/service.mjs','phase/index.mjs','phase/runtime.mjs',
  'phase-adapters/navier-stokes-s3.mjs','phase-adapters/holonomy.mjs','phase-adapters/contact-action.mjs',
  'phase-adapters/relativity.mjs','phase-adapters/field-heat.mjs','phase-adapters/index.mjs'
]);

export function phaseCodeHash(){
  const parts=PHASE_SOURCE_FILES.map(f=>readFileSync(join(CORE_DIR,f),'utf8'));
  return sha256(parts.join('\n'));
}
export function baseCoreCodeHash(){
  const baseImplementation=readFileSync(join(CORE_DIR,'base-index.mjs'),'utf8');
  return sha256(`${BASE_PROVENANCE.code_sha256}\n${baseImplementation}`);
}
export function combinedCoreCodeHash(){
  return sha256(`${baseCoreCodeHash()}\n${phaseCodeHash()}`);
}
function release(){try{const r=JSON.parse(readFileSync(join(ROOT,'version.json'),'utf8'));return {version:r.version||null,build:r.build||null};}catch{return {version:null,build:null};}}
function routes(){try{const m=JSON.parse(readFileSync(join(ROOT,'api/manifest.json'),'utf8'));return m.bus?.links||[];}catch{return [];}}

export function phaseIdentity(){
  const r=release(), phase=phaseCodeHash(), base=baseCoreCodeHash();
  return Object.freeze({...r,core_version:CORE_VERSION,base_core_code_sha256:base,phase_code_sha256:phase,code_sha256:combinedCoreCodeHash()});
}
export function createHccPhaseService(){
  const identity=phaseIdentity();
  return createPhaseService({nexusRelations:NEXUS_RELATIONS,quantityRoutes:routes(),identity});
}
export function buildPhaseSnapshot(currentIdentity=phaseIdentity()){
  return createHccPhaseService().snapshot(currentIdentity);
}
export const HCC_PHASE=createHccPhaseService();
