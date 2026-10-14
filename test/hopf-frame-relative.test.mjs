import test from 'node:test';
import assert from 'node:assert/strict';
import {hopfFrameSnapshot,hopfRelativePendulum} from '../core/math/hopf-frame-relative.mjs';
const close=(a,b,t=1e-11)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
test('orthogonal triad has zero Gram defect and stress',()=>{
 const s=hopfFrameSnapshot({a:2,kappa:4});
 close(s.gram_defect_frobenius2,0);
 close(s.alignment_potential_density,0);
 assert.ok(s.anisotropic_stress.flat().every(x=>x===0));
 assert.equal(s.observed_cosmology,false);
});
test('relative Gram penalty is exactly squared stress norm',()=>{
 const x=.2,s=hopfFrameSnapshot({a:2,alpha:1.2,beta:3,kappa:4,
 vectors:[[1,0,0],[Math.sin(x),Math.cos(x),0],[0,0,1]]});
 const n=s.anisotropic_stress.flat().reduce((a,b)=>a+b*b,0);
 close(s.alignment_potential_density,4*n/(4*s.C**2));
 assert.ok(s.alignment_potential_density>0);
});
test('Noether charge dictates physical momentum density',()=>{
 const s=hopfFrameSnapshot({a:3,velocities:[[0,.2,.3],[.3,0,.1],[.1,.2,0]]});
 s.noether_charge_per_unit_comoving_volume.forEach((x,i)=>close(s.physical_momentum_density[i],2*x/81));
});
test('expanding relative energy is nonincreasing',()=>{
 for(const H of [0,.1,1]){const v=hopfRelativePendulum({a:2,alpha:1,beta:2,kappa:3,x:.2,xdot:.7,H});
 assert.ok(v.reduced_energy>0);assert.ok(v.reduced_energy_time_derivative<=0);}
});
test('reject invalid inputs',()=>{
 assert.throws(()=>hopfFrameSnapshot({a:0}),RangeError);
 assert.throws(()=>hopfFrameSnapshot({vectors:[[2,0,0],[0,1,0],[0,0,1]]}),RangeError);
 assert.throws(()=>hopfRelativePendulum({a:1,alpha:1,beta:1,kappa:-1,x:0,xdot:0}),RangeError);
});
