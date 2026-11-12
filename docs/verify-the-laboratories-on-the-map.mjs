/* THE LABORATORIES ON THE MAP OF THE UNIVERSE (v4.425) — asked: find, in the laboratories, everything that can stand on the atlas
   of the universe and on its horizons. Walking every typed instrument found 205 outputs that are lengths, times, angles,
   temperatures, rates or redshifts, in 74 laboratories. Each is now classified, and the ones that are places are drawn — live,
   by calling the laboratory's own instrument — on the shared horizons (χ_p(∞), the distance laboratory's source, the D_A
   turnover, the Hubble tension as three spheres, the de Sitter radius, the type Ia reach) and in the Galaxy (the Fermi bubbles,
   Gaia's parallax reach, Leavitt's rung on the LMC, the rotation curves of the Milky Way and M31). Checked here, on the
   SKYMAP-MATH block lifted out of index.html as it stands, on the extracted kernels and on the instruments themselves:
     1. the census is complete: every candidate output has a class, and every class names something that exists;
     2. every place stands on its laboratory's own number — and on an independent first-principles formula;
     3. two programs, one number: the laboratories' integrators, run on the map's own parameters, give the map's horizons;
     4. the Hubble sphere and the event horizon converge onto the de Sitter sphere as the clock runs;
     5. the ladder moves together: a zero-point shift Δμ moves every distance by 10^(Δμ/5) and H₀ by 10^(−Δμ/5), so H₀·d
        stands still — the repaired sign (the LMC used to come CLOSER while H₀ fell);
     6. the type Ia reach is a luminosity distance, z = 1.06 on the map's cosmology — not the 1.8 of a straight Hubble law;
     7. the wiring: the clock tick, the two panels, the passports, the cards' actions, and an honest contract on every place;
     8. the captions: the chosen place outranks every caption in both label guards, a hidden caption holds no room, and on a
        narrow screen the chosen shell's label stands at the top of its sphere. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'manifest.json'), 'utf8'));
const X = await import(path.join(ROOT, 'core', 'atlas', 'extracted.mjs'));
const K = await import(path.join(ROOT, 'core', 'atlas', 'instruments.mjs'));
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const lift = (a, b, names, pre = '') => { const i0 = src.indexOf(a), i1 = src.indexOf(b, i0); if (i0 < 0 || i1 < i0) throw new Error('block missing: ' + a);
  return new Function(`${pre}${src.slice(i0, i1)}\nreturn {${names.join(',')}};`)(); };
const M = lift('/* ═══ SKYMAP-MATH-BEGIN ═══', '/* ═══ SKYMAP-MATH-END ═══', ['SKY_MPC_GLY', 'SKY_C_KMS', 'SKY_PC_AU', 'SKYMAP_UNITS', 'skymapCandidate', 'SKYMAP_IDS', 'SKYMAP_CENSUS',
  'skymapClass', 'skymapCensusOf', 'skyZOfDL', 'SKY_PLACE', 'skyLadderInvariant']);
const S = lift('/* ═══ SKY-MATH-BEGIN ═══', '/* ═══ SKY-MATH-END ═══', ['iskyModel', 'iskyReach']);
const rel = (a, b) => Math.abs(a / b - 1), C = X.CT_COSMO, H = X.hzTable(), t0 = X.hzAgeAtA(1), h0 = X.hzAtT(t0), H0c = X.HCC_S3R.H0_km;
const inst = id => K.INSTRUMENTS[id], defaults = id => { const sp = manifest.instruments.find(s => s.id === id), o = {};
  for (const f of (sp && sp.inputs) || []) o[f.name] = typeof f.default === 'object' && f.default !== null ? undefined : f.default; return o; };
const run = (id, over) => inst(id)({ ...defaults(id), ...(over || {}) });
/* 1 — THE CENSUS */
{ const C1 = M.skymapCensusOf(manifest.instruments), ids = new Set(manifest.instruments.map(s => s.id));
  const outs = new Map(manifest.instruments.map(s => [s.id, new Set((s.outputs || []).map(o => o.name))]));
  const stale = []; for (const [id, e] of Object.entries(M.SKYMAP_CENSUS)) { if (!ids.has(id)) { stale.push(id); continue; } for (const k of Object.keys(e)) if (k !== '_' && !outs.get(id).has(k)) stale.push(id + '.' + k); }
  const sel = new Set([...src.matchAll(/registerSel\('([A-Za-z0-9_]+)'/g)].map(m => m[1]));
  for (const m of src.matchAll(/screenSphere\([\s\S]{0,400}?'(scr[A-Za-z0-9]+)'/g)) sel.add(m[1]);
  const cosmosKeys = new Set([...src.matchAll(/\{\s*key:'([a-z0-9_]+)'/g)].map(m => 'cosmos_' + m[1]));
  const why = (() => { const m = src.match(/const SKY_WHY=\{([\s\S]*?)\]\};/); return new Set(m ? [...m[1].matchAll(/(?:^|,\s*)\n?\s*([a-z]+):\[/g)].map(x => x[1]) : []); })();
  const worlds = new Set(['cyc', 'solar', 'fbs', 's3', 'obs']), bad = [];
  for (const r of C1.rows) { const a = r.arg;
    if (r.cls === 'map' || r.cls === 'card') { if (!M.SKYMAP_IDS.includes(a)) bad.push(`${r.id}.${r.name} → ${r.cls}:${a}`); }
    else if (r.cls === 'drawn' || r.cls === 'cross') { if (!sel.has(a) && !cosmosKeys.has(a)) bad.push(`${r.id}.${r.name} → ${r.cls}:${a}`); }
    else if (r.cls === 'world') { if (!worlds.has(a)) bad.push(`${r.id}.${r.name} → world:${a}`); }
    else if (r.cls === 'not') { if (!why.has(a)) bad.push(`${r.id}.${r.name} → not:${a}`); }
    else bad.push(`${r.id}.${r.name} → ${r.cls}`); }
  const mapped = new Set(C1.rows.filter(r => r.cls === 'map').map(r => r.arg)), orphan = M.SKYMAP_IDS.filter(id => !mapped.has(id));
  const by = Object.entries(C1.by).map(([k, v]) => `${k} ${v}`).join(' · ');
  check(C1.missing.length === 0 && stale.length === 0 && bad.length === 0 && orphan.length === 0 && C1.total >= 200 && C1.instruments >= 70 && why.size === 8,
    'the census is complete: every candidate output of every typed instrument — a length, time, angle, solid angle, temperature, rate, φ-rung, or anything named like a redshift — has a class; no entry names an instrument or an output that does not exist; every class resolves (a place to a projection drawn here, a check to a horizon the atlas registers, a world to a world, a refusal to one of eight stated reasons); and every place drawn here stands on at least one laboratory output',
    `${C1.total} outputs in ${C1.instruments} instruments: ${by} · unclassified ${C1.missing.length} · stale ${stale.length} · unresolved ${bad.slice(0, 4).join(', ') || 0} · places without a number ${orphan.join(',') || 0}`); }
/* 2 — EVERY PLACE STANDS ON ITS LABORATORY'S OWN NUMBER, AND ON AN INDEPENDENT FORMULA */
{ const simpson = (f, a, b, n) => { let s = f(a) + f(b); const h = (b - a) / n; for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return s * h / 3; };
  const Or = 9.182e-5, E = (z, Om) => Math.sqrt(Om * (1 + z) ** 3 + Or * (1 + z) ** 4 + 1 - Om - Or), DC = (z, H0, Om) => M.SKY_C_KMS / H0 * simpson(x => 1 / E(x, Om), 0, z, 4000) * M.SKY_MPC_GLY;
  const co = run('cosmo'), zP = co.angular_peak_redshift, DA = z => DC(z, 67.66, 0.3111) / (1 + z);
  const cz = M.SKY_PLACE.cosmoZ(co), pk = M.SKY_PLACE.cosmoPeak(co);
  const lam = run('lam'), ds = M.SKY_PLACE.desitter(lam, 1), dsIndep = M.SKY_C_KMS / (67.66 * Math.sqrt(0.6889)) * M.SKY_MPC_GLY;
  const rg = run('rungs'), par = M.SKY_PLACE.parallax(rg), ceph = M.SKY_PLACE.cepheid(rg), MC = -2.81 * (Math.log10(30) - 1) - 4.05, cephIndep = 10 * 10 ** ((13.09 - MC) / 5);
  const fe = run('fermi', { latitude_deg: 50 }), feIndep = 8.178 * Math.tan(50 * Math.PI / 180);
  const prof = (() => { const m = src.match(/function fermiLobeProfile\([^]*?\n\}/); const V2 = class { constructor(x, y) { this.x = x; this.y = y; } };
    return new Function('THREE', `${m[0]}\nreturn fermiLobeProfile;`)({ Vector2: V2 }); })(), top = prof(fe.lobe_height, fe.lobe_height * 0.45).at(-1).y;
  const kpc = 3.0856775814913673e19, mw = M.SKY_PLACE.galrot(run('galrot', { galaxy: 'milkyway' }), kpc), m31 = M.SKY_PLACE.galrot(run('galrot', { galaxy: 'm31' }), kpc);
  const hR = +(src.match(/hR:\s*([0-9.]+),/) || [])[1], Rd31 = +(src.match(/const M31_DISC=Object\.freeze\(\{[^}]*?Rd:([0-9.]+)/) || [])[1];
  const T = [73.04, 72.51, 67.66].map(h => M.SKY_PLACE.tension(h, H0c, h0.hubbleComoving)), Tind = [73.04, 72.51, 67.66].map(h => M.SKY_C_KMS / h * M.SKY_MPC_GLY);
  const lf = run('localflow');
  const ok = rel(cz, DC(1, 67.66, 0.3111)) < 2e-6 && DA(zP - 0.03) < DA(zP) && DA(zP + 0.03) < DA(zP) && rel(pk, DA(zP) * (1 + zP)) < 1e-5 && rel(ds, dsIndep) < 1e-9
    && par[0] === 500 && par[1] === 5000 && rel(ceph, cephIndep) < 1e-12 && rel(fe.lobe_height, feIndep) < 1e-12 && Math.abs(top - fe.lobe_height) < 1e-12
    && Math.abs(mw - hR) < 1e-9 && Math.abs(m31 - Rd31) < 1e-9 && T.every((v, i) => rel(v, Tind[i]) < 1e-12) && Math.abs(lf.hubble_constant - 72.51) < 0.01 && rel(M.SKY_PLACE.reachGly(1, 67.4, 0.001), 458.76) < 1e-4;
  check(ok, 'every place stands on its laboratory’s own output, and on an independent first-principles formula: the distance laboratory’s source at ∫c dz/H, the turnover at a true maximum of D_A drawn at D_A(1 + z), the de Sitter radius at c/(H₀√Ω_Λ), the three Hubble spheres at c/H₀, the parallax spheres at 1000/(σ/f), Leavitt’s rung at 10^((m − M)/5 + 1) pc, the Fermi lobes at R₀ tan b with the drawn profile’s top at that height, and the rotation curves’ scale lengths equal to the ones the drawn discs are made with',
    `source ${cz.toFixed(4)} Gly (∫ ${DC(1, 67.66, 0.3111).toFixed(4)}) · turnover z ${zP.toFixed(4)} → ${pk.toFixed(4)} Gly · de Sitter ${ds.toFixed(4)} (${dsIndep.toFixed(4)}) · c/H₀ ${T.map(v => v.toFixed(3)).join(' / ')} · parallax ${par.join(' / ')} pc · Cepheid ${(ceph / 1e3).toFixed(4)} kpc · Fermi ${fe.lobe_height.toFixed(4)} kpc (top ${top.toFixed(4)}) · discs ${mw}/${hR}, ${m31}/${Rd31} kpc · localflow H₀ ${lf.hubble_constant.toFixed(2)}`); }
/* 3 — TWO PROGRAMS, ONE NUMBER */
{ let w1 = 0; for (const z of [0.1, 0.5, 1, 2, 5, 10, 100, 1000]) w1 = Math.max(w1, rel(X.cosmoComoving(z, H0c, C.Om, C.Or, C.OL, 4000) * M.SKY_MPC_GLY, X.ctChiOfZ(z)));
  const h = H0c / 100, k = 1e-6, cl = S.iskyModel(C.Om, 1 - C.Om - 4.18e-5 / (h * h) + k, h), Rc = C.cH / Math.sqrt(k);
  const today = cl.eta0 * Rc, ever = cl.etaEnd * Rc, fut = (cl.etaEnd - cl.eta0) * Rc;
  const lamC = run('lam', { hubble_constant: H0c, omega_lambda: C.OL }), RL = C.cH / Math.sqrt(C.OL);
  const own = S.iskyReach(0.001), ownEver = M.SKY_PLACE.reachGly(own.ever, 67.4, 0.001), s3 = run('s3sky');
  check(w1 < 2e-5 && cl.ok && rel(today, h0.particle) < 1e-5 && rel(ever, H.Pinf) < 1e-5 && rel(fut, h0.event) < 1e-5 && rel(lamC.de_sitter_gly, RL) < 1e-12 && Math.abs(s3.sky_total_reach - own.ever) < 1e-12,
    'two programs, one number: the distance laboratory’s integral, run on the map’s own H₀, Ω_m and Ω_r, lands on the map’s χ(z) from the Big Bang to z = 1000; the closed-sky laboratory’s Friedmann engine, run on the map’s Ω_m and h with |Ω_K| → 10⁻⁶, gives — as reaches times the curvature radius — the map’s particle horizon, event horizon and χ_p(∞); the Λ laboratory on the map’s H₀ and Ω_Λ gives the map’s own de Sitter radius. On the closed-sky laboratory’s own cosmology the last sphere is elsewhere, and that difference is the parameters',
    `χ(z) worst ${w1.toExponential(1)} · closed engine today ${today.toFixed(4)}/${h0.particle.toFixed(4)}, future ${fut.toFixed(4)}/${h0.event.toFixed(4)}, ever ${ever.toFixed(4)}/${H.Pinf.toFixed(4)} Gly · Λ lab ${lamC.de_sitter_gly.toFixed(6)}/${RL.toFixed(6)} · s3sky’s own cosmology: ${ownEver.toFixed(3)} Gly (${(100 * rel(ownEver, H.Pinf)).toFixed(2)} % — Ω_m 0.315, h 0.674)`); }
/* 4 — THE HORIZONS CONVERGE ON THE DE SITTER SPHERE */
{ const RL = C.cH / Math.sqrt(C.OL), at = dt => { const h = X.hzAtT(t0 + dt); return { hub: h.hubbleProper / RL, ev: h.event * h.a / RL, co: h.event / (RL / h.a), hc: h.hubbleComoving / (RL / h.a) }; };
  const a0 = at(0), a30 = at(30), a60 = at(60);
  check(a0.hub < 0.84 && a0.ev < 0.96 && Math.abs(a30.hub - 1) < 1e-3 && Math.abs(a30.ev - 1) < 1e-3 && Math.abs(a60.hub - 1) < 1e-5 && Math.abs(a60.ev - 1) < 1e-5 && Math.abs(a60.co - 1) < 1e-5 && Math.abs(a60.hc - 1) < 1e-5,
    'the Hubble sphere and the event horizon converge onto the de Sitter sphere as the clock runs: in proper length both approach √(3/Λ) from below, and on the comoving map the three shells become one — which is why the de Sitter sphere is drawn at L/a, on the clock',
    `today c/H ${(100 * a0.hub).toFixed(2)} %, a·χ_e ${(100 * a0.ev).toFixed(2)} % of R_Λ = ${RL.toFixed(4)} Gly · +30 Gyr ${(100 * a30.hub).toFixed(3)} / ${(100 * a30.ev).toFixed(3)} % · +60 Gyr ${(100 * a60.hub).toFixed(5)} / ${(100 * a60.ev).toFixed(5)} %`); }
/* 5 — THE LADDER MOVES TOGETHER */
{ const base = run('rungs'), rows = [-0.3, -0.1, 0.1661, 0.4].map(dm => { const o = run('rungs', { zero_point_shift_mag: dm }), f = 10 ** (dm / 5);
    return { dm, o, dC: o.cepheid_distance_pc / base.cepheid_distance_pc / f - 1, dI: o.type_ia_reach_mpc / base.type_ia_reach_mpc / f - 1, dH: o.shifted_h0 / base.shifted_h0 * f - 1,
      inv: rel(M.skyLadderInvariant(o.shifted_h0, o.cepheid_distance_pc), M.skyLadderInvariant(base.shifted_h0, base.cepheid_distance_pc)) }; });
  const close = rows.find(r => r.dm === 0.1661).o;
  const scene = /const zero=DL_CEPH_ZERO-shift;/.test(src), instr = /DL_CEPH_ZERO-i\.zero_point_shift_mag\);[\s\S]{0,200}DL_CEPH_ZERO-i\.zero_point_shift_mag\);[\s\S]{0,700}DL_IA_M-i\.zero_point_shift_mag\)/.test(src);
  check(rows.every(r => Math.abs(r.dC) < 1e-12 && Math.abs(r.dI) < 1e-12 && Math.abs(r.dH) < 1e-12 && r.inv < 1e-12) && Math.abs(close.shifted_h0 - 67.66) < 0.01 && close.cepheid_distance_pc > base.cepheid_distance_pc && scene && instr,
    'the ladder moves together (the sign repaired): a zero-point shift Δμ — calibrators brighter by Δμ — moves the LMC Cepheid and the type Ia reach out by 10^(Δμ/5) and H₀ down by the same factor, so H₀·d stands still; at Δμ = +0.166 the late Hubble constant is Planck’s and the LMC is FARTHER. The instrument and the laboratory’s own Leavitt plot read the shift the same way (they used to make the Cepheids fainter, bringing the LMC closer while H₀ fell)',
    `Δμ ${rows.map(r => r.dm).join(', ')}: worst ${Math.max(...rows.flatMap(r => [Math.abs(r.dC), Math.abs(r.dI), Math.abs(r.dH), r.inv])).toExponential(1)} · at +0.1661: H₀ ${close.shifted_h0.toFixed(3)}, LMC ${(close.cepheid_distance_pc / 1e3).toFixed(2)} kpc (was ${(base.cepheid_distance_pc / 1e3).toFixed(2)}), type Ia ${close.type_ia_reach_mpc.toFixed(0)} Mpc · scene ${scene} · instrument ${instr}`); }
/* 6 — THE TYPE Ia REDSHIFT */
{ const r = run('rungs'), DLm = r.type_ia_reach_mpc, z = M.skyZOfDL(DLm, X.ctChiOfZ), back = (1 + z) * X.ctChiOfZ(z) / M.SKY_MPC_GLY, naive = DLm * 73.04 / M.SKY_C_KMS, P = M.SKY_PLACE.snia(r, X.ctChiOfZ);
  const doc = /At m = 25 it is seven thousand — a LUMINOSITY distance, which on the atlas`s own cosmology is redshift 1\.06/.test(src) && !/which is redshift 1\.8 and is why/.test(src) && !/it reaches redshift 1\.8 at a limiting magnitude/.test(src);
  check(rel(back, DLm) < 1e-9 && Math.abs(z - 1.06) < 0.01 && naive > 1.7 && rel(P.chi, X.ctChiOfZ(z)) < 1e-12 && doc,
    'the type Ia reach is a LUMINOSITY distance: on the map’s own χ(z) it is redshift 1.06, and the comoving radius drawn is D_L/(1 + z); the laboratory’s «redshift 1.8» was a straight-line Hubble law at H₀ = 73, wrong at this depth, and its contract now says so',
    `D_L ${DLm.toFixed(1)} Mpc → z ${z.toFixed(4)} (D_L back ${back.toFixed(4)}) → χ ${P.chi.toFixed(4)} Gly · straight Hubble law z ${naive.toFixed(3)} · contract corrected ${doc}`); }
/* 7 — THE WIRING AND THE CONTRACT */
{ const w = [/function hccHorizonsTick\(dt\)\{ try\{ skymapTick\(\); \}catch\(e\)\{\}/.test(src), /\$\{hzCausalPanelHTML\(\)\}\n\s*\$\{skymapPanelHTML\('obs'\)\}/.test(src), /skymapBind\(ctl\);/.test(src) && (src.match(/skymapBind\(ctl\);/g) || []).length === 2,
    /\$\{dscPanelHTML\(\)\}\n\s*\$\{skymapPanelHTML\('solar'\)\}/.test(src), /\$\{skymapPassportHTML\(v\)\}/.test(src), /if\(t\.dataset\.passmap\)\{ skymapFly\(t\.dataset\.passmap\); return; \}/.test(src),
    /for\(const a of skymapActs\(key\)\.reverse\(\)\) acts\.unshift\(a\);/.test(src), /accuracyTier:'M', catalogueStatus:'derived-here', forbiddenClaims:SKY_FORBID\[P\.id\]/.test(src),
    /\^lab_\|\^sky_\//.test(src)];
  const forbid = (() => { const m = src.match(/const SKY_FORBID=Object\.freeze\(\{([\s\S]*?)\}\);/); return m ? [...m[1].matchAll(/^\s*([A-Za-z]+):\[/gm)].map(x => x[1]) : []; })();
  const labs = (() => { const m = src.match(/const SKY_LAB=Object\.freeze\(\{([^}]*)\}\)/); return m ? [...m[1].matchAll(/([A-Za-z]+):'([a-z0-9]+)'/g)].map(x => [x[1], x[2]]) : []; })();
  const instIds = new Set(manifest.instruments.map(s => s.id)), labIds = new Set(manifest.instruments.map(s => s.lab));
  const labsOK = labs.length === M.SKYMAP_IDS.length && labs.every(([id, l]) => M.SKYMAP_IDS.includes(id) && (instIds.has(l) || labIds.has(l)));
  check(w.every(Boolean) && M.SKYMAP_IDS.every(id => forbid.includes(id)) && labsOK,
    'the wiring and the contract: the places follow the atlas clock and the laboratories’ inputs from the one horizons tick; Horizons lists the shells and Sun → Cosmos the Galaxy, both bound; every laboratory passport lists its places and flies there; every place’s card opens its laboratory and sets what its number can set; every place is filed as a model construct, derived here, with what it must not be read as — and none of them is offered as a photographed object',
    `tick ${w[0]} · panels ${w[1]}/${w[3]} bound ${w[2]} · passport ${w[4]}/${w[5]} · card actions ${w[6]} · contract ${w[7]} · not a photograph ${w[8]} · forbidden readings ${forbid.length}/${M.SKYMAP_IDS.length} · laboratories ${labs.map(x => x[1]).join(',')}`); }
/* 8 — THE CAPTIONS */
{ const rank = /const LABEL_RANK=d=>d\.classList\.contains\('selected'\)\?-1:d\.classList\.contains\('const'\)\?0:/.test(src);
  const skip = /if\(d\.classList\.contains\('declutter-hidden'\)\) continue;\n\s*const b=d\.getBoundingClientRect\(\);/.test(src);
  const anchor = /function skymapSelAnchor\(\)\{[\s\S]{0,200}narrow=\(camera\.aspect\|\|1\)<1/.test(src) && /function skymapTick\(\)\{ if\(!SKYMAP\.items\.size\) return; try\{ skymapSelAnchor\(\); \}catch\(e\)\{\}/.test(src);
  const pill = /\.label\.skymap\{[^}]*background:rgba\(5,9,20,\.62\)/.test(src);
  /* the fan of anchors: the five inner labels in rows ordered by radius, alternating sides — a ratio of radius, so it holds at every zoom */
  const fan = [...(src.match(/for\(const \[id,op,th\] of \[([^\]]*\][^\]]*\][^\]]*\][^\]]*\][^\]]*\])\]\)/) || ['', ''])[1].matchAll(/\['([A-Za-z]+)',[.0-9]+,([0-9]+)\]/g)].map(m => [m[1], +m[2]]);
  check(rank && skip && anchor && pill && fan.length === 5,
    'the captions: the place the reader has chosen outranks every other caption in both label guards (the crowd guard ranked it like any plain caption and could step it aside); a caption the declutter pass has hidden no longer holds room in the crowd guard (an invisible «Hyperion» pushed the visible distance-laboratory label out); on a narrow screen the chosen shell’s label stands at the top of its sphere as the reader sees it; the laboratories’ labels carry a dark backing so they read on the bright core of the web',
    `selected first ${rank} · hidden takes no room ${skip} · narrow-screen anchor ${anchor} · backing ${pill} · fan ${fan.map(f => f.join('@')).join(', ')}`); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
