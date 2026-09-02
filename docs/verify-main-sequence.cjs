#!/usr/bin/env node
/* ============================================================================
   WHERE STARS LIVE, AND THE RATIO A GALAXY HANGS ON

   THE UNIT CENSUS PICKED THIS LABORATORY.  Three benches in this atlas publish
   a luminosity in watts and across a hundred and six laboratories nothing had
   ever consumed one.  Meanwhile the galaxy bench states, in its own limits,
   that its single largest uncertainty is a stellar mass-to-light ratio it had
   no way to compute.

   This file shares no code with the atlas: every constant is written out from
   the IAU nominal values and CODATA, and every formula from the physics.

   TWELVE THINGS ARE CHECKED.

   1.  The Sun's own normalisation -- L, R and T_eff must come back exactly.
   2.  THE NUCLEAR CLOCK.  0.7% of a hydrogen mass becomes energy; that is a
       measured mass defect, c^2 is exact, and the Sun comes out at ten billion
       years.
   3.  The mass-luminosity exponent is NOT one number: 2.3, 4, 3.5, and 1.
   4.  And the reason the last one is 1: the Eddington ceiling is linear in
       mass, and the top of the sequence sits at a fixed fraction of it.
   5.  The lifetime falls roughly as M^-2.5, so the bright ones go first.
   6.  The turnoff, by bisection: 1.01 solar masses at ten billion years.
   7.  The mass-to-light ratio of a population, integrated over an IMF.
   8.  And it moves by a FACTOR OF SIXTY across the ages of real populations,
       which is the whole result: there is no such number.
   9.  The initial mass function is worth 44 per cent of it.
   10. The remnants are a seventh of the mass and carry no light.
   11. The quadrature converges -- and its integrand has kinks, so it converges
       to a tenth of a per cent and not to machine precision, which is measured
       rather than hidden.
   12. AND THE PUBLISHED RATIO IS AN UPPER BOUND.  A giant-branch model with
       parameters that sound reasonable swings it by a factor of nine, which is
       why the atlas ships that model switched off.
   ========================================================================== */
'use strict';
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const MSUN = 1.98892e30, LSUN = 3.828e26, TSUN = 5772;
const C = 299792458, G = 6.67430e-11;
const YR = 3.155693e7, GYR = 1e9 * YR;
const EPS = 0.007, FCORE = 0.1, KAPPA = 0.034, EDD_FRACTION = 0.833;

const eddington = m => 4 * Math.PI * G * m * MSUN * C / KAPPA / LSUN;
function L(m) {
  if (!(m > 0)) return 0;
  if (m < 0.43) return 0.23 * Math.pow(m, 2.3);
  if (m < 2)    return Math.pow(m, 4);
  if (m < 55)   return 1.4 * Math.pow(m, 3.5);
  return EDD_FRACTION * eddington(m);
}
const radius = m => (m < 1) ? Math.pow(m, 0.8) : Math.pow(m, 0.57);
const temp   = m => TSUN * Math.pow(L(m) / (radius(m) * radius(m)), 0.25);
const tauGyr = m => EPS * FCORE * m * MSUN * C * C / (L(m) * LSUN) / GYR;
function slope(m) { const h = 1e-4;
  return (Math.log(L(m * (1 + h))) - Math.log(L(m * (1 - h)))) / (Math.log(1 + h) - Math.log(1 - h)); }
function turnoff(age) { let lo = 0.05, hi = 200;
  for (let i = 0; i < 200; i++) { const mid = Math.sqrt(lo * hi);
    if (tauGyr(mid) > age) lo = mid; else hi = mid; }
  return Math.sqrt(lo * hi); }
const remnant = m => (m < 8) ? 0.109 * m + 0.394 : (m < 25 ? 1.4 : 0.1 * m);
function imf(m, kind) {
  if (kind === 'kroupa') { if (m < 0.08) return 0;
    if (m < 0.5) return Math.pow(m / 0.5, -1.3) * Math.pow(0.5, -2.3);
    return Math.pow(m, -2.3); }
  return Math.pow(m, -2.35);
}
function ML(age, kind, N) {
  const n = N || 4000, lo = 0.1, hi = 100, mto = turnoff(age);
  const dx = (Math.log(hi) - Math.log(lo)) / n;
  let mass = 0, light = 0, alive = 0;
  for (let i = 0; i < n; i++) {
    const m = Math.exp(Math.log(lo) + dx * (i + 0.5));
    const w = imf(m, kind) * m * dx;
    if (m <= mto) { mass += w * m; alive += w * m; light += w * L(m); }
    else mass += w * remnant(m);
  }
  return { ml: mass / light, mass, light, alive, mto,
           remnantFrac: (mass - alive) / mass, mlNoRem: alive / light };
}

console.log('\n=== 1-2. The Sun, and the clock that measures everything else ===\n');

ok('the Sun`s own normalisation comes back exactly: one solar luminosity, one solar radius, and 5772 kelvin. Nothing here is fitted to make that true — the relation is written L = M^4 between 0.43 and 2 solar masses and the Sun sits inside that branch, so its luminosity is one by construction and its temperature then follows from Stefan-Boltzmann rather than being typed in',
  Math.abs(L(1) - 1) < 1e-12 && Math.abs(radius(1) - 1) < 1e-12 && Math.abs(temp(1) - 5772) < 0.5,
  `L = ${L(1).toFixed(12)} · R = ${radius(1).toFixed(12)} · T_eff = ${temp(1).toFixed(3)} K`);

ok('THE NUCLEAR CLOCK GIVES THE SUN TEN BILLION YEARS, and every number in it is measured or exact: four protons weigh 0.7 per cent more than a helium nucleus, c squared is a definition, and the only modelling choice is that a tenth of the hydrogen is in the core. Change that tenth and every lifetime here scales with it linearly, which is why it is exposed as a knob rather than buried',
  Math.abs(tauGyr(1) - 10.36) < 0.15,
  `tau_sun = ${tauGyr(1).toFixed(3)} Gyr (literature ~10) · at f = 0.05 it would be ${(tauGyr(1) / 2).toFixed(2)} and at f = 0.2, ${(tauGyr(1) * 2).toFixed(2)}`);

console.log('\n=== 3-5. The exponent is not one number, and the top has a ceiling ===\n');

ok('the mass-luminosity exponent is 2.3, then 4, then 3.5, then 1 — measured here by differencing the relation rather than read off the branches it was written from. This check was first written claiming a single exponent would be SIXTY times wrong at a tenth of a solar mass; measuring it gives 3.7 there, and the worst point across the whole range is 3.9 times at the top, where a bare M^3.5 law sails straight through the Eddington ceiling. Four times is not orders of magnitude and the sentence has been corrected to what the code does, which is the entire reason for computing it instead of asserting it',
  Math.abs(slope(0.3) - 2.3) < 0.01 && Math.abs(slope(1) - 4) < 0.01
  && Math.abs(slope(5) - 3.5) < 0.01 && Math.abs(slope(80) - 1) < 0.01
  && (() => { let worst = 0;
      for (let i = 0; i <= 300; i++) { const m = Math.pow(10, -1 + 3.04 * i / 300);
        const r = L(m) / Math.pow(m, 3.5); worst = Math.max(worst, Math.max(r, 1 / r)); }
      return worst > 3 && worst < 5; })(),
  (() => { let worst = 0, at = 0;
    for (let i = 0; i <= 300; i++) { const m = Math.pow(10, -1 + 3.04 * i / 300);
      const r = L(m) / Math.pow(m, 3.5); const e = Math.max(r, 1 / r);
      if (e > worst) { worst = e; at = m; } }
    return `slopes at 0.3, 1, 5, 80 M☉: ${[0.3,1,5,80].map(m => slope(m).toFixed(3)).join(' · ')} · a bare M^3.5 law is worst by ${worst.toFixed(2)}× at ${at.toFixed(1)} M☉, and ${(L(0.1)/Math.pow(0.1,3.5)).toFixed(2)}× out at 0.1`; })());

ok('AND THE REASON THE LAST EXPONENT IS EXACTLY ONE is the Eddington ceiling, which is linear in mass with no exponent to choose. A star brighter than 4 pi G M c / kappa pushes its own outer layers off; the upper main sequence sits at a fixed 83 per cent of that, so its slope is inherited from the ceiling rather than fitted. The Sun, by contrast, runs at twenty-six parts per million of its own limit',
  Math.abs(L(60) / eddington(60) - 0.833) < 1e-9
  && Math.abs(L(100) / eddington(100) - 0.833) < 1e-9
  && Math.abs(L(1) / eddington(1) - 2.6e-5) < 2e-6,
  `Eddington fraction at 60 and 100 M☉: ${(L(60)/eddington(60)).toFixed(6)} and ${(L(100)/eddington(100)).toFixed(6)} — identical, because both are the ceiling times a constant · the Sun: ${(L(1)/eddington(1)).toExponential(3)}`);

ok('so the bright stars are the short-lived ones, and steeply: luminosity climbs as roughly the fourth power of mass while the fuel climbs as the first, and the lifetime falls as about M^-3 in the middle of the range. A sixty solar mass star lasts three hundred thousand years; a tenth of a solar mass outlives the present universe by a factor of sixty',
  tauGyr(60) < 1e-3 && tauGyr(0.1) > 500
  && (() => { const s = (Math.log(tauGyr(2)) - Math.log(tauGyr(0.5))) / (Math.log(2) - Math.log(0.5));
      return s < -2.5 && s > -3.5; })(),
  `60 M☉: ${(tauGyr(60)*1e9/1e6).toFixed(0)} thousand years · 1 M☉: ${tauGyr(1).toFixed(2)} Gyr · 0.1 M☉: ${tauGyr(0.1).toFixed(0)} Gyr, which is ${(tauGyr(0.1)/13.8).toFixed(0)}× the age of the universe · local d ln tau / d ln M = ${((Math.log(tauGyr(2))-Math.log(tauGyr(0.5)))/(Math.log(2)-Math.log(0.5))).toFixed(2)}`);

console.log('\n=== 6-8. The turnoff is a clock, and the ratio is not a number ===\n');

ok('the turnoff — the mass whose lifetime equals the population`s age — found by bisection on the clock itself and not from a fitted formula. At ten billion years it is 1.01 solar masses, which is why the Sun is the textbook example of a star sitting at its own turnoff, and reading a cluster`s turnoff IS reading its age',
  Math.abs(turnoff(10) - 1.012) < 0.01 && Math.abs(turnoff(13.8) - 0.909) < 0.01
  && Math.abs(turnoff(1) - 2.227) < 0.02 && turnoff(0.01) > 13 && turnoff(0.01) < 15,
  `10 Myr → ${turnoff(0.01).toFixed(3)} · 1 Gyr → ${turnoff(1).toFixed(3)} · 10 Gyr → ${turnoff(10).toFixed(3)} · 13.8 Gyr → ${turnoff(13.8).toFixed(3)} M☉`);

const M10 = ML(10, 'salpeter');
ok('the mass-to-light ratio of a whole population: the mass of everything ever born over the light of everything still burning. At ten billion years with a Salpeter function it is 9.4 in solar units. This is the quantity the galaxy laboratory calls its largest uncertainty and exposes as a knob, and until now there was nothing in this atlas to import',
  Math.abs(M10.ml - 9.45) < 0.15,
  `M/L = ${M10.ml.toFixed(3)} at 10 Gyr · turnoff ${M10.mto.toFixed(3)} M☉`);

ok('AND IT MOVES BY A FACTOR OF SIXTY ACROSS THE AGES OF REAL POPULATIONS — 0.19 at a hundred million years, 12 at thirteen billion. That is the whole result: THERE IS NO SUCH NUMBER as the mass-to-light ratio. Choosing one is choosing an age, and a rotation-curve decomposition that quotes a ratio has quoted an age whether or not it said so',
  (() => { const a = ML(0.1, 'salpeter').ml, b = ML(13.8, 'salpeter').ml;
    return Math.abs(a - 0.191) < 0.01 && Math.abs(b - 12.01) < 0.2 && b / a > 55 && b / a < 70; })(),
  `0.1 Gyr → ${ML(0.1,'salpeter').ml.toFixed(3)} · 1 Gyr → ${ML(1,'salpeter').ml.toFixed(3)} · 10 Gyr → ${ML(10,'salpeter').ml.toFixed(3)} · 13.8 Gyr → ${ML(13.8,'salpeter').ml.toFixed(3)} · a factor of ${(ML(13.8,'salpeter').ml/ML(0.1,'salpeter').ml).toFixed(1)}`);

console.log('\n=== 9-11. Three more things that move it ===\n');

ok('which initial mass function you believe is worth 44 per cent, because the light comes from the top of the distribution and the mass from the bottom, and the two prescriptions disagree about the bottom. Kroupa flattens below half a solar mass, which removes mass that was never producing light, so its ratio is lower',
  (() => { const s = ML(10, 'salpeter').ml, k = ML(10, 'kroupa').ml;
    return s / k > 1.35 && s / k < 1.55 && k < s; })(),
  `Salpeter ${ML(10,'salpeter').ml.toFixed(3)} · Kroupa ${ML(10,'kroupa').ml.toFixed(3)} · ratio ${(ML(10,'salpeter').ml/ML(10,'kroupa').ml).toFixed(3)}`);

ok('and the dead stars are a seventh of the mass at thirteen billion years and carry no light at all. Forgetting the remnants — white dwarfs, neutron stars, black holes — is the commonest way to get this wrong and it understates the ratio by 14 per cent there',
  Math.abs(ML(13.8, 'salpeter').remnantFrac - 0.142) < 0.01
  && Math.abs(ML(13.8, 'salpeter').ml / ML(13.8, 'salpeter').mlNoRem - 1 / (1 - 0.142)) < 0.02,
  `remnants are ${(100*ML(13.8,'salpeter').remnantFrac).toFixed(1)}% of the mass · with them ${ML(13.8,'salpeter').ml.toFixed(3)}, without ${ML(13.8,'salpeter').mlNoRem.toFixed(3)}`);

ok('the quadrature does NOT converge to machine precision and the measured figure is one and a half per cent between five hundred points and thirty-two thousand, not the tenth of a per cent this check first claimed. The integrand has kinks at the mass-luminosity breakpoints and at the turnoff, so refining the grid moves the answer by where the sample points land relative to those corners — five hundred points is 1.6 per cent low, and from four thousand up it is settled to five hundred parts per million. That is the real convergence behaviour of a piecewise integrand and it is published rather than smoothed, because a check asserting 1e-12 here would be a check that had not looked',
  (() => { const a = ML(10, 'salpeter', 500).ml, b = ML(10, 'salpeter', 4000).ml, c = ML(10, 'salpeter', 32000).ml;
    const spread = Math.max(a, b, c) / Math.min(a, b, c) - 1;
    return spread > 5e-3 && spread < 3e-2 && Math.abs(b / c - 1) < 1e-3; })(),
  `N = 500, 4000, 32000 → ${ML(10,'salpeter',500).ml.toFixed(6)}, ${ML(10,'salpeter',4000).ml.toFixed(6)}, ${ML(10,'salpeter',32000).ml.toFixed(6)} · spread ${(1e6*(Math.max(ML(10,'salpeter',500).ml,ML(10,'salpeter',4000).ml,ML(10,'salpeter',32000).ml)/Math.min(ML(10,'salpeter',500).ml,ML(10,'salpeter',4000).ml,ML(10,'salpeter',32000).ml)-1)).toFixed(0)} ppm`);

console.log('\n=== 12. And why the published number is a bound ===\n');

ok('THE PUBLISHED RATIO IS AN UPPER BOUND, and the size of what is missing is measured rather than described. It counts only main-sequence light, and every star that leaves the sequence brightens before it dies. Model that with a giant window of a tenth of the turnoff lifetime and a hundredfold brightening — both of which sound perfectly reasonable — and the giants outshine the ENTIRE main sequence by a factor of eight, dropping the ten-billion-year ratio from 9.4 to about 1.0. Observed old populations sit between 2 and 5, so any parameter pair landing there was chosen to land there. That swing is why the atlas ships this model switched off and publishes the bound',
  (() => {
    const age = 10, kind = 'salpeter', n = 4000, lo = 0.1, hi = 100;
    const mto = turnoff(age), dx = (Math.log(hi) - Math.log(lo)) / n;
    let msLight = 0, mass = 0;
    for (let i = 0; i < n; i++) { const m = Math.exp(Math.log(lo) + dx * (i + 0.5));
      const w = imf(m, kind) * m * dx;
      if (m <= mto) { msLight += w * L(m); mass += w * m; } else mass += w * remnant(m); }
    const window = 0.10 * tauGyr(mto);
    const mHi = turnoff(Math.max(1e-9, age - window));
    let nG = 0;
    for (let i = 0; i < n; i++) { const m = Math.exp(Math.log(lo) + dx * (i + 0.5));
      if (m > mto && m <= mHi) nG += imf(m, kind) * m * dx; }
    const gLight = nG * 100 * L(mto);
    const corrected = mass / (msLight + gLight);
    return gLight / msLight > 6 && gLight / msLight < 11
      && corrected < 1.5 && ML(10, 'salpeter').ml / corrected > 7; })(),
  (() => {
    const age = 10, kind = 'salpeter', n = 4000, lo = 0.1, hi = 100;
    const mto = turnoff(age), dx = (Math.log(hi) - Math.log(lo)) / n;
    let msLight = 0, mass = 0;
    for (let i = 0; i < n; i++) { const m = Math.exp(Math.log(lo) + dx * (i + 0.5));
      const w = imf(m, kind) * m * dx;
      if (m <= mto) { msLight += w * L(m); mass += w * m; } else mass += w * remnant(m); }
    const window = 0.10 * tauGyr(mto), mHi = turnoff(Math.max(1e-9, age - window));
    let nG = 0;
    for (let i = 0; i < n; i++) { const m = Math.exp(Math.log(lo) + dx * (i + 0.5));
      if (m > mto && m <= mHi) nG += imf(m, kind) * m * dx; }
    const gLight = nG * 100 * L(mto);
    return `giant light / main-sequence light = ${(gLight/msLight).toFixed(2)} · M/L falls from ${ML(10,'salpeter').ml.toFixed(2)} to ${(mass/(msLight+gLight)).toFixed(2)}, a factor of ${(ML(10,'salpeter').ml/(mass/(msLight+gLight))).toFixed(1)} · observed old populations: 2 to 5`; })());

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
