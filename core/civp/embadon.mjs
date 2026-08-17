/* ── MOLECULAR NULL GEOMETRY: THE ATOMIC AREA MEASURE ────────────────────────
   Sections III and IV of the manuscript.

   The first locking gate in the whole construction is the one it is easiest to walk past:
   AREA IS A WEIGHTED SUM, NOT A COUNT. Decomposing the null area measure into atoms buys
   a support number N_emb and a permutation quotient; it does not buy q_can = N_emb. That
   equality needs the unit-weight certificate C_U, and the difference between having a
   molecular decomposition and having unit weights is the difference between a picture and
   a theorem.

   So every function here returns the mean weight alongside the count, and the identity
   q_can = N_emb is reported as a CONDITION that either holds or does not, never as a
   consequence of the decomposition existing. */

/* ── The measure and its capacity ────────────────────────────────────────── */

/* q_can = (1/4 l_P^2) ∫ Omega = sum_i gamma_i, and gamma_bar = q_can / N_emb.
   The no-go is one line of arithmetic and it is the line that matters. */
export function capacity(gammas) {
  const g = Array.from(gammas, Number);
  if (!g.length) throw new RangeError('a molecular measure needs at least one atom');
  if (g.some(x => !Number.isFinite(x) || x <= 0))
    throw new RangeError('atomic weights are positive; a zero-weight atom is not an atom');
  const N = g.length, qCan = g.reduce((s, x) => s + x, 0), mean = qCan / N;
  const varW = g.reduce((s, x) => s + (x - mean) ** 2, 0) / N;
  const unit = g.every(x => Math.abs(x - 1) <= 1e-12);
  return {
    n_emb: N, q_can: qCan, gamma_bar: mean, weight_variance: varW,
    unit_weights: unit, mean_unit: Math.abs(mean - 1) <= 1e-12,
    /* the two statements the no-go theorem keeps apart */
    capacity_equals_count: Math.abs(qCan - N) <= 1e-9 * Math.max(1, N),
    pointwise_unit_capacity: unit,
    certificate_C_U: unit,
    note: unit ? 'C_U holds for this sample: every gamma_i = 1'
      : 'C_U FAILS for this sample: the support count is not the capacity'
  };
}

/* ── The bosonic quotient ────────────────────────────────────────────────── */

/* UConf_N = Conf_N / S_N with a free action on the distinct-point locus, so the molecular
   configuration integral carries 1/N!. That factorial is a quotient of a CONFIGURATION
   measure. It is not automatically the 1/q! of a fixed-rank determinantal law written in
   ordered coordinates, and the manuscript's no-double-counting theorem is precisely the
   instruction not to multiply the two together because both look like factorials. */
export function bosonicQuotient(N) {
  if (!Number.isInteger(N) || N < 0) throw new RangeError('N must be a non-negative integer');
  let f = 1, logf = 0;
  for (let i = 2; i <= N; i++) { f *= i; logf += Math.log(i); }
  return { N, factorial: Number.isFinite(f) ? f : Infinity, log_factorial: logf,
    quotient: Number.isFinite(f) ? 1 / f : 0,
    origin: 'quotient of the unordered configuration measure',
    distinct_from: 'the 1/q! internal to a fixed-rank determinantal point process' };
}

/* ── Double-null gluing ──────────────────────────────────────────────────── */

/* Equality of two positive finite atomic measures on the common cut forces equal support
   and equal mass atom by atom, up to permutation. The proof is that atoms are intrinsic;
   the computation is a matching, and what it returns when the match FAILS is the useful
   part — the largest mass defect and the atoms that have no partner. */
export function gluing(omegaU, omegaV, tol = 1e-12) {
  const norm = a => Array.from(a, x => ({ re: Number(x.re ?? x[0] ?? 0), im: Number(x.im ?? x[1] ?? 0),
    w: Number(x.w ?? x.weight ?? x[2] ?? 1) })).filter(p => Math.abs(p.w) > 0);
  const U = norm(omegaU), V = norm(omegaV);
  const used = new Set();
  const pairs = [], orphansU = [];
  let worst = 0;
  for (let i = 0; i < U.length; i++) {
    let best = -1, bestD = Infinity;
    for (let j = 0; j < V.length; j++) {
      if (used.has(j)) continue;
      const d = Math.hypot(U[i].re - V[j].re, U[i].im - V[j].im);
      if (d < bestD) { bestD = d; best = j; }
    }
    if (best < 0 || bestD > tol) { orphansU.push(i); continue; }
    used.add(best);
    const defect = Math.abs(U[i].w - V[best].w);
    worst = Math.max(worst, defect);
    pairs.push({ u: i, v: best, position_defect: bestD, mass_defect: defect });
  }
  const orphansV = V.map((_, j) => j).filter(j => !used.has(j));
  const compatible = orphansU.length === 0 && orphansV.length === 0 && worst <= tol;
  return {
    M_u: U.length, M_v: V.length,
    matched: pairs.length, unmatched_u: orphansU.length, unmatched_v: orphansV.length,
    max_mass_defect: worst,
    permutation: compatible ? pairs.map(p => p.v) : null,
    compatible,
    verdict: compatible
      ? 'the two atomic measures agree up to permutation — the diagonal molecular measure is preserved'
      : 'the measures differ; CIVP gluing is NOT satisfied by this pair',
    /* what gluing does NOT prove, said here rather than left to be assumed */
    still_open: ['tangential / Hajicek data', 'collision and stabiliser conventions',
      'the Murray-von Neumann type of the glued algebra']
  };
}

/* the collision-safe encoding: once unit weights are certified, the measure IS an
   effective divisor and multiplicity replaces coincidence */
export function effectiveDivisor(atoms, tol = 1e-12) {
  const out = [];
  for (const a of atoms) {
    const re = Number(a.re ?? a[0] ?? 0), im = Number(a.im ?? a[1] ?? 0);
    const m = Math.round(Number(a.mult ?? a.m ?? a.w ?? a[2] ?? 1));
    const hit = out.find(p => Math.hypot(p.re - re, p.im - im) < tol);
    if (hit) hit.mult += m; else out.push({ re, im, mult: m });
  }
  const deg = out.reduce((s, p) => s + p.mult, 0);
  return { atoms: out, support: out.length, degree: deg, n_emb: deg,
    collisions: deg - out.length,
    collision_safe: true };
}

/* ── The unit-weight rigidity theorem ────────────────────────────────────── */

/* Compound Poisson: N ~ Poisson(Q), gamma_i iid and independent of N, q_A = sum gamma_i.
   Then E q_A = Q E gamma and Var q_A = Q E gamma^2. If the SAME physical ensemble
   independently gives E q_A = Q and Var q_A = Q, then Var(gamma) = 0 and gamma = 1 a.s.

   The words "same physical ensemble" are the theorem's entire content. An area variance
   computed in one reduced measure and a Poisson count introduced in another do not
   combine, and this function refuses to pretend otherwise: it asks for the moments and
   the measure label, and it reports NOT-APPLICABLE when the labels differ. */
export function compoundPoissonRigidity({ Q, E_gamma, E_gamma2, measure_moments = 'unnamed',
  measure_count = 'unnamed' }) {
  if (!(Q > 0)) throw new RangeError('Q must be positive');
  const Eq = Q * E_gamma, Vq = Q * E_gamma2;
  const varGamma = E_gamma2 - E_gamma * E_gamma;
  const sameMeasure = measure_moments === measure_count;
  const momentsUnit = Math.abs(Eq - Q) <= 1e-12 * Q && Math.abs(Vq - Q) <= 1e-12 * Q;
  return {
    Q, E_q_A: Eq, Var_q_A: Vq, E_gamma, E_gamma2, Var_gamma: varGamma,
    unit_moments_observed: momentsUnit,
    same_reduced_measure: sameMeasure,
    /* the conclusion is gated on BOTH, and the gate is the point of the function */
    gamma_is_unit_a_s: momentsUnit && sameMeasure && Math.abs(varGamma) <= 1e-12,
    verdict: !sameMeasure
      ? 'NOT APPLICABLE — the moments and the count were taken in different reduced measures, ' +
        'so E q_A = Var q_A = Q cannot be assembled from them'
      : momentsUnit && Math.abs(varGamma) <= 1e-12
        ? 'gamma = 1 almost surely — the unit-weight certificate C_U is established for this ensemble'
        : 'the observed moments do not force unit weights'
  };
}

/* ── Corner modes ────────────────────────────────────────────────────────── */

/* [q_can_hat, mu_bar_hat] = 2 pi i for the collective pair; the orthogonal complement
   holds N-1 relative scalar pairs before constraints and higher spin. One capacity mode,
   an extensive family of shape modes — and the commutator does NOT quantise q_can. */
export function cornerModes(N) {
  if (!Number.isInteger(N) || N < 1) throw new RangeError('N must be a positive integer');
  return { n_emb: N, collective_pairs: 1, relative_pairs: N - 1,
    collective_commutator: { re: 0, im: 2 * Math.PI },
    commutator_magnitude: 2 * Math.PI,
    quantises_capacity: false,
    note: 'an operator origin for one capacity-conjugate mode; not a quantisation of q_can' };
}

/* the support-weight diagnostic of the perturbative non-expanding null-CFT realisation:
   c_tot / q_can = c_ray / gamma_bar. Useful there, not assumed universal. */
export function centralWeightDiagnostic({ c_matter = 0, n_emb, q_can }) {
  const cRay = 4 + c_matter, cTot = cRay * n_emb, gammaBar = q_can / n_emb;
  return { c_ray: cRay, c_tot: cTot, gamma_bar: gammaBar,
    ratio: cTot / q_can, predicted_ratio: cRay / gammaBar,
    residual: Math.abs(cTot / q_can - cRay / gammaBar),
    scope: 'perturbative non-expanding null-CFT realisation only' };
}

export const EMBADON_EQUATIONS = Object.freeze([
  'Omega(z) = sum_i Omega_i delta^{(2)}(z - z_i)',
  'gamma_i = Omega_i / (4 l_P^2)',
  'q_can = sum_i gamma_i,  q_can / N_emb = gamma_bar',
  'q_can = N_emb  <=>  gamma_bar = 1  (pointwise capacity needs gamma_i = 1)',
  'UConf_N = Conf_N / S_N gives the 1/N! configuration quotient',
  'Omega^{(u)} = Omega^{(v)} as measures => equal support and mass up to permutation',
  'E q_A = Q E gamma, Var q_A = Q E gamma^2 (compound Poisson)',
  '[q_can_hat, mu_bar_hat] = 2 pi i',
  'c_tot / q_can = c_ray / gamma_bar'
]);
