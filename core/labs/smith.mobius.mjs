import { defineLab } from '../contract.mjs';
import { STATUS } from '../status.mjs';
import { C, mul, div, add, sub, abs, conj } from '../math/complex.mjs';

export default defineLab({
  id: 'smith.mobius',
  title: 'Smith–Möbius — one SU(2) rotation of the Riemann sphere',
  status: STATUS.EXACT,
  model_id: 'mobius.su2.rotation',
  equation_ids: ['mobius.forward', 'mobius.inverse', 'riemann.stereographic', 'cross_ratio', 'passivity'],
  summary: 'The Smith chart is a rigid rotation of the Riemann sphere, not a deformation. ' +
    'Both routes — the Möbius map in the plane and the rotation on the sphere — are computed ' +
    'independently and their disagreement is returned as a residual.',
  formulas: [
    'M(theta) = [[cos(theta/2), -sin(theta/2)],[sin(theta/2), cos(theta/2)]] in SU(2)',
    'w(z) = (cos(theta/2) z - sin(theta/2)) / (sin(theta/2) z + cos(theta/2))',
    'S(z) = (2 Re z, 2 Im z, |z|^2 - 1)/(1 + |z|^2)',
    'cross-ratio (z1,z2;z3,z4) is invariant under every Mobius map',
    'Gamma = (z - 1)/(z + 1) for the normalised impedance z = Z/Z0'
  ],
  assumptions: ['lossless reference plane', 'Z0 real and positive', 'single-frequency snapshot'],
  domain_of_validity: ['all z on the Riemann sphere including the point at infinity'],
  falsifiers: ['the two routes disagree beyond 1e-12 in the chordal metric',
               'the cross-ratio changes under the map',
               'a passive z (Re z >= 0) maps to |Gamma| > 1'],
  verifiers: ['docs/verify-smith-mobius-unrolling.cjs (14/14)', 'docs/verify-hopf-splitting.cjs (7/7)'],
  cost_hint: 'fast',
  inputs: [
    { name: 'z_re', type: 'number', unit: 'dimensionless', default: 0.5, min: -1e6, max: 1e6, doc: 'real part of z = Z/Z0' },
    { name: 'z_im', type: 'number', unit: 'dimensionless', default: 0.6, min: -1e6, max: 1e6, doc: 'imaginary part of z = Z/Z0' },
    { name: 'theta', type: 'number', unit: 'rad', default: Math.PI / 2, min: -6.283185307179586, max: 6.283185307179586,
      doc: 'rotation angle of the Riemann sphere about the y axis' }
  ],
  outputs: [
    { name: 'w_re', unit: 'dimensionless', doc: 'real part of the rotated point, plane route' },
    { name: 'w_im', unit: 'dimensionless', doc: 'imaginary part of the rotated point, plane route' },
    { name: 'w_sphere_re', unit: 'dimensionless', doc: 'real part via the sphere route' },
    { name: 'w_sphere_im', unit: 'dimensionless', doc: 'imaginary part via the sphere route' },
    { name: 'route_disagreement', unit: 'dimensionless', doc: 'chordal distance between the two routes; 0 iff the map is a rigid rotation' },
    { name: 'gamma_re', unit: 'dimensionless', doc: 'reflection coefficient, real part' },
    { name: 'gamma_im', unit: 'dimensionless', doc: 'reflection coefficient, imaginary part' },
    { name: 'gamma_abs', unit: 'dimensionless', doc: '|Gamma|; <= 1 exactly when the load is passive' },
    { name: 'passive', type: 'boolean', unit: null, doc: 'whether Re z >= 0' },
    { name: 'unitarity_residual', unit: 'dimensionless', doc: '|det M - 1|, the SU(2) condition' },
    { name: 'cross_ratio_residual', unit: 'dimensionless', doc: 'change in a test cross-ratio under the map' },
    { name: 'conformality_residual', unit: 'dimensionless', doc: 'departure from angle preservation, measured on a small triad' }
  ],
  evaluate(i) {
    const z = C(i.z_re, i.z_im), t = i.theta, c = Math.cos(t / 2), s = Math.sin(t / 2);
    const map = q => div(sub(mul(C(c, 0), q), C(s, 0)), add(mul(C(s, 0), q), C(c, 0)));
    const w = map(z);
    /* independent route: to the sphere, rotate about y, back */
    const d = 1 + z.re * z.re + z.im * z.im;
    const X = 2 * z.re / d, Y = 2 * z.im / d, Z = (z.re * z.re + z.im * z.im - 1) / d;
    const ct = Math.cos(t), st = Math.sin(t);
    const Xr = ct * X + st * Z, Yr = Y, Zr = -st * X + ct * Z;
    const ws = C(Xr / (1 - Zr), Yr / (1 - Zr));
    const chord = (a, b) => 2 * abs(sub(a, b)) / Math.sqrt((1 + abs(a) ** 2) * (1 + abs(b) ** 2));
    const gamma = div(sub(z, C(1, 0)), add(z, C(1, 0)));
    /* cross-ratio invariance, on four points that avoid the poles */
    const P = [C(0.3, 0.1), C(-0.7, 0.4), C(1.1, -0.2), C(0.05, -0.9)];
    const cr = q => div(mul(sub(q[0], q[2]), sub(q[1], q[3])), mul(sub(q[1], q[2]), sub(q[0], q[3])));
    const crRes = abs(sub(cr(P), cr(P.map(map))));
    /* conformality: two short vectors at z keep their angle after the map */
    const h = 1e-6, u = map(add(z, C(h, 0))), v = map(add(z, C(0, h)));
    const du = sub(u, w), dv = sub(v, w);
    const ang = Math.abs(Math.atan2(dv.im, dv.re) - Math.atan2(du.im, du.re));
    const confRes = Math.abs(((ang + Math.PI) % (2 * Math.PI)) - Math.PI - Math.PI / 2) < 1e-3
      ? Math.abs(Math.abs(ang) - Math.PI / 2) : Math.abs(Math.abs(ang) - Math.PI / 2);
    const det = c * c + s * s;
    return { outputs: {
      w_re: w.re, w_im: w.im, w_sphere_re: ws.re, w_sphere_im: ws.im,
      route_disagreement: chord(w, ws),
      gamma_re: gamma.re, gamma_im: gamma.im, gamma_abs: abs(gamma),
      passive: i.z_re >= 0,
      unitarity_residual: Math.abs(det - 1),
      cross_ratio_residual: crRes,
      conformality_residual: confRes },
      diagnostics: { route: 'plane and sphere computed independently, then compared' } };
  },
  selftests: [
    { name: 'the two routes agree to 1e-12 for a generic point',
      run(L) { const r = L.run({ z_re: 0.37, z_im: -0.81, theta: 1.1 }, { provenance: {} });
        return { pass: r.outputs.route_disagreement < 1e-12, detail: `disagreement ${r.outputs.route_disagreement.toExponential(2)}` }; } },
    { name: 'a passive load never leaves the unit disc',
      run(L) { let worst = 0;
        for (let a = 0; a < 40; a++) for (let b = -20; b <= 20; b++) {
          const r = L.run({ z_re: a * 0.25, z_im: b * 0.25, theta: 0 }, { provenance: {} });
          worst = Math.max(worst, r.outputs.gamma_abs); }
        return { pass: worst <= 1 + 1e-12, detail: `max |Gamma| over the passive half-plane = ${worst.toFixed(12)}` }; } },
    { name: 'the cross-ratio is invariant',
      run(L) { const r = L.run({ z_re: 0.5, z_im: 0.6, theta: 2.0 }, { provenance: {} });
        return { pass: r.outputs.cross_ratio_residual < 1e-12, detail: `residual ${r.outputs.cross_ratio_residual.toExponential(2)}` }; } }
  ]
});
