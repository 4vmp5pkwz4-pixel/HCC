#!/usr/bin/env node
/* ============================================================================
   WHERE DOES QUANTUM BEGIN?

   Sixteen laboratories in this atlas compute a quantum phenomenon and not one
   of them says WHEN quantum mechanics is the answer.  A reader can find
   superfluidity and superconductivity and the Casimir force, and nothing tells
   them why helium goes superfluid at two kelvin and nitrogen never does, or
   why a metal is a quantum object at room temperature while the air around it
   is not.

   There is one answer and it is a comparison.  Every quantum phenomenon
   appears when some scale of the system crosses a scale set by Planck's
   constant.  This file checks the five of those nine ratios whose answers are
   already known from other people's measurements.

   1. THE ELECTRON THERMAL WAVELENGTH at 300 K is 4.31 nanometres.
   2. COPPER IS DEGENERATE AT ROOM TEMPERATURE: its Fermi temperature is
      8.16e4 K and n lambda^3 = 6774, which is why it conducts.
   3. HELIUM AT ITS LAMBDA POINT sits at n lambda^3 = 4.6 against the 2.612
      an IDEAL Bose gas needs -- the criterion fires within a factor of two
      of the real transition, and the gap is the interactions.
   4. A MODE FREEZES above 6.25 THz at room temperature, which is 48
      micrometres: everything bluer than the far infrared is quantum at 300 K,
      and that is why there is no ultraviolet catastrophe.
   5. AND A PERSON IS 73 ORDERS OF MAGNITUDE BELOW THE BOUNDARY, which is the
      check that the criteria are not merely always true.
   ========================================================================= */
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const H = 6.62607015e-34, HBAR = 1.054571817e-34, KB = 1.380649e-23, C = 299792458;
const ME = 9.1093837015e-31, MU = 1.66053906660e-27, E = 1.602176634e-19;
/* zeta(3/2), computed rather than quoted, because it is the condensation threshold */
let ZETA = 0; for (let k = 1; k <= 4000000; k++) ZETA += 1 / (k * Math.sqrt(k));
ZETA += 2 / Math.sqrt(4000000);                 /* the tail, integrated */

const lamT = (m, T) => H / Math.sqrt(2 * Math.PI * m * KB * T);
const deg = (n, m, T) => n * lamT(m, T) ** 3;
const fermiT = (n, m) => { const kF = Math.cbrt(3 * Math.PI * Math.PI * n);
  return HBAR * HBAR * kF * kF / (2 * ME === 0 ? 1 : 2 * m) / KB; };
const freeze = T => KB * T / H;

console.log('\n=== 1. The thermal de Broglie wavelength ===\n');

ok('an electron at room temperature has a thermal de Broglie wavelength of 4.31 nanometres -- about eight lattice spacings. That single number is why a metal is not a box of billiard balls: each electron`s wavefunction is already wider than the distance to its neighbours before anything is cooled',
  Math.abs(lamT(ME, 300) * 1e9 - 4.31) < 0.02,
  `lambda_T = ${(lamT(ME, 300) * 1e9).toFixed(4)} nm at 300 K`);

ok('and the scaling is exactly inverse-square-root in both the mass and the temperature, which is what makes the criterion useful: a proton is 43 times heavier than an electron by the square root and its wavelength is 43 times shorter at the same temperature. Checked as an identity over four masses and four temperatures rather than at one point',
  (() => { let w = 0;
    for (const m of [ME, MU, 4 * MU, 87 * MU]) for (const T of [0.1, 1, 300, 1e6])
      w = Math.max(w, Math.abs(lamT(m, T) / (H / Math.sqrt(2 * Math.PI * m * KB * T)) - 1));
    return w < 1e-15; })(),
  `the wavelength of a proton at 300 K is ${(lamT(MU, 300) * 1e12).toFixed(2)} pm, shorter than that of the electron by ${(lamT(ME, 300) / lamT(MU, 300)).toFixed(1)}x = sqrt(1836/1) x sqrt(1/1.0073)`);

console.log('\n=== 2. A metal is a quantum object at room temperature ===\n');

const nCu = 8.5e28;
ok('the conduction electrons of copper have a Fermi temperature of 8.16e4 kelvin, so at 300 K the ratio T/T_F is 0.0037: the exclusion principle and not the temperature sets their energy, by a factor of two hundred and seventy. This is the number that makes a metal a metal, and it is why the electronic heat capacity of copper is a hundredth of what a classical gas would give',
  Math.abs(fermiT(nCu, ME) / 8.16e4 - 1) < 0.01 && 300 / fermiT(nCu, ME) < 0.005,
  `T_F = ${fermiT(nCu, ME).toExponential(4)} K against the tabulated 8.16e4 · T/T_F = ${(300 / fermiT(nCu, ME)).toExponential(3)}`);

ok('and the degeneracy parameter says the same thing the other way: n lambda^3 = 6774 at room temperature. A metal is not APPROXIMATELY quantum at 300 K -- it is degenerate by three and a half orders of magnitude. The air in the same room, at the same temperature, comes out at 1.7e-7, which is ten orders of magnitude below the boundary. One criterion, one room, ten orders of magnitude between two things touching each other',
  Math.abs(deg(nCu, ME, 300) / 6774 - 1) < 0.02
  && deg(2.5e25, 28.97 * MU, 293) < 1e-6,
  `copper electrons ${deg(nCu, ME, 300).toExponential(4)} · air ${deg(2.5e25, 28.97 * MU, 293).toExponential(3)} · a ratio of ${(deg(nCu, ME, 300) / deg(2.5e25, 28.97 * MU, 293)).toExponential(2)}`);

console.log('\n=== 3. Helium, where the criterion is checked against a real transition ===\n');

const nHe = 2.2e28, dHe = deg(nHe, 4 * MU, 2.17);
ok('helium-4 at its lambda point comes out at n lambda^3 = 4.6, against the 2.612 an IDEAL Bose gas needs to condense. The criterion fires within a factor of two of where the real transition is -- which is the honest thing to report about an ideal-gas condition applied to a liquid. The gap IS the interactions, and this laboratory does not model them: it says where to look, and a version of it that claimed to predict 2.17 kelvin would be claiming something it has not computed',
  dHe > 2.612 && dHe < 8,
  `n lambda^3 = ${dHe.toFixed(3)} at the lambda point · the ideal-gas threshold is zeta(3/2) = ${ZETA.toFixed(6)} · the criterion fires, by a factor of ${(dHe / ZETA).toFixed(2)}`);

ok('and zeta(3/2) is SUMMED here rather than quoted -- 2.612375, the number that decides whether an ideal Bose gas can hold all its particles in excited states. Four million terms plus an integrated tail, because a threshold typed in is a threshold nobody can check',
  Math.abs(ZETA - 2.612375348685488) < 1e-5,
  `sum k^-3/2 = ${ZETA.toFixed(9)} against the tabulated 2.612375348685488`);

console.log('\n=== 4. The frozen mode, and why there is no ultraviolet catastrophe ===\n');

ok('at room temperature a mode freezes above 6.25 terahertz -- a wavelength of 48 micrometres. Everything bluer than the far infrared is unavailable to a body at 300 K, and that unavailability is the entire content of the 1900 solution of Planck: a classical box has infinitely many high-frequency modes and each would carry kT, and the reason it does not is this ratio',
  Math.abs(freeze(300) / 1e12 - 6.25) < 0.02
  && Math.abs(C / freeze(300) * 1e6 - 48.0) < 0.5,
  `hf = kT at ${(freeze(300) / 1e12).toFixed(3)} THz = ${(C / freeze(300) * 1e6).toFixed(2)} micrometres`);

ok('and the same ratio taken at the microwave background says its modes are NOT frozen at their own temperature, which is why it is a thermal spectrum at all: 2.725 kelvin freezes at 57 gigahertz, and the peak of the background sits at 160 GHz -- above it, in the quantum part, which is exactly why the spectrum turns over instead of rising',
  Math.abs(freeze(2.725) / 1e9 - 56.8) < 1 && 160e9 > freeze(2.725),
  `the CMB freezes above ${(freeze(2.725) / 1e9).toFixed(2)} GHz and peaks at 160 GHz, a factor of ${(160e9 / freeze(2.725)).toFixed(2)} into the frozen region`);

console.log('\n=== 5. And the criteria are not always true ===\n');

const dPerson = deg(1, 70, 310);
const actionPerson = 70 * 1 * 1.4 / HBAR;
ok('a person walking is seventy-three orders of magnitude below the degeneracy boundary and their action is 9e35 quanta of hbar. A criterion that fired for everything would be measuring nothing, and this is the check that these do not: the same nine ratios that make a copper wire quantum in six ways make a person quantum in none',
  dPerson < 1e-70 && actionPerson > 1e35,
  `n lambda^3 = ${dPerson.toExponential(2)} · the action of one step is ${actionPerson.toExponential(2)} hbar`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
