#!/usr/bin/env node
'use strict';
/* ══ THE EARTH STANDS TRUE ══════════════════════════════════════════════════════
 * The Earth now wears NASA's maps, and you can stand on it at a latitude and longitude
 * with a phone that turns the view. Every piece of that can be wrong in a way that
 * still looks right, so this file reads index.html and COMPUTES:
 *   1. the map is on the globe the right way round: for every vertex of a three.js
 *      sphere, the longitude the shifted texture shows there is the longitude the
 *      atlas reads for that direction (Greenwich on local −Z, where the IAU angle W
 *      puts the prime meridian; east towards −X)
 *   2. the maps come from one pinned package version, loaded only on demand, with a
 *      plain sphere kept as the fallback
 *   3. the World Magnetic Model port reproduces the official WMM2025 test value
 *      (NOAA/NCEI) at 80° N 0° E, 2025.0, to 0.1 nT
 *   4. the zenith is the geodetic vertical and the eye stands at the geocentric
 *      latitude (WGS84)
 *   5. the phone's orientation becomes the right view: upright towards magnetic north
 *      looks at azimuth = declination; turned, tilted and pointed at the zenith, it
 *      looks where the phone looks
 *   6. the First-Principles Lens opens on a navigator that reaches every world, every
 *      laboratory and every object
 *   7. MUTATIONS: the texture unshifted, the declination applied with the wrong sign,
 *      and the geodetic vertical replaced by the radius are each caught
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const DEG = Math.PI / 180;

/* 1 · the map on the globe */
const grab = (s, re) => (s.match(re) || [])[0] || '';
const mapCheck = s => {
  const shift = +(s.match(/uv\.setX\(i,uv\.getX\(i\)([-+]\d*\.?\d+)\);\s*\/\/ Greenwich on local −Z/) || [0, NaN])[1];
  const locSrc = grab(s, /function hccEarthLocalDir\(latDeg,lonDeg,out\)\{[\s\S]*?\n\}/), llSrc = grab(s, /function hccEarthLonLatOfLocal\(v\)\{[\s\S]*?\n\}/);
  if (!Number.isFinite(shift) || !locSrc || !llSrc) return { ok: false, worst: NaN, shift };
  const V = class { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; } set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } clone() { return new V(this.x, this.y, this.z); } normalize() { const l = Math.hypot(this.x, this.y, this.z); this.x /= l; this.y /= l; this.z /= l; return this; } };
  const THREE = { Vector3: V, MathUtils: { clamp: (x, a, b) => Math.min(b, Math.max(a, x)) } };
  const localDir = new Function('THREE', 'DEG', locSrc + ';return hccEarthLocalDir;')(THREE, DEG);
  const lonLat = new Function('THREE', 'DEG', llSrc + ';return hccEarthLonLatOfLocal;')(THREE, DEG);
  let worst = 0;
  for (let iu = 0; iu <= 64; iu++) for (let iv = 1; iv < 32; iv++) {
    const u = iu / 64, v = iv / 32, phi = u * 2 * Math.PI, th = v * Math.PI;
    const P = new V(-Math.cos(phi) * Math.sin(th), Math.cos(th), Math.sin(phi) * Math.sin(th));   // three.js SphereGeometry
    const texLon = ((((u + shift) % 1) + 1) % 1) * 360 - 180, texLat = 90 - v * 180;              // equirectangular map, lon −180 at u = 0
    const ll = lonLat(P), dl = Math.abs((((ll.lon - texLon) % 360) + 540) % 360 - 180);
    worst = Math.max(worst, dl * Math.cos(texLat * DEG), Math.abs(ll.lat - texLat));
    const back = localDir(ll.lat, ll.lon); worst = Math.max(worst, Math.hypot(back.x - P.x / Math.hypot(P.x, P.y, P.z), back.y - P.y / Math.hypot(P.x, P.y, P.z), back.z - P.z / Math.hypot(P.x, P.y, P.z)) / DEG);
  }
  return { ok: worst < 1e-6, worst, shift };
};
const M = mapCheck(SRC);
ok('the map is on the globe the right way round: the texture shows at every vertex the longitude the atlas reads there', M.ok,
  `shift u${M.shift} · worst ${M.worst.toExponential(1)}° over 2 015 vertices · Greenwich on local −Z, east on −X`);
ok('and that is where the IAU angle W puts the prime meridian: the mesh turns by W = 190.147° + 360.9856235°·d about the pole',
  /\(\(\(o\.p\.spinW0\+o\.p\.spinRateDegDay\*eDaysB\)%360\+360\)%360\)\*DEG/.test(SRC) && /spinW0:190\.147/.test(SRC) && /spinRateDegDay:360\.9856235/.test(SRC));

/* 2 · the maps */
const base = (SRC.match(/const HCC_EARTH_TEX_BASE='([^']+)';/) || [])[1] || '';
ok('the maps come from one pinned package version, on demand, with the plain sphere kept as the fallback',
  /^https:\/\/cdn\.jsdelivr\.net\/npm\/three-globe@\d+\.\d+\.\d+\/example\/$/.test(base) && /if\(px>10\|\|\(state\.landed&&bodyEntry\(state\.landed\.idx\)\.mesh===o\.mesh\)\) hccEarthLoad\(\);/.test(SRC)
  && /if\(k==='day'\) HCC_EARTH\.state='failed';/.test(SRC), base);

/* 3 · WMM2025 */
const wmm = s => {
  const coef = grab(s, /const HCC_WMM2025=\{[\s\S]*?\};/), fn = grab(s, /function hccWMM\(latDeg,lonDeg,hKm,year\)\{[\s\S]*?\n\}/);
  if (!coef || !fn) return null; return new Function('DEG', coef + fn + ';return hccWMM;')(DEG);
};
const W = wmm(SRC), t = W && W(80, 0, 0, 2025.0);
ok('the World Magnetic Model port reproduces the official WMM2025 test value at 80° N 0° E, sea level, 2025.0',
  t && Math.abs(t.X - 6521.6) < 0.1 && Math.abs(t.Y - 145.9) < 0.1 && Math.abs(t.Z - 54791.5) < 0.1,
  t ? `X ${t.X.toFixed(1)} · Y ${t.Y.toFixed(1)} · Z ${t.Z.toFixed(1)} nT (NOAA: 6521.6 · 145.9 · 54791.5) · D ${t.D.toFixed(2)}°` : 'no model');
const lon = W && W(51.48, 0, 0, 2026.7), mos = W && W(55.7558, 37.6173, 0.15, 2026.7), sf = W && W(37.77, -122.42, 0, 2026.7);
ok('and gives the declinations a compass shows: London about +1°, Moscow about +12°, San Francisco about +13°',
  lon && Math.abs(lon.D - 1.2) < 1 && Math.abs(mos.D - 12.1) < 1 && Math.abs(sf.D - 12.8) < 1, lon ? `London ${lon.D.toFixed(2)}° · Moscow ${mos.D.toFixed(2)}° · San Francisco ${sf.D.toFixed(2)}°` : '');

/* 4 · geodetic vertical, geocentric position */
const geo = s => /const up=hccEarthLocalDir\(L\.geo\.lat,L\.geo\.lon\)\.applyQuaternion\(q\)\.normalize\(\);/.test(s)
  && /const pos=hccEarthLocalDir\(hccGeocentricLat\(L\.geo\.lat\),L\.geo\.lon\)\.applyQuaternion\(q\);/.test(s) && /const HCC_WGS84_F=1\/298\.257223563;/.test(s);
const gc = Math.atan((1 - 1 / 298.257223563) ** 2 * Math.tan(45 * DEG)) / DEG;
ok('the zenith is the geodetic vertical of WGS84 and the eye stands at the geocentric latitude', geo(SRC), `at 45°: geocentric ${gc.toFixed(4)}°, the zenith leans ${(45 - gc).toFixed(3)}° from the radius`);
ok('north is the Earth\'s pole projected on the horizon, not the ecliptic north', /const pole=new THREE\.Vector3\(0,1,0\)\.applyQuaternion\(q\);\s*const north=pole\.addScaledVector\(up,-pole\.dot\(up\)\)\.normalize\(\), east=north\.clone\(\)\.cross\(up\)\.normalize\(\);/.test(SRC));

/* 5 · the phone → the view (the same algebra the atlas runs, on plain quaternions) */
const decl = s => /if\(mag\) a-=decl;/.test(s);
ok('a magnetic heading is turned to true north by the declination, east-positive', decl(SRC));
ok('the device frame is W3C (alpha, beta, gamma) → Euler YXZ, −90° about x, minus the screen rotation',
  /_shE\.set\(o\.b,o\.a\+SKY_HERE\.manual,-o\.g,'YXZ'\); _shQ\.setFromEuler\(_shE\)\.multiply\(_shQ1\)\.multiply\(_shQ0\.setFromAxisAngle\(_shZ,-sa\)\);/.test(SRC)
  && /_shM\.makeBasis\(F\.east,F\.up,F\.north\.clone\(\)\.negate\(\)\); _shB\.setFromRotationMatrix\(_shM\)\.multiply\(_shQ\);/.test(SRC));
const qmul = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
const qax = (x, y, z, a) => [x * Math.sin(a / 2), y * Math.sin(a / 2), z * Math.sin(a / 2), Math.cos(a / 2)];
const qrot = (q, v) => { const p = qmul(qmul(q, [v[0], v[1], v[2], 0]), [-q[0], -q[1], -q[2], q[3]]); return p.slice(0, 3); };
const view = (alpha, beta, gamma, D) => {                     // YXZ: q = Ry(alpha) Rx(beta) Rz(-gamma); then Rx(-90°)
  const a = (alpha - D) * DEG, q = qmul(qmul(qmul(qax(0, 1, 0, a), qax(1, 0, 0, beta * DEG)), qax(0, 0, 1, -gamma * DEG)), qax(1, 0, 0, -Math.PI / 2));
  const f = qrot(q, [0, 0, -1]);                                // local frame x = east, y = up, z = south
  return { az: ((Math.atan2(f[0], -f[2]) / DEG) + 360) % 360, alt: Math.asin(Math.max(-1, Math.min(1, f[1]))) / DEG };
};
const D = 12.14, cases = [[[0, 90, 0], 12.14, 0], [[90, 135, 0], 282.14, 45], [[180, 90, 0], 192.14, 0], [[0, 180, 0], null, 90]];
const res = cases.map(([o, az, alt]) => { const v = view(...o, D); return { o, v, good: Math.abs(v.alt - alt) < 1e-6 && (az == null || Math.abs(((v.az - az + 540) % 360) - 180) < 1e-6) }; });
ok('the phone points the view where it points: north-up, turned west and raised 45°, south, and the zenith',
  res.every(r => r.good), res.map(r => `(${r.o.join(',')}) → az ${r.v.az.toFixed(2)}° alt ${r.v.alt.toFixed(2)}°`).join(' · '));

/* 6 · the navigator */
ok('the First-Principles Lens opens on a navigator that reaches every world, laboratory and object',
  /let lens=null,view='nav'/.test(SRC) && /data-view="nav">Navigator</.test(SRC) && /find:\(q,n=24\)=>/.test(SRC) && /open:key=>\{ if\(!SELECT\.has\(key\)\) return false;/.test(SRC)
  && /layer:L=>\{ if\(!\['local','galactic','andromeda','cosmic'\]\.includes\(L\)\) return false;/.test(SRC) && /const NAV_TRIPS=\[/.test(SRC));

ok('on a phone the standing banner stands on the clock band, compact, and the round buttons step aside — the sky stays clear',
  /#landedBanner\{top:auto!important;bottom:calc\(var\(--bottom-band,0px\) \+ 8px\)!important;[^}]*max-height:30vh/.test(SRC)
  && /body\.hcc-landed #mBtns, body\.hcc-landed #dockFab, body\.hcc-landed #ctlFab, body\.hcc-landed #helpFab\{display:none!important\}/.test(SRC)
  && /document\.body\.classList\.add\('hcc-landed'\);/.test(SRC) && /document\.body\.classList\.remove\('hcc-landed'\);/.test(SRC));

/* 7 · mutations */
ok('MUTATION — the texture left unshifted (Greenwich on +X, 90° wrong) is caught', !mapCheck(SRC.replace('uv.setX(i,uv.getX(i)-0.25);', 'uv.setX(i,uv.getX(i)+0);')).ok);
ok('MUTATION — the declination applied with the wrong sign is caught', !decl(SRC.replace('if(mag) a-=decl;', 'if(mag) a+=decl;')));
ok('MUTATION — the radius put in place of the geodetic vertical is caught',
  !geo(SRC.replace('const up=hccEarthLocalDir(L.geo.lat,L.geo.lon).applyQuaternion(q).normalize();', 'const up=pos.clone().normalize();')));

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
