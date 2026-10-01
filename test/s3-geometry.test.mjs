import test from 'node:test';
import assert from 'node:assert/strict';
import * as geometry from '../core/math/s3-geometry.mjs';
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
  assert.ok(Math.abs(s3ToStereographic(stereographicToS3([1e200, 0, 0]))[0] / 1e200 - 1) < 1e-14);
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
  assert.equal(s3GeodesicDistance([1, 0, 0, 0], [1 + 1e-11, 0, 0, 0], 2), 0);
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

test('Spin(4) uses xyzw quaternions and preserves the round metric', () => {
  assert.equal(typeof geometry.s3RotateSpin4,'function');
  const L=[0,0,Math.SQRT1_2,Math.SQRT1_2], R=[0,0,0,1];
  const p=[1,0,0,0],q=stereographicToS3([0.3,-0.6,0.2]);
  const rp=geometry.s3RotateSpin4(p,L,R),rq=geometry.s3RotateSpin4(q,L,R);
  assert.ok(Math.abs(rp[0]-Math.SQRT1_2)<1e-14);
  assert.ok(Math.abs(rp[1]-Math.SQRT1_2)<1e-14);
  assert.ok(Math.abs(Math.hypot(...rq)-1)<1e-14);
  assert.ok(Math.abs(s3GeodesicDistance(p,q)-s3GeodesicDistance(rp,rq))<1e-14);
  const bothNegative=geometry.s3RotateSpin4(q,L.map(v=>-v),R.map(v=>-v));
  bothNegative.forEach((v,i)=>assert.ok(Math.abs(v-rq[i])<1e-14));
  assert.throws(()=>geometry.s3RotateSpin4(p,[0,0,0,0],R),/unit|sphere/);
});

test('stereographic differential transforms ambient tangents, not a scaled 3D normal', () => {
  assert.equal(typeof geometry.s3StereographicDifferential,'function');
  const q=stereographicToS3([0.3,-0.6,0.2]);
  const raw=[1-q[0]*q[0],-q[0]*q[1],-q[0]*q[2],-q[0]*q[3]],n=Math.hypot(...raw),u=raw.map(v=>v/n),h=1e-6;
  const before=s3ToStereographic(q.map((v,i)=>Math.cos(h)*v-Math.sin(h)*u[i]));
  const after=s3ToStereographic(q.map((v,i)=>Math.cos(h)*v+Math.sin(h)*u[i]));
  const d=geometry.s3StereographicDifferential(q,u,2.5);
  d.forEach((v,i)=>assert.ok(Math.abs(v-2.5*(after[i]-before[i])/(2*h))<2e-9));
  assert.ok(Math.abs(Math.hypot(...d)*s3ConformalFactor(s3ToStereographic(q))-2.5)<1e-13);
  assert.throws(()=>geometry.s3StereographicDifferential(q,q),/tangent/);
  assert.throws(()=>geometry.s3StereographicDifferential([0,0,0,1],[1,0,0,0]),/pole|chart/);
});
