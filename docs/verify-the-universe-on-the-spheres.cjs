#!/usr/bin/env node
'use strict';
/* ══ THE UNIVERSE ON THE FRACTAL SPHERES (v4.385) ═══════════════════════════════════════════════════════════════════════
 * Asked: let the structure of the fractal spheres of FBS3R organise all matter and its phenomena — neutrinos and LLMs,
 * Maxwell and the symmetries, the subatomic world and the whole universe. The atlas now carries a catalogue of ninety-eight
 * things, each put on the φ-spheres by an exact rule (a size, a mass's two lengths, an energy, a time, a frequency, a
 * number of bits), draws them on the mass–radius plane between the Compton and the Schwarzschild lines (Carr & Rees 1979;
 * Lineweaver & Patel 2023), and winds that plane onto the shells of FBS3R as the matter wheel. Checked here by running
 * the page's own pure code and reading its wiring:
 *   1. the rules, each alone; the holographic radius is the exact inverse of the atlas's own Bekenstein–Hawking capacity,
 *      and it returns a black hole's own horizon from that hole's entropy
 *   2. the mirror: every mass has two rungs whose sum is log_φ 2; the lines cross at (m_P/√2, √2·ℓ_P); the masses that
 *      can exist at rung N span 2N − log_φ 2 rungs, none below the vertex
 *   3. the fine-structure staircase of Maxwell's lengths: r_e → λ̄_C → a₀ in equal steps of log_φ(1/α), and 1/R∞ = 4πa₀/α
 *   4. the walls: black holes, the Hubble sphere and the de Sitter horizon ON the Schwarzschild line, the forces' scales
 *      ON the Compton line, light 2π above it, bits on the Schwarzschild line; every body above both lines but the three
 *      named exceptions, each of which says so itself
 *   5. the catalogue: unique, sourced, every domain populated (neutrinos, Maxwell's light, minds and machines with an LLM
 *      placed only by physical, temporal and informational rules), the hypothetical and the bounds flagged, every
 *      laboratory it names a laboratory of the atlas
 *   6. the matter wheel: 0.6° per factor φ of mass, the allowed arc 0.6°·(2N − log_φ 2), the whole circle at N = 300, and
 *      the shader's two inequalities forbid exactly the masses outside [ħ/Lc, Lc²/2G]
 *   7. the wiring: the map (desktop and phone), the ladder's ◩ and its rung cards, the FBS3R panel, the per-frame wheel,
 *      the selection registry, the palette and HCC_UCAT
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const grab = (re, what) => { const m = SRC.match(re); if (!m) throw new Error('not found: ' + what); return m[0]; };
const i0 = SRC.indexOf('const UC_K='), i1 = SRC.indexOf('/* ── THE MAP OF ALL MATTER');
if (i0 < 0 || i1 < i0) throw new Error('catalogue block not found');
const LN_PHI = Math.log((1 + Math.sqrt(5)) / 2);
const WHEEL = grab(/const UC_WHEEL=\{[\s\S]*?const ucWheelSpan=[^\n]*\n/, 'the wheel');
const U = new Function('TT', 'LN_PHI', 'fmtLen', 'fmtDur', SRC.slice(i0, i1) + WHEEL +
  '\nreturn {UC_K,UC_DOM,UCAT,UC_KIND,ucatRungs,ucatMain,ucatPlane,ucatTraits,ucAllowed,UC_LOGPHI2,ucN,ucAt,UC_WHEEL,ucWheelAngle,ucWheelPos,ucWheelSpan};')(
  (en) => en, LN_PHI, L => L.toExponential(3) + ' m', s => s + ' s');
const K = U.UC_K, lv = L => Math.log(L / K.lP) / LN_PHI, rel = (a, b) => Math.abs(a - b) / Math.abs(b);
const byId = id => U.UCAT.find(e => e[0] === id);
/* 1 */
{ const R = U.ucatRungs(['t', ['t', 't'], 'part', { R: 1, M: 1, E: 1e9, T: 1, f: 1e6, b: 1e10 }, '', null, 's']);
  const get = k => R.find(r => r.kind === k);
  const holo = get('info').L, Bholo = new Function('r', 'LP', 'LN2', grab(/Bholo\(r\)\{ return [^}]*\}/, 'SELM.Bholo').replace(/^Bholo\(r\)\{/, '').replace(/this\./g, '').replace(/\}$/, ''));
  const back = Bholo(holo, K.lP, Math.LN2);
  const Msun = K.Msun, rs = 2 * K.G * Msun / (K.c * K.c), bitsBH = Math.PI * rs * rs / (K.lP * K.lP * Math.LN2), Rbh = U.ucatRungs(['b', ['b', 'b'], 'mind', { b: bitsBH }, '', null, 's'])[0].L;
  const w = [Math.abs(get('size').N - lv(1)) < 1e-12, rel(get('compton').L, K.hb / K.c) < 1e-12, rel(get('schwarzschild').L, 2 * K.G / (K.c * K.c)) < 1e-12,
    rel(get('energy').L, K.hbc / 1e9) < 1e-12, rel(get('time').L, K.c) < 1e-12, rel(get('freq').L, K.c / 1e6) < 1e-12, rel(back, 1e10) < 1e-12, rel(Rbh, rs) < 1e-12];
  ok('the rules: a size is its own rung, a mass gives ħ/Mc and 2GM/c², an energy ħc/E, a time cT, a frequency c/f; the holographic radius inverts the atlas’s own Bekenstein–Hawking capacity (SELM.Bholo) exactly, and from a solar-mass hole’s entropy it returns that hole’s horizon',
    w.every(Boolean), w.map(x => x ? '✓' : '✗').join('') + ` · r_s(M☉) = ${rs.toFixed(1)} m ↔ ${Rbh.toFixed(1)} m from ${bitsBH.toExponential(3)} bit`); }
/* 2 */
{ const masses = U.UCAT.filter(e => e[3].M);
  const worst = Math.max(...masses.map(e => { const R = U.ucatRungs(e), c = R.find(r => r.kind === 'compton').N, s = R.find(r => r.kind === 'schwarzschild').N; return Math.abs(c + s - Math.log(2) / LN_PHI); }));
  const Mx = K.mP / Math.SQRT2, cross = Math.abs(K.hb / (Mx * K.c) - 2 * K.G * Mx / (K.c * K.c)) / (Math.SQRT2 * K.lP), Nx = lv(K.hb / (Mx * K.c));
  const span = N => { const a = U.ucAllowed(K.lP * Math.exp(N * LN_PHI)); return Math.log(a.Mmax / a.Mmin) / LN_PHI; };
  const sp = [10, 100, 250].map(N => Math.abs(span(N) - (2 * N - U.UC_LOGPHI2)));
  ok(`the mirror: all ${masses.length} masses have N_C + N_S = log_φ 2 = ${U.UC_LOGPHI2.toFixed(4)}; the lines cross at (m_P/√2, √2·ℓ_P), rung ${Nx.toFixed(4)} = ½·log_φ 2; at rung N the masses that can exist span 2N − log_φ 2 rungs, and none below the vertex`,
    worst < 1e-9 && cross < 1e-9 && Math.abs(Nx - U.UC_LOGPHI2 / 2) < 1e-6 && sp.every(x => x < 1e-9) && span(0.5) < 0,
    `worst |N_C + N_S − log_φ 2| = ${worst.toExponential(1)} · span(0.5) = ${span(0.5).toFixed(2)}`); }
/* 3 */
{ const re = U.ucatMain(byId('re')).N, lc = U.ucatRungs(byId('e')).find(r => r.kind === 'compton').N, a0 = U.ucatMain(byId('a0')).N, ry = U.ucatMain(byId('ryd'));
  const step = Math.log(1 / K.alpha) / LN_PHI, ryd = 4 * Math.PI * byId('a0')[3].L / K.alpha;
  ok(`the fine-structure staircase of Maxwell’s lengths: r_e → λ̄_C → a₀ in two equal steps of log_φ(1/α) = ${step.toFixed(4)} rungs, and the Rydberg wavelength is 4πa₀/α`,
    Math.abs(lc - re - step) < 1e-6 && Math.abs(a0 - lc - step) < 1e-6 && rel(ry.L, ryd) < 1e-8,
    `${re.toFixed(3)} → ${lc.toFixed(3)} → ${a0.toFixed(3)} · 1/R∞ ${ry.L.toExponential(6)} m vs 4πa₀/α ${ryd.toExponential(6)} m`); }
/* 4 */
{ const T = e => U.ucatTraits(e), on = (e, k) => Math.abs(T(e)[k]) < 1e-9;
  const horizons = U.UCAT.filter(e => { const p = U.ucatPlane(e); return p && (p.how === 'horizon' || p.how === 'bits'); }).concat(['hubble', 'dS'].map(byId));
  const scales = U.UCAT.filter(e => (U.ucatPlane(e) || {}).how === 'scale'), photons = U.UCAT.filter(e => (U.ucatPlane(e) || {}).how === 'photon');
  const bodies = U.UCAT.filter(e => (U.ucatPlane(e) || {}).how === 'body'), below = bodies.filter(e => T(e).toQuantum < -0.05 || T(e).toHorizon < -0.05).map(e => e[0]).sort();
  const say = below.every(id => /below|inside|beyond/i.test([].concat(byId(id)[4])[0]) || id === 'pi') && /below its own Compton length/.test(SRC) && /the one hadron of the catalogue below the line/.test(SRC);
  const w = [horizons.every(e => on(e, 'toHorizon')), scales.every(e => on(e, 'toQuantum')), photons.every(e => Math.abs(T(e).toQuantum - Math.log(2 * Math.PI) / LN_PHI) < 1e-6),
    below.join(',') === 'obs,pi,planck', say];
  ok(`the walls: ${horizons.length} horizons and bits ON the Schwarzschild line, ${scales.length} energy scales ON the Compton line, ${photons.length} quanta of light log_φ 2π above it; of ${bodies.length} bodies only the pion (its charge radius under its own Compton length), the Planck point (inside its own horizon) and the observable universe (an expanding universe is not a static mass) cross a wall, and each says so`,
    w.every(Boolean), w.map(x => x ? '✓' : '✗').join('') + ' · across: ' + below.join(', ')); }
/* 5 */
{ const ids = U.UCAT.map(e => e[0]), doms = Object.keys(U.UC_DOM), cnt = d => U.UCAT.filter(e => e[2] === d).length;
  const labs = new Set([...(SRC.match(/const S3_VIEW_NAMES=\{([\s\S]*?)\.\.\.labDeclNames/) || ['', ''])[1].matchAll(/(\w+):'/g)].map(m => m[1]));
  { const a = SRC.indexOf('const LAB_DECLARATIONS=Object.freeze(['), b = SRC.indexOf(']);', a); for (const m of SRC.slice(a, b).matchAll(/\{id:'([a-z0-9]+)'/g)) labs.add(m[1]); }
  const badLab = U.UCAT.filter(e => e[5] && !labs.has(e[5])).map(e => e[0] + ':' + e[5]);
  const llm = ['token', 'train', 'ctx', 'llmw'].map(byId), llmOk = llm.every(e => e && !e[3].M && !e[3].R && (e[3].T || e[3].b));
  const w = [new Set(ids).size === ids.length, doms.length === 9 && doms.every(d => cnt(d) >= 5), U.UCAT.every(e => e[2] in U.UC_DOM && e[6] && String(e[6]).length > 2),
    cnt('nu') >= 8 && ['nuL31', 'nuL21', 'nuLat', 'cnb'].every(byId) && ['nu3', 'nu2', 'nuK', 'nuSum'].every(id => /l/.test(byId(id)[7] || '')),
    cnt('light') >= 10 && ['re', 'a0', 'h21', 'cmbpk', 'skin', 'debye'].every(byId), llmOk, /h/.test(byId('GUT')[7] || '') && U.UCAT.filter(e => /h/.test(e[7] || '')).length === 1,
    badLab.length === 0, U.UCAT.length >= 90];
  ok(`the catalogue: ${U.UCAT.length} entries in nine domains (${doms.map(d => d + ' ' + cnt(d)).join(', ')}), every one sourced; neutrino masses flagged as bounds, grand unification the one hypothesis; an LLM placed only by its time, its context and its weights; every laboratory named is one of the atlas’s`,
    w.every(Boolean), w.map(x => x ? '✓' : '✗').join('') + (badLab.length ? ' · unknown labs ' + badLab.join(',') : '')); }
/* 6 */
{ const k = U.UC_WHEEL.k, deg = k * 180 / Math.PI, t0 = U.UC_WHEEL.th0;
  const pl = U.ucWheelAngle(K.mP), phiStep = U.ucWheelAngle(K.mP * (1 + Math.sqrt(5)) / 2) - pl;
  const shaderForbids = (M, N) => { const d0 = U.ucWheelAngle(M) - t0, d = ((d0 + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return d > k * (N - U.UC_LOGPHI2) || d < -k * N; };
  let agree = 0, tot = 0; for (let N = 2; N <= 298; N += 7) for (let lm = -54; lm <= 54; lm += 2.7) { const M = Math.pow(10, lm), a = U.ucAllowed(K.lP * Math.exp(N * LN_PHI)), out = M < a.Mmin || M > a.Mmax; tot++; if (out === shaderForbids(M, N)) agree++; }
  const shader = grab(/float aS=uK\*\(N-uL2\), aC=-uK\*N[^;]*;[\s\S]*?float heavy=smoothstep\(aS-w,aS\+w,d\), light=1\.0-smoothstep\(aC-w,aC\+w,d\)/, 'the shader inequalities');
  const [x, y] = U.ucWheelPos(70, 0.875, U.ucN(0.875)), r = Math.hypot(x, y);
  ok(`the matter wheel: ${deg.toFixed(2)}° of turn per factor φ of mass, the Planck mass straight down; at rung N the arc of what can exist is 0.6°·(2N − log_φ 2) — ${(U.ucWheelSpan(300) * 180 / Math.PI).toFixed(1)}° at N = 300; the shader's two inequalities forbid exactly the masses outside [ħ/Lc, Lc²/2G] (${agree}/${tot} samples); a human on the shell of its own size stands at radius 1`,
    Math.abs(deg - 0.6) < 1e-12 && Math.abs(pl + Math.PI / 2) < 1e-12 && Math.abs(phiStep - k) < 1e-12 && Math.abs(U.ucWheelSpan(300) - k * (600 - U.UC_LOGPHI2)) < 1e-12 && agree === tot && !!shader && Math.abs(r - 1) < 1e-9,
    `θ(m_P) = ${(pl * 180 / Math.PI).toFixed(1)}° · span(166) = ${(U.ucWheelSpan(166) * 180 / Math.PI).toFixed(1)}°`); }
/* 7 */
{ const w = [
    /<div id="ucMap" hidden role="dialog"[^>]*>[\s\S]*?<svg id="ucSvg"[\s\S]*?<select id="ucPick"[\s\S]*?<div id="ucCard" class="ucCard"><\/div>/.test(SRC) && /<button class="tmBtn" id="tsMap"/.test(SRC),
    /#ucMap\.narrow \.ucCard\{position:absolute;/.test(SRC) && /#ucSvg\{display:block;width:100%;height:100%;touch-action:none;/.test(SRC) && /UC_MAP\.portrait=sxNarrow\(\)/.test(SRC),
    /svg\.addEventListener\('wheel',ev=>\{ ev\.preventDefault\(\);/.test(SRC) && /UC_MAP\.pinch=\{d:Math\.hypot\(a\.x-b\.x,a\.y-b\.y\)\|\|1\}/.test(SRC),
    /\$\{ucFbsPanelHTML\(\)\}\n    \$\{fbsLivingPanelHTML\(\)\}/.test(SRC) && /try\{ ucFbsBind\(ctl\); \}catch\(e\)\{\}/.test(SRC),
    /try\{ ucFbsTick\(dt,D\); \}catch\(e\)\{ if\(!UC3\.err\)/.test(SRC) && /function ucExposure\(f\)\{/.test(SRC),
    /idx\[n\]\.uc\.push\(\{id:e\[0\],kind:r\.kind,dom:e\[2\],bold:/.test(SRC) && /data-tsuc="\$\{esc\(x\.e\[0\]\)\}"/.test(SRC) && /ucMapOpen\(b\.dataset\.tsuc\)/.test(SRC),
    /registerSel\(key,\{ name:\(\)=>ucName\(e\), mode:'fbs'/.test(SRC) && /add\('The map of all matter/.test(SRC),
    /globalThis\.HCC_UCAT=Object\.freeze\(\{/.test(SRC)];
  ok('the wiring: the map dialog with its plane, finder and card (a sheet over an upright plane on a phone; wheel, pinch and drag to zoom and move), ◩ in the ladder’s header, the catalogue on every rung card, the FBS3R panel section and the per-frame wheel with its close-range exposure, the selection registry, the palette and HCC_UCAT',
    w.every(Boolean), w.map(x => x ? '✓' : '✗').join('')); }
console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
