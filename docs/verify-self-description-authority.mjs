#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { CORE } from '../core/index.mjs';
const read=p=>readFileSync(p,'utf8'), json=p=>JSON.parse(read(p));
let pass=0,fail=0;
const ok=(n,c,d='')=>{if(c){pass++;console.log('  PASS — '+n+(d?' :: '+d:''));}else{fail++;console.log('  FAIL — '+n+(d?' :: '+d:''));}};
const readme=read('README.md'), llms=read('llms.txt'), server=read('server/server.mjs');
const manifest=json('api/manifest.json'), release=json('version.json');
const top=readme.match(/the atlas — \*\*(\d+)\*\* laboratories across (\d+) worlds, \*\*(\d+)\*\* typed instruments/);
const want=[manifest.counts.laboratories,manifest.counts.worlds,manifest.counts.instruments];
ok('README catalogue counts agree with api/manifest.json',top&&top.slice(1).map(Number).every((n,i)=>n===want[i]),'want '+want.join('/'));
ok('README has no historical release boundary presented as live census',!/\d+ laboratories across \d+ worlds[\s\S]{0,100}v\d+\.\d+\.\d+ release boundary/i.test(readme));
const lm=llms.match(/\b(\d+)\s+laboratories\b/);
ok('llms.txt carries no stale laboratory authority',!lm||Number(lm[1])===manifest.counts.laboratories,lm?lm[1]:'structural wording');
ok('MCP prose carries no frozen laboratory count',!/over\s+\d+\s+laboratories/i.test(server));
ok('MCP measurement prose carries no frozen walk counts',!/SENSITIVITY:\s*\d+ inputs|REACH:\s*\d+ composed chains/i.test(server));
ok('Time Machine verifier carries no frozen laboratory census',!/all\s+\d+\s+laborator(?:y|ies)|\d+\s+laborator(?:y|ies)/i.test(read('docs/verify-the-time-machine.cjs')));
const payload=CORE.openProblems(); const probs=payload.problems||payload.open_problems||[];
const find=id=>probs.find(p=>p.lab_id===id)||{};
const liv=find('atlas.liveness_is_measured_on_an_older_release').problem||'';
ok('liveness problem is structural, not version-frozen',liv.includes('measured_on_this_release')&&!/\b\d+\.\d+\.\d+\b/.test(liv)&&!/others carry the current one/i.test(liv));
const cam=find('atlas.a_frame_is_configured_by_whoever_touched_it_last').problem||'';
ok('camera problem does not freeze a call-site count',cam.includes('setControlDistanceLimits')&&!/\b\d+\s+call sites\b/i.test(cam));
const desi=find('desi.covariance').problem||'';
ok('DESI problem separates runtime gap from off-atlas pilots',!existsSync('vde_likelihood')||(/inverse-covariance kernel/i.test(desi)&&/vde_likelihood\//.test(desi)&&/not an atlas covariance layer/i.test(desi)&&!/no DESI covariance or evidence computation exists in this repository/i.test(desi)));
for(const kind of ['sensitivity','transfers','reach','liveness']){
  const a=json('api/'+kind+'.json'); const fresh=a.version===release.version&&a.build===release.build;
  ok(kind+' freshness stamp is derived',a.measured_release?.version===a.version&&a.measured_release?.build===a.build&&a.current_release?.version===release.version&&a.current_release?.build===release.build&&a.measured_on_this_release===fresh&&a.stale===!fresh&&a.release_lag?.measured_release===a.version&&a.release_lag?.current_release===release.version);
}
const measured=CORE.measurements();
for(const kind of ['sensitivity','transfers','reach','liveness']){
  const a=json('api/'+kind+'.json'), s=measured.artifacts[kind], fresh=a.version===release.version&&a.build===release.build;
  ok('CORE '+kind+' freshness agrees with artifact',s?.version===a.version&&s?.build===a.build&&s?.measured_release?.version===a.version&&s?.measured_release?.build===a.build&&s?.current_release?.version===release.version&&s?.current_release?.build===release.build&&s?.measured_on_this_release===fresh&&s?.stale===!fresh);
}
ok('CORE reports current atlas build',measured.atlas_release===release.version&&measured.atlas_build===release.build);
console.log('\n  '+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
