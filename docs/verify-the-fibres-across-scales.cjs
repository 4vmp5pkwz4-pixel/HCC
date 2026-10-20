#!/usr/bin/env node
'use strict';
/* ══ THE FIBRES ACROSS THE SCALES — WHAT THE THREADS ARE, AND HOW MUCH OF THEM A LENGTH CAN SEE (v4.398) ════════════════
 * Asked: are the threads drawn at the scale of the universe exact; do such separate fibres exist beyond the universe; is
 * there one fibre through the whole universe that is also seen at the Planck length, linked like two rings? Checked here:
 *   1. two fibres of one Hopf fibration are Clifford parallels: the distance from a point running round one fibre to the
 *      other fibre never changes (it is arccos|⟨x, y⟩|) — so the fibre through a point one Planck length from ours stays one
 *      Planck length from ours all the way round
 *   2. and it is still linked with ours once (+1), however close: the link is in the whole circle, not in any piece of it
 *   3. how much a length L can see: the fibres about ours turn by L/R — at the Planck length ℓ_P/R = 1.93·10⁻⁶³ rad, at the
 *      particle horizon 2.98° — computed from the page's own R and the metre per Gly
 *   4. what would make them physical: the field tangent to the fibres, X = i·x, is an eigenfield of curl on S³ with the
 *      smallest eigenvalue, |curl X| = 2|X|/R (Stokes: the circulation round a small loop across X, over its area)
 *   5. the panel says what they are not (no filament anyone has seen; the same universe past 46 Gly, not beyond it), says
 *      that neither physical realisation is observed, and the Planck picture says it is not the universe magnified
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
let s = 5; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
const unit4 = () => { const v = [0, 0, 0, 0].map(() => rnd() * 2 - 1), l = Math.hypot(...v); return v.map(x => x / l); };
/* e^{it}(z₁, z₂) in ℝ⁴: (x₁ + i x₂, x₃ + i x₄) */
const flow = (x, t) => { const c = Math.cos(t), sn = Math.sin(t); return [c * x[0] - sn * x[1], sn * x[0] + c * x[1], c * x[2] - sn * x[3], sn * x[2] + c * x[3]]; };
const dot = (a, b) => a.reduce((t, v, i) => t + v * b[i], 0);
try {
  /* 1 */
  { let worst = 0, cases = 0; for (let k = 0; k < 40; k++) { const x = unit4(), y = k % 4 ? unit4() : (() => { const d = 1e-3 * (k + 1); const w = unit4(); const ww = w.map((v, i) => v - dot(w, x) * x[i]), l = Math.hypot(...ww); return x.map((v, i) => Math.cos(d) * v + Math.sin(d) * ww[i] / l); })();
      const herm = Math.hypot(x[0] * y[0] + x[1] * y[1] + x[2] * y[2] + x[3] * y[3], x[0] * y[1] - x[1] * y[0] + x[2] * y[3] - x[3] * y[2]), want = Math.acos(Math.min(1, herm));
      for (let i = 0; i < 24; i++) { const p = flow(x, 2 * Math.PI * i / 24); let best = -1; for (let j = 0; j < 720; j++) best = Math.max(best, dot(p, flow(y, 2 * Math.PI * j / 720)));
        /* refine the maximum over s analytically: Re(e^{i(t−s)}⟨x,y⟩) peaks at |⟨x,y⟩| */
        /* on a grid of 720 the maximum of cos(t − s + φ)·|⟨x,y⟩| is short of the true one by at most (π/720)²/2 ≈ 9.5·10⁻⁶ */
        worst = Math.max(worst, Math.abs(best - Math.cos(want))); cases++; } }
    ok('two fibres are Clifford parallels: the distance from a point running round one to the other never changes — arccos|⟨x, y⟩| — so a fibre one Planck length from ours stays one Planck length from it all the way round',
      worst < 1.2e-5, `${cases} positions on 40 pairs, near and far · cos d constant to ${worst.toExponential(1)} (the grid's own limit 9.5·10⁻⁶)`); }
  /* 2 */
  { const st = p => { const k = 1 / (1 - p[3]); return [p[0] * k, p[1] * k, p[2] * k]; };
    const gauss = (A, B) => { let g = 0; for (let i = 0; i < A.length; i++) { const a0 = A[i], a1 = A[(i + 1) % A.length]; for (let j = 0; j < B.length; j++) { const b0 = B[j], b1 = B[(j + 1) % B.length];
      const r = [0, 1, 2].map(t => (a0[t] + a1[t] - b0[t] - b1[t]) / 2), da = [0, 1, 2].map(t => a1[t] - a0[t]), db = [0, 1, 2].map(t => b1[t] - b0[t]);
      const cr = [da[1] * db[2] - da[2] * db[1], da[2] * db[0] - da[0] * db[2], da[0] * db[1] - da[1] * db[0]], d = Math.hypot(...r); g += (r[0] * cr[0] + r[1] * cr[1] + r[2] * cr[2]) / (d * d * d); } } return g / (4 * Math.PI); };
    const ours = [Math.SQRT1_2, 0, -Math.SQRT1_2 * 0.6, -Math.SQRT1_2 * 0.8], lk = [];
    for (const d of [0.4, 0.15, 0.05]) { const w = [0.1, 0.7, 0.3, -0.2], ww = w.map((v, i) => v - dot(w, ours) * ours[i]), l = Math.hypot(...ww), twin = ours.map((v, i) => Math.cos(d) * v + Math.sin(d) * ww[i] / l);
      const n = d < 0.1 ? 2400 : 1200, A = [], B = []; for (let i = 0; i < n; i++) { const t = 2 * Math.PI * i / n; A.push(st(flow(ours, t))); B.push(st(flow(twin, t))); } lk.push(gauss(A, B)); }
    ok('and however close, the twin is linked with ours once (+1): the link is in the whole circle', lk.every(x => Math.abs(x - 1) < 3e-2), `Lk at 0.4, 0.15, 0.05 rad apart: ${lk.map(x => x.toFixed(4)).join(', ')}`); }
  /* 3 */
  { const Rgly = +SRC.match(/Rc_Gly:([0-9.]+),/)[1], glyM = +(SRC.match(/const HCC_GLY_M\s*=\s*([0-9.e+]+)/) || [])[1] || 9.4607304725808e24, lP = 1.616255e-35, R = Rgly * glyM;
    const tP = lP / R, tH = 46.04 * glyM / R * 180 / Math.PI, fnOk = /function obsFibTwistAt\(Lm\)\{ return Lm\/\(S3\.R\*HCC_GLY_M\); \}/.test(SRC);
    const said = SRC.includes('its fibres, here, are straight to ℓ_P/R = 1.9·10⁻⁶³ rad') && SRC.includes('её волокна здесь прямые с точностью ℓ_P/R = 1,9·10⁻⁶³ рад');
    ok('how much a length can see: the fibres about ours turn by L/R — 1.93·10⁻⁶³ rad across the Planck length, 2.98° across the particle horizon — from the page’s own R and metre per Gly',
      Math.abs(tP / 1.927e-63 - 1) < 2e-3 && Math.abs(tH - 2.975) < 0.01 && fnOk && said, `ℓ_P/R = ${tP.toExponential(4)} rad · particle horizon ${tH.toFixed(3)}° · R = ${Rgly} Gly · the ladder from the page ${fnOk ? '✓' : '✗'} · the Planck picture says it ${said ? '✓' : '✗'}`); }
  /* 4 */
  { /* X(p) = i·p, the Hopf flow's velocity; circulation round a small loop in the plane across X, over its area, is X·curl X */
    let worst = 0, sign = 0; const eps = 2e-3;
    for (let k = 0; k < 30; k++) { const p = unit4(), X = [-p[1], p[0], -p[3], p[2]];
      const gs = vs => { const out = []; for (let v of vs) { for (const u of [p, X, ...out]) { const c = dot(v, u); v = v.map((w, i) => w - c * u[i]); } const l = Math.hypot(...v); if (l > 1e-6) out.push(v.map(w => w / l)); } return out; };
      let [e2, e3] = gs([unit4(), unit4(), unit4()]); const det = (a, b, c, d) => { const m = [a, b, c, d]; const D = (M) => M.length === 1 ? M[0][0] : M[0].reduce((t, v, j) => t + (j % 2 ? -1 : 1) * v * D(M.slice(1).map(r => r.filter((_, i) => i !== j))), 0); return D(m); };
      if (det(p, X, e2, e3) < 0) e3 = e3.map(v => -v);
      let circ = 0; const M = 400; for (let i = 0; i < M; i++) { const a0 = 2 * Math.PI * i / M, a1 = 2 * Math.PI * (i + 1) / M, q = a => { const v = p.map((w, j) => w + eps * (Math.cos(a) * e2[j] + Math.sin(a) * e3[j])), l = Math.hypot(...v); return v.map(w => w / l); };
        const q0 = q(a0), q1 = q(a1), mid = q0.map((v, j) => (v + q1[j]) / 2), Xm = [-mid[1], mid[0], -mid[3], mid[2]]; circ += dot(Xm, q1.map((v, j) => v - q0[j])); }
      const curl = circ / (Math.PI * eps * eps); if (!sign) sign = Math.sign(curl); worst = Math.max(worst, Math.abs(Math.abs(curl) - 2), Math.sign(curl) !== sign ? 9 : 0); }
    const said = SRC.includes('the lowest helical (curl) modes of S³ have exactly these circles as field lines');
    ok('what would make them physical: the field along the fibres, X = i·x, is an eigenfield of curl on S³ with the smallest eigenvalue — |curl X| = 2|X|/R, one sign everywhere (Stokes on small loops)',
      worst < 5e-3 && said, `curl X · X/|X|² = ${(2 * sign).toFixed(0)} to ${worst.toExponential(1)} at 30 points · said ${said ? '✓' : '✗'}`); }
  /* 5 */
  { const w = ['They are not filaments anyone has seen', 'the threads past 46 Gly are the same universe, not something beyond it', 'two fibres are Clifford parallels', 'linked +1. But the link is in the whole circle, not in any piece',
      'Neither is observed.', 'Это не нити, которые кто-либо видел', 'Ни то, ни другое не наблюдалось.', 'an S³ drawn at the size of the view, not the model universe magnified'].filter(x => !SRC.includes(x));
    ok('the panel says what the threads are not and that neither physical realisation is observed; the Planck picture says it is not the universe magnified', w.length === 0, w.length ? 'missing: ' + w.join(' | ') : 'in English and Russian'); }
} catch (e) { fail++; console.log('  FAIL — verifier error: ' + (e && e.stack || e)); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
