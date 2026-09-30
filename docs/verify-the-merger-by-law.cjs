#!/usr/bin/env node
'use strict';
/* ══ THE MERGER BY LAW, STARS THAT TURN, AND THE HORIZONS AS SPHERES (v4.350) ═══════════════════════════════════════
 * Reported: at the highest playback rates the rotation of the galactic masses looked wrong; the merger could not be
 * waited for; the black holes did not follow the laboratory's laws; the light and other horizon spheres had been
 * removed although they are the reader's orientation in the topology of the three-sphere. Checked on the kernels:
 *   1. the black-hole pair by law: dynamical friction to the hard radius a_h = Gμ/4σ², stellar hardening
 *      d(1/a)/dt = HGρ/σ to the gravitational-wave radius, Peters' GW decay to the innermost orbit — continuous,
 *      monotone, each stage obeying its own equation; then the remnant and its recoil (bbhBudget)
 *   2. stars that turn: frames tens of Myr apart are joined by rotating each star about its host by the angle it
 *      swept (geometric angle + whole turns from Ω = v_c(r)/r), not by a chord through the centre — exact for
 *      circular orbits, including more than one turn between frames
 *   3. the merger reachable: the collision integrated to just past the coalescence (≤ 30 Gyr), a director that slows
 *      the clock logarithmically as the merger nears, in the Solar world and in the laboratory
 *   4. the horizons back as spheres with a glowing limb: Hubble sphere c/H₀, the cosmic event horizon, the particle
 *      horizon, the epoch shells with the last-scattering (Silk / Navier–Stokes) note — and alias honesty in the discs
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  /* 1 · the pair by law */
  { const P = K.lgmBinaryPlan(4.15e6, 1.4e8), Myr = x => x * 0.9778, T = K.LGM_BIN.PcKmsYr;
    const ts = [], N = 4000, tot = P.tMergeYr; for (let i = 0; i <= N; i++) ts.push(tot * Math.pow(i / N, 0.35));
    const S = ts.map(t => K.lgmBinaryAt(P, t)); let mono = true, phiUp = true, order = true; const rank = { friction: 0, hardening: 1, gw: 2, merged: 3 };
    for (let i = 1; i < S.length; i++) { if (S[i].aPc > S[i - 1].aPc * (1 + 1e-9)) mono = false; if (S[i].phi < S[i - 1].phi - 1e-9) phiUp = false; if (rank[S[i].stage] < rank[S[i - 1].stage]) order = false; }
    const at = t => K.lgmBinaryAt(P, t), e = 1e-5, b1 = P.tFr * T, b2 = (P.tFr + P.tHard) * T;
    const jump1 = Math.abs(at(b1 - e).aPc - at(b1 + e).aPc) / P.aH, jump2 = Math.abs(at(b2 - e).aPc - at(b2 + e).aPc) / P.aGW;
    const uH = b1 + 0.5 * P.tHard * T, dInv = (1 / at(uH + 1e3).aPc - 1 / at(uH - 1e3).aPc) / (2e3 / T), hardOK = Math.abs(dInv / P.K - 1) < 1e-4;
    const uG = b2 + 0.5 * P.tGW * T, a = at(uG).aPc, dA = (at(uG + 10).aPc - at(uG - 10).aPc) / (20 / T), gwOK = Math.abs(dA / (-P.beta / (4 * a * a * a)) - 1) < 1e-3;
    const fr = at(0.3 * b1), frOK = Math.abs(fr.aPc - 1000 * Math.sqrt(1 - 0.3 * P.tFr / P.tDf)) < 1e-9 && fr.stage === 'friction';
    const m = at(tot + 1e5), kickOK = m.stage === 'merged' && m.kickKms > 0 && Math.abs(m.kickPc) <= m.kickKms / Math.sqrt(4 * Math.PI * K.LGM_BIN.G * P.rho / 3) + 1e-9;
    ok('the pair by law: friction to a_h = Gμ/4σ² ≈ 0.169 pc, stellar hardening d(1/a)/dt = HGρ/σ to a_GW ≈ 0.0070 pc, Peters to the innermost orbit — ~367 + 64 + 16.8 Myr; continuous, monotone, each stage its own equation; then the remnant and its recoil',
      Math.abs(P.aH - 0.169) < 0.004 && Math.abs(P.aGW - 0.0070) < 0.0003 && Math.abs(Myr(P.tFr) - 367) < 4 && Math.abs(Myr(P.tHard) - 64) < 2 && Math.abs(Myr(P.tGW) - 16.8) < 0.4 && Math.abs(tot / 1e6 - 448.6) < 3
      && mono && phiUp && order && jump1 < 1e-5 && jump2 < 1e-5 && hardOK && gwOK && frOK && kickOK,
      `a_h ${P.aH.toFixed(3)} pc · a_GW ${P.aGW.toFixed(4)} pc · a_isco ${P.aIsco.toExponential(2)} pc · ${Myr(P.tFr).toFixed(0)} + ${Myr(P.tHard).toFixed(1)} + ${Myr(P.tGW).toFixed(1)} Myr = ${(tot / 1e6).toFixed(1)} Myr · kick ${m.kickKms.toFixed(0)} km/s`); }
  /* 2 · stars that turn */
  { const v = 220, T = { v: new Float64Array(96).fill(v), lo: Math.log(0.05), hi: Math.log(400) }, dt = 0.03, n = [0, 0, 1];
    const radii = [0.6, 1.5, 3, 6, 9, 14, 20], Nst = radii.length, F0 = new Float32Array(Nst * 3), F1 = new Float32Array(Nst * 3), out = new Float32Array(Nst * 3);
    const cA = { A: [0, 0, 0], B: [800, 0, 0] }, ph0 = radii.map((r, i) => i * 0.9);
    radii.forEach((r, i) => { const om = v / r / 0.9778; F0.set([r * Math.cos(ph0[i]), r * Math.sin(ph0[i]), 0], i * 3); F1.set([r * Math.cos(ph0[i] + om * dt), r * Math.sin(ph0[i] + om * dt), 0], i * 3); });
    let worst = 0, chord = 0, turns = 0;
    for (const w of [0.25, 0.5, 0.75]) { K.lgmInterpStars(F0, F1, cA, cA, w, dt, Nst, [T, T], [n, n], out);
      radii.forEach((r, i) => { const om = v / r / 0.9778, ex = [r * Math.cos(ph0[i] + om * dt * w), r * Math.sin(ph0[i] + om * dt * w)];
        worst = Math.max(worst, Math.hypot(out[i * 3] - ex[0], out[i * 3 + 1] - ex[1], out[i * 3 + 2]));
        chord = Math.max(chord, Math.hypot(F0[i * 3] * (1 - w) + F1[i * 3] * w - ex[0], F0[i * 3 + 1] * (1 - w) + F1[i * 3 + 1] * w - ex[1])); turns = Math.max(turns, om * dt / (2 * Math.PI)); }); }
    ok('stars that turn: each star rotates about its host by the angle it swept (geometric angle + whole turns from Ω = v_c/r), exact for circular orbits up to several turns between frames, where the old chord cut through the centre',
      worst < 2e-4 && chord > 1 && turns > 1.5 && /lgmInterpStars\(F0,F1,c0,c1,w,S\.dt,N,S\.tabs,S\.normals,S\.tmp\)/.test(SRC) && /lgmInterpStars\(F0,F1,c0,c1,w,O\.dtG\|\|0\.02,O\.N,O\.tabs,O\.normals,O\.tmp\)/.test(SRC)
      && /float tpf=abs\(om-uFrame\)\*uDt\/6\.2831853; lum\*=1\.0-0\.9\*smoothstep\(0\.2,0\.45,tpf\);/.test(SRC),
      `turned-arc error ≤ ${worst.toExponential(1)} kpc vs chord error ${chord.toFixed(1)} kpc · up to ${turns.toFixed(1)} turns between frames`); }
  /* 3 · the merger reachable */
  { const G = K.lgmGeometry(), o = K.lgmOrbit({ vTan: 57, dKpc: G.dKpc, tGyr: 30, dtMyr: 1, outMyr: 50 }), c = o.coalescedGyr;
    ok('the merger reachable: today’s orbit coalesces at ~+27.5 Gyr (inside the 30-Gyr horizon), the Solar world and the laboratory both run to it and a director slows the clock logarithmically to the last orbit, the kick and the wave front',
      c != null && Math.abs(c - 27.53) < 0.1 && /S\.tEnd=S\.coal!=null\?Math\.min\(30,S\.coal\+0\.8\):14;/.test(SRC) && /O\.tEnd=cq!=null\?Math\.min\(30,cq\+0\.8\):14;/.test(SRC)
      && /if\(left>0\) ypsec=Math\.max\(0\.5,Math\.min\(1e9,left\/2\)\);/.test(SRC) && /if\(left>0\) state\.lgmSpeed=Math\.max\(1e-8,Math\.min\(0\.35,left\/2\)\);/.test(SRC)
      && /watchMerger:\(\)=>solarMergerWatch\(\)/.test(SRC) && /id="lgmMerger"/.test(SRC) && /O\.director=true; buildCtl\(\);/.test(SRC) && /const Bn=lgmBinaryAt\(S\.bin,\(tGyr-S\.coal\)\*1e9\); S\.binNow=Bn;/.test(SRC),
      `coalescence +${c && c.toFixed(2)} Gyr → merger +${c && (c + K.lgmBinaryPlan(4.15e6, 1.4e8).tMergeYr / 1e9).toFixed(3)} Gyr`); }
  /* 4 · the horizons as spheres */
  { const hs = K.hccHubbleSphereGly(), eh = K.hccEventHorizonGly();
    ok('the horizons as spheres: Hubble sphere c/H₀ ≈ 14.4 Gly, cosmic event horizon ≈ 16–17 Gly (comoving), the particle horizon beyond — drawn as Fresnel shells with a glowing limb, epoch shells with the last-scattering (Silk, Navier–Stokes) note',
      hs > 13.8 && hs < 15 && eh > 15.5 && eh < 17.8 && eh > hs && /function hccShellMaterial\(col,op\)/.test(SRC) && /function hccShellMesh\(r,col,op\)/.test(SRC)
      && /mkSphere\(hccHubbleSphereGly\(\)\*GLY_AU/.test(SRC) && /mkSphere\(hccEventHorizonGly\(\)\*GLY_AU/.test(SRC) && /Navier/.test(SRC) && /Silk/.test(SRC) && /solarCosmicGrid\.add\(hccShellMesh\(r,0x7f95b5,0\.12\)\)/.test(SRC),
      `Hubble sphere ${hs.toFixed(2)} Gly · event horizon ${eh.toFixed(2)} Gly`); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
