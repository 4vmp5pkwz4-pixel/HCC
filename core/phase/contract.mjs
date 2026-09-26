import { phaseRefusal } from './refusals.mjs';

export const UNDECLARED = 'UNDECLARED';

const INV_KINDS = new Set(['exact','numeric','monotone','return','topological','group','constraint','balance','approximate','candidate']);
const COORD_ROLES = new Set(['native','derived','gauge','auxiliary','display-only']);

function needId(spec, what) {
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) throw new TypeError(`${what} must be an object`);
  if (typeof spec.id !== 'string' || !spec.id.trim()) throw new TypeError(`${what} id is required`);
  return spec.id.trim();
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const v of Object.values(value)) deepFreeze(v);
  return Object.freeze(value);
}

function unique(items, label) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.id)) throw new TypeError(`duplicate ${label} id "${item.id}"`);
    seen.add(item.id);
  }
}

function finite(value) {
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(finite);
  if (value && typeof value === 'object') return Object.values(value).every(finite);
  return true;
}

export function defineInvariant(spec) {
  const id = needId(spec, 'invariant');
  if (typeof spec.kind !== 'string' || !INV_KINDS.has(spec.kind))
    throw new TypeError(`invariant "${id}" kind must be one of ${[...INV_KINDS].join(', ')}`);
  return deepFreeze({
    ...spec, id,
    quantity_kind: spec.quantity_kind ?? UNDECLARED,
    unit: spec.unit ?? null,
    dimension: spec.dimension ?? UNDECLARED,
    codomain: spec.codomain ?? UNDECLARED,
    normalization: spec.normalization ?? null,
    status: spec.status ?? UNDECLARED,
    domain: spec.domain ?? UNDECLARED,
    tolerance: spec.tolerance ?? null,
    provenance: spec.provenance ?? UNDECLARED
  });
}

export function defineConstraint(spec) {
  const id = needId(spec, 'constraint');
  if (typeof spec.kind !== 'string' || !spec.kind.trim()) throw new TypeError(`constraint "${id}" type/kind is required`);
  return deepFreeze({ ...spec, id, status: spec.status ?? UNDECLARED, domain: spec.domain ?? UNDECLARED });
}

export function defineProjection(spec) {
  const id = needId(spec, 'projection');
  if (typeof spec.kind !== 'string' || !spec.kind.trim()) throw new TypeError(`projection "${id}" type/kind is required`);
  const scientific_eligible = spec.kind !== 'display-only' && spec.scientific_eligible !== false;
  return deepFreeze({ ...spec, id, scientific_eligible });
}

function defineCoordinate(spec) {
  const id = needId(spec, 'coordinate');
  if (typeof spec.type !== 'string' || !spec.type.trim()) throw new TypeError(`coordinate "${id}" type is required`);
  if (typeof spec.role !== 'string' || !COORD_ROLES.has(spec.role))
    throw new TypeError(`coordinate "${id}" role must be one of ${[...COORD_ROLES].join(', ')}`);
  return deepFreeze({
    ...spec, id,
    quantity_kind: spec.quantity_kind ?? UNDECLARED,
    unit: spec.unit ?? null,
    dimension: spec.dimension ?? UNDECLARED,
    scientific_eligible: spec.role !== 'display-only'
  });
}

export function definePhaseSpace(spec) {
  const id = needId(spec, 'phase space');
  const coordinates = (spec.coordinates || []).map(defineCoordinate);
  const invariants = (spec.invariants || []).map(x => x && Object.isFrozen(x) ? x : defineInvariant(x));
  const constraints = (spec.constraints || []).map(x => x && Object.isFrozen(x) ? x : defineConstraint(x));
  const projections = (spec.projections || []).map(x => x && Object.isFrozen(x) ? x : defineProjection(x));
  unique(coordinates, 'coordinate');
  unique(invariants, 'invariant');
  unique(constraints, 'constraint');
  unique(projections, 'projection');
  return deepFreeze({
    schema: 'hcc.phase-space-contract/1',
    id,
    title: spec.title || id,
    carrier: spec.carrier ?? UNDECLARED,
    coordinates,
    time: spec.time ?? UNDECLARED,
    dynamics: spec.dynamics ?? UNDECLARED,
    geometry: spec.geometry ?? UNDECLARED,
    constraints,
    invariants,
    projections,
    domain: spec.domain ?? UNDECLARED,
    epistemic: spec.epistemic ?? UNDECLARED,
    adapter: spec.adapter ?? null,
    metadata: spec.metadata ?? {}
  });
}

export function assertFiniteNativeState(contract, state) {
  if (!state || typeof state !== 'object' || Array.isArray(state))
    return phaseRefusal('INVALID_STATE', 'native state must be an object', { state });
  for (const coord of contract.coordinates || []) {
    if (!coord.scientific_eligible) continue;
    if (!(coord.id in state)) continue;
    if (!finite(state[coord.id]))
      return phaseRefusal('NON_FINITE_STATE', `native coordinate "${coord.id}" must be finite`, { coordinate: coord.id, value: state[coord.id] });
  }
  return state;
}
