/* golden-lattice-exploration-valley.mjs — POST-HOC, DESCRIPTIVE (a declared deviation from PREREGISTRATION_II.md)
   The √5 modulation of the TOI radii survives a selection-aware null (exploration-selection-null.json). Where does it put
   its minima? Its fitted phase puts them near 1.8 R⊕ and 4.1 R⊕ — where the radius valley (Fulton et al. 2017) and the
   deficit of sub-Saturns lie: known, non-periodic features of the planet population. Question: does the modulation
   persist against smooth mixtures rich enough to draw such features (K = 2…5 components)? LR only, no p-values:
   this is a diagnosis of what the periodic term absorbs, not a test. */
import fs from 'node:fs'; import path from 'node:path';
import { loadTOI, fitMix, fitModJoint } from './golden-lattice-replication.mjs';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const LAMBDA = { phi: Math.log10((1 + Math.sqrt(5)) / 2), sqrt5: Math.log10(Math.sqrt(5)) };
const { data: D } = loadTOI(), out = { protocol: 'POST-HOC, DESCRIPTIVE — deviation from docs/scale-nexus/PREREGISTRATION_II.md', n: D.length, byK: [] };
for (let K = 2; K <= 5; K++) { const M = fitMix(D, K, 4411 + K), row = { K, logL: M.l, bic: M.bic, mixture: { w: M.w, mu: M.mu, sd: M.s2.map(Math.sqrt) } };
  for (const [name, lam] of Object.entries(LAMBDA)) { const m = fitModJoint(D, M, lam, 1500), LR = 2 * (m.l - M.l);
    const xmax = [], xmin = []; for (let k = -1; k <= 5; k++) { const a = lam * (k - m.th / (2 * Math.PI)), b = a + lam / 2; if (a > -0.3 && a < 1.4) xmax.push(+Math.pow(10, a).toFixed(2)); if (b > -0.3 && b < 1.4) xmin.push(+Math.pow(10, b).toFixed(2)); }
    row[name] = { LR, eps: m.eps, theta: m.th, maxima_Rearth: xmax, minima_Rearth: xmin }; }
  out.byK.push(row); console.error(K, row.bic.toFixed(1), 'LR φ', row.phi.LR.toFixed(2), 'LR √5', row.sqrt5.LR.toFixed(2), 'eps √5', row.sqrt5.eps.toFixed(3), 'minima √5', row.sqrt5.minima_Rearth.join(','), 'maxima', row.sqrt5.maxima_Rearth.join(',')); }
/* the LR profile over the period itself, K = 2: is √5 a sharp line or a point on a broad band of periods? */
{ const M = fitMix(D, 2, 4413); out.periodScan = { K: 2, rows: [] };
  for (let lam = 0.15; lam <= 0.6001; lam += 0.01) { const m = fitModJoint(D, M, lam, 600); out.periodScan.rows.push([+lam.toFixed(3), +(2 * (m.l - M.l)).toFixed(3), +m.eps.toFixed(4)]); }
  const best = out.periodScan.rows.reduce((b, r) => r[1] > b[1] ? r : b), half = out.periodScan.rows.filter(r => r[1] >= best[1] / 2).map(r => r[0]);
  out.periodScan.peak = { lambda: best[0], base: +Math.pow(10, best[0]).toFixed(4), LR: best[1] }; out.periodScan.halfMaxBand = [Math.min(...half), Math.max(...half)].map(x => ({ lambda: x, base: +Math.pow(10, x).toFixed(3) }));
  console.error('scan peak', JSON.stringify(out.periodScan.peak), 'half-max band', JSON.stringify(out.periodScan.halfMaxBand)); }
out.reading = 'If LR(√5) collapses as K grows, the periodic term was standing in for non-periodic structure a richer smooth model can draw; if it does not, that structure is not captured by up to five Gaussian components. Either way this is exploration on data already seen.';
fs.writeFileSync(path.join(ROOT, 'docs/scale-nexus/exploration-valley.json'), JSON.stringify(out, null, 1));
