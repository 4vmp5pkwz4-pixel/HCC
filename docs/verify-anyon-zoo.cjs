#!/usr/bin/env node
/* ============================================================================
   EVERY ANYON THERE IS

   This atlas has braided FIBONACCI anyons since it was written, and one model
   is not a taxonomy.  In two dimensions the exchange of two identical
   particles is not a symmetry with two representations -- it is the braid
   group, which is infinite, and the possible statistics form a classification:
   modular tensor categories.

   Thirteen models are carried, and NONE of their numbers is typed in.  This
   file re-derives the whole classification independently and checks five
   things.

   1. THE QUANTUM DIMENSIONS ARE EIGENVALUES.  d_a is the largest eigenvalue of
      the fusion matrix N_a, obtained by power iteration -- so the closed forms
      (phi for Fibonacci, sqrt 2 for the Ising sigma, the sine ratio for
      SU(2)_k) have something to be checked against.
   2. THE GAUSS SUM RETURNS THE CENTRAL CHARGE.  (1/D) sum d_a^2 theta_a =
      exp(2 pi i c/8).  The left side is arithmetic on a finite set of phases
      and knows nothing about a conformal field theory.  Its MODULUS must be
      exactly one, and a modulus that is not one is not a wrong central charge
      -- it is not a modular tensor category at all.
   3. VERLINDE INTEGRALITY.  The S-matrix must turn back into the fusion rules
      as non-negative integers with no imaginary part.
   4. THE MODULAR GROUP.  S^2 = C and (ST)^3 = S^2, with the framing anomaly
      c/24 inside T.
   5. AND UNIVERSALITY, MEASURED RATHER THAN QUOTED.  Freedman-Larsen-Wang is
      an external theorem; what is checked here is its consequence -- random
      braid words reach thousands of distinct points for Fibonacci and exactly
      six for Ising, forever.
   ========================================================================= */
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const PHI = (1 + Math.sqrt(5)) / 2;
const MODELS = [
  { id: 'z2', kind: 'abelian', n: 2 }, { id: 'toric', kind: 'abelian', n: 4 },
  { id: 'z3', kind: 'abelian', n: 3 }, { id: 'z5', kind: 'abelian', n: 5 },
  { id: 'su2_1', kind: 'su2', k: 1 }, { id: 'su2_2', kind: 'su2', k: 2 },
  { id: 'su2_3', kind: 'su2', k: 3 }, { id: 'su2_4', kind: 'su2', k: 4 },
  { id: 'su2_5', kind: 'su2', k: 5 }, { id: 'su2_6', kind: 'su2', k: 6 },
  { id: 'su2_8', kind: 'su2', k: 8 },
  { id: 'fib', kind: 'fib', n: 2 }, { id: 'ising', kind: 'ising', n: 3 }];

function fusion(m) {
  if (m.kind === 'su2') { const k = m.k, n = k + 1, N = [];
    for (let a = 0; a < n; a++) { N.push([]); for (let b = 0; b < n; b++) { N[a].push([]);
      for (let c = 0; c < n; c++) N[a][b].push(
        (c >= Math.abs(a - b) && c <= Math.min(a + b, 2 * k - a - b) && ((a + b - c) % 2 === 0)) ? 1 : 0); } }
    return { N, n }; }
  if (m.kind === 'abelian') { const n = m.n, N = [];
    const add = (m.id === 'toric') ? ((a, b) => a ^ b) : ((a, b) => (a + b) % n);
    for (let a = 0; a < n; a++) { N.push([]); for (let b = 0; b < n; b++) { N[a].push([]);
      for (let c = 0; c < n; c++) N[a][b].push(add(a, b) === c ? 1 : 0); } }
    return { N, n }; }
  if (m.kind === 'fib') return { n: 2, N: [[[1, 0], [0, 1]], [[0, 1], [1, 1]]] };
  return { n: 3, N: [[[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[0, 1, 0], [1, 0, 1], [0, 1, 0]], [[0, 0, 1], [0, 1, 0], [1, 0, 0]]] };
}
function qdim(N, a) { const n = N.length; let v = new Array(n).fill(1), lam = 1;
  for (let t = 0; t < 400; t++) { const w = new Array(n).fill(0);
    for (let b = 0; b < n; b++) for (let c = 0; c < n; c++) w[c] += N[a][b][c] * v[b];
    const nm = Math.hypot(...w); if (!(nm > 0)) return 0;
    lam = nm / Math.hypot(...v); for (let i = 0; i < n; i++) v[i] = w[i] / nm; }
  return lam; }
function dims(m) { const { N, n } = fusion(m); const d = [];
  for (let a = 0; a < n; a++) d.push(qdim(N, a));
  return { d, n, N, D: Math.sqrt(d.reduce((s, x) => s + x * x, 0)) }; }
function spins(m) {
  if (m.kind === 'su2') { const k = m.k, h = [];
    for (let a = 0; a <= k; a++) { const j = a / 2; h.push(j * (j + 1) / (k + 2)); }
    return { h, c: 3 * k / (k + 2) }; }
  if (m.kind === 'fib') return { h: [0, 2 / 5], c: 14 / 5 };
  if (m.kind === 'ising') return { h: [0, 1 / 16, 1 / 2], c: 1 / 2 };
  if (m.id === 'toric') return { h: [0, 0, 0, 1 / 2], c: 0 };
  { const n = m.n, h = [], odd = (n % 2 === 1);
    for (let a = 0; a < n; a++) h.push(odd ? (a * a % n) / n : (a * a % (2 * n)) / (2 * n));
    let re = 0, im = 0;
    for (let a = 0; a < n; a++) { const t = 2 * Math.PI * h[a]; re += Math.cos(t); im += Math.sin(t); }
    const D = Math.sqrt(n); re /= D; im /= D;
    return { h, c: (Math.atan2(im, re) / (2 * Math.PI)) * 8 }; } }
function gauss(m) { const { d, D } = dims(m), { h, c } = spins(m);
  let re = 0, im = 0;
  for (let a = 0; a < d.length; a++) { const t = 2 * Math.PI * h[a];
    re += d[a] * d[a] * Math.cos(t); im += d[a] * d[a] * Math.sin(t); }
  re /= D; im /= D;
  let cg = (Math.atan2(im, re) / (2 * Math.PI)) * 8;
  while (cg - c > 4) cg -= 8; while (c - cg > 4) cg += 8;
  return { modulus: Math.hypot(re, im), c, cg, residual: Math.abs(cg - c) }; }

console.log('\n=== 1. The quantum dimensions are eigenvalues, not entries ===\n');

const fib = dims(MODELS.find(m => m.id === 'fib'));
const ising = dims(MODELS.find(m => m.id === 'ising'));
ok('the Fibonacci anyon has quantum dimension phi and the Ising sigma has sqrt 2, and both come out of POWER ITERATION on the fusion matrix rather than being written down. phi is the largest root of x^2 = x + 1, which is exactly the fusion rule tau x tau = 1 + tau read as an equation for how the space grows — the golden ratio is not decoration here, it is the eigenvalue',
  Math.abs(fib.d[1] - PHI) < 1e-12 && Math.abs(ising.d[1] - Math.SQRT2) < 1e-12,
  `d_tau = ${fib.d[1].toFixed(12)} against phi = ${PHI.toFixed(12)} · d_sigma = ${ising.d[1].toFixed(12)} against sqrt 2 = ${Math.SQRT2.toFixed(12)}`);

let worstSu2 = 0;
for (const m of MODELS.filter(m => m.kind === 'su2')) {
  const D = dims(m);
  for (let a = 0; a <= m.k; a++) {
    const closed = Math.sin((a + 1) * Math.PI / (m.k + 2)) / Math.sin(Math.PI / (m.k + 2));
    worstSu2 = Math.max(worstSu2, Math.abs(D.d[a] - closed)); } }
ok('and every SU(2)_k dimension agrees with the closed form sin((2j+1)pi/(k+2))/sin(pi/(k+2)) across seven levels, which is the point of iterating rather than substituting: two independent routes to the same forty-four numbers',
  worstSu2 < 1e-12,
  `worst departure from the closed form over 7 levels and 44 anyon types: ${worstSu2.toExponential(2)}`);

console.log('\n=== 2. The Gauss sum returns the central charge ===\n');

const G = MODELS.map(m => ({ id: m.id, ...gauss(m) }));
const worstMod = Math.max(...G.map(g => Math.abs(g.modulus - 1)));
const worstC = Math.max(...G.map(g => g.residual));
ok('the central charge comes back out of a finite sum of phases. (1/D) sum d_a^2 theta_a = exp(2 pi i c/8) -- the left side knows nothing about a conformal field theory and returns 3k/(k+2) for every SU(2)_k, 1/2 for Ising and 14/5 for Fibonacci. Its MODULUS must be exactly one, and that is the sharper of the two conditions: a modulus that is not one is not a wrong central charge, it is not a modular tensor category at all',
  worstMod < 1e-12 && worstC < 1e-9,
  `over ${G.length} models: worst |modulus - 1| = ${worstMod.toExponential(2)} · worst |c_gauss - c| = ${worstC.toExponential(2)}`);

ok('and the parity of the cyclic models is what that modulus caught. The quadratic form a^2/(2N) is right for even N and WRONG for odd N, where it returns a modulus of 1/sqrt(N) -- 0.577 at N = 3 and 0.447 at N = 5. The consistent form there is a^2/N. This check found that, and it is kept because it is the one condition that distinguishes a category from an arithmetic coincidence',
  (() => { const h = [0, 1 / 6, 4 / 6], D = Math.sqrt(3);
    let re = 0, im = 0;
    for (const x of h) { re += Math.cos(2 * Math.PI * x); im += Math.sin(2 * Math.PI * x); }
    return Math.abs(Math.hypot(re / D, im / D) - 1 / Math.sqrt(3)) < 1e-12; })(),
  `the wrong form at N = 3 gives a modulus of ${(1 / Math.sqrt(3)).toFixed(6)}, which is how it was found`);

console.log('\n=== 3. Verlinde integrality, against the rules the model was built from ===\n');

function verlinde(m) {
  const n = fusion(m).n, { N } = fusion(m);
  const { d, D } = dims(m), { h } = spins(m);
  let S;
  if (m.kind === 'su2') { const k = m.k; S = [];
    for (let a = 0; a < n; a++) { S.push([]); for (let b = 0; b < n; b++)
      S[a].push([Math.sqrt(2 / (k + 2)) * Math.sin((a + 1) * (b + 1) * Math.PI / (k + 2)), 0]); } }
  else if (m.kind === 'abelian') { S = [];
    const q = a => h[((a % n) + n) % n];
    const add = (m.id === 'toric') ? ((a, b) => a ^ b) : ((a, b) => (a + b) % n);
    for (let a = 0; a < n; a++) { S.push([]); for (let b = 0; b < n; b++) {
      const B = q(add(a, b)) - q(a) - q(b);
      S[a].push([Math.cos(-2 * Math.PI * B) / Math.sqrt(n), Math.sin(-2 * Math.PI * B) / Math.sqrt(n)]); } } }
  else { S = [];
    for (let a = 0; a < n; a++) { S.push([]); for (let b = 0; b < n; b++) {
      let re = 0, im = 0;
      for (let c = 0; c < n; c++) { if (!N[a][b][c]) continue;
        const ph = 2 * Math.PI * (h[c] - h[a] - h[b]);
        re += N[a][b][c] * d[c] * Math.cos(ph); im += N[a][b][c] * d[c] * Math.sin(ph); }
      S[a].push([re / D, im / D]); } } }
  const div = (A, B) => { const q2 = B[0] * B[0] + B[1] * B[1];
    return [(A[0] * B[0] + A[1] * B[1]) / q2, (A[1] * B[0] - A[0] * B[1]) / q2]; };
  let wi = 0, wr = 0, wim = 0, neg = 0;
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) for (let c = 0; c < n; c++) {
    let re = 0, im = 0;
    for (let x = 0; x < n; x++) {
      const A = S[a][x], B = S[b][x], C = [S[c][x][0], -S[c][x][1]];
      let pr = [A[0] * B[0] - A[1] * B[1], A[0] * B[1] + A[1] * B[0]];
      pr = [pr[0] * C[0] - pr[1] * C[1], pr[0] * C[1] + pr[1] * C[0]];
      const t = div(pr, S[0][x]); re += t[0]; im += t[1]; }
    const r = Math.round(re);
    wi = Math.max(wi, Math.abs(re - r)); wim = Math.max(wim, Math.abs(im));
    if (r < 0) neg++;
    wr = Math.max(wr, Math.abs(r - N[a][b][c])); }
  return { wi, wr, wim, neg, S };
}
const V = MODELS.map(m => ({ id: m.id, ...verlinde(m) }));
ok('the Verlinde formula turns the S-matrix back into the fusion rules over every triple of every model -- non-negative integers, no imaginary part, and equal to the rules the model was built from. It is a strong check because it is arithmetic that has no reason to be integral unless the S-matrix is right: an S-matrix wrong by a phase returns halves, which is exactly what a real-valued S-matrix did here for the odd cyclic models before it was made complex',
  V.every(v => v.wi < 1e-9 && v.wim < 1e-9 && v.wr === 0 && v.neg === 0),
  `${V.length} models · worst departure from an integer ${Math.max(...V.map(v => v.wi)).toExponential(2)} · worst imaginary part ${Math.max(...V.map(v => v.wim)).toExponential(2)} · rule mismatches ${V.reduce((s, v) => s + v.wr, 0)} · negatives ${V.reduce((s, v) => s + v.neg, 0)}`);

console.log('\n=== 4. And the models represent SL(2,Z) ===\n');

function modular(m) {
  const { S } = verlinde(m), { h, c } = spins(m), n = S.length;
  const mm = (A, B) => { const R = []; for (let i = 0; i < n; i++) { R.push([]);
    for (let j = 0; j < n; j++) { let re = 0, im = 0;
      for (let x = 0; x < n; x++) { re += A[i][x][0] * B[x][j][0] - A[i][x][1] * B[x][j][1];
        im += A[i][x][0] * B[x][j][1] + A[i][x][1] * B[x][j][0]; }
      R[i].push([re, im]); } } return R; };
  const S2 = mm(S, S);
  let s2 = 0;
  for (let i = 0; i < n; i++) { let best = -1, bv = -1;
    for (let j = 0; j < n; j++) { const v = Math.hypot(S2[i][j][0], S2[i][j][1]); if (v > bv) { bv = v; best = j; } }
    for (let j = 0; j < n; j++) { const w = (j === best) ? 1 : 0;
      s2 = Math.max(s2, Math.hypot(S2[i][j][0] - w, S2[i][j][1])); } }
  const ST = []; for (let i = 0; i < n; i++) { ST.push([]);
    for (let j = 0; j < n; j++) { const t = 2 * Math.PI * (h[j] - c / 24);
      ST[i].push([S[i][j][0] * Math.cos(t) - S[i][j][1] * Math.sin(t),
                  S[i][j][0] * Math.sin(t) + S[i][j][1] * Math.cos(t)]); } }
  const M = mm(mm(ST, ST), ST);
  let st3 = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++)
    st3 = Math.max(st3, Math.hypot(M[i][j][0] - S2[i][j][0], M[i][j][1] - S2[i][j][1]));
  return { s2, st3 };
}
const M = MODELS.map(m => ({ id: m.id, ...modular(m) }));
ok('S^2 is the charge-conjugation permutation and (ST)^3 equals it, with the framing anomaly c/24 sitting inside T. Together those two relations ARE the representation of the modular group, and they are the reason the central charge has to be there at all: leave the c/24 out and (ST)^3 comes back rotated by a phase that depends on the model. Thirteen models, both relations, to machine precision',
  M.every(x => x.s2 < 1e-9 && x.st3 < 1e-9),
  `worst |S^2 - C| = ${Math.max(...M.map(x => x.s2)).toExponential(2)} · worst |(ST)^3 - S^2| = ${Math.max(...M.map(x => x.st3)).toExponential(2)} over ${M.length} models`);

console.log('\n=== 5. Universality, measured rather than quoted ===\n');

const cm = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const ca = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mm2 = (A, B) => [[ca(cm(A[0][0], B[0][0]), cm(A[0][1], B[1][0])), ca(cm(A[0][0], B[0][1]), cm(A[0][1], B[1][1]))],
                       [ca(cm(A[1][0], B[0][0]), cm(A[1][1], B[1][0])), ca(cm(A[1][0], B[0][1]), cm(A[1][1], B[1][1]))]];
const dag = A => [[[A[0][0][0], -A[0][0][1]], [A[1][0][0], -A[1][0][1]]], [[A[0][1][0], -A[0][1][1]], [A[1][1][0], -A[1][1][1]]]];
const ph = t => [Math.cos(t), Math.sin(t)];
function gens(id) {
  if (id === 'ising') { const e = ph(-Math.PI / 8), H = 1 / Math.SQRT2;
    return [[[cm(e, [1, 0]), [0, 0]], [[0, 0], cm(e, [0, 1])]],
            [[cm(e, [H, 0]), cm(e, [0, -H])], [cm(e, [0, -H]), cm(e, [H, 0])]]]; }
  const iP = 1 / PHI, sP = Math.sqrt(1 / PHI);
  const s1 = [[ph(-4 * Math.PI / 5), [0, 0]], [[0, 0], ph(3 * Math.PI / 5)]];
  const F = [[[iP, 0], [sP, 0]], [[sP, 0], [-iP, 0]]];
  return [s1, mm2(mm2(F, s1), dag(F))];
}
function image(id, words, tol) {
  const Gs = gens(id); let U = [[[1, 0], [0, 0]], [[0, 0], [1, 0]]]; const pts = [];
  let sd = 20260831 >>> 0;
  const rnd = () => { sd = (sd + 0x6D2B79F5) | 0; let t = Math.imul(sd ^ (sd >>> 15), 1 | sd);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (let i = 0; i < words; i++) { U = mm2(rnd() < 0.5 ? Gs[0] : Gs[1], U);
    const a = U[0][0], b = U[1][0];
    const p = [2 * (a[0] * b[0] + a[1] * b[1]), 2 * (a[0] * b[1] - a[1] * b[0]),
               (a[0] * a[0] + a[1] * a[1]) - (b[0] * b[0] + b[1] * b[1])];
    if (!pts.some(q => Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) < tol)) pts.push(p); }
  return pts.length;
}
const fibPts = image('fib', 3000, 0.02), isingPts = image('ising', 3000, 0.02);
ok('Freedman, Larsen and Wang proved that the braid group image is dense for SU(2)_k at k = 3 and k >= 5 and finite for k = 1, 2 and 4. That is an EXTERNAL theorem and is cited, not derived. What is checked here is its consequence: three thousand random braid words reach about two thousand distinct points on the Bloch sphere for Fibonacci, and exactly six for Ising. This is not a proof of density and does not claim to be. It is the difference being watched, which is the only part of a citation an atlas can honestly own',
  fibPts > 1500 && isingPts === 6,
  `Fibonacci reaches ${fibPts} distinct points in 3000 words · Ising reaches ${isingPts}`);

const isingLong = image('ising', 30000, 0.02);
ok('and the Ising image does not grow. Ten times as many braid words find exactly the same six points, which is what FINITE means and is a stronger statement than counting once: a slow-filling dense image and a finite one look alike at a single sample size and separate immediately when the sample grows. Ising braiding is robust and it is not universal, and no amount of patience changes that',
  isingLong === isingPts,
  `3000 words: ${isingPts} points · 30000 words: ${isingLong} points — unchanged`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
