#!/usr/bin/env node
'use strict';
/* ══ THE KNOTS OF LIGHT — THE NULL LIGHT OF S³ IN FLAT SPACE (v4.357) ════════════════════════════════════════════
 * Measured on the atlas's own kernels (core/atlas/extracted.mjs):
 *   1. the Penrose map of Minkowski space onto the Einstein cylinder: its exact Jacobian equals central differences
 *   2. the pulled-back null modes P = z₁^a z₂^b(ξ₂ + iξ₃)e^{−i(m+2)T} satisfy Gauss, Faraday and Ampère in flat space
 *      (central differences at random events) and stay null: E·B = 0, |E| = |B|
 *   3. for P = 1 (Rañada's knot) a traced B line closes on itself
 *   4. the zeros of the light on S³ are Hopf fibres: |F| = 0 on z₁ = 0 (a > 0) and z₂ = 0 (b > 0), and not elsewhere
 *   5. wired: the resonator's flat-space mode, its zero fibres, the ledger entry whose track replays
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { gmodeFlatJ, gmodeFlatField, gmodeFlatMaxwell, gmodeFlatLine, gmodeZeroFibres, gmodeNullF, gmodeNullNorm, gmodeRng, gmodeRandS3, discoveryTrack, trackRun } = K;
  { const cyl = (t, x) => { const r = Math.hypot(...x), a = Math.atan(t + r), b = Math.atan(t - r), c = a - b, n = x.map(v => v / r); return [a + b, Math.sin(c) * n[0], Math.sin(c) * n[1], Math.sin(c) * n[2], Math.cos(c)]; };
    let w = 0, h = 1e-6; for (const [t, x] of [[0.3, [0.2, -0.4, 0.5]], [-1.1, [1.3, 0.2, -0.7]], [2.0, [-0.5, 0.9, 1.4]]]) { const Q = gmodeFlatJ(t, x), X = [t, ...x];
      for (let mu = 0; mu < 4; mu++) { const p = X.slice(), m = X.slice(); p[mu] += h; m[mu] -= h; const A = cyl(p[0], p.slice(1)), B = cyl(m[0], m.slice(1)); for (let i = 0; i < 5; i++) w = Math.max(w, Math.abs((A[i] - B[i]) / (2 * h) - Q.J[mu][i])); } }
    ok('the Penrose map T = atan(t+r) + atan(t−r), χ = atan(t+r) − atan(t−r) onto the Einstein cylinder: its exact Jacobian agrees with central differences', w < 1e-8, `worst ${w.toExponential(1)}`); }
  { const R = [[0, 0], [1, 0], [0, 2], [2, 1], [1, 3]].map(([a, b]) => [a, b, gmodeFlatMaxwell(a, b, 6, 3)]), worst = Math.max(...R.map(([, , r]) => Math.max(r.gauss, r.faraday, r.ampere))), nul = Math.max(...R.map(([, , r]) => r.nullity));
    ok('pulled back to flat space the null modes are exact solutions of the vacuum Maxwell equations (Gauss, Faraday, Ampère by central differences at random events) and stay null', worst < 2e-6 && nul < 1e-12, `Maxwell ≤ ${worst.toExponential(1)} · nullity ≤ ${nul.toExponential(1)}`); }
  { const N = gmodeNullNorm(0, 0), back = []; for (const s of [[0, 0.7, 0.2], [0.3, 0.3, 0.3]]) { const L = gmodeFlatLine(0, 0, 0, s, 'B', 2000, 0.01, N); let b = 9; for (let i = 100; i < L.length; i++) b = Math.min(b, Math.hypot(L[i][0] - s[0], L[i][1] - s[1], L[i][2] - s[2])); back.push(b); }
    ok('for P = 1 (Rañada’s electromagnetic knot) traced B lines close on themselves', back.every(b => b < 5e-3), back.map(b => b.toExponential(1)).join(' · ')); }
  { const rnd = gmodeRng(5); let on = 0, off = Infinity; for (const [a, b] of [[2, 1], [1, 3], [3, 0]]) { for (const f of gmodeZeroFibres(a, b)) for (const q of f.pts) on = Math.max(on, Math.hypot(...gmodeNullF(a, b, q, 0).E));
      for (let i = 0; i < 200; i++) { const q = gmodeRandS3(rnd), r1 = Math.hypot(q[0], q[1]), r2 = Math.hypot(q[2], q[3]); if ((a > 0 && r1 < 0.05) || (b > 0 && r2 < 0.05)) continue; off = Math.min(off, Math.hypot(...gmodeNullF(a, b, q, 0).E)); } }
    ok('the zeros of the light on S³ are Hopf fibres: |F| vanishes exactly on z₁ = 0 (a > 0) and z₂ = 0 (b > 0) and nowhere else', on === 0 && off > 1e-6 && gmodeZeroFibres(0, 0).length === 0, `on the fibres ${on} · elsewhere ≥ ${off.toExponential(1)}`); }
  { const t = discoveryTrack('lightKnotsFlat'), r = t ? trackRun(t) : null;
    const wired = /data-gmodefield','flat'/.test(SRC) && /function gmodeFlatTick\(dt\)/.test(SRC) && /if\(P\.field==='flat'\)\{ gmodeFlatTick\(dt\); return; \}/.test(SRC) && /O\.light\.zeros=triCapsulePolys\(Z\.map\(z=>z\.pts\)/.test(SRC);
    ok('wired: the resonator’s flat-space mode (energy cloud, B and E lines refreshed one per frame), the zero fibres drawn in the light mode, and the ledger entry whose track replays', wired && !!(r && r.ok)); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
