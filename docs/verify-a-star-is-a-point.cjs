#!/usr/bin/env node
'use strict';
/* ══ A STAR IS A POINT, AND THE LIGHT IT SENDS IS NOT ════════════════════════
 *
 * The constellation stars were a canvas gradient sized by a five-entry table and did
 * not shine. They are now drawn through a stellar point-spread function whose
 * brightness is the flux the CAMERA receives. This file takes HCC_STAR_PSF — the
 * JavaScript twin the shader is generated from — out of index.html and COMPUTES:
 *
 *   1. from the Sun, the magnitude drawn is the catalogue V of every placed zodiac
 *      star, to rounding (M = V + 5 + 5 log ϖ″, m = M + 5 log(d/10 pc))
 *   2. brightness is monotone in magnitude across the whole range, INCLUDING the soft
 *      knee that keeps far stars findable: no two stars ever swap rank
 *   3. the drawn size grows with brightness and the profile falls with radius
 *   4. the core of a first-magnitude star is HDR (> 1, so it blooms) and a star at the
 *      naked-eye limit is not (so the faint sky does not glow)
 *   5. the airmass is Kasten & Young (1989): 1 at the zenith, 38.09 at the horizon
 *   6. scintillation is exactly zero where there is no air, and grows as X^1.75
 *   7. the shader is GENERATED from those constants, not a second copy of them, and
 *      its point size follows the buffer the post chain actually draws into
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const between = (a, b) => { const i = src.indexOf(a); const j = src.indexOf(b, i); return i < 0 || j < 0 ? '' : src.slice(i, j); };

const psfTxt = between('const HCC_STAR_PSF={', 'const HCC_STAR_MATS=new Set();');
const P = new Function(psfTxt + '\nreturn HCC_STAR_PSF;')();
const FIELDS = JSON.parse(between('const ZOD3D_FIELDS=', ';\n').replace('const ZOD3D_FIELDS=', ''));
const ROWS = JSON.parse('[' + between('const ZOD3D_STARS=[', '];\nconst ZOD3D_FIGURES=').replace('const ZOD3D_STARS=[', '') + ']');
const STARS = ROWS.map(r => Object.fromEntries(FIELDS.map((f, k) => [f, r[k]])));

{ /* 1. from the Sun the drawn magnitude IS the catalogue magnitude */
  let worst = 0, n = 0;
  for (const s of STARS) { if (!(s.plx > 0) || s.q === 'D') continue; n++;
    const M = s.V + 5 + 5 * Math.log10(s.plx / 1000), m = P.appMag(M, 1000 / s.plx);
    worst = Math.max(worst, Math.abs(m - s.V)); }
  ok('seen from the Sun every placed zodiac star is drawn at exactly its catalogue V — the renderer derives the magnitude from where the camera is, and from the Sun that is the catalogue',
    n > 500 && worst < 1e-9, `${n} stars · worst |m − V| = ${worst.toExponential(2)} mag`);
  const antM = 1.06 + 5 + 5 * Math.log10(5.89 / 1000);
  ok('and from elsewhere it is the flux that arrives THERE: Antares from 10 pc is m = M exactly, and from 1 pc five magnitudes brighter than that',
    Math.abs(P.appMag(antM, 10) - antM) < 1e-12 && Math.abs(P.appMag(antM, 1) - (antM - 5)) < 1e-12,
    `M = ${antM.toFixed(2)}`);
}
{ /* 2. rank is never broken */
  let bad = 0, prev = Infinity;
  for (let m = -2; m <= 25; m += 0.01) { const I = P.peak(m); if (!(I < prev)) bad++; prev = I; }
  ok('brightness falls monotonically with magnitude from −2 to 25, straight through the knee at ' + P.knee + ' that keeps a far star findable — so of any two stars the brighter is always drawn brighter',
    bad === 0, bad ? bad + ' inversions' : '2700 steps, no inversion');
  ok('and the knee only COMPRESSES, and only past the naked-eye limit: every star an eye could see is drawn at its true flux, and beyond it the slope is ' + P.kneeSlope + ', never zero',
    P.knee >= P.lim && P.displayMag(P.lim) === P.lim && P.displayMag(P.knee + 10) > P.displayMag(P.knee + 5) && P.kneeSlope > 0 && P.kneeSlope < 1,
    `knee at m = ${P.knee}, naked-eye limit m = ${P.lim}`);
}
{ /* 3. size and shape */
  let bad = 0, prev = 0;
  for (let I = 0.01; I < 40; I *= 1.05) { const r = P.radius(I); if (r < prev - 1e-12) bad++; prev = r; }
  ok('a brighter star is drawn larger because its glow reaches further, not because a table says so: the sprite radius never shrinks as the flux grows',
    bad === 0 && P.radius(P.peak(-1.46)) > P.radius(P.peak(3)) && P.radius(P.peak(3)) > P.radius(P.peak(6)),
    `Sirius ${P.radius(P.peak(-1.46)).toFixed(1)} px · m=3 ${P.radius(P.peak(3)).toFixed(1)} px · m=6 ${P.radius(P.peak(6)).toFixed(1)} px`);
  let mono = true; for (let r = 0; r < 60; r += 0.25) if (P.profile(4, r + 0.25) > P.profile(4, r)) mono = false;
  ok('and the point-spread function falls with radius everywhere: core, glow and Moffat wing add, none of them rises',
    mono && P.profile(4, 0) > 4);
}
{ /* 4. HDR where it should be, and only there */
  ok('the core of a first-magnitude star is HDR, so it saturates to white and feeds the bloom pass, and a star at the naked-eye limit is not, so the faint sky does not glow',
    P.peak(1) > 1 && P.peak(P.lim) < 1 && Math.abs(P.peak(P.lim) - P.gain) < 1e-12,
    `I₀(m=1) = ${P.peak(1).toFixed(2)} · I₀(m=${P.lim}) = ${P.peak(P.lim).toFixed(2)}`);
}
{ /* 5. the airmass */
  const z = P.airmass(90), h = P.airmass(0), a30 = P.airmass(30);
  ok('the airmass is Kasten & Young (1989), X = 1/(cos z + 0.50572(96.07995° − z)^−1.6364): 0.9997 at the zenith, 37.92 at the horizon, and within 0.3 % of the plane-parallel secant at 30°',
    Math.abs(z - 0.99972) < 2e-5 && Math.abs(h - 37.92) < 0.005 && Math.abs(a30 - 2) / 2 < 0.003,
    `X(90°) = ${z.toFixed(4)} · X(30°) = ${a30.toFixed(4)} · X(0°) = ${h.toFixed(3)}`);
}
{ /* 6. twinkle belongs to the air */
  ok('scintillation is exactly zero where there is no air and grows as X^1.75 where there is (Young 1967)',
    P.scintillation(10, 0) === 0 && Math.abs(P.scintillation(2, 1) / P.scintillation(1, 1) - Math.pow(2, 1.75)) < 1e-12,
    `σ(X=1) = ${P.scintillation(1, 1)} · σ(X=2) = ${P.scintillation(2, 1).toFixed(3)}`);
  ok('and the frame tick gives the air only to a body that has it: the Earth in full, Mars a tenth, and every other place — including all of space — none',
    /if\(body==='Earth'\)\{ tw=state\.starTwinkle===false\?0:1; ex=1; \}/.test(src)
    && /else if\(body==='Mars'\)\{ tw=state\.starTwinkle===false\?0:0\.1; ex=0\.4; \}/.test(src)
    && /let tw=0, ex=0, zen=null, body=null;/.test(src));
}
{ /* 7. one law, one copy */
  const mat = between('function hccStarMaterial(', 'function hccStarGeometry(');
  const uses = ['gain', 'lim', 'gamma', 'knee', 'kneeSlope', 'core0', 'coreK', 'halo', 'haloK', 'wing', 'wingB', 'eps', 'kV'];
  const missing = uses.filter(k => !mat.includes('${f(P.' + k + ')}'));
  ok('the shader is generated FROM those constants — every one of them enters the GLSL through the template, so the law measured here is the law drawn',
    missing.length === 0 && /const P=HCC_STAR_PSF/.test(mat), missing.length ? 'hard-coded: ' + missing.join(', ') : uses.length + ' constants interpolated');
  ok('the 3D stars run the camera-distance law in the shader, the sphere stars take their apparent magnitude as given',
    /\$\{abs\?`float dPc=max\(length\(mv\.xyz\),1e-6\)\/\$\{f\(P\.PC_AU\)\};\s*m=aMag\+5\.0\*log\(dPc\/10\.0\)\/log\(10\.0\);`:''\}/.test(mat)
    && /hccStarMaterial\(\{abs:false\}\)/.test(src) && /const mat=hccStarMaterial\(\{abs:true\}\);/.test(src));
  ok('and the point size follows the buffer the post chain actually draws into — at 10 fps the governor had shrunk every star to 0.6 of its size',
    /px=premiumComposerPixelRatio\(\);/.test(src) && /u\.uPx\.value=Math\.max\(0\.25,Math\.min\(2,px\)\);/.test(src));
  ok('every star layer goes through it: the zodiac in depth, the zodiac stars no catalogue can place, and the other constellations',
    /name='constellation-stars-psf'/.test(src) && /p\.name='zodiac-directions-only'/.test(src)
    && /hccStarGeometry\(pos,col,mag,new Float32Array\(D\.length\)\.fill\(\.8\)\),hccStarMaterial\(\{abs:false\}\)/.test(src)
    && !/size:bb\[1\], map:sprite/.test(src));
}

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
