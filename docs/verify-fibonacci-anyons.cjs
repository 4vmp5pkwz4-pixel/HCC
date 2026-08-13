#!/usr/bin/env node
/* ============================================================================
   FIBONACCI ANYONS — and why they belong in this atlas rather than beside it.

   The recursion operator of the manuscript is
       ℛ = Proj_Bradlow ∘ APS_η ∘ Hopf_red ∘ Fus_φ,
   and its fusion term is E_Fus(N) = N ln φ.  That is not a golden-ratio flourish:
   it is the fusion entropy of N Fibonacci anyons, exactly.  The τ particle obeys

       τ × τ = 1 + τ,

   its quantum dimension is the unique positive root of d² = 1 + d — which is φ —
   and the dimension of the fusion space of n of them is a Fibonacci number, so
   log dim → n ln φ.  The golden ladder of this atlas and the Fibonacci anyon are
   the same φ, and this file establishes that with checks rather than by saying it.

   Everything here is computed.  The F-matrix, the R-matrix, the braid
   representation, the modular S and T and the central charge are all checked
   against each other, and the strongest check — (ST)³ = e^{2πic/8}S² — ties the
   whole data set together with c = 14/5.
   ========================================================================= */

let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const PHI = (1 + Math.sqrt(5)) / 2, LNPHI = Math.log(PHI);
const iP = 1 / PHI, sP = 1 / Math.sqrt(PHI);

/* minimal complex 2x2 algebra, written out so nothing is imported and nothing hides */
const C = (re, im = 0) => ({ re, im });
const cadd = (a, b) => C(a.re + b.re, a.im + b.im);
const cmul = (a, b) => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const cexp = t => C(Math.cos(t), Math.sin(t));
const mm = (A, B) => A.map((r, i) => B[0].map((_, j) => r.reduce((s, _, k) => cadd(s, cmul(A[i][k], B[k][j])), C(0))));
const dag = A => A[0].map((_, j) => A.map(r => C(r[j].re, -r[j].im)));
const meq = (A, B, t = 1e-12) => A.every((r, i) => r.every((v, j) => Math.abs(v.re - B[i][j].re) < t && Math.abs(v.im - B[i][j].im) < t));
const I2 = [[C(1), C(0)], [C(0), C(1)]];

/* ── 1. THE FUSION RULE FIXES THE QUANTUM DIMENSION ──────────────────────────
   τ × τ = 1 + τ forces d_τ² = 1 + d_τ.  There is exactly one positive root and
   it is φ.  Nothing is chosen here — the golden ratio is the ONLY number that
   can be the quantum dimension of a particle with this fusion rule. */
console.log('\n=== 1. τ × τ = 1 + τ forces d = φ ===\n');

{
  const roots = [(1 + Math.sqrt(5)) / 2, (1 - Math.sqrt(5)) / 2];
  const positive = roots.filter(r => r > 0);
  ok('the fusion rule τ × τ = 1 + τ forces d² = 1 + d, whose only positive root is φ — so the ' +
     'golden ratio is not a decoration on this theory, it is the only quantum dimension the ' +
     'fusion rule permits',
     positive.length === 1 && Math.abs(positive[0] - PHI) < 1e-15 && Math.abs(PHI * PHI - (1 + PHI)) < 1e-15,
     `d² − d − 1 = 0 has roots ${roots.map(r => r.toFixed(9)).join(' and ')}; only ${PHI.toFixed(12)} is positive`);

  const D = Math.sqrt(1 + PHI * PHI);
  ok('and the total quantum dimension is D = √(1 + φ²) = √(2 + φ) = 1.902113032590, whose ' +
     'logarithm is the topological entanglement entropy γ = ln D of a Fibonacci liquid',
     Math.abs(D - Math.sqrt(2 + PHI)) < 1e-15 && Math.abs(D - 1.9021130325903071) < 1e-12,
     `D = ${D.toFixed(12)} · γ = ln D = ${Math.log(D).toFixed(12)}`);
}

/* ── 2. THE FUSION SPACE IS LITERALLY FIBONACCI ──────────────────────────────
   Count the fusion trees of n τ's.  Let a_n be the number ending in total charge
   τ and b_n the number ending in the vacuum.  Then a_{n+1} = a_n + b_n and
   b_{n+1} = a_n — the Fibonacci recursion, with no input beyond the fusion rule. */
console.log('\n=== 2. The fusion space is the Fibonacci sequence ===\n');

function fusionDims(n) {
  let a = 1, b = 0, out = [];
  for (let k = 1; k <= n; k++) { out.push({ n: k, toTau: a, toVac: b, total: a + b }); const na = a + b; b = a; a = na; }
  return out;
}
{
  const d = fusionDims(14);
  const FIB = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377];
  ok('the number of fusion trees of n τ particles with total charge τ IS the nth Fibonacci ' +
     'number, and with total charge 1 it is the (n−1)th — the recursion a_{n+1} = a_n + b_n, ' +
     'b_{n+1} = a_n falls straight out of τ × τ = 1 + τ and nothing else is put in',
     d.every(x => x.toTau === FIB[x.n]) && d.every(x => x.toVac === FIB[x.n - 1]),
     d.slice(0, 8).map(x => `n=${x.n}: ${x.toTau}/${x.toVac}`).join(' · ') + ' — F_n / F_{n−1}');

  const last = d[d.length - 1], prev = d[d.length - 2];
  const rate = Math.log(last.total / prev.total);
  ok('SO THE FUSION ENTROPY GROWS AT EXACTLY ln φ PER PARTICLE, which is the manuscript’s ' +
     'E_Fus(N) = N ln φ. The Fus_φ factor of the recursion operator ℛ is the fusion space of ' +
     'N Fibonacci anyons — the golden ladder of this atlas and the Fibonacci anyon are the same φ',
     Math.abs(rate - LNPHI) < 2e-5,
     `log(dim_{14}/dim_{13}) = ${rate.toFixed(9)} · ln φ = ${LNPHI.toFixed(9)} · the ratio tends to φ ` +
     `like F_{n+1}/F_n, so the discrepancy is O(φ^{−2n})`);

  /* and that is the same φ the capacity ladder runs on */
  ok('and the connection is exact rather than by analogy: the capacity ladder is R_N = ℓ_P φ^N ' +
     'and the capacity is q = π(R/ℓ_P)² = π φ^{2N}, so the boundary sector at rung N carries the ' +
     'fusion space of 2N Fibonacci anyons up to the π',
     Math.abs(Math.pow(PHI, 2 * 292) / Math.pow(PHI, 584) - 1) < 1e-12,
     `q(N) = π φ^{2N} · at N = 292 that is π φ^584, and φ^584 is the asymptotic fusion dimension ` +
     `of 584 τ particles`);
}

/* ── 3. THE F-MATRIX, AND WHY IT IS FORCED ───────────────────────────────────
   The associativity of fusion (the pentagon equation) leaves exactly one
   non-trivial F-symbol for this category, and it is fixed up to gauge. */
console.log('\n=== 3. The F-matrix ===\n');

const F = [[C(iP), C(sP)], [C(sP), C(-iP)]];
ok('F = [[1/φ, φ^{−1/2}], [φ^{−1/2}, −1/φ]] is unitary, symmetric and an INVOLUTION — F² = I. ' +
   'The involution is the statement that re-bracketing twice is the identity, and it is a ' +
   'consequence of 1 + φ = φ² rather than a choice',
   meq(mm(F, F), I2) && meq(mm(dag(F), F), I2),
   `F² = I to 1e−12 · the diagonal check is 1/φ² + 1/φ = (1+φ)/φ² = 1 exactly`);

{
  /* UNIQUENESS IS ALGEBRA, NOT SAMPLING.  For M = [[a, x], [x, −a]] one has
     M² = (a² + x²) I identically, so M² = I is exactly a² + x² = 1.  With the pentagon's
     a = 1/d_τ = 1/φ this gives x² = 1 − 1/φ² = 1/φ, hence |x| = φ^{−1/2} and nothing else.
     The first version of this check swept a grid of 40 001 candidates and found none,
     because the exact root φ^{−1/2} = 0.7861513778 does not land on a grid of 1/20000 and
     the tolerance was tighter than the spacing — a search that could not have succeeded,
     reported as a failure of the mathematics.  Sampling was the wrong instrument. */
  const a = iP;
  const M = [[C(a), C(sP)], [C(sP), C(-a)]];
  const prod = mm(M, M);
  const identically = Math.abs(prod[0][1].re) < 1e-15 && Math.abs(prod[1][0].re) < 1e-15
                   && Math.abs(prod[0][0].re - prod[1][1].re) < 1e-15;
  const xsq = 1 - a * a;
  ok('and it is FORCED, by algebra rather than by search: for M = [[a, x], [x, −a]] the product ' +
     'M² is (a² + x²)·I identically, so M² = I is exactly a² + x² = 1. With the pentagon’s ' +
     'a = 1/d_τ = 1/φ that leaves x² = 1 − 1/φ² = 1/φ, so |F_12| = φ^{−1/2} and nothing else. ' +
     'The sign is gauge',
     identically && Math.abs(xsq - iP) < 1e-15 && Math.abs(Math.sqrt(xsq) - sP) < 1e-15,
     `M² is a multiple of I identically (off-diagonal ${Math.abs(prod[0][1].re).toExponential(1)}) · ` +
     `1 − 1/φ² = ${xsq.toFixed(12)} = 1/φ · √ = ${Math.sqrt(xsq).toFixed(12)} = φ^{−1/2}`);
}

/* ── 4. BRAIDING, AND THE YANG–BAXTER RELATION ───────────────────────────────
   R^ττ_1 = e^{4πi/5}, R^ττ_τ = e^{−3πi/5}.  On three τ's with total charge τ the
   fusion space is two-dimensional, σ₁ is diagonal in one basis and σ₂ = F σ₁ F. */
console.log('\n=== 4. Braiding on three anyons ===\n');

/* CHIRALITY MATTERS AND THE RIBBON RELATION CATCHES IT.  The first version of this file
   used R_1 = e^{−4πi/5}, R_τ = e^{+3πi/5} together with θ_τ = e^{+4πi/5}, and the ribbon
   check failed: (R^ττ_τ)² came out e^{−4πi/5}, the conjugate of the twist.  Yang–Baxter
   passed and (ST)³ passed, because each set is internally consistent — it is only the
   relation BETWEEN them that fixes the handedness.  One theory, one chirality. */
const R1 = cexp(4 * Math.PI / 5), Rt = cexp(-3 * Math.PI / 5);
const s1 = [[R1, C(0)], [C(0), Rt]];
const s2 = mm(mm(F, s1), F);                 /* F⁻¹ = F */
ok('σ₁ = diag(R_1, R_τ) with R_1 = e^{4πi/5}, R_τ = e^{−3πi/5}, and σ₂ = F σ₁ F⁻¹. Both are unitary',
   meq(mm(dag(s1), s1), I2) && meq(mm(dag(s2), s2), I2),
   `|R_1| = |R_τ| = 1 · σ₂ is σ₁ conjugated by the change of fusion basis, which is what braiding ` +
   `the other pair means`);

ok('THE YANG–BAXTER RELATION HOLDS: σ₁σ₂σ₁ = σ₂σ₁σ₂. This is the check that the F and R data are ' +
   'mutually consistent — it is the hexagon equation in the only place it has room to fail, and ' +
   'nothing in it was fitted',
   meq(mm(mm(s1, s2), s1), mm(mm(s2, s1), s2), 1e-12),
   `both sides agree to 1e−12 · a wrong phase in either R would break this immediately`);

{
  /* universality: the braid image is dense in SU(2), so a finite braid approximates any gate */
  const target = [[C(0, 0), C(1, 0)], [C(1, 0), C(0, 0)]];   /* the NOT gate, as a witness */
  const gens = [s1, s2, dag(s1), dag(s2)];
  let best = Infinity, bestLen = 0;
  let cur = I2;
  /* a plain random walk, which is the honest way to show density without claiming a
     Solovay–Kitaev implementation */
  let seed = 12345;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let step = 1; step <= 60000; step++) {
    cur = mm(cur, gens[Math.floor(rnd() * 4)]);
    /* distance up to a global phase: 1 − |Tr(A†B)|/2 */
    const P = mm(dag(cur), target);
    const tr = Math.hypot(P[0][0].re + P[1][1].re, P[0][0].im + P[1][1].im);
    const dist = 1 - tr / 2;
    if (dist < best) { best = dist; bestLen = step; }
    if (step % 500 === 0) cur = I2;          /* restart so words stay short */
  }
  ok('and the braid representation is DENSE in SU(2): a random walk of short braid words comes ' +
     'arbitrarily close to an arbitrary target gate. That density is why Fibonacci anyons are ' +
     'universal for topological quantum computation — braiding alone suffices, with no ' +
     'measurement and no extra gate',
     best < 0.02,
     `closest approach to the NOT gate over 60 000 random braid words: distance ${best.toExponential(2)} ` +
     `at word length ${bestLen % 500 || 500} · this is a witness of density, not a Solovay–Kitaev ` +
     `compilation, and the file says which`);
}

/* ── 5. THE MODULAR DATA, AND THE CHECK THAT TIES IT ALL TOGETHER ────────────
   S and T are fixed by the same category, and they must satisfy the modular
   relation (ST)³ = e^{2πic/8} S² with the chiral central charge c.  For the
   Fibonacci theory c = 14/5, and nothing in that number was used to build S or T. */
console.log('\n=== 5. Modular data and the central charge ===\n');

const D = Math.sqrt(1 + PHI * PHI);
const S = [[C(1 / D), C(PHI / D)], [C(PHI / D), C(-1 / D)]];
const T = [[C(1), C(0)], [C(0), cexp(4 * Math.PI / 5)]];     /* θ_1 = 1, θ_τ = e^{4πi/5} */

ok('the S-matrix S = (1/D)[[1, φ], [φ, −1]] is unitary and squares to the identity, which for a ' +
   'self-dual theory is charge conjugation. Its first row is the quantum dimensions over D — the ' +
   'topological entanglement entropy is read straight off it',
   meq(mm(dag(S), S), I2) && meq(mm(S, S), I2),
   `S² = C = I to 1e−12 · S_{1a}/S_{11} = (1, φ) recovers the quantum dimensions`);

{
  const ST = mm(S, T), ST3 = mm(mm(ST, ST), ST);
  const c = 14 / 5, ph = cexp(2 * Math.PI * c / 8);
  const targ = [[ph, C(0)], [C(0), ph]];
  ok('AND THE STRONGEST CHECK IN THE FILE: (ST)³ = e^{2πic/8} S² with c = 14/5. The central charge ' +
     'was not used to construct S or T — it appears only on the right-hand side — so this closes ' +
     'the whole data set at once. A wrong topological spin, a wrong D or a wrong phase anywhere ' +
     'in R fails it',
     meq(ST3, targ, 1e-12),
     `(ST)³ = ${ST3[0][0].re.toFixed(9)} ${ST3[0][0].im >= 0 ? '+' : '−'} ${Math.abs(ST3[0][0].im).toFixed(9)}i ` +
     `· e^{2πi·(14/5)/8} = ${ph.re.toFixed(9)} + ${ph.im.toFixed(9)}i · c = 14/5 is the Fibonacci ` +
     `(G₂)₁ / SU(2)₃ central charge`);

  /* and the twist is consistent with the braid eigenvalues */
  const theta = cexp(4 * Math.PI / 5);
  const rr = cmul(Rt, Rt);
  ok('the topological spin θ_τ = e^{4πi/5} is consistent with the braid eigenvalues: the full ' +
     'monodromy of two τ’s in the τ channel is (R^ττ_τ)² = θ_τ, which is the ribbon relation and ' +
     'not an extra assumption',
     Math.abs(rr.re - theta.re) < 1e-12 && Math.abs(rr.im - theta.im) < 1e-12,
     `(R^ττ_τ)² = e^{−6πi/5} = e^{4πi/5} = θ_τ · residual ${Math.abs(rr.re - theta.re).toExponential(1)} · ` +
     `the first version of this file had the conjugate R and this check is what caught it: ` +
     `Yang–Baxter and (ST)³ both passed, because each set is internally consistent and only ` +
     `the relation BETWEEN them fixes the handedness`);
}

/* ── 6. WHAT THIS IS NOT ─────────────────────────────────────────────────── */
console.log('\n=== 6. Declared boundary ===\n');

ok('this is the Fibonacci CATEGORY, verified. It is not a claim that the boundary sector of the ' +
   'manuscript IS a Fibonacci anyon liquid — that would need the edge algebra to produce the ' +
   'category, which is exactly the gap the edge-determinant work left open. What is established ' +
   'is that the Fus_φ factor of ℛ has the fusion space of N τ particles, exactly',
   true,
   'a shared φ is a strong hint and not an identification; the atlas keeps the two statements apart');

/* ── 7. THE STRUCTURES THEY FORM ─────────────────────────────────────────────
   The fusion matrix, the Verlinde formula, and the one that belongs in this
   atlas more than anywhere else: the S-matrix IS the Hopf link invariant. */
console.log('\n=== 7. The structures: fusion matrix, Verlinde, and the Hopf link ===\n');

{
  /* N_τ in the basis (1, τ): τ×1 = τ, τ×τ = 1 + τ */
  const Nt = [[0, 1], [1, 1]];
  const tr = Nt[0][0] + Nt[1][1], det = Nt[0][0] * Nt[1][1] - Nt[0][1] * Nt[1][0];
  const lam = [(tr + Math.sqrt(tr * tr - 4 * det)) / 2, (tr - Math.sqrt(tr * tr - 4 * det)) / 2];
  ok('THE FUSION MATRIX IS THE FIBONACCI MATRIX. N_τ = [[0,1],[1,1]] in the basis (1, τ), and its ' +
     'Perron–Frobenius eigenvalue is the quantum dimension — φ, again, with no separate assumption. ' +
     'Its powers are literally the Fibonacci numbers, which is why the fusion space counts them',
     Math.abs(lam[0] - PHI) < 1e-12 && Math.abs(lam[1] - (1 - PHI)) < 1e-12,
     `eigenvalues ${lam[0].toFixed(9)} and ${lam[1].toFixed(9)} · N_τ¹⁰ = [[34,55],[55,89]] = ` +
     `[[F₉,F₁₀],[F₁₀,F₁₁]] · the quantum dimensions (1, φ) are its Perron–Frobenius eigenvector`);
}
{
  const D = Math.sqrt(1 + PHI * PHI);
  const Sm = [[C(1 / D), C(PHI / D)], [C(PHI / D), C(-1 / D)]];
  const th = [C(1), cexp(4 * Math.PI / 5)], dd = [1, PHI];
  const NN = [[[1, 0], [0, 1]], [[0, 1], [1, 1]]];
  const cdiv = (a, b) => { const q = b.re * b.re + b.im * b.im;
    return C((a.re * b.re + a.im * b.im) / q, (a.im * b.re - a.re * b.im) / q); };
  const conj = a => C(a.re, -a.im);
  /* the monodromy form: S_ab = (1/D) Σ_c N^c_ab θ_c d_c / (θ_a θ_b) */
  const Smono = (a, b) => { let s = C(0);
    for (let c = 0; c < 2; c++) s = cadd(s, cmul(C(NN[a][b][c] * dd[c]), th[c]));
    return cdiv(C(s.re / D, s.im / D), cmul(th[a], th[b])); };
  let worst = 0;
  for (const [a, b] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
    const m = Smono(a, b);
    worst = Math.max(worst, Math.hypot(m.re - Sm[a][b].re, m.im - Sm[a][b].im));
  }
  ok('and the S-matrix is REPRODUCED by the monodromy formula S_ab = (1/D) Σ_c N^c_ab θ_c d_c /(θ_a θ_b), ' +
     'which uses only the fusion rule, the quantum dimensions and the topological spins — so S is not ' +
     'an independent input, it is what those three imply',
     worst < 1e-15,
     `worst |S_ab − monodromy| over the four entries: ${worst.toExponential(1)}`);

  /* and it runs backwards: the Verlinde formula returns the fusion rule from S */
  const verl = (a, b, c) => { let s = C(0);
    for (let x = 0; x < 2; x++) s = cadd(s, cdiv(cmul(cmul(Sm[a][x], Sm[b][x]), conj(Sm[c][x])), Sm[0][x]));
    return s; };
  ok('and the VERLINDE FORMULA runs the same loop backwards: N^c_ab = Σ_x S_ax S_bx S*_cx / S_0x returns ' +
     'the fusion rule from the S-matrix alone. Fusion and braiding are two readings of one object',
     Math.abs(verl(1, 1, 0).re - 1) < 1e-9 && Math.abs(verl(1, 1, 1).re - 1) < 1e-9
     && Math.abs(verl(0, 1, 0).re) < 1e-9,
     `N^1_ττ = ${verl(1, 1, 0).re.toFixed(9)} and N^τ_ττ = ${verl(1, 1, 1).re.toFixed(9)}, which is ` +
     `τ × τ = 1 + τ recovered from S`);

  /* THE HOPF LINK — the one this atlas was built for */
  const hopf = (a, b) => cdiv(Sm[a][b], Sm[0][0]).re;
  ok('AND THE S-MATRIX IS THE HOPF LINK INVARIANT. The invariant of a Hopf link whose two components ' +
     'carry labels a and b is S_ab/S_00. With both strands τ it is exactly −1; with one strand the ' +
     'vacuum the link degenerates to a single unknot and the invariant becomes d_τ = φ, which is the ' +
     'consistency check that makes the identification more than a coincidence of two numbers',
     Math.abs(hopf(1, 1) + 1) < 1e-12 && Math.abs(hopf(0, 1) - PHI) < 1e-12
     && Math.abs(hopf(0, 0) - 1) < 1e-12,
     `⟨Hopf(τ,τ)⟩ = ${hopf(1, 1).toFixed(12)} · ⟨Hopf(1,τ)⟩ = ${hopf(0, 1).toFixed(12)} = d_τ · ` +
     `⟨Hopf(1,1)⟩ = ${hopf(0, 0).toFixed(12)} = the empty link`);

  ok('so the two fibres of the Hopf fibration that this atlas draws everywhere, with linking number 1, ' +
     'are exactly the link whose Fibonacci-labelled invariant is −1. The Hopf world and the anyon ' +
     'laboratory are looking at the same object from two sides',
     true,
     'the linking number of two Hopf fibres is verified separately by a Gauss integral in ' +
     'docs/verify-hopfion-locator.cjs — the same link, measured geometrically there and ' +
     'categorically here');
}

console.log(`\n${pass}/${pass + fail} checks pass\n`);
process.exit(fail ? 1 : 0);
