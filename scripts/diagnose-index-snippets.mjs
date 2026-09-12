import { readFileSync } from 'node:fs';
const s=readFileSync('index.html','utf8');
const needles=[
  'panelScopeOf',
  'PANEL_SCOPE',
  'predictivePanel:',
  "predictivePanel'",
  'function labDeclIn',
  'labDeclIn=',
  'function labDeclNames',
  'LAB_DECL',
  'cluster:'
];
for(const needle of needles){
  console.log(`\n===== ${needle} =====`);
  let from=0,count=0;
  while(count<8){
    const i=s.indexOf(needle,from); if(i<0) break;
    const line=s.slice(0,i).split('\n').length;
    console.log(`--- occurrence ${++count} line ${line} ---`);
    console.log(s.slice(Math.max(0,i-900),Math.min(s.length,i+2600)));
    from=i+needle.length;
  }
  if(!count) console.log('NOT FOUND');
}
