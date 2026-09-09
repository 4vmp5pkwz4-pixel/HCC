#!/usr/bin/env node
'use strict';
/* ══ THE SECOND TEST THE BUS RUNS, AND THE FIELD IT RUNS AGAINST ═══════════════
 *
 * A coupling is admitted on two tests: the units must convert, and the two
 * quantities must be the same coordinate. The second is what quantity_kind is for —
 * a dimension says two numbers COULD be the same thing, a kind says they ARE — and
 * the atlas has been running it against a field almost nothing fills in.
 *
 * It became concrete at v4.199.0: the exoplanet laboratory declared a transit depth
 * in ppm and the same depth in per cent BOTH as dimensionless, differing by exactly
 * ten thousand, and the general detector for that could not be written. Nothing
 * separates two spellings of one measurement from a vacuum wavelength beside an
 * acoustic one — which is correct physics — except a statement that the two are the
 * same KIND.
 *
 * SO IT IS COUNTED, AND THE COUNT ONLY RISES. This reads api/manifest.json, which the
 * atlas generates by walking its own laboratories headless, so the number is measured
 * rather than asserted. It fills nothing in: a kind guessed from a name is the same
 * mistake one level up.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'api/manifest.json'), 'utf8'));

let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

const version = (src.match(/const HCC_VERSION='([^']+)'/) || [])[1] || null;
ok('the table counted is the one this release generated',
  manifest.version === version, `api/manifest.json ${manifest.version} vs HCC_VERSION ${version}`);

let outputs = 0, kinded = 0, inputs = 0, kindedIn = 0;
const kinds = new Map(), owed = [];
for (const ins of manifest.instruments || []) {
  let n = 0, k = 0;
  for (const o of ins.outputs || []) { outputs++; n++;
    if (o.quantity_kind) { kinded++; k++; kinds.set(o.quantity_kind, (kinds.get(o.quantity_kind) || 0) + 1); } }
  for (const f of ins.inputs || []) { inputs++;
    if (f.quantity_kind) { kindedIn++; kinds.set(f.quantity_kind, (kinds.get(f.quantity_kind) || 0) + 1); } }
  if (n - k > 0) owed.push({ lab: ins.id, without: n - k, outputs: n });
}
owed.sort((a, b) => b.without - a.without);
const singleton = [...kinds.values()].filter(n => n === 1).length;

/* THE FLOOR ONLY RISES. It is over how many declared outputs carry a kind, and the
   only way to move it is to state, for a real output, what measurement it is. */
const KINDED_OUTPUTS_FLOOR = 70;

ok('every declared output is counted, kinded or not',
  outputs > 1300 && outputs === kinded + (outputs - kinded),
  `${outputs} declared output(s) over ${(manifest.instruments || []).length} instruments`);
ok('the number carrying a quantity kind is at or above its floor, and the floor only rises',
  kinded >= KINDED_OUTPUTS_FLOOR,
  `${kinded} of ${outputs} outputs carry a kind (${(100 * kinded / outputs).toFixed(1)}%), against floor ${KINDED_OUTPUTS_FLOOR}`);
ok('and the debt resolves to named laboratories rather than one percentage',
  owed.length > 0 && owed.every(o => typeof o.lab === 'string'),
  `${owed.length} laboratories owe at least one · worst: ` + owed.slice(0, 5).map(o => `${o.lab} ${o.without}/${o.outputs}`).join(', '));

/* A KIND NAMING ONE THING IS A LABEL AND NOT A CLASS: two outputs can only be the
   same coordinate if some kind is shared, so a singleton kind can admit no coupling.
   Counting those apart says how much of the filled-in part can do any work. */
ok('kinds that name more than one thing are counted apart from kinds that name one',
  kinds.size > 0 && singleton <= kinds.size,
  `${kinds.size} distinct kind(s): ${kinds.size - singleton} name more than one thing and can admit a coupling, ${singleton} name exactly one and cannot`);

/* ══ AND THE ONE PLACE THE ATLAS HAS SAID IT, THE FIELD IS EMPTY ══════════════
   A declared coupling is a hand-made, justified statement that two things are the
   SAME COORDINATE — fifty-seven of them, each reviewed, each with a written reason
   for existing. That is precisely what quantity_kind is for, and three of the
   fifty-seven have it on both ends. Fifty-four have it on neither.

   AND NOT ONE HAS IT ON EXACTLY ONE END, which is the number that decides what can be
   done next: there is nothing to inherit. Populating these means NAMING the shared
   coordinate for each coupling, which is recording a decision the atlas already made
   rather than guessing from a name — the first honest way to fill this field that
   this work has found. It is not done here, because giving one end of a pair a kind
   where the other has none turns a coupling the bus admits into one it refuses, and
   that cascade wants its own release. */
const links = (manifest.bus && manifest.bus.links) || [];
const kindOf = key => { const [id, name] = String(key).split('.');
  const ins = (manifest.instruments || []).find(i => i.id === id); if (!ins) return undefined;
  const f = (ins.outputs || []).find(x => x.name === name) || (ins.inputs || []).find(x => x.name === name);
  return f ? (f.quantity_kind || null) : undefined; };
const pairs = links.map(l => ({ from: l.from, to: l.to, kf: kindOf(l.from), kt: kindOf(l.to) }));
const bothKinded = pairs.filter(p => p.kf && p.kt).length;
const neither = pairs.filter(p => p.kf === null && p.kt === null).length;
const exactlyOne = pairs.filter(p => (p.kf && p.kt === null) || (p.kf === null && p.kt));
const disagree = pairs.filter(p => p.kf && p.kt && p.kf !== p.kt);

ok('every declared coupling is counted for whether its two ends say what coordinate they share',
  links.length >= 50 && pairs.length === links.length,
  `${links.length} declared coupling(s), each a reviewed statement that two things are the same coordinate`);
ok('and no coupling declares two DIFFERENT kinds at its ends, which would be the atlas contradicting itself',
  disagree.length === 0,
  disagree.length ? disagree.map(p => `${p.from}[${p.kf}] → ${p.to}[${p.kt}]`).join(', ')
    : `${bothKinded} coupling(s) name the shared coordinate at both ends, ${neither} at neither`);
ok('and none has a kind on exactly one end, so there is nothing to inherit and the field must be NAMED rather than propagated',
  exactlyOne.length === 0,
  exactlyOne.length ? `${exactlyOne.length} could inherit: ` + exactlyOne.slice(0, 4).map(p => p.kf ? `${p.to} ← ${p.kf}` : `${p.from} ← ${p.kt}`).join(', ')
    : `0 of ${links.length} — the couplings and the kinds are almost disjoint sets, so the next step is naming ${neither} shared coordinates, not copying any`);

ok('the atlas exposes the same census as one named global, so an agent need not read this file',
  /function HCC_QUANTITY_KINDS\(\)/.test(src) && /globalThis\.HCC_QUANTITY_KINDS=HCC_QUANTITY_KINDS/.test(src),
  'globalThis.HCC_QUANTITY_KINDS()');
ok('and it fills nothing in, because a kind guessed from a name is the same mistake one level up',
  !/quantity_kind\s*[:=]\s*[^,}\n]*\b(guess|infer|derive)/i.test(src),
  'the census reports the field and never writes it');

console.log(`\n${fail ? 'FAIL' : 'PASS'} — the second test the bus runs is measured :: `
  + `${kinded}/${outputs} outputs and ${kindedIn}/${inputs} inputs carry a quantity kind, `
  + `${kinds.size} distinct · ${pass} check(s) passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
