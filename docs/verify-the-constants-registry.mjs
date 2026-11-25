/* verify-the-constants-registry.mjs — HCC_CONSTANTS, the one versioned registry (Scale Nexus Frontier II, item 7)
   What is checked:
     1. every registry value against a table typed here independently from the SI brochure (2019), CODATA 2022
        and the IAU resolutions — not read from index.html;
     2. the derived values: ħ = h/2π, pc = 648000/π au, ly = c·Julian year, M☉ = GM☉/G, Mpc = 10⁶ pc;
     3. exact constants carry u = 0, measured ones their CODATA standard uncertainty, every entry a source;
     4. the registry and its value view are frozen;
     5. the modules that adopted it (the mass–radius catalogue UC_K, the S³ reconstruction HCC_S3C, the white-dwarf
        lab) read from it and agree with it to the last bit;
     6. the literals other modules still carry are a DEBT with a ceiling that may only fall;
     7. literals that DISAGREE with the registry are listed by name, with a ceiling, and the stale solar mass is
        traced to the G it was computed with;
     8. item 6 of the audit: an edition update is not a contradiction. The electron mass moved between CODATA 2018 and
        2022 because α moved (m_e = 2hR∞/(cα²)); the size of the shift in units of one edition's σ is not a test.
   NOT checked: whether the CODATA values are right. That is CODATA's job. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const i0 = src.indexOf('const HCC_CONSTANTS='), i1 = src.indexOf('/* the SI values the reference implementation uses');
if (i0 < 0 || i1 < i0) throw new Error('the registry block is missing');
const REG = src.slice(i0, i1);
const { HCC_CONSTANTS: C, HCC_K: K } = new Function(REG + ';return {HCC_CONSTANTS, HCC_K};')();
const rel = (a, b) => Math.abs(a - b) / Math.abs(b);

/* 1 — the independent table */
const TABLE = {
  c: [299792458, 0], h: [6.62607015e-34, 0], e: [1.602176634e-19, 0], kB: [1.380649e-23, 0],
  G: [6.67430e-11, 0.00015e-11], me: [9.1093837139e-31, 0.0000000028e-31], mp: [1.67262192595e-27, 0.00000000052e-27],
  mu: [1.66053906892e-27, 0.00000000052e-27], alpha: [7.2973525643e-3, 0.0000000011e-3],
  GMsun: [1.3271244e20, 0], Rsun: [6.957e8, 0], au: [1.495978707e11, 0]};
{ const bad = Object.entries(TABLE).filter(([k, [v, u]]) => !C[k] || C[k].v !== v || Math.abs(C[k].u - u) > 1e-6 * Math.max(u, 1e-300));
  check(bad.length === 0, 'every registry value and its standard uncertainty equal the SI 2019 / CODATA 2022 / IAU table typed here independently',
    `${Object.keys(TABLE).length} constants compared${bad.length ? ' · DIFFER: ' + bad.map(b => b[0]).join(', ') : ''} · edition "${C.version}"`); }

/* 2 — derived values */
{ const d = [['ħ = h/2π', rel(C.hbar.v, C.h.v / (2 * Math.PI)), 1e-9],
    ['pc = 648000/π au', rel(C.pc.v, 648000 / Math.PI * C.au.v), 1e-15],
    ['ly = c × 365.25 d', rel(C.ly.v, C.c.v * 365.25 * 86400), 1e-15],
    ['M☉ = GM☉/G', rel(K.Msun, C.GMsun.v / C.G.v), 0],
    ['Mpc = 10⁶ pc', rel(K.Mpc, 1e6 * C.pc.v), 0]];
  check(d.every(([, r, t]) => r <= t), 'the derived constants follow from their definitions: ħ truncated to the ten digits CODATA prints (h/2π itself is exact), the IAU parsec and light year exactly, M☉ from GM☉ and G, the megaparsec',
    d.map(([n, r]) => `${n}: ${r.toExponential(1)}`).join(' · ')); }

/* 3 — exactness, uncertainty, source */
{ const exact = ['c', 'h', 'e', 'kB', 'GMsun', 'au', 'pc', 'ly'], measured = ['G', 'me', 'mp', 'mu', 'alpha'];
  const entries = Object.entries(C).filter(([, x]) => x && typeof x === 'object');
  const ok = exact.every(k => C[k].u === 0) && measured.every(k => C[k].u > 0) && entries.every(([, x]) => typeof x.src === 'string' && x.src.length > 3 && x.u >= 0);
  check(ok, 'the exact constants carry u = 0, the measured ones a positive CODATA uncertainty, and every entry names its source',
    `${entries.length} entries · exact ${exact.length} · measured ${measured.length} · relative u(G) = ${(C.G.u / C.G.v).toExponential(2)} — the uncertainty M☉ inherits`); }

/* 4 — frozen */
check(Object.isFrozen(C) && Object.isFrozen(K), 'the registry and its value view are frozen — no module can write a constant', `isFrozen: ${Object.isFrozen(C)} · ${Object.isFrozen(K)}`);

/* 5 — the adopters read it */
{ const ucat = src.slice(src.indexOf('const UC_K=(()=>'), src.indexOf('/* how far it stands from the two walls')).replace(/const UC_DOM=/, 'var UC_DOM=');
  const U = new Function('const LN_PHI=Math.log((1+Math.sqrt(5))/2);' + REG + ucat + ';return UC_K;')();
  const s3c = src.slice(src.indexOf('const HCC_S3C=Object.freeze({'), src.indexOf('const HCC_S3_GLY='));
  const S = new Function('HCC_K', s3c + ';return HCC_S3C;')(K);
  const wd = (src.match(/const WD_RSUN_KM=[^\n]*\n/) || [''])[0];
  const W = new Function('HCC_K', wd + ';return {WD_RSUN_KM, WD_G, WD_MSUN, WD_C};')(K);
  const pairs = [['UC_K.hb', U.hb, K.hbar], ['UC_K.G', U.G, K.G], ['UC_K.c', U.c, K.c], ['UC_K.Msun', U.Msun, K.Msun],
    ['HCC_S3C.G', S.G, K.G], ['HCC_S3C.hbar', S.hbar, K.hbar], ['HCC_S3C.Msun', S.Msun, K.Msun], ['HCC_S3C.Mpc', S.Mpc, K.Mpc],
    ['WD_G', W.WD_G, K.G], ['WD_MSUN', W.WD_MSUN, K.Msun], ['WD_C', W.WD_C, K.c], ['WD_RSUN_KM', W.WD_RSUN_KM * 1e3, K.Rsun]];
  const reads = /HCC_K\.hbar/.test(ucat) && /HCC_K\.G/.test(s3c) && /HCC_K\.G/.test(wd);
  const bad = pairs.filter(([, a, b]) => a !== b);
  check(reads && bad.length === 0, 'the adopters — the mass–radius catalogue, the S³ reconstruction, the white-dwarf lab — read the registry and agree with it bit for bit',
    `${pairs.length} values${bad.length ? ' · DIFFER: ' + bad.map(b => b[0]).join(', ') : ''} · source text names HCC_K: ${reads}`); }

/* 6, 7 — the literal debt, and the literals that disagree */
const rest = src.slice(0, i0) + src.slice(i1);
const LITS = [...rest.matchAll(/(?<![\w.])(\d+\.?\d*(?:e[-+]?\d+)?)(?![\w.])/gi)].map(m => m[1]).filter(t => t.replace('.', '').replace(/^0+/, '').length >= 3);
const KEYS = ['c', 'h', 'hbar', 'e', 'kB', 'G', 'me', 'mp', 'mu', 'Rsun', 'au', 'pc', 'ly', 'Msun', 'Mpc'];
const scan = KEYS.map(k => { const v = K[k]; let same = 0; const near = {};
  for (const t of LITS) { const x = Number(t); if (!isFinite(x) || x === 0) continue; const r = Math.abs(x - v) / v;
    if (r < 1e-12) same++; else if (r < 3e-3) near[t] = (near[t] || 0) + 1; }
  return { k, same, near }; });
/* the ceilings are the counts when the registry was introduced (v4.441). They may only fall: a module that adopts
   the registry lowers them; a new literal raises the count above the ceiling and fails here. */
const DEBT_CEILING = { c: 48, h: 14, hbar: 19, e: 14, kB: 22, G: 29, me: 5, mp: 4, mu: 5, Rsun: 16, au: 21, pc: 19, ly: 8, Msun: 0, Mpc: 20 };
{ const over = scan.filter(s => s.same > DEBT_CEILING[s.k]), total = scan.reduce((a, s) => a + s.same, 0), cap = Object.values(DEBT_CEILING).reduce((a, b) => a + b, 0);
  check(over.length === 0, 'the duplicated literals outside the registry are a debt that may only fall — no constant has gained a copy',
    `${total} copies (ceiling ${cap}): ${scan.map(s => `${s.k} ${s.same}`).join(' · ')}${over.length ? ' · OVER: ' + over.map(o => o.k).join(', ') : ''}`); }
const CONFLICT_CEILING = { c: 4, G: 2, mp: 1, au: 6, pc: 6, ly: 4, Msun: 30 };
{ const list = scan.flatMap(s => Object.entries(s.near).map(([t, n]) => ({ k: s.k, t, n })));
  const byKey = k => list.filter(x => x.k === k).reduce((a, x) => a + x.n, 0);
  const over = KEYS.filter(k => byKey(k) > (CONFLICT_CEILING[k] || 0));
  const stale = Number('1.98892e30'), Gimplied = C.GMsun.v / stale, z = (C.G.v - Gimplied) / C.G.u;
  check(over.length === 0 && Math.abs(Gimplied - 6.6726e-11) / 6.6726e-11 < 2e-5,
    'the literals that DISAGREE with the registry are listed by name and capped; the commonest, M☉ = 1.98892·10³⁰ kg, is GM☉ divided by the 1986 G (6.6726·10⁻¹¹), not a different Sun',
    list.map(x => `${x.k}=${x.t}×${x.n}`).join(' · ') + ` · 1.98892e30 implies G = ${Gimplied.toExponential(5)}, ${z.toFixed(0)} CODATA-2022 σ from today's G — a stale edition carried in ${scan.find(s => s.k === 'Msun').near['1.98892e30'] || 0} places, every one of them a debt to retire`); }

/* 8 — an edition update is not a contradiction (audit item 6) */
{ const me18 = 9.1093837015e-31, me22 = C.me.v, a18 = 7.2973525693e-3, a22 = C.alpha.v, R18 = 10973731.568160, R22 = 10973731.568157;
  const shift = me22 / me18 - 1, predicted = (a18 / a22) ** 2 * (R22 / R18) - 1, inSigma = (me22 - me18) / C.me.u;
  const Mo14 = C.GMsun.v / 6.67408e-11, sunShift = rel(Mo14, K.Msun);
  check(Math.abs(shift - predicted) < 2e-11 && Math.abs(rel(Mo14, 1.98847e30)) < 3e-6,
    'item 6: the electron mass moved from CODATA 2018 to 2022 because α moved — m_e = 2hR∞/(cα²) predicts the shift to the digits printed. That is a new adjustment of shared data, not a measurement the atlas contradicted; "4.4σ" is the shift in units of one edition\'s σ, not a significance. Likewise the old M☉, 1.98847·10³⁰ kg, is GM☉ over the 2014 G: an internal-consistency fix',
    `Δm_e/m_e = ${shift.toExponential(3)} · from α and R∞ ${predicted.toExponential(3)} · shift/u(2022) = ${inSigma.toFixed(1)} · GM☉/G(2014) = ${Mo14.toExponential(6)} kg · its distance from GM☉/G(2022) ${sunShift.toExponential(2)} = ${(sunShift / (C.G.u / C.G.v)).toFixed(1)} u(G)`); }

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
