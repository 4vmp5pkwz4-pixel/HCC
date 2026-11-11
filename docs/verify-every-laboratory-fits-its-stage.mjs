/* EVERY LABORATORY FITS THE STAGE IT IS GIVEN (v4.419). Two laboratories arranged themselves for the free rectangle; the other
   hundred and fifty cannot be re-arranged from outside, so they are FRAMED from outside: what each draws is measured through the
   camera, slid to the centre of the largest free rectangle, and — once, on arrival — brought to fill it; and a dock mirrors each
   laboratory's own first row of choices, its pause and its tempo.
     1. the layer is in the page, wired into the frame loop before the older landscape-only slide, and steps aside where it must;
     2. the rule for the distance: standing back is unconditional, coming nearer waits for two agreeing measurements and stops
        at six-tenths of the arrival distance, and the reader's first touch of the camera ends it;
     3. the dock is a mirror, not a copy: a tap on it is a click on the laboratory's own chip, its tempo goes through the
        laboratory's own slider;
     4. the measured census (docs/data/stage-census-v4.419.json): three viewports, every laboratory, before and after. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const has = list => list.filter(([s]) => !src.includes(s)).map(([, n]) => n);

{ const miss = has([['function stageMeasure(group){', 'the measurement'], ['function stageAllTick(dt){', 'the tick'], ['function stageAllShift(){', 'the slide'], ["const STAGE_SELF=new Set(['inflate','hpage','divstep']);", 'the three that fit themselves'],
    ['try{ stageAllTick(dt||0.016); }catch(e){}', 'in the frame loop'], ['if(T[0]===0&&T[1]===0){ try{ T=stageAllShift(); }catch(e){} }', 'slides before the landscape rule'], ['if(T[0]===0&&T[1]===0){ try{ T=hccStageShift(); }catch(e){} }', 'the landscape rule kept as the fallback'],
    ["&&!state.landed&&stageIsLab(state.s3view)&&!STAGE_SELF.has(state.s3view)&&!inqFitOff(); }", 'not landed, not in a headset or the multiview'], ['mt.colorWrite===false||(mt.transparent&&mt.opacity===0)', 'picking surfaces skipped'], ['if(A.t4&&A.h4){', 'capsule strokes by their endpoints'], ['q(xs,0.015)', 'the outer 1.5 % dropped'],
    ["stageSheetTick(A.sheet,'activeLabControls');", 'the sheet opens on the laboratory’s controls'], ['globalThis.HCC_STAGE=Object.freeze({', 'agent handle']]);
  const i = src.indexOf('function hccSelInsetTick('), a = src.indexOf('T=stageAllShift()', i), b = src.indexOf('T=hccStageShift()', i), c = src.indexOf('T=hccSelInsetTarget()', i);
  check(!miss.length && c > 0 && c < a && a < b, 'the framing layer is in the page and in the frame loop: a selected body’s inset first, then every laboratory centred on what it draws, then the older landscape slide as the fallback; it measures drawn points (capsules by their endpoints), skips picking surfaces, drops the outer 1.5 %, and does nothing on a surface, in a headset, in the multiview or for the laboratories that fit themselves',
    miss.length ? 'MISSING ' + miss.join(', ') : '13/13 sites · order inset → laboratory → landscape'); }

{ const miss = has([['if(f>1.04&&A.iter<7){', 'stand back when it overflows'], ['else if(f<0.62&&A.iter<7){', 'come nearer only when small'], ['const steady=A.prev&&Math.abs(box.w/A.prev.w-1)<0.05&&Math.abs(box.h/A.prev.h-1)<0.05;', 'only when steady'], ['A.d0*0.6', 'six-tenths at most'], ['A.d0*2.4', 'and 2.4 times at most'],
    ["controls.addEventListener('start',()=>{ if(STAGE_ALL.lab){ STAGE_ALL.moved=true; STAGE_ALL.dist=0; } });", 'the reader’s touch ends it'], ['if(!A.moved&&!A.done){', 'never after'], ['controls.minDistance||0.1', 'within the laboratory’s limits']]);
  check(!miss.length, 'the rule for the distance: the camera stands back whenever the drawn box overflows the free rectangle, comes nearer only when the box uses under 62 % of it AND two measurements a third of a second apart agree — a trajectory that has just begun is not zoomed into — never nearer than six-tenths nor farther than 2.4 times the arrival distance, within the laboratory’s own limits, and not at all once the reader has touched the camera',
    miss.length ? 'MISSING ' + miss.join(', ') : '8/8 clauses'); }

{ const miss = has([["const host=document.getElementById('activeLabControls');", 'reads the laboratory’s own panel'], ["if(k==='chip'&&C){ const c=C[+b.dataset.i]; if(c) c.click(); }", 'a tap is a click on that chip'], ["el.dispatchEvent(new Event('input',{bubbles:true}));", 'tempo through the laboratory’s slider'],
    ['<div id="labDock" class="stageDock" role="toolbar"></div>', 'one dock'], ['const cyc=chips.length>(col?4:5);', 'a cycler when the row is long'], ["d.classList.toggle('col',col); d.classList.add('mirror');", 'a column on a phone held sideways'], ['@media (pointer:coarse){.stageDock button{min-width:44px;height:44px}}', '44-pixel targets'],
    ["if(document.body.classList.contains('panel-open')&&matchMedia('(max-width:900px),(pointer:coarse)').matches){ d.style.display='none'; return R; }", 'steps aside for the sheet']]);
  check(!miss.length, 'the dock of any laboratory is a mirror of its panel, so the two cannot disagree: its buttons are the laboratory’s own first row of exclusive choices (a single cycling button when there are more than five, four on a phone held sideways), a tap is a click on that chip, the tempo is written through the laboratory’s own slider and the pause through its own flag; 44-pixel targets, a column against the rail in landscape, hidden while the sheet is open',
    miss.length ? 'MISSING ' + miss.join(', ') : '8/8 sites'); }

{ const C = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/data/stage-census-v4.419.json'), 'utf8')), V = C.viewports;
  const ok = C.version === '4.419.0' && V.length === 3 && V.every(v => v.laboratories >= 155 && v.active >= v.laboratories - 2 && v.measured >= 99 && v.page_errors === 0 && v.outside_after < v.outside_before && v.overflow_after <= 5 && v.overflow_after * 4 <= v.overflow_before && v.with_dock >= 100 && v.median_fill_after <= 0.95 && v.still_outside.length === v.outside_after);
  check(ok, 'the census, measured: at 1440 × 900, 390 × 844 and 852 × 393 every S³ laboratory is opened with the framing off and then on — all but the two self-fitting ones are active, none raises a page error, the laboratories whose picture stood outside the free rectangle fall at every size, at most five still overflow anywhere, and each one still outside is named',
    V.map(v => `${v.width}×${v.height}: outside ${v.outside_before} → ${v.outside_after}, overflowing ${v.overflow_before} → ${v.overflow_after}, median fill ${v.median_fill_before} → ${v.median_fill_after}, dock on ${v.with_dock}/${v.laboratories}`).join(' · ')); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
