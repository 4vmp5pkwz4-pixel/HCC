#!/usr/bin/env node
'use strict';
/* ══ THE LAWS OF A FIELD, READ OFF ITS SHAPE ═══════════════════════════════════════
 * Once the Field Lab draws its field as surfaces, three laws can be read off the drawing
 * itself. This file recomputes each with the atlas's own kernels (core/atlas/extracted.mjs)
 * on lattices integrated HERE:
 *   1. GAUSS: the flux of −∇u out of an equipotential that encloses a charge equals the charge
 *      — Poisson solved here by red–black SOR, the flux integrated over the marching-tetrahedra
 *      surface, the charge summed over the sites inside; Φ/Q → 1 as the lattice refines
 *   2. THE WIDEST MOMENT OF AN ISOTHERM: a fixed level of a diffusing Gaussian grows, stops and
 *      shrinks, and at its widest r² = ⟨r²⟩ exactly, whatever D, level or width. Derived:
 *      r_c² = 2σ²·ln(A/σ³) is stationary in σ² where ln(A/σ³) = 3/2, so r_c² = 3σ² = ⟨r²⟩.
 *      Measured on the FTCS lattice with the lab's own step: the ratio tends to 1 as the pulse
 *      is resolved; and a level that follows the peak (as the drawn levels do) has no widest
 *      moment at all — which is why the lab tracks a fixed one
 *   3. THE CRITICAL POINT: Wolff cluster updates, Binder cumulants U = 1 − ⟨m⁴⟩/3⟨m²⟩² for L = 8
 *      and 16, crossing at T_c within 0.03 of the literature's 4.5115 — which is not an input
 *   4. the wiring: SOR in the lab, Gauss per surface, the isotherm tracker, the measurement button
 *   5. MUTATIONS: a Poisson solve stopped after 30 Jacobi sweeps reads Φ/Q far below 1 (the
 *      meter works), and the relative level has no widest moment — each caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { fsIso, fsWolff, fsCrossing, fsWidest } = K;

  /* 1 · Gauss */
  const dipole = (N, sweeps, sor) => { const L = N * N, h = (N - 1) / 2, s = N * 0.085, v = new Float64Array(N ** 3), u = new Float64Array(N ** 3);
    for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) v[(z * N + y) * N + x] = Math.exp(-((x - h + N * .19) ** 2 + (y - h) ** 2 + (z - h) ** 2) / (2 * s * s)) - Math.exp(-((x - h - N * .19) ** 2 + (y - h) ** 2 + (z - h) ** 2) / (2 * s * s));
    const w = sor ? 2 / (1 + Math.sin(Math.PI / N)) : 1, a = new Float64Array(N ** 3);
    for (let it = 0; it < sweeps; it++) {
      if (sor) { for (let c = 0; c < 2; c++) for (let z = 1; z < N - 1; z++) for (let y = 1; y < N - 1; y++) for (let x = 1 + ((y + z + c) & 1); x < N - 1; x += 2) { const i = (z * N + y) * N + x; u[i] += w * ((u[i - 1] + u[i + 1] + u[i - N] + u[i + N] + u[i - L] + u[i + L] + v[i]) / 6 - u[i]); } }
      else { for (let z = 1; z < N - 1; z++) for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { const i = (z * N + y) * N + x; a[i] = (u[i - 1] + u[i + 1] + u[i - N] + u[i + N] + u[i - L] + u[i + L] + v[i]) / 6; } u.set(a); } }
    let mx = 0; for (const q of u) mx = Math.max(mx, q); const iso = 0.12 * mx, S = fsIso(u, N, iso, null, 1); let Q = 0; for (let i = 0; i < u.length; i++) if (u[i] > iso) Q += v[i];
    return S.flux / Q; };
  const g = [21, 31, 41].map(N => ({ N, r: dipole(N, 400, true) }));
  ok('Gauss on the drawn surface: the flux of −∇u out of the equipotential around +q equals the charge inside, Φ/Q → 1 as the lattice refines (Poisson solved here by red–black SOR)',
    g.every(x => Math.abs(x.r - 1) < 0.015) && Math.abs(g[2].r - 1) < Math.abs(g[0].r - 1), g.map(x => `${x.N}³: ${x.r.toFixed(4)}`).join(' · '));

  /* 2 · the widest isotherm */
  const widest = (N, W, alpha, relative) => { const L = N * N, h = (N - 1) / 2; let u = new Float64Array(N ** 3), a = new Float64Array(N ** 3);
    for (let z = 1; z < N - 1; z++) for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) u[(z * N + y) * N + x] = Math.exp(-(((x - h) / W) ** 2 + ((y - h) / W) ** 2 + ((z - h) / W) ** 2));
    const S = [];
    for (let st = 0; st < 400; st++) { let m = 0, r2 = 0, mx = 0; for (let z = 1; z < N - 1; z++) for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { const q = u[(z * N + y) * N + x]; mx = Math.max(mx, q); m += q; r2 += q * ((x - h) ** 2 + (y - h) ** 2 + (z - h) ** 2); }
      S.push({ t: st, V: fsIso(u, N, relative ? 0.1 * mx : 0.1, null, 1).volume, r2: r2 / m }); const w = fsWidest(S); if (w && S[S.length - 1].V < 0.9 * w.V) return w;
      for (let z = 1; z < N - 1; z++) for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { const i = (z * N + y) * N + x; a[i] = u[i] + alpha * 0.3 * (u[i - 1] + u[i + 1] + u[i - N] + u[i + N] + u[i - L] + u[i + L] - 6 * u[i]); } [u, a] = [a, u]; }
    return null; };
  const w3 = widest(31, 3, 0.16), w5 = widest(45, 5, 0.16);
  ok('the widest moment of an isotherm: at its widest a fixed level of a diffusing pulse has r² = ⟨r²⟩ — on the lab\'s own FTCS step the ratio is within 3 % and closes on 1 as the pulse is resolved',
    w3 && w5 && Math.abs(w3.ratio - 1) < 0.03 && Math.abs(w5.ratio - 1) < 0.01 && Math.abs(w5.ratio - 1) < Math.abs(w3.ratio - 1) / 3,
    w3 && w5 ? `width 3 cells: ${w3.ratio.toFixed(4)} (step ${w3.t.toFixed(1)}) · width 5: ${w5.ratio.toFixed(4)} (step ${w5.t.toFixed(1)})` : 'no widest moment');

  /* 3 · the critical point */
  const Ts = [4.40, 4.45, 4.48, 4.50, 4.52, 4.55, 4.60], U = {};
  for (const L of [8, 16]) U[L] = Ts.map((T, i) => fsWolff(L, T, 300, 4000, 1000 + L * 31 + i * 7).U);
  const c = fsCrossing(Ts, U[8], U[16]);
  ok('the critical point: Wolff clusters, Binder cumulants for L = 8 and 16 cross at T_c within 0.03 of 4.5115 (not an input), U* between 0.43 and 0.52',
    c && Math.abs(c.T - 4.5115) < 0.03 && c.U > 0.43 && c.U < 0.52, c ? `T_c = ${c.T.toFixed(4)} · U* = ${c.U.toFixed(4)}` : 'no crossing');

  /* 4 · wiring */
  ok('the wiring: SOR with the optimal ω in the lab, Gauss per equipotential, the fixed-level isotherm tracker, and the critical-point button',
    /const w=2\/\(1\+Math\.sin\(Math\.PI\/N\)\), sg=model==='gravity'\?-1:1;/.test(SRC) && /surf\.gauss=\{phi, q:model==='gravity'\?-Q:Q\}/.test(SRC)
    && /hs=\{c:0\.1\*m0,S:\[\],res:null\}/.test(SRC) && /id="fieldTc"/.test(SRC) && /id="fieldConverge"/.test(SRC) && /critical:\(\)=>fieldCriticalRun\(\)/.test(SRC));

  /* 5 · mutations */
  { const r = dipole(21, 30, false);
    ok('MUTATION — a Poisson solve stopped after 30 Jacobi sweeps reads Φ/Q far below 1: the law is a convergence meter, caught', r < 0.7, `Φ/Q = ${r.toFixed(3)}`); }
  { const rel = widest(31, 3, 0.16, true);
    ok('MUTATION — a level that follows the peak (c = u_max/10, as the drawn levels do) grows forever and has no widest moment, caught', rel === null); }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
