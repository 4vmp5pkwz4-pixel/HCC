#!/usr/bin/env node
'use strict';
/* ══ ORDER, SYNC AND LIGHT (v4.374) ══════════════════════════════════════════════════════════════════════════════
 * Asked for: the laboratories structured, Navier–Stokes first; every laboratory in multiview and the tiles synchronized
 * by the parameters they share; the Cycles world no longer primitive; a demonstration agent that shows the
 * non-obvious. Checked here on the page source, with the pure parts RUN on stubs:
 *   1. the catalogue opens with two chapters — the fluid of S³ (nsflow first), then its light and geometry — and the
 *      first swipe lands on Navier–Stokes
 *   2. the multiview synchronization bus, run: one tempo (each lab at its own default × one factor), one pause (paused
 *      flags and run flags each in their own sense), one shell (clamped to each laboratory's range; the null Beltrami
 *      tile takes k roots), one 4-D turn (the x₀x₁ angle carried across different turn rates)
 *   3. multiview runs the shared animation clock once per frame (not once per tile) and skips world tiles in the
 *      laboratory router; the Navier–Stokes and light-of-S³ quartets exist and open from their own laboratories
 *   4. the Cycles dressing, run: the segments it mirrors for a line, a loop and a segment set; dashed lines excluded;
 *      it is called from the Cycles tick
 *   5. the catalogue no longer covers the controls' header; the demonstration agent tours seven chapters
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const slice = (a, b) => { const i = SRC.indexOf(a), j = SRC.indexOf(b, i); if (i < 0 || j < 0) throw new Error('missing ' + a); return SRC.slice(i, j); };

/* 1 */
{ const ch = SRC.match(/const LAB_CHAPTERS=Object\.freeze\(\{\s*navier:\[([^\]]*)\],\s*s3light:\[([^\]]*)\]\}\);/), ids = s => s.split(',').map(x => x.trim().replace(/'/g, ''));
  const nav = ch ? ids(ch[1]) : [], light = ch ? ids(ch[2]) : [];
  const known = id => new RegExp(`\\{id:'${id}', category:`).test(SRC) || new RegExp(`\\b${id}:'`).test(SRC);
  ok('the catalogue opens with two chapters — the fluid of S³ (Navier–Stokes first) and its light and geometry — before the domains; every member is a real laboratory; the first swipe lands on the fluid',
    nav[0] === 'nsflow' && nav.length >= 10 && light.includes('nbg') && [...nav, ...light].every(known)
    && /const LAB_DOMAIN_ORDER=\['navier','s3light','invariance',/.test(SRC) && /for\(const \[k,ids\] of Object\.entries\(LAB_CHAPTERS\)\) if\(ids\.includes\(v\)\) return k;/.test(SRC)
    && /byDomain\.get\(k\)\.sort\(\(a,b\)=>ids\.indexOf/.test(SRC) && /labBarGo\('nsflow'\); return;/.test(SRC), `I: ${nav.join(', ')} · II: ${light.join(', ')}`); }

/* 2 */
{ const code = slice('const MV_SYNC_SPEC={', 'function mvSyncPanelHTML(){');
  const state = { chaosRun: true, nsfK: 1, gmodeK: 4 }, MV = { on: true, n: 4, active: 1, views: ['nsflow', 'gmode', 'nbg', 'chaos'] };
  const env = { state, MV, mvIsLab: v => true, nsgObjs: null, gmodeObjs: { turn: 10 }, nbgObjs: { turn: 3, P: { station: 'sphere' } }, NBG_TAU: 2 * Math.PI };
  const f = new Function(...Object.keys(env), code + ';return {mvSyncApply,mvSyncCoverage,MV_SYNC_SPEC,mvSyncShellOf};');
  const B = f(...Object.values(env));
  state.mvSyncTempo = true; state.mvTempo = 2; state.mvPauseAll = true; state.mvSyncShell = true; state.mvShell = 6; state.mvSyncTurn = true;
  B.mvSyncApply(true);
  const C = B.mvSyncCoverage();
  ok('one tempo, one pause, one shell, one turn — run on stubs: speeds = own default × 2 (nsflow 1 → 2, gmode 0.35 → 0.7, nbg 0.6 → 1.2); pause sets paused flags and clears run flags; shell 6 is clamped to nsflow\'s 4, taken whole by gmode, and gives the null Beltrami tile six roots; the gmode tile leads the turn',
    state.nsfSpeed === 2 && Math.abs(state.gmodeSpeed - 0.7) < 1e-12 && Math.abs(state.nbgSpeed - 1.2) < 1e-12 && state.nsfPaused === true && state.chaosRun === false
    && state.nsfK === 4 && state.gmodeK === 6 && Array.isArray(state.nbgRoots) && state.nbgRoots.length === 6 && Math.abs(env.nbgObjs.turn - 10) < 1e-12
    && B.mvSyncShellOf('nsflow', 6).clamped && C.shell.length === 3 && C.turn.length === 2 && Object.keys(B.MV_SYNC_SPEC).length >= 50,
    `nsfSpeed ${state.nsfSpeed} · gmodeSpeed ${state.gmodeSpeed} · nsfK ${state.nsfK} · gmodeK ${state.gmodeK} · roots ${state.nbgRoots && state.nbgRoots.length} · ${Object.keys(B.MV_SYNC_SPEC).length} labs on the bus`);
  state.mvPauseAll = false; B.mvSyncApply(true);
  ok('and run again: un-pausing restores run flags and clears paused flags', state.nsfPaused === false && state.chaosRun === true); }

/* 3 */
ok('multiview advances the shared animation clock once per frame and skips world and fractal tiles in the laboratory router; the synchronization bus is ticked by multiview and shown in its panel',
  /const _fbsA0=fbsAnimT;/.test(SRC) && /if\(_mvMulti&&!mvIsLab\(state\.s3view\)\) continue;/.test(SRC) && /if\(_mvMulti\) fbsAnimT=_fbsA0\+dt\*labClockFactor\(\);/.test(SRC)
  && /try\{ mvSyncTick\(dt\); \}catch\(e\)\{\}/.test(SRC) && /\$\{mvSyncPanelHTML\(\)\}/.test(SRC) && /try\{ mvSyncBind\(ctl\); \}catch\(e\)\{\}/.test(SRC));
ok('the Navier–Stokes quartet and the light-of-S³ quartet lead the presets, and a laboratory of either opens its quartet with itself first',
  /const MV_PRESETS=\[\n \{id:'navier', views:\['nsflow','nsgal','triad','vstretch'\]/.test(SRC) && /\{id:'lightS3', views:\['gmode','nbg','tri','unify'\]/.test(SRC)
  && /const P=MV_PRESETS\.find\(p=>p\.views\.includes\(anchor\)&&\(p\.id==='navier'\|\|p\.id==='lightS3'\)\);/.test(SRC));

/* 4 */
{ const code = slice('function cycPremLineSegs(line){', 'function cycPremMirror(line){');
  const segs = new Function(code + ';return cycPremLineSegs;')();
  const geo = n => ({ attributes: { position: { count: n } }, drawRange: { start: 0, count: Infinity } });
  const a = segs({ isLine: true, geometry: geo(5) }).length, b = segs({ isLine: true, isLineLoop: true, geometry: geo(5) }).length, c = segs({ isLineSegments: true, geometry: geo(6) }).length;
  const g = geo(10); g.drawRange = { start: 2, count: 4 }; const d = segs({ isLine: true, geometry: g }).length;
  ok('the Cycles dressing mirrors exactly the segments the line draws — a polyline of 5 points 4, a loop 5, a segment set of 6 points 3, a draw range of 4 points 3 — dashed lines stay dashed, and it runs from the Cycles tick',
    a === 4 && b === 5 && c === 3 && d === 3 && /!m\.isLineDashedMaterial/.test(SRC) && /try\{ cycPremTick\(dt\); \}catch\(e\)/.test(SRC) && /line\.layers\.set\(CYC_PREM\.hidden\)/.test(SRC)
    && /hccShellMaterial\(b\.color\.clone\(\)/.test(SRC) && /hccGlossMaterial\(b\.color\.clone\(\),op\)/.test(SRC), `${a} · ${b} · ${c} · ${d}`); }

/* 5 */
{ const demo = slice('async function agoraDemo(){', "globalThis.HCC_AGORA=Object.freeze(");
  const chapters = ["lab:'nsflow'", "label:'#lbMv'", "lab:'triad'", "id:'nbg'", "world:'cyc'", 'DISCOVERIES', "cmd:'measure'"].filter(k => demo.includes(k)).length;
  ok('the catalogue sits on the band the controls really occupy (no more covering their header), and the demonstration agent tours seven chapters — the fluid, the synchronized quartet, the racket, the null light measured live, the Antikythera engine, three ledger findings, a prediction the clock checks',
    /bottom:calc\(var\(--ctl-band,calc\(var\(--ctl-h,340px\) \+ 14px\)\) \+ 8px\)/.test(SRC) && /setProperty\('--ctl-band'/.test(SRC) && chapters === 7, `${chapters}/7 chapters`); }

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
