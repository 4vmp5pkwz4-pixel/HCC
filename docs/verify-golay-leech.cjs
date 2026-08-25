/* ── THE GOLAY CODE AND THE LEECH LATTICE ─────────────────────────────────────
   STATUS: MEASURED. Nothing here reads the atlas.

   This verifier deliberately does NOT repeat the atlas's construction. index.html builds
   the extended binary Golay code as [I | B] with B a bordered circulant on {0} together
   with the non-residues mod 11. Here the code is built a second, unrelated way: from the
   ICOSAHEDRON. Twelve vertices, the adjacency matrix of the solid, COMPLEMENTED, placed
   beside the identity. If both constructions are the Golay code they must produce the
   same invariants while being different subsets of F_2^24 — and they are: the two spans
   share only four of their 4096 words, so nothing is being copied.

   That the icosahedron appears here at all is not decoration. The atlas already holds the
   600-cell, whose vertex figure is an icosahedron, and E8, which the 600-cell is. This is
   the same thread continuing into twenty-four dimensions.

   THE VERIFIER DOES ONE THING THE BROWSER CANNOT AFFORD. The punctured code is a perfect
   three-error-correcting code, and the honest way to see that is to mark every one of the
   8388608 vectors of F_2^23 that lies within distance three of a code word and check that
   none is marked twice and none is left out. That is an 8 MB table and eight million
   marks. index.html measures the minimum distance instead and lets the count follow; here
   the tiling is done for real. */
'use strict';
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}${d ? ' · ' + d : ''}`); }
                          else { fail++; console.log(`  FAIL ${n}${d ? ' · ' + d : ''}`); } };
const pop = x => { let c = 0; while (x) { x &= x - 1; c++; } return c; };

/* ── the code, from the icosahedron ──────────────────────────────────────── */
const PHI = (1 + Math.sqrt(5)) / 2;
const V = [];
for (const s1 of [1, -1]) for (const s2 of [1, -1]) {
  V.push([0, s1, s2 * PHI]); V.push([s1, s2 * PHI, 0]); V.push([s2 * PHI, 0, s1]);
}
const d2 = (p, q) => (p[0]-q[0])**2 + (p[1]-q[1])**2 + (p[2]-q[2])**2;
const adjacent = (i, j) => Math.abs(d2(V[i], V[j]) - 4) < 1e-9;
const degrees = [...new Set(V.map((_, i) => V.filter((_, j) => adjacent(i, j)).length))];
ok('the twelve points really are an icosahedron: every vertex has exactly five neighbours',
  V.length === 12 && degrees.length === 1 && degrees[0] === 5,
  `${V.length} vertices, degrees observed {${degrees.join(',')}}`);

const BASIS = [];
for (let i = 0; i < 12; i++) {
  let r = 1 << i;
  for (let j = 0; j < 12; j++) if (!adjacent(i, j)) r |= 1 << (12 + j);
  BASIS.push(r);
}
const WORDS = new Int32Array(4096);
for (let m = 0; m < 4096; m++) { let c = 0; for (let k = 0; k < 12; k++) if (m >> k & 1) c ^= BASIS[k]; WORDS[m] = c; }
const MEMBER = new Set(WORDS);

/* ── the invariants ──────────────────────────────────────────────────────── */
const enumr = {};
for (let i = 0; i < 4096; i++) { const w = pop(WORDS[i]); enumr[w] = (enumr[w] || 0) + 1; }
const ws = Object.keys(enumr).map(Number).sort((a, b) => a - b);
ok('the weight enumerator is {0:1, 8:759, 12:2576, 16:759, 24:1} and no other weight occurs',
  MEMBER.size === 4096 && ws.join(',') === '0,8,12,16,24'
  && enumr[0] === 1 && enumr[8] === 759 && enumr[12] === 2576 && enumr[16] === 759 && enumr[24] === 1,
  `${MEMBER.size} distinct words · ${ws.map(w => `${w}:${enumr[w]}`).join(' · ')}`);

let nonOrth = 0;
for (let i = 0; i < 12; i++) for (let j = 0; j < 4096; j++) if (pop(BASIS[i] & WORDS[j]) & 1) nonOrth++;
ok('the code is self-dual: it is its own orthogonal complement, checked on every basis-word pair',
  nonOrth === 0, `${nonOrth} non-orthogonal out of ${12 * 4096} pairs`);

/* the atlas's own construction, for comparison only — different words, same code */
{
  const ZN = new Set([0, 2, 6, 7, 8, 10]);
  const G2 = []; let r0 = 1;
  for (let j = 1; j <= 11; j++) r0 |= 1 << (12 + j);
  G2.push(r0);
  for (let i = 1; i <= 11; i++) {
    let r = (1 << i) | (1 << 12);
    for (let j = 1; j <= 11; j++) if (ZN.has(((j - i) % 11 + 11) % 11)) r |= 1 << (12 + j);
    G2.push(r);
  }
  const S2 = new Set();
  for (let m = 0; m < 4096; m++) { let c = 0; for (let k = 0; k < 12; k++) if (m >> k & 1) c ^= G2[k]; S2.add(c); }
  const e2 = {}; for (const w of S2) e2[pop(w)] = (e2[pop(w)] || 0) + 1;
  let shared = 0; for (const w of S2) if (MEMBER.has(w)) shared++;
  ok('the atlas builds this code from a quadratic-residue circulant and this file builds it from the icosahedron; the two land on DIFFERENT subsets of F_2^24 and yet carry the same weight enumerator, which is what equivalence of codes means and what makes this a cross-check rather than a copy',
    S2.size === 4096 && ws.every(w => e2[w] === enumr[w]) && shared < 100,
    `the two spans share ${shared} of 4096 words · circulant enumerator ${ws.map(w => `${w}:${e2[w]}`).join(' · ')}`);
}

/* ── S(5,8,24) ───────────────────────────────────────────────────────────── */
{
  const octads = [...WORDS].filter(w => pop(w) === 8);
  const cover = new Map();
  for (const o of octads) {
    const p = []; for (let k = 0; k < 24; k++) if (o >> k & 1) p.push(k);
    for (let a = 0; a < 8; a++) for (let b = a+1; b < 8; b++) for (let c = b+1; c < 8; c++)
      for (let d = c+1; d < 8; d++) for (let e = d+1; e < 8; e++) {
        const key = (p[a]<<20)|(p[b]<<15)|(p[c]<<10)|(p[d]<<5)|p[e];
        cover.set(key, (cover.get(key) || 0) + 1);
      }
  }
  const mult = [...new Set(cover.values())].sort((a, b) => a - b);
  ok('the 759 octads form the Steiner system S(5,8,24): all 42504 five-element subsets of the 24 points are covered and every one of them exactly once',
    octads.length === 759 && cover.size === 42504 && mult.length === 1 && mult[0] === 1,
    `${octads.length} octads · ${cover.size} of ${24*23*22*21*20/120} five-subsets · multiplicities {${mult.join(',')}}`);
}

/* ── the punctured code tiles F_2^23 — the expensive check, done for real ── */
{
  const mask = (1 << 23) - 1;
  const punctured = [...new Set([...WORDS].map(w => w & mask))];
  let minw = 99;
  for (const c of punctured) { const w = pop(c); if (w > 0 && w < minw) minw = w; }
  const seen = new Uint8Array(1 << 23);
  let twice = 0;
  for (const c of punctured) {
    const touch = v => { if (seen[v]) twice++; else seen[v] = 1; };
    touch(c);
    for (let i = 0; i < 23; i++) { touch(c ^ (1 << i));
      for (let j = i+1; j < 23; j++) { touch(c ^ (1 << i) ^ (1 << j));
        for (let k = j+1; k < 23; k++) touch(c ^ (1 << i) ^ (1 << j) ^ (1 << k)); } }
  }
  let uncovered = 0;
  for (let v = 0; v < (1 << 23); v++) if (!seen[v]) uncovered++;
  ok('puncturing one coordinate leaves a PERFECT three-error-correcting code, and this is the tiling itself rather than the arithmetic that follows from it: every vector of F_2^23 within distance three of a code word is marked, none is marked twice, and none is left over',
    punctured.length === 4096 && minw === 7 && twice === 0 && uncovered === 0,
    `${punctured.length} words at minimum distance ${minw} · ${twice} double-marked · ${uncovered} of ${1 << 23} vectors uncovered`);
}

/* ── the Leech lattice ───────────────────────────────────────────────────── */
const leechIn = x => {
  const m = x[0] & 1;
  let S = 0, s = 0;
  for (let i = 0; i < 24; i++) { const v = x[i];
    if ((v & 1) !== m) return false;
    if (((v - m - 2) & 3) === 0) S |= 1 << i;
    s += v; }
  return MEMBER.has(S) && ((s - 4*m) & 7) === 0;
};
{
  const octads = [...WORDS].filter(w => pop(w) === 8);
  const seen = new Set();
  let n = 0, rejected = 0, wrongNorm = 0;
  const counts = { four: 0, two: 0, three: 0 };
  const emit = x => { n++;
    if (!leechIn(x)) rejected++;
    if (x.reduce((a, v) => a + v*v, 0) !== 32) wrongNorm++;
    seen.add(x.join(',')); };
  for (let i = 0; i < 24; i++) for (let j = i+1; j < 24; j++)
    for (const si of [4, -4]) for (const sj of [4, -4]) {
      const x = new Array(24).fill(0); x[i] = si; x[j] = sj; emit(x); counts.four++; }
  for (const o of octads) {
    const p = []; for (let k = 0; k < 24; k++) if (o >> k & 1) p.push(k);
    for (let s = 0; s < 256; s++) { if (pop(s) & 1) continue;
      const x = new Array(24).fill(0);
      for (let k = 0; k < 8; k++) x[p[k]] = (s >> k & 1) ? -2 : 2;
      emit(x); counts.two++; } }
  for (let i = 0; i < 24; i++) for (const w of WORDS) {
    const x = new Array(24);
    for (let k = 0; k < 24; k++) x[k] = (w >> k & 1) ? -1 : 1;
    x[i] = (w >> i & 1) ? 3 : -3;
    emit(x); counts.three++; }
  ok('the kissing number of the Leech lattice is 196560, and it is COUNTED: three shapes are generated out of the code above and every vector is then put to a membership predicate that is told nothing about shapes, only the three congruences',
    n === 196560 && seen.size === 196560 && rejected === 0 && wrongNorm === 0
    && counts.four === 1104 && counts.two === 97152 && counts.three === 98304,
    `${counts.four} + ${counts.two} + ${counts.three} = ${n}, ${seen.size} distinct, ${rejected} refused, ${wrongNorm} off norm 32`);
}
{
  let norm24 = 0, light = 0, short4 = 0;
  for (const w of WORDS) { const k = pop(w);
    if (((24 - 2*k - 4) & 7) === 0) norm24++;
    if (k > 0 && k < 8) light++; }
  for (let i = 0; i < 24; i++) for (const s of [4, -4]) {
    const x = new Array(24).fill(0); x[i] = s; if (leechIn(x)) short4++; }
  ok('and nothing is shorter — the finite case analysis is executed rather than narrated, and it lives entirely on facts measured above: with every code weight divisible by four no norm-24 vector survives the sum condition, with no code word lighter than eight no norm-16 vector exists, and a single +-4 fails the sum condition outright',
    norm24 === 0 && light === 0 && short4 === 0,
    `norm-24 candidates ${norm24} · code words of weight 1..7 ${light} · lattice vectors of shape (+-4,0^23) ${short4}`);
}
{
  const gens = [];
  for (const b of BASIS) { const g = new Array(24);
    for (let k = 0; k < 24; k++) g[k] = (b >> k & 1) ? 2 : 0; gens.push(g); }
  for (let i = 1; i < 24; i++) { const g = new Array(24).fill(0); g[0] = 4; g[i] = 4; gens.push(g); }
  { const g = new Array(24).fill(1); g[0] = -3; gens.push(g); }
  const outside = gens.filter(g => !leechIn(g)).length;
  const R = gens.map(r => r.map(BigInt));
  const abs = v => v < 0n ? -v : v;
  let piv = 0;
  for (let col = 0; col < 24 && piv < R.length; col++) {
    let k = -1;
    for (let i = piv; i < R.length; i++) if (R[i][col] !== 0n && (k < 0 || abs(R[i][col]) < abs(R[k][col]))) k = i;
    if (k < 0) continue;
    for (;;) {
      let m = -1;
      for (let i = piv; i < R.length; i++) if (i !== k && R[i][col] !== 0n) { m = i; break; }
      if (m < 0) break;
      const q = R[m][col] / R[k][col];
      for (let j = 0; j < 24; j++) R[m][j] -= q * R[k][j];
      if (R[m][col] !== 0n) { const t = R[m]; R[m] = R[k]; R[k] = t; }
    }
    const t = R[piv]; R[piv] = R[k]; R[k] = t; piv++;
  }
  let det = 1n; for (let i = 0; i < piv; i++) det *= abs(R[i][i]);
  ok('the lattice is unimodular: thirty-six generators, each one first tested for membership, reduce in exact integers to a rank-24 basis whose covolume is 8^12, which is determinant one once the coordinates are divided by sqrt(8)',
    outside === 0 && piv === 24 && det === 8n ** 12n,
    `${gens.length} generators, ${outside} outside the lattice · rank ${piv} · covolume ${det} against 8^12 = ${8n ** 12n}`);

  /* every minimal vector must reduce to zero against that basis */
  const H = R.slice(0, piv).map(r => r.map(Number));
  const pivcol = H.map(r => { let c = 0; while (c < 24 && r[c] === 0) c++; return c; });
  const octads = [...WORDS].filter(w => pop(w) === 8);
  const v = new Float64Array(24);
  let out = 0, checked = 0;
  const test = x => { checked++;
    for (let k = 0; k < 24; k++) v[k] = x[k];
    for (let i = 0; i < H.length; i++) { const c = pivcol[i]; if (c >= 24) continue;
      const q = v[c] / H[i][c];
      if (!Number.isInteger(q)) { out++; return; }
      if (q !== 0) for (let j = c; j < 24; j++) v[j] -= q * H[i][j]; }
    for (let k = 0; k < 24; k++) if (v[k] !== 0) { out++; return; } };
  for (let i = 0; i < 24; i++) for (let j = i+1; j < 24; j++)
    for (const si of [4, -4]) for (const sj of [4, -4]) {
      const x = new Array(24).fill(0); x[i] = si; x[j] = sj; test(x); }
  for (const o of octads) {
    const p = []; for (let k = 0; k < 24; k++) if (o >> k & 1) p.push(k);
    for (let s = 0; s < 256; s++) { if (pop(s) & 1) continue;
      const x = new Array(24).fill(0);
      for (let k = 0; k < 8; k++) x[p[k]] = (s >> k & 1) ? -2 : 2;
      test(x); } }
  for (let i = 0; i < 24; i++) for (const w of WORDS) {
    const x = new Array(24);
    for (let k = 0; k < 24; k++) x[k] = (w >> k & 1) ? -1 : 1;
    x[i] = (w >> i & 1) ? 3 : -3;
    test(x); }
  ok('and those thirty-six generate the WHOLE lattice rather than a sublattice of it: all 196560 minimal vectors reduce against that basis to exactly zero',
    out === 0 && checked === 196560, `${checked} vectors reduced, ${out} left a remainder`);
}

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
