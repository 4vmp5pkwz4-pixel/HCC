#!/usr/bin/env node
'use strict';
/* ══ SPACETIME, 2+1, BOOSTED LIVE ═════════════════════════════════════════════════════════
 * The relativity laboratory's light cone was two flat triangles. It is now a 2+1 spacetime whose
 * 1 331 events are carried through the Lorentz boost in the vertex shader. This file lifts the
 * shader's boost and colour rule and checks them against references written HERE:
 *   1. the boost preserves s² = −t² + x² + y² for every event of the lattice, to rounding
 *   2. so the causal class — future, past, elsewhere — the colour is computed from, is invariant:
 *      no event changes colour at any β, and the shader computes it from the UNboosted event
 *   3. boosts compose by adding rapidities: B(β₁)·B(β₂) = B(tanh(atanh β₁ + atanh β₂))
 *   4. the lab's clocks tick every γ of the ship's time along x = −βt, and its simultaneity plane
 *      is t' = −βx'
 *   5. a light flash stays on the cone: its circle at time t has radius ct in every frame
 *   6. MUTATION: a Galilean shear (t' = t, x' = x − βt) does not preserve s² and recolours events, caught
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const ev = []; for (let i = 0; i < 11; i++) for (let j = 0; j < 11; j++) for (let k = 0; k < 11; k++) ev.push([(i - 5) * 0.62, (j - 5) * 0.62, (k - 5) * 0.62]);   /* (x, ct, y) as the shader stores them */
const boost = (e, b) => { const g = 1 / Math.sqrt(1 - b * b); return [g * (e[0] - b * e[1]), g * (e[1] - b * e[0]), e[2]]; };
const s2 = e => -e[1] * e[1] + e[0] * e[0] + e[2] * e[2];
const cls = e => { const s = s2(e); return s < -0.02 ? (e[1] > 0 ? 'F' : 'P') : s > 0.02 ? 'E' : 'N'; };

/* 1 · the invariant */
{ let worst = 0; for (const b of [0.1, 0.6, 0.9, 0.99]) for (const e of ev) worst = Math.max(worst, Math.abs(s2(boost(e, b)) - s2(e)));
  const sh = SRC.slice(SRC.indexOf('SPACETIME, 2+1, BOOSTED LIVE'), SRC.indexOf("const lattice=new THREE.Points(lg,latMat)"));
  ok('the boost the shader applies — t\' = γ(t − βx), x\' = γ(x − βt) — preserves s² = −t² + x² + y² for all 1 331 events at every β, to rounding',
    worst < 1e-12 && /float t2=g\*\(e\.y-uB\*e\.x\), x2=g\*\(e\.x-uB\*e\.y\);/.test(sh), `worst |Δs²| = ${worst.toExponential(1)}`); }

/* 2 · the colour is invariant */
{ let changed = 0; for (const b of [0.3, 0.8, 0.97]) for (const e of ev) { const a = cls(e), c = cls(boost(e, b)); if (a !== c && a !== 'N') changed++; }
  const futureStays = ev.filter(e => cls(e) === 'F').every(e => boost(e, 0.95)[1] > 0);
  ok('so the causal class the colour is computed from never changes: no timelike or spacelike event is recoloured at any β, the future stays in the future — and the shader takes the class from the UNboosted event',
    changed === 0 && futureStays && /float s2=-e\.y\*e\.y\+e\.x\*e\.x\+e\.z\*e\.z;/.test(SRC), `${ev.filter(e => cls(e) === 'F').length} future · ${ev.filter(e => cls(e) === 'P').length} past · ${ev.filter(e => cls(e) === 'E').length} elsewhere`); }

/* 3 · rapidities add */
{ const b1 = 0.6, b2 = 0.7, b12 = Math.tanh(Math.atanh(b1) + Math.atanh(b2)); let worst = 0;
  for (const e of ev.slice(0, 200)) { const a = boost(boost(e, b1), b2), c = boost(e, b12); worst = Math.max(worst, ...a.map((x, i) => Math.abs(x - c[i]))); }
  ok('boosts compose by adding rapidities — B(β₁)B(β₂) = B(tanh(atanh β₁ + atanh β₂)) — the hyperbolic rotation the drawing shows', worst < 1e-12, `0.6 ⊕ 0.7 = ${b12.toFixed(6)} · worst ${worst.toExponential(1)}`); }

/* 4 · the lab's clocks and simultaneity */
{ const b = 0.6, g = 1 / Math.sqrt(1 - b * b), tick = [0, 0.5].map(tau => boost([0, tau, 0], -b));   /* lab events at x = 0, t_lab = τ, seen from the ship moving at +β: boost by +β → lab moves at −β */
  const shipB = [0, 0.5].map(tau => boost([0, tau, 0], b)), dt = shipB[1][1] - shipB[0][1], dx = shipB[1][0] - shipB[0][0];
  const simul = boost([1, 0, 0], b);   /* a lab-simultaneous event (t_lab = 0, x = 1) in the ship frame */
  ok('the lab\'s clocks tick every γ of the ship\'s time along x\' = −βt\', and the lab\'s plane of simultaneity is t\' = −βx\' — as the scene draws them',
    Math.abs(dt - g * 0.5) < 1e-12 && Math.abs(dx / dt + b) < 1e-12 && Math.abs(simul[1] / simul[0] + b) < 1e-12 && /dummy\.position\.set\(-bAuto\*Ga\*tauK,Ga\*tauK,0\)/.test(SRC) && /Math\.atan\(-bAuto\)/.test(SRC),
    `Δt' = ${dt.toFixed(4)} = γ·0.5 · velocity ${(dx / dt).toFixed(3)} · simultaneity slope ${(simul[1] / simul[0]).toFixed(3)}`); }

/* 5 · the flash */
{ let worst = 0; for (const b of [0.2, 0.9]) for (let q = 0; q < 36; q++) { const a = 2 * Math.PI * q / 36, e = [Math.cos(a) * 1.7, 1.7, Math.sin(a) * 1.7], p = boost(e, b); worst = Math.max(worst, Math.abs(s2(p))); }
  ok('a light flash stays on the cone: every event of its circle at time t, radius ct, is null in every frame', worst < 1e-12 && /pts\.push\(new THREE\.Vector3\(tf\*Math\.cos\(a\),tf,tf\*Math\.sin\(a\)\)\)/.test(SRC), `worst |s²| ${worst.toExponential(1)}`); }

/* 6 · mutation */
{ const gal = (e, b) => [e[0] - b * e[1], e[1], e[2]]; let recol = 0, dev = 0; for (const e of ev) { const p = gal(e, 0.8); dev = Math.max(dev, Math.abs(s2(p) - s2(e))); if (cls(e) !== 'N' && cls(p) !== cls(e)) recol++; }
  ok('MUTATION — a Galilean shear (t\' = t, x\' = x − βt) breaks s² and recolours events, caught', dev > 1 && recol > 0, `|Δs²| up to ${dev.toFixed(2)} · ${recol} events recoloured`); }

console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
