/* THE COOL FRAME (v4.436) — a reader felt the machine heat up with the whole universe in view, and saw a planet look blurred after.
   What was found, and what is checked here:
     1. the glass spheres of the cosmic scales (horizons, epoch shells, the sky's cosmic maps) were drawn two-sided: every pixel of
        each disc blended twice. A ray meets a sphere's two walls at the same angle to the normal, so the two layers are equal and
        their composite is ONE layer of alpha 1 − (1 − a)² — checked as algebra and as geometry, and the switch run on fake meshes;
     2. from well inside (closer than 0.6 R) a shell is a uniform veil; all such veils are folded into one full-screen layer of the
        same composite — the fold, lifted from the page, is run on fake shells and compared with sequential blending;
     3. the pick skins of the sky maps are tested by the ray and no longer drawn;
     4. frames are paced: at most 60 a second (one in two on a 120 Hz display), 30 after six seconds without input or camera
        motion, never in a headset or an automated browser — the gate, lifted, is run against simulated displays;
     5. the resolution governor keeps a resolution per scene, floors at 0.75 of a pixel (0.6 under 12 fps), recovers in three
        seconds, and ignores frames held back on purpose;
     6. the belts' 27 000 Kepler solves are skipped when the belt is under three pixels or would move under a quarter pixel;
     7. measured in a headless browser: the frame cost before and after at three scales, and the frame drawn both ways read back.
   What is NOT measured here: the temperature or frame rate of any real device — the headless renderer is software; its costs
   rank the parts, they do not predict a GPU's. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const lift = (start, end) => { const i = src.indexOf(start), j = src.indexOf(end, i); if (i < 0 || j < 0) throw new Error('missing ' + start); return src.slice(i, j); };
const rng = (() => { let s = 436; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const THREE = { FrontSide: 0, BackSide: 1, DoubleSide: 2 };

{ /* the composite and the geometry */
  let worstAlg = 0, worstGeo = 0;
  for (let k = 0; k < 2000; k++) { const a = rng(), c = rng(), bg = rng(), two = c * a + (c * a + bg * (1 - a)) * (1 - a), A = 1 - (1 - a) * (1 - a), one = c * A + bg * (1 - A); worstAlg = Math.max(worstAlg, Math.abs(two - one)); }
  for (let k = 0; k < 2000; k++) { const C = [rng() - 0.5, rng() - 0.5, rng() - 0.5], R = 0.2 + rng(), o = [3 * (rng() - 0.5), 3 * (rng() - 0.5), 3 * (rng() - 0.5)];
    let d = [rng() - 0.5, rng() - 0.5, rng() - 0.5]; const n0 = Math.hypot(...d); d = d.map(v => v / n0); const oc = o.map((v, i) => v - C[i]), b = oc.reduce((s, v, i) => s + v * d[i], 0), cc = oc.reduce((s, v) => s + v * v, 0) - R * R, disc = b * b - cc;
    if (disc <= 0) continue; const t1 = -b - Math.sqrt(disc), t2 = -b + Math.sqrt(disc), mu = t => { const p = o.map((v, i) => v + t * d[i]), nrm = p.map((v, i) => (v - C[i]) / R); return Math.abs(nrm.reduce((s, v, i) => s + v * d[i], 0)); }; worstGeo = Math.max(worstGeo, Math.abs(mu(t1) - mu(t2))); }
  const shader = src.includes('uniform float uOp, uGrid, uSingle;') && src.includes('if(uSingle>0.5) a=1.0-(1.0-a)*(1.0-a);');
  const body = lift('const HCC_SHELL_ONE={on:true};', 'function hccShellSideInstall(mesh)'), F = new Function('THREE', body + ';return {hccShellSide, HCC_SHELL_ONE};')(THREE);
  const mk = (r, grid) => ({ geometry: { parameters: { radius: 1 } }, matrixWorld: { elements: [r, 0, 0, 0, 0, r, 0, 0, 0, 0, r, 0, 0, 0, 0, 1] }, material: { side: 2, uniforms: { uSingle: { value: 0 }, uGrid: { value: grid ? 1 : 0 } } } }), cam = z => ({ matrixWorld: { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, z, 1] } });
  const out = mk(2), ins = mk(2), grd = mk(2, true), off = mk(2); F.hccShellSide(out, cam(5)); F.hccShellSide(ins, cam(1)); F.hccShellSide(grd, cam(5)); F.HCC_SHELL_ONE.on = false; F.hccShellSide(off, cam(5)); F.HCC_SHELL_ONE.on = true;
  const ok = worstAlg < 1e-15 && worstGeo < 1e-9 && shader && out.material.side === 0 && out.material.uniforms.uSingle.value === 1 && ins.material.side === 1 && ins.material.uniforms.uSingle.value === 0 && grd.material.side === 2 && off.material.side === 2;
  check(ok, 'one wall instead of two: two equal layers of alpha a composite exactly to one of 1 − (1 − a)², and a ray through a sphere meets its two walls at the same angle to the normal, so in this shader the far and near walls ARE equal layers; the switch draws front faces with the combined alpha from outside, back faces alone from inside, and keeps both when the glass carries its grid lines or the saving is switched off',
    `algebra ${worstAlg.toExponential(1)} · chord angles ${worstGeo.toExponential(1)} · outside → front, uSingle 1 · inside → back · grid → two-sided · off → two-sided`); }

{ /* the veil */
  const body = lift('const HCC_VEIL={quad:null, folded:0, frames:0};', 'function hccShellSideInstall(mesh)').replace(/function hccShellSide\(mesh,cam\)[\s\S]*$/, '');
  class Color { constructor(r = 0, g = 0, b = 0) { this.r = r; this.g = g; this.b = b; } setRGB(r, g, b) { this.r = r; this.g = g; this.b = b; return this; } }
  const T = { ...THREE, Color, PlaneGeometry: class {}, ShaderMaterial: class { constructor(o) { Object.assign(this, o); } }, Mesh: class { constructor(g, m) { this.geometry = g; this.material = m; this.visible = true; this.userData = {}; } } };
  const scene = { children: [], add(o) { this.children.push(o); } };
  const F = new Function('THREE', 'scene', 'HCC_SHELL_ONE', 'hccShellSideInstall', body + ';return {hccShellFold, HCC_VEIL};')(T, scene, { on: true }, m => { m.userData.hccShellSide = true; });
  let id = 1; const shell = (r, cx, op, col, grid) => ({ isMesh: true, visible: true, id: id++, children: [], geometry: { type: 'SphereGeometry', parameters: { radius: 1 } }, userData: { shell: true }, matrixWorld: { elements: [r, 0, 0, 0, 0, r, 0, 0, 0, 0, r, 0, cx, 0, 0, 1] },
    material: { opacity: op, uniforms: { uSingle: { value: 0 }, uGrid: { value: grid ? 1 : 0 }, uOp: { value: op }, uCol: { value: new Color(...col) } } } });
  const S = [shell(100, 0, 0.2, [1, 0.2, 0.1]), shell(50, 3, 0.3, [0.1, 0.9, 0.3]), shell(200, -5, 0.15, [0.2, 0.3, 1]), shell(2, 1.5, 0.2, [1, 1, 1]), shell(80, 0, 0.25, [0.5, 0.5, 0.5], true)];
  const root = { visible: true, children: S, isMesh: false }, hid = []; F.hccShellFold(root, 0, 0, 0, hid); const Q = F.HCC_VEIL.quad;
  const folded = S.slice(0, 3), seq = bg => { const L = folded.map(s => ({ s, z: Math.hypot(s.matrixWorld.elements[12]) })).sort((a, b) => b.z - a.z || a.s.id - b.s.id); let c = bg.slice(); for (const { s } of L) { const a = s.material.opacity * 0.02, k = s.material.uniforms.uCol.value; c = [k.r * a + c[0] * (1 - a), k.g * a + c[1] * (1 - a), k.b * a + c[2] * (1 - a)]; } return c; };
  let worst = 0; for (let t = 0; t < 200; t++) { const bg = [rng(), rng(), rng()], A = Q.material.uniforms.uA.value, C = Q.material.uniforms.uCol.value, one = [C.r * A + bg[0] * (1 - A), C.g * A + bg[1] * (1 - A), C.b * A + bg[2] * (1 - A)], two = seq(bg); for (let k = 0; k < 3; k++) worst = Math.max(worst, Math.abs(one[k] - two[k])); }
  const ok = hid.length === 3 && folded.every(s => !s.visible) && S[3].visible && S[4].visible && Q.visible && worst < 1e-14 && src.includes('try{ hccShellFold(sc,w.x,w.y,w.z,hid); }catch(e){}') && src.includes('try{ if(HCC_VEIL.quad) HCC_VEIL.quad.visible=false; }catch(e){}');
  check(ok, 'one veil instead of forty: shells the camera stands well inside (closer than 0.6 R to the centre) are folded — not drawn, their uniform veils composited farthest first into ONE full-screen layer whose blend over any background equals the sequential blend of all of them; a shell the camera is outside of, or near the wall of, or one carrying grid lines, is drawn as before',
    `${hid.length} of 5 folded (inside 0.6 R, no grid) · composite vs sequential over 200 backgrounds ≤ ${worst.toExponential(1)}`); }

{ const skin = src.includes("skin.layers.set(1);   /* v4.436: a pick target"), ray = src.includes('raycaster.layers.enable(1);');
  check(skin && ray, 'the sky maps’ pick skins are seen by the ray and not by the camera: each was a full-screen blend at 0.8 % opacity for every sky shell, now on layer 1, which the raycaster tests and the camera does not render — as the Invariant Nexus’s picks already were',
    'skin.layers.set(1) · raycaster.layers.enable(1)'); }

{ /* pacing, run against simulated displays */
  const body = lift('const HCC_PACE={on:true', 'function tick(now, frame){').replace(/for\(const ev of \['pointerdown'[^\n]*\n/, '');
  const sim = (hz, seconds, o = {}) => { const env = { document: { hidden: false }, navigator: { webdriver: !!o.webdriver }, renderer: { xr: { isPresenting: !!o.xr } }, camera: { position: { x: 0, y: 0, z: 5 }, quaternion: { x: 0, y: 0, z: 0, w: 1 } }, performance: { now: () => 0 }, idleDrift: !!o.drift };
    const F = new Function(...Object.keys(env), body + ';return {hccPaceSkip, HCC_PACE};')(...Object.values(env)); F.HCC_PACE.lastInput = 0; const dt = 1000 / hz, per = []; let drawn = 0, sec = 1;
    for (let t = dt; t <= seconds * 1000 + 1e-9; t += dt) { if (o.moveUntil && t < o.moveUntil * 1000) env.camera.position.x += 0.01; if (!F.hccPaceSkip(t)) drawn++; if (t >= sec * 1000 - 1e-9) { per.push(drawn); drawn = 0; sec++; } } return per; };
  const s60 = sim(60, 12), s120 = sim(120, 12), s144 = sim(144, 12), wd = sim(120, 3, { webdriver: true }), xr = sim(120, 3, { xr: true }), mv = sim(120, 12, { moveUntil: 12 }), dr = sim(120, 12, { moveUntil: 12, drift: true });
  const near = (x, y) => Math.abs(x - y) <= 1, ok = near(s60[2], 60) && near(s60[10], 30) && near(s120[2], 60) && near(s120[10], 30) && s144[2] <= 73 && s144[10] <= 36 && near(wd[1], 120) && near(xr[1], 120) && near(mv[10], 60) && near(dr[10], 30);
  check(ok, 'frames are paced: a 60 Hz display keeps every frame while the reader is active and half after six idle seconds; a 120 Hz display draws one frame in two (60) and one in four when idle (30); 144 Hz at most 72 and 36; a camera the reader or a tour moves keeps 60, the atlas’s own idle drift runs at 30; an automated browser and a headset are never paced',
    `60 Hz: ${s60[2]} → ${s60[10]} · 120 Hz: ${s120[2]} → ${s120[10]} · 144 Hz: ${s144[2]} → ${s144[10]} · moving ${mv[10]} · drifting ${dr[10]} · automated ${wd[1]} · headset ${xr[1]}`); }

{ /* the governor, per scene */
  const body = lift('const PERF_GOV={', 'globalThis.HCC_PERF=Object.freeze(');
  const run = (steps, o = {}) => { let ratio = 2; const st = { mode: 'solar', solarScaleLayer: 'cosmic' }, pace = { idle: false };
    const env = { document: { hidden: false }, navigator: { webdriver: false }, performance: { now: () => 0 }, requestRendererResize: () => {}, state: st, HCC_PACE: pace, renderer: { xr: { isPresenting: false }, getPixelRatio: () => ratio, setPixelRatio: v => { ratio = v; } } };
    const F = new Function(...Object.keys(env), body + ';return {perfGovTick, PERF_GOV};')(...Object.values(env)); const trace = [];
    for (const [fps, sec, layer, idle] of steps) { st.solarScaleLayer = layer; pace.idle = !!idle; for (let k = 0; k < fps * sec; k++) F.perfGovTick(1 / fps); trace.push(+ratio.toFixed(3)); } return trace; };
  const t = run([[10, 20, 'cosmic'], [60, 1, 'local'], [10, 1, 'cosmic'], [30, 20, 'cosmic', true], [60, 12, 'cosmic']]), slowish = run([[20, 30, 'cosmic']]);
  const ok = Math.abs(t[0] - 0.6) < 1e-9 && t[1] === 2 && Math.abs(t[2] - 0.6) < 1e-9 && Math.abs(t[3] - 0.6) < 1e-9 && t[4] === 2 && Math.abs(slowish[0] - 0.75) < 1e-9;
  check(ok, 'the resolution follows the scene: at 10 frames a second in the cosmic layer the buffer goes down to 0.6 of a pixel (0.75 at 20 — no longer 0.42 and 0.55); leaving for the Solar System restores full resolution at once, returning to the cosmic layer restores the 0.6 it had; frames held back by the idle pace change nothing; and at 60 frames a second full resolution is back within twelve seconds',
    `cosmic @10 → ${t[0]} · local → ${t[1]} · cosmic again → ${t[2]} · idle 30 fps → ${t[3]} · @60 → ${t[4]} · @20 → ${slowish[0]}`); }

{ /* the belts */
  const body = lift('function kepSwarmTick(P){', 'let solarBeltPoints=null');
  const mkP = n => { const el = new Float64Array(6 * n); for (let i = 0; i < n; i++) el.set([2.2 + rng(), 0.1 * rng(), 0.1, rng() * 6, rng() * 6, rng() * 6], 6 * i); return { visible: true, parent: null, userData: { kep: { el } }, matrixWorld: { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] },
    geometry: { boundingSphere: { radius: 3.5, center: { x: 0, y: 0, z: 0 } }, attributes: { position: { array: new Float32Array(3 * n), needsUpdate: false }, aTheta: { array: new Float32Array(n), needsUpdate: false } } } }; };
  const runK = (camZ, epochs) => { const st = { epochDays: 0 }, env = { state: st, camera: { position: { x: 0, y: 0, z: camZ }, fov: 55 }, renderer: { domElement: { height: 800 } } }, F = new Function(...Object.keys(env), body + ';return kepSwarmTick;')(...Object.values(env)); const P = mkP(200); let solves = 0;
    for (const e of epochs) { st.epochDays = e; P.geometry.attributes.position.needsUpdate = false; F(P); if (P.geometry.attributes.position.needsUpdate) solves++; } return { solves, P }; };
  const far = runK(1e7, [1, 2, 3, 400, 9000]), near = runK(10, [1, 2, 3, 400, 9000]), slow = runK(10, [1, 1.0001, 1.0002]);
  /* exactness when solved: the first body against a direct Kepler solution */
  const P = near.P, EL = P.userData.kep.el, a = EL[0], e = EL[1], M0 = EL[5], t = 9000; let M = (M0 + 0.01720209895 * t / (a * Math.sqrt(a))) % (2 * Math.PI), E = M; for (let k = 0; k < 30; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); const r = a * (1 - e * Math.cos(E));
  const rp = Math.hypot(P.geometry.attributes.position.array[0], P.geometry.attributes.position.array[1], P.geometry.attributes.position.array[2]);
  const ok = far.solves === 0 && near.solves === 5 && slow.solves === 1 && Math.abs(rp - r) < 1e-5 * r;
  check(ok, 'the belts are solved only when it can be seen: with the whole belt under three pixels no Kepler equation is solved; with it filling the view every new epoch is solved, and exactly (the first body’s distance agrees with a direct solution); an epoch step under a quarter pixel of motion for the fastest member is skipped, and the time of the last solve is kept so the next visible frame is exact',
    `far: ${far.solves}/5 solves · near: ${near.solves}/5 · tiny steps: ${slow.solves}/3 · r = ${rp.toFixed(6)} vs ${r.toFixed(6)} AU`); }

{ const D = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/data/cool-frame-v4.436.json'), 'utf8')), B = D.before, A = D.after, W = D.wall_check;
  const scales = ['solar', 'localGroup', 'universe'], faster = scales.every(k => A[k].fps > B[k].fps), lg = A.localGroup.fps / B.localGroup.fps;
  const tools = ['cost:o=>hccFrameCost(o)', 'wallCheck:()=>hccWallCheck()', 'pace:o=>{', 'governor:()=>({key:PERF_GOV.key'].every(s => src.includes(s));
  const ok = faster && tools && W.every(w => w.mean <= 3.5 && w.max <= 40 && w.shells >= 20) && D.cost.universe.after_ms < D.cost.universe.before_ms && D.cost.localGroup.after_ms < D.cost.localGroup.before_ms;
  check(ok, 'measured in a headless browser with a software renderer, the two builds one after the other at the same three scales: frames drawn per second rose at each — most where the camera stands inside the horizons — and the frame cost of the universe and Local Group views fell; the frame drawn both ways in one task and read back differs by a mean under 3.5 and at most 40 grey levels of 255 — the rounding of near-invisible layers in an 8-bit buffer, now done once instead of dozens of times, and, where something bright lies inside the horizons, the old sort that had blended the far wall over it: the veil now lies behind everything inside it',
    `${scales.map(k => `${k} ${B[k].fps.toFixed(2)} → ${A[k].fps.toFixed(2)} fps`).join(' · ')} · Local Group ×${lg.toFixed(2)} · cost universe ${D.cost.universe.before_ms} → ${D.cost.universe.after_ms} ms, Local Group ${D.cost.localGroup.before_ms} → ${D.cost.localGroup.after_ms} ms · wall check ${W.map(w => `N ${w.N}: mean ${w.mean}, max ${w.max}`).join('; ')}`); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
