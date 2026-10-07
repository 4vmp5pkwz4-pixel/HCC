#!/usr/bin/env node
'use strict';
/* ══ THE RESEARCH CHAPTER (v4.376) ════════════════════════════════════════════════════════════════════════════════
 * Asked: "what are these — CIVP · CP¹ evaluation lock … DRD · Info, Selector — and can they be fixed?" They are the
 * seven stations of the CIVP locking argument and the two capacity instruments of the FBS3R programme: exact
 * arithmetic about frameworks, not models of nature. Checked here:
 *   1. every one is named in plain words, numbered in the order the argument runs, in English, Russian and German
 *   2. they form one chapter of the catalogue, in that order, whose heading says what they are
 *   3. multiview keeps one CIVP tile at a time (the stations share one stage)
 *   4. the light dressing reaches their scenes, keeps invisible pick proxies invisible, turns veils into glass and leaves
 *      point clouds their own size and blending
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const ids = ['civplock', 'civpcut', 'civpidx', 'civpa4', 'civpsel', 'civpcar', 'civpclo'];
const line = SRC.split('\n').find(l => l.startsWith('const S3_VIEW_NAMES={'));
const i0 = SRC.split('\n').indexOf(line), L = SRC.split('\n');
const nameIn = (l, k) => { const m = l.match(new RegExp(`(?<![A-Za-z0-9_])${k}:'([^']*)'`)); return m ? m[1] : null; };
const en = ids.map(k => nameIn(L[i0], k)), ru = ids.map(k => nameIn(L[i0 + 2], k)), de = ids.map(k => nameIn(L[i0 + 3], k));
ok('the seven CIVP stations are named in plain words and numbered 1/7 … 7/7 in English, Russian and German; DRD and the selector say what they measure',
  [en, ru, de].every(a => a.every((n, j) => n && n.startsWith(`CIVP ${j + 1}/7 · `))) && /drd:'DRD · how many distinguishable modes S³ holds'/.test(L[i0]) && /sel:'Selector · which capacity bound applies \(Σ_grav\)'/.test(L[i0])
  && /drd:'DRD · сколько различимых мод вмещает S³'/.test(L[i0 + 2]), en.join(' | '));
ok('one chapter, in the order of the argument, headed as frameworks under test — not established physics',
  /research:\['civplock','civpcut','civpidx','civpa4','civpsel','civpcar','civpclo','drd','sel'\]/.test(SRC) && /'other','research','sketch'\]/.test(SRC)
  && /research:\{en:'Research programmes · the CIVP locking chain \(7 stations\)[^']*not established physics'/.test(SRC));
ok('multiview keeps one CIVP tile at a time — the stations share one stage',
  /if\(\/\^civp\/\.test\(v\)\)\{ const j=MV\.views\.slice\(0,MV\.n\)\.findIndex/.test(SRC) && /if\(civpSeen\) return false; civpSeen=true;/.test(SRC));
ok('the light dressing reaches the CIVP, DRD and selector scenes; invisible pick proxies stay invisible; veils become glass; point clouds keep their size and blending',
  /return \[cycGroup, typeof civpGroup!=='undefined'\?civpGroup:null, typeof drdGroup!=='undefined'\?drdGroup:null, typeof selGroup!=='undefined'\?selGroup:null\]/.test(SRC)
  && /o\.material\.visible!==false&&!\(o\.material\.transparent&&\(o\.material\.opacity\?\?1\)<0\.02\)&&!\/pick\/i\.test\(o\.name\|\|''\)/.test(SRC)
  && /if\(op<0\.55\|\|b\.side!==THREE\.FrontSide\|\|/.test(SRC) && !/m\.size=\(m\.size\|\|1\)\*1\.8/.test(SRC) && /try\{ cycPremTick\(dt\); \}catch\(e\)\{\}\n/.test(SRC));
console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
