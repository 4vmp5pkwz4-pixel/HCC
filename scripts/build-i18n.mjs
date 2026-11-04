#!/usr/bin/env node
/* Builds the atlas dictionary: every data/i18n/*.json shard is merged, validated and
   written into index.html between <script type="application/json" id="hcc-i18n"> and
   </script>. A shard is { "t": { english: [russian, german] }, "p": [[english, russian,
   german], …] } where "p" entries are templates with {*} (a translated capture) and {#}
   (a number) slots. The build REFUSES a shard whose translation drops or invents a
   number slot, leaves a language empty, or writes Cyrillic into the German column —
   the mistakes a hand-written dictionary actually makes.

   JAPANESE (v4.412) has a column of its own: data/i18n/ja/*.json shards are
   { "ja": { english: japanese }, "pja": [[english template, japanese template], …] }
   and are embedded beside the pairs as "ja" and "pja", not as a third element of
   every pair — a language added later than the other two would otherwise leave a
   hole in every row it has not reached, and every reader of the pairs would have to
   learn to step over the holes. Japanese may need a page's numbers in another order
   than the English, so a Japanese value may name them {#1} {#2} … (the n-th number of
   the English) instead of {#}; the build refuses a value that mixes the two forms,
   drops or invents a number, holds no Japanese at all (unless it is the English
   string itself — a designation such as "Gaia DR3"), or carries Cyrillic.
   Usage: node scripts/build-i18n.mjs [--check] */
import fs from 'node:fs'; import path from 'node:path';
const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const DIR=path.join(ROOT,'data','i18n');
const check=process.argv.includes('--check');
const t={}, p=[], errs=[], seenP=new Set();
const cnt=(s,re)=>(String(s).match(re)||[]).length;
const CYR=/[А-Яа-яЁё]/;
for(const f of fs.readdirSync(DIR).filter(f=>f.endsWith('.json')&&f!=='corpus.json').sort()){
  let j; try{ j=JSON.parse(fs.readFileSync(path.join(DIR,f),'utf8')); }catch(e){ errs.push(`${f}: not JSON — ${e.message}`); continue; }
  for(const [en,v] of Object.entries(j.t||{})){
    if(!Array.isArray(v)||v.length!==2){ errs.push(`${f}: "${en.slice(0,60)}" is not [ru,de]`); continue; }
    const [ru,de]=v;
    if(!ru||!de||!String(ru).trim()||!String(de).trim()){ errs.push(`${f}: "${en.slice(0,60)}" has an empty language`); continue; }
    if(cnt(en,/\{#\}/g)!==cnt(ru,/\{#\}/g)||cnt(en,/\{#\}/g)!==cnt(de,/\{#\}/g)) errs.push(`${f}: number slots differ in "${en.slice(0,60)}"`);
    if(CYR.test(de)) errs.push(`${f}: Cyrillic in the German column of "${en.slice(0,60)}"`);
    if(t[en]&&(t[en][0]!==ru||t[en][1]!==de)) errs.push(`${f}: "${en.slice(0,60)}" translated twice, differently`);
    t[en]=[ru,de];
  }
  for(const e of (j.p||[])){
    if(!Array.isArray(e)||e.length!==3||!e.every(x=>String(x||'').trim())){ errs.push(`${f}: malformed template ${JSON.stringify(e).slice(0,80)}`); continue; }
    const slots=s=>cnt(s,/\{\*\}|\{#\}|\{[0-9]\}/g);
    if(slots(e[1])!==slots(e[0])||slots(e[2])!==slots(e[0])) errs.push(`${f}: template slots differ in "${e[0].slice(0,60)}"`);
    if(CYR.test(e[2])) errs.push(`${f}: Cyrillic in the German template "${e[0].slice(0,60)}"`);
    if(!seenP.has(e[0])){ seenP.add(e[0]); p.push(e); }
  }
}
/* ── the Japanese column ── */
const ja={}, pja=[], seenPJ=new Set();
const JP=/[\u3040-\u30ff\u3400-\u9fff\uff66-\uff9f]/;
const numSlots=(en,v,where)=>{ const nEn=cnt(en,/\{#\}/g), refs=(String(v).match(/\{#([1-9])\}/g)||[]).map(x=>+x[2]);
  if(nEn!==cnt(v,/\{#[1-9]?\}/g)) return `${where}: number slots differ in "${en.slice(0,60)}"`;
  if(refs.length&&cnt(v,/\{#\}/g)) return `${where}: mixes {#} with {#n} in "${en.slice(0,60)}"`;
  if(refs.length&&(new Set(refs).size!==refs.length||refs.some(r=>r>nEn))) return `${where}: {#n} must name each number of the English once in "${en.slice(0,60)}"`;
  return null; };
const JDIR=path.join(DIR,'ja');
for(const f of (fs.existsSync(JDIR)?fs.readdirSync(JDIR).filter(f=>f.endsWith('.json')).sort():[])){
  let j; try{ j=JSON.parse(fs.readFileSync(path.join(JDIR,f),'utf8')); }catch(e){ errs.push(`ja/${f}: not JSON — ${e.message}`); continue; }
  for(const [en,v] of Object.entries(j.ja||{})){
    if(typeof v!=='string'||!v.trim()){ errs.push(`ja/${f}: "${en.slice(0,60)}" is empty`); continue; }
    const e=numSlots(en,v,`ja/${f}`); if(e) errs.push(e);
    if(cnt(en,/\{\*\}/g)!==cnt(v,/\{\*\}/g)) errs.push(`ja/${f}: capture slots differ in "${en.slice(0,60)}"`);
    if(CYR.test(v)) errs.push(`ja/${f}: Cyrillic in the Japanese of "${en.slice(0,60)}"`);
    if(!JP.test(v)&&v!==en) errs.push(`ja/${f}: no Japanese in "${en.slice(0,60)}" → "${v.slice(0,40)}"`);
    if(ja[en]!==undefined&&ja[en]!==v) errs.push(`ja/${f}: "${en.slice(0,60)}" translated twice, differently`);
    ja[en]=v;
  }
  for(const e of (j.pja||[])){
    if(!Array.isArray(e)||e.length!==2||!e.every(x=>String(x||'').trim())){ errs.push(`ja/${f}: malformed template ${JSON.stringify(e).slice(0,80)}`); continue; }
    const slots=s=>cnt(s,/\{\*\}|\{#\}|\{[0-9]\}/g);
    if(slots(e[1])!==slots(e[0])) errs.push(`ja/${f}: template slots differ in "${e[0].slice(0,60)}"`);
    if(CYR.test(e[1])||!JP.test(e[1])) errs.push(`ja/${f}: the Japanese template is not Japanese: "${e[0].slice(0,60)}"`);
    if(!seenPJ.has(e[0])){ seenPJ.add(e[0]); pja.push(e); }
  }
}
if(errs.length){ console.error(errs.join('\n')); console.error(`${errs.length} dictionary errors`); process.exit(1); }
const json=JSON.stringify({t,p,ja,pja}).replace(/<\//g,'<\\/').replace(/<!--/g,'<\\!--');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const re=/(<script type="application\/json" id="hcc-i18n">)([\s\S]*?)(<\/script>)/;
const m=html.match(re); if(!m){ console.error('hcc-i18n block not found in index.html'); process.exit(1); }
if(check){ if(m[2]!==json){ console.error('index.html dictionary is stale — run node scripts/build-i18n.mjs'); process.exit(1); }
  console.log(`dictionary current: ${Object.keys(t).length} strings, ${p.length} templates; Japanese ${Object.keys(ja).length} strings, ${pja.length} templates`); process.exit(0); }
fs.writeFileSync(path.join(ROOT,'index.html'),html.replace(re,(_,a,__,c)=>a+json+c));
console.log(`dictionary embedded: ${Object.keys(t).length} strings, ${p.length} templates; Japanese ${Object.keys(ja).length} strings, ${pja.length} templates; ${(json.length/1024).toFixed(0)} KiB`);
