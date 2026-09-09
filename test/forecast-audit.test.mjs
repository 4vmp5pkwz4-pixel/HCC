import test from 'node:test';
import assert from 'node:assert/strict';
import { forecastReach } from '../core/prediction/reach-forecast.mjs';

test('missing exponents do not manufacture a constant scaling law', () => {
  for (const exponent of [null, undefined, '', false, [], '2']) {
    const r = forecastReach({schema:'hcc.reach/1',chains:[{control:'x',power_law:true,exponent}]}, 'x');
    assert.equal(r.results[0].response_ratio, null);
    assert.equal(r.results[0].exponent, null);
  }
});

test('missing evidence stays unknown, and model endpoints carry no probability', () => {
  const r = forecastReach({schema:'hcc.reach/1',chains:[{control:'x',power_law:true,exponent:2,far_r2:null}]}, 'x');
  assert.equal(r.results[0].evidence.far_r2, null);
  assert.equal(r.uncertainty.kind, 'PARAMETER_SCENARIO');
  assert.equal(r.uncertainty.coverage_probability, null);
  assert.equal(r.empirical_validation, false);
});
test('underflow never turns a positive power-law endpoint into a physical zero',()=>{
  const f=forecastReach({schema:'hcc.reach/1',chains:[{control:'x',power_law:true,exponent:1000}]},'x',.9);
  assert.equal(f.results[0].interval_ratio,null);
  assert.equal(f.results[0].response_ratio,null);
});

export function fixture() {
  return {schema:'hcc.forecast-evaluation-input/1',model_id:'unit-test',
    dataset:{id:'example',kind:'synthetic',source:'hand-computed fixture',unit:'K'},
    nominal_coverage:0.8,
    records:[
      {training_end:'2026-01-01T00:00:00Z',issued_at:'2026-01-02T00:00:00Z',target_at:'2026-01-03T00:00:00Z',actual:10,predicted:9,baseline:8,lower:8,upper:10},
      {training_end:'2026-01-01T00:00:00Z',issued_at:'2026-01-03T00:00:00Z',target_at:'2026-01-04T00:00:00Z',actual:14,predicted:15,baseline:12,lower:14,upper:16}
    ]};
}

test('forecast audit contract exists', async () => {
  const fs = await import('node:fs');
  assert.ok(fs.existsSync(new URL('../core/prediction/forecast-audit.mjs', import.meta.url)));
});

const audit = async input => (await import('../core/prediction/forecast-audit.mjs')).auditForecast(input);
test('hand-computable errors and baseline skill', async () => {
  const r = await audit(fixture());
  assert.equal(r.metrics.mae,1);
  assert.equal(r.metrics.rmse,1);
  assert.equal(r.metrics.bias,0);
  assert.equal(r.metrics.baseline_rmse,2);
  assert.equal(r.metrics.mse_skill,0.75);
  assert.equal(r.intervals.coverage,1);
  assert.equal(r.intervals.mean_width,2);
  assert.equal(r.intervals.mean_interval_score,2);
  assert.equal(r.status,'SYNTHETIC_ONLY');
  assert.equal(r.empirical_validation,false);
  assert.equal(r.by_horizon.length,1);
});
test('chronology rejects training or prediction after target, duplicates and invalid dates', async () => {
  for (const change of [
    {training_end:'2026-01-04T00:00:00Z'},
    {issued_at:'2026-01-03T00:00:00Z'},
    {target_at:'2026-02-30T00:00:00Z'},
    {issued_at:'yesterday'}
  ]) {
    const x=fixture(); Object.assign(x.records[0],change);
    await assert.rejects(()=>audit(x),/chronology|timestamp/i);
  }
  const x=fixture(); x.records[1]={...x.records[0]};
  await assert.rejects(()=>audit(x),/duplicate/i);
});
test('strict numbers reject null, strings, booleans and non-finite values', async () => {
  for (const actual of [null,'10',true,NaN,Infinity]) {
    const x=fixture(); x.records[0].actual=actual;
    await assert.rejects(()=>audit(x),/finite number/);
  }
});
test('missing or reversed intervals are refused and misses incur an interval score penalty', async () => {
  for (const change of [{lower:17},{upper:undefined}]) {
    const x=fixture(); Object.assign(x.records[1],change);
    await assert.rejects(()=>audit(x),/interval|finite number/);
  }
  const x=fixture(); x.records[1].actual=17;
  const r=await audit(x);
  assert.equal(r.intervals.coverage,0.5);
  assert.ok(Math.abs(r.intervals.mean_interval_score-7)<1e-12);
});
test('a perfect baseline has undefined relative skill, not a manufactured win', async () => {
  const x=fixture(); x.records.forEach(r=>r.baseline=r.actual);
  const r=await audit(x);
  assert.equal(r.metrics.mse_skill,null);
  assert.equal(r.metrics.skill_reason,'ZERO_BASELINE_ERROR');
});
test('large finite errors retain a finite RMSE without squaring overflow', async () => {
  const x=fixture(); delete x.nominal_coverage;
  x.records.forEach(r=>{delete r.lower;delete r.upper;r.actual=1e200;r.predicted=0;r.baseline=0;});
  const r=await audit(x);
  assert.ok(Math.abs(r.metrics.rmse/1e200-1)<1e-14);
  assert.equal(r.intervals,null);
});
test('horizons are kept separate and supplied observations are never automatically authenticated', async () => {
  const x=fixture(); x.dataset.kind='observational'; x.records[1].target_at='2026-01-05T00:00:00Z';
  const r=await audit(x);
  assert.equal(r.by_horizon.length,2);
  assert.equal(r.status,'USER_SUPPLIED_HOLDOUT');
  assert.equal(r.empirical_validation,false);
});

test('server lab and static scoring agree, with optional intervals and strict inputs',async()=>{
  const {default:lab}=await import('../core/labs/prediction.holdout_audit.mjs');
  const x=fixture();
  assert.deepEqual(lab.run(x).outputs.audit,await audit(x));
  delete x.nominal_coverage;x.records.forEach(r=>{delete r.lower;delete r.upper;});
  assert.equal(lab.run(x).outputs.audit.intervals,null);
  assert.equal(lab.describe().input_schema.properties.dataset.type,'object');
  assert.ok(!lab.describe().input_schema.required.includes('nominal_coverage'));
  assert.throws(()=>lab.run({...x,nominal_coverage:'0.8'}),/must be number/);
  assert.throws(()=>lab.run({...x,typo:1}),/unknown input/);
});

test('SHA-256 export can be replayed to the same scientific result',async()=>{
  const {auditWithProvenance}=await import('../api/agent-client.mjs');
  const {createHash}=await import('node:crypto');
  const r=await auditWithProvenance(fixture());
  assert.equal(r.reproducibility.input_sha256,createHash('sha256').update(r.reproducibility.input_json).digest('hex'));
  assert.deepEqual((await audit(JSON.parse(r.reproducibility.input_json))).metrics,r.metrics);
});
test('one target observation cannot silently have two different actual values',async()=>{
  const x=fixture();x.records[1].target_at=x.records[0].target_at;x.records[1].issued_at='2026-01-01T12:00:00Z';
  await assert.rejects(()=>audit(x),/inconsistent observation/);
});
