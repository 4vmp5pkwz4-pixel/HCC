/** Integration of the changed paths in the actual atlas, with local pinned Three.js. */
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(new URL('..',import.meta.url).pathname);
const html=(await readFile(resolve(root,'index.html'),'utf8'))
  .replaceAll('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js','/node_modules/three/build/three.module.js')
  .replaceAll('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/','/node_modules/three/examples/jsm/');
const server=createServer(async(req,res)=>{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/'||path==='/index.html'){res.setHeader('content-type','text/html');res.end(html);return;}
  const file=resolve(root,'.'+path);if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  try{res.setHeader('content-type',({'.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.wasm':'application/wasm'})[extname(file)]||'application/octet-stream');res.end(await readFile(file));}
  catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));let browser;
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const rendered=process.env.HCC_RENDER_CHECK==='1';
  await page.goto(`http://127.0.0.1:${server.address().port}/?render=${rendered?1:0}#/world/s3/lab/tri`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!globalThis.FBS3R_QA,{timeout:60000});
  const selector=page.locator('#triProjection');await selector.waitFor({state:'attached'});
  // render=0 intentionally hides all UI. This tests the real change handler; it
  // makes no claim about scene rendering or the visibility of headless controls.
  await selector.selectOption('stereographic',{force:!rendered});
  const selected=await page.locator('#triProjection').inputValue();
  const diagnostic=await page.evaluate(async()=>({hadwiger:await FBS3R_QA.hadwigerGpu(),asteroids:await FBS3R_QA.asteroidsGpu(),multiview:FBS3R_QA.s3Multiview()}));
  await page.locator('#triProjection').selectOption('compact',{force:!rendered});
  const compact=await page.locator('#triProjection').inputValue();
  const result={ran:true,rendered,selected,compact,diagnostic,errors};console.log(JSON.stringify(result,null,2));
  if(selected!=='stereographic'||compact!=='compact'||errors.length||diagnostic.hadwiger.error||Math.abs(diagnostic.hadwiger.cpu.V3-8)>1e-12||Math.abs(diagnostic.hadwiger.cpu.V2-12)>1e-12)process.exitCode=1;
}finally{await browser?.close();await new Promise(done=>server.close(done));}
