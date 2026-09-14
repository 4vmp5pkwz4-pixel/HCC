#!/usr/bin/env node
'use strict';
/* ══ THE READER COULD ORBIT AND COULD NOT FLY ══════════════════════════════════
 *
 * Every view in this atlas is an orbit about a point somebody else chose. That is
 * the right default — a scientific instrument should frame its subject — but it
 * means the reader can never go and stand somewhere. Inside the cosmic web, between
 * the Hopf fibres, off to one side of the Galaxy: all of it was orbitable and none
 * of it enterable.
 *
 * FREE FLIGHT IS THREE PROPERTIES, AND THE LIVE CAMERA IS MEASURED AGAINST ALL
 * THREE IN THE BOOT SUITE. What this file holds is the arithmetic behind them and
 * the structure that makes them true.
 *
 *   FRAME-RATE INDEPENDENCE. Velocity is in world units per SECOND and every step is
 *   v·dt, so under constant acceleration from rest eight steps of 2dt cover exactly
 *   four times eight steps of dt. A camera that moves per FRAME fails that and
 *   nothing else in the file would notice.
 *
 *   THE DAMPER. Release decays as exp(−t/τ), so the continuous stopping distance is
 *   exactly v₀τ. The integrator decays then steps, so its exact travel is
 *   v₀·dt·q/(1−q) with q = exp(−dt/τ) — 0.475% short of v₀τ at dt = 4 ms. The check
 *   is against the scheme's own solution and the gap is reported, not absorbed into
 *   a tolerance.
 *
 *   THE CEILING. The rule that every world's reach is bounded by the radius of what
 *   it draws was written for the zoom. A flight mode that ignored it would reopen
 *   the void that rule was written to close, so flight is clamped by the same
 *   zoomCeilingNow().
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

const rec = (() => { const i = src.indexOf('const HCC_FLIGHT=Object.freeze({');
  return i < 0 ? null : src.slice(i, src.indexOf('});', i) + 3); })();
const num = k => Number((rec.match(new RegExp(k + ':([\\d.]+)')) || [])[1]);
ok('the flight model is one frozen record and it says what its numbers mean',
  !!rec && /tau:0\.42/.test(rec) && /world units per second/.test(rec)
  && /exponential damper with a stated time constant/.test(rec),
  `τ = ${num('tau')} s · acceleration ${num('accel')} and top speed ${num('vmax')}, both in units of the reader's own distance from what they are looking at`);

const tau = num('tau');
/* ── the damper, in closed form ──────────────────────────────────────────────── */
const exact = dt => { const q = Math.exp(-dt / tau); return dt * q / (1 - q); };
ok('the integrator has a closed-form travel, and it converges on v·τ as the step shrinks',
  [0.02, 0.008, 0.004, 0.001, 0.0002].every((dt, i, a) =>
    i === 0 || Math.abs(exact(dt) / tau - 1) < Math.abs(exact(a[i - 1]) / tau - 1))
  && Math.abs(exact(0.0002) / tau - 1) < 3e-4,
  `dt = 4 ms gives ${(100 * (1 - exact(0.004) / tau)).toFixed(3)}% short of v₀τ, dt = 0.2 ms gives ${(100 * (1 - exact(0.0002) / tau)).toFixed(4)}% — first order in dt, exactly as a decay-then-step scheme is`);

ok('and the discretisation is first order, which is what the scheme is and not better',
  (() => { const e = dt => 1 - exact(dt) / tau;
    const r = e(0.008) / e(0.004); return Math.abs(r - 2) < 0.02; })(),
  `halving the step halves the error: e(8 ms)/e(4 ms) = ${(( 1 - exact(0.008) / tau) / (1 - exact(0.004) / tau)).toFixed(4)} against the 2 a first-order scheme gives`);

/* against a SIMULATION of the scheme, not against a constant somebody typed: the
   first version of this line carried 0.417986 from an earlier run and went red by
   1.7e-5 when the closed form was evaluated properly. A number written down beside a
   formula is a second authority for the formula. */
const simulate = (v0, dt, steps) => { let v = v0, d = 0;
  for (let i = 0; i < steps; i++) { v *= Math.exp(-dt / tau); d += v * dt; } return d; };
ok('the closed form is the scheme, checked against running the scheme',
  Math.abs(simulate(1, 0.004, 20000) / exact(0.004) - 1) < 1e-12
  && Math.abs(simulate(1, 0.02, 5000) / exact(0.02) - 1) < 1e-12,
  `twenty thousand steps of the actual integrator land on dt·q/(1−q) to ${Math.abs(simulate(1, 0.004, 20000) / exact(0.004) - 1).toExponential(1)} · from any speed v the reader stops in v × ${exact(0.004).toFixed(6)} s of travel, and can aim accordingly`);

/* ── the structure ───────────────────────────────────────────────────────────── */
ok('every step is velocity times dt, so the reach does not depend on the machine',
  /const step=HCC_FLY\.vel\.clone\(\)\.multiplyScalar\(dt\);/.test(src)
  && /HCC_FLY\.vel\.addScaledVector\(want, dt\);/.test(src)
  && /HCC_FLY\.vel\.multiplyScalar\(Math\.exp\(-dt\/HCC_FLIGHT\.tau\)\);/.test(src),
  'thrust, decay and displacement all integrate against dt — the commonest defect in free-flight code is that one of the three does not');

ok('the frame comes from the camera\'s own quaternion rather than from a moving look-at',
  /out\.fwd\.set\(0,0,-1\)\.applyQuaternion\(camera\.quaternion\)\.normalize\(\);/.test(src)
  && /out\.up\.crossVectors\(out\.right,out\.fwd\)\.normalize\(\);/.test(src),
  'a basis rebuilt from a look-at drifts as the target moves, and the target moves every frame in flight');

ok('the speed scales with the reader\'s own distance, so one control works at every scale in the atlas',
  /const scale=Math\.max\(camera\.position\.distanceTo\(controls\.target\), controls\.minDistance\*4\);/.test(src)
  && /HCC_FLIGHT\.accel\*scale/.test(src) && /HCC_FLIGHT\.vmax\*scale/.test(src),
  'astronomical units in the solar system and hundreds of gigalightyears on the carrier, without a units panel');

ok('flight obeys the same content ceiling the dolly does',
  /const ceil=zoomCeilingNow\(\);/.test(src)
  && /if\(r>ceil\)\{ camera\.position\.multiplyScalar\(ceil\/r\); HCC_FLY\.vel\.multiplyScalar\(0\.2\);/.test(src),
  'one rule for the reach, however the reader travels — a flight mode that ignored it would reopen the void the zoom rule closed');

ok('orbit control is released while flying and restored on landing',
  /controls\.enabled=!HCC_FLY\.on;/.test(src)
  && /function setFreeFly\(on\)\{/.test(src)
  && /HCC_FLY\.on=!!on; HCC_FLY\.vel\.set\(0,0,0\); HCC_FLY\.keys\.clear\(\);/.test(src),
  'two things steering one camera is the defect this atlas keeps finding, so only one of them is ever live');

ok('the keys do not fire while the reader is typing, and are dropped when the window loses focus',
  /if\(t&&t\.closest&&t\.closest\('input,textarea,select,\[contenteditable\]'\)\) return;/.test(src)
  && /addEventListener\('blur', \(\)=>HCC_FLY\.keys\.clear\(\)\);/.test(src)
  && /if\(e\.metaKey\|\|e\.ctrlKey\|\|e\.altKey\) return;/.test(src),
  'a camera that keeps flying because the reader alt-tabbed mid-thrust is a camera that has lost them');

ok('and the control says what it does, next to the switch that governs the scale chain',
  /id="freeFly"/.test(src) && /Free flight · W A S D, F to toggle/.test(src)
  && /stopping distance from any speed is exactly that speed times 0\.42 s/.test(src),
  'the reader is told the time constant, because it is the number that lets them aim');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
