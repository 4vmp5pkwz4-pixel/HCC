#!/usr/bin/env node
/* ============================================================================
   WHAT A STAR LOSES WHILE IT BURNS

   Every lifetime in this atlas is computed as if a star kept its mass. It does
   not. The topic census returned the phrase "mass loss" zero times before this,
   so the nuclear clock, the turnoff mass, and the near-coincidence built on the
   turnoff all rest on an assumption nothing here had ever stated.

   THE FIRST THING CHECKED IS A REFUSAL. The obvious instrument is an empirical
   mass-loss rate, and the obvious instrument is wrong here: Nieuwenhuijzen-de
   Jager is calibrated on luminous supergiants, and asked about the Sun it
   returns a rate six orders of magnitude too high — which integrated over a
   main-sequence lifetime says the Sun sheds a hundred and twenty times itself.
   That is recorded as a measurement, not as a footnote, because the number
   looked plausible for exactly as long as it took to divide it by the star.

   So the laboratory uses a BOUND instead: a radiatively driven wind cannot
   carry away more momentum than the photons pushing it deliver. No fitted
   constant appears in it anywhere.

   This file shares no code with the atlas. Every constant is written out here,
   and the last check reads index.html so the agreement is between two
   authorities rather than one authority and its own echo.

   FOURTEEN THINGS ARE CHECKED.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const C = 2.99792458e8, G = 6.67430e-11;
const MSUN = 1.98892e30, RSUN = 6.957e8, LSUN = 3.828e26, YR = 3.15576e7;
const EPS = 0.007, FCORE = 0.1;

const ceiling = (L, v) => L * LSUN / (C * v) * YR / MSUN;        /* Msun/yr */
const efficiency = (mdot, L, v) => mdot / ceiling(L, v);
const lumP = (m, p) => m < 0.43 ? 0.23 * Math.pow(m, 2.3) : m < 2 ? Math.pow(m, 4) : 1.4 * Math.pow(m, p);
const lum = m => lumP(m, 3.5);
const rad = m => m < 1 ? Math.pow(m, 0.8) : Math.pow(m, 0.57);
const vesc = m => Math.sqrt(2 * G * m * MSUN / (rad(m) * RSUN));
const vinf = m => 2.6 * vesc(m);
const naiveLifeP = (m, p) => EPS * FCORE * m * MSUN * C * C / (lumP(m, p) * LSUN) / YR;
const naiveLife = m => naiveLifeP(m, 3.5);
const closedFraction = (f, v) => f * EPS * FCORE * C / v;

/* the integration, written out independently of the atlas's */
/* The step is sized from the uncorrected lifetime so that every mass is
   integrated at the same relative resolution. A step that GROWS geometrically
   compounds — the first version of this ran the step out to ten billion years
   within fifty iterations and returned a 20 per cent lifetime correction for a
   20 Msun star where the true answer is 2. It was caught because the check
   below asserts the correction is SMALL, and a check that only asserted "longer
   than the naive lifetime" would have passed the broken integration. */
function integrate(m0, f, opt) {
  const o = opt || {};
  const p = (o.exponent == null ? 3.5 : o.exponent);
  const coreShrinks = !!o.coreShrinks;   /* does the wind reach the fuel? */
  const N = o.steps || 20000;
  const dt = Math.max(1, naiveLifeP(m0, p) * 2 / N);
  let m = m0, burned = 0, t = 0, n = 0;
  while (n < N * 4 && m > 0.08) {
    const fuel = EPS * FCORE * (coreShrinks ? m : m0);
    if (burned >= fuel) break;
    const L = lumP(m, p);
    burned += L * LSUN * dt * YR / (MSUN * C * C);
    m -= f * L * LSUN / (C * vinf(m)) * YR / MSUN * dt;
    t += dt; n++;
  }
  return { years: t, lost: m0 - m, fraction: (m0 - m) / m0 };
}
/* the slope of the shed fraction against mass, MEASURED rather than quoted */
const shedSlope = f => {
  const a = integrate(20, f).fraction, b = integrate(120, f).fraction;
  return Math.log(b / a) / Math.log(120 / 20);
};

console.log('\n=== 1-2. The instrument that does NOT work, measured rather than assumed ===\n');

const njRate = m => Math.pow(10, -7.93 + 1.64 * Math.log10(lum(m)) + 0.16 * Math.log10(m) + 0.81 * Math.log10(rad(m)));

ok('THE OBVIOUS EMPIRICAL RELATION IS WRONG FOR THIS JOB AND THE ERROR IS ENORMOUS. Nieuwenhuijzen-de Jager is fitted on luminous supergiants; asked about the Sun it returns 1.2e-8 solar masses a year against a measured 2e-14 — nearly six orders of magnitude. This is checked, not asserted, because a rate is a small number either way and nothing about its appearance says it is wrong',
  (() => { const r = njRate(1); return r / 2e-14 > 1e5 && r / 2e-14 < 1e7; })(),
  `the relation gives ${njRate(1).toExponential(2)} Msun/yr for the Sun against a measured 2e-14 — a factor of ${(njRate(1) / 2e-14).toExponential(1)}`);

ok('and integrated over a main-sequence lifetime that error stops being abstract: it says the Sun sheds more than a HUNDRED TIMES ITSELF while sitting quietly on the main sequence. An instrument whose output exceeds its own subject by two orders of magnitude has left its range, and the refusal to use it is recorded here as a measurement',
  (() => { const shed = njRate(1) * naiveLife(1); return shed > 50 && shed < 500; })(),
  `${(njRate(1) * naiveLife(1)).toFixed(0)} solar masses shed by a one-solar-mass star — the relation is outside its calibration by so far that the answer is not even the right sign of absurd`);

console.log('\n=== 3-6. A bound instead of a fit ===\n');

ok('THE CEILING HAS NO FITTED CONSTANT IN IT. A photon carries momentum equal to its energy over c, so a radiatively driven wind cannot carry away more than L/c, and dividing by the terminal speed turns that force into a mass per unit time. For a 40 solar-mass O star it comes to 5.74e-6 solar masses a year',
  Math.abs(ceiling(5.67e5, 2.0e6) - 5.744e-6) / 5.744e-6 < 0.01,
  `${ceiling(5.67e5, 2.0e6).toExponential(4)} Msun/yr from L, c and v_inf alone`);

ok('a real O-star wind spends about a sixth of it. That is the number this laboratory exists to report: line driving is efficient but not perfectly so, and 0.17 is a measurement of how much of the available photon momentum a real wind actually collects',
  (() => { const e = efficiency(1e-6, 5.67e5, 2.0e6); return e > 0.1 && e < 0.3; })(),
  `an observed 1e-6 Msun/yr is ${efficiency(1e-6, 5.67e5, 2.0e6).toFixed(3)} of the ceiling`);

ok('AND THE SUN SPENDS FOUR PARTS IN TEN THOUSAND OF ITS OWN, which is the ceiling correctly failing to constrain it: the solar wind is thermally driven, not radiatively, so a radiative bound has almost nothing to say about it. A laboratory that showed only the stars its bound describes would be showing only where it works',
  (() => { const e = efficiency(2e-14, 1, 4.0e5); return e > 1e-4 && e < 1e-3; })(),
  `the Sun runs at ${efficiency(2e-14, 1, 4.0e5).toExponential(2)} of its radiative ceiling`);

ok('ETA CARINAE EXCEEDS THE LIMIT BY A FACTOR OF FIVE, and that is the physics rather than an error. The bound is the SINGLE-scattering bound; a photon absorbed and re-emitted on its way out of an optically thick wind delivers its momentum more than once, so the ceiling is simply the wrong ceiling for that object. A bound that is exceeded, with the excess as the content, is the same shape as the Eddington limit two laboratories over',
  (() => { const e = efficiency(1e-3, 5e6, 5.0e5); return e > 3 && e < 8; })(),
  `${efficiency(1e-3, 5e6, 5.0e5).toFixed(2)} times the single-scattering limit — the multiple-scattering regime`);

console.log('\n=== 7-9. The luminosity cancels ===\n');

ok('THE FRACTION A STAR SHEDS DOES NOT DEPEND ON ITS LUMINOSITY, and the cancellation is exact rather than approximate: the loss rate goes as L and the lifetime goes as 1/L, so the product keeps neither. What survives is the wind efficiency, the nuclear efficiency, the core fraction and c over the terminal speed — four numbers, not one of them the star',
  (() => { const a = closedFraction(0.17, 2.0e6);
    /* the same expression at a luminosity a million times larger, by construction */
    return Math.abs(a - 0.01784) < 1e-4; })(),
  `f eps f_core c/v_inf = ${(100 * closedFraction(0.17, 2.0e6)).toFixed(3)} per cent, with no L and no M in the expression`);

ok('and the closed form is checked against an INDEPENDENT NUMERICAL INTEGRATION rather than against itself: stepping the wind and the fuel burn together from twenty to a hundred and twenty solar masses returns the same fraction at every mass, to the accuracy of the stepping',
  (() => {
    const fracs = [20, 40, 60, 85, 120].map(m => integrate(m, 0.17).fraction);
    /* v_inf follows the escape speed, so there IS a weak residual slope; the
       claim is that it is weak, not that it is zero */
    const lo = Math.min(...fracs), hi = Math.max(...fracs);
    return hi / lo < 2.0 && lo > 0.004 && hi < 0.03;
  })(),
  `integrated fractions: ${[20, 40, 60, 85, 120].map(m => (100 * integrate(m, 0.17).fraction).toFixed(2)).join(' · ')} per cent across a factor of six in mass`);

ok('the residual slope is NOT zero and this file says which way it runs rather than rounding it to flat: v_inf follows the escape speed, which goes as roughly the mass to the power 0.215, so a heavier star has a faster wind and therefore sheds a SMALLER fraction of itself. Claiming exact independence would be claiming more than the algebra gives',
  (() => { const sl = shedSlope(0.17);
    /* v_inf goes as sqrt(M/R) with R ~ M^0.57, so the shed fraction should go as
       M^-0.215. Asserting the SLOPE rather than a ratio band is what makes this
       sensitive to the radius exponent at all: a band wide enough to be safe was
       wide enough to accept M^0.50 as well, which is a check that measures the
       direction of an effect and not its size. */
    return sl < -0.19 && sl > -0.24; })(),
  `the shed fraction goes as M^${shedSlope(0.17).toFixed(4)}, against the M^-0.215 that sqrt(M/R) with R ~ M^0.57 predicts`);

console.log('\n=== 10-12. The correction, and the atlas read back ===\n');

ok('THE WIND LENGTHENS THE MAIN SEQUENCE RATHER THAN SHORTENING IT, which is the opposite of what "losing fuel" suggests and is the reason this laboratory is worth having. A wind takes the ENVELOPE; the core keeps its hydrogen. So the fuel is unchanged while the luminosity falls, and a dimmer star burns its core more slowly',
  (() => { const r = integrate(40, 0.17); return r.years > naiveLife(40) && r.years / naiveLife(40) < 1.10; })(),
  `40 Msun: ${integrate(40, 0.17).years.toExponential(3)} yr against ${naiveLife(40).toExponential(3)} held fixed — ${(100 * (integrate(40, 0.17).years / naiveLife(40) - 1)).toFixed(1)} per cent LONGER`);

ok('and the effect is small, which is also worth stating plainly: at a realistic efficiency the correction is a couple of per cent, so every lifetime this atlas already published is right to within that. The finding is that the assumption existed and was never written down, not that the numbers were wrong',
  (() => [20, 40, 60, 120].every(m => { const r = integrate(m, 0.17).years / naiveLife(m); return r > 1.0 && r < 1.12; }))(),
  `ratios: ${[20, 40, 60, 120].map(m => (integrate(m, 0.17).years / naiveLife(m)).toFixed(4)).join(' · ')}`);

ok('AND THE ATLAS IS RUNNING THIS BOUND. This file wrote the ceiling out from scratch; this check opens index.html and confirms the same expression is there — L over c over v_inf, and the terminal speed at 2.6 times the escape speed — so the agreement above is between two authorities and not one authority quoting itself',
  (() => { const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    return /windMomentumCeiling=\(Lsun,vinf\)=>\(vinf>0\)\?Lsun\*WIND_LSUN\/\(WIND_C\*vinf\)/.test(src)
        && /const WIND_VINF_OVER_VESC=2\.6;/.test(src)
        && /windFractionLost=\(f,eps,fcore,vinf\)=>\(vinf>0\)\?f\*eps\*fcore\*WIND_C\/vinf/.test(src); })(),
  'the ceiling, the 2.6 escape-speed ratio and the cancelled closed form are all present in the atlas source');

console.log('\n=== 13-14. Two things this file was blind to until it was asked ===\n');

/* Mutation testing found the mass-luminosity exponent and the core-fuel
   assumption both invisible to every check above. Neither was a hole to paper
   over: one is the headline result being true, and the other is an explanation
   that was not doing the work it claimed. Both are now asserted directly. */

ok('THE MASS-LUMINOSITY EXPONENT DOES NOT MATTER, AND THAT IS THE POINT RATHER THAN A GAP. Changing the relation from L ~ M^3.5 to M^3.0 — a different star entirely, with lifetimes that move by a factor of three — leaves the shed fraction alone, because the luminosity that sets the loss rate is the same luminosity that sets the clock. This was found by mutation: the exponent could be changed without failing anything above, which is the cancellation being real rather than a check being asleep',
  (() => {
    const a = integrate(40, 0.17, { exponent: 3.5 });
    const b = integrate(40, 0.17, { exponent: 3.0 });
    const livesDiffer = naiveLifeP(40, 3.0) / naiveLifeP(40, 3.5) > 2;
    return livesDiffer && Math.abs(b.fraction / a.fraction - 1) < 0.02;
  })(),
  `lifetime moves by a factor of ${(naiveLifeP(40, 3.0) / naiveLifeP(40, 3.5)).toFixed(1)} while the shed fraction moves from `
  + `${(100 * integrate(40, 0.17, { exponent: 3.5 }).fraction).toFixed(3)} to `
  + `${(100 * integrate(40, 0.17, { exponent: 3.0 }).fraction).toFixed(3)} per cent`);

ok('AND THE LENGTHENING DOES NOT ACTUALLY DEPEND ON THE CORE KEEPING ITS FUEL, which is not what the prose above claims. Let the wind eat the fuel too — fuel proportional to the CURRENT mass rather than the birth mass — and the main sequence still gets longer, because the luminosity falls as M^3.5 while the fuel falls as M^1, so the clock slows faster than the tank drains. The envelope-versus-core distinction is real physics and it is NOT what carries this result, and saying otherwise would have been an explanation that sounded right and did no work',
  (() => {
    const keep = integrate(40, 0.17, { coreShrinks: false });
    const eat  = integrate(40, 0.17, { coreShrinks: true });
    return eat.years > naiveLife(40) && keep.years > eat.years
        && (eat.years / naiveLife(40)) > 1.0 && (eat.years / naiveLife(40)) < 1.10;
  })(),
  `fuel fixed at birth: ${(integrate(40, 0.17, { coreShrinks: false }).years / naiveLife(40)).toFixed(4)}x · `
  + `fuel tracking the current mass: ${(integrate(40, 0.17, { coreShrinks: true }).years / naiveLife(40)).toFixed(4)}x — both longer than 1`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
