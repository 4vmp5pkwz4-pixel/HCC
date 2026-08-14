import { defineLab } from '../contract.mjs';
import { STATUS } from '../status.mjs';
import { specSpectrum } from '../atlas/extracted.mjs';

/* NUMERICALLY_VERIFIED, not EXACT: the operator and its matrix elements are derived in
   closed form, but the eigenvalues come from an iterative Jacobi rotation. What IS exact is
   the trace identity, and it is recomputed live on every call rather than quoted — a broken
   build says so instead of returning plausible numbers. */
export default defineLab({
  id: 's3.spectral_operator',
  title: 'Spectral operator — H(t) = ½ Σ a_i⁻² K_i² on an anisotropic S³',
  status: STATUS.NUMERICALLY_VERIFIED,
  model_id: 's3.spectral.instant',
  equation_ids: ['s3.metric', 's3.hamiltonian', 's3.trace_identity', 's3.multiplicity'],
  summary: 'The instantaneous Laplace–Beltrami operator on a Bianchi IX geometry, block-diagonalised ' +
    'by spin. It is an ADIABATIC BASIS at one point of a trajectory, not a generator of time evolution.',
  formulas: [
    'a_i = exp(alpha + beta_i),  beta = (b+ + sqrt3 b-, b+ - sqrt3 b-, -2 b+)',
    'c_i = a_i^-2',
    'H|_j = 1/2 [ (c1+c2)/2 (J^2 - Jz^2) + c3 Jz^2 + (c1-c2)/4 (J+^2 + J-^2) ]',
    'convention: SUM_i K_i^2 = j(j+1) on the spin-j block',
    'Tr H|_j = 1/2 (c1+c2+c3) j(j+1)(2j+1)/3     (exact, at any anisotropy)',
    'total multiplicity per j = (2j+1)^2, the spectator Wigner index included'
  ],
  assumptions: [
    'the operator is evaluated at ONE instant; the metric is time dependent and this is not a conserved spectrum',
    'the overall scale is the stated convention SUM K_i^2 = j(j+1); absolute eigenvalues are convention dependent'
  ],
  domain_of_validity: [
    '-8 <= alpha <= 4,  |beta_+|, |beta_-| <= 3',
    '0.5 <= j_max <= 12; blocks are (2j+1)-dimensional and the cost is cubic in that'
  ],
  falsifiers: [
    'the assembled spectrum departs from the exact trace identity beyond 1e-9 relative',
    'the isotropic limit fails to give every eigenvalue at c/2 · j(j+1) with multiplicity (2j+1)^2',
    'the total state count per j differs from (2j+1)^2'
  ],
  verifiers: ['docs/verify-spectral-operator.cjs (8/8)', 'docs/verify-bianchi-ix-c2.cjs (13/13)',
              'docs/verify-hopf-splitting.cjs (7/7)'],
  cost_hint: 'fast',
  inputs: [
    { name: 'alpha', type: 'number', unit: 'ln(volume)/3', default: -0.4, min: -8, max: 4,
      doc: 'logarithmic scale factor of the geometry the operator is evaluated on' },
    { name: 'beta_plus', type: 'number', unit: 'dimensionless', default: 0.18, min: -3, max: 3,
      doc: 'anisotropy coordinate beta_+; zero with beta_- gives the round sphere' },
    { name: 'beta_minus', type: 'number', unit: 'dimensionless', default: 0.0, min: -3, max: 3,
      doc: 'anisotropy coordinate beta_-; zero alone leaves c1 = c2, an axially symmetric top' },
    { name: 'j_max', type: 'number', unit: 'spin', default: 2, min: 0.5, max: 12,
      doc: 'highest half-integer spin block to diagonalise' }
  ],
  outputs: [
    { name: 'c', type: 'array', unit: 'a_i^-2', doc: 'the three inverse squared scale factors' },
    { name: 'lowest', unit: 'energy (convention units)', doc: 'lowest eigenvalue over all blocks' },
    { name: 'gap', unit: 'energy (convention units)', doc: 'spacing between the two lowest DISTINCT levels' },
    { name: 'distinct', type: 'array', unit: 'levels', doc: 'every distinct eigenvalue with its FULL multiplicity, spectator index included' },
    { name: 'blocks', type: 'array', unit: null, doc: 'per spin j: eigenvalues, block dimension, spectator multiplicity and total (2j+1)^2' },
    { name: 'trace_residual', unit: 'relative', doc: 'departure from the exact trace identity, recomputed live' },
    { name: 'level_count', type: 'object', unit: null, doc: 'distinct levels and total states' }
  ],
  evaluate(i) {
    const S = specSpectrum(i.alpha, i.beta_plus, i.beta_minus, i.j_max);
    return {
      outputs: {
        c: S.c, lowest: S.lowest, gap: S.gap,
        distinct: S.distinct.map(d => ({ value: d.value, multiplicity: d.multiplicity, from_j: d.j })),
        blocks: S.blocks.map(b => ({ j: b.j, eigenvalues: b.ev, block_dimension: b.blockDim,
          spectator_multiplicity: b.spectator, total_states: b.total })),
        trace_residual: S.traceResidual,
        level_count: { distinct: S.distinct.length, total_states: S.blocks.reduce((a, b) => a + b.total, 0) }
      },
      warnings: ['H(t) is the INSTANTANEOUS operator at one point of a trajectory. No statement about ' +
        'level crossings, Berry phases or particle creation follows from it without solving the ' +
        'time-dependent problem, and none is made here.',
        'NON-INTEGRABILITY DOES NOT IMPLY A SPECTRAL GAP: the isotropic geometry has a LARGER gap ' +
        'than the mildly anisotropic one, and that counterexample is computable from this laboratory.'],
      diagnostics: { convention: 'SUM_i K_i^2 = j(j+1)', diagonalisation: 'cyclic Jacobi rotations' }
    };
  },
  selftests: [
    { name: 'the exact trace identity holds at every anisotropy tested',
      run(L) { let worst = 0;
        for (const bp of [-1.5, -0.4, 0, 0.18, 1.2]) for (const bm of [0, 0.3, -0.9])
          worst = Math.max(worst, L.run({ alpha: -0.4, beta_plus: bp, beta_minus: bm, j_max: 3 },
            { provenance: {} }).outputs.trace_residual);
        return { pass: worst < 1e-12, detail: `worst relative trace residual over 15 geometries = ${worst.toExponential(2)}` }; } },
    { name: 'the isotropic limit collapses to one level per block at c/2·j(j+1) with multiplicity (2j+1)²',
      run(L) { const o = L.run({ alpha: 0, beta_plus: 0, beta_minus: 0, j_max: 3 }, { provenance: {} }).outputs;
        let bad = null;
        for (const b of o.blocks) {
          const j = b.j, want = 0.5 * j * (j + 1), n = Math.round(2 * j) + 1;
          const spread = Math.max(...b.eigenvalues) - Math.min(...b.eigenvalues);
          if (spread > 1e-12 || Math.abs(b.eigenvalues[0] - want) > 1e-12 || b.total_states !== n * n)
            bad = `j = ${j}: spread ${spread.toExponential(2)}, value ${b.eigenvalues[0]}, want ${want}, states ${b.total_states} vs ${n * n}`;
        }
        return { pass: !bad, detail: bad || 'every block degenerate at c/2·j(j+1), total states (2j+1)² for j = ½…3' }; } },
    { name: 'the counterexample the limits claim is real: an isotropic geometry has a LARGER gap than a mildly anisotropic one',
      run(L) { const iso = L.run({ alpha: -0.4, beta_plus: 0, beta_minus: 0, j_max: 2 }, { provenance: {} }).outputs.gap;
        const ani = L.run({ alpha: -0.4, beta_plus: 0.18, beta_minus: 0, j_max: 2 }, { provenance: {} }).outputs.gap;
        return { pass: iso > ani, detail: `isotropic gap ${iso.toFixed(6)} > anisotropic gap ${ani.toFixed(6)} — non-integrability implies nothing about the gap` }; } },
    { name: 'the state count per block is (2j+1)², so the spectator index is not silently dropped',
      run(L) { const o = L.run({ j_max: 4 }, { provenance: {} }).outputs;
        const bad = o.blocks.find(b => b.total_states !== (Math.round(2 * b.j) + 1) ** 2 ||
          b.block_dimension !== Math.round(2 * b.j) + 1);
        return { pass: !bad, detail: bad ? JSON.stringify(bad) : `${o.blocks.length} blocks, ${o.level_count.total_states} states in total` }; } }
  ]
});
