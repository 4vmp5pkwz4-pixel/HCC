/** Actual shader execution, never a mock. HCC_REQUIRE_GPU=1 turns absence into failure. */
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';

const root=resolve(new URL('..',import.meta.url).pathname);
const server=createServer(async(req,res)=>{
  if(req.url==='/'){res.setHeader('content-type','text/html');res.end('<!doctype html><title>HCC actual GPU checks</title>');return;}
  const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!path.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  try{res.setHeader('content-type',extname(path)==='.html'?'text/html':extname(path)==='.mjs'?'text/javascript':'application/octet-stream');res.end(await readFile(path));}
  catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
try {
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-webgpu','--use-vulkan=swiftshader','--use-angle=vulkan','--enable-features=Vulkan','--disable-vulkan-surface']});
  const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const result=await page.evaluate(async()=>{
    const {runVisualGpuChecks}=await import('/test/helpers/visual-gpu-checks.mjs');
    return runVisualGpuChecks(navigator.gpu);
  });
  console.log(JSON.stringify(result,null,2));
  if(!result.ran){if(process.env.HCC_REQUIRE_GPU==='1')process.exitCode=1;}
  else if(result.failures.length)process.exitCode=1;
}finally{await browser?.close();await new Promise(done=>server.close(done));}
