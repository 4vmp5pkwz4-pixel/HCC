#!/usr/bin/env node
'use strict';
/* ── A LABORATORY THAT WEARS ANOTHER INSTRUMENT'S CAPTION ────────────────────
   The s3 tick is a chain of `else if (state.s3view === …)` branches ending in an
   else that rotates the eigenmode sphere and writes the eigenmode caption. A
   laboratory whose view matches no branch does not fail — it silently runs that
   fallback. Seven CIVP laboratories and the Fibonacci anyon laboratory did
   exactly that: a reader standing in "A₄ transfer" was told
   `Eigenmode β = 4 · λ_β = (β²−1)/R²`.

   For CIVP it cost more than a caption. updateCivp carries the only publications
   of civp.residual, civp.delta_lock, civp.index and civp.q_star, and it was
   called from the 'nul' branch — where civpGroup.visible is false. The update ran
   only where the geometry is hidden and never where it is shown, so the values
   never left the laboratory that computes them, and the declared coupling
   civpsel.q_star → civpclo.q could not run from inside either one.

   This walks the laboratories and asserts the thing that has nothing to do with a
   GPU: no laboratory but the eigenmode laboratory itself may wear the eigenmode
   fallback caption, and each CIVP laboratory must name its own station and reach
   the bus. Captions that depend on a shader compiling are deliberately not
   asserted — see the note at the end. */
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {launchChromium}=require('./lib/chromium.cjs');

const ROOT=path.resolve(__dirname,'..');
const VENDOR=path.join(ROOT,'vendor');
const html0=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const html=!fs.existsSync(VENDOR)?html0:html0
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/build\/three\.module\.js/g,'./vendor/three/build/three.module.js')
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/examples\/jsm\//g,'./vendor/three/examples/jsm/')
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/@dimforge\/rapier3d-compat@0\.14\.0\/rapier\.es\.js/g,'./vendor/rapier/rapier.es.js');

const MIME={'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.html':'text/html'};
function serve(){return new Promise(res=>{const s=http.createServer((rq,rs)=>{
  let p=decodeURIComponent(new URL(rq.url,'http://x').pathname);
  if(p==='/'||p==='/index.html'){rs.writeHead(200,{'content-type':'text/html; charset=utf-8'});return rs.end(html);}
  try{const f=path.resolve(ROOT,'.'+p);
    if(!f.startsWith(ROOT+path.sep))throw new Error('forbidden');
    const st=fs.statSync(f);const file=st.isDirectory()?path.join(f,'index.html'):f;
    rs.writeHead(200,{'content-type':MIME[path.extname(file)]||'application/octet-stream'});
    fs.createReadStream(file).pipe(rs);}
  catch(e){rs.writeHead(404);rs.end('not found');}});
  s.listen(0,'127.0.0.1',()=>res(s));});}

(async()=>{
  let pass=0;
  const ok=(label,cond,detail='')=>{assert.ok(cond,label+(detail?` — ${detail}`:''));pass++;
    console.log('PASS — '+label+(detail?`\n         ${detail}`:''));};
  const server=await serve();
  const port=server.address().port;
  const browser=await launchChromium(chromium,{headless:true});
  try{
    const page=await (await browser.newContext({viewport:{width:1400,height:950}})).newPage();
    await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded',timeout:90000});
    await page.evaluate(async()=>{if(globalThis.HCC_API&&HCC_API.ready)await HCC_API.ready({timeout:25000});}).catch(()=>{});

    /* THE FALLBACK IS IDENTIFIED FROM THE SOURCE, not typed in here: whatever the
       final else writes is what a fall-through laboratory will wear. */
    const fallback=(html0.match(/hudBig\.textContent\s*=\s*`Eigenmode β = \$\{b\}[^`]*`/)||[])[0];
    ok('the s3 tick still ends in an eigenmode fallback, which is what a fall-through laboratory wears',
       !!fallback);

    const labs=await page.evaluate(()=>(HCC_API.labs.list()||[])
      .map(l=>({id:l.id,route:l.route,world:l.world})).filter(l=>l.route&&l.world==='s3'));
    ok(`the atlas publishes ${labs.length} S³ laboratory routes to walk`, labs.length>=90);

    /* a settle long enough for a laboratory to rebuild and write its own caption:
       a 600 ms walk reports the PREVIOUS laboratory's caption and would accuse
       sixty innocent laboratories — measured, and the reason this is 2600 */
    const wearers=[];
    const civp={};
    for(const L of labs){
      await page.evaluate(h=>{location.hash=h;},L.route);
      await page.waitForTimeout(2600);
      const r=await page.evaluate(()=>{
        let bus=[];
        try{const a=globalThis.ATLAS_BUS&&ATLAS_BUS.all?ATLAS_BUS.all():{};
          bus=Object.keys(a).filter(k=>/^civp\./.test(k));}catch(e){}
        return {hud:((document.querySelector('#hudBig')||{}).textContent||'').trim(), bus};
      });
      if(/^Eigenmode β = /.test(r.hud)) wearers.push(L.id);
      if(/^civp/.test(L.id)) civp[L.id]=r;
    }

    ok('no laboratory but the eigenmode laboratory itself wears the eigenmode fallback caption',
       wearers.length===0 || (wearers.length===1 && wearers[0]==='eig'),
       wearers.length?`wearing it: ${wearers.join(', ')}`:'none fell through');

    /* the seven CIVP laboratories: each names its own station AND reaches the bus,
       which is the half that mattered more than the caption */
    const ids=Object.keys(civp);
    ok(`all seven CIVP laboratories were reached (${ids.length})`, ids.length===7, ids.join(', '));
    for(const id of ids){
      ok(`${id} names itself rather than another instrument`,
         /^CIVP LOCKING · /.test(civp[id].hud), civp[id].hud.slice(0,78));
    }
    const noBus=ids.filter(id=>!civp[id].bus.includes('civp.residual'));
    ok('and every CIVP laboratory puts its residual on the bus from inside itself',
       noBus.length===0, noBus.length?`silent: ${noBus.join(', ')}`:'civp.residual published in all seven');

    /* WHAT IS NOT ASSERTED HERE, AND WHY. Some captions are written after a shader
       builds — updateBhr returns at `if(!bhrObjs) return` before writing — so on a
       machine with no GPU that laboratory keeps whatever caption preceded it. That
       is a property of the renderer, not of the atlas, and asserting it would make
       this file fail for the machine it runs on rather than for the code. */
    ok('and the caption of a laboratory gated on a shader build is deliberately out of scope',
       /function updateBhr\(dt\)\{\s*const O=bhrObjs;\s*if\(!O\) return;/.test(html0),
       'updateBhr returns at `const O=bhrObjs; if(!O) return;` before its caption, so with no GPU it keeps whatever preceded it');

    console.log(`\n${pass}/${pass} checks passed`);
  } finally {
    await browser.close();
    server.close();
  }
})().catch(e=>{console.error(e.message||e);process.exitCode=1;});
