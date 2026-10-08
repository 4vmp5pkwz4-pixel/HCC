import test from 'node:test';
import assert from 'node:assert/strict';
import {CONTRACT,horizon,state,nodalRoots,horizonPolarSign,compareStates,BRIDGES} from '../core/research/parity-odd-phase.mjs';
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),'mismatch '+a+' != '+b);
test('scientific contract explicitly rejects physics promotion',()=>{
 assert.equal(CONTRACT.dynamic_phase_space,false);assert.equal(BRIDGES.find(b=>b.to.includes('cosmological')).status,'REFUSED');
});
test('strict finite-state / horizon / angle validation',()=>{
 for(const a of [{spin:1,charge:.2,radius:3,mu:0},{spin:0,charge:0,radius:1,mu:0},
 {spin:0,charge:0,radius:3,mu:1.1},{spin:NaN,charge:0,radius:3,mu:0}]) assert.equal(state(a).ok,false);
 near(horizon(0,0).outer,2);near(horizon(1,0).outer,1);near(horizon(0,1).outer,1);
});
test('equatorial shell vanishes; hemisphere parity odd',()=>{
 for(let k=0;k<100;k++){
 const a=.6*Math.sin(k*.47),charge=.3,radius=3+.1*k,mu=Math.cos(k*.23);
 const p=state({spin:a,charge,radius,mu});const q=state({spin:a,charge,radius,mu:-mu});
 assert.equal(p.ok,true);near(p.invariants.shell,-q.invariants.shell,2e-12);
 near(p.invariants.pontryagin,-q.invariants.pontryagin,2e-12);
 near(state({spin:a,charge,radius,mu:0}).invariants.shell,0,2e-12);
 }
});
test('quadratic and cubic Weyl invariants are exactly consistent',()=>{
 for(let i=0;i<100;i++){
 const x=state({spin:.5,charge:.2,radius:2.5+i*.03,mu:Math.sin(i)}).invariants;
 near(x.I.re,3*(x.psi.re**2-x.psi.im**2));near(x.I.im,6*x.psi.re*x.psi.im);
 near(x.J.re,-(x.psi.re**3-3*x.psi.re*x.psi.im**2));
 }
});
test('shell derivative equals negative Pontryagin-weighted density',()=>{
 for(let k=0;k<100;k++){
 const radius=2.8+k*.06,spin=.5,charge=.35,mu=Math.cos(k*.13),h=1e-5;
 const args={spin,charge,mu};const hi=state({...args,radius:radius+h}),lo=state({...args,radius:radius-h}),m=state({...args,radius});
 near(-(hi.invariants.shell-lo.invariants.shell)/(2*h),m.invariants.pontryaginWeighted,8e-7);
 }
});
test('far-field dipole asymptotics, including charge dependence',()=>{
 const r=1500,a=.3,q=.4,mu=.7;
 const shell=state({spin:a,charge:q,radius:r,mu}).invariants.shell;
 const approximation=8*a*mu*(3*r-2*q*q)**2/r**6;
 assert.ok(Math.abs(shell-approximation) <= 2e-6*Math.abs(approximation),'far-field relative error');
});
test('nodal polynomial identity and vacuum threshold',()=>{
 const eta=.07,r=4,charge=Math.sqrt(eta*r),sigma=.4,spin=.5,mu=sigma/spin;
 const s=state({spin,charge,radius:r,mu});const roots=nodalRoots(eta);
 near(s.invariants.nodal, (s.native.x-roots.roots[0])*(s.native.x-roots.roots[1]));
 const alpha=Math.sqrt(7-2*Math.sqrt(10)), spinThreshold=2*alpha/(1+alpha*alpha);
 near(horizonPolarSign(spinThreshold,0).invariants.shell,0,1e-10);
});
test('parameter differences are never reported as dynamical flux',()=>{
 const a=state({spin:.2,charge:.1,radius:3,mu:.4});
 const b=state({spin:.3,charge:.1,radius:3,mu:.4});
 assert.equal(compareStates(a,b).notEvolution,true);
});

test('horizon nodal onset changes polar shell sign without stability inference',()=>{
 const lo=horizonPolarSign(.97,0),hi=horizonPolarSign(.99,0);
 assert.ok(lo.ok&&hi.ok&&lo.invariants.shell>0&&hi.invariants.shell<0);
 assert.equal(CONTRACT.nonclaims.includes('no black-hole instability inference'),true);
});
test('charge modifies the Weyl shell in a valid subextremal domain',()=>{
 const base=state({spin:.5,charge:0,radius:2.5,mu:.7});
 const charged=state({spin:.5,charge:.4,radius:2.5,mu:.7});
 assert.ok(Math.abs(base.invariants.shell-charged.invariants.shell)>0.01);
});
