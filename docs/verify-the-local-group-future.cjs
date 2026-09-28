#!/usr/bin/env node
'use strict';
/* ══ THE LOCAL GROUP'S FUTURE, BY LAW ═══════════════════════════════════════════════════════
 * The Milky Way–Andromeda encounter integrated with dynamical friction, from today's data (lgmerge laboratory).
 * Checked here with the extracted kernels:
 *   1. CALIBRATION: with van der Marel et al. (2012)'s initial conditions (770 kpc, −109.3 km/s, v_t = 17) the
 *      friction orbit's first passage is at ~4 Gyr within 35 kpc and the cores coalesce at 5.5–6.2 Gyr — their
 *      N-body merger is at 5.86 Gyr
 *   2. TODAY'S DATA (v_t = 57 km/s, van der Marel et al. 2019): the first passage is at 4.3–4.8 Gyr at
 *      100–150 kpc and the galaxies do NOT coalesce within 14 Gyr; head-on (v_t = 0) they coalesce at once
 *   3. the law, not a fit: without friction the energy ½v² + Φ_MW(r) + Φ_M31(r) is conserved to 1e-5; with it,
 *      it never rises
 *   4. the geometry is the sky's: Andromeda's disc normal makes 77.5° with the line of sight, its north-east
 *      half recedes, and the Milky Way turns the Sun's way (angular momentum toward the south Galactic pole)
 *   5. the stars are an equilibrium before anything happens: an isolated disc of test particles keeps ≥ 97% of
 *      its stars within 30 kpc and its mean radius within 8% over a Gyr
 *   6. the answer over the errors is reproducible (same seed, same probabilities) and ordered (P₅ ≤ P₁₀ ≤ P₁₄)
 *   7. wiring: the laboratory is declared, routed, drawn, in the API with its refusals, and related to the last merger
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { lgmOrbit, lgmEvents, lgmPotential, lgmAccel, LGM_GAL, lgmGeometry, lgmUnit, lgmDot, lgmCross, lgmStars, lgmMonteCarlo, LGM_M31, LGM_NGP } = K;

  /* 1 · calibration */
  { const e = lgmEvents(lgmOrbit({ dKpc: 770, vRad: -109.3, vTan: 17, tGyr: 10 }), 12), p = e.peri[0];
    ok('CALIBRATION: with van der Marel et al. (2012)\'s initial conditions the first passage is at ~4 Gyr within 35 kpc and the cores coalesce at 5.5–6.2 Gyr (their N-body: 5.86)',
      p && p.tGyr > 3.7 && p.tGyr < 4.3 && p.rKpc < 35 && e.mergeGyr > 5.5 && e.mergeGyr < 6.2, `first passage ${p.tGyr.toFixed(2)} Gyr at ${p.rKpc.toFixed(1)} kpc · coalescence ${e.mergeGyr.toFixed(2)} Gyr`); }

  /* 2 · today's data */
  { const e = lgmEvents(lgmOrbit({ tGyr: 14 }), 12), p = e.peri[0], h = lgmEvents(lgmOrbit({ vTan: 0, tGyr: 8 }), 12);
    ok('TODAY\'S DATA (v_t = 57 km/s): first passage at 4.3–4.8 Gyr at 100–150 kpc and NO coalescence within 14 Gyr; head-on (v_t = 0) the cores coalesce at the first fall',
      p && p.tGyr > 4.3 && p.tGyr < 4.8 && p.rKpc > 100 && p.rKpc < 150 && e.mergeGyr == null && h.mergeGyr != null && h.mergeGyr < 4.5,
      `first passage ${p.tGyr.toFixed(2)} Gyr at ${p.rKpc.toFixed(0)} kpc · no merger · head-on coalesces at ${h.mergeGyr.toFixed(2)} Gyr`); }

  /* 3 · energy */
  { const A = LGM_GAL.mw, B = LGM_GAL.m31, n = [0, 0, 1], E = o => 0.5 * o.vKms * o.vKms + lgmPotential(A, n, o.x, o.y, 0) + lgmPotential(B, n, o.x, o.y, 0);
    const o0 = lgmOrbit({ lnL: 0, tGyr: 3.5, dtMyr: 0.25, outMyr: 50 }), E0 = E(o0[0]), drift = Math.max(...o0.map(o => Math.abs(E(o) / E0 - 1)));
    const o1 = lgmOrbit({ tGyr: 5, dtMyr: 0.5, outMyr: 50 }); let rises = 0; for (let i = 1; i < o1.length; i++) if (E(o1[i]) > E(o1[i - 1]) + 1e-6 * Math.abs(E0)) rises++;
    ok('the law, not a fit: without friction the energy ½v² + Φ_MW + Φ_M31 is conserved to 1e-5 through the approach; with friction it never rises',
      drift < 1e-5 && rises === 0, `energy drift ${drift.toExponential(1)} over 3.5 Gyr · rises with friction: ${rises}`); }

  /* 4 · geometry */
  { const G = lgmGeometry(), u = lgmUnit(LGM_M31.raDeg, LGM_M31.decDeg), incl = Math.acos(Math.abs(lgmDot(G.nM31, u))) * 180 / Math.PI, ngp = lgmUnit(LGM_NGP.raDeg, LGM_NGP.decDeg);
    const d = LGM_M31.decDeg * Math.PI / 180, a = LGM_M31.raDeg * Math.PI / 180, eN = [-Math.sin(d) * Math.cos(a), -Math.sin(d) * Math.sin(a), Math.cos(d)], eE = lgmCross(eN, u), pa = LGM_M31.paDeg * Math.PI / 180;
    const eMaj = eN.map((c, i) => Math.cos(pa) * c + Math.sin(pa) * eE[i]), vNE = lgmCross(G.nM31, eMaj);
    ok('the geometry is the sky\'s: Andromeda\'s disc normal makes 77.5° with the line of sight, its north-east half recedes, and the Milky Way turns the Sun\'s way',
      Math.abs(incl - 77.5) < 1e-6 && lgmDot(vNE, u) > 0 && Math.abs(lgmDot(G.nMW, ngp) + 1) < 1e-12 && Math.abs(G.dKpc - 782) < 3, `inclination ${incl.toFixed(6)}° · NE rotation · line of sight ${lgmDot(vNE, u).toFixed(3)} · separation ${G.dKpc.toFixed(1)} kpc`); }

  /* 5 · equilibrium discs */
  { const S = lgmStars({ vTan: 57, tGyr: 1, dtMyr: 1, outMyr: 100, nMW: 300, nM31: 300, seed: 5 }), f0 = S.frames[0], f1 = S.frames[S.frames.length - 1], c0 = S.centres[0], c1 = S.centres[S.centres.length - 1];
    const stat = (f, c) => { let inn = 0, rs = 0; for (let i = 0; i < 300; i++) { const r = Math.hypot(f[i * 3] - c.A[0], f[i * 3 + 1] - c.A[1], f[i * 3 + 2] - c.A[2]); if (r < 30) inn++; rs += r; } return { inn, mean: rs / 300 }; };
    const a = stat(f0, c0), b = stat(f1, c1);
    ok('the stars are an equilibrium before anything happens: over a Gyr the Milky Way\'s test-particle disc keeps ≥ 97% of its stars within 30 kpc and its mean radius within 8%',
      b.inn >= 291 && Math.abs(b.mean / a.mean - 1) < 0.08, `within 30 kpc ${a.inn} → ${b.inn} of 300 · mean radius ${a.mean.toFixed(2)} → ${b.mean.toFixed(2)} kpc`); }

  /* 6 · the answer over the errors */
  { const r1 = lgmMonteCarlo(16, 7, 14), r2 = lgmMonteCarlo(16, 7, 14);
    ok('the answer over the errors is reproducible and ordered: the same seed gives the same probabilities, and P(≤5) ≤ P(≤10) ≤ P(≤14)',
      r1.p14 === r2.p14 && r1.p10 === r2.p10 && r1.p5 <= r1.p10 && r1.p10 <= r1.p14 && r1.draws.every(d => d.vt >= 0), `16 draws · P₅ ${r1.p5} · P₁₀ ${r1.p10} · P₁₄ ${r1.p14}`); }

  /* 7 · wiring */
  ok('wiring: the laboratory is declared, routed, drawn, in the API with its refusals, and related to the last merger',
    /\{id:'lgmerge', category:'rel', domain:'astro', cluster:'astro', predictionClass:'numerical',/.test(SRC) && /lgmGroup\.visible = \(v==='lgmerge'\);/.test(SRC)
    && /state\.s3view==='lgmerge'\)\{\n\s*fbsAnimT\+=labDt; updateLgm\(labDt\);/.test(SRC) && /id:'lgmerge', world:'s3', lab:'lgmerge',/.test(SRC) && /\['lgmerge','bbh','causal'/.test(SRC) && /\['lgmAtlas','lgmerge',lgmGroup,/.test(SRC));

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
