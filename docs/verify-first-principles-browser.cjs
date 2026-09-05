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

  await page.locator('#hccFpTrigger').click();
  await page.locator('#hccFpLens').waitFor({state:'visible'});
  ok('Lens opens lazily as one dialog',await page.locator('#hccFpLens').count()===1);
  ok('Formula view contains exact and evaluated scientific slots',(await page.locator('#hccFpLens .fpExact').count())>0&&(await page.locator('#hccFpLens .fpEvaluated').count())>0);

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

  ok('Lens interaction emits no page-level JavaScript exceptions',pageErrors.length===0);
  console.log(`\nFIRST-PRINCIPLES BROWSER GATE: ${pass} assertions passed`);
 }finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
