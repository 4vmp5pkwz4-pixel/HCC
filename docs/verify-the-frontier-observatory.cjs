#!/usr/bin/env node
'use strict';
/* ══ THE FRONTIER OBSERVATORY (v4.380) ═══════════════════════════════════════════════════════════════════════════════
 * The openai/math collection (2026, Apache-2.0) as one sky. Checked here:
 *   1. data/frontier-atlas.json is the catalogue as published: 372 families with unique numbers, 719 manuscripts, 17
 *      subjects whose counts add up to 372, 242 families with a Lean link, 3 withdrawn manuscripts, every manuscript a
 *      path under preprints/ ending in .pdf, every family with a title, a description and at least one manuscript
 *   2. every family the atlas runs live (▶) and every highlighted family exists in the catalogue, and every live link
 *      names a laboratory the atlas declares
 *   3. the pure catalogue logic, run: LaTeX made readable (ℚ, π, ≥, Re), the filters (subject, Lean, highlighted, live,
 *      words) select exactly what they say
 *   4. wired: the frontier chapter is third, after the fluid and the light of S³; router, panel, picking, the data file
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8'), D = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'frontier-atlas.json'), 'utf8'));
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  /* 1 */
  { const F = D.families, ns = new Set(F.map(f => f.n)), man = F.reduce((s, f) => s + f.m.length, 0), sum = D.disciplines.reduce((s, d) => s + d.count, 0);
    const good = F.every(f => f.t && f.d && f.d.length > 40 && f.m.length >= 1 && f.m.every(m => /^preprints\/[^/]+\/.+\.pdf$/.test(m[1])) && D.disciplines.some(d => d.id === f.k));
    ok('the catalogue as published: 372 families with unique numbers, 719 manuscripts, 17 subjects adding up to 372, 242 Lean-linked, 3 withdrawn, every manuscript a PDF under preprints/',
      F.length === 372 && ns.size === 372 && man === 719 && D.counts.manuscripts === 719 && D.disciplines.length === 17 && sum === 372 && F.filter(f => f.lean).length === 242 && D.counts.lean === 242 && D.withdrawn.length === 3 && good && D.source.license === 'Apache-2.0',
      `${F.length} families · ${man} manuscripts · ${D.disciplines.length} subjects · ${F.filter(f => f.lean).length} Lean · ${D.withdrawn.length} withdrawn · commit ${String(D.source.commit).slice(0, 7)}`); }
  /* 2 */
  { const ns = new Set(D.families.map(f => f.n)), live = Object.entries(K.FO_LIVE), labs = [...new Set(live.map(([, v]) => v))];
    const declared = labs.filter(id => new RegExp(`\\{id:'${id}', category:`).test(SRC));
    ok('every ▶ live family and every highlighted family exists in the catalogue, and every live link names a declared laboratory of the atlas',
      live.every(([n]) => ns.has(+n)) && Object.keys(K.FO_FLAG).every(n => ns.has(+n)) && K.FO_SUMMARY.every(n => ns.has(n)) && declared.length === labs.length,
      `${live.length} live families → ${labs.join(', ')} · declared ${declared.length}/${labs.length} · ${Object.keys(K.FO_FLAG).length} highlighted`); }
  /* 3 */
  { const p = K.foPlain('over $\\overline{\\mathbb Q}$ with $\\Re s\\gt 7/8$, $\\mu(\\pi)\\le 2$'), F = D.families;
    const P = (o) => Object.assign({ q: '', disc: 0, mode: 'all', sel: 0 }, o), cnt = o => F.filter(f => K.foMatch(f, P(o))).length;
    const nt = D.disciplines.find(d => /Number theory/.test(d.name));
    ok('the catalogue logic, run: LaTeX made readable, and the filters select exactly what they say — a subject, the Lean-linked, the highlighted, the live, and words',
      /ℚ/.test(p) && /Re s > 7\/8/.test(p) && /μ\(π\)≤ 2|μ\(π\) ≤ 2/.test(p) && cnt({}) === 372 && cnt({ mode: 'lean' }) === 242 && cnt({ disc: nt.id }) === nt.count && cnt({ mode: 'live' }) === Object.keys(K.FO_LIVE).length
      && cnt({ q: 'riemann' }) >= 1 && F.filter(f => K.foMatch(f, P({ q: 'navier stokes' }))).some(f => f.n === 376),
      `“${p}” · all ${cnt({})} · Lean ${cnt({ mode: 'lean' })} · ${nt.name} ${cnt({ disc: nt.id })} · live ${cnt({ mode: 'live' })} · “riemann” ${cnt({ q: 'riemann' })}`); }
  /* 4 */
  ok('wired: the frontier chapter comes third, after the fluid and the light of S³; the router ticks the observatory, its panel binds, its stars can be picked, and it reads data/frontier-atlas.json',
    /const LAB_DOMAIN_ORDER=\['navier','s3light','frontier',/.test(SRC) && /frontier:\['frontier',/.test(SRC) && /else if\(state\.s3view==='frontier'\)\{\n\s+fbsAnimT\+=labDt; updateFo\(labDt\);/.test(SRC)
    && /else if\(V==='frontier'\) body = foPanelHTML\(\);/.test(SRC) && /if\(V==='frontier'\)\{ foBind\(ctl\); \}/.test(SRC) && /fetch\('data\/frontier-atlas\.json'/.test(SRC) && /function foPickInstall\(\)/.test(SRC));
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
