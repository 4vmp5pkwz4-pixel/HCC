#!/usr/bin/env node
'use strict';
/* ══ WHAT THE CATALOGUES SAY ═══════════════════════════════════════════════════
 * The atlas holds four measured catalogues — Hipparcos stars, clusters and nebulae,
 * galaxies, quasars — and the statistics observatory asks them the classical questions.
 * This file decodes the same data from index.html, answers each question INDEPENDENTLY
 * (its own galactic rotation from the IAU pole, its own least squares), and compares:
 *   1. the Sun's motion from proper motions alone (no radial velocity is used): the atlas's
 *      solver, run on the decoded stars, agrees with an independent solution, and the apex
 *      lies in Hercules within a few degrees of the classical α 271°, δ +30°
 *   2. Strömberg's asymmetric drift: in bins of B−V the lag V grows linearly with σ²; the
 *      intercept V₀ and the U, W means give the Sun's motion relative to the LSR
 *   3. number counts: log N(<m) slopes of stars, galaxies and quasars, each below the
 *      Euclidean 0.6, and each reason stated
 *   4. the galaxy luminosity function by 1/Vmax and its Schechter fit, recomputed
 *   5. Planck–Casimir: the measured band of the Casimir force (Lamoreaux 1997, Mohideen &
 *      Roy 1998, Bressi et al. 2002) placed on the φ-ladder; P/P_P = (π²/240) φ^−4N; the
 *      separation at which the Casimir pressure equals ρ_Λc² of the atlas's cosmology,
 *      with Kapner et al. 2007 named as a coincidence of scales, not a link
 *   6. MUTATIONS: a sign-flipped solver, a wrong km/s factor, Strömberg on σ instead of σ²,
 *      a Casimir law with 24 for 240, and the coincidence caveat removed are each caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const DEG = Math.PI / 180;

/* ── the data, decoded ── */
const H = eval('(' + SRC.match(/const HCC_SKY_HIP=(\{[^\n]*\});/)[1] + ')'), HB = Buffer.from(H.b64, 'base64'), STARS = [];
for (let i = 0; i < H.count; i++) { const o = i * H.rec, bv = HB.readInt16LE(o + 14);
  STARS.push({ ra: HB.readUInt32LE(o + 4) / 4294967296 * 360, de: HB.readInt32LE(o + 8) / 1e7, V: HB.readInt16LE(o + 12) / 100, bv: bv === -32768 ? null : bv / 1000,
    plx: HB.readUInt32LE(o + 16) / 100, eplx: HB.readUInt16LE(o + 20) / 1000, pmra: HB.readInt32LE(o + 22) / 100, pmde: HB.readInt32LE(o + 26) / 100 }); }
const GAL = (() => { const m = SRC.match(/const DSO3D_GAL=\{count:(\d+),sha256:'[0-9a-f]+',b64:'([A-Za-z0-9+/=]+)'\};/), b = Buffer.from(m[2], 'base64'), out = [];
  for (let i = 0; i < +m[1]; i++) { const dK = Math.pow(10, b.readUInt16LE(i * 8 + 4) / 8000 - 2), V = b[i * 8 + 6] / 10; out.push({ V, M: V - 5 * Math.log10(dK * 100) }); } return out; })();
const QSO = eval('(' + SRC.match(/const QSO3D=(\{count:\d+,[^\n]*\});\n/)[1] + ')').rows;

/* ── an independent galactic frame, from the IAU (1958) pole and the longitude of the NCP ── */
const aP = 192.85948 * DEG, dP = 27.12825 * DEG, lN = 122.93192 * DEG;
const zG = [Math.cos(dP) * Math.cos(aP), Math.cos(dP) * Math.sin(aP), Math.sin(dP)];
const ncp = [0, 0, 1], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = a => { const n = Math.hypot(...a); return a.map(x => x / n); };
/* the celestial pole projected on the galactic plane points at l = l_NCP; a quarter turn about the
   galactic pole (z × ·) is l + 90°, so any longitude follows from those two */
const yN = nrm(ncp.map((x, i) => x - dot(ncp, zG) * zG[i])), qN = cross(zG, yN);
const eL = l => [0, 1, 2].map(i => Math.cos(l - lN) * yN[i] + Math.sin(l - lN) * qN[i]);
const GX = eL(0), GY = eL(90 * DEG), toGal = v => [dot(GX, v), dot(GY, v), dot(zG, v)], toEq = g => [0, 1, 2].map(i => g[0] * GX[i] + g[1] * GY[i] + g[2] * zG[i]);
const gc = toGal([Math.cos(-28.936 * DEG) * Math.cos(266.405 * DEG), Math.cos(-28.936 * DEG) * Math.sin(266.405 * DEG), Math.sin(-28.936 * DEG)]);
const frameOk = Math.abs(Math.atan2(gc[1], gc[0]) / DEG) < 0.2 && Math.abs(Math.asin(gc[2]) / DEG) < 0.2;

const prep = s => { const a = s.ra * DEG, d = s.de * DEG, dpc = 1000 / s.plx, k = 4.740470446 * dpc / 1000;
  const r = [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)], ea = [-Math.sin(a), Math.cos(a), 0], ed = [-Math.sin(d) * Math.cos(a), -Math.sin(d) * Math.sin(a), Math.cos(d)];
  return { r: toGal(r), vt: toGal([0, 1, 2].map(j => k * (s.pmra * ea[j] + s.pmde * ed[j]))), bv: s.bv, Mv: s.V + 5 + 5 * Math.log10(s.plx / 1000) }; };
const SEL = STARS.filter(s => s.plx > 0 && s.eplx > 0 && s.plx / s.eplx >= 10 && 1000 / s.plx < 300).map(prep);
/* least squares by Cramer's rule: the tangential motions are the reflex of −v_sun, projected: vt = −(I − rrᵀ)v */
const det3 = m => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
const solar = sel => { const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], b = [0, 0, 0];
  for (const s of sel) for (let i = 0; i < 3; i++) { for (let j = 0; j < 3; j++) A[i][j] += (i === j) - s.r[i] * s.r[j]; b[i] -= s.vt[i]; }
  const D = det3(A), v = [0, 1, 2].map(c => det3(A.map((row, i) => row.map((x, j) => j === c ? b[i] : x))) / D);
  let q = 0; for (const s of sel) { const rv = dot(s.r, v); for (let i = 0; i < 3; i++) q += (s.vt[i] + v[i] - s.r[i] * rv) ** 2; }
  return { U: v[0], V: v[1], W: v[2], n: sel.length, sigma: Math.sqrt(1.5 * q / sel.length) }; };
const apex = m => { const e = toEq([m.U, m.V, m.W]), n = Math.hypot(...e); return { ra: (Math.atan2(e[1], e[0]) / DEG + 360) % 360, dec: Math.asin(e[2] / n) / DEG }; };

/* ── the atlas's own solver, lifted from index.html and run on the same stars ── */
const lift = s => { try {
  const pick = re => { const m = s.match(re); if (!m) throw new Error('missing ' + re); return m[0]; };
  const code = [pick(/const STAT_MG=\[\[[^\n]*\]\];/), pick(/const statToGal=v=>[^\n]*;/), pick(/function statSolve3\(A,b\)\{[^\n]*\n[^\n]*\}/),
    pick(/function statSolarMotion\(sel\)\{[\s\S]*?sigma:Math\.sqrt\(1\.5\*q\/Math\.max\(1,sel\.length\)\)\}; \}/), pick(/function statApex\(m\)\{[^\n]*\n[^\n]*\}/),
    pick(/function statMainSequence\(\)\{[^\n]*\}/), pick(/function statColourBins\(\)\{[\s\S]*?return \{bins:out,V0,U0,W0,k:1\/slope\}; \}/)].join('\n');
  const kf = +(s.match(/const k=([0-9.]+)\*dpc\/1000, vt=\[0,1,2\]\.map\(j=>k\*\(st\.pmra\*ea\[j\]\+st\.pmde\*ed\[j\]\)\);/) || [0, NaN])[1];
  const f = new Function('DEG', 'STARS', 'KF', code + `
    const statStars=()=>STARS.filter(st=>st.plx>0&&st.eplx>0&&st.plx/st.eplx>=10&&1000/st.plx<300).map(st=>{ const a=st.ra*DEG,d=st.de*DEG,dpc=1000/st.plx,r=[Math.cos(d)*Math.cos(a),Math.cos(d)*Math.sin(a),Math.sin(d)],ea=[-Math.sin(a),Math.cos(a),0],ed=[-Math.sin(d)*Math.cos(a),-Math.sin(d)*Math.sin(a),Math.cos(d)],k=KF*dpc/1000;
      return {V:st.V,bv:st.bv,Mv:st.V+5+5*Math.log10(st.plx/1000),r:statToGal(r),vt:statToGal([0,1,2].map(j=>k*(st.pmra*ea[j]+st.pmde*ed[j])))}; });
    const m=statSolarMotion(statStars()); return {m,ap:statApex(m),cb:statColourBins()};`);
  return f(DEG, STARS, kf); } catch (e) { return { err: e.message }; } };
const A = lift(SRC);

/* 1 · the Sun's motion */
const me = solar(SEL), ape = apex(me), sp = Math.hypot(me.U, me.V, me.W);
const agree = X => X && X.m && Math.abs(X.m.U - me.U) < 0.05 && Math.abs(X.m.V - me.V) < 0.05 && Math.abs(X.m.W - me.W) < 0.05 && Math.abs(X.ap.ra - ape.ra) < 0.1 && Math.abs(X.ap.dec - ape.dec) < 0.1;
ok('an independent galactic frame, built from the IAU pole, puts Sgr A* at l = 0, b = 0', frameOk, `Sgr A* → l ${(Math.atan2(gc[1], gc[0]) / DEG).toFixed(3)}°, b ${(Math.asin(gc[2]) / DEG).toFixed(3)}°`);
ok('the Sun\'s motion from proper motions alone: the atlas\'s solver agrees with an independent least squares',
  agree(A) && me.n > 10000, A.err || `${me.n} stars · (U, V, W) = (${me.U.toFixed(2)}, ${me.V.toFixed(2)}, ${me.W.toFixed(2)}) km/s, ${sp.toFixed(2)} km/s · atlas (${A.m.U.toFixed(2)}, ${A.m.V.toFixed(2)}, ${A.m.W.toFixed(2)})`);
const sep = Math.acos(Math.sin(ape.dec * DEG) * Math.sin(30 * DEG) + Math.cos(ape.dec * DEG) * Math.cos(30 * DEG) * Math.cos((ape.ra - 271) * DEG)) / DEG;
ok('and the apex lies in Hercules, within a few degrees of the classical α 271°, δ +30°, at about 20 km/s',
  sep < 3 && sp > 17 && sp < 23, `apex α ${ape.ra.toFixed(1)}°, δ +${ape.dec.toFixed(1)}° — ${sep.toFixed(2)}° from the classical apex`);

/* 2 · Strömberg */
const MS = SEL.filter(s => s.bv != null && s.bv > -0.2 && s.bv < 1.4 && Math.abs(s.Mv - (5.5 * s.bv + 1.0)) < 2.0), bins = [];
for (let k = 0; k < 16; k++) { const x0 = -0.2 + 0.1 * k, sel = MS.filter(s => s.bv >= x0 && s.bv < x0 + 0.1); if (sel.length >= 80) bins.push({ bv: x0 + 0.05, ...solar(sel) }); }
const wfit = (xs, ys, ws) => { let sw = 0, sx = 0, sy = 0, sxx = 0, sxy = 0; xs.forEach((x, i) => { const w = ws[i]; sw += w; sx += w * x; sy += w * ys[i]; sxx += w * x * x; sxy += w * x * ys[i]; }); const b = (sw * sxy - sx * sy) / (sw * sxx - sx * sx); return { b, a: (sy - b * sx) / sw }; };
const st = wfit(bins.map(b => b.sigma ** 2), bins.map(b => b.V), bins.map(b => b.n)), stS = wfit(bins.map(b => b.sigma), bins.map(b => b.V), bins.map(b => b.n));
const rho = (xs, ys) => { const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length; let a = 0, b = 0, c = 0; xs.forEach((x, i) => { a += (x - mx) * (ys[i] - my); b += (x - mx) ** 2; c += (ys[i] - my) ** 2; }); return a / Math.sqrt(b * c); };
const sw = bins.reduce((a, b) => a + b.n, 0), U0 = bins.reduce((a, b) => a + b.n * b.U, 0) / sw, W0 = bins.reduce((a, b) => a + b.n * b.W, 0) / sw;
const cbOk = X => X && X.cb && Math.abs(X.cb.V0 - st.a) < 0.05 && Math.abs(X.cb.U0 - U0) < 0.05 && Math.abs(X.cb.W0 - W0) < 0.05;
ok('Strömberg\'s asymmetric drift: in bins of B−V the lag V climbs with σ², and the atlas\'s intercept is recomputed here',
  bins.length >= 10 && rho(bins.map(b => b.sigma ** 2), bins.map(b => b.V)) > 0.8 && cbOk(A) && st.a > 3 && st.a < 12,
  `${bins.length} bins · r(σ², V) = ${rho(bins.map(b => b.sigma ** 2), bins.map(b => b.V)).toFixed(3)} · (U, V, W)_LSR = (${U0.toFixed(2)}, ${st.a.toFixed(2)}, ${W0.toFixed(2)}) km/s; Dehnen & Binney 1998: (10.00, 5.25, 7.17)`);
ok('and the atlas says why its V₀ sits above Dehnen & Binney\'s: a small bright list and young moving groups',
  /Dehnen & Binney 1998: 5\.25 ± 0\.62/.test(SRC) && /young moving groups \(the Hyades, Pleiades and Sirius streams\)/.test(SRC));

/* 3 · number counts */
const slope = (vals, lo, hi) => { const xs = [], ys = []; for (let m = lo; m <= hi + 1e-9; m += 0.5) { const n = vals.filter(v => v <= m).length; if (n) { xs.push(m); ys.push(Math.log10(n)); } }
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length; let a = 0, c = 0; xs.forEach((x, i) => { a += (x - mx) * (ys[i] - my); c += (x - mx) ** 2; }); return a / c; };
const cs = { stars: slope(STARS.map(s => s.V), 2, 6.5), galaxies: slope(GAL.map(g => g.V), 8, 12), quasars: slope(QSO.map(r => r[4]), 14, 17.5) };
ok('number counts: every class climbs more slowly than the Euclidean 0.6, and each reason is stated',
  Object.values(cs).every(x => x > 0.3 && x < 0.6) && /the Galactic disc already has an edge above and below/.test(SRC) && /the Local Supercluster crowds the bright end/.test(SRC) && /a compilation, not a survey/.test(SRC),
  Object.entries(cs).map(([k, v]) => `${k} ${v.toFixed(3)}`).join(' · '));

/* 4 · the luminosity function */
const lf = {}; for (const g of GAL) { if (g.V > 12) continue; const dmax = Math.pow(10, (12 - g.M + 5) / 5) / 1e6, V = 4 / 3 * Math.PI * Math.min(dmax, 400) ** 3, k = Math.floor(g.M * 2) / 2; lf[k] = (lf[k] || 0) + 1 / V / 0.5; }
const LF = Object.entries(lf).map(([k, v]) => [+k + 0.25, v]).filter(([m, v]) => m > -23.5 && m < -15 && v > 0);
let best = null; for (let Ms = -23.5; Ms <= -19; Ms += 0.02) for (let al = -1.8; al <= -0.4; al += 0.01) {
  const f = M => 0.4 * Math.LN10 * Math.pow(10, 0.4 * (al + 1) * (Ms - M)) * Math.exp(-Math.pow(10, 0.4 * (Ms - M)));
  const lp = LF.reduce((a, [m, v]) => a + Math.log10(v) - Math.log10(f(m)), 0) / LF.length, chi = LF.reduce((a, [m, v]) => a + (Math.log10(v) - lp - Math.log10(f(m))) ** 2, 0);
  if (!best || chi < best.chi) best = { Ms, al, phi: Math.pow(10, lp), chi }; }
ok('the galaxy luminosity function by 1/Vmax has Schechter\'s shape, with M* where surveys find it',
  best.Ms > -22.5 && best.Ms < -20.5 && best.al < -0.9 && best.al > -1.8 && /function statLuminosityFunction\(\)\{/.test(SRC) && /nearby is the overdense Local Supercluster/.test(SRC),
  `${LF.length} half-magnitude bins · M* = ${best.Ms.toFixed(2)}, α = ${best.al.toFixed(2)}, φ* = ${best.phi.toExponential(2)} Mpc⁻³`);

/* 5 · Planck–Casimir */
const PHI = (1 + Math.sqrt(5)) / 2, LN = Math.log(PHI), lP = 1.616255e-35, hbar = 1.054571817e-34, c = 299792458, G = 6.6743e-11;
const Nof = a => Math.log(a / lP) / LN, Pc = a => Math.PI ** 2 * hbar * c / (240 * a ** 4);
const lo = Nof(0.1e-6), hi = Nof(6e-6);
const cites = /Lamoreaux 1997, PRL 78, 5/.test(SRC) && /Mohideen & Roy 1998, PRL 81, 4549/.test(SRC) && /Bressi, Carugno, Onofrio & Ruoso 2002, PRL 88, 041804/.test(SRC);
const law = s => /P=a=>Math\.PI\*Math\.PI\*hbarc\/\(240\*a\*\*4\)/.test(s);
ok('the measured Casimir band is a band of rungs, 0.1–6 µm, cited to the three experiments',
  cites && law(SRC) && Math.abs(lo - 132.98) < 0.01 && Math.abs(hi - 141.49) < 0.01, `rungs ${lo.toFixed(2)}–${hi.toFixed(2)} · P(1 µm) = ${Pc(1e-6).toExponential(3)} Pa`);
const PP = c ** 7 / (hbar * G * G), N1 = Nof(1e-6);
ok('Casimir on the ladder is exact: P / P_P = (π²/240) φ^−4N, each rung down multiplies the pressure by φ⁴',
  Math.abs(Pc(1e-6) / PP / (Math.PI ** 2 / 240 * Math.pow(PHI, -4 * N1)) - 1) < 1e-3 && /P \/ P_P = \(π²\/240\) φ\^−4N/.test(SRC) && /PP=cL\*\*7\/\(1\.054571817e-34\*G\*G\)/.test(SRC),
  `P_P = ${PP.toExponential(3)} Pa · φ⁴ = ${(PHI ** 4).toFixed(4)}`);
const H0s = 67.4e3 / 3.0856775814913673e22, rhoL = 0.685 * 3 * H0s * H0s / (8 * Math.PI * G) * c * c, aL = Math.pow(Math.PI ** 2 * hbar * c / (240 * rhoL), 0.25);
const caveat = s => /A coincidence of scales, reported as one: nothing here says the two pressures are linked\./.test(s) && /Kapner et al\. 2007, PRL 98, 021101/.test(s);
ok('the Casimir pressure meets the dark-energy pressure of the atlas\'s own cosmology near 40 µm — beside the Eöt-Wash test of gravity, reported as a coincidence',
  aL > 35e-6 && aL < 45e-6 && Nof(aL) > hi && caveat(SRC) && /const aL=Math\.pow\(Math\.PI\*Math\.PI\*hbarc\/\(240\*rhoL\),0\.25\), NL=Nof\(aL\);/.test(SRC),
  `ρ_Λc² = ${rhoL.toExponential(3)} Pa at a = ${(aL * 1e6).toFixed(2)} µm, rung ${Nof(aL).toFixed(2)}`);

/* 6 · mutations */
ok('MUTATION — a sign-flipped solver is caught', !agree(lift(SRC.replace('b[i]-=s.vt[i]; }', 'b[i]+=s.vt[i]; }'))));
ok('MUTATION — a wrong km/s factor (4.74 → 4.47) is caught', !agree(lift(SRC.replace('const k=4.740470446*dpc/1000, vt=', 'const k=4.470470446*dpc/1000, vt='))));
ok('MUTATION — Strömberg fitted on σ instead of σ² is caught', !cbOk(lift(SRC.replace('const w=b.n, x=b.sigma*b.sigma, y=b.V;', 'const w=b.n, x=b.sigma, y=b.V;'))) && Math.abs(stS.a - st.a) > 1);
ok('MUTATION — a Casimir law with 24 for 240 is caught', !law(SRC.replace('P=a=>Math.PI*Math.PI*hbarc/(240*a**4)', 'P=a=>Math.PI*Math.PI*hbarc/(24*a**4)')));
ok('MUTATION — the coincidence caveat removed is caught', !caveat(SRC.replace('A coincidence of scales, reported as one: nothing here says the two pressures are linked.', 'The two pressures are linked.')));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
