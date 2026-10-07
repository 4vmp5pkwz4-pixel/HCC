#!/usr/bin/env node
'use strict';
/* ══ EVERYTHING MOVES WITH THE CLOCK (v4.375) ═════════════════════════════════════════════════════════════════════
 * Reported: at full time-machine speed many stars of the Galaxy stood still. Measured at 10¹¹ d/s in every scale
 * layer: the 4 780 exoplanet hosts, the 5 200 main-belt asteroids and the 22 000 Kuiper-belt objects never moved, and
 * the 17 300 galaxies of the local web stood still in comoving space. Checked here:
 *   1. the belts ride Kepler ellipses from the elements they were drawn from: the J2000 place is reproduced, one period
 *      later the body is back, half a period later it is not, and at 10¹³ years the phase is still finite and the radius
 *      inside [a(1−e), a(1+e)] — run on the page's own code
 *   2. a planet host rides its circular orbit of the atlas's rotation curve on the Gaia torus shader: its Galactocentric
 *      radius stays fixed to 10⁻⁶ over a gigayear while its place relative to the Sun changes (kernels run)
 *   3. Zel'dovich for the local web: ψ = v₀[D(t)/D₀ − 1]/(H₀f₀) — zero now, −v₀/(H₀f₀) (Lagrangian) at the Big Bang,
 *      bounded in the far future (D → D∞) (kernels run)
 *   4. wired: the hosts' ride, the belts' tick and the Zel'dovich tick are called every frame
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const slice = (a, b) => { const i = SRC.indexOf(a), j = SRC.indexOf(b, i); if (i < 0 || j < 0) throw new Error('missing ' + a); return SRC.slice(i, j); };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  /* 1 */
  { const code = slice('const KEP_EL=new WeakMap();', 'let solarBeltPoints=null');
    const state = { epochDays: 0 }, f = new Function('state', code + ';return {kepStore,kepSwarmTick,KEP_EL};')(state);
    const a = 2.7, e = 0.15, inc = 0.12, Om = 1.1, w = 2.3, nu = 0.9, key = new Float32Array(1); f.kepStore(key, 0, a, e, inc, Om, w, nu);
    const r0 = a * (1 - e * e) / (1 + e * Math.cos(nu)), u = w + nu, x0 = r0 * (Math.cos(Om) * Math.cos(u) - Math.sin(Om) * Math.sin(u) * Math.cos(inc)), y0 = r0 * (Math.sin(Om) * Math.cos(u) + Math.cos(Om) * Math.sin(u) * Math.cos(inc)), z0 = r0 * Math.sin(u) * Math.sin(inc);
    const P = { visible: true, parent: null, userData: { kep: { el: f.KEP_EL.get(key), t: null } }, geometry: { attributes: { position: { array: new Float32Array(3) }, aTheta: { array: new Float32Array(1) } } } };
    const at = t => { state.epochDays = t; P.userData.kep.t = null; f.kepSwarmTick(P); return Array.from(P.geometry.attributes.position.array); };
    const per = 2 * Math.PI * a * Math.sqrt(a) / 0.01720209895, p0 = at(0), p1 = at(per), ph = at(per / 2), pf = at(1e13 * 365.25), rf = Math.hypot(...pf);
    const d0 = Math.hypot(p0[0] - x0, p0[1] - z0, p0[2] - y0), d1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]), dh = Math.hypot(ph[0] - p0[0], ph[1] - p0[1], ph[2] - p0[2]);
    ok('the belts ride Kepler ellipses: the J2000 place is reproduced, one period later the body is back, half a period later it is across its orbit, and at 10¹³ years the radius is still inside [a(1−e), a(1+e)]',
      d0 < 1e-5 && d1 < 1e-4 && dh > 3 && rf >= a * (1 - e) - 1e-5 && rf <= a * (1 + e) + 1e-5, `J2000 ${d0.toExponential(1)} AU · one period ${d1.toExponential(1)} AU · half ${dh.toFixed(3)} AU · r(10¹³ yr) ${rf.toFixed(4)} AU`); }
  /* 2 */
  { const { galOrbit, galCircularVel, galSunOrbit, gaiaOrbitAttrs, gaiaOrbitAt, galOrbitAt, GAL_RIDE } = K, S = galSunOrbit();
    const g = [GAL_RIDE.R0 - 600, 420, 35], o = galOrbit(g, galCircularVel(g)), A = gaiaOrbitAttrs(o, S);
    let rmin = Infinity, rmax = 0; const rel = []; for (const t of [0, 100, 250, 600, 1000]) { const q = galOrbitAt(o, t), R = Math.hypot(q[0], q[1]); rmin = Math.min(rmin, R); rmax = Math.max(rmax, R); rel.push(gaiaOrbitAt(A, t)); }
    const moved = Math.hypot(rel[4][0] - rel[0][0], rel[4][1] - rel[0][1]);
    ok('a planet host rides its circular orbit on the Gaia torus shader: its Galactocentric radius is fixed over a gigayear while its place relative to the Sun moves',
      (rmax - rmin) / rmax < 1e-6 && moved > 100 && /function exoRideBuild\(D,n,col,siz,pts\)/.test(SRC) && /galOrbit\(g,galCircularVel\(g\)\), A=gaiaOrbitAttrs\(orb,S\)/.test(SRC), `ΔR/R ${((rmax - rmin) / rmax).toExponential(1)} · moved ${moved.toFixed(0)} pc relative to the Sun in 1 Gyr`); }
  /* 3 */
  { const { lssGrowth, lssGrowthRate, hzAtT, hzAgeAtA } = K, f0 = lssGrowthRate(1), t0 = hzAgeAtA(1), H0 = 68.43;
    const kap = dt => { const h = hzAtT(t0 + dt), D = h ? lssGrowth(h.a) : 0; return (D - 1) / (H0 * f0); };
    const now = kap(0), bb = kap(-t0 + 1e-3), fut = kap(1000), fut2 = kap(5000);
    ok("Zel'dovich for the local web: the displacement is zero now, −v₀/(H₀f₀) at the Big Bang (the Lagrangian position), and bounded in the far future as the growth factor saturates",
      Math.abs(now) < 1e-12 && Math.abs(bb + 1 / (H0 * f0)) / (1 / (H0 * f0)) < 0.01 && fut > 0 && Math.abs(fut2 - fut) < 1e-6 && /ψ\(t\) = v₀ \[D\(t\)\/D₀ − 1\]\/\(H₀ f₀\)/.test(SRC),
      `κ now ${now.toExponential(1)} · Big Bang ${(bb * 300).toFixed(2)} Mpc · far future ${(fut * 300).toFixed(2)} Mpc for 300 km/s · f₀ ${f0.toFixed(4)}`); }
  /* 4 */
  ok('wired: the hosts ride every frame (exoRideTick from exoTick), the belts tick with the cosmic guides, the local web takes its Zel\'dovich displacement every frame',
    /try\{ exoRideTick\(\); \}catch\(e\)\{\}/.test(SRC) && /try\{ kepSwarmTick\(solarBeltPoints\); kepSwarmTick\(kuiperPoints\); \}catch\(e\)\{\}/.test(SRC)
    && /solarBeltPoints\.userData\.kep=\{el:KEP_EL\.get\(aArr\), t:null\}/.test(SRC) && /kuiperPoints\.userData\.kep=\{el:KEP_EL\.get\(aArr\), t:null\}/.test(SRC) && /try\{ webZelTick\(\); \}catch\(e\)\{\}/.test(SRC)
    && /const mat=galRiderMaterial\(\);/.test(SRC));
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
