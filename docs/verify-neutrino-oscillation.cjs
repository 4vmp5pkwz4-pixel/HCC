#!/usr/bin/env node
/* ============================================================================
   ONE UNITARY MATRIX, THREE FLAVOURS, AND A SUM THAT IS EXACTLY ONE

   A neutrino is produced in a FLAVOUR state and propagates in MASS states, and one 3x3
   unitary matrix relates the two bases. Everything in the laboratory is a consequence of
   that single fact, and this file checks each consequence against a route that does not
   share algebra with the kernel that produced it:

     - unitarity of the reconstructed PMNS matrix, entry by entry against U^dagger U = I;
     - the three probabilities summing to one at hundreds of baselines, both orderings,
       neutrinos and antineutrinos — the sum is not normalised anywhere, it comes out;
     - the Jarlskog invariant from the four angles against the same number read straight
       off the matrix as an imaginary part;
     - the unitarity triangle closing, and its area against J/2;
     - the CP asymmetry against its closed form 16 J sin D21 sin D31 sin D32;
     - the two-flavour limit recovered when the third angle is switched off;
     - and the "1.27" of every textbook against 1e-15/(4 hbar c), because it is a unit
       conversion and not a fitted constant.

   Run: node docs/verify-neutrino-oscillation.cjs
   ========================================================================= */

let pass = 0, fail = 0;
const ok = (t, c, d) => { c ? pass++ : fail++;
  console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); };

(async () => {
const { pathToFileURL } = require('node:url');
const { join } = require('node:path');
const X = await import(pathToFileURL(join(__dirname, '..', 'core/atlas/extracted.mjs')).href);

console.log('\nNEUTRINO OSCILLATION — the PMNS matrix and everything that follows from it\n');

const T12 = Math.asin(Math.sqrt(0.307)), T13 = Math.asin(Math.sqrt(0.0220));
const T23 = Math.asin(Math.sqrt(0.546)), DCP = -1.89;
const DM21 = 7.53e-5, DM31 = 2.453e-3;
const U = X.nuPmns(T12, T13, T23, DCP);

/* ── 1 · the conversion constant ──────────────────────────────────────────── */
{
  ok('the 1.27 of every textbook is a unit conversion, not a fit: it is 1e-15/(4 hbar c) with hbar c in GeV metres',
    Math.abs(X.NU_KM - 1e-15 / (4 * 1.973269804e-16)) < 1e-15 && Math.abs(X.NU_KM - 1.2669) < 1e-3,
    `NU_KM = ${X.NU_KM.toFixed(10)} · the quoted 1.27 is this rounded to three figures`);
}

/* ── 2 · unitarity, checked entry by entry ────────────────────────────────── */
{
  ok('the reconstructed PMNS matrix is unitary to machine precision, over a grid of mixing parameters and not only at the measured point',
    (() => { let w = 0;
      for (const a of [0, 0.2, 0.5, 0.9]) for (const b of [0, 0.05, 0.4]) for (const c of [0.1, 0.55, 1])
        for (const d of [-Math.PI, -1.89, 0, 1.1, Math.PI])
          w = Math.max(w, X.nuUnitarityResidual(X.nuPmns(Math.asin(Math.sqrt(a)), Math.asin(Math.sqrt(b)), Math.asin(Math.sqrt(c)), d)));
      return w < 1e-15; })(),
    `180 parameter points, worst |U†U - I| entry below 1e-15`);

  const M = X.nuMixingSquared(U);
  ok('and every row and every column of |U|^2 sums to one, which is the same statement seen as a probability',
    [0, 1, 2].every(i => Math.abs(M[i][0] + M[i][1] + M[i][2] - 1) < 1e-15
                      && Math.abs(M[0][i] + M[1][i] + M[2][i] - 1) < 1e-15),
    `rows ${[0, 1, 2].map(i => (M[i][0] + M[i][1] + M[i][2]).toFixed(15)).join(', ')}`);
}

/* ── 3 · the sum that is exactly one ──────────────────────────────────────── */
{
  let worst = 0, n = 0;
  for (const anti of [false, true]) for (const ord of [1, -1]) for (const a of [0, 1, 2])
    for (let k = 0; k < 60; k++) {
      const L = 1 + 4000 * k / 59, E = 0.05 + 5 * ((k * 7) % 60) / 59;
      const r = X.nuProbRow(U, a, L, E, DM21, ord * DM31, anti);
      worst = Math.max(worst, Math.abs(r[0] + r[1] + r[2] - 1)); n++;
    }
  ok('the three probabilities sum to one at every baseline, every energy, both mass orderings and either sign of the beam — and nothing in the kernel normalises them',
    worst < 1e-14,
    `${n} configurations · worst |sum - 1| = ${worst.toExponential(3)} · the sum is an output of unitarity, not a constraint imposed on the output`);

  ok('and every individual probability stays inside [0, 1], which a wrong sign in the CP-odd term would break immediately',
    (() => { for (const anti of [false, true]) for (const a of [0, 1, 2])
        for (let k = 0; k < 200; k++) { const L = 1 + 8000 * k / 199, E = 0.05 + 3 * ((k * 13) % 200) / 199;
          const r = X.nuProbRow(U, a, L, E, DM21, DM31, anti);
          if (r.some(p => p < -1e-12 || p > 1 + 1e-12)) return false; }
      return true; })(),
    `1200 configurations, no probability outside the unit interval`);
}

/* ── 4 · the Jarlskog invariant, twice ────────────────────────────────────── */
{
  let worst = 0;
  for (const d of [-3, -1.89, -0.4, 0, 0.7, 2.5]) {
    const V = X.nuPmns(T12, T13, T23, d);
    worst = Math.max(worst, Math.abs(X.nuJarlskogFromU(V) - X.nuJarlskogAngles(T12, T13, T23, d)));
  }
  ok('the CP invariant computed from the four angles equals the imaginary part read straight off the matrix — the same number by two roads',
    worst < 1e-16,
    `six phases · worst difference ${worst.toExponential(3)} · J at the measured point = ${X.nuJarlskogFromU(U).toExponential(6)}`);

  ok('and it vanishes identically when the phase is zero or pi, which is what "no CP violation" means',
    Math.abs(X.nuJarlskogFromU(X.nuPmns(T12, T13, T23, 0))) < 1e-17
    && Math.abs(X.nuJarlskogFromU(X.nuPmns(T12, T13, T23, Math.PI))) < 1e-16,
    `J(delta = 0) = ${X.nuJarlskogFromU(X.nuPmns(T12, T13, T23, 0)).toExponential(2)} · J(delta = pi) = ${X.nuJarlskogFromU(X.nuPmns(T12, T13, T23, Math.PI)).toExponential(2)}`);

  ok('and it vanishes when the reactor angle does, however large the phase — one angle at zero kills the whole of leptonic CP violation',
    [-3, -1, 0.5, 2].every(d => Math.abs(X.nuJarlskogFromU(X.nuPmns(T12, 0, T23, d))) < 1e-17),
    `theta13 = 0 · J = 0 at four different phases, which is why measuring theta13 was the precondition for measuring delta at all`);
}

/* ── 5 · the triangle ─────────────────────────────────────────────────────── */
{
  ok('the three legs of the e-mu unitarity triangle close: their sum is zero, which is unitarity drawn rather than stated',
    X.nuTriangleClosure(U) < 1e-16,
    `|leg1 + leg2 + leg3| = ${X.nuTriangleClosure(U).toExponential(3)}`);

  let worst = 0;
  for (const d of [-3, -1.89, -0.4, 0.7, 2.5]) { const V = X.nuPmns(T12, T13, T23, d);
    worst = Math.max(worst, Math.abs(X.nuTriangleArea(V) - Math.abs(X.nuJarlskogFromU(V)) / 2)); }
  ok('and the area it encloses is exactly half the Jarlskog invariant',
    worst < 1e-16,
    `five phases · worst |area - |J|/2| = ${worst.toExponential(3)} · area at the measured point = ${X.nuTriangleArea(U).toExponential(6)}`);

  ok('so at zero phase the triangle has no area at all — it collapses to a line, and that is what a CP-conserving lepton sector looks like',
    X.nuTriangleArea(X.nuPmns(T12, T13, T23, 0)) < 1e-17,
    `area(delta = 0) = ${X.nuTriangleArea(X.nuPmns(T12, T13, T23, 0)).toExponential(2)} against ${X.nuTriangleArea(U).toExponential(3)} at the measured phase`);
}

/* ── 6 · the CP asymmetry against its closed form ─────────────────────────── */
{
  let worst = 0, sample = 0;
  for (const [a, b, sgn] of [[1, 0, 1], [0, 1, -1], [2, 1, 1], [1, 2, -1], [0, 2, 1], [2, 0, -1]])
    for (let k = 0; k < 40; k++) {
      const L = 50 + 3000 * k / 39, E = 0.3 + 3 * ((k * 11) % 40) / 39;
      const A = X.nuProb(U, a, b, L, E, DM21, DM31, false) - X.nuProb(U, a, b, L, E, DM21, DM31, true);
      const D21 = X.nuDelta(DM21, L, E), D31 = X.nuDelta(DM31, L, E);
      const F = sgn * 16 * X.nuJarlskogFromU(U) * Math.sin(D21) * Math.sin(D31) * Math.sin(D31 - D21);
      worst = Math.max(worst, Math.abs(A - F)); if (k === 20 && a === 1) sample = A;
    }
  ok('the neutrino minus antineutrino difference equals 16 J sin(D21) sin(D31) sin(D32) in every off-diagonal channel, with the sign fixed by the cyclic order and not by fitting',
    worst < 1e-14,
    `240 configurations across all six channels · worst difference ${worst.toExponential(3)} · a representative asymmetry is ${sample.toExponential(3)}`);

  ok('and the asymmetry is identically zero on the diagonal, because a survival probability cannot tell a neutrino from an antineutrino in vacuum',
    [0, 1, 2].every(a => [200, 800, 2400].every(L =>
      Math.abs(X.nuProb(U, a, a, L, 1.2, DM21, DM31, false) - X.nuProb(U, a, a, L, 1.2, DM21, DM31, true)) < 1e-15)),
    `nine survival channels, no difference above 1e-15 — the CP-odd term has a vanishing imaginary part when alpha = beta`);
}

/* ── 7 · the two-flavour limit ────────────────────────────────────────────── */
{
  const V = X.nuPmns(0, 0, T23, 0);   /* switch off the solar and reactor angles entirely */
  let worst = 0;
  for (let k = 0; k < 120; k++) { const L = 10 + 3000 * k / 119, E = 0.4 + 2 * ((k * 17) % 120) / 119;
    const three = X.nuProb(V, 1, 1, L, E, 0, DM31, false);
    const two = 1 - X.nuTwoFlavour(DM31, L, E, T23);
    worst = Math.max(worst, Math.abs(three - two)); }
  ok('with the solar and reactor angles switched off the three-flavour expression collapses EXACTLY to the two-state textbook formula 1 - sin^2(2 theta) sin^2(1.2669 dm^2 L/E)',
    worst < 1e-14,
    `120 baselines · worst difference ${worst.toExponential(3)} · the two-state result is a limit of the kernel, not a second implementation of it`);

  const full = 1 - X.nuProb(U, 1, 1, 295, 0.6, DM21, DM31, false);
  const twoF = X.nuTwoFlavour(DM31, 295, 0.6, T23);
  let mx = 0, at = null;
  for (let k = 0; k < 400; k++) { const L = 10 + 4000 * k / 399;
    for (const E of [0.2, 0.6, 1.2, 2.5, 5]) {
      const d = Math.abs((1 - X.nuProb(U, 1, 1, L, E, DM21, DM31, false)) - X.nuTwoFlavour(DM31, L, E, T23));
      if (d > mx) { mx = d; at = [L, E]; } } }
  ok('and the size of the correction depends entirely on where you stand: it is 2.8e-4 at T2K, where the solar term has barely turned on, and rises to 0.89 at long baseline and low energy — which is why the laboratory returns both numbers instead of describing the difference',
    Math.abs(full - twoF) > 1e-5 && Math.abs(full - twoF) < 1e-3 && mx > 0.5,
    `at T2K's 295 km and 0.6 GeV: three-flavour ${full.toFixed(6)} against two-flavour ${twoF.toFixed(6)}, a difference of ${Math.abs(full - twoF).toExponential(3)} · worst over a 2000-point scan is ${mx.toFixed(4)} at L = ${at[0].toFixed(0)} km, E = ${at[1]} GeV, where the two-flavour formula is not an approximation of anything`);
}

/* ── 8 · the scales, arrived at rather than assumed ───────────────────────── */
{
  ok('the first oscillation maximum for the atmospheric splitting at 0.6 GeV is at 303 km — and T2K is a 295 km baseline, which is not a coincidence but the reason the baseline was chosen',
    Math.abs(X.nuFirstMaximum(DM31, 0.6) - 303) < 2,
    `first maximum ${X.nuFirstMaximum(DM31, 0.6).toFixed(2)} km · full oscillation length ${X.nuOscLength(DM31, 0.6).toFixed(2)} km · T2K sits just short of the peak`);

  ok('and the full length is exactly twice the first maximum, at every energy and every splitting',
    [[DM21, 0.01], [DM31, 0.6], [DM31, 2.5], [DM21, 10]].every(([m, E]) =>
      Math.abs(X.nuOscLength(m, E) / X.nuFirstMaximum(m, E) - 2) < 1e-14),
    `four splitting-energy pairs, ratio 2 to 1e-14`);

  const ne = X.nuMswDensity(DM21, 0.01, T12);
  ok('the MSW resonance density for the solar splitting at 10 MeV lands at 10^25 per cubic centimetre, the same order as the solar core — which is why the solar neutrino problem was a matter effect and not a vacuum one',
    ne > 3e24 && ne < 5e25,
    `N_e resonance = ${ne.toExponential(3)} cm^-3 against a solar-core electron density near 6e25 cm^-3 · computed from G_F and hbar c, with no astrophysical input at all`);

  ok('and the reactor experiments sit where they do for the same reason: the atmospheric first maximum at 4 MeV is about 2 km, and that is the Daya Bay far-detector distance',
    Math.abs(X.nuFirstMaximum(DM31, 0.004) - 2.02) < 0.1,
    `first maximum at 4 MeV = ${X.nuFirstMaximum(DM31, 0.004).toFixed(3)} km · Daya Bay's far halls are at 1.5 to 1.9 km, KamLAND at 180 km for the solar splitting instead`);
}

console.log(`\n${fail === 0 ? '✔' : '✗'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
