#!/usr/bin/env node
'use strict';
/* ══ THE VOID PAST THE LAST STRUCTURE ══════════════════════════════════════════
 *
 * REPORTED BY A READER: zooming out of the Solar System past the giant-structure
 * shells cut the picture to black. The mode tab switched to the Observable
 * Universe exactly as it should, and there was nothing to look at.
 *
 * It was not the hand-off. Every world's zoom ceiling was a number typed beside
 * it, with no relation to how far out that world's farthest object actually is.
 * Measured from the scene graph at the moment of the fault:
 *
 *     world                farthest object     zoom ceiling     ceiling ÷ content
 *     solar · cosmic web    2.976e15 AU         5.059e16 AU          17.0
 *     field lab                   7.45                   80          10.7
 *     cycles                        73                  320           4.4
 *     observable universe        548.3                 1600           2.9
 *     FBS3R φ-ladder             322.0                  400           1.2
 *     compact S³                 548.3                  180           0.33
 *
 * Seventeen. And OrbitControls dollies MULTIPLICATIVELY with no per-frame bound,
 * so one flick of a wheel crossed that whole emptiness between two frames: 5150 of
 * 5184 sampled pixels lit, then 96. The last row is the same defect pointing the
 * other way — the compact S³ world kept its outermost surface three times outside
 * its own ceiling, so no reader could ever back off far enough to see all of it.
 *
 * THIS CHECK HOLDS THE RULE THAT REPLACED THE TYPED NUMBERS, and the two things
 * that rule needs in order to work at all:
 *
 *   · the per-frame rate bound, without which any gap is crossed in one frame;
 *   · the guard on re-measuring, because several markers in this atlas are sized
 *     to hold a constant angular size, so their world radius GROWS WITH THE
 *     CAMERA. Re-deriving a ceiling from outside the content measures the camera
 *     rather than the world, and the two chase each other outward. That was
 *     measured too: the cosmic ceiling climbed 8.7e15 → 2.2e16 → 5.1e16 over six
 *     frames of a single flick, walking the reader straight back into the void.
 *
 * The boot suite measures the ratios in the live scene. What can only be checked
 * against the source is here: that the rule is derived rather than declared, that
 * the exempt set is what it claims to be, and that the hand-off is a navigation.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

const rule = (() => {
  const i = src.indexOf('const HCC_ZOOM=Object.freeze({');
  if (i < 0) return null;
  const j = src.indexOf('});', i);
  return src.slice(i, j + 3);
})();
ok('the rule is one frozen record in the page, not a constant repeated beside each world',
  !!rule && /floor:([\d.]+)/.test(rule) && /ceiling:([\d.]+)/.test(rule) && /step:([\d.]+)/.test(rule),
  rule ? rule.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim().slice(0, 150) : 'HCC_ZOOM not found');

const num = k => Number((rule.match(new RegExp(k + ':([\\d.]+)')) || [])[1]);
const floor = num('floor'), ceiling = num('ceiling'), step = num('step');
ok('the floor is above one, the cap is above the floor, and the rate bound is a real slowdown',
  floor > 1 && ceiling > floor && step > 1 && step < 10,
  `a world is always framable at ${floor}×, never emptier than ${ceiling}×, and a gesture may multiply the distance by at most ${step}× per frame`);

ok('the exempt set is exactly the rungs of the solar ladder that have a rung above them',
  /uncapped:Object\.freeze\(\['solar:local','solar:galactic','solar:andromeda'\]\)/.test(rule)
  && !/uncapped[\s\S]{0,80}solar:cosmic/.test(rule),
  'a rung may reach past what it draws only because a further rung exists to fill the gap; the last rung has none, so it is capped like any other world');

ok('the content radius is measured from the scene graph rather than declared next to the ceiling',
  /function worldContentRadius\(\)\{/.test(src)
  && /o\.geometry\.computeBoundingSphere\(\)/.test(src)
  && /v\.copy\(bs\.center\)\.applyMatrix4\(o\.matrixWorld\)/.test(src)
  && /const rr=v\.length\(\)\+bs\.radius\*sc;/.test(src),
  'a number typed beside a world is free to disagree with what the world draws; a walk of the graph is not');

ok('a hidden branch is not measured, so a world is sized by what is on the screen',
  /if\(!o\.visible\|\|o\.userData&&o\.userData\.backdrop\) return;/.test(src),
  'the walk descends only through what is visible, rather than reading every object and calling the result the scene');

ok('the star oceans are excluded as scenery, and sprites as markers',
  /p\.userData\.backdrop = true;/.test(src)
  && /if\(o\.geometry&&\(o\.isMesh\|\|o\.isPoints\|\|o\.isLine\|\|o\.isLineSegments\)\)/.test(src)
  && !/o\.isLineSegments\|\|o\.isSprite\)\)\{[\s\S]{0,400}worldContentRadius/.test(src),
  'a sky painted on the inside of a shell is not a place, and a pin that says "something is over there" is not the something');

ok('the ceiling is derived on every entry and re-derived as content arrives, not once and forgotten',
  /function applyZoomCeiling\(meta\)\{/.test(src)
  && (src.match(/applyZoomCeiling\(/g) || []).length >= 4
  && /_zoomRefresh-=dt;/.test(src),
  `${(src.match(/applyZoomCeiling\(/g) || []).length} sites: world entry, rung change, the frame loop, and the definition — arguments may carry provenance without changing the invariant`);

ok('the re-measurement runs only from inside the content, which is the whole defence against the runaway',
  /if\(camera\.position\.distanceTo\(controls\.target\)<=worldContentRadius\(\)\)\{/.test(src),
  'markers sized to a constant angular size grow with the camera, so a ceiling re-derived from outside measures the camera and not the world');

ok('the mark only rises inside one world and is cleared on entry, so a ceiling never drops under a camera already out there',
  /if\(_zoomContent\.world===zoomWorldKey\(\)\) r=Math\.max\(r,_zoomContent\.r\);/.test(src)
  && /function resetContentMark\(\)\{/.test(src)
  && (src.match(/resetContentMark\(\)/g) || []).length >= 3,
  'geometry arrives late — a laboratory builds on first entry, the Oort cloud fades in');

/* The write is now also unconditional while a FRAMING is in flight — a framing asks
 * once where a gesture asks every frame, so on the step that finally fits inside the
 * bound nothing else would have moved the camera and the move stopped one step short
 * of the distance the atlas had solved for. The comparison against `asked` is what
 * this clause is about and is unchanged; the extra term is named so the two reasons
 * for writing the camera stay distinguishable. */
ok('the rate bound is compared against what the gesture asked for, not against the number the bound itself just wrote',
  /const asked=dist;/.test(src)
  && /if\(_goalLive\|\|Math\.abs\(safe-asked\)>Math\.max\(1e-12,asked\*1e-8\)\)camera\.position\.copy/.test(src)
  && !/if\(Math\.abs\(safe-dist\)>Math\.max\(1e-12,dist\*1e-8\)\)camera\.position\.copy/.test(src),
  'the first version wrote its answer into dist and then tested dist against itself, so it computed the right number every frame and never moved the camera');

/* WHERE THE SEAM IS BELONGS TO SCALE_SEAMS, AND THIS CHECK DOES NOT TOUCH IT.
   The dimensional correction there — 26 Mly is 0.026 Gly, not 26 — is the right fix
   for the seam, and it did not end the black screen on its own: MEASURED after it,
   a flicked wheel still spent six consecutive frames in the cosmic layer at 5.06e16
   AU with 84 of 5184 sampled pixels lit. A hand-off cannot save a reader it never
   gets a frame to run in. That is what the rate bound below is for. */
ok('the hand-off is a navigation, so the breadcrumb and the address cannot disagree with what is on the screen',
  /try\{ hccGo\(\{worldId:'obs'\},\{history:true\}\); \}catch\(e\)\{ setMode\('obs'\); \}/.test(src),
  'it called setMode directly and told no one: HCC_CTX kept saying solar while the Observable Universe was drawn, and the reader could see the disagreement in the breadcrumb');

ok('the solar chain is left behind rather than left hanging when the reader crosses the seam',
  /state\.solarScaleLayer='local';\s*\/\/ the solar chain is left behind, not left hanging/.test(src),
  'the layer stayed on cosmic after the world had changed, which is a second authority for where the reader is');

ok('the arrival radius is held inside the world that was just entered',
  /const arrive=Math\.min\(d\/GLY_AU, zoomCeilingNow\(\)\*0\.9\);/.test(src),
  'a continuous scale across the seam is not a licence to arrive somewhere nothing is drawn');

ok('the rule says in the file why it exists, so the next reader does not have to rediscover the fault',
  /a zoom ceiling unrelated to a world content radius is a void the reader can fall into/.test(src)
  && /THE VOID PAST THE LAST STRUCTURE/.test(src)
  && /A GESTURE MAY NOT OUTRUN THE WORLD/.test(src),
  'the measured table of ceilings against contents is written beside the rule that replaced it');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
