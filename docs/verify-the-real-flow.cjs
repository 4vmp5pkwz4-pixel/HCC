#!/usr/bin/env node
'use strict';
/* ══ THE REAL FLOW OF THE LOCAL UNIVERSE (v4.361) ═══════════════════════════════════════════════════════════════
 * Continuity of the pressureless cosmic fluid — the inviscid limit of Navier–Stokes — solved by FFT on the atlas's
 * own 17 300 measured redshifts (the band-pass local web). Checked on the kernels and the embedded data:
 *   1. the solver is exact on a known answer: a Gaussian lump falls in at v_r = −(βH₀/3) r (Δ̄(<r) − δ̄) to 3 %
 *   2. on the real web the field obeys continuity ∇·v = −βH₀θ and is irrotational to round-off
 *   3. Bernardeau's divergence θ(δ) = (3/2)[(1+δ)^{2/3} − 1] tends to δ for small δ and is bounded at −3/2 in voids
 *   4. the decoded contrast has zero mean over the cells the catalogue reaches
 *   5. the Milky Way's predicted motion, as the ledger states it (β = 0.43): ≈ 730 km/s, ≈ 40° from Virgo, ≈ 79° from
 *      the measured CMB motion of the Local Group, 557 km/s toward Virgo against the measured 185 — the honest overshoot
 *   6. wired: the flow is computed from the embedded volume, its tracers ride the real galaxies in the local web, the
 *      panel states the comparison and the caveats, HCC_WEB_FLOW, the track op and the ledger answer; the observer and
 *      the galaxies are marks, not discs
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { webDecodeDelta, webThetaOfDelta, webLinearFlow, webFlowChecks, webGaussianInfall, webFlowAt, TRACK_OPS } = K;
  { const R = webGaussianInfall(64, 180, 20, 0.5);
    ok('the solver is exact on a known answer: a Gaussian lump falls in as −(βH₀/3) r (Δ̄ − δ̄) within 3 %', R.worst < 0.03, R.out.map(o => `r ${o.r}: ${o.got.toFixed(1)} vs ${o.want.toFixed(1)}`).join(' · ')); }
  const i = SRC.indexOf('id="hcc-local-web"'), j = SRC.indexOf('>', i), k = SRC.indexOf('</script>', j), J = JSON.parse(SRC.slice(j + 1, k));
  const M = JSON.parse(SRC.match(/const LOCAL_WEB_META=Object\.freeze\((\{[\s\S]*?\})\);\n/)[1]);
  const bytes = Uint8Array.from(Buffer.from(J.vol, 'base64')), D = webDecodeDelta(bytes, M.volN, M.volLogMax), th = webThetaOfDelta(D.delta, D.mask);
  const F = webLinearFlow(th, M.volN, M.boxHalfMpc, 0.43, M.H0), C = webFlowChecks(F, th);
  ok('on the real web the field obeys continuity ∇·v = −βH₀θ and has no curl, to round-off', C.continuity < 1e-12 && C.curl < 1e-12, `continuity ${C.continuity.toExponential(1)} · curl ${C.curl.toExponential(1)}`);
  { const t = d => webThetaOfDelta(Float64Array.of(d))[0];
    ok('Bernardeau’s divergence tends to δ for small δ and is bounded at −3/2 in an emptied void', Math.abs(t(1e-4) - 1e-4) < 1e-8 && Math.abs(t(-1) + 1.5) < 1e-12 && t(8) < 8 && t(8) > 4.9, `θ(8) = ${t(8).toFixed(3)} · θ(−1) = ${t(-1)}`); }
  { let s = 0, c = 0; for (let q = 0; q < D.delta.length; q++) if (D.mask[q]) { s += D.delta[q]; c++; }
    ok('the decoded contrast has zero mean over the cells the catalogue reaches', Math.abs(s / c) < 1e-12 && c > 70000, `${c} cells · ⟨δ⟩ = ${(s / c).toExponential(1)} · mean ratio ${D.meanRatio.toFixed(3)}`); }
  { const v = webFlowAt(F, [0, 0, 0]), sp = Math.hypot(...v), R = [[-0.0548755604, -0.8734370902, -0.4838350155], [0.4941094279, -0.4448296300, 0.7469822445], [-0.8676661490, -0.1980763734, 0.4559837762]];
    const eq = (a, d) => { a *= Math.PI / 180; d *= Math.PI / 180; return [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)]; }, gal2eq = (l, b) => { l *= Math.PI / 180; b *= Math.PI / 180; const g = [Math.cos(b) * Math.cos(l), Math.cos(b) * Math.sin(l), Math.sin(b)]; return [0, 1, 2].map(j2 => R[0][j2] * g[0] + R[1][j2] * g[1] + R[2][j2] * g[2]); };
    const ang = u => Math.acos(Math.max(-1, Math.min(1, (v[0] * u[0] + v[1] * u[1] + v[2] * u[2]) / sp))) * 180 / Math.PI, uV = eq(187.706, 12.391), toV = v[0] * uV[0] + v[1] * uV[1] + v[2] * uV[2];
    const aV = ang(uV), aL = ang(gal2eq(276, 30));
    ok('the Milky Way’s predicted motion is what the ledger states: ≈ 730 km/s, ≈ 40° from Virgo, ≈ 79° from the CMB motion, 557 km/s toward Virgo against the measured 185', Math.abs(sp - 730) < 10 && Math.abs(aV - 40.3) < 1 && Math.abs(aL - 78.5) < 1 && Math.abs(toV - 557) < 10 && /numbers:\{mwSpeed:730, angleVirgo:40\.3, angleCMB:78\.5, towardVirgo:557, betaMatch:0\.14, analyticError:0\.02\}/.test(SRC),
      `${sp.toFixed(0)} km/s · Virgo ${aV.toFixed(1)}° · CMB ${aL.toFixed(1)}° · toward Virgo ${toV.toFixed(0)} km/s · β to match ${(0.43 * 185 / toV).toFixed(3)}`); }
  { const op = TRACK_OPS && TRACK_OPS['web.flow'] && TRACK_OPS['web.flow'].run({ s: 20, A: 0.5 });
    const w = /Object\.assign\(LOCAL_WEB,\{group:G, vol:box, pts, mat, built:true, volBytes:vol, galPos:pos\}\)/.test(SRC) && /function webFlowTracers\(\)\{ const F=WEB_FLOW\.F, P=LOCAL_WEB\.galPos;/.test(SRC) && /try\{ webFlowTick\(dt\); \}catch\(e\)\{/.test(SRC)
      && /\$\{webFlowPanelHTML\(\)\}/.test(SRC) && /globalThis\.HCC_WEB_FLOW=Object\.freeze\(/.test(SRC) && /\{id:'realLocalFlow', kind:'tested'/.test(SRC) && /realLocalFlow:\[\{op:'nav', world:'obs'\}/.test(SRC)
      && /hccSoftPin\(dot,0xffffff,0\);/.test(SRC) && /hccSoftPin\(hereDot,0xfff2c4,0\);/.test(SRC) && /if\(!isCompact\) hccSoftPin\(dot,s\.col,dotR\);/.test(SRC) && /sizeAttenuation:false\}\)\);\n  sp\.scale\.setScalar\(0\.016\);/.test(SRC);
    ok('wired: the flow is computed from the embedded web, its tracers ride the real galaxies, the panel states the comparison and caveats; API, track and ledger answer; the observer and the galaxies are marks, not discs', w && op && op.worst < 0.03, op ? `track op worst ${op.worst.toFixed(4)}` : 'no op'); }
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
