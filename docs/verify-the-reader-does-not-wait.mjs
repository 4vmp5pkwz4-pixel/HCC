/* THE READER DOES NOT WAIT (v4.438). Measured on the release container, a reader's arrival spent 8.0 s evaluating the
   page's module before its first frame could be drawn, and 47 % of that was the page's own self-tests; most of the rest
   was four computations that were either repeated or done for every texel. This release takes all of it off the path
   to the first frame without changing one number the atlas shows:

     1. the suite is a generator of 388 steps — ?fulltests=1 (the harness, CI) runs it in one go exactly where it always
        ran; a reader's arrival runs it after the first frame, 8 ms at a time, with the camera at rest inside each step
        and handed back after it;
     2. the steps that left something behind — Info opened, the camera 83 units out with the zoom limits at 0.001–10⁷,
        the Solar System's declared ceiling replaced by the S³ section's, the cycles caption in the HUD, a key in the
        reader's storage — put back what they touch, because after the first frame nothing reframes the world behind them;
     3. the galactic brightness grid integrates only the columns whose mirror image is not already on it;
     4. the Milky Way panorama does a row's and a column's arithmetic once per row and column, not per texel;
     5. the non-linear scale of the atlas's cosmology is solved once instead of once per structure;
     6. a quasar's dmax is solved when it is read, and the selection card looks up ONE feed entry without building the
        quasar list — the first click on any object no longer costs a second;
     7. the touch-target clause reads three CSS rules from the style sheets instead of serialising the 25-MB document.

   Every one is checked here by running the page's own code — extracted from index.html — against the code it replaced,
   bit for bit, with no browser and no package. */
import fs from 'node:fs';
const SRC = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const cut = (from, to, inclusive = true) => { const i = SRC.indexOf(from); if (i < 0) throw new Error('marker not found: ' + from.slice(0, 60));
  const j = SRC.indexOf(to, i + from.length); if (j < 0) throw new Error('end marker not found: ' + to.slice(0, 60)); return SRC.slice(i, inclusive ? j + to.length : j); };
const line = (from) => cut(from, '\n', false);

/* ── 1. THE SUITE AS STEPS, AND THE SCHEDULER THAT RUNS THEM ──────────────────────────────────────────────── */
{ const gen = cut('function* hccSelfTestSteps(){', '\n  return T;\n}');
  const yields = (gen.match(/\n {2}yield; /g) || []).length;
  const runner = /function runSelfTests\(\)\{ const it=hccSelfTestSteps\(\); let r=it\.next\(\); while\(!r\.done\) r=it\.next\(\); return r\.value; \}/.test(SRC);
  const deferKept = /const defer=\(label\)=>\{ if\(HEAVY\) return false; HEAVY_LABELS\.push\(label\); return true; \};/.test(gen);
  const eagerAt = SRC.indexOf("if(HCC_SUITE_EAGER){ HCC_SUITE.mode='full'; HCC_SUITE.state='running';"), quality = SRC.indexOf('XRX.applyQuality(XRX.qualityName);', eagerAt);
  const runs = eagerAt > 0 && SRC.indexOf('SELF_TESTS = runSelfTests();', eagerAt) < quality;
  const tail = SRC.indexOf('if(HCC_SUITE_EAGER){ runLateSelfTests();'), door = SRC.lastIndexOf('try{ atlasFrontDoor();', tail);
  const late = tail > 0 && door > 0 && tail - door < 400 && /else hccSuiteAfterFirstFrame\(\);/.test(SRC.slice(tail, tail + 300));
  check(yields >= 380 && runner && deferKept && runs && late,
    'the suite is the same suite as a sequence of steps: ?fulltests=1 runs every step in one go at the place in the boot where it always ran, and a reader\'s arrival hands the same steps to the scheduler after the front door',
    `${yields} steps, each at the head of a top-level statement · runSelfTests drives them to the end · defer() unchanged · eager run ${runs ? 'before' : 'NOT before'} the quality pass · reader run ${late ? 'after' : 'NOT after'} the front door`);
}
{ /* run the page's scheduler on a fake clock, fake frames and fake steps */
  const driver = cut("const HCC_SUITE={state:'pending'", "  try{ requestAnimationFrame(()=>requestAnimationFrame(()=>post(start))); }catch(e){ setTimeout(start,0); }\n}");
  const lateGen = cut('function* hccLateSelfTestSteps(ok){', '\n    yield;\n  }\n}');
  const seal = cut('function hccLateSelfTestSeal(all){', '\n}');
  const make = (scenario) => {
    const env = { now: 0, raf: [], mc: [], seen: [], reports: 0, builds: 0, listeners: {} };
    const performance = { now: () => env.now };
    const requestAnimationFrame = fn => env.raf.push(fn);
    class MessageChannel { constructor() { const self = this; this.port1 = { onmessage: null }; this.port2 = { postMessage: () => env.mc.push(() => self.port1.onmessage && self.port1.onmessage({})) }; } }
    const setTimeout = fn => env.mc.push(fn);
    const controls = { autoRotate: true, dampingFactor: 0.08 };
    const addEventListener = (t, fn) => { (env.listeners[t] = env.listeners[t] || []).push(fn); };
    const removeEventListener = (t, fn) => { env.listeners[t] = (env.listeners[t] || []).filter(f => f !== fn); };
    const SELF_TESTS_LATE = [ok => { env.seen.push(['late', controls.autoRotate, controls.dampingFactor]); ok('late one', true, 'x'); },
                             ok => { ok('late two', true, 'y'); }];
    const body = `${driver}\n${lateGen}\n${seal}\nlet SELF_TESTS=[];\n
      function* hccSelfTestSteps(){ const T=(HCC_SUITE.T=[]);
        for(let i=0;i<scenario.n;i++){ yield; if(i===scenario.throwAt) throw new Error('step '+i+' broke');
          env.seen.push(['main', controls.autoRotate, controls.dampingFactor]); env.now+=scenario.cost(i);
          if(scenario.leaveDrift===i) controls.autoRotate=true;
          T.push({name:'main '+i, pass:!(scenario.failAt||[]).includes(i), detail:''}); }
        return T; }
      function hccSuiteReport(){ env.reports++; } function buildInfo(){ env.builds++; }
      return { HCC_SUITE, hccSuiteAfterFirstFrame, hccSuiteNow, get SELF_TESTS(){ return SELF_TESTS; } };`;
    const api = new Function('performance', 'requestAnimationFrame', 'MessageChannel', 'setTimeout', 'controls', 'SELF_TESTS_LATE', 'env', 'scenario', 'addEventListener', 'removeEventListener', body)
      (performance, requestAnimationFrame, MessageChannel, setTimeout, controls, SELF_TESTS_LATE, env, scenario, addEventListener, removeEventListener);
    return { env, api, controls };
  };
  const run = ({ env, api }, between) => { api.hccSuiteAfterFirstFrame(); const frames = env.raf.length; for (let g = 0; g < 2; g++) { const q = env.raf.splice(0); q.forEach(f => f()); }
    let guard = 0; while (env.mc.length && guard++ < 100000) { const f = env.mc.shift(); f(); env.now += 100; /* a frame between two slices */ if (between) between(guard, env); } return frames; };
  /* A — the normal run: 50 steps of 3 ms */
  const A = make({ n: 50, cost: () => 3, throwAt: -1 }); const beforeState = A.api.HCC_SUITE.state; const f0 = run(A);
  const H = A.api.HCC_SUITE, T = A.api.SELF_TESTS;
  const order = T.slice(0, 50).every((t, i) => t.name === 'main ' + i) && T[50].name === 'late one' && T[51].name === 'late two' && /every post-boot self-test/.test(T[52].name) && T[52].pass;
  const quietMain = A.env.seen.filter(s => s[0] === 'main').every(s => s[1] === false && s[2] === 0);
  const liveLate = A.env.seen.filter(s => s[0] === 'late').every(s => s[1] === true && s[2] === 0.08);
  const handedBack = A.controls.autoRotate === true && A.controls.dampingFactor === 0.08;
  check(beforeState === 'pending' && f0 === 1 && H.state === 'done' && H.mode === 'reader' && order && T.length === 53,
    'a reader\'s suite starts two frames after the boot, runs the post-boot checks first and the suite after them, and reports in the order the eager run reports',
    `state ${beforeState} → ${H.state} · ${T.length} results: 50 steps, 2 post-boot checks, the seal (${T[52].pass ? 'passing' : 'FAILING'}) · ${H.slices} slices`);
  check(H.ms === 150 && H.longest <= 9 + 1e-9 && H.slices === Math.ceil(50 / 3) && Math.abs(api0(A).hccSuiteNow() - (A.env.now - H.paused)) < 1e-9 && H.paused > 0,
    'a slice ends at the first step boundary past 8 ms, and the cost the API reports is the suite\'s own CPU time — the frames drawn between slices are not counted, and the post-boot checks never were',
    `50 × 3 ms of steps reported as ${H.ms} ms over ${H.slices} slices, the longest ${H.longest} ms · ${H.paused} ms of frames between slices left out`);
  check(quietMain && liveLate && handedBack,
    'inside every step of the suite the camera is at rest — no drift, damping factor 0, so a controls.update() applies nothing and keeps the residual — and the reader\'s drift is handed back after each step; the post-boot checks see the live camera',
    `${A.env.seen.filter(s => s[0] === 'main').length} steps saw autoRotate false and damping 0 · ${A.env.seen.filter(s => s[0] === 'late').length} post-boot check saw the drift on · after the run: autoRotate ${A.controls.autoRotate}, damping ${A.controls.dampingFactor}`);
  /* B — a step that throws */
  const B = make({ n: 30, cost: () => 2, throwAt: 20 }); run(B); const TB = B.api.SELF_TESTS;
  const kept = TB.filter(t => /^main /.test(t.name)).length, said = TB.find(t => /ran to its end/.test(t.name));
  check(B.api.HCC_SUITE.state === 'done' && kept === 20 && said && !said.pass && /step 20 broke/.test(said.detail),
    'a step that throws ends the run, keeps every result already reported, and says so as a failing assertion instead of vanishing',
    `${kept} results kept · "${said ? said.detail : 'no failure recorded'}"`);
  /* C — a step that legitimately turns the drift on keeps it on; one long step is one slice */
  const C = make({ n: 12, cost: i => (i === 5 ? 40 : 1), throwAt: -1, leaveDrift: 7 }); run(C);
  check(C.controls.autoRotate === true && C.controls.dampingFactor === 0.08 && C.api.HCC_SUITE.longest >= 40 && C.api.HCC_SUITE.longest < 50,
    'the hold only reverts what it set: a step that turns the drift on itself keeps it, and a step longer than the budget is its own slice rather than a stall of everything after it',
    `drift ${C.controls.autoRotate}, damping ${C.controls.dampingFactor} · longest slice ${C.api.HCC_SUITE.longest} ms for a 40-ms step`);
  /* D — the reader's hand: a trusted gesture between two slices; one failure before it, one after */
  const D = make({ n: 30, cost: () => 3, throwAt: -1, failAt: [3, 25] });
  run(D, (slice, env) => { if (slice === 4) for (const f of (env.listeners.pointerdown || [])) f({ isTrusted: true }); if (slice === 2) for (const f of (env.listeners.keydown || [])) f({ isTrusted: false }); });
  const TD = D.api.SELF_TESTS, HD = D.api.HCC_SUITE, f3 = TD.find(t => t.name === 'main 3'), f25 = TD.find(t => t.name === 'main 25');
  const unhooked = Object.values(D.env.listeners).every(L => L.length === 0);
  check(HD.handStep > 3 && HD.handStep < 25 && HD.afterHand === 1 && /ran after the reader had begun to use the page/.test(f25.detail) && !/ran after/.test(f3.detail) && unhooked,
    'a failure reported after the reader\'s first trusted gesture says that it ran on a page the reader had already changed — and only those: an earlier failure, and an untrusted event, change nothing; the listeners are taken off when the suite ends',
    `gesture after step ${HD.handStep} · failures after it ${HD.afterHand} (step 25 annotated, step 3 not) · listeners left ${unhooked ? 'none' : 'SOME'}`);
  const late = cut("selfTestLate(ok=>{\n    const c=document.getElementById('ctl'), lp=document.getElementById('labPanel');", '\n});');
  const gen2 = cut('function* hccSelfTestSteps(){', '\n  return T;\n}');
  check(/choosing a section of the atlas presents that section/.test(late) && /and the S³ launcher section leaves when S³ does/.test(late) && /in S³ the catalogue arrives with the world and sits directly ABOVE Controls/.test(late)
      && !/choosing a section of the atlas presents that section/.test(gen2),
    'and the three clauses about the panels a reader ARRIVES to are post-boot checks, by the file\'s own rule: they run at the end of the boot under ?fulltests=1 and in the first slice after the first frame otherwise, when the arrival is still what is on the screen',
    'Controls open on a desk and closed on a phone · the S³ launcher only in S³ · the catalogue above Controls — registered with selfTestLate, gone from the steps');
  let resolved = null; A.api.HCC_SUITE.done.then(v => { resolved = v; });
  await Promise.resolve(); await Promise.resolve();
  check(resolved === A.api.SELF_TESTS && A.env.reports === 1 && A.env.builds === 1,
    'and the suite\'s own promise resolves with the results once, after which Info is rebuilt with them',
    `done() resolved with ${resolved ? resolved.length : 'nothing'} results · report ${A.env.reports}× · Info rebuilt ${A.env.builds}×`);
  function api0(x) { return x.api; }
}
{ /* the API, the harness and the Info note */
  const api = /done\(opts\)\{ const o=opts\|\|\{\}, ms=isFinite\(o\.timeout\)\?o\.timeout:60000;/.test(SRC) && /after_first_frame:HCC_SUITE\.mode==='reader'/.test(SRC);
  const H = fs.readFileSync(new URL('../scripts/selftest.mjs', import.meta.url), 'utf8');
  const harness = /await HCC_API\.selftest\.done\(\{ timeout: 240000 \}\)/.test(H) && /if \(r\.after !== true\)/.test(H) && /const READER_BUDGET_MS = 4500;/.test(H);
  const note = /\(HCC_SUITE\.state==='done'\|\|HCC_SUITE\.mode==='full'\)\?`\$\{SELF_TESTS\.filter\(t=>t\.pass\)\.length\}\/\$\{SELF_TESTS\.length\} passed`:'running after the first frame…'/.test(SRC);
  const channel = /ch=new MessageChannel\(\); ch\.port1\.onmessage=/.test(SRC) && !/priority:'background'/.test(SRC);
  check(api && harness && note && channel,
    'agents and the harness can wait for the suite rather than assume it: HCC_API.selftest.done() resolves when it has reported, cost() says when and how it ran, the reader arrival of scripts/selftest.mjs awaits it and fails if it ran before the first frame, and Info says "running" instead of printing a count that is not final',
    `done() ${api ? 'present' : 'MISSING'} · harness ${harness ? 'awaits it, budget 4500 ms kept' : 'NOT updated'} · Info note ${note ? 'honest while running' : 'MISSING'} · slices posted through a MessageChannel (background priority was starved: seven slices in two minutes)`);
}

/* ── 2. WHAT THE STEPS USED TO LEAVE BEHIND ───────────────────────────────────────────────────────────── */
{ const pin = /const orig=probe\?probe\.style\.display:'';/.test(SRC) && /if\(!wasPinned\)\{ PANEL_PINNED\.delete\(probe\.id\); panelPinApply\(probe\); probe\.style\.display=orig; \}/.test(SRC);
  const tm = cut('THE TIME MACHINE, AND THE TWO WAYS A CROSSING CAME LOOSE', '3. THE RE-SOLVE IS LATCHED');
  const cam = /const keepCam=labWalkFrame\(\);/.test(tm) && /camera\.position\.copy\(keepCam\.pos\); controls\.target\.copy\(keepCam\.tgt\);/.test(tm) && /hccRestoreControlDistanceLimits\(\{min:keepCam\.min,max:keepCam\.max,base:keepCam\.base,declaredMax:keepCam\.declared\}/.test(tm) && /restoreAuthority:keepCam\.authority/.test(tm);
  const seams = (SRC.match(/hccRestoreControlDistanceLimits\(\{min:keep\.min,max:keep\.max,base:keep\.base,declaredMax:keep\.declared\},\n\s+\{owner:'selftest:restore',reason:'restore temporary camera-limit fixture',unit:'scene'\},\{restoreAuthority:keep\.authority\}\);/g) || []).length;
  const hud = /const keepHud=\[hudBig\.textContent, hudSub\.textContent\];/.test(SRC) && /finally\{ state\.cycFrame=keepFrame; hudBig\.textContent=keepHud\[0\]; hudSub\.textContent=keepHud\[1\]; \}/.test(SRC);
  const store = /if\(stored===null\) localStorage\.removeItem\('hcc\.labBrowserFolded\.v1'\); else localStorage\.setItem\('hcc\.labBrowserFolded\.v1',stored\);/.test(SRC);
  check(pin && cam && seams === 2 && hud && store,
    'the five steps that left something behind put it back: the pin clause no longer opens Info, the crossing clause returns the camera, its target and its whole declared frame, both framing clauses return the declared frame and the limits\' authority, the cycles tick returns the HUD caption, and the catalogue fold returns the reader\'s storage',
    `pin ${pin ? 'restores the display it found' : 'LEAKS'} · crossing ${cam ? 'restores the frame' : 'LEAKS'} · ${seams}/2 framing clauses restore base, ceiling and authority · HUD ${hud ? 'restored' : 'LEAKS'} · storage ${store ? 'restored' : 'LEAKS'} (each found by diffing the state before and after every step on six arrivals)`);
}
{ const fab = /'\.panel,\.fab,#helpFab,#pureFab,#hud,#mBtns,#landedBanner,#panelDock,'\+/.test(SRC) && /\.\.\.\(fabR\?\[\{x:innerWidth-m-w,y:fabR\.top-8-h\}\]:\[\]\),/.test(SRC);
  const test = /const chrome=\['hccCrumb','navCluster','hccInspector','contextRail','freshBar','clock','panelDock','hud','helpFab'\];/.test(SRC) && /try\{ if\(hierarchyLayoutDirty&&L&&getComputedStyle\(L\)\.display!=='none'\) positionHierarchyLegend\(\); \}catch\(e\)\{\}/.test(SRC);
  const dock = /\.filter\(b=>!b\.hasAttribute\('data-sec'\)&&b\.id!=='dockMore'&&b\.getClientRects\(\)\.length>0\)\.length;/.test(SRC);
  check(fab && test && dock,
    'and two clauses that could only pass before the first frame now hold after it: the hierarchy widget treats the Atlas Coach button as a tenant of its corner and stands above it (measured at 1440×900: the button was drawn over the widget\'s caption), and the dock clause counts the buttons actually drawn',
    `button ${fab ? 'is an obstacle, with the slot above it a candidate' : 'NOT an obstacle'} · locator clause ${test ? 'lists it and places before measuring' : 'UNCHANGED'} · dock clause ${dock ? 'counts drawn primaries' : 'UNCHANGED'}`);
}

/* ── 3–5. THE SAME NUMBERS, FEWER TIMES ────────────────────────────────────────────────────────────────── */
const DEG = Math.PI / 180;
const GAL = new Function(`${cut('const HCC_GALAXY=Object.freeze({', '});')}\n${line('const HCC_GAL_KAPPA=')}\n${cut('function hccGalacticColumn(', '\n  return I;\n}')}
  ${cut('const HCC_GAL_FIELD=(()=>{', '\n})();')}\n${cut('function hccGalacticBrightness(', '\n}')}
  return {HCC_GALAXY, hccGalacticColumn, HCC_GAL_FIELD, hccGalacticBrightness};`)();
{ const G = GAL.HCC_GALAXY, NL = G.gridLon, NB = G.gridLat, ref = new Float32Array(NL * NB); let peak = 0;
  const t0 = performance.now();
  for (let j = 0; j < NB; j++) { const b = (j / (NB - 1) - 0.5) * 180; for (let i = 0; i < NL; i++) { const l = (i / NL) * 360 - 180; const v = GAL.hccGalacticColumn(l, b); ref[j * NL + i] = v; if (v > peak) peak = v; } }
  for (let k = 0; k < ref.length; k++) ref[k] /= peak; const tRef = performance.now() - t0;
  let diff = 0; for (let k = 0; k < ref.length; k++) if (!Object.is(ref[k], GAL.HCC_GAL_FIELD.data[k])) diff++;
  let direct = 0; for (let j = 0; j < NB; j++) { const b = (j / (NB - 1) - 0.5) * 180, jm = NB - 1 - j, bm = (jm / (NB - 1) - 0.5) * 180;
    for (let i = 0; i < NL; i++) { const l = (i / NL) * 360 - 180, im = NL - i; if (!((jm < j && bm === -b) || (im < i && ((im / NL) * 360 - 180) === -l))) direct++; } }
  const mirror = [[30, 10], [123.75, 45.3], [-170.1, 2.2]].every(([l, b]) => { const v = GAL.hccGalacticColumn(l, b); return Object.is(v, GAL.hccGalacticColumn(-l, b)) && Object.is(v, GAL.hccGalacticColumn(l, -b)) && Object.is(v, GAL.hccGalacticColumn(-l, -b)); });
  check(diff === 0 && GAL.HCC_GAL_FIELD.peak === peak && mirror && direct < NL * NB / 2.5,
    'the galactic brightness grid is the same 32 768 values, bit for bit, from about a third of the line-of-sight integrals: the integral is mirror-symmetric to the last bit, and a mirror is used only where the grid coordinate is an exact negative',
    `${diff} of ${ref.length} cells differ from the brute-force grid (${tRef.toFixed(0)} ms here) · peak ${GAL.HCC_GAL_FIELD.peak === peak ? 'identical' : 'DIFFERS'} · ${direct} columns integrated · I(±ℓ,±b) ${mirror ? 'identical' : 'NOT identical'}`);
}
{ /* the panorama: the page's hoisted loop against the per-texel loop it replaced, on the page's own isophotes */
  const isoJSON = cut('<script type="application/json" id="hcc-mw-iso">', '</script>', false).slice('<script type="application/json" id="hcc-mw-iso">'.length);
  const document = { getElementById: () => ({ textContent: isoJSON }) };
  const loopSrc = cut('  { const img=x.createImageData(W,H), d=img.data;', '    x.putImageData(img,0,0);\n  }');
  const mk = new Function('document', 'DEG', 'HCC_GAL_FIELD', 'hccGalacticBrightness', 'W', 'H', `
    ${cut('  const ISO=(()=>{ try{', "catch(e){ console.warn('[milky way isophotes]',e); return null; } })();")}
    ${cut('  const isoAt=(l,b)=>{', '*ty; };')}
    const x={ createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}), putImageData:(img)=>{ x.out=img.data; } };
    ${loopSrc}
    /* the loop as v4.437 wrote it: two function calls per texel */
    const ref=new Uint8ClampedArray(W*H*4);
    for(let j=0;j<H;j++){ const b=(0.5-(j+0.5)/H)*180;
      for(let i=0;i<W;i++){ const l=((i+0.5)/W)*360-180;
        const t=Math.pow(Math.max(0,hccGalacticBrightness(l,b)),0.62)*(ISO?(0.28+0.72*isoAt(l,b)):1);
        const red=Math.min(1,t*1.15), k=(j*W+i)*4;
        ref[k]=Math.min(255,255*t*(0.92+0.10*red)); ref[k+1]=Math.min(255,255*t*(0.88-0.10*red)); ref[k+2]=Math.min(255,255*t*(0.84-0.24*red)); ref[k+3]=255; } }
    return {out:x.out, ref, iso:!!ISO};`);
  const W = 2048, H = 1024, r = mk(document, DEG, GAL.HCC_GAL_FIELD, GAL.hccGalacticBrightness, W, H);
  let diff = 0, lit = 0; for (let k = 0; k < r.ref.length; k++) { if (r.ref[k] !== r.out[k]) diff++; if (k % 4 === 0 && r.ref[k] > 40) lit++; }
  check(r.iso && diff === 0 && lit > W * H * 0.02,
    'the Milky Way panorama is the same image, byte for byte: the row\'s and the column\'s halves of the two bilinear reads are evaluated once per row and once per column with the very expressions of hccGalacticBrightness and isoAt, and the texel keeps only the reads and the blend',
    `${diff} of ${r.ref.length} bytes differ at ${W}×${H} on the embedded d3-celestial isophotes · ${lit} texels of the band brighter than 40/255`);
}
{ /* the non-linear scale, solved once */
  const LSS = new Function('HCC_S3R', `${line('const LSS_PRIM=Object.freeze(')}\n${line('const LSS_C=Object.freeze(')}\n${cut('function lssTransfer(kh,C){', 'return L0/(L0+C0*q*q); }')}
    ${line('const lssTopHat=')}\n${cut('function lssSigma2Raw(R,filt,C){', 'return s*hh/3/(2*Math.PI*Math.PI); }')}\n${line('const LSS_A=')}\n${line('function lssSigma(R,filt,C)')}
    ${cut('let LSS_RNL=null;', 'if(!C) LSS_RNL=r; return r; }')}
    return {LSS_C, lssNonlinearR, get cached(){ return LSS_RNL; }};`)({ H0_km: 67.66, Omega_m: 0.3111, omega_b: 0.02242, T_cmb: 2.7255 });
  const t0 = performance.now(), a = LSS.lssNonlinearR(), t1 = performance.now(), b = LSS.lssNonlinearR(), t2 = performance.now(), c = LSS.lssNonlinearR(LSS.LSS_C);
  check(Object.is(a, b) && Object.is(a, c) && Object.is(LSS.cached, a) && (t2 - t1) < (t1 - t0) / 20,
    'the non-linear scale of the atlas\'s cosmology is solved once and kept — the same double the bisection returns when the cosmology is passed explicitly, which still solves on the spot',
    `R_nl = ${a.toFixed(6)} h⁻¹Mpc · first call ${(t1 - t0).toFixed(1)} ms, second ${(t2 - t1).toFixed(3)} ms`);
}
{ /* a quasar's dmax: the same bisection, when read */
  const Q = new Function(`${cut('function hccLnIntegral(z,f){', 'return (u1/n/3)*s; }')}\n${cut('function hccComovingMpc(z){', 'return 299792.458/67.4*(h/3)*s; }')}\n${line('const QSO_M_LIM=')}
    ${cut('function qsoDmaxMpc(Mv){', 'return hccComovingMpc((zlo+zhi)/2); }')}\nreturn {hccComovingMpc, qsoDmaxMpc, QSO_M_LIM};`)();
  const inline = Mv => { let zlo = 0, zhi = 12; for (let k = 0; k < 40; k++) { const zm = (zlo + zhi) / 2, dl = (1 + zm) * Q.hccComovingMpc(zm), Vm = Mv + 5 * Math.log10(Math.max(dl, 1e-9) * 1e5) - 1.25 * Math.log10(1 + zm); if (Vm < Q.QSO_M_LIM) zlo = zm; else zhi = zm; } return Q.hccComovingMpc((zlo + zhi) / 2); };
  const same = [-29.5, -27.1, -25, -23.4, -21.2].every(Mv => Object.is(inline(Mv), Q.qsoDmaxMpc(Mv)));
  const lazy = /get dmax\(\)\{ const d=qsoDmaxMpc\(this\.Mv\);\n\s+Object\.defineProperty\(this,'dmax',\{value:d,writable:true,enumerable:true,configurable:true\}\); return d; \}\}; \}/.test(SRC)
    && !/dmax:hccComovingMpc\(\(zlo\+zhi\)\/2\)/.test(SRC);
  check(same && lazy,
    'a quasar\'s dmax is the bisection v4.437 ran for all 5 959 of them while building the list, now run when the light census reads it, and the getter replaces itself with the value',
    `qsoDmaxMpc ≡ the inline bisection for five magnitudes · getter ${lazy ? 'in place' : 'MISSING'}`);
}
{ /* the feed, one class at a time */
  const calls = { hip: 0, dso: 0, qso: 0 };
  const F = new Function('calls', `
    const PLANETS=[{name:'Mercury',a:0.387,e:0.2056,rate:149472.67,r:2439.7},{name:'Earth',a:1,e:0.0167,rate:35999.37,r:6371}];
    const HCC_SKY_HIP_NAMES={32349:['Sirius'],27989:['Betelgeuse']};
    function hip3dDecode(){ calls.hip++; return [{hip:32349,bv:0.0,plx:379.2,eplx:1.6,V:-1.46},{hip:27989,bv:1.85,plx:6.55,eplx:0.83,V:0.42}]; }
    let dsoObjs=null; function dsoBuild(){ calls.dso++; dsoObjs={G:[{i:3,dK:780,V:3.4,M:-21.5}]}; }
    const DSO3D_GAL_NAMES={3:['M31',0,0,'Andromeda Galaxy','McConnachie 2005']};
    let qso3dObjs=null; function qso3dBuild(){ calls.qso++; qso3dObjs={Q:[{i:0,name:'3C 273',z:0.158,V:12.9},{i:1,name:'HE 0435',z:1.69,V:17}]}; }
    function hccComovingMpc(z){ return 4285*z; }
    function hrBallesteros(bv){ return 4600*(1/(0.92*bv+1.7)+1/(0.92*bv+0.62)); }
    function hrBolCorr(T){ return -0.1; }
    ${line('const FEED_MSUN_KG=')}\n${line('const FEED_PLANET_KG=')}
    ${line('let FEED_OBJS=null;')}\n${line('function feedObjects(){')}\n${line('function feedPartOf(key){')}\n${line('function feedObjectByKey(key){')}
    ${cut('function feedPart(part){', 'return (FEED_PART[part]=out); }')}
    return {feedObjects, feedObjectByKey};`)(calls);
  const sun = F.feedObjectByKey('sun'), noBuild = calls.hip === 0 && calls.dso === 0 && calls.qso === 0;
  const all = F.feedObjects(), classes = all.map(o => o.cls).join(',');
  const same = all.every(o => F.feedObjectByKey(o.key) === o) && sun === all[0];
  const order = /^sun,planet,planet,star(,star)*,galaxy,quasar,quasar$/.test(classes);
  check(sun && noBuild && same && order && calls.qso === 1,
    'the selection card looks up one object\'s feed entry and builds only that object\'s class: the Sun builds no stars, no galaxies and no quasar list, and the whole list is the same objects — identical, not equal — in the same order',
    `lookup of the Sun built hip ${noBuild ? 0 : calls.hip}, galaxies ${noBuild ? 0 : calls.dso}, quasars ${noBuild ? 0 : calls.qso} · whole list ${classes} · every key resolves to its own object ${same ? 'yes' : 'NO'} · quasar list built ${calls.qso}×`);
}
{ const reads = /const css=\[\.\.\.document\.querySelectorAll\('style'\)\]\.map\(el=>el\.textContent\)\.join\('\\n'\);/.test(SRC) && !/\.test\(document\.documentElement\.innerHTML\)/.test(SRC);
  const css = [...SRC.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
  const found = /\.oscBtn\{min-width:44px;min-height:44px\}/.test(css) && /#tmRate input\[type=range\]\{height:44px\}/.test(css) && /#tmRate\{flex:1 1 96px;min-width:96px\}/.test(css);
  check(reads && found,
    'and the touch-target clause finds its three CSS rules in the style sheets, where they are, instead of serialising the whole document three times to look for them',
    `${(css.length / 1024).toFixed(0)} KB of style sheets read instead of ${(SRC.length / 1048576).toFixed(1)} MB of document, three times · all three rules ${found ? 'found' : 'MISSING'}`);
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
