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
    'civp/cp1.mjs','civp/embadon.mjs','civp/jones.mjs','civp/selector.mjs',
    'civp/carrier.mjs','civp/closure.mjs','math/cmatrix.mjs',
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
const stubs = catalogue.map(L => {
  const covered = COVERED_BY.get(L.id) || [];
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
  ['bianchi.csv_reproducibility', 'docs/data/bianchi-ix-trajectories.csv is not byte-reproducible from its generator']
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
