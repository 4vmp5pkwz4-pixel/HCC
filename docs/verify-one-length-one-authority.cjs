#!/usr/bin/env node
'use strict';
/* ══ ONE LENGTH, ONE AUTHORITY ═════════════════════════════════════════════════
 *
 * The atlas states a length in three places that had never met. PHI_ATLAS is the
 * zoom ladder, a hundred and thirteen rows from the Planck length to the full S³
 * circumference. SCALE_REFS is the comparator the fractal bench reads to say what
 * a scale is "about the size of". COSMOS is the catalogue that draws the real
 * structures at real positions. Seventeen subjects appear in two of them at once.
 *
 * Eleven agreed to within two per cent, ten of them to within half — which is the
 * whole argument, because a number typed twice and agreeing today is a number that
 * can disagree tomorrow with nothing in the atlas to notice. Six did not:
 *
 *   · the South Pole Wall, out by 1.0570 — exactly 10²⁵ divided by 9.4607×10²⁴,
 *     which is 1.37 gigalightyears converted with a ROUND gigalightyear;
 *   · Laniakea, out by 0.508 — a radius written where a diameter was meant, with
 *     two authorities against one saying so;
 *   · Virgo, Coma, the Great Attractor and Shapley, each one authority against
 *     one, measuring genuinely different things under one name.
 *
 * This runs the reconciliation out of index.html and checks all of it: that the
 * gaps were what they were, that the provable two were repaired, that the four
 * definition differences were LEFT and carry written reasons, and that no derived
 * row can drift from its authority again.
 */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

function cutBalanced(from, open, close, tail) {
  const i = src.indexOf(from);
  if (i < 0) throw new Error('slice not found: ' + from);
  const j = src.indexOf(open, i);
  let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === open) d++;
    else if (src[k] === close) { d--; if (d === 0) return src.slice(i, k + 1) + (tail || ''); }
  }
  throw new Error('unbalanced: ' + from);
}
const S_PHI    = cutBalanced('const PHI_ATLAS=[', '[', ']', ';');
const S_REFS   = cutBalanced('const SCALE_REFS = [', '[', ']', ';');
const S_COSMOS = cutBalanced('const COSMOS = [', '[', ']', ';');
const S_GAL    = cutBalanced('const GALAXIES=Object.freeze([', '[', ']', ');');
const S_S3     = cutBalanced('const S3 = {', '{', '}', ';');
const S_SI     = cutBalanced('const HCC_SI=Object.freeze({', '{', '}', ');');
const S_GALRD  = cutBalanced('function galacticRaDec(lDeg,bDeg){', '{', '}');
const S_CDH    = src.slice(src.indexOf('const C_DH_GLY = '), src.indexOf('\n', src.indexOf('const C_DH_GLY = ')));
/* The reconciliation itself, from its first declaration to the end of the IIFE that
   applies it. Cut by the declarations that bound it, not by a line number. */
const S_REC = src.slice(src.indexOf("const HCC_GLY_M=HCC_SI['Gly'].f;"),
                        src.indexOf('function hccScalePublish(){'));

ok('every table and the reconciliation itself were cut out of index.html rather than copied beside it',
  [S_PHI, S_REFS, S_COSMOS, S_S3, S_SI, S_REC].every(s => s && s.length > 60),
  `${S_PHI.length} + ${S_REFS.length} + ${S_REC.length} chars of live source`);

const sandbox = { Math, Map, Set, Object, Array, Number, console, JSON, DEG: Math.PI / 180 };
const ctx = vm.createContext(sandbox);
/* The ratios are wanted BEFORE the repair as well as after, so the tables are
   snapshotted first. Reading them afterwards would measure the repair agreeing
   with itself, which is not a measurement. */
const built = vm.runInContext([
  S_S3, S_SI, S_CDH, S_GALRD,
  'const VELA_EQ=galacticRaDec(272.5,0), DIPOLE_EQ=galacticRaDec(94,-16), LOCALVOID_EQ=galacticRaDec(60,15);',
  S_PHI, S_REFS, S_GAL, S_COSMOS,
  'for(const s of COSMOS) if(s.dGly==null && s.dMly!=null) s.dGly=s.dMly/1000;',
  'const BEFORE_PHI=PHI_ATLAS.map(([g,rows])=>[g,rows.map(r=>r.slice())]);',
  'const BEFORE_REFS=SCALE_REFS.map(r=>r.slice());',
  S_REC,
  '({HCC_SAME_LENGTH, HCC_SCALE_RECONCILIATION, HCC_GLY_M, PHI_ATLAS, SCALE_REFS, BEFORE_PHI, BEFORE_REFS, COSMOS, S3, C_DH_GLY})'
].join('\n'), ctx, { timeout: 20000 });

const { HCC_SAME_LENGTH: PAIRS, HCC_SCALE_RECONCILIATION: R, HCC_GLY_M: GLY,
        PHI_ATLAS, SCALE_REFS, BEFORE_PHI, BEFORE_REFS, S3, C_DH_GLY } = built;

/* ── the metre in a gigalightyear, which is the whole story in one number ──── */
ok('the metre in a gigalightyear comes from the atlas unit table and from nowhere else',
  Math.abs(GLY - 9.4607304725808e24) < 1, `HCC_SI['Gly'].f = ${GLY.toExponential(10)} m`);
ok('and a ROUND ten-to-the-twenty-five would have been 5.70% too large — which is exactly what the South Pole Wall row was out by',
  Math.abs(1e25 / GLY - 1.05700) < 1e-4, `1e25 / ${GLY.toExponential(4)} = ${(1e25 / GLY).toFixed(5)}`);

/* ── the census ───────────────────────────────────────────────────────────── */
ok('every declared pairing resolves to a row that actually exists in the table it names',
  R.unfound === 0 && R.pairs === PAIRS.length, `${R.pairs} pairings, ${R.unfound} unresolved`);
const PAIR_FLOOR = 17, DERIVED_FLOOR = 13;
ok('the number of subjects known to be stated twice is at or above its floor, and the floor only rises',
  R.pairs >= PAIR_FLOOR, `${R.pairs} shared subjects against floor ${PAIR_FLOOR}`);
ok('the number of rows that no longer hold a typed length is at or above its floor',
  R.derived >= DERIVED_FLOOR, `${R.derived} derived from one authority, ${R.declared} disagreements declared`);
const agree = t => R.rows.filter(r => r.found !== false && Math.abs(r.ratio - 1) <= t).length;
ok('ten of the seventeen agreed to within half a per cent before anything was touched, and eleven within two — the reason to do this at all',
  agree(0.005) === 10 && agree(0.02) === 11,
  `${agree(0.005)} agree at 0.5%, ${agree(0.02)} at 2%, ${agree(0.5)} at 50% — and the two repairs bring the derived rows to ${R.derived}`);
ok('and the six that did not are not all inside until the tolerance is loosened past eighty per cent, which is how a definition is told from a rounding',
  agree(0.5) < R.pairs && agree(0.85) === R.pairs,
  `all ${R.pairs} only agree once 85% is called agreement`);

/* ── the two repairs, each provable ───────────────────────────────────────── */
const rowOf = n => R.rows.find(r => r.row === n);
ok('the South Pole Wall stood at exactly the round-gigalightyear factor away from the catalogue, and that is a proof rather than an opinion',
  Math.abs(rowOf('the South Pole Wall').ratio - 1e25 / GLY) < 1e-4,
  `ratio ${rowOf('the South Pole Wall').ratio.toFixed(5)} against 1e25/GLY = ${(1e25 / GLY).toFixed(5)}`);
ok('Laniakea stood in the ladder at half its own diameter, and the evidence to repair it was two authorities to one',
  Math.abs(rowOf('Laniakea supercluster').ratio - 0.5082) < 0.002 &&
  Math.abs(rowOf('the Laniakea Supercluster').ratio - 1) < 0.005,
  `ladder ratio ${rowOf('Laniakea supercluster').ratio.toFixed(4)} · comparator ratio ${rowOf('the Laniakea Supercluster').ratio.toFixed(4)} · the catalogue and the comparator agree with each other`);
ok('the widest gap closed is that one, and it is named rather than reported as a percentage',
  Math.abs(R.worst_healed - 0.4918) < 0.01 && /Laniakea/.test(R.worst_healed_row),
  `${(100 * R.worst_healed).toFixed(1)}% at "${R.worst_healed_row}"`);

/* ── the four that were LEFT ──────────────────────────────────────────────── */
const LEFT = PAIRS.filter(p => !p.derive);
ok('four disagreements are left standing, and every one of them carries a written reason',
  LEFT.length === 4 && LEFT.every(p => typeof p.reason === 'string' && p.reason.length > 60),
  LEFT.map(p => p.row).join(' · '));
ok('the widest gap LEFT is wider than the widest gap closed, which is the point of leaving it',
  R.worst_declared > R.worst_healed && /Shapley/.test(R.worst_declared_row),
  `${(100 * R.worst_declared).toFixed(0)}% left at "${R.worst_declared_row}" against ${(100 * R.worst_healed).toFixed(0)}% closed`);
ok('Shapley is out by a factor no radius-and-diameter confusion produces, so it is not treated as one',
  rowOf('Shapley concentration').ratio < 0.25,
  `ratio ${rowOf('Shapley concentration').ratio.toFixed(4)} — the ladder holds the dense core, the catalogue the whole complex`);
ok('and every row that was left keeps the number it had — nothing was quietly nudged toward agreement',
  LEFT.every(p => {
    const before = BEFORE_PHI.flatMap(([, rows]) => rows).find(r => r[0] === p.row);
    const after = PHI_ATLAS.flatMap(([, rows]) => rows).find(r => r[0] === p.row);
    return before && after && before[1] === after[1];
  }), `${LEFT.length} rows untouched to the last digit`);

/* ── and the repaired rows cannot drift again ─────────────────────────────── */
ok('every derived row now equals its authority exactly, so the two can never disagree again',
  PAIRS.filter(p => p.derive).every(p => {
    const after = p.table === 'PHI_ATLAS'
      ? PHI_ATLAS.flatMap(([, rows]) => rows).find(r => r[0] === p.row)[1]
      : SCALE_REFS.find(r => r[1] === p.row)[0];
    const authority = p.cosmos ? built.COSMOS.find(x => x.key === p.cosmos).size * GLY
      : p.derived === 's3_radius' ? S3.R * GLY
      : p.derived === 's3_antipode' ? S3.Dcausal * GLY
      : p.derived === 's3_circumference' ? S3.Circ * GLY : C_DH_GLY * GLY;
    return after === authority;
  }), `${R.derived} rows equal to their authority to the last bit, not to a tolerance`);

/* ── a repaired length reorders a ladder, and that must stay true ─────────── */
ok('every group of the ladder still ascends after the repair, because the ordering is recomputed from the values',
  PHI_ATLAS.every(([, rows]) => rows.every((r, i) => i === 0 || r[1] >= rows[i - 1][1])),
  `${PHI_ATLAS.length} groups, ${PHI_ATLAS.reduce((a, [, r]) => a + r.length, 0)} rows, every one in order`);
ok('and the comparator list ascends too',
  SCALE_REFS.every((r, i) => i === 0 || r[0] >= SCALE_REFS[i - 1][0]),
  `${SCALE_REFS.length} reference scales in order`);
ok('rungs really did move — a repair that changes nothing visible is a repair nobody can check',
  R.rungs_moved > 0,
  `${R.rungs_moved} rungs changed place · Laniakea rose past ${BEFORE_PHI.flatMap(([, rows]) => rows).filter(r => r[1] > 2.5e24 && r[1] < 4.92e24).map(r => r[0]).join(' and ') || 'nothing'}`);

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
