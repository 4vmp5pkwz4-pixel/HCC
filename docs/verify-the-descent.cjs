#!/usr/bin/env node
'use strict';
/* ══ THE DESCENT INTO ANY BODY, THE MODELS ON THE φ-SHELLS, THE LADDER FOLDED (v4.386) ═════════════════════════════════
 * Asked: a descent to the Planck scales when one zooms into the Sun, the planets, the moons and the stars — without
 * spoiling the natural look of the Solar System; the models already built moved to FBS3R, where the hierarchy is; the
 * φ-ladder of everything able to fold into a minimal strip that frees the view. Checked here by running the page's own
 * pure code and reading its wiring:
 *   1. the handover is exact: the rung of the Solar world's view at a body reads the enlarged drawn radius as the true
 *      one, and leaving reads it back — the same identity both ways
 *   2. the chain of anchors: transitions in sequence, every finished one an exact zero, femtometres kept beside megametres
 *   3. a star's radius is estimated, not invented: Torres's bolometric correction and Ballesteros's temperature return
 *      the Sun from the Sun's own numbers
 *   4. the nuclei: ¹⁶O's α-clusters give its point radius; ²⁸Si is 14 + 14 nucleons at the rms radius its charge radius
 *      leaves, none overlapping
 *   5. the lattices: ice Ih's O–O bonds are 2.76 Å and its top oxygen has a free bond; β-cristobalite's Si–O is a√3/8
 *   6. the electrons: every Z_eff the routes use is Slater's rule, computed here
 *   7. the gases and the couplings: the photosphere's hydrogen 20 nm apart at ≈ 12 km/s, Jupiter's H₂ 2.8 nm apart at
 *      1 bar and 165 K; α_s(M_Z) = 0.1180 and falling; φᴺ = F_N·φ + F_{N−1} on both sides of N = 0
 *   8. the surfaces: the noise is periodic in 289 exactly (so the site offset may be reduced), the craters follow
 *      N(>D) ∝ D⁻² by construction, the normals are analytic
 *   9. the Solar world is left as it is: no model is added to it; the sky of the descent is the Solar world's own stars
 *  10. FBS3R: the models on the shells of their rungs at φ⁻² of their true size, placed once without touching
 *  11. the ladder folds: the strip, its steering, its memory; every body has its route; the API
 *  and near the Planck length: two-loop running, gravity's (E/E_P)², a probe and its horizon, the holographic bits
 *  12. below the Planck length only the Hopf fibration (v4.386.2): the rung N ≤ 0 is the torus |z₂| = φᴺ, each sample of
 *      a fibre on it to rounding and carrying its own ψ; the Clifford torus at N = log_φ(1/√2), the mirror of the probe's
 *      crossing; the last fibre the unit circle at the centre; any two fibres linked once (Gauss's integral); no Fibonacci
 *      squares, spiral or matrix left; the last fibre says what a probe that sharp would be
 *  13. the threads and the dive (v4.386.3, v4.387): the GPU's fibre map, read back on the CPU, lies on |z₂| = b and its
 *      lines α₁ − α₂ = φ are Hopf fibres; it is written without cancellation, so float32 holds a tube of 10⁻⁹ magnified
 *      10⁸-fold; below N₁ the magnification keeps the rung's tube fixed while the last fibre stays the unit circle; every
 *      fibre is a tube laid round that exact curve
 *  15. the holographic bits (v4.387): exactly ⌈(π/ln 2)φ²ᴺ⌉ cells, found by the inverse spherical Fibonacci mapping —
 *      the nearest and the next lattice point equal to a brute-force search; the probe's shadow is √27/2·r_s
 *  16. the object stays (v4.387.1, v4.389): in the electroweak band and the desert the view keeps the quark — the Higgs
 *      field's phase round it, agreeing above ħc/v and free below (N_v = log_φ(ħc/v/ℓ_P)), its three charges' field lines
 *      in space at their true scale, every point as bright as its coupling at its own distance, a bead at every
 *      r = ½·10ᵏ m on the sphere the tunnel's ring outlines, turned by the reader's drag and never by the clock — and the
 *      plots live on an instrument in the strip at the top, whose cursor reads the couplings at the reader's rung
 *  17. the scale tunnel (v4.388): a ring's diameter on the screen is the size it names over the view's height (s/L), so
 *      every gate shows for some twelve rungs, a point to past the edge; the gates span a kilometre to ℓ_P with every
 *      power of ten between; the motes zoom as φ^(rung − N) in a window that wraps, and their streaks run at the radial
 *      speed of a zoom, r·ln φ·|dN/dt|
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const grab = (re, what) => { const m = SRC.match(re); if (!m) throw new Error('not found: ' + what); return m[0]; };
const fn = name => { const i = SRC.indexOf('function ' + name + '('); if (i < 0) throw new Error('no function ' + name); let d = 0, j = SRC.indexOf('{', i);
  for (let k = j; k < SRC.length; k++) { const c = SRC[k]; if (c === '{') d++; else if (c === '}') { d--; if (!d) return SRC.slice(i, k + 1); } } throw new Error('unbalanced ' + name); };
const cst = name => grab(new RegExp('const ' + name + '=[^\\n]*\\n'), name);
(async () => {
  /* the little of three.js the page's pure code uses, with three.js's own formulas (the vendored copy is not in the repository) */
  class Vector3 { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } copy(v) { return this.set(v.x, v.y, v.z); } clone() { return new Vector3(this.x, this.y, this.z); }
    add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; } sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
    multiplyScalar(k) { this.x *= k; this.y *= k; this.z *= k; return this; } length() { return Math.hypot(this.x, this.y, this.z); }
    normalize() { const l = this.length() || 1; return this.multiplyScalar(1 / l); } distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
    applyQuaternion(q) { const vx = this.x, vy = this.y, vz = this.z, tx = 2 * (q.y * vz - q.z * vy), ty = 2 * (q.z * vx - q.x * vz), tz = 2 * (q.x * vy - q.y * vx);
      this.x = vx + q.w * tx + q.y * tz - q.z * ty; this.y = vy + q.w * ty + q.z * tx - q.x * tz; this.z = vz + q.w * tz + q.x * ty - q.y * tx; return this; } }
  class Euler { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; } }
  class Quaternion { constructor() { this.x = 0; this.y = 0; this.z = 0; this.w = 1; }
    setFromEuler(e) { const c1 = Math.cos(e.x / 2), c2 = Math.cos(e.y / 2), c3 = Math.cos(e.z / 2), s1 = Math.sin(e.x / 2), s2 = Math.sin(e.y / 2), s3 = Math.sin(e.z / 2);
      this.x = s1 * c2 * c3 + c1 * s2 * s3; this.y = c1 * s2 * c3 - s1 * c2 * s3; this.z = c1 * c2 * s3 + s1 * s2 * c3; this.w = c1 * c2 * c3 - s1 * s2 * s3; return this; } }
  const THREE = { Vector3, Euler, Quaternion };
  const PHI = (1 + Math.sqrt(5)) / 2, LN_PHI = Math.log(PHI), GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)), LP = 1.616255e-35;
  const levelOf = L => Math.log(L / LP) / LN_PHI, levelR = N => LP * Math.exp(N * LN_PHI);
  const mulberry = new Function('return ' + fn('mulberry').replace(/^function mulberry/, 'function'))();
  const DSC = {};
  const lib = new Function('THREE', 'PHI', 'LN_PHI', 'GOLDEN_ANGLE', 'levelOf', 'levelR', 'mulberry', 'DSC',
    [cst('dscSmooth'), fn('dscIntervals'), fn('dscWeights'), fn('dscRelENU'), fn('dscBCV'), grab(/const GYRO_BALL_K=[\s\S]*?const gyroTeffFromBV=[\s\S]*?\);\n/, 'Ballesteros: B−V → T'), fn('dscStarEstimate'),
      fn('dscO16'), fn('dscSi28'), fn('dscIceTop'), fn('dscCristobalite'), fn('dscAlphaS'), fn('dscInvAlphas'), cst('dscQofL'), fn('dscFib'), grab(/const dscPmJ=[^\n]*\n/, 'noise'), fn('dscGrJ'), fn('dscNJ'),
      'const FBS_MOD={k:1/(PHI*PHI)};', fn('fbsModelsPlace'), grab(/const DSC_SHELLS=\{[\s\S]*?\n  H:\[[^\n]*\n/, 'the shells'), grab(/const DSC_H2O=[^\n]*\n/, 'H₂O'),
      'return {dscSmooth,dscIntervals,dscWeights,dscRelENU,dscBCV,gyroTeffFromBV,dscStarEstimate,dscO16,dscSi28,dscIceTop,dscCristobalite,dscAlphaS,dscInvAlphas,dscQofL,dscFib,dscNJ,fbsModelsPlace,DSC_SHELLS,FBS_MOD};'].join('\n'))(
    THREE, PHI, LN_PHI, GOLDEN_ANGLE, levelOf, levelR, mulberry, DSC);
  /* 1 */
  { const enter = /function dscEquivRung\(b\)\{[^\n]*levelOf\(2\*d\*Math\.tan\(camera\.fov\*Math\.PI\/360\)\*b\.R\/dscBodyDrawnR\(b\)\)/.test(SRC);
    const back = /const dAU=levelR\(Math\.max\(N,DSC\.exitN\)\)\/\(2\*Math\.tan\(camera\.fov\*Math\.PI\/360\)\)\*dscBodyDrawnR\(b\)\/b\.R;/.test(SRC);
    const R = 6.371e6, rD = 600 * R / 1.495978707e11, d = 3.0 * rD, fov = 55, t = Math.tan(fov * Math.PI / 360), N = levelOf(2 * d * t * R / rD), dBack = levelR(N) / (2 * t) * rD / R;
    const persp = Math.abs((R / (levelR(N) / (2 * t))) - rD / d) / (rD / d);
    ok('the handover is exact: the view at a body is the rung of 2d·tan(fov/2)·R/r′ (its true size where it is drawn enlarged), and leaving reads that identity backwards — radius/distance, the whole of perspective, unchanged',
      enter && back && Math.abs(dBack - d) / d < 1e-12 && persp < 1e-12, `in ${enter ? '✓' : '✗'} out ${back ? '✓' : '✗'} · Earth ×600 at 3 drawn radii → N ${N.toFixed(3)}, back to ${(dBack / rD).toFixed(12)} r′`); }
  /* 2 */
  { const A = [['centre', [0, 0, 0]], ['site', [0, 0, 6.371e6]], ['cloud', [0, 0, 1500]], ['drop', [24, 18, -20]], ['mol', [1.8e-6, -1.2e-6, 2.1e-6]], ['proton', [1.1e-15, 0.4e-15, -0.9e-15]], ['quark', [0.35e-15, 0, 0]]];
    const I = lib.dscIntervals(A), seq = I.slice(1).every((b, i) => b[0] >= b[1] && (i === 0 || b[0] <= I[i][1])), w = lib.dscWeights(80, I), r = lib.dscRelENU(A, A.length - 1, w);
    const mid = lib.dscRelENU(A, 4, lib.dscWeights(121, I));
    ok('the chain of anchors: each transition runs from a view of 3× its offset to 0.15× in sequence; with every transition done, the position of the deepest anchor is an exact zero — no femtometre is added to six thousand kilometres',
      seq && r.every(x => x === 0) && mid.every(x => Number.isFinite(x)), `intervals ${I.slice(1).map(b => b[0].toFixed(1) + '→' + b[1].toFixed(1)).join(' ')} · rel(quark @ N 80) = [${r.join(', ')}]`); }
  /* 3 */
  { const sun = lib.dscStarEstimate(4.83, 100, 0.65), bc = lib.dscBCV(5772), uses = /dscStarEstimate\(s\.V,plx,s\.bv\)/.test(SRC) && /ESTIMATED: L from V, the parallax and the bolometric correction \(Torres 2010\)/.test(SRC);
    ok('a star’s radius is ESTIMATED and says so: L from V, the parallax and the bolometric correction of Torres (2010), T from B−V (Ballesteros 2012), R = √(L/4πσT⁴) — the Sun’s own V = 4.83 at 10 pc and B−V = 0.65 return it',
      Math.abs(sun.Rsun - 1) < 0.05 && Math.abs(sun.T - 5772) < 30 && Math.abs(bc + 0.07) < 0.04 && uses, `R = ${sun.Rsun.toFixed(3)} R☉ · T = ${sun.T.toFixed(0)} K · BC_V(5772 K) = ${bc.toFixed(3)} · L = ${sun.L.toFixed(3)} L☉`); }
  /* 4 */
  { const O = lib.dscO16(), rmsO = Math.sqrt(O.reduce((s, x) => s + x.p[0] ** 2 + x.p[1] ** 2 + x.p[2] ** 2, 0) / O.length);
    const S = lib.dscSi28(), rmsS = Math.sqrt(S.reduce((s, x) => s + x.p[0] ** 2 + x.p[1] ** 2 + x.p[2] ** 2, 0) / S.length);
    let dmin = 1e9; for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) dmin = Math.min(dmin, Math.hypot(S[i].p[0] - S[j].p[0], S[i].p[1] - S[j].p[1], S[i].p[2] - S[j].p[2]));
    const Rpt = Math.sqrt(3.1224 ** 2 - 0.8409 ** 2 + 0.1155 - 0.033);
    ok('the nuclei: ¹⁶O as four α-clusters has the point radius 2.57 fm that its 2.699 fm charge radius leaves; ²⁸Si is 14 protons and 14 neutrons at exactly the rms point radius its 3.1224 fm charge radius leaves (≈ 3.02 fm), no two nearer than 1.5 fm',
      O.length === 16 && O.filter(x => x.proton).length === 8 && Math.abs(rmsO - 2.57) < 0.05 && S.length === 28 && S.filter(x => x.proton).length === 14 && Math.abs(rmsS - 3.02) < 1e-9 && Math.abs(Rpt - 3.02) < 0.01 && dmin > 1.5,
      `¹⁶O rms ${rmsO.toFixed(3)} fm · ²⁸Si rms ${rmsS.toFixed(4)} fm (from R_ch: ${Rpt.toFixed(3)}) · nearest pair ${dmin.toFixed(2)} fm`); }
  /* 5 */
  { DSC.iceTop = null; const I = lib.dscIceTop(), bl = I.bonds.map(b => Math.hypot(...[0, 1, 2].map(k => I.atoms[b[0]][k] - I.atoms[b[1]][k])));
    const deg = new Map(); I.bonds.forEach(b => { deg.set(b[0], (deg.get(b[0]) || 0) + 1); deg.set(b[1], (deg.get(b[1]) || 0) + 1); });
    const f = I.atoms.findIndex(a => a[5]), up = I.aim[0], dn = I.aim[1], ang = Math.acos((up[0] * dn[0] + up[1] * dn[1] + up[2] * dn[2]) / Math.hypot(...dn)) * 180 / Math.PI;
    const X = lib.dscCristobalite(2, 1), siO = Math.hypot(...[0, 1, 2].map(k => X.O[0].p[k] - X.Si[X.O[0].i][k]));
    ok('the lattices: every hydrogen bond of ice Ih is 2.76 Å, its top oxygen has three bonds and a fourth, upward, with no partner — where one hydrogen dangles at 109.5° from its bond; β-cristobalite’s Si–O is a√3/8 = 1.55 Å with oxygen midway',
      bl.every(x => Math.abs(x - 2.76) < 0.06) && deg.get(f) === 3 && Math.abs(ang - 109.47) < 1 && Math.abs(siO - 7.16 * Math.sqrt(3) / 8) < 1e-9 && X.O.length > 100,
      `${I.atoms.length} O, ${I.bonds.length} bonds ${Math.min(...bl).toFixed(3)}–${Math.max(...bl).toFixed(3)} Å · free OH at ${ang.toFixed(2)}° · Si–O ${siO.toFixed(4)} Å, ${X.Si.length} Si, ${X.O.length} O`); }
  /* 6 */
  { const slater = (Z, cfg) => { /* cfg: [[n, group, count]] in Slater's groups (1s)(2s2p)(3s3p) */ const out = {};
      cfg.forEach(([n, g, c], gi) => { let s = 0; cfg.forEach(([n2, g2, c2], gj) => { if (gj === gi) s += (c2 - 1) * (n === 1 ? 0.30 : 0.35); else if (gj === gi - 1) s += c2 * 0.85; else if (gj < gi - 1) s += c2 * 1.0; }); out[g] = +(Z - s).toFixed(2); });
      return out; };
    const O = slater(8, [[1, '1s', 2], [2, '2sp', 6]]), Si = slater(14, [[1, '1s', 2], [2, '2sp', 8], [3, '3sp', 4]]), Sh = lib.DSC_SHELLS;
    const z = (k, n) => Sh[k].filter(s => s[0] === n).map(s => s[3]);
    ok('the electrons: every screened charge the routes draw is Slater’s rule, computed here — oxygen 1s 7.70, 2s2p 4.55; silicon 1s 13.70, 2s2p 9.85, 3s3p 4.15; hydrogen 1; and the shells hold 8, 14 and 1 electrons’ worth of orbitals',
      z('O', 1).every(v => v === O['1s']) && z('O', 2).every(v => v === O['2sp']) && z('Si', 1).every(v => v === Si['1s']) && z('Si', 2).every(v => v === Si['2sp']) && z('Si', 3).every(v => v === Si['3sp']) && z('H', 1)[0] === 1
        && /const ext=n===1\?6:n===2\?16:30;/.test(SRC),
      `O ${JSON.stringify(O)} · Si ${JSON.stringify(Si)} · sampled in the orbital’s own units`); }
  /* 7 */
  { const k = 1.380649e-23, mH = 1.6735575e-27, nH = 1.2e23, sp = Math.cbrt(1 / nH), v = Math.sqrt(3 * k * 5772 / mH), spJ = Math.cbrt(k * 165 / 1e5);
    const a = lib.dscAlphaS(91.1876), runs = lib.dscAlphaS(10) > a && a > lib.dscAlphaS(1000) && lib.dscAlphaS(1000) > lib.dscAlphaS(1e5);
    let fibOk = true; for (let N = -20; N <= 20; N++) { if (Math.abs(lib.dscFib(N) * PHI + lib.dscFib(N - 1) - Math.pow(PHI, N)) > 1e-9 * Math.max(1, Math.pow(PHI, N))) fibOk = false; }
    ok('the gases and the couplings: the photosphere’s hydrogen at 1.2·10²³ m⁻³ is ≈ 20 nm apart at ≈ 12 km/s; Jupiter’s H₂ at 1 bar and 165 K ≈ 2.8 nm apart; α_s(M_Z) = 0.1180 and falling with energy; φᴺ = F_N·φ + F_{N−1} for N = −20…20',
      Math.abs(sp * 1e9 - 20.3) < 0.2 && Math.abs(v / 1e3 - 12) < 0.3 && Math.abs(spJ * 1e9 - 2.83) < 0.02 && Math.abs(a - 0.118) < 1e-9 && runs && fibOk && /T:165,P:1e5/.test(SRC),
      `${(sp * 1e9).toFixed(2)} nm · ${(v / 1e3).toFixed(2)} km/s · ${(spJ * 1e9).toFixed(3)} nm · α_s(M_Z) ${a.toFixed(4)}, α_s(1 TeV) ${lib.dscAlphaS(1000).toFixed(4)}`); }
  /* 7b */
  { const L2 = new Function('UC_K', 'DSC', 'levelOf', [grab(/const DSC_PL=\(\(\)=>\{[\s\S]*?\}\)\(\);\n/, 'Planck units'), grab(/const DSC_B1=[^\n]*\n/, 'β coefficients'), fn('dscRunTable'), fn('dscInvAlphas2'), cst('dscInvAlphaG'),
      'return {DSC_PL,dscRunTable,dscInvAlphas2,dscInvAlphaG};'].join('\n'))({ hb: 1.054571817e-34, c: 299792458, G: 6.67430e-11, lP: Math.sqrt(1.054571817e-34 * 6.67430e-11 / 299792458 ** 3), mP: Math.sqrt(1.054571817e-34 * 299792458 / 6.67430e-11) }, {}, levelOf);
    const R = L2.dscRunTable(), P = L2.DSC_PL, cross = 0.5 * Math.log(2) / LN_PHI;
    const ok12 = R.c12 && R.c12.Q > 5e12 && R.c12.Q < 3e13, ok23 = R.c23 && R.c23.Q > 1e16 && R.c23.Q < 2e17, aG = L2.dscInvAlphaG(P.EPGeV), mz = L2.dscInvAlphas2(91.1876);
    const inst = ["id:'qcloud'", "id:'ew'", "id:'desert'", "id:'probe'", "id:'bits'", "id:'planck'", "id:'beyond', anchor:'quark', band:[-60,-0.3,0.45]"].every(x => SRC.includes(x)) && /ratio=2\*Math\.pow\(PHI,-2\*N\)/.test(SRC) && /nb=\(Math\.PI\/Math\.LN2\)\*Math\.pow\(PHI,2\*N\)/.test(SRC);
    ok('near the Planck length every instrument is exact where it can be: the gauge couplings run at two loops from M_Z (α₁ = α₂ near 10¹³ GeV, α₂ = α₃ near 10¹⁶–10¹⁷ GeV — no meeting); gravity’s α_G = (E/E_P)² is 1 at ℓ_P; a probe meets its own horizon at L = √2·ℓ_P (N = log_φ√2); a sphere holds (π/ln 2)(R/ℓ_P)² bits; the Planck units are CODATA’s; the mathematics begins only below N = 0',
      ok12 && ok23 && Math.abs(aG - 1) < 1e-12 && Math.abs(mz[0] - 59.02) < 1e-9 && Math.abs(cross - 0.7202) < 1e-3 && Math.abs(P.lP - 1.616255e-35) / 1.616255e-35 < 1e-5 && Math.abs(P.TP - 1.416784e32) / 1.416784e32 < 1e-5 && inst,
      `α₁=α₂ at ${R.c12.Q.toExponential(2)} GeV (1/α ${R.c12.inv.toFixed(2)}) · α₂=α₃ at ${R.c23.Q.toExponential(2)} GeV (1/α ${R.c23.inv.toFixed(2)}) · 1/α_G(E_P) = ${aG} · crossing N = ${cross.toFixed(4)} · T_P = ${P.TP.toExponential(6)} K`); }
  /* 8 */
  { let per = true; for (const p of [[0.3, 1.7, 2.9], [10.1, -4.2, 77.7], [123.4, 55.5, -201.1]]) for (const ax of [0, 1, 2]) { const q = p.slice(); q[ax] += 289; if (Math.abs(lib.dscNJ(...p) - lib.dscNJ(...q)) > 1e-9) per = false; }
    const cr = /dscCratersD\(x,float\(k\),0\.42\*uCrater,r\)/.test(SRC), an = /vec4 dscNd\(vec3 p\)/.test(SRC) && /N=normalize\(mat3\(vM0,vM1,vM2\)\*nl2\)/.test(SRC) && !/dscBump\(normalize\(vNw\)/.test(SRC);
    const off = /const m=v=>\{ const x=v\*R\/lam; return x-289\*Math\.floor\(x\/289\); \}/.test(SRC);
    ok('the drawn surfaces: the gradient noise is periodic in 289 exactly, so each octave is evaluated at (site/λ mod 289) + offset/λ, exact in float32 from the globe to a millimetre; one crater per cell with the same probability in every octave is N(>D) ∝ D⁻²; the normals are the analytic gradients',
      per && cr && an && off, `periodic ${per ? '✓' : '✗'} · crater law ${cr ? '✓' : '✗'} · analytic normals ${an ? '✓' : '✗'} · reduced offsets ${off ? '✓' : '✗'}`); }
  /* 9 */
  { const tick = fn('descentTick'), none = !/dscGalleryTick|gallery/i.test(tick) && !/dscGalleryTick\(/.test(SRC);
    const twins = /if\(!HCC_STAR_MATS\.has\(m\)&&!mw\) return;/.test(SRC), sky = /solarGroup\.visible=false; DSC\.g\.visible=true;/.test(tick) && /uSky\.value=lost\+14\*opaque/.test(SRC);
    ok('the Solar world is left as it is: nothing is added to it — the descent draws only where the Solar world runs out of resolution, in a world of its own; its sky is the Solar world’s own stars and Milky Way (twins sharing their geometry and material), put out by daylight and by matter',
      none && twins && sky, `no gallery ${none ? '✓' : '✗'} · twins of the real sky ${twins ? '✓' : '✗'} · daylight and matter ${sky ? '✓' : '✗'}`); }
  /* 10 */
  { const items = []; const rnd = mulberry(386099); for (let i = 0; i < 400; i++) { const E = Math.pow(10, -15 + 40 * rnd()); items.push({ E, N: levelOf(E) }); } items.sort((a, b) => a.E - b.E);
    lib.fbsModelsPlace(items); const k = lib.FBS_MOD.k; let touch = 0;
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) { const A = items[i], B = items[j], d = A.dir.clone().multiplyScalar(A.E).distanceTo(B.dir.clone().multiplyScalar(B.E)); if (d < 0.5 * k * (A.E + B.E)) touch++; }
    const wired = /try\{ fbsModelsTick\(dt,D\); \}catch/.test(SRC) && /\$\{fbsModelsPanelHTML\(\)\}/.test(SRC) && /label:'▣ models of everything'/.test(SRC) && /o\.position\.copy\(it\.dir\)\.multiplyScalar\(r\); o\.scale\.setScalar\(ext\);/.test(SRC);
    ok('FBS3R: the models of everything stand on the shells of their own rungs (|position| = the true size in shell units), drawn at one common φ⁻² of their true size; placed once on the golden spiral so that no two touch — and the placement holds at every rung, positions and sizes scaling alike',
      Math.abs(k - 1 / (PHI * PHI)) < 1e-15 && touch === 0 && wired, `${items.length} synthetic models, ${touch} touching · k = φ⁻² = ${k.toFixed(6)} · tick, panel and menu ${wired ? '✓' : '✗'}`); }
  /* 11 */
  { const strip = ['id="tsCompact"', 'id="tsStrip"', 'id="tssTrack" role="slider"', 'id="tssHere"', 'id="tssOpen"'].every(x => SRC.includes(x));
    const code = ['function sxFold(', 'function sxStripPaint(', 'function sxStripTick(', 'function sxStripBind(', "const SX_FOLD_KEY='hcc.ladder.compact'"].every(x => SRC.includes(x))
      && /lad\.classList\.contains\('compact'\)\) sxStripTick\(\)/.test(SRC) && /if\(!DSC\.on&&!final&&state\.mode==='solar'&&N<dscTopNow\(\)-0\.3\)\{ descentEnter\(N\); return; \}/.test(SRC) && /#tsLadder\.compact>\*:not\(#tsStrip\)\{display:none!important\}/.test(SRC);
    const look = grab(/const DSC_LOOK=\{[\s\S]*?\n  Triton:[^\n]*\n/, 'the looks'), planets = [...SRC.matchAll(/ \{name:'(\w+)', +a:/g)].map(m => m[1]), moons = [...SRC.matchAll(/ \{name:'(\w+)', +parent:/g)].map(m => m[1]);
    const missing = [...planets.filter(p => p !== 'Earth'), ...moons, 'Moon'].filter(n => !new RegExp('\\b' + n + ':\\{route:').test(look));
    const api = ['enter:', 'exit:', 'go:', 'jump:', 'bodies:', 'body:', 'focused:', 'equivalentRung:', 'stations:', 'anchors:', 'levels:', 'starEstimate:', 'si28:', 'iceTop:', 'cristobalite:', 'noise:'].every(x => grab(/globalThis\.HCC_DESCENT=Object\.freeze\(\{[\s\S]*?\}\);/, 'the API').includes(x));
    ok(`the ladder folds into one slim strip (the rung, its length, the whole ladder as a track — dragged, it flies through the scales and into the descent; remembered); every body has its route (${planets.length} planets and dwarfs, the Moon, ${moons.length} moons, the Sun, the stars); HCC_DESCENT`,
      strip && code && missing.length === 0 && api, `strip ${strip ? '✓' : '✗'} · steering ${code ? '✓' : '✗'} · routes missing: ${missing.join(', ') || 'none'} · API ${api ? '✓' : '✗'}`); }
  /* 12 */
  { const H = new Function('THREE', 'PHI', [cst('dscS3P'), fn('dscHopfArc'), cst('dscHopfB'), cst('dscHopfTheta'), 'return {dscS3P,dscHopfArc,dscHopfB,dscHopfTheta};'].join('\n'))({ Vector3 }, PHI);
    let worst = 0, inBall = true;
    for (const N of [-0.05, -0.3, -0.72, -1, -3, -8, -20]) { const b = H.dscHopfB(N), a = Math.sqrt(1 - b * b), th = H.dscHopfTheta(N);
      for (let k = 0; k < 12; k++) { const ph = 2 * Math.PI * k / 12, P = []; if (!H.dscHopfArc(th, ph, 64, 3.4, P)) continue;
        for (let i = 0; i < P.length; i += 4) { const x = P[i], y = P[i + 1], z = P[i + 2], q = H.dscS3P(a, b, ph, P[i + 3]), r = Math.hypot(x, y, z);
          worst = Math.max(worst, Math.abs(Math.hypot(Math.hypot(x, y) - 1 / a, z) - b / a) / (b / a), Math.hypot(q[0] - x, q[1] - y, q[2] - z) / (1 + r)); if (r > 3.4 + 1e-9) inBall = false; } } }
    const Ncl = Math.log(Math.SQRT1_2) / LN_PHI, cl = Math.abs(H.dscHopfB(Ncl) - Math.SQRT1_2) < 1e-15 && Math.abs(Ncl + 0.5 * Math.log(2) / LN_PHI) < 1e-15;
    const C0 = []; const m0 = H.dscHopfArc(0, 0, 180, 3.4, C0); let core = m0 === -180; for (let i = 0; i < C0.length; i += 4) if (Math.abs(Math.hypot(C0[i], C0[i + 1]) - 1) > 1e-12 || Math.abs(C0[i + 2]) > 1e-12) core = false;
    const loop = (th, ph) => { const P = [], m = H.dscHopfArc(th, ph, 240, 1e9, P), o = []; for (let i = 0; i < P.length; i += 4) o.push([P[i], P[i + 1], P[i + 2]]); return m < 0 ? o : null; };
    const gauss = (A, B) => { let s = 0; for (let i = 0; i < A.length; i++) { const a0 = A[i], a1 = A[(i + 1) % A.length]; for (let j = 0; j < B.length; j++) { const b0 = B[j], b1 = B[(j + 1) % B.length];
          const r = [0, 1, 2].map(t => (a0[t] + a1[t] - b0[t] - b1[t]) / 2), da = [0, 1, 2].map(t => a1[t] - a0[t]), db = [0, 1, 2].map(t => b1[t] - b0[t]);
          const cr = [da[1] * db[2] - da[2] * db[1], da[2] * db[0] - da[0] * db[2], da[0] * db[1] - da[1] * db[0]], d = Math.hypot(...r); s += (r[0] * cr[0] + r[1] * cr[1] + r[2] * cr[2]) / (d * d * d); } } return s / (4 * Math.PI); };
    const lks = [[1.0, 0, 2.0, 1.3], [0, 0, 1.2, 0.4], [1.5, 0.2, 1.5, 2.9], [0.3, 0, 2.6, 4.0]].map(([t1, p1, t2, p2]) => { const A = loop(t1, p1), B = loop(t2, p2); return A && B ? gauss(A, B) : NaN; });
    const lkOk = lks.every(x => Math.abs(Math.abs(x) - 1) < 0.01), axis = H.dscHopfArc(Math.PI, 0.3, 64, 3.4, []) === 0;
    const blk = SRC.slice(SRC.indexOf("D.push({id:'beyond', anchor:'quark'"), SRC.indexOf("/* ── the globe of any body"));
    const wired = /b=dscHopfB\(N\)/.test(blk) && /U\.Ncl=Math\.log\(Math\.SQRT1_2\)\/LN_PHI/.test(blk) && blk.includes('a probe this sharp would be its own black hole') && blk.includes('столь острый зонд стал бы собственной чёрной дырой')
      && !/dscFibTiling|golden spiral|Fibonacci|F_\{N/.test(blk) && !SRC.includes('function dscFibTiling(') && /\['clifford',Math\.log\(Math\.SQRT1_2\)\/LN_PHI,/.test(SRC) && /\['lastfibre',/.test(SRC);
    ok('below the Planck length only the Hopf fibration: the rung N ≤ 0 is the torus |z₂| = φᴺ (radii 1/a, b/a), every sample of every fibre on it to rounding and carrying its own ψ; the Clifford torus at N = log_φ(1/√2) = −0.7202, the mirror of the probe’s crossing; the last fibre the unit circle in the centre; any two fibres linked once; no squares, spiral or matrix; the last fibre labelled with the probe that would be its own black hole',
      worst < 1e-9 && inBall && cl && core && lkOk && axis && wired, `worst ${worst.toExponential(1)} · in the ball ${inBall ? '✓' : '✗'} · Clifford N = ${Ncl.toFixed(6)} ${cl ? '✓' : '✗'} · last fibre ${core ? '✓' : '✗'} · Lk ${lks.map(x => x.toFixed(4)).join(', ')} · axis ${axis ? '✓' : '✗'} · wired ${wired ? '✓' : '✗'}`); }
  /* 13 */
  { const K = new Function('THREE', 'PHI', 'DSC_LOGD_V', 'DSC_LOGD_F', [cst('dscHopfB'), grab(/const DSC_TUBE_V=`[\s\S]*?`;\n/, 'the thread vertex shader'), fn('dscHopfSurf'), grab(/const DSC_DIVE_N1=[^\n]*\n/, 'N₁'), fn('dscDiveK'),
      'return {dscHopfB,DSC_TUBE_V,dscHopfSurf,DSC_DIVE_N1,dscDiveK};'].join('\n'))({}, PHI, '', '');
    const S3P = (a, b, ph, ps) => { const k = 1 / (1 - b * Math.sin(ps)); return [a * Math.cos(ps + ph) * k, a * Math.sin(ps + ph) * k, b * Math.cos(ps) * k]; };
    let torus = 0, fib = 0;
    for (const n of [-0.3, -0.72, -1, -3, -8, -15]) { const b = K.dscHopfB(n), a = Math.sqrt(1 - b * b);
      for (let i = 0; i < 60; i++) { const ph = i * 0.41, ps = i * 1.07, P = K.dscHopfSurf(ps + ph, ps, b, 1, 1e9), Q = S3P(a, b, ph, ps);
        torus = Math.max(torus, Math.abs(Math.hypot(Math.hypot(P[0], P[1]) - 1 / a, P[2]) - b / a) / (b / a)); fib = Math.max(fib, Math.hypot(P[0] - Q[0], P[1] - Q[1], P[2] - Q[2]) / Math.max(b, 1e-9)); } }
    const F = Math.fround, f32 = (a1, a2, b, k) => { const bb = F(b), a = F(Math.sqrt(F(1 - F(bb * bb)))), w = F(bb * F(Math.sin(a2))), q = F(1 / F(1 - w)), dr = F(F(w - F(F(bb * bb) / F(1 + a))) * q), z = F(F(bb * F(Math.cos(a2))) * q), R = F(1 + F(F(k) * dr)); return [F(Math.cos(a1) * R), F(Math.sin(a1) * R), F(F(k) * z)]; };
    let f32e = 0; for (const n of [-20, -33, -41]) { const b = K.dscHopfB(n), k = 0.5 / b; for (let i = 0; i < 40; i++) { const P = f32(0.3, i * 0.157, b, k), D = K.dscHopfSurf(0.3, i * 0.157, b, k); f32e = Math.max(f32e, Math.hypot(P[0] - D[0], P[1] - D[1], P[2] - D[2])); } }
    const tube = N => { const b = K.dscHopfB(N), a = Math.sqrt(1 - b * b); return b / a; }, T1 = tube(K.DSC_DIVE_N1);
    let hold = 0; for (const N of [-1.7, -2.5, -5, -10, -20, -33]) hold = Math.max(hold, Math.abs(K.dscDiveK(N) * tube(N) - T1) / T1);
    const above = [-1.6, -1.2, -0.72, -0.3].every(N => K.dscDiveK(N) === 1);
    let core = 0; for (const k of [1, 37, 4e6]) for (let i = 0; i < 24; i++) { const P = K.dscHopfSurf(i * 0.26, i * 0.77, 0, k); core = Math.max(core, Math.abs(Math.hypot(P[0], P[1]) - 1), Math.abs(P[2])); }
    const glsl = /float dr=\(w-b\*b\/\(1\.0\+a\)\)\*q, z=b\*cos\(a2\)\*q/.test(K.DSC_TUBE_V) && /float R=1\.0\+uK\*dr; return vec3\(cos\(a1\)\*R,sin\(a1\)\*R,uK\*z\)/.test(K.DSC_TUBE_V)
      && /vec3 P=hopfQ\(ps\+ph,ps,b\)/.test(K.DSC_TUBE_V) && /vec3 nr=cos\(tmpl\.y\)\*N0\+sin\(tmpl\.y\)\*B, Q=P\+wr\*nr;/.test(K.DSC_TUBE_V);
    ok('the threads and the dive: the GPU’s fibre map (read back on the CPU) lies on |z₂| = b and its lines α₁ − α₂ = φ are the Hopf fibres; written without cancellation it holds a tube of 10⁻⁹ magnified 10⁸-fold in float32; below N₁ the rung keeps its tube while the last fibre stays the unit circle; above N₁ nothing is magnified; each fibre a tube round that exact curve',
      torus < 1e-12 && fib < 1e-9 && f32e < 1e-5 && hold < 1e-12 && above && core < 1e-12 && glsl, `torus ${torus.toExponential(1)} · fibres ${fib.toExponential(1)} · float32 ${f32e.toExponential(1)} · tube held ${hold.toExponential(1)} · above N₁ ${above ? '✓' : '✗'} · last fibre ${core.toExponential(1)} · shader ${glsl ? '✓' : '✗'}`); }
  /* 15 */
  { const H = new Function(fn('dscSFCell') + '\nreturn dscSFCell;')(), PHg = (1 + Math.sqrt(5)) / 2, mf = (a, b) => a * b - Math.floor(a * b);
    const sfp = (i, n) => { const ph = 2 * Math.PI * mf(i, PHg - 1), ct = 1 - (2 * i + 1) / n, st = Math.sqrt(Math.max(0, 1 - ct * ct)); return [Math.cos(ph) * st, Math.sin(ph) * st, ct]; };
    const rnd = mulberry(387015); let tot = 0, near = 0, next = 0;
    for (const n of [2, 5, 13, 37, 500, 2600, 6800]) { const P = []; for (let i = 0; i < n; i++) P.push(sfp(i, n));
      for (let t = 0; t < 600; t++) { const u = rnd() * 2 - 1, a = rnd() * 2 * Math.PI, s = Math.sqrt(1 - u * u), p = [s * Math.cos(a), s * Math.sin(a), u];
        const D = P.map(q => (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 + (q[2] - p[2]) ** 2).sort((x, y) => x - y), C = H(p, n); tot++;
        if (Math.abs(C.d1 - D[0]) < 1e-12) near++; if (Math.abs(C.d2 - D[1]) < 1e-12) next++; } }
    const wired = /for\(int u=-1;u<=2;u\+\+\) for\(int v=-1;v<=2;v\+\+\)\{ float i=clamp\(F0\*\(float\(u\)\+c0\)\+F1\*\(float\(v\)\+c1\),0\.0,n-1\.0\);/.test(SRC)
      && /nb=\(Math\.PI\/Math\.LN2\)\*Math\.pow\(PHI,2\*N\), n=Math\.max\(1,Math\.ceil\(nb\)\)/.test(SRC) && /sh=ratio\*Math\.sqrt\(27\)\/2/.test(SRC);
    ok('the holographic bits: exactly ⌈(π/ln 2)·φ²ᴺ⌉ cells on the sphere of the view, the Voronoi cells of a spherical Fibonacci lattice found per pixel by the inverse mapping (Keinert et al. 2015) — its nearest and next lattice points equal a brute-force search; the probe’s horizon casts its Schwarzschild shadow, √27/2·r_s',
      near === tot && next === tot && wired, `${near}/${tot} nearest · ${next}/${tot} next · shader and counts ${wired ? '✓' : '✗'}`); }
  /* 16 */
  { const ew = SRC.slice(SRC.indexOf("D.push({id:'ew', anchor:'quark'"), SRC.indexOf("D.push({id:'desert', anchor:'quark'")), de = SRC.slice(SRC.indexOf("D.push({id:'desert', anchor:'quark'"), SRC.indexOf("D.push({id:'probe', anchor:'quark'"));
    const noPlots = !/PlaneGeometry|SphereGeometry|dscLabel\(/.test(ew + de), hig = /Nv=levelOf\(DSC_PL\.hbcGeVm\/246\.22\), A=dscSmooth\(Nv\+1\.2,Nv-1\.2,N\)/.test(ew);
    /* v4.389: the lines are in space at their true scale — every point as bright as the couplings at its own distance r = ρ·L,
       a bead on every line at r = ½·10ᵏ m (the sphere the tunnel's ring of diameter 10ᵏ m outlines), turned by the drag only */
    const lines = /fit=Math\.min\(1,asp\*1\.2\), Lm=levelR\(N\)\*fit/.test(de) && /g\.scale\.setScalar\(vh\*fit\)/.test(de)
      && /iv=dscInvAlphas2\(dscQofL\(rho\*Lm\)\); s\.rho=rho; s\.r=rho\*Lm;/.test(de) && /gain=\(k,al\)=>0\.08\+0\.92\*Math\.pow\(al\/amax,3\)/.test(de)
      && /const r=0\.5\*Math\.pow\(10,e\), rho=r\/Lm/.test(de) && /const tu=2\*Math\.PI\*lr\+l\.ph/.test(de)
      && /g\.quaternion\.copy\(camera\.quaternion\)\.multiply\(rel\)/.test(de) && /const rel=dscDragFrame\(U,0\)/.test(de) && /dscDragPost\(U\); \} \}\);/.test(de);
    /* the bead's sphere and the tunnel's ring are one: ρ·(vh·fit) = (r/(L·fit))·vh·fit = ½·10ᵏ·vh/L, the ring's radius 0.5·s/L·vh */
    const beadRing = [1, 0.62, 0.4].every(fit => { const L = 3.7e-27, vh = 10.4, r = 0.5e-27, rho = r / (L * fit); return Math.abs(rho * vh * fit - 0.5 * 1e-27 / L * vh) < 1e-12; });
    const inst = SRC.includes('<div id="dscInst" class="dscInst" hidden></div>') && ['function dscInstDesert(', 'function dscInstEW(', 'function dscInstTick('].every(x => SRC.includes(x)) && /try\{ dscInstTick\(\); \}catch\(e\)\{\}/.test(SRC);
    const L2 = new Function('UC_K', 'DSC', 'levelOf', [grab(/const DSC_PL=\(\(\)=>\{[\s\S]*?\}\)\(\);\n/, 'Planck units'), 'return DSC_PL;'].join('\n'))({ hb: 1.054571817e-34, c: 299792458, lP: 1.616255e-35, mP: 2.176434e-8 }, {}, levelOf);
    const Nv = levelOf(L2.hbcGeVm / 246.22), fwd = Math.abs(L2.hbcGeVm / 246.22 - 8.014e-19) / 8.014e-19 < 1e-3;
    ok('the object stays: in the electroweak band and the desert the view keeps the quark — the Higgs field’s phase round it, agreeing above ħc/v and free below it, and its three charges’ field lines in space at their true scale, every point as bright as its coupling at its own distance, beads at ½·10ᵏ m on the tunnel’s spheres, turned by the reader’s drag and never by the clock — while the plots (V(|φ|); the running couplings with a cursor at the reader’s rung) live on an instrument in the strip at the top',
      noPlots && hig && lines && beadRing && inst && fwd && Nv > 79 && Nv < 81, `no plot in the scene ${noPlots ? '✓' : '✗'} · ħc/v = ${(L2.hbcGeVm / 246.22).toExponential(3)} m at N_v = ${Nv.toFixed(2)} · Higgs phases ${hig ? '✓' : '✗'} · field lines at true scale, by α_i(ħc/r), turned by the drag ${lines ? '✓' : '✗'} · beads on the tunnel's spheres ${beadRing ? '✓' : '✗'} · instrument ${inst ? '✓' : '✗'}`); }
  /* 17 */
  { const G = new Function('PHI', 'levelOf', grab(/const DSC_GATES=\[[\s\S]*?\]\];\n/, 'the gates') + 'return DSC_GATES;')(PHI, levelOf);
    const tun = fn('dscTunnelTick'), bld = fn('dscTunnelBuild'), mv = grab(/const DSC_MOTE_V=`[\s\S]*?`;\n/, 'the motes');
    const trueSize = /const rpx=0\.5\*q\.s\/L\*H;/.test(tun) && /r=0\.5\*q\.s\/L\*vh/.test(tun) && /if\(rpx<2\|\|rpx>1\.25\*hd\) continue;/.test(tun);
    const H = 800, hd = 0.5 * Math.hypot(1280, H), span = Math.log(1.25 * hd / 2) / Math.log(PHI);
    const sizes = G.map(g => g[0]), sorted = sizes.every((v, i) => !i || v < sizes[i - 1]), ends = Math.abs(sizes[0] - 1e3) < 1e-9 && Math.abs(sizes[sizes.length - 1] - 1.616255e-35) < 1e-40;
    const decades = /for\(let k=7;k>=-35;k--\)\{ const s=Math\.pow\(10,k\);/.test(bld) && /R\.c12/.test(bld) && /R\.c23/.test(bld);
    const zoom = /l=base\+mod\(aSeed\.x\*span-base,span\), rel=l-uN, g=pow\(uPhi,rel\)/.test(mv) && /float S=clamp\(rr\*0\.4812\*uV\*0\.07,-0\.38,0\.38\);/.test(mv) && Math.abs(Math.log(PHI) - 0.4812) < 1e-4;
    const wired = /try\{ dscTunnelTick\(N,dt\); \}catch\(e\)\{/.test(SRC) && /const fade=dscSmooth\(DSC\.top-1,DSC\.top-4,N\)\*dscSmooth\(-0\.3,0\.6,N\)/.test(tun);
    ok('the scale tunnel: a ring’s diameter on the screen is the size it names over the view’s height, so each gate shows for some twelve rungs, a point to past the edge; the gates run from a kilometre to ℓ_P, every power of ten between; the motes zoom as φ^(rung − N) in a wrapping window, their streaks at a zoom’s radial speed r·ln φ·|dN/dt|; it fades at the top and below ℓ_P',
      trueSize && sorted && ends && decades && zoom && wired && span > 11 && span < 14, `true size ${trueSize ? '✓' : '✗'} · ${G.length} named gates, sorted ${sorted ? '✓' : '✗'}, ends ${ends ? '✓' : '✗'} · decades and crossings ${decades ? '✓' : '✗'} · a gate lives ${span.toFixed(1)} rungs · zoom law ${zoom ? '✓' : '✗'} · wired ${wired ? '✓' : '✗'}`); }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('verifier error:', e && e.stack || e); process.exit(1); });
