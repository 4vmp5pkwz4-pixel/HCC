#!/usr/bin/env node
/* The known stars and clusters that trace the Milky Way's arms, resolved to positions
   and embedded in index.html between  / * MWT-DATA-BEGIN * /  and  / * MWT-DATA-END * /.

   Positions: clusters and nebulae from d3-celestial 0.7.35 (dsos.*.json, messier.json),
   Hipparcos stars from the Hipparcos catalogue as carried by @hscmap/vue-stellar-globe
   0.0.14 (radians, J1991.25 — a 9-year proper motion is < 0.05″ for all of these), and
   four objects outside both catalogues from their SIMBAD coordinates, written below.
   Distances are the published ones, each with its source; nothing is fitted.

   Usage: node scripts/build-mw-tracers.mjs <d3-celestial data dir> <hscmap lib dir> */
import fs from 'node:fs'; import path from 'node:path';
const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const D3=process.argv[2]||'/tmp/cat/pkgs/d3c/package/data', HSC=process.argv[3]||'/tmp/cat/pkgs/hsc/package/lib';
const dso=[]; for(const f of ['dsos.bright.json','dsos.14.json','messier.json']) try{ dso.push(...JSON.parse(fs.readFileSync(path.join(D3,f))).features); }catch(e){}
const hip=new Map(); for(const f of fs.readdirSync(HSC)) if(f.endsWith('._json')) try{ const a=JSON.parse(fs.readFileSync(path.join(HSC,f)));
  if(Array.isArray(a)&&Array.isArray(a[0])&&a[0].length===5) for(const r of a) hip.set(r[4],r); }catch(e){}
const hms=(h,m,s)=>15*(h+m/60+s/3600), dms=(sg,d,m,s)=>sg*(d+m/60+s/3600);
/* [key, EN, RU, DE, kind, source-of-position, distance kpc, distance source, note] */
const L=[
 ['etacar','η Carinae','η Киля','η Carinae','star',{simbad:[hms(10,45,3.59),dms(-1,59,41,4.3)]},2.35,'Smith 2006, ApJ 644, 1151 (expansion parallax of the Homunculus)','the most luminous star within ten thousand light years: a luminous blue variable binary of about 100 and 30 solar masses, in the Carina Nebula'],
 ['vycma','VY Canis Majoris','VY Большого Пса','VY Canis Majoris','star',{simbad:[hms(7,22,58.33),dms(-1,25,46,3.2)]},1.17,'Zhang et al. 2012, ApJ 744, 23 (VLBI maser parallax)','a red hypergiant among the largest known stars, about 1 400 solar radii'],
 ['rhocas','ρ Cassiopeiae','ρ Кассиопеи','ρ Cassiopeiae','star',{hip:117863},3.1,'Zsoldos & Percy 1991, A&A 246, 441','a yellow hypergiant that throws off shells of gas in decade-long outbursts'],
 ['pcyg','P Cygni','P Лебедя','P Cygni','star',{hip:100044},1.7,'Najarro et al. 1997, A&A 326, 1117','the luminous blue variable that gave its name to the P Cygni line profile; erupted in 1600'],
 ['cygx1','Cygnus X-1','Лебедь X-1','Cygnus X-1','star',{hip:98298},2.22,'Miller-Jones et al. 2021, Science 371, 1046 (VLBA parallax)','the first black hole ever identified, 21 solar masses, orbiting a blue supergiant'],
 ['rspup','RS Puppis','RS Кормы','RS Puppis','star',{hip:40233},1.91,'Kervella et al. 2014, A&A 572, A7 (light-echo distance)','a Cepheid whose pulsations echo off its own dust nebula — the echo gives its distance to 3 per cent'],
 ['wd1','Westerlund 1','Вестерлунд 1','Westerlund 1','cluster',{simbad:[hms(16,47,4.0),dms(-1,45,51,4.0)]},3.87,'Davies & Beasor 2019, MNRAS 486, L10','the most massive young cluster known in the Galaxy, home of the hypergiant W26'],
 ['pistol','Pistol Star','Звезда Пистолет','Pistol-Stern','star',{simbad:[hms(17,46,15.24),dms(-1,28,50,3.6)]},8.0,'Quintuplet cluster, at the Galactic Centre distance (GRAVITY 2019)','one of the most luminous stars known, hidden by dust 25 000 light years away near the Galactic Centre'],
 ['m42','Orion Nebula','Туманность Ориона','Orionnebel','region',{dso:'NGC 1976'},0.389,'Kounkel et al. 2017, ApJ 834, 142 (VLBA parallaxes)','the nearest large nursery of massive stars'],
 ['m45','Pleiades','Плеяды','Plejaden','cluster',{dso:'M45'},0.136,'Lodieu et al. 2019, A&A 628, A66 (Gaia DR2)','a young open cluster, about 100 million years old'],
 ['m44','Praesepe','Ясли','Praesepe','cluster',{dso:'M44'},0.186,'Lodieu et al. 2019, A&A 628, A66 (Gaia DR2)','the Beehive, 600–700 million years old'],
 ['m7','Ptolemy Cluster','Скопление Птолемея','Ptolemäus-Haufen','cluster',{dso:'NGC 6475'},0.28,'Cantat-Gaudin et al. 2018, A&A 618, A93 (Gaia DR2)','known since antiquity'],
 ['m6','Butterfly Cluster','Скопление Бабочка','Schmetterlingshaufen','cluster',{dso:'NGC 6405'},0.46,'Cantat-Gaudin et al. 2018 (Gaia DR2)',''],
 ['n2264','NGC 2264 · Cone','NGC 2264 · Конус','NGC 2264 · Konus','region',{dso:'NGC 2264'},0.72,'Kuhn et al. 2019, ApJ 870, 32 (Gaia DR2)','the Christmas Tree cluster around S Monocerotis'],
 ['m8','Lagoon Nebula','Туманность Лагуна','Lagunennebel','region',{dso:'NGC 6523'},1.25,'Kuhn et al. 2019 (Gaia DR2)',''],
 ['m16','Eagle Nebula','Туманность Орёл','Adlernebel','region',{dso:'NGC 6611'},1.74,'Kuhn et al. 2019 (Gaia DR2)','the Pillars of Creation'],
 ['m17','Omega Nebula','Туманность Омега','Omeganebel','region',{dso:'NGC 6618'},1.98,'Xu et al. 2011, ApJ 733, 25 (maser parallax)',''],
 ['n6231','NGC 6231','NGC 6231','NGC 6231','cluster',{dso:'NGC 6231'},1.59,'Kuhn et al. 2019 (Gaia DR2)','the core of Sco OB1'],
 ['n6334','Cat\'s Paw Nebula','Туманность Кошачья Лапа','Katzenpfotennebel','region',{dso:'NGC 6334'},1.34,'Chibueze et al. 2014, ApJ 784, 114 (maser parallax)',''],
 ['m11','Wild Duck Cluster','Скопление Дикая Утка','Wildentenhaufen','cluster',{dso:'NGC 6705'},1.9,'Cantat-Gaudin et al. 2018 (Gaia DR2)',''],
 ['rosette','Rosette Nebula','Туманность Розетка','Rosettennebel','region',{dso:'NGC 2244'},1.5,'Kuhn et al. 2019 (Gaia DR2)',''],
 ['heart','Heart Nebula','Туманность Сердце','Herznebel','region',{dso:'IC 1805'},2.1,'Kuhn et al. 2019 (Gaia DR2)',''],
 ['hper','h Persei','h Персея','h Persei','cluster',{dso:'NGC 869'},2.34,'Currie et al. 2010, ApJS 186, 191','with χ Persei the Double Cluster, in the Perseus Arm'],
 ['chiper','χ Persei','χ Персея','χ Persei','cluster',{dso:'NGC 884'},2.34,'Currie et al. 2010, ApJS 186, 191',''],
 ['n7538','NGC 7538','NGC 7538','NGC 7538','region',{dso:'NGC 7538'},2.65,'Moscadelli et al. 2009, ApJ 693, 406 (maser parallax)',''],
 ['n281','Pacman Nebula','Туманность Пакман','Pacman-Nebel','region',{dso:'NGC 281'},2.82,'Sato et al. 2008, PASJ 60, 975 (maser parallax)',''],
 ['n3603','NGC 3603','NGC 3603','NGC 3603','region',{dso:'NGC 3603'},7.2,'Drew et al. 2019, MNRAS 483, 1437','a starburst cluster on the far side of the Carina Arm'],
 ['crab','Crab Nebula','Крабовидная туманность','Krebsnebel','remnant',{dso:'NGC 1952'},2.0,'Trimble 1973, PASP 85, 579','the remnant of the supernova seen in 1054, with its pulsar'],
 ['m67','M67','M67','M67','cluster',{dso:'NGC 2682'},0.86,'Cantat-Gaudin et al. 2018 (Gaia DR2)','one of the oldest open clusters, about four billion years'],
 ['n7000','North America Nebula','Туманность Северная Америка','Nordamerikanebel','region',{dso:'NGC 7000'},0.795,'Kuhn et al. 2020, ApJ 899, 128 (Gaia DR2)',''],
];
const aN=192.85948, dN=27.12825, lN=122.93192, R=Math.PI/180;
const toGal=(ra,de)=>{ const a=ra*R,d=de*R,ap=aN*R,dp=dN*R;
  const sb=Math.sin(d)*Math.sin(dp)+Math.cos(d)*Math.cos(dp)*Math.cos(a-ap);
  const l=lN*R-Math.atan2(Math.cos(d)*Math.sin(a-ap),Math.sin(d)*Math.cos(dp)-Math.cos(d)*Math.sin(dp)*Math.cos(a-ap));
  return [((l/R)%360+360)%360, Math.asin(sb)/R]; };
const out=[];
for(const [key,en,ru,de,kind,pos,d,src,note] of L){
  let ra,dec,from;
  if(pos.simbad){ [ra,dec]=pos.simbad; from='SIMBAD'; }
  else if(pos.hip){ const r=hip.get(pos.hip); if(!r) throw new Error('HIP '+pos.hip+' missing'); ra=r[0]/R; dec=r[1]/R; from='HIP '+pos.hip; }
  else { const x=dso.find(f=>f.id===pos.dso||f.properties.desig===pos.dso); if(!x) throw new Error(pos.dso+' missing'); [ra,dec]=x.geometry.coordinates; from=pos.dso; }
  ra=((ra%360)+360)%360; const [l,b]=toGal(ra,dec);
  out.push({key,n:[en,ru,de],kind,ra:+ra.toFixed(5),de:+dec.toFixed(5),l:+l.toFixed(3),b:+b.toFixed(3),dKpc:d,dSrc:src,pos:from,note});
}
const block=`/* MWT-DATA-BEGIN */\nconst MWT_OBJECTS=${JSON.stringify(out)};\n/* MWT-DATA-END */`;
const p=path.join(ROOT,'index.html'); let html=fs.readFileSync(p,'utf8');
const re=/\/\* MWT-DATA-BEGIN \*\/[\s\S]*?\/\* MWT-DATA-END \*\//;
if(!re.test(html)){ console.error('markers not found'); process.exit(1); }
fs.writeFileSync(p,html.replace(re,()=>block));
console.log(out.map(o=>`${o.key} l=${o.l} b=${o.b} d=${o.dKpc}`).join('\n'));
