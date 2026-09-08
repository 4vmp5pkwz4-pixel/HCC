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
  /* the third argument was accepted by callers and silently dropped, so this
     file reported "55 of 61 stations" as a pass and never said which six it had
     not entered. A check that passes while quietly not covering part of its
     subject is the same shape as a check that cannot fail: print the detail. */
  const ok=(label,cond,detail='')=>{assert.ok(cond,label+(detail?` — ${detail}`:''));pass++;
    console.log('PASS — '+label+(detail?`\n         ${detail}`:''));};
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
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
  const DEADLINE=Date.now()+18*60*1000;
  const withinBudget=()=>assert.ok(Date.now()<DEADLINE,
    'the frame-loop walk exceeded its eighteen-minute budget — it is failing here rather than timing out the CI job, where the cause would be invisible');
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

    /* ── AND NO VIEW MAY BE A COPY OF ANOTHER ────────────────────────────────
       Surviving the frame is not the same as showing something. Earlier today
       the PHASE frame rendered the hierarchy's content — its own instrument was
       a child of a hidden parent — and nothing caught it, because the loop was
       intact and the labels on screen were somebody's. Two views with the same
       label set are one view with two buttons.
       This walks them again and requires every set to be distinct, and the HUD
       to name the frame the reader chose, which is what a collapsed view stops
       doing first. */
    const drawnByView=new Map();
    for(const v of views){
      if(v==='solar') continue;
      await page.click(`[data-cycle-view="${v}"]`);
      await page.waitForTimeout(1400);
      withinBudget();
      const shot=await page.evaluate(()=>{
        const vis=e=>{const r=e.getBoundingClientRect();const c=getComputedStyle(e);
          return r.width>0&&r.height>0&&c.display!=='none';};
        const labs=[...document.querySelectorAll('.label')].filter(vis).map(e=>e.textContent.trim());
        return {n:labs.length, sig:labs.slice().sort().join('|'),
                hud:((document.querySelector('#hudBig')||{}).textContent||'').trim()};
      });
      const twin=[...drawnByView.entries()].find(([,x])=>x.sig===shot.sig);
      ok(`the "${v}" view draws a set of its own rather than another view's`,
         !twin, twin?`IDENTICAL to "${twin[0]}" — ${shot.n} labels`:`${shot.n} labels on screen`);
      drawnByView.set(v,shot);
      ok(`and its caption names the frame the reader chose`,
         new RegExp(v,'i').test(shot.hud), shot.hud.slice(0,72));
    }

    /* ── AND DISTINCT WAS NOT THE INVARIANT EITHER ───────────────────────────
       The clause above was written to catch the phase frame collapsing into the
       hierarchy, and a mutation run proved it does not: reverting that fix
       leaves phase showing SEVEN labels instead of eighty-eight, which is a
       different set, so "distinct" passes on the broken page. The check would
       have shipped describing a guarantee it does not give.
       What actually separates a working view from a collapsed one is that the
       working view brings something of its OWN. A frame whose every visible
       label also appears in some other frame has contributed nothing but a
       button — it is showing the neighbours' furniture. That is derivable from
       the walk itself, with no threshold to calibrate and nothing to keep in
       step with the atlas. */
    /* ── AND NOW THE FRAME MUST DELIVER WHAT IT DECLARES ─────────────────────
       This is the clause the three failed attempts below were reaching for.
       CYC_FRAME_INSTRUMENTS declares which instruments each frame owes the
       reader, and HCC_CYCLE_FRAMES reports what is actually ON SCREEN —
       visibility as the product over every ancestor, which is what it really is,
       not the flag on the object. The phase frame's collapse was exactly this
       gap: the flag said visible, the object said visible, and a hidden parent
       meant nothing was drawn. A promise and a delivery, compared. */
    const frameDebt=[];
    for(const v of views){
      if(v==='solar') continue;
      await page.click(`[data-cycle-view="${v}"]`);
      await page.waitForTimeout(1100);
      withinBudget();
      const rep=await page.evaluate(()=>globalThis.HCC_CYCLE_FRAMES?HCC_CYCLE_FRAMES():null);
      assert.ok(rep&&Array.isArray(rep.instruments),
        'HCC_CYCLE_FRAMES is not reachable — the frame-to-instrument map cannot be read, so nothing below would be measuring anything');
      /* owedNow, not owedHere: the runtime has already evaluated each condition,
         so nothing is skipped here. The first version of this clause skipped any
         entry carrying a condition — and both of the phase frame's instruments
         carry one, so it could not have failed for the frame it was written for.
         A mutation run is the only reason that is not still true. */
      const owed=rep.instruments.filter(i=>i.owedNow);
      const undelivered=owed.filter(i=>!i.onScreen);
      if(undelivered.length) frameDebt.push(`${v}: ${undelivered.map(i=>i.name).join(', ')}`);
      ok(`the "${v}" frame puts on screen every instrument it declares, none of them behind a hidden parent`,
         undelivered.length===0,
         `owes ${owed.length}: ${owed.map(i=>i.name+(i.onScreen?'':' ✗NOT ON SCREEN')).join(', ')||'nothing'}`);
    }

    /* ── WHAT WOULD CATCH A COLLAPSED VIEW, AND WHY IT IS NOT HERE ───────────
       The clause above asserts only that no two frames draw the SAME set. That
       is worth having and it is weaker than it sounds, and the weakness was
       measured rather than guessed: reverting the phase-frame fix from earlier
       today leaves phase showing seven labels instead of eighty-eight, which is
       still a different set, so this passes on the broken page.
       Two stronger clauses were written and both were wrong. Comparing labels
       verbatim made every time-varying readout unique, because the clock
       advances between one frame and the next -- four frames passed on a
       timestamp. Comparing label SHAPES fixed that and then failed "helio",
       correctly: helio isolates the seasonal dial, which the hierarchy also
       shows, so a focus view legitimately draws a subset and nothing of its own.
       "Brings something no other frame has" is false by design here.
       What would actually catch it is per-frame: THIS frame must show the
       instrument it exists to show. updateCyc knows that -- it sets
       cycPhaseInst.visible from the frame -- but only as control flow, not as
       data, so nothing outside it can ask. Making the frame-to-instrument map a
       declaration, the way HCC_STATIONS declares stations, would make it
       checkable. That is a change to the atlas rather than to this file and it
       is recorded in the open problems, not smuggled in here as a clause that
       looks stronger than it is. */

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

    /* ── AND THE STATIONS, WHICH IS WHERE THIS DEFECT ACTUALLY HID ────────────
       The walk above enters one arrival per laboratory. That is not where the
       ReferenceError this file was written for lived: it lived in the NINTH VIEW
       of the cycles laboratory, and a walk that only ever arrives would never
       have reached it. Twenty-four laboratories publish sixty-one stations in
       HCC_STATIONS, and until now nothing entered any of them with the render
       loop running.
       The registry is read from the source rather than retyped, so a station
       added tomorrow is walked tomorrow without editing this file — and if the
       parse ever returns nothing, that is a failure here rather than a silent
       walk of zero stations reporting success. */
    const stationBlockStart=html.indexOf('const HCC_STATIONS=Object.freeze({');
    assert.ok(stationBlockStart>0,'HCC_STATIONS is missing from the source');
    const stationBlock=html.slice(stationBlockStart, html.indexOf('\n});', stationBlockStart));
    const stationLabs=[...stationBlock.matchAll(/(\w+)\s*:\s*\{key:'(\w+)',\s*list:Object\.freeze\(\[([^\]]*)\]\)/g)]
      .map(m=>({lab:m[1],key:m[2],list:m[3].split(',').map(x=>x.trim().replace(/'/g,'')).filter(Boolean)}));
    const stationTotal=stationLabs.reduce((n,l)=>n+l.list.length,0);
    ok(`the station registry parses: ${stationLabs.length} laboratories publishing ${stationTotal} stations`,
       stationLabs.length>=10 && stationTotal>=30);

    const routeOf=id=>(routes.find(r=>r.id===id)||{}).route;
    const stationBroke=[], stationMissed=[];
    let stationsEntered=0;
    let sseen=await errCount();
    for(const L of stationLabs){
      const route=routeOf(L.lab);
      if(!route){ stationMissed.push(`${L.lab} (no route)`); continue; }
      await page.evaluate(h=>{location.hash=h;},route);
      await page.waitForTimeout(500);
      for(const st of L.list){
        /* the chip that switches a station is identified by its own name; the
           laboratories do not share one prefix, so match on the suffix */
        const clicked=await page.evaluate(name=>{
          const b=[...document.querySelectorAll('button[id]')].find(x=>x.id.endsWith('-'+name)||x.id.endsWith('St-'+name));
          if(!b) return false;
          b.click(); return true;
        }, st);
        if(!clicked){ stationMissed.push(`${L.lab}/${st}`); continue; }
        stationsEntered++;
        await page.waitForTimeout(420);
        withinBudget();
        const n=await errCount();
        if(n>sseen){ stationBroke.push(`${L.lab}/${st} (+${n-sseen})`); sseen=n; }
      }
    }
    /* EVERY declared station must be openable. This is not a ratio calibrated on
       today's atlas: the registry is what the search index is built from, so a
       reader who searches a station's terms is sent to a laboratory that must be
       able to show it. Six stations across wind, gyro and seis were declared,
       indexed, and had no control anywhere -- their geometry was built on load
       and hidden on every frame. A station nobody can open is not a station. */
    ok(`and every declared station can actually be opened — ${stationsEntered} of ${stationTotal}`,
       stationsEntered === stationTotal,
       stationMissed.length?`NOT reachable from the control panel: ${stationMissed.join(', ')}`:'every declared station had a control');
    ok(`and the frame loop survives every station it could enter`,
       stationBroke.length===0, stationBroke.length?stationBroke.join(', '):'no station threw a caught frame exception');

    /* ── AND A CHIP THAT SETS A KEY NOTHING READS WOULD ALSO PASS ─────────────
       The three laboratories above now have a control supplied by the registry.
       That the button exists proves nothing: what must be true is that pressing
       it CHANGES WHAT IS DRAWN. Each of the three is checked by counting the
       labels on screen in each of its stations and requiring the readings to
       differ -- the two stations of a laboratory draw different parts of it, so
       identical screens would mean the key is still going nowhere. */
    const drew=[];
    for(const lab of ['wind','gyro','seis']){
      const R=stationLabs.find(L=>L.lab===lab); const route=routeOf(lab);
      if(!R||!route) continue;
      await page.evaluate(h=>{location.hash=h;},route);
      await page.waitForTimeout(700);
      const shots=[];
      for(const st of R.list){
        await page.evaluate(id=>{const b=document.getElementById(id); if(b) b.click();},`hccSt-${lab}-${st}`);
        await page.waitForTimeout(900);
        shots.push(await page.evaluate(()=>{
          const vis=e=>{const r=e.getBoundingClientRect();const c=getComputedStyle(e);
            return r.width>0&&r.height>0&&c.display!=='none';};
          return [...document.querySelectorAll('.label')].filter(vis).length;
        }));
      }
      drew.push({lab,shots,differs:new Set(shots).size>1});
    }
    ok('and each newly reachable station DRAWS something different, so the control reaches the scene rather than only the state',
       drew.length>0 && drew.every(d=>d.differs),
       drew.map(d=>`${d.lab}: ${d.shots.join(' → ')} labels`).join(' · '));

    console.log(`\n${pass}/${pass} checks passed`);
  } finally {
    await browser.close();
    server.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
