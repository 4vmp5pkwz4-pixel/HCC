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
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/?render=0#/world/s3/lab/cosmo`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!globalThis.HCC_RESEARCH,{timeout:60000});
 // Intercept only browser fullscreen entry; the actual atlas event handlers still run.
 await page.evaluate(()=>{globalThis.fullscreenCalls=0;document.documentElement.requestFullscreen=()=>{fullscreenCalls++;return Promise.resolve();};});
 await page.evaluate(()=>document.activeElement.blur());
 await page.keyboard.press('f');
 assert.equal(await page.evaluate(()=>fullscreenCalls),0,'F must not request fullscreen');
 await page.keyboard.press('Shift+F');
 assert.equal(await page.evaluate(()=>fullscreenCalls),1,'Shift+F requests fullscreen exactly once');
 await page.keyboard.press('Control+f');
 assert.equal(await page.evaluate(()=>fullscreenCalls),1,'browser Find must not request fullscreen');
 await page.keyboard.press('f');
 if(await page.locator('#ctl').evaluate(el=>getComputedStyle(el).display==='none'))await page.keyboard.press('c');
 const panelBefore=await page.locator('#ctl').evaluate(el=>getComputedStyle(el).display);
 assert.notEqual(panelBefore,'none');
 await page.evaluate(()=>HCC_RESEARCH.open());
 const before=await page.evaluate(()=>HCC_NAV.scene().worldId);
 await page.locator('#ge-tab-2').click();
 await page.keyboard.press('1');await page.keyboard.press('f');await page.keyboard.press('Shift+F');
 assert.equal(await page.evaluate(()=>HCC_NAV.scene().worldId),before);
 assert.equal(await page.evaluate(()=>fullscreenCalls),1);
 assert.equal(await page.locator('#geometryEvidence').evaluate(el=>el.open),true);
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#geometryEvidence').evaluate(el=>el.open),false,'native Escape closes the dialog');
 assert.equal(await page.locator('#ctl').evaluate(el=>getComputedStyle(el).display),panelBefore,'modal Escape must preserve the underlying panel');
 await page.locator('#hccFpTrigger').evaluate(el=>el.click());
 await page.locator('#hccFpLens .hccFpClose').focus();
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#hccFpLens').count(),0);
 assert.equal(await page.locator('#ctl').evaluate(el=>getComputedStyle(el).display),panelBefore,'First-Principles Escape must preserve the underlying panel');
 await page.evaluate(()=>document.activeElement.blur());
 await page.keyboard.press('1');
 assert.equal(await page.evaluate(()=>HCC_NAV.scene().worldId),'solar');
 assert.deepEqual(errors,[]);
 console.log('PASS: browser keyboard ownership, fullscreen separation, modal Escape, restored world navigation');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
