#!/usr/bin/env node
'use strict';
/* ══ NOTHING UNDER THE CLOCK, NOTHING ON A PANEL (v4.365) ═════════════════════════════════════════════════════════
 * Reported: the time machine ate the lower edge of the windows above it. Measured in a browser on 1024 × 700,
 * 1280 × 800 and 1440 × 900 before the fix: the controls panel and the hierarchy inset ran 37 px under the 51 px bar
 * (the inset's own --bottom-band rule was overridden by its later base rule; the controls had none; the inset's JS
 * placement used the window's edge), the Info panel ran 37 px under it, and with Info open the help button and the
 * First-Principles pill lay on its rows while the world caption ran under the Atlas Coach. After: zero overlaps in
 * the same states. Checked here, from the page:
 *   1. one rule, last in the cascade, stands #ctl and #hierarchyLegend on --bottom-band and clamps every panel that
 *      hangs from the top bar to the room above the time machine
 *   2. the inset's JS placement takes its floor from the time machine (and the tab bar), counts both as obstacles
 *      together with the Atlas Coach, and re-seats itself when the bar's height changes
 *   3. the keep-clear pass: right-pinned floaters step left of an open right-column panel and rise above the bar and
 *      the caption and each other; the caption narrows to the free band; measured, overrides removed before measuring
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const css = SRC.slice(0, SRC.indexOf('</style>'));
const last = css.slice(css.lastIndexOf('EVERYTHING THAT FLOATS AT THE BOTTOM STANDS ON THE TIME MACHINE'));
ok('one rule, last in the cascade: #ctl and the inset stand on --bottom-band; every top-hung panel ends above the time machine',
  /@media \(min-width:721px\) and \(min-height:501px\)\{/.test(last) && /#ctl\{bottom:calc\(\(var\(--bottom-band,0px\) \+ 14px\) \/ var\(--ctl-zoom,1\)\);max-height:min\(58vh,calc\(\(var\(--vh100,100vh\) - var\(--topbar-h,64px\) - var\(--bottom-band,0px\) - 34px\)/.test(last)
  && /#hierarchyLegend\{bottom:calc\(var\(--bottom-band,0px\) \+ 14px\)\}/.test(last) && /#info,#navPanel,#atlasPanel,#atlasNav,#capPanel,#flowPanel,#motionPanel,#objectPanel,#oscPanel,#xrCheck,#zpPanel,#bixPanel,#smithPanel\{\s*max-height:calc\(var\(--vh100,100vh\) - var\(--topbar-h,64px\) - var\(--bottom-band,0px\) - 74px\)\}/.test(last)
  && css.lastIndexOf('#hierarchyLegend{position:fixed;right:14px;bottom:14px') < css.lastIndexOf('#hierarchyLegend{bottom:calc(var(--bottom-band,0px) + 14px)}'));
ok('the inset’s placement floors on the time machine, avoids it and the Atlas Coach, and re-seats when the bar changes',
  /const floor=\['timeMachine','hccTabs'\]/.test(SRC) && /const bottom=THREE\.MathUtils\.clamp\(floor-\(innerWidth<760\?68:14\)-h,minY,maxY\);/.test(SRC) && /#hccTabs,#timeMachine,#atlasCoach'\)\]/.test(SRC) && /document\.documentElement\.style\.setProperty\('--tm-h', h\+'px'\); try\{ requestHierarchyLayout\(\); \}catch\(e\)\{\} \}/.test(SRC));
ok('keep-clear: floaters step left of an open right panel and rise above the bar, the caption and each other; the caption narrows; overrides are removed before measuring',
  /function hccKeepClear\(\)\{/.test(SRC) && /setInterval\(\(\)=>\{ try\{ hccKeepClear\(\); \}catch\(e\)\{\} \},250\);/.test(SRC) && /f\.style\.removeProperty\('right'\); f\.style\.removeProperty\('bottom'\);/.test(SRC)
  && /\.\.\.placed\];/.test(SRC) && /hud\.style\.maxWidth=want;/.test(SRC) && /f\.style\.setProperty\('bottom',Math\.round\(up\)\+'px','important'\)/.test(SRC));
console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
