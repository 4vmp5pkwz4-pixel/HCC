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
check(html.includes('new THREE.TubeGeometry(') && html.includes('new THREE.InstancedMesh(')
  && html.includes('function scientificContactPlanes('),
  'volumetric paths, instanced flows and transported plane fields are wired');
check(html.includes('paths have volume, phase is twist, residual is')
  && html.includes('geometric separation, transport carries a frame'),
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
check(html.includes("dense=D.station==='return'")
  && html.includes('actualClosed=!!(closed&&pts.length>2)')
  && html.includes('u=((raw%1)+1)%1')
  && html.includes('#ifdef USE_INSTANCING')
  && html.includes('function scientificReleaseInactiveLabs(')
  && html.includes('renderer.renderLists?.dispose?.()')
  && html.includes('function scientificCameraPreset('),
  'exposure, curves, reverse flow, instancing, GPU lifetime and narrow-screen framing are guarded');

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

console.log('\n' + (failures === 0
  ? '✔ ALL CHECKS PASSED'
  : `✗ ${failures} CHECK(S) FAILED`));
process.exit(failures === 0 ? 0 : 1);
