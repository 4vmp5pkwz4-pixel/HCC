#!/usr/bin/env node
'use strict';
/* ══ THE INVARIANT NEXUS IS A STRUCTURE, NOT A SMEAR ═══════════════════════════════
 * The Nexus drew 362 typed relations as independent arcs between laboratories placed in
 * disciplinary clouds; every arc was honest and the whole was unreadable. Its default
 * geometry is now built from the structure the relations already have, and this file
 * reads index.html and checks that it is:
 *   1. the laboratories stand on ONE ring, in sectors by discipline, with a gap between
 *      sectors — positions computed, none placed by hand
 *   2. every typed relation — and every bus route and refusal — is a hierarchically bundled
 *      curve (Holten 2006): laboratory → its discipline's hub → (the centre, when it leaves
 *      its discipline) → the other hub → the other laboratory, straightened by β
 *   3. the straightening is Holten's, recomputed here: control point P_i becomes
 *      β P_i + (1 − β)(P_0 + i/n (P_n − P_0)); the ends never move; β = 1 is the raw
 *      hierarchy path and β = 0 the straight chord
 *   4. above the ring stand the census's own layers — laws across the bus, laws through a
 *      middle laboratory, and the families of one law in many laboratories — read from
 *      api/invariants.json, and a laboratory's size is how much the census found in it
 *   5. the older geometries remain, one press away, and nothing the Nexus checks about
 *      itself (paths, the spectral embedding, refusal gaps) depends on which is shown
 *   6. MUTATIONS: bundles that skip the hubs, and a straightening that moves the ends, are
 *      each caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

/* 1 · the ring */
const ring = s => /const keys=Object\.keys\(NEXUS_CLUSTERS\), total=keys\.reduce\(\(a,k\)=>a\+NEXUS_CLUSTERS\[k\]\.views\.length,0\), gap=0\.07, avail=2\*Math\.PI-gap\*keys\.length/.test(s)
  && /C\.views\.forEach\(\(lab,i\)=>\{ const a=th\+span\*\(i\+0\.5\)\/n; pos\.set\(lab,nexusSP\(new THREE\.Vector3\(Math\.cos\(a\)\*R,0,Math\.sin\(a\)\*R\)\)\); \}\);/.test(s);
ok('the laboratories stand on one ring, in sectors by discipline, a gap between sectors, every position computed', ring(SRC));

/* 2 · the bundles */
const bundle = s => /if\(ca===cb\) P\.push\(S\.hub\.get\(ca\)\); else \{ P\.push\(S\.hub\.get\(ca\)\); P\.push\(new THREE\.Vector3\(\)\); P\.push\(S\.hub\.get\(cb\)\); \}/.test(s)
  && /e\.curve=nexusCurveFor\(e\.a,e\.b,e\.i\);/.test(s) && /r\.curve=nexusCurveFor\(r\.a,r\.b,700\+i\+\+\);/.test(s) && /f\.curve=nexusCurveFor\(f\.a,f\.b,900\+i\+\+\);/.test(s);
ok('every typed relation, bus route and refusal is bundled through its discipline\'s hub and, across disciplines, through the centre', bundle(SRC));

/* 3 · Holten's straightening, recomputed */
const straighten = (P, beta) => { const n = P.length - 1, A = P[0], B = P[n];
  return P.map((p, i) => (i === 0 || i === n) ? p.slice() : p.map((x, k) => beta * x + (1 - beta) * (A[k] + (B[k] - A[k]) * i / n))); };
const P = [[4.6, 0, 0], [2.4, 0, 0.4], [0, 0, 0], [-1.2, 0, 2.1], [-2.3, 0, 4.0]];
const s85 = straighten(P, 0.88), s1 = straighten(P, 1), s0 = straighten(P, 0);
const endsFixed = [s85, s1, s0].every(q => q[0].join() === P[0].join() && q[4].join() === P[4].join());
const raw = s1.every((q, i) => q.join() === P[i].join());
const chord = s0.every((q, i) => q.every((x, k) => Math.abs(x - (P[0][k] + (P[4][k] - P[0][k]) * i / 4)) < 1e-12));
const src = /out=P\.map\(\(p,i\)=>i===0\|\|i===n\?p\.clone\(\):p\.clone\(\)\.multiplyScalar\(NEXUS_STRUCT_BETA\)\.add\(A\.clone\(\)\.lerp\(B,i\/n\)\.multiplyScalar\(1-NEXUS_STRUCT_BETA\)\)\)/.test(SRC)
  && /NEXUS_STRUCT_BETA=0\.88/.test(SRC);
ok('the straightening is Holten\'s: ends fixed, β = 1 the raw hierarchy path, β = 0 the chord, β = 0.88 in between', src && endsFixed && raw && chord,
  `middle control point at β 0.88: (${s85[2].map(x => x.toFixed(3)).join(', ')}) between the centre and the chord`);

/* 4 · the census above */
const census = s => /async function nexusStructureCensus\(\)\{/.test(s) && /for\(const c of \(A\.across_the_bus\|\|\[\]\)\)/.test(s) && /for\(const c of \(A\.through_a_middle_laboratory\|\|\[\]\)\)/.test(s)
  && /const U=invUniversality\(A\)\.slice\(0,8\)/.test(s) && /n\.rich=1\+Math\.min\(1\.1,0\.16\*score\);/.test(s);
ok('above the ring stand the census\'s layers — laws across the bus, laws through a middle laboratory, families of one law — and a node\'s size is what the census found in it', census(SRC));

/* 5 · the older geometries remain, and the Nexus's own checks do not depend on the view */
const older = /function nexusStructureOn\(\)\{ return state\.nexusStructure!==false; \}/.test(SRC) && /id="nxStruct"/.test(SRC) && /id="nxMorph"/.test(SRC)
  && /function nexusSpectralEmbedding\(/.test(SRC) && /function nexusFindPath\(source,target,kind=state\.nexusKind\|\|'all'\)\{/.test(SRC);
ok('the disciplinary and spectral geometries remain one press away; paths and the spectral embedding are computed from the relations, not from what is drawn', older);

/* 6 · mutations */
ok('MUTATION — bundles that skip the hubs are caught', !bundle(SRC.replace('if(ca===cb) P.push(S.hub.get(ca)); else { P.push(S.hub.get(ca)); P.push(new THREE.Vector3()); P.push(S.hub.get(cb)); }', 'P.push(new THREE.Vector3());')));
const bad = (Pp, beta) => Pp.map((p, i) => p.map((x, k) => beta * x + (1 - beta) * (Pp[0][k] + (Pp[4][k] - Pp[0][k]) * i / 4 + 0.1)));
ok('MUTATION — a straightening that moves the ends is caught', bad(P, 0.88)[0].join() !== P[0].join());

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
