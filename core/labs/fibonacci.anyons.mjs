import { defineLab } from '../contract.mjs';
import { STATUS } from '../status.mjs';
import { FIB_PHI, FIB_D, FIB_S1, FIB_S2, fibFusion, fibBraid, fibMM,
         fibAxioms, fibMonodromy, fibFsym } from '../atlas/extracted.mjs';

/* EXACT. Every relation here closes to machine precision by construction from tau x tau =
   1 + tau, and the ones that do not close are the interesting ones: the hexagon REJECTS
   mixed chirality at 1.18 rather than at 1e-16, which is how the handedness of R_tau was
   fixed after a first version got it backwards. */
export default defineLab({
  id: 'fibonacci.anyons',
  title: 'Fibonacci anyons — the category, its braid group and the golden ratio the whole atlas runs on',
  status: STATUS.EXACT,
  model_id: 'fib.category',
  equation_ids: ['fib.fusion', 'fib.F', 'fib.R', 'fib.pentagon', 'fib.hexagon', 'fib.monodromy', 'fib.central_charge'],
  summary: 'tau x tau = 1 + tau forces d_tau to be the positive root of d^2 = 1 + d, which is phi. ' +
    'The fusion space of n anyons has Fibonacci dimension, so log dim -> n ln phi — the same phi ' +
    'the golden ladder is built on, arrived at from the fusion rule rather than assumed.',
  formulas: [
    'tau x tau = 1 + tau,   d_tau = phi = (1+sqrt5)/2,   D = sqrt(2 + phi)',
    'F = [[1/phi, phi^(-1/2)], [phi^(-1/2), -1/phi]],   F^2 = I  (because 1 + phi = phi^2)',
    'R_1 = exp(4 pi i / 5),  R_tau = exp(-3 pi i / 5),  theta_tau = exp(4 pi i / 5)',
    'sigma_1 = diag(R_1, R_tau),  sigma_2 = F sigma_1 F',
    'Yang-Baxter: sigma_1 sigma_2 sigma_1 = sigma_2 sigma_1 sigma_2',
    'dim Fus(n) = F_{n+1}  (the Zeckendorf condition: no two adjacent vacua)',
    'M_{tau tau} = S_{tau tau} S_{00} / (S_{tau 0} S_{0 tau}) = -1/phi^2',
    '(ST)^3 = exp(2 pi i c / 8) S^2  with  c = 14/5'
  ],
  assumptions: ['the Fibonacci fusion category with one nontrivial object, and the standard gauge for F'],
  domain_of_validity: ['1 <= n <= 4096 anyons; braid words over the alphabet 1, 2, a'],
  falsifiers: [
    'the pentagon equation fails over any of its 512 labellings',
    'the hexagon equation ACCEPTS mixed chirality — it must reject it',
    'F^2 differs from the identity',
    'Yang-Baxter fails for sigma_1, sigma_2',
    'the fusion dimension departs from the Fibonacci sequence'
  ],
  verifiers: ['docs/verify-fibonacci-anyons.cjs (14/14)', 'docs/verify-fibonacci-category.cjs (7/7)',
              'docs/verify-fibonacci-chain.cjs (15/15)', 'docs/verify-anyon-bridge.cjs (6/6)'],
  cost_hint: 'fast',
  inputs: [
    { name: 'n', type: 'number', unit: 'anyons', default: 5, min: 1, max: 4096,
      doc: 'how many tau anyons are fused' },
    { name: 'braid', type: 'string', unit: 'word', default: '121',
      doc: 'a braid word over 1 (sigma_1), 2 (sigma_2) and a (sigma_1 inverse), acting on the two-dimensional space of three tau with total charge tau' }
  ],
  outputs: [
    { name: 'd_tau', unit: 'dimensionless', doc: 'the quantum dimension phi, the positive root of d^2 = 1 + d' },
    { name: 'D_total', unit: 'dimensionless', doc: 'total quantum dimension sqrt(2 + phi)' },
    { name: 'gamma_topological', unit: 'dimensionless', doc: 'topological entanglement entropy ln D' },
    { name: 'dim_to_tau', unit: 'states', doc: 'fusion space dimension in the total-charge-tau sector' },
    { name: 'dim_to_vacuum', unit: 'states', doc: 'fusion space dimension in the vacuum sector' },
    { name: 'dim_total', unit: 'states', doc: 'the whole fusion space, F_{n+1}' },
    { name: 'log_dim_rate', unit: 'nats/anyon', doc: 'ln(dim(n)/dim(n-1)), which tends to ln phi — the fusion entropy the recursion operator uses' },
    { name: 'braid_trace_re', unit: 'dimensionless', doc: 'real part of the trace of the braid word' },
    { name: 'braid_trace_im', unit: 'dimensionless', doc: 'imaginary part of the trace of the braid word' },
    { name: 'braid_unitarity_residual', unit: 'dimensionless', doc: '|B B^dagger - I|, which is zero for a unitary braid representation' },
    { name: 'yang_baxter_residual', unit: 'dimensionless', doc: 'worst entry of sigma_1 sigma_2 sigma_1 - sigma_2 sigma_1 sigma_2' },
    { name: 'pentagon_residual', unit: 'dimensionless', doc: 'worst pentagon violation over all 512 labellings' },
    { name: 'hexagon_residual', unit: 'dimensionless', doc: 'worst hexagon violation for the CONSISTENT chirality' },
    { name: 'hexagon_rejects_mixed', unit: 'dimensionless', doc: 'the hexagon violation for MIXED chirality; it must be O(1), not O(1e-16) — this is the check that fixed the handedness of R_tau' },
    { name: 'monodromy_tau_tau', unit: 'dimensionless', doc: 'M_{tau tau} = -1/phi^2 = -0.381966…' },
    { name: 'central_charge', unit: 'dimensionless', doc: 'c = 14/5, appearing only on the right-hand side of (ST)^3 and not used to build S or T' }
  ],
  evaluate(i) {
    const n = Math.max(1, Math.round(i.n));
    const f = fibFusion(n), fp = fibFusion(Math.max(1, n - 1));
    const M = fibBraid(i.braid);
    const A = fibMM(fibMM(FIB_S1, FIB_S2), FIB_S1), B = fibMM(fibMM(FIB_S2, FIB_S1), FIB_S2);
    let yb = 0;
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++)
      yb = Math.max(yb, Math.hypot(A[r][c].re - B[r][c].re, A[r][c].im - B[r][c].im));
    /* unitarity of the braid word, computed rather than asserted */
    let un = 0;
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
      let re = 0, im = 0;
      for (let k = 0; k < 2; k++) { re += M[r][k].re * M[c][k].re + M[r][k].im * M[c][k].im;
        im += M[r][k].im * M[c][k].re - M[r][k].re * M[c][k].im; }
      un = Math.max(un, Math.hypot(re - (r === c ? 1 : 0), im));
    }
    const ax = fibAxioms();   /* pentagon over 512 labellings, and both chiralities of the hexagon */
    return {
      outputs: {
        d_tau: FIB_PHI, D_total: FIB_D, gamma_topological: Math.log(FIB_D),
        dim_to_tau: f.toTau, dim_to_vacuum: f.toVac, dim_total: f.total,
        log_dim_rate: n > 1 ? Math.log(f.total / fp.total) : Math.log(FIB_PHI),
        braid_trace_re: M[0][0].re + M[1][1].re, braid_trace_im: M[0][0].im + M[1][1].im,
        braid_unitarity_residual: un,
        yang_baxter_residual: yb,
        pentagon_residual: ax.pentagon,
        hexagon_residual: Math.min(ax.hexRight, ax.hexMirror),
        hexagon_rejects_mixed: ax.hexMixed,
        monodromy_tau_tau: fibMonodromy(1, 1),
        central_charge: 14 / 5
      },
      diagnostics: { pentagon_cases: ax.cases, hexagon_right: ax.hexRight,
        hexagon_mirror: ax.hexMirror, hexagon_mixed: ax.hexMixed, F_11: fibFsym(1, 1, 1, 1, 0, 0) }
    };
  },
  selftests: [
    { name: 'the fusion dimension IS the Fibonacci sequence, enumerated rather than asserted',
      /* F[k] here is F_{k+1} in the usual 1-based naming, so dim Fus(n) = F_{n+1} is F[n].
         The first version of this check compared against F[n+1] and reported a defect in
         the physics that was an off-by-one in the test's own array. */
      run(L) { const F = [1, 1]; for (let k = 2; k <= 25; k++) F[k] = F[k - 1] + F[k - 2];
        let bad = null;
        for (let n = 1; n <= 20; n++) { const o = L.run({ n }, { provenance: {} }).outputs;
          if (o.dim_total !== F[n]) bad = `n = ${n}: got ${o.dim_total}, F_${n + 1} = ${F[n]}`;
          if (o.dim_to_tau + o.dim_to_vacuum !== o.dim_total) bad = `n = ${n}: the two sectors do not sum to the whole space`; }
        return { pass: !bad, detail: bad || 'dim Fus(n) = F_{n+1} for n = 1…20, and the two charge sectors sum to it' }; } },
    { name: 'the pentagon closes to machine precision over all 512 labellings',
      run(L) { const r = L.run({}, { provenance: {} }).outputs.pentagon_residual;
        return { pass: r < 1e-12, detail: `worst pentagon violation ${r.toExponential(2)}` }; } },
    { name: 'the hexagon closes for one chirality and REJECTS the mixed one — the check that fixed the handedness of R_tau',
      run(L) { const o = L.run({}, { provenance: {} }).outputs;
        return { pass: o.hexagon_residual < 1e-12 && o.hexagon_rejects_mixed > 0.5,
          detail: `consistent ${o.hexagon_residual.toExponential(2)} · mixed ${o.hexagon_rejects_mixed.toFixed(6)} — a rejection, not a rounding error` }; } },
    { name: 'Yang–Baxter holds, so the braid group really is represented',
      run(L) { const r = L.run({}, { provenance: {} }).outputs.yang_baxter_residual;
        return { pass: r < 1e-14, detail: `worst entry ${r.toExponential(2)}` }; } },
    { name: 'every braid word is unitary',
      run(L) { let worst = 0;
        for (const w of ['1', '2', '12', '121', '2121', '1a', '12121212'])
          worst = Math.max(worst, L.run({ braid: w }, { provenance: {} }).outputs.braid_unitarity_residual);
        return { pass: worst < 1e-14, detail: `worst |B B† − I| over seven words = ${worst.toExponential(2)}` }; } },
    { name: 'the tau–tau monodromy is −1/phi² exactly',
      run(L) { const m = L.run({}, { provenance: {} }).outputs.monodromy_tau_tau;
        const want = -1 / (FIB_PHI * FIB_PHI);
        return { pass: Math.abs(m - want) < 1e-14, detail: `M_ττ = ${m.toFixed(12)} · −1/φ² = ${want.toFixed(12)}` }; } },
    { name: 'the fusion entropy rate converges to ln phi, which is the term the recursion operator uses',
      run(L) { const o = L.run({ n: 40 }, { provenance: {} }).outputs;
        return { pass: Math.abs(o.log_dim_rate - Math.log(FIB_PHI)) < 1e-14,
          detail: `ln(dim(40)/dim(39)) = ${o.log_dim_rate.toFixed(15)} · ln φ = ${Math.log(FIB_PHI).toFixed(15)}` }; } }
  ]
});
