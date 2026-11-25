#!/usr/bin/env node
/* THE AUDIT OF THE FIRST GOLDEN-LATTICE TEST (Frontier II, items 1–5). The first result (golden-lattice-result.json) is kept
   unchanged; this writes golden-lattice-result-v2.json (the same preregistered protocol with the implementation error fixed)
   and statistical-audit.json.
     1. BASES did not contain φ, 2 and e exactly, as the preregistration said it would: v2 uses the 241-point grid ∪ {φ, 2, e},
        ranks φ among all of them including itself, and corrects the scan over the same set;
     2. the Float32 embedding against the NASA originals (decimal strings and asymmetric uncertainties);
     3. calibration on synthetic populations drawn from families the null generator does not use;
     4. system means against multiplicity, period, host radius and facility;
     5. the power of the full registered criterion (p < 0.05 AND φ first in the scan), not only of the primary test.
   Usage: node scripts/golden-lattice-audit.mjs [--v2] [--audit] */
import fs from 'node:fs'; import path from 'node:path';
import * as T from './golden-lattice-test.mjs';
import { parseCSV } from './golden-lattice-replication.mjs';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..'), out = (f, o) => fs.writeFileSync(path.join(ROOT, 'docs/scale-nexus', f), JSON.stringify(o, null, 1) + '\n');
export const BASES_V2 = [...new Set([...T.BASES, T.PHI, 2, Math.E])].sort((a, b) => a - b);
const gauss = r => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
export function scanSet(pl, bases) { const z = bases.map(b => T.Zstat(T.rungs(pl, b)).Z); let bi = 0; z.forEach((v, i) => { if (v > z[bi]) bi = i; }); return { z, best: { b: bases[bi], Z: z[bi] } }; }
export function rankOf(base, bases, z) { const i = bases.indexOf(base), me = z[i]; return 1 + z.filter((v, j) => j !== i && v > me).length; }
function v2(hold) { const gen = T.makeNull(hold, 4410), obs = T.Zstat(T.rungs(hold, T.PHI)), sc = scanSet(hold, BASES_V2), nZ = [], nM = [];
  for (let k = 0; k < 2000; k++) { const s = gen(); nZ.push(T.Zstat(T.rungs(s, T.PHI)).Z); nM.push(scanSet(s, BASES_V2).best.Z); }
  const pP = (1 + nZ.filter(x => x >= obs.Z).length) / 2001, pS = (1 + nM.filter(x => x >= sc.best.Z).length) / 2001, ci = T.bootstrapR(hold, T.PHI, 2000, 4417);
  const rk = b => rankOf(b, BASES_V2, sc.z), zOf = b => sc.z[BASES_V2.indexOf(b)];
  return { version: 2, correction: 'BASES now contains φ, 2 and e exactly (241-point grid ∪ {φ, 2, e} = ' + BASES_V2.length + ' bases); φ is ranked among all of them including itself; the scan max and its null use the same set. Data, seed and every other step unchanged.',
    n: hold.length, R: obs.R, Z: obs.Z, R_CI95: [ci.lo, ci.hi], pPrimary: pP, scanBestBase: sc.best.b, scanBestZ: sc.best.Z, pScanCorrected: pS, bases: BASES_V2.length,
    rank: { phi: rk(T.PHI), two: rk(2), e: rk(Math.E) }, Z_at: { phi: zOf(T.PHI), two: zOf(2), e: zOf(Math.E) },
    verdict: pP < 0.05 && rk(T.PHI) === 1 ? 'positive in this population' : 'no evidence for a golden lattice in this population' }; }
/* the NASA originals, joined by planet name */
function originals() { const rows = parseCSV(fs.readFileSync(path.join(ROOT, 'data/scale-nexus/raw/pscomppars.csv'), 'utf8')); return new Map(rows.map(r => [r.pl_name, r])); }
function embeddedNames() { const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), j = JSON.parse(html.match(/<script type="application\/json" id="hcc-exoplanets">([\s\S]*?)<\/script>/)[1]), meta = JSON.parse(html.match(/const EXO_META=Object\.freeze\((.*?)\);\n/)[1]);
  const p = new Float32Array(Uint8Array.from(Buffer.from(j.p, 'base64')).buffer), pi = new Uint16Array(Uint8Array.from(Buffer.from(j.pi, 'base64')).buffer), tr = meta.methods.indexOf('Transit'), out = [];
  for (let q = 0; q < p.length / 7; q++) if (p[7 * q + 6] === tr && p[7 * q + 1] > 0) out.push({ name: j.pn[q], host: j.hn[pi[q]], f32: p[7 * q + 1] }); return out; }
const decimalsOfString = s => { const t = String(s).trim(); if (!t.includes('.')) return 0; const d = t.split('.')[1].replace(/0+$/, ''); return d.length; };
function audit(hold, expl) { const O = originals(), E = embeddedNames(), res = {};
  /* 2 · Float32 against the originals */
  let matched = 0, exact = 0, decAgree = 0, changed = 0, errBoth = 0, relErr = [], asym = []; const decConf = {};
  for (const e of E) { const o = O.get(e.name); if (!o || o.pl_rade === '') continue; matched++; const x = +o.pl_rade, f = e.f32, dS = decimalsOfString(o.pl_rade), dF = T.decimalsOf(f);
    if (Math.abs(Math.fround(x) - f) === 0) exact++; else changed++;
    if (Math.abs(Math.fround(x) - f) === 0) { if (Math.min(dS, 4) === dF) decAgree++; const key = `${Math.min(dS, 4)}→${dF}`; decConf[key] = (decConf[key] || 0) + 1; }
    const e1 = Math.abs(+o.pl_radeerr1), e2 = Math.abs(+o.pl_radeerr2); if (o.pl_radeerr1 !== '' && o.pl_radeerr2 !== '' && e1 > 0 && e2 > 0) { errBoth++; relErr.push((e1 + e2) / 2 / x); asym.push(e1 / e2); } }
  relErr.sort((a, b) => a - b); asym.sort((a, b) => a - b); const q = (a, p) => a[Math.floor(p * (a.length - 1))];
  res.float32 = { embeddedTransit: E.length, matchedByName: matched, identicalToFloat32: exact, changedSinceSnapshot: changed, decimalsReconstructedCorrectly: decAgree, decimalsConfusion: decConf,
    withBothErrors: errBoth, relativeError: { median: q(relErr, 0.5), p90: q(relErr, 0.9) }, asymmetry_err1_over_err2: { p10: q(asym, 0.1), median: q(asym, 0.5), p90: q(asym, 0.9) } };
  /* the primary statistic with the original decimals, and its spread when radii are redrawn within their asymmetric errors */
  const byName = new Map(E.map(e => [e.name, e])), holdNames = new Set(); { const used = new Map(); for (const h of hold) { const k = h.host + '|' + h.Re; used.set(k, (used.get(k) || 0) + 1); } for (const e of E) { const k = e.host + '|' + e.f32; if (used.get(k) > 0) { holdNames.add(e.name); used.set(k, used.get(k) - 1); } } }
  const holdOrig = [...holdNames].map(n => ({ n, o: O.get(n) })).filter(x => x.o && x.o.pl_rade !== '');
  const Zorig = T.Zstat(T.rungs(holdOrig.map(x => ({ host: x.o.hostname, Re: +x.o.pl_rade })), T.PHI)), r = T.rng(4420), Zs = [];
  for (let k = 0; k < 400; k++) { const pl = holdOrig.map(x => { const R = +x.o.pl_rade, e1 = Math.abs(+x.o.pl_radeerr1) || 0, e2 = Math.abs(+x.o.pl_radeerr2) || 0, g = gauss(r); return { host: x.o.hostname, Re: Math.max(0.05, R + (g > 0 ? e1 : e2) * g) }; }); Zs.push(T.Zstat(T.rungs(pl, T.PHI)).Z); }
  Zs.sort((a, b) => a - b); res.measurementNoise = { holdoutMatched: holdOrig.length, Z_phi_with_original_decimals: Zorig.Z, Z_phi_redrawn_within_errors: { p05: q(Zs, 0.05), median: q(Zs, 0.5), p95: q(Zs, 0.95) } };
  /* 3 · calibration on families the null does not use (system structure from the holdout's multiplicities, rounding as the catalogue's) */
  const mult = (() => { const m = new Map(); for (const h of hold) m.set(h.host, (m.get(h.host) || 0) + 1); return [...m.values()]; })(), decs = hold.map(h => T.decimalsOf(h.Re));
  const fam = { lognormal_0p30dex: rr => 0.35 + 0.30 * gauss(rr), uniformLog_0_to_1p2: rr => 1.2 * rr(), twoNarrow_0p08dex: rr => rr() < 0.5 ? 0.15 + 0.08 * gauss(rr) : 0.42 + 0.08 * gauss(rr),
    threePopulations_like_planets: rr => { const u = rr(); return u < 0.35 ? 0.12 + 0.07 * gauss(rr) : u < 0.8 ? 0.42 + 0.09 * gauss(rr) : 1.05 + 0.10 * gauss(rr); }, powerLawCutoff: rr => { let x; do { x = Math.log10(0.5 + 20 * Math.pow(rr(), 2.2)); } while (x > 1.4); return x; } };
  const make = (draw, rr) => { const pl = []; mult.forEach((m, i) => { const off = 0.08 * gauss(rr); for (let j = 0; j < m; j++) { const d = decs[Math.floor(rr() * decs.length)], s = Math.pow(10, d); let Re = Math.round(Math.pow(10, draw(rr) + off) * s) / s; if (!(Re > 0)) Re = 1 / s; pl.push({ host: 'h' + i, Re }); } }); return pl; };
  res.calibration = {}; const rc = T.rng(4430);
  for (const [name, draw] of Object.entries(fam)) { let fpP = 0, fpS = 0; const N1 = 60, N2 = 12;
    for (let t = 0; t < N1; t++) { const S = make(draw, rc), gen = T.makeNull(S, 5000 + t), z = T.Zstat(T.rungs(S, T.PHI)).Z, nz = []; for (let k = 0; k < 200; k++) nz.push(T.Zstat(T.rungs(gen(), T.PHI)).Z); if ((1 + nz.filter(x => x >= z).length) / 201 < 0.05) fpP++; }
    for (let t = 0; t < N2; t++) { const S = make(draw, rc), gen = T.makeNull(S, 6000 + t), m = scanSet(S, BASES_V2).best.Z, nm = []; for (let k = 0; k < 60; k++) nm.push(scanSet(gen(), BASES_V2).best.Z); if ((1 + nm.filter(x => x >= m).length) / 61 < 0.05) fpS++; }
    res.calibration[name] = { primaryFalsePositiveRate: fpP / N1, primaryDatasets: N1, scanFalsePositiveRate: fpS / N2, scanDatasets: N2 }; }
  /* 4 · system means against multiplicity, period, host radius and facility */
  const sys = new Map(); for (const x of holdOrig) { const h = x.o.hostname; if (!sys.has(h)) sys.set(h, []); sys.get(h).push(x.o); }
  const rowsS = [...sys.values()].map(v => ({ mean: v.reduce((a, o) => a + Math.log10(+o.pl_rade), 0) / v.length, n: v.length, P: v.reduce((a, o) => a + Math.log10(+o.pl_orbper || 1), 0) / v.length, Rs: +v[0].st_rad, fac: v[0].disc_facility, dev: v.map(o => Math.log10(+o.pl_rade)) }));
  const rankArr = a => { const idx = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]), rk = Array(a.length); idx.forEach(([, i], k) => rk[i] = k); return rk; }, spear = (a, b) => { const ok = a.map((v, i) => Number.isFinite(v) && Number.isFinite(b[i])), A = rankArr(a.filter((_, i) => ok[i])), B = rankArr(b.filter((_, i) => ok[i])), n = A.length, ma = (n - 1) / 2; let s = 0, sa = 0, sb = 0; for (let i = 0; i < n; i++) { s += (A[i] - ma) * (B[i] - ma); sa += (A[i] - ma) ** 2; sb += (B[i] - ma) ** 2; } return { rho: s / Math.sqrt(sa * sb), n }; };
  const means = rowsS.map(s => s.mean); res.systemMeans = { systems: rowsS.length, vsMultiplicity: spear(means, rowsS.map(s => s.n)), vsLogPeriod: spear(means, rowsS.map(s => s.P)), vsHostRadius: spear(means, rowsS.map(s => s.Rs)),
    byFacility: Object.fromEntries([...new Set(rowsS.map(s => s.fac))].map(f => { const m = rowsS.filter(s => s.fac === f).map(s => s.mean); return [f, { systems: m.length, meanLog10R: m.reduce((a, b) => a + b, 0) / Math.max(1, m.length) }]; }).filter(([, v]) => v.systems >= 20)),
    withinSystemSD_byMultiplicity: Object.fromEntries([2, 3, 4, 5].map(k => { const d = rowsS.filter(s => s.n === k).flatMap(s => s.dev.map(x => x - s.mean)); return [k, d.length ? Math.sqrt(d.reduce((a, b) => a + b * b, 0) / d.length) : null]; })) };
  /* 5 · power of the full registered criterion */
  const gen = T.makeNull(expl, 4410), nZ = []; for (let k = 0; k < 2000; k++) nZ.push(T.Zstat(T.rungs(gen(), T.PHI)).Z); const rp = T.rng(4440); res.power = {};
  for (const f of [0.05, 0.1, 0.2, 0.3]) { let prim = 0, full = 0; const N = 60;
    for (let t = 0; t < N; t++) { const sim = gen().map(q => { if (rp() < f) { const N0 = (Math.log(q.Re * T.REARTH) - Math.log(T.LP)) / Math.log(T.PHI), Nn = Math.round(N0) + 0.05 * gauss(rp); return { ...q, Re: Math.exp(Math.log(T.LP) + Nn * Math.log(T.PHI)) / T.REARTH }; } return q; });
      const z = T.Zstat(T.rungs(sim, T.PHI)).Z, p = (1 + nZ.filter(x => x >= z).length) / 2001; if (p < 0.05) { prim++; const sc = scanSet(sim, BASES_V2); if (rankOf(T.PHI, BASES_V2, sc.z) === 1) full++; } }
    res.power[f] = { primary: prim / N, fullCriterion: full / N, simulations: N }; }
  return res; }
if (import.meta.url === `file://${process.argv[1]}`) { const args = process.argv.slice(2), pop = T.loadPopulation(), { hold, expl } = T.split(pop.planets);
  if (args.includes('--v2')) { const r = v2(hold); out('golden-lattice-result-v2.json', { protocol: 'docs/scale-nexus/PREREGISTRATION.md', supersedes_implementation_of: 'golden-lattice-result.json (kept unchanged)', sha256: pop.sha256, seed: 4410, replicates: 2000, holdout: r }); console.log(JSON.stringify(r, null, 1)); }
  if (args.includes('--audit')) { const a = audit(hold, expl); out('statistical-audit.json', { items: '1–5 of Frontier II', ...a }); console.log(JSON.stringify(a, null, 1)); } }
