/* ── THE FINITE CARRIER: BERRY-KIRILLOV AND CAPELLI-HARISH-CHANDRA ───────────
   Sections VI and VII of the manuscript.

   Two independent diagnostics for the same integer N, and the reason to have both is that
   neither is allowed to be an alias for the molecular count.

   The GEOMETRIC route is Borel-Weil: the spin-J coherent-state orbit is CP^1, the
   highest-weight character has weight 2J = N-1, the Berry line is O(N-1), and the Chern
   number and the analytic index differ by exactly one. That off-by-one is the same
   structure that forbids identifying embadons with the zeros of one section — it is not a
   coincidence and this module reports them side by side.

   The CENTRAL route is Capelli: ordinary moments see only DISTINCT spectral points, so a
   Hankel rank test is blind at a singular central character. The rational transfer
   R_eps(u) = P(u+eps)/P(u) is not: its divisor is tau_{-eps} D_P - D_P, the difference
   operator is injective on finite divisors, and multiplicities come back exactly by
   m_n = -sum_{j>=n} d_j. That is a collision-safe rank certificate and the Hankel test is
   not, which is why both are here and why they are compared.

   And the limitation is computed too: central data known only modulo C_k -> A B^k C_k has
   normalisation-free cross ratios, and a determinant-character family r m^k has the SAME
   cross ratios for different r. One absolute rank-sensitive datum is unavoidable. */

/* ── Berry-Kirillov ──────────────────────────────────────────────────────── */

/* V_N = Sym^{N-1} C^2 = H^0(CP^1, O(N-1)) at the round polarisation. Everything below is
   one integer and its consequences; the content is that they are DIFFERENT integers. */
export function borelWeil(N) {
  if (!Number.isInteger(N) || N < 1) throw new RangeError('N must be a positive integer');
  return {
    N, spin_J: (N - 1) / 2,
    carrier: `V_N = Sym^{${N - 1}} C^2 = H^0(CP^1, O(${N - 1}))`,
    line_bundle_degree: N - 1,
    chern_number: N - 1,                        /* (1/2 pi i) ∫ F = N - 1 */
    index_dbar: N,                              /* dim H^0 = N */
    off_by_one: 1,
    endomorphism_algebra: `Mat_${N}(C)`,
    dim_endomorphisms: N * N,
    /* the Atiyah extension has a nonzero curvature defect for N > 1, so the degree cannot
       be produced by relabelling a classically split algebra */
    atiyah_curvature_integral: N - 1,
    classically_splittable: N === 1,
    note: 'exact inside the SELECTED carrier; the integer N must be an output of a CIVP ' +
      'reduction, not an alias for N_emb'
  };
}

/* the polarisation groupoid: a generic orientation-preserving diffeomorphism transports
   the complex structure rather than acting inside one fixed K_q, and the dimension is the
   invariant of the functor */
export function polarisationTransport(N, nObjects = 1) {
  return { N, objects: nObjects, dim_Q_N: N,
    dimension_is_invariant: true,
    fixed_polarisation_obstruction:
      'pullback maps H^0(S^2_J, L) -> H^0(S^2_{f_*J}, f_*L), not into itself',
    consequence: 'a representation of the full superrotation group on one fixed K_q needs ' +
      'polarisation transport or a deformed algebra' };
}

/* ── Stinespring leakage ─────────────────────────────────────────────────── */

/* Q(a) = V* pi(a) V with V*V = 1 and K = 1 - VV*, so exactly
     Q(ab) - Q(a)Q(b) = V* pi(a) K pi(b) V.
   Multiplicativity on a subalgebra is the vanishing of those matrix elements, and this
   gives a FINITE diagnostic for any proposed CIVP-to-matrix reduction rather than a hope
   that the finite product is the continuum one.

   The concrete instance computed here is a compression: pi acts on C^d, V is the isometry
   onto the first k coordinates. Then K is the projector onto the discarded block and the
   leakage is the off-block coupling, which is what it should be. */
export function stinespringLeakage(A, B, k) {
  const d = A.length;
  if (!Number.isInteger(k) || k < 1 || k > d) throw new RangeError('k must index a subspace of C^d');
  const mm = (X, Y) => X.map((r, i) => Y[0].map((_, j) => r.reduce((s, v, t) => s + v * Y[t][j], 0)));
  const compress = X => Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => X[i][j]));
  const AB = mm(A, B);
  const lhs = compress(AB);
  const rhs = mm(compress(A), compress(B));
  /* the identity's own right-hand side: V* A K B V with K = 1 - VV* */
  const K = Array.from({ length: d }, (_, i) => Array.from({ length: d }, (_, j) => (i === j && i >= k ? 1 : 0)));
  const viaK = compress(mm(mm(A, K), B));
  let defect = 0, viaKdefect = 0;
  for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
    defect = Math.max(defect, Math.abs(lhs[i][j] - rhs[i][j]));
    viaKdefect = Math.max(viaKdefect, Math.abs(lhs[i][j] - rhs[i][j] - viaK[i][j]));
  }
  return { d, k, leakage_norm: defect, identity_residual: viaKdefect,
    multiplicative: defect <= 1e-12,
    formula: 'Q(ab) - Q(a)Q(b) = V* pi(a) K pi(b) V, K = 1 - VV*',
    verdict: defect <= 1e-12
      ? 'the compression is multiplicative on this pair — no leakage'
      : 'the finite product differs from the continuum product; the defect is exactly the K term' };
}

/* ── Hankel rank for regular spectra ─────────────────────────────────────── */

/* m_k = (1/r) sum x_alpha^k, H^{(s)} = (m_{i+j}), and rank H^{(s)} = min(r, s+1) for r
   pairwise distinct points, because H = (1/r) V V^T with V Vandermonde.

   This is exactly the test that goes blind at a singular character: it counts DISTINCT
   points, not multiplicities. */
export function hankelRank(points, s) {
  const x = Array.from(points, Number);
  const distinct = [...new Set(x.map(v => v.toFixed(12)))].length;
  const r = x.length;
  const m = [];
  for (let k = 0; k <= 2 * s + 1; k++) m.push(x.reduce((acc, v) => acc + Math.pow(v, k), 0) / r);
  const H = Array.from({ length: s + 1 }, (_, i) => Array.from({ length: s + 1 }, (_, j) => m[i + j]));
  /* rank by real Gaussian elimination with a scale-aware tolerance */
  const M = H.map(row => row.slice());
  const big = Math.max(...M.flat().map(Math.abs), 1);
  const tol = big * (s + 1) * 1e-11;
  let rank = 0;
  for (let c = 0, row = 0; c <= s && row <= s; c++) {
    let p = row; for (let t = row + 1; t <= s; t++) if (Math.abs(M[t][c]) > Math.abs(M[p][c])) p = t;
    if (Math.abs(M[p][c]) <= tol) continue;
    [M[row], M[p]] = [M[p], M[row]];
    for (let t = row + 1; t <= s; t++) { const f = M[t][c] / M[row][c];
      for (let q = c; q <= s; q++) M[t][q] -= f * M[row][q]; }
    row++; rank++;
  }
  return { r, distinct_points: distinct, s, moments: m.slice(0, 2 * s + 2), hankel: H,
    rank, predicted_rank: Math.min(distinct, s + 1),
    matches: rank === Math.min(distinct, s + 1),
    sees_multiplicities: false,
    blind_spot: distinct < r
      ? `this spectrum has ${r} points but only ${distinct} distinct values — the Hankel test ` +
        `reports ${Math.min(distinct, s + 1)} and cannot recover the multiplicities`
      : 'the spectrum is regular here, so the moment test is faithful' };
}

/* ── Capelli transfer and multiplicity recovery ──────────────────────────── */

/* P_r(u) = prod (u - x)^{m_x}, R_eps(u) = P(u+eps)/P(u), div R_eps = tau_{-eps} D_P - D_P.
   On one lattice orbit, d_n = m_{n+1} - m_n and m_n = -sum_{j>=n} d_j.

   The reconstruction is exact and collision safe. It also proves the injectivity claim
   constructively: a nonzero finite divisor cannot be translation invariant, because the
   orbit of a point would be infinite. */
export function capelliTransfer(rootDivisor, eps = 1) {
  if (eps !== 1 && eps !== -1) throw new RangeError('the transfer chart uses eps = +1 or -1');
  const D = new Map();
  for (const [x, m] of rootDivisor) {
    const k = Number(x);
    if (!Number.isInteger(Math.round(k * 1e9) / 1e9)) { /* non-lattice points are their own orbit */ }
    D.set(k, (D.get(k) || 0) + Math.round(Number(m)));
  }
  const r = [...D.values()].reduce((s, m) => s + m, 0);
  /* divisor of R_eps: a root of multiplicity m at x gives a pole of multiplicity m at x
     and a zero of the same multiplicity at x - eps */
  const div = new Map();
  for (const [x, m] of D) {
    div.set(x - eps, (div.get(x - eps) || 0) + m);
    div.set(x, (div.get(x) || 0) - m);
  }
  for (const [k, v] of [...div]) if (v === 0) div.delete(k);
  /* Reconstruction, orbit by orbit. The lattice orbit is the fractional part of the value:
     points that differ by an integer multiple of eps see each other's telescoping sum and
     points that do not are independent.

     THE DIRECTION IS NOT A CONVENTION. For eps = +1 the transfer coefficient at v is
     d_v = m_{v+1} - m_v, so the telescoping sum runs UPWARD and m_n = -sum_{j>=n} d_j. For
     eps = -1 it is d_v = m_{v-1} - m_v and the sum runs DOWNWARD, m_n = -sum_{j<=n} d_j.
     The first version of this function summed upward in both charts, and the eps = -1
     reconstruction came back wrong for every divisor with more than one atom. */
  const orbits = new Map();
  for (const x of new Set([...D.keys(), ...div.keys()])) {
    const lab = (x - Math.round(x)).toFixed(9);
    if (!orbits.has(lab)) orbits.set(lab, []);
    orbits.get(lab).push(x);
  }
  const recovered = new Map();
  for (const [, pts] of orbits) {
    const idx = pts.map(x => Math.round(x)).sort((a, b) => a - b);
    const lo = idx[0] - 2, hi = idx[idx.length - 1] + 2;
    const frac = pts[0] - Math.round(pts[0]);
    for (let n = lo; n <= hi; n++) {
      let m = 0;
      if (eps === 1) for (let j = hi; j >= n; j--) m -= (div.get(j + frac) || 0);
      else for (let j = lo; j <= n; j++) m -= (div.get(j + frac) || 0);
      if (m !== 0) recovered.set(n + frac, m);
    }
  }
  const exact = [...D].every(([x, m]) => recovered.get(x) === m)
    && [...recovered].every(([x, m]) => (D.get(x) || 0) === m);
  const rRec = [...recovered.values()].reduce((s, m) => s + m, 0);
  return {
    eps, rank: r, root_divisor: [...D].sort((a, b) => a[0] - b[0]),
    transfer_divisor: [...div].sort((a, b) => a[0] - b[0]),
    recovered_divisor: [...recovered].sort((a, b) => a[0] - b[0]),
    recovered_rank: rRec,
    reconstruction_exact: exact && rRec === r,
    sees_multiplicities: true,
    difference_operator_injective: true,
    why: 'a nonzero finite divisor invariant under a nonzero integral translation would have ' +
      'an infinite orbit, so tau_{-eps} - 1 has trivial kernel on finite divisors'
  };
}

/* ── The projective rank no-go ───────────────────────────────────────────── */

/* Xi_k(C) = C_{k+1} C_{k-1} / C_k^2 is invariant under C_k -> A B^k C_k, and it CLASSIFIES
   the nonzero projective shape completely. What it omits is an absolute datum: the family
   z_k = r m^k has cross ratio 1 for every r, so central data known only up to reweighting
   cannot in general determine the carrier rank. */
export function projectiveCrossRatio(C) {
  const c = Array.from(C, Number);
  if (c.length < 3) throw new RangeError('a cross ratio needs three adjacent terms');
  const xi = [];
  for (let k = 1; k + 1 < c.length; k++) xi.push(c[k + 1] * c[k - 1] / (c[k] * c[k]));
  return xi;
}

export function projectiveRankNoGo(ranks = [2, 3, 5], m = 2, terms = 6) {
  const families = ranks.map(r => ({ r, C: Array.from({ length: terms }, (_, k) => r * Math.pow(m, k)) }));
  const ratios = families.map(f => ({ r: f.r, xi: projectiveCrossRatio(f.C) }));
  const allOne = ratios.every(x => x.xi.every(v => Math.abs(v - 1) < 1e-12));
  return { m, families: ratios, all_cross_ratios_equal: allOne,
    ranks_distinguished: false,
    conclusion: 'a determinant-character family r m^k has identical projective ratios for every r; ' +
      'one absolute rank-sensitive datum is necessary',
    absolute_data_that_would_suffice: ['a visible defining block', 'the degree of a full Capelli transfer',
      'a zero-order multiplicity', 'a rotation-cover parity'] };
}

/* the finite-rank gate, as a checklist that returns which clauses are satisfied rather
   than a boolean that hides which one failed */
export function capelliGate(flags = {}) {
  const clauses = [
    ['raw_family_N_independent', 'an N-independent raw family of central observables from CIVP data'],
    ['branch_correct_carrier', 'a branch-correct finite deformation or isotypic carrier'],
    ['absolute_rank_datum', 'a full Capelli/Harish-Chandra transfer or another absolute rank-sensitive datum'],
    ['admissibility', 'real-form, unitarity and lattice admissibility'],
    ['uniqueness', 'uniqueness of the admissible integer N']
  ];
  const rows = clauses.map(([k, text]) => ({ clause: k, statement: text, satisfied: !!flags[k] }));
  return { rows, satisfied: rows.filter(r => r.satisfied).length, total: rows.length,
    gate_passes: rows.every(r => r.satisfied),
    status: rows.every(r => r.satisfied) ? 'the central branch yields N noncircularly'
      : 'the Capelli branch is a precise extraction TARGET, not a completed identification' };
}

export const CARRIER_EQUATIONS = Object.freeze([
  'V_N ≃ Sym^{N-1} C^2 ≃ H^0(CP^1, O(N-1)), N = 2J + 1',
  'c_1(L_N)[CP^1] = N - 1,  ind dbar_{L_N} = N',
  'Q(ab) - Q(a)Q(b) = V* pi(a) K pi(b) V,  K = 1 - VV*',
  'm_k = (1/r) sum x^k,  H^{(s)} = (m_{i+j}),  rank H = min(r, s+1)',
  'R_eps(u) = P_r(u + eps)/P_r(u),  div R_eps = tau_{-eps} D_P - D_P',
  'd_n = m_{n+1} - m_n,  m_n = -sum_{j>=n} d_j',
  'Xi_k = C_{k+1} C_{k-1} / C_k^2 is invariant under C_k -> A B^k C_k'
]);
