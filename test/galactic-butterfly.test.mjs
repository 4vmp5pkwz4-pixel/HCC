import test from 'node:test';
import assert from 'node:assert/strict';
import * as b from '../core/cycles/galactic-butterfly.mjs';
import * as THREE from 'three';
import {createButterflyScene,butterflyControlsHTML} from '../visual/galactic-butterfly.mjs';

test('celestial geometry keeps Sgr A* off the ecliptic and returns orthogonal plane bases', () => {
  const s=b.skyGeometry();
  assert.ok(Math.abs(s.galacticCentreLatitudeDeg+5.61)<.03);
  assert.ok(Math.abs(s.planeInclinationDeg-60.19)<.03);
  for(const p of [s.equatorPole,s.galacticPole]){
    const [u,v]=b.planeBasis(p);
    const dot=(a,c)=>a.reduce((n,x,i)=>n+x*c[i],0);
    assert.ok(Math.abs(dot(u,p))<1e-12);
    assert.ok(Math.abs(dot(v,p))<1e-12);
    assert.ok(Math.abs(dot(u,v))<1e-12);
  }
});
test('Maya calendar closure remains distinct from tropical and measured Venus periods', () => {
  const x=b.calendarRelations();
  assert.equal(x.calendarRoundDays,18980);
  assert.equal(x.haabCount,52);
  assert.equal(x.tzolkinCount,73);
  assert.equal(x.dresdenFiveVenusDays,2920);
  assert.equal(x.eightHaabDays,2920);
  assert.ok(x.venusEightYearResidualDays < -2 && x.venusEightYearResidualDays > -3);
  assert.equal(x.physicalResonanceEstablished,false);
});
test('epoch limits refuse planetary extrapolation without breaking deep-time reference views', () => {
  assert.equal(b.planetaryEpochValid(0),true);
  assert.equal(b.planetaryEpochValid(-1e9),false);
  assert.equal(b.planetaryEpochValid(NaN),false);
  const s=b.epochSummary(-1e9);
  assert.equal(s.planetaryStatus,'OUT_OF_RANGE');
  assert.ok(s.precessionPhase>=0&&s.precessionPhase<1);
  assert.ok(s.galacticPhase>=0&&s.galacticPhase<1);
  assert.throws(()=>b.epochSummary(Infinity));
});
test('Venus trace stays inside the ephemeris domain at both ends of the date range', () => {
  const seen=[];
  const trace=b.venusTrace(b.PLANET_MIN_DAY, d=>{assert.ok(b.planetaryEpochValid(d));seen.push(d);return {earth:[1,0,0],venus:[0,.72,0]};},32);
  assert.equal(trace.segments.length,32);
  assert.equal(trace.startDay,b.PLANET_MIN_DAY);
  assert.ok(seen.length>=32);
  assert.equal(b.venusTrace(b.PLANET_MAX_DAY+1,()=>{throw Error('must not call');}),null);
});
test('synthetic solar butterfly migrates equatorward and never claims an observed forecast', () => {
  const early=b.solarReference(2019.96), late=b.solarReference(2029.96);
  assert.ok(early.latitudeDeg>late.latitudeDeg);
  assert.equal(early.status,'SCHEMATIC');
  assert.equal(early.predictsIndividualEvents,false);
  assert.throws(()=>b.solarReference(NaN));
});

test('five scene branches have bounded finite geometry, reuse buffers during playback, and release them', () => {
  const ephemeris=d=>({earth:[Math.cos(d/58),Math.sin(d/58),0],venus:[.72*Math.cos(d/35.7),.72*Math.sin(d/35.7),.02]});
  const scene=createButterflyScene({THREE,label:()=>new THREE.Object3D(),ephemeris});
  for(const view of ['sky','venus','solar','nebula','galaxy']){
    scene.update(view,0,{lang:'ru'});
    const count=scene.stats().rebuilds;
    assert.ok(scene.stats().vertices>100);
    assert.ok(scene.stats().vertices<18000);
    scene.group.traverse(o=>{if(o.geometry){for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));}});
    const before=[];scene.group.traverse(o=>{if(o.geometry)before.push(o.geometry);});
    scene.update(view,.1,{lang:'ru'});
    assert.equal(scene.stats().rebuilds,count);
    const after=[];scene.group.traverse(o=>{if(o.geometry)after.push(o.geometry);});
    assert.deepEqual(after,before);
  }
  let disposals=0;scene.group.traverse(o=>o.geometry?.addEventListener('dispose',()=>disposals++));
  scene.dispose();assert.ok(disposals>0);assert.equal(scene.stats().vertices,0);
});
test('out-of-range controls retain evidence and make unavailable planetary results explicit',()=>{
  const html=butterflyControlsHTML({lang:'en',day:-1e9,paused:true,rate:1,dateLabel:'deep time'});
  assert.ok(html.includes('unavailable outside 1800–2050'));
  assert.ok(html.includes('https://maya.nmai.si.edu/'));
});
