/* THE SHAPE OF A CLOSED UNIVERSE (v4.426) — the spherical space forms S³/Γ seen from inside. The mathematics is two blocks of pure
   functions (SKY-MATH and TOPO-MATH), lifted out of index.html and run here as they stand.
     1. the groups close from their generators to orders 1, 2, 8, 24, 48 and 120, and are groups;
     2. every element is a Clifford translation: it moves every point by arccos(Re g) and fixes none — nearest copies at π … π/5;
     3. the space looks the same from everywhere, and an observer and any of its copies see the same sky;
     4. the volume is 2π²/|Γ|, measured by counting random points nearer the identity than any other element;
     5. the curvature at which our horizon would reach half-way to the nearest copy;
     6. the shader reads the copies with the same closed form, and the layer reaches the panel, the ledger and the instruments.
   NOT checked here: any pixel, and any observation — no map of the sky is fitted and no matched-circle search is reproduced. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error('block not found: ' + a); return src.slice(i, j); };
const L = new Function(`${cut('/* ═══ SKY-MATH-BEGIN ═══', '/* ═══ SKY-MATH-END ═══')}\n${cut('/* ═══ TOPO-MATH-BEGIN ═══', '/* ═══ TOPO-MATH-END ═══')}
  return {iskyDot,iskyUnit,iskyHit,iskyPoints,iskyRng,iskyHorizon,iskyCurvatureFor,iskyQmul,ISKY_SPACES,iskyGroupOf,iskyNearestCopy,iskyCopies};`)();
const KEYS = Object.keys(L.ISKY_SPACES), G = Object.fromEntries(KEYS.map(k => [k, L.iskyGroupOf(k)])), id = q => q.map(x => Math.round(x * 1e6)).join(','), conj = q => [q[0], -q[1], -q[2], -q[3]];
const R = L.iskyRng(426), tangentAt = o => { const d = L.iskyPoints(1, Math.floor(R() * 1e9))[0], p = L.iskyDot(d, o); return L.iskyUnit(d.map((x, i) => x - p * o[i])); };

{ let ok = true; const rows = [];
  for (const k of KEYS) { const g = G[k], S = new Set(g.map(id)); let closed = true, inv = true, unit = true;
    for (const a of g) { if (Math.abs(L.iskyDot(a, a) - 1) > 1e-12) unit = false; if (!S.has(id(conj(a)))) inv = false; for (const b of g) if (!S.has(id(L.iskyQmul(a, b)))) closed = false; }
    const good = g.length === L.ISKY_SPACES[k].order && S.size === g.length && closed && inv && unit && id(g[0]) === '1000000,0,0,0' && (g.length === 1 || S.has(id([-1, 0, 0, 0])));
    ok = ok && good; rows.push(`${k}: ${g.length}${good ? '' : ' ✗'}`); }
  check(ok && KEYS.length === 6, 'the groups are generated, not tabulated: closing the quaternion generators under multiplication gives exactly 1, 2, 8, 24, 48 and 120 unit quaternions — the last the binary icosahedral group of Poincaré’s dodecahedral space — each set closed under products and inverses, the identity first, and −1 in every one but the trivial group',
    rows.join(' · ')); }

{ let worst = 0, fixed = 0, n = 0; const want = { s3: 2, rp3: 1, q8: 1 / 2, t24: 1 / 3, o48: 1 / 4, i120: 1 / 5 }, got = {};
  for (const k of KEYS) { got[k] = L.iskyNearestCopy(G[k]) / Math.PI; for (const g of G[k].slice(1)) for (const q of L.iskyPoints(20, 7 + n)) { n++; const d = Math.acos(Math.max(-1, Math.min(1, L.iskyDot(q, L.iskyQmul(g, q)))));
      worst = Math.max(worst, Math.abs(d - Math.acos(Math.max(-1, Math.min(1, g[0]))))); if (d < 1e-9) fixed++; } }
  check(worst < 1e-7 && fixed === 0 && KEYS.every(k => Math.abs(got[k] - want[k]) < 1e-12), 'every element is a Clifford translation: left multiplication by g moves each of twenty random points of the sphere by the same angle arccos(Re g), and none stays where it was — so the quotient is a smooth closed space; the nearest copy of any point, yourself included, is at π, π/2, π/3, π/4 and π/5',
    `${n} point–element pairs · worst departure from arccos(Re g) ${worst.toExponential(1)} · fixed points ${fixed} · nearest copy / π: ${KEYS.map(k => got[k].toFixed(4)).join(', ')}`); }

{ let bad = 0, n = 0, multi = 0; const g = G.i120, bodies = L.iskyPoints(4, 99).map((c, i) => ({ c, r: 0.05 + 0.01 * i })), all = bodies.flatMap(b => L.iskyCopies(g, b.c).map(c => ({ c, r: b.r })));
  const first = (o, d) => { let best = null, hits = 0; for (let k = 0; k < all.length; k++) { const h = L.iskyHit(o, d, all[k].c, all[k].r); if (h) { hits++; if (!best || h.t < best.t) best = { t: h.t, b: Math.floor(k / g.length) }; } } return [best, hits]; };
  for (let k = 0; k < 400; k++) { const o = L.iskyPoints(1, 1000 + k)[0], d = tangentAt(o), h = g[1 + (k % 119)], [a, hits] = first(o, d), [b] = first(L.iskyQmul(h, o), L.iskyQmul(h, d)); n++; if (hits > 1) multi++;
    if (!!a !== !!b || (a && (Math.abs(a.t - b.t) > 1e-9 || a.b !== b.b))) bad++; }
  check(bad === 0 && multi > 100, 'an observer and its copies see the same sky: in Poincaré’s space, with four bodies and their 480 copies, the first body met along a random line of sight from o is the same body at the same path length as along the carried line from g·o, for every g tried — which is what it means for the picture to be of S³/Γ and not of a sphere with 480 things in it; and most lines of sight cross more than one copy',
    `${n} lines of sight · disagreements ${bad} · lines crossing more than one copy ${multi}`); }

{ const rows = []; let ok = true;
  for (const k of ['rp3', 'q8', 't24', 'o48', 'i120']) { const g = G[k], P = L.iskyPoints(60000, 4260 + g.length); let inside = 0;
    for (const q of P) { let near = true; for (let j = 1; j < g.length && near; j++) if (L.iskyDot(q, g[j]) > q[0]) near = false; if (near) inside++; }
    const f = inside / P.length, e = 1 / g.length, sig = Math.sqrt(e * (1 - e) / P.length); ok = ok && Math.abs(f - e) < 4 * sig; rows.push(`${k}: ${(f * g.length).toFixed(3)}/|Γ|`); }
  check(ok, 'the volume is 2π²/|Γ|: of sixty thousand random points of the sphere, the fraction nearer the identity than any other element of Γ — the fundamental cell about the observer — is 1/|Γ| within four standard errors for all five spaces; Poincaré’s space has 1/120 of the sphere, 0.1645 in units of the curvature radius cubed',
    rows.join(' · ') + ` · 2π²/120 = ${(2 * Math.PI * Math.PI / 120).toFixed(4)}`); }

{ const Om = 0.315, h = 0.674, T = Object.fromEntries(KEYS.slice(1).map(k => [k, L.iskyCurvatureFor(L.iskyNearestCopy(G[k]) / 2, Om, h)]));
  const back = KEYS.slice(1).every(k => Math.abs(L.iskyHorizon(T[k], Om, h) - L.iskyNearestCopy(G[k]) / 2) < 1e-9), order = T.i120 < T.o48 && T.o48 < T.t24 && T.t24 < T.q8 && T.q8 < T.rp3;
  const now = L.iskyHorizon(0.001, Om, h) / (L.iskyNearestCopy(G.i120) / 2);
  check(back && order && Math.abs(T.i120 - 0.0097) < 2e-4 && Math.abs(T.rp3 - 0.218) < 2e-3 && Math.abs(T.q8 - 0.0593) < 5e-4 && now > 0.31 && now < 0.33,
    'for our sky: a copy can be in view only if the horizon reaches half-way to it. With Ω_m = 0.315, h = 0.674 and the particle horizon taken for the last-scattering radius, that needs |Ω_K| ≥ 0.0097 in Poincaré’s space (Ω_tot ≥ 1.0097), more for every larger space, 0.218 for projective space; at |Ω_K| = 0.001 the horizon reaches 32 % of the half-distance even in the smallest of them',
    `thresholds |Ω_K|: ${KEYS.slice(1).map(k => `${k} ${T[k].toFixed(4)}`).join(' · ')} · at 0.001: horizon / half-distance = ${now.toFixed(3)}`); }

{ const need = ['uniform highp sampler2D uImg; uniform int uNI;', 'for(int k=0;k<960;k++){ if(k>=uNI) break; vec4 c=texelFetch(uImg,ivec2(k,0),0), m=texelFetch(uImg,ivec2(k,1),0);', 'if(t<best){ best=t; bi=int(m.y+0.5); dep=dl; rr=r; cHit=c; }', 'vec4 c=cHit; vec4 q=',
    'function iskyTopoSync(O,P){', 'iskyTopoSync(O,P);', "chip('iskyspace',k,P.space===k,", "R.querySelectorAll('[data-iskyspace]')", 'globalThis.HCC_TOPOLOGY=Object.freeze({', "id:'skytopo', world:'s3', lab:'s3sky'", "{id:'iskyTopology426', kind:'found'"];
  const miss = need.filter(s => !src.includes(s));
  const M = await import(path.join(ROOT, 'core/atlas/instruments.mjs')), f = M.INSTRUMENTS.skytopo, a = f ? f({ space_order: 120, topo_curvature: 0.001 }) : {}, b = f ? f({ space_order: 7, topo_curvature: 0.001 }) : {};
  const ok = !miss.length && Math.abs(a.nearest_copy_angle - Math.PI / 5) < 1e-12 && Math.abs(a.space_volume - 2 * Math.PI * Math.PI / 120) < 1e-12 && Math.abs(a.copy_curvature_threshold - 0.0097) < 2e-4 && a.horizon_over_half_copy < 1 && b.nearest_copy_angle === null && typeof b.refused === 'string';
  check(ok, 'the picture is the same formula over the copies, and the layer is in the page: the static shader reads each copy g·c from a float texture and enters it by the closed form of the sky laboratory; the panel offers the six spaces, the ledger records the finding, the agent handle answers — and the instrument runs with no browser, refusing an order that is not one of the six',
    `skytopo(120, 0.001): nearest ${(a.nearest_copy_angle / Math.PI)?.toFixed(3)}π · volume ${a.space_volume?.toFixed(4)} · threshold ${a.copy_curvature_threshold?.toFixed(4)} · horizon/half-copy ${a.horizon_over_half_copy?.toFixed(3)} · order 7: ${b.refused || 'not refused'}${miss.length ? ' · missing ' + miss.join(' | ') : ''}`); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
