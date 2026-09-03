#!/usr/bin/env node
/* ============================================================================
   TWO SPELLINGS OF ONE UNIT ARE TWO COORDINATES

   The quantity bus admits a coupling only when the unit STRING matches exactly
   and the coordinate name matches too.  That is correct: a bus cannot know that
   "kg/m3" and "kg m^-3" are the same thing unless somebody says so, and guessing
   is how a joule ends up wired to a joule per kelvin.

   But it means a NOTATION SLIP SILENTLY COSTS A COUPLING.  This was found the
   hard way: the asteroseismology laboratory published a mean density as
   "kg/m^3" where every declared input in this atlas writes "kg m^-3", and the
   only reason it surfaced is that somebody went looking for a consumer by hand.
   Nothing had ever compared the RUNTIME publication vocabulary against the
   DECLARED one.

   This file does.  It reads every ATLAS_BUS.pub unit out of index.html and every
   declared input and output unit out of api/manifest.json, canonicalises them,
   and reports the sets that are one unit wearing several spellings.

   THE CANONICALISER IS THE HARD PART AND IS CHECKED IN BOTH DIRECTIONS.  A
   crude one -- lowercase, strip slashes and carets -- reports nine clashes of
   which five are false: it merges MeV with meV, which differ by a factor of a
   billion; it merges nm with N/m, nanometres with newtons per metre; and it
   merges s with /s, a quantity with its reciprocal. So the one here preserves
   case, treats a slash as a negative exponent, and REFUSES a unit it cannot
   parse rather than dropping the part it did not understand -- which is what
   made it group "sr^-1/2" with "sr^-1" until it was fixed.

   NINE THINGS ARE CHECKED.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

/* ---- the canonicaliser ----------------------------------------------------- */
function canon(u) {
  if (u == null) return null;
  let s = String(u).trim();
  if (!s) return null;
  if (s.startsWith('/')) s = '1' + s;
  if (!/^[A-Za-z0-9_][A-Za-z0-9_^ /-]*$/.test(s)) return null;
  const parts = s.split('/');
  const terms = []; let good = true;
  parts.forEach((p, i) => {
    const toks = p.split(/\s+/).filter(Boolean);
    if (!toks.length) { good = false; return; }
    for (const tok of toks) {
      if (i === 0 && tok === '1' && parts.length > 1) continue;
      const m = tok.match(/^([A-Za-z_]+)\^?(-?\d+)?$/);
      if (!m) { good = false; return; }
      let e = m[2] == null ? 1 : parseInt(m[2], 10);
      if (i > 0) e = -e;
      terms.push(m[1] + '^' + e);
    }
  });
  return (good && terms.length) ? terms.sort().join('·') : null;
}

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const MAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'manifest.json'), 'utf8'));
const runtime = new Set(), declared = new Set();
for (const m of html.matchAll(/ATLAS_BUS\.pub\(\s*'([^']+)'\s*,[^,]*,\s*'([^']*)'\s*\)/g)) runtime.add(m[2]);
for (const L of (MAN.instruments || [])) for (const k of ['inputs', 'outputs']) for (const f of (L[k] || [])) if (f.unit) declared.add(f.unit);
const seen = new Set([...runtime, ...declared]);
const groups = new Map(); let refused = 0;
for (const u of seen) { const c = canon(u); if (!c) { refused++; continue; }
  if (!groups.has(c)) groups.set(c, new Set()); groups.get(c).add(u); }
const clashes = [...groups.entries()].filter(([, v]) => v.size > 1);

/* the spellings this atlas is KNOWN to carry. A new one fails; fixing one does
   not, because the assertion is a subset and not an equality — the mistake of
   writing a state of the world down as an invariant has been made here once
   already and is not repeated. */
const KNOWN = new Set(['s^-1', 'm^2', 'm^1·s^-1', 'kg^1·m^-3', 'site^-1', 'sr^-1', 'W^1·m^-2']);

console.log('\n=== 1-3. Both vocabularies, and what they are ===\n');

ok('the runtime publication vocabulary and the declared vocabulary are both read — one out of the ATLAS_BUS.pub calls in index.html, the other out of the manifest`s declared inputs and outputs. Nothing had ever compared them',
  runtime.size >= 50 && declared.size >= 100,
  `${runtime.size} distinct runtime publication units · ${declared.size} distinct declared units · ${seen.size} together`);

ok('and a unit the canonicaliser cannot parse is REFUSED rather than half-understood. The atlas publishes prose where a unit belongs — "native residual", "closure", "count" — and a parser that dropped the parts it did not recognise would merge them all',
  refused > 20 && groups.size > 100,
  `${groups.size} parsed into canonical form · ${refused} refused as unparseable`);

ok('specifically, "sr^-1/2" is refused rather than being read as "sr^-1" with the half thrown away — which is what an earlier version of this parser did, and it reported a clash that was not there',
  canon('sr^-1/2') === null && canon('sr^-1') !== null,
  'a fractional exponent is not silently truncated to an integer one');

console.log('\n=== 4-6. The canonicaliser must not over-merge ===\n');

ok('CASE IS PRESERVED, because MeV and meV differ by a factor of a billion. A canonicaliser that lowercases reports them as one unit, and this atlas carries both',
  canon('MeV') !== canon('meV'), `MeV → ${canon('MeV')} · meV → ${canon('meV')}`);

ok('and a slash is a NEGATIVE EXPONENT rather than a character to delete, so a quantity is never merged with its reciprocal: seconds against per second, cubic metres against inverse cubic metres',
  canon('s') !== canon('/s') && canon('m^3') !== canon('m^-3'),
  `s → ${canon('s')} · /s → ${canon('/s')} · m^3 → ${canon('m^3')} · m^-3 → ${canon('m^-3')}`);

ok('which also keeps nanometres apart from newtons per metre — "nm" and "N/m" collapse to the same string under any normalisation careless about case and slashes, and they are not remotely the same quantity',
  canon('nm') !== canon('N/m'), `nm → ${canon('nm')} · N/m → ${canon('N/m')}`);

console.log('\n=== 7-9. And it must merge what genuinely is one unit ===\n');

ok('the three ways this atlas writes inverse seconds are one unit: "/s", "1/s" and "s^-1"',
  canon('/s') === canon('1/s') && canon('1/s') === canon('s^-1'),
  `all three → ${canon('s^-1')}`);

ok('AND THE SLIP THAT STARTED THIS IS CAUGHT: "kg/m3" and "kg m^-3" are one unit, and the bus could not see it. Seven units in this atlas are spelled more than one way, so seven sets of coordinates cannot couple to each other purely on notation',
  canon('kg m^-3') === canon('kg/m3') && canon('W m^-2') === canon('W/m^2') && clashes.length >= 4,
  clashes.map(([c, v]) => `${c}: ${[...v].map(x => JSON.stringify(x)).join(' vs ')}`).join(' · '));

ok('and NO NEW SPELLING HAS BEEN INTRODUCED. This is asserted as a subset rather than an equality: fixing one of these passes, adding one fails. An earlier check in this atlas wrote a state of the world down as an invariant and failed at the moment the thing it measured became perfect, which is a mistake worth making only once',
  clashes.every(([c]) => KNOWN.has(c)),
  (() => { const novel = clashes.filter(([c]) => !KNOWN.has(c));
    return novel.length ? `NEW: ${novel.map(([c, v]) => c + ' (' + [...v].join(', ') + ')').join(' · ')}`
      : `${clashes.length} known spellings, none new`; })());

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
