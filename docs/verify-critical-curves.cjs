#!/usr/bin/env node
'use strict';
/* ══ CRITICAL CURVES (v4.379) ════════════════════════════════════════════════════════════════════════════════════════
 * Families 237 and 230 of the openai/math collection (2026): the honeycomb self-avoiding walk has diameter n^{3/4+o(1)};
 * chordal SLE_κ has the exact Hausdorff gauge r^d (log log 1/r)^{(2−d)/2}, d = 1 + κ/8. The laboratory puts three lattice
 * curves on the line d = 1 + κ/8. Checked here on the page's own kernels, with fixed seeds:
 *   1. the honeycomb is the triangular lattice without one colour class — every vertex has three neighbours, the
 *      relation is symmetric — and the six maps of D3 about any vertex carry neighbours to neighbours
 *   2. exact enumeration: c₁ … c₉ = 3, 6, 12, 24, 48, 90, 174, 336, 648 (c₆ = 96 − 6: the six hexagons closing at step
 *      six), and the γ-corrected ratio estimate of the connective constant within 3·10⁻³ of √(2 + √2)
 *   3. the pivot algorithm keeps the walk self-avoiding and measures ν within 0.03 of 3/4 (family 237)
 *   4. the loop-erased walk at d within 0.06 of 5/4 (κ = 2); the percolation exploration path's largest-scale local
 *      slope within 0.12 of 7/4 and climbing (κ = 6) — the line d = 1 + κ/8 at two more points
 *   5. SLE: the slit map and its inverse agree to 10⁻¹², SLE₀ is the vertical segment of height 2√t, every trace point
 *      lies in the closed upper half-plane, and the gauge exceeds r^d by (log log 1/r)^{(2−d)/2} > 1 for d < 2
 *   6. wired: router, panel, multiview, contract, instrument
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  /* 1 */
  { let bad = 0, n = 0; const rnd = K.critRng(5);
    for (let s = 0; s < 3000; s++) { const i = Math.floor(rnd() * 60) - 30, j = Math.floor(rnd() * 60) - 30; if (K.critCol(i, j) === 0) continue; n++;
      const N = K.critNbrs(i, j); if (N.length !== 3) bad++;
      for (const [a, b] of N) { if (K.critCol(a, b) === 0 || !K.critNbrs(a, b).some(([x, y]) => x === i && y === j)) bad++;
        for (let g = 1; g <= 5; g++) { const P = K.critD3(g, a - i, b - j), Q = [P[0] + i, P[1] + j]; if (K.critCol(...Q) === 0 || !N.some(([x, y]) => x === Q[0] && y === Q[1])) bad++; } } }
    ok('the honeycomb as the triangular lattice without one colour class: three neighbours each, symmetric, and D3 about any vertex maps its neighbours onto its neighbours', bad === 0 && n > 1500, `${n} vertices · ${bad} violations`); }
  /* 2 */
  { const c = K.critEnumerate(22), R = K.critMuRatio(c), last = R[R.length - 1];
    ok('exact enumeration 3, 6, 12, 24, 48, 90, 174, 336, 648, and the γ = 43/32 corrected ratio estimate of the connective constant within 3·10⁻³ of √(2+√2) (Duminil-Copin–Smirnov)',
      [3, 6, 12, 24, 48, 90, 174, 336, 648].every((v, k) => c[k + 1] === v) && Math.abs(last.corr - K.CRIT_MU) < 3e-3 && Math.abs(last.raw - K.CRIT_MU) > Math.abs(last.corr - K.CRIT_MU),
      `c₂₂ = ${c[22]} · raw ${last.raw.toFixed(5)} · corrected ${last.corr.toFixed(5)} · √(2+√2) = ${K.CRIT_MU.toFixed(5)}`); }
  /* 3 */
  { const P = K.critPivotNu([50, 100, 200, 400], { seed: 7, samples: 6000 });
    ok('the pivot algorithm keeps every chain self-avoiding and measures the Flory–Nienhuis exponent: ν within 0.03 of 3/4 (family 237), so d = 1/ν near 4/3 = 1 + (8/3)/8',
      P.rows.every(r => r.saw) && Math.abs(P.nu - 0.75) < 0.03, `ν = ${P.nu.toFixed(4)} · 1/ν = ${(1 / P.nu).toFixed(4)} · ⟨R²⟩ ${P.rows.map(r => r.n + ':' + r.R2.toFixed(0)).join(' ')}`); }
  /* 4 */
  { const L = K.critLengthDim((R, g) => K.critLERW(R, g), [16, 32, 64, 128], 300, 3), H = K.critLengthDim((R, g) => K.critHull(R, g).path, [16, 32, 64, 128], 400, 4);
    const loc = H.rows.slice(1).map((r, i) => Math.log(r.len / H.rows[i].len) / Math.log(2)), top = loc[loc.length - 1];
    ok('two more points on d = 1 + κ/8: the loop-erased walk at 5/4 (κ = 2, within 0.06) and the percolation exploration path climbing to 7/4 (κ = 6, largest-scale local slope within 0.12)',
      Math.abs(L.d - 1.25) < 0.06 && Math.abs(top - 1.75) < 0.12 && top > loc[0], `LERW d ${L.d.toFixed(3)} · percolation local slopes ${loc.map(v => v.toFixed(3)).join(' → ')}`); }
  /* 5 */
  { const rnd = K.critRng(8); let inv = 0, below = 0;
    for (let s = 0; s < 300; s++) { const w = [rnd() * 4 - 2, rnd() * 2 + 1e-3], W = rnd() - 0.5, f = K.critSlitInv(K.critSlit(w, W, 0.01), W, 0.01); inv = Math.max(inv, Math.hypot(f[0] - w[0], f[1] - w[1])); }
    const S0 = K.critSLE(0, 400, 1, 1), S = K.critSLE(8 / 3, 600, 2, 1); for (let k = 0; k < S.pts.length / 2; k++) if (S.pts[2 * k + 1] < -1e-12) below++;
    const d = 4 / 3, r = 1e-6, g = K.critGauge(r, d) / Math.pow(r, d);
    ok('SLE by the zipper: the slit map inverted to 10⁻¹², SLE₀ the vertical segment of height 2√t, every trace point in the closed upper half-plane, and the exact gauge exceeding r^d by (log log 1/r)^{(2−d)/2}',
      inv < 1e-12 && Math.abs(S0.pts[800]) < 1e-12 && Math.abs(S0.pts[801] - 2) < 1e-9 && below === 0 && Math.abs(g - Math.pow(Math.log(Math.log(1e6)), 1 / 3)) < 1e-12 && g > 1,
      `inverse ${inv.toExponential(1)} · SLE₀ top ${S0.pts[801].toFixed(9)} · h(10⁻⁶)/r^{4/3} = ${g.toFixed(4)}`); }
  /* 6 */
  ok('wired: the router ticks the laboratory, its panel and controls bind, multiview runs it, and its lab contract and instrument are registered',
    /else if\(state\.s3view==='ccurve'\)\{\n\s+fbsAnimT\+=labDt; updateCc\(labDt\);/.test(SRC) && /else if\(V==='ccurve'\) body = ccPanelHTML\(\);/.test(SRC) && /if\(V==='ccurve'\)\{ ccBind\(ctl\); \}/.test(SRC)
    && /ccurve:\{speed:\['ccSpeed',1\], pause:\['ccPaused','p'\]\}/.test(SRC) && /\{id:'ccurve', category:'geom'/.test(SRC) && /id:'ccurve', world:'s3', lab:'ccurve'/.test(SRC) && /ccGroup\.visible = \(v==='ccurve'\);/.test(SRC));
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
