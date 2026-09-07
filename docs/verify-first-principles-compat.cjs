#!/usr/bin/env node
'use strict';

const fs=require('fs');
const crypto=require('crypto');
const assert=require('assert');
const {execFileSync}=require('child_process');

const manifest=JSON.parse(fs.readFileSync('api/manifest.json','utf8'));
let baseManifest;
try{
  baseManifest=JSON.parse(execFileSync('git',['show','origin/main:api/manifest.json'],{
    encoding:'utf8',
    maxBuffer:64*1024*1024
  }));
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

/* ── A FINGERPRINT PINNED TO A MOVING REF IS PINNED TO NOTHING ─────────────
   This required the instrument contract to hash identically to the one in
   origin/main's api/manifest.json. Two things are wrong with that, and both
   showed up at once.

   The baseline can be WRONG. main's manifest was stale — its own CI said so,
   failing on "api/manifest.json is stale in instruments" — because three
   outputs that instruments were already computing and returning had been
   declared in the source without the manifest being regenerated. So this check
   was comparing today's contract against a known-broken record of yesterday's,
   and going red for the repair.

   And a contract change becomes INVISIBLE. When the expected value lives on
   another branch, changing the contract changes nothing in this diff: the check
   simply starts agreeing with the new main after the merge. The value is
   written down here instead, so altering the contract is a line a reviewer
   reads.

   What main is still a good second witness for is STRUCTURE — which instruments
   exist and what they accept — because those did not move. It is asked for
   exactly that below, and output ADDITIONS are permitted there for the reason
   above: declaring an output an instrument already returns is a repair, and a
   check that forbids the repair is a check defending the defect. Removal and
   renaming are not permitted, because those break a reader. */
const EXPECTED_INSTRUMENT_FINGERPRINT='22d567b9c00e09b3c71445b5844d7629';

const now=instrumentFingerprint(manifest);
const base=instrumentFingerprint(baseManifest);
ok('the legacy instrument contract is the one this repository declares it to be',
  now===EXPECTED_INSTRUMENT_FINGERPRINT,
  `current=${now} expected=${EXPECTED_INSTRUMENT_FINGERPRINT}`);

const nowIds=(manifest.instruments||[]).map(i=>i.id).sort();
const baseIds=(baseManifest.instruments||[]).map(i=>i.id).sort();
ok('no legacy instrument is added, removed or renamed by the explanatory layer',
  JSON.stringify(nowIds)===JSON.stringify(baseIds),`${nowIds.length} instruments`);

/* the second witness, against main: inputs frozen, outputs additive only */
{
  const byId=m=>Object.fromEntries((m.instruments||[]).map(i=>[i.id,i]));
  const A=byId(baseManifest), B=byId(manifest);
  const inputSig=i=>JSON.stringify((i.inputs||[]).map(f=>[f.name,f.unit??null,f.type??null,f.default??null,f.min??null,f.max??null]));
  const outNames=i=>new Set((i.outputs||[]).map(o=>o.name));
  const inputsMoved=[], outputsLost=[], outputsGained=[];
  for(const id of Object.keys(A)){
    if(!B[id]) continue;
    if(inputSig(A[id])!==inputSig(B[id])) inputsMoved.push(id);
    const a=outNames(A[id]), b=outNames(B[id]);
    for(const n of a) if(!b.has(n)) outputsLost.push(id+'.'+n);
    for(const n of b) if(!a.has(n)) outputsGained.push(id+'.'+n);
  }
  ok('and against main, not one instrument input declaration has moved',
    inputsMoved.length===0, inputsMoved.join(', ')||'none');
  ok('and no output that main published has been removed or renamed',
    outputsLost.length===0, outputsLost.join(', ')||'none');
  /* this line was written as ok(..., true, ...) — a PASS that reports a list and
     cannot fail, which is the one thing a check must never be. A newly declared
     output is only a repair if it arrives with the same surface every other
     output has: a name, a unit, and a sentence saying what it is. */
  const gainedDescriptors=outputsGained.map(k=>{
    const [id,...rest]=k.split('.'); const name=rest.join('.');
    return (B[id].outputs||[]).find(o=>o.name===name)||null;
  });
  ok('and every output this release adds carries the same declared surface as the ones beside it',
    gainedDescriptors.every(o=>o&&typeof o.name==='string'&&typeof o.unit==='string'&&typeof o.doc==='string'&&o.doc.length>3),
    outputsGained.length?outputsGained.join(', '):'none added');
}

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
