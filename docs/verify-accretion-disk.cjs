#!/usr/bin/env node
/* ============================================================================
   A MAXIMUM AT 49/36, AND IT IS NOT A FIT

   A geometrically thin, optically thick accretion disk with no torque at its inner edge
   radiates locally as a blackbody at

       sigma T^4 = 3 G M Mdot / (8 pi r^3) * (1 - sqrt(r_in/r)).

   Write x = r/r_in and the shape is x^-3 (1 - x^-1/2). Differentiate: the stationary point
   is where x^-1/2 = 6/7, so the temperature peaks at

       r = (7/6)^2 r_in = 49/36 r_in

   exactly — a rational number, independent of the mass, the accretion rate and the spin,
   which only decide where the inner edge is. This file does not take that on trust. It
   scans the profile on a dense grid and finds the maximum numerically, differentiates it
   numerically at the claimed point, and only then compares.

   The other claims are checked against routes that share no algebra with the kernels:

     - the Kerr ISCO against its two closed forms, 6 M at a = 0 and 1 M at a = 1;
     - the efficiency against 1 - sqrt(8/9) and 1 - 1/sqrt3;
     - the multicolour spectrum against a directly written annulus quadrature;
     - and its spectral index in the middle band against the asymptotic one third, which
       follows from T proportional to r^-3/4 and is nowhere put in by hand.

   Run: node docs/verify-accretion-disk.cjs
   ========================================================================= */

let pass = 0, fail = 0;
const ok = (t, c, d) => { c ? pass++ : fail++;
  console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); };

(async () => {
const { pathToFileURL } = require('node:url');
const { join } = require('node:path');
const X = await import(pathToFileURL(join(__dirname, '..', 'core/atlas/extracted.mjs')).href);

console.log('\nACCRETION DISK — the temperature profile, the ISCO, and the spectrum they make\n');

/* ── 1 · the peak, found rather than quoted ───────────────────────────────── */
{
  const N = 4000000, lo = 1.0000001, hi = 4;
  let best = lo, bv = -1;
  for (let i = 0; i <= N; i++) { const x = lo + (hi - lo) * i / N, v = X.diskShape(x);
    if (v > bv) { bv = v; best = x; } }
  ok('the maximum of x^-3 (1 - x^-1/2), located by scanning four million points of the profile itself, is at 49/36',
    Math.abs(best - 49 / 36) < 2e-6,
    `scan ${best.toFixed(9)} · 49/36 = ${(49 / 36).toFixed(9)} · difference ${Math.abs(best - 49 / 36).toExponential(2)} — the grid spacing is ${((hi - lo) / N).toExponential(2)}, so this is the resolution of the scan and not a disagreement`);

  const h = 1e-7, d = (X.diskShape(49 / 36 + h) - X.diskShape(49 / 36 - h)) / (2 * h);
  ok('and the derivative of the profile, evaluated numerically AT that point, vanishes',
    Math.abs(d) / X.diskShape(49 / 36) < 1e-7,
    `d(shape)/dx = ${d.toExponential(3)} against a shape value of ${X.diskShape(49 / 36).toExponential(3)} — a relative ${(Math.abs(d) / X.diskShape(49 / 36)).toExponential(2)}, which is the central-difference floor at h = 1e-7`);

  ok('the kernel constant IS the rational number and not a decimal that resembles it',
    X.DISK_PEAK_RATIO === 49 / 36 && X.DISK_PEAK_RATIO * 36 === 49,
    `DISK_PEAK_RATIO = ${X.DISK_PEAK_RATIO} · times 36 = ${X.DISK_PEAK_RATIO * 36} exactly`);

  ok('and it does not move when the inner edge does — the peak radius is proportional to r_in and to nothing else',
    [1, 1e3, 6.6e10, 1.7e13].every(r => Math.abs(X.diskPeakRadius(r) / r - 49 / 36) < 1e-15),
    `r_in over fourteen orders of magnitude, ratio constant to 1e-15`);
}

/* ── 2 · the profile is a profile ─────────────────────────────────────────── */
{
  ok('the temperature is zero at the inner edge — a zero-torque boundary means no dissipation there, and the model says so rather than approaching it',
    X.diskTemperature(1, 1e6) === 0 && X.diskTemperature(0.5, 1e6) === 0,
    `T(x = 1) = ${X.diskTemperature(1, 1e6)} and inside the edge the disk does not exist`);

  ok('the peak of the normalised profile is the peak temperature exactly',
    Math.abs(X.diskTemperature(49 / 36, 1e6) - 1e6) < 1e-9,
    `T(49/36) = ${X.diskTemperature(49 / 36, 1e6).toFixed(9)} K for Tpk = 1e6 K`);

  const x1 = 1e4, x2 = 1e5;
  const slope = Math.log(X.diskTemperature(x2, 1e6) / X.diskTemperature(x1, 1e6)) / Math.log(x2 / x1);
  ok('far outside the inner edge the profile is the pure power law T proportional to r^-3/4, which is what makes the spectral index one third',
    Math.abs(slope + 0.75) < 1e-2,
    `measured d log T/d log r between x = 1e4 and 1e5 is ${slope.toFixed(6)} against -0.75 — the residual is the (1 - x^-1/2) factor, which is still 0.3% away from one out there`);
}

/* ── 3 · the Kerr ISCO and the efficiency it fixes ────────────────────────── */
{
  ok('the ISCO is 6 gravitational radii for a non-rotating hole',
    Math.abs(X.diskIsco(0) - 6) < 1e-12,
    `r_ISCO(a = 0) = ${X.diskIsco(0).toFixed(12)}`);

  ok('and exactly 1 for an extremal one, which is the other closed form of the same quartic condition — not nearly 1, exactly 1',
    Math.abs(X.diskIsco(1) - 1) < 1e-14 && Math.abs(X.diskIsco(-1) - 9) < 1e-14,
    `r_ISCO(a = 1) = ${X.diskIsco(1).toFixed(14)} and the RETROGRADE root r_ISCO(a = -1) = ${X.diskIsco(-1).toFixed(14)} · at a = 1 the cube root of 1 - a^2 is zero, so Z1 = 1, Z2 = 2 and 3 + 2 - sqrt(2*8) = 1 with no rounding anywhere`);

  ok('the radiative efficiency at zero spin is 1 - sqrt(8/9) = 5.7191%, computed from the ISCO and not stored',
    Math.abs(X.diskEfficiency(0) - (1 - Math.sqrt(8 / 9))) < 1e-14,
    `eta = ${(100 * X.diskEfficiency(0)).toFixed(9)}% against ${(100 * (1 - Math.sqrt(8 / 9))).toFixed(9)}%`);

  ok('and at extremal spin it is 1 - 1/sqrt3 = 42.2650% — an order of magnitude more of the rest mass turned into light than hydrogen fusion manages at 0.7%',
    Math.abs(X.diskEfficiency(1) - (1 - 1 / Math.sqrt(3))) < 1e-14,
    `eta = ${(100 * X.diskEfficiency(1)).toFixed(9)}% against ${(100 * (1 - 1 / Math.sqrt(3))).toFixed(9)}% · exact, because the ISCO it is computed from is exact`);

  ok('the efficiency rises monotonically with spin across the whole range, which is the physical content of the ISCO shrinking',
    (() => { let prev = -1; for (let i = 0; i <= 400; i++) { const e = X.diskEfficiency(0.998 * i / 400);
      if (e < prev) return false; prev = e; } return true; })(),
    `400 samples from a = 0 to the Thorne limit, no reversal · eta(0.998) = ${(100 * X.diskEfficiency(0.998)).toFixed(4)}%`);
}

/* ── 4 · the scales, arrived at rather than assumed ───────────────────────── */
{
  const M = 1e8 * X.AD_MSUN;
  const LE = X.diskEddington(M);
  ok('the Eddington luminosity of a solar mass is 1.26e31 W, which is the number the literature quotes and is reached here from G, m_p, c and sigma_T alone',
    Math.abs(X.diskEddington(X.AD_MSUN) / 1.2569e31 - 1) < 2e-3,
    `L_Edd(1 M_sun) = ${X.diskEddington(X.AD_MSUN).toExponential(4)} W`);

  ok('and it is exactly linear in the mass, because nothing else in it depends on the hole',
    Math.abs(LE / X.diskEddington(X.AD_MSUN) - 1e8) < 1e-6,
    `L_Edd(1e8 M_sun)/L_Edd(1 M_sun) = ${(LE / X.diskEddington(X.AD_MSUN)).toExponential(9)}`);

  const eta = X.diskEfficiency(0), rg = X.AD_G * M / (X.AD_C * X.AD_C), rin = X.diskIsco(0) * rg;
  const Mdot = 0.1 * LE / (eta * X.AD_C * X.AD_C);
  const Tpk = X.diskPeakTemperature(M, Mdot, rin);
  ok('a 10^8 solar-mass hole accreting at a tenth of Eddington peaks in the ultraviolet, near 10^5 K — which is why quasars have a big blue bump and not an X-ray one',
    Tpk > 4e4 && Tpk < 3e5,
    `T_peak = ${Tpk.toExponential(4)} K · r_in = ${rin.toExponential(3)} m · Mdot = ${(Mdot * 3.15576e7 / X.AD_MSUN).toFixed(3)} M_sun/yr`);

  const Tstellar = X.diskPeakTemperature(10 * X.AD_MSUN, 0.1 * X.diskEddington(10 * X.AD_MSUN) / (eta * X.AD_C * X.AD_C),
    X.diskIsco(0) * X.AD_G * 10 * X.AD_MSUN / (X.AD_C * X.AD_C));
  ok('and a ten-solar-mass hole at the same Eddington ratio peaks in the X-ray at 10^7 K, the scale difference being M^-1/4 exactly',
    Math.abs(Tstellar / Tpk - Math.pow(1e7, 0.25)) / Math.pow(1e7, 0.25) < 1e-9,
    `T_peak(10 M_sun) = ${Tstellar.toExponential(4)} K · ratio ${(Tstellar / Tpk).toFixed(4)} against (1e8/10)^(1/4) = ${Math.pow(1e7, 0.25).toFixed(4)} — the M^-1/4 scaling of a thin disk at fixed Eddington ratio, obtained and not inserted`);

  ok('half the accretion energy is radiated by the disk and half is still kinetic at the inner edge — the luminosity kernel says exactly that',
    Math.abs(X.diskLuminosity(M, Mdot, rin) - 0.5 * X.AD_G * M * Mdot / rin) < 1e-6 * X.diskLuminosity(M, Mdot, rin),
    `L_disk = ${X.diskLuminosity(M, Mdot, rin).toExponential(4)} W = GMMdot/2r_in`);
}

/* ── 5 · the spectrum, against an independent quadrature ──────────────────── */
{
  const Tpk = 1e5, xmax = 1e5;
  /* a DIRECTLY written annulus sum, linear in radius rather than logarithmic, sharing no
     code with the kernel — if the two agree the quadrature is converged and not a shape */
  const direct = (nu) => { const N = 200000; let s = 0;
    for (let i = 0; i < N; i++) { const x = 1 + (xmax - 1) * (i + 0.5) / N, dx = (xmax - 1) / N;
      const T = X.diskTemperature(x, Tpk); if (!(T > 0)) continue;
      const e = X.AD_H * nu / (X.AD_KB * T); if (e > 700) continue;
      s += (2 * X.AD_H * nu * nu * nu / (X.AD_C * X.AD_C)) / (Math.exp(e) - 1) * x * dx; }
    return s; };
  const nu = 3.16e13, a = X.diskSpectrum(nu, Tpk, xmax), b = direct(nu);
  ok('the multicolour spectrum, summed on a logarithmic radius grid, agrees with a linear-grid quadrature written independently here',
    Math.abs(a / b - 1) < 5e-3,
    `log grid ${a.toExponential(6)} · linear grid ${b.toExponential(6)} · relative difference ${Math.abs(a / b - 1).toExponential(2)} — two quadratures of the same integral, converging from different directions`);

  const s1 = X.diskSpectralSlope(3.16e13, 1e14, Tpk, xmax);
  const s2 = X.diskSpectralSlope(1e13, 3.16e13, Tpk, xmax);
  ok('and its logarithmic slope in the middle band is one third — the signature of a multicolour blackbody, which follows from T proportional to r^-3/4 and is nowhere put in',
    Math.abs(s1 - 1 / 3) < 0.02 && Math.abs(s2 - 1 / 3) < 0.02,
    `measured ${s1.toFixed(5)} and ${s2.toFixed(5)} against 1/3 = ${(1 / 3).toFixed(5)} · the residual is the finite outer radius and the approach to the cutoff, and it shrinks as the band moves inward`);

  const rj = X.diskSpectralSlope(1e9, 3.16e9, Tpk, xmax);
  ok('far below the band it is the Rayleigh-Jeans slope of 2 instead, so the one third above is a measurement and not a constant the routine always returns',
    Math.abs(rj - 2) < 0.05,
    `measured ${rj.toFixed(5)} at 1 GHz against the Rayleigh-Jeans 2 · the same routine, a different regime, a different answer`);

  const cut = X.diskSpectralSlope(1e17, 3.16e17, Tpk, xmax);
  ok('and far above it the spectrum falls off exponentially, which the slope reports as a large negative number',
    cut < -5,
    `measured ${cut.toFixed(3)} at 1e17 Hz — the Wien cutoff of the hottest annulus, and the third distinct regime the one routine produces`);
}

console.log(`\n${fail === 0 ? '✔' : '✗'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
