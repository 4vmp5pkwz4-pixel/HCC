#!/usr/bin/env node
'use strict';
/* ══ THE FLUID ANSWERS THE HAND, AND SAYS WHAT IT WILL DO (v4.354) ════════════════════════════════════════════════
 * Reported: the visualisations had become primitive (square points, hairlines, charts floating in the scene), and the
 * Navier–Stokes equations on the three-sphere were to be used as visually, interactively and predictively as possible.
 * Checked on the kernels (sliced from index.html into core/atlas/extracted.mjs) and on the source:
 *   1. the cascade is bookkept exactly: the energy each shell receives from the nonlinearity sums to zero, so does its
 *      helicity weight (ΣT = 0, ΣμT = 0 — what the truncation conserves); the rigid rotation trades nothing (Π₀ = 0)
 *   2. the guarantee holds: the eddies' energy E′ = E − E∞ never rises above E′₀e^{−10ν(t−t₀)} (κ₁ = 5), and the bound is
 *      sharp — a fluid in the first shell rides it
 *   3. the hand: the trisphere's display is inverted exactly (compact chart, stereographic projection, 4-D turn); a
 *      stroke's force is projected on the divergence-free shells by the fluid's own quadrature; the end state moves by
 *      exactly the stroke's Killing part
 *   4. the horizon: the finite-time Lyapunov exponent is measured by integrating the fluid and a copy 10⁻⁷ away;
 *      viscosity makes it negative (errors shrink, faster for larger ν)
 *   5. the look: strokes of light (instanced capsules, anti-aliased, equal light for equal fluid), the tracers' points on
 *      the pick layer only, the numbers in a laboratory instrument instead of the scene, the stir as a grip
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const B = K.nsgBasis(2), killMask = B.modes.map(m => (m.k === 0 ? 1 : 0));
  /* 1 · the cascade */
  { let worstT = 0, worstH = 0, worstPi0 = 0;
    for (const seed of [3, 7, 11, 19]) { const a = K.nsgInitial(B, { seed, killing: 0.2, bias: 0.3, slope: 1.1 }), X = K.nsgTransfer(B, a);
      worstT = Math.max(worstT, Math.abs(X.sumT) / X.scale); worstH = Math.max(worstH, Math.abs(X.sumHT) / X.scale); worstPi0 = Math.max(worstPi0, Math.abs(X.flux[0]) / X.scale); }
    ok('the cascade is bookkept exactly: ΣT = 0 and ΣμT = 0 (energy and helicity are what the truncation conserves), and the rigid rotation trades nothing (Π₀ = 0)',
      worstT < 1e-12 && worstH < 1e-12 && worstPi0 < 1e-12, `|ΣT|/Σ|T| ≤ ${worstT.toExponential(1)} · |ΣμT| ≤ ${worstH.toExponential(1)} · |Π₀| ≤ ${worstPi0.toExponential(1)}`); }
  /* 2 · the guarantee */
  { let worst = 0, tight = 0; const h = 0.02;
    for (const [seed, nu] of [[3, 0.05], [7, 0.02], [11, 0.1]]) { let a = K.nsgInitial(B, { seed, killing: 0.2, bias: 0.2, slope: 1.2 }); const fin = K.nsgFinal(B, a), E0 = K.nsgEddyEnergy(B, a, fin);
      for (let s = 1; s <= 250; s++) { a = K.nsgStep(B, a, nu, h); worst = Math.max(worst, K.nsgEddyEnergy(B, a, fin) / (E0 * Math.exp(-10 * nu * s * h))); } }
    { let a = new Float64Array(B.n); for (const sh of B.shells) if (sh.k === 1 && sh.sigma > 0) for (let i = sh.from; i < sh.to; i++) a[i] = Math.sin(i + 1); const fin = K.nsgFinal(B, a), E0 = K.nsgEddyEnergy(B, a, fin);
      let r = 1; for (let s = 1; s <= 100; s++) { a = K.nsgStep(B, a, 0.05, h); r = Math.min(r, K.nsgEddyEnergy(B, a, fin) / (E0 * Math.exp(-0.5 * s * h))); } tight = r; }
    ok('the guarantee holds: E′(t) ≤ E′(t₀)e^{−10ν(t−t₀)} on every step of every run, and it is sharp — a fluid in the first shell rides the bound',
      worst <= 1 + 1e-9 && tight > 0.98 && /O\.env=\{t0:O\.t, E:nsgEddyEnergy\(B,O\.a,O\.fin\)\}/.test(SRC) && /bound=O\.env\.E\*Math\.exp\(-10\*nu\*\(O\.t-O\.env\.t0\)\)/.test(SRC),
      `max E′/bound = ${worst.toFixed(6)} · first shell keeps ${(100 * tight).toFixed(2)} % of the bound`); }
  /* 3 · the hand */
  { let err = 0; for (let i = 0; i < 300; i++) { const r = () => Math.sin(i * 12.9898 + Math.random()) * 0.999; let q = [r(), r(), r(), r()]; const n = Math.hypot(...q); q = q.map(x => x / n); if (q[3] > 0.85) continue;
      const A = { a: i * 0.37, b: i * 0.21, g: 0.4 * Math.sin(i) }, p = K.triRotate(q, A.a, A.b, A.g), v = K.triProject(p, 2.05, 2.6), back = K.triUnproject(v[0], v[1], v[2], A);
      err = Math.max(err, Math.hypot(...back.map((x, k) => x - q[k]))); }
    const a = K.nsgInitial(B, { seed: 5, killing: 0.1, bias: 0, slope: 1 }), q0 = [0.5, 0.5, 0.5, 0.5], d0 = [0.3, -0.2, 0.1, -0.2], dq = d0.reduce((s, x, k) => s + x * q0[k], 0), d = d0.map((x, k) => x - dq * q0[k]);
    const D = K.nsgStirDelta(B, q0, d, 0.5); let kill = 0, rest = 0; for (let i = 0; i < B.n; i++) { if (killMask[i]) kill += D[i] * D[i]; else rest += D[i] * D[i]; }
    const a2 = a.map((x, i) => x + D[i]), f1 = K.nsgFinal(B, a2); let kp = 0; for (let i = 0; i < B.n; i++) if (killMask[i]) kp += a2[i] * a2[i];
    ok('the hand: the display is inverted exactly; a stroke is projected on the divergence-free shells by the fluid’s quadrature, and the end state moves by exactly its Killing part',
      err < 1e-9 && kill > 0 && rest > 0 && Math.abs(f1.E - 0.5 * kp) < 1e-12 && /function nsgStir\(q0,q1,ev\)/.test(SRC) && /O\.fin=nsgFinal\(B,O\.a\); O\.killRef=nsgInvariants\(B,O\.a\)\.kill;/.test(SRC),
      `inverse error ${err.toExponential(1)} · stroke: ${(100 * kill / (kill + rest)).toFixed(1)} % rigid rotation, the rest eddies`); }
  /* 4 · the horizon */
  { const a = K.nsgInitial(B, { seed: 5, killing: 0.1, bias: 0, slope: 1 }), l1 = K.nsgFTLE(B, a, 0.01, 0.02, 40, 1, killMask), l2 = K.nsgFTLE(B, a, 0.3, 0.02, 40, 1, killMask);
    ok('the horizon: the finite-time Lyapunov exponent from the fluid and a copy 10⁻⁷ away (in a worker) — viscosity makes errors shrink, faster for larger ν',
      Number.isFinite(l1) && Number.isFinite(l2) && l2 < l1 && l2 < 0 && /\[nsgCross,nsgLamb,nsgStep,nsgFTLE\]\.map\(f=>f\.toString\(\)\)/.test(SRC) && /postMessage\(\{id:m\.id, lambda:nsgFTLE\(B,m\.a,m\.nu,m\.h,m\.steps,m\.seed,m\.kill\)\}\)/.test(SRC),
      `λ(ν=0.01) = ${l1.toFixed(3)} · λ(ν=0.3) = ${l2.toFixed(3)}`); }
  /* 5 · the look */
  ok('the look: strokes of light (instanced capsules, Gaussian core and glow, rounded ends, comet heads, equal light for equal fluid); the points only on the pick layer; the numbers in a laboratory instrument; the stir as a grip',
    /function triCapsuleMaterial\(op,world\)/.test(SRC) && /new THREE\.InstancedBufferGeometry\(\)/.test(SRC) && /float eq=clamp\(pow\(0\.5\*\(1\.0\+rhoH\),1\.5\),0\.3,1\.6\);/.test(SRC)
    && /pts\.name='nsf-tracers'; pts\.layers\.set\(1\);/.test(SRC) && /const com=triCapsules\(N,0\.78\); com\.name='nsf-comets';/.test(SRC) && /const tracers=triCapsules\(N,0\.8\); tracers\.name='nsg-tracers';/.test(SRC)
    && /hccInstrSet\('nsflow',nsfInstrPaint\);/.test(SRC) && /hccInstrSet\('nsgal',nsgInstrPaint\);/.test(SRC) && /<canvas class="labInstr tall" id="labInstr"/.test(SRC) && /sp\.id='hudSpark'/.test(SRC)
    && /hccGrip\(\{ id:'nsgal', when:\(\)=>state\.mode==='s3'&&state\.s3view==='nsgal'&&nsgObjs&&nsgObjs\.pick,/.test(SRC) && !/const dots=new THREE\.Points\(dg,new THREE\.PointsMaterial\(\{color:0x8fd0ff,size:0\.07/.test(SRC));
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
