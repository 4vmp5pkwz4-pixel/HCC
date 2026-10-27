#!/usr/bin/env node
'use strict';
/* ══ A SELF-TEST LEAVES THE ATLAS AS IT FOUND IT — THE CENTRE LAB'S WHITE-OUT (v4.404) ══════════════════════════════
 * Found by walking every laboratory sideways: the Centre lab (S³ · Sketches) opened as a milky white-out — and on a desk
 * too, on every boot. Its screen χ_A stood at 3.09 rad, which no reader had set. The boot self-test that sweeps every
 * shared parameter of the multiview end to end had put it there: it saved and restored state[m.k] for every member of
 * every link, and a member that drives its laboratory through a SETTER keeps its value somewhere else — the Centre lab
 * in CLAB.P.chiA. So the sweep left the screen at its top, 3.09 rad, a twentieth of a radian short of the antipode,
 * whose stereographic image is a sphere of radius 275 round the whole scene, the camera (at 18) inside it. The same sweep left the Hopf
 * laboratory's fibre A and the forecast horizon and noise of four invariance observatories at the end of their sweeps,
 * and wrote three junk keys into the state («labChiA», «hopfA.t», «pfHorizon»).
 * Now every member with a setter has a getter in the same units; the sweep saves and restores through them, puts every
 * plain value of the state back, and the self-test FAILS if any member is left moved, any setter has no getter, or any
 * key was written into the state. And with the white-out gone the default still looked through a haze: cap B, round the
 * projection's own pole, projects to a sphere round the whole scene; a screen larger than the carrier's equator sphere
 * is drawn as faint as it is large.
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

/* the links, as written */
const i0 = SRC.indexOf('const MV_LINKS=['), i1 = SRC.indexOf('function mvLink(id){', i0), LINKS = i0 > 0 && i1 > i0 ? SRC.slice(i0, i1) : '';
const setters = (LINKS.match(/\bset:(?:v|u)=>/g) || []).length, getters = (LINKS.match(/\bget:\(\)=>/g) || []).length;
ok('EVERY MEMBER THAT DRIVES ITS LABORATORY THROUGH A SETTER CAN BE READ BACK: a getter beside every setter, in the same units the setter takes',
  setters > 0 && setters === getters
  && /get:\(\)=>typeof CLAB!=='undefined'&&CLAB\.P\?CLAB\.P\.chiA:undefined,set:v=>\{ if\(typeof CLAB!=='undefined'&&CLAB\.P\)\{ CLAB\.P\.chiA=v;/.test(LINKS)
  && /get:\(\)=>Math\.log10\(state\.bhtM\),set:v=>\{ state\.bhtM=Math\.pow\(10,v\);/.test(LINKS)
  && /get:\(\)=>Math\.log10\(state\.nsRhoc\),set:v=>\{ state\.nsRhoc=Math\.pow\(10,v\); \}/.test(LINKS)
  && /get:\(\)=>state\.hopfA\?state\.hopfA\.t:undefined,set:v=>\{ if\(state\.hopfA\)\{ state\.hopfA\.t=v;/.test(LINKS),
  `${setters} setters written (two of them for four observatories each), ${getters} getters`);

/* the sweep */
const j = SRC.indexOf('AND THE SWEEP LEAVES EVERY LABORATORY AS IT FOUND IT'), T = j > 0 ? SRC.slice(j, j + 4200) : '';
ok('THE SWEEP RESTORES THROUGH THEM AND CHECKS THAT IT DID: saved through the getter, restored through the setter, every plain value of the state put back — and the self-test fails on a member left moved, a setter without a getter, or a key written into the state (the old restore wrote state[m.k], which for a setter is a key nothing reads)',
  /for\(const L of MV_LINKS\) for\(const m of L\.members\) saved\.set\(m, m\.set\?\(m\.get\?m\.get\(\):undefined\):state\[m\.k\]\);/.test(T)
  && /for\(const \[m,v\] of saved\)\{ if\(m\.set\)\{ if\(v!==undefined&&Number\.isFinite\(v\)\) try\{ m\.set\(v\); \}catch\(e\)\{\} \} else if\(m\.k in flat\) state\[m\.k\]=v; \}/.test(T)
  && /for\(const k in flat\) if\(state\[k\]!==flat\[k\]\) state\[k\]=flat\[k\];/.test(T)
  && /!bad&&noGet\.length===0&&moved\.length===0&&junk\.length===0/.test(T)
  && !/for\(const k in saved\) state\[k\]=saved\[k\];/.test(SRC),
  j > 0 ? 'sweep → restore → verify, in the boot suite' : 'MISSING');

/* and the arithmetic of the white-out, with the projection's own scale read from the page: stereographic from (−1,0,0,0),
   scaled by 0.8·RU, so the χ-screen about A is a sphere of radius 0.8·RU·tan(χ/2) and the one about its antipode B of
   radius 0.8·RU·cot(χ/2) */
{ const RU = 886.59 / 100, k = +((SRC.match(/return new THREE\.Vector3\(p\[1\]\/d, p\[3\]\/d, -p\[2\]\/d\)\.multiplyScalar\(RU\*([\d.]+)\); \}/) || [])[1]);
  const P = SRC.match(/const P = \{ A:\[1,0,0,0\], B:\[-1,0,0,0\], chiA:([\d.]+), chiB:([\d.]+),/) || [], chiA = +P[1], chiB = +P[2];
  const rA = c => k * RU * Math.tan(c / 2), rB = c => k * RU / Math.tan(c / 2), cam = Math.hypot(-0.08, 6, 17);
  ok('THE ARITHMETIC OF THE WHITE-OUT: projected from the antipode at 0.8·RU, the χ-screen about A is a sphere of radius 0.8·RU·tan(χ/2) — at the sweep\'s top, 3.09 rad, ' + (rA(3.09) / cam).toFixed(1) + ' times the distance of the camera, the camera inside a translucent sphere; at the laboratory\'s own default, ' + chiA + ' rad, a small sphere in front of it',
    k === 0.8 && chiA === 0.55 && rA(3.09) > cam * 10 && rA(chiA) < cam / 5,
    `screen radius at 3.09 rad ${rA(3.09).toFixed(0)} units · at ${chiA} rad ${rA(chiA).toFixed(2)} · camera ${cam.toFixed(1)} units from the centre`);

  /* and a screen that projects round everything is a horizon, not a wall */
  const op = r => 0.3 * Math.min(1, Math.pow(k * RU / r, 2)), rb = rB(chiB);
  ok('AND A SCREEN THAT PROJECTS ROUND EVERYTHING IS A HORIZON, NOT A WALL: cap B, round the projection\'s own pole, is a sphere of radius ' + rb.toFixed(1) + ' round the whole scene with the camera just outside it, and at the caps\' 0.3 it laid two pale layers over everything; a screen larger than the carrier\'s equator sphere (0.8·RU) is drawn as faint as it is large',
    /mesh\.material\.opacity=0\.3\*Math\.min\(1,Math\.pow\(RU\*0\.8\/r,2\)\);/.test(SRC) && rb > k * RU && rb < cam && op(rb) < 0.08 && op(rA(chiA)) === 0.3,
    `cap B radius ${rb.toFixed(2)} (camera at ${cam.toFixed(1)}) → opacity ${op(rb).toFixed(3)} instead of 0.3 · cap A radius ${rA(chiA).toFixed(2)} keeps 0.3`); }

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
