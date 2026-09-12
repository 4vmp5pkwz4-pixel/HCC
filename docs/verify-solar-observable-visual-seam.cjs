#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');
const http=require('http');
const assert=require('assert');
const {chromium}=require('playwright');
const {launchChromium}=require('./lib/chromium.cjs');

const ROOT=path.resolve(__dirname,'..');
const OUT=path.join(ROOT,'artifacts','visual-seam');
fs.mkdirSync(OUT,{recursive:true});

let html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const mutated=process.env.HCC_VISUAL_SEAM_MUTATION==='26';
if(mutated){
  const before=html;
  html=html.replace('solarObsOutGly:0.026','solarObsOutGly:26');
  assert.notStrictEqual(html,before,'mutation requested but the 0.026-Gly production seam was not found');
}

/* The verifier needs to drive the REAL camera and REAL transition function without
   adding a testing API to production. Inject a tiny hook into the served copy of the
   main module only. It calls the same autoSolarScale() that the frame loop calls. */
const anchor='try{\n  window.HCC_API={';
assert.ok(html.includes(anchor),'main-module HCC_API anchor not found; visual seam hook has nowhere safe to attach');
const hook=String.raw`
/* test-only hook injected by verify-solar-observable-visual-seam.cjs */
globalThis.__HCC_VISUAL_SEAM__={
  placeSolarGly(gly){
    setMode('solar');
    state.autoScaleHandoff=true;
    _autoScaleCd=0;
    advanceScaleLayer('cosmic');
    controls.target.set(0,0,0);
    const dir=new THREE.Vector3(0.23,0.14,1).normalize();
    camera.position.copy(dir).multiplyScalar(gly*GLY_AU);
    syncCameraClipping(true);
    controls.update();
    autoSolarScale(1/60);
    controls.update();
    return this.read();
  },
  read(){
    const d=camera.position.distanceTo(controls.target);
    return {
      mode:state.mode,
      layer:state.solarScaleLayer,
      cameraDistance:d,
      cameraDistanceGly:state.mode==='solar'?d/GLY_AU:d,
      hud:((document.querySelector('#hudBig')||{}).textContent||'').trim(),
      tickErrors:Number((globalThis.ATLAS_TELEMETRY||{}).tickErrors||0)
    };
  },
  sample(){
    /* Measure actual scene pixels, not DOM presence. A direct render to the default
       framebuffer is deliberate: it asks whether the active Three.js scene contains
       visible energy at this camera, which is exactly what a black scale corridor loses. */
    renderer.setRenderTarget(null);
    renderer.render(scene,camera);
    const gl=renderer.getContext();
    gl.finish();
    const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;
    const px=new Uint8Array(w*h*4);
    gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,px);
    let lit=0, bright=0, sum=0, peak=0;
    const n=w*h;
    for(let i=0;i<px.length;i+=4){
      const m=Math.max(px[i],px[i+1],px[i+2]);
      sum+=m; if(m>peak)peak=m; if(m>6)lit++; if(m>24)bright++;
    }
    return {w,h,meanPeak:sum/n,litFraction:lit/n,brightFraction:bright/n,peak};
  }
};
`;
html=html.replace(anchor,hook+'\n'+anchor);

const VENDOR=path.join(ROOT,'vendor');
if(fs.existsSync(VENDOR)){
  html=html
    .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/build\/three\.module\.js/g,'./vendor/three/build/three.module.js')
    .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/examples\/jsm\//g,'./vendor/three/examples/jsm/')
    .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/@dimforge\/rapier3d-compat@0\.14\.0\/rapier\.es\.js/g,'./vendor/rapier/rapier.es.js');
}

const MIME={'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.html':'text/html'};
function serve(){return new Promise(resolve=>{
  const server=http.createServer((req,res)=>{
    const pathname=decodeURIComponent(new URL(req.url,'http://x').pathname);
    if(pathname==='/'||pathname==='/index.html'){
      res.writeHead(200,{'content-type':'text/html; charset=utf-8'}); res.end(html); return;
    }
    try{
      const f=path.resolve(ROOT,'.'+pathname);
      if(!f.startsWith(ROOT+path.sep)) throw new Error('forbidden');
      const st=fs.statSync(f); const file=st.isDirectory()?path.join(f,'index.html'):f;
      res.writeHead(200,{'content-type':MIME[path.extname(file)]||'application/octet-stream'});
      fs.createReadStream(file).pipe(res);
    }catch(e){ res.writeHead(404); res.end('not found'); }
  });
  server.listen(0,'127.0.0.1',()=>resolve(server));
});}

(async()=>{
  const tag=mutated?'broken-26gly':'current';
  const server=await serve();
  const browser=await launchChromium(chromium,{headless:true});
  let page;
  try{
    const ctx=await browser.newContext({viewport:{width:1280,height:820},deviceScaleFactor:1});
    page=await ctx.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e&&e.message||e)));
    await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForFunction(()=>globalThis.HCC_API&&globalThis.__HCC_VISUAL_SEAM__,null,{timeout:90000});
    await page.evaluate(async()=>{ if(HCC_API.ready) await HCC_API.ready({timeout:30000}); });
    await page.waitForTimeout(1000);

    async function shot(gly,name){
      const placed=await page.evaluate(g=>globalThis.__HCC_VISUAL_SEAM__.placeSolarGly(g),gly);
      await page.waitForTimeout(700);
      const state=await page.evaluate(()=>globalThis.__HCC_VISUAL_SEAM__.read());
      const pixels=await page.evaluate(()=>globalThis.__HCC_VISUAL_SEAM__.sample());
      await page.screenshot({path:path.join(OUT,`${tag}-${name}.png`),fullPage:false});
      console.log(`${name}: ${JSON.stringify({placed,state,pixels})}`);
      return {state,pixels};
    }

    const pre=await shot(0.025,'025gly-pre-seam');
    const post=await shot(0.027,'027gly-post-seam');
    const corridor=await shot(0.5,'500mly-corridor-probe');

    assert.strictEqual(pre.state.mode,'solar','25 Mly must still be rendered by the Solar cosmic layer');
    assert.strictEqual(post.state.mode,'obs','27 Mly must already be rendered by Observable Universe — no black hand-off gap');
    assert.strictEqual(corridor.state.mode,'obs','500 Mly must never remain trapped in the Solar scene');
    assert.strictEqual(pre.state.tickErrors,0,'pre-seam render accumulated tick errors');
    assert.strictEqual(post.state.tickErrors,0,'post-seam render accumulated tick errors');
    assert.strictEqual(corridor.state.tickErrors,0,'corridor probe accumulated tick errors');
    assert.strictEqual(errors.length,0,`browser raised page errors: ${errors.join(' | ')}`);

    for(const [name,s] of [['25 Mly',pre],['27 Mly',post],['500 Mly',corridor]]){
      assert.ok(Number.isFinite(s.pixels.meanPeak)&&s.pixels.peak>0,`${name} framebuffer could not be measured`);
      assert.ok(s.pixels.litFraction>0.00005,`${name} framebuffer is effectively black (${s.pixels.litFraction})`);
    }
    const seamRatio=Math.max(pre.pixels.litFraction,post.pixels.litFraction)/Math.max(1e-9,Math.min(pre.pixels.litFraction,post.pixels.litFraction));
    assert.ok(seamRatio<80,`visible-pixel occupancy collapses across the seam by ${seamRatio.toFixed(1)}×`);

    console.log(`PASS — rendered Solar→Observable seam: 25 Mly solar, 27 Mly observable, 500 Mly observable`);
    console.log(`PASS — visual occupancy stays non-black; seam occupancy ratio ${seamRatio.toFixed(2)}×`);
    console.log(`screenshots — ${path.relative(ROOT,OUT)}/${tag}-*.png`);
  } finally {
    await browser.close().catch(()=>{});
    await new Promise(r=>server.close(r));
  }
})().catch(err=>{ console.error(err&&err.stack||err); process.exit(1); });
