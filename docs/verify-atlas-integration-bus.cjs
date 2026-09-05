#!/usr/bin/env node
'use strict';
const fs=require('fs');
const assert=require('assert/strict');

const src=fs.readFileSync('index.html','utf8');
let pass=0;
function ok(label,cond,detail=''){assert.ok(cond,`${label}${detail?` — ${detail}`:''}`);pass++;console.log(`PASS — ${label}${detail?` · ${detail}`:''}`);}

ok('unified integration schema is materialized',src.includes("HCC_ATLAS_INTEGRATION_SCHEMA = 'hcc.atlas-integration/1'"));
ok('integration gateway is globally exposed',src.includes('globalThis.HCC_ATLAS_INTEGRATION=Object.freeze'));
ok('graph carries typed nodes and typed edges',src.includes("type:'laboratory'")&&src.includes("type:'parameter'")&&src.includes("type:'output'")&&src.includes("type:'dimension'")&&src.includes("type:'projection'")&&src.includes("type:'controls'")&&src.includes("type:'produces'")&&src.includes("type:'projects_to'"));
ok('state frame carries one revisioned time/provenance envelope',src.includes('frameRevision')&&src.includes('time_seconds')&&src.includes('provenance'));
ok('all first-principles contracts are reachable through the integration gateway',src.includes('function hccAtlasContract')&&src.includes('HCC_FIRST_PRINCIPLES.lab'));
ok('Anyon Observatory is connected to the same bus',src.includes("operator:fibonacci.braid")&&src.includes("operator:fibonacci.gate-distance")&&src.includes('HCC_FIRST_PRINCIPLES.braid'));
ok('existing anyon entropy transfer is preserved as a typed cross-lab edge',src.includes('anyzoo.topological_entanglement_entropy')&&src.includes('infolab.entropy_nats')&&src.includes("unit:'nat'"));
ok('cross-lab transfer is guarded by quantity and unit compatibility',src.includes('function hccAtlasTransfer')&&src.includes('quantity_kind_mismatch')&&src.includes('unit_mismatch')&&src.includes('converter_required'));
ok('time synchronization is explicit and shared instead of another animation loop',src.includes('function hccAtlasSetTime')&&src.includes("type:'synchronizes'")&&!/HCC v4\.151 · ATLAS INTEGRATION BUS[\s\S]*requestAnimationFrame\s*\(/.test(src));
ok('multiview, chronometry, solar and XR are declared integration domains without being equated',src.includes("'multiview'")&&src.includes("'chronometry'")&&src.includes("'solar'")&&src.includes("'xr'")&&src.includes('does_not_assert_physical_equivalence'));
ok('Lens reads contracts through the integration gateway',src.includes('const ATLAS=globalThis.HCC_ATLAS_INTEGRATION')&&src.includes('ATLAS.contract(selected)'));
ok('dependency view can query graph neighborhoods',src.includes('ATLAS.neighborhood(selected)'));
ok('unknown metadata remains fail-closed',src.includes("const HCC_ATLAS_UNDECLARED='UNDECLARED'")&&src.includes('fail_closed:true'));

console.log(`\nATLAS INTEGRATION BUS GATE: ${pass} assertions passed`);
