'use strict';
const fs = require('node:fs');

const src = fs.readFileSync('index.html', 'utf8');
const registry = fs.readFileSync('core/time/registry.mjs', 'utf8');
let pass = 0, fail = 0;
function ok(label, condition, detail = '') {
  if (condition) {
    pass++;
    console.log(`  PASS — ${label}`);
  } else {
    fail++;
    console.log(`  FAIL — ${label}${detail ? ` · ${detail}` : ''}`);
  }
}
function count(text, needle) {
  let n = 0, at = 0;
  while ((at = text.indexOf(needle, at)) >= 0) { n++; at += needle.length; }
  return n;
}
function assignmentCount(field) {
  return [...src.matchAll(new RegExp(`state\\.${field}\\s*=(?!=)`, 'g'))].length;
}

console.log('\n=== Unified Atlas Time Fabric browser contract ===\n');
ok('browser declares exactly one Time Fabric schema marker',
  count(src, "HCC_TIME_FABRIC_SCHEMA='hcc.time-fabric/1'") === 1,
  `found ${count(src, "HCC_TIME_FABRIC_SCHEMA='hcc.time-fabric/1'")}`);
ok('browser imports the pure AtlasTime kernel',
  src.includes("from './core/time/atlas-time.mjs'"));
ok('browser imports the typed time registry',
  src.includes("from './core/time/registry.mjs'"));
ok('browser creates exactly one authoritative AtlasTime service',
  count(src, 'createAtlasTime(') === 1,
  `found ${count(src, 'createAtlasTime(')}`);
ok('root runtime advances AtlasTime exactly once',
  count(src, 'atlasTime.advanceFrame(') === 1,
  `found ${count(src, 'atlasTime.advanceFrame(')}`);
ok('frame snapshot is a first-class runtime value',
  src.includes('atlasFrameTime'));

console.log('\n=== Single mutation gateway ===\n');
for (const field of ['epochDays','daysPerSec','cycYrPerSec','paused','timeDir']) {
  const n = assignmentCount(field);
  ok(`${field} has exactly one compatibility projection write`, n === 1, `found ${n}`);
}
ok('temporary legacy time-control adoption bridge is gone', !src.includes('adoptLegacyTimeControls'));
ok('no private global epoch increment remains', !/state\.epochDays\s*\+=/.test(src));

console.log('\n=== Typed-clock firewall ===\n');
ok('all seven time-domain kinds are declared',
  ['ABSOLUTE_EPOCH','DERIVED_PERIODIC_PHASE','PHYSICAL_LOCAL_TIME','PARAMETRIZATION_TIME','ITERATION_INDEX','SPATIAL_INDEX','RENDER_TIME']
    .every(kind => registry.includes(kind)));
ok('legacy universal seconds bridge has been removed',
  !src.includes('hccAtlasSharedTimeSeconds'));
ok('same-dimension time values are not auto-synchronized',
  !src.includes("decision:'synchronize',kind:'time:shared'"));
ok('runtime can report NO_EXCHANGE explicitly',
  src.includes('NO_EXCHANGE'));

console.log('\n=== Persistent-machine semantics ===\n');
ok('navigation/state layer declares four scientific/view scopes',
  ['GLOBAL_PHYSICS','SHARED_PHYSICS','LAB_LOCAL','VIEW_ONLY'].every(scope => src.includes(scope)));
ok('isolated compatibility entry exists', src.includes('isolateLabTime'));
ok('rejoin Unified operation exists', src.includes('rejoinUnifiedTime'));
ok('isolated epoch promotion is guarded by domain type',
  src.includes('promoteIsolatedEpoch') && src.includes('canPromoteToAtlasEpoch'));
ok('Time Fabric diagnostic surface exists', src.includes('HCC_TIME_DIAGNOSTICS'));

console.log(`\nUnified Atlas Time Fabric verifier: ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
