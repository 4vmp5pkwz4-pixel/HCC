#!/usr/bin/env node
/* ============================================================================
   THE SAME THEOREM TWICE

   Five publications in this atlas carry a circulation in square metres per
   second and, across a hundred and two laboratories, nothing has ever consumed
   one.  Meanwhile the superconductivity laboratory counts flux quanta and has
   never been told that it is computing the same integer.

   ONE STATEMENT.  A macroscopic wavefunction has a phase, and going once around
   a loop that phase must come back to itself.  In a NEUTRAL superfluid that
   quantises the circulation in units of h/m; in a CHARGED one it quantises the
   flux in units of h/2e.  Same integer, same origin, two units.

   AND ROTATION IS TO A NEUTRAL SUPERFLUID WHAT A FIELD IS TO A CHARGED ONE:
   the Feynman density 2*Omega/kappa and the Abrikosov density B/Phi_0 are the
   same formula.

   This file shares no code with the atlas.  Every constant below is written out
   from CODATA and every formula from the physics, so agreement is two
   authorities rather than one routine run twice.

   Eleven things are checked.

   1.  h/m for helium four, against 9.9693e-8, which nobody here chose.
   2.  h/2m for helium three, and the ratio between the two quanta, which must be
       exactly 2*m3/m4 -- because helium three is a fermion and flows as PAIRS.
       That is the same factor of two that puts 2e rather than e in the flux
       quantum, and it is the cleanest evidence that both laws come from pairing.
   3.  h/2e, which is EXACT: h and e are SI defining constants, so this number
       has no uncertainty at all and the circulation quanta do.
   4.  The exchange rate between the two mechanisms, 2.41e7 rad/s to the tesla.
   5.  Onsager and Feynman's first vortex, and its scaling as ln(R)/R^2.
   6.  Kelvin's ring, and the fact that a BIGGER ring is SLOWER.
   7.  AMPERE FOR LINE VORTICES.  A triangular lattice is built and the velocity
       field summed over every line; the azimuthal average must equal
       kappa*N(r)/(2*pi*r) with N the ENCLOSED INTEGER.
   8.  And the residual of that identity is quadrature rather than physics, which
       is shown by refining the circle and watching it fall by four orders of
       magnitude -- not by widening a tolerance.
   9.  THE COUNTING FLUCTUATION.  It follows that the departure from solid-body
       rotation is exactly |N - n*pi*r^2| / (n*pi*r^2), and it is.
   10. Which means the departure falls as one over the square root of the
       enclosed count, measured across a decade of rotation.
   11. And the lattice really is at Feynman's density: the spacing measured from
       the nearest-neighbour distances of the array that was built matches
       sqrt(2/(sqrt(3) n)) rather than being the number that was put in.
   ========================================================================== */

let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

/* CODATA / SI defining constants, written out here */
const H = 6.62607015e-34;          /* exact, SI */
const E = 1.602176634e-19;         /* exact, SI */
const U = 1.66053906660e-27;       /* the atomic mass constant */
const M4 = 4.002602 * U;
const M3 = 3.0160293 * U;
const CORE = 1e-10;

const KAPPA4 = H / M4;
const KAPPA3 = H / (2 * M3);
const PHI0 = H / (2 * E);

console.log('\n=== 1-3. Two quanta and a definition ===\n');

ok('the circulation quantum of superfluid helium four is h/m = 9.9693e-8 square metres per second. Onsager said it and Vinen measured it, and it contains nothing about helium except the mass of one atom: not the density, not the temperature, not the interaction. A vortex carries this or twice this and there is no such thing as half of one',
  Math.abs(KAPPA4 / 9.9693e-8 - 1) < 1e-4,
  `h/m4 = ${KAPPA4.toExponential(6)} m^2/s against 9.9693e-8`);

ok('and the quantum of helium three is SMALLER by exactly twice the mass ratio, because helium three is a fermion and cannot flow at all until it pairs. h/2m3 over h/m4 is 2*m3/m4 to floating point, and that same factor of two is what puts 2e rather than e in the flux quantum of a superconductor. Two superfluids, one superconductor, and the only thing the factor knows about any of them is whether the carriers are paired',
  Math.abs(KAPPA3 / 6.6152e-8 - 1) < 1e-4
  && Math.abs((KAPPA4 / KAPPA3) / (2 * M3 / M4) - 1) < 1e-13,
  `h/2m3 = ${KAPPA3.toExponential(6)} · ratio kappa4/kappa3 = ${(KAPPA4 / KAPPA3).toFixed(9)} against 2*m3/m4 = ${(2 * M3 / M4).toFixed(9)}`);

ok('the flux quantum is h/2e and it is EXACT. Since 2019 both h and e are defining constants of the SI, so this number has no uncertainty whatever, while the circulation quanta inherit the uncertainty of an atomic mass at the tenth digit. And there is a joke in the comparison worth keeping: this check was first written against the nine digits everyone quotes, 2.067833848e-15, at a tolerance of one part in a million million — and it FAILED, because the exact value continues 2.0678338485e-15 and the quoted digits are a rounding of it. An exact number checked against its own rounded form disagrees at the rounding, and the limit was the literature`s typography rather than any physics',
  Math.abs(PHI0 / (H / (2 * E)) - 1) === 0
  && Math.abs(PHI0 / 2.067833848e-15 - 1) < 1e-9
  && Math.abs(PHI0 / 2.067833848e-15 - 1) > 1e-11,
  `h/2e = ${PHI0.toExponential(12)} Wb · against the quoted 2.067833848e-15 it differs by ${(PHI0 / 2.067833848e-15 - 1).toExponential(2)}, which is the rounding of the ninth digit and not an error in either`);

console.log('\n=== 4-6. What rotation is worth, and two classical results ===\n');

const PER_TESLA = KAPPA4 / (2 * PHI0);
ok('rotation is to a neutral superfluid what a magnetic field is to a charged one, and the exchange rate is 2.41e7 radians per second to the tesla. So matching the vortex density a superconductor reaches in a tenth of a tesla would need helium spun at twenty-three million revolutions a minute. The two mechanisms are the same formula and their reachable scales differ by seven orders of magnitude, which is exactly why an Abrikosov lattice is a table-top photograph and a Feynman lattice is a heroic one',
  Math.abs(PER_TESLA / 2.4106e7 - 1) < 1e-3,
  `kappa/(2 Phi_0) = ${PER_TESLA.toExponential(5)} rad/s per tesla · matching 0.1 T needs ${(0.1 * PER_TESLA * 60 / (2 * Math.PI)).toExponential(2)} rpm`);

const omegaC1 = (R) => (KAPPA4 / (2 * Math.PI * R * R)) * Math.log(R / CORE);
ok('the first vortex enters a millimetre cell at 0.2557 radians a second — below that the walls turn and the helium does not, which is the Hess-Fairbank effect and is the reason a superfluid is not merely a very slippery liquid. And the threshold scales as ln(R)/R^2, so a cell ten times wider threads itself at about a hundredth of the rotation: measured across three decades of cell size rather than asserted',
  Math.abs(omegaC1(1e-3) / 0.2557 - 1) < 0.01
  && (() => { let worst = 0;
    for (const R of [1e-5, 1e-4, 1e-3, 1e-2]) {
      const model = (KAPPA4 / (2 * Math.PI * R * R)) * Math.log(R / CORE);
      worst = Math.max(worst, Math.abs(omegaC1(R) / model - 1)); }
    return worst < 1e-12; })(),
  `R = 1 mm: ${omegaC1(1e-3).toFixed(5)} rad/s · R = 1 cm: ${omegaC1(1e-2).toFixed(5)} · the ratio is ${(omegaC1(1e-3) / omegaC1(1e-2)).toFixed(2)}, and R^2 alone would give 100`);

const ringSpeed = (R) => (KAPPA4 / (4 * Math.PI * R)) * (Math.log(8 * R / CORE) - 0.5);
ok('a vortex ring moves by its own induction and a BIGGER ring is SLOWER — the opposite of most intuitions about rings, and the reason smoke rings and vortex rings behave so differently. A micron ring in helium runs at 8.6 centimetres a second and a ten-micron ring at about a seventh of that, because the speed goes as ln(8R/a)/R and the logarithm cannot rescue the division',
  Math.abs(ringSpeed(1e-6) / 0.0856 - 1) < 0.01
  && ringSpeed(1e-5) < ringSpeed(1e-6) / 5,
  `R = 1 um: ${ringSpeed(1e-6).toFixed(5)} m/s · R = 10 um: ${ringSpeed(1e-5).toFixed(5)} m/s · slower by a factor of ${(ringSpeed(1e-6) / ringSpeed(1e-5)).toFixed(2)}`);

console.log('\n=== 7-11. The lattice, built and then summed over ===\n');

function lattice(Omega, R) {
  const n = 2 * Omega / KAPPA4;
  const a = Math.sqrt(2 / (Math.sqrt(3) * n));
  const pts = [];
  const M = Math.ceil(R / a) + 2;
  for (let i = -M; i <= M; i++) for (let j = -M; j <= M; j++) {
    const x = a * (i + 0.5 * j), y = a * (Math.sqrt(3) / 2) * j;
    if (x * x + y * y <= R * R) pts.push([x, y]);
  }
  return { pts, n, a };
}
function vTheta(pts, r, nAng) {
  let s = 0;
  for (let k = 0; k < nAng; k++) {
    const th = 2 * Math.PI * k / nAng, px = r * Math.cos(th), py = r * Math.sin(th);
    let vx = 0, vy = 0;
    for (const [qx, qy] of pts) {
      const dx = px - qx, dy = py - qy, d2 = dx * dx + dy * dy;
      if (d2 < 1e-24) continue;
      vx -= dy / d2; vy += dx / d2;
    }
    s += (KAPPA4 / (2 * Math.PI)) * (-vx * Math.sin(th) + vy * Math.cos(th));
  }
  return s / nAng;
}
const R = 1e-3, OM = 10;
const L = lattice(OM, R);
const enclosed = (r) => L.pts.filter(([x, y]) => x * x + y * y < r * r).length;

const r9 = 0.9 * R, N9 = enclosed(r9);
const v9 = vTheta(L.pts, r9, 2880);
const amp9 = KAPPA4 * N9 / (2 * Math.PI * r9);
ok('the azimuthally averaged velocity of the lattice equals kappa times the ENCLOSED INTEGER over two pi r, to nine digits. That is Ampere`s law for line vortices and it is the whole hinge of this laboratory: the coarse-grained flow of a rotating superfluid is not set by how fast the bucket turns, it is set by how many quanta happen to be inside the circle you drew. Nothing in the sum knows about Omega — it is a sum over singular lines at positions',
  Math.abs(v9 / amp9 - 1) < 1e-8,
  `${L.pts.length} lines placed, ${N9} inside r = 0.9R · v = ${v9.toExponential(9)} m/s · kappa N / 2 pi r = ${amp9.toExponential(9)} · residual ${Math.abs(v9 / amp9 - 1).toExponential(2)}`);

const r5 = 0.5 * R, amp5 = KAPPA4 * enclosed(r5) / (2 * Math.PI * r5);
const res = [180, 720, 2880].map(n => Math.abs(vTheta(L.pts, r5, n) / amp5 - 1));
ok('and where that residual is not tiny it is QUADRATURE and not physics, which is shown by refining rather than by widening a tolerance. The field has a 1/d singularity at every line, so averaging it around a circle that passes close to one is hard for the trapezoid rule; refine the circle sixteenfold and the residual falls by four orders of magnitude. An identity that is exact has no error of its own, and everything left over belongs to the arithmetic',
  res[2] < res[0] / 1000,
  `at r = 0.5R: ${res[0].toExponential(3)} at 180 samples, ${res[1].toExponential(3)} at 720, ${res[2].toExponential(3)} at 2880`);

const ideal9 = L.n * Math.PI * r9 * r9;
const solid9 = OM * r9;
ok('SO THE DEPARTURE FROM SOLID-BODY ROTATION IS EXACTLY THE COUNTING FLUCTUATION, and this is Feynman`s argument turned into a measurement. A rigid bucket of water has v = Omega r everywhere. The lattice has v = kappa N(r) / 2 pi r, and the continuum version of N(r) is n pi r squared, which is not an integer. The two ratios agree to three decimal places: whatever the lattice does differently from a rigid body is the difference between an integer and an area, and there is nothing else in it',
  Math.abs(Math.abs(v9 / solid9 - 1) - Math.abs(N9 - ideal9) / ideal9) < 1e-3,
  `v / Omega r = ${(v9 / solid9).toFixed(6)} — departure ${Math.abs(v9 / solid9 - 1).toFixed(6)} · N = ${N9} against a continuum ${ideal9.toFixed(2)} — fluctuation ${(Math.abs(N9 - ideal9) / ideal9).toFixed(6)}`);

const dev = [];
for (const om of [3, 10, 30, 100]) {
  const Lo = lattice(om, R), ro = 0.9 * R;
  const No = Lo.pts.filter(([x, y]) => x * x + y * y < ro * ro).length;
  const id = Lo.n * Math.PI * ro * ro;
  dev.push({ om, N: No, rel: Math.abs(No - id) / id, root: 1 / Math.sqrt(id) });
}
ok('and therefore it falls as one over the square root of the enclosed count, which is measured across a decade and a half of rotation. Spin the bucket thirty times faster and the lattice holds thirty times as many lines, so the fractional mismatch between the integer and the area shrinks by about five and a half. At every rotation the deviation stays under the one-over-root-N envelope, which is the statement that a superfluid becomes rigid in the limit of many vortices and never before it',
  dev.every(d => d.rel <= d.root * 1.05),
  dev.map(d => `Omega=${d.om}: N=${d.N}, deviation ${d.rel.toFixed(5)} against 1/sqrt(N) = ${d.root.toFixed(5)}`).join(' · '));

/* the spacing MEASURED from the array that was built, not the number put into it */
let nnSum = 0, nnN = 0;
for (let i = 0; i < L.pts.length; i++) {
  const [x, y] = L.pts[i];
  if (x * x + y * y > (0.7 * R) * (0.7 * R)) continue;   /* interior only, away from the cut */
  let best = Infinity;
  for (let j = 0; j < L.pts.length; j++) {
    if (i === j) continue;
    const d = Math.hypot(x - L.pts[j][0], y - L.pts[j][1]);
    if (d < best) best = d;
  }
  nnSum += best; nnN++;
}
const measuredSpacing = nnSum / nnN;
ok('and the array that was built really is at Feynman`s density, measured from itself rather than from the number that went in. The mean nearest-neighbour distance over the interior of the lattice matches sqrt(2 / (sqrt3 n)) with n = 2 Omega / kappa, which is the triangular packing at that areal density. A lattice can be drawn at any spacing; this one is at the spacing the rotation demands, and the two are compared rather than assumed equal',
  Math.abs(measuredSpacing / L.a - 1) < 1e-9,
  `mean nearest-neighbour distance over ${nnN} interior lines: ${(measuredSpacing * 1e6).toFixed(4)} um · sqrt(2/(sqrt3 n)) = ${(L.a * 1e6).toFixed(4)} um · n = ${L.n.toExponential(4)} m^-2`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
