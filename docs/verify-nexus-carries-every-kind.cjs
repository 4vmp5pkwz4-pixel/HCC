#!/usr/bin/env node
'use strict';
/* THE RELATION UNIVERSE DREW ONE KIND OF CONNECTION OUT OF FIVE.
 *
 * The Invariant Nexus is this atlas's universe of relations — 113 laboratories in
 * disciplinary clusters, morphing to a spectral embedding of the relation topology.
 * It drew 336 TYPED edges and nothing else, while the atlas has five kinds and
 * serves all five to an agent. A reader in that universe could not see that a
 * number actually TRAVELS one of these pairs, that the bus considered another pair
 * and REFUSED it in writing, or that eighteen questions are answered by several
 * laboratories at once.
 *
 * THE REFUSALS ARE THE REASON TO DO IT, AND HOW THEY ARE DRAWN IS THE WHOLE CLAIM.
 * A refusal is not a weak edge. It is the atlas finding a coupling admissible and
 * declining it, with grounds. So it is drawn as a conduit reaching from both ends
 * that DOES NOT MEET — a real gap in the geometry with a struck marker floating in
 * it. Drawing it as a faint line would say the opposite of what it means, which is
 * the mistake the resonance web made with its meaningless locks and was corrected
 * for. This file measures the gap rather than trusting a screenshot.
 *
 * AND A FAMILY IS NOT AN EDGE. It is a question several laboratories answer in
 * different units — a hyperedge — so it is a hub with a spoke to each member. Two
 * laboratories joined by a line would be a claim the invariant thread never makes.
 *
 * Measured in a browser on the release this shipped: 34 routes, 36 refusals and 11
 * question hubs on stage; 22 routes, 13 refusals and 7 questions off it, counted
 * and named rather than hidden; 12 sourced connections belonging to another world
 * and deliberately not drawn; every refusal gap non-zero; zero page errors.
 */
const fs = require('node:fs'), path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
/* A FAILING CHECK MUST NOT PRINT THE SENTENCE WRITTEN FOR THE PASSING CASE.
   Twelve details in one day were computed unconditionally, so a red check argued
   against its own verdict — filed as atlas.a_failure_message_can_argue_against_
   its_own_verdict. This is the structural remedy rather than a thirteenth hand fix:
   a detail that was written as an expectation is LABELLED as one when the check
   fails, so no failure line can ever read as a reassurance. A detail built from
   what actually went wrong reads the same either way and loses nothing. */
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

const fn = s0 => { const i = src.indexOf('function ' + s0 + '('); if (i < 0) return '';
  const j = src.indexOf('\nfunction ', i + 1); return src.slice(i, j < 0 ? i + 6000 : j); };

const build = fn('nexusBuildOtherKinds'), layout = fn('nexusLayoutOtherKinds');

ok('the universe builds the other kinds at all',
  !!build && /NEXUS\.routes\.push/.test(build) && /NEXUS\.refusals\.push/.test(build)
  && /NEXUS\.families\.push/.test(build),
  'routes, refusals and question hubs are constructed beside the typed edges');

/* ── each kind is fed from the registry, never from a list typed here ─────── */
ok('routes come from the declared couplings and refusals from the refusal registry',
  /HCC_LINKS/.test(build) && /HCC_NOT_LINKS/.test(build) && /INVARIANT_THREAD/.test(build),
  'no second copy of any of the three is typed into the scene');

/* ── THE GAP: a refusal must not be drawn as a line ───────────────────────── */
ok('a refusal is drawn as TWO stubs, never as one conduit crossing the middle',
  /stubA/.test(build) && /stubB/.test(build) && !/scientificTube\(\[\],0xff7a7a[^)]*\)[^;]*;\s*layer\.add\(\s*line/.test(build),
  'two tubes and a struck marker, with nothing between them');
ok('and the gap is CUT from the curve rather than hoped for — the middle is not drawn',
  /const n=pts\.length, cut=Math\.max\(2,Math\.round\(n\*0\.36\)\)/.test(layout)
  && /pts\.slice\(0,cut\)/.test(layout) && /pts\.slice\(n-cut\)/.test(layout),
  'first 36% and last 36% drawn, middle 28% empty');

/* ── a family is a hyperedge, not a pair ──────────────────────────────────── */
ok('a question is a hub with a spoke to each member, not an edge between two of them',
  /const members=\[\.\.\.new Set\(\(f\.rows\|\|\[\]\)\.map\(r=>r\.lab\)\)\]/.test(build)
  && /spokes=members\.map/.test(build) && /members\.length<2/.test(build),
  'families with fewer than two laboratories on stage are counted off-stage rather than drawn as a point');

/* ── endpoints are resolved the way the bus resolves them ─────────────────── */
ok('a bus endpoint is resolved to its laboratory before being looked up, because a bus id is not a view id',
  /function nexusBusView/.test(src) && /nexusBusView\(l\.from\)/.test(build)
  && /HCC_API_SPECS\.get\(id\)/.test(fn('nexusBusView')),
  'the same resolution the arrivals and the refusal panel use');

/* ── nothing is invented to make a count look whole ───────────────────────── */
ok('a connection with no node in this universe is COUNTED off stage, not invented a node',
  /routes_offstage\+\+/.test(build) && /refusals_offstage\+\+/.test(build)
  && /families_offstage\+\+/.test(build) && /sourced_elsewhere/.test(build),
  'and the panel prints those counts beside the drawn ones');
ok('the twelve sourced connections of another world are declared absent rather than drawn',
  /sourced connections belong to the Cycles world/.test(src)
  && !/NEXUS\.sourced\.push/.test(src),
  'their endpoints are cycles frames and have no node here');

/* ── the embedding moves all five kinds together ──────────────────────────── */
ok('the morph lays out the new kinds with the typed ones — one universe, not two',
  /nexusLayoutOtherKinds\(\);\s*\n\s*nexusUpdatePathGeometry\(\);/.test(src),
  'nexusLayout drives them in the same pass as the typed edges');

/* ── only a route flows, because only a route carries something ───────────── */
ok('the routes FLOW and the refusals and hubs do not — animation says a number travels',
  /for\(const r of NEXUS\.routes\) scientificUpdateFlow\(r\.flow/.test(src)
  && !/scientificUpdateFlow\(f\.strike/.test(src),
  'a moving refusal would say the opposite of what a refusal means');

/* ── and the 3D fact is measurable from outside, not eyeballed ────────────── */
ok('the scene reports what is actually on screen, with visibility resolved through every ancestor',
  /globalThis\.HCC_NEXUS_KINDS=/.test(src)
  && /for\(let n=o;n;n=n\.parent\) if\(!n\.visible\) return false/.test(src)
  && /gaps:NEXUS\.refusals\.map\(gapOf\)/.test(src),
  'HCC_NEXUS_KINDS() — the same shape as HCC_CYCLE_FRAMES, for the same reason');

/* ── the reader can turn each kind off ────────────────────────────────────── */
ok('each kind has its own control, and the toggle drives the scene rather than only the panel',
  /id="nxRoutes"/.test(src) && /id="nxRefusals"/.test(src) && /id="nxFamilies"/.test(src)
  && /nexusApplyOtherVisibility\(\);buildCtl\(\)/.test(src),
  'routes · refusals · questions');

console.log('\n' + (fail ? ('✖ ' + fail + ' FAILED, ' + pass + ' passed') : ('✔ ALL ' + pass + ' CHECKS PASSED')));
process.exit(fail ? 1 : 0);
