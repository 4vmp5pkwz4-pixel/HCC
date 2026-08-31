#!/usr/bin/env node
/* ============================================================================
   HOW LONG DOES IT LAST?

   Two more dead ends on the quantity bus, and both of them are about TIME.
   Three instruments in this atlas publish an age or a lifetime in years — a
   black hole's evaporation time, a pulsar's characteristic age, a quasar's
   Salpeter time — and in ninety-four laboratories nothing consumed one.  Two
   publish a mass transfer rate in solar masses per year and nothing consumed
   one of those either.  The atlas could say how bright a thing is, how far
   away, how many photons arrive and what holds it up, and had no way at all
   to ask how long any of it lasts.

   Three clocks run in every self-gravitating body:

     t_dyn = sqrt(R^3 / G M)        how fast it falls if the pressure stops
     t_KH  = G M^2 / (R L)          how long its stored heat could power it
     t_nuc = f eps X M c^2 / L      how long its fuel lasts

   This file checks five things.

   1. THE THREE SOLAR CLOCKS against the literature: 27 minutes, 31 million
      years, about ten billion.  Plus the mean density (1408 kg/m3) and the
      binding energy (2.3e41 J), which are the same two numbers written
      differently and catch a wrong power of the radius.
   2. THE EFFICIENCY IS DERIVED, not quoted: (4 m_H - m_He)/(4 m_H) = 0.00712,
      which is not the 0.007 everyone writes.
   3. THE ORDERING, on seven bodies with nothing special-cased, because the
      separation of the clocks is what makes a stable star possible.
   4. THE MASS-LIFETIME EXPONENT IS NOT IN THE LABORATORY.  It takes a
      luminosity as an input, so t ~ M^-2.5 appears only when a luminosity is
      driven as M^3.5 beside the mass — 1 - 3.5, exactly.
   5. AND KELVIN'S MISTAKE, as a ratio.  He computed the middle clock and
      argued from it against the geologists; the gap to the third one is the
      discovery of nuclear energy, and it is a number.
   ========================================================================= */
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const G = 6.67430e-11, C = 299792458, YR = 3.155693e7;
const MSUN = 1.98892e30, RSUN = 6.957e8, LSUN = 3.828e26;
const M_H = 1.00782503207, M_HE = 4.00260325413;
const eps = (4 * M_H - M_HE) / (4 * M_H);
const tDyn = (M, R) => Math.sqrt((R * RSUN) ** 3 / (G * M * MSUN));
const tKH = (M, R, L) => G * (M * MSUN) ** 2 / (R * RSUN * L);
const tNuc = (M, L, X, f) => f * eps * X * M * MSUN * C * C / L;
const rhoBar = (M, R) => M * MSUN / ((4 / 3) * Math.PI * (R * RSUN) ** 3);
const tFF = rho => Math.sqrt(3 * Math.PI / (32 * G * rho));
const bind = (M, R) => 0.6 * G * (M * MSUN) ** 2 / (R * RSUN);

console.log('\n=== 1. The three solar clocks, against the literature ===\n');

ok('the Sun falls in about twenty-seven minutes if its pressure stops. That is the dynamical time, it is the shortest thing a star does, and it is why a star is in hydrostatic balance: any imbalance is corrected in half an hour',
  Math.abs(tDyn(1, 1) / 60 - 26.5) < 1.5,
  `t_dyn = ${tDyn(1, 1).toFixed(0)} s = ${(tDyn(1, 1) / 60).toFixed(1)} min`);

ok('and its stored gravitational heat would power it for thirty-one million years. This is the number Kelvin and Helmholtz computed in the 1860s and it is reproduced here to three figures — not as history, but because the same expression is the thermal timescale of every star, and a laboratory that got the power of the radius wrong would miss it',
  Math.abs(tKH(1, 1, LSUN) / YR / 3.14e7 - 1) < 0.02,
  `t_KH = ${(tKH(1, 1, LSUN) / YR).toExponential(4)} yr against the quoted 3.1e7`);

ok('and its fuel lasts about ten billion years, which is the number that dates the Earth, the Sun and everything on it. The burning fraction is a CONVENTION rather than a measurement — a tenth is the textbook choice and gives 7.4 Gyr, and the familiar ten billion corresponds to 0.136 — so the laboratory takes it as an input and this check spans both',
  tNuc(1, LSUN, 0.71, 0.1) / YR > 5e9 && tNuc(1, LSUN, 0.71, 0.136) / YR < 1.2e10,
  `f = 0.1 gives ${(tNuc(1, LSUN, 0.71, 0.1) / YR).toExponential(3)} yr · f = 0.136 gives ${(tNuc(1, LSUN, 0.71, 0.136) / YR).toExponential(3)} yr`);

ok('and the same two numbers written differently: the Sun`s mean density is 1408 kg/m3 and its gravitational binding energy 2.3e41 joules. These catch what the clocks alone would not — a wrong power of the radius survives a ratio and does not survive these',
  Math.abs(rhoBar(1, 1) - 1408) < 8 && Math.abs(bind(1, 1) / 2.28e41 - 1) < 0.02,
  `rho_bar = ${rhoBar(1, 1).toFixed(1)} kg/m3 against 1408 · E_bind = ${bind(1, 1).toExponential(3)} J against 2.3e41`);

console.log('\n=== 2. The efficiency is derived, and it is not 0.007 ===\n');

ok('the hydrogen-burning efficiency is computed from the proton and helium masses rather than quoted. Four protons weigh 4.03130 u and a helium-4 nucleus 4.00260, so the released fraction is 0.0071185 — everybody writes 0.007, and the difference is one and a half per cent of every stellar lifetime in this atlas. A constant you type is a constant nobody can catch you being wrong about',
  Math.abs(eps - 0.00711852) < 1e-7 && Math.abs(eps / 0.007 - 1) > 0.01,
  `eps = ${eps.toFixed(9)} from (4 x ${M_H} - ${M_HE}) / (4 x ${M_H}) · the quoted 0.007 is ${((eps / 0.007 - 1) * 100).toFixed(2)}% low`);

console.log('\n=== 3. The ordering, on seven bodies, nothing special-cased ===\n');

const BODIES = [
  ['a red dwarf', 0.1, 0.12, 3.2e-4], ['the Sun', 1, 1, 1], ['Sirius A', 2.06, 1.71, 25.4],
  ['a B star', 10, 4, 5.5e3], ['an O star', 30, 6.8, 1.5e5],
  ['a red giant', 1, 100, 2.3e3], ['a white dwarf', 0.6, 0.013, 1e-3]];
const rows = BODIES.map(([n, M, R, Lr]) => {
  const L = Lr * LSUN;
  return { n, d: tDyn(M, R), k: tKH(M, R, L), u: tNuc(M, L, 0.71, 0.1) };
});
const allOrdered = rows.every(r => r.d < r.k && r.k < r.u);
const tightest = Math.min(...rows.map(r => r.k / r.d));
ok('in every one of seven bodies the dynamical clock is faster than the thermal clock and the thermal clock is faster than the nuclear one — a red dwarf, the Sun, Sirius A, a B star, an O star, a red giant and a white dwarf, spanning three decades of mass and four of radius. That separation is not decoration: it is why a star can sit still at all. And the MARGIN is not uniform, which is the part worth measuring rather than asserting — the Sun re-adjusts six hundred billion times faster than it can lose its heat, and a red giant only three thousand times faster, because it is puffed out and pouring energy away. The least separated body in the list is the one that pulsates and sheds mass in reality, which is not something this file put there',
  allOrdered && tightest > 1e3 && tightest < 1e5,
  `${rows.filter(r => r.d < r.k && r.k < r.u).length} of ${rows.length} ordered · widest separation ${Math.max(...rows.map(r => r.k / r.d)).toExponential(2)} (${rows.reduce((a, b) => (a.k / a.d > b.k / b.d ? a : b)).n}) · tightest ${tightest.toExponential(2)} (${rows.reduce((a, b) => (a.k / a.d < b.k / b.d ? a : b)).n})`);

const conv = rows.map(r => tFF(rhoBar(1, 1)) / tDyn(1, 1));
const convGrid = [];
for (const M of [0.1, 1, 10, 100]) for (const R of [0.01, 1, 100]) convGrid.push(tFF(rhoBar(M, R)) / tDyn(M, R));
const cLo = Math.min(...convGrid), cHi = Math.max(...convGrid);
ok('and the two ways of writing the dynamical time differ by exactly pi/(2 sqrt 2), which is MEASURED to be a convention rather than assumed to be one. sqrt(R^3/GM) and sqrt(3 pi / 32 G rho_bar) are the same clock; the second shows that it depends on the mean density and on nothing else, because the mass and the radius cancel. The ratio does not move across twelve combinations of mass and radius spanning three decades and four — a factor that stays put is a convention, and one that drifted would mean the two forms disagree about physics rather than about bookkeeping',
  Math.abs(cLo - Math.PI / (2 * Math.SQRT2)) < 1e-12 && (cHi - cLo) / cLo < 1e-12,
  `ratio = ${cLo.toFixed(12)} against pi/(2 sqrt 2) = ${(Math.PI / (2 * Math.SQRT2)).toFixed(12)} · spread ${((cHi - cLo) / cLo).toExponential(1)} over ${convGrid.length} combinations`);

console.log('\n=== 4. The mass-lifetime exponent is NOT in the laboratory ===\n');

const life = a => tNuc(Math.pow(10, a), LSUN * Math.pow(10, 3.5 * a), 0.71, 0.1);
const slope = Math.log10(life(1.5) / life(-1)) / 2.5;
ok('the famous main-sequence lifetime t ~ M^-2.5 is not built in anywhere, and that is the point. This laboratory takes a luminosity as an INPUT and never computes one from a mass, so the exponent cannot be inside it; drive a luminosity as M^3.5 alongside the mass and what comes back is exactly 1 - 3.5 over two and a half decades. A laboratory that computed the luminosity itself would be asserting the mass-luminosity relation and then discovering it, which is the shape of every circular result there is',
  Math.abs(slope + 2.5) < 1e-9,
  `lifetime exponent = ${slope.toFixed(12)} against the -2.5 that 1 - 3.5 forces`);

const dwarf = tNuc(0.1, 3.2e-4 * LSUN, 0.71, 0.1) / YR;
ok('and the consequence is the fact this laboratory exists to make sayable: a tenth-solar-mass star burns for two hundred times the age of the universe. It is faint — three ten-thousandths of the Sun — and that is exactly why, because the fuel goes as the mass and the rate of spending it goes as the luminosity. No red dwarf has ever died, anywhere, and this is the number that says so',
  dwarf > 1e12 && dwarf / 1.38e10 > 100,
  `0.1 M_sun at 3.2e-4 L_sun burns for ${dwarf.toExponential(3)} yr = ${(dwarf / 1.38e10).toFixed(0)}x the age of the universe`);

console.log('\n=== 5. And Kelvin`s mistake, stated as a ratio ===\n');

const ratio = tNuc(1, LSUN, 0.71, 0.1) / tKH(1, 1, LSUN);
ok('Kelvin and Helmholtz computed the middle clock and argued from it against Darwin and against the geologists, who needed hundreds of millions of years for the Earth. They were right about the arithmetic and wrong about the source, and the ratio of the nuclear clock to the thermal one is the size of that error: a factor of about two hundred and forty. It is an OUTPUT of this laboratory rather than a footnote, because a ratio somebody has to look up is a ratio nobody checks',
  ratio > 150 && ratio < 400,
  `t_nuc / t_KH = ${ratio.toFixed(1)} for the Sun`);

const earth = 4.54e9;
ok('and the check that settles it the way the nineteenth century could not: the Earth is 4.54 billion years old, which is a hundred and forty times longer than a contracting Sun could have shone. Radiometric dating and stellar physics are two independent measurements and they agree that the thermal clock is the wrong one — the geologists were right, and the reason they were right is the top clock',
  earth / (tKH(1, 1, LSUN) / YR) > 100 && earth < tNuc(1, LSUN, 0.71, 0.1) / YR,
  `the Earth at ${(earth / 1e9).toFixed(2)} Gyr is ${(earth / (tKH(1, 1, LSUN) / YR)).toFixed(0)}x the thermal time and ${((earth / (tNuc(1, LSUN, 0.71, 0.1) / YR)) * 100).toFixed(0)}% of the nuclear one`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
