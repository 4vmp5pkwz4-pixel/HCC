/* THE BACTERIAL FLAGELLAR MOTOR (v4.439) — the laboratory's two laws and what is built on them, recomputed by means independent
   of the page wherever such means exist, and held to the measurements they were calibrated to.
     1. thermodynamics: the proton-motive force from CODATA k_B and e, the stall torque n·e·|Δp|/δ, efficiency ≤ 1 everywhere and
        → 1 at stall, mechanical power never above the free energy the protons bring;
     2. the calibration: zero-load speed 309 Hz at −150 mV and 23 °C for every number of stators (Yuan & Berg 2008), the knee at
        170 Hz and 90 % of stall (Chen & Berg 2000), rates scaled by Q10 = 2 and the stall not at all;
     3. the load: water's viscosity against reference values and the bead drag 8πηa³ + 6πηa·r² recomputed;
     4. the switch ring, exactly: the transfer matrix against brute-force enumeration of every configuration of small rings, and
        for 34 protomers K½ = 3.10 µM, Hill coefficient 10.27 (Cluzel, Surette & Leibler 2000: 3.1 µM, 10.3 ± 1.1);
     5. the switch ring, stochastically: the page's Glauber Monte Carlo against the exact curve, switching about once a second;
     6. the stochastic motor against the mean field — equal with one stator at every load and with eleven at high load, ≈ 4 %
        slower with eleven near zero load — and tight coupling in its proton count;
     7. the catch bond's occupancy as a fixed point, high under load and low without;
     8. the wiring of the laboratory and its instrument, which runs without a browser.
   What is NOT checked here: a molecular mechanism (there is none in the model), the 26-step / 34-FliG mismatch, and the
   schematic swimming load and run–tumble picture. The Monte Carlo checks are statistical, with tolerances several standard
   errors wide. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const block = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b); if (i < 0 || j < i) throw new Error('missing block ' + a); return src.slice(i, j); };
const page = new Function(block('/* ═══ FLM-MATH-BEGIN', '/* ═══ FLM-MATH-END') + block('/* ═══ FLM-SIM-BEGIN', '/* ═══ FLM-SIM-END') +
  ';return {flmPMF, flmRates, flmOmega, flmOperating, flmCurve, flmKnee, flmEta, flmBeadDrag, flmRingField, flmRingCW, flmRingHill, flmModel, flmLoadZeta, flmSimNew, flmRingStep, flmSimulate, flmRemodelMean, FLM_RING, FLM_REMODEL, FLM_SITES, FLM_DELTA};')();
const rng = (() => { let s = 4390; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
/* the page's Monte Carlo draws from Math.random; seeded here (mulberry32) so that every run of this file sees the same numbers */
Math.random = (() => { let a = 439001; return () => { a = (a + 0x6D2B79F5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; })();
const KB = 1.380649e-23, QE = 1.602176634e-19, DELTA = 2 * Math.PI / 26;
const base = { n: 2, kon: 8840, zi: 0.0093, T: 23 };

{ let worstPmf = 0, worstSt = 0, effMax = 0, powerOk = true, cases = 0;
  for (let t = 0; t < 400; t++) { const dpsi = -250 * rng(), dpH = -0.5 + 2 * rng(), T = 10 + 30 * rng(), n = 1 + Math.floor(rng() * 4), N = 1 + Math.floor(rng() * 12), zeta = Math.exp(Math.log(1e-3) + rng() * Math.log(1e4));
    const ref = dpsi - Math.LN10 * KB * (273.15 + T) / QE * 1e3 * dpH, p = page.flmPMF(dpsi, dpH, T); worstPmf = Math.max(worstPmf, Math.abs(p - ref) / Math.max(1, Math.abs(ref)));
    if (Math.abs(p) < 1) continue; const M = { ...base, n, T, pmf: p, N }, R = page.flmRates(M), st = n * QE * Math.abs(p) * 1e-3 / DELTA * 1e21; worstSt = Math.max(worstSt, Math.abs(R.st - st) / st);
    const o = page.flmOperating(M, zeta); effMax = Math.max(effMax, o.efficiency); if (o.power_zW > o.protonsPerSecond * QE * Math.abs(p) * 1e-3 * 1e21 * (1 + 1e-9)) powerOk = false; cases++; }
  const hi = page.flmOperating({ ...base, pmf: -150, N: 5 }, 1e4);
  check(worstPmf < 1e-12 && worstSt < 1e-12 && effMax <= 1 && hi.efficiency > 0.999 && powerOk,
    'thermodynamics, independently: Δp = Δψ − ln10·(k_BT/e)·ΔpH from CODATA k_B and e, the stall per stator n·e·|Δp|/δ with δ = 2π/26; over random potentials, temperatures, proton counts, stator numbers and loads the efficiency τδ/(n·e·|Δp|) never exceeds one and reaches it at stall, and the mechanical power never exceeds the free energy the protons carry in',
    `${cases} cases · Δp worst ${worstPmf.toExponential(1)} · stall worst ${worstSt.toExponential(1)} · max efficiency ${effMax.toFixed(6)} · at ζ = 10⁴: ${hi.efficiency.toFixed(5)} · Δp(−120 mV, 0.6, 23 °C) = ${page.flmPMF(-120, 0.6, 23).toFixed(2)} mV`); }

{ const zl = [], M = N => ({ ...base, pmf: -150, N }); for (let N = 1; N <= 11; N++) zl.push(page.flmOmega(page.flmRates(M(N)), 0) / (2 * Math.PI));
  const K = page.flmKnee(M(11)), R = page.flmRates(M(11)), frac = K.perStator / R.st, stall = 11 * R.st;
  const w23 = page.flmOmega(page.flmRates({ ...base, pmf: -150, N: 1 }), 0), w33 = page.flmOmega(page.flmRates({ ...base, T: 33, pmf: -150, N: 1 }), 0), st33 = page.flmRates({ ...base, T: 33, pmf: -150, N: 1 }).st;
  const curve = page.flmCurve(M(11), 60), mono = curve.every((p, i) => !i || (p.torque >= curve[i - 1].torque && p.hz <= curve[i - 1].hz + 1e-12));
  check(Math.abs(zl[0] - 309.1) < 0.6 && Math.max(...zl) - Math.min(...zl) < 1e-9 && Math.abs(K.hz - 170) < 1 && Math.abs(frac - 0.9) < 0.005 && Math.abs(w33 / w23 - 2) < 1e-12 && Math.abs(st33 / R.st - 1) < 1e-12 && Math.abs(R.st - 198.9) < 0.1 && mono,
    'the stator law holds its calibration: at −150 mV and 23 °C the zero-load speed is the same ≈ 309 Hz for every number of stators from one to eleven (measured independent of N by Yuan & Berg 2008); the knee — where waiting and stroking take equal time — is at 170 Hz and 90 % of stall (Chen & Berg 2000); ten degrees warmer the speeds double (Q10 = 2) and the stall does not move; the torque–speed curve falls monotonically from zero-load to stall',
    `zero-load ${zl[0].toFixed(2)} Hz, spread over N ${(Math.max(...zl) - Math.min(...zl)).toExponential(1)} · knee ${K.hz.toFixed(2)} Hz at ${(100 * frac).toFixed(2)} % of stall · stall ${R.st.toFixed(2)} pN·nm per stator, ${stall.toFixed(0)} for 11 · ω(33 °C)/ω(23 °C) = ${(w33 / w23).toFixed(6)}`); }

{ const ref = [[10, 1.3059], [20, 1.0016], [25, 0.8900], [30, 0.7972], [37, 0.6913], [40, 0.6527]], worst = Math.max(...ref.map(([T, e]) => Math.abs(page.flmEta(T, 1) / e - 1)));
  let dragWorst = 0; for (let t = 0; t < 50; t++) { const a = 0.03 + 1.5 * rng(), r = 0.3 * rng(), eta = 0.5 + 2 * rng(), z = page.flmBeadDrag(a, r, eta), ind = (8 * Math.PI * eta * 1e-3 * (a * 1e-6) ** 3 + 6 * Math.PI * eta * 1e-3 * (a * 1e-6) * (r * 1e-6) ** 2) * 1e21; dragWorst = Math.max(dragWorst, Math.abs(z / ind - 1)); }
  const swim = page.flmLoadZeta('swim', 0.5, page.flmEta(23, 1)), b05 = page.flmLoadZeta('bead', 0.5, page.flmEta(23, 1));
  check(worst < 0.015 && dragWorst < 1e-12 && Math.abs(swim - 1.35) < 1e-9 && b05 > 3 && b05 < 4,
    'the load, independently: water’s viscosity from the page’s Vogel fit within 1.5 % of reference values from 10 to 40 °C, and the rotational drag of a bead on a filament stub 8πηa³ + 6πηa·r² recomputed in SI units; a swimming cell’s bundle is the stated 1.35 pN·nm·s in water at 23 °C',
    `viscosity worst ${(100 * worst).toFixed(2)} % (η(23 °C) = ${page.flmEta(23, 1).toFixed(4)} mPa·s) · drag worst ${dragWorst.toExponential(1)} · 0.5 µm bead ζ = ${b05.toFixed(3)} pN·nm·s`); }

{ /* brute force: every configuration of a ring of N, weight exp(−h·n_CW − J·n_unlike) */
  const brute = (c, S, N) => { const h = page.flmRingField(c, S); let Z = 0, cw = 0; for (let m = 0; m < 1 << N; m++) { let n1 = 0, un = 0; for (let k = 0; k < N; k++) { const a = (m >> k) & 1, b = (m >> ((k + 1) % N)) & 1; n1 += a; un += a !== b; } const w = Math.exp(-h * n1 - S.J * un); Z += w; cw += w * n1 / N; } return cw / Z; };
  let worst = 0, cases = 0; for (const N of [8, 11, 14]) for (const c of [0.5, 2, 3.1, 4, 7]) for (const J of [2, 6]) { const S = { ...page.FLM_RING, J, N }; worst = Math.max(worst, Math.abs(page.flmRingCW(c, S) - brute(c, S, N))); cases++; }
  const H = page.flmRingHill(page.FLM_RING); let mono = true, prev = -1; for (let k = 0; k <= 200; k++) { const b = page.flmRingCW(0.1 * Math.pow(100, k / 200), page.FLM_RING); if (b < prev) mono = false; prev = b; }
  check(worst < 1e-12 && Math.abs(H.K - 3.10) < 0.01 && Math.abs(H.n - 10.27) < 0.05 && mono && page.FLM_RING.N === 34,
    'the switch ring, exactly: its CW bias by a 2 × 2 transfer matrix to the N-th power equals brute-force enumeration of all 2ᴺ configurations of rings of 8, 11 and 14 protomers; for the ring of 34 with J = 6 k_BT the curve rises monotonically with [CheY-P], with K½ = 3.10 µM and Hill coefficient 10.27 — Cluzel, Surette & Leibler (2000) measured 3.1 µM and 10.3 ± 1.1 in single motors',
    `${cases} rings × [CheY-P] × J · worst |Δ| ${worst.toExponential(1)} · K½ ${H.K.toFixed(4)} µM · n_H ${H.n.toFixed(3)} · B(2 µM) ${page.flmRingCW(2, page.FLM_RING).toFixed(4)}, B(4 µM) ${page.flmRingCW(4, page.FLM_RING).toFixed(4)}`); }

{ const out = []; let ok = true, sw31 = 0;
  for (const c of [2.6, 3.1, 3.6]) { const S = page.flmSimNew({ stators: 0, cheY: c }); let acc = 0, n = 0, sw = 0, side = S.cw > 0.5 ? 1 : 0;
    for (let k = 0; k < 20000; k++) { page.flmRingStep(S, { cheY: c }, 0.05); acc += S.cw; n++; if (side === 0 && S.cw >= 0.75) { side = 1; sw++; } else if (side === 1 && S.cw <= 0.25) { side = 0; sw++; } }
    const mc = acc / n, ex = page.flmRingCW(c, page.FLM_RING); if (Math.abs(mc - ex) > 0.05) ok = false; if (c === 3.1) sw31 = sw / 1000; out.push(`${c} µM: MC ${mc.toFixed(3)} vs ${ex.toFixed(3)}`); }
  check(ok && sw31 > 0.4 && sw31 < 3,
    'the switch ring, stochastically: the page’s own Glauber dynamics — flips at w₀·exp(−ΔG/2), which satisfy detailed balance with the ring’s energy — averaged over 1000 s of switch time reproduce the exact curve at three CheY-P levels, and near K½ the ring reverses about once a second, by domains that spread',
    `${out.join(' · ')} · full reversals at 3.1 µM: ${sw31.toFixed(2)} per second`); }

{ const P0 = { dpsi: -120, dpH: 0.6, T: 23, n: 2, kon: 8840, zi: 0.0093, cheY: 0, load: 'bead', eta: page.flmEta(23, 1) }, run = (bead, N, sec) => { const P = { ...P0, stators: N, bead, zeta: page.flmLoadZeta('bead', bead, P0.eta) }, s = page.flmSimulate(P, sec), m = page.flmOperating({ ...page.flmModel(P), N }, P.zeta); return { s, m, r: s.hz / m.hz, prot: s.protonsPerSecond / s.hz / (N * 2 * 26) }; };
  const one = [[0.03, 0.4], [0.3, 0.6], [1.0, 2]].map(([b, sec]) => run(b, 1, sec)), hiN = [0.5, 1.0].map(b => run(b, 11, 0.3)), lo = run(0.05, 11, 0.4);
  const okOne = one.every(x => Math.abs(x.r - 1) < 0.06), okHi = hiN.every(x => Math.abs(x.r - 1) < 0.06), deficit = 1 - lo.r, protOk = [...one, ...hiN, lo].every(x => Math.abs(x.prot - 1) < 0.05);
  check(okOne && okHi && deficit > 0.005 && deficit < 0.10 && protOk,
    'the stochastic motor against its mean field: every stator stepped with its elastic linkage, the hook and the load relaxing exactly with k_BT noise, 2 µs a step — one stator runs at the mean-field speed at every load, eleven do under a 0.5 or 1 µm bead, and near zero load eleven run a few per cent slower, their phases spreading against the linkages (the coupling the mean field cannot see); protons per turn are N·n·26 to within the noise (tight coupling)',
    `one stator ${one.map(x => x.r.toFixed(3)).join(', ')} · eleven at high load ${hiN.map(x => x.r.toFixed(3)).join(', ')} · eleven near zero load ${lo.s.hz.toFixed(1)} vs ${lo.m.hz.toFixed(1)} Hz (deficit ${(100 * deficit).toFixed(1)} %) · protons per turn / (N·n·26): ${[...one, ...hiN, lo].map(x => x.prot.toFixed(3)).join(', ')}`); }

{ const P = bead => ({ dpsi: -120, dpH: 0.6, T: 23, n: 2, kon: 8840, zi: 0.0093, stators: 6, zeta: page.flmLoadZeta('bead', bead, page.flmEta(23, 1)) }), R = page.FLM_REMODEL;
  const hi = page.flmRemodelMean(P(0.5)), lo = page.flmRemodelMean(P(0.03)), fix = b => { const N = page.flmRemodelMean(P(b)), o = page.flmOperating({ ...page.flmModel(P(b)), N: Math.max(1, Math.round(N)) }, P(b).zeta), ku = R.ku0 * Math.exp(-o.perStator / R.tc); return Math.abs(page.FLM_SITES * R.kb / (R.kb + ku) - N); };
  check(Math.abs(hi - 11.09) < 0.05 && Math.abs(lo - 3.66) < 0.05 && fix(0.5) < 1e-5 && fix(0.03) < 1e-5,
    'stators come and go by a catch bond — bound at 0.03 s⁻¹, released at 0.07 s⁻¹·e^{−τ/59 pN·nm}: the mean occupancy is a fixed point of binding and torque-dependent release, ≈ 11 of 12 sites under a 0.5 µm bead and ≈ 3.7 near zero load, the direction remodelling experiments report (Lele et al. 2013; Wadhwa et al. 2019)',
    `⟨N⟩ = ${hi.toFixed(3)} at 0.5 µm, ${lo.toFixed(3)} at 0.03 µm · fixed-point residuals ${fix(0.5).toExponential(1)}, ${fix(0.03).toExponential(1)}`); }

{ const M = await import(path.join(ROOT, 'core/atlas/instruments.mjs')), miss = ["{id:'flagmotor', category:'dyn'", "id:'flagmotor', world:'s3', lab:'flagmotor'", "flmGroup.visible = (v==='flagmotor');", "if(v==='flagmotor'&&!flmObjs){ flmSetup(); }", "else if(V==='flagmotor') body = flmPanelHTML();",
    "if(V==='flagmotor'){ flmBind(ctl); }", "} else if(state.s3view==='flagmotor'){", "flagmotor:{speed:['flmDil',0.02], pause:['flmPaused','p']},", "['flmAtlas','flagmotor',flmGroup,", "()=>goLab('s3','flagmotor')", "globalThis.HCC_FLAGMOTOR=Object.freeze({", "{id:'flagmotor439', kind:'tested'",
    "['flagmotor','pxp','analogy'", "v==='flagmotor'?["].filter(x => !src.includes(x));
  const meta = M.INSTRUMENT_META && M.INSTRUMENT_META.flagmotor, defs = meta ? Object.fromEntries(meta.inputs.map(i => [i.name, i.default])) : null, r = defs ? M.INSTRUMENTS.flagmotor(defs) : {};
  const P = { dpsi: -120, dpH: 0.6, T: 23, n: 2, kon: 8840, zi: 0.0093 }, z = page.flmLoadZeta('bead', 0.5, page.flmEta(23, 1)), o = page.flmOperating({ ...page.flmModel(P), N: 11 }, z);
  const ok = !miss.length && !!meta && Math.abs(r.flagmotor_pmf + 155.2575) < 1e-3 && Math.abs(r.flagmotor_speed - o.hz) < 1e-9 && Math.abs(r.flagmotor_cw_bias - page.flmRingCW(3, page.FLM_RING)) < 1e-15 && r.flagmotor_efficiency <= 1 && Math.abs(r.flagmotor_zero_load_speed - 320) < 1;
  check(ok, 'the laboratory is in the page and its instrument runs without a browser: declared, registered, shown, set up, given a panel, ticked, listed among the laboratories and the trips, related in the graph, entered in the ledger, with an agent handle; at its defaults — Δψ = −120 mV, ΔpH = 0.6, 23 °C, eleven stators, a 0.5 µm bead, 3 µM CheY-P — the instrument returns the page’s own operating point and the exact switch',
    `Δp ${r.flagmotor_pmf != null ? r.flagmotor_pmf.toFixed(3) : '—'} mV · ${r.flagmotor_speed != null ? r.flagmotor_speed.toFixed(2) : '—'} Hz at ${r.flagmotor_torque != null ? r.flagmotor_torque.toFixed(0) : '—'} pN·nm · zero-load ${r.flagmotor_zero_load_speed != null ? r.flagmotor_zero_load_speed.toFixed(1) : '—'} Hz · CW bias ${r.flagmotor_cw_bias != null ? r.flagmotor_cw_bias.toFixed(4) : '—'}${miss.length ? ' · missing ' + miss.join(' | ') : ''}`); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
