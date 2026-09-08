#!/usr/bin/env node
'use strict';
/* THE ENGINE REPORTED HOW TIGHT A LOCK IS AND NEVER HOW CHEAPLY IT WAS BOUGHT.
 *
 * Tightness cannot separate a resonance from an accident, because tightness is
 * GUARANTEED. For any two periods whatsoever, a convergent with integers p and q
 * misses by an amount of order B/q, which in parts per million of the span is about
 *
 *     1e6 / (p·q)
 *
 * That is Dirichlet's approximation theorem read in this atlas's own units — a
 * theorem, not a fitted rule. So the web labelling 497:499 at 2.4 ppm was labelling
 * exactly what integers that size buy for any pair at all, and giving it the same
 * standing as the Metonic cycle, which locks to 26 ppm with integers twenty-five
 * times smaller and is eight times better than its size buys.
 *
 * Measured over the seven fundamental periods, ranked by that ratio:
 *
 *   draconic × anomalistic   159:161   1.3 ppm    29× better than its size buys
 *   synodic  × anomalistic   269:251   0.5 ppm    28×
 *   synodic  × sidereal year  19:235  26.3 ppm     8.5×   ← the Metonic cycle
 *   draconic × sidereal month 497:499  2.4 ppm     1.7×   ← at chance
 *   synodic  × draconic       535:493  2.9 ppm     1.3×   ← at chance
 *   draconic × tropical year  569:230 30.2 ppm     0.3×   ← WORSE than chance
 *
 * The web was labelling all six. It labels what beats chance by an order of
 * magnitude now, and the label carries the ratio, so a reader is told how much
 * better than chance a lock is rather than asked to take a gold line on trust.
 *
 * AND THE STATISTIC HAD A DEFECT THAT MEASURING FOUND. Where one integer is 1 there
 * is no approximation happening — the claim is "A is n times B", a statement about
 * magnitude — and the scale does not apply. Computing it there produced surprise
 * values up to 1.9 MILLION, which sorted straight to the top of a list meant to rank
 * resonances. Those pairs are excluded and named for what they are.
 *
 * Rendered: the resonance frame fell from 84 visible labels to 47.
 */
const fs = require('node:fs'), path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
/* a failing check must not print the sentence written for the passing case */
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

ok('the engine publishes the Dirichlet scale beside the tightness, not tightness alone',
  /best\.dirichlet=best\.oneSided\?null:1e6\/Math\.max\(1,best\.nA\*best\.nB\)/.test(src)
  && /best\.surprise=/.test(src),
  'how tight is not how surprising, and only the second is evidence');
ok('and it refuses to compute the ratio where one integer is 1, because no approximation is happening there',
  /best\.oneSided=Math\.min\(best\.nA,best\.nB\)===1;/.test(src)
  && /best\.surprise=\(best\.oneSided\|\|!\(best\.ppm>0\)\)\?null:/.test(src),
  'that case produced surprise values up to 1.9 million and topped the ranking');

/* AND THE NEGATIVE HALF MUST BE SCOPED TO THE RULE, NOT TO THE FILE. The first form
   asserted that "tight>0.55" appears nowhere in index.html — and it appears in the
   comment that EXPLAINS why the rule changed, so the check failed on a correct file.
   A negative test over a whole document also forbids writing about the thing. */
const labelRule = src.slice(src.indexOf('const surprising='), src.indexOf('resoEdges.push('));
ok('the web labels what beats chance by an ORDER OF MAGNITUDE, not what is merely tight',
  /const surprising=Number\.isFinite\(c\.surprise\)&&c\.surprise>=10;/.test(src)
  && !/tight>0\.55/.test(labelRule),
  'the old rule promoted 497:499 and 535:493, which are at chance');
ok('and the label carries the ratio, so the claim is legible instead of implied by a colour',
  /better than integers this size buy/.test(src),
  'a reader is told how much better than chance the lock is');
ok('an exact lock and a lock by construction are still always named',
  /if\(c\.exact\|\|constructed\|\|surprising\)\{/.test(src),
  'those are not competing with chance — one is a definition read back and the other is exact');

/* the reasoning is in the file where the next reader will meet it, not only here */
ok('Dirichlet is named in the source as the reason, rather than the threshold appearing as taste',
  /Dirichlet's approximation theorem read in this atlas's own units/.test(src),
  'a threshold with no stated basis is a preference wearing a number');

/* ── AND THE VERDICT REACHES THE READER, NOT ONLY THE WEB ────────────────── */
ok('the three readouts a reader opens carry the verdict, not just the edge label',
  (src.match(/cycSurpriseText\(c,a,b\)/g) || []).length >= 3,
  'the linked view’s own text, the linked panel’s bounded ratio, and the resonance panel’s best lock');
ok('and the "tightest locks" row is COMPUTED rather than typed beside the engine that computes it',
  /function cycMostSurprisingLocks/.test(src)
  && !/'Tightest locks','moon:Saros 223:1/.test(src)
  && /Most surprising locks/.test(src),
  'a hand-written list ranked by the criterion this file just showed cannot tell a resonance from an accident');
ok('the ranking reports what it EXCLUDED, because a ranking that quietly drops rows cannot be checked',
  /out\.stipulated=\(out\.stipulated\|\|0\)\+1/.test(src)
  && /excluded for resting on a period carried as a whole number of years/.test(src),
  'sixteen of forty pairs rest on a stipulated period');

/* ── A THIRD WAY A LOCK IS ARITHMETIC, AND THE TEST IS EXACTNESS ──────────── */
ok('a lock resting on a period carried as a whole number of years is named as arithmetic',
  /ARITHMETIC, NOT A RESONANCE/.test(src) && /function cycRoundYears/.test(src),
  'the solar cycle is 11 years because somebody wrote 11, not because anybody measured it to seven figures');
ok('and the test is EXACTNESS, not smallness — a tolerance for near-misses catches the Metonic',
  /const CYC_ROUND_YEAR_PPM=1e-6;/.test(src)
  && /float noise, not a tolerance for near-misses/.test(src),
  'the Metonic sits 0.82 ppm from nineteen years and that is the discovery, not a convention');
ok('and the unit itself is not a stipulation',
  /if\(n<2\) return null;/.test(src),
  'the tropical year is 0.9999992 of a tropical year, and flagging it silenced the verdict on most pairs');

/* ── AND THE SEPARATION IS MEASURED, NOT ASSERTED ─────────────────────────── */
(async () => {
  try {
    const K = await import('../core/atlas/extracted.mjs');
    const yearsOf = k => { const c = K.cycleByKey(k); const y = c.days / 365.2425;
      return { y, n: Math.round(y), rel: Math.abs(y - Math.round(y)) / Math.max(1, Math.round(y)) * 1e6 }; };
    const stipulated = ['solar', 'hale', 'obliq', 'eccS', 'eccL', 'gal'].map(yearsOf);
    const measured = ['mercperi', 'metonic', 'prec', 'saros'].map(yearsOf);
    const worstStipulated = Math.max(...stipulated.map(x => x.rel));
    const closestMeasured = Math.min(...measured.map(x => x.rel));
    ok('every stipulated period lands on its integer EXACTLY, and the nearest measured one is orders of magnitude away',
      worstStipulated === 0 && closestMeasured > 0.1,
      `stipulated: all ${stipulated.length} at ${worstStipulated} ppm from the integer · `
      + `nearest measured: ${closestMeasured.toFixed(3)} ppm — the line at 1e-6 separates them with six orders of margin`);
    const met = yearsOf('metonic');
    ok('and the Metonic cycle is on the MEASURED side of that line, where it belongs',
      met.rel > 1e-6 && met.n === 19,
      `metonic = ${met.y.toFixed(9)} yr, ${met.rel.toFixed(3)} ppm from 19 — nineteen years to within a few hours, which is the discovery`);
  } catch (e) {
    ok('the stipulated/measured separation is measured from the sliced kernels', false, 'could not evaluate: ' + e.message);
  }
  console.log('\n' + (fail ? ('✖ ' + fail + ' FAILED, ' + pass + ' passed') : ('✔ ALL ' + pass + ' CHECKS PASSED')));
  process.exit(fail ? 1 : 0);
})();
