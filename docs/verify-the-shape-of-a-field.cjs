#!/usr/bin/env node
'use strict';
/* ══ THE SHAPE OF A FIELD ══════════════════════════════════════════════════════════
 * The Field Lab drew its lattice as a cloud of coloured dots; its default view is now the
 * field's own geometry — level sets by marching tetrahedra, lines of −∇u, a slice with
 * isolines, and the exact domain walls of the Ising lattice. This file runs the kernels
 * themselves (extracted into core/atlas/extracted.mjs) against geometry known in closed
 * form, with nothing of the atlas in the reference:
 *   1. a sphere: the level set's area is 4πR² to 1e-3, and its enclosed volume, from the
 *      divergence theorem V = ⅓∮x·n dA, converges to 4πR³/3 at second order in the spacing
 *   2. the surface is watertight and closed: every edge is shared by exactly two triangles,
 *      and its Euler characteristic V − E + F is 2 — a sphere, measured, not assumed; two
 *      separate blobs give 4
 *   3. every normal is a unit vector and points out of the region u > c, including on a
 *      plateau where the gradient vanishes (a zero normal is NaN in a shader, and one NaN
 *      pixel, blurred by bloom, blacked out the whole frame — which is how this was found)
 *   4. a line of the field of a point dipole, traced by RK4 through the lattice gradient,
 *      keeps r / sin²θ constant — the dipole field-line law — to 2 %
 *   5. the Ising walls: with periodic faces there are 3N³ bonds, so E/N³ = −3 + 2W/N³
 *      EXACTLY for every configuration — the wall area is the energy
 *   6. the wiring: the cloud is the default view and the structure one press away, the excitable medium is drawn above
 *      its boundary value, the arrows obey their own checkbox, and HCC_FIELD opens it
 *   7. MUTATIONS: midpoint instead of linear interpolation on each edge, and walls counted
 *      without the periodic wrap, are each caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { fsIso, fsGrad, fsFieldLine, fsIsingWalls } = K;
  const grid = (N, f) => { const h = (N - 1) / 2, q = new Float64Array(N ** 3); for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) q[(z * N + y) * N + x] = f(x - h, y - h, z - h); return q; };

  /* 1 · a sphere */
  const errs = [17, 25, 41].map(N => { const s2 = (N / 6) ** 2, R = N / 4, q = grid(N, (x, y, z) => Math.exp(-(x * x + y * y + z * z) / (2 * s2))), S = fsIso(q, N, Math.exp(-R * R / (2 * s2)), null, 1);
    return { N, a: S.area / (4 * Math.PI * R * R) - 1, v: S.volume / (4 / 3 * Math.PI * R ** 3) - 1 }; });
  ok('a sphere: area 4πR² to 1e-3 at every resolution; the enclosed volume by the divergence theorem converges at second order (the error falls by more than four from 17³ to 41³)',
    errs.every(e => Math.abs(e.a) < 1e-3) && Math.abs(errs[2].v) < 3e-3 && Math.abs(errs[0].v / errs[2].v) > 4, errs.map(e => `${e.N}³: area ${e.a.toExponential(1)}, volume ${e.v.toExponential(1)}`).join(' · '));

  /* 2 · watertight, closed, and its topology measured */
  const topo = S => { const key = i => [0, 1, 2].map(k => Math.round(S.pos[3 * i + k] * 1e6)).join(','), V = new Set(), E = new Map();
    for (let t = 0; t < S.vertices / 3; t++) { const a = key(3 * t), b = key(3 * t + 1), c = key(3 * t + 2); V.add(a); V.add(b); V.add(c);
      for (const [u, v] of [[a, b], [b, c], [c, a]]) { const k = u < v ? u + '|' + v : v + '|' + u; E.set(k, (E.get(k) || 0) + 1); } }
    return { twice: [...E.values()].every(m => m === 2), chi: V.size - E.size + S.vertices / 3 }; };
  const N = 21, one = fsIso(grid(N, (x, y, z) => Math.exp(-(x * x + (1.3 * y) ** 2 + z * z) / 18) + 0.3 * Math.exp(-((x - 4) ** 2 + y * y + z * z) / 4)), N, 0.35, null, 1);
  const two = fsIso(grid(N, (x, y, z) => Math.exp(-((x - 5) ** 2 + y * y + z * z) / 6) + Math.exp(-((x + 5) ** 2 + y * y + z * z) / 6)), N, 0.4, null, 1);
  const t1 = topo(one), t2 = topo(two);
  ok('watertight and closed: every edge is shared by exactly two triangles, and V − E + F = 2 for one blob, 4 for two — the topology is measured', t1.twice && t2.twice && t1.chi === 2 && t2.chi === 4, `χ = ${t1.chi} and ${t2.chi}`);

  /* 3 · normals: unit, outward, and defined on a plateau */
  const Sp = fsIso(grid(25, (x, y, z) => Math.exp(-(x * x + y * y + z * z) / 20)), 25, 0.3, null, 1);
  let unit = true, out = true; for (let i = 0; i < Sp.vertices; i++) { const n = [Sp.nrm[3 * i], Sp.nrm[3 * i + 1], Sp.nrm[3 * i + 2]], p = [Sp.pos[3 * i], Sp.pos[3 * i + 1], Sp.pos[3 * i + 2]];
    if (Math.abs(Math.hypot(...n) - 1) > 1e-6) unit = false; if (n[0] * p[0] + n[1] * p[1] + n[2] * p[2] <= 0) out = false; }
  const plat = fsIso(grid(17, (x, y, z) => Math.max(x, y, z) < 3 && Math.min(x, y, z) > -3 ? 1 : 0), 17, 0.5, null, 1);
  let platOk = plat.vertices > 0; for (let i = 0; i < plat.vertices; i++) if (!(Math.abs(Math.hypot(plat.nrm[3 * i], plat.nrm[3 * i + 1], plat.nrm[3 * i + 2]) - 1) < 1e-6)) platOk = false;
  ok('every normal is a unit vector pointing out of the region u > c — and on a plateau, where the gradient is zero, the triangle lends its own normal instead of a NaN', unit && out && platOk && /a zero normal is NaN in a shader/.test(SRC), `${Sp.vertices} + ${plat.vertices} vertices`);

  /* 4 · a dipole field line */
  { const M = 49, h = 24, q = grid(M, (x, y, z) => { const r = Math.hypot(x, y, z); return r < 2 ? 0 : z / r ** 3; }), G = fsGrad(q, M), th0 = 0.5, r0 = 4;
    const pts = fsFieldLine(G, M, [h + r0 * Math.sin(th0), h, h + r0 * Math.cos(th0)], -1, { h: 0.2, maxSteps: 600, lo: 1 });
    const C = pts.map(p => { const X = p[0] - h, Y = p[1] - h, Z = p[2] - h, r = Math.hypot(X, Y, Z); return { r, c: r / ((X * X + Y * Y) / (r * r)) }; }).filter(o => o.r > 5 && o.r < 18);
    const m = C.reduce((a, o) => a + o.c, 0) / C.length, dev = Math.max(...C.map(o => Math.abs(o.c / m - 1)));
    ok('a line of a point dipole, traced by RK4 through the lattice gradient, keeps r/sin²θ constant — the dipole field-line law — to 2 %', C.length > 20 && dev < 0.02, `${C.length} points between r = 5 and 18 · r/sin²θ = ${m.toFixed(3)} ± ${(100 * dev).toFixed(2)} %`); }

  /* 5 · Ising walls */
  let seed = 9; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const energy = (s, n) => { let E = 0; for (let z = 0; z < n; z++) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const i = (z * n + y) * n + x; E -= s[i] * (s[(z * n + y) * n + (x + 1) % n] + s[(z * n + (y + 1) % n) * n + x] + s[(((z + 1) % n) * n + y) * n + x]); } return E; };
  const cases = [[8, 0.5], [13, 0.9], [17, 0.02], [11, 0.3]].map(([n, p]) => { const s = new Float32Array(n ** 3).map(() => rnd() < p ? -1 : 1); const W = fsIsingWalls(s, n).W; return { n, lhs: energy(s, n) / n ** 3, rhs: -3 + 2 * W / n ** 3 }; });
  ok('the Ising walls, one dual plaquette per antiparallel bond: E/N³ = −3 + 2W/N³ exactly, for random, ordered and nearly-ordered lattices of four sizes', cases.every(c => Math.abs(c.lhs - c.rhs) < 1e-12), cases.map(c => `${c.n}³: ${c.lhs.toFixed(5)}`).join(' · '));

  /* 6 · wiring */
  ok('the wiring: the cloud is the default view and the structure one press away, the excitable medium is drawn above its boundary value, the arrows obey their own checkbox beside the field lines, HCC_FIELD opens it, and the Ising readout states the identity',
    /fieldDraw:'cloud',fieldSlice:true/.test(SRC) && /if\(model==='fhn'\) return \{A:2,levels:\[1\.3,0\.4\]/.test(SRC) && /vectors\.visible=!!state\.fieldVectors/.test(SRC)
    && /globalThis\.HCC_FIELD=Object\.freeze\(/.test(SRC) && /the wall area IS the energy/.test(SRC) && /const S=fsIso\(q,N,lev,G,sp,phase\)/.test(SRC));

  /* 7 · mutations */
  { const src = fsIso.toString(), cut = 't=va===vb?0.5:(iso-va)/(vb-va)'; const mut = new Function('fsGrad', 'FS_TETS', 'return ' + src.replace(cut, 't=0.5'))(K.fsGrad, K.FS_TETS || [[0, 1, 3, 7], [0, 3, 2, 7], [0, 2, 6, 7], [0, 6, 4, 7], [0, 4, 5, 7], [0, 5, 1, 7]]);
    const Nn = 25, s2 = (Nn / 6) ** 2, R = Nn / 4, q = grid(Nn, (x, y, z) => Math.exp(-(x * x + y * y + z * z) / (2 * s2))), S = mut(q, Nn, Math.exp(-R * R / (2 * s2)), null, 1), e = S.area / (4 * Math.PI * R * R) - 1;
    ok('MUTATION — the midpoint of each edge instead of the linear crossing puts the sphere\'s area off by more than 1 %, caught', src.includes(cut) && Math.abs(e) > 0.01, `area error ${(100 * e).toFixed(1)} %`); }
  { const n = 9, s = new Float32Array(n ** 3).map(() => rnd() < 0.5 ? -1 : 1); let W = 0;
    for (let z = 0; z < n; z++) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const i = (z * n + y) * n + x; if (x < n - 1 && s[i + 1] !== s[i]) W++; if (y < n - 1 && s[i + n] !== s[i]) W++; if (z < n - 1 && s[i + n * n] !== s[i]) W++; }
    ok('MUTATION — walls counted without the periodic wrap break the identity, caught', Math.abs(energy(s, n) / n ** 3 - (-3 + 2 * W / n ** 3)) > 1e-3); }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
