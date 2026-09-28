#!/usr/bin/env node
'use strict';
/* ══ CIRCLES IN THE SKY ═════════════════════════════════════════════════════════════════════
 * The matched-circle engine of Cornish, Spergel & Starkman, as the atlas runs it in the space-form laboratory.
 * An engine is worth what its null and its injections say, so checked:
 *   1. the statistic: S = 1 for a circle against itself, the twist and the orientation of a reversed, turned copy
 *      are recovered exactly, and unrelated circles average S ≈ 0
 *   2. the antipodal identity n′(φ) = −n(−φ) of a back-to-back pair — the reason the low modes along the circle
 *      are dropped: unfiltered, a pure quadrupole sky "matches" every pair
 *   3. the null, by Monte Carlo: S_max(α) of the two-stage search (coarse sweep, fine refinement) on random skies
 *      with no topology — its mean at each radius and its pooled spread
 *   4. injected pairs with the Poincaré twist (36°) at α = 34° and 68° are found at their own radius (± 2°), centre
 *      (± 3°) and twist, more than 5σ above that null
 *   5. the circles each space would draw: back to back, radius from the S³/Γ criterion, twist θ_min — 36° for I*,
 *      6° for L(60,1) — and none past R_max
 *   6. wiring: the search is in the laboratory, reads the embedded sky, and is in the discovery ledger
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { cssBasis, cssCircle, cssMatch, cssMMin, cssRandomSky, cssRasterize, cssGridSky, cssInject, cssSearch2, cssExpected, mulberry, ctChiOfZ } = K;
  const OPT = { nDir: 3000, nc: 128, nf: 256, K: 8, a0: 30, a1: 70, da: 2 };
  const sky = (T) => { const Tf = cssRasterize(T, 256, 128); return { Tf, Tc: cssGridSky(Tf.grid, 256, 128, 2) }; };
  { const T = cssRasterize(cssRandomSky(3, 400, 40), 128, 64), c = [0.3, -0.5, 0.81], l = Math.hypot(...c), u = c.map(v => v / l);
    const t = cssCircle(T, u, 0.6, 128), self = cssMatch(t, t);
    const turned = Float64Array.from({ length: 128 }, (_, i) => t[((-i + 20) % 128 + 128) % 128]), m = cssMatch(t, turned);
    const rnd = mulberry(5); let s = 0, N = 200; for (let i = 0; i < N; i++) { const d = () => { const z = 2 * rnd() - 1, p = 2 * Math.PI * rnd(), r = Math.sqrt(1 - z * z); return [r * Math.cos(p), r * Math.sin(p), z]; };
      const a = cssCircle(T, d(), 0.5, 128), b = cssCircle(T, d(), 0.5, 128); const e = a.reduce((x, v) => x + v * v, 0) + b.reduce((x, v) => x + v * v, 0); let dot = 0; for (let k = 0; k < 128; k++) dot += a[k] * b[k]; s += 2 * dot / e; }
    ok('the statistic: S = 1 on itself, the twist and orientation of a reversed, turned copy recovered, unrelated circles average S ≈ 0',
      Math.abs(self.S - 1) < 1e-12 && self.psi === 0 && !self.flip && Math.abs(m.S - 1) < 1e-12 && m.flip && Math.abs(s / N) < 0.08,
      `turned copy S ${m.S.toFixed(6)} ψ ${m.psi}° flip ${m.flip} · ⟨S⟩ unrelated ${(s / N).toFixed(3)}`); }
  /* why the low modes along the circle must go: the circle about −c is the antipode of the circle about c run
     backwards, n′(φ) = −n(−φ), so reversed it compares T(n) with T(−n) and every even multipole matches itself */
  { const rnd = mulberry(9); let worst = 0; for (let t = 0; t < 50; t++) { const z = 2 * rnd() - 1, p = 2 * Math.PI * rnd(), r = Math.sqrt(1 - z * z), c = [r * Math.cos(p), r * Math.sin(p), z], a = 0.3 + rnd();
      const [u, w] = cssBasis(c), [u2, w2] = cssBasis(c.map(v => -v)); for (let i = 0; i < 16; i++) { const f = 2 * Math.PI * i / 16;
        const n1 = [0, 1, 2].map(k => Math.cos(a) * c[k] + Math.sin(a) * (Math.cos(-f) * u[k] + Math.sin(-f) * w[k])), n2 = [0, 1, 2].map(k => -Math.cos(a) * c[k] + Math.sin(a) * (Math.cos(f) * u2[k] + Math.sin(f) * w2[k]));
        worst = Math.max(worst, Math.hypot(n2[0] + n1[0], n2[1] + n1[1], n2[2] + n1[2])); } }
    const even = n => { const x = n[0], y = n[1], zz = n[2]; return 3 * zz * zz - 1 + 2 * x * y + (x * x - y * y); }, Te = cssRasterize(even, 256, 128), c = [0.2, 0.6, 0.77].map((v, i, A) => v / Math.hypot(...A)), aR = 40 * Math.PI / 180;
    const raw = cssMatch(cssCircle(Te, c, aR, 256), cssCircle(Te, c.map(v => -v), aR, 256), 1);
    ok('the antipodal identity: the circle about −c is the antipode of the circle about c run backwards — so a pure even-ℓ sky "matches" every back-to-back pair, which is why modes longer than 15° along the circle are dropped',
      worst < 1e-12 && raw.S > 0.99 && raw.flip && cssMMin(aR) === Math.floor(360 * Math.sin(aR) / 15), `|n′(φ) + n(−φ)| ≤ ${worst.toExponential(1)} · quadrupole sky, unfiltered: S ${raw.S.toFixed(4)} reversed · m_min(40°) = ${cssMMin(aR)}`); }
  const nulls = [];
  for (let seed = 11; seed < 15; seed++) { const { Tc, Tf } = sky(cssRandomSky(seed, 900, 100)); nulls.push(cssSearch2(Tc, Tf, OPT).map(r => r.S)); }
  const A = nulls[0].map((_, i) => OPT.a0 + i * OPT.da), mu = A.map((_, i) => nulls.reduce((a, v) => a + v[i], 0) / nulls.length);
  let ss = 0, nn = 0; for (const v of nulls) v.forEach((x, i) => { ss += (x - mu[i]) ** 2; nn++; }); const sd = Math.sqrt(ss / (nn - A.length));
  ok('the null by Monte Carlo: four skies with no topology through the identical two-stage pipeline give S_max(α) with a small spread', sd > 0 && sd < 0.05 && mu.every(v => v < 0.85),
    `S_max(30°) ${mu[0].toFixed(3)} … S_max(70°) ${mu[mu.length - 1].toFixed(3)} · pooled σ ${sd.toFixed(4)}`);
  for (const [aI, seed] of [[34, 77], [68, 80]]) { const rnd = mulberry(seed), z = 2 * rnd() - 1, p = 2 * Math.PI * rnd(), r = Math.sqrt(1 - z * z), c = [r * Math.cos(p), r * Math.sin(p), z];
    const { Tc, Tf } = sky(cssInject(cssRandomSky(29, 900, 100), c, aI, 36, 4)), cur = cssSearch2(Tc, Tf, OPT), zz = cur.map((x, i) => (x.S - mu[i]) / sd), k = zz.indexOf(Math.max(...zz)), b = cur[k];
    const sep = Math.acos(Math.min(1, Math.abs(b.c[0] * c[0] + b.c[1] * c[1] + b.c[2] * c[2]))) * 180 / Math.PI, twist = Math.min(Math.abs(b.psi - 36), Math.abs(b.psi - 324));
    ok(`an injected pair at α = ${aI}° with the Poincaré twist is found at its own radius, centre and twist, more than 5σ above the null`,
      Math.abs(b.alphaDeg - aI) <= 2 && sep <= 3 && twist <= 6 && zz[k] > 5, `α ${b.alphaDeg}° · centre ${sep.toFixed(2)}° off · ψ ${b.psi.toFixed(1)}° · S ${b.S.toFixed(3)} = null ${mu[k].toFixed(3)} + ${zz[k].toFixed(1)}σ`); }
  { const chi = ctChiOfZ(1089.89), I = cssExpected('Istar', 140, chi), Ino = cssExpected('Istar', 145, chi), L = cssExpected('L60', 500, chi), Lno = cssExpected('L60', 1000, chi);
    ok('the circles each space would draw: twist θ_min (36° for I*, 6° for L(60,1)), radius from the criterion, none past R_max',
      I.exists && Math.abs(I.psiDeg - 36) < 1e-9 && !Ino.exists && L.exists && Math.abs(L.psiDeg - 6) < 1e-9 && !Lno.exists && I.alphaDeg > 0 && I.alphaDeg < 90,
      `I* at 140 Gly: α ${I.alphaDeg.toFixed(1)}° · L(60,1) at 500 Gly: α ${L.alphaDeg.toFixed(1)}°, R_max ${L.RmaxGly.toFixed(0)} Gly`); }
  ok('wiring: the search is in the space-form laboratory, reads the embedded CAMB sky, and is in the discovery ledger',
    /id="cssMap"/.test(SRC) && /cssRun\('inject'\)/.test(SRC) && /getElementById\('hcc-cmb-sky'\)/.test(SRC) && /\{id:'cssEngine', kind:'confirms'/.test(SRC));
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
