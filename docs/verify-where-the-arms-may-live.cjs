#!/usr/bin/env node
'use strict';
/* ══ WHERE THE ARMS MAY LIVE — THE RESONANCES, FROM THIS ATLAS'S OWN SHEAR ═══════════════
 * A star in a disc goes round at Ω and oscillates at κ; a pattern turning at Ωp resonates with
 * it where m(Ω − Ωp) = lκ. The atlas measures Oort's A and B from 15 000 Hipparcos stars, and
 * those two numbers fix both frequencies at the Sun. This file decodes the embedded catalogue
 * HERE, refits A and B with the extracted solver, and checks against references written here:
 *   1. the frequencies: Ω₀ = A − B and κ₀² = −4B(A − B), and Lindblad's κ²/4Ω² = −B/(A − B);
 *      a flat curve (A = −B) gives κ/Ω = √2 exactly and resonances at R_CR(1 ± √2/m)
 *   2. every resonance radius equals the root of Ω(R) + sκ(R)/m = Ωp found HERE by bisection
 *      on the power-law curve through the Sun
 *   3. FOUND: the Sun sits at the arms' corotation — (Ω₀ − Ωp)/κ₀ ≈ 0 within its error — with
 *      Ωp = 28 km/s/kpc, from the atlas's own measurement
 *   4. FOUND: the Sun sits next to the bar's outer 4:1 resonance — (Ω₀ − Ωb)/κ₀ ≈ −1/4 within
 *      two errors, the resonance 0.2 kpc inside R₀ — the Hercules-stream resonance
 *   5. the bar is fast (ℛ = R_CR/a in 1.0–1.4) and the four-armed band 4:1–4:1 holds
 *      Sagittarius, the Local Spur and Perseus but not the outermost arm, which a two-armed
 *      wave's band does hold
 *   6. the wiring: the station, the rings in 3D, the API, the card row, the toolbox
 *   7. MUTATION: κ² = −4B(A + B) (the sign slip) moves the bar's 4:1 away from the Sun, caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
function decode() {
  const m = SRC.match(/const HCC_SKY_HIP=\{count:(\d+),vlim:7,rec:(\d+),[\s\S]*?b64:'([^']+)'/); if (!m) return [];
  const n = +m[1], rec = +m[2], buf = Buffer.from(m[3], 'base64'), S = [];
  for (let i = 0; i < n; i++) { const o = i * rec, bv = buf.readInt16LE(o + 14);
    S.push({ hip: buf.readUInt32LE(o), ra: buf.readUInt32LE(o + 4) / 4294967296 * 360, de: buf.readInt32LE(o + 8) / 1e7, V: buf.readInt16LE(o + 12) / 100, bv: bv === -32768 ? null : bv / 1000,
      plx: buf.readUInt32LE(o + 16) / 100, eplx: buf.readUInt16LE(o + 20) / 1000, pmra: buf.readInt32LE(o + 22) / 100, pmde: buf.readInt32LE(o + 26) / 100 }); }
  return S; }

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { statGalRow, statOortFit, galLocalCurve, galOmegaR, galResonanceR, galResonances, galResonanceNumber, galArmBand } = K;
  const R0 = 8.178, OmP = +SRC.match(/OmegaP:\s+(\d+),/)[1], OmB = +SRC.match(/OmegaBar:\s+(\d+),/)[1], aBar = +SRC.match(/barHalf:\s+([\d.]+),/)[1];

  /* 1 · the frequencies */
  { const L = galLocalCurve(14.8, -12.4), Lf = galLocalCurve(14, -14), Rf = galResonances(Lf, R0, { OmP, OmB, barHalf: aBar, m: 4 }), Rcr = 28 * R0 / OmP;
    const lind = L.kap ** 2 / (4 * L.Om ** 2) + L.B / (L.A - L.B);
    ok('the frequencies: Ω₀ = A − B, κ₀² = −4B(A − B), Lindblad\'s κ²/4Ω² = −B/(A − B); a flat curve gives κ/Ω = √2 and resonances at R_CR(1 ± √2/m) exactly',
      Math.abs(L.Om - 27.2) < 1e-12 && Math.abs(L.kap ** 2 - 4 * 12.4 * 27.2) < 1e-9 && Math.abs(lind) < 1e-12 && Math.abs(Lf.kap / Lf.Om - Math.SQRT2) < 1e-14
      && Math.abs(Rf.spiral.OLRm - Rcr * (1 + Math.SQRT2 / 4)) < 1e-9 && Math.abs(Rf.spiral.ILRm - Rcr * (1 - Math.SQRT2 / 4)) < 1e-9, `flat R_CR ${Rcr.toFixed(3)} · 4:1 ${Rf.spiral.ILRm.toFixed(3)}–${Rf.spiral.OLRm.toFixed(3)} kpc`); }

  /* the atlas's own measurement, refitted here */
  const S = decode(), G = S.filter(s => s.plx > 0 && s.eplx > 0 && s.plx / s.eplx >= 5 && 1 / s.plx <= 1).map(statGalRow), F = statOortFit(G, { R0 }), E = F.err;
  const L = galLocalCurve(F.A, F.B), Z = galResonances(L, R0, { OmP, OmB, barHalf: aBar, m: 4 });

  /* 2 · roots by bisection, here */
  { const Om = R => L.Om * Math.pow(R / R0, L.beta - 1), ka = R => Math.sqrt(2 * (1 + L.beta)) * Om(R);
    const root = (P, m, s) => { let a = 0.2, b = 40; const f = R => Om(R) + s * ka(R) / m - P; for (let i = 0; i < 200; i++) { const c = (a + b) / 2; (f(a) > 0) === (f(c) > 0) ? a = c : b = c; } return (a + b) / 2; };
    const pairs = [[Z.spiral.CR, root(OmP, 1, 0)], [Z.spiral.ILRm, root(OmP, 4, -1)], [Z.spiral.OLRm, root(OmP, 4, 1)], [Z.spiral.OLR2, root(OmP, 2, 1)], [Z.bar.CR, root(OmB, 1, 0)], [Z.bar.OLR4, root(OmB, 4, 1)], [Z.bar.OLR2, root(OmB, 2, 1)], [Z.bar.ILR2, root(OmB, 2, -1)]];
    const worst = Math.max(...pairs.map(([a, b]) => Math.abs(a - b))), omOk = Math.abs(galOmegaR(L, R0, 5) - Om(5)) < 1e-12;
    ok('every resonance radius is the root of Ω(R) + sκ(R)/m = Ωp found here by bisection on the power-law curve through the Sun', worst < 1e-9 && omOk, `worst ${worst.toExponential(1)} kpc over ${pairs.length} resonances`); }

  /* 3 · the Sun at corotation */
  const sp = galResonanceNumber(L, OmP, E.Omega, E.kappa), br = galResonanceNumber(L, OmB, E.Omega, E.kappa);
  ok(`FOUND — the Sun sits at the arms' corotation, from the atlas's own Oort constants: (Ω₀ − Ωp)/κ₀ ≈ 0 within one error, R_CR within 0.3 kpc of R₀`,
    Math.abs(sp.n) < sp.err && Math.abs(Z.spiral.CR - R0) < 0.3, `Ω₀ = ${L.Om.toFixed(2)} ± ${E.Omega.toFixed(2)}, κ₀ = ${L.kap.toFixed(2)} ± ${E.kappa.toFixed(2)} km/s/kpc · n = ${sp.n.toFixed(3)} ± ${sp.err.toFixed(3)} · R_CR ${Z.spiral.CR.toFixed(2)} kpc`);

  /* 4 · the Sun at the bar's 4:1 */
  ok('FOUND — and next to the bar\'s outer 4:1 resonance: (Ω₀ − Ωb)/κ₀ ≈ −1/4 within two errors, the resonance less than 0.4 kpc inside the Sun — the Hercules-stream resonance of Hunt & Bovy (2018)',
    Math.abs(br.n + 0.25) < 2 * br.err && Z.bar.OLR4 < R0 && R0 - Z.bar.OLR4 < 0.4, `n = ${br.n.toFixed(3)} ± ${br.err.toFixed(3)} · 4:1 OLR at ${Z.bar.OLR4.toFixed(3)} kpc, ${((R0 - Z.bar.OLR4) * 1000).toFixed(0)} pc inside R₀`);

  /* 5 · bar and bands */
  { const arms = JSON.parse('[' + [...SRC.matchAll(/\{key:'(\w+)', name:'[^']+',\s+R:([\d.]+),/g)].map(m => `{"key":"${m[1]}","R":${m[2]}}`).join(',') + ']');
    const b4 = galArmBand(arms, [Z.spiral.ILRm, Z.spiral.OLRm]), b2 = galArmBand(arms, [Z.spiral.ILR2, Z.spiral.OLR2]), in4 = b4.filter(a => a.inside).map(a => a.key).sort().join(',');
    ok('the bar is fast (ℛ = R_CR/a in 1.0–1.4); the four-armed band holds Sagittarius, the Local Spur and Perseus but not the outermost arm, which the two-armed band does hold',
      Z.bar.fast && Z.bar.R >= 1 && Z.bar.R <= 1.4 && in4 === 'ori,per,sgr' && !b4.find(a => a.key === 'nor').inside && b2.find(a => a.key === 'nor').inside, `ℛ = ${Z.bar.R.toFixed(3)} · 4:1 band ${Z.spiral.ILRm.toFixed(2)}–${Z.spiral.OLRm.toFixed(2)} holds ${in4} · 2:1 OLR ${Z.spiral.OLR2.toFixed(2)}`); }

  /* 6 · wiring */
  ok('the wiring: the Resonances station, the rings in the living Galaxy, HCC_STATS.resonances(), the Galaxy card row and the toolbox entry',
    /\['res',TT\('Resonances','Резонансы','Resonanzen'\)\]/.test(SRC) && /else if\(cur==='res'\)\{ const Z=statResonances\(\);/.test(SRC) && /function galResShow\(on\)\{/.test(SRC)
    && /resonances:\(\)=>\{ const Z=statResonances\(\);/.test(SRC) && /\['Resonances',\(\(\)=>\{ try\{ const Z=statResonances\(\);/.test(SRC) && /TT\('Where the arms may live · resonances'/.test(SRC));

  /* 7 · mutation */
  { const src = galLocalCurve.toString(), cut = 'kap:Math.sqrt(Math.max(0,-4*B*(A-B)))', mut = new Function('return ' + src.replace(cut, 'kap:Math.sqrt(Math.max(0,-4*B*(A+B)))'))();
    const Lm = mut(F.A, F.B), bm = galResonanceNumber(Lm, OmB, E.Omega, E.kappa);
    ok('MUTATION — κ² = −4B(A + B), the sign slip, no longer finds the bar\'s 4:1 at the Sun, caught', src.includes(cut) && Math.abs(bm.n + 0.25) > 2 * bm.err, `n would be ${bm.n.toFixed(2)}`); }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
