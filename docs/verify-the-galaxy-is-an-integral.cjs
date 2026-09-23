#!/usr/bin/env node
'use strict';
/* ══ THE GALAXY WAS PAINTED, AND IT IS AN INTEGRAL ═════════════════════════════
 *
 * The band was fifteen hundred Gaussian blobs at H*0.034 with a bulge at W*0.15 —
 * numbers with no relation to any galaxy. What a person actually sees looking up is
 * the line-of-sight integral through the disc they are standing in, and every
 * quantity that integral needs has been measured.
 *
 *   I(ℓ,b) = ∫ exp(−R(s)/h_R) exp(−|z(s)|/h_z) exp(−τ(s)) ds
 *
 * with h_R = 2.6 kpc, h_z = 0.30 kpc, R₀ = 8.178 kpc (GRAVITY 2019), dust scale
 * height 0.125 kpc and 1.8 mag/kpc of V extinction in the plane at the Sun. The
 * brightness toward Sagittarius, the width of the band at each longitude and the
 * fall-off with latitude are then consequences of one expression rather than three
 * separately tuned constants.
 *
 * AND A SMOOTH DUST LAYER AT THE MEASURED OPACITY MAKES THE GALAXY VANISH. Measured,
 * not asserted: with κ fixed by its own definition the smooth model gives
 * I(0)/I(180) = 1.01 and no band at all, because only the nearest half kiloparsec
 * survives and that is nearly isotropic. Without dust the same integral gives 45 : 1,
 * which is far too much. The band exists because real dust is in clouds covering a
 * small fraction of sight lines — which is why Baade's Window exists — so the smooth
 * law is applied at a DECLARED covering fraction, and 0.05 lands at 5.15 : 1.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

const rec = (() => { const i = src.indexOf('const HCC_GALAXY=Object.freeze({');
  return i < 0 ? null : src.slice(i, src.indexOf('});', i) + 3); })();
const num = k => Number((rec.match(new RegExp(k + ':([\\d.]+)')) || [])[1]);
ok('the disc is one frozen record of measured quantities, and it names where they come from',
  !!rec && /hR:2\.6/.test(rec) && /hz:0\.30/.test(rec) && /R0:8\.178/.test(rec)
  && /GRAVITY 2019/.test(rec),
  `h_R = ${num('hR')} kpc · h_z = ${num('hz')} kpc · R₀ = ${num('R0')} kpc · dust h_z = ${num('hzDust')} kpc`);

const G = { hR: num('hR'), hz: num('hz'), R0: num('R0'), hzD: num('hzDust'),
  mag: num('magPerKpc'), cov: num('covering'), step: 0.01, reach: 60 };
const kappa = G.mag / 1.0857 * Math.exp(G.R0 / G.hR);
const col = (l, b, f) => { const D = Math.PI / 180;
  const cl = Math.cos(l * D), sl = Math.sin(l * D), cb = Math.cos(b * D), sb = Math.sin(b * D);
  let I = 0, tau = 0;
  for (let s = G.step / 2; s < G.reach; s += G.step) {
    const x = G.R0 - s * cb * cl, y = -s * cb * sl, z = s * sb, R = Math.hypot(x, y);
    const rad = Math.exp(-R / G.hR);
    tau += f * kappa * rad * Math.exp(-Math.abs(z) / G.hzD) * G.step;
    I += rad * Math.exp(-Math.abs(z) / G.hz) * Math.exp(-tau) * G.step; }
  return I; };

ok('the extinction coefficient is pinned by its own definition rather than chosen',
  /const HCC_GAL_KAPPA=HCC_GALAXY\.magPerKpc\*HCC_GALAXY\.magToTau\*Math\.exp\(HCC_GALAXY\.R0\/HCC_GALAXY\.hR\)/.test(src)
  && Math.abs(kappa - 38.5) < 0.5,
  `κ = ${kappa.toFixed(2)} per kpc is the value that makes the plane extinction at the Sun come out at the measured ${G.mag} mag/kpc, and no other value does`);

ok('a smooth dust layer at that opacity erases the Galaxy entirely',
  col(0, 0, 1) / col(180, 0, 1) < 1.2,
  `I(0)/I(180) = ${(col(0, 0, 1) / col(180, 0, 1)).toFixed(2)} — only the nearest half kiloparsec survives, and that is nearly isotropic`);

ok('and no dust at all overshoots just as badly in the other direction',
  col(0, 0, 0) / col(180, 0, 0) > 30,
  `I(0)/I(180) = ${(col(0, 0, 0) / col(180, 0, 0)).toFixed(1)} against an observed band only a few times brighter toward Sagittarius`);

ok('so the covering fraction is declared, and at its declared value the contrast lands where the sky is',
  G.cov > 0 && G.cov < 1
  && col(0, 0, G.cov) / col(180, 0, G.cov) > 3 && col(0, 0, G.cov) / col(180, 0, G.cov) < 9,
  `covering ${G.cov} → ${(col(0, 0, G.cov) / col(180, 0, G.cov)).toFixed(2)} : 1 · a stand-in for structure this model does not resolve, written down as one rather than folded into κ`);

ok('the axis ratio is why the Galaxy is a band, and it comes from the measured scale lengths',
  Math.abs(G.hR / G.hz - 8.67) < 0.05,
  `h_R/h_z = ${(G.hR / G.hz).toFixed(2)} · a disc that many times wider than thick can only look like a band from inside it`);

/* The rift used to be 430 dark clouds dropped at random with this scale height. It is
   now the OBSERVED rift — the holes of the measured isophotes — so the check asks two
   things: that the integral still carries the dust inside the stars, and that no cloud
   is placed at random any more. */
ok('the dust sits inside the stars, which is why the rift cuts the bulge instead of bounding it — and the rift drawn is the observed one, not clouds placed at random',
  G.hzD < G.hz && Math.abs(G.hzD / G.hz - 0.417) < 0.01
  && /Math\.exp\(-Math\.abs\(z\)\/G\.hzDust\)/.test(src)
  && /id="hcc-mw-iso"/.test(src) && /const isoAt=\(l,b\)=>/.test(src)
  && !/for\(let i=0;i<430\*K;i\+\+\)/.test(src) && !/rgba\(6,5,9,/.test(src),
  `dust h_z is ${(G.hzD / G.hz).toFixed(3)} of the stellar one inside the integral; the rift is the holes of the measured isophotes (d3-celestial mw.json)`);

const hw = l => { const pk = col(l, 0, G.cov);
  for (let b = 0.25; b < 60; b += 0.25) if (col(l, b, G.cov) < pk / 2) return b; return 60; };
ok('the width of the band at each longitude is a consequence of the same integral, not a second constant',
  hw(0) > 3 && hw(0) < 15 && hw(180) > 3 && hw(180) < 20,
  `half-intensity half-width ${hw(0).toFixed(1)}° toward the centre, ${hw(90).toFixed(1)}° at ℓ=90°, ${hw(180).toFixed(1)}° toward the anticentre`);

/* ── what the page draws ─────────────────────────────────────────────────────── */
ok('every texel of the panorama reads that integral rather than a blob — weighted by the observed isophotes, never by a random one',
  /const t=Math\.pow\(Math\.max\(0,hccGalacticBrightness\(l,b\)\),0\.62\)\*\(ISO\?\(0\.28\+0\.72\*isoAt\(l,b\)\):1\);/.test(src)
  && !/dense stellar speckle/.test(src)
  && !/const bulge=Math\.exp\(-\(\(u-W\/2\)\*\*2\)\/\(2\*\(W\*0\.15\)\*\*2\)\);/.test(src),
  'the fifteen hundred Gaussians at H*0.034 with a bulge at W*0.15 are gone, and the numbers that replaced them were all measured by somebody');

ok('the integral is evaluated on a grid and read back bilinearly, because it is smooth in both angles',
  /gridLon:256, gridLat:128/.test(src) && /function hccGalacticBrightness\(lDeg,bDeg\)\{/.test(src)
  && /\(g\(i0,j0\)\*\(1-fu\)\+g\(i1,j0\)\*fu\)\*\(1-fv\)/.test(src),
  'a quarter of a million evaluations would buy nothing a thousand cannot, and the cost is paid once at load');

ok('the grid wraps in longitude, so there is no seam where the sky closes on itself',
  /u=\(\(u%F\.NL\)\+F\.NL\)%F\.NL;/.test(src) && /const i1=\(i0\+1\)%F\.NL/.test(src),
  'ℓ = −180° and ℓ = +180° are the same direction, and the interpolation has to know that');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
