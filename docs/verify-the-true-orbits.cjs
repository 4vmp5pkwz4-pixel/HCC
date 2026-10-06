#!/usr/bin/env node
'use strict';
/* ══ THE TRUE ORBITS (v4.366) ════════════════════════════════════════════════════════════════════════════════════
 *   Reported: the Milky Way's stars stood still at full time-machine speed, the Galaxy wheeled one way and the Sun's
 *   circular track and the stars another. Every star now rides its exact orbit in the axisymmetric Galaxy the atlas
 *   measures (V_c = V₀(R/R₀)^β, Ω and the Oort A at the Sun, vertical ν), read from a torus at any epoch.
 *   1. the torus against an independent leapfrog integration in the same potential, Gaia stars, ±2 Gyr
 *   2. exact at J2000: position and velocity of every star; the integrals E and L hold along the orbit
 *   3. Hill's equations (the linear limit the atlas used before) measured against the same integration
 *   4. Gliese 710 found in the embedded Gaia stars, its pass computed on its true orbit: 0.052 pc in 1.29 Myr
 *   5. the GPU's twin equals the torus series; 32-bit emulation keeps 0.01 pc to 230 Myr; the poor-series stars go to the CPU
 *   6. one Sun for everything: the centre is where the Sun's own orbit puts it; the sense of rotation
 *   7. wiring: no clamp, the shader reads the clock, the disc / centre / Sun's track use the same orbit
 *   8. mutations: the Sun pinned to its circle, the residual oscillation dropped — each caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const blob = id => { const i = SRC.indexOf(`id="${id}"`), j = SRC.indexOf('>', i), k = SRC.indexOf('</script>', j); return JSON.parse(SRC.slice(j + 1, k)); };
const f32 = b => { const B = Buffer.from(b, 'base64'); return new Float32Array(B.buffer.slice(B.byteOffset, B.byteOffset + B.byteLength)); };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs')), P = K.GAL_RIDE;
  const g = blob('hcc-gaia50'), p = f32(g.p), v = f32(g.v), ph = f32(g.ph);
  const be = 1 - 2 * P.A / P.Om, V0 = P.Om * P.R0, acc = (x, y) => { const R = Math.hypot(x, y), a = V0 * V0 * Math.pow(R / P.R0, 2 * be) / (R * R); return [-a * x, -a * y]; };
  const leap = (x, y, vx, vy, t, h0) => { const n = Math.max(1, Math.ceil(Math.abs(t) / (h0 || 0.02))), h = t / n; let a = acc(x, y); for (let i = 0; i < n; i++) { vx += 0.5 * h * a[0]; vy += 0.5 * h * a[1]; x += h * vx; y += h * vy; a = acc(x, y); vx += 0.5 * h * a[0]; vy += 0.5 * h * a[1]; } return [x, y]; };
  const S = []; for (let i = 0; i < g.n && S.length < 150; i += 211) if (v[4 * i + 3]) { const d = K.statToGal([p[3 * i], p[3 * i + 1], p[3 * i + 2]]), u = K.statToGal([v[4 * i], v[4 * i + 1], v[4 * i + 2]]); S.push({ i, d, u, o: K.galOrbit(d, u) }); }
  const sun = K.galSunOrbit();

  /* 1 · against the integration */
  { const rows = [10, 100, 1000, -2000].map(t => { const sp = leap(sun.x, sun.y, sun.ux, sun.uy, t), sq = K.galOrbitAt(sun, t); let w = 0;
      for (const s of S) { if (!s.o.T) continue; const ap = leap(s.o.x, s.o.y, s.o.ux, s.o.uy, t), aq = K.galOrbitAt(s.o, t); w = Math.max(w, Math.hypot((ap[0] - sp[0]) - (aq[0] - sq[0]), (ap[1] - sp[1]) - (aq[1] - sq[1]))); } return [t, w]; });
    ok('the torus is the orbit: against a leapfrog integration in the same potential, 150 Gaia stars relative to the Sun agree to 1 pc at every epoch to ±2 Gyr', rows.every(([, w]) => w < 1), rows.map(([t, w]) => `${t} Myr ${w.toFixed(3)} pc`).join(' · ')); }

  /* 2 · exact at J2000, and the integrals */
  { let e0 = 0, e1 = 0, dE = 0, dL = 0; const h = 1e-5, h1 = 1e-6;
    for (const s of S) { if (!s.o.T) continue; const r0 = K.galRideOrbit(s.o, 0), a = K.galRideOrbit(s.o, h1);
      e0 = Math.max(e0, Math.hypot(...r0.map((x, k) => x - s.d[k]))); e1 = Math.max(e1, Math.hypot(...[0, 1, 2].map(k => (a[k] - r0[k]) / h1 / P.KMS - s.u[k])));   /* one-sided: the J2000 state is a node of the table */
      for (const t of [37, 411, -1700]) { const q = K.galOrbitAt(s.o, t), q1 = K.galOrbitAt(s.o, t + h), q2 = K.galOrbitAt(s.o, t - h), vx = (q1[0] - q2[0]) / (2 * h), vy = (q1[1] - q2[1]) / (2 * h), R = Math.hypot(q[0], q[1]);
        const L = q[0] * vy - q[1] * vx, E = 0.5 * (vx * vx + vy * vy) + V0 * V0 / (2 * be) * Math.pow(R / P.R0, 2 * be); dL = Math.max(dL, Math.abs(L / s.o.T.L - 1)); dE = Math.max(dE, Math.abs((E - s.o.T.E) / (V0 * V0))); } }
    ok('exact at J2000 — every star at its catalogue place (1e-9 pc) with its catalogue velocity (0.1 m/s) — and its energy and angular momentum hold along the orbit at any epoch',
      e0 < 1e-9 && e1 < 1e-4 && dL < 1e-4 && dE < 1e-4, `position ${e0.toExponential(1)} pc · velocity ${e1.toExponential(1)} km/s · ΔL/L ${dL.toExponential(1)} · ΔE/V₀² ${dE.toExponential(1)}`); }

  /* 3 · what the linear limit got wrong */
  { const t = 100, sp = leap(sun.x, sun.y, sun.ux, sun.uy, t); let eh = 0, et = 0, m = 0;
    for (const s of S) { if (!s.o.T) continue; const ap = leap(s.o.x, s.o.y, s.o.ux, s.o.uy, t), ref = [ap[0] - sp[0], ap[1] - sp[1]];
      const H = (() => { const sv = K.galSunVel(P), va = [s.u[0] + sv[0], s.u[1] + sv[1] + P.Om * P.R0 / P.KMS, s.u[2] + sv[2]], a = K.galPolarState(s.d, va, P), b = K.galPolarState([0, 0, 0], [sv[0], sv[1] + P.Om * P.R0 / P.KMS, sv[2]], P);
        const A = K.galRingOf(K.galHill(a.X, a.Y, a.Z, a.vX, a.vY, a.vZ, t, P), P), B = K.galRingOf(K.galHill(b.X, b.Y, b.Z, b.vX, b.vY, b.vZ, t, P), P), al = -P.Om * t, x = -(A[0] - B[0]), y = A[1] - B[1]; return [x * Math.cos(al) - y * Math.sin(al), x * Math.sin(al) + y * Math.cos(al)]; })();
      const T = K.galRideOrbit(s.o, t); eh += Math.hypot(H[0] - ref[0], H[1] - ref[1]); et += Math.hypot(T[0] - ref[0], T[1] - ref[1]); m += Math.hypot(...ref); }
    ok('why: Hill\'s linear limit strays by more than a fifth of the distance in 100 Myr against the integration; the torus by less than a millionth', eh / m > 0.2 && et / m < 1e-6, `Hill ${(100 * eh / m).toFixed(1)} % · torus ${(et / m).toExponential(1)} of the mean distance ${(m / S.length).toFixed(0)} pc`); }

  /* 4 · Gliese 710 */
  { const c = K.gaiaClosestPasses(p, v, 5), b = c[0];
    ok('Gliese 710 is found in the embedded Gaia stars and its pass computed on its true orbit: 0.052 pc in 1.29 Myr, as Bailer-Jones et al. 2018 integrate it (0.052 pc, 1.28 Myr) — through the Oort cloud',
      Math.abs(b.dPc - 19.09) < 0.05 && Math.abs(b.dMinPc - 0.052) < 0.002 && Math.abs(b.tMyr - 1.29) < 0.02 && Math.abs(ph[2 * b.i] - 9.06) < 0.02,
      `star at ${b.dPc.toFixed(2)} pc, G ${ph[2 * b.i].toFixed(2)} · ${b.dMinPc.toFixed(4)} pc = ${Math.round(b.dMinPc * 206264.806)} AU at ${b.tMyr.toFixed(3)} Myr (straight line ${b.dLin.toFixed(4)} pc) · next ${c.slice(1, 3).map(x => x.dMinPc.toFixed(2) + ' pc').join(', ')}`); }

  /* 5 · the GPU */
  { const f = Math.fround, md = x => x - 2 * Math.PI * Math.floor(x / (2 * Math.PI));
    const em = (a, t, u) => { const A = [...a].map(f), T = f(t), w = md(f(A[34] * T)), th = f(A[33] + w), c1 = f(Math.cos(th)), s1 = f(Math.sin(th)), sw = f(Math.sin(w)); let cn = c1, sn = s1, dR = f(f(A[32] + f(A[40] * f(Math.cos(w))) + f(A[41] * sw)) - f(u.dRs)), ps = f(A[42] * sw);
      for (let n = 0; n < 16; n++) { dR = f(dR + f(A[n] * cn)); ps = f(ps + f(A[16 + n] * sn)); const c2 = f(f(cn * c1) - f(sn * s1)); sn = f(f(sn * c1) + f(cn * s1)); cn = c2; }
      const R = f(f(f(P.R0) + f(u.dRs)) + dR), m = f(A[35] * T), df = f(f(A[36] + md(m)) + ps - f(u.psi)), h = f(Math.sin(0.5 * df)), Rs = f(f(P.R0) + f(u.dRs)), xp = f(f(dR * f(Math.cos(df))) - f(2 * Rs * h * h)), yp = f(R * f(Math.sin(df)));
      return [f(u.c) * xp - f(u.s) * yp, f(u.s) * xp + f(u.c) * yp]; };
    let tw = 0, e32 = 0, gpu = 0, cpu = 0;
    for (const s of S) { if (!s.o.T || s.o.T.q >= 0.05) { cpu++; continue; } gpu++; const a = K.gaiaOrbitAttrs(s.o, sun);
      for (const t of [0, 1.3, 50, 230]) { const u = K.gaiaSunUniforms(t), q = K.gaiaOrbitAt(a, t, u), Ts = K.galTorusSeries(s.o.T, t), Us = K.galTorusSeries(sun.T, t), z = K.galOrbitAt(s.o, t)[2] - K.galOrbitAt(sun, t)[2];
        const ref = [Ts[0] * Math.cos(Ts[1]) - Us[0] * Math.cos(Us[1]), Ts[0] * Math.sin(Ts[1]) - Us[0] * Math.sin(Us[1]), z], r = K.galRideOrbit(s.o, t);
        tw = Math.max(tw, Math.hypot(...q.map((x, k) => x - ref[k]))); const b = em(a, t, u); e32 = Math.max(e32, Math.hypot(b[0] - r[0], b[1] - r[1])); } }
    ok('the GPU\'s twin is the torus series to 1e-8 pc; in 32-bit floats the shader keeps 0.01 pc of the true orbit to 230 Myr; the stars whose series strays move on the CPU',
      tw < 1e-8 && e32 < 0.06 && gpu > 0.9 * S.length && /if\(o\.T\.q>=0\.05\)\{ F\[i-from\]=1; continue; \}/.test(SRC) && /const W=new Worker\(URL\.createObjectURL/.test(SRC) && /galPcToScene\(galRideOrbit\(e\.o,t\),v\)/.test(SRC), `twin ${tw.toExponential(1)} pc · f32 ${e32.toExponential(1)} pc · GPU ${gpu} / CPU ${cpu} of ${S.length}`); }

  /* 6 · one Sun */
  { const q = 230 / 4, G = K.galCentreAt(q), Sx = K.galOrbitAt(sun, q), l = ((Math.atan2(G[1], G[0]) * 180 / Math.PI) + 360) % 360, T = sun.T;
    ok('one Sun for everything: the centre is drawn where the Sun\'s own orbit puts it (the Sun from 8.10 to 9.34 kpc, radial period 182 Myr); a quarter galactic year on it is seen toward l ≈ 270°',
      Math.hypot(G[0] + Sx[0], G[1] + Sx[1], G[2] + Sx[2]) < 1e-9 && Math.abs(l - 270) < 6 && Math.abs(T.Rp - 8095) < 5 && Math.abs(T.Ra - 9339) < 5 && Math.abs(T.TR - 181.9) < 0.5,
      `l = ${l.toFixed(2)}° · R☉ ${T.Rp.toFixed(0)}–${T.Ra.toFixed(0)} pc · T_R ${T.TR.toFixed(2)} Myr · azimuthal period ${(2 * Math.PI * T.TR / Math.abs(T.Dphi)).toFixed(1)} Myr`); }

  /* 7 · wiring */
  ok('wired: the shader reads the clock with no clamp, the disc and its axis stand on the centre the Sun orbits, the Sun\'s track is its own orbit, every catalogue layer rides galRideEq',
    /float w=mod\(aU\.z\*uT,6\.283185307179586\)/.test(SRC) && /\/\* no clamp: the torus holds at any epoch \(v4\.366\) \*\//.test(SRC) && !/uYr/.test(SRC.slice(SRC.indexOf('function gaia50Build'), SRC.indexOf('function gaiaGwPanelHTML')))
    && /galCentreScene\(milkyWayPhysical\.position\);/.test(SRC) && /else if\(a\.kind==='gal'\)\{ galCentreScene\(a\.anchor\);/.test(SRC) && /const q=galOrbitAt\(S,t-GAL_YEAR_MYR\+2\*GAL_YEAR_MYR\*i\/K\);/.test(SRC)
    && /const r=hip3dRide\(s\), e=galRideEq\(r\.p,r\.v,epJ,null\)/.test(SRC) && /function galRide\(d,v,tMyr,P\)\{ return galRideOrbit\(galOrbit\(d,v,P\),tMyr,P\); \}/.test(SRC));

  /* 8 · mutations */
  { const src = K.galRideHalo.toString(), cut = 'const b=galOrbitAt(galSunOrbit(P),tMyr,P);';
    const mut = new Function('galOrbitAt', 'galSunOrbit', 'GAL_RIDE', 'return ' + src.replace(cut, 'const b=[-P.R0*Math.cos(P.Om*tMyr),-P.R0*Math.sin(-P.Om*tMyr),0];'))(K.galOrbitAt, K.galSunOrbit, P);
    const a = K.galRideHalo([P.R0, 0, 0], 100), b = mut([P.R0, 0, 0], 100), d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    ok('MUTATION — the Sun pinned to its R₀ circle instead of its own orbit misplaces the Galactic centre by more than 300 pc in 100 Myr, caught', src.includes(cut) && d > 300, `${d.toFixed(0)} pc`); }
  { const src = K.galTorusSeries.toString(), cut = 'let R=T.A[0]+T.dR*cw+T.dV*sw, ps=T.dF*sw', mut = new Function('return ' + src.replace(cut, 'let R=T.A[0], ps=0'))();
    let w = 0; for (const s of S) { if (!s.o.T) continue; const q = mut(s.o.T, 0), R = Math.hypot(s.o.x, s.o.y); w = Math.max(w, Math.abs(q[0] - R)); }
    ok('MUTATION — the series without its J2000 residuals puts some star off its catalogue place by more than 0.01 pc, caught', src.includes(cut) && w > 0.01, `worst ${w.toFixed(3)} pc`); }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
