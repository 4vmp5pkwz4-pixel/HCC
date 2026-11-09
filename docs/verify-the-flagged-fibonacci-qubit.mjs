/* THE FLAGGED FIBONACCI QUBIT (v4.414) — «Algebraic Fibonacci-Anyon Braiding and Exact Flagged-Noise Bounds» (research draft,
   8 November 2026), recomputed from the atlas's own source. The laboratory's mathematics is one block of pure functions
   (FIBFLAG-MATH); it is lifted out of index.html with the exact ring Z[ζ, s] of the fibreach laboratory, the lemma checks that
   use it, and the anyon laboratory's braid matrices, and run here as it stands:
     1. Theorem 3.1's certificate is an identity of polynomials in Z[u, v, a, b] — expanded, and evaluated at random points;
     2. H = 0, Q = 0, the algebraic R̂ of §4 and the phase identification hold in exact integers, and b → b̄ breaks them;
     3. the braid geometry: 108° turns, axes at arccos(−φ⁻³), F a half-turn at arccos φ⁻¹, σ₂ᵏ the golden braid;
     4. Theorems 6.1 and 7.1: the proofs' inputs attain 2[1 − (1 − ℓ)p₀], random inputs never exceed it, Kraus is complete;
     5. with no reference the best is 1 − (1 − ℓ)λ_min + ℓ — the reference is worth exactly 2(1 − ℓ)·min(p_X, p_Y, p_Z);
     6. §8: the flagged qutrit is complete, its flag absorbing, the identity at zero noise; the careless extension is not;
     7. whole words: the worst input found ≤ the branch bound ≤ the telescoping sum, and the closed forms where they exist;
     8. Zeckendorf, Qⁿ, Cassini, the Fibonacci word and base φ, in exact integers;
     9. the anyon laboratory braids the same exchanges (σ₂⁻¹ now computed), the probabilities equal to 10⁻¹²;
    10. the laboratory reaches every registry of the atlas. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('block not found: ' + a.slice(0, 50)); return src.slice(i, j); };
const MATH = cut('/* ═══ FIBFLAG-MATH-BEGIN ═══', '/* ═══ FIBFLAG-MATH-END ═══');
const RING = cut('/* ── the Fibonacci anyon data, EXACTLY', '/* ── fusion paths, blockade words');
const LEMMAS = cut('const FF_EXACT={};', '/* ── the laboratory: THE FLAGGED FIBONACCI QUBIT');
const FIB = cut('const FIB_PHI=(1+Math.sqrt(5))/2;', 'hccApiRegister({\n  id:\'anyon\'');
const names = ['FF_PHI', 'FF_U', 'FF_V', 'FF_F', 'FF_B1', 'FF_B2', 'ffMM', 'ffDag', 'ffEye', 'ffAdd', 'ffMaxAbs', 'ffGen', 'ffWordU', 'ffCertificate', 'ffPeval', 'ffEigH', 'ffTraceNorm',
  'ffKraus', 'ffKrausDefect', 'ffApplyK', 'ffDiamondExact', 'ffUnentangledExact', 'ffAncillaWorth', 'ffDiamondReport', 'ffHat', 'ffKrausHat', 'ffKrausCareless', 'ffCarelessGap',
  'ffComposite', 'ffCompositeMap', 'ffCompositeEval', 'ffCompositeBounds', 'ffCompositeExact', 'ffSearch', 'ffPurify', 'ffZeck', 'ffZeckWord', 'ffWordPath', 'ffWordValue', 'ffZeckBijection',
  'ffFibIdx', 'ffQpow', 'ffCassini', 'ffPathCounts', 'ffPhinary', 'ffAxisAngle', 'ffRot', 'ffLambdas', 'ffRng', 'ffRandomPure', 'ffDist', 'ffBellInput', 'ffPlusInput',
  'ffExactChecks', 'vxBraidPnum', 'fibBraid'];
const L = new Function(`const VX_PHI=(1+Math.sqrt(5))/2;\n${MATH}\n${RING}\n${LEMMAS}\n${FIB}\nreturn {${names.join(',')}};`)();

/* 1 — the certificate */
{ const C = L.ffCertificate(), rng = L.ffRng(31); let worst = 0;
  /* and, independently of the polynomial arithmetic, the printed formula against the matrix product at random real points */
  for (let i = 0; i < 40; i++) { const [u, v, a, b] = [0, 0, 0, 0].map(() => 4 * rng() - 2), F = [[u, v], [v, -u]], R = [[a, 0], [0, b]];
    const mm = (X, Y) => [[X[0][0] * Y[0][0] + X[0][1] * Y[1][0], X[0][0] * Y[0][1] + X[0][1] * Y[1][1]], [X[1][0] * Y[0][0] + X[1][1] * Y[1][0], X[1][0] * Y[0][1] + X[1][1] * Y[1][1]]];
    const FRF = mm(mm(F, R), F), D = [mm(mm(R, FRF), R), mm(mm(FRF, R), FRF)].reduce((P, Q) => P.map((r, i) => r.map((x, j) => x - Q[i][j])));
    const H = u * u + v * v - 1, Q = u * u * (a - b) ** 2 + a * b;
    const P = [[(a - b) * v * v * Q - a * (a * a * u * u + b * b * v * v) * H, -u * v * (a - b) * Q - 2 * a * b * u * v * (a - b) * H], [0, -(a - b) * v * v * Q - b * (a * a * v * v + b * b * u * u) * H]]; P[1][0] = P[0][1];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) worst = Math.max(worst, Math.abs(D[r][c] - P[r][c]) / (1 + Math.abs(D[r][c]))); }
  check(C.equal && C.terms === 30 && C.degree === 7 && worst < 1e-12, 'Theorem 3.1: R(FRF)R − (FRF)R(FRF) equals the printed certificate as polynomials in u, v, a, b — expanded term by term, and again numerically at 40 random points',
    `${C.terms} terms of degree ${C.degree} · identity ${C.equal} · worst relative gap at random points ${worst.toExponential(1)}`); }
/* 2 — the lemmas, exactly */
{ const E = L.ffExactChecks();
  check(E.all && E.H && E.Q && E.ybHat && E.cos && E.zIsZeta3 && E.sec3 && E.sec4 && E.control.Q && E.control.yb,
    'H = u² + v² − 1 = 0 and Q = u²(a − b)² + ab = 0 in exact integers of Z[ζ, s]; R̂ = diag(z, 1) braids with no phase premise; 2cos(3π/5) = −φ⁻¹ and a/b = ζ³; the z of §3 (b/a) and of §4 (a/b) are conjugate roots of one quadratic — and with b → b̄, Q ≠ 0 and the braid relation fails',
    `H ${E.H} · Q ${E.Q} · R̂ ${E.ybHat} · phases ${E.cos && E.zIsZeta3} · §3 ${E.sec3} · §4 ${E.sec4} · control Q = ${E.control.Qnum[0].toFixed(5)}${E.control.Qnum[1] >= 0 ? '+' : '−'}${Math.abs(E.control.Qnum[1]).toFixed(5)}i, braid fails ${E.control.yb}`); }
/* 3 — the geometry of the gates */
{ const a1 = L.ffAxisAngle(L.FF_B1), a2 = L.ffAxisAngle(L.FF_B2), aF = L.ffAxisAngle(L.FF_F), c = a1.n.reduce((s, x, i) => s + x * a2.n[i], 0);
  let ten = 0; for (const A of [a1, a2]) { let x = [0.3, -0.5, 0.81]; const x0 = x; for (let k = 0; k < 10; k++) x = L.ffRot(A.n, A.th, x); ten = Math.max(ten, Math.hypot(...x.map((v, i) => v - x0[i]))); }
  let gb = 0, I = L.ffEye(2); for (let k = 0; k <= 20; k++) { let U = I; for (let j = 0; j < k; j++) U = L.ffMM(L.FF_B2, U); gb = Math.max(gb, Math.abs(U[1][0][0] ** 2 + U[1][0][1] ** 2 - L.vxBraidPnum(k))); }
  check(Math.abs(a1.th - 3 * Math.PI / 5) < 1e-13 && Math.abs(a2.th - 3 * Math.PI / 5) < 1e-13 && Math.abs(c + Math.pow(L.FF_PHI, -3)) < 1e-14 && Math.abs(aF.th - Math.PI) < 1e-12 && Math.abs(Math.abs(aF.n[2]) - 1 / L.FF_PHI) < 1e-14 && ten < 1e-12 && gb < 1e-13,
    'each braid generator turns the Bloch sphere by 108°, the angle of the regular pentagon, ten turns returning every state; the axes of σ₁ and σ₂ stand at arccos(−φ⁻³), F is a half-turn at arccos φ⁻¹ from the 𝟙 pole — and σ₂ᵏ from |𝟙⟩ is the fibreach laboratory’s golden braid p_k = 4φ⁻³ sin²(3πk/10)',
    `turns ${(a1.th * 180 / Math.PI).toFixed(9)}°, ${(a2.th * 180 / Math.PI).toFixed(9)}° · axes ${(Math.acos(c) * 180 / Math.PI).toFixed(4)}° · F ${(Math.acos(Math.abs(aF.n[2])) * 180 / Math.PI).toFixed(4)}° · σ¹⁰ ${ten.toExponential(1)} · golden braid k ≤ 20 ${gb.toExponential(1)}`); }
/* 4, 5 — one noisy gate */
{ const cases = [[[0.95, 0, 0, 0.05], 0.02], [[0.94, 0, 0, 0.06], 0.03], [[0.97, 0.01, 0.01, 0.01], 0], [[0.8, 0.07, 0.06, 0.07], 0.1], [[0.9, 0.05, 0, 0.05], 0.03], [[1, 0, 0, 0], 0.2], [[0.5, 0.2, 0.1, 0.2], 0.4]];
  const words = ['', '1', '2', '121', '12b2a1', '2222b'];
  let att = 0, over = -1, defect = 0, plus = 0, nAtt = 0, nOver = -1, worthGap = 0, n = 0;
  for (const [p, l] of cases) for (const w of words) { const U = L.ffWordU(w), R = L.ffDiamondReport(U, p, l, 120, 7 + n++);
    att = Math.max(att, Math.abs(R.bell - R.D)); over = Math.max(over, R.ent - R.D); defect = Math.max(defect, R.defect);
    if (p[1] === 0 && p[2] === 0) plus = Math.max(plus, Math.abs(R.plus - R.D));
    nAtt = Math.max(nAtt, Math.abs(R.axis - R.Nu)); nOver = Math.max(nOver, R.one - R.Nu); worthGap = Math.max(worthGap, Math.abs(R.D - R.Nu - R.worth)); }
  check(att < 1e-12 && plus < 1e-12 && over <= 1e-12 && defect < 1e-14, 'Theorems 6.1 and 7.1: ‖E − V‖◇ = 2[1 − (1 − ℓ)p₀] is attained by the proofs’ own inputs — U†|+⟩ for phase flips, (U† ⊗ I)|Φ⁺⟩ for any Pauli noise — and never exceeded by random entangled inputs; the Kraus operators are complete',
    `${n} channels × 120 random inputs · attained to ${Math.max(att, plus).toExponential(1)} · the worst random input ${over <= 0 ? 'below it by ' + Math.abs(over).toExponential(2) : 'within rounding, ' + over.toExponential(1) + ' over'} · ΣK†K − 1 = ${defect.toExponential(1)}`);
  const dep = [0.97, 0.01, 0.01, 0.01];
  check(nAtt < 1e-12 && nOver <= 1e-12 && worthGap < 1e-12 && Math.abs(L.ffAncillaWorth(dep, 0) - 2 * 0.03 / 3) < 1e-15 && L.ffAncillaWorth([0.95, 0, 0, 0.05], 0.3) === 0,
    'with no reference system a single input shows at most 1 − (1 − ℓ)λ_min + ℓ — attained on the axis the channel contracts most, never exceeded — so the reference qubit of Theorem 7.1 is worth exactly 2(1 − ℓ)·min(p_X, p_Y, p_Z): nothing for the manuscript’s phase flips, 2p/3 for depolarising noise',
    `attained to ${nAtt.toExponential(1)} · random single inputs ${nOver <= 0 ? 'below it by ' + Math.abs(nOver).toExponential(2) : 'within rounding, ' + nOver.toExponential(1) + ' over'} · D − N − worth ${worthGap.toExponential(1)} · depolarising p = 0.03: worth ${L.ffAncillaWorth(dep, 0).toFixed(6)}`); }
/* 6 — the flagged qutrit */
{ const U = L.ffWordU('2a1'), K = L.ffKrausHat(U, [0.9, 0.02, 0.03, 0.05], 0.07), Lm = [[[0, 0], [0, 0], [0, 0]], [[0, 0], [0, 0], [0, 0]], [[0, 0], [0, 0], [1, 0]]];
  const absorb = L.ffMaxAbs(L.ffAdd(L.ffApplyK(K, Lm, 1), Lm, -1)), K0 = L.ffKrausHat(U, [1, 0, 0, 0], 0), ident = K0.length === 1 ? L.ffMaxAbs(L.ffAdd(K0[0], L.ffHat(U), -1)) : 1;
  let t81 = 0; for (const [p, l] of [[[0.93, 0, 0, 0.07], 0.04], [[0.9, 0.03, 0.02, 0.05], 0.06], [[1, 0, 0, 0], 0.3]]) t81 = Math.max(t81, Math.abs(L.ffComposite('1', p, l, L.ffPurify([0, 0, 0])) - L.ffDiamondExact(p, l)));
  const care = L.ffCarelessGap(U, [1, 0, 0, 0], 0);
  check(L.ffKrausDefect(K) < 1e-14 && absorb < 1e-15 && ident < 1e-15 && t81 < 1e-12 && Math.abs(care - 1) < 1e-12 && L.ffKrausDefect(L.ffKrausCareless(U, [0.9, 0, 0, 0.1], 0.05)) < 1e-14,
    '§8: the five Kraus operators of the flagged qutrit are complete, the flag is absorbing, at q = ℓ = 0 the map is exactly Ad_Û, and Theorem 8.1 is attained; the careless extension the manuscript warns of — code-only operators and A₄ = |L⟩⟨L| without √ℓ — is trace preserving and sits a distance 1 from the identity at zero noise',
    `completeness ${L.ffKrausDefect(K).toExponential(1)} · absorbing ${absorb.toExponential(1)} · identity ${ident.toExponential(1)} · Theorem 8.1 ${t81.toExponential(1)} · careless ${care.toFixed(12)}`); }
/* 7 — whole words */
{ const runs = [['1111', [0.95, 0, 0, 0.05], 0.02], ['1a11a', [0.9, 0, 0, 0.1], 0], ['1212', [1, 0, 0, 0], 0.03], ['1212', [0.94, 0, 0, 0.06], 0.03], ['12b2a1', [0.97, 0.01, 0.01, 0.01], 0.01], ['2222', [0.95, 0, 0, 0.05], 0]];
  let order = true, exact = 0, nEx = 0, sharper = true; const out = [];
  for (const [w, p, l] of runs) { const S = L.ffSearch(w, p, l, 900, 3), B = L.ffCompositeBounds(w.length, p, l), E = L.ffCompositeExact(w, p, l);
    if (!(S.best <= B.branch + 1e-12 && B.branch <= B.tele + 1e-15)) order = false; if (w.length >= 2 && !(B.branch < B.tele)) sharper = false;
    if (E != null) { nEx++; exact = Math.max(exact, Math.abs(S.best - E)); } out.push(`${w}: ${S.best.toFixed(5)} ≤ ${B.branch.toFixed(5)} ≤ ${B.tele.toFixed(5)}${E != null ? ` (exact ${E.toFixed(5)})` : ''}`); }
  check(order && sharper && nEx === 3 && exact < 1e-9, 'a word of noisy letters: the worst input found never passes the branch bound 2[1 − Π(1 − t_j)], which is below the manuscript’s telescoping 2Σt_j for two letters or more; for pure leakage and for phase flips through σ₁-only words the word is again the manuscript’s flagged channel and its exact value is reached',
    out.join(' · ')); }
/* 8 — the Fibonacci arithmetic */
{ let bij = true; for (let m = 1; m <= 16; m++) if (!L.ffZeckBijection(m).ok) bij = false;
  const N = 2n ** 200n + 12345n, Z = L.ffZeck(N); let s = 0n; for (const k of Z.ks) s += Z.F[k];
  let cas = true; for (let n = 0; n <= 300; n++) if (L.ffCassini(n) !== (n % 2 ? -1n : 1n)) cas = false;
  let fw = '0'; while (fw.length < 10000) fw = fw.replace(/[01]/g, c => c === '0' ? '01' : '0'); let word = true;
  for (let n = 0; n < 10000; n++) { const z = L.ffZeck(n); if ((z.ks.includes(2) ? '1' : '0') !== fw[n]) { word = false; break; } }
  let phi = true; for (let n = 1; n <= 200; n++) { const ex = L.ffPhinary(n); if (!ex) { phi = false; break; } const so = [...ex].sort((a, b) => b - a); if (Math.abs(ex.reduce((t, k) => t + Math.pow(L.FF_PHI, k), 0) - n) > 1e-9 * n || so.some((k, i) => i && so[i - 1] - k < 2)) phi = false; }
  const c3 = L.ffPathCounts(3);
  check(bij && s === N && Z.ks.every((k, i) => !i || Z.ks[i - 1] - k >= 2) && cas && word && phi && c3[0] === 1n && c3[1] === 2n,
    'Zeckendorf: every n < F_{m+2} is the value of exactly one length-m word with no two adjacent ones (m ≤ 16) — a fusion path of m + 2 anyons; 2²⁰⁰ + 12345 decomposes exactly; det Qⁿ = (−1)ⁿ to n = 300; the Fibonacci word — the quasicrystal’s tiles — is the last Zeckendorf digit for n < 10000; every N ≤ 200 is a finite sum of non-adjacent powers of φ; c₃ = (1, 2)',
    `bijections m ≤ 16 ${bij} · 2²⁰⁰ + 12345: ${Z.ks.length} terms · Cassini ${cas} · Fibonacci word ${word} · base φ ${phi} · 6 = ${L.ffPhinary(6).map(e => 'φ^' + e).join(' + ')}`); }
/* 9 — the anyon laboratory, the same exchanges */
{ const rng = L.ffRng(99), letters = '12ab'; let conj = 0, prob = 0, withB = 0, oldWrong = 0;
  for (let i = 0; i < 300; i++) { let w = ''; const n = 1 + Math.floor(rng() * 14); for (let j = 0; j < n; j++) w += letters[Math.floor(rng() * 4)];
    const U = L.ffWordU(w), M = L.fibBraid([...w].reverse().join(''));
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) conj = Math.max(conj, Math.hypot(M[r][c].re - U[r][c][0], M[r][c].im + U[r][c][1]));
    prob = Math.max(prob, Math.abs((M[1][0].re ** 2 + M[1][0].im ** 2) - (U[1][0][0] ** 2 + U[1][0][1] ** 2)));
    if (w.includes('b')) { withB++; const Mo = L.fibBraid([...w.replace(/b/g, '')].reverse().join('')); if (Math.hypot(Mo[1][0].re - M[1][0].re, Mo[1][0].im - M[1][0].im) > 1e-9) oldWrong++; } }
  const fixed = /else if\(ch==='b'\) M=fibMM\(M,FIB_S2I\);/.test(src);
  check(fixed && conj < 1e-12 && prob < 1e-12 && oldWrong > 0, 'the anyon laboratory braids the mirror chirality and reads a word right to left: a word sent there reversed makes the same exchanges, its matrix the complex conjugate and every probability equal — σ₂⁻¹ included, which it drew and, until now, never computed',
    `300 random words · conjugate to ${conj.toExponential(1)} · P(τ | 𝟙) equal to ${prob.toExponential(1)} · ${oldWrong} of ${withB} words with σ₂⁻¹ were wrong before the fix`); }
/* 10 — registration */
{ const need = [["{id:'fibflag', category:'quant'", 'declaration'], ["ja:'フラグ付きフィボナッチ量子ビット", 'Japanese title'], ['  fibflag:{\n    native_space:', 'native contract'],
    ["id:'fibflag', world:'s3', lab:'fibflag'", 'instrument'], ["['ffAtlas','fibflag',ffGroup,", 'catalogue'], ["  fibflag:'помеченный фибоначчиев кубит", 'Russian description'], ["  fibflag:'das markierte Fibonacci-Qubit", 'German description'],
    ["ffGroup.visible = (v==='fibflag');", 'visibility'], ["if(v==='fibflag'&&!ffObjs){ ffSetup(); }", 'setup'], ["else if(V==='fibflag') body = ffPanelHTML();", 'panel'], ["if(V==='fibflag'){ ffBind(ctl); }", 'bind'],
    ["} else if(state.s3view==='fibflag'){\n      fbsAnimT+=labDt; updateFf(labDt);", 'update'], ["fibflag:{speed:['ffSpeed',1], pause:['ffPaused','p']}", 'controls'], ["v==='fibflag'?[0.6,4.3,13.6]", 'camera'],
    ["hccGo({worldId:'s3',labId:'fibflag'})", 'navigator'], ["['ϕ','The flagged Fibonacci qubit'", 'journey'], ["new Set(['chmem','ois','fibflag'", 'landscape frame'],
    ["{id:'fibflagConfirm414', kind:'confirms'", 'discovery: confirms'], ["{id:'fibflagFound414', kind:'found'", 'discovery: found'], ["{id:'anyonInverseBraid414', kind:'revises'", 'discovery: revises'],
    ['globalThis.HCC_FIBFLAG=', 'agent handle'], ['data-anb="ffq"', 'the anyon laboratory’s way back'], ["ATLAS_BUS.pub('fibflag.diamond_norm'", 'its one bus publication'], ["ATLAS_BUS.get('fibflag.diamond_norm')", 'read by the golden braid'], ["if(k==='ffq'){ try{ state.ffWord=ffFromAnyon(anyonWord);", 'its handler'], ["hccGrip({ id:'ffStartDrag'", 'touch: the start'], ["hccGrip({ id:'ffZeckScrub'", 'touch: the integer']];
  const miss = need.filter(([s]) => !src.includes(s)).map(([, n]) => n), rel = (src.match(/^  \['fibflag','[a-z0-9]+','(exact|representation|invariant|contrast|analogy|coupling)',/gm) || []).length;
  check(!miss.length && rel >= 8, 'the laboratory reaches every registry: the declaration (four languages), the native contract, the instrument, the catalogue and its descriptions, the scene’s dispatch, the navigator and the journeys, the landscape frame, three discoveries, the agent handle, two touch grips, a button in the anyon laboratory that sends its word here, one bus publication the golden braid reads as its δ — and eight typed relations to the anyon, golden-braid, Fibonacci-cube, quasicrystal, SU(2), spin, KAM and Hopf laboratories',
    `${need.length - miss.length}/${need.length} sites · ${rel} relations${miss.length ? ' · MISSING ' + miss.join(', ') : ''}`); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
