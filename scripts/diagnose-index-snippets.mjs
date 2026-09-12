import { readFileSync } from 'node:fs';
const s=readFileSync('index.html','utf8');
const needles=[
  'covers every pre-existing S³ laboratory exactly once',
  'one connected typed universe with no isolated node',
  'spectral embedding is finite/deterministic'
];
for(const needle of needles){
  console.log(`\n===== ${needle} =====`);
  const i=s.indexOf(needle);
  if(i<0){console.log('NOT FOUND');continue;}
  const line=s.slice(0,i).split('\n').length;
  console.log(`--- line ${line} ---`);
  console.log(s.slice(Math.max(0,i-2600),Math.min(s.length,i+4200)));
}
