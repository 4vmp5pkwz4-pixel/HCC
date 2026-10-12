/** Round S3 finite-band restriction. Formula proof: docs/MATH_ATLAS_2026-10-10.md.
 * Pure binary64 implementation; analytic formulas are exact, evaluations are numeric.
 * No fitted radius, cosmological data, Gram eigenvalue claims or physical selector.
 */
function degree(L){if(!Number.isInteger(L)||L<0||L>48)throw new RangeError('L must be an integer in 0..48');return L;}
function aperture(chi){if(!Number.isFinite(chi)||chi<0||chi>Math.PI)throw new RangeError('chi must be in 0..pi radians');return chi;}
export function scalarBandCount(L){degree(L);return (L+1)*(L+2)*(2*L+3)/6;}
export function capVolumeFraction(chi){
 aperture(chi);if(chi<.01){const x=chi*chi;return (2*chi*x/(3*Math.PI))*(1-x/5+2*x*x/105-x*x*x/945);}
 return (chi-Math.sin(chi)*Math.cos(chi))/Math.PI;
}
function sineIntegralDifference(a,b,chi){
 // Integrate the Taylor difference directly to avoid subtracting two nearly equal sincs.
 if(Math.max(Math.abs(a*chi),Math.abs(b*chi))<.3){
  let sum=0,fact=1,sign=1;
  for(let k=1;k<=12;k++){fact*=(2*k)*(2*k+1);sign=-sign;sum+=sign*((a*chi)**(2*k)-(b*chi)**(2*k))/fact;}
  return chi*sum;
 }
 const term=k=>k===0?chi:Math.sin(k*chi)/k;return term(a)-term(b);
}
export function radialGram(L,chi){
 degree(L);aperture(chi);
 if(chi===Math.PI)return Array.from({length:L+1},(_,n)=>Array.from({length:L+1},(_,m)=>Number(n===m)));
 return Array.from({length:L+1},(_,n)=>Array.from({length:L+1},(_,m)=>sineIntegralDifference(n-m,n+m+2,chi)/Math.PI));
}
function logBetaHalf(a){
 // B(3/2,3/2)=pi/8 and B(a+1,b)=a/(a+b)*B(a,b), no gamma-library dependency.
 let r=Math.log(Math.PI/8);for(let t=1.5;t<a-.1;t++)r+=Math.log(t)-Math.log(t+1.5);return r;
}
function betaFraction(a,b,x){
 const floor=1e-300;let c=1,d=1-(a+b)*x/(a+1);if(Math.abs(d)<floor)d=floor;d=1/d;let h=d;
 for(let m=1;m<=400;m++){
  const m2=2*m;
  const terms=[m*(b-m)*x/((a+m2-1)*(a+m2)),-(a+m)*(a+b+m)*x/((a+m2)*(a+m2+1))];
  for(let j=0;j<2;j++){const aa=terms[j];
   d=1+aa*d;if(Math.abs(d)<floor)d=floor;c=1+aa/c;if(Math.abs(c)<floor)c=floor;d=1/d;const delta=d*c;h*=delta;
   if(j===1&&Math.abs(delta-1)<3e-14)return h;
  }
 }
 throw new RangeError('incomplete-beta evaluation did not converge');
}
function logRegularizedBeta(a,b,x,logB,logX=Math.log(x)){
 if(x===1)return 0;
 const front=a*logX+b*Math.log1p(-x)-logB;
 if(x<(a+1)/(a+b+2))return front+Math.log(betaFraction(a,b,x)/a);
 const tail=Math.exp(front+Math.log(betaFraction(b,a,1-x)/b));return Math.log1p(-Math.min(1,tail));
}
export function capObservability({L=6,chi=.1,includeGram=true}={}){
 degree(L);aperture(chi);if(chi===0)throw new RangeError('a nonempty open cap requires chi > 0');
 const x=Math.sin(chi/2)**2,a=2*L+1.5;
 // Form logarithms before squaring or cubing: both can underflow for valid chi.
 const z=chi*chi;
 const logX=chi<.01?2*(Math.log(chi)-Math.LN2+Math.log1p(-z/24+z*z/1920-z*z*z/322560)):Math.log(x);
 const rawVolume=capVolumeFraction(chi);
 const logVolume=chi<.01?3*Math.log(chi)+Math.log(2/(3*Math.PI))+Math.log1p(-z/5+2*z*z/105-z*z*z/945):Math.log(rawVolume);
 const logR=logRegularizedBeta(a,1.5,x,logBetaHalf(a),logX);
 const log10R=logR/Math.LN10,volume=rawVolume===0?null:rawVolume;
 const witness=logR<Math.log(Number.MIN_VALUE)?null:Math.exp(logR);
 return {schema:'hcc.s3-cap-observability/1',epistemic_status:'derived',L,chi_rad:chi,
  geometry:'unit round S3; chi is geodesic distance divided by R',mode_count:scalarBandCount(L),
  formula_id:'s3.cap-restriction/witness-beta-v1',source_id:'hcc-cap-lemma-2026-10-10',
  radial_subspace_dimension:L+1,volume_fraction:volume,log10_volume_fraction:logVolume/Math.LN10,radial_gram:includeGram?radialGram(L,chi):null,
  witness:'f_L(theta)=(1-cos(theta))^L',witness_concentration:witness,
  log10_witness_concentration:log10R,log10_inverse_gain_lower_bound:-log10R/2,
  log10_condition_number_lower_bound:Math.max(0,(logVolume/Math.LN10-log10R)/2),
  formulas:{volume:'(chi-sin(chi)cos(chi))/pi',gram:'[sin((n-m)chi)/(n-m)-sin((n+m+2)chi)/(n+m+2)]/pi; diagonal uses chi',
   concentration:'I_(sin^2(chi/2))(2L+3/2,3/2)',inverse_gain:'||T^-1|| >= r_L^-1/2',condition:'kappa(T) >= sqrt(volume/r_L)'},
  interpretation:'A witness bound for the full finite scalar band; the radial Gram is only a subspace. No smallest eigenvalue is certified numerically.',
  precision:'binary64; logarithms survive concentration and volume underflow; null concentration or volume means underflow, not exact zero; Gram entries may underflow',
  empirical_validation:false,topology_detected:false,phi_derived:false,
  limitations:['Continuous noiseless restriction, not a finite detector sampling theorem','Exact finite-band injectivity does not imply a stable infinite-band inverse','No Gram eigenvalue or actual condition-number computation','No theorem is Lean-verified by this numerical calculation']};
}
