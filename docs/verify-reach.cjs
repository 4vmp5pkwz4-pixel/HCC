#!/usr/bin/env node
/* ============================================================================
   FROM A CONTROL YOU CAN TURN TO A LABORATORY YOU CANNOT SEE — CHECKED

   STATUS: COMPOSED, then DISBELIEVED.

   api/reach.json multiplies two exponents that were measured separately — what a
   laboratory's own control does to its own outputs, and what one of those outputs
   does to a distant laboratory over a declared coupling — to get what the control
   does to the distant laboratory.  Nothing measures that product directly.  It is
   arithmetic over two artifacts, and arithmetic over measurements is exactly the
   kind of thing that comes out confident and wrong.

   So the products are checked against CLOSED FORMS written here, and as everywhere
   else in this atlas the exponents are not quoted: each law is a formula and its
   exponent is obtained by evaluating it at two points and taking the ratio of the
   logarithms.  The numbers -4, +1 and -1 appear nowhere below.  They come out.

   The chain that matters most is three laboratories long.  A black-hole
   thermodynamics laboratory turns a mass into a Hawking temperature; a blackbody
   laboratory turns that temperature into a peak wavelength; an interference
   laboratory turns that wavelength into the position of a fringe.  No two of them
   know the third exists, no measurement in this atlas spans all three, and the
   answer — the fringe moves as the reciprocal of the mass — is a product of two
   numbers neither of which was measured with the other in mind.
   ========================================================================= */

const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'api', 'reach.json');

let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

if (!fs.existsSync(FILE)) { console.error('api/reach.json is missing — run scripts/reach.mjs'); process.exit(1); }
const doc = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const exponentOf = (f, x0, x1) => (Math.log(f(x1)) - Math.log(f(x0))) / (Math.log(x1) - Math.log(x0));
const SIGMA = 5.670374419e-8, WIEN = 2.897771955e-3;
const HBAR = 1.054571817e-34, C = 299792458, G = 6.67430e-11, KB = 1.380649e-23;

/* the Hawking temperature of a Schwarzschild horizon, written out rather than assumed */
const T_H = M => (HBAR * C ** 3) / (8 * Math.PI * G * M * KB);

const chain = (control, reaches) => (doc.chains || []).find(c => c.control === control && c.reaches === reaches);

console.log('\n=== 1. A product of two measurements, against physics that spans both ===\n');

const LAWS = [
  { control: 'bht.M', reaches: 'bb.exitance',
    law: 'a black hole radiates less as it grows: the Hawking temperature falls as one over the mass and a '
       + 'blackbody exitance rises as the fourth power of temperature, so the exitance falls as the fourth '
       + 'power of the mass — two laboratories, neither of which knows the other exists',
    f: M => SIGMA * T_H(M) ** 4, a: 1e12, b: 1e14 },
  { control: 'bht.M', reaches: 'bb.lambda_max',
    law: 'and the peak wavelength of that radiation rises in direct proportion to the mass, because Wien '
       + 'puts it at b over the temperature and the temperature is one over the mass',
    f: M => WIEN / T_H(M), a: 1e12, b: 1e14 },
  { control: 'bht.M', reaches: 'wave.order_position_paraxial',
    law: 'AND THE CHAIN THAT MATTERS: three laboratories deep, a black hole to a blackbody to an '
       + 'interference pattern, the paraxial fringe position being linear in the wavelength — so the fringe '
       + 'moves as the reciprocal of the mass of a black hole nobody in the optics laboratory has heard of',
    f: M => 1 * (WIEN / T_H(M)) * 2.0 / 1e-4, a: 1e12, b: 1e14 }
];

for (const L of LAWS) {
  const want = exponentOf(L.f, L.a, L.b);
  const c = chain(L.control, L.reaches);
  if (!c) { ok(L.law, false, `api/reach.json carries no chain ${L.control} → ${L.reaches}`); continue; }
  ok(`${L.law} — and the atlas gets there by multiplying two exponents measured years apart in different files`,
    Math.abs(c.exponent - want) < 5e-3,
    `closed form spanning the whole chain gives ${want.toFixed(6)} · the product of the measured legs gives `
    + `${c.exponent.toFixed(6)} = ${c.leg_control_to_output.toFixed(6)} × ${c.leg_output_to_far.toFixed(6)} `
    + `across ${c.laboratories} laboratories`);
}

console.log('\n=== 2. The arithmetic is the arithmetic it claims to be ===\n');

const bad = (doc.chains || []).filter(c =>
  Math.abs(c.exponent - c.leg_control_to_output * c.leg_output_to_far) > 1e-9);
ok('every published exponent is the product of the two legs printed beside it. A composed number that is not the product of its parts would be unfalsifiable from the file itself, and this file exists precisely because a product of measurements is easy to get confidently wrong',
  bad.length === 0,
  `${(doc.chains || []).length} chains, every one equal to its own two factors${bad.length ? ` · ${bad.length} do not` : ''}`);

ok('and the two artifacts it multiplies were measured at the SAME build. Composing a number from one build with a number from another is how a product comes out confident and wrong, and neither source can notice on its own — the generator refuses to run when they disagree, and this checks the record it left',
  doc.composed_from && doc.composed_from.sensitivity === doc.composed_from.transfers,
  doc.composed_from ? `both legs measured at ${doc.composed_from.sensitivity}` : 'no provenance recorded');

ok('the counts are the rows rather than a separate tally',
  doc.counts.chains === (doc.chains || []).length
  && doc.counts.controls === new Set((doc.chains || []).map(c => c.control)).size
  && doc.counts.laboratories_reached === new Set((doc.chains || []).map(c => c.reaches.split('.')[0])).size,
  `${doc.counts.chains} chains · ${doc.counts.controls} turnable controls · reaching ${doc.counts.laboratories_reached} laboratories · deepest ${doc.counts.deepest_chain}`);

console.log('\n=== 3. And a chain is only physics if its control is ===\n');

ok('the file says so about itself, in writing, and does not quietly drop the chains that are not. Some inputs here are numerical rather than physical — an integration step, a sample count, a tolerance — and nothing in a declaration says which. A chain rooted at one of those reports that the answer changes when the SOLVER is refined, which is a true statement and not a physical dependence. Filtering them out would hide the finding; the caveat is carried instead, and the open-problem register names the gap',
  !!(doc.composed_from && typeof doc.composed_from.numerical_controls === 'string'
     && doc.composed_from.numerical_controls.length > 200),
  'the artifact carries the caveat rather than presenting every chain as a physical dependence');

const solverRooted = (doc.chains || []).filter(c => /\.(step|steps|samples|points|tolerance|iterations)$/.test(c.control));
ok('and at least one such chain is actually present, so the caveat is about something rather than being a disclaimer nobody has tested. A numerical control that moves a published output two laboratories away is a real measurement of a real thing — it is just not the thing a reader would assume from the row',
  solverRooted.length > 0,
  solverRooted.length
    ? `${solverRooted.length} chains are rooted at a solver control: ${[...new Set(solverRooted.map(c => c.control))].join(', ')}`
    : 'none found — if the atlas has learned to declare which inputs are numerical, this check has served its purpose and should be replaced by one that reads the declaration');

console.log('\n=== 4. And a product of two numbers is not a law ===\n');

/* This file used to check that every exponent equals its two factors and stop there.
   It did, and the exponent still described nothing: ns.central_density → wd.radius_km
   composed to a clean -0.4783 out of a white-dwarf leg whose local slope runs from
   -0.36 at the low end to -5.05 at the high one. That is the Chandrasekhar breakdown,
   which this atlas located and then averaged into a scaling law that does not exist. */

const judged = (doc.chains || []).filter(c => c.power_law !== undefined);
ok('every chain carries a verdict on whether it is a power law at all, not only an exponent. The arithmetic was already checked and that was never the risk: a product of two real numbers is always a real number, and it is a LAW only if both factors are constant across the ranges they were fitted on',
  judged.length === (doc.chains || []).length && judged.every(c => typeof c.why === 'string' && c.why.length > 30),
  `${judged.length}/${(doc.chains || []).length} chains verdicted, each with its reason in words`);

const holds = (doc.chains || []).filter(c => c.power_law === true);
const broken = (doc.chains || []).filter(c => c.power_law === false);
ok('and the verdict SEPARATES rather than passing everything. If it called every chain a power law it would be a field nobody could act on, and if it called none of them one it would be the same',
  holds.length > 0 && broken.length > 0,
  `${holds.length} hold across their range · ${broken.length} do not · ${(doc.chains || []).length - holds.length - broken.length} unjudged`);

/* the two the physics settles: Hawking against Stefan-Boltzmann is exactly -4 and
   against Wien exactly +1, both from closed forms with no correction term anywhere in
   the range. If the verdict called EITHER of those broken it would be too strict. */
const sb = (doc.chains || []).find(c => c.control === 'bht.M' && c.reaches === 'bb.exitance');
const wien = (doc.chains || []).find(c => c.control === 'bht.M' && c.reaches === 'bb.lambda_max');
ok('the two chains physics settles are verdicted TRUE. T_H goes as 1/M with no correction term and Stefan-Boltzmann goes as T^4 with none either, so the composition is exactly -4 everywhere and a verdict that doubted it would be too strict to use',
  !!sb && sb.power_law === true && Math.abs(sb.exponent + 4) < 1e-9
  && !!wien && wien.power_law === true && Math.abs(wien.exponent - 1) < 1e-9,
  sb && wien ? `bht.M → bb.exitance ${sb.exponent.toFixed(6)} (${sb.power_law}) · bht.M → bb.lambda_max ${wien.exponent.toFixed(6)} (${wien.power_law})`
             : 'the two reference chains are not in the file');

/* and the one physics says must NOT hold */
const chandra = (doc.chains || []).filter(c => /^wd\.radius/.test(c.reaches));
ok('and every chain into a white dwarf RADIUS is verdicted false. Non-relativistic degeneracy gives R ∝ M^(-1/3) and the atlas measures -0.3606 at the low-mass end, but the same sweep reaches -5.05 near the Chandrasekhar limit, where the star runs out of radius entirely. One exponent cannot be both, so a single number for that chain is a claim about a law that stops',
  chandra.length > 0 && chandra.every(c => c.power_law === false)
  && chandra.every(c => /drifts/.test(c.why || '')),
  chandra.length ? `${chandra.length} chains into wd.radius_*, all verdicted false — "${chandra[0].why.slice(0, 110)}…"`
                 : 'no white-dwarf radius chain present to test the verdict against');

ok('and both legs are judged, which is why the near leg publishes its fit quality. A product with one half checked and the whole presented as checked is a worse silence than not checking at all, because the field looks like an answer',
  (doc.chains || []).every(c => c.near_r2 !== undefined && c.far_r2 !== undefined),
  `near and far fit quality present on all ${(doc.chains || []).length} chains · near R² takes ${[...new Set((doc.chains || []).map(c => c.near_r2).filter(x => x != null).map(x => x.toFixed(4)))].sort().join(', ')}`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
