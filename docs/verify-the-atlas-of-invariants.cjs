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

/* 3a · THROUGH A MIDDLE LABORATORY: a Jeans mass into the black-hole laboratory, its Hawking
   temperature into Planck's — the cloud's mass fixes the wavelength at which its hole would glow
   brightest. The factor is recomputed from CODATA and Wien's b: λ_max / M = b · 8πG k_B / (ħc³) */
const WIEN_B = 2.897771955e-3;
const ch = (J.through_a_middle_laboratory || []).find(x => x.chain.join('|') === 'jeans.jeans_mass→bht.M|bht.T_H→bb.T');
const al = ch && (ch.aliases || []).find(a => a.name === 'bb.lambda_max' && a.of === 'jeans.jeans_mass');
const wienHawking = WIEN_B * 8 * Math.PI * G * kB / (hbar * c ** 3);
ok('through a middle laboratory: Jeans → Hawking → Planck makes the cloud\'s mass fix its hole\'s Wien peak, λ_max = (b·8πG k_B/ħc³)·M — found by the census, recomputed here',
  al && Math.abs(al.factor / wienHawking - 1) < 1e-5 && J.counts.chains_with_laws === (J.through_a_middle_laboratory || []).filter(x => x.verdict === 'FOUND').length,
  al ? `${al.factor.toExponential(6)} m/kg against ${wienHawking.toExponential(6)} · ${J.counts.chains_with_laws}/${J.counts.chains_asked} two-link chains carry a law` : 'not found');

/* 3b · the symmetries: named, applied at random points by the page, recorded — and applied once
   more here, to the Jeans kernel itself */
const js = (lab('jeans').symmetries || []).find(x => x.verified && !x.dead);
const jk = js && Object.fromEntries(js.inputs.map((n, i) => [n, js.k[i] / js.k[0]]));
(async () => {
  const K = await import(path.join(ROOT, 'core', 'atlas', 'extracted.mjs'));
  const again = jk && [3, 0.25].every(lam => { const T = 40, n = 1e8, mu = 2.33, s = x => Math.pow(lam, x);
    return Math.abs(K.jeansMass(T * s(jk.temperature), n * s(jk.number_density), mu * s(jk.mean_molecular_weight)) / K.jeansMass(T, n, mu) - 1) < 1e-12; });
  const nSym = J.laboratories.reduce((a, r) => a + (r.symmetries || []).filter(x => x.verified && !x.dead).length, 0);
  ok('the census names the Jeans symmetry (T, n, μ) → (λT, λ⁻¹n, λμ), confirmed by the page and confirmed again here on the kernel; its symmetry count is its rows\'',
    jk && jk.temperature === 1 && jk.number_density === -1 && jk.mean_molecular_weight === 1 && again && J.counts.scaling_symmetries === nSym,
    `${J.counts.scaling_symmetries} scaling symmetries across the atlas · ${J.counts.dead_inputs} dead inputs named as such`);

  /* 3c · ONE LAW, MANY LABORATORIES: the census relations in Planck units, grouped by the
     combination of G, c, ħ, k_B their constants carry. The horizon law r·T ∝ ħc/k_B must appear
     for BOTH kinds of horizon, with the numbers recomputed here from their definitions:
     Schwarzschild r = 2GM/c², T = ħc³/(8πGMk_B) → r·T = ħc/(4πk_B);
     de Sitter r = c/H, T = ħH/(2πk_B) → r·T = ħc/(2πk_B). And the free-fall law t²ρG appears in
     several laboratories, each with its own convention. */
  const unitOf = lab => n => { const i = MAN.instruments.find(x => x.id === lab); const o = i && i.outputs.find(o => o.name === n); return o && o.unit; };
  const groups = {};
  for (const L of J.laboratories) for (const p of ((L.across || {}).products || [])) if (p.exact) { const P = K.invPlanck(p.terms, p.exponents, p.value, unitOf(L.id), 1e-10); if (P && !P.why && !P.dimensionless) (groups[P.units] = groups[P.units] || []).push({ lab: L.id, P, p }); }
  const hor = groups['c ħ k_B⁻¹'] || [];
  const bh = hor.find(x => x.lab === 'bht'), ds = hor.find(x => x.lab === 'lam');
  const ff = groups['G⁻¹'] || [], ffLabs = [...new Set(ff.map(x => x.lab))];
  const pureOK = (x, v) => x && Math.abs(Math.abs(x.P.pure) - v) < 1e-7 * v;
  ok('one law, many laboratories: the horizon law r·T = ħc/k_B × {1/4π for a black hole, 1/2π for de Sitter} is found in both, recomputed from their definitions; the free-fall law t²ρG in ' + ffLabs.length + ' laboratories',
    pureOK(bh, 1 / (4 * Math.PI)) && pureOK(ds, 1 / (2 * Math.PI)) && ffLabs.length >= 3 && /function invUniversality\(A\)\{/.test(SRC),
    `black hole ${bh ? (bh.P.form || bh.P.pure) : '—'} · de Sitter ${ds ? (ds.P.form || ds.P.pure) : '—'} · free fall in ${ffLabs.join(', ')}: ${ff.filter(x => x.P.form).slice(0, 4).map(x => x.P.form).join(', ')}`);
  /* 3d · the discoveries as a journey: numbers read live from this census, Wien's root named */
  const disc = /async function hccDiscoveriesOpen\(\)\{/.test(SRC) && /add\('What the atlas found by itself',/.test(SRC) && /\['✦','What the atlas found by itself',/.test(SRC)
    && /const U=invUniversality\(A\), fam=u=>U\.find\(g=>g\.units===u\);/.test(SRC);
  const wien = K.invClosedForm(16 * Math.PI ** 2 / 4.965114231744276) === '16π²/x_W' && K.invClosedForm(2 * Math.PI / 4.965114231744276) === '2π/x_W';
  /* named to 1e-9: the laboratory's Wien constant b is CODATA's, given to ten digits, so the exact root agrees to 5e-10 */
  const alW = al && K.invPlanck(['l', 'M'], [1, -1], al.factor, n => ({ l: 'm', M: 'kg' })[n], 1e-9);
  ok('the discoveries are a journey whose numbers come from this census, and Wien\'s root x_W = 5(1−e^{−x_W}) is named: the cloud-to-colour law is λ_max = (16π²/x_W)·(G/c²)·M',
    disc && wien && alW && alW.form === '16π²/x_W' && alW.units === 'G c⁻²', alW ? `${alW.form} · ${alW.units}` : 'not named');
  finish();
})();
function finish(){
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
}
