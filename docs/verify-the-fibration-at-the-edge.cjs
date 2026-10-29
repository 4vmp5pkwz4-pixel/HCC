#!/usr/bin/env node
'use strict';
/* ══ THE FIBRATION AT THE EDGE OF THE UNIVERSE (v4.389) ═════════════════════════════════════════════════════════════════
 * Asked: at the outer bounds of the universe, are there no signs of the fibration, and of modes going to the centre?
 * Past the observable sphere the Horizons world now draws the atlas's model S³ (radius R = S3.R, the closed branch's
 * median — a model, not a detection) with its Hopf fibration and its lowest modes about us. Checked here by running the
 * page's own pure code and reading its wiring:
 *   1. the chart is the observer's geodesic polar chart: every point of S³ lands at its true comoving distance χR from
 *      us, in its true direction (x₄, x₂, x₃)/sin χ — this world's own rule (1 unit = 1 Gly comoving)
 *   2. our fibre is the straight line through us (|y| = R|α|), the fibre farthest from ours is the circle χ = π/2 of
 *      radius πR/2, and the torus |z₂| = sin η comes no nearer to us than ηR
 *   3. any two fibres drawn are linked once, +1 with both oriented by their flow (Gauss's integral, in the chart; signed
 *      since v4.396, when the chart stopped drawing the mirror — docs/verify-the-fibre-is-oriented.cjs)
 *   4. the fibre through the particle horizon's equator leans on ours by exactly η = D_ph/R (2.97°): the label says so
 *   5. the section's modes are the zonal eigenfunctions of the Laplacian of S³: f_n = sin((n+1)χ)/((n+1) sin χ) satisfies
 *      (sin²χ f′)′/sin²χ = −n(n+2) f, with its nodes at χ = jπ/(n+1); the shader draws exactly that
 *   7. anchored to the catalogue (v4.393): our fibre points at the Huge-LQG, and the fibre of the model through each other
 *      giant structure passes through its catalogued position, is one fibre, and links ours once
 *   6. the whole S³ is offered with its consequences beside the control: the zoom ceiling opens far enough that the
 *      antipode's sphere fits the view, and the hand-off to the S³ carrier waits while it is drawn; the words carry the
 *      conditioning (the posterior share, "not a detection") and say that the antipode's sphere is one point
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const grab = (re, what) => { const m = SRC.match(re); if (!m) throw new Error('not found: ' + what); return m[0]; };
const fn = name => { const i = SRC.indexOf('function ' + name + '('); if (i < 0) throw new Error('no function ' + name); let d = 0, j = SRC.indexOf('{', i);
  for (let k = j; k < SRC.length; k++) { const c = SRC[k]; if (c === '{') d++; else if (c === '}') { d--; if (!d) return SRC.slice(i, k + 1); } } throw new Error('unbalanced ' + name); };
try {
  const F = new Function([fn('obsFibChart'), grab(/const obsFibMode=[^\n]*\n/, 'the mode'), grab(/const obsFibStretch=[^\n]*\n/, 'the stretch'), 'return {obsFibChart,obsFibMode,obsFibStretch};'].join('\n'))();
  const R = 886.59, at = (eta, al, be) => { const o = [0, 0, 0], chi = F.obsFibChart(eta, al, be, R, o); return { o, chi }; };
  let s = 7; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  /* 1 */
  { let worst = 0, dir = 0; for (let i = 0; i < 4000; i++) { const eta = rnd() * Math.PI / 2, al = rnd() * 2 * Math.PI, be = rnd() * 2 * Math.PI, { o, chi } = at(eta, al, be);
      const x1 = Math.cos(eta) * Math.cos(al), want = Math.acos(x1), r = Math.hypot(...o); worst = Math.max(worst, Math.abs(r - want * R) / (want * R + 1e-9), Math.abs(chi - want));
      const x2 = Math.cos(eta) * Math.sin(al), x3 = Math.sin(eta) * Math.cos(be), x4 = Math.sin(eta) * Math.sin(be), sn = Math.sin(want); if (sn > 1e-6 && r > 1e-6) dir = Math.max(dir, Math.hypot(o[0] / r - x4 / sn, o[1] / r - x2 / sn, o[2] / r - x3 / sn)); }
    ok('the chart is the observer’s geodesic polar chart: every point of S³ at its true comoving distance χR from us, in its true direction — this world’s own rule',
      worst < 1e-12 && dir < 1e-9, `distance to ${worst.toExponential(1)} · direction to ${dir.toExponential(1)} over 4000 points`); }
  /* 2 */
  { let axis = 0; for (const al of [-3.1, -2, -0.5, 0.3, 1.7, 3.1]) { const { o } = at(0, al, 0); axis = Math.max(axis, Math.hypot(o[0], o[2]), Math.abs(o[1] - R * al) / R); }
    let far = 0; for (let i = 0; i < 64; i++) { const { o } = at(Math.PI / 2, 0, 2 * Math.PI * i / 64); far = Math.max(far, Math.abs(Math.hypot(o[0], o[2]) - Math.PI * R / 2) / R, Math.abs(o[1]) / R); }
    let near = 0; for (const eta of [46.04 / R / 2, 46.04 / R, Math.PI / 12, Math.PI / 4, 5 * Math.PI / 12]) { let m = Infinity; for (let i = 0; i < 2000; i++) m = Math.min(m, Math.hypot(...at(eta, 2 * Math.PI * i / 2000, 0.7).o)); near = Math.max(near, Math.abs(m - eta * R) / (eta * R)); }
    ok('our fibre is the straight line through us (|y| = R|α|), the fibre farthest from ours the circle χ = π/2 of radius πR/2, and the torus |z₂| = sin η comes no nearer to us than ηR',
      axis < 1e-12 && far < 1e-12 && near < 1e-9, `axis ${axis.toExponential(1)} · farthest circle ${far.toExponential(1)} · nearest approach ${near.toExponential(1)}`); }
  /* 3 */
  { const loop = (eta, de, n) => { const P = []; for (let i = 0; i < n; i++) { const t = i / n, al = 2 * Math.PI * t + 0.8 * Math.sin(2 * Math.PI * t); P.push(at(eta, al, al + de).o); } return P; };
    const gauss = (A, B) => { let g = 0; for (let i = 0; i < A.length; i++) { const a0 = A[i], a1 = A[(i + 1) % A.length]; for (let j = 0; j < B.length; j++) { const b0 = B[j], b1 = B[(j + 1) % B.length];
          const r = [0, 1, 2].map(t => (a0[t] + a1[t] - b0[t] - b1[t]) / 2), da = [0, 1, 2].map(t => a1[t] - a0[t]), db = [0, 1, 2].map(t => b1[t] - b0[t]);
          const cr = [da[1] * db[2] - da[2] * db[1], da[2] * db[0] - da[0] * db[2], da[0] * db[1] - da[1] * db[0]], d = Math.hypot(...r); g += (r[0] * cr[0] + r[1] * cr[1] + r[2] * cr[2]) / (d * d * d); } } return g / (4 * Math.PI); };
    const pairs = [[Math.PI / 12, 0, Math.PI / 4, 1.1], [Math.PI / 3, 0.4, 5 * Math.PI / 12, 2.9], [Math.PI / 6, 0, Math.PI / 2, 0.0], [Math.PI / 4, 0, Math.PI / 4, 2.2]];
    const lks = pairs.map(([e1, d1, e2, d2]) => gauss(loop(e1, d1, 900), loop(e2, d2, 900)));
    /* v4.396: signed — the chart keeps the handedness, so the standard fibration's +1 is what is drawn */
    ok('any two fibres drawn are linked once, +1 with both oriented by their flow — Gauss’s integral in the chart',
      lks.every(x => Math.abs(x - 1) < 2e-2), `Lk ${lks.map(x => x.toFixed(4)).join(', ')}`); }
  /* 4 */
  { const eta = 46.04 / R, h = 1e-6, a = at(eta, -h, -h + 0.9).o, b = at(eta, h, h + 0.9).o, t = b.map((x, q) => x - a[q]), tl = Math.hypot(...t), lean = Math.acos(Math.abs(t[1]) / tl);
    const tw = grab(/const obsFibStretch=[^\n]*\n/, 'the twist'), exact = /obsFibTwistDeg=L=>L\/S3\.R\*180\/Math\.PI/.test(tw), said = /lean \$\{dec\(obsFibTwistDeg\(S3\.Dparticle\)\.toFixed\(2\)\)\}° on ours/.test(SRC) && /const eph=S3\.Dparticle\/R;/.test(SRC);
    ok('the fibre through the particle horizon’s equator leans on ours by exactly η = D_ph/R, and the label says that number',
      Math.abs(lean - eta) < 1e-7 && exact && said, `lean ${(lean * 180 / Math.PI).toFixed(6)}° against η = ${(eta * 180 / Math.PI).toFixed(6)}° · formula ${exact ? '✓' : '✗'} · label ${said ? '✓' : '✗'}`); }
  /* 5 */
  { let eig = 0, nodes = 0; for (const n of [1, 2, 3, 4, 6]) { for (let i = 1; i < 40; i++) { const c = 0.05 + (Math.PI - 0.1) * i / 40, h = 1e-4, f = x => F.obsFibMode(n, x), d1 = x => (f(x + h) - f(x - h)) / (2 * h);
        const lap = ((Math.sin(c + h / 2) ** 2) * (f(c + h) - f(c)) / h - (Math.sin(c - h / 2) ** 2) * (f(c) - f(c - h)) / h) / h / (Math.sin(c) ** 2);
        if (Math.abs(f(c)) > 1e-3) eig = Math.max(eig, Math.abs(lap / f(c) + n * (n + 2)) / (n * (n + 2))); d1(c); }
      for (let j = 1; j <= n; j++) nodes = Math.max(nodes, Math.abs(F.obsFibMode(n, j * Math.PI / (n + 1)))); nodes = Math.max(nodes, Math.abs(F.obsFibMode(n, 1e-9) - 1)); }
    const shader = /float n1=uN\+1\.0, s=sin\(chi\), f=chi<1e-5\?1\.0:sin\(n1\*chi\)\/\(n1\*s\), w=f\*cos\(uPh\);/.test(SRC) && /node=\(j>=1\.0&&j<=uN\)\?/.test(SRC);
    ok('the section’s modes are the zonal eigenfunctions of the Laplacian of S³: (sin²χ f′)′/sin²χ = −n(n+2) f, nodes at χ = jπ/(n+1), 1 at us — and the shader draws exactly that',
      eig < 1e-5 && nodes < 1e-12 && shader, `eigenvalue to ${eig.toExponential(1)} · nodes ${nodes.toExponential(1)} · shader ${shader ? '✓' : '✗'}`); }
  /* 6 */
  { const zl = fn('obsApplyZoomLimits'), panel = fn('obsFibPanelHTML'), ceil = /state\.obsFibWhole \? 2\.45\*Math\.PI\*S3\.R : 0/.test(zl), fits = Math.asin(1 / 2.45) < 27.5 * Math.PI / 180;
    /* v4.404: the switch is read by hccSeamAuto, for all four crossings alike; the wait is still this seam's own */
    const wait = SRC.includes('dObs>SCALE_SEAMS.obsS3OutGly && !state.quantShells && !state.obsFibWhole && state.scaleChain!==false;') && /hccSeamBand\(w\)\{\s*\n\s*if\(w==='obs'\) return \{lo:SCALE_SEAMS\.obsSolarInGly\*1\.08, hi:\(!state\.quantShells&&!state\.obsFibWhole\)\?/.test(SRC);
    const says = /the zoom ceiling opens to/.test(panel) && /the automatic hand-off to the S³ carrier is suspended/.test(panel) && /not a detection/.test(panel) && /\$\{\(100\*S3R\.pClosed\)\.toFixed\(2\)\}% of the curvature posterior/.test(panel);
    const words = /this whole sphere is one point/.test(SRC) && /a model, not a detection/.test(SRC) && /our fibre — through us, toward \$\{anm\}, and the antipode/.test(SRC);
    const wired = /try\{ obsFibTick\(dt\); \}catch\(e\)\{/.test(SRC) && /\$\{obsFibPanelHTML\(\)\}/.test(SRC) && (SRC.match(/\$\{obsFibPanelHTML\(\)\}/g) || []).length === 1;
    ok('the whole S³ is offered with its consequences beside the control — the ceiling opens until the antipode’s sphere fits the view, the hand-off waits while it is drawn — and the words carry the conditioning',
      ceil && fits && wait && says && words && wired, `ceiling 2.45πR, the antipode’s sphere ${(2 * Math.asin(1 / 2.45) * 180 / Math.PI).toFixed(1)}° across ${fits ? '✓' : '✗'} · hand-off waits ${wait ? '✓' : '✗'} · side effects and conditioning stated ${says ? '✓' : '✗'} · words ${words ? '✓' : '✗'} · wired ${wired ? '✓' : '✗'}`); }
  /* 7 */
  { /* v4.393: the one free choice — where our fibre points — is tied to the catalogue: our fibre through the Huge-LQG, and the
       fibre of the model through each other giant structure drawn through its catalogued position */
    const thr = new Function(fn('obsFibThrough') + '\nreturn obsFibThrough;')(), R = 886.59;
    let through = 0, onFibre = 0, worstLk = 0;
    const hopf = x => [2 * (x[0] * x[2] + x[1] * x[3]), 2 * (x[1] * x[2] - x[0] * x[3]), x[0] * x[0] + x[1] * x[1] - x[2] * x[2] - x[3] * x[3]];
    const inv = q => { const r = Math.hypot(...q), chi = r / R, d = r > 1e-12 ? q.map(v => v / r) : [0, 1, 0], s = Math.sin(chi); return [Math.cos(chi), s * d[1], s * d[2], s * d[0]]; };
    /* the catalogue's structures lie 5–20 Gly out, where their fibres run nearly parallel to ours; linking is topological, so it is
       measured on points farther out, where a discrete Gauss integral resolves the two circles */
    for (const P of [[12.6, 3.1, -2.2], [-4, 9, 15], [300, -20, 50], [-210, 420, -380], [150, 600, 90]]) { const f = thr(P, R, 400); through = Math.max(through, Math.hypot(f.P[0] - P[0], f.P[1] - P[1], f.P[2] - P[2]));
      const h0 = hopf(inv(P)); for (let i = 0; i < f.P.length; i += 4 * 9) { const h = hopf(inv([f.P[i], f.P[i + 1], f.P[i + 2]])); onFibre = Math.max(onFibre, Math.hypot(h[0] - h0[0], h[1] - h0[1], h[2] - h0[2])); }
      /* linked once with ours: both great circles of S³, Gauss's integral after projecting from a point on neither */
      /* stereographic projection of S³ from a pole on neither circle, in an orthonormal basis of the pole's complement */
      const x = inv(P), N0 = [0.31, -0.42, 0.55, 0.65], nl = Math.hypot(...N0), Np = N0.map(v => v / nl), dot4 = (u, v) => u.reduce((a, w, k) => a + w * v[k], 0), basis = [];
      for (const e of [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]) { let v = e.map((w, k) => w - dot4(e, Np) * Np[k]); for (const u of basis) { const c = dot4(v, u); v = v.map((w, k) => w - c * u[k]); } const l = Math.hypot(...v); if (l > 1e-6 && basis.length < 3) basis.push(v.map(w => w / l)); }
      const pr = y => { const k = 1 / (1 - dot4(y, Np)); return basis.map(u => dot4(y, u) * k); };
      const A = [], B = []; for (let i = 0; i < 300; i++) { const t = 2 * Math.PI * i / 300, c = Math.cos(t), sn = Math.sin(t); A.push(pr([c, sn, 0, 0])); B.push(pr([c * x[0] - sn * x[1], sn * x[0] + c * x[1], c * x[2] - sn * x[3], sn * x[2] + c * x[3]])); }
      let g = 0; for (let i = 0; i < 300; i++) { const a0 = A[i], a1 = A[(i + 1) % 300]; for (let j = 0; j < 300; j++) { const b0 = B[j], b1 = B[(j + 1) % 300], r = [0, 1, 2].map(t => (a0[t] + a1[t] - b0[t] - b1[t]) / 2), da = [0, 1, 2].map(t => a1[t] - a0[t]), db = [0, 1, 2].map(t => b1[t] - b0[t]);
          const cr = [da[1] * db[2] - da[2] * db[1], da[2] * db[0] - da[0] * db[2], da[0] * db[1] - da[1] * db[0]], dd = Math.hypot(...r); g += (r[0] * cr[0] + r[1] * cr[1] + r[2] * cr[2]) / (dd * dd * dd); } }
      if (Math.hypot(...P) > 100) worstLk = Math.max(worstLk, Math.abs(Math.abs(g / (4 * Math.PI)) - 1)); }
    const anchored = /obsFibGroup\.quaternion\.setFromUnitVectors\(new THREE\.Vector3\(0,1,0\),obsFibAnchorDir\(aid\)\)/.test(SRC) && /const aid=state\.obsFibAnchor\|\|'qsoaxis';/.test(SRC)
      && /const P=id==='hugelqg'\|\|id==='cclqg'\|\|id==='hyperion'\|\|id==='bossgw'\?COSMOS_POS\.get\(id\):null; if\(P\) return P\.clone\(\)\.normalize\(\);/.test(SRC) && !/obsFibGroup\.rotation\.set\(0\.62,-0\.4,0,'YXZ'\)/.test(SRC);
    const words = SRC.includes('the direction is a choice tied to the catalogue: the model fixes none') && SRC.includes('linked once with ours') && SRC.includes('the principal axis of the quasar catalogue itself (which mostly reflects where the surveys looked)');
    ok('anchored to the catalogue: our fibre points at the Huge-LQG (Clowes et al. 2013) and so passes through it; the fibre of the model through each other giant structure passes through its catalogued position, lies on one fibre (the Hopf map constant along it) and is linked once with ours; and the words say the direction is a choice',
      through < 1e-9 && onFibre < 1e-9 && worstLk < 2e-2 && anchored && words, `through the structure to ${through.toExponential(1)} Gly · one fibre to ${onFibre.toExponential(1)} · |Lk| − 1 to ${worstLk.toExponential(1)} · anchored ${anchored ? '✓' : '✗'} · words ${words ? '✓' : '✗'}`); }
} catch (e) { fail++; console.log('  FAIL — verifier error: ' + (e && e.stack || e)); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
