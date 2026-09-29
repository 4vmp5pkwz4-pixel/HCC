#!/usr/bin/env node
'use strict';
/* ══ VORTEX STRETCHING IS A VANDERMONDE DETERMINANT — AND THE PARITY THE LOCK NEEDED IS THE WRONG ONE ═════════
 * Found in the audit of the S³ programme's corpus (v4.342) and measured on the atlas's own kernels. Checked:
 *   1. ∫Def u(ω,ω) = −Σ_{a<b<c}(μa−μb)(μa−μc)(μb−μc)∫u_a·(u_b×u_c) for three, four and five curl levels, on the
 *      exact Hopf quadrature with the atlas's orientation
 *   2. one and two levels cannot stretch; three levels whose k add to an odd number cannot either (parity)
 *   3. the rotor identity curl Q(u,v) = ½(μ_v − μ_u)[u,v] holds pointwise — no curvature term
 *   4. the 𝒥-parity: curl 𝒥_* = −𝒥_* curl, yet the stretching of a 𝒥-symmetric field is 𝒥-EVEN (the antisymmetric
 *      part is the odd one) — so route P₁ of the terminal lock fails as stated, and the lab says so
 *   5. the two other locks the audit brought down: the shell commutator grows ∝ k + 2 (no √(k_αk_β) bound), and an
 *      exact triad resonance κ₄ + κ₅ = κ₇ exists (Γ_N = 0) — with the s3lock texts revised accordingly
 *   6. wired: declared, routed, drawn, controls, API, relations, ledger with replaying tracks
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { vdmParts, vdmLaw, FORMULA_CHECKS: FC, s3tcStretchParityField, DISCOVERIES, discoveryTrack, trackRun } = K;
  { const R = [[[1, 1], [1, -1], [2, 1]], [[1, 1], [2, -1], [3, 1]], [[1, 1], [1, -1], [2, 1], [2, -1]], [[1, 1], [1, -1], [2, 1], [2, -1], [3, 1]]].map((L, i) => vdmLaw(vdmParts(L, 3 + 2 * i), 5));
    ok('vortex stretching equals the Vandermonde sum over the triads — three, four and five levels', R.every(r => r.rel < 1e-6 && Math.abs(r.stretch) > 1e-3), R.map(r => `${r.stretch.toExponential(4)} vs ${r.formula.toExponential(4)} (${r.rel.toExponential(1)}, ${r.triads.length} triads)`).join(' · ')); }
  { const one = vdmLaw(vdmParts([[2, 1]], 5), 5), two = vdmLaw(vdmParts([[1, 1], [1, -1]], 11), 5), odd = vdmLaw(vdmParts([[1, 1], [2, 1], [2, -1]], 13), 5), odd2 = vdmLaw(vdmParts([[0, 1], [1, 1], [2, -1]], 17), 5);
    ok('one level cannot stretch, two cannot, and three whose k add to an odd number cannot — the smallest stretching triad is E₁₊ + E₁₋ + E₂', [one, two, odd, odd2].every(r => Math.abs(r.stretch) < 1e-9) && odd.triads.every(t => !t.even),
      `one ${one.stretch.toExponential(1)} · two ${two.stretch.toExponential(1)} · E₁₊E₂₊E₂₋ ${odd.stretch.toExponential(1)} · E₀E₁E₂ ${odd2.stretch.toExponential(1)}`); }
  { const r = FC.F00228.run();
    ok('the rotor identity curl Q(u,v) = ½(μ_v − μ_u)[u,v] holds pointwise, with no curvature term', r.ok, r.text.slice(0, 120)); }
  { const r = s3tcStretchParityField(77, 12);
    ok('𝒥 flips the curl, yet the stretching of a 𝒥-symmetric field is 𝒥-EVEN and only the antisymmetric part is odd — route P₁ fails as stated, and the terminal lock says so',
      r.curlFlip < 1e-6 && r.symEven < 1e-6 && r.symOdd > 0.1 && r.asymOdd < 1e-6 && r.asymEven > 0.1 && /REVISED \(v4\.342\) — MEASURED WRONG/.test(SRC) && /stretch_parity_sym_even:SP\.symEven/.test(SRC) && FC.F04069.run().ok === false,
      `sym: even ${r.symEven.toExponential(1)}, odd ${r.symOdd.toFixed(2)} · asym: odd ${r.asymOdd.toExponential(1)} · curl flip ${r.curlFlip.toExponential(1)}`); }
  { const c = FC.F00233.run(), t = FC.F03574.run();
    ok('the two other locks fall: the shell commutator grows ∝ k + 2 and the exact resonance κ₄ + κ₅ = κ₇ exists — the capacity threshold is relabelled',
      c.ok === false && /exactly proportional to k \+ 2 \(to 1e-8\)/.test(c.text) && t.ok === false && /\(4,5→7\)/.test(t.text) && /REVISED \(v4\.342\): what converges here is the MANUSCRIPT's series/.test(SRC), c.text.slice(0, 110)); }
  { const led = ['vandermondeStretch', 'stretchParityRevised'].every(id => DISCOVERIES.some(d => d.id === id && d.verifier === 'docs/verify-vortex-stretching-is-vandermonde.cjs')), tr = ['vandermondeStretch', 'stretchParityRevised'].every(id => trackRun(discoveryTrack(id)).ok);
    ok('wired: declared, routed, drawn, controls, API, relations, ledger with replaying tracks',
      led && tr && /\{id:'vstretch', category:'dyn', domain:'quantum', cluster:'dynamics'/.test(SRC) && /vdmGroup\.visible = \(v==='vstretch'\);/.test(SRC) && /state\.s3view==='vstretch'\)\{\n\s*fbsAnimT\+=labDt; updateVdm\(labDt\);/.test(SRC)
      && /id:'vstretch', world:'s3', lab:'vstretch',/.test(SRC) && /\['vstretch','nsgal','exact'/.test(SRC) && /\['vdmAtlas','vstretch',vdmGroup,/.test(SRC) && /data-vdml=/.test(SRC), `ledger ${led ? 'ok' : 'MISSING'} · tracks ${tr ? 'replay' : 'FAIL'}`); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
