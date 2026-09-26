import test from 'node:test';
import assert from 'node:assert/strict';
import {
  definePhaseSpace, defineInvariant, defineConstraint, defineProjection,
  assertFiniteNativeState
} from '../core/phase/contract.mjs';
import { phaseRefusal } from '../core/phase/refusals.mjs';

const minimal = () => ({
  id: 'demo',
  carrier: { kind: 'vector-space', dimension: 2 },
  coordinates: [
    { id: 'x', type: 'number', role: 'native', quantity_kind: 'position', unit: 'm', dimension: 'L' },
    { id: 'y', type: 'number', role: 'display-only', quantity_kind: 'screen-y', unit: null, dimension: '1' }
  ],
  time: { kind: 'static' },
  dynamics: { kind: 'none' },
  invariants: [defineInvariant({ id: 'r2', kind: 'exact', quantity_kind: 'length-squared', unit: 'm^2', dimension: 'L^2' })],
  constraints: [defineConstraint({ id: 'finite', kind: 'domain' })],
  projections: [defineProjection({ id: 'screen', kind: 'display-only', coordinates: ['y'] })]
});

test('minimal valid phase contract is deeply frozen', () => {
  const c = definePhaseSpace(minimal());
  assert.equal(c.id, 'demo');
  assert.ok(Object.isFrozen(c));
  assert.ok(Object.isFrozen(c.coordinates));
  assert.ok(Object.isFrozen(c.coordinates[0]));
  assert.equal(c.geometry, 'UNDECLARED');
});

test('missing required ids and coordinate types are rejected', () => {
  assert.throws(() => definePhaseSpace({}), /id/i);
  assert.throws(() => definePhaseSpace({ id: 'x', coordinates: [{ id: 'q', role: 'native' }] }), /type/i);
  assert.throws(() => defineInvariant({ kind: 'exact' }), /id/i);
});

test('duplicate ids in a registry are rejected', () => {
  const spec = minimal();
  spec.coordinates.push({ ...spec.coordinates[0] });
  assert.throws(() => definePhaseSpace(spec), /duplicate coordinate id/i);
});

test('unknown native structure stays UNDECLARED rather than inferred', () => {
  const c = definePhaseSpace({ id: 'unknown', coordinates: [], invariants: [], constraints: [], projections: [] });
  assert.equal(c.carrier, 'UNDECLARED');
  assert.equal(c.time, 'UNDECLARED');
  assert.equal(c.dynamics, 'UNDECLARED');
  assert.equal(c.geometry, 'UNDECLARED');
});

test('non-finite native state is refused before diagnostics', () => {
  const c = definePhaseSpace(minimal());
  const bad = assertFiniteNativeState(c, { x: Infinity, y: Infinity });
  assert.equal(bad.status, 'REFUSED');
  assert.equal(bad.code, 'NON_FINITE_STATE');
  const good = assertFiniteNativeState(c, { x: 2, y: Infinity });
  assert.deepEqual(good, { x: 2, y: Infinity });
});

test('display-only coordinates are ineligible for scientific checks', () => {
  const c = definePhaseSpace(minimal());
  const y = c.coordinates.find(x => x.id === 'y');
  assert.equal(y.scientific_eligible, false);
  const screen = c.projections.find(x => x.id === 'screen');
  assert.equal(screen.scientific_eligible, false);
});

test('phaseRefusal has stable machine-readable shape', () => {
  assert.deepEqual(phaseRefusal('BAD', 'no', { x: 1 }), {
    status: 'REFUSED', code: 'BAD', message: 'no', detail: { x: 1 }
  });
});
