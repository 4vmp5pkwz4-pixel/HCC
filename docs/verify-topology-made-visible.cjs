#!/usr/bin/env node
'use strict';
/* ══ TOPOLOGY, MADE VISIBLE ═════════════════════════════════════════════════════════════
 * The topology atlas drew two thin curves and a caption. A reader found it meaningless,
 * and it was: an invariant is only seen when something changes and it does not. The lab
 * now opens on two stations that show exactly that, and this file checks their kernels
 * (core/atlas/extracted.mjs) against references written HERE:
 *   1. GAUSS–BONNET, EXACT: on the surface whose holes open one by one, the sum of angle
 *      deficits is 2πχ to 1e-9 at every radius, the surface is closed (E = 3F/2), and χ
 *      is counted, not assumed
 *   2. the holes open one at a time: as the tube radius falls, χ steps 2 → 0 → −2 → −4
 *      and the genus 0 → 1 → 2 → 3
 *   3. the counting is honest on meshes built HERE by parametrisation, not by marching
 *      tetrahedra: a UV sphere has χ = 2 and a UV torus χ = 0, both with Σ deficit = 2πχ
 *   4. THE HOPF FIBRATION: of the 48 fibres drawn, every one of the 1 128 pairs has
 *      |Lk| = 1 to 5e-3, all of one sign — and the Gauss integral used for it gives 1 on a
 *      Hopf link and 0 on two separated circles built here
 *   5. the wiring: the stations, the default, the controls, the lights, the tilt
 *   6. MUTATION: welding vertices with a tolerance coarser than the mesh merges distinct
 *      points and the counted χ is wrong, caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { topoGenusField, topoMeshTopology, fsIso, topoFibration, topoAllPairs, topoLinkPure } = K;
  const surf = (r, N = 56) => { const f = topoGenusField(N, r), S = fsIso(f.q, N, 0, null, f.s); return topoMeshTopology(S.pos); };

  /* 1 · Gauss–Bonnet, exact */
  const rs = [1.2, 0.78, 0.6, 0.4, 0.3], M = rs.map(r => surf(r));
  ok('Gauss–Bonnet, exact: at every radius the angle deficits sum to 2πχ to 1e-9, and the surface is closed (every edge in two triangles: E = 3F/2)',
    M.every(m => Math.abs(m.gaussBonnet - m.chi) < 1e-9 && 2 * m.E === 3 * m.F), M.map((m, i) => `r ${rs[i]}: χ ${m.chi}, Σ/2π ${m.gaussBonnet.toFixed(10)}`).join(' · '));

  /* 2 · the holes open one at a time */
  ok('the holes open one at a time: as the tube radius falls, χ steps 2 → 0 → −2 → −4 and the genus 0 → 1 → 2 → 3, in one piece',
    M.slice(0, 4).map(m => m.chi).join() === '2,0,-2,-4' && M.slice(0, 4).map(m => m.genus).join() === '0,1,2,3' && M.slice(0, 4).every(m => m.components === 1), M.map(m => `χ ${m.chi} g ${m.genus}`).join(' → '));

  /* 3 · meshes built here */
  { const uv = (fn, nu, nv, wrapV) => { const P = []; const p = (i, j) => fn((i % nu) / nu, wrapV ? (j % nv) / nv : j / nv);
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = p(i, j), b = p(i + 1, j), c = p(i + 1, j + 1), d = p(i, j + 1);
        if (!wrapV && j === 0) P.push(...a, ...c, ...d); else if (!wrapV && j === nv - 1) P.push(...a, ...b, ...c); else P.push(...a, ...b, ...c, ...a, ...c, ...d); }
      return Float32Array.from(P); };
    const sphere = uv((u, v) => { const th = Math.PI * v, ph = 2 * Math.PI * u; return v === 0 ? [0, 1, 0] : v === 1 ? [0, -1, 0] : [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)]; }, 40, 24, false);
    const torus = uv((u, v) => { const a = 2 * Math.PI * u, b = 2 * Math.PI * v, R = 1.6, r = 0.55; return [(R + r * Math.cos(b)) * Math.cos(a), r * Math.sin(b), (R + r * Math.cos(b)) * Math.sin(a)]; }, 48, 24, true);
    const S = topoMeshTopology(sphere), T = topoMeshTopology(torus);
    ok('the counting is honest on meshes built here by parametrisation: a UV sphere has χ = 2 and a UV torus χ = 0, each with Σ deficit = 2πχ to 1e-9',
      S.chi === 2 && T.chi === 0 && Math.abs(S.gaussBonnet - 2) < 1e-9 && Math.abs(T.gaussBonnet) < 1e-9, `sphere V ${S.V} E ${S.E} F ${S.F} → ${S.chi} · torus V ${T.V} E ${T.E} F ${T.F} → ${T.chi}`); }

  /* 4 · the Hopf fibration */
  { const F = topoFibration([0.5, 0.98, 1.46, 1.94], 12, 120), P = topoAllPairs(F);
    const circ = (c, e1, e2, r, n = 200) => Array.from({ length: n }, (_, k) => { const t = 2 * Math.PI * k / n; return [0, 1, 2].map(i => c[i] + r * (Math.cos(t) * e1[i] + Math.sin(t) * e2[i])); });
    const hopf = topoLinkPure(circ([0, 0, 0], [1, 0, 0], [0, 1, 0], 1), circ([1, 0, 0], [1, 0, 0], [0, 0, 1], 1)), apart = topoLinkPure(circ([0, 0, 0], [1, 0, 0], [0, 1, 0], 1), circ([4, 0, 0], [1, 0, 0], [0, 0, 1], 1));
    ok('the Hopf fibration: every one of the 1 128 pairs of the 48 fibres drawn has |Lk| = 1 to 5e-3, all of one sign — and the same Gauss integral gives ±1 on a Hopf link and 0 on two separated circles built here',
      F.length === 48 && P.pairs === 1128 && P.worst < 5e-3 && (P.max < 0 || P.min > 0) && Math.abs(Math.abs(hopf) - 1) < 5e-3 && Math.abs(apart) < 1e-3, `worst ${P.worst.toExponential(1)} · range ${P.min.toFixed(4)}…${P.max.toFixed(4)} · Hopf link ${hopf.toFixed(4)} · apart ${apart.toExponential(1)}`); }

  /* 5 · wiring */
  ok('the wiring: the fibration and Gauss–Bonnet stations open first, with their controls, lights and the tilt that shows the holes; the linking station draws lit tubes',
    /topoStation:'fibration', topoGenusR:1\.1, topoGenusAuto:true/.test(SRC) && /\['fibration','Hopf fibration · every pair linked'\],\['genus','Gauss–Bonnet · holes open'\]/.test(SRC) && /id="topoGenusR"/.test(SRC)
    && /tilt\.rotation\.x=-1\.32/.test(SRC) && /lights\(\); tube\(A,0xf5c964,0\.035\); tube\(B,0x8fb8ff,0\.035\);/.test(SRC) && /const P=topoAllPairs\(O\.F\); O\.pairs=P;/.test(SRC));

  /* 6 · mutation */
  { const src = topoMeshTopology.toString(), cut = 'Math.round(pos[3*i]*1e5)+\',\'+Math.round(pos[3*i+1]*1e5)+\',\'+Math.round(pos[3*i+2]*1e5)';
    const mut = new Function('return ' + src.replace(cut, 'Math.round(pos[3*i]*5)+\',\'+Math.round(pos[3*i+1]*5)+\',\'+Math.round(pos[3*i+2]*5)'))();
    const f = topoGenusField(56, 0.7), S = fsIso(f.q, 56, 0, null, f.s), m = mut(S.pos);
    ok('MUTATION — vertices welded with a tolerance coarser than the mesh (0.2 instead of 1e-5) merge distinct points and the counted χ is wrong, caught', src.includes(cut) && m.chi !== -2, `counted χ ${m.chi} instead of −2`); }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
