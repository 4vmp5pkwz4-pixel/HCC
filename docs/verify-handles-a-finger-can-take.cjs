#!/usr/bin/env node
'use strict';
/* ══ HANDLES A FINGER CAN TAKE (v4.371) ══════════════════════════════════════════════════════════════════════════
 *   Reported: the slider handles are too small on small screens. The touch rule's 28-px thumb was outranked by the
 *   premium skin's 15-px one, so every phone slider wore a 14–16 px thumb.
 *   1. one rule for every slider, after the premium skin in the cascade and marked !important: 18 px with a mouse,
 *      28 px under a finger or under 820 px, on a grab band of at least 38 px, the thumb centred on a 6-px track
 *   2. the sheet grips widen with them; on a phone the Agora button leaves the time machine until an agent is on stage,
 *      and the Navigator's Start opens the Agora at any time
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const premium = SRC.indexOf('body.premium-visuals input[type=range]::-webkit-slider-thumb{'), mine = SRC.indexOf('html body input[type=range]::-webkit-slider-thumb{width:18px!important;height:18px!important;margin-top:-7px!important}');
const coarse = SRC.slice(mine, mine + 1600);
ok('every slider: 18 px with a mouse; 28 px under a finger or below 820 px, centred on a 6-px track, on a grab band of 38 px — after the premium skin and marked !important, so nothing outranks it',
  premium > 0 && mine > premium && /@media \(pointer:coarse\),\(max-width:820px\)\{/.test(coarse) && /input\[type=range\]::-webkit-slider-thumb\{width:28px!important;height:28px!important;margin-top:-11px!important\}/.test(coarse)
  && /input\[type=range\]::-moz-range-thumb\{width:28px!important;height:28px!important\}/.test(coarse) && /input\[type=range\]::-webkit-slider-runnable-track\{height:6px!important\}/.test(coarse) && /input\[type=range\]\{min-height:38px!important\}/.test(coarse)
  && (6 - 28) / 2 === -11 && (4 - 18) / 2 === -7, 'thumb margins (track − thumb)/2: −7 px on the 4-px desktop track, −11 px on the 6-px touch track');
ok('the sheet grips widen with the handles; on a phone the Agora button leaves the time machine until an agent is on stage, and the Navigator opens the Agora at any time',
  /html body #ctl \.sheetGrip::after,html body #selCard \.selGrip::after\{width:60px!important;height:6px!important\}/.test(coarse) && /@media \(max-width:560px\)\{ #timeMachine #tmAgora:not\(\.on\)\{display:none\} \}/.test(SRC)
  && /\['Agora · agents on the stage','Agents drive the atlas in front of you; the shared journal; the demonstration agent\.',\(\)=>\{ try\{ agoraOpen\(true\); \}catch\(e\)\{\} \}\]/.test(SRC));
ok('the time machine\'s handle is larger still (v4.372): 24 px with a mouse and 34 px under a finger or below 820 px, ringed in gold, centred on its track, on a 44-px grab band — after the rule for every slider',
  SRC.indexOf('html body #tmRate input[type=range]::-webkit-slider-thumb{width:24px!important;height:24px!important;margin-top:-10px!important;') > mine
  && /html body #tmRate input\[type=range\]::-webkit-slider-thumb\{width:34px!important;height:34px!important;margin-top:-14px!important\}/.test(SRC) && /html body #tmRate input\[type=range\]\{min-height:44px!important\}/.test(SRC)
  && (4 - 24) / 2 === -10 && (6 - 34) / 2 === -14);
console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
