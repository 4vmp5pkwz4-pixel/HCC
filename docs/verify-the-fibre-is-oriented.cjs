#!/usr/bin/env node
'use strict';
/* ══ THE FIBRE, ORIENTED — AT BOTH ENDS OF THE LADDER (v4.396) ═══════════════════════════════════════════════════════════
 * Asked: place and orient the central Hopf fibre exactly, at the scale of the universe and at the Planck scale, and say
 * exactly how it is oriented. Checked here by running the page's own pure code:
 *   1. the scene is a proper image of the sky — the J2000 ecliptic frame, north up, determinant +1, never the mirror — and
 *      hccSceneToSky reads a scene direction back as RA/Dec, l/b and λ/β exactly (the inverse of raDecDir and hccGalToScene;
 *      the galactic centre, the north galactic pole and the north ecliptic pole where the IAU puts them)
 *   2. both charts keep the handedness of S³ (oriented as the boundary of its ball in ℂ² = ℝ⁴): two fibres, each oriented by
 *      its flow e^{it}, are linked +1 by Gauss's integral in the Horizons world's geodesic chart AND in the descent's
 *      stereographic chart — and the chart of v4.389–v4.395, (x₃, x₂, x₄), gives −1: the mirror, caught
 *   3. right-handed at us in both: along our fibre's flow the fibres round it turn positively about it (a right-handed
 *      screw), at one radian per R in the geodesic chart
 *   4. where it points: each anchor reads back as the catalogue's or the measurement's own coordinates — the Huge-LQG's
 *      display midpoint RA 164.0°, Dec +12.0°, the CMB dipole (l, b) = (264.021°, 48.253°), the scene's vertical the north
 *      ecliptic pole — and an axis without a sign (the quasars' principal axis) is given its northern end
 *   5. below the Planck length the picture is true to the sky by default: its axis — the fibre through the point followed,
 *      flowing along +z there — is turned onto the same anchor as the Horizons world's fibre, whatever the camera does,
 *      and only the turn about the axis (a symmetry, z₁ ↦ e^{ia}z₁) moves it; the site's horizon frame is right-handed
 *      and the azimuth runs from north through east
 *   6. the words state it: the coordinates, the source and its caveat, the flow, "right-handed", "+1", the mirror fixed
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const fn = name => { const i = SRC.indexOf('function ' + name + '('); if (i < 0) throw new Error('no function ' + name); let d = 0, j = SRC.indexOf('{', i);
  for (let k = j; k < SRC.length; k++) { const c = SRC[k]; if (c === '{') d++; else if (c === '}') { d--; if (!d) return SRC.slice(i, k + 1); } } throw new Error('unbalanced ' + name); };
const line = (re, what) => { const m = SRC.match(re); if (!m) throw new Error('not found: ' + what); return m[0]; };
/* the little of three.js the pure code touches */
class V3 { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; } set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } clone() { return new V3(this.x, this.y, this.z); }
  copy(v) { return this.set(v.x, v.y, v.z); } add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; } sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; } dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; } length() { return Math.hypot(this.x, this.y, this.z); }
  normalize() { return this.multiplyScalar(1 / (this.length() || 1)); } negate() { return this.multiplyScalar(-1); }
  crossVectors(a, b) { return this.set(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x); }
  applyQuaternion(q) { const { x, y, z } = this, qx = q.x, qy = q.y, qz = q.z, qw = q.w, tx = 2 * (qy * z - qz * y), ty = 2 * (qz * x - qx * z), tz = 2 * (qx * y - qy * x);
    return this.set(x + qw * tx + qy * tz - qz * ty, y + qw * ty + qz * tx - qx * tz, z + qw * tz + qx * ty - qy * tx); } }
/* three's own setFromUnitVectors, multiply and invert, transcribed */
class Q4 { constructor(x = 0, y = 0, z = 0, w = 1) { this.x = x; this.y = y; this.z = z; this.w = w; } clone() { return new Q4(this.x, this.y, this.z, this.w); }
  normalize() { const l = Math.hypot(this.x, this.y, this.z, this.w) || 1; this.x /= l; this.y /= l; this.z /= l; this.w /= l; return this; }
  invert() { this.x *= -1; this.y *= -1; this.z *= -1; return this; }
  multiply(b) { const a = this, ax = a.x, ay = a.y, az = a.z, aw = a.w, bx = b.x, by = b.y, bz = b.z, bw = b.w;
    this.x = ax * bw + aw * bx + ay * bz - az * by; this.y = ay * bw + aw * by + az * bx - ax * bz; this.z = az * bw + aw * bz + ax * by - ay * bx; this.w = aw * bw - ax * bx - ay * by - az * bz; return this; }
  setFromAxisAngle(ax, an) { const s = Math.sin(an / 2); this.x = ax.x * s; this.y = ax.y * s; this.z = ax.z * s; this.w = Math.cos(an / 2); return this; }
  setFromUnitVectors(f, t) { let r = f.dot(t) + 1; if (r < Number.EPSILON) { r = 0; if (Math.abs(f.x) > Math.abs(f.z)) { this.x = -f.y; this.y = f.x; this.z = 0; this.w = r; } else { this.x = 0; this.y = -f.z; this.z = f.y; this.w = r; } }
    else { this.x = f.y * t.z - f.z * t.y; this.y = f.z * t.x - f.x * t.z; this.z = f.x * t.y - f.y * t.x; this.w = r; } return this.normalize(); } }
const THREE = { Vector3: V3, Quaternion: Q4 };
const det3 = (a, b, c) => a.x * (b.y * c.z - b.z * c.y) - a.y * (b.x * c.z - b.z * c.x) + a.z * (b.x * c.y - b.y * c.x);
/* Gauss's linking integral of two closed polygons */
const gauss = (A, B) => { let g = 0; for (let i = 0; i < A.length; i++) { const a0 = A[i], a1 = A[(i + 1) % A.length]; for (let j = 0; j < B.length; j++) { const b0 = B[j], b1 = B[(j + 1) % B.length];
  const r = [0, 1, 2].map(t => (a0[t] + a1[t] - b0[t] - b1[t]) / 2), da = [0, 1, 2].map(t => a1[t] - a0[t]), db = [0, 1, 2].map(t => b1[t] - b0[t]);
  const cr = [da[1] * db[2] - da[2] * db[1], da[2] * db[0] - da[0] * db[2], da[0] * db[1] - da[1] * db[0]], d = Math.hypot(...r); g += (r[0] * cr[0] + r[1] * cr[1] + r[2] * cr[2]) / (d * d * d); } } return g / (4 * Math.PI); };
try {
  const K = new Function('THREE', [line(/const DEG = Math\.PI\/180;/, 'DEG'), line(/const OBLIQ = 23\.4392911\*DEG;/, 'OBLIQ'), fn('raDecDir'), fn('hccGalacticBasis'), fn('hccGalToScene'), fn('hccSceneToSky'), fn('hccFmtRA'), fn('hccFmtDMS'),
    fn('obsFibChart'), fn('obsFibThrough'), fn('dscHopfFibre'), fn('dscSkyQuat'), line(/const CMB_DIPOLE_PLANCK=Object\.freeze\(\{[^}]*\}\);/, 'the dipole'),
    'return {DEG,OBLIQ,raDecDir,hccGalacticBasis,hccGalToScene,hccSceneToSky,hccFmtRA,hccFmtDMS,obsFibChart,obsFibThrough,dscHopfFibre,dscSkyQuat,CMB_DIPOLE_PLANCK};'].join('\n'))(THREE);
  const D = K.DEG; let s = 11; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  /* 1 */
  { const ex = K.raDecDir(0, 0), ey = K.raDecDir(6, 0), ez = K.raDecDir(0, 90), dq = det3(ex, ey, ez), B = K.hccGalacticBasis(), dg = det3(B.x, B.y, B.z);
    const orth = Math.max(Math.abs(B.x.dot(B.y)), Math.abs(B.y.dot(B.z)), Math.abs(B.z.dot(B.x)), Math.abs(B.x.length() - 1), Math.abs(B.y.length() - 1), Math.abs(B.z.length() - 1));
    let eq = 0, ga = 0; for (let i = 0; i < 2000; i++) { const ra = 360 * rnd(), dec = Math.asin(2 * rnd() - 1) / D, r = K.hccSceneToSky(K.raDecDir(ra / 15, dec));
      eq = Math.max(eq, Math.abs(((r.ra - ra + 540) % 360) - 180) * Math.cos(dec * D), Math.abs(r.dec - dec));
      const l = 360 * rnd(), b = Math.asin(2 * rnd() - 1) / D, g = K.hccSceneToSky(K.hccGalToScene(l, b)); ga = Math.max(ga, Math.abs(((g.l - l + 540) % 360) - 180) * Math.cos(b * D), Math.abs(g.b - b)); }
    const gc = K.hccSceneToSky(K.hccGalToScene(0, 0)), ngp = K.hccSceneToSky(K.hccGalToScene(0, 90)), up = K.hccSceneToSky(new V3(0, 1, 0)), nep = 90 - 23.4392911;
    const refs = Math.abs(gc.ra - 266.405) < 1e-3 && Math.abs(gc.dec + 28.93617) < 1e-4 && Math.abs(ngp.ra - 192.85948) < 1e-4 && Math.abs(ngp.dec - 27.12825) < 1e-4 && Math.abs(up.dec - nep) < 1e-9 && Math.abs(up.ra - 270) < 1e-9 && Math.abs(up.beta - 90) < 1e-9;
    const fmt = K.hccFmtRA(164) === '10ʰ56ᵐ00.0ˢ' && K.hccFmtDMS(12, true) === '+12°00′00″' && K.hccFmtDMS(-28.93617) === '−28°56′10″' && K.hccFmtRA(359.99999) === '0ʰ00ᵐ00.0ˢ';
    ok('the scene is a proper image of the sky — determinant +1, the J2000 ecliptic frame with its north up — and a scene direction reads back exactly as RA/Dec, l/b and λ/β',
      Math.abs(dq - 1) < 1e-12 && Math.abs(dg - 1) < 1e-9 && orth < 1e-9 && eq < 1e-9 && ga < 1e-9 && refs && fmt,
      `det(equatorial) ${dq.toFixed(12)} · det(galactic) ${dg.toFixed(9)} · RA/Dec round trip ${eq.toExponential(1)}° · l/b ${ga.toExponential(1)}° · galactic centre RA ${gc.ra.toFixed(4)}°, Dec ${gc.dec.toFixed(4)}° · scene up Dec ${up.dec.toFixed(7)}° (the north ecliptic pole) · formats ${fmt ? '✓' : '✗'}`); }
  /* 2 */
  const R = 886.59;
  const obsLoop = (chart, eta, de, n) => { const P = []; for (let i = 0; i < n; i++) { const t = i / n, al = 2 * Math.PI * t; const o = [0, 0, 0]; chart(eta, al, al + de, R, o); P.push(o); } return P; };
  const stereoLoop = (th, ph, n) => K.dscHopfFibre(th, ph, n).slice(0, n).map(v => [v.x, v.y, v.z]);
  /* the chart of v4.389–v4.395, the same function with the old order, for the mutation */
  const old = new Function(fn('obsFibChart').replace('out[0]=x4*k; out[1]=x2*k; out[2]=x3*k;', 'out[0]=x3*k; out[1]=x2*k; out[2]=x4*k;') + '\nreturn obsFibChart;')();
  { const pairs = [[Math.PI / 12, 0, Math.PI / 4, 1.1], [Math.PI / 3, 0.4, 5 * Math.PI / 12, 2.9], [Math.PI / 6, 0, Math.PI / 2, 0.0]];
    const lkObs = pairs.map(([e1, d1, e2, d2]) => gauss(obsLoop(K.obsFibChart, e1, d1, 700), obsLoop(K.obsFibChart, e2, d2, 700)));
    const lkOld = pairs.map(([e1, d1, e2, d2]) => gauss(obsLoop(old, e1, d1, 700), obsLoop(old, e2, d2, 700)));
    const sp = [[0.7, 0.3, 1.9, 2.2], [1.2, 0, 2.6, 4.0], [0.4, 1.0, 1.0, 5.5]], lkSt = sp.map(([t1, p1, t2, p2]) => gauss(stereoLoop(t1, p1, 900), stereoLoop(t2, p2, 900)));
    ok('both charts keep the handedness: two fibres oriented by their flow are linked +1 by Gauss’s integral in the Horizons world’s geodesic chart and in the descent’s stereographic chart — the old order (x₃, x₂, x₄) gives −1, the mirror, and is caught',
      lkObs.every(x => Math.abs(x - 1) < 2e-2) && lkSt.every(x => Math.abs(x - 1) < 2e-2) && lkOld.every(x => Math.abs(x + 1) < 2e-2),
      `geodesic chart Lk ${lkObs.map(x => x.toFixed(4)).join(', ')} · stereographic Lk ${lkSt.map(x => x.toFixed(4)).join(', ')} · the v4.395 chart ${lkOld.map(x => x.toFixed(4)).join(', ')}`); }
  /* 3 */
  { /* in the geodesic chart our fibre is +y with its flow; a neighbour at η turns about it as α runs: the sign of (r × ṙ)·ŷ */
    let turn = Infinity, rate = 0; for (const eta of [1e-3, 0.01, 0.05]) for (const de of [0, 1.3, 3.9]) { const h = 1e-6, a = [0, 0, 0], b = [0, 0, 0]; K.obsFibChart(eta, -h, de - h, R, a); K.obsFibChart(eta, h, de + h, R, b);
      const r = [(a[0] + b[0]) / 2, (a[2] + b[2]) / 2], v = [(b[0] - a[0]) / (2 * h), (b[2] - a[2]) / (2 * h)], adv = (b[1] - a[1]) / (2 * h);
      /* the turn about +y: right-handed means (z, x) → (x, …): ω_y = (r × v)·ŷ = r_z v_x − r_x v_z */
      const wy = (r[1] * v[0] - r[0] * v[1]) / (r[0] * r[0] + r[1] * r[1]); turn = Math.min(turn, wy * Math.sign(adv)); if (eta === 1e-3) rate = wy / adv * R; }
    /* in the stereographic chart the axis is +z with its flow at the origin; its neighbours (θ just under π) turn about it */
    let turnS = Infinity; for (const th of [Math.PI - 0.02, Math.PI - 0.1]) for (const ph of [0, 2.1, 4.4]) { const P = K.dscHopfFibre(th, ph, 4000), i = 3000, a = P[i - 1], b = P[i + 1], c = P[i];
      const adv = b.z - a.z, wz = (c.x * (b.y - a.y) - c.y * (b.x - a.x)) / (c.x * c.x + c.y * c.y); turnS = Math.min(turnS, wz * Math.sign(adv)); }
    ok('right-handed at us in both charts: along our fibre’s flow the fibres round it turn positively about it — a right-handed screw — at one radian per R in the geodesic chart',
      turn > 0 && turnS > 0 && Math.abs(rate - 1) < 1e-3, `turn about the flow: geodesic ${turn > 0 ? '+' : '−'} · stereographic ${turnS > 0 ? '+' : '−'} · rate near us ${rate.toFixed(6)} rad per R`); }
  /* 4 */
  { const row = key => { const m = SRC.match(new RegExp("\\{key:'" + key + "', name:'[^']*', ra:([0-9.]+), dec:(-?[0-9.]+),")); return m ? [+m[1], +m[2]] : null; };
    let worst = 0; const got = {}; for (const key of ['hugelqg', 'cclqg', 'hyperion']) { const rd = row(key), r = K.hccSceneToSky(K.raDecDir(rd[0] / 15, rd[1])); got[key] = r; worst = Math.max(worst, Math.abs(r.ra - rd[0]), Math.abs(r.dec - rd[1])); }
    const dp = K.hccSceneToSky(K.hccGalToScene(K.CMB_DIPOLE_PLANCK.l, K.CMB_DIPOLE_PLANCK.b)), dipole = Math.abs(dp.l - 264.021) < 1e-9 && Math.abs(dp.b - 48.253) < 1e-9;
    const anchorSrc = fn('obsFibAnchorDir'), viaCat = /const P=id==='hugelqg'\|\|id==='cclqg'\|\|id==='hyperion'\|\|id==='bossgw'\?COSMOS_POS\.get\(id\):null; if\(P\) return P\.clone\(\)\.normalize\(\);/.test(anchorSrc)
      && /if\(id==='dipole'\)\{ const d=hccGalToScene\(CMB_DIPOLE_PLANCK\.l,CMB_DIPOLE_PLANCK\.b\);/.test(anchorSrc) && /return new THREE\.Vector3\(0,1,0\); \}$/.test(anchorSrc)
      && /const dir = raDecDir\(s\.ra\/15, s\.dec\), g = new THREE\.Group\(\);\n  g\.position\.copy\(dir\)\.multiplyScalar\(dist\);/.test(SRC);
    const north = /const ax=new THREE\.Vector3\(v\[0\],v\[1\],v\[2\]\); if\(hccSceneToSky\(ax\)\.dec<0\) ax\.negate\(\);/.test(fn('obsFibQsoAxis'));
    ok('where it points: every anchor reads back as its own source — the Huge-LQG’s display midpoint RA 164.0°, Dec +12.0°, the CMB dipole (l, b) = (264.021°, 48.253°), the scene’s vertical the north ecliptic pole — and the quasars’ axis, which has no sign, is given its northern end',
      worst < 1e-9 && dipole && viaCat && north && got.hugelqg && K.hccFmtRA(got.hugelqg.ra) === '10ʰ56ᵐ00.0ˢ' && K.hccFmtDMS(got.hugelqg.dec, true) === '+12°00′00″',
      `catalogue round trip ${worst.toExponential(1)}° · the Huge-LQG at RA ${K.hccFmtRA(got.hugelqg.ra)}, Dec ${K.hccFmtDMS(got.hugelqg.dec, true)}, l ${got.hugelqg.l.toFixed(3)}°, b ${got.hugelqg.b.toFixed(3)}° · dipole ${dipole ? '✓' : '✗'} · anchors from the catalogue ${viaCat ? '✓' : '✗'} · northern end ${north ? '✓' : '✗'}`); }
  /* 5 */
  { /* the picture's world turn is camera·(camera⁻¹·Q_sky·spin) = Q_sky·spin, whatever the camera: its +z is the anchor */
    let worst = 0; for (let i = 0; i < 300; i++) { const dir = K.raDecDir(24 * rnd(), Math.asin(2 * rnd() - 1) / D), cam = new Q4(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(), spin = new Q4().setFromAxisAngle(new V3(0, 0, 1), 7 * rnd());
      const qOut = cam.clone().invert().multiply(K.dscSkyQuat(dir)).multiply(spin), F = cam.clone().multiply(qOut), z = new V3(0, 0, 1).applyQuaternion(F); worst = Math.max(worst, z.clone().sub(dir).length()); }
    const beyond = SRC.slice(SRC.indexOf("D.push({id:'beyond'"), SRC.indexOf("D.push({id:'beyond'") + 40000);
    const tick = /skyTrue=state\.dscSkyTrue!==false;/.test(beyond) && /if\(skyTrue&&U\.skyId!==\(state\.obsFibAnchor\|\|'hugelqg'\)\)\{ U\.skyId=state\.obsFibAnchor\|\|'hugelqg'; U\.skyDir=obsFibAnchorDir\(U\.skyId\); U\.skyQ=dscSkyQuat\(U\.skyDir\);/.test(beyond)
      && /const qOut=skyTrue\?camera\.quaternion\.clone\(\)\.invert\(\)\.multiply\(U\.skyQ\)\.multiply\(spin\)/.test(beyond) && /F\.quaternion\.copy\(camera\.quaternion\)\.multiply\(qOut\)/.test(beyond)
      && /spin=new THREE\.Quaternion\(\)\.setFromAxisAngle\(dscV\(0,0,1\),0\.045\*ti\)/.test(beyond);
    /* the axis fibre flows along +z at the origin of the chart: z₁ = 0, z₂ = e^{iψ}, at ψ = −π/2 */
    const ax = K.dscHopfFibre(Math.PI, 0, 4000), i0 = 3000, flowZ = ax[i0 + 1].z - ax[i0 - 1].z, atOrigin = Math.hypot(ax[i0].x, ax[i0].y, ax[i0].z);
    /* the site's horizon frame (dscFrame) is right-handed and orthonormal, and the azimuth runs from north through east */
    let enu = 0; for (let i = 0; i < 200; i++) { const f = (180 * rnd() - 90) * D, l = 360 * rnd() * D, c = Math.cos(f), up = [-Math.sin(l) * c, Math.sin(f), -Math.cos(l) * c], ea = [-Math.cos(l), 0, Math.sin(l)], no = [Math.sin(l) * Math.sin(f), Math.cos(f), Math.cos(l) * Math.sin(f)];
      const cr = [ea[1] * no[2] - ea[2] * no[1], ea[2] * no[0] - ea[0] * no[2], ea[0] * no[1] - ea[1] * no[0]]; enu = Math.max(enu, Math.hypot(cr[0] - up[0], cr[1] - up[1], cr[2] - up[2]), Math.abs(ea[0] * no[0] + ea[1] * no[1] + ea[2] * no[2])); }
    const frame = fn('dscFrame'), enuSrc = frame.includes('const up=hccEarthLocalDir(s.lat,s.lon).applyQuaternion(DSC.q), ea=new THREE.Vector3(-Math.cos(l),0,Math.sin(l)).applyQuaternion(DSC.q), no=new THREE.Vector3(Math.sin(l)*Math.sin(f),Math.cos(f),Math.cos(l)*Math.sin(f)).applyQuaternion(DSC.q);')
      && /return \(out\|\|new THREE\.Vector3\(\)\)\.set\(-Math\.sin\(l\)\*c, Math\.sin\(f\), -Math\.cos\(l\)\*c\);/.test(fn('hccEarthLocalDir')) && /az:\(\(Math\.atan2\(d\(DSC\.E\),d\(DSC\.Nn\)\)\/DEG\)\+360\)%360/.test(fn('dscSkyAltAz'));
    ok('below the Planck length the picture is true to the sky by default: its axis — the fibre through the point followed, flowing along +z there — is turned onto the Horizons world’s anchor whatever the camera does, only the turn about it (a symmetry) runs, and the site’s horizon frame is right-handed with the azimuth from north through east',
      worst < 1e-12 && tick && flowZ > 0 && atOrigin < 1e-2 && enu < 1e-12 && enuSrc, `+z onto the anchor to ${worst.toExponential(1)} over 300 cameras · tick ${tick ? '✓' : '✗'} · axis flow at the origin ${flowZ > 0 ? '+z' : '−z'} · E × N = Up to ${enu.toExponential(1)} · site frame ${enuSrc ? '✓' : '✗'}`); }
  /* 6 */
  { const words = [
      ['the panel’s exact orientation', /function obsFibDirHTML\(\)/.test(SRC) && SRC.includes('Exactly where our fibre points') && SRC.includes('<div class="note" id="obsFibDir"')],
      ['RA/Dec, l/b, λ/β in one line', /RA \$\{hccFmtRA\(I\.ra\)\}, Dec \$\{hccFmtDMS\(I\.dec,true\)\} \(ICRS\) · l = /.test(SRC)],
      ['the flow and the handedness', SRC.includes('Its flow e^{it} runs from us toward that point') && SRC.includes('right-handed — the fibres round ours wind about it as a right-handed screw along its flow, one radian every R; every two are linked +1')],
      ['the caveat of the anchor', SRC.includes('the catalogue’s display midpoint of the group’s sky region (accuracy tier D) — not a centroid')],
      ['the label on our fibre', SRC.includes("const handL=TT('flow toward it · the fibres round it wind right-handed, one radian every R · every two linked +1'")],
      ['the orientation below ℓ_P: the arrow on the axis and the line under the title', SRC.includes('U.O.element.textContent=`→ ${sh}`;') && /U\.O\.visible=on&&tc<0\.2&&k<1\.4;/.test(SRC)
        && SRC.includes('true to the sky: the axis — the fibre through this point — runs toward ${nm}, RA ${hccFmtRA(I.ra)}, Dec ${hccFmtDMS(I.dec,true)}') && SRC.includes('right-handed, every two fibres linked +1${at}')],
      ['the switch and the site', SRC.includes('data-s2sky="1"') && SRC.includes('(from north through east; to about 0.2°') && SRC.includes('The gold fibre lies square to it and runs counterclockwise seen from that point of the sky')],
      ['the mirror, said', SRC.includes('Until v4.396 it read (x₃, x₂, x₄), an odd one, and drew the mirror image')]];
    const miss = words.filter(w => !w[1]).map(w => w[0]);
    ok('the words state it: the coordinates in every frame, the source and its caveat, the flow, right-handed, +1, the switch, the site, and the mirror that was fixed', miss.length === 0, miss.length ? 'missing: ' + miss.join(' | ') : `${words.length} statements in place`); }
} catch (e) { fail++; console.log('  FAIL — verifier error: ' + (e && e.stack || e)); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
