import { readFileSync } from 'node:fs';
const lines=readFileSync('index.html','utf8').split('\n');
lines.forEach((line,i)=>{if((line.includes('atlasPanel')&&line.includes('scope'))||line.includes('data-panel="atlasPanel"')||line.includes('STACK_N=32'))console.log(`${i+1}: ${line}`)});
