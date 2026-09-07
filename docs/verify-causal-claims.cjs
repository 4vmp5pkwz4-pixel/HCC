#!/usr/bin/env node
/* ============================================================================
   THE SENTENCE BESIDE THE NUMBER

   This atlas checks numbers ferociously and prose not at all. Ninety-six
   verifiers ask whether a value is right; not one asks whether the sentence
   beside it names the reason. That gap was paid for twice in a single session.

   Once, the stellar-wind laboratory said a wind lengthens a star's life because
   it takes the envelope while the core keeps its fuel. A mutant that deleted
   that assumption passed every check: the lengthening comes from the exponent,
   L falling as M^3.5 against the fuel's M, and not from the geometry at all. A
   true sentence about the physics doing no work in the result it explained.

   Once more, a cycle description said a period was DERIVED rather than stored
   while the cycle went on reading the stored constant — and the open problem
   recording the first failure had already been written before the second was
   committed. Writing down that a class of defect exists does not stop you
   committing it again. Only a check does.

   So a causal claim is a DECLARATION in this atlas now. It names the quantity
   it holds responsible and supplies the way to set that quantity aside. This
   file neutralises each named cause and demands the result actually move.

   A claim whose cause can be removed without consequence is FALSE AS A CLAIM
   even when every number around it is correct — which is precisely what prose
   cannot express and a table can.

   What this does NOT settle is whether the physics is true. It settles whether
   the stated reason is load-bearing in the atlas's own arithmetic: the half a
   machine can decide, and the half that was going unchecked.
   ========================================================================== */
'use strict';
const path = require('path');
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

(async () => {
const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
const CLAIMS = K.HCC_BECAUSE;

console.log('\n=== Every declared cause, neutralised and measured ===\n');

ok('THE TABLE EXISTS AND IS NOT EMPTY, which is the first thing a table of claims can be wrong about: an empty one satisfies every check below by vacuum and asserts that this atlas makes no causal claims, which is false of every laboratory in it',
  Array.isArray(CLAIMS) && CLAIMS.length >= 4,
  `${CLAIMS.length} causal claims declared with a named cause and a way to remove it`);

ok('and every entry is COMPLETE — a claim, the quantity it blames, a result, a way to neutralise that quantity, and what it expects to happen. An entry missing its neutraliser is a sentence again',
  CLAIMS.every(c => c.id && c.claim && c.cause && typeof c.result === 'function'
    && typeof c.neutralised === 'function' && c.expect),
  'each carries id, claim, cause, result, neutralised and a typed expectation');

for (const c of CLAIMS) {
  let base = null, off = null, err = null;
  try { base = c.result(); off = c.neutralised(); }
  catch (e) { err = String(e.message || e); }

  const finite = Number.isFinite(base) && Number.isFinite(off);
  let held = false, detail = '';

  if (err) { detail = 'threw: ' + err; }
  else if (!finite) { detail = `non-finite: ${base} / ${off}`; }
  else if (c.expect === 'vanishes') {
    held = Math.abs(off) < Math.abs(base) * 1e-6;
    detail = `${base.toPrecision(6)} with the cause, ${off.toPrecision(3)} without — ${held ? 'it vanishes' : 'IT SURVIVES, so the cause is not what produces it'}`;
  } else if (c.expect === 'shrinks') {
    const by = c.by || 2;
    const eB = Math.abs(base - 1), eO = Math.abs(off - 1);   /* excess over unity */
    held = eO * by <= eB;
    detail = `excess ${eB.toPrecision(4)} with the cause, ${eO.toPrecision(4)} without — a factor of ${(eB / eO).toFixed(2)}, needed ${by}`;
  } else if (c.expect === 'grows') {
    const by = c.by || 10;
    held = Math.abs(off) >= Math.abs(base) * by;
    detail = `${base.toPrecision(4)} with the cause, ${off.toPrecision(4)} without — a factor of ${(off / base).toFixed(0)}, needed ${by}`;
  } else if (c.expect === 'unchanged') {
    held = (base === off) || Math.abs(off - base) <= Math.abs(base) * 1e-9;
    detail = `${base} either way — ${held ? 'and the claim is precisely that removing this changes nothing' : 'IT MOVED, so the cause IS selecting after all'}`;
  } else { detail = 'unknown expectation type: ' + c.expect; }

  ok(`${c.id} — ${c.claim}`, held, `cause: ${c.cause}\n         ${detail}`);
}

console.log('\n=== And the instrument caught turning on itself ===\n');

ok('A CLAIM CAN NOW BE FALSE WHILE EVERY NUMBER AROUND IT IS RIGHT, and this proves the file can tell: a synthetic claim blaming a quantity that does nothing — the result computed identically with and without it — is rejected by exactly the test that accepts the real ones',
  (() => {
    const fake = { id: 'synthetic', claim: 'x because y', cause: 'a quantity that does nothing',
      result: () => 42, neutralised: () => 42, expect: 'vanishes' };
    const b = fake.result(), o = fake.neutralised();
    return !(Math.abs(o) < Math.abs(b) * 1e-6);   /* must NOT hold */
  })(),
  'a cause whose removal leaves the result at 42 fails the vanishing test, which is what makes the passes above mean something');

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
})();
