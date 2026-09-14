#!/usr/bin/env node
'use strict';
/* ══ THE PHOTON WAS THERE AND NOBODY COULD RIDE IT ═════════════════════════════
 *
 * This laboratory has run a photon around a great circle of S³ since it was built,
 * and the reader has only ever watched it from outside — from a vantage that does
 * not exist, in a space that has no outside. The one view this instrument can offer
 * that no other can is the view FROM the photon, and it was the one view it did not
 * have.
 *
 * A GEODESIC RIDE IS THREE EXACT STATEMENTS.
 *
 *   THE HEADING IS THE TANGENT, AND IT IS ORTHOGONAL TO THE POSITION EVERYWHERE.
 *   For p(a) = R(sin a, cos a, 0) the tangent is (cos a, −sin a, 0) and p·t = 0 to
 *   8e-17 over the whole circuit. That is not a property of the parameterisation; it
 *   is what a geodesic on a sphere IS, and a camera whose heading drifts off it is
 *   no longer on a geodesic.
 *
 *   THE ANTIPODE ARRIVES AT ARC π, AND IT IS A PLACE. After πR the rider is at −p,
 *   the point every geodesic leaving the start reaches at once, which is exactly why
 *   Γ(T) reaches 100% there and not before.
 *
 *   AND IT CLOSES AT 2π. After 3445.2 Gyr at this radius the rider is back where it
 *   began, to 1e-15 of a unit, having passed no wall — because ∂S³_R = ∅. The
 *   closure is the whole point of the model, and it had never been something a
 *   reader could experience rather than read.
 *
 * Two things are hidden for the duration and both are statements rather than
 * conveniences: the carrier surface, because a surface you are ON cannot be in
 * front of you, and the observable cap, because from inside a region you see its
 * boundary and not its fill.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

const R = Number((src.match(/R:\s*([\d.]+),\s*\/\/ Gly — curvature radius of S³/) || [])[1]);
const RU = R / 100;
const pos = a => [RU * Math.sin(a), RU * Math.cos(a), 0];
const tan = a => [Math.cos(a), -Math.sin(a), 0];
const dot = (u, v) => u.reduce((s, x, i) => s + x * v[i], 0);
const nrm = u => Math.hypot(...u);

ok('the curvature radius the ride runs on is the atlas\'s own, read from the page',
  Number.isFinite(R) && R > 500 && R < 600 && /const HCC_RIDE=Object\.freeze\(\{/.test(src),
  `R = ${R} Gly, so one circuit is ${(2 * Math.PI * R).toFixed(1)} Gyr and the antipode is at ${(Math.PI * R).toFixed(1)}`);

/* ── 1. the heading ──────────────────────────────────────────────────────────── */
let perp = 0, unit = 0, fd = 0; const h = 1e-7;
for (let i = 0; i < 4000; i++) { const a = i / 4000 * 2 * Math.PI, p = pos(a), t = tan(a);
  perp = Math.max(perp, Math.abs(dot(p, t)) / RU);
  unit = Math.max(unit, Math.abs(nrm(t) - 1));
  const q = pos(a + h), d = q.map((v, k) => (v - p[k]) / (h * RU));
  fd = Math.max(fd, nrm(d.map((v, k) => v - t[k]))); }
ok('the heading is a unit tangent and it is orthogonal to the position at every point of the circuit',
  perp < 1e-15 && unit < 1e-15 && fd < 1e-5,
  `worst |p·t|/|p| = ${perp.toExponential(2)} · |t| − 1 ≤ ${unit.toExponential(2)} · agrees with a finite difference to ${fd.toExponential(1)}`);

ok('and the page computes it in one place, from the closed form, rather than differencing frames',
  /function photonRideState\(a\)\{/.test(src)
  && /heading:new THREE\.Vector3\(Math\.cos\(a\), -Math\.sin\(a\), 0\)/.test(src)
  && /position:new THREE\.Vector3\(RU\*Math\.sin\(a\), RU\*Math\.cos\(a\), 0\)/.test(src),
  'a heading taken from the difference between two frames is a heading that wobbles with the frame rate');

/* ── 2. the antipode ─────────────────────────────────────────────────────────── */
const Gamma = chi => (chi - 0.5 * Math.sin(2 * chi)) / Math.PI;
ok('the antipode is at arc π and it is the exact reflection of the start through the centre',
  [0.3, 1.234, 2.9, 5.5].every(a0 => nrm(pos(a0).map((v, i) => v + pos(a0 + Math.PI)[i])) < 1e-12),
  'every geodesic leaving a point on S³ reconverges there, which is the property that makes an antipode a place rather than a direction');

/* The first version of this asked for Γ(π/2) < 1/2 and went red against correct code,
   because Γ(π/2) is EXACTLY one half — sin π is zero, so the whole second term drops.
   That is not a bound to be loosened but an identity to be asserted, and it belongs to
   a larger one: Γ(χ) + Γ(π−χ) = 1 for every χ, so the accessible fraction and the
   inaccessible one are mirror images about the equator. Checking the identity is
   strictly stronger than checking the inequality that hid it. */
ok('Γ reaches one exactly at the antipode, is exactly one half at the equator, and is antisymmetric about it',
  Math.abs(Gamma(Math.PI) - 1) < 1e-15 && Math.abs(Gamma(Math.PI / 2) - 0.5) < 1e-15
  && [0.1, 0.7, 1.3, 2.0, 2.9].every(x => Math.abs(Gamma(x) + Gamma(Math.PI - x) - 1) < 1e-15)
  /* and it reaches one CUBICALLY: Gamma(pi - eps) = 1 - 2 eps^3/(3 pi), which is why the
     last few per cent of the ride complete almost all of the remaining accessibility.
     The second version of this check asked for Gamma(0.99 pi) < 0.9999 and went red,
     because by then it is already 0.9999934 — the bound was guessing at a rate the
     expansion gives exactly. */
  && [0.2, 0.1, 0.05, 0.02].every(e => Math.abs((1 - Gamma(Math.PI - e)) / (2 * e * e * e / (3 * Math.PI)) - 1) < 0.02),
  `Γ(π) = ${Gamma(Math.PI)} · Γ(π/2) = ${Gamma(Math.PI / 2)} · Γ(χ) + Γ(π−χ) = 1 to the last bit · `
  + `approaches one as 1 − 2ε³/3π, so at ε = 0.01π it is already ${Gamma(Math.PI * 0.99).toFixed(7)}`);

/* ── 3. the closure ──────────────────────────────────────────────────────────── */
ok('the circuit closes at 2π, with no wall passed, because the carrier has no boundary',
  [0.3, 1.234, 2.9].every(a0 => nrm(pos(a0).map((v, i) => v - pos(a0 + 2 * Math.PI)[i])) < 1e-12)
  && /∂S³_R = ∅/.test(src),
  `back to the start within 1e-15 of a unit after ${(2 * Math.PI * R).toFixed(1)} Gyr`);

ok('the ride reports how far it is from both, in the atlas\'s own time units',
  /antipode in \$\{\(r\.toAntipode\*S3\.R\)\.toFixed\(0\)\} Gyr · closes in \$\{\(r\.toClosure\*S3\.R\)\.toFixed\(0\)\} Gyr/.test(src)
  && /toAntipode:\(\(HCC_RIDE\.antipodeArc-a\)%\(2\*Math\.PI\)/.test(src),
  'both counted down along the arc rather than in wall-clock seconds, because the arc is what the geometry is about');

/* ── 4. what riding does and does not change ─────────────────────────────────── */
ok('riding fixes where the camera is and leaves where it looks to the reader',
  /controls\.target\.copy\(r\.position\)\.addScaledVector\(r\.heading, RU\*HCC_RIDE\.lookAhead\)/.test(src)
  && /controls\.target\.copy\(r\.position\)\.addScaledVector\(off\.normalize\(\)\.negate\(\), RU\*HCC_RIDE\.lookAhead\)/.test(src),
  'the orbit target sits a short way along the tangent, so a drag turns the head in the seat and the geodesic underneath is unaffected');

ok('the carrier surface is not drawn in front of a rider who is on it',
  /s3MainSphere\.visible=false;/.test(src) && /s3MainSphere\.visible=true;/.test(src)
  && /A SURFACE YOU ARE ON CANNOT BE IN FRONT OF YOU/.test(src),
  'a translucent shell across half the view is what looking at a surface from outside looks like, not what being embedded in one looks like');

ok('and the observable cap is not drawn around a rider who is inside it, while the ring that bounds it stays',
  /obsCap\.visible=false;/.test(src) && /obsCap\.visible=\(state\.s3view==='sec'\);/.test(src)
  && !/chiRing\.visible=false/.test(src),
  'the cap has angular radius 4.8° and the ride starts at its centre, so filled it covers the whole forward hemisphere; from inside a region you see its boundary');

ok('the ride is a declared mode with its own record, not a hidden camera state',
  /photonRide:false/.test(src) && /id="pride"/.test(src)
  && /lookAhead:0\.12/.test(src) && /source:'a great circle of S\^3/.test(src),
  'a reader can turn it on, turn it off, and read what it claims to be');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
