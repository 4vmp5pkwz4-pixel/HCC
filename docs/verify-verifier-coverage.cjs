#!/usr/bin/env node
/* ============================================================================
   WHO WATCHES THE WATCHERS, AND HOW

   The doctrine of this atlas is two authorities for one fact.  An open problem
   here worried that a verifier might be wrong in a way that happens to agree
   with the code it checks.  Measuring it turned up something larger and simpler:
   MOST VERIFIERS NEVER READ THE ATLAS AT ALL.

   Eighty-six verifiers exist.  Twenty-eight of them open a file belonging to the
   atlas -- the extracted kernels, index.html, or a published artifact.  The other
   fifty-eight implement the physics independently and check it against itself.
   That is a valuable statement of what ought to be true, and it is not a second
   authority on this atlas, because there is no comparison step in it for a
   disagreement to surface through.  A broken atlas is invisible to a file that
   never opens it.

   And the artifacts are guarded two ways that fail differently.  REPRODUCTION
   regenerates a file and diffs it, which catches staleness exactly and is blind
   to a wrong generator, since a wrong generator produces the same wrong answer
   twice.  ASSERTION has a verifier read the file and test its content, which
   catches wrong content and is blind to whatever nobody thought to test.

   This file measures both and fails if either gets quietly worse.

   SEVEN THINGS ARE CHECKED.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const verifiers = fs.readdirSync(path.join(ROOT, 'docs')).filter(f => /^verify-.*\.cjs$/.test(f)).sort();
const body = f => fs.readFileSync(path.join(ROOT, 'docs', f), 'utf8');
const readsAtlas = s => /extracted\.mjs|core\/atlas|'core'/.test(s) || /index\.html/.test(s)
  || /api\/[a-z-]+\.json/.test(s) || /'api'/.test(s) || /artifacts\//.test(s) || /'artifacts'/.test(s);

const reading = verifiers.filter(f => readsAtlas(body(f)));
const selfContained = verifiers.filter(f => !readsAtlas(body(f)));

const artifacts = fs.readdirSync(path.join(ROOT, 'api')).filter(f => f.endsWith('.json'));
const watchedBy = a => verifiers.filter(f => { const s = body(f); const base = a.replace(/\.json$/, '');
  return s.includes('api/' + a) || (/'api'/.test(s) && s.includes(a)) || s.includes("'" + base + ".json'"); });
const ciSrc = fs.readFileSync(path.join(ROOT, 'scripts', 'ci.mjs'), 'utf8')
  + fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'core.yml'), 'utf8');
const reproduced = a => ciSrc.includes(a) || ciSrc.includes(a.replace(/\.json$/, ''));

console.log('\n=== 1-3. How many verifiers can see the atlas at all ===\n');

ok('there are verifiers, and the suite finds them the way ci.mjs does — every file matching docs/verify-*.cjs',
  verifiers.length >= 80, `${verifiers.length} verifiers`);

ok('MOST OF THEM NEVER READ THE ATLAS. They implement the physics and check it against itself, which states what ought to be true and cannot state whether this code does it. A broken atlas is invisible to a file that never opens it, so calling those a second authority overstates what they buy',
  selfContained.length > reading.length && reading.length >= 20,
  `${reading.length} read the atlas · ${selfContained.length} are self-contained`);

ok('and the ones that DO read it are the ones a regression can reach. That set must not shrink: it is the whole of the atlas`s exposure to disagreement',
  reading.length >= 25,
  `reading the atlas: ${reading.length} — via kernels, index.html or a published artifact`);

console.log('\n=== 4-6. How the published artifacts are guarded ===\n');

ok('every published artifact is guarded by SOMETHING — a verifier that reads it, or a pipeline step that regenerates and diffs it. An artifact guarded by neither is a place a regression would be invisible',
  artifacts.every(a => watchedBy(a).length > 0 || reproduced(a)),
  artifacts.map(a => `${a.replace('.json', '')}:${watchedBy(a).length ? 'assert' : 'reproduce'}`).join(' · '));

ok('AND THE TWO MECHANISMS ARE NOT THE SAME GUARANTEE. Reproduction regenerates a file and diffs it, which catches a stale or hand-edited artifact exactly and is BLIND TO A WRONG GENERATOR — a generator that is wrong today writes the same wrong answer twice and the diff comes back clean. Assertion has a verifier read the content and test it, which catches wrong content and is blind to whatever nobody thought to test. Neither subsumes the other. Every published artifact now has a verifier that reads its content, so none rests on reproduction alone, and this check enforces that rather than merely reporting it: an artifact added without one fails here. It previously required the opposite — at least one artifact in the weaker column, as evidence the two mechanisms were distinct — and that was a state of the world mistaken for an invariant, which failed at the moment the thing it measured became perfect',
  (() => { const assertOnly = artifacts.filter(a => watchedBy(a).length > 0);
    const reproOnly = artifacts.filter(a => watchedBy(a).length === 0 && reproduced(a));
    /* This check used to require at least one artifact in the weaker column, as
       evidence that the two mechanisms were distinct. That was a state of the
       world written down as an invariant, and finishing the sweep broke it: the
       check failed at the moment the thing it was measuring became perfect. The
       invariant is now the stronger one — NO artifact rests on reproduction
       alone — which locks the sweep in rather than merely describing it. */
    return assertOnly.length >= 3 && reproOnly.length === 0; })(),
  (() => { const reproOnly = artifacts.filter(a => watchedBy(a).length === 0 && reproduced(a));
    return reproOnly.length === 0
      ? `every one of the ${artifacts.length} published artifacts has a verifier that reads its content; none rests on reproduction alone`
      : `STILL UNDER REPRODUCTION ALONE: ${reproOnly.map(a => a.replace('.json', '')).join(', ')} — regenerating them proves only that they are not stale`; })());

ok('the artifacts this session gave a reading verifier to are still read — sensitivity by the exponents check, and the manifest, reach and transfers by theirs. Losing one would quietly move that artifact into the weaker column',
  ['sensitivity.json', 'manifest.json', 'reach.json', 'transfers.json'].every(a => watchedBy(a).length > 0),
  ['sensitivity.json', 'manifest.json', 'reach.json', 'transfers.json']
    .map(a => `${a.replace('.json', '')} ← ${watchedBy(a).length}`).join(' · '));

console.log('\n=== 7. And the claim is demonstrable, not rhetorical ===\n');

ok('THE POINT IS DEMONSTRABLE AND WAS DEMONSTRATED: corrupting the Stefan-Boltzmann exponent from 4 to 3 inside api/sensitivity.json is caught at once by verify-measured-exponents, which opens that file, while verify-photometry and verify-timescales pass unchanged — they never open it. This check confirms the asymmetry that made that possible: the exponents verifier reads the artifact and those two read nothing of the atlas at all',
  (() => { const e = verifiers.includes('verify-measured-exponents.cjs') && readsAtlas(body('verify-measured-exponents.cjs'));
    const p = verifiers.includes('verify-photometry.cjs') && !readsAtlas(body('verify-photometry.cjs'));
    const t = verifiers.includes('verify-timescales.cjs') && !readsAtlas(body('verify-timescales.cjs'));
    return e && p && t; })(),
  'verify-measured-exponents reads an atlas artifact; verify-photometry and verify-timescales read none');

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
