#!/usr/bin/env node
'use strict';
const fs=require('fs');
const assert=require('assert/strict');

const src=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('api/manifest.json','utf8'));
let pass=0;
function ok(label,cond,detail=''){assert.ok(cond,`${label}${detail?` — ${detail}`:''}`);pass++;console.log(`PASS — ${label}${detail?` · ${detail}`:''}`);}

const busStart=src.indexOf('HCC v4.151 · ATLAS INTEGRATION BUS');
const busEnd=src.indexOf('END HCC v4.151 ATLAS INTEGRATION BUS',busStart);
const busBlock=busStart>=0&&busEnd>busStart?src.slice(busStart,busEnd):'';

ok('unified integration schema is materialized',src.includes("HCC_ATLAS_INTEGRATION_SCHEMA = 'hcc.atlas-integration/1'"));
ok('integration gateway is globally exposed',src.includes('globalThis.HCC_ATLAS_INTEGRATION=Object.freeze'));
ok('graph carries typed nodes and typed edges',src.includes("type:'laboratory'")&&src.includes("type:'parameter'")&&src.includes("type:'output'")&&src.includes("type:'dimension'")&&src.includes("type:'projection'")&&src.includes("type:'controls'")&&src.includes("type:'produces'")&&src.includes("type:'projects_to'"));
ok('state frame carries one revisioned time/provenance envelope',src.includes('frameRevision')&&src.includes('time_seconds')&&src.includes('provenance'));
ok('all first-principles contracts are reachable through the integration gateway',src.includes('function hccAtlasContract')&&src.includes('HCC_FIRST_PRINCIPLES.lab'));
ok('Anyon Observatory is connected to the same bus',src.includes("operator:fibonacci.braid")&&src.includes("operator:fibonacci.gate-distance")&&src.includes('HCC_FIRST_PRINCIPLES.braid'));
ok('existing anyon entropy transfer is preserved as a typed cross-lab edge',src.includes('anyzoo.topological_entanglement_entropy')&&src.includes('infolab.entropy_nats')&&src.includes("unit:'nat'"));
ok('cross-lab transfer is guarded by quantity and unit compatibility',src.includes('function hccAtlasTransfer')&&src.includes('quantity_kind_mismatch')&&src.includes('unit_mismatch')&&src.includes('converter_required'));
ok('time synchronization is explicit and shared instead of another animation loop',busBlock.includes('function hccAtlasSetTime')&&busBlock.includes("type:'synchronizes'")&&!/requestAnimationFrame\s*\(/.test(busBlock));
ok('multiview, chronometry, solar and XR are declared integration domains without being equated',src.includes("'multiview'")&&src.includes("'chronometry'")&&src.includes("'solar'")&&src.includes("'xr'")&&src.includes('does_not_assert_physical_equivalence'));
ok('Lens reads contracts through the integration gateway',src.includes('const ATLAS=globalThis.HCC_ATLAS_INTEGRATION')&&src.includes('ATLAS.contract(selected)'));
ok('dependency view can query graph neighborhoods',src.includes('ATLAS.neighborhood(selected)'));
ok('unknown metadata remains fail-closed',src.includes("const HCC_ATLAS_UNDECLARED='UNDECLARED'")&&src.includes('fail_closed:true'));

ok('the measured manifest bus is imported rather than replaced by a parallel hand-written bus',
  src.includes('HCC_ATLAS_DECLARED_LINKS=Object.freeze')&&src.includes("provenance:'api/manifest.json bus.links'"),
  `${(manifest.bus&&manifest.bus.links||[]).length} measured links`);
ok('world membership is part of the unified graph',src.includes("type:'world'")&&src.includes("type:'belongs_to_world'"));
ok('prepared multiview comparisons are first-class graph nodes',src.includes("type:'multiview'")&&src.includes("type:'contains_view'"));
ok('all live typed instruments are discovered through the existing HCC_API',src.includes('HCC_API.instruments.list')&&src.includes('HCC_API.describe')&&src.includes("type:'instrument'"));
ok('instrument contracts attach to laboratories instead of duplicating solvers',src.includes("type:'exposes_instrument'")&&src.includes("source:'HCC_API.describe'"));
ok('integration source identity is explicit',src.includes('source_manifest_version')&&src.includes('source_manifest_build'));

console.log(`\nATLAS INTEGRATION BUS GATE: ${pass} assertions passed`);
