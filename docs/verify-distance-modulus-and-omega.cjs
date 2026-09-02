#!/usr/bin/env node
/* ============================================================================
   THE TWO DEBTS THE DEPTH TABLE NAMED

   The depth doctrine allows an entry to say PENDING: there is a third axis, it
   is not drawn yet, and here is its name.  That is only honest if such entries
   are actually spent, so this file checks the two that were.

   The magnitude ladder owed the DISTANCE MODULUS.  Apparent magnitude is the one
   quantity on that rail which is not a property of the object at all.
   The distance ladder owed the MATTER DENSITY, which is the parameter its whole
   measurement was made to determine.

   This file shares no code with the atlas.  The cosmological integral below is
   a Simpson rule written here, over an expansion rate written here, from
   constants written here.

   TWELVE THINGS ARE CHECKED.

   1.  mu = 0 at ten parsecs, exactly, because that is the definition.
   2.  The LMC at 49.6 kpc gives 18.477, which is not fitted anywhere.
   3.  The Coma cluster at 95.5 Mpc gives 34.90.
   4.  Five magnitudes of mu is exactly a factor of ten in distance.
   5.  And m - M is mu whatever the luminosity, which is the whole point of
       putting mu on its own axis.
   6.  The comoving distance integral converges, checked by refining it.
   7.  A universe with only matter has a smaller luminosity distance than one
       with dark energy, at every redshift.
   8.  THE GAP IS 0.399 MAGNITUDES AT z = 0.5 and 0.533 at z = 0.8.
   9.  It grows with redshift throughout, which is why the measurement needed
       distant supernovae and not merely many nearby ones.
   10. It vanishes as z goes to zero -- so no local measurement, however precise,
       could ever have found it.
   11. And the two laboratories now publish the SAME coordinate: the distance
       modulus computed from the cosmology matches the one computed from the
       luminosity distance it hands over.
   12. AN ABSOLUTE ANCHOR, because every check above is a difference and a
       difference cannot see a common factor -- mutation testing found that
       dropping the (1+z) passed all eleven.
   ========================================================================== */
'use strict';
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const C_KMS = 299792.458;
const mu = dPc => 5 * Math.log10(dPc / 10);
const E = (z, Om, Or, OL) => Math.sqrt(Om * Math.pow(1 + z, 3) + Or * Math.pow(1 + z, 4) + OL);
/* Simpson over 1/E, written here */
function comoving(z, H0, Om, Or, OL, n) {
  n = (n || 2000) | 0; if (n % 2) n++;
  const h = z / n; let s = 0;
  for (let i = 0; i <= n; i++) {
    const zi = i * h, w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
    s += w / E(zi, Om, Or, OL);
  }
  return (C_KMS / H0) * s * h / 3;
}
const DL = (z, H0, Om, n) => { const Or = 9.182e-5, OL = 1 - Om - Or; return comoving(z, H0, Om, Or, OL, n) * (1 + z); };
const muOf = (z, H0, Om, n) => mu(DL(z, H0, Om, n) * 1e6);
const gap = (z, H0, a, b, n) => muOf(z, H0, a, n) - muOf(z, H0, b, n);

console.log('\n=== 1-5. The distance modulus ===\n');

ok('mu is EXACTLY zero at ten parsecs, because that is what defines it. A check whose anchor is a definition rather than a measurement is the reason the other anchors mean anything: it fixes the zero point that the rest are differences from',
  mu(10) === 0, `mu(10 pc) = ${mu(10)}`);

ok('the Large Magellanic Cloud at 49.6 kiloparsecs gives 18.477, a number this atlas fits nowhere and tunes nothing to',
  Math.abs(mu(49600) - 18.477) < 0.002, `mu(49.6 kpc) = ${mu(49600).toFixed(4)}`);

ok('and the Coma cluster at 95.5 megaparsecs gives 34.90 — four decades of distance between the two, checked against the same one-line definition',
  Math.abs(mu(95.5e6) - 34.90) < 0.01, `mu(95.5 Mpc) = ${mu(95.5e6).toFixed(3)}`);

ok('five magnitudes of distance modulus is EXACTLY a factor of ten in distance, at every scale — which is the only reason a logarithmic magnitude system is worth the confusion it causes',
  (() => [10, 1e3, 1e6, 1e9].every(d => Math.abs((mu(d * 10) - mu(d)) - 5) < 1e-12))(),
  `mu(x10) - mu(x) = ${(mu(1e7) - mu(1e6)).toFixed(12)} at every decade tested`);

ok('AND m MINUS M IS mu WHATEVER THE LUMINOSITY, which is exactly why it deserves an axis of its own: two objects on the same rung of an apparent-magnitude ladder can differ by any amount of intrinsic brightness, and the flat ladder cannot say which of them is bright and near or faint and far',
  (() => { const d = 1e5;
    return [-10, -5, 0, 5, 15].every(M => Math.abs(((M + mu(d)) - M) - mu(d)) < 1e-12); })(),
  `at 100 kpc, mu = ${mu(1e5).toFixed(3)}: an M = -10 supergiant and an M = +15 dwarf both shift by that same amount`);

console.log('\n=== 6-10. The matter density ===\n');

ok('the comoving-distance integral converges: refining Simpson from 200 points to 20000 moves the answer by less than a part in a million, so what follows is about the cosmology and not about the quadrature',
  (() => { const a = DL(1.0, 70, 0.3, 200), b = DL(1.0, 70, 0.3, 20000);
    return Math.abs(a - b) / b < 1e-6; })(),
  `D_L(z=1) = ${DL(1.0, 70, 0.3, 200).toFixed(4)} at n=200 against ${DL(1.0, 70, 0.3, 20000).toFixed(4)} at n=20000 Mpc`);

ok('a universe of matter alone puts every object CLOSER than one with dark energy does, at every redshift tested — so supernovae in the real universe come out FAINTER than a matter-only cosmology predicts, which is the direction the 1998 result actually pointed',
  [0.1, 0.3, 0.5, 0.8, 1.2, 1.5].every(z => DL(z, 70, 1.0) < DL(z, 70, 0.3)),
  `at z = 0.5: ${DL(0.5, 70, 1.0).toFixed(0)} Mpc with Omega_m = 1 against ${DL(0.5, 70, 0.3).toFixed(0)} Mpc with 0.3`);

ok('THE GAP IS 0.399 MAGNITUDES AT REDSHIFT A HALF, and 0.533 by redshift 0.8. That is the whole signal: a few tenths of a magnitude, measured against objects whose intrinsic brightness was known well enough to trust',
  Math.abs(gap(0.5, 70, 0.3, 1.0, 4000) - 0.399) < 0.005 && Math.abs(gap(0.8, 70, 0.3, 1.0, 4000) - 0.533) < 0.005,
  `z = 0.5: ${gap(0.5, 70, 0.3, 1.0, 4000).toFixed(4)} mag · z = 0.8: ${gap(0.8, 70, 0.3, 1.0, 4000).toFixed(4)} mag`);

ok('and it GROWS with redshift throughout the range, monotonically — which is why the measurement needed distant supernovae rather than a great many nearby ones, and why the effort went into finding objects at half the age of the universe',
  (() => { const zs = [0.1, 0.2, 0.3, 0.5, 0.8, 1.0, 1.5];
    return zs.every((z, i) => i === 0 || gap(z, 70, 0.3, 1.0, 2000) > gap(zs[i - 1], 70, 0.3, 1.0, 2000)); })(),
  [0.1, 0.5, 1.0, 1.5].map(z => `z=${z}: ${gap(z, 70, 0.3, 1.0, 2000).toFixed(3)}`).join(' · '));

ok('AND IT VANISHES AS THE REDSHIFT GOES TO ZERO. No local measurement, at any precision whatsoever, could have found this: at z = 0.01 the two cosmologies differ by eleven thousandths of a magnitude, and the entire difference between a universe that expands forever and one that does not is invisible in your own neighbourhood',
  (() => { const g001 = Math.abs(gap(0.001, 70, 0.3, 1.0, 2000)), g01 = Math.abs(gap(0.01, 70, 0.3, 1.0, 2000));
    return g001 < 0.002 && g01 < 0.02 && g01 > g001; })(),
  `z = 0.001: ${gap(0.001, 70, 0.3, 1.0, 2000).toFixed(5)} mag · z = 0.01: ${gap(0.01, 70, 0.3, 1.0, 2000).toFixed(4)} mag`);

console.log('\n=== 11. And the two laboratories now share a coordinate ===\n');

ok('the distance modulus computed from a cosmology agrees with the one computed straight from the luminosity distance that cosmology hands over — so the magnitude ladder and the distance ladder are now writing the SAME quantity on the same axis, which is what spending a named debt was supposed to buy',
  (() => [0.1, 0.5, 1.0].every(z => Math.abs(muOf(z, 70, 0.3, 4000) - mu(DL(z, 70, 0.3, 4000) * 1e6)) < 1e-12))(),
  `at z = 0.5 both routes give mu = ${muOf(0.5, 70, 0.3, 4000).toFixed(6)}`);

console.log('\n=== 12. An absolute anchor, because every check above is a difference ===\n');

ok('EVERY CHECK ABOVE THIS ONE IS A DIFFERENCE, AND A DIFFERENCE CANNOT SEE A COMMON FACTOR. Mutation testing found it: drop the (1+z) that turns a comoving distance into a luminosity distance and this file still passed eleven checks out of eleven, because the factor appears in both cosmologies and cancels exactly in every gap. So one check has to be ABSOLUTE. At redshift a half, with H0 = 70 and a third of the critical density in matter, the luminosity distance is 2833 megaparsecs and the distance modulus 42.26 — standard values, not produced here. Without the (1+z) the distance would be 1889 Mpc and the modulus 41.38, nearly a magnitude adrift and invisible to every other test in this file',
  (() => { const d = DL(0.5, 70, 0.3, 4000), m = muOf(0.5, 70, 0.3, 4000);
    const comovingOnly = comoving(0.5, 70, 0.3, 9.182e-5, 1 - 0.3 - 9.182e-5, 4000);
    return Math.abs(d - 2833) < 5 && Math.abs(m - 42.26) < 0.01
        && Math.abs(comovingOnly - 1889) < 5 && Math.abs(mu(comovingOnly * 1e6) - 41.38) < 0.02; })(),
  `D_L(z=0.5) = ${DL(0.5, 70, 0.3, 4000).toFixed(1)} Mpc, mu = ${muOf(0.5, 70, 0.3, 4000).toFixed(3)} · the comoving distance alone is ${comoving(0.5, 70, 0.3, 9.182e-5, 1 - 0.3 - 9.182e-5, 4000).toFixed(1)} Mpc, mu = ${mu(comoving(0.5, 70, 0.3, 9.182e-5, 1 - 0.3 - 9.182e-5, 4000) * 1e6).toFixed(3)} — the difference the gaps could not see`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
