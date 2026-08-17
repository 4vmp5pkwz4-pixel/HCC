import { defineLab, domainError } from '../contract.mjs';
import { STATUS } from '../status.mjs';
/* The mathematics is NOT in this file. It lives in index.html, where the atlas draws it,
   and scripts/extract-kernels.mjs slices it into core/atlas/extracted.mjs. A kernel that
   retyped it would be a second copy, and the drift between the picture and the number is
   exactly the failure this core exists to prevent. */
import { civpBorelWeil as borelWeil, civpPolarisation as polarisationTransport,
  civpLeakage as stinespringLeakage, civpHankel as hankelRank, civpCapelli as capelliTransfer,
  civpProjectiveNoGo as projectiveRankNoGo, civpCapelliGate as capelliGate } from '../atlas/extracted.mjs';

/* the spectrum arrives as "x:m, x:m" so a SINGULAR central character can actually be
   written down — which is the whole point, because that is where the moment test goes
   blind and the Capelli transfer does not */
function parseSpectrum(spec) {
  const rows = String(spec).split(',').map(s => s.trim()).filter(Boolean).map(s => {
    const [x, m] = s.split(':').map(Number);
    if (!Number.isFinite(x)) throw domainError(`cannot read spectral entry "${s}"; expected "x:m"`, { entry: s });
    const mult = Number.isFinite(m) ? Math.round(m) : 1;
    if (mult < 1) throw domainError('spectral multiplicities are positive integers', { entry: s });
    return [x, mult];
  });
  if (!rows.length) throw domainError('the spectrum needs at least one point');
  return rows;
}

const CARRIER_EQUATIONS = Object.freeze([
  'V_N ≃ Sym^{N-1} C^2 ≃ H^0(CP^1, O(N-1)), N = 2J + 1',
  'c_1(L_N)[CP^1] = N - 1,  ind dbar_{L_N} = N',
  'Q(ab) - Q(a)Q(b) = V* pi(a) K pi(b) V,  K = 1 - VV*',
  'm_k = (1/r) sum x^k,  H^{(s)} = (m_{i+j}),  rank H = min(r, s+1)',
  'R_eps(u) = P_r(u + eps)/P_r(u),  div R_eps = tau_{-eps} D_P - D_P',
  'd_n = m_{n+1} - m_n,  m_n = -sum_{j>=n} d_j',
  'Xi_k = C_{k+1} C_{k-1} / C_k^2 is invariant under C_k -> A B^k C_k'
]);

export default defineLab({
  id: 'civp.finite_carrier',
  title: 'Berry–Kirillov and Capelli — two routes to one integer',
  status: STATUS.EXACT,
  model_id: 'civp.finite_carrier_extraction',
  equation_ids: ['borel_weil', 'berry.chern', 'atiyah.curvature', 'stinespring.leakage',
    'hankel.rank', 'capelli.transfer', 'capelli.reconstruction', 'nogo.projective_rank'],
  summary:
    'The Berry–Kirillov line over the round carrier has degree N − 1 and Dolbeault index N — the same ' +
    'off-by-one that forbids identifying embadons with the zeros of one section. The Capelli branch is ' +
    'logically independent: ordinary moments see only DISTINCT spectral points, while the rational ' +
    'transfer R_ε(u) = P(u+ε)/P(u) recovers every multiplicity by m_n = −Σ_{j≥n} d_j. Both are computed ' +
    'here on the same spectrum so the blindness of one and the fidelity of the other are visible at once.',
  formulas: CARRIER_EQUATIONS,
  assumptions: [
    'the round polarisation is selected; a generic superrotation transports it rather than acting inside a fixed K_q',
    'the central sequence is nonvanishing on a connected interval for the cross-ratio statement',
    'the Stinespring instance computed here is a coordinate compression of a finite algebra'
  ],
  domain_of_validity: [
    'N ≥ 1 for the carrier; any finite root divisor for the transfer',
    'the transfer chart uses ε = ±1 and reconstructs orbit by orbit'
  ],
  falsifiers: [
    'the Chern number and the analytic index fail to differ by exactly one',
    'the Hankel rank differs from min(distinct points, s + 1)',
    'the Capelli reconstruction fails to return the input root divisor',
    'two determinant-character families of different rank are distinguished by cross ratios alone'
  ],
  verifiers: ['docs/verify-civp-locking.cjs'],
  open_problems: [
    'an N-independent raw family of central observables defined from CIVP data',
    'one absolute rank-sensitive datum: a defining block, a full transfer degree, or a rotation-cover parity',
    'the nondegeneracy conditions under which the finite symbol band spans End(V_N)'
  ],
  cost_hint: 'fast',
  inputs: [
    { name: 'N', type: 'number', unit: 'dimensionless', default: 6, min: 1, max: 4096,
      doc: 'dimension of the finite round carrier V_N, N = 2J + 1' },
    { name: 'spectrum', type: 'string', default: '0:3, 2:1, 5:2',
      doc: 'the centred root divisor as "x:m" entries — repeat a value to make the character singular' },
    { name: 'hankel_s', type: 'number', unit: 'dimensionless', default: 5, min: 0, max: 40,
      doc: 'size parameter of the moment Hankel matrix H^{(s)}' },
    { name: 'epsilon', type: 'number', unit: 'dimensionless', default: 1, enum: [1, -1],
      doc: 'the transfer chart, ε = +1 or −1; both reconstruct the same divisor' },
    { name: 'compression_k', type: 'number', unit: 'dimensionless', default: 2, min: 1, max: 64,
      doc: 'dimension of the compressed block in the Stinespring leakage diagnostic' }
  ],
  outputs: [
    { name: 'chern_number', unit: 'dimensionless', doc: 'c₁(L_N)[CP¹] = N − 1' },
    { name: 'index_dbar', unit: 'dimensionless', doc: 'ind ∂̄ = dim H⁰ = N' },
    { name: 'off_by_one', unit: 'dimensionless', doc: 'index − Chern, which is always 1' },
    { name: 'dim_endomorphisms', unit: 'dimensionless', doc: 'dim End V_N = N²' },
    { name: 'classically_splittable', type: 'boolean', unit: null, doc: 'whether the Atiyah extension splits classically (only N = 1)' },
    { name: 'spectral_rank', unit: 'dimensionless', doc: 'r = Σ m_x, the true rank including multiplicities' },
    { name: 'distinct_points', unit: 'dimensionless', doc: 'how many distinct spectral values there are' },
    { name: 'hankel_rank', unit: 'dimensionless', doc: 'rank H^{(s)}, computed by elimination' },
    { name: 'hankel_predicted', unit: 'dimensionless', doc: 'min(distinct, s + 1)' },
    { name: 'hankel_sees_true_rank', type: 'boolean', unit: null, doc: 'whether the moment test recovers r' },
    { name: 'capelli_recovered_rank', unit: 'dimensionless', doc: 'the rank the transfer reconstructs' },
    { name: 'capelli_exact', type: 'boolean', unit: null, doc: 'whether the reconstruction returned the input divisor exactly' },
    { name: 'transfer_divisor_size', unit: 'dimensionless', doc: 'number of nonzero coefficients in div R_ε' },
    { name: 'projective_ranks_distinguished', type: 'boolean', unit: null, doc: 'whether cross ratios alone separate different ranks (they do not)' },
    { name: 'stinespring_leakage', unit: 'dimensionless', doc: '‖Q(ab) − Q(a)Q(b)‖ for the compression' },
    { name: 'stinespring_identity_residual', unit: 'dimensionless', doc: 'departure from V*π(a)Kπ(b)V' },
    { name: 'gate_clauses_satisfied', unit: 'dimensionless', doc: 'how many clauses of the Capelli–CIVP finite-rank gate hold' }
  ],
  evaluate(i) {
    const N = Math.round(i.N);
    const bw = borelWeil(N);
    const div = parseSpectrum(i.spectrum);
    const points = div.flatMap(([x, m]) => Array.from({ length: m }, () => x));
    const hk = hankelRank(points, Math.round(i.hankel_s));
    const cap = capelliTransfer(div, i.epsilon);
    const pj = projectiveRankNoGo();
    /* a deliberately non-commuting pair, so the leakage is a real number and not a
       trivially satisfied identity */
    const d = Math.max(3, Math.round(i.compression_k) + 1);
    const k = Math.min(Math.round(i.compression_k), d - 1);
    const A = Array.from({ length: d }, (_, r) => Array.from({ length: d }, (_, c) => Math.cos(1.7 * r + 0.9 * c)));
    const B = Array.from({ length: d }, (_, r) => Array.from({ length: d }, (_, c) => Math.sin(0.4 * r - 1.3 * c) + (r === c ? 1 : 0)));
    const st = stinespringLeakage(A, B, k);
    const gate = capelliGate({});
    const warnings = [];
    if (!hk.matches) warnings.push('the Hankel rank did not match min(distinct, s+1); check the tolerance');
    if (hk.distinct_points < hk.r)
      warnings.push(`this character is SINGULAR: ${hk.r} roots at ${hk.distinct_points} distinct values — ` +
        'the moment test cannot see the multiplicities and the transfer can');
    return { outputs: {
      chern_number: bw.chern_number, index_dbar: bw.index_dbar, off_by_one: bw.off_by_one,
      dim_endomorphisms: bw.dim_endomorphisms, classically_splittable: bw.classically_splittable,
      spectral_rank: cap.rank, distinct_points: hk.distinct_points,
      hankel_rank: hk.rank, hankel_predicted: hk.predicted_rank,
      hankel_sees_true_rank: hk.rank === cap.rank,
      capelli_recovered_rank: cap.recovered_rank, capelli_exact: cap.reconstruction_exact,
      transfer_divisor_size: cap.transfer_divisor.length,
      projective_ranks_distinguished: pj.ranks_distinguished,
      stinespring_leakage: st.leakage_norm, stinespring_identity_residual: st.identity_residual,
      gate_clauses_satisfied: gate.satisfied },
      warnings,
      diagnostics: { carrier: `V_N = Sym^{${N - 1}} C^2 = H^0(CP^1, O(${N - 1}))`,
        polarisation: polarisationTransport(N).fixed_polarisation_obstruction,
        root_divisor: cap.root_divisor, transfer_divisor: cap.transfer_divisor,
        recovered_divisor: cap.recovered_divisor,
        gate_status: gate.status, hankel_blind_spot: hk.blind_spot } };
  },
  selftests: [
    { name: 'the Chern number and the index differ by exactly one, for every rank tested',
      run(L) { const bad = [];
        for (const n of [1, 2, 3, 5, 8, 13, 55, 292, 4096]) { const r = L.run({ N: n }, { provenance: {} });
          if (r.outputs.index_dbar - r.outputs.chern_number !== 1 || r.outputs.index_dbar !== n) bad.push(n); }
        return { pass: bad.length === 0,
          detail: 'c₁ = N − 1 and ind ∂̄ = N — the same off-by-one that kills the literal zero-divisor identification' }; } },
    { name: 'the Hankel rank is min(distinct points, s + 1) and nothing else',
      run(L) { let ok = true, n = 0;
        for (const spec of ['0:1, 1:1, 2:1', '0:3, 2:1, 5:2', '1:1, 2:1, 3:1, 4:1, 5:1, 6:1', '7:4'])
          for (const s of [0, 1, 2, 3, 5, 8]) {
            const r = L.run({ spectrum: spec, hankel_s: s }, { provenance: {} });
            ok = ok && r.outputs.hankel_rank === r.outputs.hankel_predicted; n++; }
        return { pass: ok, detail: `${n} (spectrum, s) pairs agree with min(r_distinct, s+1)` }; } },
    { name: 'the moment test goes BLIND at a singular character and the transfer does not',
      run(L) { const r = L.run({ spectrum: '0:3, 2:1, 5:2', hankel_s: 8 }, { provenance: {} });
        return { pass: !r.outputs.hankel_sees_true_rank && r.outputs.capelli_exact
            && r.outputs.capelli_recovered_rank === r.outputs.spectral_rank,
          detail: `rank 6 at 3 distinct values: Hankel reports ${r.outputs.hankel_rank}, ` +
            `the Capelli transfer reconstructs ${r.outputs.capelli_recovered_rank} exactly` }; } },
    { name: 'both transfer charts ε = ±1 reconstruct the same divisor',
      run(L) { let ok = true;
        for (const spec of ['0:3, 2:1, 5:2', '−1:2, 0:1, 4:4'.replace('−', '-'), '3:1']) {
          const p = L.run({ spectrum: spec, epsilon: 1 }, { provenance: {} });
          const m = L.run({ spectrum: spec, epsilon: -1 }, { provenance: {} });
          ok = ok && p.outputs.capelli_exact && m.outputs.capelli_exact
            && p.outputs.capelli_recovered_rank === m.outputs.capelli_recovered_rank; }
        return { pass: ok, detail: 'forward and reverse cyclic central words are two charts of the same centred polynomial' }; } },
    { name: 'projective central data do NOT fix the rank',
      run(L) { const r = L.run({}, { provenance: {} });
        return { pass: r.outputs.projective_ranks_distinguished === false,
          detail: 'the families z_k = r·mᵏ have identical cross ratios for r = 2, 3, 5; ' +
            'one absolute rank-sensitive datum is unavoidable' }; } },
    { name: 'the Stinespring identity holds exactly, so the leakage is a measurement and not an artefact',
      run(L) { let worstId = 0, sawLeak = false;
        for (const k of [1, 2, 3, 5]) { const r = L.run({ compression_k: k }, { provenance: {} });
          worstId = Math.max(worstId, r.outputs.stinespring_identity_residual);
          sawLeak = sawLeak || r.outputs.stinespring_leakage > 1e-6; }
        return { pass: worstId < 1e-12 && sawLeak,
          detail: `Q(ab) − Q(a)Q(b) = V*π(a)Kπ(b)V to ${worstId.toExponential(2)}; the compression genuinely leaks` }; } },
    { name: 'the finite-rank gate reports itself unsatisfied rather than quietly passing',
      run(L) { const r = L.run({}, { provenance: {} });
        return { pass: r.outputs.gate_clauses_satisfied === 0,
          detail: 'five clauses, none supplied by this atlas — the Capelli branch is an extraction TARGET' }; } }
  ]
});
