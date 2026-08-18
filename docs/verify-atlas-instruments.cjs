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

console.log('\n=== 12. Five closed journeys, a Carnot limit, an inspiral, a threshold and four exact ratios ===\n');
{
  /* HOLONOMY. The frame comes back turned by the ENCLOSED SOLID ANGLE — modulo 2 pi, and
     the modulo is the part that is easy to get wrong, so it is tested past a hemisphere */
  let worstH = 0, rows = [];
  for (const deg of [15, 45, 60, 92, 120, 170]) {
    const th = deg * Math.PI / 180, om = 2 * Math.PI * (1 - Math.cos(th));
    const tr = X.holTransportPure(th, 2048);
    const d = Math.abs(X.holWrap(tr.angle - X.holWrap(om)));
    worstH = Math.max(worstH, d);
    if (deg === 170) rows.push(`theta=170deg: Omega=${om.toFixed(6)} sr, transport=${tr.angle.toFixed(6)} rad`);
  }
  ok('parallel transport around a latitude returns the frame turned by the enclosed solid angle, at six angles including three past a hemisphere',
    worstH < 1e-5,
    `${rows[0]} · worst |wrap(transport - Omega)| = ${worstH.toExponential(2)} — beyond a hemisphere the two numbers stop looking alike and are still the same number`);

  const hA = X.holTransportPure(1.0, 256), hB = X.holTransportPure(1.0, 1024), hC = X.holTransportPure(1.0, 4096);
  const om1 = X.holWrap(2 * Math.PI * (1 - Math.cos(1.0)));
  const e = t => Math.abs(X.holWrap(t.angle - om1));
  ok('and the residual is the polygon, not the theorem: it falls by about sixteen each time the step count quadruples',
    e(hB) < e(hA) / 8 && e(hC) < e(hB) / 8,
    `${e(hA).toExponential(2)} -> ${e(hB).toExponential(2)} -> ${e(hC).toExponential(2)} at 256, 1024 and 4096 steps`);

  {
    let worstB = 0, worstG = 0;
    for (const th of [0.4, 1.0, 1.9, 2.6]) {
      const cf = X.holWrap(-Math.PI * (1 - Math.cos(th)));
      const n = X.holBerryWilson(th, 0, 257), g = X.holBerryWilson(th, 2.5, 257);
      worstB = Math.max(worstB, Math.abs(X.holWrap(n.phase - cf)));
      worstG = Math.max(worstG, Math.abs(X.holWrap(n.phase - g.phase)));
    }
    ok('the Pancharatnam phase of a Bloch latitude is -Omega/2, and a non-constant local gauge cannot move it by more than a rounding error',
      worstB < 1.2e-4 && worstG < 1e-12,
      `worst |phase + Omega/2| = ${worstB.toExponential(2)} over four latitudes · worst gauge drift = ${worstG.toExponential(2)}, which is what gauge invariance looks like when it is measured rather than asserted`);
  }

  {
    /* the SU(2) commutator angle approaches alpha*beta as the loop shrinks — BCH to
       leading order, and a claim that only means something if the limit is watched */
    const ang = (a, b) => { const qx = X.holQAxis('x', a), qy = X.holQAxis('y', b);
      const C = X.holQMul(X.holQMul(X.holQMul(qx, qy), X.holQInv(qx)), X.holQInv(qy));
      /* 2*acos(w) is the textbook extraction and is USELESS here: near the identity w is
         1 - s^4/2, and acos loses half its digits to cancellation exactly where the limit
         lives. 2*atan2(|vector|, w) is the same angle and is accurate there, so the
         instrument uses it too — a formula that is right and unusable is not right enough. */
      return 2 * Math.atan2(Math.hypot(C.x, C.y, C.z), C.w); };
    const r = s => ang(s, s) / (s * s);
    ok('the SU(2) group commutator of two rotations is a rotation by alpha*beta in the small-loop limit — Baker-Campbell-Hausdorff, watched converging over four decades',
      Math.abs(r(0.1) - 1) < 0.01 && Math.abs(r(0.01) - 1) < 1e-4 &&
      Math.abs(r(0.001) - 1) < 1e-6 && Math.abs(r(0.0001) - 1) < 1e-8,
      `angle/(s^2) = ${r(0.1).toFixed(6)}, ${r(0.01).toFixed(8)}, ${r(0.001).toFixed(10)}, ${r(0.0001).toFixed(12)} at s = 0.1 down to 1e-4 — the error falls as s^2, which is the next BCH term`);

    const a = 0.7, b = 1.3, za = X.holQAxis('z', a), zb = X.holQAxis('z', b);
    const ab = X.holQMul(X.holQMul(za, zb), X.holQMul(X.holQInv(za), X.holQInv(zb)));
    ok('and two rotations about the SAME axis commute exactly, so their commutator is the identity — the control case that says the angle above is curvature and not arithmetic',
      Math.abs(ab.w - 1) < 1e-15 && Math.hypot(ab.x, ab.y, ab.z) < 1e-15,
      `|w - 1| = ${Math.abs(ab.w - 1).toExponential(2)} · |vector part| = ${Math.hypot(ab.x, ab.y, ab.z).toExponential(2)}`);
  }

  {
    /* WIGNER. Two boosts in different directions do not commute, and the leftover is a
       ROTATION — the origin of Thomas precession. Two independent closed forms for it. */
    let worstW = 0, worstI = 0, worstD = 0;
    for (const a of [0.2, 0.9, 1.8]) for (const b of [0.3, 1.1, 2.2]) {
      const YX = X.holM3Mul(X.holBoostY(b), X.holBoostX(a));
      const v = X.holM3Vec(YX, [1, 0, 0]);
      const half = -2 * Math.atan(Math.tanh(a / 2) * Math.tanh(b / 2));
      const alt = Math.atan2(-Math.sinh(a) * Math.sinh(b), Math.cosh(a) + Math.cosh(b));
      worstW = Math.max(worstW, Math.abs(X.holWrap(half - alt)));
      worstI = Math.max(worstI, Math.abs(v[0] * v[0] - v[1] * v[1] - v[2] * v[2] - 1));
      worstD = Math.max(worstD, Math.abs(X.holM3Det(YX) - 1));
    }
    ok('the Wigner rotation of two non-collinear boosts agrees between two independent closed forms, and every composed boost preserves the interval and has unit determinant',
      worstW < 1e-13 && worstI < 1e-12 && worstD < 1e-12,
      `nine rapidity pairs · worst |Omega_W difference| = ${worstW.toExponential(2)} · worst |tau^2 - x^2 - y^2 - 1| = ${worstI.toExponential(2)} · worst |det - 1| = ${worstD.toExponential(2)}`);

    const c = X.holM3Mul(X.holBoostX(0.6), X.holBoostX(1.1)), d = X.holM3Mul(X.holBoostX(1.1), X.holBoostX(0.6));
    let same = 0; for (let n = 0; n < 9; n++) same = Math.max(same, Math.abs(c[n] - d[n]));
    ok('and two boosts along the SAME axis do commute, so there is no rotation left over — the control case for the Wigner angle',
      same < 1e-14, `worst entrywise difference between the two orderings = ${same.toExponential(2)}`);
  }

  {
    /* MOBIUS: det is 1 and the trace is conjugation invariant, which is what makes the
       elliptic/parabolic/hyperbolic classification a property of the map and not the chart */
    let worstDet = 0, worstTr = 0;
    for (const a of [0.3, 1.4, 2.6]) for (const b of [0.2, 1.0, 2.4]) {
      const ca = Math.cos(a / 2), sa = Math.sin(a / 2);
      const M = [ca, -sa, sa, ca], B = [Math.exp(b / 2), 0, 0, Math.exp(-b / 2)];
      const C = X.holM2Mul(X.holM2Mul(X.holM2Mul(M, B), X.holM2Inv(M)), X.holM2Inv(B));
      const H = [Math.cos(0.31), -Math.sin(0.31), Math.sin(0.31), Math.cos(0.31)];
      const HC = X.holM2Mul(X.holM2Mul(H, C), X.holM2Inv(H));
      worstDet = Math.max(worstDet, Math.abs(X.holM2Det(C) - 1));
      worstTr = Math.max(worstTr, Math.abs((HC[0] + HC[3]) - (C[0] + C[3])));
    }
    ok('the SL(2,R) commutator has determinant 1 and a trace no conjugation can move, so its conjugacy class is a property of the map and not of the chart',
      worstDet < 1e-13 && worstTr < 1e-13,
      `nine (angle, rapidity) pairs · worst |det - 1| = ${worstDet.toExponential(2)} · worst trace shift under conjugation = ${worstTr.toExponential(2)}`);
  }

  /* THERMOELECTRIC. The whole content is the approach to Carnot, so that is the check. */
  {
    let worstC = 0, mono = true;
    for (const tau of [0.2, 0.5, 0.8]) {
      const e = X.teEta(1e12, tau);
      worstC = Math.max(worstC, Math.abs(e / (1 - tau) - 1));
      let prev = -1;
      for (const ZT of [0.1, 0.5, 1, 2, 5, 20, 100]) { const v = X.teEta(ZT, tau); if (!(v > prev)) mono = false; prev = v; }
    }
    ok('the thermoelectric efficiency rises monotonically with ZT and approaches Carnot exactly as ZT goes to infinity, at three temperature ratios',
      worstC < 1e-5 && mono,
      `worst |eta(ZT = 1e12)/Carnot - 1| = ${worstC.toExponential(2)} · monotone in ZT at every tau tested`);

    ok('and the cooler approaches its own Carnot bound, tau/(1 - tau), from below',
      [0.3, 0.6, 0.9].every(t => { const c = X.teCOP(1e12, t) / (t / (1 - t)); return c < 1 && Math.abs(c - 1) < 1e-5; }),
      `COP/Carnot at ZT = 1e12: ${[0.3, 0.6, 0.9].map(t => (X.teCOP(1e12, t) / (t / (1 - t))).toFixed(9)).join(' · ')}`);

    /* the closed-form ZT that reaches half of Carnot — solved, then verified by substitution */
    let worstHalf = 0;
    for (const tau of [0.15, 0.4, 0.75]) {
      const Mg = 2 + tau, Mc = 1 + 2 / tau;
      worstHalf = Math.max(worstHalf,
        Math.abs(X.teEta(Mg * Mg - 1, tau) / (1 - tau) - 0.5),
        Math.abs(X.teCOP(Mc * Mc - 1, tau) / (tau / (1 - tau)) - 0.5));
    }
    ok('the figure of merit that reaches half of Carnot is closed form — M = 2 + tau for a generator and 1 + 2/tau for a cooler — and substituting it back returns exactly one half',
      worstHalf < 1e-12,
      `worst departure from 0.5 over three temperature ratios and both modes = ${worstHalf.toExponential(2)}`);

    ok('and below ZT = 1/tau^2 - 1 the maximum-COP expression goes NEGATIVE, which is the absence of an operating point and is why the instrument refuses there',
      X.teCOP(1 / 0.25 - 1 - 0.3, 0.5) < 0 && X.teCOP(1 / 0.25 - 1 + 0.3, 0.5) > 0 &&
      Math.abs(X.teCOP(1 / 0.25 - 1, 0.5)) < 1e-12,
      `at tau = 0.5 the threshold is ZT = 3: COP(2.7) = ${X.teCOP(2.7, 0.5).toFixed(6)}, COP(3) = ${X.teCOP(3, 0.5).toExponential(2)}, COP(3.3) = ${X.teCOP(3.3, 0.5).toFixed(6)}`);
  }

  /* GRAVITATIONAL WAVES. */
  {
    ok('the chirp mass is symmetric in the two masses and scales linearly when both are scaled — the only mass combination the leading waveform depends on',
      Math.abs(X.gwChirpMass(36, 29) - X.gwChirpMass(29, 36)) < 1e-12 &&
      Math.abs(X.gwChirpMass(72, 58) - 2 * X.gwChirpMass(36, 29)) < 1e-12 &&
      Math.abs(X.gwChirpMass(10, 10) - 10 * Math.pow(2, -1 / 5)) < 1e-12,
      `GW150914 (36, 29) gives ${X.gwChirpMass(36, 29).toFixed(4)} M_sun · equal masses give m/2^(1/5) exactly`);

    /* tau and df/dt are two faces of one law: dt = -df/(df/dt) integrated from f gives tau */
    const Mc = X.gwChirpMass(36, 29) * X.GW_MSUN, f0 = 35;
    let num = 0; const N = 200000, fmax = 1e6;
    for (let n = 0; n < N; n++) { const f = f0 * Math.pow(fmax / f0, (n + 0.5) / N), df = f * (Math.log(fmax / f0) / N);
      num += df / X.gwDfdt(f, Mc); }
    ok('the time to coalescence IS the integral of df over the chirp rate, computed two entirely different ways',
      Math.abs(num / X.gwTau(f0, Mc) - 1) < 1e-3,
      `closed form ${X.gwTau(f0, Mc).toFixed(6)} s · integrated ${num.toFixed(6)} s from 35 Hz — the 0.2 s of GW150914 in band`);

    ok('and tau scales as f^(-8/3) and as Mc^(-5/3), which is what makes a chirp measure a mass',
      Math.abs(X.gwTau(70, Mc) / X.gwTau(35, Mc) - Math.pow(2, -8 / 3)) < 1e-12 &&
      Math.abs(X.gwTau(35, 2 * Mc) / X.gwTau(35, Mc) - Math.pow(2, -5 / 3)) < 1e-12,
      `doubling f multiplies tau by ${(X.gwTau(70, Mc) / X.gwTau(35, Mc)).toFixed(9)} = 2^(-8/3) · doubling Mc multiplies it by ${(X.gwTau(35, 2 * Mc) / X.gwTau(35, Mc)).toFixed(9)} = 2^(-5/3)`);

    let worstP = 0;
    for (const io of [0, 0.4, 1.0, Math.PI / 2, 2.4, Math.PI]) {
      const S = X.gwStokes(io); worstP = Math.max(worstP, Math.abs(S.q * S.q + S.u * S.u + S.v * S.v - 1));
    }
    ok('a circular binary emits a PURE polarization state at every inclination — face on it is fully circular, edge on fully linear, and never partial',
      worstP < 1e-12 && Math.abs(X.gwStokes(0).v - 1) < 1e-12 && Math.abs(X.gwStokes(Math.PI / 2).q - 1) < 1e-12,
      `worst |q^2 + u^2 + v^2 - 1| = ${worstP.toExponential(2)} over six inclinations · v(0) = ${X.gwStokes(0).v} · q(pi/2) = ${X.gwStokes(Math.PI / 2).q}`);

    /* PETERS. gwMergerTime integrates until a falls below 12/c5^0.4, which is the ISCO in
       the laboratory's declared cinematic units — so it must be called in those units, and
       the first attempt at this check passed c5 = 1, which puts the threshold at a = 12 and
       makes every start already merged. It returned 0, and 0 has no exponent. */
    const cc = 3.75, c5 = Math.pow(cc, 5), MM = 2, beta = (64 / 5) * MM / c5, isco = 12 / (cc * cc);
    const t = a => X.gwMergerTime(a, 0, MM, c5);
    const closed = a => (Math.pow(a, 4) - Math.pow(isco, 4)) / (4 * beta);
    let worstT = 0;
    for (const a of [1.6, 2.0, 2.4, 3.0]) worstT = Math.max(worstT, Math.abs(t(a) / closed(a) - 1));
    ok("Peters' circular inspiral: the integration agrees with the closed form (a^4 - a_isco^4)/4beta at four separations",
      worstT < 0.02,
      `worst relative difference ${(100 * worstT).toFixed(2)}% · at a = 2.4 the integration gives ${t(2.4).toFixed(3)} against ${closed(2.4).toFixed(3)}`);

    /* The a^4 law is ASYMPTOTIC — the closed form is (a^4 - a_isco^4)/4beta, and the
       subtraction makes the apparent exponent 4.12 at these separations, not 4. The first
       version of this check asked for 4 and was wrong about its own formula. The EXACT
       statement is the one that inverts it: 4 beta t + a_isco^4 recovers a^4 exactly. */
    let worstA = 0;
    for (const a of [1.2, 1.6, 2.4, 3.0, 4.0])
      worstA = Math.max(worstA, Math.abs(Math.pow(4 * beta * t(a) + Math.pow(isco, 4), 0.25) / a - 1));
    ok('and inverting the law recovers the separation it started from: 4 beta t + a_isco^4 is a^4, at five separations',
      worstA < 0.01,
      `worst |recovered a / a - 1| = ${(100 * worstA).toFixed(3)}% · the apparent exponent of t itself is ${(Math.log(t(3) / t(1.6)) / Math.log(3 / 1.6)).toFixed(4)} and not 4, because a_isco^4 is subtracted — the fourth power is what the law becomes far from the ISCO`);

    ok('and eccentricity shortens it sharply, because the loss rate carries an extra (1 - e^2)^(-7/2)',
      X.gwMergerTime(2.4, 0.7, MM, c5) < 0.35 * t(2.4),
      `at a = 2.4, e = 0 takes ${t(2.4).toFixed(2)} and e = 0.7 takes ${X.gwMergerTime(2.4, 0.7, MM, c5).toFixed(2)} in the laboratory's units — a factor of ${(t(2.4) / X.gwMergerTime(2.4, 0.7, MM, c5)).toFixed(2)}`);
  }

  /* TURING. */
  {
    const ex = (F, k) => F >= 4 * (F + k) * (F + k);
    let agree = true;
    for (const F of [0.02, 0.035, 0.055, 0.09]) for (const k of [0.05, 0.057, 0.062, 0.07])
      if (X.rdTuring(F, k, 0.16, 0.08).exists !== ex(F, k)) agree = false;
    ok('a nontrivial homogeneous state exists exactly where F >= 4(F + k)^2, at sixteen points of the control plane',
      agree,
      'the discriminant and the existence flag agree everywhere tested — and the classic spots, stripes and maze presets are all OUTSIDE it, so their patterns are finite-amplitude and not Turing bifurcations');

    const T = X.rdTuring(0.055, 0.062, 0.16, 0.08), b = T.active;
    ok('and where the branch IS Turing unstable, the critical wavenumber is the closed form sqrt(B/2 Du Dv) and the band brackets it',
      b.turing && Math.abs(b.qc - Math.sqrt(b.B / (2 * 0.16 * 0.08))) < 1e-12 &&
      b.band[0] < b.qc && b.qc < b.band[1],
      `q_c = ${b.qc.toFixed(6)} · band [${b.band[0].toFixed(4)}, ${b.band[1].toFixed(4)}] · critical wavelength ${b.lam.toFixed(4)}, fastest ${b.lamMax.toFixed(4)}`);

    /* the instability is DIFFUSION-DRIVEN: the same state is stable at q = 0 */
    ok('the instability is driven by diffusion and nothing else: the same state is stable at zero wavenumber, and only the diffusive term makes it grow',
      b.tr < 0 && b.det0 > 0 && b.rate > 0,
      `tr J = ${b.tr.toExponential(3)} < 0 and det J = ${b.det0.toExponential(3)} > 0 at q = 0, so the well-mixed reactor is stable — and the fastest mode still grows at ${b.rate.toExponential(3)}`);
  }

  /* DISPERSION: four exact ratios and one exact product, and none of them is a fit */
  {
    const want = { photon: 1, electron: 2, kdv: 3, water: 0.5 };
    let worstR = 0, rows2 = [];
    for (const [sys, r] of Object.entries(want)) {
      for (const k of [0.3, 0.9, 1.5]) {
        const S = X.DISP_SYS[sys], got = S.vg(k) / (S.w(k) / k);
        worstR = Math.max(worstR, Math.abs(got - r));
      }
      rows2.push(`${sys}=${r}`);
    }
    ok('four of the six dispersion relations have a group-to-phase velocity ratio that is an exact rational, at every wavenumber and not just one',
      worstR < 1e-12,
      `${rows2.join(' · ')} · worst departure over twelve (system, k) pairs = ${worstR.toExponential(2)}`);

    let worstProd = 0;
    for (const k of [0.2, 1, 2.5]) { const S = X.DISP_SYS.plasma; worstProd = Math.max(worstProd, Math.abs(S.vg(k) * (S.w(k) / k) - 1)); }
    ok('and the plasma branch has v_p * v_g = c^2 exactly, so the phase velocity exceeds c at every wavenumber while the energy never does',
      worstProd < 1e-12 &&
      [0.2, 1, 2.5].every(k => X.DISP_SYS.plasma.w(k) / k > 1 && X.DISP_SYS.plasma.vg(k) < 1),
      `worst |v_p v_g - 1| = ${worstProd.toExponential(2)} · at k = 1, v_p = ${(X.DISP_SYS.plasma.w(1)).toFixed(6)} and v_g = ${X.DISP_SYS.plasma.vg(1).toFixed(6)}`);

    ok('the phonon chain stops carrying energy exactly at the zone boundary — the van Hove singularity, as an exact zero and not a small number',
      X.DISP_SYS.phonon.vg(Math.PI) === Math.cos(Math.PI / 2) && Math.abs(X.DISP_SYS.phonon.vg(Math.PI)) < 1e-16,
      `v_g(ka = pi) = ${X.DISP_SYS.phonon.vg(Math.PI).toExponential(2)} — cos(pi/2) in double precision, and the group velocity is zero to the last bit available`);

    /* every analytic derivative checked against the function it differentiates */
    let worstD2 = 0;
    for (const sys of Object.keys(X.DISP_SYS)) for (const k of [0.4, 1.1, 1.7]) {
      const S = X.DISP_SYS[sys], h = 1e-6;
      worstD2 = Math.max(worstD2, Math.abs(S.vg(k) - (S.w(k + h) - S.w(k - h)) / (2 * h)));
    }
    ok('and every closed-form group velocity agrees with a central difference of the dispersion relation it claims to differentiate',
      worstD2 < 1e-7,
      `worst |analytic - central difference| over all six systems and three wavenumbers = ${worstD2.toExponential(2)}`);
  }
}

console.log('\n=== 13. A hidden symmetry, a filling rule, a pole and a boost ===\n');
{
  /* THE SHARPEST STATEMENT IN CLASSICAL MECHANICS, AND IT IS TESTABLE.
     Angular momentum is conserved for every central force — Noether on rotations.
     The Laplace-Runge-Lenz vector is conserved for the inverse-square law and NOTHING
     else, so a check that only looks at s = 1 has not tested the statement at all. */
  const inv = (s, v0 = 1.1, n = 44000) => X.noeInvariants(X.noeOrbit(s, n, 0.002, 1, v0), s);
  let worstL = 0;
  for (const s of [0.6, 0.8, 1.0, 1.2, 1.5]) worstL = Math.max(worstL, inv(s).dL);
  ok('angular momentum is conserved for EVERY central force, at five exponents — that is Noether on rotations, and it does not care which force it is',
    worstL < 1e-10,
    `worst spread of L over the whole orbit at s = 0.6, 0.8, 1.0, 1.2, 1.5 is ${worstL.toExponential(2)} — the integrator, not the mechanics`);

  const k = inv(1), off = [0.9, 0.95, 1.05, 1.2].map(s => inv(s));
  ok('and the Laplace-Runge-Lenz vector is conserved at s = 1 and at no other exponent — the hidden SO(4) symmetry, measured rather than asserted',
    k.dA < 1e-5 && off.every(o => o.dA > 1e-3) &&
    k.dArg < 1e-3 && off.every(o => o.dArg > 0.1),
    `s = 1: |A| spreads by ${k.dA.toExponential(2)} and its direction by ${k.dArg.toExponential(2)} rad · nearest neighbours s = 0.95 and 1.05 spread by ${off[1].dA.toExponential(2)} and ${off[2].dA.toExponential(2)} — three orders of magnitude on a 5% change in the exponent`);

  /* the direction spread must be measured about the MEAN direction; the min-max version
     reports a fully conserved vector as having swept 2 pi whenever it sits on the cut */
  const onCut = X.noeInvariants(X.noeOrbit(1, 20000, 0.002, 1, 0.9), 1);
  ok('and it stays conserved when its direction happens to sit on the branch cut, which the old min-max spread reported as a full revolution',
    onCut.dA < 1e-5 && onCut.dArg < 1e-3 && Math.abs(Math.abs(onCut.argMean) - Math.PI) < 0.01,
    `at v0 = 0.9 the mean direction of A is ${onCut.argMean.toFixed(4)} rad, which is pi to four decimals — and the spread about it is ${onCut.dArg.toExponential(2)}, not the 6.28 that max minus min returns there`);

  {
    /* FOCK: the hodograph of a bound Kepler orbit lifts to a GREAT CIRCLE on S^3 */
    const P = X.noeOrbit(1, 44000, 0.002, 1, 1.1), I = X.noeInvariants(P, 1);
    const U = X.noeFock(P, I.E, 29);
    let onSphere = 0; for (const u of U) onSphere = Math.max(onSphere, Math.abs(Math.hypot(u[0], u[1], u[2], u[3]) - 1));
    const ev = X.noeEig4(X.noeGram(U));
    const rank = ev.filter(v => v > 1e-9 * ev[0]).length;
    ok('the Fock lift of a bound Kepler hodograph lands ON the unit three-sphere, and spans a plane there — rank 2, because a great circle is what it is',
      onSphere < 1e-12 && rank === 2 && ev[2] < 1e-9 * ev[0] && ev[3] < 1e-9 * ev[0],
      `${U.length} lifted points · worst |u| - 1 = ${onSphere.toExponential(2)} · Gram eigenvalues ${ev.map(v => v.toExponential(3)).join(', ')} — the last two are zero to within the Jacobi sweep's own residual, which is what "spans a plane" looks like in floating point`);

    ok('and a bound orbit is required for it to exist at all: at non-negative energy the lift is refused rather than computed from a formula that does not apply',
      X.noeFock(P, 0.5, 29) === null && X.noeFock(P, 0, 29) === null,
      'noeFock returns null at E >= 0, where sqrt(-2E) is not a real momentum radius');
  }

  {
    /* the momentum map of two oscillators IS the Hopf map, and its length is the energy */
    let worstJ = 0;
    for (const t of [0, 0.7, 1.9, 3.3, 5.5]) for (const [a, b] of [[1, 1], [0.6, 1.4], [2, 0.3]])
      worstJ = Math.max(worstJ, Math.abs(Math.hypot(...X.noeJ(a, b, 1, 1, 0.4, t)) - (a * a + b * b)));
    ok('the momentum map of two oscillators is the Hopf map: |J| is the total action at every time and every amplitude pair',
      worstJ < 1e-12,
      `fifteen (time, amplitude) pairs · worst ||J| - (a^2 + b^2)| = ${worstJ.toExponential(2)}`);
  }

  /* THE FILLING RULE. */
  {
    let bad = [], capBad = [];
    for (let Z = 1; Z <= 103; Z++) {
      const c = X.atomConfig(Z);
      if (c.reduce((s, o) => s + o.c, 0) !== Z) bad.push(Z);
      for (const o of c) if (o.c > 2 * (2 * o.l + 1) || o.c < 1) capBad.push(Z);
    }
    ok('every one of the 103 tabulated elements has exactly Z electrons, and no subshell holds more than 2(2l + 1)',
      bad.length === 0 && capBad.length === 0,
      `103 elements · ${bad.length} with the wrong electron count · ${capBad.length} with an impossible subshell — including all twenty configurations that break the Aufbau order`);

    const nobles = [2, 10, 18, 36, 54, 86];
    const closes = Z => { const c = X.atomConfig(Z), l = c[c.length - 1]; return l.c === 2 * (2 * l.l + 1); };
    ok('and the noble gases are exactly where a subshell finishes closing — 2, 10, 18, 36, 54, 86, and not one element to either side',
      nobles.every(Z => closes(Z)) && nobles.every(Z => Z === 2 || !closes(Z - 1)),
      `all six close a subshell, and none of 1, 9, 17, 35, 53, 85 does`);

    /* the twenty exceptions are the ones the rule gets WRONG, so they must differ from it */
    const plain = Z => { const sh = []; let left = Z;
      for (const [n, l] of X.AUFBAU) { if (left <= 0) break; const cap = 2 * (2 * l + 1), c = Math.min(cap, left); sh.push(n + 'spdf'[l] + c); left -= c; }
      return sh.join(' '); };
    const actual = Z => X.atomConfig(Z).map(o => o.n + 'spdf'[o.l] + o.c).join(' ');
    const exc = Object.keys(X.CONF_EXC).map(Number);
    ok('and every tabulated exception really does differ from what the Aufbau order would give — chromium and copper among them',
      exc.length === 20 && exc.every(Z => plain(Z) !== actual(Z)),
      `${exc.length} exceptions, all of them genuine departures · Cr (24) is ${actual(24).split(' ').slice(-2).join(' ')} where the rule says ${plain(24).split(' ').slice(-2).join(' ')}`);

    /* Slater: a 1s electron is screened by exactly one other 1s electron, 0.30 of it */
    let worst1s = 0;
    for (let Z = 2; Z <= 103; Z++) worst1s = Math.max(worst1s, Math.abs(X.slaterZeff(Z, X.atomConfig(Z), 0) - (Z - 0.30)));
    ok("Slater's rules give a 1s electron an effective charge of exactly Z - 0.30 for every atom past hydrogen — one partner, screening 0.30 of a charge",
      worst1s < 1e-12,
      `worst departure over Z = 2 to 103 is ${worst1s.toExponential(2)} — and it is Z - 0.3 rather than Z - 0.35 because n = 1 is the one shell Slater gave its own number`);

    /* across a period Z_eff on the valence shell RISES: the reason atoms shrink left to right */
    const per = [5, 6, 7, 8, 9, 10].map(Z => X.slaterZeff(Z, X.atomConfig(Z), X.atomConfig(Z).length - 1));
    let rises = true; for (let i = 1; i < per.length; i++) if (!(per[i] > per[i - 1])) rises = false;
    ok('and the valence electron feels a steadily RISING charge across a period, which is why atoms get smaller from boron to neon rather than bigger',
      rises && Math.abs(per[per.length - 1] - per[0] - 5 * 0.65) < 1e-9,
      `B through Ne: ${per.map(v => v.toFixed(2)).join(' -> ')} — each added proton is screened by only 0.35 of the electron that came with it, so 0.65 survives`);
  }

  /* ONE POLE AND ONE ZERO. */
  {
    const P = (gi, gc, D) => ({ gi, gc, g: gi + gc, p: [X.POLE_W0, -(gi + gc) / 2], z: [X.POLE_W0 + D, -(gi - gc) / 2], D });
    const mag = (w, gi, gc, D) => Math.hypot(...X.poleR(w, 0, P(gi, gc, D)));

    let worstAP = 0;
    for (const gc of [0.02, 0.1, 0.4]) for (const w of [0.4, 0.8, 1, 1.3, 1.9])
      worstAP = Math.max(worstAP, Math.abs(mag(w, 0, gc, 0) - 1));
    ok('a lossless resonator is an exact all-pass: |r| = 1 at EVERY real frequency, not just on resonance',
      worstAP < 1e-12,
      `fifteen (coupling, frequency) pairs with no intrinsic loss · worst ||r| - 1| = ${worstAP.toExponential(2)} — the zero is the mirror image of the pole and the two moduli cancel identically`);

    let worstCC = 0;
    for (const g of [0.004, 0.05, 0.3]) worstCC = Math.max(worstCC, mag(1, g, g, 0));
    ok('and at critical coupling it absorbs EVERYTHING: the zero sits on the real axis and the reflection is exactly nothing',
      worstCC < 1e-15,
      `worst |r(w_0)| over three matched loss rates = ${worstCC.toExponential(2)} — a hard zero, because g_i = g_c puts the zero's imaginary part at 0 rather than near it`);

    ok('the sign of the zero is the coupling regime, and it flips exactly at the match rather than near it',
      P(0.02, 0.05, 0).z[1] > 0 && P(0.05, 0.02, 0).z[1] < 0 && P(0.05, 0.05, 0).z[1] === 0,
      `g_i < g_c puts the zero above the axis (overcoupled), g_i > g_c below it (undercoupled), g_i = g_c exactly on it`);

    ok('and the pole is in the lower half plane for every admissible input, which is causality and not a modelling choice',
      [[0, 1e-4], [0.5, 0.5], [1, 1], [0.03, 0.07]].every(([gi, gc]) => P(gi, gc, 0).p[1] < 0),
      'the pole imaginary part is -(g_i + g_c)/2, and g_c has a positive lower bound in the declared domain precisely so it can never reach the axis');

    /* Q FROM THE LINE, NOT FROM THE FORMULA. The first version of this bisected |r|,
       which has a DIP and not a peak when the resonator is undercoupled, and the search
       walked the wrong way and returned Q = 1 against a closed form of 33. The absorbed
       fraction 1 - |r|^2 is the Lorentzian here, and its half-width at half-maximum is
       exactly (g_i + g_c)/2 — so the width MEASURED off the curve gives Q with no fit. */
    const absorbed = (w, gi, gc) => { const r = X.poleR(w, 0, P(gi, gc, 0)); return 1 - (r[0] * r[0] + r[1] * r[1]); };
    let worstQ = 0, qrows = [];
    for (const [gi, gc] of [[0.02, 0.01], [0.05, 0.05], [0.004, 0.004], [0.3, 0.1]]) {
      const A0 = absorbed(1, gi, gc);
      let lo = 1, hi = 1 + 4 * (gi + gc);
      for (let n = 0; n < 200; n++) { const m = (lo + hi) / 2; if (absorbed(m, gi, gc) > A0 / 2) lo = m; else hi = m; }
      const Qm = X.POLE_W0 / (2 * (hi - 1)), Qc = X.POLE_W0 / (gi + gc);
      worstQ = Math.max(worstQ, Math.abs(Qm / Qc - 1));
      if (gi === 0.004) qrows.push(`g = 0.004 each: measured Q = ${Qm.toFixed(3)}, closed form ${Qc.toFixed(3)}`);
    }
    ok('and the quality factor read off the WIDTH of the absorption line agrees with w_0/(g_i + g_c) exactly, so the formula and the curve are one object and not two',
      worstQ < 1e-9,
      `${qrows[0]} · worst relative disagreement over four loss pairs = ${worstQ.toExponential(2)} — the half-width at half-maximum IS (g_i + g_c)/2, which is why there is nothing to fit`);
  }

  /* THE BOOST. */
  {
    let worstI2 = 0;
    for (const b of [-0.99, -0.5, 0, 0.3, 0.9, 0.999]) for (const [t, x] of [[1, 0], [0, 1], [2, -1], [3, 2.5], [5, 5]]) {
      const q = X.relBoostPts([[t, x]], b)[0];
      worstI2 = Math.max(worstI2, Math.abs((q[0] * q[0] - q[1] * q[1]) - (t * t - x * x)));
    }
    ok('the boost leaves the interval alone at thirty (velocity, event) pairs, including a null ray and a velocity of 0.999',
      worstI2 < 1e-11,
      `worst |(t'^2 - x'^2) - (t^2 - x^2)| = ${worstI2.toExponential(2)} — and the null ray t = x stays null exactly, because gamma multiplies both halves of a zero`);

    let worstR = 0;
    for (const a of [0.1, 0.5, 0.85]) for (const b of [-0.7, 0.2, 0.95]) {
      const comp = (a + b) / (1 + a * b);
      worstR = Math.max(worstR, Math.abs(Math.atanh(comp) - (Math.atanh(a) + Math.atanh(b))));
    }
    ok('rapidity adds exactly where velocity does not: composing two boosts adds their rapidities, at nine pairs',
      worstR < 1e-12,
      `worst |artanh(composed) - artanh(a) - artanh(b)| = ${worstR.toExponential(2)} · 0.85 and 0.95 compose to ${((0.85 + 0.95) / (1 + 0.85 * 0.95)).toFixed(9)} and never past 1 · the tolerance is 1e-12 and not 1e-14 because artanh near 0.996 amplifies its argument's last bits by a factor of 120, which is the derivative and not a defect`);

    ok('and gamma diverges at the light speed rather than reaching a large number: it passes 22 at 0.999 and 707 at 0.999999',
      Math.abs(X.relGamma(0.999) - 22.36627) < 1e-4 && Math.abs(X.relGamma(0.999999) - 707.1069) < 1e-3 &&
      Math.abs(X.relGamma(0.6) - 1.25) < 1e-15,
      `gamma(0.6) = ${X.relGamma(0.6)} exactly, gamma(0.999) = ${X.relGamma(0.999).toFixed(5)}, gamma(0.999999) = ${X.relGamma(0.999999).toFixed(4)}`);

    ok('and the Doppler factor for approach is the reciprocal of the one for recession, which is what makes the two directions one formula',
      [0.2, 0.6, 0.95].every(b => Math.abs(Math.sqrt((1 + b) / (1 - b)) * Math.sqrt((1 - b) / (1 + b)) - 1) < 1e-15),
      `at beta = 0.6 the approaching factor is ${Math.sqrt(1.6 / 0.4).toFixed(6)} and the receding one ${Math.sqrt(0.4 / 1.6).toFixed(6)}, whose product is 1 to the last bit`);
  }
}

console.log('\n=== 14. Detailed balance, three attractors, an orthogonal rotation and two exact constants ===\n');
{
  /* DETAILED BALANCE. The Shockley-Queisser limit is an INTEGRAL between two Planck
     spectra, so the checks are the ones an integral has to satisfy, not a quoted number. */
  let best = 0, bestEg = 0;
  for (let Eg = 0.6; Eg <= 2.4; Eg += 0.01) { const e = X.pvCell(Eg, 300, 1).eff; if (e > best) { best = e; bestEg = Eg; } }
  ok('the single-junction limit peaks near 30% at a gap near 1.26 eV for a 5778 K blackbody — the shape of the curve, not a number copied in',
    best > 0.29 && best < 0.31 && bestEg > 1.15 && bestEg < 1.40,
    `peak ${(100 * best).toFixed(2)}% at ${bestEg.toFixed(2)} eV · the widely quoted 33.7% at 1.34 eV is the SAME calculation over AM1.5G, which is a different source and is not what this instrument is given`);

  let bestC = 0, bestEgC = 0;
  for (let Eg = 0.6; Eg <= 2.4; Eg += 0.01) { const e = X.pvCell(Eg, 300, 46200).eff; if (e > bestC) { bestC = e; bestEgC = Eg; } }
  ok('and at FULL concentration it rises to about 40.7%, which is the number the blackbody limit is actually known by',
    bestC > 0.39 && bestC < 0.42 && bestC > best,
    `${(100 * bestC).toFixed(2)}% at ${bestEgC.toFixed(2)} eV against ${(100 * best).toFixed(2)}% at one sun — concentration multiplies J_sc and leaves J_0 alone, so V_oc rises by (kT/q) ln X and the gap that wins moves DOWN`);

  {
    /* V_oc rises as ln(X) with the same slope kT/q — that is the mechanism, checked */
    const kT = 1.380649e-23 * 300 / 1.602176634e-19;
    let worstS = 0;
    for (const X0 of [1, 10, 100, 1000]) {
      const a = X.pvCell(1.34, 300, X0).Voc, b = X.pvCell(1.34, 300, 10 * X0).Voc;
      worstS = Math.max(worstS, Math.abs((b - a) / (kT * Math.log(10)) - 1));
    }
    ok('and the open-circuit voltage rises by exactly (kT/q) ln 10 per decade of concentration, over four decades',
      worstS < 0.01,
      `worst departure from the ideal slope ${(100 * worstS).toFixed(3)}% · kT/q ln 10 = ${(kT * Math.log(10) * 1000).toFixed(3)} mV per decade at 300 K`);

    ok('a hotter cell is a worse cell, because J_0 is the same integral at the cell temperature and it grows fast',
      [250, 300, 350, 400].map(T => X.pvCell(1.34, T, 1).eff).every((e, i, a) => i === 0 || e < a[i - 1]),
      `efficiency at 250, 300, 350, 400 K: ${[250, 300, 350, 400].map(T => (100 * X.pvCell(1.34, T, 1).eff).toFixed(2)).join('% -> ')}%`);

    const c = X.pvCell(1.34, 300, 1);
    ok('and the voltage deficit is most of a third of the gap before any device imperfection is counted — entropy, not engineering',
      c.Voc < 1.34 && (1.34 - c.Voc) > 0.2 && c.FF > 0.85 && c.FF < 0.92,
      `E_g/q = 1.34 V, V_oc = ${c.Voc.toFixed(4)} V, deficit ${(1.34 - c.Voc).toFixed(4)} V · fill factor ${c.FF.toFixed(4)}`);
  }

  /* THREE ATTRACTORS. */
  {
    const L = X.CHAOS_SYS.lorenz, p = L.params;
    let worstF = 0;
    for (const q of L.fixed(p)) { const d = L.f(p, q[0], q[1], q[2]); worstF = Math.max(worstF, Math.hypot(d[0], d[1], d[2])); }
    ok('the Lorenz fixed points really are fixed: the closed-form triple is substituted back into the flow and returns zero',
      worstF < 1e-13 && L.fixed(p).length === 3,
      `three fixed points · worst |f| = ${worstF.toExponential(2)} · they sit at (+-sqrt(beta(rho-1)), same, rho-1) = (+-${Math.sqrt(p['β'] * (p['ρ'] - 1)).toFixed(6)}, ..., ${p['ρ'] - 1})`);

    const e = 1e-6;
    const div = (S, pp, x, y, z) => ((S.f(pp, x + e, y, z)[0] - S.f(pp, x - e, y, z)[0]) + (S.f(pp, x, y + e, z)[1] - S.f(pp, x, y - e, z)[1]) + (S.f(pp, x, y, z + e)[2] - S.f(pp, x, y, z - e)[2])) / (2 * e);
    const exact = -(p['σ'] + 1 + p['β']);
    let worstD = 0;
    for (const q of [[1, 2, 3], [-4, 5, 20], [0.1, 0.1, 0.1], [30, -30, 60]]) worstD = Math.max(worstD, Math.abs(div(L, p, ...q) - exact));
    ok('and the Lorenz flow contracts volume at the SAME rate everywhere — -(sigma + 1 + beta), at four points scattered across the state space',
      worstD < 1e-7,
      `worst |div f - ${exact.toFixed(6)}| = ${worstD.toExponential(2)} — a constant contraction is why the attractor has zero volume, and it is why "strange" needs a positive Lyapunov exponent on top`);

    /* every attractor here must CONTRACT, or it is not an attractor */
    const keys = Object.keys(X.CHAOS_SYS);
    const dvs = keys.map(k => { const S = X.CHAOS_SYS[k]; return div(S, S.params, 1.1, 0.7, 0.3); });
    ok('every one of the six systems contracts phase-space volume at the point tested, which is the price of admission for an attractor',
      dvs.every(d => d < 0),
      keys.map((k, i) => `${k} ${dvs[i].toFixed(3)}`).join(' · '));

    /* the Lyapunov exponent, against the literature */
    const lam = (key, N) => { const S = X.CHAOS_SYS[key], pp = S.params, h = S.dt, d0 = 1e-9;
      let a = S.seed.slice(), b = [a[0] + d0, a[1], a[2]], sum = 0;
      for (let n = 0; n < N; n++) { a = X.chaosRK4(S, pp, a, h); b = X.chaosRK4(S, pp, b, h);
        const d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1e-300; sum += Math.log(d / d0);
        b = [a[0] + (b[0] - a[0]) * d0 / d, a[1] + (b[1] - a[1]) * d0 / d, a[2] + (b[2] - a[2]) * d0 / d]; }
      return sum / (N * h); };
    const lL = lam('lorenz', 120000), lR = lam('rossler', 120000), lC = lam('chen', 120000);
    ok('and the largest Lyapunov exponent lands on the literature for three of them — Lorenz 0.906, Rossler 0.0714, Chen 2.03 — to a few per cent',
      Math.abs(lL / 0.906 - 1) < 0.05 && Math.abs(lR / 0.0714 - 1) < 0.10 && Math.abs(lC / 2.03 - 1) < 0.05,
      `measured ${lL.toFixed(4)}, ${lR.toFixed(4)}, ${lC.toFixed(4)} · all positive, which with the contraction above is the definition of a strange attractor`);
  }

  /* THE BORIS PUSHER: the property that makes it the standard pusher in every PIC code */
  {
    let x = [1.4, 0, 0], v = [0, 1, 0.4];
    const s0 = v[0] ** 2 + v[1] ** 2 + v[2] ** 2;
    for (let n = 0; n < 200000; n++) { const r = X.cpBorisPure('cyclo', 1, 0, 1, x, v, 0.05); x = r[0]; v = r[1]; }
    const s1 = v[0] ** 2 + v[1] ** 2 + v[2] ** 2;
    ok('the Boris pusher conserves energy over two hundred thousand steps in a pure magnetic field — the rotation is orthogonal, so there is nothing to accumulate',
      Math.abs(s1 / s0 - 1) < 1e-12,
      `|E/E_0 - 1| = ${Math.abs(s1 / s0 - 1).toExponential(2)} after 200000 steps at dt = 0.05 — this is the property the algorithm exists for, and it holds at any step size rather than in a small-step limit`);

    /* and it holds at an ABSURD step, where the orbit is wrong and the energy still is not */
    let y = [1.4, 0, 0], w = [0, 1, 0.4];
    const t0 = w[0] ** 2 + w[1] ** 2 + w[2] ** 2;
    for (let n = 0; n < 20000; n++) { const r = X.cpBorisPure('cyclo', 1, 0, 1, y, w, 3.0); y = r[0]; w = r[1]; }
    ok('and it still conserves it at a step of 3.0, where a gyration takes barely two samples and the orbit is nonsense — energy conservation is not an accuracy statement',
      Math.abs((w[0] ** 2 + w[1] ** 2 + w[2] ** 2) / t0 - 1) < 1e-10,
      `|E/E_0 - 1| = ${Math.abs((w[0] ** 2 + w[1] ** 2 + w[2] ** 2) / t0 - 1).toExponential(2)} at dt = 3.0, against a gyroperiod of 2 pi · the tolerance is 20000 roundings wide and not one, because that is how many there were`);

    /* the ExB drift is independent of charge and mass, which is why it does not separate species */
    const drift = qm => { let a = [1.4, 0, 0], b = [0, 1, 0]; const N = 200000, dt = 0.02, y0 = a[1];
      for (let n = 0; n < N; n++) { const r = X.cpBorisPure('exb', 1, 0.3, qm, a, b, dt); a = r[0]; b = r[1]; }
      return (a[1] - y0) / (N * dt); };
    const dp = drift(1), dn = drift(-2);
    ok('the ExB drift is -E/B whatever the charge and mass — positive and negative species drift together, which is why it drives no current',
      Math.abs(dp + 0.3) < 5e-3 && Math.abs(dn + 0.3) < 5e-3,
      `q/m = +1 gives ${dp.toFixed(6)} and q/m = -2 gives ${dn.toFixed(6)}, against the exact -E/B = -0.3 — the two gyrate in opposite directions at different radii and drift identically`);

    /* THE BOTTLE'S FIELD WAS NOT DIVERGENCE FREE, AND THIS CHECK FOUND IT.
       mu drifted by 117% at a gyroradius of one and by 63% at a gyroradius of 0.0375 — an
       adiabatic invariant does not do that, and the culprit was the field: B_r was written
       as -0.5 B0 z with no factor of r, so div B was B0 z (1 - 0.5/r) instead of 0. With
       the r restored the invariance appears, and the right check is the LAW rather than a
       tolerance: the drift must fall as the gyroradius shrinks against the field scale. */
    {
      const muOf = (B0, q, w) => { const B = X.cpFieldPure('mirror', B0, 0, q)[1], m = Math.hypot(B[0], B[1], B[2]);
        const par = (w[0] * B[0] + w[1] * B[1] + w[2] * B[2]) / m;
        return ((w[0] ** 2 + w[1] ** 2 + w[2] ** 2) - par * par) / (2 * m); };
      const run = (B0, vp, vz, N, dt) => { let a = [0.35, 0, -1.6], b = [0, vp, vz];
        const m0 = muOf(B0, a, b);
        for (let n = 0; n < N; n++) { const r = X.cpBorisPure('mirror', B0, 0, 1, a, b, dt); a = r[0]; b = r[1]; }
        return Math.abs(muOf(B0, a, b) / m0 - 1); };
      const d1 = run(1, 1, 0.88, 60000, 0.02), d2 = run(4, 0.5, 0.4, 120000, 0.006), d3 = run(10, 0.25, 0.22, 200000, 0.002);
      ok('and the magnetic moment becomes an adiabatic invariant as the gyroradius shrinks against the field scale — 74% at a gyroradius of 1, 0.2% at 0.025',
        d1 > 0.3 && d2 < 0.1 && d3 < 0.01 && d3 < d2 && d2 < d1,
        `gyroradius 1.0 -> ${(100 * d1).toFixed(1)}% · 0.125 -> ${(100 * d2).toFixed(2)}% · 0.025 -> ${(100 * d3).toFixed(3)}% · adiabatic invariance is asymptotic, so the statement worth checking is that the drift FALLS, and it falls by a factor of 450`);

      /* and the field it happens in has to be a field */
      const e2 = 1e-6;
      const divB = q => { const f = z => X.cpFieldPure('mirror', 1, 0, z)[1];
        return (f([q[0] + e2, q[1], q[2]])[0] - f([q[0] - e2, q[1], q[2]])[0]
              + f([q[0], q[1] + e2, q[2]])[1] - f([q[0], q[1] - e2, q[2]])[1]
              + f([q[0], q[1], q[2] + e2])[2] - f([q[0], q[1], q[2] - e2])[2]) / (2 * e2); };
      let worstDiv = 0;
      for (const q of [[0.3, 0.2, -1.1], [0.05, 0.9, 0.4], [1.2, -0.4, 1.7], [0.7, 0.7, 0]])
        worstDiv = Math.max(worstDiv, Math.abs(divB(q)));
      ok('because the bottle is divergence free now, which it was not: div B is zero at every point tested rather than growing like 1/r near the axis',
        worstDiv < 1e-9,
        `worst |div B| over four points = ${worstDiv.toExponential(2)} — B_r = -(r/2) dB_z/dz is what makes it vanish, and the r is the part that was missing`);
    }
  }

  /* TWO CONSTANTS THE SI MADE EXACT, AND THE 2 IN BOTH OF THEM. */
  {
    const h = 6.62607015e-34, e = 1.602176634e-19;
    ok('the flux quantum and the Josephson constant are rebuilt from h and e and match the tabulated values to every digit — they are EXACT since 2019, and the 2 in both is the charge of a pair',
      Math.abs(h / (2 * e) / X.SC_PHI0 - 1) < 1e-9 && Math.abs((2 * e / h / 1e9) / X.SC_KJ - 1) < 1e-9 &&
      Math.abs(X.SC_PHI0 * X.SC_KJ * 1e9 - 1) < 1e-9,
      `h/2e = ${(h / (2 * e)).toExponential(9)} Wb · 2e/h = ${(2 * e / h / 1e9).toFixed(4)} GHz/V · and their product is ${(X.SC_PHI0 * X.SC_KJ * 1e9).toFixed(12)}, because one is the reciprocal of the other`);

    let worstG = 0;
    for (const M of X.SC_MATS) worstG = Math.max(worstG, Math.abs(2 * X.scGapMeV(M.Tc) / (X.SC_KB_MEV * M.Tc) - 3.528));
    ok('and the BCS gap ratio 2 Delta/k_B T_c comes out 3.528 for every material in the table — BY CONSTRUCTION, which is exactly why measuring it is how you discover a material is strongly coupled',
      worstG < 1e-12,
      `worst departure from 3.528 over all five materials = ${worstG.toExponential(2)} · lead actually measures about 4.3 and YBCO is not a BCS superconductor at all, and the instrument's limits say so rather than the number`);

    /* flux quantisation: a loop holds an integer, and the defect is the screening job */
    const n = X.scFluxQuanta(1e-5, 100e-12);
    ok('a loop of 100 square micrometres in 10 microtesla holds about half a flux quantum, so the screening current it must run to reach an integer is nearly the largest it can be',
      Math.abs(n - 0.4835) < 0.001 && Math.abs(n - Math.round(n)) > 0.4,
      `${n.toFixed(6)} quanta · the defect from the nearest integer is ${Math.abs(n - Math.round(n)).toFixed(6)}, and that defect is a job the loop does rather than a discrepancy in the arithmetic`);
  }
}

console.log('\n=== 15. A maximum mass, an efficiency, a bound mode, a unitary step and one circle ===\n');
{
  /* THE TOV EQUATION. There is no closed form, so the check is the limit where there IS
     one: a Gamma = 2 polytrope in NEWTONIAN gravity has radius pi sqrt(K/2 pi) whatever
     its mass. Any correct TOV integration must walk onto that number as gravity weakens. */
  const Rn = Math.PI * Math.sqrt(X.NS_K / (2 * Math.PI));
  const light = X.tovSolve(1e-5, 1e-3, false);
  ok('the TOV integration walks onto the EXACTLY known Newtonian radius as the star gets light — pi sqrt(K/2 pi), which no mass appears in',
    Math.abs(light.Rcode / Rn - 1) < 0.005 && 2 * light.M / light.Rcode < 0.005,
    `at a compactness of ${(2 * light.M / light.Rcode).toExponential(2)} the radius is ${light.Rcode.toFixed(4)} against the exact ${Rn.toFixed(4)} — ${(100 * Math.abs(light.Rcode / Rn - 1)).toFixed(2)}% · this is the one radius in the problem that is known independently, and it is what says the integrator is right`);

  const seq = [1e-5, 1e-4, 1e-3, 3e-3].map(rc => { const s = X.tovSolve(rc, 1e-3, false); return s.Rcode / Rn; });
  ok('and it leaves that limit monotonically as relativity takes hold: a heavier star is a smaller one, by more than Newton would have it',
    seq.every((v, k) => k === 0 || v < seq[k - 1]) && seq[3] < 0.7,
    `R/R_Newtonian = ${seq.map(v => v.toFixed(4)).join(' -> ')} across four decades of central density`);

  {
    const h = [6e-3, 1.5e-3, 3.75e-4].map(s => X.tovSolve(3.162e-3, s, false));
    ok('the integration is converged: a sixteen-fold refinement of the step moves the mass in the sixth digit and the radius in the fourth',
      Math.abs(h[2].M - h[0].M) < 1e-5 && Math.abs(h[2].Rkm - h[0].Rkm) / h[0].Rkm < 1e-3,
      `M = ${h.map(s => s.M.toFixed(6)).join(', ')} · R = ${h.map(s => s.Rkm.toFixed(4)).join(', ')} km at h = 6e-3, 1.5e-3, 3.75e-4`);
  }

  {
    /* THE MAXIMUM. It is the whole content of the equation: Newtonian gravity has none. */
    let mx = { M: 0 };
    for (let lg = -3.4; lg <= -1.9; lg += 0.02) { const rc = Math.pow(10, lg), s = X.tovSolve(rc, 3e-3, false);
      if (s.M > mx.M) mx = { M: s.M, Rkm: s.Rkm, rc }; }
    const denser = X.tovSolve(mx.rc * 3, 3e-3, false);
    ok('and there is a MAXIMUM mass, which is the entire point: past it a denser star is a lighter one, and Newtonian gravity has no such turn anywhere',
      Math.abs(mx.M - 1.637) < 0.005 && denser.M < mx.M,
      `M_max = ${mx.M.toFixed(6)} M_sun at rho_c = ${mx.rc.toExponential(3)} (literature 1.6366 for this equation of state) · tripling the central density past it gives ${denser.M.toFixed(6)}, which is LESS`);

    let worstB = 0;
    for (let lg = -3.4; lg <= -1.7; lg += 0.05) { const s = X.tovSolve(Math.pow(10, lg), 3e-3, false);
      worstB = Math.max(worstB, 2 * s.M / s.Rcode); }
    ok('and no star on the whole branch violates the Buchdahl bound 2M/R < 8/9, which holds for any static sphere of any material whatsoever',
      worstB < 8 / 9,
      `worst compactness over 35 central densities = ${worstB.toFixed(6)} against the bound ${(8 / 9).toFixed(6)} — the margin is real and it is not an assumption of the integrator`);
  }

  /* CARNOT. The efficiency depends on two temperatures and on nothing else, and the way to
     check that is to change everything else. */
  {
    let worstE = 0;
    for (const [Th, Tc] of [[500, 300], [800, 200], [310, 300], [5000, 4], [1e5, 99000]])
      for (const g of [1.4, 5 / 3, 1.05]) for (const [V1, V2] of [[1, 2.5], [3, 9], [0.05, 60]]) {
        const c = X.heCyclePure(Th, Tc, g, V1, V2);
        worstE = Math.max(worstE, Math.abs(c.work / c.Qin - (1 - Tc / Th)));
      }
    ok('the Carnot efficiency is 1 - T_c/T_h and depends on nothing else — checked by varying the adiabatic index and both volumes across forty-five cycles',
      worstE < 1e-12,
      `worst |eta - (1 - Tc/Th)| = ${worstE.toExponential(2)} over five temperature pairs, three working gases and three volume pairs · gamma and the volumes cancel exactly, which is why the number is a law and not a design`);

    let worstS = 0;
    for (const [Th, Tc] of [[500, 300], [800, 200], [1200, 77]]) {
      const c = X.heCyclePure(Th, Tc, 1.4, 1, 2.5);
      worstS = Math.max(worstS, Math.abs(c.Qin / Th - c.Qout / Tc) / (c.Qin / Th));
    }
    ok('and the entropy taken from the hot reservoir is exactly the entropy given to the cold one, which is what reversible means',
      worstS < 1e-12,
      `worst relative |Q_in/T_h - Q_out/T_c| = ${worstS.toExponential(2)} · the two adiabats have the same compression ratio, so the two logarithms are the same number and the entropies cannot differ`);
  }

  /* THE BOUND MODE. */
  {
    let worstR = 0, n = 0;
    for (const a0 of [400, 500, 600, 750, 850]) for (const [i2, j2] of [[1, 0], [1, 1], [2, 0], [2, 1]]) {
      const lam = X.eotLamRes(a0, i2, j2); if (lam === null) continue;
      const em = X.eotEpsM(lam), pred = a0 / Math.hypot(i2, j2) * Math.sqrt(em / (em + 1));
      worstR = Math.max(worstR, Math.abs(lam - pred)); n++;
    }
    ok('every surface-plasmon resonance returned satisfies its own implicit equation, which the iteration is not trusted to have solved',
      n >= 8 && worstR < 1e-6,
      `${n} (pitch, order) pairs with a bound mode · worst |lambda - lambda(eps_m(lambda))| = ${worstR.toExponential(2)} nm`);

    ok('and every one of them is REDDER than the pitch it came from, because eps_m/(eps_m + 1) exceeds 1 wherever the mode is bound',
      [400, 600, 750, 850].every(a0 => { const l = X.eotLamRes(a0, 1, 0); return l !== null && l > a0; }),
      `pitch 400 -> ${X.eotLamRes(400, 1, 0).toFixed(1)} nm · 600 -> ${X.eotLamRes(600, 1, 0).toFixed(1)} · 750 -> ${X.eotLamRes(750, 1, 0).toFixed(1)} · 850 -> ${X.eotLamRes(850, 1, 0).toFixed(1)} — the peak always sits to the red of the geometry, which is the observation the whole effect is known by`);

    ok('and where the metal is not metallic enough the mode does not exist and null comes back rather than a number',
      X.eotLamRes(400, 1, 1) === null && X.eotLamRes(400, 2, 0) === null && X.eotEpsM(300) > -1,
      `a 400 nm pitch has no (1,1) or (2,0) mode: those would land near 280 nm where eps_m = ${X.eotEpsM(300).toFixed(3)} is above -1, and a surface plasmon needs it below`);
  }

  /* THE UNITARY STEP. */
  {
    const V = X.qmHarmonic(0.5);
    const [re, im] = X.qmGaussian(6, 1.2, 2);
    const m0 = X.qmMoments(re, im);
    X.qmPropagate(re, im, V, 50000, 0.008);
    const m1 = X.qmMoments(re, im);
    ok('the split-step propagator conserves the norm over fifty thousand steps, because every factor it applies has unit modulus',
      Math.abs(m1.norm - 1) < 1e-8 && Math.abs(m0.norm - 1) < 1e-12,
      `norm ${m0.norm.toFixed(12)} -> ${m1.norm.toFixed(12)} · drift ${Math.abs(m1.norm - m0.norm).toExponential(2)} after 50000 steps, which is the FFT's rounding and not the propagator's`);

    /* the one wave packet that does not spread */
    const om = 0.5, T = 2 * Math.PI / om, s0 = 1 / Math.sqrt(2 * om);
    const g = X.qmGaussian(6, 0, s0), a0 = X.qmMoments(g[0], g[1]);
    X.qmPropagate(g[0], g[1], X.qmHarmonic(om), Math.round(T / 0.008), 0.008);
    const a1 = X.qmMoments(g[0], g[1]);
    ok('a coherent state comes back to itself after one harmonic period with its width unchanged — the one wave packet that does not spread',
      Math.abs(a1.x - a0.x) < 1e-4 && Math.abs(a1.sigma / a0.sigma - 1) < 1e-6,
      `<x> ${a0.x.toFixed(6)} -> ${a1.x.toFixed(6)} after T = ${T.toFixed(4)} · sigma ${a0.sigma.toFixed(6)} -> ${a1.sigma.toFixed(6)}, unchanged to a part in a million`);

    /* a FREE packet spreads by an exact law, and that law is the check */
    const f = X.qmGaussian(0, 0, 2), zero = new Float64Array(X.QM_N);
    const t = 8; X.qmPropagate(f[0], f[1], zero, Math.round(t / 0.004), 0.004);
    const fm = X.qmMoments(f[0], f[1]), want = Math.sqrt(4 + Math.pow(t / 4, 2));
    ok('and a FREE Gaussian spreads by exactly sqrt(sigma^2 + (t/2 sigma)^2), which is the closed form for it',
      Math.abs(fm.sigma / want - 1) < 1e-4,
      `after t = ${t} a packet of width 2 has width ${fm.sigma.toFixed(6)} against the exact ${want.toFixed(6)} — ${(100 * Math.abs(fm.sigma / want - 1)).toFixed(4)}%`);

    /* SECOND ORDER IN THE STEP — measured against the STEP and nothing else.
       The first version of this compared <x> to its exact value 6 and saw 2.3e-5, 2.9e-5,
       3.0e-5: flat, and not because the splitting is first order. That residual is the
       SPATIAL grid (512 points over a box of 80), which does not move when dt does, and it
       swamped the temporal error entirely. Comparing each run to a dt -> 0 run on the SAME
       grid cancels the grid and leaves the splitting, which is then plainly second order. */
    /* and every run must land on exactly the SAME final time. Math.round(T/dt) does not:
       at dt = 0.08 it stops at t = 12.560 instead of 12.566, and 6 cos(omega * 0.0064)
       differs from 6 by 3.1e-5 — which is precisely the floor the second version of this
       check kept hitting. dt = T/N for integer N removes it, and the splitting appears. */
    const run = N => { const q = X.qmGaussian(6, 0, s0);
      X.qmPropagate(q[0], q[1], X.qmHarmonic(om), N, T / N);
      return X.qmMoments(q[0], q[1]).x; };
    const ref = run(51200);
    const e1 = Math.abs(run(100) - ref), e2 = Math.abs(run(200) - ref), e3 = Math.abs(run(400) - ref);
    /* MEASURED 16, NOT 4 — and the third version of this check said 4 because that is what
       Strang splitting guarantees. The guarantee is a floor, not a ceiling: in a QUADRATIC
       potential the leading commutator term does not reach this observable, and the error
       falls as dt^4. The check below says 16 because 16 is what happens, and the one after
       it adds a quartic term to show the general second order is still there underneath. */
    ok('in a harmonic well the error in <x> falls as dt^4 — BETTER than the second order Strang splitting guarantees, because a quadratic potential degenerates the leading term',
      Math.abs(e1 / e2 / 16 - 1) < 0.05 && Math.abs(e2 / e3 / 16 - 1) < 0.05,
      `${e1.toExponential(2)} -> ${e2.toExponential(2)} -> ${e3.toExponential(2)} at 100, 200 and 400 steps per period, each against a 51200-step reference on the same grid · ratios ${(e1 / e2).toFixed(2)} and ${(e2 / e3).toFixed(2)}, which is 2^4`);

    {
      /* add a quartic term and the general order reappears, exactly as advertised */
      const V4 = X.qmHarmonic(om); for (let i = 0; i < X.QM_N; i++) V4[i] += 1e-3 * Math.pow(X.qmX(i), 4);
      const runQ = N => { const q = X.qmGaussian(6, 0, s0);
        X.qmPropagate(q[0], q[1], V4, N, T / N); return X.qmMoments(q[0], q[1]).x; };
      const r0 = runQ(51200);
      const q1 = Math.abs(runQ(100) - r0), q2 = Math.abs(runQ(200) - r0), q3 = Math.abs(runQ(400) - r0);
      ok('and adding a quartic term brings the second order straight back — the ratio drops from 16 to exactly 4, which is the Strang guarantee doing its job',
        Math.abs(q1 / q2 / 4 - 1) < 0.05 && Math.abs(q2 / q3 / 4 - 1) < 0.05,
        `${q1.toExponential(2)} -> ${q2.toExponential(2)} -> ${q3.toExponential(2)} with a x^4 term of amplitude 1e-3 · ratios ${(q1 / q2).toFixed(2)} and ${(q2 / q3).toFixed(2)} against the exact 4 · unitarity is exact and accuracy is not, and a step too large gives a perfectly normalised wrong answer`);
    }
  }

  /* ONE CIRCLE. */
  {
    let worstS = 0, worstP = 0, worstL = 0;
    for (const [th, ph] of [[0.7, 1.1], [2.2, 0.3], [1.5, 4.4], [0.05, 0], [3.0, 5.9]]) {
      const F = X.spinFibrePure(th, ph, 512);
      const want = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
      let len = 0;
      for (let k = 0; k < F.length; k++) { const q = F[k];
        worstS = Math.max(worstS, Math.abs(Math.hypot(q[0], q[1], q[2], q[3]) - 1));
        const nn = X.spinHopfProject(q);
        worstP = Math.max(worstP, Math.hypot(nn[0] - want[0], nn[1] - want[1], nn[2] - want[2]));
        if (k) { const p = F[k - 1]; len += Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2], q[3] - p[3]); } }
      worstL = Math.max(worstL, Math.abs(len / (2 * Math.PI) - 1));
    }
    ok('every point of a Hopf fibre is a unit quaternion, every one of them projects to the SAME Bloch point, and the fibre is a great circle of length 2 pi',
      worstS < 1e-15 && worstP < 1e-14 && worstL < 1e-4,
      `five fibres of 512 points each · worst |q| - 1 = ${worstS.toExponential(2)} · worst projection spread = ${worstP.toExponential(2)} · worst |length/2pi - 1| = ${worstL.toExponential(2)} — a whole circle of states, one measurement`);

    let worstR = 0, worstA = 0;
    for (const ang of [0.3, 1.3, 2.9, -4.1]) for (const n0 of [[0, 0, 1], [0.6, -0.8, 0], [0.267, 0.535, 0.802]]) {
      const r = X.spinRodrigues(n0, [1, 2, -0.5], ang);
      worstR = Math.max(worstR, Math.abs(Math.hypot(r[0], r[1], r[2]) - Math.hypot(n0[0], n0[1], n0[2])));
    }
    const a = [0, 0, 1], b = [0.6, -0.8, 0];
    for (const ang of [0.3, 1.3, 2.9]) {
      const ra = X.spinRodrigues(a, [1, 2, -0.5], ang), rb = X.spinRodrigues(b, [1, 2, -0.5], ang);
      worstA = Math.max(worstA, Math.abs((ra[0] * rb[0] + ra[1] * rb[1] + ra[2] * rb[2]) - (a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
    }
    ok('and the Rodrigues rotation is rigid: it changes no length and no angle between vectors, at twelve rotations about an arbitrary axis',
      worstR < 1e-15 && worstA < 1e-15,
      `worst length change = ${worstR.toExponential(2)} · worst change in the dot product between two rotated vectors = ${worstA.toExponential(2)}`);

    const n0 = [0.267, 0.535, 0.802];
    const two = X.spinRodrigues(n0, [0, 0, 1], 2 * Math.PI);
    ok('a 2 pi rotation returns the BLOCH VECTOR exactly, while 2 pi on the state returns minus it — the same double cover, seen from the two ends',
      Math.hypot(two[0] - n0[0], two[1] - n0[1], two[2] - n0[2]) < 1e-15,
      `|R(2 pi) n - n| = ${Math.hypot(two[0] - n0[0], two[1] - n0[1], two[2] - n0[2]).toExponential(2)} · the su2 instrument returns -1 for the same rotation of the state, and both are true`);
  }
}

console.log('\n=== 16. Two measured numbers, a luminosity, an identity and a ledger ===\n');
{
  /* A PULSAR HANDS YOU TWO NUMBERS. Everything else is inference, and the Crab is where
     that inference can be checked against a catalogue and against a supernova. */
  const c = X.PSR_PRESETS.crab;
  ok('the Crab pulsar: from its period and period derivative alone, the field, the age and the spin-down luminosity all land on their catalogue values',
    Math.abs(X.psrB(c.P, c.Pd) / 3.8e12 - 1) < 0.05 &&
    Math.abs(X.psrTau(c.P, c.Pd) / 1240 - 1) < 0.05 &&
    Math.abs(X.psrLsd(c.P, c.Pd) / 4.5e38 - 1) < 0.05,
    `B = ${X.psrB(c.P, c.Pd).toExponential(3)} G (catalogue 3.8e12) · tau = ${X.psrTau(c.P, c.Pd).toFixed(0)} yr (catalogue 1240) · L_sd = ${X.psrLsd(c.P, c.Pd).toExponential(3)} erg/s (catalogue 4.5e38)`);

  ok('and the characteristic age is NOT the age: the Crab exploded in 1054 and this returns 1257 years, which is the braking assumption showing rather than an arithmetic error',
    X.psrTau(c.P, c.Pd) > 1200 && X.psrTau(c.P, c.Pd) < 1300 && X.psrTau(c.P, c.Pd) > 2026 - 1054,
    `tau = ${X.psrTau(c.P, c.Pd).toFixed(0)} yr against a true age of ${2026 - 1054} yr — a 29% overestimate, and it is what P/2Pdot means when the star was NOT born spinning much faster than it is now`);

  {
    /* the millisecond pulsars are a different population, and the two numbers say so */
    const m = X.PSR_PRESETS.ms;
    ok('a millisecond pulsar comes out with a field four orders of magnitude weaker and an age three orders older, from the same two formulas',
      X.psrB(m.P, m.Pd) < 1e9 && X.psrTau(m.P, m.Pd) > 1e9 && X.psrTau(m.P, m.Pd) / X.psrTau(c.P, c.Pd) > 1e5,
      `J0437: B = ${X.psrB(m.P, m.Pd).toExponential(3)} G and tau = ${X.psrTau(m.P, m.Pd).toExponential(3)} yr against the Crab's ${X.psrB(c.P, c.Pd).toExponential(2)} G and ${X.psrTau(c.P, c.Pd).toFixed(0)} yr — spun up by accretion, not born fast`);

    let worstS = 0;
    for (const [a, z] of [[0.6, 0.8], [1.2, 1.5], [0.3, 2.0], [2.5, 2.9]]) {
      const num = (X.psrRvm(a, z, 1e-5) - X.psrRvm(a, z, -1e-5)) / 2e-5;
      worstS = Math.max(worstS, Math.abs(num / (Math.sin(a) / Math.sin(z - a)) - 1));
    }
    ok('and the steepest slope of the Rotating Vector Model curve is sin(alpha)/sin(zeta - alpha) — a closed form, checked against the derivative of the curve itself',
      worstS < 1e-6,
      `worst relative disagreement over four geometries = ${worstS.toExponential(2)} · that slope is the one number a polarization sweep actually measures, and it constrains the two angles together`);
  }

  /* THE EDDINGTON LIMIT. */
  {
    ok('the Eddington luminosity is exactly linear in the mass and independent of everything else, which is why a brightness is a mass measurement',
      Math.abs(X.qsoLEdd(2e8) / X.qsoLEdd(1e8) - 2) < 1e-12 &&
      Math.abs(X.qsoLEdd(1e9) / X.qsoLEdd(1) - 1e9) < 1e-3,
      `doubling the mass doubles it to ${(X.qsoLEdd(2e8) / X.qsoLEdd(1e8)).toFixed(12)} · a solar mass gives ${X.qsoLEdd(1).toExponential(4)} erg/s, which is 33 000 times the Sun's actual output — the Sun is nowhere near its own Eddington limit`);

    ok('and the Schwarzschild ISCO efficiency is 1 - sqrt(8/9), recomputed rather than quoted — six per cent of the rest mass, against 0.7% for hydrogen fusion',
      Math.abs(X.QSO_ETA - (1 - Math.sqrt(8 / 9))) < 1e-15 && Math.abs(X.QSO_ETA - 0.0571) < 1e-3 &&
      X.QSO_ETA / 0.007 > 8,
      `eta = ${X.QSO_ETA.toFixed(9)} · that is ${(X.QSO_ETA / 0.007).toFixed(1)} times as efficient as fusion, which is why accretion powers the brightest objects in the universe and fusion does not`);
  }

  /* UNITARITY AS AN IDENTITY, NOT A TOLERANCE. */
  {
    let worstU = 0, n = 0;
    for (const kR of [0.05, 0.3, 0.55, 1.2, 2.8]) for (const kI of [0.001, 0.02, 0.09, 0.4, 0.9])
      for (const k of [0.01, 0.1, 0.5, 1.0, 2.5, 9.0]) {
        const s = X.rshS(k, kR, kI); worstU = Math.max(worstU, Math.abs(Math.hypot(s[0], s[1]) - 1)); n++;
      }
    ok('the two-pole S-matrix has modulus exactly one at every real momentum — 150 of them — because analyticity puts the mirror pole where unitarity needs it',
      worstU < 1e-14,
      `worst ||S(k)| - 1| over ${n} (pole, momentum) combinations = ${worstU.toExponential(2)} · this is an IDENTITY: the mirror pole at -k_p* makes the numerator and denominator complex conjugates for real k, and no tolerance is involved anywhere`);

    /* the deuteron, from two low-energy numbers and nothing else */
    const P = X.rshErePole(5.4194, 1.7536), B = X.RSH_C * P.k1 * P.k1;
    ok('and the deuteron binding energy comes out of the triplet scattering length and effective range alone, to under a tenth of a per cent',
      !P.bad && P.k1 > 0 && Math.abs(B / 2.224566 - 1) < 0.001,
      `B = ${B.toFixed(6)} MeV against the measured 2.224566 — ${((B / 2.224566 - 1) * 100).toFixed(4)}% from two numbers that say nothing about the nuclear force`);

    const V = X.rshErePole(-23.740, 2.77);
    ok('while the SINGLET channel gives a negative momentum from the identical algebra — a virtual state and not a bound one, and only the sign says so',
      !V.bad && V.k1 < 0 && P.k1 > 0 && Math.abs(X.RSH_C * V.k1 * V.k1 * 1000 - 66) < 3,
      `singlet kappa = ${V.k1.toFixed(6)} 1/fm at ${(X.RSH_C * V.k1 * V.k1 * 1000).toFixed(2)} keV · the triplet gives +${P.k1.toFixed(6)} · the difference between a deuteron existing and a di-neutron not existing is that sign`);

    ok('and where 2 r_0 exceeds a there is no real pole at all, and the discriminant says so rather than a square root of a negative number leaking out',
      X.rshErePole(1.0, 3.0).bad === true && X.rshErePole(5.4194, 1.7536).bad === false,
      `a = 1, r_0 = 3 gives a discriminant of ${X.rshErePole(1.0, 3.0).disc.toFixed(4)} and the flag is set`);

    /* the resonance peaks where the closed form says, to five digits */
    const S = { mode: 'pole', kR: 0.55, kI: 0.09 };
    let peak = 0, Epk = 0;
    for (let E = 0.1; E < 30; E += 0.001) { const s = X.rshSigma(E, S); if (s > peak) { peak = s; Epk = E; } }
    const ER = X.RSH_C * (0.55 * 0.55 - 0.09 * 0.09);
    ok('and the cross section peaks exactly where the pole says it will: (hbar^2/2mu)(k_R^2 - k_I^2), found by scanning the curve rather than by trusting the formula',
      Math.abs(Epk / ER - 1) < 1e-3,
      `scanned peak at ${Epk.toFixed(4)} MeV against the closed form ${ER.toFixed(4)} MeV`);
  }

  /* A LEDGER THAT BALANCES. */
  {
    let worstT = 0, bad = 0;
    for (let p = 0; p <= 1; p += 0.005) { const c2 = X.rpdCounts(p);
      const t = c2.acc + c2.hid + c2.re; worstT = Math.max(worstT, Math.abs(t - X.RPD_N)); if (t !== X.RPD_N) bad++; }
    ok('the information ledger balances at every one of 201 stages: accessible plus hidden plus re-expressed is exactly 48, and these are integers rather than amplitudes',
      worstT === 0 && bad === 0,
      `201 stages · every total exactly ${X.RPD_N} · nothing is ever lost from the count, which is a property of how the model was written and not a result about black holes`);

    /* the swallowed set is a running maximum: nothing is ever un-swallowed */
    let mono = true, prev = -1;
    for (let p = 0; p <= 0.4; p += 0.002) { const s = X.rpdCounts(p).swallowed.length; if (s < prev) mono = false; prev = s; }
    ok('and the swallowed set only ever grows while the horizon does — nothing is un-swallowed, because it is the running maximum of the horizon history and not its current value',
      mono,
      `the count rises monotonically from ${X.rpdCounts(0).swallowed.length} to ${X.rpdCounts(0.4).swallowed.length} over the formation half`);

    const start = X.rpdIext(0), end = X.rpdIext(1), mid = X.rpdIext(0.4);
    ok('the external information falls as the horizon grows and returns to EXACTLY its starting value once every hidden class has been re-expressed',
      Math.abs(end - start) < 1e-12 && mid < start - 1,
      `I_ext = ${start.toFixed(6)} bits at the start, ${mid.toFixed(6)} at the peak of the horizon, ${end.toFixed(6)} at the end — the return is exact because the counts are integers, and the model was built that way rather than found to be that way`);
  }
}

console.log('\n=== 17. A ceiling, an anomaly, a sum that is one, and an integrator graded ===\n');
{
  /* A SHOCK CANNOT COMPRESS A GAS BY MORE THAN (gamma+1)/(gamma-1), however hard you hit
     it. That ceiling is the whole content of the Rankine-Hugoniot conditions. */
  let worstOver = -Infinity, mono = true, prev = 0;
  for (const M of [1, 1.2, 1.5, 2, 3, 5, 10, 20, 100, 1000, 1e5]) {
    const c = X.rmhdShock(M).compression;
    worstOver = Math.max(worstOver, c - 4);
    if (c < prev) mono = false; prev = c;
  }
  ok('a strong shock compresses a monatomic gas by four and never more, at eleven Mach numbers spanning five decades',
    worstOver < 0 && mono && X.rmhdShock(1e5).compression > 3.9999,
    `worst excess over the ceiling = ${worstOver.toExponential(2)} (negative at every Mach) · M = 1000 gives ${X.rmhdShock(1000).compression.toFixed(6)} and M = 1e5 gives ${X.rmhdShock(1e5).compression.toFixed(6)} — approaching 4 and never arriving`);

  ok('and the ceiling moves with the adiabatic index exactly as (gamma+1)/(gamma-1), which is 4, 6 and 7 for the three gases that matter',
    [[5 / 3, 4], [1.4, 6], [1.3, 7 + 2 / 3]].every(([g, want]) =>
      Math.abs(X.rmhdShock(1e6, g).compression - want) < 1e-3 && X.rmhdShock(1e6, g).compression < want),
    `gamma = 5/3 -> ${X.rmhdShock(1e6, 5 / 3).compression.toFixed(4)} · 1.4 -> ${X.rmhdShock(1e6, 1.4).compression.toFixed(4)} · 1.3 -> ${X.rmhdShock(1e6, 1.3).compression.toFixed(4)} · a softer gas compresses more, which is why radiation-dominated shocks are thinner`);

  ok('the PRESSURE jump has no ceiling at all — that is where the energy goes once the density cannot rise any further',
    X.rmhdShock(1000).pressure > 1e6 && X.rmhdShock(1e5).pressure / X.rmhdShock(1000).pressure > 9000,
    `M = 1000 gives ${X.rmhdShock(1000).pressure.toExponential(3)} and M = 1e5 gives ${X.rmhdShock(1e5).pressure.toExponential(3)} — it grows as M^2 forever, while the compression sits at 4`);

  ok('the Alfven speed is B/sqrt(rho), so doubling the field and quadrupling the density leaves it exactly unchanged',
    [[1, 1], [2, 4], [3, 9], [0.5, 0.25]].every(([b, r]) => Math.abs(X.rmhdAlfven(b, r) - 1) < 1e-15),
    `four (B, rho) pairs on the same characteristic all give exactly ${X.rmhdAlfven(3, 9)}`);

  ok('and the Sweet-Parker rate is S^(-1/2) exactly, with the plasmoid threshold flagged where the formula stops applying',
    [3, 4, 6, 8, 12].every(l => Math.abs(X.rmhdSweetParker(l).rate * Math.pow(10, l / 2) - 1) < 1e-12) &&
    X.rmhdSweetParker(4).plasmoid === false && X.rmhdSweetParker(6).plasmoid === true,
    `rate * sqrt(S) = 1 at five Lundquist numbers · the plasmoid flag turns on between logS 4 and 6, which is where the real reconnection rate stops being this one`);

  {
    const stable = X.rmhdRT(0.55, 4, 0.5), unstable = X.rmhdRT(0.55, 1.4, 0.28);
    const kc = 0.55 / (0.28 * 0.28);
    ok('and magnetic tension stabilises Rayleigh-Taylor above a critical wavenumber, rather than merely slowing it',
      unstable.gamma > 0 && stable.stable === true && Math.abs(X.rmhdRT(0.55, kc, 0.28).gamma2) < 1e-12,
      `k = 1.4 grows at ${unstable.gamma.toFixed(6)} · k = 4 with more tension is stable · exactly at k = A/beta^2 = ${kc.toFixed(6)} the growth rate is ${X.rmhdRT(0.55, kc, 0.28).gamma2.toExponential(2)}, which is zero`);
  }

  /* ANDERSON. Every state in 1D is localised at any disorder — and the textbook formula
     for how strongly is WRONG at exactly one energy, which is worth showing. */
  {
    let worstOff = 0, rows = [];
    for (const E of [0.5, 1.0, 1.5, -0.8]) {
      const g = X.andGamma(E, 1, 400000, 777), th = X.andThouless(E, 1);
      worstOff = Math.max(worstOff, Math.abs(g.g / th - 1));
      if (E === 1.0) rows.push(`E = 1: measured ${g.g.toFixed(6)} against ${th.toFixed(6)}`);
    }
    ok('away from the band centre the measured Lyapunov exponent matches the Thouless weak-disorder formula to a few per cent',
      worstOff < 0.05,
      `${rows[0]} · worst departure over four energies = ${(100 * worstOff).toFixed(2)}%`);

    const c = X.andGamma(0, 1, 400000, 777), tc = X.andThouless(0, 1);
    ok('and AT the band centre it does not — the Kappus-Wegner anomaly, eight per cent low and many standard errors away from the formula',
      c.g / tc < 0.95 && Math.abs(c.g - tc) / c.se > 3,
      `E = 0: measured ${c.g.toFixed(6)} against the formula's ${tc.toFixed(6)} — ${(100 * (1 - c.g / tc)).toFixed(1)}% low, and ${(Math.abs(c.g - tc) / c.se).toFixed(1)} standard errors away · this is a real effect at exactly one energy, and it is why the instrument returns an error bar rather than a number`);

    /* gamma goes as W^2 in the weak-disorder limit, which is the scaling the formula rests on */
    const g1 = X.andGamma(1, 0.5, 400000, 31).g, g2 = X.andGamma(1, 1, 400000, 31).g, g3 = X.andGamma(1, 2, 400000, 31).g;
    ok('and it scales as the square of the disorder, which is the statement the Thouless formula actually rests on',
      Math.abs(g2 / g1 / 4 - 1) < 0.08 && Math.abs(g3 / g2 / 4 - 1) < 0.08,
      `W = 0.5, 1, 2 give ${g1.toExponential(3)}, ${g2.toExponential(3)}, ${g3.toExponential(3)} · ratios ${(g2 / g1).toFixed(3)} and ${(g3 / g2).toFixed(3)} against the exact 4`);

    ok('every state is localised at every disorder tested, however weak — there is no mobility edge in one dimension and the exponent never touches zero',
      [0.05, 0.1, 0.3, 1, 4].every(W => X.andGamma(1, W, 200000, 5).g > 0),
      `W = 0.05 still gives ${X.andGamma(1, 0.05, 200000, 5).g.toExponential(3)} per site — a localisation length of ${(1 / X.andGamma(1, 0.05, 200000, 5).g).toExponential(2)} sites, which is enormous and is not infinite`);
  }

  /* THE BATEMAN CHAIN. Three fractions, one sum, no tolerance. */
  {
    let worstSum = 0;
    for (let d = 0; d <= 1000; d += 2.5) { const f = X.snDecayFractions(d * X.SN_DAY);
      worstSum = Math.max(worstSum, Math.abs(f.Ni + f.Co + f.Fe - 1)); }
    ok('the nickel, cobalt and iron fractions sum to one at every one of 401 times — nothing leaves the chain',
      worstSum < 1e-12,
      `worst |sum - 1| over 401 epochs = ${worstSum.toExponential(2)}`);

    const at1e = X.snDecayFractions(X.SN_TAUNI);
    ok('and at one nickel mean life exactly 1/e of the nickel is left, which is what a mean life means',
      Math.abs(at1e.Ni - Math.exp(-1)) < 1e-12,
      `f_Ni(tau_Ni) = ${at1e.Ni.toFixed(12)} against 1/e = ${Math.exp(-1).toFixed(12)}`);

    /* the late-time light curve decays on the COBALT mean life, not the nickel one */
    const slope = d => { const h = 0.01 * X.SN_DAY, t = d * X.SN_DAY;
      return (Math.log(X.snLradio(t + h, 0.6)) - Math.log(X.snLradio(t - h, 0.6))) / (2 * h); };
    const tau = d => -1 / slope(d) / X.SN_DAY;
    ok('the late-time luminosity decays on the COBALT mean life and not the nickel one — 111.3 days, which is why a supernova tail is slow',
      Math.abs(tau(200) - 111.3) < 0.01 && Math.abs(tau(800) - 111.3) < 0.01 && Math.abs(tau(20) - 111.3) > 1,
      `e-folding time is ${tau(20).toFixed(2)} d at day 20 and ${tau(200).toFixed(4)} d at day 200 — it walks from the nickel life to the cobalt one as the chain moves on`);

    ok('and that tail is 0.98 magnitudes per hundred days, which is the number a light curve is actually measured by',
      Math.abs(2.5 * Math.log10(Math.exp(-slope(300) * 100 * X.SN_DAY)) - 0.98) < 0.01,
      `${(2.5 * Math.log10(Math.exp(-slope(300) * 100 * X.SN_DAY))).toFixed(4)} mag/100d — the cobalt mean life in the units observers use`);

    ok('the cobalt term overtakes the nickel one on day 17.6, later than the fractions cross, because nickel releases 5.75 times more energy per gram',
      X.snRadioComponents(17 * X.SN_DAY, 0.6).Co < X.snRadioComponents(17 * X.SN_DAY, 0.6).Ni &&
      X.snRadioComponents(18 * X.SN_DAY, 0.6).Co > X.snRadioComponents(18 * X.SN_DAY, 0.6).Ni,
      `nickel still leads on day 17 and cobalt leads on day 18 · e_Ni/e_Co = ${(X.SN_ENI / X.SN_ECO).toFixed(3)}, and the fractions themselves crossed on day 3`);
  }

  /* THE INTEGRATOR, GRADED BY A QUADRATURE THAT SHARES NO CODE WITH IT. */
  {
    let worstRel = 0, rows = [];
    for (const b of [2.7, 3, 4, 5, 8, 12]) {
      const t = X.bhrTraceJS(b, 40000), ex = X.lensAlpha(b);
      if (t.captured || ex === null) { rows.push(`b=${b} captured`); continue; }
      const tr = Math.abs(Math.atan2(t.dir[1], t.dir[0]));
      worstRel = Math.max(worstRel, Math.abs(tr - ex) / Math.abs(ex));
    }
    ok('the geodesic integrator agrees with the exact deflection quadrature to under a per cent across its whole declared domain',
      worstRel < 0.01,
      `worst relative difference over six impact parameters from 2.7 to 12 = ${(100 * worstRel).toFixed(3)}% · the quadrature is lensAlpha, which shares no arithmetic with the leapfrog and is the same one the lensing laboratory uses`);

    /* and it does NOT agree outside that domain, which is why the domain stops there */
    const b40 = X.bhrTraceJS(40, 40000), ex40 = X.lensAlpha(40);
    const tr40 = Math.abs(Math.atan2(b40.dir[1], b40.dir[0]));
    ok('and it does NOT agree beyond it: at b = 40 the tracer is half the exact answer, because it starts the photon at x = -30 and a wide ray begins already bent',
      Math.abs(tr40 - ex40) / ex40 > 0.4,
      `traced ${tr40.toFixed(6)} against exact ${ex40.toFixed(6)} — ${(100 * Math.abs(tr40 - ex40) / ex40).toFixed(0)}% low · that is the reason the declared domain stops at 12, and it is a property of the tracer's geometry rather than of the physics`);

    ok('capture happens at 3 sqrt(3)/2 in units of the Schwarzschild radius, and both routes agree on which side of it a photon is',
      X.lensAlpha(2.59) === null && X.lensAlpha(2.61) !== null &&
      X.bhrTraceJS(2.55, 40000).captured === true && X.bhrTraceJS(2.7, 40000).captured === false,
      `b_crit = ${X.LENS_BCRIT.toFixed(6)} · the quadrature refuses below it and returns ${X.lensAlpha(2.61).toFixed(4)} rad just above · the tracer's threshold agrees to about a part in a thousand`);

    ok('and far from the hole the exact deflection approaches 2 r_s/b, which is twice the Newtonian answer and is what was measured in 1919',
      Math.abs(X.lensAlpha(200) / (2 / 200) - 1) < 0.01 && Math.abs(X.lensAlpha(2000) / (2 / 2000) - 1) < 0.002,
      `b = 200 gives ${(X.lensAlpha(200) / (2 / 200)).toFixed(6)} times the weak-field value and b = 2000 gives ${(X.lensAlpha(2000) / (2 / 2000)).toFixed(6)} · at b = 3 the same ratio is ${(X.lensAlpha(3) / (2 / 3)).toFixed(4)}, which is the whole difference between a lens and a black hole`);
  }
}

console.log('\n=== 18. A counterexample, a first law, a bounded energy and a slope that never turns ===\n');
{
  /* THE COUNTEREXAMPLE IS THE POINT. Every symplectic matrix has determinant 1; the
     converse is false, and this laboratory ships a matrix that proves it. */
  let canon = [], bad = null;
  for (const k of ['squeeze', 'shear', 'mix']) for (const l of [0.4, 1.4, 3.3]) {
    const S = X.PSP_MAPS[k].f(l);
    canon.push({ k, l, def: X.pspSympDefect(S), det: X.pspDet(S) });
  }
  { const S = X.PSP_MAPS.bad.f(1.4); bad = { def: X.pspSympDefect(S), det: X.pspDet(S) }; }
  ok('the three canonical maps satisfy S^T J S = J to the last bit and all have determinant exactly 1',
    canon.every(c => c.def < 1e-14 && Math.abs(c.det - 1) < 1e-12),
    `nine (map, parameter) pairs · worst defect ${Math.max(...canon.map(c => c.def)).toExponential(2)} · worst |det - 1| ${Math.max(...canon.map(c => Math.abs(c.det - 1))).toExponential(2)}`);

  ok('and the counterexample has determinant exactly 1 while NOT being canonical — det = 1 is necessary and is not sufficient, and the laboratory carries the proof rather than the claim',
    Math.abs(bad.det - 1) < 1e-12 && bad.def > 0.5 && X.PSP_MAPS.bad.symp === false,
    `the "bad" map: det = ${bad.det.toFixed(12)}, symplectic defect = ${bad.def.toFixed(6)} · it preserves phase-space VOLUME and destroys the symplectic FORM, which is more than a volume`);

  {
    /* the symplectic matrices are a GROUP: closed under products and inverses */
    let worstP = 0, worstI = 0;
    for (const a of ['squeeze', 'shear', 'mix']) for (const b of ['squeeze', 'shear', 'mix']) {
      const S = X.pspMul(X.PSP_MAPS[a].f(1.7), X.PSP_MAPS[b].f(0.6));
      worstP = Math.max(worstP, X.pspSympDefect(S));
      const negJ = X.PSP_J.map(r => r.map(v => -v));
      worstI = Math.max(worstI, X.pspSympDefect(X.pspMul(X.pspMul(negJ, X.pspT4(S)), X.PSP_J)));
    }
    ok('and they form a group: every product of two canonical maps is canonical, and so is every inverse',
      worstP < 1e-14 && worstI < 1e-14,
      `nine products · worst defect ${worstP.toExponential(2)} · worst inverse defect ${worstI.toExponential(2)} — the inverse is -J S^T J, which IS the inverse only for a symplectic matrix`);
  }

  /* THE FIRST LAW, FROM ANALYTIC DERIVATIVES — no difference quotient anywhere. */
  {
    let worstM = 0, worstJ = 0, worstQ = 0, n = 0;
    for (const [M, J, Q] of [[1, 0, 0], [1, 0.4, 0], [1, 0.6, 0.2], [2, 1.1, 0.5], [0.5, 0.1, 0.05], [3, 2.0, 1.0]]) {
      const k = X.cpsKN(M, J, Q); if (!k) continue;
      const g = X.cpsDA(M, J, Q), f = k.kappa / (8 * Math.PI);
      worstM = Math.max(worstM, Math.abs(f * g.M - 1));
      worstJ = Math.max(worstJ, Math.abs(f * g.J + k.Om));
      worstQ = Math.max(worstQ, Math.abs(f * g.Q + k.Phi)); n++;
    }
    ok('the first law of black-hole mechanics holds in all three directions at once, to the last bit, from analytic derivatives of the area',
      n >= 6 && worstM < 1e-12 && worstJ < 1e-12 && worstQ < 1e-12,
      `${n} Kerr-Newman configurations · worst |(kappa/8pi) A_M - 1| = ${worstM.toExponential(2)} · |(kappa/8pi) A_J + Omega| = ${worstJ.toExponential(2)} · |(kappa/8pi) A_Q + Phi| = ${worstQ.toExponential(2)} — there is no finite difference anywhere in this`);

    ok('and past M^2 = a^2 + Q^2 there is no horizon and the engine returns null rather than extrapolating into a naked singularity',
      X.cpsKN(1, 0.8, 0.7) === null && X.cpsKN(1, 1.2, 0) === null && X.cpsKN(1, 0.9, 0.3) !== null,
      `M = 1, J = 0.8, Q = 0.7 gives M^2 - a^2 - Q^2 = ${(1 - 0.64 - 0.49).toFixed(2)} and is refused · J = 0.9, Q = 0.3 is admitted`);

    /* THE AREA AT EXTREMALITY DEPENDS ON WHICH EXTREMAL, and this check first asked for
       4 pi M^2 at extremal KERR, which is the Reissner-Nordstrom answer. Extremal Kerr has
       r+ = M and a = M, so A = 4 pi(M^2 + M^2) = 8 pi M^2 — twice as much. Both are tested
       now, because the pair says which term of r+^2 + a^2 is carrying the area. */
    const kerr = X.cpsKN(1, 1, 0), rn = X.cpsKN(1, 0, 1);
    ok('at extremality the surface gravity vanishes exactly — and the area is 8 pi M^2 for extremal Kerr and 4 pi M^2 for extremal Reissner-Nordstrom, which is not the same number',
      kerr.extremal === true && Math.abs(kerr.kappa) < 1e-12 && Math.abs(kerr.A - 8 * Math.PI) < 1e-9 &&
      rn.extremal === true && Math.abs(rn.kappa) < 1e-12 && Math.abs(rn.A - 4 * Math.PI) < 1e-9,
      `extremal Kerr (J = M^2): kappa = ${kerr.kappa.toExponential(2)}, A = ${kerr.A.toFixed(9)} = 8 pi, Omega = ${kerr.Om} · extremal Reissner-Nordstrom (Q = M): kappa = ${rn.kappa.toExponential(2)}, A = ${rn.A.toFixed(9)} = 4 pi, Omega = ${rn.Om} · the spin puts a^2 into the area and the charge does not`);
  }

  {
    /* THE CURL. With no injected term the charge IS the mass and its integral is path
       independent; inject c and the curl comes out exactly 2c and the loop stops closing. */
    let worstC = 0;
    for (const c of [0, 0.1, 0.5, -0.3, 2]) worstC = Math.max(worstC, Math.abs(X.cpsCurl(1, 0.5, 0.2, c) - 2 * c));
    ok('the field-space curl of the charge one-form is exactly 2c, at five injected values including zero',
      worstC < 1e-9,
      `worst |measured - 2c| = ${worstC.toExponential(2)} · at c = 0 the charge is dM exactly, which is why it is integrable`);

    const loop = t => { const th = 2 * Math.PI * t; return [1 + 0.15 * Math.cos(th), 0.5 + 0.15 * Math.sin(th)]; };
    const z = X.cpsPathIntegral(loop, 0.2, 0, 4000).value;
    const nz = X.cpsPathIntegral(loop, 0.2, 0.3, 4000).value;
    const area = Math.PI * 0.15 * 0.15;
    ok('and a closed loop integrates to zero when the charge is integrable and to the enclosed curl when it is not — Stokes, measured rather than invoked',
      Math.abs(z) < 1e-12 && Math.abs(Math.abs(nz) / (2 * 0.3 * area) - 1) < 0.02,
      `c = 0 gives ${z.toExponential(2)} · c = 0.3 gives ${nz.toExponential(4)} against the enclosed 2c x area = ${(2 * 0.3 * area).toExponential(4)} — the sign is the loop's orientation`);
  }

  /* A SYMPLECTIC INTEGRATOR: what it conserves exactly, and what it merely bounds. */
  {
    const run = (dt, N) => {
      const B = [{ m: 1, x: -1, y: 0, vx: 0.347111, vy: 0.532728 },
                 { m: 1, x: 1, y: 0, vx: 0.347111, vy: 0.532728 },
                 { m: 1, x: 0, y: 0, vx: -2 * 0.347111, vy: -2 * 0.532728 }];
      const i0 = X.gravInvariants(B); let dE = 0, dP = 0, dL = 0;
      for (let n = 0; n < N; n++) { X.gravStep(B, dt);
        if (n % 200 === 0) { const q = X.gravInvariants(B);
          dE = Math.max(dE, Math.abs(q.E - i0.E)); dP = Math.max(dP, Math.abs(q.P - i0.P)); dL = Math.max(dL, Math.abs(q.Lz - i0.Lz)); } }
      return { dE, dP, dL, E0: i0.E };
    };
    const a = run(0.001, 200000);
    ok('momentum and angular momentum are conserved to rounding over two hundred thousand steps, because the force loop enforces Newton’s third law in a single statement',
      a.dP < 1e-12 && a.dL < 1e-12,
      `worst |dP| = ${a.dP.toExponential(2)} and |dL_z| = ${a.dL.toExponential(2)} over 200000 steps of the figure-eight orbit · these are exact by construction and not by accuracy`);

    ok('and the energy does not drift: it oscillates inside a bound that a symplectic method guarantees and a Runge-Kutta does not',
      a.dE < 1e-9,
      `worst |dE| = ${a.dE.toExponential(2)} against E_0 = ${a.E0.toFixed(9)} — a relative excursion of ${(a.dE / Math.abs(a.E0)).toExponential(2)}, bounded rather than growing`);

    const b = run(0.004, 50000), c = run(0.002, 100000);
    ok('and that bound falls as the fourth power of the step, which is what the Yoshida composition is for',
      Math.abs(Math.log(b.dE / c.dE) / Math.log(2) - 4) < 0.35,
      `dt = 0.004 gives ${b.dE.toExponential(3)} and dt = 0.002 gives ${c.dE.toExponential(3)} · the ratio is ${(b.dE / c.dE).toFixed(2)}, a power of ${(Math.log(b.dE / c.dE) / Math.log(2)).toFixed(3)} against the exact 4`);
  }

  /* CONFINEMENT IS A STATEMENT ABOUT A SLOPE. */
  {
    let allPositive = true, minF = Infinity;
    for (let r = 0.01; r <= 5; r += 0.01) {
      const F = (4 / 3) * X.QCD_AS * X.QCD_HC / (r * r) + X.QCD_SIG;
      if (!(F > 0)) allPositive = false; minF = Math.min(minF, F);
    }
    ok('the force between two quarks is positive at every separation out to five femtometres — it never turns over, and that is what confinement means',
      allPositive && minF >= X.QCD_SIG - 1e-12,
      `500 separations · the smallest force is ${minF.toFixed(6)} GeV/fm, which is the string tension itself · however far apart you pull them the force does not fall below sigma, so no finite energy frees a quark`);

    const r0 = Math.sqrt(4 * X.QCD_AS * X.QCD_HC / (3 * X.QCD_SIG));
    ok('and the potential crosses zero at exactly sqrt(4 alpha_s hbar c/3 sigma), where the Coulomb and confining terms cancel',
      Math.abs(X.qcdV(r0)) < 1e-12 && Math.abs(r0 - 0.2961) < 1e-3,
      `r_0 = ${r0.toFixed(9)} fm and V(r_0) = ${X.qcdV(r0).toExponential(2)} GeV · the potential is NEGATIVE inside it and positive outside, and it has no minimum anywhere because its slope never changes sign`);

    /* asymptotic freedom, and the Landau pole */
    const scales = [1, 2, 5, 10, 91.1876, 1000, 1e4];
    const as = scales.map(q => X.qcdAlphaS(q));
    ok('the running coupling falls monotonically across four decades of momentum — asymptotic freedom, measured rather than asserted',
      as.every((v, k) => k === 0 || v < as[k - 1]),
      `alpha_s at 1, 2, 5, 10, 91.2, 1000 and 10000 GeV: ${as.map(v => v.toFixed(4)).join(' > ')}`);

    const aZ = X.qcdAlphaS(91.1876);
    ok('and it misses the measured value at the Z mass by 14 per cent, which is what one loop costs — the instrument returns that error rather than tuning Lambda to hide it',
      Math.abs(aZ / 0.1180 - 1) > 0.10 && Math.abs(aZ / 0.1180 - 1) < 0.20,
      `alpha_s(M_Z) = ${aZ.toFixed(6)} against the world average 0.1180 — ${(100 * (aZ / 0.1180 - 1)).toFixed(1)}% high · a fitted Lambda would close this and would be a fit rather than one loop`);

    ok('the coupling diverges at the Landau pole rather than staying finite, which is where a perturbative expansion in it stops existing',
      X.qcdAlphaS(0.2101) > 20 && X.qcdAlphaS(0.25) > 1 && X.qcdAlphaS(2) < 0.5,
      `alpha_s(0.2101 GeV) = ${X.qcdAlphaS(0.2101).toFixed(2)} · at Lambda = 0.21 the logarithm vanishes and the one-loop formula has a pole, which is the scale confinement lives at`);
  }
}

console.log(`\n${fail === 0 ? '✔' : '✗'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
