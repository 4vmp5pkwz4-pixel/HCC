/* THE SEVEN TESTS THIS RELEASE CITES AS ITS VALIDATION RAN NOWHERE.
   `npm test` did not name this file and core.yml never invoked it, so the
   explorer shipped with its stated validation unperformed. Six of the seven
   need no dependency at all -- the modules take THREE as an argument and import
   nothing -- and the only thing keeping them out of the fast workflow was one
   top-level `import * as THREE from 'three'` for the seventh. Split so the six
   run on every push and the scene test runs where the dependency is installed.
   Nothing is skipped: both halves are wired, in the workflow that can run them. */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as b from '../core/cycles/galactic-butterfly.mjs';
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

test('out-of-range controls retain evidence and make unavailable planetary results explicit',()=>{
  const html=butterflyControlsHTML({lang:'en',day:-1e9,paused:true,rate:1,dateLabel:'deep time'});
  assert.ok(html.includes('unavailable outside 1800–2050'));
  assert.ok(html.includes('https://maya.nmai.si.edu/'));
});
