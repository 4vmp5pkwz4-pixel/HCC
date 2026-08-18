#!/usr/bin/env node
/* ============================================================================
   A CHARGE THAT IS A LATTICE SUM, AND A BOUND THE MAP SATURATES

   Berg-Lüscher is not a discretised integral. It is the signed area of the spherical
   triangle three neighbouring spins span, summed over the mesh, and it is EXACT for a
   finite lattice. So the number a finite window returns is short of the integer by exactly
   the tail that fell outside it — and the interesting question is whether it climbs to the
   integer as the window grows, which is measured here rather than assumed.

   Nothing below trusts the atlas's own sums:

     - the spherical excess is recomputed from L'Huilier's theorem, which shares no algebra
       with the Berg-Lüscher formula;
     - the charge is checked to be exactly invariant under helicity and under a global
       rotation of the target sphere, both of which cannot change a degree;
     - the Bogomolny bound is checked at FIXED MESH DENSITY, because the ratio is a
       statement about the map and the grid is a statement about arithmetic;
     - and the Thiele solution is substituted back into its own equation.

   Run: node docs/verify-skyrmion-charge.cjs
   ========================================================================= */

let pass = 0, fail = 0;
const ok = (t, c, d) => { c ? pass++ : fail++;
  console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); };

(async () => {
const { pathToFileURL } = require('node:url');
const { join } = require('node:path');
const X = await import(pathToFileURL(join(__dirname, '..', 'core/atlas/extracted.mjs')).href);

console.log('\n1 · the spherical excess, by a second route\n');
{
  /* L'HUILIER'S THEOREM, written here: it gives the area of a spherical triangle from its
     three SIDE LENGTHS alone and shares no algebra at all with the Berg-Lüscher formula. */
  const ang = (a, b) => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
  const lhuilier = (A, B, C) => {
    const a = ang(B, C), b = ang(C, A), c = ang(A, B), s = (a + b + c) / 2;
    const t = Math.tan(s / 2) * Math.tan((s - a) / 2) * Math.tan((s - b) / 2) * Math.tan((s - c) / 2);
    return 4 * Math.atan(Math.sqrt(Math.max(0, t)));
  };
  const unit = v => { const n = Math.hypot(v[0], v[1], v[2]); return [v[0] / n, v[1] / n, v[2] / n]; };
  let worst = 0, n = 0;
  for (let k = 0; k < 300; k++) {
    const A = unit([Math.sin(k), Math.cos(2 * k + 1), Math.sin(3 * k + 2)]);
    const B = unit([Math.cos(k * 1.7), Math.sin(k - 2), Math.cos(4 * k)]);
    const C = unit([Math.sin(2.3 * k + 1), Math.cos(k * 0.7), Math.sin(k * 5 + 3)]);
    const berg = X.skSolidAngle(A[0], A[1], A[2], B[0], B[1], B[2], C[0], C[1], C[2]);
    const lhu = lhuilier(A, B, C);
    /* L'Huilier gives the unsigned area; Berg-Lüscher gives it with the orientation */
    worst = Math.max(worst, Math.abs(Math.abs(berg) - lhu)); n++;
  }
  ok("the signed spherical area the charge is built from agrees with L'Huilier's theorem — which computes the same area from the three side lengths alone and shares no algebra with it — at three hundred random triangles",
    worst < 1e-10 && n === 300,
    `worst disagreement ${worst.toExponential(2)} over ${n} triangles · Berg-Lüscher carries the orientation and L'Huilier does not, so the magnitudes are what is compared · the residual is L'Huilier's own conditioning, which degrades for triangles with a side near pi, and not a disagreement between the two formulas`);
}

console.log('\n2 · the charge, and the window that keeps it off the integer\n');
{
  const one = [{ x: 0, y: 0, s: 1 }];
  const qAt = (half, G) => X.skBergLuscher(X.skSampleBP(G, half, one, 1.6, 0, 1).M, G);
  /* the GRID converges fast and to the wrong thing; the WINDOW is what matters */
  const grids = [81, 161, 321, 641].map(G => qAt(8, G));
  const wins = [4, 8, 16, 32, 64, 128].map(h => qAt(h, 401));
  ok('refining the MESH converges immediately and not to the integer — four grids agree to five decimals on a number that is three per cent short of one, because the shortfall is not a discretisation error at all',
    Math.max(...grids) - Math.min(...grids) < 1e-4 && Math.abs(Math.abs(grids[3]) - 1) > 0.02,
    `Q at grids 81, 161, 321, 641 = ${grids.map(q => q.toFixed(7)).join(', ')} · all short of 1 by about ${(1 - Math.abs(grids[3])).toFixed(4)}`);

  ok('and growing the WINDOW is what closes it: the Belavin-Polyakov soliton has a tail falling only as one over r squared, so the charge climbs to the integer as the box does, and this is the whole content of the deficit the instrument returns',
    wins.every((q, i) => i === 0 || Math.abs(q) > Math.abs(wins[i - 1])) &&
    Math.abs(Math.abs(wins[0]) - 1) > 0.1 && Math.abs(Math.abs(wins[5]) - 1) < 1e-3,
    `half-widths 4, 8, 16, 32, 64, 128 give ${wins.map(q => q.toFixed(6)).join(', ')} · monotone, and within a thousandth of the integer by 128`);

  /* THE EXACT INVARIANCES: a degree cannot notice either of these. */
  const base = X.skSampleBP(241, 8, one, 1.6, 0, 1), q0 = X.skBergLuscher(base.M, 241);
  let hel = 0;
  for (const g of [0.4, 1.1, Math.PI / 2, 2.9, 5.5])
    hel = Math.max(hel, Math.abs(X.skBergLuscher(X.skSampleBP(241, 8, one, 1.6, g, 1).M, 241) - q0));
  const R = new Float64Array(base.M.length);
  for (let k = 0; k < base.M.length; k += 3) { R[k] = base.M[k + 2]; R[k + 1] = base.M[k + 1]; R[k + 2] = -base.M[k]; }
  const rot = Math.abs(X.skBergLuscher(R, 241) - q0);
  ok('the charge is EXACTLY blind to the helicity — Néel, Bloch and everything between give the same number to the last bit at five values — and exactly blind to a global rotation of the target sphere, which is why a bimeron is the same soliton and not another one',
    hel < 1e-13 && rot < 1e-13,
    `worst helicity shift ${hel.toExponential(2)} over five values · bimeron rotation shift ${rot.toExponential(2)} · neither can change a degree, and neither does`);

  const anti = X.skBergLuscher(X.skSampleBP(241, 8, [{ x: 0, y: 0, s: -1 }], 1.6, 0, 1).M, 241);
  ok('and an antiskyrmion is the negative to every digit — the anti-holomorphic factor flips the degree and nothing else',
    Math.abs(anti + q0) < 1e-13, `${q0.toFixed(12)} against ${anti.toFixed(12)}`);

  /* several cores: the degree adds */
  const two = X.skBergLuscher(X.skSampleBP(481, 24, [{ x: -3, y: 0, s: 1 }, { x: 3, y: 0, s: 1 }], 1.6, 0, 1).M, 481);
  const mix = X.skBergLuscher(X.skSampleBP(481, 24, [{ x: -3, y: 0, s: 1 }, { x: 3, y: 0, s: -1 }], 1.6, 0, 1).M, 481);
  ok('and the degrees ADD: two like cores carry twice the charge and two opposite cores carry none, which is why a skyrmion and an antiskyrmion can annihilate without anything being violated',
    Math.abs(Math.abs(two) - 2) < 0.03 && Math.abs(mix) < 0.01,
    `two like cores: ${two.toFixed(6)} · one of each: ${mix.toFixed(9)} · the second is zero to a hundredth of a charge on a window that is still costing the first three per cent`);
}

console.log('\n3 · the Bogomolny bound, saturated\n');
{
  /* at FIXED MESH DENSITY, so the comparison is about the map and not about arithmetic */
  const rows = [];
  let worst = 0;
  for (const half of [4, 8, 16]) {
    const G = Math.round(half * 30) + 1;
    const S = X.skSampleBP(G, half, [{ x: 0, y: 0, s: 1 }], 1.6, 0, 1);
    const Q = X.skBergLuscher(S.M, G);
    const E = X.skEnergyPure(S.M, G, S.D, { exchange: 1 }, false);
    const r = E.exchange_bare / X.skBogomolny(Q);
    rows.push(`half ${half}: E = ${E.exchange_bare.toFixed(5)}, 4pi|Q| = ${X.skBogomolny(Q).toFixed(5)}, ratio ${r.toFixed(7)}`);
    worst = Math.max(worst, Math.abs(r - 1));
  }
  ok('the exchange energy of the rational map SATURATES the Bogomolny bound E >= 4 pi |Q| — and it keeps saturating as the window grows, because the tail that costs the charge costs the energy the same amount and the ratio does not notice',
    worst < 2e-3,
    rows.join(' · ') + ` · worst departure from saturation ${worst.toExponential(2)}`);

  /* and the bound is a BOUND: deform the map and the energy goes up, never down */
  const at = w => { const S = X.skSampleBP(481, 16, [{ x: 0, y: 0, s: 1 }], 1.6, 0, w);
    const Q = X.skBergLuscher(S.M, 481), E = X.skEnergyPure(S.M, 481, S.D, { exchange: 1 }, false);
    return E.exchange_bare / X.skBogomolny(Q); };
  const r1 = at(1), rNarrow = at(0.5), rWide = at(2);
  ok('and it really is a bound and not an identity: reshape the wall away from the holomorphic profile and the energy rises above 4 pi |Q| in both directions, by a quarter and by a half',
    Math.abs(r1 - 1) < 5e-3 && rNarrow > 1.1 && rWide > 1.1,
    `ratio at the holomorphic width ${r1.toFixed(6)}, at half of it ${rNarrow.toFixed(4)}, at twice ${rWide.toFixed(4)} — above one in both directions, which is what a bound does`);
}

console.log('\n4 · Thiele, and the angle the readout had always claimed\n');
{
  let worst = 0;
  for (const s of [1, -1]) for (const alpha of [0.02, 0.1, 0.5]) for (const beta of [0, 0.1, 0.5])
    for (const [vx, vy] of [[1, 0], [0.3, -0.7]]) {
      const v = X.skThieleSolve(s, alpha, beta, 1, vx, vy, 0, 0), G = X.skGyrovector(s);
      const lx = -G * v[1] + alpha * v[0], ly = G * v[0] + alpha * v[1];
      const rx = -G * vy + beta * vx, ry = G * vx + beta * vy;
      worst = Math.max(worst, Math.hypot(lx - rx, ly - ry) / Math.hypot(rx, ry));
    }
  ok('the Thiele solution is the closed-form inverse of its own equation, substituted back in at thirty-six combinations of charge, damping, torque and drive direction',
    worst < 1e-14, `worst relative residual ${worst.toExponential(2)}`);

  /* THE FINDING. */
  const shipped = (a, b) => Math.atan2(4 * Math.PI, Math.max(0.02, a - b));
  const rows = [];
  let allZero = true, shippedNeverZero = true;
  for (const [a, b] of [[0.1, 0.1], [0.3, 0.3], [0.02, 0.02], [1.5, 1.5]]) {
    const th = X.skHallAngle(1, a, b, 1);
    if (Math.abs(th) > 1e-15) allZero = false;
    if (Math.abs(shipped(a, b)) < 1) shippedNeverZero = false;
    rows.push(`alpha = beta = ${a}: correct ${(th * 180 / Math.PI).toFixed(9)} deg, shipped ${(shipped(a, b) * 180 / Math.PI).toFixed(2)} deg`);
  }
  ok('the skyrmion follows the current EXACTLY when beta equals alpha — the angle is zero to floating point at four dampings — and the formula this laboratory printed instead, atan2(G, alpha - beta), is a right angle at every one of them. The readout beneath it has always said the angle vanishes there',
    allZero && shippedNeverZero,
    rows.join(' · '));

  /* and away from that point it has the right sign and the right size */
  const th1 = X.skHallAngle(1, 0.1, 0, 1), th2 = X.skHallAngle(1, 0, 0.1, 1), th3 = X.skHallAngle(-1, 0.1, 0, 1);
  ok('and away from it the angle changes sign with the charge and with beta minus alpha, and is small for a spin-transfer drive — which is the regime it is defined in',
    th1 < 0 && th2 > 0 && th3 > 0 && Math.abs(th1) < 0.02 && Math.abs(Math.abs(th1) - Math.abs(th3)) < 1e-15,
    `alpha 0.1 beta 0: ${(th1 * 180 / Math.PI).toFixed(4)} deg · alpha 0 beta 0.1: ${(th2 * 180 / Math.PI).toFixed(4)} deg · the same with the charge reversed: ${(th3 * 180 / Math.PI).toFixed(4)} deg`);
}

console.log(`\n${fail === 0 ? '✔' : '✗'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
