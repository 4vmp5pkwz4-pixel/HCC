import { readFileSync } from 'node:fs';
const s=readFileSync('index.html','utf8');
const needles=[
  'predictivePanel',
  'spectral embedding is finite/deterministic',
  'Panel deck has one recall control',
  'covers every pre-existing S³ laboratory exactly once',
  'one connected typed universe with no isolated node',
  'all twenty-five axes can be seen AT ONCE',
  'R@5',
  'magnetic field',
  'momentum'
];
for(const needle of needles){
  console.log(`\n===== ${needle} =====`);
  let from=0,count=0;
  while(count<8){
    const i=s.indexOf(needle,from); if(i<0) break;
    const line=s.slice(0,i).split('\n').length;
    console.log(`--- occurrence ${++count} line ${line} ---`);
    console.log(s.slice(Math.max(0,i-1200),Math.min(s.length,i+2200)));
    from=i+needle.length;
  }
  if(!count) console.log('NOT FOUND');
}
