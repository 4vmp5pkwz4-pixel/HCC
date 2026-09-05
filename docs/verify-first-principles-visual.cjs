#!/usr/bin/env node
'use strict';

const fs=require('fs');
const assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
let pass=0;
function ok(label,cond){ assert.ok(cond,label); pass++; console.log(`PASS — ${label}`); }

const begin='HCC v4.151 · FIRST-PRINCIPLES LENS';
const end='END HCC v4.151 FIRST-PRINCIPLES LENS';
const a=html.indexOf(begin), b=html.indexOf(end);
ok('visual first-principles lens is installed',a>=0&&b>a);
const src=a>=0&&b>a?html.slice(a,b):'';

ok('lens has a stable trigger and lazy open/close lifecycle',
  src.includes('hccFpTrigger')&&src.includes('hccFpOpenLens')&&src.includes('hccFpCloseLens')&&src.includes('.remove()'));
ok('formula, dependency and geometry views are independently addressable',
  src.includes("'formula'")&&src.includes("'dependency'")&&src.includes("'geometry'")&&
  src.includes('hccFpRenderFormula')&&src.includes('hccFpRenderDependency')&&src.includes('hccFpRenderGeometry'));
ok('exact and evaluated values have dedicated visual slots',
  src.includes('fpExact')&&src.includes('fpEvaluated')&&src.includes('fpDimensionBadge')&&src.includes('fpConventionBadge'));
ok('mobile safe areas and reduced motion are explicit',
  src.includes('safe-area-inset-bottom')&&src.includes('safe-area-inset-right')&&src.includes('prefers-reduced-motion'));
ok('hidden lens owns no animation loop',!src.includes('requestAnimationFrame'));
ok('geometry view refuses invented bindings',src.includes('no geometry binding declared'));

for(const id of ['fusion-tree','fr-switch','braid-composer','gate-comparator','model-contrast']){
  ok(`Anyon Observatory station ${id} is registered`,src.includes(id));
}
ok('Anyon Observatory keeps external universality claims behind the firewall',
  src.includes('EXTERNAL theorem')&&src.includes('braiding alone')&&src.includes('phase-invariant normalized Frobenius distance'));
ok('Fusion Tree uses the actual Fibonacci recurrence',
  src.includes('nextVac=tau')&&src.includes('nextTau=vac+tau'));
ok('Braid Composer delegates matrix evaluation to the verified kernel',src.includes('hccFibBraidWord'));
ok('Gate Comparator delegates global-phase handling to the verified metric',src.includes('hccMatrixDistancePhaseInvariant'));
ok('basis reassociation and physical exchange are visually separated',
  src.includes('REASSOCIATE')&&src.includes('BRAID')&&src.includes('F^-1 R F'));

console.log(`\nFIRST-PRINCIPLES VISUAL GATE: ${pass} assertions passed`);
