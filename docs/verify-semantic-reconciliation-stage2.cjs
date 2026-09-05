'use strict';

const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const buildManifest = fs.readFileSync('scripts/build-manifest.mjs', 'utf8');
const agent = fs.readFileSync('agent.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('api/manifest.json', 'utf8'));
let failures = 0;

function check(condition, message) {
  if (condition) console.log(`PASS — ${message}`);
  else { console.error(`FAIL — ${message}`); failures++; }
}

console.log('=== Semantic reconciliation · Stage 2 ===');

const focus = Array.isArray(manifest.multiview)
  ? manifest.multiview.find(p => p && p.id === 'focusing')
  : null;
const hasLang = obj => obj && ['en', 'ru', 'de'].every(k => typeof obj[k] === 'string' && obj[k].trim());

check(
  !!focus
    && ['nul', 'lens', 'gw', 'mimg'].every(id => focus.views?.includes(id))
    && ['nul.nullity', 'lens.alpha', 'gw.strain'].every(id => focus.bus?.includes(id))
    && hasLang(focus.title)
    && hasLang(focus.contract),
  'manifest publishes the causal-focusing Multiview preset with four views, typed buses and a trilingual epistemic contract'
);

check(
  /multiviewPresets\s*\(\)\s*\{/.test(html)
    && html.includes('MV_PRESETS.map')
    && html.includes('views:p.views.slice()')
    && html.includes("bus:(p.bus||[]).slice()")
    && html.includes('title:{...p.t}')
    && html.includes('contract:{...p.w}'),
  'HCC_API exposes Multiview presets as read-only plain-data descriptors rather than THREE-backed runtime objects'
);

check(
  /multiview\s*:/.test(buildManifest)
    && buildManifest.includes('HCC_API.multiviewPresets')
    && buildManifest.includes("p.id === 'focusing'"),
  'the manifest generator publishes the prepared focusing comparison from the runtime API instead of hand-maintaining generated JSON'
);

check(
  agent.includes('HCC_API.multiviewPresets();')
    && agent.includes('id="multi"')
    && agent.includes('Immersive representations')
    && agent.includes('m.multiview || []'),
  'agent.html documents and renders prepared immersive representations from api/manifest.json'
);

if (failures) {
  console.error(`\n${failures} Stage-2 reconciliation contract(s) missing.`);
  process.exit(1);
}
console.log('\nPASS — all Stage-2 reconciliation contracts are present.');
