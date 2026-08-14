import { defineLab, domainError } from '../contract.mjs';
import { STATUS } from '../status.mjs';
import { lstsq } from '../math/lstsq.mjs';

/* Series RLC: Z(w) = R + j(wL - 1/(wC)).  Re Z is constant and Im Z is linear in
   (L, 1/C) against (w, -1/w) — so the inversion is a two-column least squares and is
   EXACT for noiseless data. Everything difficult about this instrument is the honesty
   around it: the holdout, the conditioning, and refusing to report a fit as a discovery. */
function synth(R, L, Cc, f) { const w = 2 * Math.PI * f;
  return { re: R, im: w * L - 1 / (w * Cc) }; }

export default defineLab({
  id: 'smith.fit_series_rlc',
  title: 'Series-RLC inversion with a blocked hold-out',
  status: STATUS.NUMERICALLY_VERIFIED,
  model_id: 'rlc.series.single_resonance',
  equation_ids: ['Z=R+jwL+1/(jwC)', 'f0=1/(2*pi*sqrt(LC))', 'Q=sqrt(L/C)/R'],
  summary: 'Recovers R, L, C from impedance samples of a SINGLE series resonance, with a ' +
    'blocked hold-out band the fit never sees. It is falsifiable: if the device is not one ' +
    'series resonance, the hold-out residual says so.',
  formulas: ['Z(w) = R + j(w L - 1/(w C))', 'f0 = 1/(2 pi sqrt(L C))', 'Q = (1/R) sqrt(L/C)'],
  assumptions: ['exactly one series resonance in the band', 'lumped elements, frequency-independent R',
    'no parasitic shunt path', 'measurement plane at the device terminals'],
  domain_of_validity: ['band containing f0 with enough points on both sides',
    'R, L, C all strictly positive'],
  falsifiers: ['the blocked hold-out residual is much larger than the training residual',
    'the recovered C or L is negative', 'the condition number of the design matrix is huge'],
  cost_hint: 'fast',
  inputs: [
    { name: 'f_hz', type: 'array', unit: 'Hz', doc: 'frequency samples' },
    { name: 'z_re', type: 'array', unit: 'ohm', doc: 'real part of Z at each frequency' },
    { name: 'z_im', type: 'array', unit: 'ohm', doc: 'imaginary part of Z at each frequency' },
    { name: 'holdout_fraction', type: 'number', unit: 'dimensionless', default: 0.3, min: 0, max: 0.6,
      doc: 'contiguous fraction of the band withheld from the fit — blocked, not random, because neighbouring frequency points are not independent' }
  ],
  outputs: [
    { name: 'R', unit: 'ohm', doc: 'series resistance' },
    { name: 'L', unit: 'H', doc: 'series inductance' },
    { name: 'C', unit: 'F', doc: 'series capacitance' },
    { name: 'f0', unit: 'Hz', doc: 'resonant frequency 1/(2 pi sqrt(LC))' },
    { name: 'Q', unit: 'dimensionless', doc: 'quality factor sqrt(L/C)/R' },
    { name: 'rms_residual_train', unit: 'ohm', doc: 'RMS residual on the fitted points' },
    { name: 'rms_residual_holdout', unit: 'ohm', doc: 'RMS residual on the band the fit never saw' },
    { name: 'condition_estimate', unit: 'dimensionless', doc: 'conditioning of the design matrix' },
    { name: 'n_train', type: 'integer', unit: 'count', doc: 'points used' },
    { name: 'n_holdout', type: 'integer', unit: 'count', doc: 'points withheld' }
  ],
  evaluate(i) {
    const f = i.f_hz, zr = i.z_re, zi = i.z_im;
    if (!Array.isArray(f) || f.length < 4) throw domainError('at least four frequency samples are required');
    if (f.length !== zr.length || f.length !== zi.length) throw domainError('f_hz, z_re and z_im must have equal length');
    const n = f.length, hk = Math.floor(n * i.holdout_fraction);
    const idx = [...f.keys()];
    const hold = idx.slice(Math.floor((n - hk) / 2), Math.floor((n - hk) / 2) + hk);
    const train = idx.filter(k => !hold.includes(k));
    const w = f.map(x => 2 * Math.PI * x);
    const A = train.map(k => [w[k], -1 / w[k]]), y = train.map(k => zi[k]);
    const sol = lstsq(A, y);
    const L = sol.x[0], invC = sol.x[1], Cc = 1 / invC;
    const R = train.reduce((s, k) => s + zr[k], 0) / train.length;
    const rms = ks => Math.sqrt(ks.reduce((s, k) => {
      const m = synth(R, L, Cc, f[k]);
      return s + (m.re - zr[k]) ** 2 + (m.im - zi[k]) ** 2; }, 0) / Math.max(1, ks.length));
    const warnings = [];
    if (L <= 0 || Cc <= 0) warnings.push('a non-positive L or C means the single-series-RLC model is wrong for this data');
    if (sol.condition_estimate > 1e8) warnings.push('the design matrix is badly conditioned; the band may be too narrow to separate L from 1/C');
    return { outputs: {
      R, L, C: Cc,
      f0: 1 / (2 * Math.PI * Math.sqrt(L * Cc)),
      Q: Math.sqrt(L / Cc) / R,
      rms_residual_train: rms(train), rms_residual_holdout: hold.length ? rms(hold) : 0,
      condition_estimate: sol.condition_estimate,
      n_train: train.length, n_holdout: hold.length },
      warnings,
      diagnostics: { holdout_band_hz: hold.length ? [f[hold[0]], f[hold[hold.length - 1]]] : null,
        method: 'linear least squares in (L, 1/C) on Im Z; R is the mean of Re Z' } };
  },
  selftests: [
    { name: 'the noiseless benchmark recovers R = 32 ohm, L = 1.4 uH, C = 470 pF exactly',
      run(L) {
        const R = 32, Lh = 1.4e-6, Cf = 470e-12;
        const f = [], zr = [], zi = [];
        for (let k = 0; k < 201; k++) { const x = 4e6 + k * 0.02e6;
          const z = synth(R, Lh, Cf, x); f.push(x); zr.push(z.re); zi.push(z.im); }
        const r = L.run({ f_hz: f, z_re: zr, z_im: zi }, { provenance: {} }).outputs;
        const e = Math.max(Math.abs(r.R / R - 1), Math.abs(r.L / Lh - 1), Math.abs(r.C / Cf - 1));
        return { pass: e < 1e-10 && Math.abs(r.f0 - 6204505.656) < 1,
          detail: `R=${r.R.toFixed(9)} L=${(r.L * 1e6).toFixed(9)}uH C=${(r.C * 1e12).toFixed(6)}pF ` +
                  `f0=${(r.f0 / 1e6).toFixed(9)}MHz Q=${r.Q.toFixed(9)} · max relative error ${e.toExponential(2)}` }; } },
    { name: 'a matched load is a NEGATIVE CONTROL: it must not look like a resonance',
      run(L) {
        const f = [], zr = [], zi = [];
        for (let k = 0; k < 101; k++) { const x = 4e6 + k * 0.04e6; f.push(x); zr.push(50); zi.push(0); }
        const r = L.run({ f_hz: f, z_re: zr, z_im: zi }, { provenance: {} }).outputs;
        return { pass: !Number.isFinite(r.f0) || r.L < 1e-15 || Math.abs(r.Q) < 1e-6,
          detail: `flat 50 ohm gives L=${r.L.toExponential(2)} C=${r.C.toExponential(2)} Q=${r.Q.toExponential(2)} — no resonance is claimed` }; } }
  ]
});
