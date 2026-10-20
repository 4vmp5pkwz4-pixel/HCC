#!/usr/bin/env node
'use strict';
/* ══ THE ELEMENTS — EVERY ATOM OF THE PERIODIC TABLE, IN 3D, WHERE IT IS (v4.398) ══════════════════════════════════════
 * The descent can go into the atom of any element measured on the body it is in. Checked here by running the page's own
 * pure code:
 *   1. the table: 118 rows in order, unique symbols, names in two languages; the standard atomic weights invert exactly where
 *      nature does (Ar–K, Co–Ni, Te–I, Th–Pa) and nowhere else; the mass number drawn is the most abundant isotope's
 *   2. the configurations: Z electrons each, no subshell over 2(2l+1), the noble gases closed, and the ground states NIST
 *      tabulates — the Madelung order and its exceptions (Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag, La, Ce, Gd, Pt, Au, Ac, Th, Pa, U,
 *      Np, Cm, Lr) — for every element tested
 *   3. Slater's charges: the textbook values (O 2p 4.55, Si 3p 4.15, K 4s 2.20, Fe 3d 6.25, Fe 4s 3.75, Zn 4s 4.35,
 *      Ga 4p 5.00) and the descent's own earlier clouds (DSC_SHELLS); the radii grow down a group and shrink across a period
 *   4. the nucleus: A nucleons, Z of them protons, inside R = 1.2·A^{1/3} fm, none on top of another
 *   5. the shapes: 2l + 1 real angular functions for each l, of parity (−1)^l, mutually orthogonal on the sphere; Hund's
 *      filling puts every electron of a subshell somewhere and never three in an orbital
 *   6. the descent uses them: the atom, its inside and its nucleus are the chosen element's, the molecules give way, the
 *      strip holds the table; the words say Slater's rules are a model
 *   7. what is measured where: a sourced composition for each of the 20 bodies of the descent, in the unit its source gives;
 *      every row a real element once, a positive value, flags from the set, notes in both languages; the rows in order of
 *      abundance on one scale; the sums close where they must (crust, soils, rock, the two atmospheres); values quoted
 *      independently here agree (Asplund et al. 2021 Fe, O, C, Si; the CRC crust O, Si, Au; Galileo He/H; Huygens CH₄);
 *      Phobos and Deimos have no rows and say no element has been measured there
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const fn = name => { const i = SRC.indexOf('function ' + name + '('); if (i < 0) throw new Error('no function ' + name); let d = 0, j = SRC.indexOf('{', i);
  for (let k = j; k < SRC.length; k++) { const c = SRC[k]; if (c === '{') d++; else if (c === '}') { d--; if (!d) return SRC.slice(i, k + 1); } } throw new Error('unbalanced ' + name); };
const blk = (a, b) => { const i = SRC.indexOf(a); if (i < 0) throw new Error('missing ' + a); const j = SRC.indexOf(b, i); return SRC.slice(i, j); };
try {
  const K = new Function([blk('const PT_ROWS=Object.freeze([', 'function ptConfig('), fn('ptConfig'), blk('const PT_NOBLE=', 'function ptConfigString('), fn('ptConfigString'),
    blk('const PT_NSTAR=', 'function ptSlater('), fn('ptSlater'), blk('const PT_A0=', 'function ptRadius('), fn('ptRadius'), fn('ptShells'), fn('ptNucleus'), fn('ptPos'),
    blk('const PT_ORB=Object.freeze(', '/* a lobe surface'), fn('ptDrawnOrbitals'),
    'return {PT_ROWS,PT_MADELUNG,PT_EXCEPT,PT_L,ptConfig,ptConfigString,ptSlater,ptRadius,ptShells,ptNucleus,ptPos,PT_ORB,ptDrawnOrbitals};'].join('\n'))();
  const R = K.PT_ROWS;
  /* 1 */
  { const order = R.every((r, i) => r[0] === i + 1), uniq = new Set(R.map(r => r[1])).size === 118 && new Set(R.map(r => r[0] + ',' + R.indexOf(r))).size === 118, names = R.every(r => r[2] && r[3] && /[А-Яа-яЁё]/.test(r[3]));
    const std = R.filter(r => !/^\[/.test(r[4])).map(r => [r[0], r[1], +r[4]]); const inv = []; for (let i = 1; i < std.length; i++) if (std[i][2] < std[i - 1][2] && std[i][0] === std[i - 1][0] + 1) inv.push(std[i - 1][1] + '–' + std[i][1]);
    /* the most abundant isotope may sit up to ~2.5 from the mean weight where many isotopes share it (Mo-98 at 95.95, Te-130 at 127.60) */
    const known = { 1: 1, 2: 4, 8: 16, 14: 28, 26: 56, 42: 98, 48: 114, 50: 120, 52: 130, 60: 142, 62: 152, 80: 202, 82: 208, 90: 232, 92: 238 };
    const amass = R.every(r => /^\[/.test(r[4]) ? +r[4].slice(1, -1) === r[5] : Math.abs(r[5] - +r[4]) < 3) && Object.entries(known).every(([Z, A]) => R[Z - 1][5] === A);
    const pos = new Set(R.map(r => K.ptPos(r[0]).join(','))).size === 118 && K.ptPos(1).join() === '1,1' && K.ptPos(2).join() === '1,18' && K.ptPos(57).join() === '6,3' && K.ptPos(58).join() === '8,4' && K.ptPos(71).join() === '8,17' && K.ptPos(72).join() === '6,4' && K.ptPos(118).join() === '7,18' && K.ptPos(90).join() === '9,4';
    ok('the table: 118 rows in order, unique symbols, names in two languages, every element in its own cell; the standard weights invert exactly where nature does — Ar–K, Co–Ni, Te–I, Th–Pa — and the mass number drawn is the most abundant isotope (within 3 of the weight; the bracketed ones exactly)',
      order && uniq && names && inv.join() === 'Ar–K,Co–Ni,Te–I,Th–Pa' && amass && pos, `order ${order ? '✓' : '✗'} · symbols ${uniq ? '✓' : '✗'} · names ${names ? '✓' : '✗'} · inversions ${inv.join(', ')} · isotopes drawn ${amass ? '✓' : '✗'} · cells ${pos ? '✓' : '✗'}`); }
  /* 2 */
  { let count = 0, pauli = 0; for (let Z = 1; Z <= 118; Z++) { const c = K.ptConfig(Z); if (c.reduce((t, s) => t + s[2], 0) !== Z) count++; if (c.some(s => s[2] > 2 * (2 * s[1] + 1) || s[2] < 0 || s[1] >= s[0])) pauli++; }
    const closed = [2, 10, 18, 36, 54, 86, 118].every(Z => K.ptConfig(Z).every(s => s[2] === 2 * (2 * s[1] + 1)));
    const NIST = { 1: '1s¹', 6: '[He] 2s² 2p²', 24: '[Ar] 3d⁵ 4s¹', 26: '[Ar] 3d⁶ 4s²', 29: '[Ar] 3d¹⁰ 4s¹', 41: '[Kr] 4d⁴ 5s¹', 42: '[Kr] 4d⁵ 5s¹', 44: '[Kr] 4d⁷ 5s¹', 45: '[Kr] 4d⁸ 5s¹', 46: '[Kr] 4d¹⁰', 47: '[Kr] 4d¹⁰ 5s¹',
      57: '[Xe] 5d¹ 6s²', 58: '[Xe] 4f¹ 5d¹ 6s²', 63: '[Xe] 4f⁷ 6s²', 64: '[Xe] 4f⁷ 5d¹ 6s²', 70: '[Xe] 4f¹⁴ 6s²', 74: '[Xe] 4f¹⁴ 5d⁴ 6s²', 78: '[Xe] 4f¹⁴ 5d⁹ 6s¹', 79: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', 80: '[Xe] 4f¹⁴ 5d¹⁰ 6s²',
      89: '[Rn] 6d¹ 7s²', 90: '[Rn] 6d² 7s²', 91: '[Rn] 5f² 6d¹ 7s²', 92: '[Rn] 5f³ 6d¹ 7s²', 93: '[Rn] 5f⁴ 6d¹ 7s²', 94: '[Rn] 5f⁶ 7s²', 96: '[Rn] 5f⁷ 6d¹ 7s²', 103: '[Rn] 5f¹⁴ 7s² 7p¹', 118: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶' };
    const off = Object.entries(NIST).filter(([Z, want]) => K.ptConfigString(+Z) !== want).map(([Z, want]) => `${R[Z - 1][1]}: ${K.ptConfigString(+Z)} ≠ ${want}`);
    ok('the configurations: Z electrons each, no subshell past 2(2l+1), the noble gases closed, and the ground states NIST tabulates — the Madelung order with its twenty exceptions — for every element tested',
      count === 0 && pauli === 0 && closed && off.length === 0, `electrons ${count ? count + ' off' : '✓'} · Pauli ${pauli ? pauli + ' off' : '✓'} · noble gases ${closed ? '✓' : '✗'} · ${Object.keys(NIST).length} ground states ${off.length ? off.join('; ') : 'as NIST'}`); }
  /* 3 */
  { const want = [[8, 2, 1, 4.55], [14, 3, 1, 4.15], [19, 4, 0, 2.20], [26, 3, 2, 6.25], [26, 4, 0, 3.75], [30, 4, 0, 4.35], [31, 4, 1, 5.00], [8, 1, 0, 7.70], [14, 1, 0, 13.70], [14, 2, 1, 9.85], [11, 3, 0, 2.20], [17, 3, 1, 6.10]];
    const off = want.filter(([Z, n, l, z]) => Math.abs(K.ptSlater(Z, n, l) - z) > 1e-9).map(([Z, n, l, z]) => `${R[Z - 1][1]} ${n}${'spdf'[l]} ${K.ptSlater(Z, n, l).toFixed(2)} ≠ ${z}`);
    const grp = [3, 11, 19, 37, 55], per = [3, 4, 5, 6, 7, 8, 9, 10], rv = Z => K.ptShells(Z).slice(-1)[0].r;
    const down = grp.every((Z, i) => i === 0 || rv(Z) > rv(grp[i - 1])), across = per.every((Z, i) => i === 0 || rv(Z) < rv(per[i - 1])), h = Math.abs(K.ptRadius(1, 1, 0) - 52.9177210903) < 1e-9;
    ok('Slater’s charges are the textbook ones and the descent’s own; the radii grow down a group and shrink across a period, and hydrogen’s is the Bohr radius',
      off.length === 0 && down && across && h, `${want.length} charges ${off.length ? off.join('; ') : '✓'} · down Li → Cs ${down ? '✓' : '✗'} (${grp.map(z => rv(z).toFixed(0)).join(' < ')} pm) · across Li → Ne ${across ? '✓' : '✗'} · r(H) = a₀ ${h ? '✓' : '✗'}`); }
  /* 4 */
  { let bad = 0; for (const Z of [1, 2, 8, 26, 79, 92, 118]) { const N = K.ptNucleus(Z), A = R[Z - 1][5]; if (N.nucleons.length !== A || N.nucleons.filter(x => x.proton).length !== Z || N.N !== A - Z || Math.abs(N.R - 1.2 * Math.cbrt(A)) > 1e-12) bad++;
      if (N.nucleons.some(x => Math.hypot(...x.p) > N.R + 1e-9)) bad++; let close = Infinity; for (let i = 0; i < N.nucleons.length; i++) for (let j = i + 1; j < N.nucleons.length; j++) close = Math.min(close, Math.hypot(...N.nucleons[i].p.map((v, k) => v - N.nucleons[j].p[k]))); if (A > 1 && !(close > 0.3)) bad++; }
    ok('the nucleus: A nucleons, Z of them protons, inside R = 1.2·A^{1/3} fm, none on top of another — from hydrogen to oganesson', bad === 0, bad ? `${bad} off` : '¹H, ⁴He, ¹⁶O, ⁵⁶Fe, ¹⁹⁷Au, ²³⁸U, ²⁹⁴Og'); }
  /* 5 */
  { let worst = 0, par = 0, cnt = 0; const M = 6000, pts = []; for (let i = 0; i < M; i++) { const y = 1 - 2 * (i + 0.5) / M, s = Math.sqrt(1 - y * y), t = i * 2.399963229728653; pts.push([s * Math.cos(t), y, s * Math.sin(t)]); }
    for (let l = 0; l <= 3; l++) { const F = K.PT_ORB[l]; if (F.length !== 2 * l + 1) cnt++;
      for (const [, f] of F) for (const [x, y, z] of pts.slice(0, 200)) if (Math.abs(f(-x, -y, -z) - (l % 2 ? -1 : 1) * f(x, y, z)) > 1e-12) par++;
      for (let a = 0; a < F.length; a++) for (let b = a + 1; b < F.length; b++) { let ab = 0, aa = 0, bb = 0; for (const [x, y, z] of pts) { const u = F[a][1](x, y, z), v = F[b][1](x, y, z); ab += u * v; aa += u * u; bb += v * v; } worst = Math.max(worst, Math.abs(ab) / Math.sqrt(aa * bb)); } }
    let hund = 0; for (let Z = 1; Z <= 118; Z++) { const D = K.ptDrawnOrbitals(Z), cfg = K.ptConfig(Z); for (const [n, l, e] of cfg) { const got = D.filter(o => o[0] === n && o[1] === l); if (!got.length) continue; if (got.reduce((t, o) => t + o[3], 0) !== e || got.some(o => o[3] > 2)) hund++;
        const singles = got.filter(o => o[3] === 1).length, doubles = got.filter(o => o[3] === 2).length; if (doubles && singles && e <= 2 * l + 1) hund++; } }
    ok('the shapes: 2l + 1 real angular functions for each l, of parity (−1)^l and mutually orthogonal on the sphere; Hund’s filling seats every electron, never three to an orbital and no pair before every orbital has one',
      cnt === 0 && par === 0 && worst < 1e-3 && hund === 0, `counts ${cnt ? cnt + ' off' : '1, 3, 5, 7'} · parity ${par ? par + ' off' : '✓'} · overlap ≤ ${worst.toExponential(1)} · Hund ${hund ? hund + ' off' : '✓ for all 118'}`); }
  /* 6 */
  { const wired = /tick\(f,N\)\{ const g=this\.obj, Z=dscElemOf\(\), key=Z\+'\|'\+state\.lang/.test(fn('dscAtomLevel')) && /dscElemCoreFill\(g,Z,def,pk\)/.test(fn('dscCoreLevel')) && /dscElemNucleusFill\(g,Z,def,pk\)/.test(fn('dscNucleusLevel'))
      && SRC.includes("const DSC_MOL_LEVELS=new Set(['water','mol','lattice','hgas','h2gas','h2']);") && SRC.includes('const f=elPk&&DSC_MOL_LEVELS.has(L.id)?0:dscBand(N,L.band[0],L.band[1],L.band[2]);')
      && SRC.includes('id="dscPTBtn"') && SRC.includes('<div id="dscPT" class="dscPT" hidden></div>') && /function dscPTPaint\(\)/.test(SRC);
    const words = SRC.includes('(Slater’s rules, a model)') && SRC.includes('(правила Слейтера, модель)') && SRC.includes('Past Z = 103 the configurations are predictions'.replace('Past', 'past'));
    ok('the descent uses them: its atom, the inside of the atom and the nucleus are the chosen element’s, the molecules give way, the strip holds the table, and the words say what is a model',
      wired && words, `wired ${wired ? '✓' : '✗'} · words ${words ? '✓' : '✗'}`); }
  /* 7 */
  { const C = new Function(blk('const DSC_COMPOSITION=Object.freeze(', '\n') + ';\nreturn DSC_COMPOSITION;')();
    const bodies = ['sun', 'moon', ...Object.keys(new Function(blk('const DSC_RU=', '};') + '};\nreturn DSC_RU;')()).map(x => x.toLowerCase())];
    const UNITS = new Set(['log_eps', 'mg/kg', 'mass fraction', 'mass/Si', 'X/H', 'carrier', 'presence']), cyr = /[А-Яа-яЁё]/;
    const ATOMS = { 'CH₄': { 1: 4, 6: 1 }, 'N₂': { 7: 2 }, 'CO': { 6: 1, 8: 1 }, 'CO₂': { 6: 1, 8: 2 }, 'H₂O': { 1: 2, 8: 1 }, 'SO₂': { 16: 1, 8: 2 }, '²²Ne': { 10: 1 }, '⁴⁰Ar': { 18: 1 }, He: { 2: 1 }, Ne: { 10: 1 }, Ar: { 18: 1 } };
    const bad = [], lang2 = (x, w) => { if (!Array.isArray(x) || !x[0] || !x[1] || !cyr.test(x[1])) bad.push(w); };
    const layers = Object.entries(C).flatMap(([k, b]) => [[k, b], ...(b.alt ? [[k + '.alt', b.alt]] : [])]);
    let rows = 0;
    for (const [k, b] of layers) {
      if (!UNITS.has(b.unit)) bad.push(k + ' unit ' + b.unit);
      if (!b.source || !/(19|20)\d\d/.test(b.source) || !/doi|arXiv|https?:|Handbook|Sourcebook|\b(Science|Nature|Icarus|GRL|ApJ|Sci\. Adv\.|Nat\. Astron\.|J\. Geophys\. Res\.|Space Sci\. Rev\.)\s*[A-Z]?\d+, /.test(b.source)) bad.push(k + ' source');
      lang2(b.layer, k + ' layer'); lang2(b.full, k + ' full'); lang2(b.caveat, k + ' caveat'); lang2(b.ver, k + ' ver');
      const seen = new Set();
      for (const r of b.el) { rows++; const [Z, v, f, en, ru, x] = r;
        if (!(Number.isInteger(Z) && Z >= 1 && Z <= 118) || seen.has(Z)) bad.push(`${k} Z ${Z}`); seen.add(Z);
        if (!(Number.isFinite(v) && v > 0)) bad.push(`${k} ${Z} value ${v}`);
        if (!/^[acltqen]*$/.test(f)) bad.push(`${k} ${Z} flags ${f}`);
        if (!!en !== !!ru || (ru && !cyr.test(ru) && ru.replace(/(\d),(\d)/g, '$1.$2') !== en)) bad.push(`${k} ${Z} note languages`);
        if ((b.unit === 'carrier') !== !!x || (x && !(ATOMS[x] && ATOMS[x][Z]))) bad.push(`${k} ${Z} carrier ${x}`);
        if (b.unit === 'presence' && v !== 1) bad.push(`${k} ${Z} presence ${v}`); } }
    const missing = bodies.filter(k => !C[k]), extra = Object.keys(C).filter(k => !bodies.includes(k));
    /* one scale per body: atoms per H, mass, atoms per molecule; Mercury's absolute values placed by closing the listed elements */
    const order = [];
    for (const [k, b] of layers) { let sh;
      if (b.unit === 'log_eps') sh = r => Math.pow(10, r[1] - 12); else if (b.unit === 'carrier') sh = r => r[1] * ATOMS[r[5]][r[0]]; else if (b.unit === 'presence') sh = () => 1;
      else if (b.unit === 'mass/Si') { const ra = b.el.filter(r => !r[2].includes('a')).reduce((t, r) => t + r[1], 0), ab = b.el.filter(r => r[2].includes('a')).reduce((t, r) => t + r[1], 0), fSi = (1 - ab) / ra; sh = r => r[2].includes('a') ? r[1] / fSi : r[1]; }
      else sh = r => r[1];
      for (let i = 1; i < b.el.length; i++) { const p = b.el[i - 1], q = b.el[i]; if (sh(q) > sh(p) * (1 + 1e-12) || (sh(q) === sh(p) && q[0] < p[0])) order.push(`${k} ${p[0]}→${q[0]}`); } }
    const row = (k, Z, alt) => (alt ? C[k].alt : C[k]).el.find(r => r[0] === Z), sum = (k, alt) => (alt ? C[k].alt : C[k]).el.reduce((t, r) => t + r[1], 0);
    const carriers = (k, alt) => { const m = new Map(); for (const r of (alt ? C[k].alt : C[k]).el) m.set(r[5], Math.max(m.get(r[5]) || 0, r[1])); return [...m.values()].reduce((t, v) => t + v, 0); };
    const sums = { earth: sum('earth') / 1e6, moon: sum('moon'), mars: sum('mars'), venus: sum('venus'), titan: carriers('titan'), 'venus air': carriers('venus', 1) };
    const closes = Object.values(sums).every(v => Math.abs(v - 1) < 0.03);
    const anchors = [['sun', 26, 7.46], ['sun', 8, 8.69], ['sun', 6, 8.46], ['sun', 14, 7.51], ['sun', 1, 12], ['earth', 8, 461000], ['earth', 14, 282000], ['earth', 79, 0.004], ['jupiter', 2, 0.0785], ['titan', 6, 0.0565], ['mercury', 14, 1], ['jupiter', 1, 1]]
      .filter(([k, Z, v]) => { const r = row(k, Z); return !r || Math.abs(r[1] - v) > 1e-9 * Math.max(1, v); });
    const none = ['phobos', 'deimos'].every(k => C[k] && C[k].el.length === 0 && /No element has been measured/.test(C[k].caveat[0]) && /не измерен ни один элемент/.test(C[k].caveat[1]));
    const counts = { sun: C.sun.el.length, earth: C.earth.el.length, mercury: C.mercury.el.length, jupiter: C.jupiter.el.length };
    const wired = /return C\?C\.el\.map\(x=>x\[0\]\):\[\];/.test(fn('dscElemsHere')) && /C\.alt&&state\.dscCompAlt/.test(fn('dscCompOf')) && /T3\(C\.caveat\)/.test(fn('dscPTPaint')) && /T3\(C\.ver\)/.test(fn('dscPTPaint')) && /class="ptnote"/.test(fn('dscPTPaint')) && /DSC_ELEM_FLAG\[c\]/.test(fn('dscElemQty'));
    ok('what is measured where: a sourced composition for each of the 20 bodies of the descent, in its source’s unit — every row a real element once, positive, flagged from the set, noted in both languages; in order of abundance; the crust, soils, rock and atmospheres close; the quoted values agree; Phobos and Deimos say nothing is measured',
      !bad.length && !missing.length && !extra.length && !order.length && closes && !anchors.length && none && counts.sun === 68 && counts.earth === 88 && wired,
      `${Object.keys(C).length} bodies, ${rows} rows${bad.length ? ' · bad: ' + bad.slice(0, 6).join('; ') : ''}${missing.length ? ' · missing ' + missing.join(', ') : ''}${extra.length ? ' · extra ' + extra.join(', ') : ''} · order ${order.length ? order.slice(0, 4).join(', ') : '✓'} · sums ${Object.entries(sums).map(([k, v]) => k + ' ' + v.toFixed(3)).join(', ')} · anchors ${anchors.length ? anchors.map(a => a.join(' ')).join('; ') : '✓'} · Sun ${counts.sun}, crust ${counts.earth}, Mercury ${counts.mercury}, Jupiter ${counts.jupiter} · none on Phobos, Deimos ${none ? '✓' : '✗'} · wired ${wired ? '✓' : '✗'}`); }
} catch (e) { fail++; console.log('  FAIL — verifier error: ' + (e && e.stack || e)); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
