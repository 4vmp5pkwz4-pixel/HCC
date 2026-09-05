'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
(async () => {
  const M = await import('../core/labs/chronometry.source_locked.mjs');
  const a = M.makeRational(2n, 4n);
  assert.equal(a.n, 1n);
  assert.equal(a.d, 2n);
  assert.equal(M.toDecimal(M.makeRational(1n, 3n), 12), '0.333333333333');
  const ksana = M.calibrateFromDay(6480000n, 86400n);
  assert.equal(M.toDecimal(ksana, 12), '0.013333333333');

  const records = [
    {id:'abhidharmakosa.ksana',normalized_term:'ksana',quantity_kind:'time_interval',tradition:'Sarvastivada',text:'Abhidharmakosa',operational_definition:'120 ksana = 1 tatksana; 60 tatksana = 1 lava; 30 lava = 1 muhurta; 30 muhurta = 1 day-night',epistemic_status:'EXACT_TEXTUAL',citation:'Abhidharmakosa III.88-89',chain_to_day:[120,60,30,30]},
    {id:'bhagavata.ksana',normalized_term:'ksana',quantity_kind:'time_interval',tradition:'Puranic',text:'Bhagavata Purana',operational_definition:'3 nimesa = 1 ksana; 5 ksana = 1 kastha; 15 kastha = 1 laghu; 15 laghu = 1 nadika; 2 nadika = 1 muhurta; 30 muhurta = 1 day-night',epistemic_status:'EXACT_TEXTUAL',citation:'Bhagavata Purana 3.11.7-8',chain_to_day:[5,15,15,2,30]},
    {id:'arthasastra.truti',normalized_term:'truti',quantity_kind:'time_interval',tradition:'Kautiliya',text:'Arthasastra',operational_definition:'2 truti = 1 lava; 2 lava = 1 nimesa; 5 nimesa = 1 kastha; 30 kastha = 1 kala; 40 kala = 1 nalika; 2 nalika = 1 muhurta; 15 muhurta = day OR night',epistemic_status:'EXACT_TEXTUAL',citation:'Arthasastra II.20',chain_to_day:[2,2,5,30,40,2,30]},
    {id:'bhagavata.truti',normalized_term:'truti',quantity_kind:'time_interval',tradition:'Puranic',text:'Bhagavata Purana',operational_definition:'100 truti = 1 vedha; 3 vedha = 1 lava; 3 lava = 1 nimesa; 3 nimesa = 1 ksana; then Bhagavata ksana chain to day-night',epistemic_status:'EXACT_TEXTUAL',citation:'Bhagavata Purana 3.11.6-8',chain_to_day:[100,3,3,3,5,15,15,2,30]},
    {id:'siddhantasiromani.truti',normalized_term:'truti',quantity_kind:'time_interval',tradition:'Siddhantic',text:'Siddhantasiromani',operational_definition:'100 truti = 1 tatpara; 30 tatpara = 1 nimesa; 18 nimesa = 1 kastha; 30 kastha = 1 kala; 30 kala = 1 ghati; 2 ghati = 1 ksana; 30 ksana = 1 sidereal day',epistemic_status:'EXACT_TEXTUAL',citation:'Siddhantasiromani time-measure verses 16-17',chain_to_day:[100,30,18,30,30,2,30]}
  ];
  for (const r of records) assert.equal(M.validateSourceRecord(r), true);
  const groups = M.groupDefinitionConflicts(records);
  assert.deepEqual(groups.ksana.ids.sort(), ['abhidharmakosa.ksana','bhagavata.ksana']);
  assert.deepEqual(groups.truti.ids.sort(), ['arthasastra.truti','bhagavata.truti','siddhantasiromani.truti']);
  assert.equal(M.derivePartsPerDay(records[0]), 6480000n);
  assert.equal(M.derivePartsPerDay(records[1]), 67500n);
  assert.equal(M.derivePartsPerDay(records[2]), 1440000n);
  assert.equal(M.derivePartsPerDay(records[3]), 182250000n);
  assert.equal(M.derivePartsPerDay(records[4]), 2916000000n);

  const aras = M.jainAvasarpini(1n);
  assert.deepEqual(aras.map(x => [x.k, x.years]), [[4n,0n],[3n,0n],[2n,0n],[1n,-42000n],[0n,21000n],[0n,21000n]]);
  const closure = M.sumSymbolicDurations(aras);
  assert.deepEqual([closure.k, closure.years], [10n,0n]);
  const dep = M.jainCycleDependencies();
  assert.equal(dep.double_21000_equals_42000, true);
  assert.equal(M.calendarYearSeconds('360-day-traditional').n, 31104000n);
  assert.equal(M.calendarYearSeconds('360-day-traditional').d, 1n);
  assert.equal(M.calendarYearSeconds('Julian-year').n, 31557600n);
  assert.throws(() => M.calendarYearSeconds('canonical-unspecified'), /unspecified/);
  assert.equal(M.convertYears(21000n, '360-day-traditional').n, 653184000000n);

  const registryPath = path.join(__dirname, 'data', 'ancient-chronometry-sources.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  assert.equal(registry.schema, 'hcc.ancient-chronometry-sources/1');
  assert.ok(Array.isArray(registry.records) && registry.records.length >= 5);
  for (const r of registry.records) assert.equal(M.validateSourceRecord(r), true);
  const fileGroups = M.groupDefinitionConflicts(registry.records);
  assert.ok(fileGroups.ksana && fileGroups.truti);
  console.log('PASS — exact rational/calibration and source conflict kernel');
})().catch(e => { console.error(e); process.exit(1); });
