#!/usr/bin/env node
'use strict';
/* ══ THE HOPF FIBRATION, RAYMARCHED (v4.394) ════════════════════════════════════════════════════════════════════════
 * The Hopf laboratory can draw its bundle by raymarching: each ray's point is pulled back to S³, turned in 4D and sent to
 * the base by the Hopf map, and the distance in S³ to a whole fibre is read off the base. Checked here on the page's own
 * CPU twins of the shader:
 *   1. the submersion: the distance in S³ from x to the fibre over b is exactly asin(|π(x) − b|/2) — against a brute-force
 *      minimum over the fibre
 *   2. the lookup: the nearest point of an N-point spherical Fibonacci lattice by the four corners of its parastichy cell
 *      (Keinert et al. 2015) equals the brute-force nearest — everywhere, at the poles and on the seam, N from 64 to 16 384
 *   3. the step is safe: a step of R³-length d(1 + r_m²)/2 (r_m the smallest |y| it may reach) never covers more than d of
 *      S³ — so no fibre is ever stepped over; and the shader computes exactly the twins' formulas
 *   4. the 4D turn (e^{iχ₁}z₁, e^{iχ₂}z₂) sends fibres to fibres: the base turns about its pole by χ₁ − χ₂
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const grab = (re, what) => { const m = SRC.match(re); if (!m) throw new Error('not found: ' + what); return m[0]; };
const fn = name => { const i = SRC.indexOf('function ' + name + '('); if (i < 0) throw new Error('no function ' + name); let d = 0, j = SRC.indexOf('{', i);
  for (let k = j; k < SRC.length; k++) { const c = SRC[k]; if (c === '{') d++; else if (c === '}') { d--; if (!d) return SRC.slice(i, k + 1); } } throw new Error('unbalanced ' + name); };
try {
  const PHI = (1 + Math.sqrt(5)) / 2;
  const H = new Function('PHI', [fn('hopfSfPoint'), fn('hopfSfNearest4'), grab(/const hopfMapS2=[^\n]*\n/, 'π'), grab(/const hopfFibreDist=[^\n]*\n/, 'the distance'), 'return {hopfSfPoint,hopfSfNearest4,hopfMapS2,hopfFibreDist};'].join('\n'))(PHI);
  let s = 3; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const randS3 = () => { const g = [0, 0, 0, 0].map(() => { let u = 0; while (!u) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); }), l = Math.hypot(...g); return g.map(x => x / l); };
  /* 1 */
  { let worst = 0; for (let t = 0; t < 300; t++) { const x = randS3(), y = randS3(), b = H.hopfMapS2(y);
      /* the fibre over b, through y: e^{iψ}·y; the geodesic distance from x to its points, minimised */
      let m = 9; for (let i = 0; i < 4000; i++) { const p = 2 * Math.PI * i / 4000, c = Math.cos(p), sn = Math.sin(p), w = [c * y[0] - sn * y[1], sn * y[0] + c * y[1], c * y[2] - sn * y[3], sn * y[2] + c * y[3]];
        m = Math.min(m, Math.acos(Math.max(-1, Math.min(1, x[0] * w[0] + x[1] * w[1] + x[2] * w[2] + x[3] * w[3])))); }
      worst = Math.max(worst, Math.abs(m - H.hopfFibreDist(x, b))); }
    ok('the submersion: the distance in S³ from a point to the whole fibre over b is asin(|π(x) − b|/2), against a brute-force minimum over the fibre', worst < 2e-6, `worst ${worst.toExponential(1)} rad over 300 random pairs (the brute force samples the fibre every 2π/4000)`); }
  /* 2 */
  { let bad = 0, tot = 0; for (const n of [64, 600, 2400, 16384]) { const P = []; for (let i = 0; i < n; i++) P.push(H.hopfSfPoint(i, n));
      for (const mode of ['any', 'poles', 'seam']) for (let t = 0; t < (n > 5000 ? 400 : 1500); t++) { let u = rnd() * 2 - 1, a = rnd() * 2 * Math.PI; if (mode === 'poles') u = (rnd() < 0.5 ? 1 : -1) * (1 - 0.02 * rnd()); if (mode === 'seam') a = Math.PI + (rnd() - 0.5) * 0.02;
        const r = Math.sqrt(Math.max(0, 1 - u * u)), p = [r * Math.cos(a), r * Math.sin(a), u]; let bc = -2; for (const q of P) bc = Math.max(bc, q[0] * p[0] + q[1] * p[1] + q[2] * p[2]);
        const k = H.hopfSfNearest4(p, n), b = H.hopfSfPoint(k, n), c = b[0] * p[0] + b[1] * p[1] + b[2] * p[2]; tot++; if (Math.acos(Math.min(1, c)) - Math.acos(Math.min(1, bc)) > 1e-9) bad++; } }
    ok('the lookup: the nearest of N spherical Fibonacci points by the four corners of its parastichy cell equals the brute-force nearest — everywhere, at the poles, on the seam, N = 64 … 16 384', bad === 0, `${tot - bad}/${tot} queries exact`); }
  /* 3 */
  { const V = grab(/const HOPF_RAY_F=`[\s\S]*?`;\n/, 'the raymarch shader');
    const same = /float m=max\(2\.0,floor\(log\(n\*PI\*2\.2360679775\*s2\)\/log\(PHI\*PHI\)\)\), pk=pow\(PHI,m\)\/2\.2360679775, f0=floor\(pk\+0\.5\), f1=floor\(pk\*PHI\+0\.5\);/.test(V)
      && /float k=f0\*\(c0\+float\(s-2\*\(s\/2\)\)\)\+f1\*\(c1\+float\(s\/2\)\); if\(k<0\.0\) k=-k; if\(k>=n\) k=2\.0\*\(n-1\.0\)-k;/.test(V)
      && /return asin\(clamp\(0\.5\*length\(n-b\),0\.0,1\.0\)\)-uR;/.test(V) && /float ry=length\(X\)\/uS, dy0=d\*\(1\.0\+ry\*ry\)\*0\.5, rm=max\(0\.0,ry-dy0\), dy=d\*\(1\.0\+rm\*rm\)\*0\.5; t\+=0\.92\*uS\*dy;/.test(V);
    /* the S³ length of the straight R³ step is at most ∫λ ≤ ℓ · max λ on the ball; check against the true S³ distance */
    const inv = y => { const r2 = y[0] * y[0] + y[1] * y[1] + y[2] * y[2], k = 1 / (1 + r2); return [2 * y[0] * k, 2 * y[1] * k, 2 * y[2] * k, (r2 - 1) * k]; };
    let worst = 0; for (let t = 0; t < 20000; t++) { const ry = Math.pow(10, rnd() * 3 - 1.5), d = Math.pow(10, -3 * rnd()) * 0.8, dir0 = [rnd() - 0.5, rnd() - 0.5, rnd() - 0.5], dl = Math.hypot(...dir0), dir = dir0.map(v => v / dl);
      const y0 = [ry, 0, 0], dy0 = d * (1 + ry * ry) / 2, rm = Math.max(0, ry - dy0), dy = d * (1 + rm * rm) / 2, y1 = y0.map((v, i) => v + dy * dir[i]), a = inv(y0), b = inv(y1);
      const ds = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]))); worst = Math.max(worst, ds / d); }
    ok('the step is safe: a step of R³-length d(1 + r_m²)/2 never covers more than d of S³, so no fibre is stepped over — and the shader computes exactly the twins’ lookup, distance and step', same && worst <= 1 + 1e-9, `shader = twins ${same ? '✓' : '✗'} · largest S³ step / d = ${worst.toFixed(6)} over 20 000 random steps`); }
  /* 4 */
  { let worst = 0; for (let t = 0; t < 400; t++) { const x = randS3(), c1 = rnd() * 6, c2 = rnd() * 6, ps = rnd() * 6;
      const turn = y => [Math.cos(c1) * y[0] - Math.sin(c1) * y[1], Math.sin(c1) * y[0] + Math.cos(c1) * y[1], Math.cos(c2) * y[2] - Math.sin(c2) * y[3], Math.sin(c2) * y[2] + Math.cos(c2) * y[3]];
      const w = [Math.cos(ps) * x[0] - Math.sin(ps) * x[1], Math.sin(ps) * x[0] + Math.cos(ps) * x[1], Math.cos(ps) * x[2] - Math.sin(ps) * x[3], Math.sin(ps) * x[2] + Math.cos(ps) * x[3]];
      const h1 = H.hopfMapS2(turn(x)), h2 = H.hopfMapS2(turn(w)), h0 = H.hopfMapS2(x), a = c1 - c2, rot = [Math.cos(a) * h0[0] - Math.sin(a) * h0[1], Math.sin(a) * h0[0] + Math.cos(a) * h0[1], h0[2]];
      worst = Math.max(worst, Math.hypot(h1[0] - h2[0], h1[1] - h2[1], h1[2] - h2[2]), Math.hypot(h1[0] - rot[0], h1[1] - rot[1], h1[2] - rot[2])); }
    ok('the 4D turn (e^{iχ₁}z₁, e^{iχ₂}z₂) sends fibres to fibres: the base turns about its pole by χ₁ − χ₂', worst < 1e-12, `worst ${worst.toExponential(1)}`); }
} catch (e) { fail++; console.log('  FAIL — verifier error: ' + (e && e.stack || e)); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
