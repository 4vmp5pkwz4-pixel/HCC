#!/usr/bin/env node
'use strict';
/* ══ THE ATLAS KNEW WHAT ITS QUANTITIES WERE CALLED AND NOT WHAT THEY WERE ═════
 *
 * Eighty-three convertible units across thirty-four quantity kinds, each carrying a
 * NAME and a conversion factor — `length`, `energy`, `magnetic flux` — and not one
 * of them carrying a DIMENSION. So the atlas could say two quantities were both
 * lengths, and could not answer the question that turns a set of quantities into a
 * physics: which combinations of them are dimensionless?
 *
 * That question has an exact answer and it is linear algebra. Write each kind as a
 * vector of exponents over the seven SI base dimensions; the dimensionless
 * combinations are the null space of that matrix; and by rank–nullity there are
 * exactly n − rank of them, independent. This is Buckingham's π theorem, and it is
 * the reason every genuinely new relation in physics is a statement about a
 * dimensionless group.
 *
 * MEASURED ON THIS ATLAS'S OWN QUANTITIES: n = 34, rank = 5, so twenty-nine
 * independent dimensionless groups are formable from what the instrument already
 * carries. Two of the seven base dimensions are used by nothing in it.
 *
 * A π-ENGINE THAT CANNOT REDISCOVER KNOWN PHYSICS IS NOT ONE, so twelve laws are
 * required to appear in the null space and four non-laws are required to fail.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

/* the table is cut out of the page, so a kind added there reaches this check */
const blk = (() => { const i = src.indexOf('const HCC_KIND_DIM=Object.freeze({');
  return i < 0 ? null : src.slice(i, src.indexOf('});', i)); })();
const DIM = {};
for (const m of (blk || '').matchAll(/'([^']+)':\[(-?\d+(?:,-?\d+){6})\]/g))
  DIM[m[1]] = m[2].split(',').map(Number);
const KINDS = Object.keys(DIM);
ok('the dimension table is one vector per kind, cut out of the page rather than copied beside it',
  KINDS.length === 34 && KINDS.every(k => DIM[k].length === 7)
  && /function hccDimOfUnit\(unit\)\{ const u=HCC_SI\[unit\]; return u\?hccDimOfKind\(u\.kind\):null; \}/.test(src),
  `${KINDS.length} kinds × 7 exponents · a unit resolves through its kind, so no unit carries a dimension of its own`);

/* every convertible unit must land on a kind that has a dimension */
const si = (() => { const i = src.indexOf('const HCC_SI=Object.freeze({');
  return src.slice(i, src.indexOf('});', i)); })();
const UNITS = [...si.matchAll(/'([^']+)':\{kind:'([^']+)',f:/g)].map(m => ({ u: m[1], k: m[2] }));
const orphan = UNITS.filter(x => !DIM[x.k]);
ok('every convertible unit resolves to a dimension through its kind, with none left over',
  UNITS.length >= 83 && orphan.length === 0,
  `${UNITS.length} units → ${new Set(UNITS.map(x => x.k)).size} kinds, all dimensioned`
  + (orphan.length ? ` · ORPHANS: ${orphan.slice(0, 6).map(x => `${x.u} (${x.k})`).join(', ')}` : ''));

/* ── rank and nullity ────────────────────────────────────────────────────────── */
const rank = M => { const m = M.map(r => r.slice()); let rk = 0;
  for (let c = 0; c < (m[0] || []).length && rk < m.length; c++) {
    let p = -1; for (let r = rk; r < m.length; r++) if (Math.abs(m[r][c]) > 1e-9) { p = r; break; }
    if (p < 0) continue;
    [m[rk], m[p]] = [m[p], m[rk]];
    for (let r = 0; r < m.length; r++) if (r !== rk && Math.abs(m[r][c]) > 1e-9) {
      const f = m[r][c] / m[rk][c]; for (let j = c; j < m[0].length; j++) m[r][j] -= f * m[rk][j]; }
    rk++; }
  return rk; };
const ROWS = []; for (let r = 0; r < 7; r++) ROWS.push(KINDS.map(k => DIM[k][r]));
const RK = rank(ROWS);
ok('the rank of the dimension matrix is five, so twenty-nine independent dimensionless groups exist',
  RK === 5 && KINDS.length - RK === 29,
  `n = ${KINDS.length}, rank = ${RK}, n − rank = ${KINDS.length - RK} · Buckingham's π theorem, and the count is exact rather than estimated`);

const BASE = ['M', 'L', 'T', 'I', 'Theta', 'N', 'J'];
const used = BASE.filter((b, r) => ROWS[r].some(v => v !== 0));
ok('two SI base dimensions are used by nothing in this atlas',
  used.length === 5 && !used.includes('N') && !used.includes('J'),
  `in play: ${used.join(' ')} · unused: N and J — nothing this atlas measures is a mole or a candela, which is a fact about the instrument and not about the SI`);

/* ── the control: known physics, from dimensions alone ───────────────────────── */
const comb = terms => { const v = [0, 0, 0, 0, 0, 0, 0];
  for (const [k, p] of terms) { if (!DIM[k]) return null; for (let r = 0; r < 7; r++) v[r] += DIM[k][r] * p; }
  return v; };
const isNull = v => !!v && v.every(x => Math.abs(x) < 1e-12);
const LAWS = [['E = mc²', [['energy', 1], ['mass', -1], ['speed', -2]]],
  ['E = hν', [['energy', 1], ['action', -1], ['frequency', -1]]],
  ['PV = E', [['pressure', 1], ['volume', 1], ['energy', -1]]],
  ['TS = E', [['temperature', 1], ['entropy', 1], ['energy', -1]]],
  ['P = IA', [['power', 1], ['intensity', -1], ['area', -1]]],
  ['Φ = BA', [['magnetic flux', 1], ['magnetic field', -1], ['area', -1]]],
  ['p = mv', [['momentum', 1], ['mass', -1], ['speed', -1]]],
  ['a = v/t', [['acceleration', 1], ['speed', -1], ['time', 1]]],
  ['ρ = m/V', [['mass density', 1], ['mass', -1], ['volume', 1]]],
  ['u = E/V', [['energy density', 1], ['energy', -1], ['volume', 1]]],
  ['V = E/q', [['voltage', 1], ['energy', -1], ['charge', 1]]],
  ['j = q/At', [['current density', 1], ['charge', -1], ['area', 1], ['time', 1]]]];
const missed = LAWS.filter(([, t]) => !isNull(comb(t))).map(x => x[0]);
ok('twelve known laws appear in the null space, with nothing but the dimensions told to the engine',
  missed.length === 0,
  LAWS.map(x => x[0]).join(' · ') + (missed.length ? ` · MISSED: ${missed.join(', ')}` : ''));

const NOT = [['E/m', [['energy', 1], ['mass', -1]]], ['v/t', [['speed', 1], ['time', -1]]],
  ['T/E', [['temperature', 1], ['energy', -1]]],
  ['BA/E', [['magnetic field', 1], ['area', 1], ['energy', -1]]]];
const wrong = NOT.filter(([, t]) => isNull(comb(t))).map(x => x[0]);
ok('and four combinations that are not dimensionless fail, because an engine that accepts everything has measured nothing',
  wrong.length === 0,
  NOT.map(x => x[0]).join(' · ') + ' — each differs from a real law by exactly one factor'
  + (wrong.length ? ` · WRONGLY ACCEPTED: ${wrong.join(', ')}` : ''));

ok('both the laws and the non-laws live in the page, so the boot suite runs the same control the file claims',
  /const HCC_PI_LAWS=Object\.freeze\(\[/.test(src) && /const HCC_PI_NOT_LAWS=Object\.freeze\(\[/.test(src)
  && (src.match(/\['E = mc²'|\['E = m c²'/g) || []).length >= 1,
  'a control described in a comment and absent from the code is a control nobody runs');

/* ── what dimensions cannot see ──────────────────────────────────────────────── */
const byDim = new Map();
for (const k of KINDS) { const key = DIM[k].join(','); if (!byDim.has(key)) byDim.set(key, []); byDim.get(key).push(k); }
const degen = [...byDim.values()].filter(v => v.length > 1);
ok('the engine names the three pairs dimensional analysis cannot separate',
  degen.length === 3
  && degen.some(g => g.includes('intensity') && g.includes('radiance'))
  && degen.some(g => g.includes('inverse time') && g.includes('frequency'))
  && degen.some(g => g.includes('energy density') && g.includes('pressure')),
  degen.map(g => g.join(' = ')).join(' · ') + ' · each is a distinction this atlas makes for physical reasons that units alone cannot justify, which is the most useful thing the theorem can say about it');

ok('and exactly one kind sits at the origin, because a bit is a pure number',
  (byDim.get('0,0,0,0,0,0,0') || []).length === 1
  && (byDim.get('0,0,0,0,0,0,0') || [])[0] === 'information',
  'the dimensionless quantities are where every π group lands, and the atlas carries one kind that is already there');

/* ── what the page draws ─────────────────────────────────────────────────────── */
ok('the lattice is drawn on the three axes that carry almost everything, and says so rather than dropping the others silently',
  /const axes=\[\[new THREE\.Vector3\(1,0,0\),0xff6b6b,'M · mass'\]/.test(src)
  && /const electric=d\[3\]!==0, thermal=d\[4\]!==0;/.test(src)
  && /\(electric\?' · I':''\)\+\(thermal\?' · Θ':''\)/.test(src),
  'a quantity that also involves current or temperature is marked, because dropping an axis silently is how a projection starts lying');

ok('coincident kinds are drawn as one point with both names, which is what a table cannot show',
  /const byDim=new Map\(\);/.test(src) && /names\.join\(' = '\)/.test(src)
  && /const r=DIMSPACE\.dot\*\(shared\?1\.9:1\.25\)\*\(dimless\?2\.2:1\);/.test(src),
  'in a table those are three pairs of rows nobody would think to compare; in the lattice they are one dot with two names');

/* ── THIS CHECK USED TO NAME TWO INSTRUMENTS AND THERE ARE NOW THREE ───────────
 * It read `fieldGroup.visible=(state.mode==='field')&&!on;` — the exact line that
 * decided between the solver's lattice and this one. The blast wave then moved into
 * the same volume, the decision became a three-way one, and that line stopped
 * existing. The check was right about the PRINCIPLE and wrong about the spelling, so
 * it is rewritten to ask the principle: one function, and only one, decides which
 * instrument in that volume is visible. A check pinned to a line of code fails when
 * the code is improved, which trains the next reader to delete checks. */
ok('the lattice, the solver and the blast wave take the world in turn, decided in one place',
  /function dimSpaceApply\(\)\{ fieldWorldApply\(\); \}/.test(src)
  && /function fieldWorldApply\(modeNow\)\{/.test(src)
  && /dimSpace\.visible=dims;/.test(src)
  && /fieldGroup\.visible=inField&&!blast&&!dims;/.test(src)
  && (src.match(/fieldGroup\.visible\s*=/g) || []).length === 2   // the declaration, and that one line
  && /if\(dimSpace\.visible\)\{ const C=dimSpace\.userData\.census\|\|hccPiCensus\(\);/.test(src),
  'the solver rewrites its own visibility every frame, so hiding its pieces would be a second authority arguing with the first sixteen times a second — and with three instruments sharing the volume the single writer matters more, not less');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
