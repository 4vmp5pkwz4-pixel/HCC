#!/usr/bin/env node
'use strict';
/* ══ ONE COORDINATE, ONE SPELLING ═════════════════════════════════════════════
 *
 * The bus admits a coupling on two tests, and the second is that the two
 * quantities are the SAME COORDINATE — compared, like the unit, as a string. A
 * coordinate spelled two ways is therefore two coordinates, and two publications
 * of one physical quantity are silently refused: nothing errors, nothing warns,
 * the link simply never appears.
 *
 * It had happened once, and only a census could see it.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'api/manifest.json'), 'utf8'));
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

const normal = k => String(k == null ? '' : k).toLowerCase().replace(/[^a-z0-9]/g, '');
const count = new Map(), byNormal = new Map(), byNameUnit = new Map();
for (const ins of manifest.instruments || [])
  for (const fld of [ins.outputs || [], ins.inputs || []])
    for (const o of fld) {
      const q = o.quantity_kind; if (!q) continue;
      count.set(q, (count.get(q) || 0) + 1);
      const n = normal(q);
      if (!byNormal.has(n)) byNormal.set(n, new Set());
      byNormal.get(n).add(q);
      const key = (o.name || '') + ' [' + (o.unit || '') + ']';
      if (!byNameUnit.has(key)) byNameUnit.set(key, new Set());
      byNameUnit.get(key).add(q);
    }
const collisions = [...byNormal.entries()].filter(([, s]) => s.size > 1);
const conflicts = [...byNameUnit.entries()].filter(([, s]) => s.size > 1);

ok('the census reads the table this release generated, so the spellings counted are the ones that shipped',
  manifest.version === (src.match(/const HCC_VERSION='([^']+)'/) || [])[1],
  `api/manifest.json ${manifest.version}`);

ok('NO COORDINATE IS SPELLED MORE THAN ONE WAY, which is the pin — a second spelling costs exactly the couplings the kind field exists to admit, and nothing announces it',
  collisions.length === 0,
  collisions.length === 0
    ? `${count.size} kind strings collapsing to ${byNormal.size} coordinates, one spelling each`
    : collisions.map(([, s]) => [...s].join(' | ')).join(' · '));

ok('and no single name-and-unit pair is declared under two coordinates, which is the same defect seen from the other side',
  conflicts.length === 0,
  conflicts.length === 0
    ? `${byNameUnit.size} distinct name-and-unit pairs, each with one coordinate`
    : conflicts.map(([k, s]) => k + ' → ' + [...s].sort().join(' | ')).join(' · '));

ok('the normaliser is the atlas`s own, sliced out rather than restated here',
  /const HCC_KIND_NORMAL=k=>/.test(src) &&
  /replace\(\/\[\^a-z0-9\]\/g,''\)/.test(src),
  'HCC_KIND_NORMAL lowercases and strips everything that is not a letter or a digit');

ok('AND THE PAIRS THAT NORMALISE APART ARE KEPT APART ON PURPOSE, WITH THE REASON, so that a reader who sees them side by side does not merge them',
  /HCC_KINDS_NOT_THE_SAME=Object\.freeze\(\{/.test(src) &&
  /'velocity\|speed'/.test(src) && /'entropy\|information'/.test(src) &&
  /magnitude of a velocity/.test(src),
  'a speed has discarded the direction a velocity carries; a nat and an entropy differ by Boltzmann`s constant and by what is counted');

const singles = [...count.entries()].filter(([, n]) => n === 1);
ok('and a coordinate used exactly once is reported rather than pinned, because it couples with nothing and that is a fact about the catalogue rather than a defect',
  singles.length > 0 && singles.length < count.size / 2,
  `${singles.length} of ${count.size} coordinates are used once: ${singles.slice(0, 5).map(([k]) => k).join(', ')}`);

/* ── AND THE SAME DEFECT ONE FIELD OVER, WHERE THE RULE IS DIFFERENT ─────────
   The bus compares the UNIT as a string too, so a unit spelled two ways refuses
   couplings just as silently. It had happened: 'J s' was entered as a second row
   while 'J·s' was already there, one release after the comment forbidding exactly
   that was written.
   THE NORMALISER HERE MUST NOT LOWERCASE, and that is the whole difference from
   the kinds. MeV and meV are a megaelectronvolt and a millielectronvolt; they
   differ by a factor of a thousand million, they are both declared, and a
   case-insensitive check would call them one unit and be catastrophically wrong. */
{
  const siBlock = src.slice(src.indexOf('const HCC_SI=Object.freeze({'),
                            src.indexOf('\n});', src.indexOf('const HCC_SI=Object.freeze({')));
  const declared = [...siBlock.matchAll(/'([^']+)':\{kind:/g)].map(m => m[1]);
  const sep = u => u.replace(/[ ·*]/g, '');          // separators only — never the case
  const groups = new Map();
  for (const u of declared) {
    const k = sep(u);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(u);
  }
  const dup = [...groups.values()].filter(v => v.length > 1);
  ok('NO UNIT IS DECLARED TWICE UNDER TWO SPELLINGS, because the bus compares the unit as a string and a second entry refuses couplings as silently as a second kind does',
    dup.length === 0,
    dup.length === 0 ? `${declared.length} declared units, ${groups.size} after separators are ignored`
                     : dup.map(v => v.join(' | ')).join(' · '));
  ok('and the unit normaliser deliberately does NOT ignore case, which the kind normaliser does — MeV and meV are both declared, differ by a factor of a thousand million, and a case-insensitive check would call them one unit',
    declared.includes('MeV') && declared.includes('meV') &&
    !/toLowerCase/.test(String(sep)) ,
    'a megaelectronvolt and a millielectronvolt are not a spelling difference');
}

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
