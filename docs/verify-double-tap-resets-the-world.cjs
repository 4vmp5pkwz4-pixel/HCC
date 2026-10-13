#!/usr/bin/env node
'use strict';
/* ══ A DOUBLE TAP ON THE OPEN TAB RETURNS THE WORLD AS IT FIRST APPEARS (v4.382) ═══════════════════════════════════════
 * Asked: reset the camera and the scene's settings by a double tap on the tab that is open. A second single tap keeps
 * its old meaning (show or hide the world's Controls) and waits the double-tap window to be sure it is single. The
 * world's settings are MEASURED — the state keys its own Controls panel reads while it is drawn — and whole-state
 * censuses (the drift count reads every key on every rebuild) are told apart because they read in stored order. Checked
 * here, by running the page's own code where it is pure:
 *   1. the read tracker returns exactly what a builder read, the absent keys included, and hands the state back intact
 *   2. a census of the whole state is set apart from the builder's own reads
 *   3. the tracker restores the state even when the builder throws
 *   4. the clock, the view and the language are never reset; only scalars are; defaults are applied through the panel's
 *      own handlers and re-asserted; the camera is re-framed by the world's own entry
 *   5. the gesture: two taps within the window reset, one waits and toggles Controls; no browser zoom on the tabs; a
 *      notice says what was reset and offers to undo it, camera included
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const grab = (re, what) => { const m = SRC.match(re); if (!m) throw new Error('not found: ' + what); return m[0]; };
const RUN = grab(/const HCC_SCAN_RUN=\d+;/, 'HCC_SCAN_RUN');
const TRACK = grab(/function hccTrackStateReads\(fn,obj\)\{[\s\S]*?\n  reads\.scanned=scanned\.size; return reads; \}/, 'hccTrackStateReads');
const track = new Function(RUN + '\n' + TRACK + '\nreturn hccTrackStateReads;')();
const fresh = () => { const S = {}; for (let i = 0; i < 300; i++) S['k' + i] = i; S.obj = [1, 2, 3]; return S; };
const intact = S => Object.getPrototypeOf(S) === Object.prototype && Object.keys(S).every(k => { const d = Object.getOwnPropertyDescriptor(S, k); return 'value' in d && d.writable && d.enumerable && d.configurable; });

/* 1 */
{ const S = fresh();
  const r = track(() => { void S.k5; void S.k17; void S.zz; void S.obj; S.k9 = 99; S.nn = 1; }, S);
  const got = [...r].sort().join(',');
  ok('the tracker returns exactly what the builder read — present keys, an absent key and an object — and hands the state back as plain writable data with its own prototype, the builder\'s writes kept',
    got === 'k17,k5,obj,zz' && S.k9 === 99 && S.nn === 1 && S.k5 === 5 && intact(S), `read {${got}} · k9 ${S.k9} · nn ${S.nn} · intact ${intact(S)}`); }
/* 2 */
{ const S = fresh();
  const r = track(() => { void S.k40; for (const k of Object.keys(S)) void S[k]; void S.k3; void S.absent; }, S);
  const got = [...r].sort().join(',');
  ok('a census that walks the whole state (in stored order) is set apart: only the builder\'s own reads remain',
    got === 'absent,k3,k40' && r.scanned >= 290 && intact(S), `read {${got}} · ${r.scanned} keys seen only by the census`); }
/* 3 */
{ const S = fresh(); let threw = false;
  try { track(() => { void S.k1; throw new Error('builder failed'); }, S); } catch (e) { threw = true; }
  ok('the state is handed back intact even when the builder throws', threw && intact(S) && S.k1 === 1, `threw ${threw} · intact ${intact(S)}`); }
/* 4 */
{ const keys = grab(/function hccWorldSettingKeys\(\)\{[\s\S]*?\n  return \[\.\.\.reads\]\.filter\([^\n]*\); \}/, 'hccWorldSettingKeys');
  const reset = grab(/function hccWorldReset\(\)\{[\s\S]*?return \{mode, reset:undo\.map\(u=>u\[0\]\), replayed\}; \}/, 'hccWorldReset');
  const keep = grab(/const HCC_WORLD_RESET_KEEP=new Set\(\[[^\]]*\]\);/, 'HCC_WORLD_RESET_KEEP');
  const w = [
    /!HCC_WORLD_RESET_KEEP\.has\(k\)&&!HCC_GLOBAL_PHYSICS_KEYS\.has\(k\)&&!HCC_VIEW_ONLY_KEYS\.has\(k\)/.test(keys),
    /const HCC_GLOBAL_PHYSICS_KEYS=new Set\(\['epochDays','daysPerSec','cycYrPerSec','paused','timeDir'\]\);/.test(SRC),
    ['lang', 'atlasAudience', 'mode', 'landed'].every(k => keep.includes(`'${k}'`)),
    /hccLabStateKeys\(state\.s3view\)/.test(keys),
    /if\(cur!==null&&typeof cur==='object'\) continue;/.test(reset),
    /undo\.push\(\[k,cur,true\]\); state\[k\]=def;/.test(reset) && /delete state\[k\];/.test(reset),
    /const replayed=hccCtlReplay\(before\);/.test(reset) && /el\.dispatchEvent\(new Event\('input',\{bubbles:true\}\)\); el\.dispatchEvent\(new Event\('change',\{bubbles:true\}\)\);/.test(SRC),
    /for\(const \[k\] of undo\)\{ if\(Object\.prototype\.hasOwnProperty\.call\(STATE_DEFAULTS,k\)\) state\[k\]=STATE_DEFAULTS\[k\];/.test(reset),
    /try\{ setMode\(mode\); \}catch\(e\)\{\}/.test(reset)];
  ok('the clock, the view and the language are never reset; only scalars are; a laboratory\'s own keys join its world\'s; defaults go through the panel\'s own handlers and are re-asserted; the camera is framed by the world\'s own entry',
    w.every(Boolean), w.map(x => x ? '✓' : '✗').join('')); }
/* 5 */
{ const h = grab(/document\.querySelectorAll\('#modeRow \.modebtn\[data-mode\]'\)\.forEach\(b=>b\.onclick=\(\)=>\{[\s\S]*?\n  \}\n  if\(b\.dataset\.mode==='solar'\)/, 'tab handler');
  const ms = +(SRC.match(/const HCC_TAB_DOUBLE_MS=(\d+);/) || [])[1];
  const w = [
    ms >= 250 && ms <= 400,
    /dbl=same&&!!b\._tapOpen&&now-\(b\._tapAt\|\|0\)<HCC_TAB_DOUBLE_MS;/.test(h) && /b\._tapAt=now; b\._tapOpen=same&&!dbl;/.test(h),
    /if\(dbl\)\{ clearTimeout\(b\._tapT\); b\._tapT=0; try\{ hccWorldReset\(\); \}/.test(h),
    /b\._tapT=setTimeout\(\(\)=>\{ b\._tapT=0; togglePanel\('ctl'\);/.test(h) && /\},HCC_TAB_DOUBLE_MS\);/.test(h),
    /#modeRow \.modebtn\{touch-action:manipulation\}/.test(SRC),
    /<div id="worldResetNote" role="status" aria-live="polite" hidden><\/div>/.test(SRC) && /id="worldResetUndo"/.test(SRC),
    /function hccWorldResetUndo\(mode,undo,cam\)\{[\s\S]*?camera\.position\.copy\(cam\.p\); controls\.target\.copy\(cam\.t\);/.test(SRC)];
  ok(`two taps within ${ms} ms on a tab that was already open reset its world (a double tap on another tab only opens it), one tap waits the window and then shows or hides its Controls; the browser does not zoom on the tabs; the notice offers to undo, camera included`,
    w.every(Boolean), w.map(x => x ? '✓' : '✗').join('')); }
console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
