import { defineLab, domainError } from '../contract.mjs';
import { STATUS } from '../status.mjs';
/* The mathematics is NOT in this file. It lives in index.html, where the atlas draws it,
   and scripts/extract-kernels.mjs slices it into core/atlas/extracted.mjs. A kernel that
   retyped it would be a second copy, and the drift between the picture and the number is
   exactly the failure this core exists to prevent. */
import { civpLock as evaluationLock, civpResidual as residualComplex, civpCarrier as carrierSpace,
  civpBergman as bergman, civpAndreief as andreief, civpTate as tateImage,
  civpZeroNoGo as zeroDivisorNoGo, civpNormDivisor as normaliseDivisor } from '../atlas/extracted.mjs';

/* the divisor arrives as text so an agent can drive this over a URL: "re,im,mult; ..."
   or the word auto, which builds a ring of distinct points and then MERGES the requested
   number of them into one atom of higher multiplicity. Collisions are not an edge case to
   be avoided here — they are the reason the derived formulation was chosen. */
function buildDivisor(spec, nEmb, collisions) {
  if (spec.trim().toLowerCase() === 'auto') {
    if (!Number.isInteger(nEmb) || nEmb < 1) throw domainError('n_emb must be a positive integer');
    if (collisions < 0 || collisions >= nEmb)
      throw domainError(`collisions must lie in [0, n_emb) = [0, ${nEmb})`, { collisions, n_emb: nEmb });
    const distinct = nEmb - collisions;
    const atoms = [];
    for (let a = 0; a < distinct; a++) {
      const t = 2 * Math.PI * a / distinct;
      atoms.push({ re: Math.cos(t), im: Math.sin(t), mult: a === 0 ? 1 + collisions : 1 });
    }
    return atoms;
  }
  const atoms = spec.split(';').map(s => s.trim()).filter(Boolean).map(s => {
    const p = s.split(',').map(Number);
    if (p.length < 2 || p.some(v => !Number.isFinite(v)))
      throw domainError(`cannot read divisor atom "${s}"; expected "re,im,mult"`, { atom: s });
    return { re: p[0], im: p[1], mult: p.length > 2 ? Math.round(p[2]) : 1 };
  });
  if (!atoms.length) throw domainError('an effective divisor needs at least one atom');
  if (atoms.some(a => a.mult < 1)) throw domainError('multiplicities are positive integers');
  return atoms;
}

const CP1_EQUATIONS = Object.freeze([
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

export default defineLab({
  id: 'civp.cp1_locking',
  title: 'CP¹ index space — the acyclic molecular lock',
  status: STATUS.EXACT,
  model_id: 'civp.residual_evaluation_complex',
  equation_ids: ['rr.cp1', 'residual.acyclicity', 'evaluation.cone', 'vandermonde.confluent',
    'bergman.diagonal', 'andreief', 'tate.bott_thurston'],
  summary:
    'RΓ(CP¹, L_q(−Z)) vanishes if and only if N_emb = q_ind. The equivalence is computed by two ' +
    'independent routes — sheaf cohomology of the residual bundle, and the rank of the confluent ' +
    'evaluation matrix — and their disagreement is returned rather than assumed to be zero. ' +
    'Collisions are supported: a multiple point contributes jets, and the defect does not notice.',
  formulas: CP1_EQUATIONS,
  assumptions: [
    'the carrier is the round O(q_ind − 1) on CP¹ with dim H⁰ = q_ind',
    'the molecular divisor is effective',
    'evaluation is taken in the affine chart; the point at infinity carries no atom'
  ],
  domain_of_validity: [
    'q_ind ≥ 1 and any effective divisor of any degree, reduced or not',
    'the theorem is mathematics about a line bundle — it does not derive certificate C_E from CIVP dynamics'
  ],
  falsifiers: [
    'the cohomological and the linear-algebra route disagree about the kernel or cokernel',
    'the confluent determinant differs from ∏(z_b − z_a)^{m_a m_b} at N = q_ind',
    'a divisor with N_emb ≠ q_ind is reported acyclic'
  ],
  verifiers: ['docs/verify-civp-locking.cjs'],
  open_problems: [
    'certificate C_E: show that the physical embadon support realises the complete evaluation frame',
    'the vertical map from the null representation to the formal Bott–Thurston extension is unspecified'
  ],
  cost_hint: 'fast',
  inputs: [
    { name: 'q_ind', type: 'number', unit: 'dimensionless', default: 5, min: 1, max: 64,
      doc: 'dimension of the index carrier K_q = H⁰(CP¹, O(q_ind − 1))' },
    { name: 'n_emb', type: 'number', unit: 'dimensionless', default: 5, min: 1, max: 64,
      doc: 'degree of the molecular divisor, used when divisor = auto' },
    { name: 'divisor', type: 'string', default: 'auto',
      doc: '"auto" for a ring of n_emb points, or an explicit list "re,im,mult; re,im,mult"' },
    { name: 'collisions', type: 'number', unit: 'dimensionless', default: 0, min: 0, max: 63,
      doc: 'how many atoms of the auto divisor are merged into one multiple point (jets)' }
  ],
  outputs: [
    { name: 'n_emb', unit: 'dimensionless', doc: 'degree of the divisor actually used' },
    { name: 'support_points', unit: 'dimensionless', doc: 'number of distinct atoms' },
    { name: 'delta_lock', unit: 'dimensionless', doc: 'q_ind − N_emb, the Euler characteristic of the residual complex' },
    { name: 'acyclic', type: 'boolean', unit: null, doc: 'whether RΓ(CP¹, L_q(−Z)) ≃ 0' },
    { name: 'residual_degree', unit: 'dimensionless', doc: 'degree of O(q_ind − 1 − N_emb); acyclic exactly at −1' },
    { name: 'h0', unit: 'dimensionless', doc: 'h⁰ of the residual bundle' },
    { name: 'h1', unit: 'dimensionless', doc: 'h¹ of the residual bundle' },
    { name: 'rank', unit: 'dimensionless', doc: 'rank of the confluent evaluation matrix' },
    { name: 'kernel_dim', unit: 'dimensionless', doc: 'dim ker ev_Z, which must equal h⁰' },
    { name: 'cokernel_dim', unit: 'dimensionless', doc: 'dim coker ev_Z, which must equal h¹' },
    { name: 'routes_agree', type: 'boolean', unit: null, doc: 'cohomology and linear algebra returned the same answer' },
    { name: 'det_agreement', unit: 'dimensionless', doc: 'relative disagreement with the closed confluent Vandermonde product; null off the lock' },
    { name: 'is_isomorphism', type: 'boolean', unit: null, doc: 'ev_Z is an isomorphism' },
    { name: 'bergman_diagonal', unit: 'dimensionless', doc: 'B_q(z) = q_ind, the constant one-point intensity' },
    { name: 'andreief_factorial', unit: 'dimensionless', doc: '∫|det(s_i(z_j))|² dμ^q = q! (capped at q = 12 for readability)' },
    { name: 'tate_det_multiple', unit: 'dimensionless', doc: '12 Δ_lock, the determinantal image of the defect' },
    { name: 'zeros_of_one_section', unit: 'dimensionless', doc: 'q_ind − 1: what a literal zero-divisor identification would give' },
    { name: 'regime', type: 'string', unit: null, doc: 'underdetermined, acyclic or overdetermined' }
  ],
  evaluate(i) {
    const q = Math.round(i.q_ind), n = Math.round(i.n_emb), col = Math.round(i.collisions);
    const atoms = buildDivisor(i.divisor, n, col);
    const Z = normaliseDivisor(atoms);
    const lock = evaluationLock(q, atoms);
    const res = residualComplex(q, Z.degree);
    const K = carrierSpace(q);
    const warnings = [];
    if (Z.degree !== n && i.divisor.trim().toLowerCase() !== 'auto')
      warnings.push(`the explicit divisor has degree ${Z.degree}; the n_emb input (${n}) was not used`);
    return { outputs: {
      n_emb: lock.n_emb, support_points: lock.support_points,
      delta_lock: lock.delta_lock, acyclic: lock.acyclic,
      residual_degree: res.residual_degree, h0: lock.h0, h1: lock.h1,
      rank: lock.rank, kernel_dim: lock.kernel_dim, cokernel_dim: lock.cokernel_dim,
      routes_agree: lock.routes_agree, det_agreement: lock.det_agreement,
      is_isomorphism: lock.is_isomorphism,
      bergman_diagonal: bergman(q).diagonal,
      andreief_factorial: andreief(Math.min(q, 12)).factorial,
      tate_det_multiple: tateImage(lock.delta_lock).det_multiple,
      zeros_of_one_section: zeroDivisorNoGo(q).zeros_of_one_section,
      regime: lock.regime },
      warnings,
      diagnostics: { dim_K_q: K.dim_K_q, index_dbar: K.index_dbar,
        collisions: Z.degree - Z.support, tolerance: lock.tolerance,
        smallest_pivot: lock.smallest_pivot,
        route_note: 'kernel is compared with h⁰ and cokernel with h¹; the divisor sequence read as linear algebra' } };
  },
  selftests: [
    { name: 'acyclicity happens at N = q_ind and nowhere else, over a scan of both',
      run(L) { const bad = [];
        for (let q = 1; q <= 8; q++) for (let n = 1; n <= 10; n++) {
          const r = L.run({ q_ind: q, n_emb: n, divisor: 'auto', collisions: 0 }, { provenance: {} });
          if (r.outputs.acyclic !== (n === q)) bad.push(`q=${q} n=${n}`);
        }
        return { pass: bad.length === 0, detail: bad.length ? bad.join(', ') : '80 (q, N) pairs, acyclic exactly on the diagonal' }; } },
    { name: 'the cohomological and linear-algebra routes agree in all three regimes, with collisions',
      run(L) { let worst = true, checked = 0;
        for (let q = 2; q <= 8; q++) for (let n = 1; n <= 9; n++) for (const c of [0, 1, 2]) {
          if (c >= n) continue;
          const r = L.run({ q_ind: q, n_emb: n, divisor: 'auto', collisions: c }, { provenance: {} });
          worst = worst && r.outputs.routes_agree; checked++;
        }
        return { pass: worst, detail: `${checked} divisors, kernel = h⁰ and cokernel = h¹ in every one` }; } },
    { name: 'at the lock the confluent determinant equals ∏(z_b − z_a)^{m_a m_b}',
      run(L) { let worst = 0;
        for (let q = 2; q <= 9; q++) for (const c of [0, 1, 2, 3]) {
          if (c >= q) continue;
          const r = L.run({ q_ind: q, n_emb: q, divisor: 'auto', collisions: c }, { provenance: {} });
          worst = Math.max(worst, r.outputs.det_agreement ?? 1);
        }
        return { pass: worst < 1e-9, detail: `worst relative disagreement ${worst.toExponential(2)} over 30 confluent divisors` }; } },
    { name: 'the zeros of one section fall one short, always',
      run(L) { let ok = true;
        for (let q = 2; q <= 12; q++) { const r = L.run({ q_ind: q, n_emb: q, divisor: 'auto' }, { provenance: {} });
          ok = ok && r.outputs.zeros_of_one_section === q - 1; }
        return { pass: ok, detail: 'N_emb = q_ind − 1 for a literal zero-divisor identification; the lock is unreachable that way' }; } },
    { name: 'the Tate/Bott–Thurston image vanishes exactly when the lock closes',
      run(L) { let ok = true;
        for (let n = 1; n <= 9; n++) { const r = L.run({ q_ind: 5, n_emb: n, divisor: 'auto' }, { provenance: {} });
          ok = ok && ((r.outputs.tate_det_multiple === 0) === r.outputs.acyclic); }
        return { pass: ok, detail: '12 Δ_lock = 0 ⟺ N_emb = q_ind, over nine divisor degrees' }; } }
  ]
});
