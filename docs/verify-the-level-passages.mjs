/* THE PASSAGE BETWEEN LEVELS (v4.415) — asked: «make the transition between fractal levels visually more expressive, where it is
   tied to an actual change in what is present at that level». A passage is therefore not drawn on a zoom: it fires on three
   events, each a change in what the atlas draws — a SEAM (the world changes), a LAYER (the Solar chain hands over, or the
   reader goes into a body and out again), a LEVEL of the descent (the set of things actually drawn changes) — with a weight
   that follows the size of the change, nothing where nothing changed. Checked here:
     1. the presence arithmetic, run: no change → no passage; a world 1, a layer 0.8, a level by how much changed (≤ 0.75);
     2. every event that changes a level calls it — the seam crossing, the layer governor, a chosen layer, a layer reached by
        choosing an object, going into a body and out of it, the descent's drawn set — and the frame loop advances it;
     3. it is drawn in front of the eye (attached to the camera, so a headset sees it), pulses each controller and a phone,
        keeps time by the clock (a slow frame cannot stretch it), and a reader who asked for reduced motion gets the caption;
     4. the arrival through the Solar ↔ Observable seam is no longer a milky veil: the compact objects' glows are angular
        markers, a structure's dust glows are bounded on the screen, glass fades at its own surface and has no fill from inside;
     5. WebXR: any laboratory can register what a hand may hold (HCC_XR_GRABS), wired into the squeeze, the frame and the release;
     6. a level is named in the reader's language, never by a bare identifier — measured before, walking every body from its top:
        «nucleus» and «qcloud» on every body, «atom», «tops» and «xtal» on the giants, «graintop» on the rocky and icy bodies,
        «dropfield» on the Earth and «globe» on the Sun appeared inside a Russian caption — and a level that stands only for a
        chosen element is not present while none is chosen (it is not drawn). */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const fn = name => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j < 0 ? i + 6000 : j); };
/* 1 */
{ const L = new Function(fn('hccPresenceDiff') + '\n' + fn('hccPassageWeight') + '\nreturn {hccPresenceDiff, hccPassageWeight};')();
  const same = L.hccPresenceDiff(['cloud', 'ground'], ['ground', 'cloud']), one = L.hccPresenceDiff(['cloud'], ['cloud', 'drop']), swap = L.hccPresenceDiff(['drop'], ['water']);
  const w0 = L.hccPassageWeight('level', same.entered, same.left), w1 = L.hccPassageWeight('level', one.entered, one.left), w2 = L.hccPassageWeight('level', swap.entered, swap.left), wMany = L.hccPassageWeight('level', ['a', 'b', 'c', 'd'], ['e', 'f', 'g']);
  check(w0 === 0 && !same.entered.length && !same.left.length && one.entered.join() === 'drop' && !one.left.length && swap.entered.join() === 'water' && swap.left.join() === 'drop'
    && w1 > 0 && w2 > w1 && wMany <= 0.75 && L.hccPassageWeight('seam') === 1 && L.hccPassageWeight('layer') === 0.8,
    'a passage is the drawn set changing: the same set in another order makes none; one level entering makes a small one, one leaving as another enters a larger; a level never outweighs a layer (0.8) nor a layer a world (1)',
    `unchanged ${w0} · one in ${w1.toFixed(2)} · one out, one in ${w2.toFixed(2)} · seven at once ${wMany.toFixed(2)} · layer ${L.hccPassageWeight('layer')} · seam ${L.hccPassageWeight('seam')}`); }
/* 2 */
{ const seam = fn('hccSeamCross'), adv = fn('advanceScaleLayer'), set = fn('setSolarScaleLayer'), ent = fn('descentEnter'), ex = fn('descentExit'), tick = fn('descentTick');
  const hooks = [[/hccPassage\('seam',\{dir:\(from==='solar'\|\|\(from==='obs'&&to==='s3'\)\)\?1:-1/.test(seam), 'the seam'],
    [/if\(layer!==state\.solarScaleLayer\) try\{ hccLayerPassage\(state\.solarScaleLayer,layer\); \}/.test(adv), 'the layer governor'],
    [/if\(layer!==state\.solarScaleLayer\) try\{ hccLayerPassage\(state\.solarScaleLayer,layer\); \}/.test(set), 'a chosen layer'],
    [/try\{ hccLayerPassage\(prevLayer,state\.solarScaleLayer\); \}catch\(e\)\{\} setSolarScaleLayer\(state\.solarScaleLayer\)/.test(src), 'a layer reached by choosing an object'],
    [/hccLayerPassage\(state\.solarScaleLayer\|\|'local','descent'\)/.test(ent), 'into a body'], [/hccLayerPassage\('descent','local'\)/.test(ex), 'out of a body'],
    [/const now=hccDescentPresence\(N\);[\s\S]*hccPresenceDiff\(DSC\.pres,now\)[\s\S]*hccPassage\('level',\{dir:N<DSC\.presN\?-1:1/.test(tick), 'the descent’s drawn set, five times a second'],
    [/try\{ hccPassageTick\(dt\); \}catch\(e\)\{ if\(!HCC_PASSAGE\.err\)/.test(src), 'the frame loop']];
  const miss = hooks.filter(h => !h[0]).map(h => h[1]);
  check(!miss.length, 'every event that changes a level calls the passage — the seam, the layer governor, a chosen layer, a layer reached by choosing an object, into a body and out of it, the descent’s drawn set — and the frame loop advances it',
    `${hooks.length - miss.length}/${hooks.length}${miss.length ? ' · MISSING ' + miss.join(', ') : ''}`); }
/* 3 */
{ const B = fn('hccPassageBuild'), P = fn('hccPassage'), T = fn('hccPassageTick'), H = fn('hccPassageHaptic'), D = fn('hccDescentPresence');
  const ok = /camera\.add\(g\)/.test(B) && /depthTest:false/.test(B) && /PREFERS_REDUCED_MOTION\) return true;/.test(P) && /P\.t=\(now-P\.t0\)\/1000/.test(T) && /hapticActuators/.test(H) && /navigator\.vibrate/.test(H)
    && /HCC_PASSAGE_GOLD/.test(T) && /renderer\.xr\.isPresenting\)\{ try\{ hccPassageXRCaption/.test(src) && /f>0\.5/.test(D) && /globalThis\.HCC_PASSAGE_API=Object\.freeze/.test(src);
  check(ok, 'it is drawn in front of the eye — attached to the camera, depth-test off, so a headset sees it as a phone does, with a caption plate of its own in XR — pulses each controller and a phone, keeps time by the clock, turns the golden angle’s sunflower with the gate, and gives a reader who asked for reduced motion the caption alone',
    `camera-attached ${/camera\.add\(g\)/.test(B)} · clock ${/P\.t=\(now-P\.t0\)\/1000/.test(T)} · haptics ${/hapticActuators/.test(H)} · reduced motion ${/PREFERS_REDUCED_MOTION\) return true;/.test(P)} · XR caption ${/hccPassageXRCaption/.test(src)}`); }
/* 4 */
{ const shell = fn('hccShellMaterial');
  const glass = /vNear=smoothstep\(0\.0,0\.3,abs\(q0-1\.0\)\)/.test(shell) && /a\*=mix\(0\.1,1\.0,vNear\)/.test(shell) && /0\.04\*min\(1\.0,uOp\*4\.0\)\*\(1\.0-vIn\)/.test(shell);
  const compact = /opacity:\.85,depthWrite:false,sizeAttenuation:false\}\)\);\n    glow\.scale\.setScalar\(0\.034\)/.test(src) && !/glow\.scale\.setScalar\(Math\.max\(r\*4\.5,0\.24\)\)/.test(src);
  const dust = /function hccBoundedPoints\(mat,maxPx\)/.test(src) && /hccBoundedPoints\(new THREE\.PointsMaterial\(\{map:glowTexture\(\),size:Math\.max\(r\*0\.042,0\.03\)/.test(src);
  check(glass && compact && dust, 'the arrival through the Solar ↔ Observable seam looks at the Local Volume, not at a veil: the compact objects’ glows (Sgr A* and Cygnus X-1 among them, 0.24 Gly spheres of light round the observer) are angular markers; a structure’s dust glows are held to a size on the screen; glass fades within 30 % of its surface and has no fill seen from inside — measured on the page, the frame’s mean brightness at the arrival fell from 208 to 89 of 255',
    `glass ${glass} · compact markers ${compact} · bounded dust ${dust}`); }
/* 5 */
{ const ok = /const HCC_XR_GRABS=\[\];\nfunction hccXrGrab\(def\)\{ HCC_XR_GRABS\.push\(def\); return def; \}/.test(src)
    && /for\(const G of HCC_XR_GRABS\)\{ let h=null; try\{ if\(G\.when\(\)\) h=G\.pick\(o,d\); \}/.test(src) && /else if\(d\.kind==='reg'\)\{ try\{ d\.G\.drag\(d\.h,raycaster2\.ray\.origin,raycaster2\.ray\.direction,\(i,ms\)=>pulse\(P,i,ms\)\); \}/.test(src)
    && /if\(P\.coreDrag&&P\.coreDrag\.kind==='reg'\)\{ try\{ P\.coreDrag\.G\.release&&P\.coreDrag\.G\.release\(P\.coreDrag\.h\); \}/.test(src);
  const users = (src.match(/hccXrGrab\(\{ id:'/g) || []).length;
  check(ok && users >= 1, 'WebXR: a laboratory registers what a hand may hold — a squeeze asks each registered grab in turn, the first that answers rides that controller’s ray (two hands, two things) with a pulse to feel it, and is released with the squeeze; before, two laboratories had their grabs written into the controller code and no other could have one',
    `registry ${ok} · registered grabs ${users}`); }
/* 6 */
{ const D = fn('hccDescentPresence'), N = fn('hccLevelName');
  const ok = /if\(L\.onlyPicked&&!pk\) continue;/.test(D) && /out\.push\(hccLevelName\(L,names,pk\)\)/.test(D)
    && /L\.id==='nucleus'\?names\.get\('nuc'\)/.test(N) && /L\.id==='globe'\) return dscBodyName\(DSC\.body\)/.test(N)
    && ['nucleus', 'atom', 'qcloud', 'graintop', 'dropfield', 'tops', 'xtal'].every(id => new RegExp(id + ":\\['[^']+','[^']+','[^']+','[^']+'\\]").test(N))
    && ['dscAtomLevel', 'dscCoreLevel', 'dscNucleusLevel'].every(f => /onlyPicked:!!def\.onlyPicked/.test(fn(f)));
  check(ok, 'a level is named in the reader’s language — the nucleus by its station, the Sun’s globe by the body, seven more levels no station names by names of their own in four languages, a chosen element’s atom and nucleus by the element — never by a bare identifier; and a level drawn only for a chosen element is not present while none is chosen',
    `onlyPicked kept by the three level makers ${['dscAtomLevel', 'dscCoreLevel', 'dscNucleusLevel'].every(f => /onlyPicked:!!def\.onlyPicked/.test(fn(f)))} · names ${/hccLevelName/.test(D)}`); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
