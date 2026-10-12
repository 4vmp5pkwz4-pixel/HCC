#!/usr/bin/env node
'use strict';
/* ══ ROUND STARS, AND STARS ONE CAN FLY TO (v4.380) ══════════════════════════════════════════════════════════════════
 * Reported: up close the stars looked square, and one could not jump from star to star. Cause: four point clouds
 * (the stars of every galaxy, the Milky Way and M31 spirals, the cosmic dust, the catalogue cloud) used a
 * PointsMaterial WITHOUT a map — WebGL then draws each point as a square, and with size attenuation the squares grow
 * as the camera approaches. Checked here:
 *   1. each of the four builders gives its PointsMaterial a round sprite (starSprite or glowTexture), and no
 *      size-attenuated PointsMaterial in those builders is left without one
 *   2. the star sprite is round: its alpha falls off with radius (computed from the same formula, run here)
 *   3. star hopping is wired: a double-click with no registered object under it raycasts the star clouds in their
 *      own LOCAL units, reads the star's true world position from its geometry and flies the camera there with
 *      focusOn, stopping a few star spacings away; both star clouds declare their spacing
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const body = name => { const i = SRC.indexOf('function ' + name + '('); if (i < 0) return ''; let d = 0, j = SRC.indexOf('{', i); for (let k = j; k < SRC.length; k++) { if (SRC[k] === '{') d++; else if (SRC[k] === '}') { d--; if (d === 0) return SRC.slice(i, k + 1); } } return ''; };
/* 1 */
{ const B = ['galaxyStars', 'galaxySpiral', 'cosmicDust', 'catIngest'].map(n => [n, body(n)]);
  const bad = B.filter(([, b]) => [...b.matchAll(/new THREE\.PointsMaterial\(\{([^}]*)\}/g)].some(m => !/map:/.test(m[1])));
  ok('the stars of every galaxy, the Milky Way and M31 spirals, the cosmic dust and the catalogue cloud are drawn with a round sprite — no map-less PointsMaterial is left in those builders',
    B.every(([, b]) => b.length > 0 && /map:(starSprite|glowTexture)\(\)/.test(b)) && bad.length === 0, bad.length ? 'still square: ' + bad.map(x => x[0]).join(', ') : B.map(([n]) => n).join(', ')); }
/* 2 */
{ const S = 64, a = (u, v) => { const r = Math.hypot(u, v), core = Math.exp(-r * r * 11), spike = (Math.exp(-Math.abs(u) * 26) * Math.exp(-Math.abs(v) * 2.4) + Math.exp(-Math.abs(v) * 26) * Math.exp(-Math.abs(u) * 2.4)) * Math.exp(-r * 1.7); return Math.max(0, Math.min(1, core + 0.42 * spike)); };
  const centre = a(0, 0), corner = a(1, 1), diag = a(0.7, 0.7), edge = a(1, 0);
  ok('the star sprite is round: opaque at the centre, the square\'s corner transparent (a disc with faint diffraction spikes, not a square)',
    /const core=Math\.exp\(-r\*r\*11\);/.test(SRC) && centre > 0.99 && corner < 0.01 && diag < 0.02 && edge < 0.2, `centre ${centre.toFixed(3)} · corner ${corner.toExponential(1)} · diagonal 0.7 ${diag.toExponential(1)} · edge midpoint ${edge.toFixed(3)}`); }
/* 3 */
ok('star hopping is wired: a double-click on no registered object raycasts the star clouds in their local units, takes the star\'s true world position from its geometry and flies there with focusOn, a few spacings away',
  /if\(registeredKey\)\{dblFocus\(registeredKey\);return;\}\n\s*if\(hccStarHop\(ndc\)\) return;/.test(SRC) && /P\.threshold=0\.6\*sp\*own;/.test(SRC) && /fromBufferAttribute\(o\.geometry\.attributes\.position,best\.h\.index\)\.applyMatrix4\(o\.matrixWorld\)/.test(SRC)
  && /focusOn\(\{getPos:\(\)=>w\.clone\(\), focusDist:stop/.test(SRC) && /gs\.userData\.hop=\{spacing:/.test(SRC) && /P\.userData\.hop=\{spacing:R\/Math\.cbrt/.test(SRC));
console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
