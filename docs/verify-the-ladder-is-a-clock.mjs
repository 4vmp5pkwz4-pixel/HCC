/* THE LADDER IS ALSO A CLOCK (v4.420). Every rung of the φ-ladder is the Hubble radius at exactly one moment; that moment is
   computed from the Standard Model as an ideal gas, entropy conservation and radiation + matter + Λ. The mathematics is one
   block of pure functions (RUNGTIME-MATH), lifted out of index.html and run here as it stands.
     1. g*(T): 106.75 with every species relativistic, the textbook plateaux between thresholds, 43/11 for the entropy today;
     2. the ideal-gas integrals: massless limits 1 and 7/8, and Boltzmann suppression of a heavy species;
     3. the clock against the textbook: t(1 MeV), the age of the universe, the Hubble radius today, equality, recombination;
     4. c/H is monotone, so every length is the Hubble radius once — and the round trip length → moment → length closes;
     5. where the named moments stand on the ladder, and the lengths they are;
     6. inflation: H from r, the floor of the clock, the shortest primordial wave, ln φ e-folds to a rung;
     7. the page: the rung card, the inspector, the shells in both worlds, the passage on crossing, the agent handle. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('block not found: ' + a.slice(0, 50)); return src.slice(i, j); };
const MATH = cut('/* ═══ RUNGTIME-MATH-BEGIN ═══', '/* ═══ RUNGTIME-MATH-END ═══');
const names = ['RT_K', 'RT_SM', 'RT_GS0', 'rtDofExact', 'rtDof', 'rtGstar', 'rtHistory', 'rtAtT', 'rtAtA', 'rtWhen', 'rtEvents', 'rtInflation', 'rtExit', 'rtRung'];
const L = new Function(`${MATH}\nreturn {${names.join(',')}};`)();
const e = (v, d = 2) => v.toExponential(d), K = L.RT_K, H = L.rtHistory(0.674, 0.315), EV = Object.fromEntries(L.rtEvents(H).map(x => [x.id, x]));

{ const g = T => L.rtGstar(T), hi = g(1e5), a = g(0.01), lo = g(1e-9), sum = L.RT_SM.filter(x => x[4] !== 2).reduce((s, x) => s + x[2] * (x[3] ? 0.875 : 1), 0) + 6 * 0.875;
  check(Math.abs(sum - 106.75) < 1e-12 && Math.abs(hi.rho - 106.75) < 0.01 && Math.abs(a.rho - 10.75) < 0.02 && Math.abs(g(1).rho - 76) < 1.5 && g(0.2).rho > 55 && g(0.15).rho < 18 && Math.abs(lo.rho - 3.36) < 0.02 && Math.abs(lo.s - 43 / 11) < 0.02 && Math.abs(lo.Tnu - Math.cbrt(4 / 11)) < 2e-3 && Math.abs(L.RT_GS0 - lo.s) < 1e-9,
    'g*(T) from the particle table: 28 bosonic and 90 fermionic degrees of freedom make 106.75; 10.75 between the muon and the electron; a fall from above 55 to below 18 across the QCD crossover; 3.36 for the energy and 43/11 for the entropy today, with the neutrinos at (4/11)^⅓ of the photons',
    `Σ = ${sum} · g*(100 TeV) = ${hi.rho.toFixed(3)} · g*(1 GeV) = ${g(1).rho.toFixed(2)} · g*(200 MeV) = ${g(0.2).rho.toFixed(2)} · g*(150 MeV) = ${g(0.15).rho.toFixed(2)} · g*(10 MeV) = ${a.rho.toFixed(3)} · today ${lo.rho.toFixed(3)}, g_s = ${lo.s.toFixed(3)}, T_ν/T = ${lo.Tnu.toFixed(4)}`); }

{ const b0 = L.rtDofExact(1e-6, 0), f0 = L.rtDofExact(1e-6, 1), x = 20, bx = L.rtDofExact(x, 0), bz = 15 / Math.PI ** 4 * Math.sqrt(Math.PI / 2) * Math.pow(x, 2.5) * Math.exp(-x) * (1 + 27 / (8 * x)), tab = Math.max(...[0.01, 0.3, 1, 3, 10, 30].map(q => Math.abs(L.rtDof(q, 1)[0] / L.rtDofExact(q, 1)[0] - 1)));
  check(Math.abs(b0[0] - 1) < 1e-6 && Math.abs(b0[1] - 1) < 1e-6 && Math.abs(f0[0] - 0.875) < 1e-6 && Math.abs(f0[1] - 0.875) < 1e-6 && Math.abs(bx[0] / bz - 1) < 0.02 && tab < 6e-3,
    'the ideal-gas integrals behind it: a massless boson counts 1 and a massless fermion 7/8 in both energy and entropy; a species twenty times heavier than the temperature is suppressed as x^{5/2}e^{−x}; the table the page interpolates agrees with the quadrature to half a per cent',
    `boson ${b0[0].toFixed(7)}, ${b0[1].toFixed(7)} · fermion ${f0[0].toFixed(7)}, ${f0[1].toFixed(7)} · x = 20: ${e(bx[0])} vs Boltzmann ${e(bz)} · table vs quadrature ≤ ${e(tab, 1)}`); }

{ const t1 = L.rtAtT(H, 1e-3).t, now = EV.now, age = now.t / K.yr / 1e9, RH = now.R / (K.c * K.yr * 1e9), eq = EV.eq, rec = EV.rec;
  check(Math.abs(t1 - 0.74) < 0.02 && Math.abs(age - 13.79) < 0.03 && Math.abs(RH - 14.51) < 0.03 && Math.abs(eq.z - 3402) < 60 && Math.abs(rec.t / K.yr - 372e3) < 6e3 && Math.abs(rec.TK - 2974) < 8 && Math.abs(H.Or * 0.674 ** 2 - 4.17e-5) < 4e-7 && Math.abs(now.z) < 1e-3,
    'the clock against the textbook, for h = 0.674 and Ω_m = 0.315: one second at about 1 MeV (t = 0.745 s), an age of 13.79 Gyr, a Hubble radius of 14.51 Gly, equality at z ≈ 3400 (Planck 2018: 3402 ± 26; 3432 here, where the neutrinos decouple at once), recombination at 372 thousand years and 2970 K, Ω_r h² = 4.17·10⁻⁵',
    `t(1 MeV) = ${t1.toFixed(4)} s · age ${age.toFixed(3)} Gyr · c/H₀ = ${RH.toFixed(3)} Gly · z_eq = ${eq.z.toFixed(0)} · recombination ${(rec.t / K.yr / 1e3).toFixed(1)} kyr, ${rec.TK.toFixed(0)} K · Ω_r h² = ${e(H.Or * 0.674 ** 2, 3)}`); }

{ let mono = true; for (let i = 1; i <= H.n; i++) if (!(H.H[i] < H.H[i - 1]) || !(H.A[i] > H.A[i - 1]) || !(H.t[i] > H.t[i - 1])) mono = false;
  let rt = 0; for (const Lm of [1e-25, 1e-10, 5.6e-3, 7.6e3, 1.5e11, 1e18, 6e21, 1e26]) { const w = L.rtWhen(H, Lm); rt = Math.max(rt, Math.abs(w.R / Lm - 1)); }
  const dS = K.c / (H.H0 * Math.sqrt(H.OL)), never = L.rtWhen(H, dS * 1.01), last = L.rtWhen(H, dS * 0.995), tiny = L.rtWhen(H, K.c / H.H[0] * 0.5);
  check(mono && rt < 2e-3 && never.never && Math.abs(never.limit - dS) < 1 && last.era === 'lambda' && last.z < 0 && tiny.before,
    'c/H falls nowhere: the Hubble rate decreases, the scale factor and the time increase along the whole table, so a length is the Hubble radius once and only once — length → moment → length closes — and a length beyond the de Sitter radius c/(H₀√Ω_Λ) is never one',
    `monotone over ${H.n + 1} rows · round trip ≤ ${e(rt, 1)} · de Sitter radius ${(dS / (K.c * K.yr * 1e9)).toFixed(2)} Gly = rung ${L.rtRung(dS).toFixed(2)} · 0.995 of it: z = ${last.z.toFixed(2)} (the future)`); }

{ const au = 1.495978707e11, ly = K.c * K.yr, Rsun = 6.957e8, r = id => EV[id].N.toFixed(1);
  check(Math.abs(EV.ew.N - 155.7) < 0.15 && Math.abs(EV.qcd.N - 185.1) < 0.15 && Math.abs(EV.nu.N - 205.0) < 0.15 && Math.abs(EV.ee.N - 210.7) < 0.15 && Math.abs(EV.bbn.N - 220.0) < 0.15 && Math.abs(EV.eq.N - 266.6) < 0.15 && Math.abs(EV.rec.N - 270.7) < 0.15 && Math.abs(EV.now.N - 291.5) < 0.1
    && Math.abs(EV.ew.R - 5.56e-3) < 1e-4 && Math.abs(EV.qcd.R - 7.65e3) < 100 && Math.abs(EV.bbn.R / au - 1.05) < 0.02 && Math.abs(EV.ee.R / (2 * Rsun) - 1.26) < 0.03 && Math.abs(EV.eq.R / ly - 9.09e4) < 1500 && Math.abs(EV.qcd.t - 1.29e-5) < 3e-7 && Math.abs(EV.bbn.t - 265) < 4,
    'where the named moments stand: the electroweak crossover on rung 155.7 (a Hubble radius of 5.6 mm), the QCD crossover on 185.1 (7.6 km, 13 μs), neutrino decoupling on 205.0, e± annihilation on 210.7 (1.26 solar diameters), nucleosynthesis on 220.0 (1.05 au — the causal universe inside the Earth’s orbit), equality on 266.6 (91 thousand light-years), recombination on 270.7, today on 291.5',
    `rungs ew ${r('ew')} · qcd ${r('qcd')} · ν ${r('nu')} · e± ${r('ee')} · BBN ${r('bbn')} · eq ${r('eq')} · rec ${r('rec')} · now ${r('now')} · R: ${e(EV.ew.R)} m, ${e(EV.qcd.R)} m, ${(EV.ee.R / (2 * Rsun)).toFixed(2)} D☉, ${(EV.bbn.R / au).toFixed(3)} au, ${(EV.eq.R / ly / 1e3).toFixed(1)} kly, ${(EV.rec.R / ly / 1e3).toFixed(0)} kly`); }

{ const I = L.rtInflation(0.00355), Mb = 2.435323e18, phi = (1 + Math.sqrt(5)) / 2, L0 = 2 * Math.PI / (0.05 / K.Mpc) * Math.exp(-55), d = L.rtExit(1e20 * phi, 55) - L.rtExit(1e20, 55), w = L.rtWhen(H, I.R * 1.0001);
  check(Math.abs(I.H_GeV - 1.477e13) < 2e10 && Math.abs(L.rtRung(I.R) - 28.3) < 0.1 && Math.abs(I.V14 - 7.89e15) < 2e13 && Math.abs(I.Tmax - 3.24e15) < 2e13 && Math.abs(w.T / I.Tmax - 1) < 0.01 && Math.abs(d - Math.log(phi)) < 1e-12 && Math.abs(L.rtExit(L0, 55)) < 1e-9 && Math.abs(L0 - 5.04) < 0.01 && Math.abs(L.rtRung(L0) - 169.8) < 0.1 && Math.abs(L.rtExit(2 * Math.PI / (0.05 / K.Mpc), 55) - 55) < 1e-12,
    'inflation, if it happened with R²’s r = 0.00355: H = π M̄_pl √(A_s r/2) = 1.48·10¹³ GeV, so no Hubble radius was ever shorter than rung 28.3 and a hot universe born at once from it is at 3.2·10¹⁵ GeV — the temperature the thermal table gives for that very radius; one rung is exactly ln φ e-folds; the wave that left the horizon as inflation ended is 5.04 m long today, rung 169.8, and the pivot scale left it N* = 55 e-folds earlier',
    `H = ${e(I.H_GeV, 3)} GeV · c/H = ${e(I.R)} m = rung ${L.rtRung(I.R).toFixed(2)} · T_max = ${e(I.Tmax)} GeV (table: ${e(w.T)}) · Δ per rung ${d.toFixed(6)} = ln φ · shortest primordial wave ${L0.toFixed(3)} m, rung ${L.rtRung(L0).toFixed(2)}`); }

{ const need = [['+(()=>{ try{ return rtRungHTML(N); }catch(e){ return \'\'; } })()', 'the rung card'], ['<div id="rgClock" style="margin:4px 0 8px"></div>', 'the rung inspector'], ['function rtShellsTick(){', 'the shells'], ["(state.mode==='solar'||state.mode==='obs')&&!state.landed", 'in the Solar System and the Horizons'], ['const Rm=com?S.e.Rcom:S.e.R', 'physical then, comoving in the Horizons'],
    ['try{ rtShellsTick(); }catch(e){}', 'in the frame loop'], ["hccPassage('level',{dir:up?1:-1, to:rtName(e.id)", 'a passage on crossing'], ["ATLAS_BUS.get('inflate.tensor_to_scalar')", 'reads the inflation laboratory'], ['globalThis.HCC_RUNGTIME=Object.freeze({', 'agent handle'], ["{id:'ladderClock420', kind:'found'", 'the ledger'], ['data-tsshell="1"', 'the switch']];
  const miss = need.filter(([s]) => !src.includes(s)).map(([, n]) => n), labs = ['unify', 'hpage', 'nuosc', 'origins', 'cosmicweb', 'cmb', 'lam', 'cosmo', 'inflate'].filter(l => !src.includes(`{id:'${l}'`) && !src.includes(`'${l}',`));
  check(!miss.length && !labs.length && !/\b(document|window|THREE|state|renderer|camera)\s*[.\[(]/.test(MATH), 'in the page: every rung’s card and the rung inspector say when; in the Solar System (and its descent) and in the Horizons the past Hubble radii stand as shells around the point looked at — physical where distances are physical, comoving where they are comoving; crossing a named moment’s rung is a passage; the lower end reads the inflation laboratory’s tensor ratio; each moment names a laboratory that exists; the mathematics names nothing of the page',
    `${need.length - miss.length}/${need.length} sites${miss.length ? ' · MISSING ' + miss.join(', ') : ''}${labs.length ? ' · unknown labs ' + labs.join(',') : ''}`); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
