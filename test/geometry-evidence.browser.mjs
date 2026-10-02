/** Real atlas interaction: research controls, routes, imports, exports and mobile layout. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(new URL('..',import.meta.url).pathname);
const html=(await readFile(resolve(root,'index.html'),'utf8'))
 .replaceAll('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js','/node_modules/three/build/three.module.js')
 .replaceAll('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/','/node_modules/three/examples/jsm/')
 .replaceAll('https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.14.0/rapier.es.js','/node_modules/@dimforge/rapier3d-compat/rapier.es.js');
const mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.wasm':'application/wasm'};
const server=createServer(async(req,res)=>{const path=decodeURIComponent(new URL(req.url,'http://local').pathname),file=resolve(root,'.'+path);if(path==='/'||path==='/index.html'){res.setHeader('content-type','text/html');res.end(html);return;}if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}try{res.setHeader('content-type',mime[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:width===390?844:900},acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?render=${process.env.HCC_RENDER_CHECK==='1'?1:0}#/world/s3/lab/cosmo`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!globalThis.HCC_RESEARCH,{timeout:60000});
  const unchanged=await page.evaluate(()=>({R:globalThis.HCC_RESEARCH.context().worldId,clock:HCC_TIME_FABRIC.snapshot().epochDaysJ2000}));
  await page.evaluate(()=>{document.getElementById('moreMenu').hidden=false;document.getElementById('geometryEvidenceBtn').focus();document.getElementById('geometryEvidenceBtn').click();});
  await page.locator('[data-action="close"]').click();
  if(process.env.HCC_RENDER_CHECK==='1')await page.waitForFunction(()=>document.activeElement.id==='moreBtn',{timeout:5000});
  await page.evaluate(()=>HCC_API.research.open());
  await page.locator('#geometryEvidence').waitFor({state:'visible'});
  assert.ok((await page.evaluate(()=>HCC_ATLAS_INTEGRATION.graph().nodes)).some(n=>n.id==='research:desi-ap'));
  await page.screenshot({path:`/tmp/hcc-geometry-${width}.png`});
  const before=await page.locator('#ge-readouts').innerText();
  await page.locator('[data-preset="-.01"]').first().click();
  assert.notEqual(await page.locator('#ge-readouts').innerText(),before);
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.preset),'-.01');
  await page.locator('#ge-OmegaM').fill('1');
  assert.equal(await page.locator('#ge-readouts .ge-error').count(),0,'valid selected closed geometry must survive invalid flat comparison');
  assert.ok(await page.locator('#ge-contours svg').count());
  await page.locator('#ge-OmegaM').fill('.315');
  const a=await page.evaluate(()=>HCC_RESEARCH.snapshot());assert.equal(a.inputs.OmegaK,-.01);assert.equal(a.audit.joint_likelihood,'not_combined');
  await page.locator('#ge-tab-1').click();await page.locator('[data-action="tutorial"]').click();
  assert.match(await page.locator('#ge-null-result').innerText(),/SYNTHETIC/);
  await page.locator('#ge-null-json').fill('{"source":"bad"}');await page.locator('[data-action="null-run"]').click();
  assert.ok(await page.locator('#ge-null-result .ge-error').count());
  await page.locator('#ge-tab-0').click();
  await page.locator('#ge-OmegaM').fill('.1');
  await page.locator('#ge-OmegaK').evaluate(el=>{el.value='-.3';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#ge-tab-2').click();
  assert.equal(await page.locator('#ge-mode-result .ge-error').count(),0,'valid S³ scalar must survive source-plane antipode refusal');
  assert.equal(await page.locator('#ge-lens-chart .ge-error').count(),1);
  await page.locator('[data-action=reset]').click();
  await page.locator('[data-preset="-.01"]').first().click();
  await page.locator('#ge-tab-2').click();assert.match(await page.locator('#ge-mode-result').innerText(),/25/);
  await page.locator('#ge-n').evaluate(el=>{el.value='5';el.dispatchEvent(new Event('input',{bubbles:true}));});assert.match(await page.locator('#ge-mode-result').innerText(),/36/);
  await page.locator('#ge-tab-3').click();assert.equal(await page.locator('article').count(),10);
  await page.locator('#ge-filter').selectOption('curvature');assert.equal(await page.locator('article').count(),2);
  await page.locator('#ge-filter').selectOption('all');
  const overflow=await page.locator('#geometryEvidence').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));assert.ok(overflow.scroll<=overflow.client+1,JSON.stringify(overflow));
  // Clear rejected JSON before exporting: an invalid draft is never exported as a result.
  await page.locator('[data-action="reset"]').click();
  const download=page.waitForEvent('download');await page.locator('[data-action="export"]').click();const d=await download;assert.equal(d.suggestedFilename(),'HCC_geometry_evidence.json');
  await page.locator('#ge-source-s3-harmonics [data-lab="sh"]').click();
  await page.waitForFunction(()=>HCC_NAV.scene().labId==='sh');
  assert.equal(await page.locator('#geometryEvidence').evaluate(el=>el.open),false);
  await page.evaluate(()=>HCC_RESEARCH.open());await page.locator('[data-action="close"]').click();
  assert.equal((await page.evaluate(()=>HCC_RESEARCH.catalog())).sources.length,10);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({viewport:width,controls:true,nullTest:true,sourceFiltering:true,labNavigation:true,export:true,overflow,initialContext:unchanged}));
  await page.close();
 }
}finally{await browser?.close();await new Promise(r=>server.close(r));}
