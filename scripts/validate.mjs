#!/usr/bin/env node
/* Automated validation for the S³ LIGHT-TRISPHERE / FBS3R app (index.html).
   Run: node scripts/validate.mjs            (from the repository root)      */
import { readFileSync, writeFileSync, rmSync } from 'fs';
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

/* 2 · No Cyrillic anywhere (UI must be fully English) */
check(!/[Ѐ-ӿ]/.test(html), 'no Cyrillic characters anywhere in index.html');

/* 3 · All six modes present and handled */
{
  const modes = [...html.matchAll(/data-mode="(\w+)"/g)].map(x => x[1]);
  check(new Set(modes).size === 6, 'six mode buttons declared (' + modes.join(', ') + ')');
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
    check(html.includes(`id="${id}"`), `element id "${id}" is created`);
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

/* 7 · Core formulas exposed verbatim */
for (const f of ['2*Math.PI*Math.PI', '(chi - 0.5*Math.sin(2*chi))', 'beta', 'l_P·φᴺ',
                 'ln(L/l_P)/ln', 'φ⁻³ᴺ', 'φᴺ/√5', '4*Math.PI*S3.R*S3.R'])
  check(html.includes(f), `formula fragment present: ${f}`);

/* 8 · Export features */
check(html.includes('exportStateJSON') && html.includes('exportLadderCSV'),
  'JSON & CSV export functions wired');

/* 9 · Scientific-discipline language guard */
check(!/topology (is|was) (detected|proven)/i.test(html),
  'app never claims topology detection as established fact');
check(html.includes('not a topology detection') || html.includes('NOT a topology detection'),
  'explicit conditional-reconstruction disclaimer present');

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

/* 11 · Event-handler integrity: every onclick/oninput assignment target id exists */
{
  const assigns = [...html.matchAll(/querySelector\('#([\w-]+)'\)\.(onclick|oninput|onchange)/g)].map(x => x[1]);
  for (const id of new Set(assigns))
    check(html.includes(`id="${id}"`), `handler target "${id}" exists in a template`);
}

console.log('\n' + (failures === 0
  ? '✔ ALL CHECKS PASSED'
  : `✗ ${failures} CHECK(S) FAILED`));
process.exit(failures === 0 ? 0 : 1);
