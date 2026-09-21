#!/usr/bin/env node
'use strict';
/* ══ WHERE THE CURVATURE ENTERS ══════════════════════════════════════════════
 *
 * A calculation on a curved manifold usually arrives as a list of correction
 * terms with nothing to say about which of them matter. This chart answers that
 * exactly, and the answer rests on one identity: around any great circle of S³_R
 * the round metric is
 *
 *     dr²/a + r²dθ² + a dz²,     a(r) = 1 − r²/R²,
 *
 * whose DETERMINANT is exactly r², with no R in it at all. That is stronger than
 * a normal-coordinate expansion g = δ + O(|x|²/R²), and it is the reason the
 * incompressibility half of the problem transfers unchanged: the divergence in
 * these density components IS the Euclidean cylindrical divergence, so curvature
 * is confined to the momentum residual.
 *
 * THIS FILE DOES NOT READ THE METRIC OUT OF THE PAGE. It differences the
 * EMBEDDING — four ambient coordinates as functions of (r, θ, z) — and forms the
 * pullback itself, so the coefficients, the vanishing off-diagonals and the
 * determinant are all measured. It then computes one declared field's divergence
 * twice, by two rules that share no line of code, and compares.
 *
 * AND THE LAST CHECK IS THE ONE THE SOURCE PAPER TURNS ON. For a pure swirl the
 * radial acceleration is cancelled by the same p_r = w²/r as in flat space, so
 * the whole curvature lands in the viscous operator as R⁻²P(𝔈) with
 * P(x) = −(x−1)(x+3). At the source construction's terminal Euler exponent
 * −2A = −1−2h that polynomial takes the value 4(1−h²), which is never zero for
 * an admissible h — so the spherical exterior carries a leading-order defect of
 * its own and cannot be handed to the annular waves.
 */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

const i0 = src.indexOf('const S3NS_MONO=new Map();'), i1 = src.indexOf('/* ── S³ curl-shell laboratory ──');
if (i0 < 0 || i1 < 0) { console.log('  FAIL — the S3NS block could not be sliced out of index.html'); process.exit(1); }
const ctx = vm.createContext({ Math, Object, Map, Set, Array, Number, Float64Array, console, JSON });
vm.runInContext('function mulberry(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0;'
  + ' let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t;'
  + ' return ((t^t>>>14)>>>0)/4294967296; }; }\n' + src.slice(i0, i1), ctx, { timeout: 60000 });
const S = k => vm.runInContext(k, ctx);
const rel = (a, b) => Math.abs(a - b) / Math.max(1e-30, Math.abs(b));

console.log('\n=== 1. THE METRIC IS DIFFERENCED OUT OF THE EMBEDDING, NOT READ OUT OF THE PAGE ===\n');

const E = 1e-6;
const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];
const det3 = m => m[0][0]*(m[1][1]*m[2][2] - m[1][2]*m[2][1])
                - m[0][1]*(m[1][0]*m[2][2] - m[1][2]*m[2][0])
                + m[0][2]*(m[1][0]*m[2][1] - m[1][1]*m[2][0]);
function pullback(r, th, z, R) {
  const B = [0,1,2].map(i => { const p = [r,th,z], q = [r,th,z]; p[i] += E; q[i] -= E;
    const A = S(`s3nsTubeEmbed(${p[0]},${p[1]},${p[2]},${R})`), C = S(`s3nsTubeEmbed(${q[0]},${q[1]},${q[2]},${R})`);
    return [0,1,2,3].map(k => (A[k] - C[k]) / (2 * E)); });
  return [0,1,2].map(i => [0,1,2].map(j => dot(B[i], B[j]))); }

let detW = 0, offW = 0, coefW = 0; const rows = [];
for (const R of [0.9, 1.7, 4.2]) for (const [fr, th, z] of [[0.24, 0.6, 1.1], [0.62, 2.3, -0.7], [0.91, 0.1, 0.3]]) {
  const r = fr * R, g = pullback(r, th, z, R), a = 1 - r*r/(R*R);
  detW = Math.max(detW, rel(det3(g), r * r));
  offW = Math.max(offW, Math.abs(g[0][1]), Math.abs(g[0][2]), Math.abs(g[1][2]));
  coefW = Math.max(coefW, rel(g[0][0], 1/a), rel(g[1][1], r*r), rel(g[2][2], a));
  if (fr === 0.62) rows.push(`R=${R}: det ${det3(g).toFixed(8)} vs r²=${(r*r).toFixed(8)}`); }
ok('THE DETERMINANT OF THE ROUND METRIC IN THESE COORDINATES IS EXACTLY r², AT EVERY RADIUS AND EVERY CURVATURE RADIUS — the one identity the whole transfer rests on, and R does not appear in it',
  detW < 1e-8, `worst relative deviation ${detW.toExponential(2)} over 9 (R, point) pairs · ${rows.join(' · ')}`);
ok('and the chart is orthogonal, with the three coefficients 1/a, r² and a — measured, so a wrong embedding cannot pass by being called the right one',
  offW < 1e-8 && coefW < 1e-7,
  `off-diagonal entries below ${offW.toExponential(2)}, coefficients within ${coefW.toExponential(2)} of 1/a, r², a`);
ok('and the page`s own metric table agrees with what the embedding produced, at both ends',
  [0.9, 1.7, 4.2].every(R => { const M = S(`s3nsTubeMetric(${0.5 * R},${R})`);
    return Math.abs(M.det - 0.25*R*R) < 1e-12 && Math.abs(M.volumeElement - 0.5*R) < 1e-12
        && Math.abs(M.gthth - 0.25*R*R) < 1e-12 && Math.abs(M.gzz - 0.75) < 1e-12; }),
  'det g = r², dV = r dr dθ dz, g_θθ = r², g_zz = a — all three radii');

console.log('\n=== 2. ONE FIELD, TWO DIVERGENCE RULES, AND THEY ARE THE SAME RULE ===\n');

const VR = (r, th, z) => 0.30 * Math.sin(1.1*z) * Math.cos(th) + 0.21 * r;
const VT = (r, th, z) => 0.44 * Math.cos(0.7*z) + 0.17 * r * Math.sin(th);
const VZ = (r, th, z) => 0.26 * Math.sin(th) + 0.33 * r * Math.cos(0.9*z);
const hh = 1e-5;
let divW = 0, divScale = 0;
for (const R of [0.9, 1.7, 4.2]) for (const [fr, th, z] of [[0.24, 0.6, 1.1], [0.62, 2.3, -0.7]]) {
  const r = fr * R;
  /* the curved rule: (1/√|g|) ∂_i(√|g| u^i) with √|g| = r, on contravariant components */
  const curved = (() => { const f = i => { const p = [r,th,z], q = [r,th,z]; p[i] += hh; q[i] -= hh;
      const up = i === 1 ? VT(p[0],p[1],p[2]) / p[0] : [VR,VT,VZ][i](p[0],p[1],p[2]);
      const uq = i === 1 ? VT(q[0],q[1],q[2]) / q[0] : [VR,VT,VZ][i](q[0],q[1],q[2]);
      return (up * p[0] - uq * q[0]) / (2 * hh); };
    return (f(0) + f(1) + f(2)) / r; })();
  /* the flat cylindrical rule, on the density components, with no metric in it */
  const flat = (() => { const f = (g, i) => { const p = [r,th,z], q = [r,th,z]; p[i] += hh; q[i] -= hh;
      return (g(p[0],p[1],p[2]) - g(q[0],q[1],q[2])) / (2 * hh); };
    return f(VR, 0) + VR(r,th,z)/r + f(VT, 1)/r + f(VZ, 2); })();
  divW = Math.max(divW, Math.abs(curved - flat)); divScale = Math.max(divScale, Math.abs(curved)); }
ok('THE CURVED DIVERGENCE AND THE EUCLIDEAN CYLINDRICAL ONE AGREE on a field neither was written for — which is what confines every curvature term to the MOMENTUM residual, and it is the reason the source`s Euclidean vector potentials and pulse cutoffs transfer without a repair',
  divW < 1e-9 && divScale > 0.1,
  `worst difference ${divW.toExponential(2)} on divergences of size ~${divScale.toFixed(3)}, over 6 (R, point) pairs`);
/* AND THE PANEL'S OWN YARDSTICK HAS TO BE A YARDSTICK. A residual normalised by a
   quantity that is exactly zero somewhere reports the one case the operator gets
   exactly right — the Killing exponent λ = 1 — as its worst, so the page uses the
   same 1 + |want| the checks above use and this clause holds it to it. */
{ const A = S('s3nsTubeAudit(1.7,0.005)');
  ok('and the page reports the same transfer AND the same tower residual from its own audit, so what the reader sees on screen is what this file measured rather than a differently normalised number that happens to sit nearby',
    A.divergence < 1e-9 && A.towers < 1e-7 && A.det < 1e-8 && A.killingTheta < 1e-7,
    `the laboratory publishes divergence ${A.divergence.toExponential(2)}, towers ${A.towers.toExponential(2)}, determinant ${A.det.toExponential(2)}, Killing ${A.killingTheta.toExponential(2)}`); }

console.log('\n=== 3. THE CURVATURE OF A PURE SWIRL IS ONE POLYNOMIAL IN THE EULER OPERATOR ===\n');

let towW = 0;
for (const R of [1.1, 2.6]) for (const lam of [1, 2, 3, 5, 0.5]) for (const fr of [0.35, 0.7]) {
  const r = fr * R, f = `(x=>Math.pow(x,${lam}))`;
  const gotT = S(`s3nsSwirlOp(${f},${r},${R})`), gotZ = S(`s3nsAxialOp(${f},${r},${R})`);
  /* this file's own closed forms, from the paper's monomial identities */
  const wantT = (lam*lam - 1) * Math.pow(r, lam - 2) - (lam - 1) * (lam + 3) / (R*R) * Math.pow(r, lam);
  const wantZ = lam*lam * Math.pow(r, lam - 2) - lam * (lam + 4) / (R*R) * Math.pow(r, lam);
  towW = Math.max(towW, Math.abs(gotT - wantT) / (1 + Math.abs(wantT)), Math.abs(gotZ - wantZ) / (1 + Math.abs(wantZ))); }
ok('BOTH EULER TOWERS ARE INVARIANT and land on their closed forms — ℒ_θ r^λ = (λ²−1)r^{λ−2} − (λ−1)(λ+3)R⁻²r^λ and ℒ_z r^λ = λ²r^{λ−2} − λ(λ+4)R⁻²r^λ — which is what makes the spans {1, s, …, s^m} finite-dimensional invariant subspaces of the round Stokes algebra',
  towW < 1e-7, `worst residual ${towW.toExponential(2)} over 20 (R, λ, r) triples, at the second-difference step the laboratory chose`);
/* the page publishes those two closed forms as instrument outputs, so a wrong one
   there would tell a caller a false thing about an operator that is right */
{ let pubW = 0;
  for (const R of [1.1, 2.6]) for (const lam of [1, 2, 3, 5, 0.5]) for (const fr of [0.35, 0.7]) {
    const r = fr * R;
    pubW = Math.max(pubW,
      Math.abs(S(`s3nsEulerTheta(${lam},${r},${R})`) - S(`s3nsSwirlOp((x=>Math.pow(x,${lam})),${r},${R})`))
        / (1 + Math.abs(S(`s3nsEulerTheta(${lam},${r},${R})`))),
      Math.abs(S(`s3nsEulerZ(${lam},${r},${R})`) - S(`s3nsAxialOp((x=>Math.pow(x,${lam})),${r},${R})`))
        / (1 + Math.abs(S(`s3nsEulerZ(${lam},${r},${R})`)))); }
  ok('and the CLOSED FORMS the instrument publishes are the same two functions its own differenced operators return — a tower written down wrongly beside an operator written down rightly would mislead every caller that never differenced anything',
    pubW < 1e-7, `worst disagreement ${pubW.toExponential(2)} between the published closed forms and the operators, over 20 triples`); }

ok('and ℒ_R^θ ANNIHILATES r, because r is the Killing field ∂_θ — a geometric check that a wrong sign anywhere in the operator would break',
  Math.abs(S('s3nsSwirlOp((x=>x),0.9,1.7)')) < 1e-7 && Math.abs(S('s3nsAxialOp((()=>1),0.9,1.7)')) < 1e-12,
  `ℒ_R^θ(r) = ${S('s3nsSwirlOp((x=>x),0.9,1.7)').toExponential(2)} · ℒ_z(1) = ${S('s3nsAxialOp((()=>1),0.9,1.7)').toExponential(2)}`);
ok('and the curvature part of the swirl operator IS the polynomial R⁻²P(𝔈) with P(x) = −(x−1)(x+3) — measured as the difference between the exact operator and the flat one, on monomials where 𝔈 acts as λ',
  [1.5, 3.4].every(R => [0.5, 2, 3, 5].every(lam => [0.3, 0.8].every(fr => { const r = fr * R,
      diff = S(`s3nsSwirlOp((x=>Math.pow(x,${lam})),${r},${R})`) - S(`s3nsSwirlFlat((x=>Math.pow(x,${lam})),${r})`),
      want = -(lam - 1) * (lam + 3) / (R*R) * Math.pow(r, lam);
    return Math.abs(diff - want) / (1 + Math.abs(want)) < 1e-6; }))),
  'ℒ_R^θ − ℒ₀^θ = R⁻²P(𝔈) on every monomial tested, at two curvature radii');

console.log('\n=== 4. THE EXTERIOR CANNOT BE LEFT TO THE WAVES ===\n');

const hs = [0.0005, 0.005, 0.0099];
ok('AT THE SOURCE CONSTRUCTION`S TERMINAL EULER EXPONENT −2A = −1−2h THE POLYNOMIAL IS 4(1−h²), WHICH IS NEVER ZERO for an admissible h — so the Euclidean exterior heat field, which solves the FLAT swirl equation, carries a leading-order spherical defect of its own',
  hs.every(h => { const A = 0.5 + h, P = x => -(x - 1) * (x + 3);
    return Math.abs(S(`s3nsPExt(${-2 * A})`) - P(-2 * A)) < 1e-12
        && Math.abs(S(`s3nsExteriorObstruction(${h})`) - 4 * (1 - h*h)) < 1e-12
        && S(`s3nsExteriorObstruction(${h})`) > 3.99; }),
  hs.map(h => `h=${h}: −2A=${(-1 - 2*h).toFixed(4)}, P=${(4*(1 - h*h)).toFixed(8)}`).join(' · '));
ok('and the inner core has its own obstruction, which DIVERGES as the similarity parameter goes to zero — the leading radial balance cancels E² and leaves U², so a nonzero axial core makes the defect unbounded rather than small',
  (() => { const a = S('s3nsInnerObstruction(0.7,0.9,1e-2,0.005,1.7)'), b = S('s3nsInnerObstruction(0.7,0.9,1e-4,0.005,1.7)');
    return b > a * 9 && S('s3nsInnerObstruction(0.7,0,1e-4,0.005,1.7)') === 0; })(),
  `q = 1e-2 gives ${S('s3nsInnerObstruction(0.7,0.9,1e-2,0.005,1.7)').toExponential(3)}, q = 1e-4 gives ${S('s3nsInnerObstruction(0.7,0.9,1e-4,0.005,1.7)').toExponential(3)} — and it is exactly zero where the axial core is`);

console.log('\n=== 5. WHAT IS IN THE PAGE, AND WHAT IT REFUSES ===\n');

ok('the laboratory is wired as a laboratory — a camera, a router branch, a scene and a lazy build',
  /s3tubeGroup\.visible = \(v==='s3tube'\);/.test(src)
  && /state\.s3view==='s3tube'/.test(src)
  && /v==='s3tube'\?\[0,-\.4,13\.0\]:/.test(src)
  && /if\(v==='s3tube'&&!s3tubeObjs\)\{ s3tubeSetup\(\); \}/.test(src),
  'visibility, router, camera preset and lazy build are all present');
ok('and the three things this chart does NOT do are written down: where the chart ends, that the obstructions are about a TRANSPLANTED profile rather than a spherical solution, and that the large-R expansion is not the operator',
  /THE CHART ENDS AT r = R/.test(src)
  && /THE INNER AND EXTERIOR OBSTRUCTIONS ARE STATEMENTS ABOUT A TRANSPLANTED PROFILE/.test(src)
  && /THE VISCOUS EXPANSION IS NOT THE OPERATOR/.test(src),
  'three refusals, each naming what it refuses');
ok('and a radius outside the chart is HELD inside it and SAID to have been held, rather than answered from a singular chart',
  /name:'radius_held_inside_chart'/.test(src) && /name:'radius_used'/.test(src)
  && /radius_held_inside_chart:\(rAsked!==r\)/.test(src),
  'the instrument publishes both the radius it used and whether it had to move one');

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
