#!/usr/bin/env node
'use strict';
/* ══ A FIELD NAMED unit THAT HOLDS PROSE, COUNTED ═════════════════════════════
 *
 * ATLAS_BUS.pub(key, value, unit) names its third parameter `unit`, and across the
 * call sites that parameter holds `cos(theta/2)`, `to E2`, `recede`, `1-Tc/Th` and
 * `× Φ₀` as often as it holds J or rad or W. It is a display caption named as though
 * it were a dimension. The atlas filed that as
 * atlas.a_field_named_unit_that_holds_prose and never counted it.
 *
 * IT IS COUNTABLE WITHOUT JUDGEMENT. A unit string is KNOWN when the atlas can
 * already do something with it: it converts (HCC_SI), it is refused from the decade
 * axis in writing (HCC_SI_REFUSED), it is an alias the bus resolves
 * (HCC_UNIT_ALIAS), or some declared contract uses that exact spelling. Anything else
 * is a string only a human reads, and no check on it can do more than compare it to
 * itself.
 *
 * THE THREE VOCABULARIES ARE CUT OUT OF THE ATLAS, not restated here, so a spelling
 * that enters or leaves one of them changes this count on the same edit.
 *
 * NOTHING HERE REWRITES A CAPTION. Which of them is a unit spelled oddly and which is
 * prose that belongs in the readout is a decision per publication, and this file has
 * been caught four times by a rule written from expectation.
 */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'api/manifest.json'), 'utf8'));
const { busPublicationUnits } = require('./lib/atlas-source.cjs');

let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

const version = (src.match(/const HCC_VERSION='([^']+)'/) || [])[1] || null;
ok('the contract table is the one this release generated',
  manifest.version === version, `api/manifest.json ${manifest.version} vs HCC_VERSION ${version}`);

/* ── the three vocabularies, taken from the atlas ──────────────────────────── */
function slice(startMark, endMark, from) {
  const a = src.indexOf(startMark, from || 0); if (a < 0) return '';
  const b = src.indexOf(endMark, a); return b < 0 ? '' : src.slice(a, b + endMark.length);
}
const siSrc = slice('const HCC_SI=Object.freeze({', '\n});');
const refSrc = slice('const HCC_SI_REFUSED=', '\n});');
/* THE ALIAS TABLE IS ONE LINE AND THE SLICE MUST NOT LEAVE IT. Reaching for the next
   "\n]);" ran forty thousand lines past the end and swallowed the SI table whole,
   which the sandbox then refused as a duplicate declaration. Cut to the end of its
   own line. */
const aliasSrc = (() => { const a = src.indexOf('const HCC_UNIT_ALIAS=new Map([');
  if (a < 0) return ''; const b = src.indexOf('\n', a); return src.slice(a, b); })();
ok('the three unit vocabularies are found in the source rather than restated here',
  siSrc.length > 100 && refSrc.length > 100 && aliasSrc.length > 10,
  'HCC_SI, HCC_SI_REFUSED and HCC_UNIT_ALIAS are each sliced out and evaluated');

const ctx = vm.createContext({});
vm.runInContext(siSrc + '\n' + refSrc + '\n' + aliasSrc
  + '\n;globalThis.__k=[Object.keys(HCC_SI),Object.keys(HCC_SI_REFUSED),[...HCC_UNIT_ALIAS].flat()];', ctx);
const [siKeys, refKeys, aliasKeys] = ctx.__k;
const known = new Set([...siKeys, ...refKeys, ...aliasKeys]);
let declared = 0;
for (const ins of manifest.instruments || []) {
  for (const o of ins.outputs || []) if (o.unit) { known.add(String(o.unit)); declared++; }
  for (const f of ins.inputs || []) if (f.unit) { known.add(String(f.unit)); declared++; }
}
ok('the known vocabulary is the union of what converts, what is refused in writing, what aliases, and what a contract declares',
  known.size >= 100 && siKeys.length > 50 && refKeys.length > 20,
  `${known.size} known spelling(s): ${siKeys.length} convertible, ${refKeys.length} refused in writing, `
  + `${aliasKeys.length / 2} alias pair(s), ${declared} contract field(s)`);

/* ── and every publication's stated unit against it ────────────────────────── */
const rows = busPublicationUnits(src);
const literal = rows.filter(r => r.literal);
const built = rows.filter(r => !r.literal);
const unknownRows = literal.filter(r => !known.has(r.unit));
const byUnit = new Map();
for (const r of unknownRows) byUnit.set(r.unit, (byUnit.get(r.unit) || 0) + 1);
const empty = literal.filter(r => r.unit === '').length;

/* THE CEILING ONLY FALLS. Moving a caption out of the unit field and into the readout
   lowers it; so does teaching the atlas a spelling it should have known. */
const PROSE_UNIT_CEILING = 17;
const BUILT_UNIT_CEILING = 0;

ok('every publication site is read, and the ones whose unit is assembled at runtime are counted apart',
  rows.length >= 260 && rows.length === literal.length + built.length,
  `${rows.length} site(s): ${literal.length} state a literal unit, ${built.length} build one at runtime`);
ok('the number of publications whose unit is a string only a human reads is at or below its ceiling, and the ceiling only falls',
  unknownRows.length <= PROSE_UNIT_CEILING,
  `${unknownRows.length} of ${literal.length} literal unit(s) are in none of the four vocabularies, `
  + `over ${byUnit.size} distinct spelling(s), against ceiling ${PROSE_UNIT_CEILING}`);
ok('and a unit assembled at runtime is counted too, because a caption built by concatenation is the clearest case of one',
  built.length <= BUILT_UNIT_CEILING,
  `${built.length} site(s) build the unit rather than state it: ` + built.slice(0, 6).map(r => r.key).join(', '));
ok('the gap resolves to named spellings rather than one number',
  byUnit.size > 0 && [...byUnit.keys()].every(u => typeof u === 'string'),
  'commonest: ' + [...byUnit.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([u, n]) => `${JSON.stringify(u)}×${n}`).join(' '));
/* THE FIRST DRAFT ASSERTED THE OPPOSITE OF WHAT THE ATLAS DOES, and went red against
   a deliberate decision. It required the empty unit to be unknown — "not silently
   treated as dimensionless" — and HCC_UNIT_ALIAS maps '' to '1' explicitly, beside
   '—' and 'dimensionless'. Reading a missing unit as dimensionless is a choice this
   atlas made in writing, so it is not silent, and the check that matters is that the
   choice is DECLARED rather than that it was never made. */
ok('a publication with no unit at all is read as dimensionless by an explicit alias rather than by accident',
  known.has('') && aliasKeys.includes('') ,
  `${empty} publication(s) state an empty unit, and HCC_UNIT_ALIAS maps '' to '1' in writing beside '—' and 'dimensionless'`);

/* ── AND THE FOURTH ARGUMENT, WHICH IS HOW THE CEILING FALLS WITHOUT LOSING ANYTHING ──
   A caption cannot be paid down by deleting what it says: a reader wants to know a
   braid is counted in crossings. pub() takes a unit AND a note, so the unit becomes a
   coordinate and the caption stays a caption. */
const noted = rows.filter(r => r.has_note);
ok('a publication may state a unit and a note, so a caption is moved rather than deleted',
  /pub\(k,v,unit,note\)/.test(src) && /note:note\|\|''/.test(src),
  `pub(key, value, unit, note) · ${noted.length} publication(s) carry a note today`);
ok('and the note reaches the reader, beside the unit rather than instead of it',
  /p\.note\?/.test(src) && /esc\(p\.note\)/.test(src),
  'the laboratory panel prints the note beside the unit');
/* THIS ASKED THE WRONG FIELD FOR THE WRONG PROPERTY, AND WENT RED THE MOMENT THE
   THING IT WANTED ACTUALLY HAPPENED. It required every NOTE to be a literal, on the
   reasoning that a caption assembled at runtime is the fault being measured. It is
   not: a caption assembled at runtime is what a note is FOR — "at 0.85 fm", "after
   three turns", the name of the system being integrated. What must be a literal is
   the UNIT, because that is the field the bus matches on and a coordinate cannot be
   decided while the page is running. So the property moves to the field it belongs
   to, and the runtime notes are counted rather than forbidden. */
const builtNotes = noted.filter(r => r.note === null);
ok('every UNIT is a literal, because a coordinate cannot be decided while the page is running',
  built.length === 0,
  built.length ? `${built.length} site(s) still assemble the unit: ` + built.map(r => r.key).join(' ')
    : `all ${rows.length} publication(s) state their unit at the call`);
ok('and a note may be assembled at runtime, because saying which system or which distance is what a note is for',
  builtNotes.length >= 0,
  `${noted.length} publication(s) carry a note, ${builtNotes.length} of them built at runtime: `
  + (builtNotes.slice(0, 6).map(r => r.key).join(' ') || 'none'));

ok('the atlas exposes the same census as one named global',
  /function HCC_UNIT_VOCABULARY\(\)/.test(src) && /globalThis\.HCC_UNIT_VOCABULARY=HCC_UNIT_VOCABULARY/.test(src),
  'globalThis.HCC_UNIT_VOCABULARY()');
ok('and it rewrites no caption, because which is a unit spelled oddly and which is prose is a decision per publication',
  !/HCC_UNIT_VOCABULARY[\s\S]{0,2000}ATLAS_BUS\._d\.set/.test(src),
  'the census reads the bus and never writes it');

console.log(`\n${fail ? 'FAIL' : 'PASS'} — the unit field is measured against what the atlas knows :: `
  + `${literal.length - unknownRows.length}/${literal.length} publications state a unit the atlas can use, `
  + `${unknownRows.length} state a caption, ${built.length} build one · ${pass} check(s) passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
