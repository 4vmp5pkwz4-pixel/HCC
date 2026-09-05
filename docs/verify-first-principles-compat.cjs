#!/usr/bin/env node
'use strict';

const fs=require('fs');
const crypto=require('crypto');
const assert=require('assert');
const {execFileSync}=require('child_process');

const manifest=JSON.parse(fs.readFileSync('api/manifest.json','utf8'));
let baseManifest;
try{
  baseManifest=JSON.parse(execFileSync('git',['show','origin/main:api/manifest.json'],{encoding:'utf8'}));
}catch(err){
  throw new Error(`cannot read the current main manifest for compatibility comparison: ${err.message}`);
}
let pass=0;
function ok(label,cond,detail=''){ assert.ok(cond,`${label}${detail?` — ${detail}`:''}`); pass++; console.log(`PASS — ${label}${detail?` · ${detail}`:''}`); }

function instrumentFingerprint(m){
  const s=(m.instruments||[]).map(i=>[i.id,
    (i.inputs||[]).map(f=>[f.name,f.unit??null,f.type??null,f.default??null,f.min??null,f.max??null]),
    (i.outputs||[]).map(o=>[o.name,o.unit??null])]);
  s.sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
  return crypto.createHash('sha256').update(JSON.stringify(s)).digest('hex').slice(0,32);
}

const now=instrumentFingerprint(manifest);
const base=instrumentFingerprint(baseManifest);
ok('first-principles release preserves the current-main legacy instrument contract',
  now===base,
  `v4.151=${now} main=${base}`);

const nowIds=(manifest.instruments||[]).map(i=>i.id).sort();
const baseIds=(baseManifest.instruments||[]).map(i=>i.id).sort();
ok('no legacy instrument is added, removed or renamed by the explanatory layer',
  JSON.stringify(nowIds)===JSON.stringify(baseIds),`${nowIds.length} instruments`);

ok('manifest exposes the first-principles schema',manifest.first_principles&&manifest.first_principles.schema==='hcc.first-principles/1');
ok('every measured live laboratory has a first-principles contract',
  Array.isArray(manifest.labs)&&manifest.first_principles.labs_total===manifest.labs.length&&
  manifest.first_principles.labs_contracts===manifest.labs.length&&manifest.labs.every(l=>l.first_principles&&l.first_principles.schema==='hcc.first-principles/1'),
  `${manifest.first_principles?.labs_contracts||0}/${manifest.labs?.length||0}`);

const required=['native_space','native_dimension','state_dimension','display_dimension','projection','metric_or_form','coordinates','domain','source_status','parameters'];
ok('every laboratory contract has the complete dimensional surface',manifest.labs.every(l=>required.every(k=>Object.prototype.hasOwnProperty.call(l.first_principles,k))));
ok('unknown scientific metadata fails closed instead of being guessed',
  manifest.first_principles.fail_closed===true&&JSON.stringify(manifest.labs).includes('UNDECLARED'));

const fpParams=manifest.labs.flatMap(l=>l.first_principles.parameters||[]);
ok('first-principles parameter count agrees with summary',fpParams.length===manifest.first_principles.parameters_total,`${fpParams.length}`);
ok('every first-principles parameter descriptor is structurally complete',
  fpParams.every(p=>['id','label','symbol','role','quantity_kind','unit','dimensional_signature','domain','source_status'].every(k=>Object.prototype.hasOwnProperty.call(p,k))));

console.log(`\nFIRST-PRINCIPLES COMPATIBILITY GATE: ${pass} assertions passed`);
