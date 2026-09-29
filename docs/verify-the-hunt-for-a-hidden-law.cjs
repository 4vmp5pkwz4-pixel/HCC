#!/usr/bin/env node
'use strict';
/* ══ THE HUNT FOR A HIDDEN LAW ═════════════════════════════════════════════════════════════
 * Does the truncated Euler fluid on S³ conserve a polynomial nobody has named? The census asks the equations:
 * Q is conserved iff ∇Q · f(a) = 0 for every state — linear in Q's coefficients — so the conserved polynomials
 * are the null space of a Gram matrix of random-state rows. Checked:
 *   1. the symmetric eigen-solver (Householder + implicit QL) returns a planted spectrum to rounding
 *   2. the census is honest on a system whose laws are known: Euler's free rigid body has no linear invariant
 *      and exactly two quadratic ones (|L|² and the energy); make it a symmetric top and the census finds the
 *      one linear law (L₃) the "theory" did not name — hidden = 1
 *   3. the fluid of S³, linear: exactly the six Killing components at K = 1 and K = 2, each named one in the
 *      null space
 *   4. the fluid of S³, quadratic: exactly 23 at K = 1 and at K = 2 — the 21 products of L, E and H of the rest —
 *      and a cliff of more than ten decades above them: no hidden law
 *   5. the page, the ledger, the track, the lead, and the 2026 status of the Millennium problem are wired
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { nsgEigSym, nsgInvariantHunt, nsgBasis, mulberry, DISCOVERIES, DISCOVERY_TRACKS, discoveryTrack, trackRun } = K;
  { const n = 30, rnd = mulberry(5), lam = Array.from({ length: n }, (_, i) => i < 4 ? 0 : Math.exp(3 * (rnd() - 0.5))), A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? lam[i] : 0));
    for (let r = 0; r < 4; r++) { const v = Array.from({ length: n }, () => rnd() - 0.5), vv = v.reduce((s, x) => s + x * x, 0), H = (i, j) => (i === j ? 1 : 0) - 2 * v[i] * v[j] / vv, M = A.map(row => row.slice());
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let s = 0; for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) s += H(i, k) * M[k][l] * H(l, j); A[i][j] = s; } }
    const ev = nsgEigSym(A), want = lam.slice().sort((x, y) => x - y), err = Math.max(...ev.map((x, i) => Math.abs(x - want[i])));
    ok('the symmetric eigen-solver returns a planted spectrum (four zeros among 30) to rounding', err < 1e-12, `max error ${err.toExponential(1)}`); }
  { const I = [1, 2, 3.5], body = (I1, I2, I3) => a => Float64Array.from([(1 / I3 - 1 / I2) * a[1] * a[2], (1 / I1 - 1 / I3) * a[2] * a[0], (1 / I2 - 1 / I1) * a[0] * a[1]]);
    const toy = mu => ({ K: 0, n: 3, mu: Float64Array.from(mu), modes: [{ k: 1 }, { k: 1 }, { k: 1 }] });
    const l1 = nsgInvariantHunt(toy(I.map(x => 1 / x)), 1, { f: body(...I) }), q1 = nsgInvariantHunt(toy(I.map(x => 1 / x)), 2, { f: body(...I) }), top = nsgInvariantHunt(toy([1, 1, 1 / 3]), 1, { f: body(1, 1, 3) });
    ok('honest on a known system: the free rigid body has 0 linear and exactly 2 quadratic laws (|L|², energy), and the symmetric top\'s unnamed L₃ is caught as hidden = 1',
      l1.count === 0 && q1.count === 2 && q1.hidden === 0 && q1.namedWorst < 1e-14 && top.count === 1 && top.hidden === 1, `body: ${l1.count} linear, ${q1.count} quadratic (named ${q1.expected}) · top: ${top.count} linear, hidden ${top.hidden}`); }
  const B1 = nsgBasis(1), B2 = nsgBasis(2);
  { const a = nsgInvariantHunt(B1, 1), b = nsgInvariantHunt(B2, 1);
    ok('the fluid of S³, linear: exactly the six Killing components at K = 1 and K = 2, each in the null space', a.count === 6 && b.count === 6 && a.hidden === 0 && b.hidden === 0 && Math.max(a.namedWorst, b.namedWorst) < 1e-14 && B1.n === 22 && B2.n === 52,
      `K = 1: ${a.count} of ${a.n} modes · K = 2: ${b.count} of ${b.n} · cliff ${a.firstLive.toExponential(1)} / ${b.firstLive.toExponential(1)}`); }
  { const a = nsgInvariantHunt(B1, 2), b = nsgInvariantHunt(B2, 2, { Ns: 1600 });
    ok('the fluid of S³, quadratic: exactly 23 at K = 1 and K = 2 — the 21 products of L, E and H — and a cliff of more than ten decades: no hidden law',
      a.count === 23 && b.count === 23 && a.expected === 23 && a.hidden === 0 && b.hidden === 0 && Math.max(a.namedWorst, b.namedWorst) < 1e-14 && a.firstLive / Math.max(a.lastNull, 1e-300) > 1e10 && b.firstLive / Math.max(b.lastNull, 1e-300) > 1e10,
      `K = 1: ${a.count} of ${a.unknowns} unknowns, cliff ${a.lastNull.toExponential(1)} → ${a.firstLive.toExponential(1)} · K = 2: ${b.count} of ${b.unknowns}, ${b.lastNull.toExponential(1)} → ${b.firstLive.toExponential(1)} · ${((a.ms + b.ms) / 1000).toFixed(1)} s`); }
  { const d = DISCOVERIES.find(x => x.id === 'noHiddenLaw'), t = trackRun(discoveryTrack('noHiddenLaw'));
    ok('wired: the hunt in the laboratory (worker, cliff, chips), the ledger and its track, the Kraichnan lead, and the Millennium problem at its September 2026 status',
      !!d && d.verifier === 'docs/verify-the-hunt-for-a-hidden-law.cjs' && !!DISCOVERY_TRACKS.noHiddenLaw && t.ok && /data-nsghunt="\$\{c\.key\}"/.test(SRC) && /<canvas id="nsgHunt"/.test(SRC) && /function nsgHuntWorkerSrc\(\)/.test(SRC)
      && /the hunt for a hidden law \(v4\.339\) closes the other door/.test(SRC) && /as it stands in September 2026/.test(SRC) && /Clay Institute has not accepted it/.test(SRC) && !/not solved by anyone/.test(SRC) && !/[^0-9]56 modes|[^0-9]56-mode/.test(SRC),
      `track ${t.ok ? 'replays' : 'FAILS'} · fingerprint ${t.fingerprint}`); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
