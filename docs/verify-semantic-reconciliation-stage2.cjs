'use strict';

const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const agent = fs.readFileSync('agent.html', 'utf8');
const builder = fs.readFileSync('scripts/build-manifest.mjs', 'utf8');
let manifest = null;
try { manifest = JSON.parse(fs.readFileSync('api/manifest.json', 'utf8')); } catch {}

let failed = 0;
function check(ok, label) {
  if (ok) console.log(`PASS — ${label}`);
  else { console.log(`FAIL — ${label}`); failed++; }
}

console.log('=== Semantic reconciliation · Stage 2 · Multiview machine contract ===');

check(
  html.includes("id:'focusing'") &&
  ['nul','lens','gw','mimg'].every(v => html.includes(`'${v}'`)) &&
  html.includes("'nul.nullity'") && html.includes("'lens.alpha'") && html.includes("'gw.strain'"),
  'causal-focusing exists as a prepared four-view Multiview preset with typed buses'
);

check(
  html.includes('multiviewPresets(){') &&
  html.includes('title:{...p.t}') && html.includes('contract:{...p.w}'),
  'HCC_API exposes prepared Multiview descriptors read-only and without THREE objects'
);

check(
  builder.includes('multiview: HCC_API.multiviewPresets') &&
  builder.includes('multiview: head.multiview'),
  'the headless manifest walker publishes the runtime Multiview contract instead of hand-copying it'
);

check(
  agent.includes('HCC_API.multiviewPresets();') &&
  agent.includes('id="multi"') &&
  agent.includes('m.multiview'),
  'agent.html makes immersive representations discoverable without WebGL'
);

const focusing = manifest && Array.isArray(manifest.multiview)
  ? manifest.multiview.find(p => p && p.id === 'focusing') : null;
check(
  !!focusing &&
  ['nul','lens','gw','mimg'].every(v => focusing.views?.includes(v)) &&
  ['nul.nullity','lens.alpha','gw.strain'].every(v => focusing.bus?.includes(v)) &&
  ['en','ru','de'].every(k => focusing.contract?.[k]),
  'api/manifest.json contains the focusing preset, typed buses and trilingual epistemic contract'
);

check(
  html.includes("const HCC_VERSION='4.148.1'") && html.includes('astOn:false') &&
  !html.includes('causal-focusing-multiview-2026.09.04.17'),
  'Stage 2 preserves the v4.148.1 release authority and Solar GPU opt-in default'
);

if (failed) {
  console.error(`\n${failed} Stage-2 reconciliation contract(s) missing.`);
  process.exit(1);
}
console.log('\n✔ Stage 2 Multiview machine contract complete');
