#!/usr/bin/env node
'use strict';
/* ── THE ONE EVENT IN A LABORATORY OF CYCLES ─────────────────────────────────
   Everything else in Cycles repeats and can be counted by waiting. The Fermi
   bubbles happened once, so the only clock is height over speed — and nobody has
   measured the outflow speed directly, which is why the literature argues about
   the age rather than quoting it. The instrument therefore reports the age as a
   FUNCTION of the speed the reader sets and asserts none of its own, and these
   checks exist to keep it that way.

   The geometry is checked against the number the literature quotes, and so is the
   place where the geometry stops working: R0·tan(b) gives 9.75 kpc at fifty
   degrees, which matches the ~10 kpc quoted, and 46 kpc at eighty, against the
   ~14 kpc eROSITA measures. The second number is not published — the X-ray extent
   is carried as a measurement and the tangent is refused up there. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
let pass=0;
const ok=(l,c,d='')=>{assert.ok(c,l+(d?` — ${d}`:''));pass++;console.log('PASS — '+l+(d?`\n         ${d}`:''));};
const num=re=>{const m=html.match(re);assert.ok(m,`missing: ${re}`);return Number(m[1]);};

const R0=num(/const FERMI_R0_KPC=([\d.]+)/);
const LAT=num(/const FERMI_LAT_DEG=([\d.]+)/);
const XR=num(/const FERMI_EROSITA_HEIGHT_KPC=([\d.]+)/);
const VALID=num(/const FERMI_TANGENT_VALID_DEG=([\d.]+)/);
const VMIN=num(/const FERMI_V_MIN_KMS=([\d.]+)/), VMAX=num(/const FERMI_V_MAX_KMS=([\d.]+)/);
const KPC=3.0856775814913673e16, MYR=3.15576e13;
const h=(lat,r0)=>Math.abs(r0*Math.tan(lat*Math.PI/180));
const age=(hh,v)=>hh*KPC/v/MYR;

ok('the Sun–centre distance is the GRAVITY value, not a round number',
   Math.abs(R0-8.178)<0.01, `${R0} kpc`);
ok('and the lobe height it gives at the quoted latitude matches the ~10 kpc in the literature',
   Math.abs(h(LAT,R0)-9.75)<0.15, `${LAT}° → ${h(LAT,R0).toFixed(2)} kpc`);

/* the refusal, which is the part most worth guarding */
ok('the tangent is refused where it diverges rather than extrapolated',
   VALID<80 && VALID>=55, `valid to ${VALID}°; at 80° it would return ${h(80,R0).toFixed(0)} kpc`);
ok('and the X-ray extent is carried as a MEASUREMENT, not derived from a latitude',
   Math.abs(XR-14)<0.5 && /measured extent — not derived from an angle/.test(html), `${XR} kpc`);
ok('the divergence is stated where the constant is, so the next reader does not re-derive it',
   /against the ~14 kpc eROSITA actually measures/.test(html));

/* the age is a function of a choice, and the choice is the reader's */
ok('the age is reported across the whole span of speeds the literature argues',
   VMIN>0 && VMAX>VMIN, `${VMIN}–${VMAX} km/s → ${age(h(LAT,R0),VMAX).toFixed(1)}–${age(h(LAT,R0),VMIN).toFixed(1)} Myr`);
ok('and the atlas asserts no age of its own — the speed is a control, not a constant',
   /id="fermiV"/.test(html) && /state\.fermiVKmS/.test(html),
   'outflow speed is a slider; the age follows from it');
ok('the driver is refused: two mechanisms give lobes of this energy and the instrument names neither',
   /the driver is not decided here/.test(html));

/* it is a first-class frame, by the machinery that exists for that */
ok('the butterfly is declared to its own frame, so its visibility is assigned from the declaration',
   /\{name:'cycButterflyInst',\s*frames:\['butterfly'\]/.test(html));
ok('and it is offered to the reader in the view list and the frame selector',
   /\['butterfly','Galactic butterfly'/.test(html) && /<option value="butterfly"/.test(html));
ok('and it is framed by the camera rather than inheriting whichever frame came before',
   /if\(state\.cycFrame==='butterfly'\)\{[\s\S]{0,240}camera\.position\.copy\(p\)/.test(html));

/* the defect the new frame exposed on its first render */
ok('the Saros engine is declared too — it was assigned nowhere, so it stood in EVERY cycles frame',
   /\{name:'cycSarosInst',\s*frames:\['hierarchy'\]/.test(html),
   'a THREE.Group is born visible; nothing ever wrote cycSarosInst.visible');

/* ── THE WITNESSES, AND WHAT THEY COST ───────────────────────────────────────
   A kinematic age can be tuned to anything by moving the speed, so on its own it
   is a parametrisation rather than evidence. What makes the bubbles datable is
   that other things point at the same moment by methods sharing no assumption:
   the Magellanic Stream's ionisation needs a Sgr A* flare ~3.5 Myr ago, and the
   young stellar disc within a parsec is ~6 Myr old.
   ASKING THEM WHAT SPEED THEY REQUIRE CORRECTED THIS FILE'S OWN CONSTANT. They
   demand 2723 and 1588 km/s, and the encoded band stopped at 1500 — so either
   the witnesses were irrelevant or the band was wrong, and it was the band. The
   fast-outflow models run to several thousand km/s and it is exactly those the
   young dates require. That is the finding, not a fudge to make numbers meet. */
const MAG=num(/const FERMI_MAGELLANIC_FLARE_MYR=([\d.]+)/);
const BURST=num(/const FERMI_GC_STARBURST_MYR=([\d.]+)/);
const speedFor=d=>h(LAT,R0)*KPC/(d*MYR);
ok('two independent dates are carried, neither of which assumes an outflow speed',
   Math.abs(MAG-3.5)<0.01 && Math.abs(BURST-6)<0.01,
   `Magellanic Stream ionisation ${MAG} Myr · young stellar disc ${BURST} Myr`);
ok('and the speed band reaches what those dates require, which the first version did not',
   VMAX >= speedFor(MAG),
   `they demand ${speedFor(MAG).toFixed(0)} and ${speedFor(BURST).toFixed(0)} km/s; the band runs to ${VMAX}`);
ok('the widening is recorded as a correction rather than presented as the original intent',
   /THE BAND WAS TOO NARROW, WHICH THE WITNESSES SHOWED/.test(html));
ok('and agreement is reported, never scored — the reader judges',
   /Agreement is yours to judge/.test(html) && /does not score it/.test(html));

/* ── THE STATEMENT THE ENERGY BUDGET ACTUALLY MAKES ──────────────────────────
   A mean power in erg/s is a number; set beside what Sgr A* CAN emit and what it
   emits now it becomes the argument. Eddington for 4.154e6 M☉ is 5.2e44 erg/s and
   the present output is of order 1e36, so the bubbles need the centre to have run
   near 1e-4 Eddington — some 1e5 times brighter than today. That contrast is the
   case for the accretion story and equally its difficulty, which is why the driver
   stays refused. */
const MSUN=num(/const SGRA_MASS_MSUN=([\d.e+]+)/);
const LNOW=num(/const SGRA_L_NOW_ERG_S=([\de+.]+)/);
const EDD=num(/const EDDINGTON_PER_MSUN=([\d.e+]+)/);
ok('Sgr A* carries the GRAVITY mass and an explicitly order-of-magnitude present output',
   Math.abs(MSUN-4.154e6)/4.154e6<0.01 && LNOW>0 && /order of magnitude only/.test(html),
   `${MSUN.toExponential(3)} M☉ · L_now ~${LNOW.toExponential(0)} erg/s`);
ok('and the energy budget is expressed as a fraction of Eddington and a ratio to today, not as a bare number',
   /fermiEddingtonFraction/.test(html) && /fermiBrighterThanNow/.test(html),
   `Eddington ${(EDD*MSUN).toExponential(2)} erg/s`);
ok('the contrast is stated and the driver is still refused two lines below it',
   /A quiescent hole today, an AGN-like output then/.test(html) && /the driver is not decided here/.test(html));

const pubs=(html.match(/ATLAS_BUS\.pub\('fermi\.(\w+)'/g)||[]).map(x=>x.split("'")[1]);
ok(`and it publishes ${pubs.length} quantities onto the bus from inside itself`, pubs.length>=4, pubs.join(' '));

console.log(`\n${pass}/${pass} checks passed`);
