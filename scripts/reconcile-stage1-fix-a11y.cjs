'use strict';

const fs = require('fs');
const path = 'index.html';
let s = fs.readFileSync(path, 'utf8');

const oldWire = `function hccTabsWire(){
  const n=document.getElementById('hccTabs'); if(!n) return;
  /* The painted label is intentionally hidden on compact phones, but the destination
     must never become anonymous to VoiceOver. Derive one accessible name from the same
     translated label the reader sees elsewhere, and keep decorative glyphs silent. */
  n.querySelectorAll('button').forEach(b=>{
    const label=(b.querySelector('span')?.textContent||b.title||'').trim();
    if(label){ b.setAttribute('aria-label',label); b.title=label; }
    b.querySelector('i')?.setAttribute('aria-hidden','true');
  });
  n.querySelectorAll('[data-insptab]').forEach(b=>b.onclick=()=>{`;

const newWire = `/* Accessible naming belongs to the current nav DOM, not to the act of rebuilding it.
   Desktop starts with the plain four-button markup and may never rebuild at all; mobile does.
   Keeping this separate makes both paths obey the same accessibility contract. */
function hccTabsA11y(n=document.getElementById('hccTabs')){
  if(!n) return;
  n.querySelectorAll('button').forEach(b=>{
    const label=(b.querySelector('span')?.textContent||b.title||'').trim();
    if(label){ b.setAttribute('aria-label',label); b.title=label; }
    b.querySelector('i')?.setAttribute('aria-hidden','true');
  });
}
function hccTabsWire(){
  const n=document.getElementById('hccTabs'); if(!n) return;
  hccTabsA11y(n);
  n.querySelectorAll('[data-insptab]').forEach(b=>b.onclick=()=>{`;

const oldSync = `  try{ hccTabsBuildMerged(); }catch(e){}
  if(n.dataset.merged==='1'){`;
const newSync = `  try{ hccTabsBuildMerged(); }catch(e){}
  hccTabsA11y(n);
  if(n.dataset.merged==='1'){`;

const count = (hay, needle) => hay.split(needle).length - 1;
if (count(s, oldWire) !== 1) throw new Error('Expected exactly one hccTabsWire accessibility block');
if (count(s, oldSync) !== 1) throw new Error('Expected exactly one hccTabsSync build transition');

s = s.replace(oldWire, newWire).replace(oldSync, newSync);
fs.writeFileSync(path, s);
console.log('Applied Stage 1 compact-navigation accessibility lifecycle fix.');
