#!/usr/bin/env node
/* ══ ∃! THE ONLY POSSIBLE LAWS ═════════════════════════════════════════════════════════
   The census found 185 exact power laws y = C·Πx^a in the laboratories. For each, this asks
   the question dimensional analysis can answer and nothing else can: WAS THERE A CHOICE?

   Take the output, the inputs the law uses, and the smallest set of fundamental constants
   from {G, c, ħ, k_B, m_e, m_p} with which a dimensionless combination exists at all. Count
   the independent dimensionless groups (Buckingham: quantities minus rank of their dimension
   matrix). If there is exactly ONE, the formula is the only one units allow — the exponents
   are forced, and all the physics the law carries is one pure number, which is then named.
   If there are two or more, units leave a free function and the law's form is a fact about
   nature, not about units. A dimensionless input always leaves such freedom.

   Several constant sets of the same size can each force a law; they force DIFFERENT
   exponents, and the one that matches the laboratory says which physics is inside it —
   Stefan–Boltzmann's T⁴ is forced with {c, ħ, k_B}; with {G, c, k_B} units would demand
   a different power. The script reads api/invariants.json and api/manifest.json only, and
   writes api/uniqueness.json. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const K = await import(join(ROOT, 'core', 'atlas', 'extracted.mjs'));
const A = JSON.parse(readFileSync(join(ROOT, 'api', 'invariants.json'), 'utf8'));
const M = JSON.parse(readFileSync(join(ROOT, 'api', 'manifest.json'), 'utf8'));
const identity = JSON.parse(readFileSync(join(ROOT, 'version.json'), 'utf8'));

/* the constants: CODATA 2018 values and dimensions over M, L, T, Θ. ħ is h/2π from the EXACT h —
   the ten-digit 1.054571817e-34 is off by 6e-10, enough to hide π²/60 in Stefan–Boltzmann */
export const CONSTS = [['G', 6.6743e-11, [-1, 3, -2, 0]], ['c', 299792458, [0, 1, -1, 0]], ['ħ', 6.62607015e-34 / (2 * Math.PI), [1, 2, -1, 0]], ['k_B', 1.380649e-23, [1, 2, -2, -1]],
  ['m_e', 9.1093837015e-31, [1, 0, 0, 0]], ['m_p', 1.67262192369e-27, [1, 0, 0, 0]]];
/* numbers that nature, not units, has fixed and physics has named — checked after the rational×π forms */
export const FAMOUS = [['π·e^−γ (the BCS gap Δ/k_BT_c)', Math.PI * Math.exp(-0.5772156649015329)], ['ζ(3)', 1.2020569031595942], ['x_W = 5(1 − e^−x) (Wien, wavelength)', 4.965114231744276],
  ['x = 3(1 − e^−x) (Wien, frequency)', 2.8214393721220787], ['γ (Euler)', 0.5772156649015329], ['ln 2', Math.LN2],
  ['(3π²)^{2/3}/2 (the Fermi gas)', Math.pow(3 * Math.PI ** 2, 2 / 3) / 2], ['2π/ζ(3/2)^{2/3} (Bose–Einstein condensation)', 2 * Math.PI / Math.pow(2.6123753486854883, 2 / 3)],
  ['2x_W⁵/((2π)⁴(e^{x_W} − 1)) (the peak of Planck\'s spectrum)', 2 * 4.965114231744276 ** 5 / ((2 * Math.PI) ** 4 * Math.expm1(4.965114231744276))],
  ['e^γ/π² (the BCS coherence length)', Math.exp(0.5772156649015329) / Math.PI ** 2], ['3^{−1/4} (the triangular vortex lattice)', Math.pow(3, -0.25)]];
const HBAR10 = 1.054571817e-34, HBARX = 6.62607015e-34 / (2 * Math.PI);
/* the looser pass is kept only for SIMPLE forms — no number of three digits — so it cannot dress a
   rounding error as 2143/22π⁴ */
const simple = f => f && !/\d{3,}/.test(f.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, ''));
export function nameK(v, hbarPow) { if (!(v > 0)) return null;
  /* 1 · a laboratory that used the ten-digit ħ leaves its number off by (ħ/ħ₁₀)^k: named within that first,
     because that is a known systematic; 2 · strict, rejecting four-digit numbers (the square-root search
     can dress a rounding error as 2143/22π⁴); 3 · loose, for simple forms only */
  const ok4 = f => f && !/\d{4,}/.test(f.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, ''));
  let f = null;
  if (hbarPow) { const w = v * Math.pow(HBARX / HBAR10, hbarPow), g = K.invClosedForm(w, 1e-10); if (ok4(g) && !(K.invClosedForm(v, 1e-10) === g)) f = g + ' (within the ten-digit ħ the laboratory uses)'; else if (ok4(g)) f = g; }
  if (!f) { const g = K.invClosedForm(v, 1e-10); if (ok4(g)) f = g; }
  if (!f) { const g = K.invClosedForm(v, 3e-9); if (simple(g)) f = g; }
  if (f) return f;
  for (const [n, x] of FAMOUS) for (const [m, lab] of [[1, ''], [2, '2·'], [0.5, '½·'], [1 / Math.PI, '1/π · '], [Math.PI, 'π·']]) if (Math.abs(v / (m * x) - 1) < 1e-7) return lab + n; return null; }
const rat = e => { if (Math.abs(e - Math.round(e)) < 1e-9) return String(Math.round(e)); for (let q = 2; q <= 12; q++) { const p = Math.round(e * q); if (Math.abs(p / q - e) < 1e-9) return p + '/' + q; } return String(+e.toFixed(6)); };
const parseExp = s => { const t = String(s); if (t.includes('/')) { const [p, q] = t.split('/').map(Number); return p / q; } return +t; };
const rank = cols => { if (!cols.length) return 0; const m = cols[0].length, A2 = Array.from({ length: m }, (_, r) => cols.map(c => c[r])); let rk = 0;
  for (let c = 0; c < cols.length && rk < m; c++) { let p = rk; for (let r = rk + 1; r < m; r++) if (Math.abs(A2[r][c]) > Math.abs(A2[p][c])) p = r; if (Math.abs(A2[p][c]) < 1e-9) continue;
    [A2[rk], A2[p]] = [A2[p], A2[rk]]; for (let r = 0; r < m; r++) if (r !== rk) { const f = A2[r][c] / A2[rk][c]; for (let k = c; k < cols.length; k++) A2[r][k] -= f * A2[rk][k]; } rk++; } return rk; };
const subsets = (arr, k) => { const out = []; const rec = (s, acc) => { if (acc.length === k) { out.push(acc.slice()); return; } for (let i = s; i < arr.length; i++) { acc.push(arr[i]); rec(i + 1, acc); acc.pop(); } }; rec(0, []); return out; };

/* solve Σ b_j d_j = r exactly (small linear system by least squares, then checked) */
function solveFor(ds, r) { if (!ds.length) return r.every(v => Math.abs(v) < 1e-9) ? [] : null;
  const n = ds.length, AtA = Array.from({ length: n }, (_, i) => ds.map(dj => ds[i].reduce((s, v, k) => s + v * dj[k], 0))), Atr = ds.map(d => d.reduce((s, v, k) => s + v * r[k], 0));
  const M2 = AtA.map((row, i) => [...row, Atr[i]]);
  for (let c = 0; c < n; c++) { let p = c; for (let q = c + 1; q < n; q++) if (Math.abs(M2[q][c]) > Math.abs(M2[p][c])) p = q; if (Math.abs(M2[p][c]) < 1e-12) return null; [M2[c], M2[p]] = [M2[p], M2[c]];
    for (let q = 0; q < n; q++) if (q !== c) { const f = M2[q][c] / M2[c][c]; for (let k = c; k <= n; k++) M2[q][k] -= f * M2[c][k]; } }
  const bb = M2.map((row, i) => row[n] / row[i]); const back = r.map((_, k) => ds.reduce((s, d, j) => s + bb[j] * d[k], 0));
  return back.every((v, k) => Math.abs(v - r[k]) < 1e-9) ? bb : null; }
/* the analysis of one law y = C·Πx^a: (1) the smallest set of constants that makes it dimensionally
   consistent; (2) with that set, whether units allow ANY other exponents (one dimensionless group
   = forced, the only possible law; more = free, the form is physics); (3) the pure number left */
export function uniqueLaw(y, xs, C, echo) {
  if (!y || xs.some(x => !x.dim)) return { cls: 'units', why: 'a unit is not in SI form' };
  if (echo) return { cls: 'echo', why: 'the output repeats an input in the same units — a readout, not a law' };
  if ([y, ...xs].every(q => q.dim.every(v => Math.abs(v) < 1e-12))) return { cls: 'dimensionless', why: 'every quantity is a pure number — units say nothing about the form' };
  const r = y.dim.map((v, k) => v - xs.reduce((s, x) => s + x.a * x.dim[k], 0));
  for (let size = 0; size <= 4; size++) {
    const cands = [];
    for (const S of subsets(CONSTS, size)) { const bb = solveFor(S.map(q => q[2]), r); if (!bb) continue;
      const cols = [y.dim, ...xs.map(x => x.dim), ...S.map(q => q[2])], groups = cols.length - rank(cols);
      const Kv = C * y.scale * xs.reduce((m, x) => m * Math.pow(x.scale, -x.a), 1) / S.reduce((m, q, j) => m * Math.pow(q[1], bb[j]), 1);
      const hi = S.findIndex(q => q[0] === 'ħ');
      cands.push({ S: S.map(q => q[0]), consts: Object.fromEntries(S.map((q, j) => [q[0], rat(bb[j])])), groups, K: Kv, Kform: nameK(Kv, hi >= 0 ? bb[hi] : 0) }); }
    /* the physics inside a law is the constant set that leaves a NAMED number, else a number of order one */
    if (cands.length) { cands.sort((u, v) => (u.groups - v.groups) || ((u.Kform ? 0 : 1) - (v.Kform ? 0 : 1)) || (Math.abs(Math.log10(u.K)) - Math.abs(Math.log10(v.K))));
      const h = cands[0], also = cands.slice(1).map(c => ({ S: c.S, groups: c.groups, K: c.K, Kform: c.Kform }));
      if (h.groups === 1) return { cls: 'forced', size, by: h.S, consts: h.consts, K: h.K, Kform: h.Kform, also,
        ...(!h.Kform && Math.abs(Math.log10(h.K)) > 2 ? { note: 'the number is far from one and unnamed: it carries a scale the laboratory holds fixed (a speed, a mass, a calibration), not a constant of nature' } : {}) };
      return { cls: 'free', size, by: h.S, consts: h.consts, groups: h.groups, K: h.K, Kform: h.Kform, also, why: 'with the constants that make it consistent, units still leave ' + (h.groups - 1) + ' free dimensionless combination' + (h.groups > 2 ? 's' : '') + ' — the form is physics, not units' }; }
  }
  return { cls: 'hidden-scale', why: 'no set of up to four constants from {G, c, ħ, k_B, m_e, m_p} makes it consistent — the laboratory holds a dimensional parameter fixed (a speed, a mass, a length) that the law carries inside its coefficient' };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const byId = new Map(M.instruments.map(i => [i.id, i])), out = [];
  for (const L of A.laboratories) { const I = byId.get(L.id); if (!I) continue; const U = {}; for (const f of (I.inputs || [])) U[f.name] = f.unit; for (const o of (I.outputs || [])) U[o.name] = o.unit;
    for (const l of ((L.across || {}).laws || [])) { if (!l.exact || l.kind !== 'power') continue;
      const y = K.invUnitDim(U[l.output]), xs = Object.entries(l.exponents).map(([n, e]) => { const d = K.invUnitDim(U[n]); return { name: n, a: parseExp(e), dim: d && d.dim, scale: d && d.scale }; });
      const echo = xs.length === 1 && xs[0].a === 1 && Math.abs(l.constant - 1) < 1e-12 && U[l.output] === U[xs[0].name];
      const r = uniqueLaw(y && { dim: y.dim, scale: y.scale }, xs, l.constant, echo);
      out.push({ lab: L.id, output: l.output, law: l.law, units: { [l.output]: U[l.output], ...Object.fromEntries(xs.map(x => [x.name, U[x.name]])) }, ...r }); } }
  const cnt = k => out.filter(o => o.cls === k).length;
  const res = { schema: 'hcc.uniqueness/1', version: identity.version, build: identity.build,
    method: 'Buckingham π over the law\'s output, the inputs it uses and the smallest subset of {G, c, ħ, k_B, m_e, m_p} admitting a dimensionless group; exactly one group ⇒ the formula is forced by units and the remaining pure number is named to 1e-7',
    counts: { laws: out.length, forced: cnt('forced'), forced_named: out.filter(o => o.cls === 'forced' && o.Kform).length, free: cnt('free'), hidden_scale: cnt('hidden-scale'), dimensionless: cnt('dimensionless'), units: cnt('units'), echo: cnt('echo') },
    laws: out };
  writeFileSync(join(ROOT, 'api', 'uniqueness.json'), JSON.stringify(res, null, 1) + '\n');
  console.log(JSON.stringify(res.counts));
  for (const o of out.filter(o => o.cls === 'forced' || process.env.ALL)) console.log(`${o.cls==='forced'?'∃!':o.cls} ${o.lab}.${o.output}: ${o.law}  ⇐ {${(o.by||[]).join(', ')}}${o.groups?' groups '+o.groups:''}  K = ${o.K?.toPrecision(8)}${o.Kform ? ' = ' + o.Kform : ''}`);
}
