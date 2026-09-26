#!/usr/bin/env node
'use strict';
/* ══ THE NEIGHBOURHOOD RIDES THE GALAXY ════════════════════════════════════════════════
 * Two faults, found because a reader ran the clock fast: the Milky Way was drawn turning
 * the wrong way (the Galactic centre drifted toward Cygnus, l = 90°, where the Sun is
 * going), and the stars flew in straight lines while the arms wheeled past them. Now the
 * disc turns clockwise from the north Galactic pole, and every star, nebula, cluster and
 * arm tracer rides it on an epicycle — Hill's equations in the frame of the local standard
 * of rest, with the Oort constant A this atlas measured itself. This file checks the
 * extracted kernel (core/atlas/extracted.mjs) with references written HERE:
 *   1. Hill's closed form against a Runge–Kutta integration of Hill's equations written
 *      here, over 300 Myr, to 1e-6 pc
 *   2. exact at J2000: the ridden position is the catalogue position and its time
 *      derivative is the catalogue velocity; over 0.1 Myr it is the straight line to 0.01 pc
 *   3. the invariants of Hill's equations, conserved along the closed form: the Jacobi
 *      integral ½(ẋ² + ẏ²) − 2ΩA x², the guiding-centre momentum ẏ + 2Ωx and the vertical
 *      energy ½ż² + ½ν²z² — and the epicycle period is 2π/κ with κ² = 4Ω(Ω − A)
 *   4. the sense of rotation: a quarter galactic year on, the centre is seen toward
 *      l = 270°; the Sun has moved toward l = 90°
 *   5. a disc object on its circular orbit keeps its galactocentric radius to 1 % for
 *      five gigayears — the guiding centres move on circles, not on the tangent line
 *   6. the constant A the ride uses is the one the atlas measures from its own stars
 *   7. the wiring: the disc, the Hipparcos stars, the named stars, the nebulae and the
 *      arm tracers all ride; the in-page self-test states the sense of rotation
 *   8. MUTATIONS: the frame turned the old way puts the centre toward l = 90°; guiding
 *      centres carried on the tangent line let a circular orbit wander off its radius
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { GAL_RIDE: P, galHill, galRide, galRideHalo, galCircularVel, galFrameAngle } = K;

  /* 1 · closed form against RK4 */
  { const f = s => [s[3], s[4], s[5], 2 * P.Om * s[4] + 4 * P.Om * P.A * s[0], -2 * P.Om * s[3], -P.nu * P.nu * s[2]];
    let s = [150, -60, 40, 4, -3, 2]; const dt = 0.01; for (let i = 0; i < 30000; i++) { const a = f(s), b = f(s.map((x, j) => x + dt / 2 * a[j])), c = f(s.map((x, j) => x + dt / 2 * b[j])), e = f(s.map((x, j) => x + dt * c[j])); s = s.map((x, j) => x + dt / 6 * (a[j] + 2 * b[j] + 2 * c[j] + e[j])); }
    const cf = galHill(150, -60, 40, 4, -3, 2, 300, P), dev = Math.max(...cf.map((x, i) => Math.abs(x - s[i])));
    ok('Hill\'s closed form equals a Runge–Kutta integration of ẍ − 2Ωẏ − 4ΩAx = 0, ÿ + 2Ωẋ = 0, z̈ + ν²z = 0 over 300 Myr, to 1e-6 pc', dev < 1e-6, `max deviation ${dev.toExponential(1)} pc`); }

  /* 2 · exact at J2000, a straight line at first */
  { const d = [120, -80, 30], v = [15, -22, 8], h = 1e-4, p0 = galRide(d, v, 0), a = galRide(d, v, h), b = galRide(d, v, -h), der = [0, 1, 2].map(i => (a[i] - b[i]) / (2 * h) / P.KMS);
    const lin = d.map((x, i) => x + v[i] * P.KMS * 0.1), r = galRide(d, v, 0.1), e0 = Math.max(...p0.map((x, i) => Math.abs(x - d[i]))), e1 = Math.max(...der.map((x, i) => Math.abs(x - v[i]))), e2 = Math.max(...r.map((x, i) => Math.abs(x - lin[i])));
    ok('exact at J2000: the ridden position is the catalogue position (1e-9 pc), its derivative the catalogue velocity (1e-6 km/s), and over 0.1 Myr it is the straight line to 0.01 pc', e0 < 1e-9 && e1 < 1e-6 && e2 < 0.01, `position ${e0.toExponential(1)} · velocity ${e1.toExponential(1)} · 0.1 Myr vs line ${e2.toFixed(4)} pc`); }

  /* 3 · the invariants of Hill's equations and the epicycle period */
  { const st = [220, 35, -25, 6, -9, 3], dt = 1e-3, D = t => { const a = galHill(...st, t + dt, P), b = galHill(...st, t - dt, P), c = galHill(...st, t, P); return { x: c, v: [0, 1, 2].map(i => (a[i] - b[i]) / (2 * dt)) }; };
    const inv = t => { const { x, v } = D(t); return [0.5 * (v[0] ** 2 + v[1] ** 2) - 2 * P.Om * P.A * x[0] ** 2, v[1] + 2 * P.Om * x[0], 0.5 * v[2] ** 2 + 0.5 * P.nu ** 2 * x[2] ** 2]; };
    const I0 = inv(0), drift = [37, 180, 911, 4000].map(t => inv(t).map((q, i) => Math.abs(q / I0[i] - 1))).flat(), kap = Math.sqrt(4 * P.Om * (P.Om - P.A));
    const X = t => galHill(...st, t, P)[0], Xg = (2 * P.Om * st[4] + 4 * P.Om * P.Om * st[0]) / kap ** 2; const z = []; for (let t = 0.05; t < 2000; t += 0.05) if ((X(t - 0.05) - Xg) * (X(t) - Xg) < 0) z.push(t);
    const per = 2 * (z[z.length - 1] - z[0]) / (z.length - 1), want = 2 * Math.PI / kap;
    ok('the invariants of Hill\'s equations hold along the closed form for 4 Gyr — the Jacobi integral ½(ẋ²+ẏ²) − 2ΩAx², the guiding-centre momentum ẏ + 2Ωx, the vertical energy — and the epicycle period is 2π/κ, κ² = 4Ω(Ω − A)',
      Math.max(...drift) < 1e-6 && Math.abs(per / want - 1) < 1e-3, `max relative drift ${Math.max(...drift).toExponential(1)} · epicycle ${per.toFixed(2)} Myr against 2π/κ = ${want.toFixed(2)} (κ/Ω = ${(kap / P.Om).toFixed(3)})`); }

  /* 4 · the sense of rotation */
  { const q = 230 / 4, g = galRideHalo([P.R0, 0, 0], q, P), l = ((Math.atan2(g[1], g[0]) * 180 / Math.PI) + 360) % 360;
    ok('the sense of rotation: a quarter galactic year on, the Galactic centre is seen toward l = 270° (within the Sun\'s own epicycle), and the frame angle is negative for positive time', Math.abs(l - 270) < 6 && galFrameAngle(1e6 * 365.2425) < 0, `centre at l = ${l.toFixed(2)}° · frame angle after 1 Myr ${galFrameAngle(1e6 * 365.2425).toExponential(3)} rad`); }

  /* 5 · circular orbits stay circular */
  { const d = [300, 400, 0], v = galCircularVel(d, P), R0 = Math.hypot(P.R0 - 300, 400);
    const dev = Math.max(...[50, 230, 1000, 2500, 5000].map(t => { const p = galRide(d, v, t, P), gc = galRideHalo([P.R0, 0, 0], t, P); return Math.abs(Math.hypot(p[0] - gc[0], p[1] - gc[1]) / R0 - 1); }));
    ok('a disc object put on its circular orbit keeps its galactocentric radius to 1 % for five gigayears', dev < 0.01, `worst ${(100 * dev).toFixed(2)} %`); }

  /* 6 · the A it rides on is the A it measures: the Ogorodnikov–Milne fit on the embedded Hipparcos binary, run here */
  { const m = SRC.match(/const HCC_SKY_HIP=\{count:(\d+),vlim:7,rec:(\d+),[\s\S]*?b64:'([^']+)'/), n = +m[1], rec = +m[2], buf = Buffer.from(m[3], 'base64'), S = [];
    for (let i = 0; i < n; i++) { const o = i * rec; S.push({ hip: buf.readUInt32LE(o), ra: buf.readUInt32LE(o + 4) / 4294967296 * 360, de: buf.readInt32LE(o + 8) / 1e7, plx: buf.readUInt32LE(o + 16) / 100, eplx: buf.readUInt16LE(o + 20) / 1000, pmra: buf.readInt32LE(o + 22) / 100, pmde: buf.readInt32LE(o + 26) / 100 }); }
    const F = K.statOortFit(S.filter(s => s.plx > 0 && s.eplx > 0 && s.plx / s.eplx >= 5 && 1 / s.plx <= 1).map(K.statGalRow), { boot: 0 }), Aride = P.A / 1.0227121650537077e-3;
    ok('the Oort constant A the stars ride on is the one the atlas measures from its own Hipparcos proper motions, to 0.01 km/s/kpc', Math.abs(Aride - F.A) < 0.01, `ride ${Aride.toFixed(3)} · measured ${F.A.toFixed(3)} km/s/kpc`); }

  /* 7 · wiring */
  ok('the wiring: the disc turns by galFrameAngle, the Hipparcos stars, the named stars, the nebulae and clusters and the arm tracers ride, and the page tests the sense of rotation',
    /const galTheta = galFrameAngle\(state\.epochDays\);/.test(SRC) && /function galSpinQuat\(out\)\{ const th=galFrameAngle\(state\.epochDays\);/.test(SRC) && /const r=hip3dRide\(s\), e=galRideEq\(r\.p,r\.v,epJ,null\)/.test(SRC)
    && /if\(Math\.abs\(epJ-2000\)>2000\)\{ const a=zod3dStateLinear\(s,2000\)/.test(SRC) && /try\{ dsoLocalPlace\(2000\+/.test(SRC) && /galRideLayer\(mwtObjs\.ride,mwtObjs\.pts,ep\)/.test(SRC) && /Galactic rotation sense: a quarter galactic year on/.test(SRC));

  /* 8 · mutations */
  { const src = galFrameAngle.toString(), mut = new Function('GAL_YEAR_MYR', 'return ' + src.replace('return -2*Math.PI', 'return 2*Math.PI'))(230);
    const d0 = [-Math.cos(0), 0], a = mut(230e6 * 365.2425 / 4), gx = Math.cos(a), gy = Math.sin(a), l = ((Math.atan2(gy, gx) * 180 / Math.PI) + 360) % 360;
    ok('MUTATION — the frame turned the old way puts the centre toward l = 90° a quarter year on, caught', src.includes('return -2*Math.PI') && Math.abs(l - 90) < 1, `l = ${l.toFixed(1)}°`); }
  { const src = K.galRingOf.toString(), cut = 'return [R*Math.cos(f), R*Math.sin(f), q[2]]'; const ring = new Function('return ' + src.replace(cut, 'return [R, q[1], q[2]]'))();
    const mut = new Function('galSunVel', 'galPolarState', 'galRingOf', 'galHill', 'GAL_RIDE', 'return ' + galRide.toString())(K.galSunVel, K.galPolarState, ring, galHill, P);
    const mutH = new Function('galSunVel', 'galPolarState', 'galRingOf', 'galHill', 'GAL_RIDE', 'return ' + galRideHalo.toString())(K.galSunVel, K.galPolarState, ring, galHill, P);
    const d = [300, 400, 0], v = galCircularVel(d, P), R0 = Math.hypot(P.R0 - 300, 400), p = mut(d, v, 1000, P), gc = mutH([P.R0, 0, 0], 1000, P), dev = Math.abs(Math.hypot(p[0] - gc[0], p[1] - gc[1]) / R0 - 1);
    ok('MUTATION — guiding centres carried on the tangent line instead of the circle let a circular orbit wander more than 10 % off its radius in a gigayear, caught', src.includes(cut) && dev > 0.1, `${(100 * dev).toFixed(0)} % off`); }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
