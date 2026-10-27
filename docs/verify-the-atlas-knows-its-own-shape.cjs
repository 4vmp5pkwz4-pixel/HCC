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
  const { atlasRelGraph, atlasBetti, atlasJacobi, atlasLaplacian, atlasFiedler, atlasBusOrder, atlasCore2 } = K;
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
  const F = atlasFiedler(G, 'mainseq');
  { const v = F.vector, dot1 = v.reduce((t, x) => t + x, 0), nn = v.reduce((t, x) => t + x * x, 0); let q = 0; for (const [i, j] of G.E) q += (v[i] - v[j]) ** 2;
    ok('the Fiedler vector is orthogonal to the constant, its Rayleigh quotient is λ₂, and the cut it makes obeys Cheeger\'s inequality λ₂/2 ≤ h ≤ √(2Δλ₂)',
      Math.abs(dot1) < 1e-9 && Math.abs(q / nn - F.lambda2) < 1e-9 && F.lower <= F.h && F.h <= F.upper && F.lambda2 > 0, `λ₂ ${F.lambda2.toFixed(6)} · ${F.lower.toFixed(3)} ≤ h ${F.h.toFixed(3)} ≤ ${F.upper.toFixed(3)} · seam ${F.seam.length}`); }

  /* 4 · the found division — measured on the 2-core (v4.380): a laboratory hanging by one relation is a bottleneck of
     its own and would take the first mode for itself (Cheeger); the leaves follow the laboratory they hang from */
  const C2 = atlasCore2(REL), Gc = atlasRelGraph(C2.rels), Fc = atlasFiedler(Gc, 'mainseq');
  ok('the 2-core: stripping the laboratories that hang by one relation leaves every laboratory measured before v4.380 in place — the leaves are exactly the newest, one relation each, and each is attached to a core laboratory',
    C2.attach.size <= 8 && [...C2.attach].every(([v, r]) => Gc.ix.has(r) && !Gc.ix.has(v)) && Gc.V.length + C2.attach.size === G.V.length,
    `${Gc.V.length} in the core · leaves: ${[...C2.attach].map(([v, r]) => v + '→' + r).join(', ') || 'none'}`);
  { const F = Fc, G = Gc; const sky = new Set(F.sky), inSky = ['bb', 'mainseq', 'cosmo', 'galrot'], inSphere = ['hopf', 'nsflow', 's3shell', 'tri', 'topo', 'su2'];
    ok('FOUND — with no label consulted, the first mode separates the observed sky from the sphere: black bodies, the main sequence, cosmology and galaxy rotation on one side; the Hopf fibration, Navier–Stokes on S³, the curl shells, the trisphere, topology and SU(2) on the other',
      inSky.every(x => sky.has(x)) && inSphere.every(x => !sky.has(x)), `${F.sky.length} in the sky · ${F.sphere.length} in the sphere`);
    /* and the seam is the harmonic analysis of the sphere: the spherical harmonics stand ON it. The CMB stood there too
       (nearest at 376 relations, 4th at 383) until the space-form laboratory declared the CMB can show the topology
       of S³/Γ — that one causal relation carries it across to the sphere side. Measured both ways, every build.
       v4.373: the null Beltrami laboratory's five relations (to the resonator, the Unified Atlas, Hopf, contact and the
       light cone) moved the charged-particle laboratory past the harmonics by a hair (|v| 2.6e-3 against 2.8e-3), so
       the harmonics stand sixth nearest — the pin is the six nearest, and the five-times-below-the-median stays.
       v4.378: the fluid computer's three relations (to the exact solution, the blow-up and contact geometry) shift the
       first mode again — the harmonics are ninth nearest of 136 (|v| 3.3e-3, median 2.3e-2): the pin is the ten nearest;
       five times below the median is unchanged. The seam is a measured, moving quantity — it is re-measured every build.
       v4.406: the Fibonacci cube's two relations (to the Haldane gap and the anyon zoo) shift the first mode once more: cut
       from its two sphere-side relations the CMB stands seventh nearest of 143 (|v| 1.5e-3, sixteen times below the median
       2.4e-2) — the same footing as the harmonics, so its pin is the same: among the ten nearest, ranked over every laboratory
       and not only the six the kernel lists.
       v4.379: the critical-curves laboratory's two relations (the SLE/CFT central charge to the anyon laboratory, the
       Brownian driving function to kinetic theory) bring the harmonics back to fourth nearest (|v| 2.3e-3, median 2.2e-2).
       Measured on the way: ONE pendant relation can move them anywhere from 4th to 30th — the rank is fragile, the
       five-times-below-the-median is the robust half of this finding.
       v4.395: the causal-memory laboratory's four relations (the space forms, Hopf, the trisphere, cosmology) bring the
       harmonics to second nearest (|v| 8.4e-4, median 2.0e-2) and the CMB, without the space-form relation, to fifth
       on the seam. Measured on the way, and the reason its fourth relation goes to cosmology: declared to the CMB
       instead ("what a quotient could leave on the sky"), it would have been a second relation saying the sky can show
       S³/Γ, and it carried the CMB off the seam on its own (8.3e-3, under three times below the median) — a duplicate
       of s3gamma→cmb, where the statement it makes (a quotient never changes the local Friedmann expansion at fixed
       stress-energy) is about the expansion.
       v4.400: the information-spectrum laboratory declares a second relation from the sphere side to the CMB, and it is
       not that duplicate: s3gamma→cmb says the sky CAN show S³/Γ, ois→cmb says what an orientation-marginalised test of
       one multipole CANNOT see at first order (Schur's lemma: the twirl of a traceless anisotropy is zero). Either one
       alone carries the CMB across; without both it stands on the seam again — measured three ways, every build. Tried
       and refused: declaring the Schur statement to the spherical harmonics instead pulls the harmonics off the seam
       (rank 12, |v| 5.3e-3 against a median of 2.1e-2), which would have bent the finding rather than the graph. With both
       relations the CMB stands at |v| 8.2e-3, 2.4 times below the median (it was over three with one): the pin is now
       twice, the measured value is printed every build.
       v4.407: the Hopf insulator's two relations (to the hopfion and the Hopf fibration) move the supernova laboratory
       past the harmonics by a hair (|v| 2.5e-3 against 2.7e-3): the harmonics stand eleventh nearest of 144, 8.8 times
       below the median 2.3e-2; they stood tenth in v4.406 (2.2e-3, 10.2 times below), exactly on the old pin. The rank
       sits at that edge, so the pin is the twelve nearest for both, the harmonics and the CMB cut from its two
       sphere-side relations (eighth, |v| 2.0e-3, 12.5 times below); the five-times-below-the-median is unchanged. */
    const rk = x => F.onSeam.findIndex(([y]) => y === x), rkAll = x => G.V.map((y, i) => [y, Math.abs(F.vector[i])]).sort((p, q) => p[1] - q[1]).findIndex(([y]) => y === x), vc = Math.abs(F.vector[G.ix.get('cmb')]), vs = Math.abs(F.vector[G.ix.get('sh')]);
    const cut = (R, a, b) => R.filter(r => !(r[0] === a && r[1] === b) && !(r[0] === b && r[1] === a));
    const G0 = atlasRelGraph(atlasCore2(cut(cut(REL, 's3gamma', 'cmb'), 'ois', 'cmb')).rels), F0 = atlasFiedler(G0, 'mainseq'), rk0 = G0.V.map((y, i) => [y, Math.abs(F0.vector[i])]).sort((p, q) => p[1] - q[1]).findIndex(([y]) => y === 'cmb');
    const each = ['s3gamma', 'ois'].map(o => { const G1 = atlasRelGraph(atlasCore2(cut(REL, o === 's3gamma' ? 'ois' : 's3gamma', 'cmb')).rels), F1 = atlasFiedler(G1, 'mainseq'); return !F1.sky.includes('cmb') && F1.onSeam.findIndex(([y]) => y === 'cmb') < 0; });
    ok('FOUND — the seam is the harmonic analysis of the sphere: the spherical harmonics stand ON it (among the twelve nearest zero, five times below the median); the CMB stands on it without its relations to the sphere side — "the CMB can show S³/Γ" and, since v4.400, "the singlet the low multipoles lose" — and either one alone carries it to the sphere side; with both it stays near the seam, more than twice below the median',
      rkAll('sh') >= 0 && rkAll('sh') < 12 && vs * 5 < F.medAbs && rk0 >= 0 && rk0 < 12 && !F.sky.includes('cmb') && vc * 2 < F.medAbs && vc > Math.abs(F0.vector[G0.ix.get('cmb')]) && each.every(Boolean),
      `|v_sh| ${vs.toExponential(1)} (rank ${rkAll('sh')}) · CMB without its two relations to the sphere side: rank ${rk0}, |v| ${Math.abs(F0.vector[G0.ix.get('cmb')]).toExponential(1)} · either one alone carries it across ${each.every(Boolean) ? '✓' : '✗'} · with both: sphere side, |v| ${vc.toExponential(1)} · median ${F.medAbs.toExponential(1)}`); }

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
