#!/usr/bin/env node
'use strict';
/* ══ THE SCALING BENCH: ANY QUANTITIES, THE GROUPS THEY ADMIT, THE LAW THEY IMPLY ══
 *
 * Twice this atlas derived a power law by hand — R = ξ(Et²/ρ)^(1/5) for the blast
 * wave, L = (Dt)^(1/2) for the diffusing pulse — and both times the function that did
 * it was the SAME FUNCTION with a different constant at the top. Not similar:
 * identical, line for line, apart from which list of kinds it read. Duplication is
 * the atlas saying what it wants to be, so this is the one engine and those two are
 * calls into it.
 *
 * BECAUSE IT IS GENERAL, THE READER CAN MAKE THE CALL. Choose any of the thirty-four
 * quantities, choose one to solve for, read off the exponents. That is the whole of
 * what dimensional analysis can offer, offered.
 *
 * AND THE INTERESTING HALF IS THE REFUSALS, which is what this file spends most of
 * its checks on. A bench that answers every question has answered none of them:
 *
 *   ONE GROUP    the exponents are determined and the shape is unique
 *   NONE         the quantities are dimensionally independent, so NO relation among
 *                them can exist — a real answer, not a failure
 *   TWO OR MORE  the shape is NOT determined; any function of the groups satisfies
 *                the units, and picking one would be inventing physics
 *   ABSENT       the one group does not contain the target at all
 *
 * THE CONSTANT IS NEVER GIVEN. Every law here is correct up to a dimensionless factor
 * the bench cannot know: ξ took an integration of the gas dynamics, 2ν took the
 * Gaussian solution. A reader who takes an exponent from here has something real; a
 * reader who takes a prediction has half of one.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };
const cut = (a, b) => { const i = src.indexOf(a); const j = src.indexOf(b, i);
  if (i < 0 || j < 0) throw new Error('could not cut ' + a.slice(0, 40)); return src.slice(i, j); };

const API = (() => {
  const code = cut('const HCC_DIM=', '/* ══ TWENTY-NINE')
    + cut('function hccNullBasis', 'function hccDirectionCensus')
    + cut('/* ══ THE SCALING BENCH', '/* and four that must FAIL')
    + '\nreturn {hccSolveFor, hccRatio, hccBlastExponents, hccDiffusionExponents, HCC_SEDOV, HCC_DIFFUSION};';
  return new Function(code)();
})();

/* 1 ── the duplication is actually gone, not merely wrapped */
{ const b = cut('function hccBlastExponents', '/* the self-similar interior');
  const d = cut('function hccDiffusionExponents', '/* least squares with');
  ok('both hand-derived laws are now calls into the one engine rather than copies of it',
    /hccSolveFor\(HCC_SEDOV\.kinds,'length'\)/.test(b)
    && /hccSolveFor\(HCC_DIFFUSION\.kinds,'length'\)/.test(d)
    && !/hccNullBasis/.test(b) && !/hccNullBasis/.test(d)
    && !/K\.forEach/.test(b) && !/K\.forEach/.test(d),
    'neither runs its own elimination any more · they were identical line for line apart from one constant');

  /* and the refactor changed no answer, which is the only thing that makes it one */
  const bl = API.hccBlastExponents(), df = API.hccDiffusionExponents();
  ok('and neither answer moved, pinned to the vectors and exponents they returned before the refactor',
    JSON.stringify(bl.vector) === '[-1,1,-2,5]' && Math.abs(bl.energy - 0.2) < 1e-12
    && Math.abs(bl['mass density'] + 0.2) < 1e-12 && Math.abs(bl.time - 0.4) < 1e-12
    && JSON.stringify(df.vector) === '[-1,-1,2]' && Math.abs(df.diffusivity - 0.5) < 1e-12
    && Math.abs(df.time - 0.5) < 1e-12,
    'a refactor that changes an answer is not a refactor');
}

/* 2 ── it recovers laws, including one this atlas was not already carrying */
{ const cases = [
    [['energy', 'mass density', 'time', 'length'], 'length', 'length ∝ energy^1/5 · mass density^-1/5 · time^2/5'],
    [['diffusivity', 'time', 'length'], 'length', 'length ∝ diffusivity^1/2 · time^1/2'],
    [['energy', 'mass', 'speed'], 'energy', 'energy ∝ mass^1 · speed^2'],
    [['pressure', 'mass density', 'speed'], 'speed', 'speed ∝ pressure^1/2 · mass density^-1/2']];
  const got = cases.map(([k, t]) => API.hccSolveFor(k, t));
  ok('four sets of quantities, four determined laws, and the third and fourth were never told to it',
    got.every((r, i) => r.status === 'determined' && r.law === cases[i][2]),
    got.map(r => r.law).join('  ·  '));
  ok('the speed of sound is the first law this atlas has derived that it was not already carrying',
    got[3].law === 'speed ∝ pressure^1/2 · mass density^-1/2' && got[3].groups === 1,
    'c ∝ (P/ρ)^1/2 — and the γ in front of it is exactly the dimensionless constant the bench says it cannot give');
}

/* 3 ── THE REFUSALS, which is what makes it an instrument rather than an oracle */
{ const none = API.hccSolveFor(['length', 'time'], 'length');
  ok('dimensionally independent quantities are reported as admitting NO relation, which is an answer',
    none.status === 'independent' && none.exponents === null && none.groups === 0
    && /no relation among them can exist/.test(none.note),
    '{length, time} · there is no law relating a length to a time without something to carry the ratio, and saying so is the useful output');

  const many = API.hccSolveFor(['energy', 'mass', 'speed', 'time', 'length'], 'energy');
  ok('two or more groups is reported as the shape being undetermined, and nothing is chosen',
    many.status === 'underdetermined' && many.exponents === null && many.groups === 2
    && !many.law && /choosing one would be inventing physics/.test(many.note),
    many.groups + ' groups · any function of them satisfies the units, so there is no unique law to report and reporting one would be a fabrication');

  const gone = API.hccSolveFor(['energy', 'mass', 'speed', 'entropy'], 'entropy');
  ok('and a target the one group does not contain is refused rather than divided by zero',
    gone.status === 'absent' && gone.exponents === null,
    'solving for a quantity that does not appear in the group is not a harder version of the same question');

  ok('malformed questions are refused too, rather than answered with something answer-shaped',
    API.hccSolveFor(['energy'], 'energy') === null
    && API.hccSolveFor(['energy', 'mass'], 'speed') === null
    && API.hccSolveFor([], 'energy') === null && API.hccSolveFor(null, 'energy') === null,
    'one quantity is not a relation · a target that was never picked is not a target · an empty or missing list is neither');

  ok('an unknown quantity name is dropped rather than poisoning the matrix with a hole',
    API.hccSolveFor(['energy', 'not a quantity', 'mass', 'speed'], 'energy').status === 'determined'
    && API.hccSolveFor(['energy', 'not a quantity', 'mass', 'speed'], 'energy').kinds.length === 3,
    'a name with no dimension has no row to contribute, and letting it through would have produced a wrong rank silently');
}

/* 4 ── the arithmetic is over the integers and the display admits it */
ok('exponents print as the fractions the integer null space actually produced',
  API.hccRatio(0.4) === '2/5' && API.hccRatio(-0.2) === '-1/5' && API.hccRatio(0.5) === '1/2'
  && API.hccRatio(2) === '2' && API.hccRatio(-3) === '-3' && API.hccRatio(1 / 3) === '1/3',
  '2/5 rather than 0.4000000000000001 · the basis is computed over the integers and the display has no business hiding that');
ok('and a genuinely irrational exponent is not forced into a fraction it is not',
  /return x\.toFixed\(4\);/.test(cut('function hccRatio', 'function hccBlastExponents'))
  && API.hccRatio(Math.PI).length > 3 && API.hccRatio(Math.PI).indexOf('/') < 0,
  'the search is bounded by a denominator and falls back rather than reporting a nearby fraction as exact');

/* 5 ── the caveat travels with every answer, not just with the documentation */
{ const r = API.hccSolveFor(['energy', 'mass', 'speed'], 'energy');
  ok('every determined law carries the limit of the method in its own return value',
    /correct up to a dimensionless constant this cannot give/.test(r.note)
    && /ξ took an integration of the gas dynamics/.test(r.note),
    'a caveat that lives only in a comment is a caveat only the author has read');
  ok('and the bench states what it will and will not do before it does any of it',
    /a bench that answers every question has answered none of them/.test(src)
    && /picking one would be inventing physics with a straight face/.test(src)
    && /AND THE CONSTANT IS NEVER GIVEN/.test(src),
    'the three non-answers are documented as answers rather than as error paths');
}

/* 6 ── the control offers one example of each behaviour, not just the happy path */
{ const p = cut('const BENCH={', 'function benchResult');
  ok('the presets are one example of each answer the engine can give',
    /\['Blast wave',/.test(p) && /\['Diffusion',/.test(p) && /\['Mass–energy',/.test(p)
    && /\['Sound speed',/.test(p) && /\['A refusal',\s*\['length','time'\],'length'\]/.test(p)
    && /\['Too free',/.test(p)
    && /a reader who clicks all four has seen the whole behaviour rather\s*\n\s+than the happy path/.test(src),
    'two laws this atlas derived and measured, one it rediscovers from nothing but units, and two refusals');
  ok('and the panel says the same three things the engine does, in the reader’s words',
    /One group and the exponents are determined; none and no relation can exist; two or more and the shape is not determined, so the bench says so rather than choosing/.test(src)
    && /Every law here is correct up to a dimensionless constant it cannot give/.test(src),
    'a control whose caption promises more than the engine delivers is the commonest way an instrument lies');
}

/* 7 ── the answer appears in the lattice as well as in the panel */
ok('the chosen quantities are ringed in the dimension lattice and the group is drawn as a gold loop',
  /function dimSpaceBenchApply\(\)\{/.test(src)
  && /color:k===r\.target\?0xffaa00:0x00f0ff/.test(src)
  && /benchLoop=new THREE\.Line\(new THREE\.BufferGeometry\(\)\.setFromPoints\(pts\),/.test(src)
  && /if\(r\.status!=='determined'\|\|!r\.vector\) return;/.test(src),
  'the abstract answer and the picture are the same object seen twice, which is the only reason to have both');
ok('and the choice is drawn even when the engine refuses, because the choice is worth seeing either way',
  /the choice is worth seeing\s*\n\s+even when the engine refuses/.test(src)
  && src.indexOf('dimSpace.add(benchDots);') < src.indexOf("if(r.status!=='determined'||!r.vector) return;"),
  'the dots are added before the early return that skips the loop');
ok('two points make a segment and not a loop, and the drawing knows it',
  /if\(pts\.length<3\) return;\s+\/\/ two points are a segment, not a loop/.test(src),
  'a closed walk through two lattice points is a line drawn twice, which says nothing about dimensionlessness');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
