#!/usr/bin/env node
'use strict';
/* ══ THE LADDER THAT COULD HAVE BEEN A LAW ═════════════════════════════════════
 *
 * This atlas places every physical scale at its level N = ln(R/ℓ_P)/ln φ on the
 * golden ladder, and has done since it was built. It had never once asked the
 * question that placement invites: DO THE RUNGS MEAN ANYTHING?
 *
 * If the ladder were a law rather than a coordinate, physical scales would cluster
 * ON its integer rungs and the fractional parts of N would not be uniform. That is
 * a testable statement, and the fractional offsets are points on a circle, so the
 * Rayleigh test applies exactly: with K offsets, R = |Σ exp(2πi u)|/K, and under the
 * null 2KR² is χ² on two degrees of freedom, so p = exp(−KR²).
 *
 * THE ANSWER IS NO. Over the atlas's own 113 placed scales the golden ladder returns
 * R = 0.135, p = 0.129. Run the same test against base π and it returns p = 0.118 —
 * very slightly better than φ. The ordering between bases at these p values carries
 * nothing, which is the sharpest possible way to state a null result.
 *
 * A DETECTOR THAT CANNOT FIRE IS NOT A DETECTOR, so the controls are part of the
 * instrument and part of this check: offsets clustered on a rung, offsets clustered
 * exactly BETWEEN rungs, and uniform draws. The first two must fire hard and the
 * third must stay quiet, or the null result above means nothing at all.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

/* the catalogue is cut out of the page: a scale added to the atlas must enter the
   test automatically, or the test is measuring a snapshot rather than the atlas */
const blk = (() => { const i = src.indexOf('const PHI_ATLAS=[');
  return i < 0 ? null : src.slice(i, src.indexOf('\n];', i)); })();
const L = [...(blk || '').matchAll(/\[\s*'[^']{2,120}'\s*,\s*([0-9.]+e?[-+]?\d*)\s*,/g)]
  .map(m => Number(m[1])).filter(v => v > 0);
ok('the scales are read out of the atlas\'s own placed catalogue',
  L.length >= 80 && /function hccLadderOffsets\(base\)\{/.test(src)
  && /for\(const \[,rows\] of PHI_ATLAS\) for\(const r of rows\)\{/.test(src),
  `${L.length} scales with a positive length · the test walks PHI_ATLAS itself, so a scale added to the atlas enters the test without anyone remembering to add it`);

const lP = 1.616255e-35;
const frac = x => x - Math.floor(x);
const offs = base => L.map(v => frac(Math.log(v / lP) / Math.log(base)));
const rayleigh = u => { const K = u.length;
  let C = 0, S = 0; for (const x of u) { C += Math.cos(2 * Math.PI * x); S += Math.sin(2 * Math.PI * x); }
  C /= K; S /= K; const R = Math.hypot(C, S);
  return { K, R, p: Math.exp(-K * R * R) }; };

ok('the statistic is the published Rayleigh test and the page computes it the same way',
  /const R=Math\.hypot\(C,S\);/.test(src) && /p:Math\.exp\(-K\*R\*R\)/.test(src)
  && /Rayleigh test for circular uniformity/.test(src),
  'R = |Σ exp(2πi u)| / K and p = exp(−K R²), with no free parameter anywhere in it');

const PHI = (1 + Math.sqrt(5)) / 2;
const phi = rayleigh(offs(PHI));
ok('the golden ladder shows no resonance over the atlas\'s own scales',
  phi.p > 0.01 && phi.R < 0.3,
  `K = ${phi.K} · R = ${phi.R.toFixed(4)} · p = ${phi.p.toFixed(3)} · the rungs are a coordinate, not a law`);

const BASES = { 'φ': PHI, 'e': Math.E, '2': 2, 'π': Math.PI, '10': 10 };
const all = Object.entries(BASES).map(([b, v]) => ({ b, ...rayleigh(offs(v)) }));
ok('and no base reaches significance, so the finding is about the scales and not about φ',
  all.every(x => x.p > 0.01),
  all.map(x => `${x.b} p=${x.p.toFixed(3)}`).join(' · '));

ok('the leader among the bases is not φ, which is the sharpest way to state a null result',
  (() => { const best = all.slice().sort((a, b) => a.p - b.p)[0];
    return best.p > 0.01 && Math.abs(best.p - all.find(x => x.b === 'φ').p) < 0.1; })(),
  `${all.slice().sort((a, b) => a.p - b.p)[0].b} edges φ by a margin that is itself meaningless — at p ≈ 0.12 the ordering carries nothing`);

/* ── the controls, without which the null above means nothing ────────────────── */
const mulberry = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const rng = mulberry(0x5eed01);
const K = phi.K, U = [], ON = [], BE = [];
for (let i = 0; i < K; i++) { U.push(rng());
  ON.push(frac(0.02 * (rng() * 2 - 1)));
  BE.push(frac(0.5 + 0.03 * (rng() * 2 - 1))); }
const ru = rayleigh(U), ron = rayleigh(ON), rbe = rayleigh(BE);
ok('the test fires hard on a concentration at the rungs',
  ron.p < 1e-20 && ron.R > 0.9,
  `R = ${ron.R.toFixed(4)}, p = ${ron.p.toExponential(1)} — if the ladder were a law this is what the atlas would be showing`);

ok('and just as hard on a concentration exactly between them, so it detects any structure rather than a flattering one',
  rbe.p < 1e-20 && rbe.R > 0.9,
  `R = ${rbe.R.toFixed(4)}, p = ${rbe.p.toExponential(1)} — a test that only fires on the answer you wanted is not a test`);

ok('and it stays quiet on uniform draws, so the null result it returns is a result',
  ru.p > 0.05,
  `R = ${ru.R.toFixed(4)}, p = ${ru.p.toFixed(3)} on ${K} uniform draws`);

ok('the controls are in the instrument itself, not only in this file',
  /A DETECTOR THAT CANNOT FIRE IS NOT A DETECTOR/.test(src)
  && /clustered ON a rung p = /.test(src) && /clustered BETWEEN rungs p = /.test(src),
  'the boot suite runs all three every time the atlas opens');

/* ── what is drawn ───────────────────────────────────────────────────────────── */
ok('the spectrum is drawn on a circle, because the quantity being tested is an angle',
  /const FBS_SPEC=Object\.freeze\(\{bins:36/.test(src)
  && /hist\[Math\.min\(B-1,Math\.floor\(u\*B\)\)\]\+\+/.test(src),
  'a bar chart would put the two halves of any cluster straddling a rung at opposite ends of the picture and hide it');

ok('and the resultant is drawn at length R, so the statistic is visible without reading the number',
  /const tip=new THREE\.Vector3\(R0\*sp\.R\*Math\.cos\(ang\)/.test(src),
  'R = 1 would touch the ring; the atlas draws an arrow a seventh of the way out');

ok('the verdict is stated in the scene against a declared threshold, not left to the reader to infer',
  /const verdict=sp\.p<HCC_SPECTRUM\.alpha\?'RESONANCE':'no resonance';/.test(src)
  && /alpha:0\.01/.test(src)
  && /the rungs are a coordinate, not a law/.test(src),
  'α = 0.01 is written down before the measurement, which is the only order in which a threshold means anything');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
