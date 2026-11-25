#!/usr/bin/env node
/* THE PREREGISTERED GOLDEN-LATTICE TEST (HCC Scale Nexus, v4.441) — docs/scale-nexus/PREREGISTRATION.md, executed as written.
   Population: transit radii of the NASA Exoplanet Archive composite table embedded in index.html; families = host systems;
   holdout = hosts with odd FNV-1a hash. Primary Z_φ = n·R̄², scan max over 241 bases in [1.2, 3]; null: KDE of system means
   (0.30 dex) + permuted within-system deviations + the catalogue's own rounding; 2000 replicates, seed 4410.
   Usage: node scripts/golden-lattice-test.mjs [--prereq] [--holdout] [--out FILE]
     --prereq   calibration and power on synthetic data built from the EXPLORATION half only
     --holdout  the primary and scan tests on the holdout (run once, after the preregistration is committed) */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
export const PHI = (1 + Math.sqrt(5)) / 2, LP = 1.616255e-35, REARTH = 6.3781e6, LOG10_PHI = Math.log10(PHI);
export const BASES = Array.from({ length: 241 }, (_, i) => Math.exp(Math.log(1.2) + (Math.log(3) - Math.log(1.2)) * i / 240));
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
const gauss = r => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
export function fnv1a(s) { let h = 0x811c9dc5; for (const ch of Buffer.from(String(s), 'utf8')) { h ^= ch; h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
/* the population, exactly as the preregistration names it */
export function loadPopulation(src) { const html = src || fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const j = JSON.parse(html.match(/<script type="application\/json" id="hcc-exoplanets">([\s\S]*?)<\/script>/)[1]), meta = JSON.parse(html.match(/const EXO_META=Object\.freeze\((.*?)\);\n/)[1]);
  const f32 = b => new Float32Array(Uint8Array.from(Buffer.from(b, 'base64')).buffer), u16 = b => new Uint16Array(Uint8Array.from(Buffer.from(b, 'base64')).buffer);
  const p = f32(j.p), pi = u16(j.pi), tr = meta.methods.indexOf('Transit'), out = [];
  for (let q = 0; q < p.length / 7; q++) { const R = p[7 * q + 1]; if (p[7 * q + 6] === tr && R > 0) out.push({ host: j.hn[pi[q]], Re: R }); }
  return { planets: out, sha256: meta.sha256, source: meta.source }; }
export const decimalsOf = x => { for (let d = 0; d <= 3; d++) { const s = Math.pow(10, d); if (Math.abs(x * s - Math.round(x * s)) < 2e-4 * Math.max(1, x * s * 1e-3)) return d; } return 4; };
export function rungs(planets, base) { const lb = Math.log(base || PHI); return planets.map(q => (Math.log(q.Re * REARTH) - Math.log(LP)) / lb); }
export function Zstat(Ns) { let x = 0, y = 0; for (const N of Ns) { const t = 2 * Math.PI * (N - Math.floor(N)); x += Math.cos(t); y += Math.sin(t); } const n = Ns.length; return { n, R: Math.hypot(x, y) / n, Z: (x * x + y * y) / n }; }
export function scan(planets) { let best = { Z: -1, b: null }; const all = []; for (const b of BASES) { const z = Zstat(rungs(planets, b)).Z; all.push(z); if (z > best.Z) best = { Z: z, b }; } return { best, all }; }
/* group by host */
function systems(planets) { const m = new Map(); for (const q of planets) { if (!m.has(q.host)) m.set(q.host, []); m.get(q.host).push(q); } return [...m.values()]; }
/* the null generator of the preregistration */
export function makeNull(planets, seed) { const S = systems(planets), r = rng(seed), mu = S.map(s => s.reduce((a, q) => a + Math.log10(q.Re), 0) / s.length), H = 0.30;
  const devBySize = new Map(); S.forEach((s, i) => { const k = s.length; if (!devBySize.has(k)) devBySize.set(k, []); devBySize.get(k).push(s.map(q => Math.log10(q.Re) - mu[i])); });
  const decs = planets.map(q => decimalsOf(q.Re));
  return () => { const out = []; for (const [k, devs] of devBySize) for (let t = 0; t < devs.length; t++) { const m0 = mu[Math.floor(r() * mu.length)] + H * gauss(r), dv = devs[Math.floor(r() * devs.length)];
      for (let j = 0; j < k; j++) { const d = decs[Math.floor(r() * decs.length)], s = Math.pow(10, d); let Re = Math.round(Math.pow(10, m0 + dv[j]) * s) / s; if (!(Re > 0)) Re = 1 / s; out.push({ host: 'sim' + t + '_' + k, Re }); } }
    return out; }; }
export function bootstrapR(planets, base, B, seed) { const S = systems(planets), r = rng(seed), vals = []; for (let b = 0; b < B; b++) { const pick = []; for (let i = 0; i < S.length; i++) pick.push(...S[Math.floor(r() * S.length)]); vals.push(Zstat(rungs(pick, base)).R); }
  vals.sort((a, b) => a - b); return { lo: vals[Math.floor(0.025 * B)], hi: vals[Math.floor(0.975 * B)] }; }
export function split(planets) { const hold = [], expl = []; for (const q of planets) (fnv1a(q.host) % 2 ? hold : expl).push(q); return { hold, expl }; }
/* the prerequisites, on the exploration half only */
export function prereq(expl, reps, seed) { const gen = makeNull(expl, seed), r = rng(seed + 1), Bnull = [];
  for (let k = 0; k < reps; k++) Bnull.push(Zstat(rungs(gen(), PHI)).Z);
  /* calibration: p of fresh null draws against the null distribution */
  const ps = []; for (let k = 0; k < 200; k++) { const z = Zstat(rungs(gen(), PHI)).Z; ps.push((1 + Bnull.filter(x => x >= z).length) / (1 + reps)); }
  const ks = (() => { ps.sort((a, b) => a - b); let d = 0; ps.forEach((p, i) => { d = Math.max(d, Math.abs(p - (i + 1) / ps.length), Math.abs(p - i / ps.length)); }); return d; })();
  const power = {}; for (const f of [0.1, 0.2, 0.3]) { let hit = 0; const T = 100;
    for (let t = 0; t < T; t++) { const sim = gen().map(q => { if (r() < f) { const N = (Math.log(q.Re * REARTH) - Math.log(LP)) / Math.log(PHI), Nn = Math.round(N) + 0.05 * gauss(r); return { ...q, Re: Math.exp(Math.log(LP) + Nn * Math.log(PHI)) / REARTH }; } return q; });
      const z = Zstat(rungs(sim, PHI)).Z; if ((1 + Bnull.filter(x => x >= z).length) / (1 + reps) < 0.05) hit++; }
    power[f] = hit / T; }
  return { n: expl.length, calibrationKS: ks, calibrationN: ps.length, power }; }
export function holdoutTest(hold, reps, seed) { const gen = makeNull(hold, seed), obs = Zstat(rungs(hold, PHI)), sc = scan(hold), nullZ = [], nullMax = [];
  for (let k = 0; k < reps; k++) { const s = gen(); nullZ.push(Zstat(rungs(s, PHI)).Z); nullMax.push(scan(s).best.Z); }
  const pPrimary = (1 + nullZ.filter(x => x >= obs.Z).length) / (1 + reps), pScan = (1 + nullMax.filter(x => x >= sc.best.Z).length) / (1 + reps);
  const rankPhi = 1 + sc.all.filter(z => z > obs.Z).length, ci = bootstrapR(hold, PHI, 2000, seed + 7);
  return { n: hold.length, systems: systems(hold).length, R: obs.R, Z: obs.Z, R_CI95: [ci.lo, ci.hi], pPrimary, scanBestBase: sc.best.b, scanBestZ: sc.best.Z, pScanCorrected: pScan, rankOfPhi: rankPhi, of: BASES.length,
    verdict: pPrimary < 0.05 && rankPhi === 1 ? 'positive in this population (needs an independent population before it is physics)' : 'no evidence for a golden lattice in this population' }; }
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2), pop = loadPopulation(), { hold, expl } = split(pop.planets), out = { protocol: 'docs/scale-nexus/PREREGISTRATION.md', population: pop.source, sha256: pop.sha256, transitPlanets: pop.planets.length, exploration: expl.length, holdout: hold.length, seed: 4410, replicates: 2000 };
  if (args.includes('--prereq')) out.prerequisites = prereq(expl, 2000, 4410);
  if (args.includes('--holdout')) out.holdout = holdoutTest(hold, 2000, 4410);
  const o = args.indexOf('--out'); const txt = JSON.stringify(out, null, 1); if (o >= 0) fs.writeFileSync(args[o + 1], txt + '\n'); console.log(txt); }
