#!/usr/bin/env node
/* ============================================================================
   HOW LONG DOES A FORECAST LAST?

   Four laboratories of this atlas publish a rate in inverse time.  The
   reaction-diffusion bench publishes the growth rate of its fastest Turing mode
   and the trace of its Jacobian; the strange attractor publishes the divergence
   of the flow, the spread of that divergence and the largest Lyapunov exponent;
   the charged particle publishes its gyrofrequency; the mixmaster publishes an
   exponent at one window and the same exponent at twice the window.  EIGHT
   publications in inverse time, and in a hundred laboratories not one instrument
   ever took a rate as an input.

   There is one thing a positive SEPARATION rate is for:

       t_pred = ln(Delta / eps_0) / lambda

   This file checks that laboratory against things nobody here chose.  It shares
   no code with the atlas: the Lorenz Jacobian below is differentiated BY HAND,
   where the atlas differentiates it numerically, so agreement between them is
   two authorities and not one routine run twice.

   Ten things are checked.

   1.  THE SUM RULE.  The Lyapunov exponents of a flow must sum to the divergence
       of that flow.  For Lorenz the divergence is -(sigma + 1 + beta) exactly and
       everywhere, so the sum has a closed form to be checked against.  It agrees
       to one part in a million -- and then the step is halved three times and the
       residual is watched falling by sixteen each time, which identifies what is
       left as the fourth-order error of RK4 rather than leaving it as a number
       nobody looked into.  A residual is not understood until its SOURCE is.

   2.  THE ZERO EXPONENT.  A flow carries one exponent that is exactly zero: the
       direction along the trajectory, in which neighbours neither separate nor
       converge.  It is measured, not assumed.

   3.  THE LARGEST, against 0.9056, which other people measured.

   4.  THE DIMENSION.  Kaplan-Yorke from the whole spectrum, against 2.062.

   5.  THE HORIZON AGAINST AN ENSEMBLE.  ln(Delta/eps_0)/lambda predicts the
       MEDIAN time a pair of twins takes to reach the tolerance.  Sixty-four twins
       are released and timed, and the formula is required to land inside the
       range they actually produce -- not near their mean, INSIDE their range,
       which is the honest statement of what a median prediction means.

   6.  THE SATURATION LEVEL IS NOT THE BOUNDING BOX.  The error stops growing at
       the separation two INDEPENDENT points on the attractor typically have.  The
       diagonal of the bounding box is three and a half times larger and no pair of
       points ever realises it; using it puts the horizon out by more than an
       e-folding.  Both numbers are measured here.

   7.  THE EXPONENT IS NOT A NUMBER.  Over a window of 0.06 time units the local
       Lorenz exponent is NEGATIVE more than 45% of the time: a chaotic system
       spends about half its life locally contracting.  The MEAN is the same to
       four digits at every window from 0.06 to 500, which is what ergodic means.

   8.  THE SPREAD OF THAT DISTRIBUTION.  Large-deviation theory says the width
       falls as one over the square root of the window.  It does not, over the
       windows a forecast lives in: up to about fifteen time units it falls as
       one over the window itself, which is a boundary term rather than a
       diffusive one, and it only starts bending towards a half power after about
       a hundred Lyapunov times.  What is checked is the part that is resolvable
       at this sample size -- the short-window exponent near one -- and the fact
       that the long-window exponent is smaller.  The half power itself is NOT
       claimed, because at this sample size it is not resolved.

   9.  THE REFUSAL THAT CAN BE WATCHED.  A cyclotron frequency carries inverse
       time and is not a separation rate.  Two particles started a micron apart in
       a uniform magnetic field are integrated with a Boris pusher and their
       separation is required not to grow.  A rate of a hundred gigahertz, and an
       infinite predictability horizon.
   ========================================================================== */

let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

/* ── LORENZ, WITH THE JACOBIAN DIFFERENTIATED BY HAND ────────────────────────
   The atlas takes this matrix by central differences. Writing it out here means
   an error in either one shows up as a disagreement rather than as a shared
   answer, which is the only reason to have two of them. */
const SIG = 10, RHO = 28, BET = 8 / 3, H = 0.006, RENORM = 10;
const f = (x, y, z) => [SIG * (y - x), x * (RHO - z) - y, x * y - BET * z];
const J = (x, y, z) => [[-SIG, SIG, 0], [RHO - z, -1, -x], [y, x, -BET]];
const DIV_EXACT = -(SIG + 1 + BET);

function step(s, V) {
  const one = (q, W) => {
    const A = J(q[0], q[1], q[2]);
    return [f(q[0], q[1], q[2]), W.map(v => [
      A[0][0] * v[0] + A[0][1] * v[1] + A[0][2] * v[2],
      A[1][0] * v[0] + A[1][1] * v[1] + A[1][2] * v[2],
      A[2][0] * v[0] + A[2][1] * v[1] + A[2][2] * v[2]])];
  };
  const ad = (a, b, c) => a.map((x, i) => x + c * b[i]);
  const adV = (A, B, c) => A.map((v, i) => ad(v, B[i], c));
  const r1 = one(s, V);
  const r2 = one(ad(s, r1[0], H / 2), adV(V, r1[1], H / 2));
  const r3 = one(ad(s, r2[0], H / 2), adV(V, r2[1], H / 2));
  const r4 = one(ad(s, r3[0], H), adV(V, r3[1], H));
  return [s.map((x, i) => x + H / 6 * (r1[0][i] + 2 * r2[0][i] + 2 * r3[0][i] + r4[0][i])),
          V.map((v, k) => v.map((x, i) => x + H / 6 * (r1[1][k][i] + 2 * r2[1][k][i] + 2 * r3[1][k][i] + r4[1][k][i])))];
}
function rk(s) {
  const k1 = f(s[0], s[1], s[2]);
  const k2 = f(s[0] + H / 2 * k1[0], s[1] + H / 2 * k1[1], s[2] + H / 2 * k1[2]);
  const k3 = f(s[0] + H / 2 * k2[0], s[1] + H / 2 * k2[1], s[2] + H / 2 * k2[2]);
  const k4 = f(s[0] + H * k3[0], s[1] + H * k3[1], s[2] + H * k3[2]);
  return [s[0] + H / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
          s[1] + H / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
          s[2] + H / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2])];
}
function gs(V) {
  const n = [], m = [];
  for (let k = 0; k < V.length; k++) {
    let v = V[k].slice();
    for (let j = 0; j < k; j++) {
      const d = v[0] * n[j][0] + v[1] * n[j][1] + v[2] * n[j][2];
      v = [v[0] - d * n[j][0], v[1] - d * n[j][1], v[2] - d * n[j][2]];
    }
    const q = Math.hypot(v[0], v[1], v[2]);
    m.push(q); n.push([v[0] / q, v[1] / q, v[2] / q]);
  }
  return [n, m];
}

console.log('\n=== 1-4. The spectrum, and the three things it must satisfy ===\n');

/* the per-renormalisation log stretch of all three directions, kept, so that the
   window study in check 7 and 8 reads the SAME trajectory the spectrum came from */
const NBLK = 700000;
let s = [1, 1, 1], V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
for (let i = 0; i < 40000; i++) { [s, V] = step(s, V); if (i % RENORM === 0) V = gs(V)[0]; }
V = gs(V)[0];
const g0 = new Float64Array(NBLK);
const acc = [0, 0, 0];
const DT = RENORM * H;
for (let k = 0; k < NBLK; k++) {
  for (let i = 0; i < RENORM; i++) [s, V] = step(s, V);
  const q = gs(V); V = q[0];
  g0[k] = Math.log(q[1][0]);
  for (let j = 0; j < 3; j++) acc[j] += Math.log(q[1][j]);
}
const T = NBLK * DT;
const lam = acc.map(a => a / T).sort((a, b) => b - a);
const sum = lam[0] + lam[1] + lam[2];

ok('the exponents SUM to the divergence of the flow, and for Lorenz the divergence is -(sigma + 1 + beta) = -13.666667 exactly, everywhere, with no averaging in it. This is the one check on a Lyapunov spectrum with a closed form on the other side of it, and the sum agrees to one part in a million',
  Math.abs(sum - DIV_EXACT) < 3e-5,
  `sum = ${sum.toFixed(9)} · -(sigma+1+beta) = ${DIV_EXACT.toFixed(9)} · residual ${Math.abs(sum - DIV_EXACT).toExponential(3)} = ${(Math.abs(sum / DIV_EXACT - 1)).toExponential(2)} relative`);

/* ── AND THE PART THAT WOULD OTHERWISE BE A SHRUG ───────────────────────────
   One part in a million is a number, not a verdict. A residual is only understood
   when its SOURCE is identified, and the way to identify this one is to change the
   step and watch. If it is the integrator, it falls as the integrator's order; if
   it is the spectrum, it does not move. */
function sumRuleAt(h) {
  const renorm = Math.max(1, Math.round(0.06 / h));
  const stepH = (st, W) => {
    const one = (qq, Q) => {
      const A = J(qq[0], qq[1], qq[2]);
      return [f(qq[0], qq[1], qq[2]), Q.map(v => [
        A[0][0] * v[0] + A[0][1] * v[1] + A[0][2] * v[2],
        A[1][0] * v[0] + A[1][1] * v[1] + A[1][2] * v[2],
        A[2][0] * v[0] + A[2][1] * v[1] + A[2][2] * v[2]])];
    };
    const ad = (a, b, c) => a.map((x, i) => x + c * b[i]);
    const adV = (A, B, c) => A.map((v, i) => ad(v, B[i], c));
    const a1 = one(st, W);
    const a2 = one(ad(st, a1[0], h / 2), adV(W, a1[1], h / 2));
    const a3 = one(ad(st, a2[0], h / 2), adV(W, a2[1], h / 2));
    const a4 = one(ad(st, a3[0], h), adV(W, a3[1], h));
    return [st.map((x, i) => x + h / 6 * (a1[0][i] + 2 * a2[0][i] + 2 * a3[0][i] + a4[0][i])),
            W.map((v, k) => v.map((x, i) => x + h / 6 * (a1[1][k][i] + 2 * a2[1][k][i] + 2 * a3[1][k][i] + a4[1][k][i])))];
  };
  let st = [1, 1, 1], W = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const warm = Math.round(240 / h);
  for (let i = 0; i < warm; i++) { [st, W] = stepH(st, W); if (i % renorm === 0) W = gs(W)[0]; }
  W = gs(W)[0];
  const a = [0, 0, 0];
  let tt = 0;
  const N = Math.round(4000 / h);
  for (let i = 0; i < N; i++) {
    [st, W] = stepH(st, W);
    if ((i + 1) % renorm === 0) {
      const gq = gs(W); W = gq[0];
      for (let k = 0; k < 3; k++) a[k] += Math.log(gq[1][k]);
      tt += renorm * h;
    }
  }
  return Math.abs((a[0] + a[1] + a[2]) / tt - DIV_EXACT);
}
const STEPS_H = [0.012, 0.006, 0.003, 0.0015];
const res = STEPS_H.map(sumRuleAt);
const ratios = [];
for (let i = 1; i < res.length; i++) ratios.push(res[i - 1] / res[i]);

ok('and that residual is the INTEGRATOR and not the spectrum, which is shown by halving the step three times and watching it fall by a factor of sixteen each time. Sixteen is two to the fourth and RK4 is a fourth-order method, so the sum rule is exact and what is left of it is the step size — a residual whose source has been identified rather than tolerated. Nothing about the exponents changes; only the arithmetic used to reach them does',
  ratios.every(r => r > 13 && r < 19),
  STEPS_H.map((h, i) => `h=${h}: ${res[i].toExponential(3)}`).join(' · ') + ` · ratios ${ratios.map(r => r.toFixed(2)).join(', ')} against 16.00`);

ok('a FLOW carries an exponent that is exactly zero — the direction along the trajectory, in which two neighbours neither separate nor converge, because they are the same trajectory a moment apart. It is not put in by hand anywhere; it comes out of the Gram-Schmidt norms',
  Math.abs(lam[1]) < 5e-4,
  `lambda_2 = ${lam[1].toExponential(3)}, against a first exponent of ${lam[0].toFixed(5)} — smaller by a factor of ${(Math.abs(lam[0] / lam[1])).toExponential(1)}`);

ok('and the largest reproduces the value other people measured: 0.9056 per unit time for the Lorenz system at the classical parameters. Nothing in this file was tuned to hit it',
  Math.abs(lam[0] / 0.9056 - 1) < 0.005,
  `lambda_1 = ${lam[0].toFixed(5)} against 0.9056 — ${((lam[0] / 0.9056 - 1) * 100).toFixed(2)}%`);

/* Kaplan-Yorke, as DEFINED: find the largest j whose partial sum is still positive */
let ps = 0, jj = 0;
for (let k = 0; k < 3; k++) { if (ps + lam[k] < 0) break; ps += lam[k]; jj = k + 1; }
const DKY = jj + ps / Math.abs(lam[jj]);
ok('the Kaplan-Yorke dimension of the Lorenz attractor is 2.062, and it is computed from the DEFINITION — the largest j whose partial sum is still positive, then interpolate — rather than from the three-exponent shortcut. The branch comes out at j = 2 here, which is what the shortcut assumes; the point of computing it is that for a limit cycle it does not',
  jj === 2 && Math.abs(DKY / 2.062 - 1) < 0.002,
  `D_KY = ${DKY.toFixed(5)} at branch j = ${jj}, against 2.062`);

console.log('\n=== 5. The horizon, against twins that were actually timed ===\n');

/* the separation two INDEPENDENT points on the attractor typically have */
let q = [1, 1, 1];
for (let i = 0; i < 20000; i++) q = rk(q);
const pts = [];
const bb = [[Infinity, -Infinity], [Infinity, -Infinity], [Infinity, -Infinity]];
for (let i = 0; i < 4000 * 37; i++) {
  q = rk(q);
  if (i % 37 === 0) {
    pts.push(q.slice());
    for (let k = 0; k < 3; k++) { if (q[k] < bb[k][0]) bb[k][0] = q[k]; if (q[k] > bb[k][1]) bb[k][1] = q[k]; }
  }
}
const half = pts.length >> 1;
let s2 = 0;
for (let i = 0; i < pts.length; i++) {
  const a = pts[i], b = pts[(i + half) % pts.length];
  s2 += (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}
const RMS = Math.sqrt(s2 / pts.length);
const BOX = Math.hypot(bb[0][1] - bb[0][0], bb[1][1] - bb[1][0], bb[2][1] - bb[2][0]);

const EPS0 = 1e-9, TOL = RMS / 2;
const PRED = Math.log(TOL / EPS0) / lam[0];
const times = [];
let w = [1, 1, 1];
for (let i = 0; i < 20000; i++) w = rk(w);
for (let c = 0; c < 64; c++) {
  for (let i = 0; i < 400; i++) w = rk(w);
  let a = w.slice();
  const th = 2 * Math.PI * c / 64, ph = Math.acos(1 - 2 * ((c * 0.6180339887) % 1));
  let b = [a[0] + EPS0 * Math.sin(ph) * Math.cos(th), a[1] + EPS0 * Math.sin(ph) * Math.sin(th), a[2] + EPS0 * Math.cos(ph)];
  for (let i = 0; i < 120000; i++) {
    a = rk(a); b = rk(b);
    if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) >= TOL) { times.push(i * H); break; }
  }
}
times.sort((x, y) => x - y);
const MED = times[times.length >> 1];

ok('the horizon formula predicts the MEDIAN of an ensemble and not any single forecast, so it is checked against one. Sixty-four twins are released a nanometre apart in sixty-four different directions and each is timed to the tolerance. The formula lands inside the range they produce and within ten per cent of their median, and the range itself is the point: predictability is unpredictable by about a quarter of its own value, so a horizon quoted to three digits is quoted past what it means',
  times.length === 64 && PRED > times[0] && PRED < times[times.length - 1] && Math.abs(PRED / MED - 1) < 0.10,
  `formula ${PRED.toFixed(2)} · measured median ${MED.toFixed(2)} over ${times.length} twins, range [${times[0].toFixed(2)}, ${times[times.length - 1].toFixed(2)}] — the formula is ${((PRED / MED - 1) * 100).toFixed(1)}% from the median`);

console.log('\n=== 6. What the error saturates at, which is not the bounding box ===\n');

ok('the error stops growing at the separation two INDEPENDENT points on the attractor typically have, which is 20.7. The diagonal of the bounding box is 73.8 and no pair of points on the attractor ever realises it, because the corners of a box around a butterfly are empty. Taking the box for the saturation level overstates the tolerance by a factor of three and a half, which is one and a third e-foldings of horizon — a real error of about a Lyapunov time and a half, made by using a bound where a measurement was needed',
  Math.abs(RMS / 20.66 - 1) < 0.05 && BOX / RMS > 3.0 && BOX / RMS < 4.0,
  `typical separation ${RMS.toFixed(3)} · box diagonal ${BOX.toFixed(3)} · ratio ${(BOX / RMS).toFixed(3)} · the horizon differs by ${(Math.log(BOX / RMS) / lam[0]).toFixed(2)} time units`);

console.log('\n=== 7-8. The exponent is a distribution, and how its width falls ===\n');

function blocks(m) {
  const n = (NBLK / m) | 0;
  const b = new Float64Array(n);
  let mean = 0;
  for (let i = 0; i < n; i++) { let a = 0; for (let k = 0; k < m; k++) a += g0[i * m + k]; b[i] = a / (m * DT); mean += b[i]; }
  mean /= n;
  let v = 0, neg = 0;
  for (let i = 0; i < n; i++) { v += (b[i] - mean) ** 2; if (b[i] < 0) neg++; }
  v /= (n - 1);
  return { T: m * DT, n, mean, sd: Math.sqrt(v), negative: neg / n };
}
const rows = [];
for (let m = 1; m <= 32768; m *= 2) { const r = blocks(m); if (r.n < 80) break; rows.push(r); }
const finest = rows[0], coarsest = rows[rows.length - 1];
const meanSpread = Math.max(...rows.map(r => r.mean)) - Math.min(...rows.map(r => r.mean));

ok('over a window of six hundredths of a time unit the local Lorenz exponent is NEGATIVE about half the time. A chaotic system spends nearly as long locally contracting as locally expanding, and calling it chaotic is a statement about the AVERAGE and about nothing you would see by looking at it for a moment',
  finest.negative > 0.45 && finest.negative < 0.55,
  `at T = ${finest.T.toFixed(3)} the exponent is negative in ${(100 * finest.negative).toFixed(1)}% of ${finest.n} windows, and ranges over several units either side of a mean of ${finest.mean.toFixed(4)}`);

ok('and the MEAN is the same at every window from six hundredths to five hundred time units, to four decimal places, over four decades of averaging length. That is what ergodic means and it is measured here rather than assumed: if the mean drifted with the window, the number called the Lyapunov exponent would depend on how long you looked',
  meanSpread < 5e-4,
  `mean over ${rows.length} window lengths from ${rows[0].T.toFixed(3)} to ${coarsest.T.toFixed(1)}: spread ${meanSpread.toExponential(2)}, all of them ${rows[0].mean.toFixed(4)}`);

/* the local power-law exponent of the width, at short windows and at long ones */
function slope(a, b) { return Math.log(a.sd / b.sd) / Math.log(b.T / a.T); }
const shortRows = rows.filter(r => r.T >= 3 && r.T <= 20);
const longRows = rows.filter(r => r.T >= 120);
const pShort = slope(shortRows[0], shortRows[shortRows.length - 1]);
const pLong = longRows.length >= 2 ? slope(longRows[0], longRows[longRows.length - 1]) : NaN;

ok('the width of that distribution does NOT fall as one over the square root of the window over the range a forecast lives in. Between three and twenty time units it falls as one over the window itself, which is a boundary term and not a diffusive one: the accumulated log-stretch differs from lambda*T by an amount that stays bounded, so dividing by T is all that shrinks it. The half power large-deviation theory predicts only starts appearing after about a hundred Lyapunov times, and this file does NOT claim to resolve it — it claims the short-window exponent is near one and the long-window exponent is smaller, which is what the sample size supports',
  pShort > 0.85 && pShort < 1.10 && pLong < pShort,
  `sd ~ T^-${pShort.toFixed(3)} over T in [${shortRows[0].T.toFixed(2)}, ${shortRows[shortRows.length - 1].T.toFixed(1)}] · T^-${pLong.toFixed(3)} over T in [${longRows[0].T.toFixed(1)}, ${longRows[longRows.length - 1].T.toFixed(1)}] · a half power would be 0.500`);

console.log('\n=== 9. The refusal that can be watched ===\n');

/* a Boris pusher, so the gyration neither gains nor loses energy to the integrator */
function gyroPair(eps0, turns, perTurn) {
  const qm = 1.75882e11, Bm = 1;
  const w = qm * Bm, dt = 2 * Math.PI / (w * perTurn), tn = qm * Bm * dt / 2, sn = 2 * tn / (1 + tn * tn);
  const push = (x, v) => {
    const vpx = v[0] + v[1] * tn, vpy = v[1] - v[0] * tn;
    const nvx = v[0] + vpy * sn, nvy = v[1] - vpx * sn;
    return [[x[0] + nvx * dt, x[1] + nvy * dt, x[2] + v[2] * dt], [nvx, nvy, v[2]]];
  };
  let xa = [0, 0, 0], va = [1e5, 0, 0], xb = [eps0, 0, 0], vb = [1e5, 0, 0], mx = 0;
  for (let i = 0; i < turns * perTurn; i++) {
    const ra = push(xa, va), rb = push(xb, vb);
    xa = ra[0]; va = ra[1]; xb = rb[0]; vb = rb[1];
    const d = Math.hypot(xa[0] - xb[0], xa[1] - xb[1], xa[2] - xb[2]);
    if (d > mx) mx = d;
  }
  return { rate: w, max: mx, growth: mx / eps0 };
}
const gp = gyroPair(1e-6, 200, 200);
ok('a cyclotron frequency carries inverse time and is not a separation rate, and that is the difference this whole laboratory turns on. Two particles started a micron apart in a uniform magnetic field gyrate at exactly the same frequency, so they are still a micron apart after two hundred turns and after any number of turns: the rate is 1.76e11 radians a second and the predictability horizon is INFINITE. The unit agreed and the coordinate did not, which is why the atlas bus requires both',
  Math.abs(gp.rate / 1.75882e11 - 1) < 1e-9 && Math.abs(gp.growth - 1) < 1e-9,
  `rate ${gp.rate.toExponential(4)} rad/s · separation after 200 turns is ${(gp.growth).toFixed(9)} times what it started at`);

ok('and the same refusal read the other way: the DIVERGENCE of the Lorenz flow is -13.667 per unit time while its Lyapunov exponent is +0.905. Same unit, opposite sign, a factor of fifteen apart, and one of them is a volume rate. Driving a predictability horizon from the divergence would say the Lorenz attractor is perfectly predictable, which is the exact opposite of the one thing everybody knows about it',
  DIV_EXACT < 0 && lam[0] > 0 && Math.abs(DIV_EXACT / lam[0]) > 14,
  `div f = ${DIV_EXACT.toFixed(4)} · lambda_1 = ${lam[0].toFixed(4)} · |div| / lambda = ${Math.abs(DIV_EXACT / lam[0]).toFixed(2)}`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
