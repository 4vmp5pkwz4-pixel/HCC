#!/usr/bin/env node
'use strict';
/* ══ DEEP TIME — WHAT THE CLOCK CAN REACH, AND WHAT HAPPENS THERE ═════════════════════════
 * The atlas's clock runs to about ±2.5×10¹³ years. This file checks, with the extracted kernels
 * and references written HERE, the three things that now move on it by their own laws:
 *   1. THE UNIVERSE: the flat-ΛCDM scale factor is 1 today, its logarithm matches the direct
 *      formula where both are finite, stays finite at the clock's edge, and inverts exactly
 *   2. A BLACK HOLE: at the crossing time the CMB temperature EQUALS the Hawking temperature;
 *      Sgr A* absorbs more than it emits today; its evaporation lies ~74 decades past the clock
 *   3. M31: the cycloid starts on the catalogue separation closing at the catalogue speed, keeps
 *      its orbital energy v²/2 − GM/r constant, and collapses at the published collapse time
 *   4. THE HOLE DYING NOW: the primordial mass whose lifetime equals the age, recomputed here
 *   5. wiring: M31 moves only beyond a year from now; the cards; the bht clock mode
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { DT_COSMO: C, dtLnA, dtAgeGyrAtA, dtAgeGyrAtLnA, DT_T0_GYR, dtCmbLog10K, dtBlackHoleFate, lgRadialOrbit, lgSeparationAt, lgTiming, bhtEvapYr } = K;

  /* 1 · the universe */
  { const direct = t => { const x = 1.5 * Math.sqrt(C.OL) * C.H0 * t; return Math.log(Math.pow(C.Om / C.OL, 1 / 3) * Math.pow(Math.sinh(x), 2 / 3)); };
    const worst = Math.max(...[0.5, 5, 13.7, 60, 400].map(t => Math.abs(dtLnA(t) - direct(t))));
    const edge = 2.5e13, lnEdge = dtLnA(DT_T0_GYR + edge / 1e9), rt = Math.max(...[0.3, 1, 1e3, 1e10].map(a => Math.abs(dtAgeGyrAtLnA(Math.log(a)) - dtAgeGyrAtA(a)) / dtAgeGyrAtA(a)));
    ok('the universe: a(t₀) = 1, ln a matches the direct formula wherever both are finite, stays finite at the clock\'s edge, and the age inverts it exactly',
      Math.abs(dtLnA(DT_T0_GYR)) < 1e-12 && worst < 1e-12 && Number.isFinite(lnEdge) && lnEdge > 1e3 && rt < 1e-12, `t₀ = ${DT_T0_GYR.toFixed(4)} Gyr · ln a at +2.5×10¹³ yr = ${lnEdge.toFixed(0)} · roundtrip ${rt.toExponential(1)}`); }

  /* 2 · a black hole */
  { const F = dtBlackHoleFate(4.15e6), Tx = Math.pow(10, dtCmbLog10K(F.crossYears)), today = Math.pow(10, dtCmbLog10K(0));
    ok('a black hole: at the crossing time the CMB is exactly as cold as the Hawking temperature; Sgr A* absorbs more than it emits today; its evaporation lies ~74 decades beyond the clock',
      Math.abs(Tx / F.TH - 1) < 1e-9 && Math.abs(today / C.T0 - 1) < 1e-12 && F.absorbKgPerS > F.emitKgPerS && F.crossYears > 1e11 && F.crossYears < 1e12 && Math.round(F.decadesBeyond) === 74,
      `T_H ${F.TH.toExponential(3)} K · crossing in ${(F.crossYears / 1e9).toFixed(1)} Gyr · evaporation ${F.evapYears.toExponential(2)} yr · ${F.decadesBeyond.toFixed(1)} decades past the clock`); }

  /* 3 · M31 */
  { const sep = 2.537 / 3.2615638, O = lgRadialOrbit(sep, 110, 13.707934229), s0 = lgSeparationAt(O, 0), G = 6.67430e-11, Mpc = 3.0856775814913673e22, yr = 3.15576e7;
    const GM = O.A ** 3 / O.B ** 2, E = y => { const s = lgSeparationAt(O, y), r = s.rMpc * Mpc, v = s.vKms * 1e3; return v * v / 2 - GM / r; };
    const Es = [0, 5e8, 1.5e9, 3e9].map(E), spread = (Math.max(...Es) - Math.min(...Es)) / Math.abs(Es[0]), T = lgTiming(sep, 110, 13.707934229);
    ok('M31: the cycloid starts on the catalogue separation closing at 110 km/s, keeps v²/2 − GM/r constant, and collapses exactly when the timing solution says',
      Math.abs(s0.rMpc / sep - 1) < 1e-9 && Math.abs(s0.vKms + 110) < 1e-6 && spread < 1e-9 && lgSeparationAt(O, O.collapse_years + 1e6).merged && !lgSeparationAt(O, O.collapse_years - 1e6).merged && Math.abs(O.collapse_years / 1e9 - T.merge_in_gyr) < 1e-9,
      `r₀ ${s0.rMpc.toFixed(4)} Mpc · v₀ ${s0.vKms.toFixed(3)} km/s · energy spread ${spread.toExponential(1)} · first passage ${(O.collapse_years / 1e9).toFixed(3)} Gyr`); }

  /* 4 · the hole dying now */
  { const hbar = 1.054571817e-34, c = 2.99792458e8, Gc = 6.67430e-11, YR = 365.25 * 86400, t0 = DT_T0_GYR * 1e9;
    const Mstar = Math.cbrt(t0 * YR * hbar * c ** 4 / (5120 * Math.PI * Gc * Gc));
    ok('the hole dying now: the primordial mass whose lifetime equals the age of this cosmology, recomputed here, is the one the laboratory names', Math.abs(bhtEvapYr(Mstar) / t0 - 1) < 1e-3 && Mstar > 1e11 && Mstar < 3e11 && /const star=Math\.cbrt\(DT_T0_GYR\*1e9\*BHT_YR\*BHT_hbar\*Math\.pow\(BHT_c,4\)\/\(5120\*Math\.PI\*BHT_G\*BHT_G\)\);/.test(SRC), `M* = ${Mstar.toExponential(3)} kg`); }

  /* 5 · wiring */
  ok('wiring: M31 moves along the cycloid only beyond a year from now (so every test of the present still holds), the cards carry the fates, and the bht laboratory has its atlas-clock mode',
    /if\(Math\.abs\(yrs\)<=1\)\{ m31Physical\.position\.copy\(GAL_DATA\.m31\.pos\);/.test(SRC) && /\['Fate',\(\(\)=>\{ const F=dtBlackHoleFate\(GAL_DATA\.gc\.bhMassSolar\);/.test(SRC) && /\['Falling toward us',/.test(SRC) && /id="bhtClock"/.test(SRC) && /if\(state\.bhtClock&&O\.station==='evaporation'\)\{ const age=DT_T0_GYR\*1e9/.test(SRC));

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
