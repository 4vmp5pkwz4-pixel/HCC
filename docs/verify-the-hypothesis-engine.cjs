#!/usr/bin/env node
'use strict';
/* ══ FROM A COINCIDENCE TO A HYPOTHESIS ════════════════════════════════════════════════════
 * /ratio A : B in the palette and HCC_HYPOTHESIS.ratio for agents: how near a rung of φ, how surprising against
 * the catalogue itself, how fragile under conventions, and the falsification test on the families. Checked:
 *   1. the arithmetic: φ^7 : 1 sits on rung 7 with δ = 0, and radius ↔ diameter moves it by log_φ 2 = 1.4404
 *   2. the catalogue as its own null: the fraction of its pairs at least as near a rung rises with δ, is 1 at
 *      δ = ½, and is about 2δ in between (the offsets of 6 328 pairs are close to uniform)
 *   3. a planted pair on a rung is called near and rare only when it is rare; a real near-coincidence of the atlas
 *      (proton radius / Bohr radius, δ = 0.04) is reported as common in the catalogue and convention-fragile
 *   4. the falsification test runs: a pair drawn from two families returns the families' audit
 *   5. wiring: the palette command, the card and the API
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { hypRatio, hypScales, hypDelta } = K, PHI = (1 + Math.sqrt(5)) / 2;
  { const r = hypRatio(PHI ** 7, 1, { family: false }), x2 = r.conventions.find(c => c.label.startsWith('×2 '));
    ok('the arithmetic: φ^7 : 1 is rung 7 with δ = 0, and radius ↔ diameter moves it by log_φ 2', r.n === 7 && r.delta < 1e-12 && Math.abs(x2.delta - Math.abs(Math.log(2) / Math.log(PHI) - 1)) < 1e-12, `N ${r.N.toFixed(12)} · δ(×2) ${x2.delta.toFixed(4)}`); }
  { const p = d => hypRatio(PHI ** (7 + d), 1, { family: false }).pPair, a = p(0.02), b = p(0.1), c = p(0.25), e = p(0.5);
    ok('the catalogue as its own null: the fraction of its 6 328 pairs as near a rung grows with δ, is 1 at δ = ½, and is ≈ 2δ in between', a < b && b < c && e === 1 && Math.abs(b - 0.2) < 0.06 && Math.abs(c - 0.5) < 0.08,
      `δ 0.02 → ${a.toFixed(3)} · 0.1 → ${b.toFixed(3)} · 0.25 → ${c.toFixed(3)} · 0.5 → ${e}`); }
  { const S = hypScales(), pr = hypRatio('Proton charge radius', 'Bohr', { family: false }), far = hypRatio(PHI ** 7.3, 1, { family: false });
    ok('a real near-coincidence of the atlas (proton / Bohr radius) is reported as common in the catalogue and convention-fragile; a ratio 0.3 rungs off is not near', S.length === 113 && pr.delta < 0.05 && pr.pPair > 0.05 && pr.survivesConventions === 0 && /often is/.test(pr.verdict) && /convention/.test(pr.verdict) && far.verdict === 'not near a rung',
      `proton/Bohr: φ^${pr.N.toFixed(3)}, δ ${pr.delta.toFixed(3)}, ${(100 * pr.pPair).toFixed(1)}% of pairs as near, ${pr.survivesConventions}/5 conventions keep it`); }
  { const r = hypRatio('Proton charge radius', 'Bohr', { M: 100 });
    ok('the falsification test runs: the two families are audited through the φ auditor', r.family && r.family.K >= 6 && r.family.groups.length === 2 && r.family.pLocal > 0 && r.family.pLocal <= 1 && r.family.rank >= 0,
      r.family ? `${r.family.groups.join(' + ')} · K ${r.family.K} · p ${r.family.pLocal.toFixed(3)} · rank ${(100 * r.family.rank).toFixed(0)}%` : 'no family'); }
  ok('wiring: /ratio in the palette, the hypothesis card, and HCC_HYPOTHESIS', /function ratioRow\(raw\)/.test(SRC) && /\(\?:ratio\|measure_ratio\)/.test(SRC) && /function hypCardOpen\(res\)/.test(SRC) && /globalThis\.HCC_HYPOTHESIS=Object\.freeze\(\{ratio:/.test(SRC));
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
