#!/usr/bin/env node
'use strict';
const fs=require('fs');
const s=fs.readFileSync('index.html','utf8');
let pass=0, fail=0;
function ok(name,cond,detail=''){
  if(cond){ console.log(`PASS — ${name}${detail?` · ${detail}`:''}`); pass++; }
  else { console.error(`FAIL — ${name}${detail?` · ${detail}`:''}`); fail++; }
}
function has(x){ return s.includes(x); }

console.log('=== v4.151.1 linked Cycles view contract ===');
ok('linked-view schema marker exists', has("hcc.cycles-linked-view/1"));
ok('Cycles exposes a dedicated linked analytical frame', /option value=["']linked["']/.test(s) && /state\.cycFrame===['"]linked['"]/.test(s));
ok('linked view is one Three.js instrument owned by the Cycles scene', /const cycLinkedInst\s*=\s*new THREE\.Group\(\)/.test(s) && /cycGroup\.add\(cycLinkedInst\)/.test(s));
ok('all four requested analytical lenses are explicit', ['INTEGRATED INFORMATION','INTEGRATED COMPLEXITY','UNIFIED SCALING','OBSERVER SELECTION'].every(has));
ok('the linked view derives from the existing selected cycle pair', has('state.cycPairA') && has('state.cycPairB') && has('cycleByKey(state.cycPairA)') && has('cycleByKey(state.cycPairB)'));
ok('commensurability is reused rather than reimplemented', /updateCycLinkedView[\s\S]{0,6000}cycleCommensurability\(/.test(s));
ok('all linked motion is derived from the authoritative Cycles epoch', /function cycLinkedPhaseOf\([^)]*\)[\s\S]{0,500}state\.epochDays/.test(s) && /updateCycLinkedView[\s\S]{0,6000}state\.epochDays/.test(s));
ok('resonance highlighting is synchronized to the same epoch rather than a private accumulator', !/let resoPulse\s*=/.test(s) && /function updateCycResonance\([^)]*\)[\s\S]{0,900}cycLinkedPhaseOf/.test(s));
ok('linked view carries an epistemic firewall', has('STRUCTURAL VIEW LINK') && has('not IIT Φ') && has('not a physical causal graph'));
ok('linked object is globally selectable and focusable', /registerSel\(['"]cycLinkedView['"]/.test(s) && /key===['"]cycLinkedView['"]\?['"]linked['"]/.test(s));
ok('Cycles update loop owns linked visibility and update', /cycLinkedInst\.visible\s*=\s*frame===['"]linked['"]/.test(s) && /cycLinkedInst\.visible[^\n]*\n?[^\n]*updateCycLinkedView/.test(s));
ok('camera framing recognizes linked view', /function applyCycFrameView\(\)[\s\S]{0,1500}cycFrame===['"]linked['"]/.test(s));

const linkedStart=s.indexOf('hcc.cycles-linked-view/1');
const linkedEnd=linkedStart>=0?s.indexOf('END LINKED CYCLES VIEW',linkedStart):-1;
const block=linkedStart>=0?s.slice(linkedStart,linkedEnd>linkedStart?linkedEnd:linkedStart+18000):'';
ok('linked runtime creates no private animation loop or timer', block && !/requestAnimationFrame|setAnimationLoop|setInterval|setTimeout/.test(block));
ok('linked runtime does not rebuild line geometry per frame', block && !/updateCycLinkedView[\s\S]*setFromPoints/.test(block));
ok('release identity is v4.151.1', /HCC_VERSION\s*=\s*['"]4\.151\.1['"]/.test(s));

console.log(`\n${pass} passed · ${fail} failed`);
if(fail) process.exit(1);
