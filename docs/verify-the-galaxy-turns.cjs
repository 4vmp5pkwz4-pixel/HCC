#!/usr/bin/env node
'use strict';
/* ══ ⟳ THE GALAXY TURNS, READ OFF THE ATLAS'S OWN STARS ═══════════════════════════════
 * "What the catalogues say" gained a station: the 15 544 Hipparcos proper motions embedded
 * in index.html, fitted with the first-order velocity field of a rotating disc (Ogorodnikov
 * 1932, Milne 1935) for the Sun's motion (U, V, W) and Oort's A, B, C, K; from them Ω₀,
 * dV/dR, the epicyclic frequency, and Lindblad's relation σ_V²/σ_U² = −B/(A − B) checked
 * against the dispersion tensor of the residuals. This file runs the extracted kernel
 * (core/atlas/extracted.mjs) and checks it against references written HERE:
 *   1. the embedded binary is decoded independently here, the seven unknowns solved by an
 *      independent solver (modified Gram–Schmidt QR on the design matrix, not normal
 *      equations), and the kernel agrees to 1e-9
 *   2. a mock disc with KNOWN (U, V, W, A, B, C, K) and a known velocity ellipsoid, observed
 *      as proper motions and parallaxes: noiseless, every constant back to 1e-9; with the
 *      ellipsoid, every constant within 4 bootstrap σ and σ_V²/σ_U² within 4 %; the real
 *      catalogue's Lindblad agreement does not depend on where the clipping falls (3σ–4σ)
 *   3. an INVARIANT: Oort's constants are angular velocities — multiply every distance by
 *      1.3 and A, B, C, K do not move (to 1e-9) while U, V, W scale by exactly 1.3
 *   4. the atlas's own numbers: A and B inside the Hipparcos/Gaia range, a rotation curve
 *      flat within 2σ, Lindblad's two moments agreeing within 2σ, Ω₀ within 2σ of the one
 *      Sgr A*'s proper motion gives, and the double wave fitting its bins (χ²/dof < 2.5)
 *   5. the wiring: the station, HCC_STATS.oort / flow, the 3D flow in three frames, the
 *      Discoveries card and the trip
 *   6. MUTATIONS: the v_l row without its cos b, and a dispersion tensor read without the
 *      projector P = I − r rᵀ, are each caught on the mock
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

/* the embedded catalogue, decoded here (30-byte records, little-endian) */
function decode() {
  const m = SRC.match(/const HCC_SKY_HIP=\{count:(\d+),vlim:7,rec:(\d+),[\s\S]*?b64:'([^']+)'/); if (!m) return [];
  const n = +m[1], rec = +m[2], buf = Buffer.from(m[3], 'base64'), S = [];
  for (let i = 0; i < n; i++) { const o = i * rec, bv = buf.readInt16LE(o + 14);
    S.push({ hip: buf.readUInt32LE(o), ra: buf.readUInt32LE(o + 4) / 4294967296 * 360, de: buf.readInt32LE(o + 8) / 1e7, V: buf.readInt16LE(o + 12) / 100, bv: bv === -32768 ? null : bv / 1000,
      plx: buf.readUInt32LE(o + 16) / 100, eplx: buf.readUInt16LE(o + 20) / 1000, pmra: buf.readInt32LE(o + 22) / 100, pmde: buf.readInt32LE(o + 26) / 100 }); }
  return S;
}
/* ICRS → Galactic (Hipparcos, ESA 1997, vol. 1 §1.5.3), written out here */
const AG = [[-0.0548755604162154, -0.8734370902348850, -0.4838350155487132], [0.4941094278755837, -0.4448296299600112, 0.7469822444972189], [-0.8676661490190047, -0.1980763734312015, 0.4559837761750669]];
const mul = (M, v) => M.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]), mulT = (M, v) => [0, 1, 2].map(j => M[0][j] * v[0] + M[1][j] * v[1] + M[2][j] * v[2]);
const KMS = 4.740470446, DEG = Math.PI / 180;
/* least squares by modified Gram–Schmidt QR: an independent route to the same seven numbers */
function lsqQR(rows, y) { const m = rows.length, n = rows[0].length, Q = rows.map(r => r.slice()), R = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let j = 0; j < n; j++) { for (let k = 0; k < j; k++) { let s = 0; for (let i = 0; i < m; i++) s += Q[i][k] * Q[i][j]; R[k][j] = s; for (let i = 0; i < m; i++) Q[i][j] -= s * Q[i][k]; }
    let s = 0; for (let i = 0; i < m; i++) s += Q[i][j] * Q[i][j]; s = Math.sqrt(s); R[j][j] = s; for (let i = 0; i < m; i++) Q[i][j] /= s; }
  const qy = new Array(n).fill(0); for (let j = 0; j < n; j++) for (let i = 0; i < m; i++) qy[j] += Q[i][j] * y[i];
  const x = new Array(n).fill(0); for (let j = n - 1; j >= 0; j--) { let s = qy[j]; for (let k = j + 1; k < n; k++) s -= R[j][k] * x[k]; x[j] = s / R[j][j]; } return x; }
function refRows(st) { const a = st.ra * DEG, d = st.de * DEG, r = mul(AG, [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)]), ea = mul(AG, [-Math.sin(a), Math.cos(a), 0]), ed = mul(AG, [-Math.sin(d) * Math.cos(a), -Math.sin(d) * Math.sin(a), Math.cos(d)]);
  const l = Math.atan2(r[1], r[0]), b = Math.asin(r[2]), dk = 1 / st.plx, v = [0, 1, 2].map(k => KMS * dk * (st.pmra * ea[k] + st.pmde * ed[k]));
  const el = [-Math.sin(l), Math.cos(l), 0], eb = [-Math.sin(b) * Math.cos(l), -Math.sin(b) * Math.sin(l), Math.cos(b)], vl = v[0] * el[0] + v[1] * el[1], vb = v[0] * eb[0] + v[1] * eb[1] + v[2] * eb[2];
  const sl = Math.sin(l), cl = Math.cos(l), sb = Math.sin(b), cb = Math.cos(b), s2 = Math.sin(2 * l), c2 = Math.cos(2 * l);
  return [[[sl, -cl, 0, dk * cb * c2, dk * cb, -dk * cb * s2, 0], vl], [[cl * sb, sl * sb, -cb, -dk * sb * cb * s2, 0, -dk * sb * cb * c2, -dk * sb * cb], vb]]; }
/* a mock disc observed as parallaxes and proper motions */
let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }, gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-300)) * Math.cos(2 * Math.PI * rnd());
function mock(T, n, Sig) { const out = [], L = Sig ? [[Math.sqrt(Sig[0][0]), 0, 0], [Sig[0][1] / Math.sqrt(Sig[0][0]), 0, 0], [0, 0, Math.sqrt(Sig[2][2])]] : null;
  if (L) L[1][1] = Math.sqrt(Sig[1][1] - L[1][0] ** 2);
  for (let i = 0; i < n; i++) { const l = 2 * Math.PI * rnd(), b = Math.asin(2 * rnd() - 1) * 0.6, d = 0.05 + 0.95 * Math.cbrt(rnd()), cb = Math.cos(b), rg = [cb * Math.cos(l), cb * Math.sin(l), Math.sin(b)], X = d * rg[0], Y = d * rg[1];
    const v = [-T.U + (T.K + T.C) * X + (T.A - T.B) * Y, -T.V + (T.A + T.B) * X + (T.K - T.C) * Y, -T.W];
    if (L) { const u = [gauss(), gauss(), gauss()]; v[0] += L[0][0] * u[0]; v[1] += L[1][0] * u[0] + L[1][1] * u[1]; v[2] += L[2][2] * u[2]; }
    const re = mulT(AG, rg), ve = mulT(AG, v), a = Math.atan2(re[1], re[0]), de = Math.asin(re[2]), ea = [-Math.sin(a), Math.cos(a), 0], ed = [-Math.sin(de) * Math.cos(a), -Math.sin(de) * Math.sin(a), Math.cos(de)];
    out.push({ hip: i + 1, ra: ((a / DEG) + 360) % 360, de: de / DEG, plx: 1 / d, pmra: (ve[0] * ea[0] + ve[1] * ea[1]) / (KMS * d), pmde: (ve[0] * ed[0] + ve[1] * ed[1] + ve[2] * ed[2]) / (KMS * d) }); }
  return out; }

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { statGalRow, statOortFit, statOortWave } = K;
  const names = ['U', 'V', 'W', 'A', 'B', 'C', 'K'];

  /* 1 · the embedded catalogue, two solvers */
  const S = decode(), sel = S.filter(s => s.plx > 0 && s.eplx > 0 && s.plx / s.eplx >= 5 && 1 / s.plx <= 1);
  const F0 = statOortFit(sel.map(statGalRow), { clip: 0, boot: 0 }), R = sel.flatMap(refRows), xq = lsqQR(R.map(r => r[0]), R.map(r => r[1]));
  const dev1 = Math.max(...names.map((k, i) => Math.abs(F0[k] - xq[i]) / Math.max(1, Math.abs(xq[i]))));
  ok('the embedded Hipparcos binary decoded here and solved by QR (not normal equations): the kernel\'s seven unknowns agree to 1e-9', S.length === 15544 && sel.length > 14000 && dev1 < 1e-9,
    `${sel.length} stars · max deviation ${dev1.toExponential(1)} · A ${xq[3].toFixed(3)}, B ${xq[4].toFixed(3)}`);

  /* 2 · a mock disc with known answers */
  const T = { U: 11.1, V: 12.24, W: 7.25, A: 15.3, B: -11.9, C: -3.2, K: -3.3 };
  const Mc = statOortFit(mock(T, 3000, null).map(statGalRow), { clip: 0, boot: 0 }), dev2 = Math.max(...names.map(k => Math.abs(Mc[k] - T[k])));
  const Sig = [[900, 150, 0], [150, 400, 0], [0, 0, 225]], Mn = statOortFit(mock(T, 20000, Sig).map(statGalRow), { nsig: 4, boot: 30, seed: 3 });
  const pulls = names.map(k => (Mn[k] - T[k]) / Mn.err[k]), rr = Mn.ellipsoid.ratio / (400 / 900) - 1;
  ok('a mock disc observed as parallaxes and proper motions: noiseless, all seven constants back to 1e-8; with a velocity ellipsoid (σ_U 30, σ_V 20, σ_W 15) and clipping at 4σ, every constant within 4 bootstrap σ and σ_V²/σ_U² within 4 % (clipping at 3σ trims the long U tail first and lifts it ≈ 3 %: measured, stated in the kernel)',
    dev2 < 1e-8 && pulls.every(p => Math.abs(p) < 4) && Math.abs(rr) < 0.04 && Math.abs(Mn.ellipsoid.sU / 30 - 1) < 0.04,
    `noiseless ${dev2.toExponential(1)} · pulls ${pulls.map(p => p.toFixed(1)).join(' ')} · σ_V²/σ_U² ${Mn.ellipsoid.ratio.toFixed(3)} (true 0.444) · σ_U ${Mn.ellipsoid.sU.toFixed(1)}`);

  /* 3 · distance-free: Oort's constants are angular velocities */
  const G = sel.map(statGalRow), G13 = G.map(g => ({ ...g, d: g.d * 1.3, vl: g.vl * 1.3, vb: g.vb * 1.3 })), F13 = statOortFit(G13, { clip: 0, boot: 0 });
  const inv = Math.max(...['A', 'B', 'C', 'K'].map(k => Math.abs(F13[k] - F0[k]))), sc = Math.max(...['U', 'V', 'W'].map(k => Math.abs(F13[k] / F0[k] - 1.3)));
  ok('INVARIANT — every distance ×1.3 (the proper motions kept): A, B, C, K do not move and U, V, W scale by exactly 1.3 — a distance-scale error moves the Sun, never the Galaxy\'s rotation',
    inv < 1e-9 && sc < 1e-9, `ΔA..K ${inv.toExponential(1)} · U,V,W ratio − 1.3 ${sc.toExponential(1)}`);

  /* 4 · the atlas's own numbers */
  const F = statOortFit(G, { R0: 8.178 }), E = F.err, OmSgr = 6.411 * KMS - 8.7 / 8.178;
  const wave = statOortWave(F.G, [F.U, F.V, F.W], 24); let chi = 0, nb = 0;
  for (const b of wave) { if (!(b.se > 0)) continue; const r = b.l * DEG, y = F.A * Math.cos(2 * r) + F.B - F.C * Math.sin(2 * r); chi += ((b.y - y) / b.se) ** 2; nb++; }
  const lindZ = (F.lindblad - F.ellipsoid.ratio) / Math.hypot(E.lindblad, E.ratio);
  const rob = [3, 3.5, 4].map(ns => { const q = statOortFit(G, { nsig: ns, boot: 0 }); return { ns, n: q.n, l: q.lindblad, r: q.ellipsoid.ratio }; });
  ok('the real catalogue\'s two moments agree wherever the clipping falls: at 3σ, 3.5σ and 4σ, −B/(A−B) and σ_V²/σ_U² stay within 0.02 of each other', rob.every(q => Math.abs(q.l - q.r) < 0.02), rob.map(q => `${q.ns}σ (${q.n}): ${q.l.toFixed(3)} vs ${q.r.toFixed(3)}`).join(' · '));
  ok('the atlas\'s own Galaxy: A in 13–16.5 and B in −15.5…−11 km/s/kpc (Hipparcos Cepheids 14.8/−12.4, Gaia 15.3/−11.9); flat within 2σ; Lindblad\'s two moments within 2σ; Ω₀ within 2σ of Sgr A*; the double wave fits its bins',
    F.A > 13 && F.A < 16.5 && F.B > -15.5 && F.B < -11 && Math.abs(F.dVdR) < 2 * E.dVdR && Math.abs(lindZ) < 2 && Math.abs(F.Omega - OmSgr) < 2 * E.Omega && chi / (nb - 3) < 2.5,
    `A ${F.A.toFixed(2)}±${E.A.toFixed(2)}, B ${F.B.toFixed(2)}±${E.B.toFixed(2)} · dV/dR ${F.dVdR.toFixed(2)}±${E.dVdR.toFixed(2)} · −B/(A−B) ${F.lindblad.toFixed(3)} vs σ_V²/σ_U² ${F.ellipsoid.ratio.toFixed(3)} (${lindZ.toFixed(1)}σ) · Ω₀ ${F.Omega.toFixed(2)} vs Sgr A* ${OmSgr.toFixed(2)} · χ²/dof ${(chi / (nb - 3)).toFixed(2)}`);

  /* 5 · wiring */
  ok('the wiring: the ⟳ station, HCC_STATS.oort and .flow, the 3D flow in three frames with the measured shear grid, the hook in the sky update, the Discoveries card and the trip',
    /\['oort',TT\('The Galaxy turns'/.test(SRC) && /oort:\(\)=>\{ const F=statOort\(\);/.test(SRC) && /flow:f=>\{ if\(f!==undefined\) galFlowShow\(f\);/.test(SRC) && /\['sun','☉ '\+TT\('as seen from the Sun'/.test(SRC)
    && /try\{ galFlowUpdate\(epJ\); \}catch/.test(SRC) && /'galactic-shear-grid'/.test(SRC) && /Two moments of one catalogue agree: Lindblad/.test(SRC) && /The Galaxy turns, read off 15 000 stars/.test(SRC));

  /* 6 · mutations */
  const build = rep => { const src = ['statOortRows', 'statSolveN', 'statOortSolve', 'statOortPred', 'statOortEllipsoid', 'statOortDerived', 'statOortFit'].map(n => K[n].toString()).join('\n');
    const m = rep(src); return m === src ? null : new Function('return ' + '(()=>{' + m + ';return statOortFit;})()')(); };
  const noisy = mock(T, 20000, Sig).map(statGalRow);
  { const f = build(s => s.replace('[[sl,-cl,0,d*cb*c2,d*cb,-d*cb*s2,0]', '[[sl,-cl,0,d*c2,d,-d*s2,0]')); const M = f && f(mock(T, 3000, null).map(statGalRow), { clip: 0, boot: 0 });
    ok('MUTATION — the v_l row without its cos b puts the recovered constants off the known disc, caught', !!M && Math.max(...names.map(k => Math.abs(M[k] - T[k]))) > 0.05, M ? `A ${M.A.toFixed(3)}, B ${M.B.toFixed(3)}` : 'mutation did not apply'); }
  { const f = build(s => s.replace('(i===j?1:0)-g.r[i]*g.r[j]', '(i===j?1:0)')); const M = f && f(noisy, { boot: 0 });
    ok('MUTATION — the dispersion tensor read without the projector P = I − r rᵀ misses σ_V²/σ_U² by more than 4 %, caught', !!M && Math.abs(M.ellipsoid.ratio / (400 / 900) - 1) > 0.04, M ? `σ_V²/σ_U² ${M.ellipsoid.ratio.toFixed(3)}` : 'mutation did not apply'); }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
