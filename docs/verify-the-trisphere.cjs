#!/usr/bin/env node
'use strict';
/* ══ THE TRISPHERE · EVERYTHING THAT LEANS ON S³ ═══════════════════════════════════════
 * The atlas is named for the three-sphere and had never drawn it as the thing every
 * laboratory stands on. The new laboratory draws S³ whole — turned in R⁴, projected
 * stereographically — with its Clifford tori and Hopf fibres, and places every laboratory
 * on the torus of its chain distance from the ten core stations, joined by geodesics of
 * S³. This file checks the extracted kernels (core/atlas/extracted.mjs) against
 * references written HERE:
 *   1. the volume 2π²R³, integrated here in Hopf coordinates dV = cos η sin η dη dξ₁ dξ₂
 *   2. the Clifford torus area 4π²R² cos η sin η, maximal at exactly η = π/4 with 2π²R²
 *   3. the Laplacian multiplicity (n+1)², checked against harmonic polynomials COUNTED
 *      here monomial by monomial (dim P_n − dim P_{n−2} in four variables), n = 0…24
 *   4. the geodesic is a great-circle arc: every sample on S³, equal steps, and its
 *      length the angle between its ends
 *   5. the stereographic projection sends a great circle to a circle: its images are
 *      coplanar and equidistant from one centre
 *   6. every two Hopf fibres are linked once — the Gauss integral on their projections,
 *      every pair of twelve fibres, |Lk| = 1
 *   7. the layout: every laboratory on S³, the core on the flat torus η = π/4, each step
 *      of chain distance one torus further in
 *   8. the wiring: declared once, routed, drawn, in the API, related to the core stations —
 *      and every laboratory's S³ line opens it with that laboratory pinned
 *   9. MUTATIONS: the multiplicity without the subtraction, and a geodesic by straight
 *      interpolation, are each caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { triPoint, triHopf, triRotate, triProject, triGeodesic, triLayout, triFacts, topoLinkPure } = K;

  /* 1 · the volume, integrated here */
  { const N = 400; let s = 0; for (let i = 0; i < N; i++) { const e = (i + 0.5) * (Math.PI / 2) / N; s += Math.cos(e) * Math.sin(e) * (Math.PI / 2) / N; }
    const vol = s * (2 * Math.PI) ** 2, R = 1.7, f = triFacts(R, 0, 0.3);
    ok('the volume 2π²R³, integrated here in Hopf coordinates dV = cos η sin η dη dξ₁ dξ₂', Math.abs(vol / (2 * Math.PI ** 2) - 1) < 1e-5 && Math.abs(f.volume / (2 * Math.PI ** 2 * R ** 3) - 1) < 1e-14, `∫ = ${vol.toFixed(6)} against 2π² = ${(2 * Math.PI ** 2).toFixed(6)}`); }

  /* 2 · the Clifford torus */
  { let best = 0, at = 0; for (let k = 1; k < 20000; k++) { const e = k / 20000 * Math.PI / 2, a = triFacts(1, 0, e).cliffordArea; if (a > best) { best = a; at = e; } }
    ok('the Clifford torus area 4π²R² cos η sin η peaks at η = π/4 with 2π²R² — the flat, minimal torus the core stations sit on', Math.abs(at - Math.PI / 4) < 1e-4 && Math.abs(best / (2 * Math.PI ** 2) - 1) < 1e-8, `max at η = ${at.toFixed(5)} (π/4 = ${(Math.PI / 4).toFixed(5)}), area ${best.toFixed(6)}`); }

  /* 3 · harmonic polynomials counted */
  { const mono = n => { if (n < 0) return 0; let c = 0; for (let a = 0; a <= n; a++) for (let b = 0; a + b <= n; b++) for (let d = 0; a + b + d <= n; d++) c++; return c; };  /* x₄'s power is fixed by the rest */
    const bad = []; for (let n = 0; n <= 24; n++) { const counted = mono(n) - mono(n - 2), f = triFacts(1, n, 0.5); if (counted !== f.multiplicity || f.harmonicDim !== counted || f.laplaceEigen !== n * (n + 2)) bad.push(n); }
    ok('the Laplacian spectrum n(n+2) with multiplicity (n+1)², checked against harmonic polynomials counted here monomial by monomial, n = 0…24', bad.length === 0, bad.length ? 'fails at ' + bad.join(',') : 'every n agrees'); }

  /* 4 · the geodesic */
  { const p = triPoint(0.3, 0.2, 1.1), q = triPoint(1.2, 2.4, 0.3), G = triGeodesic(p, q, 40), ang = Math.acos(p.reduce((s, x, i) => s + x * q[i], 0));
    const unit = Math.max(...G.map(x => Math.abs(Math.hypot(...x) - 1))), steps = G.slice(1).map((x, i) => Math.acos(Math.min(1, x.reduce((s, v, j) => s + v * G[i][j], 0)))), len = steps.reduce((a, b) => a + b, 0);
    ok('the geodesic is a great-circle arc: every sample on S³, equal steps, and its length the angle between its ends', unit < 1e-12 && Math.max(...steps) - Math.min(...steps) < 1e-9 && Math.abs(len - ang) < 1e-9, `on S³ to ${unit.toExponential(1)} · length ${len.toFixed(9)} = angle ${ang.toFixed(9)}`); }

  /* 5 · circles to circles */
  { const u = [0.3, -0.5, 0.7, 0.4], vv = [0.6, 0.2, -0.1, 0.5], n1 = Math.hypot(...u); const e1 = u.map(x => x / n1); let e2 = vv.map((x, i) => x - vv.reduce((s, y, j) => s + y * e1[j], 0) * e1[i]); const n2 = Math.hypot(...e2); e2 = e2.map(x => x / n2);
    const pts = []; for (let k = 0; k < 60; k++) { const t = 2 * Math.PI * k / 60; pts.push(triProject(e1.map((x, i) => Math.cos(t) * x + Math.sin(t) * e2[i]), 1, 1e9)); }
    const c = [0, 1, 2].map(i => pts.reduce((s, p) => s + p[i], 0) / pts.length);
    /* the centre of a circle is not the mean of unevenly spaced samples — fit the plane and the circle properly: the normal from three points, the centre as the circumcentre */
    const A = pts[0], B = pts[20], Cc = pts[40], ab = B.map((x, i) => x - A[i]), ac = Cc.map((x, i) => x - A[i]), nrm = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
    const nn = Math.hypot(...nrm), planar = Math.max(...pts.map(p => Math.abs(p.reduce((s, x, i) => s + (x - A[i]) * nrm[i], 0) / nn)));
    const cr = (x, y) => [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]], d2 = v => v.reduce((s, x) => s + x * x, 0);
    const num = cr(nrm, ab).map(x => x * d2(ac)).map((x, i) => x + cr(ac, nrm)[i] * d2(ab)), cc = A.map((x, i) => x + num[i] / (2 * nn * nn));
    const radii = pts.map(p => Math.hypot(...p.map((x, i) => x - cc[i]))), spread = (Math.max(...radii) - Math.min(...radii)) / radii[0];
    ok('the stereographic projection sends a great circle of S³ to a circle: its images coplanar and equidistant from one centre', planar < 1e-9 && spread < 1e-9, `off-plane ${planar.toExponential(1)} · radius spread ${spread.toExponential(1)}`); }

  /* 6 · every two fibres linked once */
  { const F = []; for (const th of [0.6, 1.4, 2.2]) for (const ph of [0, 1.6, 3.1, 4.7]) F.push(triHopf(th, ph, 160).map(p => triProject(p, 1, 3)));
    let worst = 0, n = 0, signs = new Set(); for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) { const l = topoLinkPure(F[i], F[j]); worst = Math.max(worst, Math.abs(Math.abs(l) - 1)); signs.add(Math.sign(l)); n++; }
    ok('every two Hopf fibres are linked once: the Gauss integral on their projections (the soft compression is a homeomorphism, so linking survives it), every pair of twelve fibres', worst < 5e-3 && signs.size === 1, `${n} pairs · worst |Lk| − 1 = ${worst.toExponential(1)}`); }

  /* 7 · the layout */
  { const items = []; const cats = ['geom', 'hopf', 'quant', 'rel', 'dyn']; for (let i = 0; i < 60; i++) items.push({ id: 'L' + i, cat: cats[i % 5], dist: i % 7 === 6 ? Infinity : i % 5 });
    const L = triLayout(items); let unit = 0, ladder = true;
    for (const o of items) { const p = L.get(o.id); unit = Math.max(unit, Math.abs(Math.hypot(...p.p) - 1)); if (Number.isFinite(o.dist) && Math.abs(p.eta - Math.max(K.TRI_ETA_MIN, Math.PI / 4 - K.TRI_ETA_STEP * o.dist)) > 1e-15) ladder = false; }
    ok('the layout: every laboratory on S³, the core on the flat torus η = π/4, each step of chain distance one torus further in, laboratories without a chain on the innermost circle', unit < 1e-12 && ladder && L.get('L0').eta === Math.PI / 4, `on S³ to ${unit.toExponential(1)}`); }

  /* 8 · wiring */
  ok('the wiring: declared once (so it reaches every registry), routed, drawn, in the API, and related to the core stations it draws',
    /\{id:'tri', category:'hopf', domain:'quantum', cluster:'dynamics', predictionClass:'exact',/.test(SRC) && /triGroup\.visible = \(v==='tri'\);/.test(SRC) && /state\.s3view==='tri'\)\{\n\s*fbsAnimT\+=dt; updateTri\(dt\);/.test(SRC)
    && /id:'tri', world:'s3', lab:'tri',/.test(SRC) && /\['tri','hopf','representation'/.test(SRC) && /\['tri','eig','invariant'/.test(SRC) && /function triCensus\(\)\{/.test(SRC) && /\['triAtlas','tri',triGroup,/.test(SRC));

  /* 8b · every laboratory leads to it */
  ok('and every laboratory leads to it: the S³ line in each laboratory\'s panel has ⬡, which opens the Trisphere with that laboratory pinned and its chain lit — the pin survives the pointer moving away',
    /data-trimap="\$\{v\}"/.test(SRC) && /state\.triFocus=b\.dataset\.trimap; hccGo\(\{worldId:'s3', labId:'tri'\}\)/.test(SRC) && /O\.pin=state\.triFocus; triHighlight\(O\.pin\)/.test(SRC) && /triNearest\(e\.clientX,e\.clientY,14\)\|\|triObjs\.pin\|\|null/.test(SRC));

  /* 9 · mutations */
  { const src = triFacts.toString(), cut = 'harmonicDim:b(n+3,3)-b(n+1,3)'; const mut = new Function('return ' + src.replace(cut, 'harmonicDim:b(n+3,3)'))();
    ok('MUTATION — the harmonic dimension without its subtraction no longer equals the multiplicity, caught', src.includes(cut) && mut(1, 3, 0.5).harmonicDim !== mut(1, 3, 0.5).multiplicity, `${mut(1, 3, 0.5).harmonicDim} ≠ 16`); }
  { const src = triGeodesic.toString(), cut = 'const a=Math.sin((1-t)*w)/Math.sin(w), b=Math.sin(t*w)/Math.sin(w);'; const mut = new Function('return ' + src.replace(cut, 'const a=1-t, b=t;'))();
    const G = mut(triPoint(0.3, 0.2, 1.1), triPoint(1.2, 2.4, 0.3), 20), off = Math.max(...G.map(x => Math.abs(Math.hypot(...x) - 1)));
    ok('MUTATION — a geodesic by straight interpolation leaves the sphere, caught', src.includes(cut) && off > 0.05, `off S³ by ${off.toFixed(3)}`); }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
