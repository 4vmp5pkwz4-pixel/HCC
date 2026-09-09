/** Pure forecast scoring. No model fitting, network, rendering or data authentication.
 * Methods: https://otexts.com/fpp3/accuracy.html and /distaccuracy.html.
 * Errors use predicted - actual (positive bias means overprediction).
 */
const UTC_TIMESTAMP={type:'string',format:'date-time',pattern:'^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{3})?Z$'};
export const AUDIT_INPUT_SCHEMA = {
  $schema:'https://json-schema.org/draft/2020-12/schema',
  $id:'https://4vmp5pkwz4-pixel.github.io/HCC/api/forecast-audit.schema.json',
  title:'HCC chronological forecast evaluation',type:'object',additionalProperties:false,
  required:['schema','model_id','dataset','records'],
  allOf:[{
    if:{required:['records'],properties:{records:{contains:{anyOf:[{required:['lower']},{required:['upper']}]}}}},
    then:{required:['nominal_coverage'],properties:{records:{items:{required:['lower','upper']}}}},
    else:{not:{required:['nominal_coverage']}}
  }],
  properties:{
    schema:{const:'hcc.forecast-evaluation-input/1'},
    model_id:{type:'string',minLength:1,maxLength:500},
    dataset:{type:'object',additionalProperties:false,required:['id','kind','source','unit'],properties:{
      id:{type:'string',minLength:1,maxLength:500},kind:{enum:['observational','synthetic']},
      source:{type:'string',minLength:1,maxLength:2000},unit:{type:'string',minLength:1,maxLength:100}}},
    nominal_coverage:{type:'number',exclusiveMinimum:0,exclusiveMaximum:1},
    records:{type:'array',minItems:2,maxItems:10000,items:{type:'object',additionalProperties:false,
      required:['training_end','issued_at','target_at','actual','predicted','baseline'],
      dependentRequired:{lower:['upper'],upper:['lower']},
      properties:{
        training_end:{...UTC_TIMESTAMP,description:'Latest information available to BOTH model and baseline. UTC ISO timestamp.'},
        issued_at:{...UTC_TIMESTAMP,description:'Declared issue time. UTC ISO timestamp.'},
        target_at:{...UTC_TIMESTAMP,description:'Target observation time, strictly after issue time. UTC ISO timestamp.'},
        actual:{type:'number'},predicted:{type:'number'},baseline:{type:'number'},lower:{type:'number'},upper:{type:'number'}
      }}}
  }
};

function refuse(message) { const e=new Error(message); e.code='DOMAIN_ERROR'; throw e; }
function object(x,label,allowed) {
  if(!x || typeof x!=='object' || Array.isArray(x)) refuse(`${label} must be an object`);
  for(const key of Object.keys(x)) if(!allowed.includes(key)) refuse(`${label}: unknown field ${key}`);
}
function string(x,label,max=500) {
  if(typeof x!=='string' || !x.trim() || x.length>max) refuse(`${label} must be nonempty text of at most ${max} characters`);
}
function number(x,label) {
  if(typeof x!=='number' || !Number.isFinite(x)) refuse(`${label} must be a finite number`);
  return x;
}
function timestamp(x,label) {
  if(typeof x!=='string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(x))
    refuse(`${label}: timestamp must be UTC ISO 8601 with seconds (optional 3-digit milliseconds)`);
  const n=Date.parse(x);
  if(!Number.isFinite(n) || new Date(n).toISOString()!==x.replace(/(?<!\.\d{3})Z$/,'.000Z'))
    refuse(`${label}: invalid timestamp`);
  return n;
}
const mean = xs => xs.reduce((s,x)=>s+x/xs.length,0);
function rms(xs) {
  const scale=Math.max(...xs.map(Math.abs));
  return scale===0 ? 0 : scale*Math.sqrt(mean(xs.map(x=>(x/scale)**2)));
}
function metrics(rows) {
  const errors=rows.map(r=>r.error), base=rows.map(r=>r.baseline_error);
  const rmse=rms(errors), baseline=rms(base);
  const skill=baseline===0 ? null : 1-(rmse/baseline)**2;
  return {n:rows.length,mae:mean(errors.map(Math.abs)),rmse,bias:mean(errors),
    baseline_mae:mean(base.map(Math.abs)),baseline_rmse:baseline,
    mse_skill:Number.isFinite(skill)?skill:null,
    skill_reason:baseline===0?'ZERO_BASELINE_ERROR':!Number.isFinite(skill)?'NUMERIC_RANGE':null};
}
function intervalMetrics(rows,coverage) {
  if(coverage===null) return null;
  return {n:rows.length,nominal_coverage:coverage,coverage:mean(rows.map(r=>Number(r.covered))),
    mean_width:mean(rows.map(r=>r.width)),mean_interval_score:mean(rows.map(r=>r.interval_score)),
    interpretation:'Descriptive holdout coverage; no independence assumption or calibration guarantee.'};
}

export function auditForecast(input) {
  object(input,'input',['schema','model_id','dataset','records','nominal_coverage']);
  if(input.schema!=='hcc.forecast-evaluation-input/1') refuse('input schema must be hcc.forecast-evaluation-input/1');
  string(input.model_id,'model_id');
  const d=input.dataset;
  object(d,'dataset',['id','kind','source','unit']);
  string(d.id,'dataset.id'); string(d.source,'dataset.source',2000); string(d.unit,'dataset.unit',100);
  if(!['observational','synthetic'].includes(d.kind)) refuse('dataset.kind must be observational or synthetic');
  if(!Array.isArray(input.records) || input.records.length<2 || input.records.length>10000)
    refuse('records must contain 2 to 10000 forecasts');
  const hasIntervals=input.records.some(r=>r && ('lower' in Object(r) || 'upper' in Object(r)));
  let coverage=null;
  if(hasIntervals) {
    coverage=number(input.nominal_coverage,'nominal_coverage');
    if(coverage<=0 || coverage>=1) refuse('nominal_coverage must lie strictly between 0 and 1');
  } else if(input.nominal_coverage!==undefined) refuse('nominal_coverage requires prediction intervals on every row');
  const seen=new Set(),observations=new Map();
  const rows=input.records.map((r,i)=>{
    const label=`records[${i}]`;
    object(r,label,['training_end','issued_at','target_at','actual','predicted','baseline','lower','upper']);
    const train=timestamp(r.training_end,label+'.training_end');
    const issued=timestamp(r.issued_at,label+'.issued_at');
    const target=timestamp(r.target_at,label+'.target_at');
    if(train>issued || issued>=target) refuse(`${label}: chronology requires training_end <= issued_at < target_at`);
    const key=issued+':'+target;
    if(seen.has(key)) refuse(`${label}: duplicate forecast origin and target`);
    seen.add(key);
    for(const f of ['actual','predicted','baseline']) number(r[f],label+'.'+f);
    if(observations.has(target) && observations.get(target)!==r.actual)
      refuse(`${label}: inconsistent observation for the same target timestamp`);
    observations.set(target,r.actual);
    const error=number(r.predicted-r.actual,label+'.error');
    const baseline_error=number(r.baseline-r.actual,label+'.baseline_error');
    const row={...r,error,baseline_error,horizon_seconds:(target-issued)/1000};
    if(hasIntervals) {
      const low=number(r.lower,label+'.lower'),high=number(r.upper,label+'.upper');
      if(low>high) refuse(`${label}: interval lower must be <= upper`);
      row.width=number(high-low,label+'.interval_width');
      row.covered=r.actual>=low && r.actual<=high;
      row.interval_score=number(row.width+2/(1-coverage)*(Math.max(0,low-r.actual)+Math.max(0,r.actual-high)),label+'.interval_score');
    }
    return row;
  });
  const groups=new Map();
  for(const row of rows) {
    if(!groups.has(row.horizon_seconds)) groups.set(row.horizon_seconds,[]);
    groups.get(row.horizon_seconds).push(row);
  }
  return {schema:'hcc.forecast-evaluation/1',algorithm_version:'1.0.0',model_id:input.model_id,dataset:{...d},
    status:d.kind==='synthetic'?'SYNTHETIC_ONLY':'USER_SUPPLIED_HOLDOUT',empirical_validation:false,
    error_convention:'predicted - actual',metrics:metrics(rows),intervals:intervalMetrics(rows,coverage),
    by_horizon:[...groups].sort((a,b)=>a[0]-b[0]).map(([horizon_seconds,group])=>({horizon_seconds,
      metrics:metrics(group),intervals:intervalMetrics(group,coverage)})),
    chronology:{passed:true,rule:'training_end <= issued_at < target_at',basis:'USER_DECLARED_TIMESTAMPS'},
    limitations:[
      'Submitted timestamps, source labels and the absence of training leakage are not independently authenticated.',
      'Scores describe only these forecasts, this dataset, unit, baseline and stated horizons; they do not establish future performance.',
      'Aggregate metrics mix horizons. Use by_horizon for comparisons at a fixed prediction horizon.',
      'No statistical significance or independence claim is made. Small or dependent samples do not establish calibration.'
    ],
    methods:['https://otexts.com/fpp3/accuracy.html','https://otexts.com/fpp3/tscv.html','https://otexts.com/fpp3/distaccuracy.html'],rows};
}
