import { defineLab } from '../contract.mjs';
import { STATUS } from '../status.mjs';
import { capNphi, capLambda, capSigma, capGamma, capGammaD, capBg2, capGateBudget,
         CAP_LAM_OBS, CAP_LAM_SIG, CAP_U_STAR, CAP_GATES } from '../atlas/extracted.mjs';

/* CONDITIONAL, and the word "conditional" is in the id on purpose. Three gates are taken
   from the manuscript and NOT re-derived here — the recursion supplying N_phi, the matching
   supplying b g^2 and Xi, and the determinant line supplying nu = 1/2. Everything downstream
   of them is recomputed; nothing upstream of them is established. The named open problem
   capacity.selector records that the recursion does not in fact select N = 292. */
export default defineLab({
  id: 'capacity.conditional_selector',
  title: 'Capacity selector — which integer sector fixes Λ, given three gates this atlas does not derive',
  status: STATUS.CONDITIONAL,
  model_id: 'capacity.sieve',
  equation_ids: ['cap.lambda', 'cap.free_energy', 'cap.convexity', 'cap.nphi', 'cap.bg2', 'cap.sigma'],
  summary: 'Given the capacity postulate Lambda = 3 pi/(l_P^2 q), the free energy Gamma is strictly ' +
    'convex in q, so it has a UNIQUE strict minimum — and that uniqueness is the only part of the ' +
    'construction this laboratory establishes. Which sector it lands on is inherited from the gates.',
  formulas: [
    'Lambda = 3 pi/(l_P^2 q),  q = e^u',
    'Gamma(q) = q (ln(q/q*) - 1) + nu ln q',
    '(Gamma(u) - Gamma(u*))/q* = e^d (d - 1) + 1,   d = u - u*',
    'd2Gamma/dq2 = 1/q + nu/q^2 > 0 for all q > 0    (strict convexity, hence a unique minimum)',
    'N_phi(u) = (u - ln pi)/(2 ln phi)',
    'b g^2(u) = 16 pi^2/(u - ln Xi)',
    'sigma(u) = (Lambda(u) - Lambda_obs)/sigma_Lambda'
  ],
  assumptions: [
    'THE CAPACITY POSTULATE Lambda = 3 pi/(l_P^2 q) — trace-free gravity supplies the integration constant, the postulate supplies its value',
    'the Hopf–Bradlow–APS–HC recursion supplying N_phi, taken and NOT re-derived',
    'the GLSM/stringy matching supplying b g^2 and Xi, taken and NOT re-derived',
    'the determinant line supplying nu = 1/2, taken and NOT re-derived'
  ],
  domain_of_validity: [
    `u* ± 40 around u* = ${CAP_U_STAR}; outside it this construction says nothing and the input is REFUSED`,
    'sigma is a comparison against the Planck 2018 late-time value, not a goodness-of-fit of the construction'
  ],
  falsifiers: [
    'the free energy fails to be strictly convex, which would destroy the uniqueness of the minimum',
    'the normalised free energy is not stationary at u*',
    'the exact-in-delta form disagrees with the direct evaluation of Gamma'
  ],
  verifiers: ['docs/verify-capacity-sieve.cjs (9/9)', 'docs/verify-capacity-selector-closure.cjs (6/6)',
              'docs/verify-capacity-gate-budget.cjs (7/7)'],
  open_problems: [
    'capacity.selector — the capacity selector does not select N = 292; the scheme gate is q0 written backwards',
    'phi.physical_origin — nothing here derives phi; N_phi is a coordinate on a declared registry'
  ],
  cost_hint: 'fast',
  inputs: [
    { name: 'u', type: 'number', unit: 'ln(capacity), dimensionless', default: CAP_U_STAR,
      min: CAP_U_STAR - 40, max: CAP_U_STAR + 40,
      doc: `logarithm of the horizon capacity q = N_boundary; u* = ln q* = ${CAP_U_STAR} is the sector the closure selects` }
  ],
  outputs: [
    { name: 'lambda', unit: 'm^-2', doc: 'the cosmological constant the sector implies' },
    { name: 'lambda_observed', unit: 'm^-2', doc: 'Planck 2018 TT,TE,EE+lowE+lensing+BAO' },
    { name: 'lambda_sigma', unit: 'm^-2', doc: '1 sigma of the observational inputs, propagated from Omega_L and H0' },
    { name: 'sigma', unit: 'sigma', doc: 'signed distance of lambda from the measured sky' },
    { name: 'q', unit: 'boundary degrees of freedom', doc: 'the capacity itself, e^u' },
    { name: 'gamma_normalised', unit: 'q*', doc: '(Gamma(u) - Gamma(u*))/q*, exact in delta' },
    { name: 'gamma_slope', unit: 'q*', doc: 'dGamma/ddelta; zero only at the selected sector' },
    { name: 'n_phi', unit: 'rung', doc: 'golden-registry coordinate ln(q/pi)/(2 ln phi)' },
    { name: 'n_phi_rung', type: 'object', unit: null, doc: 'nearest rung, and whether the sector sits on it within 0.1' },
    { name: 'bg2', unit: 'dimensionless', doc: 'the coupling the scheme relation implies at this u' },
    { name: 'gates', type: 'array', unit: null, doc: 'the error budget: per gate, the u it implies, its own width, and its distance from the sky in sigma' },
    { name: 'N_phi_derived', type: 'boolean', unit: null, doc: 'false, always: N_phi is READ OFF a declared registry and is not produced by any operator in this repository' }
  ],
  evaluate(i) {
    const u = i.u, N = capNphi(u), L = capLambda(u);
    return {
      outputs: {
        lambda: L, lambda_observed: CAP_LAM_OBS, lambda_sigma: CAP_LAM_SIG,
        sigma: capSigma(u), q: Math.exp(u),
        gamma_normalised: capGamma(u - CAP_U_STAR), gamma_slope: capGammaD(u - CAP_U_STAR),
        n_phi: N,
        n_phi_rung: { nearest: Math.round(N), distance: N - Math.round(N), on_rung: Math.abs(N - Math.round(N)) < 0.1 },
        bg2: capBg2(u),
        gates: capGateBudget().map(g => ({ gate: g.key, supplies: CAP_GATES.find(x => x.key === g.key).supplies,
          u_implied: g.u, own_width_in_u: g.spread, own_width_in_sigma: g.sigmaWidth,
          lambda: g.lambda, sigma: g.sigma })),
        N_phi_derived: false
      },
      warnings: [
        'CONDITIONAL: the three gates are taken from the manuscript and are NOT re-derived here. What this ' +
        'laboratory establishes is that the free energy is strictly convex and its minimum unique — not which sector it is.',
        'Lambda = 3 pi/(l_P^2 q) is the capacity POSTULATE, not a theorem of trace-free gravity.',
        'N_phi_derived = false: N_phi is a coordinate on a declared registry. See open problem capacity.selector, ' +
        'and edge.admissibility_no_go for the computation showing the recursion does not select 292.'
      ],
      diagnostics: { u_star: CAP_U_STAR, gates_taken_not_derived: CAP_GATES.map(g => g.key) }
    };
  },
  selftests: [
    { name: 'the free energy is stationary at u★ and strictly convex around it, so the minimum is UNIQUE',
      run(L) { const at = L.run({ u: CAP_U_STAR }, { provenance: {} }).outputs;
        const lo = L.run({ u: CAP_U_STAR - 1 }, { provenance: {} }).outputs;
        const hi = L.run({ u: CAP_U_STAR + 1 }, { provenance: {} }).outputs;
        return { pass: Math.abs(at.gamma_slope) < 1e-12 && at.gamma_normalised < lo.gamma_normalised &&
            at.gamma_normalised < hi.gamma_normalised && lo.gamma_slope < 0 && hi.gamma_slope > 0,
          detail: `slope at u★ = ${at.gamma_slope.toExponential(2)}; Γ rises on both sides ` +
            `(${lo.gamma_normalised.toExponential(3)} ← ${at.gamma_normalised.toExponential(3)} → ${hi.gamma_normalised.toExponential(3)}) ` +
            `with the slope changing sign` }; } },
    { name: 'the minimum is strict over the whole declared domain, not merely near u★',
      run(L) { const at = L.run({ u: CAP_U_STAR }, { provenance: {} }).outputs.gamma_normalised;
        let worst = null;
        for (let d = -40; d <= 40; d += 0.5) { if (Math.abs(d) < 1e-9) continue;
          const g = L.run({ u: CAP_U_STAR + d }, { provenance: {} }).outputs.gamma_normalised;
          if (!(g > at) && (worst === null || g < worst)) worst = g; }
        return { pass: worst === null, detail: worst === null
          ? `Γ(u★) = ${at} is strictly below all 160 other sampled sectors across u★ ± 40`
          : `a sector at or below the minimum was found: ${worst}` }; } },
    { name: 'Λ falls exactly as 1/q, which is the capacity postulate and not a fit',
      run(L) { const a = L.run({ u: CAP_U_STAR }, { provenance: {} }).outputs;
        const b = L.run({ u: CAP_U_STAR + Math.log(10) }, { provenance: {} }).outputs;
        return { pass: Math.abs(a.lambda / b.lambda - 10) < 1e-9,
          detail: `a factor of ten in q changes Λ by ${(a.lambda / b.lambda).toFixed(12)}` }; } },
    { name: 'the laboratory says out loud that N_phi is NOT derived here',
      run(L) { const r = L.run({}, { provenance: {} });
        return { pass: r.outputs.N_phi_derived === false && r.warnings.some(w => /N_phi_derived = false/.test(w)),
          detail: `N_phi = ${r.outputs.n_phi.toFixed(6)}, nearest rung ${r.outputs.n_phi_rung.nearest}, ` +
            `and the envelope carries N_phi_derived = false` }; } },
    { name: 'a sector outside the declared domain is REFUSED, not clamped',
      run(L) { try { L.run({ u: CAP_U_STAR + 41 }, { provenance: {} }); return { pass: false, detail: 'it returned a number' }; }
        catch (e) { return { pass: e.code === 'DOMAIN_ERROR', detail: e.message.slice(0, 100) }; } } }
  ]
});
