#!/usr/bin/env node
'use strict';
/* ══ THE LAST MERGER OF THE LOCAL GROUP · Sgr A* + M31* ═══════════════════════════════════
 * Checks the extracted kernels against references written HERE:
 *   1. the Peters inspiral: τ(a) and a(τ) invert, and da/dt = −(64/5) η M³/a³ exactly
 *   2. the wave runs at twice the orbit: dΦ/dτ = 2Ω = 2a^{-3/2} at every separation — and the
 *      frequency kernel is Ω/π
 *   3. the end-state fits reproduce the numbers they were fitted to: equal masses radiate 4.8 %,
 *      spin to 0.687, no recoil; the largest recoil is ≈ 175 km/s near q ≈ 0.36; the test-particle
 *      limit radiates 1 − √(8/9) of μ
 *   4. the ringdown fit is within 2 % of the exact Schwarzschild l = m = 2 mode, Mω = 0.37367 −
 *      0.08896i, at a = 0
 *   5. the budget for Sgr A* + M31*, from the atlas's own masses, and its time to merger agrees with
 *      the gravitational-wave laboratory's own τ(f)
 *   6. the lab is honest about what it does not compute, and is wired
 *   7. MUTATION: the phase without its 1/η runs the wave 1/η times too slow, caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { bbhParams, bbhRemnant, bbhQNM, bbhTauOfA, bbhAOfTau, bbhPhase, bbhFgw, bbhBudget, gwTau, gwChirpMass } = K;
  const eta = bbhParams(4.15e6, 1.4e8).eta;

  /* 1 · Peters */
  { let worst = 0, inv = 0; for (const a of [6, 9, 15, 30, 100]) { const t = bbhTauOfA(a, eta), h = 1e-4 * t, dadt = -(bbhAOfTau(t + h, eta) - bbhAOfTau(t - h, eta)) / (2 * h);   /* τ counts down */
      worst = Math.max(worst, Math.abs(dadt / (-(64 / 5) * eta / a ** 3) - 1)); inv = Math.max(inv, Math.abs(bbhAOfTau(t, eta) / a - 1)); }
    ok('the Peters inspiral: τ(a) and a(τ) invert, and da/dt = −(64/5)ηM³/a³', worst < 1e-6 && inv < 1e-12, `worst ${worst.toExponential(1)} · inversion ${inv.toExponential(1)}`); }

  /* 2 · the wave runs at twice the orbit */
  { let worst = 0, fw = 0; for (const a of [7, 10, 20, 40]) { const t = bbhTauOfA(a, eta), h = 1e-5 * t, w = (bbhPhase(t - h, eta) - bbhPhase(t + h, eta)) / (2 * h);
      worst = Math.max(worst, Math.abs(w / (2 * Math.pow(a, -1.5)) - 1)); fw = Math.max(fw, Math.abs(bbhFgw(t, eta) / (Math.pow(a, -1.5) / Math.PI) - 1)); }
    ok('the wave runs at twice the orbit: dΦ/dτ = 2Ω = 2a^{-3/2} at every separation, and f_GW = Ω/π', worst < 1e-6 && fw < 1e-12 && /float ph=-\(2\.0\/uEta\)\*pow\(uEta\*tauRet\/5\.0,0\.625\);/.test(SRC), `worst ${worst.toExponential(1)}`); }

  /* 3 · the fits */
  { const E = bbhRemnant(0.25), kicks = Array.from({ length: 999 }, (_, i) => { const q = (i + 1) / 1000, e = q / (1 + q) ** 2; return [q, bbhRemnant(e).vkick]; }), best = kicks.reduce((m, k) => k[1] > m[1] ? k : m);
    const tp = bbhRemnant(1e-6).Erad / 1e-6;
    ok('the end-state fits reproduce what they were fitted to: equal masses radiate 4.8 %, spin to 0.687, no recoil; the largest recoil ≈ 175 km/s near q ≈ 0.36; the test-particle limit radiates (1 − √(8/9)) μ',
      Math.abs(E.Erad - 0.0484) < 0.001 && Math.abs(E.af - 0.687) < 0.002 && E.vkick === 0 && Math.abs(best[1] - 175) < 3 && Math.abs(best[0] - 0.36) < 0.03 && Math.abs(tp - (1 - Math.sqrt(8 / 9))) < 0.002,
      `E ${(100 * E.Erad).toFixed(2)} % · a ${E.af.toFixed(3)} · max kick ${best[1].toFixed(1)} km/s at q ${best[0].toFixed(3)} · test particle ${tp.toFixed(4)}`); }

  /* 4 · the ringdown fit */
  { const Q = bbhQNM(0), wr = 0.37367, wi = 0.08896, Qexact = wr / (2 * wi);
    ok('the ringdown fit is within 2 % of the exact Schwarzschild l = m = 2 mode (Mω = 0.37367 − 0.08896i) at a = 0', Math.abs(Q.Mw / wr - 1) < 0.02 && Math.abs(Q.Q / Qexact - 1) < 0.02, `Mω ${Q.Mw.toFixed(4)} vs ${wr} · Q ${Q.Q.toFixed(3)} vs ${Qexact.toFixed(3)}`); }

  /* 5 · the budget */
  { const gm = SRC.match(/bhMassSolar:([\d.e]+)\}/g).map(x => +x.match(/([\d.e]+)/)[1]), m1 = 4.15e6, m2 = 1.4e8, B = bbhBudget(m1, m2);
    const Mc = gwChirpMass(m1 * 1.989e30, m2 * 1.989e30), f = 20e-6, tA = gwTau(f, Mc), a = Math.pow(1 / (Math.PI * f * B.tM), 2 / 3), tB = bbhTauOfA(a, B.eta) * B.tM;
    ok('the budget for Sgr A* + M31* from the atlas\'s own masses: 0.200 % radiated, spin 0.094, recoil 8.6 km/s, ringdown 86 μHz over 2.25 h — and its time to merger agrees with the gravitational-wave laboratory\'s own τ(f)',
      gm.includes(m1) && gm.includes(m2) && Math.abs(B.Erad - 0.0020) < 5e-5 && Math.abs(B.af - 0.0939) < 5e-4 && Math.abs(B.vkick - 8.61) < 0.05 && Math.abs(B.fQNM * 1e6 - 86) < 1 && Math.abs(B.tauQNM / 3600 - 2.25) < 0.02 && Math.abs(tA / tB - 1) < 2e-3,
      `τ at 20 μHz: gw lab ${(tA / 86400).toFixed(2)} d · this lab ${(tB / 86400).toFixed(2)} d · PTA band ${(B.yearsFromPTA / 1e6).toFixed(1)} Myr before`); }

  /* 6 · honest and wired */
  ok('the lab says what it does not compute — the galaxies\' merger, dynamical friction, the final parsec — declares the spins zero, and is declared, routed, drawn, in the API and related',
    /NOT COMPUTED HERE \(order of magnitude, stated as such\)/.test(SRC) && /The spins of Sgr A\* and M31\* are not measured well enough to enter, so both are taken as zero/.test(SRC)
    && /\{id:'bbh', category:'rel', domain:'astro', cluster:'astro', predictionClass:'exact',/.test(SRC) && /bbhGroup\.visible = \(v==='bbh'\);/.test(SRC) && /id:'bbh', world:'s3', lab:'bbh',/.test(SRC) && /\['bbh','gw','coupling'/.test(SRC));

  /* 7 · mutation */
  { const bad = (tau, e) => -2 * Math.pow(Math.max(0, e * tau / 5), 5 / 8), a = 10, t = bbhTauOfA(a, eta), h = 1e-5 * t, w = (bad(t - h, eta) - bad(t + h, eta)) / (2 * h), ratio = (2 * Math.pow(a, -1.5)) / w;
    ok('MUTATION — the phase without its 1/η runs the wave 1/η times too slow, caught', Math.abs(ratio * eta - 1) < 1e-6, `too slow by ${ratio.toFixed(2)} = 1/η`); }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
