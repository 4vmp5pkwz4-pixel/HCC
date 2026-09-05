'use strict';

const fs = require('fs');

function replaceOnce(text, needle, replacement, label) {
  const count = text.split(needle).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one anchor, found ${count}`);
  return text.replace(needle, replacement);
}

function patchIndex() {
  const path = 'index.html';
  let s = fs.readFileSync(path, 'utf8');

  if (s.includes("id:'focusing'")) throw new Error('index.html already contains focusing preset');
  if (s.includes('multiviewPresets(){')) throw new Error('index.html already exposes multiviewPresets');

  const presetAnchor = " {id:'grsc', views:['bhr','bht','rpd','gw'], bus:['bhr.steps','rpd.sigma'],";
  const focusing = ` {id:'focusing', views:['nul','lens','gw','mimg'], bus:['nul.nullity','lens.alpha','gw.strain'],\n  t:{en:'Causal focusing · ray, bundle, tide, topology',ru:'Причинная фокусировка · луч, пучок, прилив, топология',de:'Kausale Fokussierung · Strahl, Bündel, Gezeit, Topologie'},\n  w:{en:'One immersive synoptic instrument follows a single question through four native 3-D spaces: what can make a null direction converge? The spinor tile establishes the null carrier, Schwarzschild lensing bends a congruence, a gravitational wave shears transverse separation, and the compact-S³ tile tests multiple paths. Shared screen orientation and simultaneous time make the comparison operational; no tile silently identifies local curvature, radiative shear or global topology.',\n     ru:'Один иммерсивный синоптический инструмент проводит один вопрос через четыре собственных 3D-пространства: что заставляет светоподобное направление сходиться? Спинор задаёт нулевой носитель, линза Шварцшильда изгибает конгруэнцию, гравитационная волна сдвигает поперечное разделение, а компактная S³ проверяет множественность путей. Общая ориентация экрана и одновременное время делают сравнение рабочим; локальная кривизна, волновой сдвиг и глобальная топология не отождествляются.',\n     de:'Ein immersives Synoptik-Instrument verfolgt eine Frage durch vier native 3-D-Räume: Was fokussiert eine Nullrichtung? Spinor, Schwarzschild-Linse, Gravitationswelle und kompakte S³-Pfade bleiben getrennte Verträge; gemeinsame Orientierung bedeutet keine physikalische Gleichsetzung.'}},\n`;
  s = replaceOnce(s, presetAnchor, focusing + presetAnchor, 'focusing preset insertion');

  const apiAnchor = `  multiview(){return {on:MV.on,n:MV.n,active:MV.active,sync:MV.sync,preset:MV.presetId,hudOwner:mvHudOwner(),\n    views:MV.views.slice(0,MV.n),rects:MV.rects.map(r=>({...r}))};},`;
  const apiReplacement = `${apiAnchor}\n  /* Static-safe descriptors: no THREE objects, only prepared comparison semantics. */\n  multiviewPresets(){return MV_PRESETS.map(p=>({id:p.id,views:p.views.slice(),bus:(p.bus||[]).slice(),\n    title:{...p.t},contract:{...p.w}}));},`;
  s = replaceOnce(s, apiAnchor, apiReplacement, 'HCC_API multiview descriptor insertion');

  if (!s.includes("const HCC_VERSION='4.148.1'")) throw new Error('release authority changed unexpectedly');
  if (!s.includes('astOn:false')) throw new Error('Solar GPU opt-in invariant missing');
  if (s.includes('causal-focusing-multiview-2026.09.04.17')) throw new Error('stale PR #195 build identity leaked into index.html');

  fs.writeFileSync(path, s);
}

function patchManifestBuilder() {
  const path = 'scripts/build-manifest.mjs';
  let s = fs.readFileSync(path, 'utf8');
  if (s.includes('multiview: HCC_API.multiviewPresets')) throw new Error('manifest walker already publishes multiview');

  const headAnchor = '  labs: HCC_API.labs.list(),\n';
  const headReplacement = `${headAnchor}  /* Prepared simultaneous views are measured from the live read-only API, not restated. */\n  multiview: HCC_API.multiviewPresets ? HCC_API.multiviewPresets().filter(p => p.id === 'focusing') : [],\n`;
  s = replaceOnce(s, headAnchor, headReplacement, 'manifest head multiview insertion');

  const manifestAnchor = '  bus: head.bus,\n';
  s = replaceOnce(s, manifestAnchor, `${manifestAnchor}  multiview: head.multiview,\n`, 'manifest output multiview insertion');
  fs.writeFileSync(path, s);
}

function patchAgent() {
  const path = 'agent.html';
  let s = fs.readFileSync(path, 'utf8');
  if (s.includes('HCC_API.multiviewPresets();') || s.includes('id="multi"')) throw new Error('agent.html already exposes multiview');

  const example = "HCC_API.report('anyon', { n: 12, braid: '121' });     // numbers + provenance, as JSON\n";
  s = replaceOnce(s, example, `${example}HCC_API.multiviewPresets();               // prepared simultaneous 3-D comparisons\n`, 'agent API example');

  const labsTable = `<h2 id="lh">Laboratories</h2>\n<div class="wrap"><table id="labs"><thead><tr>\n  <th>id</th><th>title</th><th>class</th><th>status</th><th>parameters</th><th>route</th>\n</tr></thead><tbody></tbody></table></div>\n`;
  const multiTable = `${labsTable}\n<h2 id="mh">Immersive representations</h2>\n<div class="wrap"><table id="multi"><thead><tr>\n  <th>id</th><th>title</th><th>simultaneous views</th><th>typed buses</th><th>contract</th>\n</tr></thead><tbody></tbody></table></div>\n`;
  s = replaceOnce(s, labsTable, multiTable, 'agent multiview table');

  const tail = `      lb.appendChild(tr);\n    }\n  })\n`;
  const render = `      lb.appendChild(tr);\n    }\n\n    el('mh').textContent = \`Immersive representations · \${(m.multiview || []).length}\`;\n    const mb = el('multi').tBodies[0];\n    for (const P of m.multiview || []) {\n      const tr = document.createElement('tr');\n      tr.innerHTML = \`<td class="n"><code>\${esc(P.id)}</code></td>\` +\n        \`<td>\${esc((P.title || {}).en)}</td>\` +\n        \`<td>\${(P.views || []).map(v => \`<code>\${esc(v)}</code>\`).join(' · ')}</td>\` +\n        \`<td>\${(P.bus || []).map(v => \`<code>\${esc(v)}</code>\`).join('<br>')}</td>\` +\n        \`<td>\${esc((P.contract || {}).en)}</td>\`;\n      mb.appendChild(tr);\n    }\n  })\n`;
  s = replaceOnce(s, tail, render, 'agent multiview renderer');
  fs.writeFileSync(path, s);
}

patchIndex();
patchManifestBuilder();
patchAgent();
console.log('Stage 2 semantic patch applied: focusing preset + read-only API + measured manifest + GPU-free agent catalogue.');
