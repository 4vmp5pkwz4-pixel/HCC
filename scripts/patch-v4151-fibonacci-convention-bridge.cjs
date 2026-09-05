#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path='index.html';
let s=fs.readFileSync(path,'utf8');
const marker='HCC v4.151 · FIBONACCI CONVENTION BRIDGE';
if(s.includes(marker)){
  console.log('Fibonacci convention bridge already present');
  process.exit(0);
}
if(!s.includes("HCC_FIRST_PRINCIPLES_SCHEMA = 'hcc.first-principles/1'")) throw new Error('first-principles core must be patched first');

const oldConvention=`    braiding:'right-handed displayed convention',
    mirror:'mirror/orientation reversal sends every displayed R phase to its complex conjugate',
    note:'F/R entries are convention-dependent; fusion multiplicities, quantum dimensions and closed topological observables are physical invariants.'`;
const newConvention=`    braiding:'display convention A: R_1=exp(-4*pi*i/5), R_tau=exp(3*pi*i/5); braid orientation convention is defined by the ordered exchange generator, not by an absolute handedness label',
    core_braiding:'Atlas core native convention B: R_1_core = exp(4*pi*i/5), R_tau_core = exp(-3*pi*i/5)',
    mirror:'mirror/orientation reversal sends every displayed R phase to its complex conjugate; R_core = conjugate(R_display)',
    note:'F/R entries are convention-dependent; the Atlas-native braid orientation is the exact complex-conjugate representation of display convention A. Fusion multiplicities, quantum dimensions and closed topological observables are physical invariants.'`;
if(!s.includes(oldConvention)) throw new Error('convention anchor missing');
s=s.replace(oldConvention,newConvention);

const oldR=`  const R=[[R1,hccFpC(0)],[hccFpC(0),Rtau]];
  const sigma1=R;
  const sigma2=hccFpMatMul(hccFpMatMul(hccFpMatDag(F),R),F);`;
const newR=`  const R=[[R1,hccFpC(0)],[hccFpC(0),Rtau]];
  /* ${marker}. Convention A is the explicit pedagogical orientation used by this Lens.
     The pre-existing exact fibonacci.anyons core uses the mirror braid orientation:
     R_1_core = exp(4*pi*i/5), R_tau_core = exp(-3*pi*i/5), hence R_core = conjugate(R_display).
     This is a braid orientation convention change, not a change in fusion data. */
  const R_core=R.map(row=>row.map(hccFpCConj));
  const sigma1=R;
  const sigma2=hccFpMatMul(hccFpMatMul(hccFpMatDag(F),R),F);
  const sigma1_core=R_core;
  const sigma2_core=hccFpMatMul(hccFpMatMul(hccFpMatDag(F),R_core),F);`;
if(!s.includes(oldR)) throw new Error('R construction anchor missing');
s=s.replace(oldR,newR);

const oldNumerical=`    numerical:{phi,phi_inv:phiInv,phi_inv_sqrt:phiInvSqrt,D,F,R,sigma1,sigma2},`;
const newNumerical=`    numerical:{phi,phi_inv:phiInv,phi_inv_sqrt:phiInvSqrt,D,F,R,R_core,sigma1,sigma2,sigma1_core,sigma2_core},`;
if(!s.includes(oldNumerical)) throw new Error('numerical payload anchor missing');
s=s.replace(oldNumerical,newNumerical);

const oldBraid=`      braid_relation:hccFpMatResidual(lhs,rhs)`;
const newBraid=`      braid_relation:hccFpMatResidual(lhs,rhs),
      core_display_conjugacy:Math.max(
        hccFpMatResidual(sigma1_core,sigma1.map(row=>row.map(hccFpCConj))),
        hccFpMatResidual(sigma2_core,sigma2.map(row=>row.map(hccFpCConj)))
      )`;
if(!s.includes(oldBraid)) throw new Error('invariant-check anchor missing');
s=s.replace(oldBraid,newBraid);

fs.writeFileSync(path,s);
console.log('bridged first-principles display convention A to the conjugate Atlas core native convention B');
