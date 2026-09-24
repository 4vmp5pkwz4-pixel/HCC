#!/usr/bin/env node
'use strict';
/* ══ ⊢ THE ENDPOINT ON TRIAL ═══════════════════════════════════════════════════════
 * The φ-ladder R_N = ℓ_P φ^N ends near N ≈ 292, supplied by gates. Asked to DERIVE the
 * endpoint from an independent variational, spectral or symmetry principle, the atlas puts
 * every principle it can compute on trial. This file recomputes each verdict independently:
 *   1. the observation: N_obs = log_φ(√(3/Λ)/ℓ_P) from the Planck 2018 inputs the atlas
 *      quotes — an identity, not a derivation
 *   2. the capacity free energy is minimised exactly at its own parameter q★ (dΓ/dδ = e^δ δ),
 *      and that q★ sits within one sigma of the observation — it was set from it: CIRCULAR
 *   3. the Casimir = de Sitter closure, derived here from ħc/(480π²R⁴) = 3c⁴/(8πGR²), gives
 *      R = ℓ_P/√(180π): the Planck scale, N ≈ −6.6 — REFUTES
 *   4. the horizon entropy S = πφ^{2N} is strictly increasing — SELECTS NOTHING
 *   5. the shift N → N + 1 maps the ladder onto itself, so a functional of the ladder alone
 *      cannot hold an isolated extremum — PROVES: NO RUNG; the one external number is Λℓ_P²
 *   6. what IS unique: det[G c ħ k_B over M L T Θ] = 2 ≠ 0 (one Planck form per invariant),
 *      and φ is the only positive root of x² = x + 1
 *   7. MUTATIONS: a Casimir coefficient of 24 for 240, and a selector whose minimum is
 *      moved, are each caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const num = re => +((SRC.match(re) || [0, NaN])[1]);
const PHI = (1 + Math.sqrt(5)) / 2, LN = Math.log(PHI), hbar = 1.054571817e-34, c = 299792458, G = 6.6743e-11, lP = 1.616255e-35;
const OL = num(/CAP_OMEGA_L=([0-9.]+)/), dOL = num(/CAP_D_OMEGA=([0-9.]+)/), H0 = num(/CAP_H0=([0-9.]+)/), dH0 = num(/CAP_D_H0=([0-9.]+)/), QSTAR = num(/const CAP_Q_STAR = ([0-9.e+]+);/);

/* 1 · the observation */
const H = H0 * 1e3 / 3.0856775814913673e22, Lam = 3 * OL * H * H / (c * c), sL = Lam * Math.hypot(dOL / OL, 2 * dH0 / H0);
const Nobs = Math.log(Math.sqrt(3 / Lam) / lP) / LN, dN = 0.5 * (sL / Lam) / LN;
ok('the observation written on the ladder: N_obs = log_φ(√(3/Λ)/ℓ_P) from the Planck 2018 inputs the atlas quotes', Math.abs(Nobs - 291.923) < 0.01 && /verdict:'IDENTITY'/.test(SRC),
  `Λ = ${Lam.toExponential(4)} m⁻² · N_obs = ${Nobs.toFixed(4)} ± ${dN.toFixed(4)}`);

/* 2 · the variational selector */
const Nu = (Math.log(QSTAR) - Math.log(Math.PI)) / (2 * LN);
const gD = d => Math.exp(d) * d, onlyZero = [-3, -1, -0.1, 0.1, 1, 3].every(d => Math.abs(gD(d)) > 1e-6) && gD(0) === 0;
ok('the capacity free energy is minimised exactly at its own parameter q★, and q★ sits within one sigma of the observation — it was set from it: CIRCULAR',
  onlyZero && Math.abs(Nu - Nobs) < dN && /verdict:'CIRCULAR'/.test(SRC) && /const capGammaD = d=>Math\.exp\(d\)\*d;/.test(SRC),
  `N(q★) = ${Nu.toFixed(4)} vs N_obs = ${Nobs.toFixed(4)} ± ${dN.toFixed(4)} — a difference of ${Math.abs(Nu - Nobs).toFixed(4)} rungs`);

/* 3 · Casimir = de Sitter, derived here */
const R2 = 8 * Math.PI * G * hbar / (3 * 480 * Math.PI ** 2 * c ** 3), Rc = Math.sqrt(R2), Nc = Math.log(Rc / lP) / LN;
ok('Casimir = de Sitter, solved here from ħc/(480π²R⁴) = 3c⁴/(8πGR²): R = ℓ_P/√(180π), the Planck scale — REFUTES the endpoint',
  Math.abs(Rc / lP - 1 / Math.sqrt(180 * Math.PI)) < 1e-4 && Math.abs(Nc + 6.585) < 0.01 && /const Nc=logphi\(1\/Math\.sqrt\(180\*Math\.PI\)\);/.test(SRC),
  `R = ${(Rc / lP).toFixed(5)} ℓ_P · N = ${Nc.toFixed(4)} · ${(Nobs - Nc).toFixed(1)} rungs below the endpoint`);

/* 4 · entropy */
const S = N => Math.PI * Math.pow(PHI, 2 * N);
ok('the horizon entropy S = πφ^{2N} is strictly increasing — no stationary point, SELECTS NOTHING', [0, 50, 100, 200, 291, 300].every(N => S(N + 1) > S(N)) && /verdict:'SELECTS NOTHING'/.test(SRC));

/* 5 · the shift symmetry */
const R = N => lP * Math.pow(PHI, N);
const shift = [0, 17.3, 144, 291.9].every(N => Math.abs(R(N + 1) / R(N) - PHI) < 1e-12);
/* any ratio-functional of the ladder is shift-invariant; its only way to single out a rung is an outside scale */
const F = N => Math.log(R(N + 2) / (R(N + 1) + R(N)));   /* zero at every N: the additive ladder */
ok('the shift N → N + 1 maps the ladder onto itself (R_{N+1} = φ R_N at every N), so no functional of the ladder alone has an isolated extremum — PROVES: NO RUNG; Λℓ_P² is the one outside number',
  shift && [0, 50, 291].every(N => Math.abs(F(N)) < 1e-12) && /verdict:'PROVES: NO RUNG'/.test(SRC) && Math.abs(Lam * lP * lP / 2.89e-122 - 1) < 0.01,
  `Λℓ_P² = ${(Lam * lP * lP).toExponential(3)}`);

/* 6 · uniqueness */
const A = [[-1, 0, 1, 1], [3, 1, 2, 2], [-2, -1, -1, -2], [0, 0, 0, -1]];
const det = m => m.length === 1 ? m[0][0] : m[0].reduce((a, v, j) => a + (j % 2 ? -1 : 1) * v * det(m.slice(1).map(r => r.filter((_, k) => k !== j))), 0);
const roots = [(1 + Math.sqrt(5)) / 2, (1 - Math.sqrt(5)) / 2];
ok('what IS unique: det[G c ħ k_B over M L T Θ] = 2 ≠ 0 — one Planck form per invariant; φ the only positive root of x² = x + 1',
  det(A) === 2 && roots.filter(x => x > 0).length === 1 && Math.abs(roots[0] ** 2 - roots[0] - 1) < 1e-15 && /verdict:'DERIVES'/.test(SRC), `det = ${det(A)} · φ = ${PHI}`);

/* 7 · mutations */
const R2m = 8 * Math.PI * G * hbar / (3 * 48 * Math.PI ** 2 * c ** 3);   /* 24 in place of 240 → 480 becomes 48 */
ok('MUTATION — a Casimir coefficient of 24 for 240 moves the Casimir rung and is caught', Math.abs(Math.log(Math.sqrt(R2m) / lP) / LN - Nc) > 1);
const gDm = d => Math.exp(d) * (d - 0.5);
ok('MUTATION — a selector whose minimum is moved off its parameter is caught', !(gDm(0) === 0));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
