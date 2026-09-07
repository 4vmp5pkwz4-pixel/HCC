#!/usr/bin/env node
// Production scene geometry with real Three.js transforms, without a GPU or browser.
// Run after npm install --no-save three@0.160.0.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import * as K from '../core/atlas/extracted.mjs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const begin = html.indexOf('const cosmoGroup=new THREE.Group();');
const end = html.indexOf('const jeansGroup=new THREE.Group();', begin);
assert(begin >= 0 && end > begin);
const state = { cosmoZ:1, cosmoH0:67.66, cosmoOm:0.3111 };
const context = vm.createContext({ ...K, THREE, state, s3Group:new THREE.Group(),
  TT:(...s)=>s[0], labSensor:()=>null,
  // Only DOM labels and the unrelated HUD/publication boundary are replaced.
  mkLabel:()=>Object.assign(new THREE.Object3D(),{element:{}}),
  labWipe:g=>g.clear(), hudBig:{}, hudSub:{}, ATLAS_BUS:{pub(){}},
  document:{getElementById:()=>null}
});
vm.runInContext(html.slice(begin,end), context);
vm.runInContext('cosmoSetup()', context);
let passed=0, failed=0;
function check(name,fn) {
  try { fn(); passed++; console.log('PASS — '+name); }
  catch(error) { failed++; console.error('FAIL — '+name+': '+error.message); }
}
const run=code=>vm.runInContext(code,context);
for(const Om of [0.1,0.3111,0.6]) {
  state.cosmoOm=Om;
  // A sampled curve vertex gives a direct geometry comparison, without interpolation.
  const idx=50;
  state.cosmoZ=7**(idx/109)-1;
  run('updateCosmo(0); cosmoGroup.updateMatrixWorld(true)');
  const O=run('cosmoObjs');
  for(const [curve,dot] of [[O.cC,O.dC],[O.cA,O.dA],[O.cL,O.dL]]) {
    check(`marker lies on its native distance curve at Omega_m=${Om}`,()=>{
      const point=new THREE.Vector3().fromBufferAttribute(curve.geometry.attributes.position,idx);
      curve.localToWorld(point);
      const marker=dot.getWorldPosition(new THREE.Vector3());
      assert(point.distanceTo(marker)<2e-5,`separation ${point.distanceTo(marker)}`);
    });
  }
  check(`turnover marker uses its curve's frame at Omega_m=${Om}`,()=>{
    const expected=O.cA.localToWorld(new THREE.Vector3(O.X(O.peakZ),O.Y(O.peakD),K.cosmoOmDepth(Om)));
    assert(expected.distanceTo(O.peak.getWorldPosition(new THREE.Vector3()))<1e-10);
  });
  check(`the comparison family shares the active curve's frame at Omega_m=${Om}`,()=>{
    const k=2, family=O.omFam[k], origin=new THREE.Vector3();
    const familyOrigin=family.localToWorld(origin.clone());
    const activeOrigin=O.cL.localToWorld(origin.clone());
    assert(familyOrigin.distanceTo(activeOrigin)<1e-10);
  });
}
console.log(`\n${passed}/${passed+failed} observer-scene checks passed`);
process.exitCode=failed?1:0;
