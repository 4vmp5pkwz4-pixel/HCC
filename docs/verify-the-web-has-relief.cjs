#!/usr/bin/env node
'use strict';
/* ══ THE WEB HAS RELIEF ═══════════════════════════════════════════════════════════════════
 * Every supercluster, wall, cluster and void of the atlas is drawn as a constrained realization of the
 * ΛCDM density field, moved by the Zel'dovich map at the growth its light shows on the atlas clock. This
 * file checks the physics that does it, with the extracted kernels (core/atlas/extracted.mjs):
 *   1. the spectrum: σ₈ is what it was normalised to, the transfer function tends to 1 on large scales
 *      and falls as ln k / k² on small ones, and the non-linear scale σ(R_nl) = 1 is where it says
 *   2. the growth factor solves the linear growth equation D'' + (3/a + E'/E)D' = (3/2)Ω_m D/(a⁵E²) to the
 *      differencing error, grows as a in the matter era, has f(1) ≈ Ω_m^0.55 and the Carroll–Press–Turner
 *      g₀ — and its limit D∞ equals the CLOSED FORM (5/6)Ω_m^{1/3}Ω_Λ^{−1/3} B(5/6, 2/3), derived here:
 *      Λ freezes the web, and it can only ever grow by D∞/D₀ − 1 more than today
 *   3. the realization: Hoffman–Ribak constraints are met to rounding, the unconstrained variance is
 *      Σ P(k)/V within the sampling error, and the deformation tensor's trace is the density exactly
 *   4. the symmetric 3×3 eigenvalues used per galaxy agree with Jacobi rotations
 *   5. NAVIER–STOKES: the Zel'dovich map is the inviscid limit of Burgers (Hopf–Cole, exact): before
 *      shell crossing they coincide; after it Burgers' Lagrangian map jumps at x = 0 from −q_s to q_s with
 *      q_s = t sin q_s — the shock collects exactly the mass the three Zel'dovich streams share. MUTATION:
 *      a thick viscosity smears the jump, caught
 *   6. the clock: D seen is 1 here and now, 0 before the Big Bang, D∞ in the far future, and a structure
 *      at z = 1.8 shows the growth of the time its light left
 *   7. the relief: a supercluster has more of its galaxies in filaments and nodes than a void; at D → 0
 *      every galaxy is in a void-class place; more of it has shell-crossed at D∞ than today
 *   8. wiring: the worker gets every function it runs, the shader reads the log-depth buffer, the layer is on
 *      by default with its control, the cosmic-web laboratory draws the Burgers bridge, and cosmicweb is
 *      related to nsflow
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
/* Lanczos Γ, independent of the page */
const LG = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
const gamma = z => { if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z)); z -= 1; let x = LG[0]; for (let i = 1; i < 9; i++) x += LG[i] / (z + i); const t = z + 7.5; return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x; };

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { LSS_PRIM, LSS_C, lssTransfer, lssSigma, lssNonlinearR, lssGrowth, lssGrowthRaw, lssGrowthRate, LSS_D1, LSS_DINF, lssRealize, lssEig3, burgersHopfCole, burgersShockHalfWidth, lssGrowthSeen, lssStructureSpec, lssRelief, lssReliefCensus } = K;

  /* 1 · the spectrum */
  { const s8 = lssSigma(8), T0 = lssTransfer(1e-5), r1 = 50 * 50 * lssTransfer(50) / Math.log(50), r2 = 100 * 100 * lssTransfer(100) / Math.log(100), Rnl = lssNonlinearR(), sG = lssSigma(Rnl, 'gauss');
    let mono = true; for (let k = 1e-3; k < 50; k *= 1.3) if (lssTransfer(k * 1.3) > lssTransfer(k)) mono = false;
    ok('the spectrum: σ₈ is what it was normalised to, T(k) → 1 on large scales and falls as ln k / k² on small, monotonically, and σ_G(R_nl) = 1 at the non-linear scale',
      Math.abs(s8 - LSS_PRIM.sigma8) < 1e-9 && Math.abs(T0 - 1) < 1e-3 && Math.abs(r1 / r2 - 1) < 0.1 && mono && Math.abs(sG - 1) < 1e-6 && Rnl > 1 && Rnl < 5,
      `σ₈ ${s8.toFixed(6)} · T(1e-5) ${T0.toFixed(5)} · k²T/ln k at 50 and 100: ${r1.toFixed(3)}, ${r2.toFixed(3)} · R_nl ${Rnl.toFixed(3)} Mpc/h`); }

  /* 2 · the growth factor */
  { const C = LSS_C, E = a => Math.sqrt(C.Om / (a * a * a) + C.OL); let worst = 0;
    for (const a of [0.05, 0.2, 0.5, 1, 2, 5]) { const h = 1e-3 * a, D = x => lssGrowthRaw(x), d1 = (D(a + h) - D(a - h)) / (2 * h), d2 = (D(a + h) - 2 * D(a) + D(a - h)) / (h * h), dE = (Math.log(E(a + h)) - Math.log(E(a - h))) / (2 * h),
        res = d2 + (3 / a + dE) * d1 - 1.5 * C.Om / (Math.pow(a, 5) * E(a) * E(a)) * D(a); worst = Math.max(worst, Math.abs(res) / (1.5 * C.Om / (Math.pow(a, 5) * E(a) * E(a)) * D(a))); }
    const early = lssGrowthRaw(1e-3) / 1e-3, f1 = lssGrowthRate(1), g0cpt = 2.5 * C.Om / (Math.pow(C.Om, 4 / 7) - C.OL + (1 + C.Om / 2) * (1 + C.OL / 70));
    const Dinf = (5 / 6) * Math.pow(C.Om, 1 / 3) * Math.pow(C.OL, -1 / 3) * gamma(5 / 6) * gamma(2 / 3) / gamma(1.5), exact = Dinf / LSS_D1;
    ok('the growth factor solves D\'\' + (3/a + E\'/E)D\' = (3/2)Ω_m D/(a⁵E²), grows as a in the matter era, f(1) ≈ Ω_m^0.55, g₀ is Carroll–Press–Turner — and D∞ is the closed form (5/6)Ω_m^{1/3}Ω_Λ^{−1/3}B(5/6,2/3): Λ freezes the web',
      worst < 1e-3 && Math.abs(early - 1) < 1e-4 && Math.abs(f1 / Math.pow(C.Om, 0.55) - 1) < 0.01 && Math.abs(LSS_D1 / g0cpt - 1) < 0.005 && Math.abs(LSS_DINF / exact - 1) < 1e-6,
      `ODE residual ≤ ${worst.toExponential(1)} · D/a early ${early.toFixed(6)} · f(1) ${f1.toFixed(4)} vs ${Math.pow(C.Om, 0.55).toFixed(4)} · g₀ ${LSS_D1.toFixed(4)} vs CPT ${g0cpt.toFixed(4)} · D∞/D₀ ${LSS_DINF.toFixed(6)} = closed form ${exact.toFixed(6)} · D(z=1) ${lssGrowth(0.5).toFixed(4)}`); }

  /* 3 · the realization */
  const G0 = lssRealize({ N: 16, L: 150, seed: 3, Rs: 3 });
  { const N3 = G0.delta.length; let v = 0, tr = 0, sc = 0; for (let i = 0; i < N3; i++) { v += G0.delta[i] ** 2; tr = Math.max(tr, Math.abs(G0.d[0][i] + G0.d[1][i] + G0.d[2][i] - G0.delta[i])); sc = Math.max(sc, Math.abs(G0.delta[i])); } v /= N3;
    /* the expected variance, Σ_k P(k) e^{−k²R_s²}/V over the same grid (Nyquist planes excluded) */
    const N = 16, L = 150, dk = 2 * Math.PI / L, id = i => i <= N / 2 ? i : i - N; let ex = 0;
    for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { if (!(x || y || z) || x === N / 2 || y === N / 2 || z === N / 2) continue; const k = dk * Math.hypot(id(x), id(y), id(z)); ex += K.lssPower(k) * Math.exp(-k * k * 9) / (L * L * L); }
    const G1 = lssRealize({ N: 16, L: 150, seed: 3, Rs: 3, constraints: [{ x: [0, 0, 0], R: 12, nu: 3 }, { x: [40, 0, 0], R: 12, nu: -2 }] }), Gm = lssRealize({ N: 16, L: 150, seed: 3, Rs: 3, constraints: [{ x: [0, 0, 0], R: 12, nu: -3 }] });
    const hit = Math.max(...G1.constraints.map(c => Math.abs(c.got - c.target) / c.sigma));
    ok('the realization: Hoffman–Ribak constraints met to rounding (a +3σ peak and a −2σ trough), the variance is Σ P(k)/V within sampling, tr ∂∂φ = δ exactly — and the sign of a constraint is the sign it gets (mutation)',
      hit < 1e-9 && Math.abs(v / ex - 1) < 0.15 && tr < 1e-4 * sc && Gm.constraints[0].got < 0 && G1.constraints[0].got > 0,
      `constraint error ≤ ${hit.toExponential(1)}σ · ⟨δ²⟩ ${v.toFixed(4)} vs ${ex.toFixed(4)} · |tr d − δ| ≤ ${tr.toExponential(1)} · peak ${G1.constraints[0].got.toFixed(3)}, flipped ${Gm.constraints[0].got.toFixed(3)}`); }

  /* 4 · eigenvalues */
  { let seed = 11; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; }; let worst = 0;
    for (let t = 0; t < 200; t++) { const a = r(), b = r(), c = r(), d = r(), e = r(), f = r(), M = [[a, d, e], [d, b, f], [e, f, c]], E = lssEig3(a, b, c, d, e, f);
      for (const l of E) { const A = M.map((row, i) => row.map((v, j) => v - (i === j ? l : 0))), det = A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]); worst = Math.max(worst, Math.abs(det)); }
      worst = Math.max(worst, Math.abs(E[0] + E[1] + E[2] - (a + b + c))); if (!(E[0] >= E[1] && E[1] >= E[2])) worst = 1; }
    ok('the per-galaxy eigenvalues of the deformation tensor: det(M − λI) = 0, the trace is kept and the order is descending, for 200 random symmetric matrices', worst < 1e-12, `worst ${worst.toExponential(1)}`); }

  /* 5 · Navier–Stokes: Burgers and the Zel'dovich map */
  { const A = 1, psi0 = q => A * (Math.cos(q) - 1), u0 = q => -A * Math.sin(q); let before = 0;
    for (const q of [-2.5, -1.2, -0.4, 0.3, 1.1, 2.4]) { const t = 0.6, x = q + t * u0(q), B = burgersHopfCole(x, t, 1e-4, psi0, -Math.PI, Math.PI); before = Math.max(before, Math.abs(B.q - q), Math.abs(B.u - u0(q))); }
    const t = 2, qs = burgersShockHalfWidth(A, t), L = burgersHopfCole(-1e-3, t, 1e-4, psi0, -Math.PI, Math.PI), R = burgersHopfCole(1e-3, t, 1e-4, psi0, -Math.PI, Math.PI);
    const streams = [0, qs, -qs].every(q => Math.abs(q - t * A * Math.sin(q)) < 1e-12);
    const thick = burgersHopfCole(-1e-3, t, 0.5, psi0, -Math.PI, Math.PI);
    ok('NAVIER–STOKES: the Zel\'dovich map is the inviscid limit of Burgers — before shell crossing the Hopf–Cole solution IS the Zel\'dovich particle; after it the Lagrangian map jumps at x = 0 from −q_s to q_s, q_s = t sin q_s, exactly the three streams — the shock holds the mass they share; a thick viscosity smears the jump (mutation)',
      before < 1e-3 && Math.abs(L.q + qs) < 2e-3 && Math.abs(R.q - qs) < 2e-3 && streams && Math.abs(thick.q) < 0.5 * qs,
      `before crossing |q* − q| ≤ ${before.toExponential(1)} · q_s ${qs.toFixed(5)} · q*(0∓) ${L.q.toFixed(5)}, ${R.q.toFixed(5)} · shock mass ${(qs / Math.PI * 100).toFixed(2)}% · ν = 0.5: q*(0−) ${thick.q.toFixed(3)}`); }

  /* 6 · the clock */
  { const now = lssGrowthSeen(0, 0), bb = lssGrowthSeen(0, -2e10), far = lssGrowthSeen(0, 1e13), hcb = lssGrowthSeen(1.8, 0), zD = lssGrowth(1 / 2.8);
    let mono = true, prev = -1; for (let y = -13e9; y <= 5e10; y += 1e9) { const D = lssGrowthSeen(0, y); if (D < prev - 1e-12) mono = false; prev = D; }
    ok('the clock: D seen is 1 here and now, 0 before the Big Bang, D∞ in the far future, never decreasing — and a structure at z = 1.8 shows the growth of the time its light left',
      Math.abs(now - 1) < 1e-6 && bb === 0 && Math.abs(far - LSS_DINF) < 1e-6 && mono && Math.abs(hcb - zD) < 1e-4,
      `now ${now.toFixed(6)} · far future ${far.toFixed(4)} · z = 1.8 → ${hcb.toFixed(4)} = D(a = 1/2.8) ${zD.toFixed(4)}`); }

  /* 7 · the relief */
  { const sc = lssStructureSpec({ key: 'test-sc', type: 'supercluster' }, 0.12, [1, 1, 1]), vd = lssStructureSpec({ key: 'test-void', type: 'void' }, 0.12, [1, 1, 1]);
    sc.count = vd.count = 1500; const Rs = lssRelief(sc), Rv = lssRelief(vd);
    const cS = lssReliefCensus(Rs, 1), cV = lssReliefCensus(Rv, 1), c0 = lssReliefCensus(Rs, 1e-6), cI = lssReliefCensus(Rs, LSS_DINF);
    ok('the relief: a supercluster has more of its galaxies in filaments and nodes than a void, at D → 0 every galaxy is in a void-class place, and more has shell-crossed at D∞ than today',
      Rs.n === 1500 && Rv.n === 1500 && cS.filament + cS.node > cV.filament + cV.node && cV.void > cS.void && c0.void === 1 && cI.crossed > cS.crossed,
      `supercluster void/sheet/filament/node ${[cS.void, cS.sheet, cS.filament, cS.node].map(x => (x * 100).toFixed(0)).join('/')}% · void ${[cV.void, cV.sheet, cV.filament, cV.node].map(x => (x * 100).toFixed(0)).join('/')}% · crossed today ${(cS.crossed * 100).toFixed(1)}% → at D∞ ${(cI.crossed * 100).toFixed(1)}%`); }

  /* 8 · wiring */
  { const worker = (SRC.match(/\[mulberry,s3nsInvert,lssFFT1,lssFFT3,lssTransfer,lssPower,lssRealize,lssSample,lssEig3,lssRelief\]/) || []).length === 1 && /"\\nconst lssKIdx="\+lssKIdx\.toString\(\)/.test(SRC);
    ok('wiring: the worker is given every function it runs, the shader reads the log-depth buffer, the layer is on by default with its control and the growth tick runs every frame; the cosmic-web laboratory draws the Burgers bridge and cosmicweb is related to nsflow',
      worker && /const LSS_VERT=`[\s\S]{0,400}#include <logdepthbuf_pars_vertex>/.test(SRC) && /showCosmicDust:false, showWebRelief:true,/.test(SRC) && /id="webRelief"/.test(SRC)
      && /updateLaniakeaFlows\(dt\);\n  try\{ lssReliefTick\(\); \}/.test(SRC) && /\$\{cwBurgersSect\(\)\}`;/.test(SRC) && /\['cosmicweb','nsflow','limit','the web is Navier–Stokes without pressure'/.test(SRC)
      && /globalThis\.HCC_WEB_RELIEF=Object\.freeze/.test(SRC)); }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
