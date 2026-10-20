#!/usr/bin/env node
'use strict';
/* ══ THE CATALOGUE OF LENS SPACES (v4.397) ═══════════════════════════════════════════════════════════════════════════════
 * Every L(p,q) for one p, after the COMPACT collaboration's CMB-for-S3 (Martin Barandiaran & Petretti 2026; "Cosmic
 * topology. Part IId", arXiv:2610.12418) — written in the page independently (that repository carries no licence) and
 * checked here by running the page's own pure code:
 *   1. the classes: L(p,q) ≅ L(p,q′) iff q′ ≡ ±q^{±1} (mod p). For every p ≤ 120 the classes partition (ℤ/p)ˣ, each is
 *      closed under q ↦ −q and q ↦ q⁻¹, their number is Burnside's (φ(p) + #{q² ≡ 1} + #{q² ≡ −1} + #{2q ≡ 0})/4, two q's
 *      share a class exactly when COMPACT's test (q₁ ≡ ±q₂ or q₁q₂ ≡ ±1) says so, the classes besides L(p,1) are exactly
 *      what COMPACT's get_unique lists, and the classical counts stand (p = 5: 2, p = 7: 2, p = 13: 4)
 *   2. the harmonics: the kept multiplicity is the selection rule (q+1)m_L ≡ (q−1)m_R (mod 2p) — equal to the causal-memory
 *      laboratory's own pair list and to the space-form laboratory's character sums for L(p,1); homeomorphic lens spaces are
 *      isospectral (every class, p ≤ 40, n ≤ 24); and Weyl's law: what is kept up to n tends to 1/p of S³'s
 *   3. the nearest clone: d_nc = min_j arccos(u cos(2πj/p) + (1 − u) cos(2πqj/p)) is the shortest distance from the observer
 *      x = (√u, 0, √(1−u), 0) to its images g^j x under the deck generator (e^{2πi/p}, e^{2πiq/p}), computed in ℝ⁴; it is
 *      2π/p for every observer of L(p,1) and at both ends u = 0, 1 of every L(p,q); u ↦ 1 − u carries L(p,q) to L(p,q⁻¹)
 *   4. the laboratory draws exactly that: the landscape's heights are d_nc/(2π/p), its plane 2χ_LSS/R; the panel, the
 *      grip, the visibility and the HUD are wired; the words cite the source and say what this is not
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const fn = name => { const i = SRC.indexOf('function ' + name + '('); if (i < 0) throw new Error('no function ' + name); let d = 0, j = SRC.indexOf('{', i);
  for (let k = j; k < SRC.length; k++) { const c = SRC[k]; if (c === '{') d++; else if (c === '}') { d--; if (!d) return SRC.slice(i, k + 1); } } throw new Error('unbalanced ' + name); };
const line = (re, what) => { const m = SRC.match(re); if (!m) throw new Error('not found: ' + what); return m[0]; };
try {
  const K = new Function([line(/const lpqMod=[^\n]*\n/, 'lpqMod'), line(/const lpqCosD=[^\n]*\n/, 'lpqCosD'), line(/const lensGcd=[^\n]*\n/, 'lensGcd'), fn('lensInv'), fn('lensClasses'), fn('lensCountBurnside'), fn('lensMult'),
    fn('lensDnc'), fn('lensDncRange'), fn('lensFirstMode'), line(/const chmMod=[^\n]*\n/, 'chmMod'), fn('chmLensPairs'), 'return {lpqMod,lpqCosD,lensGcd,lensInv,lensClasses,lensCountBurnside,lensMult,lensDnc,lensDncRange,lensFirstMode,chmLensPairs};'].join('\n'))();
  const md = K.lpqMod, gcd = (a, b) => { while (b) { [a, b] = [b, a % b]; } return a; };
  /* 1 */
  { let part = 0, closed = 0, burn = 0, compact = 0, uniq = 0, inv = 0;
    for (let p = 2; p <= 120; p++) { const C = K.lensClasses(p), units = []; for (let q = 1; q < Math.max(2, p); q++) if (gcd(q, p) === 1) units.push(q);
      const seen = new Map(); C.forEach((c, i) => c.cls.forEach(q => seen.set(q, (seen.get(q) || 0) + 1)));
      if (units.some(q => seen.get(q % p) !== 1) || [...seen.keys()].some(q => !units.includes(q) && !(p <= 2))) part++;
      for (const c of C) for (const q of c.cls) { const qi = K.lensInv(q, p); if (!c.cls.includes(md(-q, p)) || (qi != null && !c.cls.includes(qi))) closed++; if (qi != null && md(q * qi, p) !== 1 % p) inv++; }
      if (C.length !== K.lensCountBurnside(p)) burn++;
      /* COMPACT's is_homeomorphic, restated from its documentation: q1 ≡ ±q2 or q1·q2 ≡ ±1 (mod p) */
      const homeo = (a, b) => a === md(b, p) || a === md(-b, p) || md(a * b, p) === 1 % p || md(a * b, p) === md(-1, p);
      const cl = q => C.findIndex(c => c.cls.includes(md(q, p)));
      for (const a of units) for (const b of units) if (homeo(a, b) !== (cl(a) === cl(b))) compact++;
      /* COMPACT's get_unique, restated: q from 2 to ⌊p/2⌋, coprime, kept unless homeomorphic to one already kept */
      if (p >= 3) { const list = []; for (let q2 = 2; q2 <= Math.floor(p / 2); q2++) { if (gcd(p, q2) !== 1) continue; if (!list.some(q1 => homeo(q1, q2))) list.push(q2); } if (list.length !== C.length - 1) uniq++; } }
    const known = [K.lensClasses(5).length, K.lensClasses(7).length, K.lensClasses(13).length].join() === '2,2,4' && K.lensClasses(13).map(c => c.q).join() === '1,2,3,5';
    ok('the classes: for every p ≤ 120 they partition (ℤ/p)ˣ, are closed under −q and q⁻¹, number what Burnside counts, agree pair by pair with COMPACT’s homeomorphism test and with its get_unique, and the classical counts stand',
      part === 0 && closed === 0 && burn === 0 && compact === 0 && uniq === 0 && inv === 0 && known,
      `partition ${part ? part + ' off' : '✓'} · closure ${closed ? closed + ' off' : '✓'} · Burnside ${burn ? burn + ' off' : '✓'} · pairwise test ${compact ? compact + ' off' : '✓'} · get_unique ${uniq ? uniq + ' off' : '✓'} · p = 5, 7, 13: ${K.lensClasses(5).length}, ${K.lensClasses(7).length}, ${K.lensClasses(13).length} (L(13,q): q = ${K.lensClasses(13).map(c => c.q).join(', ')})`); }
  /* 2 */
  { let pairs = 0, iso = 0, sg = 0; for (let p = 2; p <= 30; p++) for (let q = 1; q < Math.max(2, p); q++) { if (gcd(q, p) !== 1) continue; for (let n = 0; n <= 20; n++) if (K.lensMult(n, p, q) !== K.chmLensPairs(n, p, q).length) pairs++; }
    for (let p = 3; p <= 40; p++) for (const c of K.lensClasses(p)) for (let n = 0; n <= 24; n++) { const m0 = K.lensMult(n, p, c.cls[0]); for (const q of c.cls) if (K.lensMult(n, p, q) !== m0) iso++; }
    /* L(p,1): the space-form laboratory's character sums */
    const sgSrc = ['function sgChi(', 'function sgGroup(', 'function sgInvariantDim(', 'function sgSpectrum('].map(nm => fn(nm.slice(9, -1))).join('\n');
    const G = new Function(SRC.slice(SRC.indexOf('const SG_GROUPS=Object.freeze('), SRC.indexOf('function sgChi(')) + sgSrc + '\nreturn {sgSpectrum};')();
    for (const [id, p] of [['L5', 5], ['L12', 12], ['L60', 60]]) { const s = G.sgSpectrum(id, 40); for (let n = 0; n <= 40; n++) if (K.lensMult(n, p, 1) !== s[n].mult) sg++; }
    let weyl = 0; for (const [p, q] of [[5, 2], [13, 5], [65, 8], [97, 22]]) { let num = 0, den = 0; for (let n = 0; n <= 200; n++) { num += K.lensMult(n, p, q); den += (n + 1) * (n + 1); } weyl = Math.max(weyl, Math.abs(num / den * p - 1)); }
    ok('the harmonics: the kept multiplicity is the selection rule — the causal-memory laboratory’s pair list for p ≤ 30, the space-form laboratory’s character sums for L(5,1), L(12,1), L(60,1) — homeomorphic lens spaces are isospectral, and Weyl’s law holds',
      pairs === 0 && iso === 0 && sg === 0 && weyl < 0.02, `pair lists ${pairs ? pairs + ' off' : 'equal'} · isospectral classes p ≤ 40, n ≤ 24 ${iso ? iso + ' off' : '✓'} · character sums ${sg ? sg + ' off' : 'equal'} · Weyl to n = 200 within ${(100 * weyl).toFixed(2)}%`); }
  /* 3 */
  { let deck = 0, hom = 0, ends = 0, swap = 0, neg = 0;
    for (const [p, q] of [[5, 2], [7, 3], [13, 5], [65, 8], [65, 18], [97, 22], [120, 7]]) { const qi = K.lensInv(q, p);
      for (let i = 0; i <= 40; i++) { const u = i / 40, x = [Math.sqrt(u), 0, Math.sqrt(1 - u), 0]; let m = Infinity;
        for (let j = 1; j < p; j++) { const A = 2 * Math.PI * j / p, B = 2 * Math.PI * q * j / p, y = [Math.sqrt(u) * Math.cos(A), Math.sqrt(u) * Math.sin(A), Math.sqrt(1 - u) * Math.cos(B), Math.sqrt(1 - u) * Math.sin(B)];
          m = Math.min(m, Math.acos(Math.max(-1, Math.min(1, x[0] * y[0] + x[1] * y[1] + x[2] * y[2] + x[3] * y[3])))); }
        deck = Math.max(deck, Math.abs(m - K.lensDnc(p, q, u))); swap = Math.max(swap, Math.abs(K.lensDnc(p, q, u) - K.lensDnc(p, qi, 1 - u))); neg = Math.max(neg, Math.abs(K.lensDnc(p, q, u) - K.lensDnc(p, md(-q, p), u))); }
      ends = Math.max(ends, Math.abs(K.lensDnc(p, q, 0) - 2 * Math.PI / p), Math.abs(K.lensDnc(p, q, 1) - 2 * Math.PI / p)); }
    for (const p of [5, 12, 65, 120]) for (let i = 0; i <= 20; i++) hom = Math.max(hom, Math.abs(K.lensDnc(p, 1, i / 20) - 2 * Math.PI / p), Math.abs(K.lensDnc(p, p - 1, i / 20) - 2 * Math.PI / p));
    const r = K.lensDncRange(65, 8, 240), compactForm = /const lpqCosD=\(p,q,u,j\)=>u\*Math\.cos\(2\*Math\.PI\*j\/p\)\+\(1-u\)\*Math\.cos\(2\*Math\.PI\*q\*j\/p\);/.test(SRC);
    ok('the nearest clone: d_nc is the shortest distance from the observer to its images under the deck generator, computed in ℝ⁴; it is 2π/p for every observer of L(p,1) and at both ends of every L(p,q); u ↦ 1 − u carries L(p,q) to L(p,q⁻¹)',
      deck < 1e-12 && hom < 1e-12 && ends < 1e-12 && swap < 1e-12 && neg < 1e-12 && compactForm && r.hi > 2 * Math.PI / 65,
      `deck group ${deck.toExponential(1)} · L(p,1) flat ${hom.toExponential(1)} · ends ${ends.toExponential(1)} · q → q⁻¹ with u → 1 − u ${swap.toExponential(1)} · q → −q ${neg.toExponential(1)} · L(65,8): ${(r.lo * 65 / (2 * Math.PI)).toFixed(3)} … ${(r.hi * 65 / (2 * Math.PI)).toFixed(3)} × 2π/p, the farthest at u = ${r.uHi.toFixed(3)}`); }
  /* 4 */
  { const build = fn('lensCatBuild'), tick = fn('lensCatTick');
    const draws = /h\.push\(lensDnc\(p,c\.q,i\/NU\)\/unit\)/.test(build) && /thr=2\*chiS\/unit/.test(build) && /chiS=sgChiLss\(\)\/R/.test(build) && /const dn=lensDnc\(O\.p,c\.q,u\), h=dn\/O\.unit;/.test(tick) && /see=dn<2\*O\.chiS/.test(tick);
    const wired = SRC.includes('${lensCatPanelHTML()}') && SRC.includes('lpqBind(ctl); lensCatBind(ctl);') && /hccGrip\(\{ id:'lenscat'/.test(SRC)
      && SRC.includes("sgGroupNode.visible = (v==='s3gamma')&&!state.lc3d; lensCatNode.visible = (v==='s3gamma')&&!!state.lc3d;") && /function updateSg\(dt\)\{ lensCatVisibility\(\); if\(state\.lc3d\)\{ lensCatTick\(dt\); return; \}/.test(SRC);
    const words = SRC.includes('Cosmic topology IId, arXiv:2610.12418') && SRC.includes('That repository carries no licence, so none of its code is copied') && SRC.includes('not a forecast of the microwave sky')
      && SRC.includes("after COMPACT’s CMB-for-S3 (arXiv:2610.12418)") && /Burnside, from the four-group \{q, −q, q⁻¹, −q⁻¹\} alone/.test(SRC);
    ok('the laboratory draws exactly that — heights d_nc/(2π/p), the plane 2χ_LSS/R — and the panel, the grip, the visibility and the HUD are wired; the words cite the source and say what this is not',
      draws && wired && words, `draws ${draws ? '✓' : '✗'} · wired ${wired ? '✓' : '✗'} · words ${words ? '✓' : '✗'}`); }
} catch (e) { fail++; console.log('  FAIL — verifier error: ' + (e && e.stack || e)); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
