#!/usr/bin/env node
'use strict';
/* ══ THE DISPLAY IS A STROBOSCOPE — AND THE SECOND LADDER ═══════════════════════════════════
 * v4.343. Checked:
 *   1. the presented frame rate is measured as the median of the last ninety intervals, robust to stalls, and the
 *      frame loop feeds it every frame
 *   2. the Nyquist rule: a quarter turn per frame is true, up to a half is flagged, past a half it is aliased — and the
 *      alias the eye sees is the advance folded into (−½, ½]
 *   3. the guard fades a hand past Nyquist and restores it below, on real materials
 *   4. the Antikythera and Saros hands measure their turn per frame from the epochs the frames showed; the
 *      Stroboscope reports its frame budget and places flashes at exact flow times
 *   5. the S³ spectral ladder: k(ℓ) and N(k) invert each other, the drift ladder and the addition theorem hold on the
 *      atlas's kernels, and the exact triad resonances up to k = 48 are the 26 allowed ones
 *   6. wired: the tower in the FBS3R world with its switch, the ledger and its track
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { HCC_DISPLAY: HD, hccDisplaySample, hccTurnsPerFrame, hccApparentTurns, hccAliasState, hccAliasGuard, strobeFrameBudget, s3LadderK, s3LadderWave, s3LadderN, s3LadderKofN, s3DriftLadder, s3ExactTriads, FORMULA_CHECKS: FC, DISCOVERIES, discoveryTrack, trackRun, FBS } = K;
  { HD.samples.length = 0; for (let i = 0; i < 120; i++) hccDisplaySample(16.667 + (i % 3 - 1) * 0.4 + (i % 17 === 0 ? 180 : 0)); const h60 = HD.hz; HD.samples.length = 0; for (let i = 0; i < 90; i++) hccDisplaySample(40 + (i % 5 === 0 ? 400 : 0)); const h25 = HD.hz;
    ok('the presented frame rate is the median of the last ninety intervals — robust to stalls — and the frame loop feeds it every frame', Math.abs(h60 - 60) < 1 && Math.abs(h25 - 25) < 0.5 && /hccDisplaySample\(rawFrameMs\);/.test(SRC), `60 Hz with stalls → ${h60.toFixed(2)} · 25 Hz with long stalls → ${h25.toFixed(2)}`); }
  { const st = [0.1, 0.3, 0.6, 1.02].map(hccAliasState), ap = [0.1, 0.6, 1.02, 0.95].map(t => +hccApparentTurns(t).toFixed(3)), tpf = hccTurnsPerFrame(1, 60);
    ok('the Nyquist rule: true below ¼ turn per frame, flagged to ½, aliased beyond; the eye sees the advance folded into (−½, ½]', st.join() === 'true,near,aliased,aliased' && ap.join() === '0.1,-0.4,0.02,-0.05' && Math.abs(tpf - 1 / 60) < 1e-15, `${st.join(', ')} · apparent ${ap.join(', ')}`); }
  { const mk = () => ({ material: { opacity: 0.9, transparent: false, userData: {} }, traverse(f) { f(this); } }), o = mk(), a = hccAliasGuard(o, 29.53, 20, 1), fadedOp = o.material.opacity, b = hccAliasGuard(o, 29.53, 0.5, 1);
    ok('the guard fades a hand past Nyquist and restores it below, on its own material', a.state === 'aliased' && Math.abs(fadedOp - 0.12) < 1e-12 && b.state === 'true' && o.material.opacity === 0.9 && o.material.transparent === false, `20 d/frame on a 29.53 d hand: ${a.turnsPerFrame.toFixed(3)} turns → ${a.state}, opacity ${fadedOp}; 0.5 d/frame → ${b.state}, opacity ${o.material.opacity}`); }
  { const B = strobeFrameBudget(0.2 * Math.PI, 0.05, 2);
    ok('the Antikythera and Saros hands measure their turn per frame from the epochs the frames showed, and the Stroboscope reports its frame budget',
      /const dd=Number\.isFinite\(antikUpdate\._prev\)\?days-antikUpdate\._prev:0;/.test(SRC) && /const g=hccAliasGuard\(hand,h\.period,sarosDD,1\);/.test(SRC) && /strobeFrameBudget\(P\.Ts\*Math\.PI,O\.dtf\|\|0,F\.f1\)/.test(SRC) && /HCC_DISPLAY\.hz\.toFixed\(1\)/.test(SRC) && Math.abs(B.flashesPerFrame - 0.05 / (0.2 * Math.PI)) < 1e-15 && B.flashState === 'resolved',
      `T_s = 0.2π at 0.05 flow per frame: ${B.flashesPerFrame.toFixed(4)} flashes per frame, tracer ${B.turnsPerFrame.toFixed(4)} turns`); }
  { const R = 42 * 9.4607e24, inv = [1, 7, 48, 1e6, 1e30].every(k => Math.abs(s3LadderK(s3LadderWave(k, R), R) - k) / k < 1e-9 && Math.abs(s3LadderKofN(s3LadderN(k, R), R) - k) / k < 1e-6), T = s3ExactTriads(48), D = s3DriftLadder(2, 1, 1), dr = FC.F00967.run(), ad = FC.F01072.run();
    ok('the S³ spectral ladder: k and N invert each other, the drift ladder and the addition theorem hold on the kernels, and the exact triads to k = 48 are 26', inv && T.length === 26 && T.some(t => t.join() === '4,5,7') && T.some(t => t.join() === '3,8,9') && D.norm === 2 && D.mult === 3 && dr.ok && ad.ok,
      `${T.length} triads, first ${T.slice(0, 3).map(t => '(' + t[0] + ',' + t[1] + '→' + t[2] + ')').join(' ')} · ${dr.text.slice(0, 70)} · ${ad.text.slice(0, 60)}`); }
  { const led = ['twoLadders', 'displayStroboscope'].every(id => DISCOVERIES.some(d => d.id === id && d.verifier === 'docs/verify-the-display-is-a-stroboscope.cjs')), tr = trackRun(discoveryTrack('twoLadders')).ok;
    ok('wired: the S³ tower in the FBS3R world with its φ / S³ / both switch, the ledger and its track', led && tr && /const fbsS3Group=new THREE\.Group\(\); fbsS3Group\.visible=false; fbsGroup\.add\(fbsS3Group\);/.test(SRC) && /data-fbsladder=/.test(SRC) && /try\{ fbsS3LadderTick\(dt\); \}catch\(e\)\{\}/.test(SRC) && /try\{ fbsS3LadderApply\(\); \}catch\(e\)\{\}/.test(SRC), `ledger ${led ? 'ok' : 'MISSING'} · track ${tr ? 'replays' : 'FAIL'}`); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
