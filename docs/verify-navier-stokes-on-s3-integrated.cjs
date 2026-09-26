#!/usr/bin/env node
'use strict';
/* ══ A NAVIER–STOKES FLOW ON S³, INTEGRATED ═══════════════════════════════════════════════
 * The S³ programme named one exact non-stationary solution, u = K + a e^{−νκt}(Φ_t^Y)_* v₀, and
 * checked only that the carried field stays a curl eigenfield. This file puts it back into the
 * partial differential equation, with the extracted kernels (core/atlas/extracted.mjs), and checks:
 *   1. EXACT: the curl of the residual ∂ₜu + ∇ᵤu + νAu is at the level of the differencing error
 *      (relative 1e-6) for four shells and both helicities at two times — the equation holds with
 *      a pressure (on S³, H¹ = 0: curl-free ⇔ gradient)
 *   2. the viscous term is what the kernel says: curl(curl w) − 4w = κ w, measured by nested
 *      differences, and A K = 0 for the Killing part
 *   3. div u = 0 at every point, so a uniform tracer cloud stays uniform: after 240 Lagrangian
 *      steps its second moments are still those of the uniform measure (⟨xᵢ²⟩ = 1/4)
 *   4. and therefore the tracers MEASURE the energy: their mean |w|² after the flow falls on
 *      a² e^{−2νκt}/(2π²) within the sampling error
 *   5. the closed forms: carrier weights k/(k+2), (k+4)/(k+2) (swapped for σ = −1), κ = k(k+4),
 *      dim (k+1)(k+3), and the Ricci-flow extinction R²/4 derived here from ∂g/∂t = −2Ric
 *   6. MUTATIONS: the shell carried the wrong way, and the two chirality weights swapped — each
 *      leaves a residual of order one, caught
 *   7. honesty and wiring: the Millennium problem is named OPEN, the API refuses the claim, the
 *      laboratory is declared once, routed, drawn and related
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
let seed = 97; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { nsfMake, nsfVelocity, nsfShellPart, nsfKilling, nsfResidualCurl, nsfUniform, nsfStep, nsfExactMeans, nsfFacts, s3nsNumCurl } = K;
  const pts = nsfUniform(rnd, 6);

  /* 1 · exact */
  { const rows = []; for (const [k, s] of [[1, 1], [1, -1], [2, 1], [3, -1]]) for (const t of [0.3, 1.7]) { const F = nsfMake(k, s, 11 + k, 0.6, 2.5, 0.03); const r = nsfResidualCurl(F, t, pts); rows.push({ k, s, t, rel: r.relative, conv: r.convective }); }
    const worst = Math.max(...rows.map(r => r.rel));
    ok('EXACT — the curl of the Navier–Stokes residual of u = K + a e^{−νκt}(Φ_t^Y)_* v₀ is at the level of the differencing error for four shells, both helicities, two times: the equation holds with a pressure',
      worst < 1e-6 && rows.every(r => r.conv > 0.1), `worst relative ${worst.toExponential(1)} against convective curls ${Math.min(...rows.map(r => r.conv)).toFixed(2)}–${Math.max(...rows.map(r => r.conv)).toFixed(2)}`); }

  /* 2 · the viscous term */
  { let worst = 0, kil = 0; for (const [k, s] of [[1, 1], [2, -1]]) { const F = nsfMake(k, s, 5, 0.6, 1, 0.03), W = q => nsfShellPart(F, 0.2, q), Kf = q => nsfKilling(F, q);
      for (const q of pts.slice(0, 4)) { const cc = s3nsNumCurl(p => s3nsNumCurl(W, p, 1e-4).curl, q, 1e-3).curl, w = W(q), A = cc.map((x, i) => x - 4 * w[i]), e = Math.hypot(...A.map((x, i) => x - F.kappa * w[i])) / Math.max(1e-9, Math.hypot(...w) * F.kappa);
        worst = Math.max(worst, e); const ck = s3nsNumCurl(p => s3nsNumCurl(Kf, p, 1e-4).curl, q, 1e-3).curl, kv = Kf(q); kil = Math.max(kil, Math.hypot(...ck.map((x, i) => x - 4 * kv[i])) / Math.hypot(...kv)); } }
    ok('the viscous term is what the kernel uses: A w = curl²w − 4w = κ w on the carried shell, and A K = 0 on the Killing part, measured by nested differences', worst < 1e-3 && kil < 1e-3, `‖Aw − κw‖/κ‖w‖ ≤ ${worst.toExponential(1)} · ‖AK‖/‖K‖ ≤ ${kil.toExponential(1)}`); }

  /* 3 · incompressible, so the cloud stays uniform */
  const F = nsfMake(2, 1, 3, 0.7, 3, 0.025); let Q = nsfUniform(rnd, 5000), t = 0; const h = 0.02;
  { let div = 0; for (const q of pts) div = Math.max(div, Math.abs(s3nsNumCurl(p => nsfVelocity(F, 0.4, p), q, 1e-4).div));
    for (let n = 0; n < 240; n++) { Q = Q.map(q => nsfStep(F, t, q, h)); t += h; }
    const m = [0, 1, 2, 3].map(i => Q.reduce((a, q) => a + q[i] * q[i], 0) / Q.length), dev = Math.max(...m.map(x => Math.abs(x - 0.25)));
    ok('div u = 0 everywhere, so a uniform tracer cloud stays uniform: after 240 Lagrangian steps its second moments are still ⟨xᵢ²⟩ = 1/4', div < 1e-6 && dev < 0.02, `|div u| ≤ ${div.toExponential(1)} · moments ${m.map(x => x.toFixed(3)).join(', ')}`); }

  /* 4 · the tracers measure the energy */
  { const w2 = Q.reduce((a, q) => { const w = nsfShellPart(F, t, q); return a + w[0] * w[0] + w[1] * w[1] + w[2] * w[2] + w[3] * w[3]; }, 0) / Q.length, ex = nsfExactMeans(F, t).shell;
    ok('and so the tracers MEASURE the energy: after the flow their mean |w|² falls on a² e^{−2νκt}/(2π²) within the sampling error', Math.abs(w2 / ex - 1) < 0.05, `measured ${w2.toFixed(5)} · exact ${ex.toFixed(5)} · t = ${t.toFixed(2)}`); }

  /* 5 · closed forms */
  { const bad = []; for (let k = 1; k <= 4; k++) for (const s of [1, -1]) { const f = nsfFacts(k, s, 0.02, 1), same = s > 0 ? k / (k + 2) : (k + 4) / (k + 2), opp = s > 0 ? (k + 4) / (k + 2) : k / (k + 2);
      if (Math.abs(f.carrierSame - same) > 1e-12 || Math.abs(f.carrierOpposite - opp) > 1e-12 || f.kappa !== k * (k + 4) || f.dim !== (k + 1) * (k + 3)) bad.push(k + ':' + s); }
    /* Ricci flow on the round sphere: g = R² g₁, Ric = 2 g₁ (independent of scale), ∂(R²)/∂t = −2·2 ⇒ R²(t) = R₀² − 4t */
    const R0 = 1.7, ext = R0 * R0 / 4;
    ok('the closed forms: carrier weights k/(k+2) and (k+4)/(k+2), exchanged by σ; κ = k(k+4); dim (k+1)(k+3); and the Ricci-flow extinction R²/4 derived here from ∂g/∂t = −2Ric', bad.length === 0 && Math.abs(nsfFacts(1, 1, 0.02, R0).ricciExtinction - ext) < 1e-15, bad.join(',') || 'all agree'); }

  /* 6 · mutations */
  { const Fw = nsfMake(1, 1, 7, 0.6, 2.5, 0.03); Fw.sign = -1; const rw = nsfResidualCurl(Fw, 0.5, pts);
    const Fs = nsfMake(1, 1, 7, 0.6, 2.5, 0.03); Fs.w = { same: Fs.w.opposite, opposite: Fs.w.same }; const rs = nsfResidualCurl(Fs, 0.5, pts);
    ok('MUTATIONS — the shell carried the wrong way, or the two chirality weights exchanged, leaves a residual of order one: the carrier is fixed by the equation, caught', rw.relative > 0.1 && rs.relative > 0.1, `wrong way ${rw.relative.toFixed(2)} · swapped ${rs.relative.toFixed(2)}`); }

  /* 7 · honesty and wiring */
  ok('honesty and wiring: the Clay Millennium problem is named OPEN and the API refuses the claim; the laboratory is declared once, routed, drawn, in the API and related to the programme it tests',
    /\{id:'nsflow', category:'dyn', domain:'quantum', cluster:'dynamics', predictionClass:'exact',/.test(SRC) && /THIS IS NOT A SOLUTION OF THE MILLENNIUM PROBLEM/.test(SRC) && /The Clay Millennium problem — do smooth solutions in R³/.test(SRC)
    && /nsfGroup\.visible = \(v==='nsflow'\);/.test(SRC) && /state\.s3view==='nsflow'\)\{\n\s*fbsAnimT\+=dt; updateNsf\(dt\);/.test(SRC) && /id:'nsflow', world:'s3', lab:'nsflow',/.test(SRC) && /\['nsflow','s3kb','coupling'/.test(SRC) && /\['nsfAtlas','nsflow',nsfGroup,/.test(SRC));

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
