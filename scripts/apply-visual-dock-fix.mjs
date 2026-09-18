#!/usr/bin/env node
import {readFileSync,writeFileSync} from 'node:fs';
const file='index.html';
let s=readFileSync(file,'utf8');
const changes=[];
function replace1(a,b,label){
  const i=s.indexOf(a);
  if(i<0) throw new Error('missing anchor: '+label);
  if(s.indexOf(a,i+1)>=0) throw new Error('non-unique anchor: '+label);
  s=s.slice(0,i)+b+s.slice(i+a.length);
  changes.push(label);
}
replace1(
  '#ctl{left:14px;bottom:14px;width:336px;max-height:58vh;overflow:auto;z-index:40}',
  '#ctl{left:14px;bottom:calc(var(--tm-h,0px) + 14px);width:336px;max-height:min(58vh,calc(var(--vh100) - var(--topbar-h,64px) - var(--tm-h,0px) - 42px));overflow:auto;z-index:40}',
  'desktop controls clear measured Time Machine height'
);
replace1(
  '#labPanel{left:14px;bottom:calc(var(--ctl-h,340px) + 22px);',
  '#labPanel{left:14px;bottom:calc(var(--tm-h,0px) + var(--ctl-h,340px) + 22px);',
  'desktop lab catalogue follows the same dock stack'
);
writeFileSync(file,s);
console.log('visual dock fix applied:',changes.join(' · '));
