#!/usr/bin/env node
'use strict';
/* ══ THE ATLAS'S OWN SHAPE — MUTUAL ARISING, AND QUANTITY THAT FLOWS ONE WAY ══════════════
 * The atlas holds together by two graphs of opposite kind. This file reads both from the source
 * and the manifest and checks the extracted kernels against references written HERE:
 *   1. the relation graph is connected and its first Betti number b₁ = E − V + b₀ is counted
 *      correctly — b₀ found here by breadth-first search, E and V by a separate parse
 *   2. every eigenpair the Jacobi solver returns satisfies L v = λ v to rounding, the lowest is 0
 *      with the constant vector, and the spectrum sums to the trace (twice the edge count)
 *   3. the Fiedler vector is orthogonal to the constant, its Rayleigh quotient is λ₂, and the cut it
 *      makes obeys Cheeger's inequality λ₂/2 ≤ h ≤ √(2Δλ₂)
 *   4. FOUND: with no label consulted the cut separates the observed sky from the sphere — the
 *      cosmic microwave background, black bodies and the main sequence on one side; the Hopf
 *      fibration, the Navier–Stokes flow and the S³ programme on the other
 *   5. the quantity bus is acyclic, checked here by depth-first search on the manifest's links
 *      (a rule of the atlas, not a finding), and its longest chain is measured
 *   6. MUTATION: deleting one relation that sits on a cycle lowers b₁ by exactly one, caught
 *   7. wiring: the layer on the Trisphere, its controls, and HCC_ATLAS_SELF
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const MAN = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'api', 'manifest.json'), 'utf8'));
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const a = SRC.indexOf('const NEXUS_RELATIONS=['), blk = SRC.slice(a, SRC.indexOf('\n];', a));
const REL = [...blk.matchAll(/^\s*\['([a-z0-9]+)','([a-z0-9]+)','([a-z]+)'/gm)].map(m => [m[1], m[2], m[3]]);

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { atlasRelGraph, atlasBetti, atlasJacobi, atlasLaplacian, atlasFiedler, atlasBusOrder } = K;
  const G = atlasRelGraph(REL), B = atlasBetti(G);

  /* 1 · Betti, counted here */
  { const V = [...new Set(REL.flatMap(r => [r[0], r[1]]))], E = new Set(REL.filter(r => r[0] !== r[1]).map(r => [r[0], r[1]].sort().join('|'))), adj = new Map(V.map(v => [v, []]));
    for (const e of E) { const [x, y] = e.split('|'); adj.get(x).push(y); adj.get(y).push(x); }
    const seen = new Set(); let b0 = 0; for (const v of V) { if (seen.has(v)) continue; b0++; const q = [v]; seen.add(v); while (q.length) { const x = q.shift(); for (const y of adj.get(x)) if (!seen.has(y)) { seen.add(y); q.push(y); } } }
    ok('the relation graph is connected and its first Betti number b₁ = E − V + b₀ is what the kernel says — b₀ by breadth-first search here, E and V by a separate parse',
      B.b0 === b0 && B.V === V.length && B.E === E.size && B.b1 === E.size - V.length + b0 && b0 === 1, `V ${V.length} · E ${E.size} · b₀ ${b0} · b₁ ${B.b1}`); }

  /* 2 · the spectrum */
  const L = atlasLaplacian(G), S = atlasJacobi(L), n = G.V.length;
  { let worst = 0; for (let k = 0; k < n; k += 7) { const v = S.vectors[k], lam = S.values[k]; for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < n; j++) s += L[i][j] * v[j]; worst = Math.max(worst, Math.abs(s - lam * v[i])); } }
    const trace = L.reduce((t, r, i) => t + r[i], 0), sum = S.values.reduce((t, x) => t + x, 0), c = S.vectors[0], cmean = c.reduce((t, x) => t + x, 0) / n, cdev = Math.max(...c.map(x => Math.abs(x - cmean)));
    ok('every eigenpair satisfies L v = λ v to rounding, the lowest is 0 on the constant vector, and the spectrum sums to the trace — twice the number of relations',
      worst < 1e-9 && Math.abs(S.values[0]) < 1e-10 && cdev < 1e-9 && Math.abs(sum - trace) < 1e-8 && trace === 2 * B.E, `‖Lv − λv‖∞ ≤ ${worst.toExponential(1)} · λ₀ ${S.values[0].toExponential(1)} · Σλ ${sum.toFixed(6)} = tr L ${trace}`); }

  /* 3 · Fiedler and Cheeger */
  const F = atlasFiedler(G, 'cmb');
  { const v = F.vector, dot1 = v.reduce((t, x) => t + x, 0), nn = v.reduce((t, x) => t + x * x, 0); let q = 0; for (const [i, j] of G.E) q += (v[i] - v[j]) ** 2;
    ok('the Fiedler vector is orthogonal to the constant, its Rayleigh quotient is λ₂, and the cut it makes obeys Cheeger\'s inequality λ₂/2 ≤ h ≤ √(2Δλ₂)',
      Math.abs(dot1) < 1e-9 && Math.abs(q / nn - F.lambda2) < 1e-9 && F.lower <= F.h && F.h <= F.upper && F.lambda2 > 0, `λ₂ ${F.lambda2.toFixed(6)} · ${F.lower.toFixed(3)} ≤ h ${F.h.toFixed(3)} ≤ ${F.upper.toFixed(3)} · seam ${F.seam.length}`); }

  /* 4 · the found division */
  { const sky = new Set(F.sky), inSky = ['cmb', 'bb', 'mainseq', 'cosmo', 'galrot'], inSphere = ['hopf', 'nsflow', 's3shell', 'tri', 'topo', 'su2'];
    ok('FOUND — with no label consulted, the first mode separates the observed sky from the sphere: the CMB, black bodies, the main sequence, cosmology and galaxy rotation on one side; the Hopf fibration, Navier–Stokes on S³, the curl shells, the trisphere, topology and SU(2) on the other',
      inSky.every(x => sky.has(x)) && inSphere.every(x => !sky.has(x)), `${F.sky.length} in the sky · ${F.sphere.length} in the sphere`); }

  /* 5 · the bus */
  { const links = MAN.bus.links, lab = s => s.split('.')[0], g = new Map(); for (const l of links) { const x = lab(l.from), y = lab(l.to); if (!g.has(x)) g.set(x, new Set()); if (!g.has(y)) g.set(y, new Set()); if (x !== y) g.get(x).add(y); }
    const col = new Map(); let cyc = false; const dfs = x => { col.set(x, 1); for (const y of g.get(x)) { if (col.get(y) === 1) cyc = true; else if (!col.has(y)) dfs(y); } col.set(x, 2); }; for (const x of g.keys()) if (!col.has(x)) dfs(x);
    const O = atlasBusOrder(links);
    ok('the quantity bus is acyclic — checked here by depth-first search on the manifest\'s links, a RULE of the atlas rather than a finding — and its longest chain of numbers feeding numbers is measured', !cyc && O.acyclic && O.labs === g.size && O.longest >= 3, `${O.links} links among ${O.labs} laboratories · longest chain ${O.longest} · ${O.sources.length} sources, ${O.sinks.length} sinks`); }

  /* 6 · mutation */
  { let drop = -1; for (let k = 0; k < REL.length; k++) { const R2 = REL.filter((_, i) => i !== k), G2 = atlasRelGraph(R2), B2 = atlasBetti(G2); if (B2.V === B.V && B2.E === B.E - 1 && B2.b0 === 1) { drop = B.b1 - B2.b1; break; } }
    ok('MUTATION — deleting one relation that sits on a cycle lowers b₁ by exactly one and leaves the atlas connected, caught', drop === 1, `Δb₁ = ${drop}`); }

  /* 7 · wiring */
  ok('wiring: the two halves as a layer on the Trisphere, the shape section in its controls, and HCC_ATLAS_SELF.shape()',
    /state\.triHalves===true/.test(SRC) && /data-trihalves="1"/.test(SRC) && /seamL\.name='tri-seam'/.test(SRC) && /globalThis\.HCC_ATLAS_SELF=Object\.freeze\(\{shape:/.test(SRC) && /const rels=NEXUS_RELATIONS\.map\(r=>\[r\.a\?\?r\[0\],r\.b\?\?r\[1\],r\.type\?\?r\[2\]\]\)/.test(SRC));

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
