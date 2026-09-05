#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const http=require('http');
const assert=require('assert');
const {chromium}=require('playwright');

const ROOT=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
function serve(){return new Promise(resolve=>{const server=http.createServer((req,res)=>{try{let p=decodeURIComponent(new URL(req.url,'http://x').pathname);if(p==='/'||p==='')p='/index.html';const f=path.resolve(ROOT,'.'+p);if(!f.startsWith(ROOT+path.sep))throw new Error('forbidden');const st=fs.statSync(f);const file=st.isDirectory()?path.join(f,'index.html'):f;res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});fs.createReadStream(file).pipe(res);}catch(e){res.writeHead(404);res.end('not found');}});server.listen(0,'127.0.0.1',()=>resolve(server));});}

(async()=>{
 let browser,server;const pageErrors=[];let pass=0;
 const ok=(label,cond)=>{assert.ok(cond,label);pass++;console.log(`PASS — ${label}`);};
 try{
  server=await serve();const port=server.address().port;
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const page=await context.newPage();
  page.on('pageerror',e=>pageErrors.push(String(e)));
  await page.goto(`http://127.0.0.1:${port}/?render=0`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#hccFpTrigger').waitFor({state:'visible',timeout:15000});
  ok('mobile page exposes exactly one First-Principles trigger',await page.locator('#hccFpTrigger').count()===1);

  const integrated=await page.evaluate(async()=>{
    if(globalThis.HCC_API&&HCC_API.ready)await HCC_API.ready({timeout:10000});
    const A=globalThis.HCC_ATLAS_INTEGRATION;
    if(!A)throw new Error('HCC_ATLAS_INTEGRATION missing');
    const g=A.graph();
    const snap0=A.snapshot('anyzoo');
    const braid=A.operators.fibonacci.braid('1 2 -1 2');
    A.setTime(12345.678,'browser-gate');
    const snap1=A.snapshot('anyzoo');
    const converted=A.transfer('anyzoo.topological_entanglement_entropy','infolab.entropy_nats',1.25,{converter:v=>v,provenance:'browser-gate-explicit-converter'});
    let refused=null;
    try{A.transfer('anyzoo.topological_entanglement_entropy','time:shared',1.25);}catch(e){refused=e&&e.code||e&&e.message||String(e);}
    return {
      schema:A.schema,
      labs:g.nodes.filter(n=>n.type==='laboratory').length,
      instruments:g.nodes.filter(n=>n.type==='instrument').length,
      worlds:g.nodes.filter(n=>n.type==='world').length,
      multiview:g.nodes.filter(n=>n.type==='multiview').length,
      measured:g.measured_bus_links,
      source:g.source,
      snapLinks:snap0.measured_bus_links,
      time:snap1.time_seconds,
      braidLength:braid.length,
      converted:converted.converted,
      refused
    };
  });
  ok('integration gateway is live in the browser',integrated.schema==='hcc.atlas-integration/1');
  ok('unified graph contains the complete live laboratory catalogue',integrated.labs>=113);
  ok('unified graph discovers the live typed instruments',integrated.instruments>=18);
  ok('unified graph contains all seven Atlas worlds',integrated.worlds>=7);
  ok('unified graph contains prepared multiview comparisons',integrated.multiview>=1);
  ok('measured manifest links are absorbed by the same graph',integrated.measured>=50&&integrated.snapLinks===integrated.measured);
  ok('integration graph records its manifest source identity',!!integrated.source&&integrated.source.source_manifest_version==='4.150.0');
  ok('shared time frame propagates through one revisioned gateway',Math.abs(integrated.time-12345.678)<1e-9);
  ok('Fibonacci braid operator executes through the shared gateway',integrated.braidLength===4);
  ok('explicit converter path produces a provenance-bearing typed transfer',integrated.converted===true);
  ok('incompatible or semantically undeclared transfer fails closed',!!integrated.refused);

  await page.locator('#hccFpTrigger').click();
  await page.locator('#hccFpLens').waitFor({state:'visible'});
  ok('Lens opens lazily as one dialog',await page.locator('#hccFpLens').count()===1);
  ok('Formula view contains exact and evaluated scientific slots',(await page.locator('#hccFpLens .fpExact').count())>0&&(await page.locator('#hccFpLens .fpEvaluated').count())>0);

  await page.getByRole('button',{name:'Dependency'}).click();
  const depText=await page.locator('.hccFpBody').innerText();
  ok('Dependency view is driven by the unified typed graph',depText.includes('Unified Atlas graph')&&depText.includes('measured links'));

  await page.getByRole('button',{name:'Anyon Observatory'}).click();
  ok('all five Anyon Observatory stations are visible',await page.locator('[data-station]').count()===5);

  const n=page.locator('#fpFusionN');await n.fill('10');await n.dispatchEvent('change');
  ok('Fusion Tree recomputes ten rows by the Fibonacci recurrence',await page.locator('.hccFpFusionRow').count()===11);
  await n.fill('7');await n.dispatchEvent('change');
  ok('Fusion Tree controls remain wired after recomputation',await page.locator('.hccFpFusionRow').count()===8);

  await page.locator('[data-station="fr-switch"]').click();
  await page.getByRole('button',{name:'CORE ORIENTATION'}).click();
  ok('F/R station exposes the Atlas-native conjugate braid orientation',(await page.locator('#hccFpStation').innerText()).includes('Atlas core native convention B'));

  await page.locator('[data-station="braid-composer"]').click();
  await page.locator('#fpBraidWord').fill('1 2 -1 2');await page.locator('#fpBraidApply').click();
  const braidText=await page.locator('#hccFpStation').innerText();
  ok('Braid Composer evaluates an editable finite word',braidText.includes('length = 4')&&await page.locator('.hccFpCross').count()===4);
  ok('Braid Composer renders the resulting 2x2 unitary',await page.locator('#hccFpStation .hccFpCell').count()===4);

  await page.locator('[data-station="gate-comparator"]').click();
  await page.locator('#fpGateWord').fill('1 2 -1 2');await page.locator('#fpGateTarget').selectOption('H');await page.locator('#fpGateApply').click();
  const gateText=await page.locator('#hccFpStation').innerText();
  const m=gateText.match(/error\s*=\s*([0-9.eE+-]+)/);
  ok('Gate Comparator reports a finite global-phase-invariant error',!!m&&Number.isFinite(Number(m[1])));

  await page.locator('[data-station="model-contrast"]').click();
  const contrast=await page.locator('#hccFpStation').innerText();
  ok('Model Contrast separates non-Abelian statistics from universality',contrast.includes('EXTERNAL theorem')&&contrast.includes('braiding alone'));

  await page.getByRole('button',{name:'Geometry'}).click();
  ok('Geometry view refuses undeclared visual/physical bindings',(await page.locator('.hccFpBody').innerText()).includes('no geometry binding declared'));

  await page.setViewportSize({width:844,height:390});
  const box=await page.locator('#hccFpLens').boundingBox();
  ok('landscape iPhone layout stays inside the viewport',!!box&&box.x>=0&&box.y>=0&&box.x+box.width<=845&&box.y+box.height<=391);

  await page.locator('.hccFpClose').click();
  ok('closing destroys the Lens DOM',await page.locator('#hccFpLens').count()===0);
  await page.locator('#hccFpTrigger').click();
  ok('reopening does not duplicate Lens or trigger',await page.locator('#hccFpLens').count()===1&&await page.locator('#hccFpTrigger').count()===1);

  ok('Lens and Integration Bus emit no page-level JavaScript exceptions',pageErrors.length===0);
  console.log(`\nFIRST-PRINCIPLES + INTEGRATION BROWSER GATE: ${pass} assertions passed`);
 }finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
