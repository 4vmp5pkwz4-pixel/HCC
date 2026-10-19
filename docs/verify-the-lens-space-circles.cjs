#!/usr/bin/env node
'use strict';
/* ══ ONE OBSERVER IN AN INHOMOGENEOUS LENS SPACE L(p,q), q² ≡ −1 (mod p) (v4.392) ════════════════════════════════════
 * From the META–CAUSAL manuscript of 17 October 2026 (unrefereed): exact matched-circle geometry for a Haar-uniform
 * observer in L(p,q). Checked here by running the page's own pure code, against independent computations:
 *   1. the manuscript's numbers: F(L(13,5), χ* = 0.3) = 0.0735882904, F(L(65,8), 0.075) = 0.0469059026,
 *      F(L(65,18), 0.075) = 0.0112754501; a 30° pair has its centres 151.1958868° (q = 8) / 118.6826087° (q = 18) apart;
 *      65 has two inequivalent roots of q² ≡ −1, 8 and 18
 *   2. the closed forms against R⁴: the orbit of the observer, carried to the identity, has Re = cos d_j and its
 *      images' directions are ϑ_j apart, for random observers and generators
 *   3. the window theorem: for χ* in (π/p, 2π/p) every observer sees exactly one pair or none — g^{±1} for u > 1 − w,
 *      g^{±q} for u < w — so the share of observers is F = 2w
 *   4. conditional universality: given a pair, cos d is uniform on [cos 2χ*, cos(2π/p)] for every q — the radius says
 *      nothing about q
 *   5. the single-sky discriminant: an observer's (α, ϑ) lies on the curve of its own q on both branches (the
 *      order-four isometry (z₁, z₂) ↦ (z₂, z̄₁) swaps them), and the curves of 8 and 18 differ
 *   6. wiring and words: the laboratory draws the orbit, the spheres and the circles; it says this is geometry, not a forecast
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const grab = (re, what) => { const m = SRC.match(re); if (!m) throw new Error('not found: ' + what); return m[0]; };
const fn = name => { const i = SRC.indexOf('function ' + name + '('); if (i < 0) throw new Error('no function ' + name); let d = 0, j = SRC.indexOf('{', i);
  for (let k = j; k < SRC.length; k++) { const c = SRC[k]; if (c === '{') d++; else if (c === '}') { d--; if (!d) return SRC.slice(i, k + 1); } } throw new Error('unbalanced ' + name); };
try {
  const L = new Function([fn('ghostQMul'), grab(/const LPQ_PRESETS=[^\n]*\n/, 'presets'), grab(/const lpqMod=[^\n]*\n/, 'mod'), fn('lpqRoots'), grab(/const lpqCosD=[^\n]*\n/, 'cos d'), grab(/const lpqAlpha=[^\n]*\n/, 'α'),
    grab(/const lpqTheta=[^\n]*\n/, 'ϑ'), fn('lpqWindow'), fn('lpqSelection'), fn('lpqObserver'), fn('lpqCurve'), fn('lpqOrbit'),
    'return {LPQ_PRESETS,lpqRoots,lpqCosD,lpqAlpha,lpqTheta,lpqWindow,lpqSelection,lpqObserver,lpqCurve,lpqOrbit};'].join('\n'))();
  const deg = x => x * 180 / Math.PI;
  /* 1 */
  { const f1 = L.lpqSelection(13, 5, 0.3), f2 = L.lpqSelection(65, 8, 0.075), f3 = L.lpqSelection(65, 18, 0.075), a = 30 * Math.PI / 180, t8 = deg(L.lpqCurve(65, 8, 0.075, a)), t18 = deg(L.lpqCurve(65, 18, 0.075, a));
    const r = L.lpqRoots(65), good = Math.abs(f1 - 0.0735882904) < 1e-10 && Math.abs(f2 - 0.0469059026) < 1e-10 && Math.abs(f3 - 0.0112754501) < 1e-10 && Math.abs(t8 - 151.1958868) < 1e-7 && Math.abs(t18 - 118.6826087) < 1e-7 && r.join() === '8,18';
    ok('the manuscript’s numbers, from the page’s own code: F = 0.0735882904 (L(13,5), χ* = 0.3), 0.0469059026 and 0.0112754501 (L(65,8), L(65,18), χ* = 0.075); a 30° pair’s centres 151.1958868° and 118.6826087° apart; the roots of q² ≡ −1 (mod 65) are 8 and 18',
      good, `F ${f1.toFixed(10)}, ${f2.toFixed(10)}, ${f3.toFixed(10)} · ϑ ${t8.toFixed(7)}°, ${t18.toFixed(7)}° · roots ${r.join(', ')}`); }
  /* 2 */
  { let s = 12345, worstD = 0, worstT = 0; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (const [p, q] of [[13, 5], [41, 9], [65, 8], [65, 18], [85, 13]]) for (let t = 0; t < 40; t++) { const u = rnd(), O = L.lpqOrbit(p, q, u), j = 1 + Math.floor(rnd() * (p - 1));
      worstD = Math.max(worstD, Math.abs(O[j][0] - L.lpqCosD(p, q, u, j)));
      const v = y => { const w = [y[1], y[2], y[3]], l = Math.hypot(...w); return w.map(x => x / l); }, a = v(O[j]), b = v(O[(p - j) % p]);
      if (Math.abs(O[j][0]) < 0.999) worstT = Math.max(worstT, Math.abs(Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) - L.lpqTheta(p, q, u, j))); }
    ok('the closed forms against R⁴: the observer’s orbit, carried to the identity by x̄ (an isometry), has Re = cos d_j, and the images g^{±j} are seen ϑ_j apart', worstD < 1e-12 && worstT < 1e-9, `cos d to ${worstD.toExponential(1)} · ϑ to ${worstT.toExponential(1)} rad over 200 random observers and generators`); }
  /* 3 */
  { let bad = 0, tot = 0, share = 0;
    for (const [p, q, chi] of [[13, 5, 0.3], [41, 9, 0.11], [65, 8, 0.075], [65, 18, 0.075], [65, 8, 0.0509]]) { const n = 4000, o0 = L.lpqObserver(p, q, 0.5, chi); let seen = 0;
      for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, js = []; for (let j = 1; j < p; j++) if (Math.acos(Math.max(-1, Math.min(1, L.lpqCosD(p, q, u, j)))) < 2 * chi) js.push(j); tot++;
        const want = u > 1 - o0.w ? [1, p - 1] : u < o0.w ? [q, p - q].sort((a, b) => a - b) : []; if (js.join() !== want.join()) bad++; if (js.length) seen++; }
      share = Math.max(share, Math.abs(seen / n - L.lpqSelection(p, q, chi))); }
    ok('the window theorem: for π/p < χ* < 2π/p each observer sees exactly one pair or none — g^{±1} when u > 1 − w, g^{±q} when u < w — and the share of observers is F = 2w', bad === 0 && share < 1e-3, `${tot - bad}/${tot} observers as the theorem says · share against F to ${share.toExponential(1)}`); }
  /* 4 */
  { let worst = 0; const a = Math.cos(2 * Math.PI / 65), chi = 0.075, C = Math.cos(2 * chi);
    /* the observers who see a pair, by the midpoint rule on each branch (u < w and u > 1 − w, equal measure): the sorted
       cos d must be the quantiles of the uniform law on [C, a], for q = 8 and q = 18 alike */
    const Q = {}; for (const q of [8, 18]) { const o = L.lpqObserver(65, q, 0.5, chi), n = 4000, zs = [];
      for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; for (const u of [o.w * t, 1 - o.w * t]) zs.push(Math.max(L.lpqCosD(65, q, u, 1), L.lpqCosD(65, q, u, q))); }
      zs.sort((x, y) => x - y); Q[q] = zs; for (let k = 0; k < zs.length; k += 2) worst = Math.max(worst, Math.abs((zs[k] - C) / (a - C) - (k / 2 + 0.5) / n)); }
    for (let k = 0; k < Q[8].length; k++) worst = Math.max(worst, Math.abs(Q[8][k] - Q[18][k]) / (a - C));
    ok('conditional universality: given a pair, cos d is uniform on [cos 2χ*, cos(2π/p)] for q = 8 and q = 18 alike — the circle’s radius alone carries no information about q', worst < 1e-9, `quantiles against the uniform law, and q = 8 against q = 18, to ${worst.toExponential(1)}`); }
  /* 5 */
  { let worst = 0; for (const q of [8, 18]) { const o = L.lpqObserver(65, q, 0.5, 0.075); for (const u of [0.0005, o.w * 0.4, o.w * 0.9, 1 - o.w * 0.9, 1 - o.w * 0.4, 0.9995]) { const ob = L.lpqObserver(65, q, u, 0.075); if (!ob.pair) continue; worst = Math.max(worst, Math.abs(ob.theta - L.lpqCurve(65, q, 0.075, ob.alpha))); } }
    const gap = deg(L.lpqCurve(65, 8, 0.075, 0.3) - L.lpqCurve(65, 18, 0.075, 0.3));
    ok('the single-sky discriminant: every observer’s (α, ϑ) lies on its own q’s curve on both branches, and the curves of L(65,8) and L(65,18) differ', worst < 1e-9 && Math.abs(gap) > 10, `on the curve to ${worst.toExponential(1)} rad · at α = 17.2° the curves are ${gap.toFixed(2)}° apart`); }
  /* 6 */
  { const wired = /orb=Lq\?lpqOrbit\(Lq\.p,Lq\.q,Lq\.u\):sgOrbit\(id\)/.test(SRC) && /const h=\(D\*D\+b0\.r\*b0\.r-b1\.r\*b1\.r\)\/\(2\*D\)/.test(SRC) && /\$\{lpqPanelHTML\(\)\}/.test(SRC) && /lpqBind\(ctl\);/.test(SRC);
    const words = SRC.includes('geometry of ideal last-scattering spheres, not a forecast') && SRC.includes('not a temperature forecast (no Doppler, ISW, visibility width, noise or masks), not an observation')
      && SRC.includes('the META–CAUSAL manuscript of 17 October 2026 (unrefereed)') && SRC.includes('COMPACT 2026');
    ok('wiring and words: the laboratory draws the observer’s orbit, its last-scattering spheres and the matched circles where they meet, and says this is geometry of ideal spheres, not a forecast or an observation, crediting its sources', wired && words, `wired ${wired ? '✓' : '✗'} · words ${words ? '✓' : '✗'}`); }
} catch (e) { fail++; console.log('  FAIL — verifier error: ' + (e && e.stack || e)); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
