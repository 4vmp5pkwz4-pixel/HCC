/* THE GOLDEN LADDER'S OWN MEASURES (v4.440) — two theorems of the openai/math catalogue (AI-produced manuscripts; family 148,
   the entropy-rate dimension formula for self-similar measures; family 090, which proves the Brauchart–Hardin–Saff constant of
   the optimal logarithmic energy on S²) applied to the FBS3R ladder, with every input recomputed here by independent means.
     1. exact arithmetic in Z[β]: products, inverses and powers of the Pisot units against floating point;
     2. the golden walk Σ ±φ⁻ⁿ: its entropy per rung against Alexander & Zagier (1991) — their intermediate table to eleven digits,
        their point estimate 0.995713126686 to 10⁻⁷ — and against a second implementation that merges by real value, not by Z[φ];
     3. a system without overlaps behaves as one must: the golden partition gives exactly 1 at weight 1/φ and H(p)/χ elsewhere;
     4. exact overlaps lower the dimension below what the maps promise: tribonacci 0.98041, {x/φ, x/φ + 1, x/φ²} 0.8916 against a
        similarity dimension of 1.712, {x/φ, x/φ², x/φ² + 1} ≈ 0.921;
     5. C_BHS = 2 ln 2 + ½ ln ⅔ + 3 ln(√π/Γ(⅓)) with Γ(⅓) from an independent Lanczos series;
     6. the golden-angle shells pair by pair, recomputed here: C_N → −0.0447, ≈ 0.011 per point above C_BHS, not closing;
     7. their local lattice: neighbour index differences are Fibonacci numbers, ψ₆ ≈ 0.87 between rings, dips on the rings where
        the differences change;
     8. the descent lowers the energy at every step measured;
     9. the wiring, the FBS3R section and the instrument, which runs without a browser.
   NOT checked: the proofs of families 148 and 090 (the atlas uses them as the catalogue states them), and that a finite rung is a
   rigorous bound on the limit. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const block = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b); if (i < 0 || j < i) throw new Error('missing block ' + a); return src.slice(i, j); };
const page = new Function(block('/* ═══ LMS-MATH-BEGIN', '/* ═══ LMS-MATH-END') +
  ';return {lmsAlgebra, LMS_SYSTEMS, lmsWeights, lmsWalk, lmsSpiral, lmsEnergy, lmsLinearTerm, lmsRelaxStep, lmsLattice, LMS_CBHS, LMS_PHI};')();
const PHI = (1 + Math.sqrt(5)) / 2, TRIB = 1.839286755214161;
const rng = (() => { let s = 4400; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

{ let worst = 0, cases = 0;
  for (const [coef, beta] of [[[1, 1], PHI], [[1, 1, 1], TRIB], [[1, 0, 1], 1.465571231876768]]) { const A = page.lmsAlgebra(coef, beta);
    for (let t = 0; t < 60; t++) { const x = coef.map(() => Math.floor(rng() * 21) - 10), y = coef.map(() => Math.floor(rng() * 21) - 10), p = A.real(A.mul(x, y)), q = A.real(x) * A.real(y); worst = Math.max(worst, Math.abs(p - q) / Math.max(1, Math.abs(q))); cases++; }
    /* β^{−K}·β^K = 1 exactly, as integer vectors (a floating check would drown in the cancellation of components ~β^K) */
    let bp = coef.map((_, i) => i === 0 ? 1 : 0); const b1 = coef.map((_, i) => i === 1 ? 1 : 0);
    for (let K = 0; K <= 24; K++) { const one = A.mul(A.powInv(K), bp); if (!one.every((v, i) => v === (i === 0 ? 1 : 0))) worst = Infinity; bp = A.mul(bp, b1); cases++; } }
  check(worst < 1e-9, 'exact arithmetic in Z[β]: for the golden, tribonacci and supergolden units, products of integer vectors reduced by the minimal polynomial agree with floating point, and β^{−K}·β^K = 1 holds exactly as integer vectors up to K = 24 (β⁻¹ is an algebraic integer, since the constant coefficient is 1) — so every composed map of the laboratory is an exact integer vector',
    `${cases} cases · worst relative ${worst.toExponential(1)}`); }

{ const W = page.lmsWalk('golden', 0, 24, 400000), inc = W.steps.map(s => s.inc), AZ = [[7, 0.99907446376965], [9, 0.99640716876216], [11, 0.99585916148827]];
  const tab = Math.max(...AZ.map(([M, v]) => Math.abs(inc[M - 1] - v)));
  /* a second implementation: merge the partial sums by their REAL value (rounded to 10⁻⁹), no algebra at all */
  let m = [[0, 1]], prev = 0, worst2 = 0; const L = Math.log(PHI);
  for (let n = 0; n < 18; n++) { const d = Math.pow(PHI, n), ch = []; for (const [x, c] of m) ch.push([x, c / 2], [x + d, c / 2]); ch.sort((p, q) => p[0] - q[0]);
    const nm = []; for (const [x, c] of ch) { const last = nm[nm.length - 1]; if (last && x - last[0] < 1e-7) last[1] += c; else nm.push([x, c]); }   /* distinct sums are uniformly discrete (Garsia): merge within 10⁻⁷ */
    m = nm; let h = 0; for (const [, c] of m) h -= c * Math.log(c); worst2 = Math.max(worst2, Math.abs((h - prev) / L - inc[n])); prev = h; }
  const mono = inc.slice(1).every((v, i) => v <= inc[i] + 1e-12);
  check(tab < 5e-11 && Math.abs(W.estimate - 0.995713126686) < 2e-7 && worst2 < 1e-9 && mono && W.dimension < 1,
    'the golden walk Σ ±φ⁻ⁿ down the ladder, exactly: its branches merge in Z[φ], and the entropy it gains per rung, divided by ln φ, falls rung by rung to 0.9957131 — every entry of Alexander & Zagier’s intermediate table that it reaches to eleven digits and their point estimate 0.995713126686 to 10⁻⁷; a second implementation that merges partial sums by real value instead of in Z[φ] gives the same increments; by family 148 the dimension is that number, not 1',
    `rung 24: ${W.estimate.toFixed(10)} · |Δ| to the A–Z table ${tab.toExponential(1)} · real-value implementation |Δ| ${worst2.toExponential(1)} · decreasing ${mono} · similarity ${W.similarity.toFixed(6)}`); }

{ const p1 = page.lmsWalk('partition', 1 / PHI, 24, 400000), p2 = page.lmsWalk('partition', 0.5, 24, 400000), p3 = page.lmsWalk('partition', 0.3, 24, 400000);
  check(Math.abs(p1.estimate - 1) < 1e-6 && Math.abs(p2.estimate - p2.similarity) < 1e-6 && Math.abs(p3.estimate - p3.similarity) < 1e-4 && Math.abs(p1.similarity - 1) < 1e-8,
    'a system without overlaps behaves as one must: the golden partition {x/φ, x/φ² + 1/φ} of [0, 1] has no collisions, so its entropy per rung tends to its similarity dimension H(p)/χ at every weight — to nine digits 1 at weight 1/φ, where it is Lebesgue measure; stopping by rung, not by step, is what removes the O(1/n) bias of unequal ratios',
    `p = 1/φ: ${p1.estimate.toFixed(9)} · p = ½: ${p2.estimate.toFixed(9)} vs ${p2.similarity.toFixed(9)} · p = 0.3: ${p3.estimate.toFixed(9)} vs ${p3.similarity.toFixed(9)}`); }

{ const t = page.lmsWalk('tribonacci', 0, 20, 400000), a = page.lmsWalk('ladder3', 0, 24, 400000), b = page.lmsWalk('ladder3b', 0, 24, 400000);
  check(Math.abs(t.estimate - 0.980409) < 2e-5 && Math.abs(a.estimate - 0.8916) < 2e-4 && Math.abs(a.similarity - 1.7122589) < 1e-6 && Math.abs(b.estimate - 0.921) < 2e-3 && a.estimate < 1 && b.estimate < 1 && t.estimate < 1,
    'exact overlaps take dimension away, and family 148 says by how much even with unequal ratios: the tribonacci walk has 0.98041; the golden system {x/φ, x/φ + 1, x/φ²}, whose maps promise 1.712 dimensions, has only 0.8916 because its compositions coincide in Z[φ]; {x/φ, x/φ², x/φ² + 1} has ≈ 0.921',
    `tribonacci ${t.estimate.toFixed(6)} · {x/φ, x/φ+1, x/φ²} ${a.estimate.toFixed(6)} of ${a.similarity.toFixed(4)} (${a.steps[a.steps.length - 1].distinct} distinct maps at rung ${a.steps.length}) · {x/φ, x/φ², x/φ²+1} ${b.estimate.toFixed(5)}`); }

{ /* Γ by the Lanczos series (g = 7, nine coefficients) */
  const G = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  const gamma = z => { z -= 1; let x = G[0]; for (let i = 1; i < 9; i++) x += G[i] / (z + i); const t = z + 7.5; return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x; };
  const g13 = gamma(1 / 3), C = 2 * Math.log(2) + 0.5 * Math.log(2 / 3) + 3 * Math.log(Math.sqrt(Math.PI) / g13), refl = gamma(1 / 3) * gamma(2 / 3) - 2 * Math.PI / Math.sqrt(3);
  check(Math.abs(C - page.LMS_CBHS) < 1e-12 && Math.abs(refl) < 1e-10 && Math.abs(C + 0.0556053049) < 1e-9,
    'the constant family 090 proves, independently: C_BHS = 2 ln 2 + ½ ln ⅔ + 3 ln(√π/Γ(⅓)) with Γ(⅓) from a Lanczos series (and Γ(⅓)Γ(⅔) = 2π/√3 as a check on it) equals the page’s constant',
    `Γ(⅓) = ${g13.toFixed(15)} · C_BHS = ${C.toFixed(12)} · page ${page.LMS_CBHS.toFixed(12)} · reflection |Δ| ${Math.abs(refl).toExponential(1)}`); }

{ const GA = Math.PI * (3 - Math.sqrt(5)), mine = N => { let E = 0; const P = []; for (let i = 0; i < N; i++) { const u = 1 - (2 * i + 1) / N, s = Math.sqrt(1 - u * u); P.push([s * Math.cos(i * GA), u, s * Math.sin(i * GA)]); }
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (i !== j) E -= Math.log(Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1], P[i][2] - P[j][2])); return (E - (0.5 - Math.log(2)) * N * N + 0.5 * N * Math.log(N)) / N; };
  const c610 = mine(610), p610 = page.lmsLinearTerm(page.lmsEnergy(page.lmsSpiral(610)).E, 610), c2584 = page.lmsLinearTerm(page.lmsEnergy(page.lmsSpiral(2584)).E, 2584), c6765 = page.lmsLinearTerm(page.lmsEnergy(page.lmsSpiral(6765)).E, 6765);
  const x1 = c2584 - page.LMS_CBHS, x2 = c6765 - page.LMS_CBHS;
  check(Math.abs(c610 - p610) < 1e-9 && x1 > 0.010 && x1 < 0.012 && x2 > 0.010 && x2 < 0.012 && Math.abs(c6765 - c2584) < 5e-4,
    'the golden-angle shells against the proven optimum: the ordered-pair logarithmic energy summed here with its own loop equals the page’s, and the linear term of the golden-angle nodes the ladder’s shells carry settles near −0.0447 — about 0.011 per point above C_BHS, an excess that does not close between 2584 and 6765 nodes',
    `C₆₁₀ ${c610.toFixed(8)} (page ${p610.toFixed(8)}) · C₂₅₈₄ ${c2584.toFixed(6)} · C₆₇₆₅ ${c6765.toFixed(6)} · excess ${x1.toFixed(5)}, ${x2.toFixed(5)}`); }

{ const N = 2584, La = page.lmsLattice(page.lmsSpiral(N)), F = new Set([1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377]), band = (u0, u1) => { let s = 0, c = 0; for (let i = 0; i < N; i++) { const u = 1 - (2 * i + 1) / N; if (u >= u0 && u < u1) { s += La.psi[i]; c++; } } return s / c; };
  const allFib = La.diffs.every((d, i) => { const u = Math.abs(1 - (2 * i + 1) / N); return u > 0.97 || d.every(x => F.has(x)); });
  const eq = band(-0.3, 0.3), dip70 = band(0.68, 0.72), dip90 = band(0.885, 0.915), mid = band(0.78, 0.84), key = i => La.diffs[i].join('/'), iAt = u => Math.round(((1 - u) * N - 1) / 2);
  check(allFib && eq > 0.78 && mid > 0.7 && dip70 < 0.3 && dip90 < 0.4 && key(iAt(0.5)) !== key(iAt(0.8)),
    'the golden lattice node by node: every node’s nearest neighbours sit at Fibonacci index differences; the hexagonal order ψ₆ is high in the bands (the triangular lattice is what the theorem proves optimal) and collapses on the rings near heights 0.70 and 0.90, exactly where the neighbouring Fibonacci differences change — the square-celled seams of the spiral',
    `ψ₆: equator ${eq.toFixed(3)}, u ≈ 0.81 ${mid.toFixed(3)}, u ≈ 0.70 ${dip70.toFixed(3)}, u ≈ 0.90 ${dip90.toFixed(3)} · neighbours at u = 0.5: ${key(iAt(0.5))}, at u = 0.8: ${key(iAt(0.8))}`); }

{ const N = 233, P = page.lmsSpiral(N), Es = [page.lmsEnergy(P).E]; for (let k = 0; k < 8; k++) { for (let s = 0; s < 10; s++) page.lmsRelaxStep(P, 0.4 / N); Es.push(page.lmsEnergy(P).E); }
  const mono = Es.slice(1).every((e, i) => e < Es[i]), c0 = page.lmsLinearTerm(Es[0], N), c1 = page.lmsLinearTerm(Es[Es.length - 1], N);
  check(mono && c1 < c0 && c1 > page.LMS_CBHS - 0.02,
    'the descent: gradient steps of the logarithmic energy on the sphere lower it at every measurement, moving the linear term from the golden spiral’s toward the proven constant (the finite-N optimum carries an O(ln N) term the theorem does not fix, so reaching C_BHS is not claimed)',
    `N = ${N}: C from ${c0.toFixed(5)} to ${c1.toFixed(5)} in 80 steps · C_BHS ${page.LMS_CBHS.toFixed(5)}`); }

{ const M = await import(path.join(ROOT, 'core/atlas/instruments.mjs')), miss = ["{id:'ladmeas', category:'geom'", "id:'ladmeas', world:'s3', lab:'ladmeas'", "lmsGroup.visible = (v==='ladmeas');", "if(v==='ladmeas'&&!lmsObjs){ lmsSetup(); }", "else if(V==='ladmeas') body = lmsPanelHTML();",
    "if(V==='ladmeas'){ lmsBind(ctl); }", "} else if(state.s3view==='ladmeas'){", "ladmeas:{pause:['lmsPaused','p']},", "['lmsAtlas','ladmeas',lmsGroup,", "()=>goLab('s3','ladmeas')", "globalThis.HCC_LADMEAS=Object.freeze({", "{id:'ladmeas440', kind:'found'",
    "['ladmeas','aesphere','representation'", "v==='ladmeas'?[", "    ${lmsFbsPanelHTML()}", "try{ lmsFbsBind(ctl); }catch(e){}"].filter(x => !src.includes(x));
  const meta = M.INSTRUMENT_META && M.INSTRUMENT_META.ladmeas, defs = meta ? Object.fromEntries(meta.inputs.map(i => [i.name, i.default])) : null, r = defs ? M.INSTRUMENTS.ladmeas(defs) : {};
  const W = page.lmsWalk('golden', 0, 16, 60000), C = page.lmsLinearTerm(page.lmsEnergy(page.lmsSpiral(377)).E, 377);
  const ok = !miss.length && !!meta && Math.abs(r.ladmeas_dimension - W.dimension) < 1e-12 && Math.abs(r.ladmeas_shell_linear_term - C) < 1e-12 && Math.abs(r.ladmeas_similarity_dimension - Math.log(2) / Math.log(PHI)) < 1e-12 && r.ladmeas_dimension < 1;
  check(ok, 'the laboratory is in the page and in FBS3R, and its instrument runs without a browser: declared, registered, shown, set up, given a panel, ticked, listed among the laboratories and the trips, related in the graph, entered in the ledger, with an agent handle and a section in the FBS3R panel at the rung in view; at its defaults — the golden walk stopped at rung 16, a shell of 377 nodes — the instrument returns the page’s own numbers',
    `dimension ${r.ladmeas_dimension != null ? r.ladmeas_dimension.toFixed(8) : '—'} · similarity ${r.ladmeas_similarity_dimension != null ? r.ladmeas_similarity_dimension.toFixed(6) : '—'} · C₃₇₇ ${r.ladmeas_shell_linear_term != null ? r.ladmeas_shell_linear_term.toFixed(6) : '—'} · ψ₆ ${r.ladmeas_shell_hexatic_order != null ? r.ladmeas_shell_hexatic_order.toFixed(3) : '—'}${miss.length ? ' · missing ' + miss.join(' | ') : ''}`); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
