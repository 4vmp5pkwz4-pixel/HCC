/* THE SPHERE'S AI RECORDS (v4.415) — «Mathematical exploration and discovery at scale» (Georgiev, Gómez-Serrano, Tao, Wagner;
   arXiv:2511.02864, CC BY 4.0) put AlphaEvolve, a search that writes programs, to sixty-seven problems and printed what it found.
   Four are about points on a sphere. The paper prints NUMBERS, not coordinates, so the laboratory finds every configuration
   itself, from the golden-angle spiral, and sets it beside the printed table. Run here, as the page runs them — the pure
   functions between AESPHERE-MATH-BEGIN and AESPHERE-MATH-END, lifted out of index.html as they stand:
     1. the printed table as the paper prints it (Thomson, Tammes, kissing 1–11 with 593 in 11D, and the rest);
     2. Thomson: the descent lands on the closed forms (the bipyramid for N = 5, the icosahedron for N = 12) and on the paper's
        N = 10 to its last printed digit;
     3. Tammes: the sharpened soft minimum lands on √3 (N = 3), the icosahedron's 4/√(10 + 2√5) (N = 12) and, from a seeded
        start, on the best known N = 25 to its last printed digit;
     4. Fejes Tóth: the volume ascent lands on 8√3/27, √3/2, 4/3, Berman–Hanes' √((475 + 29√145)/250) and the icosahedron;
     5. exact structure: Euler's Σ(6 − q) = 12 on any triangulated sphere; the design strength (icosahedron 5, octahedron 3,
        not more); the 24-cell (24 at 60°, six Hopf fibres of four, and q ↦ q·e^{iθ} keeps every angle); E8 (240 at 60°);
        the drawing's pole 27.37° from all six fibres and the picture's exact three-fold symmetry;
     6. the comparison is made at the precision the paper printed — equal to its last digit is not «beyond» it;
     7. the laboratory's place in the atlas: every registration, the typed relations, a hand in WebXR and the atom's way in;
     8. the search the page runs after its first descent stops (seeded restarts of three kinds, in turn), run here with the
        page's own functions: Thomson N = 32 and Tammes N = 7, 25, 32, 50 reach the best known value to its last printed digit —
        N = 50 above AlphaEvolve's printed one. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const a = src.indexOf('/* ═══ AESPHERE-MATH-BEGIN'), b = src.indexOf('/* ═══ AESPHERE-MATH-END');
if (a < 0 || b < a) { console.log('FAIL — the AESPHERE-MATH block is missing'); process.exit(1); }
const M = new Function(src.slice(a, b) + `
return {AE_TABLE,aeFibonacciSphere,aeRng,aeRandomSphere,aeEnergy,aeMinDist,aeHull,aeVolume,aeVolumeStep,aeDesignStrength,aeIcosahedron,aeBipyramid,
  aeCuboctahedron,ae24Cell,aeHopf,aeHopfFibres,aeE8,aeKissingOk,aeTammesSolve,aeLbfgs,aeDegrees,aeQmul,aeFibrePoint,aeStereo,aeHopfPoleTurn,aeHopfPoleClearance,
  aeSearchStep,aeStallTick,aeRestartStart};`)();
const fnSrc = name => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j < 0 ? i + 4000 : j); };
const thomson = (P0, it) => { const S = { P: P0 }; M.aeLbfgs(S, 1, it || 800); return S.E; };
const tammes = P0 => { const S = { P: P0 }; let k = 0; for (; k < 60; k++) M.aeLbfgs(S, P0.length < 60 ? 6 : 4, 1, -1); for (; k < 12000 && !S.tamDone; k++) M.aeTammesSolve(S, 1, -1); return { d: M.aeMinDist(S.P).d, done: !!S.tamDone, S }; };
const volume = P0 => { const S = { P: P0 }; for (let k = 0; k < 3000; k++) M.aeVolumeStep(S, -1); return M.aeVolume(S.P); };
const digits = x => (String(x).split('.')[1] || '').length, tol = x => Math.max(Math.pow(10, -digits(x)), 1e-12 * Math.abs(x));
/* 1 */
{ const T = M.AE_TABLE, want = {
    thomson: '5,6.474691495,6.47469149468816|10,32.71694946,32.716949460147575|282,37147.294418462,37147.29441846226|292,39877.008012909,39877.00801290874|306,43862.569780797,43862.569780796766',
    tammes: '3,1.73205081,1.73205081|7,1.25687047,1.25687047|12,1.05146222,1.05146222|25,0.71077616,0.71077615|32,0.642469276,0.642469271|50,0.513472085,0.513472033|100,0.3650064961,0.3650062845|200,0.260990251,0.26081521504',
    kissing: '1,2,2|2,6,6|3,12,12|4,24,24|5,40,44|6,72,77|7,126,134|8,240,240|9,306,363|10,510,553|11,593,868' };
  const got = k => T[k].map(r => r.join(',')).join('|');
  const ok = ['thomson', 'tammes', 'kissing'].every(k => got(k) === want[k]) && Object.isFrozen(T) && T.kissing.find(r => r[0] === 11)[1] === 593;
  check(ok, 'the table is the paper’s, as printed: Thomson for N = 5, 10, 282, 292, 306 (state of the art beside AlphaEvolve), Tammes for N = 3 … 200, kissing numbers in dimensions 1 … 11 with 593 in 11D — AlphaEvolve’s, up from 592',
    `${T.thomson.length} Thomson rows · ${T.tammes.length} Tammes rows · 11D ${T.kissing[10][1]}–${T.kissing[10][2]} · frozen ${Object.isFrozen(T)}`); }
/* 2 */
{ const e5 = thomson(M.aeFibonacciSphere(5)), b5 = M.aeEnergy(M.aeBipyramid()), e10 = thomson(M.aeFibonacciSphere(10)), e12 = thomson(M.aeFibonacciSphere(12)), i12 = M.aeEnergy(M.aeIcosahedron());
  const t5 = M.AE_TABLE.thomson[0][1], t10 = M.AE_TABLE.thomson[1][1];
  check(Math.abs(e5 - b5) < 1e-9 && Math.abs(e5 - t5) <= tol(t5) && Math.abs(e10 - t10) <= tol(t10) && Math.abs(e12 - i12) < 1e-9,
    'Thomson, from the golden-angle spiral by L-BFGS on the sphere: N = 5 lands on the triangular bipyramid, N = 12 on the icosahedron (0, ±1, ±φ), and N = 10 on the paper’s value to its last printed digit',
    `N=5 ${e5.toFixed(12)} (bipyramid ${b5.toFixed(12)}) · N=10 ${e10.toFixed(10)} (paper ${t10}) · N=12 ${e12.toFixed(10)} (icosahedron ${i12.toFixed(10)})`); }
/* 3 */
{ const r3 = tammes(M.aeFibonacciSphere(3)), r12 = tammes(M.aeFibonacciSphere(12)), ico = 4 / Math.sqrt(10 + 2 * Math.sqrt(5));
  const r25 = tammes(M.aeRandomSphere(25, M.aeRng(1000 + 11 * 77 + 25))), t25 = M.AE_TABLE.tammes.find(r => r[0] === 25);
  check(Math.abs(r3.d - Math.sqrt(3)) < 1e-10 && Math.abs(r12.d - ico) < 1e-11 && Math.abs(r25.d - t25[1]) <= tol(t25[1]) && r12.done && r25.done,
    'Tammes, by the sharpened soft minimum (L-BFGS on each β, β doubling to 3·10¹¹): N = 3 lands on √3, N = 12 on the icosahedron’s 4/√(10 + 2√5), and a seeded start for N = 25 on the best known value to its last printed digit',
    `N=3 ${r3.d.toFixed(12)} · N=12 ${r12.d.toFixed(13)} (exact ${ico.toFixed(13)}, ${Math.abs(r12.d - ico).toExponential(1)}) · N=25 ${r25.d.toFixed(10)} (best known ${t25[1]}, AlphaEvolve ${t25[2]})`); }
/* 4 */
{ const want = { 4: 8 * Math.sqrt(3) / 27, 5: Math.sqrt(3) / 2, 6: 4 / 3, 8: Math.sqrt((475 + 29 * Math.sqrt(145)) / 250), 12: M.aeVolume(M.aeIcosahedron()) };
  const res = Object.entries(want).map(([n, v]) => { const got = volume(M.aeFibonacciSphere(+n)); return [n, got, v, Math.abs(got - v)]; });
  check(res.every(r => r[3] < 1e-9), 'Fejes Tóth, by the ascent of the hull’s volume (∂V/∂a = Σ (b × c)/6): N = 4, 5, 6, 8, 12 land on 8√3/27, √3/2, 4/3, Berman–Hanes’ √((475 + 29√145)/250) and the icosahedron',
    res.map(r => `N=${r[0]} ${r[1].toFixed(10)} (Δ ${r[3].toExponential(1)})`).join(' · ')); }
/* 5 */
{ const eulerOf = P => M.aeDegrees(P).deg.reduce((s, d) => s + (6 - d), 0);
  const eul = [17, 50, 101].map(n => eulerOf(M.aeRandomSphere(n, M.aeRng(7 + n)))), ico = M.aeDesignStrength(M.aeIcosahedron(), 8, 1e-9).t;
  const oct = M.aeDesignStrength([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], 8, 1e-9).t, tet = M.aeDesignStrength([[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(v => v.map(x => x / Math.sqrt(3))), 8, 1e-9).t;
  const Q = M.ae24Cell(), C = M.aeKissingOk(Q), F = M.aeHopfFibres(Q), E8 = M.aeKissingOk(M.aeE8());
  const turn = q => M.aeFibrePoint(q, 0.731), inner = (x, y) => x.reduce((s, v, i) => s + v * y[i], 0);
  let isoErr = 0; for (let i = 0; i < 24; i++) for (let j = 0; j < 24; j++) isoErr = Math.max(isoErr, Math.abs(inner(turn(Q[i]), turn(Q[j])) - inner(Q[i], Q[j])));
  const clear = M.aeHopfPoleClearance(), want = Math.acos(1 / Math.sqrt(3)) / 2 * 180 / Math.PI;
  const L = M.aeHopfPoleTurn(), u = [0.5, -Math.sqrt(3) / 2, 0, 0], T = q => M.aeQmul(M.aeQmul(u, q), u), k0 = T([0, 0, 0, 1]);
  const imgs = F.map(f => f[0]).map(q0 => Array.from({ length: 720 }, (_, k) => M.aeStereo(M.aeQmul(L, M.aeFibrePoint(q0, 2 * Math.PI * k / 720)))));
  const R = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0]].map(v => T(v).slice(0, 3)); let symErr = 0;
  for (const pts of imgs) for (let k = 0; k < pts.length; k += 45) { const p = pts[k], q = [0, 1, 2].map(r => R.reduce((s, col, c) => s + col[r] * p[c], 0)); let best = 1e9; for (const P2 of imgs) for (const p2 of P2) best = Math.min(best, Math.hypot(q[0] - p2[0], q[1] - p2[1], q[2] - p2[2])); symErr = Math.max(symErr, best); }
  const ok = eul.every(e => e === 12) && ico === 5 && oct === 3 && tet === 2 && C.n === 24 && Math.abs(C.minAngleDeg - 60) < 1e-9 && F.length === 6 && F.every(f => f.length === 4)
    && isoErr < 1e-12 && E8.n === 240 && Math.abs(E8.minAngleDeg - 60) < 1e-9 && Math.abs(clear - want) < 0.01 && Math.abs(k0[3] - 1) < 1e-12 && symErr < 1e-9;
  check(ok, 'exact structure: Σ(6 − q) = 12 on random triangulated spheres; the icosahedron a 5-design and no more, the octahedron 3, the tetrahedron 2; the 24-cell 24 at 60° on six Hopf fibres of four, and sliding along them (q ↦ q·e^{iθ}) keeps every angle; E8 240 at 60°; the drawing’s pole ½·arccos(1/√3) from all six fibres, and its picture three-fold symmetric exactly',
    `Euler ${eul.join(', ')} · designs ${ico}, ${oct}, ${tet} · 24-cell ${C.n} at ${C.minAngleDeg.toFixed(9)}° on ${F.length}×${F[0].length} · slide ${isoErr.toExponential(1)} · E8 ${E8.n} at ${E8.minAngleDeg.toFixed(9)}° · pole ${clear.toFixed(3)}° (${want.toFixed(3)}°) · symmetry ${symErr.toExponential(1)}`); }
/* 6 */
{ const tolSrc = fnSrc('aePrintTol'), read = fnSrc('aeReadHTML');
  const pt = new Function(tolSrc + '\nreturn aePrintTol;')();
  const ico = 4 / Math.sqrt(10 + 2 * Math.sqrt(5)), t12 = M.AE_TABLE.tammes.find(r => r[0] === 12), t32 = M.AE_TABLE.tammes.find(r => r[0] === 32);
  const ok = pt(1.05146222) === 1e-8 && Math.abs(ico - t12[1]) <= pt(t12[1]) && Math.abs(ico - t12[2]) <= pt(t12[2]) && pt(32.71694946) === 1e-8 && pt(6.47469149468816) < 1e-11
    && /okB=Math\.abs\(dB\)<=aePrintTol\(rec\.best\)/.test(read) && /okA=Math\.abs\(dA\)<=aePrintTol\(rec\.ai\)/.test(read) && !/gapA<-1e-9/.test(read)
    && /floor=H\.kn\?1e-14\*Math\.abs\(H\.kn\.v\):H\.rec\?aePrintTol\(H\.rec\.best\):0/.test(fnSrc('aeSyncChart'));
  check(ok, 'the page compares at the precision the paper printed: a value equal to the last printed digit is «the best known», not «beyond» it (before, the icosahedron’s 1.0514622242 was called beyond AlphaEvolve’s 1.05146222), and the chart never plots below that digit',
    `tolerance of 1.05146222: ${pt(1.05146222)} · icosahedron − printed ${(ico - t12[1]).toExponential(2)} · tolerance of 6.47469149468816: ${pt(6.47469149468816).toExponential(1)}`); }
/* 7 */
{ const has = (re, what) => [re.test(src), what];
  const sites = [has(/id:'aesphere',[\s\S]{0,400}?title:\{[^}]*ja:/, 'declaration (four languages)'), has(/aesphereConfirm415/, 'discovery'), has(/hccApiRegister\(\{\s*id:'aesphere'/, 'API'),
    has(/v==='aesphere'\?\[/, 'camera'), has(/aeGroup\.visible=/, 'group'), has(/aesphere:\{speed:\['aeSpeed',1\], pause:\['aePaused','p'\]\}/, 'controls'),
    has(/new Set\(\['chmem','ois','fibflag','aesphere'\]\)/, 'cockpit frame'), has(/goLab\('s3','aesphere'\)/, 'trip'), has(/id="atToThomson"/, 'the atom’s way in'),
    has(/hccXrGrab\(\{ id:'aesphere'/, 'a hand in WebXR'), has(/globalThis\.HCC_AESPHERE=Object\.freeze\(\{/, 'handle')];
  const rel = [...src.matchAll(/\['aesphere','([a-z0-9]+)','([a-z]+)','/g)].map(m => m[1] + ':' + m[2]);
  const miss = sites.filter(s => !s[0]).map(s => s[1]);
  check(!miss.length && rel.length >= 8 && new Set(rel.map(r => r.split(':')[0])).size === rel.length, 'the laboratory has its place in the atlas — declared in four languages, a discovery, an API, a camera, a cockpit frame, a trip, the atom laboratory’s way in (Thomson’s 1904 atom), a grab for a WebXR hand, a handle for agents — and at least eight typed relations, to as many laboratories',
    `${sites.length - miss.length}/${sites.length}${miss.length ? ' · MISSING ' + miss.join(', ') : ''} · relations ${rel.join(' ')}`); }
/* 8 */
{ const value = (mode, S) => mode === 'thomson' ? M.aeEnergy(S.P, 1) : M.aeMinDist(S.P).d;
  const search = (mode, N, target, maxR) => { let S = { P: M.aeFibonacciSphere(N) }, it = 0; const T = {};
    for (;;) { M.aeSearchStep(mode, N, S, it, -1); it++; if (M.aeStallTick(T, value(mode, S)) || it > 20000) break; }
    let best = value(mode, S), r = 0; const first = best, better = (x, y) => mode === 'thomson' ? x < y - 1e-12 * Math.abs(y) : x > y + 1e-12 * Math.abs(y);
    while (Math.abs(best - target) > tol(target) && r < maxR) { r++; const st = M.aeRestartStart(mode, N, 1, r, S.P), C = { P: st.P }; let ci = st.it; const CT = {};
      for (;;) { M.aeSearchStep(mode, N, C, ci, -1); ci++; if (M.aeStallTick(CT, value(mode, C)) || ci > (mode === 'tammes' ? 8000 : 4000)) break; }
      const v = value(mode, C); if (better(v, best)) { best = v; S = C; } }
    return { first, best, r, ok: Math.abs(best - target) <= tol(target) }; };
  const tm = N => M.AE_TABLE.tammes.find(r => r[0] === N);
  const runs = [['thomson', 32, 412.261274651], ['tammes', 7, tm(7)[1]], ['tammes', 25, tm(25)[1]], ['tammes', 32, tm(32)[1]], ['tammes', 50, tm(50)[1]]].map(([m, N, t]) => [m, N, t, search(m, N, t, 30)]);
  const n50 = runs[4][3];
  check(runs.every(x => x[3].ok) && n50.best - tm(50)[2] > tol(tm(50)[2]), 'the search after the first descent — seeded restarts of three kinds in turn (random after a Riesz descent, the best shaken, random straight into the soft minimum) — reaches Thomson N = 32 and Tammes N = 7, 25, 32, 50 to the last printed digit of the best known; for N = 50 that is above AlphaEvolve’s printed 0.513472033',
    runs.map(([m, N, t, r]) => `${m} ${N}: ${r.first.toFixed(10)} → ${r.best.toFixed(10)} at restart ${r.r}`).join(' · ')); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
