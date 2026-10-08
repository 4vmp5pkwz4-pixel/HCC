#!/usr/bin/env node
'use strict';
/* Independent, deliberately small numerical witness for the CEF selector's
   displayed +nu log(q) convention. No cosmological or quantum-gravity proof. */
const assert = require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');

const q0=3.307251460713979e122, nu=0.5;
const G=q=>q*(Math.log(q/q0)-1)+nu*Math.log(q);
const dG=q=>Math.log(q/q0)+nu/q;
const d2G=q=>1/q-nu/(q*q);
const close=(x,y,tol)=>Math.abs(x-y)<tol;

for(const q of [0.25,1,2,4]){
  const h=1e-4*q;
  const numeric=(G(q+h)-G(q-h))/(2*h);
  assert.ok(close(numeric,dG(q),2e-4), 'first derivative at q='+q);
}
{
  const q=0.25,h=1e-3;
  const numeric=(G(q+h)-2*G(q)+G(q-h))/(h*h);
  assert.ok(close(numeric,d2G(q),1e-3),'negative curvature witness');
}
assert.equal(d2G(0.25),-4);
assert.ok(nu<1 && [1,2,10,1e3,q0].every(q=>d2G(q)>0));
assert.ok(dG(1)<0 && dG(2*q0)>0);
assert.ok(G(1e-20)<G(1e-10)); // non-global q>0 behavior
assert.ok(Math.abs(dG(q0))>0); // q0 is not an exact stationary point
const original=readFileSync(resolve(__dirname,'verify-capacity-selector-closure.cjs'),'utf8');
assert.match(original,/const dG =q=>Math\.log\(q\/Q_STAR\)\+NU\/q;/);
assert.match(original,/const d2G=q=>1\/q-NU\/\(q\*q\);/);
assert.ok(!original.includes('WITHOUT having been given it'));
console.log('PASS selector sign / finite differences / explicit domain / source drift guard (q>=1, constant remainder)');
