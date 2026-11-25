/* HCC SCALE NEXUS (v4.441) — the integration of the Scale Nexus handoff, checked by means independent of the code it checks
   wherever such means exist.
     1. the native kernel against EXACT rational fixtures computed by Lean (lean/scale-nexus/Fixtures.lean): C, Q, their product
        and ratio, the density, and the dilation law;
     2. 3000+ deterministic cases over 105 decades of mass and 63 of radius: the inverse, the log identities, relabelling between
        bases, dilation, and agreement with the page's own FBS3R rung and the N_C + N_S = log_φ 2 rule;
     3. boundary semantics: overflow handled in logarithms, every invalid input refused;
     4. G's uncertainty by finite differences, and per-entry propagation by Monte Carlo;
     5. the round S³: complements, branches, the antipode, the series switch, and the two-sided flat-limit bound Lean proves;
     6. FLRW: the apparent-horizon identity, the Ω_K form, realizability, and agreement with the S³ cap;
     7. the audit: 98 of 98 catalogue entries typed, densities only where mass and radius are of one region, the two revised values;
     8. Lean: the build log, the axiom audit of all 29 theorems, and the hashes of what was built;
     9. parity with the handoff's reference kernel, and its own test;
    10. the preregistered golden-lattice test: its recorded result recomputed from the data;
    11. the wiring and the instrument, which runs without a browser.
   NOT checked here: physics. The kernel is coordinates; the S³ and FLRW parts are conditional on their models. */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { createRequire } from 'node:module';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let pass = 0, fail = 0, cases = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const block = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b); if (i < 0 || j < i) throw new Error('missing block ' + a); return src.slice(i, j); };
const ucat = src.slice(src.indexOf('const UC_K=(()=>'), src.indexOf('/* how far it stands from the two walls')).replace(/const UC_DOM=/, 'var UC_DOM=');
const P = new Function('const LN_PHI=Math.log((1+Math.sqrt(5))/2);' + ucat + block('/* ═══ SNX-MATH-BEGIN', '/* ═══ SNX-MATH-END') + block('/* ═══ SNX-AUDIT-BEGIN', '/* ═══ SNX-AUDIT-END') +
  ';return {UC_K, UCAT, ucatPlane, UC_LOGPHI2, snxAnchors, snxCoords, snxCoordsLog, snxInverse, snxLevel, snxRadius, snxDilate, snxTracks, snxSigma, snxS3Cap, snxS3Branches, snxFLRW, snxPhoton, snxPhase, snxAudit, SNX_G_REL};')();
const K = P.UC_K, K1 = { hb: 1, G: 1, c: 1, h: 2 * Math.PI }, PHI = (1 + Math.sqrt(5)) / 2, frac = s => { const [n, d] = s.split('/'); return Number(BigInt(n)) / Number(BigInt(d)); };
const rel = (x, y) => Math.abs(x - y) / Math.max(Math.abs(x), Math.abs(y), 1e-300);

{ const F = JSON.parse(rd('lean/scale-nexus/fixtures.json')); let worst = 0;
  for (const f of F) { const m = frac(f.m), r = frac(f.r), s = frac(f.s), c = P.snxCoords(m, r, K1), d = P.snxDilate(c, s, f.p);
    for (const [x, y] of [[Math.pow(10, c.a), frac(f.C)], [Math.pow(10, c.b), frac(f.Q)], [Math.pow(10, c.a + c.b), frac(f.CQprod)], [Math.pow(10, c.a - c.b), frac(f.CQratio)], [Math.pow(10, c.logRhoEq) * Math.PI, frac(f.rhoPi)], [Math.pow(10, d.a), frac(f.Cdil)], [Math.pow(10, d.b), frac(f.Qdil)], [frac(f.Cdil), frac(f.Cdil_law)], [frac(f.Qdil), frac(f.Qdil_law)]]) { worst = Math.max(worst, rel(x, y)); cases++; } }
  check(F.length === 60 && worst < 1e-11, 'the native kernel against exact rational fixtures computed by Lean: compactness, the quantum coordinate, their product 2/r² and ratio 2m², the density and the dilation law C → s^{p−1}C, Q → s^{−p−1}Q — floating point within 10⁻¹¹ of the exact values, and the exact dilation law holding exactly in every Lean row',
    `${F.length} fixtures · ${F.length * 9} comparisons · worst relative ${worst.toExponential(1)}`); }

{ let worst = 0, n = 0, rungWorst = 0, ncs = 0;
  for (let i = 0; i < 3000; i++) { const lm = -50 + 105 * i / 2999, lr = -35 + 63 * ((i * 173) % 3000) / 2999, c = P.snxCoordsLog(lm, lr, K, PHI), q = P.snxInverse(c.a, c.b, K);
    worst = Math.max(worst, Math.abs(q.logM - lm), Math.abs(q.logR - lr), Math.abs(c.a + c.b - (Math.log10(2) - 2 * c.v)), Math.abs(c.a - c.b - (Math.log10(2) + 2 * c.u)));
    const N2 = P.snxCoordsLog(lm, lr, K, 2).N, N10 = P.snxCoordsLog(lm, lr, K, 10).N; worst = Math.max(worst, Math.abs(c.N * Math.log(PHI) - N2 * Math.log(2)) / 1e3, Math.abs(N10 * Math.log(10) - N2 * Math.log(2)) / 1e3);
    const s = Math.pow(10, -3 + 6 * ((i * 37) % 100) / 99), p = -3 + 6 * ((i * 11) % 61) / 60, d = P.snxDilate(c, s, p), cd = P.snxCoordsLog(d.logM, d.logR, K, PHI);
    worst = Math.max(worst, Math.abs(cd.a - d.a), Math.abs(cd.b - d.b), Math.abs(cd.logRhoEq - d.logRhoEq)); n += 8;
    /* the page's own FBS3R rung for a length, and the Compton + Schwarzschild rule of the matter wheel */
    const R = Math.pow(10, lr); rungWorst = Math.max(rungWorst, Math.abs(c.N - Math.log(R / K.lP) / Math.log(PHI)));
    const M = Math.pow(10, lm), NC = Math.log(K.hb / (M * K.c) / K.lP) / Math.log(PHI), NS = Math.log(2 * K.G * M / (K.c * K.c) / K.lP) / Math.log(PHI); ncs = Math.max(ncs, Math.abs(NC + NS - P.UC_LOGPHI2)); }
  cases += n; const X = P.snxCoordsLog(Math.log10(K.mP / Math.SQRT2), Math.log10(K.lP * Math.SQRT2), K), T = P.snxTracks(X);
  check(worst < 1e-9 && rungWorst < 1e-9 && ncs < 1e-9 && Math.abs(X.a) < 1e-12 && Math.abs(X.b) < 1e-12 && T.fixedM.slope === 1 && T.fixedR.slope === -1 && T.fixedRho.slope === -2,
    'over 3000 deterministic (M, R) pairs spanning 105 decades of mass and 63 of radius: the inverse returns every pair, a + b = log 2 − 2v and a − b = log 2 + 2u, N_φ ln φ = N_2 ln 2 = N_10 ln 10, the dilation law is the coordinates of the dilated pair; the kernel’s rung is the page’s FBS3R rung, N_C + N_S = log_φ 2 for every mass, and C = Q = 1 exactly at (m_P/√2, √2 ℓ_P)',
    `${n} identity evaluations · worst ${worst.toExponential(1)} · FBS3R rung |Δ| ${rungWorst.toExponential(1)} · N_C + N_S |Δ| ${ncs.toExponential(1)} · crossing (a, b) = (${X.a.toExponential(1)}, ${X.b.toExponential(1)})`); }

{ const big = P.snxCoordsLog(500, -20, K), back = P.snxInverse(big.a, big.b, K); let refused = 0, tried = 0;
  const bad = [() => P.snxCoords(0, 1, K), () => P.snxCoords(-1, 1, K), () => P.snxCoords(NaN, 1, K), () => P.snxCoords(1, Infinity, K), () => P.snxCoordsLog(1, NaN, K), () => P.snxCoords(1, 1, K, 1), () => P.snxCoords(1, 1, K, 0.5),
    () => P.snxLevel(0, PHI, K.lP), () => P.snxRadius(Infinity, PHI, K.lP), () => P.snxRadius(2000, 10, K.lP), () => P.snxS3Cap(1, -0.1), () => P.snxS3Cap(1, 4), () => P.snxS3Cap(0, 1), () => P.snxS3Cap(1, 1, -1),
    () => P.snxFLRW(1e-18, 1, K), () => P.snxFLRW(0, 0, K), () => P.snxPhase([]), () => P.snxPhase([1, NaN]), () => P.snxDilate(big, 0, 1), () => P.snxS3Branches(1, 0)];
  for (const f of bad) { tried++; try { f(); } catch (e) { if (e instanceof RangeError) refused++; } } cases += tried;
  check(Number.isFinite(big.a) && big.C === Infinity && Math.abs(back.logM - 500) < 1e-9 && Math.abs(back.logR + 20) < 1e-9 && refused === tried,
    'boundary semantics: a mass of 10⁵⁰⁰ kg at 10⁻²⁰ m — beyond floating point — is carried in logarithms and returned exactly by the inverse (C itself reported as unbounded, not as a wrong number); zero, negative, NaN and infinite inputs, a base ≤ 1, a rung beyond floating range, χ outside [0, π], A ≤ 0, ρ < 0, Ω_K ≥ 1, H ≤ 0, an empty or non-finite sample and a zero dilation are each refused with a RangeError',
    `log₁₀C = ${big.a.toFixed(3)} · ${refused}/${tried} refusals`); }

{ const eps = 1e-6, Kp = { ...K, G: K.G * (1 + eps) }, lm = 30, lr = 8, c0 = P.snxCoordsLog(lm, lr, K), c1 = P.snxCoordsLog(lm, lr, Kp), S = P.snxSigma(null, null, 0, PHI);
  const da = (c1.a - c0.a) / Math.log(1 + eps) * P.SNX_G_REL, db = (c1.b - c0.b) / Math.log(1 + eps) * P.SNX_G_REL, dN = (c1.N - c0.N) / Math.log(1 + eps) * P.SNX_G_REL;
  /* Monte Carlo of per-entry errors */
  let s = 9, worstMC = 0; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, g = () => Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd());
  for (const [sm, sr, rho] of [[0.1, 0.05, 0], [0.02, 0.3, 0.5], [0.2, 0.2, -0.7]]) { const T = P.snxSigma(sm, sr, rho, PHI), A = [], B = [];
    for (let k = 0; k < 20000; k++) { const z1 = g(), z2 = rho * z1 + Math.sqrt(1 - rho * rho) * g(), c = P.snxCoordsLog(lm + sm * z1 / Math.LN10, lr + sr * z2 / Math.LN10, K); A.push(c.a); B.push(c.b); }
    const sd = v => { const m = v.reduce((x, y) => x + y, 0) / v.length; return Math.sqrt(v.reduce((x, y) => x + (y - m) ** 2, 0) / v.length); };
    worstMC = Math.max(worstMC, Math.abs(sd(A) / T.sigma_a - 1), Math.abs(sd(B) / T.sigma_b - 1)); }
  check(rel(da, S.G_shift.a) < 1e-4 && Math.abs(db) < 1e-15 && rel(dN, S.G_shift.N) < 1e-4 && worstMC < 0.03 && S.given === false && S.sigma_a === null,
    'uncertainty: G (CODATA 2022, 2.2·10⁻⁵) moves a by σ_G/ln 10 and the rung by −σ_G/(2 ln φ) for every entry at once — by finite difference — and b not at all, since Q holds no G; per-entry errors propagate as the Monte Carlo of correlated ln M, ln R says; a missing uncertainty is returned as missing, never as zero',
    `Δa = ${da.toExponential(3)} (kernel ${S.G_shift.a.toExponential(3)}) · Δb = ${db.toExponential(1)} · ΔN = ${dN.toExponential(3)} · Monte Carlo |σ/σ̂ − 1| ≤ ${worstMC.toFixed(3)}`); }

{ let worst = 0, bound = true, n = 0, ratioOK = true;
  for (let i = 0; i <= 1000; i++) { const chi = Math.PI * i / 1000, A = 3.7, p = P.snxS3Cap(A, chi, 2), q = P.snxS3Cap(A, Math.PI - chi, 2); worst = Math.max(worst, rel(p.V + q.V, p.Vtotal), Math.abs(p.Rareal - q.Rareal) / A); n += 2;
    if (chi > 0 && chi <= 1) { const D = A * chi, up = 4 / 3 * Math.PI * D ** 3, lo = up - 2 / 5 * Math.PI * A ** 3 * chi ** 5; if (!(p.V <= up * (1 + 1e-12) && p.V >= lo * (1 - 1e-12))) bound = false; n++; }
    if (chi > 0 && chi < Math.PI && !(p.properMass >= p.misnerSharpMass * (1 - 1e-12))) ratioOK = false; }
  const sw = rel(P.snxS3Cap(1, 0.01 - 1e-12).V, P.snxS3Cap(1, 0.01 + 1e-12).V), ant = P.snxS3Cap(2, Math.PI), br = P.snxS3Branches(5, 3), no = P.snxS3Branches(5, 6); cases += n;
  check(worst < 1e-12 && bound && ratioOK && sw < 1e-9 && ant.antipode && ant.Rareal === 0 && Math.abs(ant.fraction - 1) < 1e-15 && br.realizable && Math.abs(br.near + br.far - Math.PI) < 1e-15 && !no.realizable,
    'the round S³: V(χ) + V(π − χ) = 2π²A³ and the areal radius is shared by χ and π − χ (two branches, one area); the JavaScript cap lies between the bounds Lean proves, (4/3)π(Aχ)³ − (2/5)πA³χ⁵ ≤ V ≤ (4/3)π(Aχ)³ — the flat limit; the proper mass ρV never falls below the Misner–Sharp mass; the small-cap series joins the closed form; the antipode has areal radius 0 and the whole volume, and is flagged, not drawn as a point; an areal radius beyond A is refused as unrealizable',
    `${n} evaluations · worst ${worst.toExponential(1)} · series join ${sw.toExponential(1)} · branches ${br.near.toFixed(6)} + ${br.far.toFixed(6)} = π`); }

{ let worst = 0, n = 0; for (const H0 of [20, 45, 67.4, 73, 120]) for (const ok of [-0.5, -0.1, -0.001, 0, 0.001, 0.1, 0.5]) { const F = P.snxFLRW(H0 * 1e3 / K.pc / 1e6, ok, K);
    worst = Math.max(worst, Math.abs(F.compactnessAtRA - 1), rel(F.RA, F.RH / Math.sqrt(1 - ok)), F.A ? rel(F.A, F.RH / Math.sqrt(-ok)) : 0); n++;
    if (F.A) { const cap = P.snxS3Cap(F.A, Math.asin(F.RA / F.A), F.rho); worst = Math.max(worst, rel(cap.misnerSharpMass, F.M_MS)); } }
  const strong = P.snxFLRW(67.4e3 / K.pc / 1e6, -1.5, K); cases += n;
  check(worst < 1e-12 && strong.RHrealizable === false && strong.curvature === 'closed',
    'FLRW, given Friedmann: 2GM_MS(R_A)/(c²R_A) = 1 at the apparent horizon R_A = R_H/√(1 − Ω_K) for every H₀ and Ω_K tried, the curvature radius A = R_H/√(−Ω_K) when closed, and the Misner–Sharp mass of the S³ cap of areal radius R_A is the same M_MS; with Ω_K = −1.5 the Hubble radius exceeds A and is reported unrealizable rather than drawn',
    `${n} parameter pairs · worst ${worst.toExponential(1)} · Ω_K = −1.5: R_H realizable ${strong.RHrealizable}`); }

{ const A = P.snxAudit(P.UCAT, P.ucatPlane), need = ['id', 'source', 'epoch', 'frame', 'status', 'formulaId'], rows = A.rows;
  const full = rows.every(r => need.every(k => r[k] != null && r[k] !== '') && (r.uncertainty != null || (typeof r.uncertaintyReason === 'string' && r.uncertaintyReason.length > 10)) && (r.onPlane ? r.massKind && r.radiusKind : r.layer === 'length_time_or_frequency_only'));
  const noZero = rows.every(r => !r.uncertainty || Object.values(r.uncertainty).every(v => v !== 0)), densOnlyBody = rows.every(r => !r.densityAllowed || r.layer === 'body');
  const noDens = ['mw', 'lania', 'hubble', 'dS', 'obs', 'planck'].every(id => !rows.find(r => r.id === id).densityAllowed);
  const photons = rows.filter(r => r.layer === 'photon').every(r => r.massKind === 'energy_equivalent'), bits = rows.filter(r => r.layer === 'bits').every(r => /information/.test(r.massKind));
  const nus = ['nu3', 'nu2', 'nuK', 'nuSum'].every(id => rows.find(r => r.id === id).status === 'bound'), quarks = ['uq', 'dq', 'sq', 'cq', 'bq'].every(id => /running/.test(rows.find(r => r.id === id).massKind));
  const e = P.UCAT.find(x => x[0] === 'e'), sun = P.UCAT.find(x => x[0] === 'sun');
  const revised = rel(K.Msun, 1.3271244e20 / K.G) < 1e-15 && rel(e[3].M, 0.51099895069e6 * K.eVkg) < 1e-15 && rel(sun[3].M, 1.3271244e20 / K.G) < 1e-15;
  check(A.count === P.UCAT.length && A.count === 98 && full && noZero && densOnlyBody && noDens && photons && bits && nus && quarks && revised,
    'the audit, 98 of 98 catalogue entries: every one has its source, epoch, frame, status and placing formula, its mass and radius kinds or the reason it is not on the plane, and an uncertainty or the reason it is missing — none set to zero; a density only for bodies, never for the Milky Way (stars and disc are different regions), Laniakea, the Hubble, de Sitter and observable spheres or the Planck units; photons as energy equivalents, bits as information equivalents, neutrinos as bounds, light quarks as running masses; the Sun’s mass revised to GM☉/G (IAU 2015, CODATA 2022) and the electron to CODATA 2022',
    `${A.count} entries · ${A.onPlane} on the plane · ${JSON.stringify(A.byLayer)} · density ${A.densityAllowed} · uncertainty stated ${A.withUncertainty} · M☉ = ${K.Msun.toExponential(6)} kg`); }

{ const dir = 'lean/scale-nexus', log = rd(dir + '/build.log'), ax = rd(dir + '/axioms.txt').trim().split('\n'), lean = rd(dir + '/ScaleNexus.lean'), thms = [...lean.matchAll(/^theorem (\w+)/gm)].map(m => m[1]);
  const clean = ax.every(l => /depends on axioms: \[propext, Classical\.choice, Quot\.sound\]$/.test(l)), named = thms.every(t => ax.some(l => l.includes(`'HCC.ScaleNexus.${t}'`)));
  const noSorry = !/\bsorry\b|\badmit\b|^axiom\s/m.test(lean.replace(/--.*$/gm, '').replace(/\/-[\s\S]*?-\//g, ''));
  const sums = rd(dir + '/SHA256SUMS').trim().split('\n').map(l => l.split(/\s+/)), hashOK = sums.every(([h, f]) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, dir, f))).digest('hex') === h);
  check(/EXIT 0\s*$/.test(log) && !/error/i.test(log) && thms.length === 29 && ax.length === 29 && clean && named && noSorry && hashOK && /v4\.19\.0/.test(rd(dir + '/lean-toolchain')),
    'Lean, audited: ScaleNexus.lean builds with Lean 4.19.0 and Mathlib v4.19.0 (exit 0, no error); all 29 theorems — the SI bridge, the log and rpow inverses, relabelling, the crossing, dilation, the S³ complement, dV/dχ and its integral, the two-sided flat limit, the apparent-horizon identity — depend on propext, Classical.choice and Quot.sound only; no sorry, admit or axiom in the source; every file of the build matches its recorded hash',
    `${thms.length} theorems · ${ax.length} axiom lines, all standard: ${clean} · hashes ${hashOK}`); }

{ const require = createRequire(import.meta.url), H = require(path.join(ROOT, 'docs/scale-nexus/handoff/kernel.js')); let worst = 0, n = 0;
  for (let i = 0; i < 400; i++) { const M = Math.pow(10, -40 + 90 * i / 399), R = Math.pow(10, -30 + 55 * ((i * 61) % 400) / 399), a = H.coordinates(M, R), b = P.snxCoords(M, R, K); worst = Math.max(worst, Math.abs(a.a - b.a), Math.abs(a.b - b.b), Math.abs(a.N - b.N) * 1e-2); n++; }
  for (const chi of [1e-6, 0.3, 1, 2, 3]) { const a = H.s3(4, chi, 1), b = P.snxS3Cap(4, chi, 1); worst = Math.max(worst, rel(a.V, b.V), rel(a.properMass, b.properMass), rel(a.misnerSharpMass, b.misnerSharpMass)); n++; }
  { const a = H.flrw(2.18e-18, -0.01), b = P.snxFLRW(2.18e-18, -0.01, { ...K, G: 6.67430e-11 }); worst = Math.max(worst, rel(a.RA, b.RA), rel(a.rho, b.rho)); n++; }
  const report = rd('docs/scale-nexus/handoff/test-report.txt');
  check(worst < 1e-9 && /PASS: 15079/.test(report),
    'parity with the handoff: the native kernel reproduces the reference kernel of the Scale Nexus handoff (kernel.js, kept byte for byte in docs/scale-nexus/handoff) on coordinates, the S³ cap and FLRW — differences only from ħ’s ten-digit rounding in the page’s constants — and the handoff’s own test (15 079 assertions) is recorded as passing',
    `${n} comparisons · worst ${worst.toExponential(1)}`); }

{ const T = await import(path.join(ROOT, 'scripts/golden-lattice-test.mjs')), res = JSON.parse(rd('docs/scale-nexus/golden-lattice-result.json')), pop = T.loadPopulation(src), { hold } = T.split(pop.planets), z = T.Zstat(T.rungs(hold, T.PHI));
  const prereg = rd('docs/scale-nexus/PREREGISTRATION.md');
  check(res.holdout.n === hold.length && Math.abs(res.holdout.R - z.R) < 1e-12 && res.holdout.pPrimary > 0.05 && res.holdout.rankOfPhi > 1 && /no evidence/.test(res.holdout.verdict) && res.prerequisites.power['0.1'] >= 0.8 && res.prerequisites.calibrationKS < 0.1 && /before/i.test(prereg) && res.sha256 === pop.sha256,
    'the golden lattice, as preregistered: on the holdout of the NASA Exoplanet Archive transit radii (2384 planets in 1812 systems) the φ statistic recomputed here matches the recorded R̄; its p is above 0.05 and φ ranks far from first among 241 bases — no evidence for a golden lattice in this population; the null was calibrated and the test had full power at a 10 % injected lattice; the scan’s maximum elsewhere (b ≈ 2.24) is reported, with a post-hoc sensitivity analysis, as the multimodal radius distribution',
    `n ${hold.length} · R̄_φ ${z.R.toFixed(4)} · p ${res.holdout.pPrimary.toFixed(3)} · φ rank ${res.holdout.rankOfPhi}/${res.holdout.of} · scan best b ${res.holdout.scanBestBase.toFixed(3)} (corrected p ${res.holdout.pScanCorrected.toFixed(4)}) · power at 10 % ${res.prerequisites.power['0.1']}`); }

{ const M = await import(path.join(ROOT, 'core/atlas/instruments.mjs')), miss = ["{id:'scalenexus', category:'inv'", "id:'scalenexus', world:'s3', lab:'scalenexus'", "snxGroup.visible = (v==='scalenexus');", "if(v==='scalenexus'&&!snxObjs){ snxSetup(); }", "else if(V==='scalenexus') body = snxPanelHTML();",
    "if(V==='scalenexus'){ snxBind(ctl); }", "} else if(state.s3view==='scalenexus'){", "scalenexus:{pause:['snxPaused','p']},", "['snxAtlas','scalenexus',snxGroup,", "()=>goLab('s3','scalenexus')", "globalThis.HCC_SCALE_NEXUS=Object.freeze({", "{id:'scalenexus441', kind:'tested'",
    "['scalenexus','ladmeas','contrast'", "v==='scalenexus'?["].filter(x => !src.includes(x));
  const meta = M.INSTRUMENT_META && M.INSTRUMENT_META.scalenexus, defs = meta ? Object.fromEntries(meta.inputs.map(i => [i.name, i.default])) : null, r = defs ? M.INSTRUMENTS.scalenexus(defs) : {}, c = P.snxCoords(1.988410e30, 6.957e8, K, PHI);
  const ok = !miss.length && !!meta && Math.abs(r.scalenexus_log_compactness - c.a) < 1e-12 && Math.abs(r.scalenexus_rung - c.N) < 1e-9 && Math.abs(r.scalenexus_proper_over_misner_sharp - 1) < 1e-3 && r.scalenexus_proper_over_misner_sharp > 1;
  check(ok, 'the laboratory is in the page and its instrument runs without a browser: declared, registered, shown, set up, given a panel, ticked, listed among the laboratories and the trips, related in the graph, entered in the ledger, with an agent handle that exports and re-imports; at its defaults — the Sun, base φ, H₀ = 67.4, Ω_K = −0.001, χ = 0.01π — the instrument returns the kernel’s own numbers',
    `log C ${r.scalenexus_log_compactness != null ? r.scalenexus_log_compactness.toFixed(6) : '—'} · N ${r.scalenexus_rung != null ? r.scalenexus_rung.toFixed(4) : '—'} · proper/MS ${r.scalenexus_proper_over_misner_sharp != null ? r.scalenexus_proper_over_misner_sharp.toFixed(6) : '—'}${miss.length ? ' · missing ' + miss.join(' | ') : ''}`); }

console.log(`\n${pass} passed, ${fail} failed · ${cases} deterministic cases`);
process.exit(fail ? 1 : 0);
