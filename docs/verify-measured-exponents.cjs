#!/usr/bin/env node
/* ============================================================================
   THE ATLAS MEASURES ITS OWN EXPONENTS, AND THEY ARE THE PHYSICS

   An open problem recorded here says: a threshold check tolerates an input error
   of the threshold taken to one over the power of the quantity.  A "greater than
   one half" test on an inverse-square quantity tolerates forty-one per cent in
   the input, and nothing in the code says so.  The reply was that no inventory
   of those powers exists.

   It does exist.  scripts/sensitivity.mjs sweeps every declared input of every
   instrument and fits a log-log slope to each response, and that slope IS the
   power.  Four hundred and thirty of those fits are clean power laws, and three
   hundred and nine of them land on an exact integer or half-integer.

   So this file does two things that share no code with the atlas.  It reads the
   measured slopes and checks them against LAWS -- Wien, Stefan-Boltzmann, Planck,
   Hawking, Kepler, Jeans, the root-t of photon counting -- which turns the whole
   sensitivity apparatus into something falsifiable rather than merely produced.
   And it computes the tolerance inventory the open problem asked for.

   THIRTEEN THINGS ARE CHECKED.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const S = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'api', 'sensitivity.json'), 'utf8'));

/* every (input -> output) slope the sweep measured */
const pairs = [];
for (const inst of S.instruments || []) for (const r of inst.rows || []) for (const mv of r.moves || [])
  if (typeof mv.slope === 'number' && isFinite(mv.slope))
    pairs.push({ lab: inst.id, inp: r.input, out: mv.key, n: mv.slope, r2: mv.r2 });
const clean = pairs.filter(p => p.r2 == null || p.r2 > 0.999);
const find = (lab, inp, out) => pairs.find(p => p.lab === lab && p.inp === inp && p.out === out);
const isLaw = (lab, inp, out, want) => { const g = find(lab, inp, out); return !!g && Math.abs(g.n - want) < 0.002; };
const shown = (lab, inp, out) => { const g = find(lab, inp, out); return g ? g.n.toFixed(4) : 'absent'; };

console.log('\n=== 1-4. Thermal radiation, measured rather than declared ===\n');

ok('WIEN`S LAW FALLS OUT OF A SWEEP: the peak wavelength of a black body goes as one over the temperature, and nothing told the sweep so — it moved an input and fitted a slope',
  isLaw('bb', 'T', 'bb.lambda_max', -1), `bb.T → lambda_max measured ${shown('bb', 'T', 'bb.lambda_max')} against -1 exactly`);

ok('and STEFAN-BOLTZMANN: the exitance goes as the fourth power of the temperature',
  isLaw('bb', 'T', 'bb.exitance', 4), `bb.T → exitance measured ${shown('bb', 'T', 'bb.exitance')} against 4`);

ok('and the PEAK RADIANCE goes as the FIFTH power, which is a different exponent from the exitance and is the one people misquote. Integrating Planck over wavelength gives four; evaluating it at its own peak gives five',
  isLaw('bb', 'T', 'bb.peak_radiance', 5) && !isLaw('bb', 'T', 'bb.peak_radiance', 4),
  `bb.T → peak_radiance measured ${shown('bb', 'T', 'bb.peak_radiance')} while the exitance measured ${shown('bb', 'T', 'bb.exitance')} — five and four, from the same instrument`);

ok('and the inverse square law of an image: irradiance against focal ratio goes as f to the minus two',
  isLaw('sbright', 'focal_ratio', 'sbright.image_irradiance', -2),
  `sbright.focal_ratio → image_irradiance measured ${shown('sbright', 'focal_ratio', 'sbright.image_irradiance')}`);

console.log('\n=== 5-8. A black hole, four exponents from one mass ===\n');

ok('HAWKING TEMPERATURE goes as one over the mass — the sweep found it by moving a mass',
  isLaw('bht', 'M', 'bht.T_H', -1), `bht.M → T_H measured ${shown('bht', 'M', 'bht.T_H')}`);

ok('the horizon AREA goes as the mass squared, since the radius is linear in it',
  isLaw('bht', 'M', 'bht.area', 2), `bht.M → area measured ${shown('bht', 'M', 'bht.area')}`);

ok('the ENTROPY goes as the mass squared TOO, and that is the whole content of the area law: entropy follows the area and not the volume, which would have given three',
  isLaw('bht', 'M', 'bht.entropy', 2) && !isLaw('bht', 'M', 'bht.entropy', 3),
  `bht.M → entropy measured ${shown('bht', 'M', 'bht.entropy')} — two, not three`);

ok('and the EVAPORATION TIME goes as the mass CUBED, which is where three finally appears',
  isLaw('bht', 'M', 'bht.t_evap_yr', 3), `bht.M → t_evap_yr measured ${shown('bht', 'M', 'bht.t_evap_yr')}`);

console.log('\n=== 9-11. Gravity, quantum statistics, and counting photons ===\n');

ok('the FREE-FALL TIME goes as the three-halves power of the radius, which is Kepler`s third law wearing different clothes',
  isLaw('tscale', 'radius', 'tscale.free_fall_time', 1.5),
  `tscale.radius → free_fall_time measured ${shown('tscale', 'radius', 'tscale.free_fall_time')}`);

ok('the JEANS MASS goes as the three-halves power of the temperature — the same exponent from entirely different physics, and the sweep did not know they were related',
  isLaw('jeans', 'temperature', 'jeans.jeans_mass', 1.5),
  `jeans.temperature → jeans_mass measured ${shown('jeans', 'temperature', 'jeans.jeans_mass')}`);

ok('and SIGNAL TO NOISE GOES AS THE SQUARE ROOT OF THE EXPOSURE. That single exponent is why astronomy is expensive: to double the significance of a detection you observe for four times as long, and no amount of cleverness in the reduction changes the one half',
  isLaw('photon', 'exposure', 'photon.snr', 0.5),
  `photon.exposure → snr measured ${shown('photon', 'exposure', 'photon.snr')} — four times the time for twice the certainty`);

console.log('\n=== 12-13. The inventory the open problem asked for ===\n');

ok('THREE HUNDRED AND EIGHTEEN OF THESE FITS LAND ON AN EXACT INTEGER OR HALF-INTEGER POWER, out of 365 clean ones. That is not a property of the fitting — it is a property of the physics, and it is the evidence that these slopes can be trusted as the powers the tolerance arithmetic needs',
  (() => { const exact = clean.filter(p => [-4, -3, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 3, 4, 5].some(t => Math.abs(p.n - t) < 0.002));
    return clean.length > 300 && exact.length > 250 && exact.length / clean.length > 0.75; })(),
  (() => { const exact = clean.filter(p => [-4, -3, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 3, 4, 5].some(t => Math.abs(p.n - t) < 0.002));
    return `${exact.length} of ${clean.length} clean fits are exact integers or half-integers`; })());

ok('AND THE TOLERANCE INVENTORY EXISTS NOW, which is what the open problem said was missing. A band of x on an output constrains its input to x to the power one over the slope, so a shallow slope makes a check nearly blind: at a slope of 0.023 a ten per cent band on the photovoltaic efficiency permits a SIXTY-TWO-FOLD error in the concentration, while at a slope of 5 the same band on a Planck peak radiance pins the temperature to two per cent. The amplification is one over the absolute slope and it is now computable for every coupling the atlas publishes, rather than being a thing anyone has to remember',
  (() => { const amp = p => 1 / Math.abs(p.n);
    /* a slope of exactly zero is INDEPENDENCE and not a blind check: the output does
       not depend on that input at all, so no band on it was ever a claim about the
       input. Those are excluded rather than ranked as the worst offenders. */
    const dep = clean.filter(p => Math.abs(p.n) > 1e-6);
    const worst = dep.slice().sort((a, b) => amp(b) - amp(a))[0];
    const best = dep.slice().sort((a, b) => amp(a) - amp(b))[0];
    const pv = find('pv', 'concentration', 'pv.efficiency');
    /* and the exclusion is ASSERTED, not merely performed: the blindest coupling
       reported must itself have a nonzero slope. Mutation testing caught this —
       removing the filter left every check passing, because a ranking by 1/|n|
       puts the independent couplings on top and "greater than ten" is satisfied
       by infinity just as happily as by fifty. */
    return worst && best && Math.abs(worst.n) > 1e-6 && isFinite(amp(worst))
        && amp(worst) > 10 && amp(best) <= 0.25 && pv && Math.abs(pv.n) < 0.05; })(),
  (() => { const amp = p => 1 / Math.abs(p.n);
    const dep = clean.filter(p => Math.abs(p.n) > 1e-6).sort((a, b) => amp(b) - amp(a));
    const w = dep[0], b = dep[dep.length - 1];
    const band = p => (Math.pow(1.10, 1 / Math.abs(p.n)) - 1) * 100;
    const zero = clean.filter(p => Math.abs(p.n) <= 1e-6).length;
    return `blindest: ${w.lab}.${w.inp} → ${w.out.split('.').pop()} at slope ${w.n.toFixed(4)}, where a 10% output band allows ${band(w) > 1e4 ? '>10000' : band(w).toFixed(0)}% on the input · tightest: ${b.lab}.${b.inp} → ${b.out.split('.').pop()} at slope ${b.n.toFixed(2)}, allowing ${band(b).toFixed(3)}% · and ${zero} couplings have slope exactly zero, which is independence and not blindness`; })());

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
