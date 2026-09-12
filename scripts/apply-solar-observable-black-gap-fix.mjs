import fs from 'node:fs';

// One-shot TDD repair: the value below is in Gly, so 26 Mly must be 0.026 Gly.
const path='index.html';
let src=fs.readFileSync(path,'utf8');
const before='  solarObsOutGly:26,';
const after='  solarObsOutGly:0.026,';
const count=src.split(before).length-1;
if(count!==1){
  throw new Error(`Expected exactly one ${JSON.stringify(before)} occurrence, found ${count}`);
}
src=src.replace(before,after);
fs.writeFileSync(path,src);
console.log('Solar→Observable outward seam corrected: 26 Gly → 0.026 Gly (26 Mly).');
