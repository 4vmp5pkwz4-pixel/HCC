#!/usr/bin/env node
'use strict';
/* ══ THE ATLAS OF INVARIANTS ══════════════════════════════════════════════════════
 * api/invariants.json is the census scripts/invariants.mjs records by running the page's
 * own invariant finder on every laboratory, and on every declared link of the quantity
 * bus. This file reads it and checks that it is a census and not a brochure:
 *   1. its counts are the counts of its own rows, and every laboratory was asked
 *   2. the laws it reports inside laboratories are the ones physics knows, named: the
 *      Jeans M = (π/6)ρλ³, the Clifford torus's 2π², the photon sphere's 3√3/2, Wien times
 *      Stefan–Boltzmann as one relation, and two quantities conserved along the rigid
 *      body's clock
 *   3. ACROSS THE BUS it found what no single laboratory states, and the constant is
 *      recomputed here from CODATA: a Jeans mass carried into the black-hole laboratory
 *      keeps M·T_H = ħc³/(8πG k_B), Hawking's law with the cloud's mass in it; a disk's peak
 *      temperature carried into the equation of state keeps T⁴/P_rad = 3c/(4σ)
 *   4. the page shows it: a dialog reads the file, the palette and the navigator reach it,
 *      the build tracks its release like every other measurement
 *   5. MUTATIONS: a count that does not match its rows, and a cross-bus constant altered by
 *      one part in a thousand, are each caught
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const J = JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'invariants.json'), 'utf8'));
const MAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'manifest.json'), 'utf8'));
const lab = id => J.laboratories.find(r => r.id === id) || {};

/* 1 · a census */
const countsOf = j => { const L = j.laboratories, v = k => L.filter(r => r.across && r.across.verdict === k).length;
  return { laboratories: L.length, found: v('FOUND'), none: v('NONE'), thin: v('THIN'), unreturned: v('UNRETURNED'), hidden_symmetries: L.filter(r => r.across && r.across.hidden_symmetries).length }; };
const agree = j => { const c = countsOf(j); return Object.entries(c).every(([k, v]) => j.counts[k] === v); };
ok('the census counts are the counts of its own rows, and every instrument of the manifest was asked',
  J.schema === 'hcc.invariants/1' && agree(J) && J.laboratories.length === MAN.instruments.length,
  `${J.counts.laboratories} laboratories · ${J.counts.found} keep something · ${J.counts.exact_relations} exact relations · ${J.counts.named_constants} named · ${J.counts.hidden_symmetries} hidden symmetries · ${J.counts.conserved_along_a_clock} conserve along a clock · ${J.counts.links_with_cross_laws}/${J.counts.links_asked} bus links carry a law`);

/* 2 · inside laboratories */
const prod = (id, terms, exps, form) => (lab(id).across && lab(id).across.products || []).some(p => { const m = {}; p.terms.forEach((t, i) => m[t] = p.exponents[i]); const s = Math.sign(m[terms[0]] / exps[0]);
  return p.terms.length === terms.length && terms.every((t, i) => m[t] === s * exps[i]) && (!form || p.form === form || s < 0); });
const constant = (id, name, form) => (lab(id).across && lab(id).across.constants || []).some(c => c.name === name && c.form === form);
const sum = (id, value, tol) => (lab(id).across && lab(id).across.sums || []).some(r => r.exact && Math.abs(r.value - value) < tol);
const checks = {
  'Jeans M = (π/6)ρλ³': prod('jeans', ['jeans_mass', 'jeans_length', 'density'], [-1, 3, 1], '6/π'),
  'Jeans conventions √(3375/π⁶)': constant('jeans', 'convention_ratio', '√(3375/π⁶)'),
  'Clifford torus 2π²': constant('wil', 'clifford', '2π²') && sum('wil', 2 * Math.PI ** 2, 1e-6),
  'photon sphere 3√3/2': constant('lens', 'b_crit', '3√3/2'),
  'Wien × Stefan–Boltzmann': prod('bb', ['lambda_max', 'exitance'], [4, 1]),
  'rigid body conserves two quadratics along t': ((lab('poin').along || {}).sums || []).filter(r => r.exact).length >= 2 };
const missing = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
ok('inside laboratories it reports what physics knows, and names it', missing.length === 0, missing.length ? 'missing: ' + missing.join(', ') : Object.keys(checks).join(' · '));

/* 3 · across the bus, the constant recomputed from CODATA */
const hbar = 1.054571817e-34, c = 299792458, G = 6.6743e-11, kB = 1.380649e-23, sigma = 5.670374419e-8;
const link = (a, b) => (J.across_the_bus || []).find(x => x.from === a && x.to === b) || {};
const MT = (link('jeans.jeans_mass', 'bht.M').products || []).find(p => p.terms.length === 2 && p.terms.includes('jeans.jeans_mass') && p.terms.includes('bht.T_H'));
const hawking = hbar * c ** 3 / (8 * Math.PI * G * kB);
const mtVal = MT ? Math.pow(MT.value, 1 / MT.exponents[MT.terms.indexOf('jeans.jeans_mass')]) : NaN;   /* normalise to M^1 T^1 */
ok('across the bus: a Jeans mass carried into the black-hole laboratory keeps M·T_H = ħc³/(8πG k_B) — Hawking\'s law, found, not typed',
  MT && Math.abs(MT.exponents[0]) === 1 && Math.abs(MT.exponents[1]) === 1 && Math.abs(mtVal / hawking - 1) < 1e-4, MT ? `${mtVal.toExponential(6)} K·kg against ħc³/(8πG k_B) = ${hawking.toExponential(6)}` : 'not found');
const TP = (link('adisk.peak_temperature', 'eos.temperature').products || []).find(p => p.terms.includes('adisk.peak_temperature') && p.terms.includes('eos.pressure_radiation'));
ok('and a disk\'s peak temperature carried into the equation of state keeps T⁴/P_rad = 3c/(4σ), named', TP && TP.form === '3/4 · c σ_SB⁻¹' && Math.abs(TP.value / (3 * c / (4 * sigma)) - 1) < 1e-6,
  TP ? `${TP.value.toExponential(6)} = ${TP.form}` : 'not found');

/* 4 · the page */
const page = /async function hccInvariantAtlasOpen\(filter\)\{/.test(SRC) && /fetch\('api\/invariants\.json',\{cache:'no-store'\}\)/.test(SRC) && /add\('Atlas of invariants',/.test(SRC) && /\['∮','Atlas of invariants',/.test(SRC)
  && /const measurementKinds=\['sensitivity','transfers','reach','liveness','invariants'\];/.test(fs.readFileSync(path.join(ROOT, 'scripts', 'build-api.mjs'), 'utf8'));
ok('the page reads it, the palette and the navigator reach it, and the build tracks its release', page);

/* 5 · mutations */
const bad = JSON.parse(JSON.stringify(J)); bad.counts.found += 1;
ok('MUTATION — a count that does not match its rows is caught', !agree(bad));
const mtBad = mtVal * 1.001;
ok('MUTATION — a cross-bus constant altered by one part in a thousand is caught', !(Math.abs(mtBad / hawking - 1) < 1e-4));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
