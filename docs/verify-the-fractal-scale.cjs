#!/usr/bin/env node
'use strict';
/* ══ THE SCALE OF THE VIEW, ON THE φ-LADDER (v4.383) ══════════════════════════════════════════════════════════════════
 * Reported: the space-time scale was a decimal ruler (1, 2, 5 × 10ⁿ) and said nothing of the fractal ladder the atlas
 * is built on. It is now an instrument of that ladder: the ruler is one rung ℓ_P·φⁿ with the two rungs below it at the
 * golden sections inside it, the glyph is a golden spiral that turns a quarter per rung, and the readout carries the
 * MEASURED fractal (correlation) dimension of matter at that scale from the atlas's own catalogues. Checked here by
 * running the page's code:
 *   1–4. the correlation-dimension estimator returns the known dimension of a volume (3), a sheet (2), a line (1) and
 *        a Cantor dust (ln 8 / ln 3 = 1.893), with the randoms drawn through the window as the atlas draws them
 *   5. the ruler is exactly one rung: for any zoom the chosen rung is drawn between 70 and 70·φ pixels
 *   6. the glyph is a golden spiral, r(θ + π/2) = φ·r(θ), and it turns a quarter per rung
 *   7. the instrument is wired: the measurement runs in a worker on four named samples with their windows, the ladder
 *      carries the census, the living ladder and the measured curves, and each rung opens its card
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const grab = (re, what) => { const m = SRC.match(re); if (!m) throw new Error('not found: ' + what); return m[0]; };
const corrDim = new Function(grab(/function hccCorrDim\(P,R,radii,centers\)\{[\s\S]*?\n  return out; \}/, 'hccCorrDim') + '\nreturn hccCorrDim;')();
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const logspace = (a, b, n) => Array.from({ length: n }, (_, i) => a * Math.pow(b / a, i / (n - 1)));
/* 1–3: a volume, a sheet, a line — the randoms fill the cube; centres stay a largest radius inside it. A line holds
   few randoms near it, so it gets many (the count of randoms near the structure is what sets the noise) */
{ const r = mulberry(3), n = 8000, V = new Float64Array(3 * n), S = new Float64Array(3 * n), L = new Float64Array(3 * n);
  for (let i = 0; i < n; i++) { V[3 * i] = r(); V[3 * i + 1] = r(); V[3 * i + 2] = r(); S[3 * i] = r(); S[3 * i + 1] = r(); S[3 * i + 2] = 0.5; L[3 * i] = r(); L[3 * i + 1] = 0.5; L[3 * i + 2] = 0.5; }
  const run = (P, seed, nR, radii) => { const q = mulberry(seed), R = new Float64Array(3 * nR); for (let i = 0; i < R.length; i++) R[i] = q(); const hi = radii[radii.length - 1], c = [];
    while (c.length < 1500) { const k = Math.floor(q() * n); if ([0, 1, 2].every(a => P[3 * k + a] === 0.5 || (P[3 * k + a] > hi && P[3 * k + a] < 1 - hi))) c.push(k); }
    const out = corrDim(P, R, radii, c).filter(p => p.pairs >= 1000); return out.reduce((s, p) => s + p.D, 0) / out.length; };
  const dV = run(V, 11, 32000, logspace(0.03, 0.15, 8)), dS = run(S, 12, 32000, logspace(0.03, 0.15, 8)), dL = run(L, 13, 200000, logspace(0.04, 0.15, 8));
  ok('the estimator returns the dimension of a uniform volume (3), of a sheet (2) and of a line (1), each counted against randoms that fill the cube',
    Math.abs(dV - 3) < 0.08 && Math.abs(dS - 2) < 0.08 && Math.abs(dL - 1) < 0.08, `volume ${dV.toFixed(3)} · sheet ${dS.toFixed(3)} · line ${dL.toFixed(3)}`); }
/* 4: a Cantor dust — 8 of 27 subcubes kept at every level. Five levels carry a finite-level excess over two decades,
   so the estimator is held to the direct Grassberger–Procaccia slope of the same points, and that to ln 8 / ln 3 */
{ const r = mulberry(5), lev = 5, pts = [];
  const rec = (x, y, z, s, k) => { if (k === lev) { pts.push(x + s * r(), y + s * r(), z + s * r()); return; } const t = s / 3; for (const a of [0, 2]) for (const b of [0, 2]) for (const c of [0, 2]) rec(x + a * t, y + b * t, z + c * t, t, k + 1); };
  rec(0, 0, 0, 1, 0); const P = Float64Array.from(pts), n = P.length / 3, q = mulberry(13), R = new Float64Array(3 * 100000); for (let i = 0; i < R.length; i++) R[i] = q();
  const lo = Math.pow(3, -4), hi = Math.pow(3, -2), c = []; while (c.length < 2000) { const k = Math.floor(q() * n); if ([0, 1, 2].every(a => P[3 * k + a] > hi && P[3 * k + a] < 1 - hi)) c.push(k); }
  const out = corrDim(P, R, logspace(lo, hi, 13), c).filter(p => p.pairs >= 1000), D = out.reduce((s, p) => s + p.D, 0) / out.length, want = Math.log(8) / Math.log(3);
  let a = 0, b = 0; for (const k of c.slice(0, 1200)) { const x = P[3 * k], y = P[3 * k + 1], z = P[3 * k + 2]; for (let j = 0; j < n; j++) { if (j === k) continue; const dx = P[3 * j] - x, dy = P[3 * j + 1] - y, dz = P[3 * j + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d <= lo * lo) a++; if (d <= hi * hi) b++; } }
  const gp = Math.log(b / a) / Math.log(hi / lo);
  ok('it returns the dimension of a fractal: on a Cantor dust (8 of 27 subcubes kept at every level, five levels) it agrees with the direct Grassberger–Procaccia slope of the same points, and both with ln 8 / ln 3 = 1.893 to the finite-level excess',
    Math.abs(D - gp) < 0.05 && Math.abs(gp - want) < 0.1 && Math.abs(D - want) < 0.12, `${n} points · estimator ${D.toFixed(3)} · direct slope ${gp.toFixed(3)} · ln 8/ln 3 ${want.toFixed(3)}`); }
/* 5: the ruler is one rung */
{ const FBS = { lP: 1.616255e-35 }, LN_PHI = Math.log((1 + Math.sqrt(5)) / 2), levelR = N => FBS.lP * Math.exp(N * LN_PHI);
  const ruler = new Function('FBS', 'LN_PHI', 'levelR', grab(/function sxRungRuler\(ppm,lo\)\{[^\n]*\}/, 'sxRungRuler') + '\nreturn sxRungRuler;')(FBS, LN_PHI, levelR);
  const phi = (1 + Math.sqrt(5)) / 2; let worst = 0, okAll = true; const r = mulberry(9);
  for (let i = 0; i < 2000; i++) { const ppm = Math.pow(10, -30 + 60 * r()), R = ruler(ppm, 70); if (!(Number.isInteger(R.n) && R.px >= 70 * (1 - 1e-9) && R.px < 70 * phi * (1 + 1e-9))) okAll = false; worst = Math.max(worst, R.px); }
  ok('the ruler is exactly one rung: for every zoom over sixty decades the integer rung ℓ_P·φⁿ drawn lies between 70 and 70·φ pixels, with the rungs below at the golden sections inside it',
    okAll && /#tsBar \.g1\{left:61\.8%\} #tsBar \.g2\{left:38\.2%/.test(SRC), `2000 zooms · widest ${worst.toFixed(2)} px < ${(70 * phi).toFixed(2)}`); }
/* 6: the glyph */
{ const sp = new Function(grab(/function sxSpiralPath\(rMax,turns\)\{[\s\S]*?return 'M'\+P\.map\(p=>p\[0\]\.toFixed\(3\)\+' '\+p\[1\]\.toFixed\(3\)\)\.join\(' L'\); \}/, 'sxSpiralPath') + '\nreturn sxSpiralPath;')();
  const d = sp(11.5, 2.25), P = d.slice(1).split(' L').map(s => s.trim().split(' ').map(Number)), phi = (1 + Math.sqrt(5)) / 2;
  let th = [], prev = null, acc = 0; for (const [x, y] of P) { const a = Math.atan2(y, x); if (prev != null) { let da = a - prev; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; acc += da; } th.push(acc); prev = a; }
  const rr = P.map(([x, y]) => Math.hypot(x, y)); let worst = 0;
  for (let i = 0; i < P.length; i++) { const j = th.findIndex(t => t >= th[i] + Math.PI / 2 - 1e-9); if (j < 0) break; const tq = th[i] + Math.PI / 2, f = (tq - th[j - 1]) / (th[j] - th[j - 1]), rq = rr[j - 1] + f * (rr[j] - rr[j - 1]); worst = Math.max(worst, Math.abs(rq / rr[i] / phi - 1)); }
  ok('the glyph is a golden spiral — a quarter-turn grows it by φ, r(θ + π/2) = φ·r(θ) — and it turns a quarter per rung of the view',
    worst < 0.01 && /sp\.setAttribute\('transform',`rotate\(\$\{\(-\(Nv%4\)\*90\)\.toFixed\(2\)\}\)`\)/.test(SRC), `max deviation ${(100 * worst).toFixed(3)} %`); }
/* 7: wiring */
{ const w = [
    /const src=\[hccCorrDim,webLogGamma,webPairCounts,webWp,webPowerFit\]\.map\(f=>f\.toString\(\)\)/.test(SRC) && /new Worker\(URL\.createObjectURL\(new Blob\(\[src\],\{type:'text\/javascript'\}\)\)\)/.test(SRC),
    ["key:'gaia'", "key:'hip'", "key:'gal'", "key:'qso'"].every(k => SRC.includes(k)),
    /window: the 50-pc ball/.test(SRC) && /isotropic directions — so the disc and the clusters count as structure/.test(SRC) && /the sky mask of the cosmic-web study/.test(SRC) && /distances shuffled among them — a compilation, not a survey/.test(SRC),
    /pts:\(\(res\[i\]&&res\[i\]\.cd\)\|\|\[\]\)\.filter\(p=>p\.pairs>=200&&Number\.isFinite\(p\.D\)\)/.test(SRC),
    /SX_STATE\.census=phiRungCensus\(\)/.test(SRC) && /fbsLivingRows\(\)/.test(SRC.slice(SRC.indexOf('function sxLadderPaint'))),
    /c=hccRungContents\(N,0\.5\)/.test(SRC) && /data-tsfly="1"/.test(SRC) && /data-tsfbs="1"/.test(SRC) && /hccRungInspectorOpen\(N\)/.test(SRC),
    /N = ln\(R\/ℓ_P\)\/ln φ is a coordinate: the φ-ladder auditor finds no excess of measured scales at φ spacing/.test(SRC),
    !/function sxNice\(/.test(SRC) && !/const SX_UNITS=/.test(SRC),
    /wp:s\.wp\?webPowerFit\(webWp\(s\.wp\.D,s\.wp\.R\),0\.5,10\):null/.test(SRC) && /D:3-g\*xb\/\(1\+xb\)/.test(SRC),
    /if\(p\.N>270&&p\.D>=2\.95&&p\.N<hN\)/.test(SRC)];
  ok('the instrument is wired: the measurement runs in a worker on four named samples whose windows are stated, only well-counted radii are kept, the ladder carries the census and the living ladder, every rung opens its card (fly there, the same rung in FBS3R, everything on it), the coordinate is called a coordinate, the decimal ruler is gone, below 10 Mpc the galaxies are read from their projected w_p (D₂ = 3 − γξ̄/(1+ξ̄)), and the scale where matter turns uniform is marked where it is measured',
    w.every(Boolean), w.map(x => x ? '✓' : '✗').join('')); }
console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
