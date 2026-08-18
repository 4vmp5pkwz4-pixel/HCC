#!/usr/bin/env node
/* ============================================================================
   AN INTEGER READ BACK OUT OF THE FIELD THAT WAS BUILT FROM IT

   pi_3(S^2) = Z and the integer is the Hopf invariant. This laboratory has always
   DISPLAYED Q_H = p q — which is the exponent the field was constructed from, and therefore
   a label rather than a measurement of anything.

   The Hopf invariant is defined as the linking number of the preimages of any two distinct
   target points. The preimage is a torus knot in closed form, so it can be handed to the
   Gauss linking integral this atlas wrote for a different laboratory entirely — and the
   integer comes back out.

   Nothing below trusts the exponents:

     - the preimage is checked by evaluating the FIELD on it and comparing with the target;
     - the linking number is measured at seven exponent pairs and refined until the defect
       falls by the fourth power of the step;
     - the two curves are checked to be disjoint, without which a linking number means nothing;
     - Derrick's balance point is checked against a scan of the scaled energy over four
       decades, and against the algebraic fact that the two terms are EQUAL there;
     - and the sub-linear growth is measured rather than asserted, which is where this
       laboratory's own claim about a constant ratio turns out not to hold.

   Run: node docs/verify-hopfion-invariant.cjs
   ========================================================================= */

let pass = 0, fail = 0;
const ok = (t, c, d) => { c ? pass++ : fail++;
  console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); };

(async () => {
const { pathToFileURL } = require('node:url');
const { join } = require('node:path');
const X = await import(pathToFileURL(join(__dirname, '..', 'core/atlas/extracted.mjs')).href);
const PAIRS = [[1, 1], [1, 2], [2, 1], [2, 2], [1, 3], [3, 1], [2, 3]];

console.log('\n1 · the field, and the curve that is a preimage of it\n');
{
  let un = 0;
  for (const [p, q] of PAIRS) for (let k = 0; k < 800; k++) {
    const n = X.hfFieldN(p, q, Math.sin(k * 1.3) * 4, Math.cos(2.1 * k) * 4, Math.sin(3.7 * k + 1) * 4);
    un = Math.max(un, Math.abs(Math.hypot(n[0], n[1], n[2]) - 1));
  }
  ok('the field is a genuine unit vector everywhere — a map to the two-sphere and not merely into it — at 5600 points across seven exponent pairs',
    un < 1e-14, `worst departure of |n| from one ${un.toExponential(2)}`);

  let pre = 0;
  for (const [p, q] of PAIRS) for (const [th, ph] of [[1.1, 0.4], [2.0, 2.7], [0.3, 5.1]]) {
    const want = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
    for (const P of X.hfPreimage(p, q, th, ph, 300)) {
      const n = X.hfFieldN(p, q, P[0], P[1], P[2]);
      pre = Math.max(pre, Math.hypot(n[0] - want[0], n[1] - want[1], n[2] - want[2]));
    }
  }
  ok('and the curve the instrument calls a preimage IS one: the field evaluated along it returns the target point it was asked for, at twenty-one curves and 6300 points, to the floating-point floor',
    pre < 1e-13, `worst |n(curve) - n_target| ${pre.toExponential(2)} · the curve is a closed form, not a marching search, which is why there is no tolerance in it`);

  /* a linking number between curves that touch would mean nothing */
  let minSep = Infinity;
  for (const [p, q] of PAIRS) {
    const A = X.hfPreimage(p, q, 1.1, 0.4, 200), B = X.hfPreimage(p, q, 2.0, 2.7, 200);
    for (const a of A) for (const b of B) minSep = Math.min(minSep, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]));
  }
  ok('and the two preimages never touch, which is what makes a linking number between them mean anything at all',
    minSep > 0.05, `closest approach over all seven pairs ${minSep.toFixed(5)}`);
}

console.log('\n2 · the Hopf invariant, MEASURED\n');
{
  const rows = []; let worst = 0;
  for (const [p, q] of PAIRS) {
    const A = X.hfPreimage(p, q, 1.1, 0.4, 1200), B = X.hfPreimage(p, q, 2.0, 2.7, 1200);
    const lk = X.topoLinkPure(A, B);
    worst = Math.max(worst, Math.abs(Math.abs(lk) - p * q));
    rows.push(`(${p},${q}) -> ${lk.toFixed(5)} against ${p * q}`);
  }
  ok('the Gauss linking integral of the two preimages returns p q at every one of seven exponent pairs, including three where the product is the same and the exponents are not — the integer is read back OUT of the field rather than off the label',
    worst < 5e-3, rows.join(' · ') + ` · worst defect ${worst.toExponential(2)}`);

  /* and it converges, which is what separates a measurement from a coincidence */
  const d = n => { const A = X.hfPreimage(2, 3, 1.1, 0.4, n), B = X.hfPreimage(2, 3, 2.0, 2.7, n);
    return Math.abs(Math.abs(X.topoLinkPure(A, B)) - 6); };
  const d1 = d(300), d2 = d(600), d3 = d(1200);
  ok('and it CONVERGES as the curves are refined, by a factor of four for each doubling — a second-order quadrature approaching an integer, which is what a measured topological invariant looks like',
    d3 < d2 && d2 < d1 && Math.abs(d1 / d2 / 4 - 1) < 0.15 && Math.abs(d2 / d3 / 4 - 1) < 0.15,
    `defects ${d1.toExponential(2)} -> ${d2.toExponential(2)} -> ${d3.toExponential(2)} at 300, 600 and 1200 points · ratios ${(d1 / d2).toFixed(2)} and ${(d2 / d3).toFixed(2)}`);

  ok('and the charge does not depend on WHICH two target points are chosen, which is the content of the invariant — five different pairs of targets, one number',
    (() => { let w = 0;
      for (const [a, b, c, e] of [[1.1, 0.4, 2.0, 2.7], [0.5, 0, 2.6, 1], [1.5, 3, 1.6, 0.2], [0.9, 5, 2.2, 4], [2.9, 1, 0.2, 3]]) {
        const lk = X.topoLinkPure(X.hfPreimage(2, 3, a, b, 900), X.hfPreimage(2, 3, c, e, 900));
        w = Math.max(w, Math.abs(Math.abs(lk) - 6)); }
      return w < 0.02; })(),
    `every choice returns six · the Hopf invariant is a property of the map and not of where you look at it`);
}

console.log('\n3 · Derrick, and why a hopfion has a size\n');
{
  const E = X.hfEnergyPure(2, 3, 30, 4.2);
  /* the closed-form balance point against a SCAN over four decades */
  let best = Infinity, bl = 0;
  for (let k = 1; k <= 200000; k++) { const l = Math.pow(10, -2 + 4 * k / 200000), v = X.hfScaled(E.E2, E.E4, l);
    if (v < best) { best = v; bl = l; } }
  ok('the Derrick balance point sqrt(E4/E2) and the value 2 sqrt(E2 E4) agree with a two-hundred-thousand-point scan of E(lambda) over four decades — the size of a hopfion is algebra, not a search',
    Math.abs(bl - E.lambda_star) / E.lambda_star < 1e-4 && Math.abs(best - E.E_min) / E.E_min < 1e-8,
    `closed form lambda* = ${E.lambda_star.toFixed(9)} against the scan's ${bl.toFixed(9)} · E_min ${E.E_min.toFixed(6)} against ${best.toFixed(6)}`);

  ok('and the two terms are EXACTLY equal there — lambda E2 = E4/lambda is the whole of Derrick, and it is why the balance is a minimum rather than an inflection',
    Math.abs(E.lambda_star * E.E2 - E.E4 / E.lambda_star) < 1e-9 * E.E_min &&
    X.hfScaled(E.E2, E.E4, E.lambda_star * 0.9) > E.E_min &&
    X.hfScaled(E.E2, E.E4, E.lambda_star * 1.1) > E.E_min,
    `lambda E2 = ${(E.lambda_star * E.E2).toFixed(6)} and E4/lambda = ${(E.E4 / E.lambda_star).toFixed(6)} · the energy rises on both sides, by ${(X.hfScaled(E.E2, E.E4, E.lambda_star * 0.9) - E.E_min).toFixed(3)} and ${(X.hfScaled(E.E2, E.E4, E.lambda_star * 1.1) - E.E_min).toFixed(3)}`);
}

console.log('\n4 · the sub-linear bound, measured rather than asserted\n');
{
  const rows = [], Es = [];
  for (const [p, q] of PAIRS) { const E = X.hfEnergyPure(p, q, 30, 4.2), Q = p * q;
    Es.push({ Q, E: E.E_min }); rows.push(`Q=${Q}: E/Q = ${(E.E_min / Q).toFixed(1)}, E/Q^0.75 = ${(E.E_min / Math.pow(Q, 0.75)).toFixed(1)}`); }
  const byQ = [...Es].sort((a, b) => a.Q - b.Q);
  const lo = byQ[0], hi = byQ[byQ.length - 1];
  ok('the energy grows SUB-LINEARLY in the charge — the energy per unit charge falls from the single hopfion to the charge-six one, which is the content of the Vakulenko-Kapitanskii bound and is what this ansatz can honestly demonstrate',
    hi.E / hi.Q < lo.E / lo.Q * 0.8 && hi.E > lo.E,
    rows.join(' · ') + ` · energy per charge falls from ${(lo.E / lo.Q).toFixed(1)} to ${(hi.E / hi.Q).toFixed(1)}`);

  /* THE CLAIM THAT DOES NOT HOLD. */
  const vk = Es.map(e => e.E / Math.pow(e.Q, 0.75));
  const spread = (Math.max(...vk) - Math.min(...vk)) / Math.min(...vk);
  const xs = Es.map(e => Math.log(e.Q)), ys = Es.map(e => Math.log(e.E));
  const n = xs.length, sx = xs.reduce((a, b) => a + b, 0), sy = ys.reduce((a, b) => a + b, 0);
  const sxx = xs.reduce((a, b) => a + b * b, 0), sxy = xs.reduce((a, b, i) => a + b * ys[i], 0);
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  ok('but the ratio E/Q^{3/4} is NOT constant, which this laboratory said it was: it moves by a fifth across the charges this ansatz reaches, and the fitted exponent is 0.67 rather than 0.75 — because an ansatz on a finite box is not the minimiser the theorem is about, and saying so is the difference between a demonstration and a claim',
    spread > 0.15 && Math.abs(slope - 0.75) > 0.05 && slope < 1 && slope > 0.5,
    `E/Q^{3/4} runs from ${Math.min(...vk).toFixed(1)} to ${Math.max(...vk).toFixed(1)}, a spread of ${(spread * 100).toFixed(0)} per cent · fitted exponent ${slope.toFixed(4)} · sub-linear, which is the theorem, and not at three quarters, which the ansatz was never going to give`);

  ok('and swapping the two exponents keeps the charge and changes the energy, so the field is a choice of representative and the invariant is not',
    (() => { const a = X.hfEnergyPure(1, 3, 30, 4.2), b = X.hfEnergyPure(3, 1, 30, 4.2);
      return X.hfHopfCharge(1, 3) === X.hfHopfCharge(3, 1) && Math.abs(a.E_min - b.E_min) / a.E_min > 0.03; })(),
    `(1,3) and (3,1) both carry charge three and differ in energy by ${(100 * Math.abs(X.hfEnergyPure(1, 3, 30, 4.2).E_min - X.hfEnergyPure(3, 1, 30, 4.2).E_min) / X.hfEnergyPure(1, 3, 30, 4.2).E_min).toFixed(1)} per cent`);
}

console.log(`\n${fail === 0 ? '✔' : '✗'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
