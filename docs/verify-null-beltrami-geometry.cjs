#!/usr/bin/env node
'use strict';
/* ══ NULL BELTRAMI GEOMETRY ON THE ROUND S³ (v4.373) ══════════════════════════════════════════════════════════════
 * Preece & Batenin, "Null Beltrami geometry on the round three-sphere: global classification, nodal-link dynamics,
 * and a local twistor nonlinear-graviton sector" (manuscript, 7 Oct 2026) — every statement that can be computed,
 * computed on the atlas's own kernels (core/atlas/extracted.mjs):
 *   1. the classification: p(z)(X₂+iX₃) is a null curl eigenfield with λ = m+2 for any roots of p; its Poynting field
 *      is geodesic, shear-free, twist 1; the CR identity ‖X̄f‖² = 4m‖f‖² with X f = 0
 *   2. the zeros: m Hopf fibres counted with multiplicity, the phase winding μ_j round each, |p| = ∏|ℓ_j|^μ_j, and the
 *      binary form factored back to its roots (including a root at ∞)
 *   3. nullity is the hypothesis: a non-null eigenfield with the same λ shears for m ≥ 1 and cannot for m = 0
 *   4. Bateman: |α|²+|β|² = 1, G = ∇α×∇β in closed form and never zero, F_M null Maxwell, Ψ_t⁻¹ exact, the circles
 *      (centre, radius √(1+|w|²+t²), plane), the Gauss linking +1 of every pair at several t, the root at ∞ as the z-axis
 *   5. the twistor sector: dim H¹(U,O(2))_m = (m+1)(m−3) by Čech enumeration and by Riemann–Roch, 0 for m ≤ 3; the
 *      Hamiltonian time-ε map has Jacobian 1; the Laurent splitting reproduces the gluing jump; lines meet iff null
 *   6. Kerr–Schild: K₁ + iK₂ = 48M²/(r − ia cos θ)⁶ in closed form, Schwarzschild 48M²/r⁶, never zero; the KS
 *      congruence null, geodesic, expanding at r/Σ; and θ₁∧dθ₁ = 2 vol
 *   7. the Unified Atlas addendum: four open blocks get evidence with passing checks, their tiers unchanged
 *   8. wired: declared, routed, drawn, controls, API, relations, the FBS3R tower, ledger entries whose tracks replay
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { NBG_PRESETS: PR, nbgCheck, nbgCR, nbgWinding, nbgZeroCensus, nbgExpand, nbgFactor, nbgBatemanCheck, nbgBateman, nbgCirclePts, nbgGaussLink, nbgPsiInv, nbgFibre, nbgTwistorDim, nbgFlowJacobian,
    nbgSplit, nbgDeformedLine, nbgLine, nbgHam, nbgLinesMeet, nbgKerrInv, nbgKerrCheck, nbgContact, nbgIsotopy, UNIFY_MECHANISMS, unifyManuscript, DISCOVERIES, discoveryTrack, trackRun } = K;
  /* 1 */
  { const rows = Object.entries(PR).map(([k, p]) => [k, nbgCheck(p.roots, { samples: 8 })]);
    const good = rows.every(([, c]) => Math.abs(c.kappa - (c.m + 2)) < 1e-7 && c.eigResidual < 1e-8 && c.divResidual < 1e-8 && c.nullDot < 1e-12 && c.normDiff < 1e-12 && c.geodesic < 1e-9 && c.shear < 1e-9 && Math.abs(c.twist - 1) < 1e-8 && c.divVIdentity < 1e-8);
    const cr = ['two', 'trefoil', 'double'].map(k => nbgCR(PR[k].roots, 24)), crOk = cr.every(c => c.cr < 1e-15 && Math.abs(c.ratio / (4 * c.m) - 1) < 2e-3 && c.hopfWeight < 1e-15);
    ok('the classification, converse direction: p(z)(X₂+iX₃) has curl (m+2)F, zero divergence, F·F = 0, and a geodesic shear-free Poynting field of twist 1 (the Hopf/Reeb field) — six root sets, m = 0 … 5; X f = 0, X₁f = imf and ‖X̄f‖² = 4m‖f‖² by quadrature',
      good && crOk, rows.map(([k, c]) => `${k}: κ=${c.kappa.toFixed(9)}`).join(' · ') + ' · ‖X̄f‖²/‖f‖² = ' + cr.map(c => c.ratio.toFixed(4)).join(', ')); }
  /* 2 */
  { const wind = Object.values(PR).every(p => p.roots.every((r, j) => Math.abs(nbgWinding(p.roots, j) - r.mu) < 1e-9)), z = nbgZeroCensus(PR.five.roots, 300);
    const back = ['double', 'infinity', 'five'].every(k => { const R = PR[k].roots, F = nbgFactor(nbgExpand(R)); return F.length === R.length && R.every(r => F.some(f => f.mu === r.mu && (r.w ? f.w && Math.hypot(f.w[0] - r.w[0], f.w[1] - r.w[1]) < 1e-6 : !f.w))); });
    ok('the zero set is the union of the Hopf fibres of the linear factors: the phase winds μ_j times round fibre j (μ = 2 included), |p| = ∏|ℓ_j|^μ_j everywhere, and the binary form factors back to its roots and multiplicities (a root at ∞ included)', wind && z.productResidual < 1e-12 && back, `|p| residual ${z.productResidual.toExponential(1)}`); }
  /* 3 */
  { const a = nbgCheck(PR.two.roots, { samples: 8, eps: 0.5 }), b = nbgCheck(PR.trefoil.roots, { samples: 8, eps: 0.3 }), h = nbgCheck(PR.hopfion.roots, { samples: 8, eps: 0.5 });
    ok('nullity is the hypothesis that matters: adding an SO(4)-rotated null mode keeps λ = m+2 and div = 0 but breaks F·F = 0, and the Poynting field then shears and bends (m ≥ 1); at m = 0 every eigenfield is left-invariant — Killing — and cannot shear',
      Math.abs(a.kappa - 4) < 1e-7 && a.divResidual < 1e-8 && a.normDiff > 0.1 && a.shear > 0.1 && a.geodesic > 0.1 && Math.abs(b.kappa - 5) < 1e-7 && b.shear > 0.05 && h.normDiff > 0.1 && h.shear < 1e-9 && h.geodesic < 1e-9,
      `m=2: shear ${a.shear.toFixed(3)}, ∇_VV ${a.geodesic.toFixed(3)} · m=3: shear ${b.shear.toFixed(3)} · m=0: shear ${h.shear.toExponential(1)}`); }
  /* 4 */
  { const B = nbgBatemanCheck(PR.trefoil.roots, { samples: 10 }), B5 = [0, 1.7, -3].map(t => nbgBatemanCheck(PR.five.roots, { samples: 2, t, linkN: 120 }));
    let axis = 0; for (let i = 1; i < 12; i++) { const X = nbgPsiInv(0.7, nbgFibre({ w: null }, 0.5 * i)); axis = Math.max(axis, Math.hypot(X[0], X[1])); }
    let iso = 0; for (const X of [[0.3, -0.2, 0.5], [1.5, 0.4, -0.7]]) { const Y = nbgIsotopy(1.3, X), a = nbgBateman(1.3, Y), b = nbgBateman(0, X); iso = Math.max(iso, Math.hypot(a.a[0] - b.a[0], a.a[1] - b.a[1], a.b[0] - b.b[0], a.b[1] - b.b[1])); }
    ok('Bateman: |α|²+|β|² = 1, G = ∇α×∇β = 4D⁻³(q²−u², −i(q²+u²), 2qu) never zero, F_M = p(α,β)G a null Maxwell field (div 0, ∂_tF = −i curl F), Ψ_t⁻¹∘Ψ_t = id and Ψ_t∘Φ_t = Ψ₀',
      B.s3Identity < 1e-14 && B.gResidual < 1e-8 && B.gMin > 1e-3 && B.divergence < 1e-7 && B.evolution < 1e-7 && B.evolutionSign === -1 && B.nullity < 1e-13 && B.inverse < 1e-13 && iso < 1e-12,
      `G ${B.gResidual.toExponential(1)} · div ${B.divergence.toExponential(1)} · ∂_t ${B.evolution.toExponential(1)} · isotopy ${iso.toExponential(1)}`);
    ok('the nodal circles are exact — centre (u_k, v_k, 0), radius √(1+|w_k|²+t²), plane z = v_k x − u_k y — and every pair links +1 at t = 0.8 (3 pairs) and at t = 0, 1.7, −3 (10 pairs); a root at ∞ is the z-axis, through infinity',
      B.circleResidual < 1e-12 && B.planeResidual < 1e-12 && B.links.length === 3 && B.links.every(v => Math.abs(v - 1) < 0.005) && B5.every(b => b.links.length === 10 && b.links.every(v => Math.abs(v - 1) < 0.005) && b.circleResidual < 1e-12) && axis < 1e-12,
      'Lk = ' + B.links.map(v => v.toFixed(4)).join(', ') + ' · five: ' + B5.map(b => Math.min(...b.links).toFixed(4) + '…' + Math.max(...b.links).toFixed(4)).join(' / ')); }
  /* 5 */
  { const D = Array.from({ length: 13 }, (_, m) => nbgTwistorDim(m)), dimOk = D.every(d => d.dim === d.closed && d.base === d.baseRR && d.dim === (d.m >= 4 ? (d.m + 1) * (d.m - 3) : 0));
    const H = { k: [[0, 0], [0, 0], [1, 0], [0, 0], [0.3, 0.2]], s: 1 }, J = nbgFlowJacobian(H, [0.6, 0.8], [0.3, 0.1], [-0.2, 0.4], 0.3), H6 = { k: [[0, 0], [0.4, -0.1], [0, 0], [1, 0], [0, 0], [0, 0], [0.2, 0]], s: 2 }, J6 = nbgFlowJacobian(H6, [-0.3, 0.95], [0.2, -0.3], [0.1, 0.25], 0.4);
    const x = [[[0.1, 0], [0.2, 0.1]], [[0.3, -0.2], [0.05, 0]]], S = nbgSplit(H, x); let jump = 0;
    for (let i = 0; i < 24; i++) { const ph = 2 * Math.PI * i / 24, lam = [Math.cos(ph), Math.sin(ph)], A = nbgDeformedLine(H, x, 0.01, lam, 'A', S), Bd = nbgDeformedLine(H, x, 0.01, lam, 'B', S), L = nbgLine(x, lam), X = nbgHam(H, lam, L.c, L.w); jump = Math.max(jump, Math.hypot(A.c[0] - Bd.c[0] - 0.01 * X.dc[0], A.c[1] - Bd.c[1] - 0.01 * X.dc[1], A.w[0] - Bd.w[0] - 0.01 * X.dw[0], A.w[1] - Bd.w[1] - 0.01 * X.dw[1])); }
    const y = d => x.map((r, i) => r.map((z, j) => [z[0] + d[i][j][0], z[1] + d[i][j][1]])), mn = nbgLinesMeet(x, y([[[1, 0], [2, 0]], [[0.5, 0], [1, 0]]])), mf = nbgLinesMeet(x, y([[[1, 0.2], [0.5, 0]], [[2, 0], [1, 0.2]]]));
    ok('the twistor sector: dim H¹(U,O(2))_m = (m+1)(m−3) for m ≥ 4 and 0 below, by Čech Laurent enumeration and by Riemann–Roch (m = 0 … 12); exp(εX) has holomorphic Jacobian 1 (it preserves dc∧dw) and conserves ĥ; the Laurent splitting reproduces the jump εX; lines meet iff x − y is null',
      dimOk && J.residual < 1e-8 && J6.residual < 1e-8 && J.hDrift < 1e-9 && jump < 1e-14 && mn.null && mn.gap < 1e-12 && !mf.null && mf.gap > 0.1,
      `dims ${D.map(d => d.dim).join(',')} · det−1 ${J.residual.toExponential(1)}, ${J6.residual.toExponential(1)} · jump ${jump.toExponential(1)}`); }
  /* 6 */
  { const S0 = nbgKerrInv(1, 0, 3, 0.3); let minRatio = Infinity, closed = 0;
    for (const a of [0.3, 0.7, 0.99]) for (let i = 1; i <= 20; i++) for (let j = 0; j <= 20; j++) { const r = 0.1 * i, c = -1 + 0.1 * j, Kv = nbgKerrInv(1, a, r, c), Sg = r * r + a * a * c * c; minRatio = Math.min(minRatio, Math.hypot(Kv.K1, Kv.K2) * Sg ** 3 / 48); closed = Math.max(closed, Kv.closedResidual); }
    const C = [0.3, 0.9].map(a => nbgKerrCheck(a, 10)), T = nbgContact();
    ok('Kerr–Schild: K₁ + iK₂ = 48M²/(r − ia cos θ)⁶ against the real expansions, Schwarzschild 48M²/r⁶, |K₁ + iK₂|Σ³/48M² = 1 everywhere sampled (never zero — not VSI); the Kerr–Schild l is null, geodesic and expands at r/Σ; θ₁∧dθ₁ = 2 vol with [ξ₂, ξ₃] = −2ξ₁',
      Math.abs(S0.K1 - 48 / 729) < 1e-15 && S0.K2 === 0 && closed < 1e-12 && Math.abs(minRatio - 1) < 1e-9 && C.every(c => c.nullity < 1e-12 && c.geodesic < 1e-8 && c.expansionVsRhoResidual < 1e-8) && T.bracketResidual === 0 && T.thetaWedgeDTheta === 2,
      `closed ${closed.toExponential(1)} · min ${minRatio.toFixed(12)} · l·∂l ${C.map(c => c.geodesic.toExponential(1)).join(', ')}`); }
  /* 7 */
  { const M = unifyManuscript(), tiers = Object.fromEntries(['M06', 'M09', 'M11', 'M14'].map(id => [id, UNIFY_MECHANISMS.find(m => m.id === id).tier]));
    ok('the Unified Atlas addendum: M06, M09, M11, M14 each get the manuscript’s evidence with a passing live check — and keep their tiers (RESEARCH, MIXED, RESEARCH, RESEARCH) until review; the registry still holds 58 mechanisms',
      M.length === 4 && M.every(r => r.check && r.check.pass) && tiers.M06 === 'RESEARCH' && tiers.M09 === 'MIXED' && tiers.M11 === 'RESEARCH' && tiers.M14 === 'RESEARCH' && UNIFY_MECHANISMS.length === 58, M.map(r => `${r.id} ${r.check.text}`).join(' | ')); }
  /* 8 */
  { const wired = /const nbgGroup=new THREE\.Group\(\); nbgGroup\.visible=false; s3Group\.add\(nbgGroup\);/.test(SRC) && /nbgGroup\.visible = \(v==='nbg'\);/.test(SRC) && /\} else if\(state\.s3view==='nbg'\)\{\n\s*fbsAnimT\+=labDt; updateNbg\(labDt\);/.test(SRC)
      && /else if\(V==='nbg'\) body = nbgPanelHTML\(\);/.test(SRC) && /if\(V==='nbg'\)\{ nbgBind\(ctl\); \}/.test(SRC) && /id:'nbg', world:'s3', lab:'nbg',/.test(SRC) && /\['nbgAtlas','nbg',nbgGroup,/.test(SRC) && /\{id:'nbg', category:'geom'/.test(SRC)
      && /hccGo\(\{worldId:'s3',labId:'nbg'\}\)/.test(SRC) && /\['nbg','gmode','exact',/.test(SRC) && /\['nbg','unify','exact',/.test(SRC) && /fbs3r_null_beltrami\.json/.test(SRC) && /hccInstrSet\('nbg',nbgInstrPaint\)/.test(SRC);
    const tower = /function fbsS3Nbg\(slot,k\)/.test(SRC) && /fbsS3Nbg\(s,p\.exact&&typeof p\.k==='number'\?p\.k:0\)/.test(SRC) && /id="fbsNbg"/.test(SRC) && /fbsS3NbgReadout\(\)\+fbsS3ReadoutHTML\(\)/.test(SRC) && /Addendum · Preece & Batenin \(2026\)/.test(SRC);
    const ids = ['nullBeltramiClassified', 'batemanLinksExact', 'twistorO2Threshold', 'kerrSchildNotVSI']; let replay = true, why = [];
    for (const id of ids) { const t = discoveryTrack(id), r = t ? trackRun(t) : null; if (!(r && r.ok)) { replay = false; why.push(id); } }
    ok('wired: declared in the catalogue, routed, drawn with its instrument, four stations with controls and export, API contract, relations to the resonator, the Unified Atlas, Hopf, contact and twistor labs; the FBS3R ladder carries the null Beltrami tower; the Unified Atlas shows the addendum; four ledger entries whose tracks replay',
      wired && tower && replay && ids.every(id => DISCOVERIES.find(x => x.id === id && x.verifier === 'docs/verify-null-beltrami-geometry.cjs')), why.length ? 'track failed: ' + why.join(', ') : ''); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
