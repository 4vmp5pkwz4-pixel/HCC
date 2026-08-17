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

console.log('\n=== 6. Kramers-Kronig: both halves in closed form ===\n');
{
  /* the Lorentz oscillator has an exact real and imaginary part; the dispersion integral
     has to rebuild one from the other, and the gap is discretisation, not physics */
  const chi = (w, g, w0, wp) => { const dr = w0 * w0 - w * w, D = dr * dr + g * g * w * w;
    return { re: wp * wp * dr / D, im: wp * wp * g * w / D }; };
  let worst = 0, n = 0;
  for (const g of [0.2, 0.5]) for (let i0 = 40; i0 <= 900; i0 += 70) {
    const w = i0 * X.CAU_H, e = chi(w, g, 1, 1);
    worst = Math.max(worst, Math.abs(X.cauKK(i0, g, 1, 1) - e.re)); n++;
  }
  ok('the dispersion integral rebuilds Re chi from Im chi alone, against the closed form',
    worst < 5e-3, `${n} frequencies at two dampings · worst |KK - exact| = ${worst.toExponential(2)} on a grid of ${X.CAU_N} points`);

  /* the f-sum rule is a different statement: it constrains the AREA, not any one value */
  /* THE RESIDUAL IS THE TAIL, AND THE TAIL HAS A LAW. A Lorentzian's w Im chi falls as
     wp^2 g / w, so everything beyond a cutoff W contributes about wp^2 g / W and the
     shortfall must halve when the cutoff doubles. Testing THAT is stronger than testing one
     number against a tolerance: a tolerance passes for the wrong reason, a law does not.
     The first version of this check compared a single truncated integral at W = 60 to the
     exact area and failed by 1% at g = 1 — which was the tail, correctly present. */
  const shortfall = (g, wp, W) => (Math.PI / 2 * wp * wp - X.cauSum(g, 1, wp, Math.round(400 * W), W));
  let worstLaw = 0, rows = [];
  for (const g of [0.2, 1]) for (const wp of [1, 2]) {
    const s1 = shortfall(g, wp, 120), s2 = shortfall(g, wp, 240), s3 = shortfall(g, wp, 480);
    worstLaw = Math.max(worstLaw, Math.abs(s1 / s2 - 2), Math.abs(s2 / s3 - 2));
    rows.push(`g=${g} wp=${wp}: ${s1.toExponential(2)} -> ${s2.toExponential(2)} -> ${s3.toExponential(2)}`);
  }
  ok('and the f-sum shortfall is the truncated tail: it HALVES every time the cutoff doubles, as wp^2 g / W says it must',
    worstLaw < 0.05,
    `${rows[0]} · worst departure from a factor of two: ${(100 * worstLaw).toFixed(2)}% — the damping broadens the line and moves none of the area`);
}

console.log('\n=== 7. Schwarzschild deflection: the exact integral against its own limit ===\n');
{
  ok('the photon sphere sits at b_crit = (3 sqrt3 / 2) r_s',
    Math.abs(X.LENS_BCRIT - 3 * Math.sqrt(3) / 2 * X.LENS_RS) < 1e-12,
    `${X.LENS_BCRIT.toFixed(9)} against ${(3 * Math.sqrt(3) / 2 * X.LENS_RS).toFixed(9)}`);

  ok('inside it the ray is captured and NO deflection is returned — null, not a large number',
    X.lensAlpha(X.LENS_BCRIT * 0.999) === null && X.lensAlpha(X.LENS_BCRIT * 1.5) !== null,
    'a captured ray has no exit direction, so there is no angle to measure to');

  /* the weak-field term is the first of a series; the exact answer must approach it, and
     the DIFFERENCE must fall as 1/b^2, which is a sharper statement than "they are close" */
  let worstLaw = 0;
  for (const b of [200, 400, 800, 1600]) {
    const a = X.lensAlpha(b), w = 2 * X.LENS_RS / b;
    const excess = a - w, predicted = 15 * Math.PI / 16 * (X.LENS_RS / b) ** 2;
    worstLaw = Math.max(worstLaw, Math.abs(excess / predicted - 1));
  }
  ok('the excess over 4GM/c^2b falls as the second post-Newtonian term (15 pi / 16)(r_s/b)^2',
    worstLaw < 2e-2,
    `worst departure from the second-order coefficient: ${(100 * worstLaw).toFixed(2)}% over four impact parameters`);

  let mono = true;
  for (let k = 0; k < 30; k++) { const b1 = 3 + k * 2, b2 = b1 + 2;
    if (!(X.lensAlpha(b1) > X.lensAlpha(b2))) mono = false; }
  ok('and the deflection decreases monotonically with impact parameter, over thirty pairs', mono,
    `alpha(3 r_s) = ${X.lensAlpha(3).toFixed(6)} rad down to alpha(63 r_s) = ${X.lensAlpha(63).toFixed(6)} rad`);
}

console.log('\n=== 8. The free rigid body: two invariants, held along the motion ===\n');
{
  let worstE = 0, worstL = 0, n = 0;
  for (const [I1, I2, I3, E, L2] of [[1, 2, 3, 1, 2.5], [1, 2, 3, 1, 3.5], [0.5, 1.5, 4, 2, 5], [1, 1.9, 2.1, 1, 3.9]])
    for (let k = 0; k < 40; k++) {
      const t = k * 0.37, P = X.poinSolve(I1, I2, I3, E, L2), w = X.poinOmega(P, t);
      const E2 = 0.5 * (I1 * w[0] ** 2 + I2 * w[1] ** 2 + I3 * w[2] ** 2);
      const L = I1 * I1 * w[0] ** 2 + I2 * I2 * w[1] ** 2 + I3 * I3 * w[2] ** 2;
      worstE = Math.max(worstE, Math.abs(E2 - E) / E);
      worstL = Math.max(worstL, Math.abs(L - L2) / L2); n++;
    }
  ok('both quadratic invariants are conserved along the elliptic solution, at 160 times across four bodies',
    worstE < 1e-12 && worstL < 1e-12,
    `worst relative drift: energy ${worstE.toExponential(2)}, angular momentum ${worstL.toExponential(2)} — they are not integrated, they are solved`);

  /* THE SEPARATRIX IS AT 2 E I2, NOT 2 E I1. The first version of this check probed
     L^2 = 2 = 2 E I1, which is the LOWER EDGE of the allowed range — steady rotation about
     the smallest axis, where k -> 0 and nothing diverges. The separatrix of I1,I2,I3 = 1,2,3
     at E = 1 is L^2 = 4, and that is where k -> 1 and the period goes logarithmic. */
  const SEP = 2 * 1 * 2;
  const below = X.poinSolve(1, 2, 3, 1, SEP - 0.1), above = X.poinSolve(1, 2, 3, 1, SEP + 0.1);
  const kLo = X.poinSolve(1, 2, 3, 1, SEP - 1e-7).k, kHi = X.poinSolve(1, 2, 3, 1, SEP + 1e-7).k;
  ok('the separatrix L^2 = 2 E I2 is where the solution changes branch and the elliptic modulus approaches 1',
    below.hi === false && above.hi === true && kLo > 0.999 && kHi > 0.999,
    `branch flips at L^2 = ${SEP} · k just below is ${kLo.toFixed(9)} and just above ${kHi.toFixed(9)} — the period diverges there, which IS the Dzhanibekov flip`);
}

console.log('\n=== 9. The standard map: area preservation and the two limits ===\n');
{
  /* the Jacobian of one step is exactly 1 for every K — area preservation, tested rather
     than cited, on a finite difference of the map the kernel actually iterates */
  let worstJ = 0;
  for (const K of [0, 0.5, 1, 3, 9]) for (const th of [0.3, 1.7, 4.2]) for (const p of [0.2, 2.9]) {
    const e = 1e-6;
    const a = X.kamStep(th + e, p, K), b = X.kamStep(th - e, p, K),
          c2 = X.kamStep(th, p + e, K), d = X.kamStep(th, p - e, K);
    const J = ((a[0] - b[0]) / (2 * e)) * ((c2[1] - d[1]) / (2 * e))
            - ((c2[0] - d[0]) / (2 * e)) * ((a[1] - b[1]) / (2 * e));
    worstJ = Math.max(worstJ, Math.abs(J - 1));
  }
  ok('one step of the map preserves area: its Jacobian determinant is 1 at every kick strength tested',
    worstJ < 1e-5, `thirty (K, theta, p) triples · worst |det J - 1| = ${worstJ.toExponential(2)}`);

  ok('at K = 0 the map is integrable and the exponent is exactly zero',
    X.kamLyapunov(0, 2000, 40) === 0, 'no stretching without a kick');

  let worstAsym = 0;
  for (const K of [6, 10, 16]) worstAsym = Math.max(worstAsym,
    Math.abs(X.kamLyapunov(K, 20000, 60) / Math.log(K / 2) - 1));
  ok('and at large K it approaches ln(K/2) from above, the standard-map asymptotic',
    worstAsym < 0.06,
    `worst relative departure ${(100 * worstAsym).toFixed(2)}% at K = 6, 10 and 16 — approached from above, as the finite-time average should be`);
}

console.log('\n=== 10. Two integers that cannot be almost right ===\n');
{
  /* the linking number of two distinct Hopf fibres is 1 in magnitude, whichever two they
     are — that is the statement, and it is tested across the base sphere rather than once */
  let worstDefect = 0, n = 0; const wrong = [];
  for (const t1 of [0.05, 0.4, 0.9, 1.6, 2.4, 3.05]) for (const t2 of [0.7, 1.3, 2.1, 2.8, 3.09]) {
    if (Math.abs(t1 - t2) < 0.2) continue;
    const [A, B] = X.topoHopfPair(t1, t2, 0, 1.3, 400);
    const lk = X.topoLinkPure(A, B);
    if (Math.abs(Math.round(lk)) !== 1) wrong.push(`(${t1}, ${t2}) -> ${lk.toFixed(6)}`);
    worstDefect = Math.max(worstDefect, Math.abs(lk - Math.round(lk))); n++;
  }
  /* This check FAILED when written, and it was the kernel that was wrong: the pure copy of
     the fibre projected from w = 1.6 - z2i, a centre outside S^3, which is two-to-one — four
     of sixteen pairs came back 0. The check named the pairs, the projection was corrected to
     the stereographic w = 1 - z2i the renderer already used, and the defect fell 30-fold. */
  ok('any two distinct Hopf fibres link exactly once, over a sweep of the whole declared base-angle domain',
    wrong.length === 0 && worstDefect < 5e-4,
    wrong.length
      ? `${wrong.length} of ${n} pairs do NOT round to +-1: ${wrong.slice(0, 4).join(' · ')}`
      : `${n} pairs spanning theta in [0.05, 3.09] · every one rounds to +-1 · worst distance to the integer ${worstDefect.toExponential(2)}, which is the polygon and not the topology`);

  /* the defect must FALL as the polygons refine — otherwise the integer is a coincidence */
  const d = N => { const [A, B] = X.topoHopfPair(0.9, 2.1, 0, 1.3, N);
    const lk = X.topoLinkPure(A, B); return Math.abs(lk - Math.round(lk)); };
  const d1 = d(120), d2 = d(240), d3 = d(480);
  ok('and the distance to that integer falls as the polygons refine, so the integer is the answer and not a coincidence',
    d2 < d1 && d3 < d2,
    `${d1.toExponential(2)} -> ${d2.toExponential(2)} -> ${d3.toExponential(2)} at 120, 240 and 480 vertices`);

  /* the two symmetries the Gauss integral must have, to machine precision */
  const [A, B] = X.topoHopfPair(0.9, 2.1, 0, 1.3, 300);
  ok('the Gauss integral is symmetric in its two curves and antisymmetric under reversing one',
    Math.abs(X.topoLinkPure(A, B) - X.topoLinkPure(B, A)) < 1e-12 &&
    Math.abs(X.topoLinkPure(A, B) + X.topoLinkPure(A, B.slice().reverse())) < 1e-12,
    `|Lk(A,B) - Lk(B,A)| = ${Math.abs(X.topoLinkPure(A, B) - X.topoLinkPure(B, A)).toExponential(2)} · ` +
    `|Lk(A,B) + Lk(A,-B)| = ${Math.abs(X.topoLinkPure(A, B) + X.topoLinkPure(A, B.slice().reverse())).toExponential(2)}`);

  /* winding: a smooth perturbation cannot move a homotopy invariant until it adds a zero */
  let moved = 0, tested = 0, worstW = 0;
  for (const q of [-3, -1, 0, 2, 5]) for (const a of [0, 0.3, 0.8]) {
    const w = X.dfxWinding(q, [{ a, k: 2, p: 0.4 }], 4000);
    if (Math.round(w) !== q) moved++;
    worstW = Math.max(worstW, Math.abs(w - q)); tested++;
  }
  ok('a smooth phase perturbation leaves the winding number exactly where it was — homotopy invariance, measured',
    moved === 0 && worstW < 1e-9,
    `${tested} (q, amplitude) pairs · worst departure from the bare integer ${worstW.toExponential(2)}`);

  /* This check was WRITTEN VACUOUS — its condition was `w === 1 || |w - 1| >= 0`, whose
     right half is true of every number, so it could not fail. It also claimed the wrong
     boundary. A 2 pi-periodic perturbation contributes zero net phase whatever its
     amplitude, so the winding is q for ALL a; what breaks the march is NYQUIST, and that
     is a property of the sampling, not of the field. Both halves are now measured. */
  let hugeOk = true; const hugeSeen = [];
  for (const a of [0, 1, 5, 20, 100]) {
    const w = X.dfxWinding(1, [{ a, k: 5, p: 0.4 }], 200000);
    hugeSeen.push(`a=${a}:${w.toFixed(6)}`); if (Math.abs(w - 1) > 1e-9) hugeOk = false;
  }
  ok('no amplitude of a periodic perturbation can move the winding — it is q for a = 0 through a = 100, exactly',
    hugeOk, `${hugeSeen.join(' · ')} · the perturbation is 2 pi-periodic, so its net phase is zero however violent it is`);

  /* the boundary that DOES exist: the branch march aliases once max|phi'| dt exceeds pi */
  const steep = [{ a: 6, k: 5, p: 0.4 }], vmax = 1 + 6 * 5, nyq = 2 * vmax;   // N > 2 pi vmax / pi
  const wUnder = X.dfxWinding(1, steep, 40), wOver = X.dfxWinding(1, steep, 80);
  ok('and the boundary is Nyquist, not amplitude: below 2 max|dphi/dt| samples the branch march aliases, above it the integer is exact',
    Math.round(wUnder) !== 1 && Math.abs(wOver - 1) < 1e-12 && 40 < nyq && 80 > nyq,
    `max|dphi/dt| = ${vmax}, so the march needs more than ${nyq} samples · 40 samples returns ${wUnder} (aliased, and wrong by ${Math.abs(wUnder - 1)}) · 80 returns ${wOver.toFixed(9)}`);

  /* degree: the identity map has degree 1, the antipodal map -1, a constant map 0 */
  let worstD = 0;
  for (const n2 of [-2, -1, 0, 1, 2, 3]) {
    const deg = X.dfxDegree((t, p) => [Math.sin(t) * Math.cos(n2 * p), Math.sin(t) * Math.sin(n2 * p), Math.cos(t)], 80, 160);
    worstD = Math.max(worstD, Math.abs(deg - n2));
  }
  ok('the degree of (theta, phi) -> (theta, n phi) is n, for six values of n including zero and both signs',
    worstD < 1e-9,
    `worst departure from the integer ${worstD.toExponential(2)} — the solid-angle sum lands on it, it is not rounded to it`);
}

console.log('\n=== 11. A Chern number, three KdV invariants, the double cover, a discriminant and a limiting mass ===\n');
{
  /* The Chern number of the Qi-Wu-Zhang band is the sharpest check available anywhere in
     this file: it is an integer that CHANGES, so it cannot be right by accident and it
     cannot be right for the wrong reason — a sign error moves the phase boundary. */
  const phase = u => (Math.abs(u) > 2 ? 0 : u < 0 ? 1 : -1);
  let worstC = 0, wrongPhase = [];
  for (const u of [-3.5, -3, -2.4, -1.9, -1, -0.4, 0.4, 1, 1.9, 2.4, 3, 3.5]) {
    const C = X.berryChernFHS(u, 24);
    if (Math.round(C) !== phase(u)) wrongPhase.push(`u=${u} -> ${C.toFixed(6)}, expected ${phase(u)}`);
    worstC = Math.max(worstC, Math.abs(C - Math.round(C)));
  }
  ok('the Chern number is 0 outside |u| = 2, +1 below zero and -1 above it — twelve values, and the integer changes where the theory says',
    wrongPhase.length === 0 && worstC < 1e-9,
    wrongPhase.length ? wrongPhase.join(' · ')
      : `twelve mass parameters across all three phases · worst distance to the integer ${worstC.toExponential(2)} — the plaquette sum is gauge invariant, so it lands ON the integer at finite lattice size rather than converging to it`);

  /* and it does not depend on the lattice, away from a gap closing — that is the whole
     content of "topological", and a sum that drifted with N would not be one */
  const sizes = [8, 12, 20, 32, 48].map(N => X.berryChernFHS(1.2, N));
  ok('and it does not move with the lattice: five sizes from 8 to 48 plaquettes a side give the same integer',
    sizes.every(c => Math.abs(c + 1) < 1e-9),
    `${sizes.map(c => c.toFixed(9)).join(' · ')} — 8x8 already gives it exactly, which a convergent quadrature would not`);

  /* the gap closes exactly at the transitions, and the curvature integral is the integer */
  const gaps = [0, 2, -2].map(u => X.berryGap(u));
  ok('the direct gap closes at exactly u = 0 and u = +-2, and nowhere else that was tested',
    gaps.every(g => g < 1e-12) && [0.5, 1.5, 2.5, -1.3].every(u => X.berryGap(u) > 0.5),
    `gap at the three transitions = ${gaps.map(g => g.toExponential(1)).join(', ')} · gap at u = 0.5, 1.5, 2.5, -1.3 all above 0.5`);

  /* an INDEPENDENT route to the same integer: integrate the closed-form Berry curvature
     over the zone with a midpoint rule, which shares no code with the plaquette sum */
  {
    const N = 240, h = 2 * Math.PI / N; let s = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++)
      s += X.berryF(-Math.PI + (i + 0.5) * h, -Math.PI + (j + 0.5) * h, 1.2) * h * h;
    const C = s / (2 * Math.PI);
    ok('and integrating the closed-form curvature over the zone gives the same integer by a route that shares no code with the plaquette sum',
      Math.abs(C - X.berryChernFHS(1.2, 24)) < 5e-3,
      `curvature integral ${C.toFixed(6)} vs plaquette sum ${X.berryChernFHS(1.2, 24).toFixed(6)} — the quadrature converges to it, the plaquette sum lands on it`);
  }

  /* KdV: the three invariants are exact constants of the PDE, so any drift belongs to the
     integrator — and a fourth-order integrator must show it, by falling like dt^4 */
  const drift = (dt, T) => {
    const u0 = X.kdvTwoSoliton(5, 2, -20, -8), a = X.kdvInvariants(u0);
    const u = X.kdvEvolve(u0, dt, Math.round(T / dt)), b = X.kdvInvariants(u);
    return [Math.abs(b.I1 - a.I1), Math.abs(b.I2 - a.I2), Math.abs(b.I3 - a.I3)];
  };
  const dA = drift(0.004, 0.4), dB = drift(0.002, 0.4);
  ok('the KdV invariants drift, and halving the step cuts the drift by more than eight — the integrator is fourth order and the invariants are exact',
    dB[1] < dA[1] / 8 && dB[2] < dA[2] / 8,
    `dt = 0.004: I2 ${dA[1].toExponential(2)}, I3 ${dA[2].toExponential(2)} · dt = 0.002: I2 ${dB[1].toExponential(2)}, I3 ${dB[2].toExponential(2)} · ratios ${(dA[1] / dB[1]).toFixed(1)} and ${(dA[2] / dB[2]).toFixed(1)}`);

  ok('and mass is conserved to machine precision at any step, because a spectral method conserves the zero mode exactly',
    dA[0] < 1e-12 && dB[0] < 1e-12,
    `|I1 drift| = ${dA[0].toExponential(2)} and ${dB[0].toExponential(2)} — the mean of u is the k = 0 Fourier coefficient, and the nonlinearity multiplies it by k`);

  /* the one-soliton profile travels at its own speed c, which is the exact statement */
  {
    const c = 4, u0 = X.kdvTwoSoliton(c, c, -20, -20).map(v => v / 2);  // one soliton of speed c
    const T = 0.6, u = X.kdvEvolve(Float64Array.from(u0), 0.0008, Math.round(T / 0.0008));
    const arg = arr => { let bi = 0; for (let i = 1; i < arr.length; i++) if (arr[i] > arr[bi]) bi = i; return X.kdvGridX(bi); };
    const moved = arg(u) - arg(u0), expect = c * T, dx = X.KDV_L / X.KDV_N;
    ok('a single soliton of speed c travels a distance c t, to within one grid cell',
      Math.abs(moved - expect) <= dx,
      `c = ${c}, t = ${T} · expected ${expect.toFixed(4)}, measured ${moved.toFixed(4)} · one cell is ${dx.toFixed(4)}`);
  }

  /* the double cover, which is the one fact about SU(2) that surprises people */
  {
    const two = X.su2axang([0, 0, 1], 2 * Math.PI), four = X.su2axang([0, 0, 1], 4 * Math.PI);
    let worstAx = 0;
    for (const ax of [[0, 0, 1], [1, 0, 0], [1, 1, 1], [-2, 0.5, 3]]) {
      const q = X.su2axang(ax, 2 * Math.PI);
      worstAx = Math.max(worstAx, Math.hypot(q[0] + 1, q[1], q[2], q[3]));
    }
    ok('a 2 pi rotation is minus one and a 4 pi rotation is one — the double cover, about any axis',
      Math.abs(two[0] + 1) < 1e-12 && Math.abs(four[0] - 1) < 1e-12 && worstAx < 1e-12,
      `q(2 pi) = ${two[0].toFixed(12)} · q(4 pi) = ${four[0].toFixed(12)} · worst |q(2 pi) + 1| over four axes = ${worstAx.toExponential(2)}`);
  }

  {
    let worstN = 0, worstI = 0;
    for (const th of [0.3, 1.1, 2.7, 5.9, 11.4]) for (const ax of [[1, 0, 0], [0.3, -1, 2]]) {
      const q = X.su2axang(ax, th), p = X.su2mul(q, X.su2conj(q));
      worstN = Math.max(worstN, Math.abs(Math.hypot(q[0], q[1], q[2], q[3]) - 1));
      worstI = Math.max(worstI, Math.hypot(p[0] - 1, p[1], p[2], p[3]));
    }
    ok('every quaternion the instrument builds is a unit quaternion, and its conjugate is its inverse',
      worstN < 1e-15 && worstI < 1e-15,
      `ten (angle, axis) pairs · worst |‖q‖ - 1| = ${worstN.toExponential(2)} · worst |q q* - 1| = ${worstI.toExponential(2)}`);
  }

  {
    const q = X.su2axang([0.2, 1, -0.4], 1.7);
    const s0 = X.su2slerp([1, 0, 0, 0], q, 0), s1 = X.su2slerp([1, 0, 0, 0], q, 1);
    const half = X.su2slerp([1, 0, 0, 0], q, 0.5), mid = X.su2axang([0.2, 1, -0.4], 0.85);
    ok('slerp hits both endpoints exactly, and its midpoint is the half angle — a great circle, not a chord',
      Math.hypot(s0[0] - 1, s0[1], s0[2], s0[3]) < 1e-12 &&
      Math.hypot(s1[0] - q[0], s1[1] - q[1], s1[2] - q[2], s1[3] - q[3]) < 1e-12 &&
      Math.hypot(half[0] - mid[0], half[1] - mid[1], half[2] - mid[2], half[3] - mid[3]) < 1e-12,
      `t = 0 gives the identity, t = 1 gives q, t = 0.5 gives the rotation by half the angle to ${Math.hypot(half[0] - mid[0], half[1] - mid[1], half[2] - mid[2], half[3] - mid[3]).toExponential(2)}`);
  }

  /* the cusp: the root COUNT is dictated by the sign of the discriminant, and that is a
     statement no fit can satisfy by accident */
  {
    let mismatched = [], worstRes = 0, n = 0;
    for (const a of [-5, -3, -1.2, -0.4, 0.5, 2]) for (const b of [-4, -1.1, -0.2, 0.3, 1.7, 5]) {
      const D = 4 * a ** 3 + 27 * b * b, r = X.cuspRoots(a, b);
      const want = D < 0 ? 3 : 1;
      if (r.length !== want) mismatched.push(`(a=${a}, b=${b}, D=${D.toFixed(3)}) gave ${r.length}, wanted ${want}`);
      for (const x of r) worstRes = Math.max(worstRes, Math.abs(x ** 3 + a * x + b));
      n++;
    }
    ok('the number of real equilibria is three where the discriminant is negative and one where it is positive, over a sweep of the control plane',
      mismatched.length === 0 && worstRes < 1e-8,
      mismatched.length ? mismatched.slice(0, 4).join(' · ')
        : `${n} (a, b) pairs · every root count matches the sign of 4a^3 + 27b^2 · worst |x^3 + ax + b| = ${worstRes.toExponential(2)}`);
  }

  {
    /* Vieta on the three-root side: the sum is exactly zero because there is no x^2 term */
    let worstV = 0;
    for (const a of [-5, -3, -1.2]) for (const b of [-1.1, -0.2, 0.3, 1.7]) {
      const r = X.cuspRoots(a, b); if (r.length !== 3) continue;
      worstV = Math.max(worstV, Math.abs(r[0] + r[1] + r[2]), Math.abs(r[0] * r[1] * r[2] + b));
    }
    ok('and where there are three, they sum to zero and their product is -b — Vieta, on roots found by Newton and not by the formula',
      worstV < 1e-8, `worst violation of either identity ${worstV.toExponential(2)}`);
  }

  /* the white dwarf: the relation runs BACKWARDS, and that is the physics */
  {
    const masses = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.35, 1.44];
    const radii = masses.map(m => X.wdRadiusKm(m, 2));
    let monotone = true;
    for (let i = 1; i < radii.length; i++) if (!(radii[i] < radii[i - 1])) monotone = false;
    ok('a heavier white dwarf is a smaller white dwarf, at every mass tested — degeneracy pressure, not thermal pressure',
      monotone,
      `${masses[0]} M_sun -> ${radii[0].toFixed(0)} km, down to ${masses[masses.length - 1]} M_sun -> ${radii[radii.length - 1].toFixed(0)} km`);
  }

  ok('the limiting mass is 5.816 / mu_e^2 solar masses, and the radius goes to zero there',
    Math.abs(X.wdMch(2) - 1.454) < 1e-9 && Math.abs(X.wdMch(1) - 5.816) < 1e-9 &&
    X.wdRadiusKm(1.4539999, 2) < 40,
    `M_Ch(mu = 2) = ${X.wdMch(2).toFixed(6)} · M_Ch(mu = 1) = ${X.wdMch(1).toFixed(6)} · R at one part in ten million below the limit = ${X.wdRadiusKm(1.4539999, 2).toFixed(1)} km`);

  {
    /* far below the limit the relation must reduce to the non-relativistic R ~ M^(-1/3) */
    const r1 = X.wdRadiusKm(0.05, 2), r2 = X.wdRadiusKm(0.1, 2);
    const slope = Math.log(r2 / r1) / Math.log(2);
    ok('and far below the limit it reduces to the non-relativistic polytrope, R proportional to M^(-1/3)',
      Math.abs(slope + 1 / 3) < 0.02,
      `doubling the mass from 0.05 to 0.1 M_sun changes the radius by a power of ${slope.toFixed(4)}, against the polytrope's -0.3333`);
  }

  {
    /* Sirius B: 1.018 M_sun, 5900 km measured (Barstow 2005 HST). A MODEL is allowed to
       miss, and the check states the miss rather than choosing a tolerance that hides it. */
    const R = X.wdRadiusKm(1.018, 2), miss = Math.abs(R - 5900) / 5900;
    ok('and it reproduces Sirius B, the best-measured white dwarf, to within a tenth',
      miss < 0.1,
      `1.018 M_sun gives ${R.toFixed(0)} km against the 5900 km measured from its gravitational redshift (Barstow 2005) — a ${(100 * miss).toFixed(1)}% miss, which is the accuracy of a zero-temperature fit and is why the status says MODEL`);
  }
}

console.log(`\n${fail === 0 ? '✔' : '✗'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
