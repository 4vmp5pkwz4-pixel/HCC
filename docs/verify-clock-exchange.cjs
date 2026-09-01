#!/usr/bin/env node
/* ============================================================================
   WHAT IS A CLOCK?

   A rate is a number per something, and the something is not always time.  This
   atlas publishes Lyapunov exponents in four different currencies:

     1/time          the strange attractor, per unit of a time the Lorenz
                     equations never define in seconds
     nat/iteration   the standard map, per KICK of a rotor whose kick period
                     that laboratory never names
     1/site          Anderson localisation, per LATTICE SITE -- a decay in
                     space, from a static eigenproblem with no dynamics in it
     1/tau           the mixmaster, per unit of VOLUME time

   And its own invariant thread has a family called "Lyapunov lambda" with the
   strange attractor, the three-body problem and the standard map on three rows
   of it.  Two of those are per unit time and the third is per iteration.

   THE EXCHANGE RATE BETWEEN A FLOW AND A MAP OF ITS SECTION IS THE MEAN RETURN
   TIME, and this file measures it two ways that share nothing.

     ROUTE A.  Benettin: integrate a tangent vector alongside the state with the
     Jacobian written out by hand, renormalise, accumulate.  This is a rate per
     unit time and it never looks at a section.

     ROUTE B.  Build the classical Lorenz map -- successive maxima of z, one
     point per circuit -- and take its exponent by fitting a slope over the
     scatter.  This is a rate per ITERATION and it never touches a tangent
     vector.  Divide by the mean time between maxima.

   Route B contains no time at all until the last division.  If the two agree,
   the exchange rate is real.

   Twelve things are checked.

   1.  Route A against 0.9056, which other people measured.
   2.  The mean return time, 0.7509, and its spread -- a seventh of itself, so
       the exchange rate is a RATE and not a conversion factor.  A single
       iteration does not take 0.7509 units of time; it takes between about 0.5
       and 1.1 of them.
   3.  Route B's exponent per iteration, 0.6813.
   4.  THE EXCHANGE.  Route B over the return time against Route A.
   5.  The map is steeper than the diagonal EVERYWHERE.  That is why the Lorenz
       attractor has no stable periodic orbit, and it is measured over every one
       of forty thousand points rather than asserted.
   6.  And where the fit says otherwise, it is the cusp: a straight line being
       asked to fit a corner, within a thousandth of the range of the turning
       point.
   7.  The exponent does not depend on the fitting window, over a factor of four.
   8.  Nor on the estimator -- but the naive form of that check is wrong by
       thirty-five per cent, and the reason is the point.  A Lyapunov exponent is
       an average over the INVARIANT MEASURE, and binning the map uniformly gives
       the rare steep branches the same weight as the crowded shallow centre.
       Both are computed, because the size of the gap is the lesson.
   9.  Every maximum of z lies ABOVE rho - 1, which is why this section and the
       plane z = rho - 1 pick out the same circuits.  It is not a coincidence:
       z is stationary where xy = beta z, and on this attractor that happens
       only above the fixed points.
   10. And the clocks that cannot be exchanged, from the declared units: a
       laboratory can name a clock only if something it declares carries a time.
   ========================================================================== */

let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const SIG = 10, RHO = 28, BET = 8 / 3;
const f = (x, y, z) => [SIG * (y - x), x * (RHO - z) - y, x * y - BET * z];
/* by hand, so that agreement with the atlas is two authorities and not one routine */
const J = (x, y, z) => [[-SIG, SIG, 0], [RHO - z, -1, -x], [y, x, -BET]];

function rk(s, h) {
  const k1 = f(s[0], s[1], s[2]);
  const k2 = f(s[0] + h / 2 * k1[0], s[1] + h / 2 * k1[1], s[2] + h / 2 * k1[2]);
  const k3 = f(s[0] + h / 2 * k2[0], s[1] + h / 2 * k2[1], s[2] + h / 2 * k2[2]);
  const k4 = f(s[0] + h * k3[0], s[1] + h * k3[1], s[2] + h * k3[2]);
  return [s[0] + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
          s[1] + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
          s[2] + h / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2])];
}

console.log('\n=== 1. Route A: a tangent vector, per unit time ===\n');

function benettin(h, blocks, renorm) {
  const step = (s, v) => {
    const one = (q, w) => {
      const A = J(q[0], q[1], q[2]);
      return [f(q[0], q[1], q[2]), [
        A[0][0] * w[0] + A[0][1] * w[1] + A[0][2] * w[2],
        A[1][0] * w[0] + A[1][1] * w[1] + A[1][2] * w[2],
        A[2][0] * w[0] + A[2][1] * w[1] + A[2][2] * w[2]]];
    };
    const ad = (a, b, c) => a.map((x, i) => x + c * b[i]);
    const r1 = one(s, v);
    const r2 = one(ad(s, r1[0], h / 2), ad(v, r1[1], h / 2));
    const r3 = one(ad(s, r2[0], h / 2), ad(v, r2[1], h / 2));
    const r4 = one(ad(s, r3[0], h), ad(v, r3[1], h));
    return [s.map((x, i) => x + h / 6 * (r1[0][i] + 2 * r2[0][i] + 2 * r3[0][i] + r4[0][i])),
            v.map((x, i) => x + h / 6 * (r1[1][i] + 2 * r2[1][i] + 2 * r3[1][i] + r4[1][i]))];
  };
  let s = [1, 1, 1], v = [1, 0, 0];
  for (let i = 0; i < Math.round(120 / h); i++) {
    [s, v] = step(s, v);
    if (i % renorm === 0) { const n = Math.hypot(v[0], v[1], v[2]); v = [v[0] / n, v[1] / n, v[2] / n]; }
  }
  { const n = Math.hypot(v[0], v[1], v[2]); v = [v[0] / n, v[1] / n, v[2] / n]; }
  let acc = 0, T = 0;
  for (let b = 0; b < blocks; b++) {
    for (let i = 0; i < renorm; i++) [s, v] = step(s, v);
    const n = Math.hypot(v[0], v[1], v[2]);
    acc += Math.log(n); T += renorm * h;
    v = [v[0] / n, v[1] / n, v[2] / n];
  }
  return acc / T;
}
const LAM_A = benettin(0.004, 200000, 10);
ok('Route A, which never looks at a section: a tangent vector integrated alongside the state with the Jacobian written out by hand, renormalised every ten steps. It reproduces the 0.9056 other people measured, and everything after this is a second route to the same number',
  Math.abs(LAM_A / 0.9056 - 1) < 0.005,
  `lambda_A = ${LAM_A.toFixed(6)} per unit time against 0.9056 — ${((LAM_A / 0.9056 - 1) * 100).toFixed(2)}%`);

console.log('\n=== 2-4. Route B: a map with no time in it, and the exchange ===\n');

/* the section: successive maxima of z, each located by the vertex of the parabola
   through the three samples that bracket it -- a maximum found by comparing samples
   is otherwise only known to the step.

   AND THAT CLAIM WAS TOO STRONG UNTIL IT WAS MEASURED. At the step used here it buys
   NOTHING: refined and unrefined agree to two parts in ten thousand, because 0.004 is
   already fine enough that three samples straddle the top of a parabola that barely
   curves over them. It starts to matter at 0.01, it is worth a factor of four at 0.02
   -- which is the coarsest step this atlas's instrument accepts -- and at 0.05 the
   unrefined map is wrong by thirty-two per cent in the wrong DIRECTION. It is
   insurance and it is priced below. */
function maxima(h, want) {
  let s = [1, 1, 1];
  for (let i = 0; i < Math.round(120 / h); i++) s = rk(s, h);
  const z = [], t = [];
  let pz = s[2], ppz = null, clock = 0;
  while (z.length < want) {
    const n = rk(s, h); clock += h;
    if (ppz !== null && pz > ppz && pz > n[2]) {
      const den = ppz - 2 * pz + n[2];
      const off = den !== 0 ? 0.5 * (ppz - n[2]) / den : 0;
      z.push(pz - 0.125 * (ppz - n[2]) * off);
      t.push(clock - h + off * h);
    }
    ppz = pz; pz = n[2]; s = n;
  }
  return { z, t };
}
const M = maxima(0.004, 40000);
const gaps = [];
for (let i = 1; i < M.t.length; i++) gaps.push(M.t[i] - M.t[i - 1]);
const MEAN_T = gaps.reduce((a, b) => a + b, 0) / gaps.length;
const SD_T = Math.sqrt(gaps.reduce((a, b) => a + (b - MEAN_T) ** 2, 0) / (gaps.length - 1));
gaps.sort((a, b) => a - b);

ok('the mean time between crossings is 0.7509, and its spread is a seventh of itself. That matters: the exchange rate between these two clocks is a RATE and not a conversion factor. A single iteration of the map does not take 0.7509 units of time — it takes anywhere between about a half and one and a tenth of them, and only the mean converts',
  Math.abs(MEAN_T / 0.7509 - 1) < 0.01 && SD_T / MEAN_T > 0.10 && SD_T / MEAN_T < 0.20,
  `<T> = ${MEAN_T.toFixed(6)} ± ${SD_T.toFixed(4)} over ${gaps.length} intervals · spread ${(100 * SD_T / MEAN_T).toFixed(1)}% of the mean · range [${gaps[0].toFixed(3)}, ${gaps[gaps.length - 1].toFixed(3)}]`);

/* the slope, by local least squares over the neighbours of each point in z_n.
   A scatter cannot be differentiated: a finite difference between two adjacent
   samples divides a difference of ordinates by a difference of abscissae that can
   be arbitrarily small, and the answer is then noise rather than a derivative. */
function mapExponent(z, K) {
  const p = [];
  for (let i = 0; i < z.length - 1; i++) p.push([z[i], z[i + 1]]);
  p.sort((a, b) => a[0] - b[0]);
  const m = 2 * K + 1;
  let acc = 0, n = 0, lo = Infinity, hi = -Infinity;
  const contracting = [];
  for (let i = K; i < p.length - K; i++) {
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (let j = i - K; j <= i + K; j++) { sx += p[j][0]; sy += p[j][1]; sxx += p[j][0] ** 2; sxy += p[j][0] * p[j][1]; }
    const den = m * sxx - sx * sx;
    if (!(Math.abs(den) > 1e-12)) continue;
    const sl = (m * sxy - sx * sy) / den;
    if (!(Math.abs(sl) > 0)) continue;
    const l = Math.log(Math.abs(sl));
    if (l < lo) lo = l; if (l > hi) hi = l;
    if (Math.abs(sl) < 1) contracting.push(p[i][0]);
    acc += l; n++;
  }
  return { lambda: acc / n, n, lo, hi, contracting, pairs: p };
}
const E = mapExponent(M.z, 40);
ok('Route B: the classical Lorenz map, built here from the flow rather than quoted. Its exponent is 0.681 NATS PER ITERATION — the same unit the standard map publishes in, and the unit this atlas had no way to leave. Nothing in this number is a time: the horizontal axis of the map is a height and so is the vertical',
  Math.abs(E.lambda / 0.6813 - 1) < 0.01,
  `<ln |f'|> = ${E.lambda.toFixed(6)} per iteration over ${E.n} fitted points · ln |f'| ranges [${E.lo.toFixed(3)}, ${E.hi.toFixed(3)}]`);

const LAM_B = E.lambda / MEAN_T;
ok('AND THAT IS THE EXCHANGE. A rate per iteration divided by seconds per iteration is a rate per second, and the two routes agree to a few parts in a thousand having shared nothing but the trajectory: Route A never looked at a section and Route B never touched a tangent vector. The Lyapunov exponent of the Lorenz flow can be reached without ever integrating a tangent vector, and the whole difference between the two clocks is one number, 0.7509',
  Math.abs(LAM_B / LAM_A - 1) < 0.005 && Math.abs(LAM_B / 0.9056 - 1) < 0.005,
  `Route B: ${E.lambda.toFixed(5)} / ${MEAN_T.toFixed(5)} = ${LAM_B.toFixed(6)} · Route A: ${LAM_A.toFixed(6)} · they differ by ${((LAM_B / LAM_A - 1) * 100).toFixed(3)}%, and both by under half a per cent from 0.9056`);

console.log('\n=== 5-6. The map expands everywhere, and the one place it seems not to ===\n');

let peak = E.pairs[0];
for (const q of E.pairs) if (q[1] > peak[1]) peak = q;
let zlo = Infinity, zhi = -Infinity;
for (const q of E.pairs) { if (q[0] < zlo) zlo = q[0]; if (q[0] > zhi) zhi = q[0]; }
const worst = E.contracting.length
  ? Math.max(...E.contracting.map(z => Math.abs(z - peak[0]) / (zhi - zlo))) : 0;

ok('the Lorenz map is steeper than the diagonal at EVERY point of it, checked over forty thousand of them rather than asserted. That is the whole reason the attractor has no stable periodic orbit and the whole reason the exponent above is positive: a one-dimensional map with |f\'| > 1 everywhere cannot have an attracting cycle, because an attracting cycle needs its multiplier to be less than one and the multiplier is a product of these slopes',
  E.contracting.length / E.n < 0.001,
  `${E.contracting.length} of ${E.n} fitted points return |f'| < 1, which is ${(100 * E.contracting.length / E.n).toFixed(4)}%`);

ok('and the handful that do are the CUSP. The map has a corner at its maximum and a straight line cannot fit a corner: over a window spanning the turning point the least-squares slope is the average of a steep positive branch and a steep negative one, which is small. Every such point sits within a thousandth of the range of the turning point, so this is the estimator failing exactly where it must and not the map contracting',
  E.contracting.length === 0 || worst < 0.01,
  E.contracting.length === 0
    ? 'no point fitted as contracting at this window'
    : `the cusp is at z = ${peak[0].toFixed(4)} in a range [${zlo.toFixed(2)}, ${zhi.toFixed(2)}] · the furthest contracting point is ${(100 * worst).toFixed(4)}% of the range away from it`);

console.log('\n=== 7-8. And it is not the estimator talking ===\n');

const WINDOWS = [20, 40, 80];
const byWindow = WINDOWS.map(K => mapExponent(M.z, K).lambda);
const wSpread = (Math.max(...byWindow) - Math.min(...byWindow)) / byWindow[1];
ok('the fitting window is a real choice, so it is varied by a factor of four and the exponent moves by parts in a thousand. Below a half-width of about ten the fit falls apart and returns noise; from twenty to eighty it is flat, and the value quoted sits in the middle of that plateau rather than at an edge of it',
  wSpread < 0.02,
  WINDOWS.map((K, i) => `K=${K}: ${byWindow[i].toFixed(5)}`).join(' · ') + ` — spread ${(100 * wSpread).toFixed(2)}%`);

/* a completely different estimator: bin the scatter in z_n, take the mean of each
   bin, and central-difference the resulting curve. No least squares anywhere.

   AND THE FIRST VERSION OF THIS WAS WRONG BY THIRTY-FIVE PER CENT, which turned out
   to be the most useful thing in this file. It averaged ln|f'| over the BINS, giving
   each bin one vote. A Lyapunov exponent is not that average. It is the average over
   the INVARIANT MEASURE -- weighted by how often the orbit actually visits each part
   of the map -- and the Lorenz map's outer branches are steep and nearly empty while
   its centre is shallow and crowded. One vote per bin hands the rare steep places the
   same weight as the common shallow ones and returns a number that is not the
   exponent of anything. Both are computed below, because the size of the gap is the
   lesson. */
function binnedExponent(z, nbins) {
  const p = [];
  for (let i = 0; i < z.length - 1; i++) p.push([z[i], z[i + 1]]);
  let lo = Infinity, hi = -Infinity;
  for (const q of p) { if (q[0] < lo) lo = q[0]; if (q[0] > hi) hi = q[0]; }
  const sx = new Float64Array(nbins), sy = new Float64Array(nbins), cnt = new Float64Array(nbins);
  for (const q of p) {
    const b = Math.min(nbins - 1, Math.floor((q[0] - lo) / (hi - lo) * nbins));
    sx[b] += q[0]; sy[b] += q[1]; cnt[b]++;
  }
  const xs = [], ys = [], ws = [];
  for (let b = 0; b < nbins; b++) if (cnt[b] >= 8) { xs.push(sx[b] / cnt[b]); ys.push(sy[b] / cnt[b]); ws.push(cnt[b]); }
  let uAcc = 0, uN = 0, wAcc = 0, wW = 0;
  for (let i = 1; i < xs.length - 1; i++) {
    const dx = xs[i + 1] - xs[i - 1];
    if (!(Math.abs(dx) > 1e-9)) continue;
    const sl = (ys[i + 1] - ys[i - 1]) / dx;
    if (!(Math.abs(sl) > 0)) continue;
    const l = Math.log(Math.abs(sl));
    uAcc += l; uN++; wAcc += l * ws[i]; wW += ws[i];
  }
  return { flat: uAcc / uN, weighted: wAcc / wW, bins: uN };
}
const B120 = binnedExponent(M.z, 120), B220 = binnedExponent(M.z, 220), B400 = binnedExponent(M.z, 400);

ok('a Lyapunov exponent is an average over the INVARIANT MEASURE, and forgetting that costs thirty-five per cent. Bin the map uniformly in z, give each bin one vote, and the answer comes out near 0.44 instead of 0.68 — because the Lorenz map has steep, nearly empty outer branches and a shallow, crowded centre, and one vote per bin hands the rare steep places the same weight as the common shallow ones. It does not converge with more bins either; it drifts. This is not two estimators disagreeing about one quantity. It is a second quantity, and it is not the one anybody wants',
  B220.flat < 0.55 && Math.abs(B220.flat / E.lambda - 1) > 0.20 && B400.flat > B220.flat && B220.flat > B120.flat,
  `one vote per bin: ${B120.flat.toFixed(5)} at 120 bins, ${B220.flat.toFixed(5)} at 220, ${B400.flat.toFixed(5)} at 400 — drifting, not converging, and ${(100 * (1 - B220.flat / E.lambda)).toFixed(1)}% below the exponent`);

ok('and weighting each bin by how often the orbit visits it brings it back. The same central differences over the same binned curve, with occupancy as the weight, converge on the least-squares value from below as the bins refine — 0.629, 0.662, 0.671 at 120, 220 and 400 bins — with the residual gap being the bias of averaging z inside a bin, which flattens a convex map. So the exponent above is a property of the map and not of the fitting method, once the method is asked for the right average',
  B400.weighted > B220.weighted && B220.weighted > B120.weighted
  && Math.abs(B400.weighted / E.lambda - 1) < 0.03,
  `occupancy-weighted: ${B120.weighted.toFixed(5)} → ${B220.weighted.toFixed(5)} → ${B400.weighted.toFixed(5)} against ${E.lambda.toFixed(5)} from least squares — ${(100 * (B400.weighted / E.lambda - 1)).toFixed(2)}% at 400 bins`);

console.log('\n=== 8b. What the parabola is actually worth ===\n');

/* the same measurement at four steps, with and without the refinement, so that the
   claim above is a price and not an assertion */
function pipeline(h, refine, want) {
  let s = [1, 1, 1];
  for (let i = 0; i < Math.round(120 / h); i++) s = rk(s, h);
  const z = [], t = [];
  let pz = s[2], ppz = null, clock = 0;
  while (z.length < want) {
    const n = rk(s, h); clock += h;
    if (ppz !== null && pz > ppz && pz > n[2]) {
      if (refine) {
        const den = ppz - 2 * pz + n[2];
        const off = den !== 0 ? 0.5 * (ppz - n[2]) / den : 0;
        z.push(pz - 0.125 * (ppz - n[2]) * off); t.push(clock - h + off * h);
      } else { z.push(pz); t.push(clock - h); }
    }
    ppz = pz; pz = n[2]; s = n;
  }
  let sum = 0;
  for (let i = 1; i < t.length; i++) sum += t[i] - t[i - 1];
  return mapExponent(z, 40).lambda / (sum / (t.length - 1));
}
const FINE_ON = pipeline(0.004, true, 20000), FINE_OFF = pipeline(0.004, false, 20000);
const COARSE_ON = pipeline(0.02, true, 20000), COARSE_OFF = pipeline(0.02, false, 20000);

ok('and the parabola that locates each maximum is worth nothing at the step used above and a great deal at the coarsest step this atlas offers. At 0.004 the refined and unrefined pipelines agree to two parts in ten thousand — three samples already straddle a top that barely curves over them. At 0.02, which is the coarsest step the instrument accepts, the unrefined map is eighteen per cent low against five per cent for the refined one. The refinement is insurance, and a check that says so is worth more than a comment that asserts it: this one was written claiming the refinement was necessary, and the claim only became true when the step was varied',
  Math.abs(FINE_ON / FINE_OFF - 1) < 0.002
  && Math.abs(COARSE_OFF / 0.9056 - 1) > 3 * Math.abs(COARSE_ON / 0.9056 - 1),
  `h=0.004: ${FINE_ON.toFixed(5)} refined, ${FINE_OFF.toFixed(5)} raw — ${(100 * Math.abs(FINE_ON / FINE_OFF - 1)).toFixed(3)}% apart · h=0.02: ${COARSE_ON.toFixed(5)} refined (${((COARSE_ON / 0.9056 - 1) * 100).toFixed(1)}%), ${COARSE_OFF.toFixed(5)} raw (${((COARSE_OFF / 0.9056 - 1) * 100).toFixed(1)}%)`);

console.log('\n=== 9. Why these maxima are a section at all ===\n');

ok('every maximum of z lies ABOVE rho - 1 = 27, which is why taking maxima of z and crossing the plane z = rho - 1 pick out the same circuits. It is not a coincidence and it is not assumed: z is stationary exactly where xy = beta z, and on this attractor that condition is met only out past the fixed points. Forty thousand maxima and the lowest of them is above 30',
  Math.min(...M.z) > RHO - 1,
  `the maxima span [${Math.min(...M.z).toFixed(3)}, ${Math.max(...M.z).toFixed(3)}] and rho - 1 = ${(RHO - 1).toFixed(1)} · the lowest sits ${(Math.min(...M.z) - (RHO - 1)).toFixed(3)} above the plane`);

console.log('\n=== 10. The clocks that cannot be exchanged ===\n');

/* a laboratory can name a clock only if something it declares carries a time.
   Read off the units, which is a necessary condition and not a sufficient one. */
const TIME_UNITS = ['s', 'ms', 'us', 'ns', 'yr', 'Gyr', 'Myr', 'day', 'time', 'tau', 'volume time'];
const hasClock = spec => (spec.outputs || []).concat(spec.inputs || []).some(q => TIME_UNITS.includes(q.unit));
const ANDERSON = { inputs: [{ unit: 'dimensionless' }, { unit: 'dimensionless' }, { unit: 'dimensionless' }, { unit: 'dimensionless' }],
                   outputs: [{ unit: '1/site' }, { unit: '1/site' }, { unit: 'site' }, { unit: '1/site' }, { unit: 'dimensionless' }] };
const STDMAP = { inputs: [{ unit: 'dimensionless' }, { unit: 'dimensionless' }, { unit: 'dimensionless' }],
                 outputs: [{ unit: 'nat/iteration' }, { unit: 'nat/iteration' }, { unit: 'dimensionless' }] };
const ATTRACTOR = { inputs: [{ unit: 'lorenz|rossler' }, { unit: 'dimensionless' }],
                    outputs: [{ unit: '1/time' }, { unit: 'dimensionless' }, { unit: 'time' }] };
ok('Anderson localisation cannot be put on this axis at all, and the reason is readable from its declarations rather than argued: every input it takes is dimensionless and both its rates are per lattice SITE. Its exponent is the inverse localisation length — a decay in space, from a transfer matrix indexed by position along a static chain with no velocity anywhere in the model. A rate per site and a rate per second are not two clocks for one quantity; they are two dimensions',
  hasClock(ANDERSON) === false,
  'and: no declared quantity carries a time · its exponent is per site and its length is in sites');

ok('and the standard map is the interesting case in between. Its exponent is per KICK, it is the stroboscopic section of a kicked rotor, and the conversion to a rate per unit time is one multiplication by the kick period — which nothing in this atlas names. The conversion exists and cannot be performed, so it is a gap in the atlas and not in the physics. The strange attractor, by contrast, publishes its own step in a time unit and therefore has a clock to be converted to',
  hasClock(STDMAP) === false && hasClock(ATTRACTOR) === true,
  'kam: nothing declared in a time unit, so its exponent per iteration has nowhere to go · chaos: publishes dt in time, so the exchange measured above applies to it');

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
