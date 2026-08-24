/* ── MIXMASTER · A SYMPLECTIC INTEGRATOR ON THE MISNER HAMILTONIAN ────────────
   STATUS: MEASURED. Nothing here reads the atlas; the kernel is re-derived from the
   Hamiltonian and every claim the laboratory makes is checked against it independently.

   The companion verifier verify-bianchi-ix-c2.cjs integrates the SAME system in volume
   time with an adaptive Dormand-Prince method, which is the right tool there because that
   formulation projects onto the constraint surface. This is the opposite construction:
   Misner variables, a fixed step, and a composition that preserves the symplectic
   two-form exactly. The two are checked for the property each is built to have.

       H = ( -p_O^2 + p_+^2 + p_-^2 ) / 2 + e^{-4 Omega} W(b+, b-)
       W = e^{-8b+} - 4 e^{-2b+} cosh(2 sqrt3 b-) + 2 e^{4b+} (cosh(4 sqrt3 b-) - 1)

   Three things are asked, and none of them is "does it look right".

     1. W CARRIES THE TRIANGULAR SYMMETRY. The three structure constants of Bianchi IX are
        equal, so the wall potential must be invariant under rotation by 2*pi/3 in the
        (b+, b-) plane. This is the check that would catch a wrong potential no matter how
        plausible its algebra looked.
     2. THE COMPOSITION IS EIGHTH ORDER. Richardson against a much finer reference.
     3. THE HAMILTONIAN IS BOUNDED, NOT MERELY SMALL. A symplectic method does not drift;
        an accurate non-symplectic one does. Both are run and compared at the same step.

   And the singularity is reported rather than passed: Omega decreases, e^{-4 Omega} grows
   without bound and the mixmaster arrives in finite Misner time. */
'use strict';
let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log(`  ok   ${name}${detail ? ' · ' + detail : ''}`); }
  else { fail++; console.log(`  FAIL ${name}${detail ? ' · ' + detail : ''}`); }
};

const S3 = Math.sqrt(3);
const W  = (p, m) => Math.exp(-8*p) - 4*Math.exp(-2*p)*Math.cosh(2*S3*m)
                   + 2*Math.exp(4*p)*(Math.cosh(4*S3*m) - 1);
const Wp = (p, m) => -8*Math.exp(-8*p) + 8*Math.exp(-2*p)*Math.cosh(2*S3*m)
                   + 8*Math.exp(4*p)*(Math.cosh(4*S3*m) - 1);
const Wm = (p, m) => -8*S3*Math.exp(-2*p)*Math.sinh(2*S3*m)
                   + 8*S3*Math.exp(4*p)*Math.sinh(4*S3*m);
const H  = y => 0.5*(-y[3]*y[3] + y[4]*y[4] + y[5]*y[5]) + Math.exp(-4*y[0])*W(y[1], y[2]);

/* Yoshida 1990, solution A */
const w = [-0.161582374150097e1, -0.244699182370524e1, -0.716989419708120e-2,
            0.244002732616735e1,  0.157739928123617e0,  0.182020630970714e1,
            0.104242620869991e1];
const w0 = 1 - 2*w.reduce((a, b) => a + b, 0);
const SEQ = [w[6], w[5], w[4], w[3], w[2], w[1], w[0], w0, w[0], w[1], w[2], w[3], w[4], w[5], w[6]];
function leap(y, h) {
  const a = h/2;
  y[0] += a*(-y[3]); y[1] += a*y[4]; y[2] += a*y[5];
  const e = Math.exp(-4*y[0]);
  y[3] += h*(4*e*W(y[1], y[2])); y[4] -= h*(e*Wp(y[1], y[2])); y[5] -= h*(e*Wm(y[1], y[2]));
  y[0] += a*(-y[3]); y[1] += a*y[4]; y[2] += a*y[5];
}
const y8 = (y, h) => { for (let i = 0; i < 15; i++) leap(y, SEQ[i]*h); };
function rk4(y, h) {
  const f = x => { const e = Math.exp(-4*x[0]);
    return [-x[3], x[4], x[5], 4*e*W(x[1], x[2]), -e*Wp(x[1], x[2]), -e*Wm(x[1], x[2])]; };
  const a = f(y), b = f(y.map((v, i) => v + h/2*a[i])),
        c = f(y.map((v, i) => v + h/2*b[i])), d = f(y.map((v, i) => v + h*c[i]));
  for (let i = 0; i < 6; i++) y[i] += h/6*(a[i] + 2*b[i] + 2*c[i] + d[i]);
}
const IC = () => [-0.40, 0.18, 0.05, 0.90, 0.30, -0.20];

console.log('\nMIXMASTER · symplectic Misner evolution\n');

/* 1 · the potential is the standard one, affinely rescaled — stated and checked */
{
  const Vstd = (p, m) => (1/3)*Math.exp(-8*p) - (4/3)*Math.exp(-2*p)*Math.cosh(2*S3*m)
                       + 1 + (2/3)*Math.exp(4*p)*(Math.cosh(4*S3*m) - 1);
  let worst = 0;
  for (let i = 0; i < 300; i++) {
    const p = Math.sin(i*1.13)*0.8, m = Math.cos(i*0.71)*0.8;
    worst = Math.max(worst, Math.abs(W(p, m) - 3*(Vstd(p, m) - 1)) / Math.max(1, Math.abs(W(p, m))));
  }
  ok('the wall potential is the Misner potential, affinely rescaled: W = 3 (V_Misner - 1)',
    worst < 1e-13, `worst relative departure ${worst.toExponential(1)} over 300 points`);
}

/* 2 · and it carries the triangular symmetry, which is the check that matters */
{
  const th = 2*Math.PI/3, c = Math.cos(th), s = Math.sin(th);
  let worst = 0;
  for (let i = 0; i < 400; i++) {
    const p = Math.sin(i*1.7)*0.9, m = Math.cos(i*2.3)*0.9;
    const a = W(p, m);
    for (const k of [1, 2]) {
      const t = k*th, cc = Math.cos(t), ss = Math.sin(t);
      worst = Math.max(worst, Math.abs(a - W(p*cc - m*ss, p*ss + m*cc)) / Math.max(1, Math.abs(a)));
    }
  }
  ok('W is invariant under 2*pi/3 in the (b+, b-) plane — the three equal structure constants of Bianchi IX',
    worst < 1e-12, `worst relative departure ${worst.toExponential(1)} over 400 points, both rotations`);
}

/* 3 · eighth order, by Richardson */
{
  const T = 0.25;
  const ref = IC().slice(); for (let i = 0; i < 32768; i++) y8(ref, T/32768);
  const err = N => { const y = IC().slice(); for (let i = 0; i < N; i++) y8(y, T/N);
    let e = 0; for (let k = 0; k < 6; k++) e = Math.max(e, Math.abs(y[k] - ref[k])); return e; };
  const e1 = err(64), e2 = err(128), order = Math.log2(e1/e2);
  ok('the composition converges at eighth order', order > 7.5 && order < 8.5,
    `err(64) = ${e1.toExponential(2)}, err(128) = ${e2.toExponential(2)}, measured order ${order.toFixed(2)}`);
}

/* 4 · bounded, not merely small — and that is what symplectic buys */
{
  const run = (step, tau, h) => { const y = IC().slice(), H0 = H(y); let mx = 0;
    const n = Math.round(tau/h);
    for (let i = 0; i < n; i++) { step(y, h); const d = Math.abs(H(y) - H0);
      if (Number.isFinite(d)) mx = Math.max(mx, d); }
    return mx; };
  const s10 = run(y8, 10, 5e-4), s60 = run(y8, 60, 5e-4), r10 = run(rk4, 10, 5e-4);
  ok('the Hamiltonian is BOUNDED: the bound at tau = 60 is the bound at tau = 10',
    Math.abs(s60 - s10) / s10 < 1e-6,
    `|dH| <= ${s10.toExponential(2)} at tau = 10 and ${s60.toExponential(2)} at tau = 60`);
  ok('and a non-symplectic method of the same step does far worse on the same trajectory',
    r10 > 100*s10, `RK4 reaches ${r10.toExponential(2)} against ${s10.toExponential(2)} — ${(r10/s10).toFixed(0)}x`);
}

/* 5 · the singularity is reached in finite Misner time and is a fact, not a failure */
{
  const y = IC().slice(), h = 1e-3; let tau = 0, hit = null;
  for (let i = 0; i < 200000; i++) { y8(y, h); tau += h;
    if (!Number.isFinite(y[0]) || y[0] < -30) { hit = tau; break; } }
  ok('the default data reach the singularity in finite Misner time', hit !== null && hit > 50 && hit < 90,
    hit === null ? 'no singularity inside tau = 200' : `tau_singular = ${hit.toFixed(2)}`);
}

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
