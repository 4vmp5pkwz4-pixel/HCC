#!/usr/bin/env node
'use strict';
/* ══ THE CHIRAL LAW ══════════════════════════════════════════════════════════
 *
 * Four laboratories in this atlas were built on the curl spectrum before
 * anything here said why its two helicities behave differently. The Stokes
 * operator gives E_{k,+} and E_{k,−} the SAME eigenvalue κ_k, so something else
 * has to tell them apart, and this is what does:
 *
 *     2Q(K_τ, v) = ((k+2 − 2τσ)/(k+2)) [K_τ, v],      v ∈ E_{k,σ}.
 *
 * The two simple factors of the Killing algebra act on one signed shell with
 * DIFFERENT coefficients — k/(k+2) and (k+4)/(k+2) — and for k ≥ 1 they are
 * dynamically inequivalent.
 *
 * THE COEFFICIENTS ARE ARITHMETIC AND ARE NOT WHAT THIS FILE CHECKS. What it
 * checks is the two pointwise identities the theorem stands on, evaluated by
 * ambient differences on fields that are NOT Killing and do not know the theorem
 * exists:
 *
 *     ∇_u v + ∇_v u = grad⟨u,v⟩ − u×curl v − v×curl u,
 *     curl(u × v)   = −[u, v]        for divergence-free u, v,
 *
 * together with the closure statement curl[K,v] = μ[K,v] that keeps a Killing
 * bracket inside the shell it started in — which is what makes the whole thing
 * an algebra rather than a formula. From those, the coefficient follows by the
 * paper's two lines, and this file re-runs those two lines itself.
 *
 * AND THE STOKES OPERATOR IS THEIR QUADRATIC CASIMIR. A = −2𝒱Σ(T_a^τ)², so the
 * viscous dissipation is exactly 2ν𝒱 times a sum of six squared response norms.
 * That sum is measured here against κ_k/(2𝒱) at both helicities — both, because
 * the same-chirality bracket carries the sign of the frame its shell was built
 * in, and for six releases this atlas had that sign wrong at σ = −1 with nothing
 * looking at it.
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
const vel = vm.runInContext('s3nsVelocity', ctx);
const rel = (a, b) => Math.abs(a - b) / Math.max(1e-30, Math.abs(b));

/* ── this file's own differential geometry, sharing nothing with the page ──── */
const FR = { 1: [[[0,-1,0,0],[1,0,0,0],[0,0,0,-1],[0,0,1,0]],
                 [[0,0,-1,0],[0,0,0,1],[1,0,0,0],[0,-1,0,0]],
                 [[0,0,0,-1],[0,0,-1,0],[0,1,0,0],[1,0,0,0]]],
            '-1': [[[0,-1,0,0],[1,0,0,0],[0,0,0,1],[0,0,-1,0]],
                   [[0,0,-1,0],[0,0,0,-1],[1,0,0,0],[0,1,0,0]],
                   [[0,0,0,-1],[0,0,1,0],[0,-1,0,0],[1,0,0,0]]] };
const T = (s, a, q) => FR[s === 1 ? 1 : '-1'][a].map(r => r[0]*q[0] + r[1]*q[1] + r[2]*q[2] + r[3]*q[3]);
const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];
const EPS = (a, b, c) => ((a - b) * (b - c) * (c - a)) / 2;
const H = 1e-5;
const along = (q, d, e) => { const p = [0,1,2,3].map(i => Math.cos(e)*q[i] + Math.sin(e)*d[i]),
      n = Math.hypot(p[0],p[1],p[2],p[3]); return p.map(x => x/n); };
const triad = q => [0,1,2].map(a => T(1, a, q));
function myCross(u, v, q) { const t = triad(q), uc = t.map(e => dot(u, e)), vc = t.map(e => dot(v, e)),
      out = [0,0,0,0];
  for (let a = 0; a < 3; a++) { let c = 0;
    for (let b = 0; b < 3; b++) for (let d = 0; d < 3; d++) { const e = EPS(a,b,d); if (e) c += e*uc[b]*vc[d]; }
    for (let i = 0; i < 4; i++) out[i] += c * t[a][i]; }
  return out; }
function myGrads(F, q, h) { h = h || H; const t = triad(q), g = [];
  for (let b = 0; b < 3; b++) { const vp = F(along(q, t[b], h)), vm2 = F(along(q, t[b], -h));
    let d = [0,1,2,3].map(i => (vp[i] - vm2[i]) / (2*h));
    const n = dot(d, q); g.push(d.map((x, i) => x - n*q[i])); }
  return { t, g }; }
function myCurl(F, q, h) { const { t, g } = myGrads(F, q, h);
  const c = [0,1,2].map(a => { let s = 0;
    for (let b = 0; b < 3; b++) for (let d = 0; d < 3; d++) { const e = EPS(a,b,d); if (e) s += e*dot(g[b], t[d]); }
    return s; });
  const o = [0,0,0,0]; for (let a = 0; a < 3; a++) for (let i = 0; i < 4; i++) o[i] += c[a]*t[a][i];
  return o; }
function myCov(U, V, q, h) { h = h || H; const u = U(q), m = Math.hypot(u[0],u[1],u[2],u[3]);
  if (!(m > 1e-12)) return [0,0,0,0];
  const dir = u.map(x => x/m), vp = V(along(q, dir, h)), vm2 = V(along(q, dir, -h));
  let d = [0,1,2,3].map(i => m*(vp[i] - vm2[i])/(2*h));
  const n = dot(d, q); return d.map((x, i) => x - n*q[i]); }
const myBracket = (U, V, q, h) => { const a = myCov(U, V, q, h), b = myCov(V, U, q, h);
  return a.map((x, i) => x - b[i]); };
function myGrad(G, q) { const t = triad(q), o = [0,0,0,0];
  for (let b = 0; b < 3; b++) { const d = (G(along(q, t[b], H)) - G(along(q, t[b], -H))) / (2*H);
    for (let i = 0; i < 4; i++) o[i] += d * t[b][i]; }
  return o; }
const PTS = [[0.30,-0.50,0.62,0.40], [0.10,0.70,-0.30,0.63], [-0.44,0.20,0.50,0.71]]
  .map(q => { const n = Math.hypot(q[0],q[1],q[2],q[3]); return q.map(x => x/n); });
const field = (k, sg, seed) => { const sh = S(`s3nsShell(${k},${sg})`), c = S(`s3nsShellElement(s3nsShell(${k},${sg}),${seed})`);
  return { F: q => vel(sh, c, q, [0,0,0,0]), mu: sg * (k + 2) }; };

console.log('\n=== 1. THE TWO POINTWISE IDENTITIES THE LAW STANDS ON ===\n');

let polar = 0, cross = 0;
for (const [k1, s1, k2, s2] of [[1,1,2,1], [1,1,1,-1], [2,-1,3,1], [0,1,2,-1]]) {
  const A = field(k1, s1, 777), B = field(k2, s2, 888);
  for (const q of PTS) {
    const lhs = myCov(A.F, B.F, q).map((x, i) => x + myCov(B.F, A.F, q)[i]);
    const g = myGrad(p => dot(A.F(p), B.F(p)), q);
    const x1 = myCross(A.F(q), B.F(q), q), x2 = myCross(B.F(q), A.F(q), q);
    const rhs = [0,1,2,3].map(i => g[i] - B.mu*x1[i] - A.mu*x2[i]);
    const sc = Math.hypot(...lhs) + Math.hypot(...rhs) + 1e-12;
    for (let i = 0; i < 4; i++) polar = Math.max(polar, Math.abs(lhs[i] - rhs[i]) / sc);
    const cc = myCurl(p => myCross(A.F(p), B.F(p), p), q), br = myBracket(A.F, B.F, q);
    const sc2 = Math.hypot(...cc) + Math.hypot(...br) + 1e-12;
    for (let i = 0; i < 4; i++) cross = Math.max(cross, Math.abs(cc[i] + br[i]) / sc2); } }
ok('THE POLARIZED VECTOR IDENTITY CLOSES — ∇_u v + ∇_v u = grad⟨u,v⟩ − u×curl v − v×curl u — on pairs of shell fields of different index and different sign, neither of which is Killing and neither of which was built to satisfy it',
  polar < 1e-8, `worst relative residual ${polar.toExponential(2)} over four pairs at three points each`);
ok('and curl(u × v) = −[u,v] for divergence-free u and v, which is the second line of the proof and the one that turns a cross product into a Lie bracket',
  cross < 1e-8, `worst relative residual ${cross.toExponential(2)}`);

console.log('\n=== 2. THE BRACKET CANNOT LEAVE THE SHELL ===\n');

let stays = 0;
for (const k of [1, 2, 3]) for (const sg of [1, -1]) {
  const A = field(k, sg, 4242), mu = sg * (k + 2);
  for (const tau of [1, -1]) { const K = p => T(tau, 0, p);
    for (const q of PTS) {
      /* a nested difference: the step has to suit the OUTER one, not the inner */
      const br = myBracket(K, A.F, q, 2e-4), cb = myCurl(p => myBracket(K, A.F, p, 2e-4), q, 2e-4);
      const sc = Math.hypot(...br) + 1e-12;
      for (let i = 0; i < 4; i++) stays = Math.max(stays, Math.abs(cb[i] - mu*br[i]) / sc); } } }
ok('A KILLING BRACKET STAYS IN ITS SHELL — curl[K,v] = μ[K,v] at both chiralities, both signs and three indices — which is what makes the intertwining an ALGEBRA and not merely a formula about one pair of fields',
  stays < 1e-5,
  `worst relative residual ${stays.toExponential(2)} over 36 (k, σ, τ, point) combinations · a nested difference, so its floor is the nested one`);

console.log('\n=== 3. AND THE COEFFICIENT THAT FOLLOWS FROM THEM ===\n');

/* the paper's two lines, re-run here: 2Q = (α−β)P(K×v) and P(K×v) = −[K,v]/β */
const bad = [];
for (const k of [0, 1, 2, 3, 4, 5]) for (const sg of [1, -1]) for (const tau of [1, -1]) {
  const alpha = 2*tau, beta = sg*(k + 2), derived = (beta - alpha)/beta;
  const want = (k + 2 - 2*tau*sg)/(k + 2);
  if (Math.abs(derived - want) > 1e-14) bad.push(`derivation k=${k}`);
  if (rel(S(`s3nsChiralCoefficient(${k},${sg},${tau})`), want) > 1e-14) bad.push(`page k=${k} σ=${sg} τ=${tau}`); }
ok('2Q(K_τ,v) = ((k+2 − 2τσ)/(k+2))[K_τ,v] FOLLOWS FROM THOSE TWO LINES and is what the page publishes — (β−α)/β with α = 2τ/R and β = σ(k+2)/R, rebuilt here rather than copied',
  bad.length === 0,
  bad.length ? [...new Set(bad)].slice(0, 4).join(' · ')
    : [1,2,3].map(k => `k=${k}: same ${(k/(k+2)).toFixed(6)}, opposite ${((k+4)/(k+2)).toFixed(6)}`).join(' · '));
ok('and the two chiralities are DYNAMICALLY INEQUIVALENT for every k ≥ 1, by the factor (k+4)/k — five to one at k = 1 — while at k = 0 one of them vanishes outright, because the Killing algebra acts on itself',
  [1,2,3,4,5].every(k => Math.abs(S(`s3nsChiralCoefficient(${k},1,-1)`) / S(`s3nsChiralCoefficient(${k},1,1)`) - (k+4)/k) < 1e-12)
  && S('s3nsChiralCoefficient(0,1,1)') === 0 && S('s3nsChiralCoefficient(0,1,-1)') === 2,
  `ratios ${[1,2,3,4,5].map(k => `k=${k}: ${((k+4)/k).toFixed(3)}×`).join(', ')} · and 0 against 2 at k = 0`);

console.log('\n=== 4. THE STOKES OPERATOR IS THEIR QUADRATIC CASIMIR ===\n');

const V1 = 2 * Math.PI * Math.PI;
const cas = [];
for (const k of [1, 2, 3, 4]) for (const sg of [1, -1]) {
  const six = S(`s3nsSixResponses(${k},${sg})`);
  cas.push({ k, sg, total: six.total, want: k*(k+4)/(2*V1), n: six.responses.length }); }
const offCas = cas.filter(c => rel(c.total, c.want) > 1e-10 || c.n !== 6);
ok('THE SIX CONVECTIVE RESPONSES SUM TO κ_k/(2𝒱) — so A = −2𝒱Σ(T_a^τ)² and the viscous dissipation 2ν‖Def u‖² is exactly 2ν𝒱 times a sum of six squared norms, measured at BOTH helicities',
  offCas.length === 0 && cas.length === 8,
  offCas.length ? offCas.map(c => `k=${c.k} σ=${c.sg}: ${c.total.toExponential(9)} vs ${c.want.toExponential(9)}`).join(' · ')
    : cas.filter(c => c.sg > 0).map(c => `k=${c.k}: ${c.total.toExponential(9)} = κ/(2𝒱)`).join(' · ') + ' — and identical at σ = −1');
/* THE SUM ALONE CANNOT SEE THE BARS. Squaring the chirality coefficient or not
   gives the SAME total — c_s²(k+2)(k+4) + c_o²k(k+2) and c_s(k+2)(k+4) +
   c_o k(k+2) are both 2k(k+4), a coincidence of this algebra — so a check on the
   sum passes while every one of the six drawn bars is wrong. What separates them
   is the RATIO of the two chirality triples, which is (k+4)/k with the squares
   and exactly one without. */
{ const ratios = [], off = [];
  for (const k of [1, 2, 3, 4]) for (const sg of [1, -1]) {
    const six = S(`s3nsSixResponses(${k},${sg})`);
    const same = six.responses.filter(r => r.tau === sg), opp = six.responses.filter(r => r.tau !== sg);
    if (same.length !== 3 || opp.length !== 3) { off.push(`k=${k} split`); continue; }
    /* within a chirality the three generators are equivalent, so the three bars agree */
    for (const grp of [same, opp]) for (const r of grp)
      if (rel(r.value, grp[0].value) > 1e-9) off.push(`k=${k} σ=${sg} uneven triple`);
    const ratio = opp[0].value / same[0].value;
    if (rel(ratio, (k + 4) / k) > 1e-9) off.push(`k=${k} σ=${sg} ratio ${ratio.toFixed(6)}`);
    if (sg > 0) ratios.push(`k=${k}: ${ratio.toFixed(4)}`); }
  ok('AND THE SIX BARS ARE THREE AND THREE, with the opposite-chirality triple exactly (k+4)/k times the same-chirality one — the same factor the two carriers turn by, and the thing the SUM cannot see, because squaring the coefficient or not leaves that sum unchanged',
    off.length === 0,
    off.length ? [...new Set(off)].slice(0, 4).join(' · ')
      : ratios.join(' · ') + ' — each triple internally equal, the two triples apart by (k+4)/k'); }

/* AND THE PAGE'S OWN AUDIT HAS TO AGREE WITH THIS FILE. Everything above is
   computed by this file's differential geometry; the laboratory has its own, and
   a reader sees the laboratory's numbers. */
{ const a1 = S('s3nsKBAudit(2,1)'), a2 = S('s3nsKBAudit(2,-1)');
  ok('and the LABORATORY`S OWN audit — its cross product, its covariant derivative, its bracket — returns the same three residuals at both helicities, so what the reader is shown is what this file measured and not a second implementation nobody compared',
    a1.polarized < 1e-8 && a1.curlCross < 1e-8 && a1.bracketStaysInShell < 1e-5
    && a2.polarized < 1e-8 && a2.curlCross < 1e-8 && a2.bracketStaysInShell < 1e-5
    && rel(a1.same, 0.5) < 1e-12 && rel(a1.opposite, 1.5) < 1e-12,
    `σ = +1: polarized ${a1.polarized.toExponential(1)}, curl×cross ${a1.curlCross.toExponential(1)}, closure ${a1.bracketStaysInShell.toExponential(1)}`
    + ` · σ = −1: ${a2.polarized.toExponential(1)}, ${a2.curlCross.toExponential(1)}, ${a2.bracketStaysInShell.toExponential(1)}`); }

/* THE SIGN THAT WAS WRONG FOR SIX RELEASES. The same-chirality bracket's cross
   term carries the structure constants of the frame the shell was built in, and
   nothing checked σ = −1 until this file did. */
const split = [];
for (const k of [1, 2, 3, 4]) { const a = cas.find(c => c.k === k && c.sg > 0), b = cas.find(c => c.k === k && c.sg < 0);
  if (rel(a.total, b.total) > 1e-12) split.push(`k=${k}`); }
ok('AND THE TWO HELICITIES GIVE THE SAME SUM, which is where a frame-sign error hides: the same-chirality bracket carries the structure constants of the frame its shell was built in, and a construction right on one side and wrong on the other passes every check that only looks at one',
  split.length === 0,
  split.length ? 'differ at ' + split.join(' · ') : 'the six-response sum agrees between σ = +1 and σ = −1 at every k tested');
ok('and the isometry Casimir is exactly twice the curl squared, so A = ½Δ_iso − 4/R² — the Stokes operator and the isometry Casimir are one operator apart by one constant',
  [1, 2.5].every(R => [0,1,2,3,5].every(k =>
    Math.abs(S(`s3nsIsoCasimir(${k},${R})`) - 2*Math.pow(k+2,2)/(R*R)) < 1e-12
    && Math.abs(0.5*S(`s3nsIsoCasimir(${k},${R})`) - 4/(R*R) - S(`s3nsKappa(${k},${R})`)) < 1e-12)),
  'Δ_iso = 2(k+2)²/R² and ½Δ_iso − 4/R² = κ_k at every shell and both radii');

console.log('\n=== 5. WHAT THE REDUCTIONS ARE NOT ===\n');

/* THE CORRECTION THIS PAPER MAKES TO WHAT THE ATLAS ALREADY SHOWED. Four named
   reductions read as four reductions; the truth is that every linear subspace of
   a shell is exact, so they come in continuous families. */
const gr = [];
for (const k of [2, 3, 4]) for (const d of [1, 2, 3, 8]) { const dk = (k+1)*(k+3);
  if (d > dk) continue;
  const got = S(`s3nsGrassmannDim(${d},${k})`);
  if (got !== d*(dk - d)) gr.push(`k=${k} d=${d}`); }
ok('EVERY LINEAR SUBSPACE OF A SHELL IS ITSELF AN EXACT REDUCING SPACE, so the d-dimensional exact reductions form a whole Grassmannian of dimension d(d_k − d) — continuous families, and therefore NO finite list of named isometry types can exhaust the exact reductions of dimension eight or less',
  gr.length === 0 && S('s3nsGrassmannDim(8,2)') === 56 && S('s3nsGrassmannDim(0,2)') === 0
  && S('s3nsGrassmannDim(15,2)') === 0 && S('s3nsGrassmannDim(16,2)') === null,
  `dim Gr(8, E_{2,σ}) = 8·(15−8) = 56 · the full shell and the zero space are the two single points · a dimension above the shell is refused rather than answered`);
ok('and the laboratory says so where a reader will meet it, beside the four named reductions this atlas already draws',
  /THE EXACT REDUCTIONS ARE NOT A FINITE LIST/.test(src)
  && /AND THE REDUCTIONS ARE NOT A LIST: every linear subspace of E_/.test(src)
  && /continuous families, not four named types/.test(src),
  'the refusal is in the instrument contract and the measured Grassmannian dimension is in the reader`s own panel');
ok('and the six-response identity is marked as the global L² statement it is, with the only thing that follows from it written out',
  /THE SIX-RESPONSE IDENTITY IS A GLOBAL L2 STATEMENT AND NOTHING MORE/.test(src)
  && /at least one of the six global response norms becomes unbounded along a subsequence/.test(src),
  'no microlocal anisotropy, no preferred axis, no spatial polarization is claimed from it');

console.log('\n=== 6. THE LABORATORY IN THE PAGE ===\n');

ok('the laboratory is wired as a laboratory — a camera, a router branch, a scene and a lazy build',
  /s3kbGroup\.visible = \(v==='s3kb'\);/.test(src)
  && /state\.s3view==='s3kb'/.test(src)
  && /v==='s3kb'\?\[0,\.35,12\.6\]:/.test(src)
  && /if\(v==='s3kb'&&!s3kbObjs\)\{ s3kbSetup\(\); \}/.test(src),
  'visibility, router, camera preset and lazy build are all present');
ok('AND THE ASYMMETRY IS DRAWN RATHER THAN STATED — two copies of one field, each carried by one chirality, on the side of the quaternion product that chirality generates, at that chirality`s own rate',
  /const rates=\[s3nsChiralCoefficient\(k,sg,sg\), s3nsChiralCoefficient\(k,sg,-sg\)\];/.test(src)
  && /const sideLeft=\(ci===0\)\?\(sg>0\):\(sg<0\);/.test(src)
  && /sideLeft\?s3nsQMul\(rot,qa\):s3nsQMul\(qa,rot\)/.test(src),
  'a chirality-τ Killing field translates on one side only, and the two copies turn at k/(k+2) and (k+4)/(k+2)');

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
