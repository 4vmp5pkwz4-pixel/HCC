#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path='index.html';
let src=fs.readFileSync(path,'utf8');
const bad=String.raw`String(word||'').trim().split(/[\\s,]+/)`;
const good=String.raw`String(word||'').trim().split(/[\s,]+/)`;
if(src.includes(good)&&!src.includes(bad)){console.log('Fibonacci braid parser already normalized');process.exit(0);}
const count=src.split(bad).length-1;
if(count!==1)throw new Error(`expected exactly one escaped braid parser, found ${count}`);
src=src.replace(bad,good);
fs.writeFileSync(path,src);
console.log('normalized Fibonacci braid parser to whitespace/comma tokenization');
