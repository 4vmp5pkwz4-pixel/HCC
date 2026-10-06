#!/usr/bin/env node
'use strict';
/* ══ THE HORIZONS FOLLOW THE CLOCK (v4.358) ══════════════════════════════════════════════════════════════════════
 * Reported: the light sphere does not grow when the time machine runs, forward or back. Checked on the kernels
 * (core/atlas/extracted.mjs) and on the wiring:
 *   1. today the chain returns the atlas's own numbers: t₀, χ to last scattering 45.12 Gly, the particle horizon
 *   2. back toward the Big Bang the particle horizon shrinks monotonically to zero; before t = 0 nothing is defined
 *   3. forward it grows monotonically toward χ_p(∞) while the event horizon shrinks to zero: χ_p + χ_e = χ_p(∞) always
 *   4. at the clock's extremes (±2.4×10¹³ yr) every value is finite; the radiation-era start and the Λ tail join
 *      the table continuously; the inverse map returns the time
 *   5. screens of events (last scattering, equality, acceleration onset) exist only after their events, at
 *      χ_p(t) − χ_p(t_E); the emission time on the observer's light cone closes χ_p(t) − χ_p(t_E) = χ
 *   6. wired: both modes tick the horizons every frame, every horizon shell and the colour-of-time disc follow
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { hzTable, hzAgeAtA, hzAtT, hzTimeAtParticle, hzEmissionTime, hzScreenAt, HZ_EVENTS, CT_T0, ctChiOfZ } = K;
  const t0 = hzAgeAtA(1), h0 = hzAtT(t0), H = hzTable();
  ok('today the chain is the atlas’s own: t₀ agrees with the distance chain, χ to last scattering is 45.12 Gly, the particle horizon 46.0 Gly, the event horizon 16.3 Gly',
    Math.abs(t0 - CT_T0()) < 2e-3 && Math.abs(hzScreenAt(t0, HZ_EVENTS.lss) - ctChiOfZ(1090.9 - 1)) < 0.02 && Math.abs(h0.particle - 46.03) < 0.05 && Math.abs(h0.event - 16.34) < 0.05 && Math.abs(h0.a - 1) < 1e-6,
    `t₀ ${t0.toFixed(4)} Gyr · χ_LSS ${hzScreenAt(t0, HZ_EVENTS.lss).toFixed(3)} · χ_p ${h0.particle.toFixed(3)} · χ_e ${h0.event.toFixed(3)} Gly`);
  { const ts = [1e-12, 1e-9, 1e-6, 0.38e-3, 1e-3, 0.1, 1, 5, 10, t0], ps = ts.map(t => hzAtT(t).particle); let mono = true; for (let i = 1; i < ps.length; i++) mono = mono && ps[i] > ps[i - 1];
    ok('back toward the Big Bang the particle horizon shrinks monotonically to zero, and before t = 0 nothing is defined', mono && ps[0] < 1e-3 && hzAtT(0) === null && hzAtT(-5) === null, ps.map(p => p.toPrecision(3)).join(' → ') + ' Gly'); }
  { const ts = [t0, 20, 50, 100, 1e3, 1e4, 2.4e4], hs = ts.map(t => hzAtT(t)); let mono = true, sum = 0; for (let i = 1; i < hs.length; i++) mono = mono && hs[i].particle >= hs[i - 1].particle && hs[i].event <= hs[i - 1].event; for (const h of hs) sum = Math.max(sum, Math.abs(h.particle + h.event - H.Pinf));
    ok('forward the particle horizon grows toward its limit χ_p(∞) and the event horizon shrinks to zero — their sum is χ_p(∞) at every time', mono && sum < 1e-9 && hs[hs.length - 1].event < 1e-9 && Math.abs(hs[hs.length - 1].particle - H.Pinf) < 1e-9, `χ_p(∞) = ${H.Pinf.toFixed(3)} Gly · +50 Gyr χ_e ${hzAtT(t0 + 50).event.toFixed(3)} Gly`); }
  { const ext = [t0 + 2.4e4, 1e-9, 1e-12].map(hzAtT), fin = ext.every(h => h && Number.isFinite(h.particle) && Number.isFinite(h.event) && Number.isFinite(h.lnA));
    const T0 = H.T[0], Tn = H.T[H.n], jumpLo = Math.abs(hzAtT(T0 * (1 - 1e-9)).particle - hzAtT(T0 * (1 + 1e-9)).particle) / hzAtT(T0).particle, jumpHi = Math.abs(hzAtT(Tn - 1e-6).particle - hzAtT(Tn + 1e-6).particle);
    let inv = 0; for (const t of [1e-7, 0.3, 4, 13.7, 40, 300]) inv = Math.max(inv, Math.abs(hzTimeAtParticle(hzAtT(t).particle) - t) / t);
    ok('at the clock’s extremes every value is finite; the radiation-era start and the Λ tail join the table continuously; the inverse map returns the time', fin && jumpLo < 1e-6 && jumpHi < 1e-6 && inv < 1e-6, `joins ${jumpLo.toExponential(1)} / ${jumpHi.toExponential(1)} · inverse ${inv.toExponential(1)}`); }
  { const tdec = hzAgeAtA(HZ_EVENTS.lss); let lc = 0; for (const [c, dt] of [[5, 0], [20, 2e9], [30, -5e9], [40, 2e10]]) { const tE = hzEmissionTime(c, dt), t = t0 + dt / 1e9; lc = Math.max(lc, Math.abs(hzAtT(t).particle - hzAtT(tE).particle - c)); }
    ok('screens of events exist only after the events, at χ_p(t) − χ_p(t_E); on the observer’s light cone χ_p(t) − χ_p(t_E) = χ', hzScreenAt(tdec * 0.5, HZ_EVENTS.lss) === null && hzScreenAt(t0 + 50, HZ_EVENTS.lss) > hzScreenAt(t0, HZ_EVENTS.lss) && lc < 1e-9, `light-cone closure ${lc.toExponential(1)} · last scattering at t = ${(tdec * 1e3).toFixed(4)} Myr`); }
  { const wired = /try\{ hccHorizonsTick\(dt\); \}catch\(e\)\{\}/.test(SRC) && /const HZ=hccHorizonsTick\(dt\), hzH=HZ&&HZ\.h;/.test(SRC) && /hzScaleSphere\(sphPH,rP,/.test(SRC) && /hzScaleSphere\(sphLSS,/.test(SRC) && /hzScaleSphere\(sphEvent,rE,/.test(SRC) && /hzScaleSphere\(ob\.g,rP,/.test(SRC) && /hzScaleSphere\(hub\.g,rH,/.test(SRC)
      && /if\(CT_VIEW\.mesh\) CT_VIEW\.mesh\.scale\.setScalar\(chiMax\); \}/.test(SRC) && /S\.gone=!\(k>0\);/.test(SRC);
    ok('wired: the Observable and the Solar modes tick the horizons every frame; the particle horizon, light-age, last-scattering, event, equality and acceleration screens, the Hubble sphere and the colour-of-time disc with its epoch rings all follow the clock', wired); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
