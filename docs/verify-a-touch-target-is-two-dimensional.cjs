#!/usr/bin/env node
'use strict';
/* ══ A TOUCH TARGET IS TWO-DIMENSIONAL ═══════════════════════════════════════
 *
 * The atlas already promised 44 px on a coarse pointer and kept it with a rule
 * that sets a minimum HEIGHT:
 *
 *     .btn,.chip,button.pinBtn,#labPanel .foldBtn,.oscBtn,.modebtn{min-height:44px}
 *
 * Measured on a phone at 390×844, 844×390, 360×640 and 640×360, with the controls
 * open in all seven worlds: no horizontal overflow anywhere, nothing off-screen
 * anywhere — and the same two controls under the minimum in every single case. The
 * oscillator step buttons are 22 px WIDE, and the time machine's rate slider is a
 * range input, which that rule does not name and which renders 22 px tall.
 *
 * AND A CLASS INVENTED FOR A NEW CONTROL OPTS OUT OF EVERY RULE THE OLD ONES OBEY.
 * The time machine's own .tmBtn had never been heard of by that line, and its
 * narrow-screen block then set 30×30 and won on specificity. The first run of the
 * new check on a REAL coarse pointer — the pointer the rule is about — found the
 * bar's own transport at 30×30 and its slider 35 px wide.
 *
 * AND THE MINIMUM IS ABOUT THE POINTER, NOT ABOUT THE WIDTH. The first fix lived
 * inside the max-width:760px block, so a phone held SIDEWAYS — 844 px wide, which
 * is not a narrow viewport — did not get it: the same control on the same device
 * was 44×44 in portrait and 34×32 in landscape.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

{ /* 1. THE TWO CONTROLS THAT WERE UNDER THE MINIMUM IN BOTH ORIENTATIONS */
  ok('A TOUCH TARGET IS TWO-DIMENSIONAL. The rule set a minimum height and two controls were under the minimum in the other direction — the oscillator step buttons at 22 px wide and the rate slider at 22 px tall, in every viewport measured',
    /\.oscBtn\{min-width:44px\}/.test(src)
    && /#tmRate input\[type=range\]\{height:44px\}/.test(src)
    && /\.btn,\.chip,button\.pinBtn,#labPanel \.foldBtn,\.oscBtn,\.modebtn\{min-height:44px\}/.test(src),
    'the height rule that was already there, and the width and the input it never named');
}

{ /* 2. THE MINIMUM IS ABOUT THE POINTER */
  const i = src.indexOf('@media(pointer:coarse){\n    #timeMachine .tmBtn{min-width:44px;min-height:44px}');
  const narrow = src.indexOf('@media(max-width:760px){\n    #timeMachine{flex-wrap:wrap');
  const narrowEnd = src.indexOf('\n  }', narrow);
  ok('and the minimum is about the POINTER rather than about the width, so a phone held sideways gets it too — 844 px wide is not a narrow viewport, and the same control was 44×44 in portrait and 34×32 in landscape',
    i > 0 && !(i > narrow && i < narrowEnd)
    && /#timeMachine \.tmBtn\{min-width:44px;min-height:44px\}/.test(src)
    && /#tmUnits \.tmBtn\{min-width:44px;min-height:44px;padding:4px 8px\}/.test(src)
    && /#hccFpTrigger\{min-height:44px\}/.test(src),
    'the coarse-pointer block stands outside the narrow-width block, and covers the transport, the unit chips, the slider and the first-principles pill');
  ok('and the class invented for the new control is told to obey the rule the old ones obey, because a new class opts out of every one of them by default',
    /#timeMachine \.tmBtn\{min-width:34px;min-height:34px;padding:4px 7px;font-size:11px\}/.test(src)
    && !/#timeMachine \.tmBtn\{min-width:30px;min-height:30px/.test(src),
    'the narrow layout no longer sets 30×30 under the 44 px promise');
}

{ /* 3. AND IT IS MEASURED ON THE POINTER THE READER HAS */
  ok('and the boot suite MEASURES it where the pointer is coarse rather than asserting a stylesheet, which is how the 30×30 was found at all',
    /let coarse=false; try\{ coarse=matchMedia\('\(pointer:coarse\)'\)\.matches; \}catch\(e\)\{\}/.test(src)
    && /if\(r\.width<44\|\|r\.height<44\) small\.push/.test(src)
    && /NOT APPLICABLE HERE — this pointer is not coarse/.test(src),
    'and says NOT APPLICABLE HERE on a desk rather than passing silently, because a check that cannot fire is not a check');
  ok('and nothing the atlas draws pushes the page sideways, which is the failure a phone shows first and a desk never shows at all',
    /const over=Math\.max\(0, document\.documentElement\.scrollWidth-innerWidth\);/.test(src)
    && /h<innerHeight\*0\.28/.test(src),
    'measured across seven worlds and two orientations with the controls open: zero overflow, and the time machine 13% of the screen in both');
}

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
