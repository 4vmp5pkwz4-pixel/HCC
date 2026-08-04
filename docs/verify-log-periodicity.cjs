/* THE ONE OPEN ITEM THAT CAN BE BUILT RATHER THAN SOLVED.
   Report §6.5 asks for "a predefined observable test of log-periodicity or a
   scale-dependent q".  A φ-ladder is not merely a power law: if scales really come in
   golden steps, then any scale-indexed observable carries a modulation that repeats
   every factor of φ, i.e. is periodic in ln r with period ln φ.  That is falsifiable
   before any data arrive, which is exactly what a predefined test means.

   Method, and every piece of it is standard:
     1. fit and remove the power law   ln y = ln A − q ln r        (least squares)
     2. Lomb–Scargle the residual against ln r at angular frequency ω = 2π/ln φ
        (Lomb–Scargle because ln r samples are uneven in general)
     3. amplitude ε̂ and phase ψ̂ from the same fit
     4. significance from a PERMUTATION null: shuffle the residuals against their
        ln r, recompute the peak, and count how often chance beats the observation.

   The test must do two things to be worth anything: find a signal that is there, and
   fail to find one that is not.  Both are checked below. */
const PHI=(1+Math.sqrt(5))/2, LNPHI=Math.log(PHI);

function fitPowerLaw(r,y){
  const n=r.length; let sx=0,sy=0,sxx=0,sxy=0;
  for(let i=0;i<n;i++){ const x=Math.log(r[i]), l=Math.log(y[i]); sx+=x; sy+=l; sxx+=x*x; sxy+=x*l; }
  const d=n*sxx-sx*sx, slope=(n*sxy-sx*sy)/d, inter=(sy-slope*sx)/n;
  return {q:-slope, lnA:inter,
    resid:r.map((rr,i)=>Math.log(y[i])-(inter+slope*Math.log(rr)))};
}
/* Lomb–Scargle power and amplitude at one angular frequency, on samples (t, z) */
function lombAt(t,z,w){
  const n=t.length; let ss=0,sc=0;
  for(let i=0;i<n;i++){ ss+=Math.sin(2*w*t[i]); sc+=Math.cos(2*w*t[i]); }
  const tau=Math.atan2(ss,sc)/(2*w);
  let cc=0,sss=0,zc=0,zs=0,zz=0,mz=0;
  for(let i=0;i<n;i++) mz+=z[i]; mz/=n;
  for(let i=0;i<n;i++){ const c=Math.cos(w*(t[i]-tau)), s=Math.sin(w*(t[i]-tau)), d=z[i]-mz;
    cc+=c*c; sss+=s*s; zc+=d*c; zs+=d*s; zz+=d*d; }
  const P=0.5*(zc*zc/Math.max(cc,1e-300)+zs*zs/Math.max(sss,1e-300));
  const a=zc/Math.max(cc,1e-300), b=zs/Math.max(sss,1e-300);
  return {power:P, amp:Math.hypot(a,b), phase:Math.atan2(-b,a)+w*tau,
    varianceFraction:zz>0?2*P/zz:0};
}
function logPeriodTest(r,y,{period=LNPHI,trials=999,seed=12345}={}){
  const f=fitPowerLaw(r,y), t=r.map(Math.log), w=2*Math.PI/period;
  const obs=lombAt(t,f.resid,w);
  let s=seed>>>0; const rnd=()=>((s=(s*1664525+1013904223)>>>0)/4294967296);
  let ge=0;
  for(let k=0;k<trials;k++){
    const p=f.resid.slice();
    for(let i=p.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const tmp=p[i];p[i]=p[j];p[j]=tmp; }
    if(lombAt(t,p,w).power>=obs.power) ge++;
  }
  return {q:f.q, amplitude:obs.amp, phase:obs.phase, power:obs.power,
    varianceFraction:obs.varianceFraction, pValue:(ge+1)/(trials+1), trials, period};
}

/* ── the two things the test must do ─────────────────────────────────────── */
let s=7; const rnd=()=>{s=(s*1103515245+12345)%2147483648; return s/2147483648;};
const gauss=()=>{let u=0,v=0;while(u<=1e-12)u=rnd();v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};

function series(eps,noise,n=140,q=4){
  const r=[],y=[];
  for(let i=0;i<n;i++){ const lr=-6+14*i/(n-1)+0.35*(rnd()-0.5); const rr=Math.exp(lr);
    const mod=1+eps*Math.cos(2*Math.PI*lr/LNPHI+0.7);
    r.push(rr); y.push(Math.pow(rr,-q)*mod*Math.exp(noise*gauss())); }
  return {r,y};
}
console.log('period ln phi =',LNPHI.toFixed(9),'\n');
{ const {r,y}=series(0.12,0.02);
  const t=logPeriodTest(r,y);
  console.log('SIGNAL PRESENT  eps=0.12, noise 2%');
  console.log('   recovered q       ',t.q.toFixed(6),'(injected 4)');
  console.log('   amplitude         ',t.amplitude.toFixed(6),'(injected ~0.12)');
  console.log('   variance fraction ',(100*t.varianceFraction).toFixed(2)+'%');
  console.log('   p-value           ',t.pValue.toExponential(3)); }
{ const {r,y}=series(0,0.02);
  const t=logPeriodTest(r,y);
  console.log('\nNO SIGNAL       pure power law + the same 2% noise');
  console.log('   recovered q       ',t.q.toFixed(6));
  console.log('   amplitude         ',t.amplitude.toFixed(6));
  console.log('   variance fraction ',(100*t.varianceFraction).toFixed(2)+'%');
  console.log('   p-value           ',t.pValue.toFixed(4),'  <- must NOT be small'); }
{ /* and it must not be fooled by a modulation at the WRONG period */
  const r=[],y=[]; const wrong=Math.log(2.7);
  for(let i=0;i<140;i++){ const lr=-6+14*i/139; const rr=Math.exp(lr);
    r.push(rr); y.push(Math.pow(rr,-4)*(1+0.12*Math.cos(2*Math.PI*lr/wrong))*Math.exp(0.02*gauss())); }
  const t=logPeriodTest(r,y);
  console.log('\nWRONG PERIOD    modulation at ln(2.7), tested at ln(phi)');
  console.log('   amplitude         ',t.amplitude.toFixed(6));
  console.log('   p-value           ',t.pValue.toFixed(4),'  <- must NOT be small'); }
{ /* false-positive rate over many pure-noise realisations */
  let hits=0, N=200;
  for(let k=0;k<N;k++){ const {r,y}=series(0,0.03,90); if(logPeriodTest(r,y,{trials:199}).pValue<0.05) hits++; }
  console.log('\nFALSE POSITIVES over',N,'pure power-law series at alpha=0.05:',hits,
              '=',(100*hits/N).toFixed(1)+'%  <- must be near 5%'); }
{ /* the smallest modulation the test can see at this noise */
  console.log('\nDETECTION FLOOR at 2% noise, 140 samples:');
  for(const e of [0.01,0.02,0.03,0.05,0.08]){
    const {r,y}=series(e,0.02); const t=logPeriodTest(r,y,{trials:499});
    console.log('   eps='+e.toFixed(2),' amp='+t.amplitude.toFixed(4),' p='+t.pValue.toFixed(4)); } }
