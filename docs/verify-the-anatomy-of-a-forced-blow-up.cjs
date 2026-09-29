#!/usr/bin/env node
'use strict';
/* ══ THE ANATOMY OF A FORCED BLOW-UP ═══════════════════════════════════════════════════════
 * The published exponents of the September 2026 forced Navier–Stokes construction (A = ½ + h, D = ½ − h,
 * 0 < h < 1/100), put through the classical regularity theory. Checked:
 *   1. the illustrative core is a real incompressible field in the construction's variables: div u = 0 to
 *      rounding, u_θ = q^{−A}√(2X)F, u_z = q^{−A}U, r·u_r = X·v₀
 *   2. the exponents are measured, not only asserted: sup|u|, the circulation, the core energy and ‖u‖_{L³}
 *      scale on the core as τ^{−½−h}, τ^{−h}, τ^{½−3h}, τ^{−4h/3} (h = 0.1, τ from 10⁻¹⁰ to 10⁻¹²)
 *   3. the window: the theorems leave exactly 0 < h < 1/6; three fail together at h = 0; the construction's
 *      h = 1/100 satisfies all seven; above 1/6 the energy inequality fails
 *   4. one exponent pays for everything, and the force must pay it: Γ, Re, z/r, √τ‖u‖∞ all ∝ τ^{−h}; in the
 *      core frame the swirl spins up as e^{hs} while radius and height are autonomous
 *   5. the family invariant: E‖u‖∞/Γ⁴ is the same at every τ and every h at leading order; the rays of all h
 *      lie in one plane with normal (−4, 1, 1); for h < 0 the full invariant runs away
 *   6. the empirical ladder λₙ of arXiv 2509.14185, and the laboratory wired: declared, routed, drawn, API,
 *      relations, ledger with replaying tracks, lead, honest labels
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { fbExponents, fbCriteria, fbWindow, fbLambda, fbVelocity, fbSimRHS, fbCoreIntegrals, fbFamilyInvariant, FB_H_OPENAI, DISCOVERIES, discoveryTrack, trackRun, DISCOVERY_LEADS } = K;
  const P = { h: 0.1, G0: 3, a: 2, U0: 0.25 };
  { let worst = 0; for (const [tau, r, z] of [[1e-3, 0.02, 0.005], [1e-6, 3e-4, -2e-4], [0.3, 0.5, 0.2]]) { const e = 1e-6 * r, f = (r, z) => fbVelocity(r, z, tau, P), dr = ((r + e) * f(r + e, z).ur - (r - e) * f(r - e, z).ur) / (2 * e) / r, dz = (f(r, z + e).uz - f(r, z - e).uz) / (2 * e); worst = Math.max(worst, Math.abs(dr + dz) / Math.abs(dr)); }
    const u = fbVelocity(0.03, 0.001, 1e-3, P), q = 1e-3, X = 0.03 * 0.03 / (2 * q), A = 0.6;
    ok('the illustrative core is incompressible and written in the construction\'s variables', worst < 1e-6 && Math.abs(0.03 * u.ur - X * (-P.a)) < 1e-12, `div u / ∂(ru_r) ≤ ${worst.toExponential(1)} · r u_r = X v₀`); }
  { const a = fbCoreIntegrals(1e-10, P), b = fbCoreIntegrals(1e-12, P), sl = k => Math.log(b[k] / a[k]) / Math.log(1e-2), e = fbExponents(P.h);
    const got = { uMax: sl('uMax'), circ: sl('circ'), E: sl('E'), L3: sl('L3') }, err = Math.max(Math.abs(got.uMax - e.uMax), Math.abs(got.circ - e.circ), Math.abs(got.E - e.energy), Math.abs(got.L3 - e.L3));
    ok('the exponents are measured on the core: ‖u‖∞ ∝ τ^{−½−h}, Γ ∝ τ^{−h}, E ∝ τ^{½−3h}, ‖u‖_{L³} ∝ τ^{−4h/3}', err < 0.01, Object.entries(got).map(([k, v]) => `${k} ${v.toFixed(4)}`).join(' · ') + ` · worst ${err.toExponential(1)}`); }
  { const w = fbWindow(1200), at0 = fbCriteria(0).filter(c => !c.force && !c.ok).map(c => c.id), open = fbCriteria(FB_H_OPENAI).filter(c => !c.force && c.ok).length, above = fbCriteria(0.2).filter(c => !c.force && !c.ok).map(c => c.id);
    ok('the window every theorem leaves is exactly 0 < h < 1/6; three theorems fail together at h = 0; the construction satisfies all seven', Math.abs(w.lo) < 1e-9 && Math.abs(w.hi - 1 / 6) < 1e-9 && at0.join() === 'ess,typeII,leray' && open === 7 && above.join() === 'energy,diss' && FB_H_OPENAI === 0.01,
      `window (${w.lo.toExponential(1)}, ${w.hi.toFixed(9)}) · at h = 0 fail: ${at0.join(', ')} · above 1/6: ${above.join(', ')}`); }
  { const e = fbExponents(0.037), same = [e.circ, e.reynolds, e.aspect, e.typeI].every(x => Math.abs(x + 0.037) < 1e-15), s1 = fbSimRHS(1.3, 0.4, 0, P), s2 = fbSimRHS(1.3, 0.4, 5, P);
    ok('one exponent pays for everything — Γ, Re, z/r, √τ‖u‖∞ all ∝ τ^{−h} — and in the core frame only the swirl is not autonomous: it spins up as e^{hs}', same && s1.drho === s2.drho && s1.dzeta === s2.dzeta && Math.abs(s2.dtheta / s1.dtheta - Math.exp(0.5)) < 1e-12 && fbCriteria(0.05).find(c => c.id === 'circ').force === true,
      `spin-up over Δs = 5 at h = 0.1: ${(s2.dtheta / s1.dtheta).toFixed(6)} = e^{0.5}`); }
  { const vals = []; for (const h of [0.004, 0.01, 0.1, 0.16]) for (const t of [1e-2, 1e-6, 1e-12]) vals.push(fbFamilyInvariant(t, { ...P, h }, true)); const spread = (Math.max(...vals) - Math.min(...vals)) / vals[0];
    const ray = h => { const e = fbExponents(h); return [-e.circ, -e.energy, -e.uMax]; }, dot = v => -4 * v[0] + v[1] + v[2], planar = [-0.05, 0, 0.01, 0.1, 0.3].every(h => Math.abs(dot(ray(h))) < 1e-15);
    const neg = [1e-4, 1e-10].map(t => fbFamilyInvariant(t, { ...P, h: -0.03 }));
    ok('the family invariant E‖u‖∞/Γ⁴ is one number for every τ and every h, all rays lie in the plane with normal (−4, 1, 1), and for h < 0 it runs away', spread < 1e-9 && planar && neg[1] > 2 * neg[0] && Math.abs(vals[0] - 1.7276467) < 1e-6,
      `${vals[0].toFixed(7)} · spread ${spread.toExponential(1)} over 12 (h, τ) · h = −0.03: ${neg.map(x => x.toFixed(2)).join(' → ')}`); }
  { const l0 = fbLambda(0, 'bous'), l3 = fbLambda(3, 'bous'), i0 = fbLambda(0, 'ipm'), dec = [0, 1, 2, 3, 4, 5].every(n => fbLambda(n + 1, 'bous') < fbLambda(n, 'bous') && fbLambda(n + 1, 'ipm') < fbLambda(n, 'ipm'));
    const t1 = trackRun(discoveryTrack('blowupWindow')), t2 = trackRun(discoveryTrack('blowupInvariant')), led = ['blowupWindow', 'blowupInvariant'].every(id => DISCOVERIES.some(d => d.id === id && d.verifier === 'docs/verify-the-anatomy-of-a-forced-blow-up.cjs'));
    ok('the λ ladder of arXiv 2509.14185, and the laboratory wired: declared, routed, drawn, in the API and the relations, in the ledger with replaying tracks, with its lead and honest labels',
      Math.abs(l0 - (1 + 1 / 1.0863)) < 1e-12 && l3 > 1 && Math.abs(i0 - 1 / 0.9723) < 1e-12 && dec && t1.ok && t2.ok && led && DISCOVERY_LEADS.some(x => x.id === 'blowup-profile')
      && /\{id:'nsblow', category:'dyn', domain:'quantum', cluster:'dynamics', predictionClass:'exact',/.test(SRC) && /nsbGroup\.visible = \(v==='nsblow'\);/.test(SRC) && /state\.s3view==='nsblow'\)\{\n\s*fbsAnimT\+=labDt; updateNsb\(labDt\);/.test(SRC)
      && /id:'nsblow', world:'s3', lab:'nsblow',/.test(SRC) && /\['nsblow','nsflow','contrast'/.test(SRC) && /\['nsbAtlas','nsblow',nsbGroup,/.test(SRC) && /ILLUSTRATIVE Burgers–Oseen profile/.test(SRC) && /The Clay Institute has not accepted the Navier–Stokes claim/.test(SRC),
      `λ₀ Boussinesq ${l0.toFixed(4)}, λ₃ ${l3.toFixed(4)}, IPM λ₀ ${i0.toFixed(4)} · tracks ${t1.ok && t2.ok ? 'replay' : 'FAIL'}`); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
