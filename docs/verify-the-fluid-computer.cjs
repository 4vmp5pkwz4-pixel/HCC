#!/usr/bin/env node
'use strict';
/* ══ THE FLUID COMPUTER (v4.378) ═════════════════════════════════════════════════════════════════════════════════════
 * Family 376 of the openai/math collection (2026), manuscript "Finite Instructions and Solenoidal Shear Flows": forced
 * Navier–Stokes on the flat unit three-torus, from rest, in which the particle a* = (1/8, 3/8, 1/2) enters the strip
 * O = {1/2 < x < 1} exactly when a Turing machine halts. Checked here on the page's own kernels:
 *   1. the recorder of Lemma 2.1 on its WHOLE table, four machines: one incoming move per destination control and an
 *      injective (control, written symbol) → predecessor map; the checkpoints reproduce the machine; every step takes
 *      exactly 2(r₀ + n − h′) + 4 transitions; busy beaver 2 halts after 6 steps with 4 ones, unary 3 + 2 leaves 5 ones,
 *      busy beaver 3 halts after 14 steps with 6 ones, and the machine that never halts is still running
 *   2. the radix interface: F(code_k) = code_{k+1} EXACTLY, in rational arithmetic, at every transition; every code in
 *      its source rectangle; λ ∈ {1, M, 1/M}; all source rectangles of the table pairwise positively separated
 *   3. Lemma 3.1: Y(−λ), X(1/λ − 1), Y(1), X(λ − 1) compose to diag(λ, 1/λ) and no intermediate point leaves the 2h square
 *   4. the period: div V = (V·∇)V = 0 and div f = 0 by finite differences, the Navier–Stokes residual with p = 0 at the
 *      differencing level, and the RK4 period map equal to the instruction F
 *   5. the observation: a* enters O in the halting period and never before (x < ½ until then); never, within the run,
 *      for the machine that does not halt
 *   6. wired: the Navier–Stokes chapter (after the blow-up), the router, the panel, multiview, the contract, the instrument
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const M = K.NSC_MACHINES, runs = {}, recs = {};
  for (const id of ['bb2', 'add', 'bb3', 'run']) { recs[id] = K.nscRecorder(M[id]); runs[id] = K.nscRecorderRun(M[id], { rec: recs[id], maxMicro: id === 'run' ? 300 : 6000 }); }
  /* 1 */
  { const want = { bb2: [6, 4, 84], add: [8, 5, 58], bb3: [14, 6, 252] }, d = [];
    const good = Object.keys(runs).every(id => { const R = runs[id], C = recs[id], w = want[id];
      d.push(`${id}: ${C.rules} rules, ${R.micro.length} transitions, ${R.steps} steps${R.halted ? ', halted' : ', running'}`);
      return C.fixedDisplacement && C.injective && R.agree && R.counts.length > 0 && R.counts.every(c => c.measured === c.law)
        && (w ? R.halted && R.tmHalted && R.steps === w[0] && R.ones === w[1] && R.micro.length === w[2] : !R.halted && !R.tmHalted && R.steps >= 40); });
    ok('the recorder of Lemma 2.1, on its whole table: one incoming move per control, the predecessor fixed by the written symbol; the checkpoints are the machine; every step takes exactly 2(r₀ + n − h′) + 4 transitions; busy beaver 2 → 6 steps, 4 ones; 3 + 2 → 5 ones; busy beaver 3 → 14 steps, 6 ones; the runaway machine still running', good, d.join(' · ')); }
  /* 2 */
  { const A = Object.fromEntries(Object.keys(runs).map(id => [id, K.nscExactAudit(runs[id])])), S2 = K.nscSeparation(recs.bb2), S3 = K.nscSeparation(recs.add);
    ok('every transition is one reciprocal affine map, checked EXACTLY in rational arithmetic: F(code_k) = code_{k+1}, the code inside the source rectangle, λ ∈ {1, M, 1/M}; the source rectangles of the whole table are pairwise positively separated (Cantor gaps)',
      Object.values(A).every(a => a.steps > 0 && a.exact === a.steps && a.inside === a.steps && a.reciprocal === a.steps) && S2.minGap > 0 && S3.minGap > 0,
      Object.entries(A).map(([k, a]) => `${k} ${a.exact}/${a.steps}`).join(' · ') + ` · ${S2.rects} + ${S3.rects} rectangles, gaps ≥ ${Math.min(S2.minGap, S3.minGap).toExponential(2)}`); }
  /* 3 */
  { let worstMap = 0, worstEx = 0; let st = 12345; const rnd = () => (st = (st * 1664525 + 1013904223) >>> 0) / 4294967296;
    for (const lam of [1, 48, 1 / 48, 64, 1 / 64, 2.5]) for (let n = 0; n < 200; n++) {
      const h = 0.3, r = (2 * rnd() - 1) * h * Math.min(1, 1 / lam), s = (2 * rnd() - 1) * h * Math.min(1, lam); let rs = [r, s];
      for (const sh of K.NSC_SHEARS(lam)) { for (const f of [0.25, 0.5, 0.75, 1]) { const q = K.nscShear(rs, sh, f); worstEx = Math.max(worstEx, Math.max(Math.abs(q[0]), Math.abs(q[1])) / (2 * h)); } rs = K.nscShear(rs, sh); }
      worstMap = Math.max(worstMap, Math.hypot(rs[0] - lam * r, rs[1] - s / lam) / h); }
    ok('Lemma 3.1: Y(−λ), X(1/λ − 1), Y(1), X(λ − 1) give (λr, s/λ), and no point of any partially completed shear leaves the square of half-side 2h', worstMap < 1e-12 && worstEx <= 1 + 1e-12, `map error ${worstMap.toExponential(1)} · largest excursion ${worstEx.toFixed(3)} × 2h`); }
  /* 4 */
  { const ch = K.nscChart(recs.bb2); let div = 0, conv = 0, res = 0, rk = 0, divf = 0, n = 0;
    for (const id of ['bb2', 'bb3']) { const R = runs[id], C = recs[id], c = K.nscChart(C);
      for (const k of [0, 1, 2, 5, 9, 20, 40, 77]) { const mu = R.micro[k]; if (!mu) continue; n++;
        const br = K.nscBranch(C, mu, c, K.nscHeight(mu.key % 997)), F = K.nscFieldCheck(br, 0.01, 42, k + 3), X = K.nscCode(C, mu.from), X0 = [K.nscQnum(X.x) / c.W, c.oy + c.by * K.nscQnum(X.y)], P = K.nscPeriodRK4(br, X0, 3000);
        div = Math.max(div, F.div); conv = Math.max(conv, F.conv); res = Math.max(res, F.res); rk = Math.max(rk, P.err);
        for (let j = 0; j < 7; j++) { const t = (j + 0.4) / 7, Q = K.nscCarry(br, t, X0), hs = [1e-7, 1e-9, 1e-6], g = i => { const a = Q.slice(), b = Q.slice(); a[i] += hs[i]; b[i] -= hs[i]; return (K.nscField(br, t, a, 0.01).f[i] - K.nscField(br, t, b, 0.01).f[i]) / (2 * hs[i]); };
          const fm = Math.hypot(...K.nscField(br, t, Q, 0.01).f) + 1e-30; divf = Math.max(divf, Math.abs(g(0) + g(1) + g(2)) / fm); } } }
    ok('the seven-stage period: div V = 0 and (V·∇)V = 0 at every sampled point (every stage is transverse to its own variation, so p = 0), div f = 0, the Navier–Stokes residual ∂ₜV + (V·∇)V − νΔV − f at the differencing level, and the RK4 period map equal to F',
      n >= 14 && div < 1e-12 && conv < 1e-12 && divf < 1e-9 && res < 1e-3 && rk < 1e-9, `${n} branches · div ${div.toExponential(1)} · (V·∇)V ${conv.toExponential(1)} · div f ${divf.toExponential(1)} · NS residual ${res.toExponential(1)} · RK4 vs F ${rk.toExponential(1)}`); }
  /* 5 */
  { const d = [], good = ['bb2', 'add', 'bb3', 'run'].every(id => { const E = K.nscExperiment(M[id], { maxMicro: id === 'run' ? 300 : 6000 }), N = E.run.micro.length;
      d.push(`${id}: ${E.enterPeriod >= 0 ? 'enters O in transition ' + (E.enterPeriod + 1) + '/' + N : 'outside O after ' + N} (x ≤ ${E.maxXBefore.toFixed(4)} before)`);
      return E.maxXBefore < 0.5 && (id === 'run' ? E.enterPeriod === -1 : E.enterPeriod === N - 1) && E.aStar[0] === 1 / 8 && E.aStar[1] === 3 / 8 && E.aStar[2] === 0.5; });
    ok('the observation of Theorem 1.1: a* = (1/8, 3/8, 1/2) enters O = {½ < x < 1} in the halting period and not one period before; the machine that never halts keeps it out for the whole run', good, d.join(' · ')); }
  /* 6 */
  ok('wired: the Navier–Stokes chapter carries the laboratory after the blow-up, the router ticks it, its panel and controls bind, multiview runs it, and its lab contract and instrument are registered',
    /navier:\['nsflow','nsgal','triad','vstretch','nsblow','nscomp',/.test(SRC) && /else if\(state\.s3view==='nscomp'\)\{\n\s+fbsAnimT\+=labDt; updateNsc\(labDt\);/.test(SRC)
    && /else if\(V==='nscomp'\) body = nscPanelHTML\(\);/.test(SRC) && /if\(V==='nscomp'\)\{ nscBind\(ctl\); \}/.test(SRC) && /nscomp:\{speed:\['nscSpeed',1\.2\], pause:\['nscPaused','p'\]\}/.test(SRC)
    && /\{id:'nscomp', category:'dyn'/.test(SRC) && /id:'nscomp', world:'s3', lab:'nscomp'/.test(SRC) && /nscGroup\.visible = \(v==='nscomp'\);/.test(SRC));
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
