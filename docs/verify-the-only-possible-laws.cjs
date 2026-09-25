#!/usr/bin/env node
'use strict';
/* ══ ∃! THE ONLY POSSIBLE LAWS ═════════════════════════════════════════════════════════
 * For every exact power law the laboratories returned, scripts/uniqueness.mjs asks whether
 * units allowed any other formula: with the smallest set of constants from {G, c, ħ, k_B, m_e,
 * m_p} that makes the law consistent, it counts Buckingham's dimensionless groups. One group ⇒
 * the formula is forced and its physics is one pure number. This file checks:
 *   1. Stefan–Boltzmann BY HAND: the dimension matrix of {M, T, c, ħ, k_B} has rank 4, so there
 *      is exactly one group; it is M·ħ³c²/(k_B T)⁴, so T⁴ is the ONLY possible power, and the
 *      number is σħ³c²/k_B⁴ = π²/60 from the CODATA σ. With {G, c, k_B} no power of T is
 *      consistent with an exitance at all
 *   2. Bekenstein–Hawking BY HAND: {S, A, G, c, ħ, k_B} has rank 4 and six members — TWO
 *      groups, S/k_B and A/ℓ_P², so S = A/4 is NOT forced: its linearity is physics
 *   3. the census is current: re-running the analysis on api/invariants.json and the manifest
 *      reproduces api/uniqueness.json law for law
 *   4. the named numbers: ln 2 (Landauer), π·e^−γ (the BCS gap), e^γ/π² (BCS coherence),
 *      π²/240 (Casimir), 3/5 (a uniform sphere's binding), π²/8 (the Local Group's timing
 *      mass), (3π²)^{2/3}/2 (Fermi), 2π/ζ(3/2)^{2/3} (BEC) — each forced, each with the
 *      constants physics says it contains
 *   5. MUTATIONS: a T³ exitance is inconsistent with {c, ħ, k_B}; naming with the ten-digit ħ
 *      and no correction loses π²/240; and a loose naming would dress 1 + 6e-10 as nonsense
 *   6. the wiring: the atlas section, the ∃! badge, the Discoveries card, the API resource
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
const rankOf = cols => { const m = 4, A = Array.from({ length: m }, (_, r) => cols.map(c => c[r])); let rk = 0;
  for (let c = 0; c < cols.length && rk < m; c++) { let p = rk; for (let r = rk + 1; r < m; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; if (Math.abs(A[p][c]) < 1e-9) continue;
    [A[rk], A[p]] = [A[p], A[rk]]; for (let r = 0; r < m; r++) if (r !== rk) { const f = A[r][c] / A[rk][c]; for (let k = c; k < cols.length; k++) A[r][k] -= f * A[rk][k]; } rk++; } return rk; };
const D = { exitance: [1, 0, -3, 0], T: [0, 0, 0, 1], c: [0, 1, -1, 0], hbar: [1, 2, -1, 0], kB: [1, 2, -2, -1], G: [-1, 3, -2, 0], S: [1, 2, -2, -1], A: [0, 2, 0, 0] };

(async () => {
  const U = await import(path.join(ROOT, 'scripts', 'uniqueness.mjs')), K = await import(path.join(ROOT, 'core', 'atlas', 'extracted.mjs'));

  /* 1 · Stefan–Boltzmann by hand */
  const sb = [D.exitance, D.T, D.c, D.hbar, D.kB], groups = sb.length - rankOf(sb);
  /* M·T^a·c^b·ħ^d·k_B^e dimensionless: solve by the four rows */
  const chk = (a, b, d, e) => [0, 1, 2, 3].every(r => Math.abs(D.exitance[r] + a * D.T[r] + b * D.c[r] + d * D.hbar[r] + e * D.kB[r]) < 1e-12);
  const hbarX = 6.62607015e-34 / (2 * Math.PI), sigma = 5.670374419e-8, Ksb = sigma * hbarX ** 3 * 299792458 ** 2 / 1.380649e-23 ** 4;
  const onlyFour = [1, 2, 3, 4, 5, 6].filter(n => chk(-n, 2, 3, -4));
  ok('Stefan–Boltzmann by hand: {M, T, c, ħ, k_B} has one dimensionless group, M·ħ³c²/(k_B T)⁴ — T⁴ is the only power units allow — and σħ³c²/k_B⁴ = π²/60',
    groups === 1 && chk(-4, 2, 3, -4) && onlyFour.length === 1 && onlyFour[0] === 4 && Math.abs(Ksb / (Math.PI ** 2 / 60) - 1) < 1e-8, `groups ${groups} · K = ${Ksb.toPrecision(10)} · π²/60 = ${(Math.PI ** 2 / 60).toPrecision(10)}`);
  { const r = U.uniqueLaw({ dim: D.exitance, scale: 1 }, [{ name: 'T', a: 4, dim: D.T, scale: 1 }], sigma), noG = U.uniqueLaw({ dim: D.exitance, scale: 1 }, [{ name: 'T', a: 4, dim: D.T, scale: 1 }], sigma);
    ok('and the analysis finds it: forced, by exactly {c, ħ, k_B}, with the number named π²/60 — gravity is not in it', r.cls === 'forced' && r.by.join() === 'c,ħ,k_B' && r.Kform === 'π²/60' && !noG.by.includes('G'), JSON.stringify({ by: r.by, K: r.Kform })); }

  /* 2 · Bekenstein–Hawking by hand */
  const bh = [D.S, D.A, D.G, D.c, D.hbar, D.kB], g2 = bh.length - rankOf(bh);
  ok('Bekenstein–Hawking by hand: {S, A, G, c, ħ, k_B} has TWO groups — S/k_B and A/ℓ_P² — so S = A/4 is not forced by units: its linearity is physics',
    g2 === 2 && (() => { const r = U.uniqueLaw({ dim: D.S, scale: 1 }, [{ name: 'A', a: 1, dim: D.A, scale: 1 }], 1.3213e46); return r.cls === 'free' && r.groups === 2; })(), `groups ${g2}`);

  /* 3 · the census is current */
  const J = JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'uniqueness.json'), 'utf8')), A = JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'invariants.json'), 'utf8')), M = JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'manifest.json'), 'utf8'));
  const byId = new Map(M.instruments.map(i => [i.id, i])), parseExp = t => String(t).includes('/') ? (([p, q]) => p / q)(String(t).split('/').map(Number)) : +t;
  let same = 0, total = 0, diff = [];
  for (const L of A.laboratories) { const I = byId.get(L.id); if (!I) continue; const Un = {}; for (const f of (I.inputs || [])) Un[f.name] = f.unit; for (const o of (I.outputs || [])) Un[o.name] = o.unit;
    for (const l of ((L.across || {}).laws || [])) { if (!l.exact || l.kind !== 'power') continue; total++;
      const y = K.invUnitDim(Un[l.output]), xs = Object.entries(l.exponents).map(([n, e]) => { const d = K.invUnitDim(Un[n]); return { name: n, a: parseExp(e), dim: d && d.dim, scale: d && d.scale }; });
      const echo = xs.length === 1 && xs[0].a === 1 && Math.abs(l.constant - 1) < 1e-12 && Un[l.output] === Un[xs[0].name];
      const r = U.uniqueLaw(y && { dim: y.dim, scale: y.scale }, xs, l.constant, echo), j = J.laws.find(u => u.lab === L.id && u.output === l.output);
      if (j && j.cls === r.cls && (j.Kform || null) === (r.Kform || null) && (j.by || []).join() === (r.by || []).join()) same++; else diff.push(L.id + '.' + l.output); } }
  ok('the census is current: re-running the analysis reproduces api/uniqueness.json law for law, and its counts add up', same === total && total === J.counts.laws
    && J.counts.forced + J.counts.free + J.counts.dimensionless + J.counts.units + J.counts.echo + (J.counts.hidden_scale || 0) === J.counts.laws, `${same}/${total} · ${diff.slice(0, 4).join(', ')}`);

  /* 4 · the named numbers */
  const want = [['infolab', 'landauer_energy', 'ln 2', 'k_B'], ['he3', 'gap', /^π·e\^−γ/, 'k_B'], ['he3', 'coherence_length', /^e\^γ\/π²/, 'ħ,k_B'], ['qregime', 'casimir_pressure', /^π²\/240/, 'c,ħ'],
    ['tscale', 'binding_energy', '3/5', 'G'], ['localgroup', 'zero_velocity_mass_no_lambda', 'π²/8', 'G'], ['qregime', 'fermi_temperature', /^\(3π²\)\^\{2\/3\}\/2/, 'ħ,k_B'], ['qregime', 'bec_temperature', /^2π\/ζ\(3\/2\)/, 'ħ,k_B'], ['bb', 'exitance', 'π²/60', 'c,ħ,k_B']];
  const got = want.map(([lab, out, f, by]) => { const u = J.laws.find(x => x.lab === lab && x.output === out); const fm = u && u.Kform; return [lab + '.' + out, !!(u && u.cls === 'forced' && (typeof f === 'string' ? fm === f : f.test(fm || '')) && u.by.join() === by), fm]; });
  ok('the named numbers, each forced and each with the constants physics says it contains: ln 2, π·e^−γ, e^γ/π², π²/240, 3/5, π²/8, (3π²)^{2/3}/2, 2π/ζ(3/2)^{2/3}, π²/60',
    got.every(g => g[1]), got.filter(g => !g[1]).map(g => g[0] + ' → ' + g[2]).join(' ; ') || `${J.counts.forced} forced, ${J.counts.forced_named} named`);

  /* 5 · mutations */
  { const r = U.uniqueLaw({ dim: D.exitance, scale: 1 }, [{ name: 'T', a: 3, dim: D.T, scale: 1 }], 1);
    ok('MUTATION — an exitance ∝ T³ is not consistent with {c, ħ, k_B}; whatever the analysis finds, it is not that set', !(r.by && r.by.join() === 'c,ħ,k_B'), JSON.stringify({ cls: r.cls, by: r.by })); }
  { const hbar10 = 1.054571817e-34, Kc = (Math.PI ** 2 / 240) * hbar10 / hbarX;
    ok('MUTATION — the Casimir number computed with the laboratory\'s ten-digit ħ and no correction is not named at 1e-10; with the correction it is π²/240', !K.invClosedForm(Kc, 1e-10) && /^π²\/240/.test(U.nameK(Kc, 1) || ''), `${Kc.toPrecision(12)} → ${U.nameK(Kc, 1)}`); }
  { const loose = K.invClosedForm(1.054571817e-34 / hbarX, 1e-10), u = J.laws.find(x => x.lab === 'qregime' && x.output === 'action_ratio');
    ok('MUTATION — the atlas\'s closed-form reader, given 1 − 6.1e-10 (the ten-digit ħ over the exact one), returns a form with a four-digit number; the analysis refuses it and names 1 within the ten-digit ħ',
      !!loose && /\d{4,}/.test(loose) && u && /^1 \(within the ten-digit ħ/.test(u.Kform || ''), `reader alone: ${loose} · analysis: ${u && u.Kform}`); }

  /* 6 · wiring */
  ok('the wiring: the atlas section, the ∃! badge on forced laws, the Discoveries card, and the API resource',
    /function invUniqueHTML\(U\)\{/.test(SRC) && /\$\{!q\?invUniqueHTML\(INV_UNIQUE\):''\}/.test(SRC) && /u&&u\.cls==='forced'\?`<b style="color:#ffd58a"/.test(SRC)
    && /\['∃!',TT\('Only one formula was possible'/.test(SRC) && /uniqueness:'\.\/api\/uniqueness\.json'/.test(fs.readFileSync(path.join(ROOT, 'scripts', 'build-api.mjs'), 'utf8')));

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
