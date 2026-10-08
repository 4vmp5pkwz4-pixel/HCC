#!/usr/bin/env node
const {spawnSync}=require('node:child_process');
const {resolve}=require('node:path');
const r=spawnSync(process.execPath,[resolve(__dirname,'../scripts/apply-s3-cap-visual.mjs'),'--check'],{encoding:'utf8'});
process.stdout.write(r.stdout||'');
process.stderr.write(r.stderr||'');
if(r.status!==0)process.exitCode=1;
