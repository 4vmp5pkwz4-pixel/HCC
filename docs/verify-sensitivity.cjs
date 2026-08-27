#!/usr/bin/env node
/* ============================================================================
   DOES A LABORATORY'S OWN CONTROL DO ANYTHING — CHECKED AGAINST PHYSICS

   STATUS: MEASURED, then DISBELIEVED.

   api/sensitivity.json records what happens when each declared numeric input of
   each instrument is swept across its own declared domain with the others held at
   their defaults.  This file refuses that artifact if physics disagrees, and it
   does not quote the exponents: each law is written below as a CLOSED FORM and
   its exponent is obtained the way the atlas obtained its own, by evaluating the
   form at two points two decades apart and taking the ratio of the logarithms.
   The numbers 4, 5, -4 and -1/4 appear nowhere here.  They come out.

   AND THE SHARPEST CHECK IS NOT AGAINST A FORMULA AT ALL.  Two of these laws are
   also measured by api/transfers.json, which reaches them a completely different
   way: the bus DRIVES one laboratory from another and fits the far end, while this
   file sweeps a laboratory's own input directly.  Different code, different
   sweeps, different artifacts.  They must agree, and where they do not, one of
   them is wrong.
   ========================================================================= */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const FILE = path.join(__dirname, '..', 'api', 'sensitivity.json');

let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

if (!fs.existsSync(FILE)) { console.error('api/sensitivity.json is missing — run scripts/sensitivity.mjs'); process.exit(1); }
const doc = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const exponentOf = (f, x0, x1) => (Math.log(f(x1)) - Math.log(f(x0))) / (Math.log(x1) - Math.log(x0));
const SIGMA = 5.670374419e-8, WIEN = 2.897771955e-3, H = 6.62607015e-34, C = 299792458, KB = 1.380649e-23;

const move = (inputKey, outKey) => {
  const [ins, field] = inputKey.split('.');
  const I = (doc.instruments || []).find(x => x.id === ins);
  if (!I) return { missing: `no instrument ${ins}` };
  const R = (I.rows || []).find(r => r.input === field);
  if (!R) return { missing: `${ins} declares no swept input ${field}` };
  const M = (R.moves || []).find(m => m.key === outKey);
  if (!M) return { missing: `${inputKey} moves no output ${outKey}` };
  return { slope: M.slope, decades: M.decades };
};

console.log('\n=== 1. A laboratory driven through its own control, against closed form ===\n');

const LAWS = [
  { input: 'bb.T', out: 'bb.exitance',
    law: 'Stefan-Boltzmann again, but reached from inside: the blackbody laboratory swept on its OWN temperature',
    f: T => SIGMA * T ** 4, a: 100, b: 10000 },
  { input: 'bb.T', out: 'bb.lambda_max',
    law: "Wien from inside the same laboratory: the peak wavelength is b/T",
    f: T => WIEN / T, a: 100, b: 10000 },
  { input: 'bb.T', out: 'bb.peak_radiance',
    law: 'and the radiance AT that peak goes as the fifth power, which is Planck evaluated at lambda_max — '
       + 'a law the bus never surfaced because no coupling in this atlas carries peak radiance',
    f: T => { const lam = WIEN / T; return (2 * H * C * C) / (lam ** 5 * (Math.exp(H * C / (lam * KB * T)) - 1)); },
    a: 100, b: 10000 },
  { input: 'dip.lambda_short', out: 'dip.rayleigh_ratio',
    law: 'Rayleigh scattering goes as the inverse fourth power of the wavelength, which is why the sky is blue',
    f: lam => 1 / lam ** 4, a: 4e-7, b: 7e-7 },
  { input: 'dip.omega', out: 'dip.larmor_relative',
    law: 'the Larmor power radiated by an oscillating dipole goes as the fourth power of the frequency',
    f: w => w ** 4, a: 1e6, b: 1e8 },
  /* AND THIS ONE CAUGHT ME RATHER THAN THE ATLAS, which is what deriving instead of
     quoting is for.  The first version of this closed form was written (M/M^3)^(1/4)
     while the sentence beside it said M^2 — a slip of one character, giving -1/2 where
     the physics gives -1/4.  The atlas measured -1/4, the check went red, and the file
     that was wrong was this one.  At a fixed Eddington ratio the accretion rate goes as
     the mass, because L_Edd does and Mdot = L/(eta c^2); the disc temperature goes as
     (Mdot/M^2)^(1/4); so T goes as (M/M^2)^(1/4) = M^(-1/4). */
  { input: 'adisk.mass', out: 'adisk.peak_temperature',
    law: 'the Shakura-Sunyaev peak temperature falls as the minus one quarter power of the black-hole mass, '
       + 'because at a fixed Eddington ratio Mdot goes as M and T goes as (Mdot/M^2)^(1/4)',
    f: M => (M / M ** 2) ** 0.25, a: 1e30, b: 1e32 },
  { input: 'red.radius', out: 'red.ball_volume',
    law: 'a ball volume goes as the cube of its radius',
    f: R => (4 / 3) * Math.PI * R ** 3, a: 1e20, b: 1e22 },
  { input: 'elens.lens_mass', out: 'elens.einstein_radius',
    law: 'the Einstein angle goes as the square root of the lens mass',
    f: M => Math.sqrt(M), a: 1e30, b: 1e32 }
];

for (const L of LAWS) {
  const want = exponentOf(L.f, L.a, L.b);
  const got = move(L.input, L.out);
  if (got.missing) { ok(`${L.law}`, false, got.missing); continue; }
  ok(`${L.law} — and the atlas measures the same exponent by turning that laboratory's own control, without being told it`,
    got.slope !== null && Math.abs(got.slope - want) < 5e-3,
    `closed form here gives ${want.toFixed(6)} · sweeping ${L.input} moves ${L.out} with exponent `
    + `${got.slope === null ? 'none reported' : got.slope.toFixed(6)} over ${got.decades === null ? '?' : got.decades.toFixed(2)} decades`);
}

console.log('\n=== 2. The same law reached two completely different ways ===\n');

const TFILE = path.join(__dirname, '..', 'api', 'transfers.json');
if (!fs.existsSync(TFILE)) {
  ok('the influence map is present so the two paths can be compared', false, 'api/transfers.json is missing');
} else {
  const tdoc = JSON.parse(fs.readFileSync(TFILE, 'utf8'));
  const viaBus = (routeName, outKey) => {
    const r = (tdoc.routes || []).find(x => x.name === routeName);
    const o = r && (r.outputs || []).find(x => x.key === outKey);
    return o ? o.slope : null;
  };
  const PAIRS = [
    { bus: ['bht.T_H → bb.T', 'bb.exitance'], own: ['bb.T', 'bb.exitance'],
      what: 'a blackbody exitance, reached by driving it from a black hole and by turning its own thermostat' },
    { bus: ['bht.T_H → bb.T', 'bb.lambda_max'], own: ['bb.T', 'bb.lambda_max'],
      what: 'the same for the peak wavelength' },
    { bus: ['ladder.R → red.radius', 'red.ball_volume'], own: ['red.radius', 'red.ball_volume'],
      what: 'a ball volume, reached by handing the laboratory a shell radius over the bus and by sweeping its own radius' },
    { bus: ['ns.mass → elens.lens_mass', 'elens.einstein_radius_kpc'], own: ['elens.lens_mass', 'elens.einstein_radius_kpc'],
      what: 'an Einstein radius, reached from a neutron star and from the lens laboratory itself' }
  ];
  for (const P of PAIRS) {
    const b = viaBus(P.bus[0], P.bus[1]);
    const o = move(P.own[0], P.own[1]);
    ok(`${P.what} — two artifacts, two sweeps, two pieces of code that share nothing but the laboratory, and one number`,
      b !== null && !o.missing && o.slope !== null && Math.abs(b - o.slope) < 5e-3,
      o.missing ? o.missing
        : `through the bus ${b === null ? 'no slope' : b.toFixed(6)} · through its own control ${o.slope.toFixed(6)}`);
  }
}

console.log('\n=== 3. And the three ways of learning nothing are kept apart ===\n');

ok('the counts in the header are the rows underneath them rather than a separate tally, and every input falls in exactly one class: it responds, or it is dead, or every value was refused, or the laboratory never came back',
  doc.counts.inputs === doc.counts.responding + doc.counts.dead + doc.counts.refused + doc.counts.unreturned,
  `${doc.counts.inputs} declared inputs = ${doc.counts.responding} responding + ${doc.counts.dead} dead `
  + `+ ${doc.counts.refused} refused + ${doc.counts.unreturned} unreturned`);

const rows = (doc.instruments || []).flatMap(i => (i.rows || []).map(r => ({ ins: i.id, ...r })));
ok('a REFUSED input is never called dead. Every value in its declared domain was refused, so the sweep learned nothing about whether it does anything — recording that as "moves nothing" would be the artifact asserting a fact it does not have, which is the failure this whole file is built to avoid',
  rows.filter(r => r.dead === null && !r.unreturned && !r.truncated).every(r => r.responding === null || r.responding === 0)
  && doc.refused.every(r => typeof r.why === 'string' && r.why.length > 20),
  `${doc.counts.refused} inputs had every declared value refused, each carrying the reason in writing`);

/* ── AND dead === null NOW HAS THREE CAUSES, WHICH IS WHY THE LINE ABOVE MOVED ──
   It used to have two — everything refused, or the instrument never returned — and this
   file could therefore read "dead is null" as "nothing was learned". A third arrived: a
   sweep the budget cut short. That is not "nothing was learned", it is "something was
   learned about part of the range", and the two claims a prefix cannot support are the
   ones now withheld. A truncated sweep may report what MOVED, because movement over a
   prefix is movement; it may not report that nothing moves, because it never reached the
   rest, and it may not report saturation, which is a claim about both ends by
   construction and the high end is exactly the end it did not see. */
const cut = rows.filter(r => r.truncated);
ok('a sweep the budget cut short never says the input is dead and never claims saturation, because a prefix of a declared domain is not the domain. An input whose effect begins late would be called dead by a walk that never got there, and "saturates at the high end" is unknowable from a walk that stopped in the middle — while what DID move over the prefix demonstrably moves, so that half is kept',
  cut.every(r => r.dead !== true) && cut.every(r => !r.saturates)
  && cut.every(r => r.covered === null || (r.covered >= 0 && r.covered <= 1)),
  `${cut.length} truncated sweeps · none called dead · none claiming saturation · coverage recorded on ${cut.filter(r => r.covered !== null).length} of them`
    + (cut.length ? ` · shortest reached ${(Math.min(...cut.map(r => r.covered ?? 1)) * 100).toFixed(1)}% of its declared drive` : ''));

ok('and every slope it publishes says what it was fitted over, so a prefix cannot be read as a full-domain exponent by anything downstream. api/reach.json multiplies these slopes into chains, and a chain built on a prefix claims a scaling everywhere from a measurement taken in part of one place',
  cut.every(r => (r.moves || []).every(m => m.covered !== undefined)),
  `${cut.reduce((n, r) => n + (r.moves || []).length, 0)} slopes from truncated sweeps, each carrying its coverage`);

ok('and an UNRETURNED input is not called dead either, and names the field rather than the laboratory. A declared domain ought to be a domain the instrument can actually be evaluated on; where it is not, the useful half of the finding is WHICH value, and a walk that swept every input in one call would have reported only that the whole laboratory hung',
  rows.filter(r => r.unreturned).every(r => r.dead === null)
  && doc.unreturned.every(u => /\w+\.\w+/.test(u.input) && Number.isFinite(u.min) && Number.isFinite(u.max)),
  doc.counts.unreturned
    ? `${doc.counts.unreturned}: ${doc.unreturned.map(u => `${u.input} over [${u.min} … ${u.max}]`).join(' · ')}`
    : 'none');

ok('and the dead inputs are named in full, because a control a reader is invited to turn and that moves nothing is the finding this artifact exists for, not a detail to be aggregated into a number',
  doc.dead.length === doc.counts.dead
  && doc.dead.every(d => /\w+\.\w+/.test(d.input)),
  `${doc.counts.dead} declared inputs move no declared output anywhere in their own domain: `
  + doc.dead.map(d => d.input).join(' · '));

console.log('\n=== 4. What saturates, and what that does and does not establish ===\n');

ok('an input that SATURATES is reported as saturating and not as numerical, which is the label I set out to produce and the measurement refused. A converged numerical control does flatten at its fine end — but so does a physical quantity whose response simply stops changing, and this walk flagged a grid resolution and a lattice truncation alongside a drive frequency and a slice radius. Saturation is necessary for a converged solver control and nowhere near sufficient for calling one, so the artifact says what it measured rather than what I hoped it meant',
  Array.isArray(doc.saturating)
  && doc.saturating.length === doc.counts.saturating
  && doc.saturating.every(w => /saturates at the (low|high) end/.test(w.signature)),
  doc.counts.saturating
    ? `${doc.counts.saturating} inputs saturate: ` + doc.saturating.map(w => `${w.input} (${w.signature})`).join(' · ')
    : 'none');

/* and the absence is the sharper finding, so it is checked rather than remarked on */
{
  const step = (doc.instruments || []).flatMap(i => (i.rows || [])
    .filter(r => r.input === 'step').map(r => ({ ins: i.id, ...r })));
  const nsStep = step.find(r => r.ins === 'ns');
  ok('and an integration step that does NOT saturate has not converged anywhere in the domain its laboratory declares — a stronger statement than any label, and the reason such a control can move an output two laboratories away in api/reach.json. A declared numerical domain ought to contain the region where refining it stops changing the answer; nothing checks that it does, and atlas.unconverged_solver_domains is where that is written down',
    !!nsStep && nsStep.dead === false && !nsStep.saturates,
    nsStep ? `ns.step moves ${nsStep.responding} declared outputs and saturates at neither end of [${nsStep.min ?? '?'} … ${nsStep.max ?? '?'}]`
      : 'the neutron-star step input is absent');
}

console.log('\n=== 5. Measured from THIS atlas, not an earlier one ===\n');
{
  const v = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'version.json'), 'utf8'));
  ok('the artifact records the build it was measured at, and this refuses it when that disagrees — the walk takes many minutes, CI does not spend them on every commit, and a stale file agrees with physics perfectly well',
    doc.version === v.version && doc.build === v.build,
    doc.version === v.version && doc.build === v.build
      ? `measured at ${doc.version} / ${doc.build}`
      : `the artifact says ${doc.version} / ${doc.build} and the atlas says ${v.version} / ${v.build} — re-run scripts/sensitivity.mjs`);
}

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
