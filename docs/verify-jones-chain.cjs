#!/usr/bin/env node
/* ============================================================================
   FROM A KNOT TO A COMPUTER

   Seven links, and this file re-derives every one of them independently:

     a knot -> the Kauffman bracket -> the Temperley-Lieb algebra TL_n(delta)
            -> the braid group B_n  -> the Jones representation
            -> density in PSU(N)    -> Fibonacci anyons
            -> a universal quantum computer

   Five things are checked.

   1. THE INVARIANT KNOWS CHIRALITY.  The trefoil returns t + t^3 - t^4 and
      its mirror returns -t^-4 + t^-3 + t^-1 -- two different answers for two
      knots that differ only by reflection.  That is the fact that made this
      object famous in 1984 and it is the first link of the chain.
   2. BOTH MARKOV MOVES.  Two braids with the same closure must give the same
      polynomial, and there are exactly two ways to change a braid without
      changing its closure.  Both are applied and the answer does not move.
   3. dim TL_n IS THE CATALAN SEQUENCE, and the connected sum multiplies:
      the granny knot is the trefoil squared.
   4. THE LOOP VALUE AT LEVEL THREE IS THE GOLDEN RATIO, which is also the
      quantum dimension of the Fibonacci anyon -- one number reached from a
      diagram algebra on one side and from a fusion matrix on the other.
   5. AND THE GATE HUNT SEPARATES THE MODELS.  Aiming at T -- a NON-Clifford
      gate -- the Fibonacci error falls and the Ising error does not move at
      any length.  Aiming at a Hadamard, which IS Clifford, Ising hits it
      exactly and the contrast vanishes: the target is the experiment.
   ========================================================================= */
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const pAdd = (a, b) => { const r = new Map(a);
  for (const [e, c] of b) { const v = (r.get(e) || 0) + c; if (v === 0) r.delete(e); else r.set(e, v); } return r; };
const pMul = (a, b) => { const r = new Map();
  for (const [e1, c1] of a) for (const [e2, c2] of b) { const e = e1 + e2, v = (r.get(e) || 0) + c1 * c2;
    if (v === 0) r.delete(e); else r.set(e, v); } return r; };
const pMono = (c, e) => { const m = new Map(); if (c !== 0) m.set(e, c); return m; };
const DELTA = pAdd(pMono(-1, 2), pMono(-1, -2));

function ident(n) { const m = new Array(2 * n); for (let i = 0; i < n; i++) { m[i] = 2 * n - 1 - i; m[2 * n - 1 - i] = i; } return m; }
function eGen(n, i) { const m = new Array(2 * n);
  for (let k = 0; k < n; k++) { if (k === i || k === i + 1) continue; m[k] = 2 * n - 1 - k; m[2 * n - 1 - k] = k; }
  m[i] = i + 1; m[i + 1] = i; m[2 * n - 1 - i] = 2 * n - 2 - i; m[2 * n - 2 - i] = 2 * n - 1 - i; return m; }
const key = m => m.join(',');
function compose(n, a, b) {
  const par = [...Array(3 * n).keys()];
  const find = x => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  const uni = (x, y) => { x = find(x); y = find(y); if (x !== y) par[x] = y; };
  const aN = p => p < n ? p : (n + (2 * n - 1 - p));
  const bN = p => p < n ? (n + p) : (2 * n + (2 * n - 1 - p));
  for (let p = 0; p < 2 * n; p++) if (a[p] > p) uni(aN(p), aN(a[p]));
  for (let p = 0; p < 2 * n; p++) if (b[p] > p) uni(bN(p), bN(b[p]));
  const ends = []; for (let k = 0; k < n; k++) ends.push(k); for (let k = 0; k < n; k++) ends.push(2 * n + k);
  const byRoot = new Map();
  for (const e of ends) { const r = find(e); if (!byRoot.has(r)) byRoot.set(r, []); byRoot.get(r).push(e); }
  const m = new Array(2 * n), idx = e => e < n ? e : (2 * n - 1 - (e - 2 * n));
  for (const [, g] of byRoot) { if (g.length !== 2) return null; m[idx(g[0])] = idx(g[1]); m[idx(g[1])] = idx(g[0]); }
  const touched = new Set(ends.map(find)), roots = new Set();
  for (let k = 0; k < n; k++) roots.add(find(n + k));
  let loops = 0; for (const r of roots) if (!touched.has(r)) loops++;
  return [m, loops];
}
function mul(n, x, y) { const r = new Map();
  for (const [, [p, d]] of x) for (const [, [q, e]] of y) {
    const c = compose(n, d, e); if (!c) continue; const [m, loops] = c;
    let v = pMul(p, q); for (let i = 0; i < loops; i++) v = pMul(v, DELTA);
    const k = key(m); if (r.has(k)) r.set(k, [pAdd(r.get(k)[0], v), m]); else r.set(k, [v, m]); }
  for (const [k, [p]] of [...r]) if (p.size === 0) r.delete(k); return r; }
function rho(n, i, inv) { const e = eGen(n, i), id = ident(n);
  return new Map([[key(id), [pMono(1, inv ? -1 : 1), id]], [key(e), [pMono(1, inv ? 1 : -1), e]]]); }
function closureLoops(n, d) { const par = [...Array(2 * n).keys()];
  const find = x => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  const uni = (x, y) => { x = find(x); y = find(y); if (x !== y) par[x] = y; };
  for (let p = 0; p < 2 * n; p++) if (d[p] > p) uni(p, d[p]);
  for (let k = 0; k < n; k++) uni(k, 2 * n - 1 - k);
  const s = new Set(); for (let p = 0; p < 2 * n; p++) s.add(find(p)); return s.size; }
function jones(n, word) {
  let x = new Map([[key(ident(n)), [pMono(1, 0), ident(n)]]]);
  for (const g of word) { const i = Math.abs(g) - 1; if (i < 0 || i >= n - 1) continue; x = mul(n, x, rho(n, i, g < 0)); }
  let br = new Map();
  for (const [, [p, d]] of x) { const L = closureLoops(n, d);
    let c = p; for (let i = 0; i < L - 1; i++) c = pMul(c, DELTA); br = pAdd(br, c); }
  const w = word.reduce((s, g) => s + (g > 0 ? 1 : -1), 0);
  br = pMul(br, pMul(pMono((w % 2 === 0) ? 1 : -1, 0), pMono(1, -3 * w)));
  const out = new Map();
  for (const [e, c] of br) { if (e % 2 !== 0) return null; const te = -e / 2; out.set(te, (out.get(te) || 0) + c); }
  for (const [k, v] of [...out]) if (v === 0) out.delete(k);
  return out; }
const eq = (a, b) => { if (!a || !b || a.size !== b.size) return false;
  for (const [e, c] of a) if (b.get(e) !== c) return false; return true; };
const str = a => !a ? '—' : ([...a.entries()].sort((x, y) => x[0] - y[0])
  .map(([e, c]) => `${c > 0 ? '+' : '-'}${Math.abs(c)}t^(${e % 2 === 0 ? e / 2 : e + '/2'})`).join(' ') || '0');

console.log('\n=== 1. The invariant knows chirality ===\n');

const tre = jones(2, [1, 1, 1]), mir = jones(2, [-1, -1, -1]);
const want = new Map([[2, 1], [6, 1], [8, -1]]);          /* t + t^3 - t^4 in units of t^(1/2) */
ok('the trefoil returns t + t^3 - t^4 and its MIRROR returns -t^-4 + t^-3 + t^-1. Two different answers for two knots that differ only by reflection -- the invariant DETECTS chirality, which is the fact that made it famous in 1984 and is the first link of this chain. And it is computed here through the chain rather than looked up: the braid word becomes an element of the Temperley-Lieb algebra by sigma_i -> A + A^-1 e_i, and the element is closed by the Markov trace',
  eq(tre, want) && !eq(tre, mir)
  && [...mir.entries()].every(([e, c]) => tre.get(-e) === c),
  `trefoil ${str(tre)} · mirror ${str(mir)} · each is the other with every exponent negated`);

const f8 = jones(3, [1, -2, 1, -2]);
ok('and the figure-eight is PALINDROMIC -- t^-2 - t^-1 + 1 - t + t^2, its own mirror image -- because the knot is amphichiral. The same computation that separates the trefoil from its reflection declines to separate this one, which is the invariant being right about a knot where there is nothing to detect',
  eq(f8, new Map([[-4, 1], [-2, -1], [0, 1], [2, -1], [4, 1]])),
  `figure-eight ${str(f8)}`);

console.log('\n=== 2. Both Markov moves ===\n');

const b3 = jones(3, [1, 1, 1]);
const conj1 = jones(3, [2, 1, 1, 1, -2]), conj2 = jones(3, [1, 1, 1, 1, -1]);
ok('MARKOV I: conjugating a braid does not change its closure, so it must not change the polynomial. Two different conjugators on three strands, and the answer does not move. This is not a remark about the theory -- it is the check that makes the number an invariant of the KNOT rather than of the particular braid somebody drew it with',
  eq(b3, conj1) && eq(b3, conj2),
  `sigma_1^3 gives ${str(b3)} · conjugated by sigma_2 and by sigma_1 it gives the same`);

const b2 = jones(2, [1, 1, 1]);
const stabP = jones(3, [1, 1, 1, 2]), stabM = jones(3, [1, 1, 1, -2]);
ok('MARKOV II: adding a strand with a single crossing does not change the closure either, in EITHER sign, and the writhe normalisation is exactly what makes that come out. Without the (-A^3)^-w factor this check fails and the two signs disagree with each other -- so this line is also the check on the normalisation',
  eq(b2, stabP) && eq(b2, stabM),
  `on 2 strands ${str(b2)} · stabilised with sigma_2 and with sigma_2^-1 on 3 strands, both the same`);

console.log('\n=== 3. The algebra, and a product of knots ===\n');

const CAT = n => { let c = 1; for (let i = 0; i < n; i++) c = c * 2 * (2 * i + 1) / (i + 2); return Math.round(c); };
function tlDim(n) { const seen = new Set(); const stack = [ident(n)];
  const gens = []; for (let i = 0; i < n - 1; i++) gens.push(eGen(n, i));
  seen.add(key(ident(n)));
  while (stack.length) { const d = stack.pop();
    for (const g of gens) { const c = compose(n, d, g); if (!c) continue;
      const k = key(c[0]); if (!seen.has(k)) { seen.add(k); stack.push(c[0]); } } }
  return seen.size; }
const dims = [1, 2, 3, 4, 5, 6].map(tlDim), cats = [1, 2, 3, 4, 5, 6].map(CAT);
ok('the dimension of TL_n is the nth CATALAN number, and it is counted here by generating the diagrams from the generators rather than by evaluating the formula -- 1, 2, 5, 14, 42, 132. A diagram algebra whose dimension came out anything else would not be Temperley-Lieb, and the count is the cheapest possible check that the composition rule is right',
  dims.every((d, i) => d === cats[i]),
  `generated ${dims.join(', ')} · Catalan ${cats.join(', ')}`);

const granny = jones(3, [1, 1, 1, 2, 2, 2]);
const treSq = pMul(tre, tre);
ok('and the connected sum MULTIPLIES: the granny knot is a trefoil tied twice, and its polynomial is the trefoil`s squared, term for term. That is a property of the invariant nobody put into this code -- the braid of the granny knot is computed from scratch and the square is computed from the trefoil, and they agree',
  eq(granny, treSq),
  `granny ${str(granny)} · trefoil squared ${str(treSq)}`);

console.log('\n=== 4. One number, from two directions ===\n');

const PHI = (1 + Math.sqrt(5)) / 2;
const delta = k => 2 * Math.cos(Math.PI / (k + 2));
/* the quantum dimension of the Fibonacci anyon, by power iteration on its fusion matrix */
const N = [[[1, 0], [0, 1]], [[0, 1], [1, 1]]];
let v = [1, 1], lam = 1;
for (let t = 0; t < 400; t++) { const w = [0, 0];
  for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) w[c] += N[1][b][c] * v[b];
  const nm = Math.hypot(...w); lam = nm / Math.hypot(...v); v = w.map(x => x / nm); }
ok('the loop value of the diagram algebra at level three is 2cos(pi/5), and the quantum dimension of the Fibonacci anyon is the largest eigenvalue of its fusion matrix. They are the same number to sixteen digits: 1.618033988749895. One is a property of a planar algebra of arcs and the other of a 2x2 matrix of ones and zeros, and neither computation knows the other exists. That coincidence is not a coincidence -- it is the fourth link of the chain, and it is why braiding anyons computes a knot invariant',
  Math.abs(delta(3) - PHI) < 1e-15 && Math.abs(lam - PHI) < 1e-12,
  `delta(k=3) = ${delta(3).toFixed(15)} · largest eigenvalue of the fusion matrix = ${lam.toFixed(15)} · phi = ${PHI.toFixed(15)}`);

console.log('\n=== 5. And the gate hunt separates the models ===\n');

const cm = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const ca2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mm = (A, B) => [[ca2(cm(A[0][0], B[0][0]), cm(A[0][1], B[1][0])), ca2(cm(A[0][0], B[0][1]), cm(A[0][1], B[1][1]))],
                      [ca2(cm(A[1][0], B[0][0]), cm(A[1][1], B[1][0])), ca2(cm(A[1][0], B[0][1]), cm(A[1][1], B[1][1]))]];
const dg = A => [[[A[0][0][0], -A[0][0][1]], [A[1][0][0], -A[1][0][1]]], [[A[0][1][0], -A[0][1][1]], [A[1][1][0], -A[1][1][1]]]];
const phz = t => [Math.cos(t), Math.sin(t)];
const ID2 = [[[1, 0], [0, 0]], [[0, 0], [1, 0]]];
function gens2(id) {
  if (id === 'ising') { const e = phz(-Math.PI / 8), H = Math.SQRT1_2;
    const a = [[cm(e, [1, 0]), [0, 0]], [[0, 0], cm(e, [0, 1])]];
    const b = [[cm(e, [H, 0]), cm(e, [0, -H])], [cm(e, [0, -H]), cm(e, [H, 0])]];
    return [a, b, dg(a), dg(b)]; }
  const iP = 1 / PHI, sP = Math.sqrt(1 / PHI);
  const s1 = [[phz(-4 * Math.PI / 5), [0, 0]], [[0, 0], phz(3 * Math.PI / 5)]];
  const F = [[[iP, 0], [sP, 0]], [[sP, 0], [-iP, 0]]];
  return [s1, mm(mm(F, s1), dg(F)), dg(s1), dg(mm(mm(F, s1), dg(F)))]; }
const dist = (U, V) => { const P = mm(dg(U), V);
  const tr = [P[0][0][0] + P[1][1][0], P[0][0][1] + P[1][1][1]];
  return 1 - Math.min(1, Math.hypot(tr[0], tr[1]) / 2); };
function hunt(id, T, maxLen) {
  const G = gens2(id); let front = [ID2], bd = dist(ID2, T); const curve = [];
  for (let L = 1; L <= maxLen; L++) { const next = [];
    for (const U of front) for (const g of G) { const V = mm(g, U); next.push(V);
      const d = dist(V, T); if (d < bd) bd = d; }
    front = next; curve.push({ L, d: bd }); if (front.length > 300000) break; }
  return { curve, best: bd }; }
const T_GATE = [[[1, 0], [0, 0]], [[0, 0], [Math.SQRT1_2, Math.SQRT1_2]]];
const H_GATE = (() => { const h = Math.SQRT1_2; return [[[h, 0], [h, 0]], [[h, 0], [-h, 0]]]; })();
const fT = hunt('fib', T_GATE, 8), iT = hunt('ising', T_GATE, 8);
ok('aiming at the T gate -- diag(1, e^{i pi/4}), the standard NON-Clifford gate -- the Fibonacci error falls by more than an order of magnitude as the braid word gets longer, and the Ising error does not move by one part in a million at any length. Every word to length eight is enumerated, so this is not a search that got unlucky: 65536 Ising braid words and the closest is the same distance as the first one',
  fT.curve[7].d < fT.curve[0].d / 10 && Math.abs(iT.curve[7].d - iT.curve[0].d) < 1e-6,
  `Fibonacci ${fT.curve[0].d.toExponential(2)} at length 1 -> ${fT.curve[7].d.toExponential(2)} at length 8 · Ising ${iT.curve[0].d.toExponential(2)} -> ${iT.curve[7].d.toExponential(2)}`);

const iH = hunt('ising', H_GATE, 6);
ok('AND THE TARGET IS THE WHOLE EXPERIMENT, which is checked by aiming at the wrong one on purpose. A Hadamard IS a Clifford gate and Ising braiding generates exactly the Clifford group, so aiming there the Ising braid hits it to machine precision and the two models look identical. The first version of this experiment used a Hadamard and reported no contrast at all. A comparison that would have come out the same either way is not a comparison',
  iH.best < 1e-12,
  `Ising reaches a Hadamard to ${iH.best.toExponential(2)} -- exactly, because it is Clifford -- while it cannot come within ${iT.best.toFixed(4)} of a T gate`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
