#!/usr/bin/env node
/* Builds the atlas dictionary: every data/i18n/*.json shard is merged, validated and
   written into index.html between <script type="application/json" id="hcc-i18n"> and
   </script>. A shard is { "t": { english: [russian, german] }, "p": [[english, russian,
   german], …] } where "p" entries are templates with {*} (a translated capture) and {#}
   (a number) slots. The build REFUSES a shard whose translation drops or invents a
   number slot, leaves a language empty, or writes Cyrillic into the German column —
   the mistakes a hand-written dictionary actually makes.
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
if(errs.length){ console.error(errs.join('\n')); console.error(`${errs.length} dictionary errors`); process.exit(1); }
const json=JSON.stringify({t,p}).replace(/<\//g,'<\\/').replace(/<!--/g,'<\\!--');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const re=/(<script type="application\/json" id="hcc-i18n">)([\s\S]*?)(<\/script>)/;
const m=html.match(re); if(!m){ console.error('hcc-i18n block not found in index.html'); process.exit(1); }
if(check){ if(m[2]!==json){ console.error('index.html dictionary is stale — run node scripts/build-i18n.mjs'); process.exit(1); }
  console.log(`dictionary current: ${Object.keys(t).length} strings, ${p.length} templates`); process.exit(0); }
fs.writeFileSync(path.join(ROOT,'index.html'),html.replace(re,(_,a,__,c)=>a+json+c));
console.log(`dictionary embedded: ${Object.keys(t).length} strings, ${p.length} templates, ${(json.length/1024).toFixed(0)} KiB`);
