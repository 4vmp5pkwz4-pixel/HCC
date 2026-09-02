#!/usr/bin/env node
/* ============================================================================
   THE LADDER, AND WHY THERE ARE TWO HUBBLE CONSTANTS

   A unit census picked this laboratory.  Seven outputs in the atlas are quoted
   in ASTRONOMICAL UNITS -- every one from the exoplanet bench -- and across a
   hundred and seven laboratories nothing consumed one.  A parsec is DEFINED as
   the distance at which one astronomical unit subtends one arcsecond.

   And the atlas had the ladder's far end without its near one: a cosmology
   bench that turns a redshift into a distance, and a cosmological-constant
   bench offering a button for Planck's 67.66 and a button for SH0ES's 73.04,
   never saying why there are two.

   This file shares no code with the atlas.

   TWELVE THINGS ARE CHECKED.

   1.  The parsec DERIVED from the AU, against the tabulated value.
   2.  What the small-angle shortcut costs: eight parts per trillion.
   3.  Parallax distances, against Gaia's own numbers.
   4.  The reach of rung one -- and that it does not get to the Magellanic
       Clouds, which is why there is a rung two.
   5.  Leavitt's law forwards.
   6.  And backwards, through the LMC, as a round trip.
   7.  A magnitude is a logarithm, so an error is ADDITIVE and travels upward
       unchanged.  That is the ladder's whole fragility in one identity.
   8.  Extinction is one-sided: dust can only make things look further.
   9.  The type Ia rung reaches redshift 1.8.
   10. The two Hubble constants are 4.80 sigma apart.
   11. RECONCILING THEM WOULD TAKE 0.166 MAGNITUDES, and applying exactly that
       lands one on the other -- the arithmetic being the arithmetic.
   12. Against a whole quoted ladder budget of 0.093.  The gap is 1.78 times
       everything anyone has admitted to, which is the difference between a
       discrepancy and a crisis.
   ========================================================================== */
'use strict';
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const AU = 1.495978707e11;
const ARCSEC = Math.PI / (180 * 3600);
const PC = AU / Math.tan(ARCSEC);
const PC_SMALL = AU / ARCSEC;
const PC_TABLE = 3.0856775814913673e16;
const LY = 9.4607304725808e15;

const dist = mas => 1000 / mas;
const reach = (sigma, frac) => 1000 / (sigma / frac);
const cephM = (P, slope, zero) => (slope == null ? -2.81 : slope) * (Math.log10(P) - 1) + (zero == null ? -4.05 : zero);
const mu = pc => 5 * Math.log10(pc / 10);
const dFromMu = m => 10 * Math.pow(10, m / 5);
const h0Shift = (h, dm) => h * Math.pow(10, -dm / 5);

console.log('\n=== 1-2. A parsec is a definition, not a measurement ===\n');

ok('the parsec DERIVED from the astronomical unit — AU divided by the tangent of one arcsecond — reproduces the tabulated 3.0856775814913673e16 metres to eight parts per BILLION. It agrees that well because it is a definition and not a measurement: the AU is exact by fiat, the arcsecond is exact by fiat, and the only thing between them is trigonometry. This is the one place in the atlas that consumes an astronomical unit at all, and seven outputs were publishing them',
  Math.abs(PC / PC_TABLE - 1) < 1e-8,
  `AU/tan(1") = ${PC.toExponential(12)} m · tabulated ${PC_TABLE.toExponential(12)} · ${(1e9 * (PC / PC_TABLE - 1)).toFixed(3)} ppb apart · and 1 pc = ${(PC / LY).toFixed(6)} light years`);

ok('and dropping the tangent for the small angle costs eight parts per TRILLION, which is measured here rather than waved through. The difference is tan(x) − x ≈ x³/3 at x = 4.85e-6, so it is 7.8e-12 in relative terms. Small enough to ignore and now known rather than assumed, which is the difference this atlas is built on',
  (() => { const rel = PC_SMALL / PC - 1;
    return rel > 0 && rel < 1e-10 && Math.abs(rel / (ARCSEC * ARCSEC / 3) - 1) < 1e-3; })(),
  `AU/1" = ${PC_SMALL.toExponential(12)} · ${(1e12 * (PC_SMALL / PC - 1)).toFixed(2)} parts per trillion high · x²/3 predicts ${(1e12 * ARCSEC * ARCSEC / 3).toFixed(2)}`);

console.log('\n=== 3-4. Rung one is a triangle, and it does not reach far enough ===\n');

ok('parallax distances, against Gaia`s own catalogue: Proxima Centauri at 768.5 milliarcseconds is 1.30 parsecs, Sirius is 2.64, and the Galactic centre at 0.125 mas is eight kiloparsecs. No photometry, no calibration, no model — the inverse of an angle. This is the only rung in the whole ladder that is not standing on another one',
  Math.abs(dist(768.5) - 1.301) < 0.002 && Math.abs(dist(379.21) - 2.637) < 0.002
  && Math.abs(dist(0.125) - 8000) < 1,
  `Proxima ${dist(768.5).toFixed(4)} pc = ${(dist(768.5) * PC / LY).toFixed(3)} ly (literature 4.246) · Sirius ${dist(379.21).toFixed(4)} · Galactic centre ${(dist(0.125) / 1000).toFixed(3)} kpc`);

ok('AND IT DOES NOT REACH THE MAGELLANIC CLOUDS, which is the entire reason there is a second rung. Gaia measures to about twenty microarcseconds, which buys a ten per cent distance out to five kiloparsecs and a one per cent distance out to five hundred parsecs. The Large Magellanic Cloud is fifty kiloparsecs away — TEN TIMES beyond where the geometry stops being useful — and every Cepheid calibration in history has had to cross that gap on someone else`s authority',
  Math.abs(reach(0.020, 0.10) - 5000) < 1 && Math.abs(reach(0.020, 0.01) - 500) < 1
  && 49600 / reach(0.020, 0.10) > 9,
  `at sigma = 20 uas: 10% out to ${reach(0.020, 0.10).toFixed(0)} pc, 1% out to ${reach(0.020, 0.01).toFixed(0)} pc · the LMC at 49600 pc is ${(49600 / reach(0.020, 0.10)).toFixed(1)}× beyond the ten-per-cent horizon`);

console.log('\n=== 5-6. Leavitt had the slope and never the zero point ===\n');

ok('Leavitt`s law forwards: a ten-day Cepheid is absolute magnitude −4.05 and a hundred-day one is −6.86, so a factor of ten in period is 2.81 magnitudes, which is a factor of thirteen in luminosity. Longer means brighter and that is the whole content of the method. She measured this in 1912 from the Magellanic Clouds — all at effectively one distance, so what she had was the SLOPE with no way to say how bright any of them was',
  Math.abs(cephM(10) + 4.05) < 1e-9 && Math.abs(cephM(100) + 6.86) < 1e-9
  && Math.abs(Math.pow(10, (cephM(10) - cephM(100)) / 2.5) - 13.30) < 0.05,
  `P = 1, 10, 100 d → M_V = ${[1, 10, 100].map(p => cephM(p).toFixed(3)).join(' · ')} · a decade in period is ${(cephM(10) - cephM(100)).toFixed(2)} mag = ${Math.pow(10, (cephM(100) - cephM(10)) / -2.5).toFixed(1)}× in luminosity`);

ok('and backwards, as a round trip: a thirty-day Cepheid seen at apparent magnitude 13.09 comes out at 49.7 kiloparsecs, against the 49.6 the literature quotes for the Large Magellanic Cloud. The relation ran forwards to get the apparent magnitude and backwards to get the distance, and it closed',
  (() => { const d = dFromMu(13.09 - cephM(30));
    return Math.abs(d / 49600 - 1) < 0.01; })(),
  `M_V(30 d) = ${cephM(30).toFixed(3)} · m − M = ${(13.09 - cephM(30)).toFixed(3)} → ${(dFromMu(13.09 - cephM(30)) / 1000).toFixed(2)} kpc against 49.6 · and mu(49600 pc) = ${mu(49600).toFixed(3)} against the published 18.477`);

console.log('\n=== 7-9. Why a systematic travels, and how far the top rung sees ===\n');

ok('A MAGNITUDE IS A LOGARITHM, SO AN ERROR IS ADDITIVE AND TRAVELS UPWARD UNCHANGED. That is the ladder`s entire fragility in one identity: shift the zero point by dm and every distance above it scales by 10^(dm/5), whatever the rung, whatever the object, however many steps later. Checked across four decades of distance — the same shift produces the same fractional error at ten parsecs and at a hundred megaparsecs',
  (() => { const dm = 0.05; let worst = 0;
    for (const d of [10, 1e3, 1e5, 1e7, 1e8]) {
      const shifted = dFromMu(mu(d) + dm);
      worst = Math.max(worst, Math.abs(shifted / d / Math.pow(10, dm / 5) - 1)); }
    return worst < 1e-12; })(),
  `a 0.05 mag shift is ${(100 * (Math.pow(10, 0.05 / 5) - 1)).toFixed(3)}% in distance at every rung · 1% in distance = ${(5 * Math.log10(1.01)).toFixed(4)} mag`);

ok('and extinction is ONE-SIDED, which is why it is the systematic that worries people. Dust can only make a thing fainter, a fainter thing looks further, so unaccounted dust biases every distance in the same direction — it cannot average out over a sample the way a random error does. Half a magnitude of it is a twenty-six per cent overestimate',
  (() => { const d0 = 1000, aV = 0.5;
    const dBias = dFromMu(mu(d0) + aV);
    return dBias > d0 && Math.abs(dBias / d0 - Math.pow(10, aV / 5)) < 1e-9
      && Math.abs(dBias / d0 - 1.2589) < 1e-3; })(),
  `A_V = 0.5 mag turns 1000 pc into ${dFromMu(mu(1000) + 0.5).toFixed(1)} — ${(100 * (Math.pow(10, 0.1) - 1)).toFixed(1)}% too far, and always too far`);

ok('the type Ia rung reaches redshift 1.8. At absolute magnitude −19.3 and a limiting magnitude of 25 it stays visible to seven thousand megaparsecs, which is why this is the rung that touches cosmology at all — and why the argument about the Hubble constant is an argument about the two rungs beneath it',
  (() => { const d = dFromMu(25 - (-19.3)) / 1e6;
    return d > 6500 && d < 8000; })(),
  `m = 25 → ${(dFromMu(25 + 19.3) / 1e6).toFixed(0)} Mpc · at 73 km/s/Mpc that is z ≈ ${(dFromMu(25 + 19.3) / 1e6 * 73 / 3e5).toFixed(2)}`);

console.log('\n=== 10-12. And the number this laboratory exists to print ===\n');

const PLANCK = { value: 67.66, sigma: 0.42 }, SHOES = { value: 73.04, sigma: 1.04 };
const sig = Math.hypot(PLANCK.sigma, SHOES.sigma);
const tension = Math.abs(SHOES.value - PLANCK.value) / sig;
ok('the two Hubble constants are 4.80 sigma apart — 67.66 ± 0.42 from the microwave background through a model, 73.04 ± 1.04 from the ladder climbed rung by rung. Neither is computed here and both are quoted; what is computed is the size of the disagreement, which is 7.95 per cent',
  Math.abs(tension - 4.80) < 0.05
  && Math.abs(100 * (SHOES.value - PLANCK.value) / PLANCK.value - 7.95) < 0.05,
  `difference ${(SHOES.value - PLANCK.value).toFixed(2)} ± ${sig.toFixed(3)} = ${tension.toFixed(2)} sigma · ${(100 * (SHOES.value - PLANCK.value) / PLANCK.value).toFixed(2)}%`);

const need = 5 * Math.log10(SHOES.value / PLANCK.value);
ok('RECONCILING THEM WOULD TAKE 0.1661 MAGNITUDES hiding somewhere below the top of the ladder — and applying exactly that to the late-universe value lands it on the early-universe one to twelve decimal places, which is the check that the arithmetic really is only arithmetic. That single number is what this laboratory exists to print: not a claim about where the systematic is, or whether it exists, but the size it would have to be',
  Math.abs(need - 0.1661) < 0.0005
  && Math.abs(h0Shift(SHOES.value, need) - PLANCK.value) < 1e-10,
  `dm = 5 log10(73.04/67.66) = ${need.toFixed(6)} mag · applying it: 73.04 → ${h0Shift(SHOES.value, need).toFixed(10)} against Planck`);

ok('AND THE LADDER`S ENTIRE QUOTED BUDGET IS 0.093 MAGNITUDES. Three rungs — parallax, Cepheids, type Ia — with random errors added in quadrature and systematics added LINEARLY, because each rung is calibrated on the one below so a shift there is common to everything above. That comes to 4.4 per cent in distance. The tension needs 1.78 TIMES THAT, which is the difference between a discrepancy and a crisis: there is not room in the stated errors for it, and that is why no single bad calibration has been able to make it go away',
  (() => {
    const rungs = [{ r: 0.02, s: 0.01 }, { r: 0.03, s: 0.03 }, { r: 0.05, s: 0.03 }];
    let rand = 0, sys = 0;
    for (const q of rungs) { rand = Math.hypot(rand, q.r); sys += q.s; }
    const total = Math.hypot(rand, sys);
    return Math.abs(rand - 0.0616) < 0.001 && Math.abs(sys - 0.07) < 1e-9
      && Math.abs(total - 0.0933) < 0.001
      && need / total > 1.7 && need / total < 1.85; })(),
  (() => {
    const rungs = [{ r: 0.02, s: 0.01 }, { r: 0.03, s: 0.03 }, { r: 0.05, s: 0.03 }];
    let rand = 0, sys = 0;
    for (const q of rungs) { rand = Math.hypot(rand, q.r); sys += q.s; }
    const total = Math.hypot(rand, sys);
    return `random ${rand.toFixed(4)} · systematic ${sys.toFixed(4)} · total ${total.toFixed(4)} mag = ${(100 * (Math.pow(10, total / 5) - 1)).toFixed(2)}% in distance · the tension needs ${(need / total).toFixed(2)}× that`; })());

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
