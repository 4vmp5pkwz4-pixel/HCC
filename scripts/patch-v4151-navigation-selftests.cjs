#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path='index.html';
let s=fs.readFileSync(path,'utf8');
const oldClosure=`bad.length===0 && dup.length===0 && bare.length===0 && uncat.length===0
       && LAB_REGISTRY.length===Object.keys(S3_VIEW_NAMES).length,`;
const newClosure=`bad.length===0 && dup.length===0 && bare.length===0 && uncat.length===0
       && LAB_BY_ID.size===LAB_REGISTRY.length && LAB_REGISTRY.every(L=>LAB_BY_ID.has(L.id)),`;
const oldPalette=`{ const inPalette=(()=>{ try{ return LAB_REGISTRY.length; }catch(e){ return 0; } })();`;
const newPalette=`{ const inPalette=(()=>{ try{ return LAB_REGISTRY.filter(L=>L&&L.id&&L.route&&LAB_BY_ID.has(L.id)&&hccParseRoute(L.route)?.labId===L.id).length; }catch(e){ return 0; } })();`;
const oldPaletteCheck=`inPalette===Object.keys(S3_VIEW_NAMES).length,`;
const newPaletteCheck=`inPalette===LAB_REGISTRY.length,`;
let changed=0;
for(const [from,to,label] of [[oldClosure,newClosure,'registry closure'],[oldPalette,newPalette,'palette route census'],[oldPaletteCheck,newPaletteCheck,'palette authoritative count']]){
  if(s.includes(to)) continue;
  const n=s.split(from).length-1;
  if(n!==1) throw new Error(`${label}: expected exactly one legacy anchor, found ${n}`);
  s=s.replace(from,to);changed++;
}
fs.writeFileSync(path,s);
console.log(`navigation self-tests use LAB_REGISTRY/LAB_BY_ID/router invariants · ${changed} replacement(s)`);
