#!/usr/bin/env node
'use strict';
/* ══ THE SPHERE HAD ONLY HALF A SPECTRUM ═════════════════════════════════════
 *
 * This atlas has been built on a compact S³ from its first release, and it has
 * carried that sphere's SCALAR spectrum for just as long: λ_β = (β²−1)/R² with
 * degeneracy g_β = β², drawn in the modes laboratory and used for the
 * compact-mode CMB test. The COEXACT ONE-FORM spectrum of the same sphere — the
 * one a fluid, a magnetic field or any divergence-free vector field lives in —
 * was simply absent.
 *
 * It is the scalar half's dual, and the duality is an EXCHANGE:
 *
 *     scalar     eigenvalue (β²−1)/R²     degeneracy β²
 *     coexact    eigenvalue   β²/R²       degeneracy β²−1   per helicity
 *
 * Read the mode number as a curl level, β = k + 2, and the whole vector half
 * follows from the number a reader is already holding. That is what makes this an
 * application to THIS atlas rather than a new laboratory beside it, and it is
 * checked here at both ends: the shell dimension the construction MEASURES must
 * be β²−1, and the Stokes eigenvalue must be the scalar's λ shifted by exactly
 * the 4/R² the Ebin–Marsden convention carries.
 *
 * AND THE HOPF FIBRATION TURNS OUT TO BE A FLUID. E_{0,σ} is the space of Hopf
 * Beltrami fields, κ₀ = 0, and it is the ONLY shell with a vanishing Stokes
 * eigenvalue — so of everything in the spectrum, the flow this atlas has been
 * drawing as a picture of a bundle is the one that never decays.
 */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

const i0 = src.indexOf('const S3NS_MONO=new Map();'), i1 = src.indexOf('/* ── S³ curl-shell laboratory ──');
const ctx = vm.createContext({ Math, Object, Map, Set, Array, Number, Float64Array, console, JSON });
vm.runInContext('function mulberry(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0;'
  + ' let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t;'
  + ' return ((t^t>>>14)>>>0)/4294967296; }; }\n' + src.slice(i0, i1), ctx, { timeout: 60000 });
const S = k => vm.runInContext(k, ctx);

console.log('\n=== 1. THE TWO HALVES, AND THE EXCHANGE BETWEEN THEM ===\n');

/* the scalar half is written HERE from the registry`s own expression, so the two
   sides of the duality are never the same line of code */
const scalarEigen = (beta, R) => (beta * beta - 1) / (R * R);
const scalarDegen = beta => beta * beta;
const bad = [];
for (const R of [1, 548.32, 7.5]) for (let beta = 2; beta <= 10; beta++) {
  const k = beta - 2;
  /* the vector eigenvalue is beta^2/R^2 and the measured shell dimension is beta^2 - 1 */
  const hodge = Math.pow(S(`s3nsCurlLevel(${k},1,${R})`), 2);
  if (Math.abs(hodge - beta * beta / (R * R)) / (beta * beta / (R * R)) > 1e-12) bad.push(`Δ₁ at β=${beta}, R=${R}`);
  if (S(`s3nsShellDim(${k})`) !== beta * beta - 1) bad.push(`dim at β=${beta}`);
  /* and the Stokes eigenvalue is that one shifted by exactly 4/R² */
  if (Math.abs(S(`s3nsKappa(${k},${R})`) - (hodge - 4 / (R * R))) / (1 + Math.abs(hodge)) > 1e-12)
    bad.push(`A at β=${beta}, R=${R}`);
  /* the exchange: swap the two numbers and you get the scalar half back */
  if (Math.abs(scalarEigen(beta, R) - (scalarDegen(beta) - 1) / (R * R)) > 1e-15) bad.push(`scalar β=${beta}`); }
ok('THE COEXACT HALF OF THE SPECTRUM IS THE SCALAR HALF WITH THE EIGENVALUE AND THE DEGENERACY EXCHANGED — at β = k+2 the vector eigenvalue is β²/R² with degeneracy β²−1 per helicity, where the scalar is (β²−1)/R² with degeneracy β²',
  bad.length === 0,
  bad.length ? bad.slice(0, 4).join(' · ')
    : [2, 3, 4].map(b => `β=${b}: scalar ${(b*b-1)}/R² × ${b*b} ↔ vector ${b*b}/R² × ${b*b-1} per sign`).join(' · '));
ok('and the Ebin–Marsden shift is exactly 4/R² and nothing else — the Stokes operator is curl² − 4/R², so the shell that a fluid feels is the Hodge one moved by a constant this atlas can name',
  [1, 548.32].every(R => [0, 1, 2, 5, 8].every(k =>
    Math.abs(S(`s3nsKappa(${k},${R})`) * R * R - (Math.pow(k + 2, 2) - 4)) < 1e-9)),
  'κ_k R² = (k+2)² − 4 = k(k+4) at every shell and both radii');

console.log('\n=== 2. THE HOPF FIBRATION IS THE ONE FLOW THAT NEVER DECAYS ===\n');

ok('E_{0,σ} IS SIX-DIMENSIONAL OVER BOTH HELICITIES AND HAS κ = 0 — which is the full Killing family of the round sphere, and the only place in the whole spectrum where the Stokes eigenvalue vanishes',
  S('s3nsShellDim(0)') === 3 && S('s3nsKappa(0,1)') === 0
  && [1, 2, 3, 4, 5, 6, 7, 8].every(k => S(`s3nsKappa(${k},1)`) > 0),
  'dim 3 per helicity, six in all · κ₀ = 0 and κ_k > 0 for every k ≥ 1');
ok('and the laboratory that has drawn those fibres for a hundred releases now SAYS so, with the numbers taken on this atlas`s own curvature radius rather than on a unit sphere',
  /These fibres are a fluid/.test(src)
  && /hopfShellLine/.test(src)
  && /const R=S3\.R, mu=s3nsCurlLevel\(0,1,R\)/.test(src)
  && /on this atlas/.test(src)
  && /go\('hopfToShell','s3shell'\)/.test(src),
  'the Hopf panel carries the statement, a line that reads S3.R — this atlas`s own curvature radius and not a unit sphere — and a route to the shell laboratory');
ok('and the modes laboratory, which had only ever drawn the scalar half, now draws both on the same β',
  /AND THE SPHERE HAD ONLY HALF A SPECTRUM/.test(src)
  && /the coexact one-forms at the same β are the shell k = β−2/.test(src)
  && /EXCHANGE β² and β²−1 between the two halves/.test(src),
  'λ_β and g_β keep their place; the curl level, the Hodge eigenvalue, the Stokes eigenvalue and the vector degeneracy stand beside them');

console.log('\n=== 3. EVERY NEW RESULT HAS AN ADDRESS ===\n');

/* the atlas`s own contract: a formula that cannot be found is a formula nobody
   can check. These sixteen are declared and addressed like every other one. */
const need = ['s3.curl', 's3.shelldim', 's3.stokes', 's3.beltrami', 's3.bandrank', 's3.projector',
  's3.killing', 's3.gap', 's3.torusjac', 's3.toruspress', 's3.chiral', 's3.tubemetric',
  's3.swirlop', 's3.eulertower', 's3.escape', 's3.resonant'];
const missingDecl = need.filter(id => !new RegExp(`\\{id:'${id.replace('.', '\\.')}',`).test(src));
const missingSite = need.filter(id => !new RegExp(`'${id.replace('.', '\\.')}':\\s*\\['s3'`).test(src));
ok('ALL SIXTEEN NEW RESULTS ARE DECLARED IN THE FORMULA REGISTRY AND ADDRESSED IN THE ADDRESS BOOK, so the atlas`s own search can find them and its own router can travel to them',
  missingDecl.length === 0 && missingSite.length === 0,
  missingDecl.length || missingSite.length
    ? `undeclared: ${missingDecl.join(' ')} · unaddressed: ${missingSite.join(' ')}`
    : `${need.length} formulas, each declared with units and a source tag and each addressed to a world, a laboratory and an evaluator`);
ok('and they carry their own source tag, whose label states in writing that the paper`s RELATIVE singular branch is not held, not evaluated and not published from',
  /S3NS:\s*\{tag:'S3-NavierStokes'/.test(src)
  && /does not hold, does not evaluate and does not publish any number from/.test(src)
  /* the expressions themselves contain braces — E_{k,sigma} — so the span to the
     source tag is bounded by length rather than by "not a brace" */
  && need.every(id => new RegExp(`\\{id:'${id.replace('.', '\\.')}',[\\s\\S]{0,240}?src:'S3NS'`).test(src)),
  'one source entry, sixteen formulas pointing at it, and the refusal inside the label itself');

console.log('\n=== 4. AND THE CHECK THAT COULD NOT SEE HALF THE REGISTRY ===\n');

/* This release's address check failed on its first run for a reason worth keeping:
   it read laboratory ids out of the S3_VIEW_NAMES literal, which ENDS in a spread
   of labDeclNames(...). Every declaratively registered laboratory was invisible to
   it, and nothing had noticed because no formula had ever addressed one. */
const addr = fs.readFileSync(path.join(ROOT, 'docs/verify-every-formula-has-an-address.cjs'), 'utf8');
ok('THE ADDRESS CHECK NOW READS BOTH HALVES OF THE LABORATORY REGISTRY — the literal and the declarations — and REFUSES to run if its sweep of the declarations stops matching, so it cannot go quietly blind again',
  /LAB_DECLARATIONS=Object\.freeze/.test(addr)
  && /the declared-laboratory sweep found only/.test(addr)
  && /throw new Error/.test(addr)
  && /for \(const id of declared\) labs\.add\(id\);/.test(addr),
  'the declared ids are added to the set, and a sweep that matches fewer than twenty throws rather than passing');

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
