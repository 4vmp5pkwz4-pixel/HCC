#!/usr/bin/env node
/* ============================================================================
   WHAT DOES ONE BIT COST?

   Entropy is published in three clusters of this atlas and consumed in none.
   A Bekenstein-Hawking entropy in J/K and a horizon area in square metres from
   the black-hole laboratory; an entropy from the heat engine; entropies in
   NATS from the kinetic theory, the anyon zoo and the embadon laboratory.
   Five laboratories, three units, and in ninety-nine of them not one
   instrument ever took an entropy as an input.

   That is not a missing conversion.  It is a missing idea: entropy and
   information are one quantity, and the quantity has a price.

   Five things are checked, all against numbers other people measured or
   derived.

   1. LANDAUER.  Erasing one bit costs at least kT ln2 -- 2.87e-21 joules at
      room temperature, 17.9 millielectronvolts.
   2. THE PLANCK AREA AND THE HOLOGRAPHIC DENSITY.  1.38e69 bits per square
      metre of horizon, and it does not depend on what fell in.
   3. A SOLAR-MASS HOLE: a Schwarzschild radius of 2.95 km, an area of 1.1e8
      square metres, and 1.5e77 bits.
   4. THE SPEED LIMITS.  Margolus-Levitin at 6.04e33 state changes per second
      per joule, and Bremermann at 1.356e50 bits per second per kilogram --
      quoted in its conventional form c^2/h, NOT divided by ln2.
   5. AND THE GAP THAT STARTED THE SUBJECT: a solar-mass horizon holds about
      twenty orders of magnitude more entropy than the star that could have
      made it.
   ========================================================================= */
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const KB = 1.380649e-23, HBAR = 1.054571817e-34, H = 6.62607015e-34;
const C = 299792458, G = 6.67430e-11, LN2 = Math.LN2;
const MSUN = 1.98892e30, EV = 1.602176634e-19;

const planckArea = HBAR * G / (C * C * C);
const landauer = T => KB * T * LN2;
const bitsFromJK = S => S / (KB * LN2);
const horizonS = A => A * KB / (4 * planckArea);
const holoDensity = () => 1 / (4 * planckArea * LN2);
const rs = M => 2 * G * M / (C * C);
const areaOf = M => 4 * Math.PI * rs(M) ** 2;
const bekenstein = (E, R) => 2 * Math.PI * KB * E * R / (HBAR * C);
const margolus = E => 2 * E / (Math.PI * HBAR);
const bremermann = () => C * C / H;

console.log('\n=== 1. Landauer, and the price of forgetting ===\n');

ok('erasing one bit at room temperature costs at least 2.87e-21 joules -- 17.9 millielectronvolts. Landauer, 1961: erasure is the only logically irreversible operation and therefore the only one that MUST cost anything, and the ln2 is there because a bit is a factor of two in the number of states. The number is small enough to look free and large enough that a modern processor spends a measurable fraction of its power obeying it',
  Math.abs(landauer(300) / 2.871e-21 - 1) < 1e-3
  && Math.abs(landauer(300) / EV * 1000 - 17.92) < 0.02,
  `kT ln2 = ${landauer(300).toExponential(4)} J = ${(landauer(300) / EV * 1000).toFixed(3)} meV at 300 K`);

ok('and it is strictly proportional to the temperature, which is the content of the bound rather than a detail of it: cool the machine and forgetting gets cheaper, without limit, and the only thing that never gets cheaper is the erasure itself. Checked over twelve decades of temperature as an exact identity',
  (() => { let w = 0;
    for (const T of [1e-6, 1e-3, 1, 300, 1e3, 1e6, 1e9])
      w = Math.max(w, Math.abs(landauer(T) / (KB * T * LN2) - 1));
    return w < 1e-15; })(),
  `at 10 mK one bit costs ${landauer(0.01).toExponential(3)} J, which is ${(landauer(300) / landauer(0.01)).toExponential(2)}x cheaper than at 300 K`);

console.log('\n=== 2. The Planck area, and bits per square metre ===\n');

ok('the Planck area is 2.612e-70 square metres and a horizon holds one nat per four of them, which is 1.3807e69 BITS per square metre. That number does not depend on what fell in -- not on its composition, not on its entropy before it fell, not on anything except the area of the surface it ended up behind. It is the only bound in physics that limits information by GEOMETRY',
  Math.abs(planckArea / 2.6123e-70 - 1) < 1e-3
  && Math.abs(holoDensity() / 1.3807e69 - 1) < 1e-3,
  `l_P^2 = ${planckArea.toExponential(5)} m^2 · ${holoDensity().toExponential(5)} bits per square metre`);

console.log('\n=== 3. A solar-mass black hole ===\n');

const A = areaOf(MSUN), S = horizonS(A), B = bitsFromJK(S);
ok('a solar mass has a Schwarzschild radius of 2.95 kilometres, a horizon area of 1.1e8 square metres and holds 1.5e77 bits. Every one of those three numbers comes out of the same two constants and the mass, and the last of them is the one worth staring at: a single stellar-mass object holds more information than there are atoms in a hundred thousand galaxies',
  Math.abs(rs(MSUN) / 2954 - 1) < 0.01
  && Math.abs(A / 1.097e8 - 1) < 0.01
  && Math.abs(B / 1.51e77 - 1) < 0.02,
  `r_s = ${(rs(MSUN) / 1000).toFixed(3)} km · A = ${A.toExponential(4)} m^2 · S = ${S.toExponential(4)} J/K = ${B.toExponential(4)} bits`);

ok('and the entropy scales as the SQUARE of the mass, not linearly -- because the area does. Double the mass and the information quadruples, which is why merging two holes always increases the total and is the cleanest statement of the area theorem there is. Checked over eight decades of mass as an exact power law',
  (() => { let w = 0;
    for (const m of [1e-8, 1, 1e3, 1e6, 1e8]) {
      const r = horizonS(areaOf(m * MSUN)) / horizonS(areaOf(MSUN));
      w = Math.max(w, Math.abs(r / (m * m) - 1)); }
    return w < 1e-12; })(),
  `S(2M)/S(M) = ${(horizonS(areaOf(2 * MSUN)) / horizonS(areaOf(MSUN))).toFixed(9)}, which must be 4`);

console.log('\n=== 4. The speed limits ===\n');

ok('one joule can change state at most 6.04e33 times a second -- Margolus and Levitin, 1998 -- and one kilogram can process at most 1.356e50 bits a second whatever it is made of, which is Bremermann. Computation has a speed limit and it is set by energy alone: not by the material, not by the architecture, not by the temperature',
  Math.abs(margolus(1) / 6.037e33 - 1) < 1e-3
  && Math.abs(bremermann() / 1.356e50 - 1) < 1e-3,
  `2E/(pi hbar) = ${margolus(1).toExponential(4)} per second per joule · c^2/h = ${bremermann().toExponential(4)} bits per second per kilogram`);

ok('and the Bremermann figure is quoted in its CONVENTIONAL form c^2/h and not divided by ln2, because the convention counts distinguishable states rather than binary digits. That is a factor of 1.44 and it is stated rather than silently improved: a laboratory that fixed somebody else`s convention without saying so would make its number disagree with every textbook a reader might check it against',
  Math.abs(bremermann() * LN2 / 9.4e49 - 1) < 0.02,
  `c^2/h = ${bremermann().toExponential(4)} · the same divided by ln2 would be ${(bremermann() * LN2).toExponential(4)}, and the literature quotes the first`);

console.log('\n=== 5. And the gap that started the subject ===\n');

const SSUN = 1e34;                      /* the Sun's thermodynamic entropy, order of magnitude */
ok('a solar-mass horizon holds about 1.4e20 times the thermodynamic entropy of the Sun that might have made it. Twenty orders of magnitude, from the same mass, in a volume a hundred billion times smaller. That gap is what Bekenstein noticed in 1972, and it is the reason information became a subject in gravitational physics rather than an analogy about it -- because if the hole did NOT have that entropy, dropping the Sun into one would destroy it and the second law with it',
  S / SSUN > 1e19 && S / SSUN < 1e21,
  `the horizon holds ${S.toExponential(3)} J/K against the Sun's ~1e34 J/K -- a factor of ${(S / SSUN).toExponential(2)}`);

const bek = bekenstein(MSUN * C * C, rs(MSUN));
ok('and a black hole SATURATES the Bekenstein bound EXACTLY, which is what makes it the densest possible way to store anything. Evaluate 2 pi k E R / hbar c at E = Mc^2 and R = the Schwarzschild radius, and it returns the horizon entropy to every digit a double carries -- not approximately, not up to a factor, exactly. I wrote "four times" into this check from memory and the arithmetic said one, which is the stronger statement and the reason the word saturated is the right one. Two expressions with no constant in common except k, hbar and c, landing on the same number',
  Math.abs(bek / S - 1) < 1e-12,
  `Bekenstein at E = Mc^2 and R = r_s gives ${bitsFromJK(bek).toExponential(6)} bits · the horizon holds ${B.toExponential(6)} · the ratio is ${(bek / S).toFixed(12)}`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
