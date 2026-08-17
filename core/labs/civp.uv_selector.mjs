import { defineLab, domainError } from '../contract.mjs';
import { STATUS } from '../status.mjs';
/* The mathematics is NOT in this file. It lives in index.html, where the atlas draws it,
   and scripts/extract-kernels.mjs slices it into core/atlas/extracted.mjs. A kernel that
   retyped it would be a second copy, and the drift between the picture and the number is
   exactly the failure this core exists to prevent. */
import { civpKappa as kappa, civpReweight as affineReweight, civpSelect as selectSector,
  civpBoundedGrowth as boundedGrowthNoGo, civpTopResponse as topologyResponse,
  civpTopStability as topologyStability, civpDiffQuotient as differenceQuotient } from '../atlas/extracted.mjs';

/* The primitive sequence is generated from a declared law rather than supplied blind, so
   the affine nuisance can be switched on and the invariant watched not to move.
   I_q = C exp(a q) exp(alpha q ln(q+1)) — the second factor is the O(q ln q) growth the
   bounded-growth no-go says a crossing at large capacity requires. */
function buildPrimitive(spec, qMin, qMax, alpha, C, a) {
  const s = String(spec).trim().toLowerCase();
  const n = qMax - qMin + 1;
  if (s === 'auto') {
    if (!(alpha > 0)) throw domainError('alpha must be positive for the auto primitive law', { alpha });
    return Array.from({ length: n }, (_, k) => {
      const q = qMin + k;
      return C * Math.exp(a * q) * Math.exp(alpha * q * Math.log(q + 1));
    });
  }
  if (s.startsWith('bounded')) {
    /* the spectator case: adjacent growth capped at a constant, which the no-go says
       cannot move a selector to macroscopic capacity */
    const g = Number(s.split(':')[1] ?? 3);
    return Array.from({ length: n }, (_, k) => C * Math.exp(a * (qMin + k)) * Math.pow(g, k));
  }
  const v = s.split(',').map(Number);
  if (v.length !== n || v.some(x => !(x > 0)))
    throw domainError(`an explicit primitive needs ${n} strictly positive values`, { given: v.length, expected: n });
  return v.map((x, k) => C * Math.exp(a * (qMin + k)) * x);
}

function buildTopology(kind, amp, qMin, qMax) {
  const n = qMax - qMin + 1;
  const s = String(kind).trim().toLowerCase();
  if (s === 'none') return Array.from({ length: n }, () => 0);
  if (s === 'constant') return Array.from({ length: n }, () => amp);
  if (s === 'affine') return Array.from({ length: n }, (_, k) => amp * (qMin + k));
  if (s === 'casimir') /* a finite winding-sensitive term: bounded, nonlinear, decaying */
    return Array.from({ length: n }, (_, k) => amp / Math.pow(qMin + k, 2));
  throw domainError('topology must be none, constant, affine or casimir', { kind });
}

const SELECTOR_EQUATIONS = Object.freeze([
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

export default defineLab({
  id: 'civp.uv_selector',
  title: 'Invariant UV selector — shape is a quotient, location is not',
  status: STATUS.EXACT,
  model_id: 'civp.selector_calculus',
  equation_ids: ['selector.Zq', 'selector.kappa', 'selector.rho', 'selector.free_curvature',
    'selector.unique', 'nogo.bounded_growth', 'topology.response', 'difference.quotient'],
  summary:
    'κ_q = Δ²log I_q is invariant under the boundary-tension and normalisation freedom I_q → C e^{aq} I_q, ' +
    'and complete modulo it. So the SHAPE of the selector is a quotient and its LOCATION is not: the same ' +
    'reweighting that leaves κ untouched shifts every adjacent log-ratio by a. This laboratory finds the ' +
    'maximiser two independent ways — by the sign change of ρ_q under strict convexity, and by scanning ' +
    'log Z_q directly — and reports whether they agree.',
  formulas: SELECTOR_EQUATIONS,
  assumptions: [
    'a complete reduction of gauge, corner and permutation redundancies has produced a positive fixed-sector amplitude',
    'the 1/q! is present only if a residual indistinguishable-constituent quotient survives the SAME reduction',
    'q ranges over an integer interval'
  ],
  domain_of_validity: [
    'strictly positive primitive sequences of at least three terms',
    'the selector theorem is exact discrete calculus; it does not supply the measure that defines I_q'
  ],
  falsifiers: [
    'κ_q changes under I_q → C e^{aq} I_q',
    'Δ²Γ_q ≠ log((q+2)/(q+1)) − κ_q',
    'the crossing and the direct argmax disagree while strict convexity holds',
    'a bounded-growth primitive produces a crossing beyond q + 1 > C'
  ],
  verifiers: ['docs/verify-civp-locking.cjs', 'docs/verify-capacity-selector-closure.cjs'],
  open_problems: [
    'certificate C_UV: derive one reduced ultraviolet measure that produces a positive primitive sequence',
    'the absolute linear datum that fixes the location of the maximum is not supplied by the quotient calculus'
  ],
  cost_hint: 'fast',
  inputs: [
    { name: 'q_min', type: 'number', unit: 'dimensionless', default: 1, min: 1, max: 4096, doc: 'first integer sector' },
    { name: 'q_max', type: 'number', unit: 'dimensionless', default: 64, min: 3, max: 4096, doc: 'last integer sector' },
    { name: 'primitive', type: 'string', default: 'auto',
      doc: '"auto" (order q log q growth), "bounded:C" (a spectator), or an explicit comma list' },
    { name: 'alpha', type: 'number', unit: 'dimensionless', default: 0.75, min: 1e-6, max: 8,
      doc: 'growth coefficient of the auto primitive law' },
    { name: 'affine_a', type: 'number', unit: 'dimensionless', default: 0, min: -20, max: 20,
      doc: 'the nuisance exponent a in I_q → C e^{aq} I_q — κ must not move' },
    { name: 'affine_C', type: 'number', unit: 'dimensionless', default: 1, min: 1e-12, max: 1e12,
      doc: 'the nuisance normalisation C' },
    { name: 'topology', type: 'string', default: 'none', enum: ['none', 'constant', 'affine', 'casimir'],
      doc: 'the finite topology/Casimir deformation applied to log I_q' },
    { name: 'topology_amplitude', type: 'number', unit: 'dimensionless', default: 0, min: -100, max: 100,
      doc: 'amplitude of that deformation' }
  ],
  outputs: [
    { name: 'q_star', unit: 'dimensionless', doc: 'the selected sector from the adjacent sign change, or null' },
    { name: 'argmax_direct', unit: 'dimensionless', doc: 'the maximiser of log Z_q found by direct scan' },
    { name: 'routes_agree', type: 'boolean', unit: null, doc: 'whether the two routes name the same sector' },
    { name: 'unique_maximiser', type: 'boolean', unit: null, doc: 'convexity AND one crossing AND agreement' },
    { name: 'strictly_convex', type: 'boolean', unit: null, doc: 'Δ²Γ_q > 0 throughout the interior' },
    { name: 'c_star', unit: 'dimensionless', doc: 'inf Δ²Γ_q, the shape margin' },
    { name: 'm_star', unit: 'dimensionless', doc: 'min(ρ_{q*−1}, −ρ_{q*}), the location margin' },
    { name: 'kappa_invariance_residual', unit: 'dimensionless', doc: 'largest change in κ under the applied affine reweighting' },
    { name: 'identity_residual', unit: 'dimensionless', doc: 'largest departure from Δ²Γ_q = log((q+2)/(q+1)) − κ_q' },
    { name: 'topology_kind', type: 'string', unit: null, doc: 'constant, affine or nonlinear, deduced from the response' },
    { name: 'sup_sigma', unit: 'dimensionless', doc: 'sup|Δ δ_top log I_q|, the location response' },
    { name: 'sup_nu', unit: 'dimensionless', doc: 'sup|Δ² δ_top log I_q|, the shape response' },
    { name: 'sector_preserved', type: 'boolean', unit: null, doc: 'whether the sufficient stability bounds hold' },
    { name: 'location_margin', unit: 'dimensionless', doc: 'm* − max(|σ_{q*−1}|,|σ_{q*}|)' },
    { name: 'shape_margin', unit: 'dimensionless', doc: 'c* − sup|ν|' },
    { name: 'bounded_growth_threshold', unit: 'dimensionless', doc: 'the q beyond which a bounded primitive can no longer cross' }
  ],
  evaluate(i) {
    const qMin = Math.round(i.q_min), qMax = Math.round(i.q_max);
    if (qMax - qMin < 2) throw domainError('the second difference needs at least three sectors', { q_min: qMin, q_max: qMax });
    const bare = buildPrimitive(i.primitive, qMin, qMax, i.alpha, 1, 0);
    const theta = buildTopology(i.topology, i.topology_amplitude, qMin, qMax);
    /* the deformation acts on log I, exactly as Theta_q is defined */
    const deformed = bare.map((x, k) => x * Math.exp(theta[k]));
    const used = affineReweight(deformed, { C: i.affine_C, a: i.affine_a }, qMin);
    const sel = selectSector(used, qMin);
    /* the invariance test is run on the SAME data the answer came from, not on a fresh example */
    const k0 = kappa(deformed, qMin).map(x => x.kappa);
    const k1 = kappa(used, qMin).map(x => x.kappa);
    const kres = Math.max(0, ...k0.map((v, n) => Math.abs(v - k1[n])));
    const resp = topologyResponse(theta, qMin);
    const stab = topologyStability(sel, resp);
    /* C is MEASURED from the sequence actually used, not guessed from the growth law, so the
       no-go threshold means something for an explicit or bounded primitive too */
    const ratios = used.slice(1).map((x, k) => x / used[k]);
    const bg = boundedGrowthNoGo(Math.max(...ratios), qMax);
    const warnings = [];
    if (!sel.strictly_convex)
      warnings.push('strict discrete convexity fails on this interval — a sign change here is not a selection');
    if (sel.crossings.length > 1)
      warnings.push(`${sel.crossings.length} crossings found; the convexity hypothesis is violated somewhere`);
    return { outputs: {
      q_star: sel.q_star, argmax_direct: sel.argmax_direct, routes_agree: sel.routes_agree,
      unique_maximiser: sel.unique_maximiser, strictly_convex: sel.strictly_convex,
      c_star: sel.c_star, m_star: sel.m_star,
      kappa_invariance_residual: kres, identity_residual: sel.max_identity_residual,
      topology_kind: resp.kind, sup_sigma: resp.sup_abs_sigma, sup_nu: resp.sup_abs_nu,
      sector_preserved: stab.applicable ? stab.sector_preserved : null,
      location_margin: stab.applicable ? stab.location_margin : null,
      shape_margin: stab.applicable ? stab.shape_margin : null,
      bounded_growth_threshold: bg.q_threshold },
      warnings,
      diagnostics: { verdict: sel.verdict, crossings: sel.crossings,
        stability: stab.applicable ? stab.verdict : stab.reason,
        rows: sel.rows.filter(r => r.rho !== undefined)
          .map(r => ({ q: r.q, log_Z: r.log_Z, rho: r.rho, kappa: r.kappa, d2Gamma: r.d2Gamma })) } };
  },
  selftests: [
    { name: 'κ is untouched by the affine nuisance, over a grid of C and a',
      run(L) { let worst = 0;
        for (const a of [-2, -0.3, 0, 0.7, 3]) for (const C of [1e-6, 1, 1e6]) {
          const r = L.run({ affine_a: a, affine_C: C }, { provenance: {} });
          worst = Math.max(worst, r.outputs.kappa_invariance_residual); }
        return { pass: worst < 1e-11, detail: `15 reweightings, largest change in κ = ${worst.toExponential(2)}` }; } },
    { name: 'the free-energy curvature identity closes to machine precision',
      run(L) { let worst = 0;
        for (const alpha of [0.3, 0.75, 1.4]) for (const qm of [8, 24, 60]) {
          const r = L.run({ alpha, q_max: qm }, { provenance: {} });
          worst = Math.max(worst, r.outputs.identity_residual); }
        return { pass: worst < 1e-10,
          detail: `Δ²Γ = log((q+2)/(q+1)) − κ verified against Γ itself; worst residual ${worst.toExponential(2)}` }; } },
    { name: 'the crossing and the direct argmax name the same sector whenever the maximum is interior',
      run(L) { let checked = 0, edge = 0, ok = true;
        for (const alpha of [0.4, 0.55, 0.62, 0.75, 0.8]) {
          const r = L.run({ alpha, q_max: 64 }, { provenance: {} });
          if (!r.outputs.strictly_convex) continue;
          /* a maximum sitting ON the first sector has no adjacent sign change to find, and
             reporting q_* = null there is the right answer rather than a miss */
          if (r.outputs.argmax_direct === 1 || r.outputs.argmax_direct === 64) {
            ok = ok && r.outputs.q_star === null; edge++; continue; }
          ok = ok && r.outputs.routes_agree === true && r.outputs.unique_maximiser; checked++; }
        return { pass: ok && checked >= 3,
          detail: `${checked} interior selectors with both routes agreeing on q_*, and ${edge} boundary ` +
            'maximum reported as no crossing rather than as a selection' }; } },
    { name: 'the affine nuisance moves the location and leaves the shape alone',
      run(L) { const base = L.run({ affine_a: 0 }, { provenance: {} });
        const tilt = L.run({ affine_a: -0.2 }, { provenance: {} });
        return { pass: base.outputs.q_star !== null && tilt.outputs.q_star !== null
            && tilt.outputs.q_star < base.outputs.q_star
            && Math.abs(base.outputs.c_star - tilt.outputs.c_star) < 1e-10,
          detail: `q_* moves ${base.outputs.q_star} → ${tilt.outputs.q_star} while c_* stays ` +
            `${base.outputs.c_star.toExponential(6)} — this is why removing C_UV leaves q_* undetermined` }; } },
    { name: 'a constant topology term changes neither location nor shape',
      run(L) { const base = L.run({ topology: 'none' }, { provenance: {} });
        const con = L.run({ topology: 'constant', topology_amplitude: 12.5 }, { provenance: {} });
        return { pass: base.outputs.q_star === con.outputs.q_star && con.outputs.sup_sigma === 0
            && con.outputs.sup_nu === 0 && con.outputs.topology_kind.startsWith('constant'),
          detail: 'σ = ν = 0, and q_* is unmoved by a shift of 12.5 in log I' }; } },
    { name: 'an affine topology term shifts the crossing and leaves κ untouched',
      run(L) { const base = L.run({ topology: 'none' }, { provenance: {} });
        const aff = L.run({ topology: 'affine', topology_amplitude: -0.02 }, { provenance: {} });
        return { pass: aff.outputs.sup_nu < 1e-12 && aff.outputs.q_star !== null
            && aff.outputs.q_star < base.outputs.q_star,
          detail: `ν ≡ 0 so the shape is protected, while q_* moves ${base.outputs.q_star} → ${aff.outputs.q_star}` }; } },
    { name: 'the stability bounds pass a small Casimir deformation and are reported honestly',
      run(L) { const r = L.run({ topology: 'casimir', topology_amplitude: 0.002 }, { provenance: {} });
        return { pass: r.outputs.sector_preserved === true && r.outputs.location_margin > 0 && r.outputs.shape_margin > 0,
          detail: `location margin ${r.outputs.location_margin.toExponential(3)}, shape margin ${r.outputs.shape_margin.toExponential(3)}` }; } },
    { name: 'a bounded-growth spectator cannot hold a crossing past q + 1 > C',
      run(L) { const r = L.run({ primitive: 'bounded:3.5', q_min: 1, q_max: 40 }, { provenance: {} });
        const crossingsBeyond = r.outputs.q_star !== null && r.outputs.q_star > r.outputs.bounded_growth_threshold + 1;
        return { pass: !crossingsBeyond,
          detail: `threshold q ≈ ${r.outputs.bounded_growth_threshold}; the selector does not survive beyond it, ` +
            'so a fixed finite spectator degeneracy cannot move the sector to macroscopic capacity' }; } },
    { name: 'the general difference quotient: Δ^{r+1} annihilates exactly the degree-r sequences',
      run() { const poly = q => 3 * (q * (q - 1) * (q - 2)) / 6 - 5 * q + 7;
        const f = Array.from({ length: 12 }, (_, q) => poly(q));
        const a = differenceQuotient(f, 3), b = differenceQuotient(f, 2);
        return { pass: a.annihilated && !b.annihilated,
          detail: 'Δ⁴ kills a cubic and Δ³ does not — the affine selector invariant is the r = 1 case' }; } }
  ]
});
