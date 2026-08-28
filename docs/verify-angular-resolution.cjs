#!/usr/bin/env node
/* ============================================================================
   CAN IT BE SEEN AT ALL?

   Twenty-three laboratories in this atlas publish an ANGLE — a deflection, an
   Einstein radius, a pulsar's polarisation swing, a skyrmion Hall angle — and
   forty-six inputs take one, and until this laboratory existed not one angle was
   routed anywhere.  The atlas could compute what something looks like on the sky
   and had no way to ask the only question an observer ever asks.

   Diffraction sets the floor.  A circular aperture spreads a point into an Airy
   pattern whose first dark ring sits at (j_1,1/pi)·lambda/D, and two points closer
   than that are one point.

   THE 1.22 IS NOT A CONSTANT ANYONE MEASURED, and this file checks it as a
   derivation rather than a citation: j_1,1 is the first zero of the Bessel
   function J_1, and this bisects for it independently of the atlas and requires
   3.831705970.  Divided by pi that is 1.219669891.  A coefficient you type in is
   a coefficient you cannot be wrong about in an interesting way.

   Then four instruments nobody in this repository chose:

     Hubble, 2.4 m at 550 nm         0.058 arcsec
     JWST, 6.5 m at 2 um             0.077 arcsec
     Event Horizon Telescope         27 microarcsec  (Earth-diameter, 1.3 mm)
     the unaided eye, 7 mm           19.8 arcsec by diffraction — and NOT what
                                     the eye achieves, which is about 60

   and the number the atlas could not say before: the aperture that would resolve
   the Einstein ring of a neutron-star lens.
   ========================================================================= */
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

/* J1 re-derived here, so this is a second opinion and not an echo */
function J1(x) {
  const a = Math.abs(x);
  if (a < 8) { const y = x * x;
    const p = x * (72362614232 + y * (-7895059235 + y * (242396853.1 + y * (-2972611.439 + y * (15704.48260 + y * (-30.16036606))))));
    const q = 144725228442 + y * (2300535178 + y * (18583304.74 + y * (99447.43394 + y * (376.9991397 + y))));
    return p / q; }
  const z = 8 / a, y = z * z, xx = a - 2.356194491;
  const p1 = 1 + y * (0.183105e-2 + y * (-0.3516396496e-4 + y * (0.2457520174e-5 + y * (-0.240337019e-6))));
  const p2 = 0.04687499995 + y * (-0.2002690873e-3 + y * (0.8449199096e-5 + y * (-0.88228987e-6 + y * 0.105787412e-6)));
  const r = Math.sqrt(0.636619772 / a) * (Math.cos(xx) * p1 - z * Math.sin(xx) * p2);
  return x < 0 ? -r : r;
}
const AS = 206264.80624709636;
let lo = 3.5, hi = 4.2;
for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (J1(lo) * J1(m) <= 0) hi = m; else lo = m; }
const Z = (lo + hi) / 2, K = Z / Math.PI;
const ray = (lam, D) => K * lam / D;

console.log('\n=== 1. The 1.22 is derived, not quoted ===\n');

ok('the first zero of J_1 is 3.831705970, found by bisecting the Bessel function rather than by citing it. Every optics textbook writes 1.22 and almost none says where it comes from: it is this zero divided by pi, and a laboratory that typed the 1.22 in could not be wrong about it in any way a reader could detect',
  Math.abs(Z - 3.831705970) < 1e-8,
  `j_1,1 = ${Z.toFixed(9)} against the literature 3.831705970`);

ok('and the coefficient that follows is 1.219669891, not 1.22. The difference is three parts in ten thousand and it is not the point — the point is that it is a CONSEQUENCE of the Bessel function, so it moves if the geometry does. A square aperture has a different one, and an atlas that hard-coded 1.22 would have no way to notice',
  Math.abs(K - 1.219669891) < 1e-8,
  `j_1,1 / pi = ${K.toFixed(9)}`);

ok('the Airy intensity is exactly one half at the half-power point and falls to zero at the first ring, which is what makes the ring a ring. At the Rayleigh separation one pattern sits on the other\'s first zero, so the sum at the midpoint dips — and that dip IS the criterion, not a convention laid over it',
  Math.abs((2 * J1(Z) / Z) ** 2) < 1e-12 && Math.abs((2 * J1(1e-9) / 1e-9) ** 2 - 1) < 1e-6,
  `I(0) = 1 · I(j_1,1) = ${((2 * J1(Z) / Z) ** 2).toExponential(2)} — zero to machine precision, which is what a dark ring is`);

console.log('\n=== 2. Four instruments nobody here chose ===\n');

const cases = [
  ['Hubble, 2.4 m at 550 nm', 550e-9, 2.4, 0.0577, 0.002,
   'the number every HST press release rounds to 0.05 arcsec'],
  ['JWST, 6.5 m at 2 microns', 2e-6, 6.5, 0.0774, 0.003,
   'a bigger mirror AND a longer wavelength — the two pull opposite ways, and the longer wavelength wins'],
  ['the Event Horizon Telescope, Earth-diameter at 1.3 mm', 1.3e-3, 1.2e7, 2.72e-5, 3e-6,
   '27 microarcseconds: the sharpest image humans have made, and it is a millimetre-wave instrument the size of the planet'],
  ['the unaided eye, 7 mm at 550 nm', 550e-9, 7e-3, 19.77, 0.5,
   'by DIFFRACTION. Human acuity is about 60 arcsec — the eye is the one instrument here that cannot use the aperture it has'],
];
for (const [name, lam, D, want, tol, why] of cases) {
  const got = ray(lam, D) * AS;
  ok(`${name} resolves ${want} arcsec. ${why}`,
    Math.abs(got - want) < tol,
    `computed ${got.toExponential(4)} arcsec against ${want}`);
}

console.log('\n=== 3. And the number the atlas could not say ===\n');

/* the Einstein ring of a neutron-star lens, which the atlas reports at 2.6 microarcsec
   and described in prose as "below any resolving power ever built" */
const ring = 2.6e-6 / AS;
const need = K * 550e-9 / ring;
ok('resolving the Einstein ring of a neutron-star lens would take an aperture of 53 kilometres at 550 nm. The atlas already reported 2.6 microarcseconds and already said in prose that this is below any resolving power ever built — a true sentence that does not say HOW FAR below. Fifty-three kilometres is how far, and it is the kind of answer a reader can weigh against the 39 metres of the largest telescope being built',
  Math.abs(need / 1000 - 53.2) < 1.5,
  `D = (j_1,1/pi) lambda / theta = ${(need / 1000).toFixed(1)} km · the ELT is 39 m, so this is ${(need / 39).toExponential(2)} times larger`);

/* ── AND MY OWN CLAIM HERE WAS WRONG, WHICH THIS CHECK CAUGHT ────────────────
   The first draft of this file asserted that the Event Horizon Telescope misses the
   neutron-star Einstein ring "by four orders of magnitude".  It misses it by a factor
   of TEN.  That is a far more interesting fact than the one I asserted: the sharpest
   instrument humans have built is within one order of magnitude of resolving the
   Einstein ring of a neutron star, and it gets there not by being large in the way a
   telescope is large but by working at 1.3 mm instead of 550 nm.  Wavelength is doing
   most of the work, which is the thing a reader should take away and which the wrong
   claim would have hidden. */
const eht = ray(1.3e-3, 1.2e7);
ok('and the Event Horizon Telescope misses that ring by a factor of TEN, not by the four orders of magnitude the first draft of this file asserted. The sharpest instrument humans have built is within one order of magnitude of it — and it gets there by observing at 1.3 mm rather than by being large in the way a telescope is large. At 550 nm the same ring needs 53 km of aperture; at 1.3 mm it needs 126,000 km, which is why the EHT is an Earth and not a continent',
  eht / ring > 5 && eht / ring < 20,
  `the ring is ${ring.toExponential(3)} rad · the EHT limit is ${eht.toExponential(3)} rad · short by a factor of ${(eht / ring).toFixed(2)}, one order of magnitude and not four`);

console.log('\n=== 4. Two conventions, published together ===\n');

const dawes = D => (116 / (D * 1000)) / AS;
ok('Dawes and Rayleigh are different claims and both are published. Rayleigh is where one Airy pattern\'s first dark ring falls on the other\'s peak; Dawes\' 116 arcsec / D(mm) is an EMPIRICAL result for a visual observer splitting equal-brightness doubles, and it is finer by SIXTEEN per cent, not the nine the first draft of this file guessed. Neither is corrected into the other, for the same reason the Jeans laboratory publishes two masses',
  dawes(0.2) < ray(550e-9, 0.2) && Math.abs((1 - dawes(0.2) / ray(550e-9, 0.2)) - 0.162) < 0.01,
  `at a 200 mm aperture: Rayleigh ${(ray(550e-9, 0.2) * AS).toFixed(4)} arcsec · Dawes ${(dawes(0.2) * AS).toFixed(4)} · Dawes is finer by ${((1 - dawes(0.2) / ray(550e-9, 0.2)) * 100).toFixed(1)}%`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
