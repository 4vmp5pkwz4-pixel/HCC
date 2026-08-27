import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineLab, sha256, notImplemented } from './contract.mjs';
import { STATUS } from './status.mjs';
import { CORE_VERSION, CORE_SCHEMA } from './version.mjs';
import mobius from './labs/smith.mobius.mjs';
import rlc from './labs/smith.fit_series_rlc.mjs';
import ident from './labs/smith.identify_resonances.mjs';
import wpt from './labs/smith.wireless_transfer.mjs';
/* eight kernels EXTRACTED from the atlas rather than retyped from it — scripts/extract-kernels.mjs
   slices the transitive closure of their physics out of index.html, so the picture and the number
   cannot drift apart. See core/atlas/extracted.mjs, which is generated and never edited. */
import zpl from './labs/fbs.zero_point_ladder.mjs';
import anyons from './labs/fibonacci.anyons.mjs';
import capsel from './labs/capacity.conditional_selector.mjs';
import edgeng from './labs/edge.admissibility_no_go.mjs';
import specop from './labs/s3.spectral_operator.mjs';
import bixevo from './labs/bianchi_ix.evolution.mjs';
import pcreate from './labs/s3.particle_creation.mjs';
import ebkq from './labs/s3.ebk_quantisation.mjs';
/* six kernels for the trace-free de Sitter CIVP manuscript — molecular null geometry, the
   CP^1 evaluation lock, finite index, the finite carrier, the UV selector and the
   conditional closure. Their mathematics lives in core/civp/, imports nothing from node,
   and is loaded unchanged by the browser observatory, so the picture and the number are
   one piece of code rather than two transcriptions of it. */
import cp1lock from './labs/civp.cp1_locking.mjs';
import embadon from './labs/civp.embadon_measure.mjs';
import findex from './labs/civp.finite_index.mjs';
import fcarrier from './labs/civp.finite_carrier.mjs';
import uvsel from './labs/civp.uv_selector.mjs';
import civpclosure from './labs/civp.closure.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

/* ── PROVENANCE ──────────────────────────────────────────────────────────────
   The commit is read at CALL time, not at build time. The manifest used to record the
   commit of the run before the one that shipped it, because it was generated and then
   committed; a value that is stale by construction is worse than no value. */
function gitCommit() {
  try { return execSync('git rev-parse HEAD', { cwd: ROOT, stdio: ['ignore','pipe','ignore'] }).toString().trim(); }
  catch { return null; }
}
function coreHash() {
  const files = ['contract.mjs','status.mjs','version.mjs','index.mjs',
    'math/complex.mjs','math/poly.mjs','math/elliptic.mjs','math/lstsq.mjs',
    'atlas/extracted.mjs',
    'labs/smith.mobius.mjs','labs/smith.fit_series_rlc.mjs',
    'labs/smith.identify_resonances.mjs','labs/smith.wireless_transfer.mjs',
    'labs/fbs.zero_point_ladder.mjs','labs/fibonacci.anyons.mjs',
    'labs/capacity.conditional_selector.mjs','labs/edge.admissibility_no_go.mjs',
    'labs/s3.spectral_operator.mjs','labs/bianchi_ix.evolution.mjs',
    'labs/s3.particle_creation.mjs','labs/s3.ebk_quantisation.mjs',
    'labs/civp.cp1_locking.mjs','labs/civp.embadon_measure.mjs','labs/civp.finite_index.mjs',
    'labs/civp.finite_carrier.mjs','labs/civp.uv_selector.mjs','labs/civp.closure.mjs'];
  return sha256(files.map(f => readFileSync(join(HERE, f), 'utf8')).join('\n'));
}
export const PROVENANCE = Object.freeze({ commit: gitCommit(), code_sha256: coreHash() });

/* the eighteen implemented instruments */
const IMPLEMENTED = [mobius, rlc, ident, wpt,
  zpl, anyons, capsel, edgeng, specop, bixevo, pcreate, ebkq,
  cp1lock, embadon, findex, fcarrier, uvsel, civpclosure];

/* ── WHICH KERNEL COVERS WHICH VISUAL LABORATORY ─────────────────────────────
   A kernel does not RETIRE the laboratory it came from: one visual laboratory can host
   several of them — "sec" alone is the source of the spectral operator, the Bianchi IX
   evolution, particle creation AND the EBK comparison — and none of them draws the scene.
   So the stub stays NOT_IMPLEMENTED, which is true of the scene, and NAMES the kernels
   that now compute part of what it shows. Deleting the stub would hide the remainder;
   pretending the stub computes would be the lie the whole taxonomy exists to prevent. */
const COVERED_BY = new Map([
  ['anyon', ['fibonacci.anyons']],
  ['sec', ['s3.spectral_operator', 'bianchi_ix.evolution', 's3.particle_creation', 's3.ebk_quantisation']],
  ['imp', ['smith.mobius', 'smith.fit_series_rlc', 'smith.identify_resonances', 'smith.wireless_transfer']]
]);

/* ── AND THE REST OF THE CATALOGUE, HONESTLY ────────────────────────────────
   Sixty-nine laboratories are in the visual atlas and have no computational contract yet.
   They are registered so an agent can SEE them and told NOT_IMPLEMENTED so no agent can
   mistake a rendering for a result. That is the taxonomy doing its job on the first day. */
let catalogue = [];
try { catalogue = JSON.parse(readFileSync(join(ROOT, 'api/manifest.json'), 'utf8')).labs || []; } catch {}
/* A THIRD STATE, AND IT IS READ OFF THE ATLAS RATHER THAN TYPED HERE.
   Sixteen laboratories now carry a TYPED INSTRUMENT in the atlas itself — declared inputs
   with domains, named outputs with units, limits, verifiers — and their mathematics is
   already sliced into core/atlas/extracted.mjs by scripts/extract-kernels.mjs. For those,
   "extract a pure kernel" is a problem that has been SOLVED, and leaving it in the open
   problems would be the same drift in the other direction: understating the atlas.

   What is genuinely still missing for them is this service's contract — describe/run/sweep/
   validate/export/cancel over HTTP — so that is what the open problem now says. The test is
   the manifest's own instrument field, measured by walking the atlas, so no hand-kept list
   can drift from it. */
const stubs = catalogue.map(L => {
  const covered = COVERED_BY.get(L.id) || [];
  if (L.instrument && !covered.length) return defineLab({
    id: 'atlas.' + L.id,
    title: L.title,
    status: STATUS.NOT_IMPLEMENTED,
    model_id: 'atlas.' + L.id,
    summary: `Catalogued in the visual atlas as "${L.title}", where it carries the typed ` +
      `instrument "${L.instrument}": declared inputs with domains, named outputs with units, ` +
      `stated limits and named verifiers. Its kernel is pure and lives in ` +
      `core/atlas/extracted.mjs. What it does NOT yet have is this service's contract, so ` +
      `call it in the browser through HCC_API.run("${L.instrument}", …), not here.`,
    not_implemented_reason:
      `the physics IS extracted and IS callable — as the atlas instrument "${L.instrument}" ` +
      `— but it has no describe/run/sweep/validate/export/cancel contract in this service yet, ` +
      `and this service will not answer for an instrument it does not host`,
    covered_by: ['atlas-instrument:' + L.instrument],
    open_problems: [`wrap the extracted kernel of "${L.id}" in this service's ` +
      `describe/run/sweep/validate/export/cancel contract; the kernel and the typed instrument ` +
      `already exist and the atlas answers with them`],
    inputs: [], outputs: [],
    assumptions: ['none — nothing is computed through THIS contract'],
    domain_of_validity: ['none — nothing is computed through THIS contract'],
    evaluate() { throw notImplemented('atlas.' + L.id, 'not implemented'); }
  });
  return defineLab({
    id: 'atlas.' + L.id,
    title: L.title,
    status: STATUS.NOT_IMPLEMENTED,
    model_id: 'atlas.' + L.id,
    summary: `Catalogued in the visual atlas as "${L.title}". It renders; it does not compute ` +
      `through this contract, and this service will not invent a number for it.` +
      (covered.length ? ` Part of what it shows IS computed, by ${covered.join(', ')} — ` +
        `call those, not this.` : ''),
    not_implemented_reason: covered.length
      ? `this laboratory draws a scene and has no kernel of its own, but ${covered.length} kernel(s) ` +
        `extracted from it do compute: ${covered.join(', ')}. Call one of those.`
      : 'no pure computational kernel has been extracted from the visual laboratory yet; ' +
        'the atlas draws it and the API refuses to return a plausible number in place of one',
    covered_by: covered,
    open_problems: covered.length
      ? [`extract the remaining physics of "${L.id}" beyond ${covered.join(', ')} into pure kernels`]
      : [`extract a pure kernel for "${L.id}" and give it describe/run/sweep/validate/export/cancel`],
    inputs: [], outputs: [],
    assumptions: ['none — nothing is computed'],
    domain_of_validity: ['none — nothing is computed'],
    evaluate() { throw notImplemented('atlas.' + L.id, 'not implemented'); }
  });
});

export const NAMED_OPEN_PROBLEMS = Object.freeze([
  ['edge.determinants', "primed functional determinants det'|∇²+m²| with tachyonic edge masses are not implemented"],
  ['edge.harish_chandra', 'the Harish-Chandra edge oscillator character is not implemented'],
  ['edge.so4_volume', 'the SO(4) volume factor is not implemented'],
  ['edge.kronecker', 'the Kronecker-limit modular functional is not implemented'],
  ['edge.H_boundary_q', 'H_{∂,q} does not exist as a fully specified operator; the recursion operator is a registry, not a selector'],
  ['capacity.selector', 'the capacity selector does not select N = 292; the scheme gate is q0 written backwards'],
  ['phi.physical_origin', 'no physical operator produces φ; R_N = ℓ_P φ^N is a declared ansatz'],
  ['desi.covariance', 'no DESI covariance or evidence computation exists in this repository'],
  ['bianchi.spectral_consequence', 'the spectral consequence of Bianchi IX is not derived'],
  ['bianchi.csv_reproducibility', 'docs/data/bianchi-ix-trajectories.csv is not byte-reproducible from its generator'],
  /* ── FOUND BY MEASURING, RECORDED AS A QUESTION ────────────────────────────
     The atlas now measures, on every build, how much of each view it recomputes
     between frames, and publishes the answer in api/liveness.json. A number of
     views change nothing at all. That is not by itself a fault: a laboratory
     meant to be a diagram scores zero and is right to, and several of them
     plainly are meant to be diagrams.

     The problem is that NOTHING DISTINGUISHES THE TWO. No laboratory can declare
     that it is a diagram, so a still view and a laboratory that quietly stopped
     computing are indistinguishable to every check the atlas has — and the
     liveness gate can therefore only be derived for the three laboratories that
     publish stations, because a station is the one place the atlas has a
     machine-readable claim to hold a view to. Give a view a way to say what it
     is meant to be, and the gate covers all of them.

     Written down rather than acted on: rewriting laboratories on a measurement
     whose meaning is exactly what is undeclared would be the wrong order. */
  ['atlas.still_views', 'api/liveness.json records views that recompute no geometry and move no bodies between frames, and nothing declares which of them are diagrams by design and which are laboratories that stopped computing; without such a declaration the liveness gate can only be derived for the laboratories that publish stations'],
  /* ── FOUND BY SWEEPING EVERY DECLARED INPUT OF EVERY INSTRUMENT ────────────
     Three findings, kept apart because they are three different states of not
     knowing, and collapsing them would be the failure the measurement exists to
     avoid. None of them accuses a laboratory of being wrong: each names something
     the atlas cannot currently distinguish, which is a gap in what a laboratory is
     able to DECLARE about itself rather than in what it computes. */
  ['atlas.dead_inputs', 'api/sensitivity.json records declared numeric inputs across whose entire declared domain no declared output of the same instrument responds, with every other input at its default; nothing distinguishes an input the laboratory genuinely does not use from one whose effect never reaches a declared output, or from one that matters only in combination with another input the one-at-a-time sweep holds fixed'],
  ['atlas.unevaluable_domains', 'api/sensitivity.json records declared input domains at some value of which the instrument does not return within twenty seconds; a declared domain ought to be a domain the instrument can be evaluated on, and nothing in the declaration says which values are affordable, so a reader or an agent driving the API cannot tell a slow call from one that will not come back'],
  ['atlas.wholly_refused_inputs', 'api/sensitivity.json records declared inputs every value of which is refused when the other inputs sit at their declared defaults; the domains are individually legal and jointly unreachable, and nothing declares the constraint between them that makes them so'],
  ['atlas.counterfactuals_are_one_hop', 'HCC_API.bus.counterfactual can now drive a road the atlas did not take: an admissible-but-refused coupling is appended to the link table, swept like any declared one, and removed in a finally with the path cache invalidated on both sides. For the photometer it answered that the choice of authority never mattered to the exponent — all three give exactly 1.0000, because a flux is linear in a luminosity — and mattered only to the window, twelve decades from an accretion disk against eight and a half from a supernova. What it cannot do is a counterfactual PATH: it drives one hop, and a multi-hop route whose first link is the contested one would need the route enumeration rebuilt around a link that does not exist, which is a larger change than appending one row'],
  ['atlas.a_laboratory_is_four_places_not_one', 'ten of the fourteen registries a laboratory used to be written into now come from LAB_DECLARATIONS, and a clause checks that the fold reaches each one. Four remain and they are code rather than data: a scene group, a setup function, an update call and a control panel. A declaration cannot carry those, and a table pretending to would be a worse lie than the duplication — but nothing yet enumerates them either, so a laboratory with a declaration and no update call is registered everywhere, catalogued, translated, and invisible. The liveness walk would catch it; nothing at declaration time would'],
  ['atlas.the_window_rule_is_permissive', 'a chain that is not a power law now carries the widest range over which it is one, and the rule that decides that range is |drift| <= |slope| — the same rule the verdict uses, which is why it is not tighter. It is permissive. For the white-dwarf radius the widest window it admits runs to nine tenths of a solar mass, well into where relativistic corrections are already biting, and returns -0.447 where non-relativistic degeneracy gives -1/3 and the low-third fit gives -0.3606. The window answers how far a single exponent can be stretched before this atlas stops calling it one, which is not the same question as where the physics changes, and nothing here measures the second. A tighter rule would land closer to the physics and would call fewer things laws everywhere else; the trade is stated and not made'],
  ['atlas.extractor_parse_was_silently_wrong', 'scripts/extract-kernels.mjs read `return /^https?:/.test(x)` as a DIVISION, because its regex-or-division heuristic looks at one character and the character before that slash is the n of return. A phantom regex then swallowed four lines including an `if(...){`, the brace was never counted, and the parser\'s depth went to -1 and never recovered — so every declaration in the last ten thousand lines of index.html was invisible to extraction, and naming one as a root reported that it is not a top-level declaration: a true sentence about the parse and a false one about the file. Keywords are read as words now and the balance is checked at the line where it breaks. What stays open is that this parser is a heuristic at all: it is not a JavaScript parser, and the next construct it misreads will be found the same way this one was, by someone being told a function that is plainly there does not exist'],
  ['atlas.diagnostics_declare_no_cost', 'the Reeb station\'s linking number is a 512x512 Gauss double integral, and the operational-forecast audit was paying it 128 times per laboratory — pfInverseRoots scans the control at 128 points and bisects each bracket, building the whole diagnostics object every time to read ONE cheap number out of it. Making that one field lazy took pspGauss from 1449 ms to 52 ms of boot self time. The fault is not fixed, only one instance of it is: no laboratory DECLARES which of its outputs are expensive, so nothing distinguishes a solver that reads one arithmetic field from one that reads a quadrature, and the next expensive field added to any diagnostics object will be paid for by every caller that never looks at it'],
  ['atlas.reader_mode_clause_share', 'the boot suite now has two tiers and scripts/selftest.mjs holds reader mode to a 4.5 s budget and a 60 per cent floor on the assertions it keeps, but the floor is a stated number rather than a measured property: nothing checks that the clauses reader mode KEEPS are the ones whose subject is the document in front of the reader. A gate put around a cheap structural check would pass both bounds and would still be wrong'],
  ['atlas.numerical_controls', 'nothing in an instrument declaration distinguishes a PHYSICAL input from a NUMERICAL one — an integration step, a sample count, a tolerance — so api/reach.json cannot tell a chain that carries a dependence from one that carries a discretisation error, and lists ns.step alongside a black-hole mass; api/sensitivity.json can detect SATURATION at one end of a declared domain, which a converged numerical control shows, but so does a physical quantity whose response flattens, so saturation identifies candidates and cannot settle the question'],
  ['atlas.unconverged_solver_domains', 'api/sensitivity.json shows ns.step moving that laboratory outputs with a constant exponent and no saturation anywhere in its declared range, which says the integration has not converged at ANY step size the laboratory offers; a declared numerical domain ought to contain the region where refining it stops changing the answer, and nothing checks that it does'],
  /* ── ADDED AFTER THREE EXTERNAL RESULTS WERE REPORTED TO THE ATLAS ─────────
     Recorded as open problems rather than as achievements: each names something the atlas
     now knows it must discharge and has not. The external inputs themselves are logged in
     CIVP_EXTERNAL with their provenance, and none of them has been verified here. */
  ['civp.casimir_remainder', 'C_top is undischarged: the topology-sensitive Casimir remainder of ln(zeta_boundary^q T_q) has not been computed for the physical measure, so it is not known whether it moves the adjacent-sector crossing Z_{q+1}/Z_q = 1. Showing d(rho_vac) Lambda_eff = 0 controls only the constant part and is not sufficient'],
  ['civp.ultralocal_factorisation', 'T_q = prod_i T_i is NOT available in the general radiative sector: a bilocal kernel transporting shear along the null generators makes det(I+K) differ from prod_i (1+K_ii) by exactly the off-diagonal transport. Any use of the product form needs the shear sector restricted or the propagator diagonalised first, and neither is done here'],
  ['civp.damour_current', 'the vertical N_emb -> q_ind is not constructed. The minimal target is now concrete rather than abstract: quantise the weight-1 Damour constraint D_A to a current J_A-hat and transgress its central extension to c_1(det R pi_* L_q). The joint Raychaudhuri + Damour constraint algebra is not computed in the source either, so the coefficient matrix that would have to reproduce the determinant-line normalisation is unknown'],
  ['civp.shape_l01_externality', 'that the l = 0,1 shape modes are unobservable is external input, not derived here. The atlas proves only that the Hessian norm vanishes at l = 0,1']
]);
export const LABS = new Map([...IMPLEMENTED, ...stubs].map(l => [l.id, l]));
export const CORE = {
  schema: CORE_SCHEMA, version: CORE_VERSION, provenance: PROVENANCE,
  list() { return [...LABS.values()].map(l => { const d = l.describe();
    return { id: d.id, title: d.title, status: d.status, cost_hint: d.cost_hint,
      inputs: d.inputs.length, outputs: d.outputs.length }; }); },
  describe(id) { const l = LABS.get(id); if (!l) return null; return l.describe(); },
  run(id, input, ctx = {}) { const l = LABS.get(id);
    if (!l) throw Object.assign(new Error(`no laboratory "${id}"`), { code: 'NOT_FOUND' });
    return l.run(input, { ...ctx, provenance: PROVENANCE }); },
  sweep(id, input) { const l = LABS.get(id); if (!l) throw Object.assign(new Error('no such lab'), { code: 'NOT_FOUND' });
    return l.sweep(input, { provenance: PROVENANCE }); },
  validate(id) { const l = LABS.get(id); if (!l) throw Object.assign(new Error('no such lab'), { code: 'NOT_FOUND' });
    return l.validate({}, { provenance: PROVENANCE }); },
  export(id, result, format) { const l = LABS.get(id); return l.export(result, format); },
  openProblems() {
    /* the gaps the atlas has carried in prose for many versions, now machine-readable and
       served by the SAME function the build script writes to a file — the first version had
       the build script inject them, so the endpoint and the file disagreed by ten entries */
    const out = NAMED_OPEN_PROBLEMS.map(([lab_id, problem]) => ({ lab_id, status: STATUS.OPEN, problem }));
    for (const l of LABS.values()) { const d = l.describe();
      for (const p of d.open_problems || []) out.push({ lab_id: d.id, status: d.status, problem: p });
    }
    /* both halves of the provenance, as every other envelope here carries them: the commit
       says WHICH RUN answered, the code hash says WHAT CODE answered. Only the second one
       survives being written to a file — see the note in scripts/build-api.mjs. */
    return { schema: 'hcc.open-problems/1', core_version: CORE_VERSION,
      git_commit: PROVENANCE.commit, code_sha256: PROVENANCE.code_sha256,
      count: out.length, problems: out };
  }
};
