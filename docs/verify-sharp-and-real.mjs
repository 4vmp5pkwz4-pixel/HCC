/* SHARP AND REAL (v4.437) — asked: speed the atlas up on old machines without touching the quality of the picture — bring the
   old sharpness back and choose the best way to optimise — and check the realism, taking the three-dimensional immersion in the
   universe and the Solar System further than before.
   What was found, and what is checked here:
     1. the blur was the atlas's own: the resolution governor held each scene at 0.75 of a pixel (0.6 under 12 frames a second),
        the post chain stepped itself down to 0.78, and the glass was taken away from a small or slow device — all of it while the
        picture stood still. The post chain is never lowered now and the glass stays (the governor itself, sharp when still and
        softer only under a moving camera, is run in verify-the-cool-frame.mjs);
     2. on an old machine the processor sets the pace, and the labels were half of a frame's script time. The label pass, lifted,
        is run on a scene of labels against the perspective projection in closed form: the labels in front of the eye shown, each
        where it must stand to a twentieth of a pixel, nearest on top — and a frame in which nothing moved writes nothing;
     3. the forced layouts of every frame (the hierarchy locator, the time bar) are measured on a timer and an observer, and the
        Buddhabrot (minutes of work at boot) is built when a reader first opens it;
     4. SATURN'S RINGS stand in its equator: their opening angle seen from the Earth, from the atlas's own ephemeris and the IAU
        pole, is 0 on 2025-03-23 — the ring-plane crossing observed that day — and 27° in October 2017;
     5. the rings' profile: each gap and ringlet at its measured radius, each ring's optical depth, the texture's encoding;
     6. the rings' light: the single-scattering laws of a ring layer on the lit and the unlit face, their limits, reciprocity, the
        phase functions of ice and dust, and Saturn's oblate shadow;
     7. the planets TURN: the IAU W(d) of each, and the frame built from it — pole on +Y, prime meridian on −X, east on +Z —
        against the definition, with the right sense of rotation;
     8. the giants are FLATTENED as measured: (a²c)^⅓ is the atlas's radius of each; the globe built from it; where a camera
        stands on it;
     9. the FACES: the Red Spot, the hexagon, Hellas, Syrtis Major where they are; the worker's source, built as the page builds
        it, runs alone and draws the same bytes as the page's own function; the face of the planet largest on the screen first;
    10. the COLOUR: the planet and ring shaders end in the screen's colour space — they were in linear light, too dark and too
        saturated, whenever the post chain was off, which is the default;
    11. levels of detail, the ambient fill, the landing on an ellipsoid, the giants' haze;
    12. found on the way: on an upright phone the floating buttons stood on the selection card's subtitle;
    13. Horizons on any device — the main thread: the declutter pass without class churn or forced layout, the writes that
        changed nothing, the cursor's glow;
    14. the crossing to the universe: shaders compiled while idle; glass that changes no pixel folded into the veil.
   What is NOT checked here: what a particular GPU draws or how fast — the headless renderer is software. */
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
/* THE PART OF three.js THESE CHECKS NEED, written out here: the pull-request gate runs with no npm install, so a verifier on it
   imports nothing. Vector3, Quaternion and Matrix4 follow three.js r160's own formulas (applyQuaternion, setFromRotationMatrix,
   compose, makePerspective); the scene objects, the sphere and the textures carry only the fields the lifted code reads. */
function miniThree() {
  let ID = 0;
  class Vector3 { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; } clone() { return new Vector3(this.x, this.y, this.z); }
    add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; } sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
    multiplyScalar(k) { this.x *= k; this.y *= k; this.z *= k; return this; } addScaledVector(v, k) { this.x += v.x * k; this.y += v.y * k; this.z += v.z * k; return this; }
    dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; } lengthSq() { return this.dot(this); } length() { return Math.sqrt(this.lengthSq()); }
    normalize() { return this.multiplyScalar(1 / (this.length() || 1)); } negate() { return this.multiplyScalar(-1); }
    crossVectors(a, b) { const ax = a.x, ay = a.y, az = a.z, bx = b.x, by = b.y, bz = b.z; this.x = ay * bz - az * by; this.y = az * bx - ax * bz; this.z = ax * by - ay * bx; return this; }
    angleTo(v) { const d = Math.sqrt(this.lengthSq() * v.lengthSq()); return d === 0 ? Math.PI / 2 : Math.acos(Math.min(1, Math.max(-1, this.dot(v) / d))); }
    distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
    applyQuaternion(q) { const vx = this.x, vy = this.y, vz = this.z, qx = q.x, qy = q.y, qz = q.z, qw = q.w, tx = 2 * (qy * vz - qz * vy), ty = 2 * (qz * vx - qx * vz), tz = 2 * (qx * vy - qy * vx);
      this.x = vx + qw * tx + qy * tz - qz * ty; this.y = vy + qw * ty + qz * tx - qx * tz; this.z = vz + qw * tz + qx * ty - qy * tx; return this; }
    applyMatrix4(m) { const x = this.x, y = this.y, z = this.z, e = m.elements, w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
      this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w; this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w; this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w; return this; }
    setFromMatrixPosition(m) { const e = m.elements; this.x = e[12]; this.y = e[13]; this.z = e[14]; return this; } toArray() { return [this.x, this.y, this.z]; } }
  class Quaternion { constructor(x = 0, y = 0, z = 0, w = 1) { this.x = x; this.y = y; this.z = z; this.w = w; }
    copy(q) { this.x = q.x; this.y = q.y; this.z = q.z; this.w = q.w; return this; } invert() { this.x = -this.x; this.y = -this.y; this.z = -this.z; return this; }
    setFromAxisAngle(a, t) { const s = Math.sin(t / 2); this.x = a.x * s; this.y = a.y * s; this.z = a.z * s; this.w = Math.cos(t / 2); return this; }
    setFromRotationMatrix(m) { const te = m.elements, m11 = te[0], m12 = te[4], m13 = te[8], m21 = te[1], m22 = te[5], m23 = te[9], m31 = te[2], m32 = te[6], m33 = te[10], tr = m11 + m22 + m33;
      if (tr > 0) { const s = 0.5 / Math.sqrt(tr + 1); this.w = 0.25 / s; this.x = (m32 - m23) * s; this.y = (m13 - m31) * s; this.z = (m21 - m12) * s; }
      else if (m11 > m22 && m11 > m33) { const s = 2 * Math.sqrt(1 + m11 - m22 - m33); this.w = (m32 - m23) / s; this.x = 0.25 * s; this.y = (m12 + m21) / s; this.z = (m13 + m31) / s; }
      else if (m22 > m33) { const s = 2 * Math.sqrt(1 + m22 - m11 - m33); this.w = (m13 - m31) / s; this.x = (m12 + m21) / s; this.y = 0.25 * s; this.z = (m23 + m32) / s; }
      else { const s = 2 * Math.sqrt(1 + m33 - m11 - m22); this.w = (m21 - m12) / s; this.x = (m13 + m31) / s; this.y = (m23 + m32) / s; this.z = 0.25 * s; } return this; } }
  class Matrix4 { constructor() { this.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; }
    copy(m) { this.elements = m.elements.slice(); return this; }
    makeBasis(x, y, z) { this.elements = [x.x, x.y, x.z, 0, y.x, y.y, y.z, 0, z.x, z.y, z.z, 0, 0, 0, 0, 1]; return this; }
    multiplyMatrices(a, b) { const ae = a.elements, be = b.elements, r = new Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let t = 0; for (let k = 0; k < 4; k++) t += ae[k * 4 + i] * be[j * 4 + k]; r[j * 4 + i] = t; } this.elements = r; return this; }
    compose(p, q, s) { const x = q.x, y = q.y, z = q.z, w = q.w, x2 = x + x, y2 = y + y, z2 = z + z, xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
      this.elements = [(1 - (yy + zz)) * s.x, (xy + wz) * s.x, (xz - wy) * s.x, 0, (xy - wz) * s.y, (1 - (xx + zz)) * s.y, (yz + wx) * s.y, 0, (xz + wy) * s.z, (yz - wx) * s.z, (1 - (xx + yy)) * s.z, 0, p.x, p.y, p.z, 1]; return this; } }
  class Object3D { constructor() { this.id = ++ID; this.type = 'Object3D'; this.name = ''; this.parent = null; this.children = []; this.visible = true; this.renderOrder = 0; this.userData = {}; this.frustumCulled = true;
      this.position = new Vector3(); this.quaternion = new Quaternion(); this.scale = new Vector3(1, 1, 1); this.matrix = new Matrix4(); this.matrixWorld = new Matrix4(); this.matrixWorldAutoUpdate = true; this.layers = { test: () => true }; }
    add(...o) { for (const c of o) { c.parent = this; this.children.push(c); } return this; } traverse(cb) { cb(this); for (const c of this.children) c.traverse(cb); }
    updateMatrixWorld() { this.matrix.compose(this.position, this.quaternion, this.scale); if (this.parent) this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix); else this.matrixWorld.copy(this.matrix); for (const c of this.children) c.updateMatrixWorld(); }
    onBeforeRender() {} onAfterRender() {} }
  class Group extends Object3D { constructor() { super(); this.type = 'Group'; this.isGroup = true; } }
  class Scene extends Object3D { constructor() { super(); this.type = 'Scene'; this.isScene = true; } }
  class Mesh extends Object3D { constructor(g, m) { super(); this.type = 'Mesh'; this.isMesh = true; this.geometry = g; this.material = m; } }
  class Points extends Object3D { constructor(g, m) { super(); this.type = 'Points'; this.isPoints = true; this.geometry = g; this.material = m; } }
  class PerspectiveCamera extends Object3D { constructor(fov, aspect, near, far) { super(); this.type = 'PerspectiveCamera'; this.fov = fov; this.aspect = aspect; this.near = near; this.far = far;
      const top = near * Math.tan(fov * Math.PI / 360), h = 2 * top, w = aspect * h, left = -0.5 * w; this.projectionMatrix = new Matrix4();
      const x = 2 * near / w, y = 2 * near / h, a = (2 * left + w) / w, b = 0, c = -(far + near) / (far - near), d = -2 * far * near / (far - near);
      this.projectionMatrix.elements = [x, 0, 0, 0, 0, y, 0, 0, a, b, c, -1, 0, 0, d, 0]; this.matrixWorldInverse = new Matrix4(); }
    updateMatrixWorld() { super.updateMatrixWorld(); const p = this.position; this.matrixWorldInverse.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -p.x, -p.y, -p.z, 1]; } }   /* an unrotated camera only */
  class BufferAttribute { constructor(array, itemSize) { this.array = array; this.itemSize = itemSize; this.count = array.length / itemSize; }
    getX(i) { return this.array[i * this.itemSize]; } getY(i) { return this.array[i * this.itemSize + 1]; } getZ(i) { return this.array[i * this.itemSize + 2]; }
    setXYZ(i, x, y, z) { const k = i * this.itemSize; this.array[k] = x; this.array[k + 1] = y; this.array[k + 2] = z; return this; } }
  class Float32BufferAttribute extends BufferAttribute { constructor(a, n) { super(new Float32Array(a), n); } }
  class BufferGeometry { constructor() { this.type = 'BufferGeometry'; this.attributes = {}; this.morphAttributes = {}; this.userData = {}; this.parameters = {}; }
    setAttribute(n, a) { this.attributes[n] = a; return this; } computeBoundingSphere() { const P = this.attributes.position; let r = 0; if (P) for (let i = 0; i < P.count; i++) r = Math.max(r, Math.hypot(P.getX(i), P.getY(i), P.getZ(i))); this.boundingSphere = { center: new Vector3(), radius: r }; } }
  class SphereGeometry extends BufferGeometry { constructor(radius = 1, ws = 32, hs = 16) { super(); this.type = 'SphereGeometry'; this.parameters = { radius, widthSegments: ws, heightSegments: hs }; const P = [], N = [];
      for (let iy = 0; iy <= hs; iy++) { const v = iy / hs; for (let ix = 0; ix <= ws; ix++) { const u = ix / ws, x = -radius * Math.cos(u * 2 * Math.PI) * Math.sin(v * Math.PI), y = radius * Math.cos(v * Math.PI), z = radius * Math.sin(u * 2 * Math.PI) * Math.sin(v * Math.PI), l = Math.hypot(x, y, z) || 1;
        P.push(x, y, z); N.push(x / l, y / l, z / l); } }
      this.setAttribute('position', new Float32BufferAttribute(P, 3)); this.setAttribute('normal', new Float32BufferAttribute(N, 3)); } }
  class PlaneGeometry extends BufferGeometry { constructor() { super(); this.type = 'PlaneGeometry'; } }
  class Material { constructor(p) { this.id = ++ID; Object.assign(this, p || {}); } }
  class ShaderMaterial extends Material { constructor(p) { super(p); this.type = 'ShaderMaterial'; this.isShaderMaterial = true; this.uniforms = (p && p.uniforms) || {}; } }
  class MeshBasicMaterial extends Material { constructor(p) { super(p); this.type = 'MeshBasicMaterial'; } }
  class PointsMaterial extends Material { constructor(p) { super(p); this.type = 'PointsMaterial'; } }
  class Color { constructor(r = 1, g = 1, b = 1) { this.r = r; this.g = g; this.b = b; } setRGB(r, g, b) { this.r = r; this.g = g; this.b = b; return this; } }
  class DataTexture { constructor(data, width, height, format) { this.image = { data, width, height }; this.format = format; this.magFilter = 1003; this.minFilter = 1003; this.generateMipmaps = false; this.needsUpdate = false; } }
  return { Vector3, Quaternion, Matrix4, Object3D, Group, Scene, Mesh, Points, PerspectiveCamera, BufferGeometry, BufferAttribute, Float32BufferAttribute, SphereGeometry, PlaneGeometry,
    ShaderMaterial, MeshBasicMaterial, PointsMaterial, Color, DataTexture, NearestFilter: 1003, LinearFilter: 1006, LinearMipmapLinearFilter: 1008, RGBAFormat: 1023, RepeatWrapping: 1000,
    SRGBColorSpace: 'srgb', FrontSide: 0, BackSide: 1, DoubleSide: 2 }; }
const THREE = miniThree();
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const lift = (start, end) => { const i = src.indexOf(start), j = src.indexOf(end, i + start.length); if (i < 0 || j < 0) throw new Error('missing ' + start); return src.slice(i, j); };
const fn = name => { const i = src.indexOf('function ' + name + '('); if (i < 0) throw new Error('missing function ' + name); let d = 0;
  for (let k = src.indexOf('{', src.indexOf(')', i)); k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(i, k + 1); } throw new Error('unclosed ' + name); };
const DEG = Math.PI / 180, rng = (() => { let s = 437; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

{ /* 1. the post chain is never lowered for a slow frame, and the glass is not taken away */
  const body = fn('premiumPerformanceTick');
  const run = (q0, frames, dt) => { const F = new Function('PREMIUM_POST_MAX', `let premiumPostQuality=${q0}, premiumPerfFast=0, hccSeamQuiet=0; const calls=[];
      const premiumVisualsEnabled=true, ATLAS_TELEMETRY={frames:500}, renderer={xr:{isPresenting:false}}, document={hidden:false}, state={bloomOn:true};
      function hccSeamTick(){} function premiumSetPostQuality(v,r){ calls.push([v,r]); premiumPostQuality=v; }
      ${body}; return {tick:premiumPerformanceTick, calls, q:()=>premiumPostQuality};`)(1.28);
    for (let k = 0; k < frames; k++) F.tick(dt); return F; };
  const slow = run(1.28, 300, 0.2), lost = run(0.9, 17, 0.2);
  const lite = new Function('localStorage', 'matchMedia', 'navigator', fn('hccLiteGuess') + fn('hccLiteAuto') + ';return {hccLiteGuess, hccLiteAuto};');
  const store = { removeItem() {} }, oldBox = { hardwareConcurrency: 2, deviceMemory: 2, userAgent: 'old' };
  const L0 = lite(store, () => ({ matches: false }), oldBox), L1 = lite(store, q => ({ matches: /reduced-transparency/.test(q) }), oldBox);
  const g0 = L0.hccLiteGuess(), g1 = L1.hccLiteGuess();
  const ok = slow.calls.length === 0 && slow.q() === 1.28 && lost.calls.length === 1 && lost.calls[0][0] === 1.28 && lost.calls[0][1] === 'quality-restored' &&
    g0[0] === false && g1[0] === true && L0.hccLiteAuto(4) === false && L0.hccLiteAuto(12) === false;
  check(ok, 'the picture keeps its quality on an old machine: sixty seconds at five frames a second never lower the post chain (it was stepped down to 0.78 of a pixel); a budget lowered by a lost context is given back after three calm seconds; a two-core, two-gigabyte device keeps the glass — only a reader who asks the system for less transparency loses it — and a slow frame rate no longer takes it away',
    `5 fps × 60 s: ${slow.calls.length} changes, quality ${slow.q()} · after a lost context: ${lost.calls.map(c => c.join(' ')).join(', ')} · old device: lite ${g0[0]} · reduced transparency: lite ${g1[0]} · slow frames: ${L0.hccLiteAuto(4)}`); }

{ /* 2. the label pass, against the perspective projection written out in closed form */
  let writes = 0; const counted = new Set(), byKey = {};
  const mkEl = () => { const el = { parentNode: null, kids: [], appendChild(c) { c.parentNode = el; el.kids.push(c); } };
    el.style = new Proxy({}, { set(t, k, v) { writes++; counted.add(el); byKey[k] = (byKey[k] || 0) + 1; t[k] = v; return true; } }); return el; };
  const W = 1200, H = 800, FOV = 55, NEAR = 0.1, FAR = 1000, CAMZ = 12;
  const r = (() => { let s = 77; return () => (s = (s * 16807) % 2147483647) / 2147483647; })(), sc = new THREE.Scene(), labs = [], groups = [];
  for (let g = 0; g < 6; g++) { const G = new THREE.Group(); G.position.set((r() - 0.5) * 6, (r() - 0.5) * 4, (r() - 0.5) * 6); sc.add(G); groups.push(G);
    for (let k = 0; k < 12; k++) { const o = new THREE.Object3D(); o.isCSS2DObject = true; o.element = mkEl(); o.center = { x: 0.5, y: 0.5 };
      o.position.set((r() - 0.5) * 8, (r() - 0.5) * 6, (r() - 0.5) * 30); if (k % 5 === 0) o.renderOrder = 1; if (k % 7 === 3) o.center = { x: 0, y: 0.5 }; G.add(o); labs.push(o); } }
  const cam = new THREE.PerspectiveCamera(FOV, W / H, NEAR, FAR); cam.position.set(0, 0, CAMZ); cam.updateMatrixWorld();
  const lr = { domElement: mkEl(), getSize: () => ({ width: W, height: H }) };
  const FR = new Function('THREE', 'labelRenderer', 'premiumDeclutterLabels', lift('const HCC_LABEL_FRAME=', '/* Label intelligence:') + ';return HCC_LABEL_FRAME;')(THREE, lr, () => {});
  /* where each label must stand: world = group + label (no rotations), eye at (0, 0, 12) looking down −z, a pinhole of 55° */
  const ref = () => { const t = Math.tan(FOV * Math.PI / 360), out = [];
    for (const o of labs) { if (!o.parent.visible) { out.push(null); continue; } const x = o.parent.position.x + o.position.x, y = o.parent.position.y + o.position.y, z = o.parent.position.z + o.position.z - CAMZ, depth = -z;
      if (!(depth >= NEAR && depth <= FAR)) { out.push(null); continue; }
      out.push({ px: (x / (depth * t * W / H)) * W / 2 + W / 2, py: H / 2 - (y / (depth * t)) * H / 2, d2: x * x + y * y + z * z, order: o.renderOrder }); } return out; };
  const frame = () => { sc.updateMatrixWorld(); FR.fresh = true; writes = 0; counted.clear(); for (const k in byKey) delete byKey[k]; lr.render(sc, cam); return writes; };
  const xy = el => { const m = /translate\(([-\d.e]+)px,([-\d.e]+)px\)/.exec(el.style.transform || ''); return m ? [+m[1], +m[2]] : null; };
  const compare = () => { const R = ref(); let shown = 0, same = true, worst = 0, anchor = true;
    labs.forEach((o, i) => { const e = o.element, s = e.style.display === '', want = !!R[i]; if (s !== want) same = false; if (!s || !want) return; shown++;
      const p = xy(e); worst = Math.max(worst, Math.abs(p[0] - R[i].px), Math.abs(p[1] - R[i].py)); if (!e.style.transform.startsWith(`translate(${-100 * o.center.x}%,${-100 * o.center.y}%)`)) anchor = false; });
    const mine = labs.map((o, i) => [i, o.element]).filter(([, e]) => e.style.display === '').sort((p, q) => +q[1].style.zIndex - +p[1].style.zIndex).map(([i]) => i).join(',');
    const theirs = R.map((x, i) => [i, x]).filter(([, x]) => x).sort((p, q) => (q[1].order - p[1].order) || (p[1].d2 - q[1].d2)).map(([i]) => i).join(',');
    return { shown, same, worst, anchor, order: mine === theirs }; };
  const w1 = frame(), c1 = compare();
  const w2 = frame();                                                     /* nothing moved */
  const mover = labs.find(o => o.element.style.display === ''); mover.position.x += 0.3; const w3 = frame(), moved = counted.size, onlyMover = counted.size <= 3 && counted.has(mover.element), c3 = compare();
  const hidden = groups[2], hiddenLabs = hidden.children.filter(o => o.element.style.display === '').length; hidden.visible = false; const w4 = frame(), hid = byKey.display || 0, shifted = byKey.transform || 0, ranks = byKey.zIndex || 0;
  const allHidden = hidden.children.every(o => o.element.style.display === 'none'), walked = FR.walked, c4 = compare();
  const ok = c1.same && c1.shown > 20 && c1.shown < labs.length && c1.worst <= 0.05 + 1e-9 && c1.anchor && c1.order && w1 >= 3 * c1.shown && w2 === 0 && w3 >= 1 && onlyMover && c3.same && c3.worst <= 0.05 + 1e-9 &&
    hid === hiddenLabs && shifted === 0 && allHidden && c4.same && c4.order && walked < 1 + groups.length + labs.length - hidden.children.length + 1;
  check(ok, 'labels at the cost of what moved: lifted and run on 72 labels in six groups, the pass shows exactly the labels in front of the eye, each where the perspective projection written out in closed form puts it to a twentieth of a pixel, on its own anchor, nearest on top; a frame in which nothing moved writes NOTHING (three.js’s own renderer rewrites every label every frame); a moved label rewrites only itself; a hidden group is not entered, its labels are hidden once and the others keep their places and their order',
    `${c1.shown}/${labs.length} shown · worst offset ${c1.worst.toFixed(3)} px · anchors ${c1.anchor} · order ${c1.order ? 'nearest on top' : 'WRONG'} · writes: first frame ${w1}, still frame ${w2}, one label moved ${w3} (${moved} element) · group hidden: ${hid} hidden of ${hiddenLabs} shown, ${shifted} moved, ${ranks} re-ranked, order ${c4.order ? 'kept' : 'WRONG'}, ${walked} objects walked`); }

{ /* 3. the forced layouts and the boot-time Buddhabrot */
  const loc = fn('hccLocatorBox'), tm = fn('hccTmMeasure'), rl = fn('renderHierarchyLocator');
  const bud = fn('hccBuddhaEnsure'), noBoot = !/requestIdleCallback\([^;]{0,80}buildBuddhabrotTexture/.test(src) && !/requestIdleCallback\([^;]{0,80}hccBuddhaEnsure/.test(src);
  const ensureCalls = (src.match(/hccBuddhaEnsure\(\)/g) || []).length;
  const ok = /250/.test(loc) && /getBoundingClientRect/.test(loc) && !/getBoundingClientRect|getComputedStyle/.test(rl) && /ResizeObserver/.test(src.slice(src.indexOf('function hccTmMeasure') - 3000, src.indexOf('function hccTmMeasure') + 3000)) &&
    /getBoundingClientRect/.test(tm) && /buildBuddhabrotTexture\(\)/.test(bud) && noBoot && ensureCalls >= 2;
  check(ok, 'no layout is forced every frame and no fractal is built unasked: the hierarchy locator reads its box every 250 ms or on a resize (it read it with getBoundingClientRect and getComputedStyle each frame), the time bar is measured by a ResizeObserver; the Buddhabrot, which a boot-time idle callback used to build for every reader, is built the first time a reader opens it',
    `locator box: timed · per-frame reads in the locator: ${/getBoundingClientRect|getComputedStyle/.test(rl) ? 'yes' : 'none'} · time bar: observed · Buddhabrot at boot: ${noBoot ? 'no' : 'YES'} · built on demand from ${ensureCalls - 1} view(s)`); }

/* the atlas's own ephemeris and frames, lifted */
const OBLIQ = 23.4392911 * DEG;
const raDecDir = new Function('THREE', 'OBLIQ', 'DEG', fn('raDecDir') + ';return raDecDir;')(THREE, OBLIQ, DEG);
const PLANET_POLES = new Function(lift('const PLANET_POLES=', 'const PLANET_POLE_Q=') + ';return PLANET_POLES;')();
const EPH = new Function(`const DEG=Math.PI/180; ${lift('const PLANETS = [', '\nconst SUN = {')}\n${fn('keplerE')}\n${fn('planetEcl')}\nreturn {PLANETS, planetEcl};`)();
const scenePos = (p, T) => { const e = EPH.planetEcl(p, T); return new THREE.Vector3(e.x, e.z, -e.y); };
const jdOf = s => Date.parse(s) / 86400000 + 2440587.5;
const SP = new Function('THREE', 'DEG', 'raDecDir', 'PLANET_POLES', lift('const HCC_PLANET_W=', '/* ── SATURN\'S RINGS, radius by radius') +
  ';return {HCC_PLANET_W, HCC_PLANET_SHAPE, hccPlanetShape, hccPlanetGeometry, hccSurfaceRadius, hccPlanetSpinQ};')(THREE, DEG, raDecDir, PLANET_POLES);

{ /* 4. Saturn's rings in Saturn's equator */
  const sat = EPH.PLANETS.find(p => p.name === 'Saturn'), earth = EPH.PLANETS.find(p => p.name === 'Earth');
  /* the ring geometry lies in its own x–y plane (normal +z); the mesh turns it by rotation.x = −π/2 inside the planet, which the
     planet's quaternion turns into the sky: the ring's normal is the planet's quaternion applied to that turned +z */
  const ringTurn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
  const B = iso => { const T = (jdOf(iso) - 2451545) / 36525, d = jdOf(iso) - 2451545, q = new THREE.Quaternion(); SP.hccPlanetSpinQ('Saturn', d, q);
    const nrm = new THREE.Vector3(0, 0, 1).applyQuaternion(ringTurn).applyQuaternion(q).normalize(), u = scenePos(earth, T).sub(scenePos(sat, T)).normalize();
    return Math.asin(u.dot(nrm)) / DEG; };
  const ringFn = fn('hccSaturnRings'), inEquator = /m\.rotation\.x=-Math\.PI\/2;/.test(ringFn) && !/26\.7/.test(ringFn.replace(/\/\*[\s\S]*?\*\//g, '')) && /mesh\.add\(ringMesh\)/.test(src);
  const b25 = B('2025-03-23T00:00:00Z'), b17 = B('2017-10-16T00:00:00Z'), b24 = B('2024-06-01T00:00:00Z'), b27 = B('2027-06-01T00:00:00Z');
  const ok = inEquator && Math.abs(b25) < 0.3 && Math.abs(b17 - 27) < 0.6 && b24 > 0 && b27 < 0;
  check(ok, 'Saturn’s rings stand in Saturn’s equator: the ring is the planet’s child, turned into its equatorial plane and nothing more (it was tilted a further 26.7°, the obliquity counted twice on a planet already turned by its IAU pole); with the atlas’s own ephemeris, the rings’ opening seen from the Earth is zero on the day the ring-plane crossing was observed, 27° at the widest opening of the cycle, north before the crossing and south after',
    `B(2025-03-23) = ${b25.toFixed(2)}° · B(2017-10-16) = ${b17.toFixed(2)}° · B(2024-06) = ${b24.toFixed(1)}° · B(2027-06) = ${b27.toFixed(1)}°`); }

const RING = new Function('THREE', fn('hccSurfHash') + lift('const HCC_RING=', 'function hccSaturnRings(){') + ';return {HCC_RING, hccRingAt, hccRingTexture};')(THREE);
{ /* 5. the rings' profile */
  const RS = 60268, at = km => RING.hccRingAt(km / RS)[0];
  const gaps = [['Colombo', 77870, 150], ['Maxwell', 87491, 270], ['Herschel', 118234, 102], ['Russell', 118614, 33], ['Jeffreys', 118950, 38], ['Laplace', 119967, 238], ['Encke', 133589, 325], ['Keeler', 136505, 42]];
  /* the Maxwell gap holds the Maxwell ringlet (87 510 km): the gap is tested beside it */
  const gapOk = gaps.map(([n, c, w]) => [n, (n === 'Maxwell' ? at(c - 90) === 0 && at(c + 90) === 0 && at(87510) > 0.5 : at(c) === 0) && at(c - w / 2 - 25) > 0 && at(c + w / 2 + 25) > 0]);
  const mean = (a, b) => { let s = 0, n = 0; for (let km = a; km <= b; km += 5) { s += at(km); n++; } return s / n; };
  const tauC = mean(75000, 91900), tauB3 = mean(104600, 109900), tauCD = mean(118100, 120900), tauA = mean(122200, 133000);
  const edges = at(91900) < 0.5 && at(92050) > 0.5 && at(117450) > 0.3 && at(117560) === 0 && at(136700) > 0 && at(136850) === 0 && at(140180) > 0.3 && at(139000) === 0 && at(117830) > 0.5;
  const T = RING.hccRingTexture(), d = T.image.data, N = RING.HCC_RING.N; let worst = 0;
  for (const tau of [0.05, 0.1, 0.35, 1, 2.4, 5]) { const code = Math.round(255 * Math.sqrt(tau / 6)), back = (code / 255) ** 2 * 6; worst = Math.max(worst, Math.abs(back - tau) / tau); }
  const iE = Math.floor((133589 / RS - RING.HCC_RING.R0) / (RING.HCC_RING.R1 - RING.HCC_RING.R0) * N);
  const ok = gapOk.every(g => g[1]) && edges && tauC > 0.04 && tauC < 0.3 && tauB3 > 4 && tauCD > 0.05 && tauCD < 0.25 && tauA > 0.4 && tauA < 0.9 && worst < 0.03 && d[4 * iE] === 0 && T.image.width === 8192 && T.generateMipmaps && T.minFilter === THREE.LinearMipmapLinearFilter;
  check(ok, 'the rings, radius by radius (60 268 km Saturn radii): every gap empty at its measured radius and ring on both sides of it, the Huygens and Maxwell ringlets inside their gaps, the B ring’s edges, the A ring’s outer edge and the F ring where Cassini measured them; mean normal optical depths — C ≈ 0.1, the B-ring core > 4, the Cassini Division ≈ 0.1, A ≈ 0.6; the profile is one mip-mapped row of 8192 samples (9 km each), so a gap finer than a pixel greys the ring instead of flickering as moiré',
    `${gapOk.map(g => g[0] + (g[1] ? '' : '✗')).join(' · ')} gaps empty · τ: C ${tauC.toFixed(2)}, B core ${tauB3.toFixed(1)}, CD ${tauCD.toFixed(2)}, A ${tauA.toFixed(2)} · √(τ/6) in 8 bits loses ≤ ${(100 * worst).toFixed(1)} % of τ · Encke texel ${d[4 * iE]}`); }

{ /* 6. the rings' light */
  const ringFn = fn('hccSaturnRings');
  const pins = ['float lambertPhase(float al){ return (sin(al)+(PI-al)*cos(al))/PI; }', 'float hgPhase(float cosTh,float g){ float gg=g*g; return (1.0-gg)/pow(max(1.0+gg-2.0*g*cosTh,1e-4),1.5); }',
    'Pf*muS/(muS+muV)*(1.0-exp(-tau*(1.0/muS+1.0/muV)))', 'Pf*muS*(abs(muS-muV)>1e-3?(exp(-tau/muS)-exp(-tau/muV))/(muS-muV):tau/(muS*muS)*exp(-tau/muS))',
    'pr.a*0.15*hgPhase(-cos(al),0.7)', 'a=1.0-exp(-tau/muV)', 'gl_FragColor=vec4(col*I*uGain/max(a,1e-4), a);'].every(p => ringFn.includes(p));
  const lit = (P, tau, s, v) => P * s / (s + v) * (1 - Math.exp(-tau * (1 / s + 1 / v)));
  const unlit = (P, tau, s, v) => P * s * (Math.abs(s - v) > 1e-3 ? (Math.exp(-tau / s) - Math.exp(-tau / v)) / (s - v) : tau / (s * s) * Math.exp(-tau / s));
  const lam = a => (Math.sin(a) + (Math.PI - a) * Math.cos(a)) / Math.PI, hg = (c, g) => (1 - g * g) / Math.pow(1 + g * g - 2 * g * c, 1.5);
  let recip = 0; for (let k = 0; k < 500; k++) { const s = 0.02 + rng(), v = 0.02 + rng(), t = 4 * rng(); recip = Math.max(recip, Math.abs(lit(1, t, s, v) / s - lit(1, t, v, s) / v)); }
  const thick = Math.abs(lit(1, 60, 0.3, 0.5) - 0.3 / 0.8), unlitThick = unlit(1, 60, 0.3, 0.5), unlitThin = unlit(1, 1e-6, 0.3, 0.5);
  const cont = Math.abs(unlit(1, 0.4, 0.3, 0.3 + 1.0005e-3) - unlit(1, 0.4, 0.3, 0.3)) / unlit(1, 0.4, 0.3, 0.3);
  let peakTau = 0, peak = 0; for (let t = 0.001; t < 3; t += 0.001) { const u = unlit(1, t, 0.3, 0.3); if (u > peak) { peak = u; peakTau = t; } }
  let hgNorm = 0; const n = 20000; for (let k = 0; k < n; k++) { const c = -1 + 2 * (k + 0.5) / n; hgNorm += hg(c, 0.7) * 2 / n / 2; }
  const dustFull = 0.15 * hg(-1, 0.7), iceFull = 1.4, dustBack = 0.15 * hg(Math.cos(10 * DEG), 0.7), iceBack = lam(170 * DEG);
  /* Saturn's oblate shadow, the shader's test in JS */
  const shade = (P, S, a, c) => { const Pp = [P[0] / a, P[1] / c, P[2] / a], Sd = [S[0] / a, S[1] / c, S[2] / a], B = Pp[0] * Sd[0] + Pp[1] * Sd[1] + Pp[2] * Sd[2], SS = Sd[0] ** 2 + Sd[1] ** 2 + Sd[2] ** 2, dmin = Math.sqrt(Math.max(Pp[0] ** 2 + Pp[1] ** 2 + Pp[2] ** 2 - B * B / SS, 0)); return B < 0 && dmin < 1; };
  const a = 60268 / 58232, c = 54364 / 58232, el = 20 * DEG, S = [Math.cos(el), Math.sin(el), 0];
  const behind = shade([-1.6, 0, 0], S, a, c), sunward = shade([1.6, 0, 0], S, a, c), aside = shade([-1.6, 0, 1.2], S, a, c);
  /* a sunbeam that clears the flattened pole but would hit a sphere of the equatorial radius */
  let flatOnly = false; for (let x = -1.2; x > -6 && !flatOnly; x -= 0.01) { const P = [x, 0, 0]; if (!shade(P, S, a, c) && shade(P, S, a, a)) flatOnly = true; }
  const ok = pins && recip < 1e-12 && thick < 1e-12 && unlitThick < 1e-20 && unlitThin < 1e-5 && cont < 2e-3 && Math.abs(peakTau - 0.3) < 0.002 && Math.abs(peak - 1 / Math.E) < 1e-3 &&
    Math.abs(hgNorm - 1) < 1e-3 && lam(0) === 1 && Math.abs(lam(Math.PI / 2) - 1 / Math.PI) < 1e-12 && Math.abs(lam(Math.PI)) < 1e-12 && dustFull / iceFull < 0.02 && dustBack / iceBack > 1000 &&
    behind && !sunward && !aside && flatOnly;
  check(ok, 'the rings’ light is the light of a ring layer: on the lit face μ₀/(μ₀+μ)(1 − e^(−τ(1/μ₀+1/μ))) — reciprocal under exchange of Sun and eye, Lommel–Seeliger when thick; on the unlit face the diffuse transmission μ₀(e^(−τ/μ₀) − e^(−τ/μ))/(μ₀ − μ), zero when thick or empty, brightest at τ = μ (1/e), continuous where μ₀ = μ; ice grains scatter back as a Lambert sphere, dust forward (Henyey–Greenstein, normalised): at full phase the dust gives a percent of the ice’s light, against the Sun thousands of times more — which is why the dusty rings light up in back-lit pictures; Saturn’s shadow is cast by the OBLATE globe',
    `reciprocity ${recip.toExponential(1)} · thick lit ${thick.toExponential(1)} · unlit: thick ${unlitThick.toExponential(1)}, empty ${unlitThin.toExponential(1)}, peak ${peak.toFixed(4)} at τ = ${peakTau.toFixed(3)}, seam ${cont.toExponential(1)} · HG norm ${hgNorm.toFixed(4)} · dust/ice ${(dustFull / iceFull).toFixed(3)} at full phase, ${(dustBack / iceBack).toFixed(0)} at 170° · shadow: behind ${behind}, sunward ${sunward}, aside ${aside}, a beam the flattened pole lets through ${flatOnly}`); }

{ /* 7. the planets turn */
  const W = SP.HCC_PLANET_W, iau = { Mercury: [329.5988, 6.1385108], Venus: [160.20, -1.4813688], Mars: [176.630, 350.89198226], Jupiter: [284.95, 870.5360000], Saturn: [38.90, 810.7939024], Uranus: [203.81, -501.1600928], Neptune: [249.978, 541.1397757] };
  const consts = Object.keys(iau).every(k => W[k] && W[k][0] === iau[k][0] && W[k][1] === iau[k][1]) && !W.Earth;
  let worstPole = 0, worstW = 0, worstEast = 0;
  for (const name of Object.keys(iau)) for (const d of [-36525.3, -1000.7, 0, 0.37, 9876.5, 365250.25]) {
    const q = new THREE.Quaternion(); SP.hccPlanetSpinQ(name, d, q); const [ra, dec] = PLANET_POLES[name], p = raDecDir(ra / 15, dec).normalize(), Q = raDecDir((ra + 90) / 15, 0).normalize(), E = new THREE.Vector3().crossVectors(p, Q);
    const y = new THREE.Vector3(0, 1, 0).applyQuaternion(q), m = new THREE.Vector3(-1, 0, 0).applyQuaternion(q), z = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
    worstPole = Math.max(worstPole, y.angleTo(p)); const Wm = Math.atan2(m.dot(E), m.dot(Q)) / DEG, Wd = (((iau[name][0] + iau[name][1] * d) % 360) + 360) % 360;
    worstW = Math.max(worstW, Math.abs(((Wm - Wd + 540) % 360) - 180)); worstEast = Math.max(worstEast, z.angleTo(new THREE.Vector3().crossVectors(p, m))); }
  /* the sense: the sub-solar east longitude of a prograde planet falls as the hours pass (the Sun moves west), of Venus rises */
  const subSolar = (name, d) => { const q = new THREE.Quaternion(); SP.hccPlanetSpinQ(name, d, q); const s = new THREE.Vector3(1, 0.1, 0.3).normalize().applyQuaternion(q.invert()); return Math.atan2(s.z, -s.x) / DEG; };
  const dJ = ((subSolar('Jupiter', 1 / 24) - subSolar('Jupiter', 0) + 540) % 360) - 180, dV = ((subSolar('Venus', 1) - subSolar('Venus', 0) + 540) % 360) - 180;
  const wired = /if\(!hccPlanetSpinQ\(o\.p\.name,eDaysB,o\.mesh\.quaternion\)\) o\.mesh\.quaternion\.copy\(PLANET_POLE_Q\[o\.p\.name\]\);/.test(src);
  const ok = consts && worstPole < 1e-9 && worstW < 1e-7 && worstEast < 1e-9 && Math.abs(dJ + 870.536 / 24) < 0.01 && Math.abs(dV - 1.4813688) < 0.001 && wired;
  check(ok, 'the planets turn: each by the IAU prime meridian W = W0 + Ẇd on the atlas clock (Jupiter’s System III, Venus backwards, Mars with the 2009 constants of the 2009 pole it stands on); the frame built from it has the pole on +Y, the faces’ longitude 0 on −X at exactly W east of the node of the equator on the ICRF equator, and east on +Z — over ±1000 years; an hour on Jupiter moves the sub-solar longitude 36.27° west, a day on Venus 1.48° east',
    `IAU constants ${consts ? 'exact' : 'WRONG'} · pole ${worstPole.toExponential(1)} rad · W ${worstW.toExponential(1)}° · east ${worstEast.toExponential(1)} rad · Jupiter Δλ☉(1 h) ${dJ.toFixed(3)}° · Venus Δλ☉(1 d) +${dV.toFixed(4)}° · wired into the frame loop: ${wired}`); }

{ /* 8. the giants are flattened */
  const S = SP.HCC_PLANET_SHAPE, radii = Object.fromEntries(EPH.PLANETS.map(p => [p.name, p.r]));
  const vol = Object.entries(S).map(([n, [a, c]]) => [n, Math.cbrt(a * a * c) / radii[n] - 1]), worstVol = Math.max(...vol.map(v => Math.abs(v[1])));
  const fS = (S.Saturn[0] - S.Saturn[1]) / S.Saturn[0], fJ = (S.Jupiter[0] - S.Jupiter[1]) / S.Jupiter[0];
  const sat = EPH.PLANETS.find(p => p.name === 'Saturn'), g = SP.hccPlanetGeometry(sat, 96, 64), P = g.attributes.position, N = g.attributes.normal, [a, c] = SP.hccPlanetShape(sat);
  let maxY = 0, maxR = 0, worstN = 0; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); maxY = Math.max(maxY, Math.abs(y)); maxR = Math.max(maxR, Math.hypot(x, z));
    const gr = new THREE.Vector3(x / (a * a), y / (c * c), z / (a * a)).normalize(); if (gr.lengthSq() > 0) worstN = Math.max(worstN, gr.angleTo(new THREE.Vector3(N.getX(i), N.getY(i), N.getZ(i)))); }
  const mesh = new THREE.Mesh(g); mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.4);
  const eq = SP.hccSurfaceRadius(mesh, new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.quaternion)), pole = SP.hccSurfaceRadius(mesh, new THREE.Vector3(0, 1, 0).applyQuaternion(mesh.quaternion));
  const landing = /multiplyScalar\(vR\*1\.003\*hccSurfaceRadius\(B\.mesh,L\.dir\)\)/.test(src), atm = /atm\.scale\.set\(ae,ap,ae\)/.test(src);
  const ok = worstVol < 5e-4 && Math.abs(fS - 0.0980) < 5e-4 && Math.abs(fJ - 0.0649) < 5e-4 && Math.abs(maxY - c) < 1e-6 && Math.abs(maxR - a) < 1e-6 && worstN < 1e-6 && Math.abs(eq - a) < 1e-9 && Math.abs(pole - c) < 1e-9 && landing && atm;
  check(ok, 'the giants are as flat as measured: the equatorial and polar radii (IAU) give back the atlas’s mean radius of each, (a²c)^⅓; Saturn is flattened by 9.8 %, Jupiter by 6.5 %; the globe is built on that ellipsoid with its true normals; a camera landing on it stands on the ellipsoid (at the mean radius it stood 3.5 % inside Saturn’s equator), and the air shell is as flat as the globe',
    `(a²c)^⅓ vs r: ${vol.map(([n, v]) => n + ' ' + (v * 100).toFixed(3) + ' %').join(', ')} · f: Saturn ${fS.toFixed(4)}, Jupiter ${fJ.toFixed(4)} · globe: polar ${maxY.toFixed(5)}, equatorial ${maxR.toFixed(5)}, normals ${worstN.toExponential(1)} rad · ground: equator ${eq.toFixed(5)}, pole ${pole.toFixed(5)} mean radii`); }

/* the faces, lifted */
const FACE_SRC = ['hccSurfHash', 'hccSurfNoise', 'hccSurfFbm', 'hccSurfBand', 'hccSurfPixel', 'hccSurfFill'].map(fn).join('\n');
const FACE = new Function('const DEG=Math.PI/180;' + lift('const HCC_PLANET_BANDS={', 'function hccSurfBand(') + FACE_SRC + ';return {HCC_PLANET_BANDS, hccSurfPixel, hccSurfFill};')();
{ /* 9. the faces */
  const Wt = 720, Ht = 360, face = (nm, q = 1) => { const d = new Uint8ClampedArray(Wt * Ht * 4); FACE.hccSurfFill(nm, Wt, Ht, d, 0, Ht, q); return d; };
  const px = (d, lat, lon) => { const y = Math.min(Ht - 1, Math.floor((lat + 90) / 180 * Ht)), x = Math.floor(((lon % 360) + 360) % 360 / 360 * Wt), o = 4 * (y * Wt + x); return [d[o], d[o + 1], d[o + 2]]; };
  const J = face('Jupiter'); let best = null;
  for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) { const o = 4 * (y * Wt + x), red = J[o] - J[o + 2]; if (!best || red > best.red) best = { red, lat: -90 + 180 * (y + 0.5) / Ht, lon: 360 * (x + 0.5) / Wt }; }
  const S = face('Saturn'), ring = lat => { let s = 0; for (let lon = 0; lon < 360; lon += 0.5) { const p = px(S, lat, lon); s += p[0] + p[1] + p[2]; } return s / 720; };
  const hexDark = ring(77.8) < 0.97 * Math.min(ring(74), ring(82)) || (() => { let min = 1e9; for (let l = 76; l <= 80; l += 0.25) min = Math.min(min, ring(l)); return min < 0.97 * Math.min(ring(72), ring(85)); })();
  const M = face('Mars'), lum = p => p[0] + p[1] + p[2], hellas = lum(px(M, -42, 70)), around = (lum(px(M, -42, 40)) + lum(px(M, -42, 100))) / 2, syrtis = lum(px(M, 8, 70)), arabia = lum(px(M, 25, 15));
  const V = face('Venus'); let vmin = 255, vmax = 0; for (let i = 0; i < Wt * Ht; i++) { vmin = Math.min(vmin, V[4 * i]); vmax = Math.max(vmax, V[4 * i]); }
  /* the flattened globe: a row's parametric latitude is looked up at its planetographic latitude */
  const q = 54364 / 60268, beta = 30 * DEG, latg = Math.atan2(Math.sin(beta), Math.cos(beta) * q) / DEG;
  const ok = Math.abs(best.lat + 22.4) < 1.5 && Math.abs(best.lon - 60) < 4 && hexDark && hellas > 1.08 * around && syrtis < 0.85 * arabia && vmax - vmin < 30 && Math.abs(latg - Math.atan(Math.tan(beta) / q) / DEG) < 1e-12 && latg > 32.5 && latg < 32.7 &&
    /lat=Math\.atan2\(sb,cb\*q\)\/R/.test(fn('hccSurfFill'));
  check(ok, 'the faces are where the features are: the reddest point of Jupiter is the Great Red Spot at −22.4° planetographic; Saturn darkens on its north-polar hexagon at 78°; Hellas is bright and Syrtis Major dark at their longitudes on Mars; Venus is a cloud deck with almost no contrast; on a flattened globe each row is looked up at its planetographic latitude (30° of the parametric latitude is 32.6° on Saturn)',
    `Red Spot at ${best.lat.toFixed(1)}°, ${best.lon.toFixed(1)}°E · hexagon darker: ${hexDark} · Hellas ${(hellas / around).toFixed(2)}× its surroundings · Syrtis Major ${(syrtis / arabia).toFixed(2)}× Arabia · Venus range ${vmax - vmin}/255 · β 30° → φ ${latg.toFixed(3)}°`); }

{ /* 9b. the worker draws the same bytes, and the planet largest on the screen first */
  let captured = null; const S = { worker: null, noWorker: false, ready: [], busy: null };
  const env = { HCC_SURF: S, HCC_PLANET_BANDS: FACE.HCC_PLANET_BANDS, URL: { createObjectURL: b => b }, Blob: class { constructor(parts) { this.text = parts.join(''); } }, Worker: class { constructor(b) { captured = b.text; } } };
  const mk = new Function(...Object.keys(env), FACE_SRC + fn('hccSurfWorker') + ';return hccSurfWorker;')(...Object.values(env)); mk();
  let reply = null; const ctx = { Math, Uint8ClampedArray, postMessage: m => { reply = m; } }; vm.createContext(ctx); vm.runInContext(captured, ctx);
  const msg = { name: 'Saturn', W: 128, H: 64, q: 54364 / 60268, lvl: 1 }; ctx.onmessage({ data: msg });
  const mine = new Uint8ClampedArray(128 * 64 * 4); FACE.hccSurfFill('Saturn', 128, 64, mine, 0, 64, msg.q);
  let diff = 0; for (let i = 0; i < mine.length; i++) if (mine[i] !== reply.d[i]) diff++;
  const pick = new Function('HCC_SURF', fn('hccSurfNext') + ';return hccSurfNext;');
  const Q = { want: new Set(['Jupiter', 'Mars', 'Saturn']), level: new Map(), px: new Map([['Jupiter', 30], ['Mars', 240], ['Saturn', 8]]), LEVELS: [[512, 256], [2048, 1024]], LEVEL_PX: 60 }, next = pick(Q), order = [];
  for (let k = 0; k < 6; k++) { const b = next(2); if (!b) break; order.push(b.nm + (b.L + 1)); Q.level.set(b.nm, b.L + 1); }
  const ok = captured && /onmessage=/.test(captured) && reply && reply.lvl === 1 && reply.W === 128 && diff === 0 && order.join(' ') === 'Mars1 Mars2 Jupiter1 Saturn1';
  check(ok, 'the faces are drawn off the main thread: the worker’s source, built exactly as the page builds it from its own functions, runs alone in an empty context and returns the same bytes as the page’s function; the planet largest on the screen gets its face first and then its sharp one, the others their small faces, and a planet under 60 pixels never a 2048 × 1024 one',
    `worker source ${captured ? captured.length : 0} chars · ${diff} of ${mine.length} bytes differ · order: ${order.join(' → ')}`); }

{ /* 10. the colour */
  const planetFrag = fn('hccPlanetMaterial'), ringFrag = fn('hccSaturnRings'), tail = /gl_FragColor=[^;]+;\s*(\/\*[^*]*\*\/\s*)?#include <tonemapping_fragment>\s*#include <colorspace_fragment>/;
  const defaultOff = /bloomOn:hccBloomRemembered\(\)/.test(src) && /return localStorage\.getItem\(HCC_BLOOM_KEY\)==='1'/.test(fn('hccBloomRemembered'));
  const ok = tail.test(planetFrag) && tail.test(ringFrag) && defaultOff && /colorSpace=THREE\.SRGBColorSpace/.test(fn('hccSurfTexture'));
  check(ok, 'the colour: both shaders end in the screen’s tone curve and colour space — without them the faces were written in linear light whenever the post chain is off, which it is by default (bloom is opt-in), and a zone of sRGB 232 came out as 165, a belt of 166 as 82, too dark and too saturated; the faces are sRGB textures',
    `planet shader ${tail.test(planetFrag) ? 'ends in sRGB' : 'LINEAR'} · ring shader ${tail.test(ringFrag) ? 'ends in sRGB' : 'LINEAR'} · bloom off by default ${defaultOff}`); }

{ /* 11. detail where it is seen, the fill, the haze */
  const lod = /const HCC_PLANET_LOD=Object\.freeze\(\{facets:\[\[20,14\],\[48,32\],\[96,64\]\], px:\[14,90\]\}\);/.test(src) && /g=LOD\[px<P\[0\]\?0:px<P\[1\]\?1:2\]; if\(mesh\.geometry!==g\) mesh\.geometry=g;/.test(src);
  const tri = (w, h) => 2 * w * (h - 1), overviewNow = 7 * tri(20, 14), allFine = 7 * tri(96, 64), before = 7 * tri(36, 24);
  const amb = /solarGroup\.add\(new THREE\.AmbientLight\(0x3c4048, \.2\)\);/.test(src) && /solarGroup\.add\(new THREE\.PointLight\(0xfff4e0, 2\.2, 0, 0\)\);/.test(src);
  const fill = (0x3c + 0x40 + 0x48) / 3 / 255 * 0.2 / 2.2, oldFill = (0x40 + 0x4a + 0x60) / 3 / 255 * 0.55 / 2.2;
  const haze = /Jupiter:\{T:165, mu:2\.22,  g:24\.79, tint:\[1\.00,0\.90,0\.78\], mie:0\.45, haze:0\.85\}/.test(src) && /Saturn: \{T:134, mu:2\.07,  g:10\.44, tint:\[1\.00,0\.92,0\.76\], mie:0\.45, haze:0\.85\}/.test(src);
  const ok = lod && amb && fill < 0.025 && haze;
  check(ok, 'detail where it is seen: each globe has three levels (20 × 14, 48 × 32, 96 × 64 facets) and wears the one its size on the screen needs — the overview of the planets draws fewer triangles than before the faces, the close-up the finest; the solar fill light is a night side’s floor of about 2 % of the day, grey (it lit every moon’s night side at a blue 7.6 %); the giants’ limbs are their haze, not a blue Rayleigh rim',
    `triangles for seven planets: overview ${overviewNow} (were ${before}), all fine ${allFine} · fill ${(100 * fill).toFixed(1)} % of the Sun (was ${(100 * oldFill).toFixed(1)} %) · haze 0.85 for both giants: ${haze}`); }

{ /* 12. found on the way: on an upright phone the floating buttons stood on the selection card */
  const body = fn('labBarPlace');
  const run = (layout, cardShown) => { const cls = new Set(); const env = {
      document: { documentElement: { classList: { contains: c => c === layout } }, body: { classList: { toggle: (c, on) => { if (on) cls.add(c); else cls.delete(c); }, remove: c => cls.delete(c), contains: c => cls.has(c) } },
        getElementById: id => id === 'selCard' ? { id } : null },
      getComputedStyle: () => ({ display: cardShown ? 'block' : 'none' }) };
    new Function(...Object.keys(env), body + ';return labBarPlace;')(...Object.values(env))({ style: {} }); return cls.has('selcard-up'); };
  const portUp = run('port', true), portDown = run('port', false), landUp = run('land', true);
  const rule = /body\.selcard-up \.fab\{display:none!important\}/.test(src);
  check(portUp && !portDown && !landUp && rule, 'found on the way, on an upright phone: the rule that steps the floating buttons (☰, ▶) aside while the selection card is up was switched on only past the cockpit’s early return, so they stood on the card and hid the start of its subtitle (“Gas giant · 9.5367 AU”) — in v4.436 as well; it is now set in the upright cockpit, and a phone on its side, where the card stands clear of them, keeps them',
    `upright, card up → buttons ${portUp ? 'aside' : 'OVER THE CARD'} · card closed → ${portDown ? 'aside' : 'back'} · on its side → ${landUp ? 'aside' : 'kept'} · rule present ${rule}`); }

{ /* 13. Horizons on any device — the main thread: the declutter pass, the writes that changed nothing, the cursor's glow */
  const body = fn('premiumLabelPriority') + fn('premiumDeclutterLabels');
  let classWrites = 0, layoutReads = 0;
  const mkEl = (txt, cls, x, y, w, h) => { const set = new Set(cls.split(' ')); const el = { textContent: txt, style: { display: '' },
      classList: { contains: c => set.has(c), add: c => { if (!set.has(c)) { set.add(c); classWrites++; } }, remove: (...cs) => { for (const c of cs) if (set.has(c)) { set.delete(c); classWrites++; } } },
      getBoundingClientRect() { layoutReads++; return { left: x, top: y, right: x + w, bottom: y + h, width: w, height: h }; } };
    Object.defineProperty(el, 'className', { get: () => [...set].join(' ') }); el.__hccLbl = { x, y, cx: 0, cy: 0, w, h, ox: 0, oy: 0 }; return el; };
  const els = []; for (let i = 0; i < 60; i++) els.push(mkEl('label ' + i, i % 7 === 0 ? 'label major' : 'label', 40 + (i % 10) * 70, 40 + Math.floor(i / 10) * 18, 90, 14));
  const env = { labelRenderer: { domElement: { style: {}, querySelectorAll: () => [] } }, premiumVisualsEnabled: true, MOBILE_GPU: false, HCC_LABEL_FRAME: { shownEls: els }, innerWidth: 1440, innerHeight: 900, performance: { now: () => 1e6 } };
  const D = new Function(...Object.keys(env), 'let premiumDeclutterLast=0, premiumDeclutterDirty=true;' + body + ';return premiumDeclutterLabels;')(...Object.values(env));
  classWrites = 0; D(true); const first = classWrites, hidden = els.filter(e => e.classList.contains('declutter-hidden')).length;
  classWrites = 0; D(true); const second = classWrites;
  els[3].__hccLbl.x += 400; classWrites = 0; D(true); const moved = classWrites;
  /* the four write helpers, on an element that counts its writes */
  const H = new Function(fn('hccTxt') + fn('hccAttr') + fn('hccTitle') + fn('hccData') + ';return {hccTxt,hccAttr,hccTitle,hccData};')();
  let w = 0; const attrs = {}; const el = { _t: 'a', _ti: 'b', dataset: new Proxy({ k: 'v' }, { set(o, k, v) { w++; o[k] = v; return true; } }), getAttribute: n => attrs[n] ?? null, setAttribute: (n, v) => { w++; attrs[n] = v; } };
  Object.defineProperty(el, 'textContent', { get() { return this._t; }, set(v) { w++; this._t = v; } }); Object.defineProperty(el, 'title', { get() { return this._ti; }, set(v) { w++; this._ti = v; } });
  H.hccAttr(el, 'aria-label', 'x'); w = 0; H.hccTxt(el, 'a'); H.hccTitle(el, 'b'); H.hccData(el, 'k', 'v'); H.hccAttr(el, 'aria-label', 'x'); const same = w; H.hccTxt(el, 'c'); const changed = w;
  const tm = fn('hccTimeMachineTick'), cr = fn('updateContextRail'), sc = fn('hccScaleTick');
  const pins = !/\.textContent=|\.title=|setAttribute\(/.test(tm.replace(/hcc(Txt|Title|Attr|Data)\([^;]*;/g, '').replace(/b\.onclick[^\n]*/g, '').replace(/lb\.onclick[^\n]*/g, '').replace(/if\(!lb\.onclick\)[^\n]*/g, '')) &&
    /hccData\(document\.body,'mode',state\.mode\)/.test(cr) && !/\.offsetParent/.test(sc.split('\n')[0]) && !/setProperty\('--lux-x'/.test(src) && /#luxGlow\{/.test(src) && /glow\.style\.transform='translate3d\('/.test(src);
  const ok = first === hidden && hidden > 0 && second === 0 && moved <= 4 && layoutReads === 0 && same === 0 && changed === 1 && pins;
  check(ok, 'Horizons on any device, the main thread (measured there before: 35 ms of script, 15–17 ms of style recalculation and a forced layout every frame): the declutter pass, lifted and run twice on the same 60 labels, writes the hidden class once and then NOTHING — it used to take it off every hidden label and put it back, restyling ~200 labels a pass — and never asks the page for a box (sizes come from a ResizeObserver); the time machine, the context rail, the clocks, the φ-scale and the tabs write a text, a title or an attribute only when it changed (each rewrite also woke the text fitter, which re-measured every button on the page ~4 times a second); the cursor’s glow is a layer moved by a transform — it was two custom properties on the document root, restyling every element at every pointer move, in premium mode where it is not even seen',
    `declutter: ${first} class writes for ${hidden} hidden, then ${second}; a moved label → ${moved}; page boxes read ${layoutReads} · helpers: unchanged ${same} writes, changed ${changed} · per-frame writers compare first: ${pins}`); }

{ /* 14. the crossing to the universe — shaders compiled while idle; and glass that changes no pixel folded into the veil */
  const body = lift('const HCC_PRECOMPILE=', 'const HCC_MASKED=new Map();');
  let got = null; const renderer = { info: { programs: [] }, compileAsync: (proxy, cam, target) => { got = { proxy, cam, target }; return Promise.resolve(); } };
  const scene = new THREE.Scene(), mA = new THREE.MeshBasicMaterial(), mB = new THREE.PointsMaterial(), g1 = new THREE.SphereGeometry(1, 8, 6), g2 = new THREE.SphereGeometry(2, 8, 6);
  const grp = new THREE.Group(); grp.material = mA; scene.add(grp);                         /* a handle with a material and no geometry */
  const a1 = new THREE.Mesh(g1, mA), a2 = new THREE.Mesh(g2, mA), p1 = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3)), mB); a2.visible = false; grp.add(a1, a2); scene.add(p1);
  const P = new Function('renderer', 'scene', 'camera', 'webglContextLost', 'requestIdleCallback', body + ';return {hccPrecompile,HCC_PRECOMPILE};')(renderer, scene, new THREE.PerspectiveCamera(), false, undefined);
  P.hccPrecompile('test'); const seen = []; got.proxy.traverse(o => seen.push(o)); let lights = 0; got.proxy.traverseVisible(() => lights++);
  const hooks = /if\(mode!==state\.mode\) try\{ hccPrecompileSoon\('world:'\+mode\); \}catch\(e\)\{\}/.test(src) && /hccPrecompileSoon\('scale:'\+layer,300\)/.test(src) && /setTimeout\(\(\)=>hccPrecompileSoon\('boot',0\),3000\)/.test(src) && /scale:l=>\{ if\(!\['local','galactic','andromeda','cosmic'\]\.includes\(l\)\) return false;/.test(src);
  /* the fold: shells at many distances, against the shader's alpha taken over a thousand rays from the eye */
  const F = new Function('THREE', 'scene', lift('const HCC_SHELL_ONE={on:true};', 'function hccShellMesh(') + ';return {hccShellFold, HCC_VEIL};')(THREE, new THREE.Scene());
  const shaderA = (op, q) => { let best = 0; const t = Math.min(1, Math.abs(q - 1) / 0.3), near = 0.1 + 0.9 * t * t * (3 - 2 * t);
    for (let k = 0; k <= 1000; k++) { const th = Math.PI * k / 1000, s = q * Math.sin(th), mu = Math.sqrt(Math.max(0, 1 - s * s)); best = Math.max(best, op * (0.02 + 0.98 * Math.pow(1 - mu, 5)) * near); } return best; };
  let agree = 0, total = 0, foldedFar = 0; const rows = [];
  for (const op of [0.05, 0.1, 0.13, 0.3]) for (const q of [0.3, 0.59, 0.62, 0.7, 0.8, 0.9, 0.95, 0.985, 1.2]) {
    const root = new THREE.Group(), m = new THREE.ShaderMaterial({ uniforms: { uOp: { value: op }, uGrid: { value: 0 }, uSingle: { value: 0 }, uCol: { value: new THREE.Color(1, 1, 1) } } });
    const sh = new THREE.Mesh(new THREE.SphereGeometry(10, 8, 6), m); root.add(sh); root.updateMatrixWorld(true); const hid = [];
    F.hccShellFold(root, 10 * q, 0, 0, hid); const folded = hid.includes(sh), expect = q < 1 && (q < 0.6 || shaderA(op, q) < 1 / 255);
    total++; if (folded === expect) agree++; if (folded && q >= 0.6) foldedFar++; rows.push(`${op}/${q}:${folded ? 'F' : '-'}`); }
  const ok = seen.length === 2 && seen.includes(a1) && seen.includes(p1) && !seen.includes(grp) && got.target === scene && lights === 0 && hooks && agree === total && foldedFar > 0;
  check(ok, 'the crossing to the universe: its longest frame was the first that drew the next scale — three compiles each new material’s program then and waits for the driver; every material of the scene is now compiled while the page is idle (after boot, after a change of world, as a scale is crossed), through a view of the scene that offers only what can be drawn (a fading handle carries a .material and no geometry, and three’s own traversal threw on it) and one object per material, kind and attributes, with the lights taken once from the scene; and glass the eye is inside that can change no pixel by a whole grey level — the shader’s own alpha at its most grazing ray, checked here against a thousand rays — is folded into the one veil, not drawn full-screen',
    `precompile sees ${seen.length} drawables (handle skipped, shared material once), lights from the scene, hooks ${hooks} · fold agrees with the ray sweep ${agree}/${total}, ${foldedFar} folded beyond 0.6 R`); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
