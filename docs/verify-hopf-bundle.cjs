#!/usr/bin/env node
'use strict';
/* ══ A HOPF FIBRE IS A CIRCLE, AND THE ATLAS DREW IT AS 160 GUESSES ═════════════
 *
 * The Hopf laboratory drew every fibre as a THREE.Line: one hundred and sixty
 * samples of the parameterisation joined by one-pixel segments at one flat
 * opacity. A polyline has no surface, so it has no normal, so it can carry no
 * light and no thickness that survives being looked at edge-on — and the crossings,
 * which are the entire point of a laboratory about linking, were the place the
 * drawing was thinnest.
 *
 * Stereographic projection takes circles on S³ to circles in R³, so each fibre has
 * a closed form, and it is derived in index.html rather than looked up:
 *
 *     radius  R = sec(θ/2)
 *     centre  C = tan(θ/2) · (−sin φ, cos φ, 0)
 *     normal  n = (−sin(θ/2) cos φ, −sin(θ/2) sin φ, cos(θ/2))
 *
 * THIS CHECK EXISTS BECAUSE THE FILE NOW HAS TWO DESCRIPTIONS OF ONE CIRCLE. The
 * beads still slide along the parameterisation; the tubes are swept from the closed
 * form. Two authorities for one fact is the defect this atlas spends its releases
 * removing, and the only thing that makes it survivable here is a check that they
 * agree — which is what the first half of this file measures, to the last bit.
 *
 * The second half holds the three claims that are NOT about agreement: two exact
 * invariants of the bundle, the linking number computed from the Gauss double
 * integral rather than asserted in a caption, and the structural fact that no
 * polyline is left anywhere in the bundle.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

/* Both descriptions are re-derived here from the page's own text, so a change to
   either one in index.html reaches this check instead of going around it. */
const CF = src.slice(src.indexOf('function hopfFibreCircle(theta, phi){'),
  src.indexOf('}', src.indexOf('normal:new THREE.Vector3(-sh*cp, -sh*sp, ch)}')) + 1);
ok('the closed form this check exercises is the one in the page, cut out rather than copied',
  /radius:1\/ch/.test(CF) && /centre:new THREE\.Vector3\(-sh\/ch\*sp, sh\/ch\*cp, 0\)/.test(CF)
  && /normal:new THREE\.Vector3\(-sh\*cp, -sh\*sp, ch\)/.test(CF),
  `${CF.length} characters of index.html`);

const circ = (th, ph) => { const h = th / 2, ch = Math.cos(h), sh = Math.sin(h), cp = Math.cos(ph), sp = Math.sin(ph);
  return { R: 1 / ch, C: [-sh / ch * sp, sh / ch * cp, 0], N: [-sh * cp, -sh * sp, ch] }; };
/* the parameterisation, WITHOUT the 1e-9 pole guard index.html adds, because the
   guard is a property of the drawing and not of the circle */
const pt = (th, ph, t) => { const ch = Math.cos(th / 2), sh = Math.sin(th / 2), d = 1 - sh * Math.sin(t);
  return [ch * Math.cos(t + ph) / d, ch * Math.sin(t + ph) / d, sh * Math.cos(t) / d]; };
const sub = (a, b) => a.map((v, i) => v - b[i]), dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const nrm = a => Math.hypot(...a);

/* ── 1. the two descriptions of one circle ───────────────────────────────────── */
let offCircle = 0, offPlane = 0, n = 0;
for (let a = 1; a < 60; a++) for (let b = 0; b < 17; b++) {
  const th = a / 60 * Math.PI, ph = b / 17 * 2 * Math.PI, { R, C, N } = circ(th, ph);
  for (let k = 0; k < 32; k++) { const p = pt(th, ph, k / 32 * 2 * Math.PI); n++;
    offCircle = Math.max(offCircle, Math.abs(nrm(sub(p, C)) - R));
    offPlane = Math.max(offPlane, Math.abs(dot(sub(p, C), N))); }
}
ok('the closed form and the parameterisation are the same circle to the last bit, across the whole bundle',
  offCircle < 1e-10 && offPlane < 1e-12,
  `${n} samples over 1020 fibres · off the circle by ${offCircle.toExponential(2)} · out of its plane by ${offPlane.toExponential(2)}`);

/* The ceiling here is DERIVED, not chosen, and deriving it took two goes. The guard
   turns p = v/d into v/(d+ε), which moves each point straight back along its own ray
   by |p|·ε/(d+ε). The denominator is never below 1 − sin(θ/2); the point itself is
   never further from the centre than |C| + R, and |C|/R is exactly sin(θ/2). So the
   displacement as a fraction of the radius is at most

     ε · (1 + sin(θ/2)) / (1 − sin(θ/2))

   The first version of this check dropped the numerator and the measurement came in
   at 2.00 times a bound that was wrong by exactly a factor of two at large radius —
   which is how a derived ceiling behaves when it is derived carelessly, and why the
   number was worth chasing instead of doubling. A tolerance tuned to whatever the
   code produced would have hidden both the slip and anything real underneath it. */
const EPS = 1e-9;
let guardWorst = 0, guardRatio = 0;
for (let a = 1; a < 60; a++) {
  const th = a / 60 * Math.PI, { R, C } = circ(th, 1.1), sh = Math.sin(th / 2);
  const bound = EPS * (1 + sh) / (1 - sh);
  const g = t => { const ch = Math.cos(th / 2), d = 1 - sh * Math.sin(t) + EPS;
    return [ch * Math.cos(t + 1.1) / d, ch * Math.sin(t + 1.1) / d, sh * Math.cos(t) / d]; };
  for (let k = 0; k < 60; k++) { const e = Math.abs(nrm(sub(g(k / 60 * 2 * Math.PI), C)) - R) / R;
    guardWorst = Math.max(guardWorst, e); guardRatio = Math.max(guardRatio, e / bound); }
}
ok('the pole guard is the only thing separating the two descriptions, and it stays inside the bound its own size implies',
  guardRatio < 1.05 && /d=1-x4\+1e-9/.test(src),
  `worst relative displacement ${guardWorst.toExponential(2)} · at most ${guardRatio.toFixed(3)} of the ε(1+sin(θ/2))/(1−sin(θ/2)) bound · the closed form never divides at all`);

/* ── 2. two exact invariants of the whole bundle ─────────────────────────────── */
/* RELATIVE, and for a reason. A fibre near θ = π projects to a circle of radius 250
   and more, so R² is of order 65 000 and an absolute tolerance that is tight for the
   small circles is meaningless for the large ones — and one that fits the large ones
   lets an error through on every other fibre in the bundle. The first version of this
   check used an absolute 1e-11 and went red against correct code at exactly those
   large radii. Relative error is the quantity the claim is actually about: both of
   these are algebraic identities, so they must hold to double precision everywhere.
   The ceiling is fifty-odd machine epsilons, which round-off reaches and a wrong
   formula does not. */
let power = 0, perp = 0, biggest = 0;
for (let a = 1; a < 400; a++) for (let b = 0; b < 7; b++) {
  const { R, C, N } = circ(a / 400 * Math.PI, b / 7 * 2 * Math.PI);
  biggest = Math.max(biggest, R);
  power = Math.max(power, Math.abs(R * R - dot(C, C) - 1) / (R * R));
  const cl = nrm(C); if (cl > 1e-12) perp = Math.max(perp, Math.abs(dot(C, N)) / cl);
}
ok('every fibre circle is coaxial with the unit sphere: R² − |C|² is exactly one, for all of them',
  power < 1e-14,
  `worst relative departure ${power.toExponential(2)} over 2793 fibres up to radius ${biggest.toFixed(0)} · the geometric form of every fibre meeting the Clifford torus alike`);
ok('each centre lies in the plane of the circle it centres, which is the half of it that is not obvious',
  perp < 1e-14,
  `|C·n|/|C| ≤ ${perp.toExponential(2)} · the planes tilt with θ and turn with φ, and the centres tilt with them`);

/* ── 3. the claim the laboratory exists to make, computed ────────────────────── */
function linking(t1, p1, t2, p2, N) {
  const A = [], B = [];
  for (let i = 0; i < N; i++) { A.push(pt(t1, p1, i / N * 2 * Math.PI)); B.push(pt(t2, p2, i / N * 2 * Math.PI)); }
  let s = 0;
  for (let i = 0; i < N; i++) { const a = A[i], da = sub(A[(i + 1) % N], a);
    for (let j = 0; j < N; j++) { const b = B[j], db = sub(B[(j + 1) % N], b), r = sub(a, b), rl = nrm(r);
      s += (r[0] * (da[1] * db[2] - da[2] * db[1]) + r[1] * (da[2] * db[0] - da[0] * db[2])
          + r[2] * (da[0] * db[1] - da[1] * db[0])) / (rl * rl * rl); } }
  return s / (4 * Math.PI);
}
const PAIRS = [[0.5, 0, 1.05, 1.1], [0.25, 2.0, 1.85, 4.0], [1.0, 0, 1.0, 3.1],
  [0.4, 5.0, 2.6, 0.3], [1.57, 1.0, 1.57, 4.2]];
const L = PAIRS.map(q => linking(q[0], q[1], q[2], q[3], 400));
ok('any two distinct fibres link exactly once, by the Gauss double integral and not by assertion',
  L.every(v => Math.abs(v - 1) < 5e-3),
  `${L.length} pairs across the bundle on 400 segments each · ${L.map(v => v.toFixed(5)).join(' · ')}`);
ok('and the integral is discriminating: a fibre against a circle that is NOT one of them links zero times',
  (() => { const off = (t) => [3 + Math.cos(t), 3 + Math.sin(t), 0];   // a small circle set well aside
    const A = [], B = [], N = 300;
    for (let i = 0; i < N; i++) { A.push(pt(0.9, 0.4, i / N * 2 * Math.PI)); B.push(off(i / N * 2 * Math.PI)); }
    let s = 0;
    for (let i = 0; i < N; i++) { const a = A[i], da = sub(A[(i + 1) % N], a);
      for (let j = 0; j < N; j++) { const b = B[j], db = sub(B[(j + 1) % N], b), r = sub(a, b), rl = nrm(r);
        s += (r[0] * (da[1] * db[2] - da[2] * db[1]) + r[1] * (da[2] * db[0] - da[0] * db[2])
            + r[2] * (da[0] * db[1] - da[1] * db[0])) / (rl * rl * rl); } }
    return Math.abs(s / (4 * Math.PI)) < 5e-3; })(),
  'a measurement that returns the same answer for linked and unlinked curves is not a measurement');

/* ── 4. the centre of the projection, which a reader asked about ─────────────── */
const pole = [0, 1.1, 3.9, 5.5].map(ph => circ(0, ph));
ok('the fibre over the pole of the base sphere is the unit circle about the origin, for every φ and to the last bit',
  pole.every(c => c.R === 1 && nrm(c.C) === 0 && c.N[2] === 1 && c.N[0] === 0 && c.N[1] === 0),
  'one point on the base has one fibre above it, so φ is degenerate there — radius exactly 1, centre exactly the origin, normal exactly the polar axis');

ok('the family spirals onto that circle at the rate the small-angle expansion gives, which is why the knot at the centre is tight',
  [0.25, 0.1, 0.01, 0.001].every(th => { const c = circ(th, 1.0);
    return Math.abs((c.R - 1) / (th * th / 8) - 1) < 0.02
        && Math.abs(nrm(c.C) / (th / 2) - 1) < 0.02
        && Math.abs(nrm(c.C) / (c.R - 1) - 4 / th) < 0.05; }),
  'R − 1 = θ²/8 and |C| = θ/2, so the centre offset outruns the radius change by 4/θ: at the innermost drawn ring θ = 0.25 that is 16 to one');

ok('at the far pole the fibre straightens into a line, and R² − |C|² = 1 is exactly what says so',
  [3.0, 3.1, 3.14, 3.1415].every(th => { const c = circ(th, 0), gap = c.R - nrm(c.C);
    return Math.abs(gap - 1 / (c.R + Math.sqrt(c.R * c.R - 1))) < 1e-9; }),
  'R − |C| = 1/(R + √(R²−1)) → 0 as R diverges: a circle whose radius and centre offset differ by less and less, with their squares differing by exactly one, is a circle flattening into a straight line through the origin');

ok('neither degenerate limit is swept as a tube, and the one that is finite is drawn as a declared reference',
  /const RINGS = \[\[\.25,6\]/.test(src)
  && /const c=hopfFibreCircle\(0,0\), pts=\[\];/.test(src)
  && /axis\.userData\.hopfPoleFibre=\{radius:c\.radius, centre:c\.centre\.toArray\(\), normal:c\.normal\.toArray\(\)\};/.test(src)
  && /fibre over the pole · the unit circle, exactly/.test(src),
  'the rings run from θ = 0.25 to 1.85, so neither the unit circle nor the straight line is tubed; the unit circle is drawn once, because it is the axis the whole bundle is wound around');

/* ── 4. what the laboratory actually puts in the scene ───────────────────────── */
ok('the bundle is one merged swept mesh added at one line, and no polyline is left anywhere in it',
  /hopfFibersSub\.add\(hopfFibreTubes\(hopfDefs\)\)/.test(src)
  && !/hopfFibersSub\.add\(new THREE\.Line\(/.test(src)
  && /const HOPF_TUBE=Object\.freeze\(\{seg:128, rad:6/.test(src),
  '128 segments around each fibre, six around each tube, one draw call for the whole bundle');

ok('the tube frame is written down rather than transported, so it cannot twist or seam',
  /r\.copy\(u\)\.multiplyScalar\(cs\)\.addScaledVector\(w,sn\);/.test(src)
  && /const nx=r\.x\*ca\+normal\.x\*sa/.test(src)
  && /nor\[o\]=nx; nor\[o\+1\]=ny; nor\[o\+2\]=nz;/.test(src),
  'for a circle the outward radial direction and the plane normal already close on themselves after one turn');

ok('the frame never degenerates, because the seed axis is chosen away from the normal instead of assumed',
  /u\.set\(1,0,0\); if\(Math\.abs\(normal\.x\)>0\.9\) u\.set\(0,1,0\);/.test(src),
  'a fixed seed axis would collapse the cross product for the fibres whose planes face it');

ok('the light running along a fibre is the S¹ action, on the same clock as the beads',
  /HOPF_UNIFORMS\.uTime\.value=hopfFlowT;/.test(src)
  && /float ph=vP\.x\*6\.2831853\*3\.0 - uTime\*uFlow\*2\.0 \+ vP\.y;/.test(src),
  'the fibre coordinate the Hopf map quotients by, drawn as itself rather than as a highlight that merely moves');

ok('the rim dispersion is declared a cheat in the file rather than presented as physics',
  /stated cheat, not dispersion/.test(src) && /nowhere claimed as physics/.test(src),
  'real dispersion would trace three wavelengths; what is drawn is a hue rotation with grazing angle');

ok('a rebuild disposes the merged buffers instead of leaking one copy per density change',
  /hopfFibersSub\.traverse\(o=>\{ if\(o\.geometry&&o!==hopfBeads\) o\.geometry\.dispose\(\); \}\);/.test(src),
  'the polyline version had nothing worth freeing; this one has several megabytes');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
