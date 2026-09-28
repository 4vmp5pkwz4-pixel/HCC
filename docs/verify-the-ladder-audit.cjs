#!/usr/bin/env node
'use strict';
/* ══ THE φ-LADDER AUDITOR ══════════════════════════════════════════════════════════════════
 * Is ln R periodic with period ln φ? Asked against the catalogue's own smoothed surrogates, not against uniform
 * phases, with the look-elsewhere effect, a tail extrapolation for 5σ, a wavelet reading along the ladder and a
 * calibrated Bayes factor. An auditor is worth what it does on samples whose answer is known, so checked:
 *   1. the parts: log I₀ against its series and its asymptote, Φ⁻¹ at 1σ … 5σ and far in the tail, and the
 *      surrogate jitter erasing a period P by e^{−2π²h²/P²}
 *   2. a sample planted on the rungs (every ln R within 6% of a rung) is found at 5σ globally, with a Bayes factor
 *      far above its surrogates'
 *   3. a sample with no ladder (uniform in ln R) is not: local p above 0.05, 5σ refused
 *   4. the surrogates, not uniform phases, are the null: on a lumpy sample (a third of the scales pulled onto rungs,
 *      the rest as catalogued) the local test sees it and the global test does not — the look-elsewhere effect is
 *      real and the auditor pays it
 *   5. the trap the second control exists for: narrow non-periodic bands beat the smoothed null at 5σ, yet ln φ
 *      ranks nowhere among the periods of the same data — declared lumpy, never a ladder
 *   6. the atlas's own 113 literature scales: φ does not stand out (local p > 0.05, 5σ refused), stated with the
 *      numbers, as the verdict the atlas publishes
 *   7. wiring: the auditor is in the φ-census dialog, in the API, and in the discovery ledger
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { PHI_AUDIT_P, phiAudit, phiAuditLogI0, phiAuditSigma, phiAuditZ, phiAuditGauss, phiLadderScales, mulberry } = K;
  const P0 = PHI_AUDIT_P.P0;
  { let s = 1, t = 1; for (let k = 1; k < 80; k++) { t *= 9 / (k * k); s += t; } const series6 = Math.log(s), big = 40 - 0.5 * Math.log(2 * Math.PI * 40) + Math.log(1 + 1 / 320 + 9 / (128 * 1600) + 225 / (3072 * 64000));
    const sig = [0.158655, 0.0227501, 0.00134990, 3.16712e-5, 2.86652e-7].map(phiAuditSigma), far = phiAuditSigma(1e-40);
    const rnd = mulberry(3), xs = Array.from({ length: 4000 }, (_, i) => P0 * i), ys = xs.map(x => x + P0 * phiAuditGauss(rnd));
    ok('the parts: log I₀ by series and asymptote, Φ⁻¹ at 1σ … 5σ and far in the tail, and the surrogate jitter erasing the period',
      Math.abs(phiAuditLogI0(6) - series6) < 1e-12 && Math.abs(phiAuditLogI0(40) - big) < 1e-9 && sig.every((v, i) => Math.abs(v - (i + 1)) < 2e-3) && far > 13 && far < 13.5 && phiAuditZ(xs, P0).Z > 500 && phiAuditZ(ys, P0).Z < 10,
      `σ ${sig.map(v => v.toFixed(4)).join(' ')} · p = 10⁻⁴⁰ → ${far.toFixed(2)}σ · periodic Z ${phiAuditZ(xs, P0).Z.toFixed(0)} → jittered ${phiAuditZ(ys, P0).Z.toFixed(2)}`); }
  const xs = phiLadderScales(), lo = Math.min(...xs), hi = Math.max(...xs), rnd = mulberry(7), M = 200;
  const planted = xs.map(() => { const n = Math.floor(lo / P0 + rnd() * (hi - lo) / P0); return n * P0 + 0.06 * P0 * phiAuditGauss(rnd); }), A = phiAudit(planted, { M });
  ok('a sample planted on the rungs is found at 5σ over every period, ln φ tops its own periodogram, and its Bayes factor is far above its surrogates\'', A.ladder && A.rank <= 0.02 && A.fiveSigma && A.sigmaGlobal > 5 && A.obs.lnB > A.lnBnull + 20 && A.pLocal <= 1 / (M + 1) + 1e-12,
    `rank ${(A.rank * 100).toFixed(1)}% · Z ${A.obs.Z.toFixed(1)} · tail p ${A.pTail.toExponential(1)} → ${A.sigmaLocal.toFixed(1)}σ local, ${A.sigmaGlobal.toFixed(1)}σ over N_eff ${A.Neff.toFixed(0)} periods · ln B ${A.obs.lnB.toFixed(1)} vs ${A.lnBnull.toFixed(2)}`);
  const U = phiAudit(xs.map(() => lo + (hi - lo) * rnd()), { M });
  ok('a sample with no ladder is not: local p above 0.05, 5σ refused', U.pLocal > 0.05 && !U.fiveSigma, `Z ${U.obs.Z.toFixed(2)} · p ${U.pLocal.toFixed(3)} · ln B ${U.obs.lnB.toFixed(2)} vs ${U.lnBnull.toFixed(2)}`);
  const T = phiAudit(xs.map((x, i) => i % 3 === 0 ? Math.round(x / P0) * P0 + 0.08 * P0 * phiAuditGauss(rnd) : x), { M });
  ok('the look-elsewhere effect is paid: a third of the scales pulled onto rungs is seen locally and not over every period', T.pLocal < 0.02 && T.sigmaLocal > 2 && T.pGlobal > 0.05 && !T.fiveSigma,
    `local p ${T.pLocal.toFixed(3)} (${T.sigmaLocal.toFixed(2)}σ by the tail) · global p ${T.pGlobal.toFixed(3)}`);
  /* the trap the second control exists for: a catalogue piled by its selection into a few narrow, NON-periodic bands
     beats the smoothed catalogue at "5σ" — and ln φ is unremarkable among the periods of the same data */
  { const centres = [lo + 7.3, lo + 19.1, lo + 23.6, lo + 41.2, lo + 55.9, lo + 60.4, lo + 77.7], B = phiAudit(Array.from({ length: 900 }, (_, i) => centres[i % centres.length] + 0.05 * phiAuditGauss(rnd)), { M: 100 });
    ok('the trap: a sample piled into narrow non-periodic bands beats the smoothed null at 5σ, but ln φ does not stand out among its own periods — declared lumpy, not a ladder', B.fiveSigma && B.rank > 0.02 && B.lumpy && !B.ladder,
      `tail ${B.sigmaGlobal.toFixed(1)}σ over every period · rank of ln φ ${(B.rank * 100).toFixed(1)}% · best period ${B.obs.best.P.toFixed(3)}`); }
  const L = phiAudit(xs, { M: 400 });
  ok('the atlas\'s own 113 literature scales: φ does not stand out against the catalogue\'s own smoothed surrogates — the ladder stays a coordinate',
    xs.length === 113 && L.pLocal > 0.05 && !L.fiveSigma && !L.ladder, `Z(ln φ) ${L.obs.Z.toFixed(3)} · naive p ${L.naiveP.toFixed(3)} · surrogate p ${L.pLocal.toFixed(3)} (${L.sigmaLocal.toFixed(2)}σ) · best period ${L.obs.best.P.toFixed(3)} (global p ${L.pGlobal.toFixed(2)}) · ln B ${L.obs.lnB.toFixed(2)} vs ${L.lnBnull.toFixed(2)} (p ${L.pBayes.toFixed(3)}) · windows p ${L.pWindow.toFixed(3)}`);
  ok('wiring: the auditor is in the φ-census dialog, in the API, and in the discovery ledger',
    /id="pcAudit"/.test(SRC) && /audit:\(w,M\)=>/.test(SRC) && /\{id:'phiAudit', kind:'tested'/.test(SRC));
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
