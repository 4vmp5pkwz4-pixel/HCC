'use strict';
const fs=require('fs');
const assert=require('assert/strict');

(async()=>{
  const K=await import('../core/labs/chronometry.source_locked.mjs');
  const sources=JSON.parse(fs.readFileSync('docs/data/ancient-chronometry-sources.json','utf8')).records;
  const astronomy=JSON.parse(fs.readFileSync('docs/data/ancient-astronomy-benchmarks.json','utf8')).records;
  const src=fs.readFileSync('index.html','utf8');

  // Phase-A authority: the browser adapter must publish these facts, not invent them.
  const closure=K.sumSymbolicDurations(K.jainAvasarpini(1n));
  assert.equal(closure.k,10n,'avasarpini symbolic closure must be 10K');
  assert.equal(closure.years,0n,'the -42000 + 21000 + 21000 textual terms must cancel exactly');
  const dep=K.jainCycleDependencies();
  assert.equal(dep.double_21000_equals_42000,true);
  assert.equal(dep.independent_42000,false);

  const conflicts=K.groupDefinitionConflicts(sources);
  assert.deepEqual(new Set(conflicts.ksana.ids),new Set(['abhidharmakosa.ksana','bhagavata.ksana']));
  assert.deepEqual(new Set(conflicts.truti.ids),new Set(['arthasastra.truti','bhagavata.truti','siddhantasiromani.truti']));

  const precession=K.classifyCandidate({
    relation_claim:'hypothesis',
    ancient_quantity_kind:'time_interval',modern_quantity_kind:'time_interval',
    same_physical_quantity:false,
    ancient_value:21000,modern_value:25772
  });
  assert.equal(precession.status,'HYPOTHESIS');
  assert.equal(precession.phase_tested,false,'21 kyr must not acquire phase evidence without an independent anchor');

  const obliquity=K.classifyCandidate({
    relation_claim:'hypothesis',
    ancient_quantity_kind:'time_interval',modern_quantity_kind:'time_interval',
    dependency:{independent:false},ancient_value:42000,modern_value:41000
  });
  assert.equal(obliquity.status,'HYPOTHESIS');
  assert.equal(obliquity.independent,false);
  assert(obliquity.reasons.includes('dependent_harmonic_not_independent_evidence'));

  assert.equal(astronomy.length,6);
  assert(astronomy.every(r=>r.comparison_status==='PENDING_EPOCH_CORRECTION'),
    'no ancient astronomy benchmark may be silently promoted before source-epoch correction');

  // Shipped browser/API projection: one thin, inspectable adapter onto the authority above.
  assert(/const CHRONOMETRY_CASES\s*=\s*Object\.freeze\s*\(\s*\{/.test(src),
    'browser Chronometry case registry missing');
  assert(/id:'chronometry'\s*,\s*world:'cyc'\s*,\s*lab:'chronometry'/.test(src),
    'HCC_API Chronometry instrument must belong to the Cycles chronometry laboratory');
  assert(src.includes("'jain.avasarpini'"));
  assert(src.includes("'jain.precession_21000'"));
  assert(src.includes("'jain.obliquity_42000'"));
  assert(src.includes("status:'EXACT_TEXTUAL'"));
  assert(src.includes("status:'HYPOTHESIS'"));
  assert(src.includes('dependent_42000:true'));
  assert(src.includes('phase_consistent:false'));
  assert(src.includes('PENDING_EPOCH_CORRECTION'));
  assert(src.includes("'docs/verify-chronometry-source-locked.cjs'"));
  assert(src.includes("'docs/verify-chronometry-falsification.cjs'"));
  assert(src.includes("'docs/verify-ancient-astronomy-benchmarks.cjs'"));
  assert(/name:'case_id'/.test(src),'Chronometry API must expose a case_id input');
  assert(/evaluate:\s*\(\{case_id\}\)\s*=>/.test(src),'Chronometry API must evaluate the declared case, not a hidden default');

  console.log('PASS — source-locked Chronometry Atlas/API contract');
})().catch(e=>{console.error(e);process.exit(1)});
