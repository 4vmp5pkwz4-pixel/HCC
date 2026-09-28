#!/usr/bin/env node
'use strict';
/* ══ THE MERGER ON THE ATLAS CLOCK ═══════════════════════════════════════════════════════
 * The two central holes now merge in the atlas itself as the clock runs, every phase a pure
 * function of the epoch. Checks, with the extracted kernels and references written HERE:
 *   1. the sinking time is Chandrasekhar's in a singular isothermal sphere (Binney & Tremaine
 *      eq. 8.13), recomputed here with its Coulomb logarithm
 *   2. the hand-over is continuous: the cycloid crosses r₀ = 1 kpc exactly when the sinking starts
 *   3. while sinking, r² falls linearly and reaches zero at the merger
 *   4. after the merger the front has travelled exactly c·Δt — one light-year per year
 *   5. the peak strain at the Sun and the breathing of the Earth–Sun distance, recomputed here
 *   6. a pure function of the epoch: the same epoch gives the same state whatever came before
 *   7. wiring: the remnant replaces the pair, the front is drawn, the toolbox can watch it
 *   8. MUTATION: handing over at the collapse instead of at r₀ makes M31* jump by a kiloparsec, caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { lgRadialOrbit, lgSeparationAt, lgMergerTimeline, lgNucleusAt, lgDynFrictionYears, bbhPeakStrain, LG_NUCLEUS } = K;
  const O = lgRadialOrbit(2.537 / 3.2615638, 110, 13.707934229), T = lgMergerTimeline(O);

  /* 1 · Chandrasekhar */
  { const G = 4.30091e-6, M = 4.15e6 + 2.5e7, vc = 250, r0 = 1, lnL = Math.log(r0 * vc * vc / (G * M)), t = 1.17 / lnL * r0 * r0 * vc / (G * M) * 3.0856775814913673e16 / (365.25 * 86400);
    const D = lgDynFrictionYears(M, vc, r0);
    ok('the sinking time is Chandrasekhar\'s in a singular isothermal sphere, t = (1.17/ln Λ) r₀² v_c/(GM), recomputed here with its Coulomb logarithm', Math.abs(D.years / t - 1) < 1e-4 && Math.abs(D.lnL - lnL) < 1e-12 && Math.abs(T.tDf / t - 1) < 1e-4, `t_df = ${(t / 1e6).toFixed(1)} Myr · ln Λ = ${lnL.toFixed(3)}`); }

  /* 2 · continuity */
  { const s = lgSeparationAt(O, T.tGal), rkpc = s.rMpc * 1000, n = lgNucleusAt(O, T.tGal + 1);
    ok('the hand-over is continuous: the infalling cycloid crosses r₀ = 1 kpc at the very moment the sinking starts there', Math.abs(rkpc - LG_NUCLEUS.r0Kpc) < 1e-6 && n.phase === 'sinking' && Math.abs(n.rKpc - 1) < 1e-6 && T.tGal < T.tCollapse, `cycloid at hand-over ${rkpc.toFixed(9)} kpc · ${((T.tCollapse - T.tGal) / 1e6).toFixed(3)} Myr before its collapse`); }

  /* 3 · r² linear */
  { const r2 = f => { const n = lgNucleusAt(O, T.tGal + f * T.tDf); return n.rKpc ** 2; }, lin = [0.1, 0.4, 0.8].map(f => Math.abs(r2(f) - (1 - f))), end = lgNucleusAt(O, T.tBH + 1);
    ok('while sinking, r² falls linearly in time and reaches zero at the merger', Math.max(...lin) < 1e-9 && end.phase === 'merged', `worst ${Math.max(...lin).toExponential(1)} · merger at +${(T.tBH / 1e9).toFixed(4)} Gyr`); }

  /* 4 · the front */
  { const n = lgNucleusAt(O, T.tBH + 12345.5);
    ok('after the merger the front has travelled exactly c·Δt — one light-year per year', Math.abs(n.frontLy - 12345.5) < 1e-6, `${n.frontLy.toFixed(1)} ly after 12 345.5 yr`); }

  /* 5 · the strain */
  { const G = 6.67430e-11, c = 299792458, Ms = 1.98892e30, m1 = 4.15e6 * Ms, m2 = 1.4e8 * Ms, M = m1 + m2, Mc = Math.pow(m1 * m2, 3 / 5) / Math.pow(M, 1 / 5), f = Math.pow(6, -1.5) / Math.PI * c ** 3 / (G * M), r = 26700 * 9.4607304725808e15;
    const h = 4 / r * Math.pow(G * Mc / c ** 2, 5 / 3) * Math.pow(Math.PI * f / c, 2 / 3), hk = bbhPeakStrain(4.15e6, 1.4e8, r);
    ok('the peak strain at the Sun, recomputed here, and what it does to the Earth–Sun distance', Math.abs(hk / h - 1) < 1e-9 && h > 1e-12 && h < 1e-10, `h = ${h.toExponential(3)} · ΔL = hL/2 = ${(h * 1.495978707e11 / 2).toFixed(2)} m on 1 AU`); }

  /* 6 · pure function of the epoch */
  { const a = JSON.stringify(lgNucleusAt(O, T.tGal + 0.3 * T.tDf)); lgNucleusAt(O, T.tBH + 5e5); lgNucleusAt(O, -1e9); const b = JSON.stringify(lgNucleusAt(O, T.tGal + 0.3 * T.tDf));
    ok('a pure function of the epoch: the same epoch gives the same state whatever was asked before, so the clock may run at any rate', a === b && /const N=lgNucleusAt\(O,yrs\); M31_PHASE=N;/.test(SRC)); }

  /* 7 · wiring */
  ok('wiring: the remnant replaces the pair on the clock, the front is drawn at c·Δt, M31\'s disc fades into the remnant nobody here models, and the toolbox can watch it happen',
    /m31BHModel\.visible=!merged;/.test(SRC) && /Sgr A\* \+ M31\* · the remnant · 1\.44×10⁸ M☉, a = 0\.094/.test(SRC) && /const R=Math\.max\(1,N\.frontLy\)\*LY_AU; GW_FRONT\.scale\.setScalar\(R\);/.test(SRC)
    && /TT\('Watch the holes merge on the atlas clock'/.test(SRC) && /timeline:\(\)=>\{/.test(SRC) && /\['On the atlas clock',/.test(SRC));

  /* 8 · mutation */
  { const jump = lgSeparationAt(O, O.collapse_years - 1).rMpc * 1000;   /* the cycloid a year before collapse is nowhere near 1 kpc */
    ok('MUTATION — handing over at the collapse instead of at r₀ would make M31* jump from the cycloid\'s last position to 1 kpc, caught', Math.abs(jump - LG_NUCLEUS.r0Kpc) > 0.5, `cycloid one year before collapse ${jump.toExponential(2)} kpc against r₀ = 1 kpc`); }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
