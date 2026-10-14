/** Experimental Hopf-frame research kernel on conditional round S³.
 * Pure algebraic and reduced ODE formulas, not a verified GR solver.
 * Equations/audit: docs/HOPF_FRAME_RELATIVE_2026-10-10.md
 */
const finite=(x,n,zero=false)=>{if(!Number.isFinite(x)||(zero?x<0:x<=0))throw new RangeError(n);return x;};
const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function hopfFrameSnapshot({a=1,alpha=1,beta=1,kappa=0,vectors=[[1,0,0],[0,1,0],[0,0,1]],velocities=null}={}){
 finite(a,'a');finite(alpha,'alpha');finite(beta,'beta');finite(kappa,'kappa',true);
 if(!Array.isArray(vectors)||vectors.length!==3||vectors.some(v=>!Array.isArray(v)||v.length!==3||v.some(x=>!Number.isFinite(x))||Math.abs(dot(v,v)-1)>1e-8))throw new RangeError('vectors must be three finite unit vectors');
 if(velocities!==null && (!Array.isArray(velocities)||velocities.length!==3||velocities.some((v,i)=>!Array.isArray(v)||v.length!==3||v.some(x=>!Number.isFinite(x))||Math.abs(dot(v,vectors[i]))>1e-8)))throw new RangeError('velocities must be finite tangent vectors');
 const A=alpha+beta/(4*Math.PI**2*a*a),C=4*alpha/a**2+beta/(Math.PI**2*a**4);
 const gram=Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>vectors.reduce((s,v)=>s+v[i]*v[j],0)));
 const defect=gram.map((v,i)=>v.map((x,j)=>x-Number(i===j)));
 const defect2=defect.flat().reduce((s,x)=>s+x*x,0);
 const J=velocities ? vectors.reduce((sum,v,i)=>{const c=cross(v,velocities[i]);return sum.map((x,j)=>x+a**3*A*c[j]);},[0,0,0]):null;
 return {classification:'conditional_fixed_round_S3',A,C,gram,gram_defect_frobenius2:defect2,alignment_potential_density:kappa*defect2/4,anisotropic_stress: defect.map(row=>row.map(x=>-C*x)),relative_frequency_squared:2*kappa/A,noether_charge_per_unit_comoving_volume:J,physical_momentum_density:J?.map(x=>2*x/a**4)??null,observed_cosmology:false,full_einstein_perturbations_verified:false};
}
export function hopfRelativePendulum({a,alpha,beta,kappa,x,xdot,H=0}={}){
 finite(a,'a');finite(alpha,'alpha');finite(beta,'beta');finite(kappa,'kappa',true);
 if(![x,xdot,H].every(Number.isFinite))throw new RangeError('x/xdot/H');
 const A=alpha+beta/(4*Math.PI**2*a*a),Adot=-2*H*(A-alpha);
 return {acceleration:-(3*H+Adot/A)*xdot-kappa*Math.sin(4*x)/(2*A),reduced_energy:A*xdot**2+kappa*Math.sin(2*x)**2/2,reduced_energy_time_derivative:-H*(4*A+2*alpha)*xdot**2,gravitational_shear_solved:false};
}
