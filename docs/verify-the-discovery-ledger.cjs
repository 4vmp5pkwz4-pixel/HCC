#!/usr/bin/env node
'use strict';
/* ══ THE DISCOVERY LEDGER ═══════════════════════════════════════════════════════════════════
 * The atlas keeps a ledger of what it has found (★), confirmed from first principles (✓), corrected in itself (⚡)
 * and tested as coincidence (≈), with the open leads left for whoever continues — drawn as the Discovery Explorer
 * and served as HCC_DISCOVERIES. A ledger that can drift from what is checked is worse than none, so:
 *   1. every entry has a unique id, a valid kind and domain, a title in three languages, a claim and finite numbers
 *   2. every entry names a verifier that EXISTS and RUNS on every build (it is in the quick suite)
 *   3. every laboratory an entry lives in is a declared laboratory
 *   4. the atlas's corrections of itself are two-way: A supersedes B ⇔ B is superseded by A, and a superseded
 *      entry is marked ⚡
 *   5. every open lead continues an existing entry and states its next step
 *   6. the explorer's arcs are exactly the pairs that share a laboratory
 *   7. wiring: the laboratory is declared, routed, in the API, the passport of every laboratory shows the
 *      discoveries that live there, and HCC_DISCOVERIES answers
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..'), SRC = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), QUICK = fs.readFileSync(path.join(ROOT, 'scripts', 'run-quick-verifiers.mjs'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

(async () => {
  const K = await import(path.join(ROOT, 'core', 'atlas', 'extracted.mjs'));
  const { DISCOVERIES: D, DISCOVERY_DOMAINS: DOM, DISCOVERY_LEADS: L, discoveryGraph } = K;
  const kinds = ['found', 'confirms', 'revises', 'tested'], doms = new Set(DOM.map(d => d.id));
  { const ids = D.map(d => d.id), bad = D.filter(d => !kinds.includes(d.kind) || !doms.has(d.domain) || !d.en || !d.ru || !d.de || !(d.claim || '').length || Object.values(d.numbers || {}).some(v => !Number.isFinite(v)));
    ok('every entry has a unique id, a valid kind and domain, a title in three languages, a claim and finite numbers', new Set(ids).size === ids.length && bad.length === 0 && D.length >= 15,
      `${D.length} entries · ★ ${D.filter(d => d.kind === 'found').length} · ✓ ${D.filter(d => d.kind === 'confirms').length} · ⚡ ${D.filter(d => d.kind === 'revises').length} · ≈ ${D.filter(d => d.kind === 'tested').length}${bad.length ? ' · bad: ' + bad.map(d => d.id) : ''}`); }
  { const missing = D.filter(d => !fs.existsSync(path.join(ROOT, d.verifier)) || !QUICK.includes('"' + d.verifier + '"'));
    ok('every entry names a verifier that exists and runs on every build', missing.length === 0, missing.map(d => d.id + ':' + d.verifier).join(', ') || `${new Set(D.map(d => d.verifier)).size} distinct verifiers`); }
  { const declared = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'manifest.json'), 'utf8')).labs.map(l => l.id));
    const bad = D.flatMap(d => d.labs.filter(l => !declared.has(l)).map(l => d.id + '→' + l));
    ok('every laboratory an entry lives in is a declared laboratory', bad.length === 0 && declared.size > 100, bad.join(', ') || `${new Set(D.flatMap(d => d.labs)).size} laboratories carry discoveries`); }
  { const by = new Map(D.map(d => [d.id, d])), bad = [];
    for (const d of D) { for (const o of d.supersedes || []) { const x = by.get(o); if (!x || x.supersededBy !== d.id || x.kind !== 'revises') bad.push(d.id + '⊃' + o); } if (d.supersededBy) { const x = by.get(d.supersededBy); if (!x || !(x.supersedes || []).includes(d.id)) bad.push(d.id + '⊂' + d.supersededBy); } }
    ok('the atlas\'s corrections of itself are two-way, and what is superseded is marked ⚡', bad.length === 0 && D.some(d => d.supersedes), bad.join(', ') || D.filter(d => d.supersedes).map(d => `${d.id} supersedes ${d.supersedes.join(',')}`).join(' · ')); }
  { const bad = L.filter(l => !D.some(d => d.id === l.about) || !(l.step || '').length || !l.en);
    ok('every open lead continues an existing entry and states its next step', bad.length === 0 && L.length >= 5, bad.map(l => l.id).join(',') || `${L.length} leads`); }
  { let pairs = 0; for (let i = 0; i < D.length; i++) for (let j = i + 1; j < D.length; j++) if (D[i].labs.some(x => D[j].labs.includes(x))) pairs++;
    ok('the explorer\'s arcs are exactly the pairs that share a laboratory', discoveryGraph().length === pairs && discoveryGraph().every(e => e.via.length > 0), `${pairs} arcs`); }
  ok('wiring: the Discovery Explorer is declared, routed, in the API, shown in every laboratory\'s passport, and HCC_DISCOVERIES answers',
    /\{id:'discover', category:'inv',/.test(SRC) && /discoverGroup\.visible = \(v==='discover'\);/.test(SRC) && /state\.s3view==='discover'\)\{\n\s*fbsAnimT\+=labDt; updateDiscover\(dt\);/.test(SRC)
    && /id:'discover', world:'s3', lab:'discover',/.test(SRC) && /data-passdisc="\$\{d\.id\}"/.test(SRC) && /globalThis\.HCC_DISCOVERIES=Object\.freeze/.test(SRC));
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
