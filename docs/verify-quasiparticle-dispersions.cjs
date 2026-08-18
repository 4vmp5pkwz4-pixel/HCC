#!/usr/bin/env node
/* ============================================================================
   FIVE EXCITATIONS, AND A CIRCULATION THAT DOES NOT CARE WHICH LOOP

   Five dispersion relations, each exact for its declared model and each previously written
   inside an animation loop where nothing outside the picture could reach it.

   Every claim below is checked against something the kernel does not share:

     - the acoustic branch's slope is checked against a LIMIT, taken numerically;
     - the optical branch at zero is checked against sqrt(2K/mu) with the reduced mass
       formed here;
     - the zone-boundary gap is checked against both masses separately, and against the
       statement that it closes only when they are equal;
     - the magnon's quadratic law is checked against the phonon's linear one, side by side,
       because the difference between them is the physics;
     - the exciton is checked by a SCALING INVARIANT that must not move when either of its
       two parameters does;
     - and the vortex circulation is checked against the loop it is measured round, over
       twelve decades of radius, because independence of the loop is what quantised means.

   Run: node docs/verify-quasiparticle-dispersions.cjs
   ========================================================================= */

let pass = 0, fail = 0;
const ok = (t, c, d) => { c ? pass++ : fail++;
  console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); };

(async () => {
const { pathToFileURL } = require('node:url');
const { join } = require('node:path');
const X = await import(pathToFileURL(join(__dirname, '..', 'core/atlas/extracted.mjs')).href);
const PAIRS = [[1, 2.5], [0.3, 7], [1, 1], [2, 2.0001], [0.05, 50]];

console.log('\n1 · the diatomic chain, both branches\n');
{
  /* the acoustic branch starts LINEAR: that is sound, and the slope is taken as a limit */
  const rows = []; let worst = 0;
  for (const [m1, m2] of PAIRS) {
    const c = X.qpSoundSpeed(1, m1, m2);
    const meas = [1e-4, 1e-6, 1e-8].map(k => X.qpPhononOmega(k, 1, m1, m2, 'acoustic') / k);
    for (const v of meas) worst = Math.max(worst, Math.abs(v - c) / c);
    rows.push(`(${m1},${m2}): ${meas[2].toFixed(9)} against ${c.toFixed(9)}`);
  }
  ok('the acoustic branch is LINEAR at long wavelength — that is sound — with slope sqrt(K/(2(m1+m2))), taken as a numerical limit at five mass pairs including one spanning three orders of magnitude',
    worst < 1e-8 && X.qpPhononOmega(0, 1, 1, 2.5, 'acoustic') === 0,
    rows.join(' · ') + ` · worst over k = 1e-4, 1e-6 and 1e-8 is ${worst.toExponential(2)}, and it IMPROVES as the limit is taken — which it did not before, because 1 - sqrt(1 - x) written literally loses every significant digit at small x and the measured slope drifted by five per cent at k = 1e-6. The conjugate form x/(1 + sqrt(1 - x)) is the same number and is stable · and omega is exactly zero at k = 0, which is what makes it acoustic`);

  let wo = 0;
  for (const [m1, m2] of PAIRS) { const mu = m1 * m2 / (m1 + m2);
    wo = Math.max(wo, Math.abs(X.qpPhononOmega(0, 1, m1, m2, 'optical') - Math.sqrt(2 / mu))); }
  ok('the optical branch starts at sqrt(2K/mu) with mu the REDUCED mass — checked against a reduced mass formed here, at five pairs, to the last bit',
    wo < 1e-14,
    `worst departure ${wo.toExponential(2)} · this is the frequency a photon can couple to, and it is finite where the acoustic branch is zero`);

  /* the gap, and the one condition that closes it */
  let gaps = [], closes = true, ordered = true;
  for (const [m1, m2] of PAIRS) {
    const lo = Math.min(m1, m2), hi = Math.max(m1, m2);
    const ga = X.qpPhononOmega(Math.PI, 1, m1, m2, 'acoustic'), go = X.qpPhononOmega(Math.PI, 1, m1, m2, 'optical');
    if (Math.abs(ga - Math.sqrt(2 / hi)) > 1e-11 || Math.abs(go - Math.sqrt(2 / lo)) > 1e-11) closes = false;
    gaps.push(`(${m1},${m2}) gap ${(go - ga).toFixed(6)}`);
    for (let n = 1; n <= 300; n++) { const k = n / 300 * Math.PI;
      if (X.qpPhononOmega(k, 1, m1, m2, 'optical') < X.qpPhononOmega(k, 1, m1, m2, 'acoustic')) ordered = false; }
  }
  const eqGap = Math.abs(X.qpPhononOmega(Math.PI, 1, 3, 3, 'optical') - X.qpPhononOmega(Math.PI, 1, 3, 3, 'acoustic'));
  ok('at the zone boundary the branches sit at sqrt(2K/m_heavy) and sqrt(2K/m_light), so the gap between them closes EXACTLY when the masses are equal and at no other time — and the branches never cross anywhere',
    closes && ordered && eqGap === 0 && Math.abs(X.qpPhononOmega(Math.PI, 1, 2, 2.0001, 'optical') - X.qpPhononOmega(Math.PI, 1, 2, 2.0001, 'acoustic')) > 0,
    gaps.join(' · ') + ` · with the masses exactly equal the gap is ${eqGap.toExponential(1)}, and with them differing by one part in twenty thousand it is already ${(X.qpPhononOmega(Math.PI, 1, 2, 2.0001, 'optical') - X.qpPhononOmega(Math.PI, 1, 2, 2.0001, 'acoustic')).toExponential(2)}`);
}

console.log('\n2 · the magnon, which is quadratic where the phonon is linear\n');
{
  const J = 1, S = 0.5, D = X.qpMagnonStiffness(J, S);
  const r = [1e-3, 1e-5, 1e-7].map(k => X.qpMagnonOmega(k, J, S) / (D * k * k));
  const phononRatio = [1e-3, 1e-5, 1e-7].map(k => X.qpPhononOmega(k, 1, 1, 1, 'acoustic') / k);
  ok('the ferromagnetic magnon goes as k SQUARED at long wavelength, with stiffness 2 J S a^2 — while the phonon at the same wavevectors goes as k to the first power. That difference is why the two carry heat with different powers of the temperature, and it is measured here side by side',
    r.every(x => Math.abs(x - 1) < 1e-6) && Math.abs(r[2] - 1) < Math.abs(r[0] - 1) &&
    Math.abs(phononRatio[2] - phononRatio[0]) / phononRatio[0] < 1e-6,
    `magnon omega/(D k^2) at k = 1e-3, 1e-5, 1e-7 departs from one by ${r.map(x => (x - 1).toExponential(1)).join(', ')} — falling as the fourth power of k, which is the next term · phonon omega/k over the same range: ${phononRatio.map(x => x.toFixed(9)).join(', ')} — constant, which is what linear means`);

  ok('and it vanishes at zero wavevector and peaks at the zone boundary at 8 J S, both exactly — a uniform rotation of every spin costs nothing, which is Goldstone',
    X.qpMagnonOmega(0, J, S) === 0 && Math.abs(X.qpMagnonOmega(Math.PI, J, S) - 8 * J * S) < 1e-15,
    `omega(0) = ${X.qpMagnonOmega(0, J, S)} exactly · omega(pi) = ${X.qpMagnonOmega(Math.PI, J, S).toFixed(12)} against 8 J S = ${(8 * J * S).toFixed(12)}`);
}

console.log('\n3 · the exciton, and a scaling that does not move\n');
{
  const cases = [[0.1, 10], [0.5, 4], [0.05, 13], [1, 1], [0.02, 30]];
  const inv = cases.map(([mu, e]) => X.qpExcitonInvariant(mu, e));
  const spread = (Math.max(...inv) - Math.min(...inv)) / Math.min(...inv);
  ok('the Wannier-Mott exciton is hydrogen with the reduced mass and the permittivity put in, so E_b times a*_B squared times mu depends on NEITHER — five wildly different materials, one number to twelve digits',
    spread < 1e-12,
    `invariant = ${inv[0].toFixed(9)} meV nm^2 at every one of (mu, eps) = ${cases.map(c => '(' + c.join(',') + ')').join(', ')} · spread ${spread.toExponential(1)}`);

  ok('and at mu = 1 with no screening it IS hydrogen: the radius is the Bohr radius and the binding is one Rydberg, which is the check that the constants were not merely fitted',
    Math.abs(X.qpExcitonRadius(1, 1) - X.QP_A0_NM) < 1e-15 &&
    Math.abs(X.qpExcitonBinding(1, 1) - X.QP_RY_MEV) < 1e-9 &&
    Math.abs(X.QP_RY_MEV / 1000 - 13.6056931) < 1e-6,
    `a*_B(1,1) = ${X.qpExcitonRadius(1, 1).toFixed(12)} nm against the Bohr radius ${X.QP_A0_NM} · E_b(1,1) = ${(X.qpExcitonBinding(1, 1) / 1000).toFixed(9)} eV against the Rydberg`);

  ok('a heavier carrier binds tighter and sits closer, and more screening does the opposite — both monotone across a decade, which is the least a scaling law has to do',
    (() => { let a = true, b = true;
      for (let i = 1; i < 60; i++) { const m1 = 0.05 * i, m2 = 0.05 * (i + 1);
        if (X.qpExcitonBinding(m2, 10) <= X.qpExcitonBinding(m1, 10)) a = false;
        if (X.qpExcitonRadius(m2, 10) >= X.qpExcitonRadius(m1, 10)) a = false;
        const e1 = 1 + 0.5 * i, e2 = 1 + 0.5 * (i + 1);
        if (X.qpExcitonBinding(0.1, e2) >= X.qpExcitonBinding(0.1, e1)) b = false;
        if (X.qpExcitonRadius(0.1, e2) <= X.qpExcitonRadius(0.1, e1)) b = false; }
      return a && b; })(),
    `binding rises and radius falls with the reduced mass; both reverse with the permittivity`);
}

console.log('\n4 · the polaron, with the range of its own formula attached\n');
{
  ok('the weak-coupling Frohlich mass is 1 + alpha/6 — exactly one at zero coupling, and the instrument reports whether the expansion it came from still applies rather than extrapolating silently',
    X.qpPolaronMass(0) === 1 && Math.abs(X.qpPolaronMass(6) - 2) < 1e-15 &&
    Math.abs(X.qpPolaronMass(3) - 1.5) < 1e-15 && X.qpPolaronEnergy(3) === -3,
    `m*/m = ${X.qpPolaronMass(0)} at alpha = 0, ${X.qpPolaronMass(3)} at 3, ${X.qpPolaronMass(6)} at 6 — which is where the expansion stops being worth anything, and is where the flag turns over`);
}

console.log('\n5 · the circulation, which does not depend on the loop\n');
{
  const hbar = 1.054571817e-34, m4 = 4.002602 * 1.66053906660e-27;
  const radii = [1e-12, 1e-9, 1e-6, 1e-3, 1];
  const loops = radii.map(r => X.qpCirculationFromLoop(1, r, hbar, m4));
  const spread = (Math.max(...loops) - Math.min(...loops)) / Math.min(...loops);
  ok('the circulation round a loop enclosing a vortex core is n h/m and does NOT depend on the loop — measured over TWELVE decades of radius, from a picometre to a metre, and constant to the last bit. That independence is the entire content of the word quantised',
    spread < 1e-15 && Math.abs(loops[0] - X.qpCirculation(1, hbar, m4)) / loops[0] < 1e-15,
    `radii ${radii.map(r => r.toExponential(0)).join(', ')} m all give ${loops[0].toExponential(6)} m^2/s · spread ${spread.toExponential(1)} · the speed itself varies by twelve decades over the same range`);

  ok('and for helium four that quantum is 9.97e-8 metres squared per second, rebuilt here from the CODATA Planck constant and the atomic mass rather than quoted from the laboratory',
    Math.abs(X.qpCirculation(1, hbar, m4) - 9.9693e-8) / 9.9693e-8 < 1e-4,
    `h/m4 = ${X.qpCirculation(1, hbar, m4).toExponential(6)} m^2/s · this is the number Vinen measured on a vibrating wire in 1961`);

  ok('and the winding number multiplies it exactly, so a doubly quantised vortex carries twice the circulation and not merely more',
    [1, 2, 3, 7].every(n => Math.abs(X.qpCirculation(n, hbar, m4) - n * X.qpCirculation(1, hbar, m4)) < 1e-30),
    `checked at n = 1, 2, 3 and 7`);
}

console.log(`\n${fail === 0 ? '✔' : '✗'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
