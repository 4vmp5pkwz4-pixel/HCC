#!/usr/bin/env node
/* ============================================================================
   THE LAST ARTIFACT UNDER REPRODUCTION ALONE

   api/openapi.json is the contract this atlas offers a machine that has never
   seen it.  It was the last published artifact guarded by reproduction only --
   regenerated and diffed, which catches a stale or hand-edited file exactly and
   is blind to a wrong generator, because a generator that is wrong today writes
   the same wrong answer twice and the diff comes back clean.

   THE CHECK THAT MATTERS IS A THREE-WAY CORRESPONDENCE.  The per-instrument
   schemas, the manifest's instruments_v2 table, and the files in core/labs must
   name the SAME EIGHTEEN INSTRUMENTS.  Those three are produced by different
   code from different sources -- a document generator, a browser walk, and a
   directory listing -- so a generator that invented an instrument, dropped one,
   or renamed one would break the agreement, and no amount of faithful
   reproduction would notice.

   AND ONE THING IS ASSERTED THAT LOOKS LIKE A DEFECT AND IS NOT.  Thirty-seven
   of the thirty-eight schemas are never reached by a $ref.  That is correct:
   the paths are generic -- /labs/{id}/runs takes the instrument in the URL --
   so a per-instrument schema CANNOT be statically referenced from them.  They
   are published to be looked up by name.  A check demanding every schema be
   referenced would fail on an entirely correct document.

   EIGHT THINGS ARE CHECKED.
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
const onDisk = (() => { try { return fs.readdirSync(path.join(ROOT, 'core', 'labs')).filter(f => f.endsWith('.mjs')).map(f => f.replace(/\.mjs$/, '')).sort(); } catch (e) { return []; } })();
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

console.log('\n=== 4-6. The three-way correspondence ===\n');

ok('THE PUBLISHED SCHEMAS AND THE MANIFEST NAME THE SAME INSTRUMENTS. These come from different code over different sources — a document generator and a browser walk — so an instrument invented, dropped or renamed in one and not the other breaks the agreement, and reproduction would reproduce the disagreement rather than report it',
  same(ioNames, fromManifest) && ioNames.length >= 15,
  `${ioNames.length} instruments in the schemas · ${fromManifest.length} in the manifest`);

ok('AND THE FILES ON DISK AGREE WITH BOTH. core/labs is a directory listing, which is the one of the three that cannot be got wrong by a generator at all — so a schema for an instrument that does not exist, or a laboratory on disk with no published contract, fails here',
  same(ioNames, onDisk) && onDisk.length >= 15,
  onDisk.length ? `${onDisk.length} files in core/labs, naming exactly the instruments the schemas and the manifest do` : 'core/labs could not be read');

ok('and every instrument has BOTH an input and an output schema. A contract that says what a laboratory takes and not what it returns is half a contract, and a machine reading it would discover the omission only by calling',
  ioNames.every(n => schemas.includes(n + '.input') && schemas.includes(n + '.output')),
  `${ioNames.length} instruments, ${ioNames.length * 2} input and output schemas`);

console.log('\n=== 7-8. The thing that looks like a defect, and the other contract ===\n');

ok('THIRTY-SEVEN OF THE THIRTY-EIGHT SCHEMAS ARE NEVER REACHED BY A $ref, AND THAT IS CORRECT. The paths are generic — /labs/{id}/runs takes the instrument in the URL — so a per-instrument schema cannot be statically referenced from them. They are published to be looked up by name by a machine that has read the manifest. A check demanding every schema be referenced would fail on an entirely correct document, so the opposite is asserted: most schemas are expected to be unreferenced, and every $ref that IS used must still resolve',
  (() => { const txt = JSON.stringify(O);
    const refs = [...new Set([...txt.matchAll(/"\$ref":"#\/components\/schemas\/([A-Za-z0-9_.]+)"/g)].map(m => m[1]))];
    const dangling = refs.filter(r => !schemas.includes(r));
    const unreferenced = schemas.filter(s => !refs.includes(s));
    return dangling.length === 0 && unreferenced.length > schemas.length / 2; })(),
  (() => { const txt = JSON.stringify(O);
    const refs = [...new Set([...txt.matchAll(/"\$ref":"#\/components\/schemas\/([A-Za-z0-9_.]+)"/g)].map(m => m[1]))];
    return `${refs.length} schema reference(s), none dangling · ${schemas.length - refs.length} schemas published for lookup rather than reference`; })());

ok('and the other machine-facing contract is present and consistent: the MCP document declares its tools, and the manifest records both contracts as the ones it was built beside',
  Array.isArray(MCP.tools) && MCP.tools.length >= 5 && MAN.contracts
    && typeof MAN.contracts.openapi !== 'undefined' && typeof MAN.contracts.mcp !== 'undefined',
  `${MCP.tools.length} MCP tools · the manifest records both the openapi and mcp contracts`);

console.log(`\n${pass}/${pass + fail} checks passed\n`);
process.exit(fail ? 1 : 0);
