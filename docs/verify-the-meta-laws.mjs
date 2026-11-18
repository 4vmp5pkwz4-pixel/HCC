/* THE META-LAWS (v4.434) — what the laboratories share that nobody wrote down, checked from outside the engine that found it.
     1. api/metalaws.json was made from the instruments as they stand (its hash is the hash of core/atlas/instruments.mjs);
     2. every exact power law it groups into an exponent class holds at fresh points the sweep never visited;
     3. every bridge — an exact tie between two laboratories' outputs along an input both take — holds at fresh points, with the
        closed forms it names (2π², π, 4π) and the identities it reports (Gauss's flux is one minus the volume fraction; a sphere's
        area is 4π d_A²; the Tolman dimming is a⁴; the Bell correlation is minus the Bloch z);
     4. the agreement with the declared relations is recomputed: which pairs are declared (from the core's typed relations), the
        base rate, each detector's lift, and its hypergeometric tail — the last against an exact rational computation in BigInt;
     5. the declared graph's own link prediction (Adamic–Adar, each declared edge left out in turn) is recomputed;
     6. the constants it binds are the same irrational numbers in both laboratories, and every rational exponent in the atlas has a
        denominator of at most four;
     7. the laboratory is wired into the page, its instrument answers with the counts of the file at its defaults, and the layout
        puts tied laboratories nearer than random ones.
   What is NOT checked here: that any tie is physics. The file says which ties agree with what was declared and how far from chance
   that agreement is; a single tie is a candidate for a reader or an agent to judge. */
import fs from 'node:fs'; import path from 'node:path'; import { createHash } from 'node:crypto';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const J = read('api/metalaws.json'), V = read('version.json');
const M = await import(path.join(ROOT, 'core/atlas/instruments.mjs'));
const { CORE } = await import(path.join(ROOT, 'core/index.mjs'));
const defs = id => Object.fromEntries(M.INSTRUMENT_META[id].inputs.filter(i => i.default !== undefined).map(i => [i.name, i.default]));
const run = (id, inp) => M.INSTRUMENTS[id]({ ...defs(id), ...inp });
const rng = (() => { let s = 434; return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648; })();
const key = (a, b) => a < b ? a + '|' + b : b + '|' + a;

{ const sha = createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'core/atlas/instruments.mjs'))).digest('hex').slice(0, 16), C = J.counts;
  const ok = J.schema === 'hcc.metalaws/1' && J.instruments_sha16 === sha && J.version === V.version && J.build === V.build && C.instruments === Object.keys(M.INSTRUMENTS).length
    && C.curves > 5000 && C.links > 300 && C.laboratories >= 145 && J.labs.length === C.laboratories && Array.isArray(J.declared) && J.trusted_detectors.includes('bridge');
  check(ok, 'the file is in step with what it describes: made from this very core/atlas/instruments.mjs (hash), for this version and build, from every instrument that runs without a browser — each swept along every numeric input over its declared range',
    `${C.instruments} instruments · ${C.curves} curves (${Object.entries(C.by_kind).map(([k, v]) => k + ' ' + v).join(', ')}) · ${C.links} ties, ${C.undeclared} undeclared · ${C.laboratories} laboratories · hash ${sha}`); }

{ let laws = 0, worst = 0; const bad = [];
  for (const c of J.classes.filter(c => c.detector === 'exponent')) { const p = c.label.match(/x\^(-?\d+)(?:\/(\d+))?/), q = +p[1] / (p[2] ? +p[2] : 1);
    for (const w of c.where) { const m = w.match(/^([^.]+)\.(.+)\(([^()]+)\)$/), id = m[1], out = m[2], inp = m[3], I = M.INSTRUMENT_META[id].inputs.find(i => i.name === inp);
      const lg = I.min > 0 && I.max / I.min >= 30, at = u => lg ? I.min * Math.pow(I.max / I.min, u) : I.min + (I.max - I.min) * u;
      for (let t = 0; t < 2; t++) { const x1 = at(0.05 + 0.9 * rng()), x2 = at(0.05 + 0.9 * rng()); if (Math.abs(x2 / x1 - 1) < 1e-3) continue;
        const y1 = run(id, { [inp]: x1 })[out], y2 = run(id, { [inp]: x2 })[out], e = Math.abs(y2 / y1 / Math.pow(x2 / x1, q) - 1); worst = Math.max(worst, e); if (!(e < 1e-6)) bad.push(`${w} ×${q}: ${e.toExponential(1)}`); }
      laws++; } }
  check(laws > 50 && !bad.length, 'every exact power law the exponent detector groups is re-measured at two fresh points of its own range, chosen here: y(x₂)/y(x₁) = (x₂/x₁)ᵖ with the rational p it was given',
    `${laws} laws in ${J.classes.filter(c => c.detector === 'exponent').length} classes · worst relative deviation ${worst.toExponential(1)}${bad.length ? ' · off ' + bad.slice(0, 4).join(' | ') : ''}`); }

const frac = q => { const [a, b] = String(q).split('/').map(Number); return b ? a / b : a; };
{ let ties = 0, pts = 0, worst = 0; const bad = [], B = J.bridges.found;
  for (const b of B) { const name = b.input.split(' [')[0];
    for (const e of b.examples) { const [ia, ...ra] = e.a.split('.'), [ib, ...rb] = e.b.split('.'), oa = ra.join('.'), ob = rb.join('.');
      for (let t = 0; t < 9; t++) { const u = 0.03 + 0.94 * rng(), x = b.log ? b.range[0] * Math.pow(b.range[1] / b.range[0], u) : b.range[0] + (b.range[1] - b.range[0]) * u;
        const ya = M.INSTRUMENTS[ia]({ ...b.defaults[0], [name]: x })[oa], yb = M.INSTRUMENTS[ib]({ ...b.defaults[1], [name]: x })[ob]; if (!Number.isFinite(ya) || !Number.isFinite(yb)) continue;
        const pred = e.law === 'power' ? e.constant * Math.pow(Math.abs(ya), frac(e.q)) : e.law === 'affine' ? e.offset + e.constant * ya : e.law === 'equal' ? ya : e.constant * ya;
        const d = Math.abs(yb - pred) / Math.max(Math.abs(yb), Math.abs(pred), 1e-300); worst = Math.max(worst, d); pts++; if (!(d < 1e-8)) bad.push(`${e.b}←${e.a} at ${x.toPrecision(4)}: ${d.toExponential(1)}`); }
      ties++; } }
  const find = (lab, a, b) => { const br = B.find(x => x.labs.includes(lab[0]) && x.labs.includes(lab[1])); return br && br.examples.find(e => e.a === a && e.b === b); };
  const vol = find(['gauss3', 'red'], 'gauss3.volume_fraction', 'red.ball_volume'), flux = find(['gauss3', 'red'], 'gauss3.flux_fraction', 'red.observed_fraction'),
    area = find(['mimg', 'red'], 'mimg.angular_diameter_distance', 'red.boundary_area'), tol = find(['cosmo', 'sbright'], 'cosmo.scale_factor', 'sbright.dimming'), bell = find(['bell', 'spin'], 'bell.correlation', 'spin.bloch_z');
  const named = vol && vol.closed_form === '2·π²' && Math.abs(vol.constant - 2 * Math.PI ** 2) < 1e-9 && flux && flux.law === 'affine' && Math.abs(flux.constant + 1) < 1e-12 && Math.abs(flux.offset - 1) < 1e-12
    && area && area.law === 'power' && area.q === '2' && area.closed_form === '4·π' && tol && tol.law === 'power' && tol.q === '4' && Math.abs(tol.constant - 1) < 1e-12 && bell && Math.abs(bell.constant + 1) < 1e-12;
  check(B.length >= 5 && ties >= 15 && !bad.length && named, 'every bridge holds at nine fresh points of the shared input, in the laboratories’ own code with the engine’s defaults for everything else — and the identities it names are the ones geometry and physics give: the volume of a geodesic ball of the unit S³ is 2π² times the volume fraction of the Gauss laboratory, whose flux fraction is one minus it (the compensating background of a closed universe); a geodesic sphere’s area is 4π times the square of the mirage laboratory’s angular-diameter distance; the Tolman surface-brightness dimming is a⁴; the Bell singlet correlation is minus the Bloch z of the spin',
    `${B.length} bridges, ${ties} ties, ${pts} fresh points · worst ${worst.toExponential(1)} · ball = ${vol ? vol.closed_form : '?'} × fraction · area = ${area ? area.closed_form : '?'} × d_A^${area ? area.q : '?'} · Tolman a^${tol ? tol.q : '?'} · Bell × ${bell ? bell.constant : '?'}${bad.length ? ' · off ' + bad.slice(0, 3).join(' | ') : ''}`); }

/* the exact tail: Σ C(K, i) C(N − K, n − i) / C(N, n) in BigInt, scaled to 10⁻³⁰ */
const bc = (n, k) => { if (k < 0 || k > n) return 0n; k = Math.min(k, n - k); let r = 1n; for (let i = 1; i <= k; i++) r = r * BigInt(n - k + i) / BigInt(i); return r; };
const exactTail = (N, K, n, k) => { let s = 0n; for (let i = Math.max(k, 0); i <= Math.min(n, K); i++) s += bc(K, i) * bc(N - K, n - i); const SC = 10n ** 30n; return Number(s * SC / bc(N, n)) / 1e30; };
const pageMath = (() => { const a = src.indexOf('/* ═══ MLW-MATH-BEGIN'), b = src.indexOf('/* ═══ MLW-MATH-END'); return new Function(src.slice(a, b) + ';return {mlwHyperTail, mlwEnrichment};')(); })();
{ const typed = CORE.connections({ kind: 'typed' }).connections, declared = new Set(typed.filter(c => c.from !== c.to).map(c => key(c.from, c.to))), labs = new Set(J.labs.map(l => l.id));
  const here = [...declared].filter(k => { const [a, b] = k.split('|'); return labs.has(a) && labs.has(b); }).sort(), N = labs.size * (labs.size - 1) / 2;
  const flagsOk = J.links.every(l => l.declared === declared.has(key(l.a, l.b))) && JSON.stringify(here) === JSON.stringify(J.declared);
  const rows = []; let ok = flagsOk && J.validation.all_pairs === N && J.validation.declared_pairs === here.length;
  for (const d of ['exponent', 'form', 'constant', 'shape', 'bridge', 'any']) { const L = J.links.filter(l => d === 'any' || l.detectors[d]), k = L.filter(l => l.declared).length, v = J.validation[d];
    const ex = exactTail(N, here.length, L.length, k), pg = pageMath.mlwHyperTail(N, here.length, L.length, k), rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
    const good = v.pairs === L.length && v.declared === k && rel(pg, ex) < 1e-9 && rel(v.p_value, ex) < 1e-9 && Math.abs(v.lift - (k / L.length) / (here.length / N)) < 1e-3; ok = ok && good;
    rows.push(`${d} ${L.length}/${k} ×${v.lift} p ${ex.toExponential(2)}${good ? '' : ' ✗'}`); }
  const trustOk = ['exponent', 'form', 'shape'].every(d => J.trusted_detectors.includes(d) === (J.validation[d].p_value < 0.01));
  check(ok && trustOk && J.validation.any.p_value < 1e-3 && J.validation.any.lift > 1.5, 'the agreement with what was declared by hand, recomputed: which ties are declared is read again from the core’s typed relations; the base rate, each detector’s lift and its hypergeometric tail are computed again — the tail exactly, as a ratio of BigInt binomials — and the page’s own function agrees with it to 10⁻⁹; a detector that does not beat chance (p ≥ 0.01) is the one that does not rank candidates',
    `base ${here.length}/${N} = ${(100 * here.length / N).toFixed(2)} % · ${rows.join(' · ')} · trusted ${J.trusted_detectors.join(', ')}`); }

{ const labs = J.labs.map(l => l.id), nb = new Map(labs.map(l => [l, new Set()])); for (const k of J.declared) { const [a, b] = k.split('|'); nb.get(a).add(b); nb.get(b).add(a); }
  const dset = new Set(J.declared), aa = (u, v) => { let s = 0; for (const w of nb.get(u)) if (w !== v && nb.get(v).has(w)) { const d = nb.get(w).size; if (d > 1) s += 1 / Math.log(d); } return s; };
  const ne = []; for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++) if (!dset.has(key(labs[i], labs[j]))) ne.push(aa(labs[i], labs[j])); ne.sort((a, b) => a - b);
  let tot = 0; for (const k of J.declared) { const [u, v] = k.split('|'); nb.get(u).delete(v); nb.get(v).delete(u); const s = aa(u, v); nb.get(u).add(v); nb.get(v).add(u);
    let lt = 0, eq = 0; for (const x of ne) { if (x < s) lt++; else if (x === s) eq++; } tot += (lt + 0.5 * eq) / ne.length; }
  const auc = tot / J.declared.length;
  check(Math.abs(auc - J.link_prediction.auc_leave_one_out) < 1e-3 && auc > 0.7, 'the declared graph predicts its own missing links: each declared edge is left out in turn and its Adamic–Adar score ranked against every undeclared pair — recomputed here, the area under the curve agrees with the file; each candidate carries the same rank as a second, independent witness',
    `AUC ${auc.toFixed(4)} (file ${J.link_prediction.auc_leave_one_out}) over ${J.declared.length} declared edges and ${ne.length} undeclared pairs`); }

{ const phi = (1 + Math.sqrt(5)) / 2, az = run('anyzoo', {}), an = run('anyon', {}), qc = run('qcrys', {}), bh = run('bhr', {}), le = run('lens', {});
  const fin = (o, rx) => Object.entries(o).filter(([k, v]) => rx.test(k) && typeof v === 'number').map(([k, v]) => v);
  const D = Math.sqrt(Math.sqrt(5) * phi), dz = fin(az, /total_quantum_dimension/), da = fin(an, /^D_total$/), dt = fin(an, /^d_tau$/), gr = fin(qc, /^golden_ratio$/);
  const consts = J.classes.filter(c => c.detector === 'constant'), irr = consts.every(c => !/^keeps [−-]?\d+(\/\d+)?$/.test(c.label));
  const dens = J.exponent_denominators, maxDen = Math.max(...Object.keys(dens).filter(k => k !== 'irrational').map(Number));
  const ok = Math.abs(D - Math.sqrt(2 + phi)) < 1e-15 && dz.length && da.length && Math.abs(dz[0] - D) < 1e-12 && Math.abs(da[0] - D) < 1e-12 && dt.length && gr.length && Math.abs(dt[0] - phi) < 1e-12 && Math.abs(gr[0] - phi) < 1e-12
    && irr && consts.length >= 3 && maxDen <= 4 && src.includes('every rational exponent in the atlas has a denominator of at most four');
  check(ok, 'the constants it binds are the same irrational numbers computed twice: the Fibonacci-anyon total quantum dimension √(√5·φ) = √(2 + φ) in the anyon zoo and in the anyon instrument of the Hopf laboratory; the quantum dimension d_τ = φ there and the inflation factor φ of the quasicrystal — the fusion rule τ × τ = 1 + τ and the substitution a → ab, b → a share one matrix; and among every exact power law of the atlas no exponent has a denominator above four, though twelve were allowed',
    `D = ${dz[0]} = ${da[0]} = √(2 + φ) · d_τ = ${dt[0]} · qcrys φ = ${gr[0]} · ${consts.length} constant classes, all irrational · denominators ${Object.entries(dens).map(([k, v]) => k + ':' + v).join(' ')}`); }

{ const miss = ["{id:'metalaws', category:'inv'", "id:'metalaws', world:'s3', lab:'metalaws'", "mlwGroup.visible = (v==='metalaws');", "if(v==='metalaws'&&!mlwObjs){ mlwSetup(); }", "else if(V==='metalaws') body = mlwPanelHTML();",
    "if(V==='metalaws'){ mlwBind(ctl); }", "} else if(state.s3view==='metalaws'){", "metalaws:{speed:['mlwSpeed',1], pause:['mlwPaused','p']},", "['mlwAtlas','metalaws',mlwGroup,", "()=>goLab('s3','metalaws')", "fetch('api/metalaws.json'",
    "globalThis.HCC_METALAWS=Object.freeze({", "{id:'metalaws434', kind:'found'", "metalaws:'./api/metalaws.json'"].filter(s => !src.includes(s) && !fs.readFileSync(path.join(ROOT, 'scripts/build-api.mjs'), 'utf8').includes(s));
  const v = J.validation, r = M.INSTRUMENTS.metalaws({}), E = pageMath.mlwEnrichment(v.all_pairs, v.declared_pairs, v.any.pairs, v.any.declared);
  const inst = Math.abs(r.lift - v.any.lift) < 1e-3 && Math.abs(r.p_value - v.any.p_value) / v.any.p_value < 1e-9 && Math.abs(E.p - r.p_value) < 1e-15 * Math.max(1, r.p_value) + 1e-300;
  const pos = new Map(J.labs.map(l => [l.id, l.xyz])), dist = (a, b) => Math.hypot(...[0, 1, 2].map(q => pos.get(a)[q] - pos.get(b)[q])), mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  const all = []; for (const a of J.labs) for (const b of J.labs) if (a.id < b.id) all.push(dist(a.id, b.id)); const linked = mean(J.links.map(l => dist(l.a, l.b))), rnd = mean(all);
  check(!miss.length && inst && linked < 0.75 * rnd, 'the laboratory is in the page and its instrument tells the truth about the file: declared, registered, shown, set up, given a panel, ticked, listed among the laboratories and the trips, reading api/metalaws.json lazily, with an agent handle; at its defaults the instrument returns the lift and the hypergeometric tail of all five detectors together, the same as the file to nine digits; and in the layout, laboratories that share a law are nearer than random pairs',
    `instrument at defaults: lift ${r.lift.toFixed(3)}, p ${r.p_value.toExponential(3)} (file ×${v.any.lift}, ${v.any.p_value.toExponential(3)}) · mean distance tied ${linked.toFixed(3)} vs all ${rnd.toFixed(3)}${miss.length ? ' · missing ' + miss.join(' | ') : ''}`); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
