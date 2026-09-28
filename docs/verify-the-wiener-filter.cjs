#!/usr/bin/env node
'use strict';
/* ══ THE WIENER FILTER AND THE MASTER SPECTRUM ═════════════════════════════════════════════
 * Seeing the sky through a mask, on an exact harmonic transform. Checked:
 *   1. the transform is exact: Gauss–Legendre weights sum to 2, pixel areas to 4π, and analysis(synthesis(a)) = a
 *      to rounding at L = 48
 *   2. unmasked, the Wiener filter IS the textbook a_WF = C/(C+N)·a_obs — the conjugate-gradient solution matches
 *      it to 10⁻¹⁰ in at most two iterations (the preconditioner is then the exact inverse)
 *   3. masked, the solver converges, and the Wiener sky is the posterior mean: its error s − s_WF is uncorrelated
 *      with the estimate over many skies (the orthogonality principle), while the naive cut-sky estimate is not
 *   4. the mask coupling is exact: (1 1 2; 0 0 0)² = 2/15, Σ(2ℓ₃+1)(ℓ₁ ℓ₂ ℓ₃; 0 0 0)² = 1, a full sky couples
 *      nothing (M = I), and a column of M built from unit harmonics through the mask equals the 3j formula
 *   5. MASTER is unbiased and 1/f_sky is not: over 300 masked skies, χ²/dof of MASTER against the input spectrum
 *      is near 1 while the shortcut's is many times that, low on the largest scales
 *   6. wiring: the section in the CMB laboratory, the worker, the API, and the discovery ledger
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { shtIdx, shtGauss, shtGrid, shtSynth, shtAnalysis, shtPixArea, shtCl, shtRealize, wfMask, wienerFilter, wf3j2, masterCoupling, masterSolve, masterMaskCoeffs, masterPseudoCl, cmbD, mulberry } = K;
  const spec = L => { const C = new Float64Array(L + 1); for (let l = 2; l <= L; l++) C[l] = 2 * Math.PI * cmbD(l, 'TT') / (l * (l + 1)); return C; };
  { const L = 48, G = shtGrid(L), gw = shtGauss(33).w.reduce((a, v) => a + v, 0), A = shtPixArea(G).reduce((a, v) => a + v, 0), a = shtRealize(spec(L), L, 5), b = shtAnalysis(G, shtSynth(G, a));
    const err = Math.max(...a.map((v, i) => Math.abs(v - b[i]))), rms = Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
    ok('the transform is exact: Σw = 2, Σ pixel area = 4π, analysis(synthesis(a)) = a to rounding', Math.abs(gw - 2) < 1e-13 && Math.abs(A - 4 * Math.PI) < 1e-11 && err < 1e-11 * rms * 100,
      `Σw − 2 = ${(gw - 2).toExponential(1)} · ΣΩ − 4π = ${(A - 4 * Math.PI).toExponential(1)} · max |Δa| ${err.toExponential(1)} (rms a ${rms.toFixed(2)} μK)`); }
  const L = 24, G = shtGrid(L), C = spec(L), A = shtPixArea(G), sigma2 = C[16];
  const noisy = (a, seed) => { const rnd = mulberry(seed), m = shtSynth(G, a); for (let p = 0; p < m.length; p++) { let u = 0; while (u === 0) u = rnd(); m[p] += Math.sqrt(sigma2 / A[p]) * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); } return m; };
  { const a = shtRealize(C, L, 7), d = noisy(a, 8), W = wienerFilter(G, C, sigma2, new Float64Array(d.length).fill(1), d, { tol: 1e-12 }), ao = shtAnalysis(G, d); let e = 0, n = 0;
    for (let l = 2; l <= L; l++) for (let m = -l; m <= l; m++) { const i = shtIdx(l, m), x = C[l] / (C[l] + sigma2) * ao[i]; e = Math.max(e, Math.abs(W.a[i] - x)); n = Math.max(n, Math.abs(x)); }
    ok('unmasked, the Wiener filter is exactly C/(C+N)·a_obs, found by the solver in at most two iterations', e / n < 1e-10 && W.iter <= 2, `max relative difference ${(e / n).toExponential(1)} · ${W.iter} iteration(s)`); }
  { const mask = wfMask(G, 20, [{ c: [0.3, 0.4, 0.866], r: 12 }]); let ex = 0, ee = 0, xx = 0, nx = 0, ne = 0, nn = 0, iters = 0, worst = 0; let fsky = 0; for (let p = 0; p < A.length; p++) fsky += mask[p] * A[p]; fsky /= 4 * Math.PI;
    for (let r = 0; r < 24; r++) { const a = shtRealize(C, L, 100 + r), d = noisy(a, 500 + r).map((v, p) => v * mask[p]), W = wienerFilter(G, C, sigma2, mask, d, { tol: 1e-9 }); iters += W.iter; worst = Math.max(worst, W.residual);
      const naive = shtAnalysis(G, d).map(v => v / fsky);
      for (let l = 2; l <= L; l++) for (let m = -l; m <= l; m++) { const i = shtIdx(l, m), e = a[i] - W.a[i], en = a[i] - naive[i]; ex += e * W.a[i]; ee += e * e; xx += W.a[i] ** 2; ne += en * naive[i]; nn += en * en; nx += naive[i] ** 2; } }
    const rho = ex / Math.sqrt(ee * xx), rhoN = ne / Math.sqrt(nn * nx);
    ok('masked, the solver converges and the Wiener sky is the posterior mean: its error is uncorrelated with it (the orthogonality principle), the naive cut-sky estimate\'s is not',
      worst < 1e-8 && Math.abs(rho) < 0.03 && Math.abs(rhoN) > 0.1, `24 skies, ${(iters / 24).toFixed(0)} iterations each · ρ(error, Wiener) ${rho.toFixed(4)} · ρ(error, naive) ${rhoN.toFixed(3)} · f_sky ${fsky.toFixed(3)}`); }
  { let sr = 0; for (let l3 = 0; l3 <= 40; l3++) sr += (2 * l3 + 1) * wf3j2(9, 17, l3);
    const Lm = 12, full = masterCoupling(Float64Array.from({ length: 2 * Lm + 1 }, (_, l) => l === 0 ? 4 * Math.PI : 0), Lm); let idErr = 0; for (let i = 0; i <= Lm; i++) for (let j = 0; j <= Lm; j++) idErr = Math.max(idErr, Math.abs(full[i][j] - (i === j ? 1 : 0)));
    const G2 = shtGrid(2 * Lm), bs = Math.sin(15 * Math.PI / 180), maskFn = n => Math.abs(n[2]) >= bs ? 1 : 0, w = masterMaskCoeffs(maskFn, 2 * Lm, 6), M = masterCoupling(shtCl(w, 2 * Lm), Lm);
    let colErr = 0; for (const lp of [2, 5, 9]) { const col = new Float64Array(Lm + 1); for (let m = -lp; m <= lp; m++) { const e = new Float64Array((Lm + 1) ** 2); e[shtIdx(lp, m)] = 1; const pc = masterPseudoCl(G2, e, Lm, w); for (let l = 0; l <= Lm; l++) col[l] += pc[l]; } for (let l = 0; l <= Lm; l++) colErr = Math.max(colErr, Math.abs(col[l] - M[l][lp])); }
    ok('the mask coupling is exact: (1 1 2; 0 0 0)² = 2/15, the 3j sum rule, M = I on the full sky, and columns of M built from unit harmonics through the mask equal the 3j formula',
      Math.abs(wf3j2(1, 1, 2) - 2 / 15) < 1e-14 && Math.abs(sr - 1) < 1e-12 && idErr < 1e-12 && colErr < 1e-12, `sum rule − 1 = ${(sr - 1).toExponential(1)} · ‖M_full − I‖ ${idErr.toExponential(1)} · column error ${colErr.toExponential(1)}`); }
  { const Lm = 32, Cm = spec(Lm), G2 = shtGrid(2 * Lm), bs = Math.sin(20 * Math.PI / 180), h = { c: [0.3, 0.4, 0.866], r: 12 }, maskFn = n => Math.abs(n[2]) >= bs && !(n[0] * h.c[0] + n[1] * h.c[1] + n[2] * h.c[2] > Math.cos(h.r * Math.PI / 180)) ? 1 : 0;
    const w = masterMaskCoeffs(maskFn, 2 * Lm, 4), M = masterCoupling(shtCl(w, 2 * Lm), Lm), fsky = w[0] / Math.sqrt(4 * Math.PI), R = 300, m1 = new Float64Array(Lm + 1), m2 = new Float64Array(Lm + 1), n1 = new Float64Array(Lm + 1), n2 = new Float64Array(Lm + 1);
    for (let r = 0; r < R; r++) { const pc = masterPseudoCl(G2, shtRealize(Cm, Lm, 1000 + r), Lm, w), e = masterSolve(M, pc, 2); for (let l = 2; l <= Lm; l++) { const x = e[l] / Cm[l], y = pc[l] / fsky / Cm[l]; m1[l] += x / R; m2[l] += x * x / R; n1[l] += y / R; n2[l] += y * y / R; } }
    let cm = 0, cn = 0, k = 0; for (let l = 2; l <= Lm; l++) { cm += ((m1[l] - 1) / Math.sqrt((m2[l] - m1[l] ** 2) / R)) ** 2; cn += ((n1[l] - 1) / Math.sqrt((n2[l] - n1[l] ** 2) / R)) ** 2; k++; }
    ok('MASTER is unbiased and 1/f_sky is not: over 300 masked skies MASTER\'s χ²/dof against the input is near 1, the shortcut\'s many times that, low on the largest scales',
      cm / k < 2 && cn / k > 6 && (n1[2] + n1[3]) / 2 < 0.85, `f_sky ${fsky.toFixed(3)} · χ²/dof MASTER ${(cm / k).toFixed(2)}, 1/f_sky ${(cn / k).toFixed(2)} · ℓ = 2, 3: MASTER ${m1[2].toFixed(3)}, ${m1[3].toFixed(3)} · shortcut ${n1[2].toFixed(3)}, ${n1[3].toFixed(3)}`); }
  ok('wiring: the section in the CMB laboratory, the worker, the API, and the discovery ledger',
    /\$\{cmbSpectrumSect\(\)\}\$\{wfSect\(\)\}/.test(SRC) && /function wfWorkerSrc\(\)/.test(SRC) && /globalThis\.HCC_CMB_WF=Object\.freeze\(\{run:/.test(SRC) && /\{id:'wiener', kind:'confirms'/.test(SRC));
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
