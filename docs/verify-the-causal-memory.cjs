#!/usr/bin/env node
'use strict';
/* ══ CAUSAL HOLONOMY MEMORY (v4.395) ════════════════════════════════════════════════════════════════════════════════════
 * The manuscript "Causal Holonomy Memory and the Limits of Semiclassical Closure" (19 October 2026, unrefereed),
 * recomputed by the page's own code:
 *   1. the shear coupling: Σ_m q_km = 0 and Σ_m q² = (16/45)(k+1)k(k+2)(k−1)(k+3) for every k; q = ∂_uΩ² at the round
 *      sphere; ω_k = k + 1 is Ω at u = 0
 *   2. the alias: A_{2,2} = A_{3,2} = 256, A_{2,3} = 0, A_{3,3} = 1536
 *   3. the kernels: χ_ret = −θ(t)q²/(4ω²) sin 2ωt against a narrow Gaussian deformation integrated from the vacuum
 *      (the Kubo integral), and the noise weight q²/(8ω²) = |⟨2|F|0⟩|² from Fock-space matrices
 *   4. the naive static sum −Σ(k+1)S₂/(8(k+1)³) = −(2/45)Σ(n³ − 5n + 4/n) → −K⁴/90
 *   5. the closure at p = 3, K = 6, λ = 0.002, Ω_u = 2.8, u(0) = 0.11: 9 oscillators, its Hamiltonian conserved,
 *      F(35) = 2.40468 against the instantaneous vacuum's 1.33652; the live laboratory's fixed step h = 0.002 lands there too
 *   6. the lens spaces: the charge pairs of L(p,1) are p | m with spectator multiplicity k + 1, and those of L(p,q)
 *      ((q+1)m_L ≡ (q−1)m_R mod 2p, COMPACT's rule) give the space form's Laplace multiplicities — against the atlas's own
 *      character sums for L(p,1) and against invariance under the deck group itself for L(p,q)
 *   7. the laboratory is registered where the atlas looks for it and says what it is not
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const a = SRC.indexOf('/* ══ CAUSAL HOLONOMY MEMORY'), b = SRC.indexOf('/* ── the laboratory: five stations');
try {
  if (a < 0 || b < 0) throw new Error('the causal-memory core is not in the page');
  const C = new Function(SRC.slice(a, b) + '\nreturn {CHM_PRESET,chmQ,chmOmega2,chmS,chmS2,chmLensPairs,chmSpect,chmA,chmChi,chmNoise,chmDeltaChi,chmNaiveStatic,chmModes,chmSim,chmForce,chmForceInst,chmEnergy,chmStep,chmRun,chmWignerD};')();
  /* 1 */
  { let s1 = 0, s2 = 0, dq = 0, w = 0;
    for (let k = 0; k <= 40; k++) { s1 = Math.max(s1, Math.abs(C.chmS(k, 1))); s2 = Math.max(s2, Math.abs(C.chmS(k, 2) - C.chmS2(k)) / Math.max(1, C.chmS2(k)));
      for (let m = -k; m <= k; m += 2) { const h = 1e-6, d = (C.chmOmega2(k, m, h, 0) - C.chmOmega2(k, m, -h, 0)) / (2 * h); dq = Math.max(dq, Math.abs(d - C.chmQ(k, m)) / Math.max(1, Math.abs(C.chmQ(k, m)))); w = Math.max(w, Math.abs(Math.sqrt(C.chmOmega2(k, m, 0, 0)) - (k + 1))); } }
    ok('the shear coupling: Σ_m q_km = 0 and Σ_m q² = (16/45)(k+1)k(k+2)(k−1)(k+3) for k = 0 … 40; q_km is ∂_uΩ² at the round sphere and Ω = k + 1 there',
      s1 < 1e-9 && s2 < 1e-14 && dq < 1e-7 && w < 1e-12, `Σq ${s1.toExponential(1)} · Σq² ${s2.toExponential(1)} · ∂_uΩ² ${dq.toExponential(1)} · ω ${w.toExponential(1)}`); }
  /* 2 */
  { const v = [C.chmA(2, 2), C.chmA(3, 2), C.chmA(2, 3), C.chmA(3, 3)];
    ok('the alias: A₂,₂ = A₃,₂ = 256 — one channel cannot tell ℝP³ from L(3,1) — while A₂,₃ = 0 and A₃,₃ = 1536', v.join() === '256,256,0,1536', v.join(' · ')); }
  /* 3 */
  { /* a narrow Gaussian deformation (σ = 0.1, so 2ωσ ≲ 1.4 and the pulse is not adiabatic), the modes integrated from the
       vacuum by RK4, compared with the Kubo integral of χ_ret on a grid of times during and after the pulse; the residual,
       normalised by the largest response, must be second order: below 5·10⁻⁴ at ε = 10⁻⁴ and halving when ε halves */
    const kubo1 = eps => { const t0 = 1, sg = 0.1, T = 3, U = t => eps * Math.exp(-((t - t0) ** 2) / (2 * sg * sg)); let worst = 0;
      for (const [k, m] of [[2, 0], [3, 3], [6, 6], [5, -3]]) { const q = C.chmQ(k, m), w = k + 1; let f = [1 / Math.sqrt(2 * w), 0], fd = [0, -Math.sqrt(w / 2)]; const dt = 2e-4, N = Math.round(T / dt), every = Math.round(0.05 / dt); let mk = 0, md = 0;
        const acc = (tt, ff) => [-(w * w + q * U(tt)) * ff[0], -(w * w + q * U(tt)) * ff[1]];
        for (let n = 0; n < N; n++) { const t = n * dt, k1f = fd, k1v = acc(t, f), f2 = [f[0] + dt / 2 * k1f[0], f[1] + dt / 2 * k1f[1]], v2 = [fd[0] + dt / 2 * k1v[0], fd[1] + dt / 2 * k1v[1]], k2v = acc(t + dt / 2, f2);
          const f3 = [f[0] + dt / 2 * v2[0], f[1] + dt / 2 * v2[1]], v3 = [fd[0] + dt / 2 * k2v[0], fd[1] + dt / 2 * k2v[1]], k3v = acc(t + dt / 2, f3), f4 = [f[0] + dt * v3[0], f[1] + dt * v3[1]], v4 = [fd[0] + dt * k3v[0], fd[1] + dt * k3v[1]], k4v = acc(t + dt, f4);
          f = [f[0] + dt / 6 * (k1f[0] + 2 * v2[0] + 2 * v3[0] + v4[0]), f[1] + dt / 6 * (k1f[1] + 2 * v2[1] + 2 * v3[1] + v4[1])]; fd = [fd[0] + dt / 6 * (k1v[0] + 2 * k2v[0] + 2 * k3v[0] + k4v[0]), fd[1] + dt / 6 * (k1v[1] + 2 * k2v[1] + 2 * k3v[1] + k4v[1])];
          if ((n + 1) % every) continue; const tt = (n + 1) * dt, dF = q / 2 * (f[0] * f[0] + f[1] * f[1] - 1 / (2 * w)); let kubo = 0; const ds = 1e-3; for (let s = 0; s < tt - 1e-12; s += ds) kubo += C.chmChi(q, w, tt - s - ds / 2) * U(s + ds / 2) * ds;
          mk = Math.max(mk, Math.abs(kubo)); md = Math.max(md, Math.abs(dF - kubo)); }
        worst = Math.max(worst, md / mk); }
      return worst; };
    const r1 = kubo1(1e-4), r2 = kubo1(5e-5), order = r1 / r2;
    /* the noise weight: |⟨2|F|0⟩|² from truncated Fock-space matrices, F = qQ²/2, Q = (a + a†)/√(2ω) */
    let nz = 0; for (const [q, w] of [[16 / 3, 3], [-40, 7], [8, 4]]) { const n = 6, Q = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (j === i + 1 ? Math.sqrt(j) : j === i - 1 ? Math.sqrt(i) : 0) / Math.sqrt(2 * w)));
      const Q2 = Q.map((r, i) => r.map((_, j) => Q[i].reduce((s, x, l) => s + x * Q[l][j], 0))); const F20 = q / 2 * Q2[2][0]; nz = Math.max(nz, Math.abs(F20 * F20 - C.chmNoise(q, w, 0)) / C.chmNoise(q, w, 0)); }
    ok('the kernels: a narrow Gaussian deformation integrated from the vacuum follows the Kubo integral of χ_ret = −θ(t)q²/(4ω²) sin 2ωt, and the noise weight q²/(8ω²) is |⟨2|F|0⟩|² in Fock space',
      r1 < 5e-4 && Math.abs(order - 2) < 0.05 && nz < 1e-14, `residual ${r1.toExponential(2)} of the response at ε = 10⁻⁴, ${r2.toExponential(2)} at ε/2 — ratio ${order.toFixed(3)}, second order · Fock weight to ${nz.toExponential(1)}`); }
  /* 4 */
  { let worst = 0; for (const K of [3, 6, 12, 40]) { let s = 0; for (let k = 2; k <= K; k++) s += (k + 1) * C.chmS2(k) / (8 * Math.pow(k + 1, 3)); worst = Math.max(worst, Math.abs(-s - C.chmNaiveStatic(K)) / Math.abs(s)); }
    const r = C.chmNaiveStatic(4000) / (-Math.pow(4000, 4) / 90);
    ok('the naive static sum: −Σ(k+1)S₂(k)/(8(k+1)³) = −(2/45)Σ(n³ − 5n + 4/n), and it grows as −K⁴/90', worst < 1e-13 && Math.abs(r - 1) < 2e-3, `identity to ${worst.toExponential(1)} · at K = 4000 the ratio to −K⁴/90 is ${r.toFixed(5)}`); }
  /* 5 */
  { const R = C.chmRun(C.CHM_PRESET, 35, 0.0005), L = C.chmRun(C.CHM_PRESET, 35, 0.002);
    /* the laboratory integrates live at the one fixed step h = 0.002 (time owed carried between frames), so its t = 35 is this */
    const live = /const h=0\.002; S\.owe=/.test(SRC);
    ok('the closure at p = 3, K = 6, λ = 0.002, Ω_u = 2.8, u(0) = 0.11: 9 oscillators, its Hamiltonian conserved, F(35) = 2.40468 against the instantaneous vacuum’s 1.33652 — and the live laboratory’s fixed step lands on the same number',
      R.modes === 9 && Math.abs(R.Fd - 2.40468) < 1e-5 && Math.abs(R.Fi - 1.33652) < 1e-5 && R.spread < 1e-9 && R.wr < 1e-9 && live && Math.abs(L.Fd - R.Fd) < 1e-7 && L.spread < 1e-7,
      `${R.modes} oscillators · F = ${R.Fd.toFixed(6)} · instantaneous ${R.Fi.toFixed(6)} · ratio ${R.ratio.toFixed(4)} · energy spread ${R.spread.toExponential(1)} · Wronskian ${R.wr.toExponential(1)} · live step 0.002 ${live ? '✓' : '✗'} F = ${L.Fd.toFixed(8)} (Δ ${Math.abs(L.Fd - R.Fd).toExponential(1)})`); }
  /* 6 */
  { /* L(p,1): the atlas's own character sum for the cyclic left action of order p — sgSpectrum — against the charge pairs */
    const sgSrc = ['function sgChi(', 'function sgGroup(', 'function sgInvariantDim(', 'function sgSpectrum('].map(nm => { const i = SRC.indexOf(nm); let d = 0, j = SRC.indexOf('{', i); for (let k = j; k < SRC.length; k++) { if (SRC[k] === '{') d++; else if (SRC[k] === '}') { d--; if (!d) return SRC.slice(i, k + 1); } } }).join('\n');
    const grp = SRC.slice(SRC.indexOf('const SG_GROUPS=Object.freeze('), SRC.indexOf('function sgChi('));
    const G = new Function(grp + sgSrc + '\nreturn {sgSpectrum};')();
    let lp1 = 0; for (const [id, p] of [['L5', 5], ['L12', 12]]) { const sp = G.sgSpectrum(id, 30); for (let n = 0; n <= 30; n++) if (C.chmLensPairs(n, p, 1).length !== sp[n].mult) lp1++; }
    /* L(p,q): every surviving pair's monomial is invariant under the deck generator (z₁, z₂) ↦ (e^{2πi/p}z₁, e^{2πiq/p}z₂) */
    let lpq = 0, tot = 0; for (const [p, q] of [[5, 2], [7, 3], [13, 5], [65, 8]]) for (let n = 0; n <= 12; n++) for (let mL = -n; mL <= n; mL += 2) for (let mR = -n; mR <= n; mR += 2) {
      const s = (mL + mR) / 2, t = (mL - mR) / 2, phase = (s + q * t) / p, inv = Math.abs(phase - Math.round(phase)) < 1e-12, kept = C.chmLensPairs(n, p, q).some(x => x[0] === mL && x[1] === mR); tot++; if (inv !== kept) lpq++; }
    ok('the lens spaces: the charge pairs of L(p,1) are p | m with multiplicity k + 1 and reproduce the atlas’s own character sums; those of L(p,q) — (q+1)m_L ≡ (q−1)m_R (mod 2p), COMPACT’s rule — are exactly the harmonics the deck group leaves invariant',
      lp1 === 0 && lpq === 0, `L(5,1), L(12,1) multiplicities n ≤ 30 ${lp1 ? lp1 + ' off' : 'equal'} · ${tot - lpq}/${tot} pairs of L(5,2), L(7,3), L(13,5), L(65,8) as the deck group decides`); }
  /* 7 */
  { const decl = /\{id:'chmem', category:'hopf', domain:'quantum', cluster:'dynamics', predictionClass:'exact',/.test(SRC);
    const reg = ["chmGroup.visible = (v==='chmem');", "if(v==='chmem'&&!chmObjs){ chmSetup(); }", "else if(V==='chmem') body = chmPanelHTML();", "if(V==='chmem'){ chmBind(ctl); }", "} else if(state.s3view==='chmem'){", "['chmAtlas','chmem',chmGroup,", "id:'chmem', world:'s3', lab:'chmem',", "  chmem:'причинная голономная память", "  chmem:'kausales Holonomie-Gedächtnis", "data-sggo=\"chmem\"", "go('hopfToMem','chmem')"].filter(x => !SRC.includes(x));
    const rel = (SRC.match(/\['chmem','(s3gamma|hopf|tri|cosmo)',/g) || []).length;
    const words = SRC.includes('Not a fully renormalised ⟨T_μν⟩, not a solution of the semiclassical Einstein equations, not an observation') && SRC.includes('its absolute force changes with the cutoff K');
    ok('the laboratory is declared once and reaches every registry, walks to the trisphere, the space forms, the Hopf laboratory and cosmology, and says what it is not',
      decl && reg.length === 0 && rel === 4 && words, `declared ${decl ? '✓' : '✗'} · registries ${reg.length ? 'MISSING ' + reg.join(' | ') : '✓'} · ${rel} relations · scope ${words ? '✓' : '✗'}`); }
} catch (e) { fail++; console.log('  FAIL — verifier error: ' + (e && e.stack || e)); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
