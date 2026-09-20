#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const exec = (cmd,args,opts={}) => execFileSync(cmd,args,{encoding:'utf8',stdio:['ignore','pipe','pipe'],...opts});

try {
  exec('node',['scripts/extract-kernels.mjs','--check']);
  console.log('extracted kernel sync: ok');
} catch (e) {
  console.error(String(e.stderr || e.stdout || '').trim());
  exec('node',['scripts/extract-kernels.mjs']);
  const diff = exec('git',['diff','--','core/atlas/extracted.mjs']);
  console.error('\nGenerated repair diff:\n' + diff.slice(0,20000));
  console.error('\nCommit the regenerated core/atlas/extracted.mjs; do not weaken this guard.');
  process.exit(1);
}
