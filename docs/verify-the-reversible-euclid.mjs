/* THE REVERSIBLE EUCLID (v4.421) — after «Discovering state-of-the-art quantum circuits with large language models» (Gu, Kemeny,
   Yelin, Lukin; arXiv:2610.22367, 15 October 2026). The laboratory's mathematics is one block of pure functions (DIVSTEP-MATH),
   lifted out of index.html and run here as it stands. What is checked is what the atlas computes — the divstep walk in exact
   integers. The manuscript's circuit counts are NOT recomputed, here or there; check 5 only re-runs the table's arithmetic.
     1. the walk inverts: on four primes, for every sampled input, ±f_v·2⁻ⁿ·w ≡ 1 and equals Fermat's w^{p−2};
     2. the invariants f·2ⁿ ≡ f_v·w and g·2ⁿ ≡ g_v·w (mod p) hold at every step, and gcd(f, g) never changes;
     3. each step is one of three branches decided by the lowest bit of g and the sign of z, and g's size never grows by more than a bit;
     4. the stopping times on the 256-bit prime: about 517, well inside the cited bound of 590;
     5. the ledger's arithmetic: the gains from the table's own entries, and divsteps against the Euclidean circuit;
     6. a composite modulus is refused rather than answered;
     7. the laboratory reaches every registry of the atlas and stands on the shared stage fit and dock. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('block not found: ' + a.slice(0, 50)); return src.slice(i, j); };
const MATH = cut('/* ═══ DIVSTEP-MATH-BEGIN ═══', '/* ═══ DIVSTEP-MATH-END ═══');
const names = ['DVS_P256', 'DVS_PAPER', 'DVS_EUCLID', 'DVS_BOUND256', 'dvsBits', 'dvsMod', 'dvsPow', 'dvsStep', 'dvsRun', 'dvsInverse', 'dvsRng', 'dvsRandom', 'dvsSample', 'dvsGain'];
const L = new Function(`${MATH}\nreturn {${names.join(',')}};`)();
const P = L.DVS_P256, primes = [101n, 65537n, 2n ** 61n - 1n, P];

{ let n = 0, ok = 0; const rng = L.dvsRng(20261015);
  for (const p of primes) for (let i = 0; i < (p === P ? 150 : 300); i++) { const w = L.dvsRandom(p, rng), I = L.dvsInverse(p, w); n++; if (I.ok && I.inv === L.dvsPow(w, p - 2n, p) && I.inv * w % p === 1n) ok++; }
  const edge = [1n, 2n, P - 1n, P - 2n, (P + 1n) / 2n].every(w => { const I = L.dvsInverse(P, w); return I.ok && I.inv * w % P === 1n; });
  check(ok === n && edge && P === 2n ** 256n - 2n ** 32n - 977n && L.dvsBits(P) === 256, 'the walk inverts: on p = 101, 65537, 2⁶¹ − 1 and the 256-bit prime of secp256k1, for every sampled input and for 1, 2, p − 1, p − 2 and (p + 1)/2, the walk ends with f = ±1 and ±f_v·2⁻ⁿ is the inverse — the same number Fermat’s w^{p−2} gives',
    `${ok}/${n} inputs · edge cases ${edge}`); }

{ let bad = 0, steps = 0; const rng = L.dvsRng(5), gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
  for (const p of [65537n, P]) for (let t = 0; t < 12; t++) { const w = L.dvsRandom(p, rng), S = { z: 0, f: p, g: w, fv: 0n, gv: 1n }; let n = 0n;
    while (S.g !== 0n && n < 2000n) { L.dvsStep(S); n++; steps++; const two = L.dvsPow(2n, n, p);
      if (L.dvsMod(S.f * two - S.fv * w, p) !== 0n || L.dvsMod(S.g * two - S.gv * w, p) !== 0n || (S.f & 1n) !== 1n || gcd(S.f, S.g) !== 1n) bad++; } }
  check(bad === 0 && steps > 3000, 'the invariants that carry the inverse hold at every step, not only at the end: f·2ⁿ ≡ f_v·w and g·2ⁿ ≡ g_v·w (mod p), f stays odd, and gcd(f, g) stays 1', `${steps} steps checked · ${bad} violations`); }

{ const R = L.dvsRun(P, 0x1234567890abcdefn, true), T = R.trace; let grow = 0, wrong = 0, c = [0, 0, 0];
  for (let i = 1; i < T.length; i++) { const a = T[i - 1], b = T[i]; c[b.b]++; if (b.lg > Math.max(a.lg, a.lf) + 0) grow++;
    if (b.b === 0 ? !(a.z >= 0 && b.z === -a.z) : b.z !== a.z + 1) wrong++; }
  const zero = Object.is(L.dvsRun(P, 3n, true).trace[1].z, -0);
  check(wrong === 0 && grow === 0 && c[0] + c[1] + c[2] === R.n && c[0] > 50 && c[2] > 100 && T[T.length - 1].lg === 0 && !zero,
    'each step is one of three branches: a swap only when z ≥ 0 (and then z ↦ −z), otherwise z ↦ z + 1; the bit length of g never exceeds the larger of the two before it; the walk ends exactly when g = 0',
    `${R.n} steps: ${c[0]} swaps, ${c[1]} adds, ${c[2]} halvings · z ∈ [${R.zmin}, ${R.zmax}]`); }

{ const A = L.dvsSample(P, 1500, L.dvsRng(7)), mean = A.sum / A.n, a2 = L.dvsSample(P, 3, L.dvsRng(7)), b2 = L.dvsSample(P, 3, L.dvsRng(7));
  check(A.bad === 0 && Math.abs(mean - 517) < 1.5 && A.min >= 495 && A.max <= 545 && A.max < L.DVS_BOUND256 && L.DVS_BOUND256 === 590 && A.zdeep >= 8 && A.zdeep <= 30 && a2.sum === b2.sum,
    'the stopping times on the 256-bit prime, sampled: about 517 divsteps on average, all between 495 and 545, every inverse correct — inside the 590 that always suffice (Wuille’s bound for this variant: cited, not re-proved); a seed always gives the same inputs',
    `${A.n} inputs · ${A.min}–${A.max} · mean ${mean.toFixed(2)} · deepest z = −${A.zdeep} · bound ${L.DVS_BOUND256}`); }

{ const G = Object.fromEntries(L.DVS_PAPER.map(r => [r[0], L.dvsGain(r)])), inv = L.DVS_PAPER.find(r => r[0] === 'inv'), tq = inv[4] * inv[5], te = L.DVS_EUCLID.T * L.DVS_EUCLID.Q, near = (a, b, t) => Math.abs(a / b - 1) < t;
  check(L.DVS_PAPER.length === 8 && G.inv === null && near(G.rs, 12, 0.03) && near(G.hhl, 32, 0.05) && near(G.coul, 9.9, 0.02) && near(G.gauss, 39, 0.03) && near(G.fes, 4.1, 0.04) && near(G.lgt, 7.7, 0.04) && near(tq, 3.7e9, 0.02) && near(te / tq, 4.73, 0.02)
    && L.DVS_PAPER.filter(r => r[2] != null).every(r => r[4] < r[2] && r[5] < r[3]),
    'the ledger’s arithmetic, from the manuscript’s own Table 1 (its counts are not recomputed): G = (T·Q) before ÷ after is 12, 31, 9.9, 39, 4.0 and 7.9 — the printed 12, 32, 9.9, 39, 4.1 and 7.7 to the rounding of the entries; in all seven with a baseline both T and Q fall; the divstep inversion’s T·Q = 3.7·10⁹ is 4.7 times below the specialised Euclidean circuit’s',
    `G: rs ${G.rs.toFixed(1)}, hhl ${G.hhl.toFixed(1)}, coul ${G.coul.toFixed(1)}, gauss ${G.gauss.toFixed(1)}, fes ${G.fes.toFixed(1)}, lgt ${G.lgt.toFixed(1)} · T·Q ${tq.toExponential(2)} vs ${te.toExponential(2)}`); }

{ const a = L.dvsInverse(91n, 14n), b = L.dvsInverse(91n, 2n), c = L.dvsInverse(91n, 4n);
  check(!a.ok && a.gcd === 7n && b.ok && b.inv * 2n % 91n === 1n && c.ok, 'what it refuses: asked to invert 14 modulo 91 = 7·13 it reports the common factor 7 instead of an answer — and inverts what is invertible there', `gcd ${a.gcd} · 2⁻¹ mod 91 = ${b.inv}`); }

{ const need = [["{id:'divstep', category:'quant'", 'declaration'], ["ja:'可逆なユークリッド", 'Japanese title'], ['  divstep:{\n    native_space:', 'native contract'], ["id:'divstep', world:'s3', lab:'divstep'", 'instrument'], ["['dvsAtlas','divstep',dvsGroup,", 'catalogue'],
    ["  divstep:'обратимый Евклид", 'Russian description'], ["  divstep:'der reversible Euklid", 'German description'], ["dvsGroup.visible = (v==='divstep');", 'visibility'], ["if(v==='divstep'&&!dvsObjs){ dvsSetup(); }", 'setup'], ["else if(V==='divstep') body = dvsPanelHTML();", 'panel'], ["if(V==='divstep'){ dvsBind(ctl); }", 'bind'],
    ["} else if(state.s3view==='divstep'){\n      fbsAnimT+=labDt; updateDvs(labDt);", 'update'], ["divstep:{speed:['dvsSpeed',1], pause:['dvsPaused','p']}", 'controls'], ["v==='divstep'?[0.4,2.0,9.6]", 'camera'], ["hccGo({worldId:'s3',labId:'divstep'})", 'navigator'], ["['÷','The reversible Euclid'", 'journey'],
    ["{id:'divstepTested421', kind:'tested'", 'discovery'], ['globalThis.HCC_DIVSTEP=', 'agent handle'], ['const DVS_FIT={', 'the shared stage fit'], ["stageDockMake('dvsDock'", 'the shared dock'], ["stageSheetTick(DVS_SHEET,'dvsTop')", 'the sheet anchor'], ["const STAGE_SELF=new Set(['inflate','hpage','divstep']);", 'fits itself'],
    ["ATLAS_BUS.get('fibflag.diamond_norm')", 'reads the flagged qubit’s noise']];
  const miss = need.filter(([s]) => !src.includes(s)).map(([, n]) => n), rel = (src.match(/^  \['divstep','[a-z0-9]+','(exact|representation|invariant|contrast|analogy|coupling|causal|limit)',/gm) || []).length;
  check(!miss.length && rel >= 6 && !/\b(document|window|THREE|state|renderer|camera)\s*[.\[(]/.test(MATH) && /NOT DONE HERE/.test(src.slice(src.indexOf('function dvsPanelHTML'), src.indexOf('function dvsBind'))),
    'the laboratory reaches every registry — declaration in four languages, native contract, instrument, catalogue, dispatch, navigator, journey, discovery, agent handle, six relations — stands on the shared stage fit, dock and sheet anchor, reads the flagged Fibonacci qubit’s noise from the bus, and its panel says in so many words what is not done here',
    `${need.length - miss.length}/${need.length} sites · ${rel} relations${miss.length ? ' · MISSING ' + miss.join(', ') : ''}`); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
