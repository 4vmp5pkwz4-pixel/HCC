/**
 * Kerr–Newman parity-odd SHELL observatory; exact model formulas in m=1 units.
 * A parameter manifold is NOT a Hamiltonian phase space.
 * Source: Preece–Batenin ParityOdd v20–v23, Kerr–Newman principal Weyl tetrad.
 * Conventions: z=r+iΣ, Ψ2=(-m+e²/conj(z))/z³, P=-48 Im(Ψ2²).
 * Values here are dimensionless m·Q_shell, m² Ψ2, m⁴ I, m⁶ J.
 * No empirical topology inference, no claim about stability, no GR–TEGR identification.
 */
export const CONTRACT = Object.freeze({
  id:'hcc.parity-odd.kn-shell/1',
  status:'derived-model',
  geometry:'stationary Kerr–Newman electrovac, principal tetrad',
  model:'asymptotically flat, subextremal, m>0; orientation fixed',
  parameter_space:['a/m','e/m','r/m','cos(theta)'],
  dynamic_phase_space:false,
  primary:'m times the radial-integrated Weyl Pontryagin shell at fixed Σ',
  provenance:'Preece–Batenin, ParityOdd v20–v23; standard Kerr–Newman Psi2',
  nonclaims:['no black-hole instability inference','not a topology measurement','not full Einstein–Maxwell PDE closure','no equivalence to S3 cosmology']
});
const finite = x => typeof x==='number' && Number.isFinite(x);
const complex=(re,im)=>({re,im});
const mul=(a,b)=>complex(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);
const div=(a,b)=>{const den=b.re*b.re+b.im*b.im;return complex((a.re*b.re+a.im*b.im)/den,(a.im*b.re-a.re*b.im)/den);};
const pow=(z,n)=>{let a=complex(1,0);for(let i=0;i<n;i++)a=mul(a,z);return a;};
const scale=(z,k)=>complex(z.re*k,z.im*k);
function fail(code,message){return Object.freeze({ok:false,code,message});}
export function horizon(alpha,charge){
  if(!finite(alpha)||!finite(charge)||Math.abs(alpha)>1||charge<0||charge>1||alpha*alpha+charge*charge>1+1e-12)
    return fail('OUT_OF_DOMAIN','Subextremality requires |a/m|≤1, 0≤e/m≤1 and (a/m)²+(e/m)²≤1.');
  return Object.freeze({ok:true,outer:1+Math.sqrt(Math.max(0,1-alpha*alpha-charge*charge))});
}
export function state({spin,charge,radius,mu}){
  const h=horizon(spin,charge);if(!h.ok)return h;
  if(!finite(radius)||radius<h.outer-1e-12)return fail('INSIDE_HORIZON','Outer-shell evaluation requires r/m≥r+/m.');
  if(!finite(mu)||Math.abs(mu)>1)return fail('OUT_OF_DOMAIN','cos(theta) must lie in [-1,1].');
  const sigma=spin*mu, c2=charge*charge, r=radius, s=sigma, rr=r*r, ss=s*s, D=rr+ss;
  const z=complex(r,s);
  // Standard K–N Weyl scalar in declared NP orientation (m=1)
  const psi=div(complex(-1+c2*r/D,c2*s/D),pow(z,3));
  const psi2=mul(psi,psi), I=scale(psi2,3), J=scale(mul(psi2,psi),-1);
  const p=-48*psi2.im;
  const polynomial=9*rr*rr-14*rr*ss+ss*ss+12*c2*r*(ss-rr)+2*c2*c2*(2*rr-ss);
  const shell=8*s*polynomial/(D**4);
  const eta=c2/r, x=ss/rr;
  const nodal=x*x-(14-12*eta+2*eta*eta)*x+(3-2*eta)**2;
  return Object.freeze({ok:true,inputs:Object.freeze({spin,charge,radius,mu}),domain:{horizon:h.outer,exterior:true},
    native:Object.freeze({sigma,eta,x,metricDenominator:D}),
    invariants:Object.freeze({psi,I,J,pontryagin:p,shell,nodal,pontryaginWeighted:D*p}),
    provenance:CONTRACT.id,epistemic:'model-derived/exact-formula'});
}
export function horizonPolarSign(spin,charge){
  const h=horizon(spin,charge);return h.ok?state({spin,charge,radius:h.outer,mu:1}):h;
}
export function nodalRoots(eta){
  if(!finite(eta)||eta<0)return fail('OUT_OF_DOMAIN','eta=e²/(mr) must be nonnegative.');
  const b=14-12*eta+2*eta*eta, c=3-2*eta;
  const discriminant=b*b-4*c*c;
  if(discriminant<0)return Object.freeze({ok:true,roots:[],discriminant});
  return Object.freeze({ok:true,roots:[(b-Math.sqrt(discriminant))/2,(b+Math.sqrt(discriminant))/2],discriminant});
}
export function compareStates(a,b){
  if(!a?.ok||!b?.ok)return fail('INVALID_STATE','Comparison requires two valid model states.');
  return Object.freeze({ok:true,kind:'parameter-comparison',notEvolution:true,
    deltaShell:b.invariants.shell-a.invariants.shell,
    deltaPontryagin:b.invariants.pontryagin-a.invariants.pontryagin,
    note:'Parameter differences are not fluxes or time derivatives.'});
}
export const BRIDGES=Object.freeze([
  Object.freeze({to:'Kerr-Newman Weyl algebra',status:'EXACT_WITHIN_MODEL',relation:'I=3 Ψ₂² and J=-Ψ₂³ in type D principal tetrad'}),
  Object.freeze({to:'HCC IPSE Phase-Space Engine PR #437',status:'CONDITIONAL_INTERFACE',relation:'typed scientific adapter needed; this is a parameter manifold, not Hamiltonian phase-space flow'}),
  Object.freeze({to:'Preece–Batenin contact/gauge complex',status:'STRUCTURAL_ANALOGY',relation:'no physical equivalence or gauge map established from the shell scalar'}),
  Object.freeze({to:'HCC cosmological round S³ hypothesis',status:'REFUSED',relation:'local Kerr–Newman curvature does not establish global spatial topology'})
]);
