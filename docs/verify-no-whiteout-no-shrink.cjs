#!/usr/bin/env node
'use strict';
/* ══ NO WHITE-OUT AT THE SCALE OF THE UNIVERSE, NO SHRINKING SUN ON THE LADDER (v4.397) ══════════════════════════════════
 * Two reports, measured before they were fixed:
 *   · the Horizons world at the scale of the whole universe went white. Measured on the frame (a PNG decoded, mean
 *     luminance over 255): at 1 200 Gly the section of the model S³'s zonal mode — a disc πR = 2 785 Gly in radius, facing
 *     the reader, added 0.42 of linear light to every pixel it covered — lifted the mean from 24.8 to 85.8, and the bloom
 *     did the rest; after the fix it is 27.2
 *   · between rungs 209 and 219 the Sun shrank twice as the φ-ladder slider moved: the Solar world draws it 24 times its
 *     size, the ladder counts true lengths, and at the hand-over the descent's true Sun replaced the enlarged one (and the
 *     way back out placed the camera by the enlarged radius)
 * Checked here:
 *   1. the section's fill is a tint (≤ 0.1 of linear light per pixel, its shape carried by lines), and past the observable
 *      sphere the Horizons world's bloom rises to the threshold of the dense additive worlds
 *   2. the Sun's enlargement fades with the camera's distance: exactly 1 inside 7.5 R_☉ — so at the hand-over (3.9 R_☉) and
 *      at the way back out (1.2 rungs higher, 6.9 R_☉) the Sun is drawn true — and the full S₀ far out
 *   3. its apparent radius s·R/d grows monotonically as the camera comes in, for every enlargement the panel offers: the Sun
 *      never shrinks on approach
 *   4. the way out of the Sun's descent places the camera by the true radius, and the scale is the one the frame loop draws
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const fn = name => { const i = SRC.indexOf('function ' + name + '('); if (i < 0) throw new Error('no function ' + name); let d = 0, j = SRC.indexOf('{', i);
  for (let k = j; k < SRC.length; k++) { const c = SRC[k]; if (c === '{') d++; else if (c === '}') { d--; if (!d) return SRC.slice(i, k + 1); } } throw new Error('unbalanced ' + name); };
try {
  /* 1 */
  { const sh = SRC.slice(SRC.indexOf('float PI=3.14159265, rho=length(vQ), chi=rho/uR;'), SRC.indexOf('gl_FragColor=vec4((col*(a+0.32*iso)'));
    const fill = (sh.match(/float a=abs\(w\)\*([0-9.]+)\*\(1\.0-smoothstep\(PI-0\.25,PI,chi\)\)/) || [])[1];
    const lines = /float fw=max\(fwidth\(w\),1e-4\), iso=\(1\.0-smoothstep\(0\.7\*fw,1\.9\*fw,abs\(abs\(w\)-0\.5\)\)\)/.test(sh);
    const bloom = /if\(state\.mode==='obs'\)\{ let d=0; try\{ d=camera\.position\.distanceTo\(controls\.target\); \}catch\(e\)\{\} return d>110\?\{strength:\.3,radius:\.46,threshold:\.88\}/.test(fn('premiumBloomProfile'));
    ok('the section of the mode is a tint, not a wall: its fill adds at most 0.1 of linear light, its shape is in lines, and past the observable sphere the bloom keeps to true highlights',
      fill != null && +fill <= 0.1 && lines && bloom, `fill ${fill} of linear light per pixel (was 0.42) · isolines |f| = ½ ${lines ? '✓' : '✗'} · bloom threshold .88 beyond 110 Gly ${bloom ? '✓' : '✗'}`); }
  /* 2, 3 */
  const KM = 1.495978707e8, R = 695700 / KM;
  const mk = d => new Function('SUN', 'KM_PER_AU', 'camera', 'sunMesh', fn('sunProximityScale') + '\nreturn sunProximityScale;')({ r: 695700 }, KM, { position: { distanceTo: () => d } }, { position: {} });
  const sAt = (S0, d) => mk(d)(S0);
  { const hand = 3.9 * R, out = hand * Math.pow((1 + Math.sqrt(5)) / 2, 1.2);
    const near = [R * 1.2, hand, out, 7.49 * R].every(d => Math.abs(sAt(24, d) - 1) < 1e-12), far = Math.abs(sAt(24, 7.5 * R * Math.pow(24, 1.6) * 1.001) - 24) < 1e-9 && Math.abs(sAt(24, 50) - 24) < 1e-12;
    const handover = /const dscTop=b=>levelOf\(2\*Math\.tan\(camera\.fov\*Math\.PI\/360\)\*b\.R\*\(b\.star\?300:3\.9\)\);/.test(SRC) && /DSC\.top=dscTop\(b\); DSC\.exitN=DSC\.top\+1\.2;/.test(SRC);
    ok('the Sun’s enlargement is exactly 1 inside 7.5 solar radii — at the hand-over (3.9 R_☉) and at the way back out (6.9 R_☉) the Sun is drawn true — and the full 24 far out',
      near && far && handover, `s(3.9 R) = ${sAt(24, hand).toFixed(6)} · s(6.9 R) = ${sAt(24, out).toFixed(6)} · s(50 AU) = ${sAt(24, 50).toFixed(3)} · hand-over and exit rungs ${handover ? '✓' : '✗'}`); }
  { let worst = -Infinity, cases = 0; for (const S0 of [2, 5, 10, 24, 60, 120, 300]) { let prev = Infinity; for (let i = 0; i <= 4000; i++) { const d = R * Math.pow(10, -0.0 + 6 * i / 4000), a = sAt(S0, d) * R / d; if (a > prev * (1 + 1e-12)) worst = Math.max(worst, a / prev - 1); prev = a; cases++; } }
    ok('its apparent radius grows monotonically as the camera comes in, for every enlargement from 2 to 300: the Sun never shrinks on approach',
      worst === -Infinity, `${cases} distances from R_☉ to 10⁶ R_☉ · ${worst === -Infinity ? 'no step where the disc shrinks' : 'shrinks by ' + worst.toExponential(2)}`); }
  /* 4 */
  { const exit = /\(b\.sun\?b\.R\/DSC_AU:dscBodyDrawnR\(b\)\)\/b\.R;/.test(fn('descentExit'));
    const frame = /const sScale = state\.trueScale \? 1 : sunProximityScale\(state\.sunScale\);\n    sunMesh\.scale\.setScalar\(SUN\.r\/KM_PER_AU\*sScale\);/.test(SRC);
    ok('the way out of the Sun’s descent places the camera by the true radius, and the frame loop draws the faded scale',
      exit && frame, `exit by the true radius ${exit ? '✓' : '✗'} · the loop draws sunProximityScale ${frame ? '✓' : '✗'}`); }
} catch (e) { fail++; console.log('  FAIL — verifier error: ' + (e && e.stack || e)); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
