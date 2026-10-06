#!/usr/bin/env node
'use strict';
/* ══ THE CAUSAL CALENDAR OF THE COSMIC WEB (v4.360) ══════════════════════════════════════════════════════════════
 * One fact — a radial light ray crosses comoving distance χ_p(t₂) − χ_p(t₁) between t₁ and t₂ — gives every place at
 * comoving distance χ a calendar on the atlas's clock. Checked on the kernels (core/atlas/extracted.mjs):
 *   1. SUNSET IS TWO DEADLINES AT ONCE: at t★, χ_e(t★) = χ (the last signal from here still arrives) and light that
 *      leaves χ at t★ arrives only at t = ∞ (its last event we will ever see): χ_p(∞) − χ_p(t★) = χ
 *   2. arrival and answer are additive: χ_p(arrival) − χ_p(t) = χ, χ_p(answer back) − χ_p(t) = 2χ
 *   3. the deadline to ask χ is the sunset of 2χ, exactly
 *   4. the dialogue horizon is χ_e/2 (8.17 Gly today); N = ⌊χ_e/2χ⌋: 151 exchanges with Virgo, 1 at 8 Gly, 0 beyond
 *   5. the calendar is ordered: first light grows and sunset falls with χ; the event horizon's sunset is today; the
 *      gas of the last-scattering surface will only ever be seen to ≈ 0.74 Gyr
 *   6. it follows the clock: at +50 Gyr fewer exchanges remain and the dialogue horizon has shrunk with χ_e
 *   7. wired: every structure's card (both worlds) carries its calendar, the dialogue horizon is one of the shared
 *      shells, the Horizons panel lists the web's calendar, HCC_CAUSAL and the track op answer, the ledger holds it
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { hzCausal, hzAtT, hzAgeAtA, hzTable, TRACK_OPS } = K;
  const H = hzTable(), t0 = hzAgeAtA(1), P = t => hzAtT(t).particle;
  { let e1 = 0, e2 = 0; for (const chi of [0.054, 0.65, 2.4, 8, 16.3, 30, 45]) { const C = hzCausal(chi, t0); e1 = Math.max(e1, Math.abs(hzAtT(C.sunset).event - chi)); e2 = Math.max(e2, Math.abs(H.Pinf - P(C.sunset) - chi)); }
    ok('sunset is two deadlines at once: χ_e(t★) = χ (the last signal from here arrives) and χ_p(∞) − χ_p(t★) = χ (its last event we will ever see)', e1 < 1e-6 && e2 < 1e-6, `max residuals ${e1.toExponential(1)} / ${e2.toExponential(1)} Gly`); }
  { let e = 0; for (const chi of [0.054, 0.65, 2.4, 6]) { const C = hzCausal(chi, t0); e = Math.max(e, Math.abs(P(C.arrival) - P(t0) - chi), Math.abs(P(C.replyBack) - P(t0) - 2 * chi)); }
    ok('arrival and answer are additive on the light cone: χ_p(arrival) − χ_p(now) = χ and χ_p(back) − χ_p(now) = 2χ', e < 1e-6, `max residual ${e.toExponential(1)} Gly`); }
  { let e = 0; for (const chi of [0.054, 1, 4, 12, 25]) e = Math.max(e, Math.abs(hzCausal(chi, t0).lastQuestion - hzCausal(2 * chi, t0).sunset));
    ok('the deadline to ask χ anything is the sunset of the place at 2χ', e < 1e-12, `max difference ${e.toExponential(1)} Gyr`); }
  { const d = hzCausal(1, t0).dialogue, nV = hzCausal(0.054, t0).exchanges, n8 = hzCausal(8, t0).exchanges, n9 = hzCausal(8.3, t0).exchanges;
    ok('the dialogue horizon is half the event horizon (8.17 Gly today); exchanges left: 151 with Virgo, 1 at 8 Gly, none beyond 8.17 Gly', Math.abs(d - hzAtT(t0).event / 2) < 1e-12 && Math.abs(d - 8.171) < 0.005 && nV === 151 && n8 === 1 && n9 === 0 && hzCausal(8.3, t0).reachable === true,
      `χ_e/2 = ${d.toFixed(4)} Gly · N(Virgo) = ${nV} · N(8 Gly) = ${n8} · N(8.3 Gly) = ${n9}`); }
  { const chis = [0.01, 0.1, 1, 5, 10, 20, 40, 60], C = chis.map(c => hzCausal(c, t0)); let ord = true; for (let i = 1; i < C.length; i++) ord = ord && C[i].firstLight > C[i - 1].firstLight && C[i].sunset < C[i - 1].sunset;
    const sE = hzCausal(hzAtT(t0).event, t0).sunset, lss = hzCausal(45.121, t0);
    ok('the calendar is ordered (first light later, sunset earlier with distance); the event horizon’s sunset is today; the last-scattering gas is seen only to ≈ 0.74 Gyr', ord && Math.abs(sE - t0) < 1e-6 && Math.abs(lss.sunset - 0.738) < 0.005 && !lss.reachable && lss.visible,
      `sunset(χ_e) − t₀ = ${(sE - t0).toExponential(1)} Gyr · LSS sunset ${lss.sunset.toFixed(4)} Gyr`); }
  { const a = hzCausal(0.054, t0), b = hzCausal(0.054, t0 + 50);
    ok('it follows the clock: 50 Gyr on, the dialogue horizon has shrunk with χ_e and fewer exchanges remain', b.dialogue < a.dialogue && b.exchanges < a.exchanges && Math.abs(b.dialogue - hzAtT(t0 + 50).event / 2) < 1e-12, `N(Virgo) ${a.exchanges} → ${b.exchanges} · χ_e/2 ${a.dialogue.toFixed(3)} → ${b.dialogue.toFixed(3)} Gly`); }
  { const op = TRACK_OPS && TRACK_OPS['cosmic.causal'] && TRACK_OPS['cosmic.causal'].run({ chi: 0.054 });
    const wired = /\['Source',s\.note\] \]\.concat\(hzCausalRows\(dist\)\)/.test(SRC) && /registerSel\('solarCosmic_'\+s\.key[\s\S]{0,1600}\.concat\(hzCausalRows\(dist\)\)\}\);/.test(SRC)
      && /HZ_GROUP\.add\(sphDialog\);/.test(SRC) && /hzScaleSphere\(sphDialog,E!=null\?\(E\/2\)\/G\.dlg:null,/.test(SRC) && /\$\{hzCausalPanelHTML\(\)\}/.test(SRC)
      && /globalThis\.HCC_CAUSAL=Object\.freeze\(/.test(SRC) && /\{id:'causalCalendar', kind:'found'/.test(SRC) && /causalCalendar:\[\{op:'nav', world:'obs'\}/.test(SRC);
    ok('wired: each structure’s card in both worlds carries its calendar; the dialogue horizon is a shared shell on the clock; the panel, HCC_CAUSAL, the track op and the ledger answer', wired && op && op.exchanges === 151, op ? `track op: N(Virgo) = ${op.exchanges}` : 'no op'); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
