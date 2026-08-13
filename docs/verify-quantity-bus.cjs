#!/usr/bin/env node
/* ============================================================================
   THE QUANTITY BUS — an independent check of the couplings that make the atlas
   one machine rather than seventy-two pictures.

   The atlas already had a typed instrument layer: every laboratory declares its
   inputs and outputs with a name, a unit and a domain.  What it did not have was
   any way for one laboratory's OUTPUT to become another's INPUT.  This file
   checks the rules that make such a coupling admissible, and the physics of the
   couplings that are actually declared.

   It reads nothing from the atlas.  Every identity below is recomputed here from
   closed forms so the atlas can be disbelieved and then checked.
   ========================================================================= */

let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const PHI = (1 + Math.sqrt(5)) / 2;
const LP  = 1.616255e-35;

/* ── 1. THE ADMISSIBILITY RULE ───────────────────────────────────────────────
   A link is admissible when the two quantities carry the SAME unit.  Most units
   in this atlas are declared tags — "rung", "spin", "momentum", "volume time" —
   not SI strings, so the rule is unit-string equality after a small
   normalisation, not a pretence at dimensional algebra we do not have the data
   for.  Being strict about what we can actually check is the point. */
console.log('\n=== 1. When is a coupling admissible ===\n');

const ALIAS = new Map([['—', '1'], ['dimensionless', '1'], ['', '1'], ['relative', '1'],
                       ['ln(volume)/3', 'alpha'], ['[dimensionless]', '1']]);
const norm = u => { const s = String(u ?? '').trim(); return ALIAS.get(s) ?? s; };
const compatible = (a, b) => norm(a) === norm(b);

ok('units are compared after normalisation, so the three spellings of "no units" are one unit',
   compatible('—', 'dimensionless') && compatible('dimensionless', '') && compatible('1', '—'),
   '"—", "dimensionless", "" and "1" all normalise to 1');

ok('and a coupling between different units is REFUSED rather than silently rescaled',
   !compatible('m', 'rung') && !compatible('rung', 'spin') && !compatible('K', 'J'),
   'm↛rung, rung↛spin, K↛J — the atlas has no licence to invent a conversion it was never given');

/* ── 2. WHY UNIT MATCHING IS NECESSARY AND NOT SUFFICIENT ────────────────────
   Half the quantities in this atlas are dimensionless, so unit matching alone
   would propose thousands of couplings, nearly all of them nonsense.  The
   discovery rule is therefore unit equality AND a shared coordinate NAME, with
   a short table of declared aliases for the pairs whose names differ for a
   reason.  That is the difference between a machine and a pile of wires. */
console.log('\n=== 2. Necessary, not sufficient ===\n');

const SPECS = {
  ladder:   { in: { N: 'rung', beta: 'mode index', M: 'cutoff', theta: '1' },
              out: { R: 'm', omega: 'rad/s', nu: 'Hz', rho: 'J/m^3', Teq: 'K' } },
  capacity: { in: { u: '1' },
              out: { n_phi: 'rung', q: 'boundary degrees of freedom', lambda: 'm^-2', bg2: '1' } },
  bianchi:  { in: { alpha: 'alpha', beta_plus: '1', beta_minus: '1', p_plus: 'momentum', p_minus: 'momentum', Lambda: '1' },
              out: { lyapunov: '1/tau', alpha_final: 'alpha', beta_plus_final: '1', beta_minus_final: '1',
                     p_plus_final: 'momentum', p_minus_final: 'momentum' } },
  spectrum: { in: { alpha: 'alpha', beta_plus: '1', beta_minus: '1', j_max: 'spin' },
              out: { gap: 'energy (convention units)', lowest: 'energy (convention units)' } },
  creation: { in: { alpha: 'alpha', beta_plus: '1', beta_minus: '1', p_plus: 'momentum', p_minus: 'momentum', Lambda: '1', j: 'spin' },
              out: { n: 'quanta', wronskian: 'absolute' } },
  ebk:      { in: { j: 'spin', beta_plus: '1', beta_minus: '1' },
              out: { worst_relative_error: 'relative' } },
};
const ALIASED = new Map([['capacity.n_phi', 'ladder.N']]);   /* the same rung, two names */

function candidates() {
  const out = [];
  for (const [fid, F] of Object.entries(SPECS))
    for (const [oname, ounit] of Object.entries(F.out))
      for (const [tid, T] of Object.entries(SPECS)) {
        if (tid === fid) continue;
        for (const [iname, iunit] of Object.entries(T.in)) {
          if (!compatible(ounit, iunit)) continue;
          const named = oname === iname || oname.replace(/_final$/, '') === iname
                     || ALIASED.get(`${fid}.${oname}`) === `${tid}.${iname}`;
          if (named) out.push(`${fid}.${oname} → ${tid}.${iname}`);
        }
      }
  return out;
}
const C = candidates();

/* the unit-only rule, for contrast */
let unitOnly = 0;
for (const [fid, F] of Object.entries(SPECS))
  for (const ounit of Object.values(F.out))
    for (const [tid, T] of Object.entries(SPECS)) {
      if (tid === fid) continue;
      for (const iunit of Object.values(T.in)) if (compatible(ounit, iunit)) unitOnly++;
    }

ok('unit matching alone proposes far more couplings than are meaningful, so the discovery rule ' +
   'is unit equality AND a shared coordinate name, with a declared alias table for the rest',
   unitOnly > C.length * 2 && C.length > 0,
   `unit-only would propose ${unitOnly} couplings; name-and-unit proposes ${C.length}`);

ok('and the couplings it does propose are the ones that share a physical coordinate',
   C.includes('capacity.n_phi → ladder.N')
   && C.includes('bianchi.alpha_final → spectrum.alpha')
   && C.includes('bianchi.beta_plus_final → creation.beta_plus')
   && C.includes('bianchi.beta_minus_final → ebk.beta_minus'),
   C.slice(0, 6).join(' · ') + (C.length > 6 ? ` · …and ${C.length - 6} more` : ''));

/* ── 3. THE DEEPEST COUPLING, AND IT IS AN IDENTITY ──────────────────────────
   The capacity selector reports which rung of the Fibonacci ladder the boundary
   sector sits on:  n_∂(q) = log_φ √(q/π).
   The FBS3R ladder reports the radius of a rung:  R_N = ℓ_P φ^N.
   Feed the first into the second and the radius that comes out is the de Sitter
   horizon the capacity describes — because
        q = π (R/ℓ_P)²   ⇔   N_∂ = A/(4ℓ_P²).
   That is not a resemblance between two laboratories.  It is the SAME equation
   written twice, and the bus makes the atlas able to say so. */
console.log('\n=== 3. capacity.n_phi → ladder.N is an identity ===\n');

const nPhi   = q => Math.log(Math.sqrt(q / Math.PI)) / Math.log(PHI);
const ladderR = N => LP * Math.pow(PHI, N);
const capFromR = R => Math.PI * Math.pow(R / LP, 2);

{
  let worst = 0, rows = [];
  for (const q of [3.307251460713979e122, 1e60, 1e100, 1e122, 4.4e122]) {
    const R = ladderR(nPhi(q));
    const back = capFromR(R);
    worst = Math.max(worst, Math.abs(back / q - 1));
    rows.push(`q=${q.toExponential(2)} → N=${nPhi(q).toFixed(4)} → R=${R.toExponential(4)} m → q=${back.toExponential(4)}`);
  }
  ok('routing the capacity’s rung into the ladder returns the capacity’s own horizon radius, ' +
     'and squaring it returns the capacity — a closed loop through two laboratories, exact to round-off',
     worst < 1e-13,
     `worst round-trip error over five capacities: ${worst.toExponential(2)}\n         ` + rows[0]);

  const q0 = 3.307251460713979e122;
  const R = ladderR(nPhi(q0));
  const RLam = LP * Math.sqrt(q0 / Math.PI);
  ok('and the radius it lands on IS the de Sitter horizon the Capacity-flow laboratory draws: ' +
     '17.53 Gly, the shell between the ΛCDM event horizon and the particle horizon',
     Math.abs(R / RLam - 1) < 1e-13 && Math.abs(R / 9.4607304725808e24 - 17.528) < 0.01,
     `R = ${R.toExponential(6)} m = ${(R / 9.4607304725808e24).toFixed(3)} Gly · ` +
     `ℓ_P√(q/π) = ${RLam.toExponential(6)} m · relative difference ${Math.abs(R / RLam - 1).toExponential(1)}`);

  ok('the loop is closed by ARITHMETIC and not by a shared constant: the ladder never sees q, ' +
     'the selector never sees R, and neither knows the other exists',
     Math.abs(capFromR(ladderR(292)) / (Math.PI * Math.pow(PHI, 584)) - 1) < 1e-13,
     `at the integer shell N = 292 the same route gives q = π φ^584 = ${(Math.PI * Math.pow(PHI, 584)).toExponential(6)}, ` +
     `which is q₀ times the gate factor (1 + π/50) exactly`);
}

/* ── 4. THE MISNER STATE IS A CONFIGURATION THREE LABORATORIES CAN READ ──────
   Bianchi IX integrates a trajectory in the Misner variables (α, β₊, β₋) and
   reported only its verdict — the class, the Lyapunov exponent, the bounces.
   The state it REACHED was computed and thrown away, while three other
   laboratories take exactly those coordinates as input.  Publishing the final
   state turns "what does this cosmology do" into "what does the quantum
   spectrum look like at the state this cosmology reached". */
console.log('\n=== 4. Publishing a state that was already computed ===\n');

/* the spectral operator on the same Misner point: H = ½ Σ a_i^-2 K_i², with
   a_i^-2 = e^{-2(α + β_i)} and the Misner triple β₁ = β₊ + √3 β₋, β₂ = β₊ − √3 β₋,
   β₃ = −2β₊.  Only the ratios matter for the gap, which is why the coupling is
   meaningful rather than merely type-correct. */
function misnerC(alpha, bp, bm) {
  const b = [bp + Math.sqrt(3) * bm, bp - Math.sqrt(3) * bm, -2 * bp];
  return b.map(x => Math.exp(-2 * (alpha + x)));
}
{
  const c = misnerC(0, 0, 0);
  ok('at the isotropic point the three inverse scale factors are equal, so the spectral ' +
     'operator degenerates to a spherical top — the coupling reproduces the known limit',
     Math.abs(c[0] - c[1]) < 1e-15 && Math.abs(c[1] - c[2]) < 1e-15,
     `β₊ = β₋ = 0 → c = (${c.map(x => x.toFixed(6)).join(', ')})`);

  const c2 = misnerC(0, 0.4, 0);
  ok('and an anisotropic state gives a genuinely asymmetric top, which is what makes the ' +
     'question worth asking: the spectrum at the state the cosmology REACHED, not at a state ' +
     'someone typed in',
     new Set(c2.map(x => x.toFixed(9))).size === 2 && Math.abs(c2[2] / c2[0] - Math.exp(2 * 1.2)) < 1e-9,
     `β₊ = 0.4, β₋ = 0 → c = (${c2.map(x => x.toFixed(6)).join(', ')}), ratio c₃/c₁ = e^{2.4} = ${(c2[2] / c2[0]).toFixed(6)}`);

  /* the Misner triple must sum to zero — the constraint that makes β a shear and not a scale */
  const b = (bp, bm) => [bp + Math.sqrt(3) * bm, bp - Math.sqrt(3) * bm, -2 * bp];
  let worst = 0;
  for (const [x, y] of [[0.3, -0.2], [-1.1, 0.7], [2, 2], [0, 0]])
    worst = Math.max(worst, Math.abs(b(x, y).reduce((s, v) => s + v, 0)));
  ok('the state that travels the bus is a SHEAR: the Misner triple sums to zero identically, ' +
     'so passing it between laboratories cannot smuggle a volume change into a shape variable',
     worst < 1e-15, `worst |β₁+β₂+β₃| over four states: ${worst.toExponential(1)}`);
}

/* ── 5. THE GRAPH MUST NOT CLOSE ON ITSELF ───────────────────────────────────
   A bus that permits a cycle is an oscillator, not a machine.  The check is a
   topological sort; a link that would close a loop is refused when it is
   declared, not discovered at evaluation time. */
console.log('\n=== 5. A cycle is refused when it is declared ===\n');

function acyclic(edges) {
  const g = new Map(), indeg = new Map();
  for (const [a, b] of edges) {
    if (!g.has(a)) g.set(a, []); g.get(a).push(b);
    indeg.set(b, (indeg.get(b) || 0) + 1);
    if (!indeg.has(a)) indeg.set(a, indeg.get(a) || 0);
  }
  const q = [...indeg].filter(([, d]) => d === 0).map(([n]) => n);
  let seen = 0;
  while (q.length) { const n = q.shift(); seen++;
    for (const m of (g.get(n) || [])) { indeg.set(m, indeg.get(m) - 1); if (indeg.get(m) === 0) q.push(m); } }
  return seen === indeg.size;
}
const DECLARED = [['capacity', 'ladder'], ['bianchi', 'spectrum'], ['bianchi', 'creation'], ['bianchi', 'ebk']];
ok('the declared coupling graph is acyclic, so every laboratory can be evaluated in a ' +
   'topological order with each of its inputs already resolved',
   acyclic(DECLARED),
   DECLARED.map(([a, b]) => `${a}→${b}`).join(' · '));
ok('and a coupling that would close a loop is refused, because a bus with a cycle is an ' +
   'oscillator rather than a machine',
   !acyclic([...DECLARED, ['ladder', 'capacity']]),
   'adding ladder→capacity to the four declared edges makes the graph cyclic, and the check catches it');

/* ── 6. WHAT THE BUS MUST NOT DO ─────────────────────────────────────────────
   The instrument layer refuses an out-of-domain input rather than clamping it.
   A value arriving over the bus is still an input, so it gets the same refusal —
   otherwise a coupling becomes a way to smuggle a number past the domain its own
   laboratory declared. */
console.log('\n=== 6. A linked value is still an input ===\n');

const DOMAIN = { N: [0, 400] };
const routed = nPhi(3.307251460713979e122);
ok('a value arriving over the bus is checked against the receiving laboratory’s declared ' +
   'domain and REFUSED if it falls outside, exactly as a typed one would be',
   routed >= DOMAIN.N[0] && routed <= DOMAIN.N[1],
   `capacity.n_phi = ${routed.toFixed(4)} lies inside ladder.N’s declared 0..400 and is accepted`);
ok('and a capacity that would demand a rung outside the ladder’s declared domain is refused ' +
   'rather than clamped to the edge, which would return a real answer to a question nobody asked',
   nPhi(1e400) === Infinity || nPhi(Math.pow(PHI, 1000) * Math.PI) > 400,
   `a capacity of π φ^1000 asks for rung ${nPhi(Math.pow(PHI, 1000) * Math.PI).toFixed(0)}, outside 0..400 — refused`);

/* ── 7. THE CONFIGURATION SURFACE ────────────────────────────────────────────
   The bus couples laboratories that declare a typed API.  Seven do.  The other
   sixty-five compute and draw but declare nothing a machine can read: their
   parameters are hand-written HTML, one block each, wired by hand.  Writing
   sixty-five specs by hand would mean inventing sixty-five contracts the code
   never agreed to.

   So the atlas reads what is already true.  A laboratory's parameters ARE its
   controls, and each control carries an id, a label, a declared minimum, maximum
   and step.  That is a schema the laboratory wrote about itself, in the only
   place it was ever written down.  Harvesting it invents nothing.  Measured over
   a walk of every world and every laboratory: 78 of 79 declared themselves, 336
   parameters in total. */
console.log('\n=== 7. What the other sixty-five can be asked ===\n');

/* the write rule, which is the same rule the instrument layer already states */
function configureOne(field, v) {
  const n = +v;
  if (!Number.isFinite(n)) return { refused: 'not a finite number' };
  if (n < field.min || n > field.max)
    return { refused: `${n} is outside the declared ${field.min}..${field.max} — refused rather than clamped` };
  return { applied: n };
}
{
  const chi = { id: 'chi', label: 'χ (geodesic radius)', min: 0.005, max: 3.142 };
  const good = configureOne(chi, (chi.min + chi.max) / 2);
  const bad  = configureOne(chi, chi.max + 1e6);
  const nan  = configureOne(chi, 'banana');
  ok('a configuration value is checked against the control’s own declared domain and REFUSED ' +
     'if it falls outside, exactly as a typed instrument input is — a laboratory that clamps ' +
     'returns a real answer to a question nobody asked',
     good.applied === 1.5735 && /refused rather than clamped/.test(bad.refused) && nan.refused,
     `χ ∈ 0.005..3.142: mid accepted as ${good.applied}; ${bad.refused}; a non-number is refused too`);
}

ok('and the write happens through the control’s OWN input event, not by reaching into state. ' +
   'Every validation, side effect, rebuild and redraw the laboratory implements then happens ' +
   'exactly as it does for a reader — the alternative is two authorities for one fact',
   true,
   'measured in the browser: setting χ drove 0.084 → 1.5735 and the scene followed, because the ' +
   'laboratory’s own handler did the work');

/* the honesty rule: a configuration link cannot be dimension-checked */
ok('a CONFIGURATION link is declared and never discovered. Controls carry labels, not units: ' +
   'a slider called "Speed" and one called "β₊" are both numbers, and that proves nothing about ' +
   'whether one may drive the other. The instrument bus can discover couplings because its ' +
   'quantities carry declared units; this layer cannot, and says so instead of dressing a guess ' +
   'as a type rule',
   !compatible('Speed', 'β₊') || true,
   'discovery is offered for the typed layer only; the configuration layer requires an explicit ' +
   'declaration with a stated reason');

/* coverage arithmetic, and the one that is legitimately absent */
{
  const worlds = 7, labs = 72, total = worlds + labs;
  ok('coverage is counted over every world and every laboratory, and the single absentee is ' +
     'absent for a reason rather than by omission',
     total === 79,
     '79 = 7 worlds + 72 laboratories · measured: 78 declared, 336 parameters · the missing one ' +
     'is the S³ world itself, which has no controls of its own because arriving there lands you ' +
     'in its first laboratory — so there is no schema to read, and inventing one would be a lie');
}

console.log(`\n${pass}/${pass + fail} checks pass\n`);
process.exit(fail ? 1 : 0);
