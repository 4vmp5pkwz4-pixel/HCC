#!/usr/bin/env node
'use strict';
/* ══ THE POST PASS THAT WAS NOT A CAMERA ═══════════════════════════════════════
 *
 * Bloom, SMAA and a tone map, and then the image went to the screen as though it
 * had been captured by nothing at all. Every real instrument that has recorded this
 * sky put three things into the picture, and all three are laws rather than looks.
 *
 * NATURAL VIGNETTING IS EXACTLY cos⁴θ, and the exponent is derived rather than
 * dialled: one cosine from the foreshortened aperture, one from the foreshortened
 * sensor element, and two from the inverse square of the longer oblique path. At a
 * 55° vertical field the corner sits where the aspect puts it, and the law follows:
 *
 *     16:9  corner 46.7°  cos⁴ = 0.221
 *     4:3   corner 40.9°  cos⁴ = 0.326
 *     21:9  corner 52.9°  cos⁴ = 0.133
 *     1:1   corner 36.4°  cos⁴ = 0.421
 *
 * So the field angle is taken from the projection matrix, not from the screen
 * radius, and one shader is right at every aspect instead of at the one it was
 * written on.
 *
 * GRAIN IS PHOTON SHOT NOISE, WHICH PUTS IT IN THE SHADOWS. Arrivals are Poisson,
 * σ = √N, so absolute grain grows as √L while grain relative to the signal falls as
 * 1/√L. A uniform overlay of noise — which is what almost every film-grain shader
 * does — has that exactly backwards and looks like dirt on the glass.
 *
 * LATERAL COLOUR IS ZERO ON AXIS AND LINEAR IN FIELD HEIGHT, because a lens focuses
 * short wavelengths at a different magnification from long ones. A constant RGB
 * offset across the whole frame, the other thing almost every shader does, is not
 * aberration at all.
 *
 * None of it touches a measurement: it is the display buffer after tone mapping.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

const rec = (() => { const i = src.indexOf('const HCC_OPTICS=Object.freeze({');
  return i < 0 ? null : src.slice(i, src.indexOf('});', i) + 3); })();
ok('the three laws are one frozen record, and it names its sources',
  !!rec && /vignetteLaw:4/.test(rec) && /cos\^4 natural vignetting/.test(rec)
  && /sigma = sqrt\(N\)/.test(rec) && /linear in field height/.test(rec),
  rec ? rec.replace(/\/\/[^\n]*/g, '').replace(/\s+/g, ' ').trim().slice(0, 150) : 'HCC_OPTICS not found');

const num = k => Number((rec.match(new RegExp(k + ':([\\d.]+)')) || [])[1]);
const law = num('vignetteLaw'), applied = num('vignetteApplied');
const grain = num('grainSigma'), floor = num('grainFloor'), abb = num('aberration');

/* ── 1. the vignetting law, at four aspect ratios ────────────────────────────── */
const corner = (fovDeg, w, h) => { const hv = fovDeg / 2 * Math.PI / 180;
  return Math.atan(Math.hypot(Math.tan(hv), Math.tan(hv) * w / h)); };
const TAB = [[16, 9, 0.2209], [4, 3, 0.3255], [21, 9, 0.1326], [1, 1, 0.4206]];
ok('cos⁴ at a 55° vertical field reproduces the corner falloff at every aspect, from the geometry alone',
  TAB.every(([w, h, want]) => Math.abs(Math.pow(Math.cos(corner(55, w, h)), law) - want) < 5e-4),
  TAB.map(([w, h, want]) => `${w}:${h} ${(corner(55, w, h) * 180 / Math.PI).toFixed(1)}° → ${want}`).join(' · '));

ok('the exponent is the four the optics gives, written as four multiplications rather than a tunable power',
  law === 4 && /float v=cosT\*cosT\*cosT\*cosT;/.test(src) && !/pow\(cosT/.test(src),
  'aperture, sensor element, and the inverse square of a longer oblique path');

ok('the fraction actually applied is a separate, declared number, because a real lens is corrected twice over',
  applied > 0 && applied < 1 && /col\*=mix\(1\.0, v, uVig\);/.test(src),
  `the law puts a 16:9 corner at 0.221; ${(100 * applied).toFixed(0)}% of it is drawn, so the corner reads ${(1 - applied * (1 - 0.2209)).toFixed(3)}`);

ok('the field angle comes from the projection matrix, so one shader is right at every aspect and field of view',
  /function opticsSyncField\(\)\{/.test(src)
  && /t\.set\(1\/Math\.max\(pm\[0\],1e-6\), 1\/Math\.max\(pm\[5\],1e-6\)\);/.test(src)
  && /float cosT=inversesqrt\(1\.0\+dot\(t,t\)\);/.test(src),
  'screen radius would have to be re-tuned for every aspect; the half-field tangents never do');

ok('and one function computes it, called by the frame and by the boot suite alike',
  (src.match(/opticsSyncField\(\)/g) || []).length >= 3,
  'a check that recomputes the thing it is checking is checking its own arithmetic');

/* ── 2. the grain, and the law it usually gets backwards ─────────────────────── */
ok('the grain scales with the square root of the signal, which is what Poisson arrivals mean',
  /col\+=n\*uGrain\*sqrt\(max\(L,uFloor\)\);/.test(src) && grain > 0,
  'σ = √N, so absolute grain grows as √L while relative grain falls as 1/√L');

ok('so it is loudest, relatively, exactly where the picture is darkest',
  (() => { const rel = L => Math.sqrt(Math.max(L, floor)) / Math.max(L, 1e-6);
    return rel(0.02) > rel(0.1) && rel(0.1) > rel(0.5) && rel(0.5) > rel(1.0); })(),
  `relative noise at L=0.05 is ${(Math.sqrt(0.05) / 0.05 / (Math.sqrt(1) / 1)).toFixed(1)}× what it is at L=1 — a uniform overlay has that backwards`);

ok('there is a floor below which the noise would be quantisation rather than photons, and it is declared',
  floor > 0 && floor < grain && /uFloor:\{value:HCC_OPTICS\.grainFloor\}/.test(src),
  `σ = ${grain} at unit signal, floored at ${floor}: below that the square root would run away and the model would be describing the display, not the light`);

/* ── 3. lateral colour ───────────────────────────────────────────────────────── */
ok('the aberration is radial, zero on the optical axis and linear in field height',
  /vec2 c=vUv-0\.5;/.test(src) && /vec2 dir=c\*uAbb\*2\.0;/.test(src)
  && !/vec2 dir=vec2\(/.test(src),
  `${(abb * 2 * 100).toFixed(2)}% of a frame width at the corner and exactly nothing at the centre`);

ok('and the three channels are displaced in wavelength order rather than shuffled',
  /texture2D\(tDiffuse, vUv\+dir\)\.r/.test(src)
  && /texture2D\(tDiffuse, vUv\)\.g/.test(src)
  && /texture2D\(tDiffuse, vUv-dir\)\.b/.test(src),
  'red magnified most, green on axis, blue least — a lens focuses short wavelengths at a different magnification, and that is the whole effect');

/* ── 4. where it sits, and what it may not touch ─────────────────────────────── */
ok('the camera runs after the resolve and before the encode',
  /bloomComposer\.addPass\(smaaPass\);[\s\S]{0,400}opticsPass=new ShaderPass\(HCC_OPTICS_SHADER\);[\s\S]{0,120}bloomComposer\.addPass\(new OutputPass\(\)\);/.test(src),
  'after SMAA so it does not fight the edge resolve, before OutputPass so it works in linear light');

ok('it exists only under premium visuals and is released with the rest of the chain',
  /if\(premiumVisualsEnabled\)\{ opticsPass=new ShaderPass/.test(src)
  && /bloomComposer=null;bloomPass=null;smaaPass=null;opticsPass=null;/.test(src),
  'a reader who opted out of the premium chain gets the plain render, and a lost context frees this with everything else');

ok('and the file says what it may not do',
  /no number the atlas reports passes through/.test(src) && /display buffer/.test(src),
  'this is the display buffer after tone mapping; nothing measured goes near it');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
