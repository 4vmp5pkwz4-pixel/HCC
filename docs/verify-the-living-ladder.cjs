#!/usr/bin/env node
'use strict';
/* ══ THE LIVING LADDER (v4.377) ══════════════════════════════════════════════════════════════════════════════════
 * FBS3R enriched from the atlas: the horizons, the curvature radius carried by the expansion, the cooling CMB and the
 * age as a CoScale rung, read at the time machine's epoch from the atlas's own cosmology (hzAtT), climb the rungs with
 * the clock. Checked here on the page's own spec, run with the extracted kernels:
 *   1. today: the particle horizon a·χ_p ≈ 46.0 Gly on rung ≈ 293.9, the Hubble radius ≈ 14.3 Gly, the event horizon
 *      ≈ 16.3 Gly, the CMB peak 1.063 mm, the age 13.7 Gyr as a CoScale rung ≈ 291.4
 *   2. at 1 Gyr every one of them stands lower on the ladder; beyond the Big Bang there is no epoch
 *   3. the unlocked φ′ (Tier 2) now sets the shells' spacing, not only their labels
 *   4. wired: ticked from updateFBS, a panel section with the "now at this rung" index, every control bound
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const i = SRC.indexOf('const FBS_LIVING_SPEC=['), j = SRC.indexOf('const FBS_LIVING={', i), spec = SRC.slice(i, j);
  const LY_M = 9.4607304725808e15, GLY_M = LY_M * 1e9, C_MS = 299792458, S3 = { R: K.S3 ? K.S3.R : 886.6 }, lP = 1.616255e-35, LN = Math.log((1 + Math.sqrt(5)) / 2);
  const SPEC = new Function('LY_M', 'GLY_M', 'C_MS', 'S3', spec + ';return FBS_LIVING_SPEC;')(LY_M, GLY_M, C_MS, S3);
  const at = t => { const h = K.hzAtT(t); return h ? Object.fromEntries(SPEC.map(s => { const L = s.L({ ...h, t }); return [s.key, { L, N: Math.log(L / lP) / LN }]; })) : null; };
  const t0 = K.hzAgeAtA(1), now = at(t0), early = at(1), before = K.hzAtT(-1);
  const g = x => x.L / GLY_M;
  ok('today the living rungs read the atlas\'s cosmology: particle horizon ≈ 46.0 Gly, Hubble radius ≈ 14.3 Gly, event horizon ≈ 16.3 Gly, CMB peak 1.063 mm, the age 13.7 Gyr as a CoScale rung',
    Math.abs(g(now.particle) - 46.0) < 0.3 && Math.abs(g(now.hubble) - 14.3) < 0.2 && Math.abs(g(now.event) - 16.3) < 0.3 && Math.abs(now.cmb.L - 1.0629e-3) < 1e-6 && Math.abs(now.age.L / (C_MS * 365.25 * 86400 * 1e9) - t0) < 1e-9 && Math.abs(now.particle.N - 293.9) < 0.1,
    Object.entries(now).map(([k, v]) => `${k} N ${v.N.toFixed(2)}`).join(' · '));
  ok('at 1 Gyr every one stands lower on the ladder, and before the Big Bang there is no epoch',
    Object.keys(now).every(k => early[k].N < now[k].N) && before == null, Object.entries(early).map(([k, v]) => `${k} ${v.N.toFixed(2)}`).join(' · '));
  ok('the unlocked φ′ (Tier 2) sets the spacing of the shells and of the spiral, not only their labels',
    /const rs = Math\.exp\(\(n-D\)\*lnPhiX\);/.test(SRC) && /const r = Math\.exp\(\(x-D\)\*lnPhiX\), a = x\*GOLDEN_ANGLE;/.test(SRC));
  ok('wired: ticked from updateFBS, a panel section with the "now at this rung" index, every control bound, refreshed live',
    /try\{ fbsLivingTick\(dt,D\); \}catch\(e\)/.test(SRC) && /\$\{fbsLivingPanelHTML\(\)\}/.test(SRC) && /try\{ fbsLivingBind\(ctl\); \}catch\(e\)\{\}/.test(SRC)
    && /function fbsRungNowHTML\(\)\{ let C=null; try\{ C=hccRungContents\(state\.fbsDepth,0\.5\);/.test(SRC) && /o\.innerHTML=fbsLivingOutHTML\(fbsLivingRows\(\),t\); fbsLivingBind\(o\);/.test(SRC));
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
