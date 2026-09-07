#!/usr/bin/env node
/* ============================================================================
   DEAD, OR ONLY SILENCED?

   The sensitivity sweep varies one declared input at a time, each from the
   atlas's own defaults, and records whether any output moved. Twenty-five of
   484 inputs moved nothing, and the artifact calls them dead. The verifier that
   guards that artifact is careful about a great deal — it refuses to call a
   REFUSED input dead, refuses to call a TRUNCATED sweep dead, keeps the four
   classes disjoint — and it never once asks whether an input that measured dead
   OUGHT to be.

   IT OUGHT NOT, AT LEAST ONCE, AND THE CASE IS PROVEN HERE RATHER THAN ARGUED.
   The main-sequence laboratory declares giant_brightening over 1 to 1000. The
   sweep calls it dead. It is not: hrGiantLight scales its giant light and its
   ratio linearly with that argument, a factor of a thousand across the declared
   domain. What silences it is a SECOND input — giant_window_fraction, whose
   default is zero. With no window there are no giants, and a thousand times no
   light is still no light.

   So the sweep measured correctly and the artifact reports it wrongly. A
   one-at-a-time walk from defaults cannot tell an input that does nothing from
   an input whose effect another input's default has switched off, and calling
   both "dead" asserts the first when only the second was observed.

   That distinction matters beyond tidiness. "Dead" invites deletion, and this
   knob is the difference between a mass-to-light ratio that counts giants and
   one that does not — which is the whole subject of the laboratory it sits in.

   This file shares no code with the atlas: hrGiantLight is reimplemented from
   its own declared formulas below, so the demonstration does not depend on the
   thing it is demonstrating about.

   SIX THINGS ARE CHECKED.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const ART = path.join(__dirname, '..', 'api', 'sensitivity.json');
const SRC = path.join(__dirname, '..', 'index.html');
const doc = JSON.parse(fs.readFileSync(ART, 'utf8'));
const src = fs.readFileSync(SRC, 'utf8');

const deadRows = [];
for (const inst of doc.instruments || []) for (const r of inst.rows || []) if (r.dead) deadRows.push(`${inst.id}.${r.input}`);

console.log('\n=== 1-2. What the artifact says ===\n');

ok('THE ARTIFACT DECLARES SOME INPUTS DEAD, and the count is read from the rows rather than from the header, so a header that had drifted from its own contents could not pass this by agreeing with itself',
  deadRows.length === doc.counts.dead && deadRows.length > 0,
  `${deadRows.length} inputs measured to move nothing, recomputed from the rows against a header saying ${doc.counts.dead}`);

ok('and giant_brightening is among them, which is the case this file exists to examine',
  deadRows.includes('mainseq.giant_brightening'),
  'mainseq.giant_brightening is recorded as moving nothing');

console.log('\n=== 3-5. What the source says, computed here ===\n');

/* hrGiantLight rebuilt from the declared formulas rather than imported */
const IMF = m => Math.pow(m, -2.35);
const LUM = m => m < 0.43 ? 0.23 * Math.pow(m, 2.3) : m < 2 ? Math.pow(m, 4) : 1.4 * Math.pow(m, 3.5);
const EPS = 0.007, FC = 0.1, MSUN = 1.989e30, C = 2.998e8, LSUN = 3.828e26, GYR = 3.156e16;
const lifeGyr = m => EPS * FC * m * MSUN * C * C / (LUM(m) * LSUN) / GYR;
const turnoff = a => { let lo = 0.05, hi = 200;
  for (let i = 0; i < 200; i++) { const m = Math.sqrt(lo * hi); if (lifeGyr(m) > a) lo = m; else hi = m; }
  return Math.sqrt(lo * hi); };
function giantLight(ageGyr, windowFraction, brightening) {
  const mto = turnoff(ageGyr);
  const w = (windowFraction || 0) * lifeGyr(mto);
  const mHi = turnoff(Math.max(1e-9, ageGyr - w));
  let msLight = 0, giantN = 0;
  const lo = 0.1, hi = 100, N = 4000, dx = (Math.log(hi) - Math.log(lo)) / N;
  for (let i = 0; i < N; i++) {
    const m = Math.exp(Math.log(lo) + dx * (i + 0.5)), wt = IMF(m) * m * dx;
    if (m <= mto) msLight += wt * LUM(m);
    else if (m <= mHi) giantN += wt;
  }
  const giantLightTotal = giantN * brightening;
  return { msLight, giantLight: giantLightTotal, ratio: msLight > 0 ? giantLightTotal / msLight : 0 };
}

ok('THE PARAMETER IS NOT INERT. Across its declared domain of 1 to 1000, the giant light it produces scales linearly — a factor of a thousand — whenever there is any window for giants to occupy at all',
  (() => { const a = giantLight(10, 0.10, 1), b = giantLight(10, 0.10, 1000);
    return b.giantLight > 0 && Math.abs(b.giantLight / a.giantLight - 1000) / 1000 < 0.01; })(),
  `at a 10 per cent window: ${giantLight(10, 0.10, 1).giantLight.toExponential(3)} against ${giantLight(10, 0.10, 1000).giantLight.toExponential(3)} — a factor of ${(giantLight(10, 0.10, 1000).giantLight / giantLight(10, 0.10, 1).giantLight).toFixed(0)}`);

ok('AND WHAT SILENCES IT IS ANOTHER INPUT\'S DEFAULT. giant_window_fraction is declared with a default of zero; with no window there are no giants, and a thousand times no light is still no light. The sweep held it at zero because that is the default, and so measured a parameter multiplied by nothing',
  (() => { const a = giantLight(10, 0, 1), b = giantLight(10, 0, 1000);
    return a.giantLight === 0 && b.giantLight === 0; })(),
  `at the declared default window of zero: ${giantLight(10, 0, 1).giantLight} and ${giantLight(10, 0, 1000).giantLight} — identical, for every value of the swept input`);

ok('and the default really is zero in the source, read out of the declaration rather than assumed from the behaviour — otherwise this file would be explaining a coincidence',
  /\{name:'giant_window_fraction',[^}]*default:0[,}]/.test(src),
  'the declaration carries default:0, so the sweep had no window to give the giants');

console.log('\n=== 6. The distinction the artifact cannot make ===\n');

ok('SO THE SWEEP MEASURED CORRECTLY AND THE ARTIFACT REPORTS IT WRONGLY. A one-at-a-time walk from defaults cannot separate an input that does nothing from an input another input\'s default has switched off, and recording both as "dead" asserts the first where only the second was seen. The distinction is not tidiness: "dead" invites deletion, and this knob is the difference between a mass-to-light ratio that counts giants and one that does not — the whole subject of the laboratory it sits in',
  (() => {
    /* the demonstration in one line: the same input, dead at the default
       co-value and alive at any other, with nothing else changed */
    const atDefault = giantLight(10, 0, 1000).giantLight - giantLight(10, 0, 1).giantLight;
    const offDefault = giantLight(10, 0.10, 1000).giantLight - giantLight(10, 0.10, 1).giantLight;
    return atDefault === 0 && offDefault > 0;
  })(),
  `moving the input changes the output by ${(giantLight(10, 0, 1000).giantLight - giantLight(10, 0, 1).giantLight)} at the swept configuration and by ${(giantLight(10, 0.10, 1000).giantLight - giantLight(10, 0.10, 1).giantLight).toExponential(3)} one step away from it`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
