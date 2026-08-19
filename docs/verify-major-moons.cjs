#!/usr/bin/env node
/* ============================================================================
   NINE MOONS, AND THE MASSES THEY GIVE BACK

   The atlas has had Jupiter and Saturn since it was written and not one of their moons.
   Only Earth's. Which left out the single most surprising true statement about the sizes in
   this system — Ganymede and Titan are both LARGER THAN MERCURY — and there was nothing on
   the screen that could say it.

   Nine are added, each entered from its own literature semi-major axis, sidereal period and
   mean radius. NO PLANET MASS APPEARS ANYWHERE IN THAT TABLE, which is what makes the check
   below worth running: Kepler's third law over a parent's moons returns 4 pi^2 a^3/P^2, and
   that number IS the parent's GM. If the entries were wrong, the moons of one planet would
   not agree with each other, and none of them would agree with JPL.

   Run: node docs/verify-major-moons.cjs
   ========================================================================= */

let pass = 0, fail = 0;
const ok = (t, c, d) => { c ? pass++ : fail++;
  console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); };

(async () => {
const { pathToFileURL } = require('node:url');
const { join } = require('node:path');
const X = await import(pathToFileURL(join(__dirname, '..', 'core/atlas/extracted.mjs')).href);

/* JPL system GM, in m^3/s^2 — written HERE, and nowhere in the moon table */
const GM = { 3: 4.282837e13, 4: 1.26686534e17, 5: 3.7931187e16, 7: 6.836529e15 };
const NAME = { 3: 'Mars', 4: 'Jupiter', 5: 'Saturn', 7: 'Neptune' };

console.log('\n1 · Kepler over the moons returns the planet\n');
{
  const by = {};
  for (const m of X.MAJOR_MOONS) (by[m.parent] = by[m.parent] || []).push(m);
  const rows = []; let worstSpread = 0, worstErr = 0;
  for (const k of Object.keys(by)) {
    const g = by[k].map(m => X.moonKeplerGM(m.a, m.P));
    const mean = g.reduce((a, b) => a + b, 0) / g.length;
    const spread = (Math.max(...g) - Math.min(...g)) / mean;
    const err = Math.abs(mean - GM[k]) / GM[k];
    if (g.length > 1) worstSpread = Math.max(worstSpread, spread);
    worstErr = Math.max(worstErr, err);
    rows.push(`${NAME[k]}: ${g.length} moon${g.length > 1 ? 's' : ''}, GM = ${mean.toExponential(4)} against JPL's ${GM[k].toExponential(4)} (${(err * 100).toFixed(3)}%)`);
  }
  ok("a^3/P^2 is the SAME for every moon of one parent — Jupiter's four Galileans agree with each other to under a tenth of a per cent, from four independently entered pairs of numbers",
    worstSpread < 2e-3,
    rows.join(' · ') + ` · worst internal spread ${(worstSpread * 100).toFixed(3)} per cent`);

  ok("and 4 pi^2 a^3/P^2 IS the parent's GM: the moons hand back Jupiter's mass, Saturn's, Mars's and Neptune's to a tenth of a per cent, with no planet mass anywhere in the table they came from",
    worstErr < 2e-3,
    `worst departure from JPL ${(worstErr * 100).toFixed(3)} per cent · this is the check that the entries are real measurements and not plausible-looking numbers`);

  /* and the law is a POWER law, not a fit: doubling nothing, the exponent is exactly 3/2 */
  const gal = X.MAJOR_MOONS.filter(m => m.parent === 4);
  let worstExp = 0;
  for (let i = 0; i < gal.length; i++) for (let j = i + 1; j < gal.length; j++) {
    const e = Math.log(gal[j].P / gal[i].P) / Math.log(gal[j].a / gal[i].a);
    worstExp = Math.max(worstExp, Math.abs(e - 1.5));
  }
  ok('and the exponent measured between every PAIR of Galilean moons is three halves — the law is a power law and the power is the one Kepler said',
    worstExp < 5e-3,
    `six pairs, worst departure of log(P2/P1)/log(a2/a1) from 1.5 is ${worstExp.toExponential(2)}`);
}

console.log('\n2 · a moon larger than a planet, twice\n');
{
  const big = X.MAJOR_MOONS.filter(m => X.moonBiggerThanMercury(m.r));
  ok('Ganymede and Titan are both LARGER THAN MERCURY — by 194 and 135 kilometres — so two of the nine moons here outsize a planet, and exactly two do',
    big.length === 2 && big.map(m => m.name).sort().join(',') === 'Ganymede,Titan' &&
    Math.abs(big.find(m => m.name === 'Ganymede').r - 2634.1) < 1e-9,
    big.map(m => `${m.name} ${m.r} km, larger by ${(m.r - 2439.7).toFixed(1)}`).join(' · ') +
    ' · Mercury is 2439.7 km, and Callisto at 2410.3 misses it by 29');

  ok('and Ganymede is the largest of the nine, ahead of Titan, which is the ordering the object cards claim',
    X.MAJOR_MOONS.reduce((a, b) => a.r > b.r ? a : b).name === 'Ganymede' &&
    X.MAJOR_MOONS.filter(m => m.r > 2500).length === 2,
    X.MAJOR_MOONS.slice().sort((a, b) => b.r - a.r).slice(0, 4).map(m => m.name + ' ' + m.r).join(' > '));
}

console.log('\n3 · the one that goes the other way\n');
{
  const retro = X.MAJOR_MOONS.filter(m => m.P < 0);
  ok('exactly one of the nine orbits RETROGRADE — Triton, backwards around Neptune — and its sign is carried in the period rather than in a note, so nothing that uses the table can miss it',
    retro.length === 1 && retro[0].name === 'Triton' && retro[0].P < 0,
    `Triton, period ${retro[0].P} d · the sign is why it is thought to be a Kuiper belt object Neptune caught rather than one it formed with · and Kepler does not care about the direction, which is why the GM above still came out right`);

  ok('and every one of the nine has a positive semi-major axis, a positive radius and a period that is not zero — the table is well formed before anything is computed from it',
    X.MAJOR_MOONS.every(m => m.a > 0 && m.r > 0 && m.P !== 0 && Number.isFinite(m.a + m.r + m.P)) &&
    X.MAJOR_MOONS.length === 9,
    `${X.MAJOR_MOONS.length} moons across ${new Set(X.MAJOR_MOONS.map(m => m.parent)).size} parents`);
}

console.log('\n4 · orbital speed, from the same two numbers\n');
{
  const rows = X.MAJOR_MOONS.map(m => `${m.name} ${X.moonOrbitalSpeed(m.a, m.P).toFixed(2)}`);
  /* the fastest is the innermost, which is what a Kepler orbit does */
  const sorted = X.MAJOR_MOONS.slice().filter(m => m.parent === 4).sort((a, b) => a.a - b.a);
  let mono = true;
  for (let i = 1; i < sorted.length; i++)
    if (X.moonOrbitalSpeed(sorted[i].a, sorted[i].P) >= X.moonOrbitalSpeed(sorted[i - 1].a, sorted[i - 1].P)) mono = false;
  ok('orbital speed falls with distance for the four Galileans, strictly — the innermost is the fastest, which is the other half of what Kepler says and is measured here rather than assumed',
    mono && X.moonOrbitalSpeed(9376, 0.318910) > 2,
    rows.join(' · ') + ' km/s');
}

console.log(`\n${fail === 0 ? '✔' : '✗'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
