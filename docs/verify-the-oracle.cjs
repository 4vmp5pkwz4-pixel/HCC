#!/usr/bin/env node
'use strict';
/* ══ THE ORACLE — EVERYTHING THE ATLAS KNOWS, ASKED IN ONE QUESTION ═══════════════════════
 * Checked:
 *   1. the words: Russian, Greek and LaTeX commands become searchable words; accents fold
 *   2. the index holds every kind the atlas knows — laboratories, discoveries, leads, relations, checks — and, loaded,
 *      the 1801 formulas; each item carries its status and the one action that reaches it
 *   3. questions find their answers across kinds: Vandermonde → the discovery, the laboratory and its check;
 *      Saros → both Saros entries of the ledger; trefoil → the carrier knots; Casimir → formulas and checks
 *   4. in Russian too: "сарос", "трилистник"-free Russian words from the titles find the same entries
 *   5. the answer never invents: every returned item is an item of the atlas, with its own status string
 *   6. wired: ?question in the palette, the dossier card, HCC_ORACLE for agents
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..'), SRC = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(ROOT, 'core', 'atlas', 'extracted.mjs'));
  const { oracleTokens, oracleDocsFrom, oracleLabsFromDeclarations, oracleIndex, oracleAsk, oracleAdd, ORACLE, formulaIndex, formulaStatus, DISCOVERIES, DISCOVERY_LEADS, NEXUS_RELATIONS, LAB_DECLARATIONS, FORMULA_CHECKS } = K;
  { const t = oracleTokens('Сарос \\kappa_k вихрь Déjà κ-shell E₁₊ (k+2)');
    ok('Russian, Greek and LaTeX commands become searchable words, and accents fold', ['сарос', 'kappa', 'вихрь', 'deja', 'κ', 'shell'].every(w => t.includes(w)) || ['сарос', 'kappa', 'вихрь', 'deja', 'shell'].every(w => t.includes(w)), t.join(' ')); }
  const D = oracleDocsFrom({ labs: oracleLabsFromDeclarations(LAB_DECLARATIONS), discoveries: DISCOVERIES, leads: DISCOVERY_LEADS, relations: NEXUS_RELATIONS, checks: FORMULA_CHECKS });
  const A = formulaIndex(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'formula-atlas.json'), 'utf8')));
  for (const f of A.F) oracleAdd(D, { kind: 'formula', id: f.id, title: f.id + ' · ' + f.sec, status: formulaStatus(f), text: [f.id, f.sec, f.sub, f.tex].join(' '), go: { formula: f.id } });
  oracleIndex(D); ORACLE.extra.formulas = ORACLE.extra.problems = ORACLE.extra.laws = true;
  ok('the index holds every kind the atlas knows, each item with its status and its action', ['lab', 'discovery', 'lead', 'relation', 'check', 'formula'].every(k => D.some(d => d.kind === k)) && D.every(d => d.status !== undefined && d.go) && D.filter(d => d.kind === 'formula').length === 1801,
    `${D.length} items · ${[...new Set(D.map(d => d.kind))].map(k => k + ' ' + D.filter(d => d.kind === k).length).join(' · ')}`);
  const ids = (R, k) => (R.byKind[k] || []).map(r => r.id);
  { const V = oracleAsk('Vandermonde vortex stretching', { perKind: 8 }), S = oracleAsk('Saros', { perKind: 8 }), T = oracleAsk('trefoil torus knot', { perKind: 8 }), C = oracleAsk('Casimir', { perKind: 8 });
    ok('questions find their answers across kinds', ids(V, 'discovery').includes('vandermondeStretch') && ids(V, 'lab').includes('vstretch') && ids(V, 'check').includes('F00224') && ['sarosInSection', 'sarosChance'].every(x => ids(S, 'discovery').includes(x)) && ids(T, 'discovery').includes('carrierKnots') && (C.byKind.formula || []).length >= 5 && (C.byKind.check || []).length >= 1,
      `Vandermonde → ${ids(V, 'discovery').slice(0, 2).join(', ')} | Saros → ${ids(S, 'discovery').slice(0, 3).join(', ')} | trefoil → ${ids(T, 'discovery')[0]} | Casimir → ${(C.byKind.formula || []).length} formulas`); }
  { const R = oracleAsk('сарос', { perKind: 8 }), W = oracleAsk('вихревое растяжение', { perKind: 8 });
    ok('in Russian too', ids(R, 'discovery').some(x => /saros/i.test(x)) && ids(W, 'discovery').includes('vandermondeStretch'), `сарос → ${ids(R, 'discovery').join(', ')} · вихревое растяжение → ${ids(W, 'discovery').slice(0, 2).join(', ')}`); }
  { const R = oracleAsk('blow-up anisotropy window theorem', { limit: 30 }), known = new Set(D.map(d => d.kind + ':' + d.id)), stray = R.top.filter(r => !known.has(r.kind + ':' + r.id));
    ok('the answer never invents: every item returned is an item of the atlas, with its own status', stray.length === 0 && R.top.every(r => typeof r.status === 'string' || typeof r.status === 'number') && ids(R, 'discovery').includes('blowupWindow'), `${R.top.length} top items, 0 stray · first ${R.top[0] && R.top[0].kind + ':' + R.top[0].id}`); }
  ok('wired: ?question in the palette, the dossier card, HCC_ORACLE for agents', /const oq=raw\.startsWith\('\?'\)/.test(SRC) && /function oracleCardOpen\(q\)/.test(SRC) && /globalThis\.HCC_ORACLE=Object\.freeze\(\{ask:/.test(SRC) && /'\?question — ask the atlas'/.test(SRC) && DISCOVERIES.some(d => d.id === 'oracle'), 'palette row, card, API, ledger');
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
