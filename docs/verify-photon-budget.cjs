#!/usr/bin/env node
/* ============================================================================
   HOW LONG MUST YOU LOOK?

   The observational chain in this atlas dead-ended at a flux.  Two laboratories
   published a power per square metre, three published a magnitude, and NOTHING
   consumed either — mass to luminosity to distance to flux to a diffraction
   floor, and then it stopped, one step short of the question every real
   observation turns on.  Not "is it bright enough" but "is it bright enough IN
   THE TIME I HAVE".

   And there was no PHOTON anywhere in the atlas.  Not one instrument counted
   quanta, which matters because light does not arrive as a smooth power: it
   arrives as integers, at random times, and the randomness IS the noise.

   This file checks four things.

   1. WHAT ONE PHOTON CARRIES, against a number every spectroscopist knows:
      2.254 eV at 550 nm.
   2. THE SQUARE-ROOT LAW, which is not a measurement but a consequence — the
      variance of a Poisson count equals its mean, so signal-to-noise goes as
      sqrt(t) and doubling it costs EXACTLY four times the exposure.
   3. THE NUMBER THAT MAKES IT REAL: at magnitude 31 a 2.4 m mirror collects one
      photon every eight seconds.  Not per pixel per second.  One photon, from
      the whole telescope, while you count to eight.
   4. AND THAT THE POISSON SAMPLER IS POISSON, because a laboratory that draws
      the wrong distribution draws a convincing lie: mean and variance must agree
      to sampling error, and they are checked against each other rather than
      against a constant.
   ========================================================================= */
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const h = 6.62607015e-34, c0 = 299792458, eV = 1.602176634e-19;
const L0 = 3.0128e28, PC = 3.0856775814913673e16;
const F0 = L0 / (4 * Math.PI * (10 * PC) ** 2);
const E = lam => h * c0 / lam;
const area = D => Math.PI * D * D / 4;
const rate = (f, D, lam) => f * area(D) / E(lam);
const fluxOfMag = m => F0 * Math.pow(10, -0.4 * m);
const snr = (N, B, t) => { const S = N * t, V = (N + B) * t; return V > 0 ? S / Math.sqrt(V) : 0; };
const timeFor = (s, N, B) => N > 0 ? s * s * (N + B) / (N * N) : Infinity;

console.log('\n=== 1. What one photon carries ===\n');

ok('a photon at 550 nm carries 2.254 electronvolts. It is hc/lambda and nothing else, and it is the conversion the whole of photon-counting astronomy rests on: a watt is not a number of photons until you say what colour it is',
  Math.abs(E(550e-9) / eV - 2.2543) < 1e-3,
  `E = ${E(550e-9).toExponential(4)} J = ${(E(550e-9) / eV).toFixed(4)} eV`);

ok('and the Sun delivers 3.77e21 of them per second per square metre at one astronomical unit. That is the solar constant divided by the energy of one green photon — two numbers this atlas computes in two different laboratories, meeting here for the first time',
  Math.abs(1361 / E(550e-9) / 3.768e21 - 1) < 0.01,
  `1361 W/m2 / ${E(550e-9).toExponential(3)} J = ${(1361 / E(550e-9)).toExponential(3)} photons/s/m2`);

console.log('\n=== 2. The square root, which governs every night of observing ===\n');

const N1 = 100;
ok('signal-to-noise grows as the square root of time, so doubling it costs EXACTLY four times the exposure. This is not an empirical rule of thumb — it follows from the variance of a Poisson count equalling its mean, and it is why deep fields take days rather than long evenings and why the answer to a faint source is usually a bigger mirror rather than a later bedtime',
  Math.abs(snr(N1, 0, 4) / snr(N1, 0, 1) - 2) < 1e-12
  && Math.abs(snr(N1, 0, 100) / snr(N1, 0, 1) - 10) < 1e-12,
  `four times the time gives ${(snr(N1, 0, 4) / snr(N1, 0, 1)).toFixed(9)}x the signal-to-noise · a hundred times gives ${(snr(N1, 0, 100) / snr(N1, 0, 1)).toFixed(9)}x`);

ok('and the exposure that reaches a given signal-to-noise is SOLVED rather than searched: t = SNR^2 (N+B) / N^2 inverts the relation exactly, so the answer is right at a photon per century as well as at a million per second. A bisection would have been easier to write and would have had a range where it silently stopped converging',
  Math.abs(snr(N1, 0, timeFor(5, N1, 0)) - 5) < 1e-12
  && Math.abs(snr(1e-3, 7, timeFor(5, 1e-3, 7)) - 5) < 1e-9,
  `at 100 photons/s: 5 sigma at t = ${timeFor(5, N1, 0).toFixed(6)} s, which the forward formula returns as ${snr(N1, 0, timeFor(5, N1, 0)).toFixed(9)} sigma · and at a thousandth of a photon per second against a background of seven, ${snr(1e-3, 7, timeFor(5, 1e-3, 7)).toFixed(9)}`);

console.log('\n=== 3. One photon every eight seconds ===\n');

const m31 = rate(fluxOfMag(31), 2.4, 550e-9);
ok('at magnitude 31, about the faintest Hubble has recorded, the whole 2.4-metre mirror collects ONE PHOTON EVERY EIGHT SECONDS. Not one per pixel per second — one photon, from the entire telescope, while you count to eight. Everything about deep astronomy follows from that sentence, and it is the kind of fact an atlas should be able to hand a reader rather than describe',
  Math.abs(1 / m31 - 7.94) < 0.6,
  `${m31.toExponential(3)} photons per second, which is one every ${(1 / m31).toFixed(2)} seconds`);

ok('and the naked eye at magnitude 6 collects ten million times more, which is the whole distance between looking up and doing astronomy. The ratio is 10^(0.4 x 25) exactly, because magnitudes are logarithmic by construction — so the check is against an identity rather than against a number somebody measured',
  Math.abs(fluxOfMag(6) / fluxOfMag(31) / Math.pow(10, 0.4 * 25) - 1) < 1e-12,
  `flux ratio ${(fluxOfMag(6) / fluxOfMag(31)).toExponential(3)} against 10^10 = ${Math.pow(10, 0.4 * 25).toExponential(3)}`);

console.log('\n=== 4. And the sampler really is Poisson ===\n');

/* Knuth for small means, normal above thirty — the same construction the atlas uses,
   re-implemented here so this is a second opinion */
function poisson(lambda, rnd) {
  if (lambda <= 0) return 0;
  if (lambda < 30) { const L = Math.exp(-lambda); let k = 0, p = 1;
    do { k++; p *= rnd(); } while (p > L); return k - 1; }
  const u = Math.max(1e-12, rnd()), v = rnd();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * z));
}
/* ── AND THE GENERATOR MATTERS MORE THAN THE SAMPLER ────────────────────────
   Written first against the linear congruential generator this atlas uses elsewhere,
   these three checks failed: the drawn mean came out low by 4.6 sigma at a mean of 3,
   12.8 at 12 and 21.4 at 25.  Knuth's method multiplies as many of the generator's
   outputs as the mean is large, so its correlations compound with lambda.  That is a
   sampler producing a picture that looks like noise and lies about how much there is,
   which is the worst failure available to a laboratory whose subject IS noise.
   Mulberry32 lands inside two sigma at every mean tested. */
let seed = 20260828;
const rnd = () => { seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
for (const lam of [0.3, 3, 12, 25]) {
  const n = 40000; let s = 0, s2 = 0;
  for (let i = 0; i < n; i++) { const k = poisson(lam, rnd); s += k; s2 += k * k; }
  const mean = s / n, varr = s2 / n - mean * mean;
  ok(`at a mean of ${lam} the drawn variance equals the drawn mean, which is the defining property of a Poisson process and the reason the noise is the square root of the signal. A sampler that got this wrong would produce a picture that looked like noise and lied about how much`,
    Math.abs(mean - lam) < 3 * Math.sqrt(lam / n) && Math.abs(varr / mean - 1) < 0.05,
    `mean ${mean.toFixed(4)} against ${lam}, which is ${((mean - lam) / Math.sqrt(lam / n)).toFixed(1)} sigma of the sampling error · variance/mean = ${(varr / mean).toFixed(4)}, which must be one`);
}

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
