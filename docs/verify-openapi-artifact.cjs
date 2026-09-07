#!/usr/bin/env node
/* ============================================================================
   THE MACHINE CONTRACT MUST NAME THE EXECUTABLE LAB MODULES — NOT EVERY UTILITY
   FILE THAT HAPPENS TO LIVE BESIDE THEM.

   The correspondence is intentionally three-way and independent:
   1. per-instrument OpenAPI schemas,
   2. manifest instruments_v2 measured from the registered computational core,
   3. executable defineLab modules on disk.

   A source-locked helper such as chronometry.source_locked.mjs exports pure kernels but
   is not itself a defineLab instrument. Treating every .mjs filename as an instrument
   produced a false nineteenth lab after Chronometry was added. The disk leg therefore
   reads module SOURCE and admits only modules that actually declare defineLab(...).
   This is stricter than a filename count: a renamed, dropped, unregistered or malformed
   executable lab still breaks the agreement, while a typed utility cannot impersonate one.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const O = JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'openapi.json'), 'utf8'));
const MAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'manifest.json'), 'utf8'));
const MCP = JSON.parse(fs.readFileSync(path.join(ROOT, '.well-known', 'mcp.json'), 'utf8'));

const schemas = Object.keys((O.components && O.components.schemas) || {});
const ioNames = [...new Set(schemas.filter(s => /\.(input|output)$/.test(s)).map(s => s.replace(/\.(input|output)$/, '')))].sort();
const fromManifest = ((MAN.instruments_v2) || []).map(i => i.id || i.name).sort();
const diskScan = (() => {
  try {
    const dir=path.join(ROOT,'core','labs');
    const all=fs.readdirSync(dir).filter(f=>f.endsWith('.mjs')).sort();
    const executable=all.filter(f=>{
      const src=fs.readFileSync(path.join(dir,f),'utf8');
      return /\bdefineLab\s*\(\s*\{/.test(src);
    }).map(f=>f.replace(/\.mjs$/,'')).sort();
    return {all,executable,utilities:all.filter(f=>!executable.includes(f.replace(/\.mjs$/,'')))};
  } catch (e) { return {all:[],executable:[],utilities:[],error:String(e)}; }
})();
const onDisk=diskScan.executable;
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const paths = Object.keys(O.paths || {});

console.log('\n=== 1-3. The document, and what it says it is ===\n');

ok('it is an OpenAPI 3.1 document with paths and schemas — a header alone would satisfy the arithmetic below by vacuum',
  O.openapi === '3.1.0' && paths.length >= 8 && schemas.length >= 20,
  `OpenAPI ${O.openapi} · ${paths.length} paths · ${schemas.length} schemas`);

ok('its version agrees with the core version the manifest publishes, so the contract offered to a machine cannot describe a different build from the one that answers it',
  O.info && O.info.version === MAN.core.version,
  `openapi says ${O.info && O.info.version} · manifest core says ${MAN.core.version}`);

ok('every path declares at least one method, and every method declares its responses — a path with no responses is a promise with no content',
  paths.every(p => { const ms = Object.keys(O.paths[p]).filter(k => ['get', 'post', 'put', 'delete', 'patch'].includes(k));
    return ms.length > 0 && ms.every(m => O.paths[p][m].responses && Object.keys(O.paths[p][m].responses).length > 0); }),
  `${paths.length} paths, every one with a method and declared responses`);

console.log('\n=== 4-6. The three-way executable-instrument correspondence ===\n');

ok('the published schemas and the manifest name the same instruments',
  same(ioNames, fromManifest) && ioNames.length >= 15,
  `${ioNames.length} instruments in schemas · ${fromManifest.length} in manifest`);

ok('the executable defineLab modules on disk agree with both independent machine contracts',
  same(ioNames, onDisk) && onDisk.length >= 15,
  `${onDisk.length} executable defineLab modules · ${diskScan.utilities.length} adjacent non-instrument module(s): ${diskScan.utilities.join(', ') || 'none'}`);

ok('every instrument has BOTH an input and an output schema',
  ioNames.every(n => schemas.includes(n + '.input') && schemas.includes(n + '.output')),
  `${ioNames.length} instruments, ${ioNames.length * 2} input/output schemas`);

console.log('\n=== 7-8. Generic paths and the second machine contract ===\n');

ok('most per-instrument schemas are lookup schemas rather than statically referenced by generic /labs/{id} paths, and every reference that exists resolves',
  (() => { const txt = JSON.stringify(O);
    const refs = [...new Set([...txt.matchAll(/"\$ref":"#\/components\/schemas\/([A-Za-z0-9_.]+)"/g)].map(m => m[1]))];
    const dangling = refs.filter(r => !schemas.includes(r));
    const unreferenced = schemas.filter(s => !refs.includes(s));
    return dangling.length === 0 && unreferenced.length > schemas.length / 2; })(),
  (() => { const txt = JSON.stringify(O);
    const refs = [...new Set([...txt.matchAll(/"\$ref":"#\/components\/schemas\/([A-Za-z0-9_.]+)"/g)].map(m => m[1]))];
    return `${refs.length} schema reference(s), none dangling · ${schemas.length - refs.length} schemas published for lookup`; })());

ok('the MCP contract is present and the manifest records both machine-facing contracts',
  Array.isArray(MCP.tools) && MCP.tools.length >= 5 && MAN.contracts
    && typeof MAN.contracts.openapi !== 'undefined' && typeof MAN.contracts.mcp !== 'undefined',
  `${MCP.tools.length} MCP tools · manifest records OpenAPI and MCP`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
