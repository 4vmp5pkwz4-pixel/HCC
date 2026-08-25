/* ── THE FINITE SUBGROUPS OF S^3, AND WHAT THEY ARE THE SAME AS ───────────────
   STATUS: MEASURED. Nothing here reads the atlas.

   Besides the cyclic and dihedral families, S^3 has exactly three finite subgroups: the
   binary tetrahedral, octahedral and icosahedral groups, of orders 24, 48 and 120. As
   SETS OF QUATERNIONS they are regular four-dimensional polytopes — the 24 Hurwitz units
   are the vertices of the 24-cell, the 120 icosians the vertices of the 600-cell.

   Everything is constructed from coordinates and then checked. The group axioms are
   tested exhaustively; the conjugacy classes are counted by conjugating every element by
   every element; E8 is built from its definition. The McKay correspondence is then the
   observation that the class counts are the node counts of the affine E6, E7 and E8
   diagrams, and that the sum of the squares of each diagram's marks is the order of its
   group. */
'use strict';
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}${d ? ' · ' + d : ''}`); }
                          else { fail++; console.log(`  FAIL ${n}${d ? ' · ' + d : ''}`); } };

const PHI = (1 + Math.sqrt(5)) / 2;
const qm = (a, b) => [a[0]*b[0]-a[1]*b[1]-a[2]*b[2]-a[3]*b[3],
                      a[0]*b[1]+a[1]*b[0]+a[2]*b[3]-a[3]*b[2],
                      a[0]*b[2]-a[1]*b[3]+a[2]*b[0]+a[3]*b[1],
                      a[0]*b[3]+a[1]*b[2]-a[2]*b[1]+a[3]*b[0]];
const key = a => a.map(v => (Math.abs(v) < 1e-12 ? 0 : v).toFixed(9)).join(',');
const nrm = a => Math.hypot(...a);
const EVEN = [[0,1,2,3],[0,2,3,1],[0,3,1,2],[1,0,3,2],[1,2,0,3],[1,3,2,0],
              [2,0,1,3],[2,1,3,0],[2,3,0,1],[3,0,2,1],[3,1,0,2],[3,2,1,0]];
const perms = a => EVEN.map(p => p.map(i => a[i]));
const signs = a => { const o = []; for (let m = 0; m < 16; m++) o.push(a.map((v, i) => (m >> i & 1) ? -v : v)); return o; };
const uniq = l => { const m = new Map(); for (const v of l) if (Math.abs(nrm(v) - 1) < 1e-9) m.set(key(v), v); return [...m.values()]; };

const base = signs([1, 0, 0, 0]).flatMap(perms);
const half = signs([0.5, 0.5, 0.5, 0.5]);
const G = {
  '2T': uniq([...base, ...half]),
  '2O': uniq([...base, ...half, ...signs([Math.SQRT1_2, Math.SQRT1_2, 0, 0]).flatMap(perms)]),
  '2I': uniq([...base, ...half, ...signs([0, 0.5, 0.5 / PHI, PHI / 2]).flatMap(perms)]),
};

console.log('\nFINITE SUBGROUPS OF S^3 · the 24-cell, the 600-cell and E8\n');

{
  const want = { '2T': 24, '2O': 48, '2I': 120 };
  let allClosed = true, allUnit = true, orders = [];
  for (const k of ['2T', '2O', '2I']) {
    const S = new Set(G[k].map(key));
    let esc = 0, wn = 0;
    for (const a of G[k]) { wn = Math.max(wn, Math.abs(nrm(a) - 1));
      for (const b of G[k]) if (!S.has(key(qm(a, b)))) esc++; }
    if (esc) allClosed = false;
    if (wn > 1e-12) allUnit = false;
    orders.push(`${k}=${G[k].length}/${want[k]}`);
  }
  ok('all three are groups: closed under quaternion multiplication, every element a unit',
    allClosed && allUnit && G['2T'].length === 24 && G['2O'].length === 48 && G['2I'].length === 120,
    `${orders.join(' ')} · zero products escape out of 576, 2304 and 14400`);
}

{
  const shell = g => { const d = [];
    for (let i = 1; i < g.length; i++) d.push(Math.hypot(...g[i].map((v, k) => v - g[0][k])));
    d.sort((a, b) => a - b);
    return { near: d[0], n: d.filter(x => Math.abs(x - d[0]) < 1e-9).length }; };
  const s = shell(G['2I']);
  ok('the 600-cell knows the golden ratio without being told',
    Math.abs(s.near - 1 / PHI) < 1e-9 && s.n === 12,
    `nearest-neighbour distance ${s.near.toFixed(9)} against 1/phi = ${(1 / PHI).toFixed(9)}, with ${s.n} neighbours — its vertex figure is an icosahedron`);
}

{
  const classes = g => {
    const K = g.map(key), idx = new Map(K.map((k, i) => [k, i]));
    const inv = q => [q[0], -q[1], -q[2], -q[3]];
    const seen = new Array(g.length).fill(false), sizes = [];
    for (let i = 0; i < g.length; i++) {
      if (seen[i]) continue;
      const orb = new Set();
      for (const x of g) orb.add(key(qm(qm(x, g[i]), inv(x))));
      for (const k of orb) { const j = idx.get(k); if (j !== undefined) seen[j] = true; }
      sizes.push(orb.size);
    }
    return { n: sizes.length, sizes: sizes.sort((a, b) => a - b) };
  };
  const c = { '2T': classes(G['2T']), '2O': classes(G['2O']), '2I': classes(G['2I']) };
  ok('the conjugacy classes are 7, 8 and 9 — the node counts of the affine E6, E7 and E8 diagrams',
    c['2T'].n === 7 && c['2O'].n === 8 && c['2I'].n === 9,
    `2T ${c['2T'].n} · 2O ${c['2O'].n} · 2I ${c['2I'].n} · class sizes of 2I: ${c['2I'].sizes.join(',')}`);
  const marks = { '2T': [1,2,3,2,1,2,1], '2O': [1,2,3,4,3,2,1,2], '2I': [1,2,3,4,5,6,4,2,3] };
  const sq = k => marks[k].reduce((s, m) => s + m * m, 0);
  ok('and the sum of the squares of each diagram\'s marks is the order of its group',
    sq('2T') === 24 && sq('2O') === 48 && sq('2I') === 120 &&
    marks['2T'].length === c['2T'].n && marks['2O'].length === c['2O'].n && marks['2I'].length === c['2I'].n,
    `E6 ${sq('2T')}=|2T| · E7 ${sq('2O')}=|2O| · E8 ${sq('2I')}=|2I| — Burnside, and McKay`);
}

{
  const R = [];
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++)
    for (const si of [1, -1]) for (const sj of [1, -1]) {
      const v = new Array(8).fill(0); v[i] = si; v[j] = sj; R.push(v); }
  for (let m = 0; m < 256; m++) {
    const s = [...Array(8)].map((_, k) => (m >> k & 1) ? -0.5 : 0.5);
    if (s.filter(x => x < 0).length % 2 === 0) R.push(s);
  }
  const n2 = v => v.reduce((s, x) => s + x * x, 0);
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  let wn = 0, nonInt = 0; const vals = new Set();
  for (const a of R) { wn = Math.max(wn, Math.abs(n2(a) - 2));
    for (const b of R) { const d = dot(a, b); vals.add(Math.round(d));
      if (Math.abs(d - Math.round(d)) > 1e-12) nonInt++; } }
  ok('E8 has 240 roots, every norm^2 exactly 2, every inner product an integer',
    R.length === 240 && wn < 1e-12 && nonInt === 0,
    `${R.length} roots · worst |norm^2 - 2| ${wn.toExponential(1)} · inner products only ${[...vals].sort((a, b) => a - b).join(', ')}`);
}

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
