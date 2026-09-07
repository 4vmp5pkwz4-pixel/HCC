#!/usr/bin/env node
/* ============================================================================
   COMPOSITION, AND THE CONSTANT THE ATLAS WAS ALREADY USING

   Every stellar relation in this atlas is written for the Sun's composition and
   none of them says so. hrLuminosity, hrRadius and hrTemperature carry no Z;
   the turnoff mass, the gyrochronology colour term and the 1.278-against-1.314
   coincidence all rest on a solar mixture nothing declares. A census for
   "[Fe/H]" returned zero.

   The finding is not that a correction was missing. It is that the atlas was
   ALREADY carrying the answer and had never named it: HR_KAPPA is 0.034, used
   for the Eddington limit, and 0.034 is exactly 0.02(1+X) at X = 0.70 — the
   electron-scattering opacity, the one with no metals in it at all.

   This file shares no code with the atlas. Every constant is written out here,
   and the last check reads index.html.

   TWELVE THINGS ARE CHECKED.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const ZSUN = 0.0134, KR = 4e25, ES = 0.02;
const kEs = x => ES * (1 + x);
const kKr = (Z, x, rho, T) => KR * Z * (1 + x) * rho * Math.pow(T, -3.5);
const rhoCrit = (T, Z) => ES * Math.pow(T, 3.5) / (KR * Z);
const dominant = (Z, x, rho, T) => kKr(Z, x, rho, T) > kEs(x) ? 'kramers' : 'scattering';
const feh = Z => Math.log10(Z / ZSUN);

console.log('\n=== 1-3. The constant that was already here ===\n');

ok('THE ATLAS\'S EDDINGTON OPACITY IS THE ELECTRON-SCATTERING ONE, AND NOBODY HAD SAID SO. HR_KAPPA is 0.034; electron scattering at the hydrogen fraction the Eddington limit assumes is 0.02(1+0.70), which is 0.034 exactly. The identification is arithmetic rather than a reading of intent',
  Math.abs(kEs(0.70) - 0.034) < 1e-9,
  `0.02 x (1 + 0.70) = ${kEs(0.70).toFixed(4)} against the 0.034 in the file`);

ok('and that opacity has NO METALS IN IT — a free electron scatters a photon the same way whether it came from hydrogen or from iron — so every Eddington number this atlas publishes is metallicity-blind, correctly, and by accident of the constant never having been named',
  (() => {
    /* ASSERTED AS AN OBSERVABLE CONSEQUENCE, NOT AS A PROPERTY OF THE SIGNATURE.
       The first version of this compared kEs(0.70) with kEs(0.70) and called the
       equality a finding — which it is not, it is a tautology, and a mutant that
       gave the function a Z argument passed every check because nothing ever
       used it. What is testable is what a reader would see: push the temperature
       up until Kramers is negligible and the TOTAL opacity stops caring about Z. */
    const T = 3e8, rho = 1;                       /* Kramers suppressed by T^-3.5 */
    const hot = (Z) => kEs(0.70) + kKr(Z, 0.70, rho, T);
    const cool = (Z) => kEs(0.70) + kKr(Z, 0.70, rho, 1e7);
    const hotSpread = Math.abs(hot(ZSUN) / hot(ZSUN / 100) - 1);
    const coolSpread = Math.abs(cool(ZSUN) / cool(ZSUN / 100) - 1);
    return hotSpread < 1e-3 && coolSpread > 5;
  })(),
  `a hundredfold cut in Z moves the total opacity by ${(100 * Math.abs((kEs(0.70) + kKr(ZSUN, 0.70, 1, 3e8)) / (kEs(0.70) + kKr(ZSUN / 100, 0.70, 1, 3e8)) - 1)).toExponential(1)} per cent where scattering dominates, and by ${(100 * Math.abs((kEs(0.70) + kKr(ZSUN, 0.70, 1, 1e7)) / (kEs(0.70) + kKr(ZSUN / 100, 0.70, 1, 1e7)) - 1)).toFixed(0)} per cent where Kramers does`);

ok('it does depend on the HYDROGEN fraction, though, which is a different statement and worth keeping separate: a pure-helium atmosphere scatters at 0.02 against hydrogen\'s 0.034, so the Eddington limit is composition-dependent through X while being blind to Z',
  Math.abs(kEs(0) - 0.02) < 1e-12 && kEs(0.70) / kEs(0) > 1.69,
  `X = 0 gives ${kEs(0).toFixed(4)}, X = 0.70 gives ${kEs(0.70).toFixed(4)} — a factor of ${(kEs(0.70) / kEs(0)).toFixed(2)}`);

console.log('\n=== 4-7. Which opacity wins, decided by arithmetic ===\n');

ok('THE CROSSOVER NEEDS NO STELLAR MODEL. Setting the two equal gives rho_crit = 0.02 T^3.5 / (4e25 Z) — a locus in density and temperature with no mass, no radius and no evolutionary track anywhere in it',
  (() => { const T = 2e7, Z = ZSUN, rc = rhoCrit(T, Z);
    return Math.abs(kKr(Z, 0.70, rc, T) - kEs(0.70)) / kEs(0.70) < 1e-9; })(),
  `at T = 2e7 and solar Z the two are equal at ${rhoCrit(2e7, ZSUN).toFixed(2)} g/cm3, by construction`);

ok('THE SUN IS DEEP IN THE KRAMERS REGIME, so its lifetime carries the metallicity: 150 g/cm3 against a critical 0.57, which is a factor of 260 rather than a near thing',
  (() => { const rc = rhoCrit(1.57e7, ZSUN);
    return dominant(ZSUN, 0.70, 150, 1.57e7) === 'kramers' && 150 / rc > 100; })(),
  `rho = 150 against rho_crit = ${rhoCrit(1.57e7, ZSUN).toFixed(2)} — ${(150 / rhoCrit(1.57e7, ZSUN)).toFixed(0)} times over`);

ok('AND A FORTY-SOLAR-MASS STAR IS NOT, so its lifetime does not carry the metallicity at all. This is the result the laboratory exists for: massive stars are metallicity-blind because of WHAT THEIR OPACITY IS, not because somebody decided the correction was small',
  dominant(ZSUN, 0.70, 3.5, 3.9e7) === 'scattering',
  `rho = 3.5 against rho_crit = ${rhoCrit(3.9e7, ZSUN).toFixed(2)} — scattering dominates and Z has dropped out of the problem`);

ok('the crossing is somewhere near fifteen solar masses and the laboratory reports it as NEAR rather than sharp, because a 15 Msun star sits at 8 g/cm3 against a critical 8.55 — within seven per cent, which is a transition and not a boundary',
  (() => { const rc = rhoCrit(3.4e7, ZSUN); return Math.abs(8 / rc - 1) < 0.15; })(),
  `rho = 8 against rho_crit = ${rhoCrit(3.4e7, ZSUN).toFixed(2)} — the two opacities are within ${(100 * Math.abs(8 / rhoCrit(3.4e7, ZSUN) - 1)).toFixed(0)} per cent of each other there`);

console.log('\n=== 8-10. What this says about numbers the atlas already published ===\n');

ok('THE TURNOFF MASS SITS FAR INSIDE THE REGIME WHERE Z MATTERS. The atlas publishes 1.31 solar masses as the turnoff of a 4.57 Gyr population; a star of that mass has a core denser than the Sun\'s critical density by orders of magnitude, so that number is a statement about composition and was presented as though it were not',
  (() => { const rc = rhoCrit(1.6e7, ZSUN); return 100 / rc > 50; })(),
  `a solar-type core at 100-150 g/cm3 against rho_crit = ${rhoCrit(1.6e7, ZSUN).toFixed(2)} — the turnoff is a Kramers-regime number`);

ok('and lowering the metallicity does not move the Sun out of that regime, which bounds how far the finding reaches: even at a hundredth of solar Z the critical density rises only to 57 g/cm3 against the Sun\'s 150, so a metal-poor solar-mass star is still Kramers-dominated',
  (() => { const rc = rhoCrit(1.57e7, ZSUN / 100); return rc < 150 && rc > 20; })(),
  `Z = Zsun/100 lifts rho_crit to ${rhoCrit(1.57e7, ZSUN / 100).toFixed(0)} g/cm3, still under the Sun's 150`);

ok('[Fe/H] IS NOW EXPRESSIBLE, which it was not: a census of the source returned the notation zero times. A globular cluster at three per cent of solar metals is [Fe/H] = -1.52, which is where the oldest clusters actually sit',
  (() => { const f = feh(ZSUN * 0.03); return Math.abs(f + 1.52) < 0.02; })(),
  `Z/Zsun = 0.03 is [Fe/H] = ${feh(ZSUN * 0.03).toFixed(2)}, and the round trip back is exact`);

console.log('\n=== 11-12. Scaling, and the atlas read back ===\n');

ok('KRAMERS SCALES LINEARLY WITH Z AND SCATTERING NOT AT ALL, and the check is that the RATIO of the two moves by exactly the factor the metallicity moved by — the property that makes "which one dominates" a question with a clean answer rather than a judgement',
  (() => {
    const r1 = kKr(ZSUN, 0.70, 10, 2e7) / kEs(0.70);
    const r2 = kKr(ZSUN / 10, 0.70, 10, 2e7) / kEs(0.70);
    return Math.abs(r1 / r2 - 10) < 1e-9;
  })(),
  'a tenfold cut in Z cuts the ratio tenfold, to nine figures — scattering did not move because it cannot');

ok('AND THE ATLAS IS RUNNING THESE. This file wrote the opacities out from scratch; this check opens index.html and confirms the same two constants and the same crossover locus are there, and that HR_KAPPA is still the 0.034 the first check identified',
  (() => { const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    return /const ZM_KRAMERS_C = 4e25;/.test(src)
        && /const ZM_ES_C = 0\.02;/.test(src)
        && /zmCriticalDensity=\(T,Z\)=>ZM_ES_C\*Math\.pow\(Math\.max\(1,T\),3\.5\)\/\(ZM_KRAMERS_C/.test(src)
        && /const HR_KAPPA=0\.034;/.test(src); })(),
  'both opacity constants, the crossover locus and the Eddington kappa are all present in the atlas source');

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
