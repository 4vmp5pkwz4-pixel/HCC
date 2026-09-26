import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSharedReality } from '../core/reality/shared-reality.mjs';

const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));

const identity = read('version.json');
const agent = read('api/agent.json');
const invariants = read('api/invariants.json');
const openProblems = read('api/open-problems.json');
const kevalin = read('kevalin/manifest.json');
const reality = read('api/reality.json');

test('shared reality is derived from the current release rather than remembered by hand', () => {
  assert.deepEqual(reality, buildSharedReality({ identity, agent, invariants, openProblems, kevalin }));
  assert.equal(reality.version, identity.version);
  assert.equal(reality.build, identity.build);
  assert.equal(reality.snapshot.typed_instruments, invariants.counts.laboratories);
  assert.equal(reality.snapshot.laboratories_with_invariants, invariants.counts.found);
  assert.equal(reality.snapshot.exact_relations, invariants.counts.exact_relations);
  assert.equal(reality.snapshot.open_problems, openProblems.count);
});

test('every agent is explicitly pointed at the shared reality and continuity contract', () => {
  assert.equal(agent.resources.reality, './api/reality.json');
  assert.equal(kevalin.shared_reality, '/api/reality.json');
  assert.deepEqual(reality.evidence_priority, kevalin.evidence_priority);
  assert.equal(reality.continuity.private_chain_of_thought, 'does_not_persist');
});

test('scientific promotion cannot erase the boundary between an exact Atlas sector and an open general problem', () => {
  assert.equal(reality.claim_boundaries.navier_stokes_s3.atlas_scope, 'exact_nonstationary_solution_family_on_round_s3');
  assert.equal(reality.claim_boundaries.navier_stokes_s3.general_clay_solution, false);
  assert.equal(reality.claim_boundaries.invariant_census.theorem_outside_declared_domain, false);
  assert.equal(reality.claim_boundaries.trisphere.physical_universe_topology_evidence, false);
});

test('Millennium research uses one comparison grammar without claiming the problems are the same', () => {
  assert.deepEqual(reality.research_protocol.lenses, [
    'state_space',
    'flow_or_operator',
    'symmetry_group',
    'invariant_or_monotone',
    'spectrum_or_index',
    'compactness_or_escape',
    'critical_set_or_singularity',
    'certificate_and_provenance',
  ]);
  assert.equal(reality.research_protocol.cross_problem_identity_claim, false);
});
