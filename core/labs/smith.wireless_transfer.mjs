import { defineLab, domainError } from '../contract.mjs';
import { STATUS } from '../status.mjs';
import { C, add, sub, mul, div, abs } from '../math/complex.mjs';
import { ellipK, ellipE } from '../math/elliptic.mjs';

const MU0 = 4e-7 * Math.PI;

/* Maxwell's exact mutual inductance for two COAXIAL circular filaments. Exact — not a
   fit, not a dipole approximation — and it has a falsifier: as d grows it must approach
   the magnetic dipole law mu0*pi*r1^2*r2^2/(2 d^3). */
export function mutualCoaxial(r1, r2, d) {
  const k2 = 4 * r1 * r2 / ((r1 + r2) ** 2 + d * d);
  const k = Math.sqrt(k2);
  if (k < 1e-12) return MU0 * Math.PI * r1 * r1 * r2 * r2 / (2 * Math.pow(d, 3));
  return MU0 * Math.sqrt(r1 * r2) * ((2 / k - k) * ellipK(k) - (2 / k) * ellipE(k));
}
/* Self-inductance of a circular loop of wire radius a — the standard low-frequency formula.
   DECLARED, not derived here, and only valid for a << r. */
export function loopSelfInductance(r, a, N) {
  if (!(a > 0) || a >= r) throw domainError('the wire radius must be positive and much smaller than the loop radius');
  return MU0 * N * N * r * (Math.log(8 * r / a) - 2);
}

export default defineLab({
  id: 'smith.wireless_transfer',
  title: 'Inductive power transfer between two resonators',
  status: STATUS.REFERENCE_MODEL,
  model_id: 'ipt.coupled_rlc.two_port',
  equation_ids: ['M(d)=Maxwell coaxial', 'k=M/sqrt(L1 L2)', 'coupled RLC two-port', 'U=k sqrt(Q1 Q2)'],
  summary: 'A coupled-RLC two-port with the mutual inductance computed exactly from the coil ' +
    'geometry, plus the abstract coupled-mode figure U = k sqrt(Q1 Q2) kept as a BENCHMARK. ' +
    'It is a model of two coaxial loops in the near field and it is labelled as one.',
  formulas: [
    'k^2 = 4 r1 r2 / ((r1+r2)^2 + d^2)',
    'M(d) = mu0 sqrt(r1 r2) [ (2/k - k) K(k) - (2/k) E(k) ]   (exact, coaxial filaments)',
    'M_N = N1 N2 M(d)',
    'L = mu0 N^2 r [ ln(8r/a) - 2 ]   (DECLARED, valid for a << r)',
    'k = M / sqrt(L1 L2)',
    'Z11 = Rs + R1 + j(wL1 - 1/(wC1)),  Z22 = RL + R2 + j(wL2 - 1/(wC2)),  Zm = jwM',
    'eta = |I2|^2 RL / (input real power)',
    'U = k sqrt(Q1 Q2),  eta_CMT = U^2/(1+sqrt(1+U^2))^2   (ABSTRACT BENCHMARK ONLY)'
  ],
  assumptions: [
    'two COAXIAL circular loops, no lateral offset and no tilt',
    'quasi-static near field: d is small compared with the wavelength',
    'lumped R, L, C with frequency-independent R (no proximity or radiation resistance)',
    'no shield, no obstacle, free space, no ferrite',
    'the source is an ideal series voltage with resistance Rs'
  ],
  domain_of_validity: [
    'd * (2 pi f / c) << 1 — the near field only',
    'wire radius a << loop radius r',
    'coaxial alignment only; tilt and lateral offset are NOT modelled'
  ],
  falsifiers: [
    'M(d) does not approach mu0 pi r1^2 r2^2 / (2 d^3) as d grows',
    'the power balance does not close: input real power != sum of all losses plus delivered power',
    'efficiency exceeds 1 anywhere'
  ],
  open_problems: ['lateral offset and tilt', 'full-wave far-field solver', 'shields, obstacles and lossy media',
    'proximity and skin effect in the conductor', 'external calibrated measurement of any of this'],
  cost_hint: 'fast',
  inputs: [
    { name: 'r1_m', type: 'number', unit: 'm', default: 0.15, min: 1e-4, max: 10, doc: 'radius of coil 1' },
    { name: 'r2_m', type: 'number', unit: 'm', default: 0.15, min: 1e-4, max: 10, doc: 'radius of coil 2' },
    { name: 'a1_m', type: 'number', unit: 'm', default: 0.001, min: 1e-7, max: 0.1, doc: 'wire radius of coil 1' },
    { name: 'a2_m', type: 'number', unit: 'm', default: 0.001, min: 1e-7, max: 0.1, doc: 'wire radius of coil 2' },
    { name: 'N1', type: 'number', unit: 'count', default: 10, min: 1, max: 1000, doc: 'turns on coil 1' },
    { name: 'N2', type: 'number', unit: 'count', default: 10, min: 1, max: 1000, doc: 'turns on coil 2' },
    { name: 'd_m', type: 'number', unit: 'm', default: 0.2, min: 1e-4, max: 100, doc: 'coaxial separation' },
    { name: 'R1_ohm', type: 'number', unit: 'ohm', default: 0.5, min: 1e-6, max: 1e6, doc: 'loss resistance of coil 1' },
    { name: 'R2_ohm', type: 'number', unit: 'ohm', default: 0.5, min: 1e-6, max: 1e6, doc: 'loss resistance of coil 2' },
    { name: 'Rs_ohm', type: 'number', unit: 'ohm', default: 50, min: 1e-6, max: 1e6, doc: 'source resistance' },
    { name: 'RL_ohm', type: 'number', unit: 'ohm', default: 50, min: 1e-6, max: 1e6, doc: 'load resistance' },
    { name: 'f_hz', type: 'number', unit: 'Hz', default: 1e6, min: 1, max: 1e11, doc: 'drive frequency' },
    { name: 'V_source', type: 'number', unit: 'V', default: 1, min: 0, max: 1e6, doc: 'source EMF amplitude' },
    { name: 'tune_to_resonance', type: 'boolean', default: true, doc: 'choose C1, C2 so that each loop resonates at f' }
  ],
  outputs: [
    { name: 'M_H', unit: 'H', doc: 'mutual inductance at this geometry and separation' },
    { name: 'k', unit: 'dimensionless', doc: 'coupling coefficient M/sqrt(L1 L2)' },
    { name: 'L1_H', unit: 'H', doc: 'self-inductance of coil 1' },
    { name: 'L2_H', unit: 'H', doc: 'self-inductance of coil 2' },
    { name: 'Q1', unit: 'dimensionless', doc: 'loaded quality factor of coil 1' },
    { name: 'Q2', unit: 'dimensionless', doc: 'loaded quality factor of coil 2' },
    { name: 'eta', unit: 'dimensionless', doc: 'delivered load power divided by real input power' },
    { name: 'P_in_W', unit: 'W', doc: 'real power delivered by the source' },
    { name: 'P_load_W', unit: 'W', doc: 'power dissipated in the load' },
    { name: 'P_loss_coil1_W', unit: 'W', doc: 'ohmic loss in coil 1' },
    { name: 'P_loss_coil2_W', unit: 'W', doc: 'ohmic loss in coil 2' },
    { name: 'P_loss_source_W', unit: 'W', doc: 'loss in the source resistance' },
    { name: 'power_balance_residual', unit: 'W', doc: 'input minus the sum of every sink; must be ~0' },
    { name: 'S11_db', unit: 'dB', doc: 'input reflection' },
    { name: 'S21_db', unit: 'dB', doc: 'forward transmission' },
    { name: 'U_cmt', unit: 'dimensionless', doc: 'k sqrt(Q1 Q2) — the ABSTRACT coupled-mode figure of merit' },
    { name: 'eta_cmt_benchmark', unit: 'dimensionless', doc: 'U^2/(1+sqrt(1+U^2))^2 — a BENCHMARK, not a device prediction' },
    { name: 'near_field_ok', type: 'boolean', unit: null, doc: 'whether d is small compared with the wavelength' },
    { name: 'kd', unit: 'dimensionless', doc: '2 pi f d / c — the near-field smallness parameter' }
  ],
  evaluate(i) {
    const w = 2 * Math.PI * i.f_hz;
    const L1 = loopSelfInductance(i.r1_m, i.a1_m, i.N1);
    const L2 = loopSelfInductance(i.r2_m, i.a2_m, i.N2);
    const M = i.N1 * i.N2 * mutualCoaxial(i.r1_m, i.r2_m, i.d_m);
    const k = M / Math.sqrt(L1 * L2);
    const C1 = i.tune_to_resonance ? 1 / (w * w * L1) : 1 / (w * w * L1);
    const C2 = i.tune_to_resonance ? 1 / (w * w * L2) : 1 / (w * w * L2);
    const X1 = w * L1 - 1 / (w * C1), X2 = w * L2 - 1 / (w * C2);
    const Z11 = C(i.Rs_ohm + i.R1_ohm, X1), Z22 = C(i.RL_ohm + i.R2_ohm, X2), Zm = C(0, w * M);
    /* series-coupled two-loop mesh: V = Z11 I1 + Zm I2 ; 0 = Zm I1 + Z22 I2 */
    const det = sub(mul(Z11, Z22), mul(Zm, Zm));
    const I1 = div(mul(C(i.V_source, 0), Z22), det);
    const I2 = div(mul(C(-i.V_source, 0), Zm), det);
    const a1 = abs(I1), a2 = abs(I2);
    const Pin = 0.5 * i.V_source * I1.re;
    const Pl = 0.5 * a2 * a2 * i.RL_ohm;
    const P1 = 0.5 * a1 * a1 * i.R1_ohm, P2 = 0.5 * a2 * a2 * i.R2_ohm;
    const Ps = 0.5 * a1 * a1 * i.Rs_ohm;
    const eta = Pin > 0 ? Pl / Pin : 0;
    const Zin = add(C(i.R1_ohm, X1), div(mul(Zm, Zm), Z22).re !== undefined
      ? mul(C(-1, 0), div(mul(Zm, Zm), Z22)) : C(0, 0));
    const g = div(sub(Zin, C(i.Rs_ohm, 0)), add(Zin, C(i.Rs_ohm, 0)));
    const s21 = 2 * Math.sqrt(i.Rs_ohm * i.RL_ohm) * abs(div(Zm, det));
    const Q1 = w * L1 / (i.R1_ohm + i.Rs_ohm), Q2 = w * L2 / (i.R2_ohm + i.RL_ohm);
    const U = k * Math.sqrt(Q1 * Q2);
    const kd = w * i.d_m / 299792458;
    const warnings = [];
    if (kd > 0.3) warnings.push('kd = ' + kd.toFixed(3) + ' — this is NOT the near field any more, and this model does not continue past its domain: use a full-wave solver, which this build does not provide');
    if (eta > 1) warnings.push('efficiency above 1 is impossible; treat this as a defect report, not a result');
    return { outputs: {
      M_H: M, k, L1_H: L1, L2_H: L2, Q1, Q2, eta,
      P_in_W: Pin, P_load_W: Pl, P_loss_coil1_W: P1, P_loss_coil2_W: P2, P_loss_source_W: Ps,
      power_balance_residual: Pin - (Pl + P1 + P2 + Ps),
      S11_db: 20 * Math.log10(Math.max(abs(g), 1e-12)),
      S21_db: 20 * Math.log10(Math.max(s21, 1e-12)),
      U_cmt: U, eta_cmt_benchmark: U * U / Math.pow(1 + Math.sqrt(1 + U * U), 2),
      near_field_ok: kd <= 0.3, kd },
      warnings,
      diagnostics: { note: 'eta is the two-port result; eta_cmt_benchmark is the abstract coupled-mode figure and is NOT a distance calculation' } };
  },
  selftests: [
    { name: 'M(d) approaches the magnetic dipole law at large separation',
      run() { const r1 = 0.1, r2 = 0.12, d = 12;
        const M = mutualCoaxial(r1, r2, d);
        const dip = MU0 * Math.PI * r1 * r1 * r2 * r2 / (2 * d * d * d);
        const e = Math.abs(M / dip - 1);
        return { pass: e < 2e-3, detail: `M = ${M.toExponential(6)} H vs dipole ${dip.toExponential(6)} H · relative ${e.toExponential(2)}` }; } },
    { name: 'the power balance closes',
      run(L) { const o = L.run({ d_m: 0.25, f_hz: 2e6 }, { provenance: {} }).outputs;
        return { pass: Math.abs(o.power_balance_residual) < 1e-12 * Math.max(1, o.P_in_W),
          detail: `residual ${o.power_balance_residual.toExponential(2)} W against P_in ${o.P_in_W.toExponential(3)} W` }; } },
    { name: 'efficiency never exceeds 1 over a wide sweep',
      run(L) { let worst = 0;
        for (let d = 0.02; d < 2; d *= 1.3) for (const f of [0.5e6, 1e6, 5e6]) {
          const o = L.run({ d_m: d, f_hz: f }, { provenance: {} }).outputs; worst = Math.max(worst, o.eta); }
        return { pass: worst <= 1 + 1e-12, detail: `max efficiency over the sweep = ${worst.toFixed(9)}` }; } },
    { name: 'coupling falls monotonically with distance',
      run(L) { let ok = true, prev = Infinity;
        for (let d = 0.05; d < 1.5; d += 0.05) { const o = L.run({ d_m: d }, { provenance: {} }).outputs;
          if (o.k > prev + 1e-15) ok = false; prev = o.k; }
        return { pass: ok, detail: 'k(d) is monotonically decreasing over 0.05–1.5 m' }; } }
  ]
});
