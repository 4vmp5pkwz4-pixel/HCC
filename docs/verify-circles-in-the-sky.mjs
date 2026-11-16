/* CIRCLES IN THE SKY (v4.427) — the observational test of cosmic topology, drawn from inside S³/Γ. The mathematics is three blocks
   of pure functions (SKY-MATH, TOPO-MATH, CIRCLES-MATH), lifted out of index.html and run here as they stand.
     1. the circle is where it is drawn: its points are at χ from the observer and from the copy, and nowhere else on that cone;
     2. the pair matches: a field that lives on S³/Γ reads the same along both circles — and one that does not, does not (control);
     3. how many pairs, and when: 6 for Poincaré's space from χ = π/10, 3 for the quaternion space from π/4, none for projective space;
     4. the radius of last scattering against an independent quadrature, and the curvature at which the first pairs appear;
     5. the shader evaluates the same field with the same quaternion product, and the layer is in the page and the instrument.
   NOT checked here: any pixel, and any observation. The field is synthetic; no map of the sky is searched. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error('block not found: ' + a); return src.slice(i, j); };
const L = new Function(`${cut('/* ═══ SKY-MATH-BEGIN ═══', '/* ═══ SKY-MATH-END ═══')}\n${cut('/* ═══ TOPO-MATH-BEGIN ═══', '/* ═══ TOPO-MATH-END ═══')}\n${cut('/* ═══ CIRCLES-MATH-BEGIN ═══', '/* ═══ CIRCLES-MATH-END ═══')}
  return {iskyDot,iskyUnit,iskyRay,iskyPoints,iskyRng,iskyQmul,ISKY_SPACES,iskyGroupOf,iskyNearestCopy,iskyCircleAngle,iskyCircles,iskyCopyDir,iskyFieldModes,iskyFieldH,iskyField,iskyFieldStats,iskyMonomialAverage,iskyChiLS,iskyCurvatureForLS};`)();
const KEYS = ['rp3', 'q8', 't24', 'o48', 'i120'], G = Object.fromEntries(KEYS.map(k => [k, L.iskyGroupOf(k)])), conj = q => [q[0], -q[1], -q[2], -q[3]], dist = (a, b) => Math.acos(Math.max(-1, Math.min(1, L.iskyDot(a, b))));
/* two unit tangent vectors at o, orthogonal to each other and to a given tangent direction */
const frame = (o, dir, seed) => { const out = []; for (const v of L.iskyPoints(2, seed)) { let w = v.slice(); for (const b of [o, dir, ...out]) { const p = L.iskyDot(w, b); w = w.map((x, i) => x - p * b[i]); } out.push(L.iskyUnit(w)); } return out; };
const onCone = (o, dir, e, alpha, ph) => dir.map((x, i) => Math.cos(alpha) * x + Math.sin(alpha) * (Math.cos(ph) * e[0][i] + Math.sin(ph) * e[1][i]));

{ let worst = 0, off = 9, n = 0;
  for (const k of ['q8', 't24', 'o48', 'i120']) for (const chi of [0.45, 0.9, 1.3]) { const o = L.iskyPoints(1, 31 + n)[0];
    for (const C of L.iskyCircles(G[k], chi).slice(0, 6)) { const g = G[k][C.k], c = L.iskyQmul(g, o), dir = L.iskyCopyDir(o, g), e = frame(o, dir, 500 + n);
      for (let j = 0; j < 8; j++) { n++; const p = L.iskyRay(o, onCone(o, dir, e, C.alpha, j * 0.785), chi); worst = Math.max(worst, Math.abs(dist(p, o) - chi), Math.abs(dist(p, c) - chi));
        const q = L.iskyRay(o, onCone(o, dir, e, C.alpha + 0.05, j * 0.785), chi); off = Math.min(off, Math.abs(dist(q, c) - chi)); } } }
  check(worst < 1e-9 && off > 1e-3 && n > 400, 'the circle is where it is drawn: on the cone of half-angle α about the direction of the copy, cos α = tan(θ/2)/tan χ, the points of the last-scattering sphere are at distance χ from the observer AND from the copy g·o — and a cone three degrees wider is not — in four spaces at three radii',
    `${n} points on circles · worst departure from χ ${worst.toExponential(1)} · nearest miss on the wider cone ${off.toExponential(1)}`); }

{ const M = L.iskyFieldModes(427, 6); let worst = 0, control = 0, n = 0, spread = 9;
  for (const k of KEYS.slice(1)) { const o = L.iskyPoints(1, 77)[0], chi = 0.9, Gk = G[k];
    for (const C of L.iskyCircles(Gk, chi).slice(0, 8)) { const g = Gk[C.k], gi = conj(g), dir = L.iskyCopyDir(o, g), e = frame(o, dir, 900 + n); const vals = [];
      for (let j = 0; j < 10; j++) { n++; const p = L.iskyRay(o, onCone(o, dir, e, C.alpha, j * 0.63), chi), q = L.iskyQmul(gi, p);
        if (Math.abs(dist(q, o) - chi) > 1e-9) worst = 1;                                   /* the partner point is on OUR last-scattering sphere too */
        const a = L.iskyField(Gk, p, M), b = L.iskyField(Gk, q, M); vals.push(a); worst = Math.max(worst, Math.abs(a - b)); control = Math.max(control, Math.abs(L.iskyFieldH(p, M) - L.iskyFieldH(q, M))); }
      spread = Math.min(spread, (Math.max(...vals) - Math.min(...vals)) / L.iskyFieldStats(Gk, M, 200).std); } }
  /* the same in projective space, which has no circles but whose antipodal points must still agree */
  const pr = L.iskyPoints(50, 5).map(p => Math.abs(L.iskyField(G.rp3, p, M) - L.iskyField(G.rp3, p.map(x => -x), M))).reduce((a, b) => Math.max(a, b), 0);
  check(worst < 1e-10 && pr < 1e-12 && control > 0.5 && spread > 0.3, 'the pair matches: carried by g⁻¹, each point of a circle lands on the observer’s own last-scattering sphere, and a field averaged over Γ reads the same there to rounding — in the quaternion, tetrahedral, octahedral and dodecahedral spaces — while the SAME six waves unaveraged differ by order one (the control), and the field varies along the circle, so the agreement is not that of a constant',
    `${n} matched points · worst difference ${worst.toExponential(1)} · unaveraged control differs by up to ${control.toFixed(2)} · least variation along a circle ${spread.toFixed(2)} standard deviations of the field · projective space, antipodes ${pr.toExponential(1)}`); }

{ const cnt = (k, chi) => L.iskyCircles(G[k], chi).length / 2, i = Math.PI / 10;
  const ok = cnt('i120', i - 1e-6) === 0 && cnt('i120', i + 1e-6) === 6 && cnt('q8', Math.PI / 4 - 1e-6) === 0 && cnt('q8', Math.PI / 4 + 1e-6) === 3 && cnt('t24', Math.PI / 6 + 1e-6) === 4 && cnt('o48', Math.PI / 8 + 1e-6) === 3
    && [0.3, 0.9, 1.5].every(c => cnt('rp3', c) === 0) && cnt('i120', 1.5) === 59 && L.iskyCircleAngle(0.6, 0.2) === null && Math.abs(L.iskyCircleAngle(Math.PI / 5, Math.PI / 10)) < 1e-7;
  check(ok, 'how many, and from when: the circles of the nearest copies appear, as points, exactly when χ reaches half the distance to them — six pairs in Poincaré’s space at π/10 (its twelve nearest copies), three in the quaternion space at π/4, four in the tetrahedral at π/6, three in the octahedral at π/8 — never in projective space, whose only copy is the antipode; and a sphere of last scattering reaching nearly a quarter of the way round shows all 59 pairs of Poincaré’s space',
    `i120: ${cnt('i120', i + 1e-6)} at π/10, ${cnt('i120', 0.7)} at 0.7, ${cnt('i120', 1.5)} at 1.5 · q8: ${cnt('q8', Math.PI / 4 + 1e-6)} · t24: ${cnt('t24', Math.PI / 6 + 1e-6)} · o48: ${cnt('o48', Math.PI / 8 + 1e-6)} · rp3: 0`); }

{ const Om = 0.315, h = 0.674, Or = 4.18e-5 / (h * h), zLS = 1089.9;
  const indep = k => { const Ok = -k, OL = 1 - Om - Or - Ok; let S = 0; const N = 200000, X = Math.log(1 + zLS); for (let i = 0; i < N; i++) { const q = Math.exp((i + 0.5) * X / N); S += q / Math.sqrt(Or * q ** 4 + Om * q ** 3 + Ok * q * q + OL); } return Math.sqrt(k) * S * X / N; };
  const T = Object.fromEntries(['q8', 't24', 'o48', 'i120'].map(k => [k, L.iskyCurvatureForLS(L.iskyNearestCopy(G[k]) / 2, Om, h)]));
  const a13 = L.iskyCircles(G.i120, L.iskyChiLS(0.013, Om, h)), a20 = L.iskyCircles(G.i120, L.iskyChiLS(0.02, Om, h)), a50 = L.iskyCircles(G.i120, L.iskyChiLS(0.05, Om, h)), lit = L.iskyCircles(G.i120, L.iskyChiLS(0.013, 0.28, 0.70));
  const deg = C => C[0].alpha * 180 / Math.PI;
  check(Math.abs(L.iskyChiLS(0.001, Om, h) - indep(0.001)) < 1e-6 && Math.abs(L.iskyChiLS(0.013, Om, h) - indep(0.013)) < 1e-6 && Math.abs(T.i120 - 0.01011) < 5e-5 && T.i120 < T.o48 && T.o48 < T.t24 && T.t24 < T.q8
    && a13.length === 12 && Math.abs(deg(a13) - 29.3) < 0.2 && a20.length === 12 && Math.abs(deg(a20) - 46.8) < 0.2 && a50.length === 44 && lit.length === 12 && Math.abs(deg(lit) - 34.1) < 0.2,
    'for a Friedmann universe: the radius of last scattering, χ_LS = √|Ω_K| ∫ da/(a²E) from z = 1089.9, agrees with an independent quadrature in ln(1 + z); with Ω_m = 0.315, h = 0.674 Poincaré’s space shows its first six pairs at |Ω_K| = 0.0101, of radius 29° at 0.013 and 47° at 0.02, and 22 pairs at 0.05; with Ω_m = 0.28, h = 0.70 and |Ω_K| = 0.013 the radius is 34°',
    `χ_LS(0.001) = ${L.iskyChiLS(0.001, Om, h).toFixed(5)} (independent ${indep(0.001).toFixed(5)}) · first pairs: i120 ${T.i120.toFixed(4)} · o48 ${T.o48.toFixed(4)} · t24 ${T.t24.toFixed(4)} · q8 ${T.q8.toFixed(4)} · i120 at 0.013: ${deg(a13).toFixed(1)}°, at 0.02: ${deg(a20).toFixed(1)}°, at 0.05: ${a50.length / 2} pairs · (0.28, 0.70, 0.013): ${deg(lit).toFixed(1)}°`); }

{ const need = ['vec4 qmul(vec4 a,vec4 b){ return vec4(a.x*b.x-a.y*b.y-a.z*b.z-a.w*b.w, a.x*b.y+a.y*b.x+a.z*b.w-a.w*b.z, a.x*b.z-a.y*b.w+a.z*b.x+a.w*b.y, a.x*b.w+a.y*b.z-a.z*b.y+a.w*b.x); }',
    'float fieldAt(vec4 p){ float s=0.0; for(int k=0;k<120;k++){ if(k>=uNG) break; vec4 q=qmul(texelFetch(uGrp,ivec2(k,0),0),p); for(int j=0;j<6;j++) s+=uMp[j].y*cos(uMp[j].x*dot(uMn[j],q)+uMp[j].z); } return s/sqrt(float(uNG)); }',
    'fieldAt(cos(uChiLS)*uO+sin(uChiLS)*d)', 'float w=abs(dot(d,texelFetch(uGrp,ivec2(k,1),0))-c)/max(0.05,sqrt(1.0-c*c));', 'function iskyCmbSync(O,P){', 'iskyTopoSync(O,P); iskyCmbSync(O,P);', "${P.model==='static'&&!iskyMysteryOn()?iskyCmbPanel(P):''}", "R.querySelectorAll('[data-iskycmb]')",
    'globalThis.HCC_CIRCLES=Object.freeze({', "{id:'iskyCircles427', kind:'found'", "name:'matched_circle_pairs'"];
  const miss = need.filter(s => !src.includes(s));
  /* the shader's product is iskyQmul: the same four lines, component for component */
  const js = (a, b) => [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2], a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
  const P = L.iskyPoints(40, 8), same = P.every((p, i) => js(p, P[(i + 7) % 40]).every((x, j) => x === L.iskyQmul(p, P[(i + 7) % 40])[j]));
  const M = await import(path.join(ROOT, 'core/atlas/instruments.mjs')), f = M.INSTRUMENTS.skytopo, a = f ? f({ space_order: 120, topo_curvature: 0.013 }) : {}, b = f ? f({ space_order: 120, topo_curvature: 0.001 }) : {}, c = f ? f({ space_order: 2, topo_curvature: 0.5 }) : {};
  const ok = !miss.length && same && a.matched_circle_pairs === 6 && Math.abs(a.largest_circle_radius - 29.3) < 0.2 && b.matched_circle_pairs === 0 && b.largest_circle_radius === null && c.matched_circle_pairs === 0;
  check(ok, 'the picture is the same field, and the layer is in the page: the shader multiplies quaternions by the four lines of the page’s own product and sums the same six waves over the group it reads from a texture; the panel, the ledger and the agent handle are there — and the instrument, with no browser, counts six pairs of 29° for Poincaré’s space at |Ω_K| = 0.013 and none at 0.001',
    `skytopo(120, 0.013): ${a.matched_circle_pairs} pairs of ${a.largest_circle_radius?.toFixed(1)}° · (120, 0.001): ${b.matched_circle_pairs} · (2, 0.5): ${c.matched_circle_pairs}${miss.length ? ' · missing ' + miss.map(x => x.slice(0, 40)).join(' | ') : ''}`); }

{ const first = k => { const g = G[k], P = L.iskyPoints(6, 60), n = L.iskyPoints(1, 61)[0]; for (let d = 1; d <= 14; d++) { const v = P.map(p => L.iskyMonomialAverage(g, n, d, p)), sc = Math.max(1e-300, ...v.map(Math.abs));
      if (Math.max(...v) - Math.min(...v) > 1e-9 * Math.max(1, sc) && Math.max(...v) - Math.min(...v) > 1e-12) return d; } return null; };
  const F = Object.fromEntries(['rp3', 'q8', 't24', 'o48', 'i120'].map(k => [k, first(k)])), g = G.i120, n = L.iskyPoints(1, 61)[0], P = L.iskyPoints(6, 60);
  const flat = [2, 4, 6, 8, 10].map(d => { const v = P.map(p => L.iskyMonomialAverage(g, n, d, p)); return Math.max(...v) - Math.min(...v); }), v12 = P.map(p => L.iskyMonomialAverage(g, n, 12, p));
  check(F.i120 === 12 && F.o48 === 8 && F.t24 === 6 && F.q8 === 4 && F.rp3 === 2 && Math.max(...flat) < 1e-14 && Math.max(...v12) - Math.min(...v12) > 1e-6,
    'found on the way — the missing low modes: averaged over the 120 elements of the binary icosahedral group, the monomial (n·p)^d takes the same value at every point of the sphere for every d up to 11 and stops doing so at d = 12; the first degree at which an average depends on the point is 12 for Poincaré’s space, 8 for the octahedral, 6 for the tetrahedral, 4 for the quaternion space and 2 for projective space — Klein’s invariant degrees, found here by brute force — so a field smoother than that has no way to differ from a constant there',
    `first degree with a non-constant average: ${Object.entries(F).map(([k, d]) => `${k} ${d}`).join(' · ')} · i120, d = 2…10: spread ≤ ${Math.max(...flat).toExponential(1)} · d = 12: spread ${(Math.max(...v12) - Math.min(...v12)).toExponential(2)}`); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
