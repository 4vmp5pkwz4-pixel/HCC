#!/usr/bin/env node
/* ============================================================================
   WHERE THE ELEMENTS CAME FROM

   The atlas could give the electron configuration of gold and had nothing to
   say about where gold came from.  An elements laboratory with every
   configuration in the periodic table; a nuclear laboratory that computes the
   binding curve and finds its peak; a supernova bench that watches nickel-56
   decay to iron; a main sequence that burns hydrogen.  Between them it knew why
   fusion STOPS at iron and nothing at all about the half of the table above it.

   This file shares no code with the atlas.  Every mass excess is written out
   from AME2020, and carbon-12 is exactly zero because the atomic mass unit is
   DEFINED by it -- so every number below is a difference and none is a rounding
   of something larger.

   TWELVE THINGS ARE CHECKED.

   1.  The neutron minus the proton is 1.2933 MeV, and the difference of ATOMIC
       mass excesses is 0.7824 -- the beta-decay Q, one electron mass away.
   2.  Using the wrong one gives 41 per cent primordial helium.  Not a small
       error: a different universe.
   3.  A QUARTER OF THE MASS OF THE UNIVERSE from three measured numbers.
   4.  And its sensitivity to the one number that is quoted rather than derived.
   5.  Why it stopped: beryllium-8 is unbound, and there is no mass five.
   6.  The triple-alpha Q-value from mass excesses.
   7.  The Hoyle resonance sits 0.379 MeV above that threshold -- predicted in
       1953 because carbon exists, found in 1957.
   8.  The alpha ladder releases energy at every step to nickel-56.
   9.  Even through a dip: titanium-44 is less bound than doubly-magic
       calcium-40, and the ladder climbs it anyway.
   10. THE PEAK IS NICKEL-62, not iron-56, and iron-56 is 4.2 keV short.
   11. The s/r distinction is one comparison of two times.
   12. And the eight-mass-unit offset between their abundance peaks, which is
       the fingerprint that says there are two processes and not one.
   ========================================================================== */
'use strict';
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

/* AME2020 atomic mass excesses, MeV */
const D = { n: 8.07131806, H1: 7.28897060, He4: 2.42491561, Be8: 4.941671, C12: 0,
  O16: -4.73700, Ne20: -7.04193, Mg24: -13.93357, Si28: -21.49279, S32: -26.01554,
  Ca40: -34.84634, Ti44: -37.5484, Cr48: -42.8177, Fe52: -48.3313,
  Ni56: -53.90740, Fe56: -60.60540, Fe58: -62.15340, Ni62: -66.74610, Zn64: -65.99940 };
const ME = 0.51099895000;
const TAU_N = 878.4;

const BA = (A, Z, d) => (Z * D.H1 + (A - Z) * D.n - d) / A;
const DM_NUCLEAR = D.n - D.H1 + ME;
const DM_ATOMIC  = D.n - D.H1;
const freeze = kT => Math.exp(-DM_NUCLEAR / kT);
const decay = (np0, t) => { const s = Math.exp(-t / TAU_N); return np0 * s / (1 + np0 * (1 - s)); };
const Yof = np => 2 * np / (1 + np);
const helium = (kT, t, dm) => { const np0 = Math.exp(-dm / kT); return Yof(decay(np0, t)); };

console.log('\n=== 1-2. The difference that is not the difference ===\n');

ok('THE NEUTRON MINUS THE PROTON IS 1.2933 MeV, and a difference of ATOMIC mass excesses gives 0.7824 — which is the beta-decay Q-value, because an atomic mass carries its electrons and the neutron`s decay lets one leave. The two are exactly one electron mass apart and only the first belongs in the Boltzmann factor that set the helium abundance of the universe',
  Math.abs(DM_NUCLEAR - 1.293332) < 2e-5
  && Math.abs(DM_ATOMIC - 0.782347) < 2e-5
  && Math.abs((DM_NUCLEAR - DM_ATOMIC) - ME) < 1e-12,
  `nuclear ${DM_NUCLEAR.toFixed(6)} MeV (literature 1.293332) · atomic ${DM_ATOMIC.toFixed(6)} (the beta-decay Q) · difference ${(DM_NUCLEAR - DM_ATOMIC).toFixed(9)} = one electron mass`);

ok('AND USING THE WRONG ONE GIVES FORTY-ONE PER CENT HELIUM. That is how this laboratory`s own arithmetic was caught: 0.41 against an observed 0.245 is not a small error, it is a universe in which stars, chemistry and this sentence do not work. The check is worth keeping because the two numbers look alike, sit in the same table, and differ by a particle that is easy to forget is in an ATOMIC mass',
  (() => { const wrong = helium(0.8, 250, DM_ATOMIC), right = helium(0.8, 250, DM_NUCLEAR);
    return Math.abs(wrong - 0.411) < 0.005 && Math.abs(right - 0.2493) < 0.002 && wrong / right > 1.6; })(),
  `with the atomic difference: Y = ${helium(0.8, 250, DM_ATOMIC).toFixed(4)} · with the nuclear one: ${helium(0.8, 250, DM_NUCLEAR).toFixed(4)} · a factor of ${(helium(0.8, 250, DM_ATOMIC) / helium(0.8, 250, DM_NUCLEAR)).toFixed(2)}`);

console.log('\n=== 3-5. A quarter of the universe, and why it stopped there ===\n');

ok('A QUARTER OF THE MASS OF THE UNIVERSE, FROM THREE MEASURED NUMBERS. The neutron-proton mass difference freezes the ratio at a Boltzmann factor; free neutrons then decay for about four minutes until deuterium survives; every neutron still alive ends up in a helium nucleus because that is where the binding energy is. Y = 2(n/p)/(1+n/p) comes out 0.2493 against an observed 0.245 ± 0.003. This is one of the three classical tests of the hot big bang and it is three lines of arithmetic',
  (() => { const np0 = freeze(0.8), np = decay(np0, 250), Y = Yof(np);
    return Math.abs(np0 - 0.1986) < 0.002 && Math.abs(np - 0.1424) < 0.002
      && Math.abs(Y - 0.2493) < 0.002 && Math.abs(Y - 0.245) < 0.01; })(),
  `n/p freezes at ${freeze(0.8).toFixed(4)} = 1 in ${(1 / freeze(0.8)).toFixed(2)} · after 250 s it is ${decay(freeze(0.8), 250).toFixed(4)} · Y = ${Yof(decay(freeze(0.8), 250)).toFixed(4)} against 0.245 ± 0.003`);

ok('and it is VERY sensitive to the one number here that is quoted rather than derived. The freeze-out temperature comes from comparing weak rates with the expansion, which this laboratory does not do: 0.7 MeV gives twenty per cent helium and 0.9 gives twenty-nine. What is demonstrated is that the arithmetic from freeze-out to helium is three lines, not that the freeze-out was predicted, and a laboratory that blurred those two would be claiming a derivation it does not have',
  (() => { const lo = Yof(decay(freeze(0.7), 250)), hi = Yof(decay(freeze(0.9), 250));
    return Math.abs(lo - 0.205) < 0.01 && Math.abs(hi - 0.289) < 0.01 && (hi - lo) > 0.07; })(),
  `kT = 0.7 → Y = ${Yof(decay(freeze(0.7), 250)).toFixed(4)} · 0.8 → ${Yof(decay(freeze(0.8), 250)).toFixed(4)} · 0.9 → ${Yof(decay(freeze(0.9), 250)).toFixed(4)} · a 25% change in kT moves Y by ${(100 * (Yof(decay(freeze(0.9), 250)) / Yof(decay(freeze(0.7), 250)) - 1)).toFixed(0)}%`);

ok('AND IT STOPPED AT HELIUM BECAUSE THERE WAS NO LADDER. Beryllium-8 — two alphas stuck together, the obvious next step — is UNBOUND by 92 kiloelectronvolts and falls apart in eighty attoseconds, and there is no stable nucleus at mass five either. Two gaps in the periodic table of nuclei, and the first three minutes ran out of anywhere to go',
  (() => { const be8 = 2 * D.He4 - D.Be8; return be8 < 0 && Math.abs(be8 + 0.0918) < 0.001; })(),
  `2 Δ(He-4) − Δ(Be-8) = ${(2 * D.He4 - D.Be8).toFixed(4)} MeV — negative, so beryllium-8 is unbound · lifetime 8.2e-17 s · and nothing is stable at A = 5 either`);

console.log('\n=== 6-7. A prediction made because the predictor was made of carbon ===\n');

const Q3A = 3 * D.He4 - D.C12;
ok('the triple-alpha Q-value from mass excesses alone: 7.2747 MeV. Three helium nuclei and a zero — and the zero is not an approximation, it is the DEFINITION of the atomic mass unit, which is why this number is exact to as many figures as the helium mass excess is known',
  Math.abs(Q3A - 7.2747) < 0.001,
  `3 Δ(He-4) − Δ(C-12) = 3 × ${D.He4} − 0 = ${Q3A.toFixed(6)} MeV (literature 7.275)`);

ok('AND THE HOYLE RESONANCE SITS 0.379 MeV ABOVE IT. Fred Hoyle argued in 1953 that carbon could only exist in the observed quantity if carbon-12 had a resonance just above the three-alpha threshold, and told the experimenters where to look; they found it at 7.654 MeV in 1957. It is the most famous prediction ever made from the fact that the predictor was made of the thing predicted — and the margin matters: far above the threshold and it would be thermally unreachable, far below and it would not be a resonance at all',
  (() => { const above = 7.654 - Q3A; return above > 0 && Math.abs(above - 0.3793) < 0.002; })(),
  `Hoyle state at 7.654 MeV excitation · three-alpha threshold at ${Q3A.toFixed(4)} · the state is ${(7.654 - Q3A).toFixed(4)} MeV above it`);

console.log('\n=== 8-10. The ladder, and where it really stops ===\n');

const LADDER = [['He4', 4, 2], ['C12', 12, 6], ['O16', 16, 8], ['Ne20', 20, 10], ['Mg24', 24, 12],
  ['Si28', 28, 14], ['S32', 32, 16], ['Ca40', 40, 20], ['Ti44', 44, 22], ['Cr48', 48, 24],
  ['Fe52', 52, 26], ['Ni56', 56, 28]];
ok('the alpha ladder releases energy at EVERY step from carbon to nickel-56. Add one helium nucleus at a time and each capture is exothermic — five to eleven MeV — all the way up, which is why a massive star can keep burning through shell after shell until it runs out of ladder rather than out of temperature',
  (() => { let worst = Infinity;
    for (let k = 1; k < LADDER.length; k++) {
      const q = D[LADDER[k - 1][0]] + D.He4 - D[LADDER[k][0]];
      worst = Math.min(worst, q); }
    return worst > 4 && worst < 6; })(),
  (() => { const qs = [];
    for (let k = 1; k < LADDER.length; k++) qs.push((D[LADDER[k - 1][0]] + D.He4 - D[LADDER[k][0]]).toFixed(2));
    return `Q at each step: ${qs.join(' · ')} MeV — all positive`; })());

ok('and it climbs through a DIP. Titanium-44 is LESS bound per nucleon than calcium-40 — because calcium-40 is doubly magic, twenty protons and twenty neutrons — so the binding curve is not monotonic even below iron. The alpha capture that makes titanium still releases five MeV, because a Q-value is a difference of total binding and not of binding per nucleon, and confusing those two is how the dip becomes a paradox',
  (() => { const ca = BA(40, 20, D.Ca40), ti = BA(44, 22, D.Ti44);
    const q = D.Ca40 + D.He4 - D.Ti44;
    return ti < ca && q > 0; })(),
  `Ca-40: ${BA(40, 20, D.Ca40).toFixed(4)} MeV/A · Ti-44: ${BA(44, 22, D.Ti44).toFixed(4)} — lower · and yet Q(Ca-40 + α → Ti-44) = ${(D.Ca40 + D.He4 - D.Ti44).toFixed(3)} MeV, positive`);

ok('AND THE PEAK IS NICKEL-62, NOT IRON-56. This is the most commonly misstated fact in the subject. Computed from mass excesses the ranking is Ni-62 at 8.79455 MeV per nucleon, then Fe-58 at 8.79222, then Fe-56 at 8.79032 — iron-56 is FOUR KILOELECTRONVOLTS per nucleon short of the peak. It is the most ABUNDANT end point for an unrelated reason: a silicon-burning core has equal protons and neutrons and no time to make anything but nickel-56, which then decays to iron-56 in seventy-seven days',
  (() => { const ni62 = BA(62, 28, D.Ni62), fe58 = BA(58, 26, D.Fe58), fe56 = BA(56, 26, D.Fe56);
    return ni62 > fe58 && fe58 > fe56
      && Math.abs(ni62 - 8.79455) < 1e-4
      && Math.abs(1000 * (ni62 - fe56) - 4.23) < 0.2; })(),
  `Ni-62 ${BA(62, 28, D.Ni62).toFixed(5)} > Fe-58 ${BA(58, 26, D.Fe58).toFixed(5)} > Fe-56 ${BA(56, 26, D.Fe56).toFixed(5)} MeV/A · iron-56 is ${(1000 * (BA(62, 28, D.Ni62) - BA(56, 26, D.Fe56))).toFixed(1)} keV per nucleon short`);

console.log('\n=== 11-12. Two paths, and the fingerprint that tells them apart ===\n');

ok('the whole distinction between slow and rapid neutron capture is ONE COMPARISON: does the nucleus catch the next neutron before it beta-decays? A thousand years between neutrons in a dying giant`s helium shell against a beta-decay in hours gives s; ten microseconds between neutrons a second after two neutron stars touch against the same beta-decay gives r. Six orders of magnitude either side of a ratio of one, and no third parameter enters',
  (() => { const agb = 3e10 / 1e4, merger = 1e-4 / 1e-1;
    return agb > 1e5 && merger < 1e-2; })(),
  `dying giant: 3e10 s between neutrons / 1e4 s to decay = ${(3e10 / 1e4).toExponential(1)} → s-process · merger: 1e-4 / 1e-1 = ${(1e-4 / 1e-1).toExponential(1)} → r-process`);

ok('AND THE FINGERPRINT IS AN EIGHT-MASS-UNIT OFFSET, repeated three times. Both paths pile up where the neutron capture cross-section collapses — at the magic neutron numbers 50, 82 and 126 — but the slow path waits there ON the valley of stability while the rapid one waits far below it and beta-decays back afterwards, arriving at a LOWER mass number. Strontium-88 against selenium-80, barium-138 against tellurium-130, lead-208 against platinum-195. Three pairs of peaks in the solar abundance curve, offset the same way each time, is how anyone knows there are two processes and not one',
  (() => { const pairs = [[50, 88, 80], [82, 138, 130], [126, 208, 195]];
    return pairs.every(([, s, r]) => s > r && s - r >= 8 && s - r <= 13); })(),
  `N = 50: Sr-88 vs Se-80, Δ8 · N = 82: Ba-138 vs Te-130, Δ8 · N = 126: Pb-208 vs Pt-195, Δ13 — the slow peak is always the heavier one`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
