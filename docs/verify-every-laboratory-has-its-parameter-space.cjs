#!/usr/bin/env node
'use strict';
/* ══ EVERY LABORATORY HAS ITS PARAMETER SPACE ══════════════════════════════════
 * One explorer serves every computational laboratory: any output over any two inputs as
 * a surface, the power law it obeys when it obeys one, the full Jacobian at a point, and
 * bus doors that carry the value on. This file runs THE SAME CODE the reader runs — the
 * grid, the fit and the fraction reader are extracted into core/atlas/extracted.mjs —
 * against the atlas's own physics kernels, and checks:
 *   1. the grid never leaves a declared domain: every one of the atlas's declared numeric
 *      domains, sampled at 41 points, stays inside [min, max] — exp(ln min) can land one
 *      ulp below min, and the contract would refuse the edge as if it were a wall
 *   2. the law is FOUND, not typed: the Jeans mass over temperature × density, evaluated
 *      by the atlas's own kernel, fits T^(3/2) n^(−1/2) with r² = 1 and the fraction
 *      reader prints "3/2" and "−1/2"; the Jeans length gives 1/2 and −1/2
 *   3. and it is not claimed where there is none: Planck's radiance over λ × T is
 *      fitted, and the explorer reports r² far below 1 — the surface bends at Wien's peak
 *   4. a fraction is read only when it is one: 1.633 is not 5/3
 *   5. the wiring: every laboratory with an instrument opens its parameter space from its
 *      own Controls, the palette and the navigator reach it, answers come only through
 *      HCC_API.evaluate, the Jacobian is the central ln–ln difference, and a bus door
 *      carries the value with its conversion and refuses it outside the next domain
 *   6. MUTATIONS: an unclamped grid, a fit with its exponents swapped, and a fraction
 *      reader with a loose tolerance are each caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { pspAt, pspLog, pspFit, pspFrac, pspTof, jeansMass, jeansLength, bbPlanck } = K;

  /* 1 · every declared domain in the atlas, sampled the way the explorer samples it */
  const doms = [...SRC.matchAll(/type:'number'[^{}]*?min:([-0-9.e+]+), max:([-0-9.e+]+)/g)].map(m => ({ min: +m[1], max: +m[2] })).filter(f => Number.isFinite(f.min) && Number.isFinite(f.max) && f.max > f.min);
  const inside = at => { let bad = 0; for (const f of doms) for (let i = 0; i < 41; i++) { const v = at(f, i / 40); if (!(v >= f.min && v <= f.max)) bad++; } return bad; };
  ok('the grid never leaves a declared domain: every declared numeric domain of the atlas, at 41 points each, stays inside [min, max]',
    doms.length > 300 && inside(pspAt) === 0 && doms.every(f => pspAt(f, 0) === f.min && pspAt(f, 1) === f.max),
    `${doms.length} declared domains · ${doms.filter(pspLog).length} of them logarithmic · 0 samples outside`);
  const rt = doms.filter(pspLog).slice(0, 50).every(f => Math.abs(pspTof(f, pspAt(f, 0.37)) - 0.37) < 1e-9);
  ok('and position and value invert each other, so the bead sits where its value says', rt);

  /* 2 · the Jeans law, from the atlas's own kernel */
  const JB = SRC.slice(SRC.indexOf("{id:'jeans', lab:'jeans'"), SRC.indexOf("{id:'jeans', lab:'jeans'") + 4000);
  const spec = n => { const m = JB.match(new RegExp(`\\{name:'${n}', type:'number', unit:'[^']*', default:[^,]+, min:([-0-9.e+]+), max:([-0-9.e+]+)`)); return m ? { min: +m[1], max: +m[2] } : null; };
  const fT = spec('temperature'), fN = spec('number_density');
  const grid = (fx, fy, fn, N = 21) => { const G = { N, NY: N, xv: [], yv: [], z: [], xlog: pspLog(fx), ylog: pspLog(fy), zlog: true };
    for (let i = 0; i < N; i++) { G.xv.push(pspAt(fx, i / (N - 1))); G.yv.push(pspAt(fy, i / (N - 1))); }
    for (let i = 0; i < N; i++) { G.z.push([]); for (let j = 0; j < N; j++) { const z = fn(G.xv[i], G.yv[j]); G.z[i].push(Number.isFinite(z) && z > 0 ? z : null); } } return G; };
  const J = pspFit(grid(fT, fN, (T, n) => jeansMass(T, n, 2.33)));
  ok('the law is FOUND: the Jeans mass over the declared temperature × density fits T^(3/2) n^(−1/2), r² = 1, read as fractions',
    fT && fN && J && J.r2 > 0.999999 && pspFrac(J.a) === '3/2' && pspFrac(J.b) === '-1/2',
    J ? `a = ${J.a.toFixed(12)} → ${pspFrac(J.a)} · b = ${J.b.toFixed(12)} → ${pspFrac(J.b)} · r² = ${J.r2.toFixed(12)} · ${J.n} cells over T ${fT.min}–${fT.max} K, n ${fN.min}–${fN.max} m⁻³` : '');
  const Lj = pspFit(grid(fT, fN, (T, n) => jeansLength(T, n, 2.33)));
  ok('and the Jeans length comes back as T^(1/2) n^(−1/2)', Lj && pspFrac(Lj.a) === '1/2' && pspFrac(Lj.b) === '-1/2' && Lj.r2 > 0.999999,
    Lj ? `${pspFrac(Lj.a)}, ${pspFrac(Lj.b)}` : '');

  /* 3 · Planck: no power law claimed */
  const fL = { min: 1e-11, max: 0.1 }, fB = { min: 1e-3, max: 1e9 };
  /* the floor as the explorer sets it: 24 decades under the peak */
  const GP = grid(fL, fB, (l, T) => bbPlanck(l, T), 41); GP.floor = Math.max(...GP.z.flat().filter(v => v != null).map(Math.log10)) - 24;
  const P = pspFit(GP);
  const claims = s => /exact=F\.r2>0\.9999/.test(s) && /Not a single power law: the surface bends/.test(s);
  ok('Planck\'s radiance over λ × T is fitted and NOT called a power law: the surface bends at Wien\'s peak',
    P && P.r2 < 0.99 && P.maxDex > 3 && claims(SRC), P ? `r² = ${P.r2.toFixed(4)} · worst cell ${P.maxDex.toFixed(1)} decades off any single plane · ${P.n} cells above the floor` : '');

  /* 4 · fractions */
  ok('a fraction is read only when it is one: 1.5 is 3/2, −0.25 is −1/4, 1.633 is not 5/3',
    pspFrac(1.5) === '3/2' && pspFrac(-0.25) === '-1/4' && pspFrac(1.633) === null && pspFrac(4) === '4' && pspFrac(0.5 + 1e-6, 2e-5) === '1/2' && pspFrac(0.5003, 2e-5) === null);

  /* 5 · wiring */
  const wires = {
    'the laboratory\'s own Controls': /\$\{\(\(\)=>\{ try\{ return hccInstrumentFor\(V\)\?`<div class="ctlrow" style="margin-top:5px"><button class="btn" id="labPspace"/.test(SRC) && /const pb=sect\.querySelector\('#labPspace'\); if\(pb\) pb\.onclick=\(\)=>\{ try\{ hccPspaceOpen\(hccInstrumentFor\(V\)\);/.test(SRC),
    'the palette': /add\('Parameter space','every laboratory as a surface/.test(SRC),
    'the navigator': /\['⧉','Parameter space',/.test(SRC),
    'answers only through HCC_API.evaluate': /function pspEval\(id,inp\)\{ try\{ const r=HCC_API\.evaluate\(id,inp\);/.test(SRC),
    'the central ln–ln Jacobian': /row\[o\]=\{e:\(Math\.log\(b\)-Math\.log\(a\)\)\/\(Math\.log\(hi\)-Math\.log\(lo\)\),kind:'e'\}/.test(SRC),
    'a door that carries the value, converted': /cv=v!=null&&l\.converted\?v\*l\.scale:v/.test(SRC) && /if\(f&&v!==''&&\+v>=f\.min&&\+v<=f\.max\)\{ opts\.set=\{\[inp\]:\+v\};/.test(SRC) && /lies outside its declared domain/.test(SRC),
    'a slow instrument evaluated one cell at a time': /one CELL at a time against a 24 ms slice/.test(SRC) && /function pspJacobianAsync\(/.test(SRC),
  };
  const miss = Object.entries(wires).filter(([, v]) => !v).map(([k]) => k);
  ok('the wiring: Controls, palette, navigator, HCC_API.evaluate only, the ln–ln Jacobian, doors that carry and refuse, slow instruments sliced', miss.length === 0, miss.length ? 'missing: ' + miss.join(', ') : Object.keys(wires).join(' · '));
  const nInst = (SRC.match(/^ \{id:'[a-z0-9]+', lab:'/gm) || []).length;
  ok('and every numeric instrument is reachable from the explorer\'s own catalogue', /for\(const x of HCC_API\.list\(\)\)\{ const k=x\.id\|\|x; const dd=pspDesc\(k\); if\(dd&&pspNum\(dd\)\.length\) all\.push/.test(SRC) && nInst > 20, `${nInst} lab-bound specs declared in this form alone`);

  /* 6 · mutations */
  const unclamped = (f, t) => pspLog(f) ? Math.exp(Math.log(f.min) + t * (Math.log(f.max) - Math.log(f.min))) : f.min + t * (f.max - f.min);
  const outside = inside(unclamped);
  ok('MUTATION — an unclamped grid is caught: it leaves the declared domain', outside > 0, `${outside} samples outside [min, max] without the clamp`);
  const swapped = G => { const F = pspFit(G); return F && { ...F, a: F.b, b: F.a }; };
  const Js = swapped(grid(fT, fN, (T, n) => jeansMass(T, n, 2.33)));
  ok('MUTATION — a fit with its exponents swapped is caught', !(pspFrac(Js.a) === '3/2' && pspFrac(Js.b) === '-1/2'));
  const loose = a => { for (let q = 1; q <= 6; q++) { const p = Math.round(a * q); if (Math.abs(a - p / q) < 0.05) return q === 1 ? String(p) : `${p}/${q}`; } return null; };
  ok('MUTATION — a fraction reader with a loose tolerance is caught', loose(1.633) !== null && pspFrac(1.633) === null);

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
