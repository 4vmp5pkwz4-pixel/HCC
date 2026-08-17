/* ── DE SITTER OUTPUT, ENTROPY TYPING, SHAPE QUOTIENT, AND THE FIVE CERTIFICATES
   Sections II, XIV to XVII of the manuscript.

   The last section of a paper that selects a cosmological sector is where the temptation
   lives, so the arithmetic here is deliberately blunt about what it is:

     R_q = l_P sqrt(q/pi),  Lambda_q = 3 pi / (q l_P^2)

   is a KINEMATIC map from a selected capacity to de Sitter geometry. It is not a
   prediction of Lambda. Without an independently derived q_*, writing Lambda_{q_*} down is
   arithmetic on an unknown, and this module will say so in the returned object rather than
   in a footnote.

   The entropy typing is the other guard. S_gen is ADDITIVE, so a finite-index bridge is
   Delta S_gen = log Ind and never a multiplicative law for the already entropic variable
   A/(4 l_P^2). The two cannot both hold at more than one step: Q + chi = e^chi Q pins Q to
   chi/(e^chi - 1), and the next step needs the same value while the additive law has
   already moved. That fixed point is computed, because a no-go with a number in it is
   harder to talk past than a no-go without one. */

/* ── Trace-free gravity and the global mode ──────────────────────────────── */

/* T -> T + c g is invisible to the trace-free equation AND to the null contraction
   T_{mu nu} k^mu k^nu, because g(k,k) = 0. What it does NOT do is fix the global
   integration mode of d(R + 8 pi G T) = 0, and Lambda_int is not a Jones index, a
   molecular charge or a topological degree. */
export function vacuumShiftKernel(c, kNull = [1, 1, 0, 0]) {
  /* Minkowski signature (-,+,+,+); the check is that a null vector really is null */
  const g = [[-1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
  let kk = 0;
  for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) kk += g[a][b] * kNull[a] * kNull[b];
  return { shift: c, k_squared: kk, k_is_null: Math.abs(kk) < 1e-12,
    trace_free_equation_changed: false,
    null_focusing_source_changed: Math.abs(c * kk) > 1e-12,
    shift_in_null_source: c * kk,
    global_mode_determined: false,
    equivalence_class: '[T_{mu nu}] = { T_{mu nu} + c g_{mu nu} : c in R }',
    caveat: 'the local quotient leaves the global H^0 integration mode Lambda_int free' };
}

/* ── The exact de Sitter capacity map ────────────────────────────────────── */

const L_PLANCK = 1.616255e-35;                        /* CODATA 2018, metres */

export function deSitterFromCapacity(q, lP = L_PLANCK) {
  if (!(q > 0)) throw new RangeError('capacity is positive');
  const R = lP * Math.sqrt(q / Math.PI);
  const Lambda = 3 * Math.PI / (q * lP * lP);
  const A = 4 * Math.PI * R * R;
  /* the round trip, computed rather than assumed: q_can = A/(4 l_P^2) must come back */
  const qBack = A / (4 * lP * lP);
  return { q, l_P: lP, R_q: R, Lambda_q: Lambda, horizon_area: A,
    q_roundtrip: qBack, roundtrip_residual: Math.abs(qBack - q) / q,
    Lambda_from_R: 3 / (R * R),
    Lambda_residual: Math.abs(3 / (R * R) - Lambda) / Lambda,
    is_prediction: false,
    statement: 'kinematic map from a SELECTED capacity to de Sitter geometry; ' +
      'a theory predicts a cosmological sector only if it selects q independently of Lambda_obs' };
}

export function capacityFromLambda(Lambda, lP = L_PLANCK) {
  if (!(Lambda > 0)) throw new RangeError('this chart is the positive-Lambda branch');
  const q = 3 * Math.PI / (Lambda * lP * lP);
  return { Lambda, l_P: lP, q_can: q, R: Math.sqrt(3 / Lambda),
    note: 'reading a capacity OFF an observed Lambda is not selecting one' };
}

/* the smooth Euclidean saddle identity chain — useful as a global consistency relation,
   dangerous if counted several times as independent entropy, action and degeneracy */
export function deSitterSaddleIdentity(q) {
  return { q_dS: q, S_GH: q, minus_I_E_over_hbar: q, rho_Lambda_V4_over_hbar: q,
    leading_saddle_weight_log: q,
    chain: 'q_dS = 3pi/(G hbar Lambda) = rho_Lambda V_4 / hbar = -I_E/hbar = S_GH',
    warning: 'one relation, four faces; it must not be counted four times' };
}

/* ── Entropy typing ──────────────────────────────────────────────────────── */

/* S_gen = A/(4 G hbar) + S_out = q_can + S_out is additive, so IF a finite-index bridge
   exists its type is Delta S_gen = log Ind. With Delta S_out = 0 that is Delta q = log Ind
   — an ADDITIVE step in capacity, and the multiplicative carrier is the state count
   Omega = e^{S_gen}, whose ratio is the index itself. */
export function entropyBridge(index, { deltaSOut = 0 } = {}) {
  if (!(index >= 1)) throw new RangeError('an index is at least 1');
  const logI = Math.log(index);
  return { index, log_index: logI,
    delta_S_gen: logI, delta_S_out: deltaSOut,
    delta_q_can: logI - deltaSOut,
    omega_ratio: index,
    form: 'Delta S_gen = log Ind(X)   (additive)',
    forbidden_form: 'Delta log q_can = log Ind   (multiplicative in an already entropic variable)',
    is_theorem: false,
    status: 'an additional physical hypothesis C_ent, not a theorem of the CIVP construction; ' +
      'it is not needed for the capacity-selector theorem' };
}

/* the additive/multiplicative incompatibility, with its fixed point computed */
export function additiveMultiplicativeNoGo(chi) {
  if (!(chi > 0)) throw new RangeError('chi is a positive constant');
  const Q = chi / (Math.expm1(chi));
  /* both laws hold at Q; the additive law then moves to Q + chi and the multiplicative one
     demands the SAME Q again, which is the contradiction */
  const next = Q + chi, needed = Q;
  return { chi, fixed_point_Q: Q, additive_next: next, multiplicative_requires: needed,
    residual_at_fixed_point: Math.abs(Q + chi - Math.exp(chi) * Q),
    contradiction_gap: next - needed,
    more_than_one_step_possible: false,
    conclusion: `both laws can hold at Q = chi/(e^chi - 1) = ${Q.toExponential(6)} and at no ` +
      'second step; a finite-index entropy interpretation cannot justify a constant ' +
      'multiplicative area ladder' };
}

/* the black-hole capacity first law: T_H delta q_H = delta M - Omega_H delta J - Phi_H delta Q.
   A clean strong-field calibration of the SCALAR capacity, and nothing more — it implies
   neither the unit-weight theorem nor the UV selector. */
export function capacityFirstLaw({ T_H, dM, Omega_H = 0, dJ = 0, Phi_H = 0, dQ_el = 0 }) {
  if (!(T_H > 0)) throw new RangeError('the first law in this form needs a positive horizon temperature');
  const work = Omega_H * dJ + Phi_H * dQ_el;
  const dq = (dM - work) / T_H;
  return { T_H, dM, work_terms: work, delta_q_H: dq,
    identity: 'T_H delta q_H = delta M - Omega_H delta J - Phi_H delta Q_el',
    at_leading_semiclassical_order: true,
    implies_unit_weight: false, implies_selector: false };
}

/* ── The BMS shape quotient ──────────────────────────────────────────────── */

/* The trace-free Hessian D_AB[T] annihilates exactly l = 0 and 1, and for normalised
   harmonics its square integrates to (1/2)(l-1)l(l+1)(l+2). So the shape space is the
   positive quotient H_soft/(H_0 + H_1) = sum_{l>=2} H_l, and the scalar capacity and the
   radiative shape are DIFFERENT sectors. */
export function shapeNorm(l) {
  if (!Number.isInteger(l) || l < 0) throw new RangeError('l is a non-negative integer');
  return 0.5 * (l - 1) * l * (l + 1) * (l + 2);
}

export function bmsShapeQuotient(lMax = 8) {
  const rows = [];
  let dimKernel = 0, dimShape = 0;
  for (let l = 0; l <= lMax; l++) {
    const n = shapeNorm(l), mult = 2 * l + 1, inKernel = n === 0;
    rows.push({ l, multiplicity: mult, hessian_norm_squared: n, in_kernel: inKernel });
    if (inKernel) dimKernel += mult; else dimShape += mult;
  }
  return { l_max: lMax, rows,
    kernel_levels: rows.filter(r => r.in_kernel).map(r => r.l),
    kernel_dimension: dimKernel, shape_dimension: dimShape,
    kernel_is_exactly_l01: rows.every(r => r.in_kernel === (r.l === 0 || r.l === 1)),
    quotient: 'H_shape^BMS = H_soft / (H_0 + H_1) ≃ sum_{l>=2} H_l',
    role_separation: { scalar: 'q_can controls the scalar area mode',
      radiative: '[T]_shape controls radiative shape' },
    caveat: 'not a theorem that every finite-corner charge with l = 0,1 is unphysical' };
}

/* ── The independent Hopf sector ─────────────────────────────────────────── */

/* deg U for U: S^3 -> SU(2) ≃ S^3, and H(h o U) = deg U with compatible orientations,
   because the Hopf map generates pi_3(S^2) = Z and precomposition by a degree-k map
   multiplies the generator by k.

   The integer Q_top is neither q_can nor I_J, and this function says so in its output.
   A projected ring is not a linking number either. */
export function hopfSector(degU) {
  if (!Number.isInteger(degU)) throw new RangeError('a degree is an integer');
  return { deg_U: degU, hopf_invariant: degU, equal: true,
    integral: 'Q_top = (1/24 pi^2) ∫_{S^3} Tr[(U^{-1} dU)^3]',
    is_capacity: false, is_jones_index: false,
    selects_de_sitter_sector: false,
    caveat: 'projected rings or annuli do not establish a nonzero three-dimensional linking ' +
      'number; a physical Hopf reading needs a reconstructed 3D map or equivalent linking data' };
}

/* ── The five certificates and the conditional closure ───────────────────── */

export const CERTIFICATES = Object.freeze([
  { id: 'C_X', title: 'a dualizable irreducible finite-index defect X is selected by the glued CIVP data',
    unlocks: ['Ind(X) exists'] },
  { id: 'C_win', title: 'the correctly typed expectation satisfies 1/3 < lambda* < 1/2',
    unlocks: ['Ind(X) = phi^2'] },
  { id: 'C_U', title: 'the embadon weights in the same reduced measure are unit, gamma_i = 1',
    unlocks: ['q_can = N_emb'] },
  { id: 'C_E', title: 'the physical divisor realises the complete evaluation/jet frame (residual complex acyclic)',
    unlocks: ['N_emb = q_ind'] },
  { id: 'C_UV', title: 'one reduced UV measure gives strict selector convexity, one crossing and topology stability',
    unlocks: ['q_* is unique'] }
]);

/* Which conclusions survive a given subset of certificates? The irreducibility proposition
   says: remove any one and its conclusion is no longer determined by the rest. This
   function computes that table instead of asserting it, so removing a certificate visibly
   removes exactly one conclusion and never more. */
export function closure(held = {}, { q_star = null, l_P = L_PLANCK } = {}) {
  const has = id => !!held[id];
  const conclusions = {
    'Ind(X) = phi^2': has('C_X') && has('C_win'),
    'q_can = N_emb': has('C_U'),
    'N_emb = q_ind': has('C_E'),
    'q_* unique': has('C_UV')
  };
  const tripleLock = conclusions['q_can = N_emb'] && conclusions['N_emb = q_ind'];
  const canMapDeSitter = conclusions['q_* unique'] && tripleLock && q_star !== null;
  const ds = canMapDeSitter ? deSitterFromCapacity(q_star, l_P) : null;
  const missing = CERTIFICATES.filter(c => !has(c.id)).map(c => c.id);
  return {
    held: CERTIFICATES.map(c => ({ ...c, held: has(c.id) })),
    missing, all_held: missing.length === 0,
    conclusions, triple_lock: tripleLock,
    triple_lock_statement: 'q_can = N_emb = q_ind',
    de_sitter: ds,
    /* the honest headline, computed from the state rather than written once and left */
    headline: missing.length === 0
      ? (q_star !== null
        ? `all five certificates held; the locked capacity ${q_star} maps to Lambda = ${(3 * Math.PI / (q_star * l_P * l_P)).toExponential(6)} m^-2`
        : 'all five certificates held; a selected integer sector still has to be named before the map produces a number')
      : `certificates missing: ${missing.join(', ')} — the corresponding conclusions are NOT determined`,
    optional_sixth: { id: 'C_ent', statement: 'Delta S_gen = log Ind(X)',
      affects: 'the entropy interpretation of the defect', needed_for_selector: false },
    falsifiers: [
      'absence of a finite-index CIVP defect',
      'failure of the Pimsner-Popa window',
      'nonunit molecular weights',
      'failure of the evaluation frame',
      'failure of strict UV selection or topology stability'
    ],
    not_repairable_by: 'fitting the observed value of Lambda'
  };
}

/* the role-separation ledger of Appendix G, as data rather than prose */
export const TYPE_LEDGER = Object.freeze([
  { symbol: 'q_can', type: 'positive real before locking', meaning: 'geometric capacity A/(4 l_P^2)' },
  { symbol: 'N_emb', type: 'non-negative integer', meaning: 'degree of an effective divisor' },
  { symbol: 'q_ind', type: 'positive integer', meaning: 'analytic index / dimension of the carrier' },
  { symbol: 'N_Berry', type: 'positive integer', meaning: 'finite representation dimension' },
  { symbol: 'I_J', type: 'real >= 1, generally irrational', meaning: 'Jones / statistical index' },
  { symbol: 'd_tau', type: 'real', meaning: 'categorical dimension phi' },
  { symbol: 'mu_Fib', type: 'real', meaning: 'global dimension 1 + phi^2 = phi + 2' },
  { symbol: 'Jones depth', type: 'integer grading', meaning: 'NOT a geometric shell count' },
  { symbol: '[T]_shape', type: 'class modulo l = 0,1', meaning: 'radiative shape' },
  { symbol: 'Lambda_int', type: 'global H^0 integration mode', meaning: 'not an index, charge or degree' },
  { symbol: 'Q_top', type: 'integer', meaning: 'Hopf invariant / degree; neither q_can nor I_J' }
]);

export const CLOSURE_EQUATIONS = Object.freeze([
  'R_{mu nu} - (1/4) R g_{mu nu} = 8 pi G (T_{mu nu} - (1/4) T g_{mu nu})',
  'd(R + 8 pi G T) = 0',
  'q_can = A/(4 l_P^2) = 3 pi / (Lambda l_P^2)',
  'R_q = l_P sqrt(q/pi),  Lambda_q = 3 pi / (q l_P^2)',
  'q_dS = 3pi/(G hbar Lambda) = rho_Lambda V_4/hbar = -I_E/hbar = S_GH',
  'S_gen = A/(4 G hbar) + S_out = q_can + S_out',
  'Delta S_gen = log Ind(X);  Omega = e^{S_gen}, Omega_{n+1}/Omega_n = Ind',
  'Q + chi = e^chi Q  =>  Q = chi/(e^chi - 1), and no second step',
  'T_H delta q_H = delta M - Omega_H delta J - Phi_H delta Q_el',
  'D_AB[Y_lm] = 0 <=> l = 0,1;  ∫ |D[Y_lm]|^2 = (1/2)(l-1)l(l+1)(l+2)',
  'H(h o U) = deg U'
]);
