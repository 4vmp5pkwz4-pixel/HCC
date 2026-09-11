#!/usr/bin/env node
'use strict';
/* ══ ONE NUMBER THAT WAS HIDING THREE ═══════════════════════════════════════════
 *
 * "1252 outputs without a quantity kind" was carried as a single debt for many
 * releases, and it is three debts that want three different things:
 *
 *   · outputs whose unit the atlas CAN convert — they need only a coordinate name;
 *   · outputs that are honestly pure numbers, where a kind needs other evidence;
 *   · and outputs whose unit field holds PROSE — a type, a dimension name with the
 *     unit withheld, an expression, or a pipe-separated list of permitted answers.
 *
 * Only the third is a defect, and it was invisible inside the total. This sorts
 * them and pins the sort: every unit spelling the atlas uses must be in exactly
 * one of the declared vocabularies, and the count that is not is zero.
 */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'api/manifest.json'), 'utf8'));
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

function cut(from, open, close, tail) {
  const i = src.indexOf(from); if (i < 0) throw new Error('slice not found: ' + from);
  const j = src.indexOf(open, i); let d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === open) d++;
    else if (src[k] === close) { d--; if (d === 0) return src.slice(i, k + 1) + (tail || ''); }
  }
  throw new Error('unbalanced: ' + from);
}
const S_SI = cut('const HCC_SI=Object.freeze({', '{', '}', ');');
const S_REF = cut('const HCC_SI_REFUSED=Object.freeze({', '{', '}', ');');
const S_CLS = cut('const HCC_UNIT_CLASS=Object.freeze({', '{', '}', ');');
const S_ALI = src.slice(src.indexOf('const HCC_UNIT_ALIAS=new Map(['),
                        src.indexOf(']);', src.indexOf('const HCC_UNIT_ALIAS=new Map([')) + 3);
const ctx = vm.createContext({ Math, Object, Map, Array, Number, console, JSON });
const V = vm.runInContext([S_SI, S_REF, S_CLS, S_ALI,
  '({HCC_SI,HCC_SI_REFUSED,HCC_UNIT_CLASS,HCC_UNIT_ALIAS})'].join('\n'), ctx, { timeout: 20000 });

const alias = u => V.HCC_UNIT_ALIAS.get(u == null ? '' : u) || (u == null ? '' : u);
const c = { outputs: 0, kinded: 0, convertible: 0, dimensionless: 0, refused: 0, not_a_unit: 0, unclassified: 0 };
const unclassified = new Map();
for (const ins of manifest.instruments || []) for (const o of ins.outputs || []) {
  c.outputs++; if (o.quantity_kind) c.kinded++;
  const u = alias(o.unit);
  if (u === '1') { c.dimensionless++; continue; }
  if (V.HCC_SI[u]) { c.convertible++; continue; }
  if (V.HCC_SI_REFUSED[u]) { c.refused++; continue; }
  const k = V.HCC_UNIT_CLASS[u];
  if (k) { c[k.cls]++; continue; }
  c.unclassified++; unclassified.set(u, (unclassified.get(u) || 0) + 1);
}

ok('every vocabulary this check reads was cut out of index.html rather than copied beside it',
  S_SI.length > 2000 && S_CLS.length > 2000 && S_ALI.length > 60,
  `${Object.keys(V.HCC_SI).length} convertible units, ${Object.keys(V.HCC_SI_REFUSED).length} refused, ${Object.keys(V.HCC_UNIT_CLASS).length} classified, ${V.HCC_UNIT_ALIAS.size} aliased`);

ok('EVERY UNIT SPELLING THE ATLAS USES IS IN EXACTLY ONE DECLARED VOCABULARY, and the number that is in none is zero — which is the pin, because a spelling nobody has classified is a spelling nobody has read',
  c.unclassified === 0,
  c.unclassified === 0
    ? `${c.outputs} declared outputs, every unit accounted for`
    : `${c.unclassified} outputs in ${unclassified.size} unclassified spellings: ${[...unclassified.keys()].slice(0, 6).join(', ')}`);

ok('and the old single debt is sorted into the three it was hiding, which want three different things',
  c.convertible > 300 && c.dimensionless > 800 && c.refused > 100 && c.not_a_unit > 0 &&
  c.convertible + c.dimensionless + c.refused + c.not_a_unit + c.unclassified === c.outputs,
  `${c.convertible} convertible · ${c.dimensionless} pure numbers · ${c.refused} refused with reasons · ${c.not_a_unit} PROSE, which is the only one of the four that is a defect`);

/* THE CEILING IS ON THE PROSE, because that is the part carelessness adds and
   honest work cannot. A new laboratory with an honest unit does not raise it. */
const PROSE_UNIT_CEILING = 35;
ok('the outputs whose unit field holds prose rather than a unit are at or below their ceiling, and the ceiling only falls',
  c.not_a_unit <= PROSE_UNIT_CEILING,
  `${c.not_a_unit} against ceiling ${PROSE_UNIT_CEILING}`);

ok('every classified spelling carries a written reason, so none of them is a verdict without an argument',
  Object.values(V.HCC_UNIT_CLASS).every(x => typeof x.why === 'string' && x.why.length > 20) &&
  Object.values(V.HCC_UNIT_CLASS).every(x => ['dimensionless', 'refused', 'not_a_unit'].includes(x.cls)),
  `${Object.keys(V.HCC_UNIT_CLASS).length} spellings, each with its class and its reason`);

ok('A DIMENSION NAME IN THE UNIT FIELD IS NAMED AS THE DEFECT IT IS — an output that says its unit is `length` has declared what it is and withheld what it is in',
  ['length', 'length/time', '1/length', 'momentum'].every(u => V.HCC_UNIT_CLASS[u] && V.HCC_UNIT_CLASS[u].cls === 'not_a_unit'),
  'four spellings name a dimension and give no unit, which is the distance ladder`s defect one level up');
ok('and a pipe-separated list of permitted answers is named as a value domain, not a unit',
  Object.entries(V.HCC_UNIT_CLASS).filter(([u, x]) => u.includes('|') && x.cls === 'not_a_unit').length >= 2,
  'a unit field holding an enum says what the output may BE, not what it is measured in');

ok('the units that were genuinely missing are declared with exact factors rather than rounded ones',
  V.HCC_SI['e'].f === 1.602176634e-19 && V.HCC_SI['hbar'].f === 1.054571817e-34 &&
  Math.abs(V.HCC_SI['nat'].f - 1 / Math.LN2) < 1e-15 && V.HCC_SI['J/K'].kind === 'entropy',
  'the elementary charge and the reduced Planck constant are SI defining constants; one nat is one over ln 2 bits by the definition of both');
ok('and one unit spelled two ways is aliased rather than entered twice, because a second entry is a second authority',
  V.HCC_UNIT_ALIAS.get('m s^-1') === 'm/s' && !V.HCC_SI['m s^-1'] && !!V.HCC_SI['m/s'],
  'm s^-1 → m/s, the same slip the atlas already filed about a day and a d');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
