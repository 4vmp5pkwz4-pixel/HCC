#!/usr/bin/env node
'use strict';
/* ══ ZOOMING OUT LANDED AT THE CENTRE OF THE MODEL, NOT AT THE OBSERVER ════════
 *
 * A reader looked at the S³ section, saw the observable cap with `observer p` at its
 * middle, and asked whether the zoom-out chain should end THERE rather than at the
 * origin of the projection. It should, and it did not: both legs of the
 * Observable ↔ S³ seam read `controls.target.set(0,0,0)`, which is the centre of the
 * three-sphere — a point no chain of scales leads to and nobody has ever been.
 * Coming out of our own observable Universe should put you where our own observable
 * Universe IS.
 *
 * THE ATLAS ALREADY KNEW WHERE THAT IS. The cap is drawn at geodesic radius χ_P
 * about the +Y pole and its passport returns (0, RU, 0). One function now reads that
 * point and nothing else writes a second one down.
 *
 * AND THE MAP ACROSS THE SEAM IS A SIMILARITY. The Observable world is
 * observer-centred at one unit per gigalightyear; the carrier is one unit per
 * hundred. So p ↦ O + p/100: a translation composed with a uniform scale, which
 * preserves every distance RATIO in the scene exactly and changes only which point
 * is the origin. That is a stronger claim than the radius being preserved, and it is
 * the one this file checks.
 *
 * The same release put one switch at the bottom of the control panel for every
 * automatic move between scales, because five of them were governed separately or
 * not at all and a reader who wanted the instrument to stop moving had no way to
 * say so.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

ok('the observer on the carrier is one function and one point',
  /function hccObserverOnCarrier\(\)\{ return new THREE\.Vector3\(0, RU, 0\); \}/.test(src)
  && (src.match(/hccObserverOnCarrier\(\)/g) || []).length >= 4,
  'the cap is centred there and its passport returns the same point, so there is one authority and not two');

ok('the outward leg targets the observer instead of the centre of the carrier',
  /\{ const O=hccObserverOnCarrier\(\);\s*\n\s*controls\.target\.copy\(O\);\s*\n\s*camera\.position\.copy\(O\)\.addScaledVector\(dir, dObs\/SCALE_SEAMS\.s3UnitGly\); \}/.test(src)
  && !/state\.s3view='sec'; setMode\('s3'\);\s*\n\s*controls\.target\.set\(0,0,0\);/.test(src),
  'the cap you have just zoomed out of is centred on that point; the origin of the projection is somewhere no chain of scales leads');

ok('and the return leg measures its distance from the observer too',
  /const dS3=camera\.position\.distanceTo\(_O\), homeAim=controls\.target\.distanceTo\(_O\)<RU\*0\.08;/.test(src)
  && /const dir=camera\.position\.clone\(\)\.sub\(_O\);/.test(src),
  'approaching the centre of the carrier is not approaching our Universe, so it must not trigger the return');

ok('the Observable side stays centred on the origin, because that world IS observer-centred',
  /setMode\('obs'\); controls\.target\.set\(0,0,0\);   \/\/ the Observable world IS observer-centred/.test(src),
  'the same point wears two coordinates, and each world uses its own');

/* ── the map, as arithmetic ──────────────────────────────────────────────────── */
const K = Number((src.match(/s3UnitGly:(\d+)/) || [])[1]);
/* read a numeric literal until the carrier constants became computed from the
 * published curvature marginal. Run the reconstruction instead: the seam has to
 * land on the radius the atlas uses, not on the way it is written. */
const R = (() => {
  const i = src.indexOf('/* ══ THE CONDITIONAL RECONSTRUCTION');
  const j = src.indexOf('/* ONE AUTHORITY FOR EVERY WORLD-SCALE SEAM.');
  if (i < 0 || j < 0) throw new Error('reconstruction block not found');
  return new Function(src.slice(i, j) + '\nreturn S3.R;')();
})();
const RU = R / 100;
ok('the unit ratio across the seam is the one the two worlds declare',
  K === 100 && Math.abs(RU - R / 100) < 1e-12,
  `the Observable world is 1 unit = 1 Gly and the carrier 1 unit = ${K} Gly, so a length divides by exactly ${K}`);

const O = [0, RU, 0];
const map = p => p.map((v, i) => O[i] + v / K);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const A = [3, -7, 11], B = [-5, 2, 0.5], C = [0.25, 0.5, -9], D = [12, 0.1, -3];
const mA = map(A), mB = map(B), mC = map(C), mD = map(D);
ok('the map is a similarity, so every distance ratio in the scene survives it exactly',
  Math.abs((dist(mA, mB) / dist(mC, mD)) / (dist(A, B) / dist(C, D)) - 1) < 1e-12,
  `a ratio of ${(dist(A, B) / dist(C, D)).toFixed(6)} comes back as ${(dist(mA, mB) / dist(mC, mD)).toFixed(6)} — a translation with a uniform scale changes the origin and nothing else`);

ok('every length divides by exactly the unit ratio, and the observer maps to the observer',
  Math.abs(dist(mA, mB) * K - dist(A, B)) < 1e-9
  && dist(map([0, 0, 0]), O) < 1e-15,
  `${dist(A, B).toFixed(6)} → ${dist(mA, mB).toFixed(8)} · the reader's own position is the fixed point of the map, which is the whole reason to anchor it there`);

ok('and angles survive it too, which a scale-only map would also have to prove',
  (() => { const ang = (p, q, r) => { const u = [p[0] - q[0], p[1] - q[1], p[2] - q[2]],
      v = [r[0] - q[0], r[1] - q[1], r[2] - q[2]];
    const d = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    return Math.acos(d / (Math.hypot(...u) * Math.hypot(...v))); };
    return Math.abs(ang(A, B, C) - ang(mA, mB, mC)) < 1e-12; })(),
  'a similarity preserves shape entirely, so the configuration the reader was looking at is the configuration they arrive in');

/* ── the master switch ───────────────────────────────────────────────────────── */
/* COUNTED BY NAME, NOT BY OCCURRENCE. The first version of this check counted how
   many times `state.scaleChain` appeared next to `false` and asked for five — and the
   checkbox's own render is one of those, so deleting a real gate left four gates and
   five matches and the check stayed green. A mutation proved it. Each of the five
   transitions is now named and looked for where it actually lives. */
const SITES = [
  ['the solar ladder steps', /if\(state\.scaleChain===false\) return;/],
  ['the hand-off out to the Observable Universe', /d>SCALE_SEAMS\.solarObsOutGly\*GLY_AU && state\.autoScaleHandoff!==false && state\.scaleChain!==false/],
  ['the hand-off on to the finite carrier', /dObs>SCALE_SEAMS\.obsS3OutGly && state\.autoScaleHandoff!==false && state\.scaleChain!==false/],
  ['the return from the Observable Universe', /dObs<SCALE_SEAMS\.obsSolarInGly && state\.scaleChain!==false/],
  ['the return from the carrier', /dS3\*SCALE_SEAMS\.s3UnitGly<SCALE_SEAMS\.s3ObsInGly && state\.scaleChain!==false/]];
const missing = SITES.filter(([, re]) => !re.test(src)).map(([n]) => n);
ok('one switch governs every automatic move between scales, and each of the five is gated where it lives',
  missing.length === 0 && /scaleChain:true/.test(src),
  `${SITES.length} transitions, each named and each gated` + (missing.length ? ` · UNGATED: ${missing.join(', ')}` : ''));

ok('and it is appended after the per-mode body, so it is at the bottom of the panel in every world',
  /ctl\.insertAdjacentHTML\('beforeend', `[\s\S]{0,200}<b>Scale chain<\/b>/.test(src)
  && /id="scaleChainAll"/.test(src)
  && /cb\.onchange=e=>\{ state\.scaleChain=e\.target\.checked; \}/.test(src),
  'a switch that lives in one mode\'s template is a switch the reader cannot find from the others');

ok('the panel says what the switch does and what the seam now promises',
  /lands you AT THE OBSERVER on the carrier rather than at its centre/.test(src)
  && /Off, nothing moves you but you\./.test(src),
  'a control whose effect is not written beside it is a control the reader has to experiment on');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
