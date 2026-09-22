#!/usr/bin/env node
'use strict';
/* ══ EVERYTHING SAYS WHAT IT IS ══════════════════════════════════════════════
 *
 * The atlas describes almost everything it contains, and the exceptions were not
 * a policy — they were the places nobody had counted. Counted, against
 * api/manifest.json, which is the contract an agent actually reads:
 *
 *     laboratories   119 / 119 described
 *     worlds           0 / 7   described, and 0 / 7 carrying a route
 *     inputs         572 / 572 documented
 *     outputs       1379 / 1493 documented   — 114 bare, across nine instruments
 *
 * The seven worlds are the FIRST choice a reader or an agent makes and the only
 * level above the laboratories, and they were the one level of the atlas with
 * nothing written on them. The manifest builder had been reading w.route and a
 * description from a registry that declared neither, so every world shipped with
 * route: undefined — dropped by JSON, so it did not even show up as a null.
 *
 * Three of the bare outputs were worse than bare: bloch_y, bloch_z, sphere_y,
 * sphere_z and S_imag carried doc:['','',<german>], so the field was present, the
 * shape was right, and a reader in English or Russian was told nothing. A doc that
 * is an empty string is not a doc; it is a doc-shaped hole that no census can see.
 *
 * This file is what stops the count going back down.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'manifest.json'), 'utf8'));
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const text = v => Array.isArray(v) ? (v[0] || '') : (v == null ? '' : String(v));
const said = v => text(v).trim().length >= 12;   /* a word is not a description */

{ /* 1. THE SEVEN DOORS */
  const worlds = manifest.worlds || [];
  const bare = worlds.filter(w => !said(w.description));
  ok('every world in the manifest says what it is, in a sentence rather than a label — this level had 0 of 7 while the 119 laboratories below it had all of theirs',
    worlds.length >= 7 && bare.length === 0,
    `${worlds.length - bare.length}/${worlds.length} described` + (bare.length ? ' · bare: ' + bare.map(w => w.id).join(', ') : ''));
  const noRoute = worlds.filter(w => !/^#\/world\/[a-z0-9]+$/i.test(String(w.route || '')));
  ok('and every world carries the route it is reached by, which the manifest builder had been reading from a registry that never declared it',
    noRoute.length === 0,
    noRoute.length ? noRoute.map(w => w.id + '=' + w.route).join(', ') : worlds.map(w => w.route).join(' '));
  const i18n = worlds.filter(w => w.description_i18n && ['en','ru','de'].every(k => said(w.description_i18n[k])));
  ok('and it says it in all three languages the atlas is written in, because a reader who is handed an empty string has been told less than one who is handed nothing',
    i18n.length === worlds.length, `${i18n.length}/${worlds.length} trilingual`);
}

{ /* 2. THE LABORATORIES, WHICH WERE ALREADY RIGHT AND MUST STAY SO */
  const labs = manifest.labs || [];
  const bare = labs.filter(l => !said(l.description));
  ok('every laboratory still says what it is',
    labs.length >= 119 && bare.length === 0,
    `${labs.length - bare.length}/${labs.length}` + (bare.length ? ' · bare: ' + bare.slice(0, 8).map(l => l.id).join(', ') : ''));
}

{ /* 3. EVERY TYPED PORT OF EVERY INSTRUMENT */
  const ins = [], outs = [];
  for (const it of manifest.instruments || []) {
    for (const i of it.inputs || []) if (!said(i.doc)) ins.push(it.id + '.' + i.name);
    for (const o of it.outputs || []) if (!said(o.doc)) outs.push(it.id + '.' + o.name);
  }
  const nIn = (manifest.instruments || []).reduce((s, i) => s + (i.inputs || []).length, 0);
  const nOut = (manifest.instruments || []).reduce((s, i) => s + (i.outputs || []).length, 0);
  ok('every declared INPUT of every instrument says what it does to the answer',
    nIn > 500 && ins.length === 0, `${nIn - ins.length}/${nIn}` + (ins.length ? ' · bare: ' + ins.slice(0, 10).join(', ') : ''));
  ok('and every declared OUTPUT says what it is — 114 of them did not, and an output without a doc is a number an agent can read and cannot use',
    nOut > 1400 && outs.length === 0, `${nOut - outs.length}/${nOut}` + (outs.length ? ' · bare: ' + outs.slice(0, 10).join(', ') : ''));
}

{ /* 4. AND NO DOC IS A DOC-SHAPED HOLE */
  const holes = [...src.matchAll(/doc:\[\s*''\s*,/g)].length
              + [...src.matchAll(/doc:\[\s*'\s*'\s*,/g)].length
              + [...src.matchAll(/,\s*''\s*\]\s*\}/g)].length;
  ok('and no declared doc is an empty or whitespace string in any language — the field was present and the sentence was not, which is the one failure a census cannot see',
    [...src.matchAll(/doc:\[[^\]]*?(?:''|'\s+')[^\]]*?\]/g)].length === 0,
    holes ? holes + ' empty slots remain' : 'every doc array carries three sentences');
}

{ /* 5. THE DECLARATION IS IN ONE PLACE AND THE INTERFACE READS IT */
  ok('the world line is declared once, in WORLD_REGISTRY, and resolved for the reader by one function — not copied into the switcher and the sheet and the manifest',
    /const worldDescL=id=>\{ const w=WORLD_BY_ID\.get\(id\); return \(w&&Array\.isArray\(w\.d\)\)\?hccL\(w\.d\):''; \};/.test(src)
    && /function worldTitlesApply\(\)\{/.test(src)
    && /description: Array\.isArray\(w\.d\)/.test(fs.readFileSync(path.join(ROOT, 'scripts', 'build-manifest.mjs'), 'utf8')),
    'one declaration, three readers');
  ok('and the switcher and the Atlas sheet are actually given it on the geometry tick, rather than at some call site that may not run',
    /try\{ worldTitlesApply\(\); \}catch\(e\)\{\}/.test(src)
    && /data-world="\$\{w\.id\}" title="\$\{esc\(worldDescL\(w\.id\)\)\}"/.test(src),
    'the tick is the one thing that always runs');
}

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
