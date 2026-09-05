#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path='scripts/validate.mjs';
let s=fs.readFileSync(path,'utf8');
const modern=`  const modules = [...html.matchAll(/<script type="module">([\\s\\S]*?)<\\/script>/g)];\n  const m = modules.length === 1 ? modules[0] : null;\n  check(modules.length === 1, 'exactly one inline ES module found');`;
if(s.includes("check(modules.length === 1, 'exactly one inline ES module found')")){
  console.log('validator compatibility already patched');
  process.exit(0);
}
const legacy=`  const m = html.match(/<script type="module">([\\s\\S]*?)<\\/script>\\s*<\\/body>/);\n  check(!!m, 'inline ES module found');`;
if(!s.includes(legacy)) throw new Error('legacy inline-module validator anchor missing');
s=s.replace(legacy,modern);
fs.writeFileSync(path,s);
console.log('validator now locates exactly one inline ES module independent of later classic runtime layers');
