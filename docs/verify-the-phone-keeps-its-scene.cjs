#!/usr/bin/env node
'use strict';
/* ══ THE PHONE KEEPS ITS SCENE ═══════════════════════════════════════════════
 *
 * Reported from an iPhone, with screenshots, in German:
 *   · zooming out of the Solar System into the Observable world went black, and the
 *     page was closed by the browser;
 *   · a laboratory's caption stood in the middle of the scene, over the object, as a
 *     195-px column 502 px tall that ran off the top of the screen;
 *   · the laboratory catalogue, open on its own, slid under the time machine and the
 *     tab bar;
 *   · words were wider than their buttons, in many places;
 *   · the time machine spent two rows and gave the rate scale a third of the width.
 *
 * Each was measured at 390 × 664 (Safari, toolbar shown) and 844 × 390 before it was
 * changed; this file asserts the mechanisms that fixed them, and puts each defect
 * back into a copy of the page to prove the check for it would see it.
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const between = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i); return i < 0 || j < 0 ? '' : s.slice(i, j); };

function checks(src) {
  const r = {};
  const final = between(src, '<style id="hcc-phone-final">', '</style>');
  /* 1. the crossing */
  r.seamGuard = /function hccSeamGuard\(sec=2\.5\)\{/.test(src)
    && /function setMode\(mode\)\{\n  if\(mode!==state\.mode\) try\{ hccSeamGuard\(\); \}catch\(e\)\{\}/.test(src)
    && /if\(layer!==state\.solarScaleLayer\) try\{ hccSeamGuard\(1\.5\); \}catch\(e\)\{\}/.test(src)
    && /!\(hccSeamQuiet>0\) && !HCC_SAFE_GPU && ensureBloom\(\)/.test(src)
    && /function premiumPerformanceTick\(dt\)\{\n  hccSeamTick\(dt\);\n  if\(hccSeamQuiet>0\) return;/.test(src);
  r.safeMode = /const HCC_SAFE_GPU=\(\(\)=>\{ try\{ const t=\+localStorage\.getItem\(HCC_SEAM_MARK\)/.test(src)
    && /renderer\.setPixelRatio\(HCC_SAFE_GPU\?1:/.test(src) && /if\(HCC_SAFE_GPU\) premiumVisualsEnabled=false;/.test(src)
    && /localStorage\.removeItem\(HCC_SEAM_MARK\)/.test(src);
  r.ctxWatch = /renderer\.forceContextRestore\(\)/.test(src) && /function hccContextRecoveryCard\(\)/.test(src)
    && /clearTimeout\(hccCtxWatch\); document\.getElementById\('hccCtxCard'\)\?\.remove\(\);/.test(src);
  r.prewarm = /if\(layer==='cosmic'\) try\{ hccPrewarmWorld\(obsGroup\); \}catch\(e\)\{\}/.test(src)
    && /renderer\.compileAsync\?renderer\.compileAsync\(group,camera,scene\)/.test(src);
  r.webkitBoot = /var xrCheckEl = document\.getElementById\('xrCheck'\);/.test(src) && !/const xrCheckEl =/.test(src);
  r.rateApi = /setRateDaysPerSecond\(rate,provenance='time-fabric\.api\.setRate'\)\{setAtlasRate\(rate,provenance\);/.test(src)
    && !/setAtlasSignedRate\(/.test(src);
  /* 2. the caption */
  r.hud = /#hud \.sub\{display:-webkit-box!important;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden\}/.test(final)
    && /body #hud\{top:var\(--hud-top,140px\)!important;bottom:auto!important\}/.test(final)
    && /document\.getElementById\('hud'\)\?\.addEventListener\('click'/.test(src);
  /* 3. the catalogue */
  const lp = src.match(/--lp-bottom:[^;]*;/g) || [];
  r.catalogueFloor = lp.length === 2 && lp.every(x => x.startsWith('--lp-bottom:max(calc(var(--sheet-floor) + 10px), min('));
  /* 4. the words */
  r.fitter = /function hccFitText\(\)\{/.test(src)
    && /el\.style\.whiteSpace='normal'/.test(src) && /Math\.max\(9,f0\*0\.72\)/.test(src)
    && /el\.style\.textOverflow='ellipsis'/.test(src)
    && /getComputedStyle\(el\)\.textOverflow==='ellipsis'\)\{ if\(!el\.title\) el\.title=/.test(src)
    && /observe\(document\.body,\{childList:true,subtree:true,characterData:true\}\)/.test(src);
  r.worldSigns = /row\.classList\.toggle\('worldSigns',signs\)/.test(src) && /#modeRow #cmdkBtn,#modeRow #navBtn,#modeRow \.tbsep\{display:none!important\}/.test(src)
    && /id="moreSearch"/.test(src) && /id="moreNav"/.test(src);
  /* 5. the time machine */
  r.scale = /#tmRate\{order:4!important;flex:1 1 100%!important;min-width:0!important;width:100%!important;gap:0!important\}/.test(final)
    && /#tmUnits \.tmUnitSel\{display:block!important;width:100%!important/.test(final)
    && /id="tmRateSlider"[^>]*data-no-osc/.test(src) && /class="tmBtn tmUnitSel" id="tmUnitSel"/.test(src);
  r.fabs = /#helpFab\{bottom:calc\(var\(--bottom-band\) \+ 12px\)!important\}/.test(final);
  /* 5b. the scene first on an upright phone */
  r.sceneFirst = /function hccPhonePortrait\(\)\{/.test(src)
    && /if\(hccPhonePortrait\(\)\)\{\n    if\(id==='selCard'\)\{ try\{ closeAllPanels\('selCard'\); \}catch\(e\)\{\} \}\n    try\{ if\(LAB_BROWSER_OPEN\) labBrowserSetOpen\(false\); \}catch\(e\)\{\} \}/.test(src)
    && /if\(!hccPhonePortrait\(\)\) openPanel\('ctl'\);   \/\/ an upright phone opens on the scene/.test(src)
    && /if\(hccPhonePortrait\(\)\)\{ hccTabsSync\(\); return; \}/.test(src)
    && /if\(hccPhonePortrait\(\)\)\{ try\{ closeAllPanels\(\); \}catch\(e\)\{\} return; \}/.test(src)
    && /LAB_BROWSER_OPEN=!hccPhonePortrait\(\);/.test(src);
  r.sheetBudget = /const usable=band\*\(1-\(hccPhonePortrait\(\)\?0\.5:SHEET_RESERVE\)\);/.test(src)
    && /el\.style\.setProperty\('--insp-h',inspShown\?'52px':'0px'\);/.test(src)
    && /band\*\(inst\?0\.50:0\.42\)\/innerHeight/.test(src);
  const longCls = (src.match(/\.hcc-label-long\{[^}]*\}/) || [''])[0];
  r.labelsHide = !!longCls && !/display/.test(longCls);
  /* 6. a measurement is not a display setting */
  r.probeGrid = /const G=o\.grid\|\|17;\n    if\(!u\|\|N!==G\) build\(G\); else reset\(\);/.test(src) && /grid:gridUsed/.test(src);
  return r;
}

const base = checks(SRC);
ok('the crossing between worlds is drawn plain on a phone — no post chain, no governor rebuilding the composer mid-crossing — and every world or scale change on a phone arms it', base.seamGuard);
ok('a page the browser closed inside a crossing reopens in SAFE GRAPHICS (no post chain, one device pixel per CSS pixel), and the mark is wiped once a crossing has drawn steadily', base.safeMode);
ok('a lost WebGL context is asked back by the atlas itself, and if the browser still refuses it the reader is offered this exact view again — a black screen is never the end state', base.ctxWatch);
ok('the Observable world\'s materials are compiled while the cosmic web is on screen, not in the frame that crosses into it', base.prewarm);
ok('the boot is clean on WebKit: the XR check no longer reads a const in its temporal dead zone (it threw on every iPhone)', base.webkitBoot);
ok('and HCC_TIME_FABRIC.setRateDaysPerSecond calls a function that exists', base.rateApi);
ok('a caption is two lines on a phone, at the top of the scene under the breadcrumb, and opens on a tap', base.hud);
ok('the laboratory catalogue can never sit lower than the sheet floor — open on its own it used to slide under the time machine and the tab bar', base.catalogueFloor);
ok('no word is wider than its button: it wraps, then shrinks to no less than 72 % or 9 px, and only then elides with the full text on its title; designed ellipses are left alone', base.fitter);
ok('on a phone held upright the seven worlds are their signs and all of them fit; Search and the Navigator move to the More menu instead of hiding behind a sideways swipe', base.worldSigns);
ok('the rate scale spans the whole width of a phone held upright, the units are one picker, and the scale no longer grows an oscillator chip', base.scale);
ok('the floating help button stands on the bars instead of on the first tab', base.fabs);
ok('the diffusion probe measures on its own 17³ lattice everywhere, so a phone and a desktop give the same answer', base.probeGrid);
ok('on an upright phone the scene comes first: one sheet at a time (catalogue, Controls and the selection card displace each other), and nothing opens a sheet unasked — not the boot, not a world button, not an arrival', base.sceneFirst);
ok('and an open sheet is budgeted from the SCENE band (breadcrumb to time machine), opening at 42 % of it and never past 62 %, with the hidden Inspector strip no longer counted as floor', base.sheetBudget);
ok('a long scene label is restyled without touching `display`, so the label renderer can still hide the captions of every world that is not on screen', base.labelsHide);

const MUT = [
  ['the governor rebuilds the composer mid-crossing again', s => s.replace('  hccSeamTick(dt);\n  if(hccSeamQuiet>0) return;\n', ''), 'seamGuard'],
  ['a crash inside a crossing is forgotten', s => s.replace('if(HCC_SAFE_GPU) premiumVisualsEnabled=false;', ''), 'safeMode'],
  ['a lost context is simply waited on', s => s.replace('try{ renderer.forceContextRestore(); }catch(err){}', ''), 'ctxWatch'],
  ['the XR check reads its const early again', s => s.replace('var xrCheckEl = document', 'const xrCheckEl = document'), 'webkitBoot'],
  ['the caption is a column again', s => s.replace('#hud .sub{display:-webkit-box!important;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}', ''), 'hud'],
  ['the catalogue anchor loses its floor', s => s.replace('--lp-bottom:max(calc(var(--sheet-floor) + 10px), min(', '--lp-bottom:min((').replace('--lp-bottom:max(calc(var(--sheet-floor) + 10px), min(', '--lp-bottom:min(('), 'catalogueFloor'],
  ['labels stay wider than their buttons', s => s.replace("el.style.whiteSpace='normal'", "el.style.whiteSpace='nowrap'"), 'fitter'],
  ['the scale shares its row again', s => s.replace('#tmRate{order:4!important;flex:1 1 100%!important;', '#tmRate{order:4!important;flex:1 1 96px!important;'), 'scale'],
  ['a world button opens Controls over the new world again', s => s.replace("if(hccPhonePortrait()){ try{ closeAllPanels(); }catch(e){} return; }", ''), 'sceneFirst'],
  ['the sheet may take most of the band again', s => s.replace('(hccPhonePortrait()?0.5:SHEET_RESERVE)', 'SHEET_RESERVE'), 'sheetBudget'],
  ['the long-label class overrides display again', s => s.replace('.hcc-label-long{white-space:normal!important;', '.hcc-label-long{display:block!important;white-space:normal!important;'), 'labelsHide'],
  ['the probe measures on the display lattice again', s => s.replace('const G=o.grid||17;', 'const G=resolution();'), 'probeGrid'],
];
const caught = MUT.map(([n, f, k]) => { const v = f(SRC); return [n, v !== SRC && base[k] === true && checks(v)[k] === false]; });
ok('every defect this replaces, put back into a copy of the page, is caught by the check written for it',
  caught.every(([, c]) => c), caught.map(([n, c]) => `${c ? '✓' : '✗'} ${n}`).join(' · '));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
