#!/usr/bin/env node
'use strict';
/* ══ THE SKY AT EVERY SCALE, MATTER INSTEAD OF CAGES, AND THE COLLISION BY LAW (v4.349) ══════════════════════════
 * Reported: after v4.348 the Galaxy seen whole washed out to white; the giant structures were wireframe primitives;
 * the Solar world's Milky Way – Andromeda collision was a radial cartoon. Checked on the source and on the kernels:
 *   1. exposure knows crowding: the overlap N·(point area)/(projected area) of a population, gains ∝ overlap^−0.6
 *      beyond ~one point a pixel — for the catalogue stars round the Sun, the Milky Way's and Andromeda's living
 *      discs (uGain) and their diffuse light, and the collision's stars
 *   2. matter instead of cages: the Horizons structures hide their wireframe, void balls and fog once the ΛCDM relief
 *      stands (fields included); the Solar world borrows that relief for every structure and hides its ellipsoid;
 *      distance spheres, orientation spheres and epoch shells are rings, not lat–long cages
 *   3. the collision on the atlas clock is the Local Group laboratory's law: 3-D centres from lgmOrbit (first passage
 *      +4.55 Gyr at ~127 kpc today; head-on coalesces at +4.04 Gyr), stars as test particles from the laboratory's
 *      worker, the living discs handing over, scenarios shared, the black holes by lgmHolesAt; the cycloid only for the past
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  { const f = o => o <= 1.2 ? 1 : Math.max(0.06, Math.pow(1.2 / o, 0.6)), mono = [0.5, 1, 2, 5, 20, 100, 1000].map(f).every((g, i, a) => i === 0 || g <= a[i - 1]), keep = [2, 20, 200].map(o => o * f(o)).every((x, i, a) => i === 0 || x >= a[i - 1]);
    ok('exposure knows crowding: overlap from projected area, gain overlap^−0.6 beyond ~1 a pixel (monotone, order of brightness kept), applied to the catalogue stars, both living discs, their glow and the collision’s stars',
      mono && keep && /function hccCrowdGain\(obj,Rworld,N,ptPx,disc\)/.test(SRC) && /return overlap<=1\.2\?1:Math\.max\(0\.06,Math\.pow\(1\.2\/overlap,0\.6\)\)/.test(SRC)
      && /uPx:\{value:P\.px\}, uFade:\{value:1\}, uGain:\{value:1\}(, uDt:\{value:0\})?\}/.test(SRC) && /\*uFade\*uGain,1\.0\)/.test(SRC) && /u\.uExposure\.value=skyEx\*starCrowd;/.test(SRC)
      && /MW_LIVING\.obj\.material\.uniforms\.uGain\.value=g/.test(SRC) && /M31_LIVING\.stars\.material\.uniforms\.uGain\.value=g/.test(SRC) && /g=hccCrowdGain\(S\.stars,18\*kpcAU,S\.n/.test(SRC)); }
  ok('matter instead of cages: relief hides the Horizons primitives (fields too), the Solar world borrows the relief and hides its ellipsoids, and distance, orientation and epoch shells are rings',
    /\['void','wall','supercluster','cluster','attractor','field'\]\.includes\(s\.type\)/.test(SRC) && /if\(U\.body\)\{ U\.body\.visible=!matter(?:\|\|state\.showStructureExtents===true)?;/.test(SRC) && /hollow\.userData\.primitive=true/.test(SRC) && /fog\.userData\.primitive=true/.test(SRC)
    && /function solarReliefSync\(\)/.test(SRC) && /try\{ solarReliefTick\(\); \}/.test(SRC) && /O\.body\.userData\.matter=true/.test(SRC) && /if\(e\.o\.userData\.matter(?:&&state\.showStructureExtents!==true)?\)\{ if\(e\.o\.visible\) e\.o\.visible=false; continue; \}/.test(SRC)
    && /mesh=guideCircle\(r,0x526785,\.16,256\)/.test(SRC) && /g\.add\(wire,eq\);   \/\* the sphere \(a glowing limb, no cage\) and its equator ring/.test(SRC) && /sh\.userData\.ctRing=true/.test(SRC) && !/new THREE\.SphereGeometry\(r,48,24\),new THREE\.MeshBasicMaterial\(\{color:col,wireframe:true,transparent:true,opacity:0\.05/.test(SRC));
  { const G = K.lgmGeometry(), run = vt => { const o = K.lgmOrbit({ vTan: vt, dKpc: G.dKpc, tGyr: 14, dtMyr: 0.5, outMyr: 5 }); return { E: K.lgmEvents(o), coal: o.coalescedGyr, o }; }, today = run(57), head = run(0), p = today.E.peri[0];
    ok('the collision on the atlas clock is the laboratory’s law: first passage +4.55 Gyr at ~127 kpc today, no coalescence in 14 Gyr; head-on coalesces at +4.04 Gyr — wired into the Solar frame loop with test-particle stars and scenarios',
      p && Math.abs(p.tGyr - 4.55) < 0.05 && Math.abs(p.rKpc - 127) < 3 && today.coal == null && head.coal != null && Math.abs(head.coal - 4.04) < 0.05
      && /else if\(yrs>0\)\{ \/\* the future: the Local Group laboratory’s law|else if\(yrs>0\)\{ \/\* the future: the Local Group laboratory's law/.test(SRC) && /const R=solarLgmRel\(Math\.min\(tG,(14|30)\)\), N=solarLgmPhase\(tG\)/.test(SRC)
      && /W\.postMessage\(\{kind:'stars', job, vTan:lgmScenarioVt\(\)/.test(SRC) && /const hw=yrs>1\?solarLgmTick\(tG,state\.solarScaleLayer\)/.test(SRC) && /data-solarlgm="\$\{k\}"/.test(SRC)
      && /(H\.phase==='riding'\?\{phase:'approach'\}|S\.binNow=null; return \{phase:'approach'\})/.test(SRC) && /globalThis\.HCC_LGM_SOLAR=Object\.freeze/.test(SRC) && /hccCameraGoal\(camera\.position\.distanceTo\(controls\.target\)\)/.test(SRC),
      `today: pericentre ${p ? p.tGyr.toFixed(2) + ' Gyr at ' + p.rKpc.toFixed(0) + ' kpc' : '—'}, coalescence ${today.coal} · head-on coalescence ${head.coal && head.coal.toFixed(2)} Gyr`); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
