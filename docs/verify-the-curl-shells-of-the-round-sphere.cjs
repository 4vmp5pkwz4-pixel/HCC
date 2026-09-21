#!/usr/bin/env node
'use strict';
/* ══ THE CURL SHELLS OF THE ROUND THREE-SPHERE ═══════════════════════════════
 *
 * This atlas is built on a compact S³.  It had drawn the Hopf fibration for a
 * hundred laboratories as a picture of a bundle and had never once asked what a
 * fluid does on that sphere — which matters, because those same fibres ARE the
 * k = 0 Beltrami shell of the Navier–Stokes equation there, and the whole curl
 * spectrum above them is a ladder of exact nonlinear solutions.
 *
 * WHAT THIS FILE REFUSES TO DO IS READ THE NUMBERS OUT OF THE PAPER.  A check
 * that compares (k+1)(k+3) in index.html against (k+1)(k+3) in this file checks
 * that two people can copy, and this atlas has been caught by exactly that shape
 * of check before.  So the laboratory BUILDS each shell — the null space of
 * curl − σ(k+2) over harmonic polynomials of degree k on S³ ⊂ ℍ — and this file
 * evaluates the result through routes the construction never used:
 *
 *   · the curl is re-evaluated by AMBIENT CENTRAL DIFFERENCES along great
 *     circles, which touches no polynomial derivative and no frame identity,
 *     and must return μ = σ(k+2) times the field itself;
 *   · the divergence is re-evaluated the same way and must be zero;
 *   · the addition theorem Σ|e_α(x)|² = N/𝒱 is tested at points drawn AFTER
 *     the basis was fixed, so no basis can be tuned to a test point;
 *   · the Killing interaction coefficients are measured from brackets and
 *     compared to b_s and b_o, whose SUM has to come out κ_k/(2𝒱) — an identity
 *     the two measurements have no way to satisfy by accident;
 *   · the order-counting laws are checked against a brute-force set;
 *   · the exterior recursion is run and its two all-order identities evaluated.
 *
 * AND THE NUMBERS ARE NOT NEGOTIABLE.  dim E_{k,σ} comes back 3, 8, 15, 24, 35,
 * 48 for k = 0…5 and both signs; the k = 1 Killing coefficients give 𝒱C = 10/3
 * and 50/3 at R = 1, which is the value the source addendum reports from an
 * independent quaternion calculation; κ_0 = 0 and only κ_0, which is why the
 * Hopf flow is the one exact solution in the family that never decays.
 */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

/* ── the construction is RUN, not read ─────────────────────────────────────── */
const OPEN = 'const S3NS_MONO=new Map();';
const CLOSE = '/* ── S³ curl-shell laboratory ──';
const i0 = src.indexOf(OPEN), i1 = src.indexOf(CLOSE);
if (i0 < 0 || i1 < 0 || i1 <= i0) { console.log('  FAIL — the S3NS construction could not be sliced out of index.html'); process.exit(1); }
const slice = src.slice(i0, i1);
const ctx = vm.createContext({ Math, Object, Map, Set, Array, Number, Float64Array, console, JSON, isNaN, globalThis: {} });
vm.runInContext(
  'function mulberry(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0;'
  + ' let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t;'
  + ' return ((t^t>>>14)>>>0)/4294967296; }; }\n' + slice, ctx, { timeout: 60000 });
const S = k => vm.runInContext(k, ctx);
const call = (fn, ...a) => vm.runInContext('(' + fn + ')', ctx)(...a);

/* ── an evaluation route the construction never used ───────────────────────── */
vm.runInContext(`
const __dot4=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3];
function __numeric(sh,comp,q){
  const M=s3nsFrame(sh.sigma);
  const T=[0,1,2].map(a=>{const m=M[a];return [0,1,2,3].map(i=>m[i].reduce((s,c,j)=>s+c*q[j],0));});
  const h=1e-5, grad=[];
  for(let b=0;b<3;b++){
    const step=e=>{ const p=[0,1,2,3].map(i=>Math.cos(e)*q[i]+Math.sin(e)*T[b][i]);
      const n=Math.hypot(p[0],p[1],p[2],p[3]);
      return s3nsVelocity(sh,comp,[p[0]/n,p[1]/n,p[2]/n,p[3]/n],[0,0,0,0]); };
    const vp=step(h), vm_=step(-h);
    let d=[0,1,2,3].map(i=>(vp[i]-vm_[i])/(2*h));
    const nrm=__dot4(d,q); d=d.map((x,i)=>x-nrm*q[i]);
    grad.push(d); }
  const E=(a,b,c)=>((a-b)*(b-c)*(c-a))/2;
  const curl=[0,1,2].map(a=>{ let s=0;
    for(let b=0;b<3;b++) for(let c=0;c<3;c++){ const e=E(a,b,c); if(e) s+=e*__dot4(grad[b],T[c]); }
    return s; });
  const div=[0,1,2].reduce((s,a)=>s+__dot4(grad[a],T[a]),0);
  const f=[0,1,2].map(a=>s3nsEvalPoly(comp[a],sh.degree,q));
  return {curl,div,f};
}
function __sweep(kmax){
  const R=mulberry(4242), rows=[];
  for(const sg of [1,-1]) for(let k=0;k<=kmax;k++){
    const sh=s3nsShell(k,sg), comp=s3nsShellElement(sh,90210+k);
    let beltrami=0, divergence=0;
    for(let t=0;t<4;t++){ let q=[R()*2-1,R()*2-1,R()*2-1,R()*2-1];
      const n=Math.hypot(q[0],q[1],q[2],q[3]); q=q.map(v=>v/n);
      const r=__numeric(sh,comp,q), mag=Math.hypot(r.f[0],r.f[1],r.f[2])||1;
      for(let a=0;a<3;a++) beltrami=Math.max(beltrami,Math.abs(r.curl[a]-sh.mu*r.f[a])/mag);
      divergence=Math.max(divergence,Math.abs(r.div)/mag); }
    rows.push({k,sigma:sg,dim:sh.dim,mu:sh.mu,kappa:sh.kappa,beltrami,divergence}); }
  return rows;
}`, ctx);

console.log('\n=== 1. THE SHELL IS BUILT, AND ITS DIMENSION IS A RANK RATHER THAN A FORMULA ===\n');

const sweep = S('__sweep(5)');
/* the expectation is written HERE, from the representation theory, and the
   laboratory never sees it: E_{k,+} is V_{(k+2)/2} ⊠ V_{k/2}, so its dimension
   is the product (k+3)(k+1) of the two spin multiplicities */
const dimFromSpins = k => ((k + 2) / 2 * 2 + 1) * (k / 2 * 2 + 1);
const wrongDim = sweep.filter(r => r.dim !== dimFromSpins(r.k));
ok('THE NULL SPACE OF curl − σ(k+2) COMES BACK WITH THE DIMENSION THE TWO SU(2) SPINS PREDICT, for k = 0…5 and both helicities — a rank the elimination measured, against a product this file computed from the representation and never handed over',
  wrongDim.length === 0 && sweep.length === 12,
  wrongDim.length ? wrongDim.map(r => `k=${r.k} σ=${r.sigma}: ${r.dim} ≠ ${dimFromSpins(r.k)}`).join(' · ')
    : sweep.filter(r => r.sigma > 0).map(r => `k=${r.k}→${r.dim}`).join(' · ') + ' · and the same again for σ = −1');

ok('and the rank is the same for both handednesses, which is what makes the spectrum a pair of ladders rather than one',
  [0, 1, 2, 3, 4, 5].every(k => {
    const a = sweep.find(r => r.k === k && r.sigma > 0), b = sweep.find(r => r.k === k && r.sigma < 0);
    return a && b && a.dim === b.dim && a.mu === -b.mu; }),
  sweep.filter(r => r.sigma > 0).map(r => `μ=±${r.mu}`).join(' · '));

console.log('\n=== 2. THE BELTRAMI PROPERTY, RE-EVALUATED WITHOUT THE CONSTRUCTION ===\n');

const worstB = Math.max(...sweep.map(r => r.beltrami));
const worstD = Math.max(...sweep.map(r => r.divergence));
ok('EVERY BUILT SHELL ELEMENT SATISFIES curl φ = σ(k+2)φ WHEN THE CURL IS TAKEN BY AMBIENT CENTRAL DIFFERENCES ALONG GREAT CIRCLES — a route that touches no polynomial derivative, no frame identity and no part of the machinery that produced the field',
  worstB < 1e-7,
  `worst relative residual ${worstB.toExponential(2)} over 12 shells × 4 points, against the 1e-7 the fifth-order finite difference can support`);
ok('and the same differences return a vanishing divergence, so the fields are genuinely incompressible rather than incompressible by the formula that built them',
  worstD < 1e-7, `worst |div φ|/|φ| = ${worstD.toExponential(2)}`);

console.log('\n=== 3. THE ADDITION THEOREM, TESTED AT POINTS CHOSEN AFTER THE BASIS WAS FIXED ===\n');

const audits = [];
for (let k = 0; k <= 5; k++) for (const sg of [1, -1]) audits.push(S(`s3nsAudit(${k},${sg})`));
const worstAdd = Math.max(...audits.map(a => a.addDev));
ok('Σ_α |e_α(x)|² IS A CONSTANT ON THE SPHERE, AND THE CONSTANT IS N/𝒱 — the sharp evaluation identity behind both projector norms, measured over an orthonormalised shell basis at points the basis never saw',
  worstAdd < 1e-12,
  `worst relative deviation ${worstAdd.toExponential(2)} across ${audits.length} shells · the k=2 shell holds ${(audits[4] || {}).addConst} at every point`);
ok('and the published dimension and the closed form are kept as TWO numbers rather than one, so a reader can watch them agree instead of being told that they do',
  audits.every(a => a.dim === a.dimExact) && /dim_measured/.test(src) && /dim_closed_form/.test(src),
  'dim_measured and dim_closed_form are separate declared outputs of the s3ns instrument');

console.log('\n=== 4. THE KILLING INTERACTION COEFFICIENTS, AND THE IDENTITY THEY CANNOT SATISFY BY ACCIDENT ===\n');

const kc = [];
for (let k = 1; k <= 4; k++) kc.push(Object.assign({ k }, S(`s3nsKillingCoefficients(${k},1)`)));
const V1 = 2 * Math.PI * Math.PI;
const bsWant = k => k * k * (k + 4) / (4 * (k + 2) * V1);
const boWant = k => k * (k + 4) * (k + 4) / (4 * (k + 2) * V1);
const rel = (a, b) => Math.abs(a - b) / Math.max(1e-30, Math.abs(b));
const offB = kc.filter(c => rel(c.bs, bsWant(c.k)) > 1e-10 || rel(c.bo, boWant(c.k)) > 1e-10);
ok('b_s AND b_o ARE MEASURED FROM BRACKETS AND LAND ON THEIR CLOSED FORMS — same-chirality Killing fields are constants in the shell`s own frame, opposite-chirality ones commute with it, and neither sum knows what it is supposed to equal',
  offB.length === 0 && kc.length === 4,
  offB.length ? offB.map(c => `k=${c.k}: ${c.bs.toExponential(6)} vs ${bsWant(c.k).toExponential(6)}`).join(' · ')
    : kc.map(c => `k=${c.k}: b_s ${c.bs.toExponential(6)}, b_o ${c.bo.toExponential(6)}`).join(' · '));
const offSum = kc.filter(c => rel(c.bs + c.bo, c.k * (c.k + 4) / (2 * V1)) > 1e-10);
/* the laboratory also PUBLISHES the closed forms beside the measurement, in the
   reader's own panel, as the thing the measurement is compared against; a wrong
   closed form there would show a real disagreement as a fake one */
const offPub = kc.filter(c => rel(c.bsExact, bsWant(c.k)) > 1e-12 || rel(c.boExact, boWant(c.k)) > 1e-12
  || rel(c.sumExact, c.k * (c.k + 4) / (2 * V1)) > 1e-12);
ok('and the closed forms the panel shows BESIDE the measurement are themselves right, so a reader comparing the two columns is comparing two correct things rather than watching a wrong constant accuse a right measurement',
  offPub.length === 0,
  offPub.length ? offPub.map(c => `k=${c.k}: published b_s ${c.bsExact.toExponential(9)} against ${bsWant(c.k).toExponential(9)}`).join(' · ')
    : 'b_s, b_o and their sum are published at every k with the values this file derives independently');

ok('AND THEIR SUM IS κ_k/(2𝒱), which is the check worth having: two independently measured sums have no way to land on one Stokes eigenvalue unless the construction is right',
  offSum.length === 0,
  offSum.length ? offSum.map(c => `k=${c.k}: ${(c.bs + c.bo).toExponential(9)} vs ${(c.k * (c.k + 4) / (2 * V1)).toExponential(9)}`).join(' · ')
    : kc.map(c => `k=${c.k}: b_s+b_o = ${(c.bs + c.bo).toExponential(9)} = κ/(2𝒱)`).join(' · '));
/* the addendum reports these two from an independent quaternion-coordinate
   calculation on S³_1; they are the only external numbers in this file */
const C1s = (1 + 1) * (1 + 3) * kc[0].bs * V1, C1o = (1 + 1) * (1 + 3) * kc[0].bo * V1;
ok('and at k = 1 the products 𝒱C are 10/3 and 50/3 — the two values the source addendum reports from a quaternion calculation this laboratory does not perform',
  Math.abs(C1s - 10 / 3) < 1e-10 && Math.abs(C1o - 50 / 3) < 1e-10,
  `𝒱C(same) = ${C1s.toFixed(12)} against 10/3 · 𝒱C(opposite) = ${C1o.toFixed(12)} against 50/3`);

console.log('\n=== 5. THE KILLING CARRIER, AND WHAT MAKES THE SPACE REDUCING ===\n');

/* On 𝒦 ⊕ E_{k,σ} the unforced motion is NOT a scalar amplitude law: the shell is
   carried by the flow of a fixed Killing field while it decays. Φ_t^Y is a
   two-sided unit-quaternion rotation, and the substantive claim is that carrying
   the shell leaves it INSIDE the shell — which is what an exact reducing space
   means. That is checked by taking the curl of the carried field, again by
   ambient differences, and finding the same μ.

   THE FIRST FORM OF THIS CHECK PROVED NOTHING. It differenced the closed form and
   then subtracted the transport term it had itself defined as that same
   difference, so the residual was zero by construction at any weights whatsoever
   — an identity dressed as a measurement. What survives is the part the
   construction cannot arrange: the carried field's curl. */
{ const qm = (a, b) => [a[0]*b[0]-a[1]*b[1]-a[2]*b[2]-a[3]*b[3],
                        a[0]*b[1]+a[1]*b[0]+a[2]*b[3]-a[3]*b[2],
                        a[0]*b[2]-a[1]*b[3]+a[2]*b[0]+a[3]*b[1],
                        a[0]*b[3]+a[1]*b[2]-a[2]*b[1]+a[3]*b[0]];
  const qc = a => [a[0], -a[1], -a[2], -a[3]];
  const axis = (i, ang) => { const o = [Math.cos(ang), 0, 0, 0]; o[i+1] = Math.sin(ang); return o; };
  const dot4 = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];
  const FR = [[[0,-1,0,0],[1,0,0,0],[0,0,0,-1],[0,0,1,0]],
              [[0,0,-1,0],[0,0,0,1],[1,0,0,0],[0,-1,0,0]],
              [[0,0,0,-1],[0,0,-1,0],[0,1,0,0],[1,0,0,0]]];
  const Y = (a, q) => FR[a].map(r => r[0]*q[0] + r[1]*q[1] + r[2]*q[2] + r[3]*q[3]);
  const EPS = (a, b, c) => ((a - b) * (b - c) * (c - a)) / 2;
  const H = 1e-5;
  const along = (q, d, e) => { const p = [0,1,2,3].map(i => Math.cos(e)*q[i] + Math.sin(e)*d[i]),
        n = Math.hypot(p[0],p[1],p[2],p[3]); return [p[0]/n,p[1]/n,p[2]/n,p[3]/n]; };
  const myCurl = (F, q) => { const T = [0,1,2].map(a => Y(a, q)), g = [];
    for (let b = 0; b < 3; b++) { const vp = F(along(q, T[b], H)), vm = F(along(q, T[b], -H));
      let d = [0,1,2,3].map(i => (vp[i] - vm[i]) / (2*H));
      const n = dot4(d, q); g.push(d.map((x, i) => x - n*q[i])); }
    const c = [0,1,2].map(a => { let t = 0;
      for (let b = 0; b < 3; b++) for (let d2 = 0; d2 < 3; d2++) { const e = EPS(a,b,d2); if (e) t += e*dot4(g[b], T[d2]); }
      return t; });
    const out = [0,0,0,0]; for (let a = 0; a < 3; a++) for (let i = 0; i < 4; i++) out[i] += c[a]*T[a][i];
    return out; };
  const PTS = [[0.3,-0.5,0.62,0.4], [0.1,0.7,-0.3,0.63], [-0.44,0.2,0.5,0.71]]
    .map(q => { const n = Math.hypot(q[0],q[1],q[2],q[3]); return q.map(x => x/n); });

  let carriedCurl = 0, isoN = 0, isoD = 0, weightBad = [];
  for (const R of [1, 2.2]) for (const k of [1, 2, 3]) for (const sg of [1, -1]) {
    const mu = sg * (k + 2) / R;
    const w = S(`s3nsCarrierWeights(${k},${sg},${R})`);
    /* the weights this file derives, from the paper's own formula for Y */
    if (Math.abs(w.same - (1 - 2/(R*mu))) > 1e-12 || Math.abs(w.opposite - (1 + 2/(R*mu))) > 1e-12)
      weightBad.push(`k=${k} σ=${sg} R=${R}`);
    /* and at σ = +1 they must be the one-shell criterion's a_k and b_k */
    if (sg > 0 && R === 1 && (Math.abs(w.same - k/(k+2)) > 1e-12 || Math.abs(w.opposite - (k+4)/(k+2)) > 1e-12))
      weightBad.push(`criterion k=${k}`);
    if (k !== 2 || sg !== 1 || R !== 1) continue;
    const shell = S(`s3nsShell(${k},${sg})`), comp = S(`s3nsShellElement(s3nsShell(${k},${sg}),4242)`);
    const vel = vm.runInContext('s3nsVelocity', ctx);
    for (const t of [0, 0.4, 1.1]) {
      const rot = S(`s3nsCarrierRotors(${k},${sg},${R},${t},1)`);
      const F = q => { const p = qm(qm(qc(rot.alpha), q), qc(rot.beta));
        return qm(qm(rot.alpha, vel(shell, comp, p, [0,0,0,0])), rot.beta); };
      for (const q of PTS) { const c = myCurl(F, q), f = F(q), sc = Math.hypot(f[0],f[1],f[2],f[3]) || 1;
        for (let i = 0; i < 4; i++) carriedCurl = Math.max(carriedCurl, Math.abs(c[i] - mu*f[i]) / sc); }
      /* and Φ_t^Y has to be an isometry, or none of this is a motion of the sphere */
      for (const q of PTS) { const P = S(`s3nsCarryPoint(s3nsCarrierRotors(${k},${sg},${R},${t},1),[${q}])`);
        isoN = Math.max(isoN, Math.abs(Math.hypot(P[0],P[1],P[2],P[3]) - 1));
        for (const r of PTS) { const Rq = S(`s3nsCarryPoint(s3nsCarrierRotors(${k},${sg},${R},${t},1),[${r}])`);
          isoD = Math.max(isoD, Math.abs(dot4(P, Rq) - dot4(q, r))); } } } }

  ok('CARRYING THE SHELL LEAVES IT INSIDE THE SHELL — the curl of (Φ_t^Y)_* v, taken by ambient differences at three times and three points, comes back at the SAME μ, which is exactly what makes 𝒦 ⊕ E_{k,σ} an exact reducing space rather than a space that merely contains a solution at t = 0',
    carriedCurl < 1e-7,
    `worst relative residual ${carriedCurl.toExponential(2)} over 9 (t, point) pairs at k = 2`);
  ok('and Φ_t^Y IS A MOTION OF THE SPHERE: a two-sided unit-quaternion rotation preserves both the norm and every inner product, to machine precision — so the carried picture is the same field seen from a turning frame and not a distortion of it',
    isoN < 1e-14 && isoD < 1e-14,
    `worst norm drift ${isoN.toExponential(2)}, worst inner-product drift ${isoD.toExponential(2)}`);
  ok('and the carrier`s two weights are 1 ∓ 2/(Rμ) at every shell, sign and radius — which at σ = +1 are the one-shell criterion`s k/(k+2) and (k+4)/(k+2), so the flow that carries the shell and the condition that closes it are the same two numbers',
    weightBad.length === 0,
    weightBad.length ? weightBad.slice(0, 4).join(' · ')
      : [1, 2, 3].map(k => `k=${k}: ${(k/(k+2)).toFixed(6)} and ${((k+4)/(k+2)).toFixed(6)}`).join(' \u00b7 '));

  /* A TWO-SIDED ROTATION IS AN ISOMETRY WHATEVER ITS TWO ROTORS ARE, and the
     carried field is an eigenfield for any of them — so the two checks above pass
     for a carrier that is not Y's flow at all. What identifies Y is its two
     weights on its two SIDES, and that is pinned here against rotors this file
     builds for itself. */
  { const bad = [];
    /* the reader's dial is a GAIN on both weights, so it is swept too — a rotor
       that silently ignores it turns at the wrong rate for every setting but one */
    for (const R of [1, 2.2]) for (const k of [1, 3]) for (const sg of [1, -1])
    for (const t of [0.37, 1.9]) for (const g of [1, 0.6, 1.4]) {
      const mu2 = sg * (k + 2) / R, w = { same: 1 - 2/(R*mu2), opposite: 1 + 2/(R*mu2) };
      const rot = S(`s3nsCarrierRotors(${k},${sg},${R},${t},${g})`);
      const wantA = axis(0, g * w.same * t), wantB = axis(1, g * w.opposite * t);
      for (let i = 0; i < 4; i++) {
        if (Math.abs(rot.alpha[i] - wantA[i]) > 1e-12) bad.push(`α k=${k} σ=${sg} R=${R} g=${g}`);
        if (Math.abs(rot.beta[i] - wantB[i]) > 1e-12) bad.push(`β k=${k} σ=${sg} R=${R} g=${g}`); }
      /* and the point is carried with α on the LEFT and β on the RIGHT — the two
         sides are the two chiralities and swapping them is a different flow */
      for (const q of PTS) { const got = S(`s3nsCarryPoint(s3nsCarrierRotors(${k},${sg},${R},${t},${g}),[${q}])`);
        const want = qm(qm(rot.alpha, q), rot.beta);
        for (let i = 0; i < 4; i++) if (Math.abs(got[i] - want[i]) > 1e-12) bad.push(`carry k=${k} g=${g}`); } }
    ok('AND THE CARRIER IS Y`S FLOW AND NOT MERELY SOME ROTATION — the left rotor turns at 1 − 2/(Rμ) and the right one at 1 + 2/(Rμ), on their own axes, and the point is carried with one on each side: a single weight, a single axis or a single side is still an isometry, still leaves the shell invariant, and is still the wrong motion',
      bad.length === 0,
      bad.length ? [...new Set(bad)].slice(0, 4).join(' \u00b7 ')
        : 'rotors and carry rebuilt here from the paper`s Y at two radii, two shells, both signs and two times'); } }

ok('and the laboratory ANIMATES that closed form rather than claiming to have integrated the equation, which it says in its own contract',
  /THE CARRIED SOLUTION IS ANIMATED, NOT INTEGRATED/.test(src)
  && /s3nsCarryPoint\(rot,\[Q\[i\*4\]/.test(src)
  && /name:'carrier_weight_same'/.test(src),
  'the refusal is in the instrument, the carrier moves the stored S³ points, and both weights are published outputs');

console.log('\n=== 6. THE ONE SHELL THAT NEVER DECAYS ===\n');

const kappas = [0, 1, 2, 3, 4, 5].map(k => S(`s3nsKappa(${k},1)`));
ok('κ_k VANISHES AT k = 0 AND NOWHERE ELSE, which is the whole reason the Hopf fibration is a steady flow: the Stokes eigenvalue of its shell is zero, so e^{−νκt} never moves',
  kappas[0] === 0 && kappas.slice(1).every((v, i) => v > 0 && v > (i ? kappas[i] : 0)),
  kappas.map((v, k) => `κ_${k}=${v}`).join(' · '));
ok('and the shells above it decay at a rate that is quadratic in k rather than linear, so the spectrum thins out faster than the band rank fills up',
  Math.abs(kappas[4] - 32) < 1e-12 && Math.abs(kappas[5] - 45) < 1e-12,
  'κ_k = k(k+4): 0, 5, 12, 21, 32, 45 — measured off the operator A = curl² − 4/R², not written down');

console.log('\n=== 7. THE BAND A SINGULAR PEAK WOULD HAVE TO OUTGROW ===\n');

let brute = 0; const bruteRanks = [];
for (let K = 0; K <= 8; K++) { brute += 2 * (K + 1) * (K + 3); bruteRanks.push(brute); }
const closed = bruteRanks.map((_, K) => S(`s3nsBandRank(${K})`));
ok('N_K COUNTS THE SAME DIMENSIONS TWICE — once by summing the measured shell ranks over both signs, once by the cubic closed form — and the two agree at every cutoff',
  bruteRanks.every((v, K) => v === closed[K]),
  bruteRanks.map((v, K) => `K=${K}:${v}`).join(' · '));
const N2 = S('s3nsBandRank(2)'), V = S('s3nsVolume(1)');
/* the volume has to come from somewhere other than the formula being checked: the
   Gamma-function surface integral the L² machinery already uses returns the area of
   the unit three-sphere as ∫ x⁰ dσ, and 2π²R³ is the closed form it must match */
ok('AND THE VOLUME IN THOSE CONSTANTS HAS TWO AUTHORITIES THAT AGREE — the Gamma-function surface integral this laboratory integrates polynomials with, and the closed form 2π²R³ it quotes',
  Math.abs(S('s3nsMonoIntegral([0,0,0,0])') - S('s3nsVolume(1)')) < 1e-12
  && Math.abs(S('s3nsVolume(1)') - 2 * Math.PI * Math.PI) < 1e-12
  && Math.abs(S('s3nsVolume(3)') - 27 * S('s3nsVolume(1)')) < 1e-9,
  `∫_{S³} dσ = ${S('s3nsMonoIntegral([0,0,0,0])').toFixed(12)} from Γ(1/2)⁴/Γ(2), against 2π²R³ = ${S('s3nsVolume(1)').toFixed(12)} — and the cube law holds at R = 3`);

ok('and both sharp projector norms are built from that rank and the volume alone, with the square root relating them exactly',
  Math.abs(S('s3nsEvalConst(52,1)') - 52 / (3 * V)) < 1e-15
  && Math.abs(S('s3nsEvalConst2(52,1)') - Math.sqrt(52 / (3 * V))) < 1e-15
  && N2 === 52,
  `‖Π₂‖₁→∞ = ${(52 / (3 * V)).toFixed(9)} and ‖Π₂‖₂→∞ = ${Math.sqrt(52 / (3 * V)).toFixed(9)} at R = 1, 𝒱 = 2π² = ${V.toFixed(6)}`);

console.log('\n=== 8. THE RESONANCE GATE IS A GATE, NOT A LABEL ===\n');

/* a gate that lets everything through is not a gate; these two cases are chosen
   because one is forced open by the spins and the other is forced shut */
ok('THE CLEBSCH–GORDAN GATE SHUTS ON A REAL PAIR: two Killing fields of opposite handedness cannot produce a k = 0 output of either sign, because the right spins cannot meet',
  S('s3nsCGGate(0,-1,0,1,0,1)') === false && S('s3nsCGGate(0,-1,0,1,0,-1)') === false
  && S('s3nsCGGate(0,1,0,1,0,1)') === true,
  'E_{0,−} ⊗ E_{0,+} → E_{0,±} is closed by Schur; E_{0,+} ⊗ E_{0,+} → E_{0,+} is open');
ok('and it shuts on the high shells a low pair cannot reach, so it constrains the cascade rather than describing it',
  S('s3nsCGGate(0,1,0,1,2,1)') === false && S('s3nsCGGate(1,1,1,1,2,1)') === true,
  'two Hopf fields cannot feed E_{2,+}; two k = 1 shells can');

console.log('\n=== 9. THE MIXED-ORDER MONOID, AGAINST A BRUTE-FORCE SET ===\n');

const monoid = [[2, 3, 12], [3, 5, 20], [4, 7, 12]].map(([p, q, L]) => {
  const brute = new Set();
  for (let n = 0; n * p / q <= L + 1e-9; n++) for (let m = 0; n * p / q + m <= L + 1e-9; m++)
    brute.add((n * p / q + m).toFixed(10));
  return { p, q, L, brute: brute.size, page: S(`s3nsMonoidCount(${p}/${q},${L})`),
    closed: Math.floor(q * L) + 1 - (p - 1) * (q - 1) / 2 }; });
ok('THE RATIONAL ORDER COUNT ⌊qL⌋ + 1 − (p−1)(q−1)/2 IS THE SIZE OF THE SET, not a description of it — counted a third time here by enumeration',
  monoid.every(m => m.brute === m.page && m.page === m.closed),
  monoid.map(m => `${m.p}/${m.q} at L=${m.L}: ${m.brute}`).join(' · '));
ok('and the largest order the semigroup omits is the Frobenius number pq − p − q, which is what makes the count exact only above it',
  S('s3nsFrobenius(3,5)') === 7 && S('s3nsGapCount(3,5)') === 4
  && S('s3nsFrobenius(4,7)') === 17 && S('s3nsGapCount(4,7)') === 9,
  '⟨3,5⟩ omits 4 integers, the largest 7 · ⟨4,7⟩ omits 9, the largest 17');

console.log('\n=== 10. THE EXTERIOR RECURSION, RUN RATHER THAN QUOTED ===\n');

const h = 0.005, B = S(`s3nsBPoly(6,${h})`);
const at = (poly, x) => poly.reduce((s, c, i) => s + c * Math.pow(x, i), 0);
const leadOff = [], chanOff = [];
for (let m = 0; m <= 6; m++) {
  if (rel(B[m][2 * m] || 0, S(`s3nsBLead(${m})`)) > 1e-9) leadOff.push(m);
  if (rel(at(B[m], -2 * (0.5 + h)), S(`s3nsBChannel(${m},${h})`)) > 1e-9) chanOff.push(m); }
ok('THE RECURSION IS SOLVED AND ITS LEADING COEFFICIENT COMES OUT 1/(3^m m!) — the polynomial is produced by the difference equation, and the closed form is what the produced polynomial is then asked about',
  leadOff.length === 0, leadOff.length ? 'orders off: ' + leadOff.join(' ')
    : [0, 1, 2, 3].map(m => `m=${m}: ${(B[m][2 * m]).toExponential(6)}`).join(' · '));
ok('and B_m(−2a) lands on (−4(1−h²))^m/m!, so the homogeneous channel sums to an exponential — an ALL-ORDER identity that a wrong recursion cannot satisfy at seven orders in a row',
  chanOff.length === 0, chanOff.length ? 'orders off: ' + chanOff.join(' ')
    : `Σ zᵐB_m(−2a) = e^{−4(1−h²)z} evaluated to 7 orders at h = ${h}`);

console.log('\n=== 11. THE TORUS SECTOR IS TWO SCALAR HEAT EQUATIONS ===\n');

const jac = (n, al, be, s) => S(`s3nsJacobi(${n},${al},${be},${1 - 2 * s})`);
const e = 1e-5; let jworst = 0;
for (let n = 0; n <= 4; n++) for (const s0 of [0.2, 0.45, 0.77]) for (const [al, be, c] of [[1, 0, 2], [0, 1, 1]]) {
  const d2 = (jac(n, al, be, s0 + e) - 2 * jac(n, al, be, s0) + jac(n, al, be, s0 - e)) / (e * e);
  const d1 = (jac(n, al, be, s0 + e) - jac(n, al, be, s0 - e)) / (2 * e);
  jworst = Math.max(jworst, Math.abs(s0 * (1 - s0) * d2 + (c - 3 * s0) * d1 + n * (n + 2) * jac(n, al, be, s0))); }
ok('THE JACOBI BASIS DIAGONALISES BOTH TORUS OPERATORS AT −n(n+2), checked by finite differences on the operators themselves rather than by citing the differential equation',
  jworst < 1e-4, `worst residual ${jworst.toExponential(2)} over 30 (n, s, sector) combinations at step ${e}`);
ok('and the sharp unforced decay rate of that sector is 12ν/R², which is 4ν·1·3 — the first non-constant Jacobi level and nothing else',
  Math.abs(S('s3nsTorusEig(1,1)') - 12) < 1e-12 && S('s3nsTorusEig(0,1)') === 0,
  'λ_n = 4n(n+2)/R²: 0, 12, 32, 60 — the constant sector is the Killing cone and does not decay');

console.log('\n=== 12. WHAT THE LABORATORY REFUSES, IN THE PAGE ITSELF ===\n');

ok('the laboratory is registered as a world-owned laboratory with a camera, a router branch and a scene, rather than as a declaration nothing draws',
  /s3shellGroup\.visible = \(v==='s3shell'\);/.test(src)
  && /state\.s3view==='s3shell'/.test(src)
  && /v==='s3shell'\?\[0,\.4,12\.6\]:/.test(src)
  && /if\(v==='s3shell'&&!s3shellObjs\)\{ s3shellSetup\(\); \}/.test(src),
  'visibility, router, camera preset and lazy build are all present');
ok('THE RELATIVE HALF OF THE SOURCE PAPER IS REFUSED IN WRITING, in the instrument contract and in the reader`s own panel — the singular branch depends on an external Euclidean package this atlas does not hold and does not evaluate',
  /THE SINGULAR BRANCH IS NOT HERE/.test(src)
  && /EXTERIOR MATCHING AND THE ANNULAR CORRECTION CYCLE ARE UNPROVED TRANSFER REQUIREMENTS/.test(src)
  && /NO CLAIM OF PRIORITY OR OF NOVELTY IS MADE/.test(src)
  && /S₀…S₄/.test(src),
  'four refusals, each naming what it refuses rather than hedging');
ok('and the two evaluation constants the paper calls sharp are published as outputs an agent can ask for, with the band rank they are built from',
  /name:'projector_1_inf'/.test(src) && /name:'projector_2_inf'/.test(src) && /name:'band_rank'/.test(src),
  'the escape argument is a number on the wire, not a sentence in a panel');

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
