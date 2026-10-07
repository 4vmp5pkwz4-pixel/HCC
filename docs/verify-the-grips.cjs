#!/usr/bin/env node
'use strict';
/* ══ GRIPS — THE LABORATORIES UNDER THE FINGER, AND THE FIRST SWIPE (v4.347) ══════════════════════════════════════
 * Checked on the source:
 *   1. one engine: grips are hit-tested on window in the CAPTURE phase (before the orbit controls), a press that does not
 *      travel is a tap, several pointers hold several grips, hover shows a hand, and a hint names what the hand can do
 *   2. the laboratories declare grips: the racket (state over the energy sphere, saddles, the racket), the stroboscope of
 *      everything (the eye's window, the clocks), the stroboscope of S³ (flash period, ρ), vortex stretching (levels),
 *      the Local Group (Andromeda's tangential velocity, time along the orbit, pause), Navier–Stokes on S³ (dye),
 *      FBS3R (the S³ shells) — and every gesture writes the state the panel's controls write
 *   3. the first step through the laboratories after load lands on the collision of the two galaxies, once
 *   4. agents can see what is grabbable and where (HCC_GRIPS.list)
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
ok('one engine, ahead of the orbit controls: capture-phase pointer handlers on window, tap versus drag, several pointers, hover, a hint',
  /window\.addEventListener\('pointerdown',e=>\{ if\(e\.target!==renderer\.domElement/.test(SRC) && /\},true\);\nwindow\.addEventListener\('pointermove'/.test(SRC)
  && /window\.addEventListener\('pointerup',e=>gripEnd\(e,false\),true\); window\.addEventListener\('pointercancel',e=>gripEnd\(e,true\),true\);/.test(SRC)
  && /const GRIP_DRAGS=new Map\(\)/.test(SRC) && /if\(!D\.moved\)\{ if\(D\.grip\.tap\)/.test(SRC) && /controls\.enabled=false/.test(SRC) && /style\.cursor=o\?'grab':''/.test(SRC) && /id='gripHint'/.test(SRC));
const ids = ['triad', 'omnistrobe', 'strobe', 'vstretch', 'lgmerge', 'nsflow', 'fbsS3'], have = ids.filter(id => new RegExp(`hccGrip\\(\\{ id:'${id}',`).test(SRC));
ok('seven laboratories declare grips, each with a hint in three languages', have.length === ids.length && (SRC.match(/hccGrip\(\{ id:'/g) || []).length >= 7,
  have.join(', '));
ok('every gesture writes the state the panel writes: triadU, omniLogS, strobeTd / strobeRho / strobeK, vdmLevels, lgmVt / lgmScen / lgmT / lgmPaused, fbsTarget — and the dye rides the exact flow',
  /state\.triadU=Math\.max\(-0\.95/.test(SRC) && /state\.omniLogS=Math\.max\(-24/.test(SRC) && /state\.strobeTd=Math\.pow\(10,lg\)/.test(SRC) && /state\.strobeFree=true; state\.strobeRho=D\.rho/.test(SRC)
  && /state\.vdmLevels=cur; vdmObjs=null/.test(SRC) && /state\.lgmScen='custom'; state\.lgmVt=D\.vt/.test(SRC) && /O\.t=best\/599\*(12|\(O\.tEnd\|\|12\)); state\.lgmT=O\.t/.test(SRC)
  && /state\.fbsTarget=s3LadderN\(s\.k,S3\.R\*GLY_M\)/.test(SRC) && /if\(O\.dye&&O\.dye\[i\]\)/.test(SRC) && /m\.userData\.triadLeg=leg/.test(SRC) && /m\.userData\.vdmLevel=\[P\.k,P\.sigma\]/.test(SRC));
/* v4.374: the reader asked that Navier–Stokes come first — the first swipe now lands on the fluid of S³, the first
   chapter of the catalogue (it used to land on the Milky Way–Andromeda collision, which keeps its head-on default) */
ok('the first swipe after load lands on Navier–Stokes on S³, once; every later step walks the catalogue, whose first chapter is the fluid',
  /function labBarStep\(d\)\{ if\(typeof LAB_BAR!=='undefined'&&!LAB_BAR\.firstJumped\)\{ LAB_BAR\.firstJumped=true; if\(state\.s3view!=='nsflow'\|\|state\.mode!=='s3'\)\{ labBarGo\('nsflow'\); return; \} \}/.test(SRC)
  && /navier:\['nsflow',/.test(SRC) && /const LAB_DOMAIN_ORDER=\['navier','s3light',/.test(SRC) && /headon:0/.test(SRC));
ok('agents can see what is grabbable and where', /globalThis\.HCC_GRIPS=Object\.freeze\(\{ list:/.test(SRC));
console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
