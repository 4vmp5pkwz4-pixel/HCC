#!/usr/bin/env node
'use strict';
/* ══ THE UNIVERSE SEEN FROM OUTSIDE IS NOT A FLARE (v4.380) ══════════════════════════════════════════════════════════
 * Reported: on the Horizons tab, backing away from the whole sphere of the universe, the glow from its centre was far
 * too strong. Three causes were measured, and each is fixed at its cause:
 *   1. dozens of soft pins (constant few pixels, additive) mark structures within a gigalight-year of the observer; seen
 *      from afar they fall into one pixel and their halos SUMMED. Pins sharing a screen cell now share one pin's light
 *      (1/k each) — run here on a model of the cells
 *   2. the cinematic stage is camera-facing and keeps its screen size, so it stayed a halo around a shrinking universe;
 *      in the Horizons world it now follows the particle horizon's angular size: (2.8 R_p/d)^1.6, floored at 0.04
 *   3. the translucent layers of the ball seen whole from outside saturate a small disc whose bloom halo keeps its size
 *      in pixels; beyond 2.8 R_p the exposure and the bloom follow (2.8 R_p/d)^0.85, floored at 0.3; and galaxies
 *      smaller than a pixel keep their light (ps²), not a whole pixel each
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
/* 1 */
{ /* the rule, run: k pins in one cell → each at base/k, total light of the cell = one pin */
  const share = (cells) => cells.map(k => Array.from({ length: k }, () => 0.7 / k).reduce((s, x) => s + x, 0));
  const tot = share([1, 3, 40, 200]);
  ok('pins that fall into one screen cell share one pin\'s light (each at 1/k): a cell of 1, 3, 40 or 200 pins shines like one pin, never like 200',
    tot.every(x => Math.abs(x - 0.7) < 1e-12) && /HCC_SOFT_PINS\.push\(sp\)/.test(SRC) && /sp\.material\.opacity=b\/k;/.test(SRC) && /try\{ hccPinCrowding\(\); \}catch\(e\)\{\}\n\s*premiumFrameTick\(\);/.test(SRC),
    tot.map(x => x.toFixed(2)).join(' · ')); }
/* 2 */
{ const f = d => Math.max(0.04, Math.min(1, Math.pow(2.8 * 46 / d, 1.6)));
  ok('the camera-facing stage follows the universe it frames: full at the home view (130 Gly, ≥ 0.95), a few per cent from 1300 Gly',
    /return base\*Math\.max\(0\.04,Math\.min\(1,Math\.pow\(2\.8\*Rp\/d,1\.6\)\)\);/.test(SRC) && f(130) > 0.95 && f(1300) < 0.06, `d = 130: ${f(130).toFixed(2)} · d = 781: ${f(781).toFixed(3)} · d = 1300: ${f(1300).toFixed(3)}`); }
/* 3 */
{ const g = d => d > 2.8 * 46 ? Math.max(0.3, Math.pow(2.8 * 46 / d, 0.85)) : 1;
  ok('seen from outside, exposure and bloom follow the ball\'s angular size beyond 2.8 particle-horizon radii, and galaxies below a pixel carry ps² of their light',
    /HCC_OUTSIDE\.k=Math\.max\(0\.3,Math\.pow\(2\.8\*Rp\/d,0\.85\)\)/.test(SRC) && /bloomPass\.strength\+=\(p\.strength\*ko-bloomPass\.strength\)\*\.08;/.test(SRC) && /vA\*=min\(1\.0,ps\*ps\);/.test(SRC) && g(130) > 0.95 && g(781) <= 0.3 + 1e-12,
    `exposure factor at 130 Gly ${g(130).toFixed(2)}, 781 Gly ${g(781).toFixed(2)}, 1354 Gly ${g(1354).toFixed(2)}`); }
console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
