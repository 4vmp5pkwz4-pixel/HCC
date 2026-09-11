#!/usr/bin/env node
'use strict';
/* ══ THE STAR OCEAN, AT ITS REAL TEMPERATURE ════════════════════════════════════
 *
 * Every star in this atlas used to be the same flat slate blue, 0x9db4d8, at one
 * fixed size, across four separate skies. That colour belongs to no star. It was
 * the backdrop to every view in the instrument, which made it the single most
 * looked-at wrong number in the file.
 *
 * The replacement is not a nicer palette. It is Planck's law against the CIE 1931
 * observer, computed at load from h, c and k, with the temperatures drawn from a
 * stated initial mass function. This check exists because a colour chain is very
 * easy to write and very easy to write WRONG in a way nothing complains about —
 * a swapped matrix row, a missing sRGB transfer, a normalisation that quietly
 * turns every star white — and the only defence against that is an authority
 * outside this repository.
 *
 * SO THE NUMBERS BELOW ARE NOT MINE. They are Mitchell Charity's tabulated
 * blackbody sRGB values, computed by someone else from the same physics. Agreeing
 * with them is evidence; agreeing with myself would have been a tautology.
 *
 * The check also holds the three things that are easy to lose later:
 *   · that no table of colours was pasted into the file to drift from the physics;
 *   · that the old flat blue is gone from every sky rather than from one of them;
 *   · and that the per-star size attribute is READ by a shader, because a buffer
 *     attribute nothing consumes is a second authority with no consumer, which is
 *     the defect this file has spent twenty releases removing.
 */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

/* cut the chain out of index.html rather than copying it beside it: a copy would
   pass this check forever while the page rendered something else entirely */
function slice(from, to) {
  const i = src.indexOf(from); if (i < 0) throw new Error('slice not found: ' + from);
  const j = src.indexOf(to, i); if (j < 0) throw new Error('slice end not found: ' + to);
  return src.slice(i, j + to.length);
}
const S = slice('const HCC_CIE_LOBES=Object.freeze({',
  "out[0]=L.r[i]+(L.r[j]-L.r[i])*f; out[1]=L.g[i]+(L.g[j]-L.g[i])*f; out[2]=L.b[i]+(L.b[j]-L.b[i])*f;")
  + '\n  return out;\n}\n'
  + '({hccBlackbodyRGB,hccStarMass,hccStarTemperature,hccStarColour,HCC_IMF,HCC_PDMF,HCC_STAR_LUT,hccPlanck,hccCie})';
const V = vm.runInContext(S, vm.createContext({ Math, Object, Number, Float32Array, Float64Array, console }), { timeout: 20000 });
const rgb = T => V.hccBlackbodyRGB(T).map(v => Math.round(255 * v));

ok('the colour chain this check exercises was cut out of index.html, not copied beside it',
  S.length > 1200 && typeof V.hccBlackbodyRGB === 'function' && typeof V.hccStarMass === 'function',
  `${S.length} characters of the page's own source, executed`);

/* ── 1. against an authority outside this repository ─────────────────────────── */
/* ONE tolerance for the whole table, stated once and not tuned per row. Ten parts
   in 255 is four percent of full scale: far tighter than any error a reader could
   see, far looser than the last bit of a value quoted to three digits. A per-row
   tolerance fitted to whatever the code happened to produce would be a ceiling
   that rose to meet the measurement, which is the one thing a ceiling may not do. */
const TOL = 10;
const PUB = [[1000, [255, 56, 0]], [1500, [255, 109, 0]], [2000, [255, 137, 18]],
  [2500, [255, 159, 70]], [3000, [255, 180, 107]], [4000, [255, 206, 166]],
  [5000, [255, 228, 206]], [5772, [255, 241, 235]], [6500, [255, 249, 253]],
  [8000, [227, 233, 255]], [10000, [202, 215, 255]], [15000, [181, 199, 255]],
  [20000, [170, 191, 255]], [30000, [162, 185, 255]]];
const off = PUB.map(([T, want]) => {
  const got = rgb(T); return { T, got, want, d: Math.max(...got.map((v, i) => Math.abs(v - want[i]))) }; });
const bad = off.filter(o => o.d > TOL);
ok('every temperature lands on the published blackbody sRGB table within one stated tolerance',
  bad.length === 0,
  `${off.length} temperatures from 1000 K to 30000 K, worst Δ ${Math.max(...off.map(o => o.d))}/255 against a ceiling of ${TOL}`
  + (bad.length ? ' · OFF: ' + bad.map(o => `${o.T}K got ${o.got} want ${o.want} by ${o.d}`).join('; ') : ''));

ok('the Sun comes out white, which is the one colour a reader can check without a table',
  rgb(5772)[0] === 255 && rgb(5772)[1] >= 235 && rgb(5772)[2] >= 228,
  `5772 K → ${rgb(5772).join(',')} against the published 255,241,235`);

/* ── 2. the shape of the law, not only its samples ───────────────────────────── */
const ladder = [];
for (let T = 2000; T <= 35000; T += 250) { const c = V.hccBlackbodyRGB(T); ladder.push([T, c[0] / Math.max(c[2], 1e-9)]); }
const reversals = ladder.filter((v, i) => i > 0 && v[1] >= ladder[i - 1][1]);
ok('the ladder blue-shifts monotonically across the whole declared range with no reversal anywhere',
  reversals.length === 0 && ladder[0][1] > 3 && ladder[ladder.length - 1][1] < 1,
  `${ladder.length} steps from 2000 K to 35000 K · red/blue ${ladder[0][1].toFixed(2)} → ${ladder[ladder.length - 1][1].toFixed(3)} · ${reversals.length} reversals`);

ok('Wien is in there: the peak of the computed spectrum tracks 2.898e-3 m K to within a tenth of a percent',
  [3000, 5772, 12000].every(T => {
    let best = 0, arg = 0;
    for (let l = 50; l <= 4000; l += 0.05) { const b = V.hccPlanck(l, T); if (b > best) { best = b; arg = l; } }
    return Math.abs(arg * 1e-9 * T - 2.897771955e-3) / 2.897771955e-3 < 1e-3; }),
  'the displacement law was never coded here; it falls out of the Planck function the colours are computed from');

ok('the colour-matching fits integrate to a y-bar that peaks where the eye does, near 555 nm',
  (() => { let best = 0, arg = 0;
    for (let l = 380; l <= 780; l += 0.1) { const y = V.hccCie(l)[1]; if (y > best) { best = y; arg = l; } }
    return Math.abs(arg - 555) < 8; })(),
  'photopic peak sensitivity is 555 nm by definition of the lumen');

/* ── 3. the population, which is why the sky looks the way it does ───────────── */
const N = 20000, masses = [];
for (let i = 0; i < N; i++) masses.push(V.hccStarMass((i + 0.5) / N));
const rising = masses.every((m, i) => i === 0 || m >= masses[i - 1]);
ok('the mass draw is monotone in its argument and starts at the declared floor, so the same reader gets the same star twice',
  rising && masses[0] >= V.HCC_IMF.mLow - 1e-9 && masses[0] < V.HCC_IMF.mLow * 1.02
  && masses[N - 1] <= V.HCC_IMF.mHigh + 1e-9,
  `${masses[0].toFixed(4)} to ${masses[N - 1].toFixed(2)} M☉ · monotone ${rising} · declared floor ${V.HCC_IMF.mLow}, ceiling ${V.HCC_IMF.mHigh}`);

/* The survival weighting is the whole point of this section: the first version of
   this file drew straight from the IMF, put 3.5% of the sky above 10000 K, and was
   caught by exactly this check. The numbers on the right are the observed census
   of the solar neighbourhood, which is an authority outside this repository. */
const temps = masses.map((_, i) => V.hccStarTemperature((i + 0.5) / N));
const below = t => temps.filter(T => T < t).length / N;
const hot = 1 - below(10000), mDwarf = below(3900);
ok('the drawn sky is the present-day population rather than the one that was born, and the fractions land on the observed census',
  mDwarf > 0.74 && mDwarf < 0.86 && below(V.HCC_IMF.tSun) > 0.94 && hot > 0.0002 && hot < 0.004
  && temps.every(T => T >= V.HCC_IMF.tMin - 1e-9 && T <= V.HCC_IMF.tMax + 1e-9),
  `${(100 * mDwarf).toFixed(1)}% M dwarfs against an observed 76% · ${(100 * below(V.HCC_IMF.tSun)).toFixed(1)}% cooler than the Sun · 1 in ${Math.round(1 / hot)} above 10000 K against an observed 1 in 800`);

ok('the survival factor is what pulls the hot tail down, and removing it demonstrably breaks the census',
  (() => { const K = V.HCC_IMF, e = V.HCC_PDMF.edge, n = V.HCC_PDMF.N;
    let tot = 0; const w = new Float64Array(n);          // the same table WITHOUT min(1, tau/T)
    for (let i = 0; i < n; i++) { const m = Math.sqrt(e[i] * e[i + 1]);
      const al = m < K.mBreak ? K.aLow : K.aHigh, c = m < K.mBreak ? 1 : Math.pow(K.mBreak, K.aHigh - K.aLow);
      w[i] = c * Math.pow(m, -al) * (e[i + 1] - e[i]); tot += w[i]; }
    let raw = 0;
    for (let i = 0; i < n; i++) { const m = Math.sqrt(e[i] * e[i + 1]);
      if (K.tSun * Math.pow(m, K.tExp) > 10000) raw += w[i] / tot; }
    return raw > 8 * hot; })(),
  'the initial mass function alone puts an order of magnitude too many hot stars in the sky; the disc\'s age is what removes them');

ok('the lifetime law and the disc age are named in the frozen record, so the correction can be argued with rather than guessed at',
  V.HCC_IMF.tauSunGyr === 10 && V.HCC_IMF.tauExp === 2.5 && V.HCC_IMF.discGyr === 10 && V.HCC_IMF.bins >= 256,
  `τ(M) = ${V.HCC_IMF.tauSunGyr} Gyr · (M/M☉)^-${V.HCC_IMF.tauExp} over a ${V.HCC_IMF.discGyr} Gyr disc, inverted on ${V.HCC_IMF.bins} logarithmic bins`);

ok('the mass function names its source in the frozen record rather than in a comment a reader has to go find',
  /Kroupa/.test(V.HCC_IMF.source) && /main sequence/i.test(V.HCC_IMF.source)
  && /lifetime/i.test(V.HCC_IMF.source) && V.HCC_IMF.source.length > 40,
  V.HCC_IMF.source);

/* ── 4. the grid that makes two hundred thousand stars affordable ────────────── */
let worst = 0, worstT = 0;
for (let i = 0; i < 2000; i++) {
  const T = V.HCC_IMF.tMin * Math.pow(V.HCC_IMF.tMax / V.HCC_IMF.tMin, (i + 0.5) / 2000);
  const a = V.hccBlackbodyRGB(T), b = V.hccStarColour(T, [0, 0, 0]);
  const d = Math.max(...a.map((v, k) => Math.abs(v - b[k]) * 255));
  if (d > worst) { worst = d; worstT = T; }
}
ok('the interpolated grid agrees with the spectrum it was built from to well inside one step of an eight-bit channel',
  worst < 1 && V.HCC_STAR_LUT.N >= 256,
  `${V.HCC_STAR_LUT.N} logarithmic bins over ${V.HCC_IMF.tMin}-${V.HCC_IMF.tMax} K · worst Δ ${worst.toFixed(3)}/255 at ${Math.round(worstT)} K`);

ok('the grid clamps rather than running off its ends, so a temperature outside the declared range still returns a colour',
  (() => { const lo = V.hccStarColour(1, [0, 0, 0]), hi = V.hccStarColour(1e9, [0, 0, 0]);
    const a = V.hccStarColour(V.HCC_IMF.tMin, [0, 0, 0]), b = V.hccStarColour(V.HCC_IMF.tMax, [0, 0, 0]);
    return lo.every((v, i) => Math.abs(v - a[i]) < 1e-6) && hi.every((v, i) => Math.abs(v - b[i]) < 1e-6)
      && lo.every(v => v >= 0 && v <= 1); })(),
  'a clamp at a declared edge is a stated refusal to extrapolate, not a silent one');

ok('the grid is built by running the law, not by pasting its answers, so it cannot drift from the physics',
  /const HCC_STAR_LUT=\(\(\)=>\{/.test(src) && /c=hccBlackbodyRGB\(T\)/.test(src)
  && /hccStarColour\(T, tmpCol\); col\.set\(tmpCol, i\*3\)/.test(src),
  'the only numbers in the table came out of hccBlackbodyRGB at load');

/* ── 4. what the page actually draws ─────────────────────────────────────────── */
ok('no table of star colours was pasted into the page to drift away from the physics',
  !/const\s+\w*STAR_?COLou?RS?\s*=/i.test(src),
  'the only authority for a star colour is hccBlackbodyRGB, computed at load from h, c and k');

/* The first version of this check demanded that 0x9db4d8 appear nowhere at all, and
   went red against correct code: the one surviving mention is the comment that
   RECORDS what was replaced, which is the opposite of the defect. A check that
   flags the record of a fix is worse than no check, so it now asks the question it
   meant to ask — that no material is built from that colour. */
const blue = [...src.matchAll(/0x9db4d8/g)].map(m => src.slice(Math.max(0, m.index - 60), m.index));
ok('the old flat blue survives only in the comment that records it, and no material is built from it any more',
  blue.length === 1 && /Every star in this atlas was one flat slate blue/.test(src)
  && !/(color|Color)\s*:\s*0x9db4d8/.test(src) && !/new THREE\.Color\(0x9db4d8/.test(src),
  `${blue.length} mention, zero constructors`);

const fields = [...src.matchAll(/\.add\(starfield\((\d+),\s*[^)]*\)\)/g)].map(m => Number(m[1]));
ok('every sky in the instrument is built by the one constructor, so none can be left behind at the old colour',
  fields.length >= 4 && fields.every(n => n > 0),
  `${fields.length} skies · ${fields.reduce((a, b) => a + b, 0)} stars · ${fields.join(' + ')}`);

ok('the per-star size attribute is read by a shader rather than written and ignored',
  /setAttribute\('aSize'/.test(src) && /attribute float aSize;/.test(src)
  && /gl_PointSize = size \* aSize/.test(src) && /starMaterialPatch\(new THREE\.PointsMaterial/.test(src),
  'a buffer attribute no shader consumes is a second authority with no consumer');

ok('scintillation is driven by the main loop and switched off when the reader has asked for reduced motion',
  /HCC_STAR_UNIFORMS\.uTime\.value\+=dt;/.test(src)
  && /HCC_STAR_UNIFORMS\.uTwinkle\.value=\(typeof PREFERS_REDUCED_MOTION[^;]*\?0:/.test(src),
  'twinkle is atmospheric, so it is declared as a viewing effect, bounded, and refusable');

ok('the sky is the same sky on every reload, because the draw is seeded rather than left to Math.random',
  /const rng = mulberry\(0x5741 \^ \(n\*2654435761 >>> 0\)\)/.test(src)
  && !/randomDirection\(\)\.multiplyScalar\(radius\*\(0\.7\+0\.3\*Math\.random\(\)\)\)/.test(src),
  'a backdrop that reshuffles itself every reload cannot be compared against a screenshot or against itself');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
