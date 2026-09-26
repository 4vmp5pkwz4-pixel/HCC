#!/usr/bin/env node
/*
  HCC RENDERED VISUAL AUDIT MATRIX

  This is intentionally NOT part of ordinary PR validation. It renders a canonical
  cross-section of the Atlas with premium visuals enabled on desktop, phone portrait
  and phone landscape, writes screenshot evidence, and fails on catastrophic visual
  regressions that source-level tests cannot see:

    - missing / undersized scientific canvas
    - effectively blank or black central scene
    - horizontal viewport overflow
    - fixed panels escaping the viewport
    - panels colliding with the Time Machine
    - mobile Time Machine no longer spanning the screen
    - the UI covering the scientific centre

  Screenshots are diagnostic evidence. They do not establish scientific truth.
*/
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const OUT=join(ROOT,'artifacts','visual-audit');
mkdirSync(OUT,{recursive:true});

const VENDOR=process.env.HCC_VENDOR||join(ROOT,'vendor');
const HAVE_VENDOR=existsSync(VENDOR);
const html0=readFileSync(join(ROOT,'index.html'),'utf8');
const html=!HAVE_VENDOR?html0:html0
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/build\/three\.module\.js/g,'./vendor/three/build/three.module.js')
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/examples\/jsm\//g,'./vendor/three/examples/jsm/')
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/@dimforge\/rapier3d-compat@0\.14\.0\/rapier\.es\.js/g,'./vendor/rapier/rapier.es.js');

const MIME={'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.wasm':'application/wasm','.html':'text/html','.css':'text/css','.png':'image/png'};
const server=createServer((req,res)=>{
  const url=decodeURIComponent((req.url||'/').split('?')[0]);
  if(url==='/'||url==='/index.html'){res.writeHead(200,{'content-type':'text/html'});res.end(html);return;}
  try{
    const rel=url.replace(/^\/+/, '');
    const path=rel.startsWith('vendor/')&&HAVE_VENDOR?join(VENDOR,rel.slice(7)):join(ROOT,rel);
    const body=readFileSync(path);
    res.writeHead(200,{'content-type':MIME[extname(url)]||'application/octet-stream'});res.end(body);
  }catch{res.writeHead(404);res.end('not found');}
});
const PORT=8911;
await new Promise(r=>server.listen(PORT,r));

let chromium;
try{({chromium}=await import('playwright'));}
catch{
  try{({chromium}=await import('/opt/node22/lib/node_modules/playwright/index.mjs'));}
  catch{console.error('playwright not available; cannot perform rendered visual audit');server.close();process.exit(1);}
}

let browser;
try{browser=await chromium.launch();}
catch(first){
  const p=process.env.PW_CHROMIUM||'/opt/pw-browsers/chromium';
  if(!existsSync(p)){console.error(String(first?.message||first));server.close();process.exit(1);}
  browser=await chromium.launch({executablePath:p});
}

const scenes=[
  {id:'solar',label:'Solar scale chain',world:'solar',lab:null},
  {id:'poinsot',label:'Poinsot / Euler top',world:'s3',lab:'poin'},
  {id:'cmb',label:'CMB low multipoles',world:'s3',lab:'cmb'},
  {id:'chronometry',label:'Ancient Chronometry',world:'cyc',lab:'chronometry'},
];
const devices=[
  {id:'desktop',viewport:{width:1440,height:900},touch:false},
  {id:'phone-portrait',viewport:{width:390,height:844},touch:true},
  {id:'phone-landscape',viewport:{width:852,height:393},touch:true},
];
const cases=scenes.flatMap(scene=>devices.map(device=>({
  name:`${scene.id}-${device.id}`,...scene,...device,
})));

const report={
  schema:'hcc.visual-audit/2',
  generated_at:new Date().toISOString(),
  matrix:{scenes:scenes.map(s=>s.id),devices:devices.map(d=>d.id)},
  note:'Rendered diagnostic evidence. Pixel/layout health is not a scientific validation of the represented model.',
  cases:[]
};
let failed=0;

function paeth(a,b,c){
  const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
  return pa<=pb&&pa<=pc?a:pb<=pc?b:c;
}

function pngStats(buf){
  const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  if(buf.length<33||!buf.subarray(0,8).equals(sig))throw new Error('screenshot is not PNG');
  let off=8,width=0,height=0,bitDepth=0,colorType=-1,interlace=-1;
  const idat=[];
  while(off+12<=buf.length){
    const len=buf.readUInt32BE(off),type=buf.toString('ascii',off+4,off+8);
    const data=buf.subarray(off+8,off+8+len);
    if(type==='IHDR'){
      width=data.readUInt32BE(0);height=data.readUInt32BE(4);
      bitDepth=data[8];colorType=data[9];interlace=data[12];
    }else if(type==='IDAT')idat.push(data);
    else if(type==='IEND')break;
    off+=12+len;
  }
  const channels={0:1,2:3,4:2,6:4}[colorType];
  if(bitDepth!==8||!channels||interlace!==0)throw new Error(`unsupported PNG format bitDepth=${bitDepth} colorType=${colorType} interlace=${interlace}`);
  const raw=inflateSync(Buffer.concat(idat));
  const stride=width*channels,row=new Uint8Array(stride),prev=new Uint8Array(stride);
  let rp=0,n=0,sum=0,sum2=0,nearBlack=0,bright=0,min=255,max=0;
  for(let y=0;y<height;y++){
    const filter=raw[rp++];
    for(let x=0;x<stride;x++){
      const src=raw[rp++],left=x>=channels?row[x-channels]:0,up=prev[x],ul=x>=channels?prev[x-channels]:0;
      let v;
      if(filter===0)v=src;
      else if(filter===1)v=(src+left)&255;
      else if(filter===2)v=(src+up)&255;
      else if(filter===3)v=(src+Math.floor((left+up)/2))&255;
      else if(filter===4)v=(src+paeth(left,up,ul))&255;
      else throw new Error('unsupported PNG filter '+filter);
      row[x]=v;
    }
    for(let x=0;x<width;x++){
      const i=x*channels;
      let r,g,b,a=255;
      if(colorType===0){r=g=b=row[i];}
      else if(colorType===4){r=g=b=row[i];a=row[i+1];}
      else {r=row[i];g=row[i+1];b=row[i+2];if(colorType===6)a=row[i+3];}
      if(a<8)continue;
      const l=0.2126*r+0.7152*g+0.0722*b;
      n++;sum+=l;sum2+=l*l;if(l<4)nearBlack++;if(l>20)bright++;if(l<min)min=l;if(l>max)max=l;
    }
    prev.set(row);
  }
  const mean=n?sum/n:0,variance=n?Math.max(0,sum2/n-mean*mean):0;
  return {
    width,height,pixels:n,
    mean_luma:Number(mean.toFixed(3)),
    std_luma:Number(Math.sqrt(variance).toFixed(3)),
    near_black_ratio:Number((n?nearBlack/n:1).toFixed(6)),
    bright_ratio:Number((n?bright/n:0).toFixed(6)),
    min_luma:Number(min.toFixed(3)),max_luma:Number(max.toFixed(3)),
  };
}

function catastrophicBlank(p){
  return p.pixels===0
    || p.near_black_ratio>0.9995
    || (p.mean_luma<1.5&&p.std_luma<1.2&&p.bright_ratio<0.0005);
}

async function openCase(spec){
  const context=await browser.newContext({
    viewport:spec.viewport,
    ...(spec.touch?{hasTouch:true,isMobile:true}:{})
  });
  await context.addInitScript(()=>{
    try{
      localStorage.setItem('s3.premiumVisuals','1');
      localStorage.setItem('lts-theme','night');
    }catch{}
  });
  const page=await context.newPage();
  const pageErrors=[],consoleErrors=[],requestFailures=[];
  page.on('pageerror',e=>pageErrors.push(String(e.message||e)));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  page.on('requestfailed',r=>requestFailures.push(`${r.method()} ${r.url()} :: ${r.failure()?.errorText||'failed'}`));

  await page.goto(`http://127.0.0.1:${PORT}/index.html`,{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>globalThis.HCC_API&&globalThis.HCC_NAV,null,{timeout:60000});
  await page.evaluate(async()=>{await HCC_API.ready({timeout:20000});});

  if(spec.world!=='solar'||spec.lab){
    await page.evaluate(({world,lab})=>{
      HCC_NAV.go(world,lab);
    },{world:spec.world,lab:spec.lab});
  }
  await page.waitForTimeout(spec.touch?1200:1000);

  /* Reference shots have an explicit panel state. Dismiss the catalogue/sheet if it
     auto-opened on arrival; the audit must compare intentional UI states, not races. */
  await page.evaluate(()=>{
    const p=document.getElementById('labPanel');
    if(p&&getComputedStyle(p).display!=='none'){
      const close=p.querySelector('.closeBtn,[data-close],button[aria-label*="Close"],button[aria-label*="Закры"]');
      if(close)close.click();
      else p.style.display='none';
    }
  });
  await page.waitForTimeout(180);

  const metrics=await page.evaluate(()=>{
    const visible=el=>{
      if(!el)return false;
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0.01&&r.width>1&&r.height>1;
    };
    const rr=el=>{const r=el.getBoundingClientRect();return {id:el.id||'',x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
    const explicit=['navPanel','ctl','info','selCard','atlasPanel','labPanel','objectPanel','panelDock','timeMachine'];
    const pool=[...new Set([...explicit.map(id=>document.getElementById(id)),...document.querySelectorAll('.panel')])].filter(visible);
    const rects=pool.map(rr);
    const tm=document.getElementById('timeMachine'),tmRect=visible(tm)?rr(tm):null;
    const panels=pool.filter(el=>el!==tm).map(rr);
    const centre={x:innerWidth/2,y:innerHeight*0.45};
    const centreBlocked=panels.some(r=>centre.x>=r.x&&centre.x<=r.right&&centre.y>=r.y&&centre.y<=r.bottom);
    const escaped=panels.filter(r=>r.x<-2||r.y<-2||r.right>innerWidth+2||r.bottom>innerHeight+2);
    const tmOccludes=tmRect?panels.filter(r=>r.bottom>tmRect.y+2&&r.y<tmRect.bottom-2):[];
    const canvases=[...document.querySelectorAll('canvas')].filter(visible).map(el=>({el,r:el.getBoundingClientRect()}));
    canvases.sort((a,b)=>b.r.width*b.r.height-a.r.width*a.r.height);
    const canvasRect=canvases.length?rr(canvases[0].el):null;
    return {
      width:innerWidth,height:innerHeight,dpr:devicePixelRatio,
      scrollWidth:document.documentElement.scrollWidth,
      scrollHeight:document.documentElement.scrollHeight,
      panels,tmRect,canvasRect,centre,centreBlocked,escaped,tmOccludes,
      premium:localStorage.getItem('s3.premiumVisuals'),
      hash:location.hash,
      cssTmHeight:getComputedStyle(document.documentElement).getPropertyValue('--tm-h').trim(),
    };
  });

  const failures=[];
  if(pageErrors.length)failures.push(`${pageErrors.length} page error(s)`);
  if(metrics.scrollWidth>metrics.width+2)failures.push(`horizontal overflow ${metrics.scrollWidth-metrics.width}px`);
  if(!metrics.canvasRect||metrics.canvasRect.width<metrics.width*0.90||metrics.canvasRect.height<metrics.height*0.80)
    failures.push('render canvas does not cover the scientific viewport');
  if(metrics.centreBlocked)failures.push('fixed panel covers the scientific scene centre');
  if(metrics.escaped.length)failures.push(`${metrics.escaped.length} panel(s) escape the viewport`);
  if(metrics.tmOccludes.length)failures.push(`Time Machine overlaps ${metrics.tmOccludes.map(x=>x.id||'panel').join(', ')}`);
  if(metrics.tmRect&&spec.touch&&metrics.tmRect.width<metrics.width*0.96)
    failures.push(`Time Machine uses only ${(100*metrics.tmRect.width/metrics.width).toFixed(1)}% of mobile width`);
  if(metrics.tmRect&&metrics.tmRect.right>metrics.width+2)failures.push('Time Machine extends beyond right edge');
  if(metrics.tmRect&&metrics.tmRect.bottom>metrics.height+2)failures.push('Time Machine extends below viewport');

  const fullFile=join(OUT,`${spec.name}.png`);
  await page.screenshot({path:fullFile,fullPage:false,animations:'disabled'});
  const clip={
    x:Math.floor(metrics.width*0.20),
    y:Math.floor(metrics.height*0.16),
    width:Math.max(32,Math.floor(metrics.width*0.60)),
    height:Math.max(32,Math.floor(metrics.height*0.54)),
  };
  const sceneBuffer=await page.screenshot({clip,animations:'disabled'});
  const sceneFile=join(OUT,`${spec.name}-scene.png`);
  writeFileSync(sceneFile,sceneBuffer);
  let pixelHealth=null;
  try{
    pixelHealth=pngStats(sceneBuffer);
    if(catastrophicBlank(pixelHealth))failures.push(
      `central rendered scene is effectively blank/black (mean=${pixelHealth.mean_luma}, std=${pixelHealth.std_luma}, nearBlack=${pixelHealth.near_black_ratio})`
    );
  }catch(e){
    failures.push('pixel-health analysis failed: '+String(e?.message||e));
  }

  const severeConsole=consoleErrors.filter(x=>/uncaught|referenceerror|typeerror|webgl.*(?:error|failed)|failed to (?:fetch|load)/i.test(x));
  if(severeConsole.length)failures.push(`${severeConsole.length} severe console error(s)`);

  const entry={
    name:spec.name,scene:spec.id,label:spec.label,device:spec.name.slice(spec.id.length+1),
    viewport:spec.viewport,touch:spec.touch,route:{world:spec.world,lab:spec.lab},
    metrics,pixelHealth,
    pageErrors:pageErrors.slice(0,20),
    severeConsole:severeConsole.slice(0,20),
    consoleErrors:consoleErrors.slice(0,20),
    requestFailures:requestFailures.slice(0,20),
    failures,
    screenshots:{full:`${spec.name}.png`,scene:`${spec.name}-scene.png`}
  };
  report.cases.push(entry);
  if(failures.length){failed++;console.error(`FAIL — ${spec.name}: ${failures.join(' · ')}`);}
  else console.log(`PASS — ${spec.name}: layout + screenshot + pixel health`);
  await context.close();
}

for(const spec of cases){
  try{await openCase(spec);}
  catch(e){
    failed++;
    report.cases.push({name:spec.name,scene:spec.id,viewport:spec.viewport,failures:[String(e?.message||e)]});
    console.error(`FAIL — ${spec.name}: ${String(e?.message||e)}`);
  }
}

report.summary={
  total:cases.length,green:cases.length-failed,failed,
  black_or_blank:report.cases.filter(c=>c.failures?.some(x=>/blank\/black/.test(x))).map(c=>c.name),
  generated_at:new Date().toISOString(),
};
writeFileSync(join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
await browser.close();
server.close();

console.log(`\nrendered visual audit: ${cases.length-failed}/${cases.length} cases green · evidence in artifacts/visual-audit`);
if(failed)process.exit(1);
