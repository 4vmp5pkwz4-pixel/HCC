#!/usr/bin/env node
/* ============================================================================
   THE OPEN-PROBLEMS ARTIFACT, ASSERTED RATHER THAN MERELY REPRODUCED

   api/open-problems.json is how this atlas publishes what it does NOT know: a
   hundred and ninety-two declared open problems, their status, and their text.
   It was guarded by reproduction alone -- regenerated and diffed -- which
   catches a stale or hand-edited file exactly and is blind to a wrong
   generator, because a generator that is wrong today writes the same wrong
   answer twice and the diff comes back clean.

   The strongest check available is the code hash.  The artifact states a
   sha256 of the core, and this file RECOMPUTES it: the list of hashed files is
   read out of core/index.mjs as text, the files are read and concatenated here,
   and the digest is taken here.  Nothing is imported from the atlas and no
   stated hash is trusted, so a generator writing a plausible wrong digest fails
   even though regenerating the file would reproduce that digest exactly.

   AND ONE THING IS ASSERTED THAT LOOKS LIKE A BUG AND IS NOT.  Twenty-five of
   the entries share a lab_id with another entry.  That is correct: lab_id names
   the LABORATORY, not the problem, and a laboratory may owe several things --
   the wireless-transfer bench owes five.  A check demanding unique ids would
   fail on correct data, so the opposite is asserted here: duplicates must
   remain possible, and a future de-duplication would have to justify itself
   against this rather than pass quietly.

   NINE THINGS ARE CHECKED.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const O = JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'open-problems.json'), 'utf8'));
const P = O.problems || [];
const MAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'manifest.json'), 'utf8'));

/* the hash, recomputed here from the bytes rather than read from anywhere */
const recomputed = (() => {
  try {
    const src = fs.readFileSync(path.join(ROOT, 'core', 'index.mjs'), 'utf8');
    const m = src.match(/function coreHash\(\)\s*\{([\s\S]*?)return sha256/);
    if (!m) return null;
    const files = [...m[1].matchAll(/'([^']+\.mjs)'/g)].map(x => x[1]);
    if (!files.length) return null;
    const joined = files.map(f => fs.readFileSync(path.join(ROOT, 'core', f), 'utf8')).join('\n');
    return { hash: crypto.createHash('sha256').update(joined).digest('hex'), n: files.length };
  } catch (e) { return null; }
})();

const ids = P.map(p => p.lab_id);
const byId = {};
for (const p of P) (byId[p.lab_id] = byId[p.lab_id] || []).push(p);
const shared = Object.values(byId).filter(v => v.length > 1);

console.log('\n=== 1-3. The artifact, and the count it claims ===\n');

ok('the artifact is the schema it claims and carries entries — a header with nothing under it would satisfy every check below by vacuum',
  O.schema === 'hcc.open-problems/1' && Array.isArray(P) && P.length >= 100,
  `schema ${O.schema} · ${P.length} declared open problems`);

ok('THE COUNT IS RECOMPUTED from the entries rather than read from the header. A generator that appended a problem and forgot to increment, or incremented without appending, writes a file that is internally inconsistent and reproduces that inconsistency perfectly on every rerun',
  O.count === P.length, `the header says ${O.count} · the entries number ${P.length}`);

ok('and the core version and hash it carries agree with the manifest, so the two published artifacts cannot describe different builds of the same atlas',
  O.core_version === MAN.core.version && O.code_sha256 === MAN.core.code_sha256,
  `open-problems ${O.core_version} / ${String(O.code_sha256).slice(0, 12)}… · manifest ${MAN.core.version} / ${String(MAN.core.code_sha256).slice(0, 12)}…`);

console.log('\n=== 4. The hash, recomputed from the bytes ===\n');

ok('THE CODE HASH IS RECOMPUTED HERE FROM THE FILES THEMSELVES, which is the one check reproduction cannot make. The list of hashed files is read out of core/index.mjs as text, the twenty-seven files are read and concatenated here, and the digest is taken here — nothing is imported from the atlas and no stated hash is trusted anywhere. A generator writing a plausible but wrong digest would reproduce that digest exactly on every rerun and be caught only by somebody doing the arithmetic again, which is what this does',
  recomputed != null && recomputed.hash === O.code_sha256 && recomputed.n >= 20,
  recomputed == null ? 'the hash could not be recomputed — the coreHash body was not found'
    : `${recomputed.n} core files hashed here · ${recomputed.hash.slice(0, 16)}… against the stated ${String(O.code_sha256).slice(0, 16)}…`);

console.log('\n=== 5-7. Every entry, and the vocabulary they draw on ===\n');

ok('every entry names a laboratory, carries a status, and says something — an open problem with no text is a placeholder pretending to be an admission',
  P.every(p => typeof p.lab_id === 'string' && p.lab_id.length > 0
    && typeof p.status === 'string' && p.status.length > 0
    && typeof p.problem === 'string' && p.problem.length >= 20),
  `${P.length} entries, every one with an id, a status and text of at least twenty characters`);

ok('the statuses come from a closed vocabulary rather than being free text, so "OPEN" and "open" and "Open" cannot drift into three categories that mean one thing',
  (() => { const allowed = new Set(['OPEN', 'SYNTHETIC_ONLY', 'REFERENCE_MODEL', 'CONDITIONAL', 'NUMERICALLY_VERIFIED', 'EXACT', 'NOT_IMPLEMENTED']);
    return P.every(p => allowed.has(p.status)); })(),
  `statuses in use: ${[...new Set(P.map(p => p.status))].sort().join(', ')}`);

ok('and the collection is SUBSTANTIVE rather than a list of stubs: the median entry runs to well over a hundred characters, because an open problem worth publishing has to say what is not known and why that matters',
  (() => { const lens = P.map(p => p.problem.length).sort((a, b) => a - b);
    const median = lens[Math.floor(lens.length / 2)];
    return median > 120 && Math.max(...lens) > 1000; })(),
  (() => { const lens = P.map(p => p.problem.length).sort((a, b) => a - b);
    return `median ${lens[Math.floor(lens.length / 2)]} characters · longest ${lens[lens.length - 1]}`; })());

console.log('\n=== 8-9. The thing that looks like a bug and is not ===\n');

ok('TWENTY-FIVE ENTRIES SHARE A LAB_ID WITH ANOTHER ENTRY, AND THAT IS CORRECT. lab_id names the LABORATORY and not the problem, so a laboratory may owe several things at once — the wireless-transfer bench owes five, the edge no-go owes five, the resonance identifier owes four. A check demanding unique identifiers would fail on entirely correct data, which is why the opposite is asserted: sharing must remain possible, and a future de-duplication would have to answer to this check rather than pass quietly',
  shared.length >= 5 && shared.some(v => v.length >= 4)
    && shared.every(v => new Set(v.map(p => p.problem)).size === v.length),
  `${ids.length - new Set(ids).size} entries share an id across ${shared.length} laboratories, and within every one of them the problems are distinct texts`);

ok('and the atlas is honest about breadth as well as depth: the problems are spread across many laboratories rather than piled on one, so the count is not a single bench`s confession inflating a repository-wide number',
  (() => { const pre = {}; for (const p of P) { const k = String(p.lab_id).split('.')[0]; pre[k] = (pre[k] || 0) + 1; }
    return Object.keys(pre).length >= 5 && new Set(ids).size >= 100; })(),
  (() => { const pre = {}; for (const p of P) { const k = String(p.lab_id).split('.')[0]; pre[k] = (pre[k] || 0) + 1; }
    return `${new Set(ids).size} distinct laboratories across ${Object.keys(pre).length} families: ${Object.entries(pre).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => k + ' ' + v).join(', ')}`; })());

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
