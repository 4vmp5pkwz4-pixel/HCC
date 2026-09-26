import { assertFiniteNativeState } from './contract.mjs';
import { phaseRefusal } from './refusals.mjs';

const okState = (contract, state) => {
  const checked = assertFiniteNativeState(contract, state);
  return checked?.status === 'REFUSED' ? checked : null;
};

function displayOnlyDependency(contract, inv) {
  const roles = new Map((contract.coordinates || []).map(c => [c.id, c]));
  return (inv.coordinates || []).find(id => roles.get(id)?.scientific_eligible === false) || null;
}

function valueOf(inv, state) {
  if (typeof inv.evaluator !== 'function') return phaseRefusal('NO_EVALUATOR', `invariant "${inv.id}" has no evaluator`, { invariant_id: inv.id });
  const value = inv.evaluator(state);
  if (typeof value === 'number' && !Number.isFinite(value)) return phaseRefusal('NON_FINITE_DIAGNOSTIC', `invariant "${inv.id}" returned a non-finite value`, { value });
  return value;
}

function normResidual(raw, inv) {
  if (inv.normalization == null) return null;
  const s = typeof inv.normalization === 'function' ? inv.normalization() : Number(inv.normalization);
  if (!Number.isFinite(s) || s <= 0) return null;
  return Math.abs(raw) / s;
}

export function probeInvariant(contract, invariantId, sample = {}) {
  const inv = (contract.invariants || []).find(i => i.id === invariantId);
  if (!inv) return phaseRefusal('UNKNOWN_INVARIANT', `phase space "${contract.id}" has no invariant "${invariantId}"`, { lab_id: contract.id, invariant_id: invariantId });
  const display = displayOnlyDependency(contract, inv);
  if (display) return phaseRefusal('DISPLAY_ONLY_STATE', `invariant "${invariantId}" depends on display-only coordinate "${display}"`, { coordinate: display });

  for (const key of ['initialState','state','nextState']) if (sample[key] !== undefined) {
    const bad = okState(contract, sample[key]); if (bad) return bad;
  }

  const base = { status:'OK', lab_id:contract.id, invariant_id:inv.id, kind:inv.kind,
    classification: inv.kind === 'monotone' || inv.kind === 'balance' ? 'monotone' : inv.kind };

  if (sample.state && sample.vectorField !== undefined) {
    if (typeof inv.gradient !== 'function') return phaseRefusal('NO_GRADIENT', `invariant "${inv.id}" has no declared gradient`, { invariant_id: inv.id });
    const grad = inv.gradient(sample.state);
    const vf = typeof sample.vectorField === 'function' ? sample.vectorField(sample.state) : sample.vectorField;
    const keys = inv.coordinates?.length ? inv.coordinates : Object.keys(grad || {});
    let derivative = 0;
    for (const k of keys) derivative += Number(grad?.[k] || 0) * Number(vf?.[k] || 0);
    if (!Number.isFinite(derivative)) return phaseRefusal('NON_FINITE_DIAGNOSTIC', 'gradI·F is non-finite', { derivative });
    return Object.freeze({...base, derivative, raw_residual:Math.abs(derivative), normalized_residual:normResidual(derivative,inv)});
  }

  if (sample.state && sample.nextState) {
    const a=valueOf(inv,sample.state); if (a?.status==='REFUSED') return a;
    const b=valueOf(inv,sample.nextState); if (b?.status==='REFUSED') return b;
    const delta=b-a;
    return Object.freeze({...base, initial_value:a, value:b, delta, raw_residual:Math.abs(delta), normalized_residual:normResidual(delta,inv)});
  }

  if (sample.initialState && sample.state) {
    const a=valueOf(inv,sample.initialState); if (a?.status==='REFUSED') return a;
    const b=valueOf(inv,sample.state); if (b?.status==='REFUSED') return b;
    const delta=b-a;
    if (inv.kind === 'monotone' || inv.kind === 'balance') {
      const direction=inv.direction || 'nonincreasing';
      const tol=Number(inv.tolerance || 0);
      const satisfied=direction==='nondecreasing' ? delta>=-tol : direction==='strictly-decreasing' ? delta < -tol : delta<=tol;
      return Object.freeze({...base,initial_value:a,value:b,delta,satisfied,direction,raw_residual:satisfied?0:Math.abs(delta),normalized_residual:normResidual(satisfied?0:delta,inv)});
    }
    return Object.freeze({...base,initial_value:a,value:b,delta,raw_residual:Math.abs(delta),normalized_residual:normResidual(delta,inv)});
  }

  if (sample.state) {
    const v=valueOf(inv,sample.state); if (v?.status==='REFUSED') return v;
    return Object.freeze({...base,value:v});
  }

  return phaseRefusal('INSUFFICIENT_SAMPLE', `no supported sample form was supplied for invariant "${inv.id}"`, { invariant_id: inv.id });
}
