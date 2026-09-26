#!/usr/bin/env node
'use strict';
/* ══ THE LABORATORY BAR ═════════════════════════════════════════════════════════════════
 * On an upright iPhone the atlas showed its model and nothing that said a hundred and
 * twenty laboratories stand behind it: the catalogue stayed shut on purpose, so arriving
 * meant seeing — and never finding. A first-time reader could not discover the labs, and
 * Multiview had no visible door at all. The fix is a single strip that is always present
 * and never covers the model. This file checks the source for the contract it keeps:
 *   1. the bar exists with its six doors, each named for a screen reader: all
 *      laboratories (with the count), previous, the current one, next, controls, Multiview
 *   2. it is driven from the slow dock tick, and nothing in its visibility rule depends on
 *      the device: an upright phone shows it exactly as a desktop does; only XR, a landing,
 *      zen view or a missing world hide it
 *   3. it stands on the time machine and above any sheet or caption that rises into its
 *      band (a mini-player, not a panel), and on a phone lying on its side it takes the
 *      room left of the sheet column rather than crossing it
 *   4. the doors do what they say: ‹ › walk the catalogue order and wrap, a horizontal
 *      swipe on the name does the same, ⊞ opens the full catalogue unfolded (or the Atlas
 *      outside the laboratory world), ⚙ toggles Controls, ◱ enters and leaves Multiview,
 *      and [ ] are the keyboard's ‹ ›
 *   5. one door, not two: the floating ⚙ steps aside while the bar is up, the other
 *      floating buttons step above it, and all of them leave while a sheet has risen
 *   6. a first visit is told, once, what the strip is — and never again after any use
 *   7. the logic of the walk, run here on a copy: the order is the catalogue's DOM order
 *      without duplicates, stepping wraps at both ends, and outside the laboratory world
 *      ‹ and › enter at the two ends of the catalogue
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

/* 1 · the doors */
const doors = ['lbAll', 'lbPrev', 'lbName', 'lbNext', 'lbCtl', 'lbMv'].map(id => new RegExp(`id="${id}"[^>]*aria-label="[^"]+"`).test(SRC));
ok('the bar exists with its six doors, each named for a screen reader — all laboratories (with the count), previous, current, next, controls, Multiview',
  /<div id="labBar" role="navigation" aria-label="Laboratories" hidden>/.test(SRC) && doors.every(Boolean) && /<small id="lbCount"><\/small>/.test(SRC), doors.map(Boolean).join(' '));

/* 2 · always there, on every device */
const tick = SRC.slice(SRC.indexOf('function labBarTick(){'), SRC.indexOf('globalThis.HCC_LAB_BAR='));
const hideRule = (tick.match(/const hide=([^;]+);/) || [])[1] || '';
ok('driven from the slow dock tick, and the visibility rule never asks what device it is on: only XR, a landing, zen view or no world hide it',
  /try\{ labBarTick\(\); \}catch\(e\)/.test(SRC) && hideRule.length > 0 && !/Phone|innerWidth|pointer|coarse|Portrait/.test(hideRule) && /state\.landed/.test(hideRule) && /isPresenting/.test(hideRule) && /zen/.test(hideRule), hideRule);

/* 3 · placement */
const place = SRC.slice(SRC.indexOf('function labBarPlace(b){'), SRC.indexOf('function labBarTick(){'));
ok('it stands on the time machine and above any sheet or caption rising into its band, and on a phone on its side it takes the room left of the sheet column',
  /getElementById\('timeMachine'\)/.test(place) && /\['ctl','labPanel','info','objectPanel','selCard','atlasNav','navPanel','hud'\]/.test(place) && /phoneLandscape\(\)/.test(place) && /colL-20/.test(place)
  && /#labBar\{position:fixed;left:50%;transform:translateX\(-50%\);bottom:calc\(var\(--bottom-band\) \+ 8px\)/.test(SRC));

/* 4 · the doors do what they say */
ok('the doors do what they say: ‹ › step, a swipe steps, ⊞ unfolds the catalogue (the Atlas outside the laboratory world), ⚙ toggles Controls, ◱ enters and leaves Multiview, [ ] are the keyboard\'s ‹ ›',
  /#lbPrev'\)\.onclick=\(\)=>labBarStep\(-1\)/.test(SRC) && /#lbNext'\)\.onclick=\(\)=>labBarStep\(1\)/.test(SRC) && /if\(Math\.abs\(dx\)>42&&Math\.abs\(dx\)>1\.5\*Math\.abs\(dy\)\) labBarStep\(dx<0\?1:-1\)/.test(SRC)
  && /labBrowserFold\(false\); labBrowserSetOpen\(true\);/.test(SRC) && /openPanel\('atlasNav'\)/.test(SRC) && /const open=panelIsOpen\('ctl'\);/.test(SRC)
  && /if\(MV\.on\)\{ mvExit\(true\); return; \}/.test(SRC) && /mvEnter\(\);/.test(SRC) && /if\(e\.key==='\['\|\|e\.key==='\]'\)\{ try\{ labBarStep\(e\.key==='\]'\?1:-1\)/.test(SRC));

/* 5 · one door, not two */
ok('one door, not two: the floating ⚙ steps aside while the bar is up, the others step above it, and all leave while a sheet has risen',
  /body\.labbar-on #ctlFab\{display:none!important\}/.test(SRC) && /body\.labbar-on #helpFab\{bottom:calc\(var\(--bottom-band\) \+ 70px\)!important\}/.test(SRC) && /body\.labbar-sheet \.fab\{display:none!important\}/.test(SRC));

/* 6 · told once */
ok('a first visit is told, once, what the strip is — the hint and its bubble end on any use and are remembered',
  /localStorage\.setItem\('hcc\.labBar\.seen\.v1','1'\)/.test(SRC) && /labBarSeen\(\); let w=null;/.test(SRC) && /#labBar\.hint\{animation:lbPulse/.test(SRC) && /laboratories live here — ⊞ lists them all/.test(SRC));

/* 7 · the walk, run here */
{ const order = SRC.slice(SRC.indexOf('function labBarOrder(){'), SRC.indexOf('function labBarCount(){')), step = SRC.slice(SRC.indexOf('function labBarStep(d){'), SRC.indexOf('function labBarCatalogue(){'));
  const run = (ids, world, cur, d) => { let went = null; const doc = { getElementById: () => ({ querySelectorAll: () => ids.map(v => ({ id: 'v-' + v })) }) };
    const f = new Function('document', 'S3_VIEW_NAMES', 'HCC_CTX', 'state', 'labBarGo', order + step + ';return labBarStep;')(doc, Object.fromEntries(['a', 'b', 'c', 'd'].map(k => [k, k.toUpperCase()])), { worldId: world }, { s3view: cur }, v => { went = v; });
    f(d); return went; };
  const ids = ['a', 'b', 'b', 'c', 'x', 'd'];
  const r = [run(ids, 's3', 'b', 1), run(ids, 's3', 'd', 1), run(ids, 's3', 'a', -1), run(ids, 'solar', 'c', 1), run(ids, 'solar', 'c', -1)];
  ok('the walk, run here on a copy: catalogue order without duplicates or unknown ids, wrapping at both ends, and from outside the laboratory world ‹ › enter at the two ends',
    r.join() === 'c,a,d,a,d', r.join(' · ')); }

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
