#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path='index.html';
let s=fs.readFileSync(path,'utf8');
const marker='HCC v4.151 · FIRST-PRINCIPLES VISUAL BEHAVIOR FIXES';
if(s.includes(marker)){
  console.log('First-Principles visual behavior fixes already present');
  process.exit(0);
}
if(!s.includes('HCC v4.151 · FIRST-PRINCIPLES LENS')) throw new Error('visual lens must be patched first');

const oldLabel="function labLabel(x){return typeof x==='string'?x:(x&&x.title)||labId(x);}";
const newLabel="/* "+marker+" */\nfunction labLabel(x){if(typeof x==='string')return x;const t=x&&x.title;if(typeof t==='string')return t;if(t&&typeof t==='object')return t.en||t.ru||t.de||labId(x);return labId(x);}";
if(!s.includes(oldLabel))throw new Error('labLabel anchor missing');
s=s.replace(oldLabel,newLabel);

const oldWire="function wireStation(){const root=lens.querySelector('.hccFpBody');root.querySelectorAll('[data-station]').forEach(b=>b.addEventListener('click',()=>{station=b.dataset.station;hccFpRender();}));const n=root.querySelector('#fpFusionN');if(n)n.addEventListener('change',()=>{root.querySelector('#hccFpStation').innerHTML=renderFusionTree();wireStationLocal();});wireStationLocal();}\nfunction wireStationLocal(){const root=lens.querySelector('#hccFpStation');if(!root)return;root.querySelectorAll('[data-fr]').forEach(b=>b.addEventListener('click',()=>{root.innerHTML=renderFr(b.dataset.fr);wireStationLocal();}));const ba=root.querySelector('#fpBraidApply');if(ba)ba.addEventListener('click',()=>{const w=root.querySelector('#fpBraidWord').value;root.innerHTML=renderBraid(w);wireStationLocal();});const ga=root.querySelector('#fpGateApply');if(ga)ga.addEventListener('click',()=>{const w=root.querySelector('#fpGateWord').value,t=root.querySelector('#fpGateTarget').value;root.innerHTML=renderGate(w,t);wireStationLocal();});}";
const newWire="function wireStation(){const root=lens.querySelector('.hccFpBody');root.querySelectorAll('[data-station]').forEach(b=>b.addEventListener('click',()=>{station=b.dataset.station;hccFpRender();}));wireStationLocal();}\nfunction wireStationLocal(){const root=lens.querySelector('#hccFpStation');if(!root)return;const n=root.querySelector('#fpFusionN');if(n)n.addEventListener('change',()=>{root.innerHTML=renderFusionTree();wireStationLocal();});root.querySelectorAll('[data-fr]').forEach(b=>b.addEventListener('click',()=>{root.innerHTML=renderFr(b.dataset.fr);wireStationLocal();}));const ba=root.querySelector('#fpBraidApply');if(ba)ba.addEventListener('click',()=>{const w=root.querySelector('#fpBraidWord').value;root.innerHTML=renderBraid(w);wireStationLocal();});const ga=root.querySelector('#fpGateApply');if(ga)ga.addEventListener('click',()=>{const w=root.querySelector('#fpGateWord').value,t=root.querySelector('#fpGateTarget').value;root.innerHTML=renderGate(w,t);wireStationLocal();});}";
if(!s.includes(oldWire))throw new Error('station wiring anchor missing');
s=s.replace(oldWire,newWire);

fs.writeFileSync(path,s);
console.log('hardened First-Principles Lens labels and repeatable station controls');
