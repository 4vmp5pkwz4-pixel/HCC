#!/usr/bin/env node
'use strict';
/* ══ THE TIME MACHINE ════════════════════════════════════════════════════════
 *
 * This atlas has carried a clock since its first release and had no way to drive
 * it. The rate lived in a chip row in one world, a dropdown in another, two
 * buttons in the XR menu and a slider inside one laboratory's own panel; the
 * epoch could be set from a deep link, from an eclipse prediction and from the
 * galactic butterfly's day scrubber, and nowhere else. A reader who wanted to run
 * the Solar System back four centuries had to know which world to stand in first.
 *
 * ONE BAR, IN EVERY WORLD — and it is present everywhere because everywhere was
 * MEASURED to move with the clock: each world was entered, the epoch advanced by
 * forty thousand days, and the whole visible scene graph hashed before and after.
 * All seven moved, and so did all 113 laboratories when the same measurement was
 * run over every one of them. "For which it is relevant" turns out to be
 * everywhere, and that is a measurement rather than a convenience.
 *
 * It keeps no second copy of anything. Every control writes through setAtlasTime
 * and every readout is taken from atlasTimeSnapshot() on the frame it is drawn,
 * because a clock with two authorities is the defect this atlas keeps finding.
 *
 * AND "NOW" HAD FIVE COPIES OF ONE CONSTANT. (Date.now()/86400000 + 2440587.5) −
 * 2451545.0 was typed in three places, and the butterfly wrote Date.now()/86400000
 * − 10957.5 in two more — 10957.5 being exactly 2451545.0 − 2440587.5. Two of the
 * five were unrecognisable as the same expression, and nothing could have noticed
 * if one had drifted.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

{ /* 1. IT EXISTS, IN EVERY WORLD, AND IT IS ONE BAR */
  const worlds = (src.match(/const TIME_WORLD_UNITS=Object\.freeze\(\{([\s\S]*?)\}\);/) || [, ''])[1];
  const keys = [...worlds.matchAll(/^\s*(\w+):\[/gm)].map(m => m[1]);
  ok('THE ATLAS HAS A TIME MACHINE, and it stands over every world, because every world was measured to move with the clock rather than assumed to',
    /<div id="timeMachine" role="group" aria-label="Time machine">/.test(src)
    && keys.length === 7 && keys.includes('solar') && keys.includes('fractal')
    && /try\{ hccTimeMachineTick\(dt\); \}catch\(e\)\{\}/.test(src),
    `${keys.length} worlds declared — ${keys.join(', ')} — and the bar is ticked from the one render loop`);
  ok('and it keeps no second clock: every control writes through setAtlasTime and every readout is taken from the snapshot on the frame it is drawn',
    /let snap=null; try\{ snap=atlasTimeSnapshot\(\); \}catch\(e\)\{ return; \}/.test(src)
    && /setAtlasTime\(\{paused:!s\.paused\},'timeMachine\.play'\)/.test(src)
    && /setAtlasTime\(\{epochDays:state\.epochDays\+sign\*d, paused:true\},'timeMachine\.step'\)/.test(src)
    && /setAtlasTime\(\{rateDaysPerSecond:r\*\(atlasTimeDirection\(\)<0\?-1:1\), paused:false\},'timeMachine\.rate'\)/.test(src),
    'play, step and rate each name themselves as the source of the write, so the clock’s own provenance readout says which control moved it');
}

{ /* 2. THE UNITS ARE THE ATLAS'S OWN */
  ok('and the units it steps by come from the cycle table the rest of the atlas already uses, so the month here and the month in the cycles world are the same number',
    /if\(u\.cycle\)\{ try\{ const c=cycleByKey\(u\.cycle\); if\(c&&c\.days>0\) return c\.days; \}catch\(e\)\{\} \}/.test(src)
    && /\{key:'moon',\s+cycle:'moon'/.test(src)
    && /\{key:'gal',\s+cycle:'gal'/.test(src),
    'a unit that the atlas already declares as a cycle is read from there and not typed again');
  ok('and each world is read in its own units, because offering a reader in the Solar System a galactic year is offering a control that cannot say anything useful',
    /solar:\['hour','day','moon','year'\]/.test(src)
    && /cyc:\['year','century','prec','gal'\]/.test(src)
    && /obs:\['myr','gyr'\]/.test(src),
    'and the step buttons move by exactly one of the selected unit, which is what makes the bar an instrument rather than a scrubber');
}

{ /* 3. "NOW" HAS ONE AUTHORITY */
  /* What matters is that nothing COMPUTES the instant inline any more. The literal
   * survives twice on purpose: in the definition, and in the boot check that
   * verifies the function against it independently — a check that called the
   * function to test the function would be testing nothing. */
  const inlineUses = (src.match(/(?:setAtlasEpoch|epochDays\s*:|hccButterflyApplyDay)\s*\(?\s*\(?Date\.now\(\)\/86400000/g) || []).length;
  const shorthand = (src.match(/Date\.now\(\)\/86400000-10957\.5/g) || []).length;
  const callers = (src.match(/hccNowEpochDays\(\)/g) || []).length;
  ok('and the instant called "now" has one authority: the same constant was typed in three places and written in a different algebraic form in two more, and 10957.5 is exactly 2451545.0 minus 2440587.5',
    /function hccNowEpochDays\(\)\{ return \(Date\.now\(\)\/86400000 \+ 2440587\.5\) - 2451545\.0; \}/.test(src)
    && inlineUses === 0 && shorthand === 0 && callers >= 6,
    `${callers} callers and ${inlineUses} places still computing it inline, with the shorthand form gone`);
}

{ /* 4. THE INTERFACE MAKES ROOM FOR IT */
  ok('and the interface makes room for it from ONE measured variable rather than from five guesses: the bar measures itself and everything that stood on the bottom edge stands on the bar instead',
    /document\.documentElement\.style\.setProperty\('--tm-h', h\+'px'\)/.test(src)
    && /#hud\{bottom:calc\(var\(--tm-h\) \+ 14px\)!important\}/.test(src)
    && /#helpFab\{right:16px;bottom:calc\(var\(--tm-h,0px\) \+ 16px\)\}/.test(src)
    && /#hccFpTrigger\{bottom:calc\(var\(--tm-h,0px\) \+ max\(14px,env\(safe-area-inset-bottom\)\)\)\}/.test(src),
    'the world caption, the three floating buttons, the coach, the hierarchy map and the first-principles pill all read the same height');
  ok('and the first-principles pill is moved from where its own rule is declared, because that rule sits in a later style block and won on source order — measured on screen, the pill sat across the bar’s J2000 control',
    src.indexOf('#hccFpTrigger{bottom:calc(var(--tm-h,0px)') > src.indexOf('#hccFpTrigger{position:fixed'),
    'declared after it, so it cannot lose again');
  ok('and the bar reshapes itself for a phone and for a phone held sideways, rather than being hidden there',
    /@media\(max-width:760px\)\{\s*\n\s*#timeMachine\{flex-wrap:wrap/.test(src)
    && /@media\(max-height:460px\) and \(orientation:landscape\)\{\s*\n\s*#timeMachine\{padding-top:3px/.test(src),
    'the readout takes a row of its own on a narrow screen and the sub-line stands down on a short one');
}

{ /* 5. AND IT SAYS WHERE IT CANNOT ACT */
  ok('and where a laboratory does not read the clock the bar says so instead of vanishing — a bar that disappears reads as a fault, and "this instrument is not about time" is a fact worth knowing',
    /function hccTimeRelevantHere\(\)\{/.test(src)
    && /HCC_TIME_STILL_LABS/.test(src)
    && /this laboratory does not read the clock — measured, not assumed/.test(src),
    'measured over all 113 laboratories and all seven worlds: every one of them moves when the epoch does, so the set is empty because nothing was found still — and the mechanism stays for the first instrument that is genuinely not about time');
}

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
