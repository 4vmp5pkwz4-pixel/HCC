#!/usr/bin/env node
'use strict';
/* ══ THE PHASE TRANSITION OF A LEVEL, THE SPACE-TIME SCALE AND THE TIME MACHINE'S 0 (v4.380) ═════════════════════════
 * A level with many things on it is a continuum of light from afar and a crowd of members from near. The atlas draws
 * the transition between the two with one order parameter — the share of members that stand apart at the current
 * resolution, ψ = exp(−π k²/s²) for members scattered at random (s the neighbours' spacing in pixels, k = 2 px) — in
 * the galaxies of the Sun→Cosmos world, in the living Milky Way and Andromeda, and in the measured universe laid on the
 * φ-ladder. Checked here, by running the code the page runs:
 *   1. the order parameter is the Poisson nearest-neighbour law (Monte Carlo on a periodic field)
 *   2. a member spread into the continuum keeps its light (p0² = ps²·vPhA), and the continuum cap is not reached at
 *      the transition itself
 *   3. the spacing grid reads a uniform disc's spacing, and a dense core's members cross after a sparse halo's
 *   4. every cloud is wired, the ladder carries the measured universe, and the dial shows ψ
 *   5. the space-time scale: round lengths, the unit chosen, seventeen landmarks in order, light time t = L/c
 *   6. the time machine's 0: the first instant the J2000 day count can hold after t = 0, and the thermal epochs in order
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const grab = (re, what) => { const m = SRC.match(re); if (!m) throw new Error('not found: ' + what); return m[0]; };
/* a seeded generator, the page's own (mulberry32) */
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* 1 — the order parameter is the Poisson law */
{ const N = 20000, r = mulberry(7), X = new Float64Array(N), Y = new Float64Array(N);
  for (let i = 0; i < N; i++) { X[i] = r(); Y[i] = r(); }
  const G = 100, cells = Array.from({ length: G * G }, () => []);
  for (let i = 0; i < N; i++) cells[Math.floor(X[i] * G) + G * Math.floor(Y[i] * G)].push(i);
  const nn = new Float64Array(N);
  for (let i = 0; i < N; i++) { const cx = Math.floor(X[i] * G), cy = Math.floor(Y[i] * G); let best = Infinity;
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) { const c = ((cx + dx + G) % G) + G * ((cy + dy + G) % G);
      for (const j of cells[c]) { if (j === i) continue; let ux = Math.abs(X[i] - X[j]), uy = Math.abs(Y[i] - Y[j]); ux = Math.min(ux, 1 - ux); uy = Math.min(uy, 1 - uy); const d = ux * ux + uy * uy; if (d < best) best = d; } }
    nn[i] = Math.sqrt(best); }
  const spacing = 1 / Math.sqrt(N), k = 2, rows = [];
  let worst = 0;
  for (const s of [2, 3, 4, 6, 10]) { const px = spacing / s, mc = nn.filter(d => d > k * px).length / N, th = Math.exp(-Math.PI * k * k / (s * s)); worst = Math.max(worst, Math.abs(mc - th)); rows.push(`s=${s}: MC ${mc.toFixed(3)} · law ${th.toFixed(3)}`); }
  const glsl = /float hccPhasePsi\(float s, float k\)\{ return exp\(-3\.14159265\*k\*k\/max\(s\*s,1e-12\)\); \}/.test(SRC);
  ok('the order parameter is the 2-D Poisson nearest-neighbour law: the share of 20 000 random members with no neighbour within 2 px is exp(−π·2²/s²) at every spacing s (|Δ| < 0.01), and it is what the shaders compute',
    worst < 0.01 && glsl && /smoothstep\(-0\.035,0\.035,psi_-aU\)/.test(SRC), rows.join(' · ') + ` · worst |Δ| ${worst.toFixed(4)}`); }

/* 2 — the same light in either phase */
{ const vs = grab(/const hccPhaseVS=\(mvv,ell,sc\)=>`[\s\S]*?`;/, 'hccPhaseVS');
  const psiOf = s => Math.exp(-Math.PI * 4 / (s * s)), sOf = q => 2 / Math.sqrt(Math.log(1 / q) / Math.PI);
  const light = (p0, s, pr) => { const sd = s * pr, c = 0, psi = psiOf(s), pc = Math.min(2.4 * sd, 28 * pr) * (1 - psi) + 4 * pr * psi, ps = Math.max(p0, pc) * (1 - c) + p0 * c;
    const vPhA = (p0 * p0) / (ps * ps) * Math.min(1, ps * ps) * (Math.min(1, 1.5 * sd * sd / (p0 * p0)) * (1 - c) + c); return { ps, L: Math.max(ps, 1) ** 2 * vPhA }; };
  let worst = 0; const rows = [], cases = [];
  for (const p0 of [1.5, 2.2, 3.0, 3.6]) for (const q of [0.25, 0.5, 0.75, 0.9]) cases.push([p0, sOf(q)]);
  cases.push([4.8, sOf(0.5)]);
  for (const [p0, s] of cases) { const { L } = light(p0, s, 1); worst = Math.max(worst, Math.abs(L - p0 * p0) / (p0 * p0)); }
  for (const s of [0.25, 0.5, 1]) { const { L } = light(2.2, s, 1); rows.push(`deep continuum s=${s} px: ${(L / (2.2 * 2.2)).toFixed(3)} of the light`); }
  ok('a member spread into the continuum keeps its light — ps²·vPhA = p0² across ψ = ¼ … 0.9 for members up to 3.6 px, and at the critical point ψ = ½ (s = 4.26 px) up to 4.8 px — and only deep in the glow is the surface brightness held under a quarter of white',
    worst < 1e-9 && /vPhA=\(p0_\*p0_\)\/\(ps_\*ps_\)\*min\(1\.0,ps_\*ps_\)/.test(vs) && /\*mix\(min\(1\.0,1\.5\*sd_\*sd_\/\(p0_\*p0_\)\),1\.0,c_\)/.test(vs) && /pc_=mix\(min\(2\.4\*sd_,28\.0\*uPhPr\),2\.0\*uPhK\*uPhPr,psi_\)/.test(vs),
    `worst relative error ${worst.toExponential(1)} over ${cases.length} cases · ` + rows.join(' · ')); }

/* 3 — the spacing grid */
{ const fn = grab(/function hccPhaseSpacing\(pos,n\)\{[\s\S]*?\n  return ell; \}/, 'hccPhaseSpacing');
  const hccPhaseSpacing = new Function(fn + '\nreturn hccPhaseSpacing;')();
  const r = mulberry(11), N = 30000, R = 5, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const rr = R * Math.sqrt(r()), a = 2 * Math.PI * r(); pos[i * 3] = rr * Math.cos(a); pos[i * 3 + 1] = 0.01 * (r() - 0.5); pos[i * 3 + 2] = rr * Math.sin(a); }
  const ell = Array.from(hccPhaseSpacing(pos, N)).sort((a, b) => a - b), med = ell[N >> 1], want = R * Math.sqrt(Math.PI / N);
  /* a dense core inside a sparse halo */
  const M = 20000, P2 = new Float32Array(M * 3);
  for (let i = 0; i < M; i++) { const core = i < M / 2, rr = (core ? 0.5 : 5) * Math.sqrt(r()), a = 2 * Math.PI * r(); P2[i * 3] = rr * Math.cos(a); P2[i * 3 + 1] = 0; P2[i * 3 + 2] = rr * Math.sin(a); }
  const e2 = hccPhaseSpacing(P2, M); let core = 0, halo = 0, nc = 0, nh = 0;
  for (let i = 0; i < M; i++) { const d = Math.hypot(P2[i * 3], P2[i * 3 + 2]); if (d < 0.4) { core += e2[i]; nc++; } else if (d > 2) { halo += e2[i]; nh++; } }
  ok('the density grid reads a uniform disc\'s projected spacing R√(π/N) (within 25 %), and a dense core\'s members are given a finer spacing than a sparse halo\'s — so the halo crosses first and the core last',
    Math.abs(med / want - 1) < 0.25 && core / nc < 0.5 * halo / nh, `median ℓ ${med.toExponential(3)} vs R√(π/N) ${want.toExponential(3)} · core ℓ ${(core / nc).toExponential(2)} < halo ℓ ${(halo / nh).toExponential(2)}`); }

/* 4 — wiring */
{ const w = [
    /P\.userData\.hop=\{spacing:R\/Math\.cbrt\(Math\.max\(1,pos\.length\/3\)\), what:'star'\}; return hccPhaseCloud\(P\);/.test(SRC),
    /grp\.add\(hccPhaseCloud\(gs,s\.name\|\|s\.key\)\);/.test(SRC),
    /hccPhaseLiving\(P,\['Milky Way','Млечный Путь','Milchstraße'\],M\.Rmax\);/.test(SRC),
    /hccPhaseLiving\(M31_LIVING\.stars,\['Andromeda','Андромеда','Andromeda'\],D\.Rmax\);/.test(SRC),
    /try\{ fbsSkyTick\(D\); \}catch\(e\)/.test(SRC),
    /aE\[i\]=Math\.sqrt\(4\*Math\.PI\/m\.get\(Math\.floor\(aN\[i\]\)\)\);/.test(SRC),
    /float rs=exp\(\(aN-uD\)\*uLnPhi\);/.test(SRC),
    /<button id="tmPhase" type="button" hidden/.test(SRC) && /try\{ hccPhaseTick\(\); \}catch\(e\)\{\}/.test(SRC),
    /globalThis\.HCC_PHASE_INFO=/.test(SRC)];
  ok('every star cloud takes the transition (galaxies, the spiral fallback, the living Milky Way and Andromeda), the φ-ladder carries the measured universe on the rungs of its measured distances, and the dial reads ψ of the level crossing now',
    w.every(Boolean), w.map(x => x ? '✓' : '✗').join('')); }

/* 5 — the space-time scale */
{ const nice = new Function(grab(/function sxNice\(v\)\{[^\n]*\}/, 'sxNice') + '\nreturn sxNice;')();
  const U = new Function('return ' + grab(/\[\['m',1\],\['km',1e3\],\['AU',1\.495978707e11\][^;]*\]/, 'SX_UNITS'))();
  const unit = new Function('SX_UNITS', grab(/function sxUnit\(m\)\{[^\n]*\}/, 'sxUnit') + '\nreturn sxUnit;')(U);
  const light = new Function(grab(/function sxLight\(sec\)\{[^\n]*\}/, 'sxLight') + '\nreturn sxLight;')();
  const LM = new Function('return ' + grab(/\[\[1\.616255e-35,'Planck length'[^\n]*\]\];/, 'SX_LANDMARKS').replace(/;$/, ''))();
  const sorted = LM.every((x, i) => i === 0 || x[0] > LM[i - 1][0]);
  const n1 = [0.7, 3.3, 7, 1.0, 19].map(nice).join(','), u1 = [5e2, 5e8, 3e14, 2e17, 4e25].map(m => unit(m)[0]).join(',');
  ok('the space-time scale: a round length (1, 2 or 5 × 10ⁿ), its unit (m … Gly; AU from a hundredth of an AU), the light time t = L/c, and seventeen landmarks from the Planck length to the observable universe in order',
    n1 === '0.5,2,5,1,10' && u1 === 'm,km,AU,ly,Gly' && light(1.495978707e11 / 299792458) === '8.3 min' && LM.length === 17 && sorted,
    `nice ${n1} · units ${u1} · 1 AU of light ${light(1.495978707e11 / 299792458)} · ${LM.length} landmarks`); }

/* 6 — the time machine's 0 and the thermal epochs */
{ const ulp = new Function(grab(/function hccEpochUlpDays\(x\)\{[^\n]*\}/, 'hccEpochUlpDays') + '\nreturn hccEpochUlpDays;')();
  const A = 13.707; let E = -A * 365.25e9, k = 0; for (; k < 16 && !(A + E / 365.25 / 1e9 > 0); k++) E += ulp(E);
  const t = A + E / 365.25 / 1e9, res = ulp(E) / 365.25e9, resSec = res * 3.15576e16;
  const handler = /for\(let k=0;k<16&&!\(A\+E\/365\.25\/1e9>0\);k\+\+\) E\+=hccEpochUlpDays\(E\);/.test(SRC) && /'t ≈ 0 · '\+TT\('the Big Bang'/.test(SRC);
  const HZ_EVENTS = { eq: 1 / 3420.4, lss: 1 / 1090.9, accel: 1 / 1.6312 }, TT = a => a;
  const at = new Function('HZ_EVENTS', 'TT', grab(/function hccEpochAt\(a\)\{[\s\S]*?return ''; \}/, 'hccEpochAt') + '\nreturn hccEpochAt;')(HZ_EVENTS, TT);
  const seq = [1e-11, 1e-9, 4e-9, 1e-4, 5e-4, 0.01, 0.1, 0.5, 1].map(at), distinct = new Set(seq).size === seq.length;
  ok('0 is the first instant the J2000 day count can hold after the Big Bang (t > 0, within two clock steps of about 84 s), and running forward passes the thermal epochs in order — coupled neutrinos, e⁺e⁻ annihilation, nucleosynthesis, radiation, matter, the dark ages, the dawn, galaxies, dark energy',
    t > 0 && t <= 2 * res && Math.abs(resSec - 84.375) < 1 && handler && distinct && seq[2].startsWith('nucleosynthesis') && seq[8] === 'dark energy dominates',
    `t₀ = ${(t * 3.15576e16).toFixed(1)} s after the Big Bang · clock step ${resSec.toFixed(1)} s · ${seq.length} epochs`); }
console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
