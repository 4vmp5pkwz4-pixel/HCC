#!/usr/bin/env node
'use strict';
/* ══ THE TENNIS RACKET INSIDE THE FLUID — EVERY TRIAD OF S³ IS A FREE RIGID BODY (v4.345) ══════════════════════
 * Measured on the atlas's own Galerkin kernels (core/atlas/extracted.mjs). Checked:
 *   1. the Lamb vector of two Beltrami modes projected on a third is (μ_k − μ_j)·S_ijk·a_j a_k, S totally antisymmetric
 *   2. the triad is Euler's free top: triad and body agree, the body's L is fixed in space, Jacobi's period returns the
 *      state, the small-oscillation limit is the linear frequency, a rotor turns at |S|(μ_hi − μ_lo)|a|
 *   3. the lever rule: the empty unstable leg's energy splits (μ_hi − μ_mid) : (μ_mid − μ_lo); every shell k ≥ 1 is the
 *      middle axis of (E₁₋, E_k₊, E_{k+1}₊), which sends 1/(k+6) back to the largest scale
 *   4. the double Clebsch–Gordan rule predicts all 120 shell triples of the K = 3 basis, and forbidden triads have S = 0
 *   5. the census to k = 12: 818 triads, none with its largest leg unstable, 72 extremal triads forbidden
 *   6. the crowd: A·S_J·D with S_J antisymmetric; one-sided blocks are neutral (Killing, top shell); the crowd equals,
 *      tames and amplifies the lone triad (E₂ at K = 3, E₁ at K = 3, E₃ at K = 4)
 *   7. wired: declared, routed, drawn, controls, API, relations, ledger with replaying tracks, the lead it resolves
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { nsgBasis, nsgLamb, triadS, triadCoeffs, triadStep, triadPeriod, triadLever, triadGrowth, triadBody, triadBodyStep, triadRotate, triadInvariants,
    s3TriadAllowed, s3TriadCensus, triadPick, triadCrowd, DISCOVERIES, DISCOVERY_LEADS, discoveryTrack, trackRun } = K;
  const B2 = nsgBasis(2), B3 = nsgBasis(3);
  { let worst = 0, anti = 0, cnt = 0; const { n, mu } = B2;
    for (let t = 0; t < 30; t++) { const j = (t * 7 + 1) % n, k = (t * 13 + 5) % n; if (j === k) continue; const a = new Float64Array(n); a[j] = 0.7; a[k] = -1.3; const L = nsgLamb(B2, a);
      for (let i = 0; i < n; i += 3) { if (i === j || i === k) continue; const S = triadS(B2, i, j, k); worst = Math.max(worst, Math.abs(L[i] - (mu[k] - mu[j]) * S * 0.7 * -1.3)); anti = Math.max(anti, Math.abs(S + triadS(B2, j, i, k)), Math.abs(S - triadS(B2, j, k, i))); cnt++; } }
    ok('the Lamb vector of two Beltrami modes on a third is (μ_k − μ_j)·S_ijk·a_j a_k, with S_ijk = ∫e_i·(e_j×e_k) totally antisymmetric', worst < 1e-12 && anti < 1e-12 && cnt > 200, `${cnt} projections · worst ${worst.toExponential(1)} · antisymmetry ${anti.toExponential(1)}`); }
  { const cases = [[[-3, 4, 5], 0.078, [0.3, 0.9, 0.2]], [[3, 4, 5], -0.159, [0.1, 0.2, 0.97]], [[-3, 3, 4], 0.065, [0.6, 0.1, 0.5]], [[4, 5, -5], 0.045, [0.2, 0.7, 0.6]]]; let ret = 0, bvt = 0, ldr = 0;
    for (const [mu, S, a0] of cases) { const C = triadCoeffs(mu, S), P = triadPeriod(mu, S, a0), N = 8000, h = P.T / N; let x = a0.slice(); for (let i = 0; i < N; i++) x = triadStep(C, x, h); ret = Math.max(ret, Math.hypot(...x.map((v, i) => v - a0[i])));
      const body = triadBody(mu, S); let a = a0.slice(), q = [1, 0, 0, 0], y = a0.slice(); const L0 = triadRotate(q, a); for (let i = 0; i < 4000; i++) { [a, q] = triadBodyStep(body, a, q, 0.01); y = triadStep(C, y, 0.01); bvt = Math.max(bvt, Math.hypot(...a.map((v, j) => v - y[j]))); ldr = Math.max(ldr, Math.hypot(...triadRotate(q, a).map((v, j) => v - L0[j]))); } }
    const mu = [-3, 4, 5], S = 0.078, e = 1e-4, a = [Math.sqrt(1 - e * e), 0, e], Ts = triadPeriod(mu, S, a).T, Tl = 2 * Math.PI / (Math.abs(S) * Math.sqrt((4 + 3) * (5 + 3)));
    const rot = triadPeriod([3, 3, 4], 0.15, [0.6, 0.3, 0.5]), rotPred = 2 * Math.PI / (0.15 * 1 * 0.5);
    ok('the triad is Euler’s free top: triad and body agree, L stays fixed in space, Jacobi’s period returns the state, small orbits have the linear frequency, a rotor turns at |S|(μ_hi−μ_lo)|a|',
      ret < 1e-10 && bvt < 1e-10 && ldr < 1e-8 && Math.abs(Ts / Tl - 1) < 1e-6 && Math.abs(rot.T / rotPred - 1) < 1e-12 && rot.rotor,
      `return ${ret.toExponential(1)} · body vs triad ${bvt.toExponential(1)} · L drift ${ldr.toExponential(1)} · small-orbit T/T_lin − 1 = ${(Ts / Tl - 1).toExponential(1)}`); }
  { const mu = [-3, 4, 5], C = triadCoeffs(mu, 0.078); let x = [1e-6, 1, 1e-6], m = 1, at = null; for (let i = 0; i < 200000; i++) { x = triadStep(C, x, 0.01); if (x[1] ** 2 < m) { m = x[1] ** 2; at = x.slice(); } }
    const L = triadLever(mu), I = triadInvariants(mu, x); let univ = true; for (let k = 1; k <= 40; k++) { const Lk = triadLever([-3, k + 2, k + 3]); univ = univ && s3TriadAllowed([1, -1], [k, 1], [k + 1, 1]) && Lk.unstable === 1 && Math.abs(Lk.toLo - 1 / (k + 6)) < 1e-15; }
    ok('the lever rule: the unstable leg empties and its energy splits (μ_hi−μ_mid) : (μ_mid−μ_lo) — 1/8 : 7/8 for E₁₋E₂₊E₃₊ — and every shell k ≥ 1 is the middle axis of (E₁₋, E_k₊, E_{k+1}₊), sending 1/(k+6) to the largest scale',
      m < 1e-6 && Math.abs(at[0] ** 2 - L.toLo) < 1e-5 && Math.abs(at[2] ** 2 - L.toHi) < 1e-5 && L.toLo === 0.125 && Math.abs(I.E - 1 - 2e-12) < 1e-9 && univ && Math.abs(triadGrowth(mu, 0.078, 1) - 0.078 * Math.sqrt(7)) < 1e-15,
      `min a_mid² ${m.toExponential(1)} · shares ${(at[0] ** 2).toFixed(6)} : ${(at[2] ** 2).toFixed(6)} · universal racket to k = 40 ${univ}`); }
  { const sh = B3.shells; let agree = 0, tot = 0; const bad = [];
    for (let x = 0; x < sh.length; x++) for (let y = x; y < sh.length; y++) for (let z = y; z < sh.length; z++) { const X = sh[x], Y = sh[y], Z = sh[z]; let s2 = 0;
      for (let i = X.from; i < X.to; i++) for (let j = Y.from; j < Y.to; j++) { if (i === j) continue; for (let k = Z.from; k < Z.to; k++) { if (k === i || k === j) continue; const v = triadS(B3, i, j, k); s2 += v * v; } }
      const num = Math.sqrt(s2) > 1e-8, rule = s3TriadAllowed([X.k, X.sigma], [Y.k, Y.sigma], [Z.k, Z.sigma]); tot++; if (num === rule) agree++; else bad.push(`${X.mu},${Y.mu},${Z.mu}`); }
    const f1 = triadPick(B3, [[1, 1], [1, 1], [2, -1]]), f2 = triadPick(B3, [[1, 1], [2, 1], [3, -1]]), p = triadPick(B3, [[1, -1], [2, 1], [3, 1]]);
    ok('the double Clebsch–Gordan rule of Spin(4) predicts every shell triple of the K = 3 basis, Killing shells included; the forbidden extremal triads have S = 0 on every mode triple',
      agree === tot && tot === 120 && f1 === null && f2 === null && p && Math.abs(Math.abs(p.S) - 0.07797) < 1e-4, `${agree}/${tot}${bad.length ? ' · disagree ' + bad.join(' ') : ''} · E₁₋E₂₊E₃₊ S = ${p ? p.S.toFixed(6) : '—'}`); }
  { const C = s3TriadCensus(12);
    ok('the census to k = 12: 818 triads — 216 rotors, 322 forward, 280 split — none with its largest leg unstable, and 72 extremal triads forbidden',
      C.total === 818 && C.rotor === 216 && C.forward === 322 && C.split === 280 && C.largestUnstable === 0 && C.forbiddenExtremal === 72 && C.homochiral === 254, JSON.stringify({ ...C, list: C.list.length })); }
  { const kill = triadCrowd(B3, 0), top = triadCrowd(B3, 52), e2 = triadCrowd(B3, 24), e1 = triadCrowd(B3, 6), B4 = nsgBasis(4), e3 = triadCrowd(B4, B4.shells.find(s => s.k === 3 && s.sigma === 1).from, { steps: 2400 });
    ok('the crowd: A·S_J·D with S_J antisymmetric; one-sided blocks are neutral (Killing, the top shell); the whole fluid equals (E₂), tames (E₁) and amplifies (E₃, K = 4) the best lone triad',
      [kill, top, e2, e1, e3].every(c => c.antisym < 1e-12) && kill.arnold && Math.abs(kill.growth) < 0.005 && top.arnold && Math.abs(top.growth) < 0.005 && !e2.arnold && Math.abs(e2.growth / e2.bestTriad - 1) < 0.02
      && e1.growth < 0.3 * e1.bestTriad && e1.growth > 0.02 && e3.growth > 1.05 * e3.bestTriad,
      `Killing ${kill.growth.toFixed(4)} · top ${top.growth.toFixed(4)} · E₂ ${e2.growth.toFixed(4)} vs ${e2.bestTriad.toFixed(4)} · E₁ ${e1.growth.toFixed(4)} vs ${e1.bestTriad.toFixed(4)} · E₃(K=4) ${e3.growth.toFixed(4)} vs ${e3.bestTriad.toFixed(4)}`); }
  { const ids = ['triadRigidBody', 'racketLever', 'doubleClebschGordan', 'crowdAroundRacket'], led = ids.every(id => DISCOVERIES.some(d => d.id === id && d.verifier === 'docs/verify-the-tennis-racket-inside-the-fluid.cjs')), tr = ids.every(id => trackRun(discoveryTrack(id)).ok);
    const leads = !DISCOVERY_LEADS.some(l => l.id === 'spin-ns') && DISCOVERY_LEADS.some(l => l.id === 'crowd-k') && DISCOVERY_LEADS.some(l => l.id === 'triad-closure');
    ok('wired: declared, routed, drawn, controls, API, relations, ledger with replaying tracks, the lead spin-ns resolved, the φ-ladder tower points to the racket',
      led && tr && leads && /\{id:'triad', category:'dyn', domain:'quantum', cluster:'dynamics'/.test(SRC) && /triadGroup\.visible = \(v==='triad'\);/.test(SRC) && /state\.s3view==='triad'\)\{\n\s*fbsAnimT\+=labDt; updateTriad\(labDt\);/.test(SRC)
      && /id:'triad', world:'s3', lab:'triad',/.test(SRC) && /\['triad','nsgal','exact'/.test(SRC) && /\['triadAtlas','triad',triadGroup,/.test(SRC) && /data-triadt=/.test(SRC) && /hccAliasGuard\(O\.box,/.test(SRC) && /the tennis racket at this shell/.test(SRC),
      `ledger ${led ? 'ok' : 'MISSING'} · tracks ${tr ? 'replay' : 'FAIL'} · leads ${leads ? 'ok' : 'WRONG'}`); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
