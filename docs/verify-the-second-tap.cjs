#!/usr/bin/env node
'use strict';
/* ══ THE SECOND TAP (v4.353) ══════════════════════════════════════════════════════════════════════════════════════
 * Reported: a double tap did not work — the first tap already opened the selection card, the card mostly covered the
 * object, and the second tap was physically impossible. Checked on the recognizer itself, sliced out of index.html and
 * run on a fake clock:
 *   1. one recognizer, deferred single: a touch tap answers at once (ring + name) but commits only when no second tap
 *      came within 300 ms; two taps within the window and a fingertip are ONE double tap, and the single never runs;
 *      a mouse keeps the desktop convention (click selects at once, a second click focuses); a tap elsewhere
 *      supersedes a single still waiting
 *   2. the late second tap is rescued: a second touch that lands on the card which has just opened is the double tap
 *      it was meant to be, and the card never sees the touch
 *   3. the card never covers what was chosen: the screen is hit-tested along the object's row and column, the
 *      picture slides (a projection offset, the camera untouched) into the largest open stretch, and an unfolded card
 *      that leaves no room folds to its peek for this object only
 */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

const a = SRC.indexOf('const HCC_TAP={'), b = SRC.indexOf('function hccTapLabel(', a);
const code = a > 0 && b > a ? SRC.slice(a, b) : '';
function harness() {
  const clock = { t: 1000 }, timers = [];
  const ctx = { performance: { now: () => clock.t }, setTimeout: (f, ms) => { const id = timers.length + 1; timers.push({ id, at: clock.t + ms, f, done: false }); return id; },
    clearTimeout: id => { const t = timers.find(x => x.id === id); if (t) t.done = true; }, console, Math, Object, String, SELECT: new Map(), lastTouchDoubleAt: 0, document: { createElement: () => ({ style: {}, appendChild() {}, remove() {} }), body: { appendChild() {} } } };
  vm.createContext(ctx); vm.runInContext(code + '\n;this.__T={HCC_TAP,hccTap,hccTapType};', ctx);
  ctx.hccTapRing = () => {};
  const advance = ms => { const end = clock.t + ms; for (;;) { const due = timers.filter(t => !t.done && t.at <= end).sort((x, y) => x.at - y.at)[0]; if (!due) break; clock.t = due.at; due.done = true; due.f(); } clock.t = end; };
  const tap = (x, y, type, rec, key) => { ctx.__T.HCC_TAP.ptype = type; ctx.__T.HCC_TAP.ptypeAt = clock.t; return ctx.__T.hccTap({ clientX: x, clientY: y, pointerType: type }, { key, single: () => rec.push('single:' + key), double: () => rec.push('double:' + key) }); };
  return { ctx, clock, advance, tap };
}
{ const H = harness(), r = [];
  H.tap(100, 100, 'touch', r, 'A'); const early = r.slice(); H.advance(150); H.tap(104, 102, 'touch', r, 'A'); H.advance(600);
  const H2 = harness(), r2 = []; H2.tap(50, 50, 'touch', r2, 'B'); H2.advance(299); const before = r2.length; H2.advance(2); const after = r2.slice();
  ok('a touch tap answers at once but commits only after 300 ms; two taps within the window and a fingertip are ONE double tap — the single never runs',
    code.length > 500 && early.length === 0 && r.join() === 'double:A' && before === 0 && after.join() === 'single:B', `double: [${r}] · single: [${after}]`); }
{ const H = harness(), r = []; H.tap(100, 100, 'touch', r, 'A'); H.advance(320); H.tap(101, 99, 'touch', r, 'A'); H.advance(600);
  const H2 = harness(), r2 = []; H2.tap(100, 100, 'touch', r2, 'A'); H2.advance(600); H2.tap(100, 100, 'touch', r2, 'A'); H2.advance(600);
  ok('a slower double tap (after the card opened) still focuses — within 520 ms; after that it is two single taps',
    r.join() === 'single:A,double:A' && r2.join() === 'single:A,single:A', `[${r}] · [${r2}]`); }
{ const H = harness(), r = []; H.tap(10, 10, 'mouse', r, 'M'); const imm = r.slice(); H.advance(180); H.tap(12, 11, 'mouse', r, 'M'); H.advance(10);
  const H2 = harness(), r2 = []; H2.tap(100, 100, 'touch', r2, 'A'); H2.advance(100); H2.tap(220, 100, 'touch', r2, 'B'); H2.advance(600);
  ok('a mouse click selects at once and a second click focuses; a touch tap elsewhere supersedes the single still waiting',
    imm.join() === 'single:M' && r.join() === 'single:M,double:M' && r2.join() === 'single:B', `mouse [${r}] · elsewhere [${r2}]`); }
ok('the late second tap is rescued from the card that has just opened: caught in the capture phase, it focuses the first tap’s object and the card never sees it',
  /addEventListener\('pointerdown',e=>\{ HCC_TAP\.ptype=e\.pointerType\|\|'mouse'; HCC_TAP\.ptypeAt=performance\.now\(\); const L=HCC_TAP\.last;/.test(SRC)
  && /const over=e\.target&&e\.target\.closest&&e\.target\.closest\('#selCard,\.panel'\); if\(!over\) return;\s*e\.preventDefault\(\); e\.stopPropagation\(\); HCC_TAP\.eatUntil=t\+900;/.test(SRC)
  && /for\(const ev of \['pointerup','click','dblclick'\]\) addEventListener\(ev,/.test(SRC) && /try\{ L\.A\.double\(\); \}catch\(err\)\{ console\.warn\('\[late double tap\]',err\); \}/.test(SRC));
ok('every tap goes through the one recognizer: canvas bodies, catalogue stars, captions and labels; a label’s dblclick defers to it',
  /hccTap\(e,\{key:pk, name:hccTapName\(pk\),/.test(SRC) && /div\.onclick = e=>\{ e\.stopPropagation\(\); hccTapLabel\(selKey,e\); \};/.test(SRC)
  && /el\.onclick=e=>\{e\.stopPropagation\(\);hccTapLabel\(key,e\);\};/.test(SRC) && /if\(hccTapDoubled\(\)\) return; dblFocus\(selKey\);/.test(SRC) && /\.hccTapRing\{position:fixed;/.test(SRC));
ok('the card never covers what was chosen: the screen is hit-tested along the object’s row and column, the picture slides by a projection offset into the largest open stretch, an unfolded card that leaves no room folds to its peek for this object only',
  /function hccSceneOpenAt\(x,y\)/.test(SRC) && /function hccOpenSpans\(fixed,lo,hi,vertical\)/.test(SRC) && /camera\.setViewOffset\(W,H,-SEL_INSET\.x,-SEL_INSET\.y,W,H\)/.test(SRC)
  && /try\{ hccSelInsetTick\(dt\); \}catch\(e\)\{\}/.test(SRC) && /selCard\.classList\.add\('collapsed'\); SEL_INSET\.peeked=selectedKey;/.test(SRC) && /SEL_INSET\.userKey!==selectedKey/.test(SRC)
  && /if\(camera\.view&&camera\.view\.enabled\) camera\.clearViewOffset\(\)/.test(SRC));
console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
