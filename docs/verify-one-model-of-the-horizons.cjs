#!/usr/bin/env node
'use strict';
/* ══ ONE MODEL OF THE HORIZONS (v4.359) ══════════════════════════════════════════════════════════════════════════
 * Reported: flown out to its edge, the Sun → Cosmos world showed horizons that did not match the Horizons world — it
 * kept its own Hubble sphere, event horizon and "observable universe" while Horizons drew others. Checked:
 *   1. one authority: the numbers both worlds show come from the time-dependent chain hzAtT — today c/(aH) = c/H₀,
 *      and at every time the Hubble sphere and the last-scattering screen lie inside the particle horizon
 *   2. one set of objects: every horizon shell (ct, last scattering, particle, event, acceleration, equality, Hubble,
 *      the capacity horizon) is built once, in Gly, inside HZ_GROUP — nothing is added to obsGroup on its own
 *   3. one place in the scene: cosmosHome carries HZ_GROUP into the solar holder (scaled exactly 1 Gly → GLY_AU) when
 *      the Sun's world shows the cosmos and back into Horizons otherwise; fills that would paint over the sky stay off
 *   4. no duplicates: the solar chain's own Hubble / event / observable shells are retired (kept only as anchors of
 *      their waypoints), and the waypoints sit at the chain's absolute radii
 *   5. absolute radii: each shared shell is scaled to value(t) / built radius — no ratio to "today" remains, so a label
 *      and its shell can never disagree; the Horizons panel reads the same chain at the clock's time
 *   6. one view: switching Sun → Cosmos → Horizons keeps the line of sight and maps the distance AU → Gly, opening
 *      at least at the outer framing where every horizon is in view
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { hzAgeAtA, hzAtT, hzScreenAt, HZ_EVENTS } = K;
  { const t0 = hzAgeAtA(1), h = hzAtT(t0), lss = hzScreenAt(t0, HZ_EVENTS.lss);
    let ordered = true; for (const t of [0.5, 2, 5, t0, 30, 100]) { const H = hzAtT(t), L = hzScreenAt(t, HZ_EVENTS.lss); ordered = ordered && H.hubbleComoving > 0 && H.hubbleComoving < H.particle && H.event >= 0 && L < H.particle && [H.hubbleComoving, H.event, H.particle, L].every(Number.isFinite); }
    ok('one authority: today the comoving Hubble radius equals the proper one (a = 1); at every time the Hubble sphere and the last-scattering screen lie inside the particle horizon and every radius is finite',
      Math.abs(h.hubbleComoving - h.hubbleProper) < 1e-9 && ordered, `today: Hubble ${h.hubbleComoving.toFixed(3)} · event ${h.event.toFixed(3)} · LSS ${lss.toFixed(3)} · particle ${h.particle.toFixed(3)} Gly`); }
  { const built = /const HZ_GROUP=new THREE\.Group\(\); HZ_GROUP\.name='horizons-shared'; obsGroup\.add\(HZ_GROUP\);/.test(SRC) && /HZ_GROUP\.add\(sphCT0, sphLSS, sphPH\);/.test(SRC) && /HZ_GROUP\.add\(sphEvent, sphAccel, sphMReq\);/.test(SRC) && /HZ_GROUP\.add\(sphHubble\);/.test(SRC) && /const capHorizonGroup=new THREE\.Group\(\); HZ_GROUP\.add\(capHorizonGroup\);/.test(SRC);
    const stray = /obsGroup\.add\((sphCT0|sphLSS|sphPH|sphEvent|sphAccel|sphMReq|sphHubble|capHorizonGroup)\b/.test(SRC);
    ok('one set of objects: every horizon shell and the capacity horizon are built once, in Gly, in the shared group', built && !stray); }
  { const home = /const want=inSolar\?SOLAR_COSMOS_HOLDER:obsGroup; if\(HZ_GROUP\.parent!==want\)\{ want\.add\(HZ_GROUP\);/.test(SRC) && /fill\.material\.side===THREE\.BackSide\) fill\.visible=!inSolar;/.test(SRC) && /SOLAR_COSMOS_HOLDER\.scale\.setScalar\(GLY_AU\)/.test(SRC) && /const GLY_AU=1e9\*OORT\.AU_PER_LY/.test(SRC);
    ok('one place in the scene: the shared group is carried into the Sun’s world at exactly 1 Gly → GLY_AU and back into Horizons; sky-covering fills stay off in the solar chain', home); }
  { const retired = /shared:\/HUBBLE SPHERE\|COSMIC EVENT HORIZON\|OBSERVABLE UNIVERSE\/\.test\(label\)/.test(SRC) && /if\(s\.shared\)\{ s\.g\.visible=false; continue; \}/.test(SRC)
      && /rH=h\?h\.hubbleComoving\/\(hub\.rAU\/GLY_AU\):null, rE=h\?h\.event\/\(ev\.rAU\/GLY_AU\):null, rP=h\?h\.particle\/\(ob\.rAU\/GLY_AU\):null/.test(SRC);
    ok('no duplicates: the solar chain’s own Hubble, event and observable shells are retired, their waypoints stand at the chain’s absolute radii', retired); }
  { const body = SRC.slice(SRC.indexOf('function hccHorizonsTick('), SRC.indexOf('function hccHorizonsTick(') + 4000);
    const abs = /const G=\{ph:S3\.Dparticle, ct:S3\.t0, lss:45\.4, ev:16\.6849, eq:45\.77, ac:7\.746, hub:14\.289(?:, dlg:8\.171)?\};/.test(body) && /hzScaleSphere\(sphHubble,hub!=null\?hub\/G\.hub:null,/.test(body) && !/\/h0\.(particle|event|hubbleComoving)/.test(body) && !/\/lssBase|\/eqBase|\/acBase/.test(body);
    const sphH = /const sphHubble = screenSphere\(14\.289,/.test(SRC);
    const panel = /const tN=hzNowGyr\(\), H=hzAtT\(tN\), L=H\?hzScreenAt\(tN,HZ_EVENTS\.lss\):null/.test(SRC) && /id="sHub"/.test(SRC) && /hb\.onchange=e=>sphHubble\.visible=e\.target\.checked/.test(SRC);
    ok('absolute radii: every shared shell is scaled to its value now over its built radius (no ratio to today remains); the Horizons panel reads the same chain at the clock’s time, Hubble sphere included', abs && sphH && panel); }
  { const cont = /const _prevMode=state\.mode, _prevCam=camera\.position\.clone\(\), _prevTgt=controls\.target\.clone\(\);/.test(SRC)
      && /if\(_prevMode==='solar'\)\{ try\{ const dir=_prevCam\.clone\(\)\.sub\(_prevTgt\), dAU=dir\.length\(\); if\(dAU>0\)\{ dir\.normalize\(\); const dGly=dAU\/GLY_AU, d=Math\.max\(dGly,Math\.hypot\(55,118\)\);/.test(SRC);
    ok('one view: Sun → Cosmos → Horizons keeps the line of sight and maps AU → Gly, opening at least at the outer framing', cont); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
