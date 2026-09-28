const STATUS_ENUM=['EXACT_MAP','NUMERICALLY_VERIFIED_MAP','CONDITIONAL_MAP','STRUCTURAL_ANALOGY','CANDIDATE_BRIDGE','REFUSED'];
const obj={type:'object'};

function needPhase(phase){
  for(const name of ['describe','probe','compare','bridges']) if(typeof phase?.[name]!=='function')
    throw new TypeError(`phase service must provide ${name}()`);
  return phase;
}

export function createPhaseTools(phase){
  needPhase(phase);
  return Object.freeze([
    Object.freeze({
      name:'describe_phase_space',
      description:'Return the canonical native-state phase-space contract for one supported laboratory, including time semantics, constraints, invariants, validity domain and epistemic status.',
      inputSchema:{type:'object',required:['lab_id'],properties:{lab_id:{type:'string'}},additionalProperties:false},
      call:a=>phase.describe(a.lab_id)
    }),
    Object.freeze({
      name:'probe_invariant',
      description:'Evaluate one declared invariant, balance law or constraint diagnostic in its native phase-space contract. Out-of-domain or ill-posed requests are returned as REFUSED, never substituted.',
      inputSchema:{type:'object',required:['lab_id','invariant_id'],properties:{lab_id:{type:'string'},invariant_id:{type:'string'},input:obj},additionalProperties:false},
      call:a=>phase.probe(a.lab_id,a.invariant_id,a.input||{})
    }),
    Object.freeze({
      name:'compare_phase_spaces',
      description:'Evaluate only registered phase-space bridges between two laboratories. Candidate similarity never becomes a canonical relation; missing or incompatible bridges return REFUSED.',
      inputSchema:{type:'object',required:['lab_a','lab_b'],properties:{lab_a:{type:'string'},lab_b:{type:'string'},input:obj},additionalProperties:false},
      call:a=>phase.compare(a.lab_a,a.lab_b,a.input||{})
    }),
    Object.freeze({
      name:'list_phase_bridges',
      description:'List canonical phase-space bridges. Noncanonical deterministic candidates are hidden unless include_candidates is explicitly true.',
      inputSchema:{type:'object',properties:{lab_a:{type:'string'},lab_b:{type:'string'},status:{type:'string',enum:STATUS_ENUM},include_candidates:{type:'boolean',default:false}},additionalProperties:false},
      call:a=>phase.bridges({labA:a.lab_a??null,labB:a.lab_b??null,status:a.status??null,includeCandidates:a.include_candidates===true})
    })
  ]);
}
