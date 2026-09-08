#!/usr/bin/env node
/* ============================================================================
   THE LIVENESS ARTIFACT, ASSERTED RATHER THAN MERELY REPRODUCED

   api/liveness.json carries the per-frame verdict for a hundred and forty-three
   views and fifty-five stations, and until now nothing tested its CONTENT.  It
   was guarded by reproduction alone: the pipeline regenerates it and CI diffs
   the result, which catches a stale or hand-edited file exactly and is blind to
   a wrong generator, because a generator that is wrong today writes the same
   wrong answer twice and the diff comes back clean.

   So this file asserts the things reproduction cannot see.  Every summary count
   is RECOMPUTED from the rows it summarises, which is the one check a broken
   liveness.mjs could not survive: if the walk miscounted what is alive, the
   summary and the rows would disagree, and reproduction would happily reproduce
   both halves of the disagreement.

   NINE THINGS ARE CHECKED.

   1.  The file is the schema it claims and carries rows.
   2.  Its release identity agrees with version.json.
   3.  ALIVE IS RECOMPUTED from the rows, not trusted.
   4.  So is still, and the two partition the views exactly.
   5.  So is the station count, and the number of laboratories holding stations.
   6.  Every row is well formed: a lab, two booleans, a non-negative body count.
   7.  The gate the walk exists to enforce — no two stations indistinguishable.
   8.  A laboratory meant to be a diagram is allowed to be still, and the file
       says so itself rather than treating stillness as failure.
   9.  And the summary is not merely self-consistent but NON-TRIVIAL: a file
       where everything was alive, or nothing was, would satisfy arithmetic and
       tell nobody anything.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const ROOT = path.join(__dirname, '..');
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'liveness.json'), 'utf8'));
const VER = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));
const V = L.views || [], C = L.counts || {};

/* recomputed from the rows — never read from the summary */
const alive = V.filter(v => v.rebuilds || v.moves).length;
const still = V.filter(v => !v.rebuilds && !v.moves).length;
const stationRows = V.filter(v => v.station != null);
const stationed = new Set(stationRows.map(v => v.lab)).size;

console.log('\n=== 1-2. The file, and what release it belongs to ===\n');

ok('the artifact is the schema it claims and carries rows — a summary with no rows underneath it would pass every arithmetic check below by vacuum',
  L.schema === 'hcc.liveness/1' && Array.isArray(V) && V.length >= 100,
  `schema ${L.schema} · ${V.length} views`);

ok('and its release identity agrees with version.json, so a liveness file left behind by an earlier build cannot masquerade as this one',
  L.version === VER.version && L.build === VER.build,
  `liveness says ${L.version} / ${L.build} · version.json says ${VER.version} / ${VER.build}`);

console.log('\n=== 3-6. Every summary count recomputed from the rows ===\n');

ok('ALIVE IS RECOMPUTED FROM THE ROWS RATHER THAN TRUSTED. This is the check reproduction cannot make: if the walk miscounted what recomputes per frame, the summary and the rows it summarises would disagree, and regenerating the file would reproduce both halves of that disagreement without noticing',
  alive === C.alive, `rows say ${alive} alive · the summary says ${C.alive}`);

ok('and so is still, and the two PARTITION the views exactly — no view is both, none is neither',
  still === C.still && alive + still === V.length,
  `${alive} + ${still} = ${alive + still} against ${V.length} views`);

ok('the station count and the number of laboratories holding stations are recomputed too, from the rows that name a station',
  stationRows.length === C.stations && stationed === C.stationed,
  `rows say ${stationRows.length} stations across ${stationed} laboratories · the summary says ${C.stations} and ${C.stationed}`);

ok('every row is well formed: a laboratory name, two booleans that mean different things, and a body count that is a non-negative integer. A row carrying a string where a boolean belongs would be counted as alive by truthiness and nobody would see it',
  V.every(v => typeof v.lab === 'string' && v.lab.length > 0
    && typeof v.rebuilds === 'boolean' && typeof v.moves === 'boolean'
    && Number.isInteger(v.bodies) && v.bodies >= 0),
  `${V.length} rows, every one typed correctly`);

console.log('\n=== 7-9. What the walk is for, and whether it says anything ===\n');

ok('THE GATE THE WALK EXISTS TO ENFORCE: no two stations of the same laboratory are indistinguishable from each other. A station that renders identically to its sibling is a station the reader cannot tell they have switched to',
  C.indistinguishable_station_pairs === 0,
  `${C.stations} stations, ${C.indistinguishable_station_pairs} indistinguishable pairs`);

ok('and STILLNESS IS NOT FAILURE, which the file says in its own note rather than leaving to a reader to infer: a laboratory meant to be a diagram recomputes nothing per frame and is right not to. Twenty-five views are still and the artifact treats that as a fact about them, not a defect',
  still > 0 && typeof L.note === 'string' && /NEITHER IS A VERDICT/.test(L.note),
  `${still} still views, and the artifact carries the note saying neither rebuilds nor moves is a verdict`);

ok('AND THE SUMMARY IS NON-TRIVIAL. A file in which everything was alive, or nothing was, would satisfy every arithmetic check above and tell nobody anything — so both sides must be populated, and most views must be doing something, which is what makes the still ones worth looking at',
  alive > 0 && still > 0 && alive > still && alive / V.length > 0.5 && still / V.length > 0.05,
  `${alive} alive and ${still} still — ${(100 * alive / V.length).toFixed(1)}% of views recompute something, and the remainder is large enough to be a finding rather than a rounding`);

/* ── THE THIRD READING MUST NOT GO SILENT ────────────────────────────────────
   RECOMPUTED and MOVED were read as a verdict they explicitly disclaim: twenty-five
   views scoring zero on both were taken for static pictures and lined up to be
   "given motion". Driving every control of the least promising of them and
   comparing the RENDERED IMAGE showed all four self-animating and responding, and
   the full walk then showed all twenty-five alive — through materials, shaders and
   inherited rotation, none of which dirties a buffer or moves a watched body.
   PIXELS is that third, orthogonal reading, and these clauses exist so it cannot
   quietly vanish from the artifact and let the same misreading happen again. */
ok('every view carries the third reading, so a still-looking view can be told from a broken one',
  V.every(v => Object.prototype.hasOwnProperty.call(v, 'pixels')),
  `${V.filter(v => v.pixels !== null).length} of ${V.length} measured — it is taken only where the other two counters are silent, which is the only place it says anything`);
ok('and it is present for EVERY view that neither rebuilds nor moves, which is where it is the whole evidence',
  V.filter(v => !v.rebuilds && !v.moves).every(v => v.pixels !== null),
  `${V.filter(v => !v.rebuilds && !v.moves).length} still views, all measured`);

{
  const still  = V.filter(v => !v.rebuilds && !v.moves);
  const shimmer = still.filter(v => v.pixels === true);
  const frozen  = still.filter(v => v.pixels === false);
  ok('and a view that neither rebuilds nor moves is not thereby dead — the artifact says which of them are alive anyway',
    still.length === 0 || shimmer.length + frozen.length === still.length,
    `${still.length} neither rebuild nor move · ${shimmer.length} alive through materials · ${frozen.length} render an identical image`);
  /* NOT a threshold and NOT a verdict: a frozen view may be a diagram that is
     right to be still. What it may not be is unnamed — a view whose image never
     changes is the one shape the other two counters cannot distinguish from a
     laboratory that broke, so it is listed by name for a person to judge. */
  ok('and any view whose image never changes is named rather than folded into a count',
    frozen.length === 0 || frozen.every(v => v.lab),
    frozen.length ? `frozen: ${frozen.map(v => v.lab + (v.station ? '/' + v.station : '')).join(' ')}` : 'none render an identical image between frames');
}

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
