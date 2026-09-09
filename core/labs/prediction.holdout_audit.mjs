import {defineLab,sha256} from '../contract.mjs';
import {auditForecast,AUDIT_INPUT_SCHEMA} from '../prediction/forecast-audit.mjs';
const {$id: _id,...auditSchema}=AUDIT_INPUT_SCHEMA;

export default defineLab({
  id:'prediction.holdout_audit',title:'Chronological forecast audit',status:'NUMERICALLY_VERIFIED',
  strict_inputs:true,
  input_schema:{...auditSchema,required:auditSchema.required.filter(k=>k!=='schema')},
  model_id:'forecast.holdout.scoring.v1',
  summary:'Evaluate supplied forecasts against observations and a baseline with explicit chronology and horizon grouping. This scores predictions; it does not fit or authenticate them.',
  inputs:[
    {name:'schema',type:'string',unit:null,default:'hcc.forecast-evaluation-input/1'},
    {name:'model_id',type:'string',unit:null},
    {name:'dataset',type:'object',unit:null,schema:AUDIT_INPUT_SCHEMA.properties.dataset},
    {name:'records',type:'array',unit:null,schema:AUDIT_INPUT_SCHEMA.properties.records},
    {name:'nominal_coverage',type:'number',unit:'probability',optional:true,min:0,max:1}
  ],
  outputs:[{name:'audit',type:'object',unit:null,doc:'Complete holdout audit; MAE/RMSE/bias and interval score carry dataset.unit; skill and coverage are dimensionless.'}],
  assumptions:['Every row refers to the same target quantity and unit. Both model and baseline use only information available by training_end.',
    'Issue timestamps and dataset origin are supplied by the caller, not independently authenticated.'],
  domain_of_validity:['2..10000 finite records; UTC timestamps; training_end <= issued_at < target_at; paired forecasts and baselines.'],
  formulas:['error = predicted - actual','MAE = mean(abs(error))','RMSE = sqrt(mean(error^2))',
    'MSE skill = 1 - (RMSE / baseline_RMSE)^2; undefined when baseline error is zero',
    'interval score = upper-lower + 2/(1-coverage) * [max(lower-actual,0)+max(actual-upper,0)]'],
  verifiers:['test/forecast-audit.test.mjs'],
  falsifiers:['Hand-computable scores disagree; future data or missing observations are silently accepted.'],
  evaluate(input) {
    const audit=auditForecast(input);
    return {outputs:{audit},status:audit.status==='SYNTHETIC_ONLY'?'SYNTHETIC_ONLY':'NUMERICALLY_VERIFIED',
      diagnostics:{empirical_validation:false,input_sha256:sha256(JSON.stringify(input))},warnings:audit.limitations};
  },
  selftests:[{name:'chronology refuses future training data',run(lab){
    try {lab.run({model_id:'test',dataset:{id:'test',kind:'synthetic',source:'test',unit:'1'},records:[
      {training_end:'2026-01-04T00:00:00Z',issued_at:'2026-01-02T00:00:00Z',target_at:'2026-01-03T00:00:00Z',actual:1,predicted:1,baseline:1},
      {training_end:'2026-01-04T00:00:00Z',issued_at:'2026-01-02T00:00:00Z',target_at:'2026-01-04T00:00:00Z',actual:1,predicted:1,baseline:1}
    ]});return {pass:false};}catch(e){return {pass:/chronology/.test(e.message),detail:e.message};}
  }}]
});
