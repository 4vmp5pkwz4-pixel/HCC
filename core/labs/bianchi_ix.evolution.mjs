import { defineLab } from '../contract.mjs';
import { STATUS } from '../status.mjs';
import { bixSeed, bixIntegrate, bixLyapunov, bixClassify } from '../atlas/extracted.mjs';

/* NUMERICALLY_VERIFIED. The classification is a MEASUREMENT of one integrated trajectory
   over a finite window, not a theorem about Bianchi IX — and the constraint is never
   projected back after the first step, so the residual measures the integration honestly
   instead of measuring the projection. */
export default defineLab({
  id: 'bianchi_ix.evolution',
  title: 'Bianchi IX — constraint-preserving evolution and trajectory class',
  status: STATUS.NUMERICALLY_VERIFIED,
  model_id: 'bix.c2',
  equation_ids: ['bix.lapse', 'bix.hamiltonian', 'bix.flow', 'bix.constraint', 'bix.nogo'],
  summary: 'The volume-time lapse N = 12 C exp(3 alpha) makes the Hamiltonian polynomial, so the flow ' +
    'can be integrated with an adaptive Dormand–Prince 5(4) without the constraint being projected ' +
    'back. Vacuum Bianchi IX with a cosmological term has NO equilibrium, and that is verified.',
  formulas: [
    'N = 12 C exp(3 alpha)                              (volume time)',
    'H_tau = (-p_alpha^2 + p_+^2 + p_-^2)/2 + 12 C^2 exp(4 alpha) V_G + 24 C^2 Lambda exp(6 alpha)',
    "alpha' = -p_alpha,  beta_+' = p_+,  beta_-' = p_-,  t' = 12 C exp(3 alpha)",
    'initial data are projected ONTO H_tau = 0 before the first step, and never afterwards',
    'NO-GO: p_alpha stationarity forces exp(2 alpha) = 1/(4 Lambda) while the constraint forces 3/(4 Lambda)'
  ],
  assumptions: [
    'vacuum Bianchi IX with a cosmological term; no matter of any kind',
    'the Misner parameterisation and the volume-time lapse',
    'initial data are PROJECTED onto the constraint surface, and the factor is reported rather than applied silently'
  ],
  domain_of_validity: [
    '-8 <= alpha <= 4, |beta| <= 3, |p| <= 40, 0 <= Lambda <= 4, 0.01 <= tauMax <= 200',
    'the classification describes the integrated window and nothing beyond it: a run labelled ' +
      'quasiperiodic over tau <= 5 may be chaotic over tau <= 500'
  ],
  falsifiers: [
    'the constraint residual grows without bound, which would mean the integration had drifted off the surface',
    'a genuine equilibrium is found, which the NO-GO forbids',
    'the Lyapunov doubling ratio plateaus at 1 on a bounded orbit, which would mean chaos inside the window'
  ],
  verifiers: ['docs/verify-bianchi-ix-c2.cjs (13/13)', 'docs/verify-bianchi-ix-wpd.cjs (9/9)',
              'docs/data/bianchi-ix-trajectories.csv (112 trajectories)'],
  open_problems: [
    'bianchi.spectral_consequence — the spectral consequence of Bianchi IX is not derived',
    'bianchi.csv_reproducibility — docs/data/bianchi-ix-trajectories.csv is not byte-reproducible from its generator'
  ],
  cost_hint: 'fast',
  inputs: [
    { name: 'alpha', type: 'number', unit: 'ln(volume)/3', default: -0.4, min: -8, max: 4, doc: 'logarithmic scale factor' },
    { name: 'beta_plus', type: 'number', unit: 'dimensionless', default: 0.18, min: -3, max: 3, doc: 'anisotropy beta_+' },
    { name: 'beta_minus', type: 'number', unit: 'dimensionless', default: 0.0, min: -3, max: 3, doc: 'anisotropy beta_-' },
    { name: 'p_plus', type: 'number', unit: 'momentum', default: 0.0, min: -40, max: 40, doc: 'momentum conjugate to beta_+' },
    { name: 'p_minus', type: 'number', unit: 'momentum', default: 0.7, min: -40, max: 40, doc: 'momentum conjugate to beta_-' },
    { name: 'Lambda', type: 'number', unit: 'dimensionless', default: 0.08, min: 0, max: 4, doc: 'the cosmological term' },
    { name: 'branch', type: 'string', unit: 'expanding | contracting', default: 'expanding',
      enum: ['expanding', 'contracting'], doc: 'which root of the constraint the initial momentum takes' },
    { name: 'tauMax', type: 'number', unit: 'volume time', default: 5, min: 0.01, max: 200, doc: 'integration window' }
  ],
  outputs: [
    { name: 'class', type: 'string', unit: null, doc: 'stationary, periodic, quasiperiodic, chaotic, transient, singular or unreachable' },
    { name: 'lyapunov', unit: '1/tau', doc: 'Benettin estimate over the DOUBLED window; null for any run that is not bounded' },
    { name: 'lyapunov_doubling_ratio', unit: 'dimensionless', doc: 'lambda(2T)/lambda(T); this, not a threshold on lambda, decides the chaotic class' },
    { name: 'lyapunov_expected_if_regular', unit: 'dimensionless', doc: 'what the ratio would be for a regular orbit at this window' },
    { name: 'lyapunov_verdict', type: 'string', unit: null, doc: 'plateau, decaying, or not measured — in words' },
    { name: 'constraint_residual', unit: 'relative', doc: '|H_tau| normalised by the CURRENT scale of its own terms' },
    { name: 'bounces', unit: 'count', doc: 'curvature-wall reflections counted during the run' },
    { name: 'stop', type: 'string', unit: null, doc: 'window, collapse, overflow or de Sitter escape' },
    { name: 'steps', unit: 'count', doc: 'adaptive Dormand–Prince 5(4) steps taken' },
    { name: 'seed_rescaled', unit: 'factor', doc: '1 unless the requested momenta were off the constraint surface' },
    { name: 'alpha_final', unit: 'ln(volume)/3', doc: 'the scale factor reached, ready to route into the spectral operator, particle creation or EBK' },
    { name: 'beta_plus_final', unit: 'dimensionless', doc: 'the anisotropy beta_+ reached' },
    { name: 'beta_minus_final', unit: 'dimensionless', doc: 'the anisotropy beta_- reached' },
    { name: 'p_plus_final', unit: 'momentum', doc: 'p_+ at the end of the run' },
    { name: 'p_minus_final', unit: 'momentum', doc: 'p_- at the end of the run' },
    { name: 'tau_final', unit: 'volume time', doc: 'the volume time actually reached' }
  ],
  evaluate(i) {
    const ic = bixSeed(i.alpha, i.beta_plus, i.beta_minus, i.p_plus, i.p_minus, i.Lambda, i.branch);
    if (!ic) return {
      outputs: { class: 'unreachable', lyapunov: null, lyapunov_doubling_ratio: null,
        lyapunov_expected_if_regular: null,
        lyapunov_verdict: 'not measured — these data are not on the constraint surface',
        constraint_residual: null, bounces: null,
        stop: 'no real root of the constraint for these data', steps: 0, seed_rescaled: null,
        alpha_final: null, beta_plus_final: null, beta_minus_final: null,
        p_plus_final: null, p_minus_final: null, tau_final: null },
      warnings: ['UNREACHABLE: these initial data have no real p_alpha, so no trajectory exists through ' +
        'them. No number is returned in place of one, and the data are NOT moved onto the surface.']
    };
    const r = bixIntegrate(ic, i.Lambda, { tauMax: i.tauMax });
    const ly = bixLyapunov(ic, i.Lambda, { tauMax: i.tauMax });
    const warnings = ['the class is a MEASUREMENT of one integrated trajectory over a finite window, not a theorem'];
    if (ic.scale !== 1)
      warnings.push(`the requested momenta were off the constraint surface and were scaled onto it by ${ic.scale}`);
    if (ly.lambda == null)
      warnings.push('the Lyapunov exponent is not reported: on an unbounded run the tangent grows with the ' +
        'inflating background rather than with any sensitivity, and two perfectly regular escapes measured 16 and 39');
    return {
      outputs: { class: bixClassify(r, ly), lyapunov: ly.lambda, lyapunov_doubling_ratio: ly.ratio,
        lyapunov_expected_if_regular: ly.expectedIfRegular ?? null, lyapunov_verdict: ly.verdict,
        constraint_residual: r.resid, bounces: r.bounces, stop: r.stop, steps: r.steps,
        seed_rescaled: ic.scale,
        alpha_final: r.y[0], beta_plus_final: r.y[1], beta_minus_final: r.y[2],
        p_plus_final: r.y[4], p_minus_final: r.y[5], tau_final: r.tau },
      warnings,
      diagnostics: { integrator: 'adaptive Dormand–Prince 5(4)', constraint: 'projected once, never afterwards' }
    };
  },
  selftests: [
    { name: 'the constraint is preserved without ever being projected back',
      run(L) { let worst = 0;
        for (const pm of [0.3, 0.7, 1.4]) for (const bp of [0, 0.18, -0.5]) {
          const o = L.run({ beta_plus: bp, p_minus: pm, tauMax: 5 }, { provenance: {} }).outputs;
          if (o.constraint_residual != null) worst = Math.max(worst, o.constraint_residual); }
        return { pass: worst < 1e-7, detail: `worst relative |H_tau| over nine trajectories = ${worst.toExponential(2)}` }; } },
    { name: 'the NO-GO holds: vacuum Bianchi IX with Λ has no equilibrium, so no run is ever stationary',
      run(L) { const seen = new Set();
        for (const a of [-1.2, -0.4, 0.2]) for (const Lm of [0.08, 0.5, 1.5])
          seen.add(L.run({ alpha: a, Lambda: Lm, tauMax: 8 }, { provenance: {} }).outputs.class);
        return { pass: !seen.has('stationary'), detail: `classes reached: ${[...seen].join(', ')} — never stationary` }; } },
    { name: 'every reachable bounded orbit is REGULAR, and the doubling ratio says so rather than a threshold on λ',
      /* the seeds matter: at the default alpha = -0.4 every run escapes, the exponent is
         correctly WITHHELD, and a check that demanded one was testing its own choice of
         initial data rather than the physics. These four are bounded over the window. */
      run(L) { const rows = [];
        for (const a of [-0.8, -1.2]) for (const Lm of [0.02, 0.08]) {
          const o = L.run({ alpha: a, p_minus: 0.7, Lambda: Lm, tauMax: 6 }, { provenance: {} }).outputs;
          if (o.lyapunov_doubling_ratio != null)
            rows.push({ a, Lm, r: o.lyapunov_doubling_ratio, e: o.lyapunov_expected_if_regular }); }
        const ok = rows.length === 4 && rows.every(x => x.r < 0.8 && Math.abs(x.r - x.e) < 0.15);
        return { pass: ok,
          detail: rows.length ? rows.map(x => `α=${x.a} Λ=${x.Lm}: ratio ${x.r.toFixed(4)} against ${x.e.toFixed(4)} if regular`).join(' · ') +
            ' — every one far below the chaotic plateau at 1'
            : 'no bounded orbit was found, so no exponent could be measured' }; } },
    { name: 'initial data off the constraint surface are reported, not silently accepted',
      run(L) { const o = L.run({ alpha: -0.4, p_plus: 3, p_minus: 3, Lambda: 0.08 }, { provenance: {} });
        return { pass: o.outputs.seed_rescaled === 1 || o.warnings.some(w => /scaled onto it/.test(w)),
          detail: `seed_rescaled = ${o.outputs.seed_rescaled}` }; } },
    { name: 'an unknown branch is REFUSED by name rather than defaulted',
      run(L) { try { L.run({ branch: 'sideways' }, { provenance: {} }); return { pass: false, detail: 'it ran anyway' }; }
        catch (e) { return { pass: e.code === 'DOMAIN_ERROR' && /expanding/.test(e.message), detail: e.message.slice(0, 100) }; } } },
    { name: 'the final state is published, so a cosmology can hand its endpoint to the quantum laboratories',
      run(L) { const o = L.run({ tauMax: 3 }, { provenance: {} }).outputs;
        const fin = [o.alpha_final, o.beta_plus_final, o.beta_minus_final, o.p_plus_final, o.p_minus_final, o.tau_final];
        return { pass: fin.every(Number.isFinite), detail: `alpha_final = ${o.alpha_final.toFixed(6)}, tau_final = ${o.tau_final.toFixed(6)}` }; } }
  ]
});
