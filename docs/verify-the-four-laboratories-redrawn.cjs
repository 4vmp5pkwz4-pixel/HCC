#!/usr/bin/env node
'use strict';
/* ══ THE FOUR INVARIANCE LABORATORIES, REDRAWN (v4.356) ═══════════════════════════════════════════════════════════
 * Reported: Spinor & Light Cone, Contact & Action, the Holonomy Observatory and Symmetry Discovery looked and worked
 * badly — wire globes, wire cones and graticule cages. Their mathematics is kept; what is drawn is new, and what is
 * drawn is computed. Checked on the drawing code itself, sliced out of index.html:
 *   1. the boosted sky: the aberration the stars are moved by IS the Möbius map ζ → e^{η}ζ of the celestial sphere
 *   2. the Doppler factor the stars are coloured by inverts exactly: γ(1+β cos θ)·γ(1−β cos θ′) = 1
 *   3. circles on the sky stay circles under the drawn aberration (coplanar to rounding), as the theorem says
 *   4. the transported frame on the holonomy sphere comes home turned by Ω = 2π(1 − cos θ), and the drawn rule
 *      (turn −φ cos θ against the moving frame) agrees with an independent step-by-step Levi-Civita transport
 *   5. wired: the premium layers ride on the laboratories' own steps, hide the old cages, keep every contract
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
/* a minimal Vector3, enough for the drawing code */
class V3 { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  clone() { return new V3(this.x, this.y, this.z); } dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; } length() { return Math.hypot(this.x, this.y, this.z); }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; } addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; } normalize() { return this.multiplyScalar(1 / (this.length() || 1)); }
  cross(v) { const x = this.y * v.z - this.z * v.y, y = this.z * v.x - this.x * v.z, z = this.x * v.y - this.y * v.x; this.x = x; this.y = y; this.z = z; return this; }
  applyAxisAngle(k, a) { const c = Math.cos(a), s = Math.sin(a), kd = k.dot(this), kx = k.clone().cross(this); const r = this.clone().multiplyScalar(c).addScaledVector(kx, s).addScaledVector(k, kd * (1 - c)); this.x = r.x; this.y = r.y; this.z = r.z; return this; } }
const grab = name => { const a = SRC.indexOf('function ' + name + '('); if (a < 0) return null; let i = SRC.indexOf('{', a), d = 0; for (let j = i; j < SRC.length; j++) { if (SRC[j] === '{') d++; else if (SRC[j] === '}') { d--; if (d === 0) return SRC.slice(a, j + 1); } } return null; };
const code = grab('pxAberrate');
const pxAberrate = code ? new Function('THREE', code + '\nreturn pxAberrate;')({ Vector3: V3 }) : null;
const rnd = (() => { let s = 20261005; return () => { s = (s * 1664525 + 1013904223) >>> 0; return (s + 0.5) / 4294967296; }; })();
const randDir = () => { const z = 2 * rnd() - 1, p = 2 * Math.PI * rnd(), r = Math.sqrt(1 - z * z); return new V3(r * Math.cos(p), r * Math.sin(p), z); };
/* 1 · aberration is the Möbius map: with the boost along +z and ζ = (x + iy)/(1 − z) (projection from +z), a boost of
   rapidity η scales ζ by e^{−η}… or e^{+η}, by convention — the test finds which and demands it to rounding */
{ let worst = Infinity; const n = new V3(0, 0, 1);
  for (const sgn of [1, -1]) { let w = 0; for (const eta of [0.3, 0.9, 1.7]) for (let t = 0; t < 200; t++) { const d = randDir(), a = pxAberrate(d, n, Math.tanh(eta), 0);
      const zr = d.x / (1 - d.z), zi = d.y / (1 - d.z), s = Math.exp(sgn * eta), wr = zr * s, wi = zi * s, r2 = wr * wr + wi * wi, img = new V3(2 * wr / (r2 + 1), 2 * wi / (r2 + 1), (r2 - 1) / (r2 + 1));
      w = Math.max(w, img.clone().sub(a).length()); } worst = Math.min(worst, w); }
  ok('the boosted sky: the aberration the stars are drawn with is exactly the Möbius map ζ → e^{±η}ζ of the celestial sphere (SL(2,C) acting on CP¹)', !!pxAberrate && worst < 1e-12, `worst ${worst.toExponential(1)} over 600 stars and three rapidities`); }
/* 2 · Doppler */
{ let worst = 0; const n = new V3(0, 0, 1); for (let t = 0; t < 300; t++) { const eta = 2 * rnd(), b = Math.tanh(eta), g = Math.cosh(eta), d = randDir(), a = pxAberrate(d, n, b, 0), D = g * (1 + b * d.dot(n)), Dp = g * (1 - b * a.dot(n)); worst = Math.max(worst, Math.abs(D * Dp - 1)); }
  ok('the Doppler factor the stars are coloured and brightened by inverts exactly: γ(1+β cos θ)·γ(1−β cos θ′) = 1', worst < 1e-12 && /float D=uGamma\*\(1\.0\+uBeta\*c\);/.test(SRC) && /pow\(mix\(1\.0,D,uDop\),4\.0\)/.test(SRC), `worst ${worst.toExponential(1)}`); }
/* 3 · circles stay circles */
{ let worst = 0; for (let t = 0; t < 40; t++) { const ax = randDir(), n = randDir(), half = 0.2 + 1.2 * rnd(), eta = 0.2 + 2.2 * rnd(), psi = 6 * rnd(); let tt = new V3(0, 0, 1); if (Math.abs(ax.dot(tt)) > 0.9) tt = new V3(1, 0, 0);
    const u = ax.clone().cross(tt).normalize(), v = ax.clone().cross(u).normalize(), img = [];
    for (let i = 0; i < 96; i++) { const a = 2 * Math.PI * i / 96, p = ax.clone().multiplyScalar(Math.cos(half)).addScaledVector(u, Math.sin(half) * Math.cos(a)).addScaledVector(v, Math.sin(half) * Math.sin(a)); img.push(pxAberrate(p, n, Math.tanh(eta), psi)); }
    const a = img[0], b = img[32], c = img[64], nn = b.clone().sub(a).cross(c.clone().sub(a)).normalize(), dd = nn.dot(a); worst = Math.max(worst, ...img.map(q => Math.abs(nn.dot(q) - dd))); }
  ok('a circle of stars stays a circle under the drawn aberration (every image coplanar), for random circles, axes, rapidities and turns', worst < 1e-12, `off-plane ≤ ${worst.toExponential(1)}`); }
/* 4 · the transported frame */
{ let worst = 0, rule = 0; for (const th of [0.3, 0.8, 1.2, 1.57, 2.1, 2.7]) { const ct = Math.cos(th), st = Math.sin(th), N = 20000;
    const pos = ph => [st * Math.cos(ph), ct, st * Math.sin(ph)], eth = ph => [ct * Math.cos(ph), -st, ct * Math.sin(ph)], eph = ph => [-Math.sin(ph), 0, Math.cos(ph)];
    let v = eth(0); for (let i = 1; i <= N; i++) { const p = pos(2 * Math.PI * i / N), d = v[0] * p[0] + v[1] * p[1] + v[2] * p[2]; v = v.map((x, k) => x - d * p[k]); const l = Math.hypot(...v); v = v.map(x => x / l); }
    const ang = Math.atan2(v[0] * eph(0)[0] + v[1] * eph(0)[1] + v[2] * eph(0)[2], v[0] * eth(0)[0] + v[1] * eth(0)[1] + v[2] * eth(0)[2]), wrap = x => Math.atan2(Math.sin(x), Math.cos(x));
    worst = Math.max(worst, Math.abs(wrap(ang - wrap(-2 * Math.PI * ct)))); rule = Math.max(rule, Math.abs(wrap(-2 * Math.PI * ct - 2 * Math.PI * (1 - ct)))); }
  ok('the holonomy sphere: a vector carried around a latitude comes home turned by Ω = 2π(1 − cos θ) mod 2π, and the drawn rule (−φ cos θ against the moving frame) is what a step-by-step transport does',
    worst < 1e-3 && rule < 1e-12 && /const vec=ph=>\{ const a=-ph\*ct;/.test(SRC), `stepwise transport vs rule ${worst.toExponential(1)} (20 000 steps, first order) · rule vs Ω ${rule.toExponential(1)}`); }
/* 5 · wired */
{ const wired = /function pxHideOthers\(group,root\)/.test(SRC) && /updateNul=function\(dt\)\{ _pxNul\(dt\); tn\(dt\); \};/.test(SRC) && /updateHol=function\(dt\)\{ _pxHol\(dt\); th\(dt\); \};/.test(SRC)
    && /updateSyd=function\(dt\)\{ _pxSyd\(dt\); ts\(dt\); \};/.test(SRC) && /updateAct=function\(dt\)\{ _pxAct\(dt\); ta\(dt\); \};/.test(SRC)
    && /SKY3D_STARS/.test(grab('pxStarData') || '') && /CONSTELLATIONS/.test(grab('pxNulBuild') || '') && /hccShellMesh|pxGlass/.test(grab('pxHolBuild') || '')
    && /W\.disc\.act\(x,i\/N,br\)/.test(grab('pxSydTick') || '') && /pxActPush\(u,F\[1\]\)/.test(grab('pxActTick') || '');
  const contracts = ['const NUL_STATIONS=', 'const HOL_STATIONS=', 'const ACT_STATIONS=', 'const SYD_WORLDS=', "nulGroup.visible     = v==='nul'", "holGroup.visible     = v==='hol'", "actGroup.visible     = v==='act'", "sydGroup.visible     = v==='syd'"].every(s => SRC.includes(s));
  ok('wired: the premium layers ride on each laboratory’s own step after the parameter-space explorer, draw the real Hipparcos sky and constellations, glass spaces and the groups’ own actions, hide the old cages, and every station contract stays',
    wired && contracts); }
/* 6 · what our sky sees of a global mode (the resonator ↔ the CMB) */
(async () => { const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { gmodeSkyWeights, gmodeSkyHalfK, discoveryTrack, trackRun } = K; let sum = 0; for (const k of [1, 2, 5, 20, 60, 120, 200]) for (const chi of [0.0823, 0.3, 1.2]) sum = Math.max(sum, Math.abs(gmodeSkyWeights(k, chi).sum - 1));
  const chi = 45.121 / 548.324513026856039, w1 = gmodeSkyWeights(1, chi), half = gmodeSkyHalfK(chi, 800), only = gmodeSkyWeights(5, chi).w.every((x, l) => l <= 5), t = discoveryTrack('firstShellsHide'), r = t ? trackRun(t) : null;
  ok('what our sky sees of a shell: the multipole fractions on the last-scattering sphere sum to one (the addition theorem at a point); at R = 548.3 Gly shell 1 is 99.3 % monopole and the first 31 shells show more than half of themselves only as monopole and dipole — structure starts at k = 32; the ledger track replays',
    sum < 1e-11 && Math.abs(w1.w[0] - 0.9932) < 1e-4 && half === 32 && only && !!(r && r.ok), `sum rule ${sum.toExponential(1)} · shell 1 monopole ${w1.w[0].toFixed(4)} · half at k = ${half}`);
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0); })().catch(e => { console.error(e); process.exit(1); });
