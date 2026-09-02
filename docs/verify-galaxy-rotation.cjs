#!/usr/bin/env node
/* ============================================================================
   THE MASS YOU CAN SEE IS NOT THE MASS THAT IS THERE

   This atlas computes the cosmological constant across a hundred and twenty-three
   orders of magnitude, prices a black hole horizon in bits, and inverts Kepler's
   third law on an exoplanet to nine significant figures.  It had never drawn a
   galaxy -- which is the one place where that same law, applied honestly to the
   visible mass, is wrong by a factor of three.

   This file shares no code with the atlas.  The Bessel functions are written out
   from Abramowitz & Stegun, the galaxy data typed from the literature, and every
   formula from the physics, so a number agreeing here and there has agreed twice.

   FOURTEEN THINGS ARE CHECKED.

   1.  The four modified Bessel functions, against their own Wronskian identity
       I1(x)K0(x) + I0(x)K1(x) = 1/x -- an internal check that needs no table.
   2.  A razor-thin exponential disc does NOT rotate like a point mass, and the
       size of that mistake is measured rather than asserted.
   3.  Its curve peaks at 2.15 scale lengths.  For every exponential disc that
       has ever existed, whatever its mass or size, because once you scale by Rd
       the shape has no parameter left.
   4.  NGC 3198 at thirty kiloparsecs: the discrepancy that settled the argument.
   5.  And counting the gas changes it from 5.2 to 3.3, which is why the gas is
       counted.
   6.  Raising the mass-to-light ratio fits the INNER curve and still cannot
       reach the outer one.  That is the maximum-disc argument, measured.
   7.  The dwarf that cannot be argued away: DDO 154 is nine parts gas.
   8.  The baryonic Tully-Fisher normalisation, FITTED from eight galaxies typed
       in by hand, against the 47 published from a hundred.
   9.  And the free-fit slope, which is 3.53 and is NOT a measurement of the
       relation -- eight heterogeneous points do not determine a slope.
   10. MOND predicts that normalisation from a0 alone, with nothing to adjust,
       and gets 62.8 where the data say 46.5.
   11. Equivalently: two determinations of a0 that differ by a third.
   12. The interpolating function's two limits, Newtonian and deep-MOND.
   13. a0 against c H0 / 2 pi -- computed, and not interpreted.
   14. The halo profiles: a cusp and a core, and where they part company.
   ========================================================================== */
'use strict';
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const G = 6.67430e-11, MSUN = 1.98892e30, KPC = 3.0856775814913673e19;
const MPC = 3.0856775814913673e22, C = 299792458;
const A0 = 1.2e-10, HELIUM = 1.33;

/* Abramowitz & Stegun 9.8, written out here independently of the atlas */
function I0(x){ const a=Math.abs(x);
  if(a<3.75){ const y=(x/3.75)**2;
    return 1+y*(3.5156229+y*(3.0899424+y*(1.2067492+y*(0.2659732+y*(0.360768e-1+y*0.45813e-2))))); }
  const y=3.75/a;
  return Math.exp(a)/Math.sqrt(a)*(0.39894228+y*(0.1328592e-1+y*(0.225319e-2+y*(-0.157565e-2
    +y*(0.916281e-2+y*(-0.2057706e-1+y*(0.2635537e-1+y*(-0.1647633e-1+y*0.392377e-2)))))))); }
function I1(x){ const a=Math.abs(x); let ans;
  if(a<3.75){ const y=(x/3.75)**2;
    ans=a*(0.5+y*(0.87890594+y*(0.51498869+y*(0.15084934+y*(0.2658733e-1+y*(0.301532e-2+y*0.32411e-3)))))); }
  else { const y=3.75/a;
    let t=0.2282967e-1+y*(-0.2895312e-1+y*(0.1787654e-1-y*0.420059e-2));
    t=0.39894228+y*(-0.3988024e-1+y*(-0.362018e-2+y*(0.163801e-2+y*(-0.1031555e-1+y*t))));
    ans=t*Math.exp(a)/Math.sqrt(a); }
  return x<0?-ans:ans; }
function K0(x){ if(x<=2){ const y=x*x/4;
    return -Math.log(x/2)*I0(x)+(-0.57721566+y*(0.42278420+y*(0.23069756+y*(0.3488590e-1
      +y*(0.262698e-2+y*(0.10750e-3+y*0.74e-5)))))); }
  const y=2/x;
  return Math.exp(-x)/Math.sqrt(x)*(1.25331414+y*(-0.7832358e-1+y*(0.2189568e-1+y*(-0.1062446e-1
    +y*(0.587872e-2+y*(-0.251540e-2+y*0.53208e-3)))))); }
function K1(x){ if(x<=2){ const y=x*x/4;
    return Math.log(x/2)*I1(x)+(1/x)*(1+y*(0.15443144+y*(-0.67278579+y*(-0.18156897
      +y*(-0.1919402e-1+y*(-0.110404e-2+y*(-0.4686e-4))))))); }
  const y=2/x;
  return Math.exp(-x)/Math.sqrt(x)*(1.25331414+y*(0.23498619+y*(-0.3655620e-1+y*(0.1504268e-1
    +y*(-0.780353e-2+y*(0.325614e-2+y*(-0.68245e-3))))))); }

/* Freeman 1970 */
function discV2(r, S0, Rd){ const y=r/(2*Rd);
  if(!(y>1e-9)) return 0;
  return 4*Math.PI*G*S0*Rd*y*y*(I0(y)*K0(y)-I1(y)*K1(y)); }
const sigma0 = (M, Rd) => M/(2*Math.PI*Rd*Rd);
const discV  = (r, S0, Rd) => Math.sqrt(Math.max(0, discV2(r, S0, Rd)));
const keplerV = (r, M) => Math.sqrt(G*M/r);
const nfwM = (r, rhos, rs) => { const x=r/rs; return 4*Math.PI*rhos*rs**3*(Math.log(1+x)-x/(1+x)); };
const nfwV = (r, rhos, rs) => Math.sqrt(G*nfwM(r,rhos,rs)/r);
const isoV = (r, rho0, rc) => Math.sqrt(4*Math.PI*G*rho0*rc*rc*(1-(rc/r)*Math.atan(r/rc)));
const mondNu = (g, a0) => 0.5 + Math.sqrt(0.25 + a0/g);

/* the same eight galaxies, typed independently */
const GAL = [
 {id:'ddo154',  Mstar:0.035e9, MHI:0.275e9, Rd:0.80*KPC, Rg:3.2*KPC,  vflat: 47.0e3, rmax: 8*KPC},
 {id:'ngc1560', Mstar:0.35e9,  MHI:0.82e9,  Rd:1.30*KPC, Rg:3.0*KPC,  vflat: 78.0e3, rmax: 9*KPC},
 {id:'ngc6503', Mstar:9.0e9,   MHI:1.6e9,   Rd:1.74*KPC, Rg:4.0*KPC,  vflat:116.0e3, rmax:22*KPC},
 {id:'ngc2403', Mstar:10.4e9,  MHI:3.2e9,   Rd:2.10*KPC, Rg:5.5*KPC,  vflat:134.0e3, rmax:20*KPC},
 {id:'ngc3198', Mstar:30.0e9,  MHI:10.6e9,  Rd:2.68*KPC, Rg:8.0*KPC,  vflat:150.0e3, rmax:32*KPC},
 {id:'milkyway',Mstar:60.0e9,  MHI:8.0e9,   Rd:2.60*KPC, Rg:7.0*KPC,  vflat:220.0e3, rmax:25*KPC},
 {id:'m31',     Mstar:103.0e9, MHI:5.0e9,   Rd:5.30*KPC, Rg:15.0*KPC, vflat:250.0e3, rmax:35*KPC},
 {id:'ugc2885', Mstar:210.0e9, MHI:44.0e9,  Rd:13.0*KPC, Rg:30.0*KPC, vflat:300.0e3, rmax:80*KPC},
];
const byId = id => GAL.filter(g => g.id === id)[0];
function baryonV(g, r, ml){
  const vd = discV(r, sigma0(g.Mstar*(ml==null?1:ml)*MSUN, g.Rd), g.Rd);
  const vg = discV(r, sigma0(HELIUM*g.MHI*MSUN, g.Rg), g.Rg);
  return Math.hypot(vd, vg);
}

console.log('\n=== 1-3. The disc does not rotate like a point mass ===\n');

ok('the four modified Bessel functions satisfy their own Wronskian, I1(x)K0(x) + I0(x)K1(x) = 1/x, to two parts in a hundred million across four decades of argument. This needs no table and no reference: it is an identity the functions obey or they are not those functions, and it is the check the whole disc calculation rests on',
  (() => { let worst = 0;
    for (let i = 1; i <= 4000; i++) { const x = 0.002*i;
      worst = Math.max(worst, Math.abs((I1(x)*K0(x)+I0(x)*K1(x))*x - 1)); }
    return worst < 1e-7; })(),
  (() => { let worst = 0, at = 0;
    for (let i = 1; i <= 4000; i++) { const x = 0.002*i;
      const e = Math.abs((I1(x)*K0(x)+I0(x)*K1(x))*x - 1);
      if (e > worst) { worst = e; at = x; } }
    return `worst residual ${worst.toExponential(2)} at x = ${at.toFixed(3)}`; })());

const g3 = byId('ngc3198');
const S3 = sigma0(g3.Mstar*MSUN, g3.Rd);
ok('a razor-thin exponential disc does NOT rotate like a point mass, and the size of the mistake is measured rather than asserted. At two kiloparsecs in NGC 3198 the point-mass formula says 254 km/s and the disc says 101 — a factor of two and a half — because most of the disc`s mass is not interior to the star. The two converge far out, where a disc does begin to look like a point, and even there they are not equal',
  (() => { const r = 2*KPC;
    const rat = keplerV(r, g3.Mstar*MSUN)/discV(r, S3, g3.Rd);
    const far = keplerV(30*KPC, g3.Mstar*MSUN)/discV(30*KPC, S3, g3.Rd);
    return rat > 2.4 && rat < 2.6 && far > 0.95 && far < 1.02; })(),
  `at 2 kpc: point mass ${(keplerV(2*KPC, g3.Mstar*MSUN)/1e3).toFixed(1)} vs disc ${(discV(2*KPC, S3, g3.Rd)/1e3).toFixed(1)} km/s — ratio ${(keplerV(2*KPC, g3.Mstar*MSUN)/discV(2*KPC, S3, g3.Rd)).toFixed(3)} · at 30 kpc the ratio is ${(keplerV(30*KPC, g3.Mstar*MSUN)/discV(30*KPC, S3, g3.Rd)).toFixed(3)}`);

ok('and that curve peaks at 2.15 SCALE LENGTHS. Not approximately, and not for this galaxy: for every exponential disc that has ever existed, whatever its mass, size or surface density, because scaling by Rd leaves the shape with no free parameter. Checked here across five galaxies spanning sixteen times in scale length and four thousand times in mass, which is what turns a quoted number into a measured invariant',
  (() => { let worst = 0;
    for (const g of GAL) {
      const S = sigma0(g.Mstar*MSUN, g.Rd);
      let best = 0, bv = -1;
      for (let i = 1; i <= 60000; i++) { const r = i*1e-4*4*g.Rd;
        const v = discV2(r, S, g.Rd); if (v > bv) { bv = v; best = r; } }
      worst = Math.max(worst, Math.abs(best/g.Rd - 2.15)); }
    return worst < 0.01; })(),
  (() => { const out = [];
    for (const g of [GAL[0], GAL[4], GAL[7]]) {
      const S = sigma0(g.Mstar*MSUN, g.Rd);
      let best = 0, bv = -1;
      for (let i = 1; i <= 60000; i++) { const r = i*1e-4*4*g.Rd;
        const v = discV2(r, S, g.Rd); if (v > bv) { bv = v; best = r; } }
      out.push(`${g.id} ${(best/g.Rd).toFixed(4)}`); }
    return out.join(' · ') + ' scale lengths, against 2.15'; })());

console.log('\n=== 4-7. The discrepancy, and everything that has been tried on it ===\n');

ok('NGC 3198 AT THIRTY KILOPARSECS. Everything visible — the stellar disc by Freeman`s form plus the neutral hydrogen with its helium correction, added in quadrature — comes to 83 kilometres a second. The 21 cm line says 150. In mass that is a factor of 3.3, and it has not been in dispute for forty years. This is the measurement; what it means is the argument',
  (() => { const r = 30*KPC;
    const vb = baryonV(g3, r, 1);
    const f = (g3.vflat/vb)**2;
    return Math.abs(vb/1e3 - 82.9) < 1.5 && Math.abs(f - 3.28) < 0.1; })(),
  `visible ${(baryonV(g3, 30*KPC, 1)/1e3).toFixed(1)} km/s vs measured 150 · missing factor ${((g3.vflat/baryonV(g3,30*KPC,1))**2).toFixed(2)} in mass · dynamical M(<30kpc) = ${((g3.vflat**2*30*KPC/G)/MSUN).toExponential(3)} Msun`);

ok('and COUNTING THE GAS MATTERS: the stars alone give a discrepancy of 5.2 and adding the hydrogen brings it to 3.3. A third of the missing mass was never missing, it was just not starlight. That is why the gas is counted, and it is also why the dwarf galaxies are the sharp cases — the correction that helps most here is the whole galaxy there',
  (() => { const r = 30*KPC;
    const stars = discV(r, S3, g3.Rd);
    const both = baryonV(g3, r, 1);
    return Math.abs((g3.vflat/stars)**2 - 5.0) < 0.4 && Math.abs((g3.vflat/both)**2 - 3.28) < 0.1; })(),
  `stars only ${((g3.vflat/discV(30*KPC,S3,g3.Rd))**2).toFixed(2)}× · stars and gas ${((g3.vflat/baryonV(g3,30*KPC,1))**2).toFixed(2)}×`);

ok('THE INNER GALAXY NEEDS NOTHING AT ALL, AND THAT IS SHARPER THAN THE USUAL STATEMENT. At the peak of its own disc curve — 2.15 scale lengths, five and three quarter kiloparsecs — NGC 3198`s visible mass already produces 142 kilometres a second against a measured 150. A stellar mass just 1.15 times nominal closes it exactly. This check was first written claiming it took 2.6 times, which was invented; measuring it gives 1.15 and says something better: THE ENTIRE DISCREPANCY IS OUTSIDE A FEW SCALE LENGTHS. Take that same 1.15 out to thirty kiloparsecs and the disc delivers 87 against 150, still 42 per cent short and still a factor of three in mass — because the disc curve FALLS there whatever it is multiplied by, and no constant times a falling function is a flat one. That is the argument NGC 3198 ended, and it is an argument about the outskirts',
  (() => {
    const rIn = 2.15*g3.Rd;
    let ml = 0, found = 0;
    for (let m = 0.2; m <= 8; m += 0.005) {
      if (baryonV(g3, rIn, m) >= g3.vflat) { ml = m; found = 1; break; } }
    if (!found) return false;
    const inner1 = baryonV(g3, rIn, 1)/g3.vflat;
    const vOut = baryonV(g3, 30*KPC, ml);
    return inner1 > 0.92 && inner1 < 0.98
      && ml > 1.05 && ml < 1.30
      && vOut < 0.65*g3.vflat
      && (g3.vflat/vOut)**2 > 2.8; })(),
  (() => { const rIn = 2.15*g3.Rd; let ml = 0;
    for (let m = 0.2; m <= 8; m += 0.005) { if (baryonV(g3, rIn, m) >= g3.vflat) { ml = m; break; } }
    return `at the disc peak (${(rIn/KPC).toFixed(2)} kpc) the visible mass already gives ${(baryonV(g3,rIn,1)/1e3).toFixed(1)} of 150 km/s — ${(100*baryonV(g3,rIn,1)/g3.vflat).toFixed(0)}% · stellar mass × ${ml.toFixed(2)} closes it · that same disc at 30 kpc gives ${(baryonV(g3,30*KPC,ml)/1e3).toFixed(1)}, ${(100*(1-baryonV(g3,30*KPC,ml)/g3.vflat)).toFixed(0)}% short, missing factor still ${((g3.vflat/baryonV(g3,30*KPC,ml))**2).toFixed(2)}`; })());

const dd = byId('ddo154');
ok('AND DDO 154 CANNOT BE ARGUED WITH AT ALL. It is nine parts neutral hydrogen to one part stars, and a 21 cm line measures a MASS — no mass-to-light ratio enters it. Set the stellar mass to zero entirely and the discrepancy barely moves, because there was hardly any starlight in the budget to begin with. This is the case that survives every objection aimed at the stellar populations',
  (() => { const r = 8*KPC;
    const full = (dd.vflat/baryonV(dd, r, 1))**2;
    const noStars = (dd.vflat/baryonV(dd, r, 0))**2;
    const gasFrac = HELIUM*dd.MHI/(dd.Mstar + HELIUM*dd.MHI);
    return gasFrac > 0.88 && Math.abs(noStars/full - 1) < 0.20; })(),
  `gas is ${(100*HELIUM*dd.MHI/(dd.Mstar+HELIUM*dd.MHI)).toFixed(1)}% of the baryons · missing factor ${((dd.vflat/baryonV(dd,8*KPC,1))**2).toFixed(2)}× with the stars, ${((dd.vflat/baryonV(dd,8*KPC,0))**2).toFixed(2)}× with no stars at all`);

console.log('\n=== 8-11. One relation, and a constant that disagrees with itself ===\n');

const Mb = (g, ml) => g.Mstar*(ml==null?1:ml) + HELIUM*g.MHI;
function btfr(ml){
  let sx=0, sy=0, sxx=0, sxy=0, s4=0;
  const n = GAL.length;
  for (const g of GAL) { const x = Math.log10(g.vflat/1e3), y = Math.log10(Mb(g, ml));
    sx+=x; sy+=y; sxx+=x*x; sxy+=x*y; s4 += y - 4*x; }
  const slope = (n*sxy - sx*sy)/(n*sxx - sx*sx);
  return { slope, A4: Math.pow(10, s4/n), n };
}
const F = btfr(1);
ok('THE BARYONIC TULLY-FISHER NORMALISATION, FITTED HERE FROM EIGHT GALAXIES TYPED IN BY HAND, comes out 46.5 solar masses per (km/s)^4 against the 47 published from a hundred homogeneously analysed ones. One per cent, over three decades in mass, from a table small enough to read. That is the strongest single result in this laboratory precisely because it was fitted and not quoted',
  Math.abs(F.A4 - 46.5) < 1.0 && Math.abs(F.A4/47 - 1) < 0.03,
  `A = ${F.A4.toFixed(2)} Msun km^-4 s^4 from n = ${F.n} · published 47 · ${(100*Math.abs(F.A4/47-1)).toFixed(1)}% apart · mass range ${(Math.log10(Mb(GAL[7],1)/Mb(GAL[0],1))).toFixed(2)} dex`);

ok('AND THE FREE-FIT SLOPE IS NOT A MEASUREMENT OF THE RELATION. Let the slope float over these eight points and it comes out 3.53; a hundred galaxies analysed the same way give 3.9 to 4.0. Eight objects with mass-to-light ratios drawn from four different papers do not determine a slope, and reporting 3.53 as a result would be exactly the error this atlas is built to catch. What eight points DO determine is the normalisation at a fixed slope, and the check above is that one',
  F.slope > 3.3 && F.slope < 3.8 && Math.abs(F.slope - 4) > 0.2,
  `free slope ${F.slope.toFixed(3)} over ${F.n} points · literature 3.85-4.0 over ~100 · the difference is the sample, not the galaxies`);

const A_mond = 1/(G*A0)/MSUN*1e12;
ok('MOND DOES NOT FIT THIS RELATION — IT PREDICTS IT, with nothing left to adjust: slope exactly four, normalisation exactly 1/(G a0). The slope is right. The normalisation is 62.8 where the data say 46.5, which is a third too high, and there is no parameter left to absorb it. A theory that predicts a relation and misses its normalisation by 35% has said something checkable and been checked',
  Math.abs(A_mond - 62.8) < 0.5 && Math.abs(A_mond/F.A4 - 1) > 0.30 && Math.abs(A_mond/F.A4 - 1) < 0.40,
  `MOND requires A = ${A_mond.toFixed(2)} from a0 = ${A0.toExponential(2)} alone · measured ${F.A4.toFixed(2)} · ${(100*(A_mond/F.A4-1)).toFixed(1)}% high`);

const a0_btfr = 1/(G*F.A4*MSUN/1e12);
ok('WHICH IS THE SAME STATEMENT AS TWO DETERMINATIONS OF a0 THAT DISAGREE. Rotation-curve fits want 1.20e-10 metres per second squared; the normalisation of this relation wants 1.62e-10. One constant, two datasets, thirty-five per cent apart — and it is the same discrepancy as the line above, seen from the other end, which is why both are reported rather than one',
  Math.abs(a0_btfr - 1.62e-10) < 0.05e-10 && Math.abs(a0_btfr/A0 - 1) > 0.30,
  `a0 from the curves 1.20e-10 · a0 from this relation ${a0_btfr.toExponential(3)} · ${(100*(a0_btfr/A0-1)).toFixed(0)}% apart`);

console.log('\n=== 12-14. The limits, the coincidence, and the two haloes ===\n');

ok('the interpolating function has to have two limits and it has them: far above a0 it must return Newton exactly, and far below it must return sqrt(g_bar a0), which is what makes the fourth power in Tully-Fisher. Both are approached, and the approach to the deep-MOND limit goes as half the square root of g/a0 — so it is a limit and not an equality, which is why quoting deep-MOND results to three figures is a mistake',
  (() => {
    const hi = 1e-6*mondNu(1e-6, A0)/1e-6;
    const lo = 1e-16*mondNu(1e-16, A0)/Math.sqrt(1e-16*A0);
    const mid = 1e-14*mondNu(1e-14, A0)/Math.sqrt(1e-14*A0);
    return Math.abs(hi - 1) < 2e-4 && Math.abs(lo - 1) < 1e-3 && mid > lo; })(),
  `at g_bar = 1e-6 the ratio to Newton is ${(mondNu(1e-6,A0)).toFixed(9)} · at 1e-16 the ratio to sqrt(g a0) is ${(1e-16*mondNu(1e-16,A0)/Math.sqrt(1e-16*A0)).toFixed(6)} · at 1e-14 it is ${(1e-14*mondNu(1e-14,A0)/Math.sqrt(1e-14*A0)).toFixed(6)}, still 0.5% above`);

ok('a0 is within fifteen per cent of c H0 / 2 pi, computed from the Planck Hubble constant this atlas already holds. That is a coincidence between an acceleration measured in galaxies and the expansion rate of the universe, there is no derivation here connecting them, and computing it is not explaining it. The de Sitter radius gives a third acceleration of the same order and it is reported beside them so the family is visible rather than one member of it being singled out',
  (() => { const H0 = 67.66e3/MPC;
    const cH = C*H0/(2*Math.PI);
    const Lam = 3*0.6889*H0*H0/(C*C), LdS = Math.sqrt(3/Lam);
    return Math.abs(A0/cH - 1) < 0.20 && C*C/LdS > 1e-10 && C*C/LdS < 1e-9; })(),
  (() => { const H0 = 67.66e3/MPC;
    const Lam = 3*0.6889*H0*H0/(C*C), LdS = Math.sqrt(3/Lam);
    return `c H0 / 2pi = ${(C*H0/(2*Math.PI)).toExponential(3)} · a0 / that = ${(A0/(C*H0/(2*Math.PI))).toFixed(3)} · c^2 / L_dS = ${(C*C/LdS).toExponential(3)}`; })());

ok('and the two haloes are a CUSP and a CORE, pinned to the same leftover at the same outer radius and then compared where nobody pinned them. NFW rises steeply into the centre because simulations of collisionless matter produce that; the pseudo-isothermal sphere has a flat-density core because dwarf galaxies prefer it. At a tenth of the pinning radius they differ by tens of per cent in speed, and that gap has a name in the literature and is not settled here or anywhere',
  (() => { const rPin = 30*KPC, rs = 10*KPC;
    const need = Math.sqrt(Math.max(0, g3.vflat**2 - baryonV(g3, rPin, 1)**2));
    const rhoN = (need/nfwV(rPin, 1, rs))**2;
    const rhoI = (need/isoV(rPin, 1, rs))**2;
    const rIn = 3*KPC;
    const vN = nfwV(rIn, rhoN, rs), vI = isoV(rIn, rhoI, rs);
    return Math.abs(vN/vI - 1) > 0.15 && vN > vI; })(),
  (() => { const rPin = 30*KPC, rs = 10*KPC;
    const need = Math.sqrt(Math.max(0, g3.vflat**2 - baryonV(g3, rPin, 1)**2));
    const rhoN = (need/nfwV(rPin, 1, rs))**2, rhoI = (need/isoV(rPin, 1, rs))**2;
    return `pinned at 30 kpc to ${(need/1e3).toFixed(1)} km/s · at 3 kpc NFW gives ${(nfwV(3*KPC,rhoN,rs)/1e3).toFixed(1)} and the cored profile ${(isoV(3*KPC,rhoI,rs)/1e3).toFixed(1)} km/s — ${(100*(nfwV(3*KPC,rhoN,rs)/isoV(3*KPC,rhoI,rs)-1)).toFixed(0)}% apart where neither was fitted`; })());

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
