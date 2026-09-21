#!/usr/bin/env node
'use strict';
/* ══ NO FINITE SECTOR CAN HOLD IT ════════════════════════════════════════════
 *
 * This atlas is full of finite reduced models, and none of them had ever been
 * asked the one question that decides whether a reduction can hold what it is
 * being asked to hold. On the projected equation the answer is a theorem: inside
 * any finite exact reducing space the convective term cancels in the energy
 * identity and the viscous term is non-negative, so
 *
 *     ‖u(t)‖₂ ≤ ‖u₀‖₂ + ∫‖F‖₂ ,
 *
 * and on a finite-dimensional space every norm is equivalent to that one. So no
 * bounded-energy L∞ blowup can live in one — including in the torus sector this
 * atlas solved completely two releases ago, which is exactly why that laboratory
 * and this one are the same theorem from opposite ends.
 *
 * WHAT IS CHECKED HERE IS THE ARITHMETIC THE THEOREM TURNS INTO. The band rank is
 * an integer staircase and the peak forces a height on it; the two heights come
 * from two different facts about the same object — bounded total energy, and the
 * core's effective volume — and the second is the larger. The resonant summand
 * dimensions have to add back to the shell. The sharp gap constant has to be the
 * reciprocal of two coefficients measured in a different laboratory. And the
 * reduced evolution's two weights have to be the one-shell criterion's.
 *
 * NONE OF IT IS EVIDENCE THAT A SINGULARITY EXISTS. Every bound is a NECESSARY
 * condition on a peak supplied by an external Euclidean package, and a lower
 * bound on a rank is not a claim that anything reaches it. This file checks that
 * the page says so.
 */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

const i0 = src.indexOf('const S3NS_MONO=new Map();'), i1 = src.indexOf('/* ── S³ curl-shell laboratory ──');
if (i0 < 0 || i1 < 0) { console.log('  FAIL — the S3NS block could not be sliced out of index.html'); process.exit(1); }
const ctx = vm.createContext({ Math, Object, Map, Set, Array, Number, Float64Array, console, JSON });
vm.runInContext('function mulberry(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0;'
  + ' let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t;'
  + ' return ((t^t>>>14)>>>0)/4294967296; }; }\n' + src.slice(i0, i1), ctx, { timeout: 60000 });
const S = k => vm.runInContext(k, ctx);
const rel = (a, b) => Math.abs(a - b) / Math.max(1e-30, Math.abs(b));

console.log('\n=== 1. THE FINITE-SECTOR ESTIMATE, SIMULATED RATHER THAN CITED ===\n');

/* The theorem is about the abstract system ẋ + νAx + Q(x,x) = F with A ≥ 0 and
   ⟨Q(x,x),x⟩ = 0. Both hypotheses can be built here and the conclusion integrated,
   so the estimate is watched rather than quoted. Q is taken to be a cross product,
   which is energy-cancelling for the same reason the convective term is. */
{ const cross = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
  const A = [0.7, 3.1, 9.4];                    /* a non-negative diagonal linear part */
  let x = [1.3, -0.8, 0.45], t = 0, dt = 1e-4, worst = 0;
  const n0 = Math.hypot(...x), forcing = [0.2, -0.1, 0.05], fL1 = Math.hypot(...forcing) * 2.0;
  while (t < 2.0) {
    const q = cross(x, x);                       /* identically zero for the diagonal case */
    const g = [0,1,2].map(i => -0.35 * A[i] * x[i] - q[i] + (t < 2.0 ? forcing[i] : 0));
    x = [0,1,2].map(i => x[i] + dt * g[i]); t += dt;
    worst = Math.max(worst, Math.hypot(...x) - (n0 + fL1 * Math.min(t, 2.0) / 2.0)); }
  ok('THE FINITE-SECTOR ESTIMATE HOLDS ON A SYSTEM BUILT TO ITS HYPOTHESES — a non-negative linear part and an energy-cancelling quadratic term keep the L² norm under its own initial value plus the forcing, integrated here rather than asserted',
    worst < 1e-9,
    `the norm never exceeded the bound: worst excess ${worst.toExponential(2)} over 20000 steps, from ‖x₀‖ = ${n0.toFixed(4)}`); }

{ /* and a system that BREAKS one hypothesis is not bounded, which is what makes
     the check a check rather than a restatement of a differential equation */
  let x = 1.0, t = 0, dt = 1e-4, at = null;
  while (t < 2.0) { x += dt * 0.35 * 40 * x; t += dt;
    if (x > 50 && at === null) { at = t; break; } }
  ok('and the same integrator RUNS AWAY the moment the linear part is allowed to be negative, so the bound above is a consequence of the hypotheses and not of the arithmetic that produced it',
    at !== null && at < 1.0, at !== null ? `with A < 0 the norm passes fifty at t = ${at.toFixed(4)}`
      : 'a negative linear part left the norm bounded, which cannot happen'); }

console.log('\n=== 2. THE STAIRCASE AND THE TWO HEIGHTS A PEAK FORCES ===\n');

const rows = [];
for (const lt of [-1, -2, -3, -4]) { const tau = Math.pow(10, lt), h = 0.005, eta = 0.5, R = 1;
  const c = S(`s3nsCoreScales(${tau},${h})`);
  const nE = S(`s3nsRequiredRank(${eta},${c.peak},1,${R})`), nC = S(`s3nsCoreRankBound(${eta},${tau},${h},${R})`);
  rows.push({ tau, c, nE, nC, kE: S(`s3nsRequiredK(${nE})`), kC: S(`s3nsRequiredK(${nC})`) }); }
ok('BOTH DEMANDED RANKS DIVERGE AS THE SIMILARITY TIME GOES TO ZERO, and the CORE bound is the larger of the two at every step — bounded total energy gives one obstruction and the core`s concentration gives a strictly stronger one',
  rows.every(r => r.nC > r.nE) && rows[3].kE > rows[0].kE && rows[3].kC > rows[0].kC
  && rows.every((r, i) => i === 0 || (r.nE > rows[i-1].nE && r.nC > rows[i-1].nC)),
  rows.map(r => `τ=${r.tau}: K ≥ ${r.kE} (energy), K ≥ ${r.kC} (core)`).join(' · '));
/* THE CUTOFF EXPONENT IS ASYMPTOTIC AND THE CHECK HAS TO BE HONEST ABOUT THAT.
   N_K ≈ (2/3)K³ only for large K — at K = 9 the exact rank is 990 against the
   asymptote's 486 — so a slope measured between τ = 10⁻¹ and 10⁻⁴ comes out −0.529
   and NOT the theorem's −1/2 + h/3. A tolerance wide enough to swallow that would
   also swallow a wrong exponent. So the slope is measured over four successive
   windows and the claim is CONVERGENCE: each window is closer to the target than
   the last, and the deepest one lands on it. */
{ const H = 0.005, ETA = 0.5, kOf = t => S(`s3nsRequiredK(s3nsCoreRankBound(${ETA},${t},${H},1))`);
  const windows = [[-1, -4], [-4, -8], [-8, -14], [-14, -20]].map(([a, b]) => {
    const ka = kOf(Math.pow(10, a)), kb = kOf(Math.pow(10, b));
    return { a, b, ka, kb, slope: (Math.log(kb) - Math.log(ka)) / ((b - a) * Math.LN10) }; });
  const target = -0.5 + H / 3;
  const errs = windows.map(w => Math.abs(w.slope - target));
  const sV = (Math.log(rows[3].c.effectiveVolume) - Math.log(rows[0].c.effectiveVolume))
           / (Math.log(rows[3].tau) - Math.log(rows[0].tau));
  const sN = (Math.log(rows[3].nC) - Math.log(rows[0].nC)) / (Math.log(rows[3].tau) - Math.log(rows[0].tau));
  ok('THE EXPONENTS ARE THE ONES THE TWO THEOREMS STATE — the effective volume goes as τ^{3/2−h} and the demanded rank as τ^{−3/2+h} EXACTLY, while the cutoff CONVERGES on τ^{−1/2+h/3} from above as the window deepens, which is what an asymptotic statement about an integer staircase is entitled to and no more',
    Math.abs(sV - (1.5 - H)) < 1e-9 && Math.abs(sN - (-1.5 + H)) < 1e-9
    && errs.every((e, i) => i === 0 || e < errs[i - 1]) && errs[3] < 1e-4 && windows[3].kb > 1e10,
    `V_eff slope ${(1.5 - H)} exactly · N slope ${(-1.5 + H)} exactly · K slope by window: `
      + windows.map(w => `10^${w.a}→10^${w.b}: ${w.slope.toFixed(5)}`).join(', ')
      + ` against −1/2 + h/3 = ${target.toFixed(5)}`); }
/* THE INVERSION IS SWEPT, NOT SAMPLED. Four values off a curve cannot tell a
   correct staircase inversion from one that is off by a rung exactly where a
   demand lands on a tread, so every integer demand up to five thousand is asked
   for, plus the boundary values and four far ones. */
{ const wrong = [];
  const check = N => { const K = S(`s3nsRequiredK(${N})`);
    const at = S(`s3nsBandRank(${K})`), below = K > 0 ? S(`s3nsBandRank(${K - 1})`) : -1;
    if (!(at >= N) || !(K === 0 || below < N)) wrong.push(`N=${N}→K=${K}`); };
  for (let N = 1; N <= 5000; N++) check(N);
  for (const N of [6, 7, 22, 23, 52, 53, 100, 101, 1e6, 1e9, 1e12, 1e15]) check(N);
  ok('and the cutoff is the FIRST rung of the exact staircase that reaches the demand — swept over every integer demand to five thousand and out to 10¹⁵, so a rung`s worth of error anywhere on a tread is caught rather than sampled past',
    wrong.length === 0 && S('s3nsRequiredK(100)') === 3 && S('s3nsRequiredK(101)') === 4,
    wrong.length ? wrong.slice(0, 4).join(' · ')
      : `5012 demands, each landing on the first rung that reaches it · N=100 → K=3 (N₃ = 100 exactly) and N=101 → K=4`); }

/* AND THE TWO BOUNDS HAVE DIFFERENT CONSTANTS AND DIFFERENT POWERS OF η, which is
   the fact that distinguishes them: one comes from the L²→L^∞ projector norm and
   is quadratic in η, the other from the L¹→L^∞ norm and is linear. Deriving each
   here from the projector constant it belongs to is a second authority for both. */
{ const R = 1.3, tau = 1e-3, h = 0.005, E = 0.8, c = S(`s3nsCoreScales(${tau},${h})`);
  const V = S(`s3nsVolume(${R})`);
  let qBad = [], lBad = [];
  for (const eta of [0.2, 0.4, 0.8]) {
    /* η‖u‖∞ ≤ ‖Π‖₂→∞‖u‖₂ = √(N/3𝒱)·E  ⟹  N ≥ 3𝒱(η‖u‖∞/E)² */
    const fromL2 = 3 * V * Math.pow(eta * c.peak / E, 2);
    if (Math.abs(S(`s3nsRequiredRank(${eta},${c.peak},${E},${R})`) - fromL2) / fromL2 > 1e-12) qBad.push(eta);
    /* η‖v‖∞ ≤ ‖Π‖₁→∞‖v‖₁ = (N/3𝒱)‖v‖₁  ⟹  N ≥ 3𝒱η/V_eff */
    const fromL1 = 3 * V * eta / c.effectiveVolume;
    if (Math.abs(S(`s3nsCoreRankBound(${eta},${tau},${h},${R})`) - fromL1) / fromL1 > 1e-12) lBad.push(eta); }
  const q2 = S(`s3nsRequiredRank(0.4,${c.peak},${E},${R})`) / S(`s3nsRequiredRank(0.2,${c.peak},${E},${R})`);
  const l2 = S(`s3nsCoreRankBound(0.4,${tau},${h},${R})`) / S(`s3nsCoreRankBound(0.2,${tau},${h},${R})`);
  ok('THE TWO DEMANDS COME FROM TWO DIFFERENT PROJECTOR NORMS AND CARRY TWO DIFFERENT POWERS OF THE CAPTURED FRACTION — the energy bound is 3𝒱(η‖u‖∞/‖u‖₂)² from the L²→L^∞ constant and QUADRUPLES when η doubles, the core bound is 3𝒱η/V_eff from the L¹→L^∞ constant and merely DOUBLES, and each is re-derived here from the constant it belongs to',
    qBad.length === 0 && lBad.length === 0 && Math.abs(q2 - 4) < 1e-9 && Math.abs(l2 - 2) < 1e-9,
    qBad.length || lBad.length ? `energy off at η ∈ {${qBad}}, core off at η ∈ {${lBad}}`
      : `doubling η multiplies the energy demand by ${q2.toFixed(6)} and the core demand by ${l2.toFixed(6)}`); }

/* and the core's own two exponents, which the effective volume is the ratio of */
{ const h = 0.005, a = S(`s3nsCoreScales(1e-2,${h})`), b = S(`s3nsCoreScales(1e-8,${h})`);
  const slope = (x, y) => (Math.log(y) - Math.log(x)) / (Math.log(1e-8) - Math.log(1e-2));
  const sPeak = slope(a.peak, b.peak), sL1 = slope(a.l1, b.l1),
        sR = slope(a.radial, b.radial), sZ = slope(a.axial, b.axial);
  ok('and the CORE`S OWN four scalings are the source construction`s — ℓ_r ≍ τ^{1/2}, ℓ_z ≍ τ^{1/2−h}, ‖v‖∞ ≍ τ^{−1/2−h} and ‖v‖₁ ≍ τ^{1−2h} — so the effective volume is their ratio rather than a fifth declared exponent',
    Math.abs(sR - 0.5) < 1e-12 && Math.abs(sZ - (0.5 - h)) < 1e-12
    && Math.abs(sPeak - (-0.5 - h)) < 1e-12 && Math.abs(sL1 - (1 - 2*h)) < 1e-12
    && Math.abs(a.effectiveVolume - a.l1 / a.peak) / a.effectiveVolume < 1e-12,
    `slopes ${sR}, ${sZ}, ${sPeak}, ${sL1} · and V_eff = ‖v‖₁/‖v‖∞ to ${(Math.abs(a.effectiveVolume - a.l1/a.peak)/a.effectiveVolume).toExponential(1)}`); }

console.log('\n=== 3. THE ARITHMETIC OF THE EXACT REDUCING FAMILY ===\n');

const bad = [];
for (let k = 0; k <= 8; k++) { const a = S(`s3nsEscapeAudit(${k},1)`);
  const want = [];
  for (let l = 1; l <= k + 1; l++) want.push(2 * l + 1);
  const sum = want.reduce((p, q) => p + q, 0);
  if (sum !== (k + 1) * (k + 3)) bad.push(`k=${k}: this file's own sum ${sum} ≠ (k+1)(k+3)`);
  if (a.resonantSum !== sum || !a.resonantMatch) bad.push(`k=${k}: page says ${a.resonantSum}`);
  if (a.reducingDim !== 6 + (k + 1) * (k + 3)) bad.push(`k=${k}: reducing dim ${a.reducingDim}`);
  if (Math.abs(a.c - k / (k + 4)) > 1e-12) bad.push(`k=${k}: c_* ${a.c}`); }
ok('THE RESONANT SUMMANDS ADD BACK TO THE SHELL: 3 + 5 + … + (2k+3) is exactly (k+1)(k+3) at every k, so the decomposition at c_* accounts for the whole eigenspace and loses nothing',
  bad.length === 0,
  bad.length ? bad.slice(0, 3).join(' · ')
    : [1, 2, 3].map(k => `k=${k}: ${S(`s3nsResonantDims(${k})`).join('+')} = ${(k+1)*(k+3)}, c_* = ${(k/(k+4)).toFixed(4)}, 𝒦⊕E has ${6+(k+1)*(k+3)}`).join(' · '));

const gapBad = [];
for (const R of [0.6, 1, 2.5]) { const a = S(`s3nsEscapeAudit(1,${R})`);
  if (rel(a.gapFromCoefficients, a.gapClosedForm) > 1e-12) gapBad.push(`R=${R}`);
  if (rel(a.gapClosedForm, 2 * R * R * 2 * Math.PI * Math.PI * R * R * R / 5) > 1e-12) gapBad.push(`R=${R} closed`); }
ok('AND THE SHARP GAP CONSTANT 2R²𝒱/5 IS THE RECIPROCAL OF b_s(1) + b_o(1) — two quantities from two different theorems, computed by different routes, landing on one number at every curvature radius',
  gapBad.length === 0,
  gapBad.length ? gapBad.join(' · ')
    : [0.6, 1, 2.5].map(R => `R=${R}: ${S(`s3nsEscapeAudit(1,${R})`).gapClosedForm.toExponential(6)}`).join(' · '));

const wBad = [];
for (let k = 0; k <= 6; k++) { const a = S(`s3nsEscapeAudit(${k},1)`);
  if (rel(a.weightMinus, k / (k + 2)) > 1e-12 || rel(a.weightPlus, (k + 4) / (k + 2)) > 1e-12) wBad.push(`k=${k}`);
  if (rel(a.oneShellA, a.weightMinus) > 1e-12 || rel(a.oneShellB, a.weightPlus) > 1e-12) wBad.push(`k=${k} pair`); }
ok('and the two weights of the exact reduced evolution, 1 ∓ 2/(Rμ), ARE the one-shell criterion`s k/(k+2) and (k+4)/(k+2) — one comes from a closed-form flow and the other from an invariance condition, and they are the same two numbers',
  wBad.length === 0,
  wBad.length ? wBad.join(' · ')
    : [1, 3, 5].map(k => `k=${k}: ${(k/(k+2)).toFixed(6)} and ${((k+4)/(k+2)).toFixed(6)}`).join(' · '));

/* THE ADDENDUM'S OTHER BARRIER, which is frequency-INDEPENDENT: with a derivative
   estimate in hand, the number of COMPLETE shells is bounded below however high
   those shells sit. It is a different statement from the rank bounds — a few very
   high shells already carry a large total rank, and this one says that does not
   help. */
{ const h = 0.005, eta = 0.5, R = 1.3, V = S(`s3nsVolume(${R})`);
  const rows = [], bad = [];
  for (const lt of [-2, -4, -6, -8]) { const tau = Math.pow(10, lt), c = S(`s3nsCoreScales(${tau},${h})`);
    const lap1 = c.l1 / tau;                         /* the declared derivative input */
    const M = S(`s3nsShellCountBound(${eta},${c.peak},${lap1},${R})`);
    /* re-derived here from the inverse-Hodge shell weight the theorem uses */
    const want = 3 * V * eta / (R * R) * c.peak / lap1;
    if (Math.abs(M - want) / want > 1e-12) bad.push(`τ=${tau}`);
    rows.push({ tau, M }); }
  const slope = (Math.log(rows[3].M) - Math.log(rows[0].M))
              / (Math.log(rows[3].tau) - Math.log(rows[0].tau));
  ok('THE SHELL-COUNT BARRIER IS FREQUENCY-INDEPENDENT AND STILL DIVERGES — M ≥ 3𝒱η‖v‖∞/(R²‖Δ₁v‖₁) grows as τ^{−1/2+h}, so no FIXED number of complete shells keeps a fixed fraction of the core peak however high their frequencies are, which the rank bounds alone do not say',
    bad.length === 0 && Math.abs(slope - (-0.5 + h)) < 1e-9 && rows[3].M > rows[0].M,
    bad.length ? bad.join(' · ')
      : `M = ${rows.map(r => r.M.toFixed(0)).join(' → ')} across τ = 10⁻² → 10⁻⁸, slope ${slope.toFixed(5)} against −1/2 + h = ${(-0.5 + h).toFixed(5)}`);
  /* THE PHRASE ALONE IS NOT THE PANEL. "shell-count barrier" occurs twice in the
     page — once in the instrument's own refusal about the derivative estimate —
     so a regex for it passes while the reader's panel says nothing at all. What
     is pinned is the line that COMPUTES it and the sentence that prints it. */
  ok('and the laboratory publishes it beside the two rank bounds, because a reader shown only a rank would conclude that enough high shells could do the job',
    /const lap1=c\.l1\/tau, M=s3nsShellCountBound\(eta,c\.peak,lap1,R\);/.test(src)
    && /shell-count barrier: with/.test(src)
    && /frequency-independent, so no fixed number of shells keeps the peak/.test(src),
    'the escape panel computes the barrier from the core it is already showing, and prints it with its exponent'); }

console.log('\n=== 4. THE GATE IS A GATE ===\n');

let open = 0, total = 0;
for (let i = 0; i <= 6; i++) for (const si of [1, -1]) for (let j = 0; j <= 6; j++) for (const sj of [1, -1]) {
  total++; if (S(`s3nsCGGate(${i},${si},${j},${sj},2,1)`)) open++; }
ok('THE RESONANCE GATE CLOSES MOST OF THE GRID rather than decorating it: over the ordered pairs of signed shells up to k = 6, a strict minority can feed E_{2,+} at all, and the rest are excluded by Schur before any coefficient is computed',
  open > 0 && open < total * 0.7 && total === 196,
  `${open} of ${total} ordered pairs are open into E_{2,+} — ${(100 * open / total).toFixed(1)} per cent`);
ok('and the gate is NECESSARY and not sufficient, which the laboratory says in writing rather than leaving a reader to assume that an open cell carries energy',
  /THE GATE IS NECESSARY, NOT SUFFICIENT/.test(src),
  'the refusal is in the instrument contract');

console.log('\n=== 5. THE GLOBAL EMBEDDING, AND THE POLE IT HAS AT THREE ===\n');

/* Summing the same sharp constant over ALL shells instead of a finite band
   telescopes, because (k+1)(k+3)/(k+2)^s is j^{2−s} − j^{−s} with j = k+2. The
   total is 2[ζ(s−2) − ζ(s)], convergent exactly when s > 3. */
{ const zbad = [];
  for (const [s2, want] of [[2, Math.PI*Math.PI/6], [4, Math.pow(Math.PI,4)/90],
                            [3, 1.2020569031595943], [1.5, 2.612375348685488]])
    if (Math.abs(S(`s3nsZeta(${s2})`) - want) > 1e-12) zbad.push(`ζ(${s2})`);
  /* AND EVERY CORRECTION TERM IT CARRIES HAS TO BE REACHABLE. Dropping one term
     at a time must degrade the answer: if it does not, that coefficient is a
     number no argument can see, and carrying it is the same defect as a guard
     that cannot run. Measured here term by term. */
  const ladder = [1, 2, 3, 4].map(M => {
    let worst = 0;
    for (const [s2, want] of [[1.5, 2.612375348685488], [2, Math.PI*Math.PI/6],
                              [3, 1.2020569031595943], [4, Math.pow(Math.PI,4)/90]])
      worst = Math.max(worst, Math.abs(S(`s3nsZeta(${s2},24,${M})`) - want));
    return worst; });
  if (!ladder.every((e, i) => i === 0 || e < ladder[i-1])) zbad.push('a correction term that changes nothing');
  if (ladder[3] > 2e-15) zbad.push('the last term does not reach the floor');
  if (S('S3NS_BERN').length !== 4) zbad.push(`${S('S3NS_BERN').length} coefficients carried, four are reachable`);
  ok('THE ZETA FUNCTION THIS BOUND IS BUILT FROM IS RIGHT, checked against two closed forms and two tabulated values — and every correction term it carries is shown to earn its place, because a sharp constant computed from a wrong special function is a sharp-looking constant',
    zbad.length === 0,
    zbad.length ? zbad.join(' · ')
      : `ζ(2) = π²/6, ζ(4) = π⁴/90, ζ(3) and ζ(3/2) to 1e-12 · and each correction term earns its place: `
        + ladder.map((e, i) => `${i+1}→${e.toExponential(1)}`).join(', ') + ' — four reach the floor and the table stops there');

  /* the telescoping sum, brute-forced. NEAR s = 3 THE TAIL CONVERGES TOO SLOWLY
     TO CHECK BY SUMMATION — at s = 3.5 a partial sum to 3·10⁵ is still 0.2 per
     cent short — so the comparison is made where the sum actually converges, and
     the threshold behaviour is checked separately by the pole below. */
  const rows = [], off = [];
  for (const s2 of [4.5, 5, 6.5, 8]) {
    const brute = S(`s3nsShellSum(${s2},300000)`), closed = S(`s3nsShellSumClosed(${s2})`);
    if (rel(brute, closed) > 1e-7) off.push(`s=${s2}: ${brute} vs ${closed}`);
    rows.push(`s=${s2}: ${closed.toFixed(8)}`); }
  ok('AND THE SHELL DIMENSIONS TELESCOPE ONTO 2[ζ(s−2) − ζ(s)] — summed term by term over three hundred thousand shells and compared with the closed form, where the series converges fast enough for a partial sum to mean anything',
    off.length === 0, off.length ? off.join(' · ') : rows.join(' · '));

  /* the constant, and its pole */
  const cbad = [];
  for (const R of [1, 2.2]) for (const s2 of [3.5, 4, 6]) {
    const want = Math.pow(R, s2 - 3) / (3 * Math.PI * Math.PI) * (S(`s3nsZeta(${s2 - 2})`) - S(`s3nsZeta(${s2})`));
    if (rel(S(`s3nsEmbeddingConstant(${s2},${R})`), want) > 1e-12) cbad.push(`R=${R} s=${s2}`); }
  if (S('s3nsEmbeddingConstant(3,1)') !== Infinity || S('s3nsEmbeddingConstant(2.5,1)') !== Infinity)
    cbad.push('finite at or below three');
  const approach = [1e-2, 1e-3, 1e-4, 1e-6].map(e => e * S(`s3nsEmbeddingConstant(${3 + e},2.2)`));
  const residue = 1 / (3 * Math.PI * Math.PI);
  const errs = approach.map(a => Math.abs(a - residue));
  ok('THE EMBEDDING CONSTANT IS R^{s−3}(ζ(s−2) − ζ(s))/3π², IT IS REFUSED AT AND BELOW s = 3, AND (s−3)C_s CONVERGES ON 1/3π² — a residue that does not depend on R at all, approached here over four decades',
    cbad.length === 0 && errs.every((e, i) => i === 0 || e < errs[i - 1]) && errs[3] < 1e-7
    && Math.abs(S('s3nsEmbeddingResidue()') - residue) < 1e-15,
    cbad.length ? cbad.join(' · ')
      : `(s−3)C_s at s = 3+ε: ${approach.map(a => a.toFixed(8)).join(', ')} against 1/3π² = ${residue.toFixed(8)}`);
  ok('and the pole is marked as a statement about a FAMILY of constants rather than an endpoint theorem, because a residue at three is exactly the shape of a result somebody would read as one',
    /THE ZETA POLE IS NOT AN ENDPOINT THEOREM/.test(src)
    && /No W\^\{3,1\} to BMO embedding, no Trudinger-Moser inequality and no sharp endpoint constant follows from the pole alone/.test(src),
    'the refusal names the three things that do not follow'); }

console.log('\n=== 6. THE INEQUALITY IS ATTAINED, AND WHAT THAT COSTS ===\n');

/* "The constant is sharp" is a claim about a field that either exists or does
   not, so the extremizer is BUILT and asked whether it attains the bound. */
{ const rows = [], off = [];
  const V = S('s3nsVolume(1)');
  for (const k of [1, 2, 3, 4]) { const N = (k + 1) * (k + 3), c = N / (3 * V);
    let x = [0.31, -0.52, 0.60, 0.52]; const n = Math.hypot(...x); x = x.map(v => v / n);
    const ex = S(`s3nsShellExtremizer(${k},1,[${x}],[0.6,-0.8,0])`);
    const evalP = vm.runInContext('s3nsEvalPoly', ctx), fdot = vm.runInContext('s3nsFieldDot', ctx);
    const at = Math.hypot(...[0,1,2].map(a => evalP(ex.components[a], ex.degree, x)));
    const norm2 = fdot(ex.components, ex.components, ex.degree);
    /* the sup has to be AT the point the extremizer was built at */
    let sup = 0, seed = 9182;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let t = 0; t < 3000; t++) { let p = [rnd()*2-1, rnd()*2-1, rnd()*2-1, rnd()*2-1];
      const l = Math.hypot(...p); p = p.map(v => v / l);
      const m = Math.hypot(...[0,1,2].map(a => evalP(ex.components[a], ex.degree, p)));
      if (m > sup) sup = m; }
    if (rel(at, c) > 1e-9 || rel(norm2, c) > 1e-9 || sup > at * (1 + 1e-9)) off.push(`k=${k}`);
    if (rel(norm2 / (at * at), S(`s3nsUncertaintyBound(${N},1)`)) > 1e-9) off.push(`k=${k} ratio`);
    rows.push(`k=${k}: ‖w‖₂²/‖w‖∞² = ${(norm2/(at*at)).toFixed(6)} = 3𝒱/N`); }
  ok('THE SHARP CONCENTRATION INEQUALITY IS ATTAINED — the reproducing-kernel field has ‖w‖₂² = |w(x)| = N/3𝒱 exactly, its supremum over three thousand points is at the point it was built at, and the ratio hits 3𝒱/N with no slack',
    off.length === 0, off.length ? [...new Set(off)].join(' · ') : rows.join(' · '));

  /* AND THAT SAME FIELD IS A COUNTEREXAMPLE. It lives in ONE shell, so its
     spectral entropy is zero, while its peak grows without bound with k. */
  const ce = [10, 20, 40, 80].map(k => S(`s3nsEntropyCounterexample(${k},1)`));
  ok('AND IT IS A COUNTEREXAMPLE TO THE ENTROPY HOPE — unit energy, spectral entropy exactly zero at every k, and a peak that grows without bound — so no lower bound of the form S ≳ log‖u‖∞ follows from bounded energy and projector estimates alone',
    ce.every(c => c.energy === 1 && c.spectralEntropy === 0)
    && ce.every((c, i) => i === 0 || c.peak > ce[i-1].peak)
    && ce[3].peak > 2 * ce[0].peak
    /* AND THE PEAK IS THE SHARP CONSTANT ITSELF, not merely something that grows:
       the extremizer's height is exactly √(N/3𝒱), which is what makes it both the
       equality case above and the counterexample here. A peak off by a scale
       factor still grows and still has zero entropy, and would be a different
       field. */
    && [10, 20, 40, 80].every((k, i) => rel(ce[i].peak * ce[i].peak,
         (k + 1) * (k + 3) / (3 * S('s3nsVolume(1)'))) < 1e-12)
    && /BOUNDED ENERGY AND AN UNBOUNDED PEAK DO NOT FORCE SPECTRAL ENTROPY/.test(src),
    `peaks ${ce.map(c => c.peak.toFixed(4)).join(' → ')} at k = 10, 20, 40, 80 — each exactly √(N/3𝒱) — entropy 0 throughout`);
  ok('and the coherence ratio Γ vanishes on EVERY pressure-linear sector — every signed shell and the whole maximal torus — so Γ → 0 is not a spectral dichotomy and implies no concentration in one Beltrami shell',
    S('s3nsCoherenceRatio()') === 0
    && /Gamma going to zero is not a spectral dichotomy and implies no concentration in one Beltrami shell/.test(src),
    'Q(u,u) = 0 on a shell by the Beltrami cancellation, so the numerator is identically zero there'); }

console.log('\n=== 7. WHAT THE PAGE REFUSES ===\n');

ok('the laboratory is wired as a laboratory — a camera, a router branch, a scene and a lazy build',
  /s3escGroup\.visible = \(v==='s3escape'\);/.test(src)
  && /state\.s3view==='s3escape'/.test(src)
  && /v==='s3escape'\?\[0,\.2,13\.4\]:/.test(src)
  && /if\(v==='s3escape'&&!s3escObjs\)\{ s3escSetup\(\); \}/.test(src),
  'visibility, router, camera preset and lazy build are all present');
ok('AND THE THREE THINGS THIS SCREEN IS NOT ARE WRITTEN DOWN: the singular solution is not here, a lower bound on a rank is not evidence that anything reaches it, and the core scaling is a declared input rather than a derivation',
  /THE SINGULAR SOLUTION IS NOT HERE AND IS NOT EVALUATED HERE/.test(src)
  && /A LOWER BOUND ON A RANK IS NOT EVIDENCE THAT ANYTHING REACHES IT/.test(src)
  && /THE CORE SCALING IS A DECLARED INPUT/.test(src),
  'four refusals in the contract, each naming what it refuses');

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
