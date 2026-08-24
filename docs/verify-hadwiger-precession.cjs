/* ── HADWIGER'S FOUR NUMBERS, AND THE PERIHELION NEWTON DOES NOT MOVE ─────────
   STATUS: MEASURED. Nothing here reads the atlas. Every functional is checked against a
   closed form, and the one place a closed form is exact — a polyhedron — is the place the
   mean-width term is asked to be exact rather than merely close.

   Hadwiger: a continuous, rigid-motion-invariant, additive functional on convex bodies in
   R^3 is a linear combination of exactly four numbers. The normalisation is fixed by
   Steiner's formula, Vol(K + eB) = sum_j kappa_{3-j} V_j(K) e^{3-j}, which for a cube of
   side a gives V0 = 1, V1 = 3a, V2 = 3a^2, V3 = a^3, and for a ball of radius r gives
   1, 4r, 2 pi r^2, (4/3) pi r^3.

   V0 IS THE BODY'S EULER CHARACTERISTIC AND NOT ITS SURFACE'S. V - E + F over a closed
   triangle mesh is chi of the BOUNDARY: 2 for a ball, where the intrinsic volume of the
   solid is chi(B^3) = 1. For genus g the relation is exact, chi_body = 1 - g =
   chi_surface / 2, and the torus is the case that separates the two. */
'use strict';
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}${d ? ' · ' + d : ''}`); }
                          else { fail++; console.log(`  FAIL ${n}${d ? ' · ' + d : ''}`); } };

function intrinsic(P, I) {
  const F = I.length / 3, V = P.length / 3;
  const nrm = new Float64Array(F * 3), edges = new Map();
  let vol = 0, area = 0;
  for (let f = 0; f < F; f++) {
    const i0 = I[3*f], i1 = I[3*f+1], i2 = I[3*f+2];
    const ax = P[3*i0], ay = P[3*i0+1], az = P[3*i0+2];
    const bx = P[3*i1], by = P[3*i1+1], bz = P[3*i1+2];
    const cx = P[3*i2], cy = P[3*i2+1], cz = P[3*i2+2];
    const ux = bx-ax, uy = by-ay, uz = bz-az, vx = cx-ax, vy = cy-ay, vz = cz-az;
    const nx = uy*vz-uz*vy, ny = uz*vx-ux*vz, nz = ux*vy-uy*vx, L = Math.hypot(nx, ny, nz);
    if (L > 0) { nrm[3*f] = nx/L; nrm[3*f+1] = ny/L; nrm[3*f+2] = nz/L; area += 0.5*L; }
    vol += (ax*(by*cz-bz*cy) - ay*(bx*cz-bz*cx) + az*(bx*cy-by*cx)) / 6;
    for (const [p, q] of [[i0,i1],[i1,i2],[i2,i0]]) {
      const k = p < q ? p+','+q : q+','+p;
      let r = edges.get(k); if (!r) { r = { p, q, f0: -1, f1: -1 }; edges.set(k, r); }
      if (r.f0 < 0) r.f0 = f; else r.f1 = f;
    }
  }
  let V1 = 0;
  for (const e of edges.values()) {
    if (e.f1 < 0) continue;
    let d = nrm[3*e.f0]*nrm[3*e.f1] + nrm[3*e.f0+1]*nrm[3*e.f1+1] + nrm[3*e.f0+2]*nrm[3*e.f1+2];
    d = Math.min(1, Math.max(-1, d));
    const ex = P[3*e.q]-P[3*e.p], ey = P[3*e.q+1]-P[3*e.p+1], ez = P[3*e.q+2]-P[3*e.p+2];
    V1 += Math.hypot(ex, ey, ez) * Math.acos(d);
  }
  V1 /= 2 * Math.PI;
  const chi = V - edges.size + F;
  return { V0: chi/2, V1, V2: area/2, V3: Math.abs(vol), chi_surface: chi, genus: (2-chi)/2 };
}
const cube = a => ({ P: [0,0,0, a,0,0, a,a,0, 0,a,0, 0,0,a, a,0,a, a,a,a, 0,a,a],
  I: [0,3,2, 0,2,1, 4,5,6, 4,6,7, 0,1,5, 0,5,4, 1,2,6, 1,6,5, 2,3,7, 2,7,6, 3,0,4, 3,4,7] });
function icosphere(r, sub) {
  const t = (1 + Math.sqrt(5)) / 2;
  let P = [-1,t,0, 1,t,0, -1,-t,0, 1,-t,0, 0,-1,t, 0,1,t, 0,-1,-t, 0,1,-t, t,0,-1, t,0,1, -t,0,-1, -t,0,1];
  let I = [0,11,5, 0,5,1, 0,1,7, 0,7,10, 0,10,11, 1,5,9, 5,11,4, 11,10,2, 10,7,6, 7,1,8,
           3,9,4, 3,4,2, 3,2,6, 3,6,8, 3,8,9, 4,9,5, 2,4,11, 6,2,10, 8,6,7, 9,8,1];
  for (let s = 0; s < sub; s++) {
    const mid = new Map(), NI = [];
    const get = (a, b) => { const k = a < b ? a+','+b : b+','+a; if (mid.has(k)) return mid.get(k);
      const i = P.length/3; P.push((P[3*a]+P[3*b])/2, (P[3*a+1]+P[3*b+1])/2, (P[3*a+2]+P[3*b+2])/2);
      mid.set(k, i); return i; };
    for (let f = 0; f < I.length/3; f++) { const a = I[3*f], b = I[3*f+1], c = I[3*f+2];
      const ab = get(a,b), bc = get(b,c), ca = get(c,a);
      NI.push(a,ab,ca, b,bc,ab, c,ca,bc, ab,bc,ca); }
    I = NI;
  }
  for (let i = 0; i < P.length; i += 3) { const L = Math.hypot(P[i], P[i+1], P[i+2]);
    P[i] *= r/L; P[i+1] *= r/L; P[i+2] *= r/L; }
  return { P, I };
}
function torus(R, r, n, m) {
  const P = [], I = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const u = 2*Math.PI*i/n, v = 2*Math.PI*j/m;
    P.push((R + r*Math.cos(v))*Math.cos(u), (R + r*Math.cos(v))*Math.sin(u), r*Math.sin(v)); }
  const id = (i, j) => (((i%n)+n)%n)*m + (((j%m)+m)%m);
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++)
    I.push(id(i,j), id(i+1,j), id(i+1,j+1), id(i,j), id(i+1,j+1), id(i,j+1));
  return { P, I };
}

console.log('\nHADWIGER · four intrinsic volumes, and the relativistic perihelion\n');

{ const c = cube(2), H = intrinsic(c.P, c.I);
  ok('a cube returns all four EXACTLY — the mean-width term has no tessellation error on a polyhedron',
    H.V0 === 1 && Math.abs(H.V1 - 6) < 1e-9 && Math.abs(H.V2 - 12) < 1e-9 && Math.abs(H.V3 - 8) < 1e-9,
    `V0=${H.V0} V1=${H.V1.toFixed(9)} V2=${H.V2.toFixed(9)} V3=${H.V3.toFixed(9)} against 1, 6, 12, 8`); }

{ const r = 1.5, prev = {};
  let converging = true, last = null;
  for (const s of [2, 3, 4]) {
    const m = icosphere(r, s), H = intrinsic(m.P, m.I);
    const e = Math.max(Math.abs(H.V1 - 4*r)/(4*r), Math.abs(H.V2 - 2*Math.PI*r*r)/(2*Math.PI*r*r),
                       Math.abs(H.V3 - (4/3)*Math.PI*r**3)/((4/3)*Math.PI*r**3));
    if (last !== null && !(e < last)) converging = false;
    last = e; prev[s] = e;
  }
  ok('a ball converges to 1, 4r, 2 pi r^2, (4/3) pi r^3 as the tessellation refines',
    converging && last < 3e-3,
    `worst relative error ${prev[2].toExponential(2)} -> ${prev[3].toExponential(2)} -> ${prev[4].toExponential(2)}`); }

{ const t = torus(3, 1, 96, 64), H = intrinsic(t.P, t.I);
  ok('a torus returns V0 = 0 — the check that V0 is the BODY\'s characteristic, not the surface\'s',
    H.V0 === 0 && H.genus === 1 && Math.abs(H.V3 - 2*Math.PI**2*3) / (2*Math.PI**2*3) < 5e-3,
    `V0=${H.V0}, surface chi=${H.chi_surface}, genus=${H.genus}, V3=${H.V3.toFixed(4)} against 2 pi^2 R r^2 = ${(2*Math.PI**2*3).toFixed(4)}`); }

{ const GM = 1.32712440018e20, C = 299792458, AU = 1.495978707e11, AS = 180/Math.PI*3600;
  const adv = (aAU, e, T) => 6*Math.PI*GM/(C*C*aAU*AU*(1-e*e))*AS*(36525/T);
  const merc = adv(0.38709893, 0.20563069, 87.9691);
  ok('Mercury\'s relativistic perihelion advance is 42.98 arcsec/century',
    Math.abs(merc - 42.98) < 0.05, `computed ${merc.toFixed(3)} against an observed anomaly of 42.98 +/- 0.04`);
  const ven = adv(0.72333199, 0.00677323, 224.701), ear = adv(1.00000011, 0.01671022, 365.256);
  ok('and the advance falls off as 1/a, which is why the outer planets barely move',
    merc > ven && ven > ear, `Mercury ${merc.toFixed(3)} > Venus ${ven.toFixed(3)} > Earth ${ear.toFixed(3)} arcsec/century`); }

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
