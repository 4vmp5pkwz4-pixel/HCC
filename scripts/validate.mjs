#!/usr/bin/env node
/* Automated validation for the S³ LIGHT-TRISPHERE / FBS3R app (index.html).
   Run: node scripts/validate.mjs            (from the repository root)      */
import { readFileSync, writeFileSync, rmSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const html = readFileSync('index.html', 'utf8');
let failures = 0;
const check = (cond, msg) => {
  console.log((cond ? '  PASS ' : '✗ FAIL ') + '— ' + msg);
  if (!cond) failures++;
};
console.log('=== S³ LIGHT-TRISPHERE / FBS3R — automated validation ===\n');

/* Deployment identity: the public Pages document must be visibly and
   programmatically distinguishable from a stale browser-cached build. */
/* This used to pin the literal build string, which meant a legitimate release bump
   FAILED validation until someone remembered to edit this file too — a fifth copy of
   the version, and the very drift the single-source rewrite removed.  It now checks
   the invariant instead: the constant exists, is well formed, and every copy in the
   document agrees with it. */
{
  const ver = html.match(/const HCC_VERSION='([^']+)'/);
  const bld = html.match(/const HCC_BUILD='([^']+)'/);
  check(!!ver && !!bld && /^\d+\.\d+\.\d+$/.test(ver[1])
    && /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*-\d{4}\.\d{2}\.\d{2}\.\d+$/.test(bld[1]),
    'release identity is declared once as a semantic version and a dated build stamp');
  if (ver && bld) {
    check(html.includes(`data-hcc-build="${bld[1]}"`)
      && html.includes(`<meta name="hcc-build" content="${bld[1]}">`)
      && html.includes(`<span class="buildMark">· v${ver[1]}</span>`)
      && html.includes('function hccStampVersion()'),
      `every copy of the release identity agrees with the declared source (v${ver[1]} · ${bld[1]})`);
  }
}
check(html.includes('globalThis.HCC_DEPLOYMENT=HCC_DEPLOYMENT')
  && html.includes('deployment(){return {...HCC_DEPLOYMENT};}'),
  'deployment identity is exposed through the read-only QA surface');

/* 1 · JavaScript syntax (extract the inline module, strip imports) */
{
  const m = html.match(/<script type="module">([\s\S]*?)<\/script>\s*<\/body>/);
  check(!!m, 'inline ES module found');
  if (m) {
    const js = m[1].replace(/^import .*$/gm, '');
    writeFileSync('/tmp/__lts_check.mjs', js);
    let ok = true;
    try { execSync('node --check /tmp/__lts_check.mjs', { stdio: 'pipe' }); }
    catch (e) { ok = false; console.error(String(e.stderr)); }
    check(ok, 'JavaScript syntax valid (node --check)');
    rmSync('/tmp/__lts_check.mjs', { force: true });
  }
}

/* 2 · The current UI intentionally ships complete EN/RU/DE localization. */
check(html.includes("ru:") && html.includes("de:") && html.includes("en:"),
  'English, Russian and German localization dictionaries are present');

/* 3 · All seven modes present and handled */
{
  const modes = [...html.matchAll(/data-mode="(\w+)"/g)].map(x => x[1]);
  check(new Set(modes).size === 7, 'seven mode buttons declared (' + modes.join(', ') + ')');
  for (const m of modes) {
    const handled = html.includes(`mode==='${m}'`) || html.includes(`state.mode==='${m}'`)
      || m === 'fractal'; // fractal is the final else-branch of setMode/buildCtl
    check(handled, `mode "${m}" has a setMode/buildCtl/tick branch`);
  }
}

/* 4 · Every queried element id exists somewhere in markup or templates */
{
  const queried = new Set(
    [...html.matchAll(/querySelector\('#([\w-]+)'\)/g)].map(x => x[1])
      .concat([...html.matchAll(/getElementById\('([\w-]+)'\)/g)].map(x => x[1]))
  );
  for (const id of queried)
    check(html.includes(`id="${id}"`) || html.includes(`id='${id}'`) || html.includes(`.id='${id}'`),
      `element id "${id}" is created`);
}

/* 5 · Selection system: registered cards have name + getPos + rows-or-desc */
{
  // 17 textual call-sites expand to ~60 runtime entries via the planet,
  // constellation, epoch and shell loops
  const n = (html.match(/registerSel\(/g) || []).length;
  check(n >= 15, `selection registry is rich (${n} registerSel call-sites ≥ 15)`);
  check(html.includes('selProv'), 'selection cards carry a provenance container');
  check(html.includes('SOURCE_MAP'), 'SOURCE_MAP provenance section present');
}

/* 6 · Mobile requirements */
check(/@media \(max-width:760px\)/.test(html), 'mobile media query present');
check(html.includes('env(safe-area-inset'), 'iOS safe-area insets used');
check(html.includes('viewport-fit=cover'), 'viewport-fit=cover declared');
check(html.includes('touchPts'), 'pinch-gesture handler present');
check(html.includes('#mBtns'), 'mobile bottom-sheet toggles present');
check(/#clock\{position:absolute;top:/.test(html)
  && /right:calc\([^;]*safe-area-inset-right/.test(html),
  'UTC clock is pinned to the safe-area-aware upper-right corner');
check(html.includes('@media (max-width:420px)') && html.includes('#navCluster>#breadcrumb{left:auto;transform:none')
  && html.includes('id="activeLabControls"') && html.includes('_jumpActive') && html.includes('_revealActive'),
  'narrow phones separate title/clock/breadcrumb and jump to the newly selected laboratory controls');

/* 7 · Core formulas exposed verbatim */
for (const f of ['2*Math.PI*Math.PI', '(chi - 0.5*Math.sin(2*chi))', 'beta', 'l_P·φᴺ',
                 'ln(L/l_P)/ln', 'φ⁻³ᴺ', 'φᴺ/√5', '4*Math.PI*S3.R*S3.R'])
  check(html.includes(f), `formula fragment present: ${f}`);

/* 7a · FBS/CoScale anchors must remain numerically and semantically distinct. */
{
  const phi=(1+Math.sqrt(5))/2, tP=5.391247e-44, yr=365.25*86400;
  const t266=tP*phi**266/yr;
  const n380=Math.log(380000*yr/tP)/Math.log(phi);
  check(Math.abs(t266-66572.9143)<0.1,
    `CoScale t(266) is independently verified (${t266.toFixed(1)} yr, not 380000 yr)`);
  check(Math.abs(n380-269.619764)<1e-5,
    `CoScale 380000 yr corresponds to N=${n380.toFixed(6)}`);
  check(html.includes('CoScale t(266) ≈ 66.6 kyr') && html.includes('380 kyr corresponds to N ≈ 269.62'),
    'UI discloses the published N_rec label separately from the CoScale clock');
  check(!html.includes('const SHORTS =') && html.includes("short:'N★207'") && html.includes('FBS_EPOCHS.sort'),
    'FBS epoch chips are self-labelled and ordered by N (no parallel-array undefined label)');
}

/* 8 · Export features */
check(html.includes('exportStateJSON') && html.includes('exportLadderCSV'),
  'JSON & CSV export functions wired');

/* 9 · Scientific-discipline language guard */
check(!/topology (is|was) (detected|proven)/i.test(html),
  'app never claims topology detection as established fact');
check(html.includes('not a topology detection') || html.includes('NOT a topology detection'),
  'explicit conditional-reconstruction disclaimer present');
check(html.includes("invQ:'', invQuantity:''") && html.includes('function invAtlasEntries(quantity)'),
  'Inverse Atlas requires a declared quantity kind before matching');
check(html.includes('equal numbers carrying different physical meanings are not relations')
  && html.includes('Exploratory cross-quantity scan'),
  'cross-quantity numeric coincidences are explicitly labelled non-equivalent');

/* 10 · WebXR layer (Quest 3 VR/MR) */
check(html.includes('renderer.xr.enabled = true'), 'renderer.xr.enabled = true');
check(html.includes('id="vrBtn"') && html.includes('id="mrBtn"'), 'custom Enter VR / Enter MR buttons exist');
check(html.includes("isSessionSupported('immersive-vr')") && html.includes("isSessionSupported('immersive-ar')"),
  'VR/MR support is feature-detected (buttons appear only when supported)');
for (const feat of ['local-floor','bounded-floor','hand-tracking','layers','anchors','plane-detection','hit-test','dom-overlay'])
  check(html.includes(`'${feat}'`), `optional feature requested/detected: ${feat}`);
check(html.includes('XRControllerModelFactory') && html.includes('getControllerGrip'),
  'controller models + grips wired');
check(html.includes('XRHandModelFactory') && html.includes('pinchstart'),
  'hand tracking models + pinch gestures wired');
check(html.includes('hapticActuators'), 'haptics are feature-detected');
check(html.includes('setAnimationLoop'), 'XR-compatible setAnimationLoop main loop');
check(html.includes('class XRPanel') && html.includes('CanvasTexture'),
  'in-world 3D UI panels exist (CSS2D is not the only XR UI layer)');
check(html.includes('snapAngle') && html.includes('vignette'), 'snap turn + comfort vignette');
check(html.includes('getHitTestResults') && html.includes('createAnchor'),
  'MR hit-test reticle + anchors (feature-detected)');
check(html.includes('setFoveation') && html.includes('updateTargetFrameRate'),
  'fixed foveated rendering + target frame-rate control');
check(html.includes('XR session unavailable') || html.includes('graceful'), 'XR fallback messaging present');
check(html.includes('FORMULA_REGISTRY'), 'FORMULA_REGISTRY present');
check(html.includes('UNCERTAINTY'), 'uncertainty ranges disclosed');
check(html.includes('runSelfTests'), 'derived-value self-tests present');
for (const ex of ['exportXRCapabilities','exportFormulaRegistry','exportSourceRegistry','exportValidationReport'])
  check(html.includes(ex), `export present: ${ex}`);
check(html.includes('not stereo-safe'), 'fractal fullscreen pass honestly excluded from XR');

/* 11 · XR Launch Gate, diagnostics, sanity route */
check(html.includes('XR LAUNCH GATE'), 'XR Launch Gate exists');
check(html.includes('isSecureContext'), 'window.isSecureContext displayed/checked');
check(html.includes('id="xrCheck"') && html.includes('XR CHECK'), 'XR CHECK UI exists');
check(html.includes('Export XR Diagnostics JSON'), 'Export XR Diagnostics JSON exists');
check(html.includes('lastSessionError'), 'requestSession errors surfaced in UI');
check(html.includes('fallbackRefSpace') && html.includes("requiredFeatures:['local']"),
  'reference-space fallback (required local) exists');
check(html.includes("requiredFeatures:['local-floor']"), 'primary VR request requires local-floor');
check(html.includes('xrtest'), '?xrtest=1 minimal sanity route exists');
check(html.includes('session.end()') || html.includes('session.end?.()'),
  'failed sessions are properly ended (no zombie sessions)');
check(html.includes('XR: HTTPS required') && html.includes('XR: checking'),
  'gate button states (checking/HTTPS/unsupported/failed) exist');

/* 12 · iPhone / mobile motion layer */
check(html.includes('DeviceOrientationEvent.requestPermission'), 'iOS DeviceOrientation permission code exists');
check(html.includes('DeviceMotionEvent.requestPermission'), 'iOS DeviceMotion permission code exists');
check(html.includes('Enable sensors &amp; request permissions'), 'permission-gated sensor enable button exists');
check(html.includes('Calibrate Neutral Pose') && html.includes('Reset Motion'), 'calibrate/reset controls exist');
check(html.includes("'deviceorientationabsolute'"), 'absolute compass mode handled');
check(html.includes('Sensor-assisted Look') && html.includes('FBS3R Ladder Tilt')
  && html.includes('Fractal Flight'), 'all motion modes present');
check(html.includes('events are unavailable') || html.includes('sensors unavailable'),
  'motion-sensor fallback message exists');

/* 13 · S³ multi-center lab */
check(html.includes('S3M'), 'S³ 4-vector math module exists');
check(html.includes('arccos') || html.includes('Math.acos(THREE.MathUtils.clamp(S3M.dot'),
  'geodesic distance formula chi=arccos<p,q> exists');
check(html.includes('S3M.norm'), 'quaternion normalization exists');
check(html.includes('fromHopf') && html.includes('fromPolar'), 'Hopf & geodesic-polar coordinates exist');
check(html.includes('CENTER LAB') || html.includes('Center Lab'), 'Center Lab UI exists');
check(html.includes('mathematical basepoint'), 'centers honestly labelled as mathematical basepoints');
check(html.includes('caps overlap'), 'two-cap overlap diagnostic exists');

/* 14 · FBS3R expansion + zodiac layer cleanup */
check(html.includes('fibExact'), 'exact BigInt Fibonacci mode exists');
check(html.includes('fbsDensExp'), 'density exponent control exists');
check(html.includes('Tier 2'), 'tier labelling for speculative exploration exists');
check(html.includes('Sensitivity Observatory'), 'Sensitivity Observatory exists');
check(html.includes('φ-Ladder Walk') && html.includes('Density Chamber'), 'FBS3R experiences wired');
check(html.includes('Sky zodiac constellations') && /Precession Age Wheel/i.test(html),
  'zodiac layers renamed & separated (sky vs age wheel)');
check(html.includes('not a duplicate'), 'layer-distinction tooltips exist');
check(html.includes('SKY_NAME_ELS') && html.includes('label deconfliction'),
  'distance-based label deconfliction exists');

/* 15 · Documentation set */
for (const f of ['README.md','VALIDATION.md','XR_VALIDATION.md','QUEST3_TEST_PLAN.md',
                 'QUEST3_START_HERE.md','COMPATIBILITY.md','SPATIAL_LABS_REBUILD.md'])
  check(existsSync(f), `doc exists: ${f}`);
check(readFileSync('QUEST3_START_HERE.md','utf8').includes('xrtest=1'),
  'start-here doc explains the ?xrtest=1 sanity route');

/* 16 · Event-handler integrity: every onclick/oninput assignment target id exists */
{
  const assigns = [...html.matchAll(/querySelector\('#([\w-]+)'\)\.(onclick|oninput|onchange)/g)].map(x => x[1]);
  for (const id of new Set(assigns))
    check(html.includes(`id="${id}"`), `handler target "${id}" exists in a template`);
}

/* 17 · Invariant Nexus: typed relation graph, dual embedding and export contract */
check(html.includes('const NEXUS_TYPES=') && html.includes('const NEXUS_RELATIONS='),
  'Invariant Nexus typed graph registry exists');
for (const kind of ['exact','representation','invariant','limit','coupling','causal','analogy','contrast'])
  check(html.includes(`${kind}:{color:`), `Invariant Nexus epistemic type present: ${kind}`);
check(html.includes('nexusMorph:0') && html.includes('function nexusLayout(')
  && html.includes('disciplinary_position') && html.includes('invariant_position'),
  'Invariant Nexus morphs between disciplinary and invariant embeddings and exports both coordinates');
check(html.includes('function nexusFindPath(') && html.includes('function nexusComparePath('),
  'Invariant Nexus typed pathfinding and Multiview comparison are wired');
check(html.includes('fbs3r_invariant_nexus.json') && html.includes('function nexusExportData('),
  'Invariant Nexus JSON export is wired');
check(html.includes('Graph distance is not physical distance') && html.includes('It is not equivalence, proof, physical distance'),
  'Invariant Nexus exposes a non-metric, non-equivalence epistemic firewall');
check(html.includes('id="v-nexus"') && html.includes("state.s3view==='nexus'")
  && html.includes("nexusGroup.visible   = v==='nexus'"),
  'Invariant Nexus is reachable, rendered and stepped as a full S³ laboratory');
check(html.includes('nexus(){return nexusDiagnostics();}') && html.includes('invariant_nexus:nexusExportData(false)'),
  'Invariant Nexus diagnostics are exposed through QA and the atlas manifest');

/* 18 · Symmetry Discovery Chamber: finite-orbit invariant instrument */
check(html.includes('const SYD_WORLDS=') && html.includes('function sydScan(')
  && html.includes('function sydDiagnostics(') && html.includes('function sydExportData('),
  'Symmetry Discovery finite-orbit scanner, diagnostics and reproducible export exist');
for (const world of ['rotation','lorentz','phase','symplectic','mobius'])
  check(new RegExp(`\\n  ${world}:\\{`).test(html), `Symmetry Discovery transformation space present: ${world}`);
check(html.includes('65-sample orbit') && html.includes('documented non-group perturbation')
  && html.includes('candidate library is not exhaustive'),
  'Symmetry Discovery declares sample count, perturbation semantics and non-exhaustive candidate scope');
check(html.includes('id="sydParam"') && html.includes('id="sydBreak"') && html.includes('id="sydTol"')
  && html.includes('id="sydCompare"') && html.includes('fbs3r_symmetry_discovery.json'),
  'Symmetry Discovery controls expose orbit position, symmetry break, tolerance, Multiview and JSON export');
check(html.includes('id="v-syd"') && html.includes("state.s3view==='syd'")
  && html.includes("sydGroup.visible     = v==='syd'") && html.includes('updateSyd(dt)'),
  'Symmetry Discovery is reachable, rendered and stepped as a full S³ laboratory');
check(html.includes("['sydAtlas','syd',sydGroup") && html.includes("['sydAtlas','noeAtlas'")
  && html.includes("['sydAtlas','relAtlas'") && html.includes("['sydAtlas','impAtlas'"),
  'Symmetry Discovery is registered in the Atlas with exact and theorem-bridge relations');
check(html.includes('symmetryDiscovery(world=state.sydWorld') && html.includes('symmetry_discovery:sydExportData()')
  && html.includes('finite sampled stability proves a theorem') && html.includes('not a theorem · not exhaustive'),
  'Symmetry Discovery diagnostics, manifest payload and epistemic firewall are exposed');

/* 19 · Holonomy Observatory: closed-path return maps across five exact stations */
check(html.includes('const HOL_STATIONS=') && html.includes('function holDiagnostics(')
  && html.includes('function holExportData(') && html.includes('function holSphereTransport(')
  && html.includes('function holBerryWilson('),
  'Holonomy Observatory exposes station registry, analytic diagnostics, finite transport and reproducible export');
for (const station of ['sphere','berry','su2','wigner','mobius'])
  check(new RegExp(`\\n  ${station}:\\{t:`).test(html), `Holonomy closed-journey station present: ${station}`);
check(html.includes('gamma_B = -Omega/2') && html.includes('C=U_x U_y U_x^-1 U_y^-1')
  && html.includes('Omega_W = -2 atan') && html.includes('Tr(H C H^-1)=Tr C'),
  'Holonomy formula registry covers curvature flux, Berry phase, Wilson loop, Wigner rotation and Möbius trace');
check(html.includes('id="holA"') && html.includes('id="holB"') && html.includes('id="holCompare"')
  && html.includes('fbs3r_holonomy_observatory.json') && html.includes('257-vertex Pancharatnam'),
  'Holonomy controls expose two parameters, finite polygon semantics, Multiview and JSON export');
check(html.includes('id="v-hol"') && html.includes("state.s3view==='hol'")
  && html.includes("holGroup.visible     = v==='hol'") && html.includes('updateHol(dt)'),
  'Holonomy Observatory is reachable, rendered and stepped as a full S³ laboratory');
check(html.includes("['holAtlas','hol',holGroup") && html.includes("['holAtlas','sydAtlas'")
  && html.includes("['holAtlas','su2Atlas'") && html.includes("['holAtlas','relAtlas'")
  && html.includes("['holAtlas','impAtlas'"),
  'Holonomy Observatory is registered in Atlas with method, quantum, relativistic and Möbius bridges');
check(html.includes('holonomy(station=state.holStation') && html.includes('holonomy_observatory:holExportData()')
  && html.includes('structurally similar holonomies prove') && html.includes('not a physical measurement')
  && html.includes('exhaustive holonomy classification'),
  'Holonomy diagnostics, manifest payload and cross-domain epistemic firewall are exposed');

/* 20 · Contact & Action Observatory: contact dynamics, return maps and semiclassical lift */
check(html.includes('const ACT_STATIONS=') && html.includes('function actDiagnostics(')
  && html.includes('function actExportData(') && html.includes('function actContactResidual(')
  && html.includes('function actHopf('),
  'Contact & Action Observatory exposes native R4 identities, station diagnostics and reproducible export');
for (const station of ['reeb','return','legendrian','ks','maslov'])
  check(new RegExp(`\\n  ${station}:\\{t:`).test(html), `Contact & Action exact station present: ${station}`);
for (const formula of ['act.reeb','act.return','act.legendrian','act.ks','act.maslov'])
  check(html.includes(`id:'${formula}'`), `Contact & Action formula registry entry present: ${formula}`);
check(html.includes('lambda_0(R)=1') && html.includes('theta_return=2 pi b/a')
  && html.includes('lambda_0(gamma_dot)=0') && html.includes('|X|=|u|^2')
  && html.includes('exp(-i pi mu/2)=-1'),
  'Contact & Action registry spans Reeb, ellipsoid, Legendrian, KS and Maslov identities');
check(html.includes('id="actA"') && html.includes('id="actB"') && html.includes('id="actCompare"')
  && html.includes('id="actExport"') && html.includes('fbs3r_contact_action_observatory.json'),
  'Contact & Action controls expose both parameters, Multiview composition and JSON export');
check(html.includes('id="v-act"') && html.includes("state.s3view==='act'")
  && html.includes("actGroup.visible     = v==='act'") && html.includes('updateAct(dt)'),
  'Contact & Action Observatory is reachable, rendered and stepped as a full S3 laboratory');
check(html.includes("['actAtlas','act',actGroup") && html.includes("['actAtlas','pspAtlas'")
  && html.includes("['actAtlas','hopfAtlas'") && html.includes("['actAtlas','noeAtlas'")
  && html.includes("['actAtlas','qmAtlas'") && html.includes("['actAtlas','holAtlas'"),
  'Contact & Action is registered in Atlas with symplectic, Hopf, KS, semiclassical and holonomy bridges');
check(html.includes('contactAction(station=state.actStation')
  && html.includes('contact_action_observatory:actExportData()')
  && html.includes('finite station proves a theorem about arbitrary contact forms')
  && html.includes('not four-dimensional metric evidence')
  && html.includes('not experimental data'),
  'Contact & Action diagnostics, manifest payload and epistemic firewall are exposed');

/* 21 · Spinor & Light-Cone Observatory: projective, Lorentz, null-frame and conformal chain */
check(html.includes('const NUL_STATIONS=') && html.includes('function nulDiagnostics(')
  && html.includes('function nulExportData(') && html.includes('function nulSL2(')
  && html.includes('function nulTransformVec('),
  'Spinor & Light-Cone Observatory exposes native complex, Hermitian and Minkowski diagnostics with reproducible export');
for (const station of ['null','lorentz','celestial','tetrad','diamond'])
  check(new RegExp(`\\n  ${station}:\\{t:`).test(html), `Spinor & Light-Cone exact station present: ${station}`);
for (const formula of ['nul.pauli','nul.lorentz','nul.celestial','nul.tetrad','nul.diamond'])
  check(html.includes(`id:'${formula}'`), `Spinor & Light-Cone formula registry entry present: ${formula}`);
check(html.includes('det X=x_mu x^mu') && html.includes('cross-ratio is invariant')
  && html.includes('m tensor m -> exp(2i chi)') && html.includes('sec^2(U) sec^2(V)'),
  'Spinor & Light-Cone registry spans Pauli, Lorentz, celestial Möbius, null-tetrad and conformal identities');
check(html.includes('id="nulA"') && html.includes('id="nulB"') && html.includes('id="nulCompare"')
  && html.includes('id="nulExport"') && html.includes('fbs3r_spinor_lightcone_observatory.json'),
  'Spinor & Light-Cone controls expose both parameters, Multiview composition and JSON export');
check(html.includes('id="v-nul"') && html.includes("state.s3view==='nul'")
  && html.includes("nulGroup.visible     = v==='nul'") && html.includes('updateNul(dt)'),
  'Spinor & Light-Cone Observatory is reachable, rendered and stepped as a full S3 laboratory');
check(html.includes("['nulAtlas','nul',nulGroup") && html.includes("['nulAtlas','hopfAtlas'")
  && html.includes("['nulAtlas','su2Atlas'") && html.includes("['nulAtlas','relAtlas'")
  && html.includes("['nulAtlas','gwAtlas'") && html.includes("['nulAtlas','bhrAtlas'"),
  'Spinor & Light-Cone is registered in Atlas with Hopf, spinor, relativistic, polarization and curved-ray bridges');
check(html.includes('spinorLightcone(station=state.nulStation')
  && html.includes('spinor_lightcone_observatory:nulExportData()')
  && html.includes('qubits, photons and gravitational waves are one physical system')
  && html.includes('not experimental data') && html.includes('curved-spacetime or quantum-gravity solver'),
  'Spinor & Light-Cone diagnostics, manifest payload and native-space epistemic firewall are exposed');

/* 22 · Native scientific spatial rendering: geometry carries the model */
check(html.includes('function scientificFresnelMaterial(')
  && html.includes('function scientificParametricSurface(')
  && html.includes('function scientificReplaceRibbon('),
  'shared scientific shader, parametric-surface and ribbon primitives exist');
check(html.includes('opticalHairline:true') && html.includes('new THREE.InstancedMesh(')
  && html.includes('function scientificContactPlanes(')
  && html.includes('A scientific path is a hairline'),
  'hairline paths, sparse instanced flows and transported plane fields are wired');
check(html.includes('paths are sub-pixel/hairline geodesics, phase is twist')
  && html.includes('residual is geometric')
  && html.includes('separation, transport carries a frame')
  && html.includes('a single white tracer owns motion'),
  'native visual encodings declare their scientific meaning and projection boundary');
check(html.includes('eight-axis relation tensor')
  && html.includes('Symmetry transformation field')
  && html.includes('Holonomy native transport space')
  && html.includes('Contact geometry native field')
  && html.includes('Null geometry native field'),
  'all five rebuilt laboratories expose distinct native spatial fields');
check(!html.includes('SYD.bars') && !html.includes('HOL.needle')
  && !html.includes('ACT.needle') && !html.includes('NUL.coreRings')
  && !html.includes('NEXUS.coreRings'),
  'legacy presentation bars, detached needles and shared ring-core templates are absent');
check(html.includes('chain.visible=false; cap.visible=false; pir.visible=false; dd.visible=false')
  && html.includes('deterministic equal-probability quantiles')
  && html.includes('causal fraction = geodesic-distance CDF (exact)'),
  'DRD presentation boards are retired in favour of one exact spatial carrier-modal-causal instrument');
check(html.includes('bundle of chromoelectric field lines')
  && html.includes('energy is depth · tunnel aperture is αs(Q)')
  && html.includes('one sharp exchange tracer remains legible at every separation'),
  'Chromodynamics uses field congruences, a Y junction and a renormalisation tunnel instead of bars or rods');
check(html.includes('TOV cutaway') || (html.includes('TOV interior') && html.includes('Math.PI*1.5')),
  'Neutron-star TOV state is rendered as a spatial cutaway rather than an embedded M-R chart');
check(html.includes('SUPERNOVA RADIATION–HYDRODYNAMICS LAB')
  && html.includes('function snBuildArnettCurve(')
  && html.includes('function snRemnantState(')
  && html.includes('function snMorphologyMetrics(')
  && html.includes('forward/contact/reverse shock surfaces'),
  'Supernova is a native spatial transport/remnant instrument with diffusion, phase surfaces and measured finite morphology');
check(html.includes('The magnetosphere is the object: a sparse dipole congruence')
  && html.includes('pulse when a polar caustic crosses this sight-line'),
  'Pulsar makes field topology and observer crossing spatial, with no opaque beam cones or P-Pdot chart');
check(html.includes('A differential-orbit particle sheet makes temperature, shear and Doppler')
  && html.includes('Twin jets are congruences of thin streamlines')
  && html.includes('const dust=new THREE.Points'),
  'Quasar uses GPU differential accretion, a black horizon and streamline jets instead of an overexposed disk');
check(html.includes("dense=D.station==='return'")
  && html.includes('actualClosed=!!(closed&&pts.length>2)')
  && html.includes('u=((raw%1)+1)%1')
  && html.includes('#ifdef USE_INSTANCING')
  && html.includes('function scientificReleaseInactiveLabs(')
  && html.includes('renderer.renderLists?.dispose?.()')
  && html.includes('function scientificCameraPreset('),
  'exposure, curves, reverse flow, instancing, GPU lifetime and narrow-screen framing are guarded');
check(['sydGroup','holGroup','actGroup','nulGroup','nexusGroup','rmhdGroup','wdGroup'].every(g=>html.includes(`s3Group.add(${g})`))
  && !['sydGroup','holGroup','actGroup','nulGroup','nexusGroup','rmhdGroup','wdGroup'].some(g=>html.includes(`scene.add(${g})`)),
  'recent S3 observatories are contained by the S3 mode root and cannot leak into Solar or Observable');
check(html.includes("const SCIENTIFIC_TRANSIENT_LABS=['syd','hol','act','nul','qcd','cmb','ns','sn','psr','qso','rmhd','wd']")
  && html.includes('scientificReleaseInactiveLabs(MV.views.slice(0,MV.n),true)')
  && html.includes("if(mode!=='s3')scientificReleaseInactiveLabs('',true)"),
  'transient GPU laboratories have a bounded keep-set in Multiview and are force-released outside S3');
check(html.includes('SCI_GEOM_STATS.reuses++') && html.includes("a&&a.count===sample.length")
  && html.includes('float wave=.5+.5*sin(dot(vLocal') && !html.includes('uTime*.48'),
  'dynamic scientific paths reuse position buffers and the shared alpha field is temporally stable');
check(html.includes('function mvSemanticSelection(') && html.includes("const anchor=state.s3view||'sec'")
  && html.includes("if(r.a===anchor)offer(r.b") && html.includes("else if(r.b===anchor)offer(r.a")
  && html.includes('function mvReplaceAt(') && html.includes('function uiSetS3View(')
  && html.includes('mvSetSlot(MV.active,v)') && html.includes('mvExit(false)'),
  'Multiview retains the current anchor, semantically fills companions, replaces only the active tile and exits without rebuilding');
check(html.includes('m.userData.supernovaStablePoints=true')
  && html.includes('particles.frustumCulled=false')
  && html.includes('#include <common>')
  && html.includes('function snPhotosphereMaterial()') && html.includes('float linearLimb=')
  && html.includes('gl_PointSize=clamp(')
  && html.includes('depthTest:true,depthWrite:false')
  && html.includes('const time=Math.min(400')
  && html.includes('function snSyncControls(domain)')
  && !html.includes('if(snT>400) snT=0.5')
  && !html.includes('const ejectaLight=new THREE.Sprite')
  && !html.includes('const shockGlow=new THREE.Sprite'),
  'Supernova uses one bounded stable GPU point draw, explicit depth testing and a non-wrapping timeline');

/* 23 · Premium visual engine: cinematic consistency without scientific mutation */
check(html.includes('let premiumVisualsEnabled=false') && html.includes("localStorage.getItem(PREMIUM_VISUALS_KEY)==='1'")
  && html.includes('renderer.toneMapping=premiumVisualsEnabled?THREE.ACESFilmicToneMapping:THREE.NoToneMapping'),
  'classic presentation is the fresh-browser default and ACES is explicit opt-in');
check(html.includes('id="premiumVisualsBtn"') && html.includes('aria-pressed="false"')
  && html.includes('function setPremiumVisuals(') && html.includes("PREMIUM_VISUALS_KEY='s3.premiumVisuals'"),
  'settings exposes one persistent Premium visuals switch, off by default');
check(html.includes('const PREMIUM_POST_MAX=') && html.includes('function premiumPerformanceTick(')
  && html.includes("premiumSetPostQuality(premiumPostQuality-.14,'frame-pressure')")
  && html.includes("premiumSetPostQuality(premiumPostQuality+.08,'quality-recovery')"),
  'flat-screen bloom has bounded adaptive degradation and slow quality recovery');
check(html.includes('function premiumBloomProfile(') && html.includes('function resetBloomComposer(')
  && html.includes('premiumComposerPixelRatio()'),
  'bloom profiles, independent buffer cap and recovery path are wired');
check(html.includes('function premiumDeclutterLabels(') && html.includes("classList.add('declutter-hidden')")
  && html.includes('premiumLabelPriority('),
  'global priority-based CSS2D collision management is wired');
check(html.includes("premiumStage.name='Cinematic non-metric laboratory stage'")
  && html.includes('premiumStage.visible=premiumVisualsEnabled&&op>0&&!mv&&!xr&&!webglContextLost')
  && html.includes('premiumStage.visible=false; // a single camera-facing stage is invalid across four tile cameras'),
  'cinematic stage is opt-in, explicitly non-metric and excluded from XR, Multiview and context-loss states');
check(html.includes('const PREMIUM_VIEW_DOMAINS=') && html.includes('premiumApplyProfile(')
  && html.includes("root.style.setProperty('--lab-accent'"),
  'laboratory-domain color direction is centralized and UI/scene synchronized');
check(html.includes('#cinemaFrame,#sceneTransition{display:none}')
  && html.includes('body.premium-visuals #cinemaFrame') && html.includes('body.premium-visuals .panel')
  && html.includes('body.premium-visuals .label.declutter-hidden'),
  'all premium UI, frame and label styling is scoped behind the opt-in body class');
check(html.includes('id="cinemaFrame"') && html.includes('id="sceneTransition"')
  && html.includes('PREMIUM VISUAL ENGINE') && html.includes('@media(prefers-reduced-motion:reduce)'),
  'optional premium UI frame, transitions, responsive treatment and reduced-motion guard remain available');

/* 24 · CMB low-multipole observatory: synthesis, uncertainty and inverse problem */
check(html.includes('function cmbCoefficientSet(') && html.includes('function cmbRecover(')
  && html.includes('function cmbAnalyze(') && html.includes('function cmbExportData('),
  'CMB observatory exposes deterministic synthesis, numerical inverse transform, diagnostics and export');
for (const station of ['sky','mode','alignment','residual'])
  check(html.includes(`${station}:'`) || html.includes(`${station}: '`),
    `CMB observatory station present: ${station}`);
for (const formula of ['cmb.estimator','cmb.cosmic_variance','cmb.mask','cmb.parseval'])
  check(html.includes(`id:'${formula}'`), `CMB formula registry entry present: ${formula}`);
check(html.includes('sigma(C_l)/C_l=sqrt(2/(2l+1))')
  && html.includes('mode-coupling matrix is not deconvolved')
  && html.includes('not a Planck map, likelihood, anomaly p-value or topology detection'),
  'CMB cosmic variance, masked pseudo-Cl limitation and observational firewall are explicit');
check(html.includes('cosmic-variance armillary') && html.includes('scientificReplaceRibbon(R.band')
  && html.includes('cmbContourPoints(') && html.includes('const tracer=scientificCrystal'),
  'CMB model, realization, uncertainty, field contours and motion are spatial encodings rather than a presentation chart');
check(html.includes("id:'cmbmodes'") && html.includes("views:['cmb','sh','eig','mimg']")
  && html.includes("['cmbAtlas','bbAtlas'") && html.includes("['cmbAtlas','lensAtlas'"),
  'CMB has a prepared Multi-View quartet plus explicit representation, spectral and lensing relations');
check(html.includes('CMB observatory: full-sky forward/inverse harmonic transform closes below 2%')
  && html.includes('CMB observatory: exact full-sky cosmic variance at l=2'),
  'CMB deterministic, estimator, variance and inverse-closure runtime tests are installed');

/* 25 · Universal prediction and validation workbench */
check(html.includes('const PREDICTION_CLASSES=') && html.includes('const PREDICTION_CLASS_MEMBERS=')
  && html.includes('const PREDICTION_TARGETS='),
  'prediction layer declares typed classes, complete laboratory membership and specific targets');
for (const kind of ['exact','numerical','reference','conditional','exploratory'])
  check(new RegExp(`\\n  ${kind}:`).test(html), `prediction class present: ${kind}`);
check(html.includes('function predictionContract(') && html.includes('function predictionExperimentManifest(')
  && html.includes('function predictionWorkbenchHTML(') && html.includes('bindPredictionWorkbench(V)'),
  'every active laboratory receives a generated contract, UI workbench and reproducible experiment export');
check(html.includes('validity_domain:') && html.includes('calibration_status:')
  && html.includes('forbidden_upgrade:') && html.includes('falsifier:cls.falsifier'),
  'prediction contracts expose domain, calibration, validation and falsification boundaries');
check(html.includes('id="mvPredictionMatrix"') && html.includes('function predictionMatrixHTML(')
  && html.includes('Side-by-side proximity is not equality, correlation or causation.'),
  'Multi-View renders simultaneous typed prediction outputs without implying equality or causation');
check(html.includes('prediction_contracts:Object.keys(S3_VIEW_NAMES).map(predictionContract)')
  && html.includes('predictions(){return Object.keys(S3_VIEW_NAMES).map(predictionContract);}')
  && html.includes('Prediction contract classifies every S³ laboratory exactly once'),
  'prediction contracts are exported, QA-queryable and guarded by exhaustive runtime coverage tests');
check(readFileSync('SCIENTIFIC_CONTRACT.md','utf8').includes('## Prediction and validation contract')
  && readFileSync('SCIENTIFIC_CONTRACT.md','utf8').includes('### CMB Multipole Observatory operational contract')
  && readFileSync('SCIENTIFIC_CONTRACT.md','utf8').includes('### Supernova Radiation-Hydrodynamics operational contract'),
  'scientific contract documents prediction classes plus the CMB and Supernova model boundaries');

/* 26 · Stellar / compact-object best-of-both audit and new physical rung */
check(['flux','helicity','reconnection','shock','instability'].every(s=>html.includes(`${s}:'`))
  && html.includes('function rmhdDiagnostics(') && html.includes('function rmhdExportData(')
  && ['rmhd.flux','rmhd.helicity','rmhd.sweet_parker','rmhd.shock','rmhd.rt'].every(id=>html.includes(`id:'${id}'`)),
  'Radiation-MHD observatory exposes five reduced stations, analytic diagnostics, provenance and reproducible export');
check(html.includes('Gauss integral of the displayed closed flux pair measures one link')
  && html.includes('Sweet–Parker inflow and sheet aspect are exactly')
  && html.includes('magnetic tension crosses the linear Rayleigh–Taylor stability boundary'),
  'Radiation-MHD linking, reconnection, shock and stability benchmark tests are installed');
check(html.includes('function wdMch(') && html.includes('function wdRadiusKm(') && html.includes('function wdDiagnostics(')
  && html.includes('const N=30,inst=new THREE.InstancedMesh')
  && html.includes("id:'wd.chandrasekhar'") && html.includes("id:'wd.nauenberg'"),
  'White-dwarf laboratory computes the composition-dependent Chandrasekhar/Nauenberg family and renders configurations, not a chart');
check(html.includes('White dwarf: μ_e=2 gives M_Ch=1.454 M☉')
  && html.includes('contracts monotonically and tends toward zero at the analytic endpoint'),
  'White-dwarf canonical radius and endpoint monotonicity runtime tests are installed');
check(html.includes('function bhtKerr(') && html.includes('KERR HORIZON · black surface r₊')
  && html.includes('Schwarzschild evaporation worldtube')
  && html.includes('increasing spin shrinks horizon area and surface-gravity temperature'),
  'Black-hole thermodynamics separates exact Kerr horizon quantities from idealized Schwarzschild evaporation');
check(html.includes('OUTGOING NULL WAVEFRONTS') && html.includes('normalized Stokes state on S²')
  && html.includes('test masses · h₊ stretches space') && !html.includes('GW_NW'),
  'Gravitational-wave laboratory uses native null wavefronts, tensor polarization and detector response without a flat waveform strip');
check(html.includes("id:'stellar-cycle'") && html.includes("views:['wd','sn','ns','rmhd']")
  && html.includes("id:'magnetized-plasma'") && html.includes("views:['rmhd','psr','qso','hopfion']")
  && html.includes('radiationMhd(){try{return rmhdDiagnostics();}')
  && html.includes('whiteDwarf(){try{return wdDiagnostics();}'),
  'stellar-cycle and magnetized-plasma Multi-View quartets plus read-only QA diagnostics are integrated');
check(readFileSync('STELLAR_BLACK_HOLE_AUDIT.md','utf8').includes('## New missing rung: white dwarfs')
  && readFileSync('STELLAR_BLACK_HOLE_AUDIT.md','utf8').includes('## New bridge: Radiation-MHD and magnetic helicity')
  && readFileSync('SCIENTIFIC_CONTRACT.md','utf8').includes('## Compact-object and radiation-MHD extensions')
  && readFileSync('README.md','utf8').includes('69 scientific laboratory views around it through 144 declared relations')
  && readFileSync('README.md','utf8').includes('all 70 S³ laboratories'),
  'stellar lineage, best-of-both decisions and scientific model boundaries are documented');

/* 27 · OmniAtlas predictive-foundations transfer and restored radiation field */
{
  /* Execute the exact DOM-free Smith functions extracted from index.html. This
     complements the browser self-test and prevents a static substring check
     from accepting a numerically broken parser or inverse. */
  const functionSource=name=>{
    const start=html.indexOf(`function ${name}(`);if(start<0)return '';
    const open=html.indexOf('{',start);let depth=0,quote='',escape=false;
    for(let i=open;i<html.length;i++){const c=html[i];
      if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote='';continue;}
      if(c==='\''||c==='"'||c==='`'){quote=c;continue;}if(c==='{')depth++;else if(c==='}'&&--depth===0)return html.slice(start,i+1);
    }return '';
  };
  try{
    const names=['impGamma','impZof','impRlcGamma','impParseTouchstone','impFitSeriesRLC'],src=names.map(functionSource);
    const impMedian=a=>{const q=a.filter(Number.isFinite).sort((x,y)=>x-y);if(!q.length)return NaN;const h=q.length>>1;return q.length%2?q[h]:(q[h-1]+q[h])/2;};
    const api=new Function('impMedian',src.join('\n')+';return {impRlcGamma,impParseTouchstone,impFitSeriesRLC};')(impMedian);
    const rows=['# MHz S RI R 50'];for(let i=0;i<41;i++){const f=1+i*.25,g=api.impRlcGamma(f*1e6,32,1.4e-6,470e-12,50);rows.push(`${f} ${g[0]} ${g[1]}`);}
    const parsed=api.impParseTouchstone(rows.join('\n'),'exact.s1p'),fit=api.impFitSeriesRLC(parsed.samples,parsed.z0);
    check(parsed.samples.length===41&&parsed.z0===50&&fit.ok&&fit.adequate
      &&Math.abs(fit.R/32-1)<1e-10&&Math.abs(fit.L/1.4e-6-1)<1e-9
      &&Math.abs(fit.C/470e-12-1)<1e-9&&fit.holdoutRmse<1e-10&&fit.conditionNumber<1e8&&fit.resonanceInBand,
      'extracted Smith parser and withheld inverse numerically recover an exact series-RLC sweep');
    const narrow=[];for(let i=0;i<21;i++){const f=1e6+i*2500,g=api.impRlcGamma(f,32,1.4e-6,470e-12,50);narrow.push({f,gr:g[0],gi:g[1]});}const narrowFit=api.impFitSeriesRLC(narrow,50);
    check(!narrowFit.adequate&&(!narrowFit.resonanceInBand||narrowFit.conditionNumber>=1e8),
      'Smith domain gate refuses a narrow sweep that cannot support an in-band resonance prediction');
    const s2=['[Number of Ports] 2','[Reference] 75 75','# GHz S DB R 75','[Network Data]'];for(let i=1;i<=6;i++)s2.push(`${i} -6 90 -80 0 -80 0 -80 0`);s2.push('[Noise Data]','1 2 3 4 5','[End]');
    const p2=api.impParseTouchstone(s2.join('\n'),'v2.s2p');
    check(p2.samples.length===6&&p2.z0===75&&Math.abs(p2.samples[0].f-1e9)<1e-6
      &&Math.abs(p2.samples[0].gr)<1e-12&&Math.abs(p2.samples[0].gi-Math.pow(10,-6/20))<1e-12,
      'extracted Touchstone parser preserves S2P v2 port count, GHz, DB phase and reference impedance');
    let rejected=0;for(const bad of ['[Number of Ports] 2\n[Matrix Format] Lower\n# GHz S RI R 50','#[space] GHz Z RI R 50'.replace('[space]',''),'# GHz S RI R 50\n1 nope 0'])try{api.impParseTouchstone(bad,'bad.s2p');}catch(e){rejected++;}
    check(rejected===3,'Touchstone import rejects triangular, non-S and malformed network data instead of silently reinterpreting them');
  }catch(e){check(false,'extracted Smith numerical validation executes: '+e.message);}
  const hbar=1.054571817e-34,c=2.99792458e8,G=6.67430e-11,kB=1.380649e-23,h=2*Math.PI*hbar,M=1.98892e30,
    T=m=>hbar*c**3/(8*Math.PI*G*m*kB),L=m=>hbar*c**6/(15360*Math.PI*G*G*m*m),life=m=>5120*Math.PI*G*G*m**3/(hbar*c**4),peak=2.8214393721220787*kB*T(M)/h;
  check(Math.abs(T(2*M)/T(M)-.5)<1e-15&&Math.abs(L(2*M)/L(M)-.25)<1e-15
    &&Math.abs(life(2*M)/life(M)-8)<1e-14&&Math.abs(h*peak/(kB*T(M))-2.8214393721220787)<1e-14,
    'independent Schwarzschild reference closes the thermal peak and M^-1/M^-2/M^3 scaling laws');
}
check(html.includes('function impParseTouchstone(') && html.includes('function impFitSeriesRLC(')
  && html.includes('holdout:i%5===0') && html.includes('conditionNumber') && html.includes('passivityViolations') && html.includes('function impAssimExport('),
  'Smith lab parses Touchstone S1P/S2P and fits an explicitly withheld series-RLC inverse');
check(html.includes('id="impTouchstone"') && html.includes('id="impSynthetic"')
  && html.includes('id="impAssimExport"') && html.includes('measured S11 · RLC holdout forecast on the Riemann sphere'),
  'Smith measurement assimilation, reproducible reference, spatial forecast and export are reachable');
check(html.includes('Möbius–Smith assimilation: Touchstone S1P RI parser')
  && html.includes('passes unseen every-fifth-point holdout'),
  'Smith parser, inverse recovery and unseen holdout runtime benchmarks are installed');
check(html.includes('function pfFiniteAudit(') && html.includes('function pfInverseRoots(')
  && html.includes('function pfSydAudit(') && html.includes('function pfUpdateSpatial('),
  'shared predictive kernel exposes sensitivity, uncertainty, exact holdout, inverse roots and native future geometry');
check(html.includes('PF_AUDIT_CACHE')
  && html.includes('if(PF_AUDIT_CACHE.has(cacheKey))return PF_AUDIT_CACHE.get(cacheKey)'),
  'expensive inverse and holdout audits are memoized instead of recomputed every animation frame');
check(html.includes('predictiveRuntime(){return {auditCacheEntries:PF_AUDIT_CACHE.size')
  && html.includes('blackHoleRadiation:bhtObjs?.station'),
  'read-only QA exposes predictive cache, spatial attachment and frozen-radiation runtime state');
check(html.includes('if(glowTexture.shared)return glowTexture.shared')
  && html.includes("t.name='shared radial laboratory glow'"),
  'identical laboratory halos reuse one immutable GPU texture across station rebuilds');
check(['syd','hol','act','nul'].every(v=>html.includes("pfPanelHTML('"+v+"')"))
  && html.includes('operational_forecast:operational')
  && html.includes("ATLAS_BUS.pub(v+'.forecast'") && html.includes("v==='nexus'?'nexus.recall5'")
  && html.includes("id:'predict.local_holdout'") && html.includes("id:'predict.uncertainty'")
  && html.includes("id:'predict.inverse'"),
  'all four exact observatories and universal prediction contracts carry operational forecasts');
check(html.includes('Forty-eight orbit samples train') && html.includes('sixteen interleaved samples remain unseen')
  && html.includes('Symmetry Discovery keeps interleaved train/holdout decisions separate')
  && html.includes('id="pfSydCandidate"') && html.includes('candidate_id:C.id'),
  'Symmetry Discovery separates candidate training from holdout falsification and predicts a break threshold');
check(html.includes('function nexusSpectralEmbedding(') && html.includes('shifted orthogonal iteration, 96 deterministic iterations')
  && html.includes("nexusLens:'local'") && html.includes('data-nx-lens="'),
  'Invariant Nexus uses deterministic spectral geometry and an uncluttered local lens by default');
check(html.includes('function nexusStructuralCalibration(') && html.includes('leave-one-declared-edge-out resource-allocation score')
  && html.includes('No candidate is a registry edge until a typed scientific claim')
  && html.includes("id:'nexus.resource_allocation'"),
  'Nexus bridge hypotheses are held-edge calibrated and protected by an admission firewall');
{
  const block=html.slice(html.indexOf('BLACK-HOLE HORIZON THERMODYNAMICS OBSERVATORY'),html.indexOf('CMB LOW-MULTIPOLE LAB'));
  check(block.includes("station==='radiation'") && block.includes('function bhtRadiationAudit(')
    && block.includes('BHT_XPEAK=2.8214393721220787') && block.includes('wavefronts')
    && block.includes('mass-temperature-lifetime constellation') && block.includes('O.flux.visible&&radiationFrame')
    && block.includes("O.station==='radiation'&&radiationFrame") && block.includes('O.radiationPrimed=true') && !block.includes('Math.random'),
    'Black-hole radiation restores halo/flux phenomenology with deterministic wavefronts and a spatial mass-scaling constellation');
}
check(html.includes('Black-hole radiation: dimensionless energy-spectrum peak')
  && html.includes('T proportional to M^-1, L proportional to M^-2 and lifetime proportional to M^3')
  && html.includes("id:'bh.thermal_peak'"),
  'black-hole spectral peak and independent mass-scaling runtime closures are installed');
check(existsSync('PREDICTIVE_FOUNDATIONS_AUDIT.md')
  && readFileSync('PREDICTIVE_FOUNDATIONS_AUDIT.md','utf8').includes('## Smith measurement assimilation')
  && readFileSync('SCIENTIFIC_CONTRACT.md','utf8').includes('## Operational predictive foundations'),
  'predictive transfer, assumptions, rejection gates and provenance are documented');

console.log('\n' + (failures === 0
  ? '✔ ALL CHECKS PASSED'
  : `✗ ${failures} CHECK(S) FAILED`));
process.exit(failures === 0 ? 0 : 1);
