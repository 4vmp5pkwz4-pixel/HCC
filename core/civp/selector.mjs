/* ── THE INVARIANT UV SELECTOR CALCULUS ──────────────────────────────────────
   Sections XII and XIII of the manuscript.

   Z_q = I_q / Gamma(q+1) with I_q > 0, and everything that follows is exact discrete
   calculus. What makes it worth having as a laboratory rather than as an identity is the
   quotient structure:

     · I_q -> C e^{aq} I_q is a NUISANCE. Boundary-tension redefinition and overall
       normalisation act exactly this way, and no physics may depend on the choice.
     · kappa_q = Delta^2 log I_q annihilates it, and is COMPLETE modulo it: two positive
       sequences with the same kappa differ by exactly aq + b.
     · so kappa classifies selector SHAPE, and the LOCATION of the maximum still needs the
       absolute linear datum of one reduced measure. That is why removing C_UV leaves q_*
       undetermined while leaving the curvature untouched.

   The free energy Gamma_q = -log Z_q has Delta^2 Gamma_q = log((q+2)/(q+1)) - kappa_q,
   and strict positivity of that, plus one adjacent sign change of rho_q, gives a unique
   maximiser. Both hypotheses are checked and reported separately, because a crossing
   without convexity is not a selection. */

/* ── The primitive sequence and its invariant ────────────────────────────── */

const asSeq = I => {
  const a = Array.from(I, Number);
  if (a.length < 3) throw new RangeError('the second difference needs at least three terms');
  if (a.some(x => !(x > 0) || !Number.isFinite(x)))
    throw new RangeError('the primitive sequence is strictly positive');
  return a;
};

/* kappa_q = log( I_{q+2} I_q / I_{q+1}^2 ) — the complete affine invariant */
export function kappa(I, qMin = 1) {
  const a = asSeq(I), f = a.map(Math.log), out = [];
  for (let i = 0; i + 2 < a.length; i++)
    out.push({ q: qMin + i, kappa: f[i + 2] - 2 * f[i + 1] + f[i] });
  return out;
}

/* the affine action the invariant is designed to kill */
export function affineReweight(I, { C = 1, a = 0 } = {}, qMin = 1) {
  return Array.from(I, (x, i) => C * Math.exp(a * (qMin + i)) * x);
}

/* rho_q = log(Z_{q+1}/Z_q) = log(I_{q+1}/I_q) - log(q+1), and Gamma_q = -log Z_q */
export function selectorProfile(I, qMin = 1) {
  const a = asSeq(I), n = a.length;
  const logI = a.map(Math.log);
  const rows = [];
  /* log Gamma(q+1) by the exact integer recursion for integer q — no lgamma needed */
  let logFact = 0;
  for (let k = 1; k <= qMin; k++) logFact += Math.log(k);
  for (let i = 0; i < n; i++) {
    const q = qMin + i;
    if (i > 0) logFact += Math.log(q);
    const logZ = logI[i] - logFact;
    rows.push({ q, I: a[i], log_I: logI[i], log_factorial: logFact, log_Z: logZ, Z: Math.exp(logZ),
      Gamma: -logZ });
  }
  for (let i = 0; i + 1 < n; i++)
    rows[i].rho = logI[i + 1] - logI[i] - Math.log(rows[i].q + 1);
  for (let i = 0; i + 2 < n; i++) {
    rows[i].kappa = logI[i + 2] - 2 * logI[i + 1] + logI[i];
    rows[i].d2Gamma = Math.log((rows[i].q + 2) / (rows[i].q + 1)) - rows[i].kappa;
    /* the identity is also computed the long way round, from Gamma itself, so the two
       routes can disagree out loud instead of silently */
    rows[i].d2Gamma_direct = rows[i + 2].Gamma - 2 * rows[i + 1].Gamma + rows[i].Gamma;
    rows[i].identity_residual = Math.abs(rows[i].d2Gamma - rows[i].d2Gamma_direct);
  }
  return rows;
}

/* ── Unique sector selection ─────────────────────────────────────────────── */

/* Strict discrete convexity throughout the interior makes rho strictly decreasing; one
   adjacent sign change then pins the maximiser. BOTH are required and both are returned,
   so a sequence that crosses without being convex is reported as what it is. */
export function selectSector(I, qMin = 1) {
  const rows = selectorProfile(I, qMin);
  const curv = rows.filter(r => r.d2Gamma !== undefined);
  const convex = curv.length > 0 && curv.every(r => r.d2Gamma > 0);
  const c_star = curv.length ? Math.min(...curv.map(r => r.d2Gamma)) : null;
  const rho = rows.filter(r => r.rho !== undefined);
  const crossings = [];
  for (let i = 0; i + 1 < rho.length; i++)
    if (rho[i].rho > 0 && rho[i + 1].rho < 0) crossings.push(rho[i + 1].q);
  /* the argmax found independently, by looking at Z rather than at its differences */
  let best = rows[0];
  for (const r of rows) if (r.log_Z > best.log_Z) best = r;
  const q_star = crossings.length === 1 ? crossings[0] : null;
  const m_star = q_star !== null ? (() => {
    const a = rho.find(r => r.q === q_star - 1), b = rho.find(r => r.q === q_star);
    return a && b ? Math.min(a.rho, -b.rho) : null;
  })() : null;
  return {
    q_min: qMin, q_max: rows[rows.length - 1].q,
    strictly_convex: convex, c_star,
    crossings, unique_crossing: crossings.length === 1,
    q_star,
    argmax_direct: best.q,
    routes_agree: q_star !== null ? q_star === best.q : null,
    m_star,
    unique_maximiser: convex && crossings.length === 1 && q_star === best.q,
    max_identity_residual: Math.max(0, ...curv.map(r => r.identity_residual)),
    rows,
    verdict: !convex ? 'strict discrete convexity FAILS — a crossing here is not a selection'
      : crossings.length === 0 ? 'no adjacent sign change on this interval'
      : crossings.length > 1 ? 'more than one crossing — the convexity hypothesis is violated somewhere'
      : `q_* = ${q_star} is the unique maximiser of Z_q on this interval`
  };
}

/* ── The bounded-growth obstruction ──────────────────────────────────────── */

/* If I_{q+1}/I_q <= C for large q then Z_{q+1}/Z_q <= C/(q+1) < 1 once q+1 > C. A finite
   spectator degeneracy therefore cannot push the selector to macroscopic capacity: a
   crossing at large q REQUIRES adjacent primitive growth of order at least q. */
export function boundedGrowthNoGo(C, qProbe) {
  const ratio = C / (qProbe + 1);
  return { C, q: qProbe, Z_ratio_bound: ratio,
    decaying: ratio < 1, q_threshold: Math.ceil(C),
    conclusion: ratio < 1
      ? `beyond q + 1 > C = ${C} the weight strictly decreases; no crossing is possible there`
      : 'below the threshold the bound is uninformative',
    requirement: 'a crossing at capacity q needs I_{q+1}/I_q of order q near the crossing' };
}

/* ── Topology response and stability ─────────────────────────────────────── */

/* Theta_q = delta_top log I_q, sigma = Delta Theta, nu = Delta^2 Theta, and identically
   delta_top rho_q = sigma_q, delta_top(Delta^2 Gamma_q) = -nu_q. So a CONSTANT topology
   term moves nothing, a term AFFINE in q shifts the crossing while leaving kappa alone,
   and only a genuinely nonlinear finite spectral term changes both. */
export function topologyResponse(theta, qMin = 1) {
  const t = Array.from(theta, Number);
  const rows = [];
  for (let i = 0; i < t.length; i++) {
    const r = { q: qMin + i, theta: t[i] };
    if (i + 1 < t.length) r.sigma = t[i + 1] - t[i];
    if (i + 2 < t.length) r.nu = t[i + 2] - 2 * t[i + 1] + t[i];
    rows.push(r);
  }
  const sig = rows.filter(r => r.sigma !== undefined).map(r => Math.abs(r.sigma));
  const nu = rows.filter(r => r.nu !== undefined).map(r => Math.abs(r.nu));
  const constantTerm = sig.every(s => s <= 1e-12);
  const affine = !constantTerm && nu.every(v => v <= 1e-12);
  return { rows,
    sup_abs_sigma: sig.length ? Math.max(...sig) : 0,
    sup_abs_nu: nu.length ? Math.max(...nu) : 0,
    kind: constantTerm ? 'constant — changes neither location nor shape'
      : affine ? 'affine in q — shifts the crossing, leaves kappa unchanged'
      : 'nonlinear — changes both location and shape',
    changes_location: !constantTerm,
    changes_shape: !constantTerm && !affine };
}

/* the sufficient bounds of the topology-stable criterion, checked rather than quoted:
   max(|sigma_{q*-1}|, |sigma_{q*}|) < m_*  and  sup_q |nu_q| < c_* */
export function topologyStability({ selection, response }) {
  const { q_star, m_star, c_star } = selection;
  if (q_star === null || m_star === null || c_star === null)
    return { applicable: false, reason: 'no unique selection to stabilise' };
  const at = q => { const r = response.rows.find(x => x.q === q); return r && r.sigma !== undefined ? Math.abs(r.sigma) : 0; };
  const locBound = Math.max(at(q_star - 1), at(q_star));
  const shapeBound = response.sup_abs_nu;
  const locOK = locBound < m_star, shapeOK = shapeBound < c_star;
  return { applicable: true, q_star, m_star, c_star,
    location_margin: m_star - locBound, shape_margin: c_star - shapeBound,
    location_stable: locOK, shape_stable: shapeOK,
    sector_preserved: locOK && shapeOK,
    verdict: locOK && shapeOK
      ? `the selected sector and strict convexity both survive this deformation`
      : !locOK ? 'the deformation can move the crossing — location is NOT protected'
      : 'the deformation can break strict convexity — shape is NOT protected' };
}

/* ── The general finite-difference quotient theorem ──────────────────────── */

/* ker Delta^{r+1} = span{ binom(q,0), ..., binom(q,r) }, and Delta^{r+1} is onto. The
   affine selector invariant is the r = 1 case; this is the statement it specialises. */
export function differenceQuotient(f, r) {
  let a = Array.from(f, Number);
  const stages = [a.slice()];
  for (let k = 0; k <= r; k++) {
    a = a.slice(1).map((x, i) => x - a[i]);
    stages.push(a.slice());
  }
  const annihilated = a.every(x => Math.abs(x) < 1e-9 * (1 + Math.max(...stages[0].map(Math.abs))));
  return { r, stages, final: a, annihilated,
    kernel_basis: Array.from({ length: r + 1 }, (_, j) => `binom(q,${j})`),
    complete_modulo: `a polynomial nuisance sequence of degree at most ${r}` };
}

export const SELECTOR_EQUATIONS = Object.freeze([
  'Z_q^UV = I_q^UV / Gamma(q+1)',
  'I_q -> C e^{aq} I_q leaves the physics unchanged',
  'kappa_q = Delta^2 log I_q  (complete invariant modulo aq + b)',
  'rho_q = log(I_{q+1}/I_q) - log(q+1)',
  'Gamma_q = -log Z_q,  Delta^2 Gamma_q = log((q+2)/(q+1)) - kappa_q',
  'Delta^2 Gamma > 0 and rho_{q*-1} > 0 > rho_{q*}  =>  q_* unique',
  'I_{q+1}/I_q <= C  =>  Z_{q+1}/Z_q <= C/(q+1) < 1 for q+1 > C',
  'delta_top rho_q = sigma_q,  delta_top(Delta^2 Gamma_q) = -nu_q',
  'max(|sigma_{q*-1}|,|sigma_{q*}|) < m_* and sup|nu| < c_*  =>  sector preserved',
  'ker Delta^{r+1} = P_r'
]);
