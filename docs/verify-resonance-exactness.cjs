#!/usr/bin/env node
'use strict';
/* ── EXACT IS A KIND, NOT A DEGREE, AND THE WEB HAD TO BE TOLD ───────────────
   Merging cycleCommensurability onto oscContFrac produced one fact the cycles
   side could not previously state: whether the continued fraction TERMINATED
   (the ratio is the fraction, exactly) or merely hit its denominator cap.

   On the resonance rim exactly one pair of 153 terminates — the Hale cycle is
   twice the sunspot cycle because magnetic polarity returns after two spot
   cycles, a definition rather than a measurement — and the web drew it on the
   same gold ramp as seventy-six numerical near-coincidences. This asserts the
   distinction is drawn, and, more importantly, that it is DERIVED: the colour
   must be routed from c.exact, not painted onto one named pair. A picture that
   hardcodes solar↔hale would pass a check that only looked at the picture. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');

const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
let pass=0;
const ok=(label,cond,detail='')=>{assert.ok(cond,label+(detail?` — ${detail}`:''));pass++;console.log('PASS — '+label+(detail?`\n         ${detail}`:''));};

(async()=>{
  const {cycleCommensurability}=await import(path.join(ROOT,'core','atlas','extracted.mjs'));

  /* the rim's own key list, read from the source rather than retyped here */
  const shortMatch=html.match(/const RESO_SHORT=\{([^}]*)\}/);
  assert.ok(shortMatch,'RESO_SHORT is missing');
  const keys=[...shortMatch[1].matchAll(/(\w+)\s*:/g)].map(m=>m[1]);
  ok(`the rim names ${keys.length} finite cycles`, keys.length>=15);

  /* every period comes from the extracted kernels, so this check and the atlas
     cannot disagree about what a cycle IS */
  const K=await import(path.join(ROOT,'core','atlas','extracted.mjs'));
  const days={moon:K.CYC_SYNODIC,draconic:K.CYC_DRACONIC,anomalistic:K.CYC_ANOMALISTIC,
    sidmonth:K.CYC_SIDEREAL_M,year:K.CYC_TROPICAL_Y,sidyear:K.CYC_SIDEREAL_Y};
  ok('and the periods this check uses are the atlas kernels, not retyped constants',
     Object.values(days).every(v=>Number.isFinite(v)&&v>0));

  /* the one relation that terminates */
  const solarHale=cycleCommensurability({days:4017.6},{days:8035.2});
  ok('the sunspot cycle against the Hale cycle terminates, and terminating is what exact means',
     solarHale.exact===true && solarHale.stopped==='terminated' && solarHale.nA===2 && solarHale.nB===1,
     `${solarHale.nA}:${solarHale.nB} · stopped=${solarHale.stopped} · exact=${solarHale.exact}`);

  /* a tight coincidence is NOT exact, however small its residual */
  const moonYear=cycleCommensurability({days:K.CYC_SYNODIC},{days:K.CYC_TROPICAL_Y});
  ok('and the Metonic relation, tight as it is, is not exact — it has a residual and exactness has none',
     moonYear.exact===false && moonYear.ppm>0,
     `${moonYear.nA}:${moonYear.nB} · ${moonYear.ppm.toFixed(3)} ppm · stopped=${moonYear.stopped}`);

  /* THE POINT: the drawing is routed from the property, not from a pair name */
  const edgeBlock=html.slice(html.indexOf('const tight=c.meaningful'),html.indexOf('resoEdges.push('));
  /* this clause used to be /c\.exact\s*\?/ over the whole block, which passed on a
     mutation that hardcoded the pair into the COLOUR while leaving c.exact in the
     opacity line below it. A clause that cannot fail the way it claims to is worse
     than no clause: it reads as coverage. It now anchors on the colour expression. */
  const colourExpr=edgeBlock.slice(edgeBlock.indexOf('const col='),edgeBlock.indexOf('const baseOpacity='));
  ok('the edge COLOUR is routed from c.exact rather than painted onto a named pair',
     /c\.exact\s*\?/.test(colourExpr), colourExpr.replace(/\s+/g,' ').trim().slice(0,120));
  ok('and no cycle key is hardcoded into that routing, so a restated period changes the picture by itself',
     !/resoNodes\[[ij]\]\.key/.test(colourExpr) && !/'(solar|hale|moon|year|saros|metonic)'/.test(colourExpr));
  ok('the exact edge is labelled as exact, not merely labelled',
     /c\.exact\s*\?\s*`\$\{c\.nA\}:\$\{c\.nB\} exact`/.test(html));
  ok('and an exact edge is always labelled, never dropped by the tightness threshold',
     /if\(c\.exact\|\|tight>0\.55\)/.test(html));

  /* the panel counts the edges rather than repeating a number from prose */
  ok('the panel census is counted off the drawn edges, in all four classes',
     /resoEdges\.filter\(e=>e\.constructed\)\.length/.test(html) &&
     /resoEdges\.filter\(e=>e\.exact&&!e\.constructed\)\.length/.test(html) &&
     /resoEdges\.filter\(e=>e\.meaningful&&!e\.exact\)\.length/.test(html) &&
     /resoEdges\.filter\(e=>!e\.meaningful\)\.length/.test(html));

  /* ── AND THE CENSUS THIS FILE FIRST PUBLISHED WAS WRONG ──────────────────
     The first version of this check retyped the cycle periods into a local table
     and concluded that exactly one pair terminates. Rendering the page showed
     THREE. The check had not been measuring the atlas at all — it agreed with
     its own constants, which is the failure mode this whole suite exists to
     catch, committed by the file written to catch it.
     The atlas defines the Saros as 223*CYC_SYNODIC and the Inex as
     358*CYC_SYNODIC. Their ratios against the synodic month terminate because
     they ARE those multiples: the definition read back, not a lock. So the
     construction is declared on the cycle entry, and what this checks is that
     the declaration is TRUE — a claimed multiple that does not actually
     terminate is a lie in the source, and goes red here. */
  const decls=[...html.matchAll(/\{key:'(\w+)'[^\n]*?constructedFrom:\{key:'(\w+)',times:(\d+)\}/g)]
    .map(m=>({key:m[1],from:m[2],times:Number(m[3])}));
  ok(`the atlas declares which periods it builds from another cycle (${decls.length})`,
     decls.length>=2, decls.map(d=>`${d.key} = ${d.times}×${d.from}`).join(' · '));

  /* ── AND THIS CLAUSE WAS VACUOUS TOO, WHICH THE MUTATION FOUND ────────────
     The first version computed cycleCommensurability({days:times*base},{days:base})
     — using the DECLARED multiplier on both sides. That terminates at 1:times for
     any integer whatsoever, so changing the declaration from 223 to 224 still
     passed. It was a check comparing a claim with itself.
     The declaration has to be tested against the period the atlas ACTUALLY uses,
     which means evaluating the entry's own `days:` expression with the extracted
     kernels in scope — a second witness rather than an echo. A declaration that
     does not match the arithmetic beside it now goes red. */
  const kernelScope=Object.fromEntries(Object.entries(K).filter(([k])=>/^[A-Za-z_$][\w$]*$/.test(k)));
  for(const d of decls){
    const entry=html.slice(html.indexOf(`{key:'${d.key}'`), html.indexOf(`{key:'${d.key}'`)+900);
    const m=entry.match(/days:\s*([^,]+),/);
    assert.ok(m,`the ${d.key} entry has no days expression to check the declaration against`);
    const expr=m[1].trim();
    let actual;
    try{ actual=Function(...Object.keys(kernelScope),`return (${expr});`)(...Object.values(kernelScope)); }
    catch(e){ actual=NaN; }
    const claimed=d.times*K.CYC_SYNODIC;
    ok(`the declaration "${d.key} = ${d.times}× ${d.from}" matches the arithmetic the atlas runs (${expr})`,
       Number.isFinite(actual) && Math.abs(actual-claimed) < 1e-9,
       `atlas computes ${Number(actual).toFixed(6)} d · the declaration claims ${claimed.toFixed(6)} d`);

    /* and, given it matches, the ratio terminates — which is WHY it is a tautology */
    const c=cycleCommensurability({days:actual},{days:K.CYC_SYNODIC});
    ok(`and one ${d.key} therefore terminates at exactly ${d.times} ${d.from}, carrying no information`,
       c.exact===true && c.nA===1 && c.nB===d.times, `${c.nA}:${c.nB} · stopped=${c.stopped}`);
  }

  /* ── AND THIS CLAUSE PINNED A LOCATION, NOT AN INVARIANT ──────────────────
     It required the web to test constructedFrom against a rim node key, which
     was true of the first implementation and stopped being true the moment the
     test moved into cycleCommensurability itself — where it belongs, because
     the web and the linked view were otherwise giving two answers to one
     question. The check went red for the repair. What must hold is that the
     verdict is DERIVED from the declaration and that the drawing reads the
     engine rather than deciding for itself; where the derivation lives is an
     implementation detail and is not the suite's business. */
  ok('the engine derives the tautology from the declared construction, not from a cycle name',
     /best\.tautology=.*constructedFrom|_ctA[\s\S]{0,200}best\.tautology/.test(html) &&
     /best\.tautology=!!\(\(_ctA&&_ctA\.key/.test(html));
  ok('and the drawing reads that one verdict instead of computing a second one',
     /const constructed = c\.tautology;/.test(html));
  /* FOUR surfaces read this one engine — the resonance edge, the linked view,
     the phase-torus panel and the pair readout. Any of them answering for itself
     is how "by construction" and "exact by definition" came to describe the same
     pair on the same page, so all four are pinned here. */
  const surfaces=[
    ['the linked view', /if\(c\.tautology\) return/],
    ['the phase-torus panel row', /c\.tautology\?`\$\{c\.nA\}:\$\{c\.nB\} · BY CONSTRUCTION/],
    ['the selected-pair readout', /c\.tautology[\s\S]{0,80}commensurability BY CONSTRUCTION/],
  ];
  for(const [name,re] of surfaces) ok(`and ${name} reads the same verdict, so no two surfaces can disagree`, re.test(html));
  ok('and a constructed edge is labelled "by construction", never "exact"',
     /constructed\?`\$\{c\.nA\}:\$\{c\.nB\} by construction`/.test(html));
  ok('the panel separates the two, so a reader is never told bookkeeping is evidence',
     /exact by definition/.test(html) && /Exact by construction — worth nothing/.test(html));

  console.log(`\n${pass}/${pass} checks passed`);
})().catch(e=>{console.error(e.message||e);process.exitCode=1;});
