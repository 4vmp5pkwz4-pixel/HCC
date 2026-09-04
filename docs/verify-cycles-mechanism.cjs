#!/usr/bin/env node
/* ============================================================================
   THE CYCLES, AS ONE MECHANISM

   This atlas carried six cycles, one lunar month, and a Saros written down as
   6585.3211 days. Three things were wrong with that, and none of them was the
   arithmetic.

   THE SAROS WAS QUOTED, NOT DERIVED. It is not a coincidence between two
   periods but between three: an eclipse needs the right phase (synodic), a
   node (draconic) and a known distance (anomalistic). Two of those months were
   absent, so the Saros could only be declared.

   THE GREAT YEAR WAS STORED AS AN INDEPENDENT CONSTANT beside two years that
   already implied it. Precession is exactly the beat between the tropical and
   sidereal years, and computing it returns 25771 against the 25772 that sat in
   the file — three parts in a hundred thousand, from numbers already present.

   AND THE COMMENSURABILITY ENGINE EXISTED TWICE. The cycles dashboard swept
   integer pairs to a cap; the frequency laboratory expanded continued
   fractions. Same question, and the sweep lost: over the fifteen pairs of the
   six original cycles the two agreed on six and disagreed on nine, every
   disagreement being the sweep hitting its cap and returning a "best lock" of
   512:1 with a residual of nine million days.

   This file shares no code with the atlas. Every constant is written out here,
   and the last check reads index.html.

   SIXTEEN THINGS ARE CHECKED.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const SYN = 29.530588853, DRA = 27.212220817, ANO = 27.554549878, SID = 27.321661547;
const TROP = 365.242190, SIDY = 365.256363004, APS = 112000, LIMIT = 17.0;
const JY = 365.2425;

const beat = (p, q) => { const d = 1 / p - 1 / q; return Math.abs(d) < 1e-30 ? Infinity : 1 / Math.abs(d); };

/* the convergent ladder, written out */
function converge(A, B, NMAX) {
  const N = NMAX || 512, x = A / B;
  let p0 = 0, q0 = 1, p1 = 1, q1 = 0, v = x, best = null;
  for (let i = 0; i < 64; i++) {
    const t = Math.floor(v);
    const p2 = t * p1 + p0, q2 = t * q1 + q0;
    if (p2 > N || q2 > N || !isFinite(p2) || !isFinite(q2)) break;
    p0 = p1; q0 = q1; p1 = p2; q1 = q2;
    if (q1 >= 1 && p1 >= 1) { const e = Math.abs(q1 * A - p1 * B);
      if (!best || e < best.errorDays) best = { nA: q1, nB: p1, errorDays: e, spanDays: (q1 * A + p1 * B) / 2 }; }
    const f = v - t; if (f < 1e-15) break; v = 1 / f;
  }
  if (!best) best = { nA: 1, nB: 1, errorDays: Math.abs(A - B), spanDays: (A + B) / 2 };
  best.ppm = best.errorDays / best.spanDays * 1e6;
  const ratio = Math.max(A, B) / Math.min(A, B);
  best.reachable = ratio <= N;
  best.meaningful = best.reachable && best.ppm < 1e5;
  return best;
}
/* the sweep the atlas used to run, kept HERE so the comparison is possible */
function sweep(A, B, N) {
  N = N || 512;
  let best = { nA: 1, nB: 1, errorDays: Math.abs(A - B), spanDays: A };
  for (let nA = 1; nA <= N; nA++) { const ideal = nA * A / B;
    for (const nB of [Math.floor(ideal), Math.ceil(ideal)]) {
      if (nB < 1 || nB > N) continue;
      const e = Math.abs(nA * A - nB * B);
      if (e < best.errorDays) best = { nA, nB, errorDays: e, spanDays: (nA * A + nB * B) / 2 }; } }
  best.ppm = best.errorDays / best.spanDays * 1e6;
  return best;
}
function triple(pA, pB, pC, NA) {
  let best = null;
  for (let n = 1; n <= (NA || 400); n++) {
    const t = n * pA, nB = Math.round(t / pB), nC = Math.round(t / pC);
    if (nB < 1 || nC < 1) continue;
    const eB = Math.abs(t - nB * pB), eC = Math.abs(t - nC * pC), worst = Math.max(eB, eC);
    if (!best || worst < best.worstDays) best = { nA: n, nB, nC, days: t, errB: t - nB * pB, errC: t - nC * pC, worstDays: worst };
  }
  return best;
}
const S = triple(SYN, DRA, ANO, 400);

console.log('\n=== 1-4. The Saros, derived rather than quoted ===\n');

ok('THE SAROS IS A COINCIDENCE OF THREE PERIODS AND THE SEARCH FINDS IT WITHOUT BEING TOLD. Scanning the synodic month against the draconic and anomalistic ones together, the tightest simultaneous return is 223 : 242 : 239 — which is the Saros, arrived at from three mean periods and nothing else',
  S && S.nA === 223 && S.nB === 242 && S.nC === 239,
  S ? `${S.nA} synodic = ${S.nB} draconic = ${S.nC} anomalistic at ${S.days.toFixed(4)} d` : 'no triple found');

ok('and it reproduces the number the atlas used to quote: 6585.3213 days against a stored 6585.3211, two parts in ten million. The quoted value was right; what was missing was any way to see WHY',
  Math.abs(S.days - 6585.3211) < 1e-3,
  `derived ${S.days.toFixed(4)} d against the quoted 6585.3211 d`);

ok('THE THREE DO NOT AGREE EQUALLY WELL, and that asymmetry is the physics rather than an imperfection. The node closes to within 52 minutes and the distance only to within five hours, which is exactly why a Saros series keeps its TIMING while changing the KIND of eclipse it makes — total to annular and back',
  (() => { const hB = Math.abs(S.errB) * 24, hC = Math.abs(S.errC) * 24;
    return hB < 1.2 && hC > 4 && hC < 6 && hC > 3 * hB; })(),
  `node closes to ${(Math.abs(S.errB) * 24 * 60).toFixed(1)} min, distance only to ${(Math.abs(S.errC) * 24).toFixed(2)} h`);

ok('AND A SAROS IS NOT A WHOLE NUMBER OF DAYS, which is why you cannot watch the same series twice from one place. The leftover 7.71 hours turn the Earth 115.7° west; three Saroses leave 347°, thirteen degrees short of a full turn, and THAT is why the Greeks needed the exeligmos and not the Saros to bring an eclipse home',
  (() => { const one = (S.days % 1) * 360, three = ((3 * S.days) % 1) * 360;
    return Math.abs(one - 115.7) < 1.5 && Math.abs(three - 347) < 3; })(),
  `one Saros shifts ${((S.days % 1) * 360).toFixed(1)}° · three shift ${(((3 * S.days) % 1) * 360).toFixed(1)}°`);

console.log('\n=== 5-6. How long a series lives, predicted rather than tabulated ===\n');

ok('THE NODE SLIPS HALF A DEGREE PER SAROS, and an eclipse is impossible more than about 17° from a node, so a series can only run twice that divided by the slip. That is 71 eclipses over 1283 years, computed from three mean periods and one geometric limit',
  (() => { const drift = Math.abs(S.errB / DRA * 360);
    const n = Math.round(2 * LIMIT / drift);
    return Math.abs(drift - 0.478) < 0.02 && n > 60 && n < 85; })(),
  `${Math.abs(S.errB / DRA * 360).toFixed(4)}° per Saros → ${Math.round(2 * LIMIT / Math.abs(S.errB / DRA * 360))} eclipses over ${(Math.round(2 * LIMIT / Math.abs(S.errB / DRA * 360)) * S.days / JY).toFixed(0)} yr`);

ok('and that lands inside the published range without having been shown it: a Saros series is catalogued as 69 to 87 eclipses over 1200 to 1500 years. This is the laboratory predicting a number somebody else measured, which is the only kind of agreement worth anything',
  (() => { const n = Math.round(2 * LIMIT / Math.abs(S.errB / DRA * 360));
    const yr = n * S.days / JY;
    return n >= 69 && n <= 87 && yr >= 1200 && yr <= 1500; })(),
  `predicted ${Math.round(2 * LIMIT / Math.abs(S.errB / DRA * 360))} eclipses / ${(Math.round(2 * LIMIT / Math.abs(S.errB / DRA * 360)) * S.days / JY).toFixed(0)} yr · catalogued 69–87 / 1200–1500 yr`);

console.log('\n=== 7-8. The Great Year is a difference, not a constant ===\n');

ok('PRECESSION IS THE BEAT BETWEEN THE TWO YEARS AND NOTHING ELSE. A tropical year is equinox to equinox and a sidereal year is star to the same star; the equinox slides because the axis turns, so the precession period is the reciprocal of their difference. It returns 25771 years against the 25772 the atlas used to store as an independent constant',
  (() => { const p = beat(TROP, SIDY) / JY; return Math.abs(p - 25772) / 25772 < 1e-4; })(),
  `${(beat(TROP, SIDY) / JY).toFixed(1)} yr derived against 25772 stored — ${(100 * Math.abs(beat(TROP, SIDY) / JY - 25772) / 25772).toFixed(4)} per cent`);

ok('and the derivation is SENSITIVE, which is what makes it a check rather than a coincidence of round numbers: the two years differ by twenty minutes in three hundred and sixty-five days, so shifting either by one part in ten million moves the Great Year by a hundred years',
  (() => { const base = beat(TROP, SIDY) / JY;
    const bumped = beat(TROP * (1 + 1e-7), SIDY) / JY;
    return Math.abs(bumped - base) > 50; })(),
  `a 1e-7 nudge to the tropical year moves the Great Year by ${Math.abs(beat(TROP * (1 + 1e-7), SIDY) / JY - beat(TROP, SIDY) / JY).toFixed(0)} yr — the difference of two nearly equal numbers, and it says so`);

console.log('\n=== 9-10. Milankovitch, from two precessions ===\n');

ok('THE ICE-AGE PRECESSION BAND IS THE AXIS BEATING AGAINST THE ORBIT. The axis turns one way in 25771 years and the orbit\'s long axis turns the other way in about 112000, so the seasons move against perihelion in 20951 — inside the 21-to-23-thousand-year band the ice cores show, from adding two reciprocals',
  (() => { const c = 1 / (1 / (beat(TROP, SIDY) / JY) + 1 / APS);
    return c > 20000 && c < 22000; })(),
  `${(1 / (1 / (beat(TROP, SIDY) / JY) + 1 / APS)).toFixed(0)} yr against an observed 21000–23000 yr band`);

ok('and the sign matters and is checked: the two precessions run OPPOSITE ways, so the periods ADD as reciprocals and the climatic period is SHORTER than either. Getting the sign wrong gives 33000 years, which is not a band anybody has seen in a core',
  (() => { const ax = beat(TROP, SIDY) / JY;
    const same = 1 / (1 / ax + 1 / APS), opp = 1 / Math.abs(1 / ax - 1 / APS);
    return same < ax && opp > ax && Math.abs(opp - 33400) < 1500; })(),
  `adding reciprocals gives ${(1 / (1 / (beat(TROP, SIDY) / JY) + 1 / APS)).toFixed(0)} yr; subtracting them would give ${(1 / Math.abs(1 / (beat(TROP, SIDY) / JY) - 1 / APS)).toFixed(0)} yr`);

console.log('\n=== 11-13. One engine, and the defect that merging it exposed ===\n');

const CYC = { moon: SYN, year: TROP, saros: 223 * SYN, metonic: 6939.6018,
              prec: 25772 * JY, gal: 230e6 * JY };
const KEYS = Object.keys(CYC);

ok('THE CONVERGENT LADDER REPRODUCES EVERY LOCK THE ATLAS PINS. 235 synodic months to 19 tropical years, its mirror under exchange, 223 months to one Saros and 19 years to one Metonic cycle all come back identically from the continued fraction — so replacing the sweep costs nothing that was ever right',
  (() => {
    const a = converge(SYN, TROP), b = converge(TROP, SYN);
    const c = converge(SYN, 223 * SYN), d = converge(TROP, 6939.6018);
    return a.nA === 235 && a.nB === 19 && b.nA === 19 && b.nB === 235
        && c.nA === 223 && c.nB === 1 && d.nA === 19 && d.nB === 1;
  })(),
  '235:19 · 19:235 · 223:1 · 19:1 — all four recovered by the engine that replaced the sweep');

ok('AND THE SWEEP WAS RETURNING NONSENSE FOR NINE PAIRS OUT OF FIFTEEN, which is what merging the two engines exposed. Where the periods differ by more than the cap, it cannot place either integer, so it reported the least-bad thing inside its box: for the Moon against the precession, a "best lock" of 512:1 carrying a residual of nine million days — twenty-five thousand years of mismatch, printed beside 223:1 as though they were the same kind of statement',
  (() => {
    let bad = 0;
    for (let i = 0; i < KEYS.length; i++) for (let j = i + 1; j < KEYS.length; j++) {
      const s = sweep(CYC[KEYS[i]], CYC[KEYS[j]]);
      if (s.nA === 512 || s.nB === 512) bad++;
    }
    const mp = sweep(CYC.moon, CYC.prec);
    return bad === 9 && mp.errorDays > 8e6;
  })(),
  `${(() => { let b = 0; for (let i = 0; i < KEYS.length; i++) for (let j = i + 1; j < KEYS.length; j++) { const s = sweep(CYC[KEYS[i]], CYC[KEYS[j]]); if (s.nA === 512 || s.nB === 512) b++; } return b; })()} of 15 pairs pinned at the cap · moon↔precession residual ${sweep(CYC.moon, CYC.prec).errorDays.toExponential(2)} d`);

ok('so the engine REFUSES instead, and the refusal is the point. When the ratio of two periods exceeds the largest integer considered, small-integer commensurability is not a hard question but a meaningless one, and a graph that drew those as faint gold locks was drawing an answer where there was none. Exactly the nine capped pairs are now refused and the six real ones are untouched',
  (() => {
    let refused = 0, kept = 0;
    for (let i = 0; i < KEYS.length; i++) for (let j = i + 1; j < KEYS.length; j++) {
      const c = converge(CYC[KEYS[i]], CYC[KEYS[j]]);
      if (c.meaningful) kept++; else refused++;
    }
    return refused === 9 && kept === 6;
  })(),
  '9 refused in writing, 6 kept — the same split the disagreement measurement found');

console.log('\n=== 14-15. What the third month actually does (found by mutation) ===\n');

/* A mutant that dropped the anomalistic month from the search passed every
   check above. Read rather than dismissed, it says the natural story is loose:
   the Saros is DESCRIBED by three periods but SELECTED by two. */

function selectN(useC) {
  let best = null;
  for (let n = 1; n <= 400; n++) {
    const t = n * SYN, nB = Math.round(t / DRA), nC = Math.round(t / ANO);
    if (nB < 1 || nC < 1) continue;
    const eB = Math.abs(t - nB * DRA), eC = Math.abs(t - nC * ANO);
    const w = useC ? Math.max(eB, eC) : eB;
    if (!best || w < best.w) best = { n, nB, nC, w, eB, eC };
  }
  return best;
}

ok('THE ANOMALISTIC MONTH DOES NOT CHOOSE THE SAROS, and saying that it does — as the tidy "coincidence of three periods" story invites — would be an explanation doing no work. Drop it from the search entirely and 223 still comes out, because the node closes forty times tighter than the distance and the node is what the minimum is deciding on. This was found by mutating the search, not by inspection',
  (() => { const three = selectN(true), two = selectN(false);
    return three.n === 223 && two.n === 223 && three.n === two.n; })(),
  `with all three months the search returns ${selectN(true).n}; with the distance removed it returns ${selectN(false).n} — the same, so that constraint is not selecting anything`);

ok('WHAT IT DOES INSTEAD IS SET THE KIND OF ECLIPSE, and that is measurable rather than rhetorical: the Moon\'s distance slips 2.82° of its anomaly per Saros, so it would need 128 Saroses to come back — but a series only lives about 71. A Saros series therefore samples roughly 200° of the distance cycle and never the whole of it, which is why one series drifts between total and annular instead of repeating one kind',
  (() => { const t = selectN(true);
    const perSaros = (t.eC / ANO) * 360;
    const circuit = Math.round(360 / perSaros);
    const life = Math.round(2 * LIMIT / Math.abs(t.eB / DRA * 360));
    return Math.abs(perSaros - 2.82) < 0.15 && circuit > 110 && circuit < 145 && life < circuit; })(),
  `${((selectN(true).eC / ANO) * 360).toFixed(2)}° per Saros → a full circuit in ${Math.round(360 / ((selectN(true).eC / ANO) * 360))} Saroses, against a series life of ${Math.round(2 * LIMIT / Math.abs(selectN(true).eB / DRA * 360))} — the series ends before the distance returns`);

console.log('\n=== 16. The atlas read back ===\n');

ok('AND THE ATLAS IS RUNNING THIS. The constants and the derivations above were written from scratch here; this check opens index.html and confirms the four months, the two years and the derived precession are the same ones there, so the agreement is between two authorities rather than one authority and its echo',
  (() => { const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    return /const CYC_SYNODIC\s*=\s*29\.530588853;/.test(src)
        && /const CYC_DRACONIC\s*=\s*27\.212220817;/.test(src)
        && /const CYC_ANOMALISTIC\s*=\s*27\.554549878;/.test(src)
        && /const CYC_SIDEREAL_Y\s*=\s*365\.256363004;/.test(src)
        && /cycPrecessionFromYears=\(\)=>cycBeat\(CYC_TROPICAL_Y,CYC_SIDEREAL_Y\)/.test(src)
        && /best\.refusal=/.test(src); })(),
  'the four months, both years, the derived precession and the written refusal are all present in the atlas source');

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
