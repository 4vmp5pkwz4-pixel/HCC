import { defineLab } from '../contract.mjs';
import { STATUS } from '../status.mjs';
/* The mathematics is NOT in this file. It lives in index.html, where the atlas draws it,
   and scripts/extract-kernels.mjs slices it into core/atlas/extracted.mjs. A kernel that
   retyped it would be a second copy, and the drift between the picture and the number is
   exactly the failure this core exists to prevent. */
import { CIVP_PHI as PHI, CIVP_GOLD as GOLDEN_INDEX, civpJonesSpectrum as jonesSpectrum,
  civpAdmissible as admissibleIndex, civpWindow as pimsnerPopaWindow,
  civpTwoWitness as twoWitnessCertificate, civpDivisibleNoGo as divisibilityNoGo,
  civpFuzzyNoGo as fuzzySphereNoGo, civpMatrixTower as matrixTowerNoGo,
  civpLadderNoGo as irrationalLadderNoGo, civpA4 as a4Transfer, civpADE as adeWindow,
  civpFibFibre as fibonacciFibre, civpTower as jonesTower } from '../atlas/extracted.mjs';

const JONES_EQUATIONS = Object.freeze([
  '[M:N] in {4 cos^2(pi/m)} u [4, inf)',
  'lambda*(E)^{-1} = [M:N]',
  '1/3 < lambda* < 1/2  =>  [M:N] = 4cos^2(pi/5) = (3+sqrt5)/2 = phi^2',
  'Ind(Theta_g) = Ind(Theta_{h_n})^n and no index lies in (1,2) => Ind = 1',
  'lambda*(x -> tau_N(x)1) = 1/N',
  'Mat_N -> Mat_m unital  <=>  N | m',
  'BB^T = N_tau^2 = A = [[1,1],[1,2]], Spec A = {phi^2, phi^-2}, det A = 1',
  'A^n = [[F_{2n-1}, F_{2n}],[F_{2n}, F_{2n+1}]], Tr A^n = L_{2n}',
  'mu_Fib = 1 + d_tau^2 = phi + 2'
]);

export default defineLab({
  id: 'civp.finite_index',
  title: 'Finite index — the golden window and four no-go theorems',
  status: STATUS.EXACT,
  model_id: 'civp.pimsner_popa_rigidity',
  equation_ids: ['jones.spectrum', 'pimsner_popa.window', 'nogo.divisible', 'nogo.fuzzy',
    'nogo.matrix_tower', 'nogo.irrational_ladder', 'a4.transfer', 'fib.fusion'],
  summary:
    'A coarse positivity window does the work of an irrational computation: 1/3 < λ* < 1/2 is ' +
    '2 < [M:N] < 3, and the Jones spectrum has exactly one point there, so Ind = φ². The same ' +
    'laboratory computes the four things that CANNOT be the defect — a divisible endomorphism ' +
    'semigroup, the irreducible fuzzy sphere, a consecutive matrix tower, and an irrational ' +
    'ladder of integer capacities — because the rigidity is only as strong as the typing around it.',
  formulas: JONES_EQUATIONS,
  assumptions: [
    'the sharp discrete spectrum argument is stated in the finite II₁ specialisation, or an ' +
      'equivalent setting where the same minimal-index spectrum is known',
    'the expectation is the canonical/minimal one for the inclusion',
    'multiplicativity of the index under composition, for the divisibility argument'
  ],
  domain_of_validity: [
    'λ* ∈ (0,1]; indices below 4 are read against the discrete spectrum, above 4 against the continuum',
    'the window theorem says nothing about which physical defect, if any, realises it'
  ],
  falsifiers: [
    'a value strictly inside (2,3) other than φ² is reported admissible',
    'the fuzzy-sphere constant 1/N is reported inside the open window for some N',
    'a unital embedding Mat_N → Mat_{N+1} is reported to exist for N > 1',
    'BBᵀ ≠ N_τ² or Tr Aⁿ ≠ L_{2n}'
  ],
  verifiers: ['docs/verify-civp-locking.cjs', 'docs/verify-fibonacci-anyons.cjs'],
  open_problems: [
    'certificate C_X: show the glued CIVP data select a dualizable irreducible finite-index defect',
    'certificate C_win: prove the strict Pimsner–Popa window for the correctly typed expectation',
    'braiding and chirality remain independent of the index gate'
  ],
  cost_hint: 'fast',
  inputs: [
    { name: 'lambda_star', type: 'number', unit: 'dimensionless', default: 0.38196601125010515,
      min: 1e-9, max: 1, doc: 'the Pimsner–Popa optimal positivity constant of the expectation' },
    { name: 'fuzzy_N', type: 'number', unit: 'dimensionless', default: 5, min: 1, max: 4096,
      doc: 'matrix rank of the irreducible fuzzy sphere to test against the window' },
    { name: 'a4_power', type: 'number', unit: 'dimensionless', default: 5, min: 0, max: 38,
      doc: 'power n of the integral transfer matrix A = BBᵀ = N_τ²' },
    { name: 'tower_depth', type: 'number', unit: 'dimensionless', default: 6, min: 0, max: 64,
      doc: 'depth of the Jones tower to tabulate' },
    { name: 'n_fib_carriers', type: 'number', unit: 'dimensionless', default: 0, min: 0, max: 1024,
      doc: 'embadons each carrying an independent Fibonacci degree of freedom (an O(q) term, never a second factor)' },
    { name: 'epsilon_minus', type: 'number', unit: 'dimensionless', default: 0.02, min: 0, max: 1,
      doc: 'the uniform lower positivity margin of the two-witness certificate' },
    { name: 'omega_ratio', type: 'number', unit: 'dimensionless', default: 0.45, min: 0, max: 10,
      doc: 'ω(E(x₊))/ω(x₊), the single upper witness' }
  ],
  outputs: [
    { name: 'index', unit: 'dimensionless', doc: '1/λ*, the Jones index' },
    { name: 'in_window', type: 'boolean', unit: null, doc: 'whether 1/3 < λ* < 1/2' },
    { name: 'forced_index', unit: 'dimensionless', doc: 'φ² when the window holds, null otherwise' },
    { name: 'forced_m', unit: 'dimensionless', doc: 'the Coxeter label m = 5' },
    { name: 'principal_graph', type: 'string', unit: null, doc: 'A₄ when the window holds' },
    { name: 'admissible', type: 'boolean', unit: null, doc: 'whether the index lies in the Jones spectrum' },
    { name: 'distance_to_golden', unit: 'dimensionless', doc: '|index − φ²|' },
    { name: 'two_witness_established', type: 'boolean', unit: null, doc: 'whether the two explicit estimates close the window' },
    { name: 'divisible_first_violating_n', unit: 'dimensionless', doc: 'the n at which I^{1/n} enters the empty gap (1,2)' },
    { name: 'divisible_forced_to_one', type: 'boolean', unit: null, doc: 'a divisible endomorphic representation must have index one' },
    { name: 'fuzzy_lambda', unit: 'dimensionless', doc: '1/N, the only nontrivial covariant constant on Mat_N' },
    { name: 'fuzzy_in_window', type: 'boolean', unit: null, doc: 'always false — that is the no-go' },
    { name: 'fuzzy_verdict', type: 'string', unit: null, doc: 'why this N misses the window' },
    { name: 'matrix_tower_exists', type: 'boolean', unit: null, doc: 'whether Mat_N embeds unitally in Mat_{N+1}' },
    { name: 'a4_identity_holds', type: 'boolean', unit: null, doc: 'BBᵀ = N_τ² = [[1,1],[1,2]]' },
    { name: 'a4_trace', unit: 'dimensionless', doc: 'Tr Aⁿ' },
    { name: 'a4_lucas', unit: 'dimensionless', doc: 'L_{2n}, which it must equal' },
    { name: 'a4_spectrum_residual', unit: 'dimensionless', doc: 'departure of the numerical spectrum from {φ², φ⁻²}' },
    { name: 'quantum_dimension', unit: 'dimensionless', doc: 'd_τ = φ' },
    { name: 'global_dimension', unit: 'dimensionless', doc: 'μ_Fib = 1 + φ² = φ + 2' },
    { name: 'fib_state_space_log', unit: 'dimensionless', doc: 'N ln φ, the extensive fusion contribution to I_q^UV' },
    { name: 'tower_top_index', unit: 'dimensionless', doc: '[M_n : M_0] = I*ⁿ at the requested depth' }
  ],
  evaluate(i) {
    const pp = pimsnerPopaWindow(i.lambda_star);
    const tw = twoWitnessCertificate({ epsilon_minus: i.epsilon_minus,
      omega_E_x_plus: i.omega_ratio, omega_x_plus: 1 });
    const div = divisibilityNoGo(pp.index);
    const fz = fuzzySphereNoGo(Math.round(i.fuzzy_N));
    const mt = matrixTowerNoGo(Math.round(i.fuzzy_N));
    const a4 = a4Transfer(Math.round(i.a4_power));
    const fib = fibonacciFibre(Math.round(i.n_fib_carriers));
    const tw2 = jonesTower(Math.round(i.tower_depth));
    const warnings = [];
    if (pp.in_window && !tw.window_established)
      warnings.push('λ* is inside the window but the two supplied witnesses do not establish it; ' +
        'the window is a THEOREM GATE and needs the estimates, not the assertion');
    if (!pp.admissible)
      warnings.push(`1/λ* = ${pp.index.toFixed(9)} is not in the Jones spectrum; nearest allowed value is ` +
        `${admissibleIndex(pp.index).nearest_allowed?.toFixed(9)}`);
    return { outputs: {
      index: pp.index, in_window: pp.in_window, forced_index: pp.forced_index,
      forced_m: pp.forced_m, principal_graph: pp.graph, admissible: pp.admissible,
      distance_to_golden: pp.distance_to_golden,
      two_witness_established: tw.window_established,
      divisible_first_violating_n: div.first_violating_n, divisible_forced_to_one: div.forced_to_one,
      fuzzy_lambda: fz.lambda_scalar, fuzzy_in_window: fz.in_open_window, fuzzy_verdict: fz.conclusion,
      matrix_tower_exists: mt.unital_embedding_exists,
      a4_identity_holds: a4.identity_holds, a4_trace: a4.trace, a4_lucas: a4.lucas_2n,
      a4_spectrum_residual: a4.spectrum_residual,
      quantum_dimension: fib.quantum_dimension, global_dimension: fib.global_dimension,
      fib_state_space_log: fib.state_space_factor_log,
      tower_top_index: tw2.rows[tw2.rows.length - 1].index },
      warnings,
      diagnostics: { spectrum_below_4: jonesSpectrum(8).map(s => ({ m: s.m, index: Number(s.index.toFixed(12)) })),
        ade: adeWindow(pp.index),
        irrational_ladder: irrationalLadderNoGo(292, 3).conclusion,
        chirality_undetermined: fib.chirality_undetermined,
        golden_index: GOLDEN_INDEX, phi: PHI } };
  },
  selftests: [
    { name: 'exactly one Jones value lies strictly inside (2,3), and it is φ²',
      run() { const hits = jonesSpectrum(2000).filter(s => s.index > 2 + 1e-12 && s.index < 3 - 1e-12);
        return { pass: hits.length === 1 && Math.abs(hits[0].index - GOLDEN_INDEX) < 1e-12 && hits[0].m === 5,
          detail: `${hits.length} value(s) in the open interval; m = ${hits[0]?.m}, index = ${hits[0]?.index.toFixed(15)}` }; } },
    { name: 'every λ* in the window returns the same forced index, over a fine sweep',
      run(L) { let worst = 0, n = 0;
        for (let k = 1; k < 400; k++) { const lam = 1 / 3 + k * (1 / 2 - 1 / 3) / 400;
          const r = L.run({ lambda_star: lam }, { provenance: {} });
          if (!r.outputs.in_window) return { pass: false, detail: `λ* = ${lam} not recognised as inside` };
          worst = Math.max(worst, Math.abs(r.outputs.forced_index - GOLDEN_INDEX)); n++; }
        return { pass: worst === 0, detail: `${n} values of λ*, all forcing Ind = φ² = ${GOLDEN_INDEX.toFixed(15)} exactly` }; } },
    { name: 'a divisible endomorphism semigroup is forced to index one',
      run(L) { let ok = true, worstN = 0;
        for (const I of [GOLDEN_INDEX, 2, 3, 4, 17.5]) { const r = L.run({ lambda_star: 1 / I }, { provenance: {} });
          ok = ok && r.outputs.divisible_forced_to_one; worstN = Math.max(worstN, r.outputs.divisible_first_violating_n); }
        const one = L.run({ lambda_star: 1 }, { provenance: {} });
        return { pass: ok && !one.outputs.divisible_forced_to_one,
          detail: `five indices > 1 all forced to 1 (worst n = ${worstN}); I = 1 is the fixed point and is not forced` }; } },
    { name: 'the irreducible fuzzy sphere never lands in the open window, for any N up to 4096',
      run(L) { const bad = [];
        for (const n of [1, 2, 3, 4, 5, 8, 13, 21, 34, 55, 89, 144, 292, 1024, 4096]) {
          const r = L.run({ fuzzy_N: n }, { provenance: {} });
          if (r.outputs.fuzzy_in_window) bad.push(n); }
        return { pass: bad.length === 0,
          detail: 'N = 2 and N = 3 hit the EXCLUDED endpoints 1/2 and 1/3; N ≥ 4 gives at most 1/4' }; } },
    { name: 'Mat_N does not embed unitally in Mat_{N+1} for N > 1',
      run(L) { const bad = [];
        for (let n = 2; n <= 64; n++) { const r = L.run({ fuzzy_N: n }, { provenance: {} });
          if (r.outputs.matrix_tower_exists) bad.push(n); }
        const one = L.run({ fuzzy_N: 1 }, { provenance: {} });
        return { pass: bad.length === 0 && one.outputs.matrix_tower_exists,
          detail: '63 consecutive ranks refused; only the degenerate N = 1 admits it — the fuzzy sequence is not a Jones tower' }; } },
    { name: 'BBᵀ = N_τ² = A and Aⁿ is the Fibonacci matrix with Tr Aⁿ = L_{2n}',
      run(L) { let ok = true, maxSpec = 0;
        for (let n = 0; n <= 20; n++) { const r = L.run({ a4_power: n }, { provenance: {} });
          ok = ok && r.outputs.a4_identity_holds && r.outputs.a4_trace === r.outputs.a4_lucas;
          maxSpec = Math.max(maxSpec, r.outputs.a4_spectrum_residual); }
        return { pass: ok && maxSpec < 1e-12,
          detail: `21 powers, integer identity exact, numerical spectrum within ${maxSpec.toExponential(2)} of {φ², φ⁻²}` }; } },
    { name: 'the categorical invariants stay distinct: d_τ, I_τ and μ_Fib are three numbers',
      run(L) { const r = L.run({}, { provenance: {} });
        const d = r.outputs.quantum_dimension, mu = r.outputs.global_dimension;
        return { pass: Math.abs(d - PHI) < 1e-15 && Math.abs(mu - (PHI + 2)) < 1e-15
            && Math.abs(mu - (1 + GOLDEN_INDEX)) < 1e-15 && d !== mu,
          detail: `d_τ = ${d.toFixed(12)}, I_τ = ${GOLDEN_INDEX.toFixed(12)}, μ_Fib = ${mu.toFixed(12)} — never merged` }; } }
  ]
});
