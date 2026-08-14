#!/usr/bin/env node
/* ============================================================================
   WHERE ELSE THIS NUMBER IS, AND WHY

   φ appears in a dozen places in this atlas and they are not all the same kind of
   appearance.  Some are the SAME EQUATION wearing different clothes; one is an
   exact integer identity that holds only because a structural ansatz was declared;
   one is a famous theorem this file quotes rather than proves; and at least one
   nearby number is a coincidence that gets refused.

   Telling those apart is the whole point.  A census that says "φ is everywhere,
   how deep" is worth nothing; a census that says WHICH KIND each appearance is,
   and can be checked, is a map.

     1. ONE EQUATION.  d = 1 + 1/d and d² = d + 1 are the same statement, and it
        is simultaneously the fusion rule of a τ anyon and the continued fraction
        [1;1,1,1,…].  The first gives the quantum dimension; the second makes φ
        the WORST-APPROXIMABLE irrational there is.  Same equation, two theorems.

     2. THE INFLATION MATRIX IS THE FUSION MATRIX.  The Fibonacci quasicrystal's
        substitution a→ab, b→a has abelianisation [[1,1],[1,0]], which is N_τ up
        to a relabelling of the basis.  So the tile-length ratio of the tiling and
        the quantum dimension of the anyon are the same eigenvalue.

     3. ZECKENDORF IS THE FUSION TREE.  "No two adjacent" is one condition, and
        the basis of the fusion space is in explicit bijection with the Zeckendorf
        representations of an interval of integers.

     4. THE LADDER IS DECLARED.  R_N = ℓ_P φ^N is the manuscript's ansatz.  The
        identity dim Fus(2N) = round(φ(q/π)/√5) is exact — CONDITIONAL on it.
   ========================================================================= */

let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const PHI = (1 + Math.sqrt(5)) / 2;

/* ── 1. ONE EQUATION, TWO THEOREMS ───────────────────────────────────────── */
console.log('\n=== 1. The fusion rule and the continued fraction are one equation ===\n');
{
  /* the fusion rule: quantum dimensions multiply, so τ×τ = 1+τ gives d² = 1 + d */
  const fromFusion = (1 + Math.sqrt(1 + 4)) / 2;
  /* the continued fraction [1;1,1,…] is the fixed point of x ↦ 1 + 1/x */
  let x = 1; for (let i = 0; i < 200; i++) x = 1 + 1 / x;
  ok('d² = 1 + d AND d = 1 + 1/d ARE THE SAME EQUATION, and that single equation is both the ' +
    'fusion rule of a τ anyon and the continued fraction [1;1,1,1,…]. Every other appearance of φ ' +
    'in this atlas is downstream of one of those two readings of it',
    Math.abs(fromFusion - PHI) < 1e-15 && Math.abs(x - PHI) < 1e-15,
    `from τ×τ = 1+τ: d = ${fromFusion.toFixed(15)} · from x ↦ 1 + 1/x: ${x.toFixed(15)} · ` +
    `φ = ${PHI.toFixed(15)} · multiply the first by d and the two lines are the same characters`);

  /* the Lagrange number: how badly a number resists rational approximation.
     L(α) = limsup 1/(q²|α − p/q|); the SMALLER L, the harder to approximate.
     Hurwitz: L(α) ≥ √5 for every irrational, with equality only for φ and its equivalents. */
  /* The convergents are built from the EXACT continued-fraction terms, not by iterating
     y ↦ 1/(y − ⌊y⌋) on a double: that recurrence loses a digit per step and by the twentieth
     term it was inventing partial quotients, which put L(φ) at 2.2371 instead of √5 and sent
     L(√2) to Infinity by hitting an exact convergent. The expansions are periodic and known:
     φ = [1;1,1,…], √2 = [1;2,2,…], √3 = [1;1,2,1,2,…]. */
  function lagrange(alpha, cf, terms) {
    let p0 = 1, q0 = 0, p1 = cf(0), q1 = 1; const seq = [];
    for (let i = 1; i <= terms; i++) {
      const a = cf(i);
      const p2 = a * p1 + p0, q2 = a * q1 + q0;
      p0 = p1; q0 = q1; p1 = p2; q1 = q2;
      /* q must stay small enough that a double still resolves α − p/q, which is of order
         1/(L q²) and SHRINKS as q grows: at q = 75,025 the gap is 8e−11 and the epsilon of
         1.6 is 2.2e−16, so the relative error is 2.8e−6 — which is exactly the discrepancy
         a q-cap of 10⁵ produced. The limit is reached long before precision runs out. */
      if (q1 > 1e4) break;
      /* the limsup over the TAIL. Not the max over everything — that picks up the early
         convergents and put L(φ) 2.4e−3 above √5. And not the last value either: for a
         continued fraction that is eventually constant (φ, √2) the sequence converges, but
         √3 = [1;1,2,1,2,…] OSCILLATES, and the last value gave √3 instead of 2√3. */
      seq.push(1 / (q1 * q1 * Math.abs(alpha - p1 / q1)));
    }
    /* two is enough: it covers the period-2 oscillation of √3 without reaching back to
       convergents that have not settled, which a tail of eight did */
    return Math.max(...seq.slice(-2));
  }
  const Lphi = lagrange(PHI, () => 1, 60);
  const L2 = lagrange(Math.SQRT2, i => (i === 0 ? 1 : 2), 60);
  const L3 = lagrange(Math.sqrt(3), i => (i === 0 ? 1 : (i % 2 ? 1 : 2)), 60);
  ok('AND THAT MAKES φ THE WORST-APPROXIMABLE NUMBER THERE IS. Its Lagrange number is √5 = 2.2360, ' +
    'the smallest any irrational can have (Hurwitz), because every partial quotient of [1;1,1,…] is ' +
    '1 — the convergents advance as slowly as convergents can. √2 sits at 2√2 and √3 higher still. ' +
    'This is the SECOND theorem from the first equation, and it is why the golden torus is the last ' +
    'to break in the KAM laboratory: the same number, for a reason that has nothing to do with fusion',
    Math.abs(Lphi - Math.sqrt(5)) < 1e-6 && Math.abs(L2 - 2*Math.SQRT2) < 1e-5 && Math.abs(L3 - 2*Math.sqrt(3)) < 1e-5 && L2 > Lphi && L3 > L2,
    `L(φ) = ${Lphi.toFixed(9)} against √5 = ${Math.sqrt(5).toFixed(9)} · L(√2) = ${L2.toFixed(6)} = 2√2 · ` +
    `L(√3) = ${L3.toFixed(6)} · smaller means harder to approximate, and no irrational goes below √5 · ` +
    `2√2 = ${(2*Math.SQRT2).toFixed(6)}`);
}

/* ── 2. THE INFLATION MATRIX IS THE FUSION MATRIX ────────────────────────── */
console.log('\n=== 2. The quasicrystal and the anyon share a matrix ===\n');
{
  const N_tau = [[0, 1], [1, 1]];                 /* fusion matrix in the basis (1, τ) */
  const M_inf = [[1, 1], [1, 0]];                 /* abelianisation of a→ab, b→a */
  const charPoly = M => [1, -(M[0][0] + M[1][1]), M[0][0] * M[1][1] - M[0][1] * M[1][0]];
  const cN = charPoly(N_tau), cM = charPoly(M_inf);
  /* the swap P = [[0,1],[1,0]] conjugates one into the other, exactly */
  const mul = (A, B) => [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
                         [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]];
  const P = [[0, 1], [1, 0]];
  const conj = mul(mul(P, M_inf), P);
  const same = conj.flat().every((v, i) => v === N_tau.flat()[i]);

  ok('THE FIBONACCI QUASICRYSTAL AND THE FIBONACCI ANYON SHARE ONE MATRIX. The tiling’s substitution ' +
    'a → ab, b → a has abelianisation [[1,1],[1,0]], and conjugating by the basis swap gives ' +
    'N_τ = [[0,1],[1,1]] EXACTLY — not a similar matrix, the same matrix in the other order. So the ' +
    'tile-length ratio of a quasicrystal and the quantum dimension of an anyon are one eigenvalue',
    same && cN.every((v, i) => v === cM[i]),
    `P·[[1,1],[1,0]]·P = [[${conj[0]}],[${conj[1]}]] = N_τ · characteristic polynomial ` +
    `λ² − λ − 1 for both · Perron root φ = ${PHI.toFixed(12)}`);

  /* and the tile ratio really is φ: iterate the substitution and count */
  let s = 'a';
  for (let i = 0; i < 24; i++) s = s.split('').map(c => c === 'a' ? 'ab' : 'a').join('');
  const na = (s.match(/a/g) || []).length, nb = s.length - na;
  ok('and the ratio is φ in the tiling itself, not only in its matrix: iterate the substitution ' +
    'twenty-four times and count the two tiles. The ratio of long to short tiles converges to φ, ' +
    'which is the same statement as the Perron eigenvalue and is worth seeing as a count',
    Math.abs(na / nb - PHI) < 1e-4,
    `after 24 inflations: ${na} long, ${nb} short, ratio ${(na / nb).toFixed(9)} · φ = ${PHI.toFixed(9)} · ` +
    `the word has ${s.length} tiles and its length is a Fibonacci number`);
}

/* ── 3. ZECKENDORF IS THE FUSION TREE ────────────────────────────────────── */
console.log('\n=== 3. "No two adjacent" is one condition ===\n');
{
  const FIB = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];
  /* the fusion basis: labels x_1 … x_n, x_1 = τ, no two adjacent vacua (0 = vacuum) */
  function basis(n) {
    const out = [];
    const rec = s => { if (s.length === n) { out.push(s.slice()); return; }
      if (s[s.length - 1] === 0) rec([...s, 1]); else { rec([...s, 1]); rec([...s, 0]); } };
    rec([1]); return out;
  }
  /* Zeckendorf: every integer is uniquely a sum of NON-CONSECUTIVE Fibonacci numbers */
  function zeck(n) {
    const out = []; let i = FIB.length - 1;
    while (n > 0) { while (FIB[i] > n) i--; out.push(i); n -= FIB[i]; i -= 2 < 0 ? 0 : 2; }
    return out;
  }
  let bijOK = true, adjacent = 0, uniq = new Set();
  const n = 12, B = basis(n);
  for (const b of B) {
    /* read the string as a Zeckendorf code: a τ after a vacuum contributes its Fibonacci */
    let v = 0;
    for (let i = 1; i < n; i++) if (b[i] === 0) v += FIB[i - 1];
    uniq.add(v);
    for (let i = 1; i < n; i++) if (b[i] === 0 && b[i - 1] === 0) adjacent++;
  }
  bijOK = uniq.size === B.length;
  ok('THE FUSION-SPACE BASIS IS IN BIJECTION WITH ZECKENDORF REPRESENTATIONS, because both are the ' +
    'same combinatorial condition: no two adjacent. Reading each basis vector’s vacua as a set of ' +
    'Fibonacci indices gives a DISTINCT integer for every one of the 233 basis vectors of twelve ' +
    'anyons, and the non-adjacency that makes Zeckendorf unique is the fusion rule 1 × τ = τ',
    bijOK && adjacent === 0 && B.length === FIB[11],
    `n = 12: ${B.length} basis vectors = F₁₃ · ${uniq.size} distinct Zeckendorf values · ` +
    `strings with two adjacent vacua: ${adjacent} · the uniqueness theorem and the fusion rule are ` +
    `the same "no two adjacent" applied to the same recursion`);

  const z = zeck(100);
  ok('and Zeckendorf’s own theorem is checked rather than assumed on the side: 100 = 89 + 8 + 3, ' +
    'indices with no two adjacent',
    z.reduce((s, i) => s + FIB[i], 0) === 100 && z.every((v, i) => i === 0 || z[i - 1] - v >= 2),
    `100 = ${z.map(i => FIB[i]).join(' + ')} · indices ${z.join(', ')} · gaps ≥ 2 throughout`);
}

/* ── 4. WHICH APPEARANCES ARE DERIVED AND WHICH ARE DECLARED ─────────────── */
console.log('\n=== 4. The census, with its kinds ===\n');
{
  const CENSUS = [
    ['anyon · quantum dimension', 'derived', 'τ×τ = 1+τ forces d² = 1+d; φ is the only positive root'],
    ['anyon · total dimension D', 'derived', 'D = √(1+φ²) = √(2+φ), and γ = ln D is the topological entropy'],
    ['golden chain · e_∞', 'derived', 'the ground state energy density is exactly 2φ − 4 = −2/φ²'],
    ['quasicrystal · tile ratio', 'derived', 'the same matrix [[0,1],[1,1]], the same Perron root'],
    ['Zeckendorf · uniqueness', 'derived', 'the same no-two-adjacent condition on the same recursion'],
    ['φ · worst-approximable', 'derived', 'L(φ) = √5 exactly, the smallest Lagrange number any irrational can have — proved above'],
    ['KAM · the last torus', 'quoted', 'φ is worst-approximable (proved above); that its torus survives longest is Greene/Aubry, quoted'],
    ['FBS3R · R_N = ℓ_P φ^N', 'declared', 'a structural ansatz of the manuscript — NOT derived by anything in this atlas'],
    ['FBS3R · dim Fus(2N)', 'conditional', 'dim = round(φ(q/π)/√5) is exact GIVEN the declared ansatz']
  ];
  const kinds = {}; for (const [, k] of CENSUS) kinds[k] = (kinds[k] || 0) + 1;
  ok('SO THE CENSUS HAS FOUR KINDS, and the atlas states which is which rather than letting a shared ' +
    'number imply a shared cause: five DERIVED appearances, one QUOTED theorem, one DECLARED ansatz, ' +
    'and one identity that is exact only CONDITIONAL on that ansatz. "φ is everywhere" is worth ' +
    'nothing; "φ is here for this reason and there for that one" is a map',
    kinds.derived === 6 && kinds.quoted === 1 && kinds.declared === 1 && kinds.conditional === 1,
    CENSUS.map(([w, k]) => `${k.toUpperCase()}: ${w}`).join('\n         '));

  /* and a near-miss that is refused rather than reported */
  const near = 2 * Math.cos(Math.PI / 5);
  ok('one identity that LOOKS like a coincidence and is not: 2cos(π/5) = φ exactly. It is the same ' +
    'number because the fifth roots of unity satisfy the same quadratic — which is also why the ' +
    'topological spin θ_τ = e^{4πi/5} lives at a fifth root and why the central charge is 14/5',
    Math.abs(near - PHI) < 1e-15,
    `2cos(36°) = ${near.toFixed(15)} · φ = ${PHI.toFixed(15)} · the pentagon, the fusion rule and ` +
    `the fifth roots of unity are one algebraic fact seen from three sides`);

  const three_pi4 = 3 * Math.pow(Math.PI, 4);
  ok('and one that IS a coincidence and is refused, kept here so the two cases sit side by side: ' +
    '3π⁴ = 292.2273 is within 0.08% of the shell integer 292, and 0.08% is nowhere near close ' +
    'enough for an integer. A census that accepts this one has stopped being a census',
    Math.abs(three_pi4 - 292) > 0.2,
    `3π⁴ = ${three_pi4.toFixed(6)} · |3π⁴ − 292| = ${Math.abs(three_pi4 - 292).toFixed(6)} · refused`);
}

console.log(`\n${pass}/${pass + fail} checks pass\n`);
process.exit(fail ? 1 : 0);
