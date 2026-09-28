import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stereographicToS3, s3ToStereographic, s3GeodesicDistance,
  s3ConformalFactor, hopfBase, measureS3,
} from '../core/math/s3-geometry.mjs';

test('native stereographic chart preserves points and refuses its excluded pole', () => {
  assert.deepEqual(stereographicToS3([0, 0, 0]), [0, 0, 0, -1]);
  const q = stereographicToS3([3, 0, 0]);
  assert.ok(Math.abs(q[0] - 0.6) < 1e-15);
  assert.ok(Math.abs(q[3] - 0.8) < 1e-15);
  assert.ok(Math.abs(s3ToStereographic(q)[0] - 3) < 1e-14);
  assert.ok(Math.abs(s3ToStereographic(stereographicToS3([1e9, 0, 0]))[0] / 1e9 - 1) < 1e-14);
  assert.throws(() => s3ToStereographic([0, 0, 0, 1]), /pole|chart/i);
  assert.throws(() => s3ToStereographic([2, 0, 0, 0]), /unit|sphere/i);
  assert.throws(() => stereographicToS3([Infinity, 0, 0]), /finite/i);
});

test('round S³ metric retains near-coincident and antipodal distances', () => {
  const south = [0, 0, 0, -1];
  assert.ok(Math.abs(s3GeodesicDistance(south, [1, 0, 0, 0], 2) - Math.PI) < 1e-14);
  assert.ok(Math.abs(s3GeodesicDistance(south, [0, 0, 0, 1], 2) - 2 * Math.PI) < 1e-14);
  const near = [Math.sin(1e-9), 0, 0, -Math.cos(1e-9)];
  assert.ok(Math.abs(s3GeodesicDistance(south, near, 2) / 2e-9 - 1) < 1e-7);
  assert.equal(s3GeodesicDistance(south, south, 2), 0);
  assert.ok(Math.abs(s3ConformalFactor([3, 0, 0]) - 0.2) < 1e-15);
  assert.throws(() => s3GeodesicDistance(south, near, 0), /radius/i);
});

test('Hopf base is invariant under a common U(1) phase', () => {
  const t = 0.7, a = Math.SQRT1_2;
  const base = hopfBase([a, 0, a, 0]);
  const rotated = hopfBase([a * Math.cos(t), a * Math.sin(t), a * Math.cos(t), a * Math.sin(t)]);
  assert.ok(Math.abs(base[0] - 1) < 1e-15);
  for (let i = 0; i < 3; i++) assert.ok(Math.abs(base[i] - rotated[i]) < 1e-14);
});

test('agent geometry measurement keeps radius assumption, unit, and epistemic status', () => {
  const result = measureS3({ from: [0, 0, 0, -1], to: [1, 0, 0, 0], radius: 2, unit: 'Gly' });
  assert.equal(result.schema, 'hcc.s3-measurement/1');
  assert.equal(result.status, 'CONDITIONAL');
  assert.equal(result.unit, 'Gly');
  assert.ok(Math.abs(result.length - Math.PI) < 1e-14);
  assert.ok(result.assumptions.some(s => /round|S³/.test(s)));
  assert.throws(() => measureS3({ from: [0, 0, 0, -1], to: [1, 0, 0, 0], radius: 2 }), /unit/i);
  assert.throws(() => measureS3({ from: [0, 0, 0, -1], to: [1, 0, 0, 0], unit: 'Gly' }), /radius/i);
});
