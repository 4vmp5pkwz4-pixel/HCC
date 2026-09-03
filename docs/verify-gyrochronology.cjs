#!/usr/bin/env node
/* ============================================================================
   HOW OLD IS A STAR, AND WHY A LIFETIME IS NOT AN AGE

   This atlas could compute how long a star LIVES and never how old one IS. The
   two look alike and are not: the Sun's main-sequence lifetime is 10.4 Gyr and
   its age is 4.57, so a reader who takes the published lifetime for an age is
   wrong by more than a factor of two. A LIFETIME IS A CEILING.

   Two clocks give an actual age and they date DIFFERENT THINGS. The turnoff
   dates a cluster: stars heavier than some mass have left, and that mass is a
   clock. Gyrochronology dates a single star: magnetised winds carry angular
   momentum away, so rotation slows with age.

   AND THEY ARE NOT INDEPENDENT, which this file states rather than hides. The
   single-star clock is CALIBRATED on clusters whose ages the turnoff gave, so
   agreement between them is not confirmation — it is the calibration working.

   This file shares no code with the atlas. Every constant is written out here.

   TEN THINGS ARE CHECKED.
   ========================================================================== */
'use strict';
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const A = 0.7725, B = 0.601, N = 0.5189, BVMIN = 0.40;
const colour = bv => A * Math.pow(bv - BVMIN, B);
const period = (bv, tMyr) => colour(bv) * Math.pow(tMyr, N);
const ageMyr = (bv, P) => Math.pow(P / colour(bv), 1 / N);
const SUN_BV = 0.65, SUN_P = 25.4, SUN_AGE = 4570;

console.log('\n=== 1-3. A lifetime is not an age ===\n');

ok('THE SUN IS FORTY-FOUR PER CENT THROUGH ITS MAIN-SEQUENCE LIFE, which is the whole reason this laboratory exists. The atlas publishes a lifetime of 10.4 Gyr and the Sun is 4.57 Gyr old; a reader who reads the first as the second is wrong by a factor of 2.3, and nothing in the atlas said so before',
  (() => { const life = 10.36, age = 4.57; const f = age / life;
    return Math.abs(f - 0.441) < 0.01 && life / age > 2.2; })(),
  '4.57 Gyr of a 10.36 Gyr lifetime = 44.1 per cent — the lifetime exceeds the age by a factor of 2.27');

ok('and a lifetime is a CEILING in the strict sense: every star on the main sequence has an age below it, so a lifetime can bound an age and can never be one',
  (() => { for (const [age, life] of [[4.57, 10.36], [0.6, 3.07], [12, 14.21]]) if (!(age < life)) return false; return true; })(),
  'age < lifetime for every main-sequence star, which makes the lifetime an upper bound and not a measurement');

ok('THE TURNOFF DATES A CLUSTER AND NOT A STAR. It says that stars above some mass have left, which is a statement about a population; a single field star has no turnoff and the clock does not apply to it at all',
  (() => { const lifetime = m => 10.36 * Math.pow(m, -2.8);
    const a = lifetime(1.31); return Math.abs(a - 4.8) < 1.2; })(),
  'a cluster turning off near 1.31 solar masses is a few billion years old; the same number says nothing about any one of its stars');

console.log('\n=== 4-7. The rotation clock ===\n');

ok('MAGNETISED WINDS SLOW A STAR, and Skumanich found the law: rotation goes as the inverse square root of time, so four times the age is exactly twice the period',
  Math.abs(Math.pow(4, 0.5) - 2) < 1e-12,
  'the pure Skumanich exponent one half gives exactly 2.000 for a fourfold age');

ok('and Barnes`s fitted exponent is 0.5189 rather than a half, which makes four times the age 2.053 times the period. THREE PER CENT IS A RESULT AND NOT A ROUNDING — it says the braking steepens slightly with age, and a check that treated 0.5189 as "about a half" would be throwing away the finding',
  (() => { const r = Math.pow(4, N); return Math.abs(r - 2.053) < 0.002 && Math.abs(r - 2) > 0.04; })(),
  `four times the age gives ${Math.pow(4, N).toFixed(4)} times the period, against Skumanich's exactly 2`);

ok('the colour term is what makes this a clock at all rather than a curiosity: a bluer star has a thinner convective envelope, brakes less, and the relation goes to zero at B-V = 0.40 where there is essentially no envelope left to do the braking',
  colour(0.65) > 0 && colour(0.45) < colour(0.65) && colour(0.41) < 0.15,
  `B-V 0.65 → ${colour(0.65).toFixed(4)} · 0.45 → ${colour(0.45).toFixed(4)} · 0.41 → ${colour(0.41).toFixed(4)}, vanishing at the boundary`);

ok('and the forward and backward directions invert exactly, across two decades of age — a clock that did not invert would be a correlation and not a measurement',
  [125, 625, 2000, 4570, 10000].every(t => Math.abs(ageMyr(SUN_BV, period(SUN_BV, t)) - t) / t < 1e-9),
  'the Pleiades, the Hyades, and the Sun all return their own ages to nine figures');

console.log('\n=== 8-10. Against the one star whose age is known otherwise ===\n');

ok('THE SUN COMES OUT AT 4.18 Gyr AGAINST A TRUE 4.57 — nine per cent low, and that is stated rather than tuned away. The relation is anchored on clusters younger than a billion years and is here being extrapolated five times past its calibration; a laboratory that quietly fitted the solar point would be hiding the only honest test it has',
  (() => { const a = ageMyr(SUN_BV, SUN_P); const err = (a - SUN_AGE) / SUN_AGE;
    return err < -0.05 && err > -0.13; })(),
  `${(ageMyr(SUN_BV, SUN_P) / 1000).toFixed(3)} Gyr against 4.570 — ${(100 * (ageMyr(SUN_BV, SUN_P) - SUN_AGE) / SUN_AGE).toFixed(1)} per cent`);

ok('run forwards instead, the Sun should be turning in 26.6 days where it turns in 25.4 — the same disagreement seen from the other side, and the two are consistent because the relation is a power law and the error propagates through the exponent',
  (() => { const p = period(SUN_BV, SUN_AGE); return Math.abs(p - 26.62) < 0.05 && p > SUN_P; })(),
  `predicted ${period(SUN_BV, SUN_AGE).toFixed(2)} d against an observed ${SUN_P} d`);

ok('AND THE TWO CLOCKS ARE NOT INDEPENDENT, which matters more than either number. Gyrochronology is calibrated on clusters whose ages came from the turnoff, so when they agree that is the calibration working and not two witnesses agreeing. This atlas has a doctrine of two authorities for one fact, and it only means something when the authorities do not share a source — here they do, and saying so is the difference between a check and a decoration',
  (() => { const hy = period(SUN_BV, 625), pl = period(SUN_BV, 125);
    return hy > pl && Math.abs(hy - 9.48) < 0.1 && Math.abs(pl - 4.11) < 0.1; })(),
  `the calibrating clusters: Pleiades at 125 Myr → ${period(SUN_BV, 125).toFixed(2)} d, Hyades at 625 Myr → ${period(SUN_BV, 625).toFixed(2)} d — both dated by the turnoff first`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
