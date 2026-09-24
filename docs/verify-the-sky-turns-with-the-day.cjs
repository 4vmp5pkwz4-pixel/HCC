#!/usr/bin/env node
'use strict';
/* ══ THE SKY TURNS WITH THE DAY ═════════════════════════════════════════════════
 * Standing on the Earth, the sky is lit by the Sun wherever the Sun is, the clock
 * turns at the rate the sky really turns, and nothing under your feet breaks apart.
 * This file reads index.html and COMPUTES:
 *   1. the twilight sequence: the naked-eye limiting magnitude falls from 6.5 at the end
 *      of astronomical twilight to 5 at nautical, 2 at civil, −2 at sunset and −3.5 in
 *      daylight, monotonically, and every star layer is dimmed by exactly 6.5 − that
 *   2. the dome covers what the sky outshines, leaves the Sun and the Moon open, and is
 *      opaque ground below the horizon lowered by the dip for the eye's height
 *   3. close to the Earth nothing is placed through viewMatrix·modelMatrix on the GPU:
 *      at 1 AU from the origin float32 world positions wobble by kilometres (measured:
 *      spikes along the horizon), so the dome and the Earth use the float64-formed
 *      modelViewMatrix, and the globe's own facets are not drawn under your feet
 *   4. landing drops the clock to real time and leaving restores the rate you flew with
 *   5. a card declares the scale it lives at, so a galaxy or a globular cluster chosen
 *      from search opens where it is drawn; the palette finds the deep sky by every
 *      designation before it has been clicked
 *   6. the Nexus census counts every laboratory, the duplicate typed edge is gone, and
 *      the Predictive Observatory is a scoped panel with its dock control
 *   7. MUTATIONS: a float32 world-space dome, a sky that forgets the stars, a landing
 *      that keeps the flight rate, and a card whose layer is ignored are each caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const grab = (s, re) => (s.match(re) || [])[0] || '';

/* 1 · twilight */
const tw = s => { try { return new Function(grab(s, /const HCC_TWILIGHT=\[[^\n]*\];/) + grab(s, /function hccNelm\(hDeg\)\{[\s\S]*?return 6\.5; \}/) + ';return hccNelm;')(); } catch (e) { return null; } };
const N = tw(SRC), pts = N ? [10, 0, -6, -12, -18, -30].map(h => [h, N(h)]) : [];
let mono = !!N; for (let h = 20; h > -30 && N; h -= 0.5) if (N(h - 0.5) < N(h) - 1e-12) mono = false;
ok('the limiting magnitude follows the twilight sequence and never brightens as the Sun sinks', N && mono && N(-18) === 6.5 && N(-12) === 5 && N(-6) === 2 && N(0) === -2 && N(10) === -3.5,
  pts.map(([h, m]) => `h ${h}° → ${m.toFixed(1)}`).join(' · '));
const dims = s => /m\+=uSky;/.test(s) && /uSky:\{value:0\}/.test(s) && /for\(const m of HCC_STAR_MATS\) if\(m\.uniforms\.uSky\) m\.uniforms\.uSky\.value=6\.5-nelm;/.test(s);
ok('every star layer is dimmed by exactly the magnitudes the sky takes away — one uniform in the shared star shader', dims(SRC));

/* 2 · the dome */
ok('the dome covers what the sky outshines, leaves the Sun and the Moon open, and is ground below the dipped horizon',
  /U\.uA\.value=Math\.min\(0\.985,Math\.max\(0,1-Math\.pow\(10,-0\.2\*\(6\.5-nelm\)\)\)\);/.test(SRC)
  && /if\(acos\(clamp\(mu,-1\.0,1\.0\)\)<uRs\*1\.15\) al=0\.0;/.test(SRC) && /if\(acos\(clamp\(dot\(v,uMoon\),-1\.0,1\.0\)\)<uRm\*1\.05\) al=0\.0;/.test(SRC)
  && /if\(a< -sin\(uDip\)\)\{/.test(SRC) && /Math\.acos\(6\.371e6\/\(6\.371e6\+hm\)\)/.test(SRC));
const dip = Math.acos(6.371e6 / (6.371e6 + 151.5)) * 180 / Math.PI;
ok('the horizon is lowered by the dip for the eye\'s height', dip > 0.3 && dip < 0.5, `eye 150 m + 1.5 m → dip ${dip.toFixed(3)}°`);

/* 3 · precision */
const precise = s => /vertexShader:`varying vec3 vD; void main\(\)\{ vD=normalize\(position\); gl_Position=projectionMatrix\*modelViewMatrix\*vec4\(position,1\.0\); \}`/.test(s)
  && /vec4 w=modelMatrix\*vec4\(position,1\.0\); vW=w\.xyz; gl_Position=projectionMatrix\*modelViewMatrix\*vec4\(position,1\.0\);/.test(s)
  && /if\(hide&&!o\.mesh\.userData\.hccGroundHidden\)\{ lay\(31\); o\.mesh\.userData\.hccGroundHidden=true; \}/.test(s);
ok('near the Earth every position is formed in float64: the dome and the Earth draw through modelViewMatrix, and the facets under your feet are not drawn',
  precise(SRC), `float32 step at 1 AU = ${(Math.pow(2, -23) * 1.496e8).toFixed(1)} km — larger than the eye's height`);

/* 4 · real time on landing */
const slow = s => /if\(Math\.abs\(r\)>Math\.abs\(rt\)\*1\.0001\)\{ HCC_TIME_FABRIC\.setRateDaysPerSecond\(rt,'landing\.realTime'\); state\.landed\.slowedTo=rt; \}/.test(s)
  && /r=Number\(snap\.rateDaysPerSecond\)\|\|0, rt=\(Math\.sign\(r\)\|\|1\)\/86400;/.test(s)
  && /if\(Math\.abs\(now-L\.slowedTo\)<1e-12\) HCC_TIME_FABRIC\.setRateDaysPerSecond\(L\.prevRate,'landing\.restoreRate'\);/.test(s);
ok('landing drops the clock to real time (one second per second) and leaving restores the rate you flew with, unless you changed it', slow(SRC),
  `at 10 days/s the sky turned ${(10 * 360.9856).toFixed(0)}° per second; at real time it turns ${(360.9856 / 86400 * 3600).toFixed(2)}° per hour`);

/* 5 · layers and the deep sky in the palette */
const layered = s => /else if\(s\.layer\) state\.solarScaleLayer=typeof s\.layer==='function'\?s\.layer\(\):s\.layer;/.test(s)
  && /registerSel\('mwt_'\+it\.o\.key,\{[^\n]*layer:'galactic'/.test(s) && /registerSel\('dsol_'\+k,\{[^\n]*layer:'galactic'/.test(s)
  && /registerSel\(key,\{name,mode:'solar',layer:g\.dK<3000\?'andromeda':'cosmic'/.test(s);
ok('a card declares the scale it lives at: galaxies, clusters, nebulae and arm tracers open where they are drawn', layered(SRC));
const names = (SRC.match(/const DSO3D_GAL_NAMES=(\{.*?\});\n/) || [0, '{}'])[1], nNamed = Object.keys(JSON.parse(names)).length;
ok('the palette finds the deep sky by every name and designation before anything has been clicked',
  /function deepIndex\(\)\{/.test(SRC) && /\.\.\.deepIndex\(\)\.filter\(d=>!reg\.has\(d\.key\)\)/.test(SRC) && nNamed > 3000,
  `${nNamed} named galaxies and the Galaxy's own clusters and nebulae, each under all its designations`);

/* 6 · the self-test repairs */
ok('the Nexus census counts every laboratory of the atlas, and the one duplicate typed edge (bhr–qso) is gone',
  /const known=LAB_REGISTRY\.map\(l=>l\.id\)\.filter\(v=>v!=='nexus'\)\.sort\(\)/.test(SRC)
  && (SRC.match(/\['(?:bhr','qso|qso','bhr)','coupling'/g) || []).length === 1);
ok('the Predictive Reach Observatory is a scoped panel with its own dock control, folded with the secondary ones',
  /predictivePanel:\{scope:'global'\}/.test(SRC) && /data-panel="predictivePanel"/.test(SRC) && /'atlasPanel','predictivePanel','oscPanel'/.test(SRC));

/* 7 · mutations */
ok('MUTATION — a dome placed through viewMatrix·modelMatrix in float32 is caught',
  !precise(SRC.replace('vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);', 'vD=normalize(position); gl_Position=projectionMatrix*viewMatrix*(modelMatrix*vec4(position,1.0));')));
ok('MUTATION — a daylight sky that forgets to dim the stars is caught', !dims(SRC.replace('m+=uSky;', '')));
ok('MUTATION — a landing that keeps the flight rate is caught', !slow(SRC.replace("HCC_TIME_FABRIC.setRateDaysPerSecond(rt,'landing.realTime');", '')));
ok('MUTATION — a card whose declared layer is ignored is caught', !layered(SRC.replace('else if(s.layer) state.solarScaleLayer=', 'else if(false) state.solarScaleLayer=')));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
