/* Pure HCC S3 geometry-of-light reference kernel. NO Maxwell spacetime,
 * no cosmic topology detection, no general NSE PDE or optical experiment. */
const bad=s=>{throw new RangeError(s)};
const degree=c=>{if(!Array.isArray(c)||!c.length||c.length>7||c.some(z=>!Array.isArray(z)||z.length!==2||!z.every(Number.isFinite))||!c.some(z=>z[0]||z[1]))bad('invalid binary form degree/coefficient list');return c.length-1};
const choose=(n,k)=>{let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return v};
export function lightIntensity(c,x,d){
 const m=degree(c);if(!Number.isFinite(x)||x<0||x>1||!Number.isFinite(d))bad('invalid Hopf-base coordinates');
 let re=0,im=0;for(let k=0;k<=m;k++){
  const w=(1-x)**((m-k)/2)*x**(k/2),a=k*d,z=c[k];
  re+=w*(z[0]*Math.cos(a)-z[1]*Math.sin(a));
  im+=w*(z[0]*Math.sin(a)+z[1]*Math.cos(a));
 }return re*re+im*im;
}
export function lightCoefficientNorm(c){
 const m=degree(c);return c.reduce((a,z,k)=>a+(z[0]**2+z[1]**2)/choose(m,k),0)/(m+1);
}
export function lightSampleGrid(c){
 const m=degree(c),N=2*m+1;
 const latitudes=Array.from({length:m+1},(_,i)=>(i+1)/(m+2));
 const azimuths=Array.from({length:N},(_,i)=>2*Math.PI*i/N);
 return {degree:m,latitudes,azimuths,values:latitudes.map(x=>azimuths.map(d=>lightIntensity(c,x,d)))};
}
function solve(A,y){
 const n=A.length,M=A.map((r,i)=>[...r,y[i]]);
 for(let k=0;k<n;k++){
  let p=k;for(let i=k+1;i<n;i++)if(Math.abs(M[i][k])>Math.abs(M[p][k]))p=i;
  if(Math.abs(M[p][k])<1e-14)bad('ill-conditioned tomography');
  [M[k],M[p]]=[M[p],M[k]];
  const v=M[k][k];for(let j=k;j<=n;j++)M[k][j]/=v;
  for(let i=0;i<n;i++)if(i!==k){const w=M[i][k];for(let j=k;j<=n;j++)M[i][j]-=w*M[k][j]}
 }return M.map(x=>x[n]);
}
export function lightReconstructGram(grid){
 const m=grid.degree,N=2*m+1;
 if(!Number.isInteger(m)||m<0||m>6||grid.latitudes?.length!==m+1||
 grid.azimuths?.length!==N||grid.values?.length!==m+1||
 grid.values.some(row=>row.length!==N))bad('invalid finite-grid shape');
 const xs=grid.latitudes,angles=grid.azimuths,Q=grid.values;
 if(xs.some(x=>x<=0||x>=1||!Number.isFinite(x))||new Set(xs).size!==xs.length)bad('invalid latitudes');
 for(let j=0;j<N;j++)if(Math.abs(angles[j]-2*Math.PI*j/N)>1e-10)bad('azimuth aliasing');
 const G=Array.from({length:m+1},()=>Array.from({length:m+1},()=>[0,0]));
 for(let d=0;d<=m;d++){
  const n=m-d+1, ix=Array.from({length:n},(_,k)=>n===1?Math.floor(m/2):Math.round(k*m/(n-1)));
  const M=[],yr=[],yi=[];
  for(const h of ix){
   const x=xs[h],fac=(x*(1-x))**(d/2);let re=0,im=0;
   for(let b=0;b<N;b++){const a=d*angles[b],v=Q[h][b]/N;re+=v*Math.cos(a);im-=v*Math.sin(a)}
   M.push(Array.from({length:n},(_,k)=>x**k*(1-x)**(n-1-k)));
   yr.push(re/fac);yi.push(im/fac);
  }
  const cr=solve(M,yr),ci=solve(M,yi);
  for(let k=0;k<n;k++){G[k+d][k]=[cr[k],ci[k]];G[k][k+d]=[cr[k],-ci[k]]}
 }
 let piv=0;for(let k=1;k<=m;k++)if(G[k][k][0]>G[piv][piv][0])piv=k;
 const amp=G[piv][piv][0];if(!(amp>0))bad('rank-one reconstruction has no pivot');
 const c=Array.from({length:m+1},(_,k)=>[G[k][piv][0]/Math.sqrt(amp),G[k][piv][1]/Math.sqrt(amp)]);
 let err=0,den=0;for(let k=0;k<=m;k++)for(let j=0;j<=m;j++){
  const re=c[k][0]*c[j][0]+c[k][1]*c[j][1],im=c[k][1]*c[j][0]-c[k][0]*c[j][1];
  err+=(G[k][j][0]-re)**2+(G[k][j][1]-im)**2;
  den+=G[k][j][0]**2+G[k][j][1]**2;
 }
 return {gram:G,phaseGaugeCoefficients:c,relativeRankOneResidual:Math.sqrt(err/den),
 globalPhaseUnobservable:true,method:'exact trigonometric samples + Bernstein interpolation',
 numericConditioningGuaranteed:false};
}
export function lightFluidBridge({coefficients,x=.4,delta=0,radius=1,viscosity=.1,time=0,operator='Hodge'}){
 const m=degree(coefficients);
 if(!(radius>0)||!Number.isFinite(radius)||!(viscosity>=0)||!Number.isFinite(viscosity)||!(time>=0)||!Number.isFinite(time))bad('invalid physical parameter');
 if(!['Hodge','EbinMarsden'].includes(operator))bad('viscosity convention unknown');
 const lambda=(m+2)/radius;
 const rate=viscosity*(lambda*lambda-(operator==='EbinMarsden'?4/radius**2:0));
 const a=Math.exp(-rate*time),I=lightIntensity(coefficients,x,delta);
 const integrated=2*Math.PI**2*radius**3*lightCoefficientNorm(coefficients);
 return {positiveCurlEigenvalue:lambda,opticalIntensity:I,fluidPressureMinusOffset:-.5*a*a*I,
 fluidAmplitude:a,integratedIntensity:integrated,fluidHelicity:lambda*a*a*integrated,
 viscosityRate:rate,exactGeometry:'round S3, fixed signed-curl hypothesis',
 MaxwellSpacetimeDynamicsComputed:false,fluidNonlinearClosureExternallyAssumed:true,
 experimentalValidation:false,cosmicS3Detected:false};
}
export function lightTopologicalNoGo(m){
 if(!Number.isInteger(m)||m<2||m>6)bad('no-go requires degree 2..6');
 const p=Array.from({length:m+1},()=>[0,0]),q=p.map(()=>[0,0]);
 p[0]=[1,0];q[1]=[Math.sqrt(m),0];
 return {first:p,second:q,identicalIntegratedIntensity:Math.abs(lightCoefficientNorm(p)-lightCoefficientNorm(q))<1e-14,
 firstDivisorMultiplicities:[m],secondDivisorMultiplicities:[m-1,1],
 conclusion:'Exact energy/helicity traces alone cannot determine the projective root divisor'};
}
