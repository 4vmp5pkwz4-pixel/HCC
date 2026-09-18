#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const path='index.html';
let s=readFileSync(path,'utf8');
const before='#ctl{left:14px;bottom:14px;width:336px;max-height:58vh;overflow:auto;z-index:40}';
const after='#ctl{left:14px;bottom:calc(var(--tm-h) + 14px);width:336px;max-height:58vh;overflow:auto;z-index:40}';
if(!s.includes(before)) throw new Error('desktop #ctl anchor missing or already changed');
if((s.match(/#ctl\{left:14px;/g)||[]).length!==1) throw new Error('desktop #ctl authority is ambiguous');
s=s.replace(before,after);
writeFileSync(path,s);
console.log('Desktop Controls now reserves measured Time Machine height.');
