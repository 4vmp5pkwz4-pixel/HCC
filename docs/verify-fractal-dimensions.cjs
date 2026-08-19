#!/usr/bin/env node
/* ============================================================================
   FIVE SOLIDS, AND A DIMENSION MEASURED BACK OUT OF THEM

   Every other entry in the atlas's fractal section is an ITERATION — a shader that colours
   the plane by how a point escapes. None of them is a body: all twelve were registered at
   the origin with no geometry at all. These five are real solids, built by the substitution
   rule that defines them, and each carries a dimension that is exact:

       D = log N / log(1/r)

   A closed form is an assertion until something else returns the same number. So the atlas
   BUILDS the set and then counts boxes, and this file checks that the count agrees — by a
   route that shares no algebra with the formula, since box counting knows only where the
   cells ended up.

   Run: node docs/verify-fractal-dimensions.cjs
   ========================================================================= */

let pass = 0, fail = 0;
const ok = (t, c, d) => { c ? pass++ : fail++;
  console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); };

(async () => {
const { pathToFileURL } = require('node:url');
const { join } = require('node:path');
const X = await import(pathToFileURL(join(__dirname, '..', 'core/atlas/extracted.mjs')).href);
const KINDS = Object.keys(X.FRAC_RULES);

console.log('\n1 · the substitution rules build what they say they build\n');
{
  const rows = [];
  let bad = 0;
  for (const k of KINDS) {
    const R = X.FRAC_RULES[k];
    for (let d = 1; d <= 4; d++) {
      const { pts, size } = X.fracBuild(k, d);
      if (pts.length !== Math.pow(R.cells.length, d)) bad++;
      if (Math.abs(size - Math.pow(1 / R.r, d)) > 1e-15) bad++;
      /* every cell centre must sit inside the unit cube */
      if (pts.some(p => p.some(v => v < 0 || v > 1))) bad++;
    }
    rows.push(`${k}: ${R.cells.length} copies at 1/${R.r}`);
  }
  ok('each rule produces exactly N^depth cells of side r^-depth, all inside the unit cube — checked at four depths for all five solids',
    bad === 0, rows.join(' · '));

  ok('and the cells never overlap: at every depth the number of DISTINCT centres equals the number generated, so the substitution is a genuine disjoint decomposition and not a pile',
    KINDS.every(k => [1, 2, 3, 4].every(d => {
      const { pts } = X.fracBuild(k, d);
      return new Set(pts.map(p => p.map(v => v.toFixed(12)).join(','))).size === pts.length;
    })), 'five solids, four depths each');
}

console.log('\n2 · the dimension, measured back out\n');
{
  const rows = [];
  let worst = 0;
  for (const k of KINDS) {
    const D = X.fracExactDimension(k);
    const depth = k === 'tetra' ? 7 : 4;
    const M = X.fracMeasuredDimension(k, depth);
    worst = Math.max(worst, Math.abs(M - D));
    rows.push(`${k} ${D.toFixed(9)} vs ${M.toFixed(9)}`);
  }
  ok('BOX COUNTING returns the closed-form dimension for every one of the five, to the last bit — the count knows only where the cells ended up and nothing about log N over log 1/r',
    worst < 1e-14, rows.join(' · ') + ` · worst difference ${worst.toExponential(2)}`);

  /* and it is not an accident of one depth */
  let stable = true;
  for (const k of KINDS) for (const d of [3, 4, 5]) {
    if (Math.abs(X.fracMeasuredDimension(k, d) - X.fracExactDimension(k)) > 1e-13) stable = false;
  }
  ok('at three separate depths, so the agreement is a property of the construction and not of one lucky scale',
    stable, 'depths 3, 4 and 5 for all five solids');
}

console.log('\n3 · what the numbers actually say\n');
{
  ok('the Sierpiński carpet and the Cantor dust have EXACTLY the same dimension and are not the same set — one is connected and the other is totally disconnected. Dimension is an invariant, not a description, and this is the cleanest way to see it',
    X.fracExactDimension('carpet') === X.fracExactDimension('dust') &&
    X.FRAC_RULES.carpet.cells.length === 8 && X.FRAC_RULES.dust.cells.length === 8,
    `both log 8 / log 3 = ${X.fracExactDimension('carpet').toFixed(12)}, from eight copies at one third — and the carpet's eight are a ring while the dust's are eight isolated corners`);

  ok('the Sierpiński tetrahedron has dimension EXACTLY 2 — four copies at one half — so a fractal can have an integer dimension and still be a fractal',
    X.fracExactDimension('tetra') === 2 && X.fracMeasuredDimension('tetra', 7) === 2,
    `log 4 / log 2 = ${X.fracExactDimension('tetra')} exactly, and the box count returns ${X.fracMeasuredDimension('tetra', 7)} exactly · its topological dimension is 1, and the two differ, which is what fractal means`);

  ok('the Menger sponge is the only one above two: log 20 / log 3, a solid that has zero volume and infinite surface',
    Math.abs(X.fracExactDimension('menger') - Math.log(20) / Math.log(3)) < 1e-15 &&
    X.fracExactDimension('menger') > 2 && X.fracExactDimension('menger') < 3 &&
    KINDS.filter(k => X.fracExactDimension(k) > 2).length === 1,
    `D = ${X.fracExactDimension('menger').toFixed(12)}, between the surface it is not and the volume it is not either`);

  ok('and the Vicsek cross is the lowest of the five, below both the carpet and the dust, despite being connected in three dimensions — seven copies is simply fewer than eight',
    X.fracExactDimension('vicsek') < X.fracExactDimension('carpet') &&
    Math.abs(X.fracExactDimension('vicsek') - Math.log(7) / Math.log(3)) < 1e-15,
    `log 7 / log 3 = ${X.fracExactDimension('vicsek').toFixed(12)} against log 8 / log 3 = ${X.fracExactDimension('carpet').toFixed(12)}`);

  ok('every one of the five has a dimension strictly between 1 and 3, so all five stand on the rail the atlas draws them along',
    KINDS.every(k => { const D = X.fracExactDimension(k); return D > 1 && D < 3; }),
    KINDS.map(k => k + ' ' + X.fracExactDimension(k).toFixed(4)).join(' · '));
}

console.log(`\n${fail === 0 ? '✔' : '✗'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
