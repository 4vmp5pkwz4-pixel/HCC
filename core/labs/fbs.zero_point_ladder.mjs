import { defineLab } from '../contract.mjs';
import { STATUS } from '../status.mjs';
import { zpRung, zpTemperatureOf, levelR, ZPF } from '../atlas/extracted.mjs';

/* CONDITIONAL, and the condition is the whole point: every number below is exact GIVEN a
   round S³, a conformally coupled massless real scalar, one renormalization scheme and the
   structural ansatz R_N = ℓ_P φ^N. The atlas does not derive φ — phi.physical_origin is an
   OPEN problem with a name — so nothing here may be read as a measurement of anything. */
export default defineLab({
  id: 'fbs.zero_point_ladder',
  title: 'Zero-point ladder — one rung of R_N = ℓ_P φ^N',
  status: STATUS.CONDITIONAL,
  model_id: 'fbs.zpt.rung',
  equation_ids: ['ladder.radius', 'zp.spectrum', 'zp.casimir', 'zp.action_cell', 'zp.compactness'],
  summary: 'A conformally coupled massless scalar on the round S³ has ω_β = βc/R with degeneracy β². ' +
    'The bare half-quantum sum DIVERGES; the cutoff is an input and is displayed rather than hidden, ' +
    'and the renormalized remainder ħc/(240R) is the one quantity that does not depend on it.',
  formulas: [
    'R(N) = l_P * phi^N',
    'omega_beta = beta c / R_N,  epsilon0_beta = hbar c beta / (2 R_N)',
    'E0_beta = hbar c beta^3 / (2 R_N)          (degeneracy g_beta = beta^2)',
    'E_bare(M) = hbar c M^2 (M+1)^2 / (8 R_N)   (divergent as M -> infinity)',
    'E_C = hbar c / (240 R_N),  rho_C = hbar c / (480 pi^2 R_N^4)',
    'epsilon0_1 * R_N / c = hbar / 2            (invariant action cell, every rung)',
    '2 G epsilon0_1 / (c^4 R_N) = phi^(-2N)     (compactness identity)'
  ],
  assumptions: [
    'the round three-sphere S³ with radius R',
    'one conformally coupled massless real scalar field',
    'one renormalization scheme (zeta / Abel–Plana), stated and not compared against others',
    'the STRUCTURAL ANSATZ R_N = l_P phi^N — declared, not derived; see open problem phi.physical_origin'
  ],
  domain_of_validity: [
    '0 <= N <= 400 rungs of the declared ladder',
    'mode index 1 <= beta <= 4096',
    'the reduced temperature theta below 1/ln 3, where the thermal term is exponentially suppressed ' +
      'and the ladder is genuinely a zero-point ladder rather than a thermal one in disguise'
  ],
  falsifiers: [
    'the action cell epsilon0_1 R/c departs from hbar/2 at any rung',
    'the compactness ratio departs from phi^(-2N)',
    'the bare sum stops growing with the cutoff, which would mean the divergence had been hidden'
  ],
  verifiers: ['docs/verify-zero-point-ladder.cjs (16/16)', 'docs/verify-zero-point-csv.cjs',
              'docs/verify-zeckendorf-structure.cjs (10/10)'],
  open_problems: ['phi.physical_origin — no physical operator produces phi; R_N = l_P phi^N is a declared ansatz'],
  cost_hint: 'fast',
  inputs: [
    { name: 'N', type: 'number', unit: 'rung', default: 207, min: 0, max: 400,
      doc: 'rung index. N = 207 is an INTERNAL reference index near one light-second; it is not recombination and carries no cosmological claim' },
    { name: 'beta', type: 'number', unit: 'mode index', default: 1, min: 1, max: 4096,
      doc: 'S³ scalar mode index; eigenvalues (beta^2-1)/R^2 with degeneracy beta^2' },
    { name: 'M', type: 'number', unit: 'cutoff', default: 24, min: 1, max: 4096,
      doc: 'cutoff of the DIVERGENT bare sum, displayed rather than hidden' },
    { name: 'theta', type: 'number', unit: 'dimensionless', default: 1 / Math.log(3), min: 1e-6, max: 1e4,
      doc: 'reduced temperature k_B T R/(hbar c)' }
  ],
  outputs: [
    { name: 'R', unit: 'm', doc: 'rung radius l_P phi^N' },
    { name: 'omega', unit: 'rad/s', doc: 'mode angular frequency' },
    { name: 'nu', unit: 'Hz', doc: 'mode frequency' },
    { name: 'e0', unit: 'J', doc: 'half-quantum of the mode' },
    { name: 'shell', unit: 'J', doc: 'degeneracy-weighted shell energy' },
    { name: 'bare', unit: 'J', doc: 'the bare sum to the stated cutoff — DIVERGENT, and inheriting that status' },
    { name: 'casimir', unit: 'J', doc: 'renormalized remainder hbar c/(240 R). NOT the cosmological constant' },
    { name: 'rho', unit: 'J/m^3', doc: 'renormalized energy density' },
    { name: 'pressure', unit: 'Pa', doc: 'rho/3, the conformal equation of state' },
    { name: 'Tmode', unit: 'K', doc: 'temperature at which k_B T equals the mode half-quantum' },
    { name: 'Teq', unit: 'K', doc: 'temperature at which thermal and zero-point terms are equal' },
    { name: 'temperature_K', unit: 'K', doc: 'the temperature the requested theta corresponds to at this rung' },
    { name: 'compact', unit: 'dimensionless', doc: '2 G epsilon0/(c^4 R) = phi^(-2N); an algebraic identity, not a quantum black hole' },
    { name: 'action', unit: 'J·s', doc: 'invariant action cell epsilon0 R/c = hbar/2 at every rung' }
  ],
  evaluate(i) {
    const r = zpRung(i.N, i.beta, i.M, i.theta);
    return {
      outputs: { R: r.R, omega: r.omega, nu: r.nu, e0: r.e0, shell: r.shell, bare: r.bare,
        casimir: r.casimir, rho: r.rho, pressure: r.pressure, Tmode: r.Tmode, Teq: r.Teq,
        temperature_K: zpTemperatureOf(i.N, i.theta), compact: r.compact, action: r.action },
      warnings: ['CONDITIONAL: exact given the declared ansatz R_N = l_P phi^N, which this atlas does not derive',
                 `the "bare" output is a DIVERGENT sum truncated at M = ${i.M}; it is a displayed cutoff, not a physical scale`],
      diagnostics: { renormalization: 'zeta / Abel–Plana', field: 'one conformally coupled massless real scalar' }
    };
  },
  selftests: [
    { name: 'the action cell is hbar/2 at every rung, over the whole declared domain',
      run(L) { let worst = 0;
        for (let N = 0; N <= 400; N += 8) {
          const o = L.run({ N, beta: 1 }, { provenance: {} }).outputs;
          worst = Math.max(worst, Math.abs(o.action / (ZPF.HBAR / 2) - 1)); }
        return { pass: worst < 1e-12, detail: `worst relative departure from hbar/2 over 51 rungs = ${worst.toExponential(2)}` }; } },
    { name: 'the compactness ratio is phi^(-2N) exactly',
      run(L) { const PHI = (1 + Math.sqrt(5)) / 2; let worst = 0;
        for (let N = 0; N <= 200; N += 10) {
          const o = L.run({ N, beta: 1 }, { provenance: {} }).outputs;
          worst = Math.max(worst, Math.abs(o.compact / Math.pow(PHI, -2 * N) - 1)); }
        return { pass: worst < 1e-9, detail: `worst relative departure over 21 rungs = ${worst.toExponential(2)}` }; } },
    { name: 'the bare sum DIVERGES with the cutoff and the renormalized remainder does not move',
      run(L) { const a = L.run({ N: 207, M: 8 }, { provenance: {} }).outputs;
        const b = L.run({ N: 207, M: 512 }, { provenance: {} }).outputs;
        return { pass: b.bare / a.bare > 1e5 && Math.abs(b.casimir / a.casimir - 1) < 1e-15,
          detail: `bare grew by ${(b.bare / a.bare).toExponential(2)} from M = 8 to M = 512 while the Casimir term is identical` }; } },
    { name: 'the radius is the declared ladder and nothing else',
      run(L) { const o = L.run({ N: 100 }, { provenance: {} }).outputs;
        return { pass: Math.abs(o.R / levelR(100) - 1) < 1e-15, detail: `R(100) = ${o.R.toExponential(9)} m` }; } },
    { name: 'an out-of-domain rung is REFUSED, not clamped',
      run(L) { try { L.run({ N: 401 }, { provenance: {} }); return { pass: false, detail: 'it returned a number' }; }
        catch (e) { return { pass: e.code === 'DOMAIN_ERROR', detail: e.message.slice(0, 90) }; } } }
  ]
});
