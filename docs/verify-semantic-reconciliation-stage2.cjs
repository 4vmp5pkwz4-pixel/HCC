'use strict';

const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const agent = fs.readFileSync('agent.html', 'utf8');
const builder = fs.readFileSync('scripts/build-manifest.mjs', 'utf8');
let manifest = null;
try { manifest = JSON.parse(fs.readFileSync('api/manifest.json', 'utf8')); } catch {}
let failures = 0;

function check(condition, message) {
  if (condition) console.log(`PASS — ${message}`);
  else { console.error(`FAIL — ${message}`); failures++; }
}

console.log('=== Semantic reconciliation · Stage 2 ===');

check(
  html.includes("id:'focusing'")
    && html.includes("views:['nul','lens','gw','mimg']")
    && html.includes("bus:['nul.nullity','lens.alpha','gw.strain']"),
  'causal-focusing is a prepared four-view Multiview preset with typed buses'
);

check(
  html.includes('multiviewPresets(){return MV_PRESETS.map')
    && html.includes('title:{...p.t},contract:{...p.w}'),
  'the live API exposes static-safe read-only Multiview preset descriptors'
);

check(
  builder.includes('multiview: HCC_API.multiviewPresets')
    && builder.includes('multiview: head.multiview'),
  'the measured manifest generator publishes Multiview from the live API rather than hand-writing JSON'
);

const focus = manifest && Array.isArray(manifest.multiview)
  ? manifest.multiview.find(p => p.id === 'focusing') : null;
check(
  !!focus
    && ['nul','lens','gw','mimg'].every(v => focus.views.includes(v))
    && focus.contract && focus.contract.en && focus.contract.ru && focus.contract.de,
  'api/manifest.json contains causal-focusing with four views and a trilingual epistemic contract'
);

check(
  agent.includes('HCC_API.multiviewPresets()')
    && agent.includes('id="multi"')
    && agent.includes('Immersive representations'),
  'the no-GPU agent catalogue exposes prepared immersive representations'
);

check(
  html.includes("const HCC_VERSION='4.148.1'")
    && !html.includes("const HCC_BUILD='causal-focusing-multiview-2026.09.04.17'"),
  'Stage 2 does not roll release identity back to the historical PR #195 build'
);

if (failures) {
  console.error(`\n${failures} Stage-2 reconciliation contract(s) missing.`);
  process.exit(1);
}
console.log('\nPASS — all Stage-2 reconciliation contracts are present.');
