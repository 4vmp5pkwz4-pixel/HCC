#!/usr/bin/env node
'use strict';
/* THE REMEDY FOR A HABIT, TESTED AGAINST THE THREE DEFECTS IT EXISTS TO PREVENT.
 *
 * Three times in one day a regex in a verifier of mine refused a character the data
 * actually contains, matched a SUBSET of its subject, reported that subset as a
 * whole count, and PASSED:
 *
 *   [a-z]+      missed a thread family called h0                13 of 14
 *   [a-z0-9]+   refused the hyphen in 'galactic-year'           10 of 12
 *   [a-z_0-9]+  refused the capitals in spin.CHSH and sn.L       4 of 11
 *
 * docs/lib/atlas-source.cjs is the structural answer, and its second half is the
 * part that matters: every extractor counts its subject a SECOND way, by a cruder
 * method that cannot be wrong in the same direction, and THROWS when the pattern
 * matches fewer rows than that count. Not a better regex — a refusal to report a
 * partial match as a whole one.
 *
 * This file re-introduces each of the three patterns and requires the library to
 * throw. A remedy that is not tested against the defect it was written for is a
 * hope, and this repository has spent the day proving what those are worth.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const LIB = path.join(__dirname, 'lib', 'atlas-source.cjs');
let pass = 0, fail = 0;
/* a failing check must not print the sentence written for the passing case */
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const gb = fs.readFileSync(path.join(ROOT, 'core/cycles/galactic-butterfly.mjs'), 'utf8');
const original = fs.readFileSync(LIB, 'utf8');
const A = require(LIB);

/* ── it reads the real thing, and agrees with an independent count ────────── */
const fams = A.threadFamilies(src), rows = A.threadRows(src), pubs = A.busPublications(src);
ok('the library reads every declaration the atlas actually carries',
  fams.length >= 18 && rows.length >= 90 && new Set(pubs).size >= 257
  && A.sourcedConnections(gb).length >= 12 && A.sourcedSources(gb).length >= 17,
  `${fams.length} families · ${rows.length} rows · ${new Set(pubs).size} published keys · `
  + `${A.sourcedConnections(gb).length} sourced connections · ${A.sourcedSources(gb).length} sources`);

ok('and the fields a check needs come back parsed, not left as raw text',
  rows.filter(r => r.station).length >= 7 && rows.filter(r => r.cyc).length >= 21
  && fams.filter(f => f.kind === 'identity').length === 1,
  `${rows.filter(r => r.station).length} station-gated rows · ${rows.filter(r => r.cyc).length} cycles-frame rows · `
  + `${fams.filter(f => f.kind === 'identity').length} identity family`);

/* ── THE THREE HISTORICAL PATTERNS, EACH REQUIRED TO THROW ────────────────── */
const withId = (klass) => original.replace('const ID = "[A-Za-z0-9_.-]+";', `const ID = "${klass}";`);
const attempt = (klass, fnName, text) => {
  fs.writeFileSync(LIB, withId(klass));
  delete require.cache[require.resolve(LIB)];
  try { const L = require(LIB); const n = L[fnName](text).length;
    return { threw: false, n }; }
  catch (e) { return { threw: true, message: String(e.message) }; }
  finally { fs.writeFileSync(LIB, original); delete require.cache[require.resolve(LIB)]; }
};
const cases = [
  ['[a-z]+', 'threadFamilies', src, 'the pattern that missed a family called h0'],
  ['[a-z0-9]+', 'sourcedConnections', gb, 'the pattern that refused the hyphen in galactic-year'],
  ['[a-z_0-9]+', 'threadRows', src, 'the pattern that refused the capitals in spin.CHSH'],
];
for (const [klass, fnName, text, label] of cases) {
  const r = attempt(klass, fnName, text);
  ok(`${klass} — ${label} — is REFUSED rather than reported as a whole count`,
    r.threw && /it is refusing rows that exist/.test(r.message),
    r.threw ? r.message.split(' — ')[1].split(',')[0]
      : `it passed silently with ${r.n} rows, and the defect would have shipped`);
}

/* ── and the census is not vacuous: a correct pattern must NOT throw ──────── */
let clean = true, why = '';
try { A.threadFamilies(src); A.threadRows(src); A.busPublications(src);
      A.sourcedConnections(gb); A.sourcedSources(gb); }
catch (e) { clean = false; why = e.message; }
ok('and the census does not fire on the patterns that are right — a check that cannot pass is no better than one that cannot fail',
  clean, clean ? 'all five extractors run clean on the current source' : why);

/* ── the verifiers that had those patterns now read through the library ───── */
const users = ['verify-bus-readers.cjs', 'verify-galactic-butterfly-explorer.cjs']
  .map(f => ({ f, s: fs.readFileSync(path.join(__dirname, f), 'utf8') }));
ok('the two verifiers that carried those patterns read through the library instead',
  users.every(u => /require\('\.\/lib\/atlas-source\.cjs'\)/.test(u.s)),
  users.filter(u => !/atlas-source/.test(u.s)).map(u => u.f).join(' ') || users.map(u => u.f).join(' · '));
ok('and neither of them still writes its own id character class',
  users.every(u => !/\[a-z_?0-9\]\+|\{id:'\(\[a-z/.test(u.s)),
  users.filter(u => /\[a-z_?0-9\]\+/.test(u.s)).map(u => u.f).join(' ') || 'no hand-written id class left in either');

console.log('\n' + (fail ? ('✖ ' + fail + ' FAILED, ' + pass + ' passed') : ('✔ ALL ' + pass + ' CHECKS PASSED')));
process.exit(fail ? 1 : 0);
