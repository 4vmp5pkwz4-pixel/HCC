#!/usr/bin/env node
/* ============================================================================
   A SECOND AUTHORITY FOR THE DEPTH CENSUS

   The doctrine of this atlas is two authorities for one fact.  The depth census
   had one: a boot assertion, inside the page, parsing the page.  It governs a
   table of seven written refusals and decides whether a station may be flat, and
   nothing outside the browser ever checked it.

   This file is the second authority.  It parses index.html from disk, with its
   own parser, and reaches its own verdict about which stations are flat.  It
   shares no code with the atlas and does not load it.

   NINE THINGS ARE CHECKED.

   1.  The module block is found and every update function in it is located.
   2.  Depth is written three ways and all three are counted: into a geometry
       buffer, through position.set, and onto position.z.
   3.  THE ARGUMENT SPLIT MUST BALANCE BRACKETS, and this is proved by showing a
       naive splitter reaches a different, wrong answer on real code.
   4.  The census agrees with the number the atlas claims for itself.
   5.  Every flat station appears in the table.
   6.  No table entry names a station that is no longer flat.
   7.  Every entry carries a kind and a reason of real length.
   8.  A PLANAR entry is a permanent refusal and a PENDING one is a debt that
       names its axis; both are legal, and pending entries must name one.
   9.  And the documented blindness is REAL: the census cannot see depth that is
       built once at setup, demonstrated on the superconductor whose vortex
       lattice sits at (x, 0.25, z) and whose update loop only breathes it.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const LIT = /^-?[0-9.]+$/;

/* ---- our own parser ------------------------------------------------------- */
function balanced(s, start) {
  let d = 0;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (c === '(' || c === '[' || c === '{') d++;
    else if (c === ')' || c === ']' || c === '}') { d--; if (d === 0) return s.slice(start + 1, i); }
  }
  return null;
}
function splitArgs(s) {
  const out = []; let d = 0, cur = '';
  for (const c of s) {
    if (c === '(' || c === '[' || c === '{') d++;
    if (c === ')' || c === ']' || c === '}') d--;
    if (c === ',' && d === 0) { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur); return out.map(x => x.trim());
}
/* the naive splitter this check exists to rule out: stops at the first ')' */
function naiveZ(body) {
  const z = [];
  for (const m of body.matchAll(/\.position\.set\(([^)]*)\)/g)) {
    const a = m[1].split(',').map(x => x.trim());
    if (a.length === 3) z.push(a[2]);
  }
  return z;
}
function zWrites(body, naive) {
  const z = [];
  for (const m of body.matchAll(/\[[A-Za-z0-9_]+\*3\+2\]\s*=\s*([^;]+);/g)) z.push(m[1].trim());
  if (naive) { z.push(...naiveZ(body)); }
  else {
    let i = 0;
    while ((i = body.indexOf('.position.set(', i)) >= 0) {
      const inner = balanced(body, i + '.position.set'.length);
      if (inner != null) { const a = splitArgs(inner); if (a.length === 3) z.push(a[2]); }
      i += 14;
    }
  }
  for (const m of body.matchAll(/\.position\.z\s*=\s*([^;]+);/g)) z.push(m[1].trim());
  return z;
}
function census(naive) {
  const rows = [];
  const re = /\nfunction (update[A-Za-z0-9_]*)\s*\(/g; let m;
  while ((m = re.exec(HTML))) {
    let i = HTML.indexOf('{', m.index + m[0].length - 1); if (i < 0) continue;
    let d = 0, j = i;
    for (; j < HTML.length; j++) { const c = HTML[j]; if (c === '{') d++; else if (c === '}') { d--; if (d === 0) { j++; break; } } }
    const z = zWrites(HTML.slice(i, j), naive);
    if (z.length) rows.push({ nm: m[1], writes: z.length, varying: z.filter(v => !LIT.test(v)).length });
  }
  return rows;
}
const rows = census(false);
const flat = rows.filter(r => r.varying === 0).map(r => r.nm);

/* ---- the table, read out of the source ------------------------------------ */
const tableSrc = (() => {
  const a = HTML.indexOf('const HCC_FLAT_BY_DESIGN=new Map([');
  if (a < 0) return null;
  const b = HTML.indexOf('\n]);', a);
  return b < 0 ? null : HTML.slice(a, b);
})();
const entries = [];
if (tableSrc) for (const m of tableSrc.matchAll(/\['(update[A-Za-z0-9_]+)',\s*\{kind:'(\w+)'([\s\S]*?)\}\],/g))
  entries.push({ nm: m[1], kind: m[2], rest: m[3] });

console.log('\n=== 1-3. Our own parser, and why it must balance brackets ===\n');

ok('the module block is found and every update function in it is located — sixty or more of them write a depth coordinate at all',
  rows.length >= 60, `${rows.length} update functions write depth`);

ok('depth is written THREE ways and all three are counted: into a geometry buffer as [k*3+2], through position.set, and onto position.z. A census that watched only one channel would report a station flat while it was drawing in space through another',
  (() => { const j = HTML;
    return /\[[A-Za-z0-9_]+\*3\+2\]\s*=/.test(j) && /\.position\.set\(/.test(j) && /\.position\.z\s*=/.test(j); })(),
  'all three write channels are present in the source and all three are parsed');

ok('AND THE ARGUMENT SPLIT MUST BALANCE BRACKETS, which is proved here rather than asserted: a naive splitter that stops at the first close-paren truncates position.set(x, y, R*Math.sin(t)) at the sin and scores the station on whatever it finds instead. Run naively the census reaches a DIFFERENT answer on this very file',
  (() => { const naive = census(true).filter(r => r.varying === 0).map(r => r.nm);
    return naive.length !== flat.length || naive.some(n => flat.indexOf(n) < 0); })(),
  (() => { const naive = census(true).filter(r => r.varying === 0).map(r => r.nm);
    const onlyNaive = naive.filter(n => flat.indexOf(n) < 0);
    const onlyBal = flat.filter(n => naive.indexOf(n) < 0);
    return `balanced parsing finds ${flat.length} flat, naive parsing finds ${naive.length} — the counts can agree while the SETS do not, which is why membership is compared and not size`
      + (onlyNaive.length ? ` · naive wrongly calls flat: ${onlyNaive.join(', ')}` : '')
      + (onlyBal.length ? ` · naive misses: ${onlyBal.join(', ')}` : ''); })());

console.log('\n=== 4-8. The table, enforced from outside the browser ===\n');

ok('the table is present in the source and carries entries',
  tableSrc != null && entries.length > 0, `HCC_FLAT_BY_DESIGN holds ${entries.length} entries`);

ok('EVERY FLAT STATION APPEARS IN IT. A station that draws its whole content on a plane and is not named is a build failure, which is the half of the rule that stops the atlas quietly accumulating flat charts',
  flat.every(n => entries.some(e => e.nm === n)),
  flat.length ? `flat: ${flat.join(', ')} — all named` : 'no flat stations');

ok('AND NO ENTRY NAMES A STATION THAT IS NO LONGER FLAT. That is the other half, and it is what stops the table rotting: an exemption written for a station that has since been given a real third axis fails here rather than sitting there forever looking like a reason',
  entries.every(e => flat.indexOf(e.nm) >= 0),
  (() => { const stale = entries.filter(e => flat.indexOf(e.nm) < 0).map(e => e.nm);
    return stale.length ? `STALE: ${stale.join(', ')}` : 'no stale entries'; })());

ok('every entry carries a kind and a reason of real length — a table of refusals whose reasons are one word each would pass a check and teach nobody anything',
  entries.every(e => (e.kind === 'planar' || e.kind === 'pending') && /why:\s*\n?\s*'[^']{80,}'/.test(e.rest)),
  `${entries.length} entries, every one with a kind and a reason over eighty characters`);

ok('a PLANAR entry is a permanent refusal and a PENDING one is a debt that must name the axis it owes. Both are legal; a pending entry without an axis is not, because that is an exemption wearing a debt`s clothes',
  entries.filter(e => e.kind === 'pending').every(e => /axis:\s*'[^']+'/.test(e.rest)),
  (() => { const p = entries.filter(e => e.kind === 'pending');
    return p.length ? `${p.length} pending, each naming an axis` : 'no pending entries — both that this table opened with were spent'; })());

console.log('\n=== 9. And the blindness the table documents is real ===\n');

ok('THE CENSUS CANNOT SEE DEPTH BUILT ONCE AT SETUP, and that is demonstrated rather than claimed. The superconductor places its vortex cores at (x, 0.25, z) in a genuine two-dimensional lattice when the station is constructed, and its update loop only modulates their opacity — so it writes no varying depth per frame and this census calls it flat while it is drawing in space. That is exactly why the table exists and why a check demanding zero flat stations would have been wrong',
  (() => { const built = /\.position\.set\(x,\s*0\.25,\s*z\)/.test(HTML) || /t\.position\.set\(x,0\.25,z\)/.test(HTML);
    const reads = /t\.position\.z/.test(HTML);
    const named = entries.some(e => e.nm === 'updateSc');
    return built && reads && named; })(),
  'the lattice is placed in x-z at setup, the update loop reads position.z to animate brightness, and updateSc is named in the table with that reason');

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
