#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path='index.html';
let s=fs.readFileSync(path,'utf8');
let changed=0;
function replaceOne(label,re,replacement,already){
  if(already && s.includes(already)) return;
  const matches=[...s.matchAll(re)];
  if(matches.length!==1) throw new Error(`${label}: expected exactly one legacy invariant, found ${matches.length}`);
  s=s.replace(re,replacement);changed++;
}
replaceOne(
  'registry closure',
  /bad\.length===0\s*&&\s*dup\.length===0\s*&&\s*bare\.length===0\s*&&\s*uncat\.length===0\s*&&\s*LAB_REGISTRY\.length===Object\.keys\(S3_VIEW_NAMES\)\.length,/g,
  `bad.length===0 && dup.length===0 && bare.length===0 && uncat.length===0\n       && LAB_BY_ID.size===LAB_REGISTRY.length && LAB_REGISTRY.every(L=>LAB_BY_ID.has(L.id)),`,
  'LAB_BY_ID.size===LAB_REGISTRY.length && LAB_REGISTRY.every(L=>LAB_BY_ID.has(L.id))'
);
replaceOne(
  'palette route census',
  /\{\s*const inPalette=\(\(\)=>\{\s*try\{\s*return LAB_REGISTRY\.length;\s*\}catch\(e\)\{\s*return 0;\s*\}\s*\}\)\(\);/g,
  `{ const inPalette=(()=>{ try{ return LAB_REGISTRY.filter(L=>L&&L.id&&L.route&&LAB_BY_ID.has(L.id)&&hccParseRoute(L.route)?.labId===L.id).length; }catch(e){ return 0; } })();`,
  'LAB_REGISTRY.filter(L=>L&&L.id&&L.route&&LAB_BY_ID.has(L.id)&&hccParseRoute(L.route)?.labId===L.id).length'
);
replaceOne(
  'palette authoritative count',
  /inPalette===Object\.keys\(S3_VIEW_NAMES\)\.length,/g,
  'inPalette===LAB_REGISTRY.length,',
  'inPalette===LAB_REGISTRY.length,'
);
fs.writeFileSync(path,s);
console.log(`navigation self-tests use LAB_REGISTRY/LAB_BY_ID/router invariants · ${changed} replacement(s)`);
