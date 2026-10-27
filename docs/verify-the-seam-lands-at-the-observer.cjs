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

/* v4.404: every crossing of every seam is ONE function now, hccSeamCross — routed (address, trail and Back follow), the
 * radius mapped in physical length. The legs aim where they aimed; what follows the placement changed again. The legs
 * had recorded the mapped radius as a goal paced over 48 frames, and the pace is measured from the radius the governor
 * last applied — which across THIS seam is in the other world's unit: the carrier opened at 91 times the mapped radius
 * (or the Observable world at a ninety-first of it) and crept back, nine rungs lost and regained at a seam that keeps
 * every ratio. A similarity has nothing to glide across, so the governor is told the camera already stands there. */
const cross = (() => { const i = src.indexOf('function hccSeamCross(to){'); return i < 0 ? '' : src.slice(i, src.indexOf('\nconst hccSeamAuto=', i)); })();
ok('the outward leg targets the observer instead of the centre of the carrier',
  /if\(to==='s3'\)\{\s*try\{ hccGo\(\{worldId:'s3',labId:'sec'\},\{history:true\}\); \}catch\(e\)\{ state\.s3view='sec'; setMode\('s3'\); \}/.test(cross)
  && /const O=hccObserverOnCarrier\(\), r=dGly\/SCALE_SEAMS\.s3UnitGly;\s*\n\s*controls\.target\.copy\(O\); camera\.position\.copy\(O\)\.addScaledVector\(dir, r\);/.test(cross)
  && !/state\.s3view='sec'; setMode\('s3'\);\s*\n\s*controls\.target\.set\(0,0,0\);/.test(src),
  'the cap you have just zoomed out of is centred on that point; the origin of the projection is somewhere no chain of scales leads');
{ const m = src.match(/function hccCameraGoal\(d, frames\)\{[\s\S]*?\n\}\n/);
  const run = (last, goal, frames) => new Function('camera', 'controls', `let _camGoalPending=true, _camGoal=NaN, _camGoalStep=0, _lastCamDist=${last};\n${m[0]}\nhccCameraGoal(${goal}, ${frames}); return _camGoalStep;`)({ position: { distanceTo: () => goal } }, { target: {} });
  const dObs = 957.5, r = dObs / 100, now = run(r, r, 0), was = run(dObs, r, 48), first = dObs / was;
  ok('and both legs stand at the radius the map gives them from the first frame: the governor is told the camera is already there, so no pace is measured from the radius it last applied in the other world\'s unit — run here: as it is, nothing to pace; as it was, the carrier opened at ' + (first / r).toFixed(0) + ' times the mapped radius (mutation, caught)',
    !!m && (cross.match(/_lastCamDist=r; hccCameraGoal\(r,0\);/g) || []).length === 2
    && !/hccCameraGoal\(dObs\/SCALE_SEAMS\.s3UnitGly, SCALE_SEAMS\.crossFrames\)/.test(src) && !/hccCameraGoal\(dS3\*SCALE_SEAMS\.s3UnitGly, SCALE_SEAMS\.crossFrames\)/.test(src)
    && now === 0 && first / r > 50,
    `out at ${dObs} Gly → the carrier at ${r} units: now step ${now}; before, ${was.toFixed(4)}× a frame from ${dObs} — the first frame ${first.toFixed(0)} units out, ${(first * 100).toFixed(0)} Gly, for a camera that belonged at ${(r * 100).toFixed(0)}`); }

ok('and the return leg measures its distance from the observer too',
  /const dS3=camera\.position\.distanceTo\(_O\), homeAim=controls\.target\.distanceTo\(_O\)<RU\*0\.08;/.test(src)
  && /else if\(from==='s3'\)\{ const O=hccObserverOnCarrier\(\); dir=camera\.position\.clone\(\)\.sub\(O\); dGly=dir\.length\(\)\*SCALE_SEAMS\.s3UnitGly; \}/.test(cross),
  'approaching the centre of the carrier is not approaching our Universe, so it must not trigger the return');

ok('the Observable side stays centred on the origin, because that world IS observer-centred',
  /try\{ hccGo\(\{worldId:'obs'\},\{history:true\}\); \}catch\(e\)\{ setMode\('obs'\); \}\s*\n\s*controls\.target\.set\(0,0,0\);   \/\* the Observable world IS observer-centred \*\//.test(cross),
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
/* v4.404: and the automatic hand-off is ONE predicate for all four crossings (hccSeamAuto: that switch and this one), in
   both directions — it had governed the two outward legs only, so zooming in crossed whatever it said and zooming out
   did not, and a reader who zoomed into the Solar System could not zoom back out. Off, a seam offers its door, and the
   door is gated by this switch too. */
const SITES = [
  ['the solar ladder steps', /if\(state\.scaleChain===false\) return;/],
  ['the hand-off out to the Observable Universe', /d>SCALE_SEAMS\.solarObsOutGly\*GLY_AU && state\.scaleChain!==false\)\{\s*\n\s*if\(hccSeamAuto\(\)\)\{ hccSeamCross\('obs'\); return; \}/],
  /* this site also carries !state.quantShells — while the curvature band is drawn
     the reader is looking AT the thing the seam would carry them through, and three
     of its five shells lie beyond the hand-off radius. The gate that matters to this
     check is still there; the pattern allows the extra condition rather than
     forbidding it, because a gate may be narrowed and must not be removed. */
  ['the hand-off on to the finite carrier', /const _outS3=homeAim && dObs>SCALE_SEAMS\.obsS3OutGly && [^;]*state\.scaleChain!==false;[\s\S]{0,160}if\(_outS3&&hccSeamAuto\(\)\) hccSeamCross\('s3'\);/],
  ['the return from the Observable Universe', /const _inSolar=homeAim && dObs<SCALE_SEAMS\.obsSolarInGly && state\.scaleChain!==false;[\s\S]{0,160}else if\(_inSolar&&hccSeamAuto\(\)\) hccSeamCross\('solar'\);/],
  ['the return from the carrier', /const _inObs=homeAim && dS3\*SCALE_SEAMS\.s3UnitGly<SCALE_SEAMS\.s3ObsInGly && state\.scaleChain!==false;\s*\n\s*if\(_inObs&&hccSeamAuto\(\)\) hccSeamCross\('obs'\);/]];
const missing = SITES.filter(([, re]) => !re.test(src)).map(([n]) => n);
ok('one switch governs every automatic move between scales, and each of the five is gated where it lives — the four crossings by one predicate that reads both switches, in both directions alike, and the door they offer instead by this one',
  missing.length === 0 && /scaleChain:true/.test(src)
  && /const hccSeamAuto=\(\)=>state\.autoScaleHandoff!==false&&state\.scaleChain!==false;/.test(src)
  && /function hccSeamOffer\(to\)\{ if\(state\.scaleChain===false\)\{ HCC_SEAM\.door=null; return; \}/.test(src)
  && !/state\.autoScaleHandoff!==false && state\.scaleChain!==false/.test(src),
  `${SITES.length} transitions, each named and each gated` + (missing.length ? ` · UNGATED: ${missing.join(', ')}` : ''));

/* ── THIS PINNED THE HEADING, AND THE HEADING WAS THE BUG ────────────────────
 * It required the literal `<b>Scale chain</b>` inside the appended block. That
 * block had grown to nine controls of which ONE was about the scale chain — the
 * rest were a dimension lattice, a curvature band, a blast wave and its two
 * sliders, a diffusion marker, a panel theme and free flight — so the heading
 * named a fraction of its own contents, and six of the nine could not act in
 * whichever world the reader was standing in. The heading is now "Navigation &
 * appearance" and holds only what is global; the instruments moved to the worlds
 * that draw them.
 *
 * What this check is FOR is that the scale-chain switch is reachable from every
 * world — appended after the per-mode body rather than buried in one mode's
 * template. That invariant is unchanged, so it is what gets asserted, and the
 * heading is left free to tell the truth. */
ok('and it is appended after the per-mode body, so it is at the bottom of the panel in every world',
  (() => {
    /* a character-distance window was the first form of this and it broke on a
       longer heading, which is the wrong thing to be sensitive to. What matters
       is that the control sits inside an appended template rather than inside a
       mode branch — so find the appending call before it and require that the
       template literal has not been closed in between. */
    const at = src.indexOf('id="scaleChainAll"');
    if (at < 0) return false;
    const call = src.lastIndexOf("ctl.insertAdjacentHTML('beforeend', `", at);
    if (call < 0) return false;
    const between = src.slice(call, at);
    return !between.includes('`)') && !/\bstate\.mode\s*===/.test(between);
  })()
  && /cb\.onchange=e=>\{ state\.scaleChain=e\.target\.checked; \}/.test(src)
  && !/<b>Scale chain<\/b>[\s\S]{0,3000}id="blastOn"/.test(src),
  'a switch that lives in one mode\'s template is a switch the reader cannot find from the others — and a heading that names one of the nine controls under it is a different lie');

ok('the panel says what the switch does and what the seam now promises',
  /lands you AT THE OBSERVER on the carrier rather than at its centre/.test(src)
  && /Off, nothing moves you but you\./.test(src),
  'a control whose effect is not written beside it is a control the reader has to experiment on');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
