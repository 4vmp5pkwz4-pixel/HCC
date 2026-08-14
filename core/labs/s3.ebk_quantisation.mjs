import { defineLab } from '../contract.mjs';
import { STATUS } from '../status.mjs';
import { ebkCompare } from '../atlas/extracted.mjs';

/* NUMERICALLY_VERIFIED, and verified in the only way that agreement alone could never be:
   the error must fall as 1/j^2, the signature of a leading O(hbar^2) correction. Agreement
   at one j proves nothing; the RATE is the check. */
export default defineLab({
  id: 's3.ebk_quantisation',
  title: 'EBK quantisation — the semiclassical prediction against the exact spectrum',
  status: STATUS.NUMERICALLY_VERIFIED,
  model_id: 's3.ebk',
  equation_ids: ['ebk.hamiltonian', 'ebk.level_set', 'ebk.action', 'ebk.langer'],
  summary: 'Einstein–Brillouin–Keller quantisation of the asymmetric top, compared against exact ' +
    'diagonalisation. EBK is blind to tunnelling by construction, so every comparison is against ' +
    'the DOUBLET MEAN and each level says whether its splitting is above the double-precision floor.',
  formulas: [
    'H(phi,p) = 1/2 [ (L^2 - p^2) g(phi) + c3 p^2 ],  g = c1 cos^2 phi + c2 sin^2 phi',
    'p^2 = (2E - L^2 g)/(c3 - g)          (the level set)',
    'S(E) = INT p dphi over the orbit',
    'EBK:  S = 2 pi (n + 1/2)   at hbar = 1',
    'Langer length  L = j + 1/2   (a convention with a standard justification, not a derivation)',
    'torus n  <->  exact doublet (2n, 2n+1); EBK returns the MEAN'
  ],
  assumptions: [
    'invariant tori exist — MEASURED, not assumed: work package C2 found Lyapunov doubling ratios ' +
      '0.544 to 0.578 on every reachable bounded orbit, against a plateau at 1 for a chaotic one',
    'the Langer substitution L = j + 1/2',
    'the c_i are held FIXED; this quantises the instantaneous operator, not the Bianchi IX geometry'
  ],
  domain_of_validity: [
    '2 <= j <= 80, and the semiclassical error falls as 1/j^2 across it',
    'a genuinely asymmetric top: at beta_- = 0 the levels are exact +/-m pairs, not tunnelling doublets, ' +
      'and the instrument says so per level rather than returning confident nonsense',
    'above about j = 24 the tunnelling splitting falls below double precision and is flagged unresolved'
  ],
  falsifiers: [
    'the relative error fails to fall by roughly four when j doubles — the 1/j^2 law of a leading O(hbar^2) correction',
    'a level is reported as a tunnelling doublet when its splitting is not small against its neighbours',
    'the quadrature error is not pushed below the semiclassical error, which would make the rate unreadable'
  ],
  verifiers: ['docs/verify-ebk-quantisation.cjs (6/6)', 'docs/verify-spectral-operator.cjs (9/9)',
              'docs/verify-bianchi-ix-c2.cjs (13/13) — the regularity that licenses the method'],
  cost_hint: 'fast',
  inputs: [
    { name: 'j', type: 'number', unit: 'spin', default: 16, min: 2, max: 80,
      doc: 'the spin block; the EBK error falls as 1/j^2 and the block is (2j+1)-dimensional' },
    { name: 'beta_plus', type: 'number', unit: 'dimensionless', default: 0.3, min: -3, max: 3,
      doc: 'anisotropy beta_+; at zero anisotropy every level is degenerate and there is no torus structure' },
    { name: 'beta_minus', type: 'number', unit: 'dimensionless', default: 0.2, min: -3, max: 3,
      doc: 'anisotropy beta_-' },
    { name: 'levels', type: 'number', unit: 'count', default: 3, min: 1, max: 12,
      doc: 'how many EBK tori to compute, each against its own exact doublet' },
    { name: 'quadrature', type: 'number', unit: 'samples', default: 8000, min: 200, max: 200000,
      doc: 'samples in the action integral; the quadrature error is separate from the semiclassical one' }
  ],
  outputs: [
    { name: 'c', type: 'array', unit: 'e^{-2 beta_i}', doc: 'the three sorted factors that define the top' },
    { name: 'L', unit: 'hbar', doc: 'the Langer length j + 1/2' },
    { name: 'levels', type: 'array', unit: null,
      doc: 'per torus: the EBK energy, the exact doublet mean, the splitting, the relative error, whether it is a genuine doublet and whether the splitting is resolvable in double precision' },
    { name: 'worst_relative_error', unit: 'relative', doc: 'largest disagreement with a doublet mean' },
    { name: 'n_genuine_doublets', unit: 'count', doc: 'how many of the pairs are tunnelling doublets rather than exact +/-m pairs' }
  ],
  evaluate(i) {
    const r = ebkCompare(Math.round(2 * i.j) / 2, i.beta_plus, i.beta_minus,
      Math.round(i.levels) - 1, Math.round(i.quadrature));
    const genuine = r.levels.filter(x => /^tunnelling/.test(x.pairing)).length;
    const warnings = ['EBK is blind to tunnelling BY CONSTRUCTION; every comparison is against the ' +
      'doublet mean, and comparing to a single eigenvalue compares the wrong things.'];
    if (genuine < r.levels.length)
      warnings.push(`${r.levels.length - genuine} of ${r.levels.length} level pairs are NOT tunnelling ` +
        `doublets — at beta_- = 0 the two axes coincide and the structure is a singlet followed by ` +
        `exact +/-m pairs, so the "mean" is not the quantity EBK predicts`);
    if (r.levels.some(x => !x.splittingResolved))
      warnings.push('at least one splitting is below what double precision can resolve; those values are round-off, not data');
    return {
      outputs: { c: r.c, L: r.L, levels: r.levels,
        worst_relative_error: r.levels.length ? Math.max(...r.levels.map(x => x.relativeError)) : null,
        n_genuine_doublets: genuine },
      warnings,
      diagnostics: { licence: 'measured in work package C2: every reachable bounded orbit is regular' }
    };
  },
  selftests: [
    { name: 'the error falls as 1/j² when j doubles — the rate a leading O(ħ²) correction must have, which agreement alone could never show',
      run(L) { const a = L.run({ j: 8, quadrature: 40000 }, { provenance: {} }).outputs.worst_relative_error;
        const b = L.run({ j: 16, quadrature: 40000 }, { provenance: {} }).outputs.worst_relative_error;
        const c = L.run({ j: 32, quadrature: 40000 }, { provenance: {} }).outputs.worst_relative_error;
        const r1 = a / b, r2 = b / c;
        return { pass: r1 > 3 && r1 < 5.5 && r2 > 3 && r2 < 5.5,
          detail: `err(8) = ${a.toExponential(3)}, err(16) = ${b.toExponential(3)}, err(32) = ${c.toExponential(3)} · ratios ${r1.toFixed(3)} and ${r2.toFixed(3)}, both near 4` }; } },
    { name: 'the quadrature error is below the semiclassical error, so the rate above is readable',
      run(L) { const a = L.run({ j: 16, quadrature: 8000 }, { provenance: {} }).outputs.worst_relative_error;
        const b = L.run({ j: 16, quadrature: 160000 }, { provenance: {} }).outputs.worst_relative_error;
        return { pass: Math.abs(a - b) < 0.02 * a, detail: `20× the samples moves the answer by ${(100 * Math.abs(a - b) / a).toFixed(4)}%` }; } },
    { name: 'an axially symmetric top is REFUSED the doublet reading rather than given a confident wrong one',
      run(L) { const r = L.run({ j: 16, beta_plus: 0.3, beta_minus: 0 }, { provenance: {} });
        return { pass: r.outputs.n_genuine_doublets === 0 && r.warnings.some(w => /NOT tunnelling/.test(w)),
          detail: `${r.outputs.n_genuine_doublets} genuine doublets at beta_- = 0 · ${r.outputs.levels[0].pairing.slice(0, 80)}…` }; } },
    { name: 'the Langer length is j + ½ and appears as such',
      run(L) { const o = L.run({ j: 16 }, { provenance: {} }).outputs;
        return { pass: Math.abs(o.L - 16.5) < 1e-15, detail: `L = ${o.L}` }; } }
  ]
});
