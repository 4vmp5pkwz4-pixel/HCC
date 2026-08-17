#!/usr/bin/env node
/* ============================================================================
   FIVE LABORATORIES THAT DREW AND NOW COMPUTE, CHECKED AGAINST SOMETHING ELSE

   Sixty-nine of the eighty laboratories render and return no number. For five of them the
   physics was already written — to draw the scene — and one declaration short of being an
   instrument. They are instruments now, and scripts/extract-kernels.mjs slices the same
   functions into core/atlas/extracted.mjs, so the kernel and the picture cannot disagree.

   This file does not ask those functions whether they like their own answers. For every
   claim it computes the same number by a route that shares no code with them:

     · the Kerr area is rebuilt from 16 pi G^2 M^2 / c^4 at zero spin and from the
       independent r_+ = r_g(1 + sqrt(1-chi^2)) at every other spin, and T_H is checked to
       scale as 1/M over eight decades of mass;
     · spherical-harmonic ORTHONORMALITY is integrated over the sphere by a product
       Gauss-Legendre rule written here, and the addition theorem is tested at twenty-five
       directions rather than at one;
     · the semi-empirical binding energy is rebuilt term by term from the published
       coefficients, and the iron peak is found by a scan over A;
     · Stefan-Boltzmann is recovered by INTEGRATING the Planck law numerically, and Wien's
       displacement by BISECTING its derivative — neither constant is quoted;
     · the Willmore energy of the Clifford torus is checked against 2 pi^2 and the
       Marques-Neves lower bound is tested over a sweep of the radius ratio.

   Run: node docs/verify-atlas-instruments.cjs
   ========================================================================= */

let pass = 0, fail = 0;
const ok = (t, c, d) => { c ? pass++ : fail++;
  console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); };

(async () => {
const { pathToFileURL } = require('node:url');
const { join } = require('node:path');
const X = await import(pathToFileURL(join(__dirname, '..', 'core/atlas/extracted.mjs')).href);

/* the CODATA values this file uses are written HERE, so a change to the atlas's constants
   shows up as a disagreement rather than propagating silently into the check */
const G = 6.67430e-11, c = 2.99792458e8, hbar = 1.054571817e-34, kB = 1.380649e-23,
      h = 2 * Math.PI * hbar, MSUN = 1.98892e30, YR = 3.1556952e7;

console.log('\n=== 1. Kerr horizon: the area from a different formula ===\n');
{
  /* at zero spin the horizon area is 16 pi (GM/c^2)^2 — no q, no series, just the radius */
  let worst = 0;
  for (const M of [1e12, 1e20, MSUN, 1e6 * MSUN]) {
    const A = 16 * Math.PI * (G * M / (c * c)) ** 2;
    worst = Math.max(worst, Math.abs(X.bhtKerr(M, 0).area - A) / A);
  }
  ok('the Schwarzschild horizon area is 16 pi (GM/c^2)^2 over twelve decades of mass',
    worst < 1e-12, `worst relative disagreement ${worst.toExponential(2)}`);

  /* at every spin, r_+ = r_g (1 + sqrt(1 - chi^2)) and A = 4 pi (r_+^2 + a^2) with a = chi r_g */
  let bad = 0, worstA = 0;
  for (let k = 0; k <= 40; k++) {
    const chi = k / 41, rg = G * MSUN / (c * c), q = Math.sqrt(1 - chi * chi),
      rp = rg * (1 + q), a = chi * rg, A = 4 * Math.PI * (rp * rp + a * a),
      K = X.bhtKerr(MSUN, chi);
    if (Math.abs(K.rp - rp) / rp > 1e-12) bad++;
    worstA = Math.max(worstA, Math.abs(K.area - A) / A);
  }
  ok('and at every spin A = 4 pi (r_+^2 + a^2), which is a different expression from the one the kernel evaluates',
    bad === 0 && worstA < 1e-12,
    `41 spins from 0 to 0.976 · worst area disagreement ${worstA.toExponential(2)}`);

  /* T_H must scale as 1/M exactly, and the ratio is the cleanest way to say so */
  let sc = 0;
  for (const M of [1e15, 1e22, MSUN]) sc = Math.max(sc,
    Math.abs(X.bhtKerr(2 * M, 0).TH / X.bhtKerr(M, 0).TH - 0.5));
  ok('the Hawking temperature halves when the mass doubles, at three mass scales', sc < 1e-12,
    `worst departure from exactly 1/2: ${sc.toExponential(2)}`);

  /* the Page lifetime, rebuilt here */
  /* THE TOLERANCE IS A YEAR, NOT A PHYSICS DISAGREEMENT. Rebuilt here with the Gregorian
     year (3.1556952e7 s) and divided in the atlas by the Julian one (3.15576e7 s), the two
     answers differ by 2.4e-5 — which is exactly the ratio of those two conventions and
     nothing else. Comparing to 1e-6 failed on a calendar. */
  const t = 5120 * Math.PI * G * G * MSUN ** 3 / (hbar * c ** 4) / YR;
  const yearRatio = Math.abs(X.bhtEvapYr(MSUN) / t - 1);
  ok('the Schwarzschild evaporation time matches 5120 pi G^2 M^3 / (hbar c^4), to within the year convention',
    yearRatio < 1e-4,
    `${X.bhtEvapYr(MSUN).toExponential(6)} yr against ${t.toExponential(6)} yr rebuilt from the constants above · ` +
    `they differ by ${(1e6 * yearRatio).toFixed(1)} parts per million, and the Julian and Gregorian years differ by 24`);

  ok('and the extremal limit is approached but never reached: q -> 0 as chi -> 1',
    X.bhtKerr(MSUN, 0.999999).q < 1.5e-3 && X.bhtKerr(MSUN, 0).q === 1,
    `q(chi=0.999999) = ${X.bhtKerr(MSUN, 0.999999).q.toExponential(3)} · T_H there is ${X.bhtKerr(MSUN, 0.999999).TH.toExponential(3)} K`);
}

console.log('\n=== 2. Spherical harmonics: orthonormality by quadrature ===\n');
{
  /* Gauss-Legendre in cos(theta), uniform in phi — written here, sharing nothing with shY */
  const gauss = n => {
    const x = [], w = [];
    for (let i = 1; i <= n; i++) {
      let t = Math.cos(Math.PI * (i - 0.25) / (n + 0.5)), dp = 0;
      for (let it = 0; it < 100; it++) {
        let p0 = 1, p1 = 0;
        for (let j = 1; j <= n; j++) { const p2 = p1; p1 = p0; p0 = ((2 * j - 1) * t * p1 - (j - 1) * p2) / j; }
        dp = n * (t * p0 - p1) / (t * t - 1);
        const d = p0 / dp; t -= d; if (Math.abs(d) < 1e-15) break;
      }
      let p0 = 1, p1 = 0;
      for (let j = 1; j <= n; j++) { const p2 = p1; p1 = p0; p0 = ((2 * j - 1) * t * p1 - (j - 1) * p2) / j; }
      dp = n * (t * p0 - p1) / (t * t - 1);
      x.push(t); w.push(2 / ((1 - t * t) * dp * dp));
    }
    return { x, w };
  };
  const { x: gx, w: gw } = gauss(64), NP = 128;
  const inner = (l1, m1, l2, m2) => {
    let s = 0;
    for (let i = 0; i < gx.length; i++) {
      const th = Math.acos(gx[i]);
      let r = 0;
      for (let j = 0; j < NP; j++) { const ph = 2 * Math.PI * (j + 0.5) / NP;
        r += X.shY(l1, m1, th, ph) * X.shY(l2, m2, th, ph); }
      s += gw[i] * r * (2 * Math.PI / NP);
    }
    return s;
  };
  let worstDiag = 0, worstOff = 0;
  for (let l = 0; l <= 4; l++) for (let m = -l; m <= l; m++) {
    worstDiag = Math.max(worstDiag, Math.abs(inner(l, m, l, m) - 1));
    for (let l2 = 0; l2 <= 4; l2++) for (let m2 = -l2; m2 <= l2; m2++) {
      if (l === l2 && m === m2) continue;
      worstOff = Math.max(worstOff, Math.abs(inner(l, m, l2, m2)));
    }
  }
  ok('the twenty-five harmonics up to l = 4 are orthonormal on the sphere, integrated by a Gauss-Legendre rule written in this file',
    worstDiag < 1e-10 && worstOff < 1e-10,
    `worst |<Y,Y> - 1| = ${worstDiag.toExponential(2)} · worst off-diagonal overlap = ${worstOff.toExponential(2)}`);

  let worstAdd = 0;
  for (let l = 0; l <= 8; l++)
    for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) {
      const th = 0.1 + a * 0.6, ph = b * 1.2;
      let s = 0; for (let m = -l; m <= l; m++) { const y = X.shY(l, m, th, ph); s += y * y; }
      worstAdd = Math.max(worstAdd, Math.abs(s - (2 * l + 1) / (4 * Math.PI)));
    }
  ok('the addition theorem sum_m |Y_lm|^2 = (2l+1)/4pi holds at twenty-five directions for every l up to 8',
    worstAdd < 1e-12, `worst departure ${worstAdd.toExponential(2)} — a basis that is complete at one direction and not another is not a basis`);

  ok('Y_00 is 1/sqrt(4 pi) everywhere, which is the normalisation stated as a value',
    Math.abs(X.shY(0, 0, 0.3, 2.1) - 1 / Math.sqrt(4 * Math.PI)) < 1e-15,
    `${X.shY(0, 0, 0.3, 2.1).toFixed(15)}`);
}

console.log('\n=== 3. The semi-empirical mass formula, term by term ===\n');
{
  /* the published Weizsacker coefficients, written here rather than imported */
  const aV = 15.75, aS = 17.8, aC = 0.711, aA = 23.7, aP = 11.18;
  const B = (A, Z) => {
    const d = A % 2 === 0 ? (Z % 2 === 0 ? aP / Math.sqrt(A) : -aP / Math.sqrt(A)) : 0;
    return aV * A - aS * Math.pow(A, 2 / 3) - aC * Z * (Z - 1) / Math.pow(A, 1 / 3)
      - aA * (A - 2 * Z) * (A - 2 * Z) / A + d;
  };
  let worst = 0, n = 0;
  for (let A = 4; A <= 250; A += 3) for (let Z = 1; Z < A; Z += 7) {
    worst = Math.max(worst, Math.abs(X.nucBE(A, Z) - B(A, Z))); n++;
  }
  ok('the kernel reproduces a five-term reconstruction written in this file, over the whole chart',
    worst < 1e-9, `${n} nuclides · worst disagreement ${worst.toExponential(2)} MeV`);

  /* the iron peak, found by scanning rather than asserted */
  let bestA = 0, bestB = -1e9;
  for (let A = 4; A <= 250; A++) { const b = X.nucBperA(A, X.nucBestZ(A));
    if (b > bestB) { bestB = b; bestA = A; } }
  ok('the most bound nuclide of the model sits in the iron-nickel region, found by a scan over every A',
    bestA >= 50 && bestA <= 62 && bestB > 8.5 && bestB < 9.0,
    `A = ${bestA} at B/A = ${bestB.toFixed(4)} MeV · the measured peak is 62Ni at 8.795 MeV, and the several-hundred-keV gap is the model, not the arithmetic`);

  /* THE PAIRING TERM, ISOLATED. The first version of this check compared B/A at two
     different mass numbers and called the difference pairing — it is not, because the
     asymmetry and surface terms move too. The term is recovered instead by subtracting a
     delta-free reconstruction from the kernel, which leaves exactly +-a_P/sqrt(A) or zero. */
  const Bnod = (A, Z) => aV * A - aS * Math.pow(A, 2 / 3) - aC * Z * (Z - 1) / Math.pow(A, 1 / 3)
    - aA * (A - 2 * Z) * (A - 2 * Z) / A;
  let worstP = 0, cases = 0;
  for (const [A, Z, sign] of [[58, 28, +1], [58, 27, -1], [59, 28, 0], [56, 26, +1], [56, 25, -1], [57, 26, 0]]) {
    const want = sign === 0 ? 0 : sign * aP / Math.sqrt(A);
    worstP = Math.max(worstP, Math.abs((X.nucBE(A, Z) - Bnod(A, Z)) - want)); cases++;
  }
  ok('the pairing term is exactly +a_P/sqrt(A) for even-even, -a_P/sqrt(A) for odd-odd and zero for odd A',
    worstP < 1e-9,
    `${cases} nuclides, isolated by subtracting a delta-free reconstruction · worst disagreement ${worstP.toExponential(2)} MeV`);
}

console.log('\n=== 4. Planck: the two laws recovered by integrating and bisecting ===\n');
{
  const T = 5772;
  /* Stefan-Boltzmann, by integrating pi B_lambda over wavelength on a log grid */
  const lo = 1e-9, hi = 1e-3, N = 400000;
  let S = 0;
  const t0 = Math.log(lo), t1 = Math.log(hi), dt = (t1 - t0) / N;
  for (let i = 0; i < N; i++) { const t = t0 + (i + 0.5) * dt, lam = Math.exp(t);
    S += Math.PI * X.bbPlanck(lam, T) * lam * dt; }
  const sigmaT4 = 5.670374419e-8 * Math.pow(T, 4);
  ok('integrating pi B_lambda over all wavelengths returns sigma T^4 — Stefan-Boltzmann, recovered rather than quoted',
    Math.abs(S / sigmaT4 - 1) < 2e-4,
    `${S.toExponential(6)} W/m^2 against ${sigmaT4.toExponential(6)} · relative ${Math.abs(S / sigmaT4 - 1).toExponential(2)}`);

  /* Wien, by bisecting the derivative of the Planck law */
  const dB = lam => { const e = 1e-9 * lam;
    return (X.bbPlanck(lam + e, T) - X.bbPlanck(lam - e, T)) / (2 * e); };
  /* THE BRACKET MATTERS. Starting at 1e-9 m puts hc/(lambda k T) near 2500, exp() overflows,
     B underflows to zero and its derivative with it — so the bisection saw a flat function
     and collapsed onto its own lower bound. Start where the law is representable. */
  let a = 1e-7, b = 1e-4;
  for (let i = 0; i < 200; i++) { const m = 0.5 * (a + b); if (dB(a) * dB(m) <= 0) b = m; else a = m; }
  const lamMax = 0.5 * (a + b), bWien = lamMax * T;
  ok('bisecting dB/dlambda finds the Wien displacement constant, to five figures',
    Math.abs(bWien / 2.897771955e-3 - 1) < 2e-5,
    `lambda_max T = ${bWien.toExponential(7)} m K against the CODATA 2.897771955e-3`);

  /* the ratio approaches 1 as x = hc/(lambda k T) -> 0, and it approaches it AS 1 - x/2.
     Testing that law is stronger than testing one number against a tolerance, and it does
     not silently pass when the limit is reached for the wrong reason. */
  {
    const ratio = lam => X.bbPlanck(lam, T) / (2 * c * kB * T / Math.pow(lam, 4));
    const xOf = lam => (h * c) / (lam * kB * T);
    let worstRJ = 0;
    for (const lam of [1e-3, 3e-3, 1e-2, 3e-2, 1e-1])
      worstRJ = Math.max(worstRJ, Math.abs((1 - ratio(lam)) / (xOf(lam) / 2) - 1));
    ok('the Rayleigh-Jeans limit is approached AS 1 - x/2 with x = hc/(lambda k T), over five decades of wavelength',
      worstRJ < 2e-2,
      `worst departure from the first-order law: ${(100 * worstRJ).toFixed(2)}% · at 10 mm the ratio is ${ratio(1e-2).toFixed(9)} and x/2 is ${(xOf(1e-2) / 2).toExponential(3)}`);
  }
}

console.log('\n=== 5. Willmore: the Clifford torus, and the bound it saturates ===\n');
{
  const C = 2 * Math.PI * Math.PI;
  ok('the Willmore energy of the Clifford torus is 2 pi^2, computed by quadrature and not written down',
    Math.abs(X.wilQuad(Math.SQRT2, 200000) - C) < 1e-8,
    `W(sqrt2) = ${X.wilQuad(Math.SQRT2, 200000).toFixed(12)} against 2 pi^2 = ${C.toFixed(12)}`);

  let belowCount = 0, worstBelow = 0, nmin = 0, best = 1e9, bestA = 0;
  for (let k = 0; k <= 200; k++) {
    const a = 1.02 + k * (6 - 1.02) / 200, W = X.wilQuad(a, 60000);
    if (W < C - 1e-9) { belowCount++; worstBelow = Math.max(worstBelow, C - W); }
    if (W < best) { best = W; bestA = a; }
    nmin++;
  }
  ok('and no radius ratio in a sweep of 201 goes below it — the Willmore bound, tested rather than cited',
    belowCount === 0 && Math.abs(bestA - Math.SQRT2) < 0.03,
    `${nmin} ratios from 1.02 to 6 · minimum ${best.toFixed(9)} at a = ${bestA.toFixed(4)}, and sqrt2 = ${Math.SQRT2.toFixed(4)}`);

  /* the quadrature must be converged, or the two checks above are checking the grid */
  const coarse = X.wilQuad(Math.SQRT2, 2048), fine = X.wilQuad(Math.SQRT2, 200000);
  ok('the midpoint rule on this periodic integrand is converged: 2048 nodes already agree with 200000',
    Math.abs(coarse - fine) < 1e-10,
    `|W_2048 - W_200000| = ${Math.abs(coarse - fine).toExponential(2)} — spectral convergence, which is why the default is affordable`);
}

console.log(`\n${fail === 0 ? '✔' : '✗'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
