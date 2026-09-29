#!/usr/bin/env node
'use strict';
/* ══ THE STROBOSCOPE OF EVERYTHING, THE FLUID FIRST, THE S³ SPECTRUM ON THE φ-SPHERES, AND AN AUDIT (v4.346) ═══════
 * Checked on core/atlas/extracted.mjs:
 *   1. the catalogue spans the electron's Compton oscillation to the light's loop round S³, and the display is a
 *      stroboscope: slow motion s = ε·P·hz gives exactly ε turns a frame (true), a lock gives N + ε
 *   2. blind, the finder returns Laplace's resonance of Io, Europa and Ganymede, beyond every random triple, and
 *      the strobed flashes lie on its plane; the Moon, three atomic clocks and three outer planets are chance-level
 *   3. pairs are stopped at the precision of the data: Mercury's 3 : 2 is locked and surprising, the Venus pentagram
 *      and the Neptune–Pluto 2 : 3 are what a continued fraction gives a random ratio
 *   4. the audit's corrections: the three-distance theorem on every pair of cycles, no junk convergents, the blind
 *      null refined like the peaks, no NaN for three equal curls, aliasing at the edges
 *   5. the S³ spectrum on the φ-ladder's own spheres: N_k = log_φ(2πR/((k+2)l_P)), gaps log_φ((k+3)/(k+2)) —
 *      0.843 between k = 0 and 1, under a quarter rung from k = 6 — drawn as spheres of radius φ^(N_k − D)
 *   6. wired: Navier–Stokes on S³ is where S³ opens and heads the catalogue; the laboratory is declared, routed,
 *      drawn, in the API, related, in the ledger with replaying tracks
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { phaseAll, phaseItem, phaseSlowMotion, phaseStrobeLock, phaseTurnsPerFrame, phaseWindow, phaseApparent, phaseRelation2, phaseRelation3, phaseRelationNull, phaseBestLock, phasePrec,
    phaseFlashes, phasePlaneSpread, hccAliasState, hccTurnsPerFrame, hccApparentTurns, cycStrobe, cycConvergents, CYCLES, strobeNull, strobeLandscape, triadExperiment, carrierPlanes,
    fbsS3Pick, s3LadderN, s3LadderKofN, LN_PHI, LAB_FEATURED, DISCOVERIES, discoveryTrack, trackRun } = K;
  { const L = phaseAll(), Ps = L.map(x => x.P), lo = Math.min(...Ps), hi = Math.max(...Ps); let worst = 0, allTrue = true, lock = 0;
    for (const it of L) { const s = phaseSlowMotion(it.P, 60, 0.02), t = phaseTurnsPerFrame(it.P, s, 60); worst = Math.max(worst, Math.abs(t - 0.02)); allTrue = allTrue && hccAliasState(t) === 'true';
      const sl = phaseStrobeLock(it.P, 60, 3, 0.002); lock = Math.max(lock, Math.abs(phaseTurnsPerFrame(it.P, sl, 60) - 3.002)); }
    const W = phaseWindow(1, 60), A = phaseApparent(9192631770, 9192631770 - 1);
    ok('the catalogue spans 10⁻²⁰ s to 10¹⁸ s, and every period comes into the eye’s window by one time scale: slow motion is ε turns a frame, a lock is N + ε',
      L.length >= 36 && lo < 1e-20 && hi > 1e17 && L.every(x => x.P > 0 && x.prec > 0 && ['defined', 'measured', 'derived', 'model'].includes(x.kind)) && worst < 1e-12 && allTrue && lock < 1e-12
      && Math.abs(W.Pmin - 1 / 15) < 1e-12 && W.Pmax === 600 && A.n === 1 && Math.abs(A.fapp - 1) < 1e-3,
      `${L.length} periods · ${lo.toExponential(2)} s … ${hi.toExponential(2)} s · worst slow-motion error ${worst.toExponential(1)} · caesium strobed 1 Hz low beats at ${A.fapp.toFixed(3)} Hz`); }
  { const I = ['io', 'europa', 'ganymede'].map(k => phaseItem(k).P), r = phaseRelation3(I, 6), n = phaseRelationNull(I, 6, 300), pts = phaseFlashes(I, 0.37 * 86400, 3000, 12345), sp = phasePlaneSpread(pts, r), sp0 = phasePlaneSpread(pts, { a: 1, b: 1, c: 1 });
    const ctrl = [['synodic', 'draconic', 'anomalistic', 12], ['cs133', 'h21', 'sr87', 6], ['jupiter', 'saturn', 'neptune', 6]].map(([a, b, c, M]) => phaseRelationNull([a, b, c].map(k => phaseItem(k).P), M, 150).p);
    ok('blind, the finder returns Laplace’s resonance f_Io − 3f_Europa + 2f_Ganymede = 0 beyond every random triple, and the strobed flashes lie on its plane; the controls are chance-level',
      r.a === 1 && r.b === -3 && r.c === 2 && r.rel < 1e-9 && n.hits === 0 && n.p < 0.004 && sp < 1e-6 && sp0 > 0.3 && ctrl.every(p => p > 0.05),
      `relative miss ${r.rel.toExponential(2)} · ${n.hits}/${n.trials} random triples as good · plane spread ${sp.toExponential(1)} (a random plane ${sp0.toFixed(2)}) · controls p = ${ctrl.map(p => p.toFixed(2)).join(', ')}`); }
  { const lk = (a, b) => phaseBestLock(phaseItem(a).P, phaseItem(b).P, 8, phasePrec(phaseItem(a), phaseItem(b))), m = lk('mercrot', 'mercury'), v = lk('venus', 'earth'), np = lk('neptune', 'pluto');
    const npAll = phaseRelation2(phaseItem('neptune').P, phaseItem('pluto').P, 12, phasePrec(phaseItem('neptune'), phaseItem('pluto'))), stops = npAll.slice(0, -1).every(c => c.rel > 4e-5);
    ok('pairs stop where the data stop: Mercury’s 3 : 2 is locked within the data and surprising; the Venus pentagram and the Neptune–Pluto 2 : 3 are what a continued fraction gives a random ratio',
      m.q === 2 && m.p === 3 && m.locked && m.pLook < 1e-3 && v.q === 8 && v.p === 13 && v.pLook > 0.3 && np.q === 2 && np.p === 3 && np.pLook > 0.05 && stops && npAll.length < 8,
      `Mercury p ${m.pLook.toExponential(1)} · Venus ${v.pLook.toFixed(2)} · Neptune–Pluto ${np.pLook.toFixed(2)} · Neptune–Pluto expansion stops after ${npAll.length} convergents`); }
  { const C = CYCLES.filter(c => c.days > 0); let bad = 0, tot = 0; for (const a of C) for (const b of C) { if (a === b) continue; for (const N of [120, 400]) { const r = cycStrobe(a, b, N, 0); tot++; if (!r.three || r.sumRule > 1e-9) bad++; } }
    let junk = 0, fr = 0; for (let q = 1; q <= 400; q++) for (let p = 0; p < q; p++) { fr++; if (cycConvergents(p / q, 20).some(c => c.q > q)) junk++; }
    const P = [29.530588853, 27.212220817, 27.554549878, 365.24219], lo = Math.log10(30), hi = Math.log10(40000), nul = strobeNull(P, lo, hi, 20000, 3, 5, 0.05, 0.01);
    const tri = triadExperiment('2:1,2:1,2:1', 0.3), cp = carrierPlanes(0, 1);
    ok('the audit’s corrections hold: three distances for every pair of cycles, no junk convergents, a refined null, no NaN for three equal curls, aliasing at the edges',
      bad === 0 && tot === 684 && junk === 0 && fr === 80200 && nul.length === 3 && nul.every(Number.isFinite) && Number.isFinite(tri.returnErr) && tri.T === Infinity
      && hccTurnsPerFrame(0, 60) === Infinity && hccAliasState(hccTurnsPerFrame(0, 60)) === 'aliased' && hccApparentTurns(0.5) === 0.5 && hccApparentTurns(-0.5) === 0.5 && [cp.e1, cp.e2, cp.e3, cp.e4].every(e => e.every(Number.isFinite))
      && /stop AT the exact rational/.test(SRC) && /step it directly/.test(SRC) && /the null must be read as the observation is/.test(SRC),
      `three-distance failures ${bad}/${tot} · junk convergents ${junk}/${fr} · null maxima ${nul.map(x => x.toFixed(3)).join(', ')} · equal curls T = ∞, return ${tri.returnErr}`); }
  { const Rm = K.S3.R * K.GLY_M, gap = k => Math.log((k + 3) / (k + 2)) / LN_PHI, q = [0, 1, 2, 3, 4, 5, 6, 7].map(gap), N0 = s3LadderN(0, Rm), pick = fbsS3Pick(N0 - 2, Rm), ex = pick.filter(p => p.exact).map(p => p.k), deep = fbsS3Pick(200, Rm);
    const round = Math.abs(s3LadderKofN(s3LadderN(17, Rm), Rm) - 17) < 1e-6;
    ok('the S³ spectrum rides the φ-ladder’s own spheres: gap 0.843 of a rung between k = 0 and 1, under a quarter rung from k = 6 — every integer shell drawn while it is a quarter rung apart, then one per half rung',
      Math.abs(q[0] - 0.8426) < 1e-3 && q[5] >= 0.25 && q[6] < 0.25 && q.every((x, i) => i === 0 || x < q[i - 1]) && ex.join(',') === '0,1,2,3,4,5,6' && pick.length > ex.length && deep.length > 5 && deep.filter(p => p.exact).length <= 1 && round
      && /s\.g\.scale\.setScalar\(rs\)/.test(SRC) && /const N=s3LadderN\(p\.k,Rm\), rs=Math\.exp\(\(N-D\)\*LN_PHI\)/.test(SRC) && /fbsS3Group\.position\.set\(0,0,0\); fbsS3Group\.rotation\.set\(0,0,0\)/.test(SRC),
      `gaps ${q.map(x => x.toFixed(3)).join(' ')} · near the S³ radius the exact shells ${ex.join(',')} then ${pick.length - ex.length} sampled · at N = 200: ${deep.length} sampled shells, k ≈ ${Number(deep[0].k).toExponential(2)}`); }
  { const ids = ['blindLaplace', 'locksByPrecision', 'spectrumOnLadder', 'kernelAudit346'], led = ids.every(id => DISCOVERIES.some(d => d.id === id && d.verifier === 'docs/verify-the-stroboscope-of-everything.cjs')), tr = ids.every(id => trackRun(discoveryTrack(id)).ok);
    ok('wired: S³ opens on Navier–Stokes and the catalogue offers the fluid first; the stroboscope of everything is declared, routed, drawn, in the API, related and in the ledger with replaying tracks',
      led && tr && LAB_FEATURED[0] === 'nsflow' && /\{id:'s3',\s+title:'S³ · Hopf',[^\n]*defaultEntry:'nsflow'/.test(SRC) && /case 's3': V\('nsflow'\); break;/.test(SRC) && /labFeaturedHTML\(\) \+ LAB_DOMAIN_ORDER/.test(SRC)
      && /\{id:'omnistrobe', category:'dyn'/.test(SRC) && /omniGroup\.visible = \(v==='omnistrobe'\);/.test(SRC) && /state\.s3view==='omnistrobe'\)\{\n\s*fbsAnimT\+=labDt; updateOmni\(labDt\);/.test(SRC)
      && /id:'omnistrobe', world:'s3', lab:'omnistrobe',/.test(SRC) && /\['omnistrobe','strobe','coupling'/.test(SRC) && /\['omniAtlas','omnistrobe',omniGroup,/.test(SRC) && /data-omnipick=/.test(SRC) && /data-strobego="omnistrobe"/.test(SRC),
      `ledger ${led ? 'ok' : 'MISSING'} · tracks ${tr ? 'replay' : 'FAIL'} · featured ${LAB_FEATURED.join(', ')}`); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
