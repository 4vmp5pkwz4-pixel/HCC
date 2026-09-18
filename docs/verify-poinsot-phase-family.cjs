(async()=>{ const X=await import('../core/atlas/extracted.mjs');
const out=[]; const ok=(n,c,d='')=>out.push([c?'PASS':'FAIL',n,d]);
const I1=1,I2=2,I3=3,E=1;
const fam=X.poinPhaseFamily(I1,I2,I3,E);
ok('phase family spans both sides of the intermediate-axis separatrix',fam.some(x=>x.ratio<1)&&fam.some(x=>x.ratio>1));
ok('phase family includes near-separatrix trajectories',fam.filter(x=>x.near_separatrix).length>=2);
let worstE=0,worstL=0,worstClosure=0;
for(const q of fam){
 for(const w of q.points){
  worstE=Math.max(worstE,Math.abs(I1*w[0]**2+I2*w[1]**2+I3*w[2]**2-2*E));
  worstL=Math.max(worstL,Math.abs(I1**2*w[0]**2+I2**2*w[1]**2+I3**2*w[2]**2-q.L2));
 }
 const a=q.points[0],b=q.points.at(-1); worstClosure=Math.max(worstClosure,Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]));
}
ok('every rendered-family sample remains on the exact energy quadric',worstE<1e-10,`worst ${worstE}`);
ok('every rendered-family sample remains on the exact momentum quadric',worstL<1e-10,`worst ${worstL}`);
ok('one computed period closes every phase-family curve',worstClosure<1e-8,`worst ${worstClosure}`);
for(const [s,n,d] of out) console.log(s,n,d);
if(out.some(x=>x[0]==='FAIL')) process.exit(1);

})().catch(e=>{console.error(e);process.exit(1);});
