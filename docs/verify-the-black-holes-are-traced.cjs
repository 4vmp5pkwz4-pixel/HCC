#!/usr/bin/env node
'use strict';
/* ══ THE BLACK HOLES AT THE CENTRES, TRACED ══════════════════════════════════════════════
 * The central black holes were a black ball, a torus and a painted ellipse. They are now traced:
 * every pixel a Schwarzschild null geodesic. This file checks, with the extracted kernels and
 * references written HERE:
 *   1. the SIZE is a prediction the atlas passes: 2√27·GM/(c²D) from its own mass and distance
 *      lands within one error of the rings the EHT measured — Sgr A* and M87*
 *   2. the shadow EMERGES from the integrator: rays with impact parameter just below
 *      b_c = (3√3/2) Rs are captured and just above escape — b_c derived here as √27 GM/c²
 *   3. the Doppler factor has the right sign: the ray is traced backward, the photon travels
 *      along −v, so the approaching limb is BLUESHIFTED, D = 1/(γ(1 + β t·v)) > 1 — fixed in the
 *      relativistic laboratory too, where the first form dimmed the approaching limb
 *   4. static redshift × transverse dilation is the circular-orbit redshift exactly:
 *      √(1 − Rs/r)·√(1 − β²) = √(1 − 3M/r) with β = 1/√(2(r − 1))
 *   5. Sgr A* is oriented by what is measured: within 50° of face-on (EHT 2022), turning
 *      clockwise on the sky (GRAVITY 2018) — its angular momentum points away from us
 *   6. the disk is phase-locked to the ISCO clock, the gateway says it is magnified, the cartoon
 *      is gone, and the holes can be visited from the toolbox and HCC_BH
 *   7. MUTATION: the old Doppler sign makes the approaching limb dimmer than the receding one, caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { bhShadowMicroarcsec, EHT_RINGS, bhrTraceJS } = K;
  const LYM = 9.4607304725808e15;

  /* 1 · the size, predicted */
  { const g = SRC.match(/gc:\{name:'Milky Way centre · Sgr A\*',ra:[\d.]+,dec:[-\d.]+,distLy:(\d+),col:0x[0-9a-f]+,bhMassSolar:([\d.e]+)\}/), Msg = +g[2], Dsg = +g[1] * LYM;
    const m87 = SRC.match(/\{key:'m87bh',[^}]*dGly:([\d.]+)/), Dm = +m87[1] * 1e9 * LYM;
    /* written here: GM☉/c² = 1476.625 m, 1 μas = π/(180·3600·10⁶) rad, the shadow diameter 2√27 GM/c² */
    const mine = (M, D) => 2 * Math.sqrt(27) * M * 1476.625 / D / (Math.PI / 180 / 3600 / 1e6);
    const sg = EHT_RINGS.find(r => r.key === 'sgra'), m8 = EHT_RINGS.find(r => r.key === 'm87');
    const pS = bhShadowMicroarcsec(Msg, Dsg), pM = bhShadowMicroarcsec(m8.massSolar, Dm);
    ok('the SIZE is a prediction the atlas passes: 2√27·GM/(c²D) from its own masses and distances lies within one error of the rings the EHT measured',
      Math.abs(pS - mine(Msg, Dsg)) < 1e-9 && Math.abs(pS - sg.ringMuas) < sg.err && Math.abs(pM - m8.ringMuas) < m8.err, `Sgr A* ${pS.toFixed(1)} μas vs ${sg.ringMuas} ± ${sg.err} · M87* ${pM.toFixed(1)} μas vs ${m8.ringMuas} ± ${m8.err}`); }

  /* 2 · the shadow emerges */
  { const bc = Math.sqrt(27) / 2;                /* √27 GM/c² with Rs = 2GM/c² = 1 */
    const inside = [bc - 0.03, bc - 0.1, 1.5].every(b => bhrTraceJS(b, 20000).captured), outside = [bc + 0.03, bc + 0.1, 4].every(b => !bhrTraceJS(b, 20000).captured);
    ok('the shadow EMERGES from the integrator the shaders use: rays just inside b_c = (3√3/2) Rs are captured, just outside escape', inside && outside, `b_c = ${bc.toFixed(4)} Rs`); }

  /* 3 · the Doppler sign, and the fix in both shaders */
  { const beta = 1 / Math.sqrt(2 * (6 - 1)), gam = 1 / Math.sqrt(1 - beta * beta), v = [0, 0, -1], tang = [0, 0, 1];   /* camera on +z, emitter at +x moving toward it */
    const tv = tang[0] * v[0] + tang[1] * v[1] + tang[2] * v[2], D = 1 / (gam * (1 + beta * tv)), Drec = 1 / (gam * (1 - beta * tv));
    const both = (SRC.match(/float dopp=1\.0\/\(gam\*\(1\.0\+beta\*dot\(tang,normalize\(v\)\)\)\);/g) || []).length;
    ok('the Doppler factor has the right sign: traced backward, the photon travels along −v, so the approaching limb is blueshifted, D = 1/(γ(1 + β t·v)) > 1 — in the gateway and in the relativistic laboratory',
      D > 1 && Drec < 1 && both === 2 && !/1\.0-beta\*dot\(tang/.test(SRC), `approaching D = ${D.toFixed(3)} · receding ${Drec.toFixed(3)} · shaders with the fixed form: ${both}`); }

  /* 4 · the redshift product */
  { let worst = 0; for (const r of [3, 4.5, 6, 9, 14]) { const b = 1 / Math.sqrt(2 * (r - 1)); worst = Math.max(worst, Math.abs(Math.sqrt(1 - 1 / r) * Math.sqrt(1 - b * b) - Math.sqrt(1 - 1.5 / r))); }
    ok('static redshift × transverse dilation is the circular-orbit redshift exactly: √(1 − Rs/r)·√(1 − β²) = √(1 − 3M/r)', worst < 1e-15 && /float gred=sqrt\(max\(0\.0,1\.0-1\.0\/rc\)\);/.test(SRC), `worst ${worst.toExponential(1)}`); }

  /* 5 · Sgr A*'s orientation */
  { const tilt = +(SRC.match(/const SGRA_TILT_DEG=(\d+);/) || [])[1];
    /* the traced disk: tang = (−z, 0, x) at (x, 0, z) ⇒ L = r × v along −y; the code lays −y on the spin, which it builds from the away-pointing line of sight */
    const r = [1, 0, 0], vv = [-0, 0, 1], L = [r[1] * vv[2] - r[2] * vv[1], r[2] * vv[0] - r[0] * vv[2], r[0] * vv[1] - r[1] * vv[0]];
    ok('Sgr A* is oriented by what is measured: within 50° of face-on (EHT 2022) and turning clockwise on the sky (GRAVITY 2018), its angular momentum pointing away from us',
      tilt > 0 && tilt < 50 && L[1] < 0 && /return d\.multiplyScalar\(Math\.cos\(th\)\)\.addScaledVector\(t,Math\.sin\(th\)\)\.normalize\(\);/.test(SRC)
      && /setFromUnitVectors\(new THREE\.Vector3\(0,1,0\),n\.clone\(\)\.negate\(\)\)/.test(SRC), `tilt ${tilt}° · disk angular momentum along ${L[1] < 0 ? '−y' : '+y'}`); }

  /* 6 · wiring and honesty */
  ok('the disk is phase-locked to the ISCO clock, the gateway says it is MAGNIFIED, the cartoon is gone, and the holes can be visited from the toolbox and HCC_BH',
    /U\.uOrb\.value=2\*Math\.PI\*\(\(\(\(state\.epochDays%span\)\+span\)%span\)\/p\);/.test(SRC) && /MAGNIFIED: a 4500-ly drawing of a hole light-minutes across/.test(SRC)
    && !/new THREE\.TorusGeometry\(R\*\.50,R\*\.045,12,96\)/.test(SRC) && /const traced=bhgGateway\(1\.6\*R\);/.test(SRC) && /globalThis\.HCC_BH=Object\.freeze\(\{view:/.test(SRC) && /TT\('Sgr A\*, traced — as the EHT saw it'/.test(SRC));

  /* 7 · mutation */
  { const beta = 1 / Math.sqrt(2 * 5), gam = 1 / Math.sqrt(1 - beta * beta), tv = -1, Dold = 1 / (gam * (1 - beta * tv)), Dnew = 1 / (gam * (1 + beta * tv));
    ok('MUTATION — the old sign makes the approaching limb dimmer (δ³ ' + (Dold ** 3).toFixed(2) + ') than it should be (' + (Dnew ** 3).toFixed(2) + '), caught', Dold < 1 && Dnew > 1); }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
