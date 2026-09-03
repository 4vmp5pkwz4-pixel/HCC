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
  ['atlas.observability_is_diffraction_only', 'the resolution laboratory puts a diffraction floor under every angle this atlas publishes, and diffraction is the only thing it models. No atmosphere, no seeing, no adaptive optics, no detector sampling, no photon noise and no exposure time — so an angle it calls resolvable may be unreachable for reasons this atlas cannot see, and the eye is already a worked example: 7 mm gives 19.8 arcsec by diffraction and human acuity is about 60, because the retina samples too coarsely to use the aperture it has. What is missing is the photon budget: whether enough light arrives in a plausible exposure. The photometry laboratory computes the flux and nothing joins the two, so the atlas can say an angle is above the floor and cannot say whether it is above the noise'],
  ['atlas.a_frame_is_configured_by_whoever_touched_it_last', 'a reader zooming out of the Solar System stopped at the Oort cloud because THREE separate things could decide the camera\'s far limit and none of them owned it: hccGo skipped entering a world whose name state.mode already carried, so the solar frame never declared its limits; stabilizeCamera then invented a ceiling of minDistance x 1e6 from a non-finite one, which for the Sun\'s collision radius is 131,701 AU; and a boot self-test that walks into an S3 laboratory restored the VIEW it changed but not the FRAME, leaving a solar reader with an S3 laboratory\'s 180 AU ceiling. All three are fixed and a late clause now asserts the promise — the frame you stand in must reach the distance where the next one takes over. What is not fixed is the shape: the limits are still set by whoever calls setControlDistanceLimits last, from fourteen call sites, with no owner and no record of who decided'],
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
  ['atlas.the_house_generator_is_biased', 'the photon station drew Poisson counts from the linear congruential generator this atlas uses in a dozen places — seed = (seed*1103515245 + 12345) & 0x7fffffff — and the drawn mean came out 12.8 sigma low at lambda = 12 and 21.4 sigma low at lambda = 25, because Knuth\'s method multiplies a run of uniforms together and the low bits of an LCG are not independent enough to survive that product. That station uses mulberry32 now and checks itself. What is NOT fixed is everywhere else: the same recurrence still seeds asteroid belts, star fields, sampled walks and at least one self-test, and none of those draws is checked against the distribution it is supposed to have. A generator good enough to scatter points is not good enough to be measured, and nothing here records which of the two each use needs'],
  ['atlas.a_rule_is_only_tested_where_it_wins', 'the equation of state splits its Fermi-Dirac quadrature at the edge of the Fermi surface, and I wrote into the laboratory that a uniform grid of the same size comes out half a per cent low. It does not. Solved end to end each on its own grid, a uniform rule at the same 840 nodes is accurate to three parts in ten million; the half per cent I measured came from pairing a degeneracy parameter solved on one grid with a pressure evaluated on another, which is a mistake of mine and not of Simpson`s. The split does earn its place — thousands of times better at the degenerate states — and at a THIRD of the budget it is worse than the rule it replaces, which is now checked too. What stays open is the general case: every numerical choice in this atlas is justified by a comparison at the setting it was tuned at, and nothing sweeps the setting to find where the choice inverts. A rule tested only where it wins has not been tested'],
  ['atlas.a_unit_label_is_not_a_unit_check', 'the timescale laboratory published a doubling time in YEARS that had been multiplied by the number of seconds in a year: M/Mdot with a mass in solar masses and a rate in solar masses per year is already in years, and converting it again hid a factor of thirty million behind an expression that reads correctly. It was caught by a self-test asserting that a hundred million solar masses eating one a year doubles in a hundred million years, not by anything structural. NOTHING IN THIS ATLAS CHECKS THAT AN OUTPUT`S VALUE IS IN THE UNIT ITS DECLARATION NAMES. The quantity bus checks that two declarations agree with each other, which is a different thing entirely: two laboratories that are both wrong by the same factor couple happily, and the transfer sweep measures a slope that is right while the magnitude is not. Every unit label here is a promise nobody verifies'],
  ['atlas.a_dimension_can_be_published_and_never_routed', 'for ninety-five releases this atlas published five solid angles, six magnitudes and two arcseconds, and no instrument consumed any of them: an entire per-solid-angle dimension existed in the outputs and in no input, and nothing reported that. The unit census that finds this is a script somebody runs by hand while writing a laboratory, not a gate — api/manifest.json publishes the isolated INSTRUMENTS and never the isolated UNITS, so a quantity every laboratory can produce and none can take is invisible to every check here. Surface brightness closed this one. The general fault is open: nothing measures the supply and demand of the atlas`s own units, and the next orphan dimension will be found the same way this one was, by a person looking'],
  ['atlas.the_fold_reaches_only_where_someone_spread_it', 'LAB_DECLARATIONS was built so that a laboratory is declared once and every registry reads it, and it works exactly as far as somebody remembered to write the spread. The astro rows of PREMIUM_VIEW_DOMAINS and NEXUS_CLUSTERS carried labDeclIn and the quantum rows did not, so the first declared laboratory outside the astro cluster landed in no visual domain and no cluster at all, and five separate clauses reported it at once. The fold`s own check verifies that every DECLARED laboratory reaches ten registries; it cannot verify that a registry not yet spread into would have accepted one, because until a declaration lands outside the cluster somebody happened to test with, the gap is invisible. Two spreads were added. The category key was wrong in the same edit for a different reason — the declaration said quantum where the rendered registry says quant — and nothing relates the two vocabularies either'],
  ['atlas.a_ratio_past_the_mantissa_is_not_a_measurement', 'the frequency-coincidence census decides commensurability from the fractional part of a ratio, and above 2^53 every double IS an integer, so the fractional part comes back as exactly zero and the census called the pair commensurate. Adding an information bound of order 1e50 beside a phonon at 1e13 produced thirty-four spurious commensurabilities in one release. Such pairs are refused as unresolvable now and counted separately. What stays open is the class: this atlas spans forty-one decades of length and a hundred and twenty of information, and EVERY comparison it makes between two quantities from opposite ends of that range is one subtraction away from the same fault. Nothing audits the atlas`s own arithmetic for range, and the next instance will be found the way this one was — by a number arriving that is further from its neighbours than a double can carry a fraction'],
  ['atlas.a_check_can_test_the_fix_instead_of_the_fault', 'a reader reported that the dropdown lists close without letting you choose. I found a real defect — the panel rebuilds by innerHTML and a rebuild while a list is open destroys it — deferred buildCtl while a select holds focus, wrote a check that a focused select survives a buildCtl, watched it pass, and shipped. The lists still closed. The rebuild that kills the popup does not arrive through buildCtl at all: the panel DEFERS renders while a control is held and FLUSHES them on pointerup, and for a select pointerup is when the popup OPENS, not when the interaction ends. The check I wrote exercised the fix I had made rather than the fault the reader hit, so it could not have failed for the reason it existed. It is now driven through the real path — pointerdown, a render queued behind it, pointerup — and was watched going red with the fix reverted. What stays open is the class: this suite has nine hundred and fifty assertions and nothing distinguishes one that reproduces a reported failure from one that restates an implementation, and a check of the second kind is worth nothing at the moment it matters most'],
  ['atlas.a_regex_over_this_atlas_reads_prose_too', 'the kernel-extraction check greps the extracted module for browser globals, and it has now been wrong twice in opposite directions. First it matched the bare word and failed on the string `stop = window` written as a literal; tightened to require a dereference, it failed on the sentence `twice the window. It is published so...` inside a doc string, where the full stop after the word is punctuation and not a property access. It now strips string literals, template literals and comments before grepping, and that is proven both ways -- it no longer fires on the prose, and it still catches a real window., document., requestAnimationFrame( and new MutationObserver. What is NOT fixed is the general case. This atlas is written as long English inside string literals, and every other check that greps a source file is exposed to the same confusion; the fix was applied to the one check that failed, and nothing surveys the rest. A regular expression cannot tell code from prose, and this file is mostly prose'],
  ['atlas.a_field_named_unit_that_holds_prose', 'ATLAS_BUS.pub(key, value, unit) names its third parameter `unit`, and across roughly two hundred call sites that parameter holds `cos(theta/2)`, `to E2`, `recede`, `1-Tc/Th`, `l(l+1)` and `x Phi_0` as often as it holds J or rad or W. It is a display caption -- what to print after the number -- and it is named as though it were a dimension. That naming is why the invariant thread could put a Lyapunov exponent per unit time beside one per iteration for as long as it did: anything reading the bus for units would have been reading prose, so nothing read it, so nothing checked. The thread now declares its own units per row and the boot assertion measures those, which fixes the thread and not the bus. Renaming the parameter is a four-consumer change and was not made, because the honest name is neither `unit` nor `caption`: the field is a unit where one exists and a caption where none does, and the atlas has no way to say which it is on any given call'],
  ['atlas.the_name_trap_caught_the_next_laboratory_it_was_written_about', 'the open problem above was filed when the predictability horizon declared inputs called `steps` and `tolerance` and the bus proposed three meaningless couplings. It closed by saying nothing stops the next laboratory from calling an input `n` or `count` or `eps`. The next laboratory was the clock exchange, written in the same session by the same hand with that paragraph already on the page, and it declared an input called `neighbours` -- whereupon the bus proposed a coupling from the 600-cell, whose vertices have neighbours too. One laboratory, and the prediction came true; it was renamed to `fit_window`. And then a THIRD time, in the release immediately after the base rate below was measured and published: the cosmological-constant laboratory declared an output called `radius_ratio` and the bus proposed a coupling into an accretion disk`s radius ratio. Three laboratories, three collisions, every one of them written by somebody who had just finished writing about the hazard. What is now known that was not then is the SIZE of the hazard rather than its existence -- a third of the bus, wrong twice as often -- and that no filter can be built because the correct dimensionless couplings outnumber any rule that would exclude the wrong ones. So this stays open as a discipline and not as a defect: every proposal must be answered in writing, and the only thing that has ever caught one of these is somebody reading it'],
  ['atlas.a_generic_name_and_no_unit_is_not_a_coordinate', 'the quantity bus admits a coupling when the unit string agrees AND the coordinate name agrees, and where the unit is dimensionless the first condition is vacuous: the name carries the whole proposal. That was filed twice as a prediction and is now MEASURED. Thirty-one of eighty-three admissible candidates rest on a name alone and eighteen of them are refused -- fifty-eight per cent -- against twenty-nine per cent for the fifty-two that carry a dimension. Exactly twice as wrong. Fifty input and output names in this atlas are used by three or more laboratories and a dozen of those are single letters. What the measurement also settled is that NO MECHANICAL RULE FIXES IT, which is why none was built: refusing dimensionless proposals would break thirteen correct and load-bearing couplings, among them the mixmaster anisotropies into three laboratories; refusing generic names would not help, because `redshift` is as specific as a name gets and is refused twice. The decisive case is a name admissible into two laboratories where one coupling is declared and the other refused -- same output, same name, same absent unit, different answer -- and what separates them is physics. The base rate is published in the manifest and the written refusal is the only thing doing the work'],
  ['atlas.moving_a_focused_control_is_a_blur', 'the dropdown lists took three attempts because each fix reached a different link of one chain and none of them reached the first. The panel`s accordion WRAPS every section by relocating its children into a body div, and the phone layout REORDERS sections by re-appending them through a fragment; both re-parent nodes, and moving a focused element blurs it. The blur releases the render the panel was holding, the release rebuilds the panel, and the rebuild destroys the element the open popup belonged to. Chrome names the mechanism in as many words when the following removal fails — Perhaps it was moved in a blur event handler? — and I had read that message twice before understanding it. Both movers are guarded now and the invariant is checked against every one of the ten functions that touch this panel. What stays open is that the invariant is enforced one caller at a time: nothing prevents an eleventh from re-parenting a focused control, and the guard is a habit each of them has to remember rather than a property of the panel'],
  ['atlas.a_second_authority_that_was_wrong_first', 'the doctrine of this atlas is two authorities for one fact, and the exoplanet laboratory is the first case where the SECOND one was the one that was wrong. The independent verifier computed the four Kopparapu habitable-zone bounds as sqrt(L / S_eff) where the atlas computes bound_AU * sqrt(L / L_sun), and the two forms are not the same thing: the four numbers 0.75, 0.97, 1.70 and 1.77 are DISTANCES in astronomical units for a star of one solar luminosity, and their reciprocal squares are the effective fluxes. Dividing by them instead of multiplying put the early-Mars bound INSIDE the recent-Venus one, which inverts the zone and is not visibly absurd in a single printed number -- it took the disagreement with the atlas to expose it. What was learned is that a second authority is a DISAGREEMENT DETECTOR and not a referee: it says the two differ and it never says which is right, and the only thing that settled it was working the physics a third time by hand. The boot assertion now checks the ORDER of the four bounds rather than their values, because an inverted zone passes every check written on magnitudes alone. What stays open is that this atlas has roughly forty independent verifiers and no measurement of how many of THEM are wrong in a way that happens to agree with the code they check -- an error made twice by the same hand agrees with itself, and nothing here would notice'],
  ['atlas.a_threshold_check_tolerates_a_factor_of_root_two', 'the holographic census asks whether each holder on the information rail sits near its own bound, and "near" is written as occupancy greater than one half. Occupancy goes as one over R squared, so that check tolerates a radius wrong by a factor of 1.41 in either direction before it notices anything: dropping the 2 from the Schwarzschild radius quarters the bound and moves the black hole from 0.99 of it to 3.96, which is still "near the bound" to any comparison and is caught only by the separate EQUALITY that the black hole sits on its own bound to twelve figures. The equality was nearly worthless as written, because it first computed the radius itself instead of asking ilHolderRadius -- the function the rail is actually drawn with -- so a wrong radius in the drawing would have passed a check that recomputed the right one beside it. That is fixed. What stays open is general: this atlas is full of checks written as comparisons against a threshold, and for any quantity that depends on its input to a power the tolerated error is the threshold taken to one over that power. No inventory exists of which thresholds those are, and a threshold at one half on an inverse-square quantity is a forty per cent tolerance that nothing about the code says out loud'],
  ['atlas.a_display_path_that_answered_a_measurement', 'the resolution laboratory paints its Airy field through min(1,I) and a display gamma, which is correct for a texture that cannot show more than white, and the first version of its dip measurement called the SAME function. The clamp is quietly optimistic about contrast -- nearly four points low where it is worst, and flatly zero at 0.80 Rayleigh limits where the dip is 0.54 per cent -- but that is not the damage worth recording. Bisecting the Sparrow limit through the clamped profile returns 0.300, which is the bottom of the search bracket, because a clamped profile has an EXACTLY flat top whose second derivative is zero rather than negative, so the split test never fires and the bisection walks to its own edge and reports it with every appearance of having converged. A wrong number that looks like a measurement is worse than a missing one, and nothing about the shape of the code said which of the two callers was entitled to the clamp. What stays open is that this atlas has no general separation between a display path and a measurement path: dozens of stations clamp, gamma-correct, quantise to a texel grid or round for a label, and any of those functions can be called by something that wants the physics. No check here distinguishes the two kinds of caller, and the one case that was caught was caught because a bisection collapsed loudly rather than because anything was watching. AND THE OBVIOUS INSTRUMENT FOR IT DOES NOT WORK, which was measured rather than supposed: a census over the 1193 extracted declarations looking for display OPERATIONS -- a clamp to one, a clamp to 255, a rounding, a fractional exponent read as a display gamma -- returns 48 hits of which almost none are the thing. Math.pow(m,0.8) is the mass-radius law of a main-sequence star and not a gamma; Math.min(1,(rs+rp)/a) is a transit probability that genuinely cannot exceed one; a rounding inside a Poisson draw is the discreteness of photons; and the depth-mapping functions it flags are display functions doing exactly what they should. The defect in the resolution laboratory was never that a clamp EXISTED, it was that a measurement CALLED a renderer -- a relation between two functions, not a property of either. So finding it mechanically needs a call graph that knows which sites are drawing and which are measuring, and the atlas has no such labelling; a census over operations will only ever produce a list that has to be read one entry at a time, which is the thing it was supposed to save'],
  ['atlas.the_same_digits_in_two_units', 'the Sparrow limit came out at 0.7766 and the number remembered from the textbooks was 0.947, which looked like a seventeen per cent error and was not an error at all: 0.7766 Rayleigh limits IS 0.9471 lambda over D, and the quoted 0.947 is in lambda/D. The same three digits name two different quantities in two units, and comparing them straight across manufactures a disagreement out of nothing. This is exactly the failure the quantity bus refuses couplings over -- a unit string that does not match means the two are not the same coordinate -- and the bus caught none of it, because neither number ever entered the bus: both lived inside one verifier as bare JavaScript numbers. What stays open is that the bus governs quantities that are PUBLISHED and has no reach into arithmetic, and most of the arithmetic in this atlas is bare numbers in local scope. A unit-carrying numeric type would have caught this at the comparison; there is none here, and no measurement of how many other constants in these verifiers are compared across a unit they do not share'],
  ['atlas.a_measured_constant_and_an_assembled_one', 'the exoplanet laboratory computes every orbit from the measured heliocentric GM and never from G times a solar mass, and the cost of the other route is measured rather than asserted: 257 parts per million in the product and 85 in the semi-major axis, which is thirteen thousand kilometres in the Earth`s orbit. The rule generalises and has NOT been applied across this atlas. Any laboratory that writes G * M where a gravitational parameter is measured directly is importing the twenty-two parts per million of G, and a search for that pattern has not been run. Where the answer is wanted to a per cent it does not matter and most of this atlas wants a per cent; where it does matter nothing currently flags it, and the general form of the check -- a constant that is measured as a product must not be reassembled from its factors -- has no mechanical enforcement here'],
  ['atlas.the_name_trap_fired_a_fourth_time_across_a_release_boundary', 'the three earlier collisions were all inside one laboratory: an input called `steps`, one called `neighbours`, an output called `radius_ratio`. The fourth is different in kind and worse. The galaxy laboratory shipped an input named `mass_to_light`, and it was RIGHT to: the thing it multiplies is a mass-to-light ratio, the name is descriptive, and nothing in the atlas collided with it. One release later the main-sequence laboratory published an output named `mass_to_light` -- also right, also descriptive -- and the two are a MULTIPLIER of 1 and an ABSOLUTE RATIO of 9.4 in solar units. The bus proposed the coupling on a shared name and a shared absence of units, and routing it would have multiplied a galaxy`s stellar mass by nine. What is new is that NEITHER NAME WAS BAD. The earlier three were caught by the rule "do not call an input `steps`"; this one defeats that rule entirely, because both names are the most accurate word available for what they hold and the collision is between two correct choices made a release apart. The refusal is written and the galaxy input is renamed to stellar_mass_multiplier, which is uglier and says what it is. What stays open is that no rule about naming could have prevented this: the atlas would need to know that two dimensionless quantities called the same true thing are a ratio and a multiplier of that ratio, and there is nowhere in the declaration format to say so. A `relative_to` field on dimensionless outputs is the obvious shape of a fix and it is not built. AND THE SAME RELEASE PRODUCED A FIFTH, which defeats that proposed fix as well: the main sequence publishes an eddington_ratio and so do the quasar and the accretion disk. Same name, same units, same formula character-for-character -- L over 4 pi G M c / kappa -- and the names are not generic, not lazy and not renameable, because eddington_ratio is the only correct word for any of them. What differs is the OBJECT: a star burning hydrogen at twenty-six parts per million of its limit, and matter falling onto a black hole at close to unity. No unit expresses that, no name expresses it when the name is right on both sides, and no declared domain expresses it because both values sit inside any plausible range for a fraction. Five collisions, and the fifth is the first that the declaration format could not have caught even in principle.'],
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
