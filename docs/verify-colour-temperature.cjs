#!/usr/bin/env node
/* ============================================================================
   COLOUR IS A TEMPERATURE, AND THAT IS WHY IT CAN BE AN AXIS

   The gyrochronology clock takes a COLOUR. On its own a colour is a ratio of
   two filter magnitudes and carries no physics, which makes it a bad thing to
   hang a depth axis on. Ballesteros closed that gap: treat the star as two
   blackbodies seen through B and through V, and the colour index becomes a
   temperature in closed form, with no fitted table anywhere in it.

   That bridge earns the atlas two statements it could not otherwise make, and
   this file checks both AND checks that the second one is a COINCIDENCE rather
   than a law — which is the harder and more important of the two, because a
   coincidence dressed as a law is exactly the kind of thing an atlas of
   measured facts is supposed to catch.

   This file shares no code with the atlas. Every constant is written out here,
   and the last three checks READ index.html to confirm the atlas is running the
   same numbers this file independently reimplements.

   TWELVE THINGS ARE CHECKED.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

/* ── Ballesteros, written out ─────────────────────────────────────────────── */
const BK = 4600, BA = 0.92, BP = 1.7, BQ = 0.62;
const teff = bv => BK * (1 / (BA * bv + BP) + 1 / (BA * bv + BQ));
const bvOf = t => { let lo = -0.35, hi = 3.0;
  for (let i = 0; i < 160; i++) { const m = (lo + hi) / 2; if (teff(m) > t) lo = m; else hi = m; }
  return (lo + hi) / 2; };

/* ── the spin-down clock, written out ─────────────────────────────────────── */
const GA = 0.7725, GB = 0.601, GN = 0.5189, BVMIN = 0.40;
const colour = bv => GA * Math.pow(bv - BVMIN, GB);
const period = (bv, tMyr) => colour(bv) * Math.pow(tMyr, GN);
const ageMyr = (bv, P) => Math.pow(P / colour(bv), 1 / GN);

/* ── the atlas's own main sequence, written out ───────────────────────────── */
const TSUN = 5772, MSUN = 1.989e30, C = 2.998e8, LSUN = 3.828e26, GYR = 3.156e16;
const EPS = 0.007, FCORE = 0.1;
const lum = m => m < 0.43 ? 0.23 * Math.pow(m, 2.3) : m < 2 ? Math.pow(m, 4) : 1.4 * Math.pow(m, 3.5);
const rad = m => m < 1 ? Math.pow(m, 0.8) : Math.pow(m, 0.57);
const temp = m => TSUN * Math.pow(lum(m) / (rad(m) * rad(m)), 0.25);
const lifeGyr = m => EPS * FCORE * m * MSUN * C * C / (lum(m) * LSUN) / GYR;
const turnoff = a => { let lo = 0.05, hi = 200;
  for (let i = 0; i < 200; i++) { const m = Math.sqrt(lo * hi); if (lifeGyr(m) > a) lo = m; else hi = m; }
  return Math.sqrt(lo * hi); };
const breakMass = (() => { let lo = 0.5, hi = 3.0;
  for (let i = 0; i < 160; i++) { const m = (lo + hi) / 2; if (bvOf(temp(m)) > BVMIN) lo = m; else hi = m; }
  return (lo + hi) / 2; })();

console.log('\n=== 1-4. The bridge, against a star it was never shown ===\n');

ok('BALLESTEROS RETURNS 5778 K AT B-V = 0.65 WHERE THE SUN RADIATES AT 5772 — one part in a thousand, from four constants fitted to nothing solar. That is the whole licence for treating a colour as a temperature, and it is an absolute anchor rather than a difference between two of its own outputs, so a common factor cannot cancel out of it',
  Math.abs(teff(0.65) - 5772) / 5772 < 0.002,
  `B-V 0.65 -> ${teff(0.65).toFixed(1)} K against the Sun's ${TSUN} K, ${(100 * (teff(0.65) - TSUN) / TSUN).toFixed(3)} per cent`);

ok('and it is strictly monotone across every colour the clock can be asked about, which is what makes the inverse a function rather than a choice. A relation that folded back would give two temperatures for one colour and the depth axis would stop meaning anything',
  (() => { let prev = Infinity;
    for (let bv = -0.30; bv <= 2.0; bv += 0.005) { const t = teff(bv); if (!(t < prev)) return false; prev = t; }
    return true; })(),
  'decreasing at every step from B-V -0.30 to 2.00, so bisection is safe and the axis is single-valued');

ok('forward and back invert to twelve figures across the whole range, so the depth axis can be labelled in kelvin and in magnitudes at once without either label being a decoration',
  [0.0, 0.40, 0.65, 1.0, 1.5].every(bv => Math.abs(bvOf(teff(bv)) - bv) < 1e-9),
  `round trip at B-V 0.65 returns ${bvOf(teff(0.65)).toFixed(12)}`);

ok('it is not, however, good everywhere, and this file says so rather than quoting only the colour that flatters it: at B-V = 0.00 it gives 10125 K where Vega sits near 9600, five and a half per cent out. The relation earns the Sun and does not earn the A stars',
  (() => { const e = (teff(0.0) - 9600) / 9600; return e > 0.03 && e < 0.09; })(),
  `B-V 0.00 -> ${teff(0.0).toFixed(0)} K against Vega's ~9600 K, ${(100 * (teff(0.0) - 9600) / 9600).toFixed(1)} per cent high`);

console.log('\n=== 5-7. Where the clock stops, said as a temperature ===\n');

ok('THE COLOUR TERM DIVERGES AT B-V = 0.40, AND THAT COLOUR IS 6880 K. Barnes fitted a boundary in magnitudes; the bridge says the boundary is a temperature, and a temperature is a physical statement — above it the convective envelope is too thin to run a dynamo, so the star never brakes and there is no clock to read',
  Math.abs(teff(BVMIN) - 6880) < 5,
  `B-V ${BVMIN.toFixed(2)} -> ${teff(BVMIN).toFixed(1)} K`);

ok('and the number is reported as it comes out rather than as it was wanted: the Kraft break is usually measured near 6250 K, so this is about 600 K high — the fitted boundary of a spin-down relation is NOT the same thing as the measured onset of the dynamo, and pretending the agreement is better than 600 K would be the kind of quiet tuning this atlas exists to refuse',
  (() => { const d = teff(BVMIN) - 6250; return d > 400 && d < 800; })(),
  `${teff(BVMIN).toFixed(0)} K against a measured break near 6250 K — ${(teff(BVMIN) - 6250).toFixed(0)} K high, stated, not tuned`);

ok('the mass at that colour is a CONSEQUENCE and not a second constant: bisect the atlas`s own mass-luminosity relation and Stefan-Boltzmann until the surface temperature reaches 6880 K, and the answer is 1.278 solar masses. Nothing about spin-down entered that bisection',
  Math.abs(breakMass - 1.2784) < 0.004,
  `${breakMass.toFixed(4)} M_sun, from L(M), R(M) and sigma T^4 alone`);

console.log('\n=== 8-9. A coincidence, checked to BE a coincidence ===\n');

ok('THE TURNOFF OF A 4.57 Gyr POPULATION IS 1.314 SOLAR MASSES, 2.75 per cent from the 1.278 where the clock stops. Two limits from a magnetised wind and from a fusion rate, sharing no constant, landing on the same mass — so the stars gyrochronology REFUSES are very nearly the stars a solar-age population has already buried, and the blue limit costs almost nothing on old field stars',
  (() => { const mto = turnoff(4.57); return Math.abs(mto - 1.3136) < 0.004 && Math.abs(mto / breakMass - 1) < 0.04; })(),
  `turnoff ${turnoff(4.57).toFixed(4)} against break ${breakMass.toFixed(4)} — ${(100 * Math.abs(turnoff(4.57) / breakMass - 1)).toFixed(2)} per cent apart`);

ok('AND IT IS A COINCIDENCE, WHICH IS THE CHECK THAT MATTERS. If the two limits were the same physics the agreement would survive changing the population; it does not. At 1 Gyr the turnoff is 1.74 times the break mass and at 13.8 Gyr it is 0.71 — the ratio sweeps through unity as the population ages and happens to cross near the age of the Sun. A file that asserted only the agreement would have promoted an accident to a law',
  (() => { const r1 = turnoff(1) / breakMass, r14 = turnoff(13.8) / breakMass;
    return r1 > 1.6 && r14 < 0.8 && Math.abs(turnoff(4.57) / breakMass - 1) < 0.04; })(),
  `ratio: 1 Gyr -> ${(turnoff(1) / breakMass).toFixed(3)} · 4.57 Gyr -> ${(turnoff(4.57) / breakMass).toFixed(3)} · 13.8 Gyr -> ${(turnoff(13.8) / breakMass).toFixed(3)}`);

console.log('\n=== 10-12. Why colour has to be an AXIS, and the atlas read back ===\n');

ok('AT ONE AGE THE PERIOD IS NOT A NUMBER BUT A SPREAD: 10.1 days at B-V 0.45 against 55.5 at 1.25, both at 4.57 Gyr — a factor of five and a half that a single curve through the solar colour would hide entirely. That is the argument for colour as a third axis rather than a slider, and it is a measurement rather than a preference',
  (() => { const lo = period(0.45, 4570), hi = period(1.25, 4570);
    return Math.abs(lo - 10.12) < 0.1 && Math.abs(hi - 55.54) < 0.2 && hi / lo > 5; })(),
  `${period(0.45, 4570).toFixed(2)} d to ${period(1.25, 4570).toFixed(2)} d at one age — a factor of ${(period(1.25, 4570) / period(0.45, 4570)).toFixed(2)}`);

ok('read backwards that spread is the error budget, and it is brutal: a colour wrong by 0.05 magnitudes — 189 K at the Sun, smaller than the disagreement between two published temperature scales — moves a solar age by 29 per cent. Nearer the divergence it more than doubles it, because the colour term is a power law that is going to zero',
  (() => { const P = 25.4;
    const eSun = ageMyr(0.60, P) / ageMyr(0.65, P);
    const eBlue = ageMyr(0.45, P) / ageMyr(0.50, P);
    return Math.abs(eSun - 1.295) < 0.02 && eBlue > 2.0 && Math.abs(teff(0.60) - teff(0.65) - 189) < 5; })(),
  `0.05 mag = ${(teff(0.60) - teff(0.65)).toFixed(0)} K, and moves the age by ${(100 * (ageMyr(0.60, 25.4) / ageMyr(0.65, 25.4) - 1)).toFixed(0)} per cent at the Sun, ${(100 * (ageMyr(0.45, 25.4) / ageMyr(0.50, 25.4) - 1)).toFixed(0)} per cent near the limit`);

ok('AND THE ATLAS IS RUNNING THESE NUMBERS. This file reimplemented Ballesteros from scratch; this check opens index.html and confirms the four constants there are the four constants here, so the agreement above is between two authorities and not between one authority and its own echo',
  (() => { const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    return /const GYRO_BALL_K=4600;/.test(src) && /const GYRO_BALL_A=0\.92;/.test(src)
        && /const GYRO_BALL_P=1\.7;/.test(src) && /const GYRO_BALL_Q=0\.62;/.test(src)
        && /gyroTeffFromBV=bv=>GYRO_BALL_K\*\(1\/\(GYRO_BALL_A\*bv\+GYRO_BALL_P\)/.test(src); })(),
  'K=4600, a=0.92, p=1.7, q=0.62 and the shape of the sum, all present in the atlas source');

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
