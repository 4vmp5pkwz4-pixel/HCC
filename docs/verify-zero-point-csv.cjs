/* Never ship a table you have not recomputed.  All 313 rows, every column, from
   first principles, against the supplied CSV. */
const fs=require('fs');
const P=require('path').join(__dirname,'zero-point-fractal-ladder-levels-0-312.csv');
const HBAR=1.054571817e-34, C=2.99792458e8, G=6.67430e-11, KB=1.380649e-23;
const lP=1.616255e-35, PHI=(1+Math.sqrt(5))/2;
const rel=(a,b)=>Math.abs(a-b)/Math.max(1e-300,Math.abs(b));
const L=fs.readFileSync(P,'utf8').trim().split('\n');
const H=L[0].split(','), idx=Object.fromEntries(H.map((h,i)=>[h,i]));
const worst={}; let rows=0, bad=0;
for(let i=1;i<L.length;i++){
  const f=L[i].split(',').map(Number), N=f[idx.N], be=f[idx.beta]||1, M=f[idx.bare_cutoff_M];
  const th=f[idx.theta];
  const R=lP*Math.pow(PHI,N);
  const w=be*C/R, e0=0.5*HBAR*w, shell=e0*be*be;
  const exp={
    R_m:R, R_over_lP:Math.pow(PHI,N), R_over_c_s:R/C, t_coh_s:Math.PI*R/C,   /* antipodal crossing on S^3: the farthest point is pi radii away, not 2pi */
    degeneracy:be*be, omega_rad_s:w, nu_Hz:w/(2*Math.PI),
    epsilon0_J:e0, shell_zero_point_J:shell,
    bare_cutoff_energy_J:HBAR*C/(8*R)*M*M*(M+1)*(M+1),
    scalar_Casimir_energy_J:HBAR*C/(240*R),
    scalar_Casimir_density_J_m3:HBAR*C/(480*Math.PI*Math.PI*Math.pow(R,4)),
    scalar_Casimir_pressure_Pa:HBAR*C/(1440*Math.PI*Math.PI*Math.pow(R,4)),
    mode_temperature_K:HBAR*w/KB,
    equal_thermal_zero_temperature_K:HBAR*w/(KB*Math.log(3)),
    mean_Planck_energy_at_theta_J:e0*(1+2/(Math.exp(be/th)-1)),
    single_mode_compactness:Math.pow(lP/R,2),
    scalar_Casimir_compactness:Math.pow(lP/R,2)/120,
    epsilon0_R_over_c_Js:be*HBAR/2,
    scalar_Casimir_R_over_c_Js:HBAR/240,
    rho_R4_Jm:HBAR*C/(480*Math.PI*Math.PI),
  };
  rows++;
  for(const k in exp){ if(idx[k]==null) continue;
    const e=rel(f[idx[k]],exp[k]);
    if(!(worst[k]>=e)) worst[k]=e;
    if(e>1e-9) bad++; }
}
console.log('rows checked:',rows,'· N from',L[1].split(',')[0],'to',L[L.length-1].split(',')[0]);
const bad2=Object.entries(worst).filter(([k,v])=>v>1e-9);
for(const [k,v] of Object.entries(worst).sort((a,b)=>b[1]-a[1]))
  console.log('  ',(v>1e-9?'MISMATCH':'ok      '),k.padEnd(34),v.toExponential(2));
console.log(bad2.length?`\n${bad2.length} column(s) disagree`:'\nevery column of every row reproduced from first principles');
