#!/usr/bin/env node
'use strict';
/* ══ THE LAST FLAT SCENES OF THE DESCENT BECOME BODIES (v4.399) ══════════════════════════════════════════════════════
 * Asked: why are the scenes of the descent into matter not truly three-dimensional? The gas of a photosphere and of a
 * giant, a cloud's droplets and a cloud deck's crystals were point sprites, and a painted "grain" of every scale streamed
 * over them in screen space — in a bright medium as ink, which read as dirt. Checked here:
 *   1. those scenes draw bodies now — instanced lit meshes, a sphere, two spheres for H₂, a cube for an ice crystal — and
 *      the only point clouds left in the descent are the ones that are not bodies by nature: the electron's |ψ|² of the
 *      atom and of H₂, the sea of virtual quarks and gluons in the proton and the virtual pairs about a quark, and the
 *      stars of the sky, which are points
 *   2. the size rule: a body is drawn at its true projected radius r·f/d wherever that is at least uMin px, never smaller,
 *      and one that would be smaller is dimmed as (true / uMin)² — continuous, and the true size wherever it can be seen
 *   3. the gas is what the atlas holds: H₂ nuclei 74.14 pm apart, van der Waals radii H 120 pm and He 140 pm (Bondi 1964),
 *      the helium share from the composition strip (the Sun 8.2 atoms per 100 of hydrogen; the giants' He mole fractions
 *      0.136, 0.110, 0.153, 0.194), helium at √(m/m_He) of the speed, and hydrogen at 5772 K ≈ 12 km/s as the label says
 *   4. the turning: the shader's quaternion product and rotation are Hamilton's, checked against rotation matrices
 *   5. the painted grain yields where a level draws the grain itself (the gas, droplets, crystals, water, lattice,
 *      regolith); clear water and ice and a photosphere's light are added without depth, and the lit molecules write depth
 *      after the see-through layers, so no faint body cuts a hole in what is drawn after it
 *   6. one ice crystal beside the giant's way down: 4 μm across the face, a cube — NH₃ and CH₄ ices are cubic — and the
 *      words say its habit in the clouds has not been seen
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const fn = name => { const i = SRC.indexOf('function ' + name + '('); if (i < 0) throw new Error('no function ' + name); let d = 0, j = SRC.indexOf('{', i);
  for (let k = j; k < SRC.length; k++) { const c = SRC[k]; if (c === '{') d++; else if (c === '}') { d--; if (!d) return SRC.slice(i, k + 1); } } throw new Error('unbalanced ' + name); };
/* the source of a level({id:'…'}) call, balanced */
const lev = id => { const i = SRC.indexOf(`level({id:'${id}'`); if (i < 0) throw new Error('no level ' + id); let d = 0; for (let k = i + 5; k < SRC.length; k++) { const c = SRC[k]; if (c === '(' || c === '{' || c === '[') d++; else if (c === ')' || c === '}' || c === ']') { d--; if (!d) return SRC.slice(i, k + 1); } } throw new Error('unbalanced level ' + id); };
try {
  /* 1 */
  { const a = SRC.indexOf('/* point clouds in local units'), b = SRC.indexOf('globalThis.HCC_DESCENT=Object.freeze(');
    const region = SRC.slice(a, b), owners = [];
    let i = 0; while ((i = region.indexOf('new THREE.Points(', i)) >= 0) { const before = region.slice(0, i); const f = before.lastIndexOf('\nfunction '), l = before.lastIndexOf("level({id:'");
      const name = l > f ? region.slice(l + 11, region.indexOf("'", l + 11)) : region.slice(f + 10, region.indexOf('(', f + 10)); owners.push(name); i += 17; }
    const allowed = ['dscElemAtomFill', 'dscH2Level', 'dscBuildShared', 'dscBuildRegimes', 'dscSkyAdopt'], left = [...new Set(owners)].sort();
    const solid = /dscSolids\(dscBallGeo\(\),\{P:F\(P\),O:F\(O\)/.test(fn('dscGasLevel')) && /dscSolids\(dscBallGeo\(\),\{P,R:/.test(lev('dropfield')) && /dscSolids\(box,\{P,X,Q,R,W,C\}/.test(lev('crystals'))
      && /new THREE\.InstancedBufferGeometry\(\)/.test(fn('dscSolids')) && !/THREE\.Points/.test(fn('dscGasLevel') + lev('dropfield') + lev('crystals') + lev('xtal'));
    ok('the gas, the droplets and the crystals are bodies now — instanced lit meshes — and the only point clouds left in the descent are not bodies by nature: |ψ|² of the atom and of H₂, the virtual quarks and gluons, and the stars',
      solid && JSON.stringify(left) === JSON.stringify(allowed.slice().sort()), `bodies ${solid ? '✓' : '✗'} · point clouds left in: ${left.join(', ')}`); }
  /* 2 */
  { const V = SRC.slice(SRC.indexOf('const DSC_SOLID_V='), SRC.indexOf('const DSC_SOLID_F='));
    const rule = /rpx=aR\*sc\*uPx\/max\(-mc\.z,1e-30\), k=clamp\(uMin\/max\(rpx,1e-30\),1\.0,uMaxK\)/.test(V) && /vA=uFade\*uGain\*min\(1\.0,rpx\*rpx\/\(uMin\*uMin\)\)/.test(V) && /\(qr\(q,aOff\)\+qr\(q,position\)\*aR\)\*k/.test(V);
    const drawn = (r, f, d, m) => { const t = r * f / d; return { R: t * Math.min(Math.max(m / t, 1), 1e9), A: Math.min(1, t * t / (m * m)) }; };
    let cont = 0, trueBeyond = 0, cases = 0; for (const m of [0.55, 0.65, 0.8]) { let prev = null; for (let i = 0; i <= 4000; i++) { const d = Math.pow(10, -1 + 5 * i / 4000), D = drawn(0.01, 800, d, m); cases++;
        const t = 0.01 * 800 / d; if (t >= m && Math.abs(D.R - t) > 1e-9 * t) trueBeyond++; if (prev && (D.R > prev.R * (1 + 1e-9) || D.A > prev.A * (1 + 1e-9))) cont++; prev = D; } }
    ok('the size rule: the true projected radius r·f/d wherever it is at least uMin px, never smaller, and a body that would be smaller dimmed as (true/uMin)² — the true size wherever it can be seen, and nothing grows as it recedes',
      rule && !cont && !trueBeyond, `the shader ${rule ? '✓' : '✗'} · ${cases} distances over five decades, for uMin 0.55, 0.65, 0.8 px · true where seen ${trueBeyond ? trueBeyond + ' off' : '✓'} · monotonic ${cont ? cont + ' off' : '✓'}`); }
  /* 3 */
  { const comp = SRC.slice(SRC.indexOf('const DSC_COMPOSITION=Object.freeze('), SRC.indexOf('\n', SRC.indexOf('const DSC_COMPOSITION=Object.freeze(')));
    const He = new Function(comp + '\n' + fn('dscHeShare') + '\nreturn dscHeShare;')();
    const sun = He('sun', false), sunPer100 = 100 * sun / (1 - sun), giants = ['jupiter', 'saturn', 'uranus', 'neptune'].map(k => He(k, true));
    const vdw = /const DSC_VDW=Object\.freeze\(\{H:0\.120,He:0\.140\}\);/.test(SRC), pair = /pair:0\.07414, he:heG/.test(SRC), heV = /const heV=def\.pair\?Math\.SQRT1_2:0\.5;/.test(fn('dscGasLevel'));
    const k = 1.380649e-23, mH = 1.6735575e-27, vH = Math.sqrt(3 * k * 5772 / mH) / 1e3, said = SRC.includes('5772 K: hydrogen ≈ 12 km/s, helium half as fast (slowed)') && SRC.includes('helium 1/√2 as fast (slowed)');
    const want = [0.136, 0.110, 0.153, 0.194], giantsOk = giants.every((x, i) => Math.abs(x - want[i]) < 0.0015);
    ok('the gas is what the atlas holds: H₂ nuclei 74.14 pm apart, van der Waals radii H 120 and He 140 pm, the helium share from the composition strip, helium at √(m/m_He) of the speed, and hydrogen at 5772 K at 12 km/s',
      vdw && pair && heV && Math.abs(sunPer100 - 8.2) < 0.05 && giantsOk && Math.abs(vH - 11.96) < 0.05 && said,
      `radii ${vdw ? '✓' : '✗'} · H₂ ${pair ? '✓' : '✗'} · the Sun ${sunPer100.toFixed(2)} He per 100 H · the giants ${giants.map(x => x.toFixed(3)).join(', ')} (He mole fractions) · speeds √(1/4) and √(2/4) ${heV ? '✓' : '✗'} · v_rms(H, 5772 K) = ${vH.toFixed(2)} km/s · said ${said ? '✓' : '✗'}`); }
  /* 4 */
  { const V = SRC.slice(SRC.indexOf('const DSC_SOLID_V='), SRC.indexOf('const DSC_SOLID_F='));
    const qmOk = V.includes('vec4 qm(vec4 a,vec4 b){ return vec4(a.w*b.xyz+b.w*a.xyz+cross(a.xyz,b.xyz),a.w*b.w-dot(a.xyz,b.xyz)); }'), qrOk = V.includes('vec3 qr(vec4 q,vec3 v){ return v+2.0*cross(q.xyz,cross(q.xyz,v)+q.w*v); }');
    const cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dt = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const qm = (a, b) => { const x = cr(a, b); return [a[3] * b[0] + b[3] * a[0] + x[0], a[3] * b[1] + b[3] * a[1] + x[1], a[3] * b[2] + b[3] * a[2] + x[2], a[3] * b[3] - dt(a, b)]; };
    const qr = (q, v) => { const t = cr(q, v).map((x, i) => x + q[3] * v[i]), u = cr(q, t); return v.map((x, i) => x + 2 * u[i]); };
    const mat = q => { const [x, y, z, w] = q; return [[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]]; };
    let s = 11, worst = 0; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const rq = () => { const u1 = rnd(), u2 = rnd() * 2 * Math.PI, u3 = rnd() * 2 * Math.PI, a = Math.sqrt(1 - u1), b = Math.sqrt(u1); return [a * Math.sin(u2), a * Math.cos(u2), b * Math.sin(u3), b * Math.cos(u3)]; };
    for (let i = 0; i < 300; i++) { const p = rq(), q = rq(), v = [rnd() - 0.5, rnd() - 0.5, rnd() - 0.5], M = mat(qm(p, q)), Mp = mat(p), Mq = mat(q);
      const a = qr(qm(p, q), v), b = M.map(r => dt(r, v)), c = Mp.map(r => dt(r, Mq.map(rr => dt(rr, v)))); worst = Math.max(worst, ...a.map((x, j) => Math.abs(x - b[j])), ...b.map((x, j) => Math.abs(x - c[j]))); }
    ok('the turning: the shader’s quaternion product and rotation are Hamilton’s — rotating by p·q is rotating by q, then by p — on 300 random pairs',
      qmOk && qrOk && worst < 1e-12, `qm ${qmOk ? '✓' : '✗'} · qr ${qrOk ? '✓' : '✗'} · worst ${worst.toExponential(1)}`); }
  /* 5 */
  { const T = fn('dscTunnelTick'), yields = /if\(Lv\.grain&&Lv\.obj&&Lv\.obj\.visible\) real=Math\.max\(real,dscBand\(N,Lv\.band\[0\],Lv\.band\[1\],Lv\.band\[2\]\)\);/.test(T) && /u\.uFade\.value=0\.7\*fade\*\(1-real\);/.test(T);
    const grain = ['dropfield', 'crystals', 'water'].every(id => /grain:true/.test(lev(id).slice(0, 200))) && ['dscGasLevel', 'dscRegolithLevel', 'dscLatticeLevel'].every(f => /grain:true/.test(fn(f).slice(0, 220)));
    const M = fn('dscSolidsMat'), S = fn('dscSolids'), blend = /const glow=o\.mode>0\.5;/.test(M) && /depthWrite:!glow,blending:glow\?THREE\.AdditiveBlending:THREE\.NormalBlending/.test(M) && /m\.renderOrder=o\.mode>0\.5\?0:20;/.test(S);
    ok('the painted grain yields where a level draws the grain itself; clear water and ice and a photosphere’s light are added without depth, and the lit molecules write depth after the see-through layers, so no faint body cuts a hole in another',
      yields && grain && blend, `the motes yield ${yields ? '✓' : '✗'} · six kinds of grain flagged ${grain ? '✓' : '✗'} · blending and order ${blend ? '✓' : '✗'}`); }
  /* 6 */
  { const X = lev('xtal'), edge = (+(X.match(/R=([0-9.]+), box=new THREE\.BoxGeometry\(1\.5,1\.5,1\.5\)/) || [])[1]) * 1.5;
    const words = X.includes('4 μm across the face') && X.includes('its habit in the clouds has not been seen') && X.includes('его форма в облаках не наблюдалась') && lev('crystals').includes('drawn as cubes, the system both ices crystallise in; their shapes in the clouds have not been seen');
    ok('one ice crystal beside the giant’s way down, 4 μm across the face, a cube — NH₃ and CH₄ ices are cubic — and the words say its habit in the clouds has not been seen',
      Math.abs(edge - 4) < 0.01 && words, `edge ${edge.toFixed(3)} μm · words ${words ? '✓' : '✗'}`); }
} catch (e) { fail++; console.log('  FAIL — verifier error: ' + (e && e.stack || e)); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
