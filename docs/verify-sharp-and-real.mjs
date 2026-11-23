/* SHARP AND REAL (v4.437) — asked: speed the atlas up on old machines without touching the quality of the picture — bring the
   old sharpness back and choose the best way to optimise — and check the realism, taking the three-dimensional immersion in the
   universe and the Solar System further than before.
   What was found, and what is checked here:
     1. the blur was the atlas's own: the resolution governor held each scene at 0.75 of a pixel (0.6 under 12 frames a second),
        the post chain stepped itself down to 0.78, and the glass was taken away from a small or slow device — all of it while the
        picture stood still. The post chain is never lowered now and the glass stays (the governor itself, sharp when still and
        softer only under a moving camera, is run in verify-the-cool-frame.mjs);
     2. on an old machine the processor sets the pace, and the labels were half of a frame's script time. The label pass, lifted,
        is run on a scene of labels next to three.js's own CSS2DRenderer: the same labels shown, at the same places to a tenth of
        a pixel, in the same order — and a frame in which nothing moved writes nothing;
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
    12. found on the way: on an upright phone the floating buttons stood on the selection card's subtitle.
   What is NOT checked here: what a particular GPU draws or how fast — the headless renderer is software. */
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm';
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
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

{ /* 2. the label pass against three.js's own CSS2DRenderer */
  let writes = 0; const counted = new Set(), byKey = {};
  const mkEl = track => { const el = { parentNode: null, kids: [], setAttribute() {}, appendChild(c) { c.parentNode = el; el.kids.push(c); }, removeChild(c) { c.parentNode = null; } };
    el.style = track ? new Proxy({}, { set(t, k, v) { writes++; counted.add(el); byKey[k] = (byKey[k] || 0) + 1; t[k] = v; return true; } }) : {}; return el; };
  globalThis.document = { createElement: () => mkEl(false) };
  const W = 1200, H = 800;
  const build = track => { const r = (() => { let s = 77; return () => (s = (s * 16807) % 2147483647) / 2147483647; })(), sc = new THREE.Scene(), labs = [], groups = [];
    for (let g = 0; g < 6; g++) { const G = new THREE.Group(); G.position.set((r() - 0.5) * 6, (r() - 0.5) * 4, (r() - 0.5) * 6); sc.add(G); groups.push(G);
      for (let k = 0; k < 12; k++) { const o = new CSS2DObject(mkEl(track)); o.position.set((r() - 0.5) * 8, (r() - 0.5) * 6, (r() - 0.5) * 30); if (k % 5 === 0) o.renderOrder = 1; if (k % 7 === 3) o.center.set(0, 0.5); G.add(o); labs.push(o); } }
    const cam = new THREE.PerspectiveCamera(55, W / H, 0.1, 1000); cam.position.set(0, 0, 12); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(); return { sc, cam, labs, groups }; };
  const A = build(true), B = build(false);
  const lr = { domElement: mkEl(false), getSize: () => ({ width: W, height: H }) };
  const FR = new Function('THREE', 'labelRenderer', 'premiumDeclutterLabels', lift('const HCC_LABEL_FRAME=', '/* Label intelligence:') + ';return HCC_LABEL_FRAME;')(THREE, lr, () => {});
  const ref = new CSS2DRenderer(); ref.setSize(W, H);
  const frame = () => { A.sc.updateMatrixWorld(); FR.fresh = true; writes = 0; counted.clear(); for (const k in byKey) delete byKey[k]; lr.render(A.sc, A.cam); return writes; };
  const w1 = frame(); ref.render(B.sc, B.cam);
  const xy = el => { const m = /translate\(([-\d.e]+)px,([-\d.e]+)px\)/.exec(el.style.transform || ''); return m ? [+m[1], +m[2]] : null; };
  let shownA = 0, sameShown = true, worstPx = 0, sameCentre = true;
  for (let i = 0; i < A.labs.length; i++) { const a = A.labs[i].element, b = B.labs[i].element, sa = a.style.display !== 'none' && a.style.display !== undefined, sb = b.style.display !== 'none';
    if (sa !== sb) sameShown = false; if (!sa) continue; shownA++; const pa = xy(a), pb = xy(b); worstPx = Math.max(worstPx, Math.abs(pa[0] - pb[0]), Math.abs(pa[1] - pb[1]));
    if (a.style.transform.split(')translate(')[0] !== b.style.transform.split(')translate(')[0]) sameCentre = false; }
  const order = S => S.labs.map((o, i) => [i, o.element]).filter(([, e]) => e.style.display === '').sort((p, q) => +q[1].style.zIndex - +p[1].style.zIndex).map(([i]) => i).join(',');
  const sameOrder = order(A) === order(B);
  const w2 = frame();                                                     /* nothing moved */
  const mover = A.labs.find(o => o.element.style.display === ''); mover.position.x += 0.3; const w3 = frame(), moved = counted.size, onlyMover = counted.size <= 3 && counted.has(mover.element);
  const hidden = A.groups[2], hiddenLabs = hidden.children.filter(o => o.element.style.display === '').length; hidden.visible = false; const w4 = frame(), hid = byKey.display || 0, shifted = byKey.transform || 0, ranks = byKey.zIndex || 0;
  const allHidden = hidden.children.every(o => o.element.style.display === 'none'), walked = FR.walked, orderAfter = order(A) === (() => { B.groups[2].visible = false; ref.render(B.sc, B.cam); return B.labs.map((o, i) => [i, o]).filter(([, o]) => !o.parent || o.parent.visible).map(([i, o]) => [i, o.element]).filter(([, e]) => e.style.display === '').sort((p, q) => +q[1].style.zIndex - +p[1].style.zIndex).map(([i]) => i).join(','); })();
  const ok = sameShown && shownA > 20 && shownA < A.labs.length && worstPx <= 0.05 + 1e-9 && sameCentre && sameOrder && w1 >= 3 * shownA && w2 === 0 && w3 >= 1 && onlyMover && hid === hiddenLabs && shifted === 0 && allHidden && orderAfter && walked < 1 + A.groups.length + A.labs.length - hidden.children.length + 1;
  check(ok, 'labels at the cost of what moved: lifted and run beside three.js’s own CSS2DRenderer on 72 labels in six groups, the pass shows the same labels, at the same places to a twentieth of a pixel, with the same anchor and the same front-to-back order; a frame in which nothing moved writes NOTHING (three.js rewrites every label every frame); a moved label rewrites only itself; a hidden group is not entered, its labels are hidden once and the others keep their places and their order',
    `${shownA}/${A.labs.length} shown in both · worst offset ${worstPx.toFixed(3)} px · order ${sameOrder ? 'identical' : 'DIFFERENT'} · writes: first frame ${w1}, still frame ${w2}, one label moved ${w3} (${moved} element) · group hidden: ${hid} hidden of ${hiddenLabs} shown, ${shifted} moved, ${ranks} re-ranked, order ${orderAfter ? 'still identical' : 'DIFFERENT'}, ${walked} objects walked`); }

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
  const B = iso => { const T = (jdOf(iso) - 2451545) / 36525, d = jdOf(iso) - 2451545, q = new THREE.Quaternion(); SP.hccPlanetSpinQ('Saturn', d, q);
    const planet = new THREE.Object3D(); planet.quaternion.copy(q); const ring = new THREE.Object3D(); ring.rotation.x = -Math.PI / 2; planet.add(ring); planet.updateMatrixWorld(true);
    const nrm = new THREE.Vector3(0, 0, 1).transformDirection(ring.matrixWorld), u = scenePos(earth, T).sub(scenePos(sat, T)).normalize();
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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
