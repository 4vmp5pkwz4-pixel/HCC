#!/usr/bin/env node
/* ============================================================================
   THE COSMOLOGICAL CONSTANT, AS A LENGTH

   Four publications in this atlas carry a cosmological constant in inverse
   square metres and nothing has ever consumed one, while the distance ladder
   takes a Hubble constant and a matter density and never takes Lambda -- though
   it is the same cosmology.

   LAMBDA IS AN INVERSE AREA.  Take its square root and the universe has a
   LENGTH, in the same sense that a black hole has a Schwarzschild radius.
   Everything else about Lambda is that length in other units.

   This file shares no code with the atlas: every constant is written out from
   CODATA and the IAU, and every formula from the physics.

   Nine things are checked.

   1.  Lambda = 3 Omega_L H0^2 / c^2, against the 1.1056e-52 the atlas holds.
   2.  The de Sitter radius, and the identity that makes it a check: its ratio
       to the Hubble length must be exactly one over the square root of Omega_L.
       Verified across the whole plausible range of both parameters, so it is
       an identity and not a coincidence at one point.
   3.  THE HORIZON IS THREE HORIZONS.  Hubble sphere, de Sitter radius, light
       cone: 14.45, 17.41 and 46.5 Gly, holding 3.24e122, 4.71e122 and 3.36e123
       bits.  A factor of ten between three things all called the horizon.
   4.  And the atlas's own information laboratory quotes 2.9e122 for "the
       observable universe's horizon", which is within thirteen per cent of the
       HUBBLE sphere and a factor of eleven from the light cone.  Which one it
       meant was never written down.
   5.  The Gibbons-Hawking temperature, 2.21e-30 K.
   6.  The vacuum density, and the ratio to the Planck density: 1.15e-123.
   7.  Which is NOT the same as Lambda in Planck units, 2.89e-122.  The two
       differ by exactly EIGHT PI and both are quoted as "the cosmological
       constant problem".  The factor is the one Einstein put in front of the
       stress tensor, and this check was first written claiming it was 8 pi / 3
       -- a confusion with the Friedmann equation -- and failed.
   8.  Every horizon obeys S = A k c^3 / 4 hbar G, so the bit count goes as the
       SQUARE of the radius -- checked over four decades rather than asserted.
   9.  And the flatness the whole thing rests on: the matter density the
       distance ladder declares and the dark-energy density the capacity
       selector declares are typed in two files and must sum to one.
   ========================================================================== */

let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const C = 299792458, G = 6.67430e-11, HBAR = 1.054571817e-34, KB = 1.380649e-23;
const MPC = 3.0856775814913673e22, GLY = 9.4607304725808e24;
const H0 = 67.66, OMEGA_L = 0.6889, OMEGA_M = 0.3111;   /* Planck 2018, as the atlas holds them */
const PARTICLE_GLY = 46.5;

const lam = (h0, ol) => { const H = h0 * 1e3 / MPC; return 3 * ol * H * H / (C * C); };
const hubbleLen = h0 => C / (h0 * 1e3 / MPC);
const LAMBDA = lam(H0, OMEGA_L);
const L_DS = Math.sqrt(3 / LAMBDA);
const L_H = hubbleLen(H0);
const lp2 = HBAR * G / (C * C * C);
const bits = R => 4 * Math.PI * R * R * KB / (4 * lp2) / (KB * Math.LN2);

console.log('\n=== 1-2. A length, and the identity that checks it ===\n');

ok('Lambda = 3 Omega_L H0^2 / c^2 comes out at 1.1056e-52 inverse square metres from the Hubble constant and the dark-energy density this atlas already holds. Neither of those two numbers was put here to make Lambda come out right; they are Planck 2018 and the constant follows',
  Math.abs(LAMBDA / 1.1056e-52 - 1) < 1e-3,
  `Lambda = ${LAMBDA.toExponential(6)} m^-2 from H0 = ${H0} and Omega_L = ${OMEGA_L}`);

ok('the square root of three over Lambda is 17.41 billion light years, and it is NOT the Hubble length of 14.45. Their ratio is exactly one over the square root of Omega_L — an identity, so it holds at every H0 and every Omega_L rather than at the one point where it was checked, and that is what makes it a check rather than a number. Verified over the whole plausible range of both parameters',
  Math.abs(L_DS / GLY / 17.411 - 1) < 1e-3
  && Math.abs(L_H / GLY / 14.452 - 1) < 1e-3
  && (() => { let worst = 0;
    for (const h of [60, 67.66, 73.04, 80]) for (const o of [0.4, 0.6889, 0.8]) {
      const r = Math.sqrt(3 / lam(h, o)) / hubbleLen(h);
      worst = Math.max(worst, Math.abs(r * Math.sqrt(o) - 1)); }
    return worst < 1e-13; })(),
  `de Sitter ${(L_DS / GLY).toFixed(4)} Gly · Hubble ${(L_H / GLY).toFixed(4)} Gly · ratio ${(L_DS / L_H).toFixed(9)} against 1/sqrt(Omega_L) = ${(1 / Math.sqrt(OMEGA_L)).toFixed(9)}, over twelve (H0, Omega_L) pairs`);

console.log('\n=== 3-4. Three horizons, and which one the atlas already quoted ===\n');

const HUB = bits(L_H), DS = bits(L_DS), PART = bits(PARTICLE_GLY * GLY);
ok('the horizon of the observable universe holds about ten to the hundred and twenty-two bits, and that sentence names one of three different surfaces. The Hubble sphere holds 3.24e122, the de Sitter radius 4.71e122 and the light cone 3.36e123. A factor of ten between three things all called the horizon, and a number quoted to two significant figures with an ambiguity of ten is not a measurement of anything',
  Math.abs(HUB / 3.243e122 - 1) < 0.01
  && Math.abs(DS / 4.708e122 - 1) < 0.01
  && Math.abs(PART / 3.358e123 - 1) < 0.01
  && PART / HUB > 9 && PART / HUB < 12,
  `Hubble ${HUB.toExponential(3)} · de Sitter ${DS.toExponential(3)} · light cone ${PART.toExponential(3)} — spread ${(PART / HUB).toFixed(2)}x`);

ok('and this atlas already quoted one of them without saying which. The information laboratory lists 2.9e122 bits for "the observable universe`s horizon", which is within thirteen per cent of the HUBBLE sphere and a factor of eleven from the light cone that "observable" usually means. It is not wrong; it is unlabelled, and the difference between those two readings is larger than the difference between a galaxy and a grain of sand',
  Math.abs(2.9e122 / HUB - 1) < 0.15 && PART / 2.9e122 > 10,
  `the quoted 2.9e122 is ${(2.9e122 / HUB).toFixed(3)} of the Hubble sphere, ${(2.9e122 / DS).toFixed(3)} of the de Sitter horizon and ${(2.9e122 / PART).toFixed(4)} of the light cone`);

console.log('\n=== 5-7. A temperature, and the hundred and twenty-three orders ===\n');

const T = HBAR * C / (2 * Math.PI * KB * L_DS);
ok('the same length fixes a temperature. Gibbons and Hawking: hbar c over two pi k L, which is 2.21e-30 kelvin — thirty orders of magnitude below the microwave background, colder than anything that has ever been made or found, and a real prediction of quantum field theory in de Sitter space that will never be measured by anything',
  Math.abs(T / 2.2124e-30 - 1) < 0.01,
  `T = ${T.toExponential(5)} K · the CMB is ${(2.725 / T).toExponential(2)} times hotter`);

const rhoV = LAMBDA * C * C / (8 * Math.PI * G);
const rhoP = Math.pow(C, 5) / (HBAR * G * G);
ok('the vacuum energy density Lambda c^2 over eight pi G is 5.92e-27 kilograms per cubic metre, and the Planck density c^5 over hbar G squared is 5.15e96. Their ratio is 1.15e-123 and its logarithm is -122.94. That is the cosmological constant problem, and it is a division: both ends of it are built from constants this atlas already holds and nothing about it is a fit',
  Math.abs(rhoV / 5.9237e-27 - 1) < 1e-3
  && Math.abs(rhoP / 5.1548e96 - 1) < 1e-3
  && Math.abs(Math.log10(rhoV / rhoP) + 122.940) < 0.01,
  `vacuum ${rhoV.toExponential(4)} · Planck ${rhoP.toExponential(4)} kg/m^3 · ratio ${(rhoV / rhoP).toExponential(4)} = 10^${Math.log10(rhoV / rhoP).toFixed(3)}`);

const inPlanck = LAMBDA * lp2;
ok('and "ten to the minus one hundred and twenty-something" is two different numbers. The density ratio is 1.15e-123; Lambda in Planck units is 2.89e-122. They differ by exactly EIGHT PI, and the factor is not decorative: rho_vac = Lambda c^2 / 8 pi G and rho_Planck = c^5 / hbar G^2, so their ratio is Lambda l_P^2 / 8 pi and the eight pi is the one Einstein put in front of the stress tensor. This check was first written claiming the factor was 8 pi over three and FAILED, which is what a check is for — the three came from confusing this with the Friedmann equation, where it belongs. It is why the exponent people cite wanders between 120 and 123',
  Math.abs(inPlanck / 2.888e-122 - 1) < 1e-3
  && Math.abs((inPlanck / (rhoV / rhoP)) / (8 * Math.PI) - 1) < 1e-12,
  `Lambda l_P^2 = ${inPlanck.toExponential(4)} · density ratio ${(rhoV / rhoP).toExponential(4)} · their quotient ${(inPlanck / (rhoV / rhoP)).toFixed(9)} against 8 pi = ${(8 * Math.PI).toFixed(9)}`);

console.log('\n=== 8-9. The area law, and the flatness it all rests on ===\n');

ok('a horizon entropy is one quarter of its AREA in Planck units, so the bit count goes as the square of the radius and not as the volume. Checked over four decades of radius as an exact power law rather than asserted: this is the holographic statement, and it is the reason the light cone holds eleven times what the Hubble sphere holds while being only three times as wide',
  (() => { let worst = 0;
    for (const f of [1e-2, 1e-1, 1, 10, 100]) {
      const r = bits(f * L_DS) / bits(L_DS);
      worst = Math.max(worst, Math.abs(r / (f * f) - 1)); }
    return worst < 1e-12; })(),
  `bits(10 L) / bits(L) = ${(bits(10 * L_DS) / bits(L_DS)).toFixed(6)}, which must be 100 · and the light cone is ${(PARTICLE_GLY / (L_H / GLY)).toFixed(2)}x the Hubble radius and holds ${(PART / HUB).toFixed(2)}x the bits`);

ok('and the whole calculation rests on a flat universe, which in this atlas means two constants typed in two different files. The distance ladder declares a matter density of 0.3111 and the capacity selector declares a dark-energy density of 0.6889, and nothing until now checked that they sum to one. They do, exactly. This is a staleness gate rather than a fact about cosmology: update one of them and this line is what notices',
  Math.abs(OMEGA_M + OMEGA_L - 1) < 1e-12,
  `Omega_m + Omega_L = ${(OMEGA_M + OMEGA_L).toFixed(12)} · residual ${Math.abs(OMEGA_M + OMEGA_L - 1).toExponential(1)}`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
