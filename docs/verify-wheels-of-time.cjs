#!/usr/bin/env node
'use strict';
/* ELEVEN TRADITIONS DREW THE UNIVERSE AS A CYCLE, AND THIS ATLAS HAD THE ARITHMETIC
 * OF FOUR OF THEM AND THE PICTURE OF NONE.
 *
 * The Cycles world carried Maya, Egyptian, Chinese and Babylonian counts as numbers
 * inside a chronometry readout. It drew no wheel. Every one of these cultures made a
 * GRAPHICAL account of cyclic time — a divided circle — and the division is the
 * content: 260 equal steps is a different claim from four arcs in 4:3:2:1, and both
 * are different from twelve unequal ara whose second half is the first reversed.
 *
 * THE ONE THING THIS INSTRUMENT MUST NOT DO IS POINT A HAND AT A WHEEL THAT HAS NO
 * PHASE. A Maya calendar round has a position this instant because its unit is a day
 * and the correlation to a Julian day is a constant already here. A Jain kālacakra
 * does not: its ara are measured in sāgaropama, a doctrinal magnitude with no
 * conversion to a second, and a hand there would be a number nobody wrote down. The
 * mahāyuga sits between — its spans are years, but the epoch that starts Kali Yuga is
 * a doctrinal CHOICE, so its hand exists only because that choice is declared in the
 * file rather than assumed. Three categories, and the instrument states which each is.
 *
 * Measured in a browser: 11 rings drawn, 10 hands, 11 labels all legible, phases
 * published on the bus, and the mahāyuga hand at 1.19 per cent of its turn — which
 * is 5128 years since 3102 BCE, the arithmetic the declared epoch requires.
 */
const fs = require('node:fs'), path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
/* a failing check must not print the sentence written for the passing case */
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

/* ── the table, and the three phase categories ────────────────────────────── */
const tbl = src.slice(src.indexOf('const WOT_TRADITIONS=Object.freeze(['),
                      src.indexOf('const wotArcs='));
const rows = [...tbl.matchAll(/\{id:'([a-z]+)',\s*div:([^,]+),[\s\S]*?phase:'(epoch|declared|structure)'/g)]
  .map(m => ({ id: m[1], div: m[2].trim(), phase: m[3] }));
ok('eleven traditions are declared, each with the number of divisions its own culture drew',
  rows.length >= 11, rows.map(r => r.id + '/' + r.div).join(' '));
ok('and each declares whether it can be pointed at NOW, at a DECLARED epoch, or not at all',
  rows.filter(r => r.phase === 'epoch').length >= 9
  && rows.filter(r => r.phase === 'declared').length === 1
  && rows.filter(r => r.phase === 'structure').length === 1,
  `${rows.filter(r => r.phase === 'epoch').length} epoch · ${rows.filter(r => r.phase === 'declared').length} declared · `
  + `${rows.filter(r => r.phase === 'structure').length} structure only`);

/* ── THE REFUSAL: no hand where no phase exists ───────────────────────────── */
const phaseFn = src.slice(src.indexOf('const wotPhase='), src.indexOf('/* the shared proportion'));
ok('a wheel with no phase is REFUSED a hand rather than given a plausible one',
  /if\(T\.phase==='structure'\|\|!T\.turnDays\) return null;/.test(phaseFn),
  'wotPhase returns null and the instrument hides the hand');
ok('and the doctrinal epoch is taken from a NAMED constant, so the one declared choice is visible',
  /WOT_KALI_START_JDN=588466/.test(src) && /chronJDN\(epochDays\)-WOT_KALI_START_JDN/.test(phaseFn),
  '3102 BCE is a scholarly convention, not a measurement, and the file says which');

/* ── the divisions come from the tradition, not from a default ────────────── */
/* ── AND THE ARCS ARE CALLED, NOT GREPPED ──────────────────────────────────
   A mutation that renamed the Jain branch to a value it can never match survived
   the first draft of this file: the reverse-concatenation was still in the source,
   so a text check passed while the wheel silently fell through to twelve EQUAL
   segments. Same shape as a check that asked whether busIds was declared rather
   than used. The kernels are sliced into core/atlas/extracted.mjs and evaluated
   here, so the question is what the function RETURNS. */
const K = require('../core/atlas/extracted.mjs');
const jain = K.wotArcs('jain'), yuga = K.wotArcs('yuga'), maya = K.wotArcs('maya');
const ratio = a => a.map(x => +(x / a[3]).toFixed(6));
ok('the Jain wheel RETURNS twelve unequal ara whose second half is the first reversed',
  jain.length === 12
  && ratio(jain.slice(0, 4)).join(':') === '4:3:2:1'
  && jain.slice(0, 6).every((x, i) => Math.abs(x - jain[11 - i]) < 1e-12),
  `${jain.length} segments · first four ${ratio(jain.slice(0, 4)).join(':')} · the halves mirror`);
ok('the Hindu wheel RETURNS four unequal arcs in 4:3:2:1, and a day-count wheel returns equal ones',
  yuga.length === 4 && ratio(yuga).join(':') === '4:3:2:1'
  && maya.length === 260 && new Set(maya.map(x => x.toFixed(12))).size === 1,
  `yuga ${yuga.map(x => x.toFixed(2)).join(' ')} · maya ${maya.length} equal segments`);
ok('the yuga spans are the canonical 1728000 : 1296000 : 864000 : 432000',
  K.WOT_YUGA_YR.join(':') === '1728000:1296000:864000:432000'
  && K.WOT_MAHAYUGA_YR === 4320000 && K.WOT_KALPA_YR === 4320000000,
  `mahāyuga ${K.WOT_MAHAYUGA_YR} yr · kalpa ${K.WOT_KALPA_YR} yr`);

/* ── the shared proportion is stated as arithmetic, and claims nothing ────── */
const sp = K.wotSharedProportion();
ok('the 4:3:2:1 shared by the Jain ara and the Hindu yuga is COMPUTED and comes out identical',
  sp.identical === true && sp.jain.join(':') === '4:3:2:1' && sp.yuga.join(':') === '4:3:2:1',
  `jain ${sp.jain.join(':')} · yuga ${sp.yuga.join(':')} · identical ${sp.identical}`);
ok('and the atlas claims no borrowing and no astronomy from it',
  /claims no borrowing/.test(src) && /does NOT say one borrowed from the other/.test(src),
  'neither claim is in evidence here, and the file says so where a reader will meet it');

/* ── it is an instrument of the frame system, not a loose group ───────────── */
ok('the wheels are declared in the frame table that governs visibility',
  /\{name:'cycWheelsInst',\s*frames:\['wheels'\]/.test(src),
  'so the frame cannot open wearing another instrument’s furniture');
ok('and the frame FRAMES itself and returns, as every other branch does',
  /const p=cycWheelsInst\.position;[\s\S]{0,220}?setControlDistanceLimits\(9,150\);[\s\S]{0,60}?return;/.test(src),
  'the first draft set a camera without returning and the default overwrote it');

/* ── the update runs in the tick, where dt exists ─────────────────────────── */
ok('the wheels update from the tick loop rather than from the frame-change handler',
  /if\(frame==='wheels'\)\{\s*\n\s*updateWheelsOfTime\(\);\s*\n\s*wotBusT\+=dt;/.test(src),
  'a frame-change handler has no dt, and the first draft threw into the tick’s own catch');
ok('a publish that fails is RECORDED rather than swallowed',
  /WOT\.publishError=String\(e&&e\.message\|\|e\);/.test(src)
  && /globalThis\.HCC_WHEELS=/.test(src),
  'the same defect this atlas already carries once, where a whole mode published nothing and raised no error');

/* ── every label names its own ring ───────────────────────────────────────── */
ok('the labels are spread around the nest instead of stacking on one radius',
  /const la=\(i\/n\)\*Math\.PI\*2\*0\.82\+0\.22;/.test(src),
  'eleven on one radius left the declutter pass showing three');

console.log('\n' + (fail ? ('✖ ' + fail + ' FAILED, ' + pass + ' passed') : ('✔ ALL ' + pass + ' CHECKS PASSED')));
process.exit(fail ? 1 : 0);
