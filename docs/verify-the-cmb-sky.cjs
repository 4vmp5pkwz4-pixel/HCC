#!/usr/bin/env node
'use strict';
/* ══ THE CMB SKY, AS PHYSICS PAINTS IT ════════════════════════════════════════════════════
 * The last-scattering wall is one full-sky realization of this atlas's own cosmology, built offline
 * by scripts/build-cmb-sky.py (CAMB + healpy) and embedded. This file checks, from the page alone:
 *   1. the spectra are the physics of a ΛCDM sky: the TT peaks sit at ℓ_n = ℓ_A(n − φ_n) with ℓ_A = π/θ*
 *      and phases in the band acoustic physics allows, the Sachs–Wolfe plateau, the damping tail, EE
 *      crests in the TT troughs (velocity out of phase with density) and TE changing sign between them
 *   2. TWO PATHS, ONE NUMBER: the rms of the sky, summed here from the embedded spectrum through the 5′
 *      beam, equals the build's own theory value, and the map healpy drew and measured back agrees with it
 *      within cosmic variance; its band power over 30 ≤ ℓ ≤ 1500 is 1 within 1%
 *   3. the picture on the wall IS the one measured: the embedded images hash to what the build recorded,
 *      and their JPEG headers say 2048 × 1024 (temperature) and 512 × 256 (polarization)
 *   4. the Planck colour: 256 entries of the collaboration's parchment table, blue end to dark-red end, and the
 *      colour of ±300 μK is exactly its first and last entry
 *   5. the colour it WAS: Planck's law through the CIE 1931 observer lands on the Planckian locus
 *      (3000 K and 6500 K within 0.003), and the sky at emission, T₀(1+z*) = 2973 K, is that warm white
 *   6. ONE COSMOLOGY: CAMB's age of the universe equals the atlas's own published integral to 0.01 Gyr,
 *      its parameters are the atlas's H₀, Ω_m and ω_b, and its σ₈ is the web's
 *   7. wiring: the wall shader reads the log-depth buffer and has the three modes, the controls choose
 *      them, the laboratory shows the spectra, and the API answers
 */
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const jpegSize = b => { for (let i = 2; i < b.length;) { if (b[i] !== 0xFF) return null; const m = b[i + 1], L = b.readUInt16BE(i + 2); if (m >= 0xC0 && m <= 0xC3) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }; i += 2 + L; } return null; };

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { CMB_CAMB, CMB_PLANCK_CMAP, cmbD, cmbPlanckColor, cmbAcoustic, cmbSigmaT, cmbPlanckianXYZ, cmbPlanckianRGB, CMB_T_EMIT, HCC_S3R, LSS_PRIM } = K;
  const S = CMB_CAMB.spec, M = CMB_CAMB.meta;

  /* 1 · the physics of the spectra */
  { const A = cmbAcoustic(), ph = A.peaks.slice(0, 6).map(p => p.phase), plateau = cmbD(10), first = cmbD(A.peaks[0].l), tail = cmbD(2000);
    /* EE is out of phase with TT: every TT trough between 300 and 1500 has an EE crest within ±45 */
    /* the embedded values keep four figures, so neighbours can tie: an extremum is judged over ±8 multipoles */
    const ext = (f, sgn) => { const out = []; for (let l = 300; l < 1500; l++) { let ok2 = sgn * f(l) > sgn * f(l - 8) && sgn * f(l) > sgn * f(l + 8); for (let d = 1; d <= 8 && ok2; d++) if (sgn * f(l + d) > sgn * f(l) || sgn * f(l - d) > sgn * f(l)) ok2 = false; if (ok2 && !(out.length && l - out[out.length - 1] < 20)) out.push(l); } return out; };
    const troughs = ext(l => cmbD(l), -1), eeMax = ext(l => cmbD(l, 'EE'), 1);
    const offPhase = troughs.length >= 3 && troughs.every(t => eeMax.some(e => Math.abs(e - t) <= 45));
    let teSign = 0; for (let l = 30; l < 1500; l++) if (Math.sign(cmbD(l, 'TE')) !== Math.sign(cmbD(l + 1, 'TE'))) teSign++;
    ok('the spectra are a ΛCDM sky: TT peaks at ℓ_n = ℓ_A(n − φ_n), ℓ_A = π/θ*, with phases 0.2–0.35; a Sachs–Wolfe plateau; a damping tail; EE crests in the TT troughs (out of phase); TE changing sign between them',
      S.TT.length === S.lmax + 1 && ph.every(x => x > 0.2 && x < 0.35) && A.lA > 295 && A.lA < 306 && plateau > 800 && plateau < 1400 && first > 5000 && first < 6200 && tail / first < 0.05 && offPhase && teSign >= 8,
      `ℓ_A ${A.lA.toFixed(2)} · peaks ${A.peaks.slice(0, 6).map(p => p.l).join(',')} · φ ${ph.map(x => x.toFixed(3)).join(',')} · D₁₀ ${plateau} · D_peak ${first} · D₂₀₀₀/D_peak ${(tail / first).toFixed(4)} · TT troughs ${troughs.join(',')} ↔ EE crests ${eeMax.join(',')} · TE sign changes ${teSign}`); }

  /* 2 · two paths, one number */
  { const js = cmbSigmaT(M.sky.fwhmArcmin), cv = M.sky.sigmaTTheory * 0.01;
    ok('TWO PATHS, ONE NUMBER: σ_T summed here from the embedded spectrum through the 5′ beam equals the build\'s theory value, the map healpy drew agrees within cosmic variance, and its band power 30–1500 is 1 within 1%',
      Math.abs(js - M.sky.sigmaTTheory) < 2e-3 && Math.abs(M.sky.sigmaTMap - js) < cv && Math.abs(M.sky.bandRatio30to1500 - 1) < 0.01,
      `σ_T here ${js.toFixed(4)} · build theory ${M.sky.sigmaTTheory} · map ${M.sky.sigmaTMap} μK · band ratio ${M.sky.bandRatio30to1500}`); }

  /* 3 · the picture is the one measured */
  { const a = SRC.indexOf('<script type="application/json" id="hcc-cmb-sky">'), j = JSON.parse(SRC.slice(SRC.indexOf('>', a) + 1, SRC.indexOf('</script>', a)));
    const t = Buffer.from(j.t, 'base64'), p = Buffer.from(j.p, 'base64'), st = jpegSize(t), sp = jpegSize(p);
    const ht = crypto.createHash('sha256').update(t).digest('hex'), hp = crypto.createHash('sha256').update(p).digest('hex');
    ok('the picture on the wall IS the one measured: both embedded images hash to what the build recorded, 2048 × 1024 temperature and 512 × 256 polarization',
      ht === M.sky.jpegSha256 && hp === M.sky.polJpegSha256 && st && st.w === 2048 && st.h === 1024 && sp && sp.w === 512 && sp.h === 256,
      `${(t.length / 1024).toFixed(0)} KB + ${(p.length / 1024).toFixed(0)} KB · ${st && st.w}×${st && st.h}, ${sp && sp.w}×${sp && sp.h}`); }

  /* 4 · the Planck colour */
  { const lo = cmbPlanckColor(-300), hi = cmbPlanckColor(300), mid = cmbPlanckColor(0), e0 = CMB_PLANCK_CMAP[0], e1 = CMB_PLANCK_CMAP[255];
    ok('the Planck colour: 256 entries of the parchment table, blue at the cold end and dark red at the hot, and ±300 μK are exactly its first and last entries, a pale parchment between',
      CMB_PLANCK_CMAP.length === 256 && e0[2] > 200 && e0[0] < 30 && e1[0] >= 90 && e1[1] < 30 && e1[2] < 30 && lo.every((v, k) => Math.abs(v * 255 - e0[k]) < 1e-9) && hi.every((v, k) => Math.abs(v * 255 - e1[k]) < 1e-9) && mid.every(v => v > 0.8),
      `cold ${e0.join(',')} · hot ${e1.join(',')} · 0 μK ${mid.map(v => Math.round(v * 255)).join(',')}`); }

  /* 5 · the colour it was */
  { const c3 = cmbPlanckianXYZ(3000), c65 = cmbPlanckianXYZ(6500), Te = CMB_T_EMIT(), rgb = cmbPlanckianRGB(Te).map(v => Math.round(v * 255));
    ok('the colour it WAS: Planck\'s law through the CIE 1931 observer lands on the Planckian locus at 3000 K and 6500 K, and the sky at emission, T₀(1+z*), glowed warm white',
      Math.hypot(c3.x - 0.4369, c3.y - 0.4041) < 0.003 && Math.hypot(c65.x - 0.3135, c65.y - 0.3236) < 0.003 && Math.abs(Te - 2973.2) < 1 && rgb[0] === 255 && rgb[1] > 150 && rgb[2] > 60 && rgb[2] < rgb[1],
      `3000 K (${c3.x.toFixed(4)}, ${c3.y.toFixed(4)}) · 6500 K (${c65.x.toFixed(4)}, ${c65.y.toFixed(4)}) · T_emit ${Te.toFixed(1)} K → sRGB ${rgb.join(',')}`); }

  /* 6 · one cosmology */
  { const h = HCC_S3R.H0_km / 100, Om = (M.params.omch2 + M.params.ombh2 + M.params.mnu / 93.14) / (h * h);
    ok('ONE COSMOLOGY: the Boltzmann code\'s age of the universe equals the atlas\'s own published integral to 0.01 Gyr; its H₀, Ω_m, ω_b are the atlas\'s and its σ₈ is the web\'s',
      Math.abs(M.derived.age - HCC_S3R.published.age_Gyr) < 0.01 && M.params.H0 === HCC_S3R.H0_km && Math.abs(Om - HCC_S3R.Omega_m) < 1e-6 && M.params.ombh2 === HCC_S3R.omega_b && Math.abs(M.params.sigma8 - LSS_PRIM.sigma8) < 1e-4,
      `age CAMB ${M.derived.age} vs atlas ${HCC_S3R.published.age_Gyr} Gyr · Ω_m ${Om.toFixed(6)} · σ₈ ${M.params.sigma8}`); }

  /* 7 · wiring */
  ok('wiring: the wall shader reads the log-depth buffer and has its three modes, the controls choose them, the laboratory shows the spectra, and HCC_CMB_SKY answers',
    /function cmbSkyMaterial\(opacity\)[\s\S]{0,2600}#include <logdepthbuf_pars_fragment>/.test(SRC) && /if\(uMode<0\.5\)\{ col=planck\(dT\(vUv,0\.0\)\); \}/.test(SRC) && /data-cmbsky="\$\{m\}"/.test(SRC)
    && /\$\{cmbSpectrumSect\(\)\}`;/.test(SRC) && /globalThis\.HCC_CMB_SKY=Object\.freeze/.test(SRC) && /try\{ cmbSkyTick\(dt\); \}catch\(e\)\{\}/.test(SRC) && /<!-- CMB_SKY:BEGIN -->/.test(SRC));

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
