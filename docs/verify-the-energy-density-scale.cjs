#!/usr/bin/env node
'use strict';
/* ══ THE ENERGY-DENSITY SCALE, EXACTLY (v4.391) ══════════════════════════════════════════════════════════════════════
 * Asked: are there more exact formalizations of the one scale of energy density than the ladder's ρ ∝ φ⁻³ᴺ — make it
 * possible to switch between them, with markup. Each law is C·φ^(−kN) in units of the Planck density, its coefficient
 * derived from a definite question about the length L = ℓ_P·φᴺ. Checked here by running the page's own pure code:
 *   1. the units: m_P/ℓ_P³ = c⁵/ħG² = ρ_P and ħc/ℓ_P⁴ = ρ_P c², so m_P/L³ and ħc/L⁴ are φ^(−3N) and φ^(−4N) exactly
 *   2. the coefficients: black body (π²/15, Stefan–Boltzmann at k_BT = ħc/L), the conformal scalar's vacuum on S³ —
 *      the ζ-regularised Σ j³ = ζ(−3) = 1/120, read off the heat-kernel expansion numerically — and the topology
 *      difference ℝP³ − S³ (odd j only: −7/120 on half the volume) = −ħc/32π²L⁴; light's vacuum 11ħc/240π²L⁴; a black
 *      hole's mean density 3c²/8πGL² = (3/8π)(ℓ_P/L)² ρ_P; the dark energy ρ_Λ = Λc²/8πG
 *   3. the meetings, exact: one quantum is a black hole at L = √(8π/3)·ℓ_P; one quantum per cell is the dark energy at
 *      (ħc/ρ_Λc²)^¼; the critical density is the dark energy's at the de Sitter radius √(3/Λ); the black-body law puts
 *      the CMB at ħc/k_BT_CMB
 *   4. the markup: every real density at the rung where the chosen law reaches it, and the words that say so
 *   5. wiring: the panel offers every law once, the HUD line names the chosen one, the shells carry the markup, and the
 *      φ-shells' bloom and crowding no longer white out the centre of the ladder
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const grab = (re, what) => { const m = SRC.match(re); if (!m) throw new Error('not found: ' + what); return m[0]; };
try {
  const C = { c: 299792458.0, G: 6.67430e-11, kB: 1.380649e-23, hbar: 1.054571817e-34 }, H0 = 68.43e3 / 3.0856775814913673e22, OmX = 0.6889 - 9.1e-5;
  const S3R = { Lambda: 3 * H0 * H0 * OmX / (C.c * C.c), rhoC: 3 * H0 * H0 / (8 * Math.PI * C.G) };
  const PHI = (1 + Math.sqrt(5)) / 2, LOG10_PHI = Math.log10(PHI), lP = Math.sqrt(C.hbar * C.G / C.c ** 3), levelR = N => lP * Math.pow(PHI, N);
  const blk = grab(/const FBS_RHO=\(\(\)=>\{[\s\S]*?const fbsRhoMarks=[^\n]*\n/, 'the density laws');
  const F = new Function('HCC_S3C', 'S3R', 'HCC_S3R', 'state', 'LOG10_PHI', 'FBS', blk + 'return {FBS_RHO,fbsLog10Rho,fbsRungOfRho,fbsRhoCross,fbsRhoMarks,fbsRhoLaw};')(C, S3R, { T_cmb: 2.72548 }, { fbsDensExp: 3 }, LOG10_PHI, { Nmax: 400 });
  const law = id => F.FBS_RHO.laws.find(l => l.id === id), rhoP = F.FBS_RHO.rhoP, rel = (a, b) => Math.abs(a - b) / Math.abs(b);
  /* 1 */
  { const mP = Math.sqrt(C.hbar * C.c / C.G), a = rel(mP / lP ** 3, rhoP), b = rel(C.hbar * C.c / lP ** 4 / (C.c * C.c), rhoP);
    let worst = 0; for (const N of [0, 37.5, 120, 266]) { const L = levelR(N); worst = Math.max(worst, Math.abs(F.fbsLog10Rho(N, law('fbs')) - Math.log10(mP / L ** 3 / rhoP)), Math.abs(F.fbsLog10Rho(N, law('quantum')) - Math.log10(C.hbar * C.c / L ** 4 / (C.c * C.c) / rhoP))); }
    ok('the units: m_P/ℓ_P³ = ħc/(ℓ_P⁴c²) = c⁵/ħG² = ρ_P, so m_P/L³ and ħc/L⁴ are φ^(−3N) and φ^(−4N) of the Planck density exactly',
      a < 1e-12 && b < 1e-12 && worst < 1e-9, `m_P/ℓ_P³ ${a.toExponential(1)} · ħc/ℓ_P⁴c² ${b.toExponential(1)} · laws at four rungs to ${worst.toExponential(1)} dex`); }
  /* 2 */
  { /* the finite parts of Σ j³e^(−εj) over all j and over odd j: ζ(−3) = 1/120 and −7/120 */
    const S = (e, odd) => { let s = 0, c = 0; for (let j = 1; j < 60 / e; j += odd ? 2 : 1) { const y = j * j * j * Math.exp(-e * j) - c, t = s + y; c = (t - s) - y; s = t; } return s; };   /* Kahan */
    /* the finite part f(ε) = S(ε) − (pole) = A + Bε² + Cε⁴ + O(ε⁶) (only even powers: ζ vanishes at the negative even
       integers); Richardson's steps remove them one power at a time */
    const fin = (e, odd) => S(e, odd) - (odd ? 3 : 6) / e ** 4, R1 = (e, odd) => (4 * fin(e / 2, odd) - fin(e, odd)) / 3, R2 = (e, odd) => (16 * R1(e / 2, odd) - R1(e, odd)) / 15;
    const rich = odd => (64 * R2(0.1, odd) - R2(0.2, odd)) / 63;   /* three steps: the ε², ε⁴ and ε⁶ terms gone */
    const zeta = Math.abs(rich(false) - 1 / 120), z7 = Math.abs(rich(true) + 7 / 120);
    const L = 1.3e-4, Es = C.hbar * C.c / (240 * L), Ep = -7 * C.hbar * C.c / (240 * L), Vs = 2 * Math.PI ** 2 * L ** 3, du = Ep / (Vs / 2) - Es / Vs;
    const topo = rel(Math.abs(du), law('topo').C * rhoP * C.c * C.c * (lP / L) ** 4), cas = rel(Es / Vs, law('casimir').C * rhoP * C.c * C.c * (lP / L) ** 4);
    const thermal = rel(Math.PI ** 2 / 15 * (C.hbar * C.c / L) ** 4 / (C.hbar * C.c) ** 3, law('thermal').C * rhoP * C.c * C.c * (lP / L) ** 4);
    const light = rel(11 * C.hbar * C.c / (120 * L) / Vs, law('light').C * rhoP * C.c * C.c * (lP / L) ** 4);
    const bh = rel((L * C.c * C.c / (2 * C.G)) / (4 / 3 * Math.PI * L ** 3), law('grav').C * rhoP * (lP / L) ** 2);
    const lam = rel(law('lambda').C * rhoP, S3R.Lambda * C.c * C.c / (8 * Math.PI * C.G));
    ok('the coefficients: Σ j³ regularised is ζ(−3) = 1/120 (S³) and −7/120 over odd j (ℝP³), so the topology alone changes the vacuum by −ħc/32π²L⁴; the scalar ħc/480π²L⁴, light 11ħc/240π²L⁴, the black body (π²/15)ħc/L⁴, a black hole 3c²/8πGL², the dark energy Λc²/8πG',
      zeta < 5e-9 && z7 < 5e-9 && topo < 1e-12 && cas < 1e-12 && thermal < 1e-12 && light < 1e-12 && bh < 1e-12 && lam < 1e-12,
      `ζ(−3) to ${zeta.toExponential(1)} · odd −7/120 to ${z7.toExponential(1)} · topology ${topo.toExponential(1)} · scalar ${cas.toExponential(1)} · light ${light.toExponential(1)} · black body ${thermal.toExponential(1)} · black hole ${bh.toExponential(1)} · Λ ${lam.toExponential(1)}`); }
  /* 3 */
  { const qg = F.fbsRhoCross(law('quantum'), law('grav')), ql = F.fbsRhoCross(law('quantum'), law('lambda')), gl = F.fbsRhoCross(law('grav'), law('lambda'));
    const a = rel(levelR(qg), Math.sqrt(8 * Math.PI / 3) * lP), uL = S3R.Lambda * C.c ** 4 / (8 * Math.PI * C.G), b = rel(levelR(ql), Math.pow(C.hbar * C.c / uL, 0.25)), d = rel(levelR(gl), Math.sqrt(3 / S3R.Lambda));
    const cmb = F.fbsRhoMarks(law('thermal')).find(m => m.id === 'cmb'), e = rel(levelR(cmb.N), C.hbar * C.c / (C.kB * 2.72548));
    const words = SRC.includes('L = (ħc/ρ_Λc²)^¼ = 87 μm (N = 147.1)') && Math.abs(levelR(ql) * 1e6 - 87.3) < 0.5 && Math.abs(ql - 147.1) < 0.05;
    ok('the meetings: one quantum is a black hole at √(8π/3)·ℓ_P (N = 2.21); one quantum per cell is the dark energy at (ħc/ρ_Λc²)^¼ = 87 μm; the critical density is the dark energy’s at the de Sitter radius √(3/Λ); the black body puts the CMB at ħc/k_BT_CMB',
      a < 1e-12 && b < 1e-12 && d < 1e-12 && e < 1e-12 && words, `N ${qg.toFixed(4)} · ${(levelR(ql) * 1e6).toFixed(2)} μm at N ${ql.toFixed(2)} · de Sitter ${(levelR(gl) / 9.4607304725808e24).toFixed(2)} Gly · CMB ${(levelR(cmb.N) * 1e3).toFixed(4)} mm · words ${words ? '✓' : '✗'}`); }
  /* 4 */
  { const nucQ = F.fbsRhoMarks(law('quantum')).find(m => m.id === 'nuclear'), nucG = F.fbsRhoMarks(law('grav')).find(m => m.id === 'nuclear');
    const fm = levelR(nucQ.N) * 1e15, MeVfm3 = C.hbar * C.c / levelR(nucQ.N) ** 4 / 1.602176634e-13 * 1e-45, km = levelR(nucG.N) / 1e3;
    const said = SRC.includes('nuclear matter at ≈ 1.1 fm, where ħc/L⁴ ≈ 130 MeV per fm³') && SRC.includes('nuclear matter at ≈ 26 km');
    const lam = F.fbsRhoMarks(law('lambda')).length === 0, all = F.FBS_RHO.laws.every(l => l.m && l.m.length === 3);
    ok('the markup: every real density at the rung where the chosen law reaches it — nuclear matter at ≈ 1.1 fm under ħc/L⁴ (≈ 130 MeV/fm³) and at ≈ 26 km under 3c⁴/8πGL²; a constant law reaches none; every law says what its markup means',
      Math.abs(fm - 1.1) < 0.06 && Math.abs(MeVfm3 - 130) < 8 && Math.abs(km - 26) < 1 && said && lam && all, `${fm.toFixed(2)} fm · ${MeVfm3.toFixed(0)} MeV/fm³ · ${km.toFixed(1)} km · words ${said ? '✓' : '✗'} · Λ marks none ${lam ? '✓' : '✗'} · meanings ${all ? '✓' : '✗'}`); }
  /* 5 */
  { const panel = (SRC.match(/\$\{fbsRhoPanelHTML\(\)\}/g) || []).length === 1 && /data-rho-law="\$\{l\.id\}"/.test(SRC) && /data-rho-law="custom"/.test(SRC) && /try\{ fbsRhoPaint\(\); \}catch\(e\)\{\}/.test(SRC);
    const hud = /const L=fbsRhoLaw\(\), near=fbsRhoMarks\(L\)\.filter\(m=>Math\.abs\(m\.N-D\)<0\.6\)/.test(SRC) && /const mk=tier2\?\[\]:rhoMarks\.filter\(m=>Math\.floor\(m\.N\)===n\)/.test(SRC);
    const light = /if\(state\.mode==='fbs'\)return \{strength:\.36,radius:\.5,threshold:\.84\};/.test(SRC) && /\*crowd\(rs\);/.test(SRC) && /return THREE\.MathUtils\.smoothstep\(px,14,60\);/.test(SRC);
    ok('wiring: the panel offers every law once (and the free exponent), the HUD names the chosen law and the densities on this rung, the shells carry the markup; the φ-shells no longer bloom into a white disc (threshold .84) and a shell under 60 px fades instead of stacking on the centre',
      panel && hud && light, `panel ${panel ? '✓' : '✗'} · HUD and shells ${hud ? '✓' : '✗'} · bloom and crowding ${light ? '✓' : '✗'}`); }
} catch (e) { fail++; console.log('  FAIL — verifier error: ' + (e && e.stack || e)); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
