import assert from 'node:assert/strict';
import {
  normalizeEpoch,
  splitEpochDays,
  epochDaysOf,
  reduceEpochModulo,
  createAtlasTime,
} from '../core/time/atlas-time.mjs';
import {
  TIME_DOMAIN_KIND,
  STATE_SCOPE,
  CLOCK_STATUS,
  TIME_DOMAINS,
  CLOCK_ADAPTERS,
  STATE_SCOPES,
  domainById,
  findClockAdapter,
  canPromoteToAtlasEpoch,
  stateScopeById,
  validateTimeRegistry,
} from '../core/time/registry.mjs';

assert.deepEqual(normalizeEpoch(1, 1.25), {day: 2, fraction: 0.25});
assert.deepEqual(normalizeEpoch(1, -0.25), {day: 0, fraction: 0.75});
assert.deepEqual(normalizeEpoch(-2, -0.75), {day: -3, fraction: 0.25});
assert.deepEqual(normalizeEpoch(3, 1), {day: 4, fraction: 0});
assert.deepEqual(normalizeEpoch(3, -1), {day: 2, fraction: 0});
assert.throws(() => normalizeEpoch(Number.MAX_SAFE_INTEGER, 1), /safe integer/);
assert.throws(() => splitEpochDays(Infinity), /finite/);

assert.deepEqual(splitEpochDays(-0.25), {day: -1, fraction: 0.75});
assert.equal(epochDaysOf({day: -1, fraction: 0.75}), -0.25);

const phase = reduceEpochModulo({day: 365_242_200_000, fraction: 0.75}, 365.2422, 0.25);
assert(phase >= 0 && phase < 365.2422);
const phaseNeg = reduceEpochModulo({day: -365_242_200_000, fraction: 0.25}, 29.530588, 0.75);
assert(phaseNeg >= 0 && phaseNeg < 29.530588);

const t = createAtlasTime({epochDays: 0.5, rateDaysPerSecond: 10, paused: false, source: 'test.init'});
const initial = t.snapshot();
assert(Object.isFrozen(initial));
assert.equal(initial.revision, 0);
assert.equal(initial.source, 'test.init');
assert.equal(t.snapshot().revision, 0, 'read must not mutate revision');

const s1 = t.advanceFrame(0.1, {source: 'test.frame'});
assert.equal(epochDaysOf(s1), 1.5);
assert.equal(s1.revision, 1);
assert.equal(s1.source, 'test.frame');

const beforeTxn = t.snapshot().revision;
const tx = t.transact({epochDays: 20.25, rateDaysPerSecond: -4, paused: true}, {source: 'test.transaction'});
assert.equal(tx.revision, beforeTxn + 1);
assert.equal(epochDaysOf(tx), 20.25);
assert.equal(tx.rateDaysPerSecond, -4);
assert.equal(tx.paused, true);

const frozen = t.snapshot();
const pausedFrame = t.advanceFrame(10, {source: 'test.frame.paused'});
assert.equal(epochDaysOf(pausedFrame), epochDaysOf(frozen));
assert.equal(pausedFrame.revision, frozen.revision, 'paused frame is not a scientific mutation');

const unpaused = t.setPaused(false, {source: 'test.resume'});
assert.equal(unpaused.revision, frozen.revision + 1);
const rate = t.setRate(-2, {source: 'test.rate'});
assert.equal(rate.rateDaysPerSecond, -2);
const backward = t.advanceFrame(2, {source: 'test.reverse'});
assert.equal(epochDaysOf(backward), 16.25);

const restored = t.restore({day: -2, fraction: -0.75, rateDaysPerSecond: 3, paused: false}, {source: 'test.restore'});
assert.equal(epochDaysOf(restored), -2.75);
assert.equal(restored.rateDaysPerSecond, 3);
assert.equal(restored.paused, false);

assert.throws(() => t.setRate(NaN), /finite/);
assert.throws(() => t.advanceFrame(Infinity), /finite/);
assert.throws(() => t.transact({unknown: 1}), /unknown AtlasTime field/);

const sixty = createAtlasTime({epochDays: 1_000_000, rateDaysPerSecond: 123.456});
const oneTwenty = createAtlasTime({epochDays: 1_000_000, rateDaysPerSecond: 123.456});
for (let i = 0; i < 60; i++) sixty.advanceFrame(1 / 60, {source: 'test.60hz'});
for (let i = 0; i < 120; i++) oneTwenty.advanceFrame(1 / 120, {source: 'test.120hz'});
assert(Math.abs(epochDaysOf(sixty.snapshot()) - epochDaysOf(oneTwenty.snapshot())) < 1e-9);
assert(Math.abs(
  reduceEpochModulo(sixty.snapshot(), 27.321661) -
  reduceEpochModulo(oneTwenty.snapshot(), 27.321661)
) < 1e-9);

console.log('PASS — AtlasTime split-epoch kernel');

assert.equal(Object.keys(TIME_DOMAIN_KIND).length, 7);
assert.equal(Object.keys(STATE_SCOPE).length, 4);
assert.equal(domainById('atlas.epoch').kind, 'ABSOLUTE_EPOCH');
assert.equal(domainById('relativity.proper_time').kind, 'PHYSICAL_LOCAL_TIME');
assert.equal(domainById('ks.regularizer_s').kind, 'PARAMETRIZATION_TIME');
assert.equal(domainById('mixmaster.tau').kind, 'PARAMETRIZATION_TIME');
assert.equal(domainById('standard_map.iteration').kind, 'ITERATION_INDEX');
assert.equal(domainById('anderson.site').kind, 'SPATIAL_INDEX');
assert.equal(domainById('render.monotonic').kind, 'RENDER_TIME');
assert.equal(canPromoteToAtlasEpoch('atlas.epoch'), true);
assert.equal(canPromoteToAtlasEpoch('solar.epoch'), true);
assert.equal(canPromoteToAtlasEpoch('relativity.proper_time'), false);
assert.equal(canPromoteToAtlasEpoch('standard_map.iteration'), false);

const refused = findClockAdapter('anderson.site', 'atlas.epoch');
assert.equal(refused.status, 'NO_EXCHANGE');
assert.equal(refused.source, 'anderson.site');
assert.equal(refused.target, 'atlas.epoch');
assert(Object.isFrozen(refused));

const lorenz = findClockAdapter('lorenz.poincare_iteration', 'lorenz.flow_time');
assert.equal(lorenz.status, 'STATISTICAL');
assert.equal(lorenz.meanReturnTime, 0.7509);
assert.match(lorenz.provenance, /verify-clock-exchange/);
assert.equal(lorenz.invertible, false);

const proper = findClockAdapter('relativity.coordinate_time', 'relativity.proper_time');
assert.equal(proper.status, 'MODEL_DEPENDENT');
assert.equal(proper.invertible, true);

assert.equal(stateScopeById('atlas.epoch').scope, 'GLOBAL_PHYSICS');
assert.equal(stateScopeById('atlas.rate_days_per_second').scope, 'GLOBAL_PHYSICS');
assert.equal(stateScopeById('atlas.paused').scope, 'GLOBAL_PHYSICS');
assert.equal(stateScopeById('view.camera').scope, 'VIEW_ONLY');

assert(Object.isFrozen(TIME_DOMAINS));
assert(Object.isFrozen(CLOCK_ADAPTERS));
assert(Object.isFrozen(STATE_SCOPES));
assert.deepEqual(validateTimeRegistry(), {ok: true, domains: TIME_DOMAINS.length, adapters: CLOCK_ADAPTERS.length, scopes: STATE_SCOPES.length});
assert.equal(CLOCK_STATUS.NO_EXCHANGE, 'NO_EXCHANGE');

console.log('PASS — typed Atlas time-domain registry');
