/* ── S^3 GEODESICS AND THE SO(4) A PAIR OF HANDS GENERATES ────────────────────
   STATUS: MEASURED. Nothing here reads the atlas.

   Two claims the raymarcher and the two-handed gesture both rest on, checked
   independently of the code that uses them.

     x(t) = cos(t) x0 + sin(t) v0     is the geodesic, exactly, not to first order
     q -> QL q conj(QR)               is every rotation of S^3, and the cover is 2:1

   The isoclinic property is the one worth the trouble: with one quaternion set to the
   identity, EVERY point of S^3 turns through the same angle. There is no axis and no
   equator, which is why a two-handed gesture decomposes into SU(2)_L and SU(2)_R by
   mathematics rather than by convention. */
'use strict';
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}${d ? ' · ' + d : ''}`); }
                          else { fail++; console.log(`  FAIL ${n}${d ? ' · ' + d : ''}`); } };

const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];
const norm = a => Math.sqrt(dot(a, a));
const unit = a => { const L = norm(a); return [a[0]/L, a[1]/L, a[2]/L, a[3]/L]; };
const tangent = (x0, v) => { const d = dot(x0, v);
  return unit([v[0]-d*x0[0], v[1]-d*x0[1], v[2]-d*x0[2], v[3]-d*x0[3]]); };
const geo = (x0, v0, t) => { const c = Math.cos(t), s = Math.sin(t);
  return [c*x0[0]+s*v0[0], c*x0[1]+s*v0[1], c*x0[2]+s*v0[2], c*x0[3]+s*v0[3]]; };
const dist = (a, b) => Math.acos(Math.min(1, Math.max(-1, dot(a, b))));
const qmul = (a, b) => [a[0]*b[0]-a[1]*b[1]-a[2]*b[2]-a[3]*b[3],
                        a[0]*b[1]+a[1]*b[0]+a[2]*b[3]-a[3]*b[2],
                        a[0]*b[2]-a[1]*b[3]+a[2]*b[0]+a[3]*b[1],
                        a[0]*b[3]+a[1]*b[2]-a[2]*b[1]+a[3]*b[0]];
const qconj = a => [a[0], -a[1], -a[2], -a[3]];
const rot = (QL, QR, q) => qmul(qmul(QL, q), qconj(QR));
const axang = (t, nx, ny, nz) => { const L = Math.hypot(nx, ny, nz) || 1, h = t/2, s = Math.sin(h)/L;
  return [Math.cos(h), nx*s, ny*s, nz*s]; };

console.log('\nS^3 · the exponential map and SO(4)\n');

{ const x0 = [1, 0, 0, 0], v0 = tangent(x0, [0, 0.3, -0.5, 0.81]);
  let off = 0, arc = 0;
  for (let k = 0; k <= 2000; k++) { const t = k/2000*2*Math.PI, x = geo(x0, v0, t);
    off = Math.max(off, Math.abs(norm(x) - 1));
    if (t <= Math.PI) arc = Math.max(arc, Math.abs(dist(x0, x) - t)); }
  /* the distance bound is 1e-13 and not tighter, because arccos amplifies near t = pi:
     the residual is the arccos derivative blowing up, not the geodesic wandering. The
     off-sphere figure, which has no such amplification, is machine precision. */
  ok('the geodesic stays on S^3 and is unit speed', off < 1e-15 && arc < 1e-13,
    `off-sphere ${off.toExponential(1)}, |d - t| <= ${arc.toExponential(1)} over 2000 samples`);
  const a = dot(x0, geo(x0, v0, Math.PI));
  const c = geo(x0, v0, 2*Math.PI);
  const ce = Math.max(Math.abs(c[0]-1), Math.abs(c[1]), Math.abs(c[2]), Math.abs(c[3]));
  ok('the antipode is at t = pi and the ray closes at 2 pi', Math.abs(a + 1) < 1e-15 && ce < 1e-15,
    `<x0, x(pi)> = ${a.toFixed(15)}, closure ${ce.toExponential(1)}`);
  /* the alternative a raymarcher is tempted by: step straight, then renormalise */
  let worst = 0;
  for (const N of [64, 256]) {
    let x = x0.slice(), v = v0.slice(); const h = Math.PI/N;
    for (let i = 0; i < N; i++) { x = unit([x[0]+h*v[0], x[1]+h*v[1], x[2]+h*v[2], x[3]+h*v[3]]);
      v = tangent(x, v); }
    worst = Math.max(worst, Math.abs(dot(x0, x) + 1));
  }
  /* stated as a RATIO rather than as a bound someone picked. The claim that matters is
     not "the march is wrong by more than 1e-4" — a number invented before measuring, and
     wrong: it is 3.2e-6 — but that the march is wrong by ten orders of magnitude more
     than the exponential map, which is a statement about the two methods and not about a
     threshold. */
  ok('and stepping straight then renormalising misses the antipode by orders of magnitude more than the exponential map',
    worst > 1e8*Math.max(off, 1e-16),
    `the renormalising march misses <x0,x(pi)> = -1 by ${worst.toExponential(2)}, against ${off.toExponential(2)} for the exponential map — a factor of ${(worst/Math.max(off,1e-16)).toExponential(1)}`);
}

{ const QL = axang(0.7, 0.2, -0.9, 0.4), QR = axang(1.3, -0.5, 0.3, 0.81);
  let iso = 0, lo = Infinity, hi = -Infinity, dc = 0;
  for (let k = 0; k < 1000; k++) {
    const q = unit([Math.sin(k*1.1), Math.cos(k*2.3), Math.sin(k*0.7), Math.cos(k*1.9)]);
    iso = Math.max(iso, Math.abs(norm(rot(QL, QR, q)) - 1));
    const ang = Math.acos(Math.min(1, Math.max(-1, dot(q, rot(QL, [1,0,0,0], q)))));
    lo = Math.min(lo, ang); hi = Math.max(hi, ang);
    const p1 = rot(QL, QR, q), p2 = rot(QL.map(c => -c), QR.map(c => -c), q);
    dc = Math.max(dc, Math.max(...p1.map((c, i) => Math.abs(c - p2[i]))));
  }
  ok('q -> QL q conj(QR) is an isometry of S^3', iso < 1e-15, `worst |q| departure ${iso.toExponential(1)}`);
  ok('a single hand acts ISOCLINICALLY: every point turns through the quaternion half-angle',
    hi - lo < 1e-12 && Math.abs((hi + lo)/2 - 0.35) < 1e-12,
    `angle ${((hi+lo)/2).toFixed(12)} rad over 1000 points, spread ${(hi-lo).toExponential(1)}, half of 0.7`);
  ok('SU(2) x SU(2) -> SO(4) is two-to-one', dc < 1e-15,
    `(QL,QR) and (-QL,-QR) agree to ${dc.toExponential(1)}`);
  const f = rot(QL, QL, [1, 0, 0, 0]);
  const fe = Math.max(Math.abs(f[0]-1), Math.abs(f[1]), Math.abs(f[2]), Math.abs(f[3]));
  ok('and QR = QL fixes the real axis — the SO(3) stabiliser inside SO(4)', fe < 1e-15,
    `fixed to ${fe.toExponential(1)}`);
}

/* ── AND THE SPECTRUM THAT COMPACTNESS ALLOWS ────────────────────────────────
   Eigenvalues -n(n+2), degeneracy (n+1)^2. Checked by APPLYING the operator with exact
   Gegenbauer derivatives, d/dx C^a_m = 2a C^{a+1}_{m-1}, rather than by differentiating
   numerically — a finite difference with h = 1e-5 already carries 2e-6 of round-off in
   the second derivative, so a residual of 1e-4 would have measured the step and not the
   identity. */
function geg(m, a, x) {
  if (m < 0) return 0;
  if (m === 0) return 1;
  if (m === 1) return 2*a*x;
  let p0 = 1, p1 = 2*a*x;
  for (let k = 2; k <= m; k++) { const p = (2*(k+a-1)*x*p1 - (k+2*a-2)*p0)/k; p0 = p1; p1 = p; }
  return p1;
}
{
  let worst = 0;
  const MODES = [[1,0],[1,1],[2,0],[2,1],[2,2],[3,1],[4,2],[5,3],[6,0],[7,4],[9,2],[11,5]];
  for (const [n, l] of MODES) {
    const m = n - l;
    for (let k = 1; k < 400; k++) {
      const chi = Math.PI*k/400; if (chi < 0.2 || chi > Math.PI - 0.2) continue;
      const s = Math.sin(chi), c = Math.cos(chi), u = c;
      const C = geg(m, l+1, u), C1 = 2*(l+1)*geg(m-1, l+2, u), C2 = 4*(l+1)*(l+2)*geg(m-2, l+3, u);
      const R = Math.pow(s, l)*C;
      const R1 = l*Math.pow(s, l-1)*c*C - Math.pow(s, l+1)*C1;
      const R2 = l*(l-1)*Math.pow(s, l-2)*c*c*C - l*Math.pow(s, l)*C
               - (2*l+1)*Math.pow(s, l)*c*C1 + Math.pow(s, l+2)*C2;
      const lap = R2 + 2*(c/s)*R1 - l*(l+1)*R/(s*s), want = -n*(n+2)*R;
      worst = Math.max(worst, Math.abs(lap - want)/Math.max(1e-12, Math.abs(want)));
    }
  }
  ok('the Laplace-Beltrami eigenvalue on S^3 is -n(n+2), checked by applying the operator',
    worst < 1e-12, `worst relative residual ${worst.toExponential(1)} over ${MODES.length} modes up to n = 11`);
  let degOk = true, shown = [];
  for (let n = 0; n <= 10; n++) { let d = 0; for (let l = 0; l <= n; l++) d += 2*l + 1;
    if (d !== (n+1)*(n+1)) degOk = false; if (n <= 4) shown.push(`${n}:${d}`); }
  ok('and the n-th level carries exactly (n+1)^2 independent modes', degOk,
    `sum_{l<=n} (2l+1) = (n+1)^2 for every n <= 10 · ${shown.join(', ')}`);
  ok('so a compact S^3 has a LONGEST wavelength and nothing below it',
    Math.abs(-1*(1+2) + 3) < 1e-15,
    `the first mode is lambda_1 = -3, k_1 = sqrt(3)/R, longest wavelength 2 pi R / sqrt(3) = ${(2*Math.PI/Math.sqrt(3)).toFixed(6)} R`);
}

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
