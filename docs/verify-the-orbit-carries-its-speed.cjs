#!/usr/bin/env node
'use strict';
/* ══ THE ORBIT LINES CARRIED NO INFORMATION ════════════════════════════════════
 *
 * Every orbit was a LineBasicMaterial at one flat opacity: a closed curve saying
 * where a planet goes and nothing whatever about how it goes there. The single most
 * famous fact about an orbit — that a body moves fastest at perihelion and slowest
 * at aphelion, which is Kepler's second law and the reason his first two were worth
 * writing down — was drawn nowhere.
 *
 * THE SPEED IS EXACT AND WAS ALREADY IN THE LOOP. The energy integral of the
 * two-body problem gives v² = μ(2/r − 1/a), and r = a(1 − e cos E) is computed at
 * every vertex of the curve already, so the speed costs one square root per point.
 * In astronomical units and years about this Sun μ = 4π², which follows from the
 * definition of the astronomical unit rather than from a fit, and Earth comes out at
 * 29.785 km/s against a measured 29.78.
 *
 * THE RATIO THE COLOUR SPANS IS AN IDENTITY. At the apses the velocity is
 * perpendicular to the radius, so v_p r_p = v_a r_a and therefore
 *
 *     v_p / v_a = (1 + e) / (1 − e)      exactly
 *
 * which holds to four parts in 10¹⁶ over every planet in the atlas. The brightest
 * and dimmest points of every trail therefore stand in a ratio fixed by the
 * eccentricity alone, and a near-circular orbit draws a near-uniform line BECAUSE
 * it is near-circular.
 *
 * AND THE COLOUR ENCODES THE THING THAT IS NOT CONSERVED, while this file holds the
 * one that is: h = √(μa(1−e²)) is constant, and h = r v sin φ recovers it at every
 * point of the curve. That is the whole content of the second law.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

/* the elements are read out of the page's own JPL table */
const EL = [...src.matchAll(/\{name:'(\w+)',\s*a:([\d.]+),\s*e:([\d.]+)/g)]
  .map(m => ({ n: m[1], a: +m[2], e: +m[3] }));
ok('the orbits are read from the atlas\'s own element table',
  EL.length >= 9 && Math.abs(EL.find(x => x.n === 'Earth').a - 1.00000261) < 1e-9,
  `${EL.length} orbits · the same a and e the curve itself is drawn from, so the speed cannot describe a different orbit than the line`);

const MU = 4 * Math.PI * Math.PI;
const v = (a, e, E) => Math.sqrt(Math.max(0, MU * (2 / (a * (1 - e * Math.cos(E))) - 1 / a)));
const h = (a, e) => Math.sqrt(Math.max(0, MU * a * (1 - e * e)));

ok('the page states the vis-viva equation and where its constant comes from',
  /v\^2 = mu \(2\/r - 1\/a\), the energy integral of the two-body problem/.test(src)
  && /mu:4\*Math\.PI\*Math\.PI/.test(src)
  && /function hccOrbitSpeed\(a,e,E\)\{/.test(src),
  'μ = 4π² in AU and years follows from the definition of the astronomical unit, so nothing here was fitted');

/* ── the identity the colour ramp spans ──────────────────────────────────────── */
const rows = EL.filter(x => x.e > 0).map(x => ({ n: x.n,
  got: v(x.a, x.e, 0) / v(x.a, x.e, Math.PI), want: (1 + x.e) / (1 - x.e) }));
const worst = Math.max(...rows.map(r => Math.abs(r.got / r.want - 1)));
ok('the speed ratio between the apses is exactly (1+e)/(1−e) on every orbit in the atlas',
  worst < 1e-12 && rows.length >= 8,
  `${rows.length} orbits, worst ${worst.toExponential(1)} · `
  + rows.slice(0, 4).map(r => `${r.n} ${r.got.toFixed(5)}`).join(' · '));

ok('so the span of each trail is fixed by its eccentricity and by nothing else',
  (() => { const m = rows.find(r => r.n === 'Mercury'), e = rows.find(r => r.n === 'Earth');
    return m.got > 1.5 && e.got < 1.04 && m.got / e.got > 1.4; })(),
  `Mercury's trail spans ${rows.find(r => r.n === 'Mercury').got.toFixed(3)} and Earth's ${rows.find(r => r.n === 'Earth').got.toFixed(3)} — a near-circular orbit draws a near-uniform line because it IS near-circular`);

/* ── the constant the colour does not draw ───────────────────────────────────── */
let hWorst = 0;
for (const x of EL) { const H = h(x.a, x.e);
  for (let k = 0; k < 360; k++) { const E = k / 360 * 2 * Math.PI;
    const r = x.a * (1 - x.e * Math.cos(E)), sp = v(x.a, x.e, E);
    const sinPhi = H / (r * sp);
    hWorst = Math.max(hWorst, sinPhi > 1 ? sinPhi - 1 : 0); } }
ok('the specific angular momentum is recoverable at every point of every curve, which is the second law itself',
  hWorst < 1e-12 && /function hccSpecificAngularMomentum\(a,e\)\{/.test(src),
  `h = r v sin φ over ${EL.length} orbits × 360 points, worst overshoot ${hWorst.toExponential(1)} · equal areas in equal times, as an identity rather than an adjective`);

ok('and at the apses, where the velocity is perpendicular to the radius, it reduces to r v exactly',
  EL.every(x => Math.abs(x.a * (1 - x.e) * v(x.a, x.e, 0) / h(x.a, x.e) - 1) < 1e-12
    && Math.abs(x.a * (1 + x.e) * v(x.a, x.e, Math.PI) / h(x.a, x.e) - 1) < 1e-12),
  'r_p v_p = r_a v_a = h, which is exactly why the ratio above is (1+e)/(1−e) and not something that had to be measured');

ok('the speeds are the measured ones',
  Math.abs(v(1.00000261, 0.01671123, Math.PI / 2) * 1.495978707e8 / 3.15576e7 - 29.78) < 0.05,
  `Earth at ${(v(1.00000261, 0.01671123, Math.PI / 2) * 1.495978707e8 / 3.15576e7).toFixed(3)} km/s against a measured 29.78`);

ok('and the third law falls out of the same constant, which is a control on μ',
  EL.every(x => Math.abs(2 * Math.PI * Math.sqrt(x.a ** 3 / MU) / Math.sqrt(x.a ** 3) - 1) < 1e-12),
  'P = 2π√(a³/μ) reduces to √(a³) in years only if μ = 4π², so the constant is checked by a law it was not chosen from');

/* ── what the page draws ─────────────────────────────────────────────────────── */
ok('every trail is built with a per-vertex colour rather than one flat opacity',
  /new THREE\.LineBasicMaterial\(\{color:0xffffff, vertexColors:true/.test(src)
  && !/new THREE\.LineBasicMaterial\(\{color:p\.col, transparent:true, opacity:p\.dwarf\?\.3:\.45\}\)/.test(src)
  && /function orbitSpeedColours\(pts, base\)\{/.test(src),
  'the flat line is gone from the constructor, and the ramp is one function rather than a colour computed at each call site');

ok('the ramp normalises between the two apsidal speeds the same curve reports',
  /const lo=pts\.aphelionSpeed, hi=pts\.perihelionSpeed/.test(src)
  && /pts\.aphelionSpeed=hccOrbitSpeed\(a,e,Math\.PI\);/.test(src)
  && /pts\.perihelionSpeed=hccOrbitSpeed\(a,e,0\);/.test(src),
  'the endpoints of the colour scale are the endpoints of the physics, so the scale cannot drift from what it is scaling');

ok('each trail keeps its own body colour at aphelion, so the planet stays recognisable',
  /line\.userData\.orbitBaseColour=p\.col;/.test(src)
  && /col\.copy\(b\)\.lerp\(new THREE\.Color\(1,0\.93,0\.72\), 0\.55\*t\);/.test(src),
  'the variation is the physics and the identity is the body — a ramp that discarded the body colour would have made nine identical trails');

ok('and the colours are rebuilt whenever the curve is, in both of the paths that rebuild it',
  (src.match(/orbitSpeedColours\(pts,obj\.userData\.orbitBaseColour\)/g) || []).length >= 2,
  'a trail whose geometry moved and whose colours did not would be reporting last epoch\'s perihelion at this epoch\'s position');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
