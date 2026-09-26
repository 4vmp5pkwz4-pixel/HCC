import { definePhaseSpace, defineInvariant, defineConstraint } from '../phase/contract.mjs';
import { phaseRefusal } from '../phase/refusals.mjs';
import {
  nsfMake, nsfResidualCurl, nsfExactMeans, nsfFacts,
  nsfStep, nsfUniform, nsfVelocity
} from '../atlas/extracted.mjs';

const UNIT_TOL = 1e-10;

function validateS3State(state) {
  if (!('q' in state)) return true;
  if (!Array.isArray(state.q) || state.q.length !== 4)
    return phaseRefusal('CONSTRAINT_VIOLATION', 'S3 native coordinate q must be a four-component quaternion', { coordinate: 'q' });
  const n2 = state.q.reduce((s, x) => s + x*x, 0);
  if (Math.abs(n2 - 1) > UNIT_TOL)
    return phaseRefusal('CONSTRAINT_VIOLATION', 'S3 native quaternion must satisfy |q| = 1', { coordinate: 'q', norm_squared: n2, tolerance: UNIT_TOL });
  return true;
}

export function navierStokesS3PhaseAdapter() {
  return definePhaseSpace({
    id: 'nsflow',
    title: 'Navier–Stokes / Euler flow on the round S³ carrier',
    carrier: { kind: 'round-S3-field', dimension: 'infinite/discretized', compact: true, topology: 'S3 conditional model carrier' },
    coordinates: [
      { id: 'q', type: 'array', role: 'native', quantity_kind: 'unit-quaternion-position', unit: null, dimension: '1' },
      { id: 'field', type: 'object', role: 'auxiliary', quantity_kind: 'velocity-field-parameters', unit: null, dimension: 'model' },
      { id: 't', type: 'number', role: 'native', quantity_kind: 'model-time', unit: 'solver-unit', dimension: 'T' }
    ],
    time: { kind: 'model-time', unit: 'solver-unit', orientation: 'forward' },
    dynamics: { kind: 'continuous', equation: 'existing nsf exact carried solution; adapter does not duplicate equations' },
    geometry: [{ kind: 'riemannian-round-S3' }, { kind: 'volume-form' }],
    constraints: [
      defineConstraint({ id: 'unit_quaternion', kind: 'normalization', status: 'exact-model-constraint', domain: '|q| = 1' }),
      defineConstraint({ id: 'divergence_free', kind: 'differential', status: 'numerically-verified/exact-construction', domain: 'declared nsf family' })
    ],
    invariants: [
      defineInvariant({
        id: 'tracer_s3_norm', kind: 'constraint', quantity_kind: 'unit-norm', unit: null, dimension: '1',
        evaluator: s => s.q.reduce((a,x)=>a+x*x,0), normalization: 1, tolerance: UNIT_TOL, coordinates: ['q'],
        status: 'exact-model-constraint', provenance: 'core/atlas/extracted.mjs: nsfStep normalization'
      }),
      defineInvariant({
        id: 'field_energy', kind: 'balance', direction: 'nonincreasing', quantity_kind: 'mean-square-shell-speed', unit: 'model-unit^2', dimension: 'L^2/T^2',
        evaluator: s => nsfExactMeans(s.field, s.t).shell, coordinates: ['field','t'],
        status: 'exact model balance law for the viscous shell; not a conserved invariant when nu > 0',
        provenance: 'core/atlas/extracted.mjs: nsfExactMeans'
      })
    ],
    projections: [],
    domain: { assumptions: ['round S3 model carrier', 'declared nsf exact carried family'], topology_claim: 'conditional reconstruction, not empirical topology detection' },
    epistemic: { status: 'derived/simulated', caveat: 'Exact within the declared round-S3 model family; not a solution of the Clay Millennium problem and not evidence that cosmic topology is S3.' },
    state_validator: validateS3State,
    adapter: Object.freeze({ make: nsfMake, residualCurl: nsfResidualCurl, exactMeans: nsfExactMeans, facts: nsfFacts, step: nsfStep, uniform: nsfUniform, velocity: nsfVelocity })
  });
}
