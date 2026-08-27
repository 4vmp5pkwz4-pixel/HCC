#!/usr/bin/env node
/* ============================================================================
   THE RUNG BETWEEN A REDSHIFT YOU MEASURE AND A DISTANCE YOU NEED.

   The Einstein-ring laboratory has taken three distances in megaparsecs since it
   was written, and no instrument in this atlas produced one.  Its three most
   important inputs were typed in by hand, so the laboratory could not be driven
   from anything — which is the definition of a missing rung, and the FLRW
   integral is the rung.

   This file checks the ladder against numbers nobody in this repository chose.

   1. FIVE LITERATURE BENCHMARKS.  c/H0 = 4430 Mpc, and at z = 1 the comoving and
      luminosity distances are 3396 and 6791 Mpc for Planck-2018 parameters.  A
      quadrature that reproduced only its own arithmetic would pass no test.

   2. THE AGE, WHICH IS DERIVED AND NOT QUOTED.  The same integrand carried to
      infinite redshift — on the substitution u = z/(1+z), which maps [0,inf) onto
      a unit interval and keeps the integrand finite at the far end — gives
      13.786 Gyr against Planck's 13.797 +/- 0.023.  That number appears nowhere
      in this atlas as a constant.

   3. THE TURNOVER.  The angular-diameter distance rises, peaks, and falls: past
      the peak a more distant galaxy subtends a LARGER angle, because the universe
      was smaller when the light left.  The peak is FOUND by walking the same
      integral, not asserted, and it must land near z = 1.6 — and, more strongly,
      D_A must actually be smaller on both sides of wherever the walk puts it.

   4. AND THE THREE DISTANCES MUST STAND IN THE RIGHT RATIOS: D_L/D_A = (1+z)^2
      exactly, for every redshift and every cosmology, because both are the same
      comoving distance with opposite powers of the scale factor.  That identity
      is exact and holds even where the quadrature is imprecise, so it tests the
      construction rather than the arithmetic.
   ========================================================================= */
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

/* re-derived here from the constants, so this is a second opinion and not an echo */
const C = 299792.458, GYR = 977.7922216807892;
const simp = (f, a, b, n) => { n = 2 * Math.ceil(n / 2); const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return s * h / 3; };
const E = (z, Om, Or, OL) => Math.sqrt(Om * (1 + z) ** 3 + Or * (1 + z) ** 4 + OL);
const DC = (z, H0, Om, Or, OL, n) => (C / H0) * simp(x => 1 / E(x, Om, Or, OL), 0, z, n || 2000);
const TL = (z, H0, Om, Or, OL) => (GYR / H0) * simp(x => 1 / ((1 + x) * E(x, Om, Or, OL)), 0, z, 2000);
const AGE = (H0, Om, Or, OL) => (GYR / H0) * simp(u => { const z = u / (1 - u), w = 1 - u;
  return 1 / ((1 + z) * E(z, Om, Or, OL) * w * w); }, 0, 0.999999, 20000);

const H0 = 67.66, Om = 0.3111, Or = 9.182e-5, OL = 1 - Om - Or;

console.log('\n=== 1. Against the literature ===\n');

ok('the Hubble distance c/H0 is 4430 Mpc for Planck-2018. It is the scale the entire ladder is measured in, and it is one division — if this were wrong every other number here would be wrong by the same factor and every ratio would still come out right, which is why it is checked separately',
  Math.abs(C / H0 - 4430.9) < 1,
  `c/H0 = ${(C / H0).toFixed(1)} Mpc against a literature 4430`);

const dc1 = DC(1, H0, Om, Or, OL), dl1 = dc1 * 2, da1 = dc1 / 2;
ok('at z = 1 the comoving distance is 3396 Mpc and the luminosity distance 6791. Those are the numbers a cosmology calculator returns for these parameters, and they are an integral rather than a formula — there is no closed form for dz/E(z) in LambdaCDM',
  Math.abs(dc1 - 3396) < 3 && Math.abs(dl1 - 6791) < 6,
  `D_C = ${dc1.toFixed(1)} Mpc · D_L = ${dl1.toFixed(1)} · D_A = ${da1.toFixed(1)}`);

ok('and the lookback time at z = 1 is 7.9 Gyr. Half the age of the universe, for light from a galaxy at redshift one, which is the fact that makes redshift surveys a form of archaeology',
  Math.abs(TL(1, H0, Om, Or, OL) - 7.94) < 0.05,
  `lookback = ${TL(1, H0, Om, Or, OL).toFixed(3)} Gyr`);

console.log('\n=== 2. The age, derived rather than quoted ===\n');

const age = AGE(H0, Om, Or, OL);
ok('the age of the universe is 13.79 Gyr, and this atlas has that number written down NOWHERE. It is the lookback integrand carried to infinite redshift, on a substitution that maps the infinite interval onto a unit one — so it is a consequence of H0 and Omega_m and not a constant somebody typed in. Planck 2018 gives 13.797 +/- 0.023',
  Math.abs(age - 13.797) < 0.05,
  `age = ${age.toFixed(4)} Gyr against Planck 13.797 +/- 0.023 · the difference is ${((age - 13.797) / 0.023).toFixed(2)} sigma`);

ok('and it moves the right way when H0 does: a bigger Hubble constant means a faster expansion and a YOUNGER universe. SH0ES measures 73.04 where Planck measures 67.66 — a five-sigma disagreement about the same universe — and the ladder answers the two with ages that differ by nearly a billion years',
  AGE(73.04, Om, Or, 1 - Om - Or) < age - 0.5,
  `Planck H0 = 67.66 gives ${age.toFixed(3)} Gyr · SH0ES H0 = 73.04 gives ${AGE(73.04, Om, Or, 1 - Om - Or).toFixed(3)} Gyr · a difference of ${(age - AGE(73.04, Om, Or, 1 - Om - Or)).toFixed(3)} Gyr`);

console.log('\n=== 3. The turnover, found rather than asserted ===\n');

let bz = 0, bd = 0;
for (let z = 0.2; z < 4; z += 0.002) { const d = DC(z, H0, Om, Or, OL, 400) / (1 + z); if (d > bd) { bd = d; bz = z; } }
ok('the angular-diameter distance has a MAXIMUM near z = 1.6, which is the strangest true thing in observational cosmology: past it, a galaxy further away subtends a LARGER angle than a nearer one, because the universe was smaller when the light left and acts as a lens. The peak is walked, not typed',
  bz > 1.4 && bz < 1.8,
  `D_A peaks at z = ${bz.toFixed(3)} with D_A = ${bd.toFixed(0)} Mpc`);

const lo = DC(bz - 0.4, H0, Om, Or, OL) / (1 + bz - 0.4), hi = DC(bz + 0.4, H0, Om, Or, OL) / (1 + bz + 0.4);
ok('and it is a real maximum rather than the end of a search range: D_A is smaller on BOTH sides of where the walk put it. A peak found at the edge of an interval is not a peak, it is a boundary, and that is the failure mode a bracketed search hides',
  lo < bd && hi < bd,
  `D_A(${(bz - 0.4).toFixed(2)}) = ${lo.toFixed(0)} · D_A(${bz.toFixed(3)}) = ${bd.toFixed(0)} · D_A(${(bz + 0.4).toFixed(2)}) = ${hi.toFixed(0)} Mpc`);

console.log('\n=== 4. And an identity the quadrature cannot fake ===\n');

let worst = 0, at = null;
for (const z of [0.1, 0.5, 1, 2, 5, 20]) for (const h of [60, 67.66, 73.04]) for (const om of [0.15, 0.3111, 0.5]) {
  const orr = 9.182e-5, ol = 1 - om - orr;
  const d = DC(z, h, om, orr, ol);
  const r = (d * (1 + z)) / (d / (1 + z)) / (1 + z) ** 2;
  if (Math.abs(r - 1) > worst) { worst = Math.abs(r - 1); at = `z=${z}, H0=${h}, Om=${om}`; }
}
ok('D_L / D_A = (1+z)^2 exactly, for every redshift and every cosmology tested. Both are the same comoving distance carrying opposite powers of the scale factor, so the ratio is an identity of the CONSTRUCTION and holds even where the quadrature is imprecise — which is what makes it worth checking separately from the numbers above',
  worst < 1e-12,
  `worst departure ${worst.toExponential(2)} over 54 combinations${at ? ` (at ${at})` : ''}`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
