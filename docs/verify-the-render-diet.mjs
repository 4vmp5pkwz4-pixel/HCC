/* THE RENDER DIET (v4.428) — do not draw what cannot be seen.
     1. the pass, lifted out of index.html and run on a scene graph built here: what it switches off, and what it must not;
     2. the half-pixel rule is exact;
     3. measured in a headless browser: draw calls and vertices a frame, diet off and on, in three worlds at two viewports
        (docs/data/render-diet-v4.428.json) — and off again, to show nothing was left switched off;
     4. the hook restores every object after the pass, and the layer is installed before the loop starts.
   NOT checked here, and not claimed anywhere: a frame rate. The counts are what the atlas submits; what a given GPU does with
   them was not measured on any real device. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const i0 = src.indexOf('/* ═══ DIET-BEGIN ═══'), i1 = src.indexOf('/* ═══ DIET-END ═══', i0);
const L = new Function(`${src.slice(i0, i1)}\nreturn {HCC_DIET,hccDietPass};`)();
const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const at = (x, y, z, s = 1) => [s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, x, y, z, 1];
const mesh = (name, mat, o = {}) => ({ name, isMesh: true, visible: true, children: [], frustumCulled: true, material: { transparent: false, opacity: 1, side: 0, blending: 1, depthWrite: true, ...mat },
  geometry: { boundingSphere: { center: { x: 0, y: 0, z: 0 }, radius: 1 } }, matrixWorld: { elements: at(0, 0, -10) }, ...o });
const group = (...ch) => ({ visible: true, children: ch, matrixWorld: { elements: I } });

{ const faint = mesh('faint', { transparent: true, opacity: 0.001 }), faintParent = mesh('faintParent', { transparent: true, opacity: 0.001 }, { children: [mesh('label', {})] }),
    faintShader = mesh('faintShader', { transparent: true, opacity: 0.001, isShaderMaterial: true }), dim = mesh('dim', { transparent: true, opacity: 0.01 }),
    tiny = mesh('tiny', {}, { matrixWorld: { elements: at(0, 0, -1e5) } }), tinyShader = mesh('tinyShader', { isShaderMaterial: true }, { matrixWorld: { elements: at(0, 0, -1e5) } }),
    tinyKeep = mesh('tinyKeep', {}, { matrixWorld: { elements: at(0, 0, -1e5) }, frustumCulled: false }), tinyInst = mesh('tinyInst', {}, { matrixWorld: { elements: at(0, 0, -1e5) }, isInstancedMesh: true }),
    big = mesh('big', {}), hiddenTree = { visible: false, children: [mesh('underHidden', { transparent: true, opacity: 0 })], matrixWorld: { elements: I } },
    shellAdd = mesh('shellAdd', { transparent: true, side: 2, blending: 2, depthWrite: false, opacity: 0.5 }), shellNormal = mesh('shellNormal', { transparent: true, side: 2, blending: 1, depthWrite: false, opacity: 0.5 }),
    shellDepth = mesh('shellDepth', { transparent: true, side: 2, blending: 2, depthWrite: true, opacity: 0.5 }), points = { isPoints: true, visible: true, children: [], material: { transparent: true, opacity: 0 } };
  const all = [faint, faintParent, faintShader, dim, tiny, tinyShader, tinyKeep, tinyInst, big, shellAdd, shellNormal, shellDepth, points], root = group(group(...all), hiddenTree), D = { ...L.HCC_DIET };
  const hid = L.hccDietPass(root, 0, 0, 0, 800, D), names = hid.map(o => o.name).sort().join(',');
  const ok = names === 'faint,tiny' && D.faint === 1 && D.tiny === 1 && all.filter(o => o.visible === false).length === 2 && hiddenTree.children[0].visible === true
    && shellAdd.material.forceSinglePass === true && shellNormal.material.forceSinglePass === undefined && shellDepth.material.forceSinglePass === undefined && D.single === 1;
  check(ok, 'the pass, lifted from the page and run on a graph built here: it switches off a leaf faded below 0.004 and a leaf standing under half a pixel, and nothing else — not a faded object that has children (its labels would go with it), not a shader material (it may carry its own opacity or move its vertices), not an object that asked not to be culled, not an instanced mesh, not points, not anything merely dim, and it does not walk into a subtree that is already hidden; of three two-sided shells only the additive one that writes no depth is set to a single pass',
    `switched off: ${names} · faint ${D.faint} · tiny ${D.tiny} · single-pass ${D.single}`); }

{ let bad = 0, n = 0; const f = 692.8;
  for (const [r, d, s] of [[1, 1000, 1], [1, 1385.5, 1], [1, 1385.7, 1], [1, 5000, 1], [0.01, 13, 1], [0.01, 14, 1], [1, 1385.7, 2], [3, 4200, 1]]) { n++; const m = mesh('m', {}, { matrixWorld: { elements: at(0, 0, -d, s) } }); m.geometry.boundingSphere.radius = r;
    const hid = L.hccDietPass(group(m), 0, 0, 0, f, { ...L.HCC_DIET }), want = r * s * f / d < 0.5; if ((hid.length === 1) !== want) bad++; }
  /* off-centre bounding spheres and a moved camera are taken into account */
  const m = mesh('m', {}, { matrixWorld: { elements: at(100, 0, 0) } }); m.geometry.boundingSphere.center = { x: 0, y: 0, z: -3000 }; const a = L.hccDietPass(group(m), 100, 0, 0, f, { ...L.HCC_DIET }).length, b = (m.visible = true, L.hccDietPass(group(m), 100, 0, -2990, f, { ...L.HCC_DIET }).length);
  check(bad === 0 && a === 1 && b === 0, 'the half-pixel rule is exact: a bounding sphere of radius r, scaled by s, at distance d from the camera is switched off when r·s·f/d < 0.5 with f the focal length in device pixels, and at no other time — measured from the camera’s own position to the sphere’s own centre',
    `${n} cases · wrong ${bad} · centre 3000 away: off (${a}) · the same sphere 10 away: drawn (${b})`); }

{ const A = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/data/render-diet-v4.428.json'), 'utf8')), R = A.rows;
  const ok = R.length === 6 && R.every(r => r.on.calls <= r.off.calls && r.on.kverts <= r.off.kverts && Math.abs(r.off_again.calls - r.off.calls) <= 0.05 * r.off.calls + 3 && r.errors === 0)
    && R.some(r => r.on.calls < 0.9 * r.off.calls) && R.reduce((s, r) => s + r.off.calls - r.on.calls, 0) > 50;
  check(ok, 'measured in a headless browser, counting what the atlas hands to WebGL: in the Solar System, the Horizons and the S³ world, on a desk and on a phone, the diet never raises the draw calls or the vertices of a frame and lowers them where there was something unseen to drop; switched off again, the counts return — nothing is left hidden',
    R.map(r => `${r.world}@${r.viewport}: calls ${r.off.calls} → ${r.on.calls}, kverts ${r.off.kverts} → ${r.on.kverts}`).join(' · ')); }

{ const need = ['function hccDietInstall(){ try{ const raw=renderer.render.bind(renderer), w=new THREE.Vector3();', 'if(sc!==scene||!(HCC_DIET.on||HCC_DIET.pure)||!cam||!renderer.domElement) return raw(sc,cam);',
    'try{ return raw(sc,cam); } finally{ if(hid) for(let k=0;k<hid.length;k++) hid[k].visible=true; } };', 'hccDietInstall();\nrenderer.setAnimationLoop(tick);', 'diet:v=>{ if(v!==undefined) HCC_DIET.on=!!v;',
    'G.acc+=Math.min(dt,1); G.n++; if(G.acc<1.5) return;', 'const floor=fps<15?0.42:0.55;', "{id:'renderDiet428', kind:'revises'"];
  const miss = need.filter(s => !src.includes(s));
  check(!miss.length, 'nothing else sees them gone: the pass runs inside the renderer’s own call for the main scene only and every object it switched off is switched back on in a finally clause, before any other code runs; it is installed once, before the frame loop starts, can be turned off for comparison (HCC_PERF.diet(false)), and the governor’s new rule is the one in the page',
    miss.length ? 'missing ' + miss.map(x => x.slice(0, 50)).join(' | ') : `${need.length} source pins present`); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
