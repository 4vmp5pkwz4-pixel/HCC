#!/usr/bin/env node
/* ============================================================================
   A HUNDRED AND TWENTY ORDERS, DRAWN AGAINST NOTHING

   The information laboratory has two stations.  One lays a book, a brain, a data
   centre, the Sun, a black hole and the cosmological horizon along a rail of bit
   counts spanning a hundred and twenty orders of magnitude.  The other derives
   the holographic bound -- the most bits a region can hold, which goes as its
   AREA and not its volume.  Neither could say anything about the other, because
   the rail carried no radius, and the bound is a function of nothing else.

   This file shares no code with the atlas.  Every constant below is written out
   from CODATA 2018 and the IAU nominal values, and the Planck area, the bound
   and every radius are built from those here.

   TEN THINGS ARE CHECKED.

   1.  The Planck area and the holographic density, from first constants.
   2.  A black hole's entropy by two routes -- area/4 in Planck units, and the
       bound on a sphere of its own radius -- agree to machine precision.  This
       is a CONSISTENCY check and not a discovery: the bound IS that entropy.
   3.  And it therefore catches a wrong radius: 2GM/c^2 without the 2 reports
       four times the bound, not twice.
   4.  The Schwarzschild radius of one solar mass is 2954 m.
   5.  The Hubble radius from H0 = 67.4 is 1.37e26 m.
   6.  THE DIVISION: two horizons essentially on the bound, four material things
       thirty to sixty orders below it.
   7.  Sixty-one orders of magnitude between the extremes of occupancy.
   8.  Occupancy goes as one over R squared, which is why a structural check with
       a threshold at one half tolerates a factor of 1.41 in the radius.
   9.  A bound that went as VOLUME would put the Sun above its own limit -- which
       is why the distinction the second station draws is not decoration.
   10. And the erased bit has no radius, because it is a cost per operation.
   ========================================================================== */
'use strict';
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

/* ---- constants, written out here ------------------------------------------ */
const KB = 1.380649e-23;          /* exact, SI 2019 */
const HBAR = 1.054571817e-34;
const C = 299792458;              /* exact */
const G = 6.67430e-11;            /* CODATA 2018 */
const MSUN = 1.98892e30;
const LN2 = Math.LN2;
const MPC = 3.0856775814913673e22;
const H0 = 67.4;                  /* km/s/Mpc */

const planckArea = () => HBAR * G / (C * C * C);           /* l_P^2 */
const density = () => KB / (4 * planckArea()) / (KB * LN2); /* bits per m^2 */
const bound = R => density() * 4 * Math.PI * R * R;
const rs = M => 2 * G * M / (C * C);
const hubbleR = () => C / (H0 * 1000 / MPC);
const bitsFromJK = S => S / (KB * LN2);
const horizonEntropy = A => A * KB / (4 * planckArea());
const schwarzschildArea = M => { const r = rs(M); return 4 * Math.PI * r * r; };

/* the rail, with radii, as the atlas now carries it */
const HOLDERS = [
  { id: 'bit', bits: 1, R: null },
  { id: 'book', bits: 8e6, R: 0.15 },
  { id: 'brain', bits: 1e15, R: 0.0693 },
  { id: 'disk', bits: 8e21, R: 50 },
  { id: 'sun', bits: 1e57, R: 6.957e8 },
  { id: 'hole', bits: 1.5e77, R: rs(MSUN) },
  { id: 'universe', bits: 2.9e122, R: hubbleR() },
];
const occ = h => h.R > 0 ? h.bits / bound(h.R) : null;

console.log('\n=== 1-3. The bound, and the one thing that saturates it ===\n');

ok('the Planck area and the holographic density follow from hbar, G, c and k_B alone: 2.612e-70 square metres, and 1.381e69 bits on every square metre',
  Math.abs(planckArea() - 2.6121e-70) / 2.6121e-70 < 1e-4 && Math.abs(density() - 1.3807e69) / 1.3807e69 < 1e-4,
  `l_P^2 = ${planckArea().toExponential(4)} m² · ${density().toExponential(4)} bits/m²`);

ok('A BLACK HOLE`S ENTROPY BY TWO ROUTES AGREES TO MACHINE PRECISION: area over four Planck areas, against the bound on a sphere of its own Schwarzschild radius. This is a CONSISTENCY CHECK AND NOT A DISCOVERY — the holographic bound is DEFINED as that entropy, so the two routes share their physics and differ only in arithmetic. Read as a result it would be circular; read as a check it says the constants and the algebra are wired up correctly, which is all it can say',
  (() => { const b = bitsFromJK(horizonEntropy(schwarzschildArea(MSUN))); return Math.abs(b / bound(rs(MSUN)) - 1) < 1e-12; })(),
  `two routes differ by ${Math.abs(bitsFromJK(horizonEntropy(schwarzschildArea(MSUN))) / bound(rs(MSUN)) - 1).toExponential(2)}`);

ok('and BECAUSE it is exact it catches a wrong radius, which a threshold cannot: drop the 2 from 2GM/c² and the black hole does not fall off the bound, it lands at FOUR times it — still "near the bound" to any check written as a comparison, and caught instantly by one written as an equality',
  (() => { const b = bitsFromJK(horizonEntropy(schwarzschildArea(MSUN)));
    const wrong = b / bound(G * MSUN / (C * C));
    return Math.abs(wrong - 4) < 1e-9 && wrong > 0.5; })(),
  `without the 2: ${(bitsFromJK(horizonEntropy(schwarzschildArea(MSUN))) / bound(G * MSUN / (C * C))).toFixed(9)} of the bound — four times over, and still on the wrong side of any "> 0.5" test`);

console.log('\n=== 4-5. The two derived radii ===\n');

ok('one solar mass has a Schwarzschild radius of 2954 metres, derived and not quoted',
  Math.abs(rs(MSUN) - 2954.0) < 1.0, `2GM/c² = ${rs(MSUN).toFixed(2)} m`);

ok('and the Hubble radius from H0 = 67.4 km/s/Mpc is 1.37e26 metres, which is 14.5 billion light years — the HUBBLE SPHERE, and not the 46.5 Gly light cone that "observable universe" usually means. The atlas`s 2.9e122 bits belongs to this horizon, and pairing it with the other radius would be wrong by a factor of ten in the bit count',
  Math.abs(hubbleR() - 1.3725e26) / 1.3725e26 < 1e-3 && Math.abs(hubbleR() / 9.4607e15 / 1e9 - 14.5) < 0.1,
  `c/H0 = ${hubbleR().toExponential(4)} m = ${(hubbleR() / 9.4607e15 / 1e9).toFixed(2)} Gly`);

console.log('\n=== 6-8. What the axis shows ===\n');

ok('THE DIVISION IS NOT A RANKING. Two things sit essentially ON the bound and both are horizons; four things made of matter sit thirty to sixty orders of magnitude below it. Nothing lands in between, and nothing material comes close',
  (() => { const withR = HOLDERS.filter(h => h.R > 0);
    const near = withR.filter(h => occ(h) > 0.5).map(h => h.id);
    const far = withR.filter(h => occ(h) < 1e-30).map(h => h.id);
    return near.length === 2 && near.includes('hole') && near.includes('universe') && far.length === 4; })(),
  HOLDERS.filter(h => h.R > 0).map(h => `${h.id} ${occ(h).toExponential(1)}`).join(' · '));

ok('and the spread between the fullest and the emptiest is sixty-one orders of magnitude — a book uses 1e-62 of what a sphere its size could hold',
  (() => { const o = HOLDERS.filter(h => h.R > 0).map(occ);
    const spread = Math.max(...o) / Math.min(...o); return spread > 1e55 && spread < 1e70; })(),
  `spread ${(Math.max(...HOLDERS.filter(h => h.R > 0).map(occ)) / Math.min(...HOLDERS.filter(h => h.R > 0).map(occ))).toExponential(2)}`);

ok('OCCUPANCY GOES AS ONE OVER R SQUARED, so a structural check with its threshold at one half tolerates a radius wrong by a factor of 1.41 in either direction before it notices. That is the weakness of every check written as a comparison, and it is why the equality above is the one carrying the weight here',
  (() => { const b = bitsFromJK(horizonEntropy(schwarzschildArea(MSUN)));
    const tol = b / bound(rs(MSUN) * 1.41), broken = b / bound(rs(MSUN) * 1.42);
    return tol > 0.5 && broken < 0.5; })(),
  `radius x1.41 still reads ${(bitsFromJK(horizonEntropy(schwarzschildArea(MSUN))) / bound(rs(MSUN) * 1.41)).toFixed(4)} of the bound; x1.42 finally drops below one half`);

console.log('\n=== 9-10. Why area and not volume, and the one entry with no radius ===\n');

ok('A BOUND THAT WENT AS VOLUME WOULD PUT THE SUN OVER ITS OWN LIMIT — that is the whole content of the second station, and the reason the distinction is not decoration. Counting Planck VOLUMES inside the Sun gives more capacity than counting Planck areas on it by forty-three orders of magnitude, and the thing that is actually true is the smaller number',
  (() => { const R = 6.957e8;
    const area = bound(R);
    const vol = (4 / 3) * Math.PI * R * R * R / Math.pow(planckArea(), 1.5) / LN2;
    return vol > area && vol / area > 1e40; })(),
  `Sun: area bound ${bound(6.957e8).toExponential(2)} bits · a volume count would give ${((4 / 3) * Math.PI * Math.pow(6.957e8, 3) / Math.pow(planckArea(), 1.5) / LN2).toExponential(2)} — ${(((4 / 3) * Math.PI * Math.pow(6.957e8, 3) / Math.pow(planckArea(), 1.5) / LN2) / bound(6.957e8)).toExponential(1)} times larger`);

ok('and the erased bit is given NO radius, because it is a statement about energy per operation and not about a thing that holds anything. A radius invented for it to fill the column would be the one dishonest entry on the rail, and an absent value said out loud is worth more than a plausible one',
  HOLDERS.filter(h => !(h.R > 0)).length === 1 && HOLDERS.filter(h => !(h.R > 0))[0].id === 'bit',
  'one holder of seven carries no radius, and it is the erased bit');

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
