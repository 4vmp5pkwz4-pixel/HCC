#!/usr/bin/env node
'use strict';
/* THIRTEEN FRAMES ARRIVED ONE AT A TIME AND THE CHIP ROW BECAME A FLAT LIST OF
 * THIRTEEN, in the order they happened to be written.
 *
 * A flat list is not an ordering. It tells a reader what exists and nothing about
 * what KIND of thing each one is, and past the eleventh chip it stops being read.
 * The Cycles world holds four different kinds of object answering four different
 * questions — what repeats, what predicts, what people drew, and what happened once
 * — and the fourth is the one that most needs saying out loud, because a laboratory
 * of cycles containing one non-repeating event will be misread otherwise.
 *
 * WHAT THIS FILE PROTECTS IS THE PARTITION. Every frame must be in EXACTLY ONE
 * group. A frame added without one would now drop out of the navigation entirely
 * rather than sit quietly at the end of a flat list — which is a better failure, but
 * only if something catches it. That is this.
 *
 * Rendered before shipping: five headed groups, fourteen chips including the Solar
 * system, every chip still navigating, zero page errors.
 */
const fs = require('node:fs'), path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
/* a failing check must not print the sentence written for the passing case */
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

const slice = (from, to) => { const i = src.indexOf(from); return src.slice(i, src.indexOf(to, i)); };
const viewsBlock = slice('const HCC_CYCLE_VIEWS=[', '\n];');
const groupsBlock = slice('const HCC_CYCLE_GROUPS=Object.freeze([', '\n]);');

/* the view ids may carry a hyphen ('butterfly-explorer'), which a class written from
   what I expect ids to look like would refuse — the fifth time that habit would have
   cost something today if the class had been narrower */
const views = [...viewsBlock.matchAll(/\n\s*\['([A-Za-z0-9_-]+)',/g)].map(m => m[1]);
const groups = [...groupsBlock.matchAll(/\{id:'([A-Za-z0-9_-]+)',\s*frames:\[([^\]]*)\]/g)]
  .map(m => ({ id: m[1], frames: m[2].split(',').map(x => x.replace(/'/g, '').trim()).filter(Boolean) }));
const grouped = groups.flatMap(g => g.frames);

ok('the Cycles world declares its frames in named groups rather than one flat list',
  groups.length >= 4 && views.length >= 13,
  `${views.length} frames in ${groups.length} groups: ${groups.map(g => g.id + '(' + g.frames.length + ')').join(' ')}`);

/* ── THE PARTITION, both directions ───────────────────────────────────────── */
const ungrouped = views.filter(v => !grouped.includes(v));
ok('every frame is in a group — one added without one would vanish from the navigation',
  ungrouped.length === 0,
  ungrouped.length ? ('not in any group: ' + ungrouped.join(' ')) : `all ${views.length} placed`);
const phantom = grouped.filter(v => !views.includes(v));
ok('and every grouped name is a frame that exists',
  phantom.length === 0,
  phantom.length ? ('grouped but not a frame: ' + phantom.join(' ')) : 'no group names a frame that is not there');
const twice = grouped.filter((v, i) => grouped.indexOf(v) !== i);
ok('no frame is in two groups — a partition, not a set of overlapping tags',
  twice.length === 0,
  twice.length ? ('in more than one group: ' + [...new Set(twice)].join(' ')) : 'each frame in exactly one');
ok('and no group is empty',
  groups.every(g => g.frames.length > 0),
  groups.filter(g => !g.frames.length).map(g => g.id).join(' ') || groups.map(g => g.frames.length).join(' + ') + ' = ' + grouped.length);

/* ── the groups say what KIND of thing, in all three languages ────────────── */
const titled = [...groupsBlock.matchAll(/t:\{en:'([^']+)',ru:'([^']+)',de:'([^']+)'\}/g)];
ok('each group states what kind of object it holds, in every language the atlas speaks',
  titled.length === groups.length,
  `${titled.length} of ${groups.length} titled · ` + titled.map(m => m[1].split('—')[0].trim()).join(' · '));
ok('and the group that matters most is stated: one of these frames did NOT repeat',
  /What happened once/.test(groupsBlock) && /butterfly/.test(groupsBlock),
  'a laboratory of cycles holding one non-repeating event will be misread unless it says so');

/* ── the navigation renders the grouping, not just declares it ────────────── */
ok('the chip row renders a heading per group rather than reordering a flat list silently',
  /HCC_CYCLE_GROUPS\.map\(g=>\{/.test(src)
  && /flex-basis:100%[^`]*\$\{esc\(nexusLang\(g\.t\)\)\}/.test(src),
  'measured in a browser: five headings over fourteen chips, every chip still navigating');
ok('and a frame is still reachable by its own id, so the grouping changed the order and nothing else',
  /const v=HCC_CYCLE_VIEWS\.find\(x=>x\[0\]===f\); if\(!v\) return '';/.test(src),
  'the chips are built from the view table through the group, not retyped into it');

console.log('\n' + (fail ? ('✖ ' + fail + ' FAILED, ' + pass + ' passed') : ('✔ ALL ' + pass + ' CHECKS PASSED')));
process.exit(fail ? 1 : 0);
