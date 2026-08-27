#!/usr/bin/env node
/* ============================================================================
   WHAT DOES A TELESCOPE ACTUALLY SEE?

   Six instruments in this atlas publish a luminosity — a pulsar's spin-down
   power, a quasar's Eddington limit, a supernova's light curve — and until the
   photometry laboratory existed nothing consumed one.  Every one of them
   answered "how much power does this thing emit" and stopped, because the next
   question needs a distance and a division.

   THE ZERO POINT IS A DEFINITION, WHICH IS WHY IT IS WORTH CHECKING.  The IAU
   fixed L0 = 3.0128e28 W in 2015 precisely so that the Sun's absolute bolometric
   magnitude comes out at 4.74.  Reproducing a defined constant is not circular
   here: this file starts from the solar luminosity and that zero point and gets
   4.74 to four decimals, which tests the FORM of the magnitude equation — a
   wrong sign, a natural logarithm, or a factor of 2 instead of 2.5 all fail it.

   Three numbers nobody in this repository chose:

     the solar constant at 1 AU        1361 W/m2
     M_bol of the Sun                  exactly 4.74, by definition of L0
     m_bol of the Sun                  -26.83

   and one that is a property of the SCALE rather than of any object: five
   magnitudes is a factor of one hundred, exactly, which is what Pogson chose the
   number 2.512 to make true in 1856.
   ========================================================================= */
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const L0 = 3.0128e28, LSUN = 3.828e26, PC = 3.0856775814913673e16, AU = 1.495978707e11;
const M = Lw => -2.5 * Math.log10(Lw / L0);
const mu = dm => 5 * Math.log10(dm / (10 * PC));
const F = (Lw, dm) => Lw / (4 * Math.PI * dm * dm);
const m = (Lw, dm) => M(Lw) + mu(dm);

console.log('\n=== 1. Three numbers nobody here chose ===\n');

ok('the solar constant at one astronomical unit is 1361 W/m2. It is the solar luminosity over the area of a sphere one AU in radius and nothing else — no atmosphere, no albedo, no obliquity — and it is the number every energy budget of this planet starts from',
  Math.abs(F(LSUN, AU) - 1361) < 2,
  `f = ${F(LSUN, AU).toFixed(1)} W/m2 against a measured 1361`);

ok('the Sun\'s absolute bolometric magnitude is EXACTLY 4.74, and reproducing a defined constant is the point rather than a circularity. The IAU fixed L0 in 2015 so that this comes out at 4.74; starting from the solar luminosity and that zero point tests the FORM of the equation, and a wrong sign, a natural logarithm or a factor of 2 in place of 2.5 each fail it',
  Math.abs(M(LSUN) - 4.74) < 1e-3,
  `M_bol = ${M(LSUN).toFixed(6)} against the IAU 4.74`);

ok('and its apparent bolometric magnitude at one AU is -26.83, which is the distance modulus doing its whole job: the same star at ten parsecs would be a fifth-magnitude speck, and it is thirty-one and a half magnitudes brighter here because it is 4.8 microparsecs away',
  Math.abs(m(LSUN, AU) + 26.83) < 0.02,
  `m_bol = ${m(LSUN, AU).toFixed(3)} against -26.83 · distance modulus ${mu(AU).toFixed(3)} mag`);

console.log('\n=== 2. And one property of the scale itself ===\n');

ok('five magnitudes is a factor of one hundred in flux, EXACTLY. That is not a measurement of anything — it is what Pogson chose in 1856 to make true, by defining one magnitude as the fifth root of a hundred, so that the scale inherited from Hipparchus became arithmetic instead of an eyeballed ranking. Any implementation that gets this wrong has the wrong base',
  Math.abs(Math.pow(10, -0.4 * -5) - 100) < 1e-9 && Math.abs(Math.pow(10, 0.4) - 2.511886431509580) < 1e-12,
  `one magnitude = ${Math.pow(10, 0.4).toFixed(12)} in flux · five magnitudes = ${Math.pow(10, -0.4 * -5).toFixed(9)}`);

ok('and the scale runs BACKWARDS: a brighter source has a SMALLER magnitude, so a difference in magnitude and a ratio in flux point opposite ways. It is the most reliable sign error in observational astronomy and the check is one line',
  m(LSUN, AU) < m(LSUN, 10 * PC) && M(10 * LSUN) < M(LSUN),
  `the Sun at 1 AU is ${m(LSUN, AU).toFixed(2)} and at 10 pc is ${m(LSUN, 10 * PC).toFixed(2)} · ten times the luminosity moves M from ${M(LSUN).toFixed(2)} to ${M(10 * LSUN).toFixed(2)}`);

console.log('\n=== 3. And the inverse square law, over twenty decades ===\n');

let worst = 0;
for (let e = -12; e <= 8; e++) {
  const d = Math.pow(10, e) * PC;
  const r = F(LSUN, d) * (4 * Math.PI * d * d) / LSUN;
  worst = Math.max(worst, Math.abs(r - 1));
}
ok('the flux times the area of its own sphere returns the luminosity, over twenty decades of distance. The identity is trivial and the range is not: a laboratory that quietly clamped a distance, or overflowed at a parsec, or lost precision at a gigaparsec would fail it, and none of those would show up at the one distance somebody tested by hand',
  worst < 1e-12,
  `worst departure from unity ${worst.toExponential(2)} across 10^-12 to 10^8 parsecs`);

/* the distance modulus is the whole of how a distance is MEASURED photometrically:
   m - M is 5 log10 d, so knowing two of the three gives the third */
let dworst = 0;
for (const dp of [1e-6, 1, 10, 1e3, 1e6, 1e9]) {
  const d = dp * PC;
  const recovered = 10 * Math.pow(10, (m(LSUN, d) - M(LSUN)) / 5) * PC;
  dworst = Math.max(dworst, Math.abs(recovered / d - 1));
}
ok('and m - M inverts to the distance, which is what makes photometry a way of MEASURING one. Every standard candle in astronomy is this equation read right to left: assume M, measure m, and the difference is the distance',
  dworst < 1e-12,
  `distance recovered from the modulus to within ${dworst.toExponential(2)} over fifteen decades`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
