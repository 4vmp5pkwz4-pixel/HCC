#!/usr/bin/env node
/* ============================================================================
   WHAT THE REDSHIFT KERNEL ACTUALLY IS, AND WHY THE FAR SIDE LOOKS LARGER

   The atlas has drawn K(chi) for many versions and called the whole thing an ansatz. Two
   thirds of it are not one. K is EXACTLY the surface-to-volume ratio of the causal ball on
   the round three-sphere, and EXACTLY the logarithmic derivative of that ball's volume
   measure — which is the reason the integral in the ansatz has a closed form at all. Only
   the exponent is a choice.

   Nothing below trusts the atlas's one-liners:

     - the ball volume and its boundary area are recomputed by INTEGRATING 4 pi sin^2 t from
       scratch, by Simpson's rule written here;
     - the logarithmic-derivative identity is checked by finite difference and by the exact
       statement dm/dchi = 2 sin^2 chi;
     - the flat limit is checked against the Euclidean ball ratio 3/r;
     - the two arcs are checked to sum to the great circle at two hundred separations;
     - and the antipodal focusing is checked where it lives: the geodesic sphere area, which
       vanishes there.

   Run: node docs/verify-s3-observational-geometry.cjs
   ========================================================================= */

let pass = 0, fail = 0;
const ok = (t, c, d) => { c ? pass++ : fail++;
  console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); };

(async () => {
const { pathToFileURL } = require('node:url');
const { join } = require('node:path');
const X = await import(pathToFileURL(join(__dirname, '..', 'core/atlas/extracted.mjs')).href);

/* Simpson's rule, written here, on the area of the geodesic sphere */
const simpson = (f, a, b, n) => { if (n % 2) n++; const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return s * h / 3; };

console.log('\n1 · the ball, its boundary, and the ratio between them\n');
{
  let wv = 0, wa = 0;
  for (const chi of [0.05, 0.4, 1, Math.PI / 2, 2.2, 3.0, Math.PI]) {
    const V = simpson(t => 4 * Math.PI * Math.sin(t) * Math.sin(t), 0, chi, 4000);
    wv = Math.max(wv, Math.abs(V - X.s3BallVolume(chi, 1)) / Math.max(1e-12, V));
    wa = Math.max(wa, Math.abs(X.s3SphereArea(chi, 1) - 4 * Math.PI * Math.sin(chi) ** 2));
  }
  ok('the volume of the causal ball is the INTEGRAL of its boundary area, which is what makes m(chi) = chi - sin chi cos chi the volume measure — checked at seven radii against a Simpson quadrature written here',
    wv < 1e-9 && wa < 1e-15,
    `worst relative volume disagreement ${wv.toExponential(2)} over seven radii out to the antipode`);

  ok('and the full ball is the WHOLE three-sphere: at chi = pi it has volume 2 pi^2, to the last bit',
    Math.abs(X.s3BallVolume(Math.PI, 1) - X.S3_UNIT_VOLUME) === 0 &&
    Math.abs(X.S3_UNIT_VOLUME - 2 * Math.PI * Math.PI) === 0,
    `2 pi^2 = ${X.S3_UNIT_VOLUME.toFixed(12)} and the ball at chi = pi gives ${X.s3BallVolume(Math.PI, 1).toFixed(12)} · exactly equal, not nearly`);

  /* THE IDENTITY THE LABORATORY NEVER STATED. */
  let wk = 0;
  for (let i = 1; i < 4000; i++) { const chi = i / 4000 * Math.PI * 0.9995;
    const K = X.S3kernel(chi), geom = X.s3SphereArea(chi, 1) / X.s3BallVolume(chi, 1);
    wk = Math.max(wk, Math.abs(K - geom)); }
  ok('K(chi) IS the surface-to-volume ratio of that ball — not an ansatz, an identity — at four thousand radii from the origin to the antipode',
    wk < 1e-12,
    `worst |K - area/volume| ${wk.toExponential(2)} · the laboratory called the whole kernel a Gradient Redshift Ansatz; two thirds of it is geometry`);

  /* and the reason the integral closes */
  let wd = 0, wm = 0;
  for (let i = 20; i < 3000; i++) { const chi = i / 3000 * Math.PI * 0.999, h = 1e-5;
    const fd = (Math.log(X.volMeasure(chi + h)) - Math.log(X.volMeasure(chi - h))) / (2 * h);
    wd = Math.max(wd, Math.abs(X.S3kernel(chi) - fd) / Math.abs(fd));
    const dm = (X.volMeasure(chi + h) - X.volMeasure(chi - h)) / (2 * h);
    wm = Math.max(wm, Math.abs(dm - 2 * Math.sin(chi) ** 2)); }
  /* the identity itself is algebraic and holds to the last bit; only the finite difference
     that CHECKS it has a tolerance, and near the origin ln m carries a 3/chi singularity
     that makes that difference worse rather than the identity weaker */
  let walg = 0;
  for (let i = 1; i < 4000; i++) { const chi = i / 4000 * Math.PI * 0.9995;
    walg = Math.max(walg, Math.abs(X.S3kernel(chi) - 2 * Math.sin(chi) ** 2 / X.volMeasure(chi))); }
  ok('and dm/dchi is exactly 2 sin^2(chi), so K is the LOGARITHMIC DERIVATIVE of the volume measure — which is why the integral of K is ln m in closed form and there is nothing left to integrate numerically',
    walg === 0 && wd < 1e-5 && wm < 1e-9,
    `K = 2 sin^2/m holds EXACTLY at four thousand radii (departure ${walg.toExponential(1)}) · dm/dchi against 2 sin^2 by finite difference ${wm.toExponential(2)} · and against the finite-difference logarithmic derivative ${wd.toExponential(2)}, which is the difference's own truncation near the origin where ln m carries a 3/chi singularity, and not a weakness in the identity`);
}

console.log('\n2 · the limits, all three exact\n');
{
  const r = [1e-3, 1e-4, 1e-5, 1e-6].map(c => X.S3kernel(c) * c / 3);
  ok('K goes to 3/chi at small radius, which is the Euclidean ball ratio 3/r recovered exactly — the flat limit is earned rather than assumed',
    r.every(x => Math.abs(x - 1) < 1e-6) && Math.abs(r[3] - 1) <= Math.abs(r[0] - 1) + 1e-12,
    `K chi/3 at chi = 1e-3, 1e-4, 1e-5, 1e-6: ${r.map(x => x.toFixed(9)).join(', ')} · and 3/r is what a Euclidean ball gives, since 4 pi r^2 over (4/3) pi r^3 is 3/r`);

  ok('K(pi/2) = 4/pi to the last bit, and K(pi) = 0 — the boundary of the causal ball has vanished, and with it the kernel',
    X.S3kernel(Math.PI / 2) - 4 / Math.PI === 0 && X.S3kernel(Math.PI) < 1e-30,
    `K(pi/2) = ${X.S3kernel(Math.PI / 2).toFixed(15)} against 4/pi = ${(4 / Math.PI).toFixed(15)}, difference exactly zero · K(pi) = ${X.S3kernel(Math.PI).toExponential(1)}`);
}

console.log('\n3 · the ansatz, kept separate from the geometry\n');
{
  const lin = [0.1, 0.25, 0.5, 0.75, 1].map(p => X.lnRedshift(1.0, 0.001, p) / p);
  const spread = Math.max(...lin) - Math.min(...lin);
  ok('the exponent p enters ln(1+z) EXACTLY linearly — five values, one number — so nothing in the geometry depends on the one quantity that is a modelling choice, and the two can be kept apart',
    spread === 0,
    `ln(1+z)/p at p = 0.1, 0.25, 0.5, 0.75, 1 is ${lin[0].toFixed(12)} at every one · spread ${spread.toExponential(1)}`);

  let mono = true, prev = -Infinity;
  for (let i = 1; i < 3000; i++) { const chi = 0.002 + i / 3000 * 3.13;
    const z = Math.exp(X.lnRedshift(chi, 0.001, 1 / 3)) - 1;
    if (z < prev) mono = false; prev = z; }
  ok('and z rises monotonically with distance across the whole sphere, which is the least a redshift ansatz has to do and is checked rather than presumed',
    mono, `three thousand samples from chi = 0.002 to the antipode, never decreasing`);
}

console.log('\n4 · two ways round, and the far side looking larger\n');
{
  let ws = 0;
  for (let i = 1; i < 200; i++) { const chi = i / 200 * Math.PI, R = 1.7;
    ws = Math.max(ws, Math.abs(X.s3ArcShort(chi, R) + X.s3ArcLong(chi, R) - 2 * Math.PI * R)); }
  ok('the two geodesics joining any two points have lengths summing to the whole great circle — at two hundred separations, exactly',
    ws < 1e-14, `worst departure from 2 pi R ${ws.toExponential(2)}`);

  ok('every geodesic leaving a point reconverges at the antipode, where the geodesic sphere has ZERO area — that vanishing is the caustic, and it is a property of the sphere and not of anything drawn on it',
    X.s3SphereArea(Math.PI, 3) < 1e-29 && X.s3SphereArea(1e-9, 3) < 1e-15 &&
    X.s3SphereArea(Math.PI / 2, 3) > 100,
    `area at chi = pi is ${X.s3SphereArea(Math.PI, 3).toExponential(1)} for R = 3, against ${X.s3SphereArea(Math.PI / 2, 3).toFixed(3)} at a quarter turn · it is not exactly zero for the same reason the dipole null is not: pi is not representable, so sin(pi) is 1.2e-16 and its square is what is left`);

  /* THE COUNTERINTUITIVE PART, AND IT IS EXACT. */
  const D = 0.01, sizes = [0.3, 0.9, Math.PI / 2, 2.2, 2.9].map(c => X.s3AngularSize(D, c, 1));
  const qt = X.s3AngularSize(D, Math.PI / 2, 1);
  ok('the angular-diameter distance R sin(chi) PEAKS at a quarter turn, so a source is at its smallest there and looks LARGER both nearer and farther — something at 2.9 radians subtends more than the same thing at a quarter turn, which is the sphere acting as a lens',
    Math.min(...sizes) === qt && sizes[4] > qt * 3 && sizes[0] > qt,
    `angular size at chi = 0.3, 0.9, pi/2, 2.2, 2.9: ${sizes.map(s => s.toExponential(3)).join(', ')} · the minimum is at the quarter turn and the far side is ${(sizes[4] / qt).toFixed(2)} times larger`);

  ok('and the magnification relative to that turning point is exactly 1/sin^2(chi), which is one there and diverges at both ends',
    Math.abs(X.s3Magnification(Math.PI / 2) - 1) < 1e-15 &&
    Math.abs(X.s3Magnification(Math.PI / 6) - 4) < 1e-14 &&
    X.s3Magnification(3.14) > 900,
    `1 at a quarter turn, ${X.s3Magnification(Math.PI / 6).toFixed(9)} at thirty degrees (exactly four), and ${X.s3Magnification(3.14).toFixed(0)} near the antipode`);

  ok('and the focusing is visible in the area itself: the geodesic sphere is always SMALLER than the Euclidean sphere of the same arc length, and equal only in the limit at the origin',
    (() => { let ok2 = true, w = 0;
      for (let i = 1; i < 500; i++) { const c = i / 500 * Math.PI;
        const ratio = X.s3SphereArea(c, 1) / (4 * Math.PI * c * c);
        if (ratio > 1) ok2 = false; w = Math.max(w, ratio); }
      return ok2 && Math.abs(X.s3SphereArea(1e-6, 1) / (4 * Math.PI * 1e-12) - 1) < 1e-10; })(),
    `the ratio sin^2(chi)/chi^2 never exceeds one and tends to it at the origin — curvature takes area away, everywhere except where there is none`);
}

console.log(`\n${fail === 0 ? '✔' : '✗'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
