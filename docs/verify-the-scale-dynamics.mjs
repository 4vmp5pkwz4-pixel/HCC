/* verify-the-scale-dynamics.mjs — the Scale Dynamics Observatory (Scale Nexus Frontier II, items 26–30)
   What is checked:
     1. provenance: the NASA snapshot's hash, and the planet and host selections recomputed here from the raw CSV;
     2. the embedded data block is what the JSON gives (no stale or hand-edited embed);
     3. the method on synthetic populations with KNOWN answers: the broken power law recovers its breaks and slopes, the
        effective-variance slope is unbiased with errors in both coordinates where ordinary least squares is not, and
        the bootstrap interval covers the truth;
     4. the page's live kernel reproduces the offline local slopes from the embedded data, to the rounding of the table;
     5. the invariant I_S is constant along R ∝ M^S to rounding, equals S·[(p+1) log C + (p−1) log Q], and the Lean
        theorem it rests on is in the audited build with standard axioms only;
     6. the model curves: Chen & Kipping continuous at its transitions with the slopes transcribed; the Nauenberg curve's
        slope → −1/3 at low mass and matches its analytic derivative;
     7. what the data say about the literature, stated as found: the upper break's interval contains Chen & Kipping's
        131.6 M⊕, the lower one's does not contain their 2.04 M⊕;
     8. the four layers are tagged everywhere they are shown, white dwarfs and neutron stars are not fitted, and the
        export carries data, uncertainties, covariances, sources and certificates;
     9. the wiring: declared, registered, runnable without a browser, NOT linked into the Scale Nexus's mass and radius, routable
        publications, read back by FBS3R, Nexus relations, Multiview, map census, trips, translations.
   NOT checked: that any slope is a law of nature. Each summarises a sample with its selection. */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import { evFit, bestHinge, hingeRefine, localSlopes, rng } from '../scripts/scale-dynamics.mjs';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8'), src = rd('index.html');
let pass = 0, fail = 0, cases = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const J = JSON.parse(rd('data/scale-nexus/scale-dynamics.json'));
const block = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b); if (i < 0 || j < i) throw new Error('missing block ' + a); return src.slice(i, j); };
const REG = block('const HCC_CONSTANTS=', '/* the SI values the reference implementation uses');
const DATA = block('/* ═══ SDO-DATA-BEGIN', '/* ═══ SDO-DATA-END'), MATH = block('/* ═══ SDO-MATH-BEGIN', '/* ═══ SDO-MATH-END');
const K = new Function(REG + DATA + MATH + ';return {HCC_K, SDO_DATA, sdoLocal, sdoInvariant, sdoLogC, sdoLogQ, sdoCKLr, sdoCKSlope, sdoWDLr, sdoBrokenLr, sdoEvFit, sdoAutoPop, SDO_LME, SDO_LMS};')();
const gauss = r => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

/* 1 — provenance */
{ const sha = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'data/scale-nexus/raw/pscomppars.csv'))).digest('hex');
  const man = JSON.parse(rd('data/scale-nexus/raw/MANIFEST.json')), manSha = JSON.stringify(man).match(/9c23cd1c[0-9a-f]{56}/);
  const lines = rd('data/scale-nexus/raw/pscomppars.csv').trim().split(/\r?\n/), head = lines[0].split(','), ix = k => head.indexOf(k);
  const split = l => { const o = []; let c = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === ',' && !q) { o.push(c); c = ''; } else c += ch; } o.push(c); return o; };
  let planets = 0; const hosts = new Set(); const num = x => x !== '' && Number.isFinite(+x);
  for (const l of lines.slice(1)) { const r = split(l), g = k => r[ix(k)];
    if (g('pl_bmassprov') === 'Mass' && +g('pl_rade') > 0 && +g('pl_bmasse') > 0 && ['pl_radeerr1', 'pl_radeerr2', 'pl_bmasseerr1', 'pl_bmasseerr2'].every(k => num(g(k))) && ['0', ''].includes(g('pl_radelim')) && ['0', ''].includes(g('pl_bmasselim'))) planets++;
    if (+g('st_mass') > 0 && +g('st_rad') > 0 && ['st_masserr1', 'st_masserr2', 'st_raderr1', 'st_raderr2'].every(k => num(g(k)))) hosts.add(g('hostname')); }
  check(sha === J.inputs.pscomppars.sha256 && manSha && manSha[0] === sha && planets === J.populations.planets.n && hosts.size === J.populations.hosts.n_all,
    'provenance: the committed NASA snapshot is the one the manifest and the results name, and the planet and host selections recomputed here from the raw CSV give the same counts',
    `sha256 ${sha.slice(0, 16)}… · planets with true masses ${planets} (results ${J.populations.planets.n}) · hosts with both errors ${hosts.size} (results ${J.populations.hosts.n_all}; ${J.populations.hosts.n} after the main-sequence cut)`); }

/* 2 — the embed is current */
{ const { execFileSync } = await import('node:child_process'); let out = '', ok = true;
  try { out = execFileSync(process.execPath, [path.join(ROOT, 'scripts/scale-dynamics-embed.mjs'), '--check'], { encoding: 'utf8' }); } catch (e) { ok = false; out = String(e.stdout || e.message); }
  check(ok && K.SDO_DATA.planets.lm.length === J.populations.planets.n && K.SDO_DATA.hosts.lm.length === J.populations.hosts.n,
    'the data block in the page is exactly what data/scale-nexus/scale-dynamics.json gives — no stale or hand-edited embed', `${out.trim()} · ${K.SDO_DATA.planets.lm.length} planets · ${K.SDO_DATA.hosts.lm.length} hosts`); }

/* 3 — the method on synthetic populations with known answers */
{ const r = rng(20261125), truth = { breaks: [0.9, 2.2], slopes: [0.30, 0.60, 0.00], c: 0.0, tau: 0.06 };
  const f = m => truth.c + truth.slopes[0] * m + (truth.slopes[1] - truth.slopes[0]) * Math.max(0, m - truth.breaks[0]) + (truth.slopes[2] - truth.slopes[1]) * Math.max(0, m - truth.breaks[1]);
  const P = []; for (let i = 0; i < 1500; i++) { const m = -0.5 + 4 * r(), sM = 0.02 + 0.12 * r(), sR = 0.01 + 0.04 * r(); P.push({ m: m + sM * gauss(r), lrE: f(m) + truth.tau * gauss(r) + sR * gauss(r), sM, sR, block: 'b' + i }); }
  const grid = []; for (let m = -0.5; m <= 3.6 + 1e-9; m += 0.2) grid.push(+m.toFixed(2));
  const fits = [0, 1, 2, 3].map(k => hingeRefine(P, bestHinge(P, k, grid))), best = fits.reduce((b, x, i) => x.bic < fits[b].bic ? i : b, 0), F = fits[best];
  const brkErr = best === 2 ? Math.max(...F.breaks.map((b, i) => Math.abs(b - truth.breaks[i]))) : Infinity, slErr = best === 2 ? Math.max(...F.slopes.map((s, i) => Math.abs(s - truth.slopes[i]))) : Infinity;
  /* errors in both coordinates: effective variance against ordinary least squares, one segment, 200 replicates */
  let evBias = 0, olsBias = 0, cover = 0; const R = 200, S0 = 0.5;
  for (let k = 0; k < R; k++) { const Q = []; for (let i = 0; i < 300; i++) { const x = 2 * r() - 1, sM = 0.25, sR = 0.05; Q.push({ lm: x + sM * gauss(r), lr: S0 * x + 0.05 * gauss(r) + sR * gauss(r), sM, sR }); }
    const e = evFit(Q, 'lm', 'lr', 'sM', 'sR'); evBias += (e.S - S0) / R;
    let mx = 0, my = 0; for (const q of Q) { mx += q.lm / Q.length; my += q.lr / Q.length; } let sxy = 0, sxx = 0; for (const q of Q) { sxy += (q.lm - mx) * (q.lr - my); sxx += (q.lm - mx) ** 2; } olsBias += (sxy / sxx - S0) / R;
    if (Math.abs(e.S - S0) <= 1.96 * Math.sqrt(e.covFisher[1][1] + 0)) cover++; }
  cases += 1500 + R * 300;
  check(best === 2 && brkErr < 0.2 && slErr < 0.06 && Math.abs(evBias) < 0.02 && olsBias < -0.05 && cover / R > 0.85,
    'the method on synthetic populations with known answers: BIC picks the true number of breaks among 0–3 and the broken power law recovers them; with errors in both coordinates the effective-variance slope is unbiased while ordinary least squares is attenuated, and its Fisher interval covers the truth (somewhat under 95 %, because it treats τ as known — the offline tables use the block bootstrap instead)',
    `BIC by breaks ${fits.map(x => x.bic.toFixed(1)).join(' · ')} → ${best} · breaks ${F.breaks.map(b => b.toFixed(2)).join(', ')} (true 0.9, 2.2) · slopes ${F.slopes.map(s => s.toFixed(3)).join(', ')} (true 0.30, 0.60, 0.00) · mean slope error: effective variance ${evBias.toFixed(4)}, OLS ${olsBias.toFixed(4)} · 95 % coverage ${(100 * cover / R).toFixed(0)} %`); }

/* 4 — the page kernel reproduces the offline windows */
{ let worst = 0, worstA = 0, n = 0;
  for (const name of ['planets', 'hosts']) { const T = J.local_slopes[name]; for (const row of T.rows) { const L = K.sdoLocal(name, row.logM, T.window_dex); if (!L.ok) { worst = Infinity; continue; } n++;
    worst = Math.max(worst, Math.abs(L.S - row.S) / row.sigmaS); worstA = Math.max(worstA, Math.abs(L.lrC - row.intercept_logR)); } }
  cases += n;
  check(worst < 1e-3 && worstA < 1e-4, 'the page’s live kernel fits the same numbers as the offline script (both round every log value to 10⁻⁴ dex once) and reproduces every offline local slope to 10⁻³ of its bootstrap error and every fitted radius to 10⁻⁴ dex — the residue is the rounding of the stored table',
    `${n} windows · worst |ΔS|/σ_S ${worst.toExponential(2)} · worst |Δ log R| ${worstA.toExponential(2)}`); }

/* 5 — the invariant is an identity, certified */
{ const r = rng(5); let worst = 0, worstP = 0;
  for (let i = 0; i < 20000; i++) { const S = (r() - 0.5) * 4, lm = 20 + 12 * r(), lr = 3 + 7 * r(), d = (r() - 0.5) * 6;
    worst = Math.max(worst, Math.abs(K.sdoInvariant(lm + d, lr + S * d, S) - K.sdoInvariant(lm, lr, S)));
    if (Math.abs(S) > 0.05) { const p = 1 / S; worstP = Math.max(worstP, Math.abs(K.sdoInvariant(lm, lr, S) - S * ((p + 1) * K.sdoLogC(lm, lr) + (p - 1) * K.sdoLogQ(lm, lr)))); } }
  const ax = rd('lean/scale-nexus/axioms.txt'), line = ax.split('\n').find(l => l.includes("'HCC.ScaleNexus.dilation_invariant'")) || '';
  const certs = J.proof_certificates.theorems, allStd = certs.every(c => /^\[propext, Classical\.choice, Quot\.sound\]$/.test(c.axioms) && ax.includes(`'${c.theorem}'`));
  const olean = [...rd('lean/scale-nexus/build.log').matchAll(/([0-9a-f]{64})\s+\S*\/(\w+)\.olean/g)].map(m => [m[2], m[1]]), oleanOK = olean.every(([k, h]) => J.proof_certificates.lean.olean_sha256[k] === h);
  cases += 20000;
  check(worst < 1e-9 && worstP < 1e-9 && /\[propext, Classical\.choice, Quot\.sound\]$/.test(line) && allStd && oleanOK && olean.length === 2,
    'the invariant I_S = (1+S) log C + (1−S) log Q is constant along R ∝ M^S and equals S·[(p+1) log C + (p−1) log Q] with p = 1/S — HCC.ScaleNexus.dilation_invariant, in the audited build with standard axioms; every certificate in the export names a theorem of that build and its olean hashes',
    `20000 random tracks · worst drift ${worst.toExponential(1)} · worst against the Lean form ${worstP.toExponential(1)} · ${certs.length} certificates · olean ${olean.map(([k, h]) => k + ' ' + h.slice(0, 12)).join(' · ')}`); }

/* 6 — the model curves */
{ const C = K.SDO_DATA.ck, lme = K.SDO_LME, jumps = C.t.map(t => Math.abs(K.sdoCKLr(lme + Math.log10(t) + 1e-9) - K.sdoCKLr(lme + Math.log10(t) - 1e-9)));
  const slopesOK = [0.279, 0.589, -0.044, 0.881].every((v, i) => C.slopes[i] === v) && C.t[0] === 2.04 && Math.abs(C.t[1] - 131.58) < 0.01 && Math.abs(C.t[2] - 26635.68) < 0.01;
  const num = lm => (K.sdoCKLr(lm + 1e-5) - K.sdoCKLr(lm - 1e-5)) / 2e-5, segOK = [-1, 1, 3, 6].every((m, k) => Math.abs(num(lme + m) - C.slopes[k]) < 1e-6);
  const W = J.white_dwarf_model.local_S, mch = 5.816 / 4, an = lmK => { const q = Math.pow(10, lmK - K.SDO_LMS) / mch, q43 = Math.pow(q, 4 / 3); return -1 / 3 - (2 / 3) * q43 / (1 - q43); };
  let wdWorst = 0; for (const w of W.slice(0, -4)) wdWorst = Math.max(wdWorst, Math.abs(w.S - an(w.logM)) / Math.abs(an(w.logM)));
  check(Math.max(...jumps) < 1e-8 && slopesOK && segOK && Math.abs(W[0].S + 1 / 3) < 0.03 && wdWorst < 0.03,
    'the model curves are what they claim: Chen & Kipping 2017 continuous at its three transitions with the slopes 0.279, 0.589, −0.044, 0.881 as transcribed; the Nauenberg white-dwarf curve has slope → −1/3 at low mass and follows d ln R / d ln M = −1/3 − (2/3)q^{4/3}/(1 − q^{4/3})',
    `jumps ${Math.max(...jumps).toExponential(1)} · transitions ${C.t.join(', ')} M⊕ · WD slope at ${Math.pow(10, W[0].logM - K.SDO_LMS).toFixed(2)} M☉: ${W[0].S} · worst relative error against the derivative ${wdWorst.toExponential(2)}`); }

/* 7 — the data against the literature, as found */
{ const B = J.planets_broken_power_law, ch = B.models[B.chosen_by_bic], ci = B.breaks_bootstrap.ci95.map(c => c.map(x => Math.pow(10, x)));
  const upper = ci[ci.length - 1], lower = ci[0], contains = (c, v) => v >= c[0] && v <= c[1];
  const led = src.slice(src.indexOf("{id:'scaledyn442'"), src.indexOf("{id:'scalenexus441'"));
  const stated = /agrees with the Neptunian→Jovian transition/.test(led) && /which is not their 2\.04 M⊕/.test(led);
  check(B.chosen_by_bic === 2 && contains(upper, 131.58) && !contains(lower, 2.04) && stated,
    'what this sample says about the literature, stated as found: BIC chooses two breaks; the upper break’s 95 % interval contains Chen & Kipping’s Neptunian→Jovian 131.6 M⊕, the lower one’s does not contain their 2.04 M⊕ — and the ledger says exactly that',
    `BIC 0–3 breaks ${B.models.map(m => m.bic.toFixed(1)).join(' · ')} · breaks ${ch.breaks_log10_Mearth.map(b => Math.pow(10, b).toFixed(1)).join(', ')} M⊕ · intervals ${ci.map(c => `[${c[0].toFixed(1)}, ${c[1].toFixed(1)}]`).join(', ')} · slopes ${ch.slopes_S.join(', ')}`); }

/* 8 — layers, what is not fitted, the export */
{ const lab = block('/* ══ THE SCALE DYNAMICS OBSERVATORY', '/* ── THE SCALE NEXUS INSIDE FBS3R');
  const tags = ['measured', 'model', 'identity', 'hypothetical'].every(t => new RegExp(`sdoTag\\('${t}'\\)`).test(lab)) && ['measured', 'model', 'identity', 'hypothetical'].every(t => J.layers[t] && J.layers[t].length);
  const notFitted = !J.local_slopes.white_dwarfs && !J.local_slopes.neutron_stars && Object.keys(J.local_slopes).join() === 'planets,hosts';
  const exp = /schema:'hcc\.scale-dynamics\/1'/.test(lab) && /covariance_intercept_slope/.test(lab) && /proof_certificates/.test(lab) && /sources:/.test(lab) && J.populations.planets.columns.includes('sigma_lm_down');
  const hostsCaveat = /model-derived/.test(J.populations.hosts.caveat) && /stellar models/.test(lab);
  check(tags && notFitted && exp && hostsCaveat && /NOT CLAIMED/.test(lab),
    'the four layers are tagged wherever numbers are shown and in the results; white dwarfs and neutron stars are shown, not fitted; the export carries the window, its covariance, the families, the models, the sources and the certificates; the full table keeps asymmetric errors; the host stars are flagged as model-derived; the panel says what is not claimed',
    `tags ${tags} · fitted populations ${Object.keys(J.local_slopes).join(', ')} · export ${exp} · host caveat ${hostsCaveat}`); }

/* 9 — the wiring */
{ const I = await import(path.join(ROOT, 'core/atlas/instruments.mjs')), run = I.INSTRUMENTS && I.INSTRUMENTS.scaledyn;
  const out = run ? run({ scaledyn_mass: 2.9861e25, scaledyn_window: 0.6 }) : null;
  const decl = src.match(/hccApiRegister\(\{\n  id:'scaledyn'[\s\S]*?\n\}\); \}catch\(e\)\{ console\.warn\('scaledyn contract'/);
  const outs = decl ? [...decl[0].matchAll(/\{name:'(scaledyn_\w+)', unit:'([^']+)'/g)].filter(m => !/_mass'|_window'/.test(m[0]) || /mass_center/.test(m[1])).map(m => [m[1], m[2]]) : [];
  const pubs = [...src.matchAll(/ATLAS_BUS\.pub\('scaledyn\.(scaledyn_\w+)',[^;]*?,'([^']+)'\)/g)].map(m => [m[1], m[2]]);
  const routable = pubs.length >= 6 && pubs.every(([n, u]) => outs.some(([o, ou]) => o === n && ou === u));
  const reads = pubs.every(([n]) => src.includes(`g('scaledyn.${n}')`));
  /* a population fit at a window centre is not a body: it must not drive the Scale Nexus's mass or radius (that verifier's invariant) */
  const links = !/L\('scaledyn\.[a-z_]+','scalenexus\.scalenexus_(mass|radius)'\)/.test(src) && /THE OBSERVATORY IS NOT WIRED INTO THE SCALE NEXUS/.test(src);
  const wired = [/\{id:'scaledyn', category:'inv'/, /\n  scaledyn:\{\n    native_space:/, /\{id:'scaledyn442', kind:'found'/, /v==='scaledyn'\?\[/, /sdoGroup\.visible = \(v==='scaledyn'\);/, /if\(v==='scaledyn'&&!sdoObjs\)\{ sdoSetup\(\); \}/,
    /scaledyn:\{pause:\['sdoPaused','p'\]/, /else if\(V==='scaledyn'\) body = sdoPanelHTML\(\);/, /if\(V==='scaledyn'\)\{ sdoBind\(ctl\); \}/, /state\.s3view==='scaledyn'\)\{\n      fbsAnimT\+=labDt; updateSdo\(labDt\);/,
    /\['sdoAtlas','scaledyn',sdoGroup,/, /\n  scaledyn:'как масса/, /\n  scaledyn:'wie Masse/, /hccGo\(\{worldId:'s3',labId:'scaledyn'\}\)/, /goLab\('s3','scaledyn'\)/, /scaledyn:\{_:'world:fbs'\}/,
    /\['scaledyn','scalenexus','invariant'/, /The observatory is related to the Scale Nexus only/].map(re => re.test(src)) .concat([!/\['scaledyn','(wd|ladmeas)',/.test(src)]);
  const ja = fs.readdirSync(path.join(ROOT, 'data/i18n/ja')).some(f => /scale-dynamics/.test(f) && rd('data/i18n/ja/' + f).includes('The Scale Dynamics Observatory'));
  const quick = rd('scripts/run-quick-verifiers.mjs').split('docs/verify-the-scale-dynamics.mjs').length - 1 === 2;
  check(out && Number.isFinite(out.scaledyn_slope) && out.scaledyn_count > 100 && routable && reads && links && wired.every(Boolean) && ja && quick,
    'the wiring: declared, described, recorded in the ledger, set up, ticked, given a panel and a view, listed among the laboratories and the trips, related in the Nexus to the Scale Nexus only (two further relations left out, with the reason, because they move the atlas’s spectral seam), classified on the map; its instrument runs without a browser; every publication is a declared output with its unit and is read back by FBS3R; its fitted point is deliberately not routed into the Scale Nexus’s mass and radius (a fit is not a typed body); translated; and run by the quick verifier suite',
    `instrument at 5 M⊕: S ${out ? out.scaledyn_slope.toFixed(4) : '—'}, n ${out ? out.scaledyn_count : '—'} · publications ${pubs.length}, routable ${routable}, read by FBS3R ${reads} · no link into the Scale Nexus mass/radius ${links} · wiring ${wired.filter(Boolean).length}/${wired.length} · ja ${ja} · quick suite ${quick}`); }

console.log(`\n${pass} passed, ${fail} failed · ${cases} deterministic cases`);
process.exit(fail ? 1 : 0);
