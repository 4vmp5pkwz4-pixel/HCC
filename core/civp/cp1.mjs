/* ── THE CP^1 INDEX SPACE AND THE ACYCLIC MOLECULAR LOCK ─────────────────────
   Section V of the manuscript, computed rather than quoted.

   The cleanest exact statement in the whole construction is here, and it is worth saying
   precisely what it is NOT. It is not "the molecular support equals the index dimension".
   It is: the residual complex RГ(CP^1, L_q(-Z)) vanishes IF AND ONLY IF N_emb = q_ind,
   and that equivalence is a theorem about a line bundle, not a statement about gravity.
   Whether the physical embadon support realises the evaluation frame is certificate C_E,
   which no computation in this file supplies.

   Two independent routes are computed for every claim that has two:

     · sheaf cohomology  h^0(O(d)) = max(d+1,0), h^1(O(d)) = max(-d-1,0)
     · the evaluation matrix, whose rank and kernel are found by elimination

   and their disagreement is returned. A locking theorem verified only against itself is
   not verified.

   NOTHING HERE IMPORTS NODE. The browser observatory loads this module directly, so the
   picture and the number are the same code rather than two transcriptions of it. */
import { C, abs, mul, sub, scale } from '../math/complex.mjs';
import { rankProfile, det, matrixTolerance } from '../math/cmatrix.mjs';

/* ── Riemann-Roch on the line ────────────────────────────────────────────── */

/* the only two numbers a line bundle on CP^1 has, and the reason the lock is sharp:
   they vanish TOGETHER at exactly one degree, d = -1 */
export function bundleCohomology(d) {
  const h0 = Math.max(d + 1, 0), h1 = Math.max(-d - 1, 0);
  return { degree: d, h0, h1, euler: h0 - h1, acyclic: h0 === 0 && h1 === 0 };
}

/* L_q = O(q_ind - 1), so dim K_q = q_ind and ind dbar = deg + 1 = q_ind */
export function carrierSpace(qInd) {
  if (!Number.isInteger(qInd) || qInd < 1) throw new RangeError('q_ind must be a positive integer');
  return { q_ind: qInd, bundle_degree: qInd - 1, dim_K_q: qInd, index_dbar: qInd,
    /* the off-by-one that kills the naive identification: a section of O(q-1) has q-1
       zeros, so embadons cannot be the zeros of one state */
    zero_divisor_degree: qInd - 1 };
}

/* the residual bundle L_q(-Z) ≃ O(q_ind - 1 - N_emb) and its exact defect */
export function residualComplex(qInd, nEmb) {
  const d = qInd - 1 - nEmb;
  const coh = bundleCohomology(d);
  const delta = qInd - nEmb;
  return { q_ind: qInd, n_emb: nEmb, residual_degree: d,
    h0: coh.h0, h1: coh.h1, delta_lock: delta, euler_characteristic: coh.euler,
    acyclic: coh.acyclic,
    /* the three regimes of Theorem "Residual acyclicity", named rather than inferred */
    regime: nEmb < qInd ? 'underdetermined — the frame does not span'
          : nEmb > qInd ? 'overdetermined — the frame has relations'
          : 'acyclic — the evaluation map is an isomorphism' };
}

/* ── The evaluation frame ────────────────────────────────────────────────── */

/* A divisor is a list of points with multiplicities. Collisions are not a degenerate case
   to be avoided: the whole point of the derived formulation is that a double point is a
   jet and the defect does not notice. */
export function normaliseDivisor(atoms) {
  if (!Array.isArray(atoms) || !atoms.length) throw new RangeError('a divisor needs at least one atom');
  const out = [];
  for (const a of atoms) {
    const re = Number(a.re ?? a[0] ?? 0), im = Number(a.im ?? a[1] ?? 0);
    const m = Math.round(Number(a.mult ?? a.m ?? a[2] ?? 1));
    if (!Number.isFinite(re) || !Number.isFinite(im)) throw new RangeError('divisor points must be finite');
    if (m < 1) throw new RangeError('an effective divisor has positive multiplicities');
    const hit = out.find(p => Math.hypot(p.re - re, p.im - im) < 1e-12);
    if (hit) hit.mult += m; else out.push({ re, im, mult: m });
  }
  return { atoms: out, support: out.length, degree: out.reduce((s, p) => s + p.mult, 0) };
}

/* The confluent evaluation matrix in the affine chart: rows are divided derivatives
   (1/j!) d^j at each support point, columns are the monomial basis 1, z, ..., z^{q-1}
   of K_q. Divided rather than plain derivatives, so the determinant is the classical
   confluent Vandermonde product and not that product times a pile of factorials. */
export function evaluationMatrix(qInd, divisor) {
  const Z = normaliseDivisor(divisor.atoms ? divisor.atoms : divisor);
  const rows = [];
  const label = [];
  for (const p of Z.atoms) {
    const z = C(p.re, p.im);
    for (let j = 0; j < p.mult; j++) {
      const row = [];
      for (let k = 0; k < qInd; k++) {
        if (k < j) { row.push(C(0, 0)); continue; }
        /* binom(k, j) z^{k-j} — the divided derivative of z^k */
        let b = 1;
        for (let t = 0; t < j; t++) b = b * (k - t) / (t + 1);
        let zp = C(1, 0);
        for (let t = 0; t < k - j; t++) zp = mul(zp, z);
        row.push(scale(zp, b));
      }
      rows.push(row);
      label.push({ point: { re: p.re, im: p.im }, jet_order: j });
    }
  }
  return { matrix: rows, rows: label, divisor: Z, cols: qInd };
}

/* the closed product for the confluent Vandermonde determinant, so the elimination has
   something independent to be checked against */
export function confluentVandermondeProduct(divisor) {
  const Z = normaliseDivisor(divisor.atoms ? divisor.atoms : divisor);
  let acc = C(1, 0);
  for (let b = 0; b < Z.atoms.length; b++)
    for (let a = 0; a < b; a++) {
      const diff = sub(C(Z.atoms[b].re, Z.atoms[b].im), C(Z.atoms[a].re, Z.atoms[a].im));
      const e = Z.atoms[a].mult * Z.atoms[b].mult;
      for (let t = 0; t < e; t++) acc = mul(acc, diff);
    }
  return acc;
}

/* THE THEOREM, BOTH WAYS AT ONCE.
   Route one is sheaf cohomology of the residual bundle. Route two is the rank of the
   evaluation matrix. They are different computations and they must agree; the amount by
   which they do not is returned as a residual rather than asserted to be zero. */
export function evaluationLock(qInd, divisor) {
  const E = evaluationMatrix(qInd, divisor);
  const N = E.divisor.degree;
  const prof = rankProfile(E.matrix);
  const sheaf = residualComplex(qInd, N);
  /* the evaluation map is K_q -> H^0(Z, L|_Z); its kernel is h^0 of the residual and its
     cokernel is h^1 of it — that is the divisor sequence, read as linear algebra */
  const kernel_matches = prof.kernel_dim === sheaf.h0;
  const cokernel_matches = prof.cokernel_dim === sheaf.h1;
  let determinant = null, closed_form = null, det_agreement = null;
  if (N === qInd) {
    determinant = det(E.matrix);
    closed_form = confluentVandermondeProduct(E.divisor);
    const s = Math.max(abs(closed_form), 1e-300);
    det_agreement = abs(sub(determinant, closed_form)) / s;
  }
  return {
    q_ind: qInd, n_emb: N, support_points: E.divisor.support,
    delta_lock: sheaf.delta_lock,
    acyclic: sheaf.acyclic,
    is_isomorphism: prof.rank === qInd && prof.rank === N,
    rank: prof.rank, kernel_dim: prof.kernel_dim, cokernel_dim: prof.cokernel_dim,
    h0: sheaf.h0, h1: sheaf.h1,
    routes_agree: kernel_matches && cokernel_matches,
    determinant, closed_form, det_agreement,
    tolerance: prof.tolerance, smallest_pivot: prof.smallest_pivot,
    regime: sheaf.regime
  };
}

/* ── Local index density and the Bergman sampling picture ────────────────── */

/* With the round volume normalised to one, the degree-two part of ch(L) Td(T) is q_ind ν
   and the diagonal Bergman kernel is the CONSTANT q_ind. The one-point intensity of the
   rank-q projection process is therefore the local index density — which is why a
   determinantal sampling picture is the right visual for the evaluation frame and a
   scatter of independent points is not. */
export function bergman(qInd) {
  return { q_ind: qInd, diagonal: qInd, local_index_density: qInd,
    total_intensity: qInd,               /* ∫ B_q ν = q_ind, one point per dimension */
    homogeneous: true };
}

/* Andreief: the 1/q! in the fixed-rank determinantal law is INTERNAL to that law.
   Extracting it a second time as a molecular abundance factor is the double count the
   manuscript's no-go theorem forbids. */
export function andreief(q) {
  let f = 1; for (let i = 2; i <= q; i++) f *= i;
  return { q, factorial: f, normalisation: f,
    note: 'internal to the fixed-rank conditional spatial law; not a second molecular quotient' };
}

/* ── The formal central image of the same integer ────────────────────────── */

/* Osipov's formal Bott-Thurston class is twelve times the determinantal one, so the
   locking defect has a second, purely formal shadow. It is an IMAGE of the defect and
   not a physical anomaly statement — the vertical map from the null representation to
   the formal extension is exactly what has not been specified. */
export function tateImage(deltaLock) {
  return { delta_lock: deltaLock, det_multiple: 12 * deltaLock, bt_multiple: deltaLock,
    vanishes: deltaLock === 0,
    caveat: 'formal normalisation only; not a proof that the quantum-CIVP anomaly is Bott-Thurston' };
}

/* ── The off-by-one no-go, as a computation ──────────────────────────────── */

/* Identify embadons with the zeros of ONE nonzero section and you get N = q_ind - 1,
   never q_ind. The lock cannot be reached that way, and the number that shows it is the
   difference between a zero divisor and an evaluation frame. */
export function zeroDivisorNoGo(qInd) {
  return { q_ind: qInd, zeros_of_one_section: qInd - 1, required_for_lock: qInd,
    shortfall: 1, lock_reachable: false,
    resolution: 'the molecular support is an evaluation frame for all of K_q, not the zero set of one state' };
}

export const CP1_EQUATIONS = Object.freeze([
  'h^0(O(d)) = max(d+1,0), h^1(O(d)) = max(-d-1,0) on CP^1',
  'L_q = O(q_ind - 1), dim K_q = ind dbar_{L_q} = q_ind',
  'R_{q,Z} = L_q(-Z) ≃ O(q_ind - 1 - N_emb)',
  'Delta_lock = ind dbar_{R} = q_ind - N_emb',
  'RGamma(CP^1, L_q(-Z)) ≃ 0  <=>  N_emb = q_ind',
  'ev_Z : K_q -> H^0(Z, L_q|_Z), dim target = deg Z',
  'det confluent Vandermonde = prod_{a<b} (z_b - z_a)^{m_a m_b}',
  'B_q(z) = q_ind (round carrier, normalised measure)',
  'int |det(s_i(z_j))|^2 dmu^q = q!',
  'T_Tate([E]) = 12 chi(E) [Det] = chi(E) [BT]'
]);
