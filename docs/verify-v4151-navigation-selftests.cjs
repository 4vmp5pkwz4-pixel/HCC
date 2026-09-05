#!/usr/bin/env node
'use strict';
const fs=require('fs');
const assert=require('assert');
const s=fs.readFileSync('index.html','utf8');
function ok(label,cond){assert.ok(cond,label);console.log('PASS — '+label);}
ok('registry closure no longer equates the full laboratory registry with the S3 visual-name subset',!s.includes('LAB_REGISTRY.length===Object.keys(S3_VIEW_NAMES).length'));
ok('registry closure is checked against the authoritative LAB_BY_ID registry',s.includes('LAB_BY_ID.size===LAB_REGISTRY.length && LAB_REGISTRY.every(L=>LAB_BY_ID.has(L.id))'));
ok('palette census validates each laboratory through its canonical registry entry and router round-trip',s.includes("LAB_REGISTRY.filter(L=>L&&L.id&&L.route&&LAB_BY_ID.has(L.id)&&hccParseRoute(L.route)?.labId===L.id).length"));
ok('palette completeness is measured against LAB_REGISTRY rather than the S3 view subset',s.includes('inPalette===LAB_REGISTRY.length,')&&!s.includes('inPalette===Object.keys(S3_VIEW_NAMES).length,'));
console.log('\nV4.151 NAVIGATION SELF-TEST GATE: 4 assertions passed');
