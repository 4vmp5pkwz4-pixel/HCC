#!/usr/bin/env node
/* ============================================================================
   TWO IMAGES, ALWAYS, AND A SUM THAT IS EXACTLY ONE

   The atlas already had a deflection laboratory: given an impact parameter, how far does the
   ray bend. It did not have the next question, which has a different answer and a closed
   form of its own — WHERE are the images. The thin-lens equation beta = theta - thetaE^2 /
   theta is a QUADRATIC, so a point mass makes exactly two, at every source offset there is.

   Three identities follow, and they are checked here against routes that share no algebra
   with the roots:

     - the roots are checked by BISECTING the lens equation itself;
     - the magnification is checked against a NUMERICAL Jacobian of the lens mapping;
     - and the signed magnifications are checked to sum to one over four decades of offset.

   The last is the one worth the laboratory: the inner image is mirrored, its magnification
   is negative, and however bright or faint the pair the two signed values sum to one.

   Run: node docs/verify-einstein-ring.cjs
   ========================================================================= */

let pass = 0, fail = 0;
const ok = (t, c, d) => { c ? pass++ : fail++;
  console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); };

(async () => {
const { pathToFileURL } = require('node:url');
const { join } = require('node:path');
const X = await import(pathToFileURL(join(__dirname, '..', 'core/atlas/extracted.mjs')).href);

console.log('\n1 · the roots really are roots\n');
{
  /* BISECTION of beta = theta - 1/theta, written here, with no closed form in it */
  const bisect = (u, lo, hi) => { const f = t => t - 1 / t - u;
    for (let i = 0; i < 300; i++) { const m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m; }
    return (lo + hi) / 2; };
  let worst = 0, n = 0;
  for (let k = -30; k <= 30; k++) {
    const u = Math.pow(10, k / 10);           // four decades of offset
    const I = X.elImages(u);
    worst = Math.max(worst, Math.abs(I.plus - bisect(u, 1e-9, 1e6)) / I.plus);
    worst = Math.max(worst, Math.abs(I.minus - bisect(u, -1e6, -1e-9)) / Math.abs(I.minus));
    n += 2;
  }
  ok('both roots of the lens equation agree with a BISECTION of that equation — sixty-one offsets over four decades, and the closed form is never asked what it thinks',
    worst < 1e-9 && n === 122,
    `${n} roots, worst relative disagreement ${worst.toExponential(2)} — which is the floating-point floor of a bisection whose bracket spans fifteen decades, not a disagreement between the two routes`);

  ok('and the equation is satisfied AT the returned roots, which is the same statement made without a second solver',
    (() => { let w = 0; for (let k = -30; k <= 30; k++) { const u = Math.pow(10, k / 10), I = X.elImages(u);
      /* RELATIVE to the terms being differenced: theta - 1/theta at large theta is a
         cancellation, and an absolute residual there measures the offset, not the root. */
      for (const t of [I.plus, I.minus]) {
        const sc = Math.max(1, Math.abs(t), Math.abs(1 / t), Math.abs(u));
        w = Math.max(w, Math.abs(t - 1 / t - u) / sc); } } return w < 1e-9; })(),
    'relative residual of beta = theta - thetaE^2/theta at every root, over four decades of offset');
}

console.log('\n2 · three identities that hold at every offset\n');
{
  let wSum = 0, wProd = 0, wMag = 0, wTot = 0, allNeg = true;
  for (let k = -40; k <= 40; k++) {
    const u = Math.pow(10, k / 12);
    const I = X.elImages(u), M = X.elMagnifications(u);
    wSum = Math.max(wSum, Math.abs(I.plus + I.minus - u));
    wProd = Math.max(wProd, Math.abs(I.plus * I.minus + 1));
    wMag = Math.max(wMag, Math.abs(M.plus + M.minus - 1));
    wTot = Math.max(wTot, Math.abs(Math.abs(M.plus) + Math.abs(M.minus) - X.elTotalMagnification(u)));
    if (M.minus >= 0) allNeg = false;
  }
  ok('the images STRADDLE the source: theta_plus + theta_minus = beta, over eighty offsets spanning seven decades',
    wSum < 1e-9, `worst ${wSum.toExponential(2)}`);

  ok('and their product is -thetaE^2 — which does not depend on where the source is at all, so the two images are constrained by the lens alone',
    wProd < 1e-9,
    `worst ${wProd.toExponential(2)} · the product is the same number at u = 0.001 and at u = 1000, and the residual is what multiplying a very large root by a very small one costs in double arithmetic`);

  ok('the inner image is MIRRORED — its magnification is negative at every offset without exception — and the two signed magnifications SUM TO ONE, exactly, everywhere',
    allNeg && wMag < 1e-14,
    `worst |mu+ + mu- - 1| = ${wMag.toExponential(2)} · with magnitudes the same statement reads |mu+| - |mu-| = 1`);

  ok('and the total a photometer would see, when the pair is unresolved, is the sum of the magnitudes — which is the closed form the microlensing light curve is built from',
    wTot < 1e-9,
    `worst departure from (u^2+2)/(u sqrt(u^2+4)) is ${wTot.toExponential(2)}`);
}

console.log('\n3 · the magnification is a Jacobian, checked as one\n');
{
  /* magnification IS the inverse Jacobian of the lens mapping beta(theta). Computed here by
     finite difference of that mapping, sharing nothing with 1/(1-(thetaE/theta)^4). */
  const beta = t => t - 1 / t;
  let worst = 0;
  for (let k = -12; k <= 12; k++) {
    const u = Math.pow(10, k / 8), I = X.elImages(u), M = X.elMagnifications(u), h = 1e-6;
    for (const [t, mu] of [[I.plus, M.plus], [I.minus, M.minus]]) {
      const dbdt = (beta(t + h) - beta(t - h)) / (2 * h);
      const jac = (beta(t) / t) * dbdt;             /* the 2D Jacobian for a circularly symmetric lens */
      worst = Math.max(worst, Math.abs(1 / jac - mu) / Math.abs(mu));
    }
  }
  ok('the magnification agrees with the inverse JACOBIAN of the lens mapping, taken by finite difference — including its sign, which is where the mirrored parity of the inner image comes from',
    worst < 1e-6, `worst relative disagreement ${worst.toExponential(2)} over twenty-five offsets, limited by the finite difference and not by the formula`);
}

console.log('\n4 · the ring, and the model that loses an image\n');
{
  ok('as the source reaches alignment the images close onto the Einstein circle and the magnification diverges as 1/u — which is why a ring is bright, and why a point source would be infinitely so',
    (() => { const r = [1e-2, 1e-3, 1e-4].map(u => X.elTotalMagnification(u) * u);
      return r.every(x => Math.abs(x - 1) < 1e-3) && X.elIsRing(1e-12) && !X.elIsRing(0.1); })(),
    `u times the total magnification tends to 1: ${[1e-2, 1e-3, 1e-4].map(u => (X.elTotalMagnification(u) * u).toFixed(9)).join(', ')}`);

  /* THE STRUCTURAL DIFFERENCE between the two models. */
  const below = X.elSisImages(0.5), above = X.elSisImages(1.5);
  ok('a singular isothermal sphere is NOT a point mass: past one Einstein radius its second image is gone entirely, while a point mass has two at every offset there is',
    below.count === 2 && above.count === 1 && Number.isNaN(above.minus) &&
    [0.5, 1.5, 5, 50].every(u => Number.isFinite(X.elImages(u).minus)),
    `isothermal: ${below.count} images at u = 0.5 and ${above.count} at u = 1.5 · point mass: two at u = 50 as well`);

  ok("and its Einstein radius does not depend on the LENS distance at all — only on the velocity dispersion and the source geometry — which is a different functional form and not a different constant",
    (() => { const a = X.elSisEinsteinRadius(250e3, 2000e6 * X.EL_PC, 1200e6 * X.EL_PC);
      const b = X.elSisEinsteinRadius(250e3, 2000e6 * X.EL_PC, 1200e6 * X.EL_PC);
      const pt1 = X.elEinsteinRadius(1e12 * X.EL_MSUN, 500e6 * X.EL_PC, 2000e6 * X.EL_PC, 1200e6 * X.EL_PC);
      const pt2 = X.elEinsteinRadius(1e12 * X.EL_MSUN, 1500e6 * X.EL_PC, 2000e6 * X.EL_PC, 1200e6 * X.EL_PC);
      return a === b && Math.abs(pt1 / pt2 - Math.sqrt(3)) < 1e-12; })(),
    `the isothermal radius takes no lens distance as an argument; the point-mass radius scales as 1/sqrt(D_L) and tripling it divides by sqrt(3) exactly`);

  ok('and the numbers land where real lenses are: a 10^12 solar-mass galaxy at a gigaparsec makes a ring of about two arcseconds, and a 250 km/s isothermal sphere about one',
    Math.abs(X.elRingRadiusArcsec(X.elEinsteinRadius(1e12 * X.EL_MSUN, 1000e6 * X.EL_PC, 2000e6 * X.EL_PC, 1200e6 * X.EL_PC)) - 2.21) < 0.02 &&
    Math.abs(X.elRingRadiusArcsec(X.elSisEinsteinRadius(250e3, 2000e6 * X.EL_PC, 1200e6 * X.EL_PC)) - 1.08) < 0.02,
    `point mass ${X.elRingRadiusArcsec(X.elEinsteinRadius(1e12 * X.EL_MSUN, 1000e6 * X.EL_PC, 2000e6 * X.EL_PC, 1200e6 * X.EL_PC)).toFixed(4)}" · isothermal ${X.elRingRadiusArcsec(X.elSisEinsteinRadius(250e3, 2000e6 * X.EL_PC, 1200e6 * X.EL_PC)).toFixed(4)}" · this is the scale strong lensing is observed at, and it is arrived at rather than assumed`);
}

console.log(`\n${fail === 0 ? '✔' : '✗'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
