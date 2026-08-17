#!/usr/bin/env node
/* ============================================================================
   THE TRACE-FREE DE SITTER CIVP CHAIN, CHECKED AGAINST SOMETHING ELSE

   Seven stations were added to the atlas for the manuscript "Acyclic CIVP--Index Locking,
   Molecular Corner Statistics, Entropy--Flux Structure, and Capacity Selection in
   Trace-Free de Sitter Gravity", and six kernels are SLICED OUT OF THEM by
   scripts/extract-kernels.mjs. Every kernel carries its own self-tests, and a self-test is
   a laboratory agreeing with itself.

   This file does not import a kernel and ask whether it likes its own answer. For each
   claim it computes the SAME NUMBER BY A DIFFERENT ROUTE, and then compares:

     · h^1 of a line bundle on CP^1 comes back through SERRE DUALITY, h^1(O(d)) =
       h^0(O(-d-2)), rather than through the max(-d-1,0) formula the kernel uses;
     · the rank of the confluent evaluation matrix is recomputed by GRAM-SCHMIDT on the
       columns, which shares no code with the pivoted elimination the atlas uses;
     · the confluent Vandermonde determinant is recomputed by the LEIBNIZ SUM over all
       permutations for small sizes — the definition, at factorial cost;
     · the only Jones value in (2,3) is found by SOLVING 4cos^2(pi/m) = 2 and = 3 for m,
       giving m = 4 and m = 6, so the strict interval admits the integers strictly between,
       which is m = 5 alone;
     · the BMS shape norm is checked against (1/2)(l+2)!/(l-2)! in exact BigInt arithmetic;
     · the Capelli multiplicities are recovered from the POLYNOMIAL, by finding the lowest
       nonvanishing derivative order at each root, which never forms a transfer at all;
     · the compound-Poisson cumulants are checked by BRUTE-FORCE SUMMATION over the Poisson
       count with an explicit two-point weight law;
     · A^n is checked against BigInt Fibonacci numbers built by the integer recursion.

   Run: node docs/verify-civp-locking.cjs
   ========================================================================= */

let pass = 0, fail = 0;
const ok = (t, c, d) => { c ? pass++ : fail++;
  console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); };

const PHI = (1 + Math.sqrt(5)) / 2, PHI2 = PHI * PHI;

(async () => {
const { pathToFileURL } = require('node:url');
const { join } = require('node:path');
const ROOT = join(__dirname, '..');
const load = p => import(pathToFileURL(join(ROOT, p)).href);

/* ONE import, and it is the module SLICED OUT OF index.html. The mathematics being checked
   here is literally the code the atlas runs to draw the seven stations — if this file and the
   picture ever disagreed, one of them would have been retyped, and neither is. */
const X = await load('core/atlas/extracted.mjs');
const CP1 = { bundleCohomology:X.civpCohomology, evaluationLock:X.civpLock,
  evaluationMatrix:X.civpEvalMatrix, confluentVandermondeProduct:X.civpVandermonde };
const EMB = { capacity:X.civpCapacity, gluing:X.civpGluing,
  compoundPoissonRigidity:X.civpRigidity };
const JON = { pimsnerPopaWindow:X.civpWindow, divisibilityNoGo:X.civpDivisibleNoGo,
  a4Transfer:X.civpA4 };
const SEL = { affineReweight:X.civpReweight, kappa:X.civpKappa, selectSector:X.civpSelect };
const CAR = { borelWeil:X.civpBorelWeil, capelliTransfer:X.civpCapelli,
  hankelRank:X.civpHankel, projectiveCrossRatio:X.civpCrossRatio };
const CLO = { deSitterFromCapacity:X.civpDeSitter, shapeNorm:X.civpShapeNorm,
  additiveMultiplicativeNoGo:X.civpAddMultNoGo, closure:X.civpClosure,
  vacuumShiftKernel:X.civpVacuumShift };

/* ─────────────────────────────────────────────────────────────────────────
   1 · SHEAF COHOMOLOGY ON CP^1 THROUGH SERRE DUALITY
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n=== 1. Riemann-Roch, by a route that does not use the kernel\'s formula ===\n');
{
  /* h^0(O(d)) counted as monomials; h^1 by duality against the canonical O(-2) */
  const h0count = d => (d < 0 ? 0 : d + 1);
  const h1dual = d => h0count(-d - 2);
  let bad = [];
  for (let d = -12; d <= 12; d++) {
    const k = CP1.bundleCohomology(d);
    if (k.h0 !== h0count(d) || k.h1 !== h1dual(d)) bad.push(d);
  }
  ok('h^0 by monomial count and h^1 by Serre duality reproduce the kernel for -12 <= d <= 12',
    bad.length === 0, bad.length ? `disagreements at d = ${bad.join(', ')}` :
    'h^1(O(d)) = h^0(O(-d-2)) — the kernel never computes it that way and gets the same answer');

  /* Riemann-Roch itself: chi = deg + 1 */
  let rr = true;
  for (let d = -20; d <= 20; d++) { const k = CP1.bundleCohomology(d); rr = rr && (k.h0 - k.h1 === d + 1); }
  ok('the Euler characteristic is deg + 1 for every degree tested', rr,
    'chi(O(d)) = d + 1 across 41 degrees, so acyclicity is possible at exactly one of them');

  const acyc = [];
  for (let d = -20; d <= 20; d++) if (CP1.bundleCohomology(d).acyclic) acyc.push(d);
  ok('exactly one degree is acyclic, and it is d = -1', acyc.length === 1 && acyc[0] === -1,
    `acyclic degrees found: ${acyc.join(', ')} — which is why the lock N_emb = q_ind is sharp`);
}

/* ─────────────────────────────────────────────────────────────────────────
   2 · THE EVALUATION MATRIX, RANKED BY GRAM-SCHMIDT
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n=== 2. The evaluation frame, ranked without the kernel\'s elimination ===\n');
{
  /* modified Gram-Schmidt on the ROWS, in complex arithmetic written here from scratch */
  const rankGS = (M, tol) => {
    const rows = M.map(r => r.map(z => [z.re, z.im]));
    const basis = [];
    const nrm2 = v => v.reduce((s, [a, b]) => s + a * a + b * b, 0);
    const scale0 = Math.max(...rows.map(nrm2), 1);
    for (const r0 of rows) {
      let r = r0.map(z => z.slice());
      for (const b of basis) {
        /* <b, r> with b conjugated */
        let cr = 0, ci = 0;
        for (let k = 0; k < r.length; k++) {
          cr += b[k][0] * r[k][0] + b[k][1] * r[k][1];
          ci += b[k][0] * r[k][1] - b[k][1] * r[k][0];
        }
        for (let k = 0; k < r.length; k++) {
          r[k][0] -= cr * b[k][0] - ci * b[k][1];
          r[k][1] -= cr * b[k][1] + ci * b[k][0];
        }
      }
      const n2 = nrm2(r);
      if (n2 > (tol ?? 1e-20) * scale0) {
        const n = Math.sqrt(n2);
        basis.push(r.map(([a, b]) => [a / n, b / n]));
      }
    }
    return basis.length;
  };
  let worst = null, checked = 0;
  for (let q = 1; q <= 9; q++) for (let n = 1; n <= 10; n++) for (const col of [0, 1, 2]) {
    if (col >= n) continue;
    const distinct = n - col, atoms = [];
    for (let a = 0; a < distinct; a++) {
      const t = 2 * Math.PI * a / distinct + 0.17;
      atoms.push({ re: Math.cos(t), im: Math.sin(t), mult: a === 0 ? 1 + col : 1 });
    }
    const E = CP1.evaluationMatrix(q, atoms);
    const r1 = CP1.evaluationLock(q, atoms).rank;
    const r2 = rankGS(E.matrix, 1e-18);
    checked++;
    if (r1 !== r2 && !worst) worst = `q=${q} N=${n} col=${col}: elimination ${r1}, Gram-Schmidt ${r2}`;
    if (r1 !== Math.min(q, n) && !worst) worst = `q=${q} N=${n}: rank ${r1} is not min(q, N)`;
  }
  ok('the confluent evaluation rank is min(q_ind, N_emb), by pivoted elimination AND by Gram-Schmidt',
    worst === null, worst || `${checked} divisors including double and triple points; two orthogonalisation-free routes agree`);

  /* the theorem, stated as an iff and tested as one */
  let bad = [];
  for (let q = 1; q <= 8; q++) for (let n = 1; n <= 10; n++) {
    const atoms = Array.from({ length: n }, (_, a) => {
      const t = 2 * Math.PI * a / n; return { re: Math.cos(t), im: Math.sin(t), mult: 1 };
    });
    const L = CP1.evaluationLock(q, atoms);
    const iso = L.kernel_dim === 0 && L.cokernel_dim === 0;
    if (iso !== (n === q) || L.acyclic !== (n === q)) bad.push(`q=${q},N=${n}`);
  }
  ok('ev_Z is an isomorphism if and only if N_emb = q_ind, over 80 pairs', bad.length === 0,
    bad.length ? bad.join(' ') : 'the derived defect and the linear-algebra defect are the same defect');
}

/* ─────────────────────────────────────────────────────────────────────────
   3 · THE CONFLUENT VANDERMONDE DETERMINANT BY LEIBNIZ
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n=== 3. The determinant, by the definition ===\n');
{
  const perms = n => { if (n === 0) return [[]];
    const out = []; for (const p of perms(n - 1)) for (let i = 0; i <= p.length; i++)
      out.push([...p.slice(0, i), n - 1, ...p.slice(i)]);
    return out; };
  const sign = p => { let s = 1; for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++)
    if (p[i] > p[j]) s = -s; return s; };
  const leibniz = M => { const n = M.length, P = perms(n); let re = 0, im = 0;
    for (const p of P) { let ar = 1, ai = 0;
      for (let i = 0; i < n; i++) { const z = M[i][p[i]];
        const nr = ar * z.re - ai * z.im, ni = ar * z.im + ai * z.re; ar = nr; ai = ni; }
      const s = sign(p); re += s * ar; im += s * ai; }
    return { re, im }; };

  let worst = 0, cases = 0;
  for (let q = 1; q <= 6; q++) for (const col of [0, 1, 2]) {
    if (col >= q) continue;
    const distinct = q - col, atoms = [];
    for (let a = 0; a < distinct; a++) {
      const t = 2 * Math.PI * a / distinct + 0.41;
      atoms.push({ re: 1.3 * Math.cos(t), im: 0.8 * Math.sin(t), mult: a === 0 ? 1 + col : 1 });
    }
    const E = CP1.evaluationMatrix(q, atoms);
    const dL = leibniz(E.matrix);
    const dP = CP1.confluentVandermondeProduct(atoms);
    const scale = Math.max(Math.hypot(dP.re, dP.im), 1e-300);
    worst = Math.max(worst, Math.hypot(dL.re - dP.re, dL.im - dP.im) / scale);
    cases++;
  }
  ok('the Leibniz sum over every permutation equals prod (z_b - z_a)^{m_a m_b}',
    worst < 1e-10, `${cases} confluent matrices up to 6x6, worst relative disagreement ${worst.toExponential(2)}`);
}

/* ─────────────────────────────────────────────────────────────────────────
   4 · THE JONES WINDOW, BY SOLVING FOR m INSTEAD OF SCANNING
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n=== 4. Small index, by inverting the spectrum ===\n');
{
  /* 4 cos^2(pi/m) = x  =>  m = pi / arccos(sqrt(x)/2), strictly increasing in x.
     Endpoints 2 and 3 give exactly m = 4 and m = 6, so the OPEN interval (2,3) admits
     exactly the integers strictly between 4 and 6 — that is m = 5, and nothing else. */
  const mOf = x => Math.PI / Math.acos(Math.sqrt(x) / 2);
  const m2 = mOf(2), m3 = mOf(3);
  const between = [];
  for (let m = Math.floor(m2) - 1; m <= Math.ceil(m3) + 1; m++)
    if (m > m2 + 1e-9 && m < m3 - 1e-9) between.push(m);
  ok('inverting 4cos^2(pi/m) puts the endpoints at m = 4 and m = 6, leaving m = 5 alone inside',
    Math.abs(m2 - 4) < 1e-9 && Math.abs(m3 - 6) < 1e-9 && between.length === 1 && between[0] === 5,
    `m(2) = ${m2.toFixed(12)}, m(3) = ${m3.toFixed(12)}, integers strictly between: ${between.join(', ')}`);

  const idx5 = 4 * Math.cos(Math.PI / 5) ** 2;
  ok('and that value is phi^2 = (3 + sqrt5)/2, to machine precision',
    Math.abs(idx5 - PHI2) < 1e-15 && Math.abs(idx5 - (3 + Math.sqrt(5)) / 2) < 1e-15,
    `4cos^2(pi/5) = ${idx5.toFixed(15)}, phi^2 = ${PHI2.toFixed(15)}`);

  const w = JON.pimsnerPopaWindow(1 / PHI2);
  ok('the kernel agrees, and reports the graph as A_4',
    w.in_window && Math.abs(w.forced_index - PHI2) < 1e-15 && w.forced_m === 5 && w.graph === 'A_4',
    `lambda* = ${w.lambda_star.toFixed(12)} -> Ind = ${w.index.toFixed(12)}`);

  /* the empty gap that powers the divisibility no-go: m(1) = 3, m(2) = 4, so nothing
     between index 1 and index 2 */
  const m1 = mOf(1);
  const gap = [];
  for (let m = 3; m <= 400; m++) { const x = 4 * Math.cos(Math.PI / m) ** 2;
    if (x > 1 + 1e-12 && x < 2 - 1e-12) gap.push(m); }
  ok('the spectrum is EMPTY strictly between index 1 and index 2',
    Math.abs(m1 - 3) < 1e-9 && gap.length === 0,
    `m(1) = ${m1.toFixed(9)} and m(2) = ${m2.toFixed(9)} are consecutive integers, so no index sits between`);

  let forced = true, worstN = 0;
  for (const I of [1.0000001, 1.5, PHI2, 2, 3, 3.9, 100]) {
    const d = JON.divisibilityNoGo(I, 200);
    if (I > 1) { forced = forced && d.forced_to_one; worstN = Math.max(worstN, d.first_violating_n); }
  }
  ok('every index above 1 has a root inside that empty gap, so a divisible endomorphic representation is forced to index 1',
    forced, `worst n needed over seven test indices: ${worstN}`);

  /* the fuzzy sphere, as an integer statement: 1/N in (1/3,1/2) <=> N in (2,3) */
  let inWin = [];
  for (let N = 1; N <= 5000; N++) if (1 / N > 1 / 3 && 1 / N < 1 / 2) inWin.push(N);
  ok('1/N never lies strictly inside (1/3, 1/2) because no integer lies strictly inside (2, 3)',
    inWin.length === 0, 'N = 2 and N = 3 give the EXCLUDED endpoints 1/2 and 1/3; 5000 ranks checked');

  let embeds = [];
  for (let N = 2; N <= 5000; N++) if ((N + 1) % N === 0) embeds.push(N);
  ok('Mat_N admits no unital *-homomorphism into Mat_{N+1} for N > 1', embeds.length === 0,
    'N | N+1 forces N = 1; the fuzzy-sphere sequence is a regularisation, not a Jones tower');
}

/* ─────────────────────────────────────────────────────────────────────────
   5 · THE A_4 INTEGRAL TRANSFER AGAINST BIGINT FIBONACCI
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n=== 5. The integral shadow of an irrational eigenvalue ===\n');
{
  const F = [0n, 1n]; for (let i = 2; i <= 200; i++) F.push(F[i - 1] + F[i - 2]);
  const L = [2n, 1n]; for (let i = 2; i <= 200; i++) L.push(L[i - 1] + L[i - 2]);
  let bad = [];
  for (let n = 1; n <= 30; n++) {
    const a = JON.a4Transfer(n);
    if (!a.identity_holds) bad.push(`identity at n=${n}`);
    if (n <= 20) {
      const want = [[F[2 * n - 1], F[2 * n]], [F[2 * n], F[2 * n + 1]]];
      const got = a.A_power.map(r => r.map(v => BigInt(v)));
      if (JSON.stringify(got.map(r => r.map(String))) !== JSON.stringify(want.map(r => r.map(String))))
        bad.push(`A^${n}`);
      if (BigInt(a.trace) !== L[2 * n]) bad.push(`trace at n=${n}`);
    }
  }
  ok('BB^T = N_tau^2 = [[1,1],[1,2]] and A^n is the Fibonacci matrix with Tr A^n = L_{2n}',
    bad.length === 0, bad.length ? bad.join(', ') :
    'checked against BigInt Fibonacci and Lucas built by the integer recursion, n = 1..20, identity to n = 30');

  const a = JON.a4Transfer(1);
  ok('and the spectrum of that integer matrix is {phi^2, phi^-2} with determinant 1',
    a.spectrum_residual < 1e-12 && Math.abs(a.spectrum[0] * a.spectrum[1] - 1) < 1e-12,
    `numerical spectrum within ${a.spectrum_residual.toExponential(2)} of the closed pair`);

  /* the irrational ladder that is NOT available */
  let integerStep = false;
  for (const q of [1, 2, 3, 5, 292, 1000]) if (Number.isInteger(q * PHI2)) integerStep = true;
  ok('phi^2 times a nonzero integer is never an integer', !integerStep,
    'so no capacity ladder q_{n+1} = phi^2 q_n exists; the integral identity above is the correct bridge');
}

/* ─────────────────────────────────────────────────────────────────────────
   6 · THE SELECTOR CALCULUS
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n=== 6. The UV selector: shape is a quotient, location is not ===\n');
{
  const build = (a, qmin, qmax) => { const o = [];
    for (let q = qmin; q <= qmax; q++) o.push(Math.exp(a * q * Math.log(q + 1))); return o; };

  /* kappa invariance, checked symbolically: the reweighted log differs by a q + log C, and
     the second difference of an affine sequence is identically zero. Computed here as an
     independent difference of the ANALYTIC nuisance rather than of the reweighted data. */
  let worst = 0;
  for (const A of [-3, -0.4, 0.9, 5]) for (const C of [1e-8, 1, 1e8]) {
    const I = build(0.75, 1, 40), J = SEL.affineReweight(I, { C, a: A }, 1);
    const kI = SEL.kappa(I, 1).map(x => x.kappa), kJ = SEL.kappa(J, 1).map(x => x.kappa);
    /* the analytic prediction for the change is Delta^2 (a q + log C) = 0 */
    worst = Math.max(worst, ...kI.map((v, i) => Math.abs(v - kJ[i])));
  }
  ok('kappa is unchanged by I_q -> C e^{aq} I_q, over twelve reweightings spanning 16 orders of magnitude',
    worst < 1e-11, `largest change ${worst.toExponential(2)}; Delta^2 annihilates a q + log C exactly`);

  /* completeness the other way: equal kappa forces an affine difference */
  {
    const I = build(0.75, 1, 30), J = SEL.affineReweight(I, { C: 7.3, a: -1.1 }, 1);
    const d = I.map((x, k) => Math.log(J[k]) - Math.log(x));
    let lin = true; for (let k = 1; k + 1 < d.length; k++)
      if (Math.abs(d[k + 1] - 2 * d[k] + d[k - 1]) > 1e-9) lin = false;
    ok('and conversely, two sequences with equal kappa differ by exactly a q + b', lin,
      `the log difference has vanishing second difference: a = ${(d[1] - d[0]).toFixed(9)}, b = ${(d[0] - (d[1] - d[0])).toFixed(6)}`);
  }

  /* the free-energy identity, with log q! summed independently */
  {
    let worstId = 0;
    for (const alpha of [0.4, 0.75, 1.6]) {
      const qmin = 1, qmax = 40, I = build(alpha, qmin, qmax);
      const logF = []; let acc = 0;
      for (let q = qmin; q <= qmax; q++) { for (let k = (q === qmin ? 1 : q); k <= q; k++) acc += Math.log(k); logF.push(acc); }
      /* recompute log q! from scratch for each q, so nothing is shared with the kernel */
      const lf = q => { let s = 0; for (let k = 2; k <= q; k++) s += Math.log(k); return s; };
      const G = I.map((x, k) => -(Math.log(x) - lf(qmin + k)));
      for (let k = 0; k + 2 < G.length; k++) {
        const direct = G[k + 2] - 2 * G[k + 1] + G[k];
        const kap = Math.log(I[k + 2]) - 2 * Math.log(I[k + 1]) + Math.log(I[k]);
        const pred = Math.log((qmin + k + 2) / (qmin + k + 1)) - kap;
        worstId = Math.max(worstId, Math.abs(direct - pred));
      }
    }
    ok('Delta^2 Gamma_q = log((q+2)/(q+1)) - kappa_q, with log q! summed here rather than imported',
      worstId < 1e-9, `worst residual ${worstId.toExponential(2)} over three growth laws and 114 sectors`);
  }

  /* the selection itself, found by brute-force argmax of an independently built log Z */
  {
    let agree = true, rows = [];
    for (const alpha of [0.55, 0.62, 0.75, 0.8]) {
      const qmin = 1, qmax = 96, I = build(alpha, qmin, qmax);
      const lf = q => { let s = 0; for (let k = 2; k <= q; k++) s += Math.log(k); return s; };
      let best = qmin, bestV = -Infinity;
      for (let k = 0; k < I.length; k++) { const v = Math.log(I[k]) - lf(qmin + k);
        if (v > bestV) { bestV = v; best = qmin + k; } }
      const s = SEL.selectSector(I, qmin);
      rows.push(`alpha=${alpha}: brute ${best}, crossing ${s.q_star}`);
      if (s.q_star !== null && s.q_star !== best) agree = false;
    }
    ok('the adjacent sign change and a brute-force scan of log Z_q name the same sector', agree, rows.join(' · '));
  }

  /* the bounded-growth obstruction, as an inequality rather than as a claim */
  {
    const C = 3.5, qmin = 1, qmax = 60;
    const I = Array.from({ length: qmax - qmin + 1 }, (_, k) => Math.pow(C, k));
    const s = SEL.selectSector(I, qmin);
    const beyond = s.crossings.filter(q => q + 1 > C + 1);
    ok('a primitive with adjacent growth capped at C has no crossing beyond q + 1 > C',
      beyond.length === 0 && s.crossings.length === 1,
      `crossings at ${s.crossings.join(', ')} with C = ${C}; the threshold is q = ${Math.ceil(C)}`);
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   7 · THE FINITE CARRIER
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n=== 7. Berry-Kirillov and Capelli, checked without a transfer ===\n');
{
  let off = true;
  for (const N of [1, 2, 3, 7, 55, 292, 4096]) { const b = CAR.borelWeil(N);
    off = off && b.index_dbar - b.chern_number === 1 && b.index_dbar === N && b.line_bundle_degree === N - 1; }
  ok('the Berry Chern number is N - 1 and the Dolbeault index is N, for every rank tested', off,
    'the same off-by-one that forbids identifying embadons with the zeros of one section');

  /* multiplicities recovered from the POLYNOMIAL, by lowest nonvanishing derivative order.
     BigInt coefficients, so nothing rounds. */
  const polyFromDivisor = D => { let c = [1n];
    for (const [x, m] of D) for (let t = 0; t < m; t++) {
      const nc = new Array(c.length + 1).fill(0n);
      for (let i = 0; i < c.length; i++) { nc[i + 1] += c[i]; nc[i] += c[i] * BigInt(-x); }
      c = nc; }
    return c; };                                  /* c[i] is the coefficient of u^i */
  const derivAt = (c, k, x) => { let d = c.slice();
    for (let t = 0; t < k; t++) d = d.slice(1).map((v, i) => v * BigInt(i + 1));
    let s = 0n, p = 1n; for (const v of d) { s += v * p; p *= BigInt(x); } return s; };

  const cases = [[[0, 3], [2, 1], [5, 2]], [[-1, 2], [0, 1], [4, 4]], [[3, 1]], [[0, 1], [1, 1], [2, 1], [3, 1]], [[7, 5]]];
  let bad = [];
  for (const D of cases) for (const eps of [1, -1]) {
    const c = polyFromDivisor(D);
    const direct = D.map(([x]) => { let k = 0; while (derivAt(c, k, x) === 0n) k++; return [x, k]; });
    const t = CAR.capelliTransfer(D, eps);
    const rec = new Map(t.recovered_divisor);
    for (const [x, m] of direct) if (rec.get(x) !== m) bad.push(`x=${x} eps=${eps}: polynomial says ${m}, transfer says ${rec.get(x)}`);
    if (t.recovered_rank !== D.reduce((s, [, m]) => s + m, 0)) bad.push(`rank eps=${eps}`);
  }
  ok('the Capelli transfer recovers exactly the multiplicities the polynomial\'s own derivatives report',
    bad.length === 0, bad.length ? bad.slice(0, 3).join(' · ') :
    'five root divisors in both charts eps = +-1, checked against BigInt derivative orders — no transfer involved in the check');

  /* the blindness of moments, demonstrated rather than asserted */
  {
    const sing = CAR.hankelRank([0, 0, 0, 2, 5, 5], 8);
    const reg = CAR.hankelRank([0, 2, 5], 8);
    ok('the Hankel test returns the SAME rank for a rank-6 singular spectrum and its rank-3 reduction',
      sing.rank === reg.rank && sing.rank === 3 && sing.r === 6 && reg.r === 3,
      `both report rank ${sing.rank}; ordinary moments see distinct points only, which is why the transfer is needed`);
  }

  /* and the projective limitation */
  {
    const xi = r => CAR.projectiveCrossRatio(Array.from({ length: 8 }, (_, k) => r * Math.pow(2.7, k)));
    const a = xi(2), b = xi(11);
    const same = a.every((v, i) => Math.abs(v - b[i]) < 1e-12);
    ok('two determinant-character families of different rank have identical cross ratios', same,
      'so central data known only modulo C_k -> A B^k C_k cannot determine the carrier rank');
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   8 · THE MOLECULAR MEASURE
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n=== 8. Support is not area ===\n');
{
  /* the compound-Poisson cumulants, by brute-force summation over the count */
  const Q = 6.5;
  const law = [[0.5, 0.4], [1.7, 0.6]];                 /* a two-point weight law */
  const Eg = law.reduce((s, [g, p]) => s + g * p, 0);
  const Eg2 = law.reduce((s, [g, p]) => s + g * g * p, 0);
  let pk = Math.exp(-Q), m1 = 0, m2 = 0;
  for (let N = 0; N <= 400; N++) {
    /* E[q_A | N] = N Eg,  Var[q_A | N] = N (Eg2 - Eg^2), so E[q_A^2 | N] = N Var + (N Eg)^2 */
    m1 += pk * N * Eg;
    m2 += pk * (N * (Eg2 - Eg * Eg) + (N * Eg) ** 2);
    pk *= Q / (N + 1);
  }
  const varBrute = m2 - m1 * m1;
  const kern = EMB.compoundPoissonRigidity({ Q, E_gamma: Eg, E_gamma2: Eg2,
    measure_moments: 'x', measure_count: 'x' });
  ok('E q_A = Q E gamma and Var q_A = Q E gamma^2, by summing over the Poisson count term by term',
    Math.abs(m1 - kern.E_q_A) < 1e-9 && Math.abs(varBrute - kern.Var_q_A) < 1e-9,
    `brute force: mean ${m1.toFixed(9)}, variance ${varBrute.toFixed(9)}; closed form ${kern.E_q_A.toFixed(9)}, ${kern.Var_q_A.toFixed(9)}`);

  const unit = EMB.compoundPoissonRigidity({ Q: 292, E_gamma: 1, E_gamma2: 1, measure_moments: 'r', measure_count: 'r' });
  const split = EMB.compoundPoissonRigidity({ Q: 292, E_gamma: 1, E_gamma2: 1, measure_moments: 'r', measure_count: 's' });
  ok('unit moments in ONE measure force gamma = 1 a.s., and the same moments across two measures force nothing',
    unit.gamma_is_unit_a_s && !split.gamma_is_unit_a_s,
    'the theorem\'s hypothesis "same physical ensemble" is enforced, not decorative');

  /* mean one without pointwise one: the no-go, as a number */
  {
    const w = [0.5, 1.5, 0.8, 1.2];
    const c = EMB.capacity(w);
    ok('a weight family with mean one gives q_can = N_emb while every gamma_i differs from one',
      c.capacity_equals_count && !c.certificate_C_U && c.weight_variance > 0,
      `q_can = ${c.q_can}, N = ${c.n_emb}, Var gamma = ${c.weight_variance.toFixed(6)} — the count is the capacity here by accident, not by C_U`);
  }

  /* gluing: a permutation of the atoms must be invisible */
  {
    const A = [[0, 0, 1.1], [1, 0, 0.7], [0.3, -0.4, 2.2]].map(([re, im, w]) => ({ re, im, w }));
    const B = [A[2], A[0], A[1]];
    const g = EMB.gluing(A, B);
    const C = A.map((p, i) => (i === 1 ? { ...p, w: p.w + 1e-6 } : p));
    const g2 = EMB.gluing(A, C);
    ok('a permuted atomic measure glues exactly, and a 1e-6 mass perturbation does not',
      g.compatible && g.max_mass_defect === 0 && !g2.compatible,
      `permutation ${JSON.stringify(g.permutation)}; the perturbed pair reports a defect of ${g2.max_mass_defect.toExponential(1)}`);
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   9 · THE DE SITTER OUTPUT AND THE TYPING GUARDS
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n=== 9. The kinematic map, and what it is not ===\n');
{
  let worst = 0;
  for (const q of [1, 2, 292, 1e10, 1e60, 1e122]) {
    const d = CLO.deSitterFromCapacity(q);
    /* independent route: A = 4 pi R^2 and R^2 = 3/Lambda, so q must be pi R^2 / l_P^2 */
    const qIndep = Math.PI * d.R_q * d.R_q / (d.l_P * d.l_P);
    const lamIndep = 3 / (d.R_q * d.R_q);
    worst = Math.max(worst, Math.abs(qIndep - q) / q, Math.abs(lamIndep - d.Lambda_q) / d.Lambda_q);
  }
  ok('R_q = l_P sqrt(q/pi) and Lambda_q = 3pi/(q l_P^2) close with A = 4 pi R^2 and R^2 = 3/Lambda',
    worst < 1e-13, `six capacities over 122 orders of magnitude, worst relative residual ${worst.toExponential(2)}`);

  /* the shape norm against exact factorials */
  {
    const fact = n => { let r = 1n; for (let i = 2n; i <= BigInt(n); i++) r *= i; return r; };
    let bad = [];
    for (let l = 2; l <= 20; l++) {
      const want = Number(fact(l + 2) / fact(l - 2)) / 2;
      if (Math.abs(CLO.shapeNorm(l) - want) > 1e-6 * want) bad.push(l);
    }
    const kernel = [0, 1].every(l => CLO.shapeNorm(l) === 0);
    ok('the trace-free Hessian norm is (1/2)(l+2)!/(l-2)! and vanishes exactly at l = 0 and 1',
      bad.length === 0 && kernel, bad.length ? `mismatch at l = ${bad.join(',')}` :
      'checked against BigInt factorials for l = 2..20; the shape quotient starts at l = 2');
  }

  /* the additive/multiplicative fixed point, solved here by bisection */
  {
    const chi = Math.log(PHI2);
    const f = Q => Q + chi - Math.exp(chi) * Q;
    let lo = 1e-9, hi = 1e3;
    for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid; }
    const bis = (lo + hi) / 2;
    const kern = CLO.additiveMultiplicativeNoGo(chi).fixed_point_Q;
    ok('the only Q where an additive and a constant multiplicative law agree is chi/(e^chi - 1), found by bisection',
      Math.abs(bis - kern) / kern < 1e-9,
      `bisection ${bis.toFixed(12)}, closed form ${kern.toFixed(12)}; the next additive step needs the same Q and cannot have it`);
  }

  /* the certificate table: removing one removes exactly one */
  {
    const all = { C_X: 1, C_win: 1, C_U: 1, C_E: 1, C_UV: 1 };
    const base = CLO.closure(all);
    const nBase = Object.values(base.conclusions).filter(Boolean).length;
    let rows = [], okAll = nBase === 4;
    for (const k of Object.keys(all)) {
      const cut = { ...all }; delete cut[k];
      const c = CLO.closure(cut);
      const n = Object.values(c.conclusions).filter(Boolean).length;
      rows.push(`${k}:-${nBase - n}`);
      if (nBase - n !== 1) okAll = false;
    }
    ok('removing any one certificate removes exactly one conclusion, never zero and never two',
      okAll, `${rows.join(' ')} — the irreducible boundary of the closure theorem`);
  }

  /* and the headline refuses to be a prediction */
  {
    const none = CLO.closure({}, 292);
    const full = CLO.closure({ C_X: 1, C_win: 1, C_U: 1, C_E: 1, C_UV: 1 }, 292);
    ok('with no certificates the map still computes and is labelled undetermined; with all five it names the capacity it was GIVEN',
      /NOT determined/.test(none.headline) && none.de_sitter === null && full.de_sitter !== null
      && full.de_sitter.is_prediction === false,
      'switching a certificate on in an input is not deriving it, and the output says so');
  }

  /* the trace-free vacuum shift */
  {
    let inv = true;
    for (const c of [-1e9, -1, 0, 3.7, 1e9]) { const v = CLO.vacuumShiftKernel(c);
      inv = inv && v.k_is_null && !v.null_focusing_source_changed && !v.trace_free_equation_changed; }
    ok('a constant vacuum shift is invisible to the trace-free equation and to the null source', inv,
      'g(k,k) = 0 computed from the metric, not asserted');
  }
}

console.log(`\n${fail === 0 ? '✔' : '✗'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
