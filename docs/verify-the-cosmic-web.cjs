#!/usr/bin/env node
'use strict';
/* ══ 🕸 THE COSMIC WEB, MEASURED ON THE ATLAS'S OWN GALAXIES ══════════════════════════
 * "What the catalogues say" gained a station: the projected two-point function w_p(r_p) of
 * the 4 341 embedded galaxies (Landy & Szalay 1993) against randoms drawn through the same
 * window, Peebles's power law through it, and the minimal spanning tree as the web's
 * skeleton (Barrow, Bhavsar & Sonoda 1985). This file runs the extracted kernels
 * (core/atlas/extracted.mjs) against references written HERE:
 *   1. the projection identity: for ξ = (r/r₀)^−γ, 2∫₀^∞ ξ(√(r_p² + π²)) dπ, integrated here by
 *      quadrature, equals r_p (r₀/r_p)^γ Γ(½)Γ((γ−1)/2)/Γ(γ/2) — the kernel's H(γ) — to 1e-6
 *   2. the estimator on catalogues with a KNOWN answer: a Poisson box gives w_p ≈ 0; a
 *      Neyman–Scott box (Gaussian clusters, for which w_p is exactly
 *      (m−1)/(m n_c) · e^{−r_p²/4s²}/(4π s²)) is recovered within 20 % where it is large
 *   3. WHY PROJECT: scatter every clustered point along its line of sight by 3 Mpc — the
 *      pair excess in 3D below 2 Mpc collapses, w_p barely moves
 *   4. the tree: Prim's O(N²) tree has N − 1 edges, is connected, and has the same total
 *      length as Kruskal's with a union–find written here (to 1e-9); pruning leaves a tree
 *   5. the atlas's own galaxies: γ within 1.6–2.3, r₀ at γ = 1.8 within 3.5–8 Mpc, the same
 *      to ±0.2 in γ for three random seeds, and a real tree ≥ 15 % shorter than a random one
 *   6. the wiring: the station, HCC_STATS.web / skeleton, the 3D tree hooked into the
 *      galaxy layer and framed from the supergalactic pole
 *   7. MUTATIONS: the Landy–Szalay numerator with DR counted once instead of twice, and
 *      randoms that borrow the galaxies' own directions, are each caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
let seed = 13; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }, gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-300)) * Math.cos(2 * Math.PI * rnd());

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { webWpH, webWp, webPowerFit, webR0At, webMST, webPrune, webRandoms } = K;

  /* 1 · the projection identity, by quadrature here (π = r_p sinh t, which tames the tail) */
  const devs = [1.5, 1.8, 2.2].map(g => { const rp = 2.3, r0 = 5; let s = 0; const h = 1e-3;
    for (let t = h / 2; t < 30; t += h) { const pi = rp * Math.sinh(t), r = Math.hypot(rp, pi); s += Math.pow(r / r0, -g) * rp * Math.cosh(t) * h; }
    return Math.abs(2 * s / (rp * webWpH(g) * Math.pow(r0 / rp, g)) - 1); });
  ok('the projection identity: 2∫ξ dπ by quadrature equals r_p H(γ)(r₀/r_p)^γ with H = Γ(½)Γ((γ−1)/2)/Γ(γ/2), to 1e-6 for γ = 1.5, 1.8, 2.2', devs.every(d => d < 1e-6), devs.map(d => d.toExponential(1)).join(' · '));

  /* 2 · catalogues with known answers, in a box 250 Mpc away (lines of sight nearly parallel) */
  const L = 120, off = [250, 0, 0], box = () => [off[0] + (rnd() - 0.5) * L, off[1] + (rnd() - 0.5) * L, off[2] + (rnd() - 0.5) * L];
  const uni = n => Array.from({ length: n }, box);
  const nc = 500, m = 8, s = 1.2, NS = []; for (let c = 0; c < nc; c++) { const C = box(); for (let k = 0; k < m; k++) NS.push([C[0] + s * gauss(), C[1] + s * gauss(), C[2] + s * gauss()]); }
  const R = uni(2 * NS.length), o = { nb: 8, rpMin: 0.3, rpMax: 6, piMax: 20, dpi: 2 };
  const Bp = webWp(uni(NS.length), R, o), Bn = webWp(NS, R, o), ncDen = nc / L ** 3;
  const exact = rp => (m - 1) / (m * ncDen) * Math.exp(-rp * rp / (4 * s * s)) / (4 * Math.PI * s * s);
  const rel = Bn.filter(b => exact(b.rp) > 20).map(b => b.wp / exact(b.rp) - 1), poiss = Math.max(...Bp.map(b => Math.abs(b.wp)));
  ok('the estimator on known answers: a Poisson box gives |w_p| < 6 Mpc everywhere (the clustered box reaches hundreds); a Neyman–Scott box of Gaussian clusters gives the exact (m−1)/(m n_c)·e^{−r_p²/4s²}/(4πs²) within 20 % wherever it exceeds 20 Mpc',
    poiss < 6 && rel.length >= 3 && rel.every(r => Math.abs(r) < 0.2), `Poisson max |w_p| ${poiss.toFixed(2)} · Neyman–Scott ${rel.map(r => (100 * r).toFixed(0) + '%').join(' ')}`);

  /* 3 · why project: errors along the sight line */
  const smear = NS.map(p => { const n = Math.hypot(...p), e = gauss() * 3; return p.map(x => x + e * x / n); });
  const xi3 = P => { let dd = 0, rr = 0; const r2 = 2; for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) if (Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1], P[i][2] - P[j][2]) < r2) dd++;
    for (let i = 0; i < 3000; i++) for (let j = i + 1; j < 3000; j++) if (Math.hypot(R[i][0] - R[j][0], R[i][1] - R[j][1], R[i][2] - R[j][2]) < r2) rr++;
    return (dd / (P.length * (P.length - 1) / 2)) / (rr / (3000 * 2999 / 2)) - 1; };
  const x0 = xi3(NS), x1 = xi3(smear), Bs = webWp(smear, R, o), w0 = Bn.filter(b => b.rp > 0.5 && b.rp < 2).reduce((a, b) => a + b.wp, 0), w1 = Bs.filter(b => b.rp > 0.5 && b.rp < 2).reduce((a, b) => a + b.wp, 0);
  ok('WHY PROJECT — every point scattered 3 Mpc along its line of sight: the 3D pair excess inside 2 Mpc falls by more than half, w_p over 0.5–2 Mpc moves by less than 15 %',
    x1 < 0.5 * x0 && Math.abs(w1 / w0 - 1) < 0.15, `ξ(<2 Mpc) ${x0.toFixed(1)} → ${x1.toFixed(1)} · Σw_p ${w0.toFixed(1)} → ${w1.toFixed(1)}`);

  /* 4 · the tree against Kruskal */
  const Q = uni(800), E = webMST(Q), parent = Q.map((_, i) => i), find = i => parent[i] === i ? i : (parent[i] = find(parent[i]));
  const all = []; for (let i = 0; i < Q.length; i++) for (let j = i + 1; j < Q.length; j++) all.push([i, j, Math.hypot(Q[i][0] - Q[j][0], Q[i][1] - Q[j][1], Q[i][2] - Q[j][2])]);
  all.sort((a, b) => a[2] - b[2]); let kr = 0, ke = 0; for (const [i, j, d] of all) { const a = find(i), b = find(j); if (a !== b) { parent[a] = b; kr += d; ke++; } }
  const pr = E.reduce((a, e) => a + e[2], 0), seen = new Set([0]), adj = Q.map(() => []); E.forEach(([i, j]) => { adj[i].push(j); adj[j].push(i); });
  const st = [0]; while (st.length) { const v = st.pop(); for (const w of adj[v]) if (!seen.has(w)) { seen.add(w); st.push(w); } }
  const P5 = webPrune(E, Q.length, 5);
  ok('the tree: Prim\'s has N − 1 edges, reaches every point, and its total length equals Kruskal\'s (union–find, written here) to 1e-9; pruning five rounds of leaves keeps fewer edges', E.length === Q.length - 1 && seen.size === Q.length && Math.abs(pr / kr - 1) < 1e-9 && ke === E.length && P5.length < E.length && P5.length > 0,
    `${E.length} edges · Prim ${pr.toFixed(4)} vs Kruskal ${kr.toFixed(4)} · pruned ${P5.length}`);

  /* 5 · the atlas's own galaxies */
  const m1 = SRC.match(/const DSO3D_GAL=\{count:(\d+),sha256:'[0-9a-f]+',b64:'([^']+)'/), n = +m1[1], buf = Buffer.from(m1[2], 'base64'), G = [];
  for (let i = 0; i < n; i++) { const o8 = i * 8, ra = buf.readUInt16LE(o8) / 65536 * 2 * Math.PI, de = buf.readInt16LE(o8 + 2) / 32767 * Math.PI / 2, dK = Math.pow(10, buf.readUInt16LE(o8 + 4) / 8000 - 2);
    G.push({ e: [Math.cos(de) * Math.cos(ra), Math.cos(de) * Math.sin(ra), Math.sin(de)], d: dK / 1000 }); }
  const D = G.map(g => g.e.map(x => x * g.d)), fits = [5, 7, 9].map(sd => { const B = webWp(D, webRandoms(G, 2 * G.length, sd).R); return { f: webPowerFit(B, 0.5, 10), r018: webR0At(B, 1.8, 0.5, 10), B }; });
  const Ed = webMST(D), Er = webMST(webRandoms(G, G.length, 5).R), mean = A => A.reduce((a, e) => a + e[2], 0) / A.length, short = 1 - mean(Ed) / mean(Er), f0 = fits[0].f;
  ok('the atlas\'s own 4 341 galaxies: γ within 1.6–2.3 and r₀ (γ = 1.8) within 3.5–8 Mpc, stable to ±0.2 in γ over three random seeds; the real tree is at least 15 % shorter than a random one through the same window',
    n === 4341 && fits.every(q => q.f.gamma > 1.6 && q.f.gamma < 2.3 && q.r018 > 3.5 && q.r018 < 8) && Math.max(...fits.map(q => q.f.gamma)) - Math.min(...fits.map(q => q.f.gamma)) < 0.4 && short > 0.15,
    `${fits.map(q => `γ ${q.f.gamma.toFixed(2)}, r₀ ${q.f.r0.toFixed(2)} (at 1.8: ${q.r018.toFixed(2)})`).join(' · ')} · tree ${(100 * short).toFixed(0)} % shorter`);

  /* 6 · wiring */
  ok('the wiring: the 🕸 station, HCC_STATS.web and .skeleton, the tree hooked into the galaxy layer, framed from the supergalactic pole by the seamless layer change',
    /\['web',TT\('The cosmic web'/.test(SRC) && /web:\(\)=>\{ const W=statWeb\(\);/.test(SRC) && /skeleton:on=>\{ if\(on!==undefined\) webSkelShow\(on\);/.test(SRC) && /try\{ webSkelUpdate\(\); \}catch/.test(SRC)
    && /const l=47\.37\*Math\.PI\/180, b=6\.32\*Math\.PI\/180/.test(SRC) && /advanceScaleLayer\('cosmic'\)/.test(SRC));

  /* 7 · mutations */
  { const src = webWp.toString(), cut = '((d/nDD)-2*DR[k][j]/nDR+rr)'; const mut = new Function('webPairCounts', 'return ' + src.replace(cut, '((d/nDD)-DR[k][j]/nDR+rr)'))(K.webPairCounts);
    const Bm = mut(uni(NS.length), R, o), bad = Math.max(...Bm.map(b => Math.abs(b.wp)));
    ok('MUTATION — the Landy–Szalay numerator with DR once instead of twice makes a Poisson box look clustered, caught', src.includes(cut) && bad > 10, `max |w_p| on Poisson ${bad.toFixed(1)}`); }
  { const R2 = Array.from({ length: 2 * G.length }, () => { const a = G[Math.floor(rnd() * G.length)], b = G[Math.floor(rnd() * G.length)]; return a.e.map(x => x * b.d); });
    const B2 = webWp(D, R2), f2 = webR0At(B2, 1.8, 0.5, 10);
    ok('MUTATION — randoms that borrow the galaxies\' own directions copy the Local Supercluster into the randoms and subtract most of the signal: r₀ falls by more than a third, caught', f2 < 0.67 * fits[0].r018, `r₀ at γ 1.8: ${fits[0].r018.toFixed(2)} → ${f2.toFixed(2)} Mpc`); }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
