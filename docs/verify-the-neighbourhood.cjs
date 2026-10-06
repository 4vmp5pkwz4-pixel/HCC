#!/usr/bin/env node
'use strict';
/* ══ THE NEIGHBOURHOOD, THE MERGERS, THE SLOPE (v4.364) ══════════════════════════════════════════════════════════
 *   1. Gaia DR3 within 50 pc embedded with its query, SHA-256 and validation counts; positions carried to J2000
 *   2. the solar-motion estimator recovers a known motion (track op), and on the embedded stars gives what the ledger says
 *   3. GWTC embedded with provenance; the mass-spectrum estimator recovers known peaks; the data peak near 11.5 and 38 M☉
 *   4. the valley-slope estimator recovers a known slope; on Kepler the valley is deepest near m = −0.10
 *   5. wired: the stars move on the clock in the shader, the mergers are spheres of distance, GW170817 sits at NGC 4993
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const blob = id => { const i = SRC.indexOf(`id="${id}"`), j = SRC.indexOf('>', i), k = SRC.indexOf('</script>', j); return JSON.parse(SRC.slice(j + 1, k)); };
const f32 = b => { const B = Buffer.from(b, 'base64'); return new Float32Array(B.buffer.slice(B.byteOffset, B.byteOffset + B.byteLength)); };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs')), T = K.TRACK_OPS;
  const GM = JSON.parse(SRC.match(/const GAIA50_META=Object\.freeze\((.*)\);/)[1]), WM = JSON.parse(SRC.match(/const GWTC_META=Object\.freeze\((.*)\);/)[1]), g = blob('hcc-gaia50');
  ok('Gaia DR3 within 50 pc: query, SHA-256 and validation counts; positions carried to J2000', /parallax > 20 AND parallax_over_error > 10 AND ruwe < 1\.4/.test(GM.query) && /^[0-9a-f]{64}$/.test(GM.sha256) && GM.n === 33961 && GM.withRV + GM.withoutRV === GM.n && g.n === GM.n && GM.maxPc <= 50 && /J2016\.0 → J2000\.0/.test(GM.epoch),
    `${GM.n} stars · ${GM.withRV} with RV · max ${GM.maxPc} pc`);
  { const t = T['gaia.solarMotion'].run({}), S = K.gaiaSolarMotion(f32(g.v), 4);
    ok('the solar-motion estimator recovers a known motion, and on the embedded stars gives the ledger’s U, V, W', Math.abs(t.U - 11.1) < 1 && Math.abs(t.W - 7.25) < 1 && Math.abs(S.U - 9.79) < 0.05 && Math.abs(S.V - 21.03) < 0.05 && Math.abs(S.W - 7.56) < 0.05 && S.used === 20967,
      `synthetic U ${t.U.toFixed(2)} W ${t.W.toFixed(2)} · Gaia U ${S.U.toFixed(2)} ± ${S.eU.toFixed(2)}, V ${S.V.toFixed(2)}, W ${S.W.toFixed(2)} ± ${S.eW.toFixed(2)} (n ${S.used})`); }
  { const R = blob('hcc-gwtc'), t = T['gw.massPeaks'].run({}), pk = K.gwMassPeaks(R.map(r => r.m1), 0.05).slice(0, 2).map(p => p.m).sort((a, b) => a - b);
    ok('GWTC: provenance; the mass-spectrum estimator recovers known peaks; the data peak near 11.5 and 38 M☉', /gwosc\.org\/eventapi/.test(WM.source) && WM.kept === 282 && R.length === 282 && new Set(R.map(r => r.n)).size === 282 && Math.abs(t.low - 10) < 2 && Math.abs(t.high - 35) < 5 && Math.abs(pk[0] - 11.5) < 1 && Math.abs(pk[1] - 38) < 2,
      `synthetic ${t.low.toFixed(1)}/${t.high.toFixed(1)} · data ${pk.map(x => x.toFixed(1)).join(' / ')} M☉`); }
  { const E = JSON.parse(SRC.match(/const EXO_META=Object\.freeze\((.*)\);/)[1]), X = blob('hcc-exoplanets'), p = f32(X.p), pf = Buffer.from(X.pf, 'base64');
    const tr = E.methods.indexOf('Transit'), kep = E.facilities.indexOf('Kepler'), R = [], P = [], TK = []; for (let q = 0; q < E.planets; q++) { R.push(p[7 * q + 1]); P.push(p[7 * q + 3]); TK.push(p[7 * q + 6] === tr && pf[q] === kep); }
    const t = T['exo.slope'].run({}), sl = K.exoValleySlope(R, P, TK, 0.025).best;
    ok('the valley-slope estimator recovers a known slope; on Kepler the valley is deepest near m = −0.10', Math.abs(t.m + 0.1) < 0.03 && Math.abs(sl.m + 0.1) < 0.021 && Math.abs(sl.valleyR - 1.81) < 0.03, `synthetic m ${t.m.toFixed(2)} · Kepler m ${sl.m.toFixed(2)}, ${sl.valleyR.toFixed(3)} R⊕, depth ${sl.depth.toFixed(3)}`); }
  ok('wired: stars move on the clock, mergers are spheres of distance, GW170817 at NGC 4993; panels and API', /gl_Position=projectionMatrix\*mv; gl_PointSize=uPx\*aSize;/.test(SRC) && /vec4 mv=modelViewMatrix\*vec4\(position\+aVel\*uYr,1\.0\);/.test(SRC) && /G\.name='gwtc-distance-spheres'/.test(SRC) && /kilonova in/.test(SRC) && /\$\{gaiaGwPanelHTML\('solar'\)\}/.test(SRC) && /\$\{gaiaGwPanelHTML\('obs'\)\}/.test(SRC) && /globalThis\.HCC_GAIA_GW=Object\.freeze\(/.test(SRC));
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
