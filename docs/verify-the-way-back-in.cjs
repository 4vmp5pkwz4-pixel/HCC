#!/usr/bin/env node
'use strict';
/* ══ THE WAY BACK IN IS THE WAY OUT, REVERSED (v4.367) ═══════════════════════════════════════════════════════════
 *   Reported: zooming in from the Observable Universe through the Milky Way dropped the reader straight on the Sun.
 *   Measured: the seam placed the camera at the mapped radius (20 Mly = 1.2e12 AU) and then paced a "crossing" from
 *   the radius the governor last applied — 0.019, in Gly, read as AU — so the first frame stood 312 AU from the Sun
 *   and the next fifty flew back out, the layers flipping on the way.
 *   1. the seam tells the governor the camera already stands at the mapped radius: no crossing is paced
 *   2. the governor's own arithmetic, run here: from the seam as it is, step 1 (none); from the seam as it was, a
 *      pace that starts at the Sun (mutation, caught)
 *   3. the seam is routed (address bar and breadcrumb follow) and enters the solar chain at its cosmic layer
 *   4. the ladder inward is ordered and has hysteresis: Observable → cosmic web → Local Group → Milky Way → Solar System
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const i0 = SRC.indexOf('if(homeAim && dObs<SCALE_SEAMS.obsSolarInGly && state.scaleChain!==false){'), seam = i0 > 0 ? SRC.slice(i0, SRC.indexOf("hudBig.textContent='Scale ↓ Cosmic web", i0)) : '';

/* 1 */
ok('the inward seam holds the mapped radius: the governor is told the camera already stands there, and no crossing is paced across a 1:1 map',
  /_lastCamDist=_solarR; hccCameraGoal\(_solarR,0\);/.test(seam) && !/hccCameraGoal\(_solarR, ?SCALE_SEAMS\.crossFrames\)/.test(seam) && /camera\.position\.copy\(dir\.multiplyScalar\(_solarR\)\);/.test(seam));

/* 2 · the governor's arithmetic, out of the page */
{ const m = SRC.match(/function hccCameraGoal\(d, frames\)\{[\s\S]*?\n\}\n/), GLY_AU = 63241.077 * 1e9;
  const run = (last, goal, frames) => { const f = new Function('camera', 'controls', `let _camGoalPending=true, _camGoal=NaN, _camGoalStep=0, _lastCamDist=${last};\n${m[0]}\nhccCameraGoal(${goal}, ${frames}); return _camGoalStep;`);
    return f({ position: { distanceTo: () => goal } }, { target: {} }); };
  const R = 0.019 * GLY_AU, now = run(R, R, 0), was = run(0.019, R, 48), first = 0.019 * was;
  ok('the governor, run here: from the seam as it is there is nothing to pace (step 0); from the seam as it was, a 6.3e13 "crossing" whose first frame stands at the Sun — the reported jump, caught',
    !!m && now === 0 && was > 1.5 && first < 1e3, `now step ${now} · before: ${was.toFixed(3)}× a frame from 0.019 → first frame at ${first.toPrecision(2)} AU from the Sun, for a camera that belonged at ${(R).toExponential(2)} AU`); }

/* 3 */
ok('the seam is a navigation: routed through hccGo so the address bar and the breadcrumb follow, and the solar chain entered at its cosmic layer',
  /state\.solarScaleLayer='cosmic';\s*try\{ hccGo\(\{worldId:'solar'\},\{history:true\}\); \}catch\(e\)\{ setMode\('solar'\); \}\s*advanceScaleLayer\('cosmic'\);/.test(seam));

/* 4 · the ladder */
{ const LY = 63241.077, G = 63241.077e9, seamIn = +SRC.match(/obsSolarInGly:([\d.]+)/)[1], seamOut = +SRC.match(/solarObsOutGly:([\d.]+)/)[1];
  const inAt = SRC.match(/const inAt =\{ galactic:(\d+), andromeda:([\d.e]+)\*LY_AU, cosmic:([\d.e]+)\*LY_AU \}/), outAt = SRC.match(/const outAt=\{ local:(\d+), galactic:([\d.e]+)\*LY_AU, andromeda:([\d.e]+)\*LY_AU \}/);
  const I = inAt && [+inAt[1], +inAt[2] * LY, +inAt[3] * LY], O = outAt && [+outAt[1], +outAt[2] * LY, +outAt[3] * LY];
  ok('the ladder inward is ordered, every rung below the one before, each with its hysteresis: Observable (20 Mly) → cosmic web → Local Group (5.2 Mly) → Milky Way (2.4 Mly) → Solar System (120 000 AU)',
    !!I && !!O && seamIn * G > I[2] && I[2] > I[1] && I[1] > I[0] && O[0] > I[0] && O[1] > I[1] && O[2] > I[2] && seamOut > seamIn,
    I ? `in at ${(seamIn * 1000).toFixed(0)} Mly · ${(I[2] / LY / 1e6).toFixed(1)} Mly · ${(I[1] / LY / 1e6).toFixed(1)} Mly · ${I[0]} AU; out at ${O[0]} AU · ${(O[1] / LY / 1e6).toFixed(1)} Mly · ${(O[2] / LY / 1e6).toFixed(1)} Mly · ${(seamOut * 1000).toFixed(0)} Mly` : 'thresholds not found'); }

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
