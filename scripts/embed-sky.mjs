#!/usr/bin/env node
/* Embeds the whole-sky data into index.html, between the markers
     / * SKY3D-DATA-BEGIN * /  …  / * SKY3D-DATA-END * /
   from three inputs, and writes the trilingual name shard for the dictionary:

   data/sky-3d.json         (scripts/build-sky-3d.py)   every star of the 75 other
                            constellations with a five-parameter solution, placed in 3D
   d3-celestial 0.7.35      (npm, BSD-3-Clause, © Olaf Frohn)
     data/stars.8.json      every Hipparcos star to V = 7: J2000 position, V and B−V
   Stellarium 23.4 star catalogue (Ubuntu noble stellarium-data 23.4-2build3, data from
   ESA's Hipparcos mission, ESA SP-1200, with the 2007 new reduction and Gaia DR2 where
   those are better), stars/default/:
     stars_{0,1,2}_0v0_8.cat  the adopted parallax of every HIP star (Star1 record, 0.01 mas)
     hip_plx_err.dat          its standard error (mas)
     hip_pm.dat               its proper motion μα*, μδ (mas/yr)
     data/starnames.json    star names in English, Russian and German by HIP
     data/constellations.json  constellation names in English, Russian and German

   Usage: node scripts/embed-sky.mjs <d3-celestial data dir> <stellarium stars/default dir> */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const D3=process.argv[2]||'/tmp/cat/pkgs/d3c/package/data';
const STEL=process.argv[3]||'/tmp/cat/stel/x/usr/share/stellarium/stars/default';
const VLIM=7.0;
const sky=JSON.parse(fs.readFileSync(path.join(ROOT,'data/sky-3d.json'),'utf8'));
const zod=JSON.parse(fs.readFileSync(path.join(ROOT,'data/zodiac-3d.json'),'utf8'));
const F=['hip','hr','hd','con','name','bayer','flam','V','bv','ra','de','pmra','pmde','plx','ep','rv','rvSrc','src','otherPlx','q','spanLo','spanHi','fig','aka'];
const SRC={'Gaia DR3':1,'Hipparcos (ESA 1997)':2,'SIMBAD 2018 compilation':3,'none':0,'SIMBAD 2018':3};
const rows=sky.stars.map(s=>F.map(f=>{
  if(f==='spanLo') return s.span?s.span.lo:null;
  if(f==='spanHi') return s.span?s.span.hi:null;
  if(f==='src') return SRC[s.src]??-1;
  if(f==='rvSrc') return s.rvSrc==null?null:(SRC[s.rvSrc]??-1);
  if(f==='fig') return s.fig?1:0;
  if(f==='aka') return (s.aka||[]).filter(a=>a!==s.name);
  return s[f]===undefined?null:s[f];
}));
/* THE ASTROMETRY OF EVERY STAR TO V = 7. Stellarium keeps its adopted parallax in
   the binary zone files: a 32-byte header, one uint32 star count per zone of the
   level's geodesic grid (20·4^level), then 28-byte Star1 records whose first word
   carries the HIP number in its low 24 bits and whose last word is the parallax in
   units of 0.01 mas. The first record of a HIP number wins unless a later one is its
   primary component (component id 0). */
const shaOf=b=>crypto.createHash('sha256').update(b).digest('hex');
const plxOf=new Map(), inputs={};
for(const fn of ['stars_0_0v0_8.cat','stars_1_0v0_8.cat','stars_2_0v0_8.cat']){
  const b=fs.readFileSync(path.join(STEL,fn)); inputs[fn]=shaOf(b);
  if(b.readUInt32LE(0)!==0x835f040a||b.readInt32LE(4)!==0){ console.error(fn+': not a Star1 zone file'); process.exit(1); }
  const zones=20*4**b.readInt32LE(16); let o=32+4*zones, n=0;
  for(let z=0;z<zones;z++) n+=b.readUInt32LE(32+4*z);
  if(o+28*n!==b.length){ console.error(fn+': zone counts do not match the file length'); process.exit(1); }
  for(;o+28<=b.length;o+=28){ const w=b.readUInt32LE(o), hip=w&0xffffff, cid=w>>>24;
    if(hip&&(!plxOf.has(hip)||cid===0)) plxOf.set(hip,b.readInt32LE(o+24)/100); } }
const table=fn=>{ const b=fs.readFileSync(path.join(STEL,fn)); inputs[fn]=shaOf(b); const m=new Map();
  for(const l of b.toString('utf8').split('\n')){ if(!l||l[0]==='#') continue; const a=l.trim().split(/\s+/).map(Number); m.set(a[0],a.slice(1)); }
  return m; };
const eplxOf=table('hip_plx_err.dat'), pmOf=table('hip_pm.dat');
const s8raw=fs.readFileSync(path.join(D3,'stars.8.json')); inputs['stars.8.json']=shaOf(s8raw);
const S8=JSON.parse(s8raw).features;
const dir=[]; const tally={stars:0,withPlx:0,good:0};
for(const f of S8){ const hip=+f.id, V=+f.properties.mag; if(!(V<=VLIM)) continue;
  let [lon,lat]=f.geometry.coordinates; const ra=(lon%360+360)%360;
  const bv=f.properties.bv===''||f.properties.bv==null?null:+f.properties.bv;
  const plx=plxOf.get(hip), e=(eplxOf.get(hip)||[])[0], pm=pmOf.get(hip)||[0,0];
  /* stored WITHOUT loss: ϖ in the catalogue's own 0.01 mas, σϖ in µas, μ in 0.01 mas/yr */
  /* counted on the numbers exactly as the atlas decodes them (hip3dDecode), so the
     declared count and the drawn one cannot differ by a rounding at ϖ/σ = 5 */
  const pD=Math.round((plx>0?plx:0)*100)/100, eD=Math.max(0,Math.min(65535,Math.round((e>0?e:0)*1000)))/1000;
  tally.stars++; if(pD>0) tally.withPlx++; if(pD>0&&eD>0&&pD/eD>=5) tally.good++;
  dir.push([hip,ra,lat,V,Number.isFinite(bv)?bv:null,plx>0?plx:0,e>0?e:0,pm[0]||0,pm[1]||0]); }
dir.sort((a,b)=>a[3]-b[3]||a[0]-b[0]);
const REC=30, buf=Buffer.alloc(dir.length*REC);
const u16=x=>Math.max(0,Math.min(65535,Math.round(x))), i32=x=>Math.max(-2147483648,Math.min(2147483647,Math.round(x)));
dir.forEach(([hip,ra,de,V,bv,plx,e,pa,pd],i)=>{ const o=i*REC;
  buf.writeUInt32LE(hip,o);
  buf.writeUInt32LE(Math.round(ra/360*4294967296)%4294967296,o+4);
  buf.writeInt32LE(Math.round(de*1e7),o+8);
  buf.writeInt16LE(Math.round(V*100),o+12);
  buf.writeInt16LE(bv==null?-32768:Math.round(bv*1000),o+14);
  buf.writeUInt32LE(Math.round(plx*100),o+16);    // ϖ in 0.01 mas (0 = none) — the catalogue's own unit
  buf.writeUInt16LE(u16(e*1000),o+20);            // σϖ in µas (the largest here is well under 65 mas)
  buf.writeInt32LE(i32(pa*100),o+22);             // μα* in 0.01 mas/yr
  buf.writeInt32LE(i32(pd*100),o+26); });         // μδ in 0.01 mas/yr
/* names */
const SN=JSON.parse(fs.readFileSync(path.join(D3,'starnames.json'),'utf8'));
const CN=JSON.parse(fs.readFileSync(path.join(D3,'constellations.json'),'utf8')).features;
const conNames={};
for(const f of CN){ const p=f.properties; conNames[f.id]=[p.en||p.name,p.ru||p.name,p.de||p.name]; }
/* A name another shard already translates keeps that translation: those
   shards were reviewed string by string, this one is generated. */
const curated=new Set();
for(const f of fs.readdirSync(path.join(ROOT,'data/i18n'))){
  if(!/^\d+.*\.json$/.test(f)||f.startsWith('1000-')) continue;
  const j=JSON.parse(fs.readFileSync(path.join(ROOT,'data/i18n',f),'utf8'));
  for(const k of Object.keys(j.t||{})) curated.add(k); }
const t={};
for(const f of CN){ const p=f.properties; const en=p.en||p.name; if(!en||curated.has(en)) continue; t[en]=[p.ru||en,p.de||en]; }
/* Several stars can share one English name (three are called Propus); keep
   the spelling that is actually translated, not a copied fallback. */
const own=(v,en)=>(v[0]!==en)+(v[1]!==en);
for(const hip of Object.keys(SN).sort((a,b)=>a-b)){ const n=SN[hip]; const en=(n.name||'').trim(); if(!en||/^HIP|^HD/.test(en)||curated.has(en)) continue;
  if(!/[A-Za-z]{3}/.test(en)) continue;
  const v=[(n.ru||'').trim()||en,(n.de||'').trim()||en];
  if(t[en]&&own(t[en],en)>=own(v,en)) continue;
  t[en]=v; }
for(const en of Object.keys(t)) if(t[en][0]===en&&t[en][1]===en) delete t[en];   // nothing to say
/* the name and the Bayer/Flamsteed designation of every catalogue star that has one,
   for its card: HIP → [proper name, designation, constellation] */
const hipNames={};
for(const [hip,,,V] of dir){ const n=SN[hip]; if(!n) continue;
  const nm=(n.name||'').trim(), ds=(n.desig||'').trim(), c=(n.c||'').trim();
  if(!nm&&!ds) continue;
  hipNames[hip]=[/^HIP|^HD/.test(nm)?'':nm, ds, c]; }
fs.writeFileSync(path.join(ROOT,'data/i18n/1000-star-and-constellation-names.json'),JSON.stringify({about:'generated by scripts/embed-sky.mjs from d3-celestial 0.7.35 starnames.json and constellations.json (BSD-3-Clause, © Olaf Frohn)',t},null,0));
const block=`/* SKY3D-DATA-BEGIN */
const SKY3D_STARS=[
${rows.map(r=>JSON.stringify(r)).join(',\n')}];
const SKY3D_FIGURES=${JSON.stringify(sky.figures)};
const SKY3D_META=${JSON.stringify(sky.meta)};
const SKY3D_CON_NAMES=${JSON.stringify(conNames)};
/* EVERY STAR TO V = ${VLIM}: ${dir.length} Hipparcos stars, ${tally.good} of them with a parallax
   measured to five standard errors or better. Records of ${REC} bytes, little-endian:
   HIP u32 · RA u32 (2³²/360°) · Dec i32 ×1e7 · V i16 ×100 · B−V i16 ×1000 (−32768 = none)
   · ϖ u32 in 0.01 mas · σϖ u16 in µas · μα* i32 and μδ i32 in 0.01 mas/yr — every value as
   the catalogue gives it, nothing rounded further.
   Positions ICRS at J2000 (d3-celestial stars.8.json); ϖ, σϖ, μ from the Stellarium 23.4
   catalogue (Hipparcos ESA SP-1200 / new reduction 2007 / Gaia DR2). SHA-256 of the inputs:
${Object.entries(inputs).map(([k,v])=>`     ${k} ${v}`).join('\n')} */
const HCC_SKY_HIP_NAMES=${JSON.stringify(hipNames)};
const HCC_SKY_HIP={count:${dir.length},vlim:${VLIM},rec:${REC},good:${tally.good},inputs:${JSON.stringify(inputs)},b64:'${buf.toString('base64')}'};
/* SKY3D-DATA-END */`;
/* the Milky Way as it is OBSERVED: d3-celestial mw.json, five isophote levels with
   their holes (the Great Rift, the Coalsack), quantised to 0.01° as Int16 pairs:
   [level, ringLength, lon×100, lat×100, …] per ring */
const mwRaw=fs.readFileSync(path.join(D3,'mw.json'));
const MW=JSON.parse(mwRaw).features, words=[];
for(const f of MW){ const lvl=+String(f.id).replace(/\D/g,'');
  for(const poly of f.geometry.coordinates) for(const ring of poly){
    words.push(lvl, ring.length);
    for(const [lon,lat] of ring){ words.push(Math.round(lon*100), Math.round(lat*100)); } } }
const mwBuf=Buffer.alloc(words.length*2); words.forEach((w,i)=>mwBuf.writeInt16LE(w,i*2));
const mwSha=crypto.createHash('sha256').update(mwRaw).digest('hex');
const mwJson=JSON.stringify({source:'d3-celestial 0.7.35 data/mw.json (BSD-3-Clause, © Olaf Frohn)',sha256:mwSha,levels:5,b64:mwBuf.toString('base64')});
const p=path.join(ROOT,'index.html'); let html=fs.readFileSync(p,'utf8');
const reMw=/(<script type="application\/json" id="hcc-mw-iso">)([\s\S]*?)(<\/script>)/;
if(!reMw.test(html)){ console.error('hcc-mw-iso block not found'); process.exit(1); }
html=html.replace(reMw,(_,a,__,c)=>a+mwJson+c);
const re=/\/\* SKY3D-DATA-BEGIN \*\/[\s\S]*?\/\* SKY3D-DATA-END \*\//;
if(!re.test(html)){ console.error('markers not found in index.html'); process.exit(1); }
html=html.replace(re,()=>block);
fs.writeFileSync(p,html);
console.log(`sky3d ${rows.length} stars · ${Object.keys(sky.figures).length} figures · catalogue ${dir.length} (V≤${VLIM}, ${tally.good} at ϖ/σ ≥ 5) · names ${Object.keys(t).length} · block ${(block.length/1024).toFixed(0)} KiB`);
