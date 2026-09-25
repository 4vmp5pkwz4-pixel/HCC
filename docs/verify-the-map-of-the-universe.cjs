#!/usr/bin/env node
'use strict';
/* ══ THE MAP OF THE UNIVERSE, AT EVERY LEVEL ════════════════════════════════════════
 * After Ménard & Shtarkman (2022): the observer at the bottom, the first light at the top,
 * every object at its true distance. This file recomputes the map's numbers from the raw
 * catalogues embedded in index.html, independently of the page:
 *   1. the first light: the comoving distance to z = 1090 with radiation (Ω_r h² = 4.18e-5)
 *      is 13.86 Gpc (Planck 2018 quotes ≈ 13.87). The atlas's own routine — 200 Simpson steps
 *      in z — returned 16.05 Gpc there, 15 % too far; this verifier found it, and the routine
 *      now integrates in ln(1+z) above z = 20 (MUTATION: the old quadrature is caught).
 *      Radiation itself moves the surface by only 0.5 %
 *   2. the catalogues: 4 341 galaxies to 333 Mpc, 5 959 quasars, and the Hipparcos stars whose
 *      parallax is good to 20 % — decoded here from the embedded binary, counted here
 *   3. the finding the map is drawn to show: on the linear axis every galaxy the atlas names
 *      lies in the bottom 2.4 % of the way to the first light, the stars in the bottom
 *      10⁻⁴ %, and only the quasars reach half way
 *   4. the logarithmic strip spans sixteen decades, from 0.3 AU to the last-scattering surface
 *   5. honesty: the band the original fills with SDSS galaxies is drawn as a labelled gap, and
 *      the CMB band is declared a Gaussian realisation, not the Planck map
 *   6. the wiring: command palette, journeys, Discoveries, the API and the headset panel
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

/* 1 · the first light, integrated here in z (not ln(1+z), not the page's routine) */
const h = 0.674, Om = 0.315, Or = 4.18e-5 / (h * h);
const Dc = (z, rad, H0) => { const OL = 1 - Om - (rad ? Or : 0), n = 400000; let s = 0; const dz = z / n;
  for (let i = 0; i <= n; i++) { const zz = i * dz, E = Math.sqrt((rad ? Or * (1 + zz) ** 4 : 0) + Om * (1 + zz) ** 3 + OL), w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2); s += w / E; }
  return 299792.458 / (H0 || 100 * h) * dz / 3 * s; };
const Dcmb = Dc(1090, true), Dnorad = Dc(1090, false);
ok('the first light: D_C(z = 1090) with radiation is 13.86 Gpc (Planck 2018 ≈ 13.87), and the page uses the radiation-aware integral for it',
  Math.abs(Dcmb - 13864) < 25 && /const Dcmb=umapComovingRadMpc\(1090\);/.test(SRC) && /Ω_r h² = 4\.18e-5/.test(SRC), `${Dcmb.toFixed(0)} Mpc`);
const oldQuad = z => { const n = 200, hh = z / n; let s = 0; for (let i = 0; i <= n; i++) { const w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2); s += w / Math.sqrt(0.315 * (1 + i * hh) ** 3 + 0.685); } return 299792.458 / 67.4 * (hh / 3) * s; };
ok('MUTATION — the old routine, 200 Simpson steps in z, puts the first light at 16.05 Gpc, 15 % too far, and is caught; the page now integrates in ln(1+z) above z = 20',
  Math.abs(oldQuad(1090) / Dnorad - 1) > 0.1 && /if\(z>20\) return 299792\.458\/67\.4\*hccLnIntegral\(z,/.test(SRC), `old ${oldQuad(1090).toFixed(0)} Mpc · exact without radiation ${Dnorad.toFixed(0)} Mpc · with radiation ${Dcmb.toFixed(0)} Mpc (radiation ${(100 * (1 - Dcmb / Dnorad)).toFixed(2)} %)`);
{ const lnInt = z => { const n = 4000, u1 = Math.log1p(z); let s = 0; for (let i = 0; i <= n; i++) { const a1 = Math.exp(u1 * i / n), w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2); s += w * a1 / Math.sqrt(0.315 * a1 ** 3 + 0.685); } return 299792.458 / 67.4 * (u1 / n / 3) * s; };
  ok('the repaired routine agrees with an exact integral at z = 50, 100 and 1090 to 10⁻⁵, and below z = 20 nothing changed', [50, 100, 1090].every(z => Math.abs(lnInt(z) / Dc(z, false, 67.4) - 1) < 1e-5) && [0.5, 2, 4.5, 10].every(z => Math.abs(oldQuad(z) / Dc(z, false, 67.4) - 1) < 1e-5)); }

/* 2 · the catalogues, decoded here */
const GAL = SRC.match(/const DSO3D_GAL=\{count:(\d+),sha256:'[0-9a-f]+',b64:'([^']+)'/), QSO = SRC.match(/const QSO3D=\{count:(\d+)/), HIP = SRC.match(/const HCC_SKY_HIP=\{count:(\d+),vlim:7,rec:(\d+),[\s\S]*?b64:"([^"]+)"/) || SRC.match(/const HCC_SKY_HIP=\{count:(\d+),vlim:7,rec:(\d+),[\s\S]*?b64:'([^']+)'/);
const galBuf = Buffer.from(GAL[2], 'base64'), nGal = +GAL[1]; let gMax = 0;
for (let i = 0; i < nGal; i++) { const dK = Math.pow(10, galBuf.readUInt16LE(i * 8 + 4) / 8000 - 2); gMax = Math.max(gMax, dK / 1000); }
let nStar = 0, sMax = 0; if (HIP) { const b = Buffer.from(HIP[3], 'base64'), rec = +HIP[2];
  for (let i = 0; i < +HIP[1]; i++) { const o = i * rec, plx = b.readUInt32LE(o + 16) / 100, eplx = b.readUInt16LE(o + 20) / 1000; if (plx > 0 && eplx / plx < 0.2) { nStar++; sMax = Math.max(sMax, 1 / plx); } } }
const rowsStart = SRC.indexOf('rows:[', SRC.indexOf('const QSO3D={')); let zMax = 0, nQ = 0;
{ const seg = SRC.slice(rowsStart, rowsStart + 2e6), re = /\["[^"]*",(-?[\d.]+),(-?[\d.]+),([\d.]+),/g; let m; const end = seg.indexOf(']]'); const body = seg.slice(0, end + 2);
  while ((m = re.exec(body))) { nQ++; zMax = Math.max(zMax, +m[3]); } }
ok('the catalogues, decoded here: 4 341 galaxies reaching 333 Mpc, 5 959 quasars, and the Hipparcos stars with parallax good to 20 %',
  nGal === 4341 && Math.abs(gMax - 333) < 1 && +QSO[1] === 5959 && nQ === 5959 && nStar > 15000, `${nGal} galaxies to ${gMax.toFixed(1)} Mpc · ${nQ} quasars to z = ${zMax} · ${nStar} stars placed, the farthest at ${(sMax * 1000).toFixed(0)} pc`);

/* 3 · the finding */
const fGal = gMax / Dcmb, fQ = Dc(zMax, false) / Dcmb, fS = sMax * 1e-3 / Dcmb;
ok('on the linear axis every galaxy the atlas names lies in the bottom 2.4 % of the way to the first light, its stars in the bottom 10⁻⁴ %, and its quasars reach about half way',
  Math.abs(fGal - 0.024) < 0.001 && fS < 1e-6 && fQ > 0.5 && fQ < 0.6, `galaxies ${(100 * fGal).toFixed(2)} % · stars ${(100 * fS).toExponential(1)} % · quasars ${(100 * fQ).toFixed(1)} %`);

/* 4 · sixteen decades */
const AU_MPC = 4.84813681e-12, dec = Math.log10(Dcmb / (0.3 * AU_MPC));
ok('the logarithmic strip spans sixteen decades, from 0.3 AU to the last-scattering surface, with every level of the atlas named on it',
  dec > 15.8 && dec < 16.2 && /const UMAP_DMIN=0\.3\*UMAP_AU_MPC;/.test(SRC) && /'Oort cloud','облако Оорта'/.test(SRC) && /'Local Group','Местная группа'/.test(SRC), `${dec.toFixed(2)} decades`);

/* 5 · honesty */
ok('honest about what is missing: the SDSS band is a labelled gap, and the CMB band is declared a Gaussian realisation, not the Planck map',
  /the original map\\'s SDSS galaxies live here — not bundled with this atlas, so nothing is drawn/.test(SRC) && /a Gaussian realisation — the Planck map is not bundled/.test(SRC));

/* 6 · wiring */
ok('the wiring: palette, journeys, Discoveries, HCC_UMAP, and the map as a panel in the headset with a wrist button',
  /add\('Map of the Universe',/.test(SRC) && /\['▦','Map of the Universe',/.test(SRC) && /globalThis\.HCC_UMAP=Object\.freeze\(\{open:/.test(SRC)
  && /function umapXrToggle\(\)\{/.test(SRC) && /label:'▦ Map', on:!!HCC_UMAP\.xrOn\(\)/.test(SRC) && /\['▦',TT\('Everything with a name sits at the bottom'/.test(SRC));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
