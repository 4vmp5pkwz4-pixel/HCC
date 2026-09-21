#!/usr/bin/env node
'use strict';
/* ══ EVERY FORMULA HAS AN ADDRESS ════════════════════════════════════════════
 *
 * FORMULA_REGISTRY has named every load-bearing formula in this atlas since the
 * first release, and nothing said WHERE any of them runs. The only index that
 * existed ran the other way — predictionFormulaIds(lab) collects the ids whose
 * prefix matches a laboratory — and it is an S3-LABORATORY index, so it cannot
 * reach a formula that belongs to a world instead of a laboratory.
 *
 * That was not a hypothetical gap. Running that index over all 88 laboratories
 * before this file existed:
 *
 *     108 formulas declared · 82 claimed by some laboratory · 26 claimed by NOBODY
 *     68 of the 88 laboratories claimed no formula at all
 *
 * and every one of the 26 belongs to the phi-ladder, the zero-point shell, the
 * solar ephemeris or the cycles world. A catalogue that cannot be walked from
 * where the reader is standing is a catalogue nobody reads.
 *
 * FORMULA_SITES is that address book, and this file holds it to three things a
 * table of strings would otherwise be free to break:
 *
 *   · it must cover the registry EXACTLY — no formula without an address, no
 *     address for a formula that does not exist;
 *   · every address must resolve to a real world and a real laboratory, or the
 *     route the panel offers is a dead link;
 *   · and every evidence token must actually occur in this source outside the
 *     registry. That is the clause with teeth: an address can be plausible and
 *     wrong, and the only way to tell is to require the thing that computes the
 *     number to exist under the name the table claims for it.
 *
 * The seven formulas the atlas QUOTES rather than computes are pinned BY NAME,
 * not by count — this atlas has already paid once for a check that asserted the
 * size of a set, went green through a rename, and proved nothing.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

/* balanced slice, so a bracket inside a string cannot truncate the block the way
 * a naive indexOf(');') truncated the registry push and hid two formulas */
function balanced(from, open, close) {
  const i = src.indexOf(from);
  if (i < 0) throw new Error('marker not found: ' + from.slice(0, 40));
  const k = src.indexOf(open, i);
  let d = 0, q = null;
  for (let n = k; n < src.length; n++) {
    const c = src[n];
    if (q) { if (c === '\\') { n++; continue; } if (c === q) q = null; continue; }
    if (c === "'" || c === '"') { q = c; continue; }
    if (c === open) d++;
    else if (c === close) { d--; if (!d) return src.slice(k, n + 1); }
  }
  throw new Error('unbalanced block from ' + from.slice(0, 40));
}

const registry = balanced('const FORMULA_REGISTRY = [', '[', ']')
  + balanced('FORMULA_REGISTRY.push(', '(', ')');
const sitesBlock = balanced('const FORMULA_SITES=Object.freeze({', '{', '}');
const quotedBlock = balanced('const FORMULA_STATED_ONLY=Object.freeze(new Map([', '[', ']');

const declared = [...registry.matchAll(/\{id:\s*'([^']+)'/g)].map(m => m[1]);
const sites = new Map();
for (const m of sitesBlock.matchAll(/'([a-z_0-9.]+)'\s*:\s*\[\s*'(\w+)'\s*,\s*(null|'\w+')\s*,\s*(null|'[^']*')\s*\]/g))
  sites.set(m[1], { world: m[2], lab: m[3] === 'null' ? null : m[3].slice(1, -1),
    ev: m[4] === 'null' ? null : m[4].slice(1, -1) });

{ /* 1. THE COVER IS EXACT IN BOTH DIRECTIONS */
  const missing = declared.filter(id => !sites.has(id));
  const extra = [...sites.keys()].filter(id => !declared.includes(id));
  ok('EVERY DECLARED FORMULA HAS AN ADDRESS, and every address belongs to a declared formula',
    declared.length > 100 && missing.length === 0 && extra.length === 0 && new Set(declared).size === declared.length,
    `${declared.length} declared, ${sites.size} addressed` +
    (missing.length ? ' · WITHOUT AN ADDRESS: ' + missing.join(', ') : '') +
    (extra.length ? ' · ADDRESS WITHOUT A FORMULA: ' + extra.join(', ') : ''));
}

{ /* 2. THE ADDRESSES ARE REAL PLACES */
  const worlds = new Set([...balanced('const WORLD_REGISTRY=[', '[', ']')
    .matchAll(/\{id:\s*'(\w+)'/g)].map(m => m[1]));
  const labs = new Set([...balanced('const S3_VIEW_NAMES', '{', '}')
    .matchAll(/(?:^|[{,\s])([A-Za-z_]\w*)\s*:\s*'/g)].map(m => m[1]));
  /* AND THE HALF OF THE REGISTRY THAT IS NOT A LITERAL. S3_VIEW_NAMES ends in a
     spread of labDeclNames(...), so every laboratory declared through
     LAB_DECLARATIONS was invisible to this check — which nothing noticed while no
     formula addressed one. The page builds its registry from both; so does this. */
  const declared = [...balanced('const LAB_DECLARATIONS=Object.freeze([', '[', ']')
    .matchAll(/\{\s*id:\s*'([A-Za-z_]\w*)'/g)].map(m => m[1]);
  if (declared.length < 20) throw new Error('the declared-laboratory sweep found only ' + declared.length
    + ' ids, which is fewer than this atlas has had for many releases — the pattern has stopped matching');
  for (const id of declared) labs.add(id);
  labs.add('chronometry');                       /* the one laboratory outside S³ */
  const badWorld = [...sites].filter(([, s]) => !worlds.has(s.world)).map(([id, s]) => id + '→' + s.world);
  const badLab = [...sites].filter(([, s]) => s.lab && !labs.has(s.lab)).map(([id, s]) => id + '→' + s.lab);
  ok('and every address resolves — the world is in WORLD_REGISTRY and the laboratory is in the laboratory registry, so the route the panel offers can be taken',
    badWorld.length === 0 && badLab.length === 0 && worlds.size === 7,
    badWorld.concat(badLab).join(' · ') ||
    `${sites.size} addresses into ${worlds.size} worlds and ${new Set([...sites.values()].map(s => s.lab).filter(Boolean)).size} laboratories`);
}

{ /* 3. THE EVIDENCE EXISTS — the clause with teeth */
  const rest = src.replace(registry, '').replace(sitesBlock, '');
  const absent = [...sites].filter(([, s]) => s.ev && !rest.includes(s.ev)).map(([id, s]) => id + '→' + s.ev);
  const withEv = [...sites.values()].filter(s => s.ev).length;
  ok('and every formula that claims to be COMPUTED here names the function, constant or readout that computes it, and that name occurs in this source outside the registry',
    absent.length === 0 && withEv > 95,
    absent.length ? 'NOT IN THE SOURCE: ' + absent.join(' · ')
      : `${withEv} evidence tokens, every one of them present — a plausible address with no evaluator behind it fails here`);
}

{ /* 4. WHAT THE ATLAS QUOTES RATHER THAN COMPUTES, PINNED BY NAME */
  const QUOTED = ['cmb.parseval', 'gcs.hubble', 'gcs.track', 'gcs.twosector',
    'nexus.resource_allocation', 'qft.unruh', 'ring.corr'];
  const named = [...quotedBlock.matchAll(/\['([a-z_0-9.]+)'\s*,\s*'([^']{40,})'\]/g)].map(m => m[1]);
  const nulls = [...sites].filter(([, s]) => !s.ev).map(([id]) => id).sort();
  ok('and the seven formulas the atlas QUOTES rather than computes are named one by one, with the search that found no evaluator written beside each',
    named.length === QUOTED.length && QUOTED.every(k => named.includes(k))
    && nulls.length === QUOTED.length && QUOTED.every(k => nulls.includes(k)),
    `stated-only: ${nulls.join(', ')} · reasons written for ${named.length}` +
    (named.length === QUOTED.length ? ' — pinned by name, so a rename fails this rather than keeping a count green' : ''));
}

{ /* 5. AND THE LABORATORIES THAT ALREADY DECLARED FORMULA IDS MUST AGREE
       Four laboratories list registry ids in their own selection card. Two lists
       of the same fact are two authorities for it, and the way that defect is
       usually found is when they disagree. They are cross-checked here instead. */
  const disagree = [];
  let checked = 0;
  const line = src.slice(src.indexOf('formulas:cmbObservatory?'), src.indexOf('formulas:cmbObservatory?') + 900);
  const groups = [...line.matchAll(/(?:cmbObservatory|view==='(\w+)')\?\[((?:'[a-z_0-9.]+',?\s*)+)\]/g)];
  for (const g of groups) {
    const lab = g[1] || 'cmb';
    for (const m of g[2].matchAll(/'([^']+)'/g)) {
      const s = sites.get(m[1]); checked++;
      if (!s || s.lab !== lab) disagree.push(`${m[1]} is listed by ${lab} and addressed to ${s ? s.world + '/' + s.lab : 'nowhere'}`);
    }
  }
  ok('and the four laboratories that already listed registry ids in their own card agree with the address book, so the two places that name the same fact cannot drift apart unnoticed',
    checked >= 14 && disagree.length === 0,
    disagree.join(' · ') || `${checked} ids cross-checked against ${groups.length} laboratory-declared lists`);
}

{ /* 6. THE LAYER IS REACHABLE — a table nothing reads is a table nothing checks */
  ok('the address book is what the panel draws with and what the API answers from, rather than a third copy of the same facts',
    /function hccFormulaPanelHTML\(\)/.test(src)
    && /hccFormulasHere\(\)/.test(src)
    && /ctl\.insertAdjacentHTML\('beforeend', hccFormulaPanelHTML\(\)\); hccFormulaBind\(ctl\);/.test(src)
    && /formulaSite\(id\)\{ try\{ return hccFormulaSite\(id\); \}/.test(src)
    && /formulasHere\(ctx\)\{ try\{ return hccFormulasHere\(ctx\); \}/.test(src),
    'one panel section appended in every world, and four methods on HCC_API reading the same functions');
  ok('and the search re-renders its own results rather than rebuilding the panel, because a rebuild destroys the input the reader is typing into',
    /box\.innerHTML=hccFormulaResultsHTML\(\); hccFormulaBindGo\(box\);/.test(src)
    && !/oninput=[^;]*buildCtl\(\)/.test(src),
    'the results box is replaced in place; buildCtl is not called from the query field');
  ok('and travelling to a formula goes through the atlas router, so history, scope enforcement and world entry all happen as they do for every other route',
    /hccGo\(\{worldId:S\[0\], labId:S\[1\]\|\|null\}\)/.test(src),
    'hccGo, not a direct write to state.mode');
}

{ /* 7. AND THE MEASUREMENT SCAFFOLD IS NOT IN THE PRODUCT */
  ok('and the globalThis hook the drift probe left behind is gone, replaced by a real API surface — a measurement scaffold shipped inside the product is a defect even when it is harmless',
    !/globalThis\.__DRIFT/.test(src) && /drift\(all\)\{ try\{ return hccControlDrift\(all\); \}/.test(src),
    '__DRIFT removed from index.html; HCC_API.drift() answers the same question');
}

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
