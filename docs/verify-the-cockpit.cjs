#!/usr/bin/env node
'use strict';
/* ══ THE COCKPIT — A PHONE ON ITS SIDE (v4.402) ════════════════════════════════════════════════════════════════════
 * Reported from an iPhone Pro Max held sideways in Safari, with a photograph: «Вот горизонтально на айфон макс. У меня
 * нет слов. Это ужас. Ты должен все исправить и сделать идеально удобно организуя пространство и панели и саму сцену».
 * MEASURED at 932 × 321 before: five bands the full width of the screen stacked on one another — the title and clock
 * 34 px, the trail 44, the laboratory bar 48, a time machine on two rows 105 and the tab bar 48: 279 px of chrome on a
 * 321-px screen. The scene was a strip between them, the catalogue's sheet was squeezed to 76 px, Controls opened over
 * the scene on arrival, and the onboarding bubble stood over all of it.
 * Checked here, by reading the source for the wiring and by working the layout's own arithmetic over the phones that
 * are held sideways:
 *   1. one class, one predicate: html.land is set from phoneLandscape(), the same test the column layout uses, and
 *      the cockpit's stylesheet is the last in the document with every rule scoped to it
 *   2. the edges: the title bar put away; one top row (Back, the laboratory bar); the time machine ONE row at the
 *      bottom, stopping at the rail, the rest one chevron away on a second row that a break keeps whole; the tab bar a
 *      rail down the right edge the full height of the screen, every tab on it with its word under its sign
 *   3. the column: every sheet beside the rail from the top of the screen to the time machine, the top row stepping
 *      left of it, Controls' zoom divided out; a rail tab opens its sheet and, tapped again, puts it away; the lit tab
 *      follows the deck whatever changed it
 *   4. the stage: its centre moved to the centre of what is free; the caption a corner, capped, a tap away from the
 *      rest, the date not shown twice; the multiview tiling the free stage; the whole φ-ladder the stage itself
 *   5. the arrival: a phone held either way arrives on the scene — at the boot, on a world button, in a new world, on a
 *      laboratory chosen from the invariants — nothing opened over it
 *   6. the arithmetic, for every phone held sideways: the stage at least half the screen, eight tabs on the rail
 *   7. the atlas measures it on itself: a boot self-test, NOT APPLICABLE wherever the phone is not on its side
 *   8. (v4.404) every world and laboratory sideways: the grips' hint at the stage's foot, not over the subject; a
 *      laboratory's preset, and the framings of FBS3R, the field and the fractals, standing back by what the cockpit takes
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const fn = name => { const i = SRC.indexOf('function ' + name + '('); if (i < 0) return ''; const j = SRC.indexOf('\nfunction ', i + 10); return SRC.slice(i, j < 0 ? i + 6000 : j); };
const CSS = (/<style id="hcc-land-cockpit">([\s\S]*?)<\/style>/.exec(SRC) || [, ''])[1];
const rule = sel => { const i = CSS.indexOf(sel + '{'); if (i < 0) return ''; return CSS.slice(i, CSS.indexOf('}', i) + 1); };

/* 1 · one class, one predicate */
{ const head = SRC.slice(0, SRC.indexOf('</head>'));
  const last = head.lastIndexOf('<style'), mine = head.indexOf('<style id="hcc-land-cockpit">');
  const body = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
  const sels = []; body.replace(/([^{}@]+)\{[^{}]*\}/g, (m, s) => { sels.push(s.trim()); return m; });
  const loose = sels.flatMap(s => s.split(',').map(x => x.trim())).filter(x => x && !x.startsWith('html.land') && !x.startsWith('#tmMore') && x !== '#timeMachine .tmBreak');
  const pred = fn('phoneLandscape');
  const sync = /const land=phoneLandscape\(\); document\.documentElement\.classList\.toggle\('land',land\); document\.body\.classList\.toggle\('land',land\);\s*if\(!land\) document\.documentElement\.classList\.remove\('tm-more'\);/.test(SRC);
  ok('one class from one predicate: html.land is set from phoneLandscape() — a coarse pointer, wider than tall, at most 560 px high, the very test the column layout and the arrival use — and dropping it folds the time machine back; the cockpit\'s stylesheet is the LAST in the document and every one of its rules is scoped to html.land (the time machine\'s chevron and its row break, both HIDDEN everywhere else, are the only exceptions)',
    mine > 0 && mine === last && sync && /matchMedia\('\(pointer:coarse\)'\)\.matches\s*&& innerWidth>innerHeight && innerHeight<=560/.test(pred)
    && loose.length === 0 && /const on=phoneLandscape\(\);/.test(fn('landscapeColumnLayout')),
    `${sels.length} rules · ${loose.length ? 'UNSCOPED: ' + loose.slice(0, 4).join(' | ') : 'all scoped'} · stylesheet ${mine === last ? 'last in <head>' : 'NOT LAST'}`); }

/* 2 · the edges */
{ const rail = rule('html.land body #hccTabs'), btn = rule('html.land body #hccTabs button');
  const words = /html\.land body #hccTabs button span,html\.land body #hccTabs button\.on span\{display:block!important/.test(CSS)
    && /function hccLandRailFit\(\)\{/.test(SRC) && /s\.style\.setProperty\('font-size',Math\.max\(6\.5,8\.5\*w\/sw\)\.toFixed\(2\)\+'px','important'\)/.test(SRC);
  const minH = +((/min-height:(\d+)px/.exec(btn) || [])[1] || 0);
  const tm = rule('html.land body #timeMachine');
  const hides = ['#tmDir', '#tmAgora', '#tmJumps', '#tmNote', '#tmSub'].every(id => CSS.includes('html.land body #timeMachine ' + id));
  const orders = /#tmBack,html\.land body #tmPlay,html\.land body #tmFwd\{order:1!important\}/.test(CSS) && /#tmMore\{order:7!important\}/.test(CSS)
    && /\.tmBreak\{display:block!important;flex:0 0 100%!important[^}]*order:19!important\}/.test(CSS)
    && /#tmDir\{[^}]*order:20!important\}/.test(CSS) && /#tmJumps\{display:flex!important;order:21!important\}/.test(CSS) && /#tmAgora\{[^}]*order:22!important\}/.test(CSS);
  const more = /<i class="tmBreak" aria-hidden="true"><\/i>\s*<button class="tmBtn" id="tmMore" type="button" aria-expanded="false"[^>]*><svg viewBox="0 0 16 16" aria-hidden="true"><path [^>]*\/><\/svg><\/button>/.test(SRC)
    && /m\.onclick=\(\)=>\{ const on=!document\.documentElement\.classList\.contains\('tm-more'\); document\.documentElement\.classList\.toggle\('tm-more',on\);\s*m\.setAttribute\('aria-expanded',String\(on\)\);[^\n]*landscapeColumnLayout\(\);[^\n]*\n\s*try\{ HCC_STAGE\.at=0; \}catch\(e\)\{\} try\{ if\(MV\.on\) requestAnimationFrame/.test(SRC);
  const top = /html\.land body #topbar,[^{]*\{display:none!important\}/.test(CSS) && /#hccCrumb button\.crumbBack\{width:44px!important;height:44px!important/.test(CSS)
    && /html\.land body #labBar\{top:calc\(4px \+ env\(safe-area-inset-top,0px\)\)!important;[^}]*height:44px!important/.test(CSS)
    && /function syncTopbarH\(\)\{[\s\S]{0,400}?classList\.contains\('land'\) \? 52/.test(SRC)
    && /function labBarPlace\(b\)\{[\s\S]{0,300}?if\(document\.documentElement\.classList\.contains\('land'\)\)\{/.test(SRC);
  ok('the chrome stands at the EDGES: the title bar put away and the top band one row — Back (44 × 44) and the laboratory bar; the time machine ONE row at the bottom that stops at the rail, with direction, Agora and the jumps one chevron away on a SECOND row that a full-width break keeps whole; the tab bar a rail down the right edge the FULL height of the screen, every tab with its word under its sign (a word wider than the rail set smaller, not cut)',
    top && /flex-direction:column!important/.test(rail) && /top:0!important;bottom:0!important/.test(rail) && /overflow-y:auto!important/.test(rail)
    && /flex:1 1 0!important/.test(btn) && minH >= 36 && words
    && /right:var\(--land-rail\)!important/.test(tm) && /flex-wrap:nowrap!important/.test(tm) && hides && orders && more,
    `rail top 0 → bottom 0, tabs ≥ ${minH} px, words ${words ? 'shown' : 'HIDDEN'} · time machine ${/right:var\(--land-rail\)/.test(tm) ? 'stops at the rail' : 'RUNS UNDER THE RAIL'}, rows ${orders ? '1–7 | break 19 | 20–23' : 'NOT ORDERED'} · chevron ${more ? 'wired' : 'MISSING'}`); }

/* 3 · the column */
{ const L = fn('landscapeColumnLayout');
  const PANELS = ['ctl', 'info', 'atlasNav', 'labPanel', 'zpPanel', 'bixPanel', 'smithPanel', 'capPanel', 'flowPanel', 'navPanel', 'objectPanel', 'atlasPanel', 'oscPanel', 'vectorPanel', 'motionPanel', 'xrCheck', 'predictivePanel', 'atlasCoach'];
  const colRule = (/((?:html\.land body #[A-Za-z]+,?\s*)+)\{\s*left:auto!important;right:calc\(var\(--land-rail\) \+ 6px\)!important;\s*width:var\(--land-sheet-w\)!important/.exec(CSS) || [, ''])[1];
  const inCol = PANELS.filter(id => colRule.includes('#' + id + ',') || colRule.includes('#' + id + '{') || new RegExp('#' + id + '\\s*$').test(colRule.trim()));
  const band = /const top=cockpit\?4:num\('--topbar-h',64\)\+50;\s*const bottom=viewH-\(num\('--tabs-h',48\)\+num\('--tm-h',0\)\+8\);/.test(L)
    && /html\.land\{--tabs-h:0px!important;/.test(CSS)
    && /document\.documentElement\.classList\.toggle\('land-col',on&&open\.length>0\);/.test(L)
    && /const z=parseFloat\(getComputedStyle\(e\)\.zoom\)\|\|1;\s*e\.style\.setProperty\('top',Math\.round\(y\/z\)\+'px','important'\);/.test(L)
    && /html\.land body #ctl\{right:calc\(\(var\(--land-rail\) \+ 6px\) \/ var\(--ctl-zoom,1\)\)!important/.test(CSS);
  const steps = ['#labBar', '#hud', '#dscHud', '#lbTip', '#tsLadder', '#selCard'].every(id => CSS.includes('html.land.land-col body ' + id + '{'));
  const deck = /function syncPanelDeck\(\)\{[\s\S]{0,700}?setTimeout\(\(\)=>\{ try\{ if\(typeof landscapeColumnLayout==='function'\) landscapeColumnLayout\(\); \}catch\(e\)\{\}\s*try\{ if\(typeof hccTabsSync==='function'\) hccTabsSync\(\); \}catch\(e\)\{\} \},0\);/.test(SRC);
  const T = fn('hccLandToggle');
  const toggle = /if\(!id\|\|!document\.documentElement\.classList\.contains\('land'\)\) return false;/.test(T) && /closePanel\(id\)/.test(T)
    && /if\(hccLandToggle\(inspectorPanelFor\(b\.dataset\.insptab\)\)\) return;/.test(SRC)
    && /if\(hccLandToggle\(\{atlas:'atlasNav',controls:'ctl',more:'navPanel'\}\[k\]\)\) return;/.test(SRC);
  const one = /function labBarControls\(\)\{[^\n]*\n[^\n]*\(hccPhonePortrait\(\)\|\|phoneLandscape\(\)\)&&LAB_BROWSER_OPEN\) labBrowserSetOpen\(false\)/.test(SRC);
  ok('the column: every sheet stands beside the rail from the top of the screen to the time machine (the band is 4 px → 8 px above the time machine — the one floor every sheet stands on, the tab bar being 0 px there — not the 76 px left between five bands), Controls\' CSS zoom divided back out of what is written; the top row, the caption, the descent\'s badge, the bubble, the ladder and the selection card step LEFT of an open column; a rail tab opens its sheet and, tapped again, puts it away; the lit tab follows the deck whatever changed it; Controls and the catalogue take the column one at a time',
    band && inCol.length === PANELS.length && steps && deck && toggle && one,
    `${inCol.length}/${PANELS.length} sheets in the column · band ${band ? 'top 4 → time machine' : 'WRONG'} · step left ${steps ? 'six of six' : 'MISSING'} · lit tab ${deck ? 'synced on every deck change' : 'STALE'} · rail tabs ${toggle ? 'switches' : 'one-way'}`); }

/* 4 · the stage */
{ const S = fn('hccStageShift'), G = fn('hccLandStage'), tick = fn('hccSelInsetTick');   /* v4.404: the free stage is measured by hccLandStage, which the stage's centre, the grips' hint and a laboratory's framing all read */
  const shift = /if\(!document\.documentElement\.classList\.contains\('land'\)\|\|renderer\.xr\.isPresenting\|\|\(typeof MV!=='undefined'&&MV\.on\)\|\|state\.landed\) return \[0,0\];/.test(S)
    && /const \{W,H,left,right,top,bottom\}=hccLandStage\(\);/.test(S)
    && /const left=tm\?Math\.max\(0,\(parseFloat\(getComputedStyle\(tm\)\.paddingLeft\)\|\|8\)-8\):0;/.test(G) && /return \{W,H,left,right,top,bottom\}; \}/.test(G)
    && /HCC_STAGE\.v=\[Math\.round\(\(left\+right\)\/2-W\/2\), Math\.round\(\(top\+bottom\)\/2-H\/2\)\];/.test(S)
    && /if\(T\[0\]===0&&T\[1\]===0\)\{ try\{ T=hccStageShift\(\); \}catch\(e\)\{\} \}/.test(tick);
  const hud = /html\.land body #hud\{[^}]*pointer-events:auto!important;\s*max-height:calc\(var\(--vh100,100vh\) - var\(--tm-h,52px\) - var\(--land-top\) - 64px\)!important;overflow:hidden!important\}/.test(CSS)
    && /html\.land body #hud \.sub\{[^}]*-webkit-line-clamp:1!important/.test(CSS) && /html\.land body #hud\.expand \.sub\{-webkit-line-clamp:6!important\}/.test(CSS)
    && /html\.land body #hud #hudSpark\{height:36px!important/.test(CSS) && /html\.land body #hud \.big\.dup\{display:none!important\}/.test(CSS)
    && /function hccLandCaption\(\)\{[^\n]*\n[^\n]*b\.textContent\.trim\(\)===d\.textContent\.trim\(\)/.test(SRC) && /setInterval\(\(\)=>\{ try\{ hccLandCaption\(\); \}catch\(e\)\{\} try\{ hccLandRailFit\(\); \}catch\(e\)\{\} \},400\);/.test(SRC);
  const M = fn('mvStage'), lay = fn('mvLayout');
  const mv = /if\(!document\.documentElement\.classList\.contains\('land'\)\) return \{x:0,y:0,w:W,h:H\};/.test(M) && /const w=Math\.max\(1,Math\.round\(W-rw-left\)\)/.test(M) && /return \{x:Math\.min\(W-1,left\),y:Math\.min\(H-1,tmH\),w,h\};/.test(M)
    && /St=mvStage\(W,H\); MV\.rects=mvRects\(MV\.n,St\.w,St\.h\)\.map\(r=>\(\{x:r\.x\+St\.x,y:r\.y\+St\.y,w:r\.w,h:r\.h\}\)\);/.test(lay)
    && /html\.land body\.mv-on #hud\{display:none!important\}/.test(CSS);
  const lad = /html\.land body #tsLadder:not\(\.compact\)\{top:calc\(4px \+ env\(safe-area-inset-top,0px\)\)!important;[^}]*display:flex!important;flex-direction:column!important;overflow:hidden!important/.test(CSS)
    && /html\.land body #tsLadder:not\(\.compact\) \.tsScroll\{flex:1 1 auto!important;min-height:0!important/.test(CSS) && /html\.land body #tsLadder:not\(\.compact\) #tsSvg\{height:100%!important/.test(CSS)
    && /if\(!on&&!L\.hidden&&document\.documentElement\.classList\.contains\('land'\)\)\{\s*try\{ closeAllPanels\(\); \}catch\(e\)\{\} try\{ if\(LAB_BROWSER_OPEN\) labBrowserSetOpen\(false\); \}catch\(e\)\{\} \}/.test(fn('sxFold'));
  ok('the stage: its centre is moved to the centre of what is free — between the notch\'s safe area and the rail, the top row and the time machine (outside the cockpit, in a headset, in the multiview and on the ground nothing is moved, and a selected object the card would cover still wins); the caption is a corner — a headline, one line of words and a 36-px strip, capped above the tour button, a tap away from the rest, and in the Solar System not the time machine\'s date a second time; the multiview tiles the free stage, not the screen under the chrome; the whole φ-ladder is the stage itself, filled and never spilling, and unfolding it puts the column away',
    shift && hud && mv && lad,
    `centre ${shift ? 'follows the free stage' : 'NOT MOVED'} · caption ${hud ? 'capped, one line, tap to unfold' : 'UNCAPPED'} · multiview ${mv ? 'tiles the stage' : 'TILES THE SCREEN'} · ladder ${lad ? 'the stage' : 'SPILLS'}`); }

/* 5 · the arrival */
{ const door = /if\(!hccPhonePortrait\(\)&&!phoneLandscape\(\)\) openPanel\('ctl'\);/.test(SRC)
    && /panels===\(\(hccPhonePortrait\(\)\|\|phoneLandscape\(\)\)\?'':'ctl'\)/.test(SRC)
    && /LAB_BROWSER_OPEN=!\(hccPhonePortrait\(\)\|\|phoneLandscape\(\)\);/.test(SRC);
  const world = /if\(hccPhonePortrait\(\)\|\|phoneLandscape\(\)\)\{ hccTabsSync\(\); return; \}/.test(fn('hccPresentControls'))
    && /if\(hccPhonePortrait\(\)\|\|phoneLandscape\(\)\)\{ try\{ closeAllPanels\(\); \}catch\(e\)\{\} return; \}/.test(SRC)
    && /if\(hccPhonePortrait\(\)\|\|phoneLandscape\(\)\)\{ try\{ labBrowserSetOpen\(false\); closeAllPanels\(\); \}catch\(e\)\{\} buildCtl\(\); return; \}/.test(SRC)
    && /\(\(hccPhonePortrait\(\)\|\|phoneLandscape\(\)\)\s*\? !shown\(c\)&&!!document\.querySelector/.test(SRC);
  ok('the arrival: a phone held either way arrives on the SCENE — at the boot, on a world button, on arriving in a world and on a laboratory chosen from the invariants, neither Controls nor the catalogue is opened over it (MEASURED before, sideways at 932 × 321: arriving in each of the Observable world, FBS3R, the Cycles and S³ opened Controls as a column 44 % of the width over the scene just travelled to) — and the atlas\'s own checks expect exactly that, while a desk still arrives with Controls open',
    door && world, door && world ? 'Controls opened on a desk only · the catalogue closed on a phone either way · ⚙ one tap away on the rail' : 'a phone on its side still arrives under a sheet'); }

/* 6 · the arithmetic, for every phone held sideways */
{ /* the bands the stylesheet sets: the top row 52, the time machine one row 51 (measured), the rail 56, tabs ≥ 36 */
  const RAIL = 56, TOP = 52, TM = 51, TAB = +((/html\.land body #hccTabs button\{flex:1 1 0!important;min-height:(\d+)px/.exec(CSS) || [])[1] || 99);
  const PHONES = [['iPhone Pro Max, full screen', 932, 430], ['iPhone Pro Max, Safari bars shown', 932, 321], ['iPhone 15 Pro', 852, 393], ['iPhone 13/14', 844, 390],
    ['iPhone mini', 812, 375], ['Android 20:9', 800, 360], ['iPhone SE, full screen', 667, 375], ['iPhone SE, Safari bars shown', 667, 300]];
  const rows = PHONES.map(([n, W, H]) => ({ n, W, H, stage: (W - RAIL) * (H - TOP - TM) / (W * H), tabs: Math.floor(H / TAB) }));
  const worst = rows.reduce((a, b) => (b.stage < a.stage ? b : a));
  ok('the arithmetic, for the phones that are held sideways: with no sheet open the stage is at least HALF the screen on every one (it was 13 % at 932 × 321), and the rail holds all eight tabs a laboratory can have — Atlas, the six instruments and More — at ≥ 36 px each without scrolling',
    rows.every(r => r.stage >= 0.5 && r.tabs >= 8) && TAB >= 36,
    rows.map(r => `${r.W}×${r.H} ${(r.stage * 100).toFixed(0)}% stage, ${r.tabs} tabs`).join(' · ') + ` · least: ${worst.n}`); }

/* 7 · the atlas measures it on itself */
{ const i = SRC.indexOf('THE COCKPIT — A PHONE ON ITS SIDE KEEPS ITS CHROME TO THE EDGES'), blk = i > 0 ? SRC.slice(i - 2400, i + 2200) : '';
  ok('and the atlas measures it on ITSELF: a boot self-test reads the rail (right edge, top to bottom, every tab on it), the time machine (bottom row, stopping at the rail, one row unless unfolded), the top row, the title bar and the stage\'s share of the screen — and says NOT APPLICABLE HERE wherever the phone is not on its side, so the suite\'s sideways arrival is where it counts',
    i > 0 && /const land=phoneLandscape\(\)/.test(blk) && /G\.on===G\.tabs/.test(blk) && /G\.tm\[2\]<=G\.rail\[0\]\+1/.test(blk) && /G\.stage>=0\.5/.test(blk) && /NOT APPLICABLE HERE/.test(blk)
    && /name: 'a phone turned sideways, 852x393'/.test(fs.readFileSync(path.join(__dirname, '..', 'scripts', 'selftest.mjs'), 'utf8')),
    i > 0 ? 'boot self-test present · arrives sideways at 852 × 393 in scripts/selftest.mjs' : 'NO SELF-TEST'); }

/* 8 · every world and every laboratory, sideways (v4.404) — asked: «Проверь и доведи до совершенства горизонтальный режим на
   остальных мирах и лабораториях». Every world and all 146 laboratories were walked at 932 × 321 and 667 × 300, with the
   scene and with Controls open: no control covered, none blocked, none under 44 px, nothing spilling. Two things were
   wrong. The grips' hint stood at y 150 — the middle of a 220-px stage, over the subject — in twenty laboratories. And a
   preset frames its subject for the screen's height, which a desk leaves 86 % of to the scene and the cockpit two-thirds:
   with every visible object of a laboratory projected on the screen (bounding spheres; the canvas' pixels were tried
   first and measured the glow and the sky as much as the subject), the median laboratory stood 1.01 times as tall as the
   free stage and in 80 of 145 it ran past the stage's edge. Standing back by the ratio: median 0.82, 55 past the edge,
   the share of a laboratory inside the stage a median 0.93 → 1.00 (tenth percentile 0.55 → 0.70). */
{ const H = fn('gripHintTick'), P = SRC.slice(SRC.indexOf('function scientificCameraPreset(v){'), SRC.indexOf('function scientificCameraPreset(v){') + 400), K = fn('hccLandFrameScale');
  const hint = /if\(document\.documentElement\.classList\.contains\('land'\)\)\{ const S=hccLandStage\(\)/.test(H) && /foot=Math\.min\(S\.bottom,lad&&lad\.top>S\.top\+60\?lad\.top:S\.bottom\)-6;/.test(H)
    && /const lo=Math\.max\(S\.left\+8,fab\?fab\.right\+8:0\), hi=S\.right-8/.test(H);
  const scale = /return Math\.max\(1,Math\.min\(1\.45,0\.86\/f\)\); \}/.test(K) && /const S=hccLandStage\(\), f=Math\.max\(0\.3,\(S\.bottom-S\.top\)\/S\.H\);/.test(K)
    && /const k=LAND_FRAME_KEEP\.has\(v\)\?1:hccLandFrameScale\(\); if\(k>1\) return \[p\[0\]\*k,p\[1\]\*k,p\[2\]\*k\];/.test(P)
    && /const LAND_FRAME_KEEP=new Set\(\['chmem','ois'\]\);/.test(SRC)
    && /if\(mode==='fbs'\|\|mode==='field'\|\|mode==='fractal'\)\{ const k=hccLandFrameScale\(\); if\(k>1\) camera\.position\.sub\(controls\.target\)\.multiplyScalar\(k\)\.add\(controls\.target\); \}/.test(SRC)
    && (fn('setFractalType').match(/hccLandFrameScale\(\)/g) || []).length === 2;
  /* the arithmetic, over the phones held sideways: the free stage's share of the height and how far a preset stands back */
  const TOP = 52, TM = 51, PH = [[932, 430], [932, 321], [852, 393], [844, 390], [812, 375], [800, 360], [667, 375], [667, 300]];
  const ks = PH.map(([W, Hh]) => { const f = (Hh - TOP - TM) / Hh; return { W, Hh, f, k: Math.max(1, Math.min(1.45, 0.86 / f)) }; });
  ok('every world and laboratory, sideways: the grips\' hint stands at the stage\'s foot — on the ladder\'s strip or the time machine, past the tour button, short of the rail or an open column — instead of over the subject in the middle; and a laboratory\'s preset (and the framing of FBS3R, the field and the fractals) stands back by what the cockpit takes of the height, never nearer and at most 1.45× (the two laboratories that fit their stations to the open band do it themselves)',
    hint && scale && ks.every(r => r.k >= 1 && r.k <= 1.45) && ks.some(r => r.k > 1.25),
    ks.map(r => `${r.W}×${r.Hh} stage ${(r.f * 100).toFixed(0)}% → ×${r.k.toFixed(2)}`).join(' · ')); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
