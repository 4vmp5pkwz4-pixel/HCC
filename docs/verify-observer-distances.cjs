#!/usr/bin/env node
/* Exercises the production API, bus and scene, rather than a second bus implementation.
   Hogg (1999), sections 6–7: angular and luminosity distances have different uses.
   https://ned.ipac.caltech.edu/level5/Hogg/Hogg6.html
   https://ned.ipac.caltech.edu/level5/Hogg/Hogg7.html */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log('PASS — ' + name); }
  catch (error) { failed++; console.error('FAIL — ' + name + ': ' + error.message); }
}
function section(start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a + start.length);
  assert(a >= 0 && b > a, 'production section exists: ' + start);
  return html.slice(a, b);
}
function spec(id) {
  const start = html.indexOf(" {id:'" + id + "', lab:'" + id + "',");
  assert(start >= 0, 'production spec exists: ' + id);
  let end = html.indexOf('\n {id:', start + 1);
  const arrayEnd = html.indexOf('\n];', start);
  if (end < 0 || arrayEnd < end) end = arrayEnd;
  return html.slice(start, end).trim().replace(/,\s*$/, '');
}
(async () => {
  const K = await import(pathToFileURL(path.join(root, 'core/atlas/extracted.mjs')));
  const context = vm.createContext({ ...K, console, TT: (...s) => s[0] });
  vm.runInContext(section('const HCC_API_SPECS=new Map();', '/* ══ THE QUANTITY BUS'), context);
  vm.runInContext(section('const HCC_LINKS=[];', '/* ══ THE CONFIGURATION SURFACE'), context);
  for (const id of ['cosmo', 'phot', 'elens']) {
    vm.runInContext(`{ const S = (${spec(id)}); hccApiRegister({...S,evaluate:S.ev}); }`, context);
  }
  const run = source => vm.runInContext(source, context);
  // Execute the actual declared observer routes, without unrelated upstream laboratories.
  const declarations = section('function hccBusDeclareLinks(){', '\n/*');
  for (const m of declarations.matchAll(/L\('(cosmo\.[^']+)','((?:elens|phot)\.[^']+)'\)/g)) {
    run(`hccBusLink(${JSON.stringify(m[1])},${JSON.stringify(m[2])});`);
  }
  check('lensing receives the angular-diameter distance of its source', () => {
    const r = run("hccBusEvaluate('elens',{})");
    const d = run("hccApiEvaluate('cosmo',{})");
    assert(Math.abs(r.inputs.D_source / d.angular_diameter_distance - 1) < 1e-13);
    assert.equal(r.provenance.find(p => p.input === 'D_source').from, 'cosmo.angular_diameter_distance');
  });
  check('photometry keeps the luminosity distance of its source', () => {
    const r = run("hccBusEvaluate('phot',{})");
    const d = run("hccApiEvaluate('cosmo',{})");
    assert(Math.abs(r.inputs.luminosity_distance / d.luminosity_distance - 1) < 1e-13);
  });
  check('the API exports the distinction between same-unit distances', () => {
    const d = run("hccApiDescribe('cosmo')");
    assert.equal(d.outputs.find(p => p.name === 'angular_diameter_distance').quantity_kind, 'angular_diameter_distance');
    assert.equal(d.outputs.find(p => p.name === 'luminosity_distance').quantity_kind, 'luminosity_distance');
    assert.equal(run("hccApiDescribe('elens')").inputs.find(p => p.name === 'D_source').quantity_kind, 'angular_diameter_distance');
  });
  check('same-unit but wrong-kind wiring is refused before an input is driven', () => {
    run('HCC_LINKS.length=0');
    assert.throws(() => run("hccBusLink('cosmo.luminosity_distance','elens.D_source')"), /quantity.*mismatch/i);
    assert.equal(run('HCC_LINKS.length'), 0);
  });
  check('an untyped source cannot bypass a typed destination', () => {
    run('HCC_LINKS.length=0');
    run("hccApiRegister({id:'untyped',inputs:[],outputs:[{name:'distance',unit:'Mpc'}],evaluate:()=>({distance:1000})})");
    assert.throws(() => run("hccBusLink('untyped.distance','elens.D_source')"), /quantity.*mismatch/i);
  });
  check('a declared unit conversion preserves the quantity kind', () => {
    run('HCC_LINKS.length=0');
    run("hccApiRegister({id:'nearby',inputs:[],outputs:[{name:'distance',unit:'kpc',quantity_kind:'angular_diameter_distance'}],evaluate:()=>({distance:2000000})})");
    run("hccBusLink('nearby.distance','elens.D_source')");
    assert.equal(run("hccBusEvaluate('elens',{})").inputs.D_source, 2000);
  });
  check('matching names do not propose a physically mismatched distance', () => {
    run("hccApiRegister({id:'lamp',inputs:[],outputs:[{name:'distance',unit:'Mpc',quantity_kind:'luminosity_distance'}],evaluate:()=>({distance:1})}); hccApiRegister({id:'angle',inputs:[{name:'distance',unit:'Mpc',quantity_kind:'angular_diameter_distance'}],outputs:[]})");
    assert(!run('hccBusCandidates()').some(p => p.from === 'lamp.distance' && p.to === 'angle.distance'));
  });
  check('the distance quadrature agrees with the independent Einstein–de Sitter solution', () => {
    for (const z of [0.1, 0.5, 1, 3]) {
      const exact = 2 * 299792.458 / 70 * (1 - 1 / Math.sqrt(1 + z));
      assert(Math.abs(K.cosmoComoving(z,70,1,0,0,1200) / exact - 1) < 1e-9);
    }
  });
  check('distance duality holds across the declared redshift range', () => {
    for (const z of [0.0001,0.1,1,3,6,1100]) {
      const r = run(`hccApiEvaluate('cosmo',{redshift:${z}})`);
      assert(Math.abs(r.luminosity_distance / r.angular_diameter_distance / (1+z)**2 - 1) < 1e-12);
    }
  });
  console.log(`\n${passed}/${passed+failed} observer-distance checks passed`);
  process.exitCode = failed ? 1 : 0;
})().catch(error => { console.error(error); process.exitCode = 1; });
