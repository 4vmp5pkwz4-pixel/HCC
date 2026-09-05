'use strict';
const fs=require('fs');
const assert=require('assert/strict');
const src=fs.readFileSync('index.html','utf8');

assert(src.includes('const cycChronometryInst=new THREE.Group()'),
  'Ancient Chronometry must have a native Three.js instrument group');
assert(src.includes('function updateChronometryObservatory()'),
  'Chronometry observatory must have an update function');
assert(!/chronometryT\s*\+=/.test(src),
  'Chronometry may not own a private render-frame clock');
assert(/state\.epochDays/.test((src.match(/function updateChronometryObservatory\(\)[\s\S]{0,5000}/)||[''])[0]),
  'Chronometry update must derive its time marker from the shared Atlas epoch');
assert(src.includes("frame==='chronometry'"),
  'Cycles must expose an isolated Chronometry frame');
assert(src.includes('Same term / different definition'),
  'source space must make same-name definition conflicts explicit');
assert(src.includes('PENDING_EPOCH_CORRECTION'),
  'historical astronomy markers must expose pending epoch correction');
assert(src.includes('SOURCE SPACE') && src.includes('SCIENCE SPACE'),
  'the visual station must keep source-space and science-space geometries distinct');
assert(src.includes('DEPENDENT · 42k = 2 × 21k'),
  'the 42 kyr Jain datum must visibly carry its dependency status');
assert(src.includes('NO PHASE ANCHOR'),
  'the 21 kyr comparison must visibly refuse phase consistency');
assert(/cycChronometryInst\.visible\s*=\s*frame==='hierarchy'\|\|frame==='chronometry'/.test(src),
  'Chronometry must be visible in hierarchy and its isolated frame only');
assert(src.includes('if(cycChronometryInst.visible) updateChronometryObservatory();'),
  'Cycles render loop must update the station through the shared clock');

console.log('PASS — Ancient Chronometry 3D visual contract');
