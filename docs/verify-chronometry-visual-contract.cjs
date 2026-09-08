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
/* this matched the string frame==='chronometry' anywhere in the file, which was
   a proxy for "the frame exists" and stopped being one when the frame conditions
   became a declaration. What "expose" actually means is that a reader can CHOOSE
   it, so assert the thing a reader touches: the frame is offered in the Cycles
   view list, and the frame chip carries it. */
assert(/HCC_CYCLE_VIEWS=\[[\s\S]{0,1200}\['chronometry'/.test(src),
  'Cycles must offer the Chronometry frame in its view list, where a reader can choose it');
assert(/<option value="chronometry"/.test(src),
  'and in the engineering frame selector beside the other frames');
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
/* This pinned the literal assignment `cycChronometryInst.visible = frame===...`,
   which was the only record of the fact until the frame-to-instrument map became
   a declaration. The assignment is made from CYC_FRAME_INSTRUMENTS now, so the
   old regex went red for a change that made the same fact MORE legible, not
   less. What matters is the frames the instrument is declared for — assert that
   in the declaration, where it now lives, rather than in a line of control flow
   that no longer exists. */
assert(/\{name:'cycChronometryInst',\s*frames:\['hierarchy','chronometry'\]/.test(src),
  'Chronometry must be declared for the hierarchy and its isolated frame only');
assert(src.includes('if(cycChronometryInst.visible) updateChronometryObservatory();'),
  'Cycles render loop must update the station through the shared clock');

console.log('PASS — Ancient Chronometry 3D visual contract');
