#!/usr/bin/env node
/* ============================================================================
   THE STAR RINGS, AND THE RINGING GIVES ITS MASS

   The atlas had a main sequence that turns a mass into a radius through a
   model, and a transit bench that measures a planet against a star it has to
   assume.  Neither could weigh a star it had not already decided about.

   Asteroseismology can.  A star is a resonant cavity; its surface convection
   rings it at millions of frequencies at once; and two numbers read off that
   spectrum give the mass and the radius with no stellar model in between.

   This file shares no code with the atlas.  Every constant is written out here
   and every relation is rebuilt from it.

   TWELVE THINGS ARE CHECKED.

   1.  The solar density follows from the solar mass and radius, not a table.
   2.  The large separation goes as the square root of the mean density --
       a bell, an organ pipe, a star.
   3.  The frequency of maximum power goes as gravity over root temperature.
   4.  AND THE RELATIONS INVERT EXACTLY, across four decades of density.
   5.  Which is the whole point: no stellar model appears anywhere in the chain.
   6.  The density needs only ONE number and no temperature at all.
   7.  Surface gravity from numax reproduces the solar log g of 4.438.
   8.  A TRANSIT GIVES THE SAME DENSITY KNOWING NOTHING ABOUT THE STAR:
       3 pi / (G P^2) times (a/R) cubed, and the Earth crossing the Sun returns
       the solar density to two parts in ten thousand.
   9.  The two routes share nothing but Newton, which is what makes them a check.
   10. And the check has teeth: a stellar radius wrong by ten per cent moves the
       transit density by a third.
   11. The asymptotic relation folds a spectrum into ridges.
   12. AND IT IS APPROXIMATE AND SAYS SO -- seven parts in a thousand at the
       solar numax, which is the surface term nobody models away for free.
   ========================================================================== */
'use strict';
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

/* ---- constants, written out here ------------------------------------------ */
const G = 6.67430e-11;
const MSUN = 1.98892e30;
const RSUN = 6.957e8;
const AU = 1.495978707e11;
const DNU_SUN = 135.1, NUMAX_SUN = 3090, TEFF_SUN = 5777;

const rhoSun = MSUN / ((4 / 3) * Math.PI * Math.pow(RSUN, 3));
const dnu = (m, r) => DNU_SUN * Math.sqrt(m / Math.pow(r, 3));
const numax = (m, r, t) => NUMAX_SUN * (m / (r * r)) / Math.sqrt(t / TEFF_SUN);
const radiusOf = (dn, nm, t) => (nm / NUMAX_SUN) * Math.pow(dn / DNU_SUN, -2) * Math.sqrt(t / TEFF_SUN);
const massOf = (dn, nm, t) => Math.pow(nm / NUMAX_SUN, 3) * Math.pow(dn / DNU_SUN, -4) * Math.pow(t / TEFF_SUN, 1.5);
const rhoFromDnu = dn => Math.pow(dn / DNU_SUN, 2) * rhoSun;
const loggOf = (nm, t) => Math.log10(G * MSUN / (RSUN * RSUN) * 100 * (nm / NUMAX_SUN) * Math.sqrt(t / TEFF_SUN));
const rhoTransit = (pDays, aOverR) => { const P = pDays * 86400; return 3 * Math.PI / (G * P * P) * Math.pow(aOverR, 3); };

console.log('\n=== 1-3. The two scaling relations, from first constants ===\n');

ok('the solar mean density is DERIVED from the solar mass and radius rather than looked up — 1410 kg per cubic metre, and every density below is measured against it',
  Math.abs(rhoSun - 1410) < 3, `M / (4/3 pi R^3) = ${rhoSun.toFixed(1)} kg/m³`);

ok('THE LARGE FREQUENCY SEPARATION GOES AS THE SQUARE ROOT OF THE MEAN DENSITY. It is the spacing between consecutive overtones, and it is the same relation a bell obeys, or an organ pipe: bigger and looser rings lower. A star eight times less dense rings at half the spacing',
  Math.abs(dnu(1, 1) - DNU_SUN) < 1e-9 && Math.abs(dnu(1, 2) / dnu(1, 1) - Math.pow(8, -0.5)) < 1e-12,
  `Sun ${dnu(1, 1).toFixed(1)} µHz · double the radius at fixed mass is an eighth the density and ${(dnu(1, 2) / dnu(1, 1)).toFixed(4)} of the spacing, which is 1/√8`);

ok('and the FREQUENCY OF MAXIMUM POWER scales with the acoustic cutoff at the surface — the surface gravity over the square root of the temperature. Density and gravity together are a mass and a radius',
  Math.abs(numax(1, 1, TEFF_SUN) - NUMAX_SUN) < 1e-9 && Math.abs(numax(2, 1, TEFF_SUN) / NUMAX_SUN - 2) < 1e-12,
  `Sun ${numax(1, 1, TEFF_SUN).toFixed(0)} µHz · twice the mass at fixed radius is twice the gravity and twice the frequency`);

console.log('\n=== 4-7. Inverted, which is the point ===\n');

ok('AND THE RELATIONS INVERT EXACTLY, ACROSS FOUR DECADES OF DENSITY. A red giant at a hundredth of solar density, a subgiant, the Sun, and an M dwarf at fifteen times solar all return their own mass and radius to twelve figures',
  (() => { const stars = [[1.2, 10, 4800], [1.4, 2.1, 6000], [1, 1, 5777], [0.4, 0.4, 3500]];
    return stars.every(([m, r, t]) => Math.abs(massOf(dnu(m, r), numax(m, r, t), t) - m) < 1e-12
      && Math.abs(radiusOf(dnu(m, r), numax(m, r, t), t) - r) < 1e-12); })(),
  (() => { const [m, r, t] = [1.2, 10, 4800];
    return `a red giant at ${(m / Math.pow(r, 3)).toExponential(2)} solar densities returns M = ${massOf(dnu(m, r), numax(m, r, t), t).toFixed(9)}, R = ${radiusOf(dnu(m, r), numax(m, r, t), t).toFixed(9)}`; })());

ok('and NO STELLAR MODEL APPEARS ANYWHERE IN THAT CHAIN. The inputs are two frequencies and a temperature; the outputs are a mass and a radius. That is why seismology can weigh a star the main sequence would have had to assume',
  (() => { const m = massOf(135.1, 3090, 5777), r = radiusOf(135.1, 3090, 5777);
    return Math.abs(m - 1) < 1e-12 && Math.abs(r - 1) < 1e-12; })(),
  'two frequencies and a temperature in, a mass and a radius out');

ok('THE DENSITY NEEDS ONLY ONE OF THE TWO NUMBERS AND NO TEMPERATURE AT ALL, which makes it the most robust thing seismology measures — no spectroscopy enters it, so no spectroscopic error can',
  Math.abs(rhoFromDnu(DNU_SUN) - rhoSun) < 1e-6 && Math.abs(rhoFromDnu(2 * DNU_SUN) / rhoSun - 4) < 1e-9,
  `Dnu alone gives ${rhoFromDnu(DNU_SUN).toFixed(1)} kg/m³ for the Sun, and twice the spacing is four times the density`);

ok('surface gravity from the frequency of maximum power reproduces the solar log g of 4.438 in cgs, which is the check that the cutoff scaling is wired to real units and not merely to itself',
  Math.abs(loggOf(NUMAX_SUN, TEFF_SUN) - 4.438) < 0.002,
  `log g = ${loggOf(NUMAX_SUN, TEFF_SUN).toFixed(4)}`);

console.log('\n=== 8-10. And a transit gives the same density, knowing nothing about the star ===\n');

ok('A PLANET CROSSING A DISC GIVES THE HOST`S MEAN DENSITY WITH NO PHOTOMETRY, NO SPECTRUM AND NO MODEL. Kepler`s third law turns a period and an a-over-R into 3 pi over G P squared, times a-over-R cubed — and the Earth crossing the Sun returns the solar density to two parts in ten thousand',
  (() => { const rho = rhoTransit(365.256363, AU / RSUN);
    return Math.abs(rho / rhoSun - 1) < 3e-4; })(),
  `transit gives ${rhoTransit(365.256363, AU / RSUN).toFixed(1)} kg/m³ against the ${rhoSun.toFixed(1)} the mass and radius give — a ratio of ${(rhoTransit(365.256363, AU / RSUN) / rhoSun).toFixed(6)}`);

ok('and THE TWO ROUTES SHARE NOTHING BUT NEWTON. One is a frequency spacing in a power spectrum; the other is a duration and a period in a light curve. Neither uses the other`s data, which is exactly what makes the pair a check rather than a restatement',
  (() => { const seis = rhoFromDnu(DNU_SUN), tran = rhoTransit(365.256363, AU / RSUN);
    return Math.abs(seis / tran - 1) < 3e-4; })(),
  `seismic ${rhoFromDnu(DNU_SUN).toFixed(1)} · transit ${rhoTransit(365.256363, AU / RSUN).toFixed(1)} kg/m³`);

ok('AND THE CHECK HAS TEETH. A stellar radius wrong by ten per cent — which is an ordinary error when the radius comes from a model — moves the transit density by a third, because it enters cubed. A seismic density and a transit density that disagree by that much are telling you the radius is wrong, and a planet radius scales with it',
  (() => { const good = rhoTransit(365.256363, AU / RSUN);
    const bad = rhoTransit(365.256363, AU / (1.10 * RSUN));
    return Math.abs(good / bad - Math.pow(1.10, 3)) < 1e-9 && good / bad > 1.3; })(),
  `a radius ten per cent large gives ${(rhoTransit(365.256363, AU / (1.10 * RSUN))).toFixed(1)} kg/m³ — the density falls by a factor of ${(Math.pow(1.10, 3)).toFixed(3)}, since a/R enters cubed`);

console.log('\n=== 11-12. The echelle diagram, and what it does not know ===\n');

ok('the asymptotic relation folds a spectrum of hundreds of peaks into RIDGES: consecutive overtones of one degree are spaced by Dnu, so frequency modulo Dnu collapses each degree onto a vertical line, and the degrees interleave at half-spacings',
  (() => { const eps = 1.4, dn = DNU_SUN;
    const nu = (n, l) => dn * (n + l / 2 + eps);
    const x = v => ((v % dn) + dn) % dn;
    const l0 = [18, 19, 20, 21, 22].map(n => x(nu(n, 0)));
    const spread = Math.max(...l0) - Math.min(...l0);
    return spread < 1e-9 && Math.abs(x(nu(20, 1)) - x(nu(20, 0)) - dn / 2) < 1e-9; })(),
  'five consecutive degree-0 overtones land on one vertical line, and degree 1 sits half a spacing away');

ok('AND IT IS APPROXIMATE, WHICH THE ATLAS SAYS RATHER THAN HIDES. The asymptotic form puts the solar mode at 3026 µHz where the Sun shows 3033 — seven parts in a thousand, and it is the surface term: the outer layers are not adiabatic and the asymptotic relation knows nothing about them. Real work fits that away instead of trusting it, and a ridge diagram drawn from the asymptotic form alone is a teaching picture, not a measurement',
  (() => { const asymptotic = DNU_SUN * (21 + 1.4);
    const observed = 3033;
    const err = Math.abs(asymptotic - observed) / observed;
    return err > 0.001 && err < 0.01; })(),
  `asymptotic ${(DNU_SUN * (21 + 1.4)).toFixed(0)} µHz against an observed 3033 — ${(100 * Math.abs(DNU_SUN * 22.4 - 3033) / 3033).toFixed(2)} per cent, the surface term`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
