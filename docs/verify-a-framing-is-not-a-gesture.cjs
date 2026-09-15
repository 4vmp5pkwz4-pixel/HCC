#!/usr/bin/env node
'use strict';
/* ══ A FRAMING IS NOT A GESTURE ══════════════════════════════════════════════
 *
 * The camera governor carries a per-frame dolly bound, and it is there for a good
 * reason: OrbitControls dollies multiplicatively and without limit, so one flick
 * of a wheel could carry the camera seventeen times outside the world between two
 * frames — a jump cut with nothing on the far side. Its own comment promised the
 * bound "limits only the RATE, never the reach: hold the gesture and the camera
 * still arrives, a frame or two later".
 *
 * That is true of a GESTURE, which asks again on every frame it is held. It is
 * false of a FRAMING, which asks once. Measured, entering the cycles world's
 * all-models stage: the framing solved for a camera 179 units from its subject and
 * the reader arrived at 111.9 — exactly 2.6 times the 43 units the previous frame
 * had stood at, which is this bound's step. Nothing asked again. Every hand-off in
 * this atlas that moves the camera by more than 2.6× in one frame was truncated
 * the same way, silently, and the interface simply never reached the distance it
 * had solved for.
 *
 * So a deliberate placement records its intended distance and the governor keeps
 * asking on the atlas's behalf, one rate-limited step per frame, until it arrives.
 * A reader's gesture on the view abandons the goal at once.
 *
 * Two versions of that got it wrong before this file existed, and the boot suite
 * caught both by walking the camera rather than by reading the code:
 *
 *   · the first tested arrival BEFORE the bound, using the distance the framing had
 *     just written — so every goal read as reached on its first pass and was
 *     cleared with the move still truncated;
 *   · the second wrote the camera only when the bound had changed what was asked,
 *     which is right for a gesture and leaves a goal one step short forever. The
 *     walk went 26 → 67.6 → 175.76 and stopped, repeating 175.76.
 *
 * AND THE SAME RELEASE GAVE EVERY CYCLES FRAME ITS SUBJECT BACK. Thirteen camera
 * branches each carried a hand-typed target and distance. Projecting every visible
 * instrument into screen space on arrival at each of the fourteen frames found
 * three off their subject entirely: the phase frame aimed at where its torus had
 * been before the next tick moved it, the resonance frame framed one of the two
 * instruments its own chip names, and the all-models stage re-laid itself out after
 * the camera had been solved for the old layout.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

{ /* 1. THE GOAL EXISTS, IS RECORDED BY EVERY FRAMING, AND IS DROPPED BY A GESTURE */
  ok('A FRAMING RECORDS THE DISTANCE IT MEANT, and the governor keeps asking for it one rate-limited step per frame instead of truncating the move and forgetting it',
    /function hccCameraGoal\(d\)\{ _camGoal=\(Number\.isFinite\(d\)&&d>1e-12\)\?d:NaN; \}/.test(src)
    && /const _goalLive=Number\.isFinite\(_camGoal\);\s*\n\s*if\(_goalLive\) dist=_camGoal;/.test(src),
    'one variable, set by the framing and read by the bound');
  ok('and every framing records it, because the one function they all call to declare their limits is called immediately after they place the camera — forty-five places, and not one of them a gesture',
    /try\{ const d=camera\.position\.distanceTo\(controls\.target\); if\(d>1e-9\) hccCameraGoal\(d\); \}catch\(e\)\{\}\s*\n\s*baseMinDistance=/.test(src)
    && (src.match(/setControlDistanceLimits\(/g) || []).length > 40,
    `${(src.match(/setControlDistanceLimits\(/g) || []).length} calls to setControlDistanceLimits, every one of them a framing declaring where it has just put the camera`);
  ok('and a gesture on the 3D view abandons it at once, so the atlas never argues with a reader who has taken the camera',
    /hccCameraGoalClear\(\);\s+\/\* the reader is steering; the atlas stops asking \*\//.test(src)
    && /function disarmIdleDrift\(e\)\{/.test(src),
    'cleared in disarmIdleDrift, which is the atlas’s own record of the reader taking control');
}

{ /* 2. THE TWO WAYS IT WAS GOT WRONG ARE FORBIDDEN */
  ok('and arrival is tested against what was APPLIED rather than against what was asked, because the framing writes the camera to the goal before the bound ever sees it',
    /_lastCamDist=safe;\s*\n\s*if\(Number\.isFinite\(_camGoal\)&&Math\.abs\(safe\/_camGoal-1\)<0\.004\) _camGoal=NaN;/.test(src),
    'a goal cleared on its first pass is a framing that never arrives');
  ok('and a live goal is always written to the camera, including on the step that finally fits inside the bound — the step that arrives is the one where nothing else would have moved it',
    /if\(_goalLive\|\|Math\.abs\(safe-asked\)>Math\.max\(1e-12,asked\*1e-8\)\)camera\.position\.copy/.test(src),
    'the walk stopped one step short at 175.76 of 200 without this, forever');
  ok('and the live flag is taken BEFORE the arrival test, because the arriving step is exactly the step that clears the goal',
    src.indexOf('const _goalLive=Number.isFinite(_camGoal);') < src.indexOf('if(Number.isFinite(_camGoal)&&Math.abs(safe/_camGoal-1)<0.004) _camGoal=NaN;'),
    'reading it after the clear reproduced the same 175.76 with a different cause');
}

{ /* 3. A FRAME FRAMES WHAT IT DECLARES */
  ok('AND EVERY CYCLES FRAME IS SOLVED FROM THE INSTRUMENTS IT DECLARES rather than from a point typed when that frame was new',
    /function cycFrameSubjects\(frame\)\{/.test(src)
    && /function cycFrameBounds\(frame\)\{/.test(src)
    && /function cycFrameSolveDistance\(radius, pad\)\{/.test(src)
    && (src.match(/cycFrameLook\('/g) || []).length >= 13,
    `${(src.match(/cycFrameLook\('/g) || []).length} branches solved from the declaration, each supplying only the angle its subject reads best from`);
  ok('and the bounds count only what is DRAWN, because half of these instruments stand half of themselves down in one frame or another — the resonance web’s whole rim is hidden in the phase frame and would drag the centre twenty-six units back to where the rim is not',
    /obj\.traverseVisible\(o=>\{/.test(src)
    && /if\(!g\|\|!g\.attributes\|\|!g\.attributes\.position\) return;/.test(src),
    'traverseVisible and the geometry’s own box — Box3.setFromObject walks invisible descendants too');
  ok('and where an instrument STANDS is decided in one function which the framing calls before it aims, instead of on the next tick — the phase frame aimed at (0, 4, −26) while its subject was about to be moved to the origin',
    /function cycStageForFrame\(frame\)\{/.test(src)
    && /try\{ cycStageForFrame\(state\.cycFrame\|\|'hierarchy'\); \}catch\(e\)\{\}/.test(src)
    && /const rimStoodDown=cycStageForFrame\(frame\);/.test(src),
    'one authority for the staging, called by both the tick and the framing');
  ok('and a frame re-solves itself once if its subject turns out to be a different size, because several of these instruments are built on demand and the all-models stage re-lays itself out when they grow',
    /function cycFrameSettle\(dt\)\{/.test(src)
    && /if\(!idleDrift\) return false;/.test(src)
    && /if\(Math\.abs\(B\.radius\/_cycFramedR-1\)<0\.22\) return false;/.test(src)
    && /cycAtlasApply\(false\); cycAtlasApply\(true\); applyCycFrameView\(\);/.test(src),
    'and never while the reader is steering');
}

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
