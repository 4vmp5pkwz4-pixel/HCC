import test from 'node:test';
import assert from 'node:assert/strict';
/* Differential test of the V5 K_- commuting-Hopf theorem, separate from the
 * spectral-certificate tests. Unit radius; exact radius scaling is documented. */
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const norm=v=>Math.sqrt(dot(v,v));
const add=(a,b)=>a.map((x,i)=>x+b[i]);
const scale=(a,x)=>a.map(t=>t*x);
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
const pow=(z,k)=>{let p=[1,0];for(let i=0;i<k;i++)p=mul(p,z);return p};
const K=q=>[-q[1],q[0],q[3],-q[2]];
const X2=q=>[-q[2],q[3],q[0],-q[1]],X3=q=>[-q[3],-q[2],q[1],q[0]];
const P=(q,k)=>pow(mul([q[0],q[1]],[q[2],q[3]]),k);
const w=(q,k)=>{const p=P(q,k);return sub(scale(X2(q),p[0]),scale(X3(q),p[1]))};
const imag=(q,k)=>P(q,k)[1];
const directional=(f,q,d,h=1e-5)=>scale(sub(f(add(q,scale(d,h))),f(sub(q,scale(d,h)))),1/(2*h));
const gradient=(f,q)=>q.map((_,j)=>{const e=[0,0,0,0];e[j]=1;return (f(add(q,scale(e,1e-5)))-f(sub(q,scale(e,1e-5))))/(2e-5)});
const sign=p=>{let s=1;for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)if(p[i]>p[j])s=-s;return s};
const cross=(u,v,q)=>{const r=[0,0,0,0];for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let k=0;k<4;k++)for(let l=0;l<4;l++){const p=[i,j,k,l];if(new Set(p).size===4)r[i]-=sign(p)*q[j]*u[k]*v[l]}return r};
const curl=(F,q)=>{const der=q.map((_,j)=>{const e=[0,0,0,0];e[j]=1;return directional(F,q,e)}),r=[0,0,0,0];
for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let k=0;k<4;k++)for(let l=0;l<4;l++){const p=[i,j,k,l];if(new Set(p).size===4)r[i]-=sign(p)*q[j]*der[k][l]}return r};
const randomSphere=()=>{let state=41313;return ()=>{const a=Array.from({length:4},()=>{state=(1103515245*state+12345)%2147483647;return state/2147483647-.5});return scale(a,1/norm(a))}};
test('Hopf-Killing nonresonance: curl, commutation, closed primitive, full pressure PDE',()=>{
const rnd=randomSphere();
for(let k=0;k<4;k++)for(let n=0;n<16;n++){
 const q=rnd(),v=K(q),z=w(q,k),vv=x=>w(x,k),kf=x=>K(x);
 assert.ok(norm(sub(directional(vv,q,v),directional(kf,q,z)))<5e-7,'commutator');
 assert.ok(norm(sub(curl(vv,q),scale(z,2*k+2)))<5e-7,'signed Hopf curl');
 assert.ok(norm(add(curl(kf,q),scale(v,2)))<5e-7,'negative Killing curl');
 const f=x=>imag(x,k+1)/(k+1),G=gradient(f,q),tang=sub(G,scale(q,dot(q,G)));
 assert.ok(norm(sub(cross(v,z,q),tang))<5e-7,'cross product is gradient of explicit polynomial');
 const U=x=>add(K(x),scale(w(x,k),.7));
 const pressure=x=>-dot(U(x),U(x))/2+((2*k+4)/(k+1))*.7*imag(x,k+1);
 const uu=U(q),cov=add(directional(U,q,uu),scale(q,dot(uu,uu))),Gp=gradient(pressure,q);
 const gp=sub(Gp,scale(q,dot(q,Gp)));
 assert.ok(norm(add(cov,gp))<3e-6,'exact nonlinear Navier-Stokes residual');
}});
