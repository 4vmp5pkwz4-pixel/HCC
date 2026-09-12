import { readFileSync } from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const needle of ["bhr',b:'qso","qso',b:'bhr","function nexusStructuralCalibration"]){
 console.log(`\n===== ${needle} =====`);let from=0,n=0;while(n<10){const i=s.indexOf(needle,from);if(i<0)break;const line=s.slice(0,i).split('\n').length;console.log(`--- ${++n} line ${line} ---`);console.log(s.slice(Math.max(0,i-1000),Math.min(s.length,i+2600)));from=i+needle.length;}if(!n)console.log('NOT FOUND');
}
