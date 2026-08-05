/* ── ITEMS 2 AND 3 OF THE OPEN LIST, DERIVED RATHER THAN QUOTED ───────────────
   The report ends with six things it does not do.  Two of them are not research at
   all once the model is declared — they are calculations, and this file does them
   from Bernoulli polynomials, independently of the atlas.

     2. "Fix the full field content, statistics, masses, curvature couplings and
         renormalization conditions."
     3. "Solve G + Λg = 8πG⟨T⟩/c⁴ with backreaction."

   Nothing here is taken from a table.  Every Casimir coefficient is computed from its
   own spectrum on the round S³ by Hurwitz-zeta continuation, and the backreaction
   radius follows from the two Einstein static conditions in closed form. */
const HBAR=1.054571817e-34, C=2.99792458e8, G=6.67430e-11;
const lP=Math.sqrt(HBAR*G/(C*C*C));
const rel=(a,b)=>Math.abs(a-b)/Math.max(1e-300,Math.abs(b));
const out=[]; const ok=(n,c,d)=>out.push([c?'PASS':'FAIL',n,d]);

/* Bernoulli polynomials B1..B4, and ζ_H(−n, a) = −B_{n+1}(a)/(n+1) */
const B2=x=>x*x-x+1/6;
const B4=x=>x*x*x*x-2*x*x*x+x*x-1/30;
const zetaH=(negN,a)=>{ // negN = 1 or 3, returns zeta_H(-negN, a)
  if(negN===1) return -B2(a)/2;
  if(negN===3) return -B4(a)/4;
  throw new Error('only -1 and -3 needed');
};
ok('zeta(-1) = -1/12 and zeta(-3) = 1/120 from Bernoulli polynomials at a = 1',
  rel(zetaH(1,1),-1/12)<1e-15 && rel(zetaH(3,1),1/120)<1e-15,
  `zeta(-1) = ${zetaH(1,1).toFixed(12)} · zeta(-3) = ${zetaH(3,1).toFixed(12)}`);

/* ── THE THREE SPECTRA ON THE ROUND S^3 ────────────────────────────────────────
   Each species contributes E = (+/-) (hbar c / 2R) * S, with S the zeta-continued sum
   of (degeneracy x dimensionless frequency) and the sign set by the statistics.
   Every S below is also computed by BRUTE FORCE with an exponential regulator, so the
   closed form is checked against an independent summation and not merely asserted. */

/* conformally coupled massless real scalar: omega_b = b c/R, g_b = b^2, b >= 1 */
const S_scalar = zetaH(3,1);                                  // sum b^3 = zeta(-3)
/* photon (transverse vector): omega_n = (n+1)c/R, g = 2n(n+2), n >= 1
   with m = n+1 >= 2 the summand is 2m^3 - 2m, so S = 2 zeta(-3) - 2 zeta(-1)
   (the m = 1 term of the shifted sum vanishes identically, 2-2 = 0) */
const S_photon = 2*zetaH(3,1) - 2*zetaH(1,1);
/* massless Dirac: |omega_n| = (n+3/2)c/R, g = 2(n+1)(n+2), n >= 0
   with k = n+3/2 the summand is 2(k^2 - 1/4)k = 2k^3 - k/2 */
const S_dirac  = 2*zetaH(3,1.5) - 0.5*zetaH(1,1.5);

ok('conformal scalar on S^3: sum b^3 = zeta(-3) = 1/120, so E = hbar c/(240 R)',
  rel(S_scalar,1/120)<1e-15, `S = ${S_scalar.toFixed(12)} -> E = hbar c/${(2/S_scalar).toFixed(0)}R`);
ok('photon on S^3: omega=(n+1)/R with g=2n(n+2) gives S = 2zeta(-3)-2zeta(-1) = 11/60, so E = 11 hbar c/(120 R)',
  rel(S_photon,11/60)<1e-15, `S = ${S_photon.toFixed(12)} = 11/60 -> E = 11 hbar c/120R`);
ok('massless Dirac on S^3: |omega|=(n+3/2)/R with g=2(n+1)(n+2) gives S = -17/480, and the FERMIONIC SIGN turns it into E = +17 hbar c/(960 R)',
  rel(S_dirac,-17/480)<1e-15, `S = ${S_dirac.toFixed(12)} = -17/480 -> E = 17 hbar c/960R`);

/* the same three sums, by brute force with an exponential regulator and Richardson
   extrapolation in the regulator — no zeta function anywhere in this block */
function regulated(term,nMax,epsList){
  // term(n) for n=0.., summed with exp(-eps*omega); fit S(eps) = a/eps^4 + b/eps^2 + S + O(eps^2)
  const vals=epsList.map(e=>{ let s=0; for(let n=0;n<nMax;n++){ const [g,w]=term(n); const x=e*w;
    if(x>60) break; s+=g*w*Math.exp(-x); } return s; });
  // solve for the eps-independent part by least squares on 1/e^4, 1/e^2, 1, e^2
  const A=epsList.map(e=>[1/(e*e*e*e),1/(e*e),1,e*e]);
  // normal equations, 4x4
  const M=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]], y=[0,0,0,0];
  for(let k=0;k<A.length;k++) for(let i=0;i<4;i++){ y[i]+=A[k][i]*vals[k];
    for(let j=0;j<4;j++) M[i][j]+=A[k][i]*A[k][j]; }
  // gaussian elimination
  for(let i=0;i<4;i++){ let p=i; for(let r=i+1;r<4;r++) if(Math.abs(M[r][i])>Math.abs(M[p][i])) p=r;
    [M[i],M[p]]=[M[p],M[i]]; [y[i],y[p]]=[y[p],y[i]];
    for(let r=i+1;r<4;r++){ const f=M[r][i]/M[i][i]; for(let c=i;c<4;c++) M[r][c]-=f*M[i][c]; y[r]-=f*y[i]; } }
  const x=[0,0,0,0];
  for(let i=3;i>=0;i--){ let s=y[i]; for(let j=i+1;j<4;j++) s-=M[i][j]*x[j]; x[i]=s/M[i][i]; }
  return x[2];
}
const eps=[0.02,0.025,0.03,0.035,0.04,0.05];
const bruteScalar=regulated(n=>{const b=n+1; return [b*b,b];},4000,eps);
const brutePhoton=regulated(n=>{const m=n+1; return [2*m*(m+2),m+1];},4000,eps);
const bruteDirac =regulated(n=>[2*(n+1)*(n+2),n+1.5],4000,eps);
ok('and the SAME three sums by brute force with an exponential regulator and no zeta function anywhere: the divergent 1/eps^4 and 1/eps^2 pieces are fitted away and the finite remainder is what the continuation says it is',
  rel(bruteScalar,S_scalar)<2e-3 && rel(brutePhoton,S_photon)<2e-3 && rel(bruteDirac,S_dirac)<2e-3,
  `scalar ${bruteScalar.toFixed(8)} vs ${S_scalar.toFixed(8)} · photon ${brutePhoton.toFixed(8)} vs ${S_photon.toFixed(8)} · Dirac ${bruteDirac.toFixed(8)} vs ${S_dirac.toFixed(8)}`);

/* ── THE COMPOSER ────────────────────────────────────────────────────────────
   A field content is a multiplicity for each species.  The total is A, defined by
   E_total = A hbar c / R, and A is what every downstream number depends on. */
const SPECIES={
  scalar:{S:S_scalar, sign:+1, dof:1,  label:'conformally coupled massless real scalar'},
  photon:{S:S_photon, sign:+1, dof:2,  label:'photon (transverse vector)'},
  dirac :{S:S_dirac,  sign:-1, dof:4,  label:'massless Dirac field'},
};
const totalA=content=>{ let A=0;
  for(const [k,n] of Object.entries(content)){ const s=SPECIES[k]; if(!s||!n) continue;
    A += n * s.sign * s.S / 2; }                 // E = sign * (hbar c/2R) * S, per field
  return A; };
ok('the composer reproduces each species alone: A = 1/240 for one scalar, 11/120 for one photon, 17/960 for one Dirac field',
  rel(totalA({scalar:1}),1/240)<1e-15 && rel(totalA({photon:1}),11/120)<1e-15 && rel(totalA({dirac:1}),17/960)<1e-15,
  `${totalA({scalar:1}).toFixed(9)} · ${totalA({photon:1}).toFixed(9)} · ${totalA({dirac:1}).toFixed(9)}`);

/* ── ITEM 3: THE BACKREACTION EQUATION, SOLVED ────────────────────────────────
   Einstein static universe, k = +1, sourced by the renormalized vacuum with the
   radiation equation of state p = eps/3 that the conformal spectrum forces:

     a-double-dot = 0  =>  Lambda = (4 pi G/c^4)(eps + 3p)
     H = 0             =>  c^2/R^2 = (8 pi G/3c^2) eps + Lambda c^2/3

   Eliminating Lambda gives c^2/R^2 = (4 pi G/c^2)(eps + p), and with p = eps/3 and
   eps = A hbar c/(2 pi^2 R^4) this closes:

     R* = l_P sqrt(8A/(3 pi))          Lambda* = 9 pi/(16 A) / l_P^2

   These are exact.  What they SAY is the point: A is of order 10^-2, so R* is a
   fraction of the Planck length — the unique self-consistent static solution of the
   model lies below the scale at which the semiclassical approximation it is built on
   can be trusted at all. */
const Rstar=A=>lP*Math.sqrt(8*A/(3*Math.PI));
const Lstar=A=>9*Math.PI/(16*A)/(lP*lP);
{
  // check by substitution rather than by repeating the algebra
  let worst=0, rows=[];
  for(const [name,content] of [['1 scalar',{scalar:1}],['1 photon',{photon:1}],
      ['1 Dirac',{dirac:1}],['SM-like 4s+1g+3f',{scalar:4,photon:1,dirac:3}]]){
    const A=totalA(content); if(!(A>0)) continue;
    const R=Rstar(A), L=Lstar(A);
    const eps=A*HBAR*C/(2*Math.PI*Math.PI*Math.pow(R,4)), p=eps/3;
    const lhs=C*C/(R*R), rhs=(4*Math.PI*G/(C*C))*(eps+p);          // H = 0 condition
    const lam=(4*Math.PI*G/Math.pow(C,4))*(eps+3*p);               // a-double-dot = 0
    worst=Math.max(worst,rel(lhs,rhs),rel(lam,L));
    rows.push(`${name}: A=${A.toFixed(6)} R*=${(R/lP).toFixed(4)} l_P`);
  }
  ok('ITEM 3 SOLVED: the two Einstein static conditions close in the declared model and the solution is exact — R* = l_P sqrt(8A/3pi) and Lambda* = 9pi/(16A)/l_P^2, verified by substituting back into both equations rather than by repeating the algebra',
    worst<1e-12, rows.join(' · ')+` · worst residual ${worst.toExponential(2)}`);
}
{
  const A=totalA({scalar:1});
  ok('and what it says: with one conformal scalar the self-consistent static radius is R* = l_P/sqrt(90 pi) = 0.0595 l_P — the model\'s only static solution sits SEVENTEEN TIMES BELOW the Planck length, which is where the semiclassical approximation it rests on stops being usable',
    rel(Rstar(A),lP/Math.sqrt(90*Math.PI))<1e-14 && Rstar(A)/lP<0.06,
    `R* = ${(Rstar(A)/lP).toFixed(6)} l_P = l_P/${(lP/Rstar(A)).toFixed(2)}`);
  // how much field content would it take to reach the Planck length?
  const Aneed=3*Math.PI/8;
  ok('and how far it is from being trustworthy, quantitatively: R* reaches l_P only at A = 3pi/8 = 1.178, which is about 283 conformal scalar fields or 13 photon fields — the model does not become semiclassically respectable until its field content is that large',
    rel(Rstar(Aneed),lP)<1e-14,
    `A needed = ${Aneed.toFixed(6)} = ${Math.round(Aneed*240)} scalars = ${(Aneed/(11/120)).toFixed(1)} photons`);
}
{
  const A=totalA({scalar:1}), L=Lstar(A);
  const Lobs=1.1056e-52;                       // observed, m^-2 (Planck 2018 LambdaCDM)
  ok('and the cosmological-constant problem, stated exactly inside the model instead of gestured at: the SAME static solution demands Lambda* = 9pi/(16A)/l_P^2, which is ~10^124 times the observed value — the model does not explain the discrepancy, it reproduces it with a definite number',
    L/Lobs>1e120 && L/Lobs<1e128,
    `Lambda* = ${L.toExponential(3)} m^-2 vs observed ${Lobs.toExponential(3)} m^-2 · ratio ${(L/Lobs).toExponential(2)}`);
}
{
  /* the sign question, which the composer must get right or every number above is wrong */
  const bosons=totalA({scalar:1,photon:1}), withFermions=totalA({scalar:1,photon:1,dirac:1});
  ok('fermions enter with the opposite sign and the composer respects it: adding one Dirac field to a scalar and a photon RAISES A, because the Dirac spectrum sum is itself negative and the statistics sign turns it positive again — getting this backwards would flip the sign of the whole vacuum',
    withFermions>bosons && rel(withFermions-bosons,17/960)<1e-14,
    `bosons A = ${bosons.toFixed(6)} · with one Dirac A = ${withFermions.toFixed(6)} · difference ${(withFermions-bosons).toFixed(9)} = 17/960`);
}

for(const [s,n,d] of out) console.log(s.padEnd(5), n, '\n      ', d);
console.log('\n', out.filter(r=>r[0]==='PASS').length+'/'+out.length, 'checks pass');
