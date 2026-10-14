/**
 * HCC v16 research gate. Imported mathematical assertions are NOT cosmic detections.
 * The full offline observatory, independent Python model, PDF and source tests
 * are supplied in the companion V16 research artifact, not wired into production.
 */
export const CLAIM_STATUS = Object.freeze({
  geometry: "CONDITIONAL_CLOSED_FLRW",
  scalar_dynamics: "DERIVED_TEST_FIELD_NOT_CMB",
  angular_character_kernel: "EXACT_ISOTROPIC_S3",
  source_reconstruction: "NONIDENTIFIABLE_FROM_FINITE_CL_WITH_FREE_SPECTRUM",
  bao: "PUBLISHED_DESI_DR2_NUMBERS_APPROXIMATE_DIAGNOSTIC_ONLY",
  cosmic_topology: "NOT_OBSERVED",
  millennium_proof: "NOT_CLAIMED",
});
const C=299792.458, MPC_PER_GLY=1000/3.261563777;
export function closedBackground({radiusGly=548.3245,H0=67.4,omegaMatter=.315,omegaRadiation=.00009,rd=147.09}={}){
  if (![radiusGly,H0,omegaMatter,rd].every(x=>Number.isFinite(x)&&x>0) ||
      !Number.isFinite(omegaRadiation)||omegaRadiation<0)throw new RangeError("invalid physical inputs");
  const R=radiusGly*MPC_PER_GLY;
  const omegaK=-((C/(H0*R))**2);
  const omegaLambda=1-omegaMatter-omegaRadiation-omegaK;
  if(!(omegaLambda>0))throw new RangeError("omegaLambda must be positive");
  return {R,H0,omegaMatter,omegaRadiation,omegaK,omegaLambda,rd};
}
export function distance(z,b){
 if(!(Number.isFinite(z)&&z>=0))throw new RangeError("redshift");
 const E=x=>Math.sqrt(b.omegaRadiation*(1+x)**4+b.omegaMatter*(1+x)**3+b.omegaK*(1+x)**2+b.omegaLambda);
 const N=240,upper=Math.log1p(z),h=upper/N;
 let integral=0;
 for(let i=0;i<=N;i++){
  const t=i*h;
  integral+=(i===0||i===N?1:i%2?4:2)*Math.exp(t)/E(Math.expm1(t));
 }
 const dc=C/b.H0*integral*h/3,chi=dc/b.R,DM=b.R*Math.sin(chi),DH=C/b.H0/E(z);
 return {chi,DC:dc,DM_over_rd:DM/b.rd,DH_over_rd:DH/b.rd,DV_over_rd:Math.cbrt(z*DM*DM*DH)/b.rd};
}
export function scalarShell(n,R){
 if(!Number.isInteger(n)||n<0||!(R>0))throw new RangeError("n,R");
 return {n,eigenvalue:n*(n+2)/R**2,multiplicity:(n+1)**2};
}
export function causalCapFraction(chi){
 if(!Number.isFinite(chi))throw new RangeError("chi");
 return chi<=0?0:chi>=Math.PI?1:(chi-Math.sin(chi)*Math.cos(chi))/Math.PI;
}
export function su2Character(n,cosGamma){
 if(!Number.isInteger(n)||n<0||n>1024||!Number.isFinite(cosGamma)||Math.abs(cosGamma)>1+1e-10)throw new RangeError("n,x");
 const x=Math.max(-1,Math.min(1,cosGamma));
 if(n===0)return 1;
 let u0=1,u1=2*x;
 for(let k=2;k<=n;k++){const v=2*x*u1-u0;u0=u1;u1=v}
 return u1/(n+1);
}
export function masslessEnergyBalanceResidual({energy,initialEnergy,sourceWork,hubbleDissipation}){
 for(const x of [energy,initialEnergy,sourceWork,hubbleDissipation])
  if(!Number.isFinite(x))throw new RangeError("energy balance");
 return energy+hubbleDissipation-sourceWork-initialEnergy;
}
