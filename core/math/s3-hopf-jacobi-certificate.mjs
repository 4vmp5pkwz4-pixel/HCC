/** Round-S3 signed-curl spectral REFERENCE algebra. Not a PDE solver or visualization. */
const pos=(x,n)=>{if(!Number.isFinite(x)||x<=0)throw new RangeError(n+' must be positive finite');return x};
const nonneg=(x,n)=>{if(!Number.isFinite(x)||x<0)throw new RangeError(n+' must be nonnegative finite');return x};
const nat=(x,n)=>{if(!Number.isSafeInteger(x)||x<0)throw new RangeError(n+' must be a nonnegative safe integer');return x};

/* R times signed curl eigenvalues are EXACT integers in this convention.
 * A physical mode construction still requires an independent differential check. */
export function hopfJacobiSpectrum({degree,jacobiIndex,chirality=1,radius=1}){
 const m=nat(degree,'degree'),n=nat(jacobiIndex,'jacobiIndex'),R=pos(radius,'radius');
 if(chirality!==1&&chirality!==-1)throw new RangeError('chirality must be +1/-1');
 const hopfRlambda=m+2,jacobiRlambda=chirality*2*(n+1);
 const differenceInteger=hopfRlambda-jacobiRlambda;
 return Object.freeze({geometry:'exact round S3',degree:m,jacobiIndex:n,chirality,radius:R,
 hopfRlambda,jacobiRlambda,differenceInteger,hopfEigenvalue:hopfRlambda/R,
 jacobiEigenvalue:jacobiRlambda/R,detuning:Math.abs(differenceInteger)/R,
 exactResonance:differenceInteger===0,
 positiveBranchRule:'chirality=+1 and degree=2*jacobiIndex',
 nearestPositiveBranchDetuning:(m%2)/R,negativeBranchMinimumDetuning:(m+4)/R,
 nonlinearPDEChecked:false});
}

/* Mathematical domain: real divergence-free curl eigenfields on oriented
 * closed round S3, mutually orthogonal in L2 (equal-eigenvalue subspaces
 * must be orthogonalised first). No use of a visual surrogate.
 * W=2E; H=sum lambda_i*A_i; Z=sum lambda_i^2*A_i;
 * V=Z-H^2/W= sum_{i<j} A_i*A_j*(lambda_i-lambda_j)^2/W. */
export function spectralDeficit(modes,{radius=1}={}){
 const R=pos(radius,'radius');
 if(!Array.isArray(modes)||!modes.length)throw new RangeError('modes must be nonempty');
 const live=modes.map((a,i)=>{
  if(!Number.isSafeInteger(a.Rlambda))throw new RangeError('Rlambda must be a safe integer at '+i);
  return {Rlambda:a.Rlambda,weight:nonneg(a.weight,'weight '+i)};
 }).filter(a=>a.weight>0);
 const W=live.reduce((s,a)=>s+a.weight,0);
 if(!Number.isFinite(W)||W<=0)throw new RangeError('total L2 weight must be positive finite');
 const mean=live.reduce((s,a)=>s+a.weight*a.Rlambda,0)/W;
 const variance=live.reduce((s,a)=>s+a.weight*(a.Rlambda-mean)**2,0)/(R*R);
 let pairs=0;
 for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++)
  pairs+=live[i].weight*live[j].weight*(live[i].Rlambda-live[j].Rlambda)**2;
 const pairwise=pairs/(W*R*R);
 const H=W*mean/R,Z=live.reduce((s,a)=>s+a.weight*a.Rlambda**2,0)/(R*R);
 const distinct=[...new Set(live.map(a=>a.Rlambda))];
 return Object.freeze({energy:W/2,helicity:H,enstrophy:Z,
 spectralDeficit:variance,pairwiseDeficit:pairwise,
 fubiniStudySpeedSquared:variance/W,pureStateQuantumFisherInformation:4*variance/W,
 meanCurlEigenvalue:mean/R,spectrallyPure:distinct.length===1,
 representedEigenvalues:distinct.map(x=>x/R),
 conservationStatus:'NOT a general viscous conserved charge',
 projectiveMetricScope:'AUXILIARY unitary exp(-is curl) orbit, not Navier-Stokes time',
 nonlinearPDEChecked:false});
}

export function hopfJacobiCertificate({degree,jacobiIndex,chirality=1,radius=1,hopfNorm=1,jacobiNorm=1,overlap=0}){
 const s=hopfJacobiSpectrum({degree,jacobiIndex,chirality,radius});
 const A=nonneg(hopfNorm,'hopfNorm'),B=nonneg(jacobiNorm,'jacobiNorm');
 if(!Number.isFinite(overlap))throw new RangeError('overlap must be finite');
 if(Math.abs(overlap)>Math.sqrt(A*B)+1e-12)throw new RangeError('overlap violates Cauchy-Schwarz');
 if(!s.exactResonance&&overlap!==0)throw new RangeError('unequal curl eigenshells must be orthogonal');
 const W=A+B+2*overlap;
 if(W<=0)throw new RangeError('sum field is zero: no projective state exists');
 const v=s.exactResonance?
  spectralDeficit([{Rlambda:s.hopfRlambda,weight:W}],{radius}):
  spectralDeficit([{Rlambda:s.hopfRlambda,weight:A},{Rlambda:s.jacobiRlambda,weight:B}],{radius});
 return Object.freeze({...s,...v,norms:{hopf:A,jacobi:B,innerProduct:overlap},
 exactCompatibility:s.exactResonance&&A>0&&B>0,
 oddPositiveObstruction:chirality===1&&degree%2===1&&A>0&&B>0?A*B/(A+B)/(radius*radius):null,
 forcedSector376Transfer:'REFUSED: OpenAI Math 376 concerns forced flat-torus/R3 flows',
 nodalSector350Transfer:'REFUSED: OpenAI Math 350 changes the metric, while this is exact-round S3',
 candidateNSConclusion:s.exactResonance?
 'CONDITIONAL: certified equal curl eigenshells yield Beltrami sums; PDE assumptions must be checked independently':
 'UNPROVED: detuning alone does not determine nonlinear pressure, forcing or regularity'});
}

export function viscousEigenmodeRates({Rlambda,radius=1,viscosity=0}){
 if(!Number.isSafeInteger(Rlambda))throw new RangeError('Rlambda must be an integer');
 const R=pos(radius,'radius'),nu=nonneg(viscosity,'viscosity');
 return Object.freeze({hodgeRate:nu*Rlambda**2/(R*R),
 ebinMarsdenRate:nu*(Rlambda**2-4)/(R*R),
 scope:'divergence-free round S3 signed curl eigenmode only',
 transformationScope:'NOT an equivalence of arbitrary nonlinear Navier-Stokes solutions'});
}


/* PHYSICAL-TIME projective metric of a reducing orthogonal heat packet.
 * WARNING: algebraically computed; this function NEVER proves the NSE PDE closure.
 * Projective angle uses standard d_FS=acos |<normalized vectors>|. */
export function viscousProjectiveTwoMode({degree,jacobiIndex,chirality=1,radius=1,
 viscosity=0.1,time=0,hopfNorm=1,jacobiNorm=1,overlap=0}){
 const s=hopfJacobiSpectrum({degree,jacobiIndex,chirality,radius});
 const nu=nonneg(viscosity,'viscosity'),t=nonneg(time,'time');
 const A=nonneg(hopfNorm,'hopfNorm'),B=nonneg(jacobiNorm,'jacobiNorm');
 if(!Number.isFinite(overlap)||Math.abs(overlap)>Math.sqrt(A*B)+1e-12)
   throw new RangeError('overlap violates Gram positivity');
 if(!s.exactResonance&&overlap!==0)
   throw new RangeError('unequal signed curl shells must be L2 orthogonal');
 const W0=A+B+2*overlap;
 if(W0<=0)throw new RangeError('zero physical sum has no projective ray');
 const lambda=s.hopfEigenvalue,mu=s.jacobiEigenvalue;
 const gammaH=nu*lambda*lambda,gammaJ=nu*mu*mu,delta=gammaJ-gammaH;
 if(s.exactResonance){
   const logWH=Math.log(W0)-2*gammaH*t;
   return Object.freeze({logHodgeNormSquared:logWH,
     logEbinMarsdenNormSquared:logWH+8*nu*t/(radius*radius),
     higherModeWeight:null,physicalFSSpeedSquared:0,fisherInformation:0,
     logEnergyCurvature:0,signedCurlVariance:0,rateInvariantLog:null,
     projectiveEvolution:'stationary single signed curl shell',
     nonlinearPDEChecked:false});
 }
 const terms=[A>0?Math.log(A)-2*gammaH*t:-Infinity,
              B>0?Math.log(B)-2*gammaJ*t:-Infinity];
 const max=Math.max(...terms);
 const z=terms.map(x=>x===-Infinity?0:Math.exp(x-max));
 const norm=z[0]+z[1];
 const q=z[1]/norm,product=(z[0]/norm)*q;
 const fs2=delta*delta*product;
 const signedVariance=(lambda-mu)**2*product;
 const logW=max+Math.log(norm);
 return Object.freeze({logHodgeNormSquared:logW,
  logEbinMarsdenNormSquared:logW+8*nu*t/(radius*radius),
  higherModeWeight:q,physicalFSSpeedSquared:fs2,
  fisherInformation:4*fs2,logEnergyCurvature:4*fs2,
  signedCurlVariance:signedVariance,
  helicityDefectToPhysicalSpeedFactor:nu*nu*(lambda+mu)**2,
  rateInvariantLog:A>0&&B>0?Math.log(B/A):null,
  spectralBlindSpot:s.hopfRlambda**2===s.jacobiRlambda**2&&s.hopfRlambda!==s.jacobiRlambda&&A>0&&B>0,
  rateDifference:delta,
  projectiveEvolution:'physical normalized heat orbit, conditional on NSE nonlinear closure',
  nonlinearPDEChecked:false});
}
