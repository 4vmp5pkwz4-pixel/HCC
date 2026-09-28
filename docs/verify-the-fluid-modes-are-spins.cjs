#!/usr/bin/env node
'use strict';
/* ══ THE FLUID'S MODES ARE SPINS ══════════════════════════════════════════════════════════
 * S³ is the group SU(2), and its isometries are SU(2)_L × SU(2)_R acting by q ↦ α q β̄. The atlas says
 * (spin4Shell, spin4Scalar) that every Navier–Stokes curl shell E_{k,σ} is the irreducible representation
 * (k/2+1, k/2) for σ = +1 and (k/2, k/2+1) for σ = −1, and every scalar harmonic of degree n is (n/2, n/2).
 * This file does not take that on trust. It takes the shells the laboratory BUILDS numerically — the null
 * space of curl − μ on harmonic polynomials (s3nsShell) — lets the two SU(2) factors act on them, and
 * measures the CHARACTER of each action. Checks:
 *   1. the numerically built shells, k = 0…4 and both helicities, have exactly the dimension
 *      (2j_L+1)(2j_R+1), the curl eigenvalue C_L − C_R and the Stokes eigenvalue 2(C_L+C_R) − 4
 *   2. MEASURED: each shell is invariant under both factors (the least-squares residual of the acted field
 *      against the shell is at rounding level), and the trace of the left action of α = e^{θe/2} is
 *      χ_{j_L}(θ)(2j_R+1), of the right χ_{j_R}(θ)(2j_L+1), with χ_j(θ) = sin((2j+1)θ/2)/sin(θ/2) —
 *      so (j_L, j_R) are identified, not merely counted, to 1e-12 at two angles
 *   3. the Killing fields (k = 0) are (1,0) ⊕ (0,1): K₊ = e·q is fixed by the right factor, K₋ = q·e by
 *      the left — the Lie algebra of each factor, which is why the rigid part never dissipates
 *   4. the Weitzenböck law A = curl² − 4 is Casimir arithmetic: (C_L − C_R)² = 2(C_L + C_R) holds exactly
 *      when |j_L − j_R| = 1 (or both are 0) — derived here in closed form, (d² − 1)(s² − 1) = 0 — so the
 *      divergence-free fields are singled out by the representation theory itself
 *   5. the scalar dictionary: spin4Scalar(n) gives the trisphere's multiplicity (n+1)², its harmonic count
 *      C(n+3,3) − C(n+1,3), and the Laplace eigenvalue n(n+2) = 2(C_L + C_R), n = 0…12
 *   6. MUTATIONS: the helicities exchanged, and a "diagonal" guess (k/2+½, k/2+½) — each contradicts the
 *      measured characters, caught
 *   7. wiring: the flow is drawn ON the trisphere (tracers carried by nsfStep stay on S³), the laboratory
 *      shows the dictionary and relates nsflow to su2 and eig
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
let seed = 5; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const solve = (A, b) => { const n = A.length, m = b[0].length, M = A.map((r, i) => [...r, ...b[i]]);
  for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let j = c; j < n + m; j++) M[r][j] -= f * M[c][j]; } }
  return M.map((r, i) => r.slice(n).map(x => x / r[i])); };
const chi = (j, th) => Math.sin((2 * j + 1) * th / 2) / Math.sin(th / 2);

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { s3nsShell, s3nsVelocity, s3nsQMul, s3nsQConj, spin4C, spin4Shell, spin4Scalar, triFacts, nsfUniform, nsfMake, nsfStep } = K;

  /* the character of each SU(2) factor on a numerically built shell, exact by interpolation:
     the acted fields are fitted in the shell's own basis on 4·dim+20 points; if the shell is invariant the fit is exact */
  const measure = (k, s, th, axis) => {
    const sh = s3nsShell(k, s), d = sh.dim, P = nsfUniform(rnd, 4 * d + 20), al = [Math.cos(th / 2), ...axis.map(x => x * Math.sin(th / 2))];
    const ev = (b, q) => s3nsVelocity(sh, b, q), B = P.map(q => sh.basis.map(b => ev(b, q)));
    const dot = (U, V) => sh.basis.map((_, i) => sh.basis.map((_, j) => P.reduce((a, _, p) => a + U[p][i].reduce((x, y, c) => x + y * V[p][j][c], 0), 0)));
    const G = dot(B, B);
    const act = side => { const T = P.map(q => sh.basis.map(b => side === 'L' ? s3nsQMul(al, ev(b, s3nsQMul(s3nsQConj(al), q))) : s3nsQMul(ev(b, s3nsQMul(q, al)), s3nsQConj(al))));
      const C = solve(G, dot(B, T)); let tr = 0, res = 0, nrm = 0; for (let i = 0; i < d; i++) tr += C[i][i];
      for (let p = 0; p < P.length; p++) for (let j = 0; j < d; j++) for (let c = 0; c < 4; c++) { let f = 0; for (let i = 0; i < d; i++) f += C[i][j] * B[p][i][c]; res += (f - T[p][j][c]) ** 2; nrm += T[p][j][c] ** 2; }
      return { tr, res: Math.sqrt(res / nrm) }; };
    return { sh, L: act('L'), R: act('R') }; };
  const AXIS = [0.36, 0.48, 0.8], ANGLES = [1.1, 2.3];
  const M = []; for (let k = 0; k <= 4; k++) for (const s of [1, -1]) for (const th of ANGLES) M.push({ k, s, th, ...measure(k, s, th, AXIS) });

  /* 1 · dimension, curl, Stokes */
  { const bad = []; for (let k = 0; k <= 4; k++) for (const s of [1, -1]) { const sh = s3nsShell(k, s), p = spin4Shell(k, s);
      if (sh.dim !== p.dim || sh.mu !== p.curl || sh.kappa !== p.stokes || p.dim !== (2 * p.jL + 1) * (2 * p.jR + 1) || p.curl !== spin4C(p.jL) - spin4C(p.jR)) bad.push(k + ':' + s); }
    ok('the numerically built shells E_{k,σ}, k = 0…4 and both helicities, have dimension (2j_L+1)(2j_R+1), curl eigenvalue C_L − C_R and Stokes eigenvalue 2(C_L+C_R) − 4',
      bad.length === 0, bad.join(',') || [0, 1, 2, 3, 4].map(k => `k=${k}: ${s3nsShell(k, 1).dim}·μ ±${s3nsShell(k, 1).mu}·κ ${s3nsShell(k, 1).kappa}`).join(' · ')); }

  /* 2 · measured characters */
  { let worst = 0, inv = 0; for (const m of M) { const p = spin4Shell(m.k, m.s);
      worst = Math.max(worst, Math.abs(m.L.tr - chi(p.jL, m.th) * (2 * p.jR + 1)), Math.abs(m.R.tr - chi(p.jR, m.th) * (2 * p.jL + 1))); inv = Math.max(inv, m.L.res, m.R.res); }
    ok('MEASURED — each shell is invariant under SU(2)_L and SU(2)_R, and the traces of the two actions are χ_{j_L}(θ)(2j_R+1) and χ_{j_R}(θ)(2j_L+1): the representation is identified, not merely counted',
      worst < 1e-10 && inv < 1e-10, `${M.length} shell·angle cases · worst trace error ${worst.toExponential(1)} · invariance residual ≤ ${inv.toExponential(1)} · e.g. k=4 σ=+ θ=1.1: L ${M.find(m => m.k === 4 && m.s === 1).L.tr.toFixed(6)}, R ${M.find(m => m.k === 4 && m.s === 1).R.tr.toFixed(6)}`); }

  /* 3 · the Killing fields */
  { const e = [0, ...AXIS], q0 = nsfUniform(rnd, 1)[0], b = [0.6, 0, 0.8, 0], bb = s3nsQConj(b), a = [0.8, 0, 0.6, 0], ab = s3nsQConj(a);
    const Kp = q => s3nsQMul(e, q), Km = q => s3nsQMul(q, e);
    const rightOnKp = s3nsQMul(Kp(s3nsQMul(q0, b)), bb), leftOnKm = s3nsQMul(a, Km(s3nsQMul(ab, q0)));
    const d1 = Math.hypot(...rightOnKp.map((x, i) => x - Kp(q0)[i])), d2 = Math.hypot(...leftOnKm.map((x, i) => x - Km(q0)[i]));
    const k0 = M.filter(m => m.k === 0 && m.th === ANGLES[0]);
    ok('the Killing fields are (1,0) ⊕ (0,1): K₊ = e·q is fixed by the right factor and K₋ = q·e by the left (the Lie algebras of the two SU(2)), and the k = 0 shells measure 3 under the fixing factor',
      d1 < 1e-15 && d2 < 1e-15 && Math.abs(k0.find(m => m.s === 1).R.tr - 3) < 1e-10 && Math.abs(k0.find(m => m.s === -1).L.tr - 3) < 1e-10, `|R_β K₊ − K₊| = ${d1.toExponential(0)} · |L_α K₋ − K₋| = ${d2.toExponential(0)}`); }

  /* 4 · Weitzenböck as Casimir arithmetic: with d = j_L − j_R, s = j_L + j_R + 1, (C_L − C_R)² − 2(C_L + C_R) = (d² − 1)(s² − 1) */
  { let lawBad = 0, idBad = 0; const offenders = [];
    for (let a = 0; a <= 12; a++) for (let b = 0; b <= 12; b++) { const jL = a / 2, jR = b / 2, CL = spin4C(jL), CR = spin4C(jR), d = jL - jR, s = jL + jR + 1, lhs = (CL - CR) ** 2 - 2 * (CL + CR);
      if (Math.abs(lhs - (d * d - 1) * (s * s - 1)) > 1e-9) idBad++;
      const holds = Math.abs(lhs) < 1e-12, predicted = Math.abs(Math.abs(d) - 1) < 1e-12 || (a === 0 && b === 0); if (holds !== predicted) lawBad++; if (holds && !predicted) offenders.push(jL + ',' + jR); }
    let shells = 0; for (let k = 0; k <= 4; k++) for (const s of [1, -1]) { const p = spin4Shell(k, s); if (p.curl * p.curl - 4 !== p.stokes) shells++; }
    ok('the Weitzenböck law A = curl² − 4 IS Casimir arithmetic: (C_L − C_R)² − 2(C_L + C_R) = (d² − 1)(s² − 1), so curl² = Laplacian holds exactly for |j_L − j_R| = 1 — the spins of the divergence-free fields',
      lawBad === 0 && idBad === 0 && shells === 0, `169 spin pairs · identity misses ${idBad} · law misses ${lawBad} · shells with μ² − 4 ≠ κ: ${shells}`); }

  /* 5 · the scalar dictionary */
  { const bad = []; for (let n = 0; n <= 12; n++) { const s = spin4Scalar(n), f = triFacts(1, n, 0.7);
      if (s.dim !== f.multiplicity || s.dim !== f.harmonicDim || Math.abs(s.laplace - f.laplaceEigen) > 1e-12 || s.jL !== n / 2 || s.jR !== n / 2) bad.push(n); }
    ok('the scalar harmonics of degree n are (n/2, n/2): spin4Scalar gives the trisphere\'s multiplicity (n+1)², its harmonic count C(n+3,3) − C(n+1,3) and the Laplace eigenvalue n(n+2) = 2(C_L + C_R), n = 0…12',
      bad.length === 0, bad.join(',') || `n=12: dim ${spin4Scalar(12).dim}, λ ${spin4Scalar(12).laplace}`); }

  /* 6 · mutations */
  { const swapped = M.filter(m => m.k > 0).some(m => { const p = spin4Shell(m.k, -m.s); return Math.abs(m.L.tr - chi(p.jL, m.th) * (2 * p.jR + 1)) > 1e-3; });
    const diag = M.filter(m => m.k > 0).some(m => { const j = m.k / 2 + 0.5; return Math.abs(m.L.tr - chi(j, m.th) * (2 * j + 1)) > 1e-3; });
    ok('MUTATIONS — the helicities exchanged, or a diagonal guess (k/2+½, k/2+½) of nearly the same dimension ((k+2)² against (k+1)(k+3)), contradicts the measured characters: caught', swapped && diag); }

  /* 7 · wiring */
  { const F = nsfMake(1, 1, 20260928, 0.55, 3.2, 0.01); let q = nsfUniform(rnd, 1)[0], t = 0, drift = 0; for (let i = 0; i < 400; i++) { q = nsfStep(F, t, q, 0.05); t += 0.05; drift = Math.max(drift, Math.abs(Math.hypot(...q) - 1)); }
    ok('wiring: the flow is drawn on the trisphere (tracers carried by nsfStep stay on S³), the laboratory tabulates the dictionary and relates nsflow to su2 and eig',
      drift < 1e-9 && /name='tri-ns-flow'|name="tri-ns-flow"|'tri-ns-flow'/.test(SRC) && /state\.triFlow===true/.test(SRC) && /data-triflow="1"/.test(SRC)
      && /Every mode is a representation of Spin\(4\)/.test(SRC) && /\['nsflow','su2','representation'/.test(SRC) && /\['nsflow','eig','invariant'/.test(SRC)
      && /if\(b\.dataset\.nsfgo==='tri'\) state\.triFlow=true;/.test(SRC), `|q| drift after 400 steps ${drift.toExponential(1)}`); }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
