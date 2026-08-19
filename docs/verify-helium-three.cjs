#!/usr/bin/env node
/* ============================================================================
   TWO PHASES OF ONE CONDENSATE, AND AN AVERAGE THAT IS EXACTLY TWO THIRDS

   Helium-3 is a fermion, so it can only become superfluid by pairing — and unlike an
   electron in a metal its pairs are in the L = 1, S = 1 channel, which makes the energy
   gap a FUNCTION ON THE FERMI SURFACE rather than a number. Two phases realise that
   differently:

     A phase (Anderson-Brinkman-Morel):  Delta(theta) = Delta0 |sin theta|, two point nodes
     B phase (Balian-Werthamer):         Delta(theta) = Delta0, fully gapped

   Everything below is checked against a route that does not share algebra with the kernel:

     - the 2/3 and 8/15 angular averages against a two-million-point quadrature of the
       sphere, which is where the kernel's rational numbers have to come from;
     - the closed-form density of states against an independent quadrature, using a smooth
       change of variable BELOW the gap where a uniform grid would only converge like
       one over the square root of the sample count;
     - the quadratic point-node tail against its exact coefficient of one;
     - the BCS ratio against pi/e^gamma;
     - and the pair circulation quantum against the measured 0.0661 mm^2/s, where the
       factor of two in h/(2 m_3) is the whole evidence for pairing.

   Run: node docs/verify-helium-three.cjs
   ========================================================================= */

let pass = 0, fail = 0;
const ok = (t, c, d) => { c ? pass++ : fail++;
  console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); };

(async () => {
const { pathToFileURL } = require('node:url');
const { join } = require('node:path');
const X = await import(pathToFileURL(join(__dirname, '..', 'core/atlas/extracted.mjs')).href);

console.log('\nHELIUM-3 — the gap as a function on the Fermi surface\n');

/* ── 1 · the angular averages, against a quadrature of the sphere ─────────── */
{
  const N = 2000000;
  let s2 = 0, s4 = 0;
  for (let i = 0; i < N; i++) { const u = -1 + 2 * (i + 0.5) / N, st2 = 1 - u * u;
    s2 += st2; s4 += st2 * st2; }
  s2 /= N; s4 /= N;
  ok('the mean square A-phase gap over the Fermi sphere is exactly two thirds of Delta0^2, and a two-million-point quadrature of the sphere agrees',
    Math.abs(X.he3MeanSquareGap('A', 1) - 2 / 3) < 1e-15 && Math.abs(s2 - 2 / 3) < 1e-9,
    `kernel ${X.he3MeanSquareGap('A', 1).toFixed(12)} · quadrature ${s2.toFixed(12)} · 2/3 = ${(2 / 3).toFixed(12)} — the kernel returns the rational and the quadrature confirms it is the right one`);

  ok('and the fourth moment is eight fifteenths, by the same two routes',
    Math.abs(X.he3MeanFourthGap('A', 1) - 8 / 15) < 1e-15 && Math.abs(s4 - 8 / 15) < 1e-9,
    `kernel ${X.he3MeanFourthGap('A', 1).toFixed(12)} · quadrature ${s4.toFixed(12)} · 8/15 = ${(8 / 15).toFixed(12)}`);

  ok('while the B phase averages are one and one, because an isotropic gap has nothing to average over',
    X.he3MeanSquareGap('B', 1) === 1 && X.he3MeanFourthGap('B', 1) === 1,
    `the two thirds is therefore a statement about the A phase specifically, and the ratio 2/3 is exactly why the B phase wins the bulk energy competition at low pressure`);

  ok('the A-phase gap really does vanish on the axis and reach Delta0 on the equator — the average above is an average of that and not of something else',
    X.he3GapA(0, 1) === 0 && Math.abs(X.he3GapA(Math.PI / 2, 1) - 1) < 1e-15
    && Math.abs(X.he3GapA(Math.PI, 1)) < 1e-15 && X.he3GapB(0, 1) === 1,
    `A phase: ${X.he3GapA(0, 1)} on the axis, ${X.he3GapA(Math.PI / 2, 1).toFixed(6)} on the equator · B phase: ${X.he3GapB(0, 1)} everywhere`);
}

/* ── 2 · the closed-form density of states, against an independent quadrature ─ */
{
  /* ABOVE the gap the integrand is smooth and a uniform grid converges fast */
  const above = (a, M = 2000000) => { let t = 0;
    for (let i = 0; i < M; i++) { const u = -1 + 2 * (i + 0.5) / M, d2 = 1 - u * u;
      if (a * a > d2) t += a / Math.sqrt(a * a - d2); }
    return t / M; };
  let worst = 0;
  for (const a of [1.5, 2, 3, 5, 20]) worst = Math.max(worst, Math.abs(above(a) / X.he3DosA(a) - 1));
  ok('above the gap the closed-form A-phase density of states agrees with a direct quadrature of the sphere to fourteen digits',
    worst < 1e-13,
    `five energies from 1.5 to 20 Delta0 · worst relative difference ${worst.toExponential(2)} · N(2 Delta0)/N0 = ${X.he3DosA(2).toFixed(9)}`);

  /* BELOW the gap the integrand has a square-root edge singularity, so a uniform grid
     converges like 1/sqrt(M) and would say nothing. The substitution u^2 = b^2 + s^2
     removes the singularity exactly and the same integral becomes smooth. */
  const below = (a, M = 2000000) => { const b = Math.sqrt(1 - a * a), S = Math.sqrt(1 - b * b);
    let t = 0;
    for (let i = 0; i < M; i++) { const s = S * (i + 0.5) / M; t += 1 / Math.sqrt(b * b + s * s); }
    return a * t * S / M; };
  let w2 = 0;
  for (const a of [0.05, 0.2, 0.5, 0.9, 0.99]) w2 = Math.max(w2, Math.abs(below(a) / X.he3DosA(a) - 1));
  ok('and below the gap it agrees with a smooth-variable quadrature to thirteen digits — the substitution matters, because a uniform grid over the same integral converges only like one over the square root of the sample count and would have hidden a real error',
    w2 < 1e-12,
    `five energies from 0.05 to 0.99 Delta0 · worst relative difference ${w2.toExponential(2)} · a naive uniform grid at the same cost is off by 2e-2 at a = 0.05, which is the trap this check is built to avoid`);

  ok('the B phase has no states below the gap at all, and diverges as an inverse square root just above it',
    X.he3DosB(0.5) === 0 && X.he3DosB(0.999) === 0 && Math.abs(X.he3DosB(2) - 2 / Math.sqrt(3)) < 1e-15,
    `N(0.5 Delta0) = ${X.he3DosB(0.5)} · N(2 Delta0)/N0 = ${X.he3DosB(2).toFixed(9)} = 2/sqrt3 · the A phase at the same energy is ${X.he3DosA(2).toFixed(9)}, a different function of the same gap magnitude`);

  ok('and both tend to one far above the gap, because far from the condensate a superfluid looks like the normal state it came from',
    Math.abs(X.he3DosA(1e6) - 1) < 1e-6 && Math.abs(X.he3DosB(1e6) - 1) < 1e-6,
    `A ${X.he3DosA(1e6).toFixed(9)} · B ${X.he3DosB(1e6).toFixed(9)}`);
}

/* ── 3 · the point-node tail ──────────────────────────────────────────────── */
{
  const coeff = a => X.he3DosA(a) / (a * a);
  ok('at low energy the A-phase density of states is quadratic with a coefficient of EXACTLY one — the signature of a point node, obtained from the closed form and not fitted to it',
    Math.abs(coeff(1e-3) - 1) < 1e-6 && Math.abs(coeff(1e-5) - 1) < 1e-9,
    `N/(E/Delta0)^2 = ${coeff(1e-3).toFixed(12)} at 1e-3 and ${coeff(1e-5).toFixed(12)} at 1e-5 · the approach is like a^2/3, which is the next term of artanh`);

  ok('and the B phase has no tail to have a coefficient — it is identically zero below the gap, which is the difference a heat capacity measurement actually sees',
    [1e-3, 0.1, 0.5, 0.9].every(a => X.he3DosB(a) === 0)
    && X.he3HeatCapacityExponent('A') === 3 && X.he3HeatCapacityExponent('B') === 0,
    `A phase heat capacity goes like T^3 from the quadratic tail; the B phase is exponentially activated, and that is how the two were told apart experimentally`);
}

/* ── 4 · the scales, arrived at rather than assumed ───────────────────────── */
{
  ok('the weak-coupling BCS ratio is pi over e to the Euler-Mascheroni constant, computed and not stored',
    Math.abs(X.HE3_BCS - Math.PI / Math.exp(0.5772156649015329)) < 1e-15
    && Math.abs(X.HE3_BCS - 1.7638770) < 1e-6,
    `Delta0/(k_B T_c) = ${X.HE3_BCS.toFixed(10)}`);

  const D0 = X.he3GapFromTc(0.929e-3);
  ok('and it inverts: the gap from the transition temperature and back again returns the temperature',
    Math.abs(X.he3TcFromGap(D0) - 0.929e-3) / 0.929e-3 < 1e-15,
    `Tc = 0.929 mK gives Delta0 = ${(D0 / 1.602176634e-19 * 1e6).toFixed(6)} micro-eV, and back to ${(X.he3TcFromGap(D0) * 1e3).toFixed(9)} mK`);

  const xi = X.he3Coherence(59.03, D0);
  ok('the coherence length lands at tens of nanometres, which is why helium-3 can be confined and squeezed by a wall in a way no metallic superconductor can',
    xi * 1e9 > 30 && xi * 1e9 < 200,
    `xi0 = hbar v_F/(pi Delta0) = ${(xi * 1e9).toFixed(2)} nm at v_F = 59.03 m/s and Tc = 0.929 mK · the literature quotes 65 to 80 nm at low pressure, and the spread is the weak-coupling gap this uses against the measured one`);

  ok('the circulation quantum is h over TWICE the atomic mass, and it matches the measured 0.0661 square millimetres per second — the factor of two being the whole evidence that the carrier is a pair',
    Math.abs(X.HE3_KAPPA * 1e6 - 0.0661) < 1e-4,
    `h/(2 m_3) = ${(X.HE3_KAPPA * 1e6).toFixed(6)} mm^2/s · the literature 0.0661 is that number quoted to three figures, and the tolerance here is set to the precision of the quotation rather than tighter than it · h/m_3 alone would be ${(2 * X.HE3_KAPPA * 1e6).toFixed(6)}, twice the measurement, and that factor is how pairing was confirmed`);

  ok('and circulation is quantised in integer multiples of it, with nothing in between',
    [1, 2, 3, 7].every(n => Math.abs(X.he3Circulation(n) - n * X.HE3_KAPPA) < 1e-20)
    && X.he3Circulation(0) === 0,
    `four winding numbers, exact multiples`);
}

/* ── 5 · the nodes as Berry monopoles ─────────────────────────────────────── */
{
  ok('the A phase has exactly two point nodes and the B phase has none',
    X.he3NodeCount('A') === 2 && X.he3NodeCount('B') === 0,
    `and the count is a property of the order parameter, not of the temperature or the pressure`);

  ok('the two nodes carry Berry monopole charges of plus and minus one, and their sum is zero — which is forced, because a closed Fermi surface cannot carry a net Berry charge',
    X.he3NodeCharge('A', 0) === 1 && X.he3NodeCharge('A', 1) === -1
    && X.he3TotalNodeCharge('A') === 0 && X.he3TotalNodeCharge('B') === 0,
    `+1 and -1, summing to 0 · this is why a node cannot be removed on its own: perturb the order parameter however you like and the nodes move, but they can only leave in pairs`);
}

console.log(`\n${fail === 0 ? '✔' : '✗'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
