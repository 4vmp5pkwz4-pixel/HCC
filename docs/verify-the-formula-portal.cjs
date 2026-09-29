#!/usr/bin/env node
'use strict';
/* ══ THE FORMULA PORTAL ════════════════════════════════════════════════════════════════════
 * The corpus of the S³ Navier–Stokes programme (data/formula-atlas.json) and the checks the atlas runs on it. Checked:
 *   1. the corpus is whole: 5201 displayed formulas from ten manuscripts collapse to 1801 distinct ones, every one
 *      with an id, a source, a line, a section and its LaTeX, distinct hashes, and its own source among its carriers
 *   2. the index: every formula finds its laboratory by its section, the search finds words and LaTeX, the filters work
 *   3. every live check names a formula that exists, a laboratory that exists (or none), and says what it checks
 *   4. the verdicts: thirteen hold, four fail as stated — and which ones
 *   5. KaTeX is fetched only when a formula is opened, and the LaTeX is shown as written when it cannot be
 *   6. wired: declared, routed, drawn, searchable controls, API, relations, ledger with a replaying track
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..'), SRC = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(ROOT, 'core', 'atlas', 'extracted.mjs'));
  const { FORMULA_CHECKS: FC, formulaIndex, formulaSearch, DISCOVERIES, discoveryTrack, trackRun } = K;
  const D = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'formula-atlas.json'), 'utf8'));
  { const F = D.formulas, hashes = new Set(F.map(f => f.h)), ids = new Set(F.map(f => f.id)), whole = F.every(f => f.id && typeof f.tex === 'string' && f.tex.length > 0 && Number.isInteger(f.l) && f.s >= 0 && f.s < D.sources.length && f.o.includes(f.s) && f.n === f.o.length);
    ok('the corpus is whole: 5201 displayed formulas in ten manuscripts, 1801 distinct, each with its id, source, line, section and LaTeX', D.schema === 'hcc.formula-atlas/1' && D.total_occurrences === 5201 && D.sources.length === 10 && F.length === 1801 && hashes.size === 1801 && ids.size === 1801 && whole,
      `${D.total_occurrences} → ${F.length} · ${F.filter(f => f.n > 1).length} carried by more than one manuscript`); }
  const A = formulaIndex(D);
  { const inLab = A.F.filter(f => f.lab).length, s1 = formulaSearch(A, 'Casimir', 'all', 500), s2 = formulaSearch(A, '\\boxed', 'boxed', 2000), s3 = formulaSearch(A, '', 'check', 100), s4 = formulaSearch(A, 'k(k+4)', 'all', 500);
    ok('the index links sections to laboratories, and the search finds words and LaTeX through every filter', inLab > 300 && s1.length > 5 && s2.length > 100 && s2.every(f => f.boxed) && s3.length === Object.keys(FC).length && s4.length > 5,
      `${inLab} formulas in a laboratory · 'Casimir' ${s1.length} · boxed ${s2.length} · checkable ${s3.length} · 'k(k+4)' ${s4.length}`); }
  { const labs = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'manifest.json'), 'utf8')).labs.map(l => l.id)), ids = new Set(D.formulas.map(f => f.id)), bad = Object.entries(FC).filter(([id, c]) => !ids.has(id) || (c.lab && !labs.has(c.lab)) || !Array.isArray(c.what) || c.what.length !== 3);
    ok('every live check names a formula of the corpus, a declared laboratory, and what it checks in three languages', bad.length === 0 && Object.keys(FC).length === 17, bad.map(([id]) => id).join(', ') || `${Object.keys(FC).length} checks`); }
  { const R = Object.entries(FC).map(([id, c]) => [id, c.run()]), hold = R.filter(([, r]) => r.ok).map(([id]) => id), fails = R.filter(([, r]) => !r.ok).map(([id]) => id).sort();
    ok('the verdicts on the atlas\'s kernels: thirteen hold, four fail as stated — the boxed counting law, route P₁, the commutator bound, inf Γ_N > 0', hold.length === 13 && fails.join() === ['F00007', 'F00233', 'F03574', 'F04069'].join(), `hold ${hold.length} · fail ${fails.join(', ')}`); }
  ok('KaTeX is fetched only when a formula is opened, and without it the LaTeX is shown as written',
    /function formulaKatex\(\)\{ if\(FORMULA_KATEX\) return FORMULA_KATEX;/.test(SRC) && /cdn\.jsdelivr\.net\/npm\/katex@0\.16\.11\/dist\/katex\.min\.js/.test(SRC) && /function formulaRender\(el,tex\)\{ el\.textContent=tex;/.test(SRC) && /throwOnError:false/.test(SRC), 'lazy, with a plain-text fallback');
  { const d = DISCOVERIES.find(x => x.id === 'corpusAudit'), t = trackRun(discoveryTrack('corpusAudit'));
    ok('wired: declared, routed, drawn, searchable controls, API, relations, ledger with a replaying track',
      !!d && d.verifier === 'docs/verify-the-formula-portal.cjs' && t.ok && /\{id:'formulas', category:'dyn', domain:'quantum', cluster:'dynamics'/.test(SRC) && /formulaGroup\.visible = \(v==='formulas'\);/.test(SRC)
      && /state\.s3view==='formulas'\)\{\n\s*fbsAnimT\+=labDt; updateFormula\(labDt\);/.test(SRC) && /id:'formulas', world:'s3', lab:'formulas',/.test(SRC) && /\['formulas','s3lock','representation'/.test(SRC) && /\['formulaAtlas','formulas',formulaGroup,/.test(SRC) && /id="fpQ"/.test(SRC), `track ${t.ok ? 'replays' : 'FAILS'}`); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
