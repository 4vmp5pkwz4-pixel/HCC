#!/usr/bin/env node
'use strict';
/* ══ THE GHOST SKY ═════════════════════════════════════════════════════════════════════════
 * What an observer would see if space were S³/Γ: every source q and its images g·q, each seen along its great
 * circle, at distance R·arccos(Re g·q). Checked:
 *   1. the observer's own images ARE the group: for the Poincaré space the Milky Way reappears 12× at 36°, 20× at
 *      60°, 12× at 72°, 30× at 90°, 12× at 108°, 20× at 120°, 12× at 144° and once at 180° (× R) — the classes of I*
 *   2. Γ acts by isometries: every image of a source lies at the source's own distance χ from the matching image of
 *      the observer, and the primary image sits where the catalogue put it
 *   3. ghosts of the observer are inside the horizon exactly when R < χ_LSS/θ_min — half the radius below which
 *      matched circles appear (72 Gly for the Poincaré space, against 144)
 *   4. the angular size follows D_A = R sin(χ/R): the flat limit at small χ, smallest at a quarter of the way round,
 *      growing again beyond — the lens of a closed space
 *   5. wiring: the ghost sky is in the space-form laboratory, drawn from the atlas's catalogue, in the ledger
 */
const fs = require('node:fs'), path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); } else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };
(async () => {
  const K = await import(path.join(__dirname, '..', 'core', 'atlas', 'extracted.mjs'));
  const { ghostImages, ghostSelfDistances, ghostRmax, ghostQMul, ghostVec, sgOrbit, sgCircles, sgThetaMin, ctChiOfZ } = K;
  { const d = ghostSelfDistances('Istar', 1), got = d.map(x => `${x.n}×${Math.round(x.deg)}`).join(' '), want = '1×0 12×36 20×60 12×72 30×90 12×108 20×120 12×144 1×180';
    ok('the observer\'s own images are the group: the Milky Way reappears in the classes of I*', got === want && d.reduce((a, x) => a + x.n, 0) === 120, got); }
  { const R = 60, src = [{ name: 'A', ra: 123.4, dec: -21.7, chiGly: 17.3, sizeGly: 0.1 }], I = ghostImages('Istar', src, R, 1e9), G = sgOrbit('Istar'); let worst = 0;
    const q = (() => { const n = ghostVec(123.4, -21.7), a = 17.3 / R; return [Math.cos(a), Math.sin(a) * n[0], Math.sin(a) * n[1], Math.sin(a) * n[2]]; })();
    G.forEach(g => { const p = ghostQMul(g, q), d = Math.acos(Math.max(-1, Math.min(1, g.reduce((s, v, i) => s + v * p[i], 0)))) * R; worst = Math.max(worst, Math.abs(d - 17.3)); });
    const prim = I.find(x => x.primary);
    ok('Γ acts by isometries: each image lies at the source\'s own distance from the matching image of the observer, and the primary image is where the catalogue put it',
      worst < 1e-9 && I.length === 120 && Math.abs(prim.chiGly - 17.3) < 1e-9 && Math.abs(prim.ra - 123.4) < 1e-9 && Math.abs(prim.dec + 21.7) < 1e-9, `|d(g·q, g) − χ| ≤ ${worst.toExponential(1)} · ${I.length} images`); }
  { const chi = ctChiOfZ(1089.89), Rg = ghostRmax('Istar', chi), Rc = sgCircles('Istar', 100, chi).RmaxGly, self = R => ghostImages('Istar', [{ name: 'MW', ra: 0, dec: 0, chiGly: 0, sizeGly: 0 }], R, chi).filter(x => !x.primary).length;
    ok('ghosts of the observer are inside the horizon exactly when R < χ_LSS/θ_min — half the radius of the matched circles', Math.abs(Rc - 2 * Rg) < 1e-9 && self(Rg * 0.999) === 12 && self(Rg * 1.001) === 0 && self(887) === 0,
      `Poincaré: ghosts below ${Rg.toFixed(2)} Gly, circles below ${Rc.toFixed(2)} Gly · 12 Milky Ways just inside, none just outside, none at the posterior median`); }
  { const R = 10, s = 0.01, at = chi => ghostImages('S3', [{ name: 'x', ra: 0, dec: 0, chiGly: chi, sizeGly: s }], R, 1e9)[0].sizeDeg * Math.PI / 180;
    const small = at(0.01), q = at(Math.PI * R / 2), far = at(0.9 * Math.PI * R);
    ok('the angular size follows D_A = R sin(χ/R): flat at small χ, smallest a quarter of the way round, growing beyond — the lens of a closed space',
      Math.abs(small - s / 0.01) / (s / 0.01) < 1e-5 && Math.abs(q - s / R) < 1e-12 && far > q && at(0.3 * Math.PI * R) > q, `θ(χ→0) ≈ s/χ · θ(πR/2) = s/R · θ(0.9πR) / θ(πR/2) = ${(far / q).toFixed(2)}`); }
  ok('wiring: the ghost sky is in the space-form laboratory, drawn from the atlas\'s catalogue, and in the ledger',
    /id="sgGhost"/.test(SRC) && /function ghostSources\(\)\{[^\n]*COSMOS/.test(SRC) && /ghostPaint\(\);/.test(SRC) && /\{id:'ghostSky', kind:'found'/.test(SRC));
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
