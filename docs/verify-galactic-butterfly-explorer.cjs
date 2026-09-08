#!/usr/bin/env node
'use strict';
/* THE VALIDATION THIS RELEASE CITED WAS NEVER PERFORMED.
 *
 * v4.172.0's notes say "seven Node tests covering independent geometric reference
 * values, calendar closure, date-domain rejection, bounded Venus traces, synthetic
 * cycle semantics, finite geometry, buffer reuse and disposal". Nothing ran them:
 * package.json's test:source did not name the file and core.yml's step list does
 * not invoke it either -- its verifier loop walks docs/verify-*.cjs, and there was
 * no verifier for this. A test that nothing executes is a claim, not a check.
 *
 * This is the executor for the six that need no dependency. The seventh, which
 * needs a THREE implementation, has its own verifier beside this one so that both
 * halves are run rather than one half being quietly dropped.
 *
 * It also holds the contract the tests do NOT cover: that every sourced connection
 * carries a source that exists, that every source carries a URL and a kind, and
 * that no relation points at a view the explorer does not have. Those are the
 * facts an agent reading this surface depends on, and they were unchecked.
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const A = require('./lib/atlas-source.cjs');

let pass = 0, fail = 0;
/* A FAILING CHECK MUST NOT PRINT THE SENTENCE WRITTEN FOR THE PASSING CASE.
   Twelve details in one day were computed unconditionally, so a red check argued
   against its own verdict — filed as atlas.a_failure_message_can_argue_against_
   its_own_verdict. This is the structural remedy rather than a thirteenth hand fix:
   a detail that was written as an expectation is LABELLED as one when the check
   fails, so no failure line can ever read as a reassurance. A detail built from
   what actually went wrong reads the same either way and loses nothing. */
const ok = (name, cond, detail) => { if (cond) { pass++; console.log('  PASS — ' + name + (detail ? ' :: ' + detail : '')); }
  else { fail++; console.log('  FAIL — ' + name + (detail ? ' :: EXPECTED ' + detail : '')); } };

/* ── the six dependency-free tests, actually executed ──────────────────────── */
const run = spawnSync(process.execPath, ['--test', 'test/galactic-butterfly.test.mjs'],
  { cwd: ROOT, encoding: 'utf8' });
const out = (run.stdout || '') + (run.stderr || '');
const n = (re) => { const m = out.match(re); return m ? Number(m[1]) : null; };
const ran = n(/^# tests (\d+)$/m), passed = n(/^# pass (\d+)$/m),
      failed = n(/^# fail (\d+)$/m), skipped = n(/^# skipped (\d+)$/m);
if (run.status !== 0) process.stdout.write(out);
ok('the explorer kernel tests RUN, and this is where they run',
  run.status === 0 && ran >= 6 && passed === ran && failed === 0 && skipped === 0,
  ran === null ? ('the runner produced no summary — exit ' + run.status)
    : (ran + ' tests · ' + passed + ' passed · ' + failed + ' failed · ' + skipped + ' skipped'));

/* ── and the contract the tests do not state ───────────────────────────────── */
const src = fs.readFileSync(path.join(ROOT, 'core/cycles/galactic-butterfly.mjs'), 'utf8');
/* read through docs/lib/atlas-source.cjs, which counts each construct a second way
   and throws when a pattern matches fewer rows than the file contains — the remedy
   for the three subset-matching patterns of mine that passed in one day, one of
   them in this very file */
const sources = A.sourcedSources(src);
const sourceIds = sources.map(s0 => s0.id);
const sourceUrls = sources.filter(s0 => /^https?:\/\//.test(s0.url) && s0.kind);
ok('every declared source carries a title, a URL and a kind — a citation with no link is not provenance',
  sourceIds.length >= 17 && sourceUrls.length === sourceIds.length,
  sourceUrls.length + ' of ' + sourceIds.length + ' sources fully formed');

/* the id may carry a digit or a hyphen ('galactic-year', '1987-2012'), which the
   first draft of this pattern did not allow -- it matched ten of twelve and would
   have called that whole. The library reads them now and refuses a subset. */
const rowObjs = A.sourcedConnections(src);
const rows = rowObjs.map(r => [null, r.id, r.kind, r.view]);
const citations = A.sourcedCitations(src);
const cited = citations.flatMap(r => r.cites);
const unknown = [...new Set(cited)].filter(id => !sourceIds.includes(id));
ok('every citation resolves to a source that exists',
  rows.length >= 12 && unknown.length === 0,
  unknown.length ? ('cited but not declared: ' + unknown.join(' '))
    : (rows.length + ' connections citing ' + new Set(cited).size + ' distinct sources'));

/* AND THE OTHER DIRECTION, WHICH IS THE ONE THAT WAS BROKEN. Seventeen sources were
   declared and sixteen cited: the NASA 2027 eclipse catalogue was carried, complete
   with its URL, and no connection pointed at it -- provenance for a claim nobody
   made. It is the catalogue behind the eclipse event jumps, so the eclipse
   connection cites it now. Same shape as an orphaned bus publication: a thing
   published to nobody is not evidence, it is furniture. */
const uncitedSources = sourceIds.filter(id => !cited.includes(id));
ok('and every declared source is cited by something — provenance for no claim is not provenance',
  uncitedSources.length === 0,
  uncitedSources.length ? ('declared but cited by nothing: ' + uncitedSources.join(' '))
    : (sourceIds.length + ' sources, all of them backing at least one connection'));

const VIEWS = ['sky', 'venus', 'solar', 'nebula', 'galaxy'];
const badView = rows.filter(r => !VIEWS.includes(r[3])).map(r => r[1] + '→' + r[3]);
ok('no connection points at a view the explorer does not have',
  badView.length === 0,
  badView.length ? badView.join(' ') : rows.length + ' connections across ' + new Set(rows.map(r => r[3])).size + ' views: ' + [...new Set(rows.map(r => r[3]))].join(' '));

const uncited = citations.filter(r => !r.cites.length).map(r => r.id);
ok('and not one of them is unsourced — the explorer\'s whole claim is that it cites',
  uncited.length === 0, uncited.length ? ('no source: ' + uncited.join(' ')) : 'every connection carries at least one');

/* ── the kinds are a declared vocabulary, not free text ────────────────────── */
/* READ OFF THE MODULE, NOT INVENTED HERE. The first draft of this list was seven
   kinds I expected; the module declares ten, six of which I had not guessed
   (HISTORICAL_ASTRONOMY, CALENDAR_ARITHMETIC, ASTRONOMY, OBSERVED_PATTERN,
   STATISTICAL, MORPHOLOGY). A vocabulary check whose vocabulary is a guess tests
   the guesser. What matters is that the set is CLOSED and each kind is used --
   an agent can only tell a measurement from an analogy if the kinds are few,
   declared and non-overlapping, so a new one appearing is a decision to make
   rather than a word to type. */
const KINDS = ['CULTURAL', 'GEOMETRY', 'REFERENCE_MODEL', 'HISTORICAL_ASTRONOMY',
  'CALENDAR_ARITHMETIC', 'ASTRONOMY', 'OBSERVED_PATTERN', 'STATISTICAL', 'MORPHOLOGY'];
const strayKind = [...new Set(rows.map(r => r[2]))].filter(k => !KINDS.includes(k));
const usedKinds = [...new Set(rows.map(r => r[2]))];
ok('every connection declares one of the vocabulary\'s kinds, and every kind in the vocabulary is used',
  strayKind.length === 0 && KINDS.every(k => usedKinds.includes(k)),
  strayKind.length ? ('undeclared kind: ' + strayKind.join(' '))
    : (KINDS.filter(k => !usedKinds.includes(k)).length
        ? ('declared but unused: ' + KINDS.filter(k => !usedKinds.includes(k)).join(' '))
        : usedKinds.length + ' kinds, all used: ' + usedKinds.sort().join(' · ')));

/* ── and both halves of the split are wired, in a workflow that can run them ─ */
const pkg = fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8');
ok('the dependency-free half runs in the workflow that runs on every push',
  /verify-galactic-butterfly-explorer\.cjs/.test(pkg),
  'named in package.json test:source, which is what validate.yml runs');
ok('and the scene half has a verifier of its own, so the seventh test is not dropped',
  fs.existsSync(path.join(ROOT, 'docs/verify-galactic-butterfly-scene.cjs'))
  && fs.existsSync(path.join(ROOT, 'test/galactic-butterfly-scene.test.mjs')),
  'docs/verify-galactic-butterfly-scene.cjs runs in the core workflow verifier loop, where three is installed');

console.log('\n' + (fail ? ('✖ ' + fail + ' FAILED, ' + pass + ' passed') : ('✔ ALL ' + pass + ' CHECKS PASSED')));
process.exit(fail ? 1 : 0);
