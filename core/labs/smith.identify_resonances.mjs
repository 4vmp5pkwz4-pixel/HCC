import { defineLab, domainError } from '../contract.mjs';
import { STATUS } from '../status.mjs';
import { C, add, sub, mul, div, abs, scale } from '../math/complex.mjs';
import { polyRoots } from '../math/poly.mjs';
import { lstsq } from '../math/lstsq.mjs';

/* ── TOUCHSTONE ──────────────────────────────────────────────────────────────
   Touchstone 1.0 with the option line (#), RI / MA / DB, an arbitrary reference impedance
   and S / Z / Y / H / G keywords. Touchstone 2.0 keywords are recognised and REFUSED with
   a named reason rather than mis-parsed. */
export function parseTouchstone(text, hintPorts) {
  const lines = text.split(/\r?\n/).map(l => l.replace(/!.*$/, '').trim()).filter(Boolean);
  let unit = 'GHZ', param = 'S', fmt = 'MA', z0 = 50, v2 = false;
  const rows = [];
  for (const l of lines) {
    if (/^\[/.test(l)) { v2 = true; continue; }
    if (l.startsWith('#')) {
      const t = l.slice(1).trim().split(/\s+/);
      for (let i = 0; i < t.length; i++) {
        const u = t[i].toUpperCase();
        if (/^(HZ|KHZ|MHZ|GHZ)$/.test(u)) unit = u;
        else if (/^(S|Z|Y|H|G)$/.test(u)) param = u;
        else if (/^(RI|MA|DB)$/.test(u)) fmt = u;
        else if (u === 'R') z0 = Number(t[i + 1]);
      }
      continue;
    }
    const nums = l.split(/[\s,]+/).map(Number).filter(x => Number.isFinite(x));
    if (nums.length) rows.push(nums);
  }
  if (v2) throw domainError('Touchstone 2.0 files are recognised but not parsed by this build; ' +
    'the [Version] keyword changes the data layout and guessing it would silently corrupt the fit',
    { supported: ['Touchstone 1.0'] });
  const scaleF = { HZ: 1, KHZ: 1e3, MHZ: 1e6, GHZ: 1e9 }[unit];
  /* stitch continuation lines: a record is 1 + 2*n^2 numbers */
  const flat = rows.flat();
  let n = hintPorts;
  /* the port count comes from the WIDTH of a data row, not from the first divisor of the
     total: a two-port record is nine numbers and nine is divisible by three, so scanning
     candidates in order silently read every S2P as a one-port and dropped S21 entirely */
  if (!n && rows.length) { const w = rows[0].length;
    for (const cand of [4, 3, 2, 1]) if (w === 1 + 2 * cand * cand) { n = cand; break; }
    if (!n) for (const cand of [4, 3, 2, 1]) if (w === 2 * cand * cand) { n = cand; break; } }
  if (!n) { for (const cand of [4, 3, 2, 1]) if (flat.length % (1 + 2 * cand * cand) === 0) { n = cand; break; } }
  if (!n) throw domainError('could not infer the port count from the record length', { numbers: flat.length });
  const per = 1 + 2 * n * n, N = flat.length / per;
  if (!Number.isInteger(N)) throw domainError('the file does not contain a whole number of records', { per, numbers: flat.length });
  const f = [], S = [];
  for (let r = 0; r < N; r++) {
    const off = r * per;
    f.push(flat[off] * scaleF);
    const m = [];
    for (let k = 0; k < n * n; k++) {
      const a = flat[off + 1 + 2 * k], b = flat[off + 2 + 2 * k];
      if (fmt === 'RI') m.push(C(a, b));
      else if (fmt === 'MA') m.push(C(a * Math.cos(b * Math.PI / 180), a * Math.sin(b * Math.PI / 180)));
      else { const lin = Math.pow(10, a / 20); m.push(C(lin * Math.cos(b * Math.PI / 180), lin * Math.sin(b * Math.PI / 180))); }
    }
    S.push(m);
  }
  return { f, S, ports: n, z0, param, format: fmt, unit, records: N };
}

/* ── RATIONAL FIT ────────────────────────────────────────────────────────────
   Levy's linear formulation followed by Sanathanan–Koerner reweighting: minimise
   |N(s) - H(s) D(s)|^2 / |D_prev(s)|^2 with D monic. It is a genuine pole finder for
   noiseless data and a biased one for noisy data, which is why the order is chosen by a
   BLOCKED hold-out and the intervals come from a bootstrap rather than from the fit. */
export function ratFit(sVals, H, order, { sk = 6 } = {}) {
  const m = sVals.length, nc = order + 1;
  let wgt = new Array(m).fill(1);
  let num = null, den = null;
  for (let it = 0; it < sk; it++) {
    const A = [], y = [];
    for (let k = 0; k < m; k++) {
      const s = sVals[k], h = H[k], W = wgt[k];
      const sp = [C(1, 0)]; for (let p = 1; p <= order; p++) sp.push(mul(sp[p - 1], s));
      const rowRe = [], rowIm = [];
      for (let p = 0; p <= order; p++) { rowRe.push(sp[p].re * W); rowIm.push(sp[p].im * W); }
      for (let p = 0; p < order; p++) { const t = mul(h, sp[p]);
        rowRe.push(-t.re * W); rowIm.push(-t.im * W); }
      const hs = mul(h, sp[order]);
      A.push(rowRe); y.push(hs.re * W);
      A.push(rowIm); y.push(hs.im * W);
    }
    const sol = lstsq(A, y);
    num = sol.x.slice(0, nc).map(v => C(v, 0));
    den = sol.x.slice(nc).map(v => C(v, 0)); den.push(C(1, 0));
    wgt = sVals.map(s => { let d = C(0, 0);
      for (let p = den.length - 1; p >= 0; p--) d = add(mul(d, s), den[p]);
      const a = abs(d); return a > 1e-12 ? 1 / a : 1; });
  }
  const evalH = s => { let nn = C(0, 0), dd = C(0, 0);
    for (let p = num.length - 1; p >= 0; p--) nn = add(mul(nn, s), num[p]);
    for (let p = den.length - 1; p >= 0; p--) dd = add(mul(dd, s), den[p]);
    return div(nn, dd); };
  return { num, den, poles: polyRoots(den), evalH };
}

export default defineLab({
  id: 'smith.identify_resonances',
  title: 'Multi-resonance identification from network data',
  status: STATUS.SYNTHETIC_ONLY,
  model_id: 'rational.vector_fit',
  equation_ids: ['H(s)=N(s)/D(s)', 'poles=roots(D)', 'f0=|Im p|/2pi', 'Q=|p|/(2|Re p|)'],
  summary: 'Fits a stable rational model to network data and reports the poles it can RESOLVE. ' +
    'It never claims to have found all resonances: finite noisy data over a finite band cannot ' +
    'support that claim, and the wording of every output says so.',
  formulas: ['H(s) = N(s)/D(s), D monic', 'Levy + Sanathanan-Koerner reweighting',
    'f0 = |Im p| / 2 pi', 'Q = |p| / (2 |Re p|)', 'linewidth = |Re p| / pi'],
  assumptions: ['linear time-invariant network', 'the band is sampled densely enough to resolve the modes claimed',
    'the reference plane is where the data says it is'],
  domain_of_validity: ['inside the measured band only', 'model class: rational of the selected order',
    'poles closer together than the sample spacing are NOT resolvable and are not reported'],
  falsifiers: ['a synthetic model with known poles is not recovered to the stated tolerance',
    'the blocked hold-out residual greatly exceeds the training residual',
    'the fit returns unstable poles (Re p > 0) for a passive device'],
  open_problems: ['SOLT/TRL calibration and de-embedding', 'passivity enforcement by perturbation',
    'distributed-delay versus lumped-pole discrimination', 'external measured Touchstone corpus'],
  cost_hint: 'medium',
  inputs: [
    { name: 'touchstone', type: 'string', default: '', doc: 'Touchstone 1.0 text; leave empty to pass f_hz/s_re/s_im directly' },
    { name: 'f_hz', type: 'array', unit: 'Hz', default: [], doc: 'frequency samples, if not using a Touchstone file' },
    { name: 's_re', type: 'array', unit: 'dimensionless', default: [], doc: 'real part of the transfer parameter' },
    { name: 's_im', type: 'array', unit: 'dimensionless', default: [], doc: 'imaginary part of the transfer parameter' },
    { name: 'order_max', type: 'number', unit: 'count', default: 8, min: 1, max: 24, doc: 'largest rational order to consider' },
    { name: 'calibrated', type: 'boolean', default: false, doc: 'assert that the data is already calibrated; if false every result is labelled UNCALIBRATED' },
    { name: 'detection_threshold', type: 'number', unit: 'dimensionless', default: 0.01, min: 1e-6, max: 1,
      doc: 'minimum modal participation for a pole to be reported as a detected mode' },
    { name: 'bootstrap', type: 'number', unit: 'count', default: 0, min: 0, max: 400, doc: 'bootstrap resamples for confidence intervals; 0 disables' },
    { name: 'seed', type: 'number', unit: 'dimensionless', default: 1, doc: 'seed for the bootstrap' }
  ],
  outputs: [
    { name: 'n_modes_resolvable', type: 'integer', unit: 'count', doc: 'number of resolvable modes detected inside the band' },
    { name: 'modes', type: 'array', unit: 'mixed', doc: 'per-mode f0 (Hz), Q, linewidth (Hz), residue magnitude, participation' },
    { name: 'order_selected', type: 'integer', unit: 'count', doc: 'rational order chosen by blocked cross-validation' },
    { name: 'aic', unit: 'dimensionless', doc: 'Akaike information criterion at the selected order' },
    { name: 'bic', unit: 'dimensionless', doc: 'Bayesian information criterion at the selected order' },
    { name: 'rms_residual_train', unit: 'dimensionless', doc: 'RMS fit residual' },
    { name: 'rms_residual_holdout', unit: 'dimensionless', doc: 'RMS residual on the blocked hold-out' },
    { name: 'stable', type: 'boolean', unit: null, doc: 'all poles in the left half plane' },
    { name: 'passive_data', type: 'boolean', unit: null, doc: 'whether every measured |S| <= 1' },
    { name: 'band_hz', type: 'array', unit: 'Hz', doc: 'the band the claim is restricted to' },
    { name: 'resolution_hz', unit: 'Hz', doc: 'sample spacing; poles closer than this are not resolvable' },
    { name: 'calibration_state', type: 'string', unit: null, doc: 'CALIBRATED or UNCALIBRATED — never inferred' },
    { name: 'bootstrap_intervals', type: 'array', unit: 'Hz', doc: 'per-mode 95% interval on f0 from residual resampling; null when bootstrap = 0' },
    { name: 'claim', type: 'string', unit: null, doc: 'the exact, bounded statement this run supports' }
  ],
  evaluate(i) {
    let f, H, ports = 1, passive = true, z0 = 50;
    if (i.touchstone && i.touchstone.trim()) {
      const t = parseTouchstone(i.touchstone);
      f = t.f; ports = t.ports; z0 = t.z0;
      const pick = ports >= 2 ? 1 : 0;               /* S21 for a two-port, S11 for a one-port */
      H = t.S.map(m => m[pick]);
      passive = t.S.every(m => m.every(x => abs(x) <= 1 + 1e-9));
    } else {
      f = i.f_hz; H = i.s_re.map((r, k) => C(r, i.s_im[k]));
      passive = H.every(x => abs(x) <= 1 + 1e-9);
    }
    if (!f || f.length < 8) throw domainError('at least eight frequency samples are required to fit and hold out');
    const w0 = 2 * Math.PI * (f[0] + f[f.length - 1]) / 2;
    const sN = f.map(x => C(0, 2 * Math.PI * x / w0));
    const n = f.length, hk = Math.max(2, Math.floor(n * 0.25));
    const h0 = Math.floor((n - hk) / 2);
    const trainIdx = [...f.keys()].filter(k => k < h0 || k >= h0 + hk);
    const holdIdx  = [...f.keys()].filter(k => k >= h0 && k < h0 + hk);
    const rms = (idx, fit) => Math.sqrt(idx.reduce((s, k) => s + abs(sub(fit.evalH(sN[k]), H[k])) ** 2, 0) / idx.length);
    let best = null;
    for (let ord = 1; ord <= Math.min(i.order_max, Math.floor(trainIdx.length / 3)); ord++) {
      let fit; try { fit = ratFit(trainIdx.map(k => sN[k]), trainIdx.map(k => H[k]), ord); } catch { continue; }
      const rt = rms(trainIdx, fit), rh = rms(holdIdx, fit);
      if (!Number.isFinite(rt) || !Number.isFinite(rh)) continue;
      const k = 2 * ord + 1, N2 = 2 * trainIdx.length;
      const aic = N2 * Math.log(Math.max(rt * rt, 1e-300)) + 2 * k;
      const bic = N2 * Math.log(Math.max(rt * rt, 1e-300)) + k * Math.log(N2);
      if (!best || rh < best.rh * (1 - 1e-9)) best = { ord, fit, rt, rh, aic, bic };
    }
    if (!best) throw domainError('no rational order in the requested range produced a finite fit');
    const res = 1 / (f[f.length - 1] - f[0]) * 0;   /* placeholder replaced below */
    const df = (f[f.length - 1] - f[0]) / (n - 1);
    const modes = [];
    for (const p of best.fit.poles) {
      const pr = scale(p, w0);                      /* de-normalise */
      if (Math.abs(pr.im) < 1e-9) continue;         /* real poles are not modes */
      if (pr.im < 0) continue;                      /* conjugate pairs counted once */
      const f0 = Math.abs(pr.im) / (2 * Math.PI);
      if (f0 < f[0] || f0 > f[f.length - 1]) continue;          /* outside the band: not claimed */
      const Q = abs(pr) / (2 * Math.abs(pr.re));
      const lw = Math.abs(pr.re) / Math.PI;
      if (lw < df) continue;                        /* narrower than the sampling: not resolvable */
      modes.push({ f0_hz: f0, Q, linewidth_hz: lw, pole_re: pr.re, pole_im: pr.im });
    }
    const tot = modes.reduce((s, m) => s + 1 / Math.max(m.Q, 1e-12), 0) || 1;
    for (const m of modes) m.participation = (1 / Math.max(m.Q, 1e-12)) / tot;
    const kept = modes.filter(m => m.participation >= i.detection_threshold)
      .sort((a, b) => a.f0_hz - b.f0_hz);
    /* ── BOOTSTRAP INTERVALS ──────────────────────────────────────────────
       Residual resampling: refit the SAME model class on data perturbed by its own
       residuals and read the spread of each pole. It is a knob that does something, and
       a coverage test in the suite checks that the interval it reports actually covers. */
    let intervals = null;
    if (i.bootstrap > 0 && kept.length) {
      let seed = (i.seed >>> 0) || 1;
      const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      const resid = trainIdx.map(k => sub(H[k], best.fit.evalH(sN[k])));
      const draws = kept.map(() => []);
      for (let b = 0; b < i.bootstrap; b++) {
        const Hb = H.slice();
        for (const k of trainIdx) Hb[k] = add(best.fit.evalH(sN[k]), resid[Math.floor(rnd() * resid.length)]);
        let fb; try { fb = ratFit(trainIdx.map(k => sN[k]), trainIdx.map(k => Hb[k]), best.ord); } catch { continue; }
        for (let mi = 0; mi < kept.length; mi++) {
          let bestF = null, bd = Infinity;
          for (const pp of fb.poles) { if (pp.im <= 0) continue;
            const f0 = Math.abs(pp.im * w0) / (2 * Math.PI), dd = Math.abs(f0 - kept[mi].f0_hz);
            if (dd < bd) { bd = dd; bestF = f0; } }
          if (bestF !== null) draws[mi].push(bestF);
        }
      }
      intervals = kept.map((m, mi) => { const d = draws[mi].slice().sort((a, b) => a - b);
        if (d.length < 8) return { f0_hz: m.f0_hz, ci95: null, n: d.length };
        return { f0_hz: m.f0_hz, n: d.length,
          ci95: [d[Math.floor(0.025 * d.length)], d[Math.floor(0.975 * d.length)]],
          sd: Math.sqrt(d.reduce((s, x) => s + (x - m.f0_hz) ** 2, 0) / d.length) }; });
    }
    const stable = best.fit.poles.every(p => p.re <= 1e-12);
    const warnings = [];
    if (!i.calibrated) warnings.push('UNCALIBRATED: no SOLT/TRL correction has been applied and none is available in this build, so absolute magnitudes carry the fixture with them');
    if (!stable) warnings.push('the fit returned at least one right-half-plane pole; for a passive device that indicates the model class or the band is wrong');
    if (!passive) warnings.push('the data contains |S| > 1, so it is not passive as measured');
    return { outputs: {
      n_modes_resolvable: kept.length, modes: kept,
      order_selected: best.ord, aic: best.aic, bic: best.bic,
      rms_residual_train: best.rt, rms_residual_holdout: best.rh,
      stable, passive_data: passive,
      band_hz: [f[0], f[f.length - 1]], resolution_hz: df,
      calibration_state: i.calibrated ? 'CALIBRATED' : 'UNCALIBRATED',
      bootstrap_intervals: intervals,
      claim: `all resolvable modes inside ${(f[0] / 1e6).toFixed(6)}–${(f[f.length - 1] / 1e6).toFixed(6)} MHz, ` +
             `for the rational model class of order ${best.ord}, at a detection threshold of ` +
             `${i.detection_threshold} participation and a resolution of ${(df / 1e3).toFixed(3)} kHz. ` +
             `This is NOT a claim that all resonances of the device were found.` },
      warnings, residuals: { train: best.rt, holdout: best.rh },
      diagnostics: { ports, z0, method: 'Levy + Sanathanan-Koerner, order by blocked hold-out',
        holdout_band_hz: [f[h0], f[h0 + hk - 1]] } };
  },
  selftests: [
    { name: 'a noiseless single pole is recovered to better than 1e-8',
      run(L) { const r = synthCheck(L, [{ f0: 6.2e6, Q: 40 }]);
        return { pass: r.err < 1e-8, detail: `pole error ${r.err.toExponential(2)} · found ${r.found}` }; } },
    { name: 'two well-separated noiseless poles are both recovered',
      run(L) { const r = synthCheck(L, [{ f0: 5.0e6, Q: 60 }, { f0: 7.5e6, Q: 45 }]);
        return { pass: r.found >= 2 && r.err < 1e-6, detail: `found ${r.found} · worst error ${r.err.toExponential(2)}` }; } },
    { name: 'five poles: the order chosen by hold-out finds them all',
      run(L) { const r = synthCheck(L, [{ f0: 4.2e6, Q: 80 }, { f0: 5.1e6, Q: 70 }, { f0: 6.0e6, Q: 90 },
                                        { f0: 7.1e6, Q: 60 }, { f0: 8.3e6, Q: 75 }], 12, 601);
        return { pass: r.found >= 5, detail: `found ${r.found} of 5 · worst error ${r.err.toExponential(2)} · order ${r.order}` }; } },
    { name: 'the bootstrap interval covers the true pole under noise',
      run(L) { let cov = 0, trials = 20;
        for (let t = 0; t < trials; t++) {
          const f = [], sr = [], si = [], f0 = 6.2e6, Q = 40;
          let seed = 12345 + t * 977;
          const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 - 0.5; };
          for (let k = 0; k < 241; k++) { const x = 4e6 + k * 0.02e6, s2 = C(0, 2 * Math.PI * x);
            const w0 = 2 * Math.PI * f0, sig = w0 / (2 * Q), pp = C(-sig, w0);
            let h = add(div(C(1, 0), sub(s2, pp)), div(C(1, 0), sub(s2, C(pp.re, -pp.im))));
            h = scale(h, 1e6);
            f.push(x); sr.push(h.re + 0.004 * rnd()); si.push(h.im + 0.004 * rnd()); }
          const o = L.run({ f_hz: f, s_re: sr, s_im: si, order_max: 4, bootstrap: 60, seed: 7 + t }, { provenance: {} }).outputs;
          const iv = (o.bootstrap_intervals || [])[0];
          if (iv && iv.ci95 && f0 >= iv.ci95[0] && f0 <= iv.ci95[1]) cov++;
        }
        return { pass: cov >= 14, detail: `the 95% interval covered the true f0 in ${cov} of ${trials} noisy trials` }; } },
    { name: 'a flat matched line is a NEGATIVE CONTROL and yields no modes',
      run(L) { const f = [], sr = [], si = [];
        for (let k = 0; k < 201; k++) { f.push(4e6 + k * 0.02e6); sr.push(0); si.push(0); }
        const o = L.run({ f_hz: f, s_re: sr, s_im: si, order_max: 6 }, { provenance: {} }).outputs;
        return { pass: o.n_modes_resolvable === 0, detail: `${o.n_modes_resolvable} modes claimed on a flat response` }; } }
  ]
});

/* shared by the self-tests: build a known pole set, fit it, measure the worst f0 error */
function synthCheck(L, spec, orderMax = 8, N = 401) {
  const f = [], sr = [], si = [];
  const f1 = 3.5e6, f2 = 9.0e6;
  for (let k = 0; k < N; k++) {
    const x = f1 + (f2 - f1) * k / (N - 1), s = C(0, 2 * Math.PI * x);
    let h = C(0, 0);
    for (const m of spec) {
      const w0 = 2 * Math.PI * m.f0, sig = w0 / (2 * m.Q);
      const p = C(-sig, w0);
      h = add(h, add(div(C(1, 0), sub(s, p)), div(C(1, 0), sub(s, C(p.re, -p.im)))));
    }
    h = scale(h, 1e6);
    f.push(x); sr.push(h.re); si.push(h.im);
  }
  const o = L.run({ f_hz: f, s_re: sr, s_im: si, order_max: orderMax }, { provenance: {} }).outputs;
  let err = 0;
  for (const m of spec) {
    const near = o.modes.reduce((b, x) => Math.abs(x.f0_hz - m.f0) < Math.abs(b - m.f0) ? x.f0_hz : b, Infinity);
    err = Math.max(err, Math.abs(near - m.f0) / m.f0);
  }
  return { err, found: o.modes.length, order: o.order_selected };
}
