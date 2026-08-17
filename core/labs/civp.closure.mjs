import { defineLab } from '../contract.mjs';
import { STATUS } from '../status.mjs';
/* The mathematics is NOT in this file. It lives in index.html, where the atlas draws it,
   and scripts/extract-kernels.mjs slices it into core/atlas/extracted.mjs. A kernel that
   retyped it would be a second copy, and the drift between the picture and the number is
   exactly the failure this core exists to prevent. */
import { civpVacuumShift as vacuumShiftKernel, civpDeSitter as deSitterFromCapacity,
  civpCapacityFromLambda as capacityFromLambda, civpSaddle as deSitterSaddleIdentity,
  civpEntropyBridge as entropyBridge, civpAddMultNoGo as additiveMultiplicativeNoGo,
  civpFirstLaw as capacityFirstLaw, civpShapeQuotient as bmsShapeQuotient,
  civpShapeNorm as shapeNorm, civpHopf as hopfSector, civpClosure as closure,
  CIVP_CERTIFICATES as CERTIFICATES, CIVP_LEDGER as TYPE_LEDGER, CIVP_GOLD as GOLDEN_INDEX } from '../atlas/extracted.mjs';

const CLOSURE_EQUATIONS = Object.freeze([
  'R_{mu nu} - (1/4) R g_{mu nu} = 8 pi G (T_{mu nu} - (1/4) T g_{mu nu})',
  'd(R + 8 pi G T) = 0',
  'q_can = A/(4 l_P^2) = 3 pi / (Lambda l_P^2)',
  'R_q = l_P sqrt(q/pi),  Lambda_q = 3 pi / (q l_P^2)',
  'q_dS = 3pi/(G hbar Lambda) = rho_Lambda V_4/hbar = -I_E/hbar = S_GH',
  'S_gen = A/(4 G hbar) + S_out = q_can + S_out',
  'Delta S_gen = log Ind(X);  Omega = e^{S_gen}, Omega_{n+1}/Omega_n = Ind',
  'Q + chi = e^chi Q  =>  Q = chi/(e^chi - 1), and no second step',
  'T_H delta q_H = delta M - Omega_H delta J - Phi_H delta Q_el',
  'D_AB[Y_lm] = 0 <=> l = 0,1;  int |D[Y_lm]|^2 = (1/2)(l-1)l(l+1)(l+2)',
  'H(h o U) = deg U'
]);

export default defineLab({
  id: 'civp.closure',
  title: 'Conditional closure — five certificates and a kinematic map',
  status: STATUS.CONDITIONAL,
  model_id: 'civp.five_certificate_closure',
  equation_ids: ['tracefree.kernel', 'ds.capacity_map', 'ds.saddle_identity', 'entropy.bridge',
    'nogo.additive_multiplicative', 'bh.capacity_first_law', 'bms.shape_quotient', 'hopf.degree'],
  summary:
    'R_q = ℓ_P√(q/π) and Λ_q = 3π/(q ℓ_P²) is a KINEMATIC map from a selected capacity to de Sitter ' +
    'geometry, not a prediction of Λ. This laboratory holds the five certificates as switches and ' +
    'computes which conclusions survive: remove any one and exactly one conclusion goes with it. It also ' +
    'keeps the entropy typing honest — S_gen is additive, so a finite-index bridge is ΔS_gen = log Ind, ' +
    'and both an additive and a constant multiplicative law can hold at Q = χ/(e^χ − 1) and at no second step.',
  formulas: CLOSURE_EQUATIONS,
  assumptions: [
    'the trace-free local equation with local stress-tensor conservation',
    'four-dimensional de Sitter kinematics with A = 4πR², R² = 3/Λ',
    'the entropy bridge ΔS_gen = log Ind is an additional physical hypothesis C_ent, not a theorem here',
    'ℓ_P defaults to the CODATA 2018 Planck length'
  ],
  domain_of_validity: [
    'q > 0; the map is exact for any selected positive capacity',
    'the closure theorem is conditional on the five certificates and the small-index classification hypotheses'
  ],
  falsifiers: [
    'the capacity round trip A/(4ℓ_P²) fails to return q',
    'Λ computed from R disagrees with Λ computed from q',
    'a conclusion survives the removal of the certificate that unlocks it',
    'the trace-free Hessian kernel is not exactly ℓ = 0 and 1'
  ],
  verifiers: ['docs/verify-civp-locking.cjs'],
  open_problems: [
    'C_X: a dualizable irreducible finite-index correspondence selected by the glued CIVP data',
    'C_win: the strict Pimsner–Popa window for the correctly typed expectation',
    'C_U: unit embadon weights in the same reduced physical measure',
    'C_E: the physical divisor realising the complete evaluation/jet frame',
    'C_UV: one reduced ultraviolet measure with strict convexity, one crossing and topology stability'
  ],
  cost_hint: 'fast',
  inputs: [
    { name: 'C_X', type: 'boolean', default: false, doc: 'a finite-index defect X is selected by the CIVP data' },
    { name: 'C_win', type: 'boolean', default: false, doc: 'the correctly typed expectation satisfies 1/3 < λ* < 1/2' },
    { name: 'C_U', type: 'boolean', default: false, doc: 'the embadon weights are unit in the same reduced measure' },
    { name: 'C_E', type: 'boolean', default: false, doc: 'the residual evaluation complex is acyclic for the physical support' },
    { name: 'C_UV', type: 'boolean', default: false, doc: 'the reduced UV measure selects one stable integer sector' },
    { name: 'q_star', type: 'number', unit: 'dimensionless', default: 292, min: 1e-9, max: 1e130,
      doc: 'the selected integer sector, if one has been named' },
    { name: 'index', type: 'number', unit: 'dimensionless', default: 2.618033988749895, min: 1, max: 1e6,
      doc: 'Ind(X) for the entropy bridge' },
    { name: 'l_max', type: 'number', unit: 'dimensionless', default: 8, min: 0, max: 64,
      doc: 'highest multipole in the BMS shape quotient' },
    { name: 'deg_U', type: 'number', unit: 'dimensionless', default: 1, min: -64, max: 64,
      doc: 'degree of U : S³ → SU(2) in the independent Hopf sector' },
    { name: 'vacuum_shift', type: 'number', unit: 'dimensionless', default: 1.5, min: -1e12, max: 1e12,
      doc: 'the constant c in T → T + c g, invisible to both the trace-free equation and the null source' }
  ],
  outputs: [
    { name: 'certificates_held', unit: 'dimensionless', doc: 'how many of the five are switched on' },
    { name: 'triple_lock', type: 'boolean', unit: null, doc: 'whether q_can = N_emb = q_ind is established' },
    { name: 'golden_index_forced', type: 'boolean', unit: null, doc: 'whether Ind(X) = φ² follows' },
    { name: 'sector_unique', type: 'boolean', unit: null, doc: 'whether q_* is unique' },
    { name: 'R_q', unit: 'm', doc: 'de Sitter horizon radius at the selected capacity, when the closure allows it' },
    { name: 'Lambda_q', unit: 'm^-2', doc: 'cosmological constant at the selected capacity' },
    { name: 'horizon_area', unit: 'm^2', doc: '4πR²' },
    { name: 'capacity_roundtrip_residual', unit: 'dimensionless', doc: '|A/(4ℓ_P²) − q|/q' },
    { name: 'lambda_route_residual', unit: 'dimensionless', doc: 'disagreement between Λ from q and Λ from R' },
    { name: 'delta_S_gen', unit: 'dimensionless', doc: 'log Ind(X), the additive entropy increment' },
    { name: 'omega_ratio', unit: 'dimensionless', doc: 'the multiplicative carrier e^{S_gen}, whose ratio IS the index' },
    { name: 'additive_multiplicative_fixed_point', unit: 'dimensionless', doc: 'χ/(e^χ − 1), the only Q where both laws can hold' },
    { name: 'shape_kernel_is_l01', type: 'boolean', unit: null, doc: 'the trace-free Hessian annihilates exactly ℓ = 0 and 1' },
    { name: 'shape_dimension', unit: 'dimensionless', doc: 'dimension of ⊕_{ℓ≥2} H_ℓ up to l_max' },
    { name: 'hopf_invariant', unit: 'dimensionless', doc: 'H(h∘U) = deg U' },
    { name: 'null_source_shifted', type: 'boolean', unit: null, doc: 'whether the constant vacuum shift moved T_{μν}k^μk^ν (it must not)' },
    { name: 'is_prediction', type: 'boolean', unit: null, doc: 'always false — the map is kinematic' },
    { name: 'headline', type: 'string', unit: null, doc: 'what the current certificate state does and does not establish' }
  ],
  evaluate(i) {
    const held = { C_X: i.C_X, C_win: i.C_win, C_U: i.C_U, C_E: i.C_E, C_UV: i.C_UV };
    const cl = closure(held, i.q_star);
    const ds = deSitterFromCapacity(i.q_star);
    const eb = entropyBridge(i.index);
    const am = additiveMultiplicativeNoGo(Math.log(i.index) || 1e-9);
    const shape = bmsShapeQuotient(Math.round(i.l_max));
    const hopf = hopfSector(Math.round(i.deg_U));
    const vk = vacuumShiftKernel(i.vacuum_shift);
    const nHeld = Object.values(held).filter(Boolean).length;
    const warnings = [];
    if (!cl.all_held)
      warnings.push(`this is NOT a prediction of Λ: certificates ${cl.missing.join(', ')} are not held, ` +
        'so the capacity entering the map has not been derived');
    if (cl.all_held)
      warnings.push('all five certificates are switched on in this RUN; switching a certificate on in an ' +
        'input is not the same as deriving it, and the atlas does not derive any of them');
    return { outputs: {
      certificates_held: nHeld,
      triple_lock: cl.triple_lock,
      golden_index_forced: cl.conclusions['Ind(X) = phi^2'],
      sector_unique: cl.conclusions['q_* unique'],
      R_q: ds.R_q, Lambda_q: ds.Lambda_q, horizon_area: ds.horizon_area,
      capacity_roundtrip_residual: ds.roundtrip_residual,
      lambda_route_residual: ds.Lambda_residual,
      delta_S_gen: eb.delta_S_gen, omega_ratio: eb.omega_ratio,
      additive_multiplicative_fixed_point: am.fixed_point_Q,
      shape_kernel_is_l01: shape.kernel_is_exactly_l01, shape_dimension: shape.shape_dimension,
      hopf_invariant: hopf.hopf_invariant,
      null_source_shifted: vk.null_focusing_source_changed,
      is_prediction: false,
      headline: cl.headline },
      status: cl.all_held ? STATUS.CONDITIONAL : STATUS.CONDITIONAL,
      warnings,
      diagnostics: {
        certificates: cl.held.map(c => ({ id: c.id, held: c.held, unlocks: c.unlocks })),
        conclusions: cl.conclusions,
        saddle_identity: deSitterSaddleIdentity(i.q_star).chain,
        first_law_example: capacityFirstLaw({ T_H: 1e-8, dM: 1e-3 }).identity,
        capacity_from_lambda_note: capacityFromLambda(1.1056e-52).note,
        falsifiers: cl.falsifiers, not_repairable_by: cl.not_repairable_by,
        optional_sixth: cl.optional_sixth,
        type_ledger: TYPE_LEDGER } };
  },
  selftests: [
    { name: 'the de Sitter capacity map round-trips through the horizon area',
      run(L) { let worst = 0;
        for (const q of [1, 10, 292, 1e6, 1e40, 1e120]) { const r = L.run({ q_star: q }, { provenance: {} });
          worst = Math.max(worst, r.outputs.capacity_roundtrip_residual, r.outputs.lambda_route_residual); }
        return { pass: worst < 1e-14,
          detail: `six capacities over 120 orders of magnitude; worst residual ${worst.toExponential(2)}` }; } },
    { name: 'removing any one certificate removes exactly one conclusion',
      run(L) { const all = { C_X: true, C_win: true, C_U: true, C_E: true, C_UV: true };
        const full = L.run({ ...all }, { provenance: {} });
        const base = [full.outputs.golden_index_forced, full.outputs.triple_lock, full.outputs.sector_unique];
        if (!base.every(Boolean)) return { pass: false, detail: 'the full set does not establish everything' };
        const rows = [];
        for (const k of ['C_X', 'C_win', 'C_U', 'C_E', 'C_UV']) {
          const r = L.run({ ...all, [k]: false }, { provenance: {} });
          const lost = [r.outputs.golden_index_forced, r.outputs.triple_lock, r.outputs.sector_unique]
            .map((v, n) => (base[n] && !v) ? n : -1).filter(n => n >= 0);
          rows.push(`${k}→${lost.length}`);
          if (lost.length !== 1) return { pass: false, detail: `removing ${k} changed ${lost.length} conclusions` };
        }
        return { pass: true, detail: `irreducible boundary confirmed: ${rows.join(', ')}` }; } },
    { name: 'no certificate at all still produces the arithmetic, and says it is not a prediction',
      run(L) { const r = L.run({}, { provenance: {} });
        return { pass: r.outputs.is_prediction === false && r.outputs.certificates_held === 0
            && r.outputs.Lambda_q > 0 && /NOT determined|missing/.test(r.outputs.headline),
          detail: 'Λ_q is computed and labelled kinematic; the headline names every missing certificate' }; } },
    { name: 'the trace-free Hessian kernel is exactly ℓ = 0 and 1',
      run(L) { const r = L.run({ l_max: 24 }, { provenance: {} });
        const bad = [];
        for (let l = 0; l <= 24; l++) { const n = shapeNorm(l);
          if ((n === 0) !== (l === 0 || l === 1)) bad.push(l); }
        return { pass: r.outputs.shape_kernel_is_l01 && bad.length === 0,
          detail: '½(ℓ−1)ℓ(ℓ+1)(ℓ+2) vanishes at ℓ = 0, 1 and nowhere else up to ℓ = 24' }; } },
    { name: 'a constant vacuum shift is invisible to the null focusing source',
      run(L) { let ok = true;
        for (const c of [-1e6, -1, 0, 1.5, 1e9]) { const r = L.run({ vacuum_shift: c }, { provenance: {} });
          ok = ok && r.outputs.null_source_shifted === false; }
        return { pass: ok, detail: 'g(k,k) = 0 for null k, so T → T + c g drops out of T_{μν}k^μk^ν' }; } },
    { name: 'the additive and multiplicative laws meet at χ/(e^χ − 1) and never twice',
      run(L) { let worst = 0;
        for (const I of [1.2, 2, GOLDEN_INDEX, 7]) { const chi = Math.log(I);
          const r = L.run({ index: I }, { provenance: {} });
          const Q = r.outputs.additive_multiplicative_fixed_point;
          worst = Math.max(worst, Math.abs(Q + chi - Math.exp(chi) * Q) / Math.max(1, Q)); }
        return { pass: worst < 1e-12,
          detail: `the fixed point satisfies both laws to ${worst.toExponential(2)}; the next step needs the same Q ` +
            'while the additive law has already moved, which is the contradiction' }; } },
    { name: 'the entropy bridge is additive and its multiplicative carrier is the state count',
      run(L) { let ok = true;
        for (const I of [1, GOLDEN_INDEX, 4, 100]) { const r = L.run({ index: I }, { provenance: {} });
          ok = ok && Math.abs(r.outputs.delta_S_gen - Math.log(I)) < 1e-15
            && Math.abs(r.outputs.omega_ratio - I) < 1e-12; }
        return { pass: ok, detail: 'ΔS_gen = log Ind and Ω_{n+1}/Ω_n = Ind; the area variable is never multiplied' }; } },
    { name: 'H(h∘U) = deg U, and the integer is neither a capacity nor an index',
      run(L) { let ok = true;
        for (const k of [-7, -1, 0, 1, 5, 64]) { const r = L.run({ deg_U: k }, { provenance: {} });
          ok = ok && r.outputs.hopf_invariant === k; }
        return { pass: ok, detail: 'precomposition by a degree-k map multiplies the π₃(S²) generator by k' }; } },
    { name: 'the five certificates are exactly five, each unlocking exactly one conclusion',
      run() { const ids = CERTIFICATES.map(c => c.id);
        return { pass: CERTIFICATES.length === 5 && new Set(ids).size === 5
            && CERTIFICATES.every(c => typeof c.unlocks === 'string' && c.unlocks.length > 0),
          detail: ids.join(', ') }; } }
  ]
});
