import { defineLab, domainError } from '../contract.mjs';
import { STATUS } from '../status.mjs';
import { capacity, bosonicQuotient, gluing, effectiveDivisor, compoundPoissonRigidity,
  cornerModes, centralWeightDiagnostic, EMBADON_EQUATIONS } from '../civp/embadon.mjs';

/* weights arrive as a word or a list. The word matters: "unit" is the certificate C_U
   holding, "spread" is it failing while the MEAN stays one — which is the case the no-go
   theorem exists for, because gamma_bar = 1 gives q_can = N_emb without any gamma_i = 1. */
function buildWeights(spec, N) {
  const s = String(spec).trim().toLowerCase();
  if (s === 'unit') return Array.from({ length: N }, () => 1);
  if (s.startsWith('spread')) {
    const amp = Number(s.split(':')[1] ?? 0.4);
    if (!(amp >= 0 && amp < 1)) throw domainError('spread amplitude lies in [0,1)', { amp });
    /* mean exactly one, pointwise never one — the interesting failure of C_U */
    return Array.from({ length: N }, (_, i) => 1 + amp * Math.cos(2 * Math.PI * (i + 0.5) / N))
      .map((w, _, a) => w * N / a.reduce((x, y) => x + y, 0));
  }
  const w = s.split(',').map(Number);
  if (w.length !== N || w.some(x => !Number.isFinite(x) || x <= 0))
    throw domainError(`weights must be "unit", "spread:amp", or ${N} positive numbers`, { given: w.length, expected: N });
  return w;
}

export default defineLab({
  id: 'civp.embadon_measure',
  title: 'Molecular null geometry — support is not area',
  status: STATUS.EXACT,
  model_id: 'civp.atomic_area_measure',
  equation_ids: ['embadon.measure', 'embadon.capacity', 'embadon.bosonic_quotient',
    'embadon.gluing', 'embadon.compound_poisson', 'embadon.corner_modes'],
  summary:
    'The atomic decomposition of the null area measure buys a support count and a permutation ' +
    'quotient; it does not buy q_can = N_emb. This laboratory computes the capacity, the mean ' +
    'weight and the gap between them, matches two atomic measures across a double-null gluing, ' +
    'and applies the compound-Poisson rigidity theorem — which it REFUSES to apply when the ' +
    'moments and the count were taken in different reduced measures.',
  formulas: EMBADON_EQUATIONS,
  assumptions: [
    'the area measure is positive, finite and atomic, written in minimal form',
    'the permutation action is free on the distinct-point locus',
    'the compound-Poisson hypotheses require ONE reduced physical measure for both moments'
  ],
  domain_of_validity: [
    'any finite family of positive atomic weights',
    'gluing compares two measures on the common cut only; tangential and Hájiček data are out of scope'
  ],
  falsifiers: [
    'q_can ≠ Σγ_i',
    'a spread of weights with mean one is reported as satisfying the pointwise unit gate',
    'the rigidity theorem returns a conclusion when the two measures are differently labelled',
    'a permuted copy of an atomic measure is reported incompatible with its original'
  ],
  verifiers: ['docs/verify-civp-locking.cjs'],
  open_problems: [
    'certificate C_U: derive γ_i = 1 in the same reduced physical measure that defines the count',
    'a common treatment of collisions and stabilisers across the two null sheets'
  ],
  cost_hint: 'fast',
  inputs: [
    { name: 'n_emb', type: 'number', unit: 'dimensionless', default: 8, min: 1, max: 512,
      doc: 'number of embadons in the sample' },
    { name: 'weights', type: 'string', default: 'unit',
      doc: '"unit", "spread:amp" (mean one, pointwise not), or an explicit comma list' },
    { name: 'E_gamma', type: 'number', unit: 'dimensionless', default: 1, min: 0, max: 1e6,
      doc: 'first moment of the weight law in the compound-Poisson ensemble' },
    { name: 'E_gamma2', type: 'number', unit: 'dimensionless', default: 1, min: 0, max: 1e12,
      doc: 'second moment of the weight law' },
    { name: 'poisson_Q', type: 'number', unit: 'dimensionless', default: 292, min: 1e-6, max: 1e12,
      doc: 'the Poisson parameter of the count' },
    { name: 'same_reduced_measure', type: 'boolean', default: true,
      doc: 'whether the moments and the count were taken in ONE reduced physical measure' },
    { name: 'c_matter', type: 'number', unit: 'dimensionless', default: 0, min: -1e3, max: 1e3,
      doc: 'matter central charge per ray in the non-expanding null-CFT diagnostic' }
  ],
  outputs: [
    { name: 'q_can', unit: 'dimensionless', doc: 'geometric capacity Σγ_i' },
    { name: 'gamma_bar', unit: 'dimensionless', doc: 'mean normalised weight' },
    { name: 'weight_variance', unit: 'dimensionless', doc: 'variance of the sampled weights' },
    { name: 'capacity_equals_count', type: 'boolean', unit: null, doc: 'whether q_can = N_emb for this sample' },
    { name: 'certificate_C_U', type: 'boolean', unit: null, doc: 'whether every γ_i = 1 (the pointwise gate)' },
    { name: 'log_bosonic_quotient', unit: 'dimensionless', doc: '−log N!, the unordered configuration quotient' },
    { name: 'collective_pairs', unit: 'dimensionless', doc: 'capacity-conjugate modes (always one)' },
    { name: 'relative_pairs', unit: 'dimensionless', doc: 'relative shape modes (N − 1)' },
    { name: 'collective_commutator', unit: 'dimensionless', doc: '|[q̂_can, μ̄̂]| = 2π' },
    { name: 'gluing_compatible', type: 'boolean', unit: null, doc: 'a permuted copy of the measure glues exactly' },
    { name: 'gluing_max_mass_defect', unit: 'dimensionless', doc: 'largest atomic mass disagreement across the cut' },
    { name: 'E_q_A', unit: 'dimensionless', doc: 'Q·E γ, the compound-Poisson mean' },
    { name: 'Var_q_A', unit: 'dimensionless', doc: 'Q·E γ², the compound-Poisson variance' },
    { name: 'rigidity_gamma_is_unit', type: 'boolean', unit: null, doc: 'whether the theorem concludes γ = 1 a.s.' },
    { name: 'rigidity_verdict', type: 'string', unit: null, doc: 'why it does or does not conclude' },
    { name: 'c_tot', unit: 'dimensionless', doc: 'total ray central charge c_ray·N_emb' },
    { name: 'central_weight_residual', unit: 'dimensionless', doc: '|c_tot/q_can − c_ray/γ̄|' }
  ],
  evaluate(i) {
    const N = Math.round(i.n_emb);
    const w = buildWeights(i.weights, N);
    const cap = capacity(w);
    const bq = bosonicQuotient(N);
    /* the gluing test is the theorem's own statement: a permuted copy must match exactly */
    const atoms = w.map((weight, k) => ({ re: Math.cos(2 * Math.PI * k / N), im: Math.sin(2 * Math.PI * k / N), w: weight }));
    const permuted = atoms.slice().reverse();
    const glue = gluing(atoms, permuted);
    const rig = compoundPoissonRigidity({ Q: i.poisson_Q, E_gamma: i.E_gamma, E_gamma2: i.E_gamma2,
      measure_moments: 'reduced-UV', measure_count: i.same_reduced_measure ? 'reduced-UV' : 'horizon-phase-space' });
    const modes = cornerModes(N);
    const cw = centralWeightDiagnostic({ c_matter: i.c_matter, n_emb: N, q_can: cap.q_can });
    const warnings = [];
    if (cap.mean_unit && !cap.unit_weights)
      warnings.push('γ̄ = 1 with γ_i ≠ 1: q_can = N_emb holds numerically while the POINTWISE unit gate fails — ' +
        'this is exactly the case the no-go theorem separates');
    return { outputs: {
      q_can: cap.q_can, gamma_bar: cap.gamma_bar, weight_variance: cap.weight_variance,
      capacity_equals_count: cap.capacity_equals_count, certificate_C_U: cap.certificate_C_U,
      log_bosonic_quotient: -bq.log_factorial,
      collective_pairs: modes.collective_pairs, relative_pairs: modes.relative_pairs,
      collective_commutator: modes.commutator_magnitude,
      gluing_compatible: glue.compatible, gluing_max_mass_defect: glue.max_mass_defect,
      E_q_A: rig.E_q_A, Var_q_A: rig.Var_q_A,
      rigidity_gamma_is_unit: rig.gamma_is_unit_a_s, rigidity_verdict: rig.verdict,
      c_tot: cw.c_tot, central_weight_residual: cw.residual },
      warnings,
      diagnostics: { divisor: effectiveDivisor(atoms.map(a => ({ ...a, mult: 1 }))).degree,
        gluing_still_open: glue.still_open, weights_used: w.length <= 16 ? w : `${w.length} weights` } };
  },
  selftests: [
    { name: 'the capacity is the sum of the weights and nothing else',
      run(L) { const r = L.run({ n_emb: 12, weights: 'spread:0.6' }, { provenance: {} });
        return { pass: Math.abs(r.outputs.q_can - 12) < 1e-9,
          detail: `Σγ = ${r.outputs.q_can.toFixed(12)} at N = 12, mean ${r.outputs.gamma_bar.toFixed(12)}` }; } },
    { name: 'mean-one weights give q_can = N_emb WITHOUT satisfying the pointwise unit gate',
      run(L) { const r = L.run({ n_emb: 12, weights: 'spread:0.6' }, { provenance: {} });
        return { pass: r.outputs.capacity_equals_count && !r.outputs.certificate_C_U,
          detail: `q_can = N_emb is ${r.outputs.capacity_equals_count}, C_U is ${r.outputs.certificate_C_U}, ` +
            `variance ${r.outputs.weight_variance.toExponential(3)} — the two statements are not the same statement` }; } },
    { name: 'unit weights satisfy both',
      run(L) { const r = L.run({ n_emb: 9, weights: 'unit' }, { provenance: {} });
        return { pass: r.outputs.capacity_equals_count && r.outputs.certificate_C_U && r.outputs.weight_variance === 0,
          detail: 'γ_i = 1 for all i' }; } },
    { name: 'a permuted atomic measure glues exactly, to machine zero',
      run(L) { let worst = 0, all = true;
        for (const n of [3, 7, 16, 33]) { const r = L.run({ n_emb: n, weights: 'spread:0.3' }, { provenance: {} });
          all = all && r.outputs.gluing_compatible; worst = Math.max(worst, r.outputs.gluing_max_mass_defect); }
        return { pass: all && worst === 0, detail: `four cuts, max mass defect ${worst}` }; } },
    { name: 'the rigidity theorem refuses to conclude across two different reduced measures',
      run(L) { const same = L.run({ E_gamma: 1, E_gamma2: 1, same_reduced_measure: true }, { provenance: {} });
        const diff = L.run({ E_gamma: 1, E_gamma2: 1, same_reduced_measure: false }, { provenance: {} });
        return { pass: same.outputs.rigidity_gamma_is_unit && !diff.outputs.rigidity_gamma_is_unit,
          detail: 'identical moments; the only difference is the measure label, and it changes the answer' }; } },
    { name: 'unit moments are necessary: E γ² > 1 blocks the conclusion',
      run(L) { const r = L.run({ E_gamma: 1, E_gamma2: 1.25, same_reduced_measure: true }, { provenance: {} });
        return { pass: !r.outputs.rigidity_gamma_is_unit,
          detail: `Var γ = ${(1.25 - 1).toFixed(2)} ≠ 0, so the weights are not almost surely one` }; } },
    { name: 'one collective mode and N − 1 relative modes, with [q̂, μ̄̂] = 2πi',
      run(L) { let ok = true;
        for (const n of [1, 2, 5, 64]) { const r = L.run({ n_emb: n }, { provenance: {} });
          ok = ok && r.outputs.collective_pairs === 1 && r.outputs.relative_pairs === n - 1
            && Math.abs(r.outputs.collective_commutator - 2 * Math.PI) < 1e-15; }
        return { pass: ok, detail: 'the commutator does not quantise q_can, and the laboratory does not claim it does' }; } }
  ]
});
