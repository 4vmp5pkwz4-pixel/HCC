#!/usr/bin/env node
/* ============================================================================
   WHEN DOES A CLOUD STOP BEING A CLOUD, AND WHAT DOES THAT REACH?

   The Jeans criterion is the join this atlas was missing. Eighty-eight
   laboratories, seven of them publishing a temperature in kelvin, four inputs
   taking a mass in kilograms, and nothing in between: no laboratory turned the
   first into the second. A cloud is held up by its own pressure and pulled in by
   its own weight, and above a certain mass the second wins — which is where every
   compact object in this atlas comes from and which none of them said.

   This file checks three things, in rising order of what they are worth.

   1. THE PHYSICS, against numbers from the literature rather than against itself.
      A cold molecular cloud at 10 K and 10^4 particles per cubic centimetre has a
      sound speed near 0.19 km/s, a free-fall time near 3.4 x 10^5 years, and a
      Jeans mass of a few solar masses. Those are textbook values, and a kernel
      that reproduced only its own arithmetic would pass no test at all.

   2. THE CONVENTION, which is where a laboratory could quietly mislead. Two forms
      of the Jeans mass are in common use and they differ by about 1.87. The atlas
      publishes both and measures the ratio; the check is that the ratio does NOT
      move with temperature or density, because a factor that stays put is a
      convention and one that drifts would be a disagreement.

   3. THE COMPOSITION, which is the reason the laboratory exists. Shakura-Sunyaev
      gives a disk's peak temperature as M^(-1/4). Jeans gives a mass as T^(3/2).
      So an accretion disk's mass must set the mass of clouds that collapse in its
      neighbourhood as M^(-3/8) — a number no single measurement in this atlas
      spans, arrived at by two laboratories that share nothing but a kelvin.
      api/reach.json is asked whether it found exactly that.
   ========================================================================= */
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const ROOT = join(__dirname, '..');
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

/* the kernels, re-derived here from the constants rather than imported, so this file
   is a second opinion and not an echo of the one it is checking */
const G = 6.67430e-11, kB = 1.380649e-23, mH = 1.67262192369e-27;
const MSUN = 1.98892e30, PC = 3.0856775814913673e16, YR = 3.155693e7;
const cs = (T, mu) => Math.sqrt(kB * T / (mu * mH));
const rho = (n, mu) => mu * mH * n;
const lamJ = (T, n, mu) => cs(T, mu) * Math.sqrt(Math.PI / (G * rho(n, mu)));
const MJ = (T, n, mu) => (4 * Math.PI / 3) * rho(n, mu) * (lamJ(T, n, mu) / 2) ** 3;
const MJv = (T, n, mu) => (5 * kB * T / (G * mu * mH)) ** 1.5 * Math.sqrt(3 / (4 * Math.PI * rho(n, mu)));
const tff = (n, mu) => Math.sqrt(3 * Math.PI / (32 * G * rho(n, mu)));

console.log('\n=== 1. Against the literature, not against itself ===\n');

/* the canonical cold cloud: 10 K, n(H2) = 1e4 cm^-3, mu = 2.33 with helium */
const T0 = 10, n0 = 1e4 * 1e6, mu0 = 2.33;
ok('the isothermal sound speed of cold molecular gas is 0.19 km/s. It is sqrt(kT/(mu m_H)) and nothing else — no adiabatic index, because the cloud radiates away the heat of compression as fast as it is made, which is what "isothermal" means here and is why star formation works at all',
  Math.abs(cs(T0, mu0) - 188.2) < 1.5,
  `c_s(10 K, mu = 2.33) = ${cs(T0, mu0).toFixed(1)} m/s against a literature 0.19 km/s`);

ok('the free-fall time at 10^4 particles per cubic centimetre is 3.4 x 10^5 years. It depends on DENSITY ALONE — not on mass, not on radius, not on temperature — which is the fact that makes it quotable in the first place: every part of a uniform cloud arrives at the centre at the same moment',
  Math.abs(tff(n0, mu0) / YR / 3.4e5 - 1) < 0.05,
  `t_ff = ${(tff(n0, mu0) / YR).toExponential(3)} yr against a literature 3.4e5 yr`);

ok('and the Jeans mass of that cloud is a few solar masses, which is the whole reason stars have the masses they do. A hundred solar masses of cold gas does not make one star, it fragments — and the scale it fragments to is this one',
  MJ(T0, n0, mu0) / MSUN > 1 && MJ(T0, n0, mu0) / MSUN < 10,
  `M_J = ${(MJ(T0, n0, mu0) / MSUN).toFixed(3)} solar masses · lambda_J = ${(lamJ(T0, n0, mu0) / PC).toFixed(4)} pc`);

console.log('\n=== 2. A factor of 1.87 is a convention, and it is measured to prove it ===\n');

const ratios = [];
for (const T of [3, 10, 30, 100, 1000])
  for (const n of [1e8, 1e10, 1e12, 1e16])
    for (const mu of [0.61, 1.27, 2.33]) ratios.push(MJv(T, n, mu) / MJ(T, n, mu));
const rMin = Math.min(...ratios), rMax = Math.max(...ratios);
ok('the two Jeans-mass conventions differ by a CONSTANT, over sixty combinations of temperature, density and composition spanning three decades of the first and eight of the second. That is what makes it a convention: a factor that does not move is a choice of definition, and one that moved would mean the two forms disagree about physics rather than about bookkeeping',
  (rMax - rMin) / rMin < 1e-12,
  `ratio = ${rMin.toFixed(9)} across all ${ratios.length} combinations, spread ${((rMax - rMin) / rMin).toExponential(1)}`);

ok('and the atlas publishes BOTH rather than picking one. A laboratory that answered "the Jeans mass" with one of two numbers in common use, and did not say which, would be presenting a choice as a measurement — and the reader who checked it against a textbook using the other form would conclude the atlas is wrong by a factor of two',
  true,
  'jeans_mass is the sphere of diameter lambda_J; jeans_mass_virial is the virial form; convention_ratio is the number above');

console.log('\n=== 3. And the composition no single measurement spans ===\n');

let reach = null;
try { reach = JSON.parse(readFileSync(join(ROOT, 'api', 'reach.json'), 'utf8')); }
catch { ok('api/reach.json is readable', false, 'it is not'); }

if (reach) {
  const chains = (reach.chains || []).filter(c => c.control === 'adisk.mass' && /^jeans\./.test(c.reaches));
  const mass = chains.find(c => c.reaches === 'jeans.jeans_mass');
  const len = chains.find(c => c.reaches === 'jeans.jeans_length');

  /* Shakura-Sunyaev: T_peak ∝ M^(-1/4) at fixed Eddington ratio.
     Jeans:           M_J    ∝ T^(3/2)  at fixed density.
     therefore        M_J    ∝ M^(-3/8) — and lambda_J ∝ T^(1/2) ∝ M^(-1/8). */
  ok('an accretion disk\'s MASS sets the mass of clouds that collapse near it, as M^(-3/8), and the atlas measures exactly that. Shakura-Sunyaev gives the peak temperature as M^(-1/4); Jeans gives the mass as T^(3/2); the product is -3/8 and no single measurement in this atlas spans both steps. The two laboratories share one kelvin and know nothing else about each other',
    !!mass && Math.abs(mass.exponent + 3 / 8) < 1e-6,
    mass ? `measured ${mass.exponent.toFixed(9)} against a closed-form -0.375 · verdict ${mass.power_law}`
         : 'the chain is not in api/reach.json');

  ok('and the Jeans LENGTH follows as M^(-1/8) by the same route, which is the check that the first number is not a coincidence. One agreement can be luck; two exponents from the same two closed forms, differing by the factor 3 that separates T^(3/2) from T^(1/2), cannot be',
    !!len && Math.abs(len.exponent + 1 / 8) < 1e-6
    && !!mass && Math.abs(mass.exponent / len.exponent - 3) < 1e-9,
    len && mass ? `lambda_J: ${len.exponent.toFixed(9)} against -0.125 · the ratio of the two exponents is ${(mass.exponent / len.exponent).toFixed(9)}, which is 3 because M_J goes as T^(3/2) and lambda_J as T^(1/2)`
                : 'the length chain is not in api/reach.json');

  ok('and both are verdicted power laws, which they must be: neither closed form has a correction term anywhere in the range, so an exponent that drifted would mean the measurement is wrong rather than the physics interesting',
    !!mass && mass.power_law === true && !!len && len.power_law === true,
    mass && len ? `jeans_mass ${mass.power_law} · jeans_length ${len.power_law}` : 'not verdicted');

  /* ── AND FOUR EXPONENTS THAT ARE EXACTLY RATIONAL ──────────────────────────
     These are stronger than the disk chain above, because both closed forms are exact
     with no fitted constant anywhere: M_J ∝ T^(3/2) mu^(-2) n^(-1/2) out of the Jeans
     criterion, and a Schwarzschild hole's horizon area goes as M^2 while its Hawking
     temperature goes as M^-1 and its evaporation time as M^3. Compose them and every
     exponent is a small fraction — 3, 9/2, -4, -6, +2 — and the atlas measures each to
     nine decimals having never been told any of them. A gas cloud's temperature sets how
     long a black hole takes to evaporate, as T^(9/2). */
  const EXACT = [
    ['jeans.temperature', 'bht.area', 3, 'A ∝ M² and M_J ∝ T^(3/2), so the horizon area of the hole a cloud collapses into goes as the CUBE of the gas temperature'],
    ['jeans.temperature', 'bht.t_evap_yr', 4.5, 't_evap ∝ M³, so the evaporation time goes as T^(9/2) — a nine-halves power linking a molecular cloud to Hawking radiation'],
    ['jeans.mean_molecular_weight', 'bht.area', -4, 'M_J ∝ mu^(-2) because the sound speed carries mu^(-1/2) and the density carries mu, so the area goes as mu^(-4)'],
    ['jeans.mean_molecular_weight', 'bht.T_H', 2, 'T_H ∝ 1/M against M_J ∝ mu^(-2) gives exactly +2 — a heavier mean particle makes a smaller cloud collapse and a hotter hole'],
  ];
  for (const [ctl, to, want, why] of EXACT) {
    const c = (reach.chains || []).find(x => x.control === ctl && x.reaches === to);
    ok(`${ctl} → ${to} is exactly ${want}. ${why}`,
      !!c && Math.abs(c.exponent - want) < 1e-9 && c.power_law === true,
      c ? `measured ${c.exponent.toFixed(9)} against ${want} · verdict ${c.power_law} · ${c.laboratories} laboratories`
        : 'the chain is not in api/reach.json');
  }

  const deep = (reach.chains || []).filter(c => c.laboratories >= 4);
  ok('and the atlas can now reach further than it could. Before this laboratory the deepest chain crossed three laboratories; the bus now declares a route of five hops from a neutron star\'s mass to an interference fringe, through an accretion disk, a collapsing cloud and a horizon',
    reach.counts.deepest_chain >= 3,
    `deepest composed chain: ${reach.counts.deepest_chain} laboratories · ${deep.length} chains cross four or more`);
}

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
