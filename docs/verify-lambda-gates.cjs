#!/usr/bin/env node
/* ============================================================================
   TWO GATES ADDED AFTER THREE EXTERNAL RESULTS

   Three results were reported to this atlas by its operator as bearing on the CIVP chain.
   NONE of them has been read, checked or reproduced here: they are dated August 2026,
   after the assistant's knowledge cutoff, and the atlas records them as external input
   with that stated. What the atlas owns — and what this file checks — is the machinery
   their consequences demand, and the machinery is exact.

     X_lapse   a global constraint can remove sensitivity to CONSTANT vacuum shifts while
               finite topology-sensitive Casimir contributions survive
               -> TIGHTENS: the composite certificate C_UV is split, and C_top must be
                  discharged on its own

     X_soft    the monopole and dipole components of a supertranslation parameter do not
               affect observables to all orders
               -> CORROBORATES: the shape ledger begins at the quadrupole

     X_null    a full kinematical Poisson structure on a null hypersurface, in which the
               Damour constraint has rescaling weight 1 and the spin-2 bracket is NOT
               ultralocal
               -> TIGHTENS and REDIRECTS: a named current for the missing vertical, and a
                  no-go against factorising the residual trace over rays

   Run: node docs/verify-lambda-gates.cjs
   ========================================================================= */

let pass = 0, fail = 0;
const ok = (t, c, d) => { c ? pass++ : fail++;
  console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); };

(async () => {
const { pathToFileURL } = require('node:url');
const { join } = require('node:path');
const X = await import(pathToFileURL(join(__dirname, '..', 'core/atlas/extracted.mjs')).href);

console.log('\nΛ GATES — what a vacuum-cancellation mechanism does NOT establish\n');

/* ── 1 · the split ────────────────────────────────────────────────────────── */
{
  const ids = X.CIVP_CERTIFICATES.map(c => c.id);
  ok('the composite certificate is split: C_UV claims only convexity and a unique crossing, and the topological half is C_top',
    ids.length === 6 && ids.includes('C_UV') && ids.includes('C_top')
    && !/topology/i.test(X.CIVP_CERTIFICATES.find(c => c.id === 'C_UV').title),
    `${ids.length} certificates: ${ids.join(', ')}`);

  const five = { C_X: 1, C_win: 1, C_U: 1, C_E: 1, C_UV: 1 };
  const six = { ...five, C_top: 1 };
  ok('and holding the old five no longer determines a unique capacity — the conclusion needs both halves',
    X.civpClosure(five).conclusions['q_* unique'] === false
    && X.civpClosure(six).conclusions['q_* unique'] === true,
    'q_* unique requires C_UV AND C_top; before the split, C_UV alone carried it');

  ok('and the closure stays irreducible: removing any single certificate still costs exactly one conclusion, never zero and never two',
    (() => { const n0 = Object.values(X.civpClosure(six, 292).conclusions).filter(Boolean).length;
      if (n0 !== 4) return false;
      for (const k of Object.keys(six)) { const cut = { ...six }; delete cut[k];
        if (n0 - Object.values(X.civpClosure(cut, 292).conclusions).filter(Boolean).length !== 1) return false; }
      return true; })(),
    'six certificates, four conclusions, each removal costing exactly one');
}

/* ── 2 · the decomposition is the physics ─────────────────────────────────── */
{
  const c = X.civpCasimirDecompose([3, 3, 3, 3, 3, 3]);
  ok('a CONSTANT deformation of ln(ζ_∂^q T_q) is annihilated exactly — this, and only this, is what ∂_ρvac Λ_eff = 0 establishes',
    c.is_pure_constant && c.linear === 0 && c.sup_abs_residual === 0
    && c.sup_abs_delta_residual === 0 && c.sup_abs_delta2_residual === 0,
    `constant 3 decomposes to b = ${c.linear}, residual ${c.sup_abs_residual} — zero, not small`);

  const a = X.civpCasimirDecompose([1, 2, 3, 4, 5, 6]);
  ok('the LINEAR term is ln ζ_∂ itself, and it is invisible to the second difference while moving the crossing — so a mechanism that protects the shape can still lose the sector',
    a.is_affine && Math.abs(a.linear - 1) < 1e-12 && a.sup_abs_delta2_residual < 1e-12,
    `θ_q = q gives ln ζ_∂ = ${a.linear.toFixed(12)} with Δ²residual ${a.sup_abs_delta2_residual.toExponential(1)}`);

  const r = X.civpCasimirDecompose([0, 0.1, 0.05, 0.3, 0.12, 0.44]);
  ok('and a topology-sensitive remainder survives BOTH differences, which is exactly the piece the external result says outlives the cancellation',
    r.sup_abs_delta_residual > 1e-3 && r.sup_abs_delta2_residual > 1e-3 && !r.is_affine,
    `sup|Δr| = ${r.sup_abs_delta_residual.toFixed(5)}, sup|Δ²r| = ${r.sup_abs_delta2_residual.toFixed(5)} — neither difference kills it`);

  ok('the split is exact arithmetic, not a fit: reassembling constant + linear + residual returns the input to machine precision',
    (() => { const t = [0.4, -1.2, 3.3, 0.7, 2.1, -0.6, 1.9];
      const D = X.civpCasimirDecompose(t, 1);
      let w = 0; for (let i = 0; i < t.length; i++)
        w = Math.max(w, Math.abs(D.constant + D.linear * (1 + i) + D.residual[i] - t[i]));
      return w < 1e-14; })(),
    'seven sectors reassembled to better than 1e-14');
}

/* ── 3 · the gate ─────────────────────────────────────────────────────────── */
{
  const I = []; for (let q = 1; q <= 40; q++) I.push(Math.exp(-0.02 * (q - 14) ** 2) * Math.pow(q, 1.5));
  const sel = X.civpSelect(I, 1);
  ok('the test selector has a unique crossing and strict convexity, so there is something to protect',
    sel.q_star !== null && sel.strictly_convex && sel.m_star > 0 && sel.c_star > 0,
    `q★ = ${sel.q_star} · location margin m★ = ${sel.m_star.toFixed(6)} · curvature margin c★ = ${sel.c_star.toFixed(6)}`);

  const g0 = X.civpCasimirGate(sel, Array.from({ length: 40 }, () => 7.3), 1);
  ok('a constant vacuum shift passes the gate and moves the crossing by nothing',
    g0.passes === true && g0.location_shift_bound < 1e-12,
    `location shift bound ${g0.location_shift_bound.toExponential(2)} against a margin of ${sel.m_star.toFixed(6)}`);

  const g2 = X.civpCasimirGate(sel, Array.from({ length: 40 }, (_, i) => 0.4 * Math.cos(i * 0.9)), 1);
  ok('AND A REAL TOPOLOGICAL REMAINDER IS REFUSED — the adjacent-sector condition Z_{q+1}/Z_q = 1 does not survive it',
    g2.passes === false && g2.adjacent_sector_condition_survives === false,
    `${g2.verdict}`);

  ok('and the envelope reports the constant insensitivity BESIDE a failing verdict, so the one can never be read as discharging the other',
    g2.constant_is_annihilated === true && g2.passes === false
    && /does not pass this gate on its own/.test(g2.firewall),
    'constant_is_annihilated = true and passes = false in the same object — which is precisely the situation the external result warns about');

  ok('the gate refuses to answer at all when there is no unique selection, rather than returning a pass by default',
    X.civpCasimirGate({ q_star: null, m_star: null, c_star: null }, [1, 2, 3]).applicable === false,
    'no unique crossing → applicable: false, and no verdict is manufactured');
}

/* ── 4 · the residual trace does not factorise ────────────────────────────── */
{
  const d = X.civpUltralocalDefect([[0.3, 0.7], [-0.4, 0.2]]);
  ok('for two rays the failure of T_q = ∏ T_i is EXACTLY −K₁₂K₂₁, so the no-go is an identity rather than an estimate',
    d.two_ray_identity_residual < 1e-15,
    `det(I+K) = ${d.determinant.toFixed(12)}, ∏(1+K_ii) = ${d.product.toFixed(12)}, difference ${d.defect.toFixed(12)} = −K₁₂K₂₁ to ${d.two_ray_identity_residual.toExponential(1)}`);

  const diag = X.civpUltralocalDefect([[0.3, 0, 0], [0, 0.5, 0], [0, 0, -0.2]]);
  ok('and it factorises exactly when the bilocal transport vanishes — the condition is on the kernel, not on the size of anything',
    diag.factorises === true && diag.defect === 0 && diag.is_ultralocal === true,
    'a diagonal ray coupling gives a defect of exactly 0');

  const bi = X.civpUltralocalDefect([[0.1, 0.2, 0, 0.05], [0.15, 0.1, 0.3, 0], [0, 0.25, 0.1, 0.2], [0.05, 0, 0.1, 0.1]]);
  ok('and a four-ray bilocal coupling breaks it by a finite amount, so the product form is not a harmless simplification',
    bi.factorises === false && bi.relative_defect > 0.01,
    `relative defect ${(100 * bi.relative_defect).toFixed(2)}% with an off-diagonal supremum of ${bi.off_diagonal_sup}`);

  ok('the determinant is computed with pivoting and agrees with the closed form on a matrix where both are available',
    (() => { const K = [[0.2, 0.4], [0.1, 0.3]];
      const r = X.civpUltralocalDefect(K);
      const exact = (1 + K[0][0]) * (1 + K[1][1]) - K[0][1] * K[1][0];
      return Math.abs(r.determinant - exact) < 1e-15; })(),
    'det(I+K) by elimination equals (1+K₁₁)(1+K₂₂) − K₁₂K₂₁ to 1e-15');
}

/* ── 5 · the shape ledger ─────────────────────────────────────────────────── */
{
  const sh = X.civpShapeQuotient(12);
  ok('the shape kernel is PROVED here: the Hessian norm ½(ℓ−1)ℓ(ℓ+1)(ℓ+2) vanishes at ℓ = 0 and ℓ = 1 and nowhere else',
    sh.kernel_is_exactly_l01 && X.civpShapeNorm(0) === 0 && X.civpShapeNorm(1) === 0
    && [2, 3, 4, 9, 12].every(l => X.civpShapeNorm(l) > 0),
    `norms: ℓ=0 → 0, ℓ=1 → 0, ℓ=2 → ${X.civpShapeNorm(2)}, ℓ=3 → ${X.civpShapeNorm(3)}`);

  ok('and the physical ledger now begins at the quadrupole, with the attribution carried rather than absorbed',
    sh.physical_sector_starts_at_l === 2
    && sh.monopole_dipole_are_observable_shape_modes === false
    && /external input/.test(sh.caveat),
    `Q_shape^physical = Q_{ℓ≥2} · dim = ${sh.shape_dimension} up to ℓ_max = 12 · the caveat still says which half is proved and which is attributed`);
}

/* ── 6 · provenance is not optional ───────────────────────────────────────── */
{
  ok('all three external results are recorded as UNVERIFIED by this atlas, each with what it binds and what follows',
    X.CIVP_EXTERNAL.length === 3
    && X.CIVP_EXTERNAL.every(x => x.verified_here === false && x.bears_on && x.consequence && x.cite),
    X.CIVP_EXTERNAL.map(x => `${x.id} (${x.effect.split(' ')[0]})`).join(' · '));

  ok('two of them tighten the closure and one corroborates a quotient the atlas already computed — the atlas does not claim the corroboration as its own derivation',
    X.CIVP_EXTERNAL.filter(x => x.effect.startsWith('TIGHTENS')).length === 2
    && X.CIVP_EXTERNAL.filter(x => x.effect.startsWith('CORROBORATES')).length === 1,
    'a result that agrees with you is still someone else’s result');

  ok('and the null phase space is recorded with its three sectors, its two constraint weights, and the fact that the source leaves the joint algebra uncomputed',
    X.CIVP_NULL_PHASE.sectors.length === 3
    && X.CIVP_NULL_PHASE.constraints.find(c => c.symbol === 'D_A').rescaling_weight === 1
    && X.CIVP_NULL_PHASE.constraints.find(c => c.symbol === 'R').rescaling_weight === 2
    && X.CIVP_NULL_PHASE.ultralocal === false
    && X.CIVP_NULL_PHASE.still_open.length > 40,
    `Damour weight 1 · Raychaudhuri weight 2 · Carroll boosts pure gauge · target ${X.CIVP_NULL_PHASE.vertical_target}`);
}

console.log(`\n${fail === 0 ? '✔' : '✗'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
