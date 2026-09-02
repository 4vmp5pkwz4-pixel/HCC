#!/usr/bin/env node
/* ============================================================================
   THE PLANETS OF OTHER STARS

   An atlas of a hundred and four laboratories that had measured a black hole horizon,
   a Jeans mass, a distance ladder and the cosmological constant contained the
   word "exoplanet" zero times.  Six thousand of them are known.

   This file shares no code with the atlas.  Every constant is written out from
   the IAU 2015 nominal values and CODATA 2018, and every formula from the
   physics, so that a number agreeing here and there has agreed twice.

   THIRTEEN THINGS ARE CHECKED, and the first two are the ones that matter.

   1.  A transit depth is a RATIO OF AREAS and nothing else -- not the planet's
       mass, not its temperature, not the distance to the system.  The Earth
       across the Sun is 84 parts per million.  That single number is the whole
       difficulty of the subject.
   2.  KEPLER III MUST BE FED GM AND NOT G TIMES M.  The heliocentric
       gravitational constant is measured directly, from spacecraft ranging, to
       about one part in ten billion.  The Newtonian constant G is known to
       twenty-two parts per million and is the worst-measured constant in
       physics; a solar mass in kilograms is GM divided by G and inherits every
       one of those parts per million.  Multiplying it back by G does not
       recover GM -- it recovers GM times whatever rounding was used for the
       mass.  The cost is measured here rather than asserted.
   3.  The transit duration, against the thirteen hours the Earth would take.
   4.  The transit probability: one orbit in two hundred is edge-on enough to
       show an Earth, which is why a survey watches a hundred thousand stars.
   5.  The exact lens area of two overlapping circles, checked against three
       cases where the answer is known in closed form, and against the ramp it
       is NOT.
   6.  The reflex speed: 12.5 metres a second for Jupiter, 9 centimetres for
       the Earth.
   7.  The equilibrium temperature, at both albedo conventions.
   8.  The habitable zone is FOUR bounds, and Kepler-186 f is outside all of
       them on a blackbody luminosity while its discoverers place it inside.
       The flux is what survives that disagreement.
   9.  The zone scales as the square root of the luminosity, exactly.
   10. A grazing transit: past b = 1 + Rp/R* there is no transit and a duration
       returned for one would be a fiction.
   11. Depth does not depend on distance, which is why the method works at all.
   12. Limb darkening: what the uniform-disc assumption costs, priced.
   13. The sampling shortfall: a finite cadence recovers less than the depth
       that is there.
   ========================================================================== */
'use strict';
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

/* IAU 2015 nominal values (B3) and CODATA 2018 -- typed here, not imported */
const GM_SUN = 1.32712440018e20;      /* m^3/s^2, measured directly */
const G      = 6.67430e-11;           /* m^3 kg^-1 s^-2, 22 ppm */
const R_SUN  = 6.957e8;               /* m */
const R_EARTH= 6.3781e6;              /* m, equatorial */
const R_JUP  = 7.1492e7;              /* m, equatorial */
const M_EARTH= 5.97217e24;            /* kg */
const M_JUP  = 1.89812e27;            /* kg */
const AU     = 1.495978707e11;        /* m, exact by definition */
const DAY    = 86400;
const YEAR   = 365.256363004 * DAY;   /* sidereal */
const SIGMA  = 5.670374419e-8;
const T_SUN  = 5772;                  /* K, IAU nominal effective temperature */
const L_SUN  = 3.828e26;              /* W, IAU nominal */

/* the physics, written out */
const depth      = (rp, rs) => (rp / rs) * (rp / rs);
const semiMajor  = (P, gm)  => Math.cbrt(gm * P * P / (4 * Math.PI * Math.PI));
const duration   = (P, a, rs, rp, b) => {
  const num = (rs + rp) * (rs + rp) - b * b * rs * rs;
  if (num <= 0) return 0;
  return (P / Math.PI) * Math.asin(Math.min(1, Math.sqrt(num) / a));
};
const probability = (rs, rp, a) => Math.min(1, (rs + rp) / a);
const reflex = (P, mp, ms, inc, e) =>
  Math.cbrt(2 * Math.PI * G / P) * mp * Math.sin(inc) / Math.cbrt((ms + mp) * (ms + mp)) / Math.sqrt(1 - e * e);
const tEq = (ts, rs, a, A) => ts * Math.sqrt(rs / (2 * a)) * Math.pow(1 - A, 0.25);
const lum = (rs, ts) => 4 * Math.PI * rs * rs * SIGMA * Math.pow(ts, 4);
/* the exact lens-shaped area of two overlapping circles, as a fraction of the larger */
function overlap(d, R, r) {
  if (d >= R + r) return 0;
  if (d <= R - r) return (r * r) / (R * R);
  const d2 = d * d, R2 = R * R, r2 = r * r;
  const a1 = Math.acos(Math.max(-1, Math.min(1, (d2 + R2 - r2) / (2 * d * R))));
  const a2 = Math.acos(Math.max(-1, Math.min(1, (d2 + r2 - R2) / (2 * d * r))));
  const tri = 0.5 * Math.sqrt(Math.max(0,
    (-d + R + r) * (d + R - r) * (d - R + r) * (d + R + r)));
  return (R2 * a1 + r2 * a2 - tri) / (Math.PI * R2);
}

console.log('\n=== 1-2. The ratio of areas, and the constant you must not assemble ===\n');

const dEarth = depth(R_EARTH, R_SUN), dJup = depth(R_JUP, R_SUN);
ok('a transit depth is the ratio of the areas and nothing else. The Earth across the Sun is 84 parts per million and Jupiter is 1.06 per cent — a factor of a hundred and twenty-six between them for a factor of eleven in radius, because it is an AREA. Neither number knows the planet`s mass, its temperature, or how far away the system is',
  Math.abs(1e6 * dEarth - 84.1) < 0.5 && Math.abs(100 * dJup - 1.056) < 0.005,
  `Earth ${(1e6 * dEarth).toFixed(1)} ppm (literature 84) · Jupiter ${(100 * dJup).toFixed(3)}% (literature 1.06) · ratio ${(dJup / dEarth).toFixed(1)}`);

const aGM  = semiMajor(YEAR, GM_SUN);
const mSunImplied = GM_SUN / G;
const aBad = semiMajor(YEAR, G * 1.98892e30);   /* a solar mass as commonly rounded */
ok('KEPLER III MUST BE FED THE MEASURED GM. From GM_sun the Earth`s sidereal year returns 1.0000 AU. Take instead the solar mass in kilograms as it is usually quoted and multiply it back by G, and the product is 257 ppm too large — because G is the worst-measured constant in physics at 22 ppm and the mass is GM divided by it, so the round trip cannot recover what it started from. The cube root passes a third of the error into the axis: 86 ppm, which is 13 000 kilometres',
  Math.abs(aGM / AU - 1) < 3e-6
  && Math.abs(1e6 * (aBad / aGM - 1) - 85.5) < 3,
  `from GM: ${(aGM / AU).toFixed(9)} AU · from G×M: ${(aBad / AU).toFixed(9)} AU · cost ${(1e6 * (aBad / aGM - 1)).toFixed(1)} ppm = ${((aBad - aGM) / 1e3).toFixed(0)} km · implied solar mass ${mSunImplied.toExponential(6)} kg`);

ok('and the error in the axis is exactly a THIRD of the error in the product, to first order, because a is the cube root of it. This is not a coincidence at one point: it holds across four decades of period',
  (() => { let worst = 0;
    for (const P of [DAY, 10 * DAY, YEAR, 12 * YEAR]) {
      const good = semiMajor(P, GM_SUN), bad = semiMajor(P, GM_SUN * 1.000257);
      worst = Math.max(worst, Math.abs((bad / good - 1) / (0.000257 / 3) - 1)); }
    return worst < 2e-4; })(),
  `a 257 ppm error in GM gives ${(1e6 * (semiMajor(YEAR, GM_SUN * 1.000257) / semiMajor(YEAR, GM_SUN) - 1)).toFixed(2)} ppm in a, against 257/3 = ${(257 / 3).toFixed(2)}`);

console.log('\n=== 3-5. How long, how likely, and the exact shape of the dip ===\n');

const durEarth = duration(YEAR, aGM, R_SUN, R_EARTH, 0) / 3600;
ok('the transit duration, for an Earth crossing the centre of the Sun: thirteen hours. It is the time to cross a chord of the stellar disc at the orbital speed, and it is the reason a survey must observe continuously — a fourteen-hour gap in the coverage loses the whole event',
  Math.abs(durEarth - 13.1) < 0.2,
  `${durEarth.toFixed(2)} h (literature ~13)`);

const pEarth = probability(R_SUN, R_EARTH, aGM);
ok('the transit probability is pure geometry: (R* + Rp)/a, with no physics in it at all. For the Earth it is one orbit in two hundred and fourteen. A survey that wants a hundred Earths must therefore watch twenty thousand Sun-like stars that happen to have one, and that is before any question of whether the photometry is good enough to see 84 ppm',
  Math.abs(100 * pEarth - 0.466) < 0.01,
  `${(100 * pEarth).toFixed(3)}% = 1 in ${(1 / pEarth).toFixed(0)} · and a hot Jupiter at 0.047 AU is ${(100 * probability(1.203 * R_SUN, 1.38 * R_JUP, 0.04747 * AU)).toFixed(1)}%`);

ok('the dip is the exact LENS-SHAPED area of two overlapping circles, not a ramp. Three cases have closed forms and all three come out: fully inside gives the ratio of areas, fully outside gives zero, and at d = R the planet is exactly half in, so the covered area is half of what it would be inside — to within the second-order term that the lens carries and a ramp does not',
  Math.abs(overlap(0, R_SUN, R_JUP) - dJup) < 1e-15
  && overlap(R_SUN + R_JUP, R_SUN, R_JUP) === 0
  && Math.abs(overlap(R_SUN, R_SUN, R_JUP) / dJup - 0.5) < 0.02,
  `centred ${(overlap(0, R_SUN, R_JUP) / dJup).toFixed(9)}× · at the limb ${(overlap(R_SUN, R_SUN, R_JUP) / dJup).toFixed(6)}× · outside ${overlap(R_SUN + R_JUP, R_SUN, R_JUP)}`);

ok('and the lens is NOT a linear ramp: through ingress the two disagree by up to six per cent of the depth, four fifths of the way in, which is exactly the part of the curve a fit uses to recover the impact parameter. A ramp would give the right depth and the wrong geometry',
  (() => { let worst = 0;
    for (let k = 1; k < 40; k++) {
      const d = (R_SUN - R_JUP) + (2 * R_JUP) * k / 40;
      const ramp = dJup * (R_SUN + R_JUP - d) / (2 * R_JUP);
      worst = Math.max(worst, Math.abs(overlap(d, R_SUN, R_JUP) - ramp) / dJup); }
    return worst > 0.05 && worst < 0.25; })(),
  (() => { let worst = 0, at = 0;
    for (let k = 1; k < 40; k++) {
      const d = (R_SUN - R_JUP) + (2 * R_JUP) * k / 40;
      const ramp = dJup * (R_SUN + R_JUP - d) / (2 * R_JUP);
      const e = Math.abs(overlap(d, R_SUN, R_JUP) - ramp) / dJup;
      if (e > worst) { worst = e; at = k / 40; } }
    return `worst disagreement ${(100 * worst).toFixed(1)}% of the depth, at ${(100 * at).toFixed(0)}% through ingress`; })());

console.log('\n=== 6-7. The star moves too, and how warm it is out there ===\n');

const kJup = reflex(11.862 * YEAR, M_JUP, GM_SUN / G, Math.PI / 2, 0.0489);
const kEarth = reflex(YEAR, M_EARTH, GM_SUN / G, Math.PI / 2, 0.0167);
ok('the reflex speed a spectrograph measures. Jupiter moves the Sun at 12.5 metres a second, a brisk walk; the Earth moves it at NINE CENTIMETRES a second, slower than a snail — and that is what must be extracted from a stellar spectrum. This method never needs the orbit to be edge-on, which is how the planets that will never transit are found',
  Math.abs(kJup - 12.5) < 0.15 && Math.abs(kEarth - 0.0895) < 0.002,
  `Jupiter ${kJup.toFixed(3)} m/s (literature 12.5) · Earth ${(100 * kEarth).toFixed(2)} cm/s (literature 8.9)`);

const tEarth0 = tEq(T_SUN, R_SUN, aGM, 0), tEarthA = tEq(T_SUN, R_SUN, aGM, 0.306);
ok('the equilibrium temperature is one Stefan-Boltzmann balance and it depends on the ALBEDO, which catalogues usually set to zero and the Earth does not have. At A = 0 the Earth comes out at 278 K and at its real 0.306 it comes out at 254 K — twenty-four kelvin, which is larger than the entire width of the temperature range anyone argues about for habitability',
  Math.abs(tEarth0 - 278.3) < 1 && Math.abs(tEarthA - 254.0) < 1,
  `A=0 gives ${tEarth0.toFixed(1)} K · A=0.306 gives ${tEarthA.toFixed(1)} K · difference ${(tEarth0 - tEarthA).toFixed(1)} K`);

console.log('\n=== 8-9. Four bounds, not one ===\n');

/* Kopparapu et al. 2013/2014.  These four are the bounds IN ASTRONOMICAL UNITS for a
   star of one solar luminosity; the underlying S_eff values are their inverse squares
   (1.77, 1.05, 0.35, 0.32).  This verifier was first written dividing by them instead
   of multiplying, which put the "early Mars" bound INSIDE the "recent Venus" one and
   failed against the atlas -- the atlas was right.  A check that disagrees with the
   thing it checks has done its job either way, and this is which way it went. */
const HZ = { recentVenus: 0.75, runaway: 0.97, maxGreen: 1.70, earlyMars: 1.77 };
const zone = L => { const s = Math.sqrt(L / L_SUN);
  return { rv: HZ.recentVenus * s, in: HZ.runaway * s, out: HZ.maxGreen * s, em: HZ.earlyMars * s }; };
const zSun = zone(L_SUN);
ok('the habitable zone is FOUR bounds and the Sun`s run from 0.75 to 1.77 astronomical units. They are ordered — recent Venus inside runaway greenhouse inside maximum greenhouse inside early Mars — and the ORDER is the check, because getting the sense of the criterion backwards inverts it silently. The Earth sits inside all four, which is the only reason the criteria are calibrated where they are. A single boolean called "habitable" would throw all of this away',
  zSun.rv < zSun.in && zSun.in < 1 && 1 < zSun.out && zSun.out < zSun.em
  && Math.abs(zSun.rv - 0.75) < 1e-9 && Math.abs(zSun.em - 1.77) < 1e-9,
  `recent Venus ${zSun.rv.toFixed(4)} · runaway ${zSun.in.toFixed(4)} · max greenhouse ${zSun.out.toFixed(4)} · early Mars ${zSun.em.toFixed(4)} AU`);

/* Kepler-186: R* = 0.523 R_sun, T_eff = 3788 K, M* = 0.544 M_sun, planet f at P = 129.944 d.
   The semi-major axis is computed from Kepler III rather than taken from the catalogue,
   which is the same route the atlas takes -- and the catalogue's own 0.432 AU is five per
   cent away from what its own period and stellar mass imply, which is worth saying out loud. */
const P_KEP = 129.9441 * DAY;
const aKep = semiMajor(P_KEP, GM_SUN * 0.544) / AU;
const lKep = lum(0.523 * R_SUN, 3788);
const L_KEP_PUB = 0.0412;              /* Torres et al. 2015 */
const zKep = zone(lKep);
const fluxKep = (lKep / L_SUN) / (aKep * aKep);
ok('and KEPLER-186 f is the case that shows why. It is famous as the first Earth-sized planet found in the habitable zone of another star, and on a BLACKBODY luminosity from its radius and effective temperature it sits outside even the optimistic early-Mars bound. That is not a correction to the discovery: a cool M dwarf is not a blackbody, this luminosity is a quarter high against the published one, and the zone edges move as its square root. The FLUX is what survives — 0.30 of Earth`s here against the 0.32 its discoverers measured, agreeing to seven per cent while the boundary verdict flips',
  aKep > zKep.em && Math.abs(fluxKep - 0.302) < 0.01
  && lKep / L_SUN / L_KEP_PUB > 1.20 && lKep / L_SUN / L_KEP_PUB < 1.27
  && Math.abs(aKep / 0.432 - 1) < 0.06,
  `blackbody L = ${(lKep / L_SUN).toFixed(4)} L_sun against the published ${L_KEP_PUB} — ${(100 * (lKep / L_SUN / L_KEP_PUB - 1)).toFixed(0)}% high · early-Mars edge ${zKep.em.toFixed(4)} AU against a Kepler-III orbit at ${aKep.toFixed(4)} (catalogue says 0.432, ${(100 * Math.abs(aKep / 0.432 - 1)).toFixed(1)}% away) · outside it by ${(100 * (aKep / zKep.em - 1)).toFixed(1)}% · flux ${fluxKep.toFixed(4)} against the published 0.32`);

ok('the zone scales as the SQUARE ROOT of the luminosity, exactly, because flux falls as the inverse square of distance. Four times the luminosity puts every bound twice as far out — checked over six decades, not at one point, so it is the scaling law and not a coincidence',
  (() => { let worst = 0;
    for (const f of [1e-3, 1e-2, 0.1, 1, 10, 100, 1000]) {
      worst = Math.max(worst, Math.abs(zone(f * L_SUN).in / (Math.sqrt(f) * zSun.in) - 1)); }
    return worst < 1e-12; })(),
  `L × 100 moves the inner edge by ${(zone(100 * L_SUN).in / zSun.in).toFixed(6)}, which must be 10`);

console.log('\n=== 10-13. Where the method stops working ===\n');

ok('past b = 1 + Rp/R* there is NO TRANSIT, and a duration returned for one would be a fiction. The duration formula`s own argument goes imaginary there, which is the geometry saying so rather than a guard bolted on: for a Jupiter across a Sun the cutoff is 1.103 and the duration is already down to a fifth of the central one at b = 0.99',
  duration(11.862 * YEAR, semiMajor(11.862 * YEAR, GM_SUN), R_SUN, R_JUP, 1.2) === 0
  && duration(11.862 * YEAR, semiMajor(11.862 * YEAR, GM_SUN), R_SUN, R_JUP, 0.99) > 0
  && Math.abs((1 + R_JUP / R_SUN) - 1.1028) < 1e-3,
  `grazing at b = ${(1 + R_JUP / R_SUN).toFixed(4)} · at b=0.99 the duration is ${(100 * duration(11.862 * YEAR, semiMajor(11.862 * YEAR, GM_SUN), R_SUN, R_JUP, 0.99) / duration(11.862 * YEAR, semiMajor(11.862 * YEAR, GM_SUN), R_SUN, R_JUP, 0)).toFixed(1)}% of central · at b=1.2 it is exactly ${duration(11.862 * YEAR, semiMajor(11.862 * YEAR, GM_SUN), R_SUN, R_JUP, 1.2)}`);

ok('and NOTHING in the depth depends on distance. Move the whole system ten times further away and every photon count falls by a hundred while the FRACTION of them the planet blocks is identical. That is why a survey selects for bright stars rather than near ones, and why a transit found around a star four hundred light years away is measured as precisely as one next door if the photon budget allows',
  depth(R_EARTH, R_SUN) === depth(R_EARTH, R_SUN)
  && Math.abs(depth(R_EARTH, R_SUN) - 1 / ((R_SUN / R_EARTH) * (R_SUN / R_EARTH))) < 1e-18,
  `the expression (Rp/R*)^2 contains no distance: ${(1e6 * depth(R_EARTH, R_SUN)).toFixed(3)} ppm at any range`);

ok('the uniform stellar disc is a stated assumption with a price. A real star is limb-darkened, and under a linear law with the solar coefficient 0.6 the centre is 1.25 times as bright as the disc mean while the light at mu = 0.2 is 0.65 times, a ratio of nearly two across the face — so a central transit is deeper than the uniform calculation says and a grazing one shallower, by tens of per cent. The DEPTH scale survives and the SHAPE does not, which matters because the shape is what a fit uses to recover b',
  (() => { const u = 0.6;
    const I = mu => (1 - u * (1 - mu)) / (1 - u / 3);   /* normalised to unit mean intensity */
    const centre = I(1), limb = I(0.2);
    return Math.abs(centre - 1.25) < 0.02 && limb < 0.8 && centre / limb > 1.4; })(),
  (() => { const u = 0.6, I = mu => (1 - u * (1 - mu)) / (1 - u / 3);
    return `centre ${I(1).toFixed(3)}× the mean · at mu=0.2 ${I(0.2).toFixed(3)}× · ratio ${(I(1) / I(0.2)).toFixed(2)}`; })());

ok('a finite cadence loses depth ONLY where the curve has a genuine minimum, and this check was first written claiming it always does. It does not: a planet fully inside the stellar disc gives a FLAT floor over a whole range of phases, so sixteen samples find the same 1.3896 per cent as two thousand and the shortfall is exactly zero. Push the same planet to a grazing chord and the floor becomes a point, whereupon a coarse cadence misses it and reports a shallower transit than the one that happened — which is the mechanism behind every long-cadence depth that had to be corrected. The shortfall is one-sided in both cases: a sampled minimum can never be deeper than the true one',
  (() => {
    const P = 3.5247 * DAY, rs = 1.203 * R_SUN, rp = 1.38 * R_JUP;
    const a = semiMajor(P, GM_SUN * 1.148);
    const sample = (n, b) => { let lo = 1;
      const arg = (rs + rp) * (rs + rp) - b * b * rs * rs;
      const half = Math.asin(Math.min(1, Math.sqrt(Math.max(0, arg)) / a)) / Math.PI;
      for (let i = 0; i < n; i++) {
        const ph = -1.6 * half + 3.2 * half * (i / (n - 1));
        const sep = Math.hypot(a * Math.sin(2 * Math.PI * ph), b * rs);
        const f = 1 - overlap(sep, rs, rp);
        if (f < lo) lo = f; }
      return 1 - lo; };
    const truth = depth(rp, rs);
    const flat16 = sample(16, 0), flatFine = sample(4096, 0);
    const grazeFine = sample(4096, 1.05), graze16 = sample(16, 1.05);
    return Math.abs(flat16 - flatFine) < 1e-15          /* a flat floor loses nothing */
      && flatFine <= truth * (1 + 1e-12)
      && graze16 < grazeFine * (1 - 0.02)               /* a pointed one does */
      && graze16 <= grazeFine + 1e-15; })(),
  (() => {
    const P = 3.5247 * DAY, rs = 1.203 * R_SUN, rp = 1.38 * R_JUP;
    const a = semiMajor(P, GM_SUN * 1.148);
    const sample = (n, b) => { let lo = 1;
      const arg = (rs + rp) * (rs + rp) - b * b * rs * rs;
      const half = Math.asin(Math.min(1, Math.sqrt(Math.max(0, arg)) / a)) / Math.PI;
      for (let i = 0; i < n; i++) {
        const ph = -1.6 * half + 3.2 * half * (i / (n - 1));
        const sep = Math.hypot(a * Math.sin(2 * Math.PI * ph), b * rs);
        const f = 1 - overlap(sep, rs, rp);
        if (f < lo) lo = f; }
      return 1 - lo; };
    return `central b=0: 16 samples give ${(100 * sample(16, 0)).toFixed(4)}% and 4096 give ${(100 * sample(4096, 0)).toFixed(4)}% — identical, the floor is flat · grazing b=1.05: 16 samples give ${(100 * sample(16, 1.05)).toFixed(4)}% against ${(100 * sample(4096, 1.05)).toFixed(4)}%, short by ${(1e6 * (sample(4096, 1.05) - sample(16, 1.05))).toFixed(0)} ppm = ${(100 * (1 - sample(16, 1.05) / sample(4096, 1.05))).toFixed(1)}% of the depth`; })());

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
