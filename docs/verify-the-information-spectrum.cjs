#!/usr/bin/env node
'use strict';
/* ══ THE OPERATIONAL INFORMATION SPECTRUM OF HIDDEN GEOMETRY (v4.400) ═══════════════════════════════════════════════════
 * A. Preece and B. Batenin, "The Operational Information Spectrum of Hidden Geometry" (20 October 2026; a working preprint,
 * not refereed). X ~ N(0, I + εA_g), g unknown in a compact group, against N(0, I). Checked here by running the page's own
 * pure code, and against computations it does not use:
 *   1. Theorem 1 — the determinant average over the six permutations equals the manuscript's closed form to rounding, and
 *      its numbers: χ²(0.4) = 0.01527957335, Bayes accuracy ≤ 0.53090
 *   2. Theorem 2 — the spectrum: 7/12, 33/64, 743/1536 with every odd term zero; every term ≥ 0 and every partial sum below
 *      the total, for five groups and random anisotropies; and each term equals c_n‖M_n‖² of the symmetrised orbit tensor
 *      built explicitly (ranks 2, 4, 6)
 *   3. Gauss–Hermite quadrature of the mixture density (60³ nodes) gives the same χ², and the joint experiment with a
 *      label of reliability α gives Theorem 3 — 0.04331103209 at α = 0.4
 *   4. the leading KL, (3/16)ε⁴‖M₂‖² = 7/24 ε⁴, against KL computed by quadrature at small ε
 *   5. the instrument: white noise n by quadrature against the noisy null equals χ²(ε/(1+n)); a mask and eight signs only
 *      lower χ² (and the signs erase it here)
 *   6. SO(3): the Euler product rule integrates every term exactly (two rules agree), the sky's representation matrices
 *      are orthogonal and a homomorphism, and Schur's twirl is (tr A/d)·I at ℓ = 1, 2, 3
 *   7. a finite rotation group gives SO(3)'s certificates while 2n is below its first invariant spin — T and O depart at
 *      n = 2, the icosahedral group at n = 3 — and the laboratory is wired, with the scope stated in its words
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
try {
  const a = SRC.indexOf('/* ══ THE OPERATIONAL INFORMATION SPECTRUM OF HIDDEN GEOMETRY (v4.400)'), b = SRC.indexOf('/* ── the laboratory: six stations over two cached computations');
  if (a < 0 || b < a) throw new Error('the pure block of the laboratory is missing');
  const K = new Function(SRC.slice(a, b) + '\nreturn {oisMul,oisTrans,oisConj,oisDet,oisRot,oisFinGroup,oisSO3Rule,oisOrbit,oisChi2,oisSeries,oisSpectrum,oisC,oisChi2Known,oisChi2Ref,oisBayes,oisSixClosed,oisTwirl,oisMaskChi2,oisSignChi2,oisDl,oisS2Rule,oisSkyOrbit,oisSkyA,oisNorm,OIS_SKY_N};')();
  const A = Float64Array.from([1, 0, 0, 0, -1, 0, 0, 0, 0]), perm = K.oisOrbit('perm');
  /* 1 */
  { let worst = 0; for (const e of [0.05, 0.2, 0.4, 0.6, 0.8, 0.9]) worst = Math.max(worst, Math.abs(K.oisChi2(A, perm, e, 3) - K.oisSixClosed(e * e)));
    const c4 = K.oisChi2(A, perm, 0.4, 3), acc = K.oisBayes(c4), orders = ['perm', 'T', 'O', 'I'].map(g => K.oisFinGroup(g).length);
    ok('Theorem 1: the determinant average over the six permutations is the manuscript’s closed form to rounding, χ²(0.4) = 0.01527957335 and the Bayes accuracy ≤ 0.53090; the groups have orders 6, 12, 24, 60',
      worst < 1e-14 && Math.abs(c4 - 0.01527957335) < 5e-12 && Math.abs(acc - 0.5309) < 5e-6 && orders.join() === '6,12,24,60',
      `|Th.1 − closed| ≤ ${worst.toExponential(1)} on six ε · χ²(0.4) = ${c4.toFixed(11)} · accuracy ≤ ${acc.toFixed(5)} · orders ${orders.join(', ')}`); }
  /* 2 */
  const rnd = (() => { let s = 77; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  const randA = () => { const l = [rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1], R = K.oisRot([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5], 6.28 * rnd()); return K.oisConj(R, Float64Array.from([l[0], 0, 0, 0, l[1], 0, 0, 0, l[2]]), 3); };
  { const B = K.oisSpectrum(A, perm, 3, 12), exact = Math.abs(B[2] - 7 / 12) < 1e-14 && Math.abs(B[4] - 33 / 64) < 1e-14 && Math.abs(B[6] - 743 / 1536) < 1e-14, odd = [1, 3, 5, 7, 9, 11].every(n => Math.abs(B[n]) < 1e-15);
    let neg = 0, over = 0, cases = 0, worstGap = 0;
    for (const g of ['perm', 'T', 'O', 'I', 'SO3']) { const orb = K.oisOrbit(g); for (let t = 0; t < 4; t++) { const M = t ? randA() : A, Bs = K.oisSpectrum(M, orb, 3, 12); for (const e of [0.3, 0.6, 0.85]) { cases++;
          const tot = K.oisChi2(M, orb, e, 3); let S = 0; for (let n = 1; n <= 12; n++) { const term = Bs[n] * Math.pow(e, 2 * n); if (term < -1e-15 * Math.max(tot, 1e-12)) neg++; S += term; if (S > tot * (1 + 1e-10) + 1e-16) over++; }
          if (e === 0.3) worstGap = Math.max(worstGap, Math.abs(tot - S) / tot); } } }
    ok('Theorem 2: the spectrum is 7/12, 33/64, 743/1536 with every odd term zero; for five groups and random anisotropies every term is ≥ 0 and every partial sum stays below the exact total, which it reaches',
      exact && odd && !neg && !over && worstGap < 1e-9, `the manuscript’s three coefficients ${exact ? '✓' : '✗'} · odd terms 0 ${odd ? '✓' : '✗'} · ${cases} cases: negative terms ${neg}, partial sums over the total ${over} · gap at ε = 0.3 after 12 terms ≤ ${worstGap.toExponential(1)}`); }
  /* 2b — the symmetrised orbit tensors themselves */
  { const perms = n => { if (n === 1) return [[0]]; const out = []; for (const p of perms(n - 1)) for (let i = 0; i <= p.length; i++) { const q = p.slice(); q.splice(i, 0, n - 1); out.push(q); } return out; };
    const tensor = (M, orb, n) => { const r = 2 * n, D = Math.pow(3, r), T = new Float64Array(D), mats = orb.U.map(U => K.oisConj(U, M, 3)), P = perms(r);
      for (let idx = 0; idx < D; idx++) { let x = idx; const ii = []; for (let k = 0; k < r; k++) { ii.push(x % 3); x = Math.floor(x / 3); } let s = 0; for (let g = 0; g < mats.length; g++) { let p = orb.W[g]; for (let k = 0; k < n; k++) p *= mats[g][ii[2 * k] * 3 + ii[2 * k + 1]]; s += p; } T[idx] = s; }
      let n2 = 0; for (let idx = 0; idx < D; idx++) { let x = idx; const ii = []; for (let k = 0; k < r; k++) { ii.push(x % 3); x = Math.floor(x / 3); } let s = 0; for (const p of P) { let j = 0, m = 1; for (let k = 0; k < r; k++) { j += ii[p[k]] * m; m *= 3; } s += T[j]; } s /= P.length; n2 += s * s; }
      return K.oisC(n) * n2; };
    let worst = 0, cnt = 0; const tilt = randA();
    for (const [g, M] of [['perm', A], ['T', A], ['I', A], ['O', tilt], ['T', tilt]]) { const orb = K.oisOrbit(g), B = K.oisSpectrum(M, orb, 3, 3); for (const n of [1, 2, 3]) { worst = Math.max(worst, Math.abs(tensor(M, orb, n) - B[n])); cnt++; } }
    ok('and each term IS c_n‖M_n‖² of the symmetrised orbit tensor, built entry by entry for ranks 2, 4 and 6 — not merely a coefficient of the same series',
      worst < 1e-12, `${cnt} comparisons on four groups and two anisotropies · worst ${worst.toExponential(1)}`); }
  /* 3, 4, 5 — Gauss–Hermite: the mixture density, the labelled experiment, KL and the noisy instrument */
  const gh = n => { const x = new Float64Array(n), w = new Float64Array(n); let z0 = 0, z1 = 0, z2 = 0;
    for (let i = 0; i < n; i++) { let z = i === 0 ? Math.sqrt(2 * n + 1) - 1.85575 * Math.pow(2 * n + 1, -1 / 6) : i === 1 ? z0 - 1.14 * Math.pow(n, 0.426) / z0 : i === 2 ? 1.86 * z1 - 0.86 * z0 : i === 3 ? 1.91 * z2 - 0.91 * z1 : 2 * x[i - 1] - x[i - 2];
      if (i === 0) z0 = z; if (i === 1) z1 = z; if (i === 2) z2 = z; let pp = 0;
      for (let it = 0; it < 200; it++) { let p1 = Math.pow(Math.PI, -0.25), p2 = 0; for (let j = 1; j <= n; j++) { const p3 = p2; p2 = p1; p1 = z * Math.sqrt(2 / j) * p2 - Math.sqrt((j - 1) / j) * p3; } pp = Math.sqrt(2 * n) * p2; const dz = p1 / pp; z -= dz; if (Math.abs(dz) < 1e-15) break; }
      x[i] = z; w[i] = 2 / (pp * pp); }
    return { x: Array.from(x, v => v * Math.SQRT2), w: Array.from(w, v => v / Math.sqrt(Math.PI)) }; };   /* ∫f(y)e^{−y²/2}/√(2π)dy */
  const inv3 = C => { const [a, b, c, d, e, f, g, h, i] = C, det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g); return { det, I: [(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det, (f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det, (d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det] }; };
  /* integrate F(L₁ … L_m, the null density ratio) against the null N(0, σ₀²I), drawing from N(0, s²I) */
  const quad = (orb, M, eps, s0sq, s2, n, F) => { const R = gh(n), s = Math.sqrt(s2), cov = orb.U.map(U => { const C = K.oisConj(U, M, 3); for (let j = 0; j < 9; j++) C[j] = (j % 4 === 0 ? s0sq : 0) + eps * C[j]; return inv3(C); });
    let tot = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) { const x = [R.x[i] * s, R.x[j] * s, R.x[k] * s], r2 = x[0] * x[0] + x[1] * x[1] + x[2] * x[2], w = R.w[i] * R.w[j] * R.w[k];
      const L = cov.map(v => { const I = v.I, q = x[0] * (I[0] * x[0] + I[1] * x[1] + I[2] * x[2]) + x[1] * (I[3] * x[0] + I[4] * x[1] + I[5] * x[2]) + x[2] * (I[6] * x[0] + I[7] * x[1] + I[8] * x[2]); return Math.exp(-0.5 * (q - r2 / s0sq)) * Math.pow(s0sq, 1.5) / Math.sqrt(v.det); });
      tot += w * Math.pow(s2 / s0sq, 1.5) * Math.exp(-0.5 * r2 * (1 / s0sq - 1 / s2)) * F(L); }
    return tot; };
  { const m = perm.U.length, alpha = 0.4, chi = quad(perm, A, 0.4, 1, 1.5, 60, L => { const Lb = L.reduce((p, q) => p + q, 0) / m; return (Lb - 1) * (Lb - 1); });
    const ref = quad(perm, A, 0.4, 1, 1.5, 60, L => { const Lb = L.reduce((p, q) => p + q, 0) / m; let r = 0; for (let z = 0; z < m; z++) { const Lz = alpha * L[z] + (1 - alpha) * Lb - 1; r += Lz * Lz / m; } return r; });
    const th3 = K.oisChi2Ref(K.oisChi2(A, perm, 0.4, 3), K.oisChi2Known(A, 0.4, 3), alpha), known = K.oisChi2Known(A, 0.4, 3);
    ok('Gauss–Hermite quadrature of the mixture density (60³ nodes) gives the same χ², and the joint experiment with a label of reliability 0.4 gives Theorem 3, 0.04331103209; the known frame gives ε²/(1−ε²)',
      Math.abs(chi - 0.01527957335) < 5e-11 && Math.abs(ref - th3) < 5e-11 && Math.abs(th3 - 0.04331103209) < 5e-11 && Math.abs(known - 0.16 / 0.84) < 1e-14,
      `quadrature χ² = ${chi.toFixed(12)} · joint χ² = ${ref.toFixed(12)} against (1 − α²)χ²_blind + α²χ²_known = ${th3.toFixed(12)} · known ${known.toFixed(12)}`); }
  { const rs = []; for (const e of [0.02, 0.05]) { const m = perm.U.length, kl = quad(perm, A, e, 1, 1.0, 36, L => { const Lb = L.reduce((p, q) => p + q, 0) / m; return Lb * Math.log(Lb); }); rs.push(kl / (7 / 24 * Math.pow(e, 4))); }
    const lead = K.oisSpectrum(A, perm, 3, 2)[2] / K.oisC(2) * 3 / 16;
    ok('the leading KL is (3/16)ε⁴‖M₂‖² = 7/24·ε⁴, against KL computed by quadrature: the ratio tends to 1 as ε → 0',
      Math.abs(lead - 7 / 24) < 1e-14 && Math.abs(rs[1] - 1) < 0.01 && Math.abs(rs[0] - 1) < Math.abs(rs[1] - 1) + 1e-6, `(3/16)‖M₂‖² = ${lead.toFixed(12)} = 7/24 · KL/(7ε⁴/24) = ${rs.map(x => x.toFixed(6)).join(' at ε = 0.02, ')} at ε = 0.05`); }
  { const m = perm.U.length, rows = []; let bad = 0;
    for (const n of [0.5, 1.5]) { const q = quad(perm, A, 0.4, 1 + n, 1.5 * (1 + n), 50, L => { const Lb = L.reduce((p, q) => p + q, 0) / m; return (Lb - 1) * (Lb - 1); }), law = K.oisChi2(A, perm, 0.4 / (1 + n), 3); rows.push(`n = ${n}: ${q.toExponential(9)} = ${law.toExponential(9)}`); if (Math.abs(q - law) > 1e-10 * Math.max(1, law) + 1e-14) bad++; }
    const B2 = K.oisSpectrum(A, perm, 3, 2)[2], quart = [0, 1, 2].every(n => Math.abs(K.oisSpectrum(K.oisConj(K.oisRot([0, 0, 1], 0), A.map(v => v / (1 + n)), 3), perm, 3, 2)[2] - B2 / Math.pow(1 + n, 4)) < 1e-14);
    let up = 0, cnt = 0; for (const g of ['perm', 'T', 'O', 'I']) { const orb = K.oisOrbit(g); for (let t = 0; t < 3; t++) { const M = t ? randA() : A; for (const e of [0.4, 0.8]) { const tot = K.oisChi2(M, orb, e, 3);
          for (const S of [[0, 1], [2], [0, 2]]) { cnt++; if (K.oisMaskChi2(M, orb, e, S) > tot * (1 + 1e-12)) up++; } cnt++; if (K.oisSignChi2(M, orb, e) > tot * (1 + 1e-12)) up++; } } }
    const erased = K.oisSignChi2(A, perm, 0.4) < 1e-15;
    ok('the instrument: white noise n by quadrature against the noisy null equals χ²(ε/(1+n)) and the quartic term falls as (1+n)⁻⁴; masks and eight signs never raise χ², and the signs erase this signal entirely',
      !bad && quart && !up && erased, `${rows.join(' · ')} · (1+n)⁻⁴ ${quart ? '✓' : '✗'} · ${cnt} instruments, none above the total ${up ? '✗ ' + up : '✓'} · signs on the manuscript’s orbit: χ² = 0 ${erased ? '✓' : '✗'}`); }
  /* 6 */
  { const B26 = K.oisSpectrum(A, K.oisOrbit('SO3'), 3, 12); const R2 = K.oisSO3Rule(34, 17), orb2 = { U: R2.R, W: R2.W }, Bb = K.oisSpectrum(A, orb2, 3, 12);
    let dB = 0; for (let n = 1; n <= 12; n++) dB = Math.max(dB, Math.abs(B26[n] - Bb[n]));
    let orth = 0, hom = 0, schur = 0; for (const l of [1, 2, 3]) { const d = 2 * l + 1, R1 = K.oisRot([0.3, 0.5, 0.8], 1.1), Rb = K.oisRot([0.9, -0.2, 0.4], 2.3), U1 = K.oisDl(l, R1), U2 = K.oisDl(l, Rb), U12 = K.oisDl(l, K.oisMul(R1, Rb, 3)), P = K.oisMul(U1, U2, d), UU = K.oisMul(U1, K.oisTrans(U1, d), d);
      for (let i = 0; i < d * d; i++) { orth = Math.max(orth, Math.abs(UU[i] - (i % (d + 1) === 0 ? 1 : 0))); hom = Math.max(hom, Math.abs(P[i] - U12[i])); }
      const orb = K.oisSkyOrbit(l); for (const kind of ['axial', 'random', 'trace']) { const As = K.oisSkyA(l, kind), T = K.oisTwirl(As, orb, d); let tr = 0; for (let i = 0; i < d; i++) tr += As[i * d + i]; for (let i = 0; i < d * d; i++) schur = Math.max(schur, Math.abs(T[i] - (i % (d + 1) === 0 ? tr / d : 0))); } }
    const lS = 3, oS = K.oisSkyOrbit(lS), AS = K.oisSkyA(lS, 'random'), BS = K.oisSpectrum(AS, oS, 7, K.OIS_SKY_N), RS = K.oisSO3Rule(2 * K.OIS_SKY_N * lS + 8, K.OIS_SKY_N * lS + 4), oS2 = { U: RS.R.map(M => K.oisDl(lS, M)), W: RS.W }, BS2 = K.oisSpectrum(AS, oS2, 7, K.OIS_SKY_N);
    let dS = 0; for (let n = 1; n <= K.OIS_SKY_N; n++) dS = Math.max(dS, Math.abs(BS[n] - BS2[n]));
    ok('SO(3): the Euler product rule integrates every term exactly — a larger rule agrees to rounding, for R³ and for the ℓ = 3 sky with a random pattern; the sky’s representation matrices are orthogonal and a homomorphism; Schur’s twirl is (tr A/d)·I at ℓ = 1, 2, 3',
      dB < 1e-13 && dS < 1e-12 && orth < 1e-13 && hom < 1e-13 && schur < 1e-12, `R³: |ΔB| ≤ ${dB.toExponential(1)} · sky ℓ = 3: |ΔB| ≤ ${dS.toExponential(1)} · orthogonal ${orth.toExponential(1)} · homomorphism ${hom.toExponential(1)} · Schur ${schur.toExponential(1)}`); }
  /* 7 */
  { const so = K.oisSpectrum(A, K.oisOrbit('SO3'), 3, 6), first = g => { const B = K.oisSpectrum(A, K.oisOrbit(g), 3, 6); for (let n = 1; n <= 6; n++) if (Math.abs(B[n] - so[n]) > 1e-12) return n; return 7; };
    const dep = { T: first('T'), O: first('O'), I: first('I') }, jmin = { T: 3, O: 4, I: 6 }, law = Object.keys(dep).every(g => 2 * (dep[g] - 1) < jmin[g] && 2 * dep[g] >= jmin[g]);
    const so2 = Math.abs(so[2] - 2 / 15) < 1e-14, ico3 = Math.abs(K.oisSpectrum(A, K.oisOrbit('I'), 3, 3)[3] - 0.08203125) < 1e-12;
    const decl = /\{id:'ois', category:'geom', domain:'astro', cluster:'astro', predictionClass:'exact',/.test(SRC) && /id:'ois', world:'s3', lab:'ois',/.test(SRC) && /verifiers:\['docs\/verify-the-information-spectrum\.cjs'\]/.test(SRC);
    const rel = ["['ois','s3gamma','representation'", "['ois','cmb','exact'", "['ois','hopf','representation'", "['ois','syd','exact'", "['ois','chmem','contrast'"].every(k => { const i = SRC.indexOf(k); if (i < 0) return false; const line = SRC.slice(i, SRC.indexOf('\n', i)); return /','[a-z-]+'\],$/.test(line); });
    const wired = SRC.includes("oisGroup.visible = (v==='ois');") && SRC.includes("if(v==='ois'&&!oisObjs){ oisSetup(); }") && SRC.includes("else if(V==='ois') body = oisPanelHTML();") && SRC.includes("if(V==='ois'){ oisBind(ctl); }") && SRC.includes("fbsAnimT+=labDt; oisTick(labDt);") && SRC.includes("'chmem','ois','discover']") && SRC.includes("labStageFrame(O,dt,oisGroup,OIS_DREF);");
    const words = ['These are finite-dimensional theorems: not a measured discovery, not a quantum-gravity dynamics, not a priority claim', 'quoted, not reproduced here', 'in Pearson χ², not in KL or accuracy', 'Это конечномерные теоремы', 'приводится, здесь не воспроизводится'].filter(w => !SRC.includes(w));
    ok('a finite rotation group has SO(3)’s certificates while 2n is below its first invariant spin — T and O depart at n = 2, the icosahedral group at n = 3 (SO(3)’s quartic certificate 2/15, the icosahedral sextic 21/256) — and the laboratory is declared, contracted, related, wired, and says what it is not',
      law && so2 && ico3 && decl && rel && wired && !words.length, `first departure T ${dep.T}, O ${dep.O}, I ${dep.I} for j = 3, 4, 6 ${law ? '✓' : '✗'} · 2/15 ${so2 ? '✓' : '✗'} · 21/256 ${ico3 ? '✓' : '✗'} · declared ${decl ? '✓' : '✗'} · five typed relations ${rel ? '✓' : '✗'} · wired ${wired ? '✓' : '✗'}${words.length ? ' · missing: ' + words.join(' | ') : ' · scope in two languages ✓'}`); }
} catch (e) { fail++; console.log('  FAIL — verifier error: ' + (e && e.stack || e)); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
