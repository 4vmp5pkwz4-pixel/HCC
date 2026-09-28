import { definePhaseSpace, defineInvariant, defineConstraint } from '../phase/contract.mjs';
import {
  HOL_TAU, holWrap, holPt, holTransportPure, holBerryWilson,
  holQ, holQMul, holQInv, holQNorm, holQAxis, holQArray
} from '../atlas/extracted.mjs';

export function holonomyPhaseAdapter() {
  return definePhaseSpace({
    id: 'hol',
    title: 'Holonomy Observatory',
    carrier: { kind: 'closed-path-and-group-return', dimension: 'mixed', compact: 'mixed' },
    coordinates: [
      { id: 'theta', type: 'number', role: 'native', quantity_kind: 'polar-angle', unit: 'rad', dimension: '1' },
      { id: 'q', type: 'object', role: 'native', quantity_kind: 'SU2-element', unit: null, dimension: '1' }
    ],
    time: { kind: 'path-parameter', unit: 'rad', interval: [0, HOL_TAU] },
    dynamics: { kind: 'path-ordered-transport', return_map: true },
    geometry: [{ kind: 'levi-civita-connection' }, { kind: 'U1-connection' }, { kind: 'SU2-group' }],
    constraints: [defineConstraint({ id: 'su2_unit', kind: 'group-normalization', status: 'exact-by-construction' })],
    invariants: [
      defineInvariant({
        id: 'su2_norm', kind: 'constraint', quantity_kind: 'group-norm', unit: null, dimension: '1',
        evaluator: s => holQNorm(s.q), normalization: 1, tolerance: 1e-12, coordinates: ['q'],
        status: 'exact-by-construction', provenance: 'core/atlas/extracted.mjs: holQNorm'
      }),
      defineInvariant({
        id: 'closed_path_holonomy', kind: 'return', quantity_kind: 'holonomy-angle', unit: 'rad', dimension: '1',
        status: 'exact identity / numerical transport check', provenance: 'core/atlas/extracted.mjs: holTransportPure'
      }),
      defineInvariant({
        id: 'berry_wilson_phase', kind: 'return', quantity_kind: 'geometric-phase', unit: 'rad', dimension: '1',
        status: 'exact continuum identity with discrete Wilson-product evaluation', provenance: 'core/atlas/extracted.mjs: holBerryWilson'
      })
    ],
    projections: [],
    domain: { assumptions: ['closed paths and declared group/connection models'] },
    epistemic: { status: 'derived', caveat: 'The observatory compares mathematical holonomy structures; shared holonomy does not identify distinct physical systems.' },
    adapter: Object.freeze({
      wrap: holWrap, point: holPt, transport: holTransportPure, berryWilson: holBerryWilson,
      q: holQ, qMul: holQMul, qInv: holQInv, qNorm: holQNorm, qAxis: holQAxis, qArray: holQArray
    })
  });
}
