#!/usr/bin/env node
'use strict';
/* ══ THE SUN WAS ONE FLAT COLOUR ON A SPHERE ═══════════════════════════════════
 *
 * MeshBasicMaterial, 0xfff2c4, edge to edge, with a radial-gradient sprite behind
 * it. The star at the centre of the view this atlas opens on had no limb, no
 * surface and no corona, and the one thing anybody can check about the Sun by
 * looking at it — that it is a BALL and not a disc — was what the drawing threw
 * away.
 *
 * WHAT MAKES IT LOOK LIKE A BALL IS DERIVABLE, NOT ART. In a grey atmosphere under
 * the Eddington approximation S(τ) = ¾F(τ + ⅔), so
 *
 *     I(μ)/I(1) = (μ + ⅔)/(1 + ⅔) = (2 + 3μ)/5        limb = 0.400 of centre
 *     T(μ)      = T_eff · (¾(μ + ⅔))^¼                6103 K centre, 4854 K limb
 *
 * The observed solar limb in the visible is 0.3 to 0.4 of centre, and textbooks put
 * the limb temperature at 4800 to 5000 K. Both are authorities outside this
 * repository, and the derivation lands on both without being fitted to either.
 *
 * The identity that keeps it honest is the disc integral: 2∫₀¹ I(μ)μ dμ / I(1) =
 * (6/5)(⅓ + ⅓) = 4/5, exactly. A limb-darkened disc radiates precisely what a
 * uniform disc of its mean brightness would, so this model cannot be secretly
 * brightening or dimming the star. That is the difference between a lighting model
 * and a photometric one, and it is the first thing checked below.
 *
 * TWO THINGS HERE ARE DECLARED DISPLAY CHOICES AND SAY SO. The absolute level of
 * the photosphere is one: a real one is some fourteen orders of magnitude above a
 * display's white, so the number is chosen to bloom and the RATIOS across the disc
 * are what carry meaning. The corona's opacity curve is the other: Baumbach's
 * profile spans six decades in the first four radii and a screen holds about two.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

const rec = (() => { const i = src.indexOf('const HCC_SOLAR=Object.freeze({');
  return i < 0 ? null : src.slice(i, src.indexOf('});', i) + 3); })();
ok('the solar photometry is one frozen record in the page, named and sourced',
  !!rec && /tEff:5772/.test(rec) && /eddington:2\/3/.test(rec) && /Eddington grey atmosphere/.test(rec)
  && /Baumbach 1937 \/ Allen/.test(rec),
  rec ? rec.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim().slice(0, 140) : 'HCC_SOLAR not found');

const E = 2 / 3, tEff = 5772;
const I = mu => (Math.max(0, Math.min(1, mu)) + E) / (1 + E);
const T = mu => tEff * Math.pow(0.75 * (Math.max(0, Math.min(1, mu)) + E), 0.25);

/* ── 1. the identity a photometric model may not break ───────────────────────── */
let disc = 0; const N = 2000000;
for (let i = 0; i < N; i++) { const mu = (i + 0.5) / N; disc += 2 * I(mu) * mu / N; }
ok('the limb-darkened disc radiates exactly what a uniform disc of its mean brightness would',
  Math.abs(disc - 0.8) < 1e-9 && Math.abs(I(0) - 0.4) < 1e-15 && Math.abs(I(1) - 1) < 1e-15,
  `2∫I(μ)μdμ / I(1) = ${disc.toFixed(9)} against the exact 4/5 · limb/centre ${I(0)} = (2+0)/5`);

ok('the profile is the Eddington form itself, not a curve fitted to look like it',
  [0, 0.2, 0.5, 0.8, 1].every(mu => Math.abs(I(mu) - (2 + 3 * mu) / 5) < 1e-15),
  'I(μ) = (2 + 3μ)/5 at every sample, to the last bit');

/* ── 2. against authorities outside this repository ──────────────────────────── */
ok('the centre-to-limb intensity ratio lands inside the observed visible range',
  I(0) >= 0.28 && I(0) <= 0.42,
  `${I(0).toFixed(3)} against an observed 0.3 to 0.4 · the Eddington value sits at the bright end of it, which is what a grey atmosphere is expected to do`);

ok('the temperature the limb radiates at lands where the textbooks put it',
  Math.abs(T(1) - 6103) < 2 && T(0) > 4800 && T(0) < 5000,
  `${T(1).toFixed(0)} K at the centre and ${T(0).toFixed(0)} K at the limb, against a published limb of 4800 to 5000 K`);

ok('the limb is redder as well as darker, which is why the reddening is computed and not painted',
  T(0) < T(1) && (T(1) - T(0)) > 1000,
  `${(T(1) - T(0)).toFixed(0)} K across the disc · radiation leaving at angle μ comes from optical depth τ ≈ μ, so the edge shows a higher, cooler layer`);

/* ── 3. the corona, at a published brightness ────────────────────────────────── */
const COR = [[0.0532, 2.5], [1.425, 7], [2.565, 17]];
const B = r => 1e-6 * COR.reduce((a, [c, p]) => a + c * Math.pow(r, -p), 0);
ok('the corona is Baumbach\'s K+F profile with its published coefficients',
  new RegExp('corona:Object\\.freeze\\(\\[\\[0\\.0532,2\\.5\\],\\[1\\.425,7\\],\\[2\\.565,17\\]\\]\\)').test(src),
  'B(r)/B☉ = 1e-6 (0.0532 r^-2.5 + 1.425 r^-7 + 2.565 r^-17), r in solar radii');

ok('it reproduces the coronal brightness the literature quotes at 1.5 and 2 solar radii',
  Math.abs(B(1.5) / 1e-7 - 1.053) < 0.02 && Math.abs(B(2) / 1e-8 - 2.056) < 0.02,
  `${B(1.5).toExponential(2)} at 1.5 R☉ against a quoted ≈1e-7 · ${B(2).toExponential(2)} at 2 R☉`);

ok('each term owns the range it was measured for, which is why one power law was never enough',
  (() => { const dom = r => COR.map(([c, p]) => c * Math.pow(r, -p)).reduce((bi, v, i, a) => v > a[bi] ? i : bi, 0);
    return dom(1.02) === 2 && dom(1.4) === 1 && dom(4) === 0; })(),
  'r^-17 holds the first few percent above the limb, r^-7 the inner corona, r^-2.5 everything beyond a few radii');

ok('and the span is why a corona at any single opacity has always looked wrong',
  Math.log10(B(1.03) / B(3)) > 2.5,
  `${Math.log10(B(1.03) / B(3)).toFixed(1)} decades between 1.03 and 3 R☉, on a display that holds about two`);

/* ── 4. what the page actually draws ─────────────────────────────────────────── */
ok('the Sun is drawn from that photometry rather than from a flat colour',
  /const sunMesh = new THREE\.Mesh\(new THREE\.SphereGeometry\(1,96,64\), new THREE\.ShaderMaterial\(\{/.test(src)
  && !/const sunMesh = new THREE\.Mesh\(new THREE\.SphereGeometry\(1,48,32\), new THREE\.MeshBasicMaterial/.test(src),
  'MeshBasicMaterial has no angle to the viewer, so it can express no limb at all');

ok('the limb colour comes from the same Planck chain as the two hundred thousand stars behind it',
  /const c=hccBlackbodyRGB\(hccLimbTemperature\(i\/\(N-1\)\)\);/.test(src),
  'one law and one colour pipeline: the Sun and its sky cannot disagree about what a temperature looks like');

ok('the colour ladder is checked by its byte length, because the format name proved unable to fail',
  /L\.texture\.image\.data\.length===L\.N\*\(L\.texture\.format===THREE\.RGBAFormat\?4:3\)/.test(src)
  && /px\[i\*4\+3\]=255;/.test(src),
  'the removed RGBFormat constant arrives as undefined and three.js silently substitutes its RGBA default, so only the buffer size can catch the mismatch that actually blacked the Sun out');

ok('the corona is a projection, drawn as one, and not parented to a spinning star',
  /const sunCorona=new THREE\.Mesh\(new THREE\.PlaneGeometry/.test(src)
  && /solarGroup\.add\(sunCorona\);/.test(src)
  && !/sunMesh\.add\(sunGlow\); sunMesh\.add\(sunCorona\);/.test(src)
  && /sunCorona\.quaternion\.copy\(camera\.quaternion\);/.test(src),
  'an optically thin halo is the integral along the line of sight, which for a spherical halo is a function of projected radius and nothing else');

ok('granulation is drawn only where a granule is larger than a pixel',
  /float px=max\(fwidth\(vP\.x\*uGranule\)/.test(src) && /float vis=clamp\(1\.2-px, 0\.0, 1\.0\);/.test(src),
  `${Math.round(Math.PI / (1000 / 695700))} convection cells span a great circle; at the opening distance the Sun is a few pixels across and drawing them would be aliasing, not information`);

ok('the two display choices are declared in the file rather than passed off as physics',
  /DECLARED DISPLAY CHOICE/.test(src) && /DISPLAY CLAMP, DECLARED/.test(src)
  && /ratio across the disc/.test(src),
  'the absolute brightness of the photosphere, and the compression of six decades of corona into two');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
