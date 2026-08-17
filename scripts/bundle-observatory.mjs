#!/usr/bin/env node
/* ── ONE FILE, NO NETWORK ─────────────────────────────────────────────────────
   civp.html loads three.js from a CDN and the computational core as ES modules, which is
   right for the served page and useless for a reader who has neither. This script emits a
   standalone copy: three.js, its five addons and the six core/civp modules concatenated as
   SCOPED IIFEs, so the whole observatory is one HTML file that opens from a memory stick.

   Scoped, not flattened, and that is the whole trick. three.module.min.js has hundreds of
   top-level one- and two-letter names; core/civp/ has C, add, sub, abs, div, rank, det.
   Concatenating them into one scope collides immediately, so each module is wrapped in a
   function that returns exactly its export list, and the next module destructures what it
   imported from that namespace. Nothing is renamed and nothing is rewritten — the modules
   are the same bytes the API serves, in a smaller scope.

   Needs a local copy of three: vendor/three, or HCC_VENDOR=/path/to/three-package.
   Usage:  node scripts/bundle-observatory.mjs [--out dist/civp-standalone.html]
   ========================================================================= */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const PKG = process.env.HCC_VENDOR || join(REPO, 'vendor', 'three');
if (!existsSync(join(PKG, 'build/three.module.min.js')))
  throw new Error(`no three.js at ${PKG} — set HCC_VENDOR or vendor it at vendor/three`);
const argOut = process.argv.indexOf('--out');
const OUT = resolve(REPO, argOut > 0 ? process.argv[argOut + 1] : 'dist/civp-standalone.html');

/* ── 1 · three.js itself, minified, exports turned into a returned namespace ── */
let three = readFileSync(join(PKG, 'build/three.module.min.js'), 'utf8');
const m = three.match(/export\{([^}]*)\};?\s*$/);
if (!m) throw new Error('no trailing export block in three.module.min.js');
const pairs = m[1].split(',').map(s => {
  const t = s.trim();
  const as = t.split(/\s+as\s+/);
  return as.length === 2 ? [as[1].trim(), as[0].trim()] : [t, t];
});
three = three.slice(0, m.index) + `\nreturn {${pairs.map(([k, v]) => `${k}:${v}`).join(',')}};\n`;
const THREE_NAMES = new Set(pairs.map(p => p[0]));

/* ── 2 · a generic ESM concatenator for the addon and core files ───────────── */
const modules = new Map();          /* absolute path -> { src, deps, exports, ns } */
let nsCount = 0;

function parse(absPath) {
  if (modules.has(absPath)) return modules.get(absPath);
  let src = readFileSync(absPath, 'utf8');
  const deps = [];
  /* import { a, b } from 'x';  |  import * as NS from 'x'; */
  src = src.replace(/^\s*import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/gm, (_, what, spec) => {
    const w = what.trim();
    if (w.startsWith('*')) {
      const alias = w.split(/\s+as\s+/)[1].trim();
      deps.push({ kind: 'ns', alias, spec });
    } else {
      const names = w.replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean);
      deps.push({ kind: 'named', names, spec });
    }
    return '';
  });
  /* collect exports and strip the keyword */
  const exports = new Set();
  src = src.replace(/^\s*export\s*\{([^}]*)\}\s*;?\s*$/gm, (_, list) => {
    for (const n of list.split(',').map(s => s.trim()).filter(Boolean)) {
      const as = n.split(/\s+as\s+/);
      exports.add((as[1] || as[0]).trim());
    }
    return '';
  });
  src = src.replace(/^export\s+(const|let|var|function|class|async function)\s+([A-Za-z_$][\w$]*)/gm,
    (_, kw, name) => { exports.add(name); return `${kw} ${name}`; });

  const rec = { path: absPath, src, deps, exports: [...exports], ns: `__m${nsCount++}` };
  modules.set(absPath, rec);
  for (const d of rec.deps) if (d.spec !== 'three') parse(resolve(dirname(absPath), d.spec));
  return rec;
}

function emit(rec, done, out) {
  if (done.has(rec.path)) return;
  done.add(rec.path);
  for (const d of rec.deps) if (d.spec !== 'three') emit(modules.get(resolve(dirname(rec.path), d.spec)), done, out);
  const head = rec.deps.map(d => {
    if (d.spec === 'three') {
      const names = d.kind === 'ns' ? null : d.names;
      return d.kind === 'ns' ? `const ${d.alias} = THREE;`
        : `const { ${names.join(', ')} } = THREE;`;
    }
    const target = modules.get(resolve(dirname(rec.path), d.spec)).ns;
    return d.kind === 'ns' ? `const ${d.alias} = ${target};`
      : `const { ${d.names.join(', ')} } = ${target};`;
  }).join('\n');
  out.push(`const ${rec.ns} = (function(){\n${head}\n${rec.src}\nreturn { ${rec.exports.join(', ')} };\n})();`);
}

const ADDONS = [
  'examples/jsm/controls/OrbitControls.js',
  'examples/jsm/renderers/CSS2DRenderer.js',
  'examples/jsm/postprocessing/EffectComposer.js',
  'examples/jsm/postprocessing/RenderPass.js',
  'examples/jsm/postprocessing/UnrealBloomPass.js'
].map(p => join(PKG, p));
const CORE = ['cp1', 'embadon', 'jones', 'selector', 'carrier', 'closure']
  .map(n => join(REPO, `core/civp/${n}.mjs`));

for (const f of [...ADDONS, ...CORE]) parse(f);

const out = [], done = new Set();
for (const f of [...ADDONS, ...CORE]) emit(modules.get(f), done, out);

/* the names the app expects at top level */
const alias = [];
for (const f of ADDONS) { const r = modules.get(f);
  alias.push(`const { ${r.exports.join(', ')} } = ${r.ns};`); }
const NSMAP = { cp1: 'CP1', embadon: 'EMB', jones: 'JON', selector: 'SEL', carrier: 'CAR', closure: 'CLO' };
for (const f of CORE) { const r = modules.get(f);
  const key = f.match(/civp\/(\w+)\.mjs$/)[1];
  alias.push(`const ${NSMAP[key]} = ${r.ns};`); }

/* ── 3 · the page ─────────────────────────────────────────────────────────── */
let html = readFileSync(join(REPO, 'civp.html'), 'utf8');
/* drop the import map and the app's own import statements */
html = html.replace(/<script type="importmap">[\s\S]*?<\/script>\s*/, '');
let app = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
app = app.replace(/^\s*import[\s\S]*?from\s+['"][^'"]+['"];\s*$/gm, '');

const bundle = `/* three.js r160 (MIT) and its addons, concatenated for offline use */
const THREE = (function(){\n${three}\n})();
${out.join('\n')}
${alias.join('\n')}
${app}`;

html = html.replace(/<script type="module">[\s\S]*?<\/script>/, `<script type="module">\n${bundle}\n</script>`);
/* the standalone copy has no sibling atlas to link to */
html = html.replace(/<a class="chip" href="\.\/index\.html"[^>]*>Atlas<\/a>/, '');
html = html.replace(/<div id="boot">[\s\S]*?<\/div>/, '');
html = html.replace(/document\.getElementById\('boot'\)\.remove\(\);/, '');

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html);
console.log('bundled', (html.length / 1048576).toFixed(2), 'MB',
  '· modules', modules.size, '· three exports', THREE_NAMES.size);
