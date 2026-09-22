#!/usr/bin/env node
'use strict';
/* ══ THE PHONE IS ONE STACK, AND EVERY BAND IS READ FROM THE ONE BELOW IT ═════
 *
 * The file's own doctrine, two hundred lines above where this was broken: "A phone
 * has one column and it is a STACK, so the bands are declared once, in order, and
 * everything above reads the band below it."
 *
 * MEASURED on six iPhone viewports (SE, 14, Pro Max, portrait and landscape) in all
 * seven worlds — forty-two states, with the same corrected probe run against the
 * tree before and the tree after, because a measurement that changes its own
 * instrument between the two readings is not a comparison:
 *
 *     interactive-on-interactive overlaps   599 instances / 52 distinct pairs
 *     top bar in portrait                   157, 157 and 160 px — a fifth of the screen
 *     the floor of the viewport             #timeMachine, 106 px, over #hccTabs
 *
 * Four faults, each one a constant that had stopped being true:
 *
 *  1. THE TIME MACHINE TOOK THE FLOOR. It arrived after the stack was declared,
 *     took bottom:0 and z-index 120, and stood ON the navigation bar: 100 per cent
 *     of #hccTabs covered in 42 of 42 states. An entire navigation bar, in the DOM,
 *     rendering, passing every logic test, unreachable by a finger.
 *
 *  2. NINE RULES ADDED THE FLOOR UP BY HAND, as --tabs-h + --insp-h, and had been
 *     tuned against the wrong geometry: the Controls sheet ended at bottom 118 px,
 *     which clears a bar starting at 739 and does not clear one starting at 683.
 *     Raising the clock moved the sheet 43 px into it and put the transport buttons
 *     on the sheet's own controls.
 *
 *  3. FOUR HEADER BUTTONS EACH HAD A HAND-WRITTEN right:. 4, 12, 42 and 72 on a
 *     pointer; 8, 60, 48 and 88 on a phone; four widths and three tops. They landed
 *     on each other and on the panel's first row of controls.
 *
 *  4. SEVEN WORLD BUTTONS AT A 44 px MINIMUM DO NOT FIT ACROSS 390 px, so the top
 *     bar wrapped them to three rows — and the clock, the one element given a second
 *     COLUMN with no ROW declared, was auto-placed onto a fourth line of its own.
 *
 * After, with the same probe: 7 instances and 84 px of top bar — and all seven are a
 * PRE-EXISTING transient in the FBS control rows, not this work: three runs of the
 * same probe against the unmodified tree found that same family 14, 13 and 11 times,
 * and it varies run to run because the parameter dock moves rows while the probe is
 * reading them. Everything this release was about measures zero.
 *
 * The floating first-principles pill, which was the last of the overlaps this work
 * did own, is no longer on a phone at all: it was anchored to the top of the sheet
 * stack, and in S3 — catalogue and Controls both open, the ordinary state there — the
 * clamp that kept it on screen put it across the catalogue's own pin, fold and close
 * controls. Two other placements were measured and were WORSE (57 and 37 instances).
 * It stands down where the merged bar IS the navigation, exactly as #panelDock does,
 * and the lens keeps a door in the More menu.
 *
 * Also measured: two controls cut off by the edge of the screen before (the rate
 * stepper at 14 per cent visible, an oscillator step at 59) and none after; and the
 * floor of the viewport carried #timeMachine in every state before and carries only
 * #hccTabs now.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

{ /* 1. THE BANDS ARE DECLARED ONCE, IN ORDER */
  ok('the floor is composed once and named, and nothing below the stack adds it up for itself',
    /--bottom-band:calc\(var\(--tabs-h,0px\) \+ var\(--tm-h,0px\)\)/.test(src)
    && /--sheet-floor:calc\(var\(--tabs-h,0px\) \+ var\(--tm-h,0px\) \+ var\(--insp-h,0px\)\)/.test(src)
    && /--stack-top:calc\(var\(--sheet-floor\) \+ 10px \+ var\(--ctl-h,0px\) \+ var\(--lab-h,0px\)\)/.test(src),
    '--bottom-band for what stands on the clock, --sheet-floor for the sheets, --stack-top for what stands on the sheets');
  ok('and the clock stands ON the navigation bar rather than over it — 100 per cent of #hccTabs was covered in 42 of 42 states by a bar with twice its z-index',
    /#timeMachine\{position:fixed;left:0;right:0;bottom:var\(--tabs-h,0px\);z-index:120;/.test(src)
    && !/#timeMachine\{position:fixed;left:0;right:0;bottom:0;/.test(src),
    'the bar reads the floor instead of claiming it');
  ok('and NO rule in the stylesheet still adds the floor up by hand, which is the fault that made every one of those nine rules wrong at once',
    !/calc\(var\(--tabs-h\) \+ var\(--insp-h\)/.test(src)
    && !/bottom:calc\(var\(--tabs-h,48px\) \+ 8px\)/.test(src)
    && !/bottom:calc\(var\(--tabs-h\) \+ 6px\)!important/.test(src),
    'every floor expression resolves through --bottom-band or --sheet-floor');
  ok('and the shared sheet budget counts the same floor the sheets stand on, rather than a shorter one',
    /const bottomBand=num\('--tabs-h'\)\+num\('--tm-h'\)\+num\('--insp-h'\)\+18;/.test(src)
    && /const bottom=viewH-\(num\('--tabs-h',48\)\+num\('--tm-h',0\)\+8\);/.test(src),
    'the portrait budget and the landscape column both');
}

{ /* 2. A BAND THAT IS NOT THERE PUBLISHES ZERO, AND SAYS SO HONESTLY */
  ok('the sheet band publishes zero when the sheet is closed, and it decides that from display, hidden and a height rather than from offsetParent — which is null BY SPEC for the fixed element this is',
    /const shown=!!ctl&&!ctl\.hidden&&getComputedStyle\(ctl\)\.display!=='none';/.test(src)
    && !/const shown=ctl&&ctl\.offsetParent!==null&&!ctl\.hidden;/.test(src),
    'the variable read 0px with the sheet filling a third of the screen, and everything anchored to it sat on the sheet');
  ok('and the clock publishes zero when it is hidden, so the composed floor is the floor that is showing',
    /const h=el\.hidden\?0:Math\.round\(el\.getBoundingClientRect\(\)\.height\);/.test(src),
    'a band is a measurement of what is showing, or it is a memory');
}

{ /* 2b. AND THE TOP OF THE STACK IS MEASURED, NOT ADDED UP */
  ok('the top of the sheet stack is MEASURED on the tick, because the catalogue\u2019s own inset is a min() and a composed sum does not know when the clamp has fired',
    /for\(const id of PHONE_SHEET_IDS\)\{/.test(src)
    && /WHICH PANELS THOSE ARE IS DECLARED, NOT INFERRED/.test(src)
    && /if\(!narrowStack\) document\.documentElement\.style\.removeProperty\('--stack-top'\);/.test(src)
    && /--stack-top:calc\(var\(--sheet-floor\) \+ 10px \+ var\(--ctl-h,0px\) \+ var\(--lab-h,0px\)\)/.test(src),
    'the declared sum stays as the fallback for a desk, for landscape and for the frames before the first tick');
  ok('and the source states WHY a maximum is safe for this band and was not safe for --ctl-top, which is the same shape of expression one floor down',
    /A MAXIMUM IS SAFE HERE AND IS NOT SAFE FOR --ctl-top/.test(src),
    '--ctl-top is read BY sheets and feeds back into them; --stack-top is read only by what stands above every sheet');
  ok('and the first-principles pill publishes its own band so the freshness banner can stand ON it rather than across it',
    /document\.documentElement\.style\.setProperty\('--fp-h',Math\.max\(0,fh\)\+'px'\);/.test(src)
    && /body\.has-tabs #freshBar\{bottom:min\(calc\(var\(--stack-top, 40vh\) \+ 10px \+ var\(--fp-h,0px\) \+ 10px\)/.test(src),
    'measured before: the banner\u2019s reload and hide buttons across the pill, 1468 px\u00b2 and 690 px\u00b2, in 14 of 42 states');
}

{ /* 2c. AND THE SCRIPT'S IDEA OF THE STACK IS THE STYLESHEET'S */
  const decl = (src.match(/const PHONE_SHEET_IDS=\[([\s\S]*?)\];/) || [, ''])[1]
    .match(/'([a-zA-Z]+)'/g) || [];
  const ids = decl.map(x => x.slice(1, -1));
  const css = (src.match(/#ctl,#info,#atlasNav,#labPanel,#zpPanel,#bixPanel,#smithPanel,#capPanel,#flowPanel,#navPanel,\s*\n\s*#objectPanel,#atlasPanel,#oscPanel,#vectorPanel,#motionPanel,#xrCheck\{/g) || []);
  const cssIds = ['ctl','info','atlasNav','labPanel','zpPanel','bixPanel','smithPanel','capPanel',
    'flowPanel','navPanel','objectPanel','atlasPanel','oscPanel','vectorPanel','motionPanel','xrCheck'];
  ok('the script\u2019s list of phone bottom sheets IS the stylesheet\u2019s list, so the two cannot drift — the publisher that inferred it instead matched nothing and published nothing, silently',
    ids.length === cssIds.length && ids.every((v, i) => v === cssIds[i]) && css.length >= 3,
    `${ids.length} declared, and the selector list appears ${css.length} times in the sheet rules`);
  ok('and it is a DIFFERENT list from PANEL_IDS, which answers a different question and does not name labPanel — the one sheet whose absence changed the answer',
    /const PANEL_IDS=\[/.test(src) && !/const PANEL_IDS=\[[^\]]*'labPanel'/.test(src)
    && /PANEL_IDS is\s*\n\s+a different list for a different question and does not name labPanel/.test(src),
    'naming the difference is what stops the next reader collapsing them');
}

{ /* 3. THE PANEL HEADER IS A RAIL */
  ok('the four header controls are laid out by ONE flex row instead of four hand-written right: offsets at four widths and three tops',
    /\.panel > \.panelRail\{\s*\n\s+position:sticky; top:-14px; z-index:101;/.test(src)
    && /justify-content:flex-end; align-items:center; gap:var\(--hdr-gap\)/.test(src)
    && /\.panelRail > \.panel-collapser\{order:4\}/.test(src)
    && /\.panelRail > \.closeBtn\{order:1\}/.test(src),
    'role order, edge-most last, so the dismissal is the one nearest the thumb');
  ok('and it is ADOPTED on the geometry tick from whatever the panel carries, because four separate code paths append these buttons and none of them knows about the others',
    /function panelRailSync\(el\)\{/.test(src)
    && /try\{ panelRailSyncAll\(\); \}catch\(e\)\{\}/.test(src)
    && /function panelRailBtn\(el,cls\)\{/.test(src),
    'a button added by a path written later joins the row without that path being told');
  ok('and the helper is a function DECLARATION, because the first user of it is sixty thousand lines above the declaration and a const would still be in its temporal dead zone there',
    /a DECLARATION and not a const/.test(src)
    && !/const panelRailBtn=\(el,cls\)=>/.test(src),
    'the first run threw and took the whole geometry tick with it — --topbar-h, --ctl-h and --tm-h were all unset');
  ok('and the rail argues at a specificity that can win, because `.panel button{min-width:44px!important}` is more specific than `.panelRail > *` and overruled the first form without a word',
    /\.panel \.panelRail > \*, \.panelRail > \*\{/.test(src)
    && /width:var\(--hdr-btn\)!important;height:var\(--hdr-btn\)!important;/.test(src)
    && /\.panelRail > \*::after\{content:'';position:absolute;left:50%;top:50%;\s*\n\s+width:44px;height:44px;/.test(src),
    'painted 34, reached at 44 — the same split .modebtn already makes in landscape');
}

{ /* 4. THE TOP BAR IS TWO ROWS AND NOT FOUR */
  ok('the top bar declares its ROWS as well as its columns — the clock had a column and no row, so auto-placement gave it a line of its own under the world switcher',
    /#topbar \.title\{grid-column:1;grid-row:1;/.test(src)
    && /#clock\{grid-column:2;grid-row:1;position:static!important;justify-self:end\}/.test(src)
    && /#modeRow\{grid-column:1 \/ -1;grid-row:2\}/.test(src),
    '26 px of a fixed bar spent on a row that existed because nobody said which row');
  ok('and the world switcher is one line that scrolls in portrait rather than three that wrap — seven 44 px destinations do not fit across 390 px, and landscape had already answered by deleting the row',
    /#modeRow\{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto;/.test(src)
    && /#modeRow \.modebtn\{flex:0 0 auto;scroll-snap-align:start;white-space:nowrap\}/.test(src),
    'measured 157, 157 and 160 px before and 84 after, on the same three viewports');
}

{ /* 4b. AND THE LAST OVERLAP THIS WORK OWNED WAS ANSWERED BY REMOVING A CONTROL */
  ok('the source records that the pill\u2019s placement was decided by measurement rather than by taste, and that both alternatives were measured and were worse',
    /WHERE THE PILL STANDS WAS DECIDED BY MEASUREMENT, TWICE, AGAINST ME/.test(src)
    && /left edge, both orientations\s+57/.test(src)
    && /left edge, landscape only\s+37/.test(src),
    'a rejected alternative that is not written down is one the next reader will try again');
  ok('and the answer in the end was not a third placement but the argument #panelDock already settled on this screen: a floating control duplicating a destination the bottom bar carries is a SECOND navigation competing for the same pixels',
    /#hccFpTrigger\{display:none!important\}/.test(src)
    && /AND THE FLOATING PILL STANDS DOWN WHERE THE BAR IS THE NAVIGATION/.test(src),
    '44 px of scene returned on every phone in every world, and the last overlap this work owned goes with it');
  ok('and the destination survived the control: the lens has a door in the More menu, bound where the opener is in scope',
    /id="fpLensBtn"/.test(src)
    && /const mm=document\.getElementById\('fpLensBtn'\);/.test(src),
    'reachable, not lost \u2014 removing the only entry to a whole surface would have been worse than the graze');
}

{ /* 5. A CONTAINER'S MINIMUM AGREES WITH ITS CONTENTS */
  ok('the transport bar’s rate group declares a minimum its contents can keep, instead of being told it may be zero while holding 93 px of controls',
    /#tmRate\{flex:1 1 96px;min-width:96px\}/.test(src)
    && !/#tmRate\{flex:1 1 44px;min-width:0\}/.test(src)
    && /#tmUnits\{flex:1 1 44px;min-width:44px;overflow-x:auto;/.test(src),
    'the stepper stood at x = 384..428 on a 390 px screen — 14 per cent of it on the glass');
}

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
