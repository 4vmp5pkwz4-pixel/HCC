#!/usr/bin/env node
'use strict';
/* ══ THE UNIFIED FUNDAMENTAL ATLAS (v4.357) ══════════════════════════════════════════════════════════════════════
 * The specification "HCC / S³ Unified Fundamental Atlas" (2026-10-05) audits 58 mechanisms and states 21 regression
 * gates. Checked on the atlas's own kernels (core/atlas/extracted.mjs):
 *   1. the registry holds all 58 mechanisms with a tier and a source status; duplicates alias their originals
 *   2. the gates run: 15 pass numerically, none fails, the rest are declared or not applicable — never silently passed
 *   3. G07: the chiral null family has real rank 2(m+1), its SO(4) orbit the full (m+1)(m+3) — a subspace, measured
 *   4. G08: ∫|Re F|² = 1 by exact quadrature, so the helicity of the real Beltrami field is 1/(m+2) on the unit sphere
 *   5. G19: mirror symmetry for the quintic in exact rational arithmetic — the q³ coefficient 8 564 575 000 and
 *      n₁…n₆ = 2875 … 248249742118022000
 *   6. the source's two numerical errors recomputed (M44, M46) and the Hasimoto map (G15)
 *   7. wired: declared, routed, drawn, controls, API, relations, ledger with replaying tracks, the corrected wording
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { UNIFY_MECHANISMS, UNIFY_TIERS, UNIFY_GATES, unifyRunGates, unifySpectrumRank, unifyHelicity, unifyQuintic, unifyCorrections, unifyHasimoto, unifyDatum, DISCOVERIES, discoveryTrack, trackRun } = K;
  { const ids = UNIFY_MECHANISMS.map(m => m.id), tiers = UNIFY_MECHANISMS.every(m => UNIFY_TIERS[m.tier] && m.sourceStatus && m.assessment), alias = UNIFY_MECHANISMS.filter(m => m.alias).every(m => ids.includes(m.alias) && m.tier === 'ALIAS');
    const count = t => UNIFY_MECHANISMS.filter(m => m.tier === t).length;
    ok('the registry holds all 58 mechanisms (M01–M58) with a tier, a source status and a verdict; the three duplicates alias their originals', ids.length === 58 && new Set(ids).size === 58 && ids[0] === 'M01' && ids[57] === 'M58' && tiers && alias && UNIFY_GATES.length === 21,
      `canonical ${count('CANONICAL') + count('CANONICAL+VERIFY')} · mixed ${count('MIXED')} · research ${count('RESEARCH')} · disabled ${count('DISABLED')}`); }
  const G = unifyRunGates();
  { const p = G.filter(g => g.status === 'PASS').length, f = G.filter(g => g.status === 'FAIL').length, d = G.filter(g => g.status === 'DECLARED').length, na = G.filter(g => g.status === 'N/A').length;
    const declaredRight = ['G09', 'G10', 'G11', 'G14', 'G18'].every(id => G.find(g => g.id === id).status === 'DECLARED') && G.find(g => g.id === 'G16').status === 'N/A';
    ok('the 21 gates run on the atlas: 15 pass numerically, none fails, five are declared (they guard claims the atlas does not make) and one is not applicable', p === 15 && f === 0 && d === 5 && na === 1 && declaredRight && G.every(g => g.datum && g.datum.formulaId), `${p} PASS · ${f} FAIL · ${d} declared · ${na} n/a`); }
  { const r = [0, 1, 2].map(m => [unifySpectrumRank(m, false, 3), unifySpectrumRank(m, true, 5)]);
    ok('G07 measured: the chiral family z₁^a z₂^b(ξ₂ + iξ₃) spans real dimension 2(m+1); its SO(4) orbit spans the whole curl eigenspace, (m+1)(m+3)', r.every(([h, f], m) => h === 2 * (m + 1) && f === (m + 1) * (m + 3)), r.map(([h, f], m) => `m=${m}: ${h}/${f}`).join(' · ')); }
  { const H = [[0, 0], [1, 0], [2, 1], [3, 3]].map(([a, b]) => unifyHelicity(a, b));
    ok('G08: ∫|Re F|² = 1 by exact quadrature for every degree, so the helicity of the verified real Beltrami field is 1/(m+2) (R/(m+2) on S³_R)', H.every(h => Math.abs(h.B2 - 1) < 1e-10 && Math.abs(h.H - 1 / h.lambda) < 1e-10), H.map(h => `λ=${h.lambda}: ${h.H.toFixed(10)}`).join(' · ')); }
  { const Q = unifyQuintic(6), want = ['2875', '609250', '317206375', '242467530000', '229305888887625', '248249742118022000'];
    ok('G19: mirror symmetry for the quintic in exact rational arithmetic — the instanton expansion has integer coefficients, q³ = 8 564 575 000, and n₁…n₆ are the classical genus-0 invariants', Q.integral && Q.yukawa[3] === '8564575000' && want.every((w, i) => Q.gv0[i] === w), 'n = ' + Q.gv0.join(', ')); }
  { const C = unifyCorrections(), h = unifyHasimoto(1, 0.6), h2 = unifyHasimoto(0.7, 1.3);
    ok('the source’s errors recomputed: a Planck-mass Einstein radius is ~6.3·10⁻⁶ cm (not 10⁻¹⁵), a 10⁵ g hole lives 8.4·10⁻¹¹ s (not 10⁻¹⁹); and G15 — LIA moves a helix by κb and ψ = κe^{iτs+iωt} solves the NLS with ω = κ²/2 − τ²',
      Math.abs(C.einsteinRadiusCm / 6.316e-6 - 1) < 2e-3 && Math.abs(C.pbhLifetimeS / 8.41e-11 - 1) < 2e-3 && C.ordersOff > 9 && C.lifetimeOrdersOff > 8 && h.liaResidual < 1e-5 && h.nlsResidual < 1e-5 && h2.liaResidual < 1e-5,
      `R_E = ${C.einsteinRadiusCm.toExponential(3)} cm · τ = ${C.pbhLifetimeS.toExponential(3)} s · LIA ${h.liaResidual.toExponential(1)} · NLS ${h.nlsResidual.toExponential(1)}`); }
  { const d = unifyDatum({ id: 'x', value: 1, fn: unifyQuintic, formulaId: 'F' }), keys = ['id', 'quantityKind', 'value', 'unit', 'dimension', 'frame', 'observer', 'epoch', 'timeScale', 'uncertainty', 'covarianceRef', 'epistemicStatus', 'sourceId', 'sourceVersion', 'solverId', 'formulaId', 'parameters', 'codeHash', 'validityDomain', 'verification'];
    const ids = ['chiralSubspace', 'mirrorQuintic', 'specRecomputed']; let replay = true; for (const id of ids) { const t = discoveryTrack(id), r = t ? trackRun(t) : null; replay = replay && !!(r && r.ok); }
    const wired = /const unifyGroup=new THREE\.Group\(\); unifyGroup\.visible=false; s3Group\.add\(unifyGroup\);/.test(SRC) && /unifyGroup\.visible = \(v==='unify'\);/.test(SRC) && /\} else if\(state\.s3view==='unify'\)\{\n\s*fbsAnimT\+=labDt; updateUnify\(labDt\);/.test(SRC)
      && /else if\(V==='unify'\) body = unifyPanelHTML\(\);/.test(SRC) && /id:'unify', world:'s3', lab:'unify',/.test(SRC) && /\['unifyAtlas','unify',unifyGroup,/.test(SRC) && /hccGrip\(\{ id:'unify',/.test(SRC) && /fbs3r_unified_fundamental_atlas\.json/.test(SRC);
    const worded = !/without diffracting|never diffracts/.test(SRC) && /CHIRAL SUBSPACE of complex dimension m\+1/.test(SRC);
    ok('wired: the ScientificDatum carries every field of the schema and a code hash; declared, routed, drawn with its instrument and grip, API, relations, three ledger entries whose tracks replay; the resonator’s wording no longer calls an eigenmode non-diffracting and names the chiral subspace',
      keys.every(k => k in d) && /^[0-9a-f]{8}$/.test(d.codeHash) && replay && wired && worded && ids.every(id => DISCOVERIES.find(x => x.id === id))); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
