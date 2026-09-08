#!/usr/bin/env node
/* WHAT THIS MEASURES, AND WHY IT IS NOT THE SAME AS "THE BUS WORKS".
 *
 * The quantity bus is the atlas's claim to interconnection: a laboratory computes
 * a number, publishes it under a key, and another laboratory can ask for it. That
 * claim was never checked from the READING end. Counting the publications says
 * how much traffic there is; it says nothing about how much of it arrives.
 *
 * Measured on 4.171.0: 257 keys published, 200 of them named in exactly ONE place
 * in the whole file -- the pub() call that creates them. Not a thread row, not a
 * coupling, not a panel. Four fifths of the traffic was addressed to nobody.
 *
 * AND THE FIRST COUNT I TOOK BY HAND WAS WRONG. A grep for [a-z0-9_.]+ missed every
 * key with a capital in it -- bht.TH, bb.lamMax, and fifty-eight others -- and
 * reported 197 published with 148 unread. This file found sixty more keys and
 * twenty-nine more orphans on its first run, which is the whole argument for
 * writing the measurement down as a program instead of a number in a sentence.
 *
 * So this file counts the orphans and holds a CEILING. The ceiling is allowed to
 * fall and never to rise: a release may not add a publication without a reader,
 * and closing orphans is the only way to move the number. It is a debt register,
 * not a pass/fail about correctness -- which is exactly what an interconnection
 * claim needs, because nothing about an orphaned publication is broken. It is
 * simply not a connection, and the atlas said it was.
 */
const fs=require('fs'), path=require('path');
const file=path.join(__dirname,'..','index.html');
const src=fs.readFileSync(file,'utf8');
let pass=0, fail=0;
const ok=(name,cond,detail)=>{ if(cond){pass++;console.log('  PASS — '+name+(detail?' :: '+detail:''));}
  else {fail++;console.log('  FAIL — '+name+(detail?' :: '+detail:''));} };

/* ── every key the atlas publishes ─────────────────────────────────────────── */
const pubs=[...src.matchAll(/ATLAS_BUS\.pub\('([A-Za-z0-9_.]+)'/g)].map(m=>m[1]);
const keys=[...new Set(pubs)].sort();

/* a key is READ when its name appears somewhere other than its own pub() calls.
   Counting occurrences rather than parsing is deliberate: a reader may be a
   thread row, a coupling declaration, a panel or an assertion, and this must not
   have an opinion about which of those counts. */
const occurrences=k=>{
  let n=0, i=0, needle="'"+k+"'";
  for(;;){ const j=src.indexOf(needle,i); if(j<0) break; n++; i=j+needle.length; }
  return n; };
const pubCount=k=>pubs.filter(x=>x===k).length;
const orphans=keys.filter(k=>occurrences(k)<=pubCount(k));

const CEILING=177;   /* 200 before the invariant thread was given four families */
console.log('\nQUANTITY BUS — WHO READS WHAT');
console.log('  published keys ......... '+keys.length);
console.log('  read somewhere ......... '+(keys.length-orphans.length));
console.log('  addressed to nobody .... '+orphans.length+'   (ceiling '+CEILING+')');

ok('the bus publishes what it used to publish, and more',
  keys.length>=257, keys.length+' keys');
ok('ORPHANED PUBLICATIONS ARE UNDER THE CEILING AND THE CEILING ONLY FALLS',
  orphans.length<=CEILING,
  orphans.length+' of '+keys.length+' published keys are named nowhere but their own pub() call'
  +(orphans.length>CEILING?' — lower the debt or do not add the publication: '+orphans.slice(0,8).join(' '):''));

/* ── and the twenty-three that were closed, named individually ─────────────── */
const CLOSED=[
  'fermi.lobe_height','fermi.kinematic_age','fermi.speed_for_magellanic_flare',
  'fermi.age_in_galactic_years','fermi.mean_power','fermi.eddington_fraction',
  'fermi.brighter_than_now','qso.L','adisk.eta',
  'chronometry.long_count_days','chronometry.tzolkin_phase','chronometry.haab_phase',
  'chronometry.calendar_round_phase','chronometry.sexagenary_phase',
  'chronometry.egyptian_civil_phase','chronometry.sothic_phase',
  'cyc.eclipse_year','cyc.saros','cyc.saros_series_years','cyc.great_year',
  'cyc.nutation','cyc.climatic_precession','cyc.mercury_perihelion_rate'];
const stillOrphan=CLOSED.filter(k=>orphans.includes(k));
const notPublished=CLOSED.filter(k=>!keys.includes(k));
ok('every key the thread now reads is actually published by a laboratory',
  notPublished.length===0,
  notPublished.length?('the thread reads keys nobody publishes: '+notPublished.join(' '))
    :(CLOSED.length+' keys, each one produced by a pub() call in the atlas'));
ok('and every one of them has a reader',
  stillOrphan.length===0,
  stillOrphan.length?('still unread: '+stillOrphan.join(' ')):'23 orphans closed by the four new families');

/* ── the thread itself: shape, and where its rows send the reader ──────────── */
const ti=src.indexOf('const INVARIANT_THREAD=[');
const thread=src.slice(ti, src.indexOf('\n];', ti));
const famIds=[...thread.matchAll(/\{id:'([a-z]+)', kind:'(identity|relation)'/g)].map(m=>[m[1],m[2]]);
ok('the invariant thread carries ten families, one of them an identity',
  famIds.length===10 && famIds.filter(f=>f[1]==='identity').length===1,
  famIds.length+' families: '+famIds.map(f=>f[0]+'/'+f[1]).join(' · '));

/* A ROW'S JUMP MUST GO WHERE THE NUMBER IS MADE. Rows marked cyc:1 are published
   from cycles FRAMES, which the s3 view router cannot reach; sending them through
   it would land the reader in a laboratory that does not publish what they clicked. */
const cycRows=[...thread.matchAll(/lab:'([a-z]+)',cyc:1/g)].map(m=>m[1]);
const vi=src.indexOf('const HCC_CYCLE_VIEWS=[');
const frames=[...src.slice(vi, src.indexOf('\n];', vi)).matchAll(/\['([a-z]+)',/g)].map(m=>m[1]);
const badFrames=[...new Set(cycRows)].filter(f=>!frames.includes(f));
ok('every cycles-frame row jumps to a frame that exists',
  cycRows.length>=21 && badFrames.length===0,
  badFrames.length?('no such cycles frame: '+badFrames.join(' '))
    :(cycRows.length+' rows into '+new Set(cycRows).size+' frames: '+[...new Set(cycRows)].join(' ')));
ok('and the panel wires that jump to the cycles router rather than the s3 one',
  /data-cycjump/.test(src) && /\[data-cycjump\][\s\S]{0,200}hccCycleNavigate/.test(src),
  'data-cycjump → hccCycleNavigate');

/* ── the frame whose LABEL names an instrument owes that instrument ────────── */
const di=src.indexOf('const CYC_FRAME_INSTRUMENTS=[');
const decl=src.slice(di, src.indexOf('\n];', di));
const saros=decl.match(/\{name:'cycSarosInst',\s*frames:\[([^\]]*)\]/);
ok('the frame chip that reads "Resonances · Saros" shows the Saros engine',
  !!saros && /'resonance'/.test(saros[1]) && /'hierarchy'/.test(saros[1]),
  saros?('cycSarosInst frames: '+saros[1]):'the declaration no longer names cycSarosInst');

console.log('\n'+(fail?('✖ '+fail+' FAILED, '+pass+' passed'):('✔ ALL '+pass+' CHECKS PASSED')));
process.exit(fail?1:0);
