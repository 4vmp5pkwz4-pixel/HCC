#!/usr/bin/env node
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

(async()=>{
  const X=await import(pathToFileURL(path.join(__dirname,'..','core/atlas/extracted.mjs')).href);
  const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const out=[]; const ok=(n,c,d='')=>out.push([c?'PASS':'FAIL',n,d]);
  const I1=1,I2=2,I3=3,E=1;
  const ratios=[.58,.72,.84,.93,.975,1.025,1.07,1.16,1.30,1.42]
    .filter(r=>r>I1/I2+2e-3&&r<I3/I2-2e-3);
  const K=k=>{let a=1,b=Math.sqrt(Math.max(0,1-k*k));for(let i=0;i<60;i++){const a1=(a+b)/2,b1=Math.sqrt(a*b);a=a1;b=b1;if(Math.abs(a-b)<1e-17)break;}return Math.PI/(2*a);};
  let below=0,above=0,near=0,worstE=0,worstL=0,worstClosure=0;
  for(const ratio of ratios){
    const L2=2*E*I2*ratio;
    ratio<1?below++:above++; if(Math.abs(ratio-1)<.04) near++;
    const P=X.poinSolve(I1,I2,I3,E,L2),T=4*K(P.k)/P.tau;
    let first=null,last=null;
    for(let n=0;n<=320;n++){
      const w=X.poinOmega(P,T*n/320); if(!first)first=w; last=w;
      worstE=Math.max(worstE,Math.abs(I1*w[0]**2+I2*w[1]**2+I3*w[2]**2-2*E));
      worstL=Math.max(worstL,Math.abs(I1**2*w[0]**2+I2**2*w[1]**2+I3**2*w[2]**2-L2));
    }
    worstClosure=Math.max(worstClosure,Math.hypot(first[0]-last[0],first[1]-last[1],first[2]-last[2]));
  }
  ok('rendered phase family spans both sides of the intermediate-axis separatrix',below>0&&above>0);
  ok('rendered phase family includes two near-separatrix trajectories',near>=2);
  ok('every rendered-family sample stays on the exact energy quadric',worstE<1e-10,`worst ${worstE}`);
  ok('every rendered-family sample stays on the exact momentum quadric',worstL<1e-10,`worst ${worstL}`);
  ok('one computed Jacobi period closes every rendered-family curve',worstClosure<1e-8,`worst ${worstClosure}`);
  ok('renderer samples every family curve from the same exact poinSolve/poinOmega kernel',
    src.includes('const l2=2*E*I2*r, P=poinSolve(I1,I2,I3,E,l2), K=agmK(P.k)') &&
    src.includes('const w=poinOmega(P,T*n/320)'));
  ok('visible scene title identifies reduced Euler-top ω-space rather than claiming the complete classical Poinsot construction',
    src.includes('REDUCED EULER TOP · DZHANIBEKOV — ω-space intersection geometry') &&
    !src.includes('POINSOT · DZHANIBEKOV — ω lives on the intersection of two ellipsoids'));
  ok('first-order attitude reconstruction is explicitly not identified as classical Poinsot rolling',
    src.includes('Illustrative first-order attitude reconstruction from exact reduced ω(t).') &&
    src.includes('This mesh is deliberately not labelled as the classical Poinsot rolling construction.'));
  for(const [s,n,d] of out) console.log(`${s} — ${n}${d?' · '+d:''}`);
  if(out.some(x=>x[0]==='FAIL')) process.exit(1);
})().catch(e=>{console.error(e);process.exit(1);});
