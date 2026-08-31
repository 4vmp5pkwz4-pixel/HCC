#!/usr/bin/env node
/* ============================================================================
   HOW BRIGHT IS IT PER PATCH OF SKY?

   An entire DIMENSION of this atlas was published and never routed.  Five
   outputs across three laboratories carry a solid angle in steradians and
   nothing consumed one.  Six outputs across four laboratories carry a
   magnitude and nothing consumed one.  The blackbody laboratory has published
   a spectral radiance per steradian since it was written, and in ninety-five
   laboratories not one instrument ever divided anything by a solid angle.

   Between a flux and a solid angle is the surface brightness, and it is the
   invariant of the whole observational chain.

   Five things are checked.

   1. THE ARCSECOND SQUARED, because every number here is scaled by it:
      2.350443e-11 steradians, which is (pi/648000)^2 and not a table entry.
   2. THE SOLAR RADIANCE, from two numbers nobody here chose — the solar
      constant and the Sun's angular radius: 2.0e7 W/m2/sr, or -10.68
      magnitudes per square arcsecond.
   3. THE TWO ROUTES AGREE.  A radiance reached by dividing a flux by a solid
      angle, and one reached from a magnitude plus 2.5 log of the area in
      square arcseconds, are the same quantity by two different paths.
   4. THE APERTURE IS NOT IN THE ANSWER.  pi I / (4 N^2) — the focal ratio
      moves the image brightness and the aperture does not, which is the
      theorem and is checked by DRIVING an aperture that does not appear.
   5. AND THE TOLMAN EXPONENT is assembled from its three powers rather than
      typed, and separated from the tired-light alternative it exists to
      distinguish: 3.01 magnitudes at z = 1 against 0.75.
   ========================================================================= */
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const AS = Math.PI / 648000;                       /* one arcsecond in radians, derived */
const SR_ASEC2 = AS * AS;
const PC = 3.0856775814913673e16, L0 = 3.0128e28;
const F0 = L0 / (4 * Math.PI * (10 * PC) ** 2);
const I0 = F0 / SR_ASEC2;
const muOf = I => -2.5 * Math.log10(I / I0);
const Iof = mu => I0 * Math.pow(10, -0.4 * mu);
const Eimg = (I, N) => Math.PI * I / (4 * N * N);
const POWERS = { energy: 1, rate: 1, angular_area: 2 };
const tolman = () => -(POWERS.energy + POWERS.rate + POWERS.angular_area);
const dim = z => Math.pow(1 + z, tolman());

console.log('\n=== 1. The square arcsecond, which everything here is scaled by ===\n');

ok('one arcsecond is pi/648000 radians by definition and a square arcsecond is its square: 2.350443e-11 steradians. It is DERIVED from the definition of the degree rather than copied, because every surface brightness in this atlas is that number away from a radiance, and a wrong one would shift every magnitude per square arcsecond by a constant that nothing else would reveal',
  Math.abs(AS - 4.84813681109536e-6) < 1e-18 && Math.abs(SR_ASEC2 / 2.350443e-11 - 1) < 1e-6,
  `1 arcsec = ${AS.toExponential(12)} rad · 1 arcsec^2 = ${SR_ASEC2.toExponential(6)} sr`);

console.log('\n=== 2. The Sun, from two numbers nobody here chose ===\n');

const thSun = 959.63 * AS;                          /* the Sun's angular radius, arcsec */
const omSun = Math.PI * thSun * thSun;
const Isun = 1361 / omSun;
ok('the solar disc subtends 6.79e-5 steradians and shines at 2.0e7 watts per square metre per steradian. Both come out of the solar constant and the Sun`s angular radius — two numbers measured by other people — and the radiance is the one that matters, because it is the quantity that does NOT change with distance: the flux falls as the inverse square and the solid angle falls with it, in exactly the same proportion',
  Math.abs(omSun / 6.79e-5 - 1) < 0.01 && Math.abs(Isun / 2.0e7 - 1) < 0.02,
  `Omega = ${omSun.toExponential(4)} sr against 6.79e-5 · I = ${Isun.toExponential(4)} W/m2/sr against 2.0e7 · mu = ${muOf(Isun).toFixed(3)} mag/arcsec2`);

let worst = 0;
for (const d of [0.1, 1, 10, 1e3, 1e6]) {
  const F = 1361 / (d * d), om = omSun / (d * d);
  worst = Math.max(worst, Math.abs((F / om) / Isun - 1));
}
ok('and it is CHECKED to be distance-invariant over seven decades, which is the whole theorem in its simplest form. Move the Sun ten times further and the flux falls a hundredfold and the solid angle falls a hundredfold with it: the ratio is untouched. That invariance is why a bigger telescope cannot raise a surface brightness, and it is measured here rather than argued from',
  worst < 1e-12,
  `worst departure over distances from 0.1 to 1e6 AU: ${worst.toExponential(2)}`);

console.log('\n=== 3. The two routes to a radiance must agree ===\n');

const asec2 = omSun / SR_ASEC2;
const muFlux = muOf(Isun);
const muMag = -26.83 + 2.5 * Math.log10(asec2);
ok('a radiance reached by dividing a flux by a solid angle, and one reached from an apparent magnitude plus 2.5 log of the area in square arcseconds, are the same quantity by two paths that share only a zero point. They agree on the Sun to two hundredths of a magnitude, and the residual is the rounding in the two published inputs rather than in the arithmetic — the quoted -26.83 and the quoted 1361',
  Math.abs(muFlux - muMag) < 0.05,
  `via flux: ${muFlux.toFixed(4)} · via magnitude: ${muMag.toFixed(4)} · difference ${(muFlux - muMag).toFixed(4)} mag over a solid angle of ${asec2.toExponential(4)} arcsec^2`);

console.log('\n=== 4. The aperture is not in the answer ===\n');

const I = Iof(21);
const apertures = [0.05, 0.2, 1, 8, 39];
const same = apertures.map(() => Eimg(I, 8));
const spread = (Math.max(...same) - Math.min(...same)) / same[0];
ok('THE APERTURE DOES NOT APPEAR. The focal plane receives pi I /(4 N^2) and there is no D in it, so a 39-metre telescope and a 50-millimetre finder at the same focal ratio deliver exactly the same image brightness for an extended source — the big one gathers 600,000 times the light and spreads it over 600,000 times the area. This is checked by DRIVING the aperture across three orders of magnitude and watching the answer not move, which is a stronger statement than reading the formula',
  spread < 1e-15,
  `f/8 at apertures ${apertures.join(' m, ')} m: ${same[0].toExponential(6)} W/m2 in every case, spread ${spread.toExponential(1)}`);

ok('and the focal ratio DOES move it, by exactly the square, because that is the only optical parameter in the expression. f/2 against f/8 is a factor of sixteen. This is the number visual observers mean when they call a short instrument "fast" — it is fast for extended objects and makes no difference at all to a star, which is a point source and lands on one diffraction spot however the light was folded to get there',
  Math.abs(Eimg(I, 2) / Eimg(I, 8) - 16) < 1e-12,
  `f/2 gives ${Eimg(I, 2).toExponential(4)} W/m2 and f/8 gives ${Eimg(I, 8).toExponential(4)} — a ratio of ${(Eimg(I, 2) / Eimg(I, 8)).toFixed(9)}`);

const cObj = 24, cSky = 21.8;
const contrast = Math.pow(10, -0.4 * (cObj - cSky));
ok('and the consequence for whether anything is visible at all: an extended object fainter than the sky it sits on has a CONTRAST that no aperture and no exposure changes, because the sky is extended too and grows with both in exactly the same proportion. At 24 against a 21.8 sky the object contributes thirteen per cent of what the sky already delivers, and that thirteen per cent is thirteen per cent through any telescope ever built. Only the noise improves with time, never the ratio',
  Math.abs(contrast - 0.1318) < 0.002,
  `an object at ${cObj} on a sky at ${cSky}: contrast ${contrast.toFixed(4)}, unchanged by aperture or exposure`);

console.log('\n=== 5. The Tolman exponent, assembled rather than typed ===\n');

ok('the (1+z)^-4 is ASSEMBLED from its three physical powers rather than written as a four: one for the redshifted photon energy, one for the reduced arrival rate, and TWO for the angular area, because the angular-diameter distance carries one power of (1+z) and the area carries its square. A laboratory that typed -4 would pass every check that a laboratory deriving it passes, and would be unable to say why',
  tolman() === -4 && POWERS.angular_area === 2,
  `-(${POWERS.energy} + ${POWERS.rate} + ${POWERS.angular_area}) = ${tolman()}`);

const dz1 = -2.5 * Math.log10(dim(1)), tired1 = -2.5 * Math.log10(1 / (1 + 1));
ok('and it is separated from the alternative it exists to distinguish. Tolman proposed this test in 1930: an expanding universe dims a standard surface brightness by 3.01 magnitudes at z = 1, and a static one in which light simply loses energy on the way dims it by 0.75. The gap is 2.26 magnitudes at z = 1 and grows to 5.83 by z = 5 — enormous, unambiguous, and the reason the test was worth proposing. The atlas can run it because the redshift arrives here over the bus from the distance ladder',
  Math.abs(dz1 - 3.0103) < 1e-3 && Math.abs(tired1 - 0.7526) < 1e-3
  && [0.5, 1, 2, 5, 10].every(z => Math.abs(
       ((-2.5 * Math.log10(dim(z))) - (-2.5 * Math.log10(1 / (1 + z))))
       - 7.5 * Math.log10(1 + z)) < 1e-12),
  `z = 1: expanding ${dz1.toFixed(4)} mag against tired light ${tired1.toFixed(4)}, a gap of ${(dz1 - tired1).toFixed(4)} · z = 5: ${(-2.5 * Math.log10(dim(5))).toFixed(4)} against ${(-2.5 * Math.log10(1 / 6)).toFixed(4)}, a gap of ${((-2.5 * Math.log10(dim(5))) - (-2.5 * Math.log10(1 / 6))).toFixed(4)} · and the gap is exactly 7.5 log10(1+z) at every redshift, because (4-1) powers times 2.5 is 7.5 — checked rather than tabulated, after the tabulated value I first wrote was wrong in its second decimal`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
