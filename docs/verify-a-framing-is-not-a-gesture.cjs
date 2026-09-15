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
    /function hccCameraGoal\(d, frames\)\{\s*\n\s*_camGoalPending=false;[\s\S]{0,120}?_camGoal=\(Number\.isFinite\(d\)&&d>1e-12\)\?d:NaN;/.test(src)
    && /const _goalLive=Number\.isFinite\(_camGoal\);\s*\n\s*if\(_goalLive\)\{/.test(src)
    && /else dist=_camGoal;/.test(src),
    'one variable, set by the framing and read by the bound');
/* ── AND THE CAPTURE IS DEFERRED BY ONE GOVERNOR PASS ───────────────────────
 * The first form read the camera distance inside setControlDistanceLimits, on the
 * assumption that a framing declares its limits immediately AFTER placing the
 * camera. Forty-six callers, and not all of them do: the Observable → Solar seam
 * calls advanceScaleLayer(), which declares limits, and only then writes the
 * camera out to the cosmic web — so the goal was recorded at the distance the
 * camera was about to leave and the governor dragged it back there. The hand-off
 * arrived at the wrong scale, which is the exact failure a goal exists to prevent.
 * Whatever order a framing works in, by the next pass the placement is finished. */
  ok('and every framing records it, because the one function they all call to declare their limits marks the intent and the governor captures it once the placement is finished — whatever order that framing does its work in',
    /_camGoalPending=true;\s*\n\s*baseMinDistance=/.test(src)
    && /if\(_camGoalPending\)\{\s*\n\s*_camGoalPending=false;/.test(src)
    && /_camGoalPending=false;\s+\/\* an explicit goal outranks a deferred capture \*\//.test(src)
    && (src.match(/setControlDistanceLimits\(/g) || []).length > 40,
    `${(src.match(/setControlDistanceLimits\(/g) || []).length} calls to setControlDistanceLimits, every one of them a framing — and an explicit paced goal outranks the deferred capture, because that caller has said what it wants in so many words`);
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

{ /* 4. A SEAM IS NOT A FRAMING EITHER, AND THE SECTION OPENS ON OUR OWN UNIVERSE */
  ok('AND A SEAM GLIDES ACROSS ITS CHANGE OF SCALE. The Observable ↔ S³ map multiplies or divides the camera radius by a hundred; the ordinary rate bound covers that in four frames, which is the jump cut a reader cannot connect to the sphere they just left',
    /crossFrames:48/.test(src)
    && /hccCameraGoal\(dObs\/SCALE_SEAMS\.s3UnitGly, SCALE_SEAMS\.crossFrames\);/.test(src)
    && /hccCameraGoal\(dS3\*SCALE_SEAMS\.s3UnitGly, SCALE_SEAMS\.crossFrames\);/.test(src),
    'both legs ask for the crossing over 48 frames — 1.10× each, paced in frames rather than seconds so a slow machine shows the same intermediate states');
  ok('and the pacing bounds the camera in BOTH directions, because the seam divides the radius on the way out and multiplies it on the way back and only growth was ever bounded',
    /if\(_camGoalStep>1&&Number\.isFinite\(_lastCamDist\)&&_lastCamDist>0\)\s*\n\s*dist=THREE\.MathUtils\.clamp\(_camGoal,_lastCamDist\/_camGoalStep,_lastCamDist\*_camGoalStep\);/.test(src)
    && /_camGoalStep=Math\.pow\(ratio, 1\/Math\.max\(2,frames\)\);/.test(src),
    'the factor is derived from the distance to cover and the frames asked for, not typed');
  ok('and the S³ section aims at the observable cap from above the carrier instead of at the centre of the model, which is where every S³ view landed and which this atlas already calls a place no chain of scales leads to',
    /function hccS3SectionView\(\)\{/.test(src)
    && /controls\.target\.copy\(O\);\s*\n\s*camera\.position\.copy\(dir\)\.multiplyScalar\(d\);/.test(src)
    && /\} else if\(v==='sec'\)\{/.test(src)
    && /const d=RU\/Math\.sin\(Math\.max\(0\.2,0\.36\*Math\.min\(vFov,hFov\)\)\);/.test(src),
    'the distance is solved so the whole carrier stands under the cap, against the narrower field of view — the same framing on a phone held upright');
}

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
