import { defineLab, domainError } from '../contract.mjs';
import { STATUS } from '../status.mjs';

const PI = Math.PI;

export function curlBandCount(K) {
  if (!Number.isInteger(K) || K < 0) throw domainError('K must be a non-negative integer', { K });
  return (K + 1) * (K + 2) * (2 * K + 9) / 3;
}

export function minCurlLevelForRank(requiredModes) {
  if (!(requiredModes > 0) || !Number.isFinite(requiredModes))
    throw domainError('requiredModes must be finite and positive', { requiredModes });
  if (requiredModes <= curlBandCount(0)) return 0;
  let lo = 0, hi = 1;
  while (curlBandCount(hi) < requiredModes) {
    hi *= 2;
    if (hi > 100000) throw domainError('required mode count exceeds this kernel\'s safe exact-integer range', { requiredModes });
  }
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (curlBandCount(mid) >= requiredModes) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

export default defineLab({
  id: 's3.spectral_reconstruction_bound',
  title: 'Round-S3 finite-band reconstruction barrier',
  status: STATUS.EXACT,
  model_id: 's3.curl_band.reconstruction_bound',
  equation_ids: [
    's3.curl_spectrum', 's3.curl_band_rank', 's3.projector_l1_linf',
    's3.effective_volume', 's3.slepian_trace', 's3.helicity_band_bound'
  ],
  summary: 'Exact theorem-level bounds for the canonical curl low-pass projector on a round S3. ' +
    'The kernel is independent of any Navier-Stokes blowup claim: it converts a declared L1/Linf ' +
    'concentration scale, and optionally a declared support volume, into necessary finite-band mode counts.',
  formulas: [
    'Vol(S3_R) = 2 pi^2 R^3',
    'curl eigenvalues = +/- (k+2)/R, multiplicity per sign = (k+1)(k+3)',
    'N_K = (K+1)(K+2)(2K+9)/3',
    '||Pi_K||_(L1->Linf) = N_K / [3 Vol(S3_R)]',
    'V_eff = ||v||_1 / ||v||_infinity',
    '||Pi_K v||_infinity / ||v||_infinity <= min(1, N_K V_eff / [3 Vol])',
    'Tr(Pi_K 1_Omega Pi_K) = N_K Vol(Omega)/Vol(S3_R)',
    '||Pi_K v||_2^2 / ||v||_2^2 <= min(1, N_K Vol(Omega)/Vol(S3_R)) for supp(v) subset Omega',
    '|<Pi_K v, curl Pi_K v>| <= [(K+2)/R] [N_K/(3 Vol)] ||v||_1^2'
  ],
  assumptions: [
    'the metric is the round metric on S3_R',
    'Pi_K is the L2-orthogonal projector onto BOTH curl helicities for levels 0 through K',
    'the peak bound uses only the declared L1 and Linf norms; it is a necessary bound, not a reconstruction algorithm',
    'the support-energy bound applies only when support_volume is supplied as an actual support-region volume'
  ],
  domain_of_validity: [
    'R > 0',
    '0 <= K <= 100000 and K integer',
    '0 < eta <= 1',
    'l1_norm > 0 and linf_norm > 0',
    'if supplied, 0 < support_volume <= Vol(S3_R)'
  ],
  falsifiers: [
    'the cumulative curl multiplicity differs from twice sum_(k=0)^K (k+1)(k+3)',
    'the K=0 projector constant differs from 1/(pi^2 R^3)',
    'the minimum returned K fails to bracket the required mode count',
    'the Slepian trace differs from N_K times the declared support-volume fraction'
  ],
  verifiers: ['docs/verify-s3-spectral-reconstruction-bound.cjs'],
  cost_hint: 'fast',
  strict_inputs: true,
  inputs: [
    { name: 'R', type: 'number', unit: 'length', default: 1, min: 1e-12, max: 1e12,
      doc: 'radius of the round three-sphere in any consistent length unit' },
    { name: 'K', type: 'number', unit: 'curl level', default: 5, min: 0, max: 100000,
      doc: 'largest retained curl level; MUST be an integer' },
    { name: 'l1_norm', type: 'number', unit: 'field*length^3', default: 1e-3, min: 1e-300, max: 1e300,
      doc: 'L1 norm of the vector field' },
    { name: 'linf_norm', type: 'number', unit: 'field', default: 1, min: 1e-300, max: 1e300,
      doc: 'L-infinity norm of the vector field' },
    { name: 'eta', type: 'number', unit: 'fraction', default: 0.5, min: 1e-12, max: 1,
      doc: 'requested fraction of peak or L2 norm to be retained by the canonical low-pass component' },
    { name: 'support_volume', type: 'number', unit: 'length^3', optional: true, min: 1e-300, max: 1e300,
      doc: 'optional actual volume of a measurable region containing the support of the field' }
  ],
  outputs: [
    { name: 'sphere_volume', unit: 'length^3', doc: '2 pi^2 R^3' },
    { name: 'mode_count', unit: 'modes', doc: 'exact N_K, both curl helicities included' },
    { name: 'projector_l1_linf_norm', unit: 'length^-3', doc: 'exact canonical projector norm N_K/(3 Vol)' },
    { name: 'effective_volume', unit: 'length^3', doc: 'l1_norm/linf_norm' },
    { name: 'peak_abs_upper_bound', unit: 'field', doc: 'upper bound for ||Pi_K v||_infinity' },
    { name: 'peak_fraction_upper_bound', unit: 'fraction', doc: 'upper bound for ||Pi_K v||_infinity/||v||_infinity' },
    { name: 'required_modes_for_peak_fraction', unit: 'modes', doc: 'necessary rank to retain the requested peak fraction eta' },
    { name: 'minimum_K_for_peak_fraction', unit: 'curl level', doc: 'smallest K whose cumulative rank reaches the necessary peak rank' },
    { name: 'max_curl_in_band', unit: 'length^-1', doc: '(K+2)/R' },
    { name: 'truncated_helicity_abs_upper_bound', unit: 'field^2*length^2', doc: 'finite-band helicity absolute upper bound' },
    { name: 'energy_concentration', type: 'object', unit: null, doc: 'Slepian trace/energy bound when support_volume is supplied' }
  ],
  evaluate(i) {
    if (!Number.isInteger(i.K)) throw domainError('K must be an integer; inputs are refused, never rounded', { K: i.K });
    const V = 2 * PI * PI * i.R ** 3;
    if (i.support_volume !== undefined && i.support_volume > V)
      throw domainError('support_volume cannot exceed the sphere volume', { support_volume: i.support_volume, sphere_volume: V });

    const NK = curlBandCount(i.K);
    if (!Number.isSafeInteger(NK)) throw domainError('N_K left the exact JavaScript integer range', { K: i.K, N_K: NK });
    const cK = NK / (3 * V);
    const Veff = i.l1_norm / i.linf_norm;
    const peakAbs = cK * i.l1_norm;
    const peakFrac = Math.min(1, cK * Veff);
    const reqPeakRaw = 3 * i.eta * V / Veff;
    if (!Number.isFinite(reqPeakRaw) || reqPeakRaw > Number.MAX_SAFE_INTEGER)
      throw domainError('necessary peak rank exceeds the exact integer range of this kernel', { required_modes: reqPeakRaw });
    const reqPeak = Math.max(1, Math.ceil(reqPeakRaw));
    const kPeak = minCurlLevelForRank(reqPeak);
    const maxCurl = (i.K + 2) / i.R;
    const hel = maxCurl * cK * i.l1_norm * i.l1_norm;

    let energy = { available: false, reason: 'support_volume not supplied' };
    if (i.support_volume !== undefined) {
      const fraction = i.support_volume / V;
      const trace = NK * fraction;
      const energySq = Math.min(1, trace);
      const reqEnergyRaw = i.eta * i.eta / fraction;
      if (!Number.isFinite(reqEnergyRaw) || reqEnergyRaw > Number.MAX_SAFE_INTEGER)
        throw domainError('necessary energy rank exceeds the exact integer range of this kernel', { required_modes: reqEnergyRaw });
      const reqEnergy = Math.max(1, Math.ceil(reqEnergyRaw));
      energy = {
        available: true,
        support_fraction: fraction,
        concentration_trace: trace,
        l2_energy_fraction_upper_bound: energySq,
        l2_norm_fraction_upper_bound: Math.sqrt(energySq),
        required_modes_for_l2_norm_fraction: reqEnergy,
        minimum_K_for_l2_norm_fraction: minCurlLevelForRank(reqEnergy)
      };
    }

    return {
      outputs: {
        sphere_volume: V,
        mode_count: NK,
        projector_l1_linf_norm: cK,
        effective_volume: Veff,
        peak_abs_upper_bound: peakAbs,
        peak_fraction_upper_bound: peakFrac,
        required_modes_for_peak_fraction: reqPeak,
        minimum_K_for_peak_fraction: kPeak,
        max_curl_in_band: maxCurl,
        truncated_helicity_abs_upper_bound: hel,
        energy_concentration: energy
      },
      diagnostics: {
        projector: 'orthogonal curl low-pass, both helicities',
        exactness: 'round-S3 homogeneity + tangent isotropy; no PDE input',
        interpretation: 'necessary finite-band bounds only; not sufficiency and not arbitrary nonlinear inference'
      },
      warnings: [
        'This theorem does NOT establish that any Navier-Stokes solution blows up.',
        'A finite-band bound is not an entropy law, a noise model, or a claim that information is destroyed.',
        'Do not identify numerical equality of a mode count with an unrelated HCC/FBS3R rung or capacity index.'
      ]
    };
  },
  selftests: [
    { name: 'cumulative multiplicity agrees with the signed curl-level sum through K=1000',
      run() { let bad = null;
        for (let K = 0; K <= 1000; K++) {
          let s = 0; for (let k = 0; k <= K; k++) s += 2 * (k + 1) * (k + 3);
          if (curlBandCount(K) !== s) { bad = `K=${K}: ${curlBandCount(K)} != ${s}`; break; }
        }
        return { pass: !bad, detail: bad || 'N_K = 2 sum (k+1)(k+3) for K=0..1000' }; } },
    { name: 'first six ranks are the exact regression sequence 6,22,52,100,170,266',
      run() { const got = Array.from({ length: 6 }, (_, K) => curlBandCount(K));
        return { pass: got.join(',') === '6,22,52,100,170,266', detail: got.join(', ') }; } },
    { name: 'the Hopf/anti-Hopf projector constant is exactly 1/(pi^2 R^3)',
      run(L) { const R = 3.7, o = L.run({ R, K: 0, l1_norm: 1, linf_norm: 1, eta: 0.5 }, { provenance: {} }).outputs;
        const want = 1 / (PI * PI * R ** 3), rel = Math.abs(o.projector_l1_linf_norm - want) / want;
        return { pass: rel < 2e-15, detail: `relative residual ${rel.toExponential(2)}` }; } },
    { name: 'minimum K brackets every requested rank in a deterministic sweep',
      run() { let bad = null;
        for (const req of [1,6,7,22,23,52,53,266,267,10000,1000000]) {
          const K = minCurlLevelForRank(req);
          if (curlBandCount(K) < req || (K > 0 && curlBandCount(K - 1) >= req)) { bad = `req=${req}, K=${K}`; break; }
        }
        return { pass: !bad, detail: bad || 'all rank brackets exact' }; } },
    { name: 'Slepian trace is N_K times support fraction and the norm bound never exceeds one',
      run(L) { const R = 2, V = 2 * PI * PI * R ** 3, frac = 1e-4;
        const o = L.run({ R, K: 5, l1_norm: 0.01, linf_norm: 2, eta: 0.7, support_volume: frac * V }, { provenance: {} }).outputs;
        const want = curlBandCount(5) * frac, got = o.energy_concentration.concentration_trace;
        return { pass: Math.abs(got - want) < 1e-14 && o.energy_concentration.l2_energy_fraction_upper_bound <= 1,
          detail: `trace ${got.toFixed(12)} = N_5*${frac}` }; } }
  ]
});