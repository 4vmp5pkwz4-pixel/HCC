#!/usr/bin/env node
'use strict';
/* ══ THE UNIVERSE IS A RESONATOR — GLOBAL MODES OF S³ AND THE ADDRESS OF MATTER (v4.355) ═══════════════════════════
 * Measured on the atlas's own kernels (core/atlas/extracted.mjs). Checked:
 *   1. the Hopf-adapted basis of shell k has exactly (k+1)² members, each an eigenfunction of the Laplacian with
 *      eigenvalue −k(k+2) (geodesic second differences) and unit norm (quadrature in Hopf coordinates)
 *   2. the addition theorem: their sum Σ Y(x)Y(y)* is the zonal kernel (k+1)U_k(x·y)/2π² to 1e-13
 *   3. the address: its lobe ends at π/(k+1) (→ λ/2), and it is (−1)^k at the antipode — every single-shell address
 *      has an antipodal twin of equal strength
 *   4. the capacity: the Gram rank of any set of targets is ≤ (k+1)²; the 600-cell saturates it up to k = 5 and never
 *      exceeds its 60 antipodal pairs; a beam meets its targets exactly
 *   5. light: F = z₁^a z₂^b (ξ₂ + iξ₃) is a curl eigenfield with eigenvalue m+2, divergence-free, null (E ⊥ B,
 *      |E| = c|B|) with Poynting along the Hopf fibre — and the conjugate structure ξ₂ − iξ₃ fails
 *   6. the light spectrum counts (2n³+3n²−5n)/3 to shell n and approaches Weyl’s 2n³/3; the Casimir sum is 11/120
 *   7. the fish-eye: a flash in light-like shells refocuses fully at the antipode and returns; ω = √(k(k+2)) disperses
 *   8. the cosmos at R = 548.3245 Gly: 1989.10, 1218.07, 889.55 Gly; 21 cm spans ~5·10⁴ shells; Casimir ~10⁻¹²⁹ of Λ
 *   9. wired: declared, routed, drawn, controls, API, relations, ledger with replaying tracks
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { gmodeChebU, gmodeZonal, gmodeTorusY, gmodeTorusList, gmodeTorusNorm, gmodeFrame, gmodeNullF, gmodeNullNorm, gmodeCurlAt, gmodeRng, gmodeRandS3, gmodeNullCheck, gmodeLightDeg, gmodeWeylLight,
    gmodeCasimir, gmodeBeam, gmodeResolution, gmodePulseFocus, gmodeCrystal, gmodeCosmos, gmodeSteady, DISCOVERIES, discoveryTrack, trackRun } = K;
  const rnd = gmodeRng(20261005), dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2] + u[3] * v[3];
  /* 1 · the basis */
  { let counts = true, eig = 0, norm = 0;
    for (let k = 0; k <= 14; k++) counts = counts && gmodeTorusList(k).length === (k + 1) * (k + 1) && new Set(gmodeTorusList(k).map(String)).size === (k + 1) * (k + 1);
    const lap = (f, x, h) => { const B = []; for (const c of [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]) { let v = c.map((ci, i) => ci - dot(c, x) * x[i]); for (const b of B) { const e = dot(v, b); v = v.map((vi, i) => vi - e * b[i]); } const n = Math.hypot(...v); if (n > 1e-6 && B.length < 3) B.push(v.map(t => t / n)); }
      let s = 0; const f0 = f(x); for (const e of B) { const p = x.map((xi, i) => xi * Math.cos(h) + e[i] * Math.sin(h)), m = x.map((xi, i) => xi * Math.cos(h) - e[i] * Math.sin(h)); s += (f(p) - 2 * f0 + f(m)) / (h * h); } return s; };
    for (const k of [1, 2, 3, 5, 7]) for (const [p, q] of gmodeTorusList(k)) { const x = gmodeRandS3(rnd); for (const part of [0, 1]) { const f = y => gmodeTorusY(k, p, q, y)[part], v = f(x); if (Math.abs(v) < 1e-2) continue; eig = Math.max(eig, Math.abs(lap(f, x, 2e-3) + k * (k + 2) * v) / (k * (k + 2) * Math.abs(v))); } }
    /* exact quadrature in Hopf coordinates: dV = cos η sin η dη dφ₁ dφ₂ — Gauss–Legendre in η, uniform in the angles */
    const GL = n => { const x = [], w = []; for (let i = 1; i <= n; i++) { let z = Math.cos(Math.PI * (i - 0.25) / (n + 0.5)), pp = 0; for (let it = 0; it < 60; it++) { let p1 = 1, p2 = 0; for (let j = 1; j <= n; j++) { const p3 = p2; p2 = p1; p1 = ((2 * j - 1) * z * p2 - (j - 1) * p3) / j; } pp = n * (z * p1 - p2) / (z * z - 1); const z1 = z; z = z1 - p1 / pp; if (Math.abs(z - z1) < 1e-15) break; } x.push(z); w.push(2 / ((1 - z * z) * pp * pp)); } return { x, w }; };
    const G = GL(24), NA = 24;
    for (const [k, p, q] of [[0, 0, 0], [3, 1, 2], [4, 0, 0], [6, -2, 2], [9, 3, -4]]) { let s = 0; for (let i = 0; i < G.x.length; i++) { const eta = Math.PI / 4 * (G.x[i] + 1), we = Math.PI / 4 * G.w[i];
        for (let a = 0; a < NA; a++) for (let b = 0; b < NA; b++) { const p1 = 2 * Math.PI * a / NA, p2 = 2 * Math.PI * b / NA, x = [Math.cos(eta) * Math.cos(p1), Math.cos(eta) * Math.sin(p1), Math.sin(eta) * Math.cos(p2), Math.sin(eta) * Math.sin(p2)], y = gmodeTorusY(k, p, q, x);
          s += we * Math.cos(eta) * Math.sin(eta) * (2 * Math.PI / NA) ** 2 * (y[0] * y[0] + y[1] * y[1]); } } norm = Math.max(norm, Math.abs(s - 1)); }
    ok('the Hopf-adapted basis of shell k has exactly (k+1)² members (k ≤ 14), each an eigenfunction with eigenvalue −k(k+2), each of unit norm by exact quadrature',
      counts && eig < 1e-4 && norm < 1e-12, `eigen residual ${eig.toExponential(1)} (finite differences) · norm ${norm.toExponential(1)}`); }
  /* 2 · the addition theorem */
  { let worst = 0; for (let t = 0; t < 25; t++) { const x = gmodeRandS3(rnd), y = gmodeRandS3(rnd); for (const k of [0, 1, 2, 3, 5, 8, 11]) { let s = 0; for (const [p, q] of gmodeTorusList(k)) { const u = gmodeTorusY(k, p, q, x), v = gmodeTorusY(k, p, q, y); s += u[0] * v[0] + u[1] * v[1]; }
      worst = Math.max(worst, Math.abs(s - gmodeZonal(k, dot(x, y))) / gmodeZonal(k, 1)); } }
    ok('the addition theorem: Σ_α Y_kα(x)Y_kα(y)* = (k+1)U_k(x·y)/2π² — the address of a point is a Chebyshev polynomial of the 4-D dot product', worst < 1e-13, `worst ${worst.toExponential(1)} over 175 pairs × shells`); }
  /* 3 · lobe and twin */
  { let zero = 0, twin = 0, ratio = true; for (let k = 1; k <= 40; k++) { const R = gmodeResolution(k); zero = Math.max(zero, Math.abs(gmodeChebU(k, Math.cos(R.psi)))); twin = Math.max(twin, Math.abs(gmodeZonal(k, -1) - (k % 2 ? -1 : 1) * gmodeZonal(k, 1)) / gmodeZonal(k, 1));
      ratio = ratio && R.ratio < 1 && (k < 2 || R.ratio > gmodeResolution(k - 1).ratio); }
    let positive = true; for (let k = 1; k <= 12; k++) for (let i = 1; i < 50; i++) { const psi = Math.PI / (k + 1) * i / 50; positive = positive && gmodeChebU(k, Math.cos(psi)) > 0; }
    ok('the address: the main lobe ends exactly at ψ = π/(k+1) (πR/(k+1) → λ/2 from below: the diffraction limit without a lens) and the address is (−1)^k times itself at the antipode',
      zero < 1e-12 && twin < 1e-12 && ratio && positive && Math.abs(gmodeResolution(40).ratio - 1) < 1e-3, `|U_k| at the first zero ≤ ${zero.toExponential(1)} · twin ${twin.toExponential(1)} · ratio(40) = ${gmodeResolution(40).ratio.toFixed(5)}`); }
  /* 4 · capacity */
  { const C = gmodeCrystal(), unit = C.every(v => Math.abs(Math.hypot(...v) - 1) < 1e-14); let maxDot = -2; for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) maxDot = Math.max(maxDot, dot(C[i], C[j]));
    const closed = C.every(v => C.some(w => Math.hypot(v[0] + w[0], v[1] + w[1], v[2] + w[2], v[3] + w[3]) < 1e-12));
    const ranks = [0, 1, 2, 3, 4, 5, 8, 12].map(k => [k, gmodeBeam(k, C).rank]), sat = ranks.filter(([k]) => k <= 5).every(([k, r]) => r === (k + 1) * (k + 1)), half = ranks.every(([k, r]) => r <= 60 && r <= (k + 1) * (k + 1));
    let bound = true; for (const k of [0, 1, 2, 3]) { const T = []; for (let i = 0; i < (k + 1) * (k + 1) + 5; i++) T.push(gmodeRandS3(rnd)); const B = gmodeBeam(k, T); bound = bound && B.rank === (k + 1) * (k + 1); }
    const T = [gmodeRandS3(rnd), gmodeRandS3(rnd), gmodeRandS3(rnd)], B = gmodeBeam(6, T, [1, -0.5, 0.25]);
    ok('the capacity: random targets beyond (k+1)² never raise the Gram rank above it; the 600-cell (120 unit quaternions, nearest neighbours at 36°) saturates it up to k = 5 and never exceeds its 60 antipodal pairs; a beam meets its targets',
      unit && Math.abs(maxDot - (1 + Math.sqrt(5)) / 4) < 1e-14 && closed && sat && half && bound && B.miss < 1e-6, `ranks ${ranks.map(([k, r]) => k + ':' + r).join(' ')} · beam miss ${B.miss.toExponential(1)}`); }
  /* 5 · light */
  { const R = [[0, 0], [1, 0], [0, 1], [2, 1], [1, 3], [4, 4]].map(([a, b]) => gmodeNullCheck(a, b, 14, 9));
    const lawful = R.every(r => Math.abs(r.kappa - r.n) < 1e-5 && r.eigResidual < 1e-4 && r.divResidual < 1e-4 && r.nullDot < 1e-12 && r.normDiff < 1e-12 && r.poyntingOffHopf < 1e-12);
    /* the conjugate structure: f(z)(ξ₂ − iξ₃) is NOT an eigenfield once f is not constant */
    const bad = (a, b) => { const x = gmodeRandS3(rnd), V = y => { const F = gmodeNullF(a, b, y, 0), Fr = gmodeFrame(y), fr = F.f[0], fi = F.f[1]; return [0, 1, 2, 3].map(i => fr * Fr[1][i] + fi * Fr[2][i]); }, v = V(x), C = gmodeCurlAt(V, x);
      return Math.hypot(...C.curl.map((c, i) => c - (a + b + 2) * v[i])) / Math.hypot(...v); };
    const kill = gmodeNullCheck(0, 0, 4, 1);
    ok('light: F = z₁^a z₂^b(ξ₂ + iξ₃) has curl (m+2)F, zero divergence, E ⊥ B, |E| = c|B| and Poynting |f|²ξ₁ along the Hopf fibre at random points; with ξ₂ − iξ₃ it is not an eigenfield; the lowest light is the Killing shell n = 2',
      lawful && bad(2, 1) > 0.1 && bad(0, 3) > 0.1 && kill.n === 2 && gmodeLightDeg(2) === 6 && gmodeLightDeg(1) === 0, R.map(r => `n=${r.n}: κ=${r.kappa.toFixed(6)}`).join(' · ')); }
  /* 6 · counts and Casimir */
  { let ok1 = true; for (let n = 2; n <= 60; n++) { let s = 0; for (let j = 2; j <= n; j++) s += gmodeLightDeg(j); ok1 = ok1 && s === gmodeWeylLight(n); }
    const weyl = gmodeWeylLight(4000) / (2 * 4000 ** 3 / 3), c = gmodeCasimir(0.08), c2 = gmodeCasimir(0.05);
    ok('light counts (2n³+3n²−5n)/3 to shell n exactly and approaches Weyl’s 2(ΩR/c)³/3 = 2Vω³/(6π²c³); the Casimir sum Σ(n³ − n) regularises to ζ(−3) − ζ(−1) = 11/120',
      ok1 && Math.abs(weyl - 1) < 1e-3 && c.residual < 1e-8 && c2.residual < 1e-8, `Weyl ratio at n = 4000: ${weyl.toFixed(6)} · Casimir ${c.finite.toFixed(9)} vs ${(11 / 120).toFixed(9)}`); }
  /* 7 · fish-eye */
  { const c = gmodePulseFocus(24, true), m = gmodePulseFocus(24, false);
    ok('the fish-eye: a flash in 25 light-like shells (ω = k+1) focuses fully at the antipode after πR/c and returns after 2πR/c; with ω = √(k(k+2)) it disperses',
      Math.abs(c.antipode - 1) < 1e-12 && Math.abs(c.revival - 1) < 1e-12 && m.antipode < 0.995 && m.revival < 0.97, `light-like ${c.antipode.toFixed(6)} / ${c.revival.toFixed(6)} · minimal ${m.antipode.toFixed(4)} / ${m.revival.toFixed(4)}`); }
  /* 8 · the cosmos */
  { const X = gmodeCosmos(548.324513026856039), L = X.shells.map(r => +r.lambdaGly.toFixed(2)), l21 = X.lines.find(l => l.key === '21cm');
    const st = gmodeSteady(1, 0, 0.5), half = gmodeSteady(1e6, 0, 0.5);
    ok('at R = 548.3245 Gly: the shells k = 1, 2, 3 are 1989.10, 1218.07, 889.55 Gly; c/R = 5.78·10⁻²⁰ s⁻¹; the 21-cm line spans ~5·10⁴ shells; the curvature Casimir density is ~10⁻¹³⁰ of the dark energy; a driven atom saturates at one half',
      L[0] === 1989.10 && L[1] === 1218.07 && L[2] === 889.55 && Math.abs(X.cOverR / 5.779e-20 - 1) < 1e-3 && l21.shellsInWidth > 4.9e4 && l21.shellsInWidth < 5.1e4 && X.casimirOverLambda < 1e-129 && X.casimirOverLambda > 1e-131 && st > 0 && st < 0.5 && Math.abs(half - 0.5) < 1e-6,
      `λ = ${L.join(', ')} Gly · 21 cm: ${l21.shellsInWidth.toExponential(2)} shells · Casimir/Λ = ${X.casimirOverLambda.toExponential(2)}`); }
  /* 9 · wired */
  { const ids = ['lightIsContact', 'oneShellIsProjective', 'fishEyeUniverse', 'globalCavity'], D = ids.map(id => DISCOVERIES.find(d => d.id === id));
    let replay = true; for (const id of ids) { const t = discoveryTrack(id); const r = t ? trackRun(t) : null; replay = replay && !!(r && r.ok); }
    const wired = /const gmodeGroup=new THREE\.Group\(\); gmodeGroup\.visible=false; s3Group\.add\(gmodeGroup\);/.test(SRC) && /gmodeGroup\.visible = \(v==='gmode'\);/.test(SRC) && /if\(v==='gmode'&&!gmodeObjs\)\{ gmodeSetup\(\); \}/.test(SRC)
      && /\} else if\(state\.s3view==='gmode'\)\{\n\s*fbsAnimT\+=labDt; updateGmode\(labDt\);/.test(SRC) && /else if\(V==='gmode'\) body = gmodePanelHTML\(\);/.test(SRC) && /if\(V==='gmode'\)\{ gmodeBind\(ctl\); \}/.test(SRC)
      && /\{id:'gmode', category:'geom'/.test(SRC) && /id:'gmode', world:'s3', lab:'gmode',/.test(SRC) && /\['gmodeAtlas','gmode',gmodeGroup,/.test(SRC) && /hccGrip\(\{ id:'gmode',/.test(SRC) && /hccInstrSet\('gmode',gmodeInstrPaint\)/.test(SRC)
      && /\['gmode','act','exact','light lies in the contact planes'/.test(SRC) && /fbs3r_s3_resonator\.json/.test(SRC);
    ok('wired: declared, routed, drawn with its instrument and its grip, controls, API contract, relations to the contact, Hopf and space-form laboratories, and four ledger entries whose tracks replay',
      D.every(Boolean) && D.every(d => d.verifier === 'docs/verify-the-universe-is-a-resonator.cjs' && d.labs.includes('gmode')) && replay && wired); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
