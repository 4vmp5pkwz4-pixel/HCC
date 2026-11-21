/* THE DARK DIAMOND (v4.435) — the statements Preece & Batenin register for their four-level model (BINDU_VECTRA, 2026-11-21),
   recomputed here by means independent of the page, and the claims ledger the atlas now carries.
     1. the model: H² = 2I, ⟨e₄|H|e₁⟩ = 0; the moments m₀…m₄ = 0, m₅ = 4S, m₆ = −3S² − 4G in EXACT rational arithmetic (BigInt)
        for random rational channel lists, the authors' two examples to the fraction, and the page's floating recurrence against them;
     2. G ≥ 0 with the pairwise-square form G = Σ_{r<s} γ_rγ_s(a_r b_s − a_s b_r)² exactly — zero iff the noise vectors are collinear;
     3. darkness iff Z = 0, and the kernel-checked activation bound p ≥ (Z/30)t⁵ on its window, from exact moments;
     4. how far beyond the window the bound actually holds, by an independent Runge–Kutta integration;
     5. one channel and two of half its rate are indistinguishable; a signed rate gives a negative probability and the instrument
        refuses it;
     6. the claims ledger as data, the revision of what v4.411 said about the sharp envelope, the machine-checked evidence tier,
        and the wiring of the laboratory and its instrument.
   What is NOT checked here: the Lean proofs themselves — the atlas has no Lean toolchain and replays none of them. */
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const page = (() => { const a = src.indexOf('/* ═══ DDM-MATH-BEGIN'), b = src.indexOf('/* ═══ DDM-MATH-END'); return new Function(src.slice(a, b) + ';return {ddmInvariants, ddmMoments, ddmOnset, ddmProb, ddmBoundHolds, ddmGramPlane};')(); })();
const rng = (() => { let s = 4350; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

/* exact rationals and Gaussian rationals */
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const Q = (n, d = 1n) => { n = BigInt(n); d = BigInt(d); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; return { n: n / g, d: d / g }; };
const add = (x, y) => Q(x.n * y.d + y.n * x.d, x.d * y.d), sub = (x, y) => Q(x.n * y.d - y.n * x.d, x.d * y.d), mul = (x, y) => Q(x.n * y.n, x.d * y.d), eq = (x, y) => x.n === y.n && x.d === y.d, Z0 = Q(0), qn = x => Number(x.n) / Number(x.d);
const H = [0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, -1, 0, 1, -1, 0].map(v => Q(v));
function exactInv(chs) { let X = Q(0), Y = Q(0), Zz = Q(0), C = Q(0); for (const c of chs) { X = add(X, mul(c.g, mul(c.a, c.a))); Y = add(Y, mul(c.g, mul(c.b, c.b))); const d = sub(c.a, c.b); Zz = add(Zz, mul(c.g, mul(d, d))); C = add(C, mul(c.g, mul(c.a, c.b))); }
  const half = Q(1, 2); X = mul(X, half); Y = mul(Y, half); Zz = mul(Zz, half); const S = mul(Q(2), Zz), A = mul(Q(2), X), B = mul(Q(2), Y), G = sub(mul(A, B), mul(C, C)); return { X, Y, Z: Zz, S, G, A, B, C }; }
function exactMoments(I, n) { /* M ← −i[H, M] − D∘M on Gaussian rationals (re, im) */ const x = I.X, y = I.Y, z = I.Z, D = [Z0, x, y, Z0, x, Z0, z, x, y, z, Z0, y, Z0, x, y, Z0];
  let re = Array(16).fill(Z0), im = Array(16).fill(Z0); re[0] = Q(1); const m = [re[15]];
  for (let k = 1; k <= n; k++) { const R = [], Im = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let cr = Z0, ci = Z0; for (let l = 0; l < 4; l++) { cr = add(cr, sub(mul(H[4 * i + l], re[4 * l + j]), mul(re[4 * i + l], H[4 * l + j]))); ci = add(ci, sub(mul(H[4 * i + l], im[4 * l + j]), mul(im[4 * i + l], H[4 * l + j]))); }
      const q = 4 * i + j; R.push(sub(ci, mul(D[q], re[q]))); Im.push(sub(Q(0), add(cr, mul(D[q], im[q])))); } re = R; im = Im; m.push(re[15]); } return m; }
const randList = (valid = true) => { const r = 1 + Math.floor(rng() * 4), out = []; for (let k = 0; k < r; k++) out.push({ a: Q(Math.floor(rng() * 9) - 4, 2), b: Q(Math.floor(rng() * 9) - 4, 2), g: Q(valid ? Math.floor(rng() * 7) : Math.floor(rng() * 9) - 3, 2) }); return out; };
const toF = chs => chs.map(c => ({ a: qn(c.a), b: qn(c.b), rate: qn(c.g) }));

{ let H2 = true; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = Z0; for (let k = 0; k < 4; k++) s = add(s, mul(H[4 * i + k], H[4 * k + j])); if (!eq(s, Q(i === j ? 2 : 0))) H2 = false; }
  let ok = H2 && eq(H[12], Z0), cases = 0, pageWorst = 0;
  for (let t = 0; t < 40; t++) { const chs = randList(), I = exactInv(chs), m = exactMoments(I, 6); cases++;
    if (!(m.slice(0, 5).every(v => eq(v, Z0)) && eq(m[5], mul(Q(4), I.S)) && eq(m[6], sub(Q(0), add(mul(Q(3), mul(I.S, I.S)), mul(Q(4), I.G)))))) ok = false;
    const pm = page.ddmMoments(page.ddmInvariants(toF(chs)), 6); for (let k = 0; k <= 6; k++) pageWorst = Math.max(pageWorst, Math.abs(pm[k] - qn(m[k])) / Math.max(1, Math.abs(qn(m[k])))); }
  const one = exactMoments(exactInv([{ a: Q(1), b: Q(0), g: Q(1) }]), 6), two = exactMoments(exactInv([{ a: Q(1), b: Q(0), g: Q(1) }, { a: Q(1), b: Q(1), g: Q(1) }]), 6);
  const ex = eq(mul(one[5], Q(1, 120)), Q(1, 30)) && eq(mul(one[6], Q(1, 720)), Q(-1, 240)) && eq(mul(two[5], Q(1, 120)), Q(1, 30)) && eq(mul(two[6], Q(1, 720)), Q(-7, 720));
  const rec = page.ddmOnset(page.ddmInvariants([{ a: 1, b: 0, rate: 1 }, { a: 1, b: 1, rate: 1 }]));
  check(ok && ex && pageWorst < 1e-12 && Math.abs(rec.S_recovered - 1) < 1e-12 && Math.abs(rec.G_recovered - 1) < 1e-12, 'the model and its first moments, exactly: H² = 2I and ⟨e₄|H|e₁⟩ = 0, so without noise the two paths cancel; for random rational channel lists the recurrence of the generator in exact Gaussian-rational arithmetic gives m₀ … m₄ = 0, m₅ = 4S and m₆ = −3S² − 4G with no rounding at all; the authors’ two examples hold to the fraction — (1, 0, 1) gives c₅ = 1/30, c₆ = −1/240, and adding (1, 1, 1) leaves c₅ and gives c₆ = −7/720 — and the page’s floating recurrence and its recovery S = 30c₅, G = −180c₆ − 675c₅² agree',
    `${cases} exact cases · page vs exact ≤ ${pageWorst.toExponential(1)} · examples (1/30, −1/240), (1/30, −7/720) · recovered S = ${rec.S_recovered.toFixed(12)}, G = ${rec.G_recovered.toFixed(12)}`); }

{ let ok = true, cases = 0, zeros = 0, collinearOk = true;
  for (let t = 0; t < 120; t++) { const chs = t % 10 === 0 ? (() => { const a = Q(Math.floor(rng() * 5) - 2), b = Q(Math.floor(rng() * 5) - 2); return [{ a, b, g: Q(1) }, { a: mul(a, Q(2)), b: mul(b, Q(2)), g: Q(3, 2) }]; })() : randList(), I = exactInv(chs);
    let pair = Q(0); for (let r = 0; r < chs.length; r++) for (let s = r + 1; s < chs.length; s++) { const w = sub(mul(chs[r].a, chs[s].b), mul(chs[s].a, chs[r].b)); pair = add(pair, mul(mul(chs[r].g, chs[s].g), mul(w, w))); }
    cases++; if (!eq(I.G, pair) || I.G.n < 0n) ok = false; if (eq(I.G, Z0)) { zeros++; const act = chs.filter(c => c.g.n > 0n); for (let r = 0; r < act.length; r++) for (let s = r + 1; s < act.length; s++) if (!eq(mul(act[r].a, act[s].b), mul(act[s].a, act[r].b))) collinearOk = false; } }
  check(ok && collinearOk && zeros >= 12, 'the Gram determinant is a sum of squares, exactly: G = AB − C² = Σ_{r<s} γ_rγ_s(a_r b_s − a_s b_r)² for every rational list tried, so G ≥ 0 under nonnegative rates, and wherever G = 0 the active channels’ noise vectors are collinear — G counts two independent noise DIRECTIONS, not channels',
    `${cases} lists · G = pairwise sum in every case · ${zeros} with G = 0, all collinear`); }

{ let darkOk = true, onOk = true, boundOk = true, pts = 0, minRatio = Infinity;
  for (let t = 0; t < 30; t++) { const a = Math.floor(rng() * 9) - 4, chs = [{ a: Q(a, 2), b: Q(a, 2), g: Q(1 + Math.floor(rng() * 5), 2) }, { a: Q(1), b: Q(1), g: Q(Math.floor(rng() * 4), 2) }], I = exactInv(chs), m = exactMoments(I, 16);
    if (!eq(I.Z, Z0) || !m.every(v => eq(v, Z0))) darkOk = false; const p = page.ddmProb(page.ddmInvariants(toF(chs)), 3.7); if (Math.abs(p) > 1e-14) darkOk = false; }
  for (let t = 0; t < 200; t++) { const chs = randList(), I = exactInv(chs); if (eq(I.Z, Z0)) continue; const m = exactMoments(I, 14).map(qn), F = page.ddmInvariants(toF(chs));
    if (!(m[5] > 0)) onOk = false; for (const f of [1e-3, 0.1, 0.5, 1]) { const tt = f * F.window; let p = 0, fac = 1; for (let n = 0; n < m.length; n++) { if (n) fac *= tt / n; p += m[n] * fac; } const lb = qn(I.Z) / 30 * Math.pow(tt, 5); pts++; minRatio = Math.min(minRatio, p / lb); if (!(p >= lb)) boundOk = false; } }
  check(darkOk && onOk && boundOk, 'dark iff Z = 0, and the kernel-checked activation bound: lists whose every channel dephases e₂ and e₃ alike have Z = 0 and every exact moment through m₁₆ zero, and p(3.7) = 0 to rounding; every list with Z > 0 has m₅ = 4S > 0 — no threshold in the rate; and on the window 0 < t ≤ min(1/K, Z/K⁶), K = 4 + max(X, Y, Z), the exact-moment series stays above (Z/30)t⁵ at every point tried',
    `${pts} window points · min p/bound ${minRatio.toFixed(4)} (→ 2 as t → 0, since p ≈ 2Z t⁵/30)`); }

/* an integrator that shares no code with the page: classical RK4 on the 32 real coordinates of the density matrix */
function rk4P(chs, T, h) { const I = page.ddmInvariants(chs), x = I.X, y = I.Y, z = I.Z, D = [0, x, y, 0, x, 0, z, x, y, z, 0, y, 0, x, y, 0], Hf = [0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, -1, 0, 1, -1, 0];
  const f = v => { const o = new Float64Array(32); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let cr = 0, ci = 0; for (let k = 0; k < 4; k++) { cr += Hf[4 * i + k] * v[4 * k + j] - v[4 * i + k] * Hf[4 * k + j]; ci += Hf[4 * i + k] * v[16 + 4 * k + j] - v[16 + 4 * i + k] * Hf[4 * k + j]; } const q = 4 * i + j; o[q] = ci - D[q] * v[q]; o[16 + q] = -cr - D[q] * v[16 + q]; } return o; };
  let v = new Float64Array(32); v[0] = 1; const n = Math.round(T / h); for (let s = 0; s < n; s++) { const k1 = f(v), k2 = f(v.map((u, i) => u + h / 2 * k1[i])), k3 = f(v.map((u, i) => u + h / 2 * k2[i])), k4 = f(v.map((u, i) => u + h * k3[i])); v = v.map((u, i) => u + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])); } return v[15]; }
{ const one = [{ a: 1, b: 0, rate: 1 }], I = page.ddmInvariants(one), held = page.ddmBoundHolds(I, 40), lb = t => I.Z / 30 * Math.pow(t, 5);
  const pA = rk4P(one, 1.10, 1e-3), pB = rk4P(one, 1.30, 1e-3), pc = page.ddmProb(I, 0.9), rc = rk4P(one, 0.9, 1e-3);
  const ok = Math.abs(I.window - 6.0214e-5) < 1e-8 && held > 1.1 && held < 1.3 && pA > lb(1.10) && pB < lb(1.30) && Math.abs(pc - rc) < 1e-9 && src.includes('the bound holds until t ≈ 1.18');
  check(ok, 'how much wider than its proof the bound holds: for the channel (1, 0, 1) the kernel-checked window ends at min(1/K, Z/K⁶) = 6.0·10⁻⁵, while an independent Runge–Kutta integration of the full 32-coordinate equation finds p(t) still above (Z/30)t⁵ at t = 1.10 and below it at t = 1.30 — the page’s marching grid puts the crossing at t ≈ 1.18, some twenty thousand windows further; the proof is sound and very conservative',
    `window ${I.window.toExponential(4)} · page crossing ${held.toFixed(2)} · RK4 p(1.10) = ${pA.toExponential(4)} > ${lb(1.10).toExponential(4)}, p(1.30) = ${pB.toExponential(4)} < ${lb(1.30).toExponential(4)} · page vs RK4 at 0.9: ${Math.abs(pc - rc).toExponential(1)}`); }

const SDK = await import(path.join(ROOT, 'api/agent-client.mjs'));
{ const one = [{ a: 1, b: 0, rate: 1 }], split = [{ a: 1, b: 0, rate: 0.5 }, { a: 1, b: 0, rate: 0.5 }], Ie = exactInv([{ a: Q(1), b: Q(0), g: Q(1) }]), Is = exactInv([{ a: Q(1), b: Q(0), g: Q(1, 2) }, { a: Q(1), b: Q(0), g: Q(1, 2) }]);
  const same = eq(Ie.X, Is.X) && eq(Ie.Y, Is.Y) && eq(Ie.Z, Is.Z), dp = Math.max(...[0.3, 2, 7].map(t => Math.abs(rk4P(one, t, 1e-3) - rk4P(split, t, 1e-3))));
  const pNeg = rk4P([{ a: 1, b: 2, rate: -1 }], 0.1, 1e-4); let refused = false; try { await SDK.evaluateInstrument('diamond', { diamond_rate1: -1 }); } catch (e) { refused = e.code === 'OUT_OF_DOMAIN'; }
  const In = page.ddmInvariants([{ a: 1, b: 2, rate: -100 }]);
  check(same && dp < 1e-13 && pNeg < 0 && refused && In.Z === -50 && In.K === -46, 'what the probability cannot tell, and where the theorems stop: one channel (1, 0, 1) and two channels of rate ½ have the same X, Y, Z exactly and the same p(t) by an independent integration — the number of physical jump operators is not identifiable; a signed rate is outside Valid — the authors’ counterexample (1, 2, −100) has Z = −50 and K = −46, and (1, 2, −1) already drives the “probability” of e₄ below zero at t = 0.1 — and the instrument refuses a negative rate instead of answering',
    `split: X, Y, Z equal · max |Δp| ${dp.toExponential(1)} · signed p(0.1) = ${pNeg.toExponential(3)} · instrument refuses: ${refused}`); }

{ let fresh = true; try { execFileSync(process.execPath, [path.join(ROOT, 'scripts/bindu-claims.mjs'), '--check'], { stdio: 'pipe' }); } catch (e) { fresh = false; }
  const C = read('api/bindu-claims.json'), ids = new Set(C.claims.map(c => c.id)), sum = Object.values(C.counts.by_class).reduce((a, b) => a + b, 0), reg = read('data/bindu/registry.json');
  const listed = [...src.matchAll(/ddmClaimsHTML\(\[([^\]]*)\]\)/g)].flatMap(m => m[1].split(',').map(x => x.trim().replace(/'/g, ''))).filter(Boolean);
  const ok = fresh && C.counts.claims === 93 && sum === 93 && reg.claims.every(d => ids.has(d.claim_id)) && listed.length >= 20 && listed.every(x => ids.has(x)) && C.counts.by_class.FALSE === 10 && C.counts.by_class.LEAN_PASS === 20 && C.counts.by_class.LEAN_KERNEL_PASS_SCOPE_REVIEW === 11
    && C.claims.find(c => c.id === 'C-012').class === 'OPEN' && C.claims.find(c => c.id === 'V3-010').class === 'LEAN_KERNEL_PASS_SCOPE_REVIEW' && C.claims.find(c => c.id === 'C-065').class === 'FALSE';
  check(ok, 'the authors’ own ledger, carried as data and unchanged: api/bindu-claims.json is in step with data/bindu/claims.tsv and registry.json; 93 claims, every class counted (20 LEAN, 11 kernel-checked under scope review, 25 analytic, 9 exact, 6 numeric, 9 open, 10 false, 3 historical), every registered Lean declaration attached to an existing claim, and every claim the two laboratories show in their trust boundary present in it',
    `${C.counts.claims} claims · ${reg.claims.length} declarations · ${Object.entries(C.counts.by_class).map(([k, v]) => (C.classes[k] || {}).short + ' ' + v).join(', ')} · ${listed.length} shown in the laboratories`); }

{ const { CORE } = await import(path.join(ROOT, 'core/index.mjs')), typed = CORE.connections({ kind: 'typed' }).connections, mc = typed.filter(c => c.evidence_tier === 'machine-checked');
  const ok = src.includes("{id:'fibreachRevise435', kind:'revises'") && src.includes("{id:'fibreachConfirm411', kind:'confirms'") && /C-012','V3-009','V3-010','V3-011'/.test(src)
    && mc.length >= 1 && mc.some(c => [c.from, c.to].sort().join('|') === 'diamond|fibreach') && typed.filter(c => c.evidence_tier === 'theorem').length > 50;
  check(ok, 'what v4.411 said is revised, not erased: the atlas then wrote that the sharp envelope ∏ sin²(min{π/2, U_j}) was proved while the authors’ ledger had it OPEN (C-012); the revision records that it is now kernel-checked in its stated scope (V3-009 … V3-011) and that the all-time and pump certificates the laboratory computes stay open — the v4.411 entry remains as history, and the reachability laboratory shows the trust boundary; and the atlas’s evidence tiers now keep a machine-checked proof apart from a proof on paper',
    `machine-checked relations ${mc.length} (${mc.map(c => c.from + '–' + c.to).join(', ')}) · theorem-tier ${typed.filter(c => c.evidence_tier === 'theorem').length}`); }

{ const M = await import(path.join(ROOT, 'core/atlas/instruments.mjs')), miss = ["{id:'diamond', category:'quant'", "id:'diamond', world:'s3', lab:'diamond'", "ddmGroup.visible = (v==='diamond');", "if(v==='diamond'&&!ddmObjs){ ddmSetup(); }", "else if(V==='diamond') body = ddmPanelHTML();",
    "if(V==='diamond'){ ddmBind(ctl); }", "} else if(state.s3view==='diamond'){", "diamond:{speed:['ddmSpeed',1], pause:['ddmPaused','p']},", "['ddmAtlas','diamond',ddmGroup,", "()=>goLab('s3','diamond')", "globalThis.HCC_DIAMOND=Object.freeze({", "{id:'diamond435', kind:'tested'"].filter(x => !src.includes(x));
  const defs = Object.fromEntries(M.INSTRUMENT_META.diamond.inputs.map(i => [i.name, i.default])), r = M.INSTRUMENTS.diamond(defs), I = page.ddmInvariants([{ a: 1, b: 0, rate: 1 }]);
  const ok = !miss.length && Math.abs(r.diamond_probability - page.ddmProb(I, 0.5)) < 1e-15 && Math.abs(r.diamond_c5 - 1 / 30) < 1e-14 && Math.abs(r.diamond_c6 + 1 / 240) < 1e-14 && r.diamond_dark === 0 && Math.abs(r.diamond_window - 6.0214e-5) < 1e-8;
  check(ok, 'the laboratory is in the page and its instrument runs without a browser: declared, registered, shown, set up, given a panel, ticked, listed among the laboratories and the trips, with an agent handle; at its defaults — the single channel (1, 0, 1) at t = ½ — the instrument returns the page’s own p(t), c₅ = 1/30, c₆ = −1/240 and the window 6.0·10⁻⁵',
    `p(½) = ${r.diamond_probability.toExponential(6)} · c₅ = ${r.diamond_c5} · c₆ = ${r.diamond_c6} · window ${r.diamond_window.toExponential(4)}${miss.length ? ' · missing ' + miss.join(' | ') : ''}`); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
