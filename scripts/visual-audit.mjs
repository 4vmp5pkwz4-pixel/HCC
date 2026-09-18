#!/usr/bin/env node
/*
  HCC VISUAL AUDIT MATRIX

  This is deliberately NOT part of ordinary PR validation. It renders representative
  Atlas states with premium visuals enabled, captures screenshots, and checks layout
  invariants that source-level tests cannot see: viewport overflow, panel escape,
  Time Machine occlusion, and whether the scientific scene still owns the centre.

  Output:
    artifacts/visual-audit/*.png
    artifacts/visual-audit/report.json
*/
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  catch{console.error('playwright not available; cannot perform visual audit');server.close();process.exit(1);}
}
let browser;
try{browser=await chromium.launch();}
catch(first){
  const p=process.env.PW_CHROMIUM||'/opt/pw-browsers/chromium';
  if(!existsSync(p)){console.error(String(first?.message||first));server.close();process.exit(1);}
  browser=await chromium.launch({executablePath:p});
}

const cases=[
  {name:'solar-desktop',viewport:{width:1440,height:900},world:'solar'},
  {name:'observable-desktop',viewport:{width:1440,height:900},world:'obs'},
  {name:'s3-section-desktop',viewport:{width:1440,height:900},world:'s3',lab:'sec'},
  {name:'poinsot-desktop',viewport:{width:1440,height:900},world:'s3',lab:'poin'},
  {name:'s3-phone-portrait',viewport:{width:390,height:844},touch:true,world:'s3',lab:'ns',panelState:'controls-only'},
  {name:'s3-phone-landscape',viewport:{width:852,height:393},touch:true,world:'s3',lab:'ns',panelState:'controls-only'},
];

const report={
  schema:'hcc.visual-audit/1',
  generated_at:new Date().toISOString(),
  note:'Rendered diagnostic evidence; screenshots do not establish scientific truth.',
  cases:[]
};
let failed=0;

async function openCase(spec){
  const context=await browser.newContext({
    viewport:spec.viewport,
    ...(spec.touch?{hasTouch:true,isMobile:true}:{}),
  });
  await context.addInitScript(()=>{
    try{
      localStorage.setItem('s3.premiumVisuals','1');
      localStorage.setItem('lts-theme','night');
    }catch{}
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.message||e)));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});

  await page.goto(`http://127.0.0.1:${PORT}/index.html`,{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>globalThis.HCC_API&&globalThis.HCC_NAV,null,{timeout:60000});
  await page.evaluate(async()=>{await HCC_API.ready({timeout:20000});});

  if(spec.world!=='solar'||spec.lab){
    await page.evaluate(({world,lab})=>{
      if(world==='solar'&&!lab)return;
      try{HCC_NAV.go(world,lab);}catch(e){
        if(globalThis.hccGo)hccGo({worldId:world,labId:lab},{history:false});
        else throw e;
      }
    },{world:spec.world,lab:spec.lab||null});
    await page.waitForTimeout(1000);
  }else{
    await page.waitForTimeout(700);
  }

  /* A visual baseline must name its UI state. Programmatic world arrival can race the
     catalogue's once-per-arrival offer, so mobile reference shots explicitly use the
     controls-only state rather than accepting whichever transient panel happened to win. */
  if(spec.panelState==='controls-only'){
    await page.evaluate(()=>{
      const close=document.querySelector('#labPanel .closeBtn');
      const panel=document.getElementById('labPanel');
      if(close&&panel&&getComputedStyle(panel).display!=='none') close.click();
    });
    await page.waitForTimeout(250);
  }

  const metrics=await page.evaluate(()=>{
    const visible=el=>{
      if(!el)return false;
      const s=getComputedStyle(el);
      const r=el.getBoundingClientRect();
      return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0.01&&r.width>1&&r.height>1;
    };
    const rr=el=>{const r=el.getBoundingClientRect();return {id:el.id||'',x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
    const ids=['navPanel','ctl','info','zpPanel','bixPanel','smithPanel','labPanel','timeMachine','hud'];
    const elements=ids.map(id=>document.getElementById(id)).filter(visible);
    const rects=elements.map(rr);
    const tm=document.getElementById('timeMachine');
    const tmRect=visible(tm)?rr(tm):null;
    const panels=[...document.querySelectorAll('.panel')].filter(visible).map(rr);
    const centre={x:innerWidth/2,y:Math.min(innerHeight*0.45,innerHeight-80)};
    const centreBlocked=panels.some(r=>centre.x>=r.x&&centre.x<=r.right&&centre.y>=r.y&&centre.y<=r.bottom);
    const escaped=panels.filter(r=>r.x<-2||r.y<-2||r.right>innerWidth+2||r.bottom>innerHeight+2);
    const tmOccludes=tmRect?panels.filter(r=>r.id!=='timeMachine'&&r.bottom>tmRect.y+2&&r.y<tmRect.bottom-2):[];
    const canvas=[...document.querySelectorAll('canvas')].find(visible);
    const canvasRect=canvas?rr(canvas):null;
    return {
      width:innerWidth,height:innerHeight,dpr:devicePixelRatio,
      scrollWidth:document.documentElement.scrollWidth,
      scrollHeight:document.documentElement.scrollHeight,
      rects,panels,tmRect,canvasRect,centre,centreBlocked,escaped,tmOccludes,
      premium:localStorage.getItem('s3.premiumVisuals'),
      mode:globalThis.state?.mode||null,
      s3view:globalThis.state?.s3view||null,
      href:location.href,
    };
  });

  const failures=[];
  if(errors.length)failures.push(`${errors.length} page/console error(s)`);
  if(metrics.scrollWidth>metrics.width+2)failures.push(`horizontal overflow ${metrics.scrollWidth-metrics.width}px`);
  if(!metrics.canvasRect||metrics.canvasRect.width<metrics.width*0.9||metrics.canvasRect.height<metrics.height*0.8)
    failures.push('render canvas does not cover the scientific viewport');
  if(metrics.centreBlocked)failures.push('fixed panel covers the scientific scene centre');
  if(metrics.escaped.length)failures.push(`${metrics.escaped.length} panel(s) escape the viewport`);
  if(metrics.tmOccludes.length)failures.push(`Time Machine overlaps ${metrics.tmOccludes.map(x=>x.id||'panel').join(', ')}`);
  if(metrics.tmRect&&spec.viewport.width<=900&&metrics.tmRect.width<spec.viewport.width*0.96)
    failures.push(`Time Machine uses only ${(100*metrics.tmRect.width/spec.viewport.width).toFixed(1)}% of mobile width`);
  if(metrics.tmRect&&metrics.tmRect.right>spec.viewport.width+2)failures.push('Time Machine extends beyond right edge');
  if(metrics.tmRect&&metrics.tmRect.bottom>spec.viewport.height+2)failures.push('Time Machine extends below viewport');

  const file=join(OUT,`${spec.name}.png`);
  await page.screenshot({path:file,fullPage:false,animations:'disabled'});
  const entry={...spec,metrics,errors:errors.slice(0,20),failures,screenshot:`${spec.name}.png`};
  report.cases.push(entry);
  if(failures.length){
    failed++;
    console.error(`FAIL — ${spec.name}: ${failures.join(' · ')}`);
  }else{
    console.log(`PASS — ${spec.name}: screenshot + layout invariants`);
  }
  await context.close();
}

for(const spec of cases){
  try{await openCase(spec);}
  catch(e){
    failed++;
    report.cases.push({...spec,failures:[String(e?.message||e)],screenshot:null});
    console.error(`FAIL — ${spec.name}: ${String(e?.message||e)}`);
  }
}

writeFileSync(join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
await browser.close();
server.close();

console.log(`\nvisual audit: ${cases.length-failed}/${cases.length} cases green · evidence in artifacts/visual-audit`);
if(failed)process.exit(1);
