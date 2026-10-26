#!/usr/bin/env node
'use strict';
/* ══ THE WHOLE SUITE HOLDS — THE SIX DEFERRED CLAUSES THAT HAD BEEN FAILING (v4.403) ════════════════════════════════
 * The atlas runs its heaviest self-tests only when asked (?fulltests=1). Run that way, six of them failed — the same six
 * on v4.401 and v4.402, from every arrival — and nothing that runs on every build had noticed. Asked: «Исправь и эти 6
 * падающих проверок». Each was traced to its cause before anything was changed, and four of the six were real defects:
 *   1. Invariant Nexus calibration — 4 of its 444 declared relations were never tested: two pairs of laboratories are
 *      joined twice (chronometry–clock by an analogy AND a representation, the quasars and the accretion disk by a
 *      limit AND a coupling), and hiding one relation left the pair joined by its twin. A held relation is now held
 *      with its twins, and every declared relation is tested.
 *   2. All axes at once — a fixed pool of 32 rails and 32 names, written for twenty-five kinds of quantity; with 34
 *      the two of least reach (magnetic field, momentum) were drawn with neither. The pool grows with the survey.
 *   3. The invariant thread — the check pinned nineteen families; the fluid of S³ is the twentieth and is a correct
 *      relation family. The count is reported now; the properties that make the heading true are what is checked.
 *   4. The depth census — read only three-argument position.set calls, so the stroboscope of everything, whose cursor
 *      runs over a torus through position.set(...omniPlace(…)), was scored flat; the offline census in
 *      docs/verify-depth-census.cjs failed the same way and ran in no pool. Both now read a spread vector.
 *   5. and 6. The survey of every instrument counted one failure: the trisphere at every scale hung a cached matrix
 *      on its own name, and a method shorthand has no binding of its own name — every call threw «evaluate is not
 *      defined», so the instrument had never returned. It keeps its cache in TQ_EVAL_CACHE now.
 * And walking every instrument at its defaults found a seventh: the distance ladder declared the two Hubble constants
 * it publishes on the bus and returned neither. A new deferred self-test walks all of them for exactly this.
 * Checked here by RUNNING the calibration and reading the thread from core/atlas/extracted.mjs, and by reading the
 * source for the rest.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const fn = name => { const i = SRC.indexOf('function ' + name + '('); if (i < 0) return ''; const j = SRC.indexOf('\nfunction ', i + 10); return SRC.slice(i, j < 0 ? i + 6000 : j); };
(async () => {
  const K = await import(path.join(ROOT, 'core', 'atlas', 'extracted.mjs'));

  /* 1 · the Nexus calibration tests every declared relation, twins held with it */
  { const R = K.NEXUS_RELATIONS, C = K.nexusStructuralCalibration('all');
    const key = e => [e.a, e.b].sort().join('|');
    const byPair = new Map(); for (const e of R) byPair.set(key(e), (byPair.get(key(e)) || []).concat(e));
    const twins = [...byPair.values()].filter(v => v.length > 1);
    /* what the old hold-out did: hide the one relation and ask whether its pair is still joined */
    const skippedBefore = R.filter(e => R.some(x => x !== e && key(x) === key(e))).length;
    ok('the Invariant Nexus calibration TESTS EVERY DECLARED RELATION: a held relation is held with every relation parallel to it, because the score reads the simple graph and a pair joined twice stays joined by its twin — which is how four of the 444 were skipped without a word',
      C.tested === R.length && twins.length >= 1 && skippedBefore > 0
      && /if\(pair&&\(\(e\.a===pair\[0\]&&e\.b===pair\[1\]\)\|\|\(e\.a===pair\[1\]&&e\.b===pair\[0\]\)\)\)continue;/.test(fn('nexusAdjacency'))
      && /const adj=nexusAdjacency\(kind,e\.id,\[e\.a,e\.b\]\)/.test(fn('nexusStructuralCalibration')),
      `${C.tested} of ${R.length} relations tested · ${twins.length} pairs joined twice (${twins.map(v => v[0].a + '–' + v[0].b + ': ' + v.map(e => e.type).join(' + ')).join('; ')}) — ${skippedBefore} relations the old hold-out could not ask about · R@1 ${(100 * C.recall_at_1).toFixed(1)} % · R@5 ${(100 * C.recall_at_5).toFixed(1)} % · MRR ${C.mean_reciprocal_rank.toFixed(3)}`); }

  /* 2 · the stacked axes grow with the survey */
  { const E = fn('scalesStackEnsure');
    ok('ALL AXES AT ONCE: the rails and their names grow with the survey they draw, before every build of the stacked view — the pool was a fixed 32, and at 34 kinds the two of least reach had neither a rail nor a name',
      /if\(O\.rails\.instanceMatrix\.count<n\)\{ const old=O\.rails, m=new THREE\.InstancedMesh\(old\.geometry,old\.material,n\+8\);/.test(E)
      && /while\(O\.stackLabs\.length<n\) O\.stackLabs\.push\(scalesStackLabel\(\)\);/.test(E)
      && /const top=1\.95, step=Math\.min\(0\.115,2\.7\/Math\.max\(1,ordered\.length\)\);\s*scalesStackEnsure\(O,ordered\.length\);/.test(SRC)
      && /for\(let i=0;i<STACK_N;i\+\+\) stackLabs\.push\(scalesStackLabel\(\)\);/.test(SRC),
      'rails re-made at n + 8 when outgrown, labels added one by one, sized from the ordered kinds of this build'); }

  /* 3 · the thread: one identity, every other family a relation that says what it is */
  { const T = K.INVARIANT_THREAD, id = T.filter(f => f.kind === 'identity'), rel = T.filter(f => f.kind === 'relation');
    const idOneUnit = id.every(f => new Set(f.rows.map(r => r.unit)).size === 1);
    const mute = rel.filter(f => !(f.rel && f.rel.en && f.rel.en.length > 40));
    const unitless = T.reduce((n, f) => n + f.rows.filter(r => !r.unit).length, 0);
    ok('THE INVARIANT THREAD: exactly ONE family is one number (its rows in one unit), every other family is a relation that says what the relation is, and no row lacks a unit — and the self-test now checks those properties and reports the count instead of pinning nineteen, which the fluid of S³ had made twenty',
      T.length >= 19 && id.length === 1 && idOneUnit && rel.length === T.length - 1 && mute.length === 0 && unitless === 0
      && /IT\.fam\.length>=19\s*&& IT\.identity\.length===1 && IT\.relation\.length===IT\.fam\.length-1/.test(SRC)
      && !/IT\.fam\.length===19/.test(SRC),
      `${T.length} families · identity: ${id.map(f => f.id).join(', ')} · ${rel.length} relations, ${mute.length} without a stated relation · ${unitless} rows without a unit · newest: ${T[T.length - 1].id}`); }

  /* 4 · the depth census reads a spread vector, in the page and outside it */
  { const offline = fs.readFileSync(path.join(__dirname, 'verify-depth-census.cjs'), 'utf8');
    const pool = fs.readFileSync(path.join(ROOT, 'scripts', 'run-quick-verifiers.mjs'), 'utf8');
    ok('THE DEPTH CENSUS reads position.set(...vector) as the 3-vector it is, in the page\'s self-test AND in the offline census — which failed the same way and was in no pool, so nobody saw it — and the offline census now runs with the others',
      /else if\(a\.length===1&&a\[0\]\.startsWith\('\.\.\.'\)\) z\.push\('\('\+a\[0\]\.slice\(3\)\+'\)\[2\]'\);/.test(SRC)
      && /else if \(a\.length === 1 && a\[0\]\.startsWith\('\.\.\.'\)\) z\.push\('\(' \+ a\[0\]\.slice\(3\) \+ '\)\[2\]'\);/.test(offline)
      && /"docs\/verify-depth-census\.cjs",/.test(pool)
      && /O\.cur\.position\.set\(\.\.\.omniPlace\(O,omniPhasesABC\(O\)\)\);/.test(fn('updateOmni')),
      'the stroboscope of everything moves its cursor over a torus or a cube through a spread — 3-D, as the census now says'); }

  /* 5 · 6 · no instrument names itself from inside a method shorthand */
  { const ev = (() => { const i = SRC.indexOf("id:'everys3', world:'s3', lab:'everys3',"); return i < 0 ? '' : SRC.slice(i, SRC.indexOf("}); }catch(e){ console.warn('everys3 contract'", i)); })();
    const selfNamed = [...SRC.matchAll(/\n  evaluate\(inp\)\{[\s\S]*?\n\}\); \}catch\(e\)\{ console\.warn\('([a-z0-9]+) contract'/g)].filter(m => /\bevaluate\.[A-Za-z_]/.test(m[0])).map(m => m[1]);
    ok('THE TRISPHERE AT EVERY SCALE RETURNS: its link matrix is kept in a cache of its own, not hung on the method\'s own name — a method shorthand has no binding of its own name, so every call had thrown «evaluate is not defined», the survey of every instrument counted that one failure, and two self-tests failed on it; and no other instrument names itself that way',
      /const TQ_EVAL_CACHE=\{M:null\};/.test(SRC) && /if\(!TQ_EVAL_CACHE\.M\)\{/.test(ev) && /const M=TQ_EVAL_CACHE\.M;/.test(ev)
      && !/\bevaluate\.M\b/.test(SRC) && selfNamed.length === 0,
      `cache ${/TQ_EVAL_CACHE/.test(ev) ? 'TQ_EVAL_CACHE' : 'MISSING'} · instruments naming themselves from inside: ${selfNamed.length ? selfNamed.join(', ') : 'none'}`); }

  /* 7 · the distance ladder returns the two Hubble constants it declares and publishes */
  { const H = K.DL_H0, late = H.find(h => h.id === 'shoes'), early = H.find(h => h.id === 'planck');
    ok('THE DISTANCE LADDER RETURNS WHAT IT DECLARES: hubble_constant_late and hubble_constant_early were in its contract and on the bus for releases and returned by nothing — the same two quoted values the laboratory publishes, SH0ES and Planck',
      /hubble_constant_late:shoes\.value, hubble_constant_early:planck\.value,/.test(SRC)
      && /ATLAS_BUS\.pub\('rungs\.hubble_constant_late',S\.value,'km s\^-1 Mpc\^-1'\);/.test(SRC)
      && /ATLAS_BUS\.pub\('rungs\.hubble_constant_early',P\.value,'km s\^-1 Mpc\^-1'\);/.test(SRC)
      && !!late && !!early,
      late && early ? `late ${late.value} · early ${early.value} km s⁻¹ Mpc⁻¹` : 'DL_H0 lacks an entry'); }

  /* 8 · and the walk that found it is a self-test now */
  { const i = SRC.indexOf("if(!defer('every instrument returns what it declares'))"), blk = i < 0 ? '' : SRC.slice(i, i + 3200);
    ok('AND EVERY INSTRUMENT IS CALLED AT ITS OWN DEFAULTS by a deferred self-test that fails on one that throws or returns fewer outputs than it declares — the question nothing here had asked of all of them at once',
      i > 0 && /for\(const \[id,sp\] of HCC_API_SPECS\)/.test(blk) && /threw\.push/.test(blk) && /short\.push/.test(blk)
      && /IR!=null && IR\.n>=150 && IR\.threw\.length===0 && IR\.short\.length===0/.test(blk),
      i > 0 ? 'present, deferred to the whole suite (?fulltests=1)' : 'MISSING'); }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
