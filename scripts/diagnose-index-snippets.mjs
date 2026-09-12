import { readFileSync } from 'node:fs';
const lines=readFileSync('index.html','utf8').split('\n');
lines.forEach((line,i)=>{if(line.includes('bhr')&&line.includes('qso'))console.log(`${i+1}: ${line}`)});
