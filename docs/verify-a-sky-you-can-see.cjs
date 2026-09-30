#!/usr/bin/env node
'use strict';
/* ══ A SKY YOU CAN SEE (v4.348) ══════════════════════════════════════════════════════════════════════════════════
 * Reported: on an iPhone the central Solar view showed almost no stars and no Milky Way. Measured: the phone draws
 * without the desktop's bloom, and the central view looks toward the galactic anticentre, where the band is five times
 * fainter by its own integral. Checked on the source:
 *   1. the calibration is untouched — the star law's constants and the band's integral are as they were
 *   2. one exposure, as a camera's: a uniform multiplying every star's peak, a gain on the band, and a tone curve that
 *      lifts the band's faint parts (identity at exposure 1); phones start brighter than desktops
 *   3. the reader sets it (✦ Sky exposure), and it is remembered
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
ok('the calibration is untouched: the star law and the band integral keep their constants',
  /lim:6\.5, gain:0\.35, gamma:0\.5,/.test(SRC) && /hR:2\.6, hz:0\.30, R0:8\.178, hzDust:0\.125,/.test(SRC) && /magPerKpc:1\.8, magToTau:1\/1\.0857, covering:0\.05,/.test(SRC));
ok('one exposure: every star’s peak times uExposure, the band’s gain and tone curve follow it, and the curve is the identity at exposure 1',
  /uniform float uSpikes; uniform float uExposure;/.test(SRC) && /\*tw\*uExposure;/.test(SRC) && /u\.uExposure\.value=skyEx(\*starCrowd)?;/.test(SRC)
  && /mwMesh\.material\.color\.setScalar\(g\)/.test(SRC) && /HCC_MW_GAMMA\.value=Math\.max\(0\.45,Math\.min\(1\.2,1\/\(1\+0\.35\*\(skyEx-1\)\)\)\)/.test(SRC)
  && /diffuseColor\.rgb=pow\(max\(diffuseColor\.rgb,vec3\(0\.0\)\),vec3\(uMWGamma\)\)/.test(SRC) && Math.abs(1 / (1 + 0.35 * (1 - 1)) - 1) === 0);
{ const m = SRC.match(/return phone\?([0-9.]+):([0-9.]+); \}/); const phone = m ? +m[1] : 0, desk = m ? +m[2] : 0;
  ok('a phone starts brighter than a desktop (no bloom, daylight, arm’s length), and both brighter than the old 1', phone > desk && desk > 1, `phone ${phone} · desktop ${desk}`); }
ok('the reader sets it — ✦ Sky exposure in the Solar controls — and it is remembered',
  /id="skyExp" min="0\.5" max="5"/.test(SRC) && /localStorage\.setItem\('hcc\.skyExposure\.v1'/.test(SRC) && /localStorage\.getItem\('hcc\.skyExposure\.v1'\)/.test(SRC));
console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
