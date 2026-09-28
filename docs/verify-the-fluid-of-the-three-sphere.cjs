#!/usr/bin/env node
'use strict';
/* ══ THE FLUID OF THE THREE-SPHERE ═════════════════════════════════════════════════════════
 * Navier–Stokes on S³ beyond the exact solutions: a Galerkin truncation in the Spin(4) curl shells with an exact
 * quadrature in Hopf coordinates. Checked:
 *   1. the basis: (k+1)(k+3) modes per shell and helicity, orthonormal on the quadrature, curl e = μe with
 *      μ = ±(k+2), κ = k(k+4); and the fast field evaluator equals the sampled modes (velocity and vorticity)
 *   2. the invariants without viscosity: energy and helicity to the accuracy of the step, the six Killing
 *      components to rounding
 *   3. two independent routes meet: started on the atlas's exact solution (Killing + a carried shell) the
 *      truncation follows it
 *   4. the fluid forgets all but six numbers: with viscosity it ends in the rigid rotation predicted at t = 0
 *   5. the shells talk only as Spin(4) allows: every pair of distinct shells reaches exactly the Clebsch–Gordan
 *      shells, never the rigid rotation; a single Beltrami shell does not talk to itself
 *   6. realizability: |H| ≤ √(2EΩ) along a flow, and the page, the API, the ledger and the track are wired
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { nsgBasis, nsgStep, nsgInvariants, nsgFinal, nsgInitial, nsgFieldPrep, nsgFieldAt, nsgTriads, nsgLamb, nsfMake, nsfVelocity, s3nsShell, s3nsVelocity, s3nsNumCurl } = K;
  const B3 = nsgBasis(3), B2 = nsgBasis(2);
  { let orth = 0; for (let i = 0; i < B3.n; i += 3) for (let j = 0; j < B3.n; j += 4) { let s = 0; for (let p = 0; p < B3.Q.n; p++) for (let c = 0; c < 4; c++) s += B3.Q.W[p] * B3.modes[i].e[4 * p + c] * B3.modes[j].e[4 * p + c]; orth = Math.max(orth, Math.abs(s - (i === j ? 1 : 0))); }
    const dims = B3.shells.every(s => s.to - s.from === (s.k + 1) * (s.k + 3)) && B3.modes.every(m => m.mu === m.sigma * (m.k + 2) && m.kappa === m.k * (m.k + 4));
    const sh = s3nsShell(2, 1), q = [0.3, 0.5, -0.4, 0.7].map((v, i, A) => v / Math.hypot(...A)), c = s3nsNumCurl(p => s3nsVelocity(sh, sh.basis[0], p), q).curl, f = s3nsVelocity(sh, sh.basis[0], q), curlErr = Math.max(...c.map((v, i) => Math.abs(v - 4 * f[i])));
    const a = nsgInitial(B3, { seed: 3, killing: 0.2, bias: 0.3 }), P = nsgFieldPrep(B3, a); let fe = 0;
    for (let p = 0; p < B3.Q.n; p += 17) { const g = nsgFieldAt(P, B3.Q.pts[p]); for (let x = 0; x < 4; x++) { let us = 0, ws = 0; for (let i = 0; i < B3.n; i++) { us += a[i] * B3.modes[i].e[4 * p + x]; ws += a[i] * B3.mu[i] * B3.modes[i].e[4 * p + x]; } fe = Math.max(fe, Math.abs(us - g.u[x]), Math.abs(ws - g.w[x])); } }
    ok('the basis: (k+1)(k+3) modes per shell, orthonormal on the quadrature, curl e = μe, κ = k(k+4), and the fast evaluator equals the sampled field', dims && orth < 1e-12 && curlErr < 1e-6 && fe < 1e-12, `${B3.n} modes on ${B3.Q.n} points · orthonormality ${orth.toExponential(1)} · curl − 4e ${curlErr.toExponential(1)} · evaluator ${fe.toExponential(1)}`); }
  { let a = nsgInitial(B2, { seed: 5, killing: 0.2, bias: 0.4 }); const I0 = nsgInvariants(B2, a); for (let s = 0; s < 100; s++) a = nsgStep(B2, a, 0, 0.02); const I = nsgInvariants(B2, a), dE = Math.abs(I.E / I0.E - 1), dH = Math.abs(I.H / I0.H - 1), dK = Math.max(...I.kill.map((v, i) => Math.abs(v - I0.kill[i])));
    ok('without viscosity energy and helicity hold to the step, the six Killing components to rounding', dE < 1e-9 && dH < 1e-9 && dK < 1e-15, `dE/E ${dE.toExponential(1)} · dH/H ${dH.toExponential(1)} · Killing ${dK.toExponential(1)}`); }
  { const F = nsfMake(2, 1, 7, 0.55, 1.0, 0.02); F.sign = 1; const proj = g => Float64Array.from(B2.modes.map(m => { let s = 0; for (let q = 0; q < B2.Q.n; q++) { const u = g(B2.Q.pts[q]); for (let x = 0; x < 4; x++) s += B2.Q.W[q] * m.e[4 * q + x] * u[x]; } return s; }));
    let c = proj(q => nsfVelocity(F, 0, q)); for (let s = 0; s < 100; s++) c = nsgStep(B2, c, F.nu, 0.01); const ex = proj(q => nsfVelocity(F, 1, q)); let e2 = 0, n2 = 0; for (let i = 0; i < B2.n; i++) { e2 += (c[i] - ex[i]) ** 2; n2 += ex[i] ** 2; }
    ok('two independent routes meet: started on the exact solution, the truncation follows it', Math.sqrt(e2 / n2) < 1e-8, `relative error at t = 1: ${Math.sqrt(e2 / n2).toExponential(2)}`); }
  { let a = nsgInitial(B2, { seed: 9, killing: 0.25, bias: 0.5 }); const F = nsgFinal(B2, a); for (let s = 0; s < 600; s++) a = nsgStep(B2, a, 0.2, 0.05); const I = nsgInvariants(B2, a);
    ok('the fluid forgets all but six numbers: with viscosity it ends in the rigid rotation read at t = 0', Math.abs(I.E / F.E - 1) < 1e-6 && Math.abs(I.H - F.H) < 1e-6 * Math.abs(F.H || 1) && Math.abs(I.Om / F.Om - 1) < 1e-6 && Math.abs(F.Om - 8 * F.E) < 1e-12, `E ${I.E.toFixed(7)} vs ${F.E.toFixed(7)} · H ${I.H.toFixed(7)} vs ${F.H.toFixed(7)} · Ω ${I.Om.toFixed(6)} = 8E∞`); }
  { const spins = (k, s) => s > 0 ? [(k + 2) / 2, k / 2] : [k / 2, (k + 2) / 2], cg = (A, C, D) => { const a = spins(...A), b = spins(...C), c = spins(...D), okk = (x, y, z) => z >= Math.abs(x - y) - 1e-9 && z <= x + y + 1e-9 && Math.abs((x + y - z) - Math.round(x + y - z)) < 1e-9; return okk(a[0], b[0], c[0]) && okk(a[1], b[1], c[1]); };
    let checks = 0, bad = 0, noether = 0; for (const t of nsgTriads(B3)) for (const S of B3.shells) { checks++; const used = t.to.some(x => x[0] === S.k && x[1] === S.sigma), allowed = cg(t.a, t.b, [S.k, S.sigma]); if (S.k === 0) { if (used || allowed) bad++; } else if (used !== allowed) bad++; }
    const self = new Float64Array(B3.n); const sh = B3.shells.find(s => s.k === 2 && s.sigma > 0); for (let i = sh.from; i < sh.to; i++) self[i] = Math.sin(i + 1); const L = nsgLamb(B3, self), selfMax = Math.max(...L.map(Math.abs));
    ok('the shells talk only as Spin(4) allows — exactly the Clebsch–Gordan shells, never the rigid rotation (Clebsch–Gordan and Noether agree), and a Beltrami shell not to itself', bad === 0 && selfMax < 1e-12, `${checks} checks · ${bad} violations · self-coupling ${selfMax.toExponential(1)}`); }
  { let a = nsgInitial(B2, { seed: 4, killing: 0.1, bias: -0.6 }), worst = 0; for (let s = 0; s < 60; s++) { a = nsgStep(B2, a, 0.03, 0.05); const I = nsgInvariants(B2, a); worst = Math.max(worst, Math.abs(I.H) / Math.sqrt(2 * I.E * I.Om)); }
    ok('realizability holds along a flow, and the page, the API, the ledger and the track are wired', worst <= 1 + 1e-12 && /\{id:'nsgal', category:'dyn'/.test(SRC) && /nsgGroup\.visible = \(v==='nsgal'\);/.test(SRC) && /id:'nsgal', world:'s3', lab:'nsgal',/.test(SRC) && /\{id:'sixNumbers', kind:'found'/.test(SRC) && /\{id:'spin4Triads', kind:'confirms'/.test(SRC) && /sixNumbers:\[\{op:'nav', world:'s3', lab:'nsgal'\}/.test(SRC) && /data-trigo="nsgal"/.test(SRC),
      `max |H|/√(2EΩ) = ${worst.toFixed(4)}`); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
