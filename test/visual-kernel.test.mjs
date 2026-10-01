import test from 'node:test';
import assert from 'node:assert/strict';

const orbit = await import('../visual/gpu/asteroid-reference.mjs').catch(() => null);

test('GPU parameter packing preserves Saturn/Jupiter and puts count at byte 48', () => {
  assert.ok(orbit, 'orbital reference module must exist');
  const storage = new ArrayBuffer(64);
  orbit.packAsteroidUniforms(storage, {sunGM:1, jupGM:2, satGM:3, dt:0.125,
    jupPos:[12,13,14], satPos:[21,22,23], particleCount:65536});
  const f = new Float32Array(storage), u = new Uint32Array(storage);
  assert.deepEqual([...f.slice(4,8)], [12,13,14,0]);
  assert.deepEqual([...f.slice(8,12)], [21,22,23,0]);
  assert.equal(u[12], 65536);
  assert.deepEqual([...u.slice(13)], [0,0,0]);
  assert.throws(() => orbit.packAsteroidUniforms(storage, {sunGM:1,dt:NaN}), /finite|parameter/);
});

test('velocity Verlet converges quadratically to an independent circular orbit', () => {
  assert.ok(orbit, 'orbital reference module must exist');
  const params = {sunGM:1, jupGM:0, satGM:0, jupPos:[0,0,0], satPos:[0,0,0], softeningSquared:0};
  const error = n => {
    let x = [1,0,0], v = [0,1,0];
    for (let i=0;i<n;i++) [x,v] = orbit.verletStep(x,v,{...params,dt:1/n});
    return Math.hypot(x[0]-Math.cos(1), x[1]-Math.sin(1), x[2]);
  };
  const ratio = error(16)/error(32);
  assert.ok(ratio>3.8 && ratio<4.2, `second-order ratio ${ratio}`);
});

test('velocity Verlet reverses fixed-step frozen-potential motion', () => {
  assert.ok(orbit, 'orbital reference module must exist');
  const p = {sunGM:1,jupGM:0.01,satGM:0.003,jupPos:[5,1,0],satPos:[9,0,1],dt:0.01,softeningSquared:1e-8};
  let x=[1,0,0],v=[0,1,0];
  for(let i=0;i<100;i++) [x,v]=orbit.verletStep(x,v,p);
  for(let i=0;i<100;i++) [x,v]=orbit.verletStep(x,v,{...p,dt:-p.dt});
  assert.ok(Math.hypot(x[0]-1,x[1],x[2])<1e-13);
  assert.ok(Math.hypot(v[0],v[1]-1,v[2])<1e-13);
});
