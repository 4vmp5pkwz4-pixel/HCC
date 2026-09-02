#!/usr/bin/env node
/* ============================================================================
   TWO LIMITS, AND THE SAME DIGITS IN TWO UNITS

   The resolution laboratory knew one threshold -- Rayleigh's -- and drew it as a
   single cut at whatever separation the reader happened to be holding.  One cut
   is one slice of a surface, and a reader watching a dip open and close sees a
   movie of that surface and never the surface itself.

   verify-angular-resolution.cjs already asks whether a thing can be SEEN -- it
   derives the 1.22, and sizes four real instruments against it.  This file asks
   the next question, which is what "resolved" means, and finds that the atlas had
   been using the weaker of the two available answers.

   This file shares no code with the atlas, and none with that one either.  The Bessel function below is summed
   from its own series, its first zero is bisected here, and every number is
   recomputed from those two things -- so nothing is inherited from the thing it
   is checking.

   TWELVE THINGS ARE CHECKED.

   1.  The Airy pattern is the Airy pattern: unit centre, first dark ring at
       3.8317, first bright ring 1.75 per cent of the peak.
   2.  And its half-maximum radius, 1.61633, which no part of the atlas uses --
       an independent handle on the same function.
   3.  Rayleigh's criterion IS a convention, and its dip is 26.50 per cent.
   4.  Sparrow's is not a convention: the central maximum splits at 0.7767
       Rayleigh limits, found by bisecting the sign of a second derivative.
   5.  Confirmed a second way, without derivatives: the dip is exactly zero
       below it and positive above.
   6.  0.7767 RAYLEIGH LIMITS IS 0.9471 LAMBDA/D.  The 0.947 in the textbooks is
       in lambda/D, and comparing it against a number in Rayleigh limits shows a
       0.17 disagreement that does not exist.
   7.  Between Sparrow and Rayleigh the profile HAS two peaks and the convention
       still calls it unresolved.  That gap is a quarter of the ladder.
   8.  A DISPLAY CLAMP IS NOT A MEASUREMENT: min(1,I) reports no dip at 0.80
       limits where there is one.
   9.  And it is three and a half points low where it is worst.
   10. Its real damage is not error but invention: against a clamped profile the
       Sparrow search returns its own bracket floor, looking converged.
   11. The dip rises monotonically from Sparrow to two limits, then does NOT --
       the Airy rings put the centre back on a bright ring.
   12. The ladder covers both thresholds and is ordered in depth.
   ========================================================================== */
'use strict';
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

/* ---- an independent J1, summed from its series ---------------------------- */
function J1(x) {
  let term = x / 2, sum = term;
  for (let k = 1; k < 60; k++) {
    term *= -(x * x) / (4 * k * (k + 1));
    sum += term;
    if (Math.abs(term) < 1e-18) break;
  }
  return sum;
}
/* ---- and its first zero, bisected here ------------------------------------ */
const J1_ZERO = (() => {
  let lo = 3.0, hi = 4.5;
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (J1(lo) * J1(m) <= 0) hi = m; else lo = m; }
  return (lo + hi) / 2;
})();
const airy = r => { if (r < 1e-12) return 1; const v = 2 * J1(r) / r; return v * v; };
const sum = (sep, x) => { const h = sep * J1_ZERO / 2; return airy(Math.abs(x + h)) + airy(Math.abs(x - h)); };
const clamped = (sep, x) => Math.min(1, sum(sep, x));
function dipOf(f, sep) {
  const c = f(sep, 0); let pk = 0;
  for (let i = 0; i <= 4000; i++) { const x = -1.5 * J1_ZERO + 3 * J1_ZERO * i / 4000; const v = f(sep, x); if (v > pk) pk = v; }
  return pk <= 0 ? 0 : Math.max(0, 1 - c / pk);
}
const dip = sep => dipOf(sum, sep);
const dipCl = sep => dipOf(clamped, sep);
function sparrowOf(f) {
  const flat = s => { const h = 1e-3; return (f(s, h) - 2 * f(s, 0) + f(s, -h)) / (h * h) < 0; };
  let lo = 0.3, hi = 1.6;
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (flat(m)) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
const SP = sparrowOf(sum);
const inLD = sep => sep * J1_ZERO / Math.PI;

console.log('\n=== 1-2. The Airy pattern, from a series summed here ===\n');

ok('the pattern is the pattern: I(0)=1, the first dark ring at 3.8317, and the first bright ring carries 1.75 per cent of the peak — three independent points on one function, none of them taken from the atlas',
  Math.abs(airy(0) - 1) < 1e-12 && Math.abs(J1_ZERO - 3.8317059702) < 1e-8 && airy(J1_ZERO) < 1e-20 && Math.abs(airy(5.135622) - 0.0174977) < 1e-6,
  `J1 first zero ${J1_ZERO.toFixed(10)} · I(first ring peak) = ${airy(5.135622).toFixed(7)}`);

ok('AND ITS HALF-MAXIMUM RADIUS, 1.61633, which nothing in the atlas computes — so agreeing on it is agreement about the function and not about a shared constant',
  (() => { let lo = 0.5, hi = 3.0; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (airy(m) > 0.5) lo = m; else hi = m; } return Math.abs((lo + hi) / 2 - 1.616339) < 1e-5; })(),
  (() => { let lo = 0.5, hi = 3.0; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (airy(m) > 0.5) lo = m; else hi = m; } return `half-max at r = ${((lo + hi) / 2).toFixed(6)}`; })());

console.log('\n=== 3-5. Two thresholds, one bisected and one merely agreed upon ===\n');

ok('RAYLEIGH`S CRITERION IS A CONVENTION and says so: a separation somebody chose because the peak of one pattern lands on the first dark ring of the other. What it gives is a 26.50 per cent dip — computed here, not quoted',
  Math.abs(dip(1) - 0.26497) < 5e-5,
  `dip at one Rayleigh limit = ${(100 * dip(1)).toFixed(3)} per cent`);

ok('SPARROW`S IS NOT A CONVENTION but a fact about the profile — the separation at which the central maximum splits into two — and it lands at 0.7767 Rayleigh limits',
  Math.abs(SP - 0.776567) < 1e-4,
  `second derivative at the centre changes sign at ${SP.toFixed(6)} Rayleigh limits`);

ok('and it is confirmed a second way, WITHOUT DERIVATIVES: the dip is exactly zero below it and positive above. Two routes to one threshold, sharing no arithmetic beyond the profile itself',
  dip(SP - 0.02) === 0 && dip(SP + 0.02) > 0 && dip(SP - 0.001) === 0 && dip(SP + 0.001) > 0,
  `dip at ${(SP - 0.02).toFixed(4)} = ${dip(SP - 0.02)} · at ${(SP + 0.02).toFixed(4)} = ${(100 * dip(SP + 0.02)).toFixed(4)} per cent`);

console.log('\n=== 6-7. The same digits in two units ===\n');

ok('0.7767 RAYLEIGH LIMITS IS 0.9471 LAMBDA OVER D, and the 0.947 that textbooks quote for Sparrow is in lambda/D. Set the two side by side without converting and they look 0.17 apart — a disagreement of eighteen per cent that is entirely a unit. This is the failure the atlas`s quantity bus refuses couplings over, met here in arithmetic instead of in a name',
  Math.abs(inLD(SP) - 0.9471) < 5e-4 && Math.abs(inLD(1) - 1.21967) < 1e-5 && Math.abs(SP - 0.947) > 0.15,
  `Sparrow = ${SP.toFixed(6)} Rayleigh limits = ${inLD(SP).toFixed(6)} λ/D · Rayleigh = 1 limit = ${inLD(1).toFixed(5)} λ/D · the naive difference is ${Math.abs(SP - 0.947).toFixed(4)}, and it is a unit and not an error`);

ok('BETWEEN THE TWO THRESHOLDS THE PROFILE HAS TWO PEAKS AND THE CONVENTION STILL CALLS IT UNRESOLVED. That gap runs from 0.7767 to 1, about a ninth of the ladder the laboratory draws, and it is the reason to draw a ladder rather than a line',
  SP < 1 && dip(0.85) > 0 && dip(0.85) < 0.26497 && dip(0.9) > 0 && dip(0.9) < 0.26497,
  `at 0.85 limits the dip is ${(100 * dip(0.85)).toFixed(2)} per cent and at 0.90 it is ${(100 * dip(0.9)).toFixed(2)} — real dips, both below the convention`);

console.log('\n=== 8-10. A display clamp is not a measurement ===\n');

ok('MIN(1,I) REPORTS NO DIP AT 0.80 LIMITS WHERE THERE IS ONE. The clamp is right for painting a texture, which cannot show more than white, and wrong for measuring a contrast, because it flattens the peak the contrast is measured against',
  dipCl(0.80) === 0 && dip(0.80) > 0.004,
  `clamped ${(100 * dipCl(0.80)).toFixed(4)} per cent · unclamped ${(100 * dip(0.80)).toFixed(4)} per cent`);

ok('and where it is worst it is three and a half points low, which is the kind of error that survives review because it looks like a rounding',
  (() => { let w = 0; for (let s = 0.75; s <= 1.3; s += 0.005) w = Math.max(w, dip(s) - dipCl(s)); return w > 0.03 && w < 0.05; })(),
  (() => { let w = 0, at = 0; for (let s = 0.75; s <= 1.3; s += 0.005) { const d = dip(s) - dipCl(s); if (d > w) { w = d; at = s; } } return `worst understatement ${(100 * w).toFixed(2)} points, at ${at.toFixed(3)} limits`; })());

ok('ITS REAL DAMAGE IS NOT THE ERROR BUT THE ANSWER IT INVENTS. A clamped profile has an exactly flat top, so its second derivative is zero rather than negative, the split test never fires, and the bisection walks to the bottom of its own bracket and returns that — 0.300, with every appearance of having converged. A wrong number that looks like a measurement is worse than a missing one',
  Math.abs(sparrowOf(clamped) - 0.300) < 1e-6 && Math.abs(SP - 0.300) > 0.4,
  `Sparrow through the clamp = ${sparrowOf(clamped).toFixed(6)} — the bracket floor exactly — against a true ${SP.toFixed(6)}`);

console.log('\n=== 11-12. The ladder ===\n');

ok('the dip rises monotonically from Sparrow up to two limits AND THEN DOES NOT: past two the centre of the pair falls back onto a bright Airy ring and the contrast slips. A ladder drawn to 2.4 limits shows that, and a check that assumed monotonicity everywhere would be asserting something false',
  (() => { const up = [0.8, 0.9, 1.0, 1.2, 1.6, 2.0]; const rising = up.every((v, i) => i === 0 || dip(v) > dip(up[i - 1])); return rising && dip(2.4) < dip(2.0); })(),
  `dip at 2.0 = ${(100 * dip(2.0)).toFixed(3)} per cent · at 2.4 = ${(100 * dip(2.4)).toFixed(3)} per cent — it goes back down`);

ok('and the ladder the laboratory stacks in depth spans 0.40 to 2.40 limits in nine rungs, which brackets both thresholds with room either side, and maps to depth monotonically so that nearer means closer together',
  (() => { const LO = 0.40, HI = 2.40, N = 9;
    const sep = k => LO + (HI - LO) * k / (N - 1);
    const z = s => 0.18 - 1.62 * Math.max(0, Math.min(1, (s - LO) / (HI - LO)));
    let mono = true; for (let k = 1; k < N; k++) if (!(z(sep(k)) < z(sep(k - 1)))) mono = false;
    return LO < SP && HI > 1 && mono && Math.abs(sep(4) - 1.4) < 1e-9; })(),
  `rungs 0.40 … 2.40 in nine steps · Sparrow ${SP.toFixed(4)} and Rayleigh 1.0000 both inside · depth strictly decreasing`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
