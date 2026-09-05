'use strict';

const fs = require('fs');

const INDEX = 'index.html';
const BUILD_MANIFEST = 'scripts/build-manifest.mjs';
const AGENT = 'agent.html';
const VERSION = 'version.json';

const OLD_VERSION = '4.148.1';
const NEW_VERSION = '4.149.0';
const OLD_BUILD = 'solar-gpu-safe-default-2026.09.05.1';
const NEW_BUILD = 'semantic-reconciliation-multiview-2026.09.05.2';

function mustReplace(text, before, after, label) {
  if (!text.includes(before)) throw new Error(`missing anchor: ${label}`);
  if (text.indexOf(before) !== text.lastIndexOf(before)) throw new Error(`ambiguous anchor: ${label}`);
  return text.replace(before, after);
}

let html = fs.readFileSync(INDEX, 'utf8');
if (html.includes("id:'focusing'")) throw new Error('focusing preset already present');
if (/multiviewPresets\s*\(\)\s*\{/.test(html)) throw new Error('multiviewPresets API already present');

const focusPreset = ` {id:'focusing', views:['nul','lens','gw','mimg'], bus:['nul.nullity','lens.alpha','gw.strain'],
  t:{en:'Causal focusing · ray, bundle, tide, topology',ru:'Причинная фокусировка · луч, пучок, прилив, топология',de:'Kausale Fokussierung · Strahl, Bündel, Gezeit, Topologie'},
  w:{en:'A prepared immersive comparison follows one question through four native 3-D spaces: what can make a null direction converge? The spinor tile establishes the null carrier, Schwarzschild lensing bends a congruence, a gravitational wave shears transverse separation, and the compact-S³ tile tests multiple paths. Shared orientation and simultaneous time make the comparison operational; no tile identifies local curvature, radiative shear or global topology as the same mechanism.',
     ru:'Подготовленное иммерсивное сравнение проводит один вопрос через четыре собственных 3D-пространства: что может заставить светоподобное направление сходиться? Спинор задаёт нулевой носитель, линза Шварцшильда изгибает конгруэнцию, гравитационная волна сдвигает поперечное разделение, а компактная S³ проверяет множественность путей. Общая ориентация и одновременное время делают сравнение рабочим; локальная кривизна, волновой сдвиг и глобальная топология не объявляются одним и тем же механизмом.',
     de:'Ein vorbereitetes immersives Vergleichsinstrument verfolgt eine Frage durch vier native 3-D-Räume: Was kann eine Nullrichtung fokussieren? Spinor, Schwarzschild-Linse, Gravitationswelle und kompakte S³-Pfade bleiben getrennte Verträge; gemeinsame Orientierung und simultane Zeit bedeuten keine physikalische Gleichsetzung.'}},
`;
html = mustReplace(html,
  " {id:'grsc', views:['bhr','bht','rpd','gw']",
  focusPreset + " {id:'grsc', views:['bhr','bht','rpd','gw']",
  'MV_PRESETS insertion');

/* The old draft put the discovery method in the later QA object. The manifest walker
   calls global HCC_API, whose public surface is the earlier siUnits/instruments/labs
   object. The method closes over MV_PRESETS and is only called after boot, so it can be
   declared here even though MV_PRESETS is initialized later in the module. */
const publicApiAnchor = "    siUnits(){ return {convertible:Object.keys(HCC_SI), refused:HCC_SI_REFUSED,\n      not_a_scale:HCC_NOT_A_SCALE, kinds:HCC_SI_KINDS, base:HCC_SI_BASE}; },\n    instruments:{\n";
const publicApiWithMultiview = "    siUnits(){ return {convertible:Object.keys(HCC_SI), refused:HCC_SI_REFUSED,\n      not_a_scale:HCC_NOT_A_SCALE, kinds:HCC_SI_KINDS, base:HCC_SI_BASE}; },\n    multiviewPresets(){return MV_PRESETS.map(p=>({id:p.id,views:p.views.slice(),bus:(p.bus||[]).slice(),\n      title:{...p.t},contract:{...p.w}}));},\n    instruments:{\n";
html = mustReplace(html, publicApiAnchor, publicApiWithMultiview,
  'public HCC_API Multiview discovery surface');

const versionCount = html.split(OLD_VERSION).length - 1;
const buildCount = html.split(OLD_BUILD).length - 1;
if (versionCount < 2) throw new Error(`expected multiple ${OLD_VERSION} release stamps, found ${versionCount}`);
if (buildCount < 2) throw new Error(`expected multiple ${OLD_BUILD} build stamps, found ${buildCount}`);
html = html.split(OLD_VERSION).join(NEW_VERSION).split(OLD_BUILD).join(NEW_BUILD);
fs.writeFileSync(INDEX, html);

let bm = fs.readFileSync(BUILD_MANIFEST, 'utf8');
if (bm.includes('multiview: head.multiview')) throw new Error('build-manifest multiview output already present');
bm = mustReplace(bm,
  "  labs: HCC_API.labs.list(),\n",
  "  labs: HCC_API.labs.list(),\n  multiview: HCC_API.multiviewPresets ? HCC_API.multiviewPresets().filter(p => p.id === 'focusing') : [],\n",
  'head multiview extraction');
bm = mustReplace(bm,
  "  worlds: head.worlds,\n  unmeasured: head.unmeasured,\n",
  "  worlds: head.worlds,\n  multiview: head.multiview,\n  unmeasured: head.unmeasured,\n",
  'manifest multiview output');
fs.writeFileSync(BUILD_MANIFEST, bm);

let agent = fs.readFileSync(AGENT, 'utf8');
if (agent.includes('id="multi"')) throw new Error('agent immersive table already present');
agent = mustReplace(agent,
  "HCC_API.report('anyon', { n: 12, braid: '121' });     // numbers + provenance, as JSON\nHCC_API.ui.unreachable();",
  "HCC_API.report('anyon', { n: 12, braid: '121' });     // numbers + provenance, as JSON\nHCC_API.multiviewPresets();               // prepared simultaneous 3-D comparisons\nHCC_API.ui.unreachable();",
  'agent API example');
const labsTable = '<h2 id="lh">Laboratories</h2>\n<div class="wrap"><table id="labs"><thead><tr>\n  <th>id</th><th>title</th><th>class</th><th>status</th><th>parameters</th><th>route</th>\n</tr></thead><tbody></tbody></table></div>\n\n<script>';
const labsAndMultiview = '<h2 id="lh">Laboratories</h2>\n<div class="wrap"><table id="labs"><thead><tr>\n  <th>id</th><th>title</th><th>class</th><th>status</th><th>parameters</th><th>route</th>\n</tr></thead><tbody></tbody></table></div>\n\n<h2 id="mh">Immersive representations</h2>\n<div class="wrap"><table id="multi"><thead><tr>\n  <th>id</th><th>title</th><th>simultaneous views</th><th>typed buses</th><th>contract</th>\n</tr></thead><tbody></tbody></table></div>\n\n<script>';
agent = mustReplace(agent, labsTable, labsAndMultiview, 'agent immersive table');
const agentRowsBefore = "      lb.appendChild(tr);\n    }\n  })\n";
const agentRowsAfter = "      lb.appendChild(tr);\n    }\n\n" +
  "    el('mh').textContent = `Immersive representations · ${(m.multiview || []).length}`;\n" +
  "    const mb = el('multi').tBodies[0];\n" +
  "    for (const P of m.multiview || []) {\n" +
  "      const tr = document.createElement('tr');\n" +
  "      tr.innerHTML = `<td class=\"n\"><code>${esc(P.id)}</code></td>` +\n" +
  "        `<td>${esc((P.title || {}).en)}</td>` +\n" +
  "        `<td>${(P.views || []).map(v => `<code>${esc(v)}</code>`).join(' · ')}</td>` +\n" +
  "        `<td>${(P.bus || []).map(v => `<code>${esc(v)}</code>`).join('<br>')}</td>` +\n" +
  "        `<td>${esc((P.contract || {}).en)}</td>`;\n" +
  "      mb.appendChild(tr);\n" +
  "    }\n" +
  "  })\n";
agent = mustReplace(agent, agentRowsBefore, agentRowsAfter, 'agent immersive rows');
fs.writeFileSync(AGENT, agent);

const version = JSON.parse(fs.readFileSync(VERSION, 'utf8'));
if (version.version !== OLD_VERSION || version.build !== OLD_BUILD) {
  throw new Error(`unexpected version.json identity: ${version.version} / ${version.build}`);
}
version.version = NEW_VERSION;
version.build = NEW_BUILD;
version.source = 'reconcile/4.149-semantic';
fs.writeFileSync(VERSION, JSON.stringify(version, null, 2) + '\n');

console.log(`Stage 2 patch prepared: v${NEW_VERSION} · ${NEW_BUILD}`);
