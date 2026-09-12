import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import net from 'node:net';

const host='127.0.0.1';
const port=4179;
const server=spawn('python3',['-m','http.server',String(port),'--bind',host],{
  stdio:['ignore','pipe','pipe']
});
let serverLog='';
server.stdout.on('data',d=>serverLog+=d.toString());
server.stderr.on('data',d=>serverLog+=d.toString());

async function waitPort(){
  const deadline=Date.now()+15000;
  while(Date.now()<deadline){
    if(await new Promise(resolve=>{
      const s=net.createConnection({host,port});
      s.once('connect',()=>{s.end();resolve(true);});
      s.once('error',()=>resolve(false));
    })) return;
    await new Promise(r=>setTimeout(r,150));
  }
  throw new Error('server did not start\n'+serverLog);
}

let browser;
try{
  await waitPort();
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('console',msg=>{ if(msg.type()==='error') console.error('[console]',msg.text()); });
  const url=`http://${host}:${port}/index.html?fulltests=1`;
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>Array.isArray(globalThis.HCC_SELFTEST_RESULTS),null,{timeout:120000});
  await page.waitForTimeout(250);
  const result=await page.evaluate(()=>{
    const rows=globalThis.HCC_SELFTEST_RESULTS||[];
    return {
      total:rows.length,
      failed:rows.filter(r=>!r.pass).map(r=>({name:r.name,detail:r.detail??null})),
      tail:rows.slice(-20).map(r=>({name:r.name,pass:!!r.pass,detail:r.detail??null}))
    };
  });
  console.log(JSON.stringify({url,pageErrors,...result},null,2));
  if(pageErrors.length || result.failed.length) process.exitCode=1;
} finally {
  if(browser) await browser.close();
  server.kill('SIGTERM');
}
