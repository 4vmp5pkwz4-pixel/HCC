'use strict';
const fs=require('fs');
const assert=require('assert/strict');
const src=fs.readFileSync('index.html','utf8');
const manifest=fs.readFileSync('scripts/build-manifest.mjs','utf8');

assert(src.includes("id:'chronometry', parentWorld:'cyc'"),
  'Chronometry must be registered as a Cycles-owned laboratory');
assert(src.includes("return ctx.labId ? `#/world/${ctx.worldId}/lab/${ctx.labId}` : `#/world/${ctx.worldId}`;"),
  'route serialization must support laboratories in any world');
assert(src.includes("if(m[2]){ const L=LAB_BY_ID.get(m[2]); if(!L||L.parentWorld!==m[1]) return null; }"),
  'route parser must reject a laboratory attached to a different world');
assert(src.includes("else if(labId&&worldId==='cyc')"),
  'navigation must keep and activate a Cycles-owned laboratory');
assert(src.includes("if(HCC_CTX.labId){ hccGo({worldId:HCC_CTX.worldId,labId:null}); return true; }"),
  'Back must leave a laboratory without assuming S3');
assert(src.includes("return HCC_CTX.labId?HCC_CTX.labId:HCC_CTX.worldId;"),
  'configuration ownership must follow the active laboratory in any world');
assert(!manifest.includes("HCC_NAV.go('s3', id)"),
  'manifest walker must not force every laboratory through S3');
assert(/page\.evaluate\(async \(\{id,world\}\) => \{[\s\S]*?HCC_NAV\.go\(world, id\)/.test(manifest),
  'manifest walker must pass each declared parent world into the browser context explicitly');
assert(/\{id:L\.id,\s*world:L\.world\s*\|\|\s*L\.parentWorld\s*\|\|\s*'s3'\}/.test(manifest),
  'manifest walker must source the browser world from the laboratory registry');

console.log('PASS — world-owned laboratory routing contract');
