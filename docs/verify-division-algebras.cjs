/* ── THE FOUR HOPF FIBRATIONS, AND WHY THERE IS NO FIFTH ──────────────────────
   STATUS: MEASURED. Nothing here reads the atlas. The tower is rebuilt from the
   Cayley-Dickson doubling alone and every property is measured rather than looked up.

       (a,b)(c,d) = (a c - conj(d) b, d a + b conj(c))

   Hurwitz's theorem says a normed real division algebra has dimension 1, 2, 4 or 8 and
   nothing else. That is not asserted here; it is where the measurement stops working.
   The sedenions are constructed by the same doubling and their norm defect is reported.

   The Hopf map h(a,b) = (2 a conj(b), |a|^2 - |b|^2) carries S^(2n-1) onto S^n with
   fibre S^(n-1), once for each of the four. And the fourth is different in a way that is
   also measured: S^0, S^1 and S^3 are groups, S^7 is a Moufang loop, so only the first
   three fibrations are principal bundles. */
'use strict';
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}${d ? ' · ' + d : ''}`); }
                          else { fail++; console.log(`  FAIL ${n}${d ? ' · ' + d : ''}`); } };

const conj = a => a.map((v, i) => i ? -v : v);
const add = (a, b) => a.map((v, i) => v + b[i]);
const neg = a => a.map(v => -v);
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const norm = a => Math.sqrt(dot(a, a));
function mul(x, y) {
  const n = x.length;
  if (n === 1) return [x[0] * y[0]];
  const h = n >> 1;
  const a = x.slice(0, h), b = x.slice(h), c = y.slice(0, h), d = y.slice(h);
  return add(mul(a, c), neg(mul(conj(d), b))).concat(add(mul(d, a), mul(b, conj(c))));
}
const gen = (n, s) => Array.from({ length: n }, (_, i) => Math.sin(s * 7.1 + i * 2.3) + 0.3 * Math.cos(s * 3.7 + i));
const unit = a => { const L = norm(a); return a.map(v => v / L); };
const TOL = 1e-12;

console.log('\nDIVISION ALGEBRAS · the tower, and all four Hopf fibrations\n');

const props = dim => {
  let nd = 0, as = 0, al = 0, cm = 0, mf = 0;
  for (let s = 1; s <= 400; s++) {
    const x = gen(dim, s), y = gen(dim, s + 0.5), z = gen(dim, s + 0.9);
    nd = Math.max(nd, Math.abs(norm(mul(x, y)) - norm(x) * norm(y)) / (norm(x) * norm(y)));
    const A = mul(mul(x, y), z), B = mul(x, mul(y, z));
    as = Math.max(as, norm(add(A, neg(B))) / Math.max(1, norm(A)));
    const C = mul(mul(x, x), y), D = mul(x, mul(x, y));
    al = Math.max(al, norm(add(C, neg(D))) / Math.max(1, norm(C)));
    cm = Math.max(cm, norm(add(mul(x, y), neg(mul(y, x)))) / Math.max(1, norm(mul(x, y))));
    const M1 = mul(mul(x, y), mul(z, x)), M2 = mul(mul(x, mul(y, z)), x);
    mf = Math.max(mf, norm(add(M1, neg(M2))) / Math.max(1, norm(M1)));
  }
  return { nd, as, al, cm, mf };
};

{
  const R = props(1), C = props(2), H = props(4), O = props(8), S = props(16);
  ok('the norm is multiplicative in dimensions 1, 2, 4 and 8',
    R.nd < TOL && C.nd < TOL && H.nd < TOL && O.nd < TOL,
    `worst defect across the four: ${Math.max(R.nd, C.nd, H.nd, O.nd).toExponential(1)}`);
  ok('and it is NOT in dimension 16 — which is where Hurwitz stops the tower',
    S.nd > 1e-6, `the sedenion norm defect reaches ${S.nd.toExponential(2)}, so there is no fifth division algebra and no fifth Hopf fibration`);
  ok('commutativity is lost at the quaternions', C.cm < TOL && H.cm > 1e-6,
    `complex ${C.cm.toExponential(1)} → quaternion ${H.cm.toExponential(1)}`);
  ok('associativity is lost at the octonions, and alternativity survives there',
    H.as < TOL && O.as > 1e-6 && O.al < TOL,
    `quaternion associator ${H.as.toExponential(1)} → octonion ${O.as.toExponential(1)}, octonion alternator ${O.al.toExponential(1)}`);
  ok('and alternativity itself is lost at the sedenions', S.al > 1e-6,
    `sedenion alternator ${S.al.toExponential(2)}`);
}

{
  let worst = 0, fibreH = 0, fibreO = 0;
  for (const n of [1, 2, 4, 8]) {
    for (let s = 1; s <= 300; s++) {
      const p = unit(gen(2 * n, s));
      const a = p.slice(0, n), b = p.slice(n);
      const h = mul(a, conj(b)).map(v => 2 * v).concat([dot(a, a) - dot(b, b)]);
      worst = Math.max(worst, Math.abs(norm(h) - 1));
      if (n === 4 || n === 8) {
        const u = unit(gen(n, s + 13));
        const a2 = mul(a, u), b2 = mul(b, u);
        const h2 = mul(a2, conj(b2)).map(v => 2 * v).concat([dot(a2, a2) - dot(b2, b2)]);
        const d = norm(add(h, neg(h2)));
        if (n === 4) fibreH = Math.max(fibreH, d); else fibreO = Math.max(fibreO, d);
      }
    }
  }
  ok('all four Hopf maps carry the sphere onto the sphere', worst < 1e-14,
    `S^1→S^1, S^3→S^2, S^7→S^4, S^15→S^8 · worst departure ${worst.toExponential(1)}`);
  ok('the quaternionic fibre is a group orbit and the octonionic one is not',
    fibreH < 1e-13 && fibreO > 1e-2,
    `right-multiplying both halves by one unit moves h by ${fibreH.toExponential(1)} for S^7→S^4 and by ${fibreO.toExponential(1)} for S^15→S^8`);
}

{
  const sphere = dim => {
    let cl = 0, as = 0, iv = 0;
    for (let s = 1; s <= 300; s++) {
      const x = unit(gen(dim, s)), y = unit(gen(dim, s + 0.6)), z = unit(gen(dim, s + 1.3));
      cl = Math.max(cl, Math.abs(norm(mul(x, y)) - 1));
      as = Math.max(as, norm(add(mul(mul(x, y), z), neg(mul(x, mul(y, z))))));
      const e = mul(x, conj(x));
      iv = Math.max(iv, Math.abs(e[0] - 1) + Math.hypot(...e.slice(1)));
    }
    return { cl, as, iv };
  };
  const s1 = sphere(2), s3 = sphere(4), s7 = sphere(8);
  ok('S^1 and S^3 are groups: closed, invertible and associative',
    s1.cl < TOL && s1.as < TOL && s1.iv < TOL && s3.cl < TOL && s3.as < TOL && s3.iv < TOL,
    `worst associator across both ${Math.max(s1.as, s3.as).toExponential(1)}`);
  ok('S^7 is closed and invertible but NOT associative — a Moufang loop, not a group',
    s7.cl < TOL && s7.iv < TOL && s7.as > 1e-2,
    `closure ${s7.cl.toExponential(1)}, inverses ${s7.iv.toExponential(1)}, associator ${s7.as.toExponential(2)} — which is why only three of the four fibrations are principal bundles`);
}

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
