#!/usr/bin/env node
'use strict';
/* ══ THE NEW LABORATORIES IN THE HEADSET (v4.358) ═════════════════════════════════════════════════════════════════
 * Checked on the code itself (index.html):
 *   1. the ray tap picks the nearest point inside a ~2.5° cone, never one behind the hand, never one off to the side
 *   2. strokes of light measure their width against the EYE's viewport in XR, and every cloud uses the same XR pixel scale
 *   3. the resonator's atoms and the Unified Atlas's stars and gates answer a controller's trigger, before any teleport
 *   4. the laboratory's numbers and instrument ride on a panel in front of the reader (the page's HUD is not drawn in XR)
 *   5. every new laboratory is in the XR laboratory picker (it lists every declared S³ view)
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
class V3 { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; } copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; } sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; } lengthSq() { return this.dot(this); } }
const grab = name => { const a = SRC.indexOf('function ' + name + '('); if (a < 0) return null; let i = SRC.indexOf('{', a), d = 0; for (let j = i; j < SRC.length; j++) { if (SRC[j] === '{') d++; else if (SRC[j] === '}') { d--; if (d === 0) return SRC.slice(a, j + 1); } } return null; };
{ const f = new Function('THREE', grab('hccRayNearest') + '\nreturn hccRayNearest;')({ Vector3: V3 }), o = new V3(0, 0, 0), d = new V3(0, 0, -1);
  const pts = [new V3(0.02, 0, -2), new V3(0.001, 0.001, -1), new V3(0, 0, 3), new V3(0.6, 0, -2)], a = f(o, d, pts), b = f(o, d, [new V3(0, 0, 3), new V3(0.6, 0, -2)]), c = f(o, d, [null, new V3(0.05, 0, -1.5)]);
  ok('the ray tap picks the nearest point inside a ~2.5° cone and never one behind the hand or off to the side', a === 1 && b === -1 && c === 1, `picked ${a} · none ${b} · with a gap ${c}`); }
ok('in XR a stroke’s width is measured against the eye’s viewport and every cloud of points uses the same XR pixel scale',
  /if\(renderer\.xr&&renderer\.xr\.isPresenting\)\{ try\{ const xc=renderer\.xr\.getCamera\(\); vp=xc&&xc\.cameras&&xc\.cameras\[0\]&&xc\.cameras\[0\]\.viewport; \}catch\(e\)\{\} \}/.test(SRC)
  && /if\(vp&&vp\.z>0\) U\.uView\.value\.set\(vp\.z,vp\.w\);/.test(SRC) && /function hccPx\(\)\{ return renderer\.xr&&renderer\.xr\.isPresenting\?1\.7:/.test(SRC)
  && (SRC.match(/uPx\.value=hccPx\(\)/g) || []).length >= 4);
ok('the resonator’s atoms and the Unified Atlas’s stars and gates answer a controller’s trigger, before any teleport',
  /HCC_RAY_TAPS\.push\(\{ id:'gmode',/.test(SRC) && /HCC_RAY_TAPS\.push\(\{ id:'unify',/.test(SRC) && /if\(hccRayTap\(o,d\)\)\{ pulse\(P,\.4,30\); return; \} \}[\s\S]{0,200}if\(xrMode==='ar' && reticle\?\.visible\)/.test(SRC) && /function gmodeToggleTarget\(best\)/.test(SRC));
ok('in the headset the laboratory’s numbers (its HUD) and its instrument ride on a panel in front of the reader, turned to the head',
  /function hccXrInstrTick\(on\)/.test(SRC) && /try\{ hccXrInstrTick\(on\); \}/.test(SRC) && /HCC_INSTR\.paint\(g,W-20,H-top-10,false\)/.test(SRC) && /P\.mesh\.lookAt\(head\)/.test(SRC) && /hudBig\.textContent\)\|\|''/.test(SRC));
{ const ids = ['gmode', 'unify', 'nul', 'hol', 'syd', 'act'], declared = ids.filter(id => new RegExp(`\\{id:'${id}', category:`).test(SRC) || new RegExp(`id="v-${id}"`).test(SRC));
  ok('every new and redrawn laboratory is in the XR laboratory picker, which lists every declared S³ view', /function xrLabIds\(\)\{\s*const all=Object\.keys\(S3_VIEW_NAMES\);/.test(SRC) && declared.length === ids.length, declared.join(', ')); }
console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
