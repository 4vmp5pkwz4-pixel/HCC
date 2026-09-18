#!/usr/bin/env node
/*
  HCC rendered visual audit.

  This is deliberately a MANUAL / heavy gate. It renders representative worlds at
  desktop and touch viewports, saves inspectable screenshots, and measures invariants
  that source-only checks cannot see: blank WebGL output, horizontal overflow, canvas
  coverage, Time Machine geometry and overlay collisions.

  Usage: node scripts/visual-audit.mjs
  Output: artifacts/visual-audit/*.png + metrics.json + SUMMARY.md
*/
import {
  readFileSync, writeFileSync, existsSync, mkdirSync, rmSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const OUT=join(ROOT,'artifacts','visual-audit');
rmSync(OUT,{recursive:true,force:true}); mkdirSync(OUT,{recursive:true});

const html0=readFileSync(join(ROOT,'index.html'),'utf8');
/* Never make the visual gate depend on a public CDN. npm ci already installed these. */
const html=html0
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/build\/three\.module\.js/g,'./node_modules/three/build/three.module.js')
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/examples\/jsm\//g,'./node_modules/three/examples/jsm/')
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/@dimforge\/rapier3d-compat@0\.14\.0\/rapier\.es\.js/g,'./node_modules/@dimforge/rapier3d-compat/rapier.es.js');

const MIME={
  '.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json',
  '.css':'text/css','.wasm':'application/wasm','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
  '.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'
};
const server=createServer((req,res)=>{
  const url=decodeURIComponent((req.url||'/').split('?')[0]);
  if(url==='/'||url==='/index.html'){
    res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html);return;
  }
  try{
    const rel=url.replace(/^\/+/,''), full=join(ROOT,rel);
    if(!full.startsWith(ROOT)) throw new Error('outside root');
    const body=readFileSync(full);
    res.writeHead(200,{'content-type':MIME[extname(full)]||'application/octet-stream'});
    res.end(body);
  }catch{res.writeHead(404);res.end('not found');}
});
const PORT=8911;
await new Promise(resolve=>server.listen(PORT,'127.0.0.1',resolve));

let chromium;
try{({chromium}=await import('playwright'));}
catch(e){console.error('playwright package is required for visual audit');server.close();process.exit(1);}

let browser;
try{
  browser=await chromium.launch({headless:true,args:[
    '--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader',
  ]});
}catch(first){
  const fallback=process.env.PW_CHROMIUM||'/opt/pw-browsers/chromium';
  if(!existsSync(fallback)){
    console.error('could not launch Chromium:',String(first?.message||first).split('\n')[0]);
    server.close();process.exit(1);
  }
  browser=await chromium.launch({headless:true,executablePath:fallback,args:[
    '--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader',
  ]});
}

const CASES=[
  {name:'solar-desktop',hash:'#/world/solar',viewport:{width:1440,height:900}},
  {name:'observable-desktop',hash:'#/world/obs',viewport:{width:1440,height:900}},
  {name:'poinsot-desktop',hash:'#/world/s3/lab/poin',viewport:{width:1440,height:900}},
  {name:'cycles-desktop',hash:'#/world/cyc',viewport:{width:1440,height:900}},
  {name:'solar-portrait',hash:'#/world/solar',viewport:{width:390,height:844},touch:true},
  {name:'poinsot-portrait',hash:'#/world/s3/lab/poin',viewport:{width:390,height:844},touch:true},
  {name:'cycles-portrait',hash:'#/world/cyc',viewport:{width:390,height:844},touch:true},
  {name:'poinsot-landscape-phone',hash:'#/world/s3/lab/poin',viewport:{width:852,height:393},touch:true},
];

function paeth(a,b,c){
  const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
  return pa<=pb&&pa<=pc?a:pb<=pc?b:c;
}
function pngStats(buf){
  if(buf.toString('hex',0,8)!=='89504e470d0a1a0a') throw new Error('not a PNG');
  let off=8,w=0,h=0,bit=0,type=0,interlace=0;const ids=[];
  while(off+12<=buf.length){
    const len=buf.readUInt32BE(off),kind=buf.toString('ascii',off+4,off+8),data=buf.subarray(off+8,off+8+len);
    if(kind==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);bit=data[8];type=data[9];interlace=data[12];}
    else if(kind==='IDAT')ids.push(data);
    else if(kind==='IEND')break;
    off+=12+len;
  }
  if(bit!==8||interlace!==0||![2,6].includes(type)) throw new Error(`unsupported PNG bit=${bit} type=${type} interlace=${interlace}`);
  const bpp=type===6?4:3,stride=w*bpp,raw=inflateSync(Buffer.concat(ids));
  const prev=Buffer.alloc(stride),row=Buffer.alloc(stride);let pos=0;
  const sx=Math.max(1,Math.floor(w/240)),sy=Math.max(1,Math.floor(h/180));
  let n=0,sum=0,sum2=0,nonDark=0;const bins=new Set();
  for(let y=0;y<h;y++){
    const filter=raw[pos++];
    for(let x=0;x<stride;x++){
      const rawv=raw[pos++],a=x>=bpp?row[x-bpp]:0,b=prev[x],c=x>=bpp?prev[x-bpp]:0;
      let v=rawv;
      if(filter===1)v=(rawv+a)&255;
      else if(filter===2)v=(rawv+b)&255;
      else if(filter===3)v=(rawv+Math.floor((a+b)/2))&255;
      else if(filter===4)v=(rawv+paeth(a,b,c))&255;
      else if(filter!==0)throw new Error('unsupported PNG filter '+filter);
      row[x]=v;
    }
    if(y%sy===0){
      for(let x=0;x<w;x+=sx){
        const i=x*bpp,r=row[i],g=row[i+1],b=row[i+2],l=.2126*r+.7152*g+.0722*b;
        n++;sum+=l;sum2+=l*l;if(l>5)nonDark++;bins.add(Math.floor(l/8));
      }
    }
    row.copy(prev);
  }
  const mean=sum/n,variance=Math.max(0,sum2/n-mean*mean);
  return {width:w,height:h,samples:n,mean:+mean.toFixed(3),std:+Math.sqrt(variance).toFixed(3),
    nonDarkFraction:+(nonDark/n).toFixed(5),luminanceBins:bins.size};
}
const rect=o=>o?{left:+o.left.toFixed(1),top:+o.top.toFixed(1),right:+o.right.toFixed(1),bottom:+o.bottom.toFixed(1),width:+o.width.toFixed(1),height:+o.height.toFixed(1)}:null;
const intersect=(a,b)=>!a||!b?0:Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));

const results=[];let failures=0;
for(const spec of CASES){
  const page=await browser.newPage({viewport:spec.viewport,...(spec.touch?{hasTouch:true,isMobile:true}: {})});
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e.message||e)));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(()=>{
    try{
      localStorage.setItem('s3.premiumVisuals','1');
      localStorage.setItem('lts-theme','night');
    }catch{}
  });
  const url=`http://127.0.0.1:${PORT}/index.html?visualaudit=1${spec.hash}`;
  let loadError=null;
  try{
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForFunction(()=>globalThis.HCC_API,{timeout:30000});
    await page.evaluate(async()=>{await HCC_API.ready({timeout:20000});});
    await page.waitForTimeout(1800);
  }catch(e){loadError=String(e?.message||e);}

  const fullPath=join(OUT,`${spec.name}.png`),canvasPath=join(OUT,`${spec.name}--canvas.png`);
  let canvasPixels=null,metrics=null;
  try{
    metrics=await page.evaluate(()=>{
      const R=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
      const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>1&&r.height>1;};
      const tm=document.querySelector('#timeMachine'),tmRect=visible(tm)?R(tm):null;
      const selectors=['.panel','#hud','#mBtns','#atlasCoach','#hierarchyLegend','#physDebug','#hccFpTrigger'];
      const overlays=[...new Set(selectors.flatMap(q=>[...document.querySelectorAll(q)]))]
        .filter(el=>visible(el)&&!tm?.contains(el))
        .map(el=>({id:el.id||el.className||el.tagName,rect:R(el)}));
      const canvas=[...document.querySelectorAll('canvas')].find(visible)||document.querySelector('canvas');
      return {
        href:location.href,mode:globalThis.HCC_CTX?.world||null,
        innerWidth,innerHeight,scrollWidth:document.documentElement.scrollWidth,
        scrollHeight:document.documentElement.scrollHeight,
        canvas:R(canvas),timeMachine:tmRect,
        tmCssHeight:getComputedStyle(document.documentElement).getPropertyValue('--tm-h').trim(),
        overlays,pageErrors:[],
      };
    });
    await page.screenshot({path:fullPath,fullPage:false});
    const canvas=page.locator('canvas').first();
    if(await canvas.count()){await canvas.screenshot({path:canvasPath});canvasPixels=pngStats(readFileSync(canvasPath));}
  }catch(e){loadError=loadError||String(e?.message||e);}

  if(metrics){
    metrics.canvas=rect(metrics.canvas);metrics.timeMachine=rect(metrics.timeMachine);
    metrics.overlays=metrics.overlays.map(x=>({id:String(x.id),rect:rect(x.rect)}));
  }
  const reasons=[];
  if(loadError)reasons.push('load/render error: '+loadError.split('\n')[0]);
  if(pageErrors.length)reasons.push(`${pageErrors.length} page error(s)`);
  if(!metrics?.canvas)reasons.push('no visible canvas');
  else{
    const area=metrics.canvas.width*metrics.canvas.height/(spec.viewport.width*spec.viewport.height);
    if(area<.88)reasons.push(`canvas covers only ${(area*100).toFixed(1)}% of viewport`);
  }
  if(metrics&&metrics.scrollWidth>spec.viewport.width+2)reasons.push(`horizontal overflow ${metrics.scrollWidth-spec.viewport.width}px`);
  if(!metrics?.timeMachine)reasons.push('Time Machine is not visible');
  else{
    if(Math.abs(metrics.timeMachine.left)>2||Math.abs(metrics.timeMachine.right-spec.viewport.width)>2)
      reasons.push('Time Machine is not full viewport width');
    if(Math.abs(metrics.timeMachine.bottom-spec.viewport.height)>3)reasons.push('Time Machine is not docked to viewport bottom');
    if(spec.viewport.width<=760&&metrics.timeMachine.height>spec.viewport.height*.42)
      reasons.push(`portrait Time Machine consumes ${(100*metrics.timeMachine.height/spec.viewport.height).toFixed(1)}% of height`);
    const collisions=metrics.overlays.filter(x=>intersect(x.rect,metrics.timeMachine)>16);
    if(collisions.length)reasons.push('overlay intersects Time Machine: '+collisions.map(x=>x.id).join(', '));
  }
  if(!canvasPixels)reasons.push('canvas pixels unavailable');
  else if(canvasPixels.std<1.2||canvasPixels.luminanceBins<4||canvasPixels.nonDarkFraction<0.0005)
    reasons.push(`canvas appears blank/degenerate: std=${canvasPixels.std}, bins=${canvasPixels.luminanceBins}, nonDark=${canvasPixels.nonDarkFraction}`);

  const result={...spec,url,pageErrors,loadError,metrics,canvasPixels,reasons,pass:reasons.length===0};
  results.push(result);
  console.log(`${result.pass?'PASS':'FAIL'} · ${spec.name} · canvas std ${canvasPixels?.std??'n/a'} · ${reasons.join(' | ')||'geometry and pixels healthy'}`);
  if(!result.pass)failures++;
  await page.close();
}

await browser.close();await new Promise(resolve=>server.close(resolve));
writeFileSync(join(OUT,'metrics.json'),JSON.stringify({schema:'hcc.visual-audit/1',generated_at:new Date().toISOString(),results},null,2));
const summary=['# HCC visual audit','',`Result: **${failures?'BLOCKED':'GREEN'}** · ${results.length-failures}/${results.length} rendered viewports passed`,'',
  '| viewport | route | pixels | overflow | Time Machine | result |','|---|---|---:|---:|---:|---|',
  ...results.map(r=>`| ${r.name} | ${r.hash} | σ=${r.canvasPixels?.std??'—'} | ${Math.max(0,(r.metrics?.scrollWidth??r.viewport.width)-r.viewport.width)} px | ${r.metrics?.timeMachine?Math.round(r.metrics.timeMachine.height)+' px':'missing'} | ${r.pass?'PASS':'FAIL'} |`),
  '',...results.filter(r=>!r.pass).flatMap(r=>[`## ${r.name}`,...r.reasons.map(x=>'- '+x),''])
];
writeFileSync(join(OUT,'SUMMARY.md'),summary.join('\n')+'\n');
console.log(`visual audit: ${results.length-failures}/${results.length} passed · artifacts in ${OUT}`);
process.exitCode=failures?1:0;
