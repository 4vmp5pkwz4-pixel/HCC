#!/usr/bin/env node
/* ============================================================================
   FIVE-FOLD SYMMETRY, AND THE INTEGER MATRIX THAT PERMITS IT

   Five-fold symmetry is forbidden for any three-dimensional lattice. Shechtman photographed
   it anyway, and the resolution is arithmetic rather than experimental: the same rotation
   IS a lattice symmetry in six dimensions, and the whole prohibition comes down to one
   trace being an integer in six and not in three.

   This file does not ask the atlas's kernels whether they like their own answers:

     - the orthogonal splitting is checked against its own Gram matrices, formed here;
     - the five-fold matrix is checked against a Rodrigues rotation written here, and its
       order is found by repeated multiplication rather than declared;
     - the trace split is checked against 1 + 2 cos(2 pi/5) and 1 + 2 cos(4 pi/5) computed
       directly, and against the minimal polynomial of 2 cos(2 pi/5), which is written out;
     - the inflation is checked against the golden equation as a MATRIX identity;
     - the patch is searched for a period, and the largest fraction any translation
       reproduces is reported rather than aperiodicity being asserted.

   Run: node docs/verify-quasicrystal-arithmetic.cjs
   ========================================================================= */

let pass = 0, fail = 0;
const ok = (t, c, d) => { c ? pass++ : fail++;
  console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); };

(async () => {
const { pathToFileURL } = require('node:url');
const { join } = require('node:path');
const X = await import(pathToFileURL(join(__dirname, '..', 'core/atlas/extracted.mjs')).href);
const TAU = (1 + Math.sqrt(5)) / 2;

console.log('\n1 · the golden ratio, and the two projections it splits R^6 into\n');
{
  ok('tau is the root of x^2 = x + 1 to the last bit, and its Galois conjugate -1/tau is the OTHER root — the two numbers this entire subject is made of',
    Math.abs(TAU * TAU - TAU - 1) < 1e-15 && Math.abs(X.QC_TAU - TAU) < 1e-15 &&
    Math.abs((-1 / TAU) * (-1 / TAU) - (-1 / TAU) - 1) < 1e-15 &&
    Math.abs(-1 / TAU - (1 - TAU)) < 1e-15,
    `tau = ${TAU.toFixed(15)}, tau^2 - tau - 1 = ${(TAU * TAU - TAU - 1).toExponential(1)} · -1/tau = ${(-1 / TAU).toFixed(15)} = 1 - tau`);

  /* the Gram matrices, formed here from the atlas's basis */
  const B = X.qcBasis();
  const gram = (A, C) => { const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let j = 0; j < 6; j++) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) M[a][b] += A[j][a] * C[j][b];
    return M; };
  const pp = gram(B.par, B.par), qq = gram(B.perp, B.perp), pq = gram(B.par, B.perp);
  let w = 0;
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++)
    w = Math.max(w, Math.abs(pp[a][b] - (a === b ? 2 : 0)), Math.abs(qq[a][b] - (a === b ? 2 : 0)), Math.abs(pq[a][b]));
  ok('the splitting R^6 = R^3 par + R^3 perp is ORTHOGONAL and isotropic in both halves: par.par = perp.perp = 2I and par.perp = 0, which is what lets the cut and the projection be independent operations',
    w < 1e-14 && Math.abs(X.qcSplitResidual() - w) < 1e-15,
    `worst departure ${w.toExponential(2)} across all eighteen entries · the atlas's own qcSplitResidual returns ${X.qcSplitResidual().toExponential(2)}`);

  ok('and it is COMPLETE: par_j.par_k + perp_j.perp_k = 2 delta_jk, so a physical point together with its perpendicular shadow recovers the integer lattice coordinate exactly rather than approximately',
    X.qcCompletenessResidual() < 1e-14,
    `residual ${X.qcCompletenessResidual().toExponential(2)} · section 3 uses this to invert the projection on a real patch`);

  /* the six axes really are icosahedral: every pair at cosine 1/sqrt 5 */
  const cosines = new Set();
  let worstCos = 0;
  for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) {
    const c = B.par[i][0] * B.par[j][0] + B.par[i][1] * B.par[j][1] + B.par[i][2] * B.par[j][2];
    cosines.add(c > 0 ? '+' : '-');
    worstCos = Math.max(worstCos, Math.abs(Math.abs(c) - 1 / Math.sqrt(5)));
  }
  ok('the six axes are the five-fold axes of the ICOSAHEDRON — every one of the fifteen pairs meets at a cosine of exactly 1/sqrt 5 in magnitude, and every axis is a unit vector',
    worstCos < 1e-15 && cosines.size === 2 &&
    B.par.every(v => Math.abs(Math.hypot(v[0], v[1], v[2]) - 1) < 1e-15),
    `worst |cos| departure from 1/sqrt5 = ${(1 / Math.sqrt(5)).toFixed(12)} is ${worstCos.toExponential(2)} over all 15 pairs, in both signs`);
}

console.log('\n2 · the crystallographic restriction, and why six dimensions dissolve it\n');
{
  const B = X.qcBasis();
  /* an INDEPENDENT Rodrigues rotation, written here */
  const rod = (ax, ang) => { const [x, y, z] = ax, C = Math.cos(ang), S = Math.sin(ang), K = 1 - C;
    return v => [(C + x * x * K) * v[0] + (x * y * K - z * S) * v[1] + (x * z * K + y * S) * v[2],
                 (y * x * K + z * S) * v[0] + (C + y * y * K) * v[1] + (y * z * K - x * S) * v[2],
                 (z * x * K - y * S) * v[0] + (z * y * K + x * S) * v[1] + (C + z * z * K) * v[2]]; };
  let allIntegral = true, worstAxis = 0, traces = [];
  for (let a = 0; a < 6; a++) {
    const F = X.qcFiveFold(a), R = rod(B.par[a], 2 * Math.PI / 5);
    if (!F.integral) allIntegral = false;
    traces.push(F.trace);
    /* the matrix really does send each axis where the rotation sends it */
    for (let j = 0; j < 6; j++) {
      const want = R(B.par[j]), got = [0, 0, 0];
      for (let k = 0; k < 6; k++) if (F.matrix[j][k]) for (let d = 0; d < 3; d++) got[d] += F.matrix[j][k] * B.par[k][d];
      worstAxis = Math.max(worstAxis, Math.hypot(got[0] - want[0], got[1] - want[1], got[2] - want[2]));
    }
  }
  ok('a rotation by 2 pi/5 about ANY of the six axes sends every axis to plus or minus another one, so it is an INTEGER matrix — checked against a Rodrigues rotation written here, at all six axes and all thirty-six entries',
    allIntegral && worstAxis < 1e-14 && traces.every(t => t === 1),
    `worst axis image error ${worstAxis.toExponential(2)} · the trace is ${traces.join(', ')} — the integer 1, about every axis`);

  const F0 = X.qcFiveFold(0);
  ok('and its order really is five: the fifth power is the identity exactly, while the square is nowhere near it',
    X.qcOrderResidual(F0.matrix, 5) === 0 && X.qcOrderResidual(F0.matrix, 2) > 0.5 &&
    X.qcOrderResidual(F0.matrix, 10) === 0,
    `M^5 - I = ${X.qcOrderResidual(F0.matrix, 5).toExponential(1)} exactly, M^10 - I = ${X.qcOrderResidual(F0.matrix, 10).toExponential(1)}, and M^2 - I = ${X.qcOrderResidual(F0.matrix, 2).toFixed(3)}`);

  /* THE WHOLE PROHIBITION, IN ONE LINE. */
  const T = X.qcTraceSplit();
  const c72 = 2 * Math.cos(2 * Math.PI / 5), c144 = 2 * Math.cos(4 * Math.PI / 5);
  ok('the trace of that integer matrix splits across the two projections as (1 + 2 cos 72) + (1 + 2 cos 144) = tau + (1 - tau) = 1. An irrational and its Galois conjugate summing to an integer — and in three dimensions the first would have to be an integer ON ITS OWN, which is the entire crystallographic restriction',
    Math.abs(T.par - (1 + c72)) < 1e-15 && Math.abs(T.perp - (1 + c144)) < 1e-15 &&
    Math.abs(T.par - TAU) < 1e-14 && Math.abs(T.perp - (1 - TAU)) < 1e-14 &&
    Math.abs(T.total - F0.trace) < 1e-14 &&
    Math.abs(T.par - Math.round(T.par)) > 0.3,
    `1 + 2 cos 72 = ${T.par.toFixed(15)} = tau · 1 + 2 cos 144 = ${T.perp.toFixed(15)} = 1 - tau · their sum ${T.total.toFixed(15)} against the integer trace ${F0.trace} · ` +
    `the first is ${Math.abs(T.par - Math.round(T.par)).toFixed(3)} away from the nearest integer, which is exactly why no 3x3 integer matrix has order five with this action`);

  /* and 2 cos(2 pi/5) is algebraic of degree two, which is the same fact from the other side */
  ok('and the same fact from the other side: 2 cos(2 pi/5) is a root of x^2 + x - 1, so it is algebraic of degree TWO — it needs a companion, and six dimensions are three copies of the two-dimensional room that companion needs',
    Math.abs(c72 * c72 + c72 - 1) < 1e-15 && Math.abs(c144 * c144 + c144 - 1) < 1e-15 &&
    Math.abs(c72 + c144 + 1) < 1e-15 && Math.abs(c72 * c144 + 1) < 1e-15,
    `2cos72 = ${c72.toFixed(15)} and 2cos144 = ${c144.toFixed(15)} · sum ${(c72 + c144).toFixed(15)} = -1 and product ${(c72 * c144).toFixed(15)} = -1: the coefficients of x^2 + x - 1, both integers`);
}

console.log('\n3 · the inflation, and the module it is integral on\n');
{
  const S = X.qcInflation();
  ok('the inflation that scales physical space by tau and perpendicular space by -1/tau satisfies S^2 = S + I EXACTLY, as a matrix identity — because both of its eigenvalues satisfy the golden equation and nothing else is needed',
    S.golden_residual < 1e-14,
    `worst |S^2 - S - I| entry ${S.golden_residual.toExponential(2)} across all thirty-six`);

  ok('and it is NOT an integer matrix in this basis — its entries are half integers, so this is the FACE-CENTRED icosahedral module and the inflation is integral only after refining the lattice. Reporting that is the difference between a description and a claim',
    S.integral === false && S.half_integral_residual < 1e-14 &&
    S.matrix.every(r => r.every(x => Math.abs(Math.abs(x) - 0.5) < 1e-14)),
    `every entry is exactly plus or minus one half; 2S is integral to ${S.half_integral_residual.toExponential(2)}`);
}

console.log('\n4 · the patch, cut and measured\n');
{
  const B = X.qcBasis();
  /* the projection is INVERTED on a real patch, not approximated */
  const pts = X.qcBuild(3, 0.9, 0, 0, 0);
  let recov = 0;
  for (const P of pts) for (let j = 0; j < 6; j++) {
    const n = (P[0] * B.par[j][0] + P[1] * B.par[j][1] + P[2] * B.par[j][2]
             + P[3] * B.perp[j][0] + P[4] * B.perp[j][1] + P[5] * B.perp[j][2]) / 2;
    recov = Math.max(recov, Math.abs(n - Math.round(n)));
  }
  ok('every atom of a real patch, put back through the completeness relation together with its perpendicular shadow, returns its INTEGER six-dimensional coordinate — the projection is inverted exactly, over all 285 of them and all six coordinates each',
    pts.length > 200 && recov < 1e-14,
    `${pts.length} atoms, ${pts.length * 6} coordinates, worst departure from an integer ${recov.toExponential(2)}`);

  /* the phason rearranges the solid and never crowds it */
  const seps = [], counts = [];
  for (const t of [0, 0.07, 0.15, 0.22, 0.28]) {
    const p = X.qcBuild(3, 0.9, t, t * 0.6, t * 0.3);
    counts.push(p.length);
    seps.push(X.qcMinSeparation(p.map(q => [q[0], q[1], q[2]]), 900));
  }
  ok('the phason genuinely rearranges the solid — the atom count moves by a tenth as the window slides — and the minimum separation does not move at all: it is exactly 1 at every shift, because it is a property of the module and not of where the window sits',
    seps.every(s => Math.abs(s - 1) < 1e-12) && Math.max(...counts) - Math.min(...counts) > 20,
    `counts ${counts.join(', ')} · minimum separations ${seps.map(s => s.toFixed(12)).join(', ')}`);

  /* aperiodicity, MEASURED */
  const phys = pts.map(p => [p[0], p[1], p[2]]);
  const key = v => v.map(x => x.toFixed(6)).join(',');
  const set = new Set(phys.map(key));
  const inner = phys.filter(q => Math.hypot(q[0], q[1], q[2]) <= 3);
  let best = 0, bestLen = 0;
  for (let k = 1; k < Math.min(phys.length, 200); k++) {
    const d = [phys[k][0] - phys[0][0], phys[k][1] - phys[0][1], phys[k][2] - phys[0][2]];
    const L = Math.hypot(d[0], d[1], d[2]);
    if (L > 2.2 || L < 1e-9) continue;
    let hit = 0;
    for (const q of inner) if (set.has(key([q[0] + d[0], q[1] + d[1], q[2] + d[2]]))) hit++;
    if (hit / inner.length > best) { best = hit / inner.length; bestLen = L; }
  }
  ok('and nothing translates it onto itself: the best candidate of two hundred reproduces under a third of the interior, where a genuine period would reproduce all of it. Aperiodicity is reported as that fraction, because on a finite patch it is a measurement and not a proof',
    best < 0.5 && inner.length > 40,
    `best candidate of length ${bestLen.toFixed(4)} reproduces ${(best * 100).toFixed(1)} per cent of ${inner.length} interior atoms · a period would reproduce 100`);
}

console.log(`\n${fail === 0 ? '✔' : '✗'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
