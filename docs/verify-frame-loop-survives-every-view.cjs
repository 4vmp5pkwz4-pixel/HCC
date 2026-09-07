#!/usr/bin/env node
'use strict';
/* ── THE GUARD THAT KEEPS THE SCREEN ALIVE ALSO KEEPS THE FAILURE QUIET ─────
   tick() wraps tickBody in try/catch so one bad frame can never leave a black
   screen. That is the right call and it is why this defect survived: entering
   the Cycles "Linked analysis" view threw a ReferenceError on the first line of
   its first readout, EVERY FRAME. The catch swallowed it, logged once, and the
   loop kept running — so the page did not crash, it merely stopped doing
   everything that came after the throw: the HUD caption, the cycle bus
   publications, the CSS2D label pass, the hierarchy locator, the XR telemetry.
   From outside it read as "that button does nothing" and "the page got slower".

   The guard already counts what it swallows, in ATLAS_TELEMETRY.tickErrors.
   Nothing had ever read that counter. This does: it enters every view the
   Cycles laboratory offers and every world the atlas offers, and requires the
   counter to still be zero. A caught exception is not a survived exception. */
const fs=require('fs');
const path=require('path');
const http=require('http');
const assert=require('assert');
const {chromium}=require('playwright');
const {launchChromium}=require('./lib/chromium.cjs');

const ROOT=path.resolve(__dirname,'..');
const VENDOR=path.join(ROOT,'vendor');
const html0=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
/* offline runs serve the vendored three.js, exactly as scripts/build-manifest.mjs does */
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
  const ok=(label,cond)=>{assert.ok(cond,label);pass++;console.log('PASS — '+label);};
  const server=await serve();
  const port=server.address().port;
  /* ── DO NOT FORCE SOFTWARE GL ─────────────────────────────────────────────
     The first version of this file passed --use-gl=swiftshader because that is
     what made it run in a container with no GPU. Not one other browser script
     in this repository does that — liveness.mjs, selftest.mjs and
     sensitivity.mjs all call chromium.launch() bare — and the reason showed up
     on the first CI run: forcing software GL made "Every verifier" take
     twenty-six minutes against a two-minute baseline, on a job whose whole
     budget is thirty-five, and the run was heading for a timeout that would
     have read as an unrelated failure. Chromium already falls back to
     SwiftShader by itself when there is no GPU; asking for it explicitly only
     removes the faster path where one exists. */
  const browser=await launchChromium(chromium,{headless:true});

  /* and a walk that grows one laboratory at a time must never again be the
     reason a job dies at its limit: this fails loudly, here, well before it */
  const DEADLINE=Date.now()+9*60*1000;
  const withinBudget=()=>assert.ok(Date.now()<DEADLINE,
    'the frame-loop walk exceeded its nine-minute budget — it is failing here rather than timing out the CI job, where the cause would be invisible');
  try{
    const ctx=await browser.newContext({viewport:{width:1280,height:820}});
    const page=await ctx.newPage();
    await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded',timeout:90000});
    await page.evaluate(async()=>{if(globalThis.HCC_API&&HCC_API.ready)await HCC_API.ready({timeout:25000});}).catch(()=>{});
    /* read it, do not coerce it: an unreachable counter must fail this check
       rather than answer zero. The first draft of this file asked for
       globalThis.ATLAS_TELEMETRY, got undefined, ||0'd it, and passed with the
       defect present — which a mutation run found and this line prevents. */
    const errCount=async()=>{
      const v=await page.evaluate(()=>{
        const T=globalThis.ATLAS_TELEMETRY;
        if(!T||typeof T!=='object') return 'unreachable';
        return Number(T.tickErrors||0);
      });
      assert.notStrictEqual(v,'unreachable','ATLAS_TELEMETRY is not reachable — the counter cannot be read, so nothing below would be measuring anything');
      return v;
    };

    ok('the render loop counts what its black-screen guard swallows, and the count can be read from outside the module',
       typeof await errCount()==='number');
    ok('and the atlas comes up with that count at zero', await errCount()===0);

    await page.click('[data-world="cyc"],[data-mode="cyc"]');
    await page.waitForTimeout(1200);

    const views=await page.$$eval('[data-cycle-view]',ns=>ns.map(n=>n.dataset.cycleView));
    ok(`the Cycles laboratory offers ${views.length} views to walk`, views.length>=9);

    for(const v of views){
      await page.click(`[data-cycle-view="${v}"]`);
      await page.waitForTimeout(900); withinBudget();
      const n=await errCount();
      ok(`the frame loop survives the "${v}" view intact — no caught exception`, n===0);
    }

    /* the linked view is the one that failed, and the failure was invisible from
       the counter alone until you asked whether the view had actually drawn */
    await page.click('[data-cycle-view="linked"]');
    await page.waitForTimeout(1500);
    const linked=await page.evaluate(()=>{
      const vis=e=>{const r=e.getBoundingClientRect();const c=getComputedStyle(e);
        return r.width>0&&r.height>0&&c.display!=='none'&&c.visibility!=='hidden';};
      const all=[...document.querySelectorAll('.label')];
      const own=all.filter(e=>/INTEGRATED INFORMATION|INTEGRATED COMPLEXITY|UNIFIED SCALING|OBSERVER SELECTION|LINKED CYCLES/i.test(e.textContent));
      const reads=all.filter(e=>/phase proximity =|B\/A =/.test(e.textContent));
      return {titles:own.filter(vis).length, readings:reads.filter(vis).length,
              hud:(document.querySelector('#hudBig')||{}).textContent||''};
    });
    ok('and the linked view puts its five lens titles on the screen, not only in the scene graph',
       linked.titles===5);
    ok('and its readouts carry numbers a reader can read, which is what the ReferenceError cost',
       linked.readings>=2);
    ok('and the scene caption names the frame the reader chose',
       /LINKED/i.test(linked.hud));

    /* every world, not only this laboratory: the same guard hides the same class
       of failure everywhere, and no check had ever looked */
    const worlds=await page.$$eval('[data-world],[data-mode]',ns=>[...new Set(ns.map(n=>n.dataset.world||n.dataset.mode))].filter(Boolean));
    for(const w of worlds){
      await page.click(`[data-world="${w}"],[data-mode="${w}"]`).catch(()=>{});
      await page.waitForTimeout(700);
    }
    ok(`the frame loop survives all ${worlds.length} worlds with the counter still at zero`,
       await errCount()===0);

    /* ── AND EVERY LABORATORY, WHICH IS WHERE THIS CLASS ACTUALLY HIDES ───────
       Eleven cycle views and seven worlds is a sample. The defect this file was
       written for lived in ONE view of ONE laboratory and survived because
       nothing ever entered it with the render loop running and then asked
       whether the loop was still whole. There are a hundred and fourteen
       laboratories. Each one is a route the atlas already publishes, so the walk
       costs a loop over api/manifest.json and about a second apiece — cheap
       against a per-frame exception nobody sees for a year.
       The counter is read after EACH route, not once at the end, because "some
       laboratory broke the loop" is a bug report and "civpsel broke the loop"
       is a fix. */
    const routes=await page.evaluate(()=>{
      const L=(globalThis.HCC_API&&HCC_API.labs&&HCC_API.labs.list)?HCC_API.labs.list():[];
      return L.map(l=>({id:l.id,route:l.route})).filter(l=>typeof l.route==='string'&&l.route.startsWith('#/'));
    });
    ok(`the atlas publishes a route for every laboratory (${routes.length})`, routes.length>=100);

    const broke=[];
    const captions=new Set();
    let seen=await errCount();
    for(const r of routes){
      await page.evaluate(h=>{location.hash=h;},r.route);
      await page.waitForTimeout(420); withinBudget();
      captions.add(await page.evaluate(()=>((document.querySelector('#hudBig')||{}).textContent||'').trim()));
      const n=await errCount();
      if(n>seen){ broke.push(`${r.id} (+${n-seen})`); seen=n; }
    }
    /* ── A WALK THAT NAVIGATES NOWHERE PASSES A HUNDRED AND FOURTEEN TIMES ────
       If setting location.hash did not move the atlas, every iteration above
       would read the same zero and this file would report a clean sweep of a
       place it never went. That is the shape of mistake this suite has already
       made once — a counter that could not be read, coerced to zero, passing
       with the defect in the file. So the walk has to prove it MOVED: the scene
       caption is written per laboratory, and a walk that arrived somewhere
       leaves a trail of many different ones. */
    ok(`and the walk actually went somewhere — ${captions.size} distinct scene captions across ${routes.length} routes`,
       captions.size>=Math.min(20,routes.length/4));
    ok(`and the frame loop survives all ${routes.length} laboratories, entered one by one with rendering on`,
       broke.length===0, broke.length?broke.join(', '):'no laboratory threw a caught frame exception');

    console.log(`\n${pass}/${pass} checks passed`);
  } finally {
    await browser.close();
    server.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
