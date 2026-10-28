#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const http=require('http');
const assert=require('assert');
const {chromium}=require('playwright');
const {launchChromium}=require('./lib/chromium.cjs');

const ROOT=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
/* The shipped page imports three.js from a CDN. A container with no route to
   that CDN could not run this check at all, so it was left to CI — which means
   the local gate was quietly incomplete about the one laboratory whose whole
   subject is what the atlas can prove about itself. scripts/build-manifest.mjs
   has always served a copy pointed at the vendored build for exactly this
   reason; this does the same, and falls back to the shipped URLs untouched when
   there is no vendor directory, so CI still exercises the real import path. */
const VENDOR=path.join(ROOT,'vendor');
const HTML=(()=>{const raw=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  return !fs.existsSync(VENDOR)?raw:raw
    .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/build\/three\.module\.js/g,'./vendor/three/build/three.module.js')
    .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/examples\/jsm\//g,'./vendor/three/examples/jsm/')
    .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/@dimforge\/rapier3d-compat@0\.14\.0\/rapier\.es\.js/g,'./vendor/rapier/rapier.es.js');})();
function serve(){return new Promise(resolve=>{const server=http.createServer((req,res)=>{try{let p=decodeURIComponent(new URL(req.url,'http://x').pathname);if(p==='/'||p==='')p='/index.html';if(p==='/index.html'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});return res.end(HTML);}const f=path.resolve(ROOT,'.'+p);if(!f.startsWith(ROOT+path.sep))throw new Error('forbidden');const st=fs.statSync(f);const file=st.isDirectory()?path.join(f,'index.html'):f;res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});fs.createReadStream(file).pipe(res);}catch(e){res.writeHead(404);res.end('not found');}});server.listen(0,'127.0.0.1',()=>resolve(server));});}

(async()=>{
 let browser,server;const pageErrors=[];let pass=0;
 const ok=(label,cond)=>{assert.ok(cond,label);pass++;console.log(`PASS — ${label}`);};
 try{
  server=await serve();const port=server.address().port;
  browser=await launchChromium(chromium,{headless:true});
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
    A.setEpochDays(12345.678,'browser-gate');
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
      epochDays:snap1.atlas_time&&snap1.atlas_time.epoch_days_j2000,
      timeSchema:snap1.atlas_time&&snap1.atlas_time.schema,
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
  ok('typed Atlas epoch propagates through one revisioned gateway',integrated.timeSchema==='hcc.time-fabric/1'&&Math.abs(integrated.epochDays-12345.678)<1e-9);
  ok('Fibonacci braid operator executes through the shared gateway',integrated.braidLength===4);
  ok('explicit converter path produces a provenance-bearing typed transfer',integrated.converted===true);
  ok('incompatible or semantically undeclared transfer fails closed',!!integrated.refused);

  await page.locator('#hccFpTrigger').click();
  await page.locator('#hccFpLens').waitFor({state:'visible'});
  ok('Lens opens lazily as one dialog',await page.locator('#hccFpLens').count()===1);
  /* v4.409: with no laboratory in view the Lens opens on its navigator (the first tab since the navigator was added),
     so the Formula view is asked for by name before its slots are read — this check had been failing silently since */
  ok('with no laboratory in view the Lens opens on the navigator',await page.locator('#hccFpLens .hccFpTab[aria-selected="true"]').getAttribute('data-view')==='nav');
  await page.getByRole('button',{name:'Formula',exact:true}).click();
  ok('Formula view contains exact and evaluated scientific slots',(await page.locator('#hccFpLens .fpExact').count())>0&&(await page.locator('#hccFpLens .fpEvaluated').count())>0);

  await page.getByRole('button',{name:'Dependency'}).click();
  const depText=await page.locator('.hccFpBody').innerText();
  const depNorm=depText.toLowerCase();
  ok('Dependency view is driven by the unified typed graph',depNorm.includes('unified atlas graph')&&depNorm.includes('typed neighborhood')&&depNorm.includes('measured links'));

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

  /* ── v4.409: ON A DESK THE LENS IS A DOCK BUTTON, IT OPENS ON THE LABORATORY YOU ARE IN, AND IT RUNS ITS INSTRUMENT ── */
  const desk=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const dp=await desk.newPage(); dp.on('pageerror',e=>pageErrors.push(String(e)));
  await dp.goto(`http://127.0.0.1:${port}/?render=0`,{waitUntil:'domcontentloaded',timeout:30000});
  await dp.locator('#fpDockBtn').waitFor({state:'visible',timeout:20000});
  ok('on a desk the Lens is a button in the dock and the floating pill steps aside',await dp.locator('#fpDockBtn').isVisible()&&!(await dp.locator('#hccFpTrigger').isVisible()));
  await dp.evaluate(()=>HCC_NAV.go('s3','hopftriad')); await dp.waitForTimeout(1500);
  await dp.locator('#fpDockBtn').click(); await dp.locator('#hccFpLens').waitFor({state:'visible'});
  ok('inside a laboratory the Lens opens on THAT laboratory — the Hopf-triad universe, not the Hopf fibration whose id is a substring of its own',await dp.locator('#hccFpLens .hccFpSelect').inputValue()==='hopftriad');
  ok('and on its Formula view, with its native contract declared and its typed instrument beside it',await dp.locator('#hccFpLens .hccFpTab[aria-selected="true"]').getAttribute('data-view')==='formula'
    &&(await dp.locator('#hccFpLens .hccFpBody').innerText()).includes('closed FLRW spacetime')&&await dp.locator('#hccFpLens [data-fp-inst="hopftriad"]').count()===1);
  await dp.locator('#hccFpLens [data-fp-in="eta"]').fill('0.3'); await dp.locator('#hccFpLens [data-fp-in="zeta"]').fill('0.06');
  await dp.locator('#hccFpLens [data-fp-run="hopftriad"]').click(); await dp.waitForTimeout(300);
  const ran=await dp.locator('#hccFpLens [data-fp-out="hopftriad"]').innerText();
  ok('the instrument runs in the Lens on the inputs typed there: η = 0.3, ζ = 0.06 bounces outside the window, h²a_min² = 0.6',ran.includes('bounces = true')&&ran.includes('in_window = false')&&ran.includes('a_min_squared = 0.6'));
  await dp.locator('#fpDockBtn').click({force:true}); await dp.waitForTimeout(200);
  ok('the door toggles: pressed again it closes the Lens and the focus comes back to it',await dp.locator('#hccFpLens').count()===0&&await dp.evaluate(()=>document.activeElement&&document.activeElement.id)==='fpDockBtn');
  await dp.locator('#fpDockBtn').click(); await dp.locator('#hccFpLens').waitFor({state:'visible'}); await dp.mouse.click(6,450); await dp.waitForTimeout(200);
  ok('a click outside the Lens closes it',await dp.locator('#hccFpLens').count()===0&&await dp.locator('#hccFpBackdrop').count()===0);
  await dp.locator('#fpDockBtn').click(); await dp.locator('#hccFpLens').waitFor({state:'visible'});
  await dp.locator('#hccFpLens [data-view="nav"]').click();
  await dp.locator('#hccFpLens [data-nav-trip]').filter({hasText:'The Fibonacci cube'}).first().click(); await dp.waitForTimeout(1500);
  ok('a journey to a laboratory arrives there — they called a function the Lens cannot reach and went nowhere',await dp.evaluate(()=>HCC_NAV.scene().labId)==='pxp');
  await desk.close();

  ok('Lens and Integration Bus emit no page-level JavaScript exceptions',pageErrors.length===0);
  console.log(`\nFIRST-PRINCIPLES + INTEGRATION BROWSER GATE: ${pass} assertions passed`);
 }finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
