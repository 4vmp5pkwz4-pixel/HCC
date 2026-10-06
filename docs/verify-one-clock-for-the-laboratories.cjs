#!/usr/bin/env node
'use strict';
/* ══ ONE CLOCK FOR THE LABORATORIES, AND THE PHASE PORTRAIT OF ANY OF THEM ═══════════════
 * Checks the source and the extracted kernels:
 *   1. every laboratory the router drives runs on labDt = dt·k — no routed laboratory is left on
 *      the raw dt — and k is computed once per frame before the chain
 *   2. k, lifted and run here: 1 when uncoupled; the ratio of the time machine's rate to the rate
 *      at coupling; 0 when paused and for negative rates; capped at 10⁶
 *   3. no routed laboratory can hang on a huge step: the only accumulator loop bounds its count, and
 *      the integrators clamp their own step
 *   4. the correlation dimension (Grassberger–Procaccia) on sets built HERE: a circle ≈ 1, a filled
 *      square ≈ 2, a Takens delay embedding of a sine ≈ 1, a two-frequency quasi-periodic signal
 *      embedded in 2-D fills toward 2
 *   5. wiring: the portrait reads the scene or the bus, embeds by delay, names the stroboscope, and is
 *      reachable from the laboratory panel and the toolbox
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { ppCorrelationDimension, LAB_CLOCK_MAX } = K;

  /* 1 · the router */
  { const a = SRC.indexOf("const labDt=dt*labClockFactor(); try{ ppTick(); }catch(e){}"), b = SRC.indexOf("\n    }\n", SRC.indexOf("} else if(state.s3view==='bbh'){", a)), chain = SRC.slice(a, b);
    const onLab = (chain.match(/fbsAnimT\+=labDt; update\w+\(labDt\);/g) || []).length, onRaw = (chain.match(/fbsAnimT\+=dt; update\w+\(dt\);/g) || []).length;
    ok('every laboratory the router drives runs on labDt = dt·k, computed once per frame before the chain; none is left on the raw dt', a > 0 && onLab >= 108 && onRaw === 0, `${onLab} routed on labDt · ${onRaw} on raw dt`); }

  /* 2 · k, run here */
  { const f = SRC.slice(SRC.indexOf('function labClockFactor(){'), SRC.indexOf('/* the correlation sum C(r)'));
    const k = st => new Function('state', 'LAB_CLOCK_MAX', 'LAB_CLOCK_REF', f + ';return labClockFactor();')(st, LAB_CLOCK_MAX, 10);
    const r = [k({ labClock: false, daysPerSec: 1e5 }), k({ daysPerSec: 10 }), k({ daysPerSec: 3650 }), k({ paused: true, daysPerSec: 3650 }), k({ daysPerSec: 3650, timeDir: -1 }), k({ daysPerSec: 1 }), k({ daysPerSec: 1e12 })];
    ok('k (coupled by default since v4.368): 1 when the reader frees the laboratories; the rate over the default 10 days/s — ×1 at the default, ×365 at a year a second, ×0.1 at a day a second; 0 paused; a reversed clock runs them forward at the same speed; capped at 10⁶',
      r.join() === [1, 1, 365, 0, 365, 0.1, 1e6].join(), r.join(' · ')); }

  /* 3 · no hang */
  { const loops = [...SRC.matchAll(/while\(acc>=fixed&&n<(\d+)\)/g)].map(m => +m[1]), clamps = (SRC.match(/Math\.min\(dt,\s*\.?0?\.05\)/g) || []).length;
    ok('no routed laboratory can hang on a huge step: the one accumulator loop bounds its count and the integrators clamp their own step', loops.length === 1 && loops[0] <= 16 && clamps >= 3, `accumulator bound ${loops[0]} · ${clamps} step clamps`); }

  /* 4 · the correlation dimension */
  { let s = 7; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const circle = Array.from({ length: 600 }, () => { const t = 2 * Math.PI * rnd(); return [0.5 + 0.45 * Math.cos(t), 0.5 + 0.45 * Math.sin(t)]; });
    const square = Array.from({ length: 600 }, () => [rnd(), rnd()]);
    const sine = []; for (let n = 0; n < 606; n++) sine.push(Math.sin(0.137 * n)); const emb = sine.slice(6).map((x, i) => [0.5 + 0.45 * x, 0.5 + 0.45 * sine[i]]);
    const q = []; for (let n = 0; n < 1206; n++) q.push(Math.sin(0.137 * n) + Math.sin(0.137 * Math.SQRT2 * n * 1.618)); const qe = q.slice(6).map((x, i) => [(x + 2) / 4, (q[i] + 2) / 4]).slice(0, 600);
    const Dc = ppCorrelationDimension(circle, 0.02, 0.08), Ds = ppCorrelationDimension(square, 0.02, 0.08), De = ppCorrelationDimension(emb, 0.02, 0.08), Dq = ppCorrelationDimension(qe, 0.02, 0.08);
    ok('the correlation dimension on sets built here: a circle ≈ 1, a filled square ≈ 2, a delay-embedded sine ≈ 1, a quasi-periodic signal fills beyond a curve',
      Math.abs(Dc - 1) < 0.25 && Math.abs(Ds - 2) < 0.3 && Math.abs(De - 1) < 0.3 && Dq > 1.3, `circle ${Dc.toFixed(2)} · square ${Ds.toFixed(2)} · sine ${De.toFixed(2)} · quasi-periodic ${Dq.toFixed(2)}`); }

  /* 5 · wiring */
  ok('wiring: the portrait reads the moving parts of the scene or the bus, embeds by delay, names the stroboscope, and is reachable from the laboratory panel and the toolbox',
    /function ppSceneSample\(\)\{/.test(SRC) && /\['\(scene\)',\.\.\.Object\.keys\(all\)/.test(SRC) && /delay embedding, lag \$\{PP\.lag\} frames \(Takens\)/.test(SRC) && /TT\('stroboscopic'/.test(SRC)
    && /id="labClockBtn"/.test(SRC) && /id="tmLab"/.test(SRC) && /FIELD\.update\(dt,labClockFactor\(\)\)/.test(SRC) && /state\.photonT \+= state\.gyrPerSec\*labDt;/.test(SRC) && /id="ppBtn"/.test(SRC) && /TT\('Phase portrait of the open laboratory'/.test(SRC));

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
