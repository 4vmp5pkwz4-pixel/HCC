#!/usr/bin/env node
'use strict';
/* ══ THE STROBOSCOPE ═══════════════════════════════════════════════════════════════════════
 * Resonances across space, time and parameters. Checked:
 *   1. the carrier of the exact Navier–Stokes solution is two rotations of ℝ⁴ with frequencies 2 and 4/(k+2):
 *      the matrix of Y has exactly those, for every shell and both helicities
 *   2. its orbits are torus knots T(k+2, 2) for odd k and unknotted circles for even k — the windings counted on
 *      the REAL flow α q β over one orbit, closing to 10⁻¹²
 *   3. the exact solution itself is periodic: u(t + π(k+2)/gcd(k,4)) = u(t) to rounding, both helicities, and
 *      it does not return at any earlier flash on a fine scan
 *   4. the clocks, blind: the landscape finds the Saros and the Metonic cycle by name — and the null of jittered
 *      periods produces triple returns as good, so blind it proves nothing
 *   5. the clocks, locked to the new moon: the best return within 1000 lunations is the Saros, 223 — and a Moon
 *      with its months jittered by 5% has one as good about one time in six (0.05 < p < 0.4)
 *   6. wired: declared, routed, drawn, controls, API, relations, ledger and tracks
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { carrierMatrix, carrierKnot, carrierWinding, carrierReturn, strobePeaks, strobeNull, strobeLocked, strobeLockedNull, strobeName, CYCLES, CYC_SYNODIC, mulberry, DISCOVERIES, discoveryTrack, trackRun } = K;
  { let worst = 0; for (const s of [1, -1]) for (let k = 1; k <= 8; k++) { const A = carrierMatrix(k, s), A2 = A.map(r => [0, 1, 2, 3].map(j => r.reduce((t, x, i) => t + x * A[i][j], 0))), tr = A2.reduce((t, r, i) => t + r[i], 0), f1 = 2, f2 = 4 / (k + 2);
      const A4tr = A2.map(r => [0, 1, 2, 3].map(j => r.reduce((t, x, i) => t + x * A2[i][j], 0))).reduce((t, r, i) => t + r[i], 0), anti = Math.max(...A.flatMap((r, i) => r.map((x, j) => Math.abs(x + A[j][i]))));
      worst = Math.max(worst, Math.abs(tr + 2 * (f1 * f1 + f2 * f2)), Math.abs(A4tr - 2 * (f1 ** 4 + f2 ** 4)), anti); }
    ok('the carrier Y is two rotations of ℝ⁴ with frequencies 2 and 4/(k+2), for every shell and both helicities', worst < 1e-12, `k = 1 … 8, σ = ± · worst ${worst.toExponential(1)}`); }
  { const rows = []; let ok2 = true; for (const s of [1, -1]) for (let k = 1; k <= 7; k++) { const kn = carrierKnot(k, s), w = carrierWinding(k, s, [0.5, 0.5, 0.5, 0.5], 12000), odd = k % 2 === 1;
      const good = Math.abs(w.w1 - kn.p) < 1e-6 && Math.abs(Math.abs(w.w2) - kn.q) < 1e-6 && w.closed < 1e-12 && (odd ? kn.p === k + 2 && kn.q === 2 && kn.torusKnot : kn.q === 1 && !kn.torusKnot); if (!good) ok2 = false; if (s > 0) rows.push(`k=${k}: ${kn.torusKnot ? 'T(' + kn.p + ',' + kn.q + ')' : kn.p + '-fold circle'}`); }
    ok('its orbits are the torus knots T(k+2, 2) for odd k — the trefoil at k = 1 — and unknotted circles for even k, counted on the real flow', ok2, rows.join(' · ')); }
  { const rnd = mulberry(3), pts = Array.from({ length: 16 }, () => { const v = [0, 0, 0, 0].map(() => rnd() * 2 - 1), l = Math.hypot(...v); return v.map(x => x / l); }); let worst = 0, early = [];
    for (const s of [1, -1]) for (let k = 1; k <= 6; k++) { const T = carrierKnot(k, s).patternPeriod; worst = Math.max(worst, carrierReturn(k, s, T, pts)); if (s > 0) for (let i = 1; i < 240; i++) { if (carrierReturn(k, s, T * i / 240, pts) < 1e-6) { early.push(k + '@' + i); break; } } }
    ok('the exact solution is periodic: u(t + π(k+2)/gcd(k,4)) = u(t), both helicities, and never earlier', worst < 1e-12 && early.length === 0 && Math.abs(carrierKnot(1, 1).patternPeriod - 3 * Math.PI) < 1e-12 && Math.abs(carrierKnot(4, 1).patternPeriod - 1.5 * Math.PI) < 1e-12,
      `worst return ${worst.toExponential(1)} · periods ${[1, 2, 3, 4, 5, 6].map(k => (carrierKnot(k, 1).patternPeriod / Math.PI) + 'π').join(', ')}${early.length ? ' · EARLY ' + early.join(',') : ''}`); }
  const by = k => CYCLES.find(c => c.key === k), P = ['moon', 'draconic', 'anomalistic', 'year'].map(k => by(k).days), lo = Math.log10(30), hi = Math.log10(40000);
  { const pk = strobePeaks(P, lo, hi, 400000, 14, 0.01, 1.5), names = pk.map(p => strobeName(p.T)).filter(Boolean), nul = strobeNull(P, lo, hi, 100000, 20, 11, 0.05, 0.01), saros = pk.find(p => strobeName(p.T) === 'Saros');
    ok('the clocks, blind: the landscape finds the Saros and the Metonic cycle by name — and the jittered null makes triple returns as good, so blind it proves nothing',
      names.includes('Saros') && names.includes('Metonic') && !!saros && nul[Math.floor(nul.length / 2)] > saros.S - 0.35, `found: ${names.join(', ')} · Saros S ${saros ? saros.S.toFixed(3) : '—'} · null max median ${nul[10].toFixed(3)}`); }
  { const others = [by('draconic').days, by('anomalistic').days], L = strobeLocked(CYC_SYNODIC, others, 1000, 0.01).sort((a, b) => b.S - a.S), nul = strobeLockedNull(CYC_SYNODIC, others, 1000, 300, 5, 0.05, 0.01), p = (1 + nul.filter(v => v >= L[0].S).length) / 301;
    ok('the clocks, locked to the new moon: the best return within 1000 lunations is the Saros, 223 — and chance matches it about one time in six', L[0].N === 223 && p > 0.05 && p < 0.4, `best N = ${L[0].N} (S ${L[0].S.toFixed(3)}) · p = ${p.toFixed(3)} against 300 jittered Moons`); }
  { const led = ['carrierKnots', 'sarosChance'].every(id => DISCOVERIES.some(d => d.id === id && d.verifier === 'docs/verify-the-stroboscope.cjs')), tr = ['carrierKnots', 'sarosChance'].every(id => trackRun(discoveryTrack(id)).ok);
    ok('wired: declared, routed, drawn, its controls, in the API and the relations, in the ledger with replaying tracks',
      led && tr && /\{id:'strobe', category:'dyn', domain:'quantum', cluster:'dynamics'/.test(SRC) && /strobeGroup\.visible = \(v==='strobe'\);/.test(SRC) && /state\.s3view==='strobe'\)\{\n\s*fbsAnimT\+=labDt; updateStrobe\(labDt\);/.test(SRC)
      && /id:'strobe', world:'s3', lab:'strobe',/.test(SRC) && /\['strobe','nsflow',/.test(SRC) && /\['strobeAtlas','strobe',strobeGroup,/.test(SRC) && /data-strobek=/.test(SRC), `ledger ${led ? 'ok' : 'MISSING'} · tracks ${tr ? 'replay' : 'FAIL'}`); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
