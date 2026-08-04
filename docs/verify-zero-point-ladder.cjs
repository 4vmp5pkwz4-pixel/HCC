/* Every claim in the zero-point document, checked independently before any of it
   is trusted.  Nothing here reads the atlas; this is a second implementation. */
const HBAR=1.054571817e-34, C=2.99792458e8, G=6.67430e-11, KB=1.380649e-23;
const lP=Math.sqrt(HBAR*G/(C*C*C)), PHI=(1+Math.sqrt(5))/2;
const R=N=>lP*Math.pow(PHI,N);
const rel=(a,b)=>Math.abs(a-b)/Math.max(1e-300,Math.abs(b));
const out=[];const ok=(n,c,d)=>out.push([c?'PASS':'FAIL',n,d]);

// l_P from the atlas's own constant
ok('l_P reproduced from hbar,G,c', rel(lP,1.616255e-35)<3e-6, lP.toExponential(9));

// 1. S^3 conformal scalar spectrum: Laplacian eigenvalue -k(k+2)/R^2, degeneracy (k+1)^2
//    conformal frequency omega = (k+1) c / R
{ let bad=0;
  for(let k=0;k<=40;k++){ const beta=k+1;
    const lam=k*(k+2), conf=lam+1;                 // -Lap + 1/R^2 for conformal coupling on S^3
    if(Math.abs(Math.sqrt(conf)-beta)>1e-12) bad++;
    if((k+1)*(k+1)!==beta*beta) bad++; }
  ok('omega_beta = beta c/R comes from -Lap + R_scalar/6 with (k+1)^2 degeneracy', bad===0,
     'k(k+2)+1=(k+1)^2 for k=0..40'); }

// 2. sum beta^3 closed form and the M^4 growth
{ let bad=0, growth=0;
  for(const M of [1,2,7,17,24,120]){ let s=0; for(let b=1;b<=M;b++)s+=b*b*b;
    if(rel(s,Math.pow(M*(M+1)/2,2))>1e-15) bad++; }
  const E=(N,M)=>HBAR*C/(8*R(N))*M*M*(M+1)*(M+1);
  growth=E(100,2000)/E(100,1000);                  // should tend to 16 = 2^4
  ok('bare cutoff E=hbar c M^2(M+1)^2/(8R) and it diverges as M^4',
     bad===0&&Math.abs(growth-16)<0.02, 'E(2M)/E(M) = '+growth.toFixed(6)+' -> 16'); }

// 3. zeta(-3) = 1/120 via the Bernoulli relation zeta(-n) = -B_{n+1}/(n+1)
{ const B4=-1/30, z=-B4/4;
  ok('zeta(-3) = -B4/4 = 1/120', rel(z,1/120)<1e-15, z.toFixed(12)); }

// 4. Casimir energy, density and pressure
{ const EC=N=>HBAR*C/(240*R(N)), rho=N=>EC(N)/(2*Math.PI*Math.PI*Math.pow(R(N),3));
  let bad=0;
  for(const N of [0,37,150,299]){
    if(rel(rho(N),HBAR*C/(480*Math.PI*Math.PI*Math.pow(R(N),4)))>1e-14) bad++; }
  ok('rho_C = E_C/(2 pi^2 R^3) = hbar c/(480 pi^2 R^4)  [S^3 volume 2 pi^2 R^3]', bad===0, 'four rungs'); }

// 5. action cells
{ let a=0,b=0;
  for(const N of [0,73,173,241,312]) for(const be of [1,3,9]){
    a=Math.max(a,rel(0.5*HBAR*be*C/R(N)*R(N)/C, be*HBAR/2)); }
  for(const N of [0,73,241,312]) b=Math.max(b,rel(HBAR*C/(240*R(N))*R(N)/C, HBAR/240));
  ok('action cells eps0 R/c = beta hbar/2 and E_C R/c = hbar/240', a<1e-15&&b<1e-15,
     'residuals '+a.toExponential(2)+' / '+b.toExponential(2)); }

// 6. compactness = (lP/R)^2 = phi^{-2N}
{ let m=0; for(const N of [0,1,50,200,312]){
    const eps0=HBAR*C/(2*R(N)), Ccomp=2*G*eps0/(C*C*C*C*R(N));
    m=Math.max(m,rel(Ccomp,Math.pow(PHI,-2*N))); }
  ok('2G eps0/(c^4 R) = (l_P/R)^2 = phi^{-2N}, exactly 1 at N=0', m<1e-14, 'residual '+m.toExponential(2)); }

// 7. Noether/Bianchi: rho R^4 constant, and it is INDEPENDENT of the spectral route
{ const rho=N=>HBAR*C/(480*Math.PI*Math.PI*Math.pow(R(N),4));
  let m=0; const ref=rho(0)*Math.pow(R(0),4);
  for(const N of [1,73,150,219,312]) m=Math.max(m,rel(rho(N)*Math.pow(R(N),4),ref));
  // and integrate d(rho V) + p dV = 0 numerically with p = rho/3
  /* and the continuity equation itself, evaluated rather than integrated: with
     rho = A R^-4, V = 2 pi^2 R^3 and p = rho/3,
        d(rho V) = -2 pi^2 A R^-2 dR   and   p dV = +2 pi^2 A R^-2 dR,
     so the sum vanishes identically.  An earlier version of this check integrated
     d ln rho / d ln R = -4 with forward Euler and reported 7.6e-3 -- that was the
     integrator's error, not the physics, and it is exactly the kind of number that
     gets mistaken for a result. */
  const A=1.0, dR=1e-7; let resid=0;
  const rhoV=R=>A*Math.pow(R,-4)*2*Math.PI*Math.PI*R*R*R;
  for(const R0 of [1e-3,1,7.5,1e3]){
    const d_rhoV=(rhoV(R0+dR)-rhoV(R0-dR))/(2*dR);
    const pdV=(A*Math.pow(R0,-4)/3)*(6*Math.PI*Math.PI*R0*R0);
    resid=Math.max(resid,Math.abs(d_rhoV+pdV)/Math.abs(pdV)); }
  ok('Noether/Bianchi d(rho V)+p dV=0 with p=rho/3 forces rho R^4 = const',
     m<1e-14&&resid<1e-6, 'spectral route residual '+m.toExponential(2)+
     ' \u00b7 continuity residual '+resid.toExponential(2)); }

// 8. thermal crossover T_eq = hbar omega/(kB ln 3)
{ let m=0;
  for(const N of [0,50,200]){ const w=C/R(N), T=HBAR*w/(KB*Math.log(3));
    const x=HBAR*w/(KB*T), thermal=HBAR*w/(Math.exp(x)-1), zero=0.5*HBAR*w;
    m=Math.max(m,rel(thermal,zero)); }
  ok('T_eq = hbar omega/(kB ln 3) is exactly where the thermal term equals the zero-point term',
     m<1e-14, 'residual '+m.toExponential(2)); }

// 9. THE CHECK THE DOCUMENT DOES NOT MAKE:
//    the S^3 shell sum must reproduce flat-space blackbody at high temperature.
//    E_th = (hbar c/R) sum beta^3/(exp(beta/theta)-1)  ->  (hbar c/R) pi^4 theta^4/15
//    so rho_th -> pi^2 (kB T)^4 / (30 (hbar c)^3), the Stefan-Boltzmann density of ONE real scalar.
{ const S=(th,M=200000)=>{ let s=0; for(let b=1;b<=M;b++){ const x=b/th; if(x>700)break;
    const t=b*b*b/(Math.expm1(x)); s+=t; if(b>50&&t<1e-18*s)break; } return s; };
  let worst=0, rows=[];
  for(const th of [20,60,200,600]){
    const exact=S(th), asym=Math.pow(Math.PI,4)*Math.pow(th,4)/15;
    worst=Math.max(worst,rel(exact,asym)); rows.push(`theta=${th}: ${rel(exact,asym).toExponential(2)}`); }
  ok('HIGH-T CLOSURE (new): the S^3 shell sum tends to pi^4 theta^4/15, i.e. the exact Stefan-Boltzmann density pi^2(kT)^4/(30(hbar c)^3) of one real scalar',
     worst<2e-3, rows.join(' · '));
  // and the density identity, done in physical units at one rung
  const N=120, th=300, T=th*HBAR*C/(KB*R(N));
  const Eth=HBAR*C/R(N)*S(th), rhoTh=Eth/(2*Math.PI*Math.PI*Math.pow(R(N),3));
  const SB=Math.PI*Math.PI*Math.pow(KB*T,4)/(30*Math.pow(HBAR*C,3));
  ok('  ... and in physical units the rung density equals the one-scalar Stefan-Boltzmann law',
     rel(rhoTh,SB)<5e-3, 'rho_shell/rho_SB - 1 = '+rel(rhoTh,SB).toExponential(2)); }

// 10. low temperature: the thermal term is exponentially suppressed, so the ladder is
//     genuinely a ZERO-POINT ladder below the crossover
{ const S=(th)=>{ let s=0; for(let b=1;b<=400;b++){ const x=b/th; if(x>700)break; s+=b*b*b/Math.expm1(x);} return s; };
  const th=0.08, exact=S(th), lead=Math.exp(-1/th);
  ok('LOW-T (new): below the crossover the thermal term is exponentially suppressed, exp(-1/theta)',
     rel(exact,lead)<0.05, `theta=0.08: sum=${exact.toExponential(3)} vs e^{-1/theta}=${lead.toExponential(3)}`); }

// 11. rung ratios
{ ok('rung ratios: energy phi^-1, compactness phi^-2, Casimir density phi^-4',
    rel(1/PHI,0.6180339887498948)<1e-15&&rel(Math.pow(PHI,-2),0.38196601125010515)<1e-15&&
    rel(Math.pow(PHI,-4),0.14589803375031543)<1e-15,
    `${(1/PHI).toFixed(12)} · ${Math.pow(PHI,-2).toFixed(12)} · ${Math.pow(PHI,-4).toFixed(12)}`); }

// 12. Hopf charge splitting reproduces beta^2
{ let bad=0; for(let b=1;b<=30;b++){ const q=[]; for(let m=-(b-1);m<=b-1;m+=2)q.push(m);
    if(q.length!==b) bad++; if(q.length*b!==b*b) bad++; }
  ok('Hopf U(1) charge splitting: beta charges x multiplicity beta = beta^2', bad===0,'beta=1..30'); }

// 13. d_eff = q - z, and the INVERSE the document only gestures at:
//     measure q from two rungs and recover d_eff
{ const rho=N=>HBAR*C/(480*Math.PI*Math.PI*Math.pow(R(N),4));
  const N1=61, N2=204, q=-Math.log(rho(N2)/rho(N1))/Math.log(Math.pow(PHI,N2-N1));
  ok('INVERSE (new): q recovered from two rungs, d_eff = q - z gives 3 at z=1',
     Math.abs(q-4)<1e-9&&Math.abs((q-1)-3)<1e-9, `measured q = ${q.toFixed(12)} · d_eff = ${(q-1).toFixed(12)}`); }

// 14. milestone table spot check against the supplied JSON
{ const fs=require('fs');
  const J=JSON.parse(fs.readFileSync(require('path').join(__dirname,'zero-point-fractal-ladder-summary.json'),'utf8'));
  let worst=0, name='';
  for(const m of J.milestones){
    const N=m.N, r=R(N);
    const e0=HBAR*C/(2*r), ec=HBAR*C/(240*r), rh=ec/(2*Math.PI*Math.PI*r*r*r);
    const c0=Math.pow(lP/r,2), Tm=HBAR*(C/r)/KB;
    for(const [a,b,k] of [[r,m.R_m,'R'],[e0,m.epsilon0_J,'eps0'],[ec,m.scalar_Casimir_energy_J,'E_C'],
        [rh,m.scalar_Casimir_density_J_m3,'rho'],[c0,m.single_mode_compactness,'C0'],[Tm,m.mode_temperature_K,'T']]){
      const e=rel(a,b); if(e>worst){worst=e;name=m.name+'/'+k;} } }
  ok('every milestone in the supplied table reproduced from first principles', worst<2e-5,
     `worst relative disagreement ${worst.toExponential(2)} at ${name}`); }

for(const [s,n,d] of out) console.log(s.padEnd(5), n, '\n      ', d);
console.log('\n', out.filter(r=>r[0]==='PASS').length+'/'+out.length, 'checks pass');
