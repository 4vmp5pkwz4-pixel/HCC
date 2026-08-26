#!/usr/bin/env node
/* ============================================================================
   WHAT A COUPLING IS WORTH — CHECKED AGAINST PHYSICS

   STATUS: MEASURED, then DISBELIEVED.

   The atlas now drives every declared coupling across the source's whole domain,
   fits a straight line through the cloud in log-log, and writes the slope to
   api/transfers.json.  That slope is d log(target) / d log(source): how the far
   end of an influence moves when the near end does.

   This file reads that artifact and refuses it if physics disagrees.

   IT DOES NOT QUOTE THE EXPONENTS.  Writing `expect 4` for Stefan-Boltzmann would
   check that two constants match, which is not a check of anything.  Instead each
   law is written here as a CLOSED FORM — sigma T^4, b/T, sqrt(4GM/c^2 . D),
   GM/c^2, 2 pi c / omega, (4/3) pi R^3, 4 pi R^2, m lambda L / d — and its
   exponent is obtained the same way the atlas obtained its own: evaluate the form
   at two points two decades apart and take the ratio of the logarithms.  The
   number 4 appears nowhere below.  It comes out.

   The pairs of laboratories involved do not know each other exists.  A black-hole
   thermodynamics laboratory computes a Hawking temperature and stops; a blackbody
   laboratory takes a temperature and knows nothing about where it came from.  That
   the exponent between them is the Stefan-Boltzmann four is a fact about the atlas
   being one machine, and it is checked here without either laboratory being run.
   ========================================================================= */

const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'api', 'transfers.json');

let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

if (!fs.existsSync(FILE)) { console.error('api/transfers.json is missing — run scripts/transfers.mjs'); process.exit(1); }
const doc = JSON.parse(fs.readFileSync(FILE, 'utf8'));

/* ── the exponent of a closed form, obtained rather than written down ─────────
   For a pure power law y = k x^n the ratio of logarithms is exactly n at any two
   points.  Nothing here is told what n is. */
const exponentOf = (f, x0, x1) => (Math.log(f(x1)) - Math.log(f(x0))) / (Math.log(x1) - Math.log(x0));

const SIGMA = 5.670374419e-8;     /* W m^-2 K^-4, exact from h, c, k_B */
const WIEN  = 2.897771955e-3;     /* m K, exact */
const G     = 6.67430e-11;
const C     = 299792458;

console.log('\n=== 1. Every exponent below is DERIVED here, never quoted ===\n');

const LAWS = [
  { route: 'bht.T_H → bb.T', out: 'bb.exitance',
    law: 'Stefan-Boltzmann: the exitance of a blackbody is sigma T^4',
    f: T => SIGMA * T * T * T * T, a: 100, b: 10000 },
  { route: 'bht.T_H → bb.T', out: 'bb.lambda_max',
    law: 'Wien: the peak wavelength of a blackbody is b/T',
    f: T => WIEN / T, a: 100, b: 10000 },
  { route: 'ns.mass → elens.lens_mass', out: 'elens.einstein_radius_kpc',
    law: 'the Einstein radius goes as the square root of the lens mass, theta_E = sqrt(4GM/c^2 . D_LS/(D_L D_S))',
    f: M => Math.sqrt(4 * G * M / (C * C) * 1e-20), a: 1e30, b: 1e32 },
  { route: 'ns.mass → adisk.mass', out: 'adisk.gravitational_radius',
    law: 'the gravitational radius is GM/c^2, linear in the mass',
    f: M => G * M / (C * C), a: 1e30, b: 1e32 },
  { route: 'ladder.omega → dip.omega', out: 'dip.wavefront_spacing',
    law: 'a wavelength is 2 pi c / omega, the reciprocal of an angular frequency',
    f: w => 2 * Math.PI * C / w, a: 1, b: 100 },
  { route: 'ladder.R → red.radius', out: 'red.ball_volume',
    law: 'the volume of a ball is (4/3) pi R^3',
    f: R => (4 / 3) * Math.PI * R * R * R, a: 1e20, b: 1e22 },
  { route: 'ladder.R → red.radius', out: 'red.boundary_area',
    law: 'the area of its boundary is 4 pi R^2',
    f: R => 4 * Math.PI * R * R, a: 1e20, b: 1e22 },
  { route: 'ladder.R → mimg.radius', out: 'mimg.geodesic_sphere_area',
    law: 'a geodesic sphere is an area and goes as R^2',
    f: R => 4 * Math.PI * R * R, a: 1e20, b: 1e22 },
  { route: 'bht.T_H → bb.T → wave.wavelength', out: 'wave.order_position_paraxial',
    law: 'the paraxial fringe position is m lambda L / d, linear in the wavelength',
    f: lam => 1 * lam * 2.0 / 1e-4, a: 1e-9, b: 1e-7 },
  { route: 'ns.radius_km → nuosc.baseline', out: 'nuosc.oscillation_length',
    law: 'the oscillation length is 4 pi E / Delta m^2 and does NOT contain the baseline: '
       + 'moving the detector cannot change it, so the exponent is zero',
    f: () => 3.1416, a: 1, b: 100 }
];

const find = (routeName, outKey) => {
  const r = doc.routes.find(x => x.name === routeName);
  if (!r) return { missing: `no route named ${routeName}` };
  const o = (r.outputs || []).find(x => x.key === outKey);
  if (!o) return { missing: `${routeName} publishes no output ${outKey}` };
  return { r, o };
};

for (const L of LAWS) {
  const want = exponentOf(L.f, L.a, L.b);
  const { r, o, missing } = find(L.route, L.out);
  if (missing) { ok(`${L.law} — as measured on ${L.out}`, false, missing); continue; }
  const got = o.slope;
  const good = got !== null && Math.abs(got - want) < 1e-3 && (o.r2 === null || o.r2 > 0.9999);
  ok(`${L.law} — and the atlas, driving ${L.route.split(' → ')[0]} through to ${L.out.split('.')[0]}, measures the same exponent without being told it`,
    good,
    `closed form here gives ${want.toFixed(6)} · the atlas measured ${got === null ? 'no slope' : got.toFixed(6)}`
    + (o.r2 !== null && o.r2 !== undefined ? ` at R^2 ${o.r2.toFixed(6)}` : '')
    + ` over ${r.live} live samples of ${r.samples}`);
}

console.log('\n=== 2. And the file says what kind of file it is ===\n');

/* ── THE CHEAPEST CHECK HERE, AND THE ONE WITHOUT WHICH THE REST ROT ────────
   Re-measuring these thirty-five routes takes three minutes, because four of the
   couplings run instruments that cost half a second a sample.  CI does not spend
   that on every commit — which means the artifact can drift away from the code
   while every check above still passes, since they compare the FILE against
   physics and the file has not changed.  That is two authorities for one fact,
   the failure this atlas keeps naming.

   So the file records the version and build it was measured at, and this compares
   them against version.json.  It costs microseconds and it makes the staleness
   impossible to miss: change the atlas, bump the build, and this fails until
   scripts/transfers.mjs has been run again. */
{
  const v = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'version.json'), 'utf8'));
  ok('the published influence map was measured from THIS build of the atlas, not an earlier one. Re-driving every route takes three minutes and CI does not spend it on every commit, so without this the file could drift away from the code while every check above went on passing — they compare the file against physics, and a stale file agrees with physics perfectly well',
    doc.version === v.version && doc.build === v.build,
    doc.version === v.version && doc.build === v.build
      ? `measured at ${doc.version} / ${doc.build}`
      : `the artifact says ${doc.version} / ${doc.build} and the atlas says ${v.version} / ${v.build} — re-run scripts/transfers.mjs`);

  /* ── AND A BUILD STRING IS NOT A GOOD ENOUGH STAMP ─────────────────────────
     The check above catches somebody changing the atlas and bumping the build.
     It misses somebody changing an INSTRUMENT and not bumping — which is not
     hypothetical; a commit in this branch changed only scripts and shipped
     without a bump, correctly, because the page was untouched.  An instrument
     gaining an output, losing an input or moving a declared domain changes every
     sweep that drives it and need not touch the version at all.

     So the artifact also carries a hash of what the sweeps actually depend on:
     every instrument's id, its inputs with their declared domains, its outputs
     with their units, as api/manifest.json publishes them.  Recomputing it here
     costs microseconds and no version discipline is relied on. */
  const shape = (m) => {
    const s = (m.instruments || []).map(i => [i.id,
      (i.inputs || []).map(f => [f.name, f.unit ?? null, f.type ?? null, f.default ?? null, f.min ?? null, f.max ?? null]),
      (i.outputs || []).map(o => [o.name, o.unit ?? null])]);
    s.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    return require('crypto').createHash('sha256').update(JSON.stringify(s)).digest('hex').slice(0, 32);
  };
  const man = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'api', 'manifest.json'), 'utf8'));
  const now = shape(man);
  ok('and not merely from this BUILD but from these INSTRUMENTS. A version string is a promise somebody has to remember to keep, and an instrument that gains an output or moves a declared domain changes every sweep that drives it without touching the version at all. The artifact carries a hash of every instrument\'s inputs, domains, outputs and units as the manifest publishes them, so a declaration changing under a stale influence map is caught by arithmetic instead of by discipline',
    doc.instruments_fingerprint === now,
    doc.instruments_fingerprint === now
      ? `${(man.instruments || []).length} instrument declarations hash to ${now}, which is what the artifact was measured against`
      : `the artifact was measured against ${doc.instruments_fingerprint || '(no fingerprint — regenerate it)'} and the instruments now hash to ${now} — a declaration changed; re-run scripts/transfers.mjs`);
}

ok('every route the atlas declares is present, single hops and enumerated paths alike, and the counts in the header agree with the rows underneath them rather than being written separately',
  doc.routes.length === doc.counts.routes
  && doc.counts.single_hop === doc.routes.filter(r => r.hops === 1).length
  && doc.counts.multi_hop === doc.routes.filter(r => r.hops > 1).length
  && doc.counts.failed === doc.routes.filter(r => r.error).length,
  `${doc.counts.routes} routes = ${doc.counts.single_hop} single hops + ${doc.counts.multi_hop} multi-hop paths · ${doc.counts.failed} failed`);

const fitted = doc.routes.filter(r => r.fitable);
const unfitted = doc.routes.filter(r => !r.fitable && !r.error);
ok('no exponent is published where the source barely moves. A rung index that travels an eighth of a decade into a ladder that travels sixty-nine gives a ratio of logarithms that is arithmetically fine and physically empty, so those routes carry decades-moved and no slope at all — and the file is checked to contain none',
  unfitted.every(r => (r.outputs || []).every(o => o.slope === null)),
  `${fitted.length} routes had enough source travel to fit · ${unfitted.length} did not and publish no slope`);

ok('and a slope is never published off a handful of surviving points. Two of these routes are refused across almost their whole drive, and the first sweep of this artifact fitted their laws through three and four live samples and got 3.0465 and 1.0562 where the closed forms say 3 and 1. The sweep now densifies until enough points survive, and every published fit is checked to stand on at least ten of them',
  doc.routes.filter(r => (r.outputs || []).some(o => o.slope !== null)).every(r => r.live >= 10),
  `${doc.counts.densified} routes had to be re-swept more densely · smallest live count behind any published slope: `
  + Math.min(...doc.routes.filter(r => (r.outputs || []).some(o => o.slope !== null)).map(r => r.live)));

console.log('\n=== 3. What is NOT a law, and is not reported as one ===\n');

const wd = doc.routes.find(r => r.name === 'ns.mass → wd.mass');
const wdOut = wd && (wd.outputs || []).find(o => o.key === 'wd.mean_density');
ok('a neutron-star mass into a white dwarf is NOT a clean power law and the file does not pretend it is. Non-relativistic degeneracy gives R proportional to M^(-1/3) and therefore a density going as M^2, but the fit comes out near three with a visibly imperfect R^2, because the sweep runs up to the Chandrasekhar limit where the relativistic correction takes over and the exponent is no longer constant. That is the physics, and the check is that the atlas has NOT reported a suspiciously exact number here',
  !!wdOut && wdOut.r2 < 0.99 && wdOut.slope > 2 && wdOut.slope < 4,
  wdOut ? `slope ${wdOut.slope.toFixed(4)} at R^2 ${wdOut.r2.toFixed(5)} — a real curve, not a power law`
        : 'the white-dwarf route is absent');

const limp = doc.routes.filter(r => r.outputs && r.outputs.length && (r.moved || 0) <= 0.02);
ok('and the couplings that carry NOTHING are in the file as first-class entries rather than omitted. A declared, verified, dimensionally sound coupling whose far end does not move is the thing this whole measurement exists to make visible, and leaving it out of the artifact would hide exactly what the artifact is for',
  limp.length > 0 && limp.every(r => Array.isArray(r.outputs)),
  `${limp.length} routes move their far end by less than a hundredth of a decade: ${limp.slice(0, 4).map(r => r.name).join(' · ')}${limp.length > 4 ? ' …' : ''}`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
