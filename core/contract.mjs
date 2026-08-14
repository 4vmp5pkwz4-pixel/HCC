import { createHash, randomUUID } from 'node:crypto';
import { CORE_VERSION, RESULT_SCHEMA } from './version.mjs';
import { STATUS } from './status.mjs';

/* ── THE ENVELOPE ────────────────────────────────────────────────────────────
   Every run returns the same shape, and the shape is the contract. A number without its
   units, its assumptions, its domain of validity and the commit that produced it is not a
   result — it is a rumour with a decimal point. */
export function makeResult({ lab, spec, inputs, outputs, seed = null, precision = 'float64',
  status, uncertainty = {}, covariance = null, residuals = null, diagnostics = {},
  warnings = [], artifacts = [], started, provenance }) {
  const t1 = Date.now();
  return {
    schema: RESULT_SCHEMA,
    run_id: randomUUID(),
    lab_id: lab,
    model_id: spec.model_id || lab,
    equation_ids: spec.equation_ids || [],
    status,
    core_version: CORE_VERSION,
    git_commit: provenance.commit,
    code_sha256: provenance.code_sha256,
    data_sha256: provenance.data_sha256 || null,
    inputs, input_units: unitsOf(spec.inputs),
    seed, precision,
    assumptions: spec.assumptions || [],
    domain_of_validity: spec.domain_of_validity || [],
    outputs, output_units: unitsOf(spec.outputs),
    uncertainty, covariance, residuals,
    diagnostics, warnings,
    verifiers: spec.verifiers || [],
    artifacts,
    started_at: new Date(started).toISOString(),
    finished_at: new Date(t1).toISOString(),
    duration_ms: t1 - started
  };
}
const unitsOf = defs => Object.fromEntries((defs || []).map(d => [d.name, d.unit ?? null]));

/* refuse, never clamp — the atlas's oldest rule, now enforced in one place */
export function coerceInputs(spec, raw = {}) {
  const out = {}, warnings = [];
  for (const d of spec.inputs || []) {
    let v = raw[d.name];
    if (v === undefined || v === null) {
      v = typeof d.default === 'function' ? d.default() : d.default;
      if (v === undefined) throw domainError(`missing required input "${d.name}"`, { input: d.name });
    }
    if (d.type === 'number') {
      v = Number(v);
      if (!Number.isFinite(v)) throw domainError(`input "${d.name}" must be a finite number`, { input: d.name, value: raw[d.name] });
      if (d.min !== undefined && v < d.min) throw domainError(`input "${d.name}" = ${v} is below the declared minimum ${d.min}; inputs are REFUSED, never clamped`, { input: d.name, value: v, min: d.min });
      if (d.max !== undefined && v > d.max) throw domainError(`input "${d.name}" = ${v} is above the declared maximum ${d.max}; inputs are REFUSED, never clamped`, { input: d.name, value: v, max: d.max });
    }
    if (d.type === 'string' && typeof v !== 'string') v = String(v);
    if (d.type === 'boolean') v = !!v;
    if (d.enum && !d.enum.includes(v)) throw domainError(`input "${d.name}" must be one of ${d.enum.join(', ')}`, { input: d.name, value: v });
    out[d.name] = v;
  }
  return { inputs: out, warnings };
}
export function domainError(message, detail = {}) {
  const e = new Error(message); e.code = 'DOMAIN_ERROR'; e.detail = detail; return e;
}
export function notImplemented(lab, reason, missing = []) {
  const e = new Error(reason); e.code = 'NOT_IMPLEMENTED';
  e.detail = { lab, missing }; return e;
}
export const sha256 = s => createHash('sha256').update(s).digest('hex');

/* ── THE UNIVERSAL SIX ───────────────────────────────────────────────────────
   describe · run · sweep · validate · export · cancel, identical for every laboratory,
   so an agent that can drive one can drive all of them. */
export function defineLab(spec) {
  const jsonSchema = defs => ({
    type: 'object', additionalProperties: false,
    required: (defs || []).filter(d => d.default === undefined).map(d => d.name),
    properties: Object.fromEntries((defs || []).map(d => [d.name, {
      type: d.type === 'number' ? 'number' : d.type === 'boolean' ? 'boolean' :
            d.type === 'array' ? 'array' : 'string',
      ...(d.min !== undefined ? { minimum: d.min } : {}),
      ...(d.max !== undefined ? { maximum: d.max } : {}),
      ...(d.enum ? { enum: d.enum } : {}),
      unit: d.unit ?? null,
      description: d.doc || ''
    }]))
  });
  return {
    id: spec.id,
    spec,
    describe() {
      return {
        id: spec.id, title: spec.title, status: spec.status,
        summary: spec.summary || '',
        model_id: spec.model_id || spec.id,
        equation_ids: spec.equation_ids || [],
        formulas: spec.formulas || [],
        inputs: (spec.inputs || []).map(d => ({ name: d.name, type: d.type, unit: d.unit ?? null,
          default: typeof d.default === 'function' ? d.default() : d.default,
          min: d.min, max: d.max, enum: d.enum, description: d.doc || '' })),
        outputs: (spec.outputs || []).map(d => ({ name: d.name, type: d.type || 'number',
          unit: d.unit ?? null, description: d.doc || '' })),
        input_schema: jsonSchema(spec.inputs),
        output_schema: jsonSchema(spec.outputs),
        assumptions: spec.assumptions || [],
        domain_of_validity: spec.domain_of_validity || [],
        falsifiers: spec.falsifiers || [],
        verifiers: spec.verifiers || [],
        open_problems: spec.open_problems || [],
        cost_hint: spec.cost_hint || 'fast'
      };
    },
    run(raw, ctx = {}) {
      const started = Date.now();
      if (spec.status === STATUS.NOT_IMPLEMENTED || spec.status === STATUS.OPEN)
        throw notImplemented(spec.id, spec.not_implemented_reason ||
          'this laboratory is catalogued but has no computational contract; no number is returned rather than a plausible one',
          spec.open_problems || []);
      const { inputs, warnings } = coerceInputs(spec, raw);
      const r = spec.evaluate(inputs, ctx) || {};
      return makeResult({ lab: spec.id, spec, inputs,
        outputs: r.outputs ?? r, seed: raw.seed ?? null,
        precision: raw.precision || 'float64',
        status: r.status || spec.status,
        uncertainty: r.uncertainty || {}, covariance: r.covariance || null,
        residuals: r.residuals || null, diagnostics: r.diagnostics || {},
        warnings: warnings.concat(r.warnings || []),
        artifacts: r.artifacts || [], started, provenance: ctx.provenance || {} });
    },
    sweep(raw, ctx = {}) {
      const { parameter, values, ...base } = raw || {};
      if (!parameter || !Array.isArray(values))
        throw domainError('sweep requires "parameter" and an array of "values"');
      if (values.length > 4096) throw domainError('sweep is capped at 4096 points');
      const rows = values.map(v => {
        try { const r = this.run({ ...base, [parameter]: v }, ctx);
          return { [parameter]: v, ok: true, outputs: r.outputs }; }
        catch (e) { return { [parameter]: v, ok: false, error: e.code || 'ERROR', message: e.message }; }
      });
      return { schema: 'hcc.sweep/1', lab_id: spec.id, parameter, n: rows.length, rows };
    },
    validate(raw, ctx = {}) {
      const checks = (spec.selftests || []).map(t => {
        try { return { name: t.name, ...t.run(this, ctx) }; }
        catch (e) { return { name: t.name, pass: false, detail: e.message }; }
      });
      return { schema: 'hcc.validation/1', lab_id: spec.id,
        passed: checks.filter(c => c.pass).length, total: checks.length,
        all_pass: checks.every(c => c.pass), checks };
    },
    export(result, format = 'json') {
      if (format === 'json') return { mime: 'application/json', body: JSON.stringify(result, null, 2) };
      if (format === 'csv') {
        const o = result.outputs || {};
        const flat = Object.entries(o).filter(([, v]) => typeof v === 'number' || typeof v === 'string');
        return { mime: 'text/csv',
          body: 'name,value,unit\n' + flat.map(([k, v]) =>
            `${k},${v},${(result.output_units || {})[k] ?? ''}`).join('\n') + '\n' };
      }
      throw domainError(`export format "${format}" is not available; this build offers json and csv`,
        { available: ['json', 'csv'] });
    }
  };
}
