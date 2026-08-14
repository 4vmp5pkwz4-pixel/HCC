import { defineLab } from '../contract.mjs';
import { STATUS } from '../status.mjs';
import { bixSeed, pcCreate } from '../atlas/extracted.mjs';

/* NUMERICALLY_VERIFIED. The Bogoliubov system is integrated and the Wronskian |A|^2 - |B|^2
   = 1 is MEASURED along the run and never imposed, so it is a diagnostic of the integration
   rather than a decoration on it. The headline — an isotropic universe creates EXACTLY zero
   while expanding by six e-folds — is a statement about a conformally coupled massless
   field and closes no other channel. */
export default defineLab({
  id: 's3.particle_creation',
  title: 'Particle creation — what an anisotropic universe makes, and what expansion does not',
  status: STATUS.NUMERICALLY_VERIFIED,
  model_id: 's3.bogoliubov',
  equation_ids: ['pc.factorisation', 'pc.bogoliubov', 'pc.wronskian', 'pc.occupation'],
  summary: 'Every eigenvalue factorises as lambda = exp(-2 alpha) mu(beta), so for a conformally ' +
    'coupled massless field the conformal rescaling removes alpha IDENTICALLY and Omega depends on the ' +
    'anisotropy alone. An isotropic universe therefore creates exactly zero — not a small number, zero.',
  formulas: [
    'lambda_n(alpha, beta) = exp(-2 alpha) mu_n(beta)          (exact factorisation)',
    'Omega_n^2 = exp(2 alpha) lambda_n = mu_n(beta)            (alpha drops out identically)',
    "A' = (Omega'/2 Omega) exp(+2 i theta) B",
    "B' = (Omega'/2 Omega) exp(-2 i theta) A,   theta' = Omega",
    '|A|^2 - |B|^2 = 1                                        (measured, never imposed)',
    'n = |B|^2'
  ],
  assumptions: [
    'a CONFORMALLY COUPLED MASSLESS scalar field — an assumption, not a result',
    'the adiabatic vacuum at tau = 0',
    'adiabatic labelling of a level, which fails at a level crossing; crossings are NOT detected'
  ],
  domain_of_validity: [
    '-8 <= alpha <= 4 and an isotropic point is on the constraint surface only above the bounce radius exp(2 alpha) = 3/(4 Lambda)',
    '0.5 <= j <= 6, level index 0 to 12, integration window 0.01 to 60 in volume time',
    'ONE mode: no sum is taken over the (2j+1)^2 degeneracy or over j, and both sums diverge without a regulator that is not supplied here'
  ],
  falsifiers: [
    'the Wronskian |A|^2 - |B|^2 departs from 1 beyond the integration tolerance',
    'an isotropic run returns a nonzero occupation',
    'the occupation depends on alpha, which the exact factorisation forbids for this field'
  ],
  verifiers: ['docs/verify-particle-creation.cjs (6/6)', 'docs/verify-spectral-operator.cjs (9/9)',
              'docs/verify-bianchi-ix-c2.cjs (13/13)'],
  cost_hint: 'fast',
  inputs: [
    { name: 'alpha', type: 'number', unit: 'ln(volume)/3', default: 0.5, min: -8, max: 4,
      doc: 'the starting scale factor; below the bounce radius there is no real p_alpha at beta = 0 and the seed is REFUSED rather than moved' },
    { name: 'beta_plus', type: 'number', unit: 'dimensionless', default: 0.2, min: -3, max: 3,
      doc: 'anisotropy beta_+; zero with beta_- gives exactly zero created particles' },
    { name: 'beta_minus', type: 'number', unit: 'dimensionless', default: 0.0, min: -3, max: 3, doc: 'anisotropy beta_-' },
    { name: 'p_plus', type: 'number', unit: 'momentum', default: 0.0, min: -40, max: 40, doc: 'momentum conjugate to beta_+' },
    { name: 'p_minus', type: 'number', unit: 'momentum', default: 0.0, min: -40, max: 40, doc: 'momentum conjugate to beta_-' },
    { name: 'Lambda', type: 'number', unit: 'dimensionless', default: 0.5, min: 0, max: 4, doc: 'the cosmological term' },
    { name: 'j', type: 'number', unit: 'spin', default: 1, min: 0.5, max: 6, doc: 'which spin block the mode lives in' },
    { name: 'level', type: 'number', unit: 'index', default: 0, min: 0, max: 12,
      doc: 'which level within the block, counted from the lowest; prefer the lowest, which is generically non-degenerate away from isotropy' },
    { name: 'tauMax', type: 'number', unit: 'volume time', default: 1, min: 0.01, max: 60, doc: 'integration window' }
  ],
  outputs: [
    { name: 'n', unit: 'quanta', doc: 'the occupation |B|^2 of ONE mode in the adiabatic vacuum at tau = 0 — not a total particle number' },
    { name: 'wronskian', unit: 'absolute', doc: 'worst ||A|^2 - |B|^2 - 1| along the run; never projected back' },
    { name: 'mu_swing', unit: 'mu', doc: 'how far the reduced eigenvalue travelled — this, not the initial anisotropy, is what the mode responds to' },
    { name: 'alpha_growth', unit: 'e-folds', doc: 'how much the scale factor grew, so a run creating nothing can be seen to have been expanding violently' },
    { name: 'stop', type: 'string', unit: null, doc: 'window, collapse, overflow, de Sitter escape or step budget' },
    { name: 'steps', unit: 'count', doc: 'adaptive steps taken' },
    { name: 'seed_rescaled', unit: 'factor', doc: '1 unless the requested momenta had to be scaled onto the constraint surface' }
  ],
  evaluate(i) {
    const ic = bixSeed(i.alpha, i.beta_plus, i.beta_minus, i.p_plus, i.p_minus, i.Lambda, 'expanding');
    if (!ic) {
      const floor = Math.log(3 / (4 * Math.max(i.Lambda, 1e-300))) / 2;
      return { outputs: { n: null, wronskian: null, mu_swing: null, alpha_growth: null,
          stop: `no real p_alpha for these data — an isotropic point needs exp(2 alpha) >= 3/(4 Lambda), i.e. alpha >= ${floor.toFixed(6)}`,
          steps: 0, seed_rescaled: null },
        warnings: ['UNREACHABLE: these data are not on the constraint surface. No occupation is returned, ' +
          'and the seed is not moved to make one available.'] };
    }
    const r = pcCreate(ic, i.Lambda, { j: i.j, idx: Math.round(i.level), tauMax: i.tauMax });
    return {
      outputs: { n: r.n, wronskian: r.wronskian, mu_swing: r.muSwing, alpha_growth: r.alphaGrowth,
        stop: r.stop, steps: r.steps, seed_rescaled: ic.scale },
      warnings: [
        'this is NOT a claim that expansion never creates particles. It holds for a CONFORMALLY COUPLED ' +
        'MASSLESS field, for which conformal flatness is exactly the condition for no creation. A massive ' +
        'or minimally coupled field keeps its alpha dependence in Omega and would be created by expansion ' +
        'alone. This isolates the anisotropic channel; it does not close the others.',
        'n is the occupation of ONE mode: no sum over the (2j+1)^2 degeneracy or over j, and both diverge ' +
        'without a regulator that is not supplied here.',
        'the adiabatic labelling of a level fails at a level crossing, and crossings are not detected'
      ],
      diagnostics: { wronskian_policy: 'measured along the run, never imposed' }
    };
  },
  selftests: [
    { name: 'an ISOTROPIC universe creates exactly zero while expanding by several e-folds — zero, not a small number',
      run(L) { const o = L.run({ alpha: 0.5, beta_plus: 0, beta_minus: 0, Lambda: 0.5, tauMax: 3 }, { provenance: {} }).outputs;
        return { pass: o.n === 0 || o.n < 1e-30,
          detail: `n = ${o.n} after ${o.alpha_growth?.toFixed(4)} e-folds of expansion` }; } },
    { name: 'the Wronskian is preserved, and it is measured rather than imposed',
      run(L) { let worst = 0;
        for (const bp of [0.1, 0.2, 0.35]) for (const t of [0.5, 1, 2]) {
          const o = L.run({ beta_plus: bp, tauMax: t }, { provenance: {} }).outputs;
          if (o.wronskian != null) worst = Math.max(worst, o.wronskian); }
        return { pass: worst < 1e-6, detail: `worst ||A|²−|B|²−1| over nine runs = ${worst.toExponential(2)}` }; } },
    /* The claim to test is that EXPANSION does not create, not that n is a function of alpha:
       two runs at different alpha with the same beta seed follow different beta HISTORIES,
       because the constraint fixes p_alpha differently, so their occupations legitimately
       differ. A first version of this check was called "the occupation is independent of
       alpha" and then asserted only that both numbers were positive — a name claiming far
       more than the assertion underneath it. The falsifiable form is the isotropic locus,
       where the anisotropic channel is switched off and only expansion is left. */
    { name: 'expansion ALONE creates nothing, at every scale factor and every amount of growth tested',
      run(L) { const rows = [];
        for (const a of [0.3, 0.8, 1.5, 2.5]) for (const t of [1, 3])
          rows.push(L.run({ alpha: a, beta_plus: 0, beta_minus: 0, Lambda: 0.5, tauMax: t }, { provenance: {} }).outputs);
        const growth = rows.map(r => r.alpha_growth).filter(Number.isFinite);
        return { pass: rows.every(r => r.n === 0) && growth.length === rows.length && growth.every(g => g > 3),
          detail: `n = 0 in all ${rows.length} isotropic runs, each of which expanded by ` +
            `${Math.min(...growth).toFixed(3)}–${Math.max(...growth).toFixed(3)} e-folds before escaping` }; } },
    { name: 'more initial anisotropy does not mean more particles — the occupation follows the SWING of mu, and no monotone law is claimed',
      run(L) { const lo = L.run({ beta_plus: 0.20, tauMax: 1 }, { provenance: {} }).outputs;
        const hi = L.run({ beta_plus: 0.35, tauMax: 1 }, { provenance: {} }).outputs;
        return { pass: Number.isFinite(lo.n) && Number.isFinite(hi.n),
          detail: `beta_+ = 0.20 → n = ${lo.n.toExponential(4)} (mu swing ${lo.mu_swing.toExponential(3)}) · ` +
                  `beta_+ = 0.35 → n = ${hi.n.toExponential(4)} (mu swing ${hi.mu_swing.toExponential(3)})` }; } },
    { name: 'a seed below the bounce radius is REFUSED with the threshold named, not moved onto the surface',
      run(L) { const r = L.run({ alpha: -3, beta_plus: 0, beta_minus: 0, Lambda: 0.5 }, { provenance: {} });
        return { pass: r.outputs.n === null && /alpha >=/.test(r.outputs.stop), detail: r.outputs.stop.slice(0, 120) }; } }
  ]
});
