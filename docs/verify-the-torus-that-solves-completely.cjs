#!/usr/bin/env node
'use strict';
/* ══ THE TORUS THAT SOLVES COMPLETELY ════════════════════════════════════════
 *
 * The Clifford torus has been in this atlas for a long time as a Willmore
 * minimiser — a surface that answers a question about bending energy. It is also
 * a maximal torus of the isometry group, and that is the one symmetry under
 * which the Navier–Stokes equation on S³ does not merely simplify but SOLVES:
 * the invariant fields are exactly α(s)∂_θ + β(s)∂_z, the whole convective term
 * is a gradient, and what is left is two independent scalar heat equations in
 * two Jacobi bases.
 *
 * AND THE SECTOR IS NOT A SEPARATE WORLD. e_n^θ ± R e_n^z is a curl eigenfield
 * with μ = 2(n+1)/R, which is (k+2)/R at k = 2n — so the Jacobi level IS the
 * shell index, and the two laboratories of this world are two readings of one
 * spectrum. This file checks that, at both ends, through routes that share
 * nothing:
 *
 *   · the two Jacobi DERIVATIVE identities, as scalar finite differences that
 *     never touch a curl or a vector field at all;
 *   · the curl component formulas of the reduction, against an ambient
 *     difference of the field itself;
 *   · the pressure identity, with ∇_u u and grad p each differenced here;
 *   · the Killing cone, by measuring Def u rather than by citing that constant
 *     coefficients give a Killing field;
 *   · and the shell index, read out of the OTHER laboratory's curl level.
 *
 * A residual is published rather than a verdict, because an identity that
 * cannot fail is not an identity. The numbers are the step's size and not a
 * permitted error: at a step of 1e-5 they come back near 1e-9 and they grow
 * the moment any of the algebra above is wrong.
 */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

const OPEN = 'const S3NS_MONO=new Map();';
const CLOSE = '/* ── S³ curl-shell laboratory ──';
const i0 = src.indexOf(OPEN), i1 = src.indexOf(CLOSE);
if (i0 < 0 || i1 < 0 || i1 <= i0) { console.log('  FAIL — the S3NS block could not be sliced out of index.html'); process.exit(1); }
const ctx = vm.createContext({ Math, Object, Map, Set, Array, Number, Float64Array, console, JSON });
vm.runInContext('function mulberry(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0;'
  + ' let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t;'
  + ' return ((t^t>>>14)>>>0)/4294967296; }; }\n' + src.slice(i0, i1), ctx, { timeout: 60000 });
const S = k => vm.runInContext(k, ctx);

/* ── this file's own arithmetic, sharing nothing with the page ─────────────── */
const Jth = (n, s) => S(`s3nsJacobi(${n},1,0,${1 - 2 * s})`);
const Jz  = (n, s) => S(`s3nsJacobi(${n},0,1,${1 - 2 * s})`);
const pt  = (s, th, ze) => [Math.sqrt(1 - s) * Math.cos(ze), Math.sqrt(1 - s) * Math.sin(ze),
                            Math.sqrt(s) * Math.cos(th), Math.sqrt(s) * Math.sin(th)];
const FR = [[[0,-1,0,0],[1,0,0,0],[0,0,0,-1],[0,0,1,0]],
            [[0,0,-1,0],[0,0,0,1],[1,0,0,0],[0,-1,0,0]],
            [[0,0,0,-1],[0,0,-1,0],[0,1,0,0],[1,0,0,0]]];
const Y = (a, q) => FR[a].map(r => r[0]*q[0] + r[1]*q[1] + r[2]*q[2] + r[3]*q[3]);
const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];
const EPS = (a, b, c) => ((a - b) * (b - c) * (c - a)) / 2;
const H = 1e-5;
const along = (q, d, e) => { const p = [0,1,2,3].map(i => Math.cos(e)*q[i] + Math.sin(e)*d[i]),
      n = Math.hypot(p[0],p[1],p[2],p[3]); return [p[0]/n,p[1]/n,p[2]/n,p[3]/n]; };
function grads(F, q) { const T = [0,1,2].map(a => Y(a, q)), g = [];
  for (let b = 0; b < 3; b++) { const vp = F(along(q, T[b], H)), vm = F(along(q, T[b], -H));
    let d = [0,1,2,3].map(i => (vp[i] - vm[i]) / (2 * H));
    const n = dot(d, q); g.push(d.map((x, i) => x - n * q[i])); }
  return { T, g }; }
function myCurl(F, q) { const { T, g } = grads(F, q);
  const c = [0,1,2].map(a => { let t = 0;
    for (let b = 0; b < 3; b++) for (let d = 0; d < 3; d++) { const e = EPS(a,b,d); if (e) t += e*dot(g[b], T[d]); }
    return t; });
  const out = [0,0,0,0]; for (let a = 0; a < 3; a++) for (let i = 0; i < 4; i++) out[i] += c[a]*T[a][i];
  return { vec: out, div: [0,1,2].reduce((t, a) => t + dot(g[a], T[a]), 0), T, g }; }
const dth = q => [0, 0, -q[3], q[2]], dze = q => [-q[1], q[0], 0, 0];
const sOf = q => q[2]*q[2] + q[3]*q[3];
const field = (n, A, B) => q => { const s = sOf(q), a = A*Jth(n,s), b = B*Jz(n,s), P = dth(q), Z = dze(q);
  return [a*P[0]+b*Z[0], a*P[1]+b*Z[1], a*P[2]+b*Z[2], a*P[3]+b*Z[3]]; };
const PTS = [[0.30, 0.70, 1.10], [0.62, 2.20, -0.40], [0.44, 1.50, 0.20]];

console.log('\n=== 1. TWO SCALAR IDENTITIES THAT KNOW NOTHING ABOUT A FLUID ===\n');

let j1 = 0, j2 = 0;
for (let n = 0; n <= 4; n++) for (const s of [0.2, 0.45, 0.77]) {
  const dA = (Jth(n, s + H) - Jth(n, s - H)) / (2 * H), dB = (Jz(n, s + H) - Jz(n, s - H)) / (2 * H);
  j1 = Math.max(j1, Math.abs(Jth(n, s) + s * dA - (n + 1) * Jz(n, s)));
  j2 = Math.max(j2, Math.abs(Jz(n, s) - (1 - s) * dB - (n + 1) * Jth(n, s))); }
ok('THE TWO JACOBI DERIVATIVE IDENTITIES HOLD — J^θ + s(J^θ)′ = (n+1)J^z and J^z − (1−s)(J^z)′ = (n+1)J^θ — checked as scalar finite differences with no vector field, no frame and no curl anywhere in the computation',
  j1 < 1e-7 && j2 < 1e-7,
  `worst residuals ${j1.toExponential(2)} and ${j2.toExponential(2)} over 15 (n, s) pairs — and these two ALONE force the chiral curl identity below`);

console.log('\n=== 2. THE CURL COMPONENTS OF THE REDUCTION, AGAINST AN AMBIENT DIFFERENCE ===\n');

let cw = 0;
for (let n = 0; n <= 3; n++) for (const [s, th, ze] of PTS) {
  const q = pt(s, th, ze);
  /* the reduction's own component formulas, evaluated here */
  const dA = (Jth(n, s + H) - Jth(n, s - H)) / (2 * H), dB = (Jz(n, s + H) - Jz(n, s - H)) / (2 * H);
  const wantTh = 2 * (Jz(n, s) - (1 - s) * dB), wantZ = 2 * (Jth(n, s) + s * dA);
  /* and the curl of the SAME field, differenced in the ambient sphere */
  const cTh = myCurl(field(n, 1, 0), q).vec, cZ = myCurl(field(n, 0, 1), q).vec;
  /* read each off in the coordinate basis: d_theta has |d_theta|^2 = s, d_zeta has 1-s */
  const gotZ  = dot(cTh, dze(q)) / Math.max(1e-12, 1 - s);
  const gotTh = dot(cZ, dth(q)) / Math.max(1e-12, s);
  cw = Math.max(cw, Math.abs(gotZ - wantZ), Math.abs(gotTh - wantTh)); }
ok('and the CURL of the reduced field, differenced in the ambient sphere, returns exactly the components the reduction states — 2(α + sα_s) axially and (2/R²)(β − (1−s)β_s) azimuthally',
  cw < 1e-6, `worst residual ${cw.toExponential(2)} over 12 (n, point) pairs`);

console.log('\n=== 3. THE JACOBI LEVEL IS THE SHELL INDEX ===\n');

let chi = 0;
for (let n = 0; n <= 3; n++) for (const [s, th, ze] of PTS) {
  const q = pt(s, th, ze), F = q2 => { const a = field(n,1,0)(q2), b = field(n,0,1)(q2); return a.map((v,i) => v + b[i]); };
  const c = myCurl(F, q).vec, f = F(q), sc = Math.hypot(f[0],f[1],f[2],f[3]) || 1;
  for (let i = 0; i < 4; i++) chi = Math.max(chi, Math.abs(c[i] - 2*(n+1)*f[i]) / sc); }
ok('e_n^θ + R e_n^z IS A BELTRAMI FIELD with curl eigenvalue 2(n+1)/R — so a mode of the torus sector is an element of a curl shell, and the sector and the spectrum are one object rather than two',
  chi < 1e-6, `worst relative residual ${chi.toExponential(2)} over 12 (n, point) pairs`);
const bad = [];
for (let n = 0; n <= 4; n++) for (const R of [1, 2.5]) {
  /* the shell index is read out of the OTHER laboratory, not written down here */
  if (Math.abs(S(`s3nsCurlLevel(${2 * n},1,${R})`) - 2 * (n + 1) / R) > 1e-12) bad.push(`n=${n} R=${R}`);
  if (S(`s3nsTorusShell(${n})`) !== 2 * n) bad.push(`index n=${n}`); }
ok('and the index agrees at the other end: the curl-shell laboratory`s own μ_{k,σ} at k = 2n is 2(n+1)/R, for every level and every radius tested',
  bad.length === 0, bad.length ? bad.join(' · ') : 'μ_{2n,+} = 2(n+1)/R at n = 0…4 and R ∈ {1, 2.5}, from the shell laboratory`s formula');

console.log('\n=== 4. THE WHOLE NONLINEARITY IS A GRADIENT ===\n');

const GX = S('S3NS_GLX'), GW = S('S3NS_GLW');
let pw = 0;
for (const [n, m, A, B] of [[0,0,1,1],[1,1,1,0.6],[2,2,-0.8,1.4],[3,3,1,1]]) {
  const F = field(n, A, B);
  /* this file integrates the pressure itself rather than calling the page's */
  const P = q => { const s = sOf(q); let acc = 0;
    for (let i = 0; i < 16; i++) { const u = s * (GX[i] + 1) / 2, a = A * Jth(n, u), b = B * Jz(m, u);
      acc += GW[i] * (a * a / 2 - b * b / 2); }
    return acc * s / 2; };
  for (const [s, th, ze] of PTS) { const q = pt(s, th, ze), u = F(q), mag = Math.hypot(u[0],u[1],u[2],u[3]);
    if (!(mag > 1e-9)) continue;
    const dir = u.map(x => x / mag), vp = F(along(q, dir, H)), vm2 = F(along(q, dir, -H));
    let conv = [0,1,2,3].map(i => mag * (vp[i] - vm2[i]) / (2 * H));
    const nr = dot(conv, q); conv = conv.map((x, i) => x - nr * q[i]);
    const gp = [0,0,0,0];
    for (let b = 0; b < 3; b++) { const T = Y(b, q), d = (P(along(q, T, H)) - P(along(q, T, -H))) / (2 * H);
      for (let i = 0; i < 4; i++) gp[i] += d * T[i]; }
    const sc = dot(u, u) + 1e-9;
    for (let i = 0; i < 4; i++) pw = Math.max(pw, Math.abs(conv[i] + gp[i]) / sc); } }
ok('∇_u u + grad p VANISHES for every torus-invariant field tested, with p_s = R²α²/2 − β²/2 — the convective term is not small here, it is exactly a gradient, and the pressure this file integrates for itself removes all of it',
  pw < 1e-6, `worst ‖∇_u u + grad p‖/|u|² = ${pw.toExponential(2)} over four (α, β) pairs at three points each`);

console.log('\n=== 5. THE KILLING CONE, MEASURED RATHER THAN CITED ===\n');

let dw = 0, constMag = 0;
for (const [A, B] of [[1,0],[0,1],[1,1],[0.7,-1.3]]) {
  const F = field(0, A, B);
  for (const [s, th, ze] of PTS) { const q = pt(s, th, ze), { T, g } = grads(F, q);
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++)
      dw = Math.max(dw, Math.abs(dot(g[a], T[b]) + dot(g[b], T[a]))); } }
{ const F = field(0, 1, 1), vals = PTS.map(([s, th, ze]) => { const u = F(pt(s, th, ze)); return dot(u, u); });
  constMag = Math.max(...vals) - Math.min(...vals); }
ok('THE CONSTANT-COEFFICIENT FIELDS ARE KILLING FIELDS, and this is measured: the symmetrised gradient Def u comes back zero at every sampled point, so the viscous operator annihilates them and λ₀ = 0 is a consequence rather than a stipulation',
  dw < 1e-7 && S('s3nsTorusEig(0,1)') === 0,
  `worst |Def u| = ${dw.toExponential(2)} over four cones at three points · λ₀ = ${S('s3nsTorusEig(0,1)')}`);
ok('and α = β is the self-dual corner where |u| is CONSTANT on the whole sphere, which is the case the Killing theorem says admits a spatially constant pressure',
  constMag < 1e-12,
  `|u|² varies by ${constMag.toExponential(2)} across the sampled points at α = β = 1 — it is s + (1−s)`);

console.log('\n=== 6. THE SHARP RATE, AND THE LABORATORY IN THE PAGE ===\n');

ok('12ν/R² IS THE SHARP RATE OF THE SECTOR — it is λ₁ and not a bound: no level above the constants decays more slowly, and the level below the constants does not exist',
  Math.abs(S('s3nsTorusEig(1,1)') - 12) < 1e-12
  && [2,3,4,5].every(n => S(`s3nsTorusEig(${n},1)`) > 12)
  && S('s3nsTorusEig(0,1)') === 0,
  'λ_n = 4n(n+2)/R²: 0, 12, 32, 60, 96, 140 — the gap above zero is 12 and nothing sits in it');

const audit = S('s3nsTorusAudit(2,1,1)');
ok('and the laboratory MEASURES its own three identities rather than printing them, so a reader watches residuals instead of being told the algebra worked',
  audit.jacobi < 1e-4 && audit.chiral < 1e-6 && audit.pressure < 1e-6 && audit.divergence < 1e-6
  && audit.shell === 4 && audit.mu === 6,
  `at n = 2: Jacobi ${audit.jacobi.toExponential(1)} · chiral ${audit.chiral.toExponential(1)} · pressure ${audit.pressure.toExponential(1)} · div ${audit.divergence.toExponential(1)} · shell ${audit.shell}, μ ${audit.mu}`);

ok('the laboratory is wired as a laboratory — a camera, a router branch, a scene and a lazy build — rather than declared and left undrawn',
  /s3torusGroup\.visible = \(v==='s3torus'\);/.test(src)
  && /state\.s3view==='s3torus'/.test(src)
  && /v==='s3torus'\?\[0,-\.3,13\.2\]:/.test(src)
  && /if\(v==='s3torus'&&!s3torusObjs\)\{ s3torusSetup\(\); \}/.test(src),
  'visibility, router, camera preset and lazy build are all present');
ok('and what the sector does NOT classify is refused in writing, because a complete answer inside one sector reads as a complete answer unless it says otherwise',
  /THE CLASSIFICATION IS COMPLETE FOR THIS SECTOR AND NO OTHER/.test(src)
  && /NOTHING HERE IS A STABILITY STATEMENT/.test(src)
  && /THE RESIDUALS ARE MEASUREMENTS, NOT TOLERANCES/.test(src),
  'three refusals: the sector`s boundary, the absence of a stability claim, and what a residual is');

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
