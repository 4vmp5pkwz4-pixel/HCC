#!/usr/bin/env node
'use strict';
/* ══ KEPLER COULD WORK OUT THE RATIOS AND COULD NOT HEAR THEM ══════════════════
 *
 * Harmonices Mundi, 1619, Book V: the ratios of the planets' motions are musical.
 * He had the intervals right and no way to sound them. This instrument has the same
 * ratios — from its own JPL element table, not from a second one — and a synthesiser.
 *
 * THE FREQUENCY IS THE ORBIT. A planet whose mean longitude advances at `rate`
 * degrees per Julian century completes 360° in 36000/rate years, so
 *
 *     f = rate / (36000 · 365.25 · 86400)   hertz
 *
 * and nothing else is needed. Mercury is 1.3157e-7 Hz and Pluto 1.2781e-10: the
 * actual pitch of the solar system, and ten octaves of it.
 *
 * TEN OCTAVES IS THE PROBLEM AND OCTAVE FOLDING IS THE HONEST ANSWER. No single
 * transposition makes all nine audible — shift Pluto to 55 Hz and Mercury lands at
 * 72 kHz. Each is therefore multiplied by its OWN power of two, always an integer,
 * until it lands in one octave. That is octave equivalence, which is what a musician
 * means by an interval, and it leaves every ratio exact modulo factors of two.
 *
 * WHAT YOU THEN HEAR IS THE RESONANCE STRUCTURE OF THE OUTER SYSTEM. Jupiter against
 * Saturn is the 5:2 near-commensurability; Neptune against Pluto is the 3:2 they are
 * actually locked in. Those two intervals are why the outer planets sit where they
 * do, and they are the two this check holds against their published values.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

/* the rates are read out of the page's own element table: one authority for an orbit,
   whether it is being drawn or sounded */
const RATE = {};
for (const m of src.matchAll(/\{name:'(\w+)',[^}]*?rate:([\d.]+)/g)) RATE[m[1]] = +m[2];
ok('the rates are read from the page\'s own element table, the same one the orbits are drawn from',
  Object.keys(RATE).length >= 9 && Math.abs(RATE.Mercury - 149472.67411175) < 1e-6,
  `${Object.keys(RATE).length} bodies · a second table of periods would be a second authority for one orbit`);

const H = { day: 86400, year: 365.25, cy: 36000, lo: 220, hi: 440 };
const f = n => RATE[n] / (H.cy * H.year * H.day);
/* the octave count is called `oct`, not `n`: spread into a record whose name field is
   also `n` it silently replaced every planet's name with a number, and the first run
   of this file reported its intervals between 31 and 32 rather than between Mercury
   and Venus. A spread that overwrites a key is a collision with no error attached. */
const fold = x => { let oct = 0, hz = x;
  while (hz < H.lo) { oct++; hz = x * Math.pow(2, oct); }
  while (hz >= H.hi) { oct--; hz = x * Math.pow(2, oct); }
  return { hz, oct }; };

ok('the orbital frequency is the mean-longitude rate and nothing else, and it reproduces the periods',
  Math.abs(36000 / RATE.Earth * H.year - 365.256) < 0.01
  && Math.abs(36000 / RATE.Mercury * H.year - 87.969) < 0.01
  && /rateDegPerCentury\/\(H\.degPerCentury\*H\.daysPerYear\*H\.secondsPerDay\)/.test(src),
  `Earth ${(36000 / RATE.Earth * H.year).toFixed(3)} days, Mercury ${(36000 / RATE.Mercury * H.year).toFixed(3)} — derived, not entered`);

/* ── the fold ────────────────────────────────────────────────────────────────── */
const V = Object.keys(RATE).map(n => ({ n, f: f(n), ...fold(f(n)) }));
ok('every voice is its planet\'s own frequency times an exact integer power of two',
  V.every(v => { const k = Math.log2(v.hz / v.f); return Math.abs(k - Math.round(k)) < 1e-9; }),
  V.slice(0, 4).map(v => `${v.n} ×2^${v.oct}`).join(' · ')
  + ' · a fold that is not a power of two has changed the interval, which is the one thing it may not do');

ok('and they all land inside the one declared octave',
  V.every(v => v.hz >= H.lo - 1e-9 && v.hz < H.hi + 1e-9) && /lowHz:220, highHz:440/.test(src),
  V.map(v => `${v.n} ${v.hz.toFixed(0)}`).join(' · ') + ' Hz');

ok('the span is why no single transposition could have worked',
  (() => { const lo = Math.min(...V.map(v => v.f)), hi = Math.max(...V.map(v => v.f));
    return Math.log2(hi / lo) > 9; })(),
  `${Math.log2(Math.max(...V.map(v => v.f)) / Math.min(...V.map(v => v.f))).toFixed(1)} octaves from Mercury to Pluto — put Pluto at 55 Hz and Mercury is at 72 kHz`);

/* ── the intervals, against published resonances ─────────────────────────────── */
const r = (a, b) => f(a) / f(b);
const fr = (a, b) => { const A = V.find(v => v.n === a), B = V.find(v => v.n === b);
  const m = Math.log2((A.hz / B.hz) / r(a, b)); return Math.abs(m - Math.round(m)) < 1e-9; };
ok('every pair sounds the true ratio up to octaves, which is what an interval is',
  [['Jupiter', 'Saturn'], ['Neptune', 'Pluto'], ['Venus', 'Earth'], ['Earth', 'Mars'],
   ['Mercury', 'Venus'], ['Uranus', 'Neptune']].every(([a, b]) => fr(a, b)),
  'the folded ratio differs from the orbital ratio by an exact power of two for every pair tested');

ok('Jupiter against Saturn is the 5:2 near-commensurability, to better than one per cent',
  Math.abs(r('Jupiter', 'Saturn') / 2.5 - 1) < 0.01,
  `${r('Jupiter', 'Saturn').toFixed(5)} against 5:2 = 2.5, off by ${(100 * Math.abs(r('Jupiter', 'Saturn') / 2.5 - 1)).toFixed(2)}% — the great inequality, and it is audible`);

ok('Neptune against Pluto is the 3:2 they are actually locked in, to better than half a per cent',
  Math.abs(r('Neptune', 'Pluto') / 1.5 - 1) < 0.005,
  `${r('Neptune', 'Pluto').toFixed(5)} against 3:2, off by ${(100 * Math.abs(r('Neptune', 'Pluto') / 1.5 - 1)).toFixed(2)}% — a real mean-motion resonance, not a coincidence of rounding`);

ok('and the check can tell a resonance from a non-resonance, or it is measuring nothing',
  Math.abs(r('Earth', 'Mars') / 2 - 1) > 0.05 && Math.abs(r('Venus', 'Earth') / 1.5 - 1) > 0.05,
  `Earth:Mars is ${r('Earth', 'Mars').toFixed(4)}, nowhere near 2:1 · Venus:Earth is ${r('Venus', 'Earth').toFixed(4)}, nowhere near 3:2`);

/* ── what it does and does not do ────────────────────────────────────────────── */
ok('nothing sounds until a reader asks',
  /if\(state\.harmony\)\{ if\(!hccAudioStart\(\)\)/.test(src)
  && /harmony:false/.test(src)
  && !/^\s*hccAudioStart\(\);/m.test(src.replace(/if\(state\.harmony\)\{ if\(!hccAudioStart\(\)\)[^\n]*/g, '')),
  'a browser would refuse to autoplay it and so does this atlas');

ok('and switching it off tears the graph down rather than muting it',
  /function hccAudioStop\(\)\{/.test(src) && /HCC_AUDIO\.ctx\.close\(\)/.test(src)
  && /HCC_AUDIO=null;/.test(src) && /else hccAudioStop\(\);/.test(src),
  'a silent oscillator is still an oscillator, and a closed context is the only honest off');

ok('the level and the stereo place come from the scene rather than from a preset',
  /const d=v3\.distanceTo\(camera\.position\);/.test(src)
  && /voice\.pan\.pan\.value=THREE\.MathUtils\.clamp\(p\.x,-1,1\)/.test(src)
  && /if\(!o\|\|!o\.mesh\.visible\|\|state\.mode!=='solar'\)\{ voice\.gain\.gain\.value=0; return; \}/.test(src),
  'a planet is louder when the camera is near it and sits where it sits on the screen; silent when it is not being drawn at all');

ok('the low-pass is declared a mixing choice rather than presented as physics',
  /this is a mixing choice and is declared as one/.test(src),
  'nine simultaneous sines read as a chord only with some help, and the help is named');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
