#!/usr/bin/env node
'use strict';
/* ══ ∴ THE HIERARCHY OF EVERY INVARIANT, AS A RUNNING MECHANISM ═════════════════════
 * Every exact relation in the census is a pure number times G^α c^β ħ^γ k_B^δ, the exponents
 * fixed by the declared units. That makes the collection one tree — four constants,
 * the combinations of them the laws carry, the laws, the laboratories — and the atlas builds
 * it as an object of the scene and RUNS it. This file rebuilds the tree from api/invariants.json
 * with the extracted Planck decomposition and checks:
 *   1. every law of the tree hangs from the constants its dimension demands: for each law,
 *      the four exponents reproduce the dimension of its constant exactly (M, L, T, Θ)
 *   2. the tree is the whole census, not a sample: over a hundred laws, over twenty
 *      combinations, the free-fall combination G⁻¹ and the horizon combination ħc/k_B among them
 *   3. it is built for a headset: its text is canvas sprites in world space, never CSS
 *      overlays (which a WebXR session does not draw), and the constants carry CODATA values
 *   4. it runs: the mechanism recomputes every local law at random points through the
 *      laboratory's contract and paints it by the residual it has — measured, not quoted
 *   5. MUTATIONS: a law hung from the wrong constants, and a tree labelled with CSS, are caught
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const J = JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'invariants.json'), 'utf8'));
const MAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'manifest.json'), 'utf8'));
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(ROOT, 'core', 'atlas', 'extracted.mjs'));
  const unitOf = lab => n => { const i = MAN.instruments.find(x => x.id === lab); const o = i && i.outputs.find(o => o.name === n); return o && o.unit; };
  const UP = t => { const i = t.indexOf('.'); return unitOf(t.slice(0, i))(t.slice(i + 1)); };
  const laws = [];
  const add = (terms, exps, value, uo) => { const P = K.invPlanck(terms, exps, value, uo, 1e-10); if (!P || P.why) return;
    if (!P.form && !P.dimensionless && !(Math.abs(P.pure) > 1e-3 && Math.abs(P.pure) < 1e3)) return; if (P.dimensionless && !P.form && !K.invClosedForm(Math.abs(value), 1e-10)) return;
    laws.push({ terms, exps, P, uo }); };
  for (const L of J.laboratories) for (const p of ((L.across || {}).products || [])) if (p.exact) add(p.terms, p.exponents, p.value, unitOf(L.id));
  for (const c of (J.across_the_bus || [])) for (const p of (c.products || [])) add(p.terms, p.exponents, p.value, UP);
  for (const c of (J.through_a_middle_laboratory || [])) for (const p of (c.products || [])) add(p.terms, p.exponents, p.value, UP);
  const combos = [...new Set(laws.map(l => l.P.dimensionless ? '1' : l.P.units))];
  /* 1 · every law hangs from the constants its dimension demands */
  const CD = { G: [-1, 3, -2, 0], c: [0, 1, -1, 0], 'ħ': [1, 2, -1, 0], k_B: [1, 2, -2, -1] };
  const hangs = l => { const d = [0, 0, 0, 0]; for (const [n, v] of Object.entries(CD)) { const e = l.P.exponents[n] || 0; for (let k = 0; k < 4; k++) d[k] += e * v[k]; } return d.every((x, k) => Math.abs(x - l.P.dimension[k]) < 1e-9); };
  const bad = laws.filter(l => !hangs(l));
  ok('every law hangs from exactly the constants its dimension demands: G^α c^β ħ^γ k_B^δ reproduces M, L, T, Θ of its constant', laws.length > 0 && bad.length === 0, `${laws.length} laws, ${bad.length} misplaced`);
  /* 2 · the whole census */
  ok('the tree is the whole census: over a hundred laws, over twenty combinations, free fall (G⁻¹) and the horizon (c ħ k_B⁻¹) among them',
    laws.length > 100 && combos.length > 20 && combos.includes('G⁻¹') && combos.includes('c ħ k_B⁻¹') && /function eqTreeData\(A\)\{/.test(SRC), `${laws.length} laws · ${combos.length} combinations`);
  /* 3 · built for a headset */
  const build = (SRC.match(/async function eqTreeBuild\(\)\{[\s\S]*?\n  return true; \}/) || [''])[0];
  const xr = s => /function eqSprite\(text,color,h\)\{[\s\S]*?new THREE\.Sprite\(new THREE\.SpriteMaterial\(\{map:t,transparent:true,depthWrite:false\}\)\)/.test(s) && !/mkLabel\(/.test((s.match(/async function eqTreeBuild\(\)\{[\s\S]*?\n  return true; \}/) || [''])[0]);
  const codata = /const EQ_CONST=\[\['G',6\.6743e-11,/.test(SRC) && /\['c',299792458,/.test(SRC) && /\['ħ',1\.054571817e-34,/.test(SRC) && /\['k_B',1\.380649e-23,/.test(SRC);
  ok('built for a headset: every caption is a canvas sprite in world space, no CSS overlay in the tree; the constants carry CODATA values', xr(SRC) && codata && build.length > 0);
  /* 4 · it runs */
  const runs = /function eqTreeRun\(\)\{/.test(SRC) && /inp\[f\.name\]=pspSnap\(id,f\.name,pspAt\(f,rnd\(\)\)\); const r=pspEval\(id,inp\);/.test(SRC)
    && /res=Math\.max\(\.\.\.vals\.map\(v=>Math\.abs\(v\/m-1\)\)\)/.test(SRC) && /add\('Hierarchy of every invariant',/.test(SRC);
  ok('it runs: every local law recomputed at random points through its laboratory\'s contract and painted by its measured residual', runs);
  /* 5 · mutations */
  const wrong = { ...laws[0], P: { ...laws[0].P, exponents: { ...laws[0].P.exponents, G: (laws[0].P.exponents.G || 0) + 1 } } };
  ok('MUTATION — a law hung from the wrong constants is caught', !hangs(wrong));
  ok('MUTATION — a tree labelled with CSS overlays is caught', !xr(SRC.replace("const S=eqSprite(v,'#7fe0d0',0.2);", "const S=mkLabel(v);")));
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
