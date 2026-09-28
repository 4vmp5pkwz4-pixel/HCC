import { UNDECLARED } from './contract.mjs';

const sortedUnique = xs => [...new Set(xs.filter(x => x !== undefined && x !== null && x !== UNDECLARED))].sort();

export function phaseFingerprint(contract) {
  const geometry = contract.geometry === UNDECLARED ? [] : Array.isArray(contract.geometry) ? contract.geometry : [contract.geometry];
  return Object.freeze({
    schema:'hcc.phase-fingerprint/1', id:contract.id,
    carrier_kind: typeof contract.carrier === 'object' ? contract.carrier.kind ?? UNDECLARED : contract.carrier,
    state_dimension: typeof contract.carrier === 'object' ? contract.carrier.dimension ?? UNDECLARED : UNDECLARED,
    dynamics_kind: typeof contract.dynamics === 'object' ? contract.dynamics.kind ?? UNDECLARED : contract.dynamics,
    time_kind: typeof contract.time === 'object' ? contract.time.kind ?? UNDECLARED : contract.time,
    geometry_kinds: sortedUnique(geometry.map(g => typeof g === 'string' ? g : g.kind)),
    invariant_kinds: sortedUnique((contract.invariants||[]).map(i=>i.kind)),
    invariant_quantity_kinds: sortedUnique((contract.invariants||[]).map(i=>i.quantity_kind)),
    constraint_kinds: sortedUnique((contract.constraints||[]).map(c=>c.kind)),
    compactness: typeof contract.carrier === 'object' ? contract.carrier.compact ?? UNDECLARED : UNDECLARED,
    reversible: typeof contract.dynamics === 'object' ? contract.dynamics.reversible ?? UNDECLARED : UNDECLARED,
    similarity_is_evidence:false
  });
}
