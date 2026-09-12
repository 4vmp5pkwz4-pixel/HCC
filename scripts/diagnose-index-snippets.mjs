import { readFileSync } from 'node:fs';
const s=readFileSync('index.html','utf8');
const needles=[
  'const PANEL_SCOPES',
  'function panelScopeOf',
  'id="panelDock"',
  'function nexusStructuralCalibration',
  'const NEXUS_VIEWS',
  'const NEXUS_CLUSTERS',
  'const S3_VIEW_NAMES',
  'function updateScales',
  'stackLabs',
  'function scaleSurvey'
];
for(const needle of needles){
  console.log(`\n===== ${needle} =====`);
  let from=0,count=0;
  while(count<5){
    const i=s.indexOf(needle,from); if(i<0) break;
    const line=s.slice(0,i).split('\n').length;
    console.log(`--- occurrence ${++count} line ${line} ---`);
    console.log(s.slice(Math.max(0,i-1000),Math.min(s.length,i+3000)));
    from=i+needle.length;
  }
  if(!count) console.log('NOT FOUND');
}
