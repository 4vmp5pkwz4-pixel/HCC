#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const src=fs.readFileSync('index.html','utf8');
let pass=0,fail=0;
const ok=(name,cond,detail='')=>{
  if(cond){pass++;console.log('PASS — '+name+(detail?' · '+detail:''));}
  else{fail++;console.error('FAIL — '+name+(detail?' · '+detail:''));}
};

ok('desktop Controls reserves the measured Time Machine height',
  src.includes('#ctl{left:14px;bottom:calc(var(--tm-h) + 14px);width:336px;max-height:58vh;overflow:auto;z-index:40}'),
  'the panel bottom is derived from --tm-h rather than a second hard-coded bar height');

ok('Time Machine publishes --tm-h from its rendered geometry',
  /const h=el\.hidden\?0:Math\.round\(el\.getBoundingClientRect\(\)\.height\);[\s\S]{0,180}setProperty\('--tm-h', h\+'px'\)/.test(src),
  'clearance follows the real bar height when content, locale or viewport changes');

ok('mobile Controls keeps its dedicated bottom-sheet rule',
  /#ctl\{\s*\n\s*left:8px;right:8px;width:auto;max-width:none;\s*\n\s*top:auto;bottom:calc\(8px \+ env\(safe-area-inset-bottom,0px\)\);max-height:34vh;/.test(src),
  'phone portrait/landscape layout already passed rendered audit and is not rewritten by the desktop fix');

ok('desktop clearance does not alter Time Machine width or scale semantics',
  /#timeMachine\{position:fixed;left:0;right:0;bottom:0;/.test(src)
  && /:root\{ --tm-h:0px \}/.test(src),
  'the bar remains full-width and only panel clearance changes');

console.log('\ntime-machine panel clearance: '+pass+' passed, '+fail+' failed');
process.exitCode=fail?1:0;
