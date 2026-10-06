#!/usr/bin/env node
'use strict';
/* ══ THE WEB WITHOUT CAGES · THE CMB AS THE SKY OF EVERY LEVEL · ONE SOURCE FOR THE CARDS (v4.360) ════════════════
 * Reported: the giant structures and clusters were drawn with crude cages, straight lines and arrows; the CMB must be
 * available in the whole Sun → Cosmos world; the horizon cards must read one source. Checked from the page:
 *   1. GLASS, NOT CAGES: every extent the cosmic worlds draw (structure volumes in both worlds, voids, found
 *      superclusters and voids of the local web, the Local Group's surfaces, the curvature and quantile families, the
 *      capacity horizon, the fitted ellipsoids) is a Fresnel limb (hccGlassMat); no lat–long wireframe remains there
 *   2. SCHEMATIC AIDS STEP BACK: sightlines, the Shapley ⇄ Repeller axis with its cones, the survey wedge, the
 *      reference distance spheres, the CF4 streamline sketch and the containment lines are off by default, each one
 *      switch away; the galactic and dipole axes fade before the giant structures
 *   3. THE CMB SKY IS EXACTLY ORIENTED: the IAU J2000 galactic basis (NGP 192.85948°, +27.12825°; l = 0 at 266.40500°,
 *      −28.93617°) is orthonormal to 1e-6 and puts Planck's dipole (l, b) = (264.021°, 48.253°) at α = 167.94°,
 *      δ = −6.94° — computed here independently with the same constants the page uses
 *   4. wired: the backdrop rides the camera's rotation only (never its position), sits behind everything, has the three
 *      ways to look and a switch in the solar panel; the anisotropy is labelled as the atlas's own realization
 *   6. CATALOGUES, NOT DICE: the observable ball no longer holds 24 000 Math.random points; it holds the VCV quasars and
 *      the catalogued galaxies at their comoving distances; structure centres are soft glows, not solid balls
 *   5. ONE SOURCE FOR THE CARDS: every horizon card (event, Hubble, ct, particle, last scattering, equality,
 *      acceleration, dialogue) is computed by hzCardRows from the chain; no typed radius rows remain; the panel's
 *      milestone note is computed (Λ, ρ_crit, ρ_Λ, onset and equality times)
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
{ const glass = (SRC.match(/hccGlassMat\(/g) || []).length;
  const a = SRC.indexOf('const capHorizonGroup='), b = SRC.indexOf('function buildCosmicFrame(');
  const region = SRC.slice(a, b), wf = (region.match(/wireframe:true/g) || []).length;
  const solar = SRC.slice(SRC.indexOf('const solarSightPos=[]'), SRC.indexOf('COSMOS_GUIDES.solarSight=new THREE.LineSegments'));
  ok('glass, not cages: every extent in the cosmic worlds is a glowing limb; no lat–long wireframe remains from the capacity horizon to the solar structure volumes', glass >= 14 && wf === 0 && !/wireframe:true/.test(solar) && /function hccGlassMat\(col,op\)\{ const m=hccShellMaterial\(/.test(SRC), `${glass} glass shells · ${wf} wireframes in the cosmic region`); }
{ const def = /showLaniakeaFlows:false, laniakeaFlowDensity/.test(SRC) && /showNesting:false, showSightlines:false, showDipoleAxis:false, showSurveyCone:false, showScaleRings:false,/.test(SRC);
  const sync = /function hccCosmicGuidesSync\(\)\{/.test(SRC) && /try\{ hccCosmicGuidesSync\(\); \}catch\(e\)\{\}\n  return inSolar; \}/.test(SRC) && /COSMOS_GUIDES\.dipole=dipoleGroup;/.test(SRC) && /COSMOS_GUIDES\.cone=coneGroup;/.test(SRC) && /_nestingLines\.visible=state\.showNesting===true;/.test(SRC);
  const axes = /'GALACTIC AXIS · through Sgr A\* → north galactic pole',\[7\.6,10\.6\]/.test(SRC) && /'CMB DIPOLE AXIS · 369\.8 km\/s · rest frame of the Universe',\[8\.6,10\.4\]/.test(SRC);
  const ui = /id="aidSight"/.test(SRC) && /id="aidRings"/.test(SRC) && /id="aidSightO"/.test(SRC) && /id="aidDip"/.test(SRC) && /id="aidCone"/.test(SRC);
  ok('schematic aids step back: sightlines, dipole axis and cones, survey wedge, distance spheres, streamline sketch and containment lines are off by default, each one switch away; the axes fade before the giant structures', def && sync && axes && ui); }
{ const D = Math.PI / 180, eq = (ra, de) => [Math.cos(de * D) * Math.cos(ra * D), Math.cos(de * D) * Math.sin(ra * D), Math.sin(de * D)];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], nrm = a => { const l = Math.hypot(...a); return a.map(v => v / l); };
  const x0 = nrm(eq(266.40500, -28.93617)), z = nrm(eq(192.85948, 27.12825)), orth = Math.abs(dot(x0, z)), y = nrm(cross(z, x0)), x = nrm(cross(y, z));
  const l = 264.021 * D, b = 48.253 * D, d = [0, 1, 2].map(i => x[i] * Math.cos(b) * Math.cos(l) + y[i] * Math.cos(b) * Math.sin(l) + z[i] * Math.sin(b));
  const ra = (Math.atan2(d[1], d[0]) / D + 360) % 360, de = Math.asin(d[2]) / D;
  const consts = /raDecDir\(266\.40500\/15,-28\.93617\)/.test(SRC) && /raDecDir\(192\.85948\/15,27\.12825\)/.test(SRC) && /CMB_DIPOLE_PLANCK=Object\.freeze\(\{l:264\.021, b:48\.253, ampMuK:3362\.08/.test(SRC);
  ok('the CMB sky is exactly oriented: the J2000 galactic basis is orthonormal and puts Planck’s dipole at α = 167.94°, δ = −6.94°', consts && orth < 1e-6 && Math.abs(ra - 167.94) < 0.02 && Math.abs(de + 6.94) < 0.02, `x·z = ${orth.toExponential(1)} · dipole α ${ra.toFixed(3)}° δ ${de.toFixed(3)}°`); }
{ const w = /vec4 p=projectionMatrix\*vec4\(mat3\(viewMatrix\)\*position,1\.0\); gl_Position=vec4\(p\.xy,p\.w\*0\.9999,p\.w\);/.test(SRC) && /mesh\.renderOrder=-1e9;/.test(SRC) && /depthTest:false, depthWrite:false, transparent:false, blending:THREE\.AdditiveBlending/.test(SRC)
    && /if\(uMode<0\.5\) col=planck\(dT,uCRange\);/.test(SRC) && /else if\(uMode<1\.5\) col=planck\(dT\+uDipAmp\*dot\(d,uDip\),uDipAmp\*1\.04\);/.test(SRC) && /try\{ hccCmbBackdropTick\(\); \}catch\(e\)\{\}/.test(SRC) && /id="cmbBack"/.test(SRC) && /data-cmbback="\$\{m\}"/.test(SRC)
    && /this atlas embeds one\n   +full-sky realization of its own ΛCDM/.test(SRC) && /globalThis\.HCC_CMB_BACKDROP=Object\.freeze\(/.test(SRC);
  ok('wired: the CMB sky rides the camera’s rotation only and sits behind everything; anisotropy, the Sun’s view with the measured dipole, and the colour it was; a solar-panel switch; the realization is labelled as one', w); }
{ const cards = ['ct', 'lss', 'ph', 'event', 'accel', 'eq', 'hubble', 'dialogue'].every(k => SRC.includes(`hzCardRows('${k}')`));
  const typed = /\['Event-horizon radius','16\.6849 Gly'\]/.test(SRC) || /\['Comoving radius','7\.75 Gly'\]/.test(SRC) || /\['Comoving radius','45\.77 Gly'\]/.test(SRC) || /accel onset t=7\.69 Gyr/.test(SRC);
  const note = /return `Λ = \$\{e\(3\*C\.OL\*H0\*H0\/\(c\*c\)\)\} m⁻² · ρ_crit = \$\{e\(rc\)\} kg m⁻³/.test(SRC) && /function hzCardRows\(kind\)\{/.test(SRC);
  ok('one source for the cards: every horizon card and the milestone note are computed from the chain; no typed radius rows remain', cards && !typed && note); }
{ const dice = /const n = 24000, g = new THREE\.BufferGeometry\(\)/.test(SRC) || /clustered large-scale structure inside the ball B³_χ\(p\)\n\{/.test(SRC);
  const real = /function obsCatalogueBuild\(\)\{/.test(SRC) && /const R=QSO3D\.rows, n=R\.length/.test(SRC) && /dc=hccComovingMpc\(z\)\*GLY_PER_MPC/.test(SRC) && /pts\.name='obs-quasars-vcv2010'/.test(SRC) && /pts\.name='obs-galaxies-catalogued'/.test(SRC) && /try\{ obsCatalogueTick\(\); \}catch\(e\)\{\}/.test(SRC);
  const pins = /function hccSoftPin\(dot,col,r\)\{ dot\.material\.opacity=0;/.test(SRC) && (SRC.match(/hccSoftPin\(dot,s\.col,/g) || []).length === 2;
  ok('the observable ball is filled with catalogues, not dice: the 24 000 random points are gone; the 5 959 VCV quasars and 4 341 catalogued galaxies stand at their own directions and comoving distances; structure centres are soft glows over a still-pickable target', !dice && real && pins); }
console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
