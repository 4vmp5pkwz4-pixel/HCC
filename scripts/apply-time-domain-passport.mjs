#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const path='index.html';
let s=readFileSync(path,'utf8');

const anchor=\`function hccTimeUnits(world){
  const ids=TIME_WORLD_UNITS[world||state.mode]||TIME_WORLD_UNITS.solar;
  return ids.map(id=>TIME_UNIT_DEFS.find(u=>u.key===id)).filter(Boolean);
}
\`;
if(!s.includes(anchor)) throw new Error('time-units anchor missing');

const passport=String.raw\`
/* ── TIME DOMAIN PASSPORT ─────────────────────────────────────────────────────
   AtlasTime is one mutation authority, NOT one physical interpretation.

   The same epoch coordinate is intentionally shared so instruments can be compared
   and navigated together. What that coordinate MEANS remains local to the active
   world/model. Solar reads J2000 ephemeris/display time; Cycles maps the coordinate
   into many phases; Observable/S³ do not reinterpret it as cosmic age or lookback;
   FBS N / φ remains a scale coordinate; solver clocks remain local to equations. */
function hccTimePassport(){
  const mode=state.mode||'solar', layer=state.solarScaleLayer||'local';
  const make=(domain,axisLabel,compact,detail,extra={})=>({
    schema:'hcc.time-passport/1',
    authority:'AtlasTime',
    mode,
    domain,
    coordinate:'epochDays from J2000',
    axisLabel,
    compact,
    detail,
    ...extra
  });
  if(mode==='solar'){
    if(layer==='local') return make(
      'ephemeris-coordinate','ephem J2000','EPHEMERIS · J2000',
      'J2000-based ephemeris/display epoch. Planetary positions use the Solar ephemeris kernels; outside the declared ephemeris validity range the atlas marks extrapolation. This coordinate is not a universal physical clock.',
      {unit:'day',reference:'J2000',validity:'model-dependent; JPL approximation marked 1800–2050'}
    );
    return make(
      'shared-display-phase','display J2000','DISPLAY PHASE · shared epoch',
      'Shared Atlas epoch drives declared galactic and host-display phases for visual comparison. These periodic display phases are not a claim of rigid-body galactic evolution or a universal dynamical time.',
      {unit:'day',reference:'J2000',layer}
    );
  }
  if(mode==='cyc') return make(
    'phase-coordinate','phase coord','PHASE COORD · shared epoch',
    'One shared epoch is mapped into many cycle phases. Equal epoch input does not make lunar, precessional, calendrical, galactic or historical clock meanings physically identical.',
    {unit:'day input → instrument-specific phase'}
  );
  if(mode==='obs') return make(
    'atlas-coordination','atlas coord','ATLAS COORD · ≠ cosmic age',
    'Atlas coordination epoch for animation/navigation. Cosmological age, lookback times and milestone shells remain separate model data; epochDays is not reinterpreted here as cosmic age or lookback time.',
    {unit:'day coordinate',forbiddenIdentity:'epochDays ≠ cosmological age/lookback'}
  );
  if(mode==='s3') return make(
    'model-coordination','model coord','MODEL COORD · ≠ cosmic age',
    'Shared model/display coordination only. The conditional S³ reconstruction is not evolved by treating epochDays as the age of the Universe, and this clock does not establish topology evolution.',
    {unit:'day coordinate',epistemic:'conditional reconstruction'}
  );
  if(mode==='fbs') return make(
    'atlas-coordination','atlas coord','ATLAS COORD · N ≠ time',
    'Atlas coordination clock only. FBS level N and ×φ ladder are ansatz/model scale coordinates, not time; epochDays is never identified with N, φ-time or a t(N) law.',
    {unit:'day coordinate',forbiddenIdentity:'epochDays ≠ N ≠ phi-time'}
  );
  if(mode==='field') return make(
    'model-local-time','model clocks','MODEL-LOCAL CLOCKS',
    'Atlas epoch coordinates the interface, while solver time and evolution parameters remain local to each active model/equation. Shared UI time does not identify distinct solver clocks.',
    {unit:'model-specific'}
  );
  if(mode==='fractal') return make(
    'display-coordinate','display clock','DISPLAY CLOCK · non-physical',
    'Display/animation coordination only. Fractal iteration depth and semantic zoom are not physical time coordinates.',
    {unit:'display'}
  );
  return make('local-coordinate','local time','LOCAL MODEL TIME','Local model/display coordinate; no implicit cross-world physical time identity.');
}
globalThis.HCC_TIME_PASSPORT=()=>hccTimePassport();
\`;

s=s.replace(anchor,anchor+passport);

const snap=\`  let snap=null; try{ snap=atlasTimeSnapshot(); }catch(e){ return; }
  const paused=!!snap.paused;
\`;
if(!s.includes(snap)) throw new Error('time snapshot anchor missing');
s=s.replace(snap,\`  let snap=null; try{ snap=atlasTimeSnapshot(); }catch(e){ return; }
  const timePassport=hccTimePassport();
  el.dataset.timeDomain=timePassport.domain;
  el.setAttribute('aria-label','Time machine. '+timePassport.detail);
  const paused=!!snap.paused;
\`);

const date=\`  const d=document.getElementById('tmDate'); if(d) d.textContent=simDateString();
\`;
if(!s.includes(date)) throw new Error('tmDate anchor missing');
s=s.replace(date,\`  const d=document.getElementById('tmDate'); if(d){ d.textContent=simDateString(); d.title=timePassport.detail; }
\`);

const sub=\`    sub.textContent='J2000 '+(jd<0?'−':'+')+Math.abs(jd).toFixed(6)+' d · '
      +(jd/365.2425).toFixed(3)+' yr · '+hccTmFmtRate(snap.rateDaysPerSecond)
      +' · '+TT('step','шаг','Schritt')+' '+nexusLang(u.t);
\`;
if(!s.includes(sub)) throw new Error('tmSub anchor missing');
s=s.replace(sub,\`    sub.textContent=timePassport.axisLabel+' · J2000 '+(jd<0?'−':'+')+Math.abs(jd).toFixed(6)+' d · '
      +(jd/365.2425).toFixed(3)+' yr · '+hccTmFmtRate(snap.rateDaysPerSecond)
      +' · '+TT('step','шаг','Schritt')+' '+nexusLang(u.t);
    sub.title=timePassport.detail;
\`);

const note=\`    } else { note.textContent=''; el.style.opacity=''; }
\`;
if(!s.includes(note)) throw new Error('tmNote anchor missing');
s=s.replace(note,\`    } else {
      note.textContent=timePassport.compact;
      note.title=timePassport.detail;
      note.dataset.timeDomain=timePassport.domain;
      el.style.opacity='';
    }
\`);

writeFileSync(path,s);
console.log('Applied hcc.time-passport/1 to Time Machine');
