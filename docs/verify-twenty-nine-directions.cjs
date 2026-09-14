#!/usr/bin/env node
'use strict';
/* ══ TWENTY-NINE DIRECTIONS, AND WHAT THEY ARE NOT ════════════════════════════
 *
 * The π theorem gives the atlas a count — twenty-nine independent dimensionless
 * groups — and a count is not a list. This holds the list, computed exactly over the
 * integers, and the harder thing beside it: what the list is NOT.
 *
 * BUCKINGHAM IS A NECESSARY CONDITION AND NOT A SUFFICIENT ONE. The theorem says any
 * physical law relating these quantities must be expressible in their dimensionless
 * groups. It does not say every dimensionless group is a law, and nothing in
 * dimensional analysis could ever say so. A group is a DIRECTION IN WHICH A RELATION
 * COULD EXIST.
 *
 * Sorted, the twenty-nine come apart into three very different things:
 *
 *     12  named laws        and these twelve are linearly independent, so they span
 *                           twelve of the twenty-nine and no fewer
 *      5  definitional      each touches at most two kinds, so it says one kind IS a
 *                           power of another — counting that as a discovery would be
 *                           counting the metre twice
 *     12  compound          three or more distinct kinds, and no name in this atlas
 *
 * AND THE BASIS IS A CHOICE WHILE THE DIMENSION IS NOT. Run the elimination in a
 * different column order and every basis vector changes; the count does not.
 * Reporting a basis as though it were canonical is the commonest way to make linear
 * algebra lie, so this file permutes the columns and checks.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

const blk = (() => { const i = src.indexOf('const HCC_KIND_DIM=Object.freeze({');
  return src.slice(i, src.indexOf('});', i)); })();
const DIM = {};
for (const m of blk.matchAll(/'([^']+)':\[(-?\d+(?:,-?\d+){6})\]/g)) DIM[m[1]] = m[2].split(',').map(Number);

/* the same construction the page runs, re-derived here rather than imported */
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
function nullBasis(K) {
  const n = K.length;
  const rd = ([a, b]) => { const s = b < 0 ? -1 : 1; a *= s; b *= s; const d = gcd(a, b); return [a / d, b / d]; };
  const sb = (x, y) => rd([x[0] * y[1] - y[0] * x[1], x[1] * y[1]]);
  const ml = (x, y) => rd([x[0] * y[0], x[1] * y[1]]);
  const dv = (x, y) => rd([x[0] * y[1], x[1] * y[0]]);
  const M = []; for (let r = 0; r < 7; r++) M.push(K.map(k => [DIM[k][r], 1]));
  let rank = 0; const piv = [];
  for (let c = 0; c < n && rank < 7; c++) {
    let p = -1; for (let q = rank; q < 7; q++) if (M[q][c][0] !== 0) { p = q; break; }
    if (p < 0) continue;
    [M[rank], M[p]] = [M[p], M[rank]];
    const lead = M[rank][c]; for (let j = 0; j < n; j++) M[rank][j] = dv(M[rank][j], lead);
    for (let q = 0; q < 7; q++) if (q !== rank && M[q][c][0] !== 0) {
      const f = M[q][c]; for (let j = 0; j < n; j++) M[q][j] = sb(M[q][j], ml(f, M[rank][j])); }
    piv.push(c); rank++; }
  const free = [...Array(n).keys()].filter(c => !piv.includes(c));
  const basis = free.map(fc => { const v = new Array(n).fill(0).map(() => [0, 1]); v[fc] = [1, 1];
    piv.forEach((pc, pi) => { v[pc] = rd([-M[pi][fc][0], M[pi][fc][1]]); });
    let L = 1; for (const x of v) L = L * x[1] / gcd(L, x[1]);
    const ints = v.map(x => x[0] * (L / x[1]));
    const cd = ints.reduce((a, b) => gcd(a, b), 0) || 1;
    return ints.map(x => x / cd); });
  return { rank, basis };
}
const K = Object.keys(DIM), N = K.length;
const { rank, basis } = nullBasis(K);

ok('the basis is exact over the integers and every vector of it is dimensionless',
  basis.length === 29 && basis.every(v => v.every(x => Number.isInteger(x)))
  && basis.every(v => { const d = [0, 0, 0, 0, 0, 0, 0];
    v.forEach((p, j) => { for (let r = 0; r < 7; r++) d[r] += DIM[K[j]][r] * p; });
    return d.every(x => x === 0); }),
  `${basis.length} vectors, all integer, each checked against the dimension table it came from rather than trusted from the elimination`);

ok('and each is cleared by its own greatest common divisor, so no group is a multiple of a smaller one',
  basis.every(v => { const nz = v.filter(x => x !== 0).map(Math.abs);
    return nz.length === 0 || nz.reduce((a, b) => gcd(a, b)) === 1; }),
  'a group and its square are the same direction, and listing both would be counting one relation twice');

/* the twelve laws, independent */
const idx = Object.fromEntries(K.map((k, j) => [k, j]));
const vec = t => { const v = new Array(N).fill(0); for (const [k, p] of t) v[idx[k]] += p; return v; };
const rankOf = vs => { const m = vs.map(r => r.slice()); let rk = 0;
  for (let c = 0; c < N && rk < m.length; c++) {
    let p = -1; for (let q = rk; q < m.length; q++) if (Math.abs(m[q][c]) > 1e-9) { p = q; break; }
    if (p < 0) continue;
    [m[rk], m[p]] = [m[p], m[rk]];
    for (let q = 0; q < m.length; q++) if (q !== rk && Math.abs(m[q][c]) > 1e-9) {
      const f = m[q][c] / m[rk][c]; for (let j = c; j < N; j++) m[q][j] -= f * m[rk][j]; }
    rk++; }
  return rk; };
const LAWS = [[['energy', 1], ['mass', -1], ['speed', -2]], [['energy', 1], ['action', -1], ['frequency', -1]],
  [['pressure', 1], ['volume', 1], ['energy', -1]], [['temperature', 1], ['entropy', 1], ['energy', -1]],
  [['power', 1], ['intensity', -1], ['area', -1]], [['magnetic flux', 1], ['magnetic field', -1], ['area', -1]],
  [['momentum', 1], ['mass', -1], ['speed', -1]], [['acceleration', 1], ['speed', -1], ['time', 1]],
  [['mass density', 1], ['mass', -1], ['volume', 1]], [['energy density', 1], ['energy', -1], ['volume', 1]],
  [['voltage', 1], ['energy', -1], ['charge', 1]],
  [['current density', 1], ['charge', -1], ['area', 1], ['time', 1]]].map(vec);
ok('the twelve named laws are linearly independent, so they span twelve of the twenty-nine and no fewer',
  rankOf(LAWS) === 12,
  `rank ${rankOf(LAWS)} of 12 · not one of them is implied by the others, which is why the remainder is seventeen and not fewer`);

/* the sort */
const chosen = LAWS.slice(), extra = [];
for (const b of basis) if (rankOf([...chosen, ...extra, b]) > rankOf([...chosen, ...extra])) extra.push(b);
const width = v => v.filter(x => x !== 0).length;
const defin = extra.filter(v => width(v) <= 2), comp = extra.filter(v => width(v) > 2);
ok('the remainder sorts into five definitions and twelve compound directions',
  extra.length === 17 && defin.length === 5 && comp.length === 12
  && 12 + defin.length + comp.length === 29,
  `12 named + ${defin.length} definitional + ${comp.length} compound = 29`);

ok('and the definitional cut is where it belongs: at most two kinds means one kind IS a power of another',
  defin.every(v => width(v) <= 2) && comp.every(v => width(v) >= 3)
  && /const definitional=extra\.filter\(v=>width\(v\)<=2\), compound=extra\.filter\(v=>width\(v\)>2\);/.test(src),
  `area over length squared is the definition of area · counting it as a discovery would be counting the metre twice`);

/* the basis is a choice; the dimension is not */
const rot = K.slice(7).concat(K.slice(0, 7));
const B = nullBasis(rot);
ok('permuting the columns changes every basis vector and changes the count by nothing',
  B.rank === rank && B.basis.length === basis.length
  && JSON.stringify(B.basis) !== JSON.stringify(basis),
  `rank ${rank} either way, ${basis.length} vectors either way, and the vectors themselves differ — so the count is what gets reported and the basis is not`);

ok('the page runs that same permutation check at boot, rather than only claiming it here',
  /const K=Object\.keys\(HCC_KIND_DIM\), rot=K\.slice\(7\)\.concat\(K\.slice\(0,7\)\);/.test(src)
  && /const differs=JSON\.stringify\(A\.basis\)!==JSON\.stringify\(B\.basis\);/.test(src),
  'reporting a basis as canonical is the commonest way to make linear algebra lie, so the instrument checks itself every time it opens');

/* ── the refusal, which is the point ─────────────────────────────────────────── */
ok('the theorem\'s own limit is carried in the census rather than left to the reader',
  /caveat:'a dimensionless group is a direction in which a relation COULD exist; Buckingham gives a necessary condition and never a sufficient one, so none of these is a discovered law'/.test(src),
  'the word "candidate" is doing real work here rather than being modest');

ok('and the drawing says it too: the compound loops are dim and unlabelled on purpose',
  /new THREE\.LineBasicMaterial\(\{color:0xb026ff,transparent:true,opacity:\.20\}\)/.test(src)
  && /drawing one as boldly as E = mc²[\s\S]{0,40}would be making a claim the theorem cannot support/.test(src),
  'a direction in which a relation could exist must not be drawn as boldly as a relation that is known to exist');

ok('a compound group is drawn as a closed loop, because that is what dimensionlessness looks like',
  /pts\.push\(pts\[0\]\.clone\(\)\);/.test(src)
  && /dimensionless group is exactly a walk through the exponent lattice that returns[\s\S]{0,30}to the origin/.test(src),
  'seeing the walk close is seeing why the group is dimensionless, which no row of a table conveys');

ok('the HUD reports the sort, so the reader is told what the violet loops are and are not',
  /directions in which a relation COULD exist, never discoveries/.test(src)
  && /\$\{Dd\.namedRank\} named laws, \$\{Dd\.definitional\.length\} definitions, \$\{Dd\.compound\.length\} compound loops/.test(src),
  'the counts in the caption come from the census that computed them, not from a number typed into a string');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
