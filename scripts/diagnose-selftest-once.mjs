import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import net from 'node:net';
const host='127.0.0.1',port=4179;
const server=spawn('python3',['-m','http.server',String(port),'--bind',host],{stdio:['ignore','pipe','pipe']});
async function waitPort(){const deadline=Date.now()+15000;while(Date.now()<deadline){if(await new Promise(resolve=>{const s=net.createConnection({host,port});s.once('connect',()=>{s.end();resolve(true)});s.once('error',()=>resolve(false));}))return;await new Promise(r=>setTimeout(r,150));}throw new Error('server did not start');}
let browser;
try{await waitPort();browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1280,height:800}});const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e.message||e)));const url=`http://${host}:${port}/index.html?render=0`;await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});await page.evaluate(async()=>{await HCC_API.ready({timeout:15000});});const result=await page.evaluate(()=>globalThis.__ZERO_DIAG());console.log(JSON.stringify({url,pageErrors,...result},null,2));if(pageErrors.length)process.exitCode=1;}finally{if(browser)await browser.close();server.kill('SIGTERM');}
