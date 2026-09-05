'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'data', 'ancient-astronomy-benchmarks.json');
const doc = JSON.parse(fs.readFileSync(p, 'utf8'));
assert.equal(doc.schema, 'hcc.ancient-astronomy-benchmarks/1');
assert.ok(Array.isArray(doc.records) && doc.records.length >= 6);

const required = ['id','culture','text','source_epoch','quantity_kind','ancient_value','unit','derivation','citation','comparison_status','epistemic_status'];
const allowedComparison = new Set(['HISTORICAL_MEASUREMENT','DERIVED_TEXTUAL','PENDING_EPOCH_CORRECTION']);
for (const r of doc.records) {
  for (const key of required) assert.ok(r[key] !== undefined && r[key] !== null && r[key] !== '', `${r.id || 'record'} missing ${key}`);
  assert.ok(allowedComparison.has(r.comparison_status), `${r.id} invalid comparison_status ${r.comparison_status}`);
  assert.notEqual(r.comparison_status, 'EPOCH_CORRECTED_MATCH');
  assert.equal(typeof r.ancient_value.numerator, 'string');
  assert.equal(typeof r.ancient_value.denominator, 'string');
  assert.ok(BigInt(r.ancient_value.denominator) > 0n);
}

const byId = Object.fromEntries(doc.records.map(r => [r.id, r]));
const frac = r => Number(BigInt(r.ancient_value.numerator)) / Number(BigInt(r.ancient_value.denominator));

assert.ok(Math.abs(frac(byId['aryabhata.sidereal_day']) * byId['aryabhata.sidereal_day'].display_seconds_per_unit - 86164.1011542199) < 1e-8);
assert.ok(Math.abs(frac(byId['aryabhata.sidereal_lunar_month']) - 27.32166848335826) < 1e-12);
assert.ok(Math.abs(frac(byId['daming.tropical_year']) - 365.2428148185663) < 1e-12);
assert.ok(Math.abs(frac(byId['daming.synodic_month']) - 29.530591520690532) < 1e-12);
assert.ok(Math.abs(frac(byId['shoushi.tropical_year']) - 365.2425) < 1e-12);
assert.ok(Math.abs(frac(byId['shoushi.synodic_month']) - 29.530593) < 1e-12);

assert.match(byId['shoushi.synodic_month'].derivation, /日周.*10000|10,000/i);
assert.match(byId['daming.synodic_month'].derivation, /116321.*3939/);
assert.match(byId['aryabhata.sidereal_day'].derivation, /1582237500.*4320000.*1577917500/);

console.log(`PASS — ${doc.records.length} source-locked ancient astronomy benchmarks remain pending epoch correction`);
