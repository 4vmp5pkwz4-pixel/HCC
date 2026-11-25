/* HCC Scale Nexus reference kernel; SI; no dependencies. */
(function(root){'use strict';
const c=299792458,h=6.62607015e-34,G=6.67430e-11,hbar=h/(2*Math.PI),phi=(1+Math.sqrt(5))/2,lp=Math.sqrt(hbar*G/c**3),mp=Math.sqrt(hbar*c/G),Gly=9.4607304725808e24,Mpc=3.0856775814913673e22;
const K=Object.freeze({c,h,G,hbar,phi,lp,mp,Gly,Mpc});
function pos(x,n){if(!Number.isFinite(x)||x<=0)throw new RangeError(n+' must be finite and positive');return x;}
function finite(x,n){if(!Number.isFinite(x))throw new RangeError(n+' must be finite');return x;}
function level(R,base=phi,anchor=lp){pos(R,'R');pos(anchor,'anchor');if(!(base>1&&Number.isFinite(base)))throw new RangeError('base > 1');return (Math.log(R)-Math.log(anchor))/Math.log(base);}
function radius(N,base=phi,anchor=lp){finite(N,'N');pos(anchor,'anchor');if(!(base>1&&Number.isFinite(base)))throw new RangeError('base > 1');return pos(Math.exp(Math.log(anchor)+N*Math.log(base)),'R');}
function coordinates(M,R){pos(M,'M');pos(R,'R');const u=Math.log10(M)-Math.log10(mp),v=Math.log10(R)-Math.log10(lp),a=Math.log10(2)+u-v,b=-u-v;return {M,R,u,v,a,b,N:level(R),C:10**a,Q:10**b,logDensity:Math.log10(3/(4*Math.PI))+Math.log10(M)-3*Math.log10(R)};}
function inverse(a,b){finite(a,'a');finite(b,'b');const u=(a-b-Math.log10(2))/2,v=(Math.log10(2)-a-b)/2;return coordinates(pos(10**(Math.log10(mp)+u),'M'),pos(10**(Math.log10(lp)+v),'R'));}
function s3(A,chi,rho){pos(A,'curvature radius');finite(chi,'chi');if(chi<0||chi>Math.PI)throw new RangeError('0 <= chi <= pi');if(rho!==undefined&&(!Number.isFinite(rho)||rho<0))throw new RangeError('rho >= 0');const s=chi===Math.PI?0:Math.sin(chi),D=A*chi,R=A*s;
// stable small-cap series: chi-sin(2chi)/2 = 2chi^3/3 - 2chi^5/15 + 4chi^7/315
const f=chi<0.01?chi**3*(2/3+chi**2*(-2/15+chi**2*4/315)):chi-Math.sin(2*chi)/2;
const V=2*Math.PI*A**3*f,Vtotal=2*Math.PI**2*A**3,Ve=4*Math.PI*R**3/3;
return {A,chi,D,R,V,Vtotal,fraction:f/Math.PI,area:4*Math.PI*R**2,hemisphere:chi>Math.PI/2?'far':'near',properMass:rho===undefined?null:rho*V,misnerSharpMass:rho===undefined?null:rho*Ve,arealVolume:Ve};}
function flrw(H,omegaK){pos(H,'H');finite(omegaK,'omegaK');if(omegaK>=1)throw new RangeError('omegaK < 1 for positive total density');const RH=c/H,RA=RH/Math.sqrt(1-omegaK),rho=3*H**2*(1-omegaK)/(8*Math.PI*G),M=4*Math.PI*rho*RA**3/3;return {H,omegaK,RH,RA,rho,M,C:2*G*M/(RA*c*c),curvatureRadius:omegaK===0?null:RH/Math.sqrt(Math.abs(omegaK)),hubbleCompactness:1-omegaK};}
function photon(lambda){pos(lambda,'lambda');return {M:h/(lambda*c),R:lambda/(2*Math.PI),massKind:'energy_equivalent',radiusKind:'reduced_wavelength',frame:'observer specified'};}
function horizonBits(R){pos(R,'R');return Math.PI*(R/lp)**2/Math.LN2;}
function phaseStatistic(radii,base=phi,anchor=lp){if(!Array.isArray(radii)||!radii.length)throw new RangeError('nonempty sample');let x=0,y=0;for(const R of radii){const t=2*Math.PI*(level(R,base,anchor)%1);x+=Math.cos(t);y+=Math.sin(t);}return {n:radii.length,resultant:Math.hypot(x,y)/radii.length,rayleighZ:(x*x+y*y)/radii.length};}
const api={K,level,radius,coordinates,inverse,s3,flrw,photon,horizonBits,phaseStatistic};if(typeof module!=='undefined')module.exports=api;else root.HCCScale=api;
})(globalThis);
