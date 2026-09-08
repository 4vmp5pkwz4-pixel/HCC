#!/usr/bin/env node
'use strict';
/* ── THE ANCIENT CALENDARS, CHECKED AGAINST THEIR OWN ANCHORS ────────────────
   A calendar laboratory is easy to make impressive and hard to make right: the
   arithmetic is unforgiving and every system has a canonical anchor that fixes
   it. These are those anchors, not a re-derivation of the code from itself.

     Long Count 0.0.0.0.0 is 4 Ajaw 8 Kumkʼu — the correlation anchor
     13.0.0.0.0 is 4 Ajaw 3 Kʼankʼin, JDN 2456283, 21 December 2012
     the Calendar Round is 18980 days because 18980 = lcm(260,365)
     the sexagenary cycle is 60 because 60 = lcm(10,12)
     1461 wandering years of 365 days are 1460 Julian years of 365.25

   AND THE POINT OF THE LABORATORY IS THE DISTINCTION, so that is checked too: a
   claim between two integer counts is exact as a theorem, and a claim against a
   measured period carries a residual. Conflating them is the error the whole
   instrument exists to refuse — and the first version of it made that error in
   the other direction, reporting the Calendar Round as NOT exact because 260/365
   is not exactly representable in binary, so its continued fraction never
   terminates and runs to the denominator cap with a residual of exactly zero. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');

const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
let pass=0;
const ok=(label,cond,detail='')=>{assert.ok(cond,label+(detail?` — ${detail}`:''));pass++;
  console.log('PASS — '+label+(detail?`\n         ${detail}`:''));};

/* the kernels are read out of the source and run here, so this file and the atlas
   cannot drift into agreeing with each other by being edited together */
const grab=re=>{const m=html.match(re);assert.ok(m,`missing from index.html: ${re}`);return m[1];};
const NAMES=JSON.parse(grab(/const MAYA_TZOLKIN_NAMES=Object\.freeze\((\[[^\]]*\])\)/).replace(/'/g,'"'));
const MONTHS=JSON.parse(grab(/const MAYA_HAAB_MONTHS=Object\.freeze\((\[[^\]]*\])\)/).replace(/'/g,'"'));
const GMT=Number(grab(/const MAYA_GMT_JDN=(\d+)/));

const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){const t=b;b=a%b;a=t;}return a;};
const lcm=(a,b)=>Math.abs(a*b)/(gcd(a,b)||1);
const lc=d=>[Math.floor(d/144000),Math.floor(d%144000/7200),Math.floor(d%7200/360),Math.floor(d%360/20),d%20].join('.');

/* ── THE OFFSETS COME FROM THE ATLAS, NOT FROM THIS FILE ─────────────────────
   The first version of these anchor checks re-implemented the tzolkin and haab
   formulas here, offsets and all. Changing the atlas's tzolkin offset from +3 to
   +4 — which moves every day-name in the laboratory by one — left this file
   reporting 14/14, because it was checking its own arithmetic against its own
   arithmetic. The offsets are parsed out of index.html now, so a shift there
   fails here, which is the only reason to have the anchors at all. */
const TZ_N=Number(grab(/const mayaTzolkin=days=>\{const d=Math\.floor\(days\);const n=\(\(d\+(\d+)\)%13/));
const TZ_I=Number(grab(/const mayaTzolkin=days=>\{const d=Math\.floor\(days\);const n=[^,]+,i=\(\(d\+(\d+)\)%20/));
const HB_X=Number(grab(/const mayaHaab=days=>\{const d=Math\.floor\(days\);const x=\(\(d\+(\d+)\)%365/));
const tz=d=>{const n=((d+TZ_N)%13+13)%13+1,i=((d+TZ_I)%20+20)%20;return n+' '+NAMES[i];};
const hb=d=>{const x=((d+HB_X)%365+365)%365;return (x%20)+' '+MONTHS[Math.floor(x/20)];};

ok('the day-name and month lists are the twenty and nineteen the system has',
   NAMES.length===20 && MONTHS.length===19, `${NAMES.length} tzolkin names · ${MONTHS.length} haab months`);
ok('the correlation constant is the Goodman–Martinez–Thompson 584283, and it is a scholarly choice rather than a measurement',
   GMT===584283, `MAYA_GMT_JDN = ${GMT}`);
ok('Long Count 0.0.0.0.0 falls on 4 Ajaw 8 Kumkʼu, which is the anchor the correlation is defined by',
   lc(0)==='0.0.0.0.0' && tz(0)==='4 Ajaw' && hb(0)==='8 Kumkʼu', `${lc(0)} · ${tz(0)} · ${hb(0)}`);
ok('and 13.0.0.0.0 falls on 4 Ajaw 3 Kʼankʼin at JDN 2456283 — 21 December 2012',
   lc(1872000)==='13.0.0.0.0' && tz(1872000)==='4 Ajaw' && hb(1872000)==='3 Kʼankʼin' && GMT+1872000===2456283,
   `${lc(1872000)} · ${tz(1872000)} · ${hb(1872000)} · JDN ${GMT+1872000}`);
ok('the Calendar Round is 18980 days, and it is 18980 because that is lcm(260,365)',
   lcm(260,365)===18980, '260 and 365 are both defined counts, so this is arithmetic and not observation');
ok('the sexagenary cycle is 60 because 60 = lcm(10,12), not because sixty was chosen',
   lcm(10,12)===60);
ok('1461 wandering years of 365 days are exactly 1460 Julian years',
   1461*365===533265 && 533265/365.25===1460, '533265 days — exact in the 365 vs 365.25 idealisation the claim is stated in');

/* the distinction the laboratory exists to draw */
ok('a claim between two integer counts is decided by integer arithmetic rather than a float expansion',
   /function chronIntegerClaim\(a,b\)/.test(html) && /chronIsInt\(a\)&&chronIsInt\(b\)/.test(html),
   'the Calendar Round came back NOT exact while its residual was exactly zero, because 260⁄365 is not representable in binary');
ok('and each claim records WHICH warrant it carries, since a gcd and a terminating expansion are not the same evidence',
   /basisKind:/.test(html) && /integer arithmetic/.test(html) && /continued-fraction convergents/.test(html));
ok('the tun is not presented as a year — the gap is stated where the column is drawn',
   /the tun is 360 days, not a year/.test(html));
ok('and a phase is never presented as a date: the correlation constant is named as a choice',
   /a phase is not a date/.test(html) && /correlation constant/.test(html));

/* the connections, which is what the laboratory had none of */
const rel=(html.match(/\['chronometry','(\w+)','(\w+)'/g)||[]).map(x=>x.slice(1));
ok(`ancient chronometry carries ${rel.length} typed relations into the atlas, having arrived with none`,
   rel.length>=4, rel.join(' · '));
ok('and it is a node in the Nexus, so those relations have something to attach to',
   /'rmhd','chronometry'/.test(html) || /'chronometry',\.\.\.labDeclIn/.test(html));

const pubs=(html.match(/ATLAS_BUS\.pub\('chronometry\.(\w+)'/g)||[]).map(x=>x.split("'")[1]);
ok(`and it publishes ${pubs.length} phases onto the bus from inside itself`,
   pubs.length>=6, pubs.join(' '));

console.log(`\n${pass}/${pass} checks passed`);
