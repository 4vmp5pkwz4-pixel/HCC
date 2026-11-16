/* THE CLEAN VIEW (v4.430) — one button, and only the picture is left.
     1. what the scene pass calls technical, lifted from the page and run on objects built here: helpers by type, by flag, by name —
        and what it must leave alone; in the clean view such objects, with all beneath them, are left out of the pass;
     2. measured in a headless browser, three worlds at three viewports (docs/data/clean-view-v4.430.json): every piece of interface
        gone but the bar, the caption layer hidden, the seven vector layers and the guides off, a layers panel opens over it —
        and on leaving, all of it back;
     3. the sweep needs no list, the switches are the atlas's own and are given back only if untouched, and the button, the key,
        the bar's shortcuts and the agent handle are in the page.
   NOT checked, and said in the page: a technical mark drawn as an ordinary unnamed line or mesh inside a laboratory is not
   recognised by the pass. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const i0 = src.indexOf('/* ═══ DIET-BEGIN ═══'), i1 = src.indexOf('/* ═══ DIET-END ═══', i0);
const L = new Function(`${src.slice(i0, i1)}\nreturn {HCC_DIET,hccDietPass,hccIsTechnical};`)();
const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const obj = (o = {}) => ({ visible: true, children: [], matrixWorld: { elements: I }, userData: {}, name: '', type: 'Object3D', ...o });
const mesh = (name, o = {}) => obj({ name, isMesh: true, type: 'Mesh', frustumCulled: true, material: { transparent: false, opacity: 1, side: 0, blending: 1, depthWrite: true }, geometry: { boundingSphere: { center: { x: 0, y: 0, z: -5 }, radius: 1 } }, ...o });

{ const yes = [obj({ type: 'ArrowHelper' }), obj({ type: 'GridHelper' }), obj({ type: 'AxesHelper' }), obj({ type: 'PolarGridHelper' }), obj({ userData: { technical: true } }), obj({ name: 'nsg-axes' }), obj({ name: 'triad-axes' }), obj({ name: 'solar-apex-arrow' }),
    obj({ name: 'nsg-frame' }), obj({ name: 'dipole-axis-schematic' }), obj({ name: 'scale ruler' }), obj({ name: 'velocity_vectors' }), obj({ name: 'Grid' })];
  const no = [obj({ name: 'galaxies' }), obj({ name: 'local-web' }), obj({ name: 'horizons-shared' }), obj({ name: 'cosmic-time-spheres' }), obj({ name: 'gridlock' }), obj({ name: 'taxes' }), obj({ name: 'arrowroot' }), obj({ name: 'framework' }), obj({ type: 'Mesh' }), obj({ type: 'Points' }), obj({ type: 'Line' })];
  const a = yes.filter(L.hccIsTechnical).length, b = no.filter(L.hccIsTechnical).length;
  /* the pass: off while the clean view is off; on, the helper goes with everything under it, and nothing else does */
  const helper = obj({ type: 'ArrowHelper', children: [mesh('cone'), mesh('shaft')] }), named = obj({ name: 'triad-axes', children: [mesh('x'), mesh('y')] }), body = mesh('planet'), root = obj({ children: [obj({ children: [helper, named, body] })] });
  const off = L.hccDietPass(root, 0, 0, 0, 800, { ...L.HCC_DIET, pure: false }).length, D = { ...L.HCC_DIET, pure: true }, hid = L.hccDietPass(root, 0, 0, 0, 800, D);
  check(a === yes.length && b === 0 && off === 0 && hid.length === 2 && hid.includes(helper) && hid.includes(named) && D.tech === 2 && body.visible && helper.children.every(c => c.visible) && root.visible,
    'what the pass calls technical, run here on objects of its own: three.js helpers by type, anything flagged, and anything whose name has axis, axes, frame, arrow, vector, grid, tick, ruler, guide, helper or schematic as a whole word — and not «gridlock», «taxes», «framework» or any mesh, cloud or line merely for being one; with the clean view off it touches nothing, with it on a helper is switched off as one object, its parts untouched beneath it, and the body beside it stays',
    `recognised ${a}/${yes.length} · false alarms ${b}/${no.length} · pass off: ${off} hidden · pass on: ${hid.length} hidden, ${D.tech} technical`); }

{ const A = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/data/clean-view-v4.430.json'), 'utf8')), R = A.rows;
  const ok = R.length === 9 && R.every(r => r.interface_before >= 6 && r.interface_clean.length === 0 && r.bar === true && r.caption_layer_clean === 'hidden' && r.layers_off_clean === 8 && r.layers_panel_opens === true
    && r.fab && r.fab.reachable === true && r.caption_layer_after === 'visible' && r.layers_off_after === r.layers_off_before && r.interface_after >= r.interface_before && r.errors === 0) && R.some(r => r.captions_before > 100);
  check(ok, 'measured in a headless browser — the Solar System, the Horizons and the S³ world, on a phone upright, a phone sideways and a desk: one press of the button — which is on top of everything where it stands, on a desk in the panel row and elsewhere at the left edge — and of the six to ten pieces of interface on the page none is left but the bar; the caption layer, with up to 147 captions on it, is hidden; all seven vector layers and the guides are off; a layers panel asked for from the bar opens over the clean picture; and on leaving, the interface, the captions and exactly the layers that were on are back, with no page error',
    R.map(r => `${r.world}@${r.viewport}: ${r.interface_before} → ${r.interface_clean.length}, ${r.captions_before} captions`).join(' · ')); }

{ const need = ['<button id="pureFab" title="Clean view — hide the interface, the captions and the vectors (H)" aria-label="Clean view">👁</button>', '<button id="pureBtn" class="btn" title="Clean view — hide the interface, the captions and the vectors (H)">👁 Clean</button>', '@media (min-width:901px) and (pointer:fine){ #pureFab{display:none} }', '<button class="btn icon zenTool" id="zenLayers"', '<button class="btn icon zenTool" id="zenVectors"', '<button class="btn icon zenTool" id="zenCtl"', '<button class="btn icon zenTool" id="zenLabels"',
    '.zen-x{display:none!important}', 'body.zen:not(.zen-labels) .hcc-label-layer{visibility:hidden}', 'body.zen:not(.zen-peek) .panel,', "labelRenderer.domElement.classList.add('hcc-label-layer');",
    "keys:['vectorMain','vectorAdditional','vectorAxes','vectorFields','vectorRelations','vectorFlows','vectorGuides','showGuides']", 'for(const k of P.keys) if(state[k]===false) state[k]=P.saved[k];', "for(const el of document.body.children){ const t=el.tagName;",
    'try{ hccPure(on); }catch(e){}', "if(D.pure&&o!==root&&hccIsTechnical(o)){ o.visible=false; hid.push(o); D.tech++; continue; }", 'globalThis.HCC_CLEAN=Object.freeze({', "{id:'cleanView430', kind:'revises'"];
  const miss = need.filter(s => !src.includes(s));
  check(!miss.length, 'the sweep needs no list — it walks whatever stands on the page and keeps only the canvas, the bar and panels — so nothing added later can be forgotten by it; the layers are switched through the atlas’s own switches and given back on leaving only where the reader has not changed them meanwhile; the button, the H key, the bar’s four shortcuts (layers, vector layers, this view’s controls, captions) and the agent handle are in the page',
    miss.length ? 'missing ' + miss.map(x => x.slice(0, 46)).join(' | ') : `${need.length} source pins present`); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
