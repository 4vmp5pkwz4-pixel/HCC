#!/usr/bin/env node
/* ============================================================================
   A CONE DRAWN BEFORE THE ORBIT, AND THE ORBIT THAT STAYS ON IT

   Poincaré showed in 1896 that a charge in the field of a magnetic monopole has a conserved
   vector J = r x v - N r-hat, and that dotting it with r-hat gives a CONSTANT. So the orbit
   is pinned to a cone about J before a single step is taken — which is also the geodesic
   structure of Taub-NUT. The laboratory draws that cone first and then integrates into it.

   This file checks the claim by routes that share no code with the kernels:

     - the conserved vector is recomputed from a cross product written here;
     - the cone identity is checked at every sampled step of a long integration, and its
       worst departure is reported rather than its final one;
     - the energy is checked SEPARATELY, because the gravitomagnetic force is perpendicular
       to the velocity and therefore does no work — a claim that can fail;
     - the integrator's order is measured by halving the step, not declared;
     - at zero NUT charge the cone must open to exactly a plane, and the motion must reduce
       to Kepler with a conserved Laplace-Runge-Lenz vector, which is checked;
     - and the Berger squash is checked at both ends, where this laboratory had it backwards.

   Run: node docs/verify-taub-nut-cone.cjs
   ========================================================================= */

let pass = 0, fail = 0;
const ok = (t, c, d) => { c ? pass++ : fail++;
  console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); };

(async () => {
const { pathToFileURL } = require('node:url');
const { join } = require('node:path');
const X = await import(pathToFileURL(join(__dirname, '..', 'core/atlas/extracted.mjs')).href);

/* written here, sharing nothing with the atlas */
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const nrm = a => Math.hypot(a[0], a[1], a[2]);
const unit = a => { const n = nrm(a); return [a[0] / n, a[1] / n, a[2] / n]; };
const poincare = (p, v, N) => { const L = cross(p, v), u = unit(p);
  return [L[0] - N * u[0], L[1] - N * u[1], L[2] - N * u[2]]; };

console.log('\n1 · the conserved vector, and the cone it pins the orbit to\n');
{
  let worstDef = 0;
  for (const N of [0, 0.15, 0.6, 1.7, 4]) for (const v of [[0, 0.28, 0.52], [0, 0.9, -0.2], [0.1, 0.4, 0.4]]) {
    const p = [2.2, 0, 0];
    const a = X.tnPoincare(p, v, N), b = poincare(p, v, N);
    worstDef = Math.max(worstDef, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]));
    /* the identity itself: J . r-hat = -N, at the initial point, before anything is integrated */
    worstDef = Math.max(worstDef, Math.abs(dot(a, unit(p)) + N));
  }
  ok('J = r x v - N r-hat agrees with a cross product written here, and J . r-hat = -N holds at fifteen initial conditions across five NUT charges before a single step is taken',
    worstDef < 1e-15, `worst departure ${worstDef.toExponential(2)}`);

  /* THE POINT OF THE LABORATORY: the orbit stays on the cone that was drawn first. */
  const N = 0.6, p0 = [2.2, 0, 0], v0 = [0, 0.28, 0.52];
  const J0 = poincare(p0, v0, N), E0 = 0.5 * dot(v0, v0) - 1 / nrm(p0);
  let P = p0.slice(), V = v0.slice(), cone = 0, drift = 0, ed = 0;
  for (let k = 0; k < 400; k++) {
    const r = X.tnRK4(P, V, N, 0.004, 40); P = r.p; V = r.v;
    const J = poincare(P, V, N);
    cone = Math.max(cone, Math.abs(dot(J, unit(P)) + N));
    drift = Math.max(drift, Math.hypot(J[0] - J0[0], J[1] - J0[1], J[2] - J0[2]) / nrm(J0));
    ed = Math.max(ed, Math.abs((0.5 * dot(V, V) - 1 / nrm(P)) - E0) / Math.abs(E0));
  }
  ok('and it STAYS on it: over sixteen thousand Runge-Kutta steps the worst departure of J . r-hat from -N is at the floating-point floor, while the vector J itself wanders only in the twelfth decimal',
    cone < 1e-14 && drift < 1e-10,
    `worst |J.r-hat + N| = ${cone.toExponential(2)} over the whole integration · worst |dJ|/|J| = ${drift.toExponential(2)} · the cone is drawn from the initial condition and the orbit is never told about it`);

  ok('the gravitomagnetic force is perpendicular to the velocity, so it does no work — checked as a separate quantity that could have failed, and did not',
    ed < 1e-11, `worst |dE/E| = ${ed.toExponential(2)} for E = v^2/2 - 1/r`);

  /* and the force really is perpendicular to v, which is why */
  let perp = 0;
  for (let k = 0; k < 50; k++) {
    const p = [1 + k * 0.07, 0.4 * Math.sin(k), 0.3 * Math.cos(2 * k)], v = [Math.sin(k * 1.3), Math.cos(k), 0.2 * k - 1];
    const a = X.tnAccPure(p, v, 0.6), a0 = X.tnAccPure(p, v, 0);
    const mag = [a[0] - a0[0], a[1] - a0[1], a[2] - a0[2]];
    perp = Math.max(perp, Math.abs(dot(mag, v)) / (nrm(mag) * nrm(v)));
  }
  ok('and the reason is checkable on its own: the gravitomagnetic part of the acceleration is orthogonal to the velocity at every one of fifty states, to the last bit',
    perp < 1e-15, `worst |cos| between the magnetic force and the velocity ${perp.toExponential(2)}`);
}

console.log('\n2 · the integrator, measured\n');
{
  const N = 0.6, p0 = [2.2, 0, 0], v0 = [0, 0.28, 0.52];
  const err = h => { const m = Math.round(4 / h), a = X.tnRK4(p0, v0, N, h, m), b = X.tnRK4(p0, v0, N, h / 2, 2 * m);
    return Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]); };
  const e = [0.04, 0.02, 0.01, 0.005].map(err);
  const orders = []; for (let i = 1; i < e.length; i++) orders.push(Math.log2(e[i - 1] / e[i]));
  ok('the trajectory the picture runs converges at FOURTH order, measured over three halvings of the step rather than claimed from the name of the method',
    orders.every(o => Math.abs(o - 4) < 0.05),
    `orders ${orders.map(o => o.toFixed(4)).join(', ')} · errors ${e.map(x => x.toExponential(1)).join(' -> ')}`);
}

console.log('\n3 · zero NUT charge, where the cone must open to a plane\n');
{
  const p0 = [2.2, 0, 0], v0 = [0, 0.28, 0.52];
  ok('at N = 0 the cone half-angle is exactly a right angle — the cone IS the plane through the centre, and the conserved vector is the ordinary angular momentum again',
    Math.abs(X.tnConeCos(p0, v0, 0)) < 1e-16 &&
    Math.abs(X.tnConeAngle(p0, v0, 0) - Math.PI / 2) < 1e-15 &&
    (() => { const J = X.tnPoincare(p0, v0, 0), L = cross(p0, v0);
      return Math.hypot(J[0] - L[0], J[1] - L[1], J[2] - L[2]) < 1e-15; })(),
    `cone cosine ${X.tnConeCos(p0, v0, 0).toExponential(1)} and half-angle ${X.tnConeAngle(p0, v0, 0).toFixed(15)} against pi/2 = ${(Math.PI / 2).toFixed(15)}`);

  /* and the motion is Kepler: the Laplace-Runge-Lenz vector is conserved, which it is NOT for N > 0 */
  const lrl = (p, v) => { const L = cross(p, v), c = cross(v, L), u = unit(p);
    return [c[0] - u[0], c[1] - u[1], c[2] - u[2]]; };
  const run = N => { let P = [2.2, 0, 0], V = [0, 0.28, 0.52];
    const A0 = lrl(P, V); let w = 0;
    for (let k = 0; k < 200; k++) { const r = X.tnRK4(P, V, N, 0.004, 40); P = r.p; V = r.v;
      const A = lrl(P, V); w = Math.max(w, Math.hypot(A[0] - A0[0], A[1] - A0[1], A[2] - A0[2])); }
    return w; };
  const k0 = run(0), k1 = run(0.6);
  ok('and the orbit is then a closed Kepler ellipse: the Laplace-Runge-Lenz vector holds still at N = 0 and is destroyed at N = 0.6 — the same integrator, the same initial condition, the extra term the only difference',
    k0 < 1e-10 && k1 > 0.1,
    `|dA| = ${k0.toExponential(2)} at N = 0 and ${k1.toFixed(4)} at N = 0.6 · a NUT charge takes the extra Kepler symmetry away and leaves the cone in its place`);
}

console.log('\n4 · the Berger squash, which this laboratory had backwards\n');
{
  const N = 0.6;
  const s = r => 2 * N / (r + 2 * N);             /* written here from the metric, not from the atlas */
  let w = 0;
  for (const r of [1e-9, 0.01, 0.3, 1, 3, 10, 1e6]) w = Math.max(w, Math.abs(X.tnSquashOf(r, N) - s(r)));
  ok('the squash of a fixed-r slice is s(r) = 2N/(r + 2N): ONE at the NUT, where the metric is smooth R^4 and the slices are round, and ZERO far away, where Taub-NUT is asymptotically LOCALLY flat and the Hopf circle keeps a fixed length while the base grows away from it',
    w < 1e-15 && Math.abs(X.tnSquashOf(1e-12, N) - 1) < 1e-11 && X.tnSquashOf(1e12, N) < 1e-11 &&
    X.tnSquashOf(1, N) > X.tnSquashOf(3, N) && X.tnSquashOf(3, N) > X.tnSquashOf(10, N),
    `s(0) = ${X.tnSquashOf(1e-12, N).toFixed(12)}, s(1) = ${X.tnSquashOf(1, N).toFixed(6)}, s(10) = ${X.tnSquashOf(10, N).toFixed(6)}, s(inf) = ${X.tnSquashOf(1e12, N).toExponential(1)} · ` +
    `the laboratory's own label said s goes to one FAR from the NUT and to zero at its core, which is the statement upside down · agreement with the metric formula ${w.toExponential(2)}`);

  ok('and V = 1 + 2N/r is what makes it so: r V is r + 2N exactly, so the squash is a ratio of the two lengths in the metric and not a fitted shape',
    [0.1, 1, 7, 100].every(r => Math.abs(r * X.tnV(r, N) - (r + 2 * N)) < 1e-13),
    `checked at four radii · V(1) = ${X.tnV(1, N).toFixed(6)} and 1 * V = ${(1 * X.tnV(1, N)).toFixed(6)} = 1 + 2N`);
}

console.log(`\n${fail === 0 ? '✔' : '✗'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
