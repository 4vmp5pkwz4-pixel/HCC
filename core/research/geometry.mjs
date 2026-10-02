/** Shared browser/server FLRW reference calculations. No observations are fitted here. */
export const C_KM_S=299792.458;
const MPC_KM=3.0856775814913673e19, GYR_S=365.25*86400*1e9;
const finite=(x,name)=>{if(typeof x!=='number'||!Number.isFinite(x))throw new TypeError(`${name} must be finite`);return x;};
const positive=(x,name)=>{finite(x,name);if(x<=0)throw new RangeError(`${name} must be positive`);return x;};
function parameters(p){
  if(!p||typeof p!=='object')throw new TypeError('explicit cosmological parameters required');
  for(const k of ['H0','OmegaM','OmegaR','OmegaK','w0','wa'])finite(p[k],k);
  positive(p.H0,'H0');
  if(p.OmegaM<0||p.OmegaR<0||Math.abs(p.OmegaK)>1||Math.abs(p.w0)>3||Math.abs(p.wa)>5)throw new RangeError('outside reference domain: Ωm,Ωr≥0, |ΩK|≤1, |w0|≤3, |wa|≤5');
  const OmegaDE=1-p.OmegaM-p.OmegaR-p.OmegaK;
  if(OmegaDE<0)throw new RangeError('ΩDE=1−Ωm−Ωr−ΩK must be nonnegative');
  return {...p,OmegaDE};
}
function expansion(p,z){
  const a=1+z;
  const q=p.OmegaM*a**3+p.OmegaR*a**4+p.OmegaK*a**2+p.OmegaDE*a**(3*(1+p.w0+p.wa))*Math.exp(-3*p.wa*z/a);
  if(!Number.isFinite(q)||q<=0)throw new RangeError('E² must remain finite and positive');
  return Math.sqrt(q);
}
/** Adaptive Simpson, bounded recursion; no unresolved integral is silently accepted. */
function integrate(f,b){
  if(b===0)return 0;
  const fa=f(0),fb=f(b),fm=f(b/2),s=b*(fa+4*fm+fb)/6;
  const walk=(a,b,fa,fm,fb,s,tol,depth)=>{
    const mid=(a+b)/2,l=f((a+mid)/2),r=f((mid+b)/2);
    const sl=(mid-a)*(fa+4*l+fm)/6,sr=(b-mid)*(fm+4*r+fb)/6,d=sl+sr-s;
    if(Math.abs(d)<=15*tol)return sl+sr+d/15;
    if(depth===0)throw new RangeError('quadrature did not converge');
    return walk(a,mid,fa,l,fm,sl,tol/2,depth-1)+walk(mid,b,fm,r,fb,sr,tol/2,depth-1);
  };
  return walk(0,b,fa,fm,fb,s,1e-11,20);
}
function transverse(I,k){
  const q=k*I*I;
  if(Math.abs(q)<1e-6)return {D:I*(1+q/6+q*q/120+q*q*q/5040),dD_dI:1+q/2+q*q/24+q*q*q/720};
  if(k>0){const u=Math.sqrt(k)*I;return {D:Math.sinh(u)/Math.sqrt(k),dD_dI:Math.cosh(u)};}
  const u=Math.sqrt(-k)*I;
  if(u>=Math.PI)throw new RangeError('reference light cone reaches a closed-space antipode; multiple-image treatment required');
  return {D:Math.sin(u)/Math.sqrt(-k),dD_dI:Math.cos(u)};
}
export function flrw(input){
  const p=parameters(input),z=finite(p.z,'z');
  if(z<0||z>2000)throw new RangeError('z must be in [0,2000]');
  const b=Math.log1p(z),I=integrate(u=>Math.exp(u)/expansion(p,Math.expm1(u)),b);
  const E=expansion(p,z),T=transverse(I,p.OmegaK),hubble=C_KM_S/p.H0;
  const DM=hubble*T.D,DH=hubble/E;
  const out={status:'REFERENCE_MODEL',z,E,I,D:T.D,Dprime:T.dD_dI/E,DM_Mpc:DM,DH_Mpc:DH,DA_Mpc:DM/(1+z),DL_Mpc:DM*(1+z),AP:DM/DH,
    lookback_Gyr:integrate(u=>1/expansion(p,Math.expm1(u)),b)*MPC_KM/p.H0/GYR_S,
    radius_Mpc:p.OmegaK<0?hubble/Math.sqrt(-p.OmegaK):null,
    geometry:p.OmegaK<0?'closed':p.OmegaK>0?'open':'flat',OmegaDE:p.OmegaDE,
    assumptions:['FLRW with constant spatial curvature and CPL dark energy','H0 [km/s/Mpc], distances [Mpc]; radiation explicit','closed curvature does not establish simply connected global S³'],precision:'float64; adaptive Simpson absolute target 1e-11'};
  for(const [key,value] of Object.entries(out))if(typeof value==='number'&&!Number.isFinite(value))throw new RangeError(`${key} outside float64 range`);
  return out;
}
export const DESI_LYA=Object.freeze({source:'https://arxiv.org/html/2607.27410v3',version:'v3',equation:26,z:2.33,DM_rd:39.32,DH_rd:8.600,sigma_DM:.33,sigma_DH:.066,rho:.225,
  covariance:[[.33**2,.225*.33*.066],[.225*.33*.066,.066**2]],AP:4.572,sigma_AP:.046,broadband_AP:4.578,sigma_broadband_AP:.052,
  nuisance:['quasar redshift errors','HCD absorbers','metals','UV background','small-scale marginalization','BAO systematic uncertainty included in published errors'],growth_used:false});
export function geometryAudit(input){
  const rd=positive(input.rd,'rd [Mpc]');
  // Anchor has one measured redshift. Never compare an arbitrary z to this datum.
  const model=flrw({...input,z:DESI_LYA.z}),a=model.DM_Mpc/rd,b=model.DH_Mpc/rd;
  const x=(a-DESI_LYA.DM_rd)/DESI_LYA.sigma_DM,y=(b-DESI_LYA.DH_rd)/DESI_LYA.sigma_DH,r=DESI_LYA.rho;
  return {schema:'hcc.geometry-evidence/1',status:'REFERENCE_MODEL',inputs:{...input,z:DESI_LYA.z},model:{...model,DM_rd:a,DH_rd:b},observation:structuredClone(DESI_LYA),
    pair_chi2:(x*x-2*r*x*y+y*y)/(1-r*r),AP_chi2:((model.AP-DESI_LYA.AP)/DESI_LYA.sigma_AP)**2,
    broadband_AP_chi2:((model.AP-DESI_LYA.broadband_AP)/DESI_LYA.sigma_broadband_AP)**2,
    joint_likelihood:'not_combined',empirical_validation:false,
    warnings:['Pair and AP are overlapping alternatives: never sum these χ² values','Gaussian compressed-distance comparison, not the full DESI likelihood or a fitted posterior','Published systematic errors already included; fσ8 excluded by DESI validation']};
}
export function curvatureDiagnostic({D,Dprime,E}){
  positive(D,'dimensionless D=H0 DM/c');finite(Dprime,'Dprime=dD/dz');positive(E,'E=H/H0');
  const v=((E*Dprime)**2-1)/(D*D);if(!Number.isFinite(v))throw new RangeError('curvature diagnostic outside float64 range');return v;
}
function cholesky(A,n){
  if(!Array.isArray(A)||A.length!==n||A.some(row=>!Array.isArray(row)||row.length!==n))throw new RangeError('full covariance dimensions must match points');
  const L=Array.from({length:n},()=>Array(n).fill(0));
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){finite(A[i][j],'covariance');if(Math.abs(A[i][j]-A[j][i])>1e-12*Math.max(Math.abs(A[i][j]),Math.abs(A[j][i]),1e-300))throw new RangeError('covariance must be symmetric');}
  for(let i=0;i<n;i++)for(let j=0;j<=i;j++){
    let s=A[i][j];for(let k=0;k<j;k++)s-=L[i][k]*L[j][k];
    if(i===j){if(s<=0)throw new RangeError('covariance must be positive definite');L[i][j]=Math.sqrt(s);}else L[i][j]=s/L[j][j];
  }
  return L;
}
function solve(L,b){
  const n=L.length,y=Array(n),x=Array(n);
  for(let i=0;i<n;i++){let s=b[i];for(let j=0;j<i;j++)s-=L[i][j]*y[j];y[i]=s/L[i][i];}
  for(let i=n-1;i>=0;i--){let s=y[i];for(let j=i+1;j<n;j++)s-=L[j][i]*x[j];x[i]=s/L[i][i];}return x;
}
export function constantCurvatureFit({source,normalization,points,covariance}){
  if(typeof source!=='string'||!source.trim()||source.length>2000)throw new TypeError('explicit reconstruction source required');
  if(normalization!=='D=H0*DM/c')throw new TypeError('normalization must be D=H0*DM/c');
  if(!Array.isArray(points)||points.length<2||points.length>256)throw new RangeError('2..256 reconstructed points required');
  const seen=new Set(),values=points.map(p=>{positive(p.z,'z');if(seen.has(p.z))throw new RangeError('duplicate redshift');seen.add(p.z);return {z:p.z,OmegaK:curvatureDiagnostic(p)};});
  const v=values.map(p=>p.OmegaK),mean=v.reduce((s,x)=>s+x,0)/v.length;
  const out={schema:'hcc.curvature-null-test/1',status:'CONDITIONAL',source,normalization,values,spread:Math.max(...v)-Math.min(...v),constant:mean,standard_error:null,chi2:null,dof:null,confidence_assigned:false,
    covariance_kind:'missing',empirical_validation:false,warnings:['Caller supplied reconstructions are not authenticated','Derivative reconstruction, calibration and smoothing assumptions belong to the source','A trend may reflect systematics or reconstruction error; it is not automatically non-FLRW evidence']};
  if(covariance!==undefined&&covariance!==null){
    const L=cholesky(covariance,v.length),ones=Array(v.length).fill(1),w=solve(L,ones),sum=w.reduce((s,x)=>s+x,0);
    out.constant=w.reduce((s,x,i)=>s+x*v[i],0)/sum;out.standard_error=Math.sqrt(1/sum);
    const d=v.map(x=>x-out.constant),u=solve(L,d);out.chi2=d.reduce((s,x,i)=>s+x*u[i],0);out.dof=v.length-1;out.covariance_kind='full cross-redshift covariance of reconstructed ΩK';
  }else out.warnings.push('No covariance: no confidence interval, χ² or significance assigned');
  for(const key of ['constant','standard_error','chi2','spread'])if(out[key]!==null&&!Number.isFinite(out[key]))throw new RangeError('covariance fit exceeds float64 range');
  if(out.standard_error!==null&&out.standard_error<=0)throw new RangeError('covariance fit is unresolved in float64');
  return out;
}
export function scalarMode({n,radius_Mpc,chi}){
  if(!Number.isInteger(n)||n<0||n>512)throw new RangeError('scalar mode n must be an integer in [0,512]');
  positive(radius_Mpc,'radius_Mpc');finite(chi,'chi');if(chi<0||chi>Math.PI)throw new RangeError('chi in [0,π]');
  const m=n+1,edge=Math.min(chi,Math.PI-chi);let zonal;
  if(edge<1e-6){const sign=chi>Math.PI/2?(-1)**n:1;zonal=sign*(1-(m*m-1)*edge*edge/6);}
  else zonal=Math.sin(m*chi)/(m*Math.sin(chi));
  return {status:'EXACT',n,eigenvalue_Mpc2:n*(n+2)/radius_Mpc**2,degeneracy:(n+1)**2,zonal,radius_Mpc,chi,
    convention:'−Δ Y_n=n(n+2)Y_n/R²; normalized scalar zonal harmonic, not a vector/tensor mode or S² CMB multipole'};
}
export function lensingKernel(input){
  const p=parameters(input),z=finite(input.z,'z'),zs=positive(input.zSource,'zSource');
  if(z<0||z>zs)throw new RangeError('0≤z≤zSource required');
  const a=flrw({...p,z}),b=flrw({...p,z:zs}),delta=transverse(b.I-a.I,p.OmegaK).D*C_KM_S/p.H0;
  const W=1.5*p.OmegaM*(p.H0/C_KM_S)**2*(1+z)*a.DM_Mpc*delta/b.DM_Mpc;
  return {status:'REFERENCE_MODEL',W_per_Mpc:W,z,zSource:zs,
    assumptions:['Single source plane; FLRW geometric kernel Wκ(χ), not a measured C_L or likelihood','Limber/Born reference context; power spectrum, growth, galaxy bias and curved-space transfer functions not computed']};
}
export function delensingResidual(rho){finite(rho,'rho');if(rho<0||rho>1)throw new RangeError('rho in [0,1]');return {status:'REFERENCE_MODEL',rho,residual_fraction:1-rho*rho,assumption:'ideal noiseless optimal per-mode tracer; not ACT band-averaged B-mode efficiency'};}
